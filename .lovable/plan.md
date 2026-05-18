## Comments on community receipes

Add a comments section to each community receipe page where signed-in users can post comments/questions, and the original poster (OP) can toggle comments on/off for their receipe.

### Database

New migration:

1. Add `comments_enabled boolean NOT NULL DEFAULT true` to `community_recipes`.
2. Create `community_recipe_comments`:
   - `id uuid pk default gen_random_uuid()`
   - `recipe_id uuid not null` (matches existing pattern — no FK, like `community_recipe_likes`)
   - `user_id uuid not null`
   - `body text not null` (length-checked in app, 1–1000 chars)
   - `created_at timestamptz not null default now()`
   - `updated_at timestamptz not null default now()`
   - index on `(recipe_id, created_at desc)`
3. Enable RLS with policies:
   - **SELECT**: public read (`true`) — comments visible to everyone, same as receipes.
   - **INSERT**: `auth.uid() = user_id AND email_verified AND recipe allows comments` — enforced via a `SECURITY DEFINER` helper `public.can_comment_on_recipe(_recipe_id uuid)` that checks `community_recipes.comments_enabled = true` (avoids cross-table recursion in the policy).
   - **UPDATE**: only own comment (`auth.uid() = user_id`).
   - **DELETE**: own comment, OR the receipe owner can delete any comment on their receipe (via another `SECURITY DEFINER` helper `public.is_recipe_owner(_recipe_id uuid)`).
4. `updated_at` trigger using the existing `public.update_updated_at_column()`.

"Verified user" = `auth.users.email_confirmed_at IS NOT NULL`, checked in the server function (not RLS) so we can return a clear error.

### Server functions (`src/lib/community.functions.ts`)

Add:
- `listComments({ recipe_id })` — public; returns `[{ id, body, created_at, user_id, author_name, is_owner }]`, joined to `profiles.display_name`.
- `addComment({ recipe_id, body })` — `requireSupabaseAuth`; validates body length, rejects if user's email is not confirmed, rejects if `comments_enabled = false`.
- `deleteComment({ id })` — `requireSupabaseAuth`; lets the comment author or the receipe owner delete.
- `setCommentsEnabled({ recipe_id, enabled })` — `requireSupabaseAuth`; verifies caller is the receipe owner, updates `community_recipes.comments_enabled`.

All inputs validated with Zod (`body` trimmed, 1–1000 chars).

### UI (`src/routes/community.$recipeId.tsx`)

Below the voting row, add a "Comments" section:
- Header: "Comments (N)". If caller is the OP, show a toggle "Comments: On / Off" that calls `setCommentsEnabled`.
- If `comments_enabled = false`: show "Comments are turned off by the author." Hide the input but keep existing comments visible (read-only).
- Comment composer:
  - Signed-out: "Sign in to comment" link.
  - Signed-in but email not verified: "Verify your email to comment." with a "Resend verification" button calling `supabase.auth.resend({ type: 'signup', email })`.
  - Signed-in + verified + comments enabled: textarea (max 1000) + "Post" button.
- Comment list: avatar/initial, author name, relative time, body. Each comment shows a "Delete" button when the viewer is the comment author or the OP.

Optimistic add/delete with rollback on error. Toasts via `sonner`.

### Out of scope

- Threaded replies / @-mentions.
- Edit comment UI (DB allows it; not surfacing this turn).
- Realtime updates.
- Notifications to the OP.
