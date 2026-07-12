import { dietaryIcon } from "@/lib/dietary-icons";

type Variant = "dark" | "light";

type Props = {
  label: string;
  matched?: boolean;
  variant?: Variant;
};

export function DietBadge({ label, matched = false, variant = "light" }: Props) {
  const base =
    "inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide border-2 border-border rounded-full px-2 py-0.5 whitespace-nowrap";
  const matchedStyle =
    "bg-paprika text-white shadow-[2px_2px_0px_0px_var(--border)] ring-2 ring-turmeric";
  const idleStyle =
    variant === "dark"
      ? "bg-white/10 text-white/90"
      : "bg-white text-foreground";
  return (
    <span
      className={`${base} ${matched ? matchedStyle : idleStyle}`}
      aria-label={matched ? `Matches your ${label} filter` : label}
      title={matched ? `Matches your ${label} filter` : label}
    >
      <span aria-hidden>{dietaryIcon(label)}</span>
      {matched && <span aria-hidden>✓</span>}
      <span>{label}</span>
    </span>
  );
}

type RowProps = {
  tags: string[];
  selected?: string[];
  variant?: Variant;
  labelText?: string;
};

export function DietBadgeRow({ tags, selected = [], variant = "light", labelText = "Dietary" }: RowProps) {
  if (tags.length === 0) return null;
  const sel = new Set(selected.map((s) => s.toLowerCase()));
  const isMatched = (t: string) => sel.has(t.toLowerCase());
  const sorted = [...tags].sort((a, b) => Number(isMatched(b)) - Number(isMatched(a)));
  const matchedTags = tags.filter(isMatched);
  const labelColor = variant === "dark" ? "text-white/70" : "text-muted-foreground";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {matchedTags.length > 0 && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide bg-cardamom text-white border-2 border-border rounded-full px-2 py-0.5"
          aria-label={`Matches your diet: ${matchedTags.join(", ")}`}
        >
          <span aria-hidden>✓</span> Matches your diet
        </span>
      )}
      <span className={`text-[10px] font-black uppercase tracking-widest mr-1 ${labelColor}`}>
        {labelText}:
      </span>
      {sorted.map((d) => (
        <DietBadge key={d} label={d} matched={isMatched(d)} variant={variant} />
      ))}
    </div>
  );
}