# Deploying Dr Evide

The website runs on **Vercel** (project `dr-evide-web`, root directory
`apps/web`), with a managed **Postgres + PostGIS** database and a managed
**Redis**. The Android app is built with **EAS** and talks to the website's API.

## What you need to sign up for

| Account | What it is for | Notes |
|---|---|---|
| Vercel | Hosts the website and API | Already set up: `dr-evide-web`, previews on every PR. |
| Neon (via Vercel → Storage), or Supabase | Postgres with PostGIS | Pick the **Mumbai (ap-south-1)** region, next to the app's `bom1` region. Both support `CREATE EXTENSION postgis`. Neon through the Vercel Storage tab sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you. |
| Upstash (via Vercel → Storage), or any Redis | Shared rate-limit counters | Without it each serverless instance keeps its own counters, so the symptom API's limit is not really enforced. Use the `rediss://` URL. |
| A domain registrar | `drevide.in` or similar | Add it under Vercel → Settings → Domains, then set `NEXT_PUBLIC_SITE_URL`. |
| Anthropic Console | API key for symptom routing | Optional. Without it routing falls back to the keyword matcher. Set a monthly spend limit in the console. |
| An email address you read | Public contact address | Shown on the site, and the fallback for the launch list. |
| Expo (EAS) | Builds the Android app | Free tier is enough to start. |
| Google Play Console | Publishes the app | One-time US$25 registration, plus identity verification. |

## Environment variables

Set these in Vercel → Settings → Environment Variables. "Prod" means the
Production environment; give Preview its own values (or none) as described.

| Variable | Required | Where | What it does |
|---|---|---|---|
| `DATABASE_URL` | **Yes** in Prod | Prod (+ Preview with its own DB) | Postgres connection string. A production deploy without it **fails to build** on purpose; at runtime every search would answer 503. Use the pooled URL on Neon. |
| `DATABASE_URL_UNPOOLED` | No | same as above | Direct connection used for migrations and admin scripts. Falls back to `DATABASE_URL`. Neon's integration sets it. |
| `DATABASE_SSL` | No | Prod | `true` forces TLS when the URL has no `sslmode=require`. Neon and Supabase URLs already carry it. |
| `DATABASE_POOL_MAX` | No | Prod | Connections per instance, default 10. Use `3` on Vercel: many small instances each open their own pool. |
| `REDIS_URL` | **Yes** in Prod | Prod | Shared rate limiter. `rediss://default:…@….upstash.io:6379`. |
| `ANTHROPIC_API_KEY` | No | Prod | LLM symptom routing. Unset falls back to keywords; `/api/health` counters show which one is answering. |
| `NEXT_PUBLIC_SITE_URL` | **Yes** in Prod | Prod | Public origin, e.g. `https://drevide.in`. Used in `robots.txt`, `sitemap.xml` and canonical links. Build-time: redeploy after changing it. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Recommended | Prod | Shown on the landing page. Blank shows no address. Build-time. |
| `NEXT_PUBLIC_ENABLE_MALAYALAM` | No | Prod | Leave unset until a native speaker has reviewed the translations. Build-time. |
| `TRUSTED_PROXY_HOPS` | No | Prod | Leave unset (1) on Vercel: its edge is the single proxy and it sets `x-forwarded-for` itself. Raise only if you put another proxy (e.g. Cloudflare) in front. |
| `ALLOW_SAMPLE_DATA` | No | Preview only | `true` serves the 20 fictional doctors in a production build. **Never set it on Production.** Useful on Preview when Preview has no database. |
| `MIGRATE_ON_PREVIEW` | No | Preview only | `true` runs migrations on preview deploys. Only when Preview has its **own** database. |

Only used outside Vercel:

| Variable | Where | What it does |
|---|---|---|
| `ADMIN_PASSWORD` | your terminal | Lets `npm run admin:create` run without prompting. Prefer the prompt. |
| `EXPO_PUBLIC_API_URL` | EAS environment (preview + production) | The website origin the app calls, e.g. `https://drevide.in`. `eas.json` sets no value for preview or production, so set it with `npx eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://drevide.in` (and again for `preview`), or the app has no API to call. |

## What happens on a deploy

`apps/web/vercel.json` makes Vercel run `scripts/vercel-build.mjs`:

1. **Production** (`VERCEL_ENV=production`): fails if `DATABASE_URL` is missing
   (unless `ALLOW_SAMPLE_DATA=true`), then runs `npm run db:migrate` (applies
   `packages/db/schema.sql` in one transaction; idempotent) and `npm run db:seed`
   (inserts the seven specialties if missing; never touches doctors), then
   `next build`.
2. **Preview**: skips the database unless `MIGRATE_ON_PREVIEW=true`, then builds.

Migrations run before the build. The schema only adds tables and columns, so
if the build fails afterwards the live site keeps working on the newer schema.
A failed migration rolls back and stops the deploy; the previous deployment
stays live.

Every PR runs the same script in GitHub Actions against `postgis/postgis:16-3.4`
and Redis, migrates a second time to check idempotency, then starts the
production build and runs `scripts/smoke.mjs` against it.

## First launch, step by step

1. **Database.** Vercel → Storage → Create → Neon Postgres, region Mumbai,
   connect it to `dr-evide-web` for **Production** only. Leave Preview
   unconnected (or create a separate branch database for it).
2. **Redis.** Vercel → Storage → Upstash Redis, region Mumbai, Production. Copy
   its `rediss://` URL into `REDIS_URL` if the integration only set
   `KV_*`/`UPSTASH_*` variables.
3. **Variables.** Add the rest from the table above: `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_CONTACT_EMAIL`, `DATABASE_POOL_MAX=3`, and
   `ANTHROPIC_API_KEY` if you want LLM routing.
4. **Domain.** Vercel → Settings → Domains → add yours and follow the DNS
   instructions. HSTS preload is on, so serve HTTPS only.
5. **Deploy.** Merge to `master`. The build log shows `Schema is up to date.`
   before `next build`.
6. **Create your admin account** from your own machine, using the direct URL:

   ```bash
   DATABASE_URL='postgres://…direct…?sslmode=require' \
     npm run admin:create -- --email you@example.com --name "Your Name"
   ```

7. **Check it.**

   ```bash
   BASE_URL=https://your-domain npm run smoke
   ```

   `/api/health` must say `"database": "ok"`. The doctor search returns an
   empty list until doctors are approved; that is expected.
8. **Add doctors.** Approve listing applications at `/admin`, or bulk-load a
   consented CSV with `npm run db:import` (see the README).

## Never on production

- `npm run db:seed:sample` (it refuses when `NODE_ENV=production`, but also do
  not run it from your laptop against the production URL).
- `ALLOW_SAMPLE_DATA=true`.
- Pointing a Preview deployment at the production database with
  `MIGRATE_ON_PREVIEW=true`.

## Running it without Vercel

`docker-compose.yml` starts PostGIS and Redis for local work. Any Node 20 host
works the same way: set the variables above, then
`npm ci && npm run db:migrate && npm run db:seed && npm run build && npm start`.
