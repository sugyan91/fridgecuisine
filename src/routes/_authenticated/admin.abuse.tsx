import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Download, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { adminListAbuseEvents } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/abuse")({
  head: () => ({
    meta: [
      { title: "Abuse events — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AbuseEventsPage,
});

const EVENT_TYPES = [
  { value: "all", label: "All signals" },
  { value: "anon_rapid_request", label: "Anon · rapid request" },
  { value: "anon_ip_change", label: "Anon · IP change" },
  { value: "anon_quota_hit", label: "Anon · quota hit" },
  { value: "user_rapid_request", label: "User · rapid request" },
  { value: "user_quota_hit", label: "User · quota hit" },
] as const;

const WINDOWS = [
  { value: 1, label: "Last 1h" },
  { value: 6, label: "Last 6h" },
  { value: 24, label: "Last 24h" },
  { value: 24 * 7, label: "Last 7d" },
  { value: 24 * 30, label: "Last 30d" },
] as const;

type AbuseEvent = {
  id: string;
  created_at: string;
  event_type: string;
  severity: string;
  user_id: string | null;
  fingerprint: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  metadata: unknown;
};

function severityClass(sev: string) {
  if (sev === "alert") return "bg-destructive/15 text-destructive";
  if (sev === "warn") return "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200";
  return "bg-muted text-muted-foreground";
}

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: AbuseEvent[]): string {
  const header = [
    "id",
    "created_at",
    "event_type",
    "severity",
    "user_id",
    "fingerprint",
    "ip_hash",
    "user_agent",
    "metadata",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.created_at,
        r.event_type,
        r.severity,
        r.user_id ?? "",
        r.fingerprint ?? "",
        r.ip_hash ?? "",
        r.user_agent ?? "",
        r.metadata ?? {},
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}

function AbuseEventsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  const isAdmin = useIsAdmin(userId);

  const [eventType, setEventType] =
    useState<(typeof EVENT_TYPES)[number]["value"]>("all");
  const [sinceHours, setSinceHours] =
    useState<(typeof WINDOWS)[number]["value"]>(24);
  const [rows, setRows] = useState<AbuseEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchEvents = useServerFn(adminListAbuseEvents);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchEvents({
          data: { eventType, sinceHours, limit: 500 },
        });
        setRows(res.events as AbuseEvent[]);
        setCounts(res.counts ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    },
    [eventType, sinceHours, fetchEvents],
  );

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  // Block render until admin is confirmed.
  if (userId === null) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h1 className="text-2xl font-black">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have permission to view this page.
        </p>
        <Button className="mt-6" onClick={() => navigate({ to: "/" })}>
          Back home
        </Button>
      </div>
    );
  }

  const onExport = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `abuse-events-${eventType}-${sinceHours}h-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Abuse events</h1>
            <p className="mt-2 text-muted-foreground">
              Recent anonymous and signed-in abuse signals — rapid requests, IP
              changes, and quota hits.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={onExport} disabled={!rows.length}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </header>

        {/* Filters */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Signal type
            </span>
            <select
              value={eventType}
              onChange={(e) =>
                setEventType(e.target.value as typeof eventType)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                  {t.value !== "all" && counts[t.value] != null
                    ? ` (${counts[t.value]})`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Time window
            </span>
            <select
              value={sinceHours}
              onChange={(e) =>
                setSinceHours(Number(e.target.value) as typeof sinceHours)
              }
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {/* Summary stats */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {EVENT_TYPES.filter((t) => t.value !== "all").map((t) => (
            <div
              key={t.value}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t.label}
              </div>
              <div className="mt-1 text-2xl font-black">
                {counts[t.value] ?? 0}
              </div>
            </div>
          ))}
        </section>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">IP hash</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      No events in this window. 🎉
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.event_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${severityClass(r.severity)}`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.user_id
                        ? `user:${r.user_id.slice(0, 8)}…`
                        : r.fingerprint
                          ? `fp:${r.fingerprint.slice(0, 12)}…`
                          : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {r.ip_hash ? r.ip_hash.slice(0, 12) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <pre className="max-w-md whitespace-pre-wrap break-all text-[11px] text-muted-foreground">
                        {JSON.stringify(r.metadata ?? {}, null, 0)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-3 text-xs text-muted-foreground">
          Showing up to 500 rows. CSV export includes the rows above.
        </p>
      </div>
    </div>
  );
}