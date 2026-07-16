import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PromoCode = {
  id: string;
  code: string;
  discount_type: "percent" | "amount";
  discount_value: number;
  currency: string;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type PromoValidation =
  | { ok: true; id: string; discount_type: "percent" | "amount"; discount_value: number; discount_cents: number; final_cents: number }
  | { ok: false; error: string };

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export const listMyPromoCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PromoCode[]> => {
    const { data, error } = await context.supabase
      .from("promo_codes")
      .select("id, code, discount_type, discount_value, currency, max_uses, uses_count, active, expires_at, created_at")
      .eq("chef_user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as PromoCode[];
  });

export const upsertPromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        code: z.string().min(3).max(40),
        discount_type: z.enum(["percent", "amount"]),
        discount_value: z.number().int().positive(),
        max_uses: z.number().int().positive().optional().nullable(),
        active: z.boolean().default(true),
        expires_at: z.string().datetime().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ id: string } | { error: string }> => {
    const code = normalizeCode(data.code);
    if (!/^[A-Z0-9_-]+$/.test(code)) return { error: "Code must be letters, numbers, - or _" };
    if (data.discount_type === "percent" && (data.discount_value < 1 || data.discount_value > 100)) {
      return { error: "Percent discount must be 1-100" };
    }
    const row = {
      chef_user_id: context.userId,
      code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      max_uses: data.max_uses ?? null,
      active: data.active,
      expires_at: data.expires_at ?? null,
    };
    if (data.id) {
      const { data: updated, error } = await context.supabase
        .from("promo_codes")
        .update(row)
        .eq("id", data.id)
        .eq("chef_user_id", context.userId)
        .select("id")
        .maybeSingle();
      if (error) return { error: error.message };
      if (!updated) return { error: "Promo code not found" };
      return { id: updated.id };
    }
    const { data: inserted, error } = await context.supabase
      .from("promo_codes")
      .insert(row)
      .select("id")
      .maybeSingle();
    if (error) {
      if (error.message.includes("duplicate")) return { error: "You already have a code with that name" };
      return { error: error.message };
    }
    return { id: inserted!.id };
  });

export const deletePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { error } = await context.supabase
      .from("promo_codes")
      .delete()
      .eq("id", data.id)
      .eq("chef_user_id", context.userId);
    if (error) return { error: error.message };
    return { ok: true };
  });

/**
 * Public: validate a chef-scoped promo code against a price. Used by buyers
 * on the recipe/cookbook checkout page to preview the discount.
 */
export const validatePromoCode = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        chef_user_id: z.string().uuid(),
        code: z.string().min(1).max(64),
        price_cents: z.number().int().positive(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<PromoValidation> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = normalizeCode(data.code);
    const { data: row } = await supabaseAdmin
      .from("promo_codes")
      .select("id, discount_type, discount_value, active, expires_at, max_uses, uses_count")
      .eq("chef_user_id", data.chef_user_id)
      .eq("code", code)
      .maybeSingle();
    if (!row) return { ok: false, error: "Invalid code" };
    if (!row.active) return { ok: false, error: "Code is inactive" };
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false, error: "Code has expired" };
    }
    if (row.max_uses !== null && row.uses_count >= row.max_uses) {
      return { ok: false, error: "Code fully redeemed" };
    }
    const discount_cents =
      row.discount_type === "percent"
        ? Math.floor((data.price_cents * row.discount_value) / 100)
        : Math.min(row.discount_value, data.price_cents);
    const final_cents = Math.max(0, data.price_cents - discount_cents);
    return {
      ok: true,
      id: row.id,
      discount_type: row.discount_type as "percent" | "amount",
      discount_value: row.discount_value,
      discount_cents,
      final_cents,
    };
  });