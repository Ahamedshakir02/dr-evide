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

Open http://localhost:3000 for the landing page, or http://localhost:3000/find to go
straight to the search. With no database configured, the app runs on bundled **sample
data** (fictional doctors, marked "Sample data" in the UI).

## The website has two jobs

`/` is the **public face**: what Dr Evide is, what the app does, how ranking works,
and where to get it. `/find` is the **product**: the symptom box, the departments,
and everything downstream of them.

They were one page until v0.4, which served exactly one reader — someone already
unwell and already convinced. A doctor deciding whether to be listed, or anyone
deciding whether to trust a ranking of named physicians, got a card in the corner of
a search form.

Two properties keep the landing page from becoming marketing:

- **Every number on it is read from the code that produces it.** The TrustScore
  weights come from `SCORE_WEIGHTS`, their labels and the disclaimer from core's
  `i18n`. A claim about how ranking works cannot drift from how ranking works.
- **Nothing on it is a promise the repo does not keep.** The store badges are disabled
  spans rather than links, because neither app is published. The "none of these
  doctors are real" line in the footer is gated on `isSampleMode()` — it removes
  itself when a real database is configured.

Landing copy lives in `apps/web/src/lib/site-copy.ts` rather than in core, because the
app has no landing page. See the file's header for why that is not a hole in the
one-copy rule.

## With a real database (Postgres + PostGIS)

```bash
docker compose up -d          # starts PostGIS on :5432
cp apps/web/.env.example apps/web/.env.local   # DATABASE_URL pre-filled for the docker db
npm run db:setup              # creates schema
npm run db:seed               # seeds specialties + sample doctors
npm run dev
```

```bash
npm run notify:export > launch-list.csv   # the launch-email list, for a human to send from
```

`TRUSTED_PROXY_HOPS` — set to the number of proxies in front of the app (default 1).
The rate limiter reads `x-forwarded-for` from the right by that many hops; reading the
first entry would take whatever the caller wrote.

`NEXT_PUBLIC_SITE_URL` — the public origin. `robots.txt`, `sitemap.xml` and the
canonical links need absolute URLs and cannot infer one from the request. Defaults to
`http://localhost:3000` rather than a guessed production domain: a sitemap pointing at
a hostname we do not control is worse than one that is obviously wrong in development.

`NEXT_PUBLIC_CONTACT_EMAIL` — shown as the fallback when the launch-notification list
has no database behind it. Leave it blank and no address is rendered at all, which is
better than a `mailto:` to a mailbox nobody reads.

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
   Neither the routed conditions nor the user's coordinates travel in the URL — they
   live in `sessionStorage` (`apps/web/src/lib/search-context.ts`). A query string
   lands in browser history on a shared phone, in every proxy access log, and in the
   `Referer` header sent to the map tile server. `Referrer-Policy: no-referrer` closes
   the last of those outright.

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
  src/app/          / landing · /find search · /results · /doctor/[id] · api/ · robots · sitemap
  src/components/landing/   landing-only components (phone mocks, store badges, notify)
  src/lib/site-copy.ts      landing copy, en + ml, web-only by design
apps/mobile/        Expo — imports core, never re-implements it
  src/components/illustrations/  spot art for the empty, 404 and offline states
  public/icons/     generated - see assets/brand/
assets/brand/       mark.svg, the one definition of the app mark
scripts/            check-no-paid-ranking.mjs (CI integrity gate)
                    generate-icons.mjs (mark -> favicon, PWA, apple-touch)
dr-evide-doctor-discovery/   design handoff bundle (reference, not built)
```

Both apps come from the same design bundle: `Dr Evide Web.dc.html` is the website,
`Dr Evide.dc.html` is the four-screen mobile app.

**Never copy a file between `apps/web` and `apps/mobile`.** v1 kept byte-identical copies of
the ranking, taxonomy, and type modules in both, which meant the same doctor could score
differently in the app and on the site. If both apps need it, it belongs in `packages/core`.

## Languages

The **website** is available in English and Malayalam — the product strings in
`packages/core/src/i18n.ts`, the landing page's own copy in
`apps/web/src/lib/site-copy.ts` — toggled in the top bar and remembered per browser.
The **mobile app** reads the same strings from core, toggled in the home-screen top
bar, and remembers the choice in AsyncStorage under the same key the website writes
to localStorage. The read is asynchronous, so it is awaited alongside the fonts in
`app/_layout.tsx` — the first frame is already in the right language rather than
correcting itself a moment later.

Department names carry an `ml` block in `taxonomy.ts`; the English `name`/`description`
remain canonical because they are what the `specialties` table stores. Read them
through `specialtyText(slug, lang)` — reaching for `SPECIALTIES[slug].name` directly
is how both mobile screens ended up showing English names that were already
translated.

Malayalam is never just a different string in the same style: Clash Display and
General Sans carry no Malayalam glyphs, so any style naming them renders the script
as blank boxes. Every translated line needs its Noto Sans Malayalam counterpart, and
a line height with it — the script stacks vowel signs above and below the baseline,
and a line box measured for Latin clips them.

**Malayalam is also longer, and that is a layout problem, not a copy problem.** A
label that fits in English can be three times the width in Malayalam, and
`white-space: nowrap` turns that into a hard minimum width — for the control, then
its grid, then the page. That is how every page on the site came to scroll sideways
below 400px in Malayalam while English sat comfortably inside 320px. The controls
that carry translated copy relax `nowrap` below 480px (`globals.css`, bottom), and
the top bar drops its button's label before it drops the button. **Check both
languages at 320px before calling a layout done** — English alone will not show you
this.

## Typefaces — and why they are not self-hosted

Clash Display and General Sans load from Fontshare's API; Anton, JetBrains Mono and
Noto Sans Malayalam from Google Fonts. Self-hosting the first two would remove a
third-party request on the patchy connections this product targets and stop a font
CDN seeing readers' IPs, which is worth wanting.

**The licence does not allow it.** The ITF Free Font License grants use "in any media
… at any scale" but forbids redistributing the font files — including "uploading them
in a public server" — and separately forbids transmitting them "over the Internet in
font serving". Committing a `.woff2` under `public/` is both. The licensed delivery
path for web use is Fontshare's own API, which is what `fonts.css` already does, so
the current setup is not a shortcut — it is the only compliant option for these faces.

The licence is equally explicit that *output* is unrestricted: logos, graphic elements
and "static images" are all permitted. That is what makes `npm run og` legitimate —
it downloads the fonts at generation time, converts the text to outlines, and commits
a PNG containing no font software.

If the privacy and offline arguments outweigh these particular faces, the way through
is a different pair under the SIL Open Font License, which permits self-hosting
outright. That is a brand decision, not an engineering one.

The **emergency interrupt shows both languages at once** and reads no preference at
all. It arrives unannounced, there is no reliable signal for which language the
person holding the phone reads, and it is the one screen where guessing wrong costs
more than a translation. It is the only screen in either app that doubles up.

`packages/core/test/i18n.test.ts` holds the tables together: matching key sets, no
empty values, and every Malayalam value actually written in Malayalam script — which
catches the common failure, where an English string is pasted across to satisfy the
compiler and nothing ever looks wrong.

**The Malayalam has not yet been reviewed by a native speaker.** It must be before
launch — a mistranslation in the emergency copy is the one bug here that can cost a
life. No test can check this; the ones above only prove a translation is *present*.
That applies to `site-copy.ts` too, though nothing on the landing page is
load-bearing for safety: the red flags live on `/find`, in core's strings.

## Health and observability

`GET /api/health` returns liveness, whether the app is on sample data, the active
`SCORE_VERSION`, and a set of counters.

The counters are names and integers only — `apps/web/src/lib/telemetry.ts` cannot
record a payload, by construction. They exist because the LLM routing fallback is
deliberately silent about *content* (the request body is the user's symptom text)
and was accidentally silent about *fact*: an expired API key would drop every user
to keyword routing with nothing anywhere saying so.

Per-instance and reset on deploy, like the rate limiter. Point them at a real sink
before running more than one instance.

## Commands

```bash
npm run dev          # web app on :3000 (landing at /, search at /find)
npm run mobile       # Metro for the mobile dev client
npm test             # 249 tests — ranking goldens, emergency corpus, i18n parity, the
                     #             untrusted-model parser, structured data, rate limiting
npm run typecheck    # all four workspaces
npm run check:integrity   # fails if a paid-placement field appears
npm run icons        # redraws the app icons from assets/brand/mark.svg
npm run og           # redraws the share card (needs network — fonts are fetched, not stored)
npm run verify       # everything above, in the order CI runs it
```

The mobile app uses a **development build, not Expo Go** — Expo Go can only open
projects on the SDK its store build was compiled against, which breaks every time
the project is ahead of the store. See `apps/mobile/README.md` for building the
dev client locally or via EAS.

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
- **The Malayalam interface strings are unreviewed.** A native speaker must check them,
  starting with the emergency copy. This is the last blocker with a life at the end of
  it — the app and the website are now both fully translated, which means a
  mistranslation reaches everyone rather than nobody.
- Both apps have now been **driven, not just read**: the website through a headless
  Chrome at 320–1280px in both languages, the app on a Pixel_10 AVD through home,
  results, profile and the emergency interrupt. That caught CALL 108 below the fold on
  a 360×640dp phone, and later the Malayalam layout collapse described above. An
  emulator and a headless browser are still not a phone in a hand: neither says
  anything about real font rasterisation, touch targets between finger and glass, or
  performance on a four-year-old midrange device. Still worth half an hour on a real
  phone before shipping.
- **The store badges on `/` are placeholders.** They are deliberately inert until the
  apps are published; wire them up in `site-copy.ts` and `StoreBadges.tsx` at the same
  time, or the page starts overstating.
- **The launch email is sent by hand.** `npm run notify:export` dumps
  `launch_notifications` to CSV on stdout; someone sends from that. There is no
  automated sender and picking one is a real decision — this product stores exactly
  one personal identifier, and which processor it passes through needs a contract
  behind it, not whichever SDK installed most easily. The form promises one email at
  launch; that promise is now keepable, but only because a person keeps it.
- Doctor profiles now carry their own title, description, canonical and `Physician`
  structured data (`apps/web/src/lib/structured-data.ts`). **Sample doctors are
  `noindex` and emit no markup at all**, and profiles enter `sitemap.xml` only when
  `is_sample` is false — so none of this publishes anything until the data is real.
  No `aggregateRating` is emitted, deliberately; see the file header for why.
- `apps/web/test/` covers the untrusted-model parser, the structured data and the rate
  limiter. The API route handlers themselves and the search-context layer still have
  no tests.
- The rate limiter uses Redis when `REDIS_URL` is set and falls back to in-process
  otherwise, so **set it before running more than one replica** — without it each one
  grants a caller the full quota. The Redis path is unit-tested against a mocked
  client but **has not been run against a real server**; smoke-test it once
  (`docker compose up -d`, then hold the symptom box down past 20 requests a minute)
  before relying on it in production.

## Roadmap

v1 discovery only → v1.5 native reviews + profile claiming → v2 booking → v3 monetization
(never paid ranking). See the concept doc for details.
