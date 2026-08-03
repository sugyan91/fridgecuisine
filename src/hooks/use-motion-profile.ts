import { useEffect, useState } from "react";

export type MotionProfile = {
  /** User asked for reduced motion — show static art only. */
  reduceMotion: boolean;
  /** Low-end device / data saver — cheap animations, no particles or blur. */
  lite: boolean;
};

const DEFAULT: MotionProfile = { reduceMotion: false, lite: true };

/**
 * Detects reduced-motion preference and low-end device signals so celebration
 * animations can degrade gracefully. SSR-safe: starts in the cheapest mode and
 * upgrades after hydration, so the heavy variant never renders on the server.
 */
export function useMotionProfile(): MotionProfile {
  const [profile, setProfile] = useState<MotionProfile>(DEFAULT);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };

    const compute = () => {
      const cores = nav.hardwareConcurrency ?? 4;
      const memory = nav.deviceMemory ?? 4;
      const conn = nav.connection;
      const slowNetwork =
        !!conn?.saveData || !!conn?.effectiveType?.match(/(^|-)2g$/);
      const lite = cores <= 4 || memory <= 4 || slowNetwork;
      setProfile({ reduceMotion: mq.matches, lite });
    };

    compute();
    mq.addEventListener("change", compute);
    return () => mq.removeEventListener("change", compute);
  }, []);

  return profile;
}
