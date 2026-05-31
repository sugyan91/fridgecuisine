import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_DAILY_LIMIT = 5;

export type QuotaCheck =
  | { ok: true }
  | { ok: false; error: string; code: "rate_limit" };

/**
 * Server-side per-user daily quota check.
 * Counts rows inserted into `recipe_generations` in the last 24h for the
 * authenticated user and rejects when the free daily limit is reached.
 */
export async function checkAiQuota(
  supabase: SupabaseClient,
  userId: string,
): Promise<QuotaCheck> {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("recipe_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceIso);
  if (error) {
    // Fail-closed on quota lookup failures so we never silently allow over-limit usage.
    console.error("checkAiQuota lookup failed", error);
    return {
      ok: false,
      error: "Couldn't verify your daily usage. Please try again in a moment.",
      code: "rate_limit",
    };
  }
  if ((count ?? 0) >= FREE_DAILY_LIMIT) {
    return {
      ok: false,
      error: `You've reached the daily limit of ${FREE_DAILY_LIMIT} AI generations. Try again tomorrow.`,
      code: "rate_limit",
    };
  }
  return { ok: true };
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