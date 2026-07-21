"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SPECIALTIES } from "@/lib/taxonomy";
import type { RoutingResult } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routing, setRouting] = useState<RoutingResult | null>(null);

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
      if (!result.emergency && result.specialties.length === 1) {
        goToResults(result.specialties[0].slug, result.matched_conditions);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function goToResults(slug: string, conditions: string[]) {
    const params = new URLSearchParams({ specialty: slug });
    if (conditions.length) params.set("conditions", conditions.join(","));
    router.push(`/results?${params.toString()}`);
  }

  return (
    <>
      <h1>What&apos;s troubling you?</h1>
      <p className="subtitle">
        Describe it in your own words — we&apos;ll find the right type of doctor near you.
      </p>

      <form className="symptom-form" onSubmit={handleRoute}>
        <textarea
          className="symptom-input"
          placeholder='e.g. "my hair is falling a lot from the front" or "knee pain when climbing stairs"'
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button className="btn" disabled={loading || text.trim().length < 3}>
          {loading ? "Thinking…" : "Find my doctor"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>

      {routing?.emergency && (
        <div className="routing-box emergency">{routing.emergency_message}</div>
      )}

      {routing && !routing.emergency && routing.specialties.length > 1 && (
        <div className="routing-box">
          <p style={{ marginTop: 0 }}>This could be one of these — pick the closest fit:</p>
          {routing.specialties.map((s) => (
            <p key={s.slug}>
              <button
                className="btn btn-secondary"
                onClick={() => goToResults(s.slug, routing.matched_conditions)}
              >
                {SPECIALTIES[s.slug].name}
              </button>
              <br />
              <small>{s.reason}</small>
            </p>
          ))}
        </div>
      )}

      <p className="divider">— or pick a department yourself —</p>

      <div className="specialty-grid">
        {(Object.entries(SPECIALTIES) as [string, { name: string; description: string }][]).map(
          ([slug, s]) => (
            <a key={slug} className="specialty-card" href={`/results?specialty=${slug}`}>
              <strong>{s.name}</strong>
              <small>{s.description}</small>
            </a>
          )
        )}
      </div>
    </>
  );
}
