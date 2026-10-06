"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, RotateCw, TriangleAlert } from "lucide-react";
import { DoctorCard } from "@/components/DoctorCard";
import { DoctorCardSkeleton } from "@/components/DoctorCardSkeleton";
import { SampleDataBanner } from "@/components/SampleDataBanner";
import { RADIUS_MAX, RadiusControl } from "@/components/RadiusControl";
import { RankedIcon } from "@/components/icons/SpecialtyIcons";
import { ConnectionArt, EmptyRadiusArt } from "@/components/illustrations/Illustrations";
import { useMediaQuery } from "@/lib/hooks";
import { useLang } from "@/lib/lang";
import {
  defaultSearchContext,
  saveSearchContext,
  searchContextFor,
  type SearchContext,
} from "@/lib/search-context";
import {
  isSpecialtySlug,
  specialtyText,
  type RankedDoctor,
  type SpecialtySlug,
} from "@dr-evide/core";

/* Leaflet touches window at import time, so it can never render on the server. */
const ResultsMap = dynamic(() => import("@/components/ResultsMap"), {
  ssr: false,
  loading: () => <div className="map-panel" />,
});

interface SearchResponse {
  specialty: { slug: string; name: string; description: string };
  radius_km: number;
  count: number;
  /** The year the scores were computed against. See as_of_year on /api/doctors. */
  as_of_year: number;
  score_version: string;
  sample_data: boolean;
  doctors: RankedDoctor[];
}

/**
 * Why the search failed.
 *
 * A dropped connection and an empty result set are completely different answers
 * to "where can I see a doctor", and v2 rendered them identically: the fetch had
 * a `finally` but no `catch`, so a failed request left `data` null and the page
 * said "No doctors within 5 km". Telling someone unwell that nobody is nearby
 * when the request never landed is the worst failure this product can produce,
 * and on rural mobile data it was the common path, not the edge case.
 */
type LoadError = "offline" | "server";

function ResultsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { lang, t } = useLang();

  const raw = sp.get("specialty");
  const specialty: SpecialtySlug = isSpecialtySlug(raw) ? raw : "general";

  /**
   * The rest of the search lives in sessionStorage, not the URL — condition
   * keywords are derived from a health complaint and have no business in
   * browser history or an access log. See lib/search-context.ts.
   *
   * Seeded with defaults rather than read inline: sessionStorage does not exist
   * during SSR, and reading it in render would make server and client markup
   * disagree. The effect below settles it after mount.
   */
  const [ctx, setCtx] = useState<SearchContext>(() => defaultSearchContext(specialty));
  const [ctxReady, setCtxReady] = useState(false);

  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const [loading, setLoading] = useState(true);

  const isDesktop = useMediaQuery("(min-width: 900px)");
  const conditionsKey = ctx.conditions.join(",");

  useEffect(() => {
    setCtx(searchContextFor(specialty));
    setCtxReady(true);
  }, [specialty]);

  useEffect(() => {
    if (!ctxReady || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCtx((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
      () => {}, // denied or timed out → we keep the Edappal centre
      // Without a timeout this can hang indefinitely on a device with no fix,
      // leaving the list silently pinned to the fallback centre.
      { timeout: 8000, maximumAge: 300_000 }
    );
  }, [ctxReady]);

  /** Persist, so the profile page reproduces this exact search and score. */
  useEffect(() => {
    if (ctxReady) saveSearchContext(ctx);
  }, [ctx, ctxReady]);

  /**
   * Only the newest request may write state. The radius slider and the
   * geolocation callback both retrigger this, so responses arrive out of order.
   */
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      specialty,
      radius: String(ctx.radiusKm),
      lat: String(ctx.lat),
      lng: String(ctx.lng),
    });
    if (conditionsKey) params.set("conditions", conditionsKey);

    try {
      const res = await fetch(`/api/doctors?${params.toString()}`);
      if (id !== requestId.current) return;

      if (!res.ok) {
        setError("server");
        return;
      }

      const json = (await res.json()) as SearchResponse;
      if (id !== requestId.current) return;
      setData(json);
    } catch {
      // Network failure, DNS, aborted request, unparseable body. From here they
      // are one thing: we do not know what is nearby, and we must not pretend
      // the answer is "nothing".
      if (id === requestId.current) setError("offline");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [specialty, ctx.radiusKm, ctx.lat, ctx.lng, conditionsKey]);

  useEffect(() => {
    if (ctxReady) void load();
  }, [load, ctxReady]);

  // Stale results must not survive a failure or a specialty change — the old
  // list under a new heading is worse than no list.
  const fresh = !error && data?.specialty?.slug === specialty ? data : null;
  const doctors = fresh?.doctors ?? [];
  // Translated from the slug rather than taken from the response: the API
  // returns one canonical English name, and only the reader picks a language.
  const specialtyName = specialtyText(specialty, lang).name;

  const setRadius = (km: number) => setCtx((prev) => ({ ...prev, radiusKm: km }));

  /** Carries nothing sensitive — the profile reads the same sessionStorage. */
  const profileHref = (id: number) => `/doctor/${id}?specialty=${specialty}`;

  return (
    <>
      {/* ── Page header — Dr Evide Web.dc.html:136-158 ──────────────
          One header at every width; it reflows rather than switching to the
          app's sticky icon-button header (Dr Evide.dc.html:160-188). */}
      <div>
        <button className="link-back" onClick={() => router.push("/find")}>
          <ChevronLeft size={16} aria-hidden="true" /> {t.backToSearch}
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            margin: "16px 0 22px",
            flexWrap: "wrap",
          }}
        >
          <div>
            {ctx.conditions.length > 0 && (
              <div className="sh-eyebrow" style={{ marginBottom: 8 }}>
                {t.matchedTo(ctx.conditions.join(", "))}
              </div>
            )}
            <h1 className="results-h1">{t.nearYou(specialtyName)}</h1>
          </div>
          <div className="pledge">
            <RankedIcon />
            {t.rankedByTrust}
          </div>
        </div>

        {fresh?.sample_data && <SampleDataBanner />}

        <div style={{ marginBottom: 20 }}>
          <RadiusControl
            radius={ctx.radiusKm}
            count={doctors.length}
            loading={loading}
            onChange={setRadius}
          />
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      <div className="results-split" style={{ marginTop: 16 }}>
        <div>
          {loading && <DoctorCardSkeleton />}

          {!loading && error && <LoadFailure kind={error} onRetry={() => void load()} />}

          {!loading && !error && doctors.length === 0 && (
            <EmptyResults
              specialtyName={specialtyName}
              radius={ctx.radiusKm}
              onWiden={() => setRadius(RADIUS_MAX)}
            />
          )}

          {!loading && !error && doctors.length > 0 && (
            <div className="results-list stagger">
              {doctors.map((d) => (
                <DoctorCard
                  key={d.id}
                  doctor={d}
                  href={profileHref(d.id)}
                  asOfYear={fresh?.as_of_year ?? new Date().getFullYear()}
                  hasMatchedConditions={ctx.conditions.length > 0}
                />
              ))}
            </div>
          )}
        </div>

        {isDesktop && doctors.length > 0 && (
          <ResultsMap doctors={doctors} center={{ lat: ctx.lat, lng: ctx.lng }} />
        )}
      </div>
    </>
  );
}

/**
 * A failed search, said plainly and with a way out.
 *
 * The distinction matters to the person holding the phone: "you're offline" is
 * something they can act on, "we're broken" is not, and neither of them means
 * "there are no doctors near you".
 */
function LoadFailure({ kind, onRetry }: { kind: LoadError; onRetry: () => void }) {
  const { t } = useLang();
  /**
   * Offline gets the illustration and a column; a server fault keeps the
   * compact alert. They are different beats. "Your connection dropped" is a
   * state of the world the reader can act on and the arcs say so at a glance;
   * "we broke" is our problem, and dressing it up would be the wrong tone on
   * a failure we caused.
   */
  const offline = kind === "offline";
  return (
    <div
      className={`sh-card load-failure${offline ? " load-failure--offline" : ""}`}
      role="alert"
    >
      {offline ? (
        <ConnectionArt className="load-failure__art" />
      ) : (
        <TriangleAlert size={22} aria-hidden="true" style={{ flex: "none" }} />
      )}
      <div style={{ flex: 1 }}>
        <strong style={{ display: "block", marginBottom: 4 }}>
          {kind === "offline" ? t.offlineTitle : t.serverTitle}
        </strong>
        <p style={{ margin: "0 0 14px", color: "var(--text-muted)", lineHeight: 1.5 }}>
          {kind === "offline" ? t.offlineBody : t.serverBody}
        </p>
        <button className="sh-btn sh-btn--secondary" onClick={onRetry}>
          <RotateCw size={16} aria-hidden="true" />
          {t.tryAgain}
        </button>
      </div>
    </div>
  );
}

/**
 * A genuinely empty result, with the recovery attached.
 *
 * The old copy said "try widening the radius" and then left the person to find
 * the slider and guess how far to drag it. If the advice is worth giving, it is
 * worth being a button.
 */
function EmptyResults({
  specialtyName,
  radius,
  onWiden,
}: {
  specialtyName: string;
  radius: number;
  onWiden: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="empty-state">
      {/* The rings are the radius that was searched and the one the button
          below widens to, with pins in the gap — the same sentence as the
          copy, so the picture cannot drift from the recovery. */}
      <EmptyRadiusArt className="empty-state__art" />
      <p style={{ margin: "0 0 4px", color: "var(--text)", fontWeight: 600 }}>
        {t.noneWithin(specialtyName, radius)}
      </p>
      <p style={{ margin: "0 0 16px" }}>{t.ruralNote}</p>
      {radius < RADIUS_MAX && (
        <button className="sh-btn sh-btn--secondary" onClick={onWiden}>
          {t.searchFullRadius(RADIUS_MAX)}
        </button>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<DoctorCardSkeleton />}>
      <ResultsInner />
    </Suspense>
  );
}
