import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * There was no robots.txt at all, which was survivable while the site was one
 * page and had nothing to say. It is not now: `/` exists to be found, and
 * without this a crawler is free to spend its budget on API routes and search
 * result pages instead.
 *
 * /api/* and /results are disallowed for different reasons. The API returns
 * JSON that means nothing in a search result. /results and /doctor/[id] are
 * reached from a symptom search whose context lives in sessionStorage — crawled
 * cold they render the empty state, so indexing them would put a page in the
 * results that is blank for everyone who clicks it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/results"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
