Add explicit close/cancel buttons to the embedded checkout modal and drawer so users can easily back out of a purchase.

**Current state**
- Desktop: `DialogContent` has a built-in `X` close button, but the `p-2 sm:p-4` padding override makes it cramped and hard to spot.
- Mobile: `DrawerContent` has **no** close button at all. Users can only close by tapping outside or swiping.

**Changes**

1. **Desktop Dialog (`shop.$receipeId.tsx`)**
   - Remove the `p-2 sm:p-4` override on `DialogContent` (restore default padding so the built-in `X` button is properly positioned).
   - Add a `DialogHeader` with a title "Secure checkout" and keep the built-in `X` close button for a polished look.

2. **Mobile Drawer (`shop.$receipeId.tsx`)**
   - Add a top bar inside `DrawerContent` with a "Cancel" button that calls `setCheckoutOpen(false)`.
   - Use `DrawerClose` from `@/components/ui/drawer` wrapped around the cancel button so it also closes natively.
   - Add a small header text "Secure checkout" for context.

**Result:** Users on both mobile and desktop can clearly see and tap a close/cancel control if they decide not to buy.

**Files edited:**
- `src/routes/shop.$receipeId.tsx`