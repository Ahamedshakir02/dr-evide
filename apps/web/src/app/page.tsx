import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

/**
 * `/` — what Dr Evide is, what the app does, and where to get it.
 *
 * A server component wrapping a client one. The page itself needs no
 * interactivity, but the language toggle lives in React state, so the content
 * is a client component while the route stays on the server and keeps its own
 * `metadata`. This is the page most likely to be found by search or shared in a
 * message, so its title and description are its own rather than the layout's
 * defaults — every page shared one title before, and none of them could rank
 * for anything.
 */
export const metadata: Metadata = {
  title: "Dr Evide — find the right doctor, not the one who paid",
  description:
    "Describe your problem in Malayalam or English. Dr Evide routes you to the right department and ranks doctors near Edappal by verified credentials, experience and authentic reviews — never by who paid. No paid placement, enforced in the build.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Dr Evide — find the right doctor, not the one who paid",
    description:
      "Symptom routing in Malayalam and English, a transparent 0–100 TrustScore, and no paid placement — ever.",
    type: "website",
    locale: "en_IN",
  },
};

export default function Home() {
  return <Landing />;
}
