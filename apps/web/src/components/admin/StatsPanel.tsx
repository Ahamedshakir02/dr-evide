"use client";

import { useEffect, useState } from "react";
import { SPECIALTIES, SPECIALTY_SLUGS, type SpecialtySlug } from "@dr-evide/core";
import type { CounterRow, DataSummary } from "@dr-evide/db";
import { adminFetch } from "./client";
import { Banner } from "./shared";

/**
 * The numbers the 90-day plan is steered by, from GET /api/admin/stats.
 *
 * Read the per-department table as the recruiting list: a department where
 * many searches find nobody is the next one to sign doctors up in. The
 * contact rate — searches that ended in a call or directions — is the
 * north-star.
 *
 * Counters are daily totals with no identity, location or doctor attached,
 * so nothing here can be broken down further than this, by design.
 */
interface Stats {
  days: number;
  counters: CounterRow[];
  summary: DataSummary | null;
}

const RANGES = [7, 30, 90] as const;

const nf = new Intl.NumberFormat("en-IN");
const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");

export function StatsPanel() {
  const [days, setDays] = useState<number>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setStats(null);
    setError(null);
    adminFetch<Stats>(`stats?days=${days}`).then((r) => {
      if (!live) return;
      if (r.ok) setStats(r.data);
      else setError(r.error);
    });
    return () => {
      live = false;
    };
  }, [days]);

  return (
    <div>
      <div className="adm-toolbar">
        <div className="adm-chips" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`sh-btn sh-btn--sm ${days === r ? "sh-btn--primary" : "sh-btn--secondary"}`}
              aria-pressed={days === r}
              onClick={() => setDays(r)}
            >
              Last {r} days
            </button>
          ))}
        </div>
      </div>

      {error && <Banner kind="error">{error}</Banner>}
      {!stats && !error && <p className="sh-hint">Loading…</p>}
      {stats && <StatsBody stats={stats} />}
    </div>
  );
}

function StatsBody({ stats }: { stats: Stats }) {
  const total = (name: string) =>
    stats.counters.filter((c) => c.name === name).reduce((s, c) => s + c.value, 0);
  const totalPrefix = (prefix: string) =>
    stats.counters.filter((c) => c.name.startsWith(prefix)).reduce((s, c) => s + c.value, 0);

  const searches = totalPrefix("search.performed.");
  const empty = totalPrefix("search.empty.");
  const views = total("contact.profile_view");
  const calls = total("contact.call");
  const directions = total("contact.directions");
  const s = stats.summary;

  const perDept = SPECIALTY_SLUGS.map((slug: SpecialtySlug) => ({
    slug,
    searches: total(`search.performed.${slug}`),
    empty: total(`search.empty.${slug}`),
    doctors: s?.by_specialty[slug] ?? 0,
  })).sort((a, b) => b.empty - a.empty || b.searches - a.searches);

  // Newest first, one row per day that has any count.
  const byDay = new Map<string, Record<string, number>>();
  for (const c of stats.counters) {
    const row = byDay.get(c.day) ?? {};
    const key = c.name.startsWith("search.performed.")
      ? "searches"
      : c.name.startsWith("search.empty.")
        ? "empty"
        : c.name;
    row[key] = (row[key] ?? 0) + c.value;
    byDay.set(c.day, row);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <>
      <h2 className="sh-eyebrow">Demand · last {stats.days} days</h2>
      <div className="adm-tiles">
        <Tile label="Searches" value={nf.format(searches)} />
        <Tile label="Found nobody" value={nf.format(empty)} sub={searches ? `${pct(empty, searches)} of searches` : undefined} />
        <Tile label="Profile views" value={nf.format(views)} />
        <Tile label="Calls" value={nf.format(calls)} />
        <Tile label="Directions" value={nf.format(directions)} />
        <Tile
          label="Contact rate"
          value={pct(calls + directions, searches)}
          sub="calls + directions per search"
          strong
        />
        <Tile label="Listing applications" value={nf.format(total("listing.submitted"))} />
        <Tile label="Launch sign-ups" value={nf.format(total("notify.stored"))} />
      </div>

      <h2 className="sh-eyebrow">Supply · now</h2>
      {s ? (
        <div className="adm-tiles">
          <Tile label="Published doctors" value={nf.format(s.doctors_published)} />
          <Tile label="Verified" value={nf.format(s.doctors_verified)} sub={s.doctors_published ? `${pct(s.doctors_verified, s.doctors_published)} of published` : undefined} />
          <Tile label="Hidden" value={nf.format(s.doctors_hidden)} />
          <Tile label="Awaiting review" value={nf.format(s.applications_pending)} strong={s.applications_pending > 0} />
          <Tile label="Launch list" value={nf.format(s.launch_list)} sub="addresses, all time" />
        </div>
      ) : (
        <p className="sh-hint">No database on this deployment.</p>
      )}

      <h2 className="sh-eyebrow">By department · most empty searches first</h2>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Department</th>
              <th scope="col" className="adm-num">Searches</th>
              <th scope="col" className="adm-num">Found nobody</th>
              <th scope="col" className="adm-num">Empty rate</th>
              <th scope="col" className="adm-num">Doctors listed</th>
            </tr>
          </thead>
          <tbody>
            {perDept.map((r) => (
              <tr key={r.slug}>
                <td>{SPECIALTIES[r.slug].name}</td>
                <td className="adm-num">{nf.format(r.searches)}</td>
                <td className="adm-num">{nf.format(r.empty)}</td>
                <td className="adm-num">{pct(r.empty, r.searches)}</td>
                <td className="adm-num">{nf.format(r.doctors)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="sh-eyebrow">By day</h2>
      {days.length === 0 ? (
        <p className="sh-hint">Nothing counted in this period yet.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Day (IST)</th>
                <th scope="col" className="adm-num">Searches</th>
                <th scope="col" className="adm-num">Found nobody</th>
                <th scope="col" className="adm-num">Views</th>
                <th scope="col" className="adm-num">Calls</th>
                <th scope="col" className="adm-num">Directions</th>
                <th scope="col" className="adm-num">Applications</th>
              </tr>
            </thead>
            <tbody>
              {days.map(([day, r]) => (
                <tr key={day}>
                  <td className="adm-nowrap sh-mono">{day}</td>
                  <td className="adm-num">{nf.format(r.searches ?? 0)}</td>
                  <td className="adm-num">{nf.format(r.empty ?? 0)}</td>
                  <td className="adm-num">{nf.format(r["contact.profile_view"] ?? 0)}</td>
                  <td className="adm-num">{nf.format(r["contact.call"] ?? 0)}</td>
                  <td className="adm-num">{nf.format(r["contact.directions"] ?? 0)}</td>
                  <td className="adm-num">{nf.format(r["listing.submitted"] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Tile({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div className={`adm-tile${strong ? " adm-tile--strong" : ""}`}>
      <div className="adm-tile__label">{label}</div>
      <div className="adm-tile__value sh-mono">{value}</div>
      {sub && <div className="adm-tile__sub">{sub}</div>}
    </div>
  );
}
