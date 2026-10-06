// Exports the launch-notification list as CSV.
// Usage: DATABASE_URL=... npm run notify:export > launch-list.csv
//
// /api/notify has always written addresses to `launch_notifications` and
// nothing has ever read them back. That made the form's promise — "one email
// at launch" — unkeepable in practice: the addresses were in a table nobody
// could get at without opening psql.
//
// This is deliberately an export rather than a sender. Choosing an email
// vendor is a decision with a contract and a data-processing agreement behind
// it, and this product stores exactly one personal identifier — routing it
// through a third party is not something to settle by picking whichever SDK
// was easiest to install. A CSV a person sends from is a promise that can be
// kept today, and it stays honest about the fact that a human is doing it.
//
// The output goes to stdout so it is never written to disk by accident. It is
// the only list of contact details this product holds; treat the file you
// redirect it into accordingly, and delete it when the send is done.
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set — there is no list to export.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(
  `SELECT email, lang, created_at
     FROM launch_notifications
    ORDER BY created_at`
);
await client.end();

/**
 * Minimal RFC 4180 quoting. An address cannot contain a comma or a quote and
 * still be valid, but this table is a place someone will one day paste a name
 * into, and a CSV that breaks on the one row that matters is worse than none.
 */
const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

process.stdout.write("email,lang,created_at\n");
for (const r of rows) {
  process.stdout.write(
    [cell(r.email), cell(r.lang), cell(new Date(r.created_at).toISOString())].join(",") + "\n"
  );
}

// stderr, so it never lands in the CSV.
console.error(`${rows.length} address${rows.length === 1 ? "" : "es"} exported.`);
