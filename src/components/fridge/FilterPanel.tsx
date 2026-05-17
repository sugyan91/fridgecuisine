const DIETARY = ["Vegetarian", "Halal", "High Protein", "Quick Meal"] as const;
const CUISINES = [
  "Any / Surprise Me",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Thai",
  "Indian",
  "Mediterranean",
  "French",
  "Korean",
  "Middle Eastern",
  "African",
  "Latin American",
  "Caribbean",
  "Eastern European",
  "Nepali / Himalayan",
  "South Asian Fusion",
];

type Props = {
  dietary: string[];
  cuisine: string;
  onDietary: (next: string[]) => void;
  onCuisine: (next: string) => void;
};

export function FilterPanel({ dietary, cuisine, onDietary, onCuisine }: Props) {
  const toggle = (d: string) => {
    onDietary(
      dietary.includes(d) ? dietary.filter((x) => x !== d) : [...dietary, d]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-bold text-xs uppercase tracking-wider mb-2 opacity-60">
          Dietary
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DIETARY.map((d) => {
            const active = dietary.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggle(d)}
                className={`border-2 border-border py-2 px-2 rounded-xl font-black text-xs uppercase transition-all ${
                  active
                    ? "bg-paprika text-white shadow-[3px_3px_0px_0px_var(--border)]"
                    : "bg-white hover:bg-turmeric/10"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="font-bold text-xs uppercase tracking-wider mb-2 opacity-60">
          Cuisine Vibe
        </p>
        <select
          value={cuisine}
          onChange={(e) => onCuisine(e.target.value)}
          className="w-full border-2 border-border p-3 rounded-xl font-bold bg-white"
        >
          {CUISINES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
