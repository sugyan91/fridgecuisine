## Problem

On mobile (390px), the header has: language pill (globe + native name like "Português"), "+ Share" / "Sign up" button, and the hamburger. Three pills crammed side-by-side feels tight and can wrap or push the logo.

## Fix

Make the `LanguagePicker` `compact` variant on mobile render as an **icon-only round button** (globe only, no native name), keeping it tappable (~36px) but freeing horizontal space. Desktop header stays unchanged (icon + native name).

Also add a "Language" entry inside the mobile slide-down menu so users can still see/change language with full names if they prefer that surface.

### Changes

1. **`src/components/LanguagePicker.tsx`**
   - Add a new `variant="icon"` (or repurpose `compact`) that renders just the `Globe` icon inside a square/rounded button (`h-9 w-9`, centered), with `aria-label` containing the current language. No text label.
   - Keep `header` variant (icon + native name) for desktop.

2. **`src/routes/index.tsx`**
   - Mobile nav (line ~597): swap `<LanguagePicker variant="compact" />` for the new icon-only variant.
   - Inside the mobile menu panel (the slide-down opened by the hamburger), add a "Language" row that renders the full `LanguagePicker` (with native name visible) so users get a clearer label when the menu is open.

No logic or server-function changes; UI/presentation only.
