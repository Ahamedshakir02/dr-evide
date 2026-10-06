import type { Metadata } from "next";

/**
 * Metadata for /find, which cannot declare its own — the page is a client
 * component because the symptom box is interactive, and `metadata` is a server
 * export. A one-file layout is the standard way across that boundary.
 */
export const metadata: Metadata = {
  title: "Find a doctor",
  description:
    "Describe your symptoms in your own words and get routed to the right department, with doctors near Edappal ranked by verified credentials.",
  alternates: { canonical: "/find" },
};

export default function FindLayout({ children }: { children: React.ReactNode }) {
  return children;
}
