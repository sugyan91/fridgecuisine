import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RefreshCw, Sparkles, X } from "lucide-react";
import { suggestSubstitutions, type Substitution } from "@/lib/substitutions.functions";

export function IngredientChip({
  line,
  recipeTitle,
  cuisine,
}: {
  line: string;
  recipeTitle?: string;
  cuisine?: string;
}) {
  const suggest = useServerFn(suggestSubstitutions);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subs, setSubs] = useState<Substitution[] | null>(null);

  const load = async () => {
    setOpen(true);
    if (subs) return;
    setLoading(true);
    try {
      const res = await suggest({ data: { ingredient: line, recipeTitle, cuisine } });
      setSubs(res.subs);
      if (res.subs.length === 0) toast.info("No good swaps found — try a search.");
    } catch {
      toast.error("Couldn't fetch substitutions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="py-2 border-b border-border/40 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{line}</span>
        <button
          onClick={load}
          className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest opacity-70 hover:opacity-100 border-2 border-border rounded-full px-2 py-0.5 bg-white"
          aria-label={`Suggest substitutes for ${line}`}
        >
          <RefreshCw className="w-3 h-3" /> Swap
        </button>
      </div>
      {open && (
        <div className="mt-2 bg-turmeric/10 border-2 border-border rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase font-black tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI swaps
            </p>
            <button onClick={() => setOpen(false)} aria-label="Close swaps" className="opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {loading ? (
            <p className="text-xs opacity-70">Thinking of alternatives…</p>
          ) : subs && subs.length > 0 ? (
            <ul className="space-y-2">
              {subs.map((s, i) => (
                <li key={i} className="text-xs">
                  <p className="font-black">{s.swap} <span className="opacity-60 font-normal">— {s.ratio}</span></p>
                  <p className="opacity-70">{s.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs opacity-70">No substitutes suggested.</p>
          )}
        </div>
      )}
    </li>
  );
}