// ─────────────────────────────────────────────────────────────────────────────
// A CONSTRUCTED-RESPONSE ITEM, WITH A MARK SCHEME THAT CAN BE AUDITED.
//
// Every paper item before this one was four options with one right answer, and
// every mark was all-or-nothing. This module holds the first vertical slice of
// the other kind, and its rules are small enough to state once and test:
//
//   * TWO CRITERIA PER PART: a METHOD mark (M) and an ANSWER mark (A). Total
//     marks are the sum of the criteria, asserted at module load, so the paper's
//     declared total cannot drift.
//   * A METHOD MARK NEEDS THE METHOD TO BE SHOWN. The learner types their working
//     into its own box, and the mark is earned by matching an authored form of a
//     correct method. A method this engine cannot see is a method it does not
//     award — and it never infers working from a right answer.
//   * A METHOD MARK SURVIVES A WRONG ANSWER. `30 ÷ 12` written with the answer
//     `2.5` earns the method mark and loses the answer mark, which is the whole
//     point of partial credit: the reasoning was right and the rounding was not.
//   * AN ANSWER MARK IS THE VALUE OR AN AUTHORED EQUIVALENT, and a measurement
//     part's unit is part of the answer. `30` is not `30 m²`.
//   * NO FOLLOW-THROUGH, NO "CONSISTENT WITH THEIR WORKING" MARKS YET. AQA's
//     scheme has them; this engine does not, and the item says so rather than
//     pretending otherwise.
//
// Adding a second item means authoring its arithmetic and its accepted forms; it
// does not mean writing a new marking engine.
// ─────────────────────────────────────────────────────────────────────────────

import { gradeNumeric } from "./answer";
import type { NumericTolerance } from "./types";

/** One method criterion. `accept` is the list of WORKING forms that earn it,
 *  normalised before comparison (case, spaces, × * and £ are folded) — authored,
 *  so accepting a method is a decision somebody made and can review. */
export interface StructuredMethod {
  id: string;
  marks: number;
  /** What the learner is asked to show, in the working box's own label. */
  prompt: string;
  accept: string[];
  /** The method in words, for the feedback. */
  label: string;
}

export interface StructuredPart {
  /** Stable id inside the item, e.g. "a". */
  id: string;
  prompt: string;
  /** TOTAL marks for the part: the method marks plus the answer marks. */
  marks: number;
  /** The truth the answer mark is checked against. */
  answer: number;
  tolerance?: NumericTolerance;
  /** Other PRINTED forms that are the same answer, compared after normalisation. */
  accepted?: string[];
  /** The unit the answer is in, when the part is a measurement. */
  unit?: string;
  /** true = the unit must be present for the answer mark. */
  unitRequired?: boolean;
  /** The method criterion, when the part has one. Its `marks` are a subset of
   *  `marks`; the remainder is the answer mark. */
  method?: StructuredMethod;
  explanation: string;
}

export interface StructuredItem {
  id: string;
  conceptId: string;
  title: string;
  intro: string;
  /** What this item does NOT assess, stated on the item rather than discovered. */
  note: string;
  difficulty: number;
  parts: StructuredPart[];
}

export interface StructuredCriterionMark {
  id: string;
  kind: "method" | "accuracy";
  label: string;
  awarded: number;
  marks: number;
  met: boolean;
  /** Why it was or was not met, in words — the feedback IS the mark scheme. */
  why: string;
}

export interface StructuredPartMark {
  partId: string;
  awarded: number;
  marks: number;
  /** True only when every criterion in the part was met. */
  correct: boolean;
  given: string;
  working: string;
  criteria: StructuredCriterionMark[];
}

export interface StructuredGrade {
  parts: StructuredPartMark[];
  awarded: number;
  marks: number;
  /** How many parts carried any input (answer OR working). Zero means the
   *  question was not answered at all — which is NOT evidence of a wrong belief,
   *  and the route's ledger depends on telling those apart. */
  answered: number;
}

// ── The first item ──────────────────────────────────────────────────────────

const LAWN_FEED: StructuredItem = {
  id: "sf-lawn-feed",
  conceptId: "area-perimeter",
  title: "Lawn feed",
  intro:
    "A rectangular lawn is 7.5 m long and 4 m wide.\n\n" +
    "Each part is worth 2 marks: 1 for the method you show, and 1 for the answer.",
  note:
    "The method mark is earned by the working you type and is kept even when the answer is wrong — " +
    "OpenMind cannot award a method it cannot see, and it does not infer your working from a right answer. " +
    "This is a two-rung scheme: follow-through marks are not implemented.",
  difficulty: 0.55,
  parts: [
    {
      id: "a",
      prompt: "Work out the area of the lawn. Give your answer in m².",
      marks: 2,
      answer: 30,
      unit: "m²",
      unitRequired: true,
      accepted: ["30 m²", "30 m2", "30 square metres"],
      method: {
        id: "a:M1",
        marks: 1,
        prompt: "Show the calculation you used",
        accept: ["7.5 × 4", "7.5 × 4 = 30", "7.5*4", "7.5 x 4", "7.5x4=30"],
        label: "length × width",
      },
      explanation:
        "Area of a rectangle is length × width: 7.5 × 4 = 30. Area is measured in square " +
        "units, so the answer is 30 m² — a bare 30 names a length, not a region.",
    },
    {
      id: "b",
      prompt:
        "A bag of lawn feed covers 12 m². How many bags are needed to cover the whole lawn?",
      marks: 2,
      answer: 3,
      accepted: ["3 bags"],
      method: {
        id: "b:M1",
        marks: 1,
        prompt: "Show the division you used",
        accept: ["30 ÷ 12", "30 ÷ 12 = 2.5", "30/12", "30 ÷ 12 = 2.5, so 3 bags"],
        label: "area ÷ coverage",
      },
      explanation:
        "30 ÷ 12 = 2.5, so two bags cover only 24 m² and leave 6 m² bare. You cannot buy half " +
        "a bag, so the number of bags must round UP to 3 — 2.5 is the division, not the answer.",
    },
    {
      id: "c",
      prompt: "Each bag costs £8.50. Work out the total cost of the bags needed.",
      marks: 2,
      answer: 25.5,
      tolerance: { abs: 0.001, display: "£25.50" },
      accepted: ["£25.50", "£25.5", "25.50 pounds", "25.5 pounds"],
      method: {
        id: "c:M1",
        marks: 1,
        prompt: "Show the multiplication you used",
        accept: ["3 × 8.50", "3 × £8.50", "3*8.5", "3 x 8.50", "3 × 8.5 = 25.5"],
        label: "bags × price",
      },
      explanation:
        "Three bags at £8.50 each: 3 × 8.50 = 25.50, so the total is £25.50. Paying for 2.5 " +
        "bags gives £21.25 and buys feed that does not exist, so it cannot cover the lawn.",
    },
  ],
};

export const STRUCTURED_ITEMS: StructuredItem[] = [LAWN_FEED];

/** Total marks, summed from the parts — the one number a paper slot checks. */
export function structuredMarks(item: StructuredItem): number {
  return item.parts.reduce((n, p) => n + p.marks, 0);
}

export function structuredById(id: string): StructuredItem | null {
  return STRUCTURED_ITEMS.find((s) => s.id === id) ?? null;
}

// AUTHORING GUARDS, at module load and therefore at build and in every test: a
// malformed scheme must fail here rather than mark a learner against it.
for (const item of STRUCTURED_ITEMS) {
  if (item.parts.length === 0) throw new Error(`structured item ${item.id}: no parts`);
  if (new Set(item.parts.map((p) => p.id)).size !== item.parts.length) {
    throw new Error(`structured item ${item.id}: duplicate part id`);
  }
  for (const p of item.parts) {
    if (!Number.isInteger(p.marks) || p.marks < 1) {
      throw new Error(`structured item ${item.id}#${p.id}: marks must be a positive integer`);
    }
    if (!Number.isFinite(p.answer)) {
      throw new Error(`structured item ${item.id}#${p.id}: answer is not a finite number`);
    }
    if (p.unitRequired && !p.unit) {
      throw new Error(`structured item ${item.id}#${p.id}: a required unit has no unit`);
    }
    if (p.method && (!Number.isInteger(p.method.marks) || p.method.marks < 1 || p.method.marks >= p.marks)) {
      throw new Error(`structured item ${item.id}#${p.id}: a method mark must be at least 1 and leave an answer mark`);
    }
    if (p.method && p.method.accept.length === 0) {
      throw new Error(`structured item ${item.id}#${p.id}: a method criterion accepts no working`);
    }
  }
}

// ── Marking ─────────────────────────────────────────────────────────────────

/** What a learner typed, in a form two spellings can be compared in: trimmed,
 *  lower case, with the typographic minus and the non-breaking spaces a phone
 *  keyboard produces folded to their ASCII equivalents. */
export function normaliseTyped(raw: string): string {
  return String(raw ?? "")
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/[\u00a0\u2009\u202f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** WORKING, normalised harder than an answer: case and every space go, and the
 *  multiplication signs a keyboard offers collapse to one, so `7.5 × 4`,
 *  `7.5*4` and `7.5 x 4` are one method rather than three. */
export function normaliseWorking(raw: string): string {
  return normaliseTyped(raw)
    .replace(/[×✕*]/g, "x")
    .replace(/[£$]/g, "")
    .replace(/[,\s]/g, "");
}

/** The spellings of a unit a learner may type. "m²" is one keystroke away from
 *  "m2", and both name the same thing. */
function unitForms(unit: string): string[] {
  const u = normaliseTyped(unit);
  return [...new Set([u, u.replace(/²/g, "2"), u.replace(/²/g, "^2"), u.replace(/³/g, "3")])];
}

function carriesUnit(raw: string, unit: string): boolean {
  const s = normaliseTyped(raw);
  return unitForms(unit).some((f) => s.endsWith(f));
}

function stripUnit(raw: string, unit: string): string {
  let s = normaliseTyped(raw);
  for (const f of unitForms(unit).sort((a, b) => b.length - a.length)) {
    if (s.endsWith(f)) { s = s.slice(0, -f.length).trim(); break; }
  }
  return s;
}

/** A typed answer as a number, with thousands separators tolerated and a leading
 *  currency symbol dropped. Null when it is not a number at all. */
export function parseTypedNumber(raw: string, unit?: string): number | null {
  let s = unit ? stripUnit(raw, unit) : normaliseTyped(raw);
  s = s.replace(/[£$]/g, "").replace(/,/g, "").trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/**
 * Mark one item. Each part is independent, and inside a part each CRITERION is
 * independent: a shown method earns its mark whatever the answer says.
 */
export function gradeStructuredParts(
  partsIn: StructuredPart[],
  given: string[],
  working: string[] = [],
): StructuredGrade {
  const parts: StructuredPartMark[] = partsIn.map((p, i) => {
    const raw = typeof given?.[i] === "string" ? given[i] : "";
    const shown = typeof working?.[i] === "string" ? working[i] : "";
    const typed = normaliseTyped(raw);
    const methodMarks = p.method?.marks ?? 0;
    const answerMarks = p.marks - methodMarks;

    // ── The method criterion ────────────────────────────────────────────────
    const methodWork = normaliseWorking(shown);
    const methodMet = !!p.method && methodWork !== ""
      && p.method.accept.some((a) => normaliseWorking(a) === methodWork);
    const methodWhy = !p.method ? "" : methodMet
      ? `The working shows ${p.method.label}.`
      : methodWork === ""
        ? "No working was shown, so the method mark could not be awarded."
        : `The working does not match a form of ${p.method.label} this question can check.`;

    // ── The answer criterion ────────────────────────────────────────────────
    const accepted = (p.accepted ?? []).some((a) => normaliseTyped(a) === typed);
    const value = parseTypedNumber(raw, p.unit);
    const numeric = value !== null && gradeNumeric(value, p.answer, p.tolerance);
    // THE UNIT GATE belongs to the ANSWER criterion, and it survives the split
    // from the method criterion: `30` with the unit missing is not `30 m²`, and
    // a scheme that accepts the bare number marks a unit error as correct.
    const unitOk = !p.unitRequired || !p.unit || carriesUnit(raw, p.unit);
    const answerCorrect = typed !== "" && unitOk && (accepted || numeric);
    const answerWhy = typed === ""
      ? "No answer was given."
      : answerCorrect
        ? "The answer is correct."
        : p.unitRequired && p.unit && !carriesUnit(raw, p.unit)
          ? `The answer is missing its unit (${p.unit}).`
          : "The answer is not correct.";

    const criteria: StructuredCriterionMark[] = [];
    if (p.method) {
      criteria.push({
        id: p.method.id, kind: "method", label: p.method.label,
        awarded: methodMet ? p.method.marks : 0, marks: p.method.marks,
        met: methodMet, why: methodWhy,
      });
    }
    criteria.push({
      id: `${p.id}:A1`, kind: "accuracy", label: "correct answer",
      awarded: answerCorrect ? answerMarks : 0, marks: answerMarks,
      met: answerCorrect, why: answerWhy,
    });

    const awarded = Math.min(criteria.reduce((n, c) => n + c.awarded, 0), p.marks);
    return {
      partId: p.id, awarded, marks: p.marks,
      correct: criteria.every((c) => c.met),
      given: raw, working: shown, criteria,
    };
  });

  const awarded = parts.reduce((n, p) => n + p.awarded, 0);
  const marks = parts.reduce((n, p) => n + p.marks, 0);
  return {
    parts: parts.map((p) => ({ ...p, awarded: Math.min(p.awarded, p.marks) })),
    awarded: Math.min(awarded, marks),
    marks,
    answered: parts.filter((p) => p.given !== "" || p.working !== "").length,
  };
}

/** The item-shaped door, for a caller that holds the item itself. The key stores
 *  the parts, so marking a SAVED sitting goes through `gradeStructuredParts` and
 *  never needs the registry. */
export function gradeStructuredItem(item: StructuredItem, given: string[], working: string[] = []): StructuredGrade {
  return gradeStructuredParts(item.parts, given, working);
}
