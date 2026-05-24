## Restore Community, Share, Saved on mobile header

In my previous fix I hid Community and Saved below `sm:` to prevent overlap. The user wants all three visible on mobile. Replace "hidden until sm" with a compact icon+label treatment that fits at 360–414px.

### Changes to `src/routes/index.tsx` header nav

1. **Community** — remove `hidden sm:inline-flex`; keep visible. Shrink padding to `px-1.5 py-1` on mobile and use `text-[10px]` on the smallest size.
2. **+ Share** — already visible; keep Admin-style dark styling. On mobile show `Share` text (not just `+`) so the user sees it.
3. **Saved {n}** — remove `hidden sm:inline-flex`; keep visible. Show as `♥ {n}` (heart icon + count) on mobile to save horizontal space, full `Saved {n}` from `sm:` up.
4. **Sign out** — on mobile shrink to icon-style with shorter text "Out" below `sm:`, full "Sign out" from `sm:` up. (Optional, only if still overlapping.)
5. **Admin** — same compact treatment if signed-in admin; show "A" on mobile, "Admin" from `sm:` up.
6. **Logo title** — keep current truncation; consider hiding the wordmark `fridge cuisine` text on the smallest widths (<360px) and keeping just the logo image, since 5 nav items + wordmark won't fit cleanly. At 390px it should still fit with the compact pills above.
7. Keep `flex-wrap` on the nav as a safety net so nothing clips off-screen.

### File
- `src/routes/index.tsx` (header/nav block only)

No backend or logic changes.