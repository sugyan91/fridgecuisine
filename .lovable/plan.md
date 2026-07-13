## Goal

Make the tiles under **"Unlock a single recipe."** (`PremiumRecipesStrip`) and **"Tonight's fridges, turned into dinner."** (`CommunityStrip`) show a fresh random selection every time the app loads, while avoiding a re-fetch on every navigation by using a browser cache.

## Current behavior

- `PremiumRecipesStrip` calls `listPublicPaidRecipes` (returns up to 120 rows, newest first) and always slices the **first 8** → same 8 tiles every load.
- `CommunityStrip` calls `listCommunityRecipes({ limit: 6 })` (newest first) → same 6 tiles every load.

## Plan

### 1. Introduce a small session cache helper
- New file: `src/lib/rotating-pool.ts`.
- Exports `getRotatingPool<T>({ key, ttlMs, fetcher })`:
  - Reads pool from `sessionStorage` under `key` if fresh (within `ttlMs`, default ~30 min).
  - Otherwise calls `fetcher()`, stores `{ fetchedAt, items }` in `sessionStorage`.
  - Returns the full pool.
- Exports `pickRandom<T>(items, n)` using Fisher-Yates; returns up to `n` unique items.
- Rotation trigger: shuffle runs on every mount (each app/page load), so users see a new random slice each visit even when the underlying pool is served from cache. Cache only stores the pool, never the picked slice.

### 2. Update `PremiumRecipesStrip` (`src/components/landing/PremiumRecipesStrip.tsx`)
- Replace the direct `fetchList().then(res => setRows(res.rows.slice(0, 8)))` with:
  - `getRotatingPool({ key: "premium-recipes-pool-v1", fetcher: () => fetchList().then(r => r.rows) })`
  - Then `setRows(pickRandom(pool, 8))`.
- No visual/layout changes; still renders nothing while loading or empty.

### 3. Update `CommunityStrip` (`src/components/fridge/CommunityStrip.tsx`)
- Change the server call to fetch a larger pool: `fetchRecipes({ data: { limit: 30 } })` (server fn already accepts a `limit`; 30 is enough variety without weight).
- Wrap in `getRotatingPool({ key: "community-recipes-pool-v1", fetcher: ... })`.
- `setRecipes(pickRandom(pool, 6))` on mount.
- No layout changes.

### 4. Verification
- `bunx tsgo --noEmit`.
- Load the homepage twice (fresh reload); confirm the two sections show different items each time and that the network tab shows only one fetch per section per session (cached on the second reload within TTL — but the displayed items still differ because shuffling happens on mount).

## Files touched

- Add: `src/lib/rotating-pool.ts`
- Edit: `src/components/landing/PremiumRecipesStrip.tsx`
- Edit: `src/components/fridge/CommunityStrip.tsx`

No server function, schema, or styling changes.
