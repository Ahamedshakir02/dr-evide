import type { SpecialtyIconKey } from "@dr-evide/core";

/**
 * Department glyphs. The path data is copied verbatim from the design
 * (dr-evide-doctor-discovery/project/Dr Evide.dc.html:93-137) — these are
 * bespoke shapes drawn for the mock, not stock Lucide icons, so they can't
 * come from lucide-react. Stroke weight and joins follow the DS: 1.75 /
 * round / no fill.
 */
const PATHS: Record<SpecialtyIconKey, React.ReactNode> = {
  skin: (
    <>
      <path d="M20 12a8 8 0 1 0-8 8" />
      <path d="M12 2v4" />
      <path d="M12 8a4 4 0 0 0-4 4" />
      <path d="M19 16v6" />
      <path d="M22 19h-6" />
    </>
  ),
  heart: (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  ),
  general: (
    <path d="M11 2a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h3a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-3a2 2 0 0 1 2-2h3a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-3a2 2 0 0 1-2-2V4a2 2 0 0 0-2-2h-2z" />
  ),
  teeth: (
    <path d="M9 4.5a3 3 0 0 0-3 3c0 1.5.5 3 .5 5.5 0 3-1 5.5-1 6.5a1.5 1.5 0 0 0 3 .2c.5-2 1-3.2 3.5-3.2s3 1.2 3.5 3.2a1.5 1.5 0 0 0 3-.2c0-1-1-3.5-1-6.5 0-2.5.5-4 .5-5.5a3 3 0 0 0-3-3c-1.5 0-2 .5-3 .5s-1.5-.5-3-.5Z" />
  ),
  ent: (
    <>
      <path d="M6 8.5a6 6 0 0 1 12 0c0 3-1 4-1 6a3 3 0 0 1-6 0c0-1-1-1-1-2" />
      <path d="M8 8.5a2 2 0 0 1 4 0" />
    </>
  ),
  children: (
    <>
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  /* Orthopedics has no tile in the mock — drawn to match the set's language. */
  bones: (
    <path d="M17 3a2.8 2.8 0 0 0-2.5 4L9 12.5 7 14.5A2.8 2.8 0 1 0 9.5 17l2-2L17 9.5A2.8 2.8 0 1 0 17 3Z" />
  ),
};

export function SpecialtyIcon({
  name,
  size = 24,
}: {
  name: SpecialtyIconKey;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/**
 * The "ranked, not advertised" glyph from the mock's results header
 * (Dr Evide.dc.html:185). No Lucide equivalent — three centred rules.
 */
export function RankedIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}
