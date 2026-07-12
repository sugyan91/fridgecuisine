## Goal
Replace the "★ 4.9 from 12,000+ cooks" badge in the site footer with a non-numeric trust signal that sounds realistic for a newly launched app.

## Change
Edit `src/components/landing/SiteFooter.tsx`.

- Remove the star rating and fake review count.
- Replace the badge copy with one of the following brand-aligned options (pick before implementing):
  1. **"AI-powered · Zero waste"**
  2. **"Smart recipes from your fridge"**
  3. **"Made for home cooks"**
  4. **"Your personal AI chef"**

Keep the existing visual style: small rounded pill badge with gold/accent coloring on the dark footer background.

## Out of scope
- No backend or data wiring.
- No changes to the shop recipe cards or fake-ratings helper (`src/lib/fake-ratings.tsx`), which are used elsewhere for individual recipe ratings.

## Verification
- Typecheck with `bunx tsgo --noEmit`.
- Confirm the footer no longer shows "12,000+" or a star rating in the preview.