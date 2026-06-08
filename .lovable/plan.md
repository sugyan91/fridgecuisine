
# Make FridgeCuisine feel like a finished product

Targeted pass for casual home cooks. Three focused features plus a quality sweep — no full redesign, no marketplace changes.

## 1. Nutrition front-and-centre on every recipe

Today nutrition is behind an opt-in toggle. We'll make it part of every generated, saved, and shared recipe.

- Always generate `nutrition` (servings + per-serving calories, protein, carbs, fat, **sugar**, **fiber**) — drop the `includeNutrition` toggle.
- Show a compact nutrition strip on the collapsed RecipeCard (kcal · P/C/F) and the full breakdown when expanded.
- Include sugar + fiber in the PDF export.
- New "Daily totals" bar on the saved-recipes drawer and meal planner: sum of kcal/P/C/F/sugar/fiber for everything marked cooked today (or scheduled for a given day).

Schema impact: extend the AI response schema and `Recipe` type with `sugarG`, `fiberG`. No DB migration — `saved_recipes.recipe` is JSONB.

## 2. Personal Recipe Collections ("My Cookbooks")

Not the existing chef/paid `cookbooks` table (that's for sellers). A separate lightweight, private-by-default folder system over the user's saved recipes.

- New tables: `recipe_collections` (id, user_id, name, emoji, color, is_public, slug, created_at) and `collection_items` (collection_id, saved_recipe_id, position).
- RLS: owner full CRUD; public collections readable by anon when `is_public = true`.
- UI: "Collections" tab in the SavedDrawer with create/rename/delete; "Add to collection" action on every saved recipe card.
- Public collection page at `/c/$slug` (server-rendered, OG image = first recipe's image, JSON-LD `ItemList`).

## 3. Weekly Meal Planner

A simple drag-and-drop week grid that pulls from saved recipes.

- New table: `meal_plan_entries` (id, user_id, plan_date date, meal_slot text — breakfast/lunch/dinner/snack, saved_recipe_id, servings_override int, position).
- Page at `/_authenticated/planner`: 7-day grid (this week / next week toggle), drag a saved recipe into a slot, click to remove.
- Auto-computed footer per day: total kcal/P/C/F/sugar/fiber (scaled by `servings_override` ÷ recipe servings).
- "Generate shopping list" button: aggregates ingredient strings across the week, groups identical names, opens a printable view + adds a PDF export reusing the existing PDF helper.
- Entry point: link in the top nav for signed-in users and a CTA in SavedDrawer ("Plan your week →").

## 4. Quality & polish sweep

The smaller things that make it feel professional.

- **Empty states**: SavedDrawer, Collections, Planner, Community feed when empty — friendly copy + single CTA, not blank panels.
- **Loading skeletons**: replace "Plating your dish…" pulse with a proper skeleton card so the layout doesn't shift while images generate (fixes CLS on the homepage results grid).
- **LCP preload**: per-route `head().links` preload for the home hero image.
- **Per-route SEO**: audit `/community`, `/shop`, `/chefs`, `/contact` — make sure each has unique `title`, `description`, `og:title`, `og:description`, `og:url`, and a `canonical`. Add JSON-LD `Recipe` schema to `/community/$recipeId` and `/shared/$slug` (uses nutrition, cookTime, recipeIngredient, recipeInstructions).
- **Accessibility pass**: add visible focus rings on the custom card buttons, alt text for AI-generated recipe images, aria-labels on icon-only buttons in RecipeCard/SavedDrawer.
- **Error pages**: branded 404 and root error boundary copy (currently default-ish).
- **About page** at `/about`: short story, how the AI works, link to contact — boosts trust for casual visitors.

## Technical notes

```text
DB migration (single file):
  - CREATE TABLE recipe_collections + GRANTs + RLS (owner full, anon SELECT WHERE is_public)
  - CREATE TABLE collection_items + GRANTs + RLS (via parent collection)
  - CREATE TABLE meal_plan_entries + GRANTs + RLS (owner only)
  - UNIQUE (user_id, plan_date, meal_slot, position) to keep slots ordered

Server fns (createServerFn + requireSupabaseAuth):
  src/lib/collections.functions.ts  — list/create/rename/delete, add/remove items
  src/lib/meal-plan.functions.ts    — list week, upsert slot, remove slot, shopping-list aggregate

UI:
  src/routes/_authenticated/planner.tsx
  src/routes/c.$slug.tsx              (public collection page; SSR)
  src/components/fridge/CollectionsPanel.tsx
  src/components/planner/WeekGrid.tsx
  src/components/planner/ShoppingList.tsx
  Extend RecipeCard with nutrition strip + "Add to collection" menu
  Extend SavedDrawer with Collections tab + Planner CTA

Recipes generator:
  - Add sugarG, fiberG to schema + prompt
  - Remove the `includeNutrition` flag and always emit nutrition
  - Update PDF + card UI to render the two new fields

Scope guardrails:
  - No marketplace, payments, or community changes
  - No full rebrand or new colour system — keep existing turmeric/paprika/cardamom palette
  - Drag-and-drop via native HTML5 DnD (no new heavy lib)
```

Out of scope for this pass: pantry tracker (would need expiry logic + UI), social features, paid-plan changes, dark mode.
