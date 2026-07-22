import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Substitution = {
  swap: string;
  ratio: string;
  note: string;
};

export const suggestSubstitutions = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        ingredient: z.string().trim().min(1).max(200),
        recipeTitle: z.string().trim().max(200).optional(),
        cuisine: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ subs: Substitution[] }> => {
    const { callChatJSON } = await import("./hf-client.server");
    const system =
      "You are a professional cook. Given an ingredient in a recipe, suggest 3 practical " +
      "substitutions a home cook might have. Reply ONLY with valid JSON.";
    const user = JSON.stringify({
      ingredient: data.ingredient,
      recipeTitle: data.recipeTitle,
      cuisine: data.cuisine,
      instructions: [
        "Return JSON: {\"subs\": [{ \"swap\": string, \"ratio\": string, \"note\": string }, ... 3 items]}.",
        "swap: the replacement ingredient (max 60 chars).",
        "ratio: the amount to use vs the original (max 40 chars). e.g. '1:1', '¾ cup per 1 cup'.",
        "note: one line on flavor/texture tradeoff (max 120 chars).",
        "Prefer common pantry items. Skip weird or hard-to-find swaps.",
      ],
    });

    const res = await callChatJSON(system, user, { maxTokens: 400, temperature: 0.3 });
    if (!res.ok) return { subs: [] };
    const parsed = res.json as { subs?: unknown };
    if (!Array.isArray(parsed.subs)) return { subs: [] };
    const subs: Substitution[] = [];
    for (const s of parsed.subs) {
      if (
        s &&
        typeof s === "object" &&
        typeof (s as { swap?: unknown }).swap === "string" &&
        typeof (s as { ratio?: unknown }).ratio === "string" &&
        typeof (s as { note?: unknown }).note === "string"
      ) {
        const item = s as { swap: string; ratio: string; note: string };
        subs.push({
          swap: item.swap.slice(0, 80),
          ratio: item.ratio.slice(0, 60),
          note: item.note.slice(0, 160),
        });
      }
      if (subs.length >= 3) break;
    }
    return { subs };
  });