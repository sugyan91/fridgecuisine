## New 4-tier model

| Tier | Daily AI uses | Price | At the limit |
|---|---|---|---|
| Anonymous | **3 / 24h** | Free | Modal → "Sign in to keep cooking" → `/auth` |
| Signed-in free | **3 / 24h** | Free | Modal → "Upgrade for more" → pricing (Basic or Unlimited) |
| **Basic** | **10 / 24h** | **$5.99/mo** | Modal → "Go unlimited — $19.99/mo" → Stripe checkout (`unlimited_monthly`) |
| **Unlimited** | Unlimited | **$19.99/mo** | No gate |

## Stripe products
- Rename the existing `premium_monthly` price ($5.99) intent → keep the **price id `premium_monthly`** but it now represents the **Basic** tier (10/day). No new SKU needed if the amount is already $5.99.
- **Create new product + price**: `unlimited_plan` / `unlimited_monthly` at **$1999 USD / month**, `quantity_min=1`, `quantity_max=1`, tax code `txcd_10000000`.
- Both plans go through the existing embedded checkout flow (`createCheckoutSession`, `useStripeCheckout`).

## Tier resolution (server)
New helper `resolveTier(userId)` in `src/lib/ai-quota.server.ts`:
1. No `userId` → `"anon"` (limit 3)
2. Look up newest `subscriptions` row for env + user, `isActive` check.
3. Map by `price_id`:
   - `unlimited_monthly` → `"unlimited"` (no limit)
   - `premium_monthly` → `"basic"` (limit 10)
   - otherwise / no active sub → `"free"` (limit 3)

`DAILY_LIMITS = { anon: 3, free: 3, basic: 10, unlimited: Infinity }`.

## Middleware
New `requireAiQuota` (replaces `requireSupabaseAuth` on the 5 AI server fns: `generateRecipes`, `fridge-vision`, `dish-helper`, `ingredient-swap`, `recipe-image`):
- Reads session optionally (does not throw).
- Resolves tier; counts against `user_id` for signed-in, `anon_id` (HMAC-signed `fc_anon` cookie) for anon.
- On limit, returns typed error:
  ```ts
  { ok: false, code: "rate_limit", tier: "anon"|"free"|"basic",
    requiresSignIn?: true, requiresUpgrade?: true, suggestedPlan?: "basic"|"unlimited" }
  ```
  - anon → `requiresSignIn`
  - free → `requiresUpgrade`, `suggestedPlan: "basic"`
  - basic → `requiresUpgrade`, `suggestedPlan: "unlimited"`

## DB migration (`recipe_generations`)
- `user_id` nullable, add `anon_id text`, `ip_hash text`
- `CHECK ((user_id IS NULL) <> (anon_id IS NULL))`
- Indexes `(anon_id, created_at)`, `(ip_hash, created_at)`
- Service-role insert path for anon rows; existing authenticated RLS unchanged.

## Anon identity
- HMAC-signed `fc_anon` cookie (1y, HttpOnly/Secure/SameSite=Lax).
- New secret `ANON_COOKIE_SECRET`.
- IP soft-cap 10/24h via `ip_hash`.

## Client wiring

**Pricing page (`src/routes/_authenticated/pricing.tsx`)** — rebuild as 3 cards:
- Free — "3 recipes/day"
- **Basic — $5.99/mo — 10 recipes/day** (CTA: Subscribe → `premium_monthly`)
- **Unlimited — $19.99/mo — Unlimited recipes** (CTA: Subscribe → `unlimited_monthly`, marked "Most popular")

**`LimitReachedModal`** — accepts `tier` + `suggestedPlan`. Variants:
- anon: "You've used your 3 free recipes today. Sign in to keep cooking." → `/auth`
- free: "You've used your 3 daily recipes. Upgrade to Basic ($5.99/mo) for 10/day or Unlimited ($19.99/mo)." → pricing
- basic: "You've used your 10 recipes today. Go Unlimited for $19.99/mo." → checkout `unlimited_monthly`

**`FreeTierBanner` / `RecipeCounter`** — copy switches by tier:
- anon / free: "X of 3 today"
- basic: "X of 10 today"
- unlimited: hidden

**`useSubscription` / `isPremium`** — add `tier: "free"|"basic"|"unlimited"` derived from `price_id`. Replace existing `isPremium` consumers that gate "any paid" with `tier !== "free"`; replace anywhere that gates "unlimited only" with `tier === "unlimited"`.

**`src/routes/index.tsx`** — on `rate_limit` open modal with returned `tier`/`suggestedPlan`.

## Copy sweep — every "5/day", "5 free", "5 today", "$5.99" reference
Grep and update:
- `FreeTierBanner.tsx`, `RecipeCounter.tsx`, `LimitReachedModal.tsx`, `index.tsx`
- `pricing.tsx`, `account.tsx`
- Marketing/landing sections, FAQ, meta descriptions if they mention quotas
- SEO `<title>` / meta descriptions referencing free quota

## Files

**New**
- `src/lib/anon-cookie.server.ts`
- `src/lib/ai-quota-middleware.server.ts`

**Modified**
- `src/lib/ai-quota.server.ts` (limits map, `resolveTier`, premium bypass, anon path)
- `src/lib/recipes.functions.ts`, `fridge-vision.functions.ts`, `dish-helper.functions.ts`, `ingredient-swap.functions.ts`, `recipe-image.functions.ts`
- `src/lib/usage.functions.ts` (auth-optional, returns `{ used, limit, tier }`)
- `src/hooks/use-recipe-usage.ts`, `src/hooks/useSubscription.ts`
- `src/routes/index.tsx`, `_authenticated/pricing.tsx`, `_authenticated/account.tsx`
- `src/components/LimitReachedModal.tsx`, `FreeTierBanner.tsx`, `RecipeCounter.tsx`
- DB migration on `recipe_generations`

**Stripe**
- Create `unlimited_plan` product + `unlimited_monthly` price ($19.99/mo)
- Keep `premium_monthly` as Basic tier

**Secret**
- `ANON_COOKIE_SECRET`

## Out of scope
- Yearly billing, trials, coupons
- Migrating existing `premium_monthly` subscribers (they automatically become Basic 10/day — the price they pay is unchanged)
- Per-feature quotas (image gen vs recipe text counted the same)
