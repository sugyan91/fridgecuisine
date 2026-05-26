// In-browser dish classifier using Transformers.js + a pre-trained Food-101
// model from HuggingFace. Auto-downloads + caches the model in IndexedDB
// on first use. All `@huggingface/transformers` imports happen inside async
// functions so it never lands in the SSR / Cloudflare Worker bundle.

const MODEL_ID = "Xenova/vit-base-patch16-224"; // ImageNet — fallback if Food-101 unavailable
const FOOD_MODEL_ID = "onnx-community/swin-finetuned-food101-ONNX";

export type DishPrediction = { label: string; score: number };

export type ClassifyProgress =
  | { kind: "download"; file: string; loaded: number; total: number; progress: number }
  | { kind: "ready" }
  | { kind: "done" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipelinePromise: Promise<any> | null = null;

async function loadPipeline(onProgress?: (p: ClassifyProgress) => void) {
  if (typeof window === "undefined") {
    throw new Error("Classifier can only run in the browser");
  }
  const { pipeline, env } = await import("@huggingface/transformers");
  // Use the HF CDN, cache in browser.
  env.allowLocalModels = false;
  env.useBrowserCache = true;

  const progressCallback = (data: {
    status: string;
    file?: string;
    loaded?: number;
    total?: number;
    progress?: number;
  }) => {
    if (!onProgress) return;
    if (data.status === "progress" && data.file && data.total) {
      onProgress({
        kind: "download",
        file: data.file,
        loaded: data.loaded ?? 0,
        total: data.total,
        progress: data.progress ?? 0,
      });
    } else if (data.status === "ready") {
      onProgress({ kind: "ready" });
    }
  };

  try {
    return await pipeline("image-classification", FOOD_MODEL_ID, {
      progress_callback: progressCallback,
    });
  } catch (err) {
    console.warn("Food-101 model unavailable, falling back to ImageNet ViT", err);
    return await pipeline("image-classification", MODEL_ID, {
      progress_callback: progressCallback,
    });
  }
}

export async function classifyDish(
  file: File,
  onProgress?: (p: ClassifyProgress) => void,
  topK = 3
): Promise<DishPrediction[]> {
  if (!pipelinePromise) {
    pipelinePromise = loadPipeline(onProgress).catch((err) => {
      pipelinePromise = null;
      throw err;
    });
  }
  const classifier = await pipelinePromise;
  onProgress?.({ kind: "ready" });

  const url = URL.createObjectURL(file);
  try {
    const raw = await classifier(url, { topk: topK });
    onProgress?.({ kind: "done" });
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.map((r: { label: string; score: number }) => ({
      label: prettifyLabel(r.label),
      score: r.score,
    }));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function prettifyLabel(label: string): string {
  // Food-101 labels look like "apple_pie" → "Apple Pie".
  // ImageNet labels look like "n07747607 orange, orange" → "Orange".
  const cleaned = label.replace(/^n\d+\s+/, "").split(",")[0].trim();
  return cleaned
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}