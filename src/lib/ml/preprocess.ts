// Client-only image preprocessing for the ingredient classifier.
// Resizes to 224x224 via a center-crop, normalizes with ImageNet stats,
// and lays the data out as NCHW float32 — matching what MobileNet/EfficientNet
// exported from torchvision expect.

const TARGET = 224;
const MEAN = [0.485, 0.456, 0.406] as const;
const STD = [0.229, 0.224, 0.225] as const;

export async function fileToTensor(file: File): Promise<Float32Array> {
  const bitmap = await createImageBitmap(file);
  try {
    return bitmapToTensor(bitmap);
  } finally {
    bitmap.close();
  }
}

function bitmapToTensor(bitmap: ImageBitmap): Float32Array {
  // Center-crop to a square, then resize to TARGET x TARGET via canvas.
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = TARGET;
  canvas.height = TARGET;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, TARGET, TARGET);

  const { data } = ctx.getImageData(0, 0, TARGET, TARGET);
  const out = new Float32Array(3 * TARGET * TARGET);
  const plane = TARGET * TARGET;

  // RGBA (HWC, uint8) → RGB (CHW, float32 normalized)
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    out[p] = (data[i] / 255 - MEAN[0]) / STD[0];
    out[plane + p] = (data[i + 1] / 255 - MEAN[1]) / STD[1];
    out[2 * plane + p] = (data[i + 2] / 255 - MEAN[2]) / STD[2];
  }
  return out;
}

export function softmax(logits: Float32Array): Float32Array {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) if (logits[i] > max) max = logits[i];
  const exps = new Float32Array(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    exps[i] = Math.exp(logits[i] - max);
    sum += exps[i];
  }
  for (let i = 0; i < exps.length; i++) exps[i] /= sum;
  return exps;
}

export const INPUT_SIZE = TARGET;