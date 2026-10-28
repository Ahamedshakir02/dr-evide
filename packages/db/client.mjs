// The connection settings every plain-Node script under packages/db shares.
//
// Mirrors src/pool.ts: managed Postgres (Neon, Supabase, RDS) needs TLS, which
// is normally asked for with `sslmode=require` in the URL. DATABASE_SSL=true is
// the escape hatch for providers whose URLs do not carry it. Without this the
// app could reach the database and `npm run db:migrate` on deploy could not.
//
// DATABASE_URL_UNPOOLED wins when set. Neon's Vercel integration provides both:
// the app uses the pooled URL, while migrations and admin scripts want a direct
// session, which a transaction-mode pooler does not promise.
import pg from "pg";

export function clientConfig() {
  return {
    connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    connectionTimeoutMillis: 10_000,
  };
}

export function newClient() {
  return new pg.Client(clientConfig());
}
