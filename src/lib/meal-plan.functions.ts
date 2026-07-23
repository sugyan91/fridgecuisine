import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SavedRecipeData } from "@/lib/saved-recipes.functions";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type MealPlanEntry = {
  id: string;
  plan_date: string;
  meal_slot: MealSlot;
  saved_recipe_id: string;
  servings_override: number | null;
  position: number;
  title: string;
  cuisine: string | null;
  cook_time_minutes: number | null;
  recipe: SavedRecipeData;
};

export const listWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ entries: MealPlanEntry[] }> => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("meal_plan_entries")
      .select(
        "id, plan_date, meal_slot, saved_recipe_id, servings_override, position, saved_recipes!inner(title, cuisine, cook_time_minutes, recipe)",
      )
      .eq("user_id", userId)
      .gte("plan_date", data.startDate)
      .lte("plan_date", data.endDate)
      .order("plan_date", { ascending: true })
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const entries: MealPlanEntry[] = (rows ?? []).map((r) => {
      const sr = r.saved_recipes as unknown as {
        title: string;
        cuisine: string | null;
        cook_time_minutes: number | null;
        recipe: SavedRecipeData;
      };
      return {
        id: r.id,
        plan_date: r.plan_date,
        meal_slot: r.meal_slot as MealSlot,
        saved_recipe_id: r.saved_recipe_id,
        servings_override: r.servings_override,
        position: r.position,
        title: sr.title,
        cuisine: sr.cuisine,
        cook_time_minutes: sr.cook_time_minutes,
        recipe: sr.recipe,
      };
    });
    return { entries };
  });

export const addPlanEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        plan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        meal_slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
        saved_recipe_id: z.string().uuid(),
        servings_override: z.number().int().min(1).max(20).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Determine next position in that slot.
    const { data: existing } = await supabase
      .from("meal_plan_entries")
      .select("position")
      .eq("user_id", userId)
      .eq("plan_date", data.plan_date)
      .eq("meal_slot", data.meal_slot)
      .order("position", { ascending: false })
      .limit(1);
    const nextPos = (existing?.[0]?.position ?? -1) + 1;
    const { data: row, error } = await supabase
      .from("meal_plan_entries")
      .insert({
        user_id: userId,
        plan_date: data.plan_date,
        meal_slot: data.meal_slot,
        saved_recipe_id: data.saved_recipe_id,
        servings_override: data.servings_override ?? null,
        position: nextPos,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const removePlanEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("meal_plan_entries")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const movePlanEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        plan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        meal_slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Place at end of the target slot.
    const { data: existing } = await supabase
      .from("meal_plan_entries")
      .select("position")
      .eq("user_id", userId)
      .eq("plan_date", data.plan_date)
      .eq("meal_slot", data.meal_slot)
      .order("position", { ascending: false })
      .limit(1);
    const nextPos = (existing?.[0]?.position ?? -1) + 1;
    const { error } = await supabase
      .from("meal_plan_entries")
      .update({
        plan_date: data.plan_date,
        meal_slot: data.meal_slot,
        position: nextPos,
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ShoppingListItem = { name: string; count: number };

/** Aggregate all ingredients (used + missing) from a list of plan entries. */
export function aggregateShoppingList(entries: MealPlanEntry[]): ShoppingListItem[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    const all = [
      ...(e.recipe.usedIngredients ?? []),
      ...(e.recipe.missingIngredients ?? []),
    ];
    for (const raw of all) {
      const key = raw.trim().toLowerCase();
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  // Preserve original casing of first occurrence.
  const display = new Map<string, string>();
  for (const e of entries) {
    const all = [
      ...(e.recipe.usedIngredients ?? []),
      ...(e.recipe.missingIngredients ?? []),
    ];
    for (const raw of all) {
      const key = raw.trim().toLowerCase();
      if (!display.has(key)) display.set(key, raw.trim());
    }
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ name: display.get(key) ?? key, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}