import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

/**
 * The two pages worth indexing, and only those.
 *
 * /results and /doctor/[id] are left out on purpose. Both read their context
 * from sessionStorage rather than the URL — deliberately, so a health complaint
 * never lands in browser history or an access log — which means a crawler
 * fetching them cold gets the empty state. Listing every doctor here would also
 * publish a directory of people whose credentials are still being verified;
 * profiles go in when the data behind them is real, not before.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/find`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
