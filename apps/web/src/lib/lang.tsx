"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LANG, isLang, strings, type Lang, type Strings } from "@dr-evide/core";

/**
 * The reader's language.
 *
 * Chosen explicitly and remembered, rather than sniffed from `navigator.language`
 * — a phone sold in Kerala usually reports `en-IN` regardless of what its owner
 * reads most comfortably, so guessing from it would get exactly the wrong
 * answer for the people this matters most to. English stays the default because
 * that is what the design was built in; the toggle is one tap away and sticky.
 *
 * localStorage, not sessionStorage: unlike the search context, a language
 * preference is not sensitive and should outlive the tab.
 */

const KEY = "dr-evide:lang";

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

/**
 * Malayalam is switched off until a native speaker has reviewed it (see the
 * README). Set NEXT_PUBLIC_ENABLE_MALAYALAM=true to offer it. Off, the toggle is
 * hidden and a language remembered from an earlier visit is ignored, so nobody
 * is stranded in a language they cannot switch out of.
 */
export const MALAYALAM_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MALAYALAM === "true";

export function LangProvider({ children }: { children: React.ReactNode }) {
  /**
   * Starts at the default and settles after mount. localStorage does not exist
   * during SSR, so reading it in render would make the server and client markup
   * disagree — the same reason the search context works this way.
   */
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (MALAYALAM_ENABLED && isLang(stored)) setLangState(stored);
    } catch {
      // Storage disabled. English is a working answer, not a failure.
    }
  }, []);

  /**
   * Keep the document in sync.
   *
   * `lang` on <html> is what tells a screen reader which voice to use and a
   * browser which hyphenation rules to apply. Rendering Malayalam under
   * lang="en" makes a screen reader attempt to pronounce it as English, which
   * is worse than not translating at all.
   */
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Not remembering the choice is survivable; failing to apply it is not.
    }
  }, []);

  return (
    <LangContext.Provider value={{ lang, t: strings(lang), setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = (): LangValue => useContext(LangContext);
