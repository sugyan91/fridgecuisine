## What's changing

Two pieces in the hero of `src/routes/index.tsx`:

1. The static "★★★★★ 12,000+ meals cooked this week" line
2. The bordered pill "💰 Got a signature dish? Sell your recipe →"

## 1. Live activity ticker (replaces the rating line)

A slim, rounded strip directly under the recipe counter that auto-rotates every ~3s through realistic cooking events. Example items:

- "Sarah in Austin just cooked **Thai Basil Chicken**"
- "Marco in Milan saved **Cacio e Pepe**"
- "Priya in London is plating **Butter Chaat Bowl**"
- "Yuki in Osaka just rated **Miso Salmon** ★★★★★"

Visual:
- Small green "live" dot (pulsing) on the left
- Single line of text that fades/slides in on rotation
- Subtle `bg-card/60` pill with `border-border/60`, no heavy color
- Width-capped, centered, `text-xs md:text-sm`

New component: `src/components/landing/LiveActivityTicker.tsx`. Pure presentational, hard-coded array of ~10 events, `useEffect` interval to cycle index, `animate-fade-in` on swap.

## 2. Dramatic chef CTA banner (replaces the gold pill)

Remove the inline pill from the hero. Add a new full-width section after the hero block (before "Popular pantry combos") that is a true marketing banner — not a button-in-a-row.

Layout:
- Full-bleed section, `rounded-[2.5rem]` inside container, `min-h-[280px] md:min-h-[360px]`
- Background: dramatic food photo (dark, moody — generated hero shot of a chef plating) with a left-to-right dark gradient overlay so text stays legible
- Left side (text, ~55% width on desktop, full width on mobile with stronger overlay):
  - Small uppercase eyebrow: `FOR HOME CHEFS`
  - Bold display headline: *"Your signature dish deserves an audience."*
  - One-line sub: "Publish a recipe, set your price, keep 90%."
  - Primary CTA button: "Start selling →" linking to `/sell`
  - Secondary link: "See how it works"
- Right side: gradient fade into the image so the chef visual carries the energy
- Subtle parallax-free; just `hover:scale-[1.01]` on the whole banner

New component: `src/components/landing/ChefSellBanner.tsx`. Uses an `imagegen`-generated moody chef photo saved to `src/assets/chef-banner.jpg` (premium quality, 1920×1024, cinematic warm tungsten lighting, hands plating a dish, dark background).

## Files touched

- `src/routes/index.tsx` — remove lines 793–808; insert `<LiveActivityTicker />` where the rating bar was; insert `<ChefSellBanner />` as a new section between the hero block and `<PopularCombos />`
- `src/components/landing/LiveActivityTicker.tsx` — new
- `src/components/landing/ChefSellBanner.tsx` — new
- `src/assets/chef-banner.jpg` — new generated asset

## Out of scope

- Wiring the ticker to real DB events (purely presentational fake data, matching the existing seeded-data vibe of the site)
- Touching the `ChefCTA` component used elsewhere or the `/sell` page itself
- Footer "★ 4.9 from 12,000+ cooks" line (different surface, user didn't mention it)
