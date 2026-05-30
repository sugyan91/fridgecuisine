## Goal
Rotate the "Popular pantry combos" tiles every ~10 hours, drawing from a pool of **500+ combos** so visitors keep seeing fresh, globally diverse ideas.

## Approach
Pure client-side, deterministic time-bucketed selection. All visitors see the same 6 tiles within a rotation window, then the set changes together at the next bucket boundary. No backend.

## Changes

### 1. New file: `src/data/popular-combos.ts`
Export a typed array of **500+ combos**, each `{ label, emoji, ingredients: string[] }`. Curated by cuisine families for global breadth — examples:

- **Italian** (~40): Pasta night, Carbonara, Cacio e pepe, Pesto pasta, Risotto, Margherita, Lasagna, Gnocchi, Caprese, Minestrone…
- **Mexican / Latin** (~40): Taco Tuesday, Quesadilla, Fajitas, Enchiladas, Chilaquiles, Pozole, Arepas, Ceviche…
- **East Asian** (~60): Stir-fry, Fried rice, Ramen, Pho, Pad Thai, Bibimbap, Sushi bowl, Mapo tofu, Dumplings, Kung pao…
- **South Asian** (~40): Cozy curry, Tandoori, Butter chicken, Dal, Biryani, Chana masala, Samosa filling…
- **Middle East / Mediterranean** (~40): Shakshuka, Mezze board, Hummus bowl, Falafel wrap, Tabbouleh, Kofta…
- **French / European** (~30): Ratatouille, Croque monsieur, Coq au vin, Galette, Bouillabaisse…
- **American comfort** (~40): Mac & cheese, Burger night, BBQ pulled pork, Chili, Meatloaf, Grilled cheese…
- **Breakfast / brunch** (~30): Breakfast hash, Pancake stack, Avocado toast, Omelette, Granola bowl…
- **Healthy bowls / salads** (~40): Buddha bowl, Quinoa bowl, Poke bowl, Greek salad, Cobb…
- **Soups / stews** (~30): Lentil soup, Tom yum, French onion, Borscht, Gumbo…
- **Vegan / vegetarian** (~40): Veggie chili, Mushroom risotto, Cauliflower steak, Tofu scramble…
- **Sandwiches / wraps** (~30): Banh mi, Reuben, Caprese panini, Wrap…
- **Desserts** (~30): Chocolate mousse, Tiramisu, Crumble, Pancakes…
- **African / Caribbean / Brazilian** (~30): Jollof, Tagine, Jerk chicken, Feijoada…

Each entry has emoji + 5 representative pantry ingredients. The file is data-only and tree-shake-friendly.

To keep this manageable I will generate the list programmatically during the edit (drawing on standard global recipes), then hand-check for duplicates and obviously broken entries before committing.

### 2. Edit `src/routes/index.tsx`
- Remove the inline `POPULAR_COMBOS` constant.
- Import the new list from `@/data/popular-combos`.
- Inside `PopularCombos`, add (memoized):
  ```ts
  const ROTATION_HOURS = 10; // within 8–12h band
  const bucket = Math.floor(Date.now() / (ROTATION_HOURS * 3600 * 1000));
  const visible = useMemo(() => seededPick(ALL_COMBOS, 6, bucket), [bucket]);
  ```
  where `seededPick` uses a tiny mulberry32 PRNG seeded by the bucket — deterministic, no deps.
- Render `visible` in the existing grid; tile markup/styling untouched.

## Why this shape
- **Deterministic per window** → same 6 tiles for every visitor in a ~10h window, no flicker on re-mount.
- **500+ pool** → with 6 shown per window, the rotation effectively never repeats for months.
- **Zero backend** → no DB, cron, or server function.
- **Easy to tune** → change `ROTATION_HOURS` (8–12) or extend the data file freely.

## Out of scope
- Per-user personalization or A/B
- Server-side rotation
- Transition animation between buckets
- Visual restyle of the tiles
- Localization of combo labels
