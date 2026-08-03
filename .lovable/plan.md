# Plan: Premium shimmer tagline animation under FridgeCuisine logo

## Goal
Replace the current horizontal sweep/marquee animation for the header tagline "Your own AI powered personal chef" with a more eye-catching, premium shimmer reveal animation while keeping the tagline in its existing position under the logo.

## Chosen direction
**Elegant shimmer reveal** — the tagline text uses a moving gradient mask that sweeps across the words, giving it a subtle metallic/AI glow. The text settles into a readable state and the shimmer loops gently.

## What will change
- File: `src/routes/index.tsx` (the header tagline block around line 600).
- Remove the old `.tagline-sweep` / `.tagline-mask` CSS marquee behavior.
- Add a new shimmer keyframe animation and utility class.
- Keep the same text content: "Your own AI powered personal chef".
- Preserve the existing mobile truncation mask behavior only if still needed; otherwise let the tagline sit fully visible with the shimmer.

## Implementation details
- Define a CSS keyframe `tagline-shimmer` that animates `background-position` from `-200%` to `200%`.
- Apply a gradient text effect using `background-clip: text` and `-webkit-text-fill-color: transparent`.
- Use the project's semantic color tokens (e.g. `var(--foreground)` / `var(--muted-foreground)` / `var(--primary)`) instead of the prototype's hardcoded slate/emerald values so it works in both light and dark modes.
- Add a `prefers-reduced-motion` fallback that disables the shimmer and shows static text.
- Keep the existing touch-pause behavior on mobile if it does not conflict with the new animation.
- Ensure the animation is lightweight (pure CSS, no extra JS, no layout shifts).

## Verification
- Confirm the header still renders correctly on mobile (the user's current viewport) and desktop.
- Check that the shimmer loops smoothly and text remains readable.
- Run a production build and typecheck to confirm no regressions.
