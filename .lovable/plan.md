## Plan

Remove the entire "Popular pantry combos" section from the home page (`src/routes/index.tsx`).

### What will be removed

- The `<PopularCombos>` component definition at the bottom of `src/routes/index.tsx`.
- The `<PopularCombos>` render call in the main page layout.
- The `ALL_POPULAR_COMBOS` import from `@/data/popular-combos.ts` if it is no longer used elsewhere in `src/routes/index.tsx`.

### What will be kept

- The rest of the pantry section ("What's in your Pantry" input, cuisine selector, generate button, recipe results).
- The `src/data/popular-combos.ts` file itself is harmless to leave in place; it can be deleted later if desired, but removing the render is the requested change.

### Verification

- Typecheck with `bunx tsgo --noEmit`.
- Confirm the homepage no longer shows the "Popular pantry combos" tiles and that no console errors appear.

### Files touched

- `src/routes/index.tsx`