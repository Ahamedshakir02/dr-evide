"use client";

import { MapPin } from "lucide-react";
import { useLang } from "@/lib/lang";
import { LanguageToggle } from "./LanguageToggle";

/**
 * The shell around every page — top bar, main landmark, footer.
 *
 * A client component because all three carry translated copy and the language
 * lives in React state. The layout itself stays a server component so `metadata`
 * still works; this is the smallest boundary that gets the strings without
 * pushing the whole tree client-side.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const { t } = useLang();

  return (
    <>
      {/* First focusable element on every page. A keyboard or switch user
          should not have to tab through the header and the radius slider to
          reach the doctor list. */}
      <a href="#main" className="skip-link">
        {t.skipToResults}
      </a>

      {/* Top bar — Dr Evide Web.dc.html:35-51 */}
      <header className="topbar">
        <div className="topbar__inner">
          {/* Wordmark only. The Malayalam lockup "ഡോക്ടർ എവിടെ?" belongs to
              the app's top bar (Dr Evide.dc.html:56) — the web design carries
              the wordmark alone. */}
          <a href="/" className="wordmark">
            Dr Evide
          </a>
          <div className="topbar__end">
            <LanguageToggle />
            <span className="sh-tag topbar__place">
              <MapPin size={16} aria-hidden="true" />
              Edappal, Kerala
            </span>
          </div>
        </div>
      </header>

      <main className="shell" id="main" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <p>
          {t.disclaimer} {t.inEmergencyCall} <a href="tel:108">108</a>.
        </p>
        <p>{t.neverPaid}</p>
      </footer>
    </>
  );
}
