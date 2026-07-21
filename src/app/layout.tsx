import type { Metadata, Viewport } from "next";
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
      <body>
        <header className="site-header">
          <a href="/" className="logo">
            Dr <span>Evide</span>
          </a>
          <span className="tagline">ഡോക്ടർ എവിടെ?</span>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            Dr Evide helps you find a suitable doctor. It does not provide medical advice or
            diagnosis. In an emergency, call 108.
          </p>
          <p className="muted">Rankings are never paid for. <a href="/">How ranking works</a></p>
        </footer>
      </body>
    </html>
  );
}
