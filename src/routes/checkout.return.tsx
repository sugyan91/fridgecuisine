import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { isIOSNative } from "@/lib/platform";
import { Button } from "@/components/ui/button";
import { GraffitiCelebration } from "@/components/celebrate/GraffitiCelebration";
import { useSubscription } from "@/hooks/use-subscription";
import { ENDPOINT_LIMITS } from "@/lib/ai-quota";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    session_id?: string;
    type?: "recipe" | "subscription" | "cookbook" | "tip";
    recipe_id?: string;
    cookbook_id?: string;
    chef?: string;
  } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    type:
      search.type === "recipe" ||
      search.type === "subscription" ||
      search.type === "cookbook" ||
      search.type === "tip"
        ? search.type
        : undefined,
    recipe_id: typeof search.recipe_id === "string" ? search.recipe_id : undefined,
    cookbook_id: typeof search.cookbook_id === "string" ? search.cookbook_id : undefined,
    chef: typeof search.chef === "string" ? search.chef : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId, type, recipe_id: recipeId, cookbook_id: cookbookId, chef } = Route.useSearch();
  const [status, setStatus] = useState<"checking" | "active" | "pending">("checking");
  const isRecipe = type === "recipe" && !!recipeId;
  const isCookbook = type === "cookbook" && !!cookbookId;
  const isTip = type === "tip";
  const isSubscription = !isRecipe && !isCookbook && !isTip;
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { tier } = useSubscription(userId);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  // Option A: Stripe checkout is not available inside the native iOS app.
  useEffect(() => {
    if (isIOSNative()) {
      router.navigate({ to: "/", replace: true });
    }
  }, [router]);

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;
    const env = getStripeEnvironment();

    const poll = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      if (isRecipe && recipeId) {
        const { data } = await supabase
          .from("recipe_purchases")
          .select("status")
          .eq("buyer_user_id", u.user.id)
          .eq("paid_recipe_id", recipeId)
          .eq("status", "paid")
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          setStatus("active");
          return;
        }
      } else if (isCookbook && cookbookId) {
        const { data } = await supabase
          .from("recipe_purchases")
          .select("status")
          .eq("buyer_user_id", u.user.id)
          .eq("cookbook_id", cookbookId)
          .eq("status", "paid")
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          setStatus("active");
          return;
        }
      } else if (isTip) {
        const { data } = await supabase
          .from("tips")
          .select("status")
          .eq("sender_user_id", u.user.id)
          .eq("status", "paid")
          .order("purchased_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          setStatus("active");
          return;
        }
      } else {
        const { data } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", u.user.id)
          .eq("environment", env)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (data && ["active", "trialing"].includes(data.status as string)) {
          setStatus("active");
          return;
        }
      }
      attempts++;
      if (attempts < 10) {
        setTimeout(poll, 1500);
      } else {
        setStatus("pending");
      }
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [isRecipe, recipeId, isCookbook, cookbookId, isTip]);

  const celebrate = isSubscription && status === "active";
  const planLabel = tier === "unlimited" ? "Unlimited" : tier === "basic" ? "Basic" : "Premium";
  const limits = ENDPOINT_LIMITS[tier === "unlimited" ? "unlimited" : "basic"];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {celebrate && <GraffitiCelebration />}
      <div className="relative max-w-md text-center">
        {status === "checking" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-6 text-2xl font-black">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Hold tight, this only takes a moment.</p>
          </>
        )}
        {status === "active" && (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
            {isRecipe ? (
              <>
                <h1 className="mt-6 text-3xl font-black">Recipe unlocked! 🎉</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  The full ingredients and steps are ready for you.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to="/shop/$recipeId" params={{ recipeId: recipeId! }}>
                      Cook now
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/shop">Browse more</Link>
                  </Button>
                </div>
              </>
            ) : isCookbook ? (
              <>
                <h1 className="mt-6 text-3xl font-black">Cookbook unlocked! 📖</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Every recipe inside is now yours to cook.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to="/shop/cookbook/$cookbookId" params={{ cookbookId: cookbookId! }}>
                      Open cookbook
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/shop">Browse shop</Link>
                  </Button>
                </div>
              </>
            ) : isTip ? (
              <>
                <h1 className="mt-6 text-3xl font-black">Tip sent! ☕</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  The chef will be notified. Thanks for supporting home cooks.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {chef ? (
                    <Button asChild>
                      <Link to="/chef/$username" params={{ username: chef }}>
                        Back to chef
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link to="/chefs">Discover chefs</Link>
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h1 className="mt-6 font-display text-3xl font-black">
                  You're {planLabel}!
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Richer AI recipes are unlocked — {limits.recipes} recipe generations and{" "}
                  {limits.helpers} AI helpers every day. Time to cook.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to="/">Start cooking</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/pricing" data-purchase-gated>Manage subscription</Link>
                  </Button>
                </div>
              </>
            )}
          </>
        )}
        {status === "pending" && (
          <>
            <h1 className="text-2xl font-black">Payment received</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRecipe
                ? "Your purchase is still syncing. It usually takes under a minute — refresh in a moment."
                : "Your subscription is still syncing. It usually takes under a minute — refresh in a moment."}
            </p>
            {sessionId && (
              <p className="mt-2 text-xs text-muted-foreground">Ref: {sessionId}</p>
            )}
            <Button asChild className="mt-6">
              {isRecipe && recipeId ? (
                <Link to="/shop/$recipeId" params={{ recipeId: recipeId }}>
                  Back to recipe
                </Link>
              ) : (
                <Link to="/pricing">Back to plans</Link>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}