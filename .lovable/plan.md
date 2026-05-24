## Fixes

### 1. Slow down flag marquee (`src/styles.css`)
Currently `marquee-left: 60s` / `marquee-right: 70s`. Bump to a calm cruise: `140s` / `160s` so chips drift gently and remain readable on every viewport.

### 2. Rotate "Hungry for inspiration?" bento every 30s (`src/components/landing/TrendingDishes.tsx`)
Change `ROTATE_MS` from `210_000` (3.5 min) to `30_000` (30 s). All four bento tiles refresh together as they already do.

### 3. Fix mobile header overlap between wordmark and Community button (`src/routes/index.tsx`)
On 390px screens the `fridge cuisine.` wordmark (`whitespace-nowrap`, text-lg) collides with the right-side nav buttons. Hide the wordmark below the `sm` breakpoint and keep only the logo image; the wordmark returns on tablet/desktop. The logo image alone is recognizable and the route is still `/`.

- `<div className="min-w-0">` becomes `<div className="hidden sm:block min-w-0">` so the H1 only renders ≥640px.

## Out of scope
Hero copy, color tokens, server logic, backend, other sections.