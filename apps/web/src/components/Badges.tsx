"use client";

import { ShieldCheck, TriangleAlert } from "lucide-react";
import { useLang } from "@/lib/lang";

/**
 * Credential status pill (Dr Evide.dc.html:200-203). Verified and unverified
 * must look categorically different, not just differently coloured — the
 * unverified state borrows the dashed treatment used on the profile.
 */
export function VerifiedPill({ verified, regNo }: { verified: boolean; regNo?: string | null }) {
  const { t } = useLang();

  if (!verified) {
    return (
      <span className="pill pill--unverified">
        <TriangleAlert size={13} aria-hidden="true" />
        {t.notVerified}
      </span>
    );
  }
  return (
    <span className="pill pill--verified">
      <ShieldCheck size={13} aria-hidden="true" />
      {t.nmcVerified}
      {regNo ? ` · ${regNo}` : ""}
    </span>
  );
}

/** Fictional-data marker. Required until real NMC-verified data replaces the seed. */
export function SamplePill() {
  const { t } = useLang();
  return <span className="pill pill--sample">{t.samplePill}</span>;
}
