import type { Lang } from "./i18n";
import type { SpecialtySlug } from "./types";

export type SpecialtyIconKey =
  | "skin"
  | "heart"
  | "general"
  | "teeth"
  | "ent"
  | "children"
  | "bones";

/**
 * Department names in Malayalam.
 *
 * Kept in a parallel shape rather than replacing the English fields, because
 * `name` and `description` are also written into the `specialties` table by the
 * seed script and asserted against it by taxonomy-drift.test.ts. The database
 * keeps one canonical English row; the interface picks a language.
 */
export interface SpecialtyText {
  name: string;
  description: string;
  tileLabel: string;
}

export interface SpecialtyInfo extends SpecialtyText {
  /** Clinical name — headings, routing copy. */
  name: string;
  description: string;
  /** Plain-language label for the department tiles. */
  tileLabel: string;
  icon: SpecialtyIconKey;
  ml: SpecialtyText;
}

/** Key order is tile order on the home screen. */
export const SPECIALTIES: Record<SpecialtySlug, SpecialtyInfo> = {
  dermatology: {
    name: "Dermatology",
    description: "Skin, hair, and nail problems",
    tileLabel: "Skin & Hair",
    icon: "skin",
    ml: {
      name: "ത്വക്ക് രോഗ വിഭാഗം",
      description: "ത്വക്ക്, മുടി, നഖം എന്നിവയുടെ പ്രശ്നങ്ങൾ",
      tileLabel: "ത്വക്കും മുടിയും",
    },
  },
  cardiology: {
    name: "Cardiology",
    description: "Heart and circulation problems",
    tileLabel: "Heart",
    icon: "heart",
    ml: {
      name: "ഹൃദ്രോഗ വിഭാഗം",
      description: "ഹൃദയത്തിന്റെയും രക്തയോട്ടത്തിന്റെയും പ്രശ്നങ്ങൾ",
      tileLabel: "ഹൃദയം",
    },
  },
  general: {
    name: "General Physician",
    description: "Fever, infections, and everyday illness",
    tileLabel: "General",
    icon: "general",
    ml: {
      name: "ജനറൽ ഫിസിഷ്യൻ",
      description: "പനി, അണുബാധകൾ, സാധാരണ അസുഖങ്ങൾ",
      tileLabel: "ജനറൽ",
    },
  },
  dental: {
    name: "Dental",
    description: "Teeth and gum problems",
    tileLabel: "Teeth",
    icon: "teeth",
    ml: {
      name: "ദന്ത വിഭാഗം",
      description: "പല്ലിന്റെയും മോണയുടെയും പ്രശ്നങ്ങൾ",
      tileLabel: "പല്ല്",
    },
  },
  ent: {
    name: "ENT",
    description: "Ear, nose, throat, and sinus problems",
    tileLabel: "Ear · Nose",
    icon: "ent",
    ml: {
      name: "ചെവി · മൂക്ക് · തൊണ്ട വിഭാഗം",
      description: "ചെവി, മൂക്ക്, തൊണ്ട, സൈനസ് പ്രശ്നങ്ങൾ",
      tileLabel: "ചെവി · മൂക്ക്",
    },
  },
  pediatrics: {
    name: "Pediatrics",
    description: "Illness and growth in children",
    tileLabel: "Children",
    icon: "children",
    ml: {
      name: "ശിശുരോഗ വിഭാഗം",
      description: "കുട്ടികളുടെ അസുഖങ്ങളും വളർച്ചയും",
      tileLabel: "കുട്ടികൾ",
    },
  },
  orthopedics: {
    name: "Orthopedics",
    description: "Bones, joints, muscles, and back problems",
    tileLabel: "Bones & Joints",
    icon: "bones",
    ml: {
      name: "അസ്ഥിരോഗ വിഭാഗം",
      description: "എല്ല്, സന്ധി, പേശി, നടുവ് പ്രശ്നങ്ങൾ",
      tileLabel: "എല്ലും സന്ധിയും",
    },
  },
};

/**
 * A department's text in the reader's language.
 *
 * One accessor, so no screen has to remember that the Malayalam lives on a
 * nested field — and so adding a third language later is a change here rather
 * than in every component.
 */
export function specialtyText(slug: SpecialtySlug, lang: Lang): SpecialtyText {
  const info = SPECIALTIES[slug];
  if (lang === "ml") return info.ml;
  return { name: info.name, description: info.description, tileLabel: info.tileLabel };
}

export const SPECIALTY_SLUGS = Object.keys(SPECIALTIES) as SpecialtySlug[];

export const isSpecialtySlug = (v: unknown): v is SpecialtySlug =>
  typeof v === "string" && v in SPECIALTIES;

/**
 * Keyword → specialty map for the offline router, and the source of the
 * condition keywords that feed ranking relevance.
 *
 * Matched as whole words through text.ts, never as raw substrings. That is what
 * lets "ear" and "kid" appear here at all: under the old substring matcher they
 * fired on "heart" and "kidney" respectively, quietly misrouting anyone with a
 * cardiac or renal complaint.
 *
 * Each specialty carries English, Malayalam, and romanised Malayalam
 * ("Manglish") terms. Manglish is not an afterthought — it is how a large share
 * of Kerala actually types, and the home screen promises Malayalam works.
 *
 * Nothing here may duplicate an emergency term (see emergency.ts). The
 * emergency check runs first and must keep winning; taxonomy.test.ts asserts
 * the two lists stay disjoint.
 */
export const KEYWORD_MAP: Record<SpecialtySlug, string[]> = {
  cardiology: [
    "heart", "palpitation", "palpitations", "heartbeat", "cholesterol",
    "ecg", "echo", "heart murmur", "angioplasty", "stent", "bypass surgery",
    "hole in the heart", "valve", "blocked artery",
    "ഹൃദയം", "നെഞ്ചിടിപ്പ്", "കൊളസ്ട്രോൾ",
    "hridayam", "nenjidipp", "kolesterol",
  ],
  pediatrics: [
    "child", "children", "kid", "kids", "baby", "infant", "newborn", "toddler",
    "my child", "my son", "my daughter", "vaccination", "vaccine",
    "immunisation", "immunization", "not gaining weight", "milk feeding",
    "കുട്ടി", "കുഞ്ഞ്", "കുഞ്ഞിന്", "വാക്സിൻ",
    "kutti", "kunju", "kunjinu", "vaccine eduthittilla",
  ],
  dermatology: [
    "hair", "hair fall", "hairfall", "dandruff", "bald", "balding",
    "skin", "rash", "rashes", "acne", "pimple", "pimples", "itch", "itching",
    "itchy", "eczema", "psoriasis", "fungal", "nail", "nails", "pigment",
    "dark spot", "dark spots", "mole", "moles", "wart", "warts", "dry skin",
    "മുടി കൊഴിച്ചിൽ", "മുടികൊഴിച്ചിൽ", "ചൊറിച്ചിൽ", "മുഖക്കുരു", "താരൻ", "ത്വക്ക്",
    "mudi kozhichil", "mudikozhichil", "chorichil", "mukhakkuru", "tharan",
  ],
  orthopedics: [
    "knee", "knees", "bone", "bones", "joint", "joints", "back pain",
    "backpain", "neck pain", "shoulder", "fracture", "sprain", "hip",
    "arthritis", "spine", "leg pain", "elbow", "wrist", "ankle", "muscle pain",
    "മുട്ടുവേദന", "നടുവേദന", "സന്ധിവേദന", "എല്ല്", "ഒടിവ്",
    "muttu vedana", "muttuvedana", "nadu vedana", "naduvedana", "sandhi vedana",
  ],
  ent: [
    "ear", "ears", "hearing", "nose", "sinus", "throat", "tonsil", "tonsils",
    "voice", "snoring", "vertigo", "dizzy", "dizziness", "nose block",
    "nosebleed", "ear pain", "ringing", "sore throat",
    "ചെവി വേദന", "ചെവിവേദന", "തൊണ്ട വേദന", "തൊണ്ടവേദന", "ജലദോഷം", "മൂക്കടപ്പ്",
    "chevi vedana", "chevivedana", "thonda vedana", "jaladosham", "mookkadapp",
  ],
  dental: [
    "tooth", "teeth", "gum", "gums", "cavity", "toothache", "wisdom tooth",
    "braces", "root canal", "bad breath", "mouth ulcer",
    "പല്ലുവേദന", "പല്ല്", "മോണ", "പോട്",
    "pallu vedana", "palluvedana", "pallu", "mona",
  ],
  general: [
    "fever", "cold", "cough", "headache", "tired", "fatigue", "vomit",
    "vomiting", "stomach", "stomach pain", "diarrhea", "diarrhoea", "bp",
    "blood pressure", "sugar", "diabetes", "weakness", "body pain", "flu",
    "പനി", "ചുമ", "തലവേദന", "ഛർദ്ദി", "വയറുവേദന", "ക്ഷീണം", "പ്രമേഹം",
    "pani", "chuma", "thalavedana", "thala vedana", "chardi", "vayaru vedana",
    "ksheenam", "prameham",
  ],
};
