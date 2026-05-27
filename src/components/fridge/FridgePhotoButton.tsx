import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { detectFridgeIngredients } from "@/lib/fridge-vision.functions";

type Props = {
  onAdd: (labels: string[]) => void;
  existing: string[];
};

type Pick = { ingredient: string; checked: boolean };

type Status =
  | { kind: "idle" }
  | { kind: "analyzing" }
  | { kind: "picking"; picks: Pick[] }
  | { kind: "error"; message: string };

const DESKTOP_MIN = 1024;

async function fileToResizedDataUrl(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

export function FridgePhotoButton({ onAdd, existing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [draft, setDraft] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const detect = useServerFn(detectFridgeIngredients);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  const handleFile = async (file: File) => {
    try {
      setStatus({ kind: "analyzing" });
      const dataUrl = await fileToResizedDataUrl(file);
      const result = await detect({ data: { imageDataUrl: dataUrl } });
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error });
        return;
      }
      if (result.ingredients.length === 0) {
        setStatus({
          kind: "error",
          message: "Couldn't spot any ingredients. Try a closer, better-lit photo.",
        });
        return;
      }
      const picks: Pick[] = result.ingredients.map((ingredient) => ({
        ingredient,
        checked: !existing.some((e) => e.toLowerCase() === ingredient.toLowerCase()),
      }));
      setStatus({ kind: "picking", picks });
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

  const addManual = () => {
    if (status.kind !== "picking") return;
    const v = draft.trim().slice(0, 40);
    if (!v) return;
    if (status.picks.some((p) => p.ingredient.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    setStatus({ ...status, picks: [...status.picks, { ingredient: v, checked: true }] });
    setDraft("");
  };

  const addPicked = () => {
    if (status.kind !== "picking") return;
    const chosen = status.picks.filter((p) => p.checked).map((p) => p.ingredient);
    if (chosen.length) onAdd(chosen);
    setStatus({ kind: "idle" });
    setDraft("");
  };

  const reset = () => {
    setStatus({ kind: "idle" });
    setDraft("");
  };

  const triggerLabel =
    status.kind === "analyzing" ? "Scanning fridge…" : "📷 Snap your fridge";
  const busy = status.kind === "analyzing";
  const disabled = busy || isDesktop;

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
        onClick={() => !isDesktop && inputRef.current?.click()}
        disabled={disabled}
        title={isDesktop ? "Open on phone or tablet to snap your fridge" : undefined}
        aria-label={isDesktop ? "Snap your fridge — available on phone or tablet" : "Snap your fridge"}
        className="w-full bg-cardamom text-white border-2 border-border px-4 py-2.5 rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_var(--border)] hover:translate-y-[-1px] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
      >
        {busy && (
          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        <span className="truncate">
          {isDesktop ? "📱 Snap your fridge (phone / tablet only)" : triggerLabel}
        </span>
      </button>

      {status.kind === "idle" && !isDesktop && (
        <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
          Take a photo of your fridge — we'll spot the ingredients
        </p>
      )}
      {status.kind === "idle" && isDesktop && (
        <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
          Open the site on your phone or tablet to snap your fridge
        </p>
      )}

      {status.kind === "picking" && (
        <div className="mt-3 border-2 border-border bg-white rounded-xl p-3 shadow-[3px_3px_0px_0px_var(--border)]">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                Spotted in your fridge
              </div>
              <div className="font-black text-sm">{status.picks.length} ingredients</div>
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
            Uncheck anything wrong, add anything missed
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

          <div className="flex gap-1.5 mb-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManual();
                }
              }}
              placeholder="Add something missed…"
              maxLength={40}
              className="flex-1 border-2 border-border bg-white px-3 py-1.5 rounded-xl font-bold text-xs outline-none"
            />
            <button
              type="button"
              onClick={addManual}
              className="bg-turmeric border-2 border-border px-3 py-1.5 rounded-xl font-black text-xs uppercase"
            >
              +
            </button>
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