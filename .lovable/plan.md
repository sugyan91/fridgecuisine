## Goal
Make fridgecuisine.com feel like a polished food publication (think NYT Cooking / Bon Appétit) instead of a playful consumer app. No section is removed; only visual treatment changes.

## Design tokens (locked, applied via `src/styles.css`)
- Background: `#FDFCFB` (warm paper), surface `#FFFFFF`, muted `#F5F3EE`
- Ink: `#1A1A1A`, secondary text `#78716C` (stone-500)
- Accent: terracotta `#BC4749` (replaces hot pink `#FF…`)
- Hairlines: `#E7E5E4` (stone-200)
- Headings: **Playfair Display** (600/700 + italic 400)
- Body / UI: **Inter** (300–600)
- Radius: 12–16px for inputs/buttons; 24px for hero image cards
- Shadows: soft, low (`0 8px 24px rgba(0,0,0,.06)`); no glow

## Section-by-section changes
1. **Nav** — White bar, hairline border, monogram `fc.` mark + serif wordmark, dark pill "Sign up".
2. **Hero** — Tiny uppercase eyebrow "FRIDGE TO DINNER" in terracotta; serif headline with italic "head" in accent; input becomes white rounded-xl with hairline border; CTA terracotta; replace emoji meta row with a single dot-separated meta line + a subtle "Sarah just cooked Thai Basil Chicken" status pill (green dot, pulses).
3. **Chefs banner** — Keep dark image card; switch heading to Playfair with italic second line; CTA becomes white-on-black pill.
4. **Cuisine picker** — Move onto a `#F5F3EE` band; replace flag emojis with small color dots; country buttons are white with hairline borders, uppercase label; primary CTA black, not pink.
5. **Trending grid** — 2-col image cards with square thumbnails, serif title beneath, tiny uppercase country tag (no emoji flags, no dark blank tiles).
6. **3-step strip** — Replace 🥬👨‍🍳🍽️ with large italic serif numerals `01 02 03` in stone-200; uppercase labels.
7. **Pantry builder** — "Snap your fridge" becomes a dashed-border ghost button with an outline camera icon; ingredient chips become uppercase tag pills; selected chip/diet uses terracotta outline + tint instead of solid pink.
8. **Chef's picks combos** — White cards with hairline borders, small circular icon chip, uppercase title, italic muted ingredient line.
9. **Monetize block** — Same composition; headline switches to Playfair with italic "culinary flair"; primary CTA black, secondary "Browse chefs" outline.
10. **Testimonials** — Dark `#1A1A1A` band, terracotta eyebrow, large Playfair italic blockquote, monogram avatar circle.
11. **Footer** — Dark, serif wordmark, uppercase column headings with wide letter-spacing, hairline divider, ★ rating pill.

## Implementation
- Update tokens in `src/styles.css` (add `--accent` terracotta, swap `--primary` usage where the hot pink lives, register Playfair Display + Inter via `<link>` in `__root.tsx` head or `styles.css` `@import`).
- Touch only presentation files under `src/components/landing/*` and `src/components/fridge/*`; no business-logic or server-fn changes.
- Replace inline emoji bullets in `HowItWorksStrip`, `PantryCombos`, cuisine list, and hero meta row with the typographic/iconographic equivalents above.
- Swap bright-pink utility classes for `bg-accent` / `text-accent` semantic tokens — no hex literals in components.
- Keep all routes, copy meaning, save/share buttons, and the dish-helper flow intact.

## Out of scope
- New sections, copy rewrites, new images, new features, dark-mode toggle.

```text
nav ─ hero ─ chefs banner ─ cuisine picker ─ trending grid ─ steps 01/02/03
   ─ pantry builder ─ chef's picks ─ monetize ─ testimonials ─ footer
```
