Saving (favorites) is already shipped — DB table, server functions, ★ button on every recipe card, drawer, and signup-prompt modal are wired. Only **Share** is net-new.

## What gets built

### 1. DB — `public.shared_recipes` (new migration)
Public, slug-addressable snapshots of a recipe. Anyone with the link can view; only the creator can write.

Columns: `id uuid pk`, `slug text unique`, `created_by uuid null`, `title text`, `cuisine text null`, `recipe jsonb` (same shape as `saved_recipes.recipe`), `view_count int default 0`, `created_at timestamptz default now()`.

Grants + RLS:
- `GRANT SELECT ON public.shared_recipes TO anon, authenticated` (public read by slug)
- `GRANT INSERT ON public.shared_recipes TO authenticated`
- `GRANT ALL ON public.shared_recipes TO service_role`
- Policies: public SELECT (`USING true`); INSERT only when `auth.uid() = created_by`.

Slug: short random base36 (8 chars), generated server-side, retry on collision.

### 2. Server functions — `src/lib/shared-receipes.functions.ts`
- `createSharedReceipe` (auth required): inputValidator with the same `receipeSchema` from saved-receipes, inserts a row, returns `{ slug }`.
- `getSharedReceipe` (public, no middleware, uses `supabaseAdmin` scoped by slug): returns the row by slug or throws not-found. Also increments `view_count`.

### 3. Public share route — `src/routes/shared.$slug.tsx`
- `loader` calls `getSharedReceipe({ data: { slug } })` via `ensureQueryData`.
- `head()` builds dynamic meta from the loaded recipe: title = recipe title + " — FridgeCuisine", description from blurb (truncated), og:title / og:description / twitter:card.
- Renders the recipe (reuse the open-state layout from `ReceipeCard` — extract a small `<SharedReceipeView>` component, or render inline) with a "Cook this in your kitchen" CTA linking to `/`.
- `errorComponent` + `notFoundComponent` for bad/expired slugs.

### 4. Reusable `<ShareButton>` component — `src/components/fridge/ShareButton.tsx`
Props: `{ receipe: SavedReceipeData; variant?: "icon" | "full" }`.

Behavior:
1. On click, if user is signed in → call `createSharedReceipe`, build `url = ${origin}/shared/${slug}`.
2. Build a text snippet: title, cuisine, ingredients (used+missing), numbered steps. Trim to a reasonable length.
3. If `navigator.share` exists (mobile) → `navigator.share({ title, text: snippet, url })`.
4. Otherwise → write `text + "\n\n" + url` to clipboard via `navigator.clipboard.writeText`, toast "Link copied!".
5. If user is NOT signed in → skip the DB write, copy text snippet only, toast "Recipe copied — sign in to share a link".

Loading state on the button while the server fn runs.

### 5. Wire ShareButton in
- `src/components/fridge/ReceipeCard.tsx` — add next to the existing Save button in both the collapsed view (small icon button) and the open view (full button below "Save Receipe").
- `src/routes/index.tsx` — add to the hero dish-helper result panel (the `dishResult` block), placed next to/below the "Do you want the receipe as well?" / receipe block. Builds a `SavedReceipeData` shape from `dishResult` (title, cuisine, steps, ingredients, timings).

### 6. Out of scope (call out, don't build)
- Editing/revoking a share link.
- Listing "your shared links" in the saved drawer.
- og:image generation — text-only meta tags for now.

## Technical notes
- Use TanStack server fns only; no Edge Functions.
- `getSharedReceipe` is public, so it uses `supabaseAdmin` and scopes by slug explicitly (no broad anon SELECT exposure beyond what the RLS already allows).
- The `view_count` bump is best-effort (ignore errors).
- `navigator.share` only on https; `window.location.origin` in the browser to construct the URL.

## File changes
- NEW: migration `create shared_recipes table`
- NEW: `src/lib/shared-receipes.functions.ts`
- NEW: `src/routes/shared.$slug.tsx`
- NEW: `src/components/fridge/ShareButton.tsx`
- EDIT: `src/components/fridge/ReceipeCard.tsx` (add share button in both views)
- EDIT: `src/routes/index.tsx` (add share button in dish-helper result panel)