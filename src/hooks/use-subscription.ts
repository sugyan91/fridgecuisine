import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export type SubscriptionRow = {
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const env = getStripeEnvironment();

    const fetchSub = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, price_id, current_period_end, cancel_at_period_end")
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setSubscription(data as SubscriptionRow | null);
        setLoading(false);
      }
    };
    fetchSub();

    const channel = supabase
      .channel(`subscriptions-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => fetchSub()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const now = Date.now();
  const periodEndMs = subscription?.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : null;
  const isActive =
    !!subscription &&
    ((["active", "trialing", "past_due"].includes(subscription.status) &&
      (periodEndMs === null || periodEndMs > now)) ||
      (subscription.status === "canceled" && periodEndMs !== null && periodEndMs > now));

  return { subscription, isActive, isPremium: isActive, loading };
}