## Problem

The 18 seeded premium recipes exist at `/shop` with full titles, prices, cover images, and locations — but nothing on the home page or in the site nav links there, so visitors never find them.

## Plan

### 1. Add a "Premium chef recipes" strip to the home page (`src/routes/index.tsx`)

A new horizontal-scroll section, similar in spirit to the existing `CommunityStrip`, placed just below the trending/community area. For each of the top ~8 published paid recipes it shows:

- Cover image
- Dish title + (optional) local name
- City, country
- Price badge (e.g. `$5.99`)
- A small "Premium" / lock chip so it reads as paid content

The whole card links to `/shop/$receipeId`. A "See all chef recipes →" link at the section header goes to `/shop`.

Data source: reuse `listPublicPaidReceipes()` (already exists in `src/lib/paid-receipes.functions.ts`). We'll create a tiny presentational component `src/components/landing/PremiumRecipesStrip.tsx` so `index.tsx` stays clean.

### 2. Add a "Shop" entry to the site navigation

Add a `Shop` link to the home header / nav (and `SiteFooter` if it lists destinations) pointing to `/shop`, so the section is reachable from every page.

### 3. No backend, no schema, no auth changes

The shop page, server function, RLS, and seeded data are all already in place. This is purely a frontend discoverability change.

## Out of scope

- Redesigning `/shop` itself
- Recommending/personalising which premium recipes appear
- Any payments wiring (already done)

Approve and I'll build it.
