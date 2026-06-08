import type { SupabaseClient } from "@supabase/supabase-js";

export type Tier = "free" | "basic" | "unlimited";

export const TIER_LIMITS: Record<Tier, number> = {
  free: 2,
  basic: 10,
  // "Unlimited" is marketed as unlimited but enforces a fair-use daily cap
  // to protect against abuse / runaway AI cost from a single account.
  unlimited: 50,
};

/** Minimum seconds between two AI generations for the same user (all tiers). */
export const RATE_LIMIT_SECONDS = 3;

/** Back-compat export — free tier limit. */
export const FREE_DAILY_LIMIT = TIER_LIMITS.free;

const PRICE_TO_TIER: Record<string, Tier> = {
  premium_monthly: "basic",
  unlimited_monthly: "unlimited",
};

function isActiveStatus(
  status: string | null | undefined,
  periodEndIso: string | null | undefined,
): boolean {
  if (!status) return false;
  const periodEndMs = periodEndIso ? new Date(periodEndIso).getTime() : null;
  const future = periodEndMs === null || periodEndMs > Date.now();
  if (["active", "trialing", "past_due"].includes(status) && future) return true;
  if (status === "canceled" && periodEndMs !== null && periodEndMs > Date.now()) return true;
  return false;
}

/**
 * Resolve the user's current paid tier by reading the newest subscriptions
 * row across both Stripe environments (sandbox + live). Returns "free" when
 * no active subscription is found.
 */
export async function resolveTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<Tier> {
  const { data } = await supabase
    .from("subscriptions")
    .select("status, price_id, current_period_end")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (!data || data.length === 0) return "free";
  for (const row of data) {
    if (!isActiveStatus(row.status as string, row.current_period_end as string | null)) continue;
    const tier = PRICE_TO_TIER[row.price_id as string];
    if (tier) return tier;
  }
  return "free";
}

export type QuotaCheck =
  | { ok: true; tier: Tier }
  | {
      ok: false;
      error: string;
      code: "rate_limit" | "too_fast";
      tier: Tier;
      requiresUpgrade?: true;
      suggestedPlan?: "basic" | "unlimited";
      retryAfterSeconds?: number;
    };

/**
 * Server-side per-user daily quota check.
 * Counts rows inserted into `recipe_generations` in the last 24h for the
 * authenticated user and rejects when their tier's daily limit is reached.
 */
export async function checkAiQuota(
  supabase: SupabaseClient,
  userId: string,
): Promise<QuotaCheck> {
  const tier = await resolveTier(supabase, userId);
  const limit = TIER_LIMITS[tier];

  // Rate limit: reject if last generation < RATE_LIMIT_SECONDS ago.
  const { data: last, error: lastErr } = await supabase
    .from("recipe_generations")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lastErr && last?.created_at) {
    const elapsedMs = Date.now() - new Date(last.created_at as string).getTime();
    const minMs = RATE_LIMIT_SECONDS * 1000;
    if (elapsedMs < minMs) {
      const retryAfterSeconds = Math.ceil((minMs - elapsedMs) / 1000);
      return {
        ok: false,
        error: `Slow down — try again in ${retryAfterSeconds}s.`,
        code: "too_fast",
        tier,
        retryAfterSeconds,
      };
    }
  }

  // Daily quota — count rows in the last 24h.
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("recipe_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceIso);
  if (error) {
    console.error("checkAiQuota lookup failed", error);
    return {
      ok: false,
      error: "Couldn't verify your daily usage. Please try again in a moment.",
      code: "rate_limit",
      tier,
    };
  }
  if ((count ?? 0) >= limit) {
    const suggestedPlan: "basic" | "unlimited" | undefined =
      tier === "basic" ? "unlimited" : tier === "free" ? "basic" : undefined;
    const upgradeCopy =
      tier === "unlimited"
        ? `You've hit today's fair-use cap of ${limit} recipes. Resets at midnight.`
        : tier === "basic"
          ? `You've used your ${limit} recipes today. Upgrade to Unlimited for $19.99/mo.`
          : `You've used your ${limit} free recipes today. Upgrade to Basic ($5.99/mo) or Unlimited ($19.99/mo).`;
    return {
      ok: false,
      error: upgradeCopy,
      code: "rate_limit",
      tier,
      ...(suggestedPlan ? { requiresUpgrade: true as const, suggestedPlan } : {}),
    };
  }
  return { ok: true, tier };
}

/** Records a successful AI generation against the user's daily quota. */
export async function recordAiGeneration(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("recipe_generations")
    .insert({ user_id: userId });
  if (error) {
    console.error("recordAiGeneration insert failed", error);
  }
}