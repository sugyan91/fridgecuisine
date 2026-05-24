## Fixes

### 1. Show "fridge cuisine" wordmark on mobile without overlap (`src/routes/index.tsx`)
Restore the wordmark on small screens but shrink it so it fits next to the nav at 390px:
- Wrapper: `hidden sm:block` → `block` (always visible).
- `<h1>` size: `text-lg md:text-xl` → `text-[13px] sm:text-lg md:text-xl`.
- Logo image height: `h-8 md:h-9` → `h-7 sm:h-8 md:h-9`.
- Logo Link gap/margin: `gap-2.5 ... mr-2` → `gap-1.5 sm:gap-2.5 mr-1 sm:mr-2`.
- Nav gap: `gap-1.5 md:gap-2` → `gap-1 md:gap-2`, and "Community" link padding `px-2.5` → `px-2` on mobile.

This keeps everything readable, gives the nav buttons enough room, and the wordmark no longer collides with "Community".

### 2. Remove "Ready when you are" heading + the box beneath it (`src/routes/index.tsx`)
In the right column (~lines 777-799), the heading row and `<EmptyState />` only render when there are no generated recipes. Delete:
- The `<div className="flex items-baseline justify-between">` block with "Ready when you are".
- The `{!loading && !receipes && <EmptyState />}` line.
- The unused `EmptyState` function and its now-orphan food-image imports (`dalImg`, `saagImg`, `riceImg`, `paneerImg`, `momoImg`, `chanaImg`, `pastaImg`, `sushiImg`, `tacosImg`, `curryImg`, `burgerImg`, `pizzaImg`) at the top of the file.

The column still shows the loading skeleton during generation, then the recipe cards + "Show more" button. When idle and empty, the column collapses cleanly.

### 3. Move monetization (`PricingNote`) to the very bottom of the page (`src/routes/index.tsx`)
Currently `<PricingNote />` sits inside the recipes column. Move it out:
- Remove it from `<section className="lg:col-span-7 …">`.
- Render it after `<CommunityStrip />`, just before the floating saved button, as its own full-width strip:
  `<div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-border"><PricingNote /></div>`.

So the page now ends with: sections → CommunityStrip → Monetization note → (mobile FAB).

## Out of scope
Colors, marquee, bento timer, server logic, copy elsewhere.