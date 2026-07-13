import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, RefreshCw, Eye, Heart, ShoppingBag, Coffee, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getMyStorefrontAnalytics,
  type StorefrontAnalytics,
  type AnalyticsRange,
} from "@/lib/storefront-analytics.functions";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Storefront analytics — FridgeCuisine" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AnalyticsPage,
});

function fmtMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch { return `$${(cents / 100).toFixed(2)}`; }
}

function AnalyticsPage() {
  const fetchAnalytics = useServerFn(getMyStorefrontAnalytics);
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [data, setData] = useState<StorefrontAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useMemo(() => async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchAnalytics({ data: { range } });
      setData(res);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [fetchAnalytics, range]);

  useEffect(() => { load(); }, [load]);

  const currency = data?.currency ?? "usd";
  const maxSeries = Math.max(
    1,
    ...(data?.series.flatMap((s) => [s.views, s.likes, s.sales, s.tips]) ?? [0]),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/account"><ArrowLeft className="mr-2 h-4 w-4" /> Back to account</Link>
        </Button>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Storefront analytics</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Views, likes, sales and tips across your public storefront, paid recipes and cookbooks.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs">Time range</Label>
              <Select value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="365d">Last 12 months</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {data && !data.isChef && (
          <div className="mb-6 rounded-2xl border-2 border-border bg-card p-6 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 mt-0.5 text-paprika" />
            <div className="flex-1">
              <p className="font-black">You don't have a chef storefront yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Set up your chef profile to get a public storefront and start tracking analytics.
              </p>
              <Button asChild className="mt-4"><Link to="/sell">Become a chef</Link></Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            icon={<Eye className="h-4 w-4" />}
            label="Views"
            value={(data?.totals.views ?? 0).toLocaleString()}
            hint={`Storefront ${data?.totals.storefront_views ?? 0} · Recipes ${data?.totals.recipe_views ?? 0} · Cookbooks ${data?.totals.cookbook_views ?? 0}`}
          />
          <Stat
            icon={<Heart className="h-4 w-4" />}
            label="Likes"
            value={(data?.totals.likes ?? 0).toLocaleString()}
            hint={`Lifetime ${data?.lifetime.likes ?? 0}`}
          />
          <Stat
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Recipe sales"
            value={(data?.totals.sales_count ?? 0).toLocaleString()}
            hint={`Net ${fmtMoney(data?.totals.sales_net_cents ?? 0, currency)}`}
          />
          <Stat
            icon={<Coffee className="h-4 w-4" />}
            label="Tips"
            value={(data?.totals.tips_count ?? 0).toLocaleString()}
            hint={`Net ${fmtMoney(data?.totals.tips_net_cents ?? 0, currency)}`}
          />
        </section>

        {/* Lifetime summary */}
        <section className="mt-4">
          <div className="rounded-2xl border-2 border-border bg-card p-4 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Lifetime views:</span>
              <span className="font-black">{(data?.lifetime.views ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Lifetime sales:</span>
              <span className="font-black">{(data?.lifetime.sales_count ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Lifetime tips:</span>
              <span className="font-black">{(data?.lifetime.tips_count ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Series chart */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Activity over time</h2>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <LegendDot color="bg-paprika" label="Views" />
              <LegendDot color="bg-turmeric" label="Likes" />
              <LegendDot color="bg-emerald-500" label="Sales" />
              <LegendDot color="bg-sky-500" label="Tips" />
            </div>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-4">
            {data?.series.length ? (
              <>
                <div className="flex h-48 items-end gap-1">
                  {data.series.map((s) => (
                    <div key={s.bucket} className="group relative flex-1 min-w-[10px] flex items-end gap-[2px]" title={`${s.bucket}\nViews ${s.views} · Likes ${s.likes} · Sales ${s.sales} · Tips ${s.tips}`}>
                      <Bar value={s.views} max={maxSeries} className="bg-paprika/80" />
                      <Bar value={s.likes} max={maxSeries} className="bg-turmeric" />
                      <Bar value={s.sales} max={maxSeries} className="bg-emerald-500" />
                      <Bar value={s.tips} max={maxSeries} className="bg-sky-500" />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>{data.series[0].bucket}</span>
                  <span>{data.series[data.series.length - 1].bucket}</span>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                No activity in this range yet.
              </p>
            )}
          </div>
        </section>

        {/* Top recipes */}
        <section className="mt-10 mb-16">
          <h2 className="text-xl font-bold mb-3">Top recipes (views + sales)</h2>
          <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Recipe</th>
                  <th className="px-4 py-2 text-right">Views</th>
                  <th className="px-4 py-2 text-right">Sales</th>
                  <th className="px-4 py-2 text-right">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topRecipes ?? []).map((r) => (
                  <tr key={r.paid_recipe_id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">
                      <Link to="/shop/$recipeId" params={{ recipeId: r.paid_recipe_id }} className="hover:underline">
                        {r.title ?? r.paid_recipe_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right">{r.views}</td>
                    <td className="px-4 py-2 text-right">{r.sales}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {r.views ? `${((r.sales / r.views) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
                {!data?.topRecipes.length && (
                  <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>Nothing to show yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
        {icon}{label}
      </div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div
      className={`flex-1 rounded-t ${className}`}
      style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? 2 : 0 }}
    />
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}