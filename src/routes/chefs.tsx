import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChefHat, Loader2 } from "lucide-react";
import { listChefs } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/chefs")({
  head: () => ({
    meta: [
      { title: "Chefs — FridgeCuisine Marketplace" },
      {
        name: "description",
        content:
          "Browse home chefs from around the world selling their signature receipes on FridgeCuisine.",
      },
    ],
  }),
  component: ChefsPage,
});

type ChefRow = {
  user_id: string;
  bio: string | null;
  country: string | null;
  avatar_url: string | null;
};

function ChefsPage() {
  const fetchChefs = useServerFn(listChefs);
  const [chefs, setChefs] = useState<ChefRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChefs()
      .then((res) => setChefs(res.chefs as ChefRow[]))
      .catch(() => setChefs([]))
      .finally(() => setLoading(false));
  }, [fetchChefs]);

  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <Link
            to="/"
            className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Back home
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-black text-xs uppercase tracking-[0.18em] text-paprika mb-1">
                Marketplace
              </p>
              <h1 className="font-display text-3xl md:text-5xl uppercase leading-tight">
                Chefs from around the world
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Buy receipes directly from the cooks who created them.
              </p>
            </div>
            <Link
              to="/sell"
              className="bg-paprika text-white border-4 border-border px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wide shadow-[0px_5px_0px_0px_var(--border)] active:translate-y-1 active:shadow-[0px_2px_0px_0px_var(--border)] transition-all"
            >
              Become a chef →
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-8 animate-spin opacity-50" />
          </div>
        ) : chefs.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-border/40 rounded-3xl p-10 text-center">
            <ChefHat className="size-12 mx-auto opacity-30 mb-3" strokeWidth={2.5} />
            <p className="font-black uppercase tracking-wide">
              No chefs onboarded yet
            </p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Be the first to share your receipes with the world.
            </p>
            <Link
              to="/sell"
              className="inline-block bg-turmeric border-2 border-border px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide shadow-[0px_3px_0px_0px_var(--border)]"
            >
              Start selling
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chefs.map((c) => (
              <div
                key={c.user_id}
                className="bg-white border-4 border-border rounded-3xl p-5 shadow-[6px_6px_0px_0px_var(--border)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-12 rounded-full border-2 border-border bg-turmeric grid place-items-center overflow-hidden">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ChefHat className="size-6" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-lg uppercase truncate">Chef</p>
                    {c.country && (
                      <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                        {c.country}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-4 min-h-[4rem]">
                  {c.bio || "Recipes coming soon."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}