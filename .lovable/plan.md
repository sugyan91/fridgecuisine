Remove the 4 pricing/feature stat boxes from the ChefCTA section.

### What to change
- **File**: `src/components/landing/ChefCTA.tsx`
- **Action**: Delete the `<div className="lg:col-span-5 grid grid-cols-2 gap-3 w-full">` block (lines 32-37) containing the 4 `Stat` components (`$0–∞`, `Global`, `None`, `Direct`).
- **Result**: The ChefCTA section will keep the left-side heading, description, and CTA buttons, but the right-side 2×2 stat grid will be gone.

### Out of scope
- No changes to text, buttons, or layout of the remaining ChefCTA content.
- No changes to other pages or components.