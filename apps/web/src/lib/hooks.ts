"use client";

import { useEffect, useState } from "react";

/**
 * Matches a media query in JS. Starts false on the server and on first paint,
 * then settles after mount — so it must only gate things that are safe to
 * appear a tick late (the map), never layout that would shift the page.
 * Layout differences belong in CSS.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}
