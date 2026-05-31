## Goal

Make the mobile header tagline "Your own AI powered personal chef" feel professional and editorial instead of restless. The current 6s sweep is too fast and visually noisy.

## Changes

**1. `src/styles.css` — refine the `tagline-sweep` animation**
- Slow the cycle from `6s` to `22s` (long pauses at rest, brief drift in the middle).
- Soften the keyframes so the text rests for the majority of the cycle and only drifts gently mid-cycle.
- Add an edge fade mask so the text enters/exits the visible window smoothly (no hard clip).

```css
@keyframes tagline-sweep {
  0%, 18% { transform: translateX(0); }
  45%, 55% { transform: translateX(calc(-1 * var(--tagline-shift, 38%))); }
  82%, 100% { transform: translateX(0); }
}
.tagline-sweep {
  display: inline-block;
  white-space: nowrap;
  will-change: transform;
  animation: tagline-sweep 22s ease-in-out infinite;
}
```

**2. `src/routes/index.tsx` — refine tagline typography & add edge mask**
- Wrap the animated `<span>` in a container with a horizontal `mask-image` linear-gradient so the text fades softly at both edges instead of clipping abruptly.
- Bump styling on the tagline: `uppercase tracking-[0.18em]` and a slightly muted color, removing the bold weight for a refined editorial look (bold + small + animated reads amateurish).

## Notes

- Desktop (sm+) continues to disable the animation via existing `sm:!animate-none sm:!transform-none`.
- `prefers-reduced-motion` already disables it — kept as-is.
- No JS or layout changes; purely CSS + a wrapper class on the existing tagline node.
