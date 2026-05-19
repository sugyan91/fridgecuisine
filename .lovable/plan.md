## Goal
1. Replace AI-generated dish illustrations with **real Unsplash photographs** of the finished dish.
2. Add a **countdown timer system** with both total-recipe and per-step timers, each with Start / Pause / Skip / Stop / Reset controls.

## 1. Real Unsplash photos

### Secret
Prompt for `UNSPLASH_ACCESS_KEY` via `add_secret`.

### New server function `src/lib/dish-image.functions.ts`
- `searchDishImage({ title, cuisine, ingredients })` — server fn that calls `https://api.unsplash.com/search/photos?query=<dish>&per_page=5&orientation=squarish&content_filter=high` with `Authorization: Client-ID <key>`.
- Build the query smartly: `"<title> <cuisine> food"` plus a sanitized ingredient hint (same logic already in `receipe-images.ts`).
- Return the `urls.small` (400px) of the first result + `user.name` + `links.html` (Unsplash attribution is required by their API guidelines).
- Light in-memory LRU cache (Map, 200 entries) keyed by `title|cuisine` so we don't re-hit the API on every navigation.
- On failure (no key, 401, 404, network), return `null` so callers can fall back.

### Update `src/lib/receipe-images.ts`
- Keep `pickFallbackImage` for the hard fallback to bundled jpgs.
- `pickRecipeImage` becomes async-resolved via the new server fn from the client, OR keep the existing pollinations URL as a secondary fallback before the bundled jpgs.

### Frontend wiring
- Add `src/hooks/use-dish-image.ts` that takes `{ title, cuisine, ingredients }`, calls the server fn once, caches by key, and returns `{ url, credit }`.
- Update the recipe image renderers (in `RecipeCard.tsx` and the dish-helper card in `routes/index.tsx`) to:
  1. Start with the bundled fallback while loading.
  2. Swap to the Unsplash photo when it resolves.
  3. Render the required "Photo by X on Unsplash" credit line beneath the image (small, muted).
  4. If Unsplash returns nothing, keep the bundled fallback.

## 2. Countdown timers

### New hook `src/hooks/use-countdown.ts`
- `useCountdown(initialSeconds)` returns `{ secondsLeft, isRunning, isFinished, start, pause, reset, skip }`.
- `skip` immediately sets `secondsLeft` to 0 and marks finished.
- Uses a single `setInterval` cleaned up on unmount; no drift correction needed for cooking-grade accuracy.
- Plays a short beep (Web Audio API oscillator, ~600ms) when a timer reaches 0. No external asset.

### New component `src/components/fridge/StepTimer.tsx`
- Props: `minutes: number`, `label?: string`, optional `onFinish` callback.
- Renders a compact pill: `[▶ 5:00]` → when running `[⏸ 4:32]` plus `Skip` and `Reset` icons.
- Uses semantic tokens (`bg-turmeric`, `border-border`) to match the brutalist look.

### New component `src/components/fridge/RecipeTimers.tsx`
- A small horizontal bar shown at the top of the expanded recipe card with **the total-recipe countdown** (uses `totalTimeMinutes` if present, else `cookTimeMinutes`).
- Same Start / Pause / Skip / Reset controls.

### Integration in `RecipeCard.tsx`
- In the expanded (open) state:
  - Above "The Method" heading: render `<RecipeTimers totalMinutes={...} />`.
  - Inside each step `<li>`: if `stepTimings[i]` is present, render `<StepTimer minutes={stepTimings[i]} />` next to the static `"5 min"` badge (the badge stays as a hint, the timer is the interactive control).

### Integration in dish-helper card (`routes/index.tsx`)
- Same two additions: total timer at the top of the receipe block, per-step timer inline with each step.

## 3. Out of scope
- No DB changes. Image URL is fetched on demand and cached in memory; not persisted.
- No background/notification timers (only runs while the card is open) — keeps scope tight and avoids permission prompts.

## Files touched
- `src/lib/dish-image.functions.ts` (new)
- `src/lib/receipe-images.ts` (small tweak / keep as fallback)
- `src/hooks/use-dish-image.ts` (new)
- `src/hooks/use-countdown.ts` (new)
- `src/components/fridge/StepTimer.tsx` (new)
- `src/components/fridge/RecipeTimers.tsx` (new)
- `src/components/fridge/RecipeCard.tsx` (render photo + credit + timers)
- `src/routes/index.tsx` (dish-helper card: photo + timers)