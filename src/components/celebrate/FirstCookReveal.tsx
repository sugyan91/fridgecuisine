import { useEffect, useMemo } from "react";
import { pickFoodQuote } from "@/lib/food-quotes";

/**
 * Cinematic one-time overlay shown the first time a paid member generates
 * recipes. Auto-dismisses, and can be skipped with a tap/click.
 */
export function FirstCookReveal({
  onDone,
  durationMs = 2200,
}: {
  onDone: () => void;
  durationMs?: number;
}) {
  const quote = useMemo(() => pickFoodQuote(), []);

  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [onDone, durationMs]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Skip celebration"
      onClick={onDone}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") onDone();
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-background/92 backdrop-blur-sm reveal-fade"
    >
      <span className="light-sweep" aria-hidden="true" />
      <span className="spray-blob spray-blob-1" aria-hidden="true" />
      <span className="spray-blob spray-blob-2" aria-hidden="true" />

      <div className="relative px-6 text-center">
        <svg viewBox="0 0 620 130" className="mx-auto w-[min(92vw,620px)]" aria-hidden="true">
          <text
            x="310"
            y="66"
            textAnchor="middle"
            className="graffiti-tag"
            fontSize="42"
            fontWeight="800"
            letterSpacing="1.2"
          >
            FIRST COOK, UNLOCKED
          </text>
          <path className="graffiti-underline" d="M90 90 C 220 106, 420 76, 540 94" />
          <path className="graffiti-drip" d="M200 93 v24" />
        </svg>
        <p className="mx-auto mt-4 max-w-sm font-display text-lg italic leading-snug text-foreground/85 animate-fade-in">
          “{quote}”
        </p>
        <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Plating your recipes…
        </p>
      </div>
    </div>
  );
}