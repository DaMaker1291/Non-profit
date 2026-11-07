// ─────────────────────────────────────────────────────────────────────────────
// LESSON MEDIA — one honest video card per lesson.
//
// The authored plan may carry a video that teaches THIS concept. Most plans do
// not, and inventing a per-concept URL would be worse than an empty slot: a
// video is a claim about what a learner will see. The fallback below is a
// SUBJECT OVERVIEW, explicitly labelled as one, so every lesson has a real
// watched route without pretending the overview teaches the exact idea.
//
// The link-only rule lives in docs/MEDIA_AND_DIAGRAMS.md and is enforced by
// scripts/media-check.mjs: no embed, no download, no third-party request until
// the learner taps. This module only chooses WHICH source to offer.
// ─────────────────────────────────────────────────────────────────────────────
import { CONCEPTS_BY_ID } from "./genome";
import type { LessonPlan } from "./lesson-plans";
import type { SubjectId } from "./types";

/** A video plus the honest scope of its claim. */
export type LessonVideo = NonNullable<LessonPlan["video"]> & {
  readonly scope: "concept" | "subject";
};

/** One verified overview per subject. These are LINKS, not embeds. The titles,
 *  sources and running times were checked at the source; caption status stays
 *  `unknown` until somebody watches the track. */
export const SUBJECT_VIDEOS: Readonly<Record<SubjectId, LessonVideo>> = {
  maths: {
    url: "https://www.khanacademy.org/math/math1/x89d82521517266d4:algebra-foundation/x89d82521517266d4:overview-history-alg/v/the-beauty-of-algebra",
    title: "The beauty of algebra",
    source: "Khan Academy",
    length: "10:07",
    language: "en",
    captions: "unknown",
    scope: "subject",
    summary:
      "A broad tour of algebra: letters standing for numbers, expressions describing relationships, and why the subject generalises arithmetic. This is a subject overview, not a walkthrough of this exact concept; the lesson below does that part.",
  },
  physics: {
    url: "https://www.khanacademy.org/science/physics/one-dimensional-motion/introduction-to-physics-tutorial/v/introduction-to-physics",
    title: "Introduction to physics",
    source: "Khan Academy",
    length: "9:30",
    language: "en",
    captions: "unknown",
    scope: "subject",
    summary:
      "A broad introduction to physics: matter, motion, forces and the mathematical models used to predict them. This is a subject overview, not a walkthrough of this exact concept; the lesson below does that part.",
  },
  chemistry: {
    url: "https://www.khanacademy.org/science/chemistry/ap-chemistry/atoms-compounds-ions-ap/introduction-to-the-atom-ap/v/introduction-to-chemistry",
    title: "Introduction to chemistry",
    source: "Khan Academy",
    length: "7:45",
    language: "en",
    captions: "unknown",
    scope: "subject",
    summary:
      "A broad view of chemistry as the study of matter, its properties and how substances change. This is a subject overview, not a walkthrough of this exact concept; the lesson below does that part.",
  },
  biology: {
    url: "https://www.khanacademy.org/science/biology/intro-to-biology/what-is-biology/v/overview-of-biology",
    title: "Biology overview",
    source: "Khan Academy",
    length: "4:33",
    language: "en",
    captions: "unknown",
    scope: "subject",
    summary:
      "A broad view of biology as the study of life, from cells and energy to inheritance and evolution. This is a subject overview, not a walkthrough of this exact concept; the lesson below does that part.",
  },
  computing: {
    url: "https://www.khanacademy.org/computing/intro-to-python-fundamentals/x5279a44ae0ab15d6:computational-thinking-with-variables/x5279a44ae0ab15d6:the-programming-platform/v/welcome-to-intro-to-computer-science-python",
    title: "Welcome to Intro to Computer Science - Python!",
    source: "Khan Academy",
    length: "3:53",
    language: "en",
    captions: "unknown",
    scope: "subject",
    summary:
      "A broad introduction to programming: variables, conditionals, loops, functions and data structures, and how they fit together in a program. This is a subject overview, not a walkthrough of this exact concept; the lesson below does that part.",
  },
};

/** The video for this lesson: the authored concept video when there is one,
 *  otherwise the subject overview, always with its scope made explicit. */
export function videoFor(plan: LessonPlan): LessonVideo | null {
  if (plan.video) return { ...plan.video, scope: plan.video.scope ?? "concept" };
  const subject = CONCEPTS_BY_ID[plan.conceptId]?.subject;
  return subject ? SUBJECT_VIDEOS[subject] ?? null : null;
}

/** The dictionary key a card must print, so the renderer translates it rather
 *  than this module hardcoding English into fifteen languages. */
export function videoScopeKey(video: LessonVideo): "lesson.videoConcept" | "lesson.videoSubject" {
  return video.scope === "subject" ? "lesson.videoSubject" : "lesson.videoConcept";
}

/** How many lessons are taught by a concept-specific video. Exported so the
 *  media gate can report the distinction rather than flattening it. */
export function conceptVideoCount(plans: readonly LessonPlan[]): number {
  return plans.filter((plan) => videoFor(plan)?.scope === "concept").length;
}