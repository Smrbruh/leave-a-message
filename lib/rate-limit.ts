/**
 * Best-effort, in-memory abuse protection. There is deliberately no
 * database here — this is a lightweight guard against casual spam/abuse
 * on a personal endpoint, not a hardened anti-bot system. On serverless
 * platforms each instance keeps its own memory, so this resets on cold
 * starts; that's an acceptable trade-off for a single-person inbox with
 * no persistence requirement. For higher-traffic deployments, swap this
 * for an edge-friendly store (e.g. Upstash Redis) behind the same
 * `checkRateLimit` / `checkDuplicate` interface.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 8;
const DUPLICATE_WINDOW_MS = 20 * 1000; // 20 seconds
const MAX_TRACKED_KEYS = 5000;

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
const recentSubmissions = new Map<string, { fingerprint: string; at: number }>();

function pruneIfNeeded<K, V>(map: Map<K, V>) {
  if (map.size <= MAX_TRACKED_KEYS) return;
  // Cheap unbounded-growth guard: drop the oldest-inserted entries.
  const excess = map.size - MAX_TRACKED_KEYS;
  const keys = map.keys();
  for (let i = 0; i < excess; i++) {
    const next = keys.next();
    if (next.done) break;
    map.delete(next.value);
  }
}

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  if (bucket.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = bucket.timestamps[0] ?? now;
    buckets.set(key, bucket);
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  pruneIfNeeded(buckets);
  return { allowed: true, retryAfterMs: 0 };
}

/** Cheap non-cryptographic fingerprint, just for de-duplication. */
function fingerprint(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/** Guards against a double-click / retry firing the same message twice. */
export function checkDuplicate(key: string, content: string): boolean {
  const now = Date.now();
  const fp = fingerprint(content);
  const last = recentSubmissions.get(key);

  if (last && last.fingerprint === fp && now - last.at < DUPLICATE_WINDOW_MS) {
    return true;
  }

  recentSubmissions.set(key, { fingerprint: fp, at: now });
  pruneIfNeeded(recentSubmissions);
  return false;
}
