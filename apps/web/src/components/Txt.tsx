"use client";

import { specialtyText, type SpecialtySlug, type Strings } from "@dr-evide/core";
import { useLang } from "@/lib/lang";

/**
 * A translated string inside a server component.
 *
 * The doctor profile is server-rendered on purpose — the facts about a person
 * should not need JavaScript to appear — but the language lives in React state
 * on the client. Rather than pushing the whole page across the boundary, the
 * handful of fixed labels on it cross individually through this.
 *
 * Restricted to the plain-string entries of the table. Anything that takes an
 * argument is a real component's job, not a lookup's.
 */
type PlainKey = {
  [K in keyof Strings]: Strings[K] extends string ? K : never;
}[keyof Strings];

export function Txt({ k }: { k: PlainKey }) {
  const { t } = useLang();
  return <>{t[k]}</>;
}

/** A department name in the reader's language. */
export function SpecialtyName({ slug }: { slug: SpecialtySlug }) {
  const { lang } = useLang();
  return <>{specialtyText(slug, lang).name}</>;
}

/** "· 12 years", or nothing when the registration year is unknown. */
export function ExperienceYears({ years }: { years: number | null }) {
  const { t } = useLang();
  if (years === null) return null;
  return (
    <>
      {" "}
      · {years} {t.years}
    </>
  );
}
