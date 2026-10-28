"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import type { AdminUser } from "@dr-evide/db";
import { ApplicationsPanel } from "./ApplicationsPanel";
import { DoctorsPanel } from "./DoctorsPanel";
import { StatsPanel } from "./StatsPanel";

/**
 * The console: three tabs over the admin API.
 *
 * The tab lives in the URL hash so a reload, or a link pasted to a colleague,
 * opens the same tab. A doctor opened from the review queue ("View doctor")
 * is passed across as `#doctors/123`.
 */
type Tab = "queue" | "doctors" | "stats";
const TABS: { id: Tab; label: string }[] = [
  { id: "queue", label: "Review queue" },
  { id: "doctors", label: "Doctors" },
  { id: "stats", label: "Stats" },
];

function readHash(): { tab: Tab; doctorId: number | null } {
  const [tab, id] = window.location.hash.replace(/^#/, "").split("/");
  const t = TABS.some((x) => x.id === tab) ? (tab as Tab) : "queue";
  const n = Number(id);
  return { tab: t, doctorId: t === "doctors" && Number.isInteger(n) && n > 0 ? n : null };
}

export function AdminConsole({ admin }: { admin: AdminUser }) {
  const [tab, setTab] = useState<Tab>("queue");
  const [doctorId, setDoctorId] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => {
      const h = readHash();
      setTab(h.tab);
      setDoctorId(h.doctorId);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function go(next: Tab, id: number | null = null) {
    const hash = id ? `#${next}/${id}` : `#${next}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setTab(next);
    setDoctorId(id);
  }

  async function signOut() {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }).catch(() => {});
    window.location.assign("/admin");
  }

  return (
    <div className="adm-console">
      <header className="adm-head">
        <div>
          <h1 className="adm-h1">Admin</h1>
          <p className="sh-hint">Signed in as {admin.name} ({admin.email})</p>
        </div>
        <button className="sh-btn sh-btn--secondary sh-btn--sm" onClick={signOut}>
          <LogOut size={16} aria-hidden="true" /> Sign out
        </button>
      </header>

      <div className="sh-tabs adm-tabs" role="tablist" aria-label="Admin sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`adm-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`adm-panel-${t.id}`}
            className="sh-tab"
            onClick={() => go(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section
        role="tabpanel"
        id={`adm-panel-${tab}`}
        aria-labelledby={`adm-tab-${tab}`}
        className="adm-panel"
      >
        {tab === "queue" && <ApplicationsPanel onOpenDoctor={(id) => go("doctors", id)} />}
        {tab === "doctors" && (
          <DoctorsPanel
            openId={doctorId}
            onOpen={(id) => go("doctors", id)}
            onClose={() => go("doctors")}
          />
        )}
        {tab === "stats" && <StatsPanel />}
      </section>
    </div>
  );
}
