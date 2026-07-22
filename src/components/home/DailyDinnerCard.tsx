import { useEffect, useState, useCallback, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Clock, ChefHat, RefreshCw, ArrowRight, ShoppingCart, Sliders, Flame, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import {
  getDailyDinner,
  refreshDailyDinner,
  applyDailyDinnerOverrides,
  dislikeDailyDinner,
  type DailyDinner,
  type DailyDinnerOverrides,
} from "@/lib/daily-dinner.functions";
import { addCustomShopping } from "@/lib/custom-shopping";

const DIETARY_CHOICES = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "High-protein", "Low-carb"] as const;
const ALLERGY_CHOICES = ["Nuts", "Peanuts", "Dairy", "Eggs", "Gluten", "Shellfish", "Soy"] as const;
const SPICE_CHOICES: DailyDinnerOverrides["spiceLevel"][] = ["none", "mild", "medium", "hot"];
const TIME_CHOICES: number[] = [15, 30, 45, 60];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "text-[11px] font-black uppercase tracking-widest rounded-full px-2.5 py-1 border-2 transition-colors " +
        (active
          ? "bg-white text-paprika border-white"
          : "bg-white/10 text-white border-white/30 hover:bg-white/20")
      }
    >
      {children}
    </button>
  );
}

function ToggleGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase font-black tracking-widest text-white/70 mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );
}

export function DailyDinnerCard({
  isAuthenticated,
  onCookThis,
}: {
  isAuthenticated: boolean;
  onCookThis?: (r: DailyDinner) => void;
}) {
  const load = useServerFn(getDailyDinner);
  const refresh = useServerFn(refreshDailyDinner);
  const applyOverrides = useServerFn(applyDailyDinnerOverrides);
  const dislike = useServerFn(dislikeDailyDinner);
  const [recipe, setRecipe] = useState<DailyDinner | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disliking, setDisliking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [refreshesRemaining, setRefreshesRemaining] = useState<number>(1);
  const [showToggles, setShowToggles] = useState(false);
  const [applying, setApplying] = useState(false);
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [spice, setSpice] = useState<DailyDinnerOverrides["spiceLevel"]>(undefined);
  const [maxTime, setMaxTime] = useState<number | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchIt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load();
      setRecipe(res.recipe);
      setRefreshesRemaining(res.refreshesRemaining ?? 0);
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

  const runApplyOverrides = useCallback(
    async (next: {
      dietary: string[];
      allergies: string[];
      spice: DailyDinnerOverrides["spiceLevel"];
      maxTime: number | undefined;
    }) => {
      const payload: DailyDinnerOverrides = {};
      if (next.dietary.length) payload.dietary = next.dietary;
      if (next.allergies.length) payload.allergies = next.allergies;
      if (next.spice) payload.spiceLevel = next.spice;
      if (next.maxTime) payload.maxTimeMinutes = next.maxTime;

      setApplying(true);
      try {
        const res = await applyOverrides({ data: payload });
        setRecipe(res.recipe);
        setRefreshesRemaining(res.refreshesRemaining ?? 0);
      } catch {
        toast.error("Couldn't update your pick — try again.");
      } finally {
        setApplying(false);
      }
    },
    [applyOverrides],
  );

  const scheduleApply = useCallback(
    (next: {
      dietary: string[];
      allergies: string[];
      spice: DailyDinnerOverrides["spiceLevel"];
      maxTime: number | undefined;
    }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void runApplyOverrides(next);
      }, 400);
    },
    [runApplyOverrides],
  );

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const toggleFromList = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const onDietary = (v: string) => {
    const next = toggleFromList(dietary, v);
    setDietary(next);
    scheduleApply({ dietary: next, allergies, spice, maxTime });
  };
  const onAllergy = (v: string) => {
    const next = toggleFromList(allergies, v);
    setAllergies(next);
    scheduleApply({ dietary, allergies: next, spice, maxTime });
  };
  const onSpice = (v: DailyDinnerOverrides["spiceLevel"]) => {
    const next = spice === v ? undefined : v;
    setSpice(next);
    scheduleApply({ dietary, allergies, spice: next, maxTime });
  };
  const onTime = (v: number) => {
    const next = maxTime === v ? undefined : v;
    setMaxTime(next);
    scheduleApply({ dietary, allergies, spice, maxTime: next });
  };
  const clearAll = () => {
    setDietary([]);
    setAllergies([]);
    setSpice(undefined);
    setMaxTime(undefined);
    scheduleApply({ dietary: [], allergies: [], spice: undefined, maxTime: undefined });
  };
  const activeCount =
    dietary.length + allergies.length + (spice ? 1 : 0) + (maxTime ? 1 : 0);

  const onRefresh = async () => {
    if (refreshesRemaining <= 0) {
      toast.info("You've used your alternate pick for today. Come back tomorrow!");
      return;
    }
    setRefreshing(true);
    try {
      const res = await refresh();
      setRecipe(res.recipe);
      setRefreshesRemaining(res.refreshesRemaining ?? 0);
      if (res.limited) {
        toast.info("No more refreshes today.");
      } else {
        toast.success(
          res.refreshesRemaining > 0
            ? "Fresh idea for tonight."
            : "Here's your alternate pick — no more refreshes today.",
        );
      }
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

  const onDislike = async () => {
    if (!recipe || disliking) return;
    setDisliking(true);
    try {
      const res = await dislike();
      setRecipe(res.recipe);
      setRefreshesRemaining(res.refreshesRemaining ?? 0);
      toast.success("Got it — we'll steer future picks away from this.");
    } catch {
      toast.error("Couldn't save that — try again.");
    } finally {
      setDisliking(false);
    }
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

            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowToggles((s) => !s)}
                className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/40 rounded-full px-3 py-1.5 font-black text-[11px] uppercase tracking-widest"
                aria-expanded={showToggles}
              >
                <Sliders className="w-3.5 h-3.5" />
                Tweak {activeCount > 0 ? `(${activeCount})` : ""}
                {applying && <RefreshCw className="w-3.5 h-3.5 animate-spin ml-1" />}
              </button>

              {showToggles && (
                <div className="mt-3 bg-white/10 border border-white/25 rounded-2xl p-3 space-y-3">
                  <ToggleGroup
                    label="Diet"
                    options={[...DIETARY_CHOICES]}
                    selected={dietary}
                    onToggle={onDietary}
                  />
                  <ToggleGroup
                    label="Avoid"
                    options={[...ALLERGY_CHOICES]}
                    selected={allergies}
                    onToggle={onAllergy}
                  />
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/70 mb-1.5 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Spice
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SPICE_CHOICES.map((s) => (
                        <Chip key={s} active={spice === s} onClick={() => onSpice(s)}>
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/70 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ready in
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {TIME_CHOICES.map((m) => (
                        <Chip key={m} active={maxTime === m} onClick={() => onTime(m)}>
                          ≤ {m} min
                        </Chip>
                      ))}
                    </div>
                  </div>
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[10px] uppercase font-black tracking-widest text-white/80 underline"
                    >
                      Clear tweaks
                    </button>
                  )}
                </div>
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
                disabled={refreshing || refreshesRemaining <= 0}
                title={
                  refreshesRemaining <= 0
                    ? "You've used today's alternate pick. Resets at midnight UTC."
                    : "Get one alternate suggestion for today"
                }
                className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/40 rounded-full px-3 py-2 font-black text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Get an alternate pick"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing
                  ? "…"
                  : refreshesRemaining > 0
                    ? `New pick (${refreshesRemaining} left)`
                    : "No more today"}
              </button>
              <button
                onClick={onDislike}
                disabled={disliking}
                title="Not for me — steer future picks away from this cuisine and ingredients"
                className="inline-flex items-center gap-2 bg-white/10 border-2 border-white/40 rounded-full px-3 py-2 font-black text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Mark as not for me"
              >
                <ThumbsDown className={`w-4 h-4 ${disliking ? "animate-pulse" : ""}`} />
                {disliking ? "…" : "Not for me"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}