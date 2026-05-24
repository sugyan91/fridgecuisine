Move the "Show me the cuisine" button + RecipeCounter under the Global Cuisine Vibe dropdown (below the country flags), so users can pick a cuisine and generate from one place.

### Changes — `src/routes/index.tsx`

1. **Add inside the flags section**, directly after the Global Cuisine Vibe `<select>`:
   - "Show me the cuisine" button wired to `onSubmit` (same handler as today). Same primary styling.
   - RecipeCounter row underneath (`mt-3 flex justify-center`).
   - Also tweak `pickCuisine` so it no longer scrolls to the pantry — selecting a flag just sets cuisine; the user clicks the new button right there.

2. **Remove from the Pantry section** (lines 763–777):
   - Delete the "Show me the cuisine" button.
   - Delete the RecipeCounter row directly below it.
   - Keep the rest of the pantry section (IngredientInput, FilterPanel with its pantry-generate button, etc.) intact.

### Out of scope
- No changes to `onSubmit` logic, generation limits, FilterPanel, RecipeCounter, or pantry-generate flow.
- No styling overhaul beyond placement.