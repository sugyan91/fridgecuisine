# Quick wins to grow signups

Goal: convert more first-time anonymous visitors into accounts. You already have great hooks (5 free receipes/day, save receipes, community). The two highest-leverage moments right now are **(1) when an anonymous user hits the daily limit** and **(2) when they try to save a receipe** — both currently trigger a toast and disappear. Toasts don't convert. Modals do.

I'd ship these two features this session.

---

## Feature 1 — "You've cooked through your free 5" upgrade modal

**Why it matters:** Right now, anonymous users hitting 5/day just get a red toast. They bounce. This is the single highest-intent moment in the funnel — they just experienced the product and want more.

**What changes:**
- When an anonymous user (no userId) hits the daily limit, replace the toast with a modal.
- Modal copy: "You've cooked through your 5 free receipes today 🔥"
- Two CTAs:
  - **Primary:** "Sign up free — keep cooking" → adds +5 receipes/day, unlocks save + meal history
  - **Secondary:** "Go unlimited $5.99/mo" → /pricing
- Show countdown to reset ("resets in 4h 12m") as a tertiary fallback.
- Signed-in free users hitting the limit get a different modal: just the upgrade CTA + countdown.
- Modal is dismissible but reappears on next generation attempt.

**Expected lift:** This is the standard "metered paywall" pattern (NYT, Medium, etc.) — typically 3–5× the conversion of a toast at the same moment.

---

## Feature 2 — "Save this receipe" inline signup prompt

**Why it matters:** When an anonymous user clicks the save (heart) icon today, they get a toast with a "Sign in" action — easy to miss, and clicking it dumps them on /login with no context. The receipe they wanted is gone.

**What changes:**
- Clicking save while logged out opens a small inline modal anchored to the receipe.
- Modal shows the receipe title + thumbnail and a single email field: "Enter your email to save *Spicy Tofu Stir-Fry* and keep cooking."
- One-click magic-link signup via Supabase (`signInWithOtp`) — no password.
- After email is submitted: receipe is stashed in localStorage with the title, and on auth completion (handled in `__root.tsx` auth listener) it's auto-saved to their account.
- Already works with the existing Google sign-in button as a secondary option in the modal.

**Expected lift:** Cuts signup friction from "navigate to login → choose method → set password → return" down to "type email → click link." Magic-link signup typically converts 2–3× higher than password forms for low-stakes apps.

---

## Why these two over alternatives

I considered (and parked) these for later sessions:
- **Recipe-of-the-day email** — needs an email infra setup and only helps after signup
- **Referral program** — high effort, low immediate signup lift for an early product
- **Onboarding tour** — your UI is already self-explanatory; tours rarely move signup numbers
- **Image-based fridge scan upsell** — already a premium hook, but works best after we've grown the top of funnel first

The two features above hit users at their two highest-intent moments and require no new infra (Supabase magic-link + email auth is already enabled).

---

## Technical sketch (not user-facing)

**Files to touch:**
- `src/components/LimitReachedModal.tsx` (new) — controlled modal, anon vs signed-in variants
- `src/components/SaveSignupModal.tsx` (new) — email field + Google button, calls `supabase.auth.signInWithOtp`
- `src/routes/index.tsx` — replace `limitToast()` with `setLimitModalOpen(true)`; in `toggleSave`, replace the toast branch with `setSaveModalOpen({ receipe })`
- `src/routes/__root.tsx` — extend the auth listener to drain a `fc-pending-save` localStorage entry into `saveReceipe` on first sign-in
- Reuse existing `Dialog` from `src/components/ui/dialog.tsx`

No DB changes. No new server functions. No new env vars.

---

After we ship, the natural next quick-win is wiring the same magic-link prompt into the "Share your receipe" CTA on /community, but let's measure the first two first.