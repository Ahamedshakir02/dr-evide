import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_LANG, strings, type Lang, type Strings } from "@dr-evide/core";

/**
 * The reader's language, for the app.
 *
 * Deliberately the same shape as the website's provider
 * (apps/web/src/lib/lang.tsx) - `{ lang, t, setLang }` - so a screen ported
 * between the two reads the same and neither app grows its own idea of what a
 * language preference is. The strings themselves come from core, which is the
 * only place either app is allowed to get them.
 *
 * Chosen explicitly rather than sniffed from the device locale, for the same
 * reason the website does not read navigator.language: a phone sold in Kerala
 * reports en-IN whatever its owner actually reads, so guessing from it gets
 * exactly the wrong answer for the people this matters most to.
 *
 * ── Not yet remembered between launches ──────────────────────────────────
 *
 * This holds the choice in memory only, so it resets when the app is killed.
 * React Native has no built-in key-value store and the app does not currently
 * depend on one; adding a native module is a dev-client rebuild for everyone
 * working on it, which is not a thing to slip in sideways.
 *
 * The seam is deliberately narrow: `load` and `save` below are the only two
 * places that would change. Wiring a store means implementing those two and
 * seeding useState from `load`, and nothing else in the app moves.
 *
 * The one screen where a forgotten preference would actually cost something -
 * the emergency interrupt - does not read this. It renders both languages at
 * once precisely so it never has to depend on a setting being right.
 */

/** Reads the stored preference. Returns undefined until a store exists. */
function load(): Lang | undefined {
  return undefined;
}

/** Persists the preference. A no-op until a store exists. */
function save(_lang: Lang): void {}

interface LangValue {
  lang: Lang;
  t: Strings;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangValue>({
  lang: DEFAULT_LANG,
  t: strings(DEFAULT_LANG),
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => load() ?? DEFAULT_LANG);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    save(next);
  }, []);

  // strings() is a table lookup, but `t` is passed to every screen through
  // context, so a fresh object each render would re-render all of them.
  const value = useMemo<LangValue>(() => ({ lang, t: strings(lang), setLang }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = (): LangValue => useContext(LangContext);
