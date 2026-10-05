// ─────────────────────────────────────────────────────────────────────────────
// WHAT COUNTS AS RIGHT — one module, so a typed number and a picked option
// cannot be graded by two different rules.
//
// Before this existed the whole platform had exactly one answer type: an index
// into a four-item array, compared with `choiceIndex === q.answer`. That is a
// fine rule and a bad monopoly. A learner who can compute 0.75 from first
// principles was being asked to recognise it among four printed strings, which
// measures recognition of a value, never production of it — and the audit
// (§4.3) recorded the consequence: the entire brief's response-type list was
// unimplemented.
//
// The rule here is deliberately small and PURE (no I/O, no clock, no state) for
// the same reason lib/proof.ts is: this is the sentence "you were right", and it
// is the one thing that must never be computed twice by two callers that could
// disagree. The server grades with it; the static twin grades with it; a
// verification run asserts a typed answer and its equivalent option agree.
//
// THREE HONESTY RULES, each of which a plausible implementation gets wrong:
//
//   1. A TOLERANCE IS PART OF THE QUESTION, not a global constant. 3.14 must be
//      accepted against π and rejected against 3.14 exactly; only the item's
//      author knows which. `tolerance` is required on a numeric item and is
//      never invented by the grader.
//   2. AN UNPARSEABLE ENTRY IS NOT A WRONG ANSWER — it is no answer. `NaN` never
//      reaches the comparison, so "x + 3" is refused as input rather than
//      silently marked incorrect, which would record evidence about a learner's
//      mathematics for a keystroke.
//   3. THE SAME VALUE IS THE SAME ANSWER whichever way it was given. A learner
//      who types 0.75 and one who picks the option "0.75" produce the same
//      verdict and the same identity, so the ledger and the anti-repetition
//      rotation cannot treat them as different work.
// ─────────────────────────────────────────────────────────────────────────────

import type { NumericTolerance, Question } from "./types";

/** Is this item answered by typing a number? Absent `responseKind` = choice. */
export function isNumericQuestion(q: Pick<Question, "responseKind">): boolean {
  return q.responseKind === "numeric";
}

/** Unicode minus, en dash and a few lookalikes a keyboard or a paste can
 *  produce, folded to ASCII so parsing never depends on the glyph. */
function foldSigns(s: string): string {
  return s.replace(/[\u2212\u2013\u2014\uFE63\uFF0D]/g, "-");
}

/**
 * Parse a learner's typed answer into a number, or null when it is not a number.
 *
 * Null is a real outcome and the caller must treat it as "not an answer", never
 * as zero: an empty box, a stray letter, two numbers in one box. Accepting
 * MORE than a bare literal is deliberate — a learner who types "1/2" for a half,
 * "1,000" for a thousand or "0.75 cm" when the unit is already shown has done
 * the mathematics and is not wrong about the keyboard.
 */
export function parseNumericInput(raw: string, unit?: string): number | null {
  if (typeof raw !== "string") return null;
  let s = foldSigns(raw).trim();
  if (!s) return null;

  // A trailing unit the item already declares ("12 cm" → 12, "12m" → 12). Only
  // the declared unit is stripped, so "12 s" is not silently read as 12 metres.
  if (unit) {
    const u = foldSigns(unit).trim();
    if (u) {
      const tail = new RegExp(`\\s*${escapeRe(u)}\\.?$`, "i");
      s = s.replace(tail, "");
    }
  }
  // Thousands separators: "1,000" and "1 000" are the number a learner meant.
  // Removed only BETWEEN digits, so a lone comma is still an error.
  //
  // A PLAIN SPACE IS NOT A SEPARATOR, deliberately. It is the most common way
  // to write two numbers, so treating "3 4" as 34 would silently invent an
  // answer the learner never gave. The narrow no-break space and the non-break
  // space ARE separators — they are what a locale formatter emits — and a
  // comma is, because "3,4" as a decimal is not the convention this bank uses.
  s = s.replace(/(?<=\d)[,\u00A0\u202F](?=\d)/g, "");
  s = s.replace(/^\+/, "").trim();
  if (!s) return null;

  // A simple fraction: 1/2, -3/4. Two integers, no nesting — enough for the
  // answers the bank expresses as fractions, and nothing that could hide an
  // expression the learner has not actually evaluated.
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    return Number(frac[1]) / den;
  }

  // A plain decimal or integer. Anything else (letters, operators, a second
  // number) is NOT an answer.
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Is a typed value the answer, within the item's own tolerance?
 *
 * Absolute slack is checked when given; relative slack when given. An item may
 * carry both (a measurement is "±0.05 or 0.5%, whichever is larger"). With
 * neither, the comparison is exact to floating point, which is the correct
 * meaning for a count.
 */
export function gradeNumeric(given: number, answer: number, tolerance?: NumericTolerance): boolean {
  if (!Number.isFinite(given) || !Number.isFinite(answer)) return false;
  const abs = tolerance?.abs;
  const rel = tolerance?.rel;
  if (abs === undefined && rel === undefined) return given === answer;
  const diff = Math.abs(given - answer);
  const slack = Math.max(abs ?? 0, rel !== undefined ? rel * Math.abs(answer) : 0);
  return diff <= slack;
}

/**
 * A number as a learner should read it: no floating-point noise, no trailing
 * zeros. `0.30000000000000004` is a bug report about our arithmetic, not an
 * answer, and `3.140` claims three decimal places of precision the item never
 * stated.
 */
export function formatNumeric(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  // Twelve significant digits removes IEEE noise; trailing zeros are dropped.
  const s = n.toPrecision(12);
  return String(Number(s));
}

/** The display form of an answer — the item's stated form when it has one. */
export function answerDisplay(q: Question): string {
  return q.tolerance?.display ?? q.choices[q.answer] ?? "";
}

/**
 * THE IDENTITY OF AN ITEM FOR ONE LEARNER: what "the same question again" means.
 *
 * The serve search (lib/questions.ts#generateQuestionNear) uses this to know
 * which items a sitting has already spent, so the prompt is the first half. The
 * second half is the ANSWER, not the option text: an item re-drawn with the
 * options in a different order is the same question and must not be served as
 * new, and a numeric item and its choice-form twin are the same question too.
 * Reading the answer through this one function is what stops two call sites
 * disagreeing about whether a re-draw counts as fresh.
 */
export function answerKey(q: Pick<Question, "prompt" | "answerValue" | "choices" | "answer">): string {
  if (typeof q.answerValue === "number") return `${q.prompt}|${formatNumeric(q.answerValue)}`;
  return `${q.prompt}|${q.choices[q.answer] ?? ""}`;
}

/**
 * Grade a picked option. A numeric item's options carry VALUES, so picking the
 * option "0.75" and typing 0.75 give the same verdict — the rule above, applied
 * in the other direction.
 */
export function gradeChoice(q: Question, choiceIndex: number): boolean {
  if (q.responseKind === "numeric" && Array.isArray(q.choiceValues)) {
    const picked = q.choiceValues[choiceIndex];
    if (typeof picked !== "number") return false;
    const truth = typeof q.answerValue === "number" ? q.answerValue : NaN;
    return gradeNumeric(picked, truth, q.tolerance);
  }
  return choiceIndex === q.answer;
}
