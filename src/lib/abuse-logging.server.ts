// Server-only logging of abuse signals (rapid requests, IP changes, quota hits).
// Persists structured events to public.abuse_events and emits a [ABUSE] console
// line so they show up in server logs / alerting tooling.
import { createHash } from "node:crypto";

export type AbuseEventType =
  | "anon_rapid_request"
  | "anon_ip_change"
  | "anon_quota_hit"
  | "user_rapid_request"
  | "user_quota_hit";

export type AbuseSeverity = "info" | "warn" | "alert";

export interface AbuseEventInput {
  type: AbuseEventType;
  severity?: AbuseSeverity;
  userId?: string | null;
  fingerprint?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/** Hash a raw IP so we never persist it in plaintext. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update("ip_v1:" + salt + ":" + ip).digest("hex");
}

/**
 * Record an abuse event. Best-effort: failures are logged but never thrown so
 * callers can wrap any hot path without affecting user-visible behavior.
 */
export async function logAbuseEvent(event: AbuseEventInput): Promise<void> {
  const severity = event.severity ?? defaultSeverity(event.type);
  const ipHash = hashIp(event.ip);
  const payload = {
    event_type: event.type,
    severity,
    user_id: event.userId ?? null,
    fingerprint: event.fingerprint ?? null,
    ip_hash: ipHash,
    user_agent: event.userAgent ?? null,
    metadata: event.metadata ?? {},
  };

  // Always emit a structured console line so downstream log scrapers / alert
  // rules can fire even if the DB insert fails.
  const tag = severity === "alert" ? "[ABUSE:ALERT]" : severity === "warn" ? "[ABUSE:WARN]" : "[ABUSE]";
  console.warn(tag, JSON.stringify({
    type: event.type,
    userId: payload.user_id,
    fingerprint: payload.fingerprint?.slice(0, 12) ?? null,
    ipHash: payload.ip_hash?.slice(0, 12) ?? null,
    ua: event.userAgent?.slice(0, 80) ?? null,
    ...event.metadata,
  }));

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("abuse_events")
      .insert({ ...payload, metadata: payload.metadata as never });
    if (error) console.error("logAbuseEvent insert failed", error);
  } catch (err) {
    console.error("logAbuseEvent unexpected failure", err);
  }

  // Fire-and-forget spike detection for anonymous signals. Wrapped so a
  // detection failure can never break the calling hot path.
  if (event.type.startsWith("anon_")) {
    try {
      const { maybeFireAbuseSpikeAlert } = await import("./abuse-alerts.server");
      await maybeFireAbuseSpikeAlert();
    } catch (err) {
      console.error("maybeFireAbuseSpikeAlert failed", err);
    }
  }
}

function defaultSeverity(type: AbuseEventType): AbuseSeverity {
  switch (type) {
    case "anon_ip_change":
    case "anon_rapid_request":
    case "user_rapid_request":
      return "warn";
    case "anon_quota_hit":
    case "user_quota_hit":
      return "info";
    default:
      return "info";
  }
}