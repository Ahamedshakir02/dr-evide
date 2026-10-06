/**
 * The site's public origin.
 *
 * robots.txt and sitemap.xml both have to emit absolute URLs — a relative one
 * is simply ignored — so this cannot be inferred from the request the way the
 * rest of the app manages. Set NEXT_PUBLIC_SITE_URL at deploy time.
 *
 * The localhost default is deliberate rather than a guessed production domain:
 * a sitemap pointing at a hostname we do not control is worse than one that is
 * obviously wrong in development. Trailing slashes are stripped so callers can
 * append a path without producing `//`.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
