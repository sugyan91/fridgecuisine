import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const tagArray = z.array(z.string().trim().min(1).max(40).regex(/^[\p{L}0-9 ()/&'\-]+$/u)).max(50);

export const getUserPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_preferences")
      .select("custom_dietary, custom_cuisines, allergies, disliked_ingredients, default_servings, spice_level")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      custom_dietary: data?.custom_dietary ?? [],
      custom_cuisines: data?.custom_cuisines ?? [],
      allergies: data?.allergies ?? [],
      disliked_ingredients: data?.disliked_ingredients ?? [],
      default_servings: data?.default_servings ?? null,
      spice_level: data?.spice_level ?? null,
    };
  });

export const saveUserPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        custom_dietary: tagArray.optional(),
        custom_cuisines: tagArray.optional(),
        allergies: tagArray.optional(),
        disliked_ingredients: tagArray.optional(),
        default_servings: z.number().int().min(1).max(20).nullable().optional(),
        spice_level: z.enum(["mild", "medium", "spicy", "extra-spicy"]).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload: Record<string, unknown> = { user_id: userId };
    if (data.custom_dietary !== undefined) payload.custom_dietary = data.custom_dietary;
    if (data.custom_cuisines !== undefined) payload.custom_cuisines = data.custom_cuisines;
    if (data.allergies !== undefined) payload.allergies = data.allergies;
    if (data.disliked_ingredients !== undefined) payload.disliked_ingredients = data.disliked_ingredients;
    if (data.default_servings !== undefined) payload.default_servings = data.default_servings;
    if (data.spice_level !== undefined) payload.spice_level = data.spice_level;
    const { error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
