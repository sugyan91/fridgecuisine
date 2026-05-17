import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const recipeInput = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(800).optional().default(""),
  history: z.string().trim().max(4000).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  cuisine: z.string().trim().max(80).optional().default(""),
  dietary: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  ingredients: z.array(z.string().trim().min(1).max(200)).min(1).max(60),
  steps: z.array(z.string().trim().min(1).max(1000)).min(1).max(40),
  image_url: z.string().url().max(2000).optional().or(z.literal("")).default(""),
  is_published: z.boolean().default(true),
});

export const listCommunityRecipes = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      search: z.string().trim().max(80).optional(),
      cuisine: z.string().trim().max(80).optional(),
      city: z.string().trim().max(80).optional(),
      limit: z.number().int().min(1).max(50).default(24),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("community_recipes")
      .select("id, title, description, city, country, cuisine, dietary, image_url, created_at, user_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.cuisine) q = q.eq("cuisine", data.cuisine);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    const { data: rows, error } = await q;
    if (error) return { recipes: [], error: error.message };

    const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
    const ids = (rows ?? []).map((r) => r.id);
    const [{ data: profiles }, { data: votes }] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : Promise.resolve({ data: [] as { user_id: string; display_name: string | null }[] }),
      ids.length
        ? supabaseAdmin.from("community_recipe_likes").select("recipe_id, vote_type").in("recipe_id", ids)
        : Promise.resolve({ data: [] as { recipe_id: string; vote_type: string }[] }),
    ]);
    const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
    const upCount = new Map<string, number>();
    const downCount = new Map<string, number>();
    (votes ?? []).forEach((v) => {
      const m = v.vote_type === "down" ? downCount : upCount;
      m.set(v.recipe_id, (m.get(v.recipe_id) ?? 0) + 1);
    });

    return {
      recipes: (rows ?? []).map((r) => ({
        ...r,
        author_name: nameMap.get(r.user_id) ?? "Anonymous",
        up_count: upCount.get(r.id) ?? 0,
        down_count: downCount.get(r.id) ?? 0,
      })),
      error: null,
    };
  });

export const getCommunityRecipe = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: recipe, error } = await supabaseAdmin
      .from("community_recipes")
      .select("*")
      .eq("id", data.id)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !recipe) return { recipe: null, author_name: null, up_count: 0, down_count: 0 };
    const [{ data: profile }, { data: votes }] = await Promise.all([
      supabaseAdmin.from("profiles").select("display_name").eq("user_id", recipe.user_id).maybeSingle(),
      supabaseAdmin.from("community_recipe_likes").select("vote_type").eq("recipe_id", recipe.id),
    ]);
    const up_count = (votes ?? []).filter((v) => v.vote_type !== "down").length;
    const down_count = (votes ?? []).filter((v) => v.vote_type === "down").length;
    return {
      recipe,
      author_name: profile?.display_name ?? "Anonymous",
      up_count,
      down_count,
    };
  });

export const createCommunityRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => recipeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("community_recipes")
      .insert({ ...data, user_id: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateCommunityRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => recipeInput.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("community_recipes")
      .update(rest)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCommunityRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("community_recipes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyRecipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("community_recipes")
      .select("id, title, city, cuisine, is_published, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { recipes: data ?? [] };
  });

export const getMyVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ recipe_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("community_recipe_likes")
      .select("vote_type")
      .eq("recipe_id", data.recipe_id)
      .eq("user_id", userId)
      .maybeSingle();
    return { vote: (row?.vote_type as "up" | "down" | undefined) ?? null };
  });

export const setRecipeVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      recipe_id: z.string().uuid(),
      vote: z.enum(["up", "down"]).nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("community_recipe_likes")
      .select("vote_type")
      .eq("recipe_id", data.recipe_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (data.vote === null) {
      if (existing) {
        await supabase
          .from("community_recipe_likes")
          .delete()
          .eq("recipe_id", data.recipe_id)
          .eq("user_id", userId);
      }
      return { vote: null };
    }
    if (existing) {
      await supabase
        .from("community_recipe_likes")
        .update({ vote_type: data.vote })
        .eq("recipe_id", data.recipe_id)
        .eq("user_id", userId);
      return { vote: data.vote };
    }
    await supabase
      .from("community_recipe_likes")
      .insert({ recipe_id: data.recipe_id, user_id: userId, vote_type: data.vote });
    return { vote: data.vote };
  });
