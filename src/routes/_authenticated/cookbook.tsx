import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  listSavedRecipes,
  setCookedStatus,
  unsaveRecipe,
  type SavedRecipeRow,
} from "@/lib/saved-receipes.functions";

export const Route = createFileRoute("/_authenticated/cookbook")({
  head: () => ({
    meta: [
      { title: "My Cookbook & Meal History — FridgeCuisine" },
      {
        name: "description",
        content: "Saved receipes and your cooked meal history on FridgeCuisine.",
      },
    ],
  }),
  component: CookbookPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CookbookPage() {
  const list = useServerFn(listSavedRecipes);
  const cook = useServerFn(setCookedStatus);
  const unsave = useServerFn(unsaveRecipe);
  const [rows, setRows] = useState<SavedRecipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"saved" | "history">("saved");

  useEffect(() => {
    list()
      .then((res) => setRows(res.rows))
      .catch(() => toast.error("Couldn't load your cookbook."))
      .finally(() => setLoading(false));
  }, [list]);

  const onCook = async (row: SavedRecipeRow) => {
    const nextCooked = !row.cooked_at;
    try {
      const res = await cook({ data: { id: row.id, cooked: nextCooked } });
      setRows((prev) => prev.map((r) => (r.id === row.id ? res.row : r)));
      toast.success(nextCooked ? "Logged to history" : "Removed from history");
    } catch {
      toast.error("Couldn't update status.");
    }
  };

  const onRemove = async (row: SavedRecipeRow) => {
    if (!confirm(`Remove "${row.title}" from your cookbook?`)) return;
    try {
      await unsave({ data: { title: row.title } });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch {
      toast.error("Couldn't remove.");
    }
  };

  const savedList = rows;
  const history = rows
    .filter((r) => r.cooked_at)
    .sort(
      (a, b) =>
        new Date(b.cooked_at as string).getTime() -
        new Date(a.cooked_at as string).getTime(),
    );

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="font-black text-xs uppercase opacity-60">
            ← Home
          </Link>
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-paprika mb-2 uppercase">
          My Cookbook
        </h1>
        <p className="opacity-70 text-sm mb-6">
          {savedList.length} saved · {history.length} cooked
        </p>

        <div className="inline-flex border-2 border-border rounded-full p-1 mb-6 bg-white">
          <button
            onClick={() => setTab("saved")}
            className={`px-4 py-1.5 text-xs font-black uppercase rounded-full ${
              tab === "saved" ? "bg-turmeric" : "opacity-60"
            }`}
          >
            Saved
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-1.5 text-xs font-black uppercase rounded-full ${
              tab === "history" ? "bg-turmeric" : "opacity-60"
            }`}
          >
            Meal history
          </button>
        </div>

        {loading ? (
          <p className="opacity-60">Loading…</p>
        ) : tab === "saved" ? (
          savedList.length === 0 ? (
            <p className="opacity-60">
              Nothing saved yet. Tap the heart on a receipe to add it here.
            </p>
          ) : (
            <ul className="space-y-3">
              {savedList.map((r) => (
                <li
                  key={r.id}
                  className="bg-white border-2 border-border rounded-2xl p-4 shadow-[3px_3px_0px_0px_var(--border)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl text-paprika truncate">
                        {r.title}
                      </p>
                      <p className="text-[11px] uppercase opacity-60 font-black">
                        {[r.cuisine, r.cook_time_minutes ? `${r.cook_time_minutes} min` : null]
                          .filter(Boolean)
                          .join(" · ")}
                        {r.cooked_at ? ` · ✓ Cooked ${formatDate(r.cooked_at)}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemove(r)}
                      className="text-xs font-black uppercase text-paprika border-2 border-border rounded-full px-3 py-1"
                    >
                      Remove
                    </button>
                  </div>
                  <button
                    onClick={() => onCook(r)}
                    className={`mt-3 w-full text-[11px] font-black uppercase tracking-widest py-2 rounded-full border-2 border-border ${
                      r.cooked_at ? "bg-turmeric" : "bg-background hover:bg-turmeric/20"
                    }`}
                  >
                    {r.cooked_at ? "Mark as not cooked" : "Mark as cooked"}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : history.length === 0 ? (
          <p className="opacity-60">
            No cooked meals yet. Mark a saved receipe as cooked to start your history.
          </p>
        ) : (
          <ul className="space-y-3">
            {history.map((r) => (
              <li
                key={r.id}
                className="bg-white border-2 border-border rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-display text-lg text-paprika truncate">{r.title}</p>
                  <p className="text-[11px] uppercase opacity-60 font-black">
                    Cooked {formatDate(r.cooked_at as string)}
                    {r.cuisine ? ` · ${r.cuisine}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => onCook(r)}
                  className="text-[11px] font-black uppercase border-2 border-border rounded-full px-3 py-1"
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}