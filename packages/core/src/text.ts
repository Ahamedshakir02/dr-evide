/**
 * Shared text normalisation for every kind of symptom matching — emergency red
 * flags, specialty routing, and condition extraction all go through here, so
 * all three agree on what counts as a word.
 *
 * Why not String.includes() on raw text: plain substring matching produced real
 * misroutes in v1.
 *   "heart"    contains "ear"  → routed to ENT
 *   "kidney"   contains "kid"  → routed to Pediatrics
 *   "benefits" contains "fits" → tripped the emergency interrupt
 * Matching whole words fixes all three without weakening recall.
 */

/** The Malayalam Unicode block, U+0D00–U+0D7F. */
const MALAYALAM_FIRST = String.fromCharCode(0x0d00);
const MALAYALAM_LAST = String.fromCharCode(0x0d7f);

/**
 * Anything that is not an ASCII alphanumeric or a Malayalam codepoint is a
 * separator. Scoped to exactly the two scripts this product supports, and
 * deliberately free of \p{...} escapes: this module runs on Hermes in the
 * mobile app as well as on Node.
 *
 * Built from explicit codepoints rather than written as a literal character
 * class. Literal Malayalam glyphs inside a class are ambiguous — several are
 * combining marks, so a range's endpoints would depend on this file's Unicode
 * normalisation form.
 *
 * no-misleading-character-class is disabled deliberately, not worked around.
 * The rule fires because U+0D00 is itself a combining mark, and it is correct
 * that this class cannot match a multi-codepoint grapheme as a unit. That is
 * exactly the intent here: we are classifying each codepoint as Malayalam or
 * not, and a combining mark in the block must count as Malayalam so it survives
 * normalisation attached to its base character.
 */
// eslint-disable-next-line no-misleading-character-class
const SEPARATORS = new RegExp(`[^0-9a-z${MALAYALAM_FIRST}-${MALAYALAM_LAST}]+`, "g");

/**
 * Lowercase, collapse separators to single spaces, and pad the result with a
 * leading and trailing space. The padding is what makes a plain `includes()`
 * behave as a whole-word test, including at the start and end of the string.
 */
export function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(SEPARATORS, " ").trim()} `;
}

const MALAYALAM = new RegExp(`[${MALAYALAM_FIRST}-${MALAYALAM_LAST}]`);

/** True when the string contains at least one Malayalam codepoint. */
const isMalayalam = (s: string): boolean => MALAYALAM.test(s);

/**
 * Term test. Both sides run through normalize(), so a term list can be written
 * naturally — "can't breathe" matches "cant breathe" and "Can't Breathe!" alike.
 *
 * Matching is script-aware, because the two scripts need opposite defaults:
 *
 *   Latin  → whole word. English is space-delimited, and substring matching is
 *            what made "benefits" trip the emergency interrupt.
 *   Malayalam → substring. Malayalam is agglutinative: "പനി" (fever) is a real
 *            prefix of "പനിയുണ്ട്" ("[I] have a fever"), and a whole-word test
 *            would miss the most natural way to type the complaint. Substring
 *            matching is safe here precisely because Malayalam sequences do not
 *            collide with English words.
 *
 * `haystack` must already be normalized; callers normalize once and test many
 * terms against it.
 */
export function matchesTerm(haystack: string, term: string): boolean {
  const needle = normalize(term);
  return isMalayalam(needle) ? haystack.includes(needle.trim()) : haystack.includes(needle);
}

/** Every term from `terms` that occurs as a whole word in `haystack`. */
export function findTerms(haystack: string, terms: readonly string[]): string[] {
  return terms.filter((term) => matchesTerm(haystack, term));
}

/**
 * True when EVERY word in `words` appears somewhere in `haystack`, in any order.
 *
 * Order-insensitive matching, for the cases where English word order varies but
 * the meaning does not: "slurred speech" and "speech is slurred" are the same
 * clinical finding, and a contiguous-phrase test catches only the first. That
 * gap is not academic — it made a textbook stroke description ("her face is
 * drooping and speech is slurred") fail to raise a red flag.
 *
 * Deliberately restricted to emergency.ts and to curated sets of unambiguous
 * content words. Applied to a term containing a common function word it would
 * be far too loose — ["not", "waking"] would fire on "not sleeping well, waking
 * up tired".
 */
export function matchesAllWords(haystack: string, words: readonly string[]): boolean {
  return words.every((word) => matchesTerm(haystack, word));
}
