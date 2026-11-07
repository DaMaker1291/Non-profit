// ─────────────────────────────────────────────────────────────────────────────
// LESSON MEDIA — a video card only when a video teaches THIS idea.
//
// The first version filled every lesson with a SUBJECT OVERVIEW: the chemistry
// lesson linked a 7:45 "Introduction to chemistry" to all sixteen chemistry
// concepts, so a learner asking how to balance an equation was sent to a broad
// tour that did not answer it. The card honestly said "subject overview", which
// made the text accurate and the product still useless: an unrelated link,
// longer than the lesson, behind a cookie wall. A wrong video is worse than no
// video because it spends the learner's time and trust.
//
// There is no subject fallback now. An authored `plan.video` must teach the
// concept; every other lesson has no card. `docs/MEDIA_AND_DIAGRAMS.md` records
// that twenty-one lessons have an exact-concept video and the rest do not. This module
// chooses only WHICH verified source to offer; `scripts/media-check.mjs` checks
// the claim, the length, captions and link-only shape.
// ─────────────────────────────────────────────────────────────────────────────
import type { LessonPlan } from "./lesson-plans";

/** A video plus the honest scope of its claim. */
export type LessonVideo = NonNullable<LessonPlan["video"]> & {
  readonly scope: "concept";
};

/** The exact-concept video for this lesson, or null. No subject overview is
 *  substituted: the absence is the honest answer until somebody verifies a
 *  video that actually teaches this idea. */
export function videoFor(plan: LessonPlan): LessonVideo | null {
  if (!plan.video) return null;
  return { ...plan.video, scope: "concept" };
}

/** The dictionary key a card prints. Kept as a function so the renderer cannot
 *  hardcode English and so the old subject-scope key cannot be reintroduced
 *  without changing this module. */
export function videoScopeKey(_video: LessonVideo): "lesson.videoConcept" {
  return "lesson.videoConcept";
}

/** How many lessons are taught by a concept-specific video. */
export function conceptVideoCount(plans: readonly LessonPlan[]): number {
  return plans.filter((plan) => videoFor(plan) !== null).length;
}
