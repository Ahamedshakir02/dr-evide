import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import {
  SPECIALTIES,
  SPECIALTY_SLUGS,
  emergencyResult,
  llmRoutingSchema,
  routeByKeywords,
  type RoutingResult,
} from "@dr-evide/core";
import { count } from "./telemetry";

/**
 * LLM symptom routing — server-side only.
 *
 * Layered strictly on top of the offline router in @dr-evide/core, never in
 * place of it:
 *
 *   1. The emergency check runs first, locally, and the model is never asked
 *      about it. A red flag must not depend on a network call, an API key, or
 *      a model's judgement.
 *   2. If the model is unavailable, slow, or returns something that fails
 *      validation, we fall through to the keyword router. Routing degrades; it
 *      never fails.
 *
 * The user's symptom text is sensitive personal data under the DPDP Act 2023.
 * It is sent to Anthropic to be classified and is never logged here — not on
 * the success path and not in any error branch. Only the matched specialty
 * slugs and red-flag terms are ever recorded.
 */

/**
 * Haiku, deliberately. This is a short classification over a fixed seven-item
 * taxonomy — the cheapest, fastest tier is the right one, and someone unwell
 * is waiting on the response. Kept as the alias rather than a dated snapshot so
 * it tracks the current build.
 */
const MODEL = "claude-haiku-4-5";

/**
 * Six seconds, then we serve keyword routing instead.
 *
 * The SDK's default is ten minutes, which for a person on a phone waiting to be
 * told which doctor to see is indistinguishable from the site being broken.
 * Note this value is milliseconds — the TypeScript SDK differs from the Python
 * one here.
 */
const TIMEOUT_MS = 6_000;

/**
 * No prompt caching on this call, deliberately. The minimum cacheable prefix on
 * Haiku 4.5 is 4096 tokens and this system prompt is a fraction of that, so a
 * cache_control breakpoint would cost the write premium and silently never be
 * read. Revisit only if the prompt grows past the minimum.
 */
const SYSTEM_PROMPT = `You are a triage router for a doctor-discovery app in Kerala, India.

You NEVER diagnose. You map a description of a problem to the medical department that treats it, and nothing more.

Rules:
- Choose 1-2 departments from exactly this list: ${SPECIALTY_SLUGS.join(" | ")}.
- "reason" is ONE plain-language sentence saying why that department fits. Never name a disease as a diagnosis, never state or imply what the person has, and never suggest a treatment.
- "matched_conditions" are short lowercase keywords lifted from the user's own words (e.g. "hair fall", "knee pain"). Two to four is plenty.
- The user may write in English, Malayalam, or romanised Malayalam. Handle all three.
- Set emergency=true only for potentially life-threatening symptoms. A separate local check already ran, so this is a backstop, not the primary safeguard.
- If the description is too vague to place, return the single department "general".`;

const ROUTING_JSON_SCHEMA = {
  type: "object",
  properties: {
    emergency: { type: "boolean" },
    specialties: {
      type: "array",
      items: {
        type: "object",
        properties: {
          slug: { type: "string", enum: SPECIALTY_SLUGS },
          reason: { type: "string" },
        },
        required: ["slug", "reason"],
        additionalProperties: false,
      },
    },
    matched_conditions: { type: "array", items: { type: "string" } },
  },
  required: ["emergency", "specialties", "matched_conditions"],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: TIMEOUT_MS,
      // One retry, not the default two: a person is waiting, and the keyword
      // router is a perfectly good answer.
      maxRetries: 1,
    });
  }
  return client;
}

/**
 * Route free-text symptoms to departments.
 *
 * This is the only routing entry point the web app should call.
 */
export async function routeSymptom(text: string): Promise<RoutingResult> {
  // 1. Red flags. Local, synchronous, non-negotiable, before anything else.
  const emergency = emergencyResult(text);
  if (emergency) {
    count("routing.emergency.local");
    return emergency;
  }

  // 2. The model, when it is configured and behaving.
  const llm = await routeWithLLM(text);
  if (llm) return llm;

  // 3. The floor.
  return routeByKeywords(text);
}

async function routeWithLLM(text: string): Promise<RoutingResult | null> {
  const anthropic = getClient();
  if (!anthropic) {
    count("routing.llm.unconfigured");
    return null;
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: ROUTING_JSON_SCHEMA } },
      messages: [{ role: "user", content: text }],
    });

    // Refusals and truncation both leave us without usable output. Neither is
    // an error worth surfacing — fall through to keywords.
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      count("routing.llm.incomplete");
      return null;
    }

    const raw = response.content.find((block) => block.type === "text")?.text;
    if (!raw) {
      count("routing.llm.incomplete");
      return null;
    }

    // The model is untrusted input. Anything that does not match the schema is
    // discarded rather than reshaped, and unknown slugs are dropped inside the
    // schema's transform so one bad department does not cost the user a good one.
    const parsed = llmRoutingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      count("routing.llm.invalid");
      return null;
    }

    const { emergency, specialties, matched_conditions } = parsed.data;

    // The model thinks this is an emergency but our local check did not. Trust
    // the model in the cautious direction only: re-run the red-flag path so the
    // user gets the same vetted message and helplines, never a model-authored one.
    if (emergency) {
      count("routing.llm.emergency_backstop");
      return {
        emergency: true,
        emergency_message: EMERGENCY_BACKSTOP_MESSAGE,
        emergency_message_ml: EMERGENCY_BACKSTOP_MESSAGE_ML,
        emergency_category: "medical",
        emergency_helplines: [{ label: "108 — free ambulance", number: "108" }],
        specialties: [],
        matched_conditions,
        source: "llm",
      };
    }

    if (specialties.length === 0) {
      count("routing.llm.invalid");
      return null;
    }

    count("routing.llm.ok");
    return {
      emergency: false,
      specialties: specialties.map((s) => ({
        slug: s.slug,
        // Guard against an empty or whitespace-only reason: the results page
        // renders this directly and a blank explanation reads as a bug.
        reason: s.reason.trim() || defaultReason(s.slug),
      })),
      matched_conditions,
      source: "llm",
    };
  } catch {
    // Timeout, rate limit, network failure, malformed JSON — all the same
    // outcome from the user's point of view. Still swallowed without logging,
    // because the request body is the user's symptom text — but counted, so a
    // key that expired at 3am is visible before someone notices the routing has
    // quietly been keyword-only for a week. The counter carries no payload; see
    // lib/telemetry.ts.
    count("routing.llm.error");
    return null;
  }
}

const EMERGENCY_BACKSTOP_MESSAGE =
  "These symptoms may be a medical emergency. Please go to the nearest emergency department immediately or call 108 (free ambulance). Do not wait for an appointment.";

const EMERGENCY_BACKSTOP_MESSAGE_ML =
  "ഈ ലക്ഷണങ്ങൾ ഒരു അടിയന്തര വൈദ്യസഹായം ആവശ്യമുള്ളതാകാം. ഉടൻ തന്നെ അടുത്തുള്ള അത്യാഹിത വിഭാഗത്തിലേക്ക് പോകുക, അല്ലെങ്കിൽ 108 (സൗജന്യ ആംബുലൻസ്) വിളിക്കുക. അപ്പോയിന്റ്മെന്റിനായി കാത്തിരിക്കരുത്.";

function defaultReason(slug: keyof typeof SPECIALTIES): string {
  return `This is usually treated by a ${SPECIALTIES[slug].name} (${SPECIALTIES[slug].description.toLowerCase()}).`;
}
