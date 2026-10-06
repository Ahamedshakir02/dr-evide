"use client";

import { useEffect, useState } from "react";
import type { SpecialtySlug } from "@dr-evide/core";
import {
  defaultSearchContext,
  searchContextFor,
  type SearchContext,
} from "./search-context";

/**
 * The current search, for components that need it but do not own it.
 *
 * Starts at the defaults and settles after mount, deliberately: sessionStorage
 * does not exist during SSR, so reading it in render would make the server and
 * client markup disagree. The defaults are the same ones doctorSearchSchema
 * applies, which means the first paint shows a real, correct score for a
 * context-free visit rather than a placeholder — and then refines to the
 * score from the search the person actually ran.
 */
export function useSearchContext(specialty: SpecialtySlug): SearchContext {
  const [ctx, setCtx] = useState<SearchContext>(() => defaultSearchContext(specialty));

  useEffect(() => {
    setCtx(searchContextFor(specialty));
  }, [specialty]);

  return ctx;
}

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
