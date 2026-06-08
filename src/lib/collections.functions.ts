import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SavedRecipeData } from "@/lib/saved-recipes.functions";

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  is_public: boolean;
  slug: string | null;
  created_at: string;
  item_count?: number;
};

export type CollectionItem = {
  saved_recipe_id: string;
  position: number;
  title: string;
  cuisine: string | null;
  cook_time_minutes: number | null;
  recipe: SavedRecipeData;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export const listCollections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ collections: Collection[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("recipe_collections")
      .select("id, user_id, name, emoji, color, is_public, slug, created_at, collection_items(saved_recipe_id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const collections = (data ?? []).map((c: { id: string; user_id: string; name: string; emoji: string | null; color: string | null; is_public: boolean; slug: string | null; created_at: string; collection_items: { saved_recipe_id: string }[] | null }) => ({
      id: c.id,
      user_id: c.user_id,
      name: c.name,
      emoji: c.emoji,
      color: c.color,
      is_public: c.is_public,
      slug: c.slug,
      created_at: c.created_at,
      item_count: c.collection_items?.length ?? 0,
    }));
    return { collections };
  });

export const createCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        emoji: z.string().max(8).optional(),
        color: z.string().max(24).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ collection: Collection }> => {
    const { supabase, userId } = context;
    const baseSlug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 7)}`;
    const { data: row, error } = await supabase
      .from("recipe_collections")
      .insert({
        user_id: userId,
        name: data.name,
        emoji: data.emoji ?? null,
        color: data.color ?? null,
        slug: baseSlug,
      })
      .select("id, user_id, name, emoji, color, is_public, slug, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { collection: row as Collection };
  });

export const updateCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(80).optional(),
        emoji: z.string().max(8).nullable().optional(),
        is_public: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ collection: Collection }> => {
    const { supabase, userId } = context;
    const patch: { name?: string; emoji?: string | null; is_public?: boolean } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.emoji !== undefined) patch.emoji = data.emoji;
    if (data.is_public !== undefined) patch.is_public = data.is_public;
    const { data: row, error } = await supabase
      .from("recipe_collections")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("id, user_id, name, emoji, color, is_public, slug, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { collection: row as Collection };
  });

export const deleteCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("recipe_collections")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addToCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        collection_id: z.string().uuid(),
        saved_recipe_id: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify collection ownership first (RLS will also enforce).
    const { data: coll } = await supabase
      .from("recipe_collections")
      .select("id")
      .eq("id", data.collection_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!coll) throw new Error("Collection not found");
    const { error } = await supabase
      .from("collection_items")
      .upsert({
        collection_id: data.collection_id,
        saved_recipe_id: data.saved_recipe_id,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        collection_id: z.string().uuid(),
        saved_recipe_id: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify ownership via parent collection.
    const { data: coll } = await supabase
      .from("recipe_collections")
      .select("id")
      .eq("id", data.collection_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!coll) throw new Error("Collection not found");
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", data.collection_id)
      .eq("saved_recipe_id", data.saved_recipe_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCollectionItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ collection_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ items: CollectionItem[] }> => {
    const { supabase, userId } = context;
    const { data: coll } = await supabase
      .from("recipe_collections")
      .select("id")
      .eq("id", data.collection_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!coll) throw new Error("Collection not found");
    const { data: rows, error } = await supabase
      .from("collection_items")
      .select("saved_recipe_id, position, saved_recipes!inner(title, cuisine, cook_time_minutes, recipe)")
      .eq("collection_id", data.collection_id)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const items: CollectionItem[] = (rows ?? []).map((r) => {
      const sr = r.saved_recipes as unknown as { title: string; cuisine: string | null; cook_time_minutes: number | null; recipe: SavedRecipeData };
      return {
        saved_recipe_id: r.saved_recipe_id,
        position: r.position,
        title: sr.title,
        cuisine: sr.cuisine,
        cook_time_minutes: sr.cook_time_minutes,
        recipe: sr.recipe,
      };
    });
    return { items };
  });

/** Public reader for /c/$slug — no auth required. Reads through service role
 *  because anon reads on join through inferred type can be fiddly; RLS still
 *  enforces `is_public = true`. */
export const getPublicCollection = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }): Promise<
    | { ok: true; collection: Collection; items: CollectionItem[]; ownerName: string | null }
    | { ok: false; error: string }
  > => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: coll } = await supabaseAdmin
      .from("recipe_collections")
      .select("id, user_id, name, emoji, color, is_public, slug, created_at")
      .eq("slug", data.slug)
      .eq("is_public", true)
      .maybeSingle();
    if (!coll) return { ok: false, error: "Collection not found" };
    const { data: items } = await supabaseAdmin
      .from("collection_items")
      .select("saved_recipe_id, position, saved_recipes!inner(title, cuisine, cook_time_minutes, recipe)")
      .eq("collection_id", coll.id)
      .order("position", { ascending: true });
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, username")
      .eq("user_id", coll.user_id)
      .maybeSingle();
    const mapped: CollectionItem[] = (items ?? []).map((r) => {
      const sr = r.saved_recipes as unknown as { title: string; cuisine: string | null; cook_time_minutes: number | null; recipe: SavedRecipeData };
      return {
        saved_recipe_id: r.saved_recipe_id,
        position: r.position,
        title: sr.title,
        cuisine: sr.cuisine,
        cook_time_minutes: sr.cook_time_minutes,
        recipe: sr.recipe,
      };
    });
    return {
      ok: true,
      collection: coll as Collection,
      items: mapped,
      ownerName: profile?.display_name ?? profile?.username ?? null,
    };
  });