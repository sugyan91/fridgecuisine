Move HowItWorksStrip to sit directly before the "What's in your Pantry" section.

Current page order:
1. Hero / dish search
2. HowItWorksStrip ← REMOVE from here
3. ChefSellBanner
4. Cook the world / CountryTiles
5. TrendingDishes
6. What's in your Pantry

New page order:
1. Hero / dish search
2. ChefSellBanner
3. Cook the world / CountryTiles
4. TrendingDishes
5. HowItWorksStrip ← INSERT here
6. What's in your Pantry

Implementation:
- In src/routes/index.tsx, cut the `<section>` containing `<HowItWorksStrip />` (currently at lines ~906-908)
- Paste it as a new `<section className="lg:col-span-12">` immediately before the pantry `<section ref={pantryRef}>` (currently at line ~1014)
- No other edits needed.