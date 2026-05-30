import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Receipe } from "@/lib/receipes.functions";
import { ReceipeTimers } from "./ReceipeTimers";
import { StepTimer } from "./StepTimer";
import { ShareButton } from "./ShareButton";
import { swapIngredient, type IngredientSwap } from "@/lib/ingredient-swap.functions";

type Props = {
  receipe: Receipe;
  index: number;
  saved: boolean;
  onToggleSave: () => void;
  dietary?: string[];
  showMissing?: boolean;
  isAuthenticated?: boolean;
  pantry?: string[];
  onRecipeUpdate?: (next: Receipe) => void;
};

export function ReceipeCard({
  receipe,
  index,
  saved,
  onToggleSave,
  showMissing = true,
  isAuthenticated = false,
  dietary: dietaryProp,
  pantry = [],
  onRecipeUpdate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState<{ kind: "used" | "missing"; name: string } | null>(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapResults, setSwapResults] = useState<IngredientSwap[] | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const runSwap = useServerFn(swapIngredient);
  const allIngredients = [...receipe.usedIngredients, ...receipe.missingIngredients];
  const dietary = receipe.dietary ?? [];
  const timings = receipe.stepTimings ?? [];
  const prep = receipe.prepTimeMinutes;
  const total = receipe.totalTimeMinutes;
  const difficulty = receipe.difficulty;
  const nutrition = receipe.nutrition?.perServing;
  const servings = receipe.nutrition?.servings;

  const difficultyStyles: Record<NonNullable<Receipe["difficulty"]>, string> = {
    easy: "bg-turmeric",
    medium: "bg-saffron text-white",
    hard: "bg-paprika text-white",
  };

  const openSwap = async (kind: "used" | "missing", name: string) => {
    setSwapOpen({ kind, name });
    setSwapResults(null);
    setSwapError(null);
    setSwapLoading(true);
    try {
      const res = await runSwap({
        data: {
          recipeTitle: receipe.title,
          cuisine: receipe.cuisine,
          ingredient: name,
          pantry,
          dietary: dietaryProp ?? receipe.dietary ?? [],
        },
      });
      if (res.ok) setSwapResults(res.swaps);
      else setSwapError(res.error);
    } catch {
      setSwapError("Couldn't reach the kitchen. Try again.");
    } finally {
      setSwapLoading(false);
    }
  };

  const applySwap = (swap: IngredientSwap) => {
    if (!swapOpen || !onRecipeUpdate) {
      setSwapOpen(null);
      return;
    }
    const original = swapOpen.name;
    const replaceIn = (arr: string[]) =>
      arr.map((i) => (i === original ? swap.name : i));
    const next: Receipe = {
      ...receipe,
      usedIngredients: replaceIn(receipe.usedIngredients),
      missingIngredients: replaceIn(receipe.missingIngredients),
      substitutions: [
        ...(receipe.substitutions ?? []),
        `${original} → ${swap.name}. ${swap.note}`,
      ],
    };
    onRecipeUpdate(next);
    setSwapOpen(null);
  };

  const renderIngredient = (item: string, kind: "used" | "missing", key: string) => (
    <li key={key} className="flex items-center gap-2 group">
      <span className={`size-1.5 rounded-full ${kind === "missing" ? "bg-paprika" : "bg-turmeric"}`} />
      <span className="flex-1">{item}</span>
      <button
        type="button"
        onClick={() => openSwap(kind, item)}
        title="I don't have this — suggest a swap"
        aria-label={`Swap ${item}`}
        className="text-[10px] font-black uppercase tracking-wide bg-white/15 hover:bg-white/30 border border-white/30 rounded-full px-2 py-0.5 transition-colors opacity-70 hover:opacity-100"
      >
        ↻ Swap
      </button>
    </li>
  );

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
              {prep != null && (
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-white/80" />
                  Prep {prep}m
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-turmeric" />
                Cook {receipe.cookTimeMinutes}m
              </span>
              {total != null && (
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-paprika" />
                  Total {total}m
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-saffron" />
                {receipe.cuisine}
              </span>
              {difficulty && (
                <span
                  className={`${difficultyStyles[difficulty]} border-2 border-border rounded-full px-2 py-0.5 uppercase`}
                >
                  {difficulty}
                </span>
              )}
              {receipe.kidFriendly && (
                <span className="bg-white text-cardamom border-2 border-border rounded-full px-2 py-0.5 uppercase">
                  🧒 Kid-friendly
                </span>
              )}
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

        {nutrition && (
          <div className="mb-5 bg-white/10 border border-white/20 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-black uppercase text-[10px] tracking-widest text-turmeric">
                Approx. per serving{servings ? ` · ${servings} serv` : ""}
              </h5>
              <span className="text-[9px] uppercase tracking-wide opacity-60">Estimates only</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "kcal", value: nutrition.calories },
                { label: "Protein", value: nutrition.proteinG, suffix: "g" },
                { label: "Carbs", value: nutrition.carbsG, suffix: "g" },
                { label: "Fat", value: nutrition.fatG, suffix: "g" },
              ].map((m) => (
                <div key={m.label} className="bg-white/10 rounded-xl py-2">
                  <div className="font-black text-base leading-none">
                    {m.value != null ? `${m.value}${m.suffix ?? ""}` : "—"}
                  </div>
                  <div className="text-[9px] uppercase tracking-wide opacity-70 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <ReceipeTimers
            totalMinutes={total ?? receipe.cookTimeMinutes}
            variant="dark"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
            <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
              The Method
            </h5>
            <ol className="text-sm space-y-2.5 font-medium">
              {receipe.steps.map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="shrink-0 size-6 rounded-full bg-turmeric text-foreground font-black text-[11px] grid place-items-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="flex-1 leading-snug">
                    {s}
                    {timings[i] != null && (
                      <span className="ml-2 inline-flex align-middle">
                        <StepTimer minutes={timings[i]} variant="dark" />
                      </span>
                    )}
                  </span>
                </li>
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
                  {receipe.usedIngredients.map((m, i) =>
                    renderIngredient(m, "used", `u-${i}-${m}`),
                  )}
                  {receipe.missingIngredients.map((m, i) =>
                    renderIngredient(m, "missing", `m-${i}-${m}`),
                  )}
                </ul>
              </div>
            )}
            {showMissing && receipe.missingIngredients.length > 0 && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
                  Missing
                </h5>
                <ul className="text-sm space-y-1.5 font-medium">
                  {receipe.missingIngredients.map((m, i) =>
                    renderIngredient(m, "missing", `mm-${i}-${m}`),
                  )}
                </ul>
              </div>
            )}
            {swapOpen && (
              <div className="bg-white text-foreground p-4 rounded-2xl border-2 border-border shadow-[4px_4px_0px_0px_var(--border)]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className="font-black uppercase text-[10px] tracking-widest">
                    Swap "{swapOpen.name}"
                  </h5>
                  <button
                    type="button"
                    onClick={() => setSwapOpen(null)}
                    aria-label="Close"
                    className="text-xs font-black opacity-60 hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
                {swapLoading && (
                  <p className="text-xs font-medium opacity-70">Finding swaps…</p>
                )}
                {swapError && (
                  <p className="text-xs font-bold text-paprika">{swapError}</p>
                )}
                {!swapLoading && !swapError && swapResults && (
                  <ul className="space-y-2">
                    {swapResults.map((s, i) => (
                      <li key={i} className="border border-border rounded-xl p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-black text-sm">{s.name}</div>
                            <div className="text-xs opacity-80 mt-0.5">{s.note}</div>
                          </div>
                          {onRecipeUpdate && (
                            <button
                              type="button"
                              onClick={() => applySwap(s)}
                              className="text-[10px] font-black uppercase tracking-wide bg-cardamom text-white border-2 border-border rounded-full px-2.5 py-1 hover:opacity-90 shrink-0"
                            >
                              Use it
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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
            <ShareButton
              receipe={receipe}
              isAuthenticated={isAuthenticated}
              variant="full"
            />
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
            {total != null ? `${total} min total` : `${receipe.cookTimeMinutes} min`}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-cardamom" />
            {receipe.cuisine}
          </span>
          {difficulty && (
            <span
              className={`${difficultyStyles[difficulty]} border-2 border-border rounded-full px-2 py-0.5 uppercase`}
            >
              {difficulty}
            </span>
          )}
          {receipe.kidFriendly && (
            <span className="bg-turmeric border-2 border-border rounded-full px-2 py-0.5 uppercase">
              🧒 Kid-friendly
            </span>
          )}
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
          <div className="flex items-center gap-2">
            <ShareButton
              receipe={receipe}
              isAuthenticated={isAuthenticated}
              variant="icon"
            />
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
      </div>
    </article>
  );
}
