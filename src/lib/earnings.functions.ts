import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EarningsRange = "7d" | "30d" | "90d" | "365d" | "all";

export type EarningsTotals = {
  gross_cents: number;
  fee_cents: number;
  net_cents: number;
  sales_count: number;
  refunded_cents: number;
  currency: string;
};

export type EarningsSeriesPoint = {
  bucket: string;
  gross_cents: number;
  net_cents: number;
  sales: number;
};

export type EarningsTopRecipe = {
  paid_recipe_id: string;
  title: string | null;
  sales: number;
  gross_cents: number;
  net_cents: number;
};

export type EarningsCountry = {
  country: string;
  sales: number;
  gross_cents: number;
};

export type EarningsRecentSale = {
  id: string;
  purchased_at: string;
  gross_cents: number;
  net_cents: number;
  currency: string;
  buyer_country: string | null;
  paid_recipe_id: string | null;
  cookbook_id: string | null;
  recipe_title: string | null;
  cookbook_title: string | null;
};

export type EarningsCsvRow = {
  purchased_at: string;
  status: string;
  type: "recipe" | "cookbook" | "other";
  title: string;
  gross_cents: number;
  platform_fee_cents: number;
  chef_net_cents: number;
  currency: string;
};

export type EarningsDashboard = {
  currency: string;
  totals: EarningsTotals;
  totalsLifetime: EarningsTotals;
  series: EarningsSeriesPoint[];
  topRecipes: EarningsTopRecipe[];
  byCountry: EarningsCountry[];
  recentSales: EarningsRecentSale[];
  isChef: boolean;
};

function rangeToIso(range: EarningsRange): { from: string | null; bucket: "day" | "month" } {
  if (range === "all") return { from: null, bucket: "month" };
  const d = new Date();
  const map: Record<Exclude<EarningsRange, "all">, number> = {
    "7d": 7, "30d": 30, "90d": 90, "365d": 365,
  };
  d.setDate(d.getDate() - map[range]);
  return { from: d.toISOString(), bucket: range === "365d" ? "month" : "day" };
}

const emptyTotals = (currency: string): EarningsTotals => ({
  gross_cents: 0, fee_cents: 0, net_cents: 0,
  sales_count: 0, refunded_cents: 0, currency,
});

export const getMyEarnings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ range: z.enum(["7d", "30d", "90d", "365d", "all"]).default("30d") }).parse(i),
  )
  .handler(async ({ data, context }): Promise<EarningsDashboard> => {
    const { supabase, userId } = context;

    const { data: chef } = await supabase
      .from("chef_profiles")
      .select("payouts_enabled")
      .eq("user_id", userId)
      .maybeSingle();
    const isChef = !!chef;

    const { from, bucket } = rangeToIso(data.range);

    let query = supabase
      .from("recipe_purchases")
      .select("id, paid_recipe_id, cookbook_id, gross_cents, platform_fee_cents, chef_net_cents, currency, status, purchased_at, created_at")
      .eq("chef_user_id", userId)
      .order("purchased_at", { ascending: false, nullsFirst: false })
      .limit(5000);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const all = rows ?? [];

    const paid = all.filter((r) => r.status === "paid");
    const refunded = all.filter((r) => r.status === "refunded");

    const currency = (paid[0]?.currency ?? "usd").toLowerCase();

    const lifetime = emptyTotals(currency);
    for (const r of paid) {
      lifetime.gross_cents += r.gross_cents ?? 0;
      lifetime.fee_cents += r.platform_fee_cents ?? 0;
      lifetime.net_cents += r.chef_net_cents ?? 0;
      lifetime.sales_count += 1;
    }
    for (const r of refunded) lifetime.refunded_cents += r.gross_cents ?? 0;

    const inRange = paid.filter((r) => {
      if (!from) return true;
      const t = r.purchased_at ?? r.created_at;
      return t ? t >= from : false;
    });

    const totals = emptyTotals(currency);
    for (const r of inRange) {
      totals.gross_cents += r.gross_cents ?? 0;
      totals.fee_cents += r.platform_fee_cents ?? 0;
      totals.net_cents += r.chef_net_cents ?? 0;
      totals.sales_count += 1;
    }
    totals.refunded_cents = refunded
      .filter((r) => {
        if (!from) return true;
        const t = r.purchased_at ?? r.created_at;
        return t ? t >= from : false;
      })
      .reduce((s, r) => s + (r.gross_cents ?? 0), 0);

    // Series
    const seriesMap = new Map<string, EarningsSeriesPoint>();
    for (const r of inRange) {
      const t = r.purchased_at ?? r.created_at;
      if (!t) continue;
      const key = bucket === "day" ? t.slice(0, 10) : t.slice(0, 7);
      const p = seriesMap.get(key) ?? { bucket: key, gross_cents: 0, net_cents: 0, sales: 0 };
      p.gross_cents += r.gross_cents ?? 0;
      p.net_cents += r.chef_net_cents ?? 0;
      p.sales += 1;
      seriesMap.set(key, p);
    }
    const series = [...seriesMap.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));

    // Top recipes (by paid_recipe_id in range)
    const byRecipe = new Map<string, EarningsTopRecipe>();
    for (const r of inRange) {
      if (!r.paid_recipe_id) continue;
      const p = byRecipe.get(r.paid_recipe_id) ?? {
        paid_recipe_id: r.paid_recipe_id, title: null, sales: 0, gross_cents: 0, net_cents: 0,
      };
      p.sales += 1;
      p.gross_cents += r.gross_cents ?? 0;
      p.net_cents += r.chef_net_cents ?? 0;
      byRecipe.set(r.paid_recipe_id, p);
    }
    const topRecipes = [...byRecipe.values()].sort((a, b) => b.gross_cents - a.gross_cents).slice(0, 10);

    // Enrich with titles (recipes + cookbooks) via admin client for consistent reads.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (topRecipes.length > 0) {
      const ids = topRecipes.map((t) => t.paid_recipe_id);
      const { data: titles } = await supabaseAdmin
        .from("paid_recipes")
        .select("id, title")
        .in("id", ids);
      const titleMap = new Map((titles ?? []).map((t) => [t.id, t.title as string]));
      for (const t of topRecipes) t.title = titleMap.get(t.paid_recipe_id) ?? null;
    }

    // Recent sales (last 25)
    const recentPaid = paid.slice(0, 25);
    const recentIds = Array.from(new Set(recentPaid.map((r) => r.paid_recipe_id).filter(Boolean) as string[]));
    const recentCookbookIds = Array.from(new Set(recentPaid.map((r) => r.cookbook_id).filter(Boolean) as string[]));
    const recipeTitleMap = new Map<string, string>();
    const cookbookTitleMap = new Map<string, string>();
    if (recentIds.length > 0) {
      const { data: rts } = await supabaseAdmin
        .from("paid_recipes")
        .select("id, title")
        .in("id", recentIds);
      (rts ?? []).forEach((r) => recipeTitleMap.set(r.id, r.title as string));
    }
    if (recentCookbookIds.length > 0) {
      const { data: cts } = await supabaseAdmin
        .from("cookbooks")
        .select("id, title")
        .in("id", recentCookbookIds);
      (cts ?? []).forEach((c) => cookbookTitleMap.set(c.id, c.title as string));
    }

    const recentSales: EarningsRecentSale[] = recentPaid.map((r) => ({
      id: r.id,
      purchased_at: r.purchased_at ?? r.created_at ?? new Date(0).toISOString(),
      gross_cents: r.gross_cents ?? 0,
      net_cents: r.chef_net_cents ?? 0,
      currency: (r.currency ?? currency).toLowerCase(),
      buyer_country: null,
      paid_recipe_id: r.paid_recipe_id ?? null,
      cookbook_id: r.cookbook_id ?? null,
      recipe_title: r.paid_recipe_id ? recipeTitleMap.get(r.paid_recipe_id) ?? null : null,
      cookbook_title: r.cookbook_id ? cookbookTitleMap.get(r.cookbook_id) ?? null : null,
    }));

    return {
      currency,
      totals,
      totalsLifetime: lifetime,
      series,
      topRecipes,
      byCountry: [],
      recentSales,
      isChef,
    };
  });