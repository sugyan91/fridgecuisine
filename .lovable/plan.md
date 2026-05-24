## Move "Monetize your culinary flair" (ChefCTA) to page bottom

In `src/routes/index.tsx`, the `<ChefCTA />` block currently sits inside the main grid (between How It Works and the Pantry/Recipes columns). Move the entire `<section className="lg:col-span-12"><ChefCTA /></section>` block out of the grid and render it after `<CommunityStrip />` so it becomes the last full-width block on every viewport.

New tail order:
1. Main grid (hero → Country → Trending → How it works → Pantry + Recipes)
2. `<CommunityStrip />`
3. `<section className="max-w-6xl mx-auto mt-12"><ChefCTA /></section>` ← moved here
4. Pricing note strip
5. Mobile saved FAB

No styling, copy, or component-internal changes — purely a reorder so the chef monetization pitch is the final content on mobile, tablet, and desktop.

## Out of scope
ChefCTA internals, colors, other sections.