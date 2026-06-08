// Server-only helpers for tracking anonymous (not signed-in) AI usage.
//
// Strategy: combine the caller's IP with a random ID stored in an httpOnly
// signed cookie ("fc_anon") to produce a fingerprint. Lookups/writes go
// through supabaseAdmin into public.anonymous_ai_usage. Clearing cookies
// resets the cookie ID but not the IP component, raising the cost of abuse.
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const COOKIE_NAME = "fc_anon";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getSecret(): string {
  // Derive a stable HMAC secret from SUPABASE_SERVICE_ROLE_KEY so we don't
  // need a brand-new secret. Hash it once so we don't carry the raw key.
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!k) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY for anon signing");
  return createHash("sha256").update("fc_anon_v1:" + k).digest("hex");
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function verify(value: string, sig: string): boolean {
  try {
    const expected = Buffer.from(sign(value));
    const got = Buffer.from(sig);
    return expected.length === got.length && timingSafeEqual(expected, got);
  } catch {
    return false;
  }
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function getClientIp(req: Request): string {
  const h = req.headers;
  const xff = h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0";
  return xff;
}

/**
 * Resolves a stable, hashed fingerprint for the current anonymous caller.
 * Sets the signed `fc_anon` cookie on first visit. Returns the fingerprint
 * (sha256 of ip + cookie id + secret), suitable for use as a primary key.
 */
export function resolveAnonFingerprint(): string {
  const req = getRequest();
  if (!req) throw new Error("No request context");

  const cookies = parseCookies(req.headers.get("cookie"));
  const raw = cookies[COOKIE_NAME];
  let cookieId: string | null = null;
  if (raw) {
    const [id, sig] = raw.split(".");
    if (id && sig && verify(id, sig)) cookieId = id;
  }
  if (!cookieId) {
    cookieId = randomBytes(16).toString("base64url");
    const signed = `${cookieId}.${sign(cookieId)}`;
    const cookie = [
      `${COOKIE_NAME}=${encodeURIComponent(signed)}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      `Max-Age=${COOKIE_MAX_AGE}`,
    ].join("; ");
    try { setResponseHeader("set-cookie", cookie); } catch { /* noop during edge cases */ }
  }

  const ip = getClientIp(req);
  return createHash("sha256")
    .update(ip + "|" + cookieId + "|" + getSecret())
    .digest("hex");
}

export const ANON_LIFETIME_LIMIT = 1;

export type AnonUsage = { used: number; limit: number; fingerprint: string };

export async function getAnonUsage(): Promise<AnonUsage> {
  const fingerprint = resolveAnonFingerprint();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("anonymous_ai_usage")
    .select("count")
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  return {
    fingerprint,
    used: (data?.count as number | undefined) ?? 0,
    limit: ANON_LIFETIME_LIMIT,
  };
}

export type AnonQuotaResult =
  | { ok: true; fingerprint: string; used: number; limit: number }
  | { ok: false; error: string; code: "rate_limit"; used: number; limit: number; requiresSignIn: true };

export async function checkAnonQuota(): Promise<AnonQuotaResult> {
  const { fingerprint, used, limit } = await getAnonUsage();
  if (used >= limit) {
    return {
      ok: false,
      code: "rate_limit",
      error: "Sign up free for 2 recipes every day.",
      used,
      limit,
      requiresSignIn: true,
    };
  }
  return { ok: true, fingerprint, used, limit };
}

/** Increment the anonymous usage counter for the given fingerprint. */
export async function recordAnonGeneration(fingerprint: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Upsert + increment in one round trip.
  const { data: existing } = await supabaseAdmin
    .from("anonymous_ai_usage")
    .select("count")
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  const nextCount = ((existing?.count as number | undefined) ?? 0) + 1;
  const { error } = await supabaseAdmin
    .from("anonymous_ai_usage")
    .upsert(
      {
        fingerprint,
        count: nextCount,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "fingerprint" },
    );
  if (error) console.error("recordAnonGeneration failed", error);
}