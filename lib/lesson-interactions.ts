import type { AssessmentItem } from "./lesson-contract";
import { normaliseAnswer } from "./lesson-assessment";
import type { StructuredCriterionMark, StructuredGrade } from "./structured-items";

// ─────────────────────────────────────────────────────────────────────────────
// THE FOUR NON-PROS E ASSESSMENT FORMATS, MARKED BY ONE PURE FUNCTION.
//
// Gap-fill, matching, ordering and diagram labelling are different ways to
// collect an answer, but they share one rule: each authored point is marked
// independently, the mark is traceable to that point, and partial credit is a
// real score with a maximum. They therefore return the SAME StructuredGrade the
// structured-item marker returns, so /api/progress and the evidence ledger do
// not need a second path.
//
// The functions here never infer a mark from a keyword. A gap is compared as a
// WHOLE answer after conservative normalisation; a matching pair is the pair
// the learner chose; an ordering mark belongs to a position; a diagram mark
// belongs to the label the learner assigned. A blank is unanswered, not wrong,
// and an invalid id is refused before anything is recorded.
// ─────────────────────────────────────────────────────────────────────────────

export type InteractionPayload = readonly string[];

function criterion(
  id: string,
  label: string,
  correct: boolean,
  why: string,
  given?: string,
  expected?: string,
): StructuredCriterionMark {
  const detail = given && given.trim()
    ? expected
      ? `${why} You gave “${given.trim()}”; the authored answer is “${expected}”.`
      : `${why} You gave “${given.trim()}”.`
    : `${why} Nothing was entered.`;
  return {
    id,
    kind: "evidence",
    label,
    awarded: correct ? 1 : 0,
    marks: 1,
    met: correct,
    why: detail,
  };
}

function gradeOf(criteria: readonly StructuredCriterionMark[], answered: number): StructuredGrade {
  const marks = criteria.reduce((n, c) => n + c.marks, 0);
  const awarded = criteria.reduce((n, c) => n + c.awarded, 0);
  return {
    awarded,
    marks,
    answered,
    parts: [{
      partId: "response",
      awarded,
      marks,
      correct: awarded === marks,
      given: "",
      working: "",
      criteria: [...criteria],
    }],
  };
}

function validIds(payload: InteractionPayload, ids: readonly string[]): boolean {
  if (payload.length !== ids.length) return false;
  const seen = new Set<string>();
  for (const value of payload) {
    if (typeof value !== "string" || !ids.includes(value) || seen.has(value)) return false;
    seen.add(value);
  }
  return true;
}

/** Mark a gap-fill item. One answer per gap, in the authored gap order. */
export function gradeGapFill(item: AssessmentItem, answers: InteractionPayload): StructuredGrade | null {
  const spec = item.gaps;
  if (!spec || !spec.gaps.length || answers.length !== spec.gaps.length) return null;
  if (answers.some((answer) => typeof answer !== "string")) return null;
  const criteria = spec.gaps.map((gap, index) => {
    const given = normaliseAnswer(answers[index] ?? "");
    const accepted = gap.accepted.map(normaliseAnswer);
    const correct = given.length > 0 && accepted.includes(given);
    return criterion(
      `gap-${gap.id}`,
      gap.label,
      correct,
      gap.feedback ?? "This gap is marked as a whole answer, not by whether it contains a keyword.",
      answers[index],
      gap.accepted[0],
    );
  });
  return gradeOf(criteria, answers.filter((answer) => answer.trim()).length);
}

/** Mark a matching item. One right-hand id per left-hand id, in left order. */
export function gradeMatching(item: AssessmentItem, answers: InteractionPayload): StructuredGrade | null {
  const spec = item.matching;
  if (!spec || spec.left.length < 2) return null;
  const rightIds = spec.right.map((right) => right.id);
  if (answers.length !== spec.left.length || answers.some((answer) => answer && !rightIds.includes(answer))) return null;
  let answered = 0;
  const criteria = spec.left.map((left, index) => {
    const given = answers[index] ?? "";
    if (given) answered += 1;
    const expected = spec.pairs[left.id];
    const chosen = spec.right.find((right) => right.id === given);
    const wanted = spec.right.find((right) => right.id === expected);
    return criterion(
      `match-${left.id}`,
      `${left.text} → ${wanted?.text ?? expected}`,
      given === expected,
      "Each pairing earns its own mark.",
      chosen?.text,
      wanted?.text,
    );
  });
  return gradeOf(criteria, answered);
}

/** Mark an ordering item. Each item earns its mark only in the correct position. */
export function gradeOrdering(item: AssessmentItem, answers: InteractionPayload): StructuredGrade | null {
  const spec = item.ordering;
  if (!spec || spec.items.length < 3) return null;
  const itemIds = spec.items.map((entry) => entry.id);
  if (!validIds(answers, itemIds)) return null;
  const criteria = spec.correctOrder.map((id, position) => {
    const entry = spec.items.find((candidate) => candidate.id === id);
    const givenId = answers[position] ?? "";
    const given = spec.items.find((candidate) => candidate.id === givenId);
    return criterion(
      `order-${id}`,
      `Position ${position + 1}: ${entry?.text ?? id}`,
      givenId === id,
      "One mark is awarded for each item placed in its correct position.",
      given ? `${position + 1}. ${given.text}` : undefined,
      `${position + 1}. ${entry?.text ?? id}`,
    );
  });
  return gradeOf(criteria, answers.length);
}

/** Mark a diagram-labelling item. One target id per label, in label order. */
export function gradeDiagram(item: AssessmentItem, answers: InteractionPayload): StructuredGrade | null {
  const spec = item.diagram;
  if (!spec || spec.labels.length < 2) return null;
  const targetIds = spec.targets.map((target) => target.id);
  if (answers.length !== spec.labels.length || answers.some((answer) => answer && !targetIds.includes(answer))) return null;
  let answered = 0;
  const criteria = spec.labels.map((label, index) => {
    const given = answers[index] ?? "";
    if (given) answered += 1;
    const chosen = spec.targets.find((target) => target.id === given);
    const wanted = spec.targets.find((target) => target.id === label.targetId);
    const describe = (id?: string) => {
      const position = spec.targets.findIndex((target) => target.id === id);
      return position >= 0 ? `position ${position + 1}` : id ?? "";
    };
    return criterion(
      `diagram-${label.id}`,
      `${label.text} → ${describe(label.targetId)}`,
      given === label.targetId,
      "Each label earns its own mark.",
      describe(given),
      describe(label.targetId),
    );
  });
  return gradeOf(criteria, answered);
}

/** The single entry point the lesson-check route uses. */
export function gradeLessonInteraction(
  item: AssessmentItem,
  answers: InteractionPayload,
): StructuredGrade | null {
  if (item.gaps) return gradeGapFill(item, answers);
  if (item.matching) return gradeMatching(item, answers);
  if (item.ordering) return gradeOrdering(item, answers);
  if (item.diagram) return gradeDiagram(item, answers);
  return null;
}
