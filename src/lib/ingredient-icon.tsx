import { getIngredientIcon } from "@/lib/ingredient-icons";

// Convert an emoji string to Twemoji's filename convention:
// codepoints in hex, joined by '-', with the FE0F variation selector
// stripped (matches the assets published under jdecked/twemoji).
function emojiToTwemojiCode(emoji: string): string {
  const cps: string[] = [];
  for (const ch of emoji) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    cps.push(cp.toString(16));
  }
  const filtered = cps.filter((c) => c !== "fe0f");
  return (filtered.length ? filtered : cps).join("-");
}

type Props = {
  name: string;
  className?: string;
};

/**
 * Renders an ingredient emoji as a Twemoji SVG image. Native emoji rendering
 * is unreliable inside iOS/Android WebViews and on older OS versions —
 * serving the SVG from the Twemoji CDN guarantees the icon shows everywhere.
 */
export function IngredientIcon({ name, className = "" }: Props) {
  const emoji = getIngredientIcon(name);
  const code = emojiToTwemojiCode(emoji);
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${code}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={`inline-block w-[1.1em] h-[1.1em] align-[-0.15em] ${className}`}
      onError={(e) => {
        // Fall back to the raw emoji if the CDN path doesn't exist.
        const img = e.currentTarget;
        const span = document.createElement("span");
        span.textContent = emoji;
        span.setAttribute("aria-hidden", "true");
        img.replaceWith(span);
      }}
    />
  );
}