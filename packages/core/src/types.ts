import type { EmergencyCategory, Helpline } from "./emergency";

export type SpecialtySlug =
  | "dermatology"
  | "cardiology"
  | "general"
  | "dental"
  | "ent"
  | "pediatrics"
  | "orthopedics";

export interface Doctor {
  id: number;
  full_name: string;
  specialty_slug: SpecialtySlug;
  sub_specialties: string[];
  conditions: string[];
  qualifications: string[];
  qualification_level: number; // 1..4
  nmc_reg_no: string | null;
  nmc_verified: boolean;
  reg_year: number | null;
  clinic_name: string | null;
  address: string | null;
  town: string | null;
  phone: string | null;
  fee_inr: number | null;
  timings: string | null;
  lat: number;
  lng: number;
  review_count: number;
  review_avg: number;
  review_authenticity: number;
  is_sample: boolean;
}

/**
 * Where a credential claim came from and when it was last checked.
 *
 * TrustScore ranks named, real people on their qualifications. Publishing that
 * without being able to answer "who verified this, from what source, and when"
 * is both a defamation exposure and a broken promise — the whole pitch is that
 * the score is auditable. `nmc_verified` alone is a boolean with no story.
 */
export interface CredentialProvenance {
  doctor_id: number;
  /** e.g. "nmc-registry", "state-council", "manual-review" */
  source: string;
  /** Public URL of the record consulted, when one exists. */
  evidence_url: string | null;
  /** Who signed off. A person or a named automated job — never null. */
  verified_by: string;
  verified_at: string; // ISO 8601
  note: string | null;
}

export interface ScoreBreakdown {
  qualification: number; // out of 30
  experience: number; // out of 15
  reviews: number; // out of 25
  condition_relevance: number; // out of 20
  accessibility: number; // out of 10
}

export interface RankedDoctor extends Doctor {
  distance_km: number;
  trust_score: number; // 0..100
  score_breakdown: ScoreBreakdown;
  /** Which weighting produced trust_score. See SCORE_VERSION in ranking.ts. */
  score_version: string;
}

export interface RoutedSpecialty {
  slug: SpecialtySlug;
  reason: string;
}

export interface RoutingResult {
  emergency: boolean;
  emergency_message?: string;
  /** The same instruction in Malayalam. See EmergencyMatch.messageMl. */
  emergency_message_ml?: string;
  emergency_category?: EmergencyCategory;
  /** Numbers to offer instead of a doctor list. Empty when emergency is false. */
  emergency_helplines?: Helpline[];
  specialties: RoutedSpecialty[];
  /** Keywords extracted from the user text, used for ranking relevance. */
  matched_conditions: string[];
  source: "llm" | "keywords";
}
