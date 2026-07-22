import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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

export const DailyDinnerOverridesSchema = z
  .object({
    dietary: z.array(z.string().max(40)).max(10).optional(),
    allergies: z.array(z.string().max(40)).max(20).optional(),
    spiceLevel: z.enum(["none", "mild", "medium", "hot"]).optional(),
    maxTimeMinutes: z.number().int().min(10).max(180).optional(),
  })
  .strict();
export type DailyDinnerOverrides = z.infer<typeof DailyDinnerOverridesSchema>;

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
  overrides?: DailyDinnerOverrides,
): Promise<DailyDinner | null> {
  const [pantryRes, prefsRes, feedbackRes] = await Promise.all([
    supabase.from("pantry_items").select("name").eq("user_id", userId).limit(50),
    supabase
      .from("user_preferences")
      .select("custom_dietary, custom_cuisines, allergies, disliked_ingredients, default_servings, spice_level")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("daily_dinner_feedback")
      .select("title, cuisine, key_ingredients, signal, created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(60),
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

  type FeedbackRow = { title: string; cuisine: string | null; key_ingredients: string[]; signal: "skip" | "dislike" };
  const feedback: FeedbackRow[] = (feedbackRes.data ?? []) as FeedbackRow[];
  const feedbackTitles = Array.from(
    new Set(feedback.map((f) => f.title).filter((s): s is string => !!s)),
  ).slice(0, 30);
  const dislikes = feedback.filter((f) => f.signal === "dislike");
  const dislikedCuisines = Array.from(
    new Set(dislikes.map((f) => (f.cuisine ?? "").trim().toLowerCase()).filter(Boolean)),
  ).slice(0, 10);
  const dislikedIngredients = Array.from(
    new Set(dislikes.flatMap((f) => f.key_ingredients ?? []).map((s) => s.toLowerCase())),
  ).slice(0, 20);
  const mergedDislikedIngredients = Array.from(
    new Set([...(prefs.disliked_ingredients ?? []), ...dislikedIngredients]),
  );

  const mergedDietary = overrides?.dietary?.length
    ? Array.from(new Set([...(prefs.custom_dietary ?? []), ...overrides.dietary]))
    : prefs.custom_dietary;
  const mergedAllergies = overrides?.allergies?.length
    ? Array.from(new Set([...(prefs.allergies ?? []), ...overrides.allergies]))
    : prefs.allergies;
  const mergedSpice = overrides?.spiceLevel ?? prefs.spice_level;
  const maxTime = overrides?.maxTimeMinutes;

  const allAvoidTitles = Array.from(new Set([...avoidTitles, ...feedbackTitles])).slice(0, 40);

  const { callChatJSON } = await import("./hf-client.server");
  const system =
    "You are a personal cook. Recommend ONE dinner for tonight that best matches the user's pantry and preferences. Reply ONLY with valid JSON.";
  const user = JSON.stringify({
    pantry,
    dietary: mergedDietary,
    allergies: mergedAllergies,
    dislikes: mergedDislikedIngredients,
    dislikedCuisines,
    preferredCuisines: prefs.custom_cuisines,
    spiceLevel: mergedSpice,
    servings: prefs.default_servings ?? 2,
    maxTimeMinutes: maxTime,
    today: todayKey(),
    avoid: allAvoidTitles,
    recentlySkipped: feedbackTitles,
    instructions: [
      "Return JSON: {title, blurb, cuisine, totalTimeMinutes(int 5..180), difficulty(easy|medium|hard), usedIngredients[], missingIngredients[], steps[](5-8), reason}.",
      "Prefer pantry items when non-empty. If pantry is empty, pick a beloved dinner that fits preferences.",
      "STRICTLY avoid allergies and dislikes. Respect dietary restrictions. Realistic weeknight dinner.",
      dislikedCuisines.length
        ? `AVOID these cuisines the user has disliked recently: ${dislikedCuisines.join(", ")}.`
        : "",
      feedbackTitles.length
        ? "Do NOT repeat or closely resemble any title in 'avoid' or 'recentlySkipped' — the user already passed on those."
        : "",
      maxTime ? `Total cooking time MUST be at most ${maxTime} minutes.` : "",
      mergedSpice ? `Match spice level: ${mergedSpice}.` : "",
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
  if (maxTime && recipe.totalTimeMinutes > maxTime) {
    recipe.totalTimeMinutes = maxTime;
  }
  return recipe;
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

async function recordFeedback(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  recipe: DailyDinner | null,
  signal: "skip" | "dislike",
): Promise<void> {
  if (!recipe?.title) return;
  const key = (recipe.usedIngredients ?? [])
    .concat(recipe.missingIngredients ?? [])
    .map((s) => s.toLowerCase())
    .slice(0, 8);
  await supabase.from("daily_dinner_feedback").insert({
    user_id: userId,
    title: recipe.title,
    cuisine: recipe.cuisine || null,
    key_ingredients: key,
    signal,
  });
}

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

    // The user asked for a new pick — record the previous suggestion as skipped.
    await recordFeedback(supabase, userId, currentRecipe, "skip");

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

export const applyDailyDinnerOverrides = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DailyDinnerOverridesSchema.parse(input))
  .handler(async ({ context, data }): Promise<DailyDinnerResult> => {
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

    const avoid = [...previousTitles, currentRecipe?.title].filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    );
    const fresh = await generateRecipe(supabase, userId, avoid, data);
    if (!fresh) {
      return {
        recipe: currentRecipe,
        source: "cache",
        refreshesRemaining: Math.max(0, MAX_REFRESHES_PER_DAY - refreshCount),
      };
    }

    // Override-driven regenerations do NOT consume the daily refresh budget,
    // but we still record the previous title so subsequent picks stay varied.
    const payload: CachedPayload = {
      recipe: fresh,
      refreshCount,
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
      refreshesRemaining: Math.max(0, MAX_REFRESHES_PER_DAY - refreshCount),
    };
  });