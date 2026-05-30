# Lean more on Hugging Face

Today only `callChatJSON` uses HF (Llama-3.1-8B), and recipes have no images. We'll do two things, both HF-first with Lovable fallback (current pattern).

## 1. Upgrade the HF text model

In `src/lib/hf-client.server.ts`:

- Switch `HF_MODEL` from `meta-llama/Llama-3.1-8B-Instruct` to a stronger model served by HF Inference Providers. Default: **`Qwen/Qwen2.5-72B-Instruct`** (good JSON adherence + multilingual, important since prompts already pass a language). Fallback chain inside HF, in order:
  1. `Qwen/Qwen2.5-72B-Instruct`
  2. `meta-llama/Llama-3.3-70B-Instruct`
  3. `meta-llama/Llama-3.1-8B-Instruct` (current — last resort before Lovable)
- Loop through the chain: on non-200 or unparseable JSON, try next HF model; only after all HF attempts fail do we fall back to Lovable (unchanged behavior).
- Keep `temperature: 0.7`, no `response_format` for HF, JSON repair via existing `tryParseJSON`.

Affects all existing HF callers automatically: `receipes.functions.ts`, `dish-helper.functions.ts`, `ingredient-swap.functions.ts`, `community.functions.ts`, etc. No call-site changes.

## 2. New HF-powered recipe image generation

New server function for generating a single hero image per recipe, using HF Inference Providers' image endpoint.

**New file:** `src/lib/receipe-image.functions.ts`

- `createServerFn({ method: "POST" })` named `generateReceipeImage`.
- Input: `{ dishName: string; ingredients?: string[] }` (zod-validated, dishName 2–200 chars).
- Prompt template: `"Professional overhead food photography of {dishName}, natural lighting, shallow depth of field, rustic wooden table, garnished, appetizing, high detail"`.
- Provider chain (HF-first, Lovable fallback):
  1. **HF**: POST to `https://router.huggingface.co/v1/images/generations` with model `black-forest-labs/FLUX.1-schnell` (fast, free-tier friendly), then `stabilityai/stable-diffusion-xl-base-1.0` as second HF try. Returns base64 PNG.
  2. **Lovable AI fallback**: `https://ai.gateway.lovable.dev/v1/images/generations` with `google/gemini-2.5-flash-image` (non-streaming, `stream: false`, returns base64 from `data[0].b64_json`). Kept simple — no SSE streaming needed for a card thumbnail.
- Returns `{ ok: true; dataUrl: string; provider: "huggingface" | "lovable" } | { ok: false; error: string }`.
- Add helper `callImageGen(...)` inside `hf-client.server.ts` next to existing helpers, exported and reused.

**Where to surface it:** `src/components/fridge/ReceipeCard.tsx`
- On first render of a recipe card (after the recipe loads), call `generateReceipeImage` once and display the returned data URL as the card hero image, with a soft skeleton while loading.
- Cache the data URL in component state for that session; no DB persistence in this pass (keeps scope minimal and avoids storage migration).
- If generation fails, fall back to the existing card visual (no image).

## 3. Out of scope

- No DB table for cached recipe images (can add later if cost becomes an issue).
- No streaming partials for the image (full image arrives once, simpler client).
- No changes to fridge-vision (stays on Lovable AI Gemini — HF vision routing was not selected).
- No UI redesign of cards beyond adding the image slot.

## Files touched

- edit `src/lib/hf-client.server.ts` — model fallback chain + new `callImageGen` helper.
- create `src/lib/receipe-image.functions.ts` — `generateReceipeImage` server fn.
- edit `src/components/fridge/ReceipeCard.tsx` — fetch + render hero image.

## Success check

After the change:
- Recipes generated from fridge ingredients should report `provider: "huggingface"` in server logs the majority of the time (visible via `server-function-logs`).
- Each recipe card shows an AI-generated hero image within ~5–10s, with graceful fallback if both providers fail.
