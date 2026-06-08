import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { callChatJSON } from "./hf-client.server";
import { SUPPORTED_LANGUAGE_NAMES, languageInstruction } from "./language";
import { checkAiQuota, recordAiGeneration } from "./ai-quota.server";
import { tryGetSupabaseUser } from "./optional-auth.server";
import { checkAnonQuota, recordAnonGeneration } from "./anon-tracking.server";

const inputSchema = z.object({
  ingredients: z
    .array(z.string().trim().min(1).max(40))
    .max(30)
    .default([]),
  dietary: z.array(z.string().max(40)).max(10).default([]),
  cuisine: z.string().min(1).max(40),
  exclude: z.array(z.string().max(120)).max(60).default([]),
  kidFriendly: z.boolean().optional().default(false),
  // Kept for backward-compat with existing clients; nutrition is now always on.
  includeNutrition: z.boolean().optional().default(true),
  language: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && SUPPORTED_LANGUAGE_NAMES.includes(v) ? v : "English")),
});

export type Recipe = {
  title: string;
  blurb: string;
  cookTimeMinutes: number;
  prepTimeMinutes?: number;
  totalTimeMinutes?: number;
  cuisine: string;
  servings?: number;
  usedIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  stepTimings?: number[];
  substitutions: string[];
  dietary: string[];
  difficulty?: "easy" | "medium" | "hard";
  kidFriendly?: boolean;
  nutrition?: {
    servings?: number;
    perServing?: {
      calories?: number;
      proteinG?: number;
      carbsG?: number;
      fatG?: number;
      sugarG?: number;
      fiberG?: number;
    };
  };
};

export type GenerateRecipesResult =
  | { ok: true; recipes: Recipe[] }
  | {
      ok: false;
      error: string;
      code?: "rate_limit" | "credits" | "validation" | "server";
      requiresSignIn?: true;
    };

const responseSchema = z.object({
  recipes: z
    .array(
      z.object({
        title: z.string(),
        blurb: z.string(),
        cookTimeMinutes: z.number(),
        prepTimeMinutes: z.number().optional(),
        totalTimeMinutes: z.number().optional(),
        cuisine: z.string(),
        servings: z.number().int().min(1).max(20).optional(),
        usedIngredients: z.array(z.string()).default([]),
        missingIngredients: z.array(z.string()).default([]),
        steps: z.array(z.string()).min(1),
        stepTimings: z.array(z.number()).optional(),
        substitutions: z.array(z.string()).default([]),
        dietary: z.array(z.string().max(40)).max(6).default([]),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        kidFriendly: z.boolean().optional(),
        nutrition: z
          .object({
            servings: z.number().optional(),
            perServing: z
              .object({
                calories: z.number().optional(),
                proteinG: z.number().optional(),
                carbsG: z.number().optional(),
                fatG: z.number().optional(),
                sugarG: z.number().optional(),
                fiberG: z.number().optional(),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .min(1)
    .max(10),
});

export const generateRecipes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<GenerateRecipesResult> => {
    // Support both signed-in users (full quota path) and anonymous callers
    // (1-recipe lifetime "taste", server-tracked by fingerprint).
    const auth = await tryGetSupabaseUser();
    let anonFingerprint: string | null = null;
    if (auth) {
      const req = (() => { try { return getRequest(); } catch { return null; } })();
      const h = req?.headers;
      const signals = {
        ip:
          h?.get("cf-connecting-ip") ||
          h?.get("x-real-ip") ||
          h?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          null,
        userAgent: h?.get("user-agent") ?? null,
      };
      const quota = await checkAiQuota(auth.supabase, auth.userId, signals);
      if (!quota.ok) return { ok: false, error: quota.error, code: quota.code };
    } else {
      const anon = await checkAnonQuota();
      if (!anon.ok) {
        return { ok: false, error: anon.error, code: anon.code, requiresSignIn: true };
      }
      anonFingerprint = anon.fingerprint;
    }
    const hasIngredients = data.ingredients.length > 0;
    const cuisineGuidance =
      data.cuisine === "Any / Surprise Me"
        ? hasIngredients
          ? "Pick cuisines that best match the ingredients provided — be creative and global. Mix up regions so the 10 recipes span different parts of the world."
          : "Surprise the user with 10 iconic, beloved recipes from ALL OVER THE WORLD. Span different continents and cuisines (e.g. Asian, European, African, Latin American, Middle Eastern) — no two recipes from the same country."
        : `Use authentic techniques and flavor profiles for ${data.cuisine} cuisine.`;

    const dietary = data.dietary.length
      ? data.dietary.join(", ")
      : "no restrictions";

    const ingredientRule = hasIngredients
      ? `Use as many of the user's ingredients as possible.\n- It's OK to require 1-3 missing pantry staples (oil, salt, common spices) - list them in missingIngredients.`
      : `The user has not listed any pantry ingredients. Generate 10 classic, iconic, beloved recipes for the selected cuisine using common pantry staples. List all ingredients in missingIngredients.`;

    const kidFriendlyRule = data.kidFriendly
      ? `\n- KID-FRIENDLY MODE: All recipes MUST be kid-approved. Prefer mild flavors, no chili heat, no strong funk (blue cheese, anchovy, fish sauce, strong fermented items), nothing raw (no tartare, no runny eggs unless cooked through), and avoid bitter greens. Hide vegetables in sauces/blends where possible. Favor familiar shapes (meatballs, pasta, pancakes, finger foods). Set "kidFriendly": true on every recipe.`
      : "";

    const nutritionRule = `\n- NUTRITION (REQUIRED): Include a "nutrition" object with "servings" (integer matching top-level servings) and "perServing" with integer "calories", "proteinG", "carbsG", "fatG", "sugarG", "fiberG". These are APPROXIMATE estimates — do your best, do not pretend precision, but never omit them.`;

    const systemPrompt = `You are an expert home cook. Generate 10 realistic, delicious recipes${hasIngredients ? " the user can cook with mostly the ingredients they have on hand" : " for the selected cuisine"}. ${cuisineGuidance}
Rules:
- ${ingredientRule}
- Steps must be concrete and ordered (4-8 short steps).
- cookTimeMinutes must be realistic (5-90) — active cooking time only.
- ALSO provide: prepTimeMinutes (chopping/measuring/marinating), totalTimeMinutes (prep + cook), and stepTimings — an array of integer minutes per step, SAME LENGTH as steps. If a step is instant, use 1.
- SERVINGS: Always include a top-level integer "servings" (1-12) indicating how many people the recipe feeds. If nutrition is included, "nutrition.servings" MUST equal this value.
- INGREDIENTS MUST INCLUDE EXACT QUANTITIES AND UNITS used by the steps. Every entry in usedIngredients and missingIngredients must be formatted as "<quantity> <unit> <ingredient>" — for example "2 cups all-purpose flour", "1 tbsp olive oil", "200 g chicken thighs, diced", "3 cloves garlic, minced", "1/2 tsp salt", "to taste black pepper". Never return a bare ingredient name without an amount. Use metric or US units consistent with the cuisine. Quantities must match the servings count above and be sufficient for the steps to work.
- Set "difficulty" to "easy" (≤25 min total, ≤5 simple steps, basic technique), "medium" (most weeknight cooking), or "hard" (advanced technique, multi-component, or >45 min total).${kidFriendlyRule}${nutritionRule}
- Honor dietary constraints STRICTLY: ${dietary}. Every single recipe MUST comply with ALL listed dietary tags. Treat each tag as a hard allergy/diet constraint — if a tag names an ingredient or food family (e.g. "Peanut allergy", "No shellfish", "No mushrooms", "Lactose intolerant"), exclude that ingredient AND its derivatives/cross-contaminants entirely, and mention a safe swap in "substitutions". If a tag is "Vegan", use zero animal products (no meat, fish, dairy, eggs, honey). If "Vegetarian", no meat or fish. If "Gluten-Free", no wheat/barley/rye/soy sauce. If "Dairy-Free", no milk/butter/cheese/yogurt/ghee. If "Halal" or "Kosher", strictly follow rules. Discard any recipe that would violate a tag — do not include it.
- If "Quick Meal" is selected, all recipes must be <= 20 minutes.
- For every recipe, set "dietary" to the list of applicable short tags from: "Vegan", "Vegetarian", "Pescatarian", "Gluten-Free", "Dairy-Free", "Nut-Free", "Halal", "Kosher", "Contains Pork", "Contains Nuts", "Spicy". Include any user-selected dietary tags that apply, plus any other tags that are obviously true for the dish. Max 6 tags. Use [] if none apply.
- Return ONLY valid JSON matching the schema. No prose.${languageInstruction(data.language)}`;

    const excludeBlock = data.exclude.length
      ? `\n\nDo NOT repeat or closely resemble these recipes already shown:\n- ${data.exclude.join("\n- ")}`
      : "";

    const userPrompt = `Ingredients on hand: ${hasIngredients ? data.ingredients.join(", ") : "(none — user has not specified any)"}
Cuisine preference: ${data.cuisine}
Dietary: ${dietary}${excludeBlock}

Return JSON shaped exactly like:
{
  "recipes": [
    {
      "title": "string",
      "blurb": "one-sentence description",
      "cookTimeMinutes": 25,
      "prepTimeMinutes": 10,
      "totalTimeMinutes": 35,
      "cuisine": "Nepali",
      "servings": 4,
      "usedIngredients": ["2 cups basmati rice", "200 g paneer, cubed"],
      "missingIngredients": ["1 tbsp ghee", "1 tsp cumin seeds", "1/2 tsp salt"],
      "steps": ["step 1", "step 2"],
      "stepTimings": [5, 10],
      "substitutions": ["No paneer? Use tofu."],
      "dietary": ["Vegetarian", "Gluten-Free"]
    }
  ]
}`;

    try {
      const aiRes = await callChatJSON(systemPrompt, userPrompt);
      if (!aiRes.ok) {
        return { ok: false, error: aiRes.error, code: aiRes.code === "parse" ? "server" : aiRes.code };
      }
      const result = responseSchema.safeParse(aiRes.json);
      if (!result.success) {
        console.error("Schema mismatch", result.error.flatten());
        return {
          ok: false,
          error: "AI returned an unexpected format. Try again.",
          code: "server",
        };
      }

      if (auth) await recordAiGeneration(auth.supabase, auth.userId);
      else if (anonFingerprint) await recordAnonGeneration(anonFingerprint);
      return { ok: true, recipes: result.data.recipes };
    } catch (err) {
      console.error("generateRecipes failed", err);
      return { ok: false, error: "Something went wrong. Try again.", code: "server" };
    }
  });
