// ── AUTHORED ASSESSMENT ON THE DEVICE ───────────────────────────────────────
//
// An offline pack may carry the deterministic parts of a lesson's authored
// assessment. The rule is the same one the online route uses:
//
//   · a format with an authored key is marked locally;
//   · prose is not given a machine score;
//   · code is not executed by this path;
//   · every point is marked independently and the score is traceable to its
//     criterion.
//
// The pack contains the authored item because the device has no server to ask
// for the key. It is learner-scoped, cleared on hand-back, and never included in
// the public content mirror or a teacher key route.
import type { AssessmentItem, AuthoredLesson } from "./lesson-contract";
import { gradeAuthoredAssessment, gradeStructuredAssessment } from "./lesson-assessment";
import { gradeLessonInteraction } from "./lesson-interactions";
import type { StructuredGrade } from "./structured-items";

/** What the device can mark without a model, a teacher or a code runner. */
export function offlineAssessmentItems(lesson: AuthoredLesson): AssessmentItem[] {
  return lesson.assessment.filter((item) => {
    if (item.gaps || item.matching || item.ordering || item.diagram) return true;
    if (item.structured) return true;
    // A short-answer item without a `check` is a constructed response in all
    // but name; the online route refuses it too.
    return item.kind === "short-answer" && !!item.check?.accepted.length;
  });
}

export interface OfflineMark {
  correct: boolean;
  /** Null for a short-answer item: the online route records right/wrong, not a
   *  fabricated mark out of its marking prose. */
  awarded: number | null;
  marks: number | null;
  /** Per-criterion detail, when the format returns it. */
  parts: StructuredGrade["parts"] | null;
  modelAnswer: string;
  marking: readonly string[];
}

function fromStructured(item: AssessmentItem, grade: StructuredGrade | null): OfflineMark | null {
  if (!grade || grade.answered === 0) return null;
  return {
    correct: grade.awarded === grade.marks,
    awarded: grade.awarded,
    marks: grade.marks,
    parts: grade.parts,
    modelAnswer: item.modelAnswer,
    marking: item.marking,
  };
}

/** Mark one authored item with the same functions `/api/progress` calls. */
export function markOfflineAssessment(
  item: AssessmentItem,
  answers: readonly string[],
  working: readonly string[] = [],
): OfflineMark | null {
  if (item.gaps || item.matching || item.ordering || item.diagram) {
    return fromStructured(item, gradeLessonInteraction(item, [...answers]));
  }
  if (item.structured) {
    return fromStructured(item, gradeStructuredAssessment(item, [...answers], [...working]));
  }
  if (item.kind === "short-answer" && item.check?.accepted.length) {
    const marked = gradeAuthoredAssessment(item, answers[0] ?? "");
    if (marked === null) return null;
    return {
      correct: marked,
      awarded: null,
      marks: null,
      parts: null,
      modelAnswer: item.modelAnswer,
      marking: item.marking,
    };
  }
  return null;
}

/** The exact event the sync door accepts. `questionId` names the authored item
 *  in the same namespace the online lesson route uses, and the score is the
 *  criteria total, not a client-asserted verdict. */
export function offlineAssessmentEvent(
  learnerId: string,
  pack: { conceptId: string; subject: string | null },
  item: AssessmentItem,
  mark: OfflineMark,
  at: number,
  submissionId: string,
) {
  return {
    type: "answer_submitted" as const,
    id: `ev_${submissionId}`,
    schemaVersion: 1,
    learnerId,
    provenance: "device" as const,
    at,
    source: "practice" as const,
    subject: pack.subject,
    conceptId: pack.conceptId,
    specificationId: null,
    questionId: `lesson:${pack.conceptId}:${item.id}`,
    correct: mark.correct,
    // −1 is the typed/structured marker: there was no option to pick.
    chosen: -1,
    givenValue: null,
    mode: "independent" as const,
    hints: 0,
    score: mark.awarded === null || mark.marks === null
      ? null
      : { awarded: mark.awarded, max: mark.marks },
    ms: null,
    tags: [] as string[],
    deviceAt: at,
    certainty: null,
  };
}
