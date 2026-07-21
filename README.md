# Dr Evide — ഡോക്ടർ എവിടെ?

Find the right doctor near you. Describe your problem in your own words, get routed to the
correct department, and see doctors ranked by **verified credentials, experience, and authentic
reviews — never by who paid**.

Launch area: Edappal, Kerala (and surrounding towns — Ponnani, Kuttippuram, Valanchery, Tirur).

## Quick start (zero setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no database configured, the app runs on bundled **sample data**
(fictional doctors, marked "Sample data" in the UI).

## With a real database (Postgres + PostGIS)

```bash
docker compose up -d          # starts PostGIS on :5432
cp .env.example .env.local    # DATABASE_URL is pre-filled for the docker db
npm run db:setup              # creates schema
npm run db:seed               # seeds specialties + sample doctors
npm run dev
```

## Optional: LLM symptom routing

Set `ANTHROPIC_API_KEY` in `.env.local` to enable free-text routing via Claude. Without it, a
keyword matcher handles routing (works offline, less flexible). Emergency detection always runs
locally first, regardless.

## How it works

1. **Free-text routing** (`/api/route-symptom`) — maps "my hair is falling" → Dermatology.
   Triage only, never diagnosis. Emergency red flags short-circuit to "call 108".
2. **Search** (`/api/doctors`) — doctors of that specialty within the chosen radius
   (PostGIS `ST_DWithin`, or Haversine on sample data).
3. **TrustScore ranking** (`src/lib/ranking.ts`) — 0–100, weights:
   qualification depth (30, NMC-verified), experience (15), review quality ×
   authenticity (25), condition relevance (20), accessibility (10). Distance is a
   filter/tiebreaker, not a quality signal. **No paid boost exists in this codebase — keep it
   that way.**

## Project structure

```
src/app/            web pages (home, results, doctor profile, emergency) + API routes
src/components/     UI built from the Shakir design system
src/styles/ds/      the design system, copied verbatim from the handoff bundle
src/lib/            taxonomy, routing, ranking, db access
db/                 schema.sql, sample-doctors.json (fictional!)
scripts/            db-setup.mjs, db-seed.mjs
mobile/             the React Native (Expo) app — see mobile/README.md
dr-evide-doctor-discovery/   design handoff bundle (reference, not built)
```

Both apps come from the same design bundle: `Dr Evide Web.dc.html` is the website,
`Dr Evide.dc.html` is the four-screen mobile app.

`mobile/src/lib/{types,ranking,taxonomy,format}.ts` and `sample-doctors.json` are
**copies** of the files here. Change one side, copy to the other — if they drift, the
same doctor scores differently in the app and on the site.

## IMPORTANT — before any public launch

- All seeded doctors are **fictional** (`is_sample=true`). Replace with real, NMC-verified,
  hand-curated data. Never publish rankings of real doctors without verifying credentials.
- Legal review: medical disclaimer, DPDP Act 2023 (symptom text = sensitive personal data),
  defamation exposure on rankings.
- Google Places ToS compliance if importing review data.

## Roadmap

v1 discovery only → v1.5 native reviews + profile claiming → v2 booking → v3 monetization
(never paid ranking). See the concept doc for details.
