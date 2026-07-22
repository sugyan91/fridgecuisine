import { useEffect, useState, useCallback } from "react";
import type { UnitSystem } from "@/lib/units";

const KEY = "fc-unit-system";

export function useUnitSystem(): [UnitSystem, (u: UnitSystem) => void] {
  const [system, setSystem] = useState<UnitSystem>("us");

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "metric" || v === "us") setSystem(v);
    } catch { /* ignore */ }
  }, []);

  const set = useCallback((u: UnitSystem) => {
    setSystem(u);
    try { localStorage.setItem(KEY, u); } catch { /* ignore */ }
  }, []);

  return [system, set];
}