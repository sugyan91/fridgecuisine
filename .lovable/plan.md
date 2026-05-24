## Fixes

### 1. "+ Share" button — make it readable like Admin
In `src/routes/index.tsx` (the signed-in nav around line 483), the Share link uses `bg-secondary` with no explicit text color, so on some themes the label looks blacked-out.

Restyle it to match the Admin button:
- From: `bg-secondary border border-border hover:bg-foreground hover:text-background`
- To: `bg-foreground text-background hover:brightness-110` (same treatment as Admin)

### 2. Community + "fridge cuisine" overlap on mobile after sign-in
On a 390px viewport the signed-in nav renders Community, +, Saved N, (Admin), Sign out — together they push into the logo/title because `nav` has `shrink-0` and the title is `whitespace-nowrap`.

Tighten the header for small screens in `src/routes/index.tsx`:
- Allow the nav to wrap/shrink: remove `shrink-0` from the `<nav>`, add `flex-wrap justify-end min-w-0`, and reduce gap to `gap-0.5` on mobile.
- Hide the "Saved N" count label text on mobile (icon/short form) — show only `Saved` (no count) under `sm`, full label from `sm:` up. Or hide entirely below `sm` since the saved drawer is also accessible from the floating button.
- Hide "Community" link in the header below `sm` (it's already surfaced via the CommunityStrip on the page) — show from `sm:` up.
- Shrink the logo title further on the smallest widths: keep `text-[13px]` but allow truncation by removing `whitespace-nowrap` on `< sm` (keep nowrap from `sm:` up), and add `truncate` so it never pushes the nav.

These together prevent overlap at 360–414px while keeping the desktop layout unchanged.

### Files
- `src/routes/index.tsx` (header/nav block ~lines 437–536 only)

No business logic, routing, or backend changes.