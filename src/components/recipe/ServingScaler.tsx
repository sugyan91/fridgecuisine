import { Minus, Plus } from "lucide-react";

export function ServingScaler({
  base,
  value,
  onChange,
}: {
  base: number;
  value: number;
  onChange: (n: number) => void;
}) {
  const factor = value / base;
  return (
    <div className="inline-flex items-center gap-2 bg-white border-2 border-border rounded-full px-3 py-1.5">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        aria-label="Fewer servings"
        className="grid place-items-center size-6 rounded-full bg-background border-2 border-border"
      >
        <Minus className="w-3 h-3" />
      </button>
      <div className="text-center min-w-[76px]">
        <p className="text-sm font-black leading-none">{value} servings</p>
        <p className="text-[10px] uppercase font-black opacity-60 tracking-widest leading-none mt-0.5">
          {factor === 1 ? "as written" : `×${factor.toFixed(2).replace(/\.?0+$/, "")}`}
        </p>
      </div>
      <button
        onClick={() => onChange(Math.min(40, value + 1))}
        aria-label="More servings"
        className="grid place-items-center size-6 rounded-full bg-background border-2 border-border"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}