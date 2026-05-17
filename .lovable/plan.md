## Goal

Make fridgecuisine.com a public site. Anyone visiting can use the full kitchen (search dishes, see ingredients, generate recipes from what's in their fridge). Login becomes a small button in the top-right. Only "save recipe" and "my saved recipes" require an account.

## What changes

### 1. Make the homepage public
- Move the current `/_authenticated/index.tsx` content to a public route at `/` (`src/routes/index.tsx`).
- Remove the auth guard from the home page so visitors land directly on the working app — no login wall.
- The dish search bar, ingredient input, filters, and recipe generator all work without an account.

### 2. Small login control in the top-right
- Replace the current full-width auth bar with a compact pill in the top-right corner:
  - **Logged out:** "Sign in" button (opens `/login`) + "Sign up" link.
  - **Logged in:** user email + "Sign out" + a small "Saved (N)" button that opens the saved-recipes drawer.
- Visible on every page, never blocks content.

### 3. Gate only the "save" actions
- The heart/save button on each recipe card stays visible to everyone.
- If a logged-out user clicks it: show a toast "Sign in to save recipes" with a "Sign in" link, OR open a small modal prompting login. (I'd recommend the toast — less friction.)
- The "Saved" drawer is only reachable when logged in.

### 4. Login page tweaks
- Keep `/login` as-is but after successful login redirect back to `/` (not to `/_authenticated/`).
- Add a "← Back to site" link so users can bail out of login without getting stuck.

## Ideas worth considering (pick any)

1. **Recipe history for logged-in users** — auto-save the last 20 generated recipes server-side so users can revisit them across devices. Logged-out users only get localStorage.
2. **Shareable recipe links** — every generated recipe gets a public URL like `/recipe/nepali-momo-a1b2`. Great for SEO and social sharing. No login needed to view.
3. **"Cook again" shortcut** — for logged-in users, one-click re-generate from a previous ingredient set.
4. **Weekly meal plan** (logged-in only) — pick 5 saved recipes, get a combined shopping list.
5. **Public "trending dishes" strip** on the homepage — shows what other visitors searched recently. Social proof + content for SEO.
6. **Notes on saved recipes** (logged-in only) — "I doubled the garlic, used coconut milk instead of cream".

My recommendation: do #1, #2, and #5 first — they directly reinforce the "public site, account adds value" model you're describing.

## What I think

This is the right call. Forcing login before anyone sees the product is a conversion killer — most visitors bounce. Putting the whole app in front and asking for an account only when they want to keep something is the standard pattern (Pinterest, Spotify web, ChatGPT all work this way). The "save" action is the natural moment to ask for signup because the user has just expressed clear intent.

## Technical notes

- `generateRecipes` and `getDishHelper` server functions need their `requireSupabaseAuth` middleware removed (or made optional) so logged-out users can call them.
- `_authenticated` layout is kept only for truly account-only pages (saved recipes drawer contents server-side, future meal plans).
- SEO: add proper `head()` metadata to `/` so the public homepage indexes well on Google.

## Confirm before I build

1. Toast prompt vs modal when a logged-out user clicks "save" — toast OK?
2. Which of the 5 extra ideas (history, share links, trending, meal plan, notes) do you want in this pass? I'd suggest just enabling the public homepage + small login button now, and adding shareable links + trending in a follow-up.
