The Welcome Tour popup on the home page already tries to remember it was shown via localStorage, but you are seeing it on every visit. We will audit the current implementation and harden the once-per-device behavior so the tour only appears for first-time visitors and stays hidden on repeat visits.

### What we will do

1. Audit the current `WelcomeTour.tsx` component and how it is mounted in `src/routes/index.tsx`.
   - Confirm the `STORAGE_KEY` is set when the user closes or completes the tour.
   - Check if the component is mounted in multiple places or if the key is being cleared/reset.

2. Harden once-per-device storage.
   - Use a consistent `localStorage` key (`fc.welcomeTour.v1`).
   - Ensure `finish()` is called for every close path: clicking the close button, pressing Escape, clicking outside the dialog, and completing the final slide.
   - Add a small `console.warn` only in development if `localStorage.setItem` fails, so future issues are easier to spot.

3. Add a soft fallback if storage is unavailable.
   - If `localStorage` is not accessible (private mode, disabled storage, etc.), keep a session-scoped memory fallback so the popup does not reappear within the same browsing session.

4. Add an explicit "Don't show again" option.
   - Add a small checkbox/text in the tour dialog footer so users can permanently dismiss the tour even if they did not reach the last slide.

5. Verify the fix.
   - Run a quick build/typecheck.
   - Use the browser preview to confirm: first visit shows the tour, closing it sets the flag, and refreshing the page does not show the tour again.

### Out of scope (unless you ask)
- Replacing the tour with a different onboarding pattern (e.g., inline tooltips).
- Showing the tour only after sign-up instead of first visit.
- Making the tour visible from a "Help" menu later.

### Deliverables
- Updated `src/components/onboarding/WelcomeTour.tsx`
- Updated `src/routes/index.tsx` if needed for mounting/close behavior
- No changes to route structure or other popups