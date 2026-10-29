import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createClient } from "redis";
import { POST as apply } from "@/app/api/listing-applications/route";
import { __resetMemoryStore, rateLimit } from "@/lib/rate-limit";
import {
  applicationBody,
  closePool,
  hasDatabase,
  resetDatabase,
  setUpDatabase,
} from "../../../../packages/db/test/integration/harness";
import { request } from "./http";

/**
 * The rate limiter against a real Redis — the mocked unit test cannot show
 * that the Lua script runs, that the key expires, or that the count is shared
 * rather than per process.
 *
 *     TEST_REDIS_URL=redis://localhost:6379/15 npm run test:integration
 *
 * Uses (and flushes) whichever Redis database the URL names; keep it a
 * scratch one.
 */

const TEST_REDIS_URL = process.env.TEST_REDIS_URL ?? "";

describe.skipIf(!hasDatabase || !TEST_REDIS_URL)("rate limiting with a real Redis", () => {
  const redis = createClient({ url: TEST_REDIS_URL });

  beforeAll(async () => {
    process.env.REDIS_URL = TEST_REDIS_URL;
    delete (globalThis as Record<string, unknown>).__drEvideRedis;
    await redis.connect();
    await setUpDatabase();
  });
  beforeEach(async () => {
    await redis.flushDb();
    __resetMemoryStore();
    await resetDatabase();
  });
  afterAll(async () => {
    const shared = await (globalThis as { __drEvideRedis?: Promise<{ quit(): Promise<unknown> } | null> }).__drEvideRedis;
    await shared?.quit();
    delete process.env.REDIS_URL;
    await redis.quit();
    await closePool();
  });

  it("counts in Redis, with an expiry, and says when to retry", async () => {
    for (let i = 0; i < 3; i++) expect((await rateLimit("t:key", 3, 60_000)).ok).toBe(true);
    const over = await rateLimit("t:key", 3, 60_000);
    expect(over.ok).toBe(false);
    expect(over.retryAfter).toBeGreaterThan(50);
    expect(over.retryAfter).toBeLessThanOrEqual(60);
    expect(await redis.get("rl:t:key")).toBe("4");
    const ttl = await redis.pTTL("rl:t:key");
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60_000);
  });

  it("keeps the limit when this process's memory is wiped, as on another replica", async () => {
    const ip = "198.51.100.99";
    for (let i = 0; i < 5; i++) {
      expect((await apply(request("POST", "/", { ip, body: applicationBody() }))).status).toBe(201);
      __resetMemoryStore();
    }
    expect((await apply(request("POST", "/", { ip, body: applicationBody() }))).status).toBe(429);
  });

  it("opens a new window once the old one expires", async () => {
    for (let i = 0; i < 2; i++) await rateLimit("t:short", 1, 300);
    expect((await rateLimit("t:short", 1, 300)).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 400));
    expect((await rateLimit("t:short", 1, 300)).ok).toBe(true);
  });
});
