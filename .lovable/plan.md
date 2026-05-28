## Problem

The hero section is wrapped in a `grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20`. The first grid item is an empty wrapper around `<FreeTierBanner />`:

```tsx
<div className="lg:col-span-12 -mb-6 md:-mb-12">
  <FreeTierBanner ... />
</div>
```

When `FreeTierBanner` returns `null` (premium users, dismissed banner), the wrapper still renders as an empty grid row. The grid's `gap-12 md:gap-20` keeps adding 48 px (mobile) / 80 px (desktop) of space above the hero — the gap you're seeing.

## Fix

Move `<FreeTierBanner />` out of the grid entirely. The banner already has its own `max-w-6xl mx-auto mb-6` container, so it doesn't need the grid wrapper.

In `src/routes/index.tsx` around lines 693–696:

- Render `<FreeTierBanner ... />` directly before the grid (outside it).
- Remove the `<div className="lg:col-span-12 -mb-6 md:-mb-12">` wrapper.
- Keep the hero `<section className="lg:col-span-12 relative">` as the first grid item.

Result: when the banner is hidden, no empty row exists and the hero sits at its intended top spacing. When the banner is shown, layout is unchanged (banner's own `mb-6` provides separation).

No other files affected.