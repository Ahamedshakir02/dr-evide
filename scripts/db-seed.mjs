// Seeds specialties + sample doctors. Usage: DATABASE_URL=... npm run db:seed
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { doctors } = JSON.parse(readFileSync(join(root, "db", "sample-doctors.json"), "utf8"));

// Keep in sync with SPECIALTIES in src/lib/taxonomy.ts.
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
  await client.query(
    `INSERT INTO doctors (
       full_name, specialty_slug, sub_specialties, conditions, qualifications,
       qualification_level, nmc_reg_no, nmc_verified, reg_year, clinic_name,
       address, town, phone, fee_inr, timings, lat, lng,
       review_count, review_avg, review_authenticity, is_sample
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      d.full_name, d.specialty_slug, d.sub_specialties, d.conditions, d.qualifications,
      d.qualification_level, d.nmc_reg_no, d.nmc_verified, d.reg_year, d.clinic_name,
      d.address, d.town, d.phone, d.fee_inr, d.timings, d.lat, d.lng,
      d.review_count, d.review_avg, d.review_authenticity, d.is_sample,
    ]
  );
}

await client.end();
console.log(`Seeded ${specialties.length} specialties and ${doctors.length} sample doctors.`);
