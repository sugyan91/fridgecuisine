## Goal

Give Premium subscribers ($5.99/mo) a one-click "Cancel subscription" button on a new account page. Cancel is in-app (cancels at period end — they keep access until the renewal date).

## 1. New server function: `cancelSubscription`

Add to `src/lib/payments.functions.ts`:

- `createServerFn({ method: "POST" })` + `requireSupabaseAuth` middleware.
- Input: `{ environment: "sandbox" | "live" }` (Zod-validated).
- Look up the user's most recent subscription row (`context.supabase`, filter by `user_id` + `environment`, order by `created_at desc`, `maybeSingle`). Require `stripe_subscription_id` and a non-canceled status.
- Call `stripe.subscriptions.update(id, { cancel_at_period_end: true })` via `createStripeClient(env)`.
- Catch Stripe errors → return `{ error: getStripeErrorMessage(error) }`. On success return `{ canceled_at: <period_end ISO> }`. The webhook will sync the row; the realtime listener in `useSubscription` picks it up automatically.

Also add `reactivateSubscription` (same shape, sets `cancel_at_period_end: false`) so a user who clicked Cancel by mistake can undo it before period end.

## 2. New page: `/account`

Create `src/routes/_authenticated/account.tsx` (auth-required via existing `_authenticated` layout).

Sections:

- Header with avatar + email + username (from `supabase.auth.getUser()` + `profiles`).
- **Plan card** driven by `useSubscription(user.id)`:
  - Free: shows "Free plan" + link to `/pricing`.
  - Premium active: shows "Premium · $5.99/mo", `Renews on <current_period_end>`, and a **Cancel subscription** button.
  - Premium with `cancel_at_period_end: true`: shows "Canceling on <date>" + a **Resume subscription** button.
  - `past_due`: dunning banner ("Payment failed — update your card") + Manage billing link to Stripe portal.
- Cancel button opens an `AlertDialog` confirm: "You'll keep Premium access until <date>. Cancel anyway?" → calls `cancelSubscription`, shows a toast on success/error.
- Footer link: "Manage billing / invoices" → existing `createPortalSession` (opens Stripe portal in a new tab) for users who want to update card or download receipts.

SEO: `noindex` (private page), title "Account — FridgeCuisine".

## 3. Navigation

- Add "Account" link in `SiteFooter.tsx` (Cook column) — visible to everyone; redirects to login if signed-out via `_authenticated` layout.
- Add an "Account" entry to any existing user menu if present (header avatar dropdown). If none exists, footer link is enough for v1.

## 4. Out of scope

- No new tables/migrations — webhook already syncs status changes into `subscriptions`.
- No payment-method updates in-app — those stay in the Stripe portal link.
- No immediate refund/cancel — explicitly period-end cancellation per the chosen UX.

## Files

- Edit: `src/lib/payments.functions.ts` (add `cancelSubscription`, `reactivateSubscription`)
- New: `src/routes/_authenticated/account.tsx`
- Edit: `src/components/landing/SiteFooter.tsx` (add Account link)