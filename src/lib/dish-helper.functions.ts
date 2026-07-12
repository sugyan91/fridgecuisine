import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callChatJSON } from "./hf-client.server";
import { SUPPORTED_LANGUAGE_NAMES, languageInstruction } from "./language";
import { tryGetSupabaseUser } from "./optional-auth.server";
import { checkAiQuota, recordAiGeneration } from "./ai-quota.server";
import { checkAnonQuota, recordAnonGeneration } from "./anon-tracking.server";

const inputSchema = z.object({
  dish: z.string().trim().min(2).max(200),
  dietary: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
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
    servings: z.number().int().min(1).max(12).optional(),
    steps: z.array(z.string()).min(1).max(20),
    stepTimings: z.array(z.number()).optional(),
    tips: z.array(z.string()).default([]),
    nutrition: z
      .object({
        servings: z.number().int().min(1).max(12),
        perServing: z.object({
          calories: z.number().int().nonnegative(),
          proteinG: z.number().int().nonnegative(),
          carbsG: z.number().int().nonnegative(),
          fatG: z.number().int().nonnegative(),
          sugarG: z.number().int().nonnegative(),
          fiberG: z.number().int().nonnegative(),
        }),
      })
      .optional(),
  }),
});

export type DishHelperResult =
  | { ok: true; data: z.infer<typeof responseSchema> }
  | { ok: false; error: string };

export const getDishHelper = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<DishHelperResult> => {
    const auth = await tryGetSupabaseUser();
    let anonFingerprint: string | null = null;
    if (auth) {
      const quota = await checkAiQuota(auth.supabase, auth.userId);
      if (!quota.ok) return { ok: false, error: quota.error };
    } else {
      const anon = await checkAnonQuota();
      if (!anon.ok) return { ok: false, error: anon.error };
      anonFingerprint = anon.fingerprint;
    }
    const dietaryLine =
      data.dietary && data.dietary.length > 0
        ? `\n- DIETARY CONSTRAINTS (STRICT — never violate): ${data.dietary.join(", ")}. Substitute or omit ingredients as needed so the recipe fully honors these. If the requested dish fundamentally cannot be adapted, still return the closest faithful adaptation that respects the constraints.`
        : "";
    const systemPrompt = `You are an expert global chef. Given a dish name (any cuisine, any style), return its ingredients AND a clean home-cook recipe.
Rules:
- Use authentic ingredients and techniques for the dish's cuisine.${dietaryLine}
- Ingredients list should be specific (with quantities for a typical serving) and complete.
- Steps should be concrete, ordered, 4-12 short steps.
- ALSO provide: prepTimeMinutes (chopping/measuring), totalTimeMinutes (prep + cook), and stepTimings — an array of integer minutes per step, SAME LENGTH as steps. Use 1 if a step is near-instant.
- SERVINGS: Always include an integer "servings" (1-12) indicating how many people the recipe feeds. "nutrition.servings" MUST equal this value.
- NUTRITION (REQUIRED): Include a "nutrition" object with "servings" (integer matching the recipe's servings) and "perServing" with integer "calories", "proteinG", "carbsG", "fatG", "sugarG", "fiberG". These are APPROXIMATE estimates — do your best, do not pretend precision, but never omit them.
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
    "servings": 4,
    "steps": ["step 1", "step 2"],
    "stepTimings": [5, 10],
    "tips": ["optional tip"],
    "nutrition": {
      "servings": 4,
      "perServing": {
        "calories": 520,
        "proteinG": 28,
        "carbsG": 60,
        "fatG": 18,
        "sugarG": 6,
        "fiberG": 4
      }
    }
  }
}`;

    try {
      const aiRes = await callChatJSON(systemPrompt, userPrompt);
      if (!aiRes.ok) return { ok: false, error: aiRes.error };
      const result = responseSchema.safeParse(aiRes.json);
      if (!result.success) return { ok: false, error: "AI returned an unexpected format." };
      if (auth) await recordAiGeneration(auth.supabase, auth.userId);
      else if (anonFingerprint) await recordAnonGeneration(anonFingerprint);
      return { ok: true, data: result.data };
    } catch (err) {
      console.error("getDishHelper failed", err);
      return { ok: false, error: "Something went wrong. Try again." };
    }
  });