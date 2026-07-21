import { EMERGENCY_KEYWORDS, EMERGENCY_MESSAGE, KEYWORD_MAP, SPECIALTIES } from "./taxonomy";
import type { RoutingResult, SpecialtySlug } from "./types";

/**
 * On-device symptom routing — the offline fallback for when the API is
 * unreachable.
 *
 * Deliberately does NOT include the web app's LLM path: that requires an
 * Anthropic API key, and anything bundled into a mobile app ships to every
 * device that installs it. LLM routing stays server-side, behind
 * /api/route-symptom.
 *
 * The emergency check is identical to the server's and runs first, so a red
 * flag short-circuits to 108 whether or not there is a network.
 */
export function routeSymptomLocal(text: string): RoutingResult {
  const normalized = text.toLowerCase().trim();

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

  return {
    emergency: false,
    specialties: ranked.slice(0, 2).map(([slug]) => ({
      slug,
      reason: `Your description mentions ${scores.get(slug)!.hits.join(", ")} — this is usually treated by a ${SPECIALTIES[slug].name} (${SPECIALTIES[slug].description.toLowerCase()}).`,
    })),
    matched_conditions: ranked.flatMap(([, v]) => v.hits),
    source: "keywords",
  };
}
