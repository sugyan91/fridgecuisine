import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRecipeUsage } from "@/hooks/use-recipe-usage";
import { getMyAdminStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/usage")({
  head: () => ({
    meta: [
      { title: "Today's usage — FridgeCuisine" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UsagePage,
});

const TIER_LABEL: Record<string, string> = {
  anon: "Guest",
  free: "Free",
  basic: "Basic",
  unlimited: "Unlimited",
};

function nextMidnightLocal(): Date {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}

function UsagePage() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [adminState, setAdminState] = useState<"loading" | "yes" | "no">("loading");
  const fetchAdmin = useServerFn(getMyAdminStatus);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
      if (!data.user?.id) {
        setAdminState("no");
        return;
      }
      fetchAdmin()
        .then((r) => setAdminState(r.isAdmin ? "yes" : "no"))
        .catch(() => setAdminState("no"));
    });
  }, [fetchAdmin]);

  const {
    usedRecipes,
    usedHelpers,
    limitRecipes,
    limitHelpers,
    remainingRecipes,
    remainingHelpers,
    tier,
    countdown,
    loaded,
  } = useRecipeUsage(userId);

  if (adminState === "no") {
    return <Navigate to="/account" replace />;
  }

  const resetAt = nextMidnightLocal();
  const recipePct = Math.min(
    100,
    Math.round((usedRecipes / Math.max(1, limitRecipes)) * 100),
  );
  const helperPct = Math.min(
    100,
    Math.round((usedHelpers / Math.max(1, limitHelpers)) * 100),
  );
  const isUnlimitedTier = tier === "unlimited";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>

        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Today's usage
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track your AI recipe and helper usage today and when your limits reset.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {TIER_LABEL[tier] ?? "Free"} plan
              </span>
            </div>
            {isUnlimitedTier && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Fair use
              </span>
            )}
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">{usedRecipes}</span>
                  <span className="text-base text-muted-foreground">/ {limitRecipes} recipe generations</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{remainingRecipes} left</span>
              </div>
              <Progress value={recipePct} className="mt-3 h-2" />
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">{usedHelpers}</span>
                  <span className="text-base text-muted-foreground">/ {limitHelpers} helper tips</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{remainingHelpers} left</span>
              </div>
              <Progress value={helperPct} className="mt-3 h-2" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3 w-3" /> Resets in
              </div>
              <div className="mt-1 text-2xl font-black text-foreground">
                {countdown}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {resetAt.toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                local time
              </div>
            </div>
          </div>

          {!loaded && (
            <p className="mt-4 text-xs text-muted-foreground">Loading usage…</p>
          )}
        </section>

        {tier !== "unlimited" && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Need more?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tier === "basic"
                ? "Upgrade to Unlimited for $19.99/mo and get up to 30 recipes + 100 helper tips/day."
                : "Upgrade to Basic ($5.99/mo · 8 recipes + 20 helpers/day) or Unlimited ($19.99/mo · 30 recipes + 100 helpers/day)."}
            </p>
            <Button asChild className="mt-4">
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}