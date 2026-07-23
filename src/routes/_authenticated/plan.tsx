import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { addDays, format, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import {
  addPlanEntry,
  aggregateShoppingList,
  listWeek,
  movePlanEntry,
  removePlanEntry,
  type MealPlanEntry,
  type MealSlot,
} from "@/lib/meal-plan.functions";
import { listSavedRecipes, type SavedRecipeRow } from "@/lib/saved-recipes.functions";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "Meal Plan — FridgeCuisine" },
      {
        name: "description",
        content: "Plan your week of meals and generate a shopping list.",
      },
    ],
  }),
  component: PlanPage,
});

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function PlanPage() {
  const load = useServerFn(listWeek);
  const add = useServerFn(addPlanEntry);
  const remove = useServerFn(removePlanEntry);
  const move = useServerFn(movePlanEntry);
  const loadSaved = useServerFn(listSavedRecipes);

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [saved, setSaved] = useState<SavedRecipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [showList, setShowList] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const startISO = format(weekStart, "yyyy-MM-dd");
  const endISO = format(addDays(weekStart, 6), "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      load({ data: { startDate: startISO, endDate: endISO } }),
      loadSaved(),
    ])
      .then(([w, s]) => {
        if (cancelled) return;
        setEntries(w.entries);
        setSaved(s.rows);
      })
      .catch(() => toast.error("Couldn't load your plan."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [startISO, endISO, load, loadSaved]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, MealPlanEntry[]>();
    for (const e of entries) {
      const list = map.get(e.plan_date) ?? [];
      list.push(e);
      map.set(e.plan_date, list);
    }
    return map;
  }, [entries]);

  const shopping = useMemo(() => aggregateShoppingList(entries), [entries]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggleCheck = (n: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const onAdd = async (savedRecipeId: string) => {
    if (!picker) return;
    try {
      await add({
        data: {
          plan_date: picker.date,
          meal_slot: picker.slot,
          saved_recipe_id: savedRecipeId,
        },
      });
      const w = await load({ data: { startDate: startISO, endDate: endISO } });
      setEntries(w.entries);
      setPicker(null);
      toast.success("Added to your plan");
    } catch {
      toast.error("Couldn't add.");
    }
  };

  const onRemove = async (id: string) => {
    try {
      await remove({ data: { id } });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("Couldn't remove.");
    }
  };

  const onDropEntry = async (id: string, date: string, slot: MealSlot) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    if (entry.plan_date === date && entry.meal_slot === slot) return;
    // Optimistic
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, plan_date: date, meal_slot: slot } : e,
      ),
    );
    try {
      await move({ data: { id, plan_date: date, meal_slot: slot } });
    } catch {
      toast.error("Couldn't move.");
      // Reload to sync state
      const w = await load({ data: { startDate: startISO, endDate: endISO } });
      setEntries(w.entries);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="font-black text-xs uppercase opacity-60">← Home</Link>
          <Link to="/list" className="font-black text-xs uppercase opacity-60">
            Shopping list →
          </Link>
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-paprika mb-2 uppercase">
          Meal Plan
        </h1>
        <p className="opacity-70 text-sm mb-6">
          Plan your week and get a shopping list from what you've slotted in.
        </p>

        <div className="flex items-center justify-between mb-6 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              className="p-2 bg-white border-2 border-border rounded-full"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="font-black uppercase text-xs tracking-widest">
              {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </p>
            <button
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              className="p-2 bg-white border-2 border-border rounded-full"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="ml-1 text-[11px] font-black uppercase opacity-60"
            >
              This week
            </button>
          </div>
          <button
            onClick={() => setShowList((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-turmeric border-2 border-border rounded-full font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_var(--border)]"
          >
            <ShoppingBasket className="w-4 h-4" />
            {showList ? "Hide" : "Shopping list"} ({shopping.length})
          </button>
        </div>

        {loading ? (
          <p className="opacity-60">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {days.map((d) => {
              const iso = format(d, "yyyy-MM-dd");
              const dayEntries = byDay.get(iso) ?? [];
              return (
                <div
                  key={iso}
                  className="bg-white border-2 border-border rounded-2xl p-3 flex flex-col"
                >
                  <p className="font-black text-[11px] uppercase tracking-widest opacity-60">
                    {format(d, "EEE")}
                  </p>
                  <p className="font-display text-2xl text-paprika mb-3 leading-none">
                    {format(d, "d")}
                  </p>
                  <div className="space-y-2">
                    {SLOTS.map((slot) => {
                      const items = dayEntries.filter((e) => e.meal_slot === slot);
                      const targetKey = `${iso}:${slot}`;
                      const isTarget = dropTarget === targetKey;
                      return (
                        <div
                          key={slot}
                          onDragOver={(e) => {
                            if (!dragId) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dropTarget !== targetKey) setDropTarget(targetKey);
                          }}
                          onDragLeave={() => {
                            if (dropTarget === targetKey) setDropTarget(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const id = e.dataTransfer.getData("text/plain") || dragId;
                            setDropTarget(null);
                            setDragId(null);
                            if (id) onDropEntry(id, iso, slot);
                          }}
                          className={`rounded-xl transition-colors ${
                            isTarget ? "bg-turmeric/25 ring-2 ring-paprika/60 -m-1 p-1" : ""
                          }`}
                        >
                          <p className="text-[10px] uppercase font-black opacity-50 mb-1">
                            {SLOT_LABEL[slot]}
                          </p>
                          {items.map((it) => (
                            <div
                              key={it.id}
                              draggable
                              onDragStart={(e) => {
                                setDragId(it.id);
                                e.dataTransfer.setData("text/plain", it.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDragId(null);
                                setDropTarget(null);
                              }}
                              className={`group bg-background border-2 border-border rounded-xl p-2 mb-1 cursor-grab active:cursor-grabbing ${
                                dragId === it.id ? "opacity-40" : ""
                              }`}
                            >
                              <p className="text-xs font-black leading-tight break-words">
                                {it.title}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <Link
                                  to="/cook/$id"
                                  params={{ id: it.saved_recipe_id }}
                                  className="text-[10px] uppercase font-black text-paprika"
                                >
                                  Cook →
                                </Link>
                                <button
                                  onClick={() => onRemove(it.id)}
                                  className="opacity-40 hover:opacity-100"
                                  aria-label="Remove"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => setPicker({ date: iso, slot })}
                            className="w-full flex items-center justify-center gap-1 text-[10px] font-black uppercase opacity-50 hover:opacity-100 py-1 border-2 border-dashed border-border rounded-xl"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showList && (
          <section className="mt-8 bg-white border-2 border-border rounded-2xl p-5 shadow-[3px_3px_0px_0px_var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-paprika uppercase">
                Shopping list
              </h2>
              <p className="text-[11px] uppercase font-black opacity-60">
                {shopping.length} items · this week
              </p>
            </div>
            {shopping.length === 0 ? (
              <p className="opacity-60 text-sm">
                Add recipes to your plan to build a shopping list.
              </p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                {shopping.map((s) => {
                  const isChecked = checked.has(s.name);
                  return (
                    <li key={s.name}>
                      <label className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheck(s.name)}
                          className="w-4 h-4 accent-paprika"
                        />
                        <span className={`text-sm flex-1 ${isChecked ? "line-through opacity-40" : ""}`}>
                          {s.name}
                        </span>
                        {s.count > 1 && (
                          <span className="text-[10px] font-black opacity-60 uppercase">
                            ×{s.count}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {picker && (
          <RecipePicker
            saved={saved}
            date={picker.date}
            slot={picker.slot}
            onPick={onAdd}
            onClose={() => setPicker(null)}
          />
        )}
      </div>
    </main>
  );
}

function RecipePicker({
  saved,
  date,
  slot,
  onPick,
  onClose,
}: {
  saved: SavedRecipeRow[];
  date: string;
  slot: MealSlot;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = saved.filter((r) =>
    r.title.toLowerCase().includes(q.trim().toLowerCase()),
  );
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:max-w-lg bg-background border-2 border-border rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] uppercase font-black opacity-60">
              {SLOT_LABEL[slot]} · {date}
            </p>
            <h3 className="font-display text-2xl text-paprika">Pick a recipe</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your cookbook…"
          className="w-full px-3 py-2 border-2 border-border rounded-xl mb-3 bg-white text-sm"
          autoFocus
        />
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="opacity-60 text-sm p-3">
              No saved recipes match.{" "}
              <Link to="/" className="underline">Save one from the home page</Link>.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => onPick(r.id)}
                    className="w-full text-left bg-white border-2 border-border rounded-xl p-3 hover:bg-turmeric/20"
                  >
                    <p className="font-black text-sm">{r.title}</p>
                    <p className="text-[10px] uppercase font-black opacity-60">
                      {[r.cuisine, r.cook_time_minutes ? `${r.cook_time_minutes} min` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}