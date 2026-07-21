# Dr Evide — mobile app

The React Native (Expo) build of the four mobile screens in
`../dr-evide-doctor-discovery/project/Dr Evide.dc.html`: **Home**, **Results**,
**Doctor profile**, and the **Emergency interrupt**.

The website (`../src`) implements the other design file, `Dr Evide Web.dc.html`.

## Run it

```bash
npm install
npx expo start          # then scan the QR code with Expo Go
npx expo start --web    # or preview in a browser
```

With no `EXPO_PUBLIC_API_URL` set the app runs entirely on **bundled sample
doctors** — fictional, marked "Sample data" in the UI — so it works on a phone
with no server at all.

## Pointing it at the API

`localhost` on a phone means the phone, not your laptop, so use your machine's
LAN address:

```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
```

Then run the web app (`npm run dev` in the repo root) on the same network. The
app calls `/api/route-symptom` and `/api/doctors`, and silently falls back to
the bundled data if the server can't be reached within 6 seconds — the Results
screen says so when that happens.

## What is shared with the website, and what isn't

`src/lib/{types,ranking,taxonomy,format}.ts` and `sample-doctors.json` are
copies of the web app's files. **If you change TrustScore weights, the
specialty list, or the sample data on one side, copy it to the other** — the
two must not drift, or the same doctor scores differently in the app and on the
site.

`src/lib/routing.ts` is deliberately *not* a copy. The web version can call
Claude for free-text routing using `ANTHROPIC_API_KEY`; the app ships only the
offline keyword router, because anything bundled into an app ships to every
device that installs it. LLM routing stays behind the server API.

The emergency red-flag check runs locally on both sides and always runs first.

## Fonts

Anton, JetBrains Mono and Noto Sans Malayalam are bundled via
`@expo-google-fonts/*`, so the emergency headline, every number, and the
Malayalam name render with no network.

Clash Display and General Sans are Fontshare faces with no npm package, so they
load from Fontshare's CDN as TTF (React Native cannot read woff2). If those
requests fail the app still renders, on the system font — see
`app/_layout.tsx`.

## Deviations from the mock

Stated per the design system's own rule:

- Radius caps at **25 km**, not the mock's 15 — Edappal is rural and 15 km can
  return nothing.
- Heading reads **"Why this doctor ranks here"**, not "Why she ranks here":
  doctor records carry no gender field.
- The TrustScore breakdown shows the **five signals `ranking.ts` computes**, not
  the mock's four. There is no patient-reported-outcome data in India at doctor
  level, so that bar would be invented.
- The ring is an SVG arc rather than a CSS `conic-gradient`, which RN has no
  equivalent for. Same result.
