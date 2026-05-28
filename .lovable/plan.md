# Fix recipe purchase sign-in flow

## Problem

On a premium recipe page (`/shop/<receipeId>`), users who aren't logged in see a button labeled **"Sign up to buy"**. Two issues:

1. The label only says "sign up", but the destination page also supports sign-in for existing users.
2. The link goes to `/login` with no `redirect`, so after auth the user lands on `/` (homepage) and has to scroll all the way back down to find the recipe they were trying to buy.

## Changes (UI only)

**File:** `src/routes/shop.$receipeId.tsx` (the `<Link to="/login">` block around line 235)

1. Change the button text from `Sign up to buy` to `Sign in or sign up to buy`.
2. Pass the current recipe URL as a redirect param so the login page returns the user straight to this recipe after authentication:
   ```tsx
   <Link
     to="/login"
     search={{ redirect: `/shop/${receipeId}` }}
     ...
   >
     Sign in or sign up to buy
   </Link>
   ```
   The login route already reads `search.redirect` and navigates there after a successful sign-in or sign-up — no changes needed in `src/routes/login.tsx`.

## Result

- Existing users immediately understand they can sign in (not just sign up).
- After authenticating, users land back on the recipe detail page at the top, with the "Buy & unlock" button visible — no scrolling required.

## Out of scope

- No change to the login page itself.
- No change to homepage scroll behavior (the redirect bypasses the homepage entirely).
