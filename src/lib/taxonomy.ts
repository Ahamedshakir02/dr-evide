import type { SpecialtySlug } from "./types";

export const SPECIALTIES: Record<SpecialtySlug, { name: string; description: string }> = {
  dermatology: {
    name: "Dermatology",
    description: "Skin, hair, and nail problems",
  },
  orthopedics: {
    name: "Orthopedics",
    description: "Bones, joints, muscles, and back problems",
  },
  ent: {
    name: "ENT",
    description: "Ear, nose, throat, and sinus problems",
  },
  dental: {
    name: "Dental",
    description: "Teeth and gum problems",
  },
  general: {
    name: "General Physician",
    description: "Fever, infections, and everyday illness",
  },
};

/**
 * Keyword → specialty map used by the fallback router (and to extract
 * matched_conditions for ranking relevance). Lowercase keywords.
 */
export const KEYWORD_MAP: Record<SpecialtySlug, string[]> = {
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
