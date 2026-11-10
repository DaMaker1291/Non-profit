import type { AuthoredLesson } from "../../lesson-contract";
import { MATHS_FRACTIONS } from "./maths-fractions";
import { PHYSICS_CIRCUITS } from "./physics-circuits";
import { PHYSICS_ENERGY } from "./physics-energy";
import { PHYSICS_MOTION } from "./physics-motion";
import { PHYSICS_WAVES } from "./physics-waves";
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
import { BIOLOGY_BIODIVERSITY } from "./biology-biodiversity";
import { BIOLOGY_CIRCULATION } from "./biology-circulation";
import { BIOLOGY_ECOSYSTEMS } from "./biology-ecosystems";
import { BIOLOGY_EVOLUTION } from "./biology-evolution";
import { BIOLOGY_BREATHING_GAS } from "./biology-breathing-gas";
import { BIOLOGY_DIGESTION } from "./biology-digestion";
import { BIOLOGY_MICROSCOPY } from "./biology-microscopy";
import { COMPUTING_CONDITIONALS } from "./computing-conditionals";
import { COMPUTING_BINARY } from "./computing-binary";
import { COMPUTING_LISTS } from "./computing-lists";
import { COMPUTING_FUNCTIONS } from "./computing-functions";
import { COMPUTING_DICTIONARIES } from "./computing-dictionaries";
import { MATHS_LINEAR_EQUATIONS } from "./maths-linear-equations";
import { MATHS_ALGEBRA_EXPRESSIONS } from "./maths-algebra-expressions";
import { MATHS_ANGLES_LINES } from "./maths-angles-lines";
import { MATHS_AREA_PERIMETER } from "./maths-area-perimeter";
import { MATHS_AVERAGES } from "./maths-averages";
import { MATHS_COORDINATES } from "./maths-coordinates";
import { MATHS_DATA_CHARTS } from "./maths-data-charts";
import { MATHS_INDICES_INTRO } from "./maths-indices-intro";
import { MATHS_PROBABILITY_BASICS } from "./maths-probability-basics";
import { MATHS_RATIO } from "./maths-ratio";
import { MATHS_PROPORTION } from "./maths-proportion";
import { MATHS_SEQUENCES } from "./maths-sequences";
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
  // Batch 30 — the prerequisite `electricity-circuits` already named. Energy is
  // the accounting rule the rest of physics borrows: stores, transfers and a
  // closed system, then the two formulas that count the common stores.
  PHYSICS_ENERGY,
  // Batch 31 — the second critical stage-1 physics gap. A motion graph is a
  // reading skill before it is a calculation, so the lesson keeps the two
  // graphs' gradients and the velocity–time area separate.
  PHYSICS_MOTION,
  // Batch 32 — the last critical stage-1 physics gap. The lesson makes the
  // oscillation and the travelling disturbance separate before it names
  // amplitude, wavelength, frequency or speed.
  PHYSICS_WAVES,
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
  // Batch 18 — binary as a representation, not a vocabulary list: place value,
  // byte range, carry/overflow and hexadecimal as four-bit shorthand.
  COMPUTING_BINARY,
  // Batch 20 — collections, calls and lookup, each with a runnable Python
  // assessment. Lists comes first because dictionaries declares it as a
  // prerequisite; functions is independent of dictionaries but reuses the
  // traversal idea from lists.
  COMPUTING_LISTS,
  COMPUTING_FUNCTIONS,
  COMPUTING_DICTIONARIES,
  // Batch 21 — the next critical concept in prerequisite order. It sits before
  // linear equations in the genome and gives every later algebra lesson its
  // vocabulary: a coefficient counts copies of an unknown, like terms share a
  // letter part, and a bracket multiplies every term inside it.
  MATHS_ALGEBRA_EXPRESSIONS,
  MATHS_LINEAR_EQUATIONS,
  // Batch 22 — the first critical geometry concept after algebra. Every claim a
  // learner meets is an angle fact they can derive, not a Z shape to recognise.
  MATHS_ANGLES_LINES,
  // Batch 23 — the measurement pair every later geometry and scale topic reads.
  // The lesson derives the formulas instead of asking for recall, and treats
  // the square unit as the square of the length factor.
  MATHS_AREA_PERIMETER,
  // Batch 24 — the statistics concept every chart and data argument depends on.
  // It keeps four questions separate: total shared out, middle after ordering,
  // most frequent, and spread.
  MATHS_AVERAGES,
  // Batch 25 — the graph concept every later line, curve and intersection topic
  // reads. The pair is an address, substitution is the membership test, and the
  // coordinate an equation fixes decides whether its line is horizontal.
  MATHS_COORDINATES,
  // Batch 26 — the representation concept every data argument reads. A chart
  // is treated as an argument: the question chooses the type, the baseline is
  // part of the claim, and a pie encodes shares rather than counts.
  MATHS_DATA_CHARTS,
  // Batch 27 — the power concept every standard-form, surd, growth and calculus
  // topic reads. The laws are derived by counting copies, not memorised, and
  // zero, negative and fractional indices are shown as the same pattern.
  MATHS_INDICES_INTRO,
  // Batch 28 — probability as a measure on a sample space, not a formula to
  // match. The lesson separates mutually exclusive from independent, "at least
  // one" from "exactly one", and dependent draws from independent trials, and
  // the transfer is a diagnostic test where ignoring the base rate is the same
  // error in an unfamiliar setting.
  MATHS_PROBABILITY_BASICS,
  // Batch 29 — the ratio chain in its declared order. `proportion` names
  // `ratio` as a prerequisite, and `sequences` is the position-to-term idea
  // the algebra branch reads. Each lesson was added with its own browser
  // submission, not only a catalogue entry.
  MATHS_RATIO,
  MATHS_PROPORTION,
  MATHS_SEQUENCES,
  // Batch 33 — the first high-priority outline after the critical physics gaps
  // closed. Biodiversity is taught as three connected levels and as evidence
  // from a stated sampling method, not as a species count to memorise; the
  // conservation task requires the measure to answer the pressure.
  BIOLOGY_BIODIVERSITY,
  // Batch 34 — circulation: the next biology outline after biodiversity. The
  // lesson keeps the two circuits, the pressure difference and the heart's own
  // coronary supply separate, so "the heart is full of blood" cannot be mistaken
  // for "the heart muscle is supplied".
  BIOLOGY_CIRCULATION,
  // Batch 35 — ecosystems: the stage-2 biology outline that biodiversity names
  // as its prerequisite. Energy is taught as a one-way flow with losses at each
  // transfer, matter as a set of cycles, and decomposition as the process that
  // returns nutrients to producers rather than as a tidy-up at the end.
  BIOLOGY_ECOSYSTEMS,
  // Batch 36 — evolution: the stage-3 concept that genetics feeds. The lesson
  // separates inherited variation from acquired change, selection from drift,
  // and resistance in a bacterial population from resistance in a person.
  BIOLOGY_EVOLUTION,
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
