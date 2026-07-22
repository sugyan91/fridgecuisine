
# Mobile-first upgrade — 4 phases

You approved all four bundles + one opinionated visual pass, no chef subscriptions. Each phase is independently shippable; I'll land them in this order so kitchen utility lands first (highest daily value), then habit loops, then polish.

---

## Phase 1 — Kitchen power

Turn Cook Mode into a hands-free, adaptive kitchen surface.

1. **Voice control in Cook Mode**
   - Web Speech API (`SpeechRecognition`), no backend cost.
   - Commands: "next", "back", "repeat", "start timer", "pause", "how long".
   - Mic toggle button in the Cook Mode header; visual indicator when listening; TTS confirmation ("Step 3 of 8") via `speechSynthesis`.
   - Fallback message on unsupported browsers (Firefox/older iOS).

2. **Serving scaler**
   - `×0.5 / ×1 / ×2 / ×4` toggle on both unlocked recipe pages and Cook Mode.
   - Ingredient parser handles integers, decimals, fractions (`1½`, `1 1/2`), and units. Non-parseable strings render unchanged with a `~` marker.
   - Rescaled quantities also propagate into shopping-list generation and the "add missing" action.

3. **AI ingredient substitutions**
   - Long-press / tap an ingredient chip → bottom sheet with 3 AI-generated swaps (with ratios and flavor tradeoffs).
   - Uses existing Lovable AI gateway (`google/gemini-3.1-flash-lite`), cached per `(recipe_id, ingredient)` in `localStorage` for the session.

4. **"Add missing to shopping list"**
   - On any unlocked recipe: button diffs recipe ingredients against `pantry_items`, opens a checklist of missing items, adds selected to this week's plan-derived `/list`.
   - Also available inside Cook Mode header.

5. **Unit toggle (metric ↔ US)**
   - Per-user preference in `user_preferences` (add `unit_system` column). Reuses the parser from #2. Persists across sessions.

---

## Phase 2 — Retention loop

Make the app worth opening every day.

6. **Daily suggestion on Home**
   - New hero card above the fridge input: "Tonight, from your pantry" — one AI-picked saved/community/paid recipe based on pantry + preferences + what's already in this week's plan.
   - Regenerates once per calendar day per user (cached in a new `daily_suggestions` table).
   - Actions: "Cook it", "Add to plan", "Skip → new pick" (spends one manual regen, capped at 3/day).

7. **"I cooked it" + real ratings + photo**
   - Cook Mode "Finish" screen prompts: 1–5 stars, optional 200-char note, optional photo upload to Supabase Storage.
   - New tables: `cook_logs` (user × recipe × timestamp) and `recipe_ratings` (real ratings — displayed alongside/eventually replacing `fakeRating`).
   - Personal `/journal` page: chronological list of everything you've cooked with photos.

8. **Streaks + weekly recap**
   - `cook_logs` powers a streak counter on Home ("🔥 3-day streak") and a Sunday weekly recap card ("You cooked 4 recipes, tried 2 new cuisines").
   - No emails — all in-app.

9. **Save for later inbox**
   - Global bookmark button on any recipe card / detail page. Writes to a new `bookmarks` table.
   - New "Saved" section on Home surfacing the last 6 bookmarks.

---

## Phase 3 — Notifications & social polish

Close the follow → discover → notify loop.

10. **In-app notification center**
    - `notifications` table with `user_id, kind, payload, read_at`.
    - Bell icon in top-right on desktop and inside `/account` on mobile. Unread badge on the "Me" tab.
    - Triggers: new recipe from followed chef, tip received, recipe/cookbook sold, promo code redeemed, someone rated your recipe.
    - Server-mediated inserts from the relevant server functions and webhook handlers (no direct client writes).

11. **Recently viewed rail on Home**
    - `localStorage`-backed (last 8 recipes, dedup by id). Horizontal scroller under the daily suggestion.

12. **Native share sheet**
    - `navigator.share` with title, description, and cover image on every recipe/cookbook/chef page. Fallback to copy-link toast on unsupported browsers.

---

## Phase 4 — Visual refresh (opinionated single pass)

Keep the paprika + turmeric + zine feel. Fix the loudness and mobile density.

- **Home page above the fold**: replace the text-heavy landing with a big square "Scan my fridge" tile (camera icon + short label) + the daily suggestion card. Everything else moves below.
- **Recipe cards**: tall aspect image (4:5), title + price overlaid at bottom on a subtle gradient, chef row below. Kills the current cramped 3-column info fight.
- **Shadow discipline**: `shadow-[3px_3px_0px_0px_var(--border)]` reserved for primary CTAs and hero-tier cards only. Secondary cards get `border-2` alone.
- **Type scale**: introduce two mid sizes (`text-lg`, `text-2xl`) between body and display. Cap display usage to page titles + hero cards.
- **Bottom nav**: bump icons to `h-6 w-6`, use filled Lucide variants (`HomeIcon` filled) when active, thin outline when not.
- **Cook Mode entry**: sticky "Cook this →" bar on every unlocked recipe, styled like the unlock CTA on locked ones.
- **Dashboards (`/analytics`, `/earnings`)**: unify KPI card style, calmer borders, keep charts as-is.

No 3-direction picker — I'll ship this as one coherent pass and iterate on your feedback.

---

## Technical notes

- **New tables**: `daily_suggestions`, `cook_logs`, `recipe_ratings`, `bookmarks`, `notifications`. Each with RLS (`auth.uid() = user_id` on owner rows) and explicit `GRANT` per the public-schema-grants rule. Ratings get a public-read policy scoped to published recipes only.
- **Storage**: new `cook-photos` bucket (private, owner-scoped signed URLs).
- **Server functions**: extend `saved-recipes.functions.ts`, `pantry.functions.ts`, and add `cook-log.functions.ts`, `notifications.functions.ts`, `bookmarks.functions.ts`, `daily-suggestion.functions.ts`, `substitutions.functions.ts`.
- **AI**: substitutions + daily suggestions use existing `callChatJSON` on `google/gemini-3.1-flash-lite`. Voice control is fully client-side (Web Speech API + `speechSynthesis`), no gateway calls.
- **Notifications on the server side**: existing server functions that already perform the triggering write (follow, tip webhook, sale webhook, rating insert) get an additional insert into `notifications` in the same handler.
- **Migrations**: one migration per phase, keeping RLS + GRANT + policies in the same file.

---

## Order of work

1. Phase 1 (kitchen power) — 5 features, mostly client + one pref column.
2. Phase 2 (retention) — 4 features + 4 new tables + storage bucket.
3. Phase 3 (notifications & social polish) — 1 new table + wiring into existing handlers.
4. Phase 4 (visual refresh) — pure UI, no schema.

I'll pause between phases only if you want to review. Otherwise I ship them back-to-back and you review at the end.
