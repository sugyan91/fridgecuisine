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
      .select("custom_dietary, custom_cuisines")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      custom_dietary: data?.custom_dietary ?? [],
      custom_cuisines: data?.custom_cuisines ?? [],
    };
  });

export const saveUserPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ custom_dietary: tagArray, custom_cuisines: tagArray }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
