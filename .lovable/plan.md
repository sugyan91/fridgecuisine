# FridgeCuisine Visual Redesign

Right now the site reads flat and generic on mobile: thin hairlines, muted stone/gold, and a small serif that gets lost on a 390px screen. I'll take it in a **warm editorial "Trattoria Modern"** direction — food-magazine energy that actually makes you hungry, engineered mobile-first.

## Design direction (picked)

**Palette — Sunset Kitchen**
- Background: warm ivory `#FFF7EE`
- Ink: near-black espresso `#1B120E`
- Primary CTA: deep tomato `#D7452B`
- Accent: saffron gold `#F2A73B`
- Support: basil green `#2F5D3A` for tags/success
- Dark bands: rich cocoa `#2A1D17` (used for hero sections + footer)

**Typography**
- Display: **Fraunces** (high-contrast serif, italic optical size) — big, confident magazine headlines
- Body/UI: **Inter Tight** — crisp, legible at small sizes
- Eyebrow labels: uppercase Inter Tight with wide tracking
- Real mobile scale: H1 clamps 40→72px, body 16px min, eyebrows 12px

**Feel**
- Editorial, warm, hand-plated. Not "AI SaaS." Think Bon Appétit meets a modern Milanese trattoria menu.
- Restore visual weight: remove the global `border-2 → 1px` override that flattened everything. Bring back deliberate 1.5–2px borders on cards, buttons, and tags.
- Generous rounded corners (2xl+), soft warm shadows, tomato/gold accent underlines on section headings.

## Mobile-first fixes (the "looks like shit on mobile" part)

- Rebuild the hero: bigger typographic scale, single-column stacked composition, sticky primary CTA area, no cramped side-by-side widgets.
- Cards get real presence: cream surface, 1.5px ink border, 20–24px radius, warm shadow, larger tap targets (min 44px).
- Section headings use a display serif + saffron underline motif so scrolling on mobile feels rhythmic.
- Increase base font size, tighten line-height on display, loosen on body, add proper section padding (`py-16 sm:py-24`).
- Apply the responsive grid pattern to header rows (`grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` + `shrink-0 truncate`) so nothing collapses on 390px.

## Scope of changes (presentation only, no business logic)

1. **`src/styles.css`** — replace the palette (light + dark), swap font tokens to Fraunces + Inter Tight, add warm shadow + gradient tokens, remove the `border-2 → 1px` override, add utility classes for the accent underline and warm section bands.
2. **`src/routes/__root.tsx`** — swap the Google Fonts `<link>` to load Fraunces + Inter Tight, update `<title>` / meta description tone to match the new voice.
3. **Landing composition** — restyle (not restructure) these to the new system:
   - `src/routes/index.tsx` (hero + section rhythm)
   - `src/components/landing/HowItWorks.tsx` / `HowItWorksStrip.tsx`
   - `src/components/landing/TrendingDishes.tsx`
   - `src/components/landing/PremiumRecipesStrip.tsx`
   - `src/components/landing/CountryTiles.tsx`
   - `src/components/landing/Testimonials.tsx`
   - `src/components/landing/ChefCTA.tsx` / `ChefSellBanner.tsx`
   - `src/components/landing/SiteFooter.tsx`
4. **Shared surfaces** used everywhere: `src/components/fridge/RecipeCard.tsx`, `src/components/fridge/IngredientInput.tsx`, `src/components/fridge/CommunityStrip.tsx` — new card/button/tag styling via tokens.
5. **Buttons and tags** — introduce a `premium` and `warm` variant on the existing shadcn Button so CTAs get the tomato→saffron gradient without touching call sites' logic.

## Out of scope

- No changes to routing, data loading, server functions, auth, iOS icon pack, or any backend.
- No new dependencies beyond Google Fonts already loaded via `<link>`.

## What you'll see when it ships

A warm, magazine-grade homepage that feels appetizing on a phone: big Fraunces headlines, tomato CTAs, cream cards with real edges, saffron accents, and clear rhythm as you scroll. Interior pages inherit the tokens automatically.

If you want a different flavor (darker/moodier "Noir & Gold," or brighter "Sunset Blaze"), say the word before I build and I'll swap the palette in the plan.
