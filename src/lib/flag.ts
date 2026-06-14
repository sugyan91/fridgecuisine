// Convert a country-flag emoji (two Regional Indicator Symbols) to its
// ISO 3166-1 alpha-2 country code (e.g. "🇮🇹" → "it"). Returns null for
// non-flag emoji (food emoji, etc.) so callers can fall back gracefully.
export function flagEmojiToIso(emoji: string): string | null {
  const cps = [...emoji].map((c) => c.codePointAt(0) ?? 0);
  if (cps.length !== 2) return null;
  const base = 0x1f1e6;
  if (cps[0] < base || cps[0] > base + 25) return null;
  if (cps[1] < base || cps[1] > base + 25) return null;
  return String.fromCharCode(97 + (cps[0] - base), 97 + (cps[1] - base));
}

type FlagProps = {
  emoji: string;
  className?: string;
  squared?: boolean;
};

/**
 * Renders a country flag as an SVG (via flag-icons) so it shows on every
 * OS, including Windows which has no flag emoji font. Falls back to the
 * raw emoji when the input isn't a regional-indicator pair (e.g. 🥑, 🍳).
 */
export function Flag({ emoji, className = "", squared = false }: FlagProps) {
  const iso = flagEmojiToIso(emoji);
  if (!iso) {
    return (
      <span className={className} aria-hidden>
        {emoji}
      </span>
    );
  }
  return (
    <span
      className={`fi fi-${iso}${squared ? " fis" : ""} ${className}`}
      aria-hidden
    />
  );
}