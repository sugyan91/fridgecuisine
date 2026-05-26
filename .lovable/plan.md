# Plan: In-browser PyTorch ingredient classifier for FridgeCuisine

A portfolio-worthy ML feature with zero ongoing infra cost. You train in PyTorch, export to ONNX, run inference fully in the user's browser via `onnxruntime-web`. No GPU bill, no server, no API call — and a strong story: *"trained and shipped a CV model to production, runs on-device."*

## The user-facing feature

On the existing fridge ingredient input (`src/components/fridge/IngredientInput.tsx`), add a **"📷 Snap your fridge"** button. User uploads/captures a photo → model runs in the browser → top-K detected ingredients are added as chips to the existing input. User can edit before generating recipes. Total inference: ~200–500ms on mid-range laptop, ~1s on phone.

## Architecture

```text
┌───────────────────────────────────────┐     ┌────────────────────────┐
│  PyTorch training repo (separate)     │     │  FridgeCuisine app     │
│  - dataset prep                       │     │                        │
│  - fine-tune MobileNetV3 / EffNet-Lite│ ──► │  public/models/        │
│  - export to ONNX (quantized int8)    │ ONNX│    ingredients.onnx    │
│  - eval + sample notebook             │ file│    labels.json         │
└───────────────────────────────────────┘     │                        │
                                              │  src/lib/ml/           │
                                              │    onnx-session.ts     │
                                              │    preprocess.ts       │
                                              │  components/fridge/    │
                                              │    FridgePhotoButton   │
                                              └────────────────────────┘
```

Two repos, one model file as the contract between them.

## Phase 1 — PyTorch project (separate repo, ~1–2 weekends)

Not in FridgeCuisine. Lives at e.g. `github.com/you/fridge-vision`.

1. **Dataset**: start with [Food-101](https://www.kaggle.com/datasets/dansbecker/food-101) (101 classes, 101k images) or the smaller [Fruits-360](https://www.kaggle.com/datasets/moltean/fruits) for faster iteration. For raw ingredients specifically, [Fruit and Vegetable Image Recognition](https://www.kaggle.com/datasets/kritikseth/fruit-and-vegetable-image-recognition) (36 classes) is the best starting point.
2. **Model**: fine-tune **MobileNetV3-Small** or **EfficientNet-Lite0** from `torchvision.models`. These are designed for mobile/edge — ~5MB quantized.
3. **Training**: standard transfer learning — freeze backbone, train classifier head, unfreeze + fine-tune last block. ~15 epochs on Colab free tier.
4. **Export**:
   ```python
   torch.onnx.export(model, dummy_input, "ingredients.onnx",
                     opset_version=17, dynamic_axes={"input": {0: "batch"}})
   ```
   Then **dynamic int8 quantization** via `onnxruntime.quantization` → final size ~2–4MB.
5. **Deliverables**: ONNX file, `labels.json`, README with metrics (top-1, top-5, confusion matrix), training notebook, HuggingFace Space demo (optional but +1 for portfolio).

## Phase 2 — Integrate into FridgeCuisine (~1 day)

1. **Add dependency**: `bun add onnxruntime-web`.
2. **Drop model artifacts** into `public/models/ingredients.onnx` and `public/models/labels.json`. These are static files — Cloudflare serves them with caching for free.
3. **Create `src/lib/ml/onnx-session.ts`**: lazy-loads the ONNX session once, caches it. Uses the WASM backend (works everywhere; WebGPU as progressive enhancement).
4. **Create `src/lib/ml/preprocess.ts`**: takes a `File` or `HTMLImageElement` → resizes to 224×224, normalizes with ImageNet mean/std, returns a `Float32Array` tensor.
5. **Create `src/components/fridge/FridgePhotoButton.tsx`**: file input + camera capture, runs inference on selection, returns top-K labels via callback. Shows a small loading state while the model downloads on first use (~3MB one-time).
6. **Wire into `IngredientInput.tsx`**: add the button next to the existing text input; on detection, append labels to the existing ingredients list (user can still edit/remove).
7. **Lazy-load everything**: dynamic `import()` of both `onnxruntime-web` and the session module so the homepage bundle stays small and the model only downloads when a user actually clicks the photo button.

## Why this is the right shape

- **Real ML in production.** Inference runs on the user's device on every use. Not a one-shot demo.
- **Zero ongoing cost.** Static file on CDN. No Modal, no Replicate, no GPU rental.
- **No backend changes.** Server functions, Supabase, Stripe all untouched. Low risk of breaking what works.
- **Strong narrative.** "Trained a CNN in PyTorch, quantized it, deployed it to run on-device in a React app via ONNX Runtime Web." Recruiters care about the end-to-end loop, and this is it.
- **Honest scope.** First version covers ~30 common fridge ingredients well. You can grow the label set later without touching the app.

## What I will NOT do

- No Python in this repo. No `requirements.txt`, no edge function calls to a Python service. All ML training stays in the separate repo.
- No replacement of the existing AI recipe generation (Gemini via Lovable AI). Those are different problems.
- No changes to auth, pricing, payments, or community features.

## Open questions before I build Phase 2

1. **Label set**: start with ~30 common fridge ingredients (tomato, onion, carrot, egg, cheese, etc.) or the full Food-101 set (whole dishes)? For the "fridge" use case, ingredients makes much more sense.
2. **Camera vs upload only**: should the button open the device camera directly on mobile (`<input capture="environment">`), or just a file picker?
3. **Confidence threshold**: only add labels above e.g. 0.6 confidence, or always show top-5 with confidence scores so the user can pick?

If you approve this plan, the next step is **switching to build mode** so I can wire up Phase 2 (the in-app integration). Phase 1 (training the model) is something you'd do yourself in Colab/locally — I can't train models from this environment, but I can scaffold the training repo with a starter notebook and export script if you want.
