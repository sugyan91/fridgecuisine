import { useMemo } from "react";
import { pickFoodQuote } from "@/lib/food-quotes";
import { useMotionProfile } from "@/hooks/use-motion-profile";

const GLYPHS = ["🌶️", "🍋", "🌿", "🥑", "🧄", "🍅", "🥕", "🧀", "🍳", "🥂"];

/**
 * Full-bleed graffiti spray celebration used when a subscription goes live.
 * Pure CSS/SVG — no runtime canvas or extra deps.
 */
export function GraffitiCelebration({ tag = "WELCOME TO THE KITCHEN" }: { tag?: string }) {
  const quote = useMemo(() => pickFoodQuote(), []);
  const { reduceMotion, lite } = useMotionProfile();
  const bitCount = reduceMotion ? 0 : lite ? 6 : 14;
  const bits = useMemo(
    () =>
      Array.from({ length: bitCount }, (_, i) => ({
        glyph: GLYPHS[i % GLYPHS.length],
        left: 4 + ((i * 37) % 92),
        delay: (i % 9) * 0.18,
        dur: 3.4 + ((i * 7) % 5) * 0.4,
        size: 16 + ((i * 5) % 4) * 6,
        drift: ((i % 5) - 2) * 28,
      })),
    [bitCount],
  );

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden celebration-layer${lite ? " celebration-lite" : ""}`}
      aria-hidden="true"
    >
      {/* Spray blobs */}
      <span className="spray-blob spray-blob-1" />
      <span className="spray-blob spray-blob-2" />
      {!lite && <span className="spray-blob spray-blob-3" />}

      {/* Hand-painted tag that draws itself on */}
      <svg
        viewBox="0 0 600 120"
        className="absolute left-1/2 top-6 w-[min(92vw,640px)] -translate-x-1/2 opacity-90"
      >
        <text
          x="300"
          y="70"
          textAnchor="middle"
          className="graffiti-tag"
          fontSize="46"
          fontWeight="800"
          letterSpacing="1.5"
        >
          {tag}
        </text>
        <path className="graffiti-underline" d="M70 92 C 200 108, 400 78, 530 96" />
        <path className="graffiti-drip" d="M150 97 v26" />
        <path className="graffiti-drip graffiti-drip-2" d="M420 90 v34" />
      </svg>

      {/* Flying food confetti */}
      {bits.map((b, i) => (
        <span
          key={i}
          className="food-bit"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            ["--drift" as string]: `${b.drift}px`,
          }}
        >
          {b.glyph}
        </span>
      ))}

      {/* Inspiring line */}
      <p className="absolute inset-x-4 bottom-8 text-center font-display text-[15px] italic text-muted-foreground animate-fade-in">
        “{quote}”
      </p>
    </div>
  );
}