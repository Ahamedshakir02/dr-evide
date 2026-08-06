import { SPECIALTIES, type SpecialtySlug } from "@dr-evide/core";
import { SpecialtyTile } from "@/components/SpecialtyTile";

/**
 * 404. Reached by an unknown URL, and by `notFound()` on a doctor id that does
 * not exist — which previously rendered "Doctor not found." with a 200 status,
 * so crawlers and uptime checks both read it as a working page.
 *
 * A dead end is a bad answer for someone trying to see a doctor, so this offers
 * the departments rather than an apology.
 */
export default function NotFound() {
  return (
    <>
      <div style={{ padding: "48px 0 8px", textAlign: "center" }}>
        <h1 className="results-h1">We couldn&apos;t find that page</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
          The link may be old, or that doctor may no longer be listed.
        </p>
      </div>

      <div className="rule-row" style={{ margin: "28px 0 18px" }}>
        <span className="sh-eyebrow" style={{ whiteSpace: "nowrap" }}>
          Start from a department
        </span>
      </div>

      <div className="specialty-grid">
        {(Object.keys(SPECIALTIES) as SpecialtySlug[]).map((slug) => (
          <SpecialtyTile key={slug} slug={slug} />
        ))}
      </div>
    </>
  );
}
