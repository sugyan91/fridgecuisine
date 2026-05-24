import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { IngredientInput } from "@/components/fridge/IngredientInput";
import { FilterPanel } from "@/components/fridge/FilterPanel";
import { RecipeCard } from "@/components/fridge/RecipeCard";
import { SavedDrawer } from "@/components/fridge/SavedDrawer";
import { CommunityStrip } from "@/components/fridge/CommunityStrip";
import { CountryTiles } from "@/components/landing/CountryTiles";
import { TrendingDishes } from "@/components/landing/TrendingDishes";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ChefCTA } from "@/components/landing/ChefCTA";
import { generateRecipes, type Receipe } from "@/lib/receipes.functions";
import {
  listSavedRecipes,
  saveRecipe as saveRecipeFn,
  unsaveRecipe as unsaveRecipeFn,
  setCookedStatus,
  type SavedRecipeRow,
} from "@/lib/saved-recipes.functions";
import { getDishHelper, type DishHelperResult } from "@/lib/dish-helper.functions";
import { supabase } from "@/integrations/supabase/client";
import { worldFoods } from "@/lib/world-foods";
import { DEFAULT_CUISINES } from "@/lib/taxonomy";
import { RecipeCounter } from "@/components/RecipeCounter";
import { useRecipeUsage } from "@/hooks/use-recipe-usage";
import { useSubscription } from "@/hooks/use-subscription";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { RecipeTimers } from "@/components/fridge/RecipeTimers";
import { StepTimer } from "@/components/fridge/StepTimer";
import logoImg from "@/assets/fridge-cuisine-logo.png";

const CUISINE_TO_COUNTRY: Record<string, string> = {
  Chinese: "China", Cantonese: "China", Sichuan: "China", Hunan: "China",
  Japanese: "Japan", Korean: "South Korea", Taiwanese: "Taiwan",
  Mongolian: "Mongolia", Tibetan: "Tibet",
  Thai: "Thailand", Vietnamese: "Vietnam", Filipino: "the Philippines",
  Indonesian: "Indonesia", Malaysian: "Malaysia", Singaporean: "Singapore",
  Burmese: "Myanmar", Cambodian: "Cambodia", Laotian: "Laos",
  Indian: "India", Pakistani: "Pakistan", Bangladeshi: "Bangladesh",
  "Sri Lankan": "Sri Lanka", "Nepali / Himalayan": "Nepal",
  Bhutanese: "Bhutan", Afghan: "Afghanistan",
  "South Asian Fusion": "South Asia",
  "Persian / Iranian": "Iran", Turkish: "Turkey", Lebanese: "Lebanon",
  Israeli: "Israel", Syrian: "Syria", Iraqi: "Iraq", Yemeni: "Yemen",
  "Middle Eastern": "the Middle East",
  Moroccan: "Morocco", Egyptian: "Egypt", Ethiopian: "Ethiopia",
  Eritrean: "Eritrea", Nigerian: "Nigeria", Ghanaian: "Ghana",
  Senegalese: "Senegal", Kenyan: "Kenya", "South African": "South Africa",
  Tunisian: "Tunisia", Algerian: "Algeria", African: "Africa",
  Italian: "Italy", French: "France", Spanish: "Spain",
  Portuguese: "Portugal", Greek: "Greece", German: "Germany",
  Austrian: "Austria", Swiss: "Switzerland", British: "the UK",
  Scottish: "Scotland", Irish: "Ireland",
  Polish: "Poland", Russian: "Russia", Ukrainian: "Ukraine",
  Hungarian: "Hungary", Czech: "Czechia", Romanian: "Romania",
  Bulgarian: "Bulgaria", Serbian: "Serbia", Croatian: "Croatia",
  Swedish: "Sweden", Norwegian: "Norway", Danish: "Denmark",
  Finnish: "Finland", Dutch: "the Netherlands", Belgian: "Belgium",
  "Eastern European": "Eastern Europe", Mediterranean: "the Mediterranean",
  Mexican: "Mexico", "Tex-Mex": "Texas",
  "American Southern": "the American South",
  "Cajun / Creole": "Louisiana", Hawaiian: "Hawaii",
  "Soul Food": "the American South",
  Peruvian: "Peru", Brazilian: "Brazil", Argentinian: "Argentina",
  Colombian: "Colombia", Venezuelan: "Venezuela", Chilean: "Chile",
  "Latin American": "Latin America",
  Cuban: "Cuba", Jamaican: "Jamaica", "Puerto Rican": "Puerto Rico",
  Dominican: "the Dominican Republic", Haitian: "Haiti",
  Trinidadian: "Trinidad", Caribbean: "the Caribbean",
  Australian: "Australia", "New Zealand": "New Zealand",
  "Pacific Islander": "the Pacific Islands",
  Fusion: "the world", "Street Food": "the world", "Comfort Food": "the world",
};

function cuisineToCountry(c: string): string {
  return CUISINE_TO_COUNTRY[c] ?? c;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FridgeCuisine — Turn What's In Your Fridge Into Dinner" },
      {
        name: "description",
        content:
          "Type a dish or your fridge ingredients and FridgeCuisine's AI returns ingredients and step-by-step recipes from any global cuisine.",
      },
      { property: "og:title", content: "FridgeCuisine — Global AI Kitchen" },
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
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState("Any / Surprise Me");
  const [pantryMode, setPantryMode] = useState(false);
  const [receipes, setRecipes] = useState<Receipe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState<SavedRecipeRow[]>([]);

  const generate = useServerFn(generateRecipes);
  const fetchDish = useServerFn(getDishHelper);
  const listSaved = useServerFn(listSavedRecipes);
  const saveRecipeRpc = useServerFn(saveRecipeFn);
  const unsaveRecipeRpc = useServerFn(unsaveRecipeFn);
  const setCookedRpc = useServerFn(setCookedStatus);

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
  const [promptAnim, setPromptAnim] = useState<"in" | "out">("in");
  useEffect(() => {
    const tick = setInterval(() => {
      setPromptAnim("out");
      setTimeout(() => {
        setPromptIndex((i) => (i + 1) % dishPrompts.length);
        setPromptAnim("in");
      }, 600);
    }, 60000);
    return () => clearInterval(tick);
  }, [dishPrompts.length]);

  // Rotating "food from country" placeholder — 500 dishes worldwide, every 30s
  const [worldFoodIndex, setWorldFoodIndex] = useState(() =>
    Math.floor(Math.random() * worldFoods.length),
  );
  useEffect(() => {
    const tick = setInterval(() => {
      setWorldFoodIndex((i) => (i + 1) % worldFoods.length);
    }, 30000);
    return () => clearInterval(tick);
  }, []);

  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { isPremium } = useSubscription(userId);
  const { logGeneration, atLimit: usageAtLimit } = useRecipeUsage(userId);
  const isAdmin = useIsAdmin(userId);
  const [adminOpen, setAdminOpen] = useState(false);
  const limitBlocked = !isPremium && usageAtLimit;
  const limitToast = () => {
    toast.error(
      userId
        ? "Daily limit reached (5/day). Upgrade for unlimited recipes."
        : "Daily limit reached (5/day). Sign up or upgrade for more.",
    );
  };
  const headerRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const pantryRef = useRef<HTMLElement | null>(null);
  const dishInputRef = useRef<HTMLInputElement | null>(null);
  const [headerOffset, setHeaderOffset] = useState(96);
  useEffect(() => {
    const compute = () => {
      const h1 = headerRef.current?.offsetHeight ?? 0;
      const h2 = navRef.current?.offsetHeight ?? 0;
      // pills sit at top-3 (12px). Add a 16px breathing gap below the tallest pill.
      setHeaderOffset(12 + Math.max(h1, h2) + 16);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (headerRef.current) ro.observe(headerRef.current);
    if (navRef.current) ro.observe(navRef.current);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [email]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setUserId(data.user?.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      setUserId(session?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setSaved([]);
      return;
    }
    listSaved().then((res) => setSaved(res.rows)).catch(() => {});
  }, [userId, listSaved]);
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
    if (limitBlocked) {
      limitToast();
      return;
    }
    setDishLoading(true);
    setDishResult(null);
    setShowRecipe(false);
    try {
      const res = await fetchDish({ data: { dish: q } });
      if (!res.ok) toast.error(res.error);
      else {
        setDishResult(res.data);
        logGeneration();
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setDishLoading(false);
    }
  };

  const runDishByName = async (name: string) => {
    if (limitBlocked) {
      limitToast();
      return;
    }
    setDishQuery(name);
    setDishLoading(true);
    setDishResult(null);
    setShowRecipe(false);
    dishInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      const res = await fetchDish({ data: { dish: name } });
      if (!res.ok) toast.error(res.error);
      else {
        setDishResult(res.data);
        logGeneration();
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setDishLoading(false);
    }
  };

  const pickCuisine = (c: string) => {
    setCuisine(c);
    setPantryMode(false);
    toast.success(`Cuisine set to ${c}`);
  };

  const onSubmit = async () => {
    if (limitBlocked) {
      limitToast();
      return;
    }
    setPantryMode(false);
    setLoading(true);
    setRecipes(null);
    try {
      const res = await generate({
        data: { ingredients, dietary, cuisine, exclude: [] },
      });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        setRecipes(res.receipes);
        logGeneration();
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onPantryGenerate = async () => {
    if (limitBlocked) {
      limitToast();
      return;
    }
    setPantryMode(true);
    setCuisine("Any / Surprise Me");
    setLoading(true);
    setRecipes(null);
    try {
      const res = await generate({
        data: { ingredients, dietary, cuisine: "Any / Surprise Me", exclude: [] },
      });
      if (!res.ok) toast.error(res.error);
      else {
        setRecipes(res.receipes);
        logGeneration();
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onLoadMore = async () => {
    if (!receipes) return;
    if (limitBlocked) {
      limitToast();
      return;
    }
    setLoadingMore(true);
    try {
      const res = await generate({
        data: {
          ingredients,
          dietary,
          cuisine,
          exclude: receipes.map((r) => r.title),
        },
      });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        const existing = new Set(receipes.map((r) => r.title.toLowerCase()));
        const fresh = res.receipes.filter((r) => !existing.has(r.title.toLowerCase()));
        if (fresh.length === 0) {
          toast("No new recipes — try changing cuisine or dietary filters.");
        } else {
          setRecipes([...receipes, ...fresh]);
          logGeneration();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const isSaved = (title: string) => saved.some((s) => s.title === title);
  const toggleSave = async (receipe: Receipe) => {
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
    try {
      if (isSaved(receipe.title)) {
        await unsaveRecipeRpc({ data: { title: receipe.title } });
        setSaved((prev) => prev.filter((s) => s.title !== receipe.title));
        toast("Removed from saved");
      } else {
        const res = await saveRecipeRpc({ data: { recipe: receipe } });
        setSaved((prev) => [res.row, ...prev.filter((s) => s.title !== receipe.title)]);
        toast.success("Saved!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update saved recipes.");
    }
  };

  const onToggleCooked = async (row: SavedRecipeRow) => {
    const nextCooked = !row.cooked_at;
    try {
      const res = await setCookedRpc({ data: { id: row.id, cooked: nextCooked } });
      setSaved((prev) => prev.map((s) => (s.id === row.id ? res.row : s)));
      toast.success(nextCooked ? "Logged to meal history" : "Removed from history");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update status.");
    }
  };

  return (
    <>
      <Toaster />
      <AdminPanel open={adminOpen} onClose={() => setAdminOpen(false)} />
      <SavedDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        saved={saved}
        onUnsave={async (title) => {
          try {
            await unsaveRecipeRpc({ data: { title } });
            setSaved((prev) => prev.filter((s) => s.title !== title));
          } catch {
            toast.error("Couldn't remove.");
          }
        }}
        onToggleCooked={onToggleCooked}
      />

      <main
        className="min-h-screen bg-background text-foreground px-4 pb-8 md:px-8"
        style={{ paddingTop: `${headerOffset}px` }}
      >
        <header
          ref={headerRef}
          className="fixed inset-x-0 top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border"
        >
          <div
            ref={navRef}
            className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 md:px-8 py-4"
          >
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 mr-1 sm:mr-2"
            >
              <img
                src={logoImg}
                alt="Fridge Cuisine"
                className="h-7 sm:h-8 md:h-9 w-auto rounded-lg bg-background shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-display tracking-tight text-foreground leading-none text-[13px] sm:text-lg md:text-xl text-left lowercase whitespace-nowrap font-semibold">
                  fridge cuisine<span className="text-primary">.</span>
                </h1>
              </div>
            </Link>

            <nav className="flex items-center gap-1 md:gap-2 shrink-0">
              <Link
                to="/community"
                className="text-[11px] md:text-sm font-medium text-foreground/80 hover:text-foreground px-2 py-1.5 md:px-3 md:py-2 rounded-full hover:bg-secondary transition-colors"
              >
                Community
              </Link>
              {email ? (
                <>
                  <Link
                    to="/my-recipes"
                    className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2 hidden lg:inline rounded-full hover:bg-secondary transition-colors"
                  >
                    My Recipes
                  </Link>
                  <Link
                    to="/cookbook"
                    className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2 hidden lg:inline rounded-full hover:bg-secondary transition-colors"
                  >
                    Cookbook
                  </Link>
                  <Link
                    to="/community/new"
                    className="text-[11px] md:text-sm font-medium px-2.5 py-1.5 md:px-3 md:py-2 rounded-full bg-secondary border border-border hover:bg-foreground hover:text-background hover:border-transparent transition-all"
                  >
                    <span className="sm:hidden">+</span>
                    <span className="hidden sm:inline">+ Share</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="text-[11px] md:text-sm font-medium px-2.5 py-1.5 md:px-3 md:py-2 rounded-full border border-border hover:bg-secondary transition-colors"
                  >
                    Saved {saved.length}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setAdminOpen(true)}
                      className="text-[11px] md:text-sm font-medium px-2.5 py-1.5 md:px-3 md:py-2 rounded-full bg-foreground text-background"
                    >
                      Admin
                    </button>
                  )}
                  <span className="hidden xl:inline text-xs font-bold truncate max-w-[140px] opacity-70">
                    {email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-[11px] md:text-sm font-medium px-2.5 py-1.5 md:px-3 md:py-2 rounded-full bg-primary text-primary-foreground hover:brightness-110 transition-all"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    search={{ mode: "signin" }}
                    className="text-[11px] md:text-sm font-medium px-2.5 py-1.5 md:px-4 md:py-2 rounded-full text-foreground hover:bg-secondary transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/login"
                    search={{ mode: "signup" }}
                    className="text-[11px] md:text-sm font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-foreground text-background hover:brightness-110 transition-all"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
          <section className="lg:col-span-12">
            <div className="max-w-3xl mx-auto text-center pt-2 md:pt-6 pb-4">
              <div className="flex items-center justify-center gap-3 mb-5">
                <span className="h-px w-8 bg-accent" />
                <p className="font-display text-[10px] md:text-xs tracking-[0.3em] uppercase text-accent">
                  Dish to Recipe
                </p>
                <span className="h-px w-8 bg-accent" />
              </div>
              <h1 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-tight leading-[0.9] text-foreground mb-6">
                What food is living rent-free<br className="hidden sm:inline" /> in your <span className="text-accent">head</span> right now?
              </h1>
              <div className="min-h-[3.5rem] md:min-h-[3rem] mb-8 flex items-center justify-center overflow-hidden">
                <p
                  key={promptIndex}
                  className={`text-base md:text-lg leading-relaxed text-muted-foreground max-w-xl ${
                    promptAnim === "in"
                      ? "animate-fade-down-in"
                      : "animate-fade-down-out"
                  }`}
                >
                  {dishPrompts[promptIndex]}
                </p>
              </div>
              <form onSubmit={onDishSubmit} className="relative max-w-2xl mx-auto">
                <input
                  ref={dishInputRef}
                  type="text"
                  value={dishQuery}
                  onChange={(e) => setDishQuery(e.target.value)}
                  placeholder={`eg: ${worldFoods[worldFoodIndex].food} from ${worldFoods[worldFoodIndex].country}`}
                  className="w-full bg-card border border-border rounded-2xl py-4 sm:py-5 md:py-6 pl-6 pr-4 sm:pr-36 md:pr-44 text-base md:text-lg shadow-[var(--shadow-soft)] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={dishLoading}
                  className="mt-2 w-full py-3 sm:mt-0 sm:w-auto sm:py-0 sm:absolute sm:right-2 sm:top-2 sm:bottom-2 bg-primary text-primary-foreground px-5 md:px-7 rounded-xl font-display font-semibold text-sm md:text-base hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {dishLoading ? "Thinking…" : "Start cooking"}
                </button>
              </form>
              <div className="mt-4 flex justify-center">
                <RecipeCounter userId={userId} isPremium={isPremium} />
              </div>
            </div>

              {dishResult && (
              <div className="max-w-3xl mx-auto mt-10 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-[var(--shadow-soft)]">
                <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">
                    {dishResult.dishName}
                  </h3>
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                    Ingredients
                  </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-5">
                    {dishResult.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="text-sm font-medium before:content-['•'] before:mr-2 before:text-primary"
                      >
                        {ing}
                      </li>
                    ))}
                  </ul>

                  {!showRecipe ? (
                  <div className="bg-secondary border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="font-medium text-sm">
                        Do you want the recipe as well?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRecipe(true)}
                          className="bg-primary text-primary-foreground px-5 py-2 rounded-full font-display font-semibold text-sm hover:brightness-110 transition-all"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDishResult(null);
                            setDishQuery("");
                          }}
                          className="bg-card border border-border text-foreground px-5 py-2 rounded-full font-display font-semibold text-sm hover:bg-secondary transition-colors"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div className="bg-secondary/60 border border-border rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                          Recipe
                        </p>
                        <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
                          {dishResult.receipe.prepTimeMinutes != null && (
                            <span className="bg-card border border-border rounded-full px-2.5 py-0.5">Prep {dishResult.receipe.prepTimeMinutes}m</span>
                          )}
                          <span className="bg-card border border-border rounded-full px-2.5 py-0.5">Cook {dishResult.receipe.cookTimeMinutes}m</span>
                          {dishResult.receipe.totalTimeMinutes != null && (
                            <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5">Total {dishResult.receipe.totalTimeMinutes}m</span>
                          )}
                          {dishResult.receipe.serves && (
                            <span className="bg-card border border-border rounded-full px-2.5 py-0.5">Serves {dishResult.receipe.serves}</span>
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <RecipeTimers
                          totalMinutes={
                            dishResult.receipe.totalTimeMinutes ??
                            dishResult.receipe.cookTimeMinutes
                          }
                        />
                      </div>
                      <ol className="space-y-2.5">
                        {dishResult.receipe.steps.map((s, i) => {
                          const t = dishResult.receipe.stepTimings?.[i];
                          return (
                            <li key={i} className="flex gap-3 items-start text-sm leading-relaxed">
                              <span className="shrink-0 size-6 rounded-full bg-primary/10 text-primary border border-primary/20 font-display font-semibold text-[11px] grid place-items-center mt-0.5">
                                {i + 1}
                              </span>
                              <span className="flex-1">
                                {s}
                                {t != null && (
                                  <span className="ml-2 inline-flex align-middle">
                                    <StepTimer minutes={t} />
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                      {dishResult.receipe.tips.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-1.5">Tips</p>
                          <ul className="space-y-1">
                            {dishResult.receipe.tips.map((t, i) => (
                              <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
              </div>
              )}
          </section>

          <section className="lg:col-span-12">
            <SectionHeader
              eyebrow="Explore by country"
              title="Cook the world tonight"
              subtitle="Explore 50+ cuisines from every corner of the globe."
            />
            <CountryTiles onPick={pickCuisine} />
            <div className="max-w-md mx-auto mt-6">
              <p className="font-bold text-xs uppercase tracking-wider mb-2 opacity-60 text-center">Global Cuisine Vibe</p>
              <select
                value={cuisine}
                onChange={(e) => {
                  setPantryMode(false);
                  setCuisine(e.target.value);
                }}
                className="w-full border-2 border-border p-3 rounded-xl font-bold bg-white"
              >
                {["Any / Surprise Me", ...[...DEFAULT_CUISINES].filter((c) => c !== "Any / Surprise Me").sort((a, b) => a.localeCompare(b))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="mt-4 w-full bg-primary text-primary-foreground py-4 rounded-2xl font-display font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && !pantryMode
                  ? cuisine && cuisine !== "Any / Surprise Me"
                    ? `Travelling to ${cuisineToCountry(cuisine)} for a surprise recipe…`
                    : "Travelling the globe to find your perfect recipe…"
                  : "Show me the cuisine"}
              </button>
              <div className="mt-3 flex justify-center">
                <RecipeCounter userId={userId} isPremium={isPremium} />
              </div>
            </div>
          </section>

          <section className="lg:col-span-12">
            <SectionHeader
              eyebrow="Trending right now"
              title="Hungry for inspiration?"
              subtitle="Tap any dish and we'll spin up the full recipe instantly."
            />
            <TrendingDishes onPick={runDishByName} />
          </section>

          <section className="lg:col-span-12">
            <SectionHeader
              eyebrow="How it works"
              title="From fridge to feast in 3 steps"
            />
            <HowItWorks />
          </section>

          <section ref={pantryRef} className="lg:col-span-5 scroll-mt-32">
            <div className="bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-[var(--shadow-soft)] lg:sticky lg:top-32">
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-1">
                What's in your Pantry
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Add the ingredients you have on hand and we'll plan the meal.
              </p>

              <IngredientInput
                ingredients={ingredients}
                onChange={setIngredients}
              />

              <div className="my-5 border-t border-border" />

              <FilterPanel
                dietary={dietary}
                cuisine={cuisine}
                onDietary={setDietary}
                onCuisine={(c) => {
                  setPantryMode(false);
                  setCuisine(c);
                }}
                onPantryGenerate={onPantryGenerate}
                pantryLoading={loading && pantryMode}
                isAuthenticated={!!email}
                counterSlot={<RecipeCounter userId={userId} isPremium={isPremium} />}
              />
            </div>
          </section>

          <section className="lg:col-span-7 space-y-5">
            {(loading || (receipes && receipes.length > 0)) && (
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                  {loading ? "Searching…" : `${receipes!.length} recipes found`}
                </h3>
                {receipes && (
                  <span className="text-xs font-medium bg-card border border-border rounded-full px-3 py-1">
                    {pantryMode
                      ? dietary.length > 0
                        ? dietary.join(" · ")
                        : "Pantry"
                      : `AI · ${cuisine.split(" /")[0]}`}
                  </span>
                )}
              </div>
            )}

            {loading && <LoadingSkeleton />}

            {!loading &&
              receipes &&
              receipes.map((r, i) => (
                <RecipeCard
                  key={`${r.title}-${i}`}
                  receipe={r}
                  index={i}
                  saved={isSaved(r.title)}
                  onToggleSave={() => toggleSave(r)}
                  dietary={dietary}
                  showMissing={pantryMode && ingredients.length > 0}
                />
              ))}

            {!loading && receipes && receipes.length > 0 && (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="w-full bg-card border border-border text-foreground py-4 rounded-2xl font-display font-semibold text-sm hover:bg-secondary transition-all disabled:opacity-60"
              >
                {loadingMore ? "Cooking up more…" : "Show more recipes"}
              </button>
            )}
          </section>
        </div>

        <CommunityStrip isAuthenticated={!!email} />

        <section className="max-w-6xl mx-auto mt-12">
          <ChefCTA />
        </section>

        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-border">
          <PricingNote />
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

function PricingNote() {
  return (
    <div className="mt-4 pt-3 border-t border-border text-xs md:text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-2">
      <span>
        <span className="font-semibold text-foreground">$5.99/mo</span> · Premium · unlimited recipes
      </span>
      <Link
        to="/pricing"
        className="font-medium underline underline-offset-2 text-foreground shrink-0"
      >
        Upgrade
      </Link>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 md:mb-12 border-b border-border pb-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="h-px w-8 bg-accent" />
        <p className="font-display text-[10px] md:text-xs uppercase tracking-[0.3em] text-accent">
          {eyebrow}
        </p>
      </div>
      <div className="flex items-baseline justify-between gap-6 flex-wrap">
        <h2 className="font-display text-3xl md:text-5xl uppercase tracking-tight leading-[0.95] text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-[2rem] h-40 shadow-[var(--shadow-soft)] animate-pulse flex overflow-hidden"
        >
          <div className="w-48 bg-secondary" />
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

