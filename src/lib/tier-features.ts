/**
 * Single source of truth for what each plan unlocks.
 *
 * Client-safe (no secrets): the prompt builder on the server and the UI both
 * read from this map so marketing copy and actual behaviour can't drift.
 */
export type PlanTier = "free" | "basic" | "unlimited";

export type TierFeatures = {
  /** How many recipes one generation returns. */
  recipeCount: number;
  /** Output token cap for the AI call — scales with what we ask for. */
  maxTokens: number;
  /** Per-serving nutrition estimates. */
  nutrition: boolean;
  /** Drink / side pairing suggestion. */
  pairing: boolean;
  /** Chef's note: why the dish works + the technique that matters. */
  chefNote: boolean;
  /** Difficulty rating + a "make it faster" shortcut. */
  difficulty: boolean;
  /** Two variations per recipe (spicier / vegan / kid-friendly swap). */
  variations: boolean;
  /** Make-ahead, storage and leftover guidance. */
  storage: boolean;
  /** Longer steps with per-step timing cues. */
  detailedSteps: boolean;
  /** Explicit allergen call-outs. */
  allergenFlags: boolean;
  /** PDF / print export of a recipe. */
  pdfExport: boolean;
  /** Max saved recipes; null = unlimited. */
  savedRecipeCap: number | null;
};

export const TIER_FEATURES: Record<PlanTier, TierFeatures> = {
  free: {
    recipeCount: 3,
    maxTokens: 1200,
    nutrition: false,
    pairing: false,
    chefNote: false,
    difficulty: false,
    variations: false,
    storage: false,
    detailedSteps: false,
    allergenFlags: false,
    pdfExport: false,
    savedRecipeCap: 30,
  },
  basic: {
    recipeCount: 6,
    maxTokens: 2400,
    nutrition: true,
    pairing: true,
    chefNote: true,
    difficulty: true,
    variations: false,
    storage: false,
    detailedSteps: false,
    allergenFlags: false,
    pdfExport: true,
    savedRecipeCap: null,
  },
  unlimited: {
    recipeCount: 6,
    maxTokens: 3400,
    nutrition: true,
    pairing: true,
    chefNote: true,
    difficulty: true,
    variations: true,
    storage: true,
    detailedSteps: true,
    allergenFlags: true,
    pdfExport: true,
    savedRecipeCap: null,
  },
};

/**
 * Compact fingerprint of everything that changes the AI output for a tier.
 * Used in the AI cache key so tiers never serve each other's results.
 */
export function outputDetailLevel(tier: PlanTier): string {
  const f = TIER_FEATURES[tier];
  return [
    `n${f.recipeCount}`,
    f.nutrition ? "nut" : "",
    f.pairing ? "pair" : "",
    f.chefNote ? "note" : "",
    f.difficulty ? "diff" : "",
    f.variations ? "var" : "",
    f.storage ? "store" : "",
    f.detailedSteps ? "deep" : "",
    f.allergenFlags ? "alg" : "",
  ]
    .filter(Boolean)
    .join("-");
}

/** What a free user is missing, for the locked upsell strip. */
export const PAID_EXTRAS: { label: string; plan: "Basic" | "Unlimited" }[] = [
  { label: "Nutrition per serving", plan: "Basic" },
  { label: "Drink & side pairing", plan: "Basic" },
  { label: "Chef's note + technique", plan: "Basic" },
  { label: "Difficulty & faster shortcut", plan: "Basic" },
  { label: "6 recipes per search", plan: "Basic" },
  { label: "Recipe variations", plan: "Unlimited" },
  { label: "Make-ahead & storage", plan: "Unlimited" },
  { label: "Step-by-step timing cues", plan: "Unlimited" },
  { label: "Allergen call-outs", plan: "Unlimited" },
];
