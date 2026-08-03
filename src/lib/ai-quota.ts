/**
 * Client-safe daily AI quota constants.
 *
 * Keep this file free of server-only imports so the UI and the server can
 * share a single source of truth for tier limits.
 */

export type PlanTier = "free" | "basic" | "unlimited";
export type QuotaBucket = "recipes" | "helpers";

/**
 * Per-tier daily limits split by cost bucket.
 * - `recipes`: full/lite recipe generation (the expensive call).
 * - `helpers`: cheap AI features (dish helper, swaps, daily-dinner tweaks,
 *   paid-teaser peeks, fridge vision, recipe images).
 */
export const ENDPOINT_LIMITS: Record<PlanTier, Record<QuotaBucket, number>> = {
  free: { recipes: 3, helpers: 5 },
  basic: { recipes: 8, helpers: 20 },
  // "Unlimited" is marketed as unlimited but enforces a fair-use daily cap
  // to protect against abuse / runaway AI cost from a single account.
  unlimited: { recipes: 30, helpers: 100 },
};

/** Back-compat export — free tier recipe limit. */
export const FREE_DAILY_LIMIT = ENDPOINT_LIMITS.free.recipes;

/** Back-compat alias for the old combined limit. */
export const TIER_LIMITS: Record<PlanTier, number> = {
  free: ENDPOINT_LIMITS.free.recipes,
  basic: ENDPOINT_LIMITS.basic.recipes,
  unlimited: ENDPOINT_LIMITS.unlimited.recipes,
};

/** Minimum seconds between two AI generations for the same user (all tiers). */
export const RATE_LIMIT_SECONDS = 8;
