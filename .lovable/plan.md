## Goal

Make the app feel lived-in by seeding realistic-looking community activity: cooks with avatars and usernames, recipes from many cities/cuisines, social proof (likes + comments), and a handful of chefs selling premium recipes.

## What gets seeded

- **~90 fake user profiles** — diverse display names, usernames, avatar URLs (using DiceBear / pravatar deterministic URLs so they always render), spread across realistic cities/countries.
- **~120 community recipes** — 1–3 per cook, drawn from a curated list of real dishes (e.g., Pad Krapow, Shakshuka, Bibimbap, Cacio e Pepe, Jollof Rice, Khachapuri, Pho Bo, Birria Tacos, Butter Chicken, Ramen, Arepas, Moussaka, etc.) with:
  - Real city/country/cuisine
  - 6–10 ingredients each (using the same emoji-mapped names your `ingredient-icons.ts` already knows)
  - 4–8 step methods + brief history blurb
  - Food cover image (stable Unsplash food photo URLs by dish)
  - 1–3 dietary tags pulled from your existing taxonomy
- **~600 likes** — distributed so popular recipes have 15–40 upvotes and long-tail recipes have a few; gives the leaderboard/feed visible heat.
- **~250 comments** — short, natural-sounding messages ("Made this for dinner — family loved it", "Subbed coriander for parsley, still great", etc.) by random other cooks.
- **~12 chef profiles + 18 paid recipes** — a subset of the cooks become "chefs" with bios, country, and a paid recipe priced $3–$9 (cents). Marked `is_published = true` so they appear in `/shop`. No real Stripe accounts — `payouts_enabled` stays false, which is fine for browsing.

## Technical notes

- `profiles.user_id`, `community_recipes.user_id`, `chef_profiles.user_id`, `paid_recipes.chef_user_id` are plain UUID columns with no FK to `auth.users`, so seeded UUIDs are safe. These users won't be able to log in (they're display-only), which is exactly what we want.
- Inserts go through the `supabase--insert` tool in a few batched statements (profiles → recipes → likes/comments → chef_profiles → paid_recipes).
- Images: use `https://images.unsplash.com/photo-...` URLs hand-picked per dish + `https://i.pravatar.cc/150?u=<username>` for avatars — both are deterministic and load without API calls.
- Existing seed remains untouched; this is purely additive. If you ever want to wipe it, every seeded row will have a tag we can filter on — I'll mark all seeded profiles with usernames in a known list so a cleanup query is one line.
- No schema changes, no RLS changes, no code changes. Read paths (`/community`, `/shop`, recipe detail) already render anything in these tables.

## Out of scope

- Real auth users / login for fake accounts
- Real Stripe onboarding for fake chefs
- AI-generated images (using curated Unsplash URLs to stay fast and free)

Approve and I'll run the inserts.