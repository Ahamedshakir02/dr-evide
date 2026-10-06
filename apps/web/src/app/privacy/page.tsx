import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy and listing",
  description:
    "What Dr Evide does with what you type, what it stores, and how a doctor can be listed or removed.",
  alternates: { canonical: "/privacy" },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

/**
 * Written to be true of the code, not of an aspiration: every sentence below
 * maps to something in the repo, and the two places a careless notice would lie
 * (the model call, the font and map CDNs) are stated outright.
 *
 * This is a plain-language notice, not legal advice or a finished DPDP
 * Act 2023 policy. It needs a lawyer's read before the product is publicised.
 */
export default function Privacy() {
  return (
    <article style={{ maxWidth: 720, padding: "32px 0 16px" }}>
      <h1 className="results-h1">Privacy and listing</h1>

      <h2>What you type</h2>
      <p>
        The words you type in the symptom box are used to pick a department and
        then dropped. They are not written to a database, not logged, and not put
        in the web address. Emergency red flags are checked on our server first,
        with no outside service involved.
      </p>
      <p>
        If the site is configured to use an AI model to understand free text, your
        words are sent to that provider (Anthropic) for that one request, only
        after the emergency check has passed. If it is not configured, a keyword
        matcher does the same job without sending anything anywhere.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Your approximate location and the matched conditions are kept in your
        browser&apos;s session storage so the results page can use them. They
        leave with the tab. We do not receive your location unless your browser
        sends it with a search, and we do not store it.
      </p>

      <h2>What we do store</h2>
      <p>
        Only an email address, and only if you ask to be told when the app
        launches. We use it for that one message. Ask us and we delete it.
      </p>
      <p>
        We keep simple counts, such as how many searches found no doctor in a
        department. They hold no text, no location and no identity.
      </p>

      <h2>Outside services your browser contacts</h2>
      <p>
        Typefaces load from Fontshare and Google Fonts, and the map loads tiles
        from OpenStreetMap. Those services can see your IP address when they
        serve a file. No search text or location is sent to them by us.
      </p>

      <h2 id="doctors">For doctors</h2>
      <p>
        We list a doctor only with their consent, and show their name,
        qualifications, registration number, clinic and contact details. A
        registration is marked verified only after a person has checked it against
        the public register, and we record who checked, against what, and when.
        Ranking is never for sale: nothing a doctor or anyone else pays for can
        change a position.
      </p>
      <p>
        To be listed, to correct anything, or to be removed, email us and we will
        act on it.{" "}
        {CONTACT_EMAIL ? (
          <a href={`mailto:${CONTACT_EMAIL}?subject=Dr%20Evide%20listing`}>{CONTACT_EMAIL}</a>
        ) : (
          "The contact address will be published here before launch."
        )}
      </p>

      <h2>Not medical advice</h2>
      <p>
        Dr Evide helps you find a doctor. It does not diagnose or treat. In an
        emergency, call <a href="tel:108">108</a>.
      </p>
    </article>
  );
}
