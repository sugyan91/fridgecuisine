import { useState, useRef, type KeyboardEvent } from "react";

const SUGGESTIONS = [
  "Rice",
  "Eggs",
  "Onion",
  "Tomato",
  "Spinach",
  "Paneer",
  "Yogurt",
  "Potato",
  "Pasta",
  "Chicken",
  "Bell Pepper",
  "Mushroom",
  "Cheese",
  "Avocado",
  "Lemon",
  "Coconut Milk",
  "Soy Sauce",
  "Truffle Oil",
  "Parmesan",
  "Prosciutto",
  "Burrata",
  "Sun-Dried Tomatoes",
  "Basil Pesto",
  "Gnocchi",
  "Crème Fraîche",
  "Brie",
  "Dijon Mustard",
  "Tarragon",
  "Puff Pastry",
  "Chorizo",
  "Cotija",
  "Chipotle in Adobo",
  "Cilantro",
  "Lime",
  "Black Beans",
  "Corn Tortillas",
  "Queso Fresco",
  "Miso Paste",
  "Sriracha",
  "Kimchi",
  "Halloumi",
  "Saffron",
  "Capers",
  "Anchovies",
  "Smoked Paprika",
];

const ROTATIONS = ["-rotate-2", "-rotate-1", "rotate-1", "rotate-2"];
const COLORS = [
  "bg-cardamom text-white",
  "bg-turmeric",
  "bg-saffron text-white",
  "bg-paprika text-white",
];

type Props = {
  ingredients: string[];
  onChange: (next: string[]) => void;
};

export function IngredientInput({ ingredients, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const v = raw.trim().slice(0, 40);
    if (!v) return;
    if (ingredients.some((i) => i.toLowerCase() === v.toLowerCase())) return;
    if (ingredients.length >= 30) return;
    onChange([...ingredients, v]);
    setDraft("");
  };

  const remove = (v: string) => {
    onChange(ingredients.filter((i) => i !== v));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && ingredients.length) {
      onChange(ingredients.slice(0, -1));
    }
  };

  const remaining = SUGGESTIONS.filter(
    (s) => !ingredients.some((i) => i.toLowerCase() === s.toLowerCase())
  ).slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[2.5rem]">
        {ingredients.map((ing, idx) => (
          <button
            key={ing}
            type="button"
            onClick={() => remove(ing)}
            className={`${COLORS[idx % COLORS.length]} ${ROTATIONS[idx % ROTATIONS.length]} px-3 py-1.5 rounded-full border-2 border-border font-bold text-sm flex items-center gap-2 shadow-[2px_2px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-transform`}
          >
            {ing} <span aria-hidden>×</span>
          </button>
        ))}
        {ingredients.length === 0 && (
          <span className="text-sm text-muted-foreground italic">
            Type below or tap a suggestion →
          </span>
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-black uppercase tracking-wide text-paprika hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => draft && add(draft)}
        placeholder="Add ingredient + Enter"
        maxLength={40}
        className="w-full border-2 border-border bg-white px-4 py-3 rounded-xl font-bold text-sm outline-none focus:shadow-[3px_3px_0px_0px_var(--border)] transition-shadow"
      />

      {remaining.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-xs font-bold px-2 py-1 rounded-full border border-border/40 bg-white hover:bg-turmeric/20 transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
