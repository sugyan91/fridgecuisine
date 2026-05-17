import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listCommunityRecipes } from "@/lib/community.functions";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community Cookbook — FridgeCuisine" },
      {
        name: "description",
        content:
          "Browse recipes shared by home cooks around the world. Filter by city, cuisine, and dietary preference.",
      },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const list = useServerFn(listCommunityRecipes);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await list({ data: { search: search || undefined, city: city || undefined, limit: 30 } });
    setRecipes(res.recipes ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="font-black text-xs uppercase opacity-60 hover:opacity-100">
            ← Home
          </Link>
          <Link
            to="/community/new"
            className="bg-turmeric border-2 border-border px-4 py-2 rounded-full font-black text-xs uppercase shadow-[2px_2px_0px_0px_var(--border)]"
          >
            + Share recipe
          </Link>
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-paprika mb-2">Community Cookbook</h1>
        <p className="text-sm opacity-70 mb-6">
          Recipes shared by home cooks. Discover by city or search a dish.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dish…"
            className="border-2 border-border rounded-xl px-3 py-2 font-medium"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (e.g. Kathmandu)"
            className="border-2 border-border rounded-xl px-3 py-2 font-medium"
          />
          <button className="bg-paprika text-white border-2 border-border rounded-xl py-2 font-black uppercase text-sm">
            Search
          </button>
        </form>

        {loading ? (
          <p className="text-center opacity-60">Loading…</p>
        ) : recipes.length === 0 ? (
          <p className="text-center opacity-60">No recipes yet. Be the first to share!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((r) => (
              <Link
                key={r.id}
                to="/community/$recipeId"
                params={{ recipeId: r.id }}
                className="bg-white border-4 border-border rounded-2xl p-4 shadow-[4px_4px_0px_0px_var(--border)] hover:translate-y-[-2px] transition-transform"
              >
                {r.image_url && (
                  <img src={r.image_url} alt={r.title} className="w-full h-40 object-cover rounded-xl mb-3 border-2 border-border" />
                )}
                <h3 className="font-display text-2xl text-paprika leading-tight mb-1">{r.title}</h3>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-60">
                  {[r.city, r.country, r.cuisine].filter(Boolean).join(" · ")}
                </p>
                {r.description && (
                  <p className="text-sm mt-2 line-clamp-2 opacity-80">{r.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="opacity-60">by {r.author_name}</span>
                  <span className="font-black">♥ {r.like_count}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
