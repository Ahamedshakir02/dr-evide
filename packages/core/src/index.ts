/**
 * @dr-evide/core — the single source of truth for everything that decides what
 * a user sees: the taxonomy, the emergency red flags, the router, and
 * TrustScore.
 *
 * This package exists because v1 kept two byte-identical copies of these files,
 * one per app, and the README instructed you to paste changes between them. For
 * a product whose entire promise is that the same doctor gets the same honest
 * score everywhere, the scoring function existing twice was the deepest flaw in
 * the repo. There is now exactly one copy, and both apps import it.
 *
 * Nothing in here may read the clock, the network, or process.env. Everything
 * is a pure function of its arguments, so it is testable, reproducible, and
 * safe to run on a phone with no signal.
 */

export * from "./types";
export * from "./taxonomy";
export * from "./text";
export * from "./emergency";
export * from "./routing";
export * from "./ranking";
export * from "./geo";
export * from "./format";
export * from "./schemas";
export * from "./data";
