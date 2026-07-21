import type { Metadata, Viewport } from "next";
import { MapPin } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr Evide — find the right doctor near you",
  description:
    "Tell us what's wrong in your own words and we'll show you the most qualified doctors near Edappal — ranked by verified credentials, never by who paid.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Malayalam glyphs for "ഡോക്ടർ എവിടെ?" — neither Clash Display nor
            General Sans carries them. Loaded here rather than via @import,
            which webpack emits too late in the bundle to be honoured. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        {/* Top bar — Dr Evide Web.dc.html:35-51 */}
        <header className="topbar">
          <div className="topbar__inner">
            {/* Wordmark only. The Malayalam lockup "ഡോക്ടർ എവിടെ?" belongs to
                the app's top bar (Dr Evide.dc.html:56) — the web design carries
                the wordmark alone. The Malayalam webfont below still loads,
                because people type Malayalam into the symptom box. */}
            <a href="/" className="wordmark">
              Dr Evide
            </a>
            <span className="sh-tag" style={{ height: 38, marginLeft: "auto" }}>
              <MapPin size={16} aria-hidden="true" />
              Edappal, Kerala
            </span>
          </div>
        </header>

        <main className="shell">{children}</main>

        <footer className="site-footer">
          <p>
            Dr Evide helps you find a suitable doctor. It does not provide medical advice or
            diagnosis. In an emergency, call <a href="tel:108">108</a>.
          </p>
          <p>Rankings are never paid for. No one can pay to rank higher.</p>
        </footer>
      </body>
    </html>
  );
}
