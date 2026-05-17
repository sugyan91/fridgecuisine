import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { IngredientInput } from "@/components/fridge/IngredientInput";
import { FilterPanel } from "@/components/fridge/FilterPanel";
import { RecipeCard } from "@/components/fridge/RecipeCard";
import { SavedDrawer } from "@/components/fridge/SavedDrawer";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { generateRecipes, type Recipe } from "@/lib/recipes.functions";

export const Route = createFileRoute("/_authenticated/")({
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
        <header className="max-w-6xl mx-auto mb-8 md:mb-12 flex justify-between items-end gap-4">
          <div>
            <h1 className="font-display text-5xl md:text-8xl uppercase tracking-tighter text-paprika leading-none">
              Fridge
              <br />
              Chef
            </h1>
            <p className="font-black uppercase tracking-widest text-[10px] md:text-sm mt-2 ml-1">
              Global Kitchen AI
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="hidden md:block bg-turmeric border-2 border-border p-4 rounded-2xl rotate-3 shadow-[6px_6px_0px_0px_var(--border)] hover:rotate-0 transition-transform"
          >
            <span className="font-black text-xl">SAVED: {saved.length}</span>
          </button>
        </header>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
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

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open saved recipes"
          className="md:hidden fixed bottom-6 right-6 size-16 bg-turmeric border-4 border-border rounded-full shadow-[4px_4px_0px_0px_var(--border)] grid place-items-center z-40"
        >
          <span className="font-black text-xl">{saved.length}</span>
        </button>
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
