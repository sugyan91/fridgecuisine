# Snap-the-fridge ingredient detector

Reframe the camera button: instead of "snap a dish" (Food-101 classifier), it becomes "snap your fridge" (multi-ingredient detector). Detected items go into an editable checklist; confirmed items flow into your existing ingredient state, which already drives the dish/recipe results below.

## The new flow

```text
[Snap fridge]
   ↓ (mobile/tablet only)
[Server detects ingredients from photo]
   ↓
[Checklist: ✓ Tomato  ✓ Eggs  ✗ Butter  + free-text add]
   ↓
[Add to fridge] → existing recipe suggestion flow takes over
```

The dish suggestions + "missing ingredients" view you described is already what the rest of the page does once ingredients are in state — we just feed it.

## Detection approach

Use **server-side vision via the Lovable AI gateway** (Gemini 2.5 Flash, multimodal). Reasons over the in-browser model: ~2s instead of ~5s, no 50 MB download, far more accurate at identifying multiple raw items in a cluttered fridge scene. Cost is a few cents per snap on the existing gateway credits.

If you'd rather pick the model later we can stub the server fn and swap providers behind it without changing UI.

## Changes

**Remove**
- `@huggingface/transformers` dependency
- `src/lib/ml/dish-classifier.ts`

**Add**
- `src/lib/fridge-vision.functions.ts` — `detectFridgeIngredients` server fn:
  - Input: base64 JPEG (resized client-side to ≤1024px to keep payload small)
  - Calls Lovable gateway with Gemini vision, system prompt: "List distinct food ingredients visible. Return JSON `{ ingredients: string[] }`. Use common names (Tomato, not Solanum). Max 20 items."
  - Validates with Zod, returns `{ ok, ingredients }` or `{ ok: false, error }`
- Small `callVisionJSON(systemPrompt, userPrompt, imageBase64)` helper in `hf-client.server.ts` (Lovable gateway only — HF router doesn't reliably support images)

**Rewrite `src/components/fridge/FridgePhotoButton.tsx`**
- States: `idle` → `analyzing` → `picking` → `error`
- Picking step: each detected ingredient as a toggleable chip, all checked by default, plus a small "+ add one" input so you can correct misses inline. "Add 5 to fridge" CTA at the bottom.
- Button label: "📷 Snap your fridge"
- Helper line under idle button: "Take a photo of your fridge contents"
- Client-side resize via `<canvas>` before sending (keeps under ~300 KB)

**Desktop behavior**
- On viewports ≥1024px, render the button disabled with a tooltip: *"Open on phone or tablet to snap your fridge"* (small camera icon + 📱 hint)
- Use the existing `useIsMobile` hook + a tablet check (`window.innerWidth < 1024`) — or just a Tailwind `lg:` class combined with a disabled state. Tooltip via the existing shadcn `Tooltip` component.

**`IngredientInput.tsx`**
- No logic change. `addMany` already handles the bulk add; just the button it renders behaves differently.

## What stays the same

- `getDishHelper` server fn — untouched
- The recipe results UI below the ingredient input — untouched (it already shows what you can make + what's missing once ingredients are in state)
- `IngredientInput` chips, manual entry, suggestions — untouched

## Out of scope for this change

- A separate "missing ingredients" widget in the snap modal itself — the existing recipe card area handles this once ingredients land in state.
- Persistence of the detected list before confirmation — it's session-only.

## Verification

- Snap a photo on mobile preview → see chips → confirm → ingredients appear in fridge state → recipe area populates.
- Resize preview to desktop → button is visible but disabled with tooltip.
- Bad/empty photo → graceful "Couldn't spot any ingredients" error with retry.