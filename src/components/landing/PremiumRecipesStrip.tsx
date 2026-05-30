import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Lock } from "lucide-react";
import {
  listPublicPaidReceipes,
  type PaidReceipeListItem,
} from "@/lib/paid-receipes.functions";

export function PremiumRecipesStrip() {
  const fetchList = useServerFn(listPublicPaidReceipes);
  const [rows, setRows] = useState<PaidReceipeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchList()
      .then((res) => {
        if (!cancelled) setRows(res.rows.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  // Skip skeletons entirely — don't render the section until we have real data.
  if (loading || rows.length === 0) return null;

  return (
    <section className="mt-12 md:mt-16">
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Want a chef's version?
          </p>
          <h2 className="font-display text-2xl md:text-3xl uppercase">
            Unlock a single recipe.
          </h2>
        </div>
        <Link
          to="/shop"
          className="text-xs font-black uppercase tracking-widest text-foreground hover:underline whitespace-nowrap"
        >
          See all →
        </Link>
      </div>

      <div className="-mx-4 md:mx-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 md:gap-4 px-4 md:px-0 pb-2 snap-x snap-mandatory">
          {rows.map((row) => {
            return (
              <Link
                key={row.id}
                to="/shop/$receipeId"
                params={{ receipeId: row.id }}
                className="shrink-0 w-44 md:w-52 snap-start bg-white border-4 border-border rounded-3xl overflow-hidden shadow-[4px_4px_0px_0px_var(--border)] active:translate-y-0.5 transition-all"
              >
                <div className="aspect-square bg-muted relative">
                  {row.cover_image_url ? (
                    <img
                      src={row.cover_image_url}
                      alt={row.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground">
                      <Lock className="size-6" />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-foreground text-background text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                    <Lock className="size-3" /> Premium
                  </span>
                  <span className="absolute top-2 right-2 bg-background text-foreground text-xs font-black px-2 py-1 rounded-lg border-2 border-border">
                    ${(row.price_cents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-black text-sm truncate">{row.title}</p>
                  {row.local_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {row.local_name}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {row.author_avatar_url ? (
                      <img
                        src={row.author_avatar_url}
                        alt=""
                        loading="lazy"
                        className="size-5 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <span className="size-5 rounded-full bg-paprika/20 text-paprika text-[10px] font-black grid place-items-center border border-border shrink-0">
                        {(row.author_name || "C").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <p className="text-[11px] text-muted-foreground truncate">
                      by <span className="font-bold text-foreground/80">{row.author_name || "Home chef"}</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">
                      {[row.city, row.country].filter(Boolean).join(", ") || "—"}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}