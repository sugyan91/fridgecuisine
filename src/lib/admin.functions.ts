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
