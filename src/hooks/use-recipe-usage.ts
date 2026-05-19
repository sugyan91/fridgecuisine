import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecipeUsage, FREE_DAILY_LIMIT } from "@/lib/usage.functions";
import { supabase } from "@/integrations/supabase/client";

export { FREE_DAILY_LIMIT };

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

export function useRecipeUsage(userId: string | undefined) {
  const fetchUsage = useServerFn(getRecipeUsage);
  const [used, setUsed] = useState<number | null>(null);
  const [resetMs, setResetMs] = useState<number>(() => nextMidnightLocalMs());
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetchUsage({
        data: { sinceIso: startOfTodayLocal().toISOString() },
      });
      setUsed(res.used);
    } catch (e) {
      console.error("usage fetch failed", e);
    }
  }, [userId, fetchUsage]);

  useEffect(() => {
    if (!userId) {
      setUsed(null);
      return;
    }
    refresh();
    const i = setInterval(refresh, 30_000);
    return () => clearInterval(i);
  }, [userId, refresh]);

  useEffect(() => {
    const i = setInterval(() => {
      setTick((x) => x + 1);
      if (Date.now() >= resetMs) {
        setResetMs(nextMidnightLocalMs());
        refresh();
      }
    }, 1000);
    return () => clearInterval(i);
  }, [resetMs, refresh]);

  const logGeneration = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("recipe_generations")
      .insert({ user_id: userId });
    if (error) console.error("log generation failed", error);
    refresh();
  }, [userId, refresh]);

  const msLeft = Math.max(0, resetMs - Date.now());
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  const s = Math.floor((msLeft % 60_000) / 1000);
  const countdown =
    h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;

  return {
    used: used ?? 0,
    limit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - (used ?? 0)),
    countdown,
    loaded: used !== null,
    logGeneration,
    refresh,
  };
}
