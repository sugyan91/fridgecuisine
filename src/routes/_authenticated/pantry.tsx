import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Plus, Trash2 } from "lucide-react";
import {
  addPantryItems,
  clearPantry,
  listPantry,
  removePantryItem,
  type PantryItem,
} from "@/lib/pantry.functions";
import { detectFridgeIngredients } from "@/lib/fridge-vision.functions";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/_authenticated/pantry")({
  head: () => ({
    meta: [
      { title: "My Pantry — FridgeCuisine" },
      { name: "description", content: "Track what's in your fridge and pantry." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PantryPage,
});

function titleCase(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function PantryPage() {
  const load = useServerFn(listPantry);
  const addItems = useServerFn(addPantryItems);
  const removeItem = useServerFn(removePantryItem);
  const clear = useServerFn(clearPantry);
  const detect = useServerFn(detectFridgeIngredients);
  const { language } = useLanguage();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () =>
    load()
      .then((r) => setItems(r.items))
      .catch(() => toast.error("Couldn't load your pantry."));

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addOne = async () => {
    const name = titleCase(draft);
    if (!name) return;
    setBusy(true);
    try {
      await addItems({ data: { items: [{ name }] } });
      setDraft("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add item.");
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = async (file: File) => {
    if (file.size > 5_000_000) {
      toast.error("Image too large (max 5MB).");
      return;
    }
    setScanning(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Read failed"));
        reader.readAsDataURL(file);
      });
      const res = await detect({ data: { imageDataUrl: dataUrl, language: language.name } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.ingredients.length === 0) {
        toast("No ingredients detected. Try a clearer photo.");
        return;
      }
      await addItems({
        data: { items: res.ingredients.map((n) => ({ name: titleCase(n) })) },
      });
      toast.success(`Added ${res.ingredients.length} item${res.ingredients.length === 1 ? "" : "s"}.`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const del = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await removeItem({ data: { id } });
    } catch {
      toast.error("Couldn't remove item.");
      refresh();
    }
  };

  const wipe = async () => {
    if (!confirm("Clear your entire pantry?")) return;
    await clear();
    setItems([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="text-lg font-semibold">My Pantry</h1>
          <Link to="/preferences" className="text-sm text-primary hover:underline">
            Preferences
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Snap a photo of your fridge or add items by hand. We'll use these when you generate recipes.
        </p>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPhoto(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {scanning ? "Scanning…" : "Scan fridge photo"}
          </button>
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addOne();
              }}
              placeholder="Add ingredient…"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              maxLength={60}
            />
            <button
              type="button"
              onClick={addOne}
              disabled={busy || !draft.trim()}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Your pantry is empty. Scan a photo or add something above.
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{items.length} item{items.length === 1 ? "" : "s"}</span>
              <button type="button" onClick={wipe} className="hover:text-destructive">
                Clear all
              </button>
            </div>
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{i.name}</div>
                    {i.quantity && (
                      <div className="text-xs text-muted-foreground">{i.quantity}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => del(i.id)}
                    aria-label={`Remove ${i.name}`}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}