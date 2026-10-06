"use client";

import { ArrowRight, CircleCheck, Phone, TriangleAlert } from "lucide-react";
import type { ScreenId } from "@/lib/site-copy";

/**
 * The app's four screens, drawn rather than screenshotted.
 *
 * A screenshot would be a 200KB PNG per screen that goes stale the first time a
 * padding value moves, on a page aimed at people on a mid-range Android and a
 * patchy connection. These are a few hundred bytes of markup that inherit the
 * real design tokens, so a change to the accent colour or the type scale shows
 * up here too.
 *
 * They are illustrations, not the product: everything inside the frame is
 * `aria-hidden`, and the caption beside each one is what a screen reader
 * actually gets. No claim is made here that a screen reader could not verify by
 * opening /find.
 */
export function PhoneMockup({ screen }: { screen: ScreenId }) {
  return (
    <div className={`phone phone--${screen}`} aria-hidden="true">
      <div className="phone__notch" />
      <div className="phone__screen">{SCREENS[screen]()}</div>
    </div>
  );
}

const SCREENS: Record<ScreenId, () => React.ReactNode> = {
  ask: () => (
    <>
      <div className="mock-bar">
        <span className="mock-bar__mark">ഡോക്ടർ എവിടെ?</span>
      </div>
      <div className="mock-body">
        <div className="mock-label">What&apos;s bothering you?</div>
        <div className="mock-textarea">My hair is falling a lot lately…</div>
        <div className="mock-hint">Malayalam &amp; English both work</div>
        <div className="mock-cta">
          Find the right doctor <ArrowRight size={13} />
        </div>
        <div className="mock-rule">
          <span>Or pick a department</span>
        </div>
        <div className="mock-tiles">
          {["Skin & Hair", "Bones", "Heart", "Children"].map((label) => (
            <div className="mock-tile" key={label}>
              <span className="mock-tile__icon" />
              <span>{label}</span>
            </div>
          ))}
        </div>
        {/* The app's trust footer, pinned to the bottom of the screen —
            which is where it sits in the app, and it fills what was
            otherwise a third of an empty frame in the hero. */}
        <div className="mock-pledge">
          <CircleCheck size={10} /> No paid placement. Ever.
        </div>
      </div>
    </>
  ),

  results: () => (
    <>
      <div className="mock-bar">
        <span className="mock-bar__title">Dermatology near you</span>
      </div>
      <div className="mock-body">
        <div className="mock-eyebrow">Ranked by TrustScore — not by ads</div>
        {[
          { score: 87, band: "Strong", w: 92 },
          { score: 74, band: "Good", w: 78 },
          { score: 61, band: "Fair", w: 64 },
        ].map((d) => (
          <div className="mock-card" key={d.score}>
            <span className="mock-ring">{d.score}</span>
            <span className="mock-card__body">
              <span className="mock-line" style={{ width: `${d.w}%` }} />
              <span className="mock-line mock-line--sm" style={{ width: "58%" }} />
              <span className="mock-band">{d.band}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  ),

  profile: () => (
    <>
      <div className="mock-bar">
        <span className="mock-bar__title">Why this doctor ranks here</span>
      </div>
      <div className="mock-body">
        <div className="mock-score">
          <span className="mock-score__num">87</span>
          <span className="mock-score__cap">TrustScore</span>
        </div>
        {[
          { label: "Credentials", pct: 93 },
          { label: "Reviews", pct: 76 },
          { label: "Relevance", pct: 88 },
          { label: "Experience", pct: 60 },
          { label: "Access", pct: 70 },
        ].map((r) => (
          <div className="mock-score-row" key={r.label}>
            <span className="mock-score-row__label">{r.label}</span>
            <span className="mock-score-row__track">
              <span className="mock-score-row__fill" style={{ width: `${r.pct}%` }} />
            </span>
          </div>
        ))}
        <div className="mock-verified">NMC verified</div>
      </div>
    </>
  ),

  emergency: () => (
    <div className="mock-emergency">
      <TriangleAlert size={34} />
      <span className="mock-emergency__title">This could be an emergency</span>
      <span className="mock-emergency__body">
        Chest pain with sweating needs urgent care. Do not wait for an appointment.
      </span>
      <span className="mock-emergency__cta">
        <Phone size={14} /> Call 108 — free ambulance
      </span>
    </div>
  ),
};
