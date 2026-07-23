import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import type { Recipe } from "@/lib/recipes.functions";
import { RecipeTimers } from "./RecipeTimers";
import { StepTimer } from "./StepTimer";
import { ShareButton } from "./ShareButton";
import { swapIngredient, type IngredientSwap } from "@/lib/ingredient-swap.functions";
import { generateRecipeImage } from "@/lib/recipe-image.functions";
import { downloadRecipePdf } from "@/lib/recipe-pdf";
import { SafeImage } from "@/components/ui/safe-image";
import { DietBadgeRow } from "./DietBadge";

type Props = {
  recipe: Recipe;
  index: number;
  saved: boolean;
  onToggleSave: () => void;
  dietary?: string[];
  showMissing?: boolean;
  isAuthenticated?: boolean;
  pantry?: string[];
  onRecipeUpdate?: (next: Recipe) => void;
};

export function RecipeCard({
  recipe,
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
  const runImage = useServerFn(generateRecipeImage);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageBroken, setImageBroken] = useState(false);

  const cuisineEmoji = (() => {
    const c = (recipe.cuisine ?? "").toLowerCase();
    if (c.includes("ital")) return "🍝";
    if (c.includes("mex")) return "🌮";
    if (c.includes("ind")) return "🍛";
    if (c.includes("japan")) return "🍣";
    if (c.includes("chin")) return "🥡";
    if (c.includes("thai")) return "🍜";
    if (c.includes("viet")) return "🍲";
    if (c.includes("kor")) return "🍚";
    if (c.includes("french")) return "🥐";
    if (c.includes("greek") || c.includes("medit")) return "🥗";
    if (c.includes("amer")) return "🍔";
    if (c.includes("nep") || c.includes("himal") || c.includes("tibet")) return "🥟";
    return "🍽️";
  })();

  const FallbackImage = () => (
    <div className="w-full h-full relative bg-gradient-to-br from-turmeric via-saffron to-paprika grid place-items-center overflow-hidden">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] [background-size:14px_14px]" />
      <div className="relative text-center px-4">
        <div className="text-5xl md:text-6xl mb-1 drop-shadow-sm">{cuisineEmoji}</div>
        <div className="font-black uppercase tracking-widest text-[10px] text-foreground/80">
          {recipe.cuisine || "Recipe"}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    let cancelled = false;
    setImageBroken(false);
    if (!isAuthenticated) {
      setImageUrl(null);
      setImageLoading(false);
      return () => {
        cancelled = true;
      };
    }
    const cacheKey = `fc:img:v3:${(recipe.cuisine ?? "").toLowerCase()}::${recipe.title.toLowerCase()}`;
    try {
      const cached = typeof window !== "undefined" ? window.localStorage.getItem(cacheKey) : null;
      if (cached) {
        setImageUrl(cached);
        setImageLoading(false);
        return () => {
          cancelled = true;
        };
      }
    } catch {
      // ignore storage errors (quota, private mode)
    }
    setImageLoading(true);
    setImageUrl(null);
    const keyIngredients = [
      ...(recipe.usedIngredients ?? []),
      ...(recipe.missingIngredients ?? []),
    ].slice(0, 6);
    runImage({
      data: {
        dishName: recipe.title,
        cuisine: recipe.cuisine,
        description: recipe.blurb,
        keyIngredients,
      },
    })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setImageUrl(res.dataUrl);
          try {
            window.localStorage.setItem(cacheKey, res.dataUrl);
          } catch {
            // ignore quota errors
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipe.title, recipe.cuisine, recipe.blurb, recipe.usedIngredients, recipe.missingIngredients, runImage, isAuthenticated]);

  const SignInPhotoCta = ({ tone = "light" }: { tone?: "light" | "dark" }) => (
    <div className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[1px]">
      <Link
        to="/login"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-border font-black uppercase tracking-widest text-[11px] shadow-[4px_4px_0px_0px_var(--border)] hover:-translate-y-0.5 transition-transform ${
          tone === "dark" ? "bg-white text-foreground" : "bg-turmeric text-foreground"
        }`}
      >
        🔒 Sign in to see the real photo
      </Link>
    </div>
  );

  const allIngredients = [...recipe.usedIngredients, ...recipe.missingIngredients];
  const dietary = recipe.dietary ?? [];
  const timings = recipe.stepTimings ?? [];
  const prep = recipe.prepTimeMinutes;
  const total = recipe.totalTimeMinutes;
  const difficulty = recipe.difficulty;
  const nutrition = recipe.nutrition?.perServing;
  const servings = recipe.nutrition?.servings;

  const difficultyStyles: Record<NonNullable<Recipe["difficulty"]>, string> = {
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
          recipeTitle: recipe.title,
          cuisine: recipe.cuisine,
          ingredient: name,
          pantry,
          dietary: dietaryProp ?? recipe.dietary ?? [],
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
    const next: Recipe = {
      ...recipe,
      usedIngredients: replaceIn(recipe.usedIngredients),
      missingIngredients: replaceIn(recipe.missingIngredients),
      substitutions: [
        ...(recipe.substitutions ?? []),
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
        <div className="relative mb-6 -mx-2 md:-mx-4 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/5 aspect-[16/9]">
          {imageBroken || (!imageLoading && !imageUrl) ? (
            <>
              <FallbackImage />
              {!isAuthenticated && <SignInPhotoCta />}
            </>
          ) : imageUrl ? (
            <SafeImage
              src={imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => {
                setImageBroken(true);
                setImageUrl(null);
                try {
                  const k = `fc:img:v3:${(recipe.cuisine ?? "").toLowerCase()}::${recipe.title.toLowerCase()}`;
                  window.localStorage.removeItem(k);
                } catch {
                  // ignore
                }
              }}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-[10px] font-black uppercase tracking-widest text-white/60 animate-pulse">
              Plating your dish…
            </div>
          )}
        </div>
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h4 className="font-display text-3xl md:text-4xl uppercase tracking-tight leading-none">
              {recipe.title}
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
                Cook {recipe.cookTimeMinutes}m
              </span>
              {total != null && (
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-paprika" />
                  Total {total}m
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-saffron" />
                {recipe.cuisine}
              </span>
              {difficulty && (
                <span
                  className={`${difficultyStyles[difficulty]} border-2 border-border rounded-full px-2 py-0.5 uppercase`}
                >
                  {difficulty}
                </span>
              )}
              {recipe.kidFriendly && (
                <span className="bg-white text-cardamom border-2 border-border rounded-full px-2 py-0.5 uppercase">
                  🧒 Kid-friendly
                </span>
              )}
            </div>
            {dietary.length > 0 && (
              <div className="mt-3">
                <DietBadgeRow tags={dietary} selected={dietaryProp} variant="dark" />
              </div>
            )}
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

        {nutrition && (
          <div className="mb-5 bg-white/10 border border-white/20 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-black uppercase text-[10px] tracking-widest text-turmeric">
                Approx. per serving{servings ? ` · ${servings} serv` : ""}
              </h5>
              <span className="text-[9px] uppercase tracking-wide opacity-60">Estimates only</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              {[
                { label: "kcal", value: nutrition.calories },
                { label: "Protein", value: nutrition.proteinG, suffix: "g" },
                { label: "Carbs", value: nutrition.carbsG, suffix: "g" },
                { label: "Fat", value: nutrition.fatG, suffix: "g" },
                { label: "Sugar", value: nutrition.sugarG, suffix: "g" },
                { label: "Fiber", value: nutrition.fiberG, suffix: "g" },
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
          <RecipeTimers
            totalMinutes={total ?? recipe.cookTimeMinutes}
            variant="dark"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
            <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
              The Method
            </h5>
            <ol className="text-sm space-y-2.5 font-medium">
              {recipe.steps.map((s, i) => (
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
                  {recipe.usedIngredients.map((m, i) =>
                    renderIngredient(m, "used", `u-${i}-${m}`),
                  )}
                  {recipe.missingIngredients.map((m, i) =>
                    renderIngredient(m, "missing", `m-${i}-${m}`),
                  )}
                </ul>
              </div>
            )}
            {showMissing && recipe.missingIngredients.length > 0 && (
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20">
                <h5 className="font-black uppercase text-[10px] tracking-widest mb-3 text-turmeric">
                  Missing
                </h5>
                <ul className="text-sm space-y-1.5 font-medium">
                  {recipe.missingIngredients.map((m, i) =>
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
            <button
              type="button"
              onClick={() => downloadRecipePdf(recipe)}
              className="w-full bg-turmeric text-foreground py-3 rounded-xl font-black uppercase text-sm border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none transition-all"
            >
              ⬇ Download PDF
            </button>
            <ShareButton
              recipe={recipe}
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
      <div className="relative aspect-[16/9] bg-muted border-b-4 border-border overflow-hidden">
        {imageBroken || (!imageLoading && !imageUrl) ? (
          <>
            <FallbackImage />
            {!isAuthenticated && <SignInPhotoCta />}
          </>
        ) : imageUrl ? (
          <SafeImage
            src={imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={() => {
              setImageBroken(true);
              setImageUrl(null);
              try {
                const k = `fc:img:v3:${(recipe.cuisine ?? "").toLowerCase()}::${recipe.title.toLowerCase()}`;
                window.localStorage.removeItem(k);
              } catch {
                // ignore
              }
            }}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
            Plating your dish…
          </div>
        )}
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
            {total != null ? `${total} min total` : `${recipe.cookTimeMinutes} min`}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-cardamom" />
            {recipe.cuisine}
          </span>
          {difficulty && (
            <span
              className={`${difficultyStyles[difficulty]} border-2 border-border rounded-full px-2 py-0.5 uppercase`}
            >
              {difficulty}
            </span>
          )}
          {recipe.kidFriendly && (
            <span className="bg-turmeric border-2 border-border rounded-full px-2 py-0.5 uppercase">
              🧒 Kid-friendly
            </span>
          )}
        </div>
        {dietary.length > 0 && (
          <div className="mb-3">
            <DietBadgeRow tags={dietary} selected={dietaryProp} variant="light" />
          </div>
        )}
        <p className="text-sm text-pretty mb-4 font-medium">{recipe.blurb}</p>
        {nutrition && (
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-wide bg-turmeric/15 border-2 border-border rounded-full px-3 py-1.5">
            <span className="opacity-60">Per serving:</span>
            {nutrition.calories != null && <span>{nutrition.calories} kcal</span>}
            {nutrition.proteinG != null && <span>P {nutrition.proteinG}g</span>}
            {nutrition.carbsG != null && <span>C {nutrition.carbsG}g</span>}
            {nutrition.fatG != null && <span>F {nutrition.fatG}g</span>}
            {nutrition.sugarG != null && <span>S {nutrition.sugarG}g</span>}
            {nutrition.fiberG != null && <span>Fb {nutrition.fiberG}g</span>}
          </div>
        )}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-black text-sm uppercase underline decoration-4 decoration-turmeric underline-offset-4 hover:decoration-paprika"
          >
            View Recipe
          </button>
          <div className="flex items-center gap-2">
            <ShareButton
              recipe={recipe}
              isAuthenticated={isAuthenticated}
              variant="icon"
            />
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
      </div>
    </article>
  );
}
