## Problem

In `src/routes/index.tsx`, the `onLoadMore` handler (lines ~250-275) silently fails in two cases, so clicking "Show more receipes" appears to do nothing:

1. **Empty ingredients guard:** `if (!receipes || ingredients.length === 0) return;` — if the user cleared their ingredient pills after generating recipes (or generated them in a flow that doesn't require ingredients), the click is silently dropped with no toast and no loading state.

2. **All-duplicate response:** After fetching more, results are de-duplicated against existing titles with `fresh = res.receipes.filter(...)`. If the AI returns only titles already shown, `fresh` is empty, `setRecipes([...receipes, ...fresh])` is a no-op, and the UI shows nothing changed — no message to the user.

## Fix

Update `onLoadMore` in `src/routes/index.tsx`:

- Remove the silent `ingredients.length === 0` early-return; instead, if ingredients are empty, show a toast asking the user to add ingredients (and skip the call). Keep the `!receipes` guard.
- After de-duplication, if `fresh.length === 0`, show an info toast like "No new receipes — try changing cuisine or dietary filters" so the user gets feedback instead of a dead click.
- Also log the response when `!res.ok` already happens (it does via `toast.error(res.error)`), no change needed there.

No backend / server-function changes. UI-only fix in one file.

## Files

- `src/routes/index.tsx` — update `onLoadMore` (~lines 250-275).
