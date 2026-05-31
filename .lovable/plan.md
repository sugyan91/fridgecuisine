## Goal
Make the red "Beta" label visible on mobile, tablet, and desktop without crowding the mobile header (which currently overlaps the language picker / sign-up button).

## Approach
Move the Beta pill out of the `<h1>` text flow and anchor it to the logo image as a small absolute-positioned badge. This way it costs zero horizontal space in the header row, so it can't overlap the language picker on mobile, and it stays visible at every breakpoint.

## Changes (single file: `src/routes/index.tsx`, header block ~lines 498–523)

1. Wrap the logo `<img>` in a `relative inline-block` container.
2. Add a small Beta pill positioned at the top-right of the logo:
   - `absolute -top-1 -right-2`
   - `rounded-full bg-red-500 text-white`
   - `text-[8px] sm:text-[9px] font-bold tracking-wider uppercase`
   - `px-1.5 py-[1px] leading-none shadow-sm ring-1 ring-red-600/40`
3. Remove the existing inline `<span>...Beta...</span>` from inside the `<h1>` (the one with `hidden sm:inline-block`).

## Result
- Beta shows on 390px mobile, tablet, and desktop.
- No layout shift in the nav row; language picker and sign-up stay in place.
- Still red and clearly visible, sized down slightly on mobile so it doesn't dwarf the logo.

No other files, styles, or logic change.