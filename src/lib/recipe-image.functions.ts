import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callFoodImageGen } from "./hf-client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkAiQuota, recordAiGeneration } from "./ai-quota.server";
import { logAiUsage } from "./ai-usage-logging.server";

const inputSchema = z.object({
  dishName: z.string().trim().min(2).max(200),
  cuisine: z.string().trim().max(80).optional(),
  description: z.string().trim().max(400).optional(),
  keyIngredients: z.array(z.string().trim().min(1).max(120)).max(8).optional(),
});

export type RecipeImageResult =
  | { ok: true; dataUrl: string; provider: "huggingface" | "lovable" }
  | { ok: false; error: string };

function stripQuantity(s: string): string {
  // Strip leading quantity/unit like "2 cups ", "200 g ", "1/2 tsp "
  return s
    .replace(/^\s*(?:to taste\s+|[\d./\s]+(?:cups?|tbsp|tsp|g|kg|ml|l|oz|lb|cloves?|pieces?|slices?|cans?|pinch|handful)?\s+)/i, "")
    .replace(/,.*$/, "")
    .trim();
}

export const generateRecipeImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }): Promise<RecipeImageResult> => {
    const { supabase, userId } = context;
    const quota = await checkAiQuota(supabase, userId, {}, "dish-image");
    if (!quota.ok) return { ok: false, error: quota.error };

    // Cache by normalized dish name + cuisine + key ingredients — same dish
    // returns the same photo, no image gen.
    const { hashKey, getCached, putCached } = await import("./ai-cache.server");
    const norm = {
      dish: data.dishName.toLowerCase().trim(),
      cuisine: (data.cuisine ?? "").toLowerCase().trim(),
      ingredients: (data.keyIngredients ?? [])
        .map((s) => stripQuantity(s).toLowerCase())
        .filter((s) => s.length > 1)
        .sort()
        .slice(0, 6),
    };
    const cacheKey = hashKey("dish-image", norm);
    const cached = await getCached<{ dataUrl: string; provider: "huggingface" | "lovable" }>(
      "dish-image",
      cacheKey,
    );
    if (cached) {
      await recordAiGeneration(supabase, userId, "dish-image");
      logAiUsage({ endpoint: "dish-image", userId, cacheHit: true });
      return { ok: true, dataUrl: cached.dataUrl, provider: cached.provider };
    }

    const cuisinePart = data.cuisine ? `a ${data.cuisine} dish` : "a dish";
    const descPart = data.description ? ` ${data.description.replace(/\s+/g, " ").trim()}.` : "";
    const ings = (data.keyIngredients ?? [])
      .map(stripQuantity)
      .filter((s) => s.length > 1)
      .slice(0, 6);
    const ingPart = ings.length > 0 ? ` Visible ingredients: ${ings.join(", ")}.` : "";
    const prompt =
      `Photorealistic food photograph of "${data.dishName}", ${cuisinePart}. ` +
      `The image MUST depict this exact, specific dish as it is traditionally and authentically served in its country of origin — not a generic stand-in, not a similar-looking dish. ` +
      descPart +
      ingPart +
      ` Render the dish with the correct color, texture, serving vessel, and accompaniments that a native cook would recognize. ` +
      `Overhead 3/4 angle, natural soft lighting, shallow depth of field, restaurant-quality plating, sharp focus, ultra-detailed, hi-res DSLR photograph. ` +
      `No text, no captions, no labels, no watermarks, no logos, no hands, no people.`;
    const res = await callFoodImageGen(prompt);
    if (res.ok) {
      await recordAiGeneration(supabase, userId, "dish-image");
      await putCached("dish-image", cacheKey, { dataUrl: res.dataUrl, provider: res.provider }, 90);
      logAiUsage({ endpoint: "dish-image", userId, cacheHit: false });
    }
    return res;
  });