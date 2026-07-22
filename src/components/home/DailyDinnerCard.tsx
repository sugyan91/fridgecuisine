import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Clock, ChefHat, RefreshCw, ArrowRight, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  getDailyDinner,
  refreshDailyDinner,
  type DailyDinner,
} from "@/lib/daily-dinner.functions";
import { addCustomShopping } from "@/lib/custom-shopping";

export function DailyDinnerCard({
  isAuthenticated,
  onCookThis,
}: {
  isAuthenticated: boolean;
  onCookThis?: (r: DailyDinner) => void;
}) {
  const load = useServerFn(getDailyDinner);
  const refresh = useServerFn(refreshDailyDinner);
  const [recipe, setRecipe] = useState<DailyDinner | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchIt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load({ data: {} });
      setRecipe(res.recipe);
    } catch {
      /* opportunistic */
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetchIt();
  }, [isAuthenticated, fetchIt]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh({ data: {} });
      await fetchIt();
      toast.success("Fresh idea for tonight.");
    } catch {
      toast.error("Couldn't refresh — try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const addMissing = () => {
    if (!recipe?.missingIngredients?.length) return;
    addCustomShopping(recipe.missingIngredients);
    toast.success(`Added ${recipe.missingIngredients.length} items to your shopping list.`);
  };

  if (!isAuthenticated) return null;

  return (
    <section className="max-w-4xl mx-auto px-4 mt-6">
      <div className="relative bg-gradient-to-br from-paprika to-turmeric text-white border-2 border-border rounded-3xl p-5 md:p-6 shadow-[5px_5px_0px_0px_var(--border)] overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" />
          <p className="text-[11px] uppercase font-black tracking-widest">Tonight's pick, just for you</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-white/25 rounded w-3/4" />
            <div className="h-4 bg-white/20 rounded w-full" />
            <div className="h-4 bg-white/20 rounded w-5/6" />
          </div>
        ) : !recipe ? (
          <div>
            <h2 className="font-display text-2xl md:text-3xl uppercase leading-tight mb-1">
              We'll pick your dinner tomorrow
            </h2>
            <p className="text-sm text-white/85 mb-3">
              Add a few pantry items and preferences so we can nail your first daily pick.
            </p>
            <a
              href="/pantry"
              className="inline-flex items-center gap-2 bg-white text-paprika border-2 border-border rounded-full px-4 py-2 font-black text-xs uppercase tracking-widest"
            >
              Stock your pantry <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-2xl md:text-4xl uppercase leading-tight mb-2">
              {recipe.title}
            </h2>
            {recipe.reason && (
              <p className="text-sm text-white/90 italic mb-3">"{recipe.reason}"</p>
            )}
            <p className="text-sm text-white/85 mb-4 line-clamp-3">{recipe.blurb}</p>

            <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-black uppercase tracking-widest">
              {recipe.cuisine && (
                <span className="inline-flex items-center gap-1 bg-white/15 border border-white/30 rounded-full px-2.5 py-1">
                  <ChefHat className="w-3 h-3" /> {recipe.cuisine}
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-white/15 border border-white/30 rounded-full px-2.5 py-1">
                <Clock className="w-3 h-3" /> {recipe.totalTimeMinutes} min
              </span>
              <span className="inline-flex items-center gap-1 bg-white/15 border border-white/30 rounded-full px-2.5 py-1">
                {recipe.difficulty}
              </span>
              {recipe.usedIngredients.length > 0 && (
                <span className="inline-flex items-center gap-1 bg-white/15 border border-white/30 rounded-full px-2.5 py-1">
                  Uses {recipe.usedIngredients.length} from pantry
                </span>
              )}
            </div>

            {expanded && (
              <div className="bg-white/10 border border-white/25 rounded-2xl p-3 mb-4 space-y-3">
                {recipe.usedIngredients.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/70 mb-1">From your pantry</p>
                    <p className="text-xs">{recipe.usedIngredients.join(", ")}</p>
                  </div>
                )}
                {recipe.missingIngredients.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/70 mb-1">You'll need</p>
                    <p className="text-xs">{recipe.missingIngredients.join(", ")}</p>
                  </div>
                )}
                {recipe.steps.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/70 mb-1">Steps</p>
                    <ol className="list-decimal pl-4 text-xs space-y-1">
                      {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => (onCookThis ? onCookThis(recipe) : setExpanded((e) => !e))}
                className="inline-flex items-center gap-2 bg-white text-paprika border-2 border-border rounded-full px-4 py-2 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_var(--border)]"
              >
                {onCookThis ? "Cook this" : expanded ? "Hide details" : "See recipe"} <ArrowRight className="w-4 h-4" />
              </button>
              {recipe.missingIngredients.length > 0 && (
                <button
                  onClick={addMissing}
                  className="inline-flex items-center gap-2 bg-white/15 border-2 border-white/40 rounded-full px-3 py-2 font-black text-xs uppercase tracking-widest"
                >
                  <ShoppingCart className="w-4 h-4" /> Add {recipe.missingIngredients.length} to list
                </button>
              )}
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/40 rounded-full px-3 py-2 font-black text-xs uppercase tracking-widest disabled:opacity-50"
                aria-label="Refresh pick"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "…" : "New pick"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}