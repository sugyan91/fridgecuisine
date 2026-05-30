## Goal

Refresh the entire landing page (`/`) into a calm, food-editorial magazine experience. Tokens locked from your picks: Sage & Cream palette, Outfit (headings) + Figtree (body), magazine layout. Direction: **Editorial organic minimal** (option 1).

## Look & feel

- Background `#f5f0e8` (cream), surfaces `#dce5d4` (sage tint), accent `#a8c0a0`, primary `#7d9b76`, deep text `#2c3a28`.
- Replace dark sections + bold red CTAs with light, airy, sage-toned surfaces.
- Outfit for headings (mix bold + light italic for emphasis), Figtree for body. Add hairline rules, generous whitespace, soft rounded-2xl/3xl cards, gentle shadows, slight rotations on hero imagery, subtle hover-scale on photos.

## Sections to restyle (keep all existing functionality)

1. **Hero** — two-column: headline with "rent-free" in italic sage; cream-card input with sage primary CTA; popular ingredient chips as understated text links; a tall rounded food image with a floating testimonial card.
2. **Country tiles ("Cook the world tonight")** — flag tiles on cream surface, sage hover, hairline divider above section.
3. **Trending dishes** — magazine 7/5 grid: one large feature dish + stacked horizontal mini cards with country eyebrow + title.
4. **How it works** — 3 rounded cards, middle card raised + filled sage primary, others cream-surface with sage borders. Large light numerals.
5. **Fridge pantry panel** — keep functionality, restyle to cream card with sage accents and Outfit labels.
6. **Community strip + Chef recipes strip** — magazine row headers (eyebrow + title + "See all" underline link), softer card styling.
7. **Monetize CTA (chef section)** — large pill-rounded cream panel with sage radial glows, "Monetize your culinary flair" headline with italic sage emphasis, sage primary + outline secondary buttons. Keep this visible high enough to stay above the fold on desktop via the existing top-of-hero hook.
8. **Testimonials** — quote cards with sage accents.
9. **Footer** — switch from black to deep sage `#2c3a28` on cream with sage-tinted text.

## Technical plan

- Update **`src/styles.css`**: add/adjust semantic tokens (`--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--accent`, `--muted`, `--card`, `--border`) in `oklch` for the Sage & Cream palette in both light and dark mode; import Outfit + Figtree via `@import url(...)` and set `--font-display` / `--font-sans` CSS variables; map Tailwind font classes.
- Update **`src/routes/index.tsx`** — restructure hero, swap dark how-it-works for light card row, apply new section eyebrows/typography. Keep all data, links, and components intact.
- Update component styling (className-only changes, no logic):
  - `src/components/landing/HowItWorks.tsx`
  - `src/components/landing/CountryTiles.tsx`
  - `src/components/landing/TrendingDishes.tsx`
  - `src/components/landing/ChefCTA.tsx`
  - `src/components/landing/PremiumRecipesStrip.tsx`
  - `src/components/landing/CommunityStrip.tsx`
  - `src/components/landing/Testimonials.tsx`
  - `src/components/landing/SiteFooter.tsx`
  - `src/components/fridge/IngredientInput.tsx` (cream card surface, sage CTA)
- Use semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `border-border`, etc.) — no hardcoded hex in components.
- Verify mobile (≤390px): keep hero headline scaling `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`; ensure monetize hook still appears at top on mobile (existing logic preserved).
- Out of scope: business logic, routes, auth, data, copy beyond minor section eyebrows.

## Verification

- Screenshot full page after edits at 1000px and 390px viewports; confirm calm cream/sage feel, no dark bands, no clipped text, monetize hook visible above the fold on hero.
