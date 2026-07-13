# Roadmap: FridgeCuisine → Top App for Chefs & Home Cooks

> **Progress log**
> - ✅ **Phase 1.1** Chef storefront pages — `/chef/:username` public route with header, stats, paid recipes, community recipes; linked from `/chefs` directory and `/sell`.
> - ✅ **Phase 1.2** Creator revenue dashboard — `/earnings` with time-range totals, sales chart, top recipes, recent sales; linked from `/account` and `/sell`.
> - ⏭️ **Next** — pick from Phase 1: tips (item 3), sellable cookbook bundles (item 4), chef subscription tier (item 5), promo codes (item 7), or Creator Pro plan (item 6).

You picked **Creator monetization + AI cooking assistant + Chef pro tools**, a **balanced two-sided** focus, and a **hybrid** business model (take-rate + creator sub + buyer sub). Here's what you already have, what to add, what to change, and what to remove — grouped into 4 build phases you can approve one at a time.

## Where you are today (audit)

**Solid foundation already shipped**
- Auth, RLS, profiles, roles, admin panel, abuse tracking, quotas, usage analytics dashboard
- Community recipes with likes, comments, saved recipes, collections, cookbooks
- Paid recipes + Stripe marketplace onboarding for chefs (`sell.tsx`, `paid-recipes.functions.ts`, `marketplace.functions.ts`)
- Shop pages, checkout flow, purchase records
- AI: recipe generation, dish images, ingredient swap, dish helper, fridge vision
- Subscriptions table with sandbox/live environments
- Recipe sharing, sitemap, SEO-friendly public routes

**Gaps holding it back from being the top app**
- Landing page is a 1414-line monolith — hard to iterate, unclear positioning between "AI recipe generator" and "creator marketplace"
- No **cook mode** (step-by-step, hands-free, timers) — the moment of truth for a cooking app
- No **follows / activity feed / notifications** — no reason to come back daily
- No **creator storefront / revenue dashboard** — chefs can't see what they've earned or drive traffic to their own page
- No **meal planner + auto shopping list** — biggest utility gap vs. Whisk, Paprika, Mealime
- No **nutrition, servings scaling, unit conversion** — table stakes
- No **video / short-form** or **live cook-alongs** — where food discovery actually happens in 2026
- Paid recipes are one-off SKUs — no bundles, no chef subscription, no tips
- Free tier banner + usage meter are user-hostile noise (already hidden from non-admins — good)

---

## Phase 1 — Creator monetization that actually earns (2 weeks)

Goal: a chef can open a storefront, sell recipes, receive tips, take subscribers, and see their revenue — end-to-end.

1. **Chef storefront pages** (`/@username`) — public page with avatar, bio, stats (followers, recipes, rating), pinned recipes, paid recipes, cookbooks, tip button, follow button. This is what chefs share on Instagram/TikTok.
2. **Creator revenue dashboard** (`/_authenticated/earnings`) — gross sales, take-rate, net payout, top-selling recipes, buyer country breakdown, month-over-month chart, upcoming Stripe payout date. Uses existing `recipe_purchases` + Stripe balance API.
3. **Tips / "buy me a coffee"** — one-tap tip on any recipe or storefront, $1/$3/$5/custom. Stripe one-time checkout, 90/10 split. Big psychological unlock — most cooks won't buy a $9 recipe but will drop a tip.
4. **Recipe bundles / cookbooks for sale** — you already have `cookbooks` and `cookbook_recipes`; add a "publish for sale" flow with cover, description, price, and bundle discount vs buying recipes individually.
5. **Chef subscription tier** — buyers can subscribe to a chef for $X/month for all their paid recipes + subscriber-only drops. New table `chef_subscriptions`. Recurring Stripe.
6. **Platform take-rate + creator pro plan** — implements your hybrid model: 15% default take-rate; chefs on **Creator Pro** ($15/mo) drop to 8% + get storefront analytics, custom slug, promo codes, priority in search.
7. **Promo codes & referral links** — chef can generate `?ref=chefname` codes that discount a recipe/bundle and attribute the sale.

## Phase 2 — AI cooking assistant that beats every competitor (2 weeks)

Goal: turn the AI from "recipe generator" into an in-kitchen copilot people open every night.

1. **Cook Mode** — dedicated `/cook/$recipeId` full-screen route: giant step text, wake-lock so the phone stays on, voice next/back ("Hey, next step"), built-in per-step timers that ring, ingredient checklist, servings scaler that recalculates all quantities live.
2. **Meal planner + auto shopping list** — weekly calendar (`meal_plan_entries` table already exists — build the UI), drag recipes into days, one-tap "generate shopping list" that dedupes ingredients across recipes and converts units. Export to Reminders / Apple Notes / share.
3. **Fridge → week plan** — extend existing fridge vision: instead of one recipe, output a 3-day plan that uses the same base ingredients efficiently, minimizing waste.
4. **Nutrition + dietary flags per recipe** — auto-computed via AI at save time (cached in `ai_result_cache`), showing calories, macros, allergens, and diet badges (keto, halal, gluten-free, etc.). Filterable in search.
5. **Substitutions upgrade** — you already have `ingredient-swap`; add pantry-aware suggestions ("you already have X, swap Y") and dietary-aware swaps ("dairy-free version of this recipe").
6. **AI recipe coach chat** — a persistent chat drawer on the recipe page: "Can I halve this?", "What if I don't have buttermilk?", "Is this spicy?". Uses recipe context, streams responses.
7. **Voice-to-recipe intake** — chefs dictate a recipe while cooking; AI structures it into ingredients + steps for review.

## Phase 3 — Discovery, community & retention (2 weeks)

Goal: give people a reason to open the app every day, and make sold recipes actually discoverable.

1. **Follows + activity feed** — follow chefs, see new drops in a chronological feed. `follows` table, feed query, notification badge.
2. **Notifications** — email + in-app for: new follower, someone bought your recipe, someone commented, chef you follow published, tipped you. Uses existing email infra.
3. **Star ratings + review photos** on recipes (community and paid). Sort/search by rating; boosts trust for paid recipes.
4. **Weekly leaderboard + "trending"** — most cooked, top new chef this week, staff picks. Homepage becomes editorial, not a marketing wall.
5. **Search + filters** — cuisine, diet, time, difficulty, price (free/paid), chef. Currently missing.
6. **Remix / "make it your own"** — one-tap fork of a public recipe into your own draft, credit preserved. Chef-friendly and viral.
7. **Short-form video on recipes** — allow a 60-sec vertical clip per recipe; render a TikTok-style vertical feed at `/feed` for discovery.

## Phase 4 — Chef pro tools & platform polish (1-2 weeks)

Goal: pro-tier chefs feel this is their business platform, not a hobby app.

1. **Verified chef badge** — application flow, admin review, badge on profile and cards.
2. **Storefront analytics** (Creator Pro) — views, add-to-cart, buy conversion, avg order value, top referring recipes, geo of buyers.
3. **Ticketed live cook-alongs** — schedule an event, sell tickets, join a video room at the time. MVP: paid RSVP + calendar link + link to Zoom/Meet the chef provides. Full video room is a v2.
4. **Custom domain / vanity URL** for Pro chefs (`cook.chefname.com` → their storefront).
5. **Bulk import** for chefs — paste a URL or CSV, AI structures it into recipes.
6. **Homepage rebuild** — split the 1414-line `index.tsx` into sections; lead with 2 clear paths: "Cook tonight" (buyer) and "Sell your recipes" (creator). Kill AI-generator-first framing; make marketplace equal weight.
7. **Delete / simplify** — retire the standalone `chefs.tsx` page (folded into feed + storefronts), fold `shop.index.tsx` into `/discover` with unified search, remove the free-tier banner file entirely (already gated to admins), audit `admin.quota.tsx` for overlap with `admin.usage.tsx`.

---

## Cross-cutting: business model wiring

- One `platform_fees` config row: default take-rate 15%, Pro rate 8%, tip take-rate 10%.
- New Stripe products: `creator_pro_monthly` ($15/mo), `creator_pro_yearly` ($144/yr), `home_cook_plus_monthly` ($5/mo unlimited AI + ad-free), plus per-chef subscription prices created on demand.
- All splits handled by Stripe Connect (already scaffolded via `marketplace.functions.ts`).
- Buyer sub `home_cook_plus` also gets a monthly credit toward paid recipes to seed the marketplace.

## Technical details (per phase)

- Phase 1: new tables `tips`, `chef_subscriptions`, `promo_codes`, `sales_events`; new server fns in `earnings.functions.ts`, `tips.functions.ts`; extend Stripe webhook to record tip events.
- Phase 2: new route `_authenticated/cook.$recipeId.tsx`, new module `src/lib/cook-mode/*`, extend `ai_result_cache` for nutrition, new server fn `computeNutrition`; use Wake Lock API + Web Speech API; existing `meal_plan_entries` table just needs UI + `shoppingListFromPlan` server fn.
- Phase 3: new tables `follows`, `notifications`, `recipe_ratings`; realtime channel for notifications; add tsvector search index on `community_recipes` and `paid_recipes`.
- Phase 4: `verified` column + `chef_applications` table; analytics query pulling from `recipe_purchases` + a new `storefront_views` table; live-event table + Stripe payment intents.

## What each phase gets you

- **After Phase 1** — chefs can actually earn. Story becomes "sell your kitchen".
- **After Phase 2** — buyers open the app while cooking, not just browsing. Sticky utility.
- **After Phase 3** — organic growth loop (follows, notifications, leaderboards).
- **After Phase 4** — pro tier justifies its price; marketplace has trust signals.

## Not doing (out of scope for this plan)

- Native mobile apps (PWA + Cook Mode covers most of the value first)
- Grocery delivery integrations (Instacart, Walmart) — layer in after Phase 3 once shopping list is proven
- Restaurant/POS integration — different product

Reply "implement phase 1" (or any subset — e.g. "phase 1 items 1–3 only") and I'll build it in build mode.
