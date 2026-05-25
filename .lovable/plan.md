# Make the embedded checkout mobile-friendly so Apple Pay is front-and-center

The Stripe Embedded Checkout already renders the Apple Pay button at the top of the form on iOS Safari — but right now it lives inside an inline card on the pricing page (`src/routes/_authenticated/pricing.tsx`), which on a phone forces users to scroll past the page header before they see it. The fix is to put the checkout into a **mobile bottom sheet** that opens full-height, so Apple Pay is the first thing visible the moment a plan is tapped.

## Changes

**1. Refactor `src/routes/_authenticated/pricing.tsx`**

- Replace the conditional inline `EmbeddedCheckoutProvider` block (lines 78–94) with a shadcn `Drawer` (mobile) / `Dialog` (desktop) that holds the checkout.
- Pattern: render plans always; opening checkout opens the drawer/dialog instead of swapping the page content. Use a `useIsMobile` check (already exists in `src/hooks/use-mobile.tsx`) to pick `Drawer` on phones and `Dialog` on tablet/desktop.
- The drawer opens to ~90vh so the Apple Pay button at the top of the embedded form is visible without scrolling.
- Closing the drawer/dialog resets `checkoutOpen` and `selectedPriceId` so the user can pick a different plan.

**2. Pass the `wallets` option to Embedded Checkout for clarity**

The `EmbeddedCheckoutProvider` options stay as `{ fetchClientSecret }` — wallet display is already controlled by Stripe based on device capability, no extra config needed. (Apple Pay / Google Pay / Link auto-show.)

**3. No server-side changes**

`src/lib/payments.functions.ts` stays as-is. The Checkout Session is already configured to surface every supported payment method.

## Verification

After changes, test on the preview at mobile width:
- Tap "Upgrade to Pro" → drawer slides up from bottom, fills most of the screen, Apple Pay button visible at top of form (when tested in real Safari with a Wallet card).
- Tap outside / drag drawer down → returns to plan picker.
- Same flow on desktop opens a centered modal instead of a bottom drawer.

## Out of scope (deliberately)

- No dedicated express button on plan cards — we decided against the Express Checkout Element route because it requires a separate SetupIntent + manual subscription creation pipeline for recurring prices, which doubles the payment surface area for limited gain.
- No backend changes.
- No new dependencies (Drawer + Dialog already in `src/components/ui/`).
