Move the "0/2 free today · Resets in 5h" counter off the homepage and into the account/settings area, where usage already has a dedicated page.

### What we'll do

1. **Remove the counter from the homepage**
   - Delete the three `<RecipeCounter />` call sites in `src/routes/index.tsx` (hero, generate button area, filter panel).
   - Remove the `RecipeCounter` import from `src/routes/index.tsx`.
   - Delete `src/components/RecipeCounter.tsx` since it will no longer be used anywhere.

2. **Surface usage on the Account page**
   - Add a small "Today's usage" card to `src/routes/_authenticated/account.tsx` showing:
     - Current tier
     - Used / limit
     - Remaining count
     - A link to the full `/usage` page
   - Keep the existing "Today's usage" button as-is.

3. **Leave the detailed usage page untouched**
   - `src/routes/_authenticated/usage.tsx` already has the full breakdown (progress bar, reset timer, upgrade CTA), so no changes needed there.

### Result
- The homepage cooking flow is cleaner and no longer shows the countdown.
- Users can still see their usage at a glance on `/account` and get full details on `/usage`.
- The limit modal still appears when the cap is hit, so users aren't caught off guard.