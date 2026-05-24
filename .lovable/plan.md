## Goal

Replace the current cluttered landing page with a cohesive, premium editorial design using the locked direction: **Emerald Prestige palette**, **Archivo Black / Hind typography**, **magazine layout**. I'll build the "Centered Magazine" direction (polished, rounded, premium) since you skipped the picker.

## Design tokens (rewrite `src/styles.css`)

Replace Autumn Harvest with Emerald Prestige:
- `--background` → `#f5f0e0` (parchment cream)
- `--foreground` / `--ink` → `#064e3b` (deep emerald)
- `--primary` → `#064e3b` (emerald), primary-foreground `#f5f0e0`
- `--secondary` / surfaces → `#0d7a5f` (mid emerald)
- `--accent` → `#c9a84c` (gold)
- `--card` → `#ffffff` with emerald border
- Shadows → emerald-tinted
- Fonts: load `Archivo Black` (display) + `Hind` (body) via Google Fonts in `__root.tsx`; set `--font-display` and `--font-body` tokens; map Tailwind `font-sans` to Hind and `font-display` to Archivo Black
- Redirect brand-legacy tokens (`--turmeric`, `--paprika`, `--cream`) to the new palette so existing component classes keep working

## Page rebuild (`src/routes/index.tsx` + section components)

Rewrite into clean editorial sections, in order:

1. **Sticky nav** — emerald logo dot + "fridge cuisine." in Archivo Black, gold-hover links, pill "Join Club" CTA
2. **Hero** — centered: small gold-bordered "X recipes today" pill, massive Archivo Black headline with one gold-accented word, supporting sentence, large rounded search input with embedded emerald CTA
3. **Cuisine Atlas** (full-bleed emerald band) — section kicker + heading left, intro right; 5-column tile grid of country cards (flag + label), one active state, one "+37 more" gold tile
4. **Trending Right Now** (editorial grid) — 2/3 featured hero card with overlay caption + gold "Featured Dish" tag; 1/3 stacked side cards (square + video aspect) with country kicker, Archivo Black title, time-to-cook
5. **How it works** — 3 columns with oversized faded gold numerals (01/02/03) and short descriptions
6. **Chef Earnings CTA** — emerald rounded panel: headline + copy + two buttons left; 2×2 stat tiles right (price/reach/upfront/payout)
7. **Pantry tool** — white section, cream rounded card with gold "01" badge, chip input, dietary filter grid, full-width emerald submit
8. **Community feed** — 4-column grid of user cards (image, handle, quote)
9. **Footer** — emerald, 4 link columns + tagline strip

Keep all existing functionality (search submit, country click, pantry add, recipe fetch, auth links) — only swap markup and classes.

## Files touched

- `src/styles.css` — palette + font tokens
- `src/routes/__root.tsx` — Google Fonts link
- `src/routes/index.tsx` — restructured composition
- `src/components/landing/*` (TrendingDishes, CountryExplorer, HowItWorks, ChefEarnings, PantryTool, CommunityStrip, RecipeCounter, etc.) — restyled to new tokens & layout
- `tailwind`/`styles.css` font family mapping

## Out of scope

- Backend, routes other than `/`, auth flows
- Recipe generation logic
- New images (reuse existing `src/assets/food-*` and `recipe-*`)

After build I'll screenshot at desktop + mobile and fix any alignment/overflow before handing back.