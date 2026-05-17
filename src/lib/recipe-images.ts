// Pull a real food photo from LoremFlickr by keyword. Fast (cached CC photos
// from Flickr), no API key, and a deterministic `lock` keeps the same dish
// showing the same image across reloads.
export function pickRecipeImage(
  title: string,
  index = 0,
  cuisine?: string,
): string {
  const titleTokens = title
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3);
  const cuisineToken = (cuisine ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  const keywords = [...titleTokens, cuisineToken, "food"]
    .filter(Boolean)
    .join(",");
  const lock = hash(`${title}|${cuisine ?? ""}|${index}`);
  return `https://loremflickr.com/512/512/${encodeURIComponent(keywords)}?lock=${lock}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
