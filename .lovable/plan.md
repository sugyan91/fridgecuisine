## 1. Fix country flags on desktop ("Cook the world tonight")

**Problem:** Flag emojis render fine on mobile (iOS/Android ship color flag glyphs) but on Windows/Chrome desktop they fall back to plain letter codes (e.g. "IT", "FR") because Windows has no flag emoji font.

**Fix:** Install the `country-flag-emoji-polyfill` web font (Twemoji Country Flags). It's a single tiny CSS+woff2 that maps regional indicator pairs to color SVG glyphs across all desktop browsers — zero markup change needed.

- `bun add country-flag-emoji-polyfill`
- In `src/styles.css`, import the font and prepend `"Twemoji Country Flags"` to the body/font stack (or apply via a `.flag` utility) so flag emojis render everywhere.
- No change needed in `CountryTiles.tsx`.

## 2. Chef recipe cards: author + fake ratings

Make each chef recipe in `/shop` look like it was posted by a real user with social proof.

**Grid cards (`src/routes/shop.index.tsx`):**
- Add a small author row under the title: tiny avatar circle (initial of author name on a colored disc) + "by {author name}".
- Add a star-rating row: filled stars (★) + numeric rating + count, e.g. `★★★★☆ 4.6 (218)`.

**Detail page (`src/routes/shop.$receipeId.tsx`):** show the same author byline + larger star block ("4.6 out of 5 · rated by 218 home cooks") near the title.

**Fake but stable ratings:**
- Add a small helper `src/lib/fake-ratings.ts` that takes a recipe id and deterministically returns `{ rating: number, count: number }` by hashing the id.
- Rating range: **3.6 – 4.9** (so every recipe is above 3.5). Count range: **120 – 850**.
- Deterministic so a given recipe always shows the same numbers across reloads and across the list/detail pages.

**Author name source:** use the existing chef/author field already returned by `listPublicPaidReceipes` / the detail server function. If a recipe has no author name on record, fall back to a friendly label like "Home chef".

## Files touched
- `package.json` (new dep)
- `src/styles.css` (font import + font-family update)
- `src/lib/fake-ratings.ts` (new)
- `src/routes/shop.index.tsx` (card author + stars)
- `src/routes/shop.$receipeId.tsx` (header author + stars)

No backend, schema, or business-logic changes.
