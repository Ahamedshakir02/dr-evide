# QA — Dr Evide backend against a real database

Date: 2026-10-28 · Branch under test: backend PR #1 (`claude/project-thread-e1xv28`)
Stack: Postgres 16 + PostGIS 3.4 (`postgis/postgis:16-3.4`), Redis 7, `next build && next start`

## Result

95 integration tests, all against real PostGIS (and real Redis for the limiter). The
apply → approve → public → edit → verify → hide → delete journey works end to end.
**5 bugs found.** Bugs 1, 2, 3 and 5 (and both minor items) are fixed on the backend
branch, and their tests now run as ordinary regression tests. Bug 4 is fixed in PR #3.

## How to run

```sh
docker compose up -d db redis
psql postgres://drevide:drevide@localhost:5432/drevide -c 'CREATE DATABASE drevide_test'
TEST_DATABASE_URL=postgres://drevide:drevide@localhost:5432/drevide_test \
TEST_REDIS_URL=redis://localhost:6379/15 \
  npm run test:integration
```

Every table is truncated before each test, so the harness refuses a database whose
name does not contain `test`. Without `TEST_DATABASE_URL` the suites skip; `npm test`
does not run them at all.

## What is covered

| Area | File | Tests |
|------|------|-------|
| Search: PostGIS radius, specialty, nearest-first, hidden and sample gates, sitemap, unique reg. no. | `packages/db/test/integration/search.int.test.ts` | 10 |
| Applications: submit, duplicates, approve (edits, verification, audit, rollback, concurrent approve), reject | `packages/db/test/integration/applications.int.test.ts` | 20 |
| Admin data: sessions (expiry, disable, sweep), edit, reg-number change clears verification, verify/unverify history, hide, delete-me cascade, filters, LIKE escaping, stats | `packages/db/test/integration/admin.int.test.ts` | 20 |
| Public routes: health, search + ranking, profile, listing form (field errors, honeypot, 413, rate limit), notify, events, symptom routing | `apps/web/test/integration/public-api.int.test.ts` | 20 |
| Admin routes: sign-in (cookie flags, hashed token, same 401, disabled, CSRF, per-account and per-IP lockout), sign-out, every route needs a session, the full journey, review edge cases, stats | `apps/web/test/integration/admin-api.int.test.ts` | 22 |
| Rate limit on real Redis: Lua script, expiry, shared across processes | `apps/web/test/integration/rate-limit-redis.int.test.ts` | 3 |

## Bugs

### 1. Huge ids crash with a 500 (medium) — fixed

`/api/doctors/99999999999` → **500** (`value "99999999999" is out of range for type
integer`); `/doctor/99999999999` shows "Something went wrong" instead of a 404. Same
for every admin `[id]` route. `doctorIdSchema` in `packages/core/src/schemas.ts` is
`z.coerce.number().int().positive()` with no upper bound.
Fix: add `.max(2_147_483_647)`. Test: `public-api.int.test.ts`.

### 2. Duplicate pending applications (medium) — fixed

Five simultaneous submissions with one registration number file five pending
applications (reproduced 30/30 runs). `submitApplication` checks, then inserts, with
nothing unique behind it. A double-tapped Submit on a slow phone connection does this.
The admin then sees duplicates, and approving one makes the others a 409.
Fix: a partial unique index, `ON listing_applications (nmc_reg_no) WHERE status =
'pending'`, and map `23505` to `{ status: "duplicate" }`.
Test: `applications.int.test.ts`.

### 3. Simultaneous edits to one registration number crash (low) — fixed

Two admins giving two doctors the same registration number at the same moment: one
gets 200, the other an unhandled unique-violation (500) instead of the 409 the console
shows. `updateDoctor` and `approveApplication` check then write; the index catches it
but nobody maps the error.
Fix: catch `23505` on `doctors_nmc_reg_no_idx` in both and return
`duplicate_registration`. Test: `admin-api.int.test.ts`.

### 4. Sign-out leaves the cookie in the browser in production (low) — fixed in PR #3

In production the cookie is `__Host-dre_admin`. Logout clears it with
`Set-Cookie: __Host-dre_admin=; Path=/; Max-Age=0` — no `Secure`, which browsers
require for a `__Host-` cookie, so they ignore it. Checked in Chromium against
`next start`: the cookie is still there after sign-out. The session row is deleted, so
the old cookie gets a 401 — not a security hole, but the console will see a "signed
in" cookie that is dead. Fix: pass the same `secure`/`httpOnly`/`sameSite` options when
clearing (`apps/web/src/lib/admin-auth.ts`, `logout`).

### 5. `admin:create` accepts emails that can never sign in (low) — fixed

`npm run admin:create -- --email ops@localhost ...` succeeds, but the login route's
`emailSchema` requires a dot in the domain, so that admin always gets a 400. Fix:
validate with the same rule in `packages/db/create-admin.mjs`.

### Minor (both fixed)

- `GET /api/admin/stats?days=-5` echoes `days: -5` while reading 1 day.
- Unverifying a doctor who was never verified still writes a "Verification withdrawn" provenance line.

---

# Earlier pass — Dr Evide sample-data web demo

URL: `http://localhost:3000` · Date: 2026-09-11 · Viewports: 1265px desktop and 375px mobile

## Health: 98/100

| Console | Visual | Functional | UX | Performance | Animation | A11y |
|---------|--------|------------|----|-------------|-----------|------|
| 100 | 98 | 100 | 98 | 97 | N/A | 98 |

## Verified flows

- Landing-page navigation, FAQ disclosure, and language toggle.
- Symptom routing: `My hair is falling a lot lately` routes to Dermatology and returns two ranked sample doctors.
- Emergency routing: `I have chest pain` stops search and exposes the focused emergency alert with a `tel:108` action.
- Results: sample-data disclosure, radius control, ranked cards, doctor profile, score breakdown, clinic call and directions links.
- Malayalam and English at 375px: document language changes correctly and no horizontal overflow is present.
- Desktop result map: loads markers and OpenStreetMap tiles after the referrer-policy correction.
- API smoke checks: health (200/sample mode), valid sample search (200), invalid search input (400), malformed routing input (400), and emergency routing (200).
- Browser console: no errors or warnings during the checked flows.

## Automated checks

- `npm test`: 9 files, 249 tests passed.
- `npm run typecheck`: all workspaces passed.
- `npm run lint`: completed without lint findings.
- `npm run check:integrity`: completed without an integrity violation.

## Fixed during QA

### ISSUE-001 — OpenStreetMap tiles were blocked

- Severity: high
- Category: functional
- Where: `/results` on desktop
- Reproduction: open any sample-data result page at desktop width; the map pane showed OpenStreetMap 403 "Access blocked" tiles.
- Cause: the global `Referrer-Policy: no-referrer` prevented the public OpenStreetMap tile service from identifying the application.
- Fix: changed the policy to `strict-origin`. Cross-origin requests now receive only the site origin; page paths, query strings, coordinates, and routed conditions remain excluded. The map was rechecked with visible tiles and markers.

## Remaining release boundaries

- The application is intentionally in sample mode. Real doctor data must be NMC-verified and accompanied by credential provenance before launch.
- Waitlist persistence requires Postgres; in an unconfigured sample deployment its API correctly refuses to accept email addresses.
- The app-store badges remain intentionally inert until published store URLs exist.
