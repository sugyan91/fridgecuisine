# Chef Marketplace — Sell Recipes & Cookbooks

Let any logged-in user become a paid chef. They upload recipes (single, priced) or group recipes into cookbooks (bundle, priced). Buyers pay through Stripe; Stripe Connect routes 70% to the chef's bank, 30% to you, automatically — after Stripe's own processing fees come off both sides.

## Heads-up before we start

The current Lovable payments setup uses a managed gateway suited to a single seller account (your $5.99 Premium plan). True marketplace splits require **Stripe Connect**, which needs a real Stripe platform account with Connect enabled. We have two options:

- **A. Switch to bring-your-own-key Stripe** for the marketplace (you provide a platform secret key with Connect enabled). Keeps the existing $5.99 Premium plan working on the managed gateway is awkward — we'd migrate Premium to the same key.
- **B. Keep managed Stripe for Premium, add a second Stripe key just for marketplace charges with Connect.** Cleaner separation, more keys to manage.

I'll proceed with **option A** unless you say otherwise. You'll need:
1. A Stripe account at platform.stripe.com with **Connect → Express** enabled.
2. Your Stripe **Secret Key** (live or test) — I'll prompt you to paste it securely.
3. A Connect webhook signing secret.

## Pricing & money flow

- Chef sets any price ≥ $1 (no cap). Currency: USD only for v1.
- Buyer pays `chef_price` via Stripe Checkout.
- Stripe deducts its processing fee (~2.9% + $0.30).
- The remaining net is split: **30% to your platform account, 70% transferred to chef's connected account** using `application_fee_amount` on a destination charge.
- Chef payouts are automatic to their bank on Stripe's normal schedule.

## Database (new tables)

- `chef_profiles` — `user_id`, `bio`, `country`, `avatar_url`, `stripe_account_id`, `payouts_enabled`, `charges_enabled`, `onboarding_completed_at`.
- `paid_recipes` — `id`, `chef_user_id`, `title`, `description`, `cuisine`, `country`, `dietary[]`, `cover_image_url`, `ingredients` jsonb, `steps` jsonb, `tips` jsonb, `prep_min`, `cook_min`, `serves`, `price_cents`, `is_published`, `created_at`.
- `cookbooks` — `id`, `chef_user_id`, `title`, `description`, `cover_image_url`, `price_cents`, `is_published`.
- `cookbook_recipes` — `cookbook_id`, `paid_recipe_id`, `position` (join table).
- `recipe_purchases` — `id`, `buyer_user_id`, `paid_recipe_id?`, `cookbook_id?`, `chef_user_id`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `gross_cents`, `platform_fee_cents`, `chef_net_cents`, `status` (`pending`/`paid`/`refunded`), `purchased_at`.
- `chef_payout_log` — read-only Stripe transfer mirror for the chef dashboard.

RLS: chef can CRUD only own profile/recipes/cookbooks; buyers read published rows; purchases readable by buyer and seller; admin reads all.

Add `has_purchased_recipe(_user uuid, _recipe uuid)` SECURITY DEFINER helper so the recipe-view route can gate full steps behind a paid unlock.

## Stripe Connect wiring

Server functions (`src/lib/marketplace.functions.ts`):
- `startChefOnboarding` → `stripe.accounts.create({ type:'express', capabilities:{ transfers:{requested:true}, card_payments:{requested:true} } })` then `accountLinks.create` → returns onboarding URL; insert `chef_profiles` row with `stripe_account_id`.
- `refreshChefAccountStatus` → `accounts.retrieve`, update `payouts_enabled`/`charges_enabled`.
- `createPurchaseCheckout({ kind:'recipe'|'cookbook', id })` → `stripe.checkout.sessions.create` with `payment_intent_data.application_fee_amount = round(price * 0.30)` and `payment_intent_data.transfer_data.destination = chef.stripe_account_id`; success redirects to `/library/:purchaseId`.

Public webhook route `src/routes/api/public/stripe-connect-webhook.ts` handles `checkout.session.completed`, `account.updated`, `charge.refunded` — writes to `recipe_purchases` and `chef_profiles`.

## App surface

New routes:
- `/chefs` — directory of chef profiles, country filter, search.
- `/chefs/:username` — chef page with bio, paid recipes, cookbooks.
- `/sell` — chef dashboard (overview, payouts so far, "Continue Stripe setup" if not done).
- `/sell/recipes/new` & `/sell/recipes/:id/edit` — recipe form (reuses the create-recipe form from `/community/new`, adds price + cover upload).
- `/sell/cookbooks/new` & `/sell/cookbooks/:id/edit` — cookbook builder (pick from your own recipes).
- `/library` — buyer's purchased recipes/cookbooks.
- `/recipes/:id` — public preview (title, ingredients-as-teaser, locked steps with "Unlock $X" button). If purchased → full recipe.
- `/cookbooks/:id` — public preview + unlock.

Landing page additions (under your new "How it works" section):
- A **"Are you a chef? Earn from your recipes"** banner — gradient card, photo, CTA → `/sell`. Copy emphasises "Keep 70%, payouts straight to your bank, set your own price."
- New "Featured chef recipes" carousel pulling top-selling paid recipes.

## UX details

- Chef onboarding gate: `/sell/recipes/new` blocks publishing until `payouts_enabled && charges_enabled`. Shows a banner "Finish Stripe setup to start selling."
- Image uploads → reuse the existing `recipe-photos` storage bucket.
- Refund policy line shown at checkout: "Recipes are non-refundable once unlocked." (Required by Stripe.)
- Admin panel gets a new "Marketplace" tab: total GMV, your 30% earnings, top chefs, recent purchases, refund button.

## Phasing (so you see value fast)

1. **DB + chef profile + onboarding URL flow.** Test on Stripe test mode.
2. **Paid recipe CRUD + public preview/locked detail page.**
3. **Checkout + webhook + library.**
4. **Cookbooks (bundle of recipes).**
5. **Landing-page banner + chef directory + featured carousel.**
6. **Admin dashboard for marketplace.**

## Things I need from you

1. Confirm option A (one Stripe key for everything) vs B (separate key for marketplace).
2. Confirm USD-only for v1, or also EUR/GBP.
3. Confirm 30% platform fee is computed on **gross** price (so you absorb part of Stripe's fee) vs on **net after Stripe fee** (chef absorbs more). Recommendation: on **gross** — simpler, more standard.
4. Once approved, I'll prompt you for `STRIPE_PLATFORM_SECRET_KEY` and `STRIPE_CONNECT_WEBHOOK_SECRET` via the secure secrets prompt.
