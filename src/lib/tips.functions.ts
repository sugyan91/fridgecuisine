import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

/**
 * Start an embedded checkout to tip a chef.
 * Uses dynamic price_data so the sender chooses the amount.
 * Revenue split: 10% platform fee, 90% to chef.
 */
export const createTipCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        chefUsername: z.string().trim().min(1).max(80).toLowerCase(),
        amountCents: z.number().int().min(100).max(20000),
        message: z.string().trim().max(280).optional(),
        returnUrl: z.string().url(),
        environment: z.enum(["sandbox", "live"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: prof, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, username")
      .eq("username", data.chefUsername)
      .maybeSingle();
    if (profErr) throw new Error(profErr.message);
    if (!prof) throw new Error("Chef not found");
    if (prof.user_id === userId) throw new Error("You can't tip yourself");

    const gross = data.amountCents;
    const platformFee = Math.round(gross * 0.10);
    const chefNet = gross - platformFee;

    const { data: userResp } = await supabase.auth.getUser();
    const customerEmail = userResp?.user?.email ?? undefined;

    const stripe = createStripeClient(data.environment);
    const customerId = await resolveOrCreateCustomer(stripe, {
      email: customerEmail,
      userId,
    });

    const name = `Tip for ${prof.display_name || "@" + prof.username}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      customer: customerId,
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: gross,
            product_data: {
              name,
              metadata: { chef_user_id: prof.user_id as string },
            },
          },
        },
      ],
      payment_intent_data: {
        description: name,
        metadata: {
          userId,
          type: "tip",
          chef_user_id: prof.user_id as string,
          platform_fee_cents: String(platformFee),
          chef_net_cents: String(chefNet),
          ...(data.message ? { tip_message: data.message } : {}),
        },
      },
      metadata: {
        userId,
        type: "tip",
        chef_user_id: prof.user_id as string,
        platform_fee_cents: String(platformFee),
        chef_net_cents: String(chefNet),
        ...(data.message ? { tip_message: data.message } : {}),
      },
    } as any);

    const { error: insErr } = await supabaseAdmin.from("tips").insert({
      sender_user_id: userId,
      chef_user_id: prof.user_id as string,
      message: data.message ?? null,
      gross_cents: gross,
      platform_fee_cents: platformFee,
      chef_net_cents: chefNet,
      currency: "usd",
      stripe_checkout_session_id: session.id,
      status: "pending",
    });
    if (insErr && !insErr.message.includes("duplicate")) {
      console.error("Failed to insert tip pending row:", insErr);
    }

    return { clientSecret: session.client_secret ?? "" };
  });

export type ChefTipsSummary = {
  totalCount: number;
  totalNetCents: number;
  rangeCount: number;
  rangeNetCents: number;
  currency: string;
  recent: Array<{
    id: string;
    purchased_at: string;
    gross_cents: number;
    net_cents: number;
    currency: string;
    message: string | null;
    sender_name: string | null;
  }>;
};

/** Aggregated tips summary for the current chef (received). */
export const getMyTipsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ range: z.enum(["7d", "30d", "90d", "365d", "all"]).default("30d") }).parse(i),
  )
  .handler(async ({ data, context }): Promise<ChefTipsSummary> => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("tips")
      .select("id, purchased_at, created_at, gross_cents, chef_net_cents, currency, message, sender_user_id, status")
      .eq("chef_user_id", userId)
      .order("purchased_at", { ascending: false, nullsFirst: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const paid = (rows ?? []).filter((r) => r.status === "paid");
    const currency = (paid[0]?.currency ?? "usd").toLowerCase();

    let from: string | null = null;
    if (data.range !== "all") {
      const d = new Date();
      d.setDate(d.getDate() - ({ "7d": 7, "30d": 30, "90d": 90, "365d": 365 } as const)[data.range]);
      from = d.toISOString();
    }

    let totalCount = 0, totalNet = 0, rangeCount = 0, rangeNet = 0;
    for (const r of paid) {
      totalCount += 1;
      totalNet += r.chef_net_cents ?? 0;
      const t = r.purchased_at ?? r.created_at;
      if (!from || (t && t >= from)) {
        rangeCount += 1;
        rangeNet += r.chef_net_cents ?? 0;
      }
    }

    // Enrich recent senders
    const recentRows = paid.slice(0, 10);
    const senderIds = Array.from(new Set(recentRows.map((r) => r.sender_user_id).filter(Boolean) as string[]));
    const nameMap = new Map<string, string>();
    if (senderIds.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", senderIds);
      (profs ?? []).forEach((p) =>
        nameMap.set(p.user_id as string, (p.display_name as string) || (p.username as string) || "someone"),
      );
    }

    return {
      totalCount,
      totalNetCents: totalNet,
      rangeCount,
      rangeNetCents: rangeNet,
      currency,
      recent: recentRows.map((r) => ({
        id: r.id as string,
        purchased_at: (r.purchased_at ?? r.created_at) as string,
        gross_cents: r.gross_cents ?? 0,
        net_cents: r.chef_net_cents ?? 0,
        currency: (r.currency as string) ?? currency,
        message: (r.message as string) ?? null,
        sender_name: r.sender_user_id ? nameMap.get(r.sender_user_id as string) ?? null : null,
      })),
    };
  });
