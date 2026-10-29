import type { Metadata } from "next";

/**
 * The admin console is for the team, not for search engines. noindex here as
 * well as the Disallow in robots.txt: a disallowed URL can still be indexed
 * from a link, a noindex one cannot.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="adm">{children}</div>;
}
