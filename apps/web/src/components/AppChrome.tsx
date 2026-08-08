"use client";

import { MapPin, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/lang";
import { siteCopy } from "@/lib/site-copy";
import { LanguageToggle } from "./LanguageToggle";

/**
 * The shell around every page — top bar, main landmark, footer.
 *
 * A client component because all three carry translated copy and the language
 * lives in React state. The layout itself stays a server component so
 * `metadata` still works; this is the smallest boundary that gets the strings
 * without pushing the whole tree client-side.
 *
 * The top bar took on real navigation when `/` became the landing page and the
 * search moved to `/find`. Two rules keep it from getting in the way:
 *
 *   - The section links are absolute (`/#features`, not `#features`) so they
 *     work from /results and /doctor/[id] too, where those sections do not
 *     exist on the current page.
 *   - Below 760px only the "Find a doctor" button survives. The section links
 *     are a convenience on a page you can simply scroll; the search is the
 *     thing someone unwell needs to reach, and it should not be behind a
 *     hamburger on the screen size most of the launch area uses.
 *
 * `sampleMode` is resolved on the server and passed down rather than hardcoded,
 * so the footer's "none of these people are real" line disappears by itself the
 * day a real database is configured. A standing claim about the data that only
 * a human remembers to remove is the kind that ends up being wrong.
 */
export function AppChrome({
  children,
  sampleMode,
}: {
  children: React.ReactNode;
  sampleMode: boolean;
}) {
  const { lang, t } = useLang();
  const c = siteCopy(lang);
  const pathname = usePathname();
  const onLanding = pathname === "/";

  return (
    <>
      {/* First focusable element on every page. A keyboard or switch user
          should not have to tab through the header and the radius slider to
          reach the doctor list. */}
      <a href="#main" className="skip-link">
        {t.skipToContent}
      </a>

      {/* Top bar — Dr Evide Web.dc.html:35-51, plus the nav the design did
          not need when the site was one page. */}
      <header className="topbar">
        <div className="topbar__inner">
          {/* Wordmark only. The Malayalam lockup "ഡോക്ടർ എവിടെ?" belongs to
              the app's top bar (Dr Evide.dc.html:56) — the web design carries
              the wordmark alone. */}
          <a href="/" className="wordmark">
            Dr Evide
          </a>

          <nav className="topbar__nav" aria-label={c.nav.menu}>
            <a href="/#features">{c.nav.features}</a>
            <a href="/#trust">{c.nav.how}</a>
            <a href="/#download">{c.nav.download}</a>
          </nav>

          <div className="topbar__end">
            <LanguageToggle />
            {/* The place tag is context; the search is an action. On the
                landing page the action wins the space, everywhere else the
                page itself is the search and the context is worth more. */}
            {onLanding ? (
              <a className="sh-btn sh-btn--primary sh-btn--sm topbar__cta" href="/find">
                <Search size={15} aria-hidden="true" />
                {c.nav.find}
              </a>
            ) : (
              <span className="sh-tag topbar__place">
                <MapPin size={16} aria-hidden="true" />
                Edappal, Kerala
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="shell" id="main" tabIndex={-1}>
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer__cols">
          <div className="site-footer__brand">
            <span className="wordmark">Dr Evide</span>
            <p>{c.footer.tagline}</p>
            <p className="site-footer__area">{c.footer.area}</p>
          </div>

          <nav aria-label={c.footer.product}>
            <h2>{c.footer.product}</h2>
            <a href="/find">{c.footer.findLink}</a>
            <a href="/#features">{c.footer.sourceLink}</a>
            <a href="/#download">{c.footer.downloadLink}</a>
          </nav>

          <nav aria-label={c.footer.project}>
            <h2>{c.footer.project}</h2>
            <a href="/#trust">{c.footer.howLink}</a>
            <a href="/#faq">{c.faq.eyebrow}</a>
            <a href="/api/health">{c.footer.statusLink}</a>
          </nav>
        </div>

        {/* Unchanged, and deliberately the last thing on every page: the
            disclaimer, the pledge, and the number that has to work even when
            nothing else on the site does. */}
        <div className="site-footer__legal">
          <p>
            {t.disclaimer} {t.inEmergencyCall} <a href="tel:108">108</a>.
          </p>
          <p>{t.neverPaid}</p>
          {sampleMode && <p>{c.footer.sampleNote}</p>}
        </div>
      </footer>
    </>
  );
}
