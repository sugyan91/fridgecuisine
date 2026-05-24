import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ChefHat, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  getMyChefProfile,
  upsertChefProfile,
  startChefOnboarding,
  refreshChefAccountStatus,
  type ChefProfile,
} from "@/lib/marketplace.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "Become a Chef — FridgeCuisine" },
      {
        name: "description",
        content:
          "Sell your recipes worldwide. Keep 70%. Payouts straight to your bank via Stripe.",
      },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const fetchProfile = useServerFn(getMyChefProfile);
  const saveProfile = useServerFn(upsertChefProfile);
  const startOnboarding = useServerFn(startChefOnboarding);
  const refreshStatus = useServerFn(refreshChefAccountStatus);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ChefProfile | null>(null);
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((res) => {
        setProfile(res.profile);
        setBio(res.profile?.bio ?? "");
        setCountry(res.profile?.country ?? "");
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [fetchProfile]);

  const onSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await saveProfile({ data: { bio, country } });
      setProfile(res.profile);
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const onStartOnboarding = async () => {
    setLinking(true);
    try {
      const res = await startOnboarding({
        data: {
          returnUrl: `${window.location.origin}/sell?refresh=1`,
          environment: getStripeEnvironment(),
        },
      });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start onboarding");
      setLinking(false);
    }
  };

  const onRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const res = await refreshStatus({ data: { environment: getStripeEnvironment() } });
      if (res.profile) setProfile(res.profile);
      toast.success("Status refreshed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't refresh");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("refresh") === "1") {
      onRefreshStatus();
      url.searchParams.delete("refresh");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = profile?.payouts_enabled && profile?.charges_enabled;

  return (
    <>
      <Toaster />
      <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-10">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <Link
              to="/"
              className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              ← Back home
            </Link>
            <div className="flex items-center gap-3 mt-3 mb-2">
              <div className="bg-paprika text-white size-12 rounded-2xl border-2 border-border grid place-items-center shadow-[3px_3px_0px_0px_var(--border)]">
                <ChefHat className="size-7" strokeWidth={2.5} />
              </div>
              <h1 className="font-display text-3xl md:text-5xl uppercase">Sell your recipes</h1>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Share your signature dishes with home cooks worldwide. You set the price — we
              take 30% to keep the platform running, you keep <strong>70%</strong>. Payouts
              go straight to your bank via Stripe.
            </p>
          </header>

          {loading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="size-8 animate-spin opacity-50" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step 1 — Profile */}
              <Card
                step={1}
                title="Your chef profile"
                complete={Boolean(profile?.bio && profile?.country)}
              >
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Italy"
                  maxLength={80}
                  className="w-full border-2 border-border bg-white rounded-xl px-3 py-2 text-sm font-medium mb-4 focus:outline-none focus:ring-2 focus:ring-turmeric"
                />
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  Short bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell home cooks who you are and what you cook…"
                  maxLength={600}
                  rows={4}
                  className="w-full border-2 border-border bg-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={onSaveProfile}
                    disabled={saving}
                    className="bg-turmeric border-2 border-border px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5 active:shadow-[0px_1px_0px_0px_var(--border)] transition-all disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save profile"}
                  </button>
                </div>
              </Card>

              {/* Step 2 — Stripe Connect */}
              <Card
                step={2}
                title="Connect your bank with Stripe"
                complete={Boolean(ready)}
              >
                {ready ? (
                  <div className="flex items-start gap-3 bg-sage-soft border-2 border-border rounded-2xl p-4">
                    <CheckCircle2 className="size-5 mt-0.5 text-cardamom shrink-0" />
                    <div className="text-sm">
                      <p className="font-black uppercase tracking-wide text-cardamom">
                        You're ready to sell!
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Stripe will pay you out automatically. We deduct 30% per sale; you
                        keep 70%.
                      </p>
                    </div>
                  </div>
                ) : profile?.stripe_account_id ? (
                  <div className="flex items-start gap-3 bg-turmeric/15 border-2 border-dashed border-border/60 rounded-2xl p-4">
                    <AlertCircle className="size-5 mt-0.5 text-paprika shrink-0" />
                    <div className="text-sm flex-1">
                      <p className="font-black uppercase tracking-wide">
                        Stripe setup not finished
                      </p>
                      <p className="text-muted-foreground mt-1">
                        Continue where you left off, or refresh status if you've completed it.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={onStartOnboarding}
                          disabled={linking}
                          className="bg-paprika text-white border-2 border-border px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-0.5 disabled:opacity-60 inline-flex items-center gap-1.5"
                        >
                          Continue setup <ExternalLink className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={onRefreshStatus}
                          disabled={refreshing}
                          className="bg-white border-2 border-border px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wide disabled:opacity-60"
                        >
                          {refreshing ? "Refreshing…" : "I'm done — refresh"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Stripe handles identity verification, taxes, and pays you directly. Takes
                      about 5 minutes.
                    </p>
                    <button
                      type="button"
                      onClick={onStartOnboarding}
                      disabled={linking}
                      className="bg-paprika text-white border-2 border-border px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      {linking ? "Opening Stripe…" : "Start Stripe onboarding"}
                      <ExternalLink className="size-3.5" />
                    </button>
                  </>
                )}
              </Card>

              {/* Step 3 — List recipes (coming soon) */}
              <Card step={3} title="List your first recipe" complete={false}>
                <p className="text-sm text-muted-foreground mb-3">
                  Set a title, ingredients, steps, a cover photo and your price. Buyers unlock
                  the full recipe instantly.
                </p>
                <button
                  type="button"
                  disabled
                  className="bg-white border-2 border-dashed border-border/50 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide opacity-60"
                >
                  Coming in the next update
                </button>
              </Card>

              <p className="text-xs text-muted-foreground text-center pt-2">
                By selling on FridgeCuisine you agree that Stripe processes payments and we
                deduct a 30% platform fee on each sale.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Card({
  step,
  title,
  complete,
  children,
}: {
  step: number;
  title: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border-4 border-border rounded-3xl p-5 md:p-6 shadow-[6px_6px_0px_0px_var(--border)] relative">
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`size-9 rounded-full border-2 border-border grid place-items-center font-black ${
            complete ? "bg-cardamom text-white" : "bg-foreground text-background"
          }`}
        >
          {complete ? <CheckCircle2 className="size-5" /> : step}
        </span>
        <h2 className="font-display text-xl md:text-2xl uppercase">{title}</h2>
      </div>
      {children}
    </section>
  );
}