import "server-only";

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
  /** A launch-notification address was written (or was already there). */
  | "notify.stored"
  /** Someone asked to be notified on a deployment with no database to hold it. */
  | "notify.unconfigured"
  /** The insert threw. Worth an alert: the form is promising an email nobody will send. */
  | "notify.failed";

const counters = new Map<Counter, number>();

export function count(name: Counter, by = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + by);
}

/** A snapshot, for /api/health. */
export function snapshot(): Record<string, number> {
  return Object.fromEntries(counters);
}
