import fallbackChana from "@/assets/receipe-chana.jpg";
import fallbackDal from "@/assets/receipe-dal.jpg";
import fallbackMomo from "@/assets/receipe-momo.jpg";
import fallbackPaneer from "@/assets/receipe-paneer.jpg";
import fallbackRice from "@/assets/receipe-rice.jpg";
import fallbackSaag from "@/assets/receipe-saag.jpg";

const FALLBACKS = [
  fallbackChana,
  fallbackDal,
  fallbackMomo,
  fallbackPaneer,
  fallbackRice,
  fallbackSaag,
];

const STOPWORDS = new Set([
  "the", "and", "with", "from", "style", "your", "this", "that",
  "for", "into", "made", "easy", "quick", "best", "homemade", "receipe",
  "dish", "food", "cuisine", "any", "surprise", "me",
]);

// Build a dish-aware image URL. We use pollinations.ai to actually render
// the specific dish (title + cuisine + a key ingredient) instead of a loose
// keyword search that can return unrelated food. Deterministic seed keeps
// the same receipe showing the same image across reloads.
export function pickRecipeImage(
  title: string,
  index = 0,
  cuisine?: string,
  ingredients?: string[],
): string {
  const cleanTitle = title.replace(/\([^)]*\)/g, " ").trim();
  const cleanCuisine = (cuisine ?? "").replace(/\s*\/.*$/, "").trim();

  const ingredientHint = (ingredients ?? [])
    .map((i) => i.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim())
    .flatMap((i) => i.split(/\s+/))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 3)
    .join(", ");

  const parts = [
    cleanTitle,
    cleanCuisine && cleanCuisine.toLowerCase() !== "any" ? `${cleanCuisine} cuisine` : "",
    ingredientHint,
    "authentic plated food photography, overhead, natural daylight",
  ].filter(Boolean);

  const prompt = parts.join(", ");
  const seed = hash(`${title}|${cuisine ?? ""}|${index}`);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${seed}`;
}

// Deterministic fallback used when the remote image fails to load.
export function pickFallbackImage(title: string, cuisine?: string, index = 0): string {
  const i = hash(`${title}|${cuisine ?? ""}|${index}`) % FALLBACKS.length;
  return FALLBACKS[i];
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
