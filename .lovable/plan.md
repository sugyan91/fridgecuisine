## Two changes

### 1. Remove date from comments

In `src/routes/community.$receipeId.tsx` (line 357–359), delete the `<span>` that renders `new Date(c.created_at).toLocaleDateString()`. Comments will just show the author name (and "Author" badge) on the left.

No backend change — the timestamp stays in the database, we simply don't display it.

### 2. Add realistic likes and dislikes to community recipes

The community recipe pool is 125 recipes with 92 fake user accounts. Today the seed gave each recipe only 1–5 upvotes and zero downvotes, which looks thin.

I'll insert into `community_recipe_likes` using the existing 92 fake users so that, for every published community recipe:

- **Upvotes ("likes"):** randomized between **18 and 95** per recipe, varied so popular dishes feel more loved and niche dishes still get healthy engagement.
- **Downvotes ("dislikes"):** **0 to 4** per recipe, with most recipes getting 0–1 and only a few hitting 3–4 — matching how real food communities look (overwhelmingly positive, occasional critic).
- Each fake user only votes once per recipe (primary key is `recipe_id + user_id`), and a user can't both upvote and downvote the same recipe.
- Existing votes are preserved via `ON CONFLICT DO NOTHING`.

This runs as a one-time data insert; no schema or RLS changes. The `up_count` / `down_count` derived counters on the recipe cards will pick up the new totals automatically.

## Out of scope
- No new tables, columns, or policies.
- No changes to how voting works for real signed-in users.
