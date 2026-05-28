import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MapPin, Lock } from "lucide-react";
import {
  listPublicPaidReceipes,
  type PaidReceipeListItem,
} from "@/lib/paid-receipes.functions";
import { fakeRating, Stars } from "@/lib/fake-ratings";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop chef receipes — FridgeCuisine" },
      {
        name: "description",
        content:
          "Buy signature receipes from home cooks around the world. Pay once, unlock the full method.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const fetchList = useServerFn(listPublicPaidReceipes);
  const [rows, setRows] = useState<PaidReceipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchList()
      .then((res) => setRows(res.rows))
      .finally(() => setLoading(false));
  }, [fetchList]);

  return (
    <main className="min-h-screen bg-background text-foreground px-4 md:px-8 py-10">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/"
          className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Back home
        </Link>
        <h1 className="font-display text-3xl md:text-5xl uppercase mt-3 mb-2">
          Chef receipes
        </h1>
        <p className="text-muted-foreground mb-6 max-w-xl">
          Browse signature dishes from real cooks. Preview is free — pay the chef to
          unlock the full ingredients and method.
        </p>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="size-8 animate-spin opacity-50" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No receipes yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rows.map((r) => {
              const { rating, count } = fakeRating(r.id);
              const author = r.author_name || "Home chef";
              const initial = author.charAt(0).toUpperCase();
              return (
              <Link
                key={r.id}
                to="/shop/$receipeId"
                params={{ receipeId: r.id }}
                className="bg-white border-4 border-border rounded-3xl overflow-hidden shadow-[4px_4px_0px_0px_var(--border)] active:translate-y-0.5 transition-all"
              >
                <div className="aspect-square bg-muted relative">
                  {r.cover_image_url ? (
                    <img
                      src={r.cover_image_url}
                      alt={r.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">
                      <Lock className="size-6" />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 bg-foreground text-background text-xs font-black px-2 py-1 rounded-lg">
                    ${(r.price_cents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-black text-sm truncate">{r.title}</p>
                  {r.local_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {r.local_name}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {r.author_avatar_url ? (
                      <img
                        src={r.author_avatar_url}
                        alt=""
                        className="size-5 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <span className="size-5 rounded-full bg-paprika/20 text-paprika text-[10px] font-black grid place-items-center border border-border">
                        {initial}
                      </span>
                    )}
                    <p className="text-[11px] text-muted-foreground truncate">
                      by <span className="font-bold text-foreground/80">{author}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Stars rating={rating} size="text-xs" />
                    <span className="text-[11px] font-bold">{rating.toFixed(1)}</span>
                    <span className="text-[11px] text-muted-foreground">({count})</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="size-3" />
                    {[r.city, r.country].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}