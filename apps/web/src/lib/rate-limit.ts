/**
 * A fixed-window rate limiter, in memory.
 *
 * /api/route-symptom spends money on every call, and v1 shipped it unmetered —
 * anyone who found the endpoint could drain the API key from a loop.
 *
 * Honest about what this is: the counter lives in the process, so it is per
 * instance, resets on deploy, and does nothing against a distributed caller. It
 * is a competent guard against a stuck retry loop or one person hammering the
 * page, which is the realistic threat at launch scale. Move to Redis or an edge
 * limiter before this runs on more than one instance.
 */

interface Window {
  count: number;
  /** Epoch ms when this window expires. */
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Stop the map growing without bound on a long-lived server. */
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may retry. Only meaningful when ok is false. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_KEYS) evictExpired(now);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

function evictExpired(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  // Everything is still live — drop the oldest to bound memory rather than
  // refuse service.
  if (windows.size >= MAX_TRACKED_KEYS) {
    const oldest = windows.keys().next().value;
    if (oldest !== undefined) windows.delete(oldest);
  }
}

/**
 * A coarse caller identity for rate limiting.
 *
 * Deliberately not stored, not logged, and not combined with the symptom text
 * anywhere — pairing an IP with a health complaint is exactly the linkage the
 * DPDP Act exists to prevent. It lives only as a map key, in memory, for the
 * length of one window.
 *
 * `x-forwarded-for` is a list the client can prepend to. Taking the *first*
 * entry therefore reads whatever the caller wrote, so a script wanting an
 * unlimited quota only has to send a new fake IP each request. The trustworthy
 * entry is the one the nearest proxy appended, counted from the right:
 *
 *     X-Forwarded-For: <client-supplied…>, <real client>, <proxy 1>, <proxy 2>
 *                                           ▲
 *                                           TRUSTED_PROXY_HOPS = 2
 *
 * Set TRUSTED_PROXY_HOPS to the number of proxies you actually run in front of
 * the app. It defaults to 1, which is right for a single reverse proxy or a
 * platform edge, and never reads past the start of the list.
 */
export function callerKey(req: Request): string {
  const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1) || 1);

  const chain = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const trusted = chain.length ? chain[Math.max(0, chain.length - hops)] : undefined;
  return trusted || req.headers.get("x-real-ip") || "unknown";
}
