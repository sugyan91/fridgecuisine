import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecipeUsage, FREE_DAILY_LIMIT } from "@/lib/usage.functions";

export { FREE_DAILY_LIMIT };

export type UsageTier = "anon" | "free" | "basic" | "unlimited";

/** Anonymous users get 1 recipe generation per day, then a sign-in wall. */
const ANON_DAILY_LIMIT = 1;

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function nextMidnightLocalMs(): number {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Anonymous usage is tracked server-side now (IP + signed cookie fingerprint).
// No localStorage counter — it was trivially bypassable.

export function useRecipeUsage(userId: string | undefined) {
  const fetchUsage = useServerFn(getRecipeUsage);
  const [usedRecipes, setUsedRecipes] = useState<number | null>(null);
  const [limitRecipes, setLimitRecipes] = useState<number | null>(FREE_DAILY_LIMIT);
  const [usedHelpers, setUsedHelpers] = useState<number | null>(null);
  const [limitHelpers, setLimitHelpers] = useState<number | null>(5);
  const [serverTier, setServerTier] = useState<UsageTier | null>(null);
  const [resetMs, setResetMs] = useState<number>(() => nextMidnightLocalMs());
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetchUsage({
        data: { sinceIso: startOfTodayLocal().toISOString() },
      });
      setUsedRecipes(res.usedRecipes);
      setLimitRecipes(res.limitRecipes);
      setUsedHelpers(res.usedHelpers);
      setLimitHelpers(res.limitHelpers);
      setServerTier(res.tier as UsageTier);
    } catch (e) {
      console.error("usage fetch failed", e);
    }
  }, [fetchUsage]);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 30_000);
    return () => clearInterval(i);
  }, [userId, refresh]);

  useEffect(() => {
    const i = setInterval(() => {
      setTick((x) => x + 1);
      if (Date.now() >= resetMs) {
        setResetMs(nextMidnightLocalMs());
        // Daily reset for both anon and free signed-in tiers.
        refresh();
      }
    }, 1000);
    return () => clearInterval(i);
  }, [resetMs, refresh, userId]);

  const logGeneration = useCallback(async () => {
    // Server already incremented; refetch to stay in sync.
    refresh();
  }, [refresh]);

  const msLeft = Math.max(0, resetMs - Date.now());
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  const s = Math.floor((msLeft % 60_000) / 1000);
  const countdown =
    h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;

  const currentRecipes = usedRecipes ?? 0;
  const currentHelpers = usedHelpers ?? 0;
  const tier: UsageTier = serverTier ?? (userId ? "free" : "anon");
  const recipeLimit = limitRecipes ?? (tier === "anon" ? ANON_DAILY_LIMIT : FREE_DAILY_LIMIT);
  const helperLimit = limitHelpers ?? 5;
  // No tier is truly unlimited anymore — "unlimited" has a fair-use cap.
  const unlimited = false;
  const lifetime = false;
  return {
    used: currentRecipes,
    limit: recipeLimit,
    unlimited,
    tier,
    lifetime,
    remaining: unlimited ? Infinity : Math.max(0, recipeLimit - currentRecipes),
    atLimit: !unlimited && currentRecipes >= recipeLimit,
    atRecipeLimit: !unlimited && currentRecipes >= recipeLimit,
    atHelperLimit: !unlimited && currentHelpers >= helperLimit,
    remainingRecipes: Math.max(0, recipeLimit - currentRecipes),
    remainingHelpers: Math.max(0, helperLimit - currentHelpers),
    usedRecipes: currentRecipes,
    usedHelpers: currentHelpers,
    limitRecipes: recipeLimit,
    limitHelpers: helperLimit,
    countdown,
    loaded: usedRecipes !== null,
    logGeneration,
    refresh,
  };
}
