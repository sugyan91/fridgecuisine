## The problem

The homepage currently pitches 5 products in parallel (AI chef, community, marketplace, sell-your-recipe, global cuisines). Each section reads like its own hero. Visitors can't answer "what is this?" in 5 seconds.

## The fix: one promise, four supporting roles

**Core promise (everything ladders up to this):**
> "Your AI personal chef. Tell it what's in your fridge — it cooks the world for you."

Everything else on the page must visibly *serve* that promise, not compete with it. Each supporting section gets a one-line framing that connects it back to the AI chef.

| Section | Today's framing | New framing (supporting role) |
|---|---|---|
| AI fridge generator | Hero | **Hero — unchanged, sharpened** |
| Global cuisines (CountryTiles) | "Cook cuisines worldwide" (own hero) | "Don't know what to cook? Pick a country — your AI chef takes it from there." |
| Community recipes (CommunityStrip) | "What people are cooking" (own hero) | "See what other fridges turned into dinner tonight." (social proof for the AI) |
| Premium chef recipes (PremiumRecipesStrip) | "Premium chef marketplace" (own hero) | "Want a chef's version instead? Unlock a single recipe for $X." (upgrade path from the free AI) |
| Sell-your-recipe / ChefCTA + ChefSellBanner | "Monetize your culinary flair" (own hero) | Move to footer-adjacent strip: "Are you a chef? Sell your recipes here →" (one line, one link) |

Result: one hero, one product, three supporting sections, one footer CTA for creators. Nothing is cut.

## Homepage order (new)

```text
1. Hero          → AI Personal Chef (fridge input, big and alone)
2. Live ticker   → social proof (kept)
3. How it works  → 3 steps, reinforces the AI promise
4. Cuisines      → "stuck? pick a country" (framed as input to the AI)
5. Community     → "what other fridges cooked tonight" (social proof)
6. Premium       → "want a chef's take? unlock one for $X" (monetization)
7. Testimonials  → kept
8. Chef CTA      → SINGLE small strip near footer (not a full hero)
9. Footer
```

Remove the standalone `ChefSellBanner` mid-page; merge into the single footer-adjacent `ChefCTA` strip.

## Copy changes (concrete)

- **Hero H1:** "Your AI personal chef." **Sub:** "Tell us what's in your fridge. Get recipes from any cuisine in the world — in 30 seconds."
- **CountryTiles heading:** ~~"Cook cuisines worldwide"~~ → "Not sure what to cook? Pick a country."
- **CommunityStrip heading:** ~~"Community recipes"~~ → "Tonight's fridges, turned into dinner."
- **PremiumRecipesStrip heading:** ~~"Premium chef marketplace"~~ → "Want a chef's version? Unlock a single recipe."
- **ChefCTA (footer strip):** "Are you a chef? Sell your recipes on FridgeCuisine →"

Each H2 ends with a verb or link that points back to the AI chef OR the buy-a-recipe upgrade — never a separate brand.

## Monetization clarity (since paying customer = home cooks, one-off purchases)

Make the upgrade path obvious and singular: free AI recipes → unlock one premium chef recipe for a flat price. The Premium section should preview locked recipes inline (image + chef name + "$X — unlock") rather than feel like a separate marketplace tab. No subscription messaging anywhere on the homepage.

## Files to edit

- `src/routes/index.tsx` — reorder sections, remove duplicate `ChefSellBanner`, swap headings.
- `src/components/landing/CountryTiles.tsx` — heading + sub copy.
- `src/components/landing/CommunityStrip.tsx` — heading + sub copy.
- `src/components/landing/PremiumRecipesStrip.tsx` — heading + sub copy + ensure "unlock for $X" CTA on each card.
- `src/components/landing/ChefCTA.tsx` — slim to one-line strip.
- Delete usage of `ChefSellBanner` from homepage (keep the component file in case it's used elsewhere).

## Out of scope

- No new routes, no new DB tables, no auth changes.
- No pricing logic changes (assumes premium recipe purchase flow already exists).
- No redesign of the hero visuals — copy + section order + heading reframes only.
- Logo/brand untouched.

## Success check

After the change, a first-time visitor reading only the H1 + first 3 section headings should be able to answer: *"It's an AI that turns my fridge into recipes, with optional chef recipes I can buy."* If they still can't, we iterate on copy — not on adding more sections.
