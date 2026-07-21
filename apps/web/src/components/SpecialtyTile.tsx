import type { SpecialtyInfo } from "@dr-evide/core";
import { SpecialtyIcon } from "./icons/SpecialtyIcons";

/**
 * Department tile — Dr Evide Web.dc.html:105-108.
 *
 * Icon plus label, nothing else. The clinical sub-label ("Dermatology" under
 * "Skin & Hair") is the app's tile treatment (Dr Evide.dc.html:100), not the
 * website's.
 */
export function SpecialtyTile({ slug, info }: { slug: string; info: SpecialtyInfo }) {
  return (
    <a className="sh-card sh-card--interactive specialty-tile" href={`/results?specialty=${slug}`}>
      <span className="icon-tile">
        <SpecialtyIcon name={info.icon} />
      </span>
      <span className="specialty-tile__name">{info.tileLabel}</span>
    </a>
  );
}
