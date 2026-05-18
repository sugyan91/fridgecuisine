## Status: this already works — just hidden

Signed-in users can already create their own dietary tags today:

- The "Add your own…" input under the Dietary section saves to `user_preferences.custom_dietary` (per-user, RLS-protected).
- Custom tags appear as selectable chips alongside the defaults (Vegan, Gluten-Free, etc.) in the same grid.
- Selected custom tags flow into recipe generation exactly like built-in dietary tags — the AI honors them when cooking from pantry.

So the underlying feature is built. The problem is it's not obvious that this is where you put allergies (e.g., "Peanut allergy", "No shellfish").

## Plan — make allergy intent obvious

1. **Reword the section** in `src/components/fridge/FilterPanel.tsx`:
   - Header changes from "Dietary" → "Dietary & Allergies".
   - Input placeholder changes from "Add your own…" → "Add allergy or diet (e.g. Peanut allergy)".
   - Small helper line under the input for signed-in users: "Your custom tags are saved and reused every time."

2. **Style custom tags distinctly** so users can tell their own allergy tags from defaults:
   - Custom tags get a small badge dot or a different border accent (e.g., paprika ring) while keeping the same toggle behavior.

3. **Reinforce in the recipe prompt** (`src/lib/recipes.functions.ts`):
   - When dietary tags are passed in, explicitly instruct the model to treat them as strict allergy/diet constraints — exclude any ingredient that conflicts and call out swaps in `substitutions`.

No database or schema changes are needed — `user_preferences.custom_dietary` already exists and is used.

## Technical details

- Edit only `src/components/fridge/FilterPanel.tsx` for the UI/copy/styling tweaks.
- Edit the system/user prompt in `src/lib/recipes.functions.ts` to harden allergy handling.
- No new tables, no new server functions, no migrations.