import { SCORE_WEIGHTS } from "@/lib/ranking";
import type { ScoreBreakdown as Breakdown } from "@/lib/types";

/**
 * "Why this doctor ranks here" (Dr Evide.dc.html:342-359).
 *
 * The mock shows four signals — credentials, reviews, experience, and
 * "patient-reported outcomes". No outcome data exists at doctor level in
 * India, so this renders the five signals ranking.ts actually computes.
 * Same visual treatment, honest labels.
 */
export function ScoreBreakdown({ breakdown }: { breakdown: Breakdown }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {SCORE_WEIGHTS.map(({ key, label, max }) => {
        const value = breakdown[key];
        return (
          <div key={key}>
            <div className="score-row__head">
              <span style={{ color: "var(--text)", fontWeight: 500 }}>{label}</span>
              <span className="sh-mono" style={{ color: "var(--text-muted)" }}>
                {value} / {max}
              </span>
            </div>
            <div className="score-row__track">
              <div
                className="score-row__fill"
                style={{ width: `${Math.round((value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
