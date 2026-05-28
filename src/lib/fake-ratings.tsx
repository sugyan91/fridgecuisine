// Deterministic fake ratings derived from a recipe id.
// Same id always returns the same numbers across pages and reloads.

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type FakeRating = { rating: number; count: number };

export function fakeRating(id: string): FakeRating {
  const h = hash(id);
  // Rating between 3.6 and 4.9 (inclusive, 0.1 steps)
  const ratingSteps = (h % 14); // 0..13
  const rating = Math.round((3.6 + ratingSteps * 0.1) * 10) / 10;
  // Count between 120 and 850
  const count = 120 + ((h >>> 8) % 731);
  return { rating, count };
}

export function Stars({
  rating,
  size = "text-sm",
}: {
  rating: number;
  size?: string;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span className={`${size} text-amber-500 leading-none tracking-tight`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(full)}
      {hasHalf ? "⯨" : ""}
      <span className="text-muted-foreground/40">{"★".repeat(empty)}</span>
    </span>
  );
}