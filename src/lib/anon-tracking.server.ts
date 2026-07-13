// Server-only helpers for tracking anonymous (not signed-in) AI usage.
//
// Strategy: combine the caller's IP with a random ID stored in an httpOnly
// signed cookie ("fc_anon") to produce a fingerprint. Lookups/writes go
// through supabaseAdmin into public.anonymous_ai_usage. Clearing cookies
// resets the cookie ID but not the IP component, raising the cost of abuse.
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { hashIp, logAbuseEvent } from "./abuse-logging.server";

/** Minimum seconds between two anonymous generations from the same fingerprint. */
const ANON_RATE_LIMIT_SECONDS = 3;

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

function getUserAgent(req: Request): string | null {
  return req.headers.get("user-agent");
}

/**
 * Resolves a stable, hashed fingerprint for the current anonymous caller.
 * Sets the signed `fc_anon` cookie on first visit. Returns the fingerprint
 * (sha256 of ip + cookie id + secret), suitable for use as a primary key.
 */
export interface AnonContext {
  fingerprint: string;
  ip: string;
  ipHash: string;
  userAgent: string | null;
  isNewCookie: boolean;
}

export function resolveAnonContext(): AnonContext {
  const req = getRequest();
  if (!req) throw new Error("No request context");

  const cookies = parseCookies(req.headers.get("cookie"));
  const raw = cookies[COOKIE_NAME];
  let cookieId: string | null = null;
  if (raw) {
    const [id, sig] = raw.split(".");
    if (id && sig && verify(id, sig)) cookieId = id;
  }
  let isNewCookie = false;
  if (!cookieId) {
    cookieId = randomBytes(16).toString("base64url");
    isNewCookie = true;
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
  const fingerprint = createHash("sha256")
    .update(ip + "|" + cookieId + "|" + getSecret())
    .digest("hex");
  return {
    fingerprint,
    ip,
    ipHash: hashIp(ip) ?? "",
    userAgent: getUserAgent(req),
    isNewCookie,
  };
}

/** Back-compat alias. */
export function resolveAnonFingerprint(): string {
  return resolveAnonContext().fingerprint;
}

/** Daily cap for anonymous (not signed-in) generations, per fingerprint AND per IP. */
export const ANON_DAILY_LIMIT = 1;
/** Back-compat alias kept so older imports keep building; semantics are now daily. */
export const ANON_LIFETIME_LIMIT = ANON_DAILY_LIMIT;

function todayDate(): string {
  // ISO YYYY-MM-DD in UTC. Matches Postgres `current_date` semantics.
  return new Date().toISOString().slice(0, 10);
}

export type AnonUsage = { used: number; limit: number; fingerprint: string };

export async function getAnonUsage(): Promise<AnonUsage> {
  const { fingerprint, ipHash } = resolveAnonContext();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = todayDate();
  const [{ data: fpRow }, { data: ipRow }] = await Promise.all([
    supabaseAdmin
      .from("anonymous_ai_usage")
      .select("day_count, day_date")
      .eq("fingerprint", fingerprint)
      .maybeSingle(),
    ipHash
      ? supabaseAdmin
          .from("anonymous_ai_usage_by_ip")
          .select("day_count, day_date")
          .eq("ip_hash", ipHash)
          .maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
  ]);
  const fpUsed =
    fpRow && (fpRow.day_date as string) === today
      ? ((fpRow.day_count as number | undefined) ?? 0)
      : 0;
  const ipUsed =
    ipRow && (ipRow.day_date as string) === today
      ? ((ipRow.day_count as number | undefined) ?? 0)
      : 0;
  return {
    fingerprint,
    used: Math.max(fpUsed, ipUsed),
    limit: ANON_DAILY_LIMIT,
  };
}

export type AnonQuotaResult =
  | { ok: true; fingerprint: string; used: number; limit: number }
  | { ok: false; error: string; code: "rate_limit"; used: number; limit: number; requiresSignIn: true };

export async function checkAnonQuota(): Promise<AnonQuotaResult> {
  const ctx = resolveAnonContext();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = todayDate();
  const [{ data: row }, { data: ipRow }] = await Promise.all([
    supabaseAdmin
      .from("anonymous_ai_usage")
      .select("count, day_count, day_date, last_ip_hash, last_seen_at")
      .eq("fingerprint", ctx.fingerprint)
      .maybeSingle(),
    ctx.ipHash
      ? supabaseAdmin
          .from("anonymous_ai_usage_by_ip")
          .select("day_count, day_date")
          .eq("ip_hash", ctx.ipHash)
          .maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
  ]);

  const fpUsedToday =
    row && (row.day_date as string) === today
      ? ((row.day_count as number | undefined) ?? 0)
      : 0;
  const ipUsedToday =
    ipRow && (ipRow.day_date as string) === today
      ? ((ipRow.day_count as number | undefined) ?? 0)
      : 0;
  const used = Math.max(fpUsedToday, ipUsedToday);
  const limit = ANON_DAILY_LIMIT;

  // Signal: same fingerprint but the rolling IP hash has flipped. Because the
  // fingerprint itself includes the IP, this only fires when our stored
  // last_ip_hash differs from the current one — useful for spotting cookie
  // replay attempts across networks.
  if (row?.last_ip_hash && row.last_ip_hash !== ctx.ipHash) {
    void logAbuseEvent({
      type: "anon_ip_change",
      fingerprint: ctx.fingerprint,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { previousIpHash: row.last_ip_hash, usedSoFar: used },
    });
  }

  // Signal: rapid-fire requests from the same fingerprint.
  if (row?.last_seen_at) {
    const elapsedMs = Date.now() - new Date(row.last_seen_at as string).getTime();
    if (elapsedMs < ANON_RATE_LIMIT_SECONDS * 1000) {
      void logAbuseEvent({
        type: "anon_rapid_request",
        fingerprint: ctx.fingerprint,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { elapsedMs, usedSoFar: used },
      });
    }
  }

  if (used >= limit) {
    void logAbuseEvent({
      type: "anon_quota_hit",
      fingerprint: ctx.fingerprint,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { used, limit },
    });
    // Also bump the counter on the row so we can surface "this fingerprint
    // has hit the wall N times" without scanning the events table.
    void supabaseAdmin
      .from("anonymous_ai_usage")
      .update({ quota_hit_count: ((row?.count as number) ?? 0) + 1 } as never)
      .eq("fingerprint", ctx.fingerprint);
    return {
      ok: false,
      code: "rate_limit",
      error: "You've used your 2 free recipes for today. Sign up free to keep cooking, or come back tomorrow.",
      used,
      limit,
      requiresSignIn: true,
    };
  }
  return { ok: true, fingerprint: ctx.fingerprint, used, limit };
}

/** Increment the anonymous usage counter for the given fingerprint. */
export async function recordAnonGeneration(fingerprint: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Refresh the latest snapshot for abuse-signal tracking on top of the
  // counter bump.
  const ctx = (() => {
    try { return resolveAnonContext(); } catch { return null; }
  })();
  const today = todayDate();
  const { data: existing } = await supabaseAdmin
    .from("anonymous_ai_usage")
    .select("count, day_count, day_date, last_ip_hash, ip_change_count, rapid_request_count, last_seen_at")
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  const nextCount = ((existing?.count as number | undefined) ?? 0) + 1;
  const prevDay = (existing?.day_date as string | undefined) ?? null;
  const prevDayCount = prevDay === today
    ? ((existing?.day_count as number | undefined) ?? 0)
    : 0;
  const nextDayCount = prevDayCount + 1;
  const prevIpHash = (existing?.last_ip_hash as string | null) ?? null;
  const currentIpHash = ctx?.ipHash ?? prevIpHash;
  const ipChanged = !!prevIpHash && !!currentIpHash && prevIpHash !== currentIpHash;
  const prevLastSeen = existing?.last_seen_at as string | null | undefined;
  const wasRapid = !!prevLastSeen &&
    Date.now() - new Date(prevLastSeen).getTime() < ANON_RATE_LIMIT_SECONDS * 1000;
  const { error } = await supabaseAdmin
    .from("anonymous_ai_usage")
    .upsert(
      {
        fingerprint,
        count: nextCount,
        day_count: nextDayCount,
        day_date: today,
        last_seen_at: new Date().toISOString(),
        last_ip_hash: currentIpHash,
        last_user_agent: ctx?.userAgent ?? null,
        ip_change_count:
          ((existing?.ip_change_count as number | undefined) ?? 0) + (ipChanged ? 1 : 0),
        rapid_request_count:
          ((existing?.rapid_request_count as number | undefined) ?? 0) + (wasRapid ? 1 : 0),
      },
      { onConflict: "fingerprint" },
    );
  if (error) console.error("recordAnonGeneration failed", error);

  // Also bump the per-IP daily counter so cookie clearing can't reset the cap.
  if (currentIpHash) {
    const { data: ipExisting } = await supabaseAdmin
      .from("anonymous_ai_usage_by_ip")
      .select("day_count, day_date, total_count")
      .eq("ip_hash", currentIpHash)
      .maybeSingle();
    const ipPrevDay = (ipExisting?.day_date as string | undefined) ?? null;
    const ipPrevDayCount = ipPrevDay === today
      ? ((ipExisting?.day_count as number | undefined) ?? 0)
      : 0;
    const { error: ipErr } = await supabaseAdmin
      .from("anonymous_ai_usage_by_ip")
      .upsert(
        {
          ip_hash: currentIpHash,
          day_count: ipPrevDayCount + 1,
          day_date: today,
          last_seen_at: new Date().toISOString(),
          total_count: ((ipExisting?.total_count as number | undefined) ?? 0) + 1,
        },
        { onConflict: "ip_hash" },
      );
    if (ipErr) console.error("recordAnonGeneration by_ip failed", ipErr);
  }
}