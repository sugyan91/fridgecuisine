# Fridge ingredient classifier model

Drop your trained ONNX model here as `ingredients.onnx`.

## Contract the app expects

- **File**: `public/models/ingredients.onnx`
- **Input tensor**: `float32[1, 3, 224, 224]`, ImageNet-normalized (mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]`), RGB, NCHW.
- **Output tensor**: `float32[1, N]` raw logits, where `N == labels.length` in `labels.json`. Softmax is applied client-side.
- **Size budget**: keep under ~5 MB (quantize to int8 with `onnxruntime.quantization.quantize_dynamic`).

## Training recipe (separate repo)

1. Dataset: [Fruit and Vegetable Image Recognition (36 classes)](https://www.kaggle.com/datasets/kritikseth/fruit-and-vegetable-image-recognition).
2. Model: fine-tune `torchvision.models.mobilenet_v3_small(weights="DEFAULT")`, replace final classifier with `nn.Linear(in, 36)`.
3. Export:
   ```python
   import torch
   model.eval()
   dummy = torch.randn(1, 3, 224, 224)
   torch.onnx.export(
       model, dummy, "ingredients.onnx",
       input_names=["input"], output_names=["logits"],
       opset_version=17,
       dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
   )
   ```
4. Quantize:
   ```python
   from onnxruntime.quantization import quantize_dynamic, QuantType
   quantize_dynamic("ingredients.onnx", "ingredients.onnx", weight_type=QuantType.QInt8)
   ```
5. Verify `labels.json` order matches the class index order from your `ImageFolder` dataset (alphabetical by folder name).

If `ingredients.onnx` is missing, the in-app photo button shows a friendly "Model not loaded yet" state instead of crashing.