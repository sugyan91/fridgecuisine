# Widen the free vs paid gap — richer AI output for subscribers

Free recipe generation stays exactly as it is today (3 recipes/day, lite output). All new value goes into the paid tiers, plus two small non-generation trims on free.

## What paid gets that free doesn't

Today the only real difference is *how many* generations you get. After this, paid recipes are visibly richer — same request, deeper answer.

**Basic ($5.99)** — everything free has, plus per recipe:
- Nutrition per serving (already paid today)
- Drink/side pairing suggestion
- A chef's note: why the dish works and the one technique that matters
- Difficulty rating and a "make it faster" shortcut

**Unlimited ($19.99)** — everything in Basic, plus per recipe:
- Two variations of each recipe (e.g. spicier, vegan, kid-friendly swap)
- Make-ahead, storage and leftover guidance
- Longer, more detailed steps with timing cues per step
- Allergen flags called out explicitly alongside nutrition

**Free** keeps: 3 recipes per day, 5 helper tips, short steps, saving, sharing, community, meal planner, shopping list. Each free recipe shows a compact locked "Chef's details" strip listing exactly what Basic/Unlimited would add, linking to /pricing.

## Two gentle trims on free (nothing to do with generating)

- **PDF / print export** becomes a paid feature. Free users see the button with a lock and an upgrade prompt.
- **Saved recipes cap of 30** for free accounts, with a clear message and an "upgrade for unlimited saves" prompt. Existing free users over the cap keep everything they already saved; they just can't add more until they remove some or upgrade.

## Cost control

Richer output costs more tokens, but only for paying accounts, so spend tracks revenue:
- Free / anonymous: unchanged prompt and token cap (1200).
- Basic: ~2400 tokens. Unlimited: ~3400 tokens.
- The existing AI result cache keeps working — the cache key gains the detail level, so free and paid results are cached separately and repeat requests within a tier stay free.

## Technical notes

- New shared module `src/lib/tier-features.ts` exporting a `TIER_FEATURES` map (`nutrition`, `pairing`, `chefNote`, `difficulty`, `variations`, `storage`, `detailedSteps`, `allergenFlags`, `recipeCount`, `maxTokens`, `pdfExport`, `savedRecipeCap`). Client-safe, no secrets — both the prompt builder and the UI read from it.
- `src/lib/recipes.functions.ts`: replace the current `isFreeTier` booleans with lookups into `TIER_FEATURES[tier]`; conditionally append prompt rules and JSON schema fields for the enabled extras; set `maxTokens` from the map. Add the detail level into the `hashKey("recipes", norm)` payload so caches don't cross tiers.
- Recipe type gains optional fields (`pairing`, `chefNote`, `difficulty`, `variations[]`, `storage`, `allergens[]`) so free responses stay valid.
- `src/components/fridge/RecipeCard.tsx` (and the recipe detail view): render the new fields when present; render a locked upsell strip when absent and the user is on free.
- PDF gate in `src/lib/recipe-pdf.ts` call sites — the button checks `useSubscription().isActive`, no server change needed since the PDF is generated client-side from data the user already has.
- Saved-recipe cap enforced server-side in `src/lib/saved-recipes.functions.ts` (count check before insert, returns a typed `{ ok: false, requiresUpgrade: true }`) so it can't be bypassed, plus a friendly toast on the client.
- `src/routes/pricing.tsx`: rewrite the three feature lists to lead with output depth rather than only counts; update the "what counts as one generation" FAQ.
- `src/routes/_authenticated/usage.tsx`: add a short "your plan includes" summary so paid users can see what they're getting.

No database migration is needed — tier already resolves from the `subscriptions` table, and the saved-recipe cap is a count query.
