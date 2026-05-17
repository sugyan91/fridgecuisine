## Plan: Expandable Dietary & Cuisine + Community Recipe Sharing

### 1. FilterPanel UI updates (immediate)
- Expand `DIETARY` list with 4 more items (e.g. Vegan, Gluten-Free, Keto, Dairy-Free, Low-Carb, Pescatarian, Nut-Free, Kosher) and switch grid to **3 columns** (`grid-cols-3`).
- Expand `CUISINES` with ~50 more countries/regions (Vietnamese, Filipino, Indonesian, Malaysian, Burmese, Sri Lankan, Pakistani, Bangladeshi, Afghan, Persian/Iranian, Turkish, Lebanese, Israeli, Moroccan, Egyptian, Ethiopian, Nigerian, Ghanaian, South African, Kenyan, Spanish, Portuguese, Greek, German, Polish, Russian, Ukrainian, Hungarian, Czech, Swedish, Norwegian, Danish, Finnish, Irish, British, Scottish, American Southern, Cajun/Creole, Tex-Mex, Peruvian, Brazilian, Argentinian, Colombian, Venezuelan, Cuban, Jamaican, Hawaiian, Filipino, Mongolian, Tibetan, Bhutanese, Cambodian, Laotian, Singaporean, Taiwanese, Cantonese, Sichuan, Hunan…).

### 2. Logged-in personalization
When a Supabase session exists, show an **"+ Add your own"** input under both Dietary and Cuisine sections. Custom values merge with defaults and persist per-user.

**DB (new migration):**
- `user_preferences` — `user_id` (FK auth.users, unique), `custom_dietary text[]`, `custom_cuisines text[]`. RLS: user can select/insert/update their own row.

Logged-out users see defaults only (no add button, with a subtle "Sign in to customize" hint linking to /login).

### 3. Community recipe sharing (logged-in users)
Brainstorm → chosen approach: **"Community Cookbook"** — users publish recipes tagged by city/cuisine, browse a feed, like & save others'.

**DB tables:**
- `community_recipes` — `id`, `user_id`, `title`, `city`, `country`, `cuisine`, `description`, `ingredients jsonb`, `steps jsonb`, `image_url`, `is_published bool`, `created_at`.
  - RLS: anyone can SELECT where `is_published=true`; owners can SELECT/INSERT/UPDATE/DELETE their own.
- `community_recipe_likes` — `recipe_id`, `user_id` (composite PK). RLS: users manage their own likes; anyone can count.
- `profiles` — `user_id` (unique), `display_name`, `avatar_url`. Auto-created via trigger on signup.

**New routes:**
- `/community` — feed of published recipes, filter by city/cuisine/dietary, search bar, like button.
- `/community/$recipeId` — full recipe view with author, ingredients, steps, likes count.
- `/community/new` (auth-gated under `_authenticated`) — form to publish: title, city, country, cuisine dropdown (reuses expanded list), dietary tags (reuses expanded list), ingredients (reuse IngredientInput), steps (textarea list), optional image upload to Supabase Storage bucket `community-recipes`.
- `/my-recipes` (auth-gated) — list/edit/delete own recipes; toggle publish.

**Server functions (`src/lib/community.functions.ts`):**
- `listCommunityRecipes({ city?, cuisine?, dietary?, search?, limit, offset })` — public, uses `supabaseAdmin` for read.
- `getCommunityRecipe(id)` — public read.
- `createCommunityRecipe(...)` — `requireSupabaseAuth`.
- `updateCommunityRecipe(...)`, `deleteCommunityRecipe(id)` — `requireSupabaseAuth`, owner check via RLS.
- `toggleLike(recipeId)` — `requireSupabaseAuth`.
- `getUserPreferences()` / `upsertUserPreferences({ custom_dietary, custom_cuisines })` — `requireSupabaseAuth`.

**Storage:** create `community-recipes` public bucket with policy: authenticated users can upload to `{user_id}/*`; public read.

### 4. Navigation
Add header links: **Community** (always) and **My Recipes** + **Share Recipe** (when logged in).

### Tech notes
- Auth/login flow already exists.
- Reuse expanded DIETARY/CUISINES constants by moving them to `src/lib/taxonomy.ts` so both `FilterPanel` and community forms import them.
- All new pages get proper `head()` meta for SEO; `/community` is SSR-friendly via a public server fn calling `supabaseAdmin`.

### Open questions
1. **Image uploads on community recipes — required, optional, or skip for v1?**
2. **Comments on recipes** — include now, or just likes for v1?
3. **Moderation** — auto-publish, or require a "report" flag system only?
