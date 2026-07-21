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

export interface RankedDoctor extends Doctor {
  distance_km: number;
  trust_score: number; // 0..100
  score_breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  qualification: number; // out of 30
  experience: number; // out of 15
  reviews: number; // out of 25
  condition_relevance: number; // out of 20
  accessibility: number; // out of 10
}

export interface RoutingResult {
  emergency: boolean;
  emergency_message?: string;
  specialties: { slug: SpecialtySlug; reason: string }[];
  matched_conditions: string[]; // keywords extracted from the user text
  source: "llm" | "keywords";
}
