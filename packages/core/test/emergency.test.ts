import { describe, expect, it } from "vitest";
import { detectEmergency } from "../src/emergency";
import { routeByKeywords } from "../src/routing";

/**
 * The safety corpus.
 *
 * Every case here is a claim about someone's life. Treat a failure in this file
 * as a release blocker, never as a test to update — if a change makes one of
 * these fail, the change is wrong.
 *
 * Recall cases come first (a miss sends a stroke to a walk-in clinic), then the
 * precision regressions that the v1 substring matcher actually got wrong.
 */

describe("medical red flags — English", () => {
  const cases = [
    "I have severe chest pain since morning",
    "my father is having a heart attack",
    "she cannot breathe properly",
    "I can't breathe",
    "he is unconscious and not waking up",
    "her face is drooping and speech is slurred",
    "the child had a seizure",
    "he is having fits",
    "vomiting blood since last night",
    "bleeding a lot after a fall",
    "took an overdose of tablets",
    "snake bite on the leg",
    "road accident, head injury",
  ];

  it.each(cases)("flags: %s", (text) => {
    const match = detectEmergency(text);
    expect(match?.category).toBe("medical");
    expect(match?.helplines.map((h) => h.number)).toContain("108");
  });
});

describe("word order varies but the emergency does not", () => {
  // Contiguous-phrase matching missed every one of these. The stroke case is
  // the reason the order-insensitive tier exists at all.
  const cases = [
    "her face is drooping and speech is slurred",
    "his speech is slurring and one arm feels weak",
    "I have a lot of pain in my chest",
    "my chest is paining badly",
    "there is tightness in the chest",
    "having trouble breathing since morning",
    "shortness of breath after climbing stairs",
    "the bleeding will not stop",
    "he is coughing up blood",
  ];

  it.each(cases)("flags: %s", (text) => {
    expect(detectEmergency(text)?.category).toBe("medical");
  });
});

describe("medical red flags — Malayalam and Manglish", () => {
  const cases = [
    // Malayalam script
    "എനിക്ക് നെഞ്ചുവേദന ഉണ്ട്",
    "ശ്വാസം മുട്ടൽ ഉണ്ട്",
    "അവൾക്ക് ബോധം കെട്ടു",
    "പാമ്പുകടി ഏറ്റു",
    // Romanised Malayalam — how a large share of Kerala actually types
    "enikk nenju vedana undu",
    "shwasam muttal und",
    "bodham ketu poyi",
    "apakadam patti",
  ];

  it.each(cases)("flags: %s", (text) => {
    expect(detectEmergency(text)?.category).toBe("medical");
  });
});

describe("Malayalam agglutination", () => {
  // "പനി" (fever) is a genuine prefix of "പനിയുണ്ട്" ("[I] have a fever").
  // Whole-word matching would miss the most natural way to type the complaint,
  // which is why matchesTerm falls back to substring for Malayalam script.
  it("matches a term fused into a longer Malayalam word", () => {
    const result = routeByKeywords("എനിക്ക് പനിയുണ്ട്");
    expect(result.specialties[0]?.slug).toBe("general");
  });
});

describe("mental-health crisis routes to Tele-MANAS, not an ambulance", () => {
  const cases = [
    "I want to kill myself",
    "thinking about suicide",
    "I don't want to live anymore, no reason to live",
    "ആത്മഹത്യ ചെയ്യണം എന്ന് തോന്നുന്നു",
    "athmahathya cheyyan thonnunnu",
  ];

  it.each(cases)("flags: %s", (text) => {
    const match = detectEmergency(text);
    expect(match?.category).toBe("mental-health");
    // The crisis line must come first — 108 dispatches an ambulance, which is
    // not what someone in crisis needs to be offered first.
    expect(match?.helplines[0]?.number).toBe("14416");
  });
});

describe("precision regressions from the v1 substring matcher", () => {
  // Each of these tripped the emergency interrupt in v1 because the red-flag
  // list was matched with String.includes() against raw text.
  const falsePositives: [string, string][] = [
    ["benefits contains 'fits'", "what are the benefits of this medicine"],
    ["outfits contains 'fits'", "rash from new outfits"],
    ["profits contains 'fits'", "I run a shop and profits are down, feeling stressed"],
  ];

  it.each(falsePositives)("does not flag — %s", (_label, text) => {
    expect(detectEmergency(text)).toBeNull();
  });

  it("still flags 'fits' as a standalone word", () => {
    expect(detectEmergency("the child is having fits")?.category).toBe("medical");
  });
});

describe("ordinary complaints are never emergencies", () => {
  const cases = [
    "my hair is falling a lot lately",
    "toothache on the left side",
    "knee pain when climbing stairs",
    "child has mild fever and cold",
    "dandruff and itching on the scalp",
  ];

  it.each(cases)("does not flag: %s", (text) => {
    expect(detectEmergency(text)).toBeNull();
  });
});

describe("the emergency check short-circuits routing", () => {
  it("returns 108 rather than a cardiologist list for chest pain", () => {
    const result = routeByKeywords("chest pain and my heart is racing");
    expect(result.emergency).toBe(true);
    // Critically: no doctor list to browse instead.
    expect(result.specialties).toEqual([]);
    expect(result.emergency_helplines?.[0]?.number).toBe("108");
  });

  it("carries a message and never echoes the raw complaint", () => {
    const text = "I have chest pain and my name is Anitha";
    const result = routeByKeywords(text);
    expect(result.emergency_message).toContain("108");
    expect(JSON.stringify(result)).not.toContain("Anitha");
  });
});
