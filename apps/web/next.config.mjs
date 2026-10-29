import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * Pin file tracing to the workspace root. Next walks up looking for a
   * lockfile and, on a machine with a stray lockfile in the home directory,
   * picks that instead — which silently traces the wrong tree.
   */
  outputFileTracingRoot: workspaceRoot,

  /**
   * The workspace packages ship TypeScript source rather than a build step, so
   * Next compiles them as part of the app. One less build to keep in sync, and
   * the packages stay debuggable from the app's stack traces.
   */
  transpilePackages: ["@dr-evide/core", "@dr-evide/db"],

  async headers() {
    return [
      // Everything except the admin console gets the public policy. /admin
      // gets a stricter, per-request nonce policy from src/middleware.ts, and
      // a second CSP here would be enforced alongside it.
      {
        source: "/((?!admin$|admin/).*)",
        headers: [...SECURITY_HEADERS, { key: "Content-Security-Policy", value: CSP }],
      },
      { source: "/admin", headers: [...SECURITY_HEADERS, ...ADMIN_HEADERS] },
      { source: "/admin/:path*", headers: [...SECURITY_HEADERS, ...ADMIN_HEADERS] },
      { source: "/api/admin/:path*", headers: ADMIN_HEADERS },
    ];
  },
};

/**
 * Content-Security-Policy.
 *
 * `unsafe-inline` on style-src is unavoidable while the pages use inline
 * `style={{…}}` props, and Next's hydration bootstrap needs `unsafe-inline` on
 * script-src unless every script gets a per-request nonce. Both are worth
 * closing later; neither is a reason to ship no policy at all.
 *
 * `unsafe-eval` is added in development only. Next's React Refresh runtime
 * evaluates strings, so without it the client bundle throws before hydrating
 * and every page renders as dead server markup — the form's button never
 * enables and /results never leaves its skeleton. The production policy is
 * unchanged: react-refresh does not ship in a build.
 *
 * The connect/img/font sources are the complete list of third parties this
 * product talks to. Anything not named here cannot be reached from the page,
 * which is the property that matters: an injected script cannot exfiltrate a
 * symptom description to a host we did not choose.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  // Both font CDNs the design system actually loads. Fontshare was missing,
  // so the two faces that carry the brand — Clash Display and General Sans —
  // were blocked on every page and the whole site rendered in the generic
  // sans-serif fallback. The policy has to name what the stylesheet imports;
  // there is no version of this where the CSP and fonts.css disagree and the
  // design still arrives.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
  "font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com data:",
  // OpenStreetMap raster tiles for the desktop results map.
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
  "connect-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  /**
   * The one header on this list that fixes a live data leak.
   *
   * /results and /doctor/[id] carry condition keywords derived from a health
   * complaint. Every OpenStreetMap tile request — roughly twenty per map view —
   * and every click through to Google Maps must never receive that page URL:
   * paths and query strings can expose an inferred medical specialty.
   *
   * The public OpenStreetMap tile service, however, blocks completely anonymous
   * image traffic. `strict-origin` is the narrowest policy that lets it identify
   * this application: cross-origin requests receive only this site's origin,
   * never the path, query string, coordinates, or routed conditions.
   */
  { key: "Referrer-Policy", value: "strict-origin" },

  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  /**
   * Geolocation stays on — the results page asks for it to rank by real
   * distance. Everything else is denied outright: a doctor-discovery product
   * has no reason to reach a camera or a microphone, and saying so explicitly
   * means a future dependency cannot quietly start.
   */
  {
    key: "Permissions-Policy",
    value: [
      "geolocation=(self)",
      "camera=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
];

/**
 * The admin console and its API. Never indexed, never cached by a browser or
 * a shared proxy (the pages hold doctors' contact details and review notes),
 * and opened in its own browsing-context group so a page it links to cannot
 * reach back through window.opener.
 */
const ADMIN_HEADERS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Cache-Control", value: "no-store" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

export default nextConfig;
