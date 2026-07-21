"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { DoctorCard } from "@/components/DoctorCard";
import {
  RADIUS_DEFAULT,
  RADIUS_MAX,
  RadiusControl,
} from "@/components/RadiusControl";
import { RankedIcon } from "@/components/icons/SpecialtyIcons";
import { useMediaQuery } from "@/lib/hooks";
import { DEFAULT_LOCATION, type RankedDoctor } from "@dr-evide/core";

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
  error?: string;
}

function ResultsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const specialty = sp.get("specialty") ?? "general";
  const conditions = sp.get("conditions") ?? "";

  const [radius, setRadius] = useState(RADIUS_DEFAULT);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const isDesktop = useMediaQuery("(min-width: 900px)");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, // denied or timed out → server falls back to the Edappal centre
      // Without a timeout this can hang indefinitely on a device with no fix,
      // leaving the list silently pinned to the fallback centre.
      { timeout: 8000, maximumAge: 300_000 }
    );
  }, []);

  useEffect(() => {
    // Radius drags and the geolocation callback both retrigger this, so
    // responses can land out of order. Ignore anything but the latest.
    let current = true;
    setLoading(true);

    const params = new URLSearchParams({ specialty, radius: String(radius) });
    if (conditions) params.set("conditions", conditions);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }

    (async () => {
      try {
        const res = await fetch(`/api/doctors?${params.toString()}`);
        const json = await res.json();
        if (current) setData(json);
      } finally {
        if (current) setLoading(false);
      }
    })();

    return () => {
      current = false;
    };
  }, [specialty, radius, conditions, coords]);

  const center = coords ?? DEFAULT_LOCATION;
  const doctors = data?.doctors ?? [];
  const specialtyName = data?.specialty?.name ?? "Doctors";

  /** Carries the search context so the profile reproduces the same TrustScore. */
  function profileHref(id: number) {
    const params = new URLSearchParams({ specialty, radius: String(radius) });
    if (conditions) params.set("conditions", conditions);
    params.set("lat", String(center.lat));
    params.set("lng", String(center.lng));
    return `/doctor/${id}?${params.toString()}`;
  }

  const pledge = (
    <div className="pledge">
      <RankedIcon />
      Ranked by TrustScore — not by ads
    </div>
  );

  return (
    <>
      {/* ── Page header — Dr Evide Web.dc.html:136-158 ──────────────
          One header at every width; it reflows rather than switching to the
          app's sticky icon-button header (Dr Evide.dc.html:160-188). */}
      <div>
        <button className="link-back" onClick={() => router.push("/")}>
          <ChevronLeft size={16} aria-hidden="true" /> Back to search
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
            {conditions && (
              <div className="sh-eyebrow" style={{ marginBottom: 8 }}>
                Matched to &ldquo;{conditions.split(",").join(", ")}&rdquo;
              </div>
            )}
            <h1 className="results-h1">{specialtyName} near you</h1>
          </div>
          {pledge}
        </div>

        <div style={{ marginBottom: 20 }}>
          <RadiusControl radius={radius} count={doctors.length} onChange={setRadius} />
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────── */}
      <div className="results-split" style={{ marginTop: 16 }}>
        <div className="results-list stagger">
          {loading && <p className="empty-state">Finding doctors…</p>}

          {!loading && doctors.length === 0 && (
            <p className="empty-state">
              No {specialtyName} doctors within {radius} km.
              {radius < RADIUS_MAX && " Try widening the radius."}
            </p>
          )}

          {!loading &&
            doctors.map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d}
                href={profileHref(d.id)}
                asOfYear={data?.as_of_year ?? new Date().getFullYear()}
              />
            ))}
        </div>

        {isDesktop && doctors.length > 0 && <ResultsMap doctors={doctors} center={center} />}
      </div>
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<p className="empty-state">Loading…</p>}>
      <ResultsInner />
    </Suspense>
  );
}
