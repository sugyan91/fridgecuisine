import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const receipeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  blurb: z.string().max(2000).optional().default(""),
  cookTimeMinutes: z.number().int().min(0).max(1000).optional(),
  prepTimeMinutes: z.number().int().min(0).max(1000).optional(),
  totalTimeMinutes: z.number().int().min(0).max(2000).optional(),
  cuisine: z.string().max(80).optional(),
  usedIngredients: z.array(z.string().max(120)).max(60).optional(),
  missingIngredients: z.array(z.string().max(120)).max(60).optional(),
  steps: z.array(z.string().max(2000)).max(40).optional(),
  stepTimings: z.array(z.number().int().min(0).max(600)).max(40).optional(),
  substitutions: z.array(z.string().max(400)).max(40).optional(),
  dietary: z.array(z.string().max(40)).max(10).optional(),
  tips: z.array(z.string().max(400)).max(20).optional(),
  serves: z.string().max(40).optional(),
}).passthrough();

export type SharedReceipeData = z.infer<typeof receipeSchema>;

export type SharedReceipeRow = {
  slug: string;
  title: string;
  cuisine: string | null;
  recipe: SharedReceipeData;
  view_count: number;
  created_at: string;
};

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/1/l/o
function makeSlug(len = 8): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

export const createSharedReceipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ receipe: receipeSchema }).parse(input))
  .handler(async ({ data, context }): Promise<{ slug: string }> => {
    const { supabase, userId } = context;
    const r = data.receipe;

    // Try a few slugs in case of collision (very unlikely with 32^8 space).
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = makeSlug(8);
      const { error } = await supabase.from("shared_recipes").insert({
        slug,
        created_by: userId,
        title: r.title,
        cuisine: r.cuisine ?? null,
        recipe: r as never,
      });
      if (!error) return { slug };
      // 23505 = unique_violation
      if ((error as { code?: string }).code !== "23505") {
        throw new Error(error.message);
      }
    }
    throw new Error("Couldn't generate a unique share link, please try again.");
  });

export const getSharedReceipe = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ slug: z.string().min(4).max(32).regex(/^[a-z0-9]+$/) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ row: SharedReceipeRow } | { row: null }> => {
    const { data: row, error } = await supabaseAdmin
      .from("shared_recipes")
      .select("slug, title, cuisine, recipe, view_count, created_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { row: null };

    // Best-effort view count bump.
    supabaseAdmin
      .from("shared_recipes")
      .update({ view_count: (row.view_count ?? 0) + 1 })
      .eq("slug", data.slug)
      .then(() => undefined, () => undefined);

    return { row: row as unknown as SharedReceipeRow };
  });
