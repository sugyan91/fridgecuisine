# Airbnb-Inspired Palette

Replace the Emerald Prestige palette with an Airbnb-style scheme: warm coral red as the hero color, off-white background, near-black text, soft warm gray surfaces. Keep the current Archivo Black + Hind typography and magazine layout — only colors change.

## Color tokens (`src/styles.css`)

| Token | New value | Notes |
|---|---|---|
| `--background` | `#FFFFFF` | Clean white page |
| `--foreground` | `#222222` | Airbnb ink |
| `--muted` | `#F7F7F7` | Section bands |
| `--muted-foreground` | `#717171` | Secondary text |
| `--card` | `#FFFFFF` | with `#EBEBEB` border |
| `--border` | `#EBEBEB` | Hairline gray |
| `--primary` | `#FF385C` | Airbnb "Rausch" coral |
| `--primary-foreground` | `#FFFFFF` | |
| `--secondary` | `#222222` | Dark CTAs / footer |
| `--accent` | `#FF5A5F` | Legacy Airbnb coral for highlights |
| `--ring` | `#FF385C` at 45% | Focus |
| Gradient | `linear-gradient(135deg, #FF385C, #E61E4D, #BD1E59)` | Hero CTA / brand wash |
| Shadow | `0 6px 20px rgb(0 0 0 / 0.08)` | Soft neutral |

Legacy aliases (`--turmeric`, `--paprika`, `--cream`, deep-emerald accents) get remapped to the new tokens so existing components inherit automatically.

## Component touch-ups

- `src/routes/index.tsx` — hero accent words ("Dish to Recipe", "hungry?") become coral instead of gold; section number badges switch from gold to coral; gold rule under SectionHeader becomes a thin `#EBEBEB` line.
- `src/components/landing/ChefCTA.tsx` — emerald panel becomes `#222222` with coral CTA button; stat card backdrop stays translucent white.
- `src/components/landing/TrendingDishes.tsx` — image overlay shifts from `#04382a` to `rgba(0,0,0,0.55)`; country chip becomes coral on white.
- `src/components/landing/HowItWorks.tsx` — oversized numerals switch from gold to faded coral (`#FF385C` at 18% opacity).
- Buttons / links across the page inherit via tokens, no per-component color edits beyond the above.

## Out of scope

- Typography, layout structure, copy, images, backend, auth.
