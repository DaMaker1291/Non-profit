// ─────────────────────────────────────────────────────────────────────────────
// THE FIRST THREE CONTENT-PLATFORM LESSONS.
//
// They are deliberately a vertical slice rather than a catalogue:
//
//   Physics   — a calculation and a formula rearrangement, with link-only
//               external resources shown as links rather than copied text.
//   Biology   — an authored schematic and a labelling response. The OpenStax
//               link is a link because its rights record is not cleared for
//               ingestion.
//   Computing — an authored first lesson with a real Python code lab in a
//               browser sandbox. This is the Computing coverage the product
//               did not have.
//
// ALL THREE ARE DRAFTS. `review.state` is "draft" in every document, and the
// renderer prints it. A machine-valid schema is not a teacher's approval.
// ─────────────────────────────────────────────────────────────────────────────
import type { SubjectId } from "../types";
import { planFor } from "../lesson-plans";
import type {
  Assessment,
  LessonBlock,
  LessonDocument,
  LessonSource,
} from "./types";
import { LESSON_SCHEMA_VERSION } from "./types";

const AUTHORED = "openmind-authored-pilot-12";
const FIGURES = "openmind-generated-figures";

const authoredSource: LessonSource = {
  id: "authored",
  sourceId: AUTHORED,
  use: "authored",
  title: "OpenMind authored teaching",
  attribution: "OpenMind contributors",
};

const figureSource: LessonSource = {
  id: "figures",
  sourceId: FIGURES,
  use: "authored",
  title: "OpenMind authored figure",
  attribution: "OpenMind contributors",
};

const phetSource: LessonSource = {
  id: "phet",
  sourceId: "phet",
  use: "linked",
  title: "Circuit Construction Kit: DC",
  url: "https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc",
  licence: "CC BY-NC 4.0 — link only; no simulation asset is embedded",
  attribution: "PhET Interactive Simulations, University of Colorado Boulder",
};

const openStaxPhysicsSource: LessonSource = {
  id: "openstax-physics",
  sourceId: "openstax",
  use: "linked",
  title: "College Physics 2e",
  url: "https://openstax.org/details/books/college-physics-2e",
  licence: "CC BY-NC-SA — link only until primary rights proof is recorded",
  attribution: "OpenStax, Rice University",
};

const openStaxBiologySource: LessonSource = {
  id: "openstax-biology",
  sourceId: "openstax",
  use: "linked",
  title: "Biology 2e",
  url: "https://openstax.org/details/books/biology-2e",
  licence: "CC BY-NC-SA — link only until primary rights proof is recorded",
  attribution: "OpenStax, Rice University",
};

function paragraphs(planId: string, count: number, fallback: string[]): string[] {
  const plan = planFor(planId);
  if (!plan) return fallback;
  return plan.idea.slice(0, count);
}

function base(
  id: string,
  conceptId: string,
  subject: SubjectId,
  title: string,
  curriculum: LessonDocument["curriculum"],
  sources: LessonSource[],
  blocks: LessonBlock[],
  assessments: Assessment[],
): LessonDocument {
  return {
    schemaVersion: LESSON_SCHEMA_VERSION,
    id,
    conceptId,
    subject,
    title,
    language: "en",
    estimatedMinutes: 18,
    curriculum,
    review: {
      state: "draft",
      note: "Authored for the content-platform slice; no subject teacher has reviewed it.",
    },
    sources,
    blocks,
    assessments,
  };
}

const physics: LessonDocument = base(
  "physics-electricity-circuits-v1",
  "electricity-circuits",
  "physics",
  "Circuits: current, voltage and resistance",
  {
    specId: "in-cbse",
    levelId: "class10",
    objective:
      "Use V = IR to calculate current, voltage or resistance, and explain what changing each quantity does to a circuit.",
  },
  [authoredSource, phetSource, openStaxPhysicsSource],
  [
    {
      id: "why",
      kind: "explanation",
      sourceIds: ["authored"],
      title: "Why a circuit has three quantities",
      paragraphs: paragraphs("electricity-circuits", 3, [
        "A circuit is a closed path. Charge is not used up as it goes round; energy is transferred to components.",
        "Current is charge flow per second. Potential difference is energy transferred per unit charge. Resistance is the opposition to current.",
        "At constant temperature, V = IR links the three quantities.",
      ]),
    },
    {
      id: "formula",
      kind: "formula",
      sourceIds: ["authored"],
      expression: "V = I × R",
      note: "V is potential difference in volts, I is current in amperes, and R is resistance in ohms.",
    },
    {
      id: "worked",
      kind: "worked_example",
      sourceIds: ["authored"],
      prompt: "A 6 V supply drives a current of 2 A through a resistor. Find the resistance.",
      steps: [
        "Choose the relationship that connects the three quantities: V = IR.",
        "Rearrange it for the quantity asked for: R = V / I.",
        "Substitute the values with their units: R = 6 V / 2 A = 3 Ω.",
      ],
      answer: "3 Ω",
    },
    {
      id: "calc-resistance",
      kind: "calculation",
      sourceIds: ["authored"],
      prompt: "A 12 V supply drives a current of 3 A through a resistor. Calculate the resistance.",
      unit: "Ω",
      hint: "Rearrange V = IR before substituting.",
    },
    {
      id: "rearrange",
      kind: "math_expression",
      sourceIds: ["authored"],
      prompt: "Make R the subject of V = IR.",
      variable: "R",
      hint: "Divide both sides by I.",
    },
    {
      id: "phet-link",
      kind: "link",
      sourceIds: ["phet"],
      title: "Explore the circuit yourself",
      url: "https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc",
      note: "Open the publisher's simulation in a new tab. OpenMind does not embed or copy it; this is a link, not an imported activity.",
    },
    {
      id: "openstax-link",
      kind: "link",
      sourceIds: ["openstax-physics"],
      title: "Read the textbook chapter",
      url: "https://openstax.org/details/books/college-physics-2e",
      note: "Link only. The book's licence has non-commercial and ShareAlike conditions, and the source registry has not recorded primary proof for ingestion.",
    },
  ],
  [
    {
      id: "assess-calc-resistance",
      blockId: "calc-resistance",
      kind: "numeric",
      answer: 4,
      tolerance: { abs: 0.01 },
      unit: "Ω",
      explanation:
        "Rearranging V = IR gives R = V / I. Substituting 12 V and 3 A gives 4 Ω. The resistance is 4 ohms, not 36 ohms: dividing is the move the rearrangement requires.",
    },
    {
      id: "assess-rearrange",
      blockId: "rearrange",
      kind: "math_expression",
      accepted: ["R=V/I", "R=\\frac{V}{I}"],
      variable: "R",
      explanation:
        "Starting from V = IR, divide both sides by I. The equation becomes V / I = R, which is the same statement as R = V / I. The value of R is not a number here; the question asks for the relationship.",
    },
  ],
);

const biology: LessonDocument = base(
  "biology-cells-v1",
  "cells",
  "biology",
  "Cells: structure serves function",
  {
    specId: "in-cbse",
    levelId: "class8-9",
    objective:
      "Name the main parts of an animal cell, and explain how each part's structure helps the cell do its job.",
  },
  [authoredSource, figureSource, openStaxBiologySource],
  [
    {
      id: "cell-idea",
      kind: "explanation",
      sourceIds: ["authored"],
      title: "A cell is a working unit, not a bag of parts",
      paragraphs: paragraphs("cells", 3, [
        "A cell is the smallest unit that carries out all the processes of life.",
        "An animal cell has a membrane, cytoplasm, a nucleus and mitochondria. Each part has a job.",
        "A plant cell adds a cellulose wall, chloroplasts and a large permanent vacuole.",
      ]),
    },
    {
      id: "label-cell",
      kind: "label_diagram",
      sourceIds: ["figures"],
      prompt: "Label the four numbered parts of this animal cell.",
      diagram: {
        kind: "cell",
        labels: ["cell membrane", "cytoplasm", "nucleus", "mitochondrion"],
        parts: [
          { id: "membrane", shape: "membrane", x: 50, y: 10 },
          { id: "cytoplasm", shape: "cytoplasm", x: 18, y: 60 },
          { id: "nucleus", shape: "nucleus", x: 52, y: 54 },
          { id: "mitochondrion", shape: "mitochondrion", x: 77, y: 72 },
        ],
      },
    },
    {
      id: "openstax-biology-link",
      kind: "link",
      sourceIds: ["openstax-biology"],
      title: "Read more about cell structure",
      url: "https://openstax.org/details/books/biology-2e",
      note: "Link only. The page is not copied into this lesson; the OpenStax rights record is pending review for ingestion.",
    },
  ],
  [
    {
      id: "assess-label-cell",
      blockId: "label-cell",
      kind: "labels",
      answers: {
        membrane: "cell membrane",
        cytoplasm: "cytoplasm",
        nucleus: "nucleus",
        mitochondrion: "mitochondrion",
      },
      explanation:
        "The membrane is the selectively permeable boundary; the cytoplasm is the jelly in which reactions occur; the nucleus holds DNA and controls the cell; mitochondria are the site of aerobic respiration. The label names the structure, but the reason it matters is the job it does.",
    },
  ],
);

const computing: LessonDocument = base(
  "computing-what-is-code-v1",
  "what-is-code",
  "computing",
  "What is code? A first Python program",
  {
    specId: "uk-gcse",
    levelId: "foundation",
    objective:
      "Write, run and debug a short Python program, and explain why an instruction must be precise enough for a computer to follow it exactly.",
  },
  [authoredSource],
  [
    {
      id: "code-is-instructions",
      kind: "explanation",
      sourceIds: ["authored"],
      title: "Code is a precise set of instructions",
      paragraphs: [
        "A computer does not infer what you meant. It follows the instructions it is given, in the order it is given them, which is why a program has to be precise about every step. Code is that set of instructions written in a language a person can edit and a machine can execute.",
        "A program is not a single magic command. It is built from small moves: store a value, repeat a step, make a decision, print a result. The skill is decomposition — breaking a goal such as \"add the numbers from 1 to 5\" into steps small enough that each one can be checked.",
        "Python is a programming language with readable syntax. `total = 0` creates a name for a value; `for i in range(1, 6):` repeats the indented block with i taking each value from 1 up to, but not including, 6. The upper bound being excluded is a common source of off-by-one errors, and it is exactly the kind of detail a computer will not forgive.",
      ],
    },
    {
      id: "debug-loop",
      kind: "code_lab",
      sourceIds: ["authored"],
      prompt:
        "This program should add the numbers 1 to 5 and print 15, but it prints 10. Find the off-by-one error, fix it, and run the program. Then explain why the corrected range ends at 6 rather than 5.",
      language: "python",
      starterCode:
        "total = 0\nfor i in range(1, 5):\n    total = total + i\nprint(total)\n",
      timeoutMs: 12000,
    },
  ],
  [
    {
      id: "assess-debug-loop",
      blockId: "debug-loop",
      kind: "code",
      tests: [{ name: "the program prints 15", expectedStdout: "15" }],
      explanation:
        "`range(1, 5)` produces 1, 2, 3 and 4; it stops before 5, so the total is 10. The corrected loop is `range(1, 6)`, which produces 1 through 5 and prints 15. The upper bound is excluded — that is the rule, not a typo in the lesson.",
    },
  ],
);

const DOCUMENTS: LessonDocument[] = [physics, biology, computing];

export function allLessonDocuments(): readonly LessonDocument[] {
  return DOCUMENTS;
}

export function lessonDocumentFor(conceptId: string): LessonDocument | null {
  return DOCUMENTS.find((d) => d.conceptId === conceptId) ?? null;
}
