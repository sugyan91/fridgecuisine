## Goal

Fix the inaccurate photos in the homepage "Trending Dishes" grid by replacing the random hashed local-image fallbacks with one AI-generated, dish-specific photo per entry, saved as a project asset. No runtime AI calls, no credit cost per pageview.

## What's wrong today

`src/components/landing/TrendingDishes.tsx` has ~32 dishes. Only 9 have a real matching photo (pho-bo, momo, xiao-long-bao, pierogi, borscht, doro-wat, jollof-rice, bunny-chow, lomo-saltado). The other ~23 dishes go through `u(id)` which hashes an id into one of 6 generic photos (pasta / sushi / tacos / curry / pizza / burger). That's why Carbonara might show a pizza, Pad See Ew might show a burger, etc.

## Plan

1. **Generate one photo per dish** using the agent-side `imagegen--generate_image` tool (`fast` tier, 1024×1024, .jpg). Prompt template per dish: authentic, photorealistic, overhead 3/4 plate shot, correct serving vessel, no text/watermarks — same style as the existing `pho-bo.jpg` etc. Save to `src/assets/trending/<slug>.jpg` for every dish that currently uses `u(...)`.

2. **Rewrite the `DISHES` array** in `src/components/landing/TrendingDishes.tsx`:
   - Delete the `u()` helper, the `LOCAL_DISH_IMAGES` array, and the 6 generic `foodPasta`/`foodSushi`/... imports (kept only if still used elsewhere — quick grep confirms).
   - Import each new generated jpg and reference it directly, matching the pattern of the existing curated dishes (`phoBoImg`, `momoImg`, ...).

3. **Keep the existing broken-image fallback** in `BentoTile` (flag + country card) as a safety net — no visual change needed.

## Out of scope

- No changes to layout, rotation, tile styling, or the 8-slot grid.
- No changes to any other food image on the site (recipe cards, community strip, shop).
- No runtime image generation, no new server function, no DB changes.

## Technical notes

- Tool: `imagegen--generate_image`, `model: "fast"`, `width: 1024`, `height: 1024`, `.jpg`.
- ~23 new images. All parallelizable.
- Files touched: `src/components/landing/TrendingDishes.tsx` + new files under `src/assets/trending/`.
