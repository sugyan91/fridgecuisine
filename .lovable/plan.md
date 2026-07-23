# Make FridgeCuisine feel like a shipped product, not a side project

Goal: a first-time visitor believes this was built by an established software company. The plan targets the specific tells that break that trust — brand inconsistency, empty screens, unlabeled loading, generic errors, thin onboarding, and missing "who's behind this" signals — without touching business logic.

## What's actually there today (verified)

- 25+ routes exist including `terms`, `privacy`, `cookies`, `contact`, and full auth flow — solid foundation.
- Design system already has a `premium` button variant, `SurfaceCard`, glass overlays, and Inter Tight typography from the last polish pass.
- Recent hydration bug fixed; homepage renders clean.
- What's still missing/inconsistent: no unified brand header across authed pages, empty-state and skeleton coverage is partial, onboarding is zero-touch (user lands on a dense homepage), no "About / trust" surface, error copy is generic, and mobile chrome varies page-to-page.

## Wave 1 — Brand & trust shell (highest first-impression ROI)

Small, cross-cutting changes that a visitor sees within the first 15 seconds.

1. **Unified app chrome**
   - Extract the header from `index.tsx` into `AppHeader.tsx`; use across all authed routes (currently each route rolls its own or has none).
   - Consistent logo lockup, active-nav state, avatar menu, "Upgrade" pill for free users.
   - Match `MobileBottomNav` visual language.
2. **Site footer everywhere**
   - `SiteFooter` currently only renders on `index`. Mount it in `__root.tsx` (except auth/checkout/cook full-screen routes) with Product / Company / Legal / Social columns, small "Made in [city]" line, and version tag.
3. **Trust surface**
   - New `/about` route: mission, how the AI works (plain language), safety & sourcing, team placeholder, press/contact.
   - New `/security` route generated with trust-page guidance (app-owned qualifier, no certification claims).
   - Add "Trusted by X home cooks" + testimonial pull-quote block on `/` above the fold.
4. **Metadata & OG audit**
   - Sweep every content route: unique title < 60 chars, description < 160, `og:title`, `og:description`, `og:type`, `twitter:card`. Add absolute `og:image` on leaf routes with hero imagery (recipe detail, chef profile, shop item).
5. **Favicon + app icon polish**
   - Verify `public/favicon.png` matches the current logo; add `apple-touch-icon` and web manifest for PWA install prompt on mobile.

## Wave 2 — Onboarding, empty & error states

Turn the first-run silence into a guided moment; make every "nothing here yet" screen feel intentional.

1. **First-run onboarding (3 steps, dismissable)**
   - Sheet that appears on first visit: pick 3 dietary preferences → add 3 pantry staples → generate first recipe. Persist a `fc-onboarded` flag.
   - Skippable, one-tap "Show me a demo dish" fallback.
2. **Empty states everywhere**
   - Cookbook, Saved, Pantry, Following, Meal Plan, Earnings, Analytics, Community, Shop — audit each. Use existing `EmptyState.tsx` with illustration, one-line reason, and a primary CTA that moves the user forward.
3. **Loading states**
   - Replace bare spinners/`Loading...` text with skeleton shells that match the final layout (extend the pattern from `RecipeSkeleton`). Cover Cookbook grid, Plan week, Earnings tables, Analytics KPI cards.
4. **Error states with recovery**
   - Extend `src/lib/errors.ts` friendly-error map. Every network-failure surface (recipe generate, AI peek, image upload, unlock/purchase) gets a titled card with retry + "contact support" mailto.
   - Root `ErrorComponent` shows a copyable error ID so support requests are actionable.
5. **Toasts**
   - Standardize on 3 severities (success/info/error) with consistent icons and duration; remove ad-hoc `toast()` calls with only strings.

## Wave 3 — Confidence & finish

Details users don't consciously notice but feel when missing.

1. **Auth polish**
   - Login page split-screen with brand imagery on desktop; social buttons above email (Google is enabled). Show password requirements inline, not as post-submit error.
   - Post-signup "welcome" screen that lands on onboarding, not a raw dashboard.
2. **Pricing page rewrite**
   - Feature comparison table, "most popular" chip, FAQ accordion, money-back sentence, security & privacy badges linking to `/security`.
3. **Accessibility & motion**
   - Verify focus rings on all interactive elements, aria-labels on icon-only buttons, `prefers-reduced-motion` respected. Add a real skip-to-content link.
4. **Perf & polish signals**
   - Add `<Suspense>` boundaries to lazy routes so navigation never flashes blank. Preload logo and hero image. Compress any oversized assets.
5. **Small confidence cues**
   - "Autosaved" indicator on preferences/pantry edits, "Copied" microstate on share buttons, humanized timestamps ("2h ago") consistently, contextual tooltips on Pro features.

## Technical notes

- No schema or business-logic changes — presentation, routing, copy, and metadata only.
- New files anticipated: `src/components/AppHeader.tsx`, `src/components/Onboarding.tsx`, `src/routes/about.tsx`, `src/routes/security.tsx`. Existing `EmptyState.tsx`, `SurfaceCard.tsx`, `errors.ts` extended, not replaced.
- Root layout changes limited to mounting header/footer conditionally by pathname; `<Outlet />` stays intact.
- Each wave is independently shippable and reversible.

## How I'd like to proceed

Wave 1 delivers the biggest first-impression jump for the least code churn. I'll start there once approved, ship it end-to-end, then check in before Wave 2. If you'd rather I do all three in one go, say the word and I'll batch them.
