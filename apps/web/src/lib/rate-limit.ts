import { createClient, type RedisClientType } from "redis";
import { count } from "./telemetry";

/**
 * A fixed-window rate limiter for /api/route-symptom, which spends money on
 * every call — v1 shipped it unmetered, so anyone who found the endpoint could
 * drain the API key from a loop.
 *
 * Two stores behind one function.
 *
 * **Redis, when REDIS_URL is set.** Shared across instances, survives a deploy,
 * and is the only version that means anything against a caller spread over more
 * than one address or an app running more than one replica.
 *
 * **In-process otherwise.** Per instance, resets on deploy, useless against a
 * distributed caller — but a competent guard against a stuck retry loop or one
 * person hammering the page, and it needs no setup, which keeps `npm run dev`
 * working with nothing installed.
 *
 * **A Redis failure degrades to memory rather than to either extreme.** Failing
 * open would leave the spend unguarded for as long as Redis is down; failing
 * closed would take the product offline because a cache is unreachable. Falling
 * back keeps a real limit in place and keeps the site answering, and
 * `ratelimit.degraded` says it is happening — the same reasoning as the LLM
 * routing fallback, and the same reason that counter exists.
 */

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller may retry. Only meaningful when ok is false. */
  retryAfter: number;
}

/**
 * Increment the window and report where it stands, in one round trip.
 *
 * A Lua script rather than INCR followed by PEXPIRE: those are two commands,
 * and a process that dies between them leaves a key with no expiry, which locks
 * that caller out permanently. Redis runs a script atomically, so the counter
 * and its lifetime are set together or not at all.
 *
 * PTTL is read inside the script for the same reason — a separate round trip
 * could observe a window that has already rolled over and report a nonsense
 * retry-after.
 */
const WINDOW_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return { hits, redis.call('PTTL', KEYS[1]) }
`;

/**
 * The client hangs off globalThis, not a module-level binding, for the reason
 * the pg pool does: Next re-evaluates modules on every save in development, so
 * a module-scoped client is a new connection per edit.
 */
const globalForRedis = globalThis as unknown as {
  __drEvideRedis?: Promise<RedisClientType | null>;
};

function getRedis(): Promise<RedisClientType | null> | null {
  if (!process.env.REDIS_URL) return null;

  globalForRedis.__drEvideRedis ??= (async () => {
    try {
      const client: RedisClientType = createClient({
        url: process.env.REDIS_URL,
        // The caller is waiting on this before their symptom is even read.
        // If Redis has not answered in a second, memory is the better answer.
        socket: { connectTimeout: 1_000, reconnectStrategy: (n) => Math.min(n * 200, 5_000) },
      });
      // node-redis emits 'error' on the client; with no listener Node treats it
      // as an unhandled error event and takes the process down.
      client.on("error", () => count("ratelimit.degraded"));
      await client.connect();
      return client;
    } catch {
      return null;
    }
  })();

  return globalForRedis.__drEvideRedis;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const pending = getRedis();

  if (pending) {
    try {
      const client = await pending;
      if (client) {
        const reply = await client.eval(WINDOW_SCRIPT, {
          keys: [`rl:${key}`],
          arguments: [String(windowMs)],
        });

        // Checked, not cast. A reply of the wrong shape destructures into
        // undefined, `undefined > limit` is false, and the endpoint quietly
        // stops being metered at all — the exact failure this module exists to
        // prevent, arriving as a success. Anything unexpected is a Redis
        // failure and belongs in the fallback below.
        if (!isCounterReply(reply)) throw new Error("unexpected reply");

        const [hits, ttl] = reply;
        return verdict(hits, limit, ttl > 0 ? ttl : windowMs);
      }
    } catch {
      // Unreachable, timed out, script rejected, wrong reply shape — all the
      // same from here. Counted, never logged: the key is derived from the
      // caller's IP and this module is on the path that carries symptom text.
      count("ratelimit.degraded");
    }
  }

  return memoryLimit(key, limit, windowMs);
}

/** `[hits, ttlMs]`, both real numbers. Redis returns integers for both. */
function isCounterReply(reply: unknown): reply is [number, number] {
  return (
    Array.isArray(reply) &&
    reply.length === 2 &&
    reply.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

function verdict(hits: number, limit: number, remainingMs: number): RateLimitResult {
  return hits > limit
    ? { ok: false, retryAfter: Math.max(1, Math.ceil(remainingMs / 1000)) }
    : { ok: true, retryAfter: 0 };
}

// ── The in-process store ───────────────────────────────────────────────────

interface Window {
  count: number;
  /** Epoch ms when this window expires. */
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Stop the map growing without bound on a long-lived server. */
const MAX_TRACKED_KEYS = 10_000;

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_KEYS) evictExpired(now);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  return verdict(existing.count, limit, existing.resetAt - now);
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

/** Test seam. Nothing in the app calls this. */
export function __resetMemoryStore(): void {
  windows.clear();
}

/**
 * A coarse caller identity for rate limiting.
 *
 * Deliberately not stored, not logged, and not combined with the symptom text
 * anywhere — pairing an IP with a health complaint is exactly the linkage the
 * DPDP Act exists to prevent. With Redis it now outlives the request as a key
 * with a one-minute expiry and no value attached to it beyond a count.
 *
 * `x-forwarded-for` is a list the client can prepend to. Taking the *first*
 * entry therefore reads whatever the caller wrote, so a script wanting an
 * unlimited quota only has to send a new fake IP each request. The trustworthy
 * entry is the one your own edge appended, counted from the right.
 *
 * Each proxy appends the address it received the request *from*, and never its
 * own — so N proxies in front of the app leave N−1 of them in the header, and
 * the real client sits at `length - N`:
 *
 *     one proxy      X-Forwarded-For: <spoofed…>, <real client>
 *                                                  ▲ length - 1
 *
 *     two proxies    X-Forwarded-For: <spoofed…>, <real client>, <proxy 1>
 *                                                  ▲ length - 2
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
