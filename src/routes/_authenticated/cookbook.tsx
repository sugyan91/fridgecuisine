import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookHeart, ChefHat } from "lucide-react";
import {
  listSavedRecipes,
  setCookedStatus,
  unsaveRecipe,
  type SavedRecipeRow,
} from "@/lib/saved-recipes.functions";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { toastError, toastSuccess } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/cookbook")({
  head: () => ({
    meta: [
      { title: "My Cookbook & Meal History — FridgeCuisine" },
      {
        name: "description",
        content: "Saved recipes and your cooked meal history on FridgeCuisine.",
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
      .catch((e) => toastError(e, "Couldn't load your cookbook."))
      .finally(() => setLoading(false));
  }, [list]);

  const onCook = async (row: SavedRecipeRow) => {
    const nextCooked = !row.cooked_at;
    try {
      const res = await cook({ data: { id: row.id, cooked: nextCooked } });
      setRows((prev) => prev.map((r) => (r.id === row.id ? res.row : r)));
      toastSuccess(nextCooked ? "Logged to history" : "Removed from history");
    } catch (e) {
      toastError(e, "Couldn't update status.");
    }
  };

  const onRemove = async (row: SavedRecipeRow) => {
    if (!confirm(`Remove "${row.title}" from your cookbook?`)) return;
    try {
      await unsave({ data: { title: row.title } });
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      toastError(e, "Couldn't remove.");
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
          <div className="flex items-center gap-2">
            <Link
              to="/pantry"
              className="font-black text-xs uppercase bg-white border-2 border-border rounded-full px-3 py-1.5 shadow-[3px_3px_0px_0px_var(--border)]"
            >
              Pantry
            </Link>
            <Link
              to="/preferences"
              className="font-black text-xs uppercase bg-white border-2 border-border rounded-full px-3 py-1.5 shadow-[3px_3px_0px_0px_var(--border)]"
            >
              Diet
            </Link>
            <Link
              to="/following"
              className="font-black text-xs uppercase bg-white border-2 border-border rounded-full px-3 py-1.5 shadow-[3px_3px_0px_0px_var(--border)]"
            >
              Following
            </Link>
            <Link
              to="/plan"
              className="font-black text-xs uppercase bg-turmeric border-2 border-border rounded-full px-3 py-1.5 shadow-[3px_3px_0px_0px_var(--border)]"
            >
              Plan →
            </Link>
          </div>
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
          <SkeletonList count={4} />
        ) : tab === "saved" ? (
          savedList.length === 0 ? (
            <EmptyState
              icon={BookHeart}
              title="Your cookbook is empty"
              description="Tap the heart on any recipe to save it here for quick access."
              action={{ label: "Find recipes", to: "/" }}
            />
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
                  <Link
                    to="/cook/$id"
                    params={{ id: r.id }}
                    className="mt-2 block text-center w-full text-[11px] font-black uppercase tracking-widest py-2 rounded-full border-2 border-border bg-paprika text-white shadow-[3px_3px_0px_0px_var(--border)]"
                  >
                    Cook now →
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : history.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title="No cooked meals yet"
            description="Mark a saved recipe as cooked to start building your meal history."
            action={{ label: "Browse saved", onClick: () => setTab("saved") }}
          />
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