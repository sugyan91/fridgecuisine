import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callImageGen } from "./hf-client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkAiQuota, recordAiGeneration } from "./ai-quota.server";

const inputSchema = z.object({
  dishName: z.string().trim().min(2).max(200),
  cuisine: z.string().trim().max(80).optional(),
});

export type RecipeImageResult =
  | { ok: true; dataUrl: string; provider: "huggingface" | "lovable" }
  | { ok: false; error: string };

export const generateRecipeImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data, context }): Promise<RecipeImageResult> => {
    const { supabase, userId } = context;
    const quota = await checkAiQuota(supabase, userId);
    if (!quota.ok) return { ok: false, error: quota.error };
    const cuisinePart = data.cuisine ? `, ${data.cuisine} cuisine` : "";
    const prompt = `Professional overhead food photography of ${data.dishName}${cuisinePart}. Natural lighting, shallow depth of field, rustic wooden table, garnished and plated beautifully, appetizing, high detail, vibrant colors, magazine quality.`;
    const res = await callImageGen(prompt);
    if (res.ok) await recordAiGeneration(supabase, userId);
    return res;
  });