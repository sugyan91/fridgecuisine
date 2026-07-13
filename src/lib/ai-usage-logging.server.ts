// Fire-and-forget logger for every AI call. Never throws or blocks the caller.
export type AiEndpoint =
  | "recipes"
  | "dish-image"
  | "ingredient-swap"
  | "dish-helper"
  | "fridge-vision";

export function logAiUsage(entry: {
  endpoint: AiEndpoint;
  userId?: string | null;
  fingerprint?: string | null;
  ipHash?: string | null;
  cacheHit?: boolean;
}): void {
  void (async () => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("ai_usage_events").insert({
        endpoint: entry.endpoint,
        user_id: entry.userId ?? null,
        fingerprint: entry.fingerprint ?? null,
        ip_hash: entry.ipHash ?? null,
        cache_hit: !!entry.cacheHit,
      });
    } catch (err) {
      console.error("logAiUsage failed", err);
    }
  })();
}
