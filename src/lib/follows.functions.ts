import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FollowedChef = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followed_at: string;
};

export type FollowingFeedItem = {
  id: string;
  title: string;
  image_url: string | null;
  cuisine: string | null;
  created_at: string;
  author: {
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

/** Follow a user by their profile username. Returns { following: true }. */
export const followUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ username: z.string().trim().min(1).max(80).toLowerCase() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", data.username)
      .maybeSingle();
    if (profErr) throw new Error(profErr.message);
    if (!prof) throw new Error("User not found.");
    if (prof.user_id === userId) throw new Error("You can't follow yourself.");
    const { error } = await supabase
      .from("follows")
      .upsert(
        { follower_id: userId, following_id: prof.user_id },
        { onConflict: "follower_id,following_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return { following: true as const };
  });

export const unfollowUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ username: z.string().trim().min(1).max(80).toLowerCase() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", data.username)
      .maybeSingle();
    if (!prof) return { following: false as const };
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", userId)
      .eq("following_id", prof.user_id);
    if (error) throw new Error(error.message);
    return { following: false as const };
  });

/**
 * Whether the current user follows the given username, plus the target's
 * follower count. Safe to call unauthenticated (followedByMe is always false).
 */
export const getFollowState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ username: z.string().trim().min(1).max(80).toLowerCase() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", data.username)
      .maybeSingle();
    if (!prof) return { followedByMe: false, followerCount: 0, targetUserId: null };
    const [{ count }, { data: mine }] = await Promise.all([
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", prof.user_id),
      supabase
        .from("follows")
        .select("id")
        .eq("follower_id", userId)
        .eq("following_id", prof.user_id)
        .maybeSingle(),
    ]);
    return {
      followedByMe: !!mine,
      followerCount: count ?? 0,
      targetUserId: prof.user_id,
    };
  });

/** List the chefs the current user follows. */
export const listFollowing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ chefs: FollowedChef[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("follows")
      .select("created_at, following_id, profiles!follows_following_id_fkey(user_id, username, display_name, avatar_url)")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      // Fallback if PostgREST can't infer the relation name — do two queries.
      const { data: rows } = await supabase
        .from("follows")
        .select("created_at, following_id")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);
      const ids = (rows ?? []).map((r) => r.following_id);
      if (ids.length === 0) return { chefs: [] };
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", ids);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
      return {
        chefs: (rows ?? [])
          .map((r) => {
            const p = map.get(r.following_id);
            if (!p) return null;
            return {
              user_id: p.user_id,
              username: p.username,
              display_name: p.display_name,
              avatar_url: p.avatar_url,
              followed_at: r.created_at,
            } as FollowedChef;
          })
          .filter((x): x is FollowedChef => x !== null),
      };
    }
    return {
      chefs: (data ?? [])
        .map((r) => {
          const p = r.profiles as unknown as {
            user_id: string;
            username: string;
            display_name: string | null;
            avatar_url: string | null;
          } | null;
          if (!p) return null;
          return {
            user_id: p.user_id,
            username: p.username,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            followed_at: r.created_at,
          } as FollowedChef;
        })
        .filter((x): x is FollowedChef => x !== null),
    };
  });

/** Recent published community recipes from users the current user follows. */
export const listFollowingFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: FollowingFeedItem[] }> => {
    const { supabase, userId } = context;
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);
    const ids = (follows ?? []).map((f) => f.following_id);
    if (ids.length === 0) return { items: [] };

    const { data: recipes, error } = await supabase
      .from("community_recipes")
      .select("id, user_id, title, image_url, cuisine, created_at")
      .in("user_id", ids)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    const authorIds = Array.from(new Set((recipes ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", authorIds);
    const authorMap = new Map((profs ?? []).map((p) => [p.user_id, p]));
    return {
      items: (recipes ?? [])
        .map((r) => {
          const a = authorMap.get(r.user_id);
          if (!a) return null;
          return {
            id: r.id,
            title: r.title,
            image_url: r.image_url,
            cuisine: r.cuisine,
            created_at: r.created_at,
            author: {
              user_id: a.user_id,
              username: a.username,
              display_name: a.display_name,
              avatar_url: a.avatar_url,
            },
          } as FollowingFeedItem;
        })
        .filter((x): x is FollowingFeedItem => x !== null),
    };
  });