import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Users, Utensils } from "lucide-react";
import {
  listFollowing,
  listFollowingFeed,
  type FollowedChef,
  type FollowingFeedItem,
} from "@/lib/follows.functions";
import { SafeImage } from "@/components/ui/safe-image";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/following")({
  head: () => ({
    meta: [
      { title: "Following — FridgeCuisine" },
      { name: "description", content: "Latest recipes from chefs you follow." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FollowingPage,
});

function FollowingPage() {
  const feedFn = useServerFn(listFollowingFeed);
  const chefsFn = useServerFn(listFollowing);

  const [items, setItems] = useState<FollowingFeedItem[]>([]);
  const [chefs, setChefs] = useState<FollowedChef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([feedFn(), chefsFn()])
      .then(([f, c]) => {
        if (cancelled) return;
        setItems(f.items);
        setChefs(c.chefs);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [feedFn, chefsFn]);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="text-lg font-semibold">Following</h1>
          <Link to="/chefs" className="text-sm text-primary hover:underline">
            Discover chefs
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl grid gap-8 px-4 py-6 md:grid-cols-[1fr,240px]">
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl">
            <Utensils className="h-5 w-5" /> Recent recipes
          </h2>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {chefs.length === 0 ? (
                <>
                  You aren't following anyone yet.{" "}
                  <Link to="/chefs" className="text-primary underline">
                    Discover chefs
                  </Link>
                  .
                </>
              ) : (
                <>No new recipes from your chefs yet.</>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <Link
                    to="/community/$recipeId"
                    params={{ recipeId: it.id }}
                    className="block h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                  >
                    {it.image_url ? (
                      <SafeImage
                        src={it.image_url}
                        alt={it.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-2xl">🍽️</div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/community/$recipeId"
                      params={{ recipeId: it.id }}
                      className="block truncate text-sm font-semibold hover:underline"
                    >
                      {it.title}
                    </Link>
                    <Link
                      to="/chef/$username"
                      params={{ username: it.author.username }}
                      className="mt-1 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span className="inline-block h-5 w-5 overflow-hidden rounded-full bg-muted">
                        {it.author.avatar_url && (
                          <SafeImage
                            src={it.author.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </span>
                      {it.author.display_name || `@${it.author.username}`}
                    </Link>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}
                      {it.cuisine ? ` · ${it.cuisine}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg">
            <Users className="h-4 w-4" /> Your chefs
          </h2>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : chefs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Follow chefs to see them here.</p>
          ) : (
            <ul className="space-y-2">
              {chefs.map((c) => (
                <li key={c.user_id}>
                  <Link
                    to="/chef/$username"
                    params={{ username: c.username }}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <span className="inline-block h-6 w-6 overflow-hidden rounded-full bg-muted">
                      {c.avatar_url && (
                        <SafeImage
                          src={c.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </span>
                    <span className="truncate">{c.display_name || `@${c.username}`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}