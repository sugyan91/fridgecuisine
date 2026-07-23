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
    const { hashKey, getCached, putCached, normalizeForCacheKey } = await import("./ai-cache.server");
    const cacheKey = hashKey("substitutions", {
      ingredient: normalizeForCacheKey(data.ingredient),
      cuisine: normalizeForCacheKey(data.cuisine ?? ""),
    });
    const cached = await getCached<{ subs: Substitution[] }>("substitutions", cacheKey);
    if (cached) return cached;

    const { callChatJSON } = await import("./hf-client.server");
    const system =
      'Professional cook. Suggest 3 practical pantry substitutions. JSON only: {"subs":[{"swap":str(<60),"ratio":str(<40,e.g. "1:1"),"note":str(<120,tradeoff)}]}';
    const user = `Ingredient: ${data.ingredient}${data.recipeTitle ? ` | Recipe: ${data.recipeTitle}` : ""}${data.cuisine ? ` | Cuisine: ${data.cuisine}` : ""}`;

    const res = await callChatJSON(system, user, { maxTokens: 220, temperature: 0.2 });
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
    if (subs.length > 0) await putCached("substitutions", cacheKey, { subs }, 90);
    return { subs };
  });