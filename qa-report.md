# QA — Dr Evide sample-data web demo

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
