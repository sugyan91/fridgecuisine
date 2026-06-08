
# Tighten AI Usage & Prevent Abuse

Lower limits, move enforcement server-side, add rate limiting, and cap "Unlimited" with fair use.

## New tier limits

| Tier | Daily AI generations | Notes |
|---|---|---|
| Anonymous | **1 lifetime** | Server-tracked by IP + signed cookie |
| Free (signed in) | **2 / day** | Down from 3 |
| Basic ($5.99) | 10 / day | Unchanged |
| Unlimited ($19.99) | **50 / day** (fair-use cap) | Marketing says "unlimited"; hidden soft cap |

Rate limit (all tiers): **1 AI request / 3 seconds** per user/IP.

## What gets built

### 1. Server-side anonymous tracking (new)
New table `anonymous_ai_usage`:
- `id uuid pk`
- `fingerprint text unique` (sha256 of IP + signed cookie id)
- `count int default 0`
- `first_seen_at`, `last_seen_at timestamptz`

Service-role only (no client grants). Migration includes RLS enabled, no policies, plus grants to `service_role` only.

A `getOrCreateAnonId` helper sets an httpOnly signed cookie (`fc_anon`) on first visit. Server fns combine `request.headers['x-forwarded-for']` + cookie → fingerprint.

### 2. Update `src/lib/ai-quota.server.ts`
- `TIER_LIMITS = { anon: 1, free: 2, basic: 10, unlimited: 50 }` — note: `anon` is **lifetime**, others are per-day
- `RATE_LIMIT_SECONDS = 3`
- `resolveTier(userId)` unchanged
- `requireAiQuota` middleware extended:
  - If no user → check anon table by fingerprint (lifetime count)
  - If user → check `recipe_generations` count for today
  - Check last generation timestamp; if < 3s ago → throw `RATE_LIMITED`
  - On success, insert/increment usage row

Returns typed error envelope:
```ts
{ error: 'QUOTA_EXCEEDED' | 'RATE_LIMITED' | 'SIGN_IN_REQUIRED',
  tier, limit, used, retryAfter?, suggestedPlan }
```

### 3. Update `src/lib/usage.functions.ts`
`getRecipeUsage` returns shape `{ used, limit, tier, lifetime: boolean, remaining }`. For anon: queries `anonymous_ai_usage`; for users: queries `recipe_generations` for today.

### 4. Update `src/hooks/use-recipe-usage.ts`
- Expose `lifetime` flag so UI can say "1 free taste — sign in for more" vs "2/day"
- Expose `rateLimitedUntil` from last error

### 5. UI copy updates (no design changes)
- `FreeTierBanner.tsx`: anon → "1 free recipe to try — sign in for 2/day"; free → "2 recipes/day"
- `RecipeCounter.tsx`: same limits + countdown
- `LimitReachedModal.tsx`: new variants:
  - anon → "Sign in for 2 free recipes/day"
  - free → "Upgrade to Basic for 10/day"
  - basic → "Go Unlimited for 50/day"
  - unlimited → "Daily fair-use limit reached (50). Resets at midnight."
  - rate-limited → "Slow down — try again in {n}s"
- `pricing.tsx`: change Free card from "3/day" to "2/day", Unlimited card adds small note "*Fair use: up to 50 recipes/day"
- `usage.tsx`: show lifetime vs daily, show fair-use cap for Unlimited
- `account.tsx`: same wording

### 6. SiteFooter / marketing copy
Update any "3 free recipes/day" mention to "2 free recipes/day".

## Files to touch

- **Migration** (new): `create_anonymous_ai_usage_table.sql`
- `src/lib/ai-quota.server.ts` — tier limits, rate limit, anon fingerprint
- `src/lib/usage.functions.ts` — return new shape
- `src/lib/anon-tracking.server.ts` (new) — cookie + fingerprint helpers
- `src/hooks/use-recipe-usage.ts`
- `src/components/FreeTierBanner.tsx`
- `src/components/RecipeCounter.tsx`
- `src/components/LimitReachedModal.tsx`
- `src/components/landing/SiteFooter.tsx`
- `src/routes/_authenticated/pricing.tsx`
- `src/routes/_authenticated/usage.tsx`
- `src/routes/_authenticated/account.tsx`
- `src/routes/index.tsx`

## Not in this plan (mentioned but skipped)
- Email verification gate, disposable-email blocking, per-operation credit weights — happy to do as a follow-up if abuse persists.

## Technical notes
- Anon fingerprint = `sha256(ip + cookieId + DAILY_SALT)`. IP-only would punish shared NATs; cookie-only is bypassable; combining both raises the cost of abuse significantly without affecting normal users.
- Rate limit check uses last row in `recipe_generations` (already indexed by user_id) — no new table.
- "Unlimited 50/day" hidden cap: marketing card stays "Unlimited recipes" with an asterisk + small "Fair use applies" line, matching industry norm (ChatGPT, Cursor, etc.).
- All limits read from a single `TIER_LIMITS` constant so future tweaks are one-line.
