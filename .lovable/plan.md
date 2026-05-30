# Landing layout polish (palette untouched)

Goal: make the page feel more intentional and editorial by improving composition, spacing, hierarchy, and rhythm. No color, font, or copy changes.

## Section-by-section moves

**Hero**
- Tighten vertical rhythm: shrink top padding on mobile, increase headline tracking control, cap line-length to ~14ch on the display line.
- Add a 2-col asymmetric grid on ≥md (60/40): copy left, ingredient input + "popular pantry chips" right in a soft card, instead of stacked full-width.
- Add a thin hairline divider + small eyebrow label ("No 01 — Pantry to plate") for editorial feel.

**CountryTiles**
- Switch from uniform grid to a **magazine bento**: one feature tile (2x2) + smaller tiles around it on desktop; horizontal snap-scroll on mobile with peek of next tile.
- Add subtle hover: image scale 1.03 + caption slide-up.

**TrendingDishes**
- Replace flat grid with a **7/5 editorial split**: large hero dish left, 4 stacked mini-cards right on desktop. Mobile becomes a carousel with snap.
- Add rank numerals (01–08) as oversized outline numerals behind each card title.

**HowItWorks**
- 3 cards in a staggered row: middle card lifted (-translate-y-4), larger, with a stronger shadow — visual focal point.
- Add connecting hairline between steps on desktop.

**PremiumRecipesStrip / Community**
- Convert to horizontal scroll rail with snap + edge fade masks; show ~3.5 cards on desktop, 1.2 on mobile.

**ChefCTA**
- Make it a full-bleed pill-rounded panel (rounded-[2.5rem]) with generous padding, large display headline left, stacked CTAs right. Add a soft radial glow using existing primary token at low opacity.

**Testimonials**
- Switch to a masonry-ish 3-column varied-height layout on desktop; keep stacked on mobile. Add a pull-quote style large opening quote mark.

**SiteFooter**
- Restructure into 4 columns (Brand / Explore / Resources / Legal) with a top hairline. Add a large wordmark above the columns.

**Global rhythm**
- Standardize section vertical padding: `py-20 md:py-28`.
- Add max-width container `max-w-7xl` consistently.
- Insert thin `border-t border-border/60` hairlines between major sections for editorial cadence.
- Add small eyebrow labels ("Featured", "How", "Voices") above each section heading.

## Technical notes
- Edits limited to `src/routes/index.tsx` + files in `src/components/landing/*`.
- Tailwind class-only changes; no new dependencies.
- Uses existing semantic tokens (`bg-card`, `border-border`, `text-muted-foreground`, `text-primary`, etc.) — palette unchanged.
- Verify at 390px (current viewport) and ≥md breakpoints.

## Out of scope
Colors, fonts, copy, business logic, routes, data.
