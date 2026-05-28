## Problem

In `src/routes/index.tsx`, the "Cook the world tonight" section contains an inline results container (lines ~945–983):

```tsx
<div ref={cuisineResultsRef} className="mt-10 space-y-5 scroll-mt-32">
  {!pantryMode && (loading || receipes?.length > 0) && (...)}
  {!pantryMode && loading && <LoadingSkeleton />}
  {!pantryMode && !loading && receipes && receipes.map(...)}
  {!pantryMode && !loading && receipes && receipes.length > 0 && (<button .../>)}
</div>
```

When the user hasn't generated cuisine receipes yet (default state), every child is hidden, but the wrapper still renders with `mt-10` adding 40 px of empty space. The parent grid then adds another 48 px (mobile) / 80 px (desktop) gap before "Trending right now" — producing the visible vertical dead zone.

## Fix

Only render the results wrapper when it actually has content. Wrap the entire `<div ref={cuisineResultsRef} ...>` in a conditional:

```tsx
{(!pantryMode && (loading || (receipes && receipes.length > 0))) && (
  <div ref={cuisineResultsRef} className="mt-10 space-y-5 scroll-mt-32">
    {/* existing children */}
  </div>
)}
```

This eliminates the 40 px margin when the section is idle. The ref is only used for `scrollIntoView` after a generation kicks off — by that point the wrapper exists, so scrolling still works.

No other files touched. Trending section keeps its normal grid-gap spacing, which now reads as intentional rather than excessive.