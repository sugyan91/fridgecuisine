import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Clock, Infinity as InfinityIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRecipeUsage } from "@/hooks/use-recipe-usage";
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  const { used, limit, unlimited, tier, remaining, countdown, loaded } =
    useRecipeUsage(userId);

  const resetAt = nextMidnightLocal();
  const pct = unlimited ? 100 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));

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
            Track how many AI recipes you've generated today and when your limit resets.
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
            {unlimited && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <InfinityIcon className="h-3 w-3" /> Unlimited
              </span>
            )}
          </div>

          <div className="mt-6">
            {unlimited ? (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground">{used}</span>
                <span className="text-lg text-muted-foreground">recipes today</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground">{used}</span>
                <span className="text-lg text-muted-foreground">/ {limit} used</span>
              </div>
            )}
            {!unlimited && (
              <Progress value={pct} className="mt-4 h-2" />
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Remaining
              </div>
              <div className="mt-1 text-2xl font-black text-foreground">
                {unlimited ? "∞" : remaining}
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3 w-3" /> Resets in
              </div>
              <div className="mt-1 text-2xl font-black text-foreground">
                {unlimited ? "—" : countdown}
              </div>
              {!unlimited && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {resetAt.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  local time
                </div>
              )}
            </div>
          </div>

          {!loaded && (
            <p className="mt-4 text-xs text-muted-foreground">Loading usage…</p>
          )}
        </section>

        {!unlimited && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-bold text-foreground">Need more recipes?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tier === "basic"
                ? "Upgrade to Unlimited for $19.99/mo and never hit a daily cap."
                : "Upgrade to Basic ($5.99/mo for 10/day) or Unlimited ($19.99/mo)."}
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