import type { Metadata, Viewport } from "next";
import { isSampleMode } from "@dr-evide/db";
import { AppChrome } from "@/components/AppChrome";
import { LangProvider } from "@/lib/lang";
import { SITE_URL } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  /**
   * A template, not a fixed string. Every page on this site used to share one
   * title, so a doctor's profile and the front page were indistinguishable in
   * a search result or a shared link. Pages that set their own title get it;
   * `default` covers the ones that do not.
   */
  title: {
    default: "Dr Evide — find the right doctor near you",
    template: "%s · Dr Evide",
  },
  description:
    "Tell us what's wrong in your own words and we'll show you the most qualified doctors near Edappal — ranked by verified credentials, never by who paid.",
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  applicationName: "Dr Evide",
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
        {/*
          `lang="en"` above is the server's best guess; LangProvider corrects
          document.documentElement.lang once the stored preference is read.
          It has to be right, not decorative — it decides which voice a screen
          reader uses, and Malayalam announced under an English voice is worse
          than not translating at all.
        */}
        {/* isSampleMode() is read here, on the server, so the footer's "none
            of these people are real" line is a fact about this deployment
            rather than a sentence someone has to remember to delete. */}
        <LangProvider>
          <AppChrome sampleMode={isSampleMode()}>{children}</AppChrome>
        </LangProvider>
      </body>
    </html>
  );
}
