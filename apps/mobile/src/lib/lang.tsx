import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LANG, isLang, strings, type Lang, type Strings } from "@dr-evide/core";

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
 * ── Remembered between launches ──────────────────────────────────────────
 *
 * AsyncStorage, under the same key the website writes to localStorage. The
 * choice used to reset every launch, which on a shared or low-end phone meant
 * a Malayalam reader re-tapping the toggle every single time they opened the
 * app to look something up while unwell.
 *
 * The read is asynchronous - there is no synchronous key-value store on React
 * Native - so it cannot simply seed useState the way the old `load()` seam
 * implied. It is started at import instead, and awaited alongside the fonts in
 * app/_layout.tsx, which was already holding the splash screen. In practice
 * the read resolves long before the remote typefaces do, so this costs nothing
 * and there is no frame where the app renders in the wrong language before
 * correcting itself.
 *
 * The one screen where a forgotten preference would actually cost something -
 * the emergency interrupt - still does not read this. It renders both
 * languages at once precisely so it never has to depend on a setting being
 * right, and that stays true now the setting usually is.
 */

/** The same key the website uses, so the two never drift apart in support. */
const KEY = "dr-evide:lang";

/**
 * Started once, at import, rather than on mount.
 *
 * The work is a single disk read and the app is going to want the answer
 * regardless, so there is no reason to wait for React to get around to it.
 */
const stored: Promise<Lang | undefined> = load();

async function load(): Promise<Lang | undefined> {
  try {
    const value = await AsyncStorage.getItem(KEY);
    // Anything else on that key - a truncated write, an older format, a value
    // some future version wrote - is discarded rather than coerced.
    return isLang(value) ? value : undefined;
  } catch {
    // Storage unavailable or corrupt. English is a working answer; failing to
    // open the app because a preference could not be read is not.
    return undefined;
  }
}

function save(lang: Lang): void {
  // Deliberately not awaited. The choice has already been applied in memory,
  // and a write that fails should cost the next launch, never this tap.
  AsyncStorage.setItem(KEY, lang).catch(() => {});
}

/**
 * The stored preference, or `null` while the read is still in flight.
 *
 * Distinct from `undefined`, which is the legitimate answer "nothing has been
 * stored yet" - the caller has to be able to tell "still reading" from "read,
 * and there was nothing there".
 */
export function useStoredLang(): Lang | null {
  const [value, setValue] = useState<Lang | null>(null);

  useEffect(() => {
    let live = true;
    stored.then((v) => {
      if (live) setValue(v ?? DEFAULT_LANG);
    });
    return () => {
      live = false;
    };
  }, []);

  return value;
}

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

export function LangProvider({
  initial,
  children,
}: {
  /** From useStoredLang(). Omitted, the provider simply starts at English. */
  initial?: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initial ?? DEFAULT_LANG);

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
