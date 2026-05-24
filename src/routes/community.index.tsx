import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listCommunityReceipes } from "@/lib/community.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community Cookbook — FridgeCuisine" },
      {
        name: "description",
        content:
          "Browse receipes shared by home cooks around the world. Filter by city, cuisine, and dietary preference.",
      },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const list = useServerFn(listCommunityReceipes);
  const [receipes, setReceipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setIsAuthenticated(!!data.session));
    return () => subscription.unsubscribe();
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await list({ data: { search: search || undefined, city: city || undefined, limit: 30 } });
    setReceipes(res.receipes ?? []);
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
          {isAuthenticated ? (
            <Link
              to="/community/new"
              className="bg-turmeric border-2 border-border px-4 py-2 rounded-full font-black text-xs uppercase shadow-[2px_2px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-all"
            >
              + Share receipe
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-paprika text-white border-2 border-border px-4 md:px-5 py-2 md:py-2.5 rounded-full font-black text-sm md:text-base shadow-[2px_2px_0px_0px_var(--border)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--border)] active:translate-y-0.5 transition-all"
            >
              <span className="underline">Sign in</span> to share your own receipe
            </Link>
          )}
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-paprika mb-2">Community Cookbook</h1>
        <p className="text-sm opacity-70 mb-6">
          Receipes shared by home cooks. Discover by city or search a dish.
        </p>

        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl md:text-3xl">Latest from the community</h2>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="text-[11px] font-black uppercase tracking-wide bg-white border-2 border-border px-3 py-1.5 rounded-full shadow-[2px_2px_0px_0px_var(--border)]"
          >
            {showFilters ? "− Hide filters" : "🔎 Filter receipes"}
          </button>
        </div>

        {showFilters && (
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
        )}

        {loading ? (
          <p className="text-center opacity-60">Loading…</p>
        ) : receipes.length === 0 ? (
          <p className="text-center opacity-60">No receipes yet. Be the first to share!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {receipes.map((r) => (
              <Link
                key={r.id}
                to="/community/$receipeId"
                params={{ receipeId: r.id }}
                className="bg-white border-4 border-border rounded-2xl p-4 shadow-[4px_4px_0px_0px_var(--border)] hover:translate-y-[-2px] transition-transform"
              >
                {r.image_url && (
                  <img src={r.image_url} alt={r.title} className="w-full h-40 object-cover rounded-xl mb-3 border-2 border-border" />
                )}
                <h3 className="font-display text-2xl text-paprika leading-tight mb-1">{r.title}</h3>
                <p className="text-xs font-black uppercase tracking-wide mb-1">
                  by <span className="text-foreground">{r.author_name}</span>
                  {r.country && (
                    <> · <span className="text-foreground">{r.country}</span></>
                  )}
                </p>
                {(r.city || r.cuisine) && (
                  <p className="text-[11px] font-black uppercase tracking-wider opacity-60">
                    {[r.city, r.cuisine].filter(Boolean).join(" · ")}
                  </p>
                )}
                {r.description && (
                  <p className="text-sm mt-2 line-clamp-2 opacity-80">{r.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-black">👍 {r.up_count ?? 0} · 👎 {r.down_count ?? 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
