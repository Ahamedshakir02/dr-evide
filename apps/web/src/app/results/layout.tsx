import type { Metadata } from "next";

/**
 * Metadata for /results, which cannot declare its own — the page is a client
 * component because the radius slider, the map and the fetch all are, and
 * `metadata` is a server export. Same one-file layout as /find.
 *
 * The title is generic where the page is specific: the department comes from a
 * query string and the heading already says it, but a title cannot be built
 * from `useSearchParams` on the server, and `generateMetadata` would make this
 * a dynamic route for the sake of a browser tab. Naming the search is worth
 * more than the default "find the right doctor near you" this inherited from
 * the root layout, which said nothing about the page and was the only route on
 * the site with no title of its own.
 *
 * `robots: noindex` states in the page what sitemap.ts already decided by
 * leaving /results out: the search reads its context from sessionStorage
 * rather than the URL, so a crawler fetching this cold gets the empty state.
 * Omitting a URL from a sitemap does not stop it being indexed if something
 * links to it; this does. `follow` stays on, because the doctor profiles it
 * links to are exactly the pages that should be crawled.
 */
export const metadata: Metadata = {
  title: "Doctors near you",
  description:
    "Doctors near Edappal ranked by TrustScore — verified credentials, real opinions and distance. Never by who paid.",
  robots: { index: false, follow: true },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
