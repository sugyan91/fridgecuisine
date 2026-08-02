import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Tier } from "./ai-quota.server";

// Mirrors ENDPOINT_LIMITS.free.recipes in ai-quota.server.ts. Kept inline so
// this client-reachable module doesn't statically pull the server-only file.
export const FREE_DAILY_LIMIT = 3;

export type RecipeUsage = {
  used: number;
  limit: number | null;
  tier: Tier | "anon";
  lifetime: boolean;
  usedRecipes: number;
  limitRecipes: number | null;
  usedHelpers: number;
  limitHelpers: number | null;
};

export const getRecipeUsage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ sinceIso: z.string().datetime() }).parse(input),
  )
  .handler(async ({ data }): Promise<RecipeUsage> => {
    const { tryGetSupabaseUser } = await import("./optional-auth.server");
    const { ENDPOINT_LIMITS, resolveTier } = await import("./ai-quota.server");
    const { getAnonUsage, ANON_DAILY_LIMIT } = await import("./anon-tracking.server");
    const auth = await tryGetSupabaseUser();
    if (!auth) {
      // Anonymous — return server-tracked daily usage (1/day, per fingerprint AND per IP).
      try {
        const { used } = await getAnonUsage();
        return {
          used,
          limit: ANON_DAILY_LIMIT,
          tier: "anon",
          lifetime: false,
          usedRecipes: used,
          limitRecipes: ANON_DAILY_LIMIT,
          usedHelpers: 0,
          limitHelpers: 0,
        };
      } catch (err) {
        console.error("getAnonUsage failed", err);
        return {
          used: 0,
          limit: ANON_DAILY_LIMIT,
          tier: "anon",
          lifetime: false,
          usedRecipes: 0,
          limitRecipes: ANON_DAILY_LIMIT,
          usedHelpers: 0,
          limitHelpers: 0,
        };
      }
    }
    const { supabase, userId } = auth;
    const tier = await resolveTier(supabase, userId);
    const rawRecipeLimit = ENDPOINT_LIMITS[tier].recipes;
    const rawHelperLimit = ENDPOINT_LIMITS[tier].helpers;
    const limitRecipes: number | null = Number.isFinite(rawRecipeLimit) ? rawRecipeLimit : null;
    const limitHelpers: number | null = Number.isFinite(rawHelperLimit) ? rawHelperLimit : null;

    const baseQuery = supabase
      .from("recipe_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", data.sinceIso);

    const [{ count: recipeCount, error: recipeErr }, { count: helperCount, error: helperErr }] =
      await Promise.all([
        baseQuery.eq("endpoint", "recipes"),
        supabase
          .from("recipe_generations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", data.sinceIso)
          .neq("endpoint", "recipes"),
      ]);

    if (recipeErr) console.error("getRecipeUsage recipe count failed", recipeErr);
    if (helperErr) console.error("getRecipeUsage helper count failed", helperErr);

    const usedRecipes = recipeCount ?? 0;
    const usedHelpers = helperCount ?? 0;
    return {
      used: usedRecipes,
      limit: limitRecipes,
      tier,
      lifetime: false,
      usedRecipes,
      limitRecipes,
      usedHelpers,
      limitHelpers,
    };
  });
