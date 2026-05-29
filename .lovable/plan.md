## Problem
The "FridgeCuisine" heading at the top of the `/login` page uses `text-5xl` on all screen sizes. On mobile (390px wide), this is too large — the text overflows or looks cramped.

## Fix
In `src/routes/login.tsx`, update the heading classes from:
```
text-5xl md:text-6xl
```
to:
```
text-3xl sm:text-4xl md:text-5xl lg:text-6xl
```

This makes the logo 30px on mobile, 36px on small tablets, 48px on desktop, and 60px on large screens — fully visible and proportional on all devices.

## Files changed
- `src/routes/login.tsx` (1 class string edit)
