import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TIER_LIMITS, resolveTier, type Tier } from "./ai-quota.server";

export const FREE_DAILY_LIMIT = TIER_LIMITS.free;

export const getRecipeUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ sinceIso: z.string().datetime() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tier = await resolveTier(supabase, userId);
    const limit = TIER_LIMITS[tier];
    const { count, error } = await supabase
      .from("recipe_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", data.sinceIso);
    if (error) {
      console.error("getRecipeUsage failed", error);
      return { used: 0, limit, tier: tier as Tier };
    }
    return { used: count ?? 0, limit, tier: tier as Tier };
  });
