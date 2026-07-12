export function RecipeSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Generating recipes">
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={i}
          className="bg-card border-4 border-border rounded-[32px] overflow-hidden shadow-[8px_8px_0px_0px_var(--border)] animate-pulse"
        >
          {/* Image placeholder */}
          <div className="relative aspect-[16/9] bg-muted border-b-4 border-border overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted to-foreground/5" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="size-12 rounded-2xl bg-foreground/10" />
                <div className="h-2 w-24 bg-foreground/10 rounded" />
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Title + missing badge */}
            <div className="flex justify-between items-start gap-3">
              <div className="h-7 md:h-8 bg-foreground/10 rounded w-2/3" />
              <div className="h-5 w-16 bg-foreground/10 rounded-sm rotate-3 flex-shrink-0" />
            </div>

            {/* Meta tags */}
            <div className="flex flex-wrap gap-2">
              <div className="h-4 w-20 bg-foreground/10 rounded-full" />
              <div className="h-4 w-24 bg-foreground/10 rounded-full" />
              <div className="h-4 w-16 bg-foreground/10 rounded-full" />
            </div>

            {/* Blurb */}
            <div className="space-y-2">
              <div className="h-3.5 bg-foreground/10 rounded w-full" />
              <div className="h-3.5 bg-foreground/10 rounded w-5/6" />
            </div>

            {/* Nutrition row */}
            <div className="h-8 w-full bg-foreground/10 rounded-full" />

            {/* Action row */}
            <div className="flex justify-between items-center pt-1">
              <div className="h-4 w-24 bg-foreground/10 rounded" />
              <div className="flex items-center gap-2">
                <div className="size-10 bg-foreground/10 rounded-full" />
                <div className="size-10 bg-foreground/10 rounded-full" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <article
      className="bg-cardamom text-white border-4 border-border rounded-[32px] p-6 md:p-8 shadow-[8px_8px_0px_0px_var(--border)] animate-pulse"
      aria-busy="true"
      aria-label="Generating recipe details"
    >
      {/* Image placeholder */}
      <div className="relative mb-6 -mx-2 md:-mx-4 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/5 aspect-[16/9]">
        <div className="absolute inset-0 bg-white/10" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-14 rounded-2xl bg-white/20" />
            <div className="h-2.5 w-28 bg-white/20 rounded" />
          </div>
        </div>
      </div>

      {/* Title + meta */}
      <div className="flex justify-between items-start mb-6 gap-4">
        <div className="space-y-3 flex-1">
          <div className="h-8 md:h-10 bg-white/20 rounded w-3/4" />
          <div className="flex flex-wrap gap-2">
            <div className="h-3.5 w-16 bg-white/20 rounded-full" />
            <div className="h-3.5 w-20 bg-white/20 rounded-full" />
            <div className="h-3.5 w-14 bg-white/20 rounded-full" />
          </div>
        </div>
        <div className="size-10 bg-white/20 rounded-full flex-shrink-0" />
      </div>

      {/* Blurb */}
      <div className="space-y-2 mb-6">
        <div className="h-3 bg-white/20 rounded w-full" />
        <div className="h-3 bg-white/20 rounded w-4/5" />
      </div>

      {/* Nutrition grid */}
      <div className="mb-5 bg-white/10 border border-white/20 rounded-2xl p-3">
        <div className="h-3 w-32 bg-white/20 rounded mb-3" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/10 rounded-xl py-2 space-y-2">
              <div className="h-4 w-10 bg-white/20 rounded mx-auto" />
              <div className="h-2 w-8 bg-white/20 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Steps + ingredients grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Steps placeholder */}
        <div className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-3">
          <div className="h-3 w-24 bg-white/20 rounded mb-3" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="shrink-0 size-6 rounded-full bg-white/20" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-2.5 bg-white/20 rounded w-full" />
                <div className="h-2.5 bg-white/20 rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>

        {/* Ingredients + actions placeholder */}
        <div className="space-y-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20 space-y-2.5">
            <div className="h-3 w-24 bg-white/20 rounded mb-3" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-white/20" />
                <div className="h-2.5 bg-white/20 rounded flex-1" />
              </div>
            ))}
          </div>
          <div className="h-10 w-full bg-white/20 rounded-xl" />
          <div className="h-10 w-full bg-white/20 rounded-xl" />
        </div>
      </div>
    </article>
  );
}
