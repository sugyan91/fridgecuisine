
## What I found

The "Peek with AI" crash wasn't isolated. I checked the database directly and confirmed the shape mismatch is systemic:

- `paid_recipes.ingredients` — **18 of 18 rows** store ingredients as `{name, quantity}` objects, not strings.
- `community_recipes.ingredients` and `.steps` — **125 of 125 rows** are objects too, but the community render code already handles both shapes, so that path is safe.
- `paid_recipes.steps` — all strings, safe.
- AI-generated recipes (saved/shared/cook mode/meal plan/pdf) — always strings, safe.

The bug the user hit is only the visible tip. The same object data flows through several other consumers that assume strings and would crash or render `[object Object]`:

**`src/lib/paid-recipes.functions.ts` → `getPaidRecipeFull`** blindly casts `full.ingredients` as `string[]`. Every downstream consumer inherits the bad shape:

**`src/routes/shop.$recipeId.tsx` → `UnlockedView`** (post-purchase and owner view):
- `scaleIngredient(ing, factor, unit)` calls `line.match(QTY_RE)` on the object → **runtime crash** for every buyer and every chef opening their own paid recipe.
- `<IngredientChip line={ing} />` renders `{line}` in JSX → React "Objects are not valid as a React child" crash.
- The "Swap" button posts `{ ingredient: <object> }` to the AI substitutions server fn → server error.
- `addCustomShopping(scaled)` writes objects into the shopping-list localStorage → the `/list` page then crashes.

In other words, any chef viewing their own paid recipe and any buyer after successful checkout currently sees a broken page. This is the same class of bug as the teaser one, just on the unlocked path.

## What to change

Two-layer fix so both current data and future writes are safe:

1. **Normalize at the source** — `getPaidRecipeFull` in `src/lib/paid-recipes.functions.ts` runs the same normalization the teaser fn already uses (`string` | `{ name, quantity | qty | amount }` → `"<qty> <name>"`). This heals every paid-recipe consumer in one place without touching UI code.

2. **Defense in depth** — `scaleIngredient` in `src/lib/units.ts` accepts `unknown`, coerces non-strings via the same helper, and returns a safe string. This protects against any future data path that forgets to normalize (custom shopping list items, imported recipes, MCP callers).

3. **Shared helper** — extract the normalizer used by the teaser into a small util (`src/lib/ingredient-normalize.ts`) and reuse it in both `getPaidRecipeFull` and `scaleIngredient`, so the fix stays consistent.

No schema migration. No changes to community/AI/PDF paths — they're already correct. No UI restructuring.

## Verification after the change

- Reproduce the previous crash: click Peek with AI on a paid recipe → returns hints.
- Open an unlocked paid recipe (owner view) → ingredients render as "2 tbsp olive oil" style strings, Swap button fetches AI substitutions successfully, "Add all to shopping list" pushes strings into `/list`.
- Serving scaler and metric/US toggle continue to work on the same recipe.
- Check `src/routes/_authenticated/list.tsx` still renders after the add.

## Technical notes

- Keep the normalizer client-safe (no server imports); import from both `paid-recipes.functions.ts` handler and `units.ts`.
- Accept keys `name`, `quantity`, `qty`, `amount` (matches the teaser code the user already accepted).
- `scaleIngredient` signature change is `(line: string, ...)` → `(line: unknown, ...)`; call sites already pass strings so no caller edits needed.
- Do not backfill the `paid_recipes` table — normalization at read is idempotent and safer than a destructive rewrite of seed data.
