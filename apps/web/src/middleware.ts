import { NextResponse, type NextRequest } from "next/server";

/**
 * A stricter Content-Security-Policy for the admin console.
 *
 * The public site's policy allows 'unsafe-inline' scripts because its pages
 * are statically rendered and Next's bootstrap scripts are inline. The admin
 * console is where an injected script would do the most harm — it runs with a
 * session that can publish, verify and delete doctors — and every admin page
 * is rendered per request anyway (it reads the session cookie), so it can
 * afford a nonce: only scripts Next itself emitted on this response run.
 *
 * Next reads the nonce from the request's CSP header and stamps it on its own
 * <script> tags. An admin page that is statically rendered would not get the
 * nonce and its scripts would be blocked, so admin pages must stay dynamic.
 *
 * Also differs from the public policy: no third-party styles or fonts beyond
 * the two font CDNs, form posts only to this origin, and no plugins, frames or
 * workers from anywhere.
 */
export function middleware(req: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";

  const csp = [
    "default-src 'self'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "worker-src 'none'",
    "manifest-src 'self'",
    // 'strict-dynamic' lets a nonced script load the chunks it needs; host
    // allowlists are ignored by browsers that understand it.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdn.fontshare.com data:",
    // OpenStreetMap tiles: approving an application means placing a pin.
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
    "connect-src 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers } });
  res.headers.set("content-security-policy", csp);
  return res;
}

export const config = {
  matcher: [
    {
      source: "/admin/:path*",
      // Prefetches are rendered without running middleware again; skipping
      // them keeps the nonce on the response that actually renders the page.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
