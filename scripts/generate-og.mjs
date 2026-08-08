/**
 * OpenGraph card generator.
 *
 * Produces apps/web/public/og.png — the 1200×630 image every share of this
 * site renders as, on WhatsApp above all, which is how a link actually travels
 * in the launch area.
 *
 * ── Why this is a script and not a font in the repo ──────────────────────
 *
 * The obvious build is `next/og` with a self-hosted brand face. It is not
 * available: Clash Display and General Sans are under the ITF Free Font
 * License, which permits use in any media at any scale but prohibits
 * redistributing the font files and prohibits serving them
 * ("...not allowed to transmit the Font Software over the Internet in font
 * serving... uploading them in a public server"). Committing a .ttf or
 * shipping a woff2 from /public is exactly that. The licensed delivery path
 * for web use is Fontshare's own API, which is what fonts.css already does.
 *
 * The same licence is explicit that the *output* is fine: "You may use the
 * Font Software to create logos and other graphic elements, images on any
 * surface, vector files or other scalable drawings and static images." A
 * rendered PNG contains no font software. So the font is downloaded here, at
 * generation time, on the machine of whoever runs this, and only the image is
 * committed.
 *
 * ── Why the text becomes outlines ────────────────────────────────────────
 *
 * sharp rasterises SVG through librsvg, which resolves <text> against the
 * generating machine's installed fonts — so a wordmark comes out in Segoe UI
 * on Windows and something else on a Linux CI box. opentype.js converts each
 * string to a path first, so the glyphs in the output are the brand's glyphs
 * and the result is byte-identical wherever it runs.
 *
 * English only, deliberately. "ഡോക്ടർ എവിടെ?" needs Malayalam shaping —
 * reordering, conjuncts, above-base marks — and opentype.js does not do it.
 * A mis-shaped Malayalam wordmark on the card that represents this product to
 * every Malayalam reader who sees a shared link is worse than not setting it.
 *
 * Run it by hand, commit the PNG, like the icons:
 *
 *     npm run og
 */
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARK = path.join(ROOT, "assets/brand/mark.svg");
const OUT = path.join(ROOT, "apps/web/public/og.png");

/** Brand teal — --accent in apps/web/src/styles/theme.css. */
const TEAL = "#0f766e";
const CREAM = "#FAFAF8";
const INK = "#201F1F";
const MUTED = "#4E4B43";

const W = 1200;
const H = 630;

/**
 * The exact files fonts.css asks Fontshare for, at the weights the site uses
 * for the wordmark and for body copy. Resolved through the same API rather
 * than hardcoded CDN hashes, so a re-cut font is picked up instead of 404ing.
 */
const FONT_QUERY = "https://api.fontshare.com/v2/css?f[]=clash-display@600&f[]=general-sans@500";

async function loadFonts() {
  const css = await fetch(FONT_QUERY).then((r) => {
    if (!r.ok) throw new Error(`Fontshare returned ${r.status}`);
    return r.text();
  });

  // One .ttf per @font-face block, in the order requested. opentype.js reads
  // TrueType and OpenType; the woff2 the browser gets is no use here.
  const urls = [...css.matchAll(/url\('(\/\/[^']+\.ttf)'\)/g)].map((m) => `https:${m[1]}`);
  if (urls.length < 2) {
    throw new Error(`Expected two .ttf URLs from Fontshare, got ${urls.length}`);
  }

  const [display, body] = await Promise.all(
    urls.slice(0, 2).map(async (u) => {
      const res = await fetch(u);
      if (!res.ok) throw new Error(`${u} returned ${res.status}`);
      return opentype.parse(await res.arrayBuffer());
    })
  );

  return { display, body };
}

/**
 * Serialise an opentype Path ourselves.
 *
 * `Path.toPathData()` in opentype.js 2.0.0 emits literal "NaN" into the middle
 * of the output for some strings — "Find the right doctor near you" produces it
 * three glyphs in, at every rounding setting, while the commands it was built
 * from are all well-formed numbers. Whatever the cause, librsvg stops drawing
 * at the first bad coordinate, so the tagline rendered as "Fin" and the rest of
 * the sentence silently vanished.
 *
 * Ten lines here removes a library quirk from the middle of a brand asset, and
 * the assertion below means the same failure can never ship as a half-drawn
 * sentence again.
 */
function toPathData(path, places = 2) {
  const n = (v) => Number(v.toFixed(places));
  return path.commands
    .map((c) => {
      switch (c.type) {
        case "M":
          return `M${n(c.x)} ${n(c.y)}`;
        case "L":
          return `L${n(c.x)} ${n(c.y)}`;
        case "C":
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        case "Q":
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        case "Z":
          return "Z";
        default:
          throw new Error(`Unhandled path command "${c.type}"`);
      }
    })
    .join("");
}

/**
 * A string as SVG path data, plus its advance width so the caller can centre
 * or stack it without guessing.
 */
function textPath(font, text, size, x, y) {
  const d = toPathData(font.getPath(text, x, y, size));

  // A non-finite coordinate does not throw — it truncates the glyph run, which
  // looks like a design decision rather than a bug. Fail the generator instead.
  if (!/^[\d\s.,-]/.test(d.slice(1)) || /NaN|Infinity|undefined/.test(d)) {
    throw new Error(`Bad path data for ${JSON.stringify(text)}`);
  }

  return { d, width: font.getAdvanceWidth(text, size) };
}

const svg = ({ markPath, wordmark, tagline, pledge }) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${CREAM}"/>
  <rect x="0" y="0" width="${W}" height="14" fill="${TEAL}"/>
  <g transform="translate(96, 150) scale(2.6)">
    <path fill="${TEAL}" fill-rule="evenodd" d="${markPath}"/>
  </g>
  <path d="${wordmark.d}" fill="${INK}"/>
  <path d="${tagline.d}" fill="${MUTED}"/>
  <path d="${pledge.d}" fill="${TEAL}"/>
</svg>`;

const { display, body } = await loadFonts();

// The mark's path, lifted from the one definition rather than restated —
// the same rule generate-icons.mjs follows.
const markSvg = await readFile(MARK, "utf8");
const markPath = markSvg.match(/\sd="([^"]+)"/s)?.[1]?.replace(/\s+/g, " ").trim();
if (!markPath) throw new Error("Could not find the path in assets/brand/mark.svg");

const LEFT = 96;
const composed = svg({
  markPath,
  wordmark: textPath(display, "Dr Evide", 104, LEFT, 400),
  tagline: textPath(body, "Find the right doctor near you", 44, LEFT, 470),
  // The one claim the whole product rests on, so it is on the card.
  pledge: textPath(body, "Ranked by verified credentials — never by who paid", 30, LEFT, 536),
});

await sharp(Buffer.from(composed)).png({ compressionLevel: 9 }).toFile(OUT);

const { length } = await readFile(OUT);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${W}×${H}, ${(length / 1024).toFixed(1)} kB`);
console.log("Font files were downloaded for rendering and not written to disk.");
