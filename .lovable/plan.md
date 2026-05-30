# Redesign "Popular pantry combos"

Replace the dull gray-boxes design with the chosen "Appetizing pantry grid" direction: white cards on a transparent section, tinted rounded-square emoji badges, bold uppercase titles, and an elegant italic serif ingredient line.

## Changes (single file: `src/routes/index.tsx`, function `PopularCombos`)

1. **Drop the heavy outer card wrapper** — no more `bg-card border rounded-[2rem] p-6` shell. The section sits directly on the page background so the white cards pop.
2. **New header** — small red pill + `CHEF'S PICKS` eyebrow, then a bold uppercase `Popular pantry` heading with the word `combos` in the accent-colored italic serif (matches the hero treatment).
3. **2-column grid on all sizes** — `grid-cols-2 gap-3 md:gap-4` (was 1 col on mobile, 2 on sm). Denser, no awkward stacking.
4. **New card style** — each combo is a white card with `rounded-[2rem]`, soft drop shadow, no heavy border. Inside:
   - 48×48 tinted rounded-square badge holding the emoji (tint rotates per index: amber, red, emerald, sky, fuchsia, orange).
   - Bold uppercase title (`font-display font-black`).
   - Italic serif ingredient line, trimmed to first 3 ingredients for cleanness.
5. **Hover/active** — subtle `-translate-y-0.5` lift + deeper shadow on hover, `scale-[0.98]` on tap. Drop the old "Use these →" hover label (the card itself is the affordance).

## Out of scope
- `POPULAR_COMBOS` data, click behavior, surrounding sections.
- No new files, no token changes; uses existing `--accent`, `--font-serif`, and Tailwind tint utilities already in the project.

## Verify
At 390px viewport: 2 columns, no overflow, emoji badges colored, italic serif visible on ingredient line.
