import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { callChatJSON } from "./hf-client.server";
import { SUPPORTED_LANGUAGE_NAMES, languageInstruction } from "./language";
import { checkAiQuota, recordAiGeneration } from "./ai-quota.server";
import { tryGetSupabaseUser } from "./optional-auth.server";
import { checkAnonQuota, recordAnonGeneration } from "./anon-tracking.server";
import { logAiUsage } from "./ai-usage-logging.server";
import { resolveAnonContext } from "./anon-tracking.server";

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
    // (2 recipes/day, server-tracked by fingerprint AND per-IP).
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

    const includeNutrition = data.includeNutrition !== false;
    const nutritionRule = includeNutrition
      ? `\n- Include "nutrition": {servings, perServing:{calories, proteinG, carbsG, fatG, sugarG, fiberG}} — integer approximate estimates.`
      : "";

    const RECIPE_COUNT = 6;
    const systemPrompt = `You are an expert home cook. Generate ${RECIPE_COUNT} realistic, delicious recipes${hasIngredients ? " using mostly the user's ingredients" : " for the selected cuisine"}. ${cuisineGuidance}
Rules:
- ${ingredientRule}
- 4-6 short concrete ordered steps. cookTimeMinutes 5-90 realistic active time.
- Include prepTimeMinutes and totalTimeMinutes. Include integer servings (1-12).
- Every ingredient entry must be "<qty> <unit> <ingredient>" (e.g. "2 cups rice", "1 tsp salt"). Never bare names.${kidFriendlyRule}${nutritionRule}
- Dietary constraints STRICT — must comply with ALL tags: ${dietary}. Treat named foods as hard allergies (exclude derivatives). If "Quick Meal", total ≤ 20 min.
- Set "dietary" to applicable short tags from: Vegan, Vegetarian, Pescatarian, Gluten-Free, Dairy-Free, Nut-Free, Halal, Kosher, Contains Pork, Contains Nuts, Spicy. Max 6. Use [] if none.
- Return ONLY valid JSON. No prose.${languageInstruction(data.language)}`;

    const excludeBlock = data.exclude.length
      ? `\nAvoid: ${data.exclude.slice(0, 20).join("; ")}`
      : "";

    const userPrompt = `Ingredients: ${hasIngredients ? data.ingredients.join(", ") : "(none)"}
Cuisine preference: ${data.cuisine}
Dietary: ${dietary}${excludeBlock}

Return JSON shaped like:
{
  "recipes": [
    {
      "title": "string",
      "blurb": "one-sentence",
      "cookTimeMinutes": 25,
      "prepTimeMinutes": 10,
      "totalTimeMinutes": 35,
      "cuisine": "Nepali",
      "servings": 4,
      "usedIngredients": ["2 cups rice"],
      "missingIngredients": ["1 tbsp ghee"],
      "steps": ["step 1","step 2"],
      "dietary": ["Vegetarian"]
    }
  ]
}`;

    try {
      // Cache key intentionally excludes `exclude` so pagination/refreshes
      // hit cache; excluded titles are filtered client-side after.
      const { hashKey, getCached, putCached } = await import("./ai-cache.server");
      const norm = {
        ingredients: [...data.ingredients].map((s) => s.toLowerCase().trim()).sort(),
        cuisine: data.cuisine.toLowerCase().trim(),
        dietary: [...data.dietary].map((s) => s.toLowerCase().trim()).sort(),
        kidFriendly: !!data.kidFriendly,
        nutrition: includeNutrition,
        language: data.language,
      };
      const cacheKey = hashKey("recipes", norm);
      const cached = await getCached<{ recipes: Recipe[] }>("recipes", cacheKey);
      if (cached) {
        if (auth) await recordAiGeneration(auth.supabase, auth.userId);
        else if (anonFingerprint) await recordAnonGeneration(anonFingerprint);
        logAiUsage({
          endpoint: "recipes",
          userId: auth?.userId ?? null,
          fingerprint: anonFingerprint,
          ipHash: auth ? null : safeAnonIpHash(),
          cacheHit: true,
        });
        return { ok: true, recipes: cached.recipes };
      }
      const aiRes = await callChatJSON(systemPrompt, userPrompt, {
        maxTokens: includeNutrition ? 2400 : 1600,
        temperature: 0.5,
      });
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
      // Pantry-agnostic queries are identical across users → cache longer.
      const ttlDays = hasIngredients ? 30 : 90;
      await putCached("recipes", cacheKey, { recipes: result.data.recipes }, ttlDays);
      logAiUsage({
        endpoint: "recipes",
        userId: auth?.userId ?? null,
        fingerprint: anonFingerprint,
        ipHash: auth ? null : safeAnonIpHash(),
        cacheHit: false,
      });
      return { ok: true, recipes: result.data.recipes };
    } catch (err) {
      console.error("generateRecipes failed", err);
      return { ok: false, error: "Something went wrong. Try again.", code: "server" };
    }
  });

function safeAnonIpHash(): string | null {
  try { return resolveAnonContext().ipHash || null; } catch { return null; }
}
