# Feature ideas for FridgeCuisine

Here's a menu of high-impact ideas grouped by goal. Pick any subset and I'll turn the chosen ones into a proper build plan.

## Make the core "fridge → recipe" loop stickier
- **Pantry / fridge inventory.** Persistent list of what the user has, with expiry dates and "use soon" nudges. Recipe generation seeds from it in one tap instead of retyping ingredients every time.
- **Photo-to-ingredients.** Snap the fridge/receipt, vision model returns an editable ingredient list. Removes the biggest friction in the first-run experience.
- **Dietary & allergy profile.** Store diet (vegan, keto…), allergens, disliked ingredients, kitchen equipment, skill level, household size. Every AI call auto-respects it; no more re-prompting.
- **Smarter recipe output.** Add nutrition estimates, cost estimate, cook-time breakdown, and a "swap ingredient" button that regenerates just one line.

## Turn saved recipes into a real cooking tool
- **Cook mode.** Full-screen step-by-step with wake-lock, per-step timers, voice "next step", and hands-free scroll. This is what turns a recipe app into a kitchen app.
- **Meal planner UI.** The `meal_plan_entries` table already exists — ship the weekly calendar, drag-to-plan, and a **shopping list** auto-generated from the week (aggregated + de-duped by ingredient).
- **Servings scaler + unit toggle** (metric/imperial) applied everywhere.
- **Leftover mode.** "I made X yesterday, what can I do with the rest?" → targeted regeneration.

## Grow the community side
- **Follow chefs + personalized feed.** Currently community is a flat list; a follow graph plus a "For you" ranking (likes, saves, recency) increases return visits.
- **Recipe remixes / forks.** Explicit "remix this" that credits the original, shows a lineage tree. Great for virality.
- **Weekly cook-along challenges** with a themed ingredient; winners get featured on the home page.
- **Rich comments:** photo replies ("I made this"), star ratings, and a "verified cooked" badge when the user marks a step complete in cook mode.

## Help chefs earn more (revenue lever)
- **Bundles & discounts** on cookbooks, launch pricing, coupon codes.
- **Subscribe to a chef** (recurring tip / patronage tier) on top of one-off tips and paid recipes.
- **Chef analytics upgrade.** Funnel: storefront views → recipe views → purchases; top referrers; revenue over time; email list export.
- **Storefront customization.** Cover image, featured recipe, social links, custom slug landing.
- **Affiliate/referral links** on ingredients (Amazon Fresh, Instacart) with revenue share.

## Retention & growth
- **Weekly digest email** (already have email infra): "3 recipes for what's in your fridge + top community picks this week."
- **Push / PWA install prompt** + install-to-home-screen coaching; you already have `@capacitor/cli` so a thin mobile shell is close.
- **Public profile pages** with the user's cooked/saved/authored recipes — turns every user into an SEO surface.
- **Shareable recipe cards** (auto-generated OG images with the dish photo, title, chef handle) for Instagram/Pinterest.
- **Onboarding checklist** (set diet, add 3 fridge items, save first recipe, follow a chef) with progress bar.

## Delight & differentiation
- **AI plating suggestions** — after generation, render a photo of the finished dish (image gen) so saved recipes have hero images even without user photos.
- **Voice input** for ingredients ("I have chicken, rice, and lime") — very natural on mobile.
- **Wine / drink pairing** and **side-dish suggestions** as one-click add-ons on any recipe.
- **"Cook with a friend" live session** — two people open the same recipe, synced step + shared chat/timers.
- **Grocery integration** — send the shopping list to Instacart, Amazon Fresh, or a printable PDF.

## Trust, safety, ops
- **Report + moderation queue** for community recipes and comments (surface into the existing admin routes).
- **Recipe versioning** so edits don't invalidate saved copies mid-cook.
- **Rate-limit / abuse dashboards** — you already collect `abuse_events` and `anonymous_ai_usage`; expose trend charts, not just tables.

## My top-3 recommendation
If I had to pick, I'd ship these next, in this order:

1. **Cook mode + meal planner + shopping list** — biggest jump from "novelty" to "daily habit"; the DB is already there.
2. **Pantry inventory + photo-to-ingredients + dietary profile** — makes the AI loop feel personal and 5× faster.
3. **Follow chefs + weekly digest email** — turns one-time visitors into a returning audience and directly feeds chef revenue.

## Next step
Tell me which of these (one, a few, or your own combo) you want to build and I'll come back with a concrete implementation plan for just those.
