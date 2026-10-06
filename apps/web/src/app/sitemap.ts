import type { MetadataRoute } from "next";
import { listIndexableDoctors } from "@dr-evide/db";
import { SITE_URL } from "@/lib/site-url";

/**
 * The pages worth indexing, and only those.
 *
 * /results is left out on purpose. It reads its context from sessionStorage
 * rather than the URL — deliberately, so a health complaint never lands in
 * browser history or an access log — which means a crawler fetching it cold
 * gets the empty state.
 *
 * Doctor profiles are different: `/doctor/[id]` renders everything that
 * describes the person from the id alone, and only the "back to results" link
 * depends on the search that led there. They are listed here **when they are
 * real**. `listIndexableDoctors` filters on `is_sample` in SQL, which is the
 * same gate the `Physician` markup uses, so a zero-setup checkout publishes
 * two URLs rather than twenty invented doctors — and the day a real database
 * is configured the profiles appear without anyone remembering to change this
 * file.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const doctors = await listIndexableDoctors();

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
    ...doctors.map((d) => ({
      url: `${SITE_URL}/doctor/${d.id}`,
      // A profile changes when the credentials behind it are re-checked, which
      // is a slow, deliberate act rather than a content update.
      lastModified: new Date(d.created_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
