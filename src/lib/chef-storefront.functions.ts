import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ChefStorefrontChef = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  payouts_enabled: boolean;
  onboarding_completed_at: string | null;
  created_at: string | null;
};

export type ChefStorefrontPaidRecipe = {
  id: string;
  title: string;
  local_name: string | null;
  cuisine: string | null;
  country: string | null;
  city: string | null;
  cover_image_url: string | null;
  price_cents: number;
};

export type ChefStorefrontCommunityRecipe = {
  id: string;
  title: string;
  cuisine: string | null;
  country: string | null;
  city: string | null;
  image_url: string | null;
  created_at: string;
};

export type ChefStorefrontStats = {
  paidCount: number;
  communityCount: number;
  totalLikes: number;
};

export type ChefStorefront = {
  chef: ChefStorefrontChef;
  stats: ChefStorefrontStats;
  paidRecipes: ChefStorefrontPaidRecipe[];
  communityRecipes: ChefStorefrontCommunityRecipe[];
};

/**
 * Public: full storefront payload for a chef, keyed by username.
 * Returns { chef: null } if the username does not exist.
 */
export const getChefStorefront = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ username: z.string().trim().min(1).max(80).toLowerCase() }).parse(input),
  )
  .handler(async ({ data }): Promise<{ storefront: ChefStorefront | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: prof, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, username, display_name, avatar_url, created_at")
      .eq("username", data.username)
      .maybeSingle();
    if (profErr) throw new Error(profErr.message);
    if (!prof) return { storefront: null };

    const { data: chefProfile } = await supabaseAdmin
      .from("chef_profiles")
      .select("bio, country, avatar_url, payouts_enabled, onboarding_completed_at")
      .eq("user_id", prof.user_id)
      .maybeSingle();

    const [{ data: paidRows }, { data: communityRows }] = await Promise.all([
      supabaseAdmin
        .from("paid_recipes")
        .select("id, title, local_name, cuisine, country, city, cover_image_url, price_cents, created_at")
        .eq("chef_user_id", prof.user_id)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(60),
      supabaseAdmin
        .from("community_recipes")
        .select("id, title, cuisine, country, city, image_url, created_at")
        .eq("user_id", prof.user_id)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

    let totalLikes = 0;
    if (communityRows && communityRows.length > 0) {
      const ids = communityRows.map((r) => r.id);
      const { count } = await supabaseAdmin
        .from("community_recipe_likes")
        .select("*", { count: "exact", head: true })
        .in("recipe_id", ids);
      totalLikes = count ?? 0;
    }

    return {
      storefront: {
        chef: {
          user_id: prof.user_id,
          username: prof.username,
          display_name: prof.display_name,
          avatar_url: chefProfile?.avatar_url ?? prof.avatar_url ?? null,
          bio: chefProfile?.bio ?? null,
          country: chefProfile?.country ?? null,
          payouts_enabled: Boolean(chefProfile?.payouts_enabled),
          onboarding_completed_at: chefProfile?.onboarding_completed_at ?? null,
          created_at: prof.created_at ?? null,
        },
        stats: {
          paidCount: paidRows?.length ?? 0,
          communityCount: communityRows?.length ?? 0,
          totalLikes,
        },
        paidRecipes: (paidRows ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          local_name: r.local_name,
          cuisine: r.cuisine,
          country: r.country,
          city: r.city,
          cover_image_url: r.cover_image_url,
          price_cents: r.price_cents ?? 0,
        })),
        communityRecipes: (communityRows ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          cuisine: r.cuisine,
          country: r.country,
          city: r.city,
          image_url: r.image_url,
          created_at: r.created_at,
        })),
      },
    };
  });