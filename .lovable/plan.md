# Densify landing page (Airbnb-style)

Goal: eliminate the dead space across the page so it reads as a content-rich product, not an editorial poster. Palette and fonts untouched.

## Changes

**1. Hero (compact)** — `src/routes/index.tsx`
- Drop top/bottom padding (`pt-2 md:pt-6 pb-4` → `pt-1 pb-2`).
- Reduce headline to `text-3xl md:text-5xl lg:text-6xl` (from 4xl/6xl/7xl), `mb-4` (from `mb-6`).
- Shrink rotating prompt min-height and `mb-4` (from `mb-8`).
- Tighten food collage backdrop height (`h-[520px] md:h-[640px]` → `h-[360px] md:h-[440px]`).
- Tighten subsequent margins (`mt-4 mt-5` → `mt-3`).

**2. Pantry row gap** — `src/routes/index.tsx`
- When NOT in `pantryMode` (or no results yet), render a content panel in `col-span-7` instead of empty space: a "Saved & recent" mini-grid or a compact "Popular pantry combos" card list that pre-fills 4–6 starter recipe ideas the user can click to auto-fill the pantry input.
- When in pantry mode with results, behaviour unchanged.

**3. Empty Community / Premium strips**
- `CommunityStrip`: if zero items, hide the section entirely (return null) instead of rendering empty card frames.
- `PremiumRecipesStrip`: same — hide when empty, OR show 4 hardcoded sample chef-recipe cards (real images + titles + prices) so the section always has substance. Default: hide-when-empty for both.

**4. Denser TrendingDishes** — `src/components/landing/TrendingDishes.tsx`
- Replace 4-tile bento with a uniform `grid-cols-2 md:grid-cols-4 lg:grid-cols-4` × 2 rows = **8 dish cards**, equal-sized, `aspect-[4/5]`, `gap-3 md:gap-4`.
- Remove `h-[640px]` fixed height; let grid flow.
- Each card: image + flag chip + dish name overlay (same look as current `small` variant).
- Rotation still cycles 8 dishes every 8s.

**5. Global rhythm tightening** — `src/routes/index.tsx`
- Container: `max-w-6xl` → `max-w-7xl` on the main grid.
- Section gaps: the hero-grid `gap-12 md:gap-20` → `gap-8 md:gap-12`.
- ChefCTA / Testimonials wrappers: `mt-20 md:mt-28` → `mt-12 md:mt-16`.
- CommunityStrip & PremiumRecipesStrip own internal top margin: reduce to `mt-12`.
- Section vertical padding inside dark "How it works" panel: `py-12 md:py-20` → `py-10 md:py-14`.

**6. CountryTiles** — leave the marquee as-is (it's functional density). No changes.

## Out of scope
Colors, fonts, copy, business logic, routes, data fetching.

## Technical notes
- Edits in `src/routes/index.tsx`, `src/components/landing/TrendingDishes.tsx`, `src/components/fridge/CommunityStrip.tsx`, `src/components/landing/PremiumRecipesStrip.tsx`.
- For the new "Popular pantry combos" panel: hardcode 4–6 combos client-side (e.g. "Chicken + rice + soy", "Pasta + tomato + basil"), each a button that calls `setIngredients([...])`. No backend changes.
- Verify at current viewport (1000px) and at 390px mobile.
