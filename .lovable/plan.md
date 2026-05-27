## What's wrong today

Looking at the live homepage on mobile, the issues are:

- Huge white expanses between every section — the page reads like a form, not a food brand
- Hero is text-only on a flat background; no appetite appeal
- "Hungry for inspiration" is the only section with imagery; everything else is plain text on white
- "What people are cooking" has three empty placeholder cards (dead space)
- Section transitions all look identical (white → white), so nothing has hierarchy
- Typography is uniform weight; no editorial rhythm

## Proposed direction: "warm food magazine"

Shift from clinical SaaS-white to a warm, editorial food publication feel — think Bon Appétit / Cupcakes & Cashmere — while keeping the existing coral/red accent.

### 1. Background & color system
- Replace pure white with a warm off-white base (`oklch(0.985 0.008 75)`) and introduce 2 alternate section surfaces (cream + deep charcoal) so sections alternate visually
- Add a subtle noise/paper texture overlay on cream sections
- Deep charcoal "feature" bands for "How it works" and "Monetize" so they pop

### 2. Hero rebuild
- Add a full-bleed background: blurred, darkened food photo collage (pasta + sushi + tacos already in assets) with warm gradient overlay
- Keep headline but bump display font size and add a serif display face for "HEAD" emphasis
- Add 3 small floating "ingredient chips" (🍅 tomato, 🧄 garlic, 🌿 basil) animated gently around the input — signals the fridge-to-recipe magic instantly
- Add social proof line under CTA: "★★★★★ 12,000+ meals cooked this week"

### 3. "Cook the world tonight"
- Replace flag pills with larger image cards (one hero dish per cuisine) in a horizontal scroll
- Each card: dish photo, cuisine name, "23 recipes" count
- Drop the dropdown; tapping a card filters directly

### 4. "Hungry for inspiration" (trending)
- Already the strongest section — keep, but add a 4th tile and a "See all trending" link
- Add small metadata: cook time, difficulty badge

### 5. "How it works" → dark feature band
- Move onto charcoal background with cream text
- Add a small illustration/icon per step (fridge, chef hat, bookmark)
- Tighten vertical spacing ~40%

### 6. "What's in your Pantry"
- Wrap in a card with soft shadow on cream background so it feels like a tool, not a form
- Add example pantry preview chips above the input ("Try: chicken, lemon, garlic")

### 7. Community section
- Replace empty placeholder cards with either: (a) real recent recipes if any exist, or (b) hide the section entirely until N>0, or (c) show 3 curated example cards with "Be the first to share" overlay
- Recommend option (c) for now

### 8. New section: "Loved by home cooks" (testimonials)
- 3 short quotes with avatars/initials between community and Monetize
- Adds warmth and trust, fills the awkward gap

### 9. Monetize / Chefs CTA
- Add a chef portrait image on the left, copy on the right (split layout on desktop, stacked on mobile)
- Keep dark theme but add a warm gold accent for "$" / pricing

### 10. Footer
- Currently invisible from screenshot — add a proper footer with quick links, social icons, and the $5.99/mo line repositioned there

## Technical notes

- All color changes via tokens in `src/styles.css` (new `--surface-cream`, `--surface-dark`, `--accent-gold`)
- New section components under `src/components/landing/`: `HeroBackdrop`, `CuisineCardScroller`, `Testimonials`, `ChefCTA`
- Reuse existing dish images in `src/assets/` for cuisine cards
- Animations via existing framer-motion; keep entrance subtle (fade + 8px rise)
- Mobile-first — current viewport is 390px; ensure horizontal scrollers and stacked split layouts work there first

## Scope check before I build

Three quick choices so I build the right thing:

1. Hero treatment — full food-photo backdrop, or keep clean with just an ingredient-chip animation?
2. Community section with no real data — show curated examples, or hide until users post?
3. Add testimonials section — yes (I'll write placeholder copy you can edit), or skip?

Tell me your picks (or just say "go with your defaults": photo backdrop, curated examples, yes to testimonials) and I'll implement.