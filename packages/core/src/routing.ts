import { detectEmergency } from "./emergency";
import { KEYWORD_MAP, SPECIALTIES } from "./taxonomy";
import { findTerms, normalize } from "./text";
import type { RoutingResult, SpecialtySlug } from "./types";

/**
 * Offline symptom routing — no network, no API key, no clock.
 *
 * This is the floor the product stands on. The web app layers LLM routing on
 * top of it (apps/web/src/lib/llm-routing.ts), but every LLM path falls back
 * here, and the mobile app ships only this, because anything bundled into a
 * mobile binary ships to every device that installs it — including the API key.
 *
 * The emergency check runs first and is never skipped, so a red flag reaches
 * 108 whether or not there is a network.
 */
export function routeByKeywords(text: string): RoutingResult {
  const emergency = emergencyResult(text);
  if (emergency) return emergency;

  const haystack = normalize(text);
  const scored: { slug: SpecialtySlug; hits: string[]; score: number }[] = [];

  for (const slug of Object.keys(KEYWORD_MAP) as SpecialtySlug[]) {
    const hits = findTerms(haystack, KEYWORD_MAP[slug]);
    if (hits.length === 0) continue;
    // Multi-word matches are stronger signals: "back pain" says more than "pain".
    const score = hits.reduce((sum, hit) => sum + (hit.includes(" ") ? 2 : 1), 0);
    scored.push({ slug, hits, score });
  }

  // Ties broken by taxonomy order, which is deliberate: SPECIALTIES is ordered
  // by how commonly the department is the right answer.
  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) return unroutable();

  return {
    emergency: false,
    specialties: scored.slice(0, 2).map(({ slug, hits }) => ({
      slug,
      reason: `Your description mentions ${formatList(hits)} — this is usually treated by a ${
        SPECIALTIES[slug].name
      } (${SPECIALTIES[slug].description.toLowerCase()}).`,
    })),
    matched_conditions: dedupe(scored.flatMap((s) => s.hits)),
    source: "keywords",
  };
}

/**
 * Run only the red-flag check and shape it as a RoutingResult. Exported so the
 * LLM path can enforce the same short-circuit before it calls out to anything.
 */
export function emergencyResult(text: string): RoutingResult | null {
  const match = detectEmergency(text);
  if (!match) return null;

  return {
    emergency: true,
    emergency_message: match.message,
    emergency_message_ml: match.messageMl,
    emergency_category: match.category,
    emergency_helplines: match.helplines,
    specialties: [],
    matched_conditions: match.matched,
    source: "keywords",
  };
}

/**
 * Nothing matched. We route to a General Physician rather than showing an empty
 * screen: a GP is a safe, cheap first step who can examine and refer onward,
 * and "we don't know" is not an answer someone unwell can act on.
 */
function unroutable(): RoutingResult {
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

const dedupe = (xs: string[]): string[] => [...new Set(xs)];

function formatList(items: string[]): string {
  const shown = items.slice(0, 3);
  if (shown.length <= 1) return shown.join("");
  return `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}
