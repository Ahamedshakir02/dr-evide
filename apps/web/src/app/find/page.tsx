"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleCheck, Pencil, Phone, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  SCORE_WEIGHTS,
  SPECIALTIES,
  WEB_RADIUS_DEFAULT_KM,
  specialtyText,
} from "@dr-evide/core";
import { SpecialtyTile } from "@/components/SpecialtyTile";
import { useLang } from "@/lib/lang";
import { defaultSearchContext, saveSearchContext } from "@/lib/search-context";
import type { RoutingResult, SpecialtySlug } from "@dr-evide/core";

/**
 * The search app — symptom box, routing, departments.
 *
 * This used to be `/`. It moved here when the website took on its second job:
 * `/` is now the product's public face (what Dr Evide is, how ranking works,
 * where to get the app) and `/find` is the product itself. Two different
 * readers, two different pages. Someone who arrives knowing what they want
 * still gets here in one click, from the top bar on every page.
 *
 * Everything downstream — /results, /doctor/[id] — is unchanged.
 */
export default function Find() {
  const router = useRouter();
  const { lang, t } = useLang();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routing, setRouting] = useState<RoutingResult | null>(null);

  const emergencyRef = useRef<HTMLDivElement>(null);

  /**
   * Bring the red flag to the person.
   *
   * On a phone the alert renders below a three-row textarea, a hint row and a
   * 58px button, so the most important message in the product could land off
   * the bottom of the screen with nothing to say it was there. role="alert"
   * covers a screen reader; this covers everyone else. Focus moves too, so the
   * next Tab lands on "Call 108" rather than back in the textarea.
   */
  useEffect(() => {
    if (!routing?.emergency) return;
    const el = emergencyRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.focus({ preventScroll: true });
  }, [routing]);

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
      // Name the escape hatch. "Something went wrong" leaves someone unwell
      // with nothing to do; the department tiles below still work offline of
      // the routing service.
      setError(
        "We couldn't reach the routing service. Check your connection and try again — or pick a department below."
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * The conditions go into sessionStorage, never the URL.
   *
   * They are keywords lifted from a health complaint — sensitive personal data
   * under the DPDP Act 2023 — and a query string would put them in browser
   * history on a shared phone and in every access log in front of the app. See
   * lib/search-context.ts for the full reasoning and what it costs.
   */
  function goToResults(slug: SpecialtySlug, conditions: string[]) {
    saveSearchContext({
      ...defaultSearchContext(slug),
      conditions,
      radiusKm: WEB_RADIUS_DEFAULT_KM,
    });
    router.push(`/results?specialty=${slug}`);
  }

  return (
    <>
      <div className="hero-grid">
        {/* ── Ask ───────────────────────────────────────────────── */}
        <div>
          <div className="sh-eyebrow" style={{ marginBottom: 14 }}>
            {t.homeEyebrow}
          </div>
          <h1 className="hero-title">
            {t.homeTitleLead} <em>{t.homeTitleEmphasis}</em>
          </h1>
          <p className="hero-sub">{t.homeSub}</p>

          <form onSubmit={handleRoute}>
            {/* A real label, not a placeholder. A placeholder disappears the
                moment someone starts typing — on the product's single most
                important control, exactly when they may still need it. */}
            <label htmlFor="symptom" className="field-label">
              {t.symptomLabel}
            </label>
            <textarea
              id="symptom"
              className="sh-textarea"
              rows={3}
              style={{ fontSize: 17, lineHeight: 1.5, padding: 16, borderRadius: 16 }}
              placeholder={t.symptomPlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              aria-describedby="symptom-hint"
            />

            <div className="hint-row" id="symptom-hint" style={{ margin: "10px 2px 16px" }}>
              <Pencil size={15} aria-hidden="true" />
              <span>{t.bilingualHint}</span>
            </div>

            <button
              className="sh-btn sh-btn--primary sh-btn--lg sh-btn--block"
              style={{ height: 58, fontSize: 18, borderRadius: 16 }}
              disabled={loading || text.trim().length < 3}
            >
              {loading ? t.finding : t.findDoctor}
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
            <div className="emergency-alert" role="alert" tabIndex={-1} ref={emergencyRef}>
              <TriangleAlert size={22} aria-hidden="true" style={{ flex: "none" }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: "block", marginBottom: 4 }}>
                  {t.couldBeEmergency}
                </strong>
                {/* The one string in the product where the reader's language is
                    a safety property rather than a courtesy. */}
                <p style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
                  {(lang === "ml" ? routing.emergency_message_ml : null) ??
                    routing.emergency_message}
                </p>
                {/* Rendered from the helplines the match carried, so a
                    mental-health red flag offers Tele-MANAS first rather than
                    an ambulance. Falls back to 108 if the field is absent. */}
                <div className="emergency-alert__actions">
                  {(
                    routing.emergency_helplines ?? [
                      { label: "108 — free ambulance", number: "108" },
                    ]
                  ).map((h) => (
                    <a key={h.number} className="sh-btn sh-btn--danger" href={`tel:${h.number}`}>
                      <Phone size={18} aria-hidden="true" />
                      {t.call} {h.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ambiguous routing — let the person choose. */}
          {routing && routing.specialties.length > 1 && (
            <div className="sh-card" style={{ marginTop: 20, padding: 20 }}>
              <div className="sh-eyebrow" style={{ marginBottom: 12 }}>
                {t.ambiguousHeading}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {routing.specialties.map((s) => (
                  <div key={s.slug}>
                    <button
                      className="sh-btn sh-btn--secondary"
                      onClick={() => goToResults(s.slug, routing.matched_conditions)}
                    >
                      {specialtyText(s.slug, lang).name}
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
              {t.howTrustScoreWorks}
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
            {t.trustScoreBlurb}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* The weights themselves stay in @dr-evide/core — only their
                labels are translated, so the numbers can never drift apart
                from the ones scoring actually applies. */}
            {SCORE_WEIGHTS.map(({ key, max }) => (
              <div key={key} className="weight-row">
                <span className="weight-row__pct sh-mono">{max}%</span>
                <span>{t.weightLabels[key]}</span>
              </div>
            ))}
          </div>
          <div
            className="pledge"
            style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}
          >
            <CircleCheck size={15} aria-hidden="true" />
            {t.noPaidPlacement}
          </div>
        </div>
      </div>

      {/* ── Departments ─────────────────────────────────────────── */}
      {/* No `white-space: nowrap` on the label. It kept the English "or pick a
          department" on one line between the two rules, and in Malayalam it
          made a decorative divider the widest thing on the page — 385px of
          hard minimum, which scrolled the whole document sideways on every
          phone under 400px. The rules either side are flexible and shrink
          first, so the line still holds together wherever it fits. */}
      <div className="rule-row" style={{ margin: "40px 0 18px" }}>
        <span className="sh-eyebrow">{t.orPickDepartment}</span>
      </div>

      <div className="specialty-grid">
        {(Object.keys(SPECIALTIES) as SpecialtySlug[]).map((slug) => (
          <SpecialtyTile key={slug} slug={slug} />
        ))}
      </div>
    </>
  );
}
