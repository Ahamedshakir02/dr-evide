import type { PoolClient } from "pg";

/**
 * One line in admin_audit_log. Takes a transaction client, never the pool, so
 * the record of a change commits or rolls back with the change itself.
 *
 * `detail` is for ids and flags. Never put a contact email or free text a
 * doctor wrote here — this table is kept forever.
 */
export async function audit(
  c: PoolClient,
  adminId: number | null,
  action: string,
  targetType: "application" | "doctor" | "admin",
  targetId: number | null,
  detail: Record<string, string | number | boolean | null>
): Promise<void> {
  await c.query(
    `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, detail)
     VALUES ($1,$2,$3,$4,$5)`,
    [adminId, action, targetType, targetId, JSON.stringify(detail)]
  );
}
