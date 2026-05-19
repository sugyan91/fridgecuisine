## Goal
Switch all three recipe generators (Dish-to-recipe, What's in your pantry, Global cuisine) to use Hugging Face as the primary AI provider, with Lovable AI (Gemini) as automatic fallback. Every recipe will include total prep/cook time at the top AND per-step timing.

## Changes

### 1. Add secret
Prompt for `HUGGINGFACE_API_KEY` via `add_secret`. Implementation pauses until it's set.

### 2. New shared helper `src/lib/hf-client.server.ts`
- `callHuggingFaceChat(messages, { jsonMode })` — calls HF Inference Router chat-completions endpoint (`https://router.huggingface.co/v1/chat/completions`) which is OpenAI-compatible. Default model: `meta-llama/Llama-3.3-70B-Instruct` (good free-tier instruction model; configurable via constant).
- `callHuggingFaceImage(prompt)` — calls HF Inference API with `black-forest-labs/FLUX.1-schnell` (or `stabilityai/stable-diffusion-xl-base-1.0` fallback). Returns a base64 data URL so we don't need storage changes.
- Robust error handling: throws typed `HFError` on 4xx/5xx so callers can fall back.

### 3. Update recipe schema (server side)
Extend the JSON schema the model is asked to return so each recipe includes:
```
{
  title, description, servings,
  totalTime: { prep: "15 min", cook: "30 min", total: "45 min" },
  ingredients: [...],
  steps: [
    { order: 1, text: "Sauté onions until soft", duration: "5 min" },
    ...
  ],
  tips?: string[]
}
```
Update system prompts in `src/lib/receipes.functions.ts` and `src/lib/dish-helper.functions.ts` to require this shape.

### 4. Provider wrapper with fallback
In both `receipes.functions.ts` and `dish-helper.functions.ts`, replace the direct `fetch` to `ai.gateway.lovable.dev` with:
```ts
try {
  return await callHuggingFaceChat(...)
} catch (e) {
  console.warn("HF failed, falling back to Lovable AI", e);
  return await callLovableGateway(...) // existing code, extracted into helper
}
```
Same pattern for image generation in `src/lib/receipe-images.ts` (if it exists / wherever the current image call lives).

### 5. UI updates in `src/routes/index.tsx` + recipe card component
- Render `totalTime` chips (Prep · Cook · Total) at the top of each recipe card.
- Render numbered steps with each step's duration badge on the right (e.g. `Step 3 — Sauté · 5 min`).
- Backward compatibility: if older cached recipes lack `steps[].duration` or `totalTime`, render gracefully (omit the badge).

### 6. No DB migration
Recipes are generated on-the-fly. Saved community recipes that lack the new fields just render without timing badges — no schema change needed.

## Technical notes
- HF Inference Router is OpenAI-compatible (`/v1/chat/completions`) so we can reuse a near-identical request body. JSON mode via `response_format: { type: "json_object" }`.
- HF image responses are raw binary; we'll base64-encode into a `data:image/png;base64,...` URL for the frontend so no Supabase storage round-trip is needed.
- Fallback is transparent — user always gets a result if either provider is up.
- Free-tier HF rate limits are modest; the Lovable fallback covers spikes.

## Files touched
- `src/lib/hf-client.server.ts` (new)
- `src/lib/receipes.functions.ts` (prompt + provider wrapper)
- `src/lib/dish-helper.functions.ts` (prompt + provider wrapper)
- `src/lib/receipe-images.ts` (image provider wrapper)
- `src/routes/index.tsx` (render timing + steps)
- Any recipe card component referenced (TBD on read)