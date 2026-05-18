import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CORE_DIETARY, EXTRA_DIETARY, DEFAULT_DIETARY, DEFAULT_CUISINES } from "@/lib/taxonomy";
import { getUserPreferences, saveUserPreferences } from "@/lib/user-preferences.functions";

type Props = {
  dietary: string[];
  cuisine: string;
  onDietary: (next: string[]) => void;
  onCuisine: (next: string) => void;
  onPantryPick?: (next: string) => void;
  isAuthenticated: boolean;
};

export function FilterPanel({ dietary, cuisine, onDietary, onCuisine, onPantryPick, isAuthenticated }: Props) {
  const [customDietary, setCustomDietary] = useState<string[]>([]);
  const [customCuisines, setCustomCuisines] = useState<string[]>([]);
  const [newDietary, setNewDietary] = useState("");
  const [newCuisine, setNewCuisine] = useState("");
  const [showMoreDietary, setShowMoreDietary] = useState(false);

  const fetchPrefs = useServerFn(getUserPreferences);
  const savePrefs = useServerFn(saveUserPreferences);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPrefs()
      .then((p) => {
        setCustomDietary(p.custom_dietary);
        setCustomCuisines(p.custom_cuisines);
      })
      .catch(() => {});
  }, [isAuthenticated, fetchPrefs]);

  const visibleDefaults = showMoreDietary
    ? [...CORE_DIETARY, ...EXTRA_DIETARY]
    : [...CORE_DIETARY];
  const allDietary = [...visibleDefaults, ...customDietary];
  const sortedDefaults = [...DEFAULT_CUISINES]
    .filter((c) => c !== "Any / Surprise Me")
    .sort((a, b) => a.localeCompare(b));
  const sortedCustom = [...customCuisines].sort((a, b) => a.localeCompare(b));
  const allCuisines = ["Any / Surprise Me", ...sortedDefaults, ...sortedCustom];

  const toggle = (d: string) => {
    onDietary(dietary.includes(d) ? dietary.filter((x) => x !== d) : [...dietary, d]);
  };

  const addDietary = async () => {
    const v = newDietary.trim();
    if (!v || customDietary.includes(v) || (DEFAULT_DIETARY as readonly string[]).includes(v)) {
      setNewDietary("");
      return;
    }
    const next = [...customDietary, v];
    setCustomDietary(next);
    setNewDietary("");
    try {
      await savePrefs({ data: { custom_dietary: next, custom_cuisines: customCuisines } });
    } catch {
      toast.error("Couldn't save");
    }
  };

  const addCuisine = async () => {
    const v = newCuisine.trim();
    if (!v || customCuisines.includes(v) || DEFAULT_CUISINES.includes(v)) {
      setNewCuisine("");
      return;
    }
    const next = [...customCuisines, v];
    setCustomCuisines(next);
    setNewCuisine("");
    try {
      await savePrefs({ data: { custom_dietary: customDietary, custom_cuisines: next } });
    } catch {
      toast.error("Couldn't save");
    }
  };

  const removeCustomDietary = async (v: string) => {
    const next = customDietary.filter((x) => x !== v);
    setCustomDietary(next);
    if (dietary.includes(v)) onDietary(dietary.filter((d) => d !== v));
    try {
      await savePrefs({ data: { custom_dietary: next, custom_cuisines: customCuisines } });
    } catch {}
  };

  const removeCustomCuisine = async (v: string) => {
    const next = customCuisines.filter((x) => x !== v);
    setCustomCuisines(next);
    if (cuisine === v) onCuisine("Any / Surprise Me");
    try {
      await savePrefs({ data: { custom_dietary: customDietary, custom_cuisines: next } });
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="font-bold text-xs uppercase tracking-wider mb-2 opacity-60">
          Dietary
          {!isAuthenticated && (
            <span className="normal-case tracking-normal font-medium opacity-90">
              {" "}(
              <Link
                to="/login"
                search={{ mode: "signin" }}
                className="underline text-paprika font-black cursor-pointer"
              >
                Sign in
              </Link>{" "}
              to add your own dietary tags)
            </span>
          )}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {allDietary.map((d) => {
            const active = dietary.includes(d);
            const isCustom = customDietary.includes(d);
            return (
              <div key={d} className="relative">
                <button
                  type="button"
                  onClick={() => toggle(d)}
                  className={`w-full border-2 border-border py-2 px-2 rounded-xl font-black text-[11px] uppercase transition-all ${
                    active
                      ? "bg-paprika text-white shadow-[3px_3px_0px_0px_var(--border)]"
                      : "bg-white hover:bg-turmeric/10"
                  }`}
                >
                  {d}
                </button>
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => removeCustomDietary(d)}
                    aria-label={`Remove ${d}`}
                    className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-white border-2 border-border text-[10px] font-black flex items-center justify-center cursor-pointer hover:bg-paprika hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowMoreDietary((v) => !v)}
          className="mt-2 text-[11px] font-black uppercase tracking-wide underline opacity-70 hover:opacity-100"
        >
          {showMoreDietary ? "− Show less" : `+ ${EXTRA_DIETARY.length} more`}
        </button>
        {isAuthenticated ? (
          <div className="mt-2 flex gap-2">
            <input
              value={newDietary}
              onChange={(e) => setNewDietary(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDietary())}
              placeholder="Add your own…"
              maxLength={40}
              className="flex-1 border-2 border-border rounded-lg px-2 py-1.5 text-xs font-medium"
            />
            <button
              type="button"
              onClick={addDietary}
              className="bg-turmeric border-2 border-border px-3 rounded-lg font-black text-xs uppercase cursor-pointer"
            >
              + Add
            </button>
          </div>
        ) : null}
      </div>

      <div className="border-t-2 border-dashed border-border/30 pt-4">
        <p className="font-bold text-xs uppercase tracking-wider mb-2 opacity-60">
          Surprise me
        </p>
        <button
          type="button"
          onClick={() => {
            const pool = allCuisines.filter((c) => c !== "Any / Surprise Me");
            if (pool.length === 0) return;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            (onPantryPick ?? onCuisine)(pick);
            toast.success(`Pantry cuisine: ${pick}`);
          }}
          className="w-full bg-cardamom text-white border-2 border-border py-2.5 rounded-xl font-black text-xs uppercase tracking-wide shadow-[3px_3px_0px_0px_var(--border)] active:translate-y-0.5 active:shadow-none transition-all"
        >
          Find my Pantry cuisine
        </button>
      </div>

      <div>
        <p className="font-bold text-xs uppercase tracking-wider mb-2 opacity-60">Global Cuisine Vibe</p>
        <select
          value={cuisine}
          onChange={(e) => onCuisine(e.target.value)}
          className="w-full border-2 border-border p-3 rounded-xl font-bold bg-white"
        >
          {allCuisines.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {isAuthenticated && (
          <>
            {customCuisines.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {customCuisines.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 bg-white border-2 border-border rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCustomCuisine(c)}
                      aria-label={`Remove ${c}`}
                      className="size-3.5 rounded-full bg-paprika text-white flex items-center justify-center text-[9px] cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <input
                value={newCuisine}
                onChange={(e) => setNewCuisine(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCuisine())}
                placeholder="Add a cuisine…"
                maxLength={40}
                className="flex-1 border-2 border-border rounded-lg px-2 py-1.5 text-xs font-medium"
              />
              <button
                type="button"
                onClick={addCuisine}
                className="bg-turmeric border-2 border-border px-3 rounded-lg font-black text-xs uppercase cursor-pointer"
              >
                + Add
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
