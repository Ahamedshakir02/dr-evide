"use client";

import { SPECIALTIES, specialtyText, type SpecialtySlug } from "@dr-evide/core";
import { useLang } from "@/lib/lang";
import { SpecialtyIcon } from "./icons/SpecialtyIcons";

/**
 * Department tile — Dr Evide Web.dc.html:105-108.
 *
 * Icon plus label, nothing else. The clinical sub-label ("Dermatology" under
 * "Skin & Hair") is the app's tile treatment (Dr Evide.dc.html:100), not the
 * website's.
 *
 * Takes a slug rather than the info object: the label now depends on the
 * reader's language, so resolving it belongs here rather than at every call
 * site.
 */
export function SpecialtyTile({ slug }: { slug: SpecialtySlug }) {
  const { lang } = useLang();

  return (
    <a className="sh-card sh-card--interactive specialty-tile" href={`/results?specialty=${slug}`}>
      <span className="icon-tile">
        <SpecialtyIcon name={SPECIALTIES[slug].icon} />
      </span>
      <span className="specialty-tile__name">{specialtyText(slug, lang).tileLabel}</span>
    </a>
  );
}
