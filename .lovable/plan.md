## Changes to `src/routes/index.tsx` and `src/components/RecipeCounter.tsx`

### 1. Fix "Start cooking" button overlapping input on mobile
In the dish input form (`src/routes/index.tsx` ~line 565):
- Stack the button below the input on mobile, keep overlay layout on `sm:` and up.
- Change input `pr-36 md:pr-44` → `pr-4 sm:pr-36 md:pr-44` and reduce mobile vertical padding (`py-5` → `py-4 sm:py-5`).
- Change button classes: drop absolute positioning on mobile — `absolute right-2 top-2 bottom-2` → `mt-2 w-full sm:mt-0 sm:w-auto sm:absolute sm:right-2 sm:top-2 sm:bottom-2`, and add `py-3 sm:py-0` so the standalone mobile button has height.

Result: on mobile the user can type freely with no button overlap; on tablet/desktop the button stays inside the pill as today.

### 2. Update headline copy (`src/routes/index.tsx` line 551)
Replace:
> "See something that made you hungry?"

With:
> "What food is living rent-free in your **head** right now?"

Keep current font/size classes. Apply `text-accent` to "head" (matches existing accent pattern). Keep the `<br className="hidden sm:inline" />` for a clean two-line break on larger screens.

### 3. Clarify the `0/5 today` counter and add an upgrade lure
In `src/components/RecipeCounter.tsx`:
- Change the pill label from `"0/5 today"` to `"0 of 5 free recipes today"` (full label on `sm:` and up; on mobile keep compact `"0/5 free today"` to fit). Implement via two spans with `hidden sm:inline` / `sm:hidden`.
- Below the pill, replace the current "Resets in {countdown}" subtext with a two-line block:
  - Line 1 (existing behavior): `Resets in {countdown}` (or `Limit reached`).
  - Line 2 (new, always shown for free users): a small upgrade lure linking to `/pricing`:
    > "Go unlimited → cook anything, anytime"
  Styled as a subtle underlined link in `text-accent` so it draws the eye without screaming.
- Keep the existing `title="Free plan: 5 recipes per day"` tooltip as a fallback hover hint, and update its text to `"You get 5 AI recipes per day on the free plan. Upgrade for unlimited."`.

### Out of scope
- No backend / RLS / pricing logic changes.
- No changes to the premium counter branch beyond what's stated.
- No layout changes outside the hero / counter.
