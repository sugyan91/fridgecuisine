import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Could not verify admin");
  if (!data) throw new Error("Not authorized");
}

export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const adminFindUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ query: z.string().trim().min(1).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const q = data.query.toLowerCase();
    // Try email first via auth admin list (paginated, capped)
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const match = list.users.find(
      (u) => u.email?.toLowerCase() === q || u.id === q,
    );
    if (!match) {
      // fallback: username in profiles
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("user_id, username, display_name")
        .ilike("username", q)
        .maybeSingle();
      if (!p) return { user: null };
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(p.user_id);
      const u = userRes?.user;
      if (!u) return { user: null };
      return {
        user: {
          id: u.id,
          email: u.email ?? null,
          username: p.username ?? null,
          display_name: p.display_name ?? null,
          created_at: u.created_at,
        },
      };
    }
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username, display_name")
      .eq("user_id", match.id)
      .maybeSingle();
    return {
      user: {
        id: match.id,
        email: match.email ?? null,
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        created_at: match.created_at,
      },
    };
  });

export const adminResetUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { error } = await supabaseAdmin
      .from("recipe_generations")
      .delete()
      .eq("user_id", data.user_id)
      .gte("created_at", startOfDay.toISOString());
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ email: z.string().email() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(data.email);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.user_id === context.userId) {
      throw new Error("You cannot delete yourself");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGrantPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      user_id: z.string().uuid(),
      days: z.number().int().min(1).max(3650).default(30),
      environment: z.enum(["live", "sandbox"]).default("live"),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const now = new Date();
    const end = new Date(now.getTime() + data.days * 86400000);
    // Look for an existing manual row
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", data.user_id)
      .eq("environment", data.environment)
      .eq("stripe_subscription_id", "admin_grant")
      .maybeSingle();
    if (existing) {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          cancel_at_period_end: false,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("subscriptions").insert({
        user_id: data.user_id,
        environment: data.environment,
        status: "active",
        product_id: "admin_grant",
        price_id: "admin_grant",
        stripe_customer_id: `admin_${data.user_id}`,
        stripe_subscription_id: "admin_grant",
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        cancel_at_period_end: false,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true, until: end.toISOString() };
  });

export const adminRevokePremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        current_period_end: new Date().toISOString(),
      })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminGetUserSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [{ count: usedToday }, { data: subs }] = await Promise.all([
      supabaseAdmin
        .from("recipe_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", data.user_id)
        .gte("created_at", startOfDay.toISOString()),
      supabaseAdmin
        .from("subscriptions")
        .select("status, environment, current_period_end, stripe_subscription_id")
        .eq("user_id", data.user_id)
        .order("created_at", { ascending: false }),
    ]);
    const now = Date.now();
    const isPremium = (subs ?? []).some((s) => {
      const end = s.current_period_end ? new Date(s.current_period_end).getTime() : null;
      return ["active", "trialing"].includes(s.status) && (end === null || end > now);
    });
    return { usedToday: usedToday ?? 0, isPremium, subscriptions: subs ?? [] };
  });

const PAGE = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(1).max(200).default(50),
  search: z.string().trim().max(200).optional(),
});

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => PAGE.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
      page: data.page,
      perPage: data.pageSize,
    });
    if (error) throw new Error(error.message);
    const ids = list.users.map((u) => u.id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username, display_name")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: gens } = await supabaseAdmin
      .from("recipe_generations")
      .select("user_id")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
      .gte("created_at", startOfDay.toISOString());
    const usageMap = new Map<string, number>();
    for (const g of gens ?? []) usageMap.set(g.user_id, (usageMap.get(g.user_id) ?? 0) + 1);
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status, current_period_end")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const now = Date.now();
    const premiumSet = new Set<string>();
    for (const s of subs ?? []) {
      const end = s.current_period_end ? new Date(s.current_period_end).getTime() : null;
      if (["active", "trialing"].includes(s.status) && (end === null || end > now)) {
        premiumSet.add(s.user_id);
      }
    }
    let users = list.users.map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        username: p?.username ?? null,
        display_name: p?.display_name ?? null,
        created_at: u.created_at,
        usedToday: usageMap.get(u.id) ?? 0,
        isPremium: premiumSet.has(u.id),
      };
    });
    if (data.search) {
      const q = data.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.display_name?.toLowerCase().includes(q) ||
          u.id.includes(q),
      );
    }
    return { users, total: list.total ?? users.length };
  });

export const adminListCommunityRecipes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => PAGE.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let query = supabaseAdmin
      .from("community_recipes")
      .select("id, user_id, title, city, country, cuisine, created_at, is_published", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.search) query = query.ilike("title", `%${data.search}%`);
    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username, display_name")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const pMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    return {
      recipes: (rows ?? []).map((r) => ({
        ...r,
        author_username: pMap.get(r.user_id)?.username ?? null,
        author_display_name: pMap.get(r.user_id)?.display_name ?? null,
      })),
      total: count ?? 0,
    };
  });

export const adminDeleteCommunityRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ recipe_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    await supabaseAdmin.from("community_recipe_comments").delete().eq("recipe_id", data.recipe_id);
    await supabaseAdmin.from("community_recipe_likes").delete().eq("recipe_id", data.recipe_id);
    const { error } = await supabaseAdmin.from("community_recipes").delete().eq("id", data.recipe_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListComments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => PAGE.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;
    let query = supabaseAdmin
      .from("community_recipe_comments")
      .select("id, user_id, recipe_id, body, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.search) query = query.ilike("body", `%${data.search}%`);
    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    const uids = (rows ?? []).map((r) => r.user_id);
    const rids = (rows ?? []).map((r) => r.recipe_id);
    const [{ data: profiles }, { data: recipes }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("user_id, username")
        .in("user_id", uids.length ? uids : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin
        .from("community_recipes")
        .select("id, title")
        .in("id", rids.length ? rids : ["00000000-0000-0000-0000-000000000000"]),
    ]);
    const pMap = new Map((profiles ?? []).map((p) => [p.user_id, p.username]));
    const rMap = new Map((recipes ?? []).map((r) => [r.id, r.title]));
    return {
      comments: (rows ?? []).map((c) => ({
        ...c,
        author_username: pMap.get(c.user_id) ?? null,
        recipe_title: rMap.get(c.recipe_id) ?? null,
      })),
      total: count ?? 0,
    };
  });

export const adminDeleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ comment_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("community_recipe_comments")
      .delete()
      .eq("id", data.comment_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
