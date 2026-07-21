// Seeds specialties + sample doctors. Usage: DATABASE_URL=... npm run db:seed
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
// The one copy of the sample dataset, shared with both apps.
const { doctors } = JSON.parse(
  readFileSync(join(here, "..", "core", "src", "sample-doctors.json"), "utf8")
);

// Mirrors SPECIALTIES in packages/core/src/taxonomy.ts. This script is plain
// Node and cannot import the TypeScript module, so the list is repeated here —
// taxonomy.test.ts parses this file and fails if the two ever drift.
const specialties = [
  ["dermatology", "Dermatology", "Skin, hair, and nail problems"],
  ["cardiology", "Cardiology", "Heart and circulation problems"],
  ["general", "General Physician", "Fever, infections, and everyday illness"],
  ["dental", "Dental", "Teeth and gum problems"],
  ["ent", "ENT", "Ear, nose, throat, and sinus problems"],
  ["pediatrics", "Pediatrics", "Illness and growth in children"],
  ["orthopedics", "Orthopedics", "Bones, joints, muscles, and back problems"],
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

for (const [slug, name, description] of specialties) {
  await client.query(
    `INSERT INTO specialties (slug, name, description) VALUES ($1,$2,$3)
     ON CONFLICT (slug) DO NOTHING`,
    [slug, name, description]
  );
}

for (const d of doctors) {
  const { rows } = await client.query(
    `INSERT INTO doctors (
       full_name, specialty_slug, sub_specialties, conditions, qualifications,
       qualification_level, nmc_reg_no, nmc_verified, reg_year, clinic_name,
       address, town, phone, fee_inr, timings, lat, lng,
       review_count, review_avg, review_authenticity, is_sample
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     RETURNING id`,
    [
      d.full_name, d.specialty_slug, d.sub_specialties, d.conditions, d.qualifications,
      d.qualification_level, d.nmc_reg_no, d.nmc_verified, d.reg_year, d.clinic_name,
      d.address, d.town, d.phone, d.fee_inr, d.timings, d.lat, d.lng,
      d.review_count, d.review_avg, d.review_authenticity, d.is_sample,
    ]
  );

  // Every nmc_verified=true needs a story. For sample data the honest story is
  // that nobody checked anything — recording that is the point. A real import
  // writes the registry URL and the name of whoever signed off; a verified
  // doctor with no provenance row should be treated as unverified.
  await client.query(
    `INSERT INTO credential_provenance (doctor_id, source, evidence_url, verified_by, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      rows[0].id,
      "sample-data",
      null,
      "db/seed.mjs",
      "Fictional record. No credential was verified against any registry.",
    ]
  );
}

await client.end();
console.log(`Seeded ${specialties.length} specialties and ${doctors.length} sample doctors.`);
console.log("All records are fictional (is_sample=true) with sample-data provenance.");
