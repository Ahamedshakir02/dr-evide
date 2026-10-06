"use client";

import { FlaskConical } from "lucide-react";
import { useLang } from "@/lib/lang";

/**
 * "None of these people are real."
 *
 * Every seeded doctor is fictional (`is_sample`, "(SAMPLE)" in the name), and
 * /api/doctors has always returned `sample_data: true` to say so — the results
 * page just never rendered it. The only signal was a 24px pill per card, which
 * made the product's clearest legal exposure the quietest thing on the page.
 *
 * This is deliberately loud and page-level. It comes out when real,
 * NMC-verified, hand-curated data replaces the seed, and not before.
 */
export function SampleDataBanner() {
  const { t } = useLang();
  return (
    <div className="sample-banner" role="status">
      <FlaskConical size={18} aria-hidden="true" style={{ flex: "none" }} />
      <p>
        <strong>{t.sampleTitle}</strong> {t.sampleBody}
      </p>
    </div>
  );
}
