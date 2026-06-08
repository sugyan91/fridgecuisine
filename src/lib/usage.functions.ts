import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TIER_LIMITS, resolveTier, type Tier } from "./ai-quota.server";
import { tryGetSupabaseUser } from "./optional-auth.server";
import { getAnonUsage, ANON_LIFETIME_LIMIT } from "./anon-tracking.server";

export const FREE_DAILY_LIMIT = TIER_LIMITS.free;

export type RecipeUsage = {
  used: number;
  limit: number | null;
  tier: Tier | "anon";
  lifetime: boolean;
};

export const getRecipeUsage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ sinceIso: z.string().datetime() }).parse(input),
  )
  .handler(async ({ data }): Promise<RecipeUsage> => {
    const auth = await tryGetSupabaseUser();
    if (!auth) {
      // Anonymous — return server-tracked lifetime usage.
      try {
        const { used } = await getAnonUsage();
        return { used, limit: ANON_LIFETIME_LIMIT, tier: "anon", lifetime: true };
      } catch (err) {
        console.error("getAnonUsage failed", err);
        return { used: 0, limit: ANON_LIFETIME_LIMIT, tier: "anon", lifetime: true };
      }
    }
    const { supabase, userId } = auth;
    const tier = await resolveTier(supabase, userId);
    const rawLimit = TIER_LIMITS[tier];
    const limit: number | null = Number.isFinite(rawLimit) ? rawLimit : null;
    const { count, error } = await supabase
      .from("recipe_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", data.sinceIso);
    if (error) {
      console.error("getRecipeUsage failed", error);
      return { used: 0, limit, tier, lifetime: false };
    }
    return { used: count ?? 0, limit, tier, lifetime: false };
  });
