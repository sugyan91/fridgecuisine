## Fix

Bring the logo back on mobile and shrink the nav buttons so everything fits without congestion.

1. **Logo** — remove `hidden sm:block`; show on all sizes. Keep `h-9` on mobile, `h-10` on `md:`.
2. **Wordmark** — drop to `text-base` on mobile (back up to `text-lg sm:text-xl` from `sm:` upward) so it pairs nicely with the smaller logo.
3. **Nav pill buttons (Community / Sign in / Sign up, plus Share / Saved / Sign out when logged in)** — shrink text from `text-[10px]` to `text-[9px]` on mobile and tighten padding to `px-1.5 py-1` (keep `sm:`+ sizes as they are). Keep all three pills the same size on mobile.
4. **Container** — keep `px-2` mobile padding and `gap-1` between nav items.

Result on a 375px viewport: small logo + "fridge cuisine." wordmark on the left, three compact same-size pill buttons on the right, with comfortable spacing between brand and nav.

## Files

- `src/routes/index.tsx` — header block only (~lines 316–402). No logic changes.
