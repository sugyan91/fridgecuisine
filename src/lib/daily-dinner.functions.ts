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

const MAX_REFRESHES_PER_DAY = 1;

type CachedPayload = {
  recipe: DailyDinner;
  refreshCount: number;
  previousTitles: string[];
};

export type DailyDinnerResult = {
  recipe: DailyDinner | null;
  source: "cache" | "fresh";
  refreshesRemaining: number;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

async function generateRecipe(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  avoidTitles: string[],
): Promise<DailyDinner | null> {
  const [pantryRes, prefsRes] = await Promise.all([
    supabase.from("pantry_items").select("name").eq("user_id", userId).limit(50),
    supabase
      .from("user_preferences")
      .select("custom_dietary, custom_cuisines, allergies, disliked_ingredients, default_servings, spice_level")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const pantry = (pantryRes.data ?? []).map((r: { name: string }) => r.name).filter(Boolean);
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
    avoid: avoidTitles,
    instructions: [
      "Return JSON: {title, blurb, cuisine, totalTimeMinutes(int 5..180), difficulty(easy|medium|hard), usedIngredients[], missingIngredients[], steps[](5-8), reason}.",
      "Prefer pantry items when non-empty. If pantry is empty, pick a beloved dinner that fits preferences.",
      "STRICTLY avoid allergies and dislikes. Respect dietary restrictions. Realistic weeknight dinner.",
      avoidTitles.length
        ? "Do NOT suggest anything similar to items in 'avoid' — pick a clearly different cuisine, protein, or format."
        : "",
      "reason: 1 line explaining why this fits the user today (max 140 chars).",
      "No commentary, JSON only.",
    ].filter(Boolean),
  });

  const res = await callChatJSON(system, user);
  if (!res.ok) return null;
  const j = res.json as Record<string, unknown>;

  const asStrArr = (v: unknown, max: number): string[] =>
    Array.isArray(v)
      ? (v.filter((x) => typeof x === "string") as string[]).slice(0, max).map((s) => s.slice(0, 120))
      : [];
  const diff = (v: unknown): "easy" | "medium" | "hard" =>
    v === "easy" || v === "medium" || v === "hard" ? v : "easy";

  return {
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
}

function endOfUtcDayISO(): string {
  const expires = new Date();
  expires.setUTCHours(23, 59, 59, 999);
  return expires.toISOString();
}

export const getDailyDinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DailyDinnerResult> => {
    const { supabase, userId } = context;
    const key = `daily-dinner:${userId}:${todayKey()}`;

    const { data: cached } = await supabase
      .from("ai_result_cache")
      .select("payload, expires_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (cached?.payload && (!cached.expires_at || new Date(cached.expires_at) > new Date())) {
      const p = cached.payload as unknown as Partial<CachedPayload> & Partial<DailyDinner>;
      // Back-compat: older payloads stored the recipe object directly
      const wrapped: CachedPayload =
        p && typeof p === "object" && "recipe" in p && p.recipe
          ? { recipe: p.recipe as DailyDinner, refreshCount: p.refreshCount ?? 0, previousTitles: p.previousTitles ?? [] }
          : { recipe: p as DailyDinner, refreshCount: 0, previousTitles: [] };
      return {
        recipe: wrapped.recipe,
        source: "cache",
        refreshesRemaining: Math.max(0, MAX_REFRESHES_PER_DAY - wrapped.refreshCount),
      };
    }

    const recipe = await generateRecipe(supabase, userId, []);
    if (!recipe) return { recipe: null, source: "fresh", refreshesRemaining: MAX_REFRESHES_PER_DAY };

    const payload: CachedPayload = { recipe, refreshCount: 0, previousTitles: [] };
    await supabase.from("ai_result_cache").upsert(
      {
        cache_key: key,
        kind: "daily-dinner",
        payload: payload as unknown as never,
        expires_at: endOfUtcDayISO(),
      },
      { onConflict: "cache_key" },
    );

    return { recipe, source: "fresh", refreshesRemaining: MAX_REFRESHES_PER_DAY };
  });

export const refreshDailyDinner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DailyDinnerResult & { limited?: boolean }> => {
    const { supabase, userId } = context;
    const key = `daily-dinner:${userId}:${todayKey()}`;

    const { data: cached } = await supabase
      .from("ai_result_cache")
      .select("payload")
      .eq("cache_key", key)
      .maybeSingle();

    let refreshCount = 0;
    let previousTitles: string[] = [];
    let currentRecipe: DailyDinner | null = null;
    if (cached?.payload) {
      const p = cached.payload as unknown as Partial<CachedPayload> & Partial<DailyDinner>;
      if (p && typeof p === "object" && "recipe" in p && p.recipe) {
        currentRecipe = p.recipe as DailyDinner;
        refreshCount = p.refreshCount ?? 0;
        previousTitles = p.previousTitles ?? [];
      } else {
        currentRecipe = p as DailyDinner;
      }
    }

    if (refreshCount >= MAX_REFRESHES_PER_DAY) {
      return {
        recipe: currentRecipe,
        source: "cache",
        refreshesRemaining: 0,
        limited: true,
      };
    }

    const avoid = [...previousTitles, currentRecipe?.title].filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    );
    const fresh = await generateRecipe(supabase, userId, avoid);
    if (!fresh) {
      return {
        recipe: currentRecipe,
        source: "cache",
        refreshesRemaining: MAX_REFRESHES_PER_DAY - refreshCount,
      };
    }

    const payload: CachedPayload = {
      recipe: fresh,
      refreshCount: refreshCount + 1,
      previousTitles: avoid.slice(-5),
    };
    await supabase.from("ai_result_cache").upsert(
      {
        cache_key: key,
        kind: "daily-dinner",
        payload: payload as unknown as never,
        expires_at: endOfUtcDayISO(),
      },
      { onConflict: "cache_key" },
    );

    return {
      recipe: fresh,
      source: "fresh",
      refreshesRemaining: MAX_REFRESHES_PER_DAY - (refreshCount + 1),
    };
  });