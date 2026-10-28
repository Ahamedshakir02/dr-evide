import { currentAdmin } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminConsole } from "@/components/admin/AdminConsole";

/**
 * /admin — one URL, two states.
 *
 * The session is read on the server, so a signed-out visitor is sent the
 * sign-in form and nothing else: no console markup, no API paths in a bundle
 * they were never meant to load. Every action the console takes is checked
 * again by requireAdmin on its own route; this page is the front door, not
 * the lock.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await currentAdmin();
  return admin ? <AdminConsole admin={admin} /> : <AdminLogin />;
}
