import "server-only";
import type { SpecialtySlug } from "@dr-evide/core";
import { incrementCounter } from "@dr-evide/db";

/**
 * Counters, and nothing else.
 *
 * The product handles free-text symptom descriptions, which are sensitive
 * personal data under the DPDP Act 2023, so the codebase logs nothing on the
 * request path — deliberately, and that should not change. But "log nothing"
 * quietly became "know nothing":
 *
 *     } catch {
 *       return null;   // timeout, 429, network, bad JSON — all the same
 *     }
 *
 * Swallowing the *content* of that failure is right; the body is the user's
 * complaint. Swallowing the *fact* is not. If the API key expires, every user
 * silently drops to keyword routing and nothing anywhere says so. The same
 * applies to a rate-limit storm.
 *
 * So: names and integers. This module physically cannot record a payload —
 * `count` takes no free-text argument, and the label type is a closed union.
 * That is the property worth having, more than any policy about what to log.
 *
 * In-process like the rate limiter, and honest about it: the numbers are per
 * instance and reset on deploy. Point them at a real metrics sink before
 * running more than one instance; the call sites will not need to change.
 */

export type Counter =
  /** The LLM router produced a usable answer. */
  | "routing.llm.ok"
  /** No ANTHROPIC_API_KEY configured — keyword routing is the intended path. */
  | "routing.llm.unconfigured"
  /** Timeout, network error, rate limit, or any other thrown failure. */
  | "routing.llm.error"
  /** The model refused or hit max_tokens. */
  | "routing.llm.incomplete"
  /** The response did not survive llmRoutingSchema. */
  | "routing.llm.invalid"
  /** The model raised a red flag our local check did not. */
  | "routing.llm.emergency_backstop"
  /** A local red flag short-circuited before the model was ever called. */
  | "routing.emergency.local"
  /** A caller was turned away by the rate limiter. */
  | "ratelimit.rejected"
  /**
   * The shared rate-limit store was unreachable and the in-process one took
   * over. Worth an alert on more than one instance: the limit is still being
   * applied, but per replica rather than across them.
   */
  | "ratelimit.degraded"
  /**
   * A search found no doctor in range. One counter per department, from a closed
   * union, so it still cannot carry a payload: which specialty is empty is the
   * next recruiting target, and nothing about who asked.
   */
  | `search.empty.${SpecialtySlug}`
  /** A search ran, per department. The denominator for every other search number. */
  | `search.performed.${SpecialtySlug}`
  /**
   * A reader opened a doctor's profile, tapped Call, or tapped Directions.
   * Call and Directions are the north-star metric — a search that ended in a
   * contact. Which doctor is deliberately not recorded: a per-doctor count of
   * "people who looked for a dermatologist and rang this one" is a health
   * signal about that doctor's patients.
   */
  | "contact.profile_view"
  | "contact.call"
  | "contact.directions"
  /** A doctor submitted a listing application. */
  | "listing.submitted"
  /** An admin sign-in failed (wrong password, unknown email, disabled account). */
  | "admin.login_failed"
  /** A launch-notification address was written (or was already there). */
  | "notify.stored"
  /** Someone asked to be notified on a deployment with no database to hold it. */
  | "notify.unconfigured"
  /** The insert threw. Worth an alert: the form is promising an email nobody will send. */
  | "notify.failed";

const counters = new Map<Counter | "telemetry.persist_failed", number>();

/**
 * Counters that are kept in the database as well as in memory. The operational
 * ones (rate limiting, the LLM fallback) stay in-process only: they answer
 * "is something broken right now" on /api/health, and writing a row per
 * rate-limit rejection would let a flood of requests turn into a flood of
 * writes.
 */
const PERSISTED = /^(search\.|contact\.|listing\.|notify\.stored$)/;

export function count(name: Counter, by = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + by);
  if (PERSISTED.test(name)) {
    // Fire and forget: a search must never wait on, or fail because of, a stat.
    incrementCounter(name, by).catch(() => {
      counters.set("telemetry.persist_failed", (counters.get("telemetry.persist_failed") ?? 0) + 1);
    });
  }
}

/** A snapshot, for /api/health. */
export function snapshot(): Record<string, number> {
  return Object.fromEntries(counters);
}
