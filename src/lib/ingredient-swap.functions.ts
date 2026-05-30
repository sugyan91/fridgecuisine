import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callChatJSON } from "./hf-client.server";

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
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<SwapIngredientResult> => {
    const dietary = data.dietary.length ? data.dietary.join(", ") : "none";
    const pantry = data.pantry.length ? data.pantry.join(", ") : "(none listed)";

    const systemPrompt = `You are an expert home cook helping a user swap an ingredient they don't have in a specific receipe.
Return 1-2 realistic substitutions (max 3). Prefer items from the user's pantry when sensible. Each swap must respect the dietary constraints STRICTLY.
For each swap, "name" is the replacement ingredient (with quantity hint if helpful, e.g. "Greek yogurt (3 tbsp)"). "note" is a single short sentence explaining how it changes the dish or any technique tweak.
Return ONLY JSON: { "swaps": [{ "name": "...", "note": "..." }] } — no prose.`;

    const userPrompt = `Receipe: ${data.recipeTitle}${data.cuisine ? ` (${data.cuisine} cuisine)` : ""}
Ingredient to swap: ${data.ingredient}
User's pantry: ${pantry}
Dietary constraints (must respect): ${dietary}`;

    try {
      const aiRes = await callChatJSON(systemPrompt, userPrompt);
      if (!aiRes.ok) return { ok: false, error: aiRes.error };
      const parsed = responseSchema.safeParse(aiRes.json);
      if (!parsed.success) {
        return { ok: false, error: "Couldn't read AI response. Try again." };
      }
      return { ok: true, swaps: parsed.data.swaps };
    } catch (err) {
      console.error("swapIngredient failed", err);
      return { ok: false, error: "Something went wrong. Try again." };
    }
  });