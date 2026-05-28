import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReceipeStep = { text: string; minutes?: number };

export type PaidReceipeListItem = {
  id: string;
  chef_user_id: string;
  title: string;
  local_name: string | null;
  country: string | null;
  city: string | null;
  cuisine: string | null;
  cover_image_url: string | null;
  price_cents: number;
  author_name?: string | null;
  author_avatar_url?: string | null;
};

export type PaidReceipeFull = PaidReceipeListItem & {
  description: string | null;
  ingredients: string[];
  steps: ReceipeStep[];
  is_published: boolean;
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

export const listMyPaidReceipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("paid_recipes")
      .select("id, title, local_name, country, city, cover_image_url, price_cents, is_published, created_at")
      .eq("chef_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as Array<PaidReceipeListItem & { is_published: boolean; created_at: string }> };
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
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: (updated as { id: string }).id };
    }
    const { data: inserted, error } = await supabase
      .from("paid_recipes")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (inserted as { id: string }).id };
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

/** Public marketplace listing — only safe columns. */
export const listPublicPaidReceipes = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("paid_recipes")
      .select("id, chef_user_id, title, local_name, country, city, cuisine, cover_image_url, price_cents")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(120);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as PaidReceipeListItem[];
    const chefIds = Array.from(new Set(rows.map((r) => r.chef_user_id)));
    if (chefIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", chefIds);
      const byId = new Map(
        (profiles ?? []).map((p: { user_id: string; display_name: string | null; username: string | null; avatar_url: string | null }) => [
          p.user_id,
          { name: p.display_name || p.username || null, avatar: p.avatar_url || null },
        ]),
      );
      for (const r of rows) {
        const p = byId.get(r.chef_user_id);
        r.author_name = p?.name ?? null;
        r.author_avatar_url = p?.avatar ?? null;
      }
    }
    return { rows };
  });

/**
 * Returns the limited public payload (no ingredients/steps) for anyone, and
 * the full receipe if the signed-in caller owns or has purchased it.
 */
export const getPaidReceipeDetail = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pub, error } = await supabaseAdmin
      .from("paid_recipes")
      .select("id, chef_user_id, title, local_name, country, city, cuisine, cover_image_url, price_cents, description, is_published")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!pub || !pub.is_published) {
      return { receipe: null, unlocked: false } as const;
    }
    const receipe: PaidReceipeListItem & { description: string | null } = {
      id: pub.id,
      chef_user_id: pub.chef_user_id,
      title: pub.title,
      local_name: pub.local_name,
      country: pub.country,
      city: pub.city,
      cuisine: pub.cuisine,
      cover_image_url: pub.cover_image_url,
      price_cents: pub.price_cents,
      description: pub.description,
    };
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("user_id", pub.chef_user_id)
      .maybeSingle();
    receipe.author_name = (prof?.display_name || prof?.username) ?? null;
    receipe.author_avatar_url = prof?.avatar_url ?? null;
    return { receipe, unlocked: false } as const;
  });

/** Auth variant — returns full ingredients/steps if owner or purchaser. */
export const getPaidReceipeFull = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ownerRow } = await supabaseAdmin
      .from("paid_recipes")
      .select("chef_user_id, is_published")
      .eq("id", data.id)
      .maybeSingle();
    if (!ownerRow) return { unlocked: false, receipe: null } as const;

    const isOwner = ownerRow.chef_user_id === userId;
    let purchased = false;
    if (!isOwner) {
      const { data: rpcRes } = await supabase.rpc("has_purchased_recipe", {
        _user_id: userId,
        _recipe_id: data.id,
      });
      purchased = Boolean(rpcRes);
    }

    if (!(isOwner || purchased)) {
      return { unlocked: false, receipe: null } as const;
    }
    const { data: full, error } = await supabaseAdmin
      .from("paid_recipes")
      .select("id, chef_user_id, title, local_name, country, city, cuisine, cover_image_url, price_cents, description, ingredients, steps, is_published")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const receipe: PaidReceipeFull = {
      id: full.id,
      chef_user_id: full.chef_user_id,
      title: full.title,
      local_name: full.local_name,
      country: full.country,
      city: full.city,
      cuisine: full.cuisine,
      cover_image_url: full.cover_image_url,
      price_cents: full.price_cents,
      description: full.description,
      ingredients: (full.ingredients ?? []) as string[],
      steps: (full.steps ?? []) as ReceipeStep[],
      is_published: full.is_published,
    };
    return { unlocked: true as const, receipe };
  });