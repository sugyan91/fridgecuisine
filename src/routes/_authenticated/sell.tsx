import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  ChefHat,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  ImagePlus,
} from "lucide-react";
import {
  getMyChefProfile,
  upsertChefProfile,
  startChefOnboarding,
  refreshChefAccountStatus,
  type ChefProfile,
} from "@/lib/marketplace.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import {
  listMyPaidReceipes,
  upsertPaidReceipe,
  deletePaidReceipe,
} from "@/lib/paid-receipes.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "Become a Chef — FridgeCuisine" },
      {
        name: "description",
        content:
          "Sell your receipes worldwide. Set your own price and reach home cooks everywhere.",
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
              <h1 className="font-display text-xl md:text-4xl uppercase">Sell your receipes</h1>
            </div>
            <p className="text-muted-foreground max-w-xl">
            Share your signature dishes with home cooks worldwide. You set the price and
            Stripe pays you directly.
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
                        Stripe will pay you out automatically. Fee breakdown appears on
                        your first sale.
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

              {/* Step 3 — List receipes (coming soon) */}
              <Card step={3} title="List your first receipe" complete={false}>
                <ReceipesManager />
              </Card>
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

type ReceipeRow = {
  id: string;
  title: string;
  local_name: string | null;
  country: string | null;
  city: string | null;
  cover_image_url: string | null;
  price_cents: number;
  is_published: boolean;
};

type StepDraft = { text: string; minutes: string };

const emptyDraft = () => ({
  id: undefined as string | undefined,
  title: "",
  local_name: "",
  country: "",
  city: "",
  description: "",
  ingredients: [""] as string[],
  steps: [{ text: "", minutes: "" }] as StepDraft[],
  price: "5.99",
  cover_image_url: "" as string,
  is_published: true,
});

function ReceipesManager() {
  const fetchList = useServerFn(listMyPaidReceipes);
  const save = useServerFn(upsertPaidReceipe);
  const remove = useServerFn(deletePaidReceipe);

  const [rows, setRows] = useState<ReceipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = () => {
    setLoading(true);
    fetchList()
      .then((res) => setRows(res.rows as ReceipeRow[]))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Couldn't load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickPhoto = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo must be under 8MB");
      return;
    }
    setUploading(true);
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("recipe-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("recipe-photos").getPublicUrl(path);
      setDraft((d) => ({ ...d, cover_image_url: pub.publicUrl }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    const cents = Math.round(parseFloat(draft.price) * 100);
    if (!draft.title.trim()) return toast.error("Add a food name");
    if (!cents || cents < 100) return toast.error("Price must be at least $1.00");
    const steps = draft.steps
      .map((s) => ({
        text: s.text.trim(),
        minutes: s.minutes ? Number(s.minutes) : undefined,
      }))
      .filter((s) => s.text);
    if (!steps.length) return toast.error("Add at least one step");
    const ingredients = draft.ingredients.map((i) => i.trim()).filter(Boolean);
    setSubmitting(true);
    try {
      await save({
        data: {
          id: draft.id,
          title: draft.title.trim(),
          local_name: draft.local_name.trim() || null,
          description: draft.description.trim() || null,
          country: draft.country.trim() || null,
          city: draft.city.trim() || null,
          cuisine: null,
          cover_image_url: draft.cover_image_url || null,
          ingredients,
          steps,
          price_cents: cents,
          is_published: draft.is_published,
        },
      });
      toast.success("Receipe saved");
      setDraft(emptyDraft());
      setEditing(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this receipe?")) return;
    try {
      await remove({ data: { id } });
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete");
    }
  };

  if (!editing) {
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-3">
          Add a food name, where it's from, ingredients and step-by-step instructions with
          timings. Buyers see the name, country and photo for free — and unlock the full
          recipe after paying your price.
        </p>
        {loading ? (
          <div className="py-6 grid place-items-center">
            <Loader2 className="size-5 animate-spin opacity-50" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-turmeric/10 border-2 border-dashed border-border/60 rounded-2xl p-4 text-sm text-muted-foreground mb-3">
            No receipes yet. Add your first one below.
          </div>
        ) : (
          <ul className="space-y-2 mb-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 border-2 border-border rounded-2xl p-2 bg-white"
              >
                {r.cover_image_url ? (
                  <img
                    src={r.cover_image_url}
                    alt=""
                    className="size-12 rounded-xl object-cover border-2 border-border"
                  />
                ) : (
                  <div className="size-12 rounded-xl bg-muted border-2 border-border grid place-items-center text-muted-foreground">
                    <ImagePlus className="size-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[r.city, r.country].filter(Boolean).join(", ") || "—"} · $
                    {(r.price_cents / 100).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  className="text-muted-foreground hover:text-paprika p-1"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => {
            setDraft(emptyDraft());
            setEditing(true);
          }}
          className="bg-paprika text-white border-2 border-border px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5 inline-flex items-center gap-2"
        >
          <Plus className="size-4" /> Add a receipe
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="Food name">
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="e.g. Hyderabadi Biryani"
          maxLength={160}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Country">
          <input
            value={draft.country}
            onChange={(e) => setDraft({ ...draft, country: e.target.value })}
            placeholder="India"
            maxLength={80}
            className={inputCls}
          />
        </Field>
        <Field label="City">
          <input
            value={draft.city}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            placeholder="Hyderabad"
            maxLength={80}
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Local name (optional)">
        <input
          value={draft.local_name}
          onChange={(e) => setDraft({ ...draft, local_name: e.target.value })}
          placeholder="e.g. హైదరాబాదీ బిర్యానీ"
          maxLength={160}
          className={inputCls}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={3}
          maxLength={2000}
          placeholder="What makes this dish special?"
          className={inputCls}
        />
      </Field>
      <Field label="Photo">
        <div className="flex items-center gap-3">
          {draft.cover_image_url ? (
            <img
              src={draft.cover_image_url}
              alt=""
              className="size-20 rounded-xl object-cover border-2 border-border"
            />
          ) : (
            <div className="size-20 rounded-xl bg-muted border-2 border-dashed border-border grid place-items-center text-muted-foreground">
              <ImagePlus className="size-5" />
            </div>
          )}
          <label className="bg-white border-2 border-border px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wide cursor-pointer">
            {uploading ? "Uploading…" : draft.cover_image_url ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickPhoto(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </Field>
      <Field label="Ingredients">
        <div className="space-y-2">
          {draft.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={ing}
                onChange={(e) => {
                  const next = [...draft.ingredients];
                  next[i] = e.target.value;
                  setDraft({ ...draft, ingredients: next });
                }}
                placeholder={`Ingredient ${i + 1}`}
                className={inputCls}
                maxLength={200}
              />
              <button
                type="button"
                onClick={() => {
                  const next = draft.ingredients.filter((_, idx) => idx !== i);
                  setDraft({ ...draft, ingredients: next.length ? next : [""] });
                }}
                className="px-2 text-muted-foreground"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setDraft({ ...draft, ingredients: [...draft.ingredients, ""] })
            }
            className="text-xs font-black uppercase tracking-wider text-paprika"
          >
            + Add ingredient
          </button>
        </div>
      </Field>
      <Field label="Steps & timings">
        <div className="space-y-2">
          {draft.steps.map((s, i) => (
            <div
              key={i}
              className="border-2 border-border rounded-xl p-2 bg-white space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-full bg-foreground text-background grid place-items-center text-xs font-black shrink-0">
                  {i + 1}
                </span>
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={s.minutes}
                  onChange={(e) => {
                    const next = [...draft.steps];
                    next[i] = { ...next[i], minutes: e.target.value };
                    setDraft({ ...draft, steps: next });
                  }}
                  placeholder="min"
                  className="w-16 border-2 border-border rounded-lg px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = draft.steps.filter((_, idx) => idx !== i);
                    setDraft({
                      ...draft,
                      steps: next.length ? next : [{ text: "", minutes: "" }],
                    });
                  }}
                  className="ml-auto text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <textarea
                value={s.text}
                onChange={(e) => {
                  const next = [...draft.steps];
                  next[i] = { ...next[i], text: e.target.value };
                  setDraft({ ...draft, steps: next });
                }}
                placeholder="Describe this step…"
                rows={2}
                maxLength={1000}
                className={inputCls}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setDraft({
                ...draft,
                steps: [...draft.steps, { text: "", minutes: "" }],
              })
            }
            className="text-xs font-black uppercase tracking-wider text-paprika"
          >
            + Add step
          </button>
        </div>
      </Field>
      <Field label="Price (USD)">
        <input
          type="number"
          min={1}
          max={500}
          step="0.01"
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          className={inputCls}
        />
      </Field>
      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setDraft(emptyDraft());
          }}
          className="bg-white border-2 border-border px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || uploading}
          className="bg-paprika text-white border-2 border-border px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5 disabled:opacity-60"
        >
          {submitting ? "Publishing…" : "Publish receipe"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border-2 border-border bg-white rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-turmeric";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}