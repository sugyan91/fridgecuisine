## 1. Community page CTA polish

- Underline "Sign in" in the paprika pill and change the text to "Sign in to share your own receipe" (keeping the user's spelling).

## 2. Browse-by-default on `/community`

The page already loads the latest recipes on mount, but the big "Search dish · City · Search" form at the top makes it look like browsing requires a search. Fixes:

- Add a clear "Latest from the community" heading right above the grid so users see this is the default feed.
- Move the search/filter row into a collapsible "Filter recipes" panel (closed by default) so the feed is the first thing visible.
- Keep the empty-state copy ("No recipes yet — be the first to share!") for when the DB has nothing yet (currently the case).

## 3. Expand the share form

Add to `src/routes/_authenticated/community.new.tsx` (form already has food name / city / country / cuisine / dietary / short description):

- New big textarea: "History & background" — story behind the dish, origin, family memory, etc. Stored on a new `history` column.
- Relabel existing "Short description" → "Tagline (one sentence)" so the two fields don't feel duplicated.

## 4. Thumbs up / thumbs down voting (replaces single heart like)

- Anyone can see up/down counts on a recipe.
- Only signed-in users can vote; signed-out users get a "Sign in to vote" toast.
- A user has one vote per recipe; clicking the same arrow again removes it; clicking the opposite arrow switches it.

UI lives on `/community/$recipeId` and as small "▲ N · ▼ N" badges on each card in the grid and the homepage strip.

## Database changes (single migration)

```sql
-- richer recipe story
ALTER TABLE public.community_recipes
  ADD COLUMN IF NOT EXISTS history text;

-- turn likes into votes
ALTER TABLE public.community_recipe_likes
  ADD COLUMN IF NOT EXISTS vote_type text NOT NULL DEFAULT 'up'
  CHECK (vote_type IN ('up', 'down'));

-- allow updating an existing row (flipping vote)
CREATE POLICY "Users update own vote"
ON public.community_recipe_likes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

Existing rows become `up` votes (correct — they were likes). RLS already lets each user insert/delete only their own row; we add an UPDATE policy so flipping up→down doesn't require delete+insert.

## Server function changes (`src/lib/community.functions.ts`)

- `recipeInput` schema: add `history: z.string().trim().max(4000).optional().default("")`.
- `listCommunityRecipes`: return `up_count`, `down_count` per recipe (group-by on `community_recipe_likes`).
- `getCommunityRecipe`: return `up_count`, `down_count`, and `user_vote` ('up' | 'down' | null) by reading the caller's session via `requireSupabaseAuth`-less optional auth — simplest path: split into a public `getCommunityRecipe` (counts only) + an auth-gated `getMyVote({recipe_id})` the page calls when signed in.
- Replace `toggleRecipeLike` with `setRecipeVote({recipe_id, vote: 'up' | 'down' | null})`:
  - `null` → delete row.
  - existing row → update `vote_type`.
  - no row → insert with `vote_type`.

## Frontend wiring

- `community.$recipeId.tsx`: swap the single heart button for two pill buttons (▲ up / ▼ down) showing counts; signed-out clicks toast "Sign in to vote".
- `community.tsx`: card footer shows "▲ N · ▼ N" instead of "♥ N".
- `CommunityStrip.tsx`: same swap on the homepage strip.
- `community.$recipeId.tsx`: render the new "History" section between the description and the ingredients list when present.

## Files touched

- `supabase/migrations/<new>.sql` — schema + RLS update.
- `src/lib/community.functions.ts` — schema, list/get/vote functions.
- `src/routes/community.tsx` — underlined "Sign in to share your own receipe" CTA, latest-feed heading, collapsible search.
- `src/routes/_authenticated/community.new.tsx` — history textarea, relabel tagline.
- `src/routes/community.$recipeId.tsx` — thumbs up/down + history section.
- `src/components/fridge/CommunityStrip.tsx` — vote badges.

No new secrets or buckets needed.
