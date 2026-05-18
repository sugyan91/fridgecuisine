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
import { useLocalStorage } from "@/hooks/use-local-storage";
import { generateRecipes, type Receipe } from "@/lib/receipes.functions";
import { getDishHelper, type DishHelperResult } from "@/lib/dish-helper.functions";
import { supabase } from "@/integrations/supabase/client";
import { worldFoods } from "@/lib/world-foods";
import dalImg from "@/assets/recipe-dal.jpg";
import saagImg from "@/assets/recipe-saag.jpg";
import riceImg from "@/assets/recipe-rice.jpg";
import paneerImg from "@/assets/recipe-paneer.jpg";
import momoImg from "@/assets/recipe-momo.jpg";
import chanaImg from "@/assets/recipe-chana.jpg";
import pastaImg from "@/assets/food-pasta.jpg";
import sushiImg from "@/assets/food-sushi.jpg";
import tacosImg from "@/assets/food-tacos.jpg";
import curryImg from "@/assets/food-curry.jpg";
import burgerImg from "@/assets/food-burger.jpg";
import pizzaImg from "@/assets/food-pizza.jpg";
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
          "Type a dish or your fridge ingredients and FridgeCuisine's AI returns ingredients and step-by-step receipes from any global cuisine.",
      },
      { property: "og:title", content: "FridgeCuisine — Global AI Kitchen" },
      {
        property: "og:description",
        content:
          "Free AI kitchen helper. Get ingredients and receipes for any dish, or cook from what you already have.",
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
  const [saved, setSaved] = useLocalStorage<Receipe[]>("fridge-chef-saved", []);

  const generate = useServerFn(generateRecipes);
  const fetchDish = useServerFn(getDishHelper);

  const [dishQuery, setDishQuery] = useState("");
  const [dishLoading, setDishLoading] = useState(false);
  const [dishResult, setDishResult] = useState<
    Extract<DishHelperResult, { ok: true }>["data"] | null
  >(null);
  const [showRecipe, setShowRecipe] = useState(false);

  const dishPrompts = [
    "See something that made you hungry? Tell me the dish — I'll give you the ingredients and receipe.",
    "Caught drooling? Name the food and I'll spill the ingredients and receipe.",
    "Food crush? Tell me what it was and I'll hand over the ingredients and receipe.",
    "That dish got your attention, huh? Drop the name — I've got the receipe and ingredients.",
    "If your stomach just said 'yes please,' tell me the dish and I'll generate the receipe and ingredients.",
    "Name the dish you can't stop thinking about — I'll recreate it with ingredients and receipe.",
    "Saw something delicious online? Tell me what it is and I'll break down the receipe and ingredients.",
    "From craving to cooking — tell me the dish and I'll give you the ingredients and receipe.",
    "That food looked dangerously good. Want the ingredients and receipe?",
    "Tell me what made you hungry — I'll turn it into a receipe with ingredients.",
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
  const headerRef = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
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
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onPantryGenerate = async () => {
    setPantryMode(true);
    setCuisine("Any / Surprise Me");
    setLoading(true);
    setRecipes(null);
    try {
      const res = await generate({
        data: { ingredients, dietary, cuisine: "Any / Surprise Me", exclude: [] },
      });
      if (!res.ok) toast.error(res.error);
      else setRecipes(res.receipes);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onLoadMore = async () => {
    if (!receipes || ingredients.length === 0) return;
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
        setRecipes([...receipes, ...fresh]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reach the kitchen. Try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const isSaved = (title: string) => saved.some((s) => s.title === title);
  const toggleSave = (receipe: Receipe) => {
    if (!email) {
      toast("Sign in to save receipes", {
        description: "Create a free account to keep receipes across devices.",
        action: {
          label: "Sign in",
          onClick: () => navigate({ to: "/login" }),
        },
      });
      return;
    }
    if (isSaved(receipe.title)) {
      setSaved(saved.filter((s) => s.title !== receipe.title));
      toast("Removed from saved");
    } else {
      setSaved([receipe, ...saved]);
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

      <main
        className="min-h-screen bg-background text-foreground px-4 pb-8 md:px-8"
        style={{ paddingTop: `${headerOffset}px` }}
      >
        <div
          ref={navRef}
          className="fixed top-3 right-3 z-50 flex items-center gap-1.5 md:gap-2 bg-white border-2 border-border rounded-full pl-2 md:pl-3 pr-1 py-1 shadow-[3px_3px_0px_0px_var(--border)] max-w-[calc(100vw-1.5rem)]"
        >
          <Link
            to="/community"
            className="text-[10px] md:text-[11px] font-black uppercase tracking-wide px-1.5 md:px-2"
          >
            Community
          </Link>
          {email ? (
            <>
              <Link
                to="/my-recipes"
                className="text-[11px] font-black uppercase tracking-wide px-2 hidden sm:inline"
              >
                My Receipes
              </Link>
              <Link
                to="/community/new"
                className="text-[11px] font-black uppercase tracking-wide bg-turmeric px-2.5 py-1.5 rounded-full"
              >
                + Share
              </Link>
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
                className="text-[11px] md:text-sm font-black uppercase tracking-wide bg-paprika text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-[2px_2px_0px_0px_var(--border)] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_var(--border)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_var(--border)] transition-all"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                search={{ mode: "signup" }}
                className="text-[10px] md:text-[11px] font-black uppercase tracking-wide bg-turmeric px-2.5 py-1.5 md:px-3 md:py-2 rounded-full border-2 border-border"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <header className="fixed top-3 left-3 z-50 flex items-center gap-2 bg-white border-2 border-border rounded-2xl pl-1.5 pr-3 py-1 shadow-[3px_3px_0px_0px_var(--border)] max-w-[calc(100vw-1.5rem)]">
          <img
            src={logoImg}
            alt="Fridge Cuisine"
            className="h-9 md:h-11 w-auto rounded-lg border-2 border-border shadow-[1px_1px_0px_0px_var(--border)] bg-background"
          />
          <div>
            <h1 className="font-display tracking-tight text-paprika leading-none text-lg md:text-xl text-left lowercase">
              fridge <span className="text-foreground">cuisine</span>
              <span className="text-turmeric">.</span>
            </h1>
            <p className="font-black uppercase tracking-widest text-[7px] md:text-[8px] opacity-70">
              Global AI Kitchen
            </p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <section className="lg:col-span-12 animate-pop">
            <div className="bg-white border-4 border-border rounded-[32px] p-5 md:p-6 shadow-[8px_8px_0px_0px_var(--border)]">
              <h2 className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Dish to receipe
              </h2>
              <div className="min-h-[3.5rem] md:min-h-[3rem] mb-4 flex items-start overflow-hidden">
                <p
                  key={promptIndex}
                  className={`font-display text-lg md:text-2xl leading-snug text-foreground ${
                    promptAnim === "in"
                      ? "animate-fade-down-in"
                      : "animate-fade-down-out"
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
                  placeholder={`eg: ${worldFoods[worldFoodIndex].food} from ${worldFoods[worldFoodIndex].country}`}
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
                        Do you want the receipe as well?
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
                          Receipe
                        </p>
                        <span className="font-mono text-xs bg-white border border-border px-2 py-0.5">
                          {dishResult.receipe.cookTimeMinutes} min
                          {dishResult.receipe.serves ? ` · serves ${dishResult.receipe.serves}` : ""}
                        </span>
                      </div>
                      <ol className="space-y-2 list-decimal list-inside">
                        {dishResult.receipe.steps.map((s, i) => (
                          <li key={i} className="text-sm leading-relaxed">
                            {s}
                          </li>
                        ))}
                      </ol>
                      {dishResult.receipe.tips.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-dashed border-border/40">
                          <p className="font-black text-xs uppercase mb-1">Tips</p>
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
            </div>
          </section>

          <section className="lg:col-span-5 animate-pop">
            <div className="bg-white border-4 border-border rounded-[32px] p-5 md:p-6 shadow-[8px_8px_0px_0px_var(--border)] lg:sticky lg:top-6">
              <h2 className="font-black text-xl md:text-2xl uppercase mb-1">
                What's in your Pantry
              </h2>
              <p className="text-[11px] text-muted-foreground mb-4">
                Add what food items you have in your pantry below
              </p>

              <IngredientInput
                ingredients={ingredients}
                onChange={setIngredients}
              />

              <div className="my-5 border-t-2 border-dashed border-border/30" />

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
              />

              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="mt-5 w-full bg-turmeric border-4 border-border py-3 rounded-2xl font-black text-xs uppercase tracking-wide shadow-[0px_6px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && !pantryMode
                  ? cuisine && cuisine !== "Any / Surprise Me"
                    ? `Travelling to ${cuisineToCountry(cuisine)} for surprise receipe. Please wait…`
                    : "Travelling around the globe to find a perfect receipe for you"
                  : "Show me the cuisine"}
              </button>
            </div>
          </section>

          <section className="lg:col-span-7 space-y-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-3xl md:text-4xl uppercase">
                {loading
                  ? "Searching…"
                  : receipes
                    ? `${receipes.length} Receipes Found`
                    : "Ready when you are"}
              </h3>
              {receipes && (
                <span className="font-mono text-xs font-bold bg-white border border-border px-2 py-0.5">
                  {pantryMode
                    ? dietary.length > 0
                      ? dietary.join(" · ")
                      : "Pantry"
                    : `AI · ${cuisine.split(" /")[0]}`}
                </span>
              )}
            </div>

            {loading && <LoadingSkeleton />}

            {!loading && !receipes && <EmptyState />}

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
                className="w-full bg-white border-4 border-border py-3 rounded-2xl font-black text-xs uppercase tracking-wide shadow-[0px_5px_0px_0px_var(--border)] active:shadow-[0px_2px_0px_0px_var(--border)] active:translate-y-1 transition-all disabled:opacity-60"
              >
                {loadingMore ? "Cooking up more…" : "Show more receipes"}
              </button>
            )}
          </section>
        </div>

        <CommunityStrip isAuthenticated={!!email} />

        {email && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open saved receipes"
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
  const foodImages = [
    dalImg, saagImg, riceImg, paneerImg, momoImg, chanaImg,
    pastaImg, sushiImg, tacosImg, curryImg, burgerImg, pizzaImg,
  ];
  return (
    <div className="bg-white border-4 border-dashed border-border/40 rounded-[32px] p-8 text-center">
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5 max-w-md mx-auto">
        {foodImages.map((src, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl overflow-hidden border-2 border-border shadow-[2px_2px_0px_0px_var(--border)]"
          >
            <img
              src={src}
              alt="Food inspiration"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      <p className="font-black text-lg uppercase">
        Your global cuisine will be displayed here.
      </p>
    </div>
  );
}
