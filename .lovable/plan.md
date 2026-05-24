Move the "Global Cuisine Vibe" dropdown out of the Pantry's FilterPanel and place it directly below the revolving country flags (CountryTiles).

### Changes

**1. `src/components/fridge/FilterPanel.tsx`**
- Remove the entire "Global Cuisine Vibe" block (lines 177–188): the section wrapper, label, and `<select>` of cuisines.
- Keep the `cuisine` / `onCuisine` props in `Props` so the parent still controls cuisine state (no other consumers to update).

**2. `src/routes/index.tsx`**
- Inside the `<section>` that renders `<CountryTiles onPick={pickCuisine} />` (around line 691–698), add the cuisine vibe selector directly underneath the `<CountryTiles>` element.
- Reuse the same styling (label "Global Cuisine Vibe" + `<select>` with all cuisines). It will call the same handler the FilterPanel used: set `pantryMode(false)` and `setCuisine(value)`.
- To avoid duplicating the cuisine list, export `DEFAULT_CUISINES` sorting logic inline in the section (small list build from `DEFAULT_CUISINES` + user's `customCuisines`). For simplicity, fetch custom cuisines the same way FilterPanel does — but since FilterPanel still renders for the pantry, and to keep this minimal, the new selector on the landing section will use only `DEFAULT_CUISINES` (sorted, with "Any / Surprise Me" first). Custom cuisines remain accessible via the cuisine input elsewhere.
- Constrain max width (e.g. `max-w-md mx-auto mt-6`) so the dropdown sits cleanly centered under the flags.

### Out of scope
- No changes to CountryTiles, TrendingDishes, RecipeCounter, or pantry generate logic.
- No styling overhaul beyond placement and a sensible width/spacing for the moved selector.