import "server-only";
import { jsonError } from "./api";

/** One wording per failure, shared by every admin write route. */
const MESSAGES = {
  not_found: ["Not found.", 404],
  conflict: ["This application has already been reviewed.", 409],
  duplicate_registration: ["Another listed doctor already has this registration number.", 409],
  sample: ["Sample records are fixtures and cannot be edited here.", 409],
} as const;

export function reviewResponse(status: keyof typeof MESSAGES) {
  const [message, code] = MESSAGES[status];
  return jsonError(message, code, { status });
}
