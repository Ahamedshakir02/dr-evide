#!/usr/bin/env node
/**
 * Integrity check: ranking is never for sale.
 *
 * The product's entire claim is that no one can pay to rank higher. That claim
 * is currently protected by a comment in ranking.ts and by whoever happens to
 * review the PR. This script makes it a build failure instead.
 *
 * It is deliberately blunt. If it fires on something legitimate, rename the
 * thing — the words below should not appear in a codebase that ranks doctors.
 *
 * Run: npm run check:integrity
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();

const SEARCH_ROOTS = ["packages", "apps"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".expo", "dist", "build", ".git"]);
const CODE_FILE = /\.(ts|tsx|js|jsx|mjs|sql)$/;

/**
 * Identifiers that would let money influence order. Matched as whole words so
 * "sponsored" fires but "responsored" — or prose about the pledge — does not.
 */
const FORBIDDEN = [
  "sponsored",
  "is_sponsored",
  "promoted",
  "is_promoted",
  "paid_placement",
  "paid_rank",
  "boost_score",
  "rank_boost",
  "featured_until",
  "ad_slot",
  "bid_amount",
  "cpc",
];

/**
 * Files allowed to mention the words — the places where we explicitly promise
 * not to do it, and this checker itself.
 */
const ALLOWLIST = [
  join("scripts", "check-no-paid-ranking.mjs"),
  join("packages", "core", "test", "ranking.test.ts"),
];

const pattern = new RegExp(`\\b(${FORBIDDEN.join("|")})\\b`, "i");

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (CODE_FILE.test(entry)) yield full;
  }
}

const violations = [];

for (const root of SEARCH_ROOTS) {
  const abs = join(ROOT, root);
  try {
    statSync(abs);
  } catch {
    continue;
  }

  for (const file of walk(abs)) {
    const rel = relative(ROOT, file);
    if (ALLOWLIST.some((a) => rel === a || rel.split(sep).join(sep) === a)) continue;

    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      const match = line.match(pattern);
      if (match) violations.push({ file: rel, line: i + 1, term: match[0], text: line.trim() });
    });
  }
}

if (violations.length > 0) {
  console.error("\nRanking integrity check FAILED.\n");
  console.error("Dr Evide promises that no one can pay to rank higher. These look like");
  console.error("paid-placement fields:\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  "${v.term}"`);
    console.error(`    ${v.text}\n`);
  }
  console.error("If this is a false positive, rename the identifier.\n");
  process.exit(1);
}

console.log(`Ranking integrity check passed (${FORBIDDEN.length} patterns, 0 violations).`);
