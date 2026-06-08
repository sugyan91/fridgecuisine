## Problem

The "Search any dish" flow (`getDishHelper`) returns a recipe without a `nutrition` block, while the main "Generate recipes" flow does. `RecipeCard` only renders calories/protein/carbs/fat/sugar/fiber when `recipe.nutrition.perServing` exists, so the dish helper card shows no macros.

## Fix

Update `src/lib/dish-helper.functions.ts`:

1. Extend the response schema's `recipe` object with a `nutrition` field shaped like the recipes flow:
   - `servings: number` (matches top-level servings)
   - `perServing: { calories, proteinG, carbsG, fatG, sugarG, fiberG }` (all integers)
2. Add a top-level integer `servings` field on the recipe (so `RecipeCard` can show per-serving context consistently).
3. Update the system prompt and the JSON example to require nutrition and servings, mirroring the wording used in `recipes.functions.ts` (approximate, never omit).

No UI changes needed — `RecipeCard` already renders `nutrition.perServing` automatically.

## Out of scope

- Quota, auth, anonymous tracking — unchanged.
- Other recipe surfaces (community, saved, paid) — already have nutrition.
