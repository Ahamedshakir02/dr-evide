/**
 * Brand raster generator.
 *
 * The web app shipped a manifest with `"icons": []`, so the PWA could not be
 * installed at all — the one thing that matters most on the mid-range Android
 * that dominates the launch area, where "add to home screen" is the install.
 *
 * Everything here is derived from assets/brand/mark.svg. The generator reads
 * that file and lifts the path out of it rather than restating the geometry,
 * so there is exactly one copy of the mark in the repo and editing the artwork
 * is enough to change every size. That is the same rule the rest of this
 * codebase follows for shared logic, applied to a shape.
 *
 * Run it by hand, commit the output:
 *
 *     npm run icons
 *
 * Deliberately not wired into the build. The PNGs are review artefacts — a
 * change to the app icon should show up as a reviewable binary diff in a commit
 * someone chose to make, not appear silently because a build ran.
 *
 * No text in any of these. A favicon is 16px, which has no room for a
 * letterform, and SVG text rasterises against whatever fonts the generating
 * machine happens to have — so a wordmark here would render differently on
 * every developer's laptop.
 */
import { Buffer } from "node:buffer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "assets/brand/mark.svg");
const OUT_DIR = path.join(ROOT, "apps/web/public/icons");

/** Brand teal — --accent in apps/web/src/styles/theme.css. */
const TEAL = "#0f766e";

/**
 * Pull the mark's path data out of the source SVG.
 *
 * Reading it rather than repeating it is the whole point of this script. If the
 * file stops having exactly one path, that is a change worth failing on rather
 * than guessing through: silently picking the first of several would emit an
 * icon that is a fragment of the mark.
 */
async function markPath() {
  const svg = await readFile(SOURCE, "utf8");
  const paths = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  if (paths.length !== 1) {
    throw new Error(
      `Expected exactly one path in ${path.relative(ROOT, SOURCE)}, found ${paths.length}. ` +
        `Update this script deliberately rather than letting it guess.`
    );
  }
  return paths[0].replace(/\s+/g, " ").trim();
}

/**
 * Compose one square icon.
 *
 * `inset` is the fraction of the canvas the mark occupies. Maskable icons need
 * a much smaller one: Android crops them to a circle, a squircle or a rounded
 * square depending on the launcher, and only the middle 80% is guaranteed to
 * survive. Anything drawn outside it may simply be cut off, so the mark sits
 * well inside that.
 */
function compose({ size, d, inset, background, fill, radius }) {
  const markSize = size * inset;
  const offset = (size - markSize) / 2;
  const scale = markSize / 48; // the source viewBox is 48×48
  const bg =
    background === "none"
      ? ""
      : `<rect width="${size}" height="${size}" rx="${radius ?? 0}" fill="${background}"/>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      bg +
      `<g transform="translate(${offset} ${offset}) scale(${scale})">` +
      `<path fill="${fill}" fill-rule="evenodd" d="${d}"/>` +
      `</g></svg>`
  );
}

const png = (svg, size) =>
  sharp(svg, { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

async function main() {
  const d = await markPath();
  await mkdir(OUT_DIR, { recursive: true });

  /**
   * White mark on teal, rather than the teal-on-transparent used in the tab.
   * A launcher icon is shown against a wallpaper nobody chose for us, so it
   * carries its own field; a transparent one would vanish on a dark one. The
   * cross stays a hole, so the teal reads through it and the mark is still one
   * silhouette rather than two stacked shapes.
   */
  const jobs = [
    {
      name: "icon-192.png",
      size: 192,
      // 22% corner radius is the platform-neutral rounded square. Android
      // masks it anyway; desktop and the install prompt do not.
      svg: (s) => compose({ size: s, d, inset: 0.56, background: TEAL, fill: "#fff", radius: s * 0.22 }),
    },
    {
      name: "icon-512.png",
      size: 512,
      svg: (s) => compose({ size: s, d, inset: 0.56, background: TEAL, fill: "#fff", radius: s * 0.22 }),
    },
    {
      // Full-bleed and square: the launcher supplies the shape. Corners
      // rounded here would be rounded twice and read as a shrunken sticker.
      name: "icon-maskable-512.png",
      size: 512,
      svg: (s) => compose({ size: s, d, inset: 0.44, background: TEAL, fill: "#fff", radius: 0 }),
    },
    {
      // iOS applies its own squircle and does not composite alpha, so this is
      // full-bleed too and must never be transparent.
      name: "apple-touch-icon.png",
      size: 180,
      svg: (s) => compose({ size: s, d, inset: 0.6, background: TEAL, fill: "#fff", radius: 0 }),
    },
    {
      // The tab icon, for browsers that ignore icon.svg. Teal on transparent:
      // a tab strip may be light or dark and the mid-tone teal holds on both.
      name: "favicon-32.png",
      size: 32,
      svg: (s) => compose({ size: s, d, inset: 0.92, background: "none", fill: TEAL }),
    },
  ];

  for (const job of jobs) {
    const buf = await png(job.svg(job.size), job.size);
    await writeFile(path.join(OUT_DIR, job.name), buf);
    console.log(`  ${job.name.padEnd(24)} ${job.size}×${job.size}  ${(buf.length / 1024).toFixed(1)} kB`);
  }

  /**
   * The scalable tab icon, emitted here rather than copied from the source so
   * it cannot drift from it. Browsers that understand it get one that stays
   * sharp on a HiDPI tab strip at any zoom; the rest fall back to favicon-32.
   */
  const svg = compose({ size: 48, d, inset: 0.92, background: "none", fill: TEAL });
  await writeFile(path.join(OUT_DIR, "icon.svg"), svg);
  console.log(`  ${"icon.svg".padEnd(24)} scalable  ${(svg.length / 1024).toFixed(1)} kB`);

  console.log(`\nWrote ${jobs.length + 1} icons to ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
