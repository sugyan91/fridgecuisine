## Problem
The recipe cards always show "Missing N" badges and a "Missing" list. That makes sense when the user asked us to cook from their pantry, but not when they just picked a cuisine vibe to explore. The user wants:

- **Global Cuisine Vibe** (or "Any / Surprise Me") → show only recipe + ingredients (no "missing").
- **Find my Pantry cuisine** → keep "missing" because it's pantry-driven.

The two buttons currently feed the same `cuisine` state, so we lose intent. We'll track intent with a `pantryMode` flag.

## Changes

### 1. `src/routes/index.tsx`
- Add `const [pantryMode, setPantryMode] = useState(false)`.
- Reset `pantryMode` to `false` whenever the user changes the cuisine dropdown manually (via a new `onCuisine` wrapper passed to `FilterPanel`).
- Pass `onPantryPick` callback to `FilterPanel` → sets `pantryMode=true` + `cuisine=<random>`.
- Pass `pantryMode` to each `<RecipeCard>` as `showMissing={pantryMode && ingredients.length > 0}`.

### 2. `src/components/fridge/FilterPanel.tsx`
- New prop `onPantryPick: (cuisine: string) => void`.
- The "Find my Pantry cuisine" button calls `onPantryPick(pick)` instead of `onCuisine(pick)`. Toast unchanged.

### 3. `src/components/fridge/RecipeCard.tsx`
- New prop `showMissing?: boolean` (default `true` for backward compatibility in saved/community views).
- When `showMissing` is `false`:
  - Hide the rotated "MISSING N" / "ALL SET" badge entirely.
  - In the expanded view, hide the "Missing" block.
  - Add a new "Ingredients" block that lists `[...usedIngredients, ...missingIngredients]` so the user still sees the full ingredient list.
- When `showMissing` is `true`, behavior is unchanged.

## Result
- Picking a cuisine from "Global Cuisine Vibe" (including Surprise Me) gives clean recipe cards with title, blurb, cuisine, cook time, full Ingredients list, and Method. No "missing" callouts.
- Clicking "Find my Pantry cuisine" still produces the pantry-aware cards with "MISSING N" / "ALL SET" badges and a Missing block, as today.
- Saved Drawer / Community card usages stay unchanged (they don't pass the prop, so they default to showing missing as before).
