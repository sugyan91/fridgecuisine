# Apple Pay — already enabled

Your checkout already uses Stripe Embedded Checkout (`ui_mode: "embedded_page"` in `src/lib/payments.functions.ts`) with no `payment_method_types` restriction. That means Stripe automatically surfaces Apple Pay (and Google Pay, Link, etc.) as a payment option whenever the buyer's device supports it.

## What this means in practice

- **iOS Safari / macOS Safari** with a card in Apple Wallet → "Pay with Apple Pay" button appears at the top of the checkout form.
- **Android / Chrome with Google Pay set up** → Google Pay button appears.
- **Other browsers / no wallet** → standard card form.
- All happens client-side based on device capability — no flag to flip.

## What you still need to verify (one-time, in Stripe Dashboard)

For Apple Pay to render on **live** payments (sandbox always works for testing):

1. The Stripe account needs Apple Pay enabled under **Settings → Payments → Payment methods**. For new Stripe accounts this is on by default.
2. For Apple Pay to work on your **custom domain** (`fridgecuisine.com`), Stripe needs to verify domain ownership. Stripe does this automatically for domains it manages, but for custom domains added later you may need to register the domain under **Settings → Payments → Apple Pay → Add new domain**. On `*.lovable.app` URLs this is already handled.

These are dashboard settings on Stripe's side, not code changes.

## Code changes required

None.

## How to test

1. Open the app in **Safari on an iPhone or Mac** with a card in Apple Wallet.
2. Trigger any checkout (e.g. buy a recipe or subscribe on `/pricing`).
3. The Apple Pay button should appear at the top of the embedded checkout sheet.

If it doesn't show up there, the most common cause is the device/browser doesn't have a wallet card configured — try Chrome on the same device, which won't show Apple Pay regardless.

---

If you'd rather have an explicit Apple Pay-only button outside the checkout form (e.g. a "Buy with Apple Pay" CTA on the product card itself), that's a different feature — Stripe Payment Request Button. Let me know and I'll plan that separately.
