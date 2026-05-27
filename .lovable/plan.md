Update `FridgePhotoButton.tsx` so the snap button enables when EITHER condition is true:

- `(pointer: coarse)` — real touchscreen devices
- `(max-width: 1024px)` — narrow viewport (covers preview tablet/mobile modes and small laptop windows)

Single combined media query: `window.matchMedia("(pointer: coarse), (max-width: 1024px)")`.

Rename state from `isTouchDevice` to `isSnapEnabled` for clarity; invert the `isDesktop`/`disabled` logic accordingly. Tooltip and help copy unchanged.