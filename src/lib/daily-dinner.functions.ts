import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DailyDinner = {
  title: string;
  blurb: string;
  cuisine: string;
  totalTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  usedIngredients: string[];
  missingIngredients: string[];
  steps: string[];
  reason: string;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export const getDailyDinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ recipe: DailyDinner | null; source: "cache" | "fresh" }> => {
    const { supabase, userId } = context;
    const key = `daily-dinner:${userId}:${todayKey()}`;

    const { data: cached } = await supabase
      .from("ai_result_cache")
      .select("payload, expires_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (cached?.payload && (!cached.expires_at || new Date(cached.expires_at) > new Date())) {
      return { recipe: cached.payload as DailyDinner, source: "cache" };
    }

    const [pantryRes, prefsRes] = await Promise.all([
      supabase.from("pantry_items").select("name").eq("user_id", userId).limit(50),
      supabase
        .from("user_preferences")
        .select("custom_dietary, custom_cuisines, allergies, disliked_ingredients, default_servings, spice_level")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const pantry = (pantryRes.data ?? []).map((r) => r.name).filter(Boolean);
    const prefs = prefsRes.data ?? {
      custom_dietary: [],
      custom_cuisines: [],
      allergies: [],
      disliked_ingredients: [],
      default_servings: null,
      spice_level: null,
    };

    const { callChatJSON } = await import("./hf-client.server");
    const system =
      "You are a personal cook. Recommend ONE dinner for tonight that best matches the user's pantry and preferences. Reply ONLY with valid JSON.";
    const user = JSON.stringify({
      pantry,
      dietary: prefs.custom_dietary,
      allergies: prefs.allergies,
      dislikes: prefs.disliked_ingredients,
      preferredCuisines: prefs.custom_cuisines,
      spiceLevel: prefs.spice_level,
      servings: prefs.default_servings ?? 2,
      today: todayKey(),
      instructions: [
        "Return JSON: {title, blurb, cuisine, totalTimeMinutes(int 5..180), difficulty(easy|medium|hard), usedIngredients[], missingIngredients[], steps[](5-8), reason}.",
        "Prefer pantry items when non-empty. If pantry is empty, pick a beloved dinner that fits preferences.",
        "STRICTLY avoid allergies and dislikes. Respect dietary restrictions. Realistic weeknight dinner.",
        "reason: 1 line explaining why this fits the user today (max 140 chars).",
        "No commentary, JSON only.",
      ],
    });

    const res = await callChatJSON(system, user);
    if (!res.ok) return { recipe: null, source: "fresh" };
    const j = res.json as Record<string, unknown>;

    const asStrArr = (v: unknown, max: number): string[] =>
      Array.isArray(v)
        ? (v.filter((x) => typeof x === "string") as string[]).slice(0, max).map((s) => s.slice(0, 120))
        : [];
    const diff = (v: unknown): "easy" | "medium" | "hard" =>
      v === "easy" || v === "medium" || v === "hard" ? v : "easy";

    const recipe: DailyDinner = {
      title: typeof j.title === "string" ? j.title.slice(0, 80) : "Tonight's dinner",
      blurb: typeof j.blurb === "string" ? j.blurb.slice(0, 240) : "",
      cuisine: typeof j.cuisine === "string" ? j.cuisine.slice(0, 40) : "",
      totalTimeMinutes:
        typeof j.totalTimeMinutes === "number" && isFinite(j.totalTimeMinutes)
          ? Math.max(5, Math.min(180, Math.round(j.totalTimeMinutes)))
          : 30,
      difficulty: diff(j.difficulty),
      usedIngredients: asStrArr(j.usedIngredients, 12),
      missingIngredients: asStrArr(j.missingIngredients, 8),
      steps: asStrArr(j.steps, 10),
      reason: typeof j.reason === "string" ? j.reason.slice(0, 160) : "",
    };

    const expires = new Date();
    expires.setUTCHours(23, 59, 59, 999);
    await supabase.from("ai_result_cache").upsert(
      {
        cache_key: key,
        kind: "daily-dinner",
        payload: recipe as unknown as never,
        expires_at: expires.toISOString(),
      },
      { onConflict: "cache_key" },
    );

    return { recipe, source: "fresh" };
  });

export const refreshDailyDinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const key = `daily-dinner:${userId}:${todayKey()}`;
    await supabase.from("ai_result_cache").delete().eq("cache_key", key);
    return { ok: true };
  });