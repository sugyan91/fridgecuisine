## Plan

Make "Show more receipes" work in both modes — cuisine-only AND when ingredients are present.

## Change

In `src/routes/index.tsx`, update `onLoadMore`:
- Remove the `ingredients.length === 0` guard that currently blocks the click and shows "Add some ingredients first…".
- Call `generate` with whatever the user currently has: `ingredients` (possibly empty), `dietary`, `cuisine`, and `exclude: receipes.map(r => r.title)` so already-shown recipes aren't repeated.
- Keep the existing de-duplication and the "No new receipes — try changing cuisine or dietary filters." toast for when the AI returns only duplicates.

The backend (`generateRecipes`) already handles both cases: with ingredients it builds recipes around them; with no ingredients it generates classic recipes for the selected cuisine (or worldwide if "Any / Surprise Me").

## Result

- Cuisine selected, no ingredients → "Show more" appends 10 more recipes from that cuisine.
- Ingredients added (with or without cuisine) → "Show more" appends 10 more recipes using those ingredients.