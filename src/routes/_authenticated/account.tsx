import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, CreditCard, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import {
  cancelSubscription,
  reactivateSubscription,
  createPortalSession,
} from "@/lib/payments.functions";
import { useSubscription } from "@/hooks/use-subscription";
import { PlanSwitcher } from "@/components/account/PlanSwitcher";
import { useRecipeUsage } from "@/hooks/use-recipe-usage";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — FridgeCuisine" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AccountPage,
});

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  const { subscription, isPremium, loading, tier } = useSubscription(user?.id);
  const { used, limit, remaining, loaded: usageLoaded } = useRecipeUsage(user?.id);
  const isAdmin = useIsAdmin(user?.id);
  const env = getStripeEnvironment();

  const periodEnd = subscription?.current_period_end ?? null;
  const pendingCancel = !!subscription?.cancel_at_period_end && subscription?.status !== "canceled";

  const handleCancel = async () => {
    setBusy(true);
    try {
      const res = await cancelSubscription({ data: { environment: env } });
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(
          res.canceled_at
            ? `Subscription will end on ${formatDate(res.canceled_at)}.`
            : "Subscription canceled.",
        );
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  const handleResume = async () => {
    setBusy(true);
    try {
      const res = await reactivateSubscription({ data: { environment: env } });
      if ("error" in res) toast.error(res.error);
      else toast.success("Subscription resumed.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const openPortal = async () => {
    setBusy(true);
    try {
      const url = await createPortalSession({
        data: {
          returnUrl: `${window.location.origin}/account`,
          environment: env,
        },
      });
      if (typeof url === "string") window.open(url, "_blank");
    } catch (e) {
      toast.error((e as Error).message || "Could not open billing portal.");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-4xl font-black tracking-tight text-foreground">Your account</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your plan and billing.
        </p>

        {/* Profile */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Signed in as
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {user?.email ?? "…"}
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </section>

        {/* Plan */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current plan
              </p>
              {loading ? (
                <p className="mt-1 text-lg font-semibold text-foreground">Loading…</p>
              ) : tier === "unlimited" ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    Unlimited · $19.99/mo
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Up to 50 recipes/day (fair use) ·{" "}
                    {pendingCancel
                      ? `Access ends on ${formatDate(periodEnd)}`
                      : periodEnd
                        ? `Renews on ${formatDate(periodEnd)}`
                        : "Active"}
                  </p>
                </>
              ) : tier === "basic" ? (
                <>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    Basic · $5.99/mo
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    10 recipes per day ·{" "}
                    {pendingCancel
                      ? `Access ends on ${formatDate(periodEnd)}`
                      : periodEnd
                        ? `Renews on ${formatDate(periodEnd)}`
                        : "Active"}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-lg font-semibold text-foreground">Free plan</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    2 recipes per day. Upgrade for 10/day or 50/day.
                  </p>
                </>
              )}
            </div>
          </div>

          {subscription?.status === "past_due" && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                Your last payment failed. Update your card to keep your paid access.
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {isAdmin && (
              <Button asChild variant="outline">
                <Link to="/usage">Today's usage</Link>
              </Button>
            )}
            {!isPremium && (
              <Button asChild>
                <Link to="/pricing">See plans</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/earnings">Your earnings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/analytics">Storefront analytics</Link>
            </Button>
            {isPremium && !pendingCancel && (
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(true)}
                disabled={busy}
              >
                Cancel subscription
              </Button>
            )}
            {isPremium && pendingCancel && (
              <Button onClick={handleResume} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resume subscription"}
              </Button>
            )}
            {subscription ? (
              <Button variant="ghost" onClick={openPortal} disabled={busy}>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage billing
              </Button>
            ) : null}
          </div>
        </section>

        {/* Self-serve upgrade / downgrade */}
        {!loading && <PlanSwitcher />}

        {/* Today's usage — admin only */}
        {isAdmin && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Today's usage
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {usageLoaded ? (
                  <>
                    {used} of {limit} recipes used
                  </>
                ) : (
                  "Loading…"
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {usageLoaded ? (
                  <>
                    {remaining} remaining today ·{" "}
                    <Link to="/usage" className="underline underline-offset-2 text-foreground">
                      View details
                    </Link>
                  </>
                ) : (
                  "Fetching your recipe count…"
                )}
              </p>
            </div>
            <Sparkles className="h-8 w-8 text-primary/60" />
          </div>
        </section>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {periodEnd
                ? `You'll keep paid access until ${formatDate(periodEnd)}. After that you'll be moved to the Free plan. You can resume anytime before then.`
                : "You'll keep paid access until the end of your current billing period."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}