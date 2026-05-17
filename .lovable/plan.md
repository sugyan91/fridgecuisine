## What I found

The recipe detail page (`/community/:recipeId`) is **already public in the app code** — no auth middleware, no `_authenticated` guard, and `getCommunityRecipe` uses the admin Supabase client (bypasses RLS). Likewise the `/community` list is public.

The "Sign in" wall you're hitting is the **Lovable preview gate**, not your app's auth. The `id-preview--…lovable.app` URL is only reachable by people signed into your Lovable account because the project isn't published yet. Anyone you share that preview link with is forced through Lovable's login screen before your app even loads.

## Fix

1. **Publish the project.** Once published at `project--b3c5ce0d-…lovable.app` (or your custom domain), anonymous visitors can view `/community` and any `/community/:recipeId` page without signing in. Posting, voting, and "Share recipe" already correctly require sign-in.
2. **No code changes are needed** — I verified:
   - `src/routes/community.tsx` — public list ✅
   - `src/routes/community.$recipeId.tsx` — public detail, vote buttons gated by `authed` state ✅
   - `src/lib/community.functions.ts` — `listCommunityRecipes` and `getCommunityRecipe` have no auth middleware; only create/update/delete/vote do ✅

## Optional polish (only if you want)

- Add a small "Sign in to vote" hint already present on the detail page — already there.
- Add SEO `head()` to `community.$recipeId.tsx` so shared recipe links get proper title/description/og:image (currently inherits root metadata).

Want me to (a) just walk you through publishing, or (b) also add the SEO head block to the recipe page in the same pass?