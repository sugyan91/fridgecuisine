import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callFoodImageGen } from "./hf-client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkAiQuota, recordAiGeneration } from "./ai-quota.server";

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
    const quota = await checkAiQuota(supabase, userId);
    if (!quota.ok) return { ok: false, error: quota.error };
    const cuisinePart = data.cuisine ? `a ${data.cuisine} dish` : "a dish";
    const descPart = data.description ? ` ${data.description.replace(/\s+/g, " ").trim()}.` : "";
    const ings = (data.keyIngredients ?? [])
      .map(stripQuantity)
      .filter((s) => s.length > 1)
      .slice(0, 6);
    const ingPart = ings.length > 0 ? ` Visible ingredients: ${ings.join(", ")}.` : "";
    const prompt =
      `Professional overhead food photography of ${data.dishName}, ${cuisinePart}.` +
      descPart +
      ingPart +
      ` Authentic, traditional presentation true to the dish. Natural lighting, shallow depth of field, garnished and plated as it is actually served, appetizing, photorealistic, magazine quality. No text, no labels, no watermarks.`;
    const res = await callFoodImageGen(prompt);
    if (res.ok) await recordAiGeneration(supabase, userId);
    return res;
  });