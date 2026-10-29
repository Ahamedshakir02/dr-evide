"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

/**
 * Sign-in for the team. There is no sign-up: accounts are created with
 * `npm run admin:create`, so this form only ever checks a password.
 *
 * The API gives one message for every wrong-credential case on purpose; this
 * shows it as-is rather than guessing which half was wrong.
 */
export function AdminLogin() {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        res.status === 503
          ? "This deployment has no database, so there is nothing to sign in to."
          : (data.error ?? "Sign-in failed. Please try again.")
      );
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    }
    setSending(false);
  }

  return (
    <div className="adm-login">
      <form className="sh-card adm-login__card" onSubmit={submit}>
        <h1 className="adm-h1">Dr Evide admin</h1>
        <p className="sh-hint">For the people who review listings. Patients never need this page.</p>

        <div className="sh-field">
          <label className="sh-label" htmlFor="adm-email">
            Email
          </label>
          <input
            id="adm-email"
            name="email"
            className="sh-input"
            type="email"
            autoComplete="username"
            required
            autoFocus
          />
        </div>
        <div className="sh-field">
          <label className="sh-label" htmlFor="adm-password">
            Password
          </label>
          <input
            id="adm-password"
            name="password"
            className="sh-input"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p className="adm-error" role="alert">
            {error}
          </p>
        )}

        <button className="sh-btn sh-btn--primary sh-btn--block" disabled={sending}>
          <LogIn size={18} aria-hidden="true" />
          {sending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
