"use client";

import { useEffect, useRef } from "react";

/**
 * Counting what the profile page is for: did a search end in a call or
 * directions? See POST /api/events.
 *
 * The body is only the event name. No doctor id, no page, no session — the
 * endpoint refuses anything else, and "which doctor did people who searched
 * for a dermatologist ring" is a health signal about that doctor's patients.
 *
 * navigator.sendBeacon because a Call or Directions tap usually leaves the
 * page (to the dialler, to Maps) and a fetch started then is often cancelled.
 * A beacon is queued by the browser and survives the navigation. Its string
 * body goes as text/plain, which the endpoint accepts for that reason.
 */
export type ContactEvent = "profile_view" | "call" | "directions";

export function sendContactEvent(event: ContactEvent): void {
  try {
    const body = JSON.stringify({ event });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      if (navigator.sendBeacon("/api/events", body)) return;
    }
    // No beacon support, or the queue was full: a keepalive fetch does the same job.
    void fetch("/api/events", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {
    // A count must never break the page it is counting.
  }
}

/** Sends one profile_view per page load. Rendered once on /doctor/[id]. */
export function ProfileViewBeacon() {
  // Strict Mode runs effects twice in development; the ref keeps that to one count.
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    sendContactEvent("profile_view");
  }, []);
  return null;
}

/**
 * An <a> that counts a tap before following it. The link works exactly as
 * before with JavaScript off or the beacon blocked; counting is a side effect.
 */
export function TrackedLink({
  event,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { event: Exclude<ContactEvent, "profile_view"> }) {
  return (
    <a
      {...props}
      onClick={(e) => {
        sendContactEvent(event);
        props.onClick?.(e);
      }}
    />
  );
}
