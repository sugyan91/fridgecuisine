## Changes

### 1. `src/routes/index.tsx` — `onSubmit`
Remove the empty-pantry guard so "Show me the cuisine" works regardless of what's in the pantry. The generator already accepts an empty ingredient list conceptually — we'll send a sentinel/empty array and let the AI build recipes from the selected Global Cuisine Vibe alone.

- Drop the `if (ingredients.length === 0) { toast.error(...) }` block.
- If `cuisine === "Any / Surprise Me"` AND `ingredients.length === 0`, show a gentle toast: "Pick a cuisine vibe or add a pantry ingredient." (only case where we still need *something*).
- Otherwise call `generate({ data: { ingredients, dietary, cuisine, exclude: [] } })` as today.

### 2. `src/lib/recipes.functions.ts` — allow empty pantry
- Change the input schema: `ingredients: z.array(...).max(30).default([])` (drop `.min(1)`).
- Update the system prompt: when `data.ingredients.length === 0`, instruct the AI to generate 10 classic/iconic recipes for the selected cuisine using common pantry staples, and skip the "use as many of the user's ingredients as possible" rule.

### 3. `src/components/fridge/FilterPanel.tsx` — remove helper text
Delete the line:
> "Picks a random cuisine for you. Separate from 'Show me the cuisine'."
directly below the "Find my Pantry cuisine" button. Keep the button and its section heading.

## Result
- Clicking "Show me the cuisine" with an empty pantry but a selected cuisine returns 10 recipes for that cuisine.
- No misleading "add ingredients" error.
- The small italic note under the Pantry cuisine button is gone.
