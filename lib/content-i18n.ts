// Content translation layer. The genome's 135 concept titles and blurbs are
// authored English; every learner-facing surface resolves them through
// `cn.<id>` / `cb.<id>` dictionary keys. `translator()` already falls back
// en → key, so this module adds the one honest extra step: fall back to the
// genome's authored text when a dictionary genuinely lacks the key (partial
// dictionaries like `bn`), never rendering a raw `cn.place-value` key.
//
// TIERED CONTENT LANGUAGES: titles, blurbs and misconception names are fully
// authored for en, es, fr, pt, ar, sw, hi (the audit-recommended set). Other
// dictionaries get a fully native UI with English teaching content — visible,
// honest fallback, never a raw key and never a fake translation.
import { translator } from "./i18n";
import { getConcept } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";

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

export function mcName(lang: string, id: string, fallback: string): string {
  const v = translator(lang)(`mc.${id}`);
  return v === `mc.${id}` ? fallback : v;
}

export function mcCoaching(lang: string, id: string, fallback: string): string {
  const v = translator(lang)(`mcp.${id}`);
  return v === `mcp.${id}` ? fallback : v;
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
  if (lang === "en") return MISCONCEPTIONS_BY_ID[id]?.coaching ?? "";
  const v = translator(lang)(`mcp.${id}`);
  return v === `mcp.${id}` ? "" : v;
}
