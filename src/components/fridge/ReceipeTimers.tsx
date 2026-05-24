import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useCountdown, formatTime } from "@/hooks/use-countdown";

type Props = {
  totalMinutes: number;
  variant?: "light" | "dark";
};

export function RecipeTimers({ totalMinutes, variant = "light" }: Props) {
  const { secondsLeft, isRunning, isFinished, start, pause, reset, skip } =
    useCountdown(Math.max(1, Math.round(totalMinutes * 60)));

  const wrap =
    variant === "dark"
      ? "bg-white/10 border-white/30 text-white"
      : "bg-background border-border text-foreground";
  const btn =
    variant === "dark"
      ? "bg-white text-foreground hover:translate-y-[-1px]"
      : "bg-foreground text-background hover:translate-y-[-1px]";

  return (
    <div
      className={`flex items-center justify-between gap-3 border-2 rounded-2xl px-4 py-2.5 ${wrap}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-black text-[10px] uppercase tracking-widest opacity-70">
          Recipe Timer
        </span>
        <span
          className={`font-mono font-black text-2xl tabular-nums ${
            isFinished ? "text-paprika" : ""
          }`}
        >
          {isFinished ? "DONE" : formatTime(secondsLeft)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {!isRunning && !isFinished && (
          <button
            type="button"
            onClick={start}
            className={`size-8 rounded-full grid place-items-center font-black ${btn}`}
            aria-label="Start receipe timer"
          >
            <Play className="size-3.5" fill="currentColor" />
          </button>
        )}
        {isRunning && (
          <button
            type="button"
            onClick={pause}
            className={`size-8 rounded-full grid place-items-center ${btn}`}
            aria-label="Pause receipe timer"
          >
            <Pause className="size-3.5" fill="currentColor" />
          </button>
        )}
        {!isFinished && (
          <button
            type="button"
            onClick={skip}
            className={`size-8 rounded-full grid place-items-center ${btn}`}
            aria-label="Skip receipe timer"
          >
            <SkipForward className="size-3.5" fill="currentColor" />
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className={`size-8 rounded-full grid place-items-center ${btn}`}
          aria-label="Reset receipe timer"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
