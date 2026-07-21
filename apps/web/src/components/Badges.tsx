import { ShieldCheck, TriangleAlert } from "lucide-react";

/**
 * Credential status pill (Dr Evide.dc.html:200-203). Verified and unverified
 * must look categorically different, not just differently coloured — the
 * unverified state borrows the dashed treatment used on the profile.
 */
export function VerifiedPill({ verified, regNo }: { verified: boolean; regNo?: string | null }) {
  if (!verified) {
    return (
      <span className="pill pill--unverified">
        <TriangleAlert size={13} aria-hidden="true" />
        Not yet verified
      </span>
    );
  }
  return (
    <span className="pill pill--verified">
      <ShieldCheck size={13} aria-hidden="true" />
      NMC verified{regNo ? ` · ${regNo}` : ""}
    </span>
  );
}

/** Fictional-data marker. Required until real NMC-verified data replaces the seed. */
export function SamplePill() {
  return <span className="pill pill--sample">Sample data</span>;
}
