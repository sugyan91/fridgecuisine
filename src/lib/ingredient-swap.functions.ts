import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callChatJSON } from "./hf-client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkAiQuota, recordAiGeneration } from "./ai-quota.server";
import { logAiUsage } from "./ai-usage-logging.server";

const inputSchema = z.object({
  recipeTitle: z.string().trim().min(1).max(200),
  cuisine: z.string().trim().max(80).optional().default(""),
  ingredient: z.string().trim().min(1).max(120),
  pantry: z.array(z.string().max(60)).max(40).default([]),
  dietary: z.array(z.string().max(40)).max(10).default([]),
});

export type IngredientSwap = { name: string; note: string };

export type SwapIngredientResult =
  | { ok: true; swaps: IngredientSwap[] }
  | { ok: false; error: string };

const responseSchema = z.object({
  swaps: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        note: z.string().trim().min(1).max(280),
      }),
    )
    .min(1)
    .max(3),
});

export const swapIngredient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }): Promise<SwapIngredientResult> => {
    const { supabase, userId } = context;
    const quota = await checkAiQuota(supabase, userId, {}, "ingredient-swap");
    if (!quota.ok) return { ok: false, error: quota.error };

    const { hashKey, getCached, putCached } = await import("./ai-cache.server");
    const { normalizeForCacheKey } = await import("./ai-cache.server");
    const norm = {
      recipe: normalizeForCacheKey(data.recipeTitle),
      cuisine: normalizeForCacheKey(data.cuisine ?? ""),
      ingredient: normalizeForCacheKey(data.ingredient),
      pantry: [...data.pantry].map(normalizeForCacheKey).sort(),
      dietary: [...data.dietary].map(normalizeForCacheKey).sort(),
    };
    const cacheKey = hashKey("ingredient-swap", norm);
    const cached = await getCached<{ swaps: IngredientSwap[] }>(
      "ingredient-swap",
      cacheKey,
    );
    if (cached) {
      await recordAiGeneration(supabase, userId, "ingredient-swap");
      logAiUsage({ endpoint: "ingredient-swap", userId, cacheHit: true });
      return { ok: true, swaps: cached.swaps };
    }

    const dietary = data.dietary.length ? data.dietary.join(", ") : "none";
    const pantry = data.pantry.length ? data.pantry.join(", ") : "(none listed)";

    const systemPrompt = `Expert home cook. Swap an ingredient in a recipe. Return 1-3 realistic subs, prefer pantry items, respect dietary strictly. "name" = replacement (with qty hint). "note" = one line on impact. JSON only: {"swaps":[{"name":"...","note":"..."}]}`;

    const userPrompt = `Recipe: ${data.recipeTitle}${data.cuisine ? ` (${data.cuisine} cuisine)` : ""}
Ingredient to swap: ${data.ingredient}
User's pantry: ${pantry}
Dietary constraints (must respect): ${dietary}`;

    try {
      const aiRes = await callChatJSON(systemPrompt, userPrompt, { maxTokens: 220, temperature: 0.2 });
      if (!aiRes.ok) return { ok: false, error: aiRes.error };
      const parsed = responseSchema.safeParse(aiRes.json);
      if (!parsed.success) {
        return { ok: false, error: "Couldn't read AI response. Try again." };
      }
      await recordAiGeneration(supabase, userId, "ingredient-swap");
      await putCached("ingredient-swap", cacheKey, { swaps: parsed.data.swaps }, 90);
      logAiUsage({ endpoint: "ingredient-swap", userId, cacheHit: false });
      return { ok: true, swaps: parsed.data.swaps };
    } catch (err) {
      console.error("swapIngredient failed", err);
      return { ok: false, error: "Something went wrong. Try again." };
    }
  });