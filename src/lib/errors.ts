import { toast } from "sonner";

// Friendly, consistent error messaging. Log the real error, show the user
// a calm sentence, and keep everything routing through one function so
// copy stays uniform across the app.
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;
  const m = raw.toLowerCase();
  if (m.includes("fetch") || m.includes("network") || m.includes("failed to load"))
    return "We can't reach the kitchen right now. Check your connection and try again.";
  if (m.includes("rate") || m.includes("429") || m.includes("quota") || m.includes("limit"))
    return "You're moving fast! Wait a moment, then try again.";
  if (m.includes("payment") || m.includes("402") || m.includes("credit"))
    return "AI credits are low. Try again shortly.";
  if (m.includes("unauthor") || m.includes("401") || m.includes("forbidden") || m.includes("403"))
    return "Please sign in to continue.";
  if (raw.length > 140) return fallback;
  return raw;
}

export function toastError(err: unknown, fallback?: string) {
  const msg = friendlyError(err, fallback);
  console.error(err);
  toast.error(msg);
  return msg;
}

export function toastSuccess(message: string) {
  toast.success(message);
}

// Small in-memory helper for recent ingredients cached client-side. Kept
// separate from server-persisted preferences so it works while signed out.
const HISTORY_KEY = "fc:ingredient-history";
const MAX_HISTORY = 12;

export function getIngredientHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((v) => typeof v === "string").slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function pushIngredientHistory(items: string[]) {
  if (typeof window === "undefined") return;
  try {
    const existing = getIngredientHistory();
    const merged: string[] = [];
    const seen = new Set<string>();
    for (const it of [...items, ...existing]) {
      const key = it.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(it.trim());
      if (merged.length >= MAX_HISTORY) break;
    }
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}