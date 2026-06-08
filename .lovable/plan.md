# Image Accuracy Fixes for TrendingDishes

`src/components/landing/TrendingDishes.tsx` has 134 hardcoded Unsplash photo IDs, and many are duplicated across unrelated dishes — guaranteeing wrong images regardless of whether they load. It also has no `onError` fallback (unlike `RecipeCard`), so any broken ID shows blank.

## Confirmed duplicate photo IDs (same image, different dishes)

- `1496116218417-1a781b1c416c` → Steamed Momo, Xiao Long Bao, Pierogi
- `1547573854-74d2a71d0826` → Lamb Tagine, Borscht, Beef Stroganoff, Ajiaco, Clam Chowder
- `1604329760661-e71dc83f8f26` → Jollof Rice, Feijoada, Chicken Adobo, Jerk Chicken
- `1544025162-d76694265947` → Brisket, Lechon, Sunday Roast, Swedish Meatballs
- `1599487488170-d11ec9c172f0` → Tandoori, Adana Kebab, Schnitzel, Wiener Schnitzel
- `1565958011703-44f9829ba187` → Doro Wat, Lomo Saltado, Koshari, Bunny Chow, Cheesecake
- `1547496502-affa22d38842` → Beef Bourguignon, Goulash, Bobotie
- `1604544539681-3e74cc97817b` → Empanadas, Arepas
- `1490474504059-bf2db5ab2348` → Açaí Bowl ×3
- `1540420773420-3366772f4999` → Greek Salad, Smørrebrød, Falafel Wrap, Burrata Caprese
- Several more in the same pattern

Plus the original issue: many IDs 404 entirely (the Pho Bo case we already fixed by switching to a local Wikimedia asset).

## Plan

### 1. Add onError fallback to `BentoTile`
Mirror the `RecipeCard` pattern: cuisine-emoji + dish name on a gradient background. On `<img onError>`, swap to the fallback so a tile is never blank. Use the existing `flag` emoji (already per-dish) — no new mapping needed.

### 2. Replace duplicate Unsplash IDs with curated, dish-specific photos
For each duplicate group, keep one dish on the original ID and assign unique, accurate Unsplash IDs (verified to load and depict the right dish) to the others. Roughly 30 IDs to swap.

### 3. Convert the worst offenders to local Wikimedia assets
For internationally distinctive dishes where a wrong photo is most jarring, download Wikimedia Commons photos into `src/assets/trending/` and import locally (same approach as `pho-bo.jpg`). Target list:
- Steamed Momo (Nepal)
- Xiao Long Bao (China)
- Pierogi (Poland)
- Borscht (Ukraine)
- Doro Wat (Ethiopia)
- Jollof Rice (Nigeria)
- Bunny Chow (South Africa)
- Lomo Saltado (Peru)
- Bibimbap (already accurate, skip)

This guarantees those 8 cards always show a correct, licensed image.

### 4. No backend / no business logic changes
Pure presentational fix in `TrendingDishes.tsx` + new files under `src/assets/trending/`.

## Files touched
- `src/components/landing/TrendingDishes.tsx` — add fallback, swap duplicate IDs, import local assets
- `src/assets/trending/*.jpg` — ~8 new files

## Out of scope
- Server-side image generation for trending tiles (current client-side AI gen is only used in `RecipeCard`, not here)
- Refactoring the hardcoded dish list into a CMS / DB
