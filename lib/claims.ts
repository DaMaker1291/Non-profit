// ─────────────────────────────────────────────────────────────────────────────
// THE SELF-CLAIMS — every number OpenMind publishes about itself, computed from
// the code that makes it true.
//
// THE FAILURE THIS FILE EXISTS TO END, OBSERVED IN THE SHIPPED BUILD. The
// catalogue declared 53 misconception patterns. The copy in all fifteen
// dictionaries said 43, and the gate asserted only
//
//     ok(misconceptions.MISCONCEPTIONS.length >= 40, ...)
//
// which is a FLOOR, not a claim check — both numbers passed it. So the reader
// was told 43 about a system that had 53, and nothing anywhere could notice,
// because the claim and the fact were two separate literals that no test held
// together. `home.languages` carried the same defect ("15 languages" typed
// fifteen times) and app/about/page.tsx typed the subject count as a bare `5`.
//
// THE RULE, and the whole reason this module exists:
//
//     A public quantitative claim is never typed into a dictionary.
//
// So a count is a PLACEHOLDER in the sentence and a FACT here. `claim()` fills
// one from the other, which makes drift impossible rather than merely
// discouraged: the sentence moves when the catalogue moves, and a placeholder
// that somehow cannot be filled renders as `{misconceptions}` — visibly broken
// to a reviewer — instead of silently reading a plausible, wrong number.
//
// The numerals are rendered in the digits CLDR gives that language, which is
// not the same as the digits a dictionary author would type by hand. Persian
// and Bengali get ۵۳ and ৫৩; Urdu, whose dictionaries spelled "۴۳", is given
// Latin digits by CLDR — so the rendered numeral can differ from the hand-typed
// one it replaces. That is the intended trade: a count whose SCRIPT follows the
// locale, and whose VALUE follows the catalogue, beats a count that is correct
// in neither. `toLocaleString` is guarded because a bad locale must not take a
// page down.
//
// scripts/verify-engines.mjs holds this to both ends: every dictionary must
// carry the placeholder, and `claim()` must resolve it in every language.
import { LANGS, fill, translator } from "./i18n";
import { CONCEPTS } from "./genome";
import { MISCONCEPTIONS } from "./misconceptions";
import { SUBJECT_IDS } from "./subjects";

/** The numbers, as this language writes them. */
export function claimFacts(lang: string): Record<string, string> {
  const n = (value: number): string => {
    try {
      return value.toLocaleString(lang);
    } catch {
      return String(value);
    }
  };
  return {
    misconceptions: n(MISCONCEPTIONS.length),
    concepts: n(CONCEPTS.length),
    languages: n(LANGS.length),
    subjects: n(SUBJECT_IDS.length),
  };
}

/** A translated sentence with its numbers filled from the source of truth.
 *
 *  `translator()` already falls back lang → en → key, so a dictionary missing
 *  the sentence is a visible key rather than a blank paragraph. */
export function claim(key: string, lang = "en"): string {
  return fill(translator(lang)(key), claimFacts(lang));
}

/** The raw counts, for a surface that composes its own sentence (app/about
 *  prints "135 concepts · 53 misconceptions · 5 subjects · 15 languages" as
 *  figures, not as translated phrases). Same source, so the two forms cannot
 *  disagree. */
export const CLAIM_COUNTS = {
  misconceptions: MISCONCEPTIONS.length,
  concepts: CONCEPTS.length,
  languages: LANGS.length,
  subjects: SUBJECT_IDS.length,
} as const;
