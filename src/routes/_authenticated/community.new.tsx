import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createCommunityRecipe } from "@/lib/community.functions";
import { DEFAULT_CUISINES, DEFAULT_DIETARY } from "@/lib/taxonomy";
import { supabase } from "@/integrations/supabase/client";

async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  const src: CanvasImageSource | HTMLImageElement = bitmap ?? await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
  const w = (src as any).width as number;
  const h = (src as any).height as number;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(src, 0, 0, dw, dh);
  if ("close" in (src as any)) (src as ImageBitmap).close();
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) throw new Error("Compression failed");
  // Fallback to JPEG if WebP unsupported (blob will still exist but type may differ)
  return blob;
}

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
  const [customDiet, setCustomDiet] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20MB");
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const compressed = await compressImage(file);
      const ext = compressed.type.includes("webp") ? "webp" : "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("recipe-photos")
        .upload(path, compressed, { cacheControl: "3600", upsert: false, contentType: compressed.type });
      if (error) throw error;
      const { data } = supabase.storage.from("recipe-photos").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("Photo uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleDiet = (d: string) =>
    setDietary((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const addCustomDiet = () => {
    const v = customDiet.trim().slice(0, 40);
    if (!v) return;
    if (!/^[\p{L}0-9 ()/&'\-]+$/u.test(v)) {
      toast.error("Use letters, numbers, spaces only");
      return;
    }
    if (!dietary.includes(v)) setDietary([...dietary, v]);
    setCustomDiet("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.split("\n").map((s) => s.trim()).filter(Boolean);
    const stp = steps.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!form.title.trim() || !form.country.trim() || dietary.length === 0 || stp.length === 0) {
      toast.error("Food name, country, dietary tags, and steps are required");
      return;
    }
    setBusy(true);
    try {
      const res = await create({
        data: { ...form, dietary, ingredients: ing, steps: stp, is_published: true },
      });
      toast.success("Receipe shared!");
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
          <Field label="Food name" required>
            <input value={form.title} maxLength={120} required onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} />
          </Field>
          <Field label="Tag">
            <input
              value={form.description}
              maxLength={120}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Eg #comfortfood, #streetfood, #mom'srecipe"
              className={input}
            />
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
            <Field label="Country" required>
              <input value={form.country} maxLength={80} required onChange={(e) => setForm({ ...form, country: e.target.value })} className={input} />
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
          <Field label="Photo of your dish (optional)">
            <div className="space-y-2">
              {form.image_url && (
                <div className="relative">
                  <img src={form.image_url} alt="Dish preview" className="w-full max-h-64 object-cover rounded-xl border-2 border-border" />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="absolute top-2 right-2 bg-white border-2 border-border rounded-full px-3 py-1 text-xs font-black uppercase"
                  >
                    Remove
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPhoto(f);
                  e.target.value = "";
                }}
                className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-2 file:border-border file:bg-turmeric file:font-black file:text-xs file:uppercase file:cursor-pointer"
              />
              {uploading && <p className="text-xs font-black uppercase opacity-60">Uploading…</p>}
              <details className="text-xs">
                <summary className="cursor-pointer opacity-60 font-black uppercase">Or paste a URL</summary>
                <input value={form.image_url} maxLength={2000} placeholder="https://…" onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={`${input} mt-2`} />
              </details>
            </div>
          </Field>
          <Field label="Dietary tags" required>
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
              {dietary
                .filter((d) => !(DEFAULT_DIETARY as readonly string[]).includes(d))
                .map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDiet(d)}
                    className="border-2 border-border px-3 py-1 rounded-full text-[11px] font-black uppercase bg-paprika text-white"
                    title="Click to remove"
                  >
                    {d} ×
                  </button>
                ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={customDiet}
                maxLength={40}
                onChange={(e) => setCustomDiet(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomDiet();
                  }
                }}
                placeholder="Add custom (e.g. Low-FODMAP)"
                className={input}
              />
              <button
                type="button"
                onClick={addCustomDiet}
                className="border-2 border-border px-4 rounded-xl font-black text-xs uppercase bg-white whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          </Field>
          <Field label="Ingredients (one per line)">
            <textarea required value={ingredients} onChange={(e) => setIngredients(e.target.value)} className={`${input} h-32 font-mono`} placeholder="2 cups rice&#10;1 onion, diced" />
          </Field>
          <Field label="Steps (one per line)" required>
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

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-black uppercase tracking-wider opacity-60 mb-1">
        {label}
        {required && <span className="text-paprika ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
