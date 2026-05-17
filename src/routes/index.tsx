import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { IngredientInput } from "@/components/fridge/IngredientInput";
import { FilterPanel } from "@/components/fridge/FilterPanel";
import { RecipeCard } from "@/components/fridge/RecipeCard";
import { SavedDrawer } from "@/components/fridge/SavedDrawer";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { generateRecipes, type Recipe } from "@/lib/recipes.functions";
import { getDishHelper, type DishHelperResult } from "@/lib/dish-helper.functions";
import { supabase } from "@/integrations/supabase/client";
import dalImg from "@/assets/recipe-dal.jpg";
import saagImg from "@/assets/recipe-saag.jpg";
import riceImg from "@/assets/recipe-rice.jpg";
import paneerImg from "@/assets/recipe-paneer.jpg";
import momoImg from "@/assets/recipe-momo.jpg";
import chanaImg from "@/assets/recipe-chana.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FridgeCuisine — Turn What's In Your Fridge Into Dinner" },
      {
        name: "description",
        content:
          "Type a dish or your fridge ingredients and FridgeCuisine's AI returns ingredients and step-by-step recipes from any global cuisine.",
      },
      { property: "og:title", content: "FridgeCuisine — Global Kitchen AI" },
      {
        property: "og:description",
        content:
          "Free AI kitchen helper. Get ingredients and recipes for any dish, or cook from what you already have.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [ingredients, setIngredients] = useState<string[]>([
    "Rice",
    "Eggs",
    "Onion",
    "Tomato",
  ]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState("Any / Surprise Me");
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useLocalStorage<Recipe[]>("fridge-chef-saved", []);

  const generate = useServerFn(generateRecipes);
  const fetchDish = useServerFn(getDishHelper);

  const [dishQuery, setDishQuery] = useState("");
  const [dishLoading, setDishLoading] = useState(false);
  const [dishResult, setDishResult] = useState<
    Extract<DishHelperResult, { ok: true }>["data"] | null
  >(null);
  const [showRecipe, setShowRecipe] = useState(false);

  const dishPrompts = [
    "See something that made you hungry? Tell me the dish — I'll give you the ingredients and recipe.",
    "Caught drooling? Name the food and I'll spill the ingredients and recipe.",
    "Food crush? Tell me what it was and I'll hand over the ingredients and recipe.",
    "That dish got your attention, huh? Drop the name — I've got the recipe and ingredients.",
    "If your stomach just said 'yes please,' tell me the dish and I'll generate the recipe and ingredients.",
    "Name the dish you can't stop thinking about — I'll recreate it with ingredients and recipe.",
    "Saw something delicious online? Tell me what it is and I'll break down the recipe and ingredients.",
    "From craving to cooking — tell me the dish and I'll give you the ingredients and recipe.",
    "That food looked dangerously good. Want the ingredients and recipe?",
    "Tell me what made you hungry — I'll turn it into a recipe with ingredients.",
  ];
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptVisible, setPromptVisible] = useState(true);
  useEffect(() => {
    const tick = setInterval(() => {
      setPromptVisible(false);
      setTimeout(() => {
        setPromptIndex((i) => (i + 1) % dishPrompts.length);
        setPromptVisible(true);
      }, 300);
    }, 3800);
    return () => clearInterval(tick);
  }, [dishPrompts.length]);

  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  const onDishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = dishQuery.trim();
    if (q.length < 2) {
      toast.error("Tell me what dish you want to prepare.");
      return;
    }
    setDishLoading(true);
    setDishResult(null);
    setShowRecipe(false);
    try {
      const res = await fetchDish({ data: { dish: q } });
      if (!res.ok) toast.error(res.error);
      else setDishResult(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setDishLoading(false);
    }
  };

  const onSubmit = async () => {
    if (ingredients.length === 0) {
      toast.error("Add at least one ingredient first.");
      return;
    }
    setLoading(true);
    setRecipes(null);
    try {
      const res = await generate({
        data: { ingredients, dietary, cuisine },
      });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        setRecipes(res.recipes);
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const isSaved = (title: string) => saved.some((s) => s.title === title);
  const toggleSave = (recipe: Recipe) => {
    if (!email) {
      toast("Sign in to save recipes", {
        description: "Create a free account to keep recipes across devices.",
        action: {
          label: "Sign in",
          onClick: () => navigate({ to: "/login" }),
        },
      });
      return;
    }
    if (isSaved(recipe.title)) {
      setSaved(saved.filter((s) => s.title !== recipe.title));
      toast("Removed from saved");
    } else {
      setSaved([recipe, ...saved]);
      toast.success("Saved!");
    }
  };

  return (
    <>
      <Toaster />
      <SavedDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        saved={saved}
        onUnsave={(title) => setSaved(saved.filter((s) => s.title !== title))}
      />

      <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-white border-2 border-border rounded-full pl-3 pr-1 py-1 shadow-[3px_3px_0px_0px_var(--border)]">
          {email ? (
            <>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="text-[11px] font-black uppercase tracking-wide"
              >
                Saved {saved.length}
              </button>
              <span className="hidden sm:inline text-xs font-bold truncate max-w-[140px] opacity-70">
                {email}
              </span>
              <button
                onClick={handleLogout}
                className="text-[11px] font-black uppercase tracking-wide bg-paprika text-white px-2.5 py-1.5 rounded-full"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                search={{ mode: "signin" }}
                className="text-[11px] font-black uppercase tracking-wide px-2"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                search={{ mode: "signup" }}
                className="text-[11px] font-black uppercase tracking-wide bg-turmeric px-2.5 py-1.5 rounded-full"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <header className="max-w-6xl mx-auto mb-8 md:mb-12 flex justify-between items-end gap-4">
          <div>
            <h1 className="font-display text-5xl md:text-8xl uppercase tracking-tighter text-paprika leading-none">
              Fridge
              <br />
              Cuisine
            </h1>
            <p className="font-black uppercase tracking-widest text-[10px] md:text-sm mt-2 ml-1">
              Global Kitchen AI
            </p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <section className="lg:col-span-12 animate-pop">
            <div className="bg-white border-4 border-border rounded-[32px] p-5 md:p-6 shadow-[8px_8px_0px_0px_var(--border)]">
              <h2 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Dish to recipe
              </h2>
              <div className="min-h-[3.5rem] md:min-h-[3rem] mb-4 flex items-start">
                <p
                  key={promptIndex}
                  className={`font-display text-lg md:text-2xl leading-snug text-foreground transition-all duration-300 ${
                    promptVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                  }`}
                >
                  {dishPrompts[promptIndex]}
                </p>
              </div>
              <form onSubmit={onDishSubmit} className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={dishQuery}
                  onChange={(e) => setDishQuery(e.target.value)}
                  placeholder="e.g. Nepali-style momo, Thai green curry, tiramisu…"
                  className="flex-1 border-2 border-border rounded-2xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-turmeric"
                />
                <button
                  type="submit"
                  disabled={dishLoading}
                  className="bg-paprika text-white border-4 border-border py-3 px-6 rounded-2xl font-black uppercase shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60"
                >
                  {dishLoading ? "Thinking…" : "Get ingredients"}
                </button>
              </form>

              {dishResult && (
                <div className="mt-5 border-t-2 border-dashed border-border/40 pt-5">
                  <h3 className="font-display text-2xl md:text-3xl uppercase text-paprika mb-2">
                    {dishResult.dishName}
                  </h3>
                  <p className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-3">
                    Ingredients
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-5">
                    {dishResult.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="text-sm font-medium before:content-['▸'] before:mr-2 before:text-turmeric"
                      >
                        {ing}
                      </li>
                    ))}
                  </ul>

                  {!showRecipe ? (
                    <div className="bg-turmeric/10 border-2 border-dashed border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="font-bold text-sm">
                        Do you want the recipe as well?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRecipe(true)}
                          className="bg-turmeric border-2 border-border px-5 py-2 rounded-full font-black uppercase text-sm shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDishResult(null);
                            setDishQuery("");
                          }}
                          className="bg-white border-2 border-border px-5 py-2 rounded-full font-black uppercase text-sm shadow-[0px_3px_0px_0px_var(--border)] active:translate-y-0.5"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-background border-2 border-border rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="font-black text-xs uppercase tracking-widest">
                          Recipe
                        </p>
                        <span className="font-mono text-xs bg-white border border-border px-2 py-0.5">
                          {dishResult.recipe.cookTimeMinutes} min
                          {dishResult.recipe.serves ? ` · serves ${dishResult.recipe.serves}` : ""}
                        </span>
                      </div>
                      <ol className="space-y-2 list-decimal list-inside">
                        {dishResult.recipe.steps.map((s, i) => (
                          <li key={i} className="text-sm leading-relaxed">
                            {s}
                          </li>
                        ))}
                      </ol>
                      {dishResult.recipe.tips.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-dashed border-border/40">
                          <p className="font-black text-xs uppercase mb-1">Tips</p>
                          <ul className="space-y-1">
                            {dishResult.recipe.tips.map((t, i) => (
                              <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-5 animate-pop">
            <div className="bg-white border-4 border-border rounded-[32px] p-5 md:p-6 shadow-[8px_8px_0px_0px_var(--border)] lg:sticky lg:top-6">
              <h2 className="font-black text-xl md:text-2xl uppercase mb-4">
                What's in the pantry?
              </h2>

              <IngredientInput
                ingredients={ingredients}
                onChange={setIngredients}
              />

              <div className="my-5 border-t-2 border-dashed border-border/30" />

              <FilterPanel
                dietary={dietary}
                cuisine={cuisine}
                onDietary={setDietary}
                onCuisine={setCuisine}
              />

              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="mt-5 w-full bg-turmeric border-4 border-border py-4 rounded-2xl font-black text-xl md:text-2xl uppercase shadow-[0px_6px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Cooking…" : "Find My Feast"}
              </button>
            </div>
          </section>

          <section className="lg:col-span-7 space-y-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-3xl md:text-4xl uppercase">
                {loading
                  ? "Searching…"
                  : recipes
                    ? `${recipes.length} Recipes Found`
                    : "Ready when you are"}
              </h3>
              {recipes && (
                <span className="font-mono text-xs font-bold bg-white border border-border px-2 py-0.5">
                  AI · {cuisine.split(" /")[0]}
                </span>
              )}
            </div>

            {loading && <LoadingSkeleton />}

            {!loading && !recipes && <EmptyState />}

            {!loading &&
              recipes &&
              recipes.map((r, i) => (
                <RecipeCard
                  key={`${r.title}-${i}`}
                  recipe={r}
                  index={i}
                  saved={isSaved(r.title)}
                  onToggleSave={() => toggleSave(r)}
                />
              ))}
          </section>
        </div>

        {email && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open saved recipes"
            className="md:hidden fixed bottom-6 right-6 size-16 bg-turmeric border-4 border-border rounded-full shadow-[4px_4px_0px_0px_var(--border)] grid place-items-center z-40"
          >
            <span className="font-black text-xl">{saved.length}</span>
          </button>
        )}
      </main>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white border-4 border-border rounded-[32px] h-40 shadow-[8px_8px_0px_0px_var(--border)] animate-pulse flex"
        >
          <div className="w-48 bg-turmeric/20 border-r-4 border-border" />
          <div className="flex-1 p-6 space-y-3">
            <div className="h-6 bg-foreground/10 rounded w-2/3" />
            <div className="h-3 bg-foreground/10 rounded w-1/3" />
            <div className="h-3 bg-foreground/10 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border-4 border-dashed border-border/40 rounded-[32px] p-10 text-center">
      <div className="font-display text-5xl md:text-6xl text-turmeric mb-2">
        🍳
      </div>
      <p className="font-black text-lg uppercase mb-2">
        Hit "Find My Feast"
      </p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Add what's in your fridge, pick your vibe, and we'll turn it into
        actual dinner — substitutions and all.
      </p>
    </div>
  );
}
