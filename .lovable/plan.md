## Problem
Dietary tags currently render only when the user has selected dietary filters, and only in the collapsed card. So on "Global Cuisine Vibe" runs (no filter selected) nothing shows, and even when filters are set, the expanded view has no Dietary label.

## Fix
Make dietary tags a property of each recipe (returned by the AI), so every card shows what the dish actually is, regardless of whether the user picked filters. Render the tags in both the collapsed preview and the expanded detail view.

## Changes

### 1. `src/lib/recipes.functions.ts`
- Add `dietary: string[]` to the `Recipe` type and to `responseSchema.recipes[]` (default `[]`, max ~6 short tags).
- Update the prompt so the model tags each recipe with applicable labels (e.g. `Vegan`, `Vegetarian`, `Gluten-Free`, `Dairy-Free`, `Halal`, `Kosher`, `Pescatarian`, `Contains Nuts`, `Contains Pork`). Must include tags the user filtered on, plus any other obviously-true tags.

### 2. `src/components/fridge/RecipeCard.tsx`
- Stop using the `dietary` prop for display. Use `recipe.dietary ?? []` instead (keep the prop optional for backward compatibility, but ignore it).
- Collapsed view: keep the existing `Dietary: <chips>` row, driven by `recipe.dietary`.
- Expanded view: add the same `Dietary: <chips>` row under the title/meta block (above the blurb), styled to read well on the dark `bg-cardamom` background (use `text-white/70` for the label, keep paprika chips).
- If `recipe.dietary` is empty, render nothing (no empty label).

### 3. `src/routes/index.tsx`
- No logic change required. The existing `dietary={dietary}` prop can stay or be removed; the card now sources dietary from the recipe itself.

## Result
Every recipe card — whether produced by Global Cuisine Vibe, Surprise Me, or Find my Pantry cuisine — shows its dietary tags in both the preview and the expanded recipe view, even when the user picked no dietary filter.
