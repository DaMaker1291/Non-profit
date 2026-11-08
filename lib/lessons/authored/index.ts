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
import { MATHS_QUADRATICS } from "./maths-quadratics";
import { BIOLOGY_CELLS } from "./biology-cells";
import { PHYSICS_FORCES } from "./physics-forces";
import { CHEMISTRY_PERIODIC_TABLE } from "./chemistry-periodic-table";
import { CHEMISTRY_COMPOUNDS_MIXTURES } from "./chemistry-compounds-mixtures";
import { COMPUTING_SEARCHING } from "./computing-searching";
import { BIOLOGY_ENZYMES } from "./biology-enzymes";
import { CHEMISTRY_ATOMS_ELEMENTS } from "./chemistry-atoms-elements";
import { COMPUTING_VARIABLES } from "./computing-variables";
import { BIOLOGY_DIFFUSION } from "./biology-diffusion";
import { CHEMISTRY_ELECTRON_SHELLS } from "./chemistry-electron-shells";
import { COMPUTING_LOOPS } from "./computing-loops";
import { BIOLOGY_RESPIRATION } from "./biology-respiration";
import { BIOLOGY_BREATHING_GAS } from "./biology-breathing-gas";
import { BIOLOGY_DIGESTION } from "./biology-digestion";
import { BIOLOGY_MICROSCOPY } from "./biology-microscopy";
import { COMPUTING_CONDITIONALS } from "./computing-conditionals";
import { MATHS_LINEAR_EQUATIONS } from "./maths-linear-equations";
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
  // Batch 9 — the first SECONDARY mathematics lesson. Every maths lesson before
  // this one taught a number skill; `quadratics` is where a learner must hold a
  // relationship between two quantities and choose a representation, so it is
  // the first test of whether the contract can teach algebra rather than
  // arithmetic.
  MATHS_QUADRATICS,
  // Batch 10 — one authored lesson in each remaining subject, chosen where the
  // existing plan was weakest: a labelled cell diagram, a forces topic that
  // usually stops at definitions, a periodic table taught as a chart, and a
  // search algorithm taught without a trace. Each is written to its own subject
  // framework, not to a shared template.
  BIOLOGY_CELLS,
  PHYSICS_FORCES,
  CHEMISTRY_PERIODIC_TABLE,
  // Batch 17 — compounds and mixtures: the particle model that decides the
  // label, and the physical separations that follow from it.
  CHEMISTRY_COMPOUNDS_MIXTURES,
  COMPUTING_SEARCHING,
  // Batch 11 — the critical concepts the audit ranked highest that still had no
  // authored teaching: an enzyme lesson whose mechanism is shape, an atoms
  // lesson that derives relative atomic mass from isotope abundance, and a
  // variables lesson that makes the trace the object of study rather than a
  // list of types to memorise.
  BIOLOGY_ENZYMES,
  CHEMISTRY_ATOMS_ELEMENTS,
  COMPUTING_VARIABLES,
  // Batch 12 — the next three critical concepts, each chosen for a specific
  // teaching gap: transport processes that are usually described rather than
  // explained mechanically, electron configuration taught as a sequence to copy,
  // and loops taught without a trace or a boundary test.
  BIOLOGY_DIFFUSION,
  CHEMISTRY_ELECTRON_SHELLS,
  COMPUTING_LOOPS,
  // Batch 13 — one critical concept per subject: respiration separated from
  // breathing and taught through energy yield, conditionals taught through the
  // trace and the boundary, and linear equations taught as a balance rather
  // than a sign-moving shortcut.
  BIOLOGY_RESPIRATION,
  // Batch 14 — the next critical concept: the lung as a diffusion surface,
  // not a pair of balloons, with ventilation separated from gas exchange and
  // from cellular respiration.
  BIOLOGY_BREATHING_GAS,
  // Batch 15 — digestion as a sequence of mechanical and chemical steps, with
  // bile separated from enzymes and the villus taught as a transport surface
  // rather than a bump that catches food.
  BIOLOGY_DIGESTION,
  // Batch 16 — magnification and resolution separated, with the unit conversion
  // treated as part of the calculation and the instrument chosen for a specimen.
  BIOLOGY_MICROSCOPY,
  COMPUTING_CONDITIONALS,
  MATHS_LINEAR_EQUATIONS,
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
