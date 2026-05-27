# Switch to Touch-Device Detection for Fridge Snap

## Problem
The fridge-snap button currently hides based on viewport width (`min-width: 1024px`). This means:
- Narrow laptop windows still show the snap UI
- Wide tablets (landscape) get hidden incorrectly

## Solution
Replace width-based detection with **pointer-type detection** using `matchMedia('(pointer: coarse)')`.

- `pointer: coarse` = touchscreens (phones, tablets) → show snap button
- `pointer: fine` = mouse/trackpad (laptops, desktops) → disable with tooltip

## Changes
1. In `FridgePhotoButton.tsx`:
   - Replace `DESKTOP_MIN = 1024` width media query with `(pointer: coarse)` query
   - Rename `isDesktop` → `isTouchDevice` for clarity
   - Invert conditional logic (show snap when coarse pointer, not when narrow width)
   - Update disabled state and tooltip copy accordingly

## Result
Snap button only appears on devices with a coarse (touch) pointer — phones and tablets — regardless of window width. Desktops always see the disabled state with "phone / tablet only" tooltip.