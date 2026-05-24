## What's wrong today

In `src/routes/index.tsx`, clicking **Show me the cuisine** calls `onSubmit`, but the results render in a separate section ~700px further down the page (`<section className="lg:col-span-7">` near line 890). The button gives no feedback near itself, so users see nothing happen — then have to scroll down to find the cards. Combined with the AI call latency (~5–15s), it feels broken and slow.

## Fix

### 1. Place results right under the button
Render the loading state + receipe cards directly inside the same section as the cuisine selector and **Show me the cuisine** button (the `lg:col-span-12` "Cook the world tonight" section), instead of in the pantry section far below. The pantry section keeps its own results only when the user generates from the pantry flow.

- Split the `receipes` state visually by `pantryMode`: when `pantryMode === false` (cuisine-only flow), render cards inside the cuisine section. When `pantryMode === true`, keep them in the pantry section as today.

### 2. Make it feel fast
- On click, immediately:
  - Scroll the results area into view (smooth, `block: 'start'`) so the user's eye lands on the right place.
  - Render **skeleton receipe cards** (3–4 placeholder cards with shimmer using existing `Skeleton` component) — so something visible appears within 50ms instead of a frozen button.
- Replace the generic "Travelling the globe…" full-width button label with a tighter inline spinner + short text on the button, and let the skeletons carry the "loading" message.
- Keep the existing AI call as-is (no model swap — actual latency is bounded by the model and reducing it risks quality regressions).

### 3. Minor polish
- Disable the button + show a small "Generating 10 receipes…" caption directly under it while loading.
- After results arrive, smooth-scroll to the first result card.

## Files

- `src/routes/index.tsx` — move the cuisine-flow results JSX into the cuisine section, add skeletons, add scroll-into-view on submit, tighten button label.

No backend, schema, or server function changes.
