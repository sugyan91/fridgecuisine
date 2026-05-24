## Goal
Make the "Cook the world tonight" section feel global and inclusive — no one should think their country is excluded — while making it visually more appealing on mobile.

## Problems today
- 18 countries hardcoded; on mobile only ~3 flags are visible at once in a horizontal scroller with no hint there's more.
- No "any other country" escape hatch.
- Tiles are plain white squares — visually flat.

## Changes

### 1. Expand the country list (~40+)
Add representation across every continent so the section reads as global, not Eurocentric/Asian-only. Additions include:
- Africa: Nigeria, Egypt, South Africa, Senegal, Kenya, Ghana, Tunisia
- Americas: USA, Argentina, Colombia, Cuba, Jamaica, Venezuela
- Asia: Indonesia, Philippines, Malaysia, Pakistan, Bangladesh, Sri Lanka, Iran, Iraq
- Europe: UK, Portugal, Poland, Russia, Sweden, Hungary, Ukraine, Netherlands
- Oceania/Middle East: Australia, Israel, Saudi Arabia, UAE, Syria

### 2. "Your cuisine" tile (inclusivity escape hatch)
Append a final tile with a 🌍 globe + "Your cuisine" label. Tapping it opens a small inline input where the user types any country/cuisine (e.g. "Nepalese", "Cambodian"), which feeds into the same `onPick` handler. This guarantees nobody feels excluded.

### 3. Mobile visual polish
- Switch from single-row horizontal scroll to a **2-row horizontal snap carousel** on mobile (`grid-rows-2 grid-flow-col`) so 6+ flags are visible at once instead of 3.
- Add a subtle right-edge fade gradient + a "Swipe →" hint on first paint to signal more content.
- Tile upgrade: soft tinted background per tile (rotating warm palette using existing tokens), larger flag (text-4xl on mobile), rounded-2xl, keep the neo-brutalist offset shadow but soften on mobile.
- Section header: add a small subtitle "40+ cuisines and counting — don't see yours? Add it." to set expectations.

### 4. Section header tweak
Change copy from "Cook the world tonight" to keep the headline but add the inclusive subtitle above the carousel.

## Files touched
- `src/components/landing/CountryTiles.tsx` — expand list, add "Your cuisine" tile + inline input, 2-row mobile grid, edge fade.
- `src/routes/index.tsx` — update the section subtitle copy only.

## Out of scope
No backend, no schema, no new routes. Pure presentation change.
