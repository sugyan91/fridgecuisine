import { useState } from "react";
import type { Receipe } from "@/lib/receipes.functions";

type Props = {
  receipe: Receipe;
  index: number;
  saved: boolean;
  onToggleSave: () => void;
  dietary?: string[];
  showMissing?: boolean;
};

export function RecipeCard({ receipe, index, saved, onToggleSave, showMissing = true }: Props) {
  const [open, setOpen] = useState(false);
  const allIngredients = [...receipe.usedIngredients, ...receipe.missingIngredients];
  const dietary = receipe.dietary ?? [];

  if (open) {
    return (
      <article
        className="bg-cardamom text-white border-4 border-border rounded-[32px] p-6 md:p-8 shadow-[8px_8px_0px_0px_var(--border)] animate-pop"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h4 className="font-display text-3xl md:text-4xl uppercase tracking-tight leading-none">
              {receipe.title}
            </h4>
            <div className="flex flex-wrap gap-3 mt-3 font-mono text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-turmeric" />
                {receipe.cookTimeMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-saffron" />
                {receipe.cuisine}
              </span>
            </div>
            {dietary.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70 mr-1">
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
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Collapse receipe"
            className="size-10 bg-white text-foreground rounded-full font-black text-xl flex-shrink-0"
          >
            −
          </button>
        </div>

        <p className="text-sm mb-6 opacity-90">{receipe.blurb}</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
            <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
              The Method
            </h5>
            <ol className="text-sm space-y-2.5 list-decimal list-inside font-medium">
              {receipe.steps.map((s, i) => (
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
            {showMissing && receipe.missingIngredients.length > 0 && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
                  Missing
                </h5>
                <ul className="text-sm space-y-1.5 font-medium">
                  {receipe.missingIngredients.map((m, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="size-1.5 bg-paprika rounded-full" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {receipe.substitutions.length > 0 && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
                  Substitutions
                </h5>
                <ul className="text-sm space-y-1.5 font-medium">
                  {receipe.substitutions.map((s, i) => (
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
              {saved ? "★ Saved" : "♡ Save Receipe"}
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group bg-white border-4 border-border rounded-[32px] overflow-hidden shadow-[8px_8px_0px_0px_var(--border)] hover:shadow-[12px_12px_0px_0px_var(--border)] hover:-translate-y-0.5 transition-all animate-pop"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start mb-2 gap-3">
          <h4 className="font-black text-xl md:text-2xl leading-tight">
            {receipe.title}
          </h4>
          {showMissing ? (
            receipe.missingIngredients.length > 0 ? (
            <div className="bg-paprika text-white text-[10px] font-black px-2 py-1 rounded-sm rotate-3 flex-shrink-0">
              MISSING {receipe.missingIngredients.length}
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
            {receipe.cookTimeMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-cardamom" />
            {receipe.cuisine}
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
        <p className="text-sm text-pretty mb-4 font-medium">{receipe.blurb}</p>
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-black text-sm uppercase underline decoration-4 decoration-turmeric underline-offset-4 hover:decoration-paprika"
          >
            View Receipe
          </button>
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? "Unsave receipe" : "Save receipe"}
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
