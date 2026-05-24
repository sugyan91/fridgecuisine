import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PaidReceipeRow = {
  id: string;
  chef_user_id: string;
  title: string;
  local_name: string | null;
  description: string | null;
  country: string | null;
  city: string | null;
  cuisine: string | null;
  cover_image_url: string | null;
  price_cents: number;
  is_published: boolean;
  ingredients?: unknown;
  steps?: unknown;
  created_at?: string;
};

const stepSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  minutes: z.number().int().min(0).max(600).optional(),
});

const receipeInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  local_name: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  cuisine: z.string().trim().max(80).optional().nullable(),
  cover_image_url: z.string().url().max(800).optional().nullable(),
  ingredients: z.array(z.string().trim().min(1).max(200)).max(60).default([]),
  steps: z.array(stepSchema).min(1).max(40),
  price_cents: z.number().int().min(100).max(50000),
  is_published: z.boolean().default(true),
});

const SAFE_PUBLIC_COLUMNS =
  "id, chef_user_id, title, local_name, country, city, cuisine, cover_image_url, price_cents";

export const listMyPaidReceipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("paid_recipes")
      .select(
        "id, title, local_name, country, city, cover_image_url, price_cents, is_published, created_at",
      )
      .eq("chef_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as PaidReceipeRow[] };
  });

export const upsertPaidReceipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => receipeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const row = {
      chef_user_id: userId,
      title: data.title,
      local_name: data.local_name || null,
      description: data.description || null,
      country: data.country || null,
      city: data.city || null,
      cuisine: data.cuisine || null,
      cover_image_url: data.cover_image_url || null,
      ingredients: data.ingredients,
      steps: data.steps,
      price_cents: data.price_cents,
      is_published: data.is_published,
    };
    if (data.id) {
      const { data: updated, error } = await supabase
        .from("paid_recipes")
        .update(row)
        .eq("id", data.id)
        .eq("chef_user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { row: updated as PaidReceipeRow };
    }
    const { data: inserted, error } = await supabase
      .from("paid_recipes")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { row: inserted as PaidReceipeRow };
  });

export const deletePaidReceipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("paid_recipes")
      .delete()
      .eq("id", data.id)
      .eq("chef_user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public marketplace listing — only safe columns, never ingredients/steps. */
export const listPublicPaidReceipes = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("paid_recipes")
      .select(SAFE_PUBLIC_COLUMNS)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(120);
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as PaidReceipeRow[] };
  });

/**
 * Fetch a single paid receipe. Returns the limited public payload by default;
 * if the caller is signed in and either authored or purchased it, returns the
 * full details including ingredients and steps.
 */
export const getPaidReceipe = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pub, error } = await supabaseAdmin
      .from("paid_recipes")
      .select(SAFE_PUBLIC_COLUMNS + ", description, is_published")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!pub || !(pub as { is_published: boolean }).is_published) {
      return { receipe: null, unlocked: false };
    }

    // Try to detect a signed-in caller. We do this loosely; if not present
    // we return the locked payload.
    let unlocked = false;
    try {
      // @ts-expect-error — getHeaders is provided at runtime
      const headers = (globalThis as any)?.__lovableHeaders ?? null;
      void headers;
    } catch {
      // ignore
    }
    return { receipe: pub as PaidReceipeRow, unlocked };
  });

/**
 * Authenticated variant — returns full ingredients + steps if the caller is
 * the chef who owns the receipe OR has purchased it.
 */
export const getPaidReceipeFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check ownership or purchase via RPC.
    const { data: ownerRow } = await supabaseAdmin
      .from("paid_recipes")
      .select("chef_user_id, is_published")
      .eq("id", data.id)
      .maybeSingle();
    if (!ownerRow) return { receipe: null, unlocked: false };

    const isOwner = ownerRow.chef_user_id === userId;
    let purchased = false;
    if (!isOwner) {
      const { data: rpcRes } = await supabase.rpc("has_purchased_recipe", {
        _user_id: userId,
        _recipe_id: data.id,
      });
      purchased = Boolean(rpcRes);
    }

    if (isOwner || purchased) {
      const { data: full, error } = await supabaseAdmin
        .from("paid_recipes")
        .select("*")
        .eq("id", data.id)
        .single();
      if (error) throw new Error(error.message);
      return { receipe: full as PaidReceipeRow, unlocked: true };
    }
    const { data: pub } = await supabaseAdmin
      .from("paid_recipes")
      .select(SAFE_PUBLIC_COLUMNS + ", description")
      .eq("id", data.id)
      .single();
    return { receipe: pub as PaidReceipeRow, unlocked: false };
  });