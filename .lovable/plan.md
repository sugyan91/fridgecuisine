Hide every recipe-usage meter from non-admin viewers. Admins keep the full view.

## Changes

1. **`src/components/FreeTierBanner.tsx`** — accept an `isAdmin` prop (or gate internally via `useIsAdmin`). Return `null` when the viewer is not an admin. This removes the "X of Y recipes used today" banner from the landing page for all normal users.

2. **`src/routes/index.tsx`** — pass `isAdmin` to `<FreeTierBanner />` (already has `userId`; add `useIsAdmin(userId)`). No other logic changes — quota enforcement stays server-side.

3. **`src/routes/_authenticated/account.tsx`** — wrap the "Today's usage" card and the "Today's usage" link in the account menu in an `isAdmin` check via `useIsAdmin(user?.id)`. Non-admins simply won't see that section or link.

4. **`src/routes/_authenticated/usage.tsx`** — add an admin gate in the component: call `useIsAdmin`, and if not admin, `redirect` (via `Navigate`) back to `/account`. Keeps the route accessible for admins, hidden for everyone else.

## Not in scope

- No changes to server-side quota logic, rate limits, or the `LimitReachedModal` (the modal only appears when a user actually hits the cap — still needed for UX).
- No changes to the admin panel or the existing `/admin/quota` route.

## Verification

- Sign in as non-admin → landing page has no usage banner, `/account` has no usage card or link, visiting `/usage` redirects to `/account`.
- Sign in as admin → all three surfaces render as before.
- `bunx tsgo --noEmit` passes.
