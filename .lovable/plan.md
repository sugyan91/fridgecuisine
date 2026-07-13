## Goal
Add a top-of-page entry point for recipe creators to discover the `/sell` flow, without removing the existing footer ChefCTA.

## Plan

### 1. Header nav item (desktop)
- Add a new `Link to="/sell"` in the desktop navigation bar, between `Shop` and `Contact`.
- Use creator-earning focused copy: **"Sell recipes"** or **"Earn"**.
- Style as a compact, attention-drawing pill with the warm gradient used for primary CTAs, so it reads as a monetization prompt rather than a plain nav link.
- Keep existing nav spacing and collapse behavior on smaller desktop widths.

### 2. Header nav item (mobile)
- Add the same `Link to="/sell"` in the mobile dropdown panel, near the top so users see it immediately after opening the menu.
- Use the same **"Sell recipes"** label, optionally with a small "Earn" badge or coin icon for visual distinction.
- Ensure it closes the mobile menu on tap.

### 3. Keep existing footer ChefCTA
- Leave `ChefCTA.tsx` and its placement near the footer untouched.
- No copy changes to the footer version unless requested later.

### 4. Verify responsive behavior
- Confirm the new desktop pill does not wrap or crowd the header on 1024–1280 px viewports.
- Confirm the mobile dropdown remains scrollable and the new item is tappable.

## Files to edit
- `src/routes/index.tsx` — add the new nav link in both desktop and mobile header sections.

## Out of scope
- No changes to `/sell` route content.
- No changes to the footer ChefCTA copy or placement.
- No new images or animations.