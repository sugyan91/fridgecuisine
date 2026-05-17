import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  dish: z.string().trim().min(2).max(200),
});

const responseSchema = z.object({
  dishName: z.string(),
  ingredients: z.array(z.string()).min(1).max(40),
  recipe: z.object({
    cookTimeMinutes: z.number(),
    serves: z.string().optional().default(""),
    steps: z.array(z.string()).min(1).max(20),
    tips: z.array(z.string()).default([]),
  }),
});

export type DishHelperResult =
  | { ok: true; data: z.infer<typeof responseSchema> }
  | { ok: false; error: string };

export const getDishHelper = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<DishHelperResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, error: "AI service not configured." };

    const systemPrompt = `You are an expert global chef. Given a dish name (any cuisine, any style), return its ingredients AND a clean home-cook recipe.
Rules:
- Use authentic ingredients and techniques for the dish's cuisine.
- Ingredients list should be specific (with quantities for a typical serving) and complete.
- Steps should be concrete, ordered, 4-12 short steps.
- Return ONLY valid JSON matching the schema. No prose.`;

    const userPrompt = `Dish: ${data.dish}

Return JSON shaped exactly like:
{
  "dishName": "string",
  "ingredients": ["2 cups all-purpose flour", "1 tsp salt", "..."],
  "recipe": {
    "cookTimeMinutes": 45,
    "serves": "4",
    "steps": ["step 1", "step 2"],
    "tips": ["optional tip"]
  }
}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      });

      if (res.status === 429) return { ok: false, error: "Too many requests — try again in a moment." };
      if (res.status === 402) return { ok: false, error: "AI credits exhausted." };
      if (!res.ok) return { ok: false, error: `AI service error (${res.status}).` };

      const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content ?? "";
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (!m) return { ok: false, error: "AI returned invalid response." };
        parsed = JSON.parse(m[0]);
      }
      const result = responseSchema.safeParse(parsed);
      if (!result.success) return { ok: false, error: "AI returned an unexpected format." };
      return { ok: true, data: result.data };
    } catch (err) {
      console.error("getDishHelper failed", err);
      return { ok: false, error: "Something went wrong. Try again." };
    }
  });