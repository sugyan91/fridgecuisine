import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listCommunityRecipes } from "@/lib/community.functions";

type Recipe = {
  id: string;
  title: string;
  description: string | null;
  city: string | null;
  country: string | null;
  cuisine: string | null;
  image_url: string | null;
  author_name: string;
  up_count: number;
  down_count: number;
};

export function CommunityStrip({ isAuthenticated }: { isAuthenticated: boolean }) {
  const fetchRecipes = useServerFn(listCommunityRecipes);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);

  useEffect(() => {
    fetchRecipes({ data: { limit: 6 } })
      .then((res) => setRecipes((res.recipes as Recipe[]) ?? []))
      .catch(() => setRecipes([]));
  }, [fetchRecipes]);

  if (recipes && recipes.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto mt-10 md:mt-14">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="font-black uppercase tracking-widest text-[10px] opacity-60">
            From the community
          </p>
          <h2 className="font-display text-2xl md:text-4xl tracking-tight">
            What people are cooking
          </h2>
        </div>
        <Link
          to="/community"
          className="text-[11px] md:text-xs font-black uppercase tracking-wide bg-white border-2 border-border px-3 py-2 rounded-full shadow-[2px_2px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-all whitespace-nowrap"
        >
          See all →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(recipes ?? Array.from({ length: 3 })).map((r, i) => {
          if (!r) {
            return (
              <div
                key={i}
                className="h-44 rounded-2xl border-2 border-border bg-white/50 animate-pulse"
              />
            );
          }
          const place = [r.city, r.country].filter(Boolean).join(", ");
          return (
            <Link
              key={r.id}
              to="/community/$recipeId"
              params={{ recipeId: r.id }}
              className="group block bg-white border-2 border-border rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_var(--border)] hover:shadow-[5px_5px_0px_0px_var(--border)] hover:translate-y-[-2px] transition-all"
            >
              {r.image_url ? (
                <div
                  className="h-32 bg-cover bg-center border-b-2 border-border"
                  style={{ backgroundImage: `url(${r.image_url})` }}
                />
              ) : (
                <div className="h-32 bg-gradient-to-br from-turmeric/40 to-paprika/30 border-b-2 border-border flex items-center justify-center font-display text-3xl text-paprika">
                  {r.title.charAt(0)}
                </div>
              )}
              <div className="p-3">
                <h3 className="font-display text-lg leading-tight line-clamp-2 group-hover:text-paprika transition-colors">
                  {r.title}
                </h3>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-60 truncate">
                  {[r.cuisine, place].filter(Boolean).join(" · ") || "Community recipe"}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                  <span className="opacity-70 truncate">by {r.author_name}</span>
                  <span className="opacity-70 whitespace-nowrap">👍 {r.up_count} · 👎 {r.down_count}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {!isAuthenticated && (
        <p className="mt-5 text-sm font-medium opacity-80 text-center">
          <Link to="/login" className="underline font-black text-paprika text-base">
            Sign in
          </Link>{" "}
          to share recipe
        </p>
      )}
    </section>
  );
}
