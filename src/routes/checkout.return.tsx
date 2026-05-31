import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { session_id?: string; type?: "recipe" | "subscription"; recipe_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    type:
      search.type === "recipe" || search.type === "subscription"
        ? search.type
        : undefined,
    recipe_id: typeof search.recipe_id === "string" ? search.recipe_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId, type, recipe_id: recipeId } = Route.useSearch();
  const [status, setStatus] = useState<"checking" | "active" | "pending">("checking");
  const isRecipe = type === "recipe" && !!recipeId;

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
  }, [isRecipe, recipeId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
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
            ) : (
              <>
                <h1 className="mt-6 text-3xl font-black">You're Premium! 🎉</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Unlimited AI recipes are unlocked. Time to cook.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to="/">Start cooking</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/pricing">Manage subscription</Link>
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