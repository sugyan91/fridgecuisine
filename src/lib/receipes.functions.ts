import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callChatJSON } from "./hf-client.server";
import { SUPPORTED_LANGUAGE_NAMES, languageInstruction } from "./language";

const inputSchema = z.object({
  ingredients: z
    .array(z.string().trim().min(1).max(40))
    .max(30)
    .default([]),
  dietary: z.array(z.string().max(40)).max(10).default([]),
  cuisine: z.string().min(1).max(40),
  exclude: z.array(z.string().max(120)).max(60).default([]),
  language: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v && SUPPORTED_LANGUAGE_NAMES.includes(v) ? v : "English")),
});

export type Receipe = {
  title: string;
  blurb: string;
  cookTimeMinutes: number;
  prepTimeMinutes?: number;
  totalTimeMinutes?: number;
  cuisine: string;
  usedIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  stepTimings?: number[];
  substitutions: string[];
  dietary: string[];
};

export type GenerateReceipesResult =
  | { ok: true; receipes: Receipe[] }
  | {
      ok: false;
      error: string;
      code?: "rate_limit" | "credits" | "validation" | "server";
    };

const responseSchema = z.object({
  receipes: z
    .array(
      z.object({
        title: z.string(),
        blurb: z.string(),
        cookTimeMinutes: z.number(),
        prepTimeMinutes: z.number().optional(),
        totalTimeMinutes: z.number().optional(),
        cuisine: z.string(),
        usedIngredients: z.array(z.string()).default([]),
        missingIngredients: z.array(z.string()).default([]),
        steps: z.array(z.string()).min(1),
        stepTimings: z.array(z.number()).optional(),
        substitutions: z.array(z.string()).default([]),
        dietary: z.array(z.string().max(40)).max(6).default([]),
      })
    )
    .min(1)
    .max(10),
});

export const generateReceipes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<GenerateReceipesResult> => {
    const hasIngredients = data.ingredients.length > 0;
    const cuisineGuidance =
      data.cuisine === "Any / Surprise Me"
        ? hasIngredients
          ? "Pick cuisines that best match the ingredients provided — be creative and global. Mix up regions so the 10 receipes span different parts of the world."
          : "Surprise the user with 10 iconic, beloved receipes from ALL OVER THE WORLD. Span different continents and cuisines (e.g. Asian, European, African, Latin American, Middle Eastern) — no two receipes from the same country."
        : `Use authentic techniques and flavor profiles for ${data.cuisine} cuisine.`;

    const dietary = data.dietary.length
      ? data.dietary.join(", ")
      : "no restrictions";

    const ingredientRule = hasIngredients
      ? `Use as many of the user's ingredients as possible.\n- It's OK to require 1-3 missing pantry staples (oil, salt, common spices) - list them in missingIngredients.`
      : `The user has not listed any pantry ingredients. Generate 10 classic, iconic, beloved receipes for the selected cuisine using common pantry staples. List all ingredients in missingIngredients.`;

    const systemPrompt = `You are an expert home cook. Generate 10 realistic, delicious receipes${hasIngredients ? " the user can cook with mostly the ingredients they have on hand" : " for the selected cuisine"}. ${cuisineGuidance}
Rules:
- ${ingredientRule}
- Steps must be concrete and ordered (4-8 short steps).
- cookTimeMinutes must be realistic (5-90) — active cooking time only.
- ALSO provide: prepTimeMinutes (chopping/measuring/marinating), totalTimeMinutes (prep + cook), and stepTimings — an array of integer minutes per step, SAME LENGTH as steps. If a step is instant, use 1.
- Honor dietary constraints STRICTLY: ${dietary}. Every single receipe MUST comply with ALL listed dietary tags. Treat each tag as a hard allergy/diet constraint — if a tag names an ingredient or food family (e.g. "Peanut allergy", "No shellfish", "No mushrooms", "Lactose intolerant"), exclude that ingredient AND its derivatives/cross-contaminants entirely, and mention a safe swap in "substitutions". If a tag is "Vegan", use zero animal products (no meat, fish, dairy, eggs, honey). If "Vegetarian", no meat or fish. If "Gluten-Free", no wheat/barley/rye/soy sauce. If "Dairy-Free", no milk/butter/cheese/yogurt/ghee. If "Halal" or "Kosher", strictly follow rules. Discard any receipe that would violate a tag — do not include it.
- If "Quick Meal" is selected, all receipes must be <= 20 minutes.
- For every receipe, set "dietary" to the list of applicable short tags from: "Vegan", "Vegetarian", "Pescatarian", "Gluten-Free", "Dairy-Free", "Nut-Free", "Halal", "Kosher", "Contains Pork", "Contains Nuts", "Spicy". Include any user-selected dietary tags that apply, plus any other tags that are obviously true for the dish. Max 6 tags. Use [] if none apply.
- Return ONLY valid JSON matching the schema. No prose.${languageInstruction(data.language)}`;

    const excludeBlock = data.exclude.length
      ? `\n\nDo NOT repeat or closely resemble these receipes already shown:\n- ${data.exclude.join("\n- ")}`
      : "";

    const userPrompt = `Ingredients on hand: ${hasIngredients ? data.ingredients.join(", ") : "(none — user has not specified any)"}
Cuisine preference: ${data.cuisine}
Dietary: ${dietary}${excludeBlock}

Return JSON shaped exactly like:
{
  "receipes": [
    {
      "title": "string",
      "blurb": "one-sentence description",
      "cookTimeMinutes": 25,
      "prepTimeMinutes": 10,
      "totalTimeMinutes": 35,
      "cuisine": "Nepali",
      "usedIngredients": ["..."],
      "missingIngredients": ["..."],
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

      return { ok: true, receipes: result.data.receipes };
    } catch (err) {
      console.error("generateReceipes failed", err);
      return { ok: false, error: "Something went wrong. Try again.", code: "server" };
    }
  });
