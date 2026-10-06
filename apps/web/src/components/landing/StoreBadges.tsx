"use client";

import { useLang } from "@/lib/lang";
import { siteCopy } from "@/lib/site-copy";

/**
 * Store badges, honestly dead.
 *
 * Neither app is published, so these are `aria-disabled` spans rather than
 * links — a badge that looks live and goes nowhere costs more trust than the
 * two stores are worth on a page whose whole argument is that we do not
 * overstate things. The "Coming soon" line is inside the badge, not beside it,
 * so it survives being screenshotted or shared.
 *
 * The glyphs are drawn here rather than fetched. The Content-Security-Policy
 * only allows images from this origin (see next.config.mjs) — deliberately, so
 * an injected script cannot reach a host we did not choose — and a marketing
 * badge is not a good enough reason to widen it.
 */
export function StoreBadges() {
  const { lang } = useLang();
  const c = siteCopy(lang).download;

  return (
    <div className="store-badges">
      <StoreBadge
        glyph={<PlayGlyph />}
        lead={c.getItOn}
        name={c.playStore}
        note={c.comingSoon}
      />
      <StoreBadge
        glyph={<AppleGlyph />}
        lead={c.downloadOn}
        name={c.appStore}
        note={c.comingSoon}
      />
    </div>
  );
}

function StoreBadge({
  glyph,
  lead,
  name,
  note,
}: {
  glyph: React.ReactNode;
  lead: string;
  name: string;
  note: string;
}) {
  return (
    <span className="store-badge" aria-disabled="true">
      <span className="store-badge__glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="store-badge__text">
        <span className="store-badge__lead">{lead}</span>
        <span className="store-badge__name">{name}</span>
      </span>
      <span className="store-badge__note">{note}</span>
    </span>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M3.6 2.2a1 1 0 0 0-.6.92v17.76a1 1 0 0 0 .6.92l9.72-9.8L3.6 2.2Zm11.06 8.02L5.9 1.4l10.55 6.1-1.79 2.72Zm0 3.56 1.8 2.72-10.56 6.1 8.76-8.82Zm1.9-1.06 3.13-1.8a1.1 1.1 0 0 0 0-1.92l-3.13-1.8-1.92 2.76 1.92 2.76Z" />
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}
