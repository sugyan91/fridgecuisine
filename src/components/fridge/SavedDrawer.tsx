import { Link } from "@tanstack/react-router";
import type { SavedRecipeRow } from "@/lib/saved-receipes.functions";

type Props = {
  open: boolean;
  onClose: () => void;
  saved: SavedRecipeRow[];
  onUnsave: (title: string) => void;
  onToggleCooked: (row: SavedRecipeRow) => void;
};

export function SavedDrawer({ open, onClose, saved, onUnsave, onToggleCooked }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close saved receipes"
        onClick={onClose}
        className="flex-1 bg-foreground/40 backdrop-blur-sm"
      />
      <aside className="w-full max-w-md bg-background border-l-4 border-border h-full overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-3xl uppercase">Saved</h3>
          <button
            type="button"
            onClick={onClose}
            className="size-10 border-2 border-border rounded-full font-black"
          >
            ×
          </button>
        </div>
        <Link
          to="/cookbook"
          onClick={onClose}
          className="block mb-4 text-xs font-black uppercase tracking-widest text-paprika underline underline-offset-4"
        >
          View full cookbook & meal history →
        </Link>
        {saved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Tap the heart on any receipe.
          </p>
        ) : (
          <ul className="space-y-3">
            {saved.map((r) => (
              <li
                key={r.id}
                className="border-2 border-border rounded-2xl bg-white overflow-hidden shadow-[3px_3px_0px_0px_var(--border)]"
              >
                <div className="flex items-stretch">
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <p className="font-bold text-sm truncate">{r.title}</p>
                    <p className="font-mono text-[10px] uppercase opacity-60">
                      {r.cook_time_minutes ? `${r.cook_time_minutes} min` : "—"}
                      {r.cuisine ? ` · ${r.cuisine}` : ""}
                      {r.cooked_at ? " · ✓ Cooked" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnsave(r.title)}
                    aria-label="Unsave"
                    className="px-3 text-paprika font-black"
                  >
                    ×
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleCooked(r)}
                  className={`w-full text-[10px] font-black uppercase tracking-widest py-2 border-t-2 border-border ${
                    r.cooked_at
                      ? "bg-turmeric/30 text-foreground"
                      : "bg-background hover:bg-turmeric/10"
                  }`}
                >
                  {r.cooked_at ? "Mark as not cooked" : "Mark as cooked"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
