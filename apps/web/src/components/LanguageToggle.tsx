"use client";

import { LANGS, LANG_LABELS } from "@dr-evide/core";
import { MALAYALAM_ENABLED, useLang } from "@/lib/lang";

/**
 * Two buttons, not a dropdown.
 *
 * There are exactly two languages and both fit; a select would hide the
 * Malayalam option behind a tap for the very people most likely to want it.
 * Each option is labelled in its own script, so it is legible to someone who
 * cannot read the other one.
 */
export function LanguageToggle() {
  const { lang, setLang, t } = useLang();

  if (!MALAYALAM_ENABLED) return null;

  return (
    <div className="lang-toggle" role="group" aria-label={t.languageLabel}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={`lang-toggle__btn${l === lang ? " is-active" : ""}`}
          aria-pressed={l === lang}
          lang={l}
          onClick={() => setLang(l)}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
