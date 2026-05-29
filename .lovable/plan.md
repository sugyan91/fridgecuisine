## Problem

On mobile the header tagline "Your own AI powered personal chef" is `whitespace-nowrap`, so it overflows behind the language/Sign up/menu buttons on the right. The logo image isn't actually overlapping — the tagline is just being clipped by the buttons. We need a different mobile lockup.

## Proposed direction

Rework the brand lockup so mobile gets a clean wordmark only, and the tagline either disappears or moves out of the header.

### Changes (`src/routes/index.tsx`, lines ~490–512)

1. **Hide the tagline `<p>` on mobile** — add `hidden sm:block` to the `Your own AI powered personal chef` paragraph. It will still appear from `sm:` (≥640px) upward where there's room.
2. **Slightly bump the wordmark on mobile** — `text-lg` instead of `text-base` so "fridge cuisine." reads as the clear brand without the tagline crutch.
3. **Allow the wordmark to shrink gracefully** — keep `whitespace-nowrap` on the h1 but remove `whitespace-nowrap` from the (now hidden on mobile) tagline so it can wrap if it ever shows on a narrow `sm` device.
4. **Optional: surface the tagline in the hero** — add a small "Your own AI-powered personal chef" eyebrow above or under the main H1 on mobile so the value-prop isn't lost. (Confirm before adding.)

### Out of scope

- Logo image redesign
- Header restructure beyond the brand lockup
- Desktop layout (already fits)

### Open question

Do you want the tagline moved into the hero on mobile (so the message still lands), or just dropped from mobile entirely?
