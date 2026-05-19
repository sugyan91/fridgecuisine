import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useCountdown, formatTime } from "@/hooks/use-countdown";

type Props = {
  minutes: number;
  variant?: "light" | "dark";
};

export function StepTimer({ minutes, variant = "light" }: Props) {
  const { secondsLeft, isRunning, isFinished, start, pause, reset, skip } =
    useCountdown(Math.max(1, Math.round(minutes * 60)));

  const base =
    variant === "dark"
      ? "bg-white/15 text-white border-white/30"
      : "bg-white text-foreground border-border";
  const btn =
    variant === "dark"
      ? "hover:bg-white/20 text-white"
      : "hover:bg-foreground/10 text-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1 border-2 rounded-full pl-2 pr-1 py-0.5 font-mono text-[11px] font-bold tabular-nums ${base}`}
      data-finished={isFinished || undefined}
    >
      <span className={isFinished ? "text-paprika" : ""}>
        {isFinished ? "DONE" : formatTime(secondsLeft)}
      </span>
      {!isRunning && !isFinished && (
        <button
          type="button"
          onClick={start}
          aria-label="Start timer"
          className={`p-1 rounded-full ${btn}`}
        >
          <Play className="size-3" fill="currentColor" />
        </button>
      )}
      {isRunning && (
        <button
          type="button"
          onClick={pause}
          aria-label="Pause timer"
          className={`p-1 rounded-full ${btn}`}
        >
          <Pause className="size-3" fill="currentColor" />
        </button>
      )}
      {!isFinished && (
        <button
          type="button"
          onClick={skip}
          aria-label="Skip timer"
          className={`p-1 rounded-full ${btn}`}
        >
          <SkipForward className="size-3" fill="currentColor" />
        </button>
      )}
      <button
        type="button"
        onClick={reset}
        aria-label="Reset timer"
        className={`p-1 rounded-full ${btn}`}
      >
        <RotateCcw className="size-3" />
      </button>
    </span>
  );
}
