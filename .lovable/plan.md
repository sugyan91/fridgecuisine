# Fix: Food images don't match the dish

## Problem

Recipe cards generate images via `generateRecipeImage` using only `dishName + cuisine` in the prompt. The image model chain is:

1. Hugging Face FLUX.1-schnell / SDXL (no real knowledge of regional dish names like "Dal Tadka", "Himalayan Momo")
2. Lovable Gemini 2.5 flash image (fallback)

FLUX/SDXL hallucinate generic food when given an unfamiliar dish name, so the cards show plausible-but-wrong food. That's what you're seeing.

## Fix

Two changes, both in `src/lib/recipe-image.functions.ts` and `src/lib/hf-client.server.ts`:

### 1. Switch the default image model to one that actually knows dish names

Stop calling FLUX/SDXL for food. Use Lovable AI Gateway with `google/gemini-3.1-flash-image-preview` (Nano Banana 2) as the primary, with `openai/gpt-image-2` (quality: "low") as fallback. Both have strong food/world-cuisine knowledge. Drop the HF image chain for recipe images (keep the HF chat models — only image gen is the problem).

### 2. Build a much more descriptive prompt

Right now the prompt is just `"Professional overhead food photography of <title>, <cuisine> cuisine"`. Expand `generateRecipeImage` to accept and use the recipe's actual signal:

- `dishName`, `cuisine`
- `description` (one-line summary from the recipe)
- top 4–6 `keyIngredients` (e.g. "yellow lentils, ghee, cumin, tomato, cilantro")
- `presentation` hint derived from dish type ("served in a copper karahi bowl", "steamed dumplings in a bamboo basket", etc.) — pass through from the recipe when available, otherwise omit

New prompt shape:

```
Professional overhead food photography of <dishName>, a <cuisine> dish.
<description>
Visible ingredients: <keyIngredients>.
<presentation>
Natural lighting, shallow depth of field, garnished and plated authentically,
appetizing, magazine quality, photorealistic.
```

This grounds the model in what the dish actually looks like instead of relying on it to recognize a name.

### 3. Pass the extra context from the call site

In `src/components/fridge/RecipeCard.tsx`, update the `runImage` call to send `description`, `keyIngredients` (first few from `recipe.usedIngredients + recipe.missingIngredients`), and `cuisine`. Same for any other call sites (community/shop/saved recipe views — verify during implementation).

### 4. Cache by dish identity

Because the same recipe regenerates on every mount, add a simple cache key (e.g. `localStorage` keyed on `${cuisine}::${dishName}`) so once a correct image lands, it persists across navigation and we don't burn quota re-rolling and potentially getting a worse image.

## Out of scope

- Reverse-validating images with a vision model (expensive, adds latency).
- Storing generated images server-side (separate infra change).
- Replacing already-saved bad images in the DB — covered organically by the new cache when users re-open recipes.

## Technical notes

- `callImageGen` will get a second arg `{ preferGemini: true }` or a new sibling `callFoodImageGen` that uses the Lovable Gateway directly with the food-optimized prompt, skipping HF.
- Gemini image body uses `messages` + `modalities: ["image","text"]` (already correct in `hf-client.server.ts`); GPT-image-2 uses `prompt` — keep the two body shapes separate per the AI gateway rules.
- Keep `quality: "low"` on gpt-image-2 to stay cheap; Nano Banana 2 has no quality knob.
