import type { Recipe } from "@/lib/recipes.functions";
import { pickRecipeImage } from "@/lib/recipe-images";

type Props = {
  open: boolean;
  onClose: () => void;
  saved: Recipe[];
  onUnsave: (title: string) => void;
};

export function SavedDrawer({ open, onClose, saved, onUnsave }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close saved recipes"
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
        {saved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing saved yet. Tap the heart on any recipe.
          </p>
        ) : (
          <ul className="space-y-3">
            {saved.map((r, i) => (
              <li
                key={r.title}
                className="border-2 border-border rounded-2xl bg-white overflow-hidden flex shadow-[3px_3px_0px_0px_var(--border)]"
              >
                <img
                  src={pickRecipeImage(r.title, i, r.cuisine)}
                  alt={r.title}
                  width={80}
                  height={80}
                  loading="lazy"
                  className="w-20 h-20 object-cover border-r-2 border-border"
                />
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <p className="font-bold text-sm truncate">{r.title}</p>
                  <p className="font-mono text-[10px] uppercase opacity-60">
                    {r.cookTimeMinutes} min · {r.cuisine}
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
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
