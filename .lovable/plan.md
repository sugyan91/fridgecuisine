## Goal
Add more testimonials under "What people are saying" and elevate the visual presentation so the larger set still feels curated, not cluttered.

## Changes

**`src/components/landing/Testimonials.tsx`** — only file touched.

1. Expand `QUOTES` from 3 to 9 entries (diverse personas, cuisines, use-cases — pantry mode, late-night cooking, dietary needs, kids, travel-inspired, etc.). Each entry gets:
   - `quote`, `name`, `role`
   - `initials` (for an avatar chip)
   - `accent` — one of `gold`, `terracotta`, `sage` — drives the quote-mark color and avatar background, rotated across cards for rhythm.

2. Replace the flat 3-column grid with a responsive **masonry-style layout**:
   - Mobile: horizontal snap scroller (`flex overflow-x-auto snap-x snap-mandatory`) so 9 cards don't make the page huge on a 390px viewport; each card `w-[80%]` with snap points and a subtle scrollbar-hidden treatment.
   - `md+`: CSS columns (`columns-2 lg:columns-3 gap-5`) with `break-inside-avoid` on cards — gives a staggered editorial feel instead of rigid rows, and naturally absorbs varied quote lengths without empty whitespace.

3. Card refinements (keeps existing tokens, no new colors):
   - Circular avatar chip with `initials`, colored by `accent` (using existing `--accent-gold`, plus `--terracotta` / `--sage` already defined in `styles.css` — verified below).
   - Large opening quote mark uses the per-card accent color.
   - Subtle hover lift (`hover:-translate-y-0.5 transition`) for desktop.
   - Footer row: avatar on the left, name + role stacked on the right (replaces the current top-border block) — denser, more human.

4. No prop changes; `<Testimonials />` call site in `index.tsx` stays identical.

## Technical notes
- Will confirm `--terracotta` and `--sage` exist in `src/styles.css` before referencing; if not, fall back to `--accent-gold` + `--primary` + `--accent` so we stay inside the existing token system (no hardcoded hex).
- Mobile horizontal scroller uses Tailwind utilities only — no new deps.
- `columns-*` + `break-inside-avoid` is supported by Tailwind v4 out of the box.

## Out of scope
- Section header, surrounding `bg-[var(--surface-cream)]` panel, and `index.tsx` layout stay unchanged.
- No new images, no avatar photos (initials only — keeps it tasteful and avoids fake stock faces).
