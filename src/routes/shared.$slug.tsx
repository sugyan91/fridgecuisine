import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getSharedRecipe } from "@/lib/shared-recipes.functions";
import logoAsset from "@/assets/fridge-cuisine-logo.png.asset.json";

const sharedQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["shared-recipe", slug],
    queryFn: () => getSharedRecipe({ data: { slug } }),
  });

export const Route = createFileRoute("/shared/$slug")({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(
      sharedQueryOptions(params.slug),
    );
    if (!res.row) throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    const row = loaderData?.row;
    const title = row
      ? `${row.title} — FridgeCuisine`
      : "Shared recipe — FridgeCuisine";
    const description = row
      ? (row.recipe.blurb?.slice(0, 155) ||
          `A ${row.cuisine ?? ""} recipe shared from FridgeCuisine.`.trim())
      : "A recipe shared from FridgeCuisine.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: SharedRecipePage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold mb-2">
          Couldn't load this recipe
        </h1>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <Link
          to="/"
          className="inline-block bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-display font-semibold text-sm"
        >
          Cook your own
        </Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-semibold mb-2">
          Recipe not found
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          This share link may have been removed or mistyped.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-display font-semibold text-sm"
        >
          Cook your own
        </Link>
      </div>
    </div>
  ),
});

function SharedRecipePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(sharedQueryOptions(slug));
  const row = data.row!;
  const r = row.recipe;
  const ingredients = [
    ...(r.usedIngredients ?? []),
    ...(r.missingIngredients ?? []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoImg}
            alt="FridgeCuisine"
            className="h-8 w-auto rounded-lg bg-background"
          />
          <span className="font-display font-semibold lowercase">
            fridge cuisine<span className="text-primary">.</span>
          </span>
        </Link>
        <Link
          to="/"
          className="text-sm font-display font-semibold bg-foreground text-background px-4 py-2 rounded-full hover:brightness-110 transition-all"
        >
          Cook your own
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <article className="bg-card border border-border rounded-[2rem] p-6 md:p-10 shadow-[var(--shadow-soft)]">
          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-3">
            Shared Recipe
          </p>
          <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight leading-tight mb-3">
            {r.title}
          </h1>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-medium mb-5">
            {row.cuisine && (
              <span className="bg-secondary text-secondary-foreground border border-border rounded-full px-2.5 py-0.5">
                {row.cuisine}
              </span>
            )}
            {r.prepTimeMinutes != null && (
              <span className="bg-card border border-border rounded-full px-2.5 py-0.5">
                Prep {r.prepTimeMinutes}m
              </span>
            )}
            {r.cookTimeMinutes != null && (
              <span className="bg-card border border-border rounded-full px-2.5 py-0.5">
                Cook {r.cookTimeMinutes}m
              </span>
            )}
            {r.totalTimeMinutes != null && (
              <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5">
                Total {r.totalTimeMinutes}m
              </span>
            )}
            {r.serves && (
              <span className="bg-card border border-border rounded-full px-2.5 py-0.5">
                Serves {r.serves}
              </span>
            )}
          </div>

          {r.blurb && (
            <p className="text-base text-muted-foreground mb-6 leading-relaxed">
              {r.blurb}
            </p>
          )}

          {ingredients.length > 0 && (
            <section className="mb-6">
              <h2 className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                Ingredients
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="text-sm font-medium before:content-['•'] before:mr-2 before:text-primary"
                  >
                    {ing}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.steps && r.steps.length > 0 && (
            <section className="mb-6">
              <h2 className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                Steps
              </h2>
              <ol className="space-y-3">
                {r.steps.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-3 items-start text-sm leading-relaxed"
                  >
                    <span className="shrink-0 size-7 rounded-full bg-primary/10 text-primary border border-primary/20 font-display font-semibold text-xs grid place-items-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="flex-1">{s}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {r.substitutions && r.substitutions.length > 0 && (
            <section className="mb-6 pt-4 border-t border-border">
              <h2 className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                Substitutions
              </h2>
              <ul className="space-y-1">
                {r.substitutions.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.tips && r.tips.length > 0 && (
            <section className="pt-4 border-t border-border">
              <h2 className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                Tips
              </h2>
              <ul className="space-y-1">
                {r.tips.map((t, i) => (
                  <li key={i} className="text-sm text-muted-foreground">
                    • {t}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want a recipe tailored to what's in your fridge?
          </p>
          <Link
            to="/"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full font-display font-semibold text-sm hover:brightness-110 transition-all"
          >
            Cook this in your kitchen →
          </Link>
        </div>
      </main>
    </div>
  );
}
