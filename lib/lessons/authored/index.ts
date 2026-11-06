import type { AuthoredLesson } from "../../lesson-contract";
import { MATHS_FRACTIONS } from "./maths-fractions";
import { PHYSICS_CIRCUITS } from "./physics-circuits";
import { CHEMISTRY_EQUATIONS } from "./chemistry-equations";
import { BIOLOGY_PHOTOSYNTHESIS } from "./biology-photosynthesis";
import { COMPUTING_WHAT_IS_CODE } from "./computing-what-is-code";
import { MATHS_PLACE_VALUE } from "./place-value";
import { MATHS_DECIMALS } from "./decimals";
import { MATHS_ADDITION } from "./addition";
import { MATHS_SUBTRACTION } from "./subtraction";
import { MATHS_ROUNDING } from "./rounding";
import { MATHS_MULTIPLICATION } from "./multiplication";
import { MATHS_DIVISION } from "./division";
import { MATHS_NEGATIVES } from "./negatives";
import { MATHS_ORDER_OPS } from "./order-ops";
import { MATHS_FRACTION_OPS } from "./fraction-ops";
import { MATHS_PERCENTAGES } from "./percentages";
import { LESSON_TRANSLATIONS, TRANSLATED_LANGUAGES } from "./translations";

// THE AUTHORED SET.
//
// This table is the honest count. Batch 1 wrote one representative lesson per
// subject; batch 3 added the root of the mathematics chain, because every later
// maths concept reads a written number and a learner who reads 452 as three
// separate digits finds all of them arbitrary.
//
// A concept not in this table has no authored lesson, whatever its plan, lens or
// genome paragraph says — and `npm run lesson:catalogue` reports exactly that.
//
// Adding a lesson here is not enough to raise its status. The catalogue derives
// the earned rung from the lesson's own review and learner-testing records, and
// the gate refuses a declared status above the evidence.
export const AUTHORED_LESSONS: readonly AuthoredLesson[] = [
  MATHS_FRACTIONS,
  PHYSICS_CIRCUITS,
  CHEMISTRY_EQUATIONS,
  BIOLOGY_PHOTOSYNTHESIS,
  COMPUTING_WHAT_IS_CODE,
  MATHS_PLACE_VALUE,
  // Batch 4 — the primary number chain, in the genome's own dependency order.
  MATHS_DECIMALS,
  MATHS_ADDITION,
  MATHS_SUBTRACTION,
  MATHS_ROUNDING,
  MATHS_MULTIPLICATION,
  MATHS_DIVISION,
  // Batch 5 — the sign rule the secondary graph rests on: `coordinates` declares
  // `negatives` as its prerequisite, and every later graph reads a point below
  // the axis.
  MATHS_NEGATIVES,
  // Batch 6 — the convention both algebra and indices stand on.
  MATHS_ORDER_OPS,
  // Batch 7 — the teaching the `denom-add` repair assumes.
  MATHS_FRACTION_OPS,
  // Batch 8 — the thinnest served explanation in the bank.
  MATHS_PERCENTAGES,
];

export const AUTHORED_BY_CONCEPT: Readonly<Record<string, AuthoredLesson>> = Object.fromEntries(
  AUTHORED_LESSONS.map((lesson) => [lesson.conceptId, lesson] as const),
);

/** The authored lesson for a concept, in a teaching language.
 *
 *  ENGLISH: the lesson as written.
 *  ANOTHER LANGUAGE: only a COMPLETE translation, or null. Null is a real
 *  answer — the read stage then renders the plan it always did — and it is the
 *  only honest one, because a translated heading above English teaching is
 *  precisely what the translation rule forbids. A machine translation is
 *  returned, and the page prints its status beside it; see
 *  lib/lesson-translate.ts#translationDisclosure. */
export function authoredLessonFor(conceptId: string, language: string = "en"): AuthoredLesson | null {
  if (language === "en") return AUTHORED_BY_CONCEPT[conceptId] ?? null;
  return LESSON_TRANSLATIONS[language]?.[conceptId] ?? null;
}

/** True when this lesson has at least one complete, human-reviewed translation. */
export function hasReviewedTranslation(lesson: AuthoredLesson): boolean {
  return lesson.translations.some((t) => t.status === "human-reviewed");
}

export { LESSON_TRANSLATIONS, TRANSLATED_LANGUAGES };
