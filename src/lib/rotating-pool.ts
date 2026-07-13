// Small session-scoped cache for "rotating" content pools.
// The pool (a larger set of items) is cached in sessionStorage so we don't
// re-fetch on every navigation, but consumers still call pickRandom() on
// each mount to show a fresh slice on every visit / reload.

type Cached<T> = { fetchedAt: number; items: T[] };

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function getRotatingPool<T>(opts: {
  key: string;
  fetcher: () => Promise<T[]>;
  ttlMs?: number;
}): Promise<T[]> {
  const ttl = opts.ttlMs ?? DEFAULT_TTL_MS;

  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(opts.key);
      if (raw) {
        const parsed = JSON.parse(raw) as Cached<T>;
        if (
          parsed &&
          Array.isArray(parsed.items) &&
          typeof parsed.fetchedAt === "number" &&
          Date.now() - parsed.fetchedAt < ttl
        ) {
          return parsed.items;
        }
      }
    } catch {
      // ignore corrupt cache
    }
  }

  const items = await opts.fetcher();

  if (typeof window !== "undefined") {
    try {
      const payload: Cached<T> = { fetchedAt: Date.now(), items };
      window.sessionStorage.setItem(opts.key, JSON.stringify(payload));
    } catch {
      // quota / serialization issues — safe to ignore
    }
  }

  return items;
}

export function pickRandom<T>(items: T[], n: number): T[] {
  if (!Array.isArray(items) || items.length === 0 || n <= 0) return [];
  const arr = items.slice();
  // Fisher-Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
}