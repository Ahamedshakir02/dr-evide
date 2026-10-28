import { Pool } from "pg";

/**
 * The pool hangs off globalThis, not a module-level `let`.
 *
 * Next's dev server re-evaluates modules on every save, so a module-scoped pool
 * is a new pool per edit — ten more connections each time, until Postgres stops
 * accepting them. In production the module is evaluated once and this behaves
 * identically to a plain variable.
 */
const globalForPg = globalThis as unknown as { __drEvidePool?: Pool };

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForPg.__drEvidePool) {
    globalForPg.__drEvidePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Managed Postgres (Neon, Supabase, RDS) requires TLS. `sslmode=require`
      // in the URL is the usual way to ask for it; DATABASE_SSL=true is the
      // escape hatch for providers whose URLs do not carry it.
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
      // A doctor search is a single indexed lookup; if it has not answered in
      // five seconds the database is unhealthy and the user is better served by
      // an error than a spinner.
      connectionTimeoutMillis: 5_000,
      statement_timeout: 5_000,
      max: Number(process.env.DATABASE_POOL_MAX) || 10,
    });
  }
  return globalForPg.__drEvidePool;
}

/**
 * Where doctors come from.
 *
 * - `database` — DATABASE_URL is set. The real product.
 * - `sample`   — no database, and fictional data is allowed: always in
 *                development, and in production only with ALLOW_SAMPLE_DATA=true
 *                (a preview deployment someone has deliberately asked for).
 * - `unconfigured` — production with no database. Every doctor query throws
 *                DataUnavailableError and the API answers 503.
 *
 * Until v0.5 a production deployment with a missing DATABASE_URL quietly served
 * twenty invented doctors to the public, marked only by a banner. A missing
 * environment variable is a deploy mistake; it should look like one.
 */
export type DataMode = "database" | "sample" | "unconfigured";

/** Fictional records may be shown: development, or an explicit opt-in. */
export function sampleDataAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_SAMPLE_DATA === "true";
}

export function dataMode(): DataMode {
  if (process.env.DATABASE_URL) return "database";
  return sampleDataAllowed() ? "sample" : "unconfigured";
}

/** True when the app is serving the bundled fictional records instead of a database. */
export const isSampleMode = (): boolean => dataMode() === "sample";

export class DataUnavailableError extends Error {
  constructor() {
    super("No database is configured for this deployment.");
    this.name = "DataUnavailableError";
  }
}

/** A pool, or the reason there is none. For every write path. */
export function requirePool(): Pool {
  const p = getPool();
  if (!p) throw new DataUnavailableError();
  return p;
}

/**
 * Is the database reachable? For /api/health only.
 *
 * Returns a string rather than throwing, because a health endpoint that throws
 * tells a load balancer less than one that answers.
 */
export async function checkDatabase(): Promise<"sample" | "ok" | "unreachable" | "unconfigured"> {
  const p = getPool();
  if (!p) return dataMode() === "sample" ? "sample" : "unconfigured";
  try {
    await p.query("SELECT 1");
    return "ok";
  } catch {
    return "unreachable";
  }
}
