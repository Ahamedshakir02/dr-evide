import { getPool } from "./pool";

/**
 * Daily counters, persisted.
 *
 * The write is one upsert per event. That is fine at the launch area's volume
 * (hundreds of searches a day, not thousands a second); if it ever is not,
 * batch in lib/telemetry.ts and flush on an interval — the table does not
 * change. Days are in IST, the only timezone the product's readers are in, so
 * "today" on the stats page means the reader's today.
 */
export async function incrementCounter(name: string, by = 1): Promise<void> {
  const p = getPool();
  if (!p) return;
  await p.query(
    `INSERT INTO daily_counters (day, name, value)
     VALUES ((now() AT TIME ZONE 'Asia/Kolkata')::date, $1, $2)
     ON CONFLICT (day, name) DO UPDATE SET value = daily_counters.value + EXCLUDED.value`,
    [name, by]
  );
}

export interface CounterRow {
  day: string; // YYYY-MM-DD
  name: string;
  value: number;
}

export async function readCounters(days: number): Promise<CounterRow[]> {
  const p = getPool();
  if (!p) return [];
  const { rows } = await p.query(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day, name, value
     FROM daily_counters
     WHERE day > (now() AT TIME ZONE 'Asia/Kolkata')::date - $1::int
     ORDER BY day, name`,
    [Math.min(Math.max(Math.trunc(days), 1), 366)]
  );
  return rows.map((r) => ({ day: r.day, name: r.name, value: Number(r.value) }));
}

export interface DataSummary {
  doctors_published: number;
  doctors_verified: number;
  doctors_hidden: number;
  applications_pending: number;
  launch_list: number;
  by_specialty: Record<string, number>;
}

/** The supply side, for the stats page: how many real, public doctors per department. */
export async function readDataSummary(): Promise<DataSummary | null> {
  const p = getPool();
  if (!p) return null;
  const [totals, spec] = await Promise.all([
    p.query(`
      SELECT
        count(*) FILTER (WHERE status = 'published')::int AS doctors_published,
        count(*) FILTER (WHERE status = 'published' AND nmc_verified)::int AS doctors_verified,
        count(*) FILTER (WHERE status = 'hidden')::int AS doctors_hidden,
        (SELECT count(*)::int FROM listing_applications WHERE status = 'pending') AS applications_pending,
        (SELECT count(*)::int FROM launch_notifications) AS launch_list
      FROM doctors WHERE is_sample = false`),
    p.query(`
      SELECT specialty_slug, count(*)::int AS n FROM doctors
      WHERE is_sample = false AND status = 'published'
      GROUP BY specialty_slug`),
  ]);
  return {
    ...totals.rows[0],
    by_specialty: Object.fromEntries(spec.rows.map((r) => [r.specialty_slug, r.n])),
  };
}
