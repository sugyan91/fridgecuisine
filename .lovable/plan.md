## What's happening

**1. "Weak password" message**
That message comes from Supabase Auth itself — your project has "leaked password protection" turned on, so it checks every password against the HaveIBeenPwned database and rejects pwned ones with a 422 (visible in your auth logs as `Pwned passwords cache`). It's a server-side setting, not something in our code.

**2. Auto‑logout (the real bug)**
In `src/routes/__root.tsx` there's a "Remember me" enforcement block: on every page load, if `localStorage.fc-auth-remember` is not `"1"` AND `sessionStorage.fc-auth-session` is not `"1"`, it calls `supabase.auth.signOut()`. Those flags are only set inside our email/password login form — so anyone who signs in with **Google** (or via the email confirmation link, or a password‑reset flow) has neither flag and gets force‑signed‑out on the next reload. Your logs confirm: Google login at 01:51:55Z immediately followed by a logout at 01:51:58Z.

**3. Admin panel**
Today it only supports "search one user → act on them." You want full browse + delete lists for users, recipes, comments, etc.

## The plan

### A. Stop the "weak password" rejection
Call the Supabase auth config tool to set `password_hibp_enabled: false`. No code change. Users can then pick any password they want; the "Suggested: 6+ characters…" hint already on the form stays as guidance only.

### B. Fix the auto‑logout
In `src/routes/__root.tsx`, change the enforcement so that the *absence* of both flags is treated as "this session was created outside our form (Google, magic link, reset) — assume remembered" instead of "sign them out." Concretely:
- Only sign out when `sessionStorage.fc-auth-session === "1"` AND that marker is missing on a fresh tab (the original intent). 
- If neither flag exists, do nothing — let the session persist.

Result: Google sign‑ins persist; "Remember me = off" still works for email/password sign‑ins because we set the session marker at that point.

### C. Rebuild the Admin panel as a real dashboard
Replace the current single‑user search modal with a tabbed admin dashboard listing everything, each row with a Delete button. Tabs:

1. **Users** — list email, username, display name, signup date, today's usage, premium status. Actions per row: Reset usage · Send password reset · Grant/Revoke premium · Delete user.
2. **Community recipes** — list title, author username, city/country, created date. Actions: Open · Delete.
3. **Comments** — list body preview, author, recipe title, date. Action: Delete.
4. **Saved recipes** (optional, read‑only count per user) — skip if you don't want it.

A search box at the top of each tab filters that tab's list (client‑side over the loaded page). Pagination: 50 per page with Prev/Next.

The existing per‑user search modal stays available as a "Quick find user" button at the top — but the default view is the full list.

### Technical details (for the build step)

- **Auth config:** `supabase--configure_auth` with `password_hibp_enabled: false` (keep `auto_confirm_email`, `disable_signup`, `external_anonymous_users_enabled` at their current values — false).
- **Remember‑me fix in `src/routes/__root.tsx`:** change the condition from `if (!remembered && !sessionMarker)` to `if (!remembered && sessionMarker === false && localStorage.getItem("fc-auth-explicit-ephemeral") === "1")`. Simpler: set a third flag `fc-auth-explicit-ephemeral` in `login.tsx` when the user unchecks "Remember me", and only sign out when *that* flag is set but the session marker is gone. Remove the original ambiguous check.
- **New server functions in `src/lib/admin.functions.ts`** (all behind existing `requireSupabaseAuth` + admin role check):
  - `adminListUsers({ page, pageSize, search? })` — uses `supabaseAdmin.auth.admin.listUsers()` joined with `profiles`, `user_roles`, and a usage‑today count.
  - `adminListCommunityRecipes({ page, pageSize, search? })` — selects from `community_recipes` joined with `profiles` for author username.
  - `adminListComments({ page, pageSize, search? })` — selects from `community_recipe_comments` joined with `profiles` and `community_recipes`.
  - `adminDeleteCommunityRecipe({ recipe_id })` and `adminDeleteComment({ comment_id })` — both already allowed by existing RLS admin policies; just wrap as serverFns using `supabaseAdmin`.
- **`src/components/admin/AdminPanel.tsx`** rewritten as a tabbed dashboard (Users / Recipes / Comments). Each tab: search input, paginated table, row‑level Delete confirm. Existing "Find one user" panel becomes the Users tab's row expansion (click a row → show the current per‑user action buttons inline).

No database migration is needed — admin RLS policies already exist for all three tables.

### Out of scope
- Bulk delete / multi‑select (can add later if you want).
- Editing recipes/comments from admin (only delete).
- Auditing/logging of admin actions.

Reply "go" to implement, or tell me what to change (e.g. drop the Comments tab, add bulk delete, etc.).