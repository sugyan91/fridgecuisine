import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ShieldAlert, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { adminGetAiUsageDashboard, type AiUsageDashboard } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/usage")({
  head: () => ({
    meta: [
      { title: "AI usage dashboard — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminUsagePage,
});

type Range = "24h" | "7d" | "30d" | "90d";
type Endpoint = "all" | "recipes" | "dish-image" | "ingredient-swap" | "dish-helper" | "fridge-vision";

function rangeToIso(range: Range): { fromIso: string; toIso: string; bucket: "hour" | "day" } {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now);
  if (range === "24h") from.setHours(from.getHours() - 24);
  else if (range === "7d") from.setDate(from.getDate() - 7);
  else if (range === "30d") from.setDate(from.getDate() - 30);
  else from.setDate(from.getDate() - 90);
  return {
    fromIso: from.toISOString(),
    toIso: to,
    bucket: range === "24h" ? "hour" : "day",
  };
}

function AdminUsagePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);
  const isAdmin = useIsAdmin(userId);

  if (userId === null) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h1 className="text-2xl font-black">Admins only</h1>
        <Button className="mt-6" onClick={() => navigate({ to: "/" })}>Back home</Button>
      </div>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const fetchDashboard = useServerFn(adminGetAiUsageDashboard);
  const [range, setRange] = useState<Range>("7d");
  const [endpoint, setEndpoint] = useState<Endpoint>("all");
  const [data, setData] = useState<AiUsageDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      const { fromIso, toIso, bucket } = rangeToIso(range);
      try {
        const res = await fetchDashboard({
          data: { fromIso, toIso, endpoint, bucket, topLimit: 20 },
        });
        setData(res);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [fetchDashboard, range, endpoint],
  );

  useEffect(() => { load(); }, [load]);

  const maxSeries = Math.max(1, ...(data?.series.map((s) => s.total) ?? [0]));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/admin/quota"><ArrowLeft className="mr-2 h-4 w-4" /> Admin</Link>
        </Button>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">AI usage dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Calls to every AI endpoint, split by user, endpoint, and time.
              Cache hits count toward user activity but do not spend AI credits.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Time range</Label>
              <Select value={range} onValueChange={(v) => setRange(v as Range)}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Endpoint</Label>
              <Select value={endpoint} onValueChange={(v) => setEndpoint(v as Endpoint)}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All endpoints</SelectItem>
                  <SelectItem value="recipes">recipes</SelectItem>
                  <SelectItem value="dish-image">dish-image</SelectItem>
                  <SelectItem value="ingredient-swap">ingredient-swap</SelectItem>
                  <SelectItem value="dish-helper">dish-helper</SelectItem>
                  <SelectItem value="fridge-vision">fridge-vision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Totals */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Total events" value={data?.totals.total ?? 0} />
          <Stat label="AI calls" value={data?.totals.aiCalls ?? 0} hint="Not served from cache" />
          <Stat label="Cache hits" value={data?.totals.cacheHits ?? 0} hint="No AI spend" />
          <Stat
            label="Unique callers"
            value={(data?.totals.uniqueUsers ?? 0) + (data?.totals.uniqueAnon ?? 0)}
            hint={`${data?.totals.uniqueUsers ?? 0} users · ${data?.totals.uniqueAnon ?? 0} anon`}
          />
        </section>

        {/* By endpoint */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">By endpoint</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Endpoint</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">AI calls</th>
                  <th className="px-4 py-2 text-right">Cache hits</th>
                  <th className="px-4 py-2 text-right">Cache %</th>
                </tr>
              </thead>
              <tbody>
                {(data?.byEndpoint ?? []).map((row) => (
                  <tr key={row.endpoint} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{row.endpoint}</td>
                    <td className="px-4 py-2 text-right">{row.total}</td>
                    <td className="px-4 py-2 text-right">{row.aiCalls}</td>
                    <td className="px-4 py-2 text-right">{row.cacheHits}</td>
                    <td className="px-4 py-2 text-right">
                      {row.total ? Math.round((row.cacheHits / row.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
                {!data?.byEndpoint.length && (
                  <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>No events in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Time series (mini bar chart) */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">Over time ({range === "24h" ? "hourly" : "daily"})</h2>
          <div className="rounded-2xl border border-border bg-card p-4">
            {data?.series.length ? (
              <div className="flex h-40 items-end gap-1">
                {data.series.map((s) => (
                  <div key={s.bucket} className="group relative flex-1 min-w-[6px]">
                    <div
                      className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors"
                      style={{ height: `${(s.total / maxSeries) * 100}%` }}
                      title={`${s.bucket}\nTotal ${s.total} · AI ${s.aiCalls} · cache ${s.cacheHits}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No events in this range.</p>
            )}
            {data?.series.length ? (
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>{data.series[0].bucket}</span>
                <span>{data.series[data.series.length - 1].bucket}</span>
              </div>
            ) : null}
          </div>
        </section>

        {/* Top users */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">Top signed-in users</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">AI calls</th>
                  <th className="px-4 py-2 text-right">Cache</th>
                  <th className="px-4 py-2">Endpoints</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topUsers ?? []).map((u) => (
                  <tr key={u.userId} className="border-t border-border">
                    <td className="px-4 py-2">
                      <div className="font-medium">{u.email ?? u.username ?? u.userId.slice(0, 8)}</div>
                      {u.username && <div className="text-xs text-muted-foreground">@{u.username}</div>}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{u.total}</td>
                    <td className="px-4 py-2 text-right">{u.aiCalls}</td>
                    <td className="px-4 py-2 text-right">{u.cacheHits}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {Object.entries(u.endpoints)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => `${k}:${v}`)
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
                {!data?.topUsers.length && (
                  <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>No signed-in activity.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top anon */}
        <section className="mt-10 mb-16">
          <h2 className="text-xl font-bold mb-3">Top anonymous callers</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Key</th>
                  <th className="px-4 py-2">Kind</th>
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">AI calls</th>
                  <th className="px-4 py-2 text-right">Cache</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topAnon ?? []).map((a) => (
                  <tr key={a.key} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">{a.key.slice(0, 16)}…</td>
                    <td className="px-4 py-2 text-xs">{a.kind}</td>
                    <td className="px-4 py-2 text-right font-semibold">{a.total}</td>
                    <td className="px-4 py-2 text-right">{a.aiCalls}</td>
                    <td className="px-4 py-2 text-right">{a.cacheHits}</td>
                  </tr>
                ))}
                {!data?.topAnon.length && (
                  <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>No anonymous activity.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-3xl font-black text-foreground">{value.toLocaleString()}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
