import type { Metadata } from "next";

/**
 * The share card, in one place.
 *
 * Next merges metadata **shallowly**: a page that declares `openGraph` replaces
 * the root layout's object outright rather than filling in around it. So the
 * layout declaring an image once is not enough — `/` set its own og:title and
 * og:description and thereby dropped the image, which meant the single most
 * shared URL on the site unfurled in WhatsApp as a grey box while pages nobody
 * links to had a card.
 *
 * Every page that sets `openGraph` spreads `OG_IMAGE` into it. Naming it makes
 * the omission visible in review; repeating the literal three times would not.
 */
export const OG_IMAGE: NonNullable<NonNullable<Metadata["openGraph"]>["images"]> = [
  {
    url: "/og.png",
    width: 1200,
    height: 630,
    alt: "Dr Evide — find the right doctor near you",
  },
];

/** The same file, for the Twitter card, which takes bare URLs. */
export const TWITTER_IMAGE = ["/og.png"];
