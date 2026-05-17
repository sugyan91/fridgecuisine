## Fridge Chef — Lean MVP Plan

A single-page tool: type the ingredients you have, pick dietary + cuisine filters, get AI-generated recipes (with steps, cook time, missing ingredients, substitutions), and save favorites. South Asian / Nepali cuisine is a first-class option, not an afterthought.

### Scope (what's in)

- Ingredient input as removable chips (with quick-add suggestions like Rice, Eggs, Onion, Tomato, Spinach, Paneer, Lentils, Ginger, Garlic, Yogurt, Achar)
- Dietary toggles: Vegetarian, Halal, High Protein, Quick Meal (≤20 min)
- Cuisine selector: Nepali / Himalayan, North Indian, South Indian, Global Fusion
- "Find My Feast" → AI returns 3–5 recipes, each with: title, blurb, cook time, cuisine tag, missing ingredients, ordered steps, substitutions
- Streaming recipe results (cards appear as the AI generates them, no long blank wait)
- Expand a recipe card inline to see method + substitutions
- Save / unsave recipes (heart icon) → persisted in browser localStorage
- Saved drawer accessible from header pill (desktop) and floating button (mobile)
- Empty state, loading state, and friendly error state (rate limit / credits)

### Out of scope (deferred)

- Auth, accounts, Stripe subscription
- Fridge photo upload / image recognition
- Grocery affiliate links, meal plans, calorie tracking
- SEO recipe landing pages
- Backend database

### Visual direction

"Playful spice bazaar" — cream background, paprika/turmeric/cardamom/saffron palette, Anton display + Inter body + JetBrains Mono accents, chunky borders, offset hard shadows, slightly rotated sticker-style chips, pop-in animations. Tokens ported verbatim from the selected prototype.

### User flow

```text
[Land on /]
   │
   ▼
[Add ingredient chips + pick filters + cuisine]
   │
   ▼
[Click "Find My Feast"]
   │
   ▼
[Recipe cards stream in: title, time, cuisine, missing badge]
   │           │
   │           └─► [Click heart → saved to localStorage]
   ▼
[Click "View Recipe" → card expands inline with steps + substitutions]
```

### Page structure

- `/` (single route, `src/routes/index.tsx`) — header + 2-column layout: input panel (left), results (right). Saved drawer overlays from the right. Mobile collapses to single column with sticky saved FAB.

### Technical details

- **Stack**: TanStack Start (existing), Tailwind v4, AI SDK + Lovable AI Gateway (no extra accounts needed, Lovable Cloud not required for this MVP).
- **Server function** `src/lib/recipes.functions.ts` exposing `generateRecipes` — `createServerFn({ method: "POST" })` with Zod-validated input `{ ingredients: string[], dietary: string[], cuisine: string }`. Uses AI SDK `streamText` with `google/gemini-3-flash-preview` and `Output.array` of a recipe Zod schema (title, blurb, cookTimeMinutes, cuisine, missingIngredients[], steps[], substitutions[]). Returns `toUIMessageStreamResponse` so the client can render cards as they stream in. System prompt steers toward authentic South Asian / Nepali techniques when that cuisine is selected (mentions achar, jeera, tarka, gundruk-style greens, etc.) and enforces realistic combinations.
- **Provider helper** `src/lib/ai-gateway.ts` — standard Lovable AI Gateway provider with `Lovable-API-Key` + `X-Lovable-AIG-SDK: vercel-ai-sdk` headers, reads `LOVABLE_API_KEY` via `getEnv()` inside the handler.
- **Client** `src/components/fridge/*`: `IngredientInput`, `FilterPanel`, `RecipeCard` (collapsed + expanded states), `SavedDrawer`. Uses `useServerFn` + a streaming hook to append parsed recipe objects to a list as they arrive. Save state in `useLocalStorage("fridge-chef-saved", [])`.
- **Tokens**: add `--color-turmeric / paprika / cardamom / saffron`, custom radius scale, and the `pop-in` keyframe to `src/styles.css` so the design tokens drive Tailwind classes (no hard-coded hex in components).
- **Images**: generate 4–6 thumbnails (dal, saag aloo, jeera rice, paneer, momo, chana) via `generate_image` saved to `src/assets/`; recipe cards pick a thumbnail by matching cuisine/keyword, with a colored-block fallback when no match.
- **SEO**: `<head>` title "Fridge Chef — What Can I Cook With What I Have?", meta description, og:title/og:description. Single H1 ("What's in the pantry?"). JSON-LD `WebApplication`.
- **Validation & errors**: Zod limits (max 30 ingredients, each ≤40 chars, alphanum+space). Surface 429 (rate limit) and 402 (credits exhausted) from the gateway as toast + inline error.

### Build steps

1. Add design tokens + fonts to `src/styles.css`; add `Anton`, `Inter`, `JetBrains Mono` via Google Fonts link in `__root.tsx`.
2. Create AI gateway helper and `recipes.functions.ts` server function with streaming structured output.
3. Build presentational components (input, filters, recipe card, saved drawer) using design tokens.
4. Wire `index.tsx` route: state for ingredients/filters, call server fn, stream results, save to localStorage.
5. Generate recipe thumbnail images.
6. Polish: animations, empty/loading/error states, mobile layout, SEO head tags.

### Open assumption

I'll use localStorage (no auth) for saved recipes in this MVP. When you're ready for accounts + Stripe, that's a follow-up that turns on Lovable Cloud and migrates saved recipes into a per-user table.