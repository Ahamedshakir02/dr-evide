import { Check, TriangleAlert } from "lucide-react";

/**
 * A single credential (Dr Evide.dc.html:372-390).
 *
 * The dashed border on the unverified variant is the point of this component:
 * a self-reported qualification must not be able to pass for a checked one.
 */
export function CredentialRow({
  title,
  verified,
  note,
}: {
  title: string;
  verified: boolean;
  note?: string;
}) {
  return (
    <div className={`cred-row${verified ? "" : " cred-row--unverified"}`}>
      <span className="cred-row__icon">
        {verified ? (
          <Check size={18} strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <TriangleAlert size={18} aria-hidden="true" />
        )}
      </span>
      <div style={{ flex: 1 }}>
        <div className="cred-row__title">{title}</div>
        <div className="cred-row__note">
          {note ?? (verified ? "Verified with NMC registry" : "Self-reported · not yet verified")}
        </div>
      </div>
    </div>
  );
}
