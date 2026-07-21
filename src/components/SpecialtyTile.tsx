import type { SpecialtyInfo } from "@/lib/taxonomy";
import { SpecialtyIcon } from "./icons/SpecialtyIcons";

/** Department tile — Dr Evide.dc.html:95-101. */
export function SpecialtyTile({ slug, info }: { slug: string; info: SpecialtyInfo }) {
  return (
    <a className="sh-card sh-card--interactive specialty-tile" href={`/results?specialty=${slug}`}>
      <span className="icon-tile">
        <SpecialtyIcon name={info.icon} />
      </span>
      <span className="specialty-tile__name">{info.tileLabel}</span>
      <span className="specialty-tile__sub">{info.name}</span>
    </a>
  );
}
