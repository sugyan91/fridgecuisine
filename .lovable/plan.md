## Goal
Make the tagline "Your own AI powered personal chef" visible on mobile in the header, currently hidden via `hidden sm:block` (line 521 of `src/routes/index.tsx`).

## Problem
At 390px wide, the header row contains: logo + title block (left) and language picker + Sign up/+Share + menu button (right). If we just unhide the tagline, the 32-char text could push the right-side controls or overlap.

## Approach
Single, minimal CSS change in `src/routes/index.tsx` header:

1. **Tagline (line 521–523)**: remove `hidden sm:block`. Use responsive sizing + truncation:
   - `block text-[9px] sm:text-xs text-foreground/60 leading-tight mt-0.5 font-bold truncate`
   - Title above gets `truncate` instead of `whitespace-nowrap` so the parent `min-w-0 flex-1` can actually shrink the column when needed.

2. **Right-side mobile cluster (line 616)**: reduce gap to `gap-1.5` and shrink the Sign up / + Share button padding from `px-3 py-1.5` to `px-2.5 py-1.5` so the left column has enough room for the tagline at 360–390px widths.

3. No other files touched. Tablet/desktop behavior unchanged because the new classes degrade gracefully at `sm:` and above.

## Verification
- Resize preview to 360, 390, 414, 768 — tagline visible on one line, no overlap with right controls, no horizontal scroll.
- Title "fridge cuisine." still readable and not clipped at common widths.
