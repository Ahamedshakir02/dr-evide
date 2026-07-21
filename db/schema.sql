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
