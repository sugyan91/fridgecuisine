# Premium celebration moments

Add two "wow" moments for paid members: a graffiti-style celebration when a subscription goes live, and a cinematic reveal with an inspiring food quote the first time a paid member generates a recipe.

## 1. Upgrade celebration (payment return screen)

When the subscription confirms as active:

- Full-screen graffiti spray burst: layered spray-paint blobs, drip strokes and a hand-painted "WELCOME TO THE KITCHEN" tag that paints itself on (SVG stroke-dash draw), in the existing warm brand palette — no new colors.
- Confetti-style flying food glyphs (chili, lemon, herb, whisk) rising and tumbling, CSS only.
- Plan-aware headline ("You're Basic" / "You're Unlimited") plus the daily AI allowance line, then the existing Continue buttons.
- One inspiring food quote from a rotating set.
- Reduced-motion: static painted tag, no flying elements.

## 2. First paid generation reveal

The first time a signed-in paid member generates recipes:

- Short cinematic overlay (~2s) while results settle: a slow warm light sweep, a graffiti-tagged "First cook, unlocked" mark, and one inspiring food quote fading in.
- The overlay then dissolves into the recipe cards, which stagger in.
- Shown once per user (localStorage flag keyed by user id), skippable by tap/click, never shown to free users or on limit-reached paths.

## 3. Inspiring food quotes

A small shared list of short chef-style lines (e.g. "Cooking is love you can taste.") used by both moments, picked at random but stable per mount so it does not flicker.

## Technical notes

- New `src/components/celebrate/GraffitiCelebration.tsx` and `src/components/celebrate/FirstCookReveal.tsx`, plus `src/lib/food-quotes.ts`.
- New keyframes/utilities in `src/styles.css` (spray-in, drip-draw, food-float, light-sweep) with a `prefers-reduced-motion` block; colors via existing semantic tokens only.
- `src/routes/checkout.return.tsx`: render the celebration when status is active and the checkout type is a subscription; tier from the existing `useSubscription` hook.
- `src/routes/index.tsx`: after a successful `generate(...)` call, if the user is paid and the once-per-user flag is unset, show the reveal overlay and set the flag.
- Presentation only — no backend, schema, pricing, or quota changes.