import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FREE_DAILY_LIMIT = 5;

export const getReceipeUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ sinceIso: z.string().datetime() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { count, error } = await supabase
      .from("recipe_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", data.sinceIso);
    if (error) {
      console.error("getReceipeUsage failed", error);
      return { used: 0, limit: FREE_DAILY_LIMIT };
    }
    return { used: count ?? 0, limit: FREE_DAILY_LIMIT };
  });
