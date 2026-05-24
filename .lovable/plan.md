## Goals
Four tweaks + one security lockdown.

### 1. Remove copy
- Drop the "Don't see yours? Add it" CTA + custom-cuisine input from `CountryTiles` (mobile carousel keeps 🌍 tile or also removed — see scope note).
  Scope: remove on **both** mobile and desktop per the request "Remove Don't see yours add it".
- Remove "Keep 70% of every sale — payouts straight to your bank." line from `ChefCTA` and the matching subtitle on `/sell` page.

### 2. Trending dishes — unique countries + silent rotation
- Expand `DISHES` pool in `TrendingDishes.tsx` to ~24 dishes spanning many countries (Italy, Japan, Mexico, Thailand, India, France, China, Korea, Vietnam, Greece, Lebanon, Ethiopia, Morocco, Peru, Brazil, Spain, Turkey, USA, Nigeria, Indonesia, Philippines, Argentina, UK, Germany). Reuse existing food images where possible; for new entries use a small set of new Unsplash URLs or repurpose existing assets thoughtfully.
- On each render, derive a `visible` array of 6 dishes (mobile 4, desktop 6) where **every flag/country is unique**. Pick by walking the pool and skipping already-picked countries.
- Rotation: `setInterval` every **3.5 minutes** (210 s) advances a `cursor` state; recompute the visible 6 from the new cursor. Same uniqueness rule.
- "Silent" swap: no fade, no transition class — just React re-render. Stable React keys per slot index (not per dish name) so DOM nodes are reused and only the image/text content changes; users don't see flicker.

### 3. Lock down paid recipe ingredients (security)
**Problem:** Current RLS on `paid_recipes` allows **anyone** to SELECT all columns of any published recipe — including `ingredients`, `steps`, `tips`. Even un-signed visitors can read paid content via the API.

**Fix (migration):**
- Create view `public.paid_recipes_preview` with `security_invoker=on` exposing only: `id, chef_user_id, title, description, cuisine, country, cover_image_url, prep_minutes, cook_minutes, serves, price_cents, is_published, created_at`. Excludes `ingredients`, `steps`, `tips`.
- Replace existing SELECT policy on `paid_recipes`:
  - Drop "Published paid recipes public read".
  - Add "Owner/admin read full" — `auth.uid() = chef_user_id OR has_role(auth.uid(), 'admin')`.
  - Add "Buyers read purchased full" — `auth.uid() IS NOT NULL AND has_purchased_recipe(auth.uid(), id)`.
- Public listings, chef directory, and any "browse" UI must query `paid_recipes_preview` (no ingredient leak).
- The full `paid_recipes` row is only readable by chef, admin, or verified purchaser.

**App-side wiring (Phase 2 UI doesn't exist yet)** — since paid recipe browse/buy/view UI isn't built yet, this plan covers only the DB lockdown now. When Phase 2 UI is added later, it will already be safe by default.

### 4. Files touched
- `src/components/landing/CountryTiles.tsx` — remove "Your cuisine"/🌍 tile + form + state.
- `src/components/landing/ChefCTA.tsx` — remove the 70%/payouts line.
- `src/routes/_authenticated/sell.tsx` — remove matching subtitle line.
- `src/components/landing/TrendingDishes.tsx` — expand pool, unique-country picker, 3.5-min silent rotation via `useEffect` + `setInterval`.
- New migration — view + revised RLS for `paid_recipes`.

### Out of scope
- No new images downloaded (reuse existing asset imports; new pool entries can share images across cuisines via a `cuisine`→image mapping if needed, OR I add ~6 new Unsplash URLs as `img` strings).
- No Phase 2 marketplace UI is built in this turn.
