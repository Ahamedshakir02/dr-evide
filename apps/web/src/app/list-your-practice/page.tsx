import type { Metadata } from "next";
import { ListingForm } from "@/components/listing/ListingForm";

export const metadata: Metadata = {
  title: "List your practice",
  description:
    "Doctors in and around Edappal can ask to be listed on Dr Evide. Free, with your consent, and never ranked by payment.",
  alternates: { canonical: "/list-your-practice" },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

/**
 * A doctor asks to be listed.
 *
 * The page says what happens before the form asks for anything: who reads the
 * application, what becomes public, what stays private, and that a listing is
 * never for sale. The form posts to /api/listing-applications; nothing is
 * public until an admin has reviewed it in /admin.
 *
 * English only, deliberately: the doctors filling this in work in English,
 * and the consent wording is the part of the site where a translation nobody
 * has reviewed would do the most harm.
 */
export default function ListYourPractice() {
  return (
    <div className="lyp">
      <header className="lyp__intro">
        <p className="sh-eyebrow">For doctors</p>
        <h1 className="results-h1">List your practice</h1>
        <p className="lyp__lede">
          Dr Evide helps people around Edappal find the right doctor for what is
          wrong with them. Listing is free. It is ranked on verified
          credentials and nothing else, and no one can pay to move up.
        </p>
        <ul className="lyp__facts">
          <li>
            <strong>A person reviews every application.</strong> We check your
            registration number against the public medical register before we
            mark it verified, and we record who checked and when.
          </li>
          <li>
            <strong>What becomes public:</strong> your name, department,
            qualifications, registration number, clinic, address, phone, fee
            and timings.
          </li>
          <li>
            <strong>What stays private:</strong> the email address you give
            here. We use it only to tell you about your listing.
          </li>
          <li>
            <strong>You can change your mind.</strong> Ask us to correct or
            remove your listing at any time and we will.{" "}
            {CONTACT_EMAIL && (
              <a href={`mailto:${CONTACT_EMAIL}?subject=Dr%20Evide%20listing`}>{CONTACT_EMAIL}</a>
            )}
          </li>
        </ul>
      </header>

      <ListingForm />
    </div>
  );
}
