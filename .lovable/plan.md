
# FridgeCuisine — Launch Readiness Plan

Goal: take the app from "feature-rich but slightly rough" to "feels like a premium AI cooking product." This plan is organized as (A) audit findings, (B) prioritized recommendations, (C) exactly what I will implement in this pass, (D) what needs backend before it can ship.

---

## A. Audit — what feels unfinished right now

Based on a walk-through of the current codebase (Home, ingredient input, recipe gen, cook mode, cookbook, plan, pantry, preferences, shop, chef, account, mobile nav):

**Visual / UI**
1. Neo-brutalist chip style (rotations, hard shadows, mixed turmeric/paprika/cardamom/saffron) is fun but inconsistent — the same "bold border + shadow" is applied to primary CTAs, secondary chips, nav pills, and destructive actions, so nothing feels primary.
2. Typography hierarchy is flat — `font-display uppercase` used at 5 different sizes across pages with no consistent scale; body text density varies page to page.
3. Mobile bottom nav uses `text-paprika` for active + shadow-less top border — active state is hard to see against warm backgrounds; icons don't animate.
4. Cookbook / Pantry / Preferences / Following are reachable only via a row of 4 chip links jammed in the header — on 393px width they wrap awkwardly.
5. Loading = plain "Loading…" text in most authenticated routes; no skeletons for cook mode, cookbook, plan, analytics, earnings.
6. Empty states are mostly a single grey sentence ("Nothing saved yet…"); no illustration, no primary action.
7. Toasts, dialogs, and inline errors use three different visual languages.
8. No global page transitions or micro-interactions; taps feel static on mobile.

**UX / Flow**
9. First-run has no onboarding — new users land on Home with an empty ingredient box and no explanation of what the app does beyond the hero.
10. Ingredient input has no history / "recently used" and no per-user favorites; suggestions are a static list.
11. Recipe results don't surface *why* a recipe was picked (matches your pantry, fits your diet, under 20 min) — the personalization is invisible.
12. Cook mode is good but has no "I'm done" celebration → save-to-history → rating loop; users drop off silently.
13. Shopping list is separated from Plan; users don't discover it. No "check off as you shop" haptic.
14. Account page mixes settings, billing, danger zone, and links to sub-pages without grouping.
15. Shop / Chef storefront: price, unlock CTA, and "Peek with AI" compete visually; conversion signal is weak.
16. No global search (recipes, chefs, cuisines, ingredients).
17. No notifications center; follow / tips / purchases only surface via email.
18. Accessibility: many icon-only buttons lack `aria-label`; color-only state on nav; focus rings suppressed by `outline-none` in several inputs.

**Product gaps a modern AI cooking app is expected to have**
19. No nutrition panel on generated recipes (calories, macros, allergens flagged).
20. No "cooked it" rating + private notes → no personalization signal beyond skips/dislikes.
21. No expiring-pantry reminders even though pantry table exists.
22. No weekly digest / streaks / "cook 3 this week" retention loop.
23. No offline mode for saved recipes / cook mode (critical on mobile in a kitchen with wet hands).
24. No PWA install prompt / add-to-home-screen coaching.
25. No dark mode.

---

## B. Prioritized recommendations

Legend — Priority: **M** Must / **S** Should / **N** Nice. Complexity: **S** small / **M** medium / **L** large.

**Polish & IA (all frontend)**
- M/S — Unify design tokens: one primary CTA style, one secondary, one destructive; remove ad-hoc rotations from non-decorative buttons.
- M/S — Typographic scale in `styles.css` (display / h1 / h2 / body / caption) and apply across pages.
- M/S — Skeleton loaders for cookbook, plan, cook, analytics, earnings, shop.
- M/S — Rich empty states (icon + one-line + primary action) for cookbook, plan, shopping list, following, pantry.
- M/S — Mobile bottom nav: filled pill active state, subtle spring on tap, safe-area polish, better contrast.
- M/S — Group cookbook/pantry/preferences/following into a single "Kitchen" menu on Account; remove the header chip strip.
- M/S — Consistent toast + inline error component; friendly copy ("We couldn't reach the AI just now — try again").
- S/S — Focus-visible rings restored on all inputs/buttons; `aria-label` on all icon-only buttons.
- S/S — Reduce-motion respect for animations.

**Onboarding & first-run (frontend + tiny state)**
- M/M — 3-step onboarding sheet on first Home visit: pick diet → pick allergies → scan/type first ingredients. Stored in `user_preferences` (already exists) + a `onboarded_at` flag on `profiles`.
- M/S — "Why this recipe" chips on each result card (matches pantry, ≤ your time, fits diet) — pure frontend from existing data.

**Kitchen & retention (needs a little backend)**
- M/M — "Cooked it" rating (1–5 + optional note) after cook mode → feed into `daily_dinner_feedback` positively. Needs new columns `rating`, `note` on `daily_dinner_feedback` or a new `cook_logs` table.
- S/M — Expiring pantry reminders (client-side badge on Pantry tab using existing `pantry_items.expires_at`); email digest is Nice.
- S/L — Weekly streak + "3 cooks this week" — new `cook_streaks` view or aggregation server function.
- N/L — Offline saved recipes + cook mode via service worker cache.
- N/S — Add-to-home-screen coach mark on iOS Safari (frontend only).

**Discovery & social**
- S/M — Global command-palette search (⌘K on desktop, search icon on mobile) over recipes / chefs / cuisines — server function that fans out existing search endpoints.
- S/M — Notifications center (bell in top bar) — needs `notifications` table + server fn.
- N/S — Native share sheet on recipe pages (frontend, `navigator.share`).

**AI depth**
- S/M — Nutrition estimate on generated recipes — extend `recipes.functions.ts` prompt to return optional macros (already gated for cost; expose behind a "Show nutrition" toggle so it stays cheap by default).
- S/S — Prompt suggestions above the ingredient input ("Use up spinach", "20-min dinner", "Kid-friendly").
- N/M — Voice ingredient input (Web Speech API, frontend only).

**Monetization polish**
- S/S — Shop card redesign: single primary "Unlock $X", secondary "Peek", tertiary "Save".
- S/S — Chef storefront: sticky follow + tip CTA on scroll.

---

## C. What I'll implement in this pass (all Must-Have, frontend-only, non-breaking)

Scope chosen so nothing needs a schema change and existing behavior is preserved.

1. **Design tokens & typography**
   - Add a semantic scale + spacing tokens in `src/styles.css` (`--text-display / -h1 / -h2 / -body / -caption`, `--radius-card / -pill`, `--shadow-card / -pop`).
   - Introduce two button variants in a new `src/components/ui/AppButton.tsx` (primary, secondary) + keep neo-brutalist chip as a decorative variant only.
   - Restore `:focus-visible` ring globally; honor `prefers-reduced-motion`.

2. **Mobile bottom nav polish** (`src/components/MobileBottomNav.tsx`)
   - Filled pill on active tab, animated icon scale, better contrast, aria-current preserved, safe-area tuned.

3. **Skeletons + empty states**
   - New `src/components/ui/Skeleton.tsx` and `src/components/ui/EmptyState.tsx`.
   - Wire into: `_authenticated/cookbook.tsx`, `_authenticated/plan.tsx`, `_authenticated/list.tsx`, `_authenticated/following.tsx`, `_authenticated/pantry.tsx`, `shop.index.tsx`.

4. **First-run onboarding sheet** (frontend-only, persisted in `localStorage` for now; hook point left for future `profiles.onboarded_at`)
   - `src/components/onboarding/OnboardingSheet.tsx` shown once on Home: diet → allergies → first ingredients (writes via existing `saveUserPreferences`).

5. **"Why this recipe" chips** on `RecipeCard` — derived from existing recipe metadata + current pantry/preferences; no backend.

6. **AI prompt suggestions** above `IngredientInput` — static, contextual (time of day, pantry contents).

7. **Ingredient history** — last 10 used ingredients cached in `localStorage`, shown as a "Recent" row above suggestions.

8. **Unified toast/error copy** — small `src/lib/errors.ts` helper wrapping `sonner` with friendly messages; replace ad-hoc `toast.error("…")` calls in the routes touched above.

9. **Account page grouping** — reorganize `_authenticated/account.tsx` into sections: Kitchen (Pantry / Preferences / Cookbook / Following), Chef (Earnings / Analytics / Cookbooks / Storefront), Billing, Danger zone. No behavior change.

10. **Accessibility sweep** on all files touched: `aria-label` on icon buttons, `role`/`aria-live` on toasts, focus rings, contrast fixes.

I will run the existing vitest smoke suite and typecheck after each cluster.

---

## D. Requires backend before shipping (not in this pass)

I'll flag these so you can approve schema work separately:

1. **Onboarding completion flag** — add `onboarded_at timestamptz` to `profiles` (currently persisted in `localStorage`, which is fine for a launch, but a real flag lets you segment users and re-trigger tours).
2. **Cooked-it rating** — either extend `daily_dinner_feedback` with `rating smallint`, `note text` or add `cook_logs` table (`user_id, recipe_id, rating, note, cooked_at`).
3. **Notifications center** — `notifications` table (`user_id, kind, payload jsonb, read_at, created_at`) + server functions + realtime.
4. **Nutrition on generated recipes** — no schema change, but adds a small AI cost; needs a UX toggle so it stays opt-in.
5. **Weekly streaks / digest** — aggregation SQL view or scheduled server function + email template.
6. **Global search** — either a Postgres FTS index on `community_recipes` / `paid_recipes` / `chef_profiles` or a lightweight server fn that unions existing lookups.
7. **Offline / PWA** — service-worker + web app manifest work; larger effort.

---

## Sequencing

Pass 1 (this plan, on approval): items C1–C10.
Pass 2 (after your review): pick from D — I recommend starting with (2) cooked-it rating and (3) notifications, since both directly move retention.

Approve and I'll execute pass 1 end-to-end, then hand you a short changelog + screenshots to review before you decide on pass 2.
