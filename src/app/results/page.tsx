"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { RankedDoctor } from "@/lib/types";

interface SearchResponse {
  specialty: { slug: string; name: string; description: string };
  radius_km: number;
  count: number;
  doctors: RankedDoctor[];
  error?: string;
}

function ResultsInner() {
  const sp = useSearchParams();
  const specialty = sp.get("specialty") ?? "general";
  const conditions = sp.get("conditions") ?? "";

  const [radius, setRadius] = useState(15);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // denied → server falls back to Edappal centre
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ specialty, radius: String(radius) });
    if (conditions) params.set("conditions", conditions);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    try {
      const res = await fetch(`/api/doctors?${params.toString()}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [specialty, radius, conditions, coords]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <a className="back-link" href="/">← Search again</a>
      <h1>{data?.specialty?.name ?? "Doctors"}</h1>
      <p className="subtitle">
        Ranked by verified credentials, experience, and authentic reviews — never by payment.
      </p>

      <div className="radius-row">
        <span>Within</span>
        <input
          type="range"
          min={2}
          max={50}
          step={1}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <b>{radius} km</b>
      </div>

      {loading && <p className="empty-state">Finding doctors…</p>}

      {!loading && data?.doctors?.length === 0 && (
        <p className="empty-state">
          No {data.specialty.name} doctors found within {radius} km. Try widening the radius.
        </p>
      )}

      {!loading &&
        data?.doctors?.map((d, i) => (
          <a key={d.id} className="doctor-card" href={`/doctor/${d.id}`}>
            <div className="row1">
              <div>
                <h3>
                  #{i + 1} {d.full_name}
                </h3>
                <p className="quals">{d.qualifications.join(", ")}</p>
                <p style={{ margin: "0 0 6px" }}>
                  {d.nmc_verified ? (
                    <span className="badge verified">NMC verified</span>
                  ) : (
                    <span className="badge unverified">Not yet verified</span>
                  )}
                  {d.is_sample && <span className="badge sample">Sample data</span>}
                </p>
                <p className="meta">
                  {d.clinic_name} · {d.town} · <b>{d.distance_km.toFixed(1)} km</b>
                  {d.fee_inr ? <> · ₹{d.fee_inr}</> : null}
                </p>
              </div>
              <div className="score-badge">
                {d.trust_score}
                <small>TrustScore</small>
              </div>
            </div>
          </a>
        ))}
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
