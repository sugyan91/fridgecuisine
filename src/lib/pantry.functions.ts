import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PantryItem = {
  id: string;
  name: string;
  quantity: string | null;
  expires_at: string | null;
  created_at: string;
};

const nameSchema = z.string().trim().min(1).max(60);

export const listPantry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: PantryItem[] }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("pantry_items")
      .select("id, name, quantity, expires_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as PantryItem[] };
  });

export const addPantryItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        items: z
          .array(
            z.object({
              name: nameSchema,
              quantity: z.string().trim().max(40).optional().nullable(),
              expires_at: z
                .string()
                .regex(/^\d{4}-\d{2}-\d{2}$/)
                .optional()
                .nullable(),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rows = data.items.map((i) => ({
      user_id: userId,
      name: i.name,
      quantity: i.quantity ?? null,
      expires_at: i.expires_at ?? null,
    }));
    const { error } = await supabase
      .from("pantry_items")
      .upsert(rows, { onConflict: "user_id,name", ignoreDuplicates: false });
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length };
  });

export const removePantryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("pantry_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearPantry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("pantry_items").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });