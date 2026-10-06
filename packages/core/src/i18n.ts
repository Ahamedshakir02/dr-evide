/**
 * Interface strings, in English and Malayalam.
 *
 * The product asked people to type Malayalam and then answered entirely in
 * English. The taxonomy carries full Malayalam and romanised-Malayalam keyword
 * sets — real, careful work — so someone could type "മുടി കൊഴിച്ചിൽ", be routed
 * correctly, and land on a page reading "Dermatology near you · TrustScore ·
 * NMC verified · Within 5 km". The input was bilingual and the output was not,
 * which meant the people the Malayalam matcher was built for were the ones
 * least able to read the result.
 *
 * Living in core rather than in the web app, for the same reason the taxonomy
 * does: both apps show these strings, and a phrase that means one thing on the
 * website and another in the app is the drift this package exists to prevent.
 *
 * Scope: the critical path only — the symptom box, the results header, the
 * TrustScore explanation, the emergency copy and the disclaimer. Doctor names,
 * clinic names and qualifications are data, not interface, and are shown as
 * they were recorded.
 *
 * Nothing here is machine-translated placeholder text. Anything added later
 * should be reviewed by a Malayalam speaker before it ships — a mistranslation
 * in the emergency copy is the one bug in this product that can cost a life.
 */

export const LANGS = ["en", "ml"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";

export const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  ml: "മലയാളം",
};

export const isLang = (v: unknown): v is Lang =>
  typeof v === "string" && (LANGS as readonly string[]).includes(v);

export interface Strings {
  // ── Shell ──────────────────────────────────────────────────────
  /**
   * The skip link, on every page of the website.
   *
   * "Skip to results" until the site grew a landing page — where there are no
   * results to skip to, and a keyboard user was told there were. The label has
   * to describe where the link actually goes on whatever page is showing it,
   * and only "content" is true on all of them.
   */
  skipToContent: string;
  languageLabel: string;

  // ── Home ───────────────────────────────────────────────────────
  homeEyebrow: string;
  homeTitleLead: string;
  homeTitleEmphasis: string;
  homeSub: string;
  symptomLabel: string;
  symptomPlaceholder: string;
  bilingualHint: string;
  findDoctor: string;
  finding: string;
  orPickDepartment: string;
  ambiguousHeading: string;

  // ── TrustScore explainer ───────────────────────────────────────
  howTrustScoreWorks: string;
  trustScoreBlurb: string;
  noPaidPlacement: string;
  weightLabels: Record<
    "qualification" | "reviews" | "condition_relevance" | "experience" | "accessibility",
    string
  >;

  // ── Results ────────────────────────────────────────────────────
  backToSearch: string;
  nearYou: (specialty: string) => string;
  matchedTo: (conditions: string) => string;
  rankedByTrust: string;
  within: string;
  doctorsFound: (n: number) => string;
  searching: string;
  noneWithin: (specialty: string, km: number) => string;
  ruralNote: string;
  searchFullRadius: (km: number) => string;
  viewProfile: string;
  strongestSignal: (label: string, value: number, max: number) => string;

  /**
   * Two facts the app states rather than hides.
   *
   * The mobile app can fall back to bundled sample doctors with no network,
   * and it can measure distance from the town centre when location was
   * refused. Distance drives list order and part of the score, so "near you"
   * quietly meaning "near the town centre" is something the reader is owed.
   */
  offlineSampleFallback: string;
  distanceFromTownCentre: string;

  // ── Score bands ────────────────────────────────────────────────
  bands: Record<"strong" | "good" | "fair" | "limited", string>;

  // ── Failure ────────────────────────────────────────────────────
  offlineTitle: string;
  offlineBody: string;
  serverTitle: string;
  serverBody: string;
  tryAgain: string;

  // ── Profile ────────────────────────────────────────────────────
  backToResults: string;
  doctorNotFound: string;
  distance: string;
  whyRanksHere: string;
  whyRanksBlurb: string;
  credentials: string;
  commonlyTreats: string;
  timings: string;
  callClinic: string;
  getDirections: string;
  clinicConsult: string;
  nmcVerified: string;
  notVerified: string;
  years: string;

  // ── Emergency ──────────────────────────────────────────────────
  couldBeEmergency: string;
  call: string;
  /**
   * The mobile app's full-screen interrupt.
   *
   * Here rather than in the app for the usual reason — both apps must say the
   * same thing — but with more riding on it than the rest of this file. The
   * app rendered this screen in hardcoded English, which meant the one screen
   * that has to work for everyone worked only for people who read English.
   *
   * The app shows these in both languages at once rather than picking one. At
   * the moment a red flag fires there is no reliable way to know which
   * language the person holding the phone reads most easily, and the cost of
   * guessing wrong is not an inconvenience.
   */
  emergencyTitle: string;
  emergencyBody: string;
  emergencyBodyFlagged: (flag: string) => string;
  freeAmbulance: string;
  nearestEmergencyRoom: string;
  notAnEmergency: string;

  // ── Sample data ────────────────────────────────────────────────
  sampleTitle: string;
  sampleBody: string;
  samplePill: string;

  // ── Footer ─────────────────────────────────────────────────────
  disclaimer: string;
  neverPaid: string;
  inEmergencyCall: string;
}

const en: Strings = {
  skipToContent: "Skip to content",
  languageLabel: "Language",

  homeEyebrow: "Describe it in your own words",
  homeTitleLead: "Find the right doctor — not the one who",
  homeTitleEmphasis: "paid the most.",
  homeSub:
    "Tell us what's bothering you. We route you to the right department, then rank nearby doctors by a transparent TrustScore built from verified credentials and real reviews.",
  symptomLabel: "What's bothering you?",
  symptomPlaceholder: "e.g. My hair is falling a lot lately…",
  bilingualHint: "Type it the way you would say it",
  findDoctor: "Find the right doctor",
  finding: "Finding…",
  orPickDepartment: "Or pick a department",
  ambiguousHeading: "This could be one of two departments",

  howTrustScoreWorks: "How TrustScore works",
  trustScoreBlurb:
    "A 0–100 score built from five signals we can actually verify — and nothing else.",
  noPaidPlacement: "No paid placement. Ever.",
  weightLabels: {
    qualification: "Verified credentials",
    reviews: "Authentic reviews",
    condition_relevance: "Condition relevance",
    experience: "Years of experience",
    accessibility: "Accessibility",
  },

  backToSearch: "Back to search",
  nearYou: (s) => `${s} near you`,
  matchedTo: (c) => `Matched to “${c}”`,
  rankedByTrust: "Ranked by TrustScore — not by ads",
  within: "Within",
  doctorsFound: (n) => (n === 1 ? "doctor found" : "doctors found"),
  searching: "Searching…",
  noneWithin: (s, km) => `No ${s} doctors within ${km} km`,
  ruralNote: "Edappal is rural, so the nearest specialist can be a town or two away.",
  searchFullRadius: (km) => `Search the full ${km} km`,
  viewProfile: "View profile",
  strongestSignal: (label, value, max) =>
    `Strongest signal: ${label.toLowerCase()} (${value} of ${max})`,

  offlineSampleFallback: "Offline — showing bundled sample doctors",
  distanceFromTownCentre: "Distances measured from Edappal town centre",

  bands: {
    strong: "Strong",
    good: "Good",
    fair: "Fair",
    limited: "Limited record",
  },

  offlineTitle: "We couldn't reach the service",
  offlineBody:
    "This looks like a connection problem. It does not mean there are no doctors nearby — we just couldn't check.",
  serverTitle: "Something went wrong our end",
  serverBody:
    "The search failed before it reached the doctor list. Please try again in a moment.",
  tryAgain: "Try again",

  backToResults: "Back to results",
  doctorNotFound: "Doctor not found.",
  distance: "Distance",
  whyRanksHere: "Why this doctor ranks here",
  whyRanksBlurb:
    "TrustScore is built from five signals we can verify. Nothing here is editable by the doctor or by us.",
  credentials: "Credentials",
  commonlyTreats: "Commonly treats",
  timings: "Timings",
  callClinic: "Call clinic",
  getDirections: "Get directions",
  clinicConsult: "clinic consult",
  nmcVerified: "NMC verified",
  notVerified: "Not yet verified",
  years: "years",

  couldBeEmergency: "This could be an emergency",
  call: "Call",
  emergencyTitle: "Don't wait — get help now",
  emergencyBody: "What you described needs urgent care, not an appointment.",
  emergencyBodyFlagged: (flag) =>
    `What you described — ${flag} — needs urgent care, not an appointment.`,
  freeAmbulance: "Free ambulance · 24×7 Kerala",
  nearestEmergencyRoom: "Nearest emergency room",
  notAnEmergency: "This isn't an emergency — continue anyway",

  sampleTitle: "These doctors are not real.",
  sampleBody:
    "Dr Evide is running on placeholder records while we verify credentials with the NMC registry. Names, clinics, phone numbers and scores are all fictional — please don't try to visit them.",
  samplePill: "Sample data",

  disclaimer:
    "Dr Evide helps you find a suitable doctor. It does not provide medical advice or diagnosis.",
  neverPaid: "Rankings are never paid for. No one can pay to rank higher.",
  inEmergencyCall: "In an emergency, call",
};

const ml: Strings = {
  skipToContent: "ഉള്ളടക്കത്തിലേക്ക് പോകുക",
  languageLabel: "ഭാഷ",

  homeEyebrow: "നിങ്ങളുടെ സ്വന്തം വാക്കുകളിൽ പറയൂ",
  homeTitleLead: "ശരിയായ ഡോക്ടറെ കണ്ടെത്തൂ — ഏറ്റവും കൂടുതൽ",
  homeTitleEmphasis: "പണം നൽകിയ ആളെയല്ല.",
  homeSub:
    "നിങ്ങളെ അലട്ടുന്നത് എന്താണെന്ന് പറയൂ. ശരിയായ വിഭാഗത്തിലേക്ക് ഞങ്ങൾ വഴികാട്ടും, പിന്നെ അടുത്തുള്ള ഡോക്ടർമാരെ പരിശോധിച്ചുറപ്പിച്ച യോഗ്യതകളും യഥാർത്ഥ അഭിപ്രായങ്ങളും അടിസ്ഥാനമാക്കിയ സുതാര്യമായ ട്രസ്റ്റ്‌സ്കോർ പ്രകാരം ക്രമീകരിക്കും.",
  symptomLabel: "നിങ്ങളെ അലട്ടുന്നത് എന്താണ്?",
  symptomPlaceholder: "ഉദാ. അടുത്തിടെ എന്റെ മുടി ഒരുപാട് കൊഴിയുന്നു…",
  bilingualHint: "മലയാളത്തിലും ഇംഗ്ലീഷിലും എഴുതാം",
  findDoctor: "ശരിയായ ഡോക്ടറെ കണ്ടെത്തൂ",
  finding: "തിരയുന്നു…",
  orPickDepartment: "അല്ലെങ്കിൽ ഒരു വിഭാഗം തിരഞ്ഞെടുക്കൂ",
  ambiguousHeading: "ഇത് രണ്ട് വിഭാഗങ്ങളിൽ ഒന്നാകാം",

  howTrustScoreWorks: "ട്രസ്റ്റ്‌സ്കോർ എങ്ങനെ പ്രവർത്തിക്കുന്നു",
  trustScoreBlurb:
    "ഞങ്ങൾക്ക് ശരിക്കും പരിശോധിക്കാൻ കഴിയുന്ന അഞ്ച് കാര്യങ്ങൾ മാത്രം അടിസ്ഥാനമാക്കിയ 0–100 സ്കോർ — മറ്റൊന്നുമല്ല.",
  noPaidPlacement: "പണം വാങ്ങി സ്ഥാനം നൽകുന്നില്ല. ഒരിക്കലും.",
  weightLabels: {
    qualification: "പരിശോധിച്ചുറപ്പിച്ച യോഗ്യതകൾ",
    reviews: "ആധികാരികമായ അഭിപ്രായങ്ങൾ",
    condition_relevance: "നിങ്ങളുടെ പ്രശ്നവുമായുള്ള ബന്ധം",
    experience: "പ്രവൃത്തിപരിചയം",
    accessibility: "എത്തിപ്പെടാനുള്ള എളുപ്പം",
  },

  backToSearch: "തിരയലിലേക്ക് മടങ്ങുക",
  nearYou: (s) => `നിങ്ങൾക്കടുത്തുള്ള ${s}`,
  matchedTo: (c) => `“${c}” എന്നതുമായി ചേർന്നത്`,
  rankedByTrust: "ട്രസ്റ്റ്‌സ്കോർ പ്രകാരം — പരസ്യം അനുസരിച്ചല്ല",
  within: "ഇത്ര ദൂരത്തിനുള്ളിൽ",
  doctorsFound: () => "ഡോക്ടർമാരെ കണ്ടെത്തി",
  searching: "തിരയുന്നു…",
  noneWithin: (s, km) => `${km} കിലോമീറ്ററിനുള്ളിൽ ${s} ഡോക്ടർമാരില്ല`,
  ruralNote:
    "എടപ്പാൾ ഗ്രാമപ്രദേശമാണ്, അതിനാൽ അടുത്തുള്ള വിദഗ്ധൻ ഒന്നോ രണ്ടോ പട്ടണം അകലെയാകാം.",
  searchFullRadius: (km) => `${km} കിലോമീറ്റർ വരെ തിരയുക`,
  viewProfile: "വിവരങ്ങൾ കാണുക",
  strongestSignal: (label, value, max) => `ഏറ്റവും ശക്തമായത്: ${label} (${max}-ൽ ${value})`,

  offlineSampleFallback: "ഓഫ്‌ലൈൻ — ആപ്പിലുള്ള സാമ്പിൾ ഡോക്ടർമാരെ കാണിക്കുന്നു",
  distanceFromTownCentre: "ദൂരം എടപ്പാൾ ടൗൺ കേന്ദ്രത്തിൽ നിന്ന് കണക്കാക്കുന്നു",

  bands: {
    strong: "മികച്ചത്",
    good: "നല്ലത്",
    fair: "ശരാശരി",
    limited: "പരിമിതമായ വിവരം",
  },

  offlineTitle: "സേവനവുമായി ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല",
  offlineBody:
    "ഇത് ഇന്റർനെറ്റ് ബന്ധത്തിന്റെ പ്രശ്നമാണെന്ന് തോന്നുന്നു. അടുത്ത് ഡോക്ടർമാരില്ല എന്നല്ല ഇതിനർത്ഥം — ഞങ്ങൾക്ക് പരിശോധിക്കാൻ കഴിഞ്ഞില്ല എന്നു മാത്രം.",
  serverTitle: "ഞങ്ങളുടെ ഭാഗത്ത് എന്തോ പിഴവ് സംഭവിച്ചു",
  serverBody: "ഡോക്ടർമാരുടെ പട്ടികയിലെത്തും മുൻപ് തിരയൽ പരാജയപ്പെട്ടു. അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ.",
  tryAgain: "വീണ്ടും ശ്രമിക്കൂ",

  backToResults: "ഫലങ്ങളിലേക്ക് മടങ്ങുക",
  doctorNotFound: "ഡോക്ടറെ കണ്ടെത്താനായില്ല.",
  distance: "ദൂരം",
  whyRanksHere: "ഈ ഡോക്ടർ ഇവിടെ വരാൻ കാരണം",
  whyRanksBlurb:
    "പരിശോധിക്കാൻ കഴിയുന്ന അഞ്ച് കാര്യങ്ങളിൽ നിന്നാണ് ട്രസ്റ്റ്‌സ്കോർ ഉണ്ടാക്കുന്നത്. ഇതൊന്നും ഡോക്ടർക്കോ ഞങ്ങൾക്കോ മാറ്റാൻ കഴിയില്ല.",
  credentials: "യോഗ്യതകൾ",
  commonlyTreats: "സാധാരണയായി ചികിത്സിക്കുന്നത്",
  timings: "സമയം",
  callClinic: "ക്ലിനിക്കിലേക്ക് വിളിക്കൂ",
  getDirections: "വഴി കാണിക്കൂ",
  clinicConsult: "ക്ലിനിക് ഫീസ്",
  nmcVerified: "NMC പരിശോധിച്ചത്",
  notVerified: "ഇതുവരെ പരിശോധിച്ചിട്ടില്ല",
  years: "വർഷം",

  couldBeEmergency: "ഇത് ഒരു അടിയന്തരാവസ്ഥയാകാം",
  call: "വിളിക്കൂ",
  emergencyTitle: "കാത്തിരിക്കരുത് — ഇപ്പോൾ തന്നെ സഹായം തേടൂ",
  emergencyBody: "നിങ്ങൾ പറഞ്ഞതിന് അടിയന്തര ചികിത്സ വേണം, അപ്പോയിന്റ്മെന്റല്ല.",
  emergencyBodyFlagged: (flag) =>
    `നിങ്ങൾ പറഞ്ഞതിന് — ${flag} — അടിയന്തര ചികിത്സ വേണം, അപ്പോയിന്റ്മെന്റല്ല.`,
  freeAmbulance: "സൗജന്യ ആംബുലൻസ് · കേരളത്തിൽ 24×7",
  nearestEmergencyRoom: "അടുത്തുള്ള അത്യാഹിത വിഭാഗം",
  notAnEmergency: "ഇത് അടിയന്തരാവസ്ഥയല്ല — എന്നാലും തുടരുക",

  sampleTitle: "ഈ ഡോക്ടർമാർ യഥാർത്ഥമല്ല.",
  sampleBody:
    "NMC രജിസ്ട്രിയിൽ യോഗ്യതകൾ പരിശോധിക്കുന്നതുവരെ ഡോ. എവിടെ സാമ്പിൾ വിവരങ്ങളിലാണ് പ്രവർത്തിക്കുന്നത്. പേരുകൾ, ക്ലിനിക്കുകൾ, ഫോൺ നമ്പറുകൾ, സ്കോറുകൾ എല്ലാം സാങ്കൽപ്പികമാണ് — ദയവായി അവിടെ പോകാൻ ശ്രമിക്കരുത്.",
  samplePill: "സാമ്പിൾ വിവരം",

  disclaimer:
    "അനുയോജ്യനായ ഡോക്ടറെ കണ്ടെത്താൻ ഡോ. എവിടെ സഹായിക്കുന്നു. ഇത് വൈദ്യോപദേശമോ രോഗനിർണയമോ നൽകുന്നില്ല.",
  neverPaid: "സ്ഥാനത്തിനായി പണം വാങ്ങുന്നില്ല. പണം നൽകി ആർക്കും മുകളിൽ വരാൻ കഴിയില്ല.",
  inEmergencyCall: "അടിയന്തരാവസ്ഥയിൽ വിളിക്കൂ",
};

const TABLE: Record<Lang, Strings> = { en, ml };

/** The string table for a language. Unknown values fall back to English. */
export const strings = (lang: Lang): Strings => TABLE[lang] ?? TABLE[DEFAULT_LANG];
