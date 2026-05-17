import { useState } from "react";
import type { Recipe } from "@/lib/recipes.functions";
import { pickRecipeImage } from "@/lib/recipe-images";

type Props = {
  recipe: Recipe;
  index: number;
  saved: boolean;
  onToggleSave: () => void;
  dietary?: string[];
  showMissing?: boolean;
};

export function RecipeCard({ recipe, index, saved, onToggleSave, dietary = [], showMissing = true }: Props) {
  const [open, setOpen] = useState(false);
  const img = pickRecipeImage(recipe.title, index);
  const allIngredients = [...recipe.usedIngredients, ...recipe.missingIngredients];

  if (open) {
    return (
      <article
        className="bg-cardamom text-white border-4 border-border rounded-[32px] p-6 md:p-8 shadow-[8px_8px_0px_0px_var(--border)] animate-pop"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h4 className="font-display text-3xl md:text-4xl uppercase tracking-tight leading-none">
              {recipe.title}
            </h4>
            <div className="flex flex-wrap gap-3 mt-3 font-mono text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-turmeric" />
                {recipe.cookTimeMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-saffron" />
                {recipe.cuisine}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Collapse recipe"
            className="size-10 bg-white text-foreground rounded-full font-black text-xl flex-shrink-0"
          >
            −
          </button>
        </div>

        <p className="text-sm mb-6 opacity-90">{recipe.blurb}</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
            <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
              The Method
            </h5>
            <ol className="text-sm space-y-2.5 list-decimal list-inside font-medium">
              {recipe.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            {!showMissing && allIngredients.length > 0 && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
                  Ingredients
                </h5>
                <ul className="text-sm space-y-1.5 font-medium">
                  {allIngredients.map((m, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="size-1.5 bg-turmeric rounded-full" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showMissing && recipe.missingIngredients.length > 0 && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
                  Missing
                </h5>
                <ul className="text-sm space-y-1.5 font-medium">
                  {recipe.missingIngredients.map((m, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="size-1.5 bg-paprika rounded-full" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recipe.substitutions.length > 0 && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
                  Substitutions
                </h5>
                <ul className="text-sm space-y-1.5 font-medium">
                  {recipe.substitutions.map((s, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="size-1.5 bg-saffron rounded-full" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={onToggleSave}
              className="w-full bg-white text-cardamom py-3 rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none transition-all"
            >
              {saved ? "★ Saved" : "♡ Save Recipe"}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group bg-white border-4 border-border rounded-[32px] overflow-hidden flex flex-col md:flex-row shadow-[8px_8px_0px_0px_var(--border)] hover:shadow-[12px_12px_0px_0px_var(--border)] hover:-translate-y-0.5 transition-all animate-pop"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="md:w-48 md:flex-shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-border">
        <img
          src={img}
          alt={recipe.title}
          width={512}
          height={512}
          loading="lazy"
          className="w-full h-48 md:h-full object-cover"
        />
      </div>
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-2 gap-3">
          <h4 className="font-black text-xl md:text-2xl leading-tight">
            {recipe.title}
          </h4>
          {showMissing ? (
            recipe.missingIngredients.length > 0 ? (
            <div className="bg-paprika text-white text-[10px] font-black px-2 py-1 rounded-sm rotate-3 flex-shrink-0">
              MISSING {recipe.missingIngredients.length}
            </div>
          ) : (
            <div className="bg-cardamom text-white text-[10px] font-black px-2 py-1 rounded-sm -rotate-2 flex-shrink-0">
              ALL SET
            </div>
            )
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-[10px] font-bold mb-3 uppercase">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-turmeric" />
            {recipe.cookTimeMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-cardamom" />
            {recipe.cuisine}
          </span>
        </div>
        {dietary.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">
              Dietary:
            </span>
            {dietary.map((d) => (
              <span
                key={d}
                className="text-[10px] font-black uppercase tracking-wide bg-paprika text-white border-2 border-border rounded-full px-2 py-0.5"
              >
                {d}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-pretty mb-4 font-medium">{recipe.blurb}</p>
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-black text-sm uppercase underline decoration-4 decoration-turmeric underline-offset-4 hover:decoration-paprika"
          >
            View Recipe
          </button>
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? "Unsave recipe" : "Save recipe"}
            className={`size-10 border-2 border-border rounded-full grid place-items-center transition-colors ${
              saved ? "bg-paprika text-white" : "bg-white hover:bg-paprika/10"
            }`}
          >
            {saved ? "★" : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
}
