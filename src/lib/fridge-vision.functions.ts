import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callVisionJSON } from "./hf-client.server";

const inputSchema = z.object({
  imageDataUrl: z
    .string()
    .min(32)
    .max(2_000_000)
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/i, "Must be a base64 image data URL"),
});

const responseSchema = z.object({
  ingredients: z.array(z.string().min(1).max(40)).min(0).max(25),
});

export type FridgeVisionResult =
  | { ok: true; ingredients: string[] }
  | { ok: false; error: string };

export const detectFridgeIngredients = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<FridgeVisionResult> => {
    const systemPrompt = `You identify edible food ingredients visible in a photo of a fridge, pantry, or kitchen counter.
Rules:
- List only items that could be cooked with (vegetables, fruit, dairy, meat, eggs, condiments, herbs, packaged goods).
- Skip non-food items (containers, shelves, drinks like soda unless clearly a cooking liquid).
- Use short common English names, Title Case (e.g. "Tomato", "Greek Yogurt", "Bell Pepper").
- Deduplicate. Max 20 items.
- Return ONLY valid JSON: { "ingredients": ["..."] }. No prose.`;

    const userPrompt = `What ingredients can you see? Return JSON: { "ingredients": ["Tomato", "Eggs", ...] }`;

    try {
      const res = await callVisionJSON(systemPrompt, userPrompt, data.imageDataUrl);
      if (!res.ok) return { ok: false, error: res.error };
      const parsed = responseSchema.safeParse(res.json);
      if (!parsed.success) return { ok: false, error: "AI returned unexpected format." };
      // Light cleanup: trim, dedupe case-insensitively, drop empties.
      const seen = new Set<string>();
      const cleaned: string[] = [];
      for (const raw of parsed.data.ingredients) {
        const v = raw.trim();
        if (!v) continue;
        const key = v.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        cleaned.push(v);
      }
      return { ok: true, ingredients: cleaned };
    } catch (err) {
      console.error("detectFridgeIngredients failed", err);
      return { ok: false, error: "Something went wrong. Try again." };
    }
  });