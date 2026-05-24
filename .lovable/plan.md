## Direction (locked)
"Warm storytelling editorial" — cream `#FBF8F1` background, surface `#EFE9DA`, ink `#1F2A1A`, single olive accent `#6B8E23`. Outfit (semibold, mixed-case, tracking-tight) for headings; Figtree for body. Bento composition. Hairline borders + soft shadows. No chunky black borders. No hard offset shadows. No all-caps display.

## 1. Replace design tokens (project-wide)
Update `src/styles.css`:
- Rewrite the OKLCH variables for `--background`, `--card`, `--foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--accent` to the locked palette. Keep dark-mode tokens but don't focus on them in this turn.
- Drop / lighten the neo-brutalist shadow utilities. Replace `shadow-[3px_3px_0px_0px_var(--border)]` style pattern usage by introducing a `--shadow-soft` token (e.g. `0 8px 24px -8px rgb(31 42 26 / 0.08)`) and a `--shadow-card` (`0 24px 48px -16px rgb(31 42 26 / 0.10)`).
- Set base font to Figtree, display font to Outfit. Add `@import` (or `<link>` in `__root.tsx`) for Google Fonts: Outfit 400/500/600 + Figtree 400/500.
- Keep brand color tokens (`--paprika`, `--turmeric`, `--saffron`, `--ink`) but redirect them to the new palette so existing components don't break — `--paprika`→olive `#6B8E23`, `--turmeric`/`--saffron`→cream surface, `--ink`→`#1F2A1A`.

## 2. Rebuild the homepage sections
Rewrite `src/routes/index.tsx` to match the prototype's composition, using the existing data hooks (no business-logic changes). New section order on desktop and mobile:

1. **Sticky top nav** (`fridge cuisine.` wordmark left, Community / Sign In / Sign Up pill right) — replace the current `<TopBar>` styling but reuse its links and auth state.
2. **Centered hero** — kicker "Dish to Recipe", `h1` "See something that made you hungry?" (two-line break), 1-line subhead, and a single pill input with embedded olive "Start Cooking" button. Removes the chunky bordered card.
3. **Country chips row** — `CountryTiles.tsx` rewritten as a flat wrap-flow of soft cream pills (`bg-[surface] border border-ink/5 rounded-full px-6 py-3`), each `flag + name`. Hover swaps to olive bg / white text. Mobile keeps a horizontal swipe with `flex-nowrap overflow-x-auto`. Drop the marquee + dual-row carousel entirely. Add a final `+ N more` ghost pill that expands to the full set.
4. **Trending bento** — `TrendingDishes.tsx` rewritten as a 4-col × 2-row grid (mobile: stacked):
   - Tile A `col-span-2 row-span-2` — hero dish with country chip, large Outfit title, "Start cooking now →" hover-translate.
   - Tile B `col-span-2` — secondary dish, country kicker in olive.
   - Tile C, D — two square tiles.
   - Keeps the existing silent 3.5-min rotation logic (just restyle the tiles; preserve `pickUnique`, `useEffect` interval, slot keys).
5. **How it works** — three-column row, olive-tint circle numerals (`bg-[#6B8E23]/10 text-[#6B8E23] border border-[#6B8E23]/20`), Outfit headings, Figtree body. Replaces `HowItWorks.tsx`.
6. **Chef CTA** — restyle `ChefCTA.tsx`: drop the paprika-gradient card, replace with a calm full-width section on cream surface with one editorial photo on the right, headline + 2 olive pill buttons (`Start selling` primary olive, `Browse chefs` ghost). Keeps existing routes.
7. **Pantry composer** — keep all functionality (ingredients chips, dietary, cuisine vibe, generate). Re-skin to use the new tokens: white card, hairline border, soft shadow, olive primary button, no hard offset shadows. No copy/logic changes.
8. **Community feed** — re-skin existing `<CommunityHomeFeed>` recipe cards to use the new tokens (white surface, hairline border, Outfit title, Figtree body, soft shadow). Functionality untouched.
9. **Footer** — minimal hairline-bordered row with wordmark + small print.

## 3. Component re-skins (no logic changes)
- `src/components/landing/TopBar.tsx` — restyle nav per direction.
- `src/components/landing/CountryTiles.tsx` — replace marquee with chip-flow, drop tile shadows/borders, keep `onPick` and the country data.
- `src/components/landing/TrendingDishes.tsx` — keep the silent rotation logic + dish pool + uniqueness; replace the grid markup with the bento layout from the prototype; assign stable slot positions to the 4 visible tiles.
- `src/components/landing/HowItWorks.tsx` — restyle to numbered olive circles + Outfit/Figtree.
- `src/components/landing/ChefCTA.tsx` — restyle to calm photo+text section.
- `src/components/CommunityHomeFeed.tsx` — restyle card surfaces only.
- The pantry composer in `src/routes/index.tsx` (and any chips/inputs it uses) — re-skin only.

## 4. Keep functional and copy invariants
- All routing, server functions, RLS, recipe generation, marketplace, community feed, auth — unchanged.
- Trending dishes silent 3.5-min rotation behaviour — unchanged.
- Country chip click → fills the hero search input — unchanged.
- Mobile swipe behaviour for country chips — preserved as horizontal `overflow-x-auto`.
- All existing copy stays the same except: drop the "Cook the world tonight — 50+ cuisines from every continent" subhead and the "Swipe for 50+ cuisines →" instruction (replaced by chip-row + `+ N more`).

## 5. Out of scope
- No new server functions, no DB changes.
- No new image generation in this turn — reuse existing food images for the bento tiles (mapped by slot, not generated).
- Dark mode tuning — pass-only (won't break, but not polished).

## Files touched
- `src/styles.css` (tokens, fonts, shadows)
- `src/routes/__root.tsx` (Google Fonts `<link>`)
- `src/routes/index.tsx` (section composition + pantry/community re-skin)
- `src/components/landing/TopBar.tsx`
- `src/components/landing/CountryTiles.tsx`
- `src/components/landing/TrendingDishes.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/ChefCTA.tsx`
- `src/components/CommunityHomeFeed.tsx` (card surface only)
