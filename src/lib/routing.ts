import { EMERGENCY_KEYWORDS, EMERGENCY_MESSAGE, KEYWORD_MAP, SPECIALTIES } from "./taxonomy";
import type { RoutingResult, SpecialtySlug } from "./types";

/**
 * Route free-text symptom description to specialties.
 * Emergency check ALWAYS runs first, locally, regardless of LLM availability.
 * Uses the Anthropic API when ANTHROPIC_API_KEY is set; otherwise a keyword matcher.
 */
export async function routeSymptom(text: string): Promise<RoutingResult> {
  const normalized = text.toLowerCase().trim();

  // 1. Emergency short-circuit (local, non-negotiable)
  for (const kw of EMERGENCY_KEYWORDS) {
    if (normalized.includes(kw)) {
      return {
        emergency: true,
        emergency_message: EMERGENCY_MESSAGE,
        specialties: [],
        matched_conditions: [kw],
        source: "keywords",
      };
    }
  }

  // 2. LLM routing if available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const llmResult = await routeWithLLM(normalized);
      if (llmResult) return llmResult;
    } catch {
      // fall through to keywords
    }
  }

  // 3. Keyword fallback
  return routeWithKeywords(normalized);
}

export function routeWithKeywords(normalized: string): RoutingResult {
  const scores = new Map<SpecialtySlug, { hits: string[]; score: number }>();

  for (const [slug, keywords] of Object.entries(KEYWORD_MAP) as [SpecialtySlug, string[]][]) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        const entry = scores.get(slug) ?? { hits: [], score: 0 };
        entry.hits.push(kw);
        entry.score += kw.includes(" ") ? 2 : 1; // multi-word matches are stronger signals
        scores.set(slug, entry);
      }
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1].score - a[1].score);

  if (ranked.length === 0) {
    return {
      emergency: false,
      specialties: [
        {
          slug: "general",
          reason:
            "We couldn't confidently match your description to a specialty. A General Physician is the right first step — they can examine you and refer you onward.",
        },
      ],
      matched_conditions: [],
      source: "keywords",
    };
  }

  const matched = ranked.flatMap(([, v]) => v.hits);
  return {
    emergency: false,
    specialties: ranked.slice(0, 2).map(([slug]) => ({
      slug,
      reason: `Your description mentions ${scores.get(slug)!.hits.join(", ")} — this is usually treated by a ${SPECIALTIES[slug].name} (${SPECIALTIES[slug].description.toLowerCase()}).`,
    })),
    matched_conditions: matched,
    source: "keywords",
  };
}

async function routeWithLLM(text: string): Promise<RoutingResult | null> {
  const slugs = Object.keys(SPECIALTIES).join(" | ");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `You are a triage router for a doctor-discovery app in Kerala, India. You NEVER diagnose. Map the user's symptom description to 1-2 medical departments from EXACTLY this list: ${slugs}. Respond with ONLY valid JSON: {"emergency": boolean, "specialties": [{"slug": string, "reason": string}], "matched_conditions": [string]}. "reason" must be one plain-language sentence explaining why that department fits, without naming any disease as a diagnosis. "matched_conditions" = short lowercase keywords from the text (e.g. "hair fall"). Set emergency=true only for potentially life-threatening symptoms.`,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const raw = data?.content?.[0]?.text;
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  const validSlugs = new Set(Object.keys(SPECIALTIES));
  const specialties = (parsed.specialties ?? [])
    .filter((s: { slug: string }) => validSlugs.has(s.slug))
    .slice(0, 2);

  if (parsed.emergency) {
    return {
      emergency: true,
      emergency_message: EMERGENCY_MESSAGE,
      specialties: [],
      matched_conditions: parsed.matched_conditions ?? [],
      source: "llm",
    };
  }
  if (specialties.length === 0) return null; // fall back to keywords

  return {
    emergency: false,
    specialties,
    matched_conditions: parsed.matched_conditions ?? [],
    source: "llm",
  };
}
