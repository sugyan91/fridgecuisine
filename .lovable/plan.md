
## Goal
Cut AI cost of recipe generation (and related AI calls) with the smallest possible quality hit. Focus on `generateRecipes` (the biggest surface), then apply the same pattern to daily-dinner, dish-helper, ingredient-swap, substitutions, and paid-recipe teaser.

## Where the money goes today
Confirmed from the code:
- `generateRecipes` returns **10 recipes** per call with a ~1.8 KB system prompt, no `max_tokens` cap, `temperature: 0.7`, and always includes `nutrition`, `stepTimings`, `substitutions`, `difficulty`, `dietary[]` — output can easily be 3-6 K tokens.
- HF chain is tried first (3 models). If HF is set, every request pays HF tokens; only if all three fail does it fall back to `google/gemini-3.1-flash-lite`.
- Cache exists (30-day, keyed by sorted pantry + cuisine + dietary + **exclude** + kidFriendly + language). Because `exclude` grows every "Show more", cache almost never hits on refresh.
- Daily dinner, tweaks, and dislike-regen each call the model in full with steps/reason/ingredients — no output cap.

## Changes — high-impact first

### 1. Cap output tokens on every call (biggest single knob)
In `hf-client.server.ts`, add a `maxTokens` parameter to `callOpenAICompat` / `callChatJSON` (default 1200, override per call site). Cost per call is dominated by output tokens — this alone can cut spend 40-60% on truncation-resistant flows.

Per call-site caps:
- `generateRecipes`: 2000 (10 recipes × ~200 tokens each after slimming)
- `daily-dinner` variants: 500
- `substitutions`, `ingredient-swap`, `dish-helper`, `paid-recipe teaser`: 400

### 2. Slim the recipe output shape
Cut structural bloat that costs both input (schema) and output tokens:
- Drop `stepTimings`, `substitutions`, `difficulty`, `kidFriendly` from the response by default. Keep them only when a caller asks for them (new `detailed: boolean` flag; default false).
- Make `nutrition` opt-in via the existing `includeNutrition` flag (currently ignored — code forces nutrition on). This alone cuts ~200 tokens per recipe.
- Return **6 recipes** by default instead of 10; add a "Show more" that re-queries for 4 more with the excluded titles.

### 3. Tighten the system prompt
Rewrite the recipe system prompt from ~1.8 KB to ~600 bytes: keep the rules, drop the repetition, move examples inline into the JSON template, remove tag list enumeration (let the model infer from a short whitelist). Move dietary compliance into one line with the tags interpolated.

### 4. Drop the HF chain by default
Set `LOVABLE_MODEL` (`gemini-3.1-flash-lite`) as the primary path. Only try HF when an env flag `AI_USE_HF=1` is present. Rationale: HF chain adds latency and a second bill; Gemini flash-lite is already the cheapest capable model on the gateway and honors `response_format: json_object` natively (fewer parse retries).

### 5. Fix caching so it actually hits
- Remove `exclude` from the cache key. Cache the full pool by (pantry, cuisine, dietary, kidFriendly, language), then filter out excluded titles client-side when paginating. Same-pantry refreshes become free after the first call.
- Extend TTL from 30 → 90 days for shared, pantry-agnostic queries (e.g. `cuisine="Any / Surprise Me"` with empty pantry — this is popular and identical across users).
- Add a public/shared cache tier: if `ingredients.length === 0`, use a project-wide key with no user salt. First user pays, everyone else is free.
- Cache daily-dinner "Tweak" combos too: key by `(userId, day, dietary+allergies+spice+maxTime)` so toggling the same chips again is free.

### 6. Lower temperature
Drop `temperature` from `0.7` → `0.3` on JSON calls. Deterministic-ish output reduces parse-failure retries and repeat generations. Keep 0.7 only for `generateRecipes` where variety matters, and reduce to `0.5` there.

### 7. Preflight: skip the model when we can
- Reject obviously empty/duplicate inputs before the call (already partially done — audit and tighten).
- Client-side: don't allow "Show more" to fire when we have ≥N recipes cached for the current filter set.
- Debounce daily-dinner "Tweak" applies from 400 ms → 800 ms to collapse rapid chip toggles.

### 8. Downsize daily-dinner output
Reduce steps from 5-8 → 3-5, drop `reason` and `usedIngredients`/`missingIngredients` from the initial payload; fetch full details only when the user expands the card. First render becomes a 150-token response instead of ~600.

## Technical details

Files touched:
- `src/lib/hf-client.server.ts` — add `maxTokens` param, HF opt-in, lower temperature default.
- `src/lib/recipes.functions.ts` — slim prompt, drop always-on fields, remove `exclude` from cache key, add shared cache path, cut recipe count.
- `src/lib/daily-dinner.functions.ts` — smaller output shape, cache tweak combos, lazy-load details.
- `src/lib/substitutions.functions.ts`, `src/lib/ingredient-swap.functions.ts`, `src/lib/dish-helper.functions.ts`, `src/lib/paid-recipes.functions.ts` — pass tight `maxTokens`.
- `src/lib/ai-cache.server.ts` — add `getSharedCached` helper for pantry-agnostic keys.
- Recipe UI — pagination for "Show more" reading from cached pool, opt-in "Show nutrition/timings" toggle.

Rough expected savings on a "typical" recipe-gen request:
- Output tokens: ~3500 → ~1300 (−63%)
- Input tokens: ~1900 → ~700 (−63%)
- Cache hit rate on repeat/paginate: <5% → ~70% for same-pantry sessions

## Trade-offs the user should know
- Nutrition, timings-per-step, and substitutions become opt-in — hidden until the user asks for them.
- Default result count drops from 10 → 6 (pagination fills the rest, and it's free from cache).
- Slightly less "creative" wording at lower temperature.
- HF fallback is disabled unless `AI_USE_HF=1` is set — one less provider to bill, but also one less safety net if Lovable AI is briefly down.

If any of these trade-offs are unacceptable (e.g. "always show nutrition"), say which and I'll adjust the plan before building.
