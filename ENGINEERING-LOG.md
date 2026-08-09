# Engineering Log

A running record of structural changes to Dr Evide: what changed, **why**, and what
it means for anyone working on the code next. Newest entry first.

Rules for this file:

- One entry per meaningful change, with the reasoning — not just the diff.
- Anything that alters a **TrustScore number** or an **emergency red flag** must be
  recorded here, with the `SCORE_VERSION` bump where applicable.
- Write down what was *considered and rejected*, not only what was done.

---

## 2026-08-10 — both apps driven at once, and Malayalam turns out to break the layout

The previous entry got the mobile app onto a screen. This one got **both** apps onto
one, at the same time, and drove them: the website through a headless Chrome over the
DevTools protocol at eight widths in both languages, the app on the Pixel_10 AVD with
every screen tapped through. Nothing here changes a TrustScore number or an emergency
red flag. `SCORE_VERSION` stays `1.0.0`.

The finding is one sentence: **in Malayalam, every page on the website scrolled
sideways on every phone narrower than 400px.** In English, none of them did. That is
why two sessions of reading these files did not catch it — and it is the wrong
language in this product to break, since the reason Malayalam exists here is the
reader who has the least patience for a broken page.

### The cause was three layers below where it showed

Chasing the visibly-too-wide element led nowhere: on `/find` everything measured
exactly 385px, including elements with no styling of their own. Everything was that
wide because their *container* was, and the container was that wide because of one
rule, three levels down — `white-space: nowrap` on `.sh-btn`.

The chain: nowrap makes a label unbreakable → an unbreakable label is the button's
minimum width → the button is a grid item, so it is the grid's minimum width → and so
the shell's, and the document's. The primary button on `/find` reads "ശരിയായ ഡോക്ടറെ
കണ്ടെത്തൂ" and measured **385px on a 320px screen**. The same rule on `.pill` and
`.score-band` did the same to `/results` through the doctor card.

So the controls that carry translated copy give up `nowrap` below 480px, and their
fixed `height` becomes `min-height` in the same change — a button allowed to wrap and
still pinned to 44px would spill its own label. Nothing forces a wrap: a label that
already fits renders at exactly the height it did before, so the English design is
untouched at every width.

**Considered and rejected: `overflow-wrap: anywhere` on `body`.** It is the rule that
actually lowers an element's min-content width, it looked like the one-line fix, and
it was wrong. It tells *every* flex and grid parent that *any* text may be squeezed to
a single character, and the first thing that happened was the top bar squeezing the
wordmark to "Dr / Evid / e". It survives in exactly one place — `.doc-card`, scoped so
it cannot reach the wordmark — because a card is an avatar and a score ring that
cannot shrink either side of a column of Malayalam, and nothing else would fit it in
280px. The global rule is `break-word`, which permits a wrap without inviting a
squeeze.

The top bar needed its own answer: it is not one long word but three controls, needing
398px in English and 454px in Malayalam. The "Find a doctor" button drops its label and
keeps the magnifier below 420px — 480px in Malayalam, where the label is 56px longer,
the same two-breakpoint shape the nav above it already uses. **The button loses its
label rather than the bar losing the button**: the search is the one control that must
not go behind a menu, and the accessible name moves to the anchor so a screen reader
loses nothing.

### The app had the same bug, in its own idiom

Not a coincidence — the same designs, and Malayalam is long in both. At 411dp and the
default font scale, an ordinary phone:

- The home top bar took its width from the wrong side, squeezing the language toggle
  until "English" rendered as **"Englis"** — on the one control a reader who cannot
  read the current language depends on to escape it. The lockup shrinks now; the
  control does not.
- The Malayalam line under the wordmark was clipped to "ഡോക്ടർ", because it was the
  one Malayalam style in the app with no line height. The script stacks vowel signs
  above and below the baseline and a line box measured for Latin cuts them off.
- The radius card put "Within 5 km" and "2 doctors found" at either end of a row that
  fits neither in Malayalam, so the count ran off the card and off the screen —
  rendering as "5 km2 ഡോക്ടർമാരെ കണ്ടെത്ത" with the gap collapsed and the last word
  cut in half. The row wraps now.

### Two things that were not broken, and one that was

`/results` was the only route on the site with no title of its own, inheriting the root
default — the front page's string, on the page showing search results. It has a layout
now, like `/find`, and states `noindex, follow`, which is what `sitemap.ts` already
decided by omission and says why: the search reads its context from sessionStorage, so
a crawler fetching it cold gets the empty state.

The footer's `tel:108` measured **20×16px** — the smallest target on every page, on the
site whose own advice two words earlier is to call it. Now 44×47, with the padding
doing the work and a negative margin giving the space back to the line box, so the
disclaimer still sets as one paragraph.

Two things looked like bugs and were not, which is worth recording so the next person
does not re-open them. The emergency alert on `/find` appeared not to fire; it fires,
and the first test simply read the DOM before the fetch resolved. The emergency screen
in the app shows its last Malayalam line half-cut behind the CALL 108 card; it scrolls,
which is exactly what the previous entry decided it should do — the actions are pinned
and the message gives up the height.

### Verification

`npm run verify` clean throughout: integrity gate 12/0, four workspace typechecks,
eslint, 249 tests.

Driven, not reasoned about:

| Surface | Checked |
|---|---|
| `/`, `/find`, `/results`, `/doctor/[id]` | 320/360/390/414/430/520/768/1280px × en + ml — no horizontal overflow anywhere |
| Red flag on `/find` | Alert renders, takes focus, `tel:108` present; `/api/route-symptom` returns `emergency: true` with helplines |
| Ordinary symptom | Routes to `/results?specialty=dermatology`, cards render |
| Language toggle | `<html lang>` flips, copy changes, survives navigation to `/results` and `/doctor` |
| 404, empty state, profile actions | Department links, widen button, `tel:` and Maps links all present and correct |
| App: home → results → profile → emergency | All four screens, both languages, on Pixel_10 |

**Still open, unchanged:** the Malayalam is unreviewed by a native speaker; the Redis
path has still only been tested against a mock; neither app has been on physical
hardware. An emulator and a headless Chrome are still not a phone in a hand.

---

## 2026-08-09 — the app runs on a screen, and two plans meet reality

Six things, but two of them are the entry: the emergency screen was seen on a
small phone for the first time, and the font licence was read instead of assumed.
Both changed what got built.

### CALL 108 was below the fold on a budget phone

An Android SDK and a Pixel AVD turned out to be on this machine, so the mobile
screens were finally seen running rather than reasoned about. At 411×923dp
everything looked right. Forced to **360×640dp** — the cheap Android this product
is built for — the emergency screen was the warning and nothing else. **CALL 108
was entirely off-screen.** Someone reading "don't wait — get help now" had to
scroll an unfamiliar red screen, mid-cardiac-event, to find the ambulance number.

The screen had been one ScrollView with a flexible spacer, which is fine at any
height the designer happened to look at. The actions are now a fixed footer and
cannot be scrolled away; the message above them gives up height instead. That is
the right sacrifice — *why* it is an emergency matters less than being able to act
on it. It fixed the tall screen too, where the "this isn't an emergency" escape
hatch had been clipped mid-line on first paint and nobody had noticed.

Pinning the buttons alone then pushed the **Malayalam headline** off the bottom,
which breaks the one thing this screen exists to do. So below 700dp the message
steps down a size and the decorative warning disc is dropped entirely. **The disc
goes before a word of either language does**: a full-bleed red field already says
"urgent", and a Malayalam reader should not have to scroll to find the sentence
written for them.

**Considered and rejected:** letting the body text scroll and calling it done. It
looked acceptable in a screenshot and it silently made the bilingual promise
conditional on screen height.

An emulator is not hardware. It says nothing about real rasterisation, touch
targets in a hand, or a four-year-old midrange device under load. It was still
enough to find a bug that reading the file for two sessions had not.

### The typefaces cannot be self-hosted — the licence says so

Self-hosting Clash Display and General Sans has been on the list for two entries:
it removes a third-party request on patchy connections and stops a font CDN seeing
readers' IPs. The files were downloaded and the CSS was half-rewritten before the
ITF Free Font License was actually read.

It forbids this. Use is granted "in any media, at any scale", but redistribution is
not — explicitly including "uploading them in a public server" — and transmitting
the files "over the Internet in font serving" is called out separately. A `.woff2`
under `public/` is both. Fontshare's API is not a shortcut around doing it
properly; **for these faces it is the only compliant way to get them onto a page.**

The files were deleted. If the privacy argument outweighs these particular
typefaces, the way through is a different pair under the SIL Open Font License,
which permits self-hosting outright — a brand decision, not an engineering one.

### The share card, built inside what the licence does allow

The same licence is explicit that *output* is unrestricted: logos, graphic
elements, "static images". So `scripts/generate-og.mjs` downloads the fonts at
generation time, converts every string to outlines, and commits a PNG that
contains no font software. Run by hand like the icons.

Two bugs, both found by looking at the image rather than the exit code.
opentype.js 2.0.0's `toPathData()` writes literal `NaN` into the middle of the
path for this tagline at every rounding setting, from commands that are all finite
— librsvg stops drawing at the first bad coordinate, so "Find the right doctor near
you" rendered as "Fin" and the generator reported success. And Next merges metadata
shallowly, so `/` declaring its own `openGraph` dropped the layout's image
entirely: **the most shared URL on the site was the one page with no card.**

### What the profiles now say, and what they refuse to

Every doctor page has its own title, description, canonical and `Physician`
markup. The interesting part is the refusals. A sample doctor emits **no markup at
all** and is `noindex`, gated on the `is_sample` column rather than the "(SAMPLE)"
in the name, because someone will edit that out one day. Credential claims appear
only for a verified registration — nothing is asserted here that
`credential_provenance` cannot answer for. And **no `aggregateRating`**, though we
hold the data and it is the highest-value markup on a page like this: the review
terms are unreviewed, the number displayed is an average times an authenticity
factor and so is not a rating anyone else would recognise, and TrustScore would
lose the explanation that makes it honest the moment it became stars.

### Tests reached outside core for the first time

`llm-routing.ts` was the riskiest untested code in the repo. 67 cases now cover
malformed JSON, wrong shapes, invented departments, and content a model was talked
into emitting — including that **an emergency message shown to a user is always
ours**, never the model's. Confirmed the suite has teeth before trusting it:
moving the red-flag check after the model call fails 2 tests, bypassing the zod
schema fails 11.

The rate limiter moved to Redis behind the same interface, degrading to memory when
Redis is unreachable rather than failing open (unguarded spend) or closed (site
down). Writing its tests found the bug worth having them for: a malformed reply
destructured to `undefined`, `undefined > limit` is false, and the endpoint
silently stopped being metered — the exact failure the module prevents, arriving as
a success.

**None of this touches a TrustScore number or an emergency red flag.**
`SCORE_VERSION` stays `1.0.0`, the golden tests are untouched, and the emergency
*detection* is unchanged — the emergency screen's **layout** changed, not what
trips it.

**Still open:** the Malayalam is still unreviewed by a native speaker. The Redis
path is tested against a mocked client only, with no daemon on this machine. And
the app has still never been seen on physical hardware.

---

## 2026-08-08 — the brand arrives, and the app learns Malayalam

Four things were true at once: the site's typefaces had never loaded, the PWA could
not be installed, the app was English-only, and the screens where the product fails
had no design at all. They are one entry because they are one pass.

### The typefaces were blocked by our own CSP

`fonts.css` has always imported Clash Display and General Sans from Fontshare.
`style-src` only ever named `fonts.googleapis.com`. So the stylesheet was blocked on
every page load, neither `@font-face` was ever parsed, and the whole site — every
heading, every paragraph, both languages — rendered in the browser's generic
sans-serif.

It survived review because Anton and JetBrains Mono *are* Google-hosted and did
load. The mono numerals in the TrustScore looked right, so the page looked styled
rather than unstyled.

**Considered and rejected:** self-hosting the two faces. It is the better end state —
it removes a third-party request on the patchy connections this product is built for,
and it stops a font CDN seeing our readers' IPs. Rejected *for now* because it means
committing binary font files and a licence review, and the immediate bug is that the
policy did not match the stylesheet. Worth doing deliberately, not as a side effect.

### The top bar pushed the page sideways, in Malayalam worst of all

The section nav appeared at 760px. Measured with the real faces loaded, the bar needs
840px in English and **961px in Malayalam** — longer labels, and a "Find a doctor"
button that goes from 133px to 196px. Everything between scrolled the whole document
horizontally: an 80px band in English, a 200px band in Malayalam, which is most
tablets.

Now two breakpoints, and the stylesheet reads the language rather than measuring it —
`LangProvider` already writes the choice to `<html lang>` because a screen reader
needs it. **Considered and rejected:** one breakpoint at 980px. Simpler, but it hides
the nav from English readers across 140px where it fits perfectly, to accommodate a
language that is not the one being rendered.

### The mark, and an installable PWA

`manifest.json` shipped `"icons": []`, so Chrome had nothing to build an install
prompt from and "add to home screen" did nothing — on the mid-range Android that
dominates the launch area, and with no store listing, that *is* the install.

The mark is a map pin whose counter is a medical cross: the name drawn rather than
written, since ഡോക്ടർ എവിടെ? is "where is the doctor?". One closed path with
`fill-rule="evenodd"`, so it stays a single silhouette and can be a teal glyph in a
tab, white on teal in a launcher, or monochrome later, without being redrawn.

`scripts/generate-icons.mjs` lifts the path out of `assets/brand/mark.svg` rather
than restating it — the one-copy rule, applied to a shape. Deliberately **not** wired
into the build: an app icon should arrive as a binary diff someone chose to commit.

### The three screens that had nothing to show

Empty results, a dead link and a dropped connection were plain text. Each now draws
its own situation rather than being decorated: the empty state is a real radius with
real pins in the gap between the searched ring and the widened one, which is the
actual state of a rural area — not "no doctors exist" but "none within the distance
you said you could travel".

Offline gets the drawing; a server fault keeps the compact alert. Dressing up a
failure we caused would be the wrong tone.

### The app learns Malayalam — and the emergency screen learns both

The strings had been in core since the website was translated. The app never read
them, and walked straight past the Malayalam department names already in the
taxonomy. Two screens called `SPECIALTIES[slug].name` instead of
`specialtyText(slug, lang)`, and the profile rendered `SCORE_WEIGHTS`' own English
`label` instead of `t.weightLabels[key]` — the five signal names that explain why a
doctor ranks where they do, in English, on the screen whose whole purpose is being
understood.

**The emergency interrupt shows both languages at once and reads no preference.**
This is the one deliberate asymmetry in the product. Every other screen costs someone
a translation when it guesses wrong; this one costs them time they may not have. It
arrives unannounced, and a phone sold in Kerala reports `en-IN` whatever its owner
reads. So it does not guess.

Malayalam is never just a different string in the same style — Clash Display and
General Sans carry no Malayalam glyphs, so inheriting an English style renders the
script as blank boxes. The emergency headline would have been a row of empty boxes at
44px. Every translated line now carries a Noto Sans Malayalam override.

**Considered and rejected:** adding `@react-native-async-storage/async-storage` so
the language choice survives a relaunch. It is a native module, so it is a dev-client
rebuild for everyone working on the app, and it is not something to slip in as part
of a translation pass. The seam is two functions in `apps/mobile/src/lib/lang.tsx`.

### The tests that hold the tables together

`packages/core/test/i18n.test.ts` asserts matching key sets, no empty values, no
Malayalam value byte-identical to its English counterpart, and every Malayalam value
actually containing Malayalam script.

That last one is the point. The realistic failure is not a missing key — TypeScript
catches those. It is someone adding a string to `en`, being told to add it to `ml`,
and pasting the English across to satisfy the compiler. It compiles, renders, and
reviews clean, and a Malayalam reader gets an English sentence. Confirmed the test
fails on exactly that mistake before trusting it.

**None of this touches a TrustScore number or an emergency red flag.**
`SCORE_VERSION` stays `1.0.0` and the golden tests are untouched. The emergency
*copy* changed language; the emergency *detection* did not change at all.

**Still open:** the Malayalam is still unreviewed by a native speaker, and now it
reaches both apps rather than one — a mistranslation now has a wider blast radius,
not a smaller one. The mobile screens have not been seen on a device.

---

## 2026-08-07 — the website splits in two: a landing page at `/`, the search at `/find`

**Problem.** The website was a second copy of the app. `/` was the symptom box, and
that was the whole site. It worked for exactly one reader — someone already unwell,
already convinced, who wanted a doctor now. It had nothing for the other reader: a
doctor deciding whether to be listed, anyone deciding whether to trust a ranking of
named physicians, anyone arriving from a shared link. That reader's questions — what
is this, who ranks whom, on what basis, where do I get it — were answered by a
`sh-card` in the corner of a search form, if at all.

**Change.** The search moved to `/find` unchanged, and `/` became the product's
public face: hero, three-step explanation, six feature cards covering what the app
actually does, the four app screens, the TrustScore weights, downloads, FAQ.

**Two rules keep the marketing page honest.**

1. *Every number on it is read from the code that produces it.* The weights come from
   `SCORE_WEIGHTS`, their labels from core's `i18n`, the disclaimer and the pledge
   from core's `Strings`. A claim on this page about how ranking works cannot drift
   away from how ranking works, because it is the same value.
2. *No claim the repo does not keep.* The store badges are `aria-disabled` spans, not
   links, because neither app is published — a badge that looks live and goes nowhere
   costs more than the two stores are worth on a page arguing that we do not overstate
   things. The footer's "none of these people are real" line is gated on
   `isSampleMode()` resolved on the server, so it removes itself the day a real
   database is configured rather than waiting for someone to remember.

**The integrity gate fired, and the copy moved rather than the gate.**
`check-no-paid-ranking.mjs` rejected two sentences *promising we would never do paid
placement*, because they contained the word the checker bans. Widening the checker to
understand context was rejected outright: a checker that can tell prose from a field
is a checker that can be argued with, and "it's only in a string" is precisely the
argument a paid-placement field would arrive wearing. The sentences were reworded. The
script's docstring, which claimed prose did not fire, was corrected — it does.

**Landing copy lives in `apps/web/src/lib/site-copy.ts`, not in core.** This is not a
hole in the one-copy rule. Core exists for what *both* apps show; the app has no
landing page, no feature tour, and no reason to describe itself to someone who has
already installed it. Putting it in core would make the mobile bundle carry strings it
can never render and put a marketing claim one import away from the ranking function.
The product strings the page reuses are still read from core.

**Also changed.**

- `skipToResults` → `skipToContent` in core's `Strings`. The skip link is on every
  page, and on a landing page there are no results to skip to — it was telling a
  keyboard user there were.
- `manifest.json` `start_url` → `/find`. Someone who installs the PWA wants the
  search, not the pitch.
- `robots.ts` and `sitemap.ts` added — the first robots.txt this project has had. Both
  disallow `/results`, which reads its context from `sessionStorage` and therefore
  renders the empty state when crawled cold; indexing it would put a page in search
  results that is blank for everyone who clicks it.
- `metadata.title` became a template. Every page shared one title before, so a
  doctor's profile and the front page were indistinguishable in a search result.
- `/api/notify` and a `launch_notifications` table: the only place this product stores
  a contact detail. It answers 503 when there is no database rather than accepting an
  address into memory — a list that evaporates on the next deploy would take an
  address, promise an email, and silently never send one. The form shows that as an
  apology, not a green tick.

**Rejected.** Removing the search from the website (the app is not published, so the
site is the only working Dr Evide there is). One long page with the pitch above the
symptom box (it puts a marketing scroll between someone unwell and the one control
they came for).

---

## 2026-07-22 — mobile moves off Expo Go to a development build

**Problem.** Expo Go refused to open the project: *"This project requires a newer
version of Expo Go"* — and reinstalling from the Play Store did not help.

**Diagnosis.** Not a project fault. The app targets **Expo SDK 57**, and Expo's API
confirms SDK 57 expects exactly `react-native@0.86.0` + `react@19.2.3`, which is what
is installed. SDK 57 requires **Expo Go 57.0.2** on Android. On npm, `expo@57.0.7` is
tagged both `latest` *and* `next`, with only 8 stable releases and no `sdk-57`
dist-tag (52–56 all have one) — the fingerprint of a brand-new SDK. Play Store
rollouts lag a new SDK by days and are staged, so "latest available to this device"
can still be the SDK 56 build no matter how many times you press Update.

**Why a development build rather than chasing the APK.** Sideloading Expo Go 57.0.2
would fix it today and break again at SDK 58. A development build is compiled from
*this project's own* SDK and native dependencies, so the class of mismatch cannot
recur — and it removes the ceiling where the app can only use native modules Expo Go
happens to bundle. Downgrading to SDK 56 was rejected: it would drag React Native and
React back with it and undo the version alignment that just got both apps onto one
React.

**Changes.**

- `expo-dev-client` added; `npm run mobile` now starts Metro for the dev client
  (`start:go` kept for anyone who wants to try Expo Go).
- `app.json` gained `android.package` and `ios.bundleIdentifier` (`in.drevide.app`).
  Both are **required** for any real build and were simply absent — Expo Go never
  needed them, so the gap was invisible until now. Also declared the location
  permissions the Results screen actually uses.
- `eas.json` with `development` / `preview` / `production` profiles, so the app can
  be built in the cloud with no local Android SDK.
- `android/` and `ios/` are generated by `expo prebuild` and are **gitignored**.
  `app.json` and the config plugins are the source of truth; those directories are
  build output and must never be hand-edited.
- Local toolchain wired up: the Android SDK was already installed at
  `%LOCALAPPDATA%\Android\Sdk` but `ANDROID_HOME` was unset and nothing was on
  `PATH`. Set both at user scope and appended `platform-tools`, `emulator`, and
  `cmdline-tools/latest/bin`.

**Metro config corrected.** `npx expo-doctor` flagged
`resolver.disableHierarchicalLookup = true`, which I had set from older Expo monorepo
guidance. That advice predates npm hoisting: with a hoisted tree Metro still needs to
walk up to find transitive dependencies living in neither `nodeModulesPaths` entry.
Removed — 20/20 checks now pass.

### Local Android builds require Windows long path support

The first `expo run:android` compiled everything — Kotlin, Java, and the native C++ for
reanimated and worklets — then failed in `:app:buildCMakeDebug`:

```
ninja: error: Stat(...RNGestureHandlerDetectorShadowNode.cpp.o): Filename longer than 260 characters
```

Measured rather than guessed. The failing object path is **363 characters against a
260 limit**, and it decomposes into two parts that cannot be shortened:

| Segment | Length |
|---|---|
| CMake object dir (`...autolinked_build/CMakeFiles/react_codegen_*.dir/`) | 119 |
| Mirrored source tail (`node_modules/react-native-gesture-handler/shared/shadowNodes/...`) | 153 |
| **Irreducible minimum, with a zero-length prefix** | **272** |

272 already exceeds 260, so **no amount of relocation can fix this**. Measured
candidates, for the record:

| Approach | Result |
|---|---|
| `subst X:` the repo root | 305 — fails |
| Short CMake staging dir (`C:\b`) | 307 — fails |
| Both combined | 278 — still fails |

The monorepo move is not the cause: `apps/` added about 5 characters to a problem that
is 103 over.

The fix is `HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled = 1`
plus a reboot — it requires elevation, so it is an operator step, not something the
repo can carry. `git config core.longpaths true` is set in the repo (no elevation
needed) and is a separate concern from the compiler toolchain.

The alternative that avoids the issue entirely is EAS: the cloud builders are Linux
and have no `MAX_PATH`, which is part of why `eas.json` is committed.

---

## 2026-07-22 — v0.2.0: monorepo, verifiable TrustScore, safer red flags

Re-engineering pass. v1 worked, but three structural problems made it unsafe to
grow: the core logic existed twice, nothing was tested, and the emergency matcher
had real defects.

### 1. One copy of the logic (`packages/core`)

**Problem.** `src/lib/{types,ranking,taxonomy,format}.ts` and `sample-doctors.json`
were **byte-identical** copies of `mobile/src/lib/*`. The README documented the
workaround: *"Change one side, copy to the other."* For a product whose whole claim
is that the same doctor gets the same honest score everywhere, the scoring function
existing twice was the deepest flaw in the repo.

**Change.** npm workspaces:

```
packages/core/   taxonomy, emergency, routing, ranking, geo, format, schemas, sample data
packages/db/     schema, migrations, doctor query layer
apps/web/        Next.js — thin, no scoring logic
apps/mobile/     Expo — thin, imports core, never re-implements it
```

Both apps now import `@dr-evide/core`. The packages ship TypeScript source rather
than a build step: Next compiles them via `transpilePackages`, Metro handles TS
natively. One less build to keep in sync, and stack traces stay readable.

**Remaining duplication, deliberately.** `packages/db/seed.mjs` is plain Node and
cannot import the TypeScript taxonomy, so it repeats the specialty list.
`taxonomy-drift.test.ts` parses the seed file and fails CI if the two diverge.

### 2. TrustScore is now reproducible and versioned

**Problem.** Zero tests anywhere in the repo. `scoreDoctor()` called
`new Date().getFullYear()` internally, so it could not be snapshot-tested and every
doctor's score silently shifted each 1 January. No version stamp: tuning a weight
rewrote every score the product had ever shown, with no record.

**Change.**

- Scoring is a pure function of `(doctor, RankingContext)`. `asOfYear` is injected;
  nothing in `packages/core` reads the clock, the network, or `process.env`.
- `SCORE_VERSION` (currently `1.0.0`) is stamped on every `RankedDoctor` and returned
  by `/api/doctors`. **Bump it and record the change here whenever weights or maths
  move.**
- `ranking.test.ts` freezes exact expected scores for three scenarios. A weights
  change now produces a visible, reviewable diff instead of a silent re-baseline.
- Tests also pin the promises themselves: unverified credentials are discounted 40%,
  distance can never outweigh quality, components stay within their published
  weights, ties break deterministically, and injecting a `sponsored`/`boost` field
  does not move the number.
- `/api/doctors` returns `as_of_year`, threaded to the cards so the displayed
  "12 yrs" is computed from the same year as the score beside it.

### 3. Emergency detection — three real defects fixed

This is the one code path where a miss can cost a life.

**Defect A — stroke was not detected.** *Found by a test written during this pass.*
"her face is drooping and speech is slurred" is a textbook stroke and matched
neither `"face drooping"` nor `"slurred speech"`, because matching required
contiguous word order. Fixed with a second, order-insensitive tier
(`MEDICAL_WORD_SETS`) where every word of a curated set must appear somewhere in the
text — `["face","drooping"]`, `["speech","slurred"]`, `["chest","pain"]`, and so on.

Restricted to unambiguous clinical content words on purpose: applied to a set
containing a common function word it would be far too loose (`["not","waking"]`
would fire on "not sleeping well, waking up tired").

**Defect B — false emergencies from substring matching.** `"fits"` matched
**"benefits"**, "outfits", "profits". All three are now regression tests.

**Defect C — Malayalam did not work.** The home screen promises *"Malayalam &
English both work"*; the matcher was English-only. Added Malayalam script and
romanised Malayalam ("Manglish") terms to both the red-flag list and the routing
taxonomy — Manglish because it is how a large share of Kerala actually types.

**Also:** mental-health crises are now a separate category routing to Tele-MANAS
(14416) rather than 108. An ambulance is not what someone in crisis needs offered
first.

### 4. Routing misroutes fixed

The same substring bug affected `KEYWORD_MAP`, and these were live:

| Text | Matched | Wrongly routed to |
|---|---|---|
| "my **heart** beats fast" | `ear` | ENT |
| "pain near my **kid**ney" | `kid` | Pediatrics |

Matching now runs through `packages/core/src/text.ts`, which is script-aware:
**Latin → whole word** (substring matching caused the bugs above); **Malayalam →
substring** (the language is agglutinative — `പനി`/"fever" is a genuine prefix of
`പനിയുണ്ട്`/"[I] have a fever", and a whole-word test would miss the most natural
phrasing).

### 5. Boundaries validated, data-leak closed

- Zod schemas at every untrusted boundary: query strings, JSON bodies, model output,
  and **database rows**. A `Doctor` interface asserts nothing at runtime about what
  `SELECT *` returned.
- `SELECT *` replaced with an explicit column list. It was shipping the PostGIS
  `geom` blob and every future internal column straight to the browser. Adding a
  column is now a deliberate decision to publish it.
- Radius is *clamped*, not rejected — a user dragging a slider should never be able
  to produce an error.

### 6. LLM routing rewritten

`routing.ts` used a raw `fetch` with a bare `JSON.parse`, no timeout, and no rate
limit.

- Official `@anthropic-ai/sdk`, schema-enforced output via `output_config.format`,
  then validated again with zod. The model is untrusted input; unknown specialty
  slugs are dropped without failing the whole parse.
- **6-second timeout** (the SDK default is ten minutes — indistinguishable from the
  site being broken, for someone unwell on a phone).
- **Rate limited**, 20/min per caller. The endpoint spends money on every call and
  shipped unmetered.
- Model kept at Haiku (`claude-haiku-4-5`, alias rather than a dated snapshot). This
  is a short classification over seven departments — the cheap, fast tier is
  correct, and it was the project's existing choice.
- **No prompt caching, deliberately.** Haiku 4.5's minimum cacheable prefix is 4096
  tokens; this system prompt is a fraction of that, so a `cache_control` breakpoint
  would pay the write premium and never be read. Revisit if the prompt grows.
- The emergency check runs *before* the model and is never delegated to it. If the
  model flags an emergency our local check missed, the user still gets the vetted
  message and helplines — never model-authored crisis copy.

### 7. Privacy (DPDP Act 2023)

Symptom free-text is sensitive personal data. It is now never logged — not on the
success path, not in any error branch — never persisted, and never placed in a URL.
`/api/route-symptom` responds `cache-control: no-store`. The rate limiter keys on a
coarse caller identity that is never stored alongside the complaint.

### 8. Framework unification (required, not cosmetic)

Web was React 18.3 / Next 14 / TS 5.5; mobile was React 19.2 / RN 0.86 / TS 6.0.
Hoisting two React type trees into one workspace broke the build outright
(`'ChevronLeft' cannot be used as a JSX component`). Web moved to **Next 15.5 +
React 19.2.3**, matching mobile exactly.

Carried changes: `params`/`searchParams` are now Promises (Next 15); react-leaflet
4 → 5 (v4 peers on React 18); `outputFileTracingRoot` pinned, because Next was
walking up and selecting a stray lockfile in the home directory.

Also fixed a latent bug in the mobile manifest: `react` was pinned exact at 19.2.3
while `react-dom` used a caret, resolving to 19.2.8, whose peer demands
react ^19.2.8.

### 9. Provenance and audit trail

`nmc_verified` was a bare boolean driving 30% of a public score attached to a named,
real person — with no way to answer *who checked this, against what, and when*. That
is both the audit trail a defamation claim would demand and what makes the score
honest rather than merely confident.

Added `credential_provenance` (append-only by convention: correct a bad check by
inserting a newer row) and `score_history` (per-doctor score with the
`score_version` that produced it). The seed writes honest `sample-data` provenance
saying nobody verified anything.

### 10. CI, and enforcing the promise mechanically

`npm run verify` = integrity → typecheck → lint → test. GitHub Actions runs it plus
the web build on every push and PR.

`scripts/check-no-paid-ranking.mjs` fails the build if an identifier like
`sponsored`, `paid_placement`, `boost_score`, or `bid_amount` appears anywhere in
`apps/` or `packages/`. "Ranking is never for sale" was previously protected by a
comment and whoever reviewed the PR; it is now a build failure. Verified to exit 1
on a planted violation.

### Verification at time of writing

Static:

- `npm run check:integrity` — passes (12 patterns, 0 violations); verified to exit 1 on a
  planted violation, so the gate is real
- `npm run typecheck` — 4/4 workspaces clean
- `npm run lint` — clean
- `npm test` — **109 passing**
- `npm run build` — web builds clean on Next 15.5

Runtime, against a live dev server (not just the build):

| Check | Result |
|---|---|
| `/api/doctors?specialty=dermatology&conditions=hair fall` | ids 1, 3 at **88, 55** — identical to the golden tests |
| Response envelope | `score_version: 1.0.0`, `as_of_year: 2026`, `sample_data: true` |
| Column leak | no `geom` or `created_at` in the payload |
| `specialty=astrology` | 400 |
| `radius=9999` / `radius=abc` | clamped to 100 / defaulted to 15 |
| `/api/doctors/abc` / `/api/doctors/9999` | 400 / 404 |
| "my heart beats very fast" | cardiology only — **no ENT** (the `ear` misroute is gone) |
| "pain near my kidney area" | general — **not Pediatrics** (the `kid` misroute is gone) |
| "what are the benefits of this medicine" | general — **not an emergency** (the `fits` false positive is gone) |
| "her face is drooping and speech is slurred" | medical emergency, 108 — **the stroke case now flags** |
| "I have a lot of pain in my chest" | medical emergency, 108 (natural word order) |
| "I want to kill myself" | mental-health, **14416 first**, then 108 |
| "enikk nenju vedana undu" (Manglish) | medical emergency |
| "എനിക്ക് പനിയുണ്ട്" (agglutinated Malayalam) | general — the substring path works |
| Every emergency response | `specialties: []` — no doctor list to browse instead |
| `POST /api/route-symptom` | `cache-control: no-store`; 400 on short/absent text |
| Rate limit | 429 after 20 requests in the window, with `retry-after` |
| `/`, `/results`, `/doctor/1` | 200, no errors in the server log |
| Profile page for doctor 1 | renders **88** — the same number as the API and the goldens |

### Notes for whoever is next

- Dev servers were stopped to allow the directory restructure — restart with
  `npm run dev` (web) and `npm run mobile` (Expo).
- **All seeded doctors remain fictional.** Nothing here is ready to rank a real
  person. See the pre-launch checklist in `README.md`.
- The rate limiter is in-process: per-instance, resets on deploy, useless against a
  distributed caller. Move to Redis before running more than one instance.
- Not done in this pass: the ~69 inline `style={{}}` blocks that bypass the design
  system in `apps/web/src/styles/ds/`, and native review/profile-claiming (v1.5).

---

## v0.3 — privacy, failure states, and reading the result (Aug 2026)

A review pass over v0.2. The core was not the problem: `packages/core` as one source
of truth, pure scoring, the golden tests and the integrity gate all held up. What
was missing was the ring around it — the app had no error paths, no security
headers, health data reached third parties through URLs, and the interface failed
contrast for the people it was built for.

**Nothing in this pass changes a TrustScore number or an emergency red flag.**
`SCORE_VERSION` stays at `1.0.0` and the golden tests are untouched. The one
addition to `ranking.ts` (`describeScore`) is presentation-only and never feeds the
sort — but it carries documented thresholds, so it is versioned with the weights.

### 1. Condition keywords no longer travel in the URL

`/api/route-symptom` was careful with symptom text — classified in memory, never
persisted, never logged, `no-store` — and then the routed keywords went into a
query string:

```
/results?specialty=cardiology&conditions=chest+pain
```

Which put them in browser history on a phone that is often shared, in the access
log of every proxy in front of the app, and in the `Referer` header of all ~20
OpenStreetMap tile requests the results map fires per view, plus every click
through to Google Maps.

Two fixes, in order of how fast they stop the bleeding:

- `Referrer-Policy: no-referrer` in `next.config.mjs`, which closes the
  third-party leak immediately and absolutely.
- `apps/web/src/lib/search-context.ts` — the search (conditions, radius,
  coordinates) now lives in `sessionStorage`. The cost is shareable result links,
  which is the right trade: a URL that reproduces someone's symptom search is not
  a link they should be able to send by accident.

The doctor profile was server-rendering its score from those query parameters, so
`ProfileScore` and `ClinicDistance` are now client components. That is a smaller
change than it looks — scoring is pure, so `scoreOne` produces the same number in
the browser that it produces in the API route, from the same inputs.

### 2. A dropped connection is no longer reported as "no doctors"

The results fetch had a `finally` but no `catch`. On a failed request `data` stayed
null and the page rendered "No Dermatology doctors within 5 km." On rural mobile
data that was the common path, and telling someone unwell that nobody is nearby
when the request never landed is the worst failure this product can produce.

There is now an explicit `LoadError` of `"offline" | "server"`, a retry, and copy
that says plainly it does not mean there are no doctors nearby. `!res.ok` is
handled separately from a thrown request.

Also added: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`, and a
profile `loading.tsx`. There was no boundary anywhere, so a `getDoctor()` throw —
and the pool has a 5s statement timeout precisely because that happens — rendered
Next's own stack-trace page, with no way back and no mention of 108. Both error
screens carry the 108 number; that must work on every screen, including a broken
one. A missing doctor is now a real 404 rather than "Doctor not found." with a 200.

### 3. Contrast

`--text-faint` (`#938F84`) measured **3.1:1** on `--bg`, under the 4.5:1 AA needs
for body text. It renders the medical disclaimer, the `108` number, the "not yet
verified" credential note, and the symptom-box hint. `--warning` as text on its own
12% tint measured **2.7:1** — the "Sample data" pill, i.e. the marker saying these
people are not real.

Both stepped down the same ramps to 5.1:1 and 6.9:1, in `apps/web/src/styles/theme.css`
and `apps/mobile/src/theme.ts` identically, so a card reads the same in both.

### 4. Radius constants had drifted into three files

| Where | MIN | DEFAULT | MAX |
|---|---|---|---|
| `core/geo.ts` | 1 | **15** | 100 |
| web `RadiusControl` | 1 | **5** | 25 |
| mobile `results.tsx` / `api.ts` | 1 | **5** | 25 |

The web slider opened at 5km while `doctorSearchSchema` defaulted to 15km, so a
bare API call and the same search through the UI returned different result sets.
Now one definition in `geo.ts`, with the two platform defaults stated once
(`WEB_RADIUS_DEFAULT_KM`, `MOBILE_RADIUS_DEFAULT_KM`). `MAX_RADIUS_KM` dropped
100 → 25: nothing in either app could ask for more, so the only caller a 100km
ceiling served was an anonymous one pointing a radius scan at the database.

### 5. The mobile app now asks where you are

Every mobile screen passed `DEFAULT_LOCATION`, so "near you" meant "near Edappal
town centre". Not only wording: the nearness term inside `accessibility` (10 points)
is measured from the search origin, so the website and the app could produce
different scores for the same doctor — the exact divergence `packages/core` exists
to prevent.

`apps/mobile/src/lib/location.ts` wraps `expo-location`, caches per session so the
list and the profile measure from the same origin, and falls back to Edappal on
every failure path. Nobody is blocked from finding a doctor for declining to share
their location, and the results screen says when distances are approximate.

**Requires `npm install`** — `expo-location` is a new dependency, and the Android
permissions were already declared in `app.json`.

### 6. `LIMIT 200` truncated by distance, before ranking by score

Candidates were cut by distance and then ranked by TrustScore, so past 200
candidates the highest-scoring doctor in the radius could be dropped for being
marginally farther than the cut — directly against "distance is a filter and a
tiebreaker, not a quality signal". Raised to 2,000 and named
`SEARCH_CANDIDATE_CAP` with the reasoning attached. Latent at current data volume;
a correctness bug the day real data lands.

### 7. Observability without payloads

The LLM fallback was deliberately silent:

```ts
} catch { return null; }   // timeout, 429, network, bad JSON — all the same
```

Swallowing the content is right; the body is the user's symptom text. Swallowing
the fact is not — if the key expires, every user silently drops to keyword routing
and nothing says so.

`apps/web/src/lib/telemetry.ts` counts names and integers and **physically cannot
record a payload**: `count()` takes no free-text argument and the label type is a
closed union. Exposed at `/api/health`, along with whether the app is serving
sample data. In-process like the rate limiter, and honest about it.

Also: `/api/doctors` gained a rate limit (60/min — looser than routing, because
dragging the slider legitimately bursts) and `cache-control: private, max-age=30`.
`callerKey` now counts `x-forwarded-for` from the right via `TRUSTED_PROXY_HOPS`;
reading the first entry took whatever the caller wrote, so any script could mint a
fresh quota per request. The `pg` pool moved onto `globalThis`, because Next's dev
server was opening ten more connections on every save.

### 8. Reading the result

- **TrustScore was unanchored.** A bare "74" says nothing about whether that is
  good, and the ring reads as a share of a 100 that is not reachable — browsing a
  department without describing a symptom caps `condition_relevance` at 10, so the
  ceiling is 90, not 100. `describeScore` bands against the *reachable* maximum, so
  the same doctor does not look worse for having been reached from a tile. Each
  card also names its strongest signal, so a number is never the only
  justification on screen.
- **Sample data is now a page-level banner**, not a 24px pill. The API had returned
  `sample_data: true` all along; the UI never rendered it. This is the clearest
  legal exposure in the product and it was the quietest thing on the page.
- **Skeletons** shaped like the real card, replacing a one-line "Finding doctors…"
  that measured nothing and reflowed the page on every search.
- **The empty state offers the widen** instead of describing it.
- **The emergency alert scrolls into view and takes focus.** On a phone it rendered
  below a textarea, a hint row and a 58px button, so the most important message in
  the product could be off-screen. It also renders the helplines the match carried,
  so a mental-health flag offers Tele-MANAS first rather than an ambulance.
- Skip link, a real `<label>` on the symptom box, 44px back link, `aria-live` on
  the result count.

### 9. Malayalam interface

The taxonomy carried full Malayalam and Manglish keyword sets — so someone could
type `മുടി കൊഴിച്ചിൽ`, be routed correctly, and land on a page reading
"Dermatology near you · TrustScore · NMC verified". The input was bilingual and the
output was not, which meant the people the Malayalam matcher was built for were the
ones least able to read the result.

`packages/core/src/i18n.ts` holds the strings — in core, not the web app, because
both apps will show them. **Only the website is wired up in this pass.** The mobile
app still renders English, including the full-bleed emergency screen, which is the
highest-stakes copy in the product and is mobile-only. The strings it needs are
already in core; what is missing is a language control and the wiring. That is the
next thing to do, and it should not wait long. Departments gained an `ml` block in `taxonomy.ts` (parallel,
not replacing: the English `name`/`description` are what the seed writes to the
`specialties` table and what `taxonomy-drift.test.ts` asserts). Emergency copy
carries `messageMl` through `EmergencyMatch` and `RoutingResult`.

The toggle is two labelled buttons rather than a select, and the choice is
remembered in `localStorage` and applied to `document.documentElement.lang` — which
decides which voice a screen reader uses, so Malayalam under `lang="en"` would be
worse than not translating at all.

**The Malayalam has not been reviewed by a native speaker.** It must be before
launch. A mistranslation in the emergency copy is the one bug in this product that
can cost a life.

### Verification at time of writing

What was actually run, and what was not. This matters more than usual: the
environment this pass was done in could not execute most of the toolchain — the
repository was mounted over a slow network filesystem, and `node_modules` had been
installed on Windows, so the native `rollup` binary vitest needs does not load on
Linux. `tsc` and `eslint` over the mount did not finish inside the time available.

Run, and passing:

- `npm run check:integrity` — 12 patterns, 0 violations
- `packages/core` typecheck (`tsc --noEmit -p packages/core/tsconfig.json`) — clean
- A TypeScript parse of all 48 changed and added `.ts`/`.tsx` files — no syntax errors

**Not run:** `npm test`, `npm run lint`, `npm run build`, and the `apps/web` and
`apps/mobile` typechecks. No dev server was started, no page was loaded, no API
response was inspected — the v0.2 runtime table above has **not** been re-run.

**Run `npm install && npm run verify` before trusting this diff**, and redo the
runtime checks. `npm install` is required regardless: `expo-location` is new.

Worth exercising by hand, because these are behaviour changes rather than refactors:

| Check | Expected |
|---|---|
| Search from the symptom box, then read the URL | `/results?specialty=…` only — no `conditions`, no `lat`/`lng` |
| Open a doctor from that list | The ring shows the same number as the card |
| Open that same doctor URL in a fresh tab | Renders, using the no-context defaults |
| DevTools → Network → any map tile request | No `Referer` header |
| Kill the network, then drag the radius | "We couldn't reach the service" and a retry — **not** "No doctors within N km" |
| A department with nobody in range | The widen button appears, and works |
| `GET /api/health` | `sample_data`, `score_version`, counters; 503 when the DB is down |
| Type a red flag on a narrow viewport | The alert scrolls into view and takes focus |
| Switch to മലയാളം | Survives a reload; `<html lang>` becomes `ml` |
| Mobile, first launch | Location prompt; declining still returns results |

### Still open

- **Malayalam review by a native speaker.** Blocking.
- **The mobile app is still English-only**, emergency screen included. The strings
  exist in core; the app needs a toggle and the wiring.
- SEO and structured data (P3, deliberately not in this pass): no `robots.txt`,
  no `sitemap.ts`, no `generateMetadata` on profiles, no `Physician` JSON-LD. Every
  doctor page still shares one title, so none of them can rank for
  "dermatologist near Edappal".
- `manifest.json` still has `"icons": []`, so the PWA cannot be installed — which
  matters most on the low-end Android that dominates the launch area.
- No tests outside `packages/core`. The API routes, the HTTP-level zod boundaries,
  the rate limiter's window behaviour and the LLM fallback chain are all untested,
  and the untrusted-model parser is the riskiest code in the repo.
- The rate limiter and the telemetry counters are both in-process. Redis before a
  second instance.
- CSP still carries `unsafe-inline` for scripts and styles: styles because the
  pages use inline `style={{}}`, scripts because Next's bootstrap needs a nonce
  otherwise. Both worth closing; neither a reason to have shipped no policy.
