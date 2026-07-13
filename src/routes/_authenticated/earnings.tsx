import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, RefreshCw, TrendingUp, DollarSign, ShoppingBag, AlertCircle, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getMyEarnings, type EarningsDashboard, type EarningsRange,
} from "@/lib/earnings.functions";
import { getMyTipsSummary, type ChefTipsSummary } from "@/lib/tips.functions";

export const Route = createFileRoute("/_authenticated/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — FridgeCuisine" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: EarningsPage,
});

function fmtMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function EarningsPage() {
  const fetchEarnings = useServerFn(getMyEarnings);
  const fetchTips = useServerFn(getMyTipsSummary);
  const [range, setRange] = useState<EarningsRange>("30d");
  const [data, setData] = useState<EarningsDashboard | null>(null);
  const [tips, setTips] = useState<ChefTipsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useMemo(() => async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, t] = await Promise.all([
        fetchEarnings({ data: { range } }),
        fetchTips({ data: { range } }).catch(() => null),
      ]);
      setData(res);
      setTips(t);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchEarnings, fetchTips, range]);

  useEffect(() => { load(); }, [load]);

  const currency = data?.currency ?? "usd";
  const maxSeries = Math.max(1, ...(data?.series.map((s) => s.gross_cents) ?? [0]));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/account"><ArrowLeft className="mr-2 h-4 w-4" /> Back to account</Link>
        </Button>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Your earnings</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Sales and payouts from your paid recipes and cookbooks. Payouts are handled by
              Stripe on their normal schedule — this page shows what you've earned, not the
              date the money hits your bank.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs">Time range</Label>
              <Select value={range} onValueChange={(v) => setRange(v as EarningsRange)}>
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
            <Button asChild variant="outline">
              <Link to="/analytics">Analytics</Link>
            </Button>
          </div>
        </header>

        {data && !data.isChef && (
          <div className="mb-6 rounded-2xl border-2 border-border bg-card p-6 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 mt-0.5 text-paprika" />
            <div className="flex-1">
              <p className="font-black">You haven't set up selling yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete your chef profile and Stripe onboarding to start earning from your recipes.
              </p>
              <Button asChild className="mt-4">
                <Link to="/sell">Become a chef</Link>
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Totals */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat
            icon={<DollarSign className="h-4 w-4" />}
            label="Net (in range)"
            value={fmtMoney(data?.totals.net_cents ?? 0, currency)}
            hint={`Gross ${fmtMoney(data?.totals.gross_cents ?? 0, currency)}`}
          />
          <Stat
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Sales (in range)"
            value={(data?.totals.sales_count ?? 0).toLocaleString()}
            hint={data?.totals.refunded_cents ? `Refunds ${fmtMoney(data.totals.refunded_cents, currency)}` : "No refunds"}
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Lifetime net"
            value={fmtMoney(data?.totalsLifetime.net_cents ?? 0, currency)}
            hint={`Gross ${fmtMoney(data?.totalsLifetime.gross_cents ?? 0, currency)}`}
          />
          <Stat
            icon={<ShoppingBag className="h-4 w-4" />}
            label="Lifetime sales"
            value={(data?.totalsLifetime.sales_count ?? 0).toLocaleString()}
            hint={`Platform fees ${fmtMoney(data?.totalsLifetime.fee_cents ?? 0, currency)}`}
          />
        </section>

        {/* Tips */}
        <section className="mt-6">
          <div className="rounded-2xl border-2 border-border bg-turmeric/10 p-4 flex flex-wrap items-center gap-4">
            <div className="size-10 rounded-xl bg-turmeric text-foreground border-2 border-border grid place-items-center">
              <Coffee className="size-5" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tips (in range)</p>
              <p className="text-2xl font-black">
                {fmtMoney(tips?.rangeNetCents ?? 0, tips?.currency ?? currency)}{" "}
                <span className="text-sm text-muted-foreground font-normal">from {tips?.rangeCount ?? 0} tip{(tips?.rangeCount ?? 0) === 1 ? "" : "s"}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lifetime: {fmtMoney(tips?.totalNetCents ?? 0, tips?.currency ?? currency)} · {tips?.totalCount ?? 0} tips
              </p>
            </div>
            {tips && tips.recent.length > 0 && (
              <div className="w-full text-xs text-muted-foreground border-t-2 border-border pt-2">
                <p className="font-black uppercase tracking-widest mb-1">Recent tips</p>
                <ul className="space-y-1">
                  {tips.recent.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex justify-between gap-3">
                      <span className="truncate">
                        <span className="font-black">{t.sender_name ?? "Someone"}</span>
                        {t.message ? ` — "${t.message}"` : ""}
                      </span>
                      <span className="font-black text-foreground shrink-0">{fmtMoney(t.net_cents, t.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Series */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">Sales over time</h2>
          <div className="rounded-2xl border-2 border-border bg-card p-4">
            {data?.series.length ? (
              <>
                <div className="flex h-40 items-end gap-1">
                  {data.series.map((s) => (
                    <div key={s.bucket} className="group relative flex-1 min-w-[8px]">
                      <div
                        className="w-full rounded-t bg-paprika/70 hover:bg-paprika transition-colors"
                        style={{ height: `${(s.gross_cents / maxSeries) * 100}%` }}
                        title={`${s.bucket}\nGross ${fmtMoney(s.gross_cents, currency)} · Net ${fmtMoney(s.net_cents, currency)} · Sales ${s.sales}`}
                      />
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
                No sales in this range yet.
              </p>
            )}
          </div>
        </section>

        {/* Top recipes */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">Top selling in range</h2>
          <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Recipe</th>
                  <th className="px-4 py-2 text-right">Sales</th>
                  <th className="px-4 py-2 text-right">Gross</th>
                  <th className="px-4 py-2 text-right">Net</th>
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
                    <td className="px-4 py-2 text-right">{r.sales}</td>
                    <td className="px-4 py-2 text-right">{fmtMoney(r.gross_cents, currency)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{fmtMoney(r.net_cents, currency)}</td>
                  </tr>
                ))}
                {!data?.topRecipes.length && (
                  <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>No sales yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent sales */}
        <section className="mt-10 mb-16">
          <h2 className="text-xl font-bold mb-3">Recent sales</h2>
          <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2 text-right">Gross</th>
                  <th className="px-4 py-2 text-right">Your net</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentSales ?? []).map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(s.purchased_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      {s.recipe_title ?? s.cookbook_title ?? "—"}
                      {s.cookbook_title && <span className="text-xs text-muted-foreground ml-1">(cookbook)</span>}
                    </td>
                    <td className="px-4 py-2 text-right">{fmtMoney(s.gross_cents, s.currency)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{fmtMoney(s.net_cents, s.currency)}</td>
                  </tr>
                ))}
                {!data?.recentSales.length && (
                  <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>No sales yet.</td></tr>
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
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}{label}
      </div>
      <div className="mt-1 text-2xl md:text-3xl font-black text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}