import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SavedRecipeRow = {
  id: string;
  title: string;
  cuisine: string | null;
  cook_time_minutes: number | null;
  recipe: unknown;
  saved_at: string;
  cooked_at: string | null;
};

const recipeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  blurb: z.string().max(2000).optional().default(""),
  cookTimeMinutes: z.number().int().min(0).max(1000).optional(),
  prepTimeMinutes: z.number().int().min(0).max(1000).optional(),
  totalTimeMinutes: z.number().int().min(0).max(2000).optional(),
  cuisine: z.string().max(80).optional(),
  usedIngredients: z.array(z.string().max(120)).max(60).optional(),
  missingIngredients: z.array(z.string().max(120)).max(60).optional(),
  steps: z.array(z.string().max(2000)).max(40).optional(),
  stepTimings: z.array(z.number().int().min(0).max(600)).max(40).optional(),
  substitutions: z.array(z.string().max(400)).max(40).optional(),
  dietary: z.array(z.string().max(40)).max(10).optional(),
}).passthrough();

export const listSavedRecipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: SavedRecipeRow[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("saved_recipes")
      .select("id, title, cuisine, cook_time_minutes, recipe, saved_at, cooked_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as SavedRecipeRow[] };
  });

export const saveRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ recipe: recipeSchema }).parse(input))
  .handler(async ({ data, context }): Promise<{ row: SavedRecipeRow }> => {
    const { supabase, userId } = context;
    const r = data.recipe;
    const { data: row, error } = await supabase
      .from("saved_recipes")
      .upsert(
        {
          user_id: userId,
          title: r.title,
          cuisine: r.cuisine ?? null,
          cook_time_minutes: r.cookTimeMinutes ?? null,
          recipe: r,
        },
        { onConflict: "user_id,title" },
      )
      .select("id, title, cuisine, cook_time_minutes, recipe, saved_at, cooked_at")
      .single();
    if (error) throw new Error(error.message);
    return { row: row as SavedRecipeRow };
  });

export const unsaveRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ title: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("saved_recipes")
      .delete()
      .eq("user_id", userId)
      .eq("title", data.title);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setCookedStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      cooked: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("saved_recipes")
      .update({ cooked_at: data.cooked ? new Date().toISOString() : null })
      .eq("user_id", userId)
      .eq("id", data.id)
      .select("id, title, cuisine, cook_time_minutes, recipe, saved_at, cooked_at")
      .single();
    if (error) throw new Error(error.message);
    return { row: row as SavedRecipeRow };
  });