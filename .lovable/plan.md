## Remove "Add a cuisine" input for signed-in users

### Change

In `src/components/fridge/FilterPanel.tsx`, inside the "Global Cuisine Vibe" section, remove the `isAuthenticated && (...)` block that renders:
- the custom cuisines chips row (with × remove buttons), and
- the "Add a cuisine…" input + "+ Add" button.

The dropdown itself stays unchanged. Any cuisines a user previously saved still load from preferences and still appear in `allCuisines` (so the dropdown keeps showing them) — they just can't be added or removed from the UI anymore.

### Left untouched

- `newCuisine` state, `addCuisine`, and `removeCustomCuisine` become unused — also remove them to keep the file clean.
- `customCuisines` state + `fetchPrefs` load stay, so existing saved cuisines still populate the dropdown.
- `savePrefs` stays (still used by the dietary section).
- No DB / server function changes. No changes to the dietary section.
