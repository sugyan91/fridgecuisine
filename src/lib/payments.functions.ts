import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

function stripeErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { message?: string; raw?: { message?: string } };
    return e.raw?.message ?? e.message ?? "Stripe request failed";
  }
  return "Stripe request failed";
}

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

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    priceId: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const stripe = createStripeClient(data.environment);

    const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const { data: userResp } = await supabase.auth.getUser();
    const customerEmail = userResp?.user?.email ?? undefined;

    const customerId = await resolveOrCreateCustomer(stripe, {
      email: customerEmail,
      userId,
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      managed_payments: { enabled: true },
      customer: customerId,
      metadata: { userId },
      ...(isRecurring && { subscription_data: { metadata: { userId } } }),
    } as any);

    return session.client_secret;
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_customer_id) throw new Error("No subscription found");

    const stripe = createStripeClient(data.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id as string,
      ...(data.returnUrl && { return_url: data.returnUrl }),
    });
    return portal.url;
  });

/**
 * Cancel the current user's active subscription at the end of the current
 * billing period. The user retains access until `current_period_end`.
 */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ environment: z.enum(["sandbox", "live"]) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ canceled_at: string | null } | { error: string }> => {
    const { supabase, userId } = context;
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status, cancel_at_period_end")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_subscription_id) {
      return { error: "No active subscription found" };
    }
    if (sub.status === "canceled") {
      return { error: "Subscription is already canceled" };
    }
    try {
      const stripe = createStripeClient(data.environment);
      const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      const periodEnd = (updated as { current_period_end?: number | null }).current_period_end;
      return {
        canceled_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      };
    } catch (error) {
      return { error: stripeErrorMessage(error) };
    }
  });

/**
 * Undo a pending cancellation: re-enable auto-renewal on a subscription
 * that was set to `cancel_at_period_end: true` but hasn't ended yet.
 */
export const reactivateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ environment: z.enum(["sandbox", "live"]) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { supabase, userId } = context;
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_subscription_id) {
      return { error: "No subscription found" };
    }
    if (sub.status === "canceled") {
      return { error: "Subscription has already ended" };
    }
    try {
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
      return { ok: true };
    } catch (error) {
      return { error: stripeErrorMessage(error) };
    }
  });

/**
 * One-off embedded checkout for a per-chef paid recipe.
 * Uses dynamic price_data (each chef sets their own price_cents).
 * Stamps a pending row in recipe_purchases; webhook flips it to paid.
 * Revenue split: 30% platform fee, 70% to chef.
 */
export const createRecipePurchaseCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        recipeId: z.string().uuid(),
        returnUrl: z.string().url(),
        environment: z.enum(["sandbox", "live"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Already purchased?
    const { data: alreadyPaid } = await supabase.rpc("has_purchased_recipe", {
      _user_id: userId,
      _recipe_id: data.recipeId,
    });
    if (alreadyPaid) {
      return { clientSecret: null, alreadyPurchased: true as const };
    }

    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from("paid_recipes")
      .select("id, chef_user_id, title, price_cents, is_published")
      .eq("id", data.recipeId)
      .maybeSingle();
    if (recipeError) throw new Error(recipeError.message);
    if (!recipe || !recipe.is_published) throw new Error("Recipe not available");
    if (recipe.chef_user_id === userId) throw new Error("You own this recipe");

    const gross = recipe.price_cents;
    const platformFee = Math.round(gross * 0.30);
    const chefNet = gross - platformFee;

    const { data: userResp } = await supabase.auth.getUser();
    const customerEmail = userResp?.user?.email ?? undefined;

    const stripe = createStripeClient(data.environment);
    const customerId = await resolveOrCreateCustomer(stripe, {
      email: customerEmail,
      userId,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: data.returnUrl,
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: gross,
            product_data: {
              name: recipe.title,
              metadata: { paid_recipe_id: recipe.id },
            },
          },
        },
      ],
      payment_intent_data: {
        description: recipe.title,
        metadata: {
          userId,
          paid_recipe_id: recipe.id,
          chef_user_id: recipe.chef_user_id,
          platform_fee_cents: String(platformFee),
          chef_net_cents: String(chefNet),
        },
      },
      metadata: {
        userId,
        type: "recipe_purchase",
        paid_recipe_id: recipe.id,
        chef_user_id: recipe.chef_user_id,
        platform_fee_cents: String(platformFee),
        chef_net_cents: String(chefNet),
      },
    } as any);

    // Pre-insert pending purchase keyed on checkout session id (unique).
    const { error: insertError } = await supabaseAdmin.from("recipe_purchases").insert({
      buyer_user_id: userId,
      chef_user_id: recipe.chef_user_id,
      paid_recipe_id: recipe.id,
      stripe_checkout_session_id: session.id,
      gross_cents: gross,
      platform_fee_cents: platformFee,
      chef_net_cents: chefNet,
      currency: "usd",
      status: "pending",
    });
    if (insertError && !insertError.message.includes("duplicate")) {
      console.error("Failed to pre-insert recipe_purchase:", insertError);
    }

    return { clientSecret: session.client_secret ?? "", alreadyPurchased: false as const };
  });