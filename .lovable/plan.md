# Landing Page Redesign — Fresh & Organic

Make FridgeCuisine's home page mobile-first and visually rich while preserving every existing function (dish search, fridge generation, saved drawer, recipe results, auth, limits, admin).

## Visual direction

- **Palette (Fresh & Organic)** added as semantic tokens in `src/styles.css`:
  - Cream background `#f5f0e8`
  - Sage primary `#87a878`
  - Tomato accent `#e85d3a` (CTA, highlights)
  - Forest ink `#2d3a2d` (text, borders)
- Soft rounded cards, hand-drawn feel borders, generous whitespace, photo-forward.
- Typography: keep existing display font, tighten mobile hierarchy.

## New landing-page structure (top → bottom)

1. **Sticky header** — slimmer on mobile, logo + Community + Saved/Account.
2. **Hero — Country flag tiles**
   - Headline + one-line subhead.
   - Two primary inputs (dish search + "Use my fridge" CTA), stacked on mobile, side-by-side on desktop.
   - Below: horizontally scrollable row of **country tiles** (flag emoji + cuisine name, e.g. 🇮🇹 Italian, 🇯🇵 Japanese, 🇮🇳 Indian, 🇲🇽 Mexican, 🇹🇭 Thai, 🇫🇷 French, 🇰🇷 Korean, 🇱🇧 Lebanese, 🇪🇹 Ethiopian, 🇵🇪 Peruvian, 🇨🇳 Chinese, 🇻🇳 Vietnamese). Tap → sets cuisine filter and scrolls to ingredient input / triggers a "surprise me" recipe.
3. **Popular cuisines strip** — chip grid with flags, doubles as quick filters.
4. **Trending dishes gallery**
   - Responsive grid (1 col mobile → 2 → 3) using existing imported food images (pasta, sushi, tacos, curry, burger, pizza, dal, saag, paneer, momo, chana, rice).
   - Tapping a dish auto-fills dish search and runs `fetchDish` (respecting limits).
5. **How it works (3 steps)** — icon cards: ① Add ingredients or name a dish → ② AI finds a recipe → ③ Cook & save. Lucide icons (Refrigerator, Sparkles, ChefHat).
6. **Community preview** — keep `CommunityStrip` but restyle into a card grid with "See all" → `/community`.
7. **Footer** — small links + pricing note.

Existing **results area** (loading, recipe cards, load more, dish recipe modal, timers, pantry mode) renders below hero when active — unchanged logic, restyled to match new tokens.

## Mobile-first specifics

- Base styles target 360–414px; scale up at `sm/md/lg`.
- Tap targets ≥ 44px, larger search input font (prevents iOS zoom).
- Country tiles & gallery use horizontal snap-scroll on mobile, grid on desktop.
- Reduce sticky header height on mobile; remove the per-frame `ResizeObserver` padding hack in favor of fixed `pt-[64px] md:pt-[80px]`.
- Pricing/upgrade note moves into footer area instead of competing with hero.

## Technical changes

- `src/styles.css`: add Fresh & Organic OKLCH tokens (`--background`, `--primary`, `--accent`, `--ink`, gradients, shadows).
- `src/routes/index.tsx`: restructure JSX into composed sections; preserve all existing state, server-fn calls, and handlers.
- New presentational components (no business logic) in `src/components/landing/`:
  - `CountryTiles.tsx` — flag tiles, calls `onPickCuisine(name)`.
  - `CuisineChips.tsx` — popular cuisines.
  - `TrendingDishes.tsx` — image gallery, calls `onPickDish(name)`.
  - `HowItWorks.tsx` — 3-step explainer.
  - `LandingFooter.tsx` — links + pricing note.
- Reuse existing assets in `src/assets/` (food-pasta, food-sushi, etc.) — no new image generation needed.
- Keep `IngredientInput`, `FilterPanel`, `RecipeCard`, `SavedDrawer`, `CommunityStrip`, `RecipeCounter`, `AdminPanel` untouched; only their wrappers/spacing change.

## Out of scope

- No backend, auth, schema, or payments changes.
- No new routes; this is index page only.
- Apple App Store prep items from earlier (Sign in with Apple, IAP, etc.) remain deferred.
