import type { SpecialtySlug } from "./types";

export type SpecialtyIconKey =
  | "skin"
  | "heart"
  | "general"
  | "teeth"
  | "ent"
  | "children"
  | "bones";

export interface SpecialtyInfo {
  /** Clinical name — headings, routing copy. */
  name: string;
  description: string;
  /** Plain-language label for the department tiles. */
  tileLabel: string;
  icon: SpecialtyIconKey;
}

/** Key order is tile order on the home screen. */
export const SPECIALTIES: Record<SpecialtySlug, SpecialtyInfo> = {
  dermatology: {
    name: "Dermatology",
    description: "Skin, hair, and nail problems",
    tileLabel: "Skin & Hair",
    icon: "skin",
  },
  cardiology: {
    name: "Cardiology",
    description: "Heart and circulation problems",
    tileLabel: "Heart",
    icon: "heart",
  },
  general: {
    name: "General Physician",
    description: "Fever, infections, and everyday illness",
    tileLabel: "General",
    icon: "general",
  },
  dental: {
    name: "Dental",
    description: "Teeth and gum problems",
    tileLabel: "Teeth",
    icon: "teeth",
  },
  ent: {
    name: "ENT",
    description: "Ear, nose, throat, and sinus problems",
    tileLabel: "Ear · Nose",
    icon: "ent",
  },
  pediatrics: {
    name: "Pediatrics",
    description: "Illness and growth in children",
    tileLabel: "Children",
    icon: "children",
  },
  orthopedics: {
    name: "Orthopedics",
    description: "Bones, joints, muscles, and back problems",
    tileLabel: "Bones & Joints",
    icon: "bones",
  },
};

/**
 * Keyword → specialty map used by the fallback router (and to extract
 * matched_conditions for ranking relevance). Lowercase keywords.
 */
export const KEYWORD_MAP: Record<SpecialtySlug, string[]> = {
  // NOTE: nothing here may overlap EMERGENCY_KEYWORDS. The emergency check in
  // routeSymptom() runs first and must keep winning — "chest pain" and
  // "breathless" route to 108, never to a cardiologist list.
  cardiology: [
    "heart", "palpitation", "palpitations", "heartbeat", "cholesterol",
    "ecg", "heart murmur", "angioplasty", "stent", "bypass surgery",
    "hole in the heart", "valve",
  ],
  pediatrics: [
    "child", "children", "kid", "baby", "infant", "newborn", "toddler",
    "my child", "my son", "my daughter", "vaccination", "vaccine",
    "immunisation", "immunization", "not gaining weight", "milk feeding",
  ],
  dermatology: [
    "hair", "hair fall", "hairfall", "dandruff", "bald", "skin", "rash",
    "acne", "pimple", "itch", "itching", "eczema", "psoriasis", "fungal",
    "nail", "pigment", "dark spot", "mole", "wart", "allergy skin", "dry skin",
  ],
  orthopedics: [
    "knee", "bone", "joint", "back pain", "backpain", "neck pain", "shoulder",
    "fracture", "sprain", "hip", "arthritis", "spine", "leg pain", "elbow",
    "wrist", "ankle", "muscle pain",
  ],
  ent: [
    "ear", "hearing", "nose", "sinus", "throat", "tonsil", "voice", "snoring",
    "vertigo", "dizzy", "nose block", "nosebleed", "ear pain", "ringing",
  ],
  dental: [
    "tooth", "teeth", "gum", "cavity", "toothache", "wisdom tooth", "braces",
    "root canal", "bad breath", "mouth ulcer",
  ],
  general: [
    "fever", "cold", "cough", "headache", "tired", "fatigue", "vomit",
    "stomach", "diarrhea", "bp", "blood pressure", "sugar", "diabetes",
    "weakness", "body pain", "flu",
  ],
};

/**
 * Emergency red flags — the router must short-circuit to emergency guidance,
 * never to a doctor list.
 */
export const EMERGENCY_KEYWORDS: string[] = [
  "chest pain", "heart attack", "can't breathe", "cannot breathe",
  "breathless", "difficulty breathing", "unconscious", "not waking",
  "stroke", "face drooping", "slurred speech", "seizure", "fits",
  "heavy bleeding", "bleeding a lot", "vomiting blood", "blood in vomit",
  "severe burn", "poison", "overdose", "accident", "head injury",
];

export const EMERGENCY_MESSAGE =
  "These symptoms may be a medical emergency. Please go to the nearest emergency department immediately or call 108 (ambulance). Do not wait for an appointment.";
