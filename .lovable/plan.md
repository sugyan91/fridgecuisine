## Goal

Add four upgrades to AI-generated recipes: **difficulty**, **kid-friendly toggle**, **per-ingredient "I don't have this" swap**, and **optional approximate nutrition (calories + macros)**.

All changes are additive — existing saved recipes keep working (new fields are optional).

---

## 1. Difficulty

Easy / Medium / Hard badge on every recipe.

- Extend the AI JSON schema in `src/lib/receipes.functions.ts`:
  - Add `difficulty: "easy" | "medium" | "hard"` to `Receipe` type and `responseSchema` (optional, defaulted).
  - Prompt rule: "Set `difficulty` based on technique + step count + time (easy ≤25min and ≤5 simple steps; hard = advanced technique or >45min)."
- Render a small pill in `ReceipeCard.tsx` (both collapsed and expanded) next to time/cuisine — color by level (turmeric / saffron / paprika).
- Persisted automatically via the existing `recipe` JSONB in `saved_recipes` (no migration needed).

---

## 2. Kid-friendly toggle

A toggle in the ingredient/filters area that biases generation toward mild, familiar, kid-approved dishes.

- New boolean state `kidFriendly` in `src/routes/index.tsx`, passed in `generate({ ... kidFriendly })`.
- Add to `inputSchema` and prompt: when true, "Prefer mild flavors, no chili heat, no strong funk (blue cheese, anchovy, fish sauce), nothing raw, hide vegetables in sauces/blends, fun shapes/finger foods where natural."
- New compact toggle button in the filters row of `IngredientInput.tsx` (or directly in index.tsx next to the dietary/cuisine controls — whichever fits the existing layout) styled like the existing chip toggles. Label: "Kid-friendly 🧒".
- Surface a small "Kid-friendly" badge on cards when the flag was used (passed through on the Receipe object).

---

## 3. "I don't have this ingredient" → swap

Per-ingredient swap inside the expanded recipe view.

- Add `swapIngredient` server fn in a new `src/lib/ingredient-swap.functions.ts`:
  - Input: `{ recipeTitle, cuisine, ingredient, pantry: string[], dietary: string[] }`.
  - Calls the LLM for 1–2 substitution suggestions tailored to the user's pantry, plus a one-line note on how it changes the dish.
  - Returns `{ swaps: { name: string; note: string }[] }`.
- In `ReceipeCard.tsx` (expanded view), render a small ✕/↻ button next to each item in `usedIngredients` and `missingIngredients`. Clicking opens a popover with suggested swaps and an "Apply" action that:
  - Updates local recipe state (replaces the ingredient in the list and appends the swap note to `substitutions`).
  - If the recipe is already saved, re-saves the updated copy via existing `saveReceipe`.
- Loading + error states inline; no schema changes.

---

## 4. Optional approximate nutrition

Calories + macros (protein/carbs/fat) per serving, clearly labeled as approximate, and gated by a user toggle so we don't slow generation for users who don't care.

- User preference: add `showNutrition` boolean to `user_preferences` is overkill — instead store as a simple `useLocalStorage("show-nutrition", false)` flag (matches the existing `use-local-storage` hook). No DB migration.
- Extend `inputSchema` + prompt with `includeNutrition`. When true, prompt asks for:
  ```
  "nutrition": { "servings": 2, "perServing": { "calories": 420, "proteinG": 18, "carbsG": 52, "fatG": 14 } }
  ```
  Mark all numbers as estimates in the system prompt.
- Add `nutrition` (optional) to `Receipe` type + `responseSchema`.
- Render in expanded `ReceipeCard.tsx` as a small "Approx. per serving" strip (only when present). Include a tiny "estimates only" disclaimer.
- Add a toggle in the filters area: "Show nutrition (approx.)".

---

## Files touched

```
src/lib/receipes.functions.ts          # difficulty, kidFriendly, nutrition in schema + prompt
src/lib/ingredient-swap.functions.ts   # NEW server fn for swaps
src/lib/saved-receipes.functions.ts    # widen receipeSchema (add optional difficulty + nutrition)
src/components/fridge/ReceipeCard.tsx  # render difficulty badge, nutrition strip, per-ingredient swap UI
src/components/fridge/IngredientInput.tsx  # (or index.tsx) kid-friendly + nutrition toggles
src/routes/index.tsx                   # state for kidFriendly + showNutrition, pass to generate
```

No database migrations. No new env vars. Uses existing Lovable AI Gateway.

---

## Out of scope

- Recipe images (item 1 from earlier list) — skipped per your selection.
- Storing nutrition preference server-side (local-only is enough for v1).
- Editing nutrition values manually.