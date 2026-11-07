// ─────────────────────────────────────────────────────────────────────────────
// A RECOGNITION ITEM, RE-ASKED AS PRODUCTION — but only when the answer really
// has the shape the new control asks for.
//
// A four-option question whose options are all `3/4`, `5/6`, … measures whether
// a learner RECOGNISES the right fraction among four. Asking for the numerator
// and denominator instead measures whether they can produce it, which is the
// achievement the lesson is about. The conversion is honest only when it is
// exact: every option must be the same kind of value, the key must parse, and
// the item must carry no per-option note (a note explains a WRONG OPTION, and a
// typed answer has no option to explain).
//
// THE CONVERSION IS APPLIED BY THE PRACTICE SERVE, NOT BY THE GENERATOR. Papers,
// the diagnostic and the published static twin are multiple-choice instruments
// and must keep the four-option projection they were built for; the server route
// asks for constructed responses explicitly (lib/operations.ts#ServeInput).
// ─────────────────────────────────────────────────────────────────────────────

import { parseFractionText, parsePairText } from "./answer";
import type { Question } from "./types";

/** A plain number, with no unit, label or prose around it. The comma-separated
 *  forms the bank uses for thousands are deliberately not accepted: converting
 *  an item whose options are formatted differently from its answer would make
 *  the typed comparison disagree with the printed one. */
const PLAIN_NUMBER = /^-?\d+(?:\.\d+)?$/;

/** Which constructed answer this item can honestly be re-asked as, or null. */
export function structuredResponseKind(q: Question): "fraction" | "pair" | "numeric" | null {
  // An item that already declares a constructed kind is not converted again.
  if (q.responseKind && q.responseKind !== "choice") return null;
  if (!Array.isArray(q.choices) || q.choices.length !== 4) return null;
  // A per-option note is written for a distractor a learner can PICK. Typing an
  // answer never picks one, so the note would be authored and unreachable.
  if ((q.choiceNotes ?? []).some((note) => typeof note === "string" && note.trim())) return null;
  const options = q.choices.map((choice) => String(choice ?? "").trim());
  const answer = options[q.answer];
  if (!answer) return null;
  if (options.every((option) => parseFractionText(option) !== null)) return "fraction";
  if (options.every((option) => parsePairText(option) !== null)) return "pair";
  // A NUMBER, TYPED RATHER THAN PICKED. Conversion is exact because every
  // option is a bare number and the key parses to the same value; the tolerance
  // is a hairline, not a guess. This is the largest honest reduction of
  // multiple-choice practice available from the existing bank, and it costs no
  // content: the item is the same question, answered by production.
  if (options.every((option) => PLAIN_NUMBER.test(option))) return "numeric";
  return null;
}

/** The item with its constructed kind and exact key attached; unchanged when
 *  the options are not uniformly a fraction or a pair. */
export function withStructuredResponse(q: Question): Question {
  const kind = structuredResponseKind(q);
  if (!kind) return q;
  const answer = String(q.choices[q.answer] ?? "").trim();
  if (kind === "fraction") {
    const fraction = parseFractionText(answer);
    return fraction ? { ...q, responseKind: "fraction", answerFraction: fraction } : q;
  }
  if (kind === "pair") {
    const pair = parsePairText(answer);
    return pair ? { ...q, responseKind: "pair", answerPair: pair } : q;
  }
  const value = Number(answer);
  // No `display` on the tolerance: a served view keeps `tolerance`, and a
  // display string there would be the answer printed beside the box.
  return Number.isFinite(value)
    ? { ...q, responseKind: "numeric", answerValue: value, tolerance: { abs: 1e-9 } }
    : q;
}
