// The Vercel build command (see apps/web/vercel.json).
//
// Production deploys bring the database up to date, then build:
//
//   1. npm run db:migrate   schema.sql, idempotent, one transaction
//   2. npm run db:seed      the specialties table only (ON CONFLICT DO NOTHING)
//   3. next build
//
// Migrations run before the build because a build against a fresh database
// would otherwise be the first thing to touch it. The schema only ever adds
// (IF NOT EXISTS throughout), so if the build then fails the live deployment
// keeps working against the extra tables and columns.
//
// Preview deploys skip the database unless MIGRATE_ON_PREVIEW=true. A preview
// is an unmerged branch: if its env vars point at the production database, a
// schema change would land there before anyone had reviewed it. Set the flag
// only on a preview environment that has its own database.
//
// A production deploy with no DATABASE_URL fails here instead of shipping a
// site whose every search answers 503. ALLOW_SAMPLE_DATA=true is the one
// deliberate way past that, for a demo deployment someone asked for.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = process.env.VERCEL_ENV ?? "development";

function run(script) {
  console.log(`\n> npm run ${script}`);
  const r = spawnSync("npm", ["run", script], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\n"npm run ${script}" failed (exit ${r.status ?? r.signal}). Deploy stopped.`);
    process.exit(r.status || 1);
  }
}

const hasDb = Boolean(process.env.DATABASE_URL);
const sampleOk = process.env.ALLOW_SAMPLE_DATA === "true";
const migrate =
  env === "production" ? hasDb : hasDb && process.env.MIGRATE_ON_PREVIEW === "true";

if (env === "production" && !hasDb && !sampleOk) {
  console.error(
    "DATABASE_URL is not set for Production. Without it every doctor search answers 503.\n" +
      "Add it under Vercel → Settings → Environment Variables (Production), or set\n" +
      "ALLOW_SAMPLE_DATA=true if this deployment is meant to show fictional doctors."
  );
  process.exit(1);
}

if (migrate) {
  run("db:migrate");
  run("db:seed");
} else {
  console.log(`Skipping database migration (VERCEL_ENV=${env}, DATABASE_URL ${hasDb ? "set" : "unset"}).`);
}

run("build");
