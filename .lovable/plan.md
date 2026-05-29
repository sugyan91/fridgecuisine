## Goal
Make sure visitors on laptop, iPad, and phone see the "you can make money selling your recipe" message without scrolling.

## Current State
The ChefCTA ("Monetize your culinary flair") lives far down the homepage — after Explore by Country, Trending, How It Works, Pantry, Community Strip, and Premium Recipes Strip. Most visitors never scroll that far.

## Option A: Compact Hero Banner (Recommended)
Add a small, eye-catching pill/bar directly in the hero section — just above or below the search input — saying something like:
> "Home chefs are earning $500+/month selling recipes. Start selling →"

- **Why it works**: Sits right in the hero where 100% of visitors look. Doesn't push other content down. Works on all screen sizes.
- **Trade-off**: Adds one more element to an already busy hero.

## Option B: Sticky Announcement Bar
A thin, dismissible bar that sits fixed below the header (like "Home cooks are monetizing their recipes — Learn more →").

- **Why it works**: Impossible to miss. Stays visible while scrolling.
- **Trade-off**: Takes vertical space on every device. Can feel like an ad if styled poorly.

## Option C: Hero Mini-Card
A small card/pill inside the hero's left or right margin (on desktop) or centered below the search (on mobile) with a money icon + short pitch.

- **Why it works**: Visually distinct from the main headline.
- **Trade-off**: Needs careful responsive handling so it doesn't crowd the food photos or input.

## What I'll Build (Option A)
1. Add a compact, styled eyebrow/pill right below the star-rating line in the hero.
2. Uses a money/earn icon + short copy like: "Chefs are earning money sharing recipes → Start selling"
3. Clicking takes you to /sell.
4. Styled to match the existing warm design system (accent gold color, subtle border/pill look).
5. Responsive: sits cleanly on mobile without wrapping awkwardly.

## Files to edit
- `src/routes/index.tsx` — add the sell-pill element in the hero section

No backend changes needed.