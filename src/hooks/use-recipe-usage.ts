import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getRecipeUsage, FREE_DAILY_LIMIT } from "@/lib/usage.functions";
import { supabase } from "@/integrations/supabase/client";

export { FREE_DAILY_LIMIT };

export type UsageTier = "anon" | "free" | "basic" | "unlimited";

const ANON_KEY = "fridge-anon-usage";
/** Anonymous users get 1 generation as a teaser, then a sign-in wall. */
const ANON_LIFETIME_LIMIT = 1;

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
    const parsed = JSON.parse(raw) as { day?: string; count: number; lifetime?: boolean };
    // Anonymous quota is now LIFETIME (not daily) — return stored count as-is.
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
      JSON.stringify({ count, lifetime: true }),
    );
  } catch {}
}

export function useRecipeUsage(userId: string | undefined) {
  const fetchUsage = useServerFn(getRecipeUsage);
  const [used, setUsed] = useState<number | null>(null);
  const [serverLimit, setServerLimit] = useState<number | null>(FREE_DAILY_LIMIT);
  const [serverTier, setServerTier] = useState<"free" | "basic" | "unlimited" | null>(null);
  const [resetMs, setResetMs] = useState<number>(() => nextMidnightLocalMs());
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setUsed(readAnonUsage());
      setServerLimit(ANON_LIFETIME_LIMIT);
      setServerTier(null);
      return;
    }
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      return;
    }
    try {
      const res = await fetchUsage({
        data: { sinceIso: startOfTodayLocal().toISOString() },
      });
      setUsed(res.used);
      setServerLimit(res.limit);
      setServerTier(res.tier);
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
        // Anon is lifetime now — do NOT reset at midnight.
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
    refresh();
  }, [userId, refresh]);

  const msLeft = Math.max(0, resetMs - Date.now());
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  const s = Math.floor((msLeft % 60_000) / 1000);
  const countdown =
    h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;

  const current = used ?? 0;
  const tier: UsageTier = !userId ? "anon" : (serverTier ?? "free");
  const limit = serverLimit;
  // No tier is truly unlimited anymore — "unlimited" has a fair-use cap.
  const unlimited = false;
  const lifetime = tier === "anon";
  return {
    used: current,
    limit: limit ?? (tier === "anon" ? ANON_LIFETIME_LIMIT : FREE_DAILY_LIMIT),
    unlimited,
    tier,
    lifetime,
    remaining: unlimited ? Infinity : Math.max(0, (limit ?? 0) - current),
    atLimit: !unlimited && current >= (limit ?? 0),
    countdown,
    loaded: used !== null,
    logGeneration,
    refresh,
  };
}
