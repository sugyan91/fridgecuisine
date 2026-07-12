import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, X, Mail } from "lucide-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { IngredientInput } from "@/components/fridge/IngredientInput";
import { FilterPanel } from "@/components/fridge/FilterPanel";
import { RecipeCard } from "@/components/fridge/RecipeCard";
import { DietBadgeRow } from "@/components/fridge/DietBadge";
import { RecipeSkeleton, RecipeDetailSkeleton } from "@/components/fridge/RecipeSkeleton";
import { ShareButton } from "@/components/fridge/ShareButton";
import { SavedDrawer } from "@/components/fridge/SavedDrawer";
import { CommunityStrip } from "@/components/fridge/CommunityStrip";
import { CountryTiles } from "@/components/landing/CountryTiles";
import { TrendingDishes } from "@/components/landing/TrendingDishes";
import { HowItWorksStrip } from "@/components/landing/HowItWorksStrip";
import { ChefCTA } from "@/components/landing/ChefCTA";
// ChefSellBanner removed from homepage — single Chef CTA strip is used near the footer.
import { LiveActivityTicker } from "@/components/landing/LiveActivityTicker";
import { PremiumRecipesStrip } from "@/components/landing/PremiumRecipesStrip";
import { Testimonials } from "@/components/landing/Testimonials";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { generateRecipes, type Recipe } from "@/lib/recipes.functions";
import {
  listSavedRecipes,
  saveRecipe as saveRecipeFn,
  unsaveRecipe as unsaveRecipeFn,
  setCookedStatus,
  type SavedRecipeRow,
} from "@/lib/saved-recipes.functions";
import { getDishHelper, type DishHelperResult } from "@/lib/dish-helper.functions";
import { POPULAR_COMBOS as ALL_POPULAR_COMBOS } from "@/data/popular-combos";
import { supabase } from "@/integrations/supabase/client";
import { worldFoods } from "@/lib/world-foods";
import { DEFAULT_CUISINES } from "@/lib/taxonomy";
import { CORE_DIETARY } from "@/lib/taxonomy";
import { RecipeCounter } from "@/components/RecipeCounter";
import { FreeTierBanner } from "@/components/FreeTierBanner";
import { LimitReachedModal } from "@/components/LimitReachedModal";
import { SaveSignupModal } from "@/components/SaveSignupModal";
import { useRecipeUsage } from "@/hooks/use-recipe-usage";
import { useSubscription } from "@/hooks/use-subscription";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { RecipeTimers } from "@/components/fridge/RecipeTimers";
import { StepTimer } from "@/components/fridge/StepTimer";
import logoAsset from "@/assets/fridge-cuisine-logo.png.asset.json";
import foodPasta from "@/assets/food-pasta.jpg";
import foodSushi from "@/assets/food-sushi.jpg";
import foodTacos from "@/assets/food-tacos.jpg";
import foodCurry from "@/assets/food-curry.jpg";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useLanguage } from "@/lib/language";
import { IngredientIcon } from "@/lib/ingredient-icon";

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
      { property: "og:url", content: "https://fridgecuisine.com/" },
    ],
    links: [{ rel: "canonical", href: "https://fridgecuisine.com/" }],
  }),
  component: Index,
});

function Index() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState("Any / Surprise Me");
  const [pantryMode, setPantryMode] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState<SavedRecipeRow[]>([]);
  const [kidFriendly, setKidFriendly] = useState(false);
  // Nutrition is always generated; flag retained as a constant for legacy props.
  const showNutrition = true;
  const setShowNutrition: (v: boolean) => void = () => {};

  const generate = useServerFn(generateRecipes);
  const fetchDish = useServerFn(getDishHelper);
  const listSaved = useServerFn(listSavedRecipes);
  const saveRecipeRpc = useServerFn(saveRecipeFn);
  const unsaveRecipeRpc = useServerFn(unsaveRecipeFn);
  const setCookedRpc = useServerFn(setCookedStatus);
  const { language } = useLanguage();

  const [dishQuery, setDishQuery] = useState("");
  const [dishLoading, setDishLoading] = useState(false);
  const [dishResult, setDishResult] = useState<
    Extract<DishHelperResult, { ok: true }>["data"] | null
  >(null);
  const [showRecipe, setShowRecipe] = useState(false);

  const dishPrompts = [
    "Staring at a half-empty fridge? Tell me what's inside — I'll turn it into dinner.",
    "Got eggs, rice, and no plan? List your ingredients and I'll build the meal.",
    "Don't let leftovers go to waste. Name what you have and I'll craft a recipe.",
    "Three random ingredients and zero inspiration? I'll turn them into something delicious.",
    "Your fridge is full of possibilities. Show me what you've got and I'll plan dinner.",
    "Tonight's dinner is hiding in your kitchen. List your ingredients and I'll find it.",
    "No time to shop? Work with what's already in your fridge. I'll do the rest.",
    "Turn whatever's in your fridge into a real dinner — just name the ingredients.",
    "That wilting veg in the crisper? I'll turn it into the star of the show.",
    "Open your fridge, tell me what you see, and I'll hand you a complete recipe.",
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
  const { isPremium, isUnlimited, tier: subTier } = useSubscription(userId);
  const { logGeneration, atLimit: usageAtLimit, countdown, tier: usageTier } =
    useRecipeUsage(userId);
  const isAdmin = useIsAdmin(userId);
  const [adminOpen, setAdminOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [saveModal, setSaveModal] = useState<{ open: boolean; recipe: Recipe | null }>({
    open: false,
    recipe: null,
  });
  // Unlimited has a fair-use daily cap too — apply usage limit to all tiers.
  const limitBlocked = usageAtLimit;
  const limitToast = () => {
    setLimitModalOpen(true);
  };
  const headerRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const pantryRef = useRef<HTMLElement | null>(null);
  const dishInputRef = useRef<HTMLInputElement | null>(null);
  const cuisineResultsRef = useRef<HTMLDivElement | null>(null);
  const cancelGenerationRef = useRef(false);

  const onCancelGeneration = () => {
    cancelGenerationRef.current = true;
    setLoading(false);
    setLoadingMore(false);
    toast.info("Generation cancelled");
  };
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

  // Press "/" anywhere on the page to jump focus to the hero dish search.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editable =
        target?.isContentEditable ||
        tag === "input" ||
        tag === "textarea" ||
        tag === "select";
      if (editable) return;
      e.preventDefault();
      dishInputRef.current?.focus();
      dishInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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
      const res = await fetchDish({ data: { dish: q, dietary, language: language.name } });
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
    try {
      const res = await fetchDish({ data: { dish: name, dietary, language: language.name } });
      if (!res.ok) toast.error(res.error);
      else {
        setDishResult(res.data);
        logGeneration();
        requestAnimationFrame(() => {
          dishInputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
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
    cancelGenerationRef.current = false;
    setLoading(true);
    setRecipes(null);
    // Scroll the results area into view right away so feedback is visible
    requestAnimationFrame(() => {
      cuisineResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    try {
      const res = await generate({
        data: { ingredients, dietary, cuisine, exclude: [], kidFriendly, includeNutrition: showNutrition, language: language.name },
      });
      if (cancelGenerationRef.current) return;
      if (!res.ok) {
        if (res.code === "rate_limit") {
          setLimitModalOpen(true);
        } else {
          toast.error(res.error);
        }
        logGeneration();
      } else {
        setRecipes(res.recipes);
        logGeneration();
      }
    } catch (err) {
      if (cancelGenerationRef.current) return;
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      if (!cancelGenerationRef.current) setLoading(false);
    }
  };

  const onPantryGenerate = async () => {
    if (limitBlocked) {
      limitToast();
      return;
    }
    setPantryMode(true);
    setCuisine("Any / Surprise Me");
    cancelGenerationRef.current = false;
    setLoading(true);
    setRecipes(null);
    try {
      const res = await generate({
        data: { ingredients, dietary, cuisine: "Any / Surprise Me", exclude: [], kidFriendly, includeNutrition: showNutrition, language: language.name },
      });
      if (cancelGenerationRef.current) return;
      if (!res.ok) {
        if (res.code === "rate_limit") setLimitModalOpen(true);
        else toast.error(res.error);
        logGeneration();
      } else {
        setRecipes(res.recipes);
        logGeneration();
      }
    } catch (err) {
      if (cancelGenerationRef.current) return;
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      if (!cancelGenerationRef.current) setLoading(false);
    }
  };

  const onLoadMore = async () => {
    if (!recipes) return;
    if (limitBlocked) {
      limitToast();
      return;
    }
    cancelGenerationRef.current = false;
    setLoadingMore(true);
    try {
      const res = await generate({
        data: {
          ingredients,
          dietary,
          cuisine,
          exclude: recipes.map((r) => r.title),
          kidFriendly,
          includeNutrition: showNutrition,
          language: language.name,
        },
      });
      if (cancelGenerationRef.current) return;
      if (!res.ok) {
        if (res.code === "rate_limit") setLimitModalOpen(true);
        else toast.error(res.error);
        logGeneration();
      } else {
        const existing = new Set(recipes.map((r) => r.title.toLowerCase()));
        const fresh = res.recipes.filter((r) => !existing.has(r.title.toLowerCase()));
        if (fresh.length === 0) {
          toast("No new recipes — try changing cuisine or dietary filters.");
        } else {
          setRecipes([...recipes, ...fresh]);
          logGeneration();
        }
      }
    } catch (err) {
      if (cancelGenerationRef.current) return;
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      if (!cancelGenerationRef.current) setLoadingMore(false);
    }
  };

  const isSaved = (title: string) => saved.some((s) => s.title === title);
  const toggleSave = async (recipe: Recipe) => {
    if (!email) {
      setSaveModal({ open: true, recipe });
      return;
    }
    try {
      if (isSaved(recipe.title)) {
        await unsaveRecipeRpc({ data: { title: recipe.title } });
        setSaved((prev) => prev.filter((s) => s.title !== recipe.title));
        toast("Removed from saved");
      } else {
        const res = await saveRecipeRpc({ data: { recipe: recipe } });
        setSaved((prev) => [res.row, ...prev.filter((s) => s.title !== recipe.title)]);
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
      <LimitReachedModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        isSignedIn={!!userId}
        countdown={countdown}
        tier={usageTier === "anon" ? "anon" : subTier}
      />
      <SaveSignupModal
        open={saveModal.open}
        recipe={saveModal.recipe}
        onClose={() => setSaveModal({ open: false, recipe: null })}
      />
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
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 mr-1 sm:mr-2 shrink"
            >
              <span className="relative inline-block shrink-0">
                <img
                  src={logoAsset.url}
                  alt="Fridge Cuisine"
                  width={36}
                  height={36}
                  fetchPriority="high"
                  decoding="async"
                  className="h-7 sm:h-8 md:h-9 w-auto rounded-lg bg-background"
                />
                <span className="absolute -top-1 -right-2 rounded-full bg-red-500 text-white text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 py-[1px] leading-none shadow-sm ring-1 ring-red-600/40">
                  Beta
                </span>
              </span>
                <div className="min-w-0 flex-1">
                <span className="block font-display tracking-tight text-foreground leading-none text-lg sm:text-lg md:text-xl text-left lowercase truncate font-semibold">
                  fridge cuisine<span className="text-primary">.</span>
                </span>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-1 uppercase tracking-[0.18em] font-medium overflow-hidden max-w-[55vw] sm:max-w-none tagline-mask sm:[mask-image:none] sm:[-webkit-mask-image:none]">
                  <span
                    className="tagline-sweep sm:!animate-none sm:!transform-none"
                    onTouchStart={(e) => e.currentTarget.classList.add("tagline-paused")}
                    onTouchEnd={(e) => e.currentTarget.classList.remove("tagline-paused")}
                  >
                    Your own AI powered personal chef
                  </span>
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-2 shrink-0">
              <LanguagePicker />
              <Link
                to="/community"
                className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2 rounded-full hover:bg-secondary transition-colors"
              >
                Community
              </Link>
              <Link
                to="/shop"
                className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2 rounded-full hover:bg-secondary transition-colors"
              >
                Shop
              </Link>
              <Link
                to="/contact"
                className="hidden lg:inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-2 rounded-full hover:bg-secondary transition-colors"
              >
                <Mail size={14} />
                Contact
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
                    className="text-sm font-medium px-3 py-2 rounded-full bg-foreground text-background hover:brightness-110 transition-all"
                  >
                    + Share
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="text-sm font-medium px-3 py-2 rounded-full border border-border hover:bg-secondary transition-colors"
                  >
                    Saved {saved.length}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setAdminOpen(true)}
                      className="text-sm font-medium px-3 py-2 rounded-full bg-foreground text-background"
                    >
                      Admin
                    </button>
                  )}
                  <span className="hidden xl:inline text-xs font-bold truncate max-w-[140px] opacity-70">
                    {email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium px-3 py-2 rounded-full bg-primary text-primary-foreground hover:brightness-110 transition-all"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    search={{ mode: "signin" }}
                    className="text-sm font-medium px-4 py-2 rounded-full text-foreground hover:bg-secondary transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/login"
                    search={{ mode: "signup" }}
                    className="text-sm font-medium px-4 py-2 rounded-full bg-foreground text-background hover:brightness-110 transition-all"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              <LanguagePicker variant="icon" />
              {email ? (
                <Link
                  to="/community/new"
                  className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-foreground text-background hover:brightness-110 transition-all"
                >
                  + Share
                </Link>
              ) : (
                <Link
                  to="/login"
                  search={{ mode: "signup" }}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-full bg-foreground text-background hover:brightness-110 transition-all"
                >
                  Sign up
                </Link>
              )}
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="p-2 rounded-full border border-border hover:bg-secondary transition-colors"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown panel */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-background shadow-lg">
              <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
                <Link
                  to="/community"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-sm font-medium text-foreground/90 hover:text-foreground border-b border-border"
                >
                  Community
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-sm font-medium text-foreground/90 hover:text-foreground border-b border-border inline-flex items-center gap-2"
                >
                  <Mail size={14} />
                  Contact us
                </Link>
                {email ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="py-3 text-sm font-medium text-left text-foreground/90 hover:text-foreground border-b border-border"
                    >
                      Saved ({saved.length})
                    </button>
                    <Link
                      to="/my-recipes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-sm font-medium text-foreground/90 hover:text-foreground border-b border-border"
                    >
                      My Recipes
                    </Link>
                    <Link
                      to="/cookbook"
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-3 text-sm font-medium text-foreground/90 hover:text-foreground border-b border-border"
                    >
                      Cookbook
                    </Link>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminOpen(true);
                          setMobileMenuOpen(false);
                        }}
                        className="py-3 text-sm font-medium text-left text-foreground/90 hover:text-foreground border-b border-border"
                      >
                        Admin
                      </button>
                    )}
                    {email && (
                      <div className="py-2 text-xs opacity-70 truncate">{email}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="my-2 py-2.5 text-sm font-medium rounded-full bg-primary text-primary-foreground"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    search={{ mode: "signin" }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-3 text-sm font-medium text-foreground/90 hover:text-foreground"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          )}
        </header>

        <FreeTierBanner isPremium={isPremium} userId={userId} />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <section className="lg:col-span-12 relative">
            {/* Hero food collage backdrop */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-6 md:-top-10 -z-10 h-[360px] md:h-[440px] overflow-hidden"
            >
              {/* Soft warm radial wash */}
              <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_25%,oklch(0.965_0.05_55_/_0.9)_0%,transparent_70%)]" />
              {/* Decorative dish photos floated at the edges, not behind the text */}
              <div
                className="hidden md:block absolute -left-10 top-8 size-56 rounded-[2rem] bg-cover bg-center rotate-[-8deg] shadow-[var(--shadow-card)] opacity-90"
                style={{ backgroundImage: `url(${foodPasta})` }}
              />
              <div
                className="hidden md:block absolute -right-10 top-2 size-48 rounded-[2rem] bg-cover bg-center rotate-[6deg] shadow-[var(--shadow-card)] opacity-90"
                style={{ backgroundImage: `url(${foodSushi})` }}
              />
              <div
                className="hidden lg:block absolute left-16 bottom-4 size-40 rounded-[1.75rem] bg-cover bg-center rotate-[10deg] shadow-[var(--shadow-card)] opacity-85"
                style={{ backgroundImage: `url(${foodTacos})` }}
              />
              <div
                className="hidden lg:block absolute right-20 bottom-6 size-44 rounded-[1.75rem] bg-cover bg-center rotate-[-7deg] shadow-[var(--shadow-card)] opacity-85"
                style={{ backgroundImage: `url(${foodCurry})` }}
              />
              {/* Small floating accents on mobile */}
              <div
                className="md:hidden absolute -left-6 top-6 size-24 rounded-2xl bg-cover bg-center rotate-[-8deg] shadow-[var(--shadow-card)] opacity-90"
                style={{ backgroundImage: `url(${foodPasta})` }}
              />
              <div
                className="md:hidden absolute -right-6 top-2 size-20 rounded-2xl bg-cover bg-center rotate-[8deg] shadow-[var(--shadow-card)] opacity-90"
                style={{ backgroundImage: `url(${foodSushi})` }}
              />
              {/* Bottom fade so text sits cleanly */}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
            </div>

            <div className="max-w-3xl mx-auto text-center pt-2 pb-4 relative px-1">
              <div className="mb-4 sm:mb-5 flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-primary/25 bg-primary/10 px-3 py-1.5 font-display text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.28em] text-primary">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  <span className="whitespace-nowrap">AI-powered personal chef</span>
                </span>
              </div>
              <h1 className="font-display text-[2rem] leading-[1.02] sm:text-5xl md:text-7xl lg:text-[5.5rem] sm:leading-[0.95] font-semibold tracking-[-0.02em] text-foreground mb-4 sm:mb-5 [text-wrap:balance]">
                What&rsquo;s cooking{" "}
                <span className="italic font-normal text-primary">
                  in your{" "}
                  <span className="accent-underline text-foreground">head</span>
                </span>{" "}
                tonight?
              </h1>
              <div className="min-h-[3.5rem] sm:min-h-[3rem] md:min-h-[2.75rem] mb-5 sm:mb-6 flex items-center justify-center overflow-hidden px-2">
                <p
                  key={promptIndex}
                  className={`text-[15px] sm:text-base md:text-lg leading-snug sm:leading-relaxed text-muted-foreground max-w-xl [text-wrap:balance] ${
                    promptAnim === "in"
                      ? "animate-fade-down-in"
                      : "animate-fade-down-out"
                  }`}
                >
                  {dishPrompts[promptIndex]}
                </p>
              </div>
              <form
                onSubmit={onDishSubmit}
                role="search"
                aria-label="Search for a dish to cook"
                className="relative max-w-2xl mx-auto"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-1.5 rounded-[1.75rem] opacity-60 sm:opacity-70 blur-xl"
                  style={{ background: "var(--gradient-warm)" }}
                />
                <div className="relative rounded-[1.35rem] sm:rounded-[1.5rem] bg-card border-[1.5px] border-foreground/10 shadow-[var(--shadow-card)] p-1.5 flex flex-col sm:flex-row sm:items-center gap-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-[color:var(--ring)] transition-shadow">
                  <input
                    ref={dishInputRef}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    value={dishQuery}
                    onChange={(e) => setDishQuery(e.target.value)}
                    placeholder={`Try "${worldFoods[worldFoodIndex].food}"`}
                    aria-label="What dish do you want to cook?"
                    enterKeyHint="search"
                    className="flex-1 min-w-0 min-h-[48px] bg-transparent px-4 sm:px-5 py-3.5 sm:py-4 text-[16px] md:text-lg font-medium text-foreground rounded-[1rem] focus:outline-none placeholder:text-muted-foreground/70 truncate"
                  />
                  <button
                    type="submit"
                    disabled={dishLoading}
                    aria-label={dishLoading ? "Generating recipe" : "Cook this dish now"}
                    className="group relative inline-flex min-h-[52px] min-w-[52px] sm:min-h-[48px] items-center justify-center gap-2 rounded-[1.05rem] sm:rounded-[1.15rem] px-6 sm:px-7 py-3 sm:py-4 font-display font-semibold text-base text-primary-foreground shadow-[var(--shadow-warm)] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-[color:var(--ring)]"
                    style={{ background: "var(--gradient-warm)" }}
                  >
                    <span>{dishLoading ? "Thinking…" : "Cook this now"}</span>
                    <span
                      aria-hidden
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </button>
                </div>
                <p className="sr-only" role="status" aria-live="polite">
                  {dishLoading ? "Generating your recipe, please wait." : ""}
                </p>
              </form>
              <div
                className="mt-3 sm:mt-4 max-w-2xl mx-auto"
                role="group"
                aria-label="Dietary filters"
              >
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-1">
                    Diet:
                  </span>
                  {CORE_DIETARY.map((d) => {
                    const active = dietary.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setDietary(
                            active ? dietary.filter((x) => x !== d) : [...dietary, d],
                          )
                        }
                        className={`min-h-[36px] px-3 py-1.5 rounded-full border-[1.5px] text-xs sm:text-sm font-semibold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--ring)] ${
                          active
                            ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-warm)]"
                            : "bg-card text-foreground border-foreground/15 hover:border-primary/60"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                  {dietary.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDietary([])}
                      className="min-h-[36px] px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-muted-foreground underline hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {dietary.length > 0 && (
                  <p className="mt-2 text-center text-[11px] sm:text-xs text-muted-foreground">
                    Recipes will strictly honor: {dietary.join(" · ")}
                  </p>
                )}
              </div>
              <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-5 gap-y-1.5 text-[11px] sm:text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[var(--sage)]" />
                  Free — no signup
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-accent" />
                  500+ cuisines
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Ready in seconds
                </span>
              </div>
              <div className="mt-4 flex justify-center">
                <RecipeCounter userId={userId} isPremium={isPremium} isUnlimited={isUnlimited} />
              </div>
              <LiveActivityTicker />
              <IngredientTicker />
            </div>

            {dishLoading && (
              <div className="max-w-3xl mx-auto mt-10">
                <RecipeDetailSkeleton />
              </div>
            )}

              {dishResult && (
              <div className="max-w-3xl mx-auto mt-10 bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                    {dishResult.dishName}
                  </h2>
                  <ShareButton
                    isAuthenticated={!!email}
                    variant="pill"
                    recipe={{
                      title: dishResult.dishName,
                      cuisine: cuisine !== "Any / Surprise Me" ? cuisine : undefined,
                      usedIngredients: dishResult.ingredients,
                      missingIngredients: [],
                      steps: showRecipe ? dishResult.recipe.steps : [],
                      stepTimings: showRecipe
                        ? dishResult.recipe.stepTimings ?? undefined
                        : undefined,
                      tips: showRecipe ? dishResult.recipe.tips : undefined,
                      prepTimeMinutes: showRecipe
                        ? dishResult.recipe.prepTimeMinutes ?? undefined
                        : undefined,
                      cookTimeMinutes: showRecipe
                        ? dishResult.recipe.cookTimeMinutes
                        : undefined,
                      totalTimeMinutes: showRecipe
                        ? dishResult.recipe.totalTimeMinutes ?? undefined
                        : undefined,
                      serves: showRecipe
                        ? dishResult.recipe.serves ?? undefined
                        : undefined,
                    }}
                  />
                </div>
                {dishResult.dietary && dishResult.dietary.length > 0 && (
                  <div className="mb-4">
                    <DietBadgeRow tags={dishResult.dietary} selected={dietary} variant="light" />
                  </div>
                )}
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
                      <p className="font-medium text-sm text-white">
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
                          {dishResult.recipe.prepTimeMinutes != null && (
                            <span className="bg-card border border-border rounded-full px-2.5 py-0.5">Prep {dishResult.recipe.prepTimeMinutes}m</span>
                          )}
                          <span className="bg-card border border-border rounded-full px-2.5 py-0.5">Cook {dishResult.recipe.cookTimeMinutes}m</span>
                          {dishResult.recipe.totalTimeMinutes != null && (
                            <span className="bg-primary text-primary-foreground rounded-full px-2.5 py-0.5">Total {dishResult.recipe.totalTimeMinutes}m</span>
                          )}
                          {dishResult.recipe.serves && (
                            <span className="bg-card border border-border rounded-full px-2.5 py-0.5">Serves {dishResult.recipe.serves}</span>
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <RecipeTimers
                          totalMinutes={
                            dishResult.recipe.totalTimeMinutes ??
                            dishResult.recipe.cookTimeMinutes
                          }
                        />
                      </div>
                      <ol className="space-y-2.5">
                        {dishResult.recipe.steps.map((s, i) => {
                          const t = dishResult.recipe.stepTimings?.[i];
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
                      {dishResult.recipe.tips.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-1.5">Tips</p>
                          <ul className="space-y-1">
                            {dishResult.recipe.tips.map((t, i) => (
                              <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {dishResult.recipe.nutrition?.perServing && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                            Nutrition · per serving
                            {dishResult.recipe.nutrition.servings
                              ? ` (makes ${dishResult.recipe.nutrition.servings})`
                              : ""}
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                            {[
                              { label: "kcal", value: dishResult.recipe.nutrition.perServing.calories, suffix: "" },
                              { label: "Protein", value: dishResult.recipe.nutrition.perServing.proteinG, suffix: "g" },
                              { label: "Carbs", value: dishResult.recipe.nutrition.perServing.carbsG, suffix: "g" },
                              { label: "Fat", value: dishResult.recipe.nutrition.perServing.fatG, suffix: "g" },
                              { label: "Sugar", value: dishResult.recipe.nutrition.perServing.sugarG, suffix: "g" },
                              { label: "Fiber", value: dishResult.recipe.nutrition.perServing.fiberG, suffix: "g" },
                            ].map((m) => (
                              <div key={m.label} className="bg-card border border-border rounded-xl py-2">
                                <div className="font-display font-semibold text-sm leading-none">
                                  {m.value}
                                  {m.suffix}
                                </div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                                  {m.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
              )}
          </section>

          <section className="lg:col-span-12">
            <SectionHeader
              eyebrow="Stuck on dinner?"
              title="Pick a country — your AI chef takes it from there."
              subtitle="50+ cuisines. Tap one and we'll cook it from what's in your fridge."
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
              {loading && !pantryMode && (
                <button
                  type="button"
                  onClick={onCancelGeneration}
                  className="mt-2 w-full bg-card border border-border text-foreground py-3 rounded-2xl font-display font-semibold text-sm hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
              )}
              <div className="mt-3 flex justify-center">
                <RecipeCounter userId={userId} isPremium={isPremium} isUnlimited={isUnlimited} />
              </div>
            </div>

            {/* Inline results for the cuisine flow — sits right under the button */}
            {!pantryMode && (loading || (recipes && recipes.length > 0)) && (
            <div ref={cuisineResultsRef} className="mt-10 space-y-5 scroll-mt-32">
              {(loading || (recipes && recipes.length > 0)) && (
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
                    {loading ? "Cooking up 10 recipes…" : `${recipes!.length} recipes found`}
                  </h3>
                  {recipes && (
                    <span className="text-xs font-medium bg-card border border-border rounded-full px-3 py-1">
                      AI · {cuisine.split(" /")[0]}
                    </span>
                  )}
                </div>
              )}

              {loading && <RecipeSkeleton count={3} />}

              {!loading && recipes && recipes.map((r, i) => (
                <RecipeCard
                  key={`cuisine-${r.title}-${i}`}
                  recipe={r}
                  index={i}
                  saved={isSaved(r.title)}
                  onToggleSave={() => toggleSave(r)}
                  dietary={dietary}
                  showMissing={false}
                  isAuthenticated={!!email}
                  pantry={ingredients}
                  onRecipeUpdate={(next) =>
                    setRecipes((prev) =>
                      prev ? prev.map((p, idx) => (idx === i ? next : p)) : prev,
                    )
                  }
                />
              ))}

              {!loading && recipes && recipes.length > 0 && (
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                  className="w-full bg-card border border-border text-foreground py-4 rounded-2xl font-display font-semibold text-sm hover:bg-secondary transition-all disabled:opacity-60"
                >
                  {loadingMore ? "Cooking up more…" : "Show more recipes"}
                </button>
              )}
            </div>
            )}
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
            <HowItWorksStrip />
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
                counterSlot={<RecipeCounter userId={userId} isPremium={isPremium} isUnlimited={isUnlimited} />}
                kidFriendly={kidFriendly}
                onKidFriendly={setKidFriendly}
                showNutrition={showNutrition}
                onShowNutrition={setShowNutrition}
              />
            </div>
          </section>

          <section className="lg:col-span-7 space-y-5">
            {!pantryMode && (!recipes || recipes.length === 0) && !loading && (
              <PopularCombos
                onPick={(combo) => {
                  setIngredients(combo);
                  requestAnimationFrame(() => {
                    pantryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  });
                }}
              />
            )}
            {pantryMode && (loading || (recipes && recipes.length > 0)) && (
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
                  {loading ? "Searching…" : `${recipes!.length} recipes found`}
                </h3>
                {recipes && (
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

            {pantryMode && loading && <RecipeSkeleton count={3} />}

            {pantryMode && !loading &&
              recipes &&
              recipes.map((r, i) => (
                <RecipeCard
                  key={`${r.title}-${i}`}
                  recipe={r}
                  index={i}
                  saved={isSaved(r.title)}
                  onToggleSave={() => toggleSave(r)}
                  dietary={dietary}
                  showMissing={pantryMode && ingredients.length > 0}
                  isAuthenticated={!!email}
                  pantry={ingredients}
                  onRecipeUpdate={(next) =>
                    setRecipes((prev) =>
                      prev ? prev.map((p, idx) => (idx === i ? next : p)) : prev,
                    )
                  }
                />
              ))}

            {pantryMode && !loading && recipes && recipes.length > 0 && (
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

        <PremiumRecipesStrip />

        <section className="max-w-7xl mx-auto mt-12 md:mt-16 px-4 md:px-0">
          <ChefCTA />
        </section>

        <section className="mt-12 md:mt-16">
          <div className="-mx-4 md:-mx-8 px-4 md:px-8 py-10 md:py-14 bg-[var(--surface-cream)] rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-16 -left-16 size-64 rounded-full bg-[var(--accent-gold)]/20 blur-3xl"
            />
            <div className="max-w-7xl mx-auto relative">
              <SectionHeader
                eyebrow="Loved by home cooks"
                title="What people are saying"
              />
              <Testimonials />
            </div>
          </div>
        </section>

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
      <SiteFooter />
    </>
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


function PopularCombos({ onPick }: { onPick: (combo: string[]) => void }) {
  const tints = [
    "bg-amber-50 text-amber-600",
    "bg-red-50 text-red-500",
    "bg-emerald-50 text-emerald-600",
    "bg-sky-50 text-sky-600",
    "bg-fuchsia-50 text-fuchsia-600",
    "bg-orange-50 text-orange-600",
  ];
  // Rotate the 6 visible tiles every ~10 hours from the 500+ combo pool.
  // Deterministic per time bucket → all visitors see the same set within a window.
  const ROTATION_HOURS = 10;
  const visible = useMemo(() => {
    const bucket = Math.floor(Date.now() / (ROTATION_HOURS * 3600 * 1000));
    // mulberry32 seeded PRNG
    let s = (bucket * 2654435761) >>> 0;
    const rand = () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pool = ALL_POPULAR_COMBOS.slice();
    // Fisher–Yates partial shuffle for first 6
    for (let i = 0; i < 6 && i < pool.length; i++) {
      const j = i + Math.floor(rand() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
  }, []);
  return (
    <div className="p-1">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-1 w-8 bg-accent rounded-full" />
          <p className="font-display text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
            Chef's Picks
          </p>
        </div>
        <h3 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight leading-none text-foreground">
          Popular pantry{" "}
          <span
            className="text-accent italic normal-case tracking-normal"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}
          >
            combos
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {visible.map((c, i) => {
          const tint = tints[i % tints.length];
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => onPick(c.ingredients)}
              className="group text-left bg-card p-4 md:p-5 rounded-[2rem] border border-border/60 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.08)] flex flex-col items-start transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-18px_rgba(0,0,0,0.12)] active:scale-[0.98]"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl ${tint}`}
                aria-hidden
              >
                <IngredientIcon name={c.ingredients[0] ?? c.label} className="text-2xl" />
              </div>
              <h4 className="font-display text-base md:text-lg font-black uppercase tracking-tight leading-tight mb-1.5 text-foreground">
                {c.label}
              </h4>
              <p
                className="text-xs text-muted-foreground italic leading-snug"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {c.ingredients.slice(0, 3).join(", ")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TICKER_ITEMS = [
  "avocado", "tomato", "garlic", "lemon", "chili",
  "spinach", "onion", "carrot", "mushroom", "basil",
  "cucumber", "pepper", "egg", "cheese", "bread",
  "chicken", "fish", "rice", "pasta", "coconut",
];

function IngredientTicker() {
  const loop = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="mt-7 marquee-row marquee-mask overflow-hidden">
      <div className="marquee-track marquee-left gap-2">
        {loop.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="shrink-0 px-4 py-1.5 rounded-full bg-card/80 backdrop-blur border border-border text-xs md:text-sm text-foreground/80 font-medium"
          >
            <IngredientIcon name={item} className="mr-1" />{item}
          </span>
        ))}
      </div>
    </div>
  );
}

