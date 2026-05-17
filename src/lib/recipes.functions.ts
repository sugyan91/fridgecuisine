import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  ingredients: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Add at least one ingredient")
    .max(30),
  dietary: z.array(z.string().max(40)).max(10).default([]),
  cuisine: z.string().min(1).max(40),
  exclude: z.array(z.string().max(120)).max(60).default([]),
});

export type Recipe = {
  title: string;
  blurb: string;
  cookTimeMinutes: number;
  cuisine: string;
  usedIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  substitutions: string[];
};

export type GenerateRecipesResult =
  | { ok: true; recipes: Recipe[] }
  | {
      ok: false;
      error: string;
      code?: "rate_limit" | "credits" | "validation" | "server";
    };

const responseSchema = z.object({
  recipes: z
    .array(
      z.object({
        title: z.string(),
        blurb: z.string(),
        cookTimeMinutes: z.number(),
        cuisine: z.string(),
        usedIngredients: z.array(z.string()).default([]),
        missingIngredients: z.array(z.string()).default([]),
        steps: z.array(z.string()).min(1),
        substitutions: z.array(z.string()).default([]),
      })
    )
    .min(1)
    .max(10),
});

export const generateRecipes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<GenerateRecipesResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "AI service not configured.", code: "server" };
    }

    const cuisineGuidance =
      data.cuisine === "Any / Surprise Me"
        ? "Pick cuisines that best match the ingredients provided — be creative and global."
        : `Use authentic techniques and flavor profiles for ${data.cuisine} cuisine.`;

    const dietary = data.dietary.length
      ? data.dietary.join(", ")
      : "no restrictions";

    const systemPrompt = `You are an expert home cook. Generate 10 realistic, delicious recipes the user can cook with mostly the ingredients they have on hand. ${cuisineGuidance}
Rules:
- Use as many of the user's ingredients as possible.
- It's OK to require 1-3 missing pantry staples (oil, salt, common spices) - list them in missingIngredients.
- Steps must be concrete and ordered (4-8 short steps).
- cookTimeMinutes must be realistic (5-90).
- Honor dietary constraints STRICTLY: ${dietary}. Every single recipe MUST comply with ALL listed dietary tags. If a tag is "Vegan", use zero animal products (no meat, fish, dairy, eggs, honey). If "Vegetarian", no meat or fish. If "Gluten-Free", no wheat/barley/rye/soy sauce. If "Dairy-Free", no milk/butter/cheese/yogurt/ghee. If "Halal" or "Kosher", strictly follow rules. Discard any recipe that would violate a tag — do not include it.
- If "Quick Meal" is selected, all recipes must be <= 20 minutes.
- Return ONLY valid JSON matching the schema. No prose.`;

    const excludeBlock = data.exclude.length
      ? `\n\nDo NOT repeat or closely resemble these recipes already shown:\n- ${data.exclude.join("\n- ")}`
      : "";

    const userPrompt = `Ingredients on hand: ${data.ingredients.join(", ")}
Cuisine preference: ${data.cuisine}
Dietary: ${dietary}${excludeBlock}

Return JSON shaped exactly like:
{
  "recipes": [
    {
      "title": "string",
      "blurb": "one-sentence description",
      "cookTimeMinutes": 25,
      "cuisine": "Nepali",
      "usedIngredients": ["..."],
      "missingIngredients": ["..."],
      "steps": ["step 1", "step 2"],
      "substitutions": ["No paneer? Use tofu."]
    }
  ]
}`;

    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
          }),
        }
      );

      if (res.status === 429) {
        return {
          ok: false,
          error: "Too many requests - please wait a moment and try again.",
          code: "rate_limit",
        };
      }
      if (res.status === 402) {
        return {
          ok: false,
          error:
            "AI credits exhausted. Add credits in Settings -> Workspace -> Usage.",
          code: "credits",
        };
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("AI gateway error", res.status, txt);
        return {
          ok: false,
          error: `AI service error (${res.status}).`,
          code: "server",
        };
      }

      const payload = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = payload.choices?.[0]?.message?.content ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) {
          return {
            ok: false,
            error: "AI returned an invalid response. Try again.",
            code: "server",
          };
        }
        parsed = JSON.parse(match[0]);
      }

      const result = responseSchema.safeParse(parsed);
      if (!result.success) {
        console.error("Schema mismatch", result.error.flatten());
        return {
          ok: false,
          error: "AI returned an unexpected format. Try again.",
          code: "server",
        };
      }

      return { ok: true, recipes: result.data.recipes };
    } catch (err) {
      console.error("generateRecipes failed", err);
      return { ok: false, error: "Something went wrong. Try again.", code: "server" };
    }
  });
