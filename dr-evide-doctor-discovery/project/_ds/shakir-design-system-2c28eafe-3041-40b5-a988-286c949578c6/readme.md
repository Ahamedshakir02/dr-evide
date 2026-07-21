# Shakir Design System

A personal, medium-spanning design system — interfaces, posters, slides, graphics.

**Philosophy in one line:** minimal and clean as the foundation, with **one expressive moment per view.** Restraint everywhere except the headline. Whitespace does the work.

**North star:** Relay (relayfi.com) — *tactile editorial.* Massive condensed ALL-CAPS headlines, scrapbook cutouts, hand-drawn scribbles, paper textures — staged mess on a strict grid. Full treatment on marketing / posters / landing; for app UI keep only the type personality and warmth.

**Adaptive, not fixed.** Strong defaults you lean on and deviate from *deliberately* — and when you deviate, **state what changed and why in one line.**

### Hard rules
1. **One expressive element per view.** If the headline is loud, everything else stays quiet.
2. **Max two accent colors, ever** (Flare + optional Pine).
3. **No shadow heavier than `--shadow-md`** (`0 4px 24px rgba(14,14,16,0.08)`). Separate with borders + contrast first.
4. **No emoji** unless explicitly asked.
5. **State deviations** from the system in one line.

---

## Sources

This system was authored from the **Shakir Design System brand spec** (the token set + brand guide: `tokens/colors·typography·spacing·fonts.css` and the written philosophy). No external codebase or Figma file was provided — the spec is the source of truth. The named products in scope are a **portfolio**, a **product app (ThengaPari)**, and **posters / marketing**.

**Fonts are CDN stand-ins, not licensed files:**
- **Anton** (Google Fonts) stands in for a Druk-like condensed display face.
- **Clash Display** + **General Sans** from Fontshare.
- **JetBrains Mono** (Google Fonts).

> ⚠️ **Substitution flag:** Anton is a CDN substitute for the intended licensed condensed face (e.g. Druk). If you license a preferred condensed face, self-host it and repoint `--font-display-caps` and the `@font-face`/`@import` targets in `tokens/fonts.css`. Clash Display + General Sans are served live from Fontshare; if you'd rather self-host, upload the files and add `@font-face` rules.

---

## Content fundamentals

**Voice:** friendly and casual — a sharp, warm colleague. Confidence without hype.

- Address the reader as **"you."** The brand is "we" *sparingly*; mostly it just *does* — "Saved", "Synced".
- **Sentence case everywhere.** ALL-CAPS only for tiny eyebrow labels (12px, tracking 0.08em). Never Title Case Every Word.
- **Short.** Headlines are a phrase. Cut filler. **Max one exclamation per view.** Em dashes for warmth.
- **Lead with the number, quiet label** — "$23.8M raised", not "Total amount raised…". Mono + tabular figures for data.
- No emoji, no "!!!", no superlatives ("revolutionary", "world-class").

**Sample voice:** "Let's go" · "You're all set" · "Nice — saved!" · "Nothing here yet" · "That didn't work — try again?"

---

## Visual foundations

**Color.** Warm neutral base (~90% of any surface, faint warm tint — never cold blue-gray) + **one** dominant accent (**Flare**, warm coral `#F94E29`) + an **optional** secondary (**Pine**, deep green `#137A52`). Accent appears only in the **headline moment, primary action, and key data** — nowhere else. Never pure `#000`/`#fff`. On light backgrounds, accent *text* uses the darker step (`--accent-text` = Flare-700); bright Flare-500 is for fills and large display. Semantic colors (success/warning/danger/info) are utility-only, kept separate from brand.

**Theme.** Light `:root` = editorial / docs / slides / posters. **Dark (`[data-theme="dark"]`) is the default for app UI / dashboards.**

**Type.** Three display voices: **Anton** (massive condensed ALL-CAPS hero — type *is* the hero, marketing default), **Clash Display** (mixed-case app headers / slides, tracking −0.02 to −0.04em), **General Sans** (quiet body / UI, 16px base, line-height 1.6+), **JetBrains Mono** (data / IDs / timestamps, tabular). Signature pairing: a quiet uppercase eyebrow above **one** loud display line. An accent-colored word or a small inline cutout mid-headline is the tactile-editorial signature.

**Backgrounds.** Flat and warm — the off-white (`#FAFAF8`) / near-black (`#0E0E10`) *is* the background. **No decorative gradients.** (The only gradient anywhere is a faint radial accent-glow on the marketing login aside; called out as a deviation.) Marketing surfaces add **photographic cutouts of real objects** (receipts, folders, tape, polaroids) scattered at slight rotations on a strict grid, plus one or two **hand-drawn scribbles** (arrows, underlines) used like punctuation. App UI drops the collage entirely — clean, just type personality and warmth.

**Shape — the signature: sharp structure meets soft touch.** Structural panels / sections / dividers: `0–4px` (`--radius-panel`). Interactive buttons / inputs / clickable cards / modals: `10–16px` (`--radius-md` 12 / `--radius-lg` 16). Tags / chips / pill CTAs / avatars: fully rounded (`--radius-pill` 999px). **Never round a structural panel; never sharpen a button.**

**Cards.** Default card = `--surface` + 1px border, `--shadow-sm` at most — often none, just the border. Interactive cards lift `shadow-sm → md` and `translateY(-2px)` on hover. Structural cards use the panel radius (sharp); content cards use the soft 16px radius.

**Borders & shadows.** Hairline 1px borders do most structural separation. Shadows are subtle and rare: `xs 0 1px 2px /.05` · `sm 0 2px 8px /.06` · `md 0 4px 24px /.08` (heaviest allowed). **No glows except the focus ring** — a 3px Flare halo, always visible, never removed.

**Spacing & layout.** 8px grid (4/2 for fine tuning): `0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 80 · 120 · 160`. Section padding ≥80px desktop / ≥48px mobile. Content max `1180px` · reading measure `720px` · full shell `1320px`. Airy by default, one focal point per view.

**Motion.** Motion guides attention — it never decorates a resting view. One expressive motion moment per view. **Easing is never linear:** `--ease-spring` `cubic-bezier(0.34,1.56,0.64,1)` for entrances (overshoot), `--ease-out` `cubic-bezier(0.22,1,0.36,1)` for UI moves. Durations fast 140 / base 240 / slow 480ms. Elements arrive one-by-one, **staggered 60ms**. **Hover:** buttons darken one step + `translateY(-1px)`; cards lift shadow. **Press:** `scale(0.98)` and/or drop to a press color. Idle app screens don't animate. Everything collapses under `prefers-reduced-motion`. Marketing surfaces get the full repertoire (fade+position, morph, masking, parallax, scroll choreography) — one hero technique at a time.

**Transparency / blur.** Used minimally — translucent overlays on dark (`rgba(255,255,255,.10)` borders), a 45%-opacity scrim behind dialogs. No frosted-glass everywhere.

**Imagery vibe.** Warm, flat, real. Photographic cutouts of real desk objects, no clip-art, no skeuomorphism, no stock-photo filler, no decorative gradients. App UI stays clean.

---

## Iconography

- **App UI:** thin-stroke **Lucide** line icons — 1.5–2px stroke (default 1.75), rounded joins, no fill. Sizes **16** (inline) / **20** (buttons, nav) / **24** (feature). Icons inherit `currentColor` (usually muted); accent-colored **only** when the icon *is* the active element. Loaded from CDN (`unpkg.com/lucide`) — see `guidelines/iconography.card.html`.
- **Marketing / posters:** icons mostly disappear — replaced by real-object photographic cutouts, sticker badges, and hand-drawn scribbles. Don't sprinkle line icons over a collage.
- **Unicode glyphs** (`→`, `·`, `▲`, `▼`) are fine inline. **Emoji are never used as icons.**

> Substitution flag: Lucide is a CDN icon set, not a bespoke Shakir icon library. It matches the intended thin-stroke / rounded-join / no-fill style. Swap for a licensed set later if desired; keep the stroke weight and join style.

---

## Index — what's in this system

**Global entry:** `styles.css` — link this one file. It `@import`s everything below.

**Tokens** (`tokens/`): `fonts.css` (webface `@import`s) · `colors.css` (neutral / Flare / Pine ramps, semantic, light + dark surfaces) · `typography.css` (families, fluid display + UI scales, leading, tracking, helper classes) · `spacing.css` (8px grid, widths) · `shape.css` (radius, borders, shadows, focus ring) · `motion.css` (easing, durations, stagger, reduced-motion) · `components.css` (shipped component classes).

**Foundation cards** (`guidelines/*.card.html`) — Design System tab specimens for Colors, Type, Spacing, Brand.

**Components** (`components/`) — React primitives, namespace `window.ShakirDesignSystem_2c28ea`:
- `buttons/` — **Button**, **IconButton**
- `forms/` — **Input**, **Select**, **Checkbox**, **Switch**
- `data-display/` — **Card**, **Badge**, **Tag**, **Avatar**, **Stat**
- `navigation/` — **Tabs**
- `feedback/` — **Dialog**, **Toast**, **Tooltip**

**UI kits** (`ui_kits/`):
- `app/` — **ThengaPari**, a dark, restrained money/runway dashboard (login → overview → send-money dialog). Composes the primitives.
- `marketing/` — **poster / landing hero**, full tactile-editorial treatment (massive Anton headline, scrapbook cutouts, scribble, paper stand-ins, image-slots for real-object photos).

**Slides** (`slides/*.card.html`) — title, big-stat, section/quote specimens at 1280×720.

**Skill** (`SKILL.md`) — makes this folder usable as a downloadable Agent Skill.

---

## Caveats / open questions
- **Fonts are CDN defaults, not licensed files** — swap + self-host a preferred condensed face (Druk) and Fontshare faces if you license them.
- **Flare + Pine are the default brand pairing** — re-skinnable per project via the `--accent-*` tokens.
- **No cutout photography ships** — supply real object photos per project; CSS stand-ins (polaroid, tape, receipt, sticker) and `<image-slot>` placeholders exist for them.
- **Lucide is a CDN stand-in** for a bespoke icon set.
