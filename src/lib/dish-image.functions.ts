import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STOPWORDS = new Set([
  "the","and","with","from","style","your","this","that","for","into",
  "made","easy","quick","best","homemade","receipe","recipe","dish",
  "food","cuisine","any","surprise","me",
]);

const inputSchema = z.object({
  title: z.string().min(1).max(200),
  cuisine: z.string().max(80).optional(),
  ingredients: z.array(z.string().max(80)).max(20).optional(),
});

export type DishImage = {
  url: string;
  thumb: string;
  alt: string;
  credit: { name: string; link: string };
} | null;

function buildQuery(
  title: string,
  cuisine?: string,
  ingredients?: string[],
): string {
  const cleanTitle = title.replace(/\([^)]*\)/g, " ").trim();
  const cleanCuisine = (cuisine ?? "")
    .replace(/\s*\/.*$/, "")
    .replace(/surprise me|any/i, "")
    .trim();
  const ingredientHint = (ingredients ?? [])
    .map((i) => i.toLowerCase().replace(/[^a-z0-9\s]/g, " "))
    .flatMap((i) => i.split(/\s+/))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 2)
    .join(" ");
  return [cleanTitle, cleanCuisine, ingredientHint, "food"]
    .filter(Boolean)
    .join(" ");
}

export const searchDishImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<DishImage> => {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) {
      console.warn("[unsplash] UNSPLASH_ACCESS_KEY not set");
      return null;
    }
    const query = buildQuery(data.title, data.cuisine, data.ingredients);
    const url = `https://api.unsplash.com/search/photos?per_page=5&orientation=squarish&content_filter=high&query=${encodeURIComponent(query)}`;

    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Client-ID ${key}`,
          "Accept-Version": "v1",
        },
      });
      if (!res.ok) {
        console.warn("[unsplash]", res.status, await res.text().catch(() => ""));
        return null;
      }
      const payload = (await res.json()) as {
        results?: Array<{
          urls: { regular: string; small: string };
          alt_description?: string | null;
          user: { name: string; links: { html: string } };
        }>;
      };
      const first = payload.results?.[0];
      if (!first) return null;
      return {
        url: first.urls.regular,
        thumb: first.urls.small,
        alt: first.alt_description || data.title,
        credit: {
          name: first.user.name,
          link: `${first.user.links.html}?utm_source=fridge_cuisine&utm_medium=referral`,
        },
      };
    } catch (err) {
      console.warn("[unsplash] threw", err);
      return null;
    }
  });
