// ─────────────────────────────────────────────────────────────────────────────
// THE BAND'S SIX ITEMS, ON PAPER.
//
// lib/right-level.ts says a band's daily sprint ends with "six items, silent,
// no help, no partner" — and in the room this product is written for there is
// no printer queue, no pupil device and often no electricity, so a sprint with
// no sheet is a plan a teacher cannot run. This module turns a rung into the
// paper: six generated items and a separate key, seeded from the DATE so that
// every band in the room gets the same six on the same day and a different six
// tomorrow, and so the printout can be reproduced by anyone holding the date.
//
// WHY THE SEED IS THE DATE AND NOT THE PUPIL. The six items are the CHECK, not
// practice: two children on the same rung must sit the same six, or their
// results cannot be compared and the move-up rule is measuring the draw. A
// per-pupil seed would make the band sheet a different test for every child —
// the same defect a randomly generated placement instrument would have.
//
// WHY THE ITEMS COME FROM THE BANK AND NOT FROM A NEW AUTHORED SET. The bank is
// already gated (answerable, no duplicate options, prose explanations, option
// bias measured) and the scope is frozen. Generating from it adds no content and
// inherits every existing guarantee.
import { getConcept } from "./genome";
import { generateQuestion } from "./questions";
import { CHECK_ITEMS, rungOf, type RungLevel } from "./right-level";

export const SHEET_VERSION = 1 as const;

/** What a pupil may see: the prompt and its options. No answer, no seed, no
 *  explanation — the key is a different array on a different page of the same
 *  printout, and the two types are separate so a forgotten flag cannot leak. */
export interface SheetItem {
  id: string;
  prompt: string;
  choices: string[];
}

export interface SheetAnswer {
  id: string;
  prompt: string;
  answerIndex: number;
  answer: string;
  explanation: string;
}

export interface BandSheet {
  level: RungLevel;
  conceptId: string | null;
  title: string;
  can: string;
  teach: string;
  items: SheetItem[];
  answers: SheetAnswer[];
  /** Fewer than CHECK_ITEMS could be drawn: reported, never padded by repeating
   *  an item, and the page prints the shortfall rather than a full-looking
   *  sheet that asks the same thing twice. */
  short: boolean;
  /** Rung 0 has no app content: the page prints the counting routine, and this
   *  flag stops it rendering an empty "six items" box. */
  outside: boolean;
}

/** The seed for one band's check on one day. Public and documented because the
 *  printout must be reproducible: teacher A's Tuesday sheet and teacher B's
 *  Tuesday sheet are the same six items. */
export function sheetSeed(level: RungLevel, isoDate: string, attempt: number): string {
  return `right-level:${level}:${isoDate}:${attempt}`;
}

/**
 * One band's sheet for one date.
 *
 * Draws until it has `count` DISTINCT items, with a bounded number of attempts.
 * A generator with a small catalogue can return the same item twice; the sheet
 * must not, because two identical items make a 6-item check worth 5.
 */
export function bandSheet(level: RungLevel, isoDate: string, count = CHECK_ITEMS): BandSheet {
  const rung = rungOf(level);
  const conceptId = rung.conceptIds[0] ?? null;
  const title = conceptId ? (getConcept(conceptId)?.title ?? conceptId) : "Counting (not in this app)";
  const base: BandSheet = {
    level,
    conceptId,
    title,
    can: rung.can,
    teach: rung.teach,
    items: [],
    answers: [],
    short: false,
    outside: conceptId === null,
  };
  if (!conceptId) return base;

  const wanted = Math.max(1, Math.min(20, Math.floor(count)));
  const items: SheetItem[] = [];
  const answers: SheetAnswer[] = [];
  const seen = new Set<string>();
  for (let attempt = 0; attempt < wanted * 6 && items.length < wanted; attempt += 1) {
    const q = generateQuestion(conceptId, sheetSeed(level, isoDate, attempt));
    if (!q || seen.has(q.id)) continue;
    seen.add(q.id);
    items.push({ id: q.id, prompt: q.prompt, choices: q.choices.slice() });
    answers.push({
      id: q.id,
      prompt: q.prompt,
      answerIndex: q.answer,
      answer: q.choices[q.answer] ?? "",
      explanation: q.explanation ?? "",
    });
  }
  return { ...base, items, answers, short: items.length < wanted };
}

/** A band as the printout names it: a rung and a headcount. */
export interface BandCount {
  level: RungLevel;
  count: number;
}

const MAX_COUNT = 200;

/**
 * Read the printout's own query (`?b=1:12,2:25,3:18`).
 *
 * Strict on purpose: a rung outside 0–5 is DROPPED rather than clamped, because
 * clamping a typo to a real rung would print a sheet for children who are not
 * on it. A count is clamped to 1..200 — a headcount is a quantity, not an
 * identity, and 0 pupils needs no sheet.
 */
export function parseBands(raw: string | undefined | null): BandCount[] {
  if (!raw) return [];
  const out: BandCount[] = [];
  const seen = new Set<RungLevel>();
  for (const part of raw.split(",")) {
    const [levelRaw, countRaw] = part.split(":");
    if (levelRaw === undefined || countRaw === undefined) continue;
    const level = Number(levelRaw.trim());
    const count = Number(countRaw.trim());
    if (!Number.isInteger(level) || level < 0 || level > 5) continue;
    if (!Number.isFinite(count) || count <= 0) continue;
    const rung = level as RungLevel;
    if (seen.has(rung)) continue;
    seen.add(rung);
    out.push({ level: rung, count: Math.min(MAX_COUNT, Math.round(count)) });
  }
  return out.sort((a, b) => a.level - b.level);
}

/** The inverse, so a surface can build the link without writing the format. */
export function bandsQuery(bands: readonly BandCount[]): string {
  return bands
    .filter((b) => Number.isInteger(b.level) && b.level >= 0 && b.level <= 5 && b.count > 0)
    .sort((a, b) => a.level - b.level)
    .map((b) => `${b.level}:${Math.min(MAX_COUNT, Math.round(b.count))}`)
    .join(",");
}

export function bandSheets(bands: readonly BandCount[], isoDate: string, count = CHECK_ITEMS): BandSheet[] {
  return bands.map((b) => bandSheet(b.level, isoDate, count));
}

/** A date the printout accepts: `YYYY-MM-DD`, and nothing else. An invalid one
 *  falls back to the caller's default rather than seeding a sheet from garbage. */
export function sheetDate(raw: string | undefined | null, fallback: string): string {
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}
