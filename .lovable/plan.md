# Surface fake chefs everywhere

Good news: 12 fake chef profiles + 18 premium recipes already exist in the DB, with real display names ("Aiko Carter", "Marco Sato", "Sofia Becker"…). They're just not showing up because:

1. The `/chefs` directory filter requires `payouts_enabled=true` (Stripe onboarding flag) — all seed chefs have `payouts_enabled=false`, so the list returns empty.
2. The `/chefs` page only renders the literal word "Chef" — it never reads `display_name` from `profiles`.
3. `PremiumRecipesStrip` (homepage chef-recipe rail) shows title + city/country but **never displays the chef's name or avatar**.

## Changes

**1. Migration — flip the seed chefs to fully-onboarded**
```sql
UPDATE public.chef_profiles
SET payouts_enabled = true,
    onboarding_completed_at = COALESCE(onboarding_completed_at, now())
WHERE user_id::text LIKE '00000000-0000-0000-0000-0000000f%';
```
Single-row UPDATE on existing seed data only — no schema change, no real users touched.

**2. `src/lib/marketplace.functions.ts` — `listChefs` returns names + avatars**
Enrich the result with each chef's `display_name` / `username` / `avatar_url` from `public.profiles` (same join pattern already used in `listPublicPaidReceipes`). New return shape: `{ user_id, bio, country, avatar_url, name }` where `name` falls back through `display_name → username → "Home chef"`.

**3. `src/routes/chefs.tsx` — render the chef's name**
- Replace the hard-coded `<p>Chef</p>` with the real `name` from the enriched payload.
- Prefer the profile `avatar_url` when present (already wired).
- Tighten copy: "Recipes coming soon" → keep, but country/name now visible.

**4. `src/components/landing/PremiumRecipesStrip.tsx` — show "by <Chef Name>"**
The strip already receives `author_name` and `author_avatar_url` via `listPublicPaidReceipes`. Add a 1-line `by <Author>` row with the small avatar (mirrors the existing `/shop` card treatment) under the title, above the location. Truncate with `truncate` so long names don't break the card.

## Out of scope
- New fake chefs (12 already seeded). If you want more, ask and I'll add a second seeding migration.
- The receipe detail page (`/shop/$receipeId`) — it already pulls `author_name` from the same backend; will benefit automatically.
- Real Stripe onboarding flow — untouched; only the seed rows get the flags flipped.

## Verify
- Visit `/chefs` → 12 chef cards with names like "Aiko Carter", country labels, avatars.
- Homepage premium rail → each card shows "by <Chef Name>" with avatar.
- `/shop` index → already shows author; confirm still correct.
