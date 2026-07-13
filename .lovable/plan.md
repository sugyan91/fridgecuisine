## Goal

Make the homepage hero and recipe results feel deliberately crafted — not generic AI SaaS. Focus areas from your answers: **Homepage hero** + **Recipe cards & results**, with **new AI-generated imagery**, **medium motion (3/5)**, and **punchier copy**.

## 1. Homepage hero rebuild

**New hero imagery (AI-generated, cinematic food photography)**

Replace the current pasta/sushi/tacos/curry cutouts (which look like stock inventory) with 3 purpose-shot images in a consistent visual language: dark moody backdrop, warm rim light, shallow depth of field, top-down or 3/4 angle. Saved as project assets.

- `hero-fridge.jpg` — an open fridge glowing warm against a dark kitchen, ingredients visible on shelves. The literal "fridge cuisine" idea.
- `hero-dish-1.jpg` — a rustic bowl of pasta with steam, hands cropped in frame.
- `hero-dish-2.jpg` — a colorful global plate (tacos or curry), overhead, garnish falling mid-air.

These compose into a **layered hero collage**: fridge image as the anchor on the left, two dish shots floating right with a soft parallax offset. Replaces the current 4-rectangle rotation.

**Copy rewrite (punchier voice)**

Current: "What's cooking in your head tonight?" + 10 rotating one-liners.

Proposed direction — keep the rotating prompts idea (it's good) but tighten the anchor:

- **Eyebrow pill**: "Your fridge. Your rules. Real dinner." (replaces "AI-powered personal chef" which reads generic)
- **H1**: "Open the fridge. **We'll take it from there.**" (kept short, action-first, hero verb bolded via the existing accent-underline treatment)
- **Sub-rotator**: trim the 10 prompts to 5 sharper ones, e.g.
  - "Eggs, rice, half an onion? That's dinner."
  - "Name three ingredients. Get a real recipe back."
  - "Tonight's meal is already in your kitchen."
  - "Wilting veg? Consider it the main event."
  - "No shopping. No scrolling. Just cook."
- **CTA microcopy**: change the primary button label to a verb pairing — "Cook something →" instead of a generic "Search / Generate".

**Motion (register 3/5)**

- Hero images: staggered fade+rise on mount (60ms delay each), then a very slow, always-on parallax drift (±6px, 12s loop) using CSS `transform` + `will-change`. Reduced-motion users get static.
- Headline: word-by-word fade-in on mount (`animate-fade-in` chained with 80ms stagger).
- Eyebrow pill: existing pulse dot stays.
- Dish-prompt rotator: keep the current fade-down transition, speed up to 12s cadence (currently 60s — too rare to notice).
- Sticky header: on scroll, shrink logo + tighten padding (transition 200ms). Currently static.

## 2. Recipe card + results polish

**Card visual upgrade** (`src/components/fridge/RecipeCard.tsx`)

- **Image treatment**: 4:3 aspect ratio locked with `aspect-[4/3] object-cover`, subtle inner shadow at bottom for text legibility on future overlays, rounded-2xl corners.
- **Hover choreography**: card lifts 4px, image scales to 1.04 (300ms ease-out), title underline sweeps in from left. All coordinated in one transition group — currently each element animates independently.
- **Meta row**: replace text-only cook-time/servings with icon+text chips (Clock, Users, Flame for difficulty) in muted pill style.
- **Cuisine badge**: small country-flag emoji + cuisine name in top-left corner of image, glass-morphism background.
- **Save button**: heart icon animates fill on click (scale bounce 1 → 1.3 → 1), not just color swap.

**Loading state (`RecipeSkeleton.tsx`)**

Replace generic gray blocks with a shimmering food-shaped placeholder — a soft warm-toned gradient sweep that reads as "plating in progress" rather than "loading". Add a small rotating message underneath ("Chopping…", "Simmering…", "Plating…") that cycles every 1.5s.

**Empty state (no results / before first search)**

Currently just blank. Add a warm illustrative empty state below the hero showing 3 popular combo suggestions as tap-to-try chips ("Chicken + rice + lime", "Pasta + tomato + basil", "Eggs + cheese + bread"). Punchier microcopy: "Not sure? Steal one of these."

**Results header**

When recipes render, add a short animated header: "Here's what your fridge can do." with the count. Small touch, sells the moment.

## 3. Assets to generate

Using `imagegen--generate_image` with `premium` model for hero shots (fidelity matters), `standard` for card fallbacks:

1. `src/assets/hero-fridge.jpg` — 1600×1200, cinematic
2. `src/assets/hero-dish-1.jpg` — 1200×1200
3. `src/assets/hero-dish-2.jpg` — 1200×1200
4. `src/assets/empty-state-illustration.jpg` — 1200×800, warm illustrated style

## 4. Out of scope (for this pass)

- Footer, chef CTA, testimonials, community strip, pricing — untouched.
- Backend, auth, generation logic — untouched.
- Authenticated routes (cookbook, account) — untouched.

## Technical notes

- All new images imported via ES6 (`import heroFridge from "@/assets/hero-fridge.jpg"`) — no lovable-assets externalization for these hero shots since they're referenced directly.
- Motion via existing Tailwind `animate-fade-in` / custom keyframes in `src/styles.css`; no new deps.
- Respect `prefers-reduced-motion` for the always-on parallax drift.
- Copy changes are string-only in `src/routes/index.tsx` — no route/prop changes.
- Card component changes stay presentational; no changes to the `Recipe` type or generation API.

## Deliverable

After implementation you'll see: a new anchored hero with 3 purpose-generated images, sharper headline + rotator, coordinated card hover, better skeletons, and a warm empty state — all on the homepage.
