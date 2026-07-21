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
cp apps/web/.env.example apps/web/.env.local   # DATABASE_URL pre-filled for the docker db
npm run db:setup              # creates schema
npm run db:seed               # seeds specialties + sample doctors
npm run dev
```

## Optional: LLM symptom routing

Set `ANTHROPIC_API_KEY` in `apps/web/.env.local` to enable free-text routing via Claude.
Without it, the keyword matcher handles routing (works offline, less flexible).

Emergency detection **always runs locally first, before the model, and is never delegated to
it** — a red flag must not depend on a network call or an API key.

## How it works

1. **Free-text routing** (`/api/route-symptom`) — maps "my hair is falling" → Dermatology.
   Triage only, never diagnosis. Emergency red flags short-circuit to "call 108".
2. **Search** (`/api/doctors`) — doctors of that specialty within the chosen radius
   (PostGIS `ST_DWithin`, or Haversine on sample data).
3. **TrustScore ranking** (`packages/core/src/ranking.ts`) — 0–100, weights:
   qualification depth (30, NMC-verified), experience (15), review quality ×
   authenticity (25), condition relevance (20), accessibility (10). Distance is a
   filter/tiebreaker, not a quality signal.

   Scoring is a **pure function** of `(doctor, RankingContext)` — nothing reads the clock, the
   network, or the environment, so the same inputs always give the same number. Every result
   carries the `SCORE_VERSION` that produced it, and `packages/core/test/ranking.test.ts`
   freezes exact expected scores: changing a weight produces a reviewable diff, never a silent
   re-baseline.

   **No paid boost exists in this codebase.** `npm run check:integrity` fails the build if a
   field that looks like one is introduced — that promise is enforced by CI, not by convention.

## Project structure

npm workspaces. **All shared logic lives in exactly one place.**

```
packages/core/      taxonomy, emergency red flags, routing, TrustScore, geo,
                    formatting, zod schemas, sample data — the one copy
packages/core/test/ golden score tests + the emergency safety corpus
packages/db/        schema.sql, doctor query layer, setup/seed scripts
apps/web/           Next.js — pages, API routes, design system. No scoring logic.
apps/mobile/        Expo — imports core, never re-implements it
scripts/            check-no-paid-ranking.mjs (CI integrity gate)
dr-evide-doctor-discovery/   design handoff bundle (reference, not built)
```

Both apps come from the same design bundle: `Dr Evide Web.dc.html` is the website,
`Dr Evide.dc.html` is the four-screen mobile app.

**Never copy a file between `apps/web` and `apps/mobile`.** v1 kept byte-identical copies of
the ranking, taxonomy, and type modules in both, which meant the same doctor could score
differently in the app and on the site. If both apps need it, it belongs in `packages/core`.

## Commands

```bash
npm run dev          # web app on :3000
npm run mobile       # Expo
npm test             # 109 tests — ranking goldens + emergency corpus
npm run typecheck    # all four workspaces
npm run check:integrity   # fails if a paid-placement field appears
npm run verify       # everything above, in the order CI runs it
```

## Engineering log

`ENGINEERING-LOG.md` records structural changes and the reasoning behind them. **Anything that
changes a TrustScore number or an emergency red flag must be recorded there.**

## IMPORTANT — before any public launch

- All seeded doctors are **fictional** (`is_sample=true`, every name carries "(SAMPLE)").
  Replace with real, NMC-verified, hand-curated data. Never publish rankings of real doctors
  without verifying credentials — and record every check in `credential_provenance`, which
  exists so "who verified this, against what, and when" always has an answer.
- Legal review: medical disclaimer, DPDP Act 2023 (symptom text = sensitive personal data),
  defamation exposure on rankings.
- Google Places ToS compliance if importing review data.
- The `/api/route-symptom` rate limiter is **in-process** — per-instance, resets on deploy,
  and useless against a distributed caller. Move it to Redis before running more than one
  instance.

## Roadmap

v1 discovery only → v1.5 native reviews + profile claiming → v2 booking → v3 monetization
(never paid ranking). See the concept doc for details.
