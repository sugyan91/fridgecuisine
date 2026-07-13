import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import {
  listMyCookbooks,
  upsertCookbook,
  deleteCookbook,
  listCookbookAddableRecipes,
  setCookbookRecipe,
} from "@/lib/cookbook-shop.functions";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { SafeImage } from "@/components/ui/safe-image";

export const Route = createFileRoute("/_authenticated/cookbooks")({
  head: () => ({
    meta: [
      { title: "My cookbooks — FridgeCuisine" },
      { name: "description", content: "Bundle your paid recipes into cookbooks and sell them worldwide." },
    ],
  }),
  component: CookbooksPage,
});

type Row = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  price_cents: number;
  is_published: boolean;
  created_at: string;
};

function CookbooksPage() {
  const list = useServerFn(listMyCookbooks);
  const save = useServerFn(upsertCookbook);
  const del = useServerFn(deleteCookbook);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Row>>({});
  const [saving, setSaving] = useState(false);
  const [manageRecipesFor, setManageRecipesFor] = useState<string | null>(null);

  const refresh = () =>
    list()
      .then((res) => setRows(res.rows as Row[]))
      .catch(() => toast.error("Couldn't load your cookbooks."))
      .finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = () => {
    setEditingId("new");
    setForm({ title: "", description: "", cover_image_url: "", price_cents: 999, is_published: true });
  };

  const startEdit = (r: Row) => {
    setEditingId(r.id);
    setForm(r);
  };

  const submit = async () => {
    const priceCents = Number(form.price_cents ?? 0);
    if (!form.title || form.title.trim().length < 1) {
      toast.error("Title required");
      return;
    }
    if (priceCents < 0 || priceCents > 50000) {
      toast.error("Price must be $0.00 – $500.00");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          ...(editingId && editingId !== "new" ? { id: editingId } : {}),
          title: form.title!.trim(),
          description: (form.description ?? "").trim() || null,
          cover_image_url: (form.cover_image_url ?? "").trim() || null,
          price_cents: priceCents,
          is_published: form.is_published ?? true,
        },
      });
      toast.success(editingId === "new" ? "Cookbook created" : "Saved");
      setEditingId(null);
      setForm({});
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this cookbook? Buyers who already own it keep access.")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto">
        <Link to="/sell" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="size-3" /> Back to sell
        </Link>
        <div className="flex items-baseline justify-between mt-2 mb-6">
          <h1 className="font-display text-3xl md:text-4xl uppercase">My cookbooks</h1>
          {editingId === null && (
            <Button onClick={startNew} size="sm">
              <Plus className="size-4 mr-1" /> New cookbook
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Bundle several of your paid recipes into a themed cookbook. Buyers pay once and unlock every recipe inside. Platform fee: 30%.
        </p>

        {editingId !== null && (
          <div className="rounded-3xl border-4 border-border bg-card p-4 md:p-6 mb-6 space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-wide">Title</label>
              <input
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Weeknight Italian classics"
                className="w-full mt-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wide">Description</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full mt-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-wide">Cover image URL</label>
              <input
                value={form.cover_image_url ?? ""}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                placeholder="https://…"
                className="w-full mt-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase tracking-wide">Price (USD)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={((form.price_cents ?? 0) / 100).toString()}
                  onChange={(e) => setForm({ ...form, price_cents: Math.round(Number(e.target.value) * 100) })}
                  className="w-full mt-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wide">Published</label>
                <select
                  value={form.is_published ? "yes" : "no"}
                  onChange={(e) => setForm({ ...form, is_published: e.target.value === "yes" })}
                  className="w-full mt-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="yes">Live in shop</option>
                  <option value="no">Draft (hidden)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={saving}>
                <Save className="size-4 mr-1" /> {saving ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => { setEditingId(null); setForm({}); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {rows.length === 0 && editingId === null && (
          <div className="text-center py-12 rounded-3xl border-4 border-dashed border-border">
            <BookOpen className="size-10 mx-auto text-muted-foreground" />
            <p className="mt-2 font-display text-lg uppercase">No cookbooks yet</p>
            <p className="text-sm text-muted-foreground mt-1">Bundle recipes into a cookbook to earn more per sale.</p>
          </div>
        )}

        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border-4 border-border bg-card p-4 flex gap-4">
              {r.cover_image_url ? (
                <SafeImage src={r.cover_image_url} alt={r.title} className="w-24 h-24 object-cover rounded-xl border-2 border-border shrink-0" />
              ) : (
                <div className="w-24 h-24 bg-muted rounded-xl border-2 border-border grid place-items-center shrink-0">
                  <BookOpen className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display text-lg uppercase leading-tight">{r.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.description || "No description"}</p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="font-black text-paprika">${(r.price_cents / 100).toFixed(2)}</span>
                  <span className={`px-2 py-0.5 rounded-full border-2 border-border font-black uppercase text-[10px] tracking-widest ${r.is_published ? "bg-turmeric/40" : "bg-muted"}`}>
                    {r.is_published ? "Live" : "Draft"}
                  </span>
                  <Link to="/shop/cookbook/$cookbookId" params={{ cookbookId: r.id }} className="underline text-muted-foreground">
                    View
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(r)}>Edit details</Button>
                  <Button size="sm" variant="outline" onClick={() => setManageRecipesFor(manageRecipesFor === r.id ? null : r.id)}>
                    {manageRecipesFor === r.id ? "Hide recipes" : "Manage recipes"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(r.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {manageRecipesFor === r.id && <RecipeManager cookbookId={r.id} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function RecipeManager({ cookbookId }: { cookbookId: string }) {
  const load = useServerFn(listCookbookAddableRecipes);
  const toggle = useServerFn(setCookbookRecipe);
  const [items, setItems] = useState<Array<{
    id: string; title: string; cover_image_url: string | null; price_cents: number; is_published: boolean; included: boolean;
  }>>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () =>
    load({ data: { cookbookId } })
      .then((res) => setItems(res.recipes as any))
      .catch(() => toast.error("Couldn't load recipes"));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookbookId]);

  const onToggle = async (recipeId: string, included: boolean) => {
    setBusy(recipeId);
    try {
      await toggle({ data: { cookbookId, recipeId, included } });
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 border-t-2 border-border pt-3 space-y-2">
      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Your paid recipes</p>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          You don't have any paid recipes yet.{" "}
          <Link to="/sell" className="underline">Create one first.</Link>
        </p>
      )}
      <ul className="space-y-1">
        {items.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">
              {r.title}
              <span className="text-muted-foreground text-xs ml-2">${(r.price_cents / 100).toFixed(2)}</span>
            </span>
            <Button
              size="sm"
              variant={r.included ? "default" : "outline"}
              onClick={() => onToggle(r.id, !r.included)}
              disabled={busy === r.id}
            >
              {r.included ? "In cookbook" : "Add"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
