import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { addDays, format, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, CheckCheck } from "lucide-react";
import {
  aggregateShoppingList,
  listWeek,
  type MealPlanEntry,
} from "@/lib/meal-plan.functions";
import { readCustomShopping, removeCustomShopping } from "@/lib/custom-shopping";

const CHECKED_KEY = "fc-shopping-checked";

export const Route = createFileRoute("/_authenticated/list")({
  head: () => ({
    meta: [
      { title: "Shopping List — FridgeCuisine" },
      {
        name: "description",
        content: "Your weekly shopping list, aggregated from your meal plan.",
      },
    ],
  }),
  component: ShoppingListPage,
});

function ShoppingListPage() {
  const load = useServerFn(listWeek);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(CHECKED_KEY);
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  const startISO = format(weekStart, "yyyy-MM-dd");
  const endISO = format(addDays(weekStart, 6), "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load({ data: { startDate: startISO, endDate: endISO } })
      .then((w) => !cancelled && setEntries(w.entries))
      .catch(() => toast.error("Couldn't load your list."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [startISO, endISO, load]);

  const shopping = useMemo(() => aggregateShoppingList(entries), [entries]);
  const [custom, setCustom] = useState<string[]>([]);
  useEffect(() => { setCustom(readCustomShopping()); }, []);
  const combined = useMemo(() => {
    const seen = new Set(shopping.map((s) => s.name.toLowerCase()));
    const extras = custom
      .filter((c) => !seen.has(c.toLowerCase()))
      .map((name) => ({ name, count: 1 } as { name: string; count: number }));
    return [...shopping, ...extras];
  }, [shopping, custom]);

  const persist = (next: Set<string>) => {
    setChecked(next);
    try {
      localStorage.setItem(CHECKED_KEY, JSON.stringify(Array.from(next)));
    } catch {}
  };

  const toggle = (name: string) => {
    const next = new Set(checked);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    persist(next);
  };

  const clearChecked = () => persist(new Set());

  const remaining = combined.filter((s) => !checked.has(s.name)).length;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/plan" className="font-black text-xs uppercase opacity-60">
            ← Meal plan
          </Link>
          <Link to="/cookbook" className="font-black text-xs uppercase opacity-60">
            Cookbook →
          </Link>
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-paprika uppercase mb-2">
          Shopping list
        </h1>
        <p className="opacity-70 text-sm mb-5">
          Everything you need for this week's plan, in one place.
        </p>

        <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekStart((d) => addDays(d, -7))}
              className="p-2 bg-white border-2 border-border rounded-full"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="font-black uppercase text-xs tracking-widest">
              {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
            </p>
            <button
              onClick={() => setWeekStart((d) => addDays(d, 7))}
              className="p-2 bg-white border-2 border-border rounded-full"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {checked.size > 0 && (
            <button
              onClick={clearChecked}
              className="flex items-center gap-1 text-[11px] font-black uppercase opacity-70 hover:opacity-100"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Clear ({checked.size})
            </button>
          )}
        </div>

        {loading ? (
          <p className="opacity-60">Loading…</p>
        ) : combined.length === 0 ? (
          <div className="bg-white border-2 border-border rounded-2xl p-6 text-center">
            <p className="opacity-70 text-sm">
              No items yet.{" "}
              <Link to="/plan" className="underline font-black">
                Add recipes to your plan
              </Link>{" "}
              to build a list.
            </p>
          </div>
        ) : (
          <section className="bg-white border-2 border-border rounded-2xl p-4 shadow-[3px_3px_0px_0px_var(--border)]">
            <p className="text-[11px] uppercase font-black opacity-60 mb-3">
              {remaining} of {combined.length} to buy
            </p>
            <ul className="divide-y divide-border/60">
              {combined.map((s) => {
                const isChecked = checked.has(s.name);
                return (
                  <li key={s.name}>
                    <label className="flex items-center gap-3 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(s.name)}
                        className="w-5 h-5 accent-paprika"
                      />
                      <span
                        className={`text-sm flex-1 ${
                          isChecked ? "line-through opacity-40" : ""
                        }`}
                      >
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
          </section>
        )}
      </div>
    </main>
  );
}