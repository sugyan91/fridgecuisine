## Mobile header: collapse nav into a hamburger menu

The five tiny pills (Community / Share / Saved / Admin / Sign out) crammed next to "fridge cuisine" look messy at 390px no matter how I shrink them. Replace the cramped row with a clean mobile pattern:

### On mobile (< md)
- Logo + wordmark on the left (full size, not truncated).
- A single primary action visible on the right: **+ Share** (dark Admin-style pill) — the most important call to action.
- A **hamburger icon button** next to Share that opens a slide-down dropdown menu containing: Community, Saved ({n}), My Receipes, Cookbook, Admin (if admin), the user email, and Sign out.
- Menu items are full-width rows with comfortable tap targets (44px), separated by dividers; close on item click or outside click.

### On desktop (md+)
- Keep the current horizontal nav exactly as it is (Community, +Share, Saved, Admin, email, Sign out). No regression.

### Implementation notes
- Add `mobileMenuOpen` state in `src/routes/index.tsx`.
- Use `lucide-react`'s `Menu` and `X` icons (already a dependency in this stack).
- Render the dropdown as an absolutely-positioned panel below the header, full width, with `bg-background border-b border-border shadow-lg`, only when `mobileMenuOpen && md:hidden`.
- Restore the wordmark to its readable size on mobile (`text-base sm:text-lg md:text-xl`, drop the `text-[13px]` hack and `truncate`).
- Keep the +Share button visible on mobile so the primary CTA stays one tap away.

### Files
- `src/routes/index.tsx` only (header/nav block).

No backend or routing changes.