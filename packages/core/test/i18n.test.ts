import { describe, expect, it } from "vitest";
import { LANGS, strings, type Lang, type Strings } from "../src/i18n";

/**
 * Guards against the string tables drifting apart.
 *
 * The failure this exists to catch is quiet by nature: someone adds a string to
 * `en`, TypeScript makes them add the key to `ml` too, and the fastest way to
 * satisfy the compiler is to paste the English in. Nothing then fails, nothing
 * looks wrong in review, and a Malayalam reader gets an English sentence — on a
 * product whose argument is that it answers in the language you asked in.
 *
 * On the emergency strings that stops being a translation gap and becomes a
 * safety one, which is why `emergencyTitle` and its neighbours are asserted by
 * name below rather than left to the general sweep: those are the strings
 * someone reads while deciding whether to call an ambulance.
 *
 * What this cannot check is whether the Malayalam is *correct*. Nothing
 * automated can. Every Malayalam string in this repo is still pending review by
 * a native speaker, and that review is a launch blocker, not a nicety.
 */

/**
 * Flatten a string table to `path -> rendered value`.
 *
 * Several entries are functions (`nearYou`, `noneWithin`, `emergencyBodyFlagged`)
 * because they interpolate. They are called with placeholder arguments that are
 * deliberately script-neutral, so a Malayalam assertion cannot be satisfied by
 * the argument rather than by the template around it.
 */
function flatten(t: Strings): Record<string, string> {
  const out: Record<string, string> = {};

  const walk = (value: unknown, path: string): void => {
    if (typeof value === "string") {
      out[path] = value;
      return;
    }
    if (typeof value === "function") {
      // "42" and "7" render as digits in both scripts; "X" is Latin but is
      // never the whole string, and the assertions below require Malayalam
      // somewhere in the result, not everywhere.
      out[path] = (value as (...a: unknown[]) => string)("X", 42, 7);
      return;
    }
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
    }
  };

  walk(t, "");
  return out;
}

/** Any character in the Malayalam Unicode block. */
const MALAYALAM = /[ഀ-ൿ]/;

const tables = Object.fromEntries(LANGS.map((l) => [l, flatten(strings(l))])) as Record<
  Lang,
  Record<string, string>
>;

describe("i18n", () => {
  it("defines every language in LANGS", () => {
    for (const lang of LANGS) {
      expect(Object.keys(tables[lang]).length).toBeGreaterThan(0);
    }
  });

  it("has the same keys in every language", () => {
    const en = Object.keys(tables.en).sort();
    for (const lang of LANGS) {
      expect(Object.keys(tables[lang]).sort(), `${lang} key set`).toEqual(en);
    }
  });

  it("has no empty or whitespace-only strings", () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(tables[lang])) {
        expect(value.trim(), `${lang}.${key}`).not.toBe("");
      }
    }
  });

  /**
   * The load-bearing one. An untranslated string is almost always the English
   * pasted across, so requiring Malayalam script in every Malayalam value
   * catches it without needing to know what the correct translation is.
   */
  it("writes every Malayalam string in Malayalam", () => {
    const untranslated = Object.entries(tables.ml)
      .filter(([, value]) => !MALAYALAM.test(value))
      .map(([key]) => key);

    expect(untranslated, "Malayalam values with no Malayalam script").toEqual([]);
  });

  it("does not repeat an English string as its own translation", () => {
    const identical = Object.keys(tables.en).filter((key) => tables.en[key] === tables.ml[key]);
    expect(identical, "strings identical in both languages").toEqual([]);
  });

  /**
   * Named explicitly because these are the strings on the full-screen
   * interrupt. A gap here is not a missing translation, it is someone reading
   * an unfamiliar language while deciding whether to call an ambulance.
   */
  it("translates the emergency interrupt", () => {
    const critical = [
      "couldBeEmergency",
      "emergencyTitle",
      "emergencyBody",
      "emergencyBodyFlagged",
      "freeAmbulance",
      "nearestEmergencyRoom",
      "notAnEmergency",
      "inEmergencyCall",
    ];

    for (const key of critical) {
      expect(tables.en[key], `en.${key} missing`).toBeTruthy();
      expect(tables.ml[key], `ml.${key} missing`).toBeTruthy();
      expect(MALAYALAM.test(tables.ml[key]), `ml.${key} is not in Malayalam`).toBe(true);
    }
  });

  it("keeps the interpolated value in the translated sentence", () => {
    // The flag is interpolated into the emergency body in both languages; a
    // template that dropped it would read as a generic warning and lose the
    // one detail tying it to what the person actually typed.
    for (const lang of LANGS) {
      expect(strings(lang).emergencyBodyFlagged("chest pain")).toContain("chest pain");
      expect(strings(lang).noneWithin("Dermatology", 5)).toContain("5");
    }
  });

  it("falls back to English for an unknown language", () => {
    // The signature is Lang, but this is reached from stored preferences and
    // query values that were a Lang when they were written and may not be now.
    expect(strings("de" as Lang)).toBe(strings("en"));
  });
});
