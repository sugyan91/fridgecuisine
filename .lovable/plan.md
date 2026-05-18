## Goal

Make the top of the page behave like airbnb.com: a full-width fixed header bar that has its own opaque background, so when the user scrolls, content slides underneath but is never visible *through* the header (no see-through, no overlap, no occlusion of text).

## Current behavior

The brand pill ("fridge cuisine") on the left and the nav pill (Community / Sign in / Sign up) on the right are two separate **floating fixed pills** with white backgrounds. The gap between them is transparent — when content scrolls past, you can see page content peeking through behind/between the pills.

## Proposed change

Replace the two separate floating pills with a **single full-width fixed header bar** that spans the entire viewport width — exactly the Airbnb pattern.

### Header bar

- `position: fixed`, `top: 0`, full viewport width, high `z-index`.
- Opaque white background with a subtle `backdrop-blur` and a thin bottom border (matches the project's bold-border style — `border-b-2 border-border`).
- Inner layout: a `max-w-6xl mx-auto` flex row with horizontal padding.
  - **Left cluster**: small logo + "fridge cuisine." wordmark.
  - **Right cluster**: Community link, then either {My Recipes, + Share, Saved, email, Sign out} when signed in, or {Sign in, Sign up} when signed out — identical content to today's nav pill.
- Height stays compact (around 56–64px) so it doesn't dominate the viewport.

### Content offset

- Keep the existing `ResizeObserver`-based measurement so `main`'s `paddingTop` always equals the actual header height. No more guessing — content always starts cleanly below the bar at every breakpoint.

### What stays the same

- All routes, links, auth-conditional logic, sign-out behavior.
- Brand styling (paprika/turmeric colors, display font, lowercase wordmark).
- The Saved drawer trigger and behavior.

### What's removed

- The two separate floating pills and their individual `bg-white`, `rounded-full`, `shadow-[3px_3px_…]` wrappers.

## Result

Scrolling will feel like Airbnb: the header is always visible, content never bleeds through it, and the page content begins exactly where the header ends — no awkward gap, no occlusion.
