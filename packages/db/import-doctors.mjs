// Imports real, consenting doctors from a CSV. Usage:
//
//   DATABASE_URL=... node import-doctors.mjs doctors.csv [--dry-run] [--verified-by "Name"]
//
// This is the only path real people enter the database by. Three rules it
// enforces rather than leaves to whoever runs it:
//
//   1. No consent, no row. A `consent` column must say "yes" for every doctor.
//   2. Nobody is marked verified by default. A row becomes nmc_verified only when
//      --verified-by names the person who checked AND the row carries the
//      `evidence_url` they checked against; that pair is written to
//      credential_provenance. A verified doctor with no provenance row is
//      treated as unverified (see seed.mjs).
//   3. All or nothing. One bad row aborts the whole file, so a half-imported
//      list never has to be reasoned about.
//
// Plain Node, so it cannot import the TypeScript schemas. Specialty slugs are
// therefore checked against the `specialties` table, which seed.mjs fills from
// the one taxonomy — the database stays the single list.
import { readFileSync } from "node:fs";
import pg from "pg";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--verified-by");
const dryRun = args.includes("--dry-run");
const vIdx = args.indexOf("--verified-by");
const verifiedBy = vIdx >= 0 ? (args[vIdx + 1] ?? "").trim() : "";

if (!file) {
  console.error('Usage: node import-doctors.mjs <file.csv> [--dry-run] [--verified-by "Name"]');
  process.exit(2);
}
if (vIdx >= 0 && !verifiedBy) {
  console.error("--verified-by needs the name of the person who checked the registers.");
  process.exit(2);
}

/** Minimal RFC-4180 reader: quoted fields, doubled quotes, CRLF. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const raw = readFileSync(file, "utf8");
// Excel writes a byte-order mark; it would otherwise glue itself to the first header.
const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
const [header, ...body] = parseCsv(text);
if (!header) {
  console.error("The file is empty.");
  process.exit(1);
}
const cols = header.map((h) => h.trim());
const records = body.map((cells) =>
  Object.fromEntries(cols.map((c, i) => [c, (cells[i] ?? "").trim()]))
);

const list = (s) => s.split(";").map((x) => x.trim()).filter(Boolean);
const int = (s) => (s === "" ? null : Number(s));
const SOURCES = ["nmc-registry", "state-council", "manual-review"];

let known = null;
let existingRegNos = new Set();
let client = null;
if (process.env.DATABASE_URL) {
  client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  known = new Set((await client.query("SELECT slug FROM specialties")).rows.map((r) => r.slug));
  existingRegNos = new Set(
    (await client.query("SELECT nmc_reg_no FROM doctors WHERE nmc_reg_no IS NOT NULL")).rows.map(
      (r) => r.nmc_reg_no
    )
  );
} else if (dryRun) {
  console.warn("No DATABASE_URL: dry run checks structure only, not specialties or duplicates.");
} else {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const errors = [];
const seenRegNos = new Set();
const parsed = records.map((r, i) => {
  const line = i + 2; // header is line 1
  const bad = (msg) => errors.push(`line ${line} (${r.full_name || "unnamed"}): ${msg}`);

  if (r.consent.toLowerCase() !== "yes") bad("consent is not 'yes' — do not list without it");
  if (!r.full_name) bad("full_name is required");
  if (known && !known.has(r.specialty_slug)) {
    bad(`unknown specialty '${r.specialty_slug}' (known: ${[...known].join(", ")})`);
  }
  const lat = Number(r.lat);
  const lng = Number(r.lng);
  if (!r.lat || !r.lng || !(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180)) {
    bad("lat/lng must be numbers in range — look the clinic up on a map");
  }
  const level = int(r.qualification_level) ?? 1;
  if (![1, 2, 3, 4].includes(level)) bad("qualification_level must be 1, 2, 3 or 4");
  if (!r.nmc_reg_no) bad("nmc_reg_no is required: it is what a patient can check us against");
  if (r.nmc_reg_no) {
    if (seenRegNos.has(r.nmc_reg_no) || existingRegNos.has(r.nmc_reg_no)) {
      bad(`registration number ${r.nmc_reg_no} is already listed`);
    }
    seenRegNos.add(r.nmc_reg_no);
  }
  for (const k of ["reg_year", "fee_inr"]) {
    if (r[k] !== "" && !Number.isInteger(Number(r[k]))) bad(`${k} must be a whole number`);
  }

  const verify = Boolean(verifiedBy && r.evidence_url);
  if (verify) {
    const source = r.verification_source || "nmc-registry";
    if (!SOURCES.includes(source)) bad(`verification_source must be one of ${SOURCES.join(", ")}`);
  }
  return { r, lat, lng, level, verify };
});

if (errors.length) {
  console.error(`Nothing imported. ${errors.length} problem(s):\n- ${errors.join("\n- ")}`);
  await client?.end();
  process.exit(1);
}

const nVerified = parsed.filter((p) => p.verify).length;
console.log(
  `${parsed.length} doctor(s) ok; ${nVerified} will be marked verified, ${parsed.length - nVerified} will not.`
);
if (dryRun) {
  console.log("Dry run — nothing written.");
  await client?.end();
  process.exit(0);
}

try {
  await client.query("BEGIN");
  for (const { r, lat, lng, level, verify } of parsed) {
    const { rows } = await client.query(
      `INSERT INTO doctors (
         full_name, specialty_slug, conditions, qualifications, qualification_level,
         nmc_reg_no, nmc_verified, reg_year, clinic_name, address, town, phone,
         fee_inr, timings, lat, lng, is_sample
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false)
       RETURNING id`,
      [
        r.full_name, r.specialty_slug, list(r.conditions).map((c) => c.toLowerCase()),
        list(r.qualifications), level, r.nmc_reg_no, verify, int(r.reg_year),
        r.clinic_name || null, r.address || null, r.town || null, r.phone || null,
        int(r.fee_inr), r.timings || null, lat, lng,
      ]
    );
    if (verify) {
      await client.query(
        `INSERT INTO credential_provenance (doctor_id, source, evidence_url, verified_by, note)
         VALUES ($1,$2,$3,$4,$5)`,
        [rows[0].id, r.verification_source || "nmc-registry", r.evidence_url, verifiedBy, r.note || null]
      );
    }
  }
  await client.query("COMMIT");
  console.log(`Imported ${parsed.length} doctor(s).`);
} catch (e) {
  await client.query("ROLLBACK");
  console.error("Import failed and was rolled back:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
