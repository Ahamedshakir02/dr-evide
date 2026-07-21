import type { Metadata } from "next";
import { MapPin, Phone, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Emergency — call 108",
};

/**
 * Emergency interrupt — Dr Evide.dc.html:409-458.
 *
 * Reached only when routeSymptom() trips a red flag. It is an interrupt, not
 * a destination: it covers the app shell entirely (see .emergency-screen) so
 * there is no doctor list visible behind it to browse instead.
 *
 * `flag` is the matched red-flag keyword only. The typed symptom text never
 * reaches the URL — it is sensitive personal data under the DPDP Act 2023.
 */
export default function EmergencyPage({
  searchParams,
}: {
  searchParams: { flag?: string };
}) {
  const flag = (searchParams.flag ?? "").trim().slice(0, 80);

  return (
    <div className="emergency-screen">
      <div className="emergency-inner">
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <div className="emergency-disc">
            <TriangleAlert size={52} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="emergency-eyebrow">This could be an emergency</div>
          <h1 className="emergency-title">
            Don&apos;t wait —<br />
            get help now
          </h1>
          <p className="emergency-body">
            {flag ? (
              <>
                What you described — <strong>{flag}</strong> — needs urgent care, not an
                appointment.
              </>
            ) : (
              <>What you described needs urgent care, not an appointment.</>
            )}
          </p>
        </div>

        <div style={{ flex: 1, minHeight: 32 }} />

        <a href="tel:108" style={{ textDecoration: "none" }}>
          <div className="call-card">
            <span className="call-card__disc">
              <Phone size={30} color="#fff" aria-hidden="true" />
            </span>
            <div>
              <div className="call-card__num">Call 108</div>
              <div className="call-card__sub">Free ambulance · 24×7 Kerala</div>
            </div>
          </div>
        </a>

        <a
          className="emergency-outline"
          href="https://www.google.com/maps/search/?api=1&query=emergency+hospital"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={20} aria-hidden="true" />
          Nearest emergency room
        </a>

        <div style={{ textAlign: "center" }}>
          <a className="emergency-dismiss" href="/results?specialty=general">
            This isn&apos;t an emergency — continue anyway
          </a>
        </div>
      </div>
    </div>
  );
}
