import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

export type CookbookListItem = {
  id: string;
  chef_user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price_cents: number;
  recipe_count: number;
  author_name: string | null;
  author_username: string | null;
  author_avatar_url: string | null;
};

export type CookbookDetail = CookbookListItem & {
  is_published: boolean;
  recipes: Array<{
    id: string;
    title: string;
    cover_image_url: string | null;
    price_cents: number;
    position: number;
  }>;
};

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

async function enrichAuthors(chefIds: string[]) {
  if (chefIds.length === 0) return new Map<string, { name: string | null; username: string | null; avatar_url: string | null }>();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("user_id, display_name, username, avatar_url")
    .in("user_id", chefIds);
  return new Map(
    (data ?? []).map((p) => [
      p.user_id as string,
      {
        name: (p.display_name as string) || (p.username as string) || null,
        username: (p.username as string) || null,
        avatar_url: (p.avatar_url as string) || null,
      },
    ]),
  );
}

/** Public: list published cookbooks that are for sale (price > 0, published). */
export const listCookbooksForSale = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("cookbooks")
    .select("id, chef_user_id, title, description, cover_image_url, price_cents, created_at")
    .eq("is_published", true)
    .gt("price_cents", 0)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const ids = rows.map((r) => r.id as string);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: crs } = await supabaseAdmin
      .from("cookbook_recipes")
      .select("cookbook_id")
      .in("cookbook_id", ids);
    (crs ?? []).forEach((r) => counts.set(r.cookbook_id as string, (counts.get(r.cookbook_id as string) ?? 0) + 1));
  }
  const authors = await enrichAuthors(Array.from(new Set(rows.map((r) => r.chef_user_id as string))));
  return {
    cookbooks: rows.map<CookbookListItem>((r) => {
      const a = authors.get(r.chef_user_id as string);
      return {
        id: r.id as string,
        chef_user_id: r.chef_user_id as string,
        title: r.title as string,
        description: (r.description as string) ?? null,
        cover_image_url: (r.cover_image_url as string) ?? null,
        price_cents: (r.price_cents as number) ?? 0,
        recipe_count: counts.get(r.id as string) ?? 0,
        author_name: a?.name ?? null,
        author_username: a?.username ?? null,
        author_avatar_url: a?.avatar_url ?? null,
      };
    }),
  };
});

/** Public: single cookbook detail with its recipes (titles only for unpurchased). */
export const getCookbookDetail = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }): Promise<{ cookbook: CookbookDetail | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c, error } = await supabaseAdmin
      .from("cookbooks")
      .select("id, chef_user_id, title, description, cover_image_url, price_cents, is_published")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!c || !c.is_published) return { cookbook: null };

    const { data: links } = await supabaseAdmin
      .from("cookbook_recipes")
      .select("paid_recipe_id, position")
      .eq("cookbook_id", data.id)
      .order("position", { ascending: true });
    const recipeIds = (links ?? []).map((l) => l.paid_recipe_id as string);
    const posById = new Map<string, number>();
    (links ?? []).forEach((l) => posById.set(l.paid_recipe_id as string, (l.position as number) ?? 0));

    let recipes: CookbookDetail["recipes"] = [];
    if (recipeIds.length) {
      const { data: recs } = await supabaseAdmin
        .from("paid_recipes")
        .select("id, title, cover_image_url, price_cents")
        .in("id", recipeIds);
      recipes = (recs ?? []).map((r) => ({
        id: r.id as string,
        title: r.title as string,
        cover_image_url: (r.cover_image_url as string) ?? null,
        price_cents: (r.price_cents as number) ?? 0,
        position: posById.get(r.id as string) ?? 0,
      }));
      recipes.sort((a, b) => a.position - b.position);
    }

    const authors = await enrichAuthors([c.chef_user_id as string]);
    const a = authors.get(c.chef_user_id as string);

    return {
      cookbook: {
        id: c.id as string,
        chef_user_id: c.chef_user_id as string,
        title: c.title as string,
        description: (c.description as string) ?? null,
        cover_image_url: (c.cover_image_url as string) ?? null,
        price_cents: (c.price_cents as number) ?? 0,
        recipe_count: recipes.length,
        is_published: Boolean(c.is_published),
        author_name: a?.name ?? null,
        author_username: a?.username ?? null,
        author_avatar_url: a?.avatar_url ?? null,
        recipes,
      },
    };
  });

/** Buyer flow: start embedded checkout for a cookbook. */
export const createCookbookCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        cookbookId: z.string().uuid(),
        returnUrl: z.string().url(),
        environment: z.enum(["sandbox", "live"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: alreadyPaid } = await supabase.rpc("has_purchased_cookbook", {
      _user_id: userId,
      _cookbook_id: data.cookbookId,
    });
    if (alreadyPaid) {
      return { clientSecret: null, alreadyPurchased: true as const };
    }

    const { data: cb, error: cbErr } = await supabaseAdmin
      .from("cookbooks")
      .select("id, chef_user_id, title, price_cents, is_published")
      .eq("id", data.cookbookId)
      .maybeSingle();
    if (cbErr) throw new Error(cbErr.message);
    if (!cb || !cb.is_published) throw new Error("Cookbook not available");
    if (cb.chef_user_id === userId) throw new Error("You own this cookbook");
    const price = (cb.price_cents as number) ?? 0;
    if (price < 100) throw new Error("Cookbook is not for sale");

    const platformFee = Math.round(price * 0.30);
    const chefNet = price - platformFee;

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
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: price,
            product_data: {
              name: cb.title as string,
              metadata: { cookbook_id: cb.id as string },
            },
          },
        },
      ],
      payment_intent_data: {
        description: cb.title as string,
        metadata: {
          userId,
          type: "cookbook_purchase",
          cookbook_id: cb.id as string,
          chef_user_id: cb.chef_user_id as string,
          platform_fee_cents: String(platformFee),
          chef_net_cents: String(chefNet),
        },
      },
      metadata: {
        userId,
        type: "cookbook_purchase",
        cookbook_id: cb.id as string,
        chef_user_id: cb.chef_user_id as string,
        platform_fee_cents: String(platformFee),
        chef_net_cents: String(chefNet),
      },
    } as any);

    const { error: insertError } = await supabaseAdmin.from("recipe_purchases").insert({
      buyer_user_id: userId,
      chef_user_id: cb.chef_user_id as string,
      cookbook_id: cb.id as string,
      stripe_checkout_session_id: session.id,
      gross_cents: price,
      platform_fee_cents: platformFee,
      chef_net_cents: chefNet,
      currency: "usd",
      status: "pending",
    });
    if (insertError && !insertError.message.includes("duplicate")) {
      console.error("Failed to pre-insert cookbook purchase:", insertError);
    }

    return { clientSecret: session.client_secret ?? "", alreadyPurchased: false as const };
  });

/** Chef: list their own cookbooks (any status). */
export const listMyCookbooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("cookbooks")
      .select("id, title, description, cover_image_url, price_cents, is_published, created_at")
      .eq("chef_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: data ?? [] };
  });

const cookbookInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1500).optional().nullable(),
  cover_image_url: z.string().url().max(800).optional().nullable(),
  price_cents: z.number().int().min(0).max(50000),
  is_published: z.boolean().default(true),
});

/** Chef: create or update one of their cookbooks. */
export const upsertCookbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => cookbookInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.id) {
      const { data: row, error } = await supabase
        .from("cookbooks")
        .update({
          title: data.title,
          description: data.description ?? null,
          cover_image_url: data.cover_image_url ?? null,
          price_cents: data.price_cents,
          is_published: data.is_published,
        })
        .eq("id", data.id)
        .eq("chef_user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { row };
    }
    const { data: row, error } = await supabase
      .from("cookbooks")
      .insert({
        chef_user_id: userId,
        title: data.title,
        description: data.description ?? null,
        cover_image_url: data.cover_image_url ?? null,
        price_cents: data.price_cents,
        is_published: data.is_published,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { row };
  });

export const deleteCookbook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("cookbooks").delete().eq("id", data.id).eq("chef_user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Chef: list their own paid recipes + which are already in a cookbook. */
export const listCookbookAddableRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ cookbookId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Ownership check.
    const { data: cb, error: cbErr } = await supabase
      .from("cookbooks")
      .select("id, chef_user_id")
      .eq("id", data.cookbookId)
      .maybeSingle();
    if (cbErr) throw new Error(cbErr.message);
    if (!cb || cb.chef_user_id !== userId) throw new Error("Not your cookbook");

    const [{ data: recs }, { data: links }] = await Promise.all([
      supabase
        .from("paid_recipes")
        .select("id, title, cover_image_url, price_cents, is_published")
        .eq("chef_user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("cookbook_recipes")
        .select("paid_recipe_id, position")
        .eq("cookbook_id", data.cookbookId)
        .order("position", { ascending: true }),
    ]);
    const linkedIds = new Set((links ?? []).map((l) => l.paid_recipe_id as string));
    return {
      recipes: (recs ?? []).map((r) => ({
        ...r,
        included: linkedIds.has(r.id as string),
      })),
      links: links ?? [],
    };
  });

export const setCookbookRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        cookbookId: z.string().uuid(),
        recipeId: z.string().uuid(),
        included: z.boolean(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: cb, error: cbErr } = await supabase
      .from("cookbooks")
      .select("id, chef_user_id")
      .eq("id", data.cookbookId)
      .maybeSingle();
    if (cbErr) throw new Error(cbErr.message);
    if (!cb || cb.chef_user_id !== userId) throw new Error("Not your cookbook");

    if (data.included) {
      const { count } = await supabase
        .from("cookbook_recipes")
        .select("*", { count: "exact", head: true })
        .eq("cookbook_id", data.cookbookId);
      const { error } = await supabase
        .from("cookbook_recipes")
        .insert({ cookbook_id: data.cookbookId, paid_recipe_id: data.recipeId, position: (count ?? 0) + 1 });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("cookbook_recipes")
        .delete()
        .eq("cookbook_id", data.cookbookId)
        .eq("paid_recipe_id", data.recipeId);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Buyer: list cookbooks the current user has purchased. */
export const listMyPurchasedCookbooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("recipe_purchases")
      .select("cookbook_id, purchased_at")
      .eq("buyer_user_id", userId)
      .eq("status", "paid")
      .not("cookbook_id", "is", null)
      .order("purchased_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((data ?? []).map((r) => r.cookbook_id as string)));
    if (ids.length === 0) return { cookbooks: [] as CookbookListItem[] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cbs } = await supabaseAdmin
      .from("cookbooks")
      .select("id, chef_user_id, title, description, cover_image_url, price_cents")
      .in("id", ids);
    const authors = await enrichAuthors(Array.from(new Set((cbs ?? []).map((c) => c.chef_user_id as string))));
    return {
      cookbooks: (cbs ?? []).map<CookbookListItem>((c) => {
        const a = authors.get(c.chef_user_id as string);
        return {
          id: c.id as string,
          chef_user_id: c.chef_user_id as string,
          title: c.title as string,
          description: (c.description as string) ?? null,
          cover_image_url: (c.cover_image_url as string) ?? null,
          price_cents: (c.price_cents as number) ?? 0,
          recipe_count: 0,
          author_name: a?.name ?? null,
          author_username: a?.username ?? null,
          author_avatar_url: a?.avatar_url ?? null,
        };
      }),
    };
  });
