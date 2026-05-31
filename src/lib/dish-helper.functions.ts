import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callChatJSON } from "./hf-client.server";
import { SUPPORTED_LANGUAGE_NAMES, languageInstruction } from "./language";

const inputSchema = z.object({
  dish: z.string().trim().min(2).max(200),
  language: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && SUPPORTED_LANGUAGE_NAMES.includes(v) ? v : "English")),
});

const responseSchema = z.object({
  dishName: z.string(),
  ingredients: z.array(z.string()).min(1).max(40),
  recipe: z.object({
    cookTimeMinutes: z.number(),
    prepTimeMinutes: z.number().optional(),
    totalTimeMinutes: z.number().optional(),
    serves: z.string().optional().default(""),
    steps: z.array(z.string()).min(1).max(20),
    stepTimings: z.array(z.number()).optional(),
    tips: z.array(z.string()).default([]),
  }),
});

export type DishHelperResult =
  | { ok: true; data: z.infer<typeof responseSchema> }
  | { ok: false; error: string };

export const getDishHelper = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<DishHelperResult> => {
    const systemPrompt = `You are an expert global chef. Given a dish name (any cuisine, any style), return its ingredients AND a clean home-cook recipe.
Rules:
- Use authentic ingredients and techniques for the dish's cuisine.
- Ingredients list should be specific (with quantities for a typical serving) and complete.
- Steps should be concrete, ordered, 4-12 short steps.
- ALSO provide: prepTimeMinutes (chopping/measuring), totalTimeMinutes (prep + cook), and stepTimings — an array of integer minutes per step, SAME LENGTH as steps. Use 1 if a step is near-instant.
- Return ONLY valid JSON matching the schema. No prose.${languageInstruction(data.language)}`;

    const userPrompt = `Dish: ${data.dish}

Return JSON shaped exactly like:
{
  "dishName": "string",
  "ingredients": ["2 cups all-purpose flour", "1 tsp salt", "..."],
  "recipe": {
    "cookTimeMinutes": 45,
    "prepTimeMinutes": 15,
    "totalTimeMinutes": 60,
    "serves": "4",
    "steps": ["step 1", "step 2"],
    "stepTimings": [5, 10],
    "tips": ["optional tip"]
  }
}`;

    try {
      const aiRes = await callChatJSON(systemPrompt, userPrompt);
      if (!aiRes.ok) return { ok: false, error: aiRes.error };
      const result = responseSchema.safeParse(aiRes.json);
      if (!result.success) return { ok: false, error: "AI returned an unexpected format." };
      return { ok: true, data: result.data };
    } catch (err) {
      console.error("getDishHelper failed", err);
      return { ok: false, error: "Something went wrong. Try again." };
    }
  });