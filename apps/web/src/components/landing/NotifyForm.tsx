"use client";

import { useId, useState } from "react";
import { Check, Mail, Send } from "lucide-react";
import { useLang } from "@/lib/lang";
import { siteCopy } from "@/lib/site-copy";

/**
 * "Tell me when it's out".
 *
 * The only field on this site that asks for something about the reader, so it
 * says exactly what it will do with it and does not pretend. In particular it
 * never reports success it did not get: /api/notify answers 503 when the
 * deployment has no database to hold the address, and this shows that as an
 * apology plus a real email link rather than a green tick over a lost address.
 *
 * The contact address is a build-time env var. Left unset, the fallback link is
 * simply not rendered — a mailto: to a mailbox nobody reads is worse than none.
 */
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string; offerMail: boolean };

export function NotifyForm() {
  const { lang } = useLang();
  const c = siteCopy(lang).download;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputId = useId();
  const hintId = useId();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "sending" });

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string };

      switch (data.status) {
        case "saved":
          setEmail("");
          setState({ kind: "done", message: c.notifyOk });
          return;
        case "duplicate":
          setEmail("");
          setState({ kind: "done", message: c.notifyDuplicate });
          return;
        case "invalid":
          setState({ kind: "error", message: c.notifyInvalid, offerMail: false });
          return;
        case "unconfigured":
          setState({ kind: "error", message: c.notifyOffline, offerMail: true });
          return;
        default:
          setState({ kind: "error", message: c.notifyError, offerMail: true });
      }
    } catch {
      setState({ kind: "error", message: c.notifyError, offerMail: true });
    }
  }

  if (state.kind === "done") {
    return (
      <p className="notify__done" role="status">
        <Check size={17} aria-hidden="true" />
        {state.message}
      </p>
    );
  }

  return (
    <form className="notify" onSubmit={submit}>
      <label className="notify__label" htmlFor={inputId}>
        {c.notifyLabel}
      </label>

      <div className="notify__row">
        <input
          id={inputId}
          className="sh-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder={c.notifyPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={hintId}
          aria-invalid={state.kind === "error" || undefined}
        />
        <button
          className="sh-btn sh-btn--primary"
          disabled={state.kind === "sending" || email.trim().length < 3}
        >
          {state.kind === "sending" ? c.notifySending : c.notifyCta}
          {state.kind !== "sending" && <Send size={16} aria-hidden="true" />}
        </button>
      </div>

      <p className="notify__hint" id={hintId}>
        {c.notifyHint}
      </p>

      {state.kind === "error" && (
        <p className="notify__error" role="alert">
          {state.message}
          {state.offerMail && CONTACT_EMAIL && (
            <>
              {" "}
              <a href={`mailto:${CONTACT_EMAIL}?subject=Dr%20Evide%20launch`}>
                <Mail size={14} aria-hidden="true" /> {c.mailtoCta}
              </a>
            </>
          )}
        </p>
      )}
    </form>
  );
}
