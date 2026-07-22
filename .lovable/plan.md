# My take as a mobile user

I spent a few minutes tapping around at 393px. Honest impressions:

## What already feels good
- Rich functionality: pantry, cook mode, meal plan, shopping list, chef storefronts, tips, cookbooks — very few cooking apps have this depth.
- Cook mode with wake-lock + timers is genuinely useful on a phone in the kitchen.
- The AI-first home (fridge → recipe) is a strong opening move.

## What friction I hit on mobile

1. **No bottom nav.** Everything routes through a top hamburger/menu. On a phone, primary destinations (Home, Discover, Plan, Cook, Me) should be one thumb-tap away. I keep scrolling back to the top to move around.
2. **Home page is text-heavy.** The generator form is powerful but visually dense — long inputs stacked, small chips, small buttons. First-time mobile users don't immediately see "take a photo of my fridge."
3. **No camera-first entry.** Photo-to-ingredients exists in pantry, but on the home screen I want a giant "📷 Scan my fridge" button front and center.
4. **Recipe cards on mobile are cramped.** Two-column grids at 393px squeeze titles to two-line ellipsis. Chef name, price, likes all fight for space.
5. **Cook mode is great but hard to reach.** From a saved recipe, "Start cooking" should be a sticky bottom CTA, not a link in the header.
6. **No offline / no "recently viewed."** On mobile I lose signal in the kitchen. Recipes I opened 10 seconds ago should still render.
7. **Typography feels generic.** Default sans, neutral palette — reads like a template. A food app should feel warm, appetizing, editorial. Right now it reads "SaaS dashboard."
8. **No haptics / no swipe gestures.** Swipe to save, swipe to dismiss, long-press to add to plan — all missing.
9. **Shopping list isn't a first-class screen.** It lives inside /plan. In the kitchen or grocery store I want to open it directly with one tap.
10. **Tip/buy flows bounce to Stripe web checkout.** Fine, but the return page feels abrupt — no celebratory moment, no "share this purchase."

## Features I'd add

**Kitchen-first**
- Voice control in cook mode ("next step", "restart timer") — hands are covered in flour.
- Convert units + scale servings inline (2x, 0.5x) on every recipe.
- Substitutions ("out of buttermilk?") powered by the AI you already have.

**Habit / retention**
- Daily "what's for dinner?" push — one AI suggestion using pantry + preferences.
- Streaks for cooking (cooked 3 days in a row → badge).
- Weekly recap: "You cooked 4 recipes, saved $32 vs takeout, tried 2 new cuisines."

**Social / creator**
- Short-form video recipe reels (60s vertical) — chefs record on phone, others swipe through.
- Comments + rating with a photo of your result ("cooked it" proof).
- Referral: invite a friend, both get $5 credit toward a paid recipe.

**Discovery**
- Search by mood ("cozy", "impressive", "under 20 min", "one pot") instead of only cuisine.
- Region-aware ("in season near you") using ingredient seasonality.
- "Cook this week" — curated bundle of 5 recipes with one shopping list.

**Chef pro**
- In-app messaging with buyers (support requests on paid recipes).
- Scheduled recipe drops + "coming soon" pages that collect emails.
- Print-ready PDF export of cookbooks for buyers.

## Design changes I'd make

Move to a **mobile-first, editorial food-magazine** feel:
- Bottom tab bar with 5 icons (Home, Discover, Plan, Shop, Me).
- Warmer palette — terracotta / sage / cream instead of neutral gray.
- A display serif for recipe titles (Instrument Serif or Cormorant), keep sans for body.
- Bigger hero imagery, edge-to-edge cards on mobile (no side padding on the card, only on text).
- Sticky bottom CTAs for the primary action on every detail page ("Start cooking", "Buy $4", "Send a tip").
- Pull-to-refresh on feed/discover.

## Proposed order (pick any subset)

```text
Phase A — mobile shell (biggest UX unlock)
  1. Bottom tab bar (Home / Discover / Plan / Shop / Me)
  2. Sticky primary CTAs on recipe + cookbook + chef pages
  3. Camera-first "Scan my fridge" tile on home
  4. Shopping list as a top-level route
  5. Recently viewed + offline cache of last 20 recipes

Phase B — kitchen power
  6. Voice control in cook mode
  7. Serving scaler + unit toggle (US/metric)
  8. AI substitutions button on ingredient rows

Phase C — retention
  9. Daily "what's for dinner?" suggestion card on home
 10. Cooking streaks + weekly recap
 11. "Cooked it" photo reviews on community recipes

Phase D — visual redesign
 12. Warmer palette + serif display font + editorial cards
 13. Full mobile redesign pass with rendered direction options
```

## Questions for you before I build

- Which phase should I start with? A (mobile shell) gives the biggest immediate feel-better; D (visual redesign) is the most dramatic.
- Do you want the visual redesign to go through the 3-direction picker (I capture the current screen, you pick a direction), or should I just ship one opinionated redesign?
- Any features on the list above you want to cut or add before I plan them in detail?
