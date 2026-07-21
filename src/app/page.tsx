"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, Pencil, Phone, ShieldCheck, TriangleAlert } from "lucide-react";
import { SPECIALTIES } from "@/lib/taxonomy";
import { SCORE_WEIGHTS } from "@/lib/ranking";
import { SpecialtyTile } from "@/components/SpecialtyTile";
import type { RoutingResult } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routing, setRouting] = useState<RoutingResult | null>(null);

  async function handleRoute(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRouting(null);
    setLoading(true);
    try {
      const res = await fetch("/api/route-symptom", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const result = data as RoutingResult;
      setRouting(result);

      // Red flags render inline below the form (see the alert further down).
      // The website has no emergency screen — that full-bleed interrupt is the
      // app's (Dr Evide.dc.html screen 04) and lives in mobile/.
      if (result.emergency) return;

      if (result.specialties.length === 1) {
        goToResults(result.specialties[0].slug, result.matched_conditions);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function goToResults(slug: string, conditions: string[]) {
    const params = new URLSearchParams({ specialty: slug });
    if (conditions.length) params.set("conditions", conditions.join(","));
    router.push(`/results?${params.toString()}`);
  }

  return (
    <>
      <div className="hero-grid">
        {/* ── Ask ───────────────────────────────────────────────── */}
        <div>
          <div className="sh-eyebrow" style={{ marginBottom: 14 }}>
            Describe it in your own words
          </div>
          <h1 className="hero-title">
            Find the right doctor — not the one who <em>paid the most.</em>
          </h1>
          <p className="hero-sub">
            Tell us what&apos;s bothering you. We route you to the right department, then rank
            nearby doctors by a transparent TrustScore built from verified credentials and real
            reviews.
          </p>

          <form onSubmit={handleRoute}>
            <textarea
              className="sh-textarea"
              rows={3}
              style={{ fontSize: 17, lineHeight: 1.5, padding: 16, borderRadius: 16 }}
              placeholder="e.g. My hair is falling a lot lately…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              aria-label="Describe your symptoms"
            />

            <div className="hint-row" style={{ margin: "10px 2px 16px" }}>
              <Pencil size={15} aria-hidden="true" />
              <span>Malayalam &amp; English both work</span>
            </div>

            <button
              className="sh-btn sh-btn--primary sh-btn--lg sh-btn--block"
              style={{ height: 58, fontSize: 18, borderRadius: 16 }}
              disabled={loading || text.trim().length < 3}
            >
              {loading ? "Finding…" : "Find the right doctor"}
              {!loading && <ArrowRight size={20} aria-hidden="true" />}
            </button>

            {error && (
              <p className="error-text" role="alert" style={{ marginTop: 10 }}>
                {error}
              </p>
            )}
          </form>

          {/* Red flag. Inline, in the website's own language — the app owns the
              full-screen interrupt. Kept prominent and actionable: this is the
              one thing on the page that must not be missed. */}
          {routing?.emergency && (
            <div className="emergency-alert" role="alert">
              <TriangleAlert size={22} aria-hidden="true" style={{ flex: "none" }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", marginBottom: 4 }}>
                  This could be an emergency
                </strong>
                <p style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
                  {routing.emergency_message}
                </p>
                <a className="sh-btn sh-btn--danger" href="tel:108">
                  <Phone size={18} aria-hidden="true" />
                  Call 108 — free ambulance
                </a>
              </div>
            </div>
          )}

          {/* Ambiguous routing — let the person choose. */}
          {routing && routing.specialties.length > 1 && (
            <div className="sh-card" style={{ marginTop: 20, padding: 20 }}>
              <div className="sh-eyebrow" style={{ marginBottom: 12 }}>
                This could be one of two departments
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {routing.specialties.map((s) => (
                  <div key={s.slug}>
                    <button
                      className="sh-btn sh-btn--secondary"
                      onClick={() => goToResults(s.slug, routing.matched_conditions)}
                    >
                      {SPECIALTIES[s.slug].name}
                    </button>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 13,
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {s.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── How TrustScore works ──────────────────────────────────
            The website's integrity statement (Dr Evide Web.dc.html:78-96).
            Shown at every width — the app states the same thing with its
            trust footer panel, which stays in the app. */}
        <div className="sh-card" style={{ padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: "color-mix(in srgb, var(--accent-2) 14%, transparent)",
                color: "var(--accent-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <span
              style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19 }}
            >
              How TrustScore works
            </span>
          </div>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              margin: "0 0 18px",
              lineHeight: 1.55,
            }}
          >
            A 0–100 score built from five signals we can actually verify — and nothing else.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SCORE_WEIGHTS.map(({ key, label, max }) => (
              <div key={key} className="weight-row">
                <span className="weight-row__pct sh-mono">{max}%</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div
            className="pledge"
            style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}
          >
            <CircleCheck size={15} aria-hidden="true" />
            No paid placement. Ever.
          </div>
        </div>
      </div>

      {/* ── Departments ─────────────────────────────────────────── */}
      <div className="rule-row" style={{ margin: "40px 0 18px" }}>
        <span className="sh-eyebrow" style={{ whiteSpace: "nowrap" }}>
          Or pick a department
        </span>
      </div>

      <div className="specialty-grid">
        {Object.entries(SPECIALTIES).map(([slug, info]) => (
          <SpecialtyTile key={slug} slug={slug} info={info} />
        ))}
      </div>

    </>
  );
}
