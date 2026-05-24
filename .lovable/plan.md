## Plan: First-Visit Free-Tier Info Banner

### Goal
Add a dismissible banner on the homepage that immediately tells new visitors: "5 free recipes per day — sign up for free or upgrade to $5.99/mo for unlimited."

### What We'll Build

1. **Dismissible banner component** (`src/components/FreeTierBanner.tsx`)
   - Shows for anonymous users and signed-in free users (hidden for premium)
   - Uses `localStorage` to remember dismissal across sessions
   - Styled to match the site's dark, warm global-cuisine aesthetic
   - Contains:
     - Bold headline: "5 free recipes today"
     - Subline: "Sign up free to track across devices, or go unlimited for $5.99/mo"
     - Two CTAs: "Sign up" and "Upgrade" buttons
     - Dismiss / close button (X)
   - Positioned just below the sticky header on the homepage

2. **Integrate into homepage** (`src/routes/index.tsx`)
   - Import and render the banner inside `<main>`, right after the header offset padding begins
   - Only renders when `!isPremium`

3. **Styling notes**
   - Use existing design tokens: `bg-card`, `border-border`, `text-foreground`, `text-accent`, `bg-primary`, `bg-turmeric`
   - Make it visually distinct but not intrusive — border-left accent or subtle turmeric background
   - Keep it responsive (stack on mobile)

### Technical Details

- **Dismissal persistence**: Store `fridge-banner-dismissed` in `localStorage` with an optional `expiresAt` (e.g. 7 days) so returning users see the reminder again after a week.
- **Conditional visibility**: The banner checks `!isPremium && !dismissed`.
- **No backend changes** required — purely frontend UI.
- **No route changes** required — stays on `/`.

### Files Changed
- `src/components/FreeTierBanner.tsx` — new component
- `src/routes/index.tsx` — import + render banner

### Acceptance Criteria
- [ ] Anonymous visitor sees the banner on first page load
- [ ] Banner has clear "5 free recipes today" messaging
- [ ] Two CTA buttons: Sign up (goes to `/login?mode=signup`) and Upgrade (goes to `/pricing`)
- [ ] Clicking X dismisses the banner and remembers choice in localStorage
- [ ] Premium users never see the banner
- [ ] Banner reappears after 7 days if dismissed