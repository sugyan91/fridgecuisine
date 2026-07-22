import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callChatJSON } from "./hf-client.server";
import { SUPPORTED_LANGUAGE_NAMES, languageInstruction } from "./language";
import { tryGetSupabaseUser } from "./optional-auth.server";
import { checkAiQuota, recordAiGeneration } from "./ai-quota.server";
import { checkAnonQuota, recordAnonGeneration } from "./anon-tracking.server";
import { resolveAnonContext } from "./anon-tracking.server";
import { logAiUsage } from "./ai-usage-logging.server";

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
  dietary: z.array(z.string().max(40)).max(8).default([]),
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

    const { hashKey, getCached, putCached } = await import("./ai-cache.server");
    const norm = {
      dish: data.dish.toLowerCase().trim(),
      dietary: [...(data.dietary ?? [])]
        .map((s) => s.toLowerCase().trim())
        .sort(),
      language: data.language,
    };
    const cacheKey = hashKey("dish-helper", norm);
    type CachedDish = z.infer<typeof responseSchema>;
    const cached = await getCached<CachedDish>("dish-helper", cacheKey);
    if (cached) {
      if (auth) await recordAiGeneration(auth.supabase, auth.userId);
      else if (anonFingerprint) await recordAnonGeneration(anonFingerprint);
      logAiUsage({
        endpoint: "dish-helper",
        userId: auth?.userId ?? null,
        fingerprint: anonFingerprint,
        ipHash: auth ? null : safeAnonIpHash(),
        cacheHit: true,
      });
      return { ok: true, data: cached };
    }

    const dietaryLine =
      data.dietary && data.dietary.length > 0
        ? `\n- DIETARY STRICT: ${data.dietary.join(", ")}. Substitute/omit as needed.`
        : "";
    const systemPrompt = `You are an expert global chef. Given a dish, return authentic ingredients and a home-cook recipe.${dietaryLine}
- Ingredients: specific with quantities for a typical serving.
- 4-10 concrete ordered steps. Include cookTimeMinutes, prepTimeMinutes, totalTimeMinutes, integer servings (1-12).
- Include "nutrition":{servings, perServing:{calories,proteinG,carbsG,fatG,sugarG,fiberG}} — integer estimates.
- Set "dietary" to applicable short tags from: Vegan, Vegetarian, Pescatarian, Gluten-Free, Dairy-Free, Nut-Free, Halal, Kosher, Contains Pork, Contains Nuts, Spicy, Keto, Low-Carb, High Protein, Quick Meal. Max 6.
- Return ONLY valid JSON.${languageInstruction(data.language)}`;

    const userPrompt = `Dish: ${data.dish}

Return JSON shaped like:
{
  "dishName": "string",
  "ingredients": ["2 cups flour","1 tsp salt"],
  "dietary": ["Vegetarian"],
  "recipe": {
    "cookTimeMinutes": 45,
    "prepTimeMinutes": 15,
    "totalTimeMinutes": 60,
    "servings": 4,
    "steps": ["step 1","step 2"],
    "nutrition": { "servings": 4, "perServing": { "calories": 520, "proteinG": 28, "carbsG": 60, "fatG": 18, "sugarG": 6, "fiberG": 4 } }
  }
}`;

    try {
      const aiRes = await callChatJSON(systemPrompt, userPrompt, { maxTokens: 1200, temperature: 0.3 });
      if (!aiRes.ok) return { ok: false, error: aiRes.error };
      const result = responseSchema.safeParse(aiRes.json);
      if (!result.success) return { ok: false, error: "AI returned an unexpected format." };
      if (auth) await recordAiGeneration(auth.supabase, auth.userId);
      else if (anonFingerprint) await recordAnonGeneration(anonFingerprint);
      await putCached("dish-helper", cacheKey, result.data, 90);
      logAiUsage({
        endpoint: "dish-helper",
        userId: auth?.userId ?? null,
        fingerprint: anonFingerprint,
        ipHash: auth ? null : safeAnonIpHash(),
        cacheHit: false,
      });
      return { ok: true, data: result.data };
    } catch (err) {
      console.error("getDishHelper failed", err);
      return { ok: false, error: "Something went wrong. Try again." };
    }
  });

function safeAnonIpHash(): string | null {
  try { return resolveAnonContext().ipHash || null; } catch { return null; }
}