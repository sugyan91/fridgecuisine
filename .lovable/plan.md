## 1. Mobile header overlap

**Problem:** The nav pill (`Community · Sign in · Sign up`) is `position: fixed` in the top-right and lives above the `Fridge Cuisine` logo. On narrow screens the pill grows wide enough to sit on top of the wordmark.

**Fix:**
- Add top padding to the page on mobile so the logo header starts below the nav pill (`pt-16 md:pt-8` on `<main>`).
- Make the nav pill more compact on mobile: shrink "Sign in" to match "Sign up" sizing on small screens (drop `text-sm`/`px-4 py-2` down to `text-[11px]`/`px-3 py-1.5` under `sm`), and hide the "Community" link label on the smallest widths in favor of an icon, or move "Community" inline near the logo. Recommended: keep text, just tighten paddings + use `flex-wrap` safety.
- Optional: on `< sm`, drop the pill out of `fixed` and put it as a normal flex row above the logo so nothing can overlap.

I'll go with: tighten pill paddings on mobile + add `pt-16` on `<main>` so the fixed pill never overlaps the logo, regardless of viewport.

## 2. Dietary list — too long

12 chips × 3 columns = 4 rows, which feels heavy. Recommended trim to the 8 most-used filters, keep the rest discoverable via an expander.

**Default visible (8):**
Vegetarian, Vegan, Gluten-Free, Dairy-Free, High Protein, Low-Carb, Keto, Quick Meal

**Hidden under a `+ More` toggle:**
Halal, Kosher, Nut-Free, Pescatarian

Custom user-added tags continue to show inline.

## 3. Community preview on the homepage

Yes — surface community activity on `/` so visitors immediately see the social proof, without forcing sign-in.

**Behavior:**
- Public read: anyone (signed-in or not) sees a "From the community" strip on the homepage.
- A horizontal scroll / 3-column grid of the 6 most recent published recipes (title, city · cuisine, author name, like count, thumbnail if `image_url`).
- Each card links to `/community/$recipeId` — already public.
- A "See all" link to `/community` (already public).
- Posting still requires login — `+ Share` stays gated behind `/_authenticated/community.new`. Add a small "Sign in to share your recipe" CTA at the end of the strip for logged-out users.

**Data:** `listCommunityRecipes` is already a public server fn (no auth middleware). Call it from a `useQuery` in `src/routes/index.tsx` with `limit: 6`. No DB / RLS changes needed (published recipes already have a public-read policy).

**Placement:** New section between the recipe generator results area and the footer copy, titled "What the community is cooking".

## Files to touch

- `src/routes/index.tsx` — main padding, slimmer mobile nav pill, new community preview section.
- `src/components/fridge/FilterPanel.tsx` — split dietary into core + `+ More` collapsible.
- `src/lib/taxonomy.ts` — export `CORE_DIETARY` (8) and `EXTRA_DIETARY` (4); keep `DEFAULT_DIETARY` as the union for backwards compatibility.
- New small component `src/components/fridge/CommunityStrip.tsx` for the homepage preview.

No database or auth changes required.
