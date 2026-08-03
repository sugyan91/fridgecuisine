# Free-tier expansion without breaking AI budget

## Current state
- Free signed-in users: **1 AI recipe generation / day**.
- Anonymous users: **1 AI recipe generation / day** (tracked by signed cookie + IP).
- Paid tiers: Basic 8/day, Unlimited 30/day fair-use cap.
- The most expensive call is `generateRecipes` (6 recipes, up to 2,400 tokens, nutrition included). Helper endpoints (`dish-helper`, `ingredient-swap`, `paid-teaser`, `daily-dinner`, `fridge-vision`) are much smaller (220–800 tokens).
- All AI calls currently write to the same `recipe_generations` counter, so every helper eats the same scarce quota as a full recipe generation.

## Options to give free users more room to explore

### Option A — Unbundle the quota (cheapest win)
Keep 1 full recipe/day, but give free signed-in users a separate allowance of cheap "helper" calls (e.g. 5/day for dish helper, ingredient swaps, daily dinner tweaks). Helpers cost ~10–30% of a recipe generation, so this adds feature surface without adding much cost.

### Option B — Cheaper free-tier recipe mode
Run free/anon recipe generations through a lighter pipeline:
- Use the cheapest model path (`google/gemini-3.1-flash-lite`).
- Return **3 recipes instead of 6**.
- Skip nutrition by default.
- Shorter system prompt.
This can cut per-generation cost by ~50–70%. With the savings, raise the free allowance to **3 recipe generations/day**.

### Option C — Zero-AI "tasting menu" cache
Pre-seed the `ai_result_cache` table with high-quality results for ~100 popular ingredient/cuisine combos (chicken + rice, eggs + pasta, vegetarian + quick, etc.). When a free query matches a cached combo, serve it instantly at zero token cost. This lets users "explore" unlimited curated results while only paying for truly novel AI generations.

### Option D — Session-based refill
Instead of a hard daily cap, give 1 free generation every 8 hours (so up to 3/day). Same total cost as 3/day, but feels more generous. Works best combined with Option B so each refill is cheap.

### Recommended bundle
Combine **A + B + C**:
1. Free signed-in users get **3 cheaper recipe generations/day**.
2. Free signed-in users get **5 helper calls/day** (swaps, dish helper, daily-dinner overrides, paid-teaser peeks).
3. Build a **curated cache** for common queries so many first-time searches cost nothing.
4. Keep anonymous users at **1/day** (or raise to 2 with the cheaper mode) so sign-up still has a clear upgrade incentive.

This turns the free tier from "one taste" into a real demo while keeping the per-user AI cost roughly flat.

## Technical implementation

1. **Track AI calls by endpoint**
   - Add an `endpoint` column to `recipe_generations`, or create a new `ai_quota_events` table (`user_id`, `endpoint`, `created_at`).
   - Update `checkAiQuota(supabase, userId, endpoint)` and `recordAiGeneration(supabase, userId, endpoint)`.
   - Define per-tier, per-endpoint limits:
     ```text
     free:    recipes=3, helpers=5
     basic:   recipes=8, helpers=20
     unlimited: recipes=30, helpers=100
     ```

2. **Lightweight free-tier recipe generation**
   - Add a `mode: "full" | "lite"` path in `generateRecipes`.
   - Lite mode: 3 recipes, no nutrition, shorter prompt, `tier: "cheap"` in `callChatJSON`.
   - Use lite mode for free and anonymous users; paid users keep the full 6-recipe response.

3. **Curated zero-cost cache**
   - Seed `ai_result_cache` with popular ingredient/cuisine combos via a one-off admin/server function.
   - In `generateRecipes`, check cache before calling AI for free-tier users (paid users can still bypass cache for freshness if desired).

4. **Update quota UI**
   - `src/routes/pricing.tsx`: update Free plan bullets.
   - `src/components/LimitReachedModal.tsx`: new copy for "helper quota" vs "recipe quota".
   - `src/hooks/use-recipe-usage.ts` and `src/routes/_authenticated/usage.tsx`: show per-endpoint usage bars.
   - `src/lib/usage.functions.ts`: return per-endpoint breakdown.

5. **Admin visibility**
   - `src/routes/_authenticated/admin.usage.tsx`: add endpoint filter already exists; ensure new endpoints appear.

6. **Tests**
   - Smoke test that free-tier `generateRecipes` returns 3 recipes in lite mode.
   - Smoke test that helper endpoint quotas are tracked separately.

## Open questions before building
- Should anonymous users also get the cheaper 3-recipe mode, or stay at 1/day to preserve the sign-up incentive?
- Should nutrition remain optional (toggle) for free users, or always off in lite mode?
- Do you want me to pre-seed the curated cache with a specific list of cuisines/ingredients, or start with a generic "top 100" set?

## Suggested first step
Approve the A+B+C bundle and I’ll implement the endpoint-based quota system + lite recipe mode first; the curated cache can ship in a follow-up pass.
