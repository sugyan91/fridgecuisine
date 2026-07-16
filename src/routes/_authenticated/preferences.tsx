import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, X } from "lucide-react";
import { getUserPreferences, saveUserPreferences } from "@/lib/user-preferences.functions";
import { CORE_DIETARY } from "@/lib/taxonomy";

export const Route = createFileRoute("/_authenticated/preferences")({
  head: () => ({
    meta: [
      { title: "Dietary Profile — FridgeCuisine" },
      { name: "description", content: "Set your allergies, diet, and default servings." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PreferencesPage,
});

const SPICE = ["mild", "medium", "spicy", "extra-spicy"] as const;
type Spice = (typeof SPICE)[number];

function TagField({
  label,
  hint,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  tags: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().slice(0, 40);
    if (!v) return;
    if (tags.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    onChange([...tags, v]);
    setDraft("");
  };
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          maxLength={40}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function PreferencesPage() {
  const fetchPrefs = useServerFn(getUserPreferences);
  const savePrefs = useServerFn(saveUserPreferences);

  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [servings, setServings] = useState<number | "">("");
  const [spice, setSpice] = useState<Spice | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrefs()
      .then((p) => {
        setDietary(p.custom_dietary ?? []);
        setAllergies(p.allergies ?? []);
        setDislikes(p.disliked_ingredients ?? []);
        setServings(p.default_servings ?? "");
        setSpice((p.spice_level as Spice | null) ?? "");
      })
      .catch(() => toast.error("Couldn't load preferences."))
      .finally(() => setLoading(false));
  }, [fetchPrefs]);

  const toggleDietary = (tag: string) => {
    setDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await savePrefs({
        data: {
          custom_dietary: dietary,
          allergies,
          disliked_ingredients: dislikes,
          default_servings: servings === "" ? null : Number(servings),
          spice_level: spice === "" ? null : spice,
        },
      });
      toast.success("Preferences saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="text-lg font-semibold">Dietary Profile</h1>
          <Link to="/pantry" className="text-sm text-primary hover:underline">
            Pantry
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          These settings are applied automatically every time you generate recipes.
        </p>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <>
            <section>
              <label className="mb-2 block text-sm font-medium">Diet</label>
              <div className="flex flex-wrap gap-2">
                {CORE_DIETARY.map((d) => {
                  const active = dietary.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDietary(d)}
                      className={`rounded-full border px-3 py-1.5 text-sm ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <TagField
                label="Allergies"
                hint="Recipes will strictly avoid these ingredients."
                tags={allergies}
                onChange={setAllergies}
                placeholder="e.g. Peanuts, Shellfish"
              />
            </section>

            <section>
              <TagField
                label="Disliked ingredients"
                hint="We'll exclude these from generated recipes."
                tags={dislikes}
                onChange={setDislikes}
                placeholder="e.g. Cilantro, Olives"
              />
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Default servings</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={servings}
                  onChange={(e) =>
                    setServings(e.target.value === "" ? "" : Math.max(1, Math.min(20, Number(e.target.value))))
                  }
                  placeholder="e.g. 2"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Spice level</label>
                <select
                  value={spice}
                  onChange={(e) => setSpice(e.target.value as Spice | "")}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">No preference</option>
                  {SPICE.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save preferences
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}