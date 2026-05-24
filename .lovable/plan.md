## Goal
Replace the black chip flags box with a light, branded marquee — two rows of country chips scrolling sideways infinitely, each flag emoji spinning as it moves. Same behavior across mobile, tablet, desktop.

## Changes (frontend only)

### `src/components/landing/CountryTiles.tsx`
- Remove the current mobile horizontal-scroll + desktop wrap layouts and the expand/collapse state (no more "+N more" button — the marquee shows everything).
- Split `COUNTRIES` into two halves → `rowA`, `rowB` (rowB reversed so the two rows drift in opposite directions for visual interest).
- Render two stacked tracks. Each track:
  - Full-bleed wrapper with `overflow-hidden` and edge fade masks (`mask-image: linear-gradient(...)`) so chips fade in/out at the sides on every viewport.
  - Inner flex container duplicating the row twice (`[...row, ...row]`) for seamless looping.
  - Animated with a new CSS keyframe `marquee-left` / `marquee-right` translating `0 → -50%`, `duration: 45s linear infinite`, `pause on hover`.
- Chip restyle (no black):
  - `bg-card` (white) with `border-border` (#EBEBEB), `text-foreground`, hover `bg-muted` and `border-primary/40`.
  - Soft shadow on hover for lift; rounded-full preserved.
  - Click still calls `onPick(cuisine)`.
- Flag rotation: wrap the emoji `<span>` with `animate-flag-spin` — a 6s linear infinite `rotate(0 → 360deg)` keyframe. Each flag spins independently of marquee speed.
- Accessibility: add `prefers-reduced-motion` media query to disable both marquee and spin (chips become a simple wrapped row).

### `src/styles.css`
Add keyframes + utilities at the bottom:
```css
@keyframes marquee-left { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes marquee-right { from { transform: translateX(-50%) } to { transform: translateX(0) } }
@keyframes flag-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
.animate-marquee-left  { animation: marquee-left  45s linear infinite; }
.animate-marquee-right { animation: marquee-right 45s linear infinite; }
.animate-flag-spin     { animation: flag-spin 6s linear infinite; display: inline-block; transform-origin: center; }
.marquee-mask { mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); }
@media (prefers-reduced-motion: reduce) {
  .animate-marquee-left, .animate-marquee-right, .animate-flag-spin { animation: none; }
}
```

## Out of scope
Hero, ChefCTA, TrendingDishes, HowItWorks, copy, backend, routing.