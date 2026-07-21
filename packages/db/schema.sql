-- Dr Evide v1 schema (Postgres + PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS specialties (
  slug        text PRIMARY KEY,
  name        text NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS doctors (
  id                   serial PRIMARY KEY,
  full_name            text NOT NULL,
  specialty_slug       text NOT NULL REFERENCES specialties(slug),
  sub_specialties      text[] DEFAULT '{}',
  conditions           text[] DEFAULT '{}',      -- conditions this doctor commonly treats (lowercase keywords)
  qualifications       text[] DEFAULT '{}',      -- e.g. {MBBS, MD Dermatology}
  qualification_level  int    DEFAULT 1,         -- 1=MBBS/BDS, 2=PG diploma, 3=MD/MS/MDS, 4=DM/MCh/super-specialty
  nmc_reg_no           text,
  nmc_verified         boolean DEFAULT false,
  reg_year             int,                      -- registration year (experience proxy)
  clinic_name          text,
  address              text,
  town                 text,
  phone                text,
  fee_inr              int,
  timings              text,
  lat                  double precision NOT NULL,
  lng                  double precision NOT NULL,
  geom                 geography(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
  review_count         int    DEFAULT 0,
  review_avg           real   DEFAULT 0,         -- 0..5
  review_authenticity  real   DEFAULT 1,         -- 0..1 multiplier after spam/burst analysis
  is_sample            boolean DEFAULT false,    -- true = placeholder data, not a real person
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doctors_geom_idx ON doctors USING GIST (geom);
CREATE INDEX IF NOT EXISTS doctors_specialty_idx ON doctors (specialty_slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- Credential provenance
--
-- doctors.nmc_verified is a bare boolean. It drives 30% of a public score
-- attached to a named, real person, and on its own it cannot answer "who
-- checked this, against what, and when" — which is both the audit trail a
-- defamation claim would demand and the thing that makes TrustScore honest
-- rather than merely confident.
--
-- Append-only by convention: correct a bad check by inserting a newer row, so
-- the history of what we believed and when survives.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credential_provenance (
  id            serial PRIMARY KEY,
  doctor_id     int NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  source        text NOT NULL,              -- 'nmc-registry' | 'state-council' | 'manual-review'
  evidence_url  text,                       -- public record consulted, when one exists
  verified_by   text NOT NULL,              -- a person, or a named automated job — never null
  verified_at   timestamptz NOT NULL DEFAULT now(),
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credential_provenance_doctor_idx
  ON credential_provenance (doctor_id, verified_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Score history
--
-- TrustScore weights will change. Without a record of which version produced a
-- number, tuning a weight silently rewrites every score the product has ever
-- shown and "why did my score drop?" becomes unanswerable. score_version here
-- matches SCORE_VERSION in packages/core/src/ranking.ts.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS score_history (
  id             serial PRIMARY KEY,
  doctor_id      int NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  score_version  text NOT NULL,
  trust_score    int NOT NULL CHECK (trust_score BETWEEN 0 AND 100),
  breakdown      jsonb NOT NULL,
  computed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS score_history_doctor_idx
  ON score_history (doctor_id, computed_at DESC);
