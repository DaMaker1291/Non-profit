import type { AssessmentItem } from "./lesson-contract";

// ─────────────────────────────────────────────────────────────────────────────
// GRADING A LESSON'S OWN ASSESSMENT.
//
// A lesson assessment is not a bank item: it has no generated tolerance and no
// distractors, so it needs its own rule, and that rule has to be small enough to
// be obviously correct.
//
// WHAT THIS DELIBERATELY DOES NOT DO. It does not mark prose. An item with no
// `check` returns null and the page offers the marking criteria for the learner
// to judge their own answer against — which is what a teacher does with a
// constructed response, and what lib/peer-review.ts proves a word-matching
// scorer cannot replace.
//
// The normalisation below is for TYPED answers and is deliberately conservative:
// it folds case, spacing, a trailing full stop, a British or American thousands
// comma, the Unicode minus sign and the multiplication signs, because a learner
// typing "3,040" has given the right answer and should not be marked wrong for
// the keyboard. It does not strip units, because in physics the unit IS part of
// the answer.
// ─────────────────────────────────────────────────────────────────────────────

/** One answer, in the form the comparison uses. */
export function normaliseAnswer(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/\u2212/g, "-") // Unicode minus
    .replace(/[×✕✖]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/(\d),(\d{3})\b/g, "$1$2") // 3,040 → 3040
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!;]+$/, "")
    .toLowerCase();
}

/** True / false when the item is gradable, null when it is not.
 *
 *  Null is a real answer: a constructed response has no key, and pretending the
 *  model answer's words are the key would mark a correct explanation wrong. */
export function gradeAuthoredAssessment(item: AssessmentItem, raw: string): boolean | null {
  // An unscored reflection has no mark even if a key was accidentally added.
  // The exclusion is structural, not a UI convention.
  if (item.scored === false) return null;
  if (!item.check) return null;
  const given = normaliseAnswer(raw);
  if (!given) return false;
  return item.check.accepted.some((accepted) => normaliseAnswer(accepted) === given);
}

/** Whether this assessment can be graded by the server at all. The page uses it
 *  to decide between an answer box and the self-marking criteria. */
export function isGradable(item: AssessmentItem): boolean {
  if (item.scored === false) return false;
  return Array.isArray(item.check?.accepted) && item.check!.accepted.length > 0;
}
