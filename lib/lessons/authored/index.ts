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
import { BIOLOGY_GENETICS } from "./biology-genetics";
import { BIOLOGY_HORMONES } from "./biology-hormones";
import { BIOLOGY_IMMUNE_HEALTH } from "./biology-immune-health";
import { BIOLOGY_NERVOUS_SYSTEM } from "./biology-nervous-system";
import { CHEMISTRY_ACIDS_BASES } from "./chemistry-acids-bases";
import { CHEMISTRY_COVALENT_BONDING } from "./chemistry-covalent-bonding";
import { CHEMISTRY_ELECTROLYSIS } from "./chemistry-electrolysis";
import { CHEMISTRY_ENERGY_CHANGES } from "./chemistry-energy-changes";
import { CHEMISTRY_EQUILIBRIA } from "./chemistry-equilibria";
import { CHEMISTRY_IONIC_BONDING } from "./chemistry-ionic-bonding";
import { CHEMISTRY_METALLIC_BONDING } from "./chemistry-metallic-bonding";
import { CHEMISTRY_MOLES_CALCS } from "./chemistry-moles-calcs";
import { CHEMISTRY_ORGANIC_INTRO } from "./chemistry-organic-intro";
import { CHEMISTRY_RATES_REACTION } from "./chemistry-rates-reaction";
import { CHEMISTRY_ANALYSIS_TESTS } from "./chemistry-analysis-tests";
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
import { MATHS_STANDARD_FORM } from "./maths-standard-form";
import { MATHS_ALGEBRA_EXPAND } from "./maths-algebra-expand";
import { MATHS_STRAIGHT_LINES } from "./maths-straight-lines";
import { MATHS_INEQUALITIES } from "./maths-inequalities";
import { MATHS_SURDS } from "./maths-surds";
import { MATHS_SIMULTANEOUS } from "./maths-simultaneous";
import { MATHS_SIM_EQUATIONS_QUAD } from "./maths-sim-equations-quad";
import { MATHS_FUNCTIONS } from "./maths-functions";
import { MATHS_TRIG_RATIOS } from "./maths-trig-ratios";
import { MATHS_TRIG_IDENTITY } from "./maths-trig-identity";
import { MATHS_CIRCLE_THEOREMS } from "./maths-circle-theorems";
import { MATHS_PYTHAGORAS } from "./maths-pythagoras";
import { MATHS_VOLUME } from "./maths-volume";
import { MATHS_TRANSFORMATIONS } from "./maths-transformations";
import { MATHS_VECTORS } from "./maths-vectors";
import { MATHS_TREE_DIAGRAMS } from "./maths-tree-diagrams";
import { MATHS_SCATTER_CORRELATION } from "./maths-scatter-correlation";
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
  // Batch 37 — genetics: the inheritance mechanism evolution depends on. The
  // lesson keeps the physical objects (DNA, gene, allele) separate from the
  // notation (genotype, phenotype), then explains why meiosis gives a gamete
  // one allele and why a Punnett square predicts a probability rather than a
  // family's exact composition.
  BIOLOGY_GENETICS,
  // Batch 38 — hormones: the homeostatic loop that genetics and diffusion
  // support. The lesson makes the receptor, coordination centre and effector
  // one sequence, then uses glucose, ADH and type 2 insulin resistance to show
  // what changes when a different part of the loop fails.
  BIOLOGY_HORMONES,
  // Batch 39 — immune-health: the stage-3 biology outline that evolution and
  // cells support. The lesson separates barriers, phagocytosis and the specific
  // antibody response, then applies the same specificity to vaccination and the
  // evolution of antibiotic resistance in a bacterial population.
  BIOLOGY_IMMUNE_HEALTH,
  // Batch 40 — nervous-system: the stage-2 biology outline hormones already
  // depends on. The lesson separates the reflex arc from the conscious brain,
  // makes the synapse chemical and one-way rather than a spark across a gap,
  // and treats reaction time as a measured whole-pathway result.
  BIOLOGY_NERVOUS_SYSTEM,
  // Batch 41 — acids-bases: the stage-2 chemistry outline whose named
  // misconception is strong-versus-concentrated. The lesson defines acids and
  // bases by proton transfer, makes pH logarithmic, and predicts salts from the
  // acid's anion rather than from a memorised list.
  CHEMISTRY_ACIDS_BASES,
  // Batch 43 — covalent-bonding: the stage-2 chemistry concept that
  // `organic-intro` names as its prerequisite. The lesson separates three
  // claims that are often merged: a shared pair is not a transferred electron;
  // a double bond is one bond of order two; and a simple molecular substance
  // boils by overcoming forces between molecules, not by breaking its covalent
  // bonds. Diamond, graphite and silicon dioxide are then taught as networks,
  // where that molecular model would give the wrong answer.
  CHEMISTRY_COVALENT_BONDING,
  // Batch 44 — electrolysis: the stage-3 chemistry concept whose prerequisites
  // are ionic bonding and electric circuits. The lesson separates mobile ions
  // from fixed lattice ions, cathode from anode by charge rather than by name,
  // molten products from the aqueous competition, and charge from current.
  CHEMISTRY_ELECTROLYSIS,
  // Batch 45 — energy-changes: the stage-3 chemistry concept the queue placed
  // first. The lesson keeps the bond ledger and the calorimeter separate before
  // joining them, so a learner cannot report q as ΔH per mole or mistake the
  // activation barrier for the enthalpy difference. The reaction profile is the
  // third representation, and a catalyst changes only its peak.
  CHEMISTRY_ENERGY_CHANGES,
  // Batch 42 — analysis-tests: the first high-priority chemistry outline after
  // acids-bases. The lesson treats each test as evidence with a limit: a flame
  // colour identifies a metal ion, a white hydroxide needs excess alkali to
  // separate aluminium and zinc from calcium and magnesium, carbonate must be
  // removed before barium chloride or silver nitrate, and an Rf value is only
  // comparable under matched conditions.
  CHEMISTRY_ANALYSIS_TESTS,
  // Batch 47 — ionic-bonding: the prerequisite electrolysis already names. The
  // lesson treats the ionic bond as attraction throughout a lattice, not a
  // single link between two atoms, and derives formulas from charge balance so
  // that "AlO" cannot survive as a remembered one-of-each rule. Its properties
  // are explained by fixed ions and mobile ions, not by electrons escaping.
  CHEMISTRY_IONIC_BONDING,
  // Batch 48 — metallic-bonding: the next stage-2 chemistry outline. The lesson
  // keeps the electron sea, mobile charge and layer sliding as one structural
  // model, then explains alloys as different-sized atoms that make sliding
  // harder. It also keeps material choice as a compromise rather than a list of
  // "best" metals. The concept is a prerequisite for later alloy and structure
  // work, not a vocabulary detour.
  CHEMISTRY_METALLIC_BONDING,
  // Batch 49 — moles-calcs: the quantitative core the chemistry chain depends
  // on. It teaches the mole as a count that can be weighed, then joins mass,
  // solution concentration, equation ratios and limiting reactants in the
  // order a calculation needs them. Every example keeps the unit check visible.
  CHEMISTRY_MOLES_CALCS,
  // Batch 50 — organic-intro: the carbon-skeleton lesson the chemistry chain
  // reaches after bonding and quantitative work. It teaches carbon's four
  // bonds, saturation versus unsaturation, distillation, cracking and addition
  // polymers as one structural story rather than a list of fuels.
  CHEMISTRY_ORGANIC_INTRO,
  // Batch 46 — equilibria: the next stage-4 chemistry outline. The lesson
  // separates a dynamic balance of rates from a stopped reaction, a shift in
  // position from a change in Kc, and a catalyst's effect on rate from its lack
  // of effect on yield. The Haber process is the worked compromise, not a list
  // of conditions to memorise.
  CHEMISTRY_EQUILIBRIA,
  // Batch 51 — rates-reaction: the stage-2 chemistry concept the queue placed
  // first. The lesson starts with a measured rate rather than a definition,
  // separates collision frequency from the fraction that clears the barrier,
  // and keeps a catalyst's effect on rate apart from its lack of effect on
  // equilibrium position or yield. The graph is read as a gradient and a
  // plateau, not as a decorative curve.
  CHEMISTRY_RATES_REACTION,
  // Batch 52 — the first three secondary mathematics outlines after the science
  // tranche. Standard form is place value plus a recorded point movement;
  // expanding is the area model read forwards and factorising is the same model
  // read backwards; a straight line is a starting value plus a constant rate.
  MATHS_STANDARD_FORM,
  MATHS_ALGEBRA_EXPAND,
  MATHS_STRAIGHT_LINES,
  MATHS_INEQUALITIES,
  MATHS_SURDS,
  MATHS_SIMULTANEOUS,
  // Batch 53 — the first simultaneous system whose number of solutions is not
  // fixed. Substitution produces a quadratic, and its discriminant decides
  // whether the line cuts the curve twice, touches it once, or misses it.
  MATHS_SIM_EQUATIONS_QUAD,
  // Batch 54 — the notation lesson behind every later model: one output per
  // input, composition as an order of machines, and an inverse verified by both
  // compositions. Domain and range carry the restrictions that make an inverse
  // a function rather than a relation.
  MATHS_FUNCTIONS,
  // Batch 55 — the right-triangle ratios. The lesson begins with similar
  // triangles, because that is why sin, cos and tan belong to the angle rather
  // than to one drawing. Side labels, ratio choice, rearrangement, inverse trig
  // and calculator mode are taught as one procedure, with each common slip
  // paired against the reasoning that corrects it.
  MATHS_TRIG_RATIOS,
  // Batch 56 — the identities and graphs that turn the right-triangle ratios
  // into functions over a full turn. The unit circle explains the signs, the
  // Pythagorean identity, the quotient identity and the tangent asymptotes in
  // one picture; exact values are derived before they are tabulated.
  MATHS_TRIG_IDENTITY,
  // Batch 57 — the first circle-geometry lesson. The arc is the object: the
  // centre–circumference, semicircle, same-segment, cyclic-quadrilateral and
  // tangent–radius theorems are all relationships between two angles that stand
  // on a named arc or meet at a named point of contact. Each worked calculation
  // names the theorem as its reason.
  MATHS_CIRCLE_THEOREMS,
  // Batch 58 — the right-triangle distance theorem that the trig ratios and the
  // cosine rule later generalise. The lesson makes the hypotenuse the first
  // decision, shows the leg rearrangement as a subtraction, and treats the
  // converse as a separate claim about the sides.
  MATHS_PYTHAGORAS,
  // Batch 59 — filling versus wrapping. The same three dimensions answer two
  // different questions, and the scale factor is the dimension count.
  MATHS_VOLUME,
  // Batch 60 — the four moves, described completely. The coordinate rules are
  // the test; the picture alone cannot distinguish a rotation from a reflection.
  MATHS_TRANSFORMATIONS,
  // Batch 61 — a displacement is not a point. Components add; one scalar tests
  // parallelism; a midpoint vector is half the side vector it joins.
  MATHS_VECTORS,
  // Batch 62 — multiply along a path, add across paths, and change the second
  // denominator when the first draw is not replaced. The spinner tree on the
  // page is the same tree the server marks.
  MATHS_TREE_DIAGRAMS,
  // Batch 63 — a cloud has a direction, a strength and a line, but no cause.
  // Predictions are interpolation only inside the observed range; an outlier is
  // checked before it is deleted; a slope is not a mechanism.
  MATHS_SCATTER_CORRELATION,
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
