import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession, createPortalSession } from "@/lib/payments.functions";
import { useSubscription } from "@/hooks/use-subscription";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — FridgeCuisine" },
      {
        name: "description",
        content:
          "Simple, honest plans. Start free with daily AI recipes. Upgrade to Basic or Unlimited for more generations and priority responses.",
      },
      { property: "og:title", content: "Pricing — FridgeCuisine" },
      {
        property: "og:description",
        content: "Free to start. Upgrade for more daily AI recipes and priority responses.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fridgecuisine.com/pricing" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Pricing — FridgeCuisine" },
      {
        name: "twitter:description",
        content: "Free to start. Upgrade for more daily AI recipes.",
      },
    ],
    links: [{ rel: "canonical", href: "https://fridgecuisine.com/pricing" }],
  }),
  component: PricingPage,
});

type PaidPlan = "basic" | "unlimited";
const PLAN_PRICE_ID: Record<PaidPlan, string> = {
  basic: "premium_monthly",
  unlimited: "unlimited_monthly",
};

function PricingPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PaidPlan>("unlimited");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
      setAuthChecked(true);
    });
  }, []);

  const { isPremium: _isPremium, subscription, loading, tier } = useSubscription(user?.id);

  const fetchClientSecret = async (): Promise<string> => {
    if (!user) throw new Error("Not signed in");
    const returnUrl = `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const secret = await createCheckoutSession({
      data: {
        priceId: PLAN_PRICE_ID[checkoutPlan],
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (!secret) throw new Error("No client secret");
    return secret;
  };

  const openCheckout = (plan: PaidPlan) => {
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/pricing" } });
      return;
    }
    setCheckoutPlan(plan);
    setCheckoutOpen(true);
  };

  const openPortal = async () => {
    setBusy(true);
    try {
      const url = await createPortalSession({
        data: {
          returnUrl: `${window.location.origin}/pricing`,
          environment: getStripeEnvironment(),
        },
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      alert("Could not open billing portal.");
    } finally {
      setBusy(false);
    }
  };

  const checkoutInner = checkoutOpen ? (
    <EmbeddedCheckoutProvider
      stripe={getStripe()}
      options={{ fetchClientSecret }}
      key={checkoutPlan}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  ) : null;

  const signedIn = !!user;
  const showLoading = signedIn && loading;

  const cta = (plan: PaidPlan, primary: boolean) => {
    if (!authChecked) {
      return (
        <Button className="mt-6 w-full" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      );
    }
    if (!signedIn) {
      return (
        <Button
          variant={primary ? "premium" : "outline"}
          className="mt-6 w-full"
          onClick={() => openCheckout(plan)}
        >
          Sign in to subscribe
        </Button>
      );
    }
    if (showLoading) {
      return (
        <Button className="mt-6 w-full" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      );
    }
    if (tier === plan) {
      return (
        <div className="mt-6 space-y-2">
          <div className="rounded-md bg-primary/10 px-3 py-2 text-center text-sm font-semibold text-primary">
            You're on {plan === "basic" ? "Basic" : "Unlimited"} ✓
            {subscription?.cancel_at_period_end && subscription.current_period_end && (
              <div className="mt-1 text-xs font-normal text-muted-foreground">
                Access until {new Date(subscription.current_period_end).toLocaleDateString()}
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={openPortal} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage billing"}
          </Button>
        </div>
      );
    }
    if (plan === "basic" && tier === "unlimited") {
      return (
        <Button variant="outline" className="mt-6 w-full" disabled>
          Included in Unlimited
        </Button>
      );
    }
    const label =
      plan === "unlimited" && tier === "basic" ? "Upgrade to Unlimited" : `Choose ${plan === "basic" ? "Basic" : "Unlimited"}`;
    return (
      <Button
        variant={primary ? "premium" : "outline"}
        className="mt-6 w-full"
        onClick={() => openCheckout(plan)}
      >
        {label}
      </Button>
    );
  };

  return (
    <main className="min-h-dvh bg-background">
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>

        <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tighter text-paprika">
          Simple, honest pricing
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Start free with AI recipes every day. Upgrade any time for more
          generations and priority responses. Cancel with one click — you keep
          access until the end of your billing period.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Free */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_var(--border)]">
            <h2 className="text-xl font-black uppercase tracking-tight">Free</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-black">$0</span>
              <span className="text-muted-foreground">/ forever</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <Feature>3 AI recipe generations / day</Feature>
              <Feature>5 AI helper tips / day</Feature>
              <Feature>3 recipes per search, essential detail</Feature>
              <Feature>Save up to 30 recipes</Feature>
              <Feature>Browse the community</Feature>
              <Feature>Meal planner + shopping list</Feature>
            </ul>
            {tier === "free" && signedIn ? (
              <Button variant="outline" className="mt-6 w-full" disabled>
                Current plan
              </Button>
            ) : !signedIn ? (
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => navigate({ to: "/login", search: { mode: "signup", redirect: "/" } })}
              >
                Get started free
              </Button>
            ) : (
              <Button variant="outline" className="mt-6 w-full" disabled>
                Included
              </Button>
            )}
          </div>

          {/* Basic */}
          <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_var(--border)]">
            <h2 className="text-xl font-black uppercase tracking-tight">Basic</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-black">$5.99</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <Feature>8 AI recipe generations / day</Feature>
              <Feature>20 AI helper tips / day</Feature>
              <Feature>6 recipes per search</Feature>
              <Feature>Nutrition per serving</Feature>
              <Feature>Drink &amp; side pairings</Feature>
              <Feature>Chef's note + key technique</Feature>
              <Feature>Difficulty &amp; "make it faster" tips</Feature>
              <Feature>Unlimited saves + PDF export</Feature>
              <Feature>Priority AI responses</Feature>
              <Feature>Everything in Free</Feature>
            </ul>
            {cta("basic", false)}
          </div>

          {/* Unlimited */}
          <div className="relative rounded-2xl border-2 border-paprika bg-card p-6 shadow-[6px_6px_0px_0px_var(--border)]">
            <div className="absolute -top-3 left-6 rounded-full bg-paprika px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              Most popular
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">Unlimited</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-black">$19.99</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <Feature>30 AI recipe generations / day</Feature>
              <Feature>100 AI helper tips / day</Feature>
              <Feature>Recipe variations (spicier, vegan, kid-friendly)</Feature>
              <Feature>Make-ahead, storage &amp; leftovers guidance</Feature>
              <Feature>Detailed steps with timing cues</Feature>
              <Feature>Allergen call-outs on every recipe</Feature>
              <Feature>Priority AI responses</Feature>
              <Feature>Cancel anytime — keep access until period ends</Feature>
              <Feature>Everything in Basic</Feature>
            </ul>
            <p className="mt-3 text-[11px] text-muted-foreground">
              *Fair use: up to 30 recipes + 100 helper tips / day per account.
            </p>
            {cta("unlimited", true)}
          </div>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl uppercase tracking-tight text-paprika mb-4">
            Common questions
          </h2>
          <dl className="grid gap-5 md:grid-cols-2 text-sm">
            <div>
              <dt className="font-bold">Can I cancel any time?</dt>
              <dd className="text-muted-foreground mt-1">
                Yes. Cancel from your billing portal in one click. You keep
                access until the end of the current period.
              </dd>
            </div>
            <div>
              <dt className="font-bold">What counts as one generation?</dt>
              <dd className="text-muted-foreground mt-1">
                Recipe generations turn ingredients or a dish name into full
                recipes. Helper tips include dish ideas, ingredient swaps,
                substitutions, and AI-powered cooking advice. Browsing saved
                recipes and shopping lists don't use your quota.
              </dd>
            </div>
            <div>
              <dt className="font-bold">Do you offer refunds?</dt>
              <dd className="text-muted-foreground mt-1">
                Email <a className="underline" href="mailto:support@fridgecuisine.com">support@fridgecuisine.com</a> within 7 days of a charge and we'll sort it.
              </dd>
            </div>
            <div>
              <dt className="font-bold">Is my data safe?</dt>
              <dd className="text-muted-foreground mt-1">
                Yes. Payments are processed by Stripe. See our{" "}
                <Link to="/security" className="underline">Security</Link> and{" "}
                <Link to="/privacy" className="underline">Privacy</Link> pages.
              </dd>
            </div>
          </dl>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Already a member?{" "}
          <Link to="/" className="underline">
            Go to the app
          </Link>
        </p>
      </div>

      <Drawer open={isMobile && checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DrawerContent className="h-[92dvh] p-0">
          <div className="h-full overflow-y-auto px-2 pb-6 pt-4">{checkoutInner}</div>
        </DrawerContent>
      </Drawer>
      <Dialog open={!isMobile && checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl p-2 sm:p-4">{checkoutInner}</DialogContent>
      </Dialog>
    </main>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-paprika" aria-hidden />
      <span>{children}</span>
    </li>
  );
}