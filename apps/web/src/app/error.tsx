"use client";

import { Phone, RotateCw, TriangleAlert } from "lucide-react";

/**
 * The last line of defence for a rendering or data-fetch failure.
 *
 * There was no boundary at all, so a `getDoctor()` throw — and the pool is
 * configured with a 5s statement timeout precisely because that happens —
 * rendered Next's own error page: a grey stack trace with no way back and no
 * mention of 108.
 *
 * The error object is not displayed. It may carry a query, a connection string,
 * or a fragment of the request, and none of that belongs in front of a person
 * who came here because they feel unwell.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="route-error" role="alert">
      <TriangleAlert size={40} aria-hidden="true" />
      <h1>Something went wrong</h1>
      <p>
        This is our problem, not yours — and it doesn&apos;t mean anything about the doctors
        near you. Try again, and if it keeps happening please come back a little later.
      </p>

      <div className="route-error__actions">
        <button className="sh-btn sh-btn--primary" onClick={reset}>
          <RotateCw size={18} aria-hidden="true" />
          Try again
        </button>
        <a className="sh-btn sh-btn--secondary" href="/">
          Back to search
        </a>
      </div>

      {/* The one thing that must work on every screen in this product,
          including the broken one. */}
      <p className="route-error__emergency">
        <Phone size={15} aria-hidden="true" />
        In an emergency, call <a href="tel:108">108</a> for a free ambulance.
      </p>
    </div>
  );
}
