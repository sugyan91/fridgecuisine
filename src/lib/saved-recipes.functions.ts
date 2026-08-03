import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTransactionalEmailServer } from "@/lib/email/send.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TIER_FEATURES } from "@/lib/tier-features";
import { resolveTier } from "@/lib/ai-quota.server";

export type SavedRecipeData = {
  title: string;
  blurb?: string;
  cookTimeMinutes?: number;
  prepTimeMinutes?: number;
  totalTimeMinutes?: number;
  cuisine?: string;
  usedIngredients?: string[];
  missingIngredients?: string[];
  steps?: string[];
  stepTimings?: number[];
  substitutions?: string[];
  dietary?: string[];
  difficulty?: "easy" | "medium" | "hard";
  kidFriendly?: boolean;
  pairing?: string;
  chefNote?: string;
  fasterTip?: string;
  variations?: { name: string; how: string }[];
  storage?: string;
  allergens?: string[];
  nutrition?: {
    servings?: number;
    perServing?: {
      calories?: number;
      proteinG?: number;
      carbsG?: number;
      fatG?: number;
      sugarG?: number;
      fiberG?: number;
    };
  };
};

export type SavedRecipeRow = {
  id: string;
  title: string;
  cuisine: string | null;
  cook_time_minutes: number | null;
  recipe: SavedRecipeData;
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
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  kidFriendly: z.boolean().optional(),
  pairing: z.string().max(400).optional(),
  chefNote: z.string().max(800).optional(),
  fasterTip: z.string().max(400).optional(),
  variations: z
    .array(z.object({ name: z.string().max(120), how: z.string().max(600) }))
    .max(4)
    .optional(),
  storage: z.string().max(800).optional(),
  allergens: z.array(z.string().max(60)).max(12).optional(),
  nutrition: z
    .object({
      servings: z.number().int().min(1).max(20).optional(),
      perServing: z
        .object({
          calories: z.number().int().min(0).max(5000).optional(),
          proteinG: z.number().int().min(0).max(500).optional(),
          carbsG: z.number().int().min(0).max(500).optional(),
          fatG: z.number().int().min(0).max(500).optional(),
          sugarG: z.number().int().min(0).max(500).optional(),
          fiberG: z.number().int().min(0).max(500).optional(),
        })
        .optional(),
    })
    .optional(),
}).passthrough();

export const listSavedRecipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ rows: SavedRecipeRow[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("saved_recipes")
      .select("id, title, cuisine, cook_time_minutes, recipe:recipe, saved_at, cooked_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (data ?? []) as unknown as SavedRecipeRow[] };
  });

export const getSavedRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ row: SavedRecipeRow | null }> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("saved_recipes")
      .select("id, title, cuisine, cook_time_minutes, recipe:recipe, saved_at, cooked_at")
      .eq("user_id", userId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { row: (row as unknown as SavedRecipeRow | null) ?? null };
  });

export type SaveRecipeResult =
  | { ok: true; row: SavedRecipeRow }
  | { ok: false; error: string; requiresUpgrade: true; cap: number };

export const saveRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ recipe: recipeSchema }).parse(input))
  .handler(async ({ data, context }): Promise<SaveRecipeResult> => {
    const { supabase, userId } = context;
    const r = data.recipe;

    // Free plan: soft cap on the size of the cookbook. Re-saving a recipe the
    // user already has (upsert on user_id,title) never counts against the cap.
    const cap = TIER_FEATURES[await resolveTier(supabase, userId)].savedRecipeCap;
    if (cap !== null) {
      const [{ count }, { data: existing }] = await Promise.all([
        supabase
          .from("saved_recipes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("saved_recipes")
          .select("id")
          .eq("user_id", userId)
          .eq("title", r.title)
          .maybeSingle(),
      ]);
      if (!existing && (count ?? 0) >= cap) {
        return {
          ok: false,
          requiresUpgrade: true,
          cap,
          error: `Your free cookbook holds ${cap} recipes. Remove one, or upgrade for unlimited saves.`,
        };
      }
    }

    const { data: row, error } = await supabase
      .from("saved_recipes")
      .upsert(
        {
          user_id: userId,
          title: r.title,
          cuisine: r.cuisine ?? null,
          cook_time_minutes: r.cookTimeMinutes ?? null,
          recipe: r as never,
        },
        { onConflict: "user_id,title" },
      )
      .select("id, title, cuisine, cook_time_minutes, recipe, saved_at, cooked_at")
      .single();
    if (error) throw new Error(error.message);
    const typed = row as unknown as SavedRecipeRow;
    // Fire-and-forget save confirmation email (idempotent per user+recipe).
    (async () => {
      try {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (u?.user?.email) {
          await sendTransactionalEmailServer({
            templateName: "recipe-saved",
            recipientEmail: u.user.email,
            idempotencyKey: `saved-${userId}-${typed.id}`,
            templateData: {
              recipeTitle: typed.title,
              cuisine: typed.cuisine ?? undefined,
              cookbookUrl: "https://fridgecuisine.com/cookbook",
            },
          });
        }
      } catch (e) {
        console.error("recipe-saved email failed", e);
      }
    })();
    return { ok: true, row: typed };
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
      .select("id, title, cuisine, cook_time_minutes, recipe:recipe, saved_at, cooked_at")
      .single();
    if (error) throw new Error(error.message);
    return { row: row as unknown as SavedRecipeRow };
  });