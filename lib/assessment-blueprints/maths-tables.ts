import type { AssessmentBlueprint } from "../assessment-intelligence";

// A THIRD RESPONSE FORMAT, NOT A THIRD MARKING ENGINE.
//
// Biology exercises explanation and Physics exercises equations. This blueprint
// exercises a TABLE: the learner fills cells in reading order, and the existing
// marker awards one mark per cell. It also keeps a short recall item and a prose
// explanation so the blueprint proves that one scheme can carry structured,
// short and human-marked responses without flattening them into one score.
//
// The source is OpenMind-authored, so rights and licensing are recorded as
// clear. That is deliberately NOT enough to serve it: the pedagogical review is
// still missing, and the serving gate must refuse it for that reason alone.
export const MATHS_TABLES_BLUEPRINT: AssessmentBlueprint = {
  contract: "openmind.assessment-blueprint/1.0",
  id: "maths.tables-substitution.ks3",
  version: "1.0.0",
  title: "Tables, substitution and square signs: assessment blueprint",
  subject: "maths",
  level: "Key Stage 3 / lower secondary",
  curriculumContext:
    "A Key Stage 3 algebra unit on substituting into a linear rule, reading a table of values, and distinguishing the square of a negative number from the negative of a square. It is not a claim about GCSE, A-level or another qualification.",

  sources: [
    {
      id: "om-tables-authoring",
      label: "OpenMind-authored table and substitution item set",
      kind: "openmind-authored",
      availability: "openmind-authored",
      curriculumContext: "Key Stage 3 algebra: substitution, tables of values and precedence",
      sha256: "d2f1b8c4a6e09f3d5b7c1a2e4f6089b3c5d7e9f1a2b4c6d8e0f1a3b5c7d9e1f0",
      rights: "cleared",
      licensing: "cleared",
      allowedUse: "pattern-extraction-only",
      reproduction: "none",
      containsSourceText: false,
      studentDataObserved: false,
      note:
        "Written for OpenMind. No third-party question, table, mark scheme or specification sentence is reproduced. The item is still unreviewed by a mathematics teacher.",
    },
  ],

  archetypes: [
    {
      id: "table-completion",
      command: "calculate",
      demand: "apply",
      markRange: [4, 4],
      evidence:
        "The learner substitutes each listed x value into the same linear rule and writes the corresponding y value in the table.",
      progression:
        "Moves from a rule in symbols to a coordinated set of values; each cell is independent, so a single slip does not erase the cells that are right.",
    },
    {
      id: "recall-parts",
      command: "identify",
      demand: "recall",
      markRange: [2, 2],
      evidence:
        "The learner names the coefficient and the constant term in a linear expression.",
      progression:
        "Establishes the vocabulary needed to read the rule before substituting into it.",
    },
    {
      id: "explain-square-sign",
      command: "explain",
      demand: "understand",
      markRange: [3, 3],
      evidence:
        "The learner explains that squaring a negative gives a positive, that the subtraction outside the square is not an addition, and states the correct value.",
      progression:
        "Requires a reason and a corrected value, not merely a different number; a correct answer with no explanation does not earn the explanation points.",
    },
  ],

  misconceptions: [
    {
      id: "square-negative-is-negative",
      label: "Squaring a negative number makes it negative",
      whyWrong:
        "(−1)² means (−1) × (−1), and a negative times a negative is positive. The square is 1, not −1. A minus sign outside the square is a separate subtraction applied after squaring, so x² − 2 at x = −1 is 1 − 2 = −1.",
      diagnosticSignal:
        "The answer says (−1)² is −1, or turns x² − 2 into x² + 2 when x is negative.",
      feedback:
        "Square first and keep the sign of the square separate from the subtraction after it: (−1)² = 1, then 1 − 2 = −1.",
    },
  ],

  progression: ["recall", "apply", "understand"],

  items: [
    {
      id: "mt-01",
      archetypeId: "table-completion",
      conceptId: "linear-equations",
      prompt: "Complete the table of values for y = 2x + 1.",
      marks: 4,
      responseKind: "table",
      modelAnswer:
        "At x = −1, y = −1; at x = 0, y = 1; at x = 1, y = 3; at x = 2, y = 5.",
      table: {
        columns: ["x = −1", "x = 0", "x = 1", "x = 2"],
        rows: [
          {
            label: "y = 2x + 1",
            cells: [
              { answer: -1, accepted: ["−1", "-1"], tolerance: { abs: 0 } },
              { answer: 1, accepted: ["1"], tolerance: { abs: 0 } },
              { answer: 3, accepted: ["3"], tolerance: { abs: 0 } },
              { answer: 5, accepted: ["5"], tolerance: { abs: 0 } },
            ],
          },
        ],
      },
      criteria: [
        { id: "mt-01-c1", kind: "answer", marks: 1, credit: "x = −1 gives y = −1" },
        { id: "mt-01-c2", kind: "answer", marks: 1, credit: "x = 0 gives y = 1" },
        { id: "mt-01-c3", kind: "answer", marks: 1, credit: "x = 1 gives y = 3" },
        { id: "mt-01-c4", kind: "answer", marks: 1, credit: "x = 2 gives y = 5" },
      ],
      partialCreditRule:
        "Each blank cell is marked independently, so two correct cells earn two marks. The rule is the same for every cell: multiply x by 2, then add 1.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "mt-02",
      archetypeId: "recall-parts",
      conceptId: "algebra-expressions",
      prompt: "In the expression 2x + 1, name the coefficient of x and the constant term.",
      marks: 2,
      responseKind: "short-answer",
      modelAnswer: "The coefficient of x is 2; the constant term is 1.",
      criteria: [
        {
          id: "mt-02-c1",
          kind: "evidence",
          marks: 1,
          credit: "names 2 as the coefficient of x",
          acceptable: ["2", "two", "coefficient is 2", "coefficient 2"],
        },
        {
          id: "mt-02-c2",
          kind: "evidence",
          marks: 1,
          credit: "names 1 as the constant term",
          acceptable: ["1", "one", "constant is 1", "constant 1", "constant term is 1"],
        },
      ],
      partialCreditRule:
        "Each named part earns its own mark. Naming only the coefficient earns one mark; the constant is a separate point.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "mt-03",
      archetypeId: "explain-square-sign",
      conceptId: "quadratics",
      prompt:
        "A learner substitutes x = −1 into y = x² − 2 and says the answer is 3, because (−1)² = 1 and 1 + 2 = 3. Explain the mistake and give the correct value of y.",
      marks: 3,
      responseKind: "extended-response",
      modelAnswer:
        "(−1)² means (−1) × (−1), which is 1, not −1. The rule subtracts 2 after squaring, so y = 1 − 2 = −1. The learner changed the subtraction into an addition.",
      criteria: [
        {
          id: "mt-03-c1",
          kind: "evidence",
          marks: 1,
          credit: "squares −1 correctly and gets 1",
        },
        {
          id: "mt-03-c2",
          kind: "evidence",
          marks: 1,
          credit: "keeps the subtraction outside the square: 1 − 2, not 1 + 2",
          misconceptionId: "square-negative-is-negative",
          signals: ["square is negative", "(-1) squared is -1", "−1 squared is −1"],
        },
        {
          id: "mt-03-c3",
          kind: "evidence",
          marks: 1,
          credit: "states the corrected value y = −1",
        },
      ],
      partialCreditRule:
        "Each idea is a separate mark: the square, the operation after it, and the corrected value. A correct value with no reason earns at most the value mark.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
  ],

  limitations: [
    "No mathematics teacher has reviewed the items, the answers or the three-mark explanation rubric.",
    "The table marker checks cell values, not the method a learner used to obtain them.",
    "A prose explanation is rubric-only and is not machine-scored; its misconception signal is advisory.",
    "The Blueprint is Key Stage 3 only and does not establish GCSE, A-level or international equivalence.",
  ],

  reviews: [],
  reviewStatus: "unreviewed",
  teacherReviewed: false,
  learnerTested: false,
  humanReviewCount: 0,
};
