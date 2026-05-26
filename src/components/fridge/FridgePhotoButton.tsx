import { useRef, useState } from "react";

type Props = {
  onDetected: (labels: string[]) => void;
  existing: string[];
};

type Status =
  | { kind: "idle" }
  | { kind: "running"; phase: "loading" | "inferring" }
  | { kind: "results"; preds: { label: string; confidence: number }[] }
  | { kind: "model-missing" }
  | { kind: "error"; message: string };

const CONFIDENCE_FLOOR = 0.15;

export function FridgePhotoButton({ onDetected, existing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleFile = async (file: File) => {
    setStatus({ kind: "running", phase: "loading" });
    try {
      const { classifyImage } = await import("@/lib/ml/onnx-session");
      setStatus({ kind: "running", phase: "inferring" });
      const preds = await classifyImage(file, 5);
      const usable = preds.filter((p) => p.confidence >= CONFIDENCE_FLOOR);
      setStatus({ kind: "results", preds: usable.length ? usable : preds.slice(0, 3) });
    } catch (err) {
      const { isModelMissingError } = await import("@/lib/ml/onnx-session");
      if (isModelMissingError(err)) {
        setStatus({ kind: "model-missing" });
      } else {
        console.error("Photo classification failed", err);
        setStatus({ kind: "error", message: "Couldn't read that photo. Try another." });
      }
    }
  };

  const acceptPred = (label: string) => {
    if (existing.some((i) => i.toLowerCase() === label.toLowerCase())) return;
    onDetected([label]);
  };

  const acceptAll = () => {
    if (status.kind !== "results") return;
    const fresh = status.preds
      .map((p) => p.label)
      .filter((l) => !existing.some((i) => i.toLowerCase() === l.toLowerCase()));
    if (fresh.length) onDetected(fresh);
    setStatus({ kind: "idle" });
  };

  const reset = () => setStatus({ kind: "idle" });

  return (
    <div className="mb-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ""; // allow re-selecting same file
          if (f) handleFile(f);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status.kind === "running"}
        className="w-full bg-cardamom text-white border-2 border-border px-4 py-2.5 rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-transform disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
      >
        {status.kind === "running" ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {status.phase === "loading" ? "Loading model…" : "Scanning fridge…"}
          </>
        ) : (
          <>📷 Snap your fridge</>
        )}
      </button>

      {status.kind === "results" && (
        <div className="mt-3 border-2 border-border bg-white rounded-xl p-3 shadow-[3px_3px_0px_0px_var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wide">Detected</span>
            <button
              type="button"
              onClick={reset}
              className="text-[10px] font-black uppercase text-muted-foreground hover:text-paprika"
            >
              Dismiss
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {status.preds.map((p) => {
              const already = existing.some((i) => i.toLowerCase() === p.label.toLowerCase());
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => acceptPred(p.label)}
                  disabled={already}
                  className="text-xs font-bold px-2.5 py-1 rounded-full border border-border bg-turmeric/30 hover:bg-turmeric/60 transition-colors disabled:opacity-40 disabled:line-through"
                >
                  + {p.label}{" "}
                  <span className="opacity-60 font-normal">
                    {Math.round(p.confidence * 100)}%
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={acceptAll}
            className="text-[10px] font-black uppercase tracking-wide text-cardamom hover:underline"
          >
            Add all new
          </button>
        </div>
      )}

      {status.kind === "model-missing" && (
        <div className="mt-3 border-2 border-dashed border-border/60 bg-turmeric/10 rounded-xl p-3 text-xs">
          <strong className="font-black uppercase tracking-wide">Model not loaded yet.</strong>
          <p className="mt-1 text-muted-foreground">
            Drop a trained <code>ingredients.onnx</code> into <code>public/models/</code> to
            enable on-device detection. See the README in that folder for the training recipe.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-[10px] font-black uppercase text-paprika hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {status.kind === "error" && (
        <div className="mt-3 border-2 border-paprika bg-paprika/10 rounded-xl p-3 text-xs flex items-center justify-between">
          <span className="font-bold">{status.message}</span>
          <button
            type="button"
            onClick={reset}
            className="text-[10px] font-black uppercase text-paprika hover:underline"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}