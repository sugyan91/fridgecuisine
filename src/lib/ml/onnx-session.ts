// Lazy-loaded ONNX Runtime Web session for the in-browser ingredient classifier.
// All imports of `onnxruntime-web` happen inside async functions so the WASM
// runtime is only fetched when the user actually opts in (clicks the photo
// button) — keeps the main bundle small and keeps onnxruntime out of the SSR
// path (it cannot run in the Cloudflare Worker).

import { fileToTensor, softmax, INPUT_SIZE } from "./preprocess";

const MODEL_URL = "/models/ingredients.onnx";
const LABELS_URL = "/models/labels.json";

export type Prediction = { label: string; confidence: number };

type LoadedSession = {
  // Using `any` here intentionally — onnxruntime-web's `InferenceSession` type
  // pulls in the full module at type-check time, defeating the dynamic-import
  // boundary that keeps it out of the SSR bundle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  labels: string[];
};

let sessionPromise: Promise<LoadedSession> | null = null;

async function loadSession(): Promise<LoadedSession> {
  if (typeof window === "undefined") {
    throw new Error("ONNX session can only run in the browser");
  }
  const [ort, labelsRes, modelRes] = await Promise.all([
    import("onnxruntime-web"),
    fetch(LABELS_URL),
    fetch(MODEL_URL),
  ]);
  if (!modelRes.ok) {
    throw new Error("MODEL_NOT_FOUND");
  }
  if (!labelsRes.ok) {
    throw new Error("Labels file missing");
  }
  const labels = (await labelsRes.json()) as string[];
  const modelBytes = new Uint8Array(await modelRes.arrayBuffer());
  const session = await ort.InferenceSession.create(modelBytes, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  return { session, labels };
}

function getSession(): Promise<LoadedSession> {
  if (!sessionPromise) {
    sessionPromise = loadSession().catch((err) => {
      // Reset so a future retry can try again (e.g. after the user drops in the model).
      sessionPromise = null;
      throw err;
    });
  }
  return sessionPromise;
}

export async function classifyImage(file: File, topK = 5): Promise<Prediction[]> {
  const { session, labels } = await getSession();
  const ort = await import("onnxruntime-web");
  const data = await fileToTensor(file);
  const tensor = new ort.Tensor("float32", data, [1, 3, INPUT_SIZE, INPUT_SIZE]);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const result = await session.run({ [inputName]: tensor });
  const logits = result[outputName].data as Float32Array;
  const probs = softmax(logits);

  const idx = Array.from(probs.keys()).sort((a, b) => probs[b] - probs[a]).slice(0, topK);
  return idx.map((i) => ({
    label: labels[i] ?? `class_${i}`,
    confidence: probs[i],
  }));
}

export function isModelMissingError(err: unknown): boolean {
  return err instanceof Error && err.message === "MODEL_NOT_FOUND";
}