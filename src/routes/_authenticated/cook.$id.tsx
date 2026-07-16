import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Check } from "lucide-react";
import {
  getSavedRecipe,
  setCookedStatus,
  type SavedRecipeRow,
} from "@/lib/saved-recipes.functions";

export const Route = createFileRoute("/_authenticated/cook/$id")({
  head: () => ({
    meta: [
      { title: "Cook Mode — FridgeCuisine" },
      { name: "description", content: "Full-screen step-by-step cooking with timers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CookModePage,
});

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function CookModePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchRecipe = useServerFn(getSavedRecipe);
  const markCooked = useServerFn(setCookedStatus);

  const [row, setRow] = useState<SavedRecipeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    fetchRecipe({ data: { id } })
      .then((r) => setRow(r.row))
      .catch(() => toast.error("Couldn't load recipe."))
      .finally(() => setLoading(false));
  }, [fetchRecipe, id]);

  // Keep the screen awake while cooking.
  useEffect(() => {
    let cancelled = false;
    async function acquire() {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> };
        };
        if (nav.wakeLock) {
          const wl = await nav.wakeLock.request("screen");
          if (!cancelled) wakeLockRef.current = wl;
        }
      } catch {
        // wake lock not available — ignore
      }
    }
    acquire();
    const onVis = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  const steps = useMemo(() => row?.recipe.steps ?? [], [row]);
  const timings = useMemo(() => row?.recipe.stepTimings ?? [], [row]);
  const suggested = timings[stepIdx] ?? 0;

  // Reset timer when moving to a new step.
  useEffect(() => {
    setRunning(false);
    setSeconds((suggested || 0) * 60);
  }, [stepIdx, suggested]);

  // Countdown / count-up.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (suggested > 0) {
          if (s <= 1) {
            setRunning(false);
            try {
              const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
              if (A) {
                const ctx = new A();
                const o = ctx.createOscillator();
                o.frequency.value = 880;
                o.connect(ctx.destination);
                o.start();
                setTimeout(() => { o.stop(); ctx.close(); }, 350);
              }
            } catch { /* ignore */ }
            toast.success("Timer done!");
            return 0;
          }
          return s - 1;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, suggested]);

  const goNext = () => setStepIdx((i) => Math.min(steps.length - 1, i + 1));
  const goPrev = () => setStepIdx((i) => Math.max(0, i - 1));

  const onFinish = async () => {
    if (!row) return;
    try {
      await markCooked({ data: { id: row.id, cooked: true } });
      toast.success("Nice work — logged to your history.");
      navigate({ to: "/cookbook" });
    } catch {
      toast.error("Couldn't log cook.");
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-background p-6"><p className="opacity-60">Loading…</p></main>;
  }
  if (!row) {
    return (
      <main className="min-h-screen bg-background p-6">
        <p className="opacity-70">Recipe not found.</p>
        <Link to="/cookbook" className="underline text-sm">Back to cookbook</Link>
      </main>
    );
  }
  if (steps.length === 0) {
    return (
      <main className="min-h-screen bg-background p-6">
        <p className="opacity-70">This recipe has no step-by-step instructions to cook along.</p>
        <Link to="/cookbook" className="underline text-sm">Back to cookbook</Link>
      </main>
    );
  }

  const isLast = stepIdx === steps.length - 1;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b-2 border-border bg-white">
        <Link to="/cookbook" className="text-xs font-black uppercase opacity-70">← Exit</Link>
        <p className="font-black text-xs uppercase tracking-widest opacity-70">
          Step {stepIdx + 1} / {steps.length}
        </p>
        <span className="text-xs opacity-0">.</span>
      </header>

      <div className="px-6 pt-6">
        <p className="text-[11px] uppercase font-black opacity-60 tracking-widest">
          {row.title}
        </p>
        <div className="mt-2 h-1.5 w-full bg-white border-2 border-border rounded-full overflow-hidden">
          <div
            className="h-full bg-turmeric"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <section className="flex-1 flex items-center justify-center p-6">
        <p className="font-display text-3xl md:text-5xl text-paprika text-center max-w-3xl leading-tight">
          {steps[stepIdx]}
        </p>
      </section>

      <section className="p-6 bg-white border-t-2 border-border">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-3">
            <p className="font-display text-6xl tabular-nums text-paprika">
              {formatTime(seconds)}
            </p>
            <p className="text-[11px] uppercase font-black opacity-60 tracking-widest mt-1">
              {suggested > 0 ? `Suggested ${suggested} min` : "Stopwatch"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex items-center gap-2 px-5 py-3 bg-turmeric border-2 border-border rounded-full font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_var(--border)]"
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {running ? "Pause" : "Start"}
            </button>
            <button
              onClick={() => { setRunning(false); setSeconds((suggested || 0) * 60); }}
              className="flex items-center gap-2 px-4 py-3 bg-background border-2 border-border rounded-full font-black text-xs uppercase"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={goPrev}
              disabled={stepIdx === 0}
              className="flex items-center justify-center gap-2 py-3 bg-background border-2 border-border rounded-full font-black text-xs uppercase disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            {isLast ? (
              <button
                onClick={onFinish}
                className="flex items-center justify-center gap-2 py-3 bg-paprika text-white border-2 border-border rounded-full font-black text-xs uppercase shadow-[3px_3px_0px_0px_var(--border)]"
              >
                <Check className="w-4 h-4" /> Finish
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center justify-center gap-2 py-3 bg-paprika text-white border-2 border-border rounded-full font-black text-xs uppercase shadow-[3px_3px_0px_0px_var(--border)]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}