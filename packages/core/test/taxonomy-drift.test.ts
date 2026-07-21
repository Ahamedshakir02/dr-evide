import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { SPECIALTIES } from "../src/taxonomy";

/**
 * The seed script is plain Node and cannot import the TypeScript taxonomy, so
 * it repeats the specialty list. That is the last remaining duplication in the
 * repo, and this test is the reason it is safe: the two cannot drift without
 * failing CI.
 *
 * If this fails, fix packages/db/seed.mjs — the TypeScript taxonomy is the
 * source of truth.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SEED = join(repoRoot, "packages", "db", "seed.mjs");

describe("packages/db/seed.mjs mirrors the taxonomy", () => {
  const source = readFileSync(SEED, "utf8");

  // Pull the ["slug", "Name", "Description"] triples out of the seed array.
  const seeded = new Map(
    [...source.matchAll(/\["([a-z]+)",\s*"([^"]+)",\s*"([^"]+)"\]/g)].map((m) => [
      m[1]!,
      { name: m[2]!, description: m[3]! },
    ])
  );

  it("finds the specialty list in the seed script", () => {
    // Guards the regex itself: a refactor that reshapes the seed array would
    // otherwise make this whole file pass vacuously.
    expect(seeded.size).toBeGreaterThan(0);
  });

  it("seeds exactly the specialties the taxonomy declares", () => {
    expect([...seeded.keys()].sort()).toEqual(Object.keys(SPECIALTIES).sort());
  });

  it.each(Object.entries(SPECIALTIES))("%s has matching name and description", (slug, info) => {
    expect(seeded.get(slug)).toEqual({ name: info.name, description: info.description });
  });
});
