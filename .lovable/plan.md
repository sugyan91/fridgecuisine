## Goal
Make diet badges on recipe cards more scannable and clearly show *why* a recipe matches the filters you picked.

The AI already returns a `dietary` array per recipe and cards already list them as small pink pills. Today they read as a generic label row — nothing signals which tags satisfy your selected filters, and there are no icons to distinguish e.g. Vegan vs Gluten-Free at a glance.

## Changes

1. **Shared badge component** — `src/components/fridge/DietBadge.tsx`
   - One place that renders `{ emoji + label }` with a "matched" variant.
   - Reuses the emoji map already living in `FilterPanel` (Vegetarian 🥬, Vegan 🌱, Gluten-Free 🌾, Dairy-Free 🥛, Keto 🥓, Nut-Free 🥜, Pescatarian 🐟, Halal 🕌, Kosher ✡️, Contains Pork 🐖, Contains Nuts 🥜, Spicy 🌶️, etc.).
   - Extract the emoji lookup into `src/lib/dietary-icons.ts` so both `FilterPanel` and `DietBadge` share it (no duplication).

2. **RecipeCard** — `src/components/fridge/RecipeCard.tsx`
   - Accept the user's selected filters as a new optional prop `selectedDietary?: string[]`.
   - Sort badges: matched tags first, then the rest.
   - Matched badges get a stronger treatment (filled paprika + subtle ring / ✓) and an `aria-label="Matches your Vegetarian filter"`; unmatched tags stay as soft outlined chips so the row doesn't become a wall of red.
   - When ≥1 selected filter is satisfied, prepend a compact "Matches your diet" summary chip (e.g. "✓ Matches: Vegan, Gluten-Free").
   - Apply the same treatment in both places dietary renders today (collapsed card ~line 296 and expanded view ~line 570).

3. **Wire selected filters through** — `src/routes/index.tsx`
   - Pass `selectedDietary={dietary}` to every `<RecipeCard />` render (pantry results, cuisine results, saved drawer usage stays as-is if it doesn't have access to current filters — fine to omit there).

4. **Dish-helper single recipe** — `src/lib/dish-helper.functions.ts` + hero result block in `src/routes/index.tsx`
   - Extend `responseSchema` with an optional `dietary: string[]` (same tag vocabulary as `generateRecipes`) and ask the AI to populate it.
   - Render the same `DietBadge` row under the dish name in the hero result card so the single-dish flow is consistent with multi-recipe cards.

## Out of scope
- No changes to the filter UI itself, the pantry flow, saved-recipes schema, or the AI prompt rules for `generateRecipes` (it already emits the right tags).
- No new dietary tags added to the taxonomy.

## Technical notes
- `Recipe.dietary` and `SavedRecipeRow.dietary` types already exist — no schema/migration work.
- `DietBadge` stays presentational; matching logic is a pure `selectedSet.has(tag)` check inside the component.
- Dish-helper schema change is additive with `.default([])`, so old cached responses keep parsing.

## Verification
- Typecheck (`bunx tsgo --noEmit`).
- Playwright on mobile (390×844) and desktop: run a pantry generation with Vegetarian + Gluten-Free selected, confirm matched badges are visually distinct and sorted first, and the "Matches your diet" chip appears.
