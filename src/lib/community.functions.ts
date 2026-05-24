import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const receipeInput = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(800).optional().default(""),
  history: z.string().trim().max(4000).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  country: z.string().trim().max(80).optional().default(""),
  cuisine: z.string().trim().max(80).optional().default(""),
  dietary: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  ingredients: z.array(z.string().trim().min(1).max(200)).min(1).max(60),
  steps: z.array(z.string().trim().min(1).max(1000)).min(1).max(40),
  image_url: z.string().url().max(2000).optional().or(z.literal("")).default(""),
  is_published: z.boolean().default(true),
});

export const listCommunityRecipes = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      search: z.string().trim().max(80).optional(),
      cuisine: z.string().trim().max(80).optional(),
      city: z.string().trim().max(80).optional(),
      limit: z.number().int().min(1).max(50).default(24),
    }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("community_receipes")
      .select("id, title, description, city, country, cuisine, dietary, image_url, created_at, user_id")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.search) q = q.ilike("title", `%${data.search}%`);
    if (data.cuisine) q = q.eq("cuisine", data.cuisine);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    const { data: rows, error } = await q;
    if (error) return { receipes: [], error: error.message };

    const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
    const ids = (rows ?? []).map((r) => r.id);
    const [{ data: profiles }, { data: votes }] = await Promise.all([
      userIds.length
        ? supabaseAdmin.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : Promise.resolve({ data: [] as { user_id: string; display_name: string | null }[] }),
      ids.length
        ? supabaseAdmin.from("community_receipe_likes").select("receipe_id, vote_type").in("receipe_id", ids)
        : Promise.resolve({ data: [] as { receipe_id: string; vote_type: string }[] }),
    ]);
    const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
    // Backfill any missing display names from auth metadata so authors aren't shown as Anonymous.
    const missing = userIds.filter((uid) => !nameMap.get(uid));
    if (missing.length) {
      await Promise.all(
        missing.map(async (uid) => {
          const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(uid);
          const u = userRes?.user;
          const fallback =
            (u?.user_metadata?.display_name as string | undefined) ||
            (u?.user_metadata?.full_name as string | undefined) ||
            (u?.user_metadata?.name as string | undefined) ||
            (u?.email ? u.email.split("@")[0] : null);
          if (fallback) {
            nameMap.set(uid, fallback);
            await supabaseAdmin
              .from("profiles")
              .upsert({ user_id: uid, display_name: fallback }, { onConflict: "user_id" });
          }
        }),
      );
    }
    const upCount = new Map<string, number>();
    const downCount = new Map<string, number>();
    (votes ?? []).forEach((v) => {
      const m = v.vote_type === "down" ? downCount : upCount;
      m.set(v.receipe_id, (m.get(v.receipe_id) ?? 0) + 1);
    });

    return {
      receipes: (rows ?? []).map((r) => ({
        ...r,
        author_name: nameMap.get(r.user_id) ?? "Anonymous",
        up_count: upCount.get(r.id) ?? 0,
        down_count: downCount.get(r.id) ?? 0,
      })),
      error: null,
    };
  });

export const getCommunityRecipe = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: receipe, error } = await supabaseAdmin
      .from("community_receipes")
      .select("*")
      .eq("id", data.id)
      .eq("is_published", true)
      .maybeSingle();
    if (error || !receipe) return { receipe: null, author_name: null, up_count: 0, down_count: 0 };
    const [{ data: profile }, { data: votes }] = await Promise.all([
      supabaseAdmin.from("profiles").select("display_name").eq("user_id", receipe.user_id).maybeSingle(),
      supabaseAdmin.from("community_receipe_likes").select("vote_type").eq("receipe_id", receipe.id),
    ]);
    let author_name = profile?.display_name ?? null;
    if (!author_name) {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(receipe.user_id);
      const u = userRes?.user;
      author_name =
        (u?.user_metadata?.display_name as string | undefined) ||
        (u?.user_metadata?.full_name as string | undefined) ||
        (u?.user_metadata?.name as string | undefined) ||
        (u?.email ? u.email.split("@")[0] : null);
      if (author_name) {
        await supabaseAdmin
          .from("profiles")
          .upsert({ user_id: receipe.user_id, display_name: author_name }, { onConflict: "user_id" });
      }
    }
    const up_count = (votes ?? []).filter((v) => v.vote_type !== "down").length;
    const down_count = (votes ?? []).filter((v) => v.vote_type === "down").length;
    return {
      receipe,
      author_name: author_name ?? "Anonymous",
      up_count,
      down_count,
    };
  });

export const createCommunityRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => receipeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Ensure profile has a display_name so the receipe isn't shown as "Anonymous".
    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (!prof?.display_name) {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
      const u = userRes?.user;
      const fallback =
        (u?.user_metadata?.display_name as string | undefined) ||
        (u?.user_metadata?.full_name as string | undefined) ||
        (u?.user_metadata?.name as string | undefined) ||
        (u?.email ? u.email.split("@")[0] : null);
      if (fallback) {
        await supabaseAdmin
          .from("profiles")
          .upsert({ user_id: userId, display_name: fallback }, { onConflict: "user_id" });
      }
    }
    const { data: row, error } = await supabase
      .from("community_receipes")
      .insert({ ...data, user_id: userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateCommunityRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => receipeInput.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("community_receipes")
      .update(rest)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCommunityRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("community_receipes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyRecipes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("community_receipes")
      .select("id, title, city, cuisine, is_published, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { receipes: data ?? [] };
  });

export const getMyVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ receipe_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("community_receipe_likes")
      .select("vote_type")
      .eq("receipe_id", data.receipe_id)
      .eq("user_id", userId)
      .maybeSingle();
    return { vote: (row?.vote_type as "up" | "down" | undefined) ?? null };
  });

export const setRecipeVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      receipe_id: z.string().uuid(),
      vote: z.enum(["up", "down"]).nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("community_receipe_likes")
      .select("vote_type")
      .eq("receipe_id", data.receipe_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (data.vote === null) {
      if (existing) {
        await supabase
          .from("community_receipe_likes")
          .delete()
          .eq("receipe_id", data.receipe_id)
          .eq("user_id", userId);
      }
      return { vote: null };
    }
    if (existing) {
      await supabase
        .from("community_receipe_likes")
        .update({ vote_type: data.vote })
        .eq("receipe_id", data.receipe_id)
        .eq("user_id", userId);
      return { vote: data.vote };
    }
    await supabase
      .from("community_receipe_likes")
      .insert({ receipe_id: data.receipe_id, user_id: userId, vote_type: data.vote });
    return { vote: data.vote };
  });

export const listRecipeComments = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ receipe_id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("community_receipe_comments")
      .select("id, body, created_at, user_id")
      .eq("receipe_id", data.receipe_id)
      .order("created_at", { ascending: true });
    if (error) return { comments: [], error: error.message };
    const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("user_id, display_name").in("user_id", userIds)
      : { data: [] as { user_id: string; display_name: string | null }[] };
    const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
    return {
      comments: (rows ?? []).map((r) => ({
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        user_id: r.user_id,
        author_name: nameMap.get(r.user_id) ?? "Anonymous",
      })),
      error: null as string | null,
    };
  });

export const addRecipeComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      receipe_id: z.string().uuid(),
      body: z.string().trim().min(1).max(1000),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify email confirmed.
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!userRes?.user?.email_confirmed_at) {
      throw new Error("Please verify your email before commenting.");
    }
    // Check receipe exists, is published, comments enabled.
    const { data: r } = await supabaseAdmin
      .from("community_receipes")
      .select("comments_enabled, is_published")
      .eq("id", data.receipe_id)
      .maybeSingle();
    if (!r || !r.is_published) throw new Error("Receipe not found.");
    if (!r.comments_enabled) throw new Error("Comments are turned off for this receipe.");

    const { data: row, error } = await supabase
      .from("community_receipe_comments")
      .insert({ receipe_id: data.receipe_id, user_id: userId, body: data.body })
      .select("id, body, created_at, user_id")
      .single();
    if (error) throw new Error(error.message);

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      comment: {
        ...row,
        author_name:
          prof?.display_name ||
          (userRes.user.user_metadata?.display_name as string | undefined) ||
          userRes.user.email?.split("@")[0] ||
          "Anonymous",
      },
    };
  });

export const deleteRecipeComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("community_receipe_comments")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setRecipeCommentsEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      receipe_id: z.string().uuid(),
      enabled: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: r } = await supabase
      .from("community_receipes")
      .select("user_id")
      .eq("id", data.receipe_id)
      .maybeSingle();
    if (!r || r.user_id !== userId) throw new Error("Not authorized.");
    const { error } = await supabase
      .from("community_receipes")
      .update({ comments_enabled: data.enabled })
      .eq("id", data.receipe_id);
    if (error) throw new Error(error.message);
    return { ok: true, comments_enabled: data.enabled };
  });
