// Applies schema.sql. Usage: DATABASE_URL=... npm run db:migrate
//
// The file is idempotent (IF NOT EXISTS throughout), so this runs on every
// deploy: a new table or column lands, existing data is untouched. One
// transaction, so a failed migration leaves the previous schema in place.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "schema.sql"), "utf8");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query("BEGIN");
try {
  await client.query(sql);
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  console.error("Migration failed and was rolled back:", e.message);
  await client.end();
  process.exit(1);
}
await client.end();
console.log("Schema is up to date.");
