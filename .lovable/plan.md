# Pantry-only recipe generation

## What's wrong today

1. Clicking **"Create a cuisine from the pantry list"** just picks a random country cuisine, sets it in state, and shows a toast "Pantry cuisine: Thai". The user still has to click **"Show me the cuisine"** afterwards.
2. Because a cuisine is picked, the output header shows `AI · Thai` and the loading text says *"Travelling to Thailand…"* — the user does not want a country attached to pantry generation.
3. The output never reflects the dietary tags the user selected.

## What you'll get

- The pantry button generates recipes immediately in one click, using only the selected ingredients + dietary tags. No country chosen, no second click required.
- The results header replaces the cuisine badge with the dietary tags the user picked (e.g. `Vegan · Peanut allergy`). If nothing was selected, it shows `Pantry` / nothing.
- The regular **"Show me the cuisine"** button keeps working exactly as today (with the cuisine dropdown).

## Changes

### `src/components/fridge/FilterPanel.tsx`
- Replace the `onPantryPick` prop with `onPantryGenerate: () => void`.
- The "Create a cuisine from the pantry list" button now calls `onPantryGenerate()` directly — no random pick, no toast about a country.

### `src/routes/index.tsx`
- Wire `onPantryGenerate` to a new handler that:
  - sets `pantryMode = true`,
  - sets `cuisine = "Any / Surprise Me"` (so the server prompt is not biased to a country),
  - calls the existing `onSubmit()` to generate recipes.
- Loading text: when `pantryMode` is on, always show *"Cooking up recipes from your pantry…"* instead of the "Travelling to {country}" copy.
- Results header badge: when `pantryMode` is on, replace `AI · {cuisine}` with the selected dietary tags joined by `·` (e.g. `Vegan · Peanut allergy`); fall back to `Pantry` when no dietary tags are selected. Non-pantry generation keeps the current cuisine badge.

No changes to `recipes.functions.ts`, the DB, or any other component. `"Any / Surprise Me"` already tells the server prompt not to lock to a region, so passing it through is enough.
