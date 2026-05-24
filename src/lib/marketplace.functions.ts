import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

export type ChefProfile = {
  id: string;
  user_id: string;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  onboarding_completed_at: string | null;
};

/** Returns the current user's chef profile (or null if not yet a chef). */
export const getMyChefProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("chef_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: (data as ChefProfile | null) ?? null };
  });

/** Save / update the chef's public profile (bio + country). */
export const upsertChefProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bio?: string; country?: string }) => {
    const bio = (input.bio ?? "").trim().slice(0, 600);
    const country = (input.country ?? "").trim().slice(0, 80);
    return { bio, country };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("chef_profiles")
      .upsert(
        { user_id: userId, bio: data.bio || null, country: data.country || null },
        { onConflict: "user_id" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { profile: row as ChefProfile };
  });

/**
 * Start (or resume) Stripe Connect Express onboarding for the current chef.
 * Creates a Stripe Express account on first call, then returns a one-time
 * onboarding link the chef opens in a new tab.
 */
export const startChefOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { returnUrl: string; environment: StripeEnv }) => {
    if (!input.returnUrl.startsWith("http")) throw new Error("Invalid returnUrl");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("chef_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const stripe = createStripeClient(data.environment);
    let stripeAccountId = (existing as ChefProfile | null)?.stripe_account_id ?? null;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        metadata: { userId },
      });
      stripeAccountId = account.id;

      if (existing) {
        const { error } = await supabase
          .from("chef_profiles")
          .update({ stripe_account_id: stripeAccountId })
          .eq("user_id", userId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("chef_profiles")
          .insert({ user_id: userId, stripe_account_id: stripeAccountId });
        if (error) throw new Error(error.message);
      }
    }

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: data.returnUrl,
      return_url: data.returnUrl,
      type: "account_onboarding",
    });

    return { url: link.url };
  });

/**
 * Pull the latest payouts/charges flags from Stripe and persist them.
 * Call after the chef returns from the onboarding link.
 */
export const refreshChefAccountStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { environment: StripeEnv }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing, error: readErr } = await supabase
      .from("chef_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!existing || !(existing as ChefProfile).stripe_account_id) {
      return { profile: null };
    }

    const stripe = createStripeClient(data.environment);
    const account = await stripe.accounts.retrieve(
      (existing as ChefProfile).stripe_account_id!,
    );

    const payouts_enabled = Boolean(account.payouts_enabled);
    const charges_enabled = Boolean(account.charges_enabled);
    const completed = payouts_enabled && charges_enabled;

    const { data: updated, error: updErr } = await supabase
      .from("chef_profiles")
      .update({
        payouts_enabled,
        charges_enabled,
        onboarding_completed_at:
          completed && !(existing as ChefProfile).onboarding_completed_at
            ? new Date().toISOString()
            : (existing as ChefProfile).onboarding_completed_at,
      })
      .eq("user_id", userId)
      .select()
      .single();
    if (updErr) throw new Error(updErr.message);

    return { profile: updated as ChefProfile };
  });

/** Public: list published chefs for the directory. */
export const listChefs = createServerFn({ method: "GET" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
    );
    const { data, error } = await supabase
      .from("chef_profiles")
      .select("user_id, bio, country, avatar_url")
      .eq("payouts_enabled", true)
      .eq("charges_enabled", true)
      .order("onboarding_completed_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return { chefs: data ?? [] };
  });