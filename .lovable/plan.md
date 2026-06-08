## Why you see 0/1

The anonymous quota is hard-coded as a **lifetime** limit of **1** recipe per cookie fingerprint, not 2/day. Two places set it:

- `src/lib/anon-tracking.server.ts` — `ANON_LIFETIME_LIMIT = 1`, never resets
- `src/hooks/use-recipe-usage.ts` — mirrors the lifetime semantics, midnight reset disabled

The error string also already says "Sign up free for 2 recipes every day" — the message and the actual cap have drifted apart.

## What to change

### 1. Make the anonymous limit daily and equal to 2
- Rename `ANON_LIFETIME_LIMIT` → `ANON_DAILY_LIMIT = 2`.
- Count only generations whose `last_seen_at` falls in the current UTC day.

### 2. Track the daily counter explicitly
Add two columns to `public.anonymous_ai_usage` and a migration:
- `day_count int not null default 0`
- `day_date date not null default current_date`

Logic in `checkAnonQuota` / `recordAnonGeneration`:
- If `day_date < current_date`, reset `day_count = 0` and bump `day_date = current_date` before checking/incrementing.
- Block when `day_count >= 2`.
- Keep the existing lifetime `count`, `quota_hit_count`, `ip_change_count`, `rapid_request_count` for abuse analytics — the dashboard already uses them.

### 3. Strict IP-based enforcement (defense-in-depth)
Today the fingerprint is `sha256(ip + cookieId + secret)`, so clearing cookies issues a new fingerprint and resets the daily counter. To make the cap "strictly tagged by IP", also store a row keyed only by `ip_hash` and take the **max** of the per-fingerprint and per-IP daily counts when deciding to block.

Concretely:
- Add a new table `public.anonymous_ai_usage_by_ip (ip_hash text pk, day_count int, day_date date, last_seen_at timestamptz)` with the same service-role/admin policies and grants as `anonymous_ai_usage`.
- On every check/record, read+write both rows. The user is blocked when either daily count is >= 2.
- Anonymizer/Tor users sharing an IP can still share a quota — that is the intent of "strict per-IP".

### 4. UI / hook updates
- `useRecipeUsage`: drop `ANON_LIFETIME_LIMIT`; for `tier === "anon"` use a daily limit of 2, set `lifetime = false`, re-enable the midnight refresh that's currently commented out.
- Rate-limit error copy: "You've used your 2 free recipes for today. Sign up free to keep cooking, or come back tomorrow."
- Any "lifetime" wording on the anonymous quota chip becomes "today, resets at midnight".

### 5. Keep
- Existing abuse signals (`anon_rapid_request`, `anon_ip_change`, `anon_quota_hit`) still fire — including a `quota_hit_count` bump when the daily wall is reached.
- The signed httpOnly cookie + IP fingerprint stays as the primary key; the per-IP row is purely an additional ceiling.

## Files affected

- `supabase/migrations/<new>.sql` — add `day_count`/`day_date` to `anonymous_ai_usage`, create `anonymous_ai_usage_by_ip` with grants + RLS + admin/service-role policies.
- `src/lib/anon-tracking.server.ts` — daily limit constant, dual-key check/record, new return shape.
- `src/lib/usage.functions.ts` — return `{ used, limit: 2, tier: "anon", lifetime: false }`.
- `src/hooks/use-recipe-usage.ts` — drop lifetime branch, re-enable midnight refresh.
- One or two call sites that show "lifetime" copy for anonymous users (rate-limit toast in recipe generation flow).

## Out of scope

- Free signed-in tier stays at 2/day (unchanged).
- No changes to paid tiers, payments, or auth.
