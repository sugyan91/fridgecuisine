// Generate a food photo on-demand from a free image generator that maps a
// text prompt to an image. This keeps recipe images aligned with the actual
// dish name + cuisine returned by the AI, instead of a fixed local library.
export function pickRecipeImage(
  title: string,
  index = 0,
  cuisine?: string,
): string {
  const parts = [title, cuisine, "food photography, overhead, natural light"]
    .filter(Boolean)
    .join(", ");
  const prompt = encodeURIComponent(parts);
  // Deterministic seed per recipe so the same dish keeps the same image.
  const seed = hash(`${title}|${cuisine ?? ""}|${index}`);
  return `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${seed}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
