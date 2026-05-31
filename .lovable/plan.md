The site currently has a warm, playful food-magazine look (cream, terracotta, thick borders, heavy rounding). To elevate it to a more professional, premium feel, I propose a focused restyle across five areas:

## 1. Color Palette — Restrained & Sophisticated
- Shift the primary accent from terracotta/paprika to a deep, warm ink (`#1A1A1A`) as the dominant text/CTA color.
- Keep the warm paper/cream background but make it slightly crisper.
- Introduce a muted warm gold (`#C9A84C`) as the sole accent for CTAs and highlights — used sparingly.
- Replace thick borders with subtle hairline borders (`#E7E5E4` 1px) or remove borders entirely in favor of soft shadow separation.

## 2. Typography — Sharper Hierarchy
- Keep the serif display font (Playfair Display) for headlines but reduce decorative uppercase usage.
- Increase the contrast between heading sizes: hero H1 larger and bolder, body text slightly smaller and tighter leading.
- Use ink/black for primary text instead of terracotta to feel more editorial and less playful.
- Reduce the number of font sizes on the page for consistency.

## 3. Layout — Structured Full-Width Bands
- Refactor the homepage (`index.tsx`) into clearly separated full-width section bands with generous vertical padding (`py-20` to `py-28`).
- Alternate band backgrounds: warm paper, pure white, and a single near-black band for contrast (e.g., the chef/premium CTA section).
- Center content within a tighter max-width container (`max-w-6xl` or `max-w-7xl`) to create more whitespace on the sides.
- Improve the hero: reduce clutter, increase whitespace, make the headline the dominant element.

## 4. Components — Refined & Minimal
- **Buttons**: Remove thick 2px borders and heavy rounding. Use either solid ink with white text, or subtle outlined buttons with 1px borders and moderate rounding.
- **Cards**: Remove the thick border style. Use a very subtle shadow or a clean 1px hairline. Reduce internal padding slightly.
- **Saved drawer / modals**: Cleaner header, thinner dividers, more whitespace.
- **Recipe cards**: More breathing room, subtler save/cooked indicators.

## 5. Key Sections to Restyle
- **Hero**: Bigger headline, cleaner ingredient input bar, less visual noise around the search area.
- **Trending / Premium strips**: Better grid alignment, consistent card sizing, remove heavy borders.
- **How It Works**: Simpler step layout with cleaner iconography/typography.
- **Footer**: More structured, editorial footer with clear columns.
- **Cookbook page**: Cleaner table/list view with better spacing.

## Technical approach
- Update `src/styles.css` to remap the brand tokens (`--paprika`, `--turmeric`, etc.) and adjust the shadcn theme variables.
- Refactor `src/routes/index.tsx` to use the new section band structure.
- Refactor shared components (`RecipeCard`, `SavedDrawer`, `SiteFooter`, `PremiumRecipesStrip`, etc.) for the cleaner card/button treatment.
- Keep all existing functionality, auth, server functions, and routing untouched — this is a pure visual restyle.