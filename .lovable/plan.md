
# AI Cost Optimization Plan

Goal: cut Lovable AI credit spend on recipe/dish/teaser/swap/vision flows by ~50-70% without losing quality. Every call currently routes through `callChatJSON` → HF chain first, then Gemini Flash Lite. Cache exists but keys are strict, TTLs are short, and prompts still ship JSON examples inline every call.

## What we'll change

### 1. Model routing — cheapest capable model first
- `src/lib/hf-client.server.ts`: reorder so **Lovable AI `google/gemini-3.1-flash-lite`** is the default (cheapest current-gen chat model, already in catalog). Fall back to HF chain only if gateway 429/402/5xx. Today HF models run first which is more expensive per successful JSON call after retries.
- Add a per-endpoint model override so cheap tasks (swap, substitutions, teaser) always use `flash-lite`, and only recipe generation may escalate to `gemini-3.6-flash` when quality matters.
- Set `reasoning_effort: "none"` where supported. Drop temperature to 0.2 for structured JSON tasks (fewer retries on schema failure = fewer paid tokens).

### 2. Prompt slimming (biggest wins)
- Move the JSON shape example out of the *user* prompt into the *system* prompt, and shorten it. Current dish-helper user prompt sends ~120 tokens of JSON example every call — that becomes cache-shared once in the system.
- Strip verbose instructions in `paid-recipe-teaser`, `substitutions`, `ingredient-swap` (the "instructions" arrays are 5-8 lines; collapse to 2).
- Remove `description` from teaser input when >200 chars (truncate).
- Drop `firstSteps` to first 2 steps (was 3), truncate to 160 chars (was 260).

### 3. Tighter token caps
- `dish-helper`: 1200 → **800** (nutrition + 10 steps fits comfortably in 700).
- `ingredient-swap`: 400 → **220**.
- `substitutions`: 400 → **220**.
- `paid-recipe-teaser`: 350 → **220**.
- `fridge-vision`: already vision-only; add explicit `maxTokens: 250`.

### 4. Smarter, longer-lived caching
- `src/lib/ai-cache.server.ts`: add `normalizeForCacheKey()` that lowercases, sorts, strips punctuation, and stems common plurals ("tomatoes" → "tomato") so near-identical requests share a cache row.
- Bump TTLs for stable outputs: dish-helper 90 → **180 days**, substitutions/swap 30 → **90 days**, teaser (currently uncached) → **cache 60 days** keyed by recipe id + updated_at.
- **New**: cache teaser results. Right now every "Peek with AI" click regenerates — huge waste since recipes rarely change. Key on `paid_recipes.id + updated_at`.
- **New**: cache substitutions (currently no cache at all). Key on ingredient+cuisine.

### 5. Vision cost control
- `fridge-vision`: downscale images client-side to max 768px before upload (they're currently up to 2MB base64). Fewer image tokens = big savings on vision calls.
- Add a 24h cache keyed by SHA256 of the image bytes so repeated uploads of the same photo don't re-bill.

### 6. Observability
- Extend `ai-usage-logging.server` to record `tokensIn/tokensOut/costCredits` from the gateway response. Surface a per-endpoint cost breakdown card on `/admin/usage` so you can see which endpoint burns the most and iterate.

## Files touched

- `src/lib/hf-client.server.ts` — reorder chain, add per-endpoint model hint, reasoning_effort:none.
- `src/lib/ai-cache.server.ts` — normalization helper + longer TTLs.
- `src/lib/dish-helper.functions.ts` — slim prompt, lower cap, use cheaper model.
- `src/lib/ingredient-swap.functions.ts` — slim prompt, cap 220.
- `src/lib/substitutions.functions.ts` — add caching + slim prompt.
- `src/lib/paid-recipes.functions.ts` — cache teaser, slim prompt, cap 220.
- `src/lib/fridge-vision.functions.ts` — image cache + explicit cap.
- Client image downscale util (new `src/lib/image-downscale.ts`) + wire into fridge upload UI.
- `src/lib/ai-usage-logging.server.ts` + `admin.usage.tsx` — cost breakdown.

## Expected impact

| Lever | Est. savings |
|---|---|
| Route to flash-lite by default | 30-50% per call |
| Prompt slimming + lower caps | 20-30% input+output tokens |
| Teaser + substitutions caching | ~80% on repeat views |
| Image downscale | 40-60% on vision calls |

Combined, most cached/warm traffic drops to near-zero; cold generations become materially cheaper. Say go and I'll ship it in one pass.
