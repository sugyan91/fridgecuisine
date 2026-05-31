import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecipeUsage, FREE_DAILY_LIMIT } from "@/lib/usage.functions";
import { supabase } from "@/integrations/supabase/client";

export { FREE_DAILY_LIMIT };

const ANON_KEY = "fridge-anon-usage";

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

function readAnonUsage(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(ANON_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { day: string; count: number };
    if (parsed.day !== todayKey()) return 0;
    return parsed.count || 0;
  } catch {
    return 0;
  }
}
function writeAnonUsage(count: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ANON_KEY,
      JSON.stringify({ day: todayKey(), count }),
    );
  } catch {}
}

export function useRecipeUsage(userId: string | undefined) {
  const fetchUsage = useServerFn(getRecipeUsage);
  const [used, setUsed] = useState<number | null>(null);
  const [resetMs, setResetMs] = useState<number>(() => nextMidnightLocalMs());
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setUsed(readAnonUsage());
      return;
    }
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      // Session not hydrated yet — skip; will retry on next tick.
      return;
    }
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
    refresh();
    if (!userId) return;
    const i = setInterval(refresh, 30_000);
    return () => clearInterval(i);
  }, [userId, refresh]);

  useEffect(() => {
    const i = setInterval(() => {
      setTick((x) => x + 1);
      if (Date.now() >= resetMs) {
        setResetMs(nextMidnightLocalMs());
        if (!userId) writeAnonUsage(0);
        refresh();
      }
    }, 1000);
    return () => clearInterval(i);
  }, [resetMs, refresh, userId]);

  const logGeneration = useCallback(async () => {
    if (!userId) {
      const next = readAnonUsage() + 1;
      writeAnonUsage(next);
      setUsed(next);
      return;
    }
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

  const current = used ?? 0;
  return {
    used: current,
    limit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - current),
    atLimit: current >= FREE_DAILY_LIMIT,
    countdown,
    loaded: used !== null,
    logGeneration,
    refresh,
  };
}
