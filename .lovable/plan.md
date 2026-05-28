Add emoji icons next to every ingredient in the IngredientInput component, including user-added ones.

**Approach:**
- Create `src/lib/ingredient-icons.ts` with a comprehensive emoji map (rice 🍚, eggs 🥚, onion 🧅, tomato 🍅, spinach 🥬, potato 🥔, pasta 🍝, chicken 🍗, mushroom 🍄, cheese 🧀, avocado 🥑, lemon 🍋, garlic 🧄, carrot 🥕, bell pepper 🫑, fish 🐟, shrimp 🦐, beef 🥩, bacon 🥓, bread 🍞, corn 🌽, broccoli 🥦, etc.) plus a `getIngredientIcon(name)` helper with keyword fallback (matches partial words: anything with "cheese" → 🧀, "fish" → 🐟, "sauce" → 🥫, etc.) and a final default 🥄 for unknowns.
- Update `src/components/fridge/IngredientInput.tsx`:
  - Show the icon before each ingredient chip in the selected list.
  - Show the icon before each suggestion chip at the bottom.
- No changes to data model — purely presentational.

**Files changed:**
- `src/lib/ingredient-icons.ts` (new)
- `src/components/fridge/IngredientInput.tsx` (edit)