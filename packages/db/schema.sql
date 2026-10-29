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

-- ─────────────────────────────────────────────────────────────────────────────
-- Launch notifications
--
-- The website's "tell me when it's out" form, and the only place this product
-- stores a contact detail. Kept deliberately thin: an address, when it was
-- given, and which language the page was in when it was given — enough to send
-- one launch email in a language the reader can actually read, and nothing
-- more. No name, no IP, no referrer, and nothing that could be joined back to a
-- search: symptom text is never written anywhere, so there is nothing here to
-- join it to.
--
-- Stored lowercase with a unique index so a second submission is a no-op rather
-- than a duplicate send. Delete the row on request — that is the whole erasure
-- procedure for this table.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS launch_notifications (
  id          serial PRIMARY KEY,
  email       text NOT NULL,
  lang        text NOT NULL DEFAULT 'en',   -- 'en' | 'ml', for the launch email
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS launch_notifications_email_idx
  ON launch_notifications (lower(email));

-- ─────────────────────────────────────────────────────────────────────────────
-- v0.5 — the product runs on real data, entered by people, not scripts
--
-- Everything below is written to be re-run: `npm run db:migrate` applies the
-- whole file on every deploy, so a new column is `ADD COLUMN IF NOT EXISTS`,
-- never a bare ALTER that fails the second time.
-- ─────────────────────────────────────────────────────────────────────────────

-- A doctor can be taken off the site without being deleted (a complaint under
-- review, a clinic that has closed) and put back with their history intact.
-- Every public query filters on status = 'published'.
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DO $$ BEGIN
  ALTER TABLE doctors ADD CONSTRAINT doctors_status_check CHECK (status IN ('published', 'hidden'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS doctors_nmc_reg_no_idx
  ON doctors (nmc_reg_no) WHERE nmc_reg_no IS NOT NULL AND is_sample = false;

-- People who may sign in to /admin. Created from the command line only
-- (`npm run admin:create`): there is no sign-up form to attack.
CREATE TABLE IF NOT EXISTS admin_users (
  id             serial PRIMARY KEY,
  email          text NOT NULL,
  name           text NOT NULL,
  password_hash  text NOT NULL,             -- scrypt, see apps/web/src/lib/admin-auth.ts
  disabled       boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at  timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users (lower(email));

-- Only a SHA-256 of the session token is stored, so a read of this table (a
-- backup, a leaked dump) does not hand anyone a working session.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash  text PRIMARY KEY,
  admin_id    int NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions (expires_at);

-- What each admin did, append-only. A ranking of named doctors needs to be
-- able to answer "who changed this, and when" long after the fact.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id           serial PRIMARY KEY,
  admin_id     int REFERENCES admin_users(id) ON DELETE SET NULL,
  action       text NOT NULL,
  target_type  text NOT NULL,
  target_id    int,
  detail       jsonb NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_log_target_idx
  ON admin_audit_log (target_type, target_id, created_at DESC);

-- A doctor asking to be listed. Nothing here is public until an admin approves
-- it, which creates the doctors row; the application is kept as the record of
-- what the doctor told us and that they consented.
CREATE TABLE IF NOT EXISTS listing_applications (
  id                   serial PRIMARY KEY,
  full_name            text NOT NULL,
  specialty_slug       text NOT NULL REFERENCES specialties(slug),
  qualifications       text[] NOT NULL DEFAULT '{}',
  qualification_level  int NOT NULL DEFAULT 1 CHECK (qualification_level BETWEEN 1 AND 4),
  nmc_reg_no           text NOT NULL,
  registration_council text,                -- e.g. 'Travancore-Cochin Medical Council'
  reg_year             int,
  clinic_name          text,
  address              text NOT NULL,
  town                 text NOT NULL,
  phone                text NOT NULL,       -- the clinic's number, shown publicly once listed
  fee_inr              int,
  timings              text,
  conditions           text[] NOT NULL DEFAULT '{}',
  map_link             text,                -- whatever the doctor pasted; an admin sets lat/lng
  contact_email        text NOT NULL,       -- for us to reply; never shown publicly
  consent              boolean NOT NULL CHECK (consent),
  consent_version      text NOT NULL,
  status               text NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note          text,
  reviewed_by          int REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_at          timestamptz,
  doctor_id            int REFERENCES doctors(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listing_applications_status_idx
  ON listing_applications (status, created_at);

-- One pending application per registration number. Without it, a double-tapped
-- Submit on a slow connection filed the same doctor several times: the check
-- in submitApplication and the insert are two statements. Older duplicates (if
-- any were filed before this index) are closed first so the index can build.
UPDATE listing_applications a
SET status = 'rejected', reviewed_at = now(),
    review_note = 'Closed automatically: duplicate of an earlier pending application.'
WHERE a.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM listing_applications b
    WHERE b.status = 'pending' AND b.nmc_reg_no = a.nmc_reg_no AND b.id < a.id
  );
CREATE UNIQUE INDEX IF NOT EXISTS listing_applications_pending_reg_idx
  ON listing_applications (nmc_reg_no) WHERE status = 'pending';

-- The telemetry counters, kept. In-process counters reset on every deploy,
-- which made them useless for the numbers the product is steered by: searches
-- per week, and which departments come back empty. Names and integers per day,
-- exactly what lib/telemetry.ts can express — still no payloads.
CREATE TABLE IF NOT EXISTS daily_counters (
  day    date NOT NULL,
  name   text NOT NULL,
  value  bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name)
);
