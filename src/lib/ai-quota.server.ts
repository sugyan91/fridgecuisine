import type { SupabaseClient } from "@supabase/supabase-js";
import { logAbuseEvent } from "./abuse-logging.server";
import {
  ENDPOINT_LIMITS,
  FREE_DAILY_LIMIT,
  RATE_LIMIT_SECONDS,
  TIER_LIMITS,
  type PlanTier,
  type QuotaBucket,
} from "./ai-quota";

export interface CallerSignals {
  ip?: string | null;
  userAgent?: string | null;
}

export type Tier = PlanTier;
export { ENDPOINT_LIMITS, FREE_DAILY_LIMIT, TIER_LIMITS, RATE_LIMIT_SECONDS };
export type { QuotaBucket };


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

function bucketForEndpoint(endpoint: string): QuotaBucket {
  return endpoint === "recipes" ? "recipes" : "helpers";
}

export type QuotaCheck =
  | { ok: true; tier: Tier; bucket: QuotaBucket }
  | {
      ok: false;
      error: string;
      code: "rate_limit";
      tier: Tier;
      bucket: QuotaBucket;
      requiresUpgrade?: true;
      suggestedPlan?: "basic" | "unlimited";
      retryAfterSeconds?: number;
    };

/**
 * Server-side per-user daily quota check, now split by endpoint bucket.
 * `endpoint` should be the actual feature name (e.g. "recipes",
 * "dish-helper", "ingredient-swap"). Non-recipe endpoints share the
 * cheaper "helpers" bucket.
 */
export async function checkAiQuota(
  supabase: SupabaseClient,
  userId: string,
  signals: CallerSignals = {},
  endpoint = "recipes",
): Promise<QuotaCheck> {
  const tier = await resolveTier(supabase, userId);
  const bucket = bucketForEndpoint(endpoint);
  const limit = ENDPOINT_LIMITS[tier][bucket];

  // Rate limit: reject if last generation < RATE_LIMIT_SECONDS ago (any bucket).
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
      void logAbuseEvent({
        type: "user_rapid_request",
        userId,
        ip: signals.ip ?? null,
        userAgent: signals.userAgent ?? null,
        metadata: { elapsedMs, tier, retryAfterSeconds, bucket },
      });
      return {
        ok: false,
        error: `Slow down — try again in ${retryAfterSeconds}s.`,
        code: "rate_limit",
        tier,
        bucket,
        retryAfterSeconds,
      };
    }
  }

  // Daily quota — count rows in the helpers bucket or the recipes bucket.
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from("recipe_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceIso);
  if (bucket === "recipes") {
    query = query.eq("endpoint", "recipes");
  } else {
    query = query.neq("endpoint", "recipes");
  }
  const { count, error } = await query;
  if (error) {
    console.error("checkAiQuota lookup failed", error);
    return {
      ok: false,
      error: "Couldn't verify your daily usage. Please try again in a moment.",
      code: "rate_limit",
      tier,
      bucket,
    };
  }
  if ((count ?? 0) >= limit) {
    const suggestedPlan: "basic" | "unlimited" | undefined =
      tier === "basic" ? "unlimited" : tier === "free" ? "basic" : undefined;
    void logAbuseEvent({
      type: "user_quota_hit",
      severity: tier === "unlimited" ? "warn" : "info",
      userId,
      ip: signals.ip ?? null,
      userAgent: signals.userAgent ?? null,
      metadata: { tier, bucket, limit, used: count ?? 0 },
    });
    const upgradeCopy =
      bucket === "helpers"
        ? tier === "unlimited"
          ? `You've hit today's fair-use cap of ${limit} helper calls. Resets at midnight.`
          : tier === "basic"
            ? `You've used your ${limit} helper calls today. Upgrade to Unlimited for $19.99/mo.`
            : `You've used your ${limit} free helper calls today. Upgrade to Basic ($5.99/mo) or Unlimited ($19.99/mo).`
        : tier === "unlimited"
          ? `You've hit today's fair-use cap of ${limit} recipes. Resets at midnight.`
          : tier === "basic"
            ? `You've used your ${limit} recipes today. Upgrade to Unlimited for $19.99/mo.`
            : `You've used your ${limit} free recipes today. Upgrade to Basic ($5.99/mo) or Unlimited ($19.99/mo).`;
    return {
      ok: false,
      error: upgradeCopy,
      code: "rate_limit",
      tier,
      bucket,
      ...(suggestedPlan ? { requiresUpgrade: true as const, suggestedPlan } : {}),
    };
  }
  return { ok: true, tier, bucket };
}

/** Records a successful AI generation against the user's daily quota. */
export async function recordAiGeneration(
  supabase: SupabaseClient,
  userId: string,
  endpoint = "recipes",
): Promise<void> {
  const { error } = await supabase
    .from("recipe_generations")
    .insert({ user_id: userId, endpoint });
  if (error) {
    console.error("recordAiGeneration insert failed", error);
  }
}