import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createCommunityRecipe } from "@/lib/community.functions";
import { DEFAULT_CUISINES, DEFAULT_DIETARY } from "@/lib/taxonomy";

export const Route = createFileRoute("/_authenticated/community/new")({
  component: NewRecipe,
});

function NewRecipe() {
  const navigate = useNavigate();
  const create = useServerFn(createCommunityRecipe);
  const [form, setForm] = useState({
    title: "",
    description: "",
    history: "",
    city: "",
    country: "",
    cuisine: "",
    image_url: "",
  });
  const [dietary, setDietary] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleDiet = (d: string) =>
    setDietary((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.split("\n").map((s) => s.trim()).filter(Boolean);
    const stp = steps.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!form.title.trim() || ing.length === 0 || stp.length === 0) {
      toast.error("Title, ingredients, and steps are required");
      return;
    }
    setBusy(true);
    try {
      const res = await create({
        data: { ...form, dietary, ingredients: ing, steps: stp, is_published: true },
      });
      toast.success("Recipe shared!");
      navigate({ to: "/community/$recipeId", params: { recipeId: res.id } });
    } catch (err: any) {
      toast.error(err?.message ?? "Couldn't save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/community" className="font-black text-xs uppercase opacity-60">
          ← Back
        </Link>
        <h1 className="font-display text-4xl md:text-5xl text-paprika mt-3 mb-6">Share a recipe</h1>

        <form onSubmit={submit} className="bg-white border-4 border-border rounded-3xl p-6 space-y-4 shadow-[6px_6px_0px_0px_var(--border)]">
          <Field label="Food name">
            <input value={form.title} maxLength={120} required onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
          </Field>
          <Field label="Tagline (one sentence)">
            <textarea value={form.description} maxLength={800} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${input} h-20`} />
          </Field>
          <Field label="History & background (origin story, family memory, what makes it special)">
            <textarea
              value={form.history}
              maxLength={4000}
              onChange={(e) => setForm({ ...form, history: e.target.value })}
              className={`${input} h-36`}
              placeholder="Where does this dish come from? Who taught you to make it?"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input value={form.city} maxLength={80} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} />
            </Field>
            <Field label="Country">
              <input value={form.country} maxLength={80} onChange={(e) => setForm({ ...form, country: e.target.value })} className={input} />
            </Field>
          </div>
          <Field label="Cuisine">
            <select value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value })} className={input}>
              <option value="">— select —</option>
              {DEFAULT_CUISINES.filter((c) => c !== "Any / Surprise Me").map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Image URL (optional)">
            <input value={form.image_url} maxLength={2000} placeholder="https://…" onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={input} />
          </Field>
          <Field label="Dietary tags">
            <div className="flex flex-wrap gap-2">
              {DEFAULT_DIETARY.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDiet(d)}
                  className={`border-2 border-border px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                    dietary.includes(d) ? "bg-paprika text-white" : "bg-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Ingredients (one per line)">
            <textarea required value={ingredients} onChange={(e) => setIngredients(e.target.value)} className={`${input} h-32 font-mono`} placeholder="2 cups rice&#10;1 onion, diced" />
          </Field>
          <Field label="Steps (one per line)">
            <textarea required value={steps} onChange={(e) => setSteps(e.target.value)} className={`${input} h-40 font-mono`} placeholder="Heat oil…&#10;Add onions…" />
          </Field>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-turmeric border-4 border-border py-4 rounded-2xl font-black text-xl uppercase shadow-[0px_5px_0px_0px_var(--border)] disabled:opacity-60"
          >
            {busy ? "Publishing…" : "Publish recipe"}
          </button>
        </form>
      </div>
    </main>
  );
}

const input = "w-full border-2 border-border rounded-xl px-3 py-2 font-medium bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-wider opacity-60 mb-1">{label}</span>
      {children}
    </label>
  );
}
