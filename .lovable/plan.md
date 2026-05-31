## Goal

Protect the email/password sign-up AND sign-in flows on `/login` with Cloudflare Turnstile, using the same server-side verification pattern already used by the contact form. No new secrets, no Edge Function.

## Why not a Supabase Edge Function

This project is on the TanStack Start template — server logic lives in `createServerFn` / server routes that already have access to `process.env.TURNSTILE_SECRET_KEY`. The contact form already uses this pattern. Adding an Edge Function would create a second deployment, second log surface, and second CORS contract for no benefit. Same security guarantee: the secret never reaches the browser.

## Changes

### 1. New server function — `src/lib/turnstile.functions.ts`
Already exposes `getTurnstileSiteKey`. Add a sibling:

- `verifyTurnstileToken({ token })` — `createServerFn({ method: "POST" })`. Posts the token + caller IP (from `cf-connecting-ip` / `x-forwarded-for`) to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `process.env.TURNSTILE_SECRET_KEY`. Returns `{ success: true }` or `{ success: false, error }`. Never throws raw provider errors at the UI.

If `TURNSTILE_SITE_KEY` is empty, `getTurnstileSiteKey` returns `''` and the UI skips the widget (degrades gracefully in dev).

### 2. `/login` route — `src/routes/login.tsx`

- `loader: () => getTurnstileSiteKey()` (same pattern as `/contact`).
- Render the Turnstile widget on BOTH the sign-in form and the sign-up form, inside the existing card, just above the submit button.
- Track `captchaToken`, `captchaStatus` (`'ready' | 'expired' | 'error'`) — same shape as contact.
- Show the friendly "Try verification again" affordance on expired/error (reuse the same UX).
- In `onSubmit`, BEFORE calling `supabase.auth.signUp` / `signInWithPassword`:
  1. If `siteKey` present and no `captchaToken` → inline error, stop.
  2. Call `verifyTurnstileToken({ data: { token: captchaToken } })`. If it returns `success: false`, show inline error and reset the widget. Stop.
  3. Only on success, proceed with the existing Supabase auth call.
- Reset the widget after a failed Supabase auth call so the user can retry without a stale token.
- Do NOT touch the Google/Apple OAuth buttons — those go through the Lovable broker and don't need Turnstile.
- Do NOT touch the forgot-password sub-flow in this pass (keep scope tight; can be added later).

### 3. No DB/schema/secret changes
`TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are already configured. No migration.

## Verification

1. Open `/login`, toggle to Sign up. Widget renders. Submitting without solving → inline error.
2. Solve widget → sign-up succeeds (email confirmation flow unchanged).
3. Toggle to Sign in. Widget renders. Submitting with a tampered/empty token → inline error from `verifyTurnstileToken`.
4. Solve widget → sign-in succeeds. Bad password → widget resets so user can retry.
5. Confirm in DevTools that the secret key is NOT in the client bundle (search the page source for `TURNSTILE_SECRET_KEY` — should only appear as the env var name in the server-fn payload metadata, never as a value).

## Out of scope

- `SaveSignupModal` and forgot-password (not selected).
- Adding Turnstile to OAuth (Google/Apple) buttons — not applicable.
- Any Edge Function or new secret.