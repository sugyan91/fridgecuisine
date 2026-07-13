import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnalyticsRange = "7d" | "30d" | "90d" | "365d" | "all";

function rangeFrom(range: AnalyticsRange): { from: string | null; bucket: "day" | "month" } {
  if (range === "all") return { from: null, bucket: "month" };
  const d = new Date();
  const map: Record<Exclude<AnalyticsRange, "all">, number> = {
    "7d": 7, "30d": 30, "90d": 90, "365d": 365,
  };
  d.setDate(d.getDate() - map[range]);
  return { from: d.toISOString(), bucket: range === "365d" ? "month" : "day" };
}

function bucketKey(iso: string, bucket: "day" | "month") {
  return bucket === "day" ? iso.slice(0, 10) : iso.slice(0, 7);
}

export type AnalyticsSeriesPoint = {
  bucket: string;
  views: number;
  likes: number;
  sales: number;
  tips: number;
};

export type AnalyticsTopRecipe = {
  paid_recipe_id: string;
  title: string | null;
  views: number;
  sales: number;
};

export type StorefrontAnalytics = {
  isChef: boolean;
  currency: string;
  range: AnalyticsRange;
  totals: {
    views: number;
    storefront_views: number;
    recipe_views: number;
    cookbook_views: number;
    likes: number;
    sales_count: number;
    sales_net_cents: number;
    sales_gross_cents: number;
    tips_count: number;
    tips_net_cents: number;
  };
  lifetime: {
    views: number;
    likes: number;
    sales_count: number;
    tips_count: number;
  };
  series: AnalyticsSeriesPoint[];
  topRecipes: AnalyticsTopRecipe[];
};

/**
 * Public: record a page view against a chef's storefront or one of their
 * paid recipes / cookbooks. Resolves the chef server-side; the client just
 * says "I looked at this URL". Insert-only.
 */
export const recordStorefrontView = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        source: z.enum(["storefront", "paid_recipe", "cookbook"]),
        username: z.string().trim().min(1).max(80).toLowerCase().optional(),
        paid_recipe_id: z.string().uuid().optional(),
        cookbook_id: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let chefUserId: string | null = null;
    let paidRecipeId: string | null = null;
    let cookbookId: string | null = null;

    if (data.source === "storefront") {
      if (!data.username) return { ok: false };
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("username", data.username)
        .maybeSingle();
      chefUserId = prof?.user_id ?? null;
    } else if (data.source === "paid_recipe") {
      if (!data.paid_recipe_id) return { ok: false };
      const { data: r } = await supabaseAdmin
        .from("paid_recipes")
        .select("chef_user_id")
        .eq("id", data.paid_recipe_id)
        .maybeSingle();
      chefUserId = r?.chef_user_id ?? null;
      paidRecipeId = data.paid_recipe_id;
    } else if (data.source === "cookbook") {
      if (!data.cookbook_id) return { ok: false };
      const { data: c } = await supabaseAdmin
        .from("cookbooks")
        .select("chef_user_id")
        .eq("id", data.cookbook_id)
        .maybeSingle();
      chefUserId = c?.chef_user_id ?? null;
      cookbookId = data.cookbook_id;
    }

    if (!chefUserId) return { ok: false };

    await supabaseAdmin.from("storefront_views").insert({
      chef_user_id: chefUserId,
      source: data.source,
      paid_recipe_id: paidRecipeId,
      cookbook_id: cookbookId,
    });

    return { ok: true };
  });

/**
 * Chef-only: aggregated storefront analytics (views, likes, sales, tips)
 * over the selected range.
 */
export const getMyStorefrontAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ range: z.enum(["7d", "30d", "90d", "365d", "all"]).default("30d") })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<StorefrontAnalytics> => {
    const { supabase, userId } = context;
    const { from, bucket } = rangeFrom(data.range);

    const { data: chef } = await supabase
      .from("chef_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    const isChef = !!chef;

    // Views (owned by chef via RLS)
    let viewsQ = supabase
      .from("storefront_views")
      .select("source, paid_recipe_id, cookbook_id, viewed_at")
      .eq("chef_user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(20000);
    if (from) viewsQ = viewsQ.gte("viewed_at", from);
    const { data: viewRows } = await viewsQ;
    const views = viewRows ?? [];

    // Lifetime view count (cheap head count)
    const { count: lifetimeViewCount } = await supabase
      .from("storefront_views")
      .select("id", { head: true, count: "exact" })
      .eq("chef_user_id", userId);

    // Community recipe likes on my community recipes
    const { data: myCommunity } = await supabase
      .from("community_recipes")
      .select("id")
      .eq("user_id", userId);
    const communityIds = (myCommunity ?? []).map((r) => r.id);

    let likeRows: Array<{ recipe_id: string; created_at: string; vote_type: string }> = [];
    let lifetimeLikeCount = 0;
    if (communityIds.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let likesQ = supabaseAdmin
        .from("community_recipe_likes")
        .select("recipe_id, created_at, vote_type")
        .in("recipe_id", communityIds)
        .eq("vote_type", "up")
        .limit(20000);
      if (from) likesQ = likesQ.gte("created_at", from);
      const { data: lr } = await likesQ;
      likeRows = (lr ?? []) as typeof likeRows;

      const { count } = await supabaseAdmin
        .from("community_recipe_likes")
        .select("recipe_id", { head: true, count: "exact" })
        .in("recipe_id", communityIds)
        .eq("vote_type", "up");
      lifetimeLikeCount = count ?? 0;
    }

    // Sales
    let salesQ = supabase
      .from("recipe_purchases")
      .select("paid_recipe_id, gross_cents, chef_net_cents, currency, purchased_at, created_at")
      .eq("chef_user_id", userId)
      .eq("status", "paid")
      .limit(20000);
    if (from) salesQ = salesQ.gte("purchased_at", from);
    const { data: saleRows } = await salesQ;
    const sales = saleRows ?? [];

    const { count: lifetimeSalesCount } = await supabase
      .from("recipe_purchases")
      .select("id", { head: true, count: "exact" })
      .eq("chef_user_id", userId)
      .eq("status", "paid");

    // Tips
    let tipsQ = supabase
      .from("tips")
      .select("chef_net_cents, currency, purchased_at, created_at")
      .eq("chef_user_id", userId)
      .eq("status", "paid")
      .limit(20000);
    if (from) tipsQ = tipsQ.gte("purchased_at", from);
    const { data: tipRows } = await tipsQ;
    const tips = tipRows ?? [];

    const { count: lifetimeTipsCount } = await supabase
      .from("tips")
      .select("id", { head: true, count: "exact" })
      .eq("chef_user_id", userId)
      .eq("status", "paid");

    // Totals
    const totals = {
      views: views.length,
      storefront_views: views.filter((v) => v.source === "storefront").length,
      recipe_views: views.filter((v) => v.source === "paid_recipe").length,
      cookbook_views: views.filter((v) => v.source === "cookbook").length,
      likes: likeRows.length,
      sales_count: sales.length,
      sales_net_cents: sales.reduce((s, r) => s + (r.chef_net_cents ?? 0), 0),
      sales_gross_cents: sales.reduce((s, r) => s + (r.gross_cents ?? 0), 0),
      tips_count: tips.length,
      tips_net_cents: tips.reduce((s, r) => s + (r.chef_net_cents ?? 0), 0),
    };

    const currency = (sales[0]?.currency ?? tips[0]?.currency ?? "usd").toLowerCase();

    // Series
    const map = new Map<string, AnalyticsSeriesPoint>();
    const bump = (iso: string, key: keyof Pick<AnalyticsSeriesPoint, "views" | "likes" | "sales" | "tips">) => {
      const k = bucketKey(iso, bucket);
      const p = map.get(k) ?? { bucket: k, views: 0, likes: 0, sales: 0, tips: 0 };
      p[key] += 1;
      map.set(k, p);
    };
    for (const v of views) if (v.viewed_at) bump(v.viewed_at, "views");
    for (const l of likeRows) if (l.created_at) bump(l.created_at, "likes");
    for (const s of sales) {
      const t = s.purchased_at ?? s.created_at;
      if (t) bump(t, "sales");
    }
    for (const t of tips) {
      const at = t.purchased_at ?? t.created_at;
      if (at) bump(at, "tips");
    }
    const series = [...map.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));

    // Top recipes: combine view + sale counts by paid_recipe_id
    const perRecipe = new Map<string, AnalyticsTopRecipe>();
    for (const v of views) {
      if (!v.paid_recipe_id) continue;
      const p = perRecipe.get(v.paid_recipe_id) ?? {
        paid_recipe_id: v.paid_recipe_id, title: null, views: 0, sales: 0,
      };
      p.views += 1;
      perRecipe.set(v.paid_recipe_id, p);
    }
    for (const s of sales) {
      if (!s.paid_recipe_id) continue;
      const p = perRecipe.get(s.paid_recipe_id) ?? {
        paid_recipe_id: s.paid_recipe_id, title: null, views: 0, sales: 0,
      };
      p.sales += 1;
      perRecipe.set(s.paid_recipe_id, p);
    }
    const topRecipes = [...perRecipe.values()]
      .sort((a, b) => (b.views + b.sales * 5) - (a.views + a.sales * 5))
      .slice(0, 10);

    if (topRecipes.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: titles } = await supabaseAdmin
        .from("paid_recipes")
        .select("id, title")
        .in("id", topRecipes.map((t) => t.paid_recipe_id));
      const titleMap = new Map((titles ?? []).map((t) => [t.id, t.title as string]));
      for (const t of topRecipes) t.title = titleMap.get(t.paid_recipe_id) ?? null;
    }

    return {
      isChef,
      currency,
      range: data.range,
      totals,
      lifetime: {
        views: lifetimeViewCount ?? 0,
        likes: lifetimeLikeCount,
        sales_count: lifetimeSalesCount ?? 0,
        tips_count: lifetimeTipsCount ?? 0,
      },
      series,
      topRecipes,
    };
  });