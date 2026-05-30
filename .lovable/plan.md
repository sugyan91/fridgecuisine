# Surface "How it works" above the fold

Move the 3-step explainer right under the hero so users understand the product before scrolling. Remove the heavy dark panel further down.

## Changes

**1. New compact strip — `src/components/landing/HowItWorksStrip.tsx` (new file)**
- Horizontal 3-step layout: each step is a card with a big numeral, a 1-line title, and a 1-line description.
- `grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4`, light card backgrounds (`bg-card border border-border rounded-2xl p-5`).
- Connecting hairline between cards on desktop (subtle decorative line).
- Compact — fits in ~160px tall.

**2. Mount it in the hero — `src/routes/index.tsx`**
- Insert `<HowItWorksStrip />` right after the hero section closes (after the `dishResult` block ends, before the `Explore by country` section).
- Wrap in `<section className="lg:col-span-12 mt-2 md:mt-4">…`.

**3. Remove the old dark panel — `src/routes/index.tsx`**
- Delete the entire `<section className="lg:col-span-12">…dark surface…<HowItWorks /></section>` block.
- Remove the now-unused `import { HowItWorks } from "@/components/landing/HowItWorks";`.

**4. (Optional) Delete unused component file**
- Leave `src/components/landing/HowItWorks.tsx` on disk in case it's reused later. No deletion.

## Out of scope
Colors, copy of the steps (reuse existing wording), other sections.

## Technical notes
- Copy the 3 step titles/descriptions verbatim from the current `HowItWorks.tsx` so the message stays identical.
- All edits Tailwind-only, no token changes.
- Verify at 390px (current) and 1280px.
