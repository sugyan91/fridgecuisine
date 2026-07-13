import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MapPin, Store, Heart, ChefHat, Utensils } from "lucide-react";
import { getChefStorefront } from "@/lib/chef-storefront.functions";
import { SafeImage } from "@/components/ui/safe-image";

export const Route = createFileRoute("/chef/$username")({
  loader: async ({ params }) => {
    const res = await getChefStorefront({ data: { username: params.username } });
    if (!res.storefront) throw notFound();
    return res.storefront;
  },
  head: ({ loaderData, params }) => {
    const chef = loaderData?.chef;
    const name = chef?.display_name || chef?.username || params.username;
    const title = `${name} on FridgeCuisine — Chef storefront`;
    const description = chef?.bio
      ? chef.bio.slice(0, 155)
      : `Recipes and dishes by ${name}${chef?.country ? ` from ${chef.country}` : ""} on FridgeCuisine.`;
    const url = `https://fridgecuisine.com/chef/${params.username}`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (chef?.avatar_url) {
      meta.push({ property: "og:image", content: chef.avatar_url });
      meta.push({ name: "twitter:image", content: chef.avatar_url });
    }
    return { meta };
  },
  errorComponent: ({ error }) => (
    <main className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <p className="font-display text-2xl uppercase">Something went wrong</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <Link to="/chefs" className="text-sm text-paprika underline mt-4 inline-block">Browse chefs</Link>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="font-display text-2xl uppercase mt-3">Chef not found</p>
        <p className="text-sm text-muted-foreground mt-1">No home chef here yet.</p>
        <Link to="/chefs" className="text-sm text-paprika underline mt-4 inline-block">Browse all chefs</Link>
      </div>
    </main>
  ),
  component: ChefStorefrontPage,
});

function ChefStorefrontPage() {
  const { chef, stats, paidRecipes, communityRecipes } = Route.useLoaderData();
  const displayName = chef.display_name || chef.username;
  const initial = (displayName || "?").slice(0, 1).toUpperCase();

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Cover / header */}
      <div className="bg-gradient-to-br from-paprika/15 via-background to-background border-b-4 border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="size-24 md:size-28 rounded-full border-4 border-border bg-card overflow-hidden shrink-0">
              {chef.avatar_url ? (
                <SafeImage src={chef.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center font-display text-3xl text-muted-foreground">
                  {initial}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-3xl md:text-4xl uppercase">{displayName}</h1>
                {chef.payouts_enabled && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-foreground text-background rounded-full px-2 py-0.5">
                    Verified seller
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">@{chef.username}</p>
              {chef.country && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                  <MapPin className="size-4" /> {chef.country}
                </p>
              )}
              {chef.bio && (
                <p className="mt-4 text-sm md:text-base max-w-2xl leading-relaxed">{chef.bio}</p>
              )}
              <div className="mt-5 flex flex-wrap gap-4 text-sm">
                <Stat icon={<Store className="size-4" />} label="Paid recipes" value={stats.paidCount} />
                <Stat icon={<Utensils className="size-4" />} label="Community recipes" value={stats.communityCount} />
                <Stat icon={<Heart className="size-4" />} label="Total likes" value={stats.totalLikes} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-12">
        {/* Paid recipes */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl uppercase">Recipes for sale</h2>
            {paidRecipes.length > 0 && (
              <Link to="/shop" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                All chefs →
              </Link>
            )}
          </div>
          {paidRecipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">This chef hasn't listed any recipes for sale yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paidRecipes.map((r) => (
                <Link
                  key={r.id}
                  to="/shop/$recipeId"
                  params={{ recipeId: r.id }}
                  className="group rounded-2xl border-4 border-border bg-card overflow-hidden hover:-translate-y-0.5 transition-transform"
                >
                  {r.cover_image_url ? (
                    <SafeImage src={r.cover_image_url} alt={r.title} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-muted grid place-items-center">
                      <ChefHat className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-display text-lg uppercase leading-tight line-clamp-2">{r.title}</p>
                    {r.local_name && (
                      <p className="text-xs text-muted-foreground italic mt-0.5">{r.local_name}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {[r.city, r.country].filter(Boolean).join(", ") || r.cuisine || ""}
                      </span>
                      <span className="font-black text-paprika">
                        ${((r.price_cents ?? 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Community recipes */}
        <section>
          <h2 className="font-display text-2xl uppercase mb-4">Free community recipes</h2>
          {communityRecipes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No community recipes published yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {communityRecipes.map((r) => (
                <Link
                  key={r.id}
                  to="/community/$recipeId"
                  params={{ recipeId: r.id }}
                  className="group rounded-2xl border-4 border-border bg-card overflow-hidden hover:-translate-y-0.5 transition-transform"
                >
                  {r.image_url ? (
                    <SafeImage src={r.image_url} alt={r.title} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-muted grid place-items-center">
                      <Utensils className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-display text-lg uppercase leading-tight line-clamp-2">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {[r.city, r.country].filter(Boolean).join(", ") || r.cuisine || "—"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border-2 border-border bg-card px-3 py-1.5">
      {icon}
      <span className="font-black">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}