# Plan: Dish-photo → ingredients (no training, no model file)

Throw out the manual ONNX/training scaffolding from last turn. Replace it with **Transformers.js**, which auto-downloads a ready-made food classifier from HuggingFace and runs it in the browser. Then chain it with your existing `getDishHelper` AI to turn the detected dish into ingredients.

## What the user sees

1. Tap **📷 Snap your fridge / a dish** on the ingredient input
2. ~5s on first use (model downloads + caches in browser, ~50MB one-time, served from HF CDN)
3. Browser detects the dish: *"Apple Pie — 87%"*
4. Server function expands it into ingredients via the existing recipe AI
5. Ingredients appear as **checkable chips** — user ticks which ones they actually have, taps "Add"

## Architecture

```text
Photo file
    │
    ▼  (in browser, ~500ms after first load)
@huggingface/transformers — image-classification pipeline
    │   model: onnx-community/swin-finetuned-food101-ONNX
    │   (auto-downloaded from HF CDN, cached in IndexedDB)
    ▼
"Apple Pie" (top-1 dish, 87% confidence)
    │
    ▼  (server function, ~1s)
getDishHelper({ dish: "Apple Pie" })  ← already exists
    │
    ▼
{ ingredients: ["flour", "butter", "apples", "sugar", "cinnamon", ...] }
    │
    ▼  (back in browser)
Chips with checkboxes → user picks → addMany() in IngredientInput
```

Two AI systems chained: on-device CV → server LLM. That's the portfolio story.

## Changes

### Remove (from last turn)
- `bun remove onnxruntime-web`
- Delete `public/models/` (README, labels.json — no longer needed; Transformers.js pulls the model from HF)
- Delete `src/lib/ml/preprocess.ts` (Transformers.js handles preprocessing)
- Delete `src/lib/ml/onnx-session.ts` (replaced)

### Add
- `bun add @huggingface/transformers`
- **`src/lib/ml/dish-classifier.ts`** — lazy singleton that runs Transformers.js `pipeline('image-classification', 'onnx-community/swin-finetuned-food101-ONNX')`. Returns top-3 dish predictions. All imports inside async functions so it never touches the SSR/Worker bundle.

### Rewrite
- **`src/components/fridge/FridgePhotoButton.tsx`** — new states:
  - `idle` → button
  - `loading-model` → "Downloading vision model (one-time, ~50MB)…" with progress %
  - `classifying` → spinner "Identifying dish…"
  - `expanding` → spinner "Getting ingredients…" (calling `getDishHelper`)
  - `picking` → shows detected dish name + ingredient checklist (default all checked) + **Add to fridge** button
  - `error` / `low-confidence` → graceful fallback ("Not sure what this is — try another angle")

### Keep as-is
- `src/components/fridge/IngredientInput.tsx` already has `addMany` — no changes needed beyond what we did last turn
- `getDishHelper` server function — used unchanged

## Honest trade-offs

- **First-load size:** the Swin Food-101 model is ~50MB. Transformers.js caches it in IndexedDB, so it's a one-time cost per browser. We'll show a clear progress indicator so it doesn't feel broken.
- **Accuracy:** Food-101 covers 101 common dishes (pizza, sushi, tacos, ramen, apple pie, etc.). It will misclassify obscure or homemade dishes. We handle this by showing the confidence % and letting the user dismiss bad results.
- **Latency:** ~5s first photo (download), ~500ms subsequent photos. Add ~1s for the LLM ingredient expansion. Total: feels snappy after first use.
- **Mobile data:** 50MB download is real. We'll add a one-line "uses ~50MB on first photo" note next to the button so users on cellular aren't surprised.

## What I will NOT do

- No backend changes. `getDishHelper` is used as-is.
- No new tables, no new auth, no Stripe/community/sell changes.
- No training, no Python, no Colab, no separate repo. Pure JS/TS.
- Won't replace the existing text input or suggestions — the photo button is additive.

If you approve, I'll switch to build mode and ship this.
