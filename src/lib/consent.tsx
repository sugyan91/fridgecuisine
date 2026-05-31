import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ConsentCategories = {
  essential: true; // always on
  analytics: boolean;
};

export type ConsentState = {
  decided: boolean;
  categories: ConsentCategories;
  updatedAt: string | null;
};

const STORAGE_KEY = "fc-cookie-consent-v1";
const DEFAULT: ConsentState = {
  decided: false,
  categories: { essential: true, analytics: false },
  updatedAt: null,
};

function read(): ConsentState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      decided: !!parsed.decided,
      categories: {
        essential: true,
        analytics: !!parsed?.categories?.analytics,
      },
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return DEFAULT;
  }
}

function write(state: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("fc:consent-changed", { detail: state }));
  } catch {}
}

type ConsentContextValue = ConsentState & {
  acceptAll: () => void;
  rejectAll: () => void;
  save: (categories: Partial<ConsentCategories>) => void;
  reopen: () => void;
  bannerOpen: boolean;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConsentState>(DEFAULT);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const s = read();
    setState(s);
    if (!s.decided) setBannerOpen(true);
  }, []);

  const commit = useCallback((analytics: boolean) => {
    const next: ConsentState = {
      decided: true,
      categories: { essential: true, analytics },
      updatedAt: new Date().toISOString(),
    };
    setState(next);
    write(next);
    setBannerOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      ...state,
      bannerOpen,
      acceptAll: () => commit(true),
      rejectAll: () => commit(false),
      save: (c) => commit(!!c.analytics),
      reopen: () => setBannerOpen(true),
    }),
    [state, bannerOpen, commit],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}

export function getConsentSnapshot(): ConsentState {
  return read();
}