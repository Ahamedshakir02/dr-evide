/**
 * Spot illustrations for the moments where the product has nothing to show.
 *
 * Empty results, a dead link and a failed request were text on an off-white
 * card — the three screens someone reaches when the thing they came to do has
 * not worked, drawn with less care than the screens where it has. That is
 * backwards: a dead end is exactly where a page has to look like someone
 * thought about the person reading it.
 *
 * Three rules, so these stay useful rather than decorative:
 *
 * 1. Each one draws its own situation. The empty-radius illustration is a
 *    real radius with real pins outside it, so the picture says the same
 *    thing as the button underneath — the doctors exist, they are further
 *    than the distance you set. A generic magnifying glass would have been
 *    faster and would have said nothing.
 * 2. They are `aria-hidden`. Every one sits directly above copy that carries
 *    the whole meaning, so announcing them would make a screen reader read
 *    the same thing twice. Nothing here is the only source of anything.
 * 3. Colour comes from the theme tokens, never from literals. These sit on
 *    --surface next to real components, so a change to the teal has to reach
 *    them too or they start looking like a screenshot of an older build.
 *
 * Geometry is plain shapes rather than the brand mark's path. A pin here is a
 * pin, not a small copy of the logo — the mark has exactly one definition
 * (assets/brand/mark.svg) and this file deliberately does not become a second.
 */

/** Shared frame. Illustrations are decorative, so none of them take a title. */
function Frame({
  children,
  width = 188,
  height = 140,
  className,
}: {
  children: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * A simple pin — circle plus taper, the same silhouette family as the mark
 * without being a copy of it. `muted` draws the ones that are out of reach.
 */
function Pin({ x, y, s = 1, muted = false }: { x: number; y: number; s?: number; muted?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-7.1 3.2A9 9 0 1 1 7.1 3.2L0 15Z"
        fill={muted ? "var(--text-faint)" : "var(--accent)"}
        opacity={muted ? 0.45 : 1}
      />
      <circle cx="0" cy="-3" r="3.2" fill="var(--surface)" />
    </g>
  );
}

/**
 * Nothing inside the chosen radius.
 *
 * The solid ring is where the search stopped; the dashed one is where the
 * button underneath would take it. Two doctors sit in the gap between them,
 * which is the actual state of the world in a rural launch area — not "no
 * doctors exist" but "none within the distance you said you could travel".
 */
export function EmptyRadiusArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      {/* The ground: a soft field so the rings read as map, not as diagram. */}
      <rect x="0" y="0" width="188" height="140" rx="16" fill="var(--flare-50)" />

      {/* Widened radius — where the recovery button reaches. */}
      <circle
        cx="72"
        cy="74"
        r="54"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        opacity="0.5"
      />
      {/* The radius actually searched. */}
      <circle cx="72" cy="74" r="30" fill="var(--flare-100)" stroke="var(--flare-200)" strokeWidth="2" />

      {/* You are here. */}
      <circle cx="72" cy="74" r="6" fill="var(--accent)" />
      <circle cx="72" cy="74" r="12" fill="var(--accent)" opacity="0.18" />

      {/* The doctors that exist, in the gap between the two rings. */}
      <Pin x={139} y={44} s={0.92} muted />
      <Pin x={122} y={112} s={0.8} muted />
    </Frame>
  );
}

/**
 * A link that goes nowhere.
 *
 * A torn map edge rather than a broken-robot cliché: the page is missing, the
 * rest of the product is not, and the departments listed underneath are the
 * way back on. The pin stands past the tear, which is where the reader is.
 */
export function NotFoundArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      {/* The map that still exists. */}
      <path
        d="M8 24h96v92H8a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8Z"
        fill="var(--flare-50)"
        stroke="var(--flare-200)"
        strokeWidth="2"
      />
      {/* Roads, so it reads as a map rather than a card. */}
      <path d="M0 62h104M62 24v92" stroke="var(--flare-200)" strokeWidth="2" opacity="0.85" />

      {/* The torn edge. */}
      <path
        d="M104 24l7 10-7 10 7 10-7 10 7 10-7 10 7 10-7 12"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeDasharray="4 4"
        opacity="0.6"
      />

      {/* Past the edge: nothing to stand on. */}
      <Pin x={146} y={62} s={1.15} />
      <ellipse cx="146" cy="84" rx="15" ry="4" fill="var(--text-faint)" opacity="0.22" />
    </Frame>
  );
}

/**
 * The request did not arrive.
 *
 * Signal arcs with the outer one broken, because that is the distinction the
 * copy next to it is making: the search never reached the doctor list, which
 * is emphatically not the same as the list being empty. Nobody should read a
 * dropped connection as "there are no doctors near you".
 */
export function ConnectionArt({ className }: { className?: string }) {
  return (
    <Frame className={className}>
      <rect x="0" y="0" width="188" height="140" rx="16" fill="var(--flare-50)" />

      {/* The phone, which is fine. */}
      <rect
        x="26"
        y="38"
        width="46"
        height="72"
        rx="8"
        fill="var(--surface)"
        stroke="var(--flare-200)"
        strokeWidth="2"
      />
      <rect x="36" y="50" width="26" height="4" rx="2" fill="var(--flare-200)" />
      <rect x="36" y="60" width="18" height="4" rx="2" fill="var(--flare-200)" />

      {/* Reaching out — the near arc connects, the far one does not. */}
      <path d="M88 60a26 26 0 0 1 0 28" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M106 46a48 48 0 0 1 0 56"
        stroke="var(--text-faint)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 9"
        opacity="0.55"
      />
      <path
        d="M126 32a70 70 0 0 1 0 84"
        stroke="var(--text-faint)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 12"
        opacity="0.3"
      />
    </Frame>
  );
}
