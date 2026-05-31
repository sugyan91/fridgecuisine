import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listMyRecipes, deleteCommunityRecipe } from "@/lib/community.functions";

export const Route = createFileRoute("/_authenticated/my-recipes")({
  component: MyRecipes,
});

function MyRecipes() {
  const list = useServerFn(listMyRecipes);
  const del = useServerFn(deleteCommunityRecipe);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    list().then((r) => {
      setRecipes(r.recipes);
      setLoading(false);
    });
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this recipe?")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Couldn't delete");
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="font-black text-xs uppercase opacity-60">← Home</Link>
          <Link to="/community/new" className="bg-turmeric border-2 border-border px-4 py-2 rounded-full font-black text-xs uppercase">
            + New recipe
          </Link>
        </div>
        <h1 className="font-display text-4xl text-paprika mb-6">My recipes</h1>
        {loading ? (
          <p className="opacity-60">Loading…</p>
        ) : recipes.length === 0 ? (
          <p className="opacity-60">You haven't shared any recipes yet.</p>
        ) : (
          <ul className="space-y-3">
            {recipes.map((r) => (
              <li key={r.id} className="bg-white border-2 border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <Link to="/community/$recipeId" params={{ recipeId: r.id }} className="font-display text-xl text-paprika">
                    {r.title}
                  </Link>
                  <p className="text-[11px] uppercase opacity-60 font-black">
                    {[r.city, r.cuisine].filter(Boolean).join(" · ")} {r.is_published ? "" : "· Draft"}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(r.id)}
                  className="text-xs font-black uppercase text-paprika border-2 border-border rounded-full px-3 py-1"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
