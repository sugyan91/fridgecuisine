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

export const Route = createFileRoute("/_authenticated/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  const { isPremium, subscription, loading } = useSubscription(user?.id);

  const fetchClientSecret = async (): Promise<string> => {
    if (!user) throw new Error("Not signed in");
    const returnUrl = `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const secret = await createCheckoutSession({
      data: {
        priceId: "premium_monthly",
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (!secret) throw new Error("No client secret");
    return secret;
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
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      alert("Could not open billing portal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-4xl font-black tracking-tight text-foreground">Choose your plan</h1>
        <p className="mt-2 text-muted-foreground">
          Generate receipes from whatever is in your fridge. Upgrade for unlimited.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold">Free</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-black">$0</span>
                <span className="text-muted-foreground">/ forever</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                <Feature>5 AI receipe generations / day</Feature>
                <Feature>Save & share receipes</Feature>
                <Feature>Browse the community</Feature>
              </ul>
              <Button variant="outline" className="mt-6 w-full" disabled>
                {isPremium ? "Included" : "Current plan"}
              </Button>
            </div>

            {/* Premium */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-md">
              <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                MOST POPULAR
              </div>
              <h2 className="text-xl font-bold">Premium</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-black">$5.99</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                <Feature>Unlimited AI receipe generations</Feature>
                <Feature>Priority AI responses</Feature>
                <Feature>Cancel anytime — keep access until period ends</Feature>
                <Feature>Everything in Free</Feature>
              </ul>
              {loading ? (
                <Button className="mt-6 w-full" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : isPremium ? (
                <div className="mt-6 space-y-2">
                  <div className="rounded-md bg-primary/10 px-3 py-2 text-center text-sm font-semibold text-primary">
                    You're Premium ✓
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
              ) : (
                <Button className="mt-6 w-full" onClick={() => setCheckoutOpen(true)}>
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Already a member?{" "}
          <Link to="/" className="underline">
            Go to the app
          </Link>
        </p>
      </div>

      {isMobile ? (
        <Drawer open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DrawerContent className="h-[92vh] p-0">
            <div className="h-full overflow-y-auto px-2 pb-6 pt-4">
              {checkoutOpen && (
                <EmbeddedCheckoutProvider
                  stripe={getStripe()}
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
          <DialogContent className="max-w-2xl p-2 sm:p-4">
            {checkoutOpen && (
              <EmbeddedCheckoutProvider
                stripe={getStripe()}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}