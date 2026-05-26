import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getDishHelper } from "@/lib/dish-helper.functions";

type Props = {
  onAdd: (labels: string[]) => void;
  existing: string[];
};

type Pick = { ingredient: string; checked: boolean };

type Status =
  | { kind: "idle" }
  | { kind: "downloading"; pct: number }
  | { kind: "classifying" }
  | { kind: "expanding"; dish: string; score: number }
  | { kind: "picking"; dish: string; score: number; picks: Pick[] }
  | { kind: "low-confidence"; topGuess: string; score: number }
  | { kind: "error"; message: string };

const CONFIDENCE_FLOOR = 0.25;

export function FridgePhotoButton({ onAdd, existing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const expandDish = useServerFn(getDishHelper);

  const handleFile = async (file: File) => {
    try {
      setStatus({ kind: "downloading", pct: 0 });
      const { classifyDish } = await import("@/lib/ml/dish-classifier");

      let sawDownload = false;
      const preds = await classifyDish(file, (p) => {
        if (p.kind === "download") {
          sawDownload = true;
          setStatus({ kind: "downloading", pct: Math.round(p.progress) });
        } else if (p.kind === "ready") {
          setStatus({ kind: "classifying" });
        }
      });
      if (!sawDownload) setStatus({ kind: "classifying" });

      const top = preds[0];
      if (!top) {
        setStatus({ kind: "error", message: "No prediction returned." });
        return;
      }
      if (top.score < CONFIDENCE_FLOOR) {
        setStatus({ kind: "low-confidence", topGuess: top.label, score: top.score });
        return;
      }

      setStatus({ kind: "expanding", dish: top.label, score: top.score });
      const result = await expandDish({ data: { dish: top.label } });
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error });
        return;
      }
      const picks: Pick[] = result.data.ingredients.map((ingredient) => ({
        ingredient,
        checked: !existing.some((e) => e.toLowerCase() === ingredient.toLowerCase()),
      }));
      setStatus({ kind: "picking", dish: top.label, score: top.score, picks });
    } catch (err) {
      console.error("Dish photo failed", err);
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  };

  const togglePick = (i: number) => {
    if (status.kind !== "picking") return;
    const next = status.picks.map((p, idx) => (idx === i ? { ...p, checked: !p.checked } : p));
    setStatus({ ...status, picks: next });
  };

  const addPicked = () => {
    if (status.kind !== "picking") return;
    const chosen = status.picks.filter((p) => p.checked).map((p) => p.ingredient);
    if (chosen.length) onAdd(chosen);
    setStatus({ kind: "idle" });
  };

  const reset = () => setStatus({ kind: "idle" });

  const triggerLabel =
    status.kind === "downloading"
      ? `Loading vision model ${status.pct ? `(${status.pct}%)` : ""}…`
      : status.kind === "classifying"
        ? "Identifying dish…"
        : status.kind === "expanding"
          ? "Getting ingredients…"
          : "📷 Snap a dish";
  const busy =
    status.kind === "downloading" ||
    status.kind === "classifying" ||
    status.kind === "expanding";

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
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full bg-cardamom text-white border-2 border-border px-4 py-2.5 rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-transform disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
      >
        {busy && (
          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        <span className="truncate">{triggerLabel}</span>
      </button>

      {status.kind === "idle" && (
        <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
          First photo downloads a ~50&nbsp;MB model (one-time, runs on-device)
        </p>
      )}

      {status.kind === "downloading" && (
        <div className="mt-2 h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-cardamom transition-all"
            style={{ width: `${status.pct}%` }}
          />
        </div>
      )}

      {status.kind === "picking" && (
        <div className="mt-3 border-2 border-border bg-white rounded-xl p-3 shadow-[3px_3px_0px_0px_var(--border)]">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                Detected dish
              </div>
              <div className="font-black text-sm">
                {status.dish}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({Math.round(status.score * 100)}%)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-[10px] font-black uppercase text-muted-foreground hover:text-paprika"
            >
              Dismiss
            </button>
          </div>

          <div className="text-[10px] font-black uppercase tracking-wide text-muted-foreground mb-1.5">
            Pick what you have
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 max-h-40 overflow-y-auto">
            {status.picks.map((p, i) => (
              <button
                key={`${p.ingredient}-${i}`}
                type="button"
                onClick={() => togglePick(i)}
                className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${
                  p.checked
                    ? "bg-turmeric border-border"
                    : "bg-white border-border/40 text-muted-foreground line-through"
                }`}
              >
                {p.checked ? "✓ " : "+ "}
                {p.ingredient}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={addPicked}
            className="w-full bg-paprika text-white border-2 border-border px-3 py-2 rounded-xl font-black text-xs uppercase tracking-wide shadow-[2px_2px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-transform"
          >
            Add {status.picks.filter((p) => p.checked).length} to fridge
          </button>
        </div>
      )}

      {status.kind === "low-confidence" && (
        <div className="mt-3 border-2 border-dashed border-border/60 bg-turmeric/10 rounded-xl p-3 text-xs">
          <strong className="font-black uppercase tracking-wide">Not sure what this is.</strong>
          <p className="mt-1 text-muted-foreground">
            Best guess was <em>{status.topGuess}</em> ({Math.round(status.score * 100)}%). Try a
            closer or better-lit photo, or type ingredients manually.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-2 text-[10px] font-black uppercase text-paprika hover:underline"
          >
            OK
          </button>
        </div>
      )}

      {status.kind === "error" && (
        <div className="mt-3 border-2 border-paprika bg-paprika/10 rounded-xl p-3 text-xs flex items-center justify-between gap-3">
          <span className="font-bold">{status.message}</span>
          <button
            type="button"
            onClick={reset}
            className="text-[10px] font-black uppercase text-paprika hover:underline shrink-0"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}