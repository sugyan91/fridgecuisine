import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Check, Loader2, ChefHat, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { getStripeEnvironment } from "@/lib/stripe";
import { ENDPOINT_LIMITS, type PlanTier } from "@/lib/ai-quota";
import {
  type BillingOverview,
  type PaidPlanKey,
  type PlanChangePreview,
  cancelScheduledPlanChange,
  changeSubscriptionPlan,
  getBillingOverview,
  previewPlanChange,
} from "@/lib/payments.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePurchasesEnabled } from "@/hooks/use-purchases-enabled";
import { IapUnavailableNotice } from "@/components/native/IapUnavailableNotice";

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

type PlanMeta = {
  key: PaidPlanKey;
  name: string;
  price: string;
  blurb: string;
  perks: string[];
};

const PLANS: PlanMeta[] = [
  {
    key: "basic",
    name: "Basic",
    price: "$5.99/mo",
    blurb: "For weeknight cooking.",
    perks: [
      `${ENDPOINT_LIMITS.basic.recipes} AI recipes per day`,
      `${ENDPOINT_LIMITS.basic.helpers} AI helpers per day`,
      "Nutrition + pairings",
      "Chef's notes + PDF export",
    ],
  },
  {
    key: "unlimited",
    name: "Unlimited",
    price: "$19.99/mo",
    blurb: "For serious home cooks.",
    perks: [
      `${ENDPOINT_LIMITS.unlimited.recipes} AI recipes per day`,
      `${ENDPOINT_LIMITS.unlimited.helpers} AI helpers per day`,
      "Recipe variations + allergen call-outs",
      "Make-ahead + storage guidance",
    ],
  },
];


function formatDate(iso: string | null | undefined): string {
  if (!iso) return "your next renewal";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function PlanSwitcher({ onChanged }: { onChanged?: () => void }) {
  const purchasesEnabled = usePurchasesEnabled();
  const env = getStripeEnvironment();
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<PaidPlanKey | null>(null);
  const [preview, setPreview] = useState<PlanChangePreview | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getBillingOverview({ data: { environment: env } });
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [env]);

  useEffect(() => {
    void load();
  }, [load]);

  const openChange = async (plan: PaidPlanKey) => {
    setPendingPlan(plan);
    setPreview(null);
    try {
      const res = await previewPlanChange({ data: { plan, environment: env } });
      setPreview(res);
    } catch (e) {
      setPreview({ error: (e as Error).message });
    }
  };

  const confirmChange = async () => {
    if (!pendingPlan) return;
    setBusy(true);
    try {
      const res = await changeSubscriptionPlan({
        data: { plan: pendingPlan, environment: env },
      });
      if ("error" in res) {
        toast.error(res.error);
      } else {
        toast.success(
          res.direction === "upgrade"
            ? "You're on your new plan — the richer recipe output is live now."
            : `Your plan changes on ${formatDate(res.effectiveAt)}. Nothing changes before then.`,
        );
        setPendingPlan(null);
        setPreview(null);
        await load();
        onChanged?.();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const undoScheduled = async () => {
    setBusy(true);
    try {
      const res = await cancelScheduledPlanChange({ data: { environment: env } });
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Scheduled change removed — your current plan will renew as usual.");
        await load();
        onChanged?.();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your plan options…
        </p>
      </section>
    );
  }

  const currentPlan = overview?.currentPlan ?? "free";
  const hasSub = !!overview?.hasSubscription;
  const renewsAt = overview?.hasSubscription ? overview.renewsAt : null;
  const scheduled = overview?.hasSubscription ? overview.scheduledChange : null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Change your plan
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrades start immediately (you're billed the prorated difference).
            Downgrades take effect at your next renewal, so you keep what you paid for.
          </p>
        </div>
        {renewsAt && (
          <p className="text-sm text-muted-foreground">
            Renews {formatDate(renewsAt)}
          </p>
        )}
      </div>

      {/* Daily generation quota summary */}
      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Daily AI allowance
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(["free", "basic", "unlimited"] as PlanTier[]).map((tier) => {
            const isCurrent = currentPlan === tier;
            return (
              <div
                key={tier}
                className={`rounded-lg border p-3 ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold capitalize text-foreground">
                    {tier}
                  </span>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-[10px]">
                      You
                    </Badge>
                  )}
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChefHat className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong className="text-foreground">
                        {ENDPOINT_LIMITS[tier].recipes}
                      </strong>{" "}
                      recipes/day
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wand2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <strong className="text-foreground">
                        {ENDPOINT_LIMITS[tier].helpers}
                      </strong>{" "}
                      helpers/day
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Recipes = full recipe generations. Helpers = swaps, daily-dinner tweaks,
          peek-with-AI, fridge-vision, and image generation.
        </p>
      </div>

      {scheduled && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <span className="text-foreground">
            Scheduled: switching to{" "}
            <strong>{PLANS.find((p) => p.key === scheduled.plan)?.name}</strong> on{" "}
            {formatDate(scheduled.effectiveAt)}.
          </span>
          <Button size="sm" variant="outline" onClick={undoScheduled} disabled={busy}>
            Keep current plan
          </Button>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isScheduled = scheduled?.plan === plan.key;
          const isUpgrade = currentPlan === "basic" && plan.key === "unlimited";
          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-4 ${
                isCurrent ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{plan.name}</p>
                {isCurrent ? (
                  <Badge variant="secondary">Current plan</Badge>
                ) : isScheduled ? (
                  <Badge variant="outline">Scheduled</Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm font-medium text-foreground">{plan.price}</p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
              <ul className="mt-3 space-y-1.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Your plan
                  </Button>
                ) : !purchasesEnabled ? (
                  <IapUnavailableNotice what="Plan changes" />
                ) : !hasSub ? (
                  <Button asChild className="w-full">
                    <Link to="/pricing">Choose {plan.name}</Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isUpgrade ? "default" : "outline"}
                    onClick={() => openChange(plan.key)}
                    disabled={busy || isScheduled}
                  >
                    {isUpgrade ? (
                      <ArrowUp className="mr-2 h-4 w-4" />
                    ) : (
                      <ArrowDown className="mr-2 h-4 w-4" />
                    )}
                    {isScheduled
                      ? "Already scheduled"
                      : isUpgrade
                        ? `Upgrade to ${plan.name}`
                        : `Switch to ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!pendingPlan}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setPendingPlan(null);
            setPreview(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Switch to {PLANS.find((p) => p.key === pendingPlan)?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {!preview ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking what this costs…
                  </span>
                ) : "error" in preview ? (
                  <span className="text-destructive">{preview.error}</span>
                ) : preview.direction === "upgrade" ? (
                  <>
                    <span className="block">
                      Effective <strong>immediately</strong> — your new plan's recipe
                      limits and richer output unlock as soon as you confirm.
                    </span>
                    <span className="block">
                      Due today:{" "}
                      <strong>
                        {formatMoney(preview.amountDueCents, preview.currency)}
                      </strong>{" "}
                      (prorated for the rest of this period). Your renewal date stays the same.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block">
                      Effective <strong>{formatDate(preview.effectiveAt)}</strong> — you
                      keep your current plan until then.
                    </span>
                    <span className="block">
                      Nothing is charged today. You can undo this any time before that date.
                    </span>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Never mind</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmChange();
              }}
              disabled={busy || !preview || "error" in (preview ?? {})}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}