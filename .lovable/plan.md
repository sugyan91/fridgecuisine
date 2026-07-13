## Goal

Cut Lovable AI spend on the recipe app by (1) tightening per-user usage caps, (2) switching to cheaper default models, and (3) caching AI results so repeat requests skip the model entirely.

## Where cost comes from today

- Text: `src/lib/hf-client.server.ts` → `callChatJSON`, model `google/gemini-3-flash-preview` (used by recipe generation, dish helper, ingredient swap, fridge vision).
- Image: `callFoodImageGen` → `openai/gpt-image-2` (medium quality, 1024×1024) with `google/gemini-3.1-flash-image-preview` as fallback. gpt-image-2 is by far the most expensive call in the app.
- Existing caps in `src/lib/ai-quota.server.ts`: anon (per-IP, in `anon-tracking.server.ts`), free 2/day, basic 10/day, "unlimited" 50/day, 3s rate-limit.
- No result caching — identical pantry + cuisine + prefs re-hits the model every time.

## 1. Tighten usage caps

- File: `src/lib/ai-quota.server.ts`
  - Lower defaults (marketing copy for "unlimited" unchanged, still a fair-use cap):
    - free: 2 → **1** per day
    - basic: 10 → **8** per day
    - unlimited: 50 → **30** per day (fair-use)
  - Raise `RATE_LIMIT_SECONDS` from 3 → **8** so rapid-fire clicks don't burn credits.
- File: `src/lib/usage.functions.ts`
  - Update `FREE_DAILY_LIMIT` mirror to match (1).
- File: `src/lib/anon-tracking.server.ts`
  - Lower `ANON_DAILY_LIMIT` to **1** per IP/day (currently used to preview the app before signup).
- Any user-facing copy that says "2 free recipes/day" is updated to the new number in the same edit (search for the string; only the daily-limit CTA/error messages).

## 2. Switch to cheaper default models

- File: `src/lib/hf-client.server.ts`
  - `LOVABLE_MODEL`: `google/gemini-3-flash-preview` → **`google/gemini-3.1-flash-lite`** (cost-efficient Gemini 3.1 for JSON extraction; catalog-listed for chat, T+I input which vision still needs).
  - `callFoodImageGen`: **drop `openai/gpt-image-2` entirely.** New chain:
    1. `google/gemini-3.1-flash-image-preview` (Nano Banana; strong food quality, ~10× cheaper than gpt-image-2).
    2. `google/gemini-2.5-flash-image` (existing `LOVABLE_IMAGE_MODEL`) as fallback.
  - Keep the vision path (`callVisionJSON`) on the same `LOVABLE_MODEL` — Gemini 3.1 flash-lite supports T,I,A,V→T per the catalog.
- No API-shape changes; both calls remain OpenAI-compatible chat/images endpoints.

## 3. Cache AI results

New table `ai_result_cache` (single generic cache — one row per hashed request):

```sql
CREATE TABLE public.ai_result_cache (
  cache_key text PRIMARY KEY,          -- sha256 of kind + normalized inputs
  kind text NOT NULL,                  -- 'recipes' | 'dish-image' | 'ingredient-swap' | 'dish-helper'
  payload jsonb NOT NULL,              -- the successful AI JSON / image data URL
  hit_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL      -- created_at + TTL (30d text, 90d images)
);
CREATE INDEX ai_result_cache_kind_expires_idx ON public.ai_result_cache(kind, expires_at);

-- No public grants; only reachable via service_role from server functions.
GRANT SELECT, INSERT, UPDATE ON public.ai_result_cache TO service_role;
ALTER TABLE public.ai_result_cache ENABLE ROW LEVEL SECURITY;
-- No policies → no client access.
```

New server-only helper `src/lib/ai-cache.server.ts` with:
- `hashKey(kind, normalizedInputs)` — sha256 hex of canonical JSON.
- `getCached<T>(kind, key)` — returns payload if row exists and `expires_at > now()`, increments `hit_count`.
- `putCached(kind, key, payload, ttlDays)` — upsert with `expires_at = now() + ttl`.

Wire the cache in these server functions (all in `src/lib/*.functions.ts`, all loaded via `await import("./ai-cache.server")` inside the handler to keep it out of client bundles):

- **`recipes.functions.ts`** (biggest win): before calling `callChatJSON`, build a normalized key from `{ sortedPantry, cuisine, sortedDietary, sortedExclude, servings, skill, timeCap }`. Hit → return cached recipes JSON, still count in usage/rate-limit tables (so quotas remain fair). Miss → call AI, on success `putCached('recipes', key, json, 30)`.
- **`recipe-image.functions.ts`**: key from `{ lowerCase(dishName), cuisine, sortedKeyIngredients }`. TTL 90 days. Cached images are the same data URL, so no storage-bucket writes.
- **`ingredient-swap.functions.ts`** and **`dish-helper.functions.ts`**: same pattern, 30-day TTL, key from their normalized input.
- **`fridge-vision.functions.ts`**: image content is unique per photo; **skip caching** here (would require perceptual hashing).

Cache hits DO NOT bypass rate-limit / usage counters — this prevents a single user from spamming the same query to farm free credits, while still saving the AI call. Cache hits log a lightweight `[ai-cache] hit kind=recipes` line for observability.

## 4. Verification

- `bunx tsgo --noEmit`.
- Manual: generate the same recipe twice; second call should log `[ai-cache] hit` and complete instantly with no gateway request in `list_ai_gateway_requests`.
- Confirm free-tier user gets the "come back tomorrow" message on the 2nd generation.
- Confirm food image still renders (Gemini path).

## Files touched

- Migration: `ai_result_cache` table (new).
- Add: `src/lib/ai-cache.server.ts`.
- Edit: `src/lib/hf-client.server.ts` (models), `src/lib/ai-quota.server.ts` + `src/lib/usage.functions.ts` + `src/lib/anon-tracking.server.ts` (caps), `src/lib/recipes.functions.ts`, `src/lib/recipe-image.functions.ts`, `src/lib/ingredient-swap.functions.ts`, `src/lib/dish-helper.functions.ts` (cache wiring), plus 1–2 UI strings if they mention the old daily number.

## Not in scope

- Payment/upgrade flows.
- Any change to fridge photo vision or Turnstile/abuse plumbing.
- Workspace-level Lovable credit alerts (offered in the earlier options but you didn't select it — happy to add in a follow-up).
