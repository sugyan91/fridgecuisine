import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeIngredients } from "./ingredient-normalize";

export type RecipeStep = { text: string; minutes?: number };

export type PaidRecipeListItem = {
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

export type PaidRecipeFull = PaidRecipeListItem & {
  description: string | null;
  ingredients: string[];
  steps: RecipeStep[];
  is_published: boolean;
};

const stepSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  minutes: z.number().int().min(0).max(600).optional(),
});

const recipeInput = z.object({
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

export const listMyPaidRecipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("paid_recipes")
      .select("id, title, local_name, country, city, cover_image_url, price_cents, is_published, created_at")
      .eq("chef_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as Array<PaidRecipeListItem & { is_published: boolean; created_at: string }> };
  });

export const upsertPaidRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => recipeInput.parse(input))
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

export const deletePaidRecipe = createServerFn({ method: "POST" })
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
export const listPublicPaidRecipes = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("paid_recipes")
      .select("id, chef_user_id, title, local_name, country, city, cuisine, cover_image_url, price_cents")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(120);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as PaidRecipeListItem[];
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
 * the full recipe if the signed-in caller owns or has purchased it.
 */
export const getPaidRecipeDetail = createServerFn({ method: "GET" })
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
      return { recipe: null, unlocked: false } as const;
    }
    const recipe: PaidRecipeListItem & { description: string | null } = {
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
    recipe.author_name = (prof?.display_name || prof?.username) ?? null;
    recipe.author_avatar_url = prof?.avatar_url ?? null;
    return { recipe, unlocked: false } as const;
  });

/** Auth variant — returns full ingredients/steps if owner or purchaser. */
export const getPaidRecipeFull = createServerFn({ method: "GET" })
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
    if (!ownerRow) return { unlocked: false, recipe: null } as const;

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
      return { unlocked: false, recipe: null } as const;
    }
    const { data: full, error } = await supabaseAdmin
      .from("paid_recipes")
      .select("id, chef_user_id, title, local_name, country, city, cuisine, cover_image_url, price_cents, description, ingredients, steps, is_published")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const recipe: PaidRecipeFull = {
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
      ingredients: normalizeIngredients(full.ingredients),
      steps: (full.steps ?? []) as RecipeStep[],
      is_published: full.is_published,
    };
    return { unlocked: true as const, recipe };
  });

export type PaidRecipeTeaser = {
  hook: string;
  ingredientHints: string[];
  stepPeeks: string[];
  totalIngredients: number;
  totalSteps: number;
  totalMinutes: number | null;
};

/**
 * AI-generated tantalizing preview of a locked recipe. Uses the full recipe
 * server-side but returns only teasers — first-word/category hints for
 * ingredients and short step openers with the method redacted.
 */
export const getPaidRecipeTeaser = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<{ teaser: PaidRecipeTeaser | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("paid_recipes")
      .select("title, cuisine, country, description, ingredients, steps, is_published")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || !row.is_published) return { teaser: null };

    // Cache teaser by recipe id + updated_at — invalidates automatically on edit.
    const { hashKey, getCached, putCached } = await import("./ai-cache.server");
    const { data: meta } = await supabaseAdmin
      .from("paid_recipes")
      .select("updated_at")
      .eq("id", data.id)
      .maybeSingle();
    const cacheKey = hashKey("paid-teaser", { id: data.id, u: meta?.updated_at ?? "" });
    const cachedTeaser = await getCached<{ teaser: PaidRecipeTeaser }>("paid-teaser", cacheKey);
    if (cachedTeaser) return cachedTeaser;

    const ingredients = normalizeIngredients(row.ingredients);
    const steps = ((row.steps ?? []) as Array<{ text: string; minutes?: number }>).filter(
      (s) => s && typeof s.text === "string",
    );
    const totalMinutes = steps.reduce(
      (acc, s) => acc + (typeof s.minutes === "number" ? s.minutes : 0),
      0,
    );

    const { callChatJSON } = await import("./hf-client.server");

    const system =
      'Write a paywalled recipe teaser. Never reveal quantities, temps, timings, or exact technique. JSON only: {"hook":str(<=140,one vivid sentence),"ingredientHints":[5-7 items <=4 words, category/vibe not amount],"stepPeeks":[2 items <=90 chars hinting first 2 moves without method]}';

    const user = JSON.stringify({
      title: row.title,
      cuisine: row.cuisine,
      country: row.country,
      description: (row.description ?? "").slice(0, 200),
      ingredients: ingredients.slice(0, 20),
      firstSteps: steps.slice(0, 2).map((s) => s.text.slice(0, 160)),
    });

    const res = await callChatJSON(system, user, { maxTokens: 220, temperature: 0.4 });

    const fallback: PaidRecipeTeaser = {
      hook:
        row.description?.trim().slice(0, 140) ||
        `A chef-made ${row.cuisine ?? ""} recipe worth unlocking.`.trim(),
      ingredientHints: ingredients.slice(0, 5).map((i) => i.split(",")[0].trim().slice(0, 30)),
      stepPeeks: steps.slice(0, 2).map((s) => s.text.split(/[.!?]/)[0].slice(0, 80) + "…"),
      totalIngredients: ingredients.length,
      totalSteps: steps.length,
      totalMinutes: totalMinutes > 0 ? totalMinutes : null,
    };

    if (!res.ok) return { teaser: fallback };

    const parsed = res.json as {
      hook?: unknown;
      ingredientHints?: unknown;
      stepPeeks?: unknown;
    };
    const hook = typeof parsed.hook === "string" ? parsed.hook.slice(0, 200) : fallback.hook;
    const ingredientHints = Array.isArray(parsed.ingredientHints)
      ? parsed.ingredientHints
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.slice(0, 40))
          .slice(0, 7)
      : fallback.ingredientHints;
    const stepPeeks = Array.isArray(parsed.stepPeeks)
      ? parsed.stepPeeks
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.slice(0, 120))
          .slice(0, 2)
      : fallback.stepPeeks;

    const finalTeaser: PaidRecipeTeaser = {
      hook,
      ingredientHints: ingredientHints.length ? ingredientHints : fallback.ingredientHints,
      stepPeeks: stepPeeks.length ? stepPeeks : fallback.stepPeeks,
      totalIngredients: ingredients.length,
      totalSteps: steps.length,
      totalMinutes: totalMinutes > 0 ? totalMinutes : null,
    };
    await putCached("paid-teaser", cacheKey, { teaser: finalTeaser }, 60);
    return { teaser: finalTeaser };
  });