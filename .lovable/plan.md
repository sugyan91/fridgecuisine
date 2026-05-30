## Goal

Replace Lovable's default transactional emails with FridgeCuisine-branded ones, sending from **info@fridgecuisine.com** via the already-verified `notify.fridgecuisine.com` sender. No marketing/newsletter work (use Mailchimp/Beehiiv separately when ready).

## What gets built

### 1. Email infrastructure (one-time setup)

- Provision the email queue (pgmq queues, RPC wrappers, send log, suppression list, unsubscribe tokens, cron dispatcher).
- Required prerequisite for everything below. Idempotent — safe to re-run.

### 2. Branded auth emails (replace Lovable defaults)

Customized templates for:
- **Signup verification** — "Confirm your email to start cooking"
- **Magic link** — passwordless sign-in
- **Password recovery** — "Reset your FridgeCuisine password"
- **Email change** — confirm new email
- **Re-authentication** — sensitive action confirmation
- **Invite** — (kept for completeness, low use)

Each will use FridgeCuisine's brand: warm food-app aesthetic, accent color from the design tokens, the FridgeCuisine wordmark in the header, and a friendly tone ("Hey — welcome to the kitchen 🍳").

### 3. App (transactional) emails

Three new templates triggered by user actions:

| Template | Trigger | Sent to |
|---|---|---|
| `welcome` | First successful sign-in (after email verification) | The new user |
| `purchase-receipt` | Stripe webhook confirms a paid premium recipe | The buyer |
| `recipe-saved` | User saves a recipe to their cookbook | The user who saved it |

### 4. Trigger wiring

- **Welcome**: fire from the existing `onAuthStateChange` handler the first time a user appears, guarded by an idempotency key (`welcome-{userId}`) so it never sends twice.
- **Purchase receipt**: send inside the Stripe webhook handler at `src/routes/api/public/payments/webhook.ts` after marking the purchase paid. Idempotency key: `receipt-{stripeSessionId}`.
- **Recipe-saved**: send from inside `src/lib/saved-receipes.functions.ts` after the insert succeeds. Idempotency key: `saved-{userId}-{receipeId}`.

### 5. Unsubscribe page

A branded `/unsubscribe` route so the auto-appended unsubscribe footer on transactional emails (legally required) lands on a FridgeCuisine-styled page, not a raw API URL. Auth emails do NOT get the unsubscribe footer.

## Sender configuration

- **SENDER_DOMAIN** (verified subdomain, used to send): `notify.fridgecuisine.com`
- **From address** (what recipients see): `info@fridgecuisine.com`
- Reply-to: same (`info@fridgecuisine.com`)

> ⚠️ **About `info@fridgecuisine.com` as a mailbox**: This address only *sends*. If someone hits "Reply" to a FridgeCuisine email, the reply will bounce unless you set up an actual inbox at `info@fridgecuisine.com` separately (Google Workspace, Zoho Mail free tier, or GoDaddy 365 — done outside Lovable). I'll flag this in the final summary so you remember to set up a real inbox at GoDaddy when you're ready to receive replies.

## What I will NOT do (and why)

- ❌ **Monthly recipe newsletter / marketing emails** — explicitly out of scope and not supported by Lovable's email system. Mixing marketing with transactional mail tanks deliverability on your password resets.
- ❌ **"Email all users" / bulk send features** — same reason.
- ❌ **File attachments** — Lovable email doesn't support attachments; if a receipt ever needs a PDF, we'd link to a download URL instead.

## Technical notes

- Templates live in `src/lib/email-templates/` as React Email components and are registered in `registry.ts`.
- Auth emails are intercepted by an `auth-email-hook` server route at `/lovable/email/auth/webhook` (Supabase Auth webhook).
- Transactional emails go through `/lovable/email/transactional/send`. Public triggers (Stripe webhook) call it server-side with the service role; authenticated triggers (recipe-saved) call it with the user's JWT.
- All sends are queued in pgmq with retry + suppression handling. Throughput ~120 emails/min, plenty for FridgeCuisine's current volume.
- Brand styling pulled from `src/styles.css` design tokens; email body background stays white (deliverability rule) with FridgeCuisine accent on buttons and dividers.

## Files touched

**New:**
- `src/lib/email-templates/registry.ts`
- `src/lib/email-templates/welcome.tsx`
- `src/lib/email-templates/purchase-receipt.tsx`
- `src/lib/email-templates/recipe-saved.tsx`
- `src/lib/email-templates/*.tsx` (6 branded auth templates — replace existing stubs in `src/lib/email-templates/{signup,magic-link,recovery,email-change,reauthentication,invite}.tsx`)
- `src/routes/lovable/email/auth/webhook.ts` (auth hook)
- `src/routes/lovable/email/transactional/send.ts` (send endpoint)
- `src/routes/lovable/email/transactional/preview.ts` (dashboard preview)
- `src/routes/email/unsubscribe.tsx` (branded page)
- `src/routes/lovable/email/suppression.ts` (bounce/complaint webhook)
- `src/lib/email/send.ts` (client helper)

**Edited:**
- `src/routes/__root.tsx` — wire welcome-email trigger into the auth state listener
- `src/routes/api/public/payments/webhook.ts` — send receipt after marking paid
- `src/lib/saved-receipes.functions.ts` — send confirmation after save

## After this ships

1. Test password reset and signup flows in the live preview.
2. (Optional, separate) Set up a real `info@fridgecuisine.com` inbox at GoDaddy so replies don't bounce.
3. When you want a newsletter, sign up for Mailchimp or Beehiiv and use a different subdomain like `news.fridgecuisine.com` so it doesn't conflict.
