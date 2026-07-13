// Server-only cache for AI results.
// Keyed by sha256(kind + normalized JSON input). Never import at module scope
// from client-reachable files — always `await import()` inside a handler.

import { createHash } from "crypto";

export type CacheKind =
  | "recipes"
  | "dish-image"
  | "ingredient-swap"
  | "dish-helper";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

export function hashKey(kind: CacheKind, input: unknown): string {
  return createHash("sha256")
    .update(kind)
    .update("\0")
    .update(stableStringify(input))
    .digest("hex");
}

export async function getCached<T>(
  kind: CacheKind,
  key: string,
): Promise<T | null> {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("ai_result_cache")
      .select("payload, expires_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (error || !data) return null;
    if (new Date(data.expires_at as string).getTime() <= Date.now()) return null;
    console.log(`[ai-cache] hit kind=${kind}`);
    return data.payload as T;
  } catch (err) {
    console.warn("[ai-cache] getCached error", err);
    return null;
  }
}

export async function putCached(
  kind: CacheKind,
  key: string,
  payload: unknown,
  ttlDays: number,
): Promise<void> {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const expiresAt = new Date(
      Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    await supabaseAdmin.from("ai_result_cache").upsert(
      {
        cache_key: key,
        kind,
        payload: payload as never,
        expires_at: expiresAt,
        hit_count: 0,
      },
      { onConflict: "cache_key" },
    );
  } catch (err) {
    console.warn("[ai-cache] putCached error", err);
  }
}