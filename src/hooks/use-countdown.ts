import { useCallback, useEffect, useRef, useState } from "react";

function beep() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.65);
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    /* noop */
  }
}

export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when the initial seconds change (e.g. parent step changed).
  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsFinished(false);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [initialSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const tick = useCallback(() => {
    setSecondsLeft((s) => {
      if (s <= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setIsFinished(true);
        beep();
        return 0;
      }
      return s - 1;
    });
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current || secondsLeft <= 0) return;
    setIsRunning(true);
    setIsFinished(false);
    intervalRef.current = setInterval(tick, 1000);
  }, [tick, secondsLeft]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
    setIsFinished(false);
  }, [initialSeconds]);

  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSecondsLeft(0);
    setIsRunning(false);
    setIsFinished(true);
  }, []);

  return { secondsLeft, isRunning, isFinished, start, pause, reset, skip };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
