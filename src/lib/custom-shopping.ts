// Extra, ad-hoc shopping items added from recipes ("Add missing to list").
// Persisted in localStorage; /list merges these with plan-derived items.

const KEY = "fc-custom-shopping";

export function readCustomShopping(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function writeCustomShopping(items: string[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function addCustomShopping(items: string[]): string[] {
  const cur = readCustomShopping();
  const seen = new Set(cur.map((s) => s.toLowerCase()));
  const next = [...cur];
  for (const raw of items) {
    const t = raw.trim();
    if (t && !seen.has(t.toLowerCase())) {
      next.push(t);
      seen.add(t.toLowerCase());
    }
  }
  writeCustomShopping(next);
  return next;
}

export function removeCustomShopping(item: string): string[] {
  const next = readCustomShopping().filter((s) => s.toLowerCase() !== item.toLowerCase());
  writeCustomShopping(next);
  return next;
}

export function clearCustomShopping(): void {
  writeCustomShopping([]);
}