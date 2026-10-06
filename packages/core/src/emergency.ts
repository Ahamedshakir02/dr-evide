import { findTerms, matchesAllWords, normalize } from "./text";

/**
 * Emergency red-flag detection.
 *
 * This is the one code path in the product where a miss can cost a life, so it
 * is deliberately the dumbest thing in the codebase: a local, synchronous,
 * dependency-free word match that runs before anything else and cannot be
 * skipped, overridden, or reached by the LLM. It ships inside both apps so it
 * still works with no network and no API key.
 *
 * Recall beats precision here. A false positive costs someone thirty seconds of
 * worry; a false negative sends a stroke to a walk-in clinic.
 */

export type EmergencyCategory = "medical" | "mental-health";

export interface Helpline {
  label: string;
  /** Dialled as-is via tel: — digits only. */
  number: string;
}

export interface EmergencyMatch {
  category: EmergencyCategory;
  message: string;
  /**
   * The same instruction in Malayalam.
   *
   * Carried alongside rather than resolved here, because this module is pure
   * and knows nothing about who is reading. It is the one piece of copy in the
   * product where a language the reader cannot follow is a safety failure
   * rather than an inconvenience — and the launch area is one where a great
   * many people read Malayalam far more comfortably than English.
   */
  messageMl: string;
  helplines: Helpline[];
  /** The red-flag terms that fired, for the UI and for logging. Never the raw user text. */
  matched: string[];
}

/**
 * Red flags for a physical medical emergency.
 *
 * Three writing systems, because the home screen promises "Malayalam & English
 * both work" and in Kerala a large share of typed Malayalam is romanised
 * ("Manglish"). A matcher that only understood English silently broke that
 * promise for exactly the users least able to route themselves.
 */
const MEDICAL_TERMS: readonly string[] = [
  // ── English ──────────────────────────────────────────────────
  "chest pain", "pain in chest", "heart attack", "cardiac arrest",
  "can't breathe", "cannot breathe", "breathless", "difficulty breathing",
  "gasping", "unconscious", "not waking", "passed out", "fainted",
  "stroke", "face drooping", "slurred speech", "sudden weakness one side",
  "seizure", "seizures", "fits", "convulsion", "convulsions",
  "heavy bleeding", "bleeding a lot", "won't stop bleeding",
  "vomiting blood", "blood in vomit", "coughing blood",
  "severe burn", "poison", "poisoning", "overdose", "snake bite", "snakebite",
  "accident", "head injury", "electric shock", "drowning", "choking",
  "severe allergic reaction", "anaphylaxis", "labour pain", "water broke",

  // ── Malayalam ────────────────────────────────────────────────
  "നെഞ്ചുവേദന", "നെഞ്ച് വേദന", "ഹൃദയാഘാതം",
  "ശ്വാസം മുട്ടൽ", "ശ്വാസതടസ്സം", "ശ്വാസം കിട്ടുന്നില്ല",
  "ബോധം കെട്ടു", "ബോധക്ഷയം", "ബോധമില്ല",
  "പക്ഷാഘാതം", "അപസ്മാരം", "രക്തസ്രാവം", "ചോര ഛർദ്ദി",
  "വിഷം", "അപകടം", "പൊള്ളൽ", "തലയ്ക്ക് പരിക്ക്", "പാമ്പുകടി",

  // ── Romanised Malayalam (Manglish) ───────────────────────────
  "nenju vedana", "nenchu vedana", "nenju vedhana",
  "shwasam muttal", "swasam muttal", "shwasam kittunnilla",
  "bodham ketu", "bodham illa", "bodhakshayam",
  "hridayaghatham", "pakshaghatham", "apasmaram",
  "raktha sravam", "chora chardi", "visham", "apakadam", "pollal",
  "pambukadi", "thalak parikk",
];

/**
 * Red flags for a mental-health emergency. Split out because the correct
 * referral is different: 108 dispatches an ambulance, which is not what someone
 * in crisis needs first. Tele-MANAS (14416) is the national mental-health
 * helpline and is free, 24/7, and available in Malayalam.
 */
/**
 * Red flags where English word order varies but the meaning does not. Every
 * word must appear somewhere in the text, in any order.
 *
 * This tier exists because contiguous-phrase matching missed the single most
 * time-critical presentation in the product: "her face is drooping and speech
 * is slurred" is a textbook stroke and matched neither "face drooping" nor
 * "slurred speech".
 *
 * Each entry must contain only unambiguous clinical content words. Never add a
 * common function word ("not", "in", "a") to a set here — order-insensitive
 * matching makes those fire on ordinary sentences.
 */
const MEDICAL_WORD_SETS: readonly (readonly string[])[] = [
  // FAST — stroke. The whole point of recognising these is speed.
  ["face", "drooping"],
  ["face", "drooped"],
  ["speech", "slurred"],
  ["speech", "slurring"],
  ["arm", "weakness", "sudden"],
  // Cardiac
  ["chest", "pain"],
  ["chest", "paining"],
  ["chest", "tightness"],
  ["chest", "pressure"],
  // Respiratory
  ["breath", "shortness"],
  ["breathing", "trouble"],
  ["breathing", "difficulty"],
  // Haemorrhage
  ["bleeding", "stop"],
  ["blood", "vomiting"],
  ["blood", "coughing"],
];

const MENTAL_HEALTH_TERMS: readonly string[] = [
  // ── English ──────────────────────────────────────────────────
  "suicide", "suicidal", "kill myself", "end my life", "want to die",
  "self harm", "self-harm", "cutting myself", "hurt myself",
  "no reason to live", "better off dead",

  // ── Malayalam ────────────────────────────────────────────────
  "ആത്മഹത്യ", "ജീവിക്കാൻ തോന്നുന്നില്ല", "മരിക്കണം",

  // ── Romanised Malayalam (Manglish) ───────────────────────────
  "athmahathya", "aathmahathya", "jeevikkan thonnunnilla", "marikkanam",
];

const MEDICAL_MESSAGE =
  "These symptoms may be a medical emergency. Please go to the nearest emergency department immediately or call 108 (free ambulance). Do not wait for an appointment.";

const MEDICAL_MESSAGE_ML =
  "ഈ ലക്ഷണങ്ങൾ ഒരു അടിയന്തര വൈദ്യസഹായം ആവശ്യമുള്ളതാകാം. ഉടൻ തന്നെ അടുത്തുള്ള അത്യാഹിത വിഭാഗത്തിലേക്ക് പോകുക, അല്ലെങ്കിൽ 108 (സൗജന്യ ആംബുലൻസ്) വിളിക്കുക. അപ്പോയിന്റ്മെന്റിനായി കാത്തിരിക്കരുത്.";

const MENTAL_HEALTH_MESSAGE =
  "You do not have to face this alone, and help is available right now. Tele-MANAS (14416) is free, confidential, open 24/7, and answers in Malayalam. If you are in immediate danger, call 108 or go to the nearest emergency department.";

const MENTAL_HEALTH_MESSAGE_ML =
  "ഇത് ഒറ്റയ്ക്ക് നേരിടേണ്ടതില്ല, ഇപ്പോൾത്തന്നെ സഹായം ലഭ്യമാണ്. ടെലി-മനസ് (14416) സൗജന്യവും രഹസ്യാത്മകവുമാണ്, 24 മണിക്കൂറും തുറന്നിരിക്കുന്നു, മലയാളത്തിൽ സംസാരിക്കാം. നിങ്ങൾ ഉടനടി അപകടത്തിലാണെങ്കിൽ 108 വിളിക്കുക അല്ലെങ്കിൽ അടുത്തുള്ള അത്യാഹിത വിഭാഗത്തിലേക്ക് പോകുക.";

const MEDICAL_HELPLINES: Helpline[] = [{ label: "108 — free ambulance", number: "108" }];

const MENTAL_HEALTH_HELPLINES: Helpline[] = [
  { label: "14416 — Tele-MANAS, 24/7", number: "14416" },
  { label: "108 — free ambulance", number: "108" },
];

/**
 * Check text for red flags. Returns null when nothing fires.
 *
 * Mental-health terms are checked first: "I want to kill myself" also contains
 * no medical red flag, but a phrase like "overdose" appears in both worlds and
 * the crisis-line response is the safer of the two to lead with.
 */
export function detectEmergency(text: string): EmergencyMatch | null {
  const haystack = normalize(text);

  const mental = findTerms(haystack, MENTAL_HEALTH_TERMS);
  if (mental.length > 0) {
    return {
      category: "mental-health",
      message: MENTAL_HEALTH_MESSAGE,
      messageMl: MENTAL_HEALTH_MESSAGE_ML,
      helplines: MENTAL_HEALTH_HELPLINES,
      matched: mental,
    };
  }

  const medical = [
    ...findTerms(haystack, MEDICAL_TERMS),
    ...MEDICAL_WORD_SETS.filter((words) => matchesAllWords(haystack, words)).map((words) =>
      words.join(" ")
    ),
  ];

  if (medical.length > 0) {
    return {
      category: "medical",
      message: MEDICAL_MESSAGE,
      messageMl: MEDICAL_MESSAGE_ML,
      helplines: MEDICAL_HELPLINES,
      matched: [...new Set(medical)],
    };
  }

  return null;
}

/** Exposed for the routing tests and for the "nothing here may overlap" check in taxonomy. */
export const EMERGENCY_TERMS = {
  medical: MEDICAL_TERMS,
  medicalWordSets: MEDICAL_WORD_SETS,
  mentalHealth: MENTAL_HEALTH_TERMS,
} as const;
