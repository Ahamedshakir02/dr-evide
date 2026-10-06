import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The rate limiter on /api/route-symptom.
 *
 * It is the only thing standing between a stuck retry loop and the API bill,
 * so the cases that matter are the boundary (the limit is a limit, not an
 * approximation) and the failure mode (Redis going away must not take the
 * product with it, and must not silently unmeter the endpoint either).
 *
 * The Redis client is mocked rather than run. A real server would be a better
 * test and there was no daemon available on this machine — what is checked here
 * is our side of the contract: the script is issued once per call with the right
 * key and window, the reply is read correctly, and every way it can go wrong
 * lands on the in-process store.
 */

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));

vi.mock("redis", () => ({ createClient }));

import { __resetMemoryStore, callerKey, rateLimit } from "@/lib/rate-limit";
import { snapshot } from "@/lib/telemetry";

/** A stand-in Redis whose `eval` the test controls. */
function fakeRedis(evalImpl: (...args: unknown[]) => unknown) {
  const client = {
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    eval: vi.fn(evalImpl),
  };
  createClient.mockReturnValue(client);
  return client;
}

/** Redis is chosen by REDIS_URL, and the client is cached on globalThis. */
function useRedis(evalImpl: (...args: unknown[]) => unknown) {
  process.env.REDIS_URL = "redis://localhost:6379";
  delete (globalThis as Record<string, unknown>).__drEvideRedis;
  return fakeRedis(evalImpl);
}

beforeEach(() => {
  createClient.mockReset();
  __resetMemoryStore();
  delete process.env.REDIS_URL;
  delete (globalThis as Record<string, unknown>).__drEvideRedis;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("with no shared store configured", () => {
  it("allows a caller up to the limit and refuses the next one", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await rateLimit("a", 5, 60_000)).ok, `request ${i + 1}`).toBe(true);
    }

    const refused = await rateLimit("a", 5, 60_000);
    expect(refused.ok).toBe(false);
    expect(refused.retryAfter).toBeGreaterThan(0);
  });

  it("never reports a retry-after of zero when it refuses", async () => {
    // A "wait 0 seconds" on a 429 invites an immediate retry, which is the one
    // behaviour a rate limiter exists to prevent.
    vi.useFakeTimers();
    vi.setSystemTime(0);
    await rateLimit("b", 1, 60_000);
    vi.setSystemTime(59_999);

    expect(await rateLimit("b", 1, 60_000)).toEqual({ ok: false, retryAfter: 1 });
  });

  it("keeps callers separate", async () => {
    await rateLimit("first", 1, 60_000);
    await rateLimit("first", 1, 60_000);

    expect((await rateLimit("second", 1, 60_000)).ok).toBe(true);
  });

  it("lets the caller back in once the window has passed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    await rateLimit("c", 1, 1_000);
    expect((await rateLimit("c", 1, 1_000)).ok).toBe(false);

    vi.setSystemTime(1_001);
    expect((await rateLimit("c", 1, 1_000)).ok).toBe(true);
  });

  it("does not call Redis at all", async () => {
    await rateLimit("d", 5, 60_000);
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe("with Redis configured", () => {
  it("counts through the shared store", async () => {
    let hits = 0;
    const client = useRedis(() => [++hits, 30_000]);

    for (let i = 0; i < 3; i++) expect((await rateLimit("x", 3, 60_000)).ok).toBe(true);
    const refused = await rateLimit("x", 3, 60_000);

    expect(refused).toEqual({ ok: false, retryAfter: 30 });
    expect(client.eval).toHaveBeenCalledTimes(4);
  });

  it("namespaces the key and passes the window as the expiry", async () => {
    const client = useRedis(() => [1, 60_000]);
    await rateLimit("203.0.113.9", 20, 60_000);

    const [script, options] = client.eval.mock.calls[0] as [string, Record<string, unknown>];
    expect(options).toEqual({ keys: ["rl:203.0.113.9"], arguments: ["60000"] });
    // One round trip, and the expiry set in the same script as the increment:
    // an INCR that is not followed by its PEXPIRE locks a caller out forever.
    expect(script).toMatch(/INCR/);
    expect(script).toMatch(/PEXPIRE/);
  });

  it("falls back to the window length when the key reports no TTL", async () => {
    // PTTL answers -1 for a key with no expiry and -2 for one that is gone.
    // Either would produce a negative retry-after passed through unchecked.
    useRedis(() => [99, -1]);
    expect(await rateLimit("y", 1, 45_000)).toEqual({ ok: false, retryAfter: 45 });
  });
});

describe("when the shared store fails", () => {
  const failures: [string, () => unknown][] = [
    ["eval rejects", () => Promise.reject(new Error("READONLY"))],
    ["eval throws", () => {
      throw new Error("connection lost");
    }],
    ["the reply is not a pair", () => "OK"],
    ["the reply is empty", () => []],
    ["the reply holds nulls", () => [null, null]],
  ];

  it.each(failures)("keeps limiting in memory when %s", async (_label, evalImpl) => {
    useRedis(evalImpl);

    // The endpoint stays up...
    expect((await rateLimit("z", 2, 60_000)).ok).toBe(true);
    expect((await rateLimit("z", 2, 60_000)).ok).toBe(true);
    // ...and stays metered. Failing open here would leave the API key
    // unguarded for as long as Redis is down.
    expect((await rateLimit("z", 2, 60_000)).ok).toBe(false);
  });

  it("says so, rather than degrading silently", async () => {
    useRedis(() => Promise.reject(new Error("down")));
    const before = snapshot()["ratelimit.degraded"] ?? 0;

    await rateLimit("w", 5, 60_000);

    expect(snapshot()["ratelimit.degraded"]).toBe(before + 1);
  });

  it("keeps working when the client cannot even be constructed", async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    delete (globalThis as Record<string, unknown>).__drEvideRedis;
    createClient.mockImplementation(() => {
      throw new Error("bad url");
    });

    expect((await rateLimit("v", 1, 60_000)).ok).toBe(true);
    expect((await rateLimit("v", 1, 60_000)).ok).toBe(false);
  });

  it("attaches an error listener, because node-derived error events kill the process", async () => {
    const client = useRedis(() => [1, 1_000]);
    await rateLimit("u", 5, 60_000);

    expect(client.on).toHaveBeenCalledWith("error", expect.any(Function));
  });
});

describe("identifying the caller", () => {
  const withHeaders = (h: Record<string, string>) => new Request("https://x.test", { headers: h });

  afterEach(() => {
    delete process.env.TRUSTED_PROXY_HOPS;
  });

  it("reads the entry our edge appended, not the one the client wrote", () => {
    // The attack this defends against: a script prepends a fresh fake IP on
    // every request and gets an unlimited quota. Behind one proxy the real
    // client is the last entry; everything before it is attacker-controlled.
    const req = withHeaders({ "x-forwarded-for": "1.1.1.1, 9.9.9.9, 203.0.113.9" });
    expect(callerKey(req)).toBe("203.0.113.9");
  });

  it("counts from the right by TRUSTED_PROXY_HOPS", () => {
    // Two proxies leave one of them in the header, so the client is at -2.
    process.env.TRUSTED_PROXY_HOPS = "2";
    const req = withHeaders({ "x-forwarded-for": "1.1.1.1, 203.0.113.9, 10.0.0.1" });
    expect(callerKey(req)).toBe("203.0.113.9");
  });

  it("never reads past the start of the list", () => {
    process.env.TRUSTED_PROXY_HOPS = "99";
    expect(callerKey(withHeaders({ "x-forwarded-for": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it.each([["0"], ["-1"], ["abc"], [""]])("treats %s hops as one", (hops) => {
    process.env.TRUSTED_PROXY_HOPS = hops;
    expect(callerKey(withHeaders({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" }))).toBe(
      "203.0.113.9"
    );
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(callerKey(withHeaders({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(callerKey(withHeaders({}))).toBe("unknown");
  });

  it("ignores an empty forwarded-for rather than keying on blank", () => {
    expect(callerKey(withHeaders({ "x-forwarded-for": " , ,", "x-real-ip": "198.51.100.4" }))).toBe(
      "198.51.100.4"
    );
  });
});
