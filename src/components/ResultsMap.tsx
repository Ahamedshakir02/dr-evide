"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { SPECIALTIES } from "@/lib/taxonomy";
import type { RankedDoctor } from "@/lib/types";

/**
 * Desktop results map — Dr Evide Web.dc.html:226-256.
 *
 * The mock draws an abstract SVG street grid; this renders real OSM tiles at
 * the doctors' real coordinates. Pin styling matches the mock: the top-ranked
 * doctor gets a filled accent pill, everyone else an outlined one.
 *
 * Deviation: OpenStreetMap's licence requires the attribution control, which
 * the mock omits. It stays, toned down in globals.css.
 */

function pinIcon(score: number, isTop: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin${isTop ? " map-pin--top" : ""}">
             <div class="map-pin__label">${score}</div>
             <div class="map-pin__stem"></div>
           </div>`,
    iconSize: [46, 38],
    iconAnchor: [23, 38],
  });
}

const youIcon = L.divIcon({
  className: "",
  html: `<div class="map-you"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Keeps every pin plus the user in frame as the radius changes. */
function FitBounds({
  doctors,
  center,
}: {
  doctors: RankedDoctor[];
  center: { lat: number; lng: number };
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [center.lat, center.lng],
      ...doctors.map((d) => [d.lat, d.lng] as [number, number]),
    ];
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 });
  }, [map, doctors, center.lat, center.lng]);

  return null;
}

export default function ResultsMap({
  doctors,
  center,
}: {
  doctors: RankedDoctor[];
  center: { lat: number; lng: number };
}) {
  return (
    <div className="map-panel">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[center.lat, center.lng]} icon={youIcon} />

        {doctors.map((d, i) => (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={pinIcon(d.trust_score, i === 0)}>
            <Popup>
              <strong>{d.full_name}</strong>
              <br />
              {SPECIALTIES[d.specialty_slug].name} · TrustScore {d.trust_score}
              <br />
              <a href={`/doctor/${d.id}`}>View profile</a>
            </Popup>
          </Marker>
        ))}

        <FitBounds doctors={doctors} center={center} />
      </MapContainer>

      <div className="map-legend">
        <span className="map-legend__dot" /> You
      </div>
    </div>
  );
}
