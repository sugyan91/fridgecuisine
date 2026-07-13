// Small session-scoped cache for "rotating" content pools.
// The pool (a larger set of items) is cached in sessionStorage so we don't
// re-fetch on every navigation, but consumers still call pickRandom() on
// each mount to show a fresh slice on every visit / reload.

type Cached<T> = { fetchedAt: number; items: T[] };

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

const DEVICE_ID_KEY = "rotating-pool-device-id";
const SB_TOKEN_PREFIX = "sb-";
const SB_TOKEN_SUFFIX = "-auth-token";

function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        (window.crypto?.randomUUID?.() as string | undefined) ??
        `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "nostore";
  }
}

function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(SB_TOKEN_PREFIX) || !key.endsWith(SB_TOKEN_SUFFIX)) {
        continue;
      }
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { user?: { id?: string } } | null;
      const id = parsed?.user?.id;
      if (typeof id === "string" && id) return id;
    }
  } catch {
    // fall through
  }
  return null;
}

/**
 * Scope a cache key to the current user (if signed in) or a persistent
 * per-device id (for anonymous visitors), so different users on the same
 * browser don't recycle each other's random selections.
 */
export function scopedKey(baseKey: string): string {
  const userId = getCurrentUserId();
  if (userId) return `${baseKey}::u:${userId}`;
  return `${baseKey}::d:${getDeviceId()}`;
}

export async function getRotatingPool<T>(opts: {
  key: string;
  fetcher: () => Promise<T[]>;
  ttlMs?: number;
}): Promise<T[]> {
  const ttl = opts.ttlMs ?? DEFAULT_TTL_MS;
  const key = scopedKey(opts.key);

  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(key);
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
      window.sessionStorage.setItem(key, JSON.stringify(payload));
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