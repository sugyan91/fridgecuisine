## Goal
Replace the ugly desktop/tablet grid wall with a lively auto-scrolling 2-row marquee that feels global and dynamic. Keep the mobile 2-row swipe carousel as-is (user said mobile looks fine).

## Approach

### Desktop/tablet (md+): dual-row marquee
- Split the 50 country tiles into two rows (odd/even or top/bottom halves).
- Row 1 scrolls **left → right**, Row 2 scrolls **right → left**. Opposing directions read as "the world in motion".
- Use pure CSS `@keyframes` translateX animation (no JS, no extra deps). Duplicate the tile list inline (`[...row, ...row]`) so the loop is seamless.
- Pause animation on hover of the row container (`group-hover:[animation-play-state:paused]`).
- Each tile remains independently clickable (buttons still work mid-animation).
- Edge fade gradients on both left and right so tiles fade in/out of view instead of hard-cutting.
- Animation duration ~60s per row for a slow, calm pace — not distracting.

### Mobile (<md): unchanged
Keep the existing 2-row snap swipe carousel + 🌍 tile + custom-cuisine input.

### "Your cuisine" tile placement on desktop
Place the 🌍 inclusivity tile as a **fixed CTA** to the right of the marquee (or above it on tablet), not inside the moving rows — so it's always visible and not chasing the user. On mobile it stays at the end of the carousel as today.

## Files touched
- `src/components/landing/CountryTiles.tsx` — split into mobile carousel branch (current code) and desktop marquee branch with keyframe animation.
- `src/styles.css` — add `@keyframes marquee-left` and `marquee-right` plus a `.marquee-row` utility (animation, will-change, hover-pause). Keeping animations in styles.css avoids inline `<style>` blocks.

## Out of scope
No new data, no backend, no library installs.
