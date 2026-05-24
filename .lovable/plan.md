## Goal

Three small visual changes to the homepage:

1. Move the recipe counter row from above the hero headline to **below the "Start cooking" button**.
2. Show the same counter row **below the "Create a cuisine from the pantry list" button** (inside `FilterPanel`) and **below the "Show me the cuisine" button** (in the pantry sidebar).
3. Expand the "Hungry for inspiration?" section to draw from a pool of **100+ rotating food photos** (real images, not just 12 reused assets).

## Changes

### 1. Move counter under "Start cooking" — `src/routes/index.tsx`

- **Remove** the existing block at lines 540–542:
  ```tsx
  <div className="flex justify-center mb-6">
    <RecipeCounter userId={userId} isPremium={isPremium} />
  </div>
  ```
- **Add** the same block immediately after the `<form>` closing tag (after line 581), wrapped in `mt-4 flex justify-center`.

### 2. Counter below the two pantry buttons

**`src/routes/index.tsx`** — wrap "Show me the cuisine" button (lines 746–757) so that a `<RecipeCounter />` row renders below it with `mt-3 flex justify-center`.

**`src/components/fridge/FilterPanel.tsx`** — add a new prop `counterSlot?: React.ReactNode` and render `{counterSlot}` immediately after the "Create a cuisine from the pantry list" button (after line 172, inside the same `<div>`). In `index.tsx`, pass `counterSlot={<RecipeCounter userId={userId} isPremium={isPremium} />}` to `<FilterPanel />` (line 733).

No changes to the `RecipeCounter` component itself — same compact horizontal row reused in all three spots.

### 3. 100+ rotating food photos in "Hungry for inspiration" — `src/components/landing/TrendingDishes.tsx`

- Replace the 26-entry `DISHES` array with a **120-entry array** of `{ name, country, flag, img }`.
- Image URLs use direct Unsplash CDN links (`https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=900&q=70`) — no API key, free, fast, real food photography. I'll curate ~120 photo IDs spanning global cuisines (pasta, sushi, tacos, curry, ramen, bbq, salads, desserts, breakfast, street food, etc.).
- Drop the local `@/assets/food-*.jpg` and `@/assets/recipe-*.jpg` imports from this file (other components keep using them).
- Keep the existing 4-slot bento grid layout and `pickUnique` country-dedup logic.
- Speed up rotation: `ROTATE_MS` from `30_000` → `8_000` so users perceive the "100+ changing" variety quickly.
- Add a subtle fade transition between rotations (`key={cursor}` on each `BentoTile` + `animate-fade-in` class, which already exists via Tailwind animations in this project).
- Add `loading="lazy"` (already present) and `decoding="async"` on `<img>` to keep initial load light.

## Out of scope

- No changes to `RecipeCounter` markup/styling — same component reused.
- No changes to usage-limit logic, pricing, auth, or backend.
- No changes to hero headline copy/size, search input, or other sections.
- Not generating or bundling new local images — using hosted Unsplash CDN URLs.
