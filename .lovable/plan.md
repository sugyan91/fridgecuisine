## Problem

On mobile, the header packs the logo + "fridge cuisine." title next to 3–4 pill buttons (Community, Sign in, Sign up, or Saved/Share/Sign out). The title ends up squeezed against the nav, making it look congested.

## Fix

Reduce header crowding so the brand has clear breathing room on small screens.

1. **Brand block**
   - Drop the logo image on mobile (`hidden sm:block`) so just the wordmark shows — the wordmark is already the brand.
   - Bump the title back up to `text-lg` on mobile (it's the focal element) and keep `md:text-xl`.
   - Add a small right margin so it never touches the nav.

2. **Nav buttons on mobile**
   - Shrink pill padding (`px-2 py-1` on mobile, current `px-2.5 py-1.5` on `sm:`+).
   - Tighten gap between buttons (`gap-1` mobile, `gap-2` desktop).
   - Logged-out: keep Community + Sign in + Sign up as pills (same size, as set previously).
   - Logged-in: convert the bare "Saved {n}" text button into a compact icon-style pill so it visually matches the others, and hide "+ Share" label down to just "+" on mobile (full "Share" from `sm:`).

3. **Header container**
   - Reduce horizontal padding on mobile from `px-3` to `px-2` to reclaim a few pixels.

## Result

On a 375px viewport: wordmark "fridge cuisine." sits cleanly on the left with real whitespace before a tighter row of equally-sized pill buttons on the right. Logo reappears from `sm:` (≥640px) upward where there's room.

## Files

- `src/routes/index.tsx` — header block (lines ~316–402) only. No logic changes.
