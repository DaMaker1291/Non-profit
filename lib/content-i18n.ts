// Content translation layer. The genome's 135 concept titles and blurbs are
// authored English; every learner-facing surface resolves them through
// `cn.<id>` / `cb.<id>` dictionary keys. `translator()` already falls back
// en → key, so this module adds the one honest extra step: fall back to the
// genome's authored text when a dictionary genuinely lacks the key (partial
// dictionaries like `bn`), never rendering a raw `cn.place-value` key.
//
// WHAT IS AND IS NOT TRANSLATED, measured rather than remembered. Every one of
// the FIFTEEN dictionaries carries all 135 concept titles and blurbs in its own
// words (`namesNatively` answers that from the dictionaries themselves) — and
// none of them carries a sentence of the TEACHING: a plan's paragraphs, a
// worked explanation, a question prompt, a repair and a hint are authored
// English and have no dictionary key at all. That asymmetry is the honest
// description of this product, and it used to be written down as a stale list
// ("fully authored for en, es, fr, pt, ar, sw, hi") that the dictionaries had
// outgrown. The lesson page now PRINTS which half a learner is about to read
// (`lq.teachNote` / `lq.teachNoteAll`), because a learner who chose Urdu and
// then meets four paragraphs of English has been told something false by the
// translated buttons.
import { DICTS, translator } from "./i18n";
import { CONCEPTS, getConcept } from "./genome";
import { MISCONCEPTIONS_BY_ID, beliefName } from "./misconceptions";
import { figureCaption } from "./figures";
import type { FigureSpec } from "./types";

/** Does this language have THIS PRODUCT'S VOCABULARY — every concept's title
 *  present in its own dictionary?
 *
 *  MEASURED, NOT DECLARED. The old comment in this file listed seven languages
 *  as the translated set; the dictionaries had every one of the fifteen. A list
 *  kept by hand is a claim that rots beside the thing it describes, so the
 *  answer is computed here, and the lesson page and the suite both ask it.
 *
 *  Existence is the test, not difference from English: "DNA" and "pH" are the
 *  same word in several languages, and calling those untranslated would be
 *  wrong in the other direction. */
export function namesNatively(lang: string): boolean {
  if (lang === "en") return true;
  const dict = DICTS[lang];
  if (!dict) return false;
  return CONCEPTS.every((c) => {
    const v = dict[`cn.${c.id}`];
    return typeof v === "string" && v.trim() !== "";
  });
}

export function ctitle(lang: string, conceptId: string): string {
  const c = getConcept(conceptId);
  const t = translator(lang);
  const v = t(`cn.${conceptId}`);
  return v === `cn.${conceptId}` ? (c?.title ?? conceptId) : v;
}

export function cblurb(lang: string, conceptId: string): string {
  const c = getConcept(conceptId);
  const t = translator(lang);
  const v = t(`cb.${conceptId}`);
  return v === `cb.${conceptId}` ? (c?.blurb ?? "") : v;
}

/** Misconception name / coaching: `mc.<id>` / `mcp.<id>` keys, falling back
 *  to the catalogue's authored English when a dictionary lacks them. */
/** The name of ONE tier, in the reader's language, without repeating itself.
 *
 *  A tier carries two names: the system's own (GCSE says "Higher tier", A-Level
 *  says AS "AS") and the translation of its generic band (`lvl.higher`). They
 *  are usually different facts and both are worth the space — but not when they
 *  are the SAME string, which is exactly the case for the two most-sat tiers,
 *  Foundation and Higher. Three surfaces each answered this their own way: the
 *  wizard showed the system's name alone (`name || t(lvl.tier)`), while the
 *  curriculum screen and the Learn index printed both, so a GCSE learner read
 *  "Higher tier · Higher tier" on the screen that names their course.
 *
 *  This is the one owner of that choice, so the same course is named the same
 *  way wherever a learner meets it. */
export function levelLabel(lang: string, tier: string, name?: string): string {
  const generic = translator(lang)(`lvl.${tier}`);
  const own = (name ?? "").trim();
  if (!own) return generic;
  // A dictionary without `lvl.<tier>` renders the key itself; the system's own
  // name is then the honest answer rather than "lvl.degree" on screen.
  if (generic === `lvl.${tier}`) return own;
  return own === generic ? generic : `${generic} · ${own}`;
}

/** A belief's name, in the learner's language.
 *
 *  THE RULE LIVES IN THE CATALOGUE (lib/misconceptions#beliefName) and this is
 *  its language-code face, for the surfaces that hold a `lang` rather than a
 *  translator. Two implementations of "name a belief, never a raw key" is how
 *  one of them ends up showing `mc.sf-sig` on screen, so there is one: this
 *  delegates.
 *
 *  The third argument is a caller's fallback and is now redundant — every call
 *  site passes the catalogue's own name, which is what the rule already falls
 *  back to. It is kept so that the change is a delegation rather than a
 *  28-site refactor; the behaviour is identical for a known id, and for an
 *  unknown one the rule answers with the id, which is the most honest thing
 *  that can be said about a belief the catalogue does not hold. */
export function mcName(lang: string, id: string, fallback?: string): string {
  const named = beliefName(translator(lang), id);
  return named === id ? (fallback ?? id) : named;
}

/** The coaching paragraph for a belief — IN THE READER'S OWN LANGUAGE, or an
 *  empty string when that language has none.
 *
 *  THIS IS THE ONE RULE, and it used to have a loophole. `mcp.<id>` was authored
 *  in NO dictionary (the parity gate made it impossible — see
 *  scripts/verify-engines.mjs), so the old version returned the catalogue's
 *  English `fallback` for every language: a translated misconception name, a dash, and
 *  then a paragraph of English inside an Arabic or Bengali sentence. Eight call
 *  sites used it that way while `mcCoachingNative` enforced the opposite rule
 *  one file over, so the product had two behaviours for one fact.
 *
 *  It reads the dictionary DIRECTLY rather than through `translator()`, because
 *  `translator` falls back to English — the exact splice this function exists to
 *  prevent. English still gets the catalogue text: it IS the source language.
 *
 *  The PILOT's beliefs are now translated into es, fr, pt and de (the four the
 *  project can vouch for — the SET is asserted by the suite rather than counted
 *  here, because a number in a comment is a claim that rots the moment a
 *  belief is added); every other language, and every belief
 *  outside the pilot, still falls to the empty branch — a reader sees the
 *  belief's NAME and no English paragraph under it. Nothing here needs editing
 *  when the next language lands: the line is read from its own dictionary. */
export function mcCoaching(lang: string, id: string, fallback: string): string {
  const own = DICTS[lang]?.[`mcp.${id}`];
  if (typeof own === "string" && own.trim() !== "") return own;
  return lang === "en" ? fallback : "";
}

/** The coaching line for display INSIDE a translated sentence.
 *
 *  Coaching is authored English and is not authored in ANY dictionary yet, so
 *  `mcCoaching` would splice an English paragraph into, say, an Arabic one and
 *  read as one broken mixed-language sentence. This returns "" when there is no
 *  native line, and the caller then omits the clause rather than showing
 *  English in the middle of another language. The misconception's NAME is
 *  translated in every dictionary, so the sentence still names what went wrong.
 *  English reads the catalogue itself — it IS the source text. */
export function mcCoachingNative(lang: string, id: string): string {
  return mcCoaching(lang, id, MISCONCEPTIONS_BY_ID[id]?.coaching ?? "");
}

/** WHAT A QUESTION'S DRAWING SHOWS, in the reader's own language.
 *
 *  The SVG is `aria-hidden`, and the claim that made that safe — "the stem says
 *  everything the picture says" — was measured and was false for one family:
 *  `scatter-correlation` plots the data, so its points appear nowhere in the
 *  stem. This is the sentence that closes the gap, and it is composed from the
 *  spec (`lib/figures.ts#figureCaption`) so its numbers are the drawn ones.
 *
 *  EMPTY STRING WHEN THE LANGUAGE HAS NO LETTERS FOR IT, the same rule as
 *  coaching: a translated page must not print an English sentence under a
 *  translated heading. Unlike coaching, the KEYS are asserted present in all
 *  fifteen dictionaries, so in practice every language answers with its own
 *  sentence — and a kind with no template answers null, which the suite turns
 *  into a failure rather than a silent picture nobody can hear.
 *
 *  Placeholders are filled here rather than in each renderer, so the app and
 *  the offline twin cannot punctuate the same sentence differently. */
export function figureCaptionText(lang: string, spec: FigureSpec): string {
  const c = figureCaption(spec);
  if (!c) return "";
  const own = DICTS[lang]?.[c.key] ?? DICTS.en?.[c.key] ?? "";
  if (!own) return "";
  return own.replace(/\{(\w+)\}/g, (m, k) => (k in c.values ? c.values[k] : m));
}
