// ─────────────────────────────────────────────────────────────────────────────
// MODEL ASSUMPTIONS — what each interactive model IS, and what it is not.
//
// A model that teaches a belief can also plant one. The circuit model's neat
// 0.25 A is an idealisation; the cell model draws one generic plant cell and every
// root cell in the world disagrees; the fraction line stops at one whole. None of
// that is a reason not to ship the model. It is a reason to state it, beside the
// model, and in the educator pack — which is what this module exists for.
//
// These are NOT claims a code path can verify. They are the considered statement a
// subject teacher is asked to correct, so the fields are written by hand and the
// suite only checks that every model has them and that each names at least one
// thing it might teach wrongly.
// ─────────────────────────────────────────────────────────────────────────────

import type { InteractiveModelId } from "./interactive-models";

export interface ModelAssumptions {
  readonly model: InteractiveModelId;
  /** The age band the wording and the arithmetic are pitched at. */
  readonly level: string;
  /** Scientific or mathematical simplifications the model makes. */
  readonly assumptions: readonly string[];
  /** What it cannot show, stated so absence is not read as denial. */
  readonly limitations: readonly string[];
  /** Misconceptions the model is designed to make refutable. */
  readonly addresses: readonly string[];
  /** Misconceptions it might accidentally introduce or reinforce. */
  readonly couldIntroduce: readonly string[];
}

export const MODEL_ASSUMPTIONS: readonly ModelAssumptions[] = [
  {
    model: "circuit-model",
    level: "11–16 (series circuits, first quantitative treatment)",
    assumptions: [
      "Every cell is an ideal 1.5 V source with no internal resistance.",
      "Every bulb is identical at 6 Ω and its resistance does not change with temperature.",
      "The circuit is series only: one loop, no junctions.",
      "Wires and the closed switch have zero resistance.",
      "Brightness is proportional to power in the bulb relative to a one-cell, one-bulb reference.",
      "The arrows show CONVENTIONAL current: out of the positive terminal, round the outside loop, into the negative. Electron drift is the opposite way and is described in words, not drawn.",
    ],
    limitations: [
      "No parallel branches, so local reasoning at a junction is not taught or refuted here.",
      "No non-identical bulbs, so 'the dimmer bulb has more resistance' cannot be explored.",
      "No internal resistance, so the voltage across the cells never sags as current rises.",
      "Real filament resistance rises with temperature; the model's current is a first approximation.",
      "No charge carriers are animated, so the electron drift can only be read in the disclosure under the drawing.",
    ],
    addresses: [
      "Current is used up by a bulb.",
      "A cell supplies a fixed current whatever the circuit.",
      "One wire from a cell is enough to light a bulb.",
      "Where the switch sits in the loop changes the brightness.",
    ],
    couldIntroduce: [
      "That brightness always follows (cells ÷ bulbs)², which is only true for identical bulbs in series.",
      "That all circuits are series circuits, because no parallel case appears.",
      "That 0.25 A is a measured value rather than an idealised prediction from stated assumptions.",
      "That the arrows show the electrons moving, when they show conventional current the other way.",
      "That current 'belongs' to a sign of charge rather than being a flow of charge whose direction is a convention.",
    ],
  },
  {
    model: "number-line-model",
    level: "11–14 (negative numbers, decimals to one place, place value in tens)",
    assumptions: [
      "The line is linear and uniform: equal steps are equal distances.",
      "One move is the concept's unit — one, one tenth, or ten — and cannot be varied within a concept.",
      "Decimals are shown to one decimal place only.",
      "Place value is represented on a 0–1000 line stepping in tens.",
      "Zero is a point on the line, not a direction.",
    ],
    limitations: [
      "No hundredths, so decimal place-value beyond tenths is not shown.",
      "No negative fractions or negative decimals.",
      "The place-value line stops at 1000 and has only a tens step; hundreds and units are not separately manipulable.",
      "The line cannot show density (that infinitely many numbers lie between two points).",
    ],
    addresses: [
      "−5 is greater than −2 because 5 is greater than 2.",
      "The number furthest from zero is the greatest.",
      "0.45 is greater than 0.5 because 45 is greater than 5.",
      "More digits means a larger number.",
    ],
    couldIntroduce: [
      "That decimals have only one decimal place.",
      "That a place-value number is always smaller than 1000.",
      "That distance from zero and value are the same thing on the right-hand side, which is true there and may be over-generalised to the left.",
    ],
  },
  {
    model: "atom-model",
    level: "14–16 (atomic structure, isotopes and ions)",
    assumptions: [
      "Only the first twenty elements are named; beyond calcium the model says there is no name rather than inventing one.",
      "Mass number is protons + neutrons, ignoring binding energy and isotopic mass defect.",
      "Charge is protons − electrons in units of +e.",
      "The atom is shown as a nucleus plus shells, not as an orbital model.",
      "An isotope is any atom of the same element with a different neutron count, including unstable ones.",
    ],
    limitations: [
      "No electron configuration rules, subshells or ionisation energies.",
      "No relative atomic mass or isotopic abundance, so the periodic-table mass is not explained.",
      "No radioactivity or nuclear decay.",
      "The shell drawing is a model of the atom, not a scale picture of one.",
    ],
    addresses: [
      "A different number of neutrons makes a different element.",
      "An ion is a different element.",
      "An atom normally has equal protons and neutrons.",
      "Atom, element and matter are interchangeable words.",
    ],
    couldIntroduce: [
      "That the shell diagram is what an atom 'looks like'.",
      "That all isotopes are stable, because nothing on screen decays.",
      "That mass number is the same as relative atomic mass.",
    ],
  },
  {
    model: "cell-model",
    level: "11–14 (cell structure and organelle function)",
    assumptions: [
      "One generic plant cell and one generic animal cell stand for all cells of that type.",
      "Seven organelles are shown; others (Golgi, ER, lysosomes) are omitted at this level.",
      "Each organelle is given one job, though most have several.",
      "Switching a part off describes what stops, not what kills the cell.",
    ],
    limitations: [
      "NO CELL-TYPE DIMENSION: root hair, storage and leaf cells differ, and not every plant cell has chloroplasts. The model states this limitation in its copy rather than showing it.",
      "No scale, no tissue context, no specialised animal cells.",
      "Prokaryotes are not represented at all.",
    ],
    addresses: [
      "A plant cell is an animal cell with a wall and chloroplasts added.",
      "Only animal cells have mitochondria.",
      "The ribosome is the powerhouse of the cell.",
      "Chlorophyll is the organelle where photosynthesis happens.",
    ],
    couldIntroduce: [
      "That every plant cell has chloroplasts, which the limitation note contradicts in words but the picture does not.",
      "That a cell dies when one organelle stops, which the failure sentences deliberately avoid saying.",
      "That organelles are drawn to scale relative to one another.",
    ],
  },
  {
    model: "search-model",
    level: "14–16 (linear and binary search, algorithm comparison)",
    assumptions: [
      "The list is fourteen integers; linear search scans from the start.",
      "Binary search requires a sorted list and reports the window after each comparison.",
      "Cost is counted in comparisons only.",
      "Sorting is not modelled: the sorted list is given.",
    ],
    limitations: [
      "No sorting algorithm is run, so the cost of producing the sorted list is stated but not shown.",
      "No duplicate values, no missing-value edge cases beyond the target absent.",
      "One list size, so the growth rate is counted rather than measured.",
      "No implementation or code trace is shown.",
    ],
    addresses: [
      "Binary search works on any data.",
      "Binary search is always the better choice.",
      "Linear search needs sorted data.",
      "Each binary step halves the items still to check.",
    ],
    couldIntroduce: [
      "That comparison count is the only cost that matters.",
      "That binary search is always implementable, when the data may not be sortable or randomly accessible.",
    ],
  },
  {
    model: "fraction-model",
    level: "9–12 (part-whole meaning of a fraction)",
    assumptions: [
      "One whole, drawn as a single bar, cut into equal parts.",
      "Only proper fractions between 0 and 1.",
      "The numerator cannot exceed the denominator.",
    ],
    limitations: [
      "Part-whole only: no position on a number line, no comparison, no equivalence.",
      "No fractions greater than one or mixed numbers.",
      "This model is superseded for `fractions` by fraction-line-model; it is retained only where a concept explicitly binds to it.",
    ],
    addresses: ["A bigger denominator means a bigger piece."],
    couldIntroduce: [
      "That a fraction is only ever part of a shape, which is the reading the number-line evidence says is insufficient on its own.",
    ],
  },
  {
    model: "fraction-line-model",
    level: "9–14 (fractions as numbers; comparison and equivalence)",
    assumptions: [
      "The 0–1 interval is one whole, and the bar and the line represent the same whole.",
      "The whole is cut into equal pieces, and the numerator counts them.",
      "Only values from 0 to 1 are shown: proper fractions, including 1.",
      "Denominators run from 2 to 12, and the 1/2 landmark is the comparison benchmark.",
      "The comparison shown (3/4 against 5/8) is fixed, so the learner explores one fraction and reads one worked comparison.",
    ],
    limitations: [
      "No fractions greater than one, mixed numbers or negative fractions.",
      "No fraction density: the line does not show that infinitely many fractions lie between two points.",
      "No equivalence family interaction beyond the fixed comparison, so renaming is explained rather than explored.",
      "One decimal place is not shown on this line, so fraction–decimal equivalence is not covered.",
    ],
    addresses: [
      "1/8 is bigger than 1/4 because 8 is bigger than 4.",
      "Fractions are compared by their bottom numbers.",
      "A learner who can shade a part of a shape can therefore order fractions.",
    ],
    couldIntroduce: [
      "That fractions are always less than one, because the line stops at 1.",
      "That the marker's position is an exact measurement rather than a diagram of a value.",
      "That every fraction diagram is pre-partitioned into equal pieces, which is not how a learner meets a fraction in a problem.",
      "That a fraction's SIZE is fixed regardless of the whole it is taken from: 3/5 of a smaller whole can be a shorter piece than 1/5 of a larger one, and this model's whole never changes.",
    ],
  },
  {
    model: "fraction-ops-model",
    level: "11–14 (adding fractions with unlike denominators)",
    assumptions: [
      "Both fractions are positive and proper, with denominators from 2 to 12.",
      "The smallest common denominator is used, though any common multiple would be valid.",
      "Addition is represented as areas of equal-sized pieces of the same whole.",
      "The 'add tops and bottoms' answer is the mediant, drawn at its own scale.",
      "Simplification uses the greatest common divisor only.",
      "Only two addends are modelled.",
    ],
    limitations: [
      "No subtraction, multiplication or division of fractions.",
      "No mixed numbers or improper fractions.",
      "No estimation or number-sense check beyond the impossible-sum test.",
      "Only two addends, so a chain of additions is not shown.",
    ],
    addresses: [
      "1/2 + 1/3 = 2/5 by adding tops and bottoms.",
      "The multiplication rule also adds fractions.",
      "The denominator is a quantity to be added.",
    ],
    couldIntroduce: [
      "That a sum is always checked by an area diagram, which will not always be available.",
      "That the impossible-sum test always works: when the two fractions are equal, the mediant equals them, so the test cannot reject the wrong answer. The model's sentence handles this by falling back to the piece-size explanation.",
      "That the lowest common denominator is compulsory rather than convenient.",
    ],
  },
];

export function assumptionsFor(model: InteractiveModelId): ModelAssumptions | undefined {
  return MODEL_ASSUMPTIONS.find((m) => m.model === model);
}
