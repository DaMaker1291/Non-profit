// ─────────────────────────────────────────────────────────────────────────────
// A CONSTRUCTED-RESPONSE ITEM, WITH A MARK SCHEME THAT CAN BE AUDITED.
//
// Every paper item before this one was four options with one right answer, and
// every mark was all-or-nothing. This module holds the first vertical slice of
// the other kind, and its rules are small enough to state once and test:
//
//   * TWO CRITERIA PER PART: a METHOD mark (M) and an ANSWER mark (A). Total
//     marks are the sum of the criteria, asserted at module load, so the paper's
//     declared total cannot drift.
//   * A METHOD MARK NEEDS THE METHOD TO BE SHOWN. The learner types their working
//     into its own box, and the mark is earned by matching an authored form of a
//     correct method. A method this engine cannot see is a method it does not
//     award — and it never infers working from a right answer.
//   * A METHOD MARK SURVIVES A WRONG ANSWER. `30 ÷ 12` written with the answer
//     `2.5` earns the method mark and loses the answer mark, which is the whole
//     point of partial credit: the reasoning was right and the rounding was not.
//   * AN ANSWER MARK IS THE VALUE OR AN AUTHORED EQUIVALENT, and a measurement
//     part's unit is part of the answer. `30` is not `30 m²`.
//   * NO FOLLOW-THROUGH, NO "CONSISTENT WITH THEIR WORKING" MARKS YET. AQA's
//     scheme has them; this engine does not, and the item says so rather than
//     pretending otherwise.
//
// Adding a second item means authoring its arithmetic and its accepted forms; it
// does not mean writing a new marking engine.
// ─────────────────────────────────────────────────────────────────────────────

import { gradeNumeric, parseNumericInput } from "./answer";
import { algebraEquivalent, formatPolynomial, parsePolynomial } from "./algebra";
import { coefficients, definingLine, lineThrough, valueAt, type PlotLine, type PlotPoint } from "./plot-geometry";
import type { NumericTolerance } from "./types";

/** One method criterion. `accept` is the list of WORKING forms that earn it,
 *  normalised before comparison (case, spaces, × * and £ are folded) — authored,
 *  so accepting a method is a decision somebody made and can review. */
export interface StructuredMethod {
  id: string;
  marks: number;
  /** What the learner is asked to show, in the working box's own label. */
  prompt: string;
  accept: string[];
  /** The method in words, for the feedback. */
  label: string;
}

/** A line the learner must give: `y = m x + c`, with the slop the question
 *  allows. The truth is the COEFFICIENTS, never the endpoints — two learners can
 *  draw the same line from different pairs of points, and the marker must honour
 *  that. */
export interface GraphSpec {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  m: number;
  c: number;
  tolerance: { m: number; c: number };
}

/** A LINE THE LEARNER PLOTS POINT BY POINT. Unlike `GraphSpec`, the truth here
 *  is the POINTS: a question can require four plotted points and a joining line,
 *  and a marker that only compared gradient and intercept would award full marks
 *  to two typed coordinates that never plotted the required points. */
export interface PlotSpec {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  /** The points the question requires, on the grid's own scale. */
  points: Array<{ x: number; y: number }>;
  /** How far a plotted point may sit from its required position, in GRID
   *  SQUARES. The grid draws one square per unit, so 0.5 is half a square —
   *  the AQA allowance — rather than a coordinate distance chosen by feel. */
  tolerance: number;
  /** The fewest correct points that earn the partial mark WITH a joining line.
   *  This is the B1 rung: at least two points and clear line intention. */
  partialMin: number;
  /** The intended line, used to mark the read-off part that follows. */
  m: number;
  c: number;
  lineTolerance: { m: number; c: number };
}

export interface TableCellSpec {
  /** A value printed in the question. Exactly one of `given` and `answer` is set. */
  given?: string;
  /** The truth for an editable cell. */
  answer?: number;
  /** Other printed forms that are the same answer. */
  accepted?: string[];
  tolerance?: NumericTolerance;
  unit?: string;
}

export interface TableSpec {
  /** The data-column headings. The row-label column is separate. */
  columns: string[];
  rows: Array<{ label?: string; cells: TableCellSpec[] }>;
}

export interface AlgebraSpec {
  /** The single variable the expression may contain. Defaults to x. */
  variable?: string;
  /** Authored equivalent forms. Compared by polynomial coefficients, not text. */
  accepted: string[];
  /** True when the question asks for the EXPANDED form. A factorised answer is
   *  then mathematically equal but not the response the question asked for, so
   *  brackets are refused with that reason. */
  requireExpanded?: boolean;
}

export interface StructuredPart {
  /** Stable id inside the item, e.g. "a". */
  id: string;
  prompt: string;
  /** TOTAL marks for the part: the method marks plus the answer marks. */
  marks: number;
  /** The truth a numeric answer is checked against. Absent on a graph, plot,
   *  read-off, algebra or table part — each has its own key below. */
  answer?: number;
  tolerance?: NumericTolerance;
  /** Other PRINTED forms that are the same answer, compared after normalisation. */
  accepted?: string[];
  /** The unit the answer is in, when the part is a measurement. */
  unit?: string;
  /** true = the unit must be present for the answer mark. */
  unitRequired?: boolean;
  /** The method criterion, when the part has one. Its `marks` are a subset of
   *  `marks`; the remainder is the answer mark. */
  method?: StructuredMethod;
  /** HOW THE LEARNER ANSWERS. Absent = a value typed into the answer box.
   *  `graph` = two points typed as `x,y x,y`, marked as the line they define.
   *  `plot` = points plotted on the question's grid and joined, marked against
   *  the required plotted points. `readoff` = a value read from the line the
   *  learner themselves drew in an earlier part (follow-through). `algebra` is
   *  any polynomial-equivalent expression; `table` is one value per blank cell. */
  response?: "number" | "graph" | "plot" | "readoff" | "algebra" | "table";
  /** The line a graph part asks for. Never served to the browser. */
  graph?: GraphSpec;
  /** The plotted points a plot part requires. Never served to the browser. */
  plot?: PlotSpec;
  /** A read-off part: `from` names the earlier part whose line is the basis,
   *  `at` is the x value to read at, and the mark is for consistency with the
   *  learner's own line — that is what follow-through means. */
  readOff?: { from: string; at: number; tolerance: number };
  /** Authored equivalent expressions. Never served — only the instruction is. */
  algebra?: AlgebraSpec;
  /** A table with blank cells. The answers are never served. */
  table?: TableSpec;
  explanation: string;
}

export interface StructuredItem {
  id: string;
  conceptId: string;
  title: string;
  intro: string;
  /** What this item does NOT assess, stated on the item rather than discovered. */
  note: string;
  difficulty: number;
  parts: StructuredPart[];
}

export interface StructuredCriterionMark {
  id: string;
  kind: "method" | "accuracy";
  label: string;
  awarded: number;
  marks: number;
  met: boolean;
  /** Why it was or was not met, in words — the feedback IS the mark scheme. */
  why: string;
}

export interface StructuredPartMark {
  partId: string;
  awarded: number;
  marks: number;
  /** True only when every criterion in the part was met. */
  correct: boolean;
  given: string;
  working: string;
  criteria: StructuredCriterionMark[];
}

export interface StructuredGrade {
  parts: StructuredPartMark[];
  awarded: number;
  marks: number;
  /** How many parts carried any input (answer OR working). Zero means the
   *  question was not answered at all — which is NOT evidence of a wrong belief,
   *  and the route's ledger depends on telling those apart. */
  answered: number;
}

// ── The first item ──────────────────────────────────────────────────────────

const LINE_GRAPH: StructuredItem = {
  id: "sf-line-graph",
  conceptId: "straight-lines",
  title: "Straight-line graphs",
  intro:
    "Three straight lines, each worth 2 marks: one for its gradient and one for its y-intercept.\n\n" +
    "Give two points that lie on the line, written as x,y and x,y.",
  note:
    "Marked from the geometry of the line you give, so any two points on the correct line are accepted — " +
    "the gradient and the intercept are compared with this question's own tolerance, not against a picture. " +
    "Coordinates are typed; drawing freehand on the grid is not implemented.",
  difficulty: 0.6,
  parts: [
    {
      id: "a",
      prompt: "Give two points on the line y = 2x + 1.",
      marks: 2,
      answer: 0,
      response: "graph",
      graph: { xMin: -4, xMax: 4, yMin: -6, yMax: 9, m: 2, c: 1, tolerance: { m: 0.15, c: 0.35 } },
      explanation:
        "The gradient is the number multiplying x, so it is 2: from any point on the line, going 1 right means going 2 up. " +
        "The +1 is the y-intercept — the line crosses the y-axis at (0, 1). (0, 1) and (1, 3) are one valid pair; so are (−1, −1) and (2, 5).",
    },
    {
      id: "b",
      prompt: "Give two points on the line y = −x + 3.",
      marks: 2,
      answer: 0,
      response: "graph",
      graph: { xMin: -4, xMax: 4, yMin: -4, yMax: 8, m: -1, c: 3, tolerance: { m: 0.15, c: 0.35 } },
      explanation:
        "A gradient of −1 falls as it goes right: 1 right, 1 down. The line crosses the y-axis at (0, 3), so (0, 3) and (2, 1) " +
        "both lie on it. Writing it as y = 3 − x is the same line; the sign belongs to the x term.",
    },
    {
      id: "c",
      prompt: "Give two points on the line y = 0.5x − 2.",
      marks: 2,
      answer: 0,
      response: "graph",
      graph: { xMin: -4, xMax: 4, yMin: -5, yMax: 4, m: 0.5, c: -2, tolerance: { m: 0.1, c: 0.3 } },
      explanation:
        "Half a unit up for every 1 right: that is the gradient 0.5. The line crosses the y-axis at (0, −2), so (0, −2) " +
        "and (2, −1) lie on it. Choosing a point 2 right is easier here, because the y value then moves a whole unit.",
    },
  ],
};

const PLOT_LINE: StructuredItem = {
  id: "sf-plot-line",
  conceptId: "straight-lines",
  title: "Plotting a straight line",
  intro:
    "Plot the points on the grid, join them with a straight line, and read a value from the line you drew.\n\n" +
    "Part (a) is worth 2 marks and part (b) 1 mark; parts (c) and (d) do the same for a second line.",
  note:
    "Part (a) is marked the way a plotted-line question is marked: 2 marks when every required point is plotted " +
    "and joined by a straight line, 1 mark when at least two required points are plotted and joined. " +
    "Part (b) is marked against YOUR line, not the answer's — a plotting slip that you then read correctly still earns the read-off mark.",
  difficulty: 0.55,
  parts: [
    {
      id: "a",
      prompt: "Plot the points on y = 2x − 1 for x = −1, 0, 2 and 3, then join them with a straight line.",
      marks: 2,
      answer: 0,
      response: "plot",
      plot: {
        xMin: -4, xMax: 4, yMin: -6, yMax: 9,
        points: [{ x: -1, y: -3 }, { x: 0, y: -1 }, { x: 2, y: 3 }, { x: 3, y: 5 }],
        // Half a small square: the grid's squares are 1 unit, so 0.5 is the
        // AQA allowance rather than a coordinate distance chosen by feel.
        tolerance: 0.5, partialMin: 2, m: 2, c: -1, lineTolerance: { m: 0.15, c: 0.4 },
      },
      explanation:
        "Substitute each x into y = 2x − 1: x = −1 gives −3, x = 0 gives −1, x = 2 gives 3, x = 3 gives 5. " +
        "Plotted together they sit on one straight line, because the rule adds the same 2 to y for every 1 across. " +
        "Two correct points with a line already earns the partial mark; the full mark needs all four plotted.",
    },
    {
      id: "b",
      prompt: "Use your line to write down the value of y when x = 1.5.",
      marks: 1,
      answer: 2,
      response: "readoff",
      readOff: { from: "a", at: 1.5, tolerance: 0.45 },
      explanation:
        "x = 1.5 is halfway between 1 and 2, so on the line it sits halfway between y = 1 and y = 3: y = 2. " +
        "Reading from your own graph is accepted even if your plotted line was slightly out — the mark is for reading it correctly.",
    },
    {
      id: "c",
      prompt: "Give two points on the line y = −x + 3.",
      marks: 2,
      answer: 0,
      response: "graph",
      graph: { xMin: -4, xMax: 4, yMin: -4, yMax: 8, m: -1, c: 3, tolerance: { m: 0.15, c: 0.35 } },
      explanation:
        "A gradient of −1 falls as it goes right: 1 right, 1 down. The line crosses the y-axis at (0, 3), so (0, 3) and (2, 1) both lie on it.",
    },
    {
      id: "d",
      prompt: "Use the line you gave in part (c) to write down the value of y when x = −1.",
      marks: 1,
      answer: 4,
      response: "readoff",
      readOff: { from: "c", at: -1, tolerance: 0.45 },
      explanation:
        "On y = −x + 3, x = −1 gives y = 1 + 3 = 4. Reading from your own line is accepted when it is the line you stated.",
    },
  ],
};

const LAWN_FEED: StructuredItem = {
  id: "sf-lawn-feed",
  conceptId: "area-perimeter",
  title: "Lawn feed",
  intro:
    "A rectangular lawn is 7.5 m long and 4 m wide.\n\n" +
    "Each part is worth 2 marks: 1 for the method you show, and 1 for the answer.",
  note:
    "The method mark is earned by the working you type and is kept even when the answer is wrong — " +
    "OpenMind cannot award a method it cannot see, and it does not infer your working from a right answer. " +
    "This is a two-rung scheme: follow-through marks are not implemented.",
  difficulty: 0.55,
  parts: [
    {
      id: "a",
      prompt: "Work out the area of the lawn. Give your answer in m².",
      marks: 2,
      answer: 30,
      unit: "m²",
      unitRequired: true,
      accepted: ["30 m²", "30 m2", "30 square metres"],
      method: {
        id: "a:M1",
        marks: 1,
        prompt: "Show the calculation you used",
        accept: ["7.5 × 4", "7.5 × 4 = 30", "7.5*4", "7.5 x 4", "7.5x4=30"],
        label: "length × width",
      },
      explanation:
        "Area of a rectangle is length × width: 7.5 × 4 = 30. Area is measured in square " +
        "units, so the answer is 30 m² — a bare 30 names a length, not a region.",
    },
    {
      id: "b",
      prompt:
        "A bag of lawn feed covers 12 m². How many bags are needed to cover the whole lawn?",
      marks: 2,
      answer: 3,
      accepted: ["3 bags"],
      method: {
        id: "b:M1",
        marks: 1,
        prompt: "Show the division you used",
        accept: ["30 ÷ 12", "30 ÷ 12 = 2.5", "30/12", "30 ÷ 12 = 2.5, so 3 bags"],
        label: "area ÷ coverage",
      },
      explanation:
        "30 ÷ 12 = 2.5, so two bags cover only 24 m² and leave 6 m² bare. You cannot buy half " +
        "a bag, so the number of bags must round UP to 3 — 2.5 is the division, not the answer.",
    },
    {
      id: "c",
      prompt: "Each bag costs £8.50. Work out the total cost of the bags needed.",
      marks: 2,
      answer: 25.5,
      tolerance: { abs: 0.001, display: "£25.50" },
      accepted: ["£25.50", "£25.5", "25.50 pounds", "25.5 pounds"],
      method: {
        id: "c:M1",
        marks: 1,
        prompt: "Show the multiplication you used",
        accept: ["3 × 8.50", "3 × £8.50", "3*8.5", "3 x 8.50", "3 × 8.5 = 25.5"],
        label: "bags × price",
      },
      explanation:
        "Three bags at £8.50 each: 3 × 8.50 = 25.50, so the total is £25.50. Paying for 2.5 " +
        "bags gives £21.25 and buys feed that does not exist, so it cannot cover the lawn.",
    },
  ],
};

const FOUNDATION_PROPORTION: StructuredItem = {
  id: "sf-proportion",
  conceptId: "percentages",
  title: "Fractions and percentages",
  intro: "Two short calculations. Give each answer in its simplest form.",
  note: "Each part is worth one mark and is marked from the value you enter. The marker accepts a fraction or an equivalent decimal where the question does not require one particular form.",
  difficulty: 0.45,
  parts: [
    {
      id: "a",
      prompt: "Work out 3/4 of 240.",
      marks: 1,
      answer: 180,
      accepted: ["180"],
      explanation:
        "A quarter of 240 is 60, because 240 ÷ 4 = 60. Three quarters is three of those parts: 3 × 60 = 180. Dividing by 4 and multiplying by 3 gives the same result, 240 × 3 ÷ 4 = 180.",
    },
    {
      id: "b",
      prompt: "Increase 240 by 15%.",
      marks: 1,
      answer: 276,
      accepted: ["276"],
      explanation:
        "15% of 240 is 0.15 × 240 = 36. Increasing means adding that change to the original amount: 240 + 36 = 276. A single multiplier gives the same answer: 240 × 1.15 = 276.",
    },
  ],
};

const HIGHER_SURDS: StructuredItem = {
  id: "hf-surds",
  conceptId: "surds",
  title: "Surds",
  intro: "Two short exact-value questions. Do not use a decimal approximation.",
  note: "Both parts are marked from an exact numeric value. Simplifying a surd is a Higher-tier technique; the marker checks the value, not the spelling of the radical.",
  difficulty: 0.68,
  parts: [
    {
      id: "a",
      prompt: "Write √50 in the form k√2. Give the value of k.",
      marks: 1,
      answer: 5,
      accepted: ["5"],
      explanation:
        "Find a square factor of 50: 50 = 25 × 2, so √50 = √25 × √2 = 5√2. The value multiplying √2 is 5, and 5 is exact — a decimal such as 7.07 is an approximation of the whole surd, not k.",
    },
    {
      id: "b",
      prompt: "Work out (2√3)^2. Give your answer as an integer.",
      marks: 1,
      answer: 12,
      accepted: ["12"],
      explanation:
        "Square each factor: (2√3)^2 = 2^2 × (√3)^2 = 4 × 3 = 12. The square root disappears because squaring and taking the positive square root are inverse operations for a positive number.",
    },
  ],
};

const FOUNDATION_ALGEBRA: StructuredItem = {
  id: "sf-expand",
  conceptId: "algebra-expand",
  title: "Expanding and simplifying",
  intro: "Three short algebra questions. Enter an expression; equivalent forms are accepted.",
  note: "The marker expands what you type and compares it with the required polynomial. Equivalent forms such as 12 + 3x and 3x + 12 are accepted; it cannot mark equations or expressions containing division.",
  difficulty: 0.5,
  parts: [
    {
      id: "a",
      prompt: "Expand 3(x + 4).",
      marks: 1,
      answer: 0,
      response: "algebra",
      algebra: { accepted: ["3x + 12", "12 + 3x"], requireExpanded: true },
      explanation:
        "Multiply each term inside the bracket by 3: 3 × x = 3x and 3 × 4 = 12. The expansion is 3x + 12. Leaving it as 3(x + 4) is equivalent but is not expanded, which is what the question asks for.",
    },
    {
      id: "b",
      prompt: "Expand x(x − 5).",
      marks: 1,
      answer: 0,
      response: "algebra",
      algebra: { accepted: ["x^2 - 5x"], requireExpanded: true },
      explanation:
        "Multiply x by each term: x × x = x² and x × (−5) = −5x. The expansion is x² − 5x. The term −5x keeps its sign; writing +5x is the common sign slip here.",
    },
    {
      id: "c",
      prompt: "Simplify 2x + 3x − 4.",
      marks: 1,
      answer: 0,
      response: "algebra",
      algebra: { accepted: ["5x - 4", "-4 + 5x"], requireExpanded: true },
      explanation:
        "2x and 3x are like terms, so their coefficients add: 2 + 3 = 5, giving 5x. The constant −4 cannot be combined with an x term, so the simplified expression is 5x − 4. Adding the coefficients to make 6x, or adding −4 to them, are the usual slips.",
    },
  ],
};

const HIGHER_ALGEBRA: StructuredItem = {
  id: "hf-algebra",
  conceptId: "algebra-expand",
  title: "Expanding products",
  intro: "Three Higher-tier algebra questions. Enter an expression; equivalent forms are accepted.",
  note: "The marker compares the expanded polynomial with the required one. It accepts any equivalent polynomial, including a different order of terms, and it refuses equations or division because they are outside this response type.",
  difficulty: 0.72,
  parts: [
    {
      id: "a",
      prompt: "Expand (x + 3)(x − 2).",
      marks: 1,
      answer: 0,
      response: "algebra",
      algebra: { accepted: ["x^2 + x - 6"], requireExpanded: true },
      explanation:
        "Multiply every term in the first bracket by every term in the second: x² − 2x + 3x − 6. Collecting the middle terms gives x² + x − 6. The two middle terms are different signed terms, so they do not vanish.",
    },
    {
      id: "b",
      prompt: "Simplify (2x^3)(3x^2).",
      marks: 1,
      answer: 0,
      response: "algebra",
      algebra: { accepted: ["6x^5"], requireExpanded: true },
      explanation:
        "Multiply the coefficients: 2 × 3 = 6. Multiply the powers of x by adding the indices: x³ × x² = x^(3+2) = x⁵. The result is 6x⁵, not 6x⁶ — the indices add rather than multiply.",
    },
    {
      id: "c",
      prompt: "Expand (2x − 1)^2.",
      marks: 1,
      answer: 0,
      response: "algebra",
      algebra: { accepted: ["4x^2 - 4x + 1"], requireExpanded: true },
      explanation:
        "Write the square as (2x − 1)(2x − 1), then multiply all four pairs: 4x² − 2x − 2x + 1. The middle terms add to −4x, so the result is 4x² − 4x + 1. It is not 4x² + 1: squaring a bracket does not square its terms separately.",
    },
  ],
};

const TABLE_LINE: StructuredItem = {
  id: "sf-table-line",
  conceptId: "linear-equations",
  title: "A table of values",
  intro: "Complete the table of values for y = 2x + 1.",
  note: "Each blank cell is worth one mark and is marked independently. Substitute each x value into the same rule; the order of the cells follows the x values from left to right.",
  difficulty: 0.46,
  parts: [
    {
      id: "a",
      prompt: "Complete the missing values in the table.",
      marks: 4,
      answer: 0,
      response: "table",
      table: {
        columns: ["x = −1", "x = 0", "x = 1", "x = 2"],
        rows: [{
          label: "y = 2x + 1",
          cells: [
            { answer: -1, accepted: ["−1", "-1"], tolerance: { abs: 0 } },
            { answer: 1, tolerance: { abs: 0 } },
            { answer: 3, tolerance: { abs: 0 } },
            { answer: 5, tolerance: { abs: 0 } },
          ],
        }],
      },
      explanation:
        "Substitute each x into y = 2x + 1. At x = −1, 2 × (−1) + 1 = −1; at x = 0 the value is 1; at x = 1 it is 3; and at x = 2 it is 5. Each step adds 2 to y because the coefficient of x is 2.",
    },
  ],
};

const TABLE_QUADRATIC: StructuredItem = {
  id: "hf-table-quadratic",
  conceptId: "quadratics",
  title: "A quadratic table",
  intro: "Complete the table of values for y = x² − 2x.",
  note: "Each cell is marked separately. The square applies only to x, so at a negative x value the first term is positive even though x itself is negative.",
  difficulty: 0.7,
  parts: [
    {
      id: "a",
      prompt: "Complete the missing values for y = x² − 2x.",
      marks: 4,
      answer: 0,
      response: "table",
      table: {
        columns: ["x = −1", "x = 0", "x = 1", "x = 3"],
        rows: [{
          label: "y = x² − 2x",
          cells: [
            { answer: 3, tolerance: { abs: 0 } },
            { answer: 0, tolerance: { abs: 0 } },
            { answer: -1, accepted: ["−1", "-1"], tolerance: { abs: 0 } },
            { answer: 3, tolerance: { abs: 0 } },
          ],
        }],
      },
      explanation:
        "At x = −1, x² = 1 and −2x = 2, so y = 3. At x = 0 both terms are 0. At x = 1, 1 − 2 = −1. At x = 3, 9 − 6 = 3. The squared term is positive at both negative and positive x, while the −2x term changes sign.",
    },
  ],
};

const FOUNDATION_ANGLES: StructuredItem = {
  id: "sf-angle-chain",
  conceptId: "angles-lines",
  title: "Angle facts",
  intro: "Five short angle questions. Each answer is a number of degrees.",
  note: "Each part is one mark. The reasons are the standard angle facts; the marker checks the value, and the explanation beside each part states the reason.",
  difficulty: 0.48,
  parts: [
    {
      id: "a",
      prompt: "Angles on a straight line add to how many degrees?",
      marks: 1,
      answer: 180,
      explanation:
        "A straight angle is half a full turn. A full turn is 360°, so a straight line is 360° ÷ 2 = 180°. This is why two adjacent angles on a straight line are supplementary.",
    },
    {
      id: "b",
      prompt: "A triangle has angles 48° and 65°. Work out the third angle.",
      marks: 1,
      answer: 67,
      accepted: ["67°"],
      explanation:
        "The angles in a triangle add to 180°. The two given angles add to 48 + 65 = 113, so the third is 180 − 113 = 67°. Subtracting from 360 would be the full-turn fact, not the triangle fact.",
    },
    {
      id: "c",
      prompt: "A quadrilateral has angles 90°, 90° and 110°. Work out the fourth angle.",
      marks: 1,
      answer: 70,
      accepted: ["70°"],
      explanation:
        "The angles in a quadrilateral add to 360°. The three given angles total 90 + 90 + 110 = 290, so the fourth is 360 − 290 = 70°.",
    },
    {
      id: "d",
      prompt: "An isosceles triangle has an apex angle of 40°. Work out each base angle.",
      marks: 1,
      answer: 70,
      accepted: ["70°"],
      explanation:
        "The two base angles of an isosceles triangle are equal. They share 180 − 40 = 140°, so each is 140 ÷ 2 = 70°. The 40° is not one of the equal angles here.",
    },
    {
      id: "e",
      prompt: "Work out the exterior angle of a regular pentagon.",
      marks: 1,
      answer: 72,
      accepted: ["72°"],
      explanation:
        "The exterior angles of any polygon add to 360°. A regular pentagon has five equal exterior angles, so each is 360 ÷ 5 = 72°. The interior angle would be 108°, not 72°.",
    },
  ],
};

const HIGHER_ANGLES: StructuredItem = {
  id: "hf-circle-angles",
  conceptId: "circle-theorems",
  title: "Circle theorems",
  intro: "Five short circle-theorem questions. Each answer is a number of degrees.",
  note: "Each part is marked independently. The marker checks the angle; the explanation states the theorem that gives it.",
  difficulty: 0.75,
  parts: [
    {
      id: "a",
      prompt: "An angle is subtended by a diameter at the circumference. Work out its size.",
      marks: 1,
      answer: 90,
      accepted: ["90°"],
      explanation:
        "The angle in a semicircle is a right angle. A diameter cuts the circle into two semicircles, so any angle subtended by it at the circumference is 90°.",
    },
    {
      id: "b",
      prompt: "Opposite angles of a cyclic quadrilateral add to how many degrees?",
      marks: 1,
      answer: 180,
      explanation:
        "A cyclic quadrilateral has all four vertices on a circle. Each pair of opposite angles is supplementary, so the pair adds to 180°.",
    },
    {
      id: "c",
      prompt: "One angle of a cyclic quadrilateral is 74°. Work out the opposite angle.",
      marks: 1,
      answer: 106,
      accepted: ["106°"],
      explanation:
        "Opposite angles in a cyclic quadrilateral add to 180°. The opposite angle is 180 − 74 = 106°. Using 360 here would be the whole quadrilateral rather than the opposite-angle pair.",
    },
    {
      id: "d",
      prompt: "A tangent meets a radius at the point of contact. Work out the angle between them.",
      marks: 1,
      answer: 90,
      accepted: ["90°"],
      explanation:
        "A tangent is perpendicular to the radius at the point of contact, so the angle between them is 90°.",
    },
    {
      id: "e",
      prompt: "An angle at the centre is 128°. Work out the angle at the circumference standing on the same arc.",
      marks: 1,
      answer: 64,
      accepted: ["64°"],
      explanation:
        "The angle at the centre is twice the angle at the circumference when both stand on the same arc. The circumference angle is 128 ÷ 2 = 64°, not 128 × 2.",
    },
  ],
};

const HIGHER_CONTEXT: StructuredItem = {
  id: "hf-rectangle-context",
  conceptId: "quadratics",
  title: "A rectangle with an unknown side",
  intro:
    "A rectangle has length (x + 3) cm and width (x + 2) cm. Its area is 56 cm².",
  note: "Part (a) is marked by algebraic equivalence. Part (b) is a numeric solution, and part (c) carries a method mark only when the working is shown. The positive solution is the one that makes a length.",
  difficulty: 0.8,
  parts: [
    {
      id: "a",
      prompt: "Show that the area, in cm², is x² + 5x + 6.",
      marks: 2,
      answer: 0,
      response: "algebra",
      algebra: { accepted: ["x^2 + 5x + 6"], requireExpanded: true },
      explanation:
        "Area of a rectangle is length × width: (x + 3)(x + 2). Expanding gives x² + 2x + 3x + 6 = x² + 5x + 6. The two middle terms are both positive, which is why the coefficient of x is 5.",
    },
    {
      id: "b",
      prompt: "The area is 56 cm². Solve x² + 5x + 6 = 56 for the positive value of x.",
      marks: 2,
      answer: 5,
      accepted: ["5"],
      explanation:
        "Subtract 56 from both sides: x² + 5x − 50 = 0. This factorises as (x + 10)(x − 5) = 0, so x = −10 or x = 5. A side length cannot be negative, so x = 5. The negative root is a valid solution of the equation but not of the rectangle.",
    },
    {
      id: "c",
      prompt: "Work out the perimeter of the rectangle. Give your answer in cm.",
      marks: 2,
      answer: 30,
      unit: "cm",
      unitRequired: true,
      accepted: ["30 cm"],
      method: {
        id: "c:M1",
        marks: 1,
        prompt: "Show how you found the side lengths and perimeter",
        accept: ["2(8 + 7)", "8 + 7 + 8 + 7", "2 × 15", "2*15", "2(8+7)=30", "8+7+8+7=30"],
        label: "perimeter = 2(length + width)",
      },
      explanation:
        "With x = 5, the length is 8 cm and the width is 7 cm. The perimeter of a rectangle is 2(length + width) = 2(8 + 7) = 30 cm. Adding only one length and one width gives 15, which is half the perimeter.",
    },
  ],
};

const HIGHER_SEQUENCES: StructuredItem = {
  id: "hf-sequences-context",
  conceptId: "sequences",
  title: "A linear sequence",
  intro: "A sequence begins 5, 8, 11, 14, …",
  note: "Part (a) is marked by algebraic equivalence. Parts (b) and (c) are numeric; part (c) carries a method mark only when the working is shown.",
  difficulty: 0.7,
  parts: [
    {
      id: "a",
      prompt: "Write an expression for the nth term of the sequence.",
      marks: 2,
      answer: 0,
      response: "algebra",
      algebra: { variable: "n", accepted: ["3n + 2", "2 + 3n"] },
      explanation:
        "The terms increase by 3 each time, so the expression starts with 3n. The first term is 5, and 3 × 1 = 3, so a constant of 2 is needed: 3n + 2. Checking n = 2 gives 8, which matches the second term.",
    },
    {
      id: "b",
      prompt: "Work out the 20th term.",
      marks: 2,
      answer: 62,
      accepted: ["62"],
      explanation:
        "Substitute n = 20 into 3n + 2: 3 × 20 + 2 = 60 + 2 = 62. Using n = 20 rather than adding 3 twenty times is the point of the nth-term expression.",
    },
    {
      id: "c",
      prompt: "Which term of the sequence is 122? Show your working.",
      marks: 2,
      answer: 40,
      accepted: ["40", "40th term"],
      method: {
        id: "c:M1",
        marks: 1,
        prompt: "Show the equation you solved",
        accept: ["3n + 2 = 122", "3n=120", "3n = 120", "(122 - 2) / 3", "(122 − 2) ÷ 3"],
        label: "solve 3n + 2 = 122",
      },
      explanation:
        "Set the nth term equal to 122: 3n + 2 = 122. Subtract 2 to get 3n = 120, then divide by 3 to get n = 40. So 122 is the 40th term. Reporting 120 as the answer gives the value of 3n, not the position n.",
    },
  ],
};

export const STRUCTURED_ITEMS: StructuredItem[] = [
  LINE_GRAPH, PLOT_LINE, LAWN_FEED,
  FOUNDATION_PROPORTION, HIGHER_SURDS, FOUNDATION_ALGEBRA, HIGHER_ALGEBRA,
  TABLE_LINE, TABLE_QUADRATIC, FOUNDATION_ANGLES, HIGHER_ANGLES,
  HIGHER_CONTEXT, HIGHER_SEQUENCES,
];

/** Total marks, summed from the parts — the one number a paper slot checks. */
export function structuredMarks(item: StructuredItem): number {
  return item.parts.reduce((n, p) => n + p.marks, 0);
}

export function structuredById(id: string): StructuredItem | null {
  return STRUCTURED_ITEMS.find((s) => s.id === id) ?? null;
}

// AUTHORING GUARDS, at module load and therefore at build and in every test: a
// malformed scheme must fail here rather than mark a learner against it.
for (const item of STRUCTURED_ITEMS) {
  if (item.parts.length === 0) throw new Error(`structured item ${item.id}: no parts`);
  if (new Set(item.parts.map((p) => p.id)).size !== item.parts.length) {
    throw new Error(`structured item ${item.id}: duplicate part id`);
  }
  for (const p of item.parts) {
    if (!Number.isInteger(p.marks) || p.marks < 1) {
      throw new Error(`structured item ${item.id}#${p.id}: marks must be a positive integer`);
    }
    if (!p.response || p.response === "number") {
      if (typeof p.answer !== "number" || !Number.isFinite(p.answer)) {
        throw new Error(`structured item ${item.id}#${p.id}: a numeric part has no finite answer`);
      }
    }
    if (p.response === "algebra") {
      if (!p.algebra || p.algebra.accepted.length === 0) {
        throw new Error(`structured item ${item.id}#${p.id}: an algebra part accepts no expression`);
      }
      const variable = p.algebra.variable ?? "x";
      for (const form of p.algebra.accepted) {
        if (!parsePolynomial(form, variable)) {
          throw new Error(`structured item ${item.id}#${p.id}: accepted form "${form}" is outside the polynomial marker`);
        }
      }
    }
    if (p.response === "table") {
      if (!p.table) throw new Error(`structured item ${item.id}#${p.id}: a table part has no table`);
      const blanks = p.table.rows.reduce((n, r) => n + r.cells.filter((c) => c.answer !== undefined).length, 0);
      if (blanks < 1) throw new Error(`structured item ${item.id}#${p.id}: a table part has no blank cell`);
      if (p.marks !== blanks) throw new Error(`structured item ${item.id}#${p.id}: a table part is one mark per blank cell (${blanks} blanks, ${p.marks} marks)`);
      for (const row of p.table.rows) {
        if (row.cells.length !== p.table.columns.length) {
          throw new Error(`structured item ${item.id}#${p.id}: a table row does not match its columns`);
        }
        for (const cell of row.cells) {
          if ((cell.given === undefined) === (cell.answer === undefined)) {
            throw new Error(`structured item ${item.id}#${p.id}: each table cell is either given or answered`);
          }
          if (cell.answer !== undefined && !Number.isFinite(cell.answer)) {
            throw new Error(`structured item ${item.id}#${p.id}: a table answer is not finite`);
          }
        }
      }
    }
    if (p.unitRequired && !p.unit) {
      throw new Error(`structured item ${item.id}#${p.id}: a required unit has no unit`);
    }
    if (p.method && p.response && p.response !== "number") {
      throw new Error(`structured item ${item.id}#${p.id}: a ${p.response} part cannot carry a typed method mark`);
    }
    if (p.method && (!Number.isInteger(p.method.marks) || p.method.marks < 1 || p.method.marks >= p.marks)) {
      throw new Error(`structured item ${item.id}#${p.id}: a method mark must be at least 1 and leave an answer mark`);
    }
    if (p.method && p.method.accept.length === 0) {
      throw new Error(`structured item ${item.id}#${p.id}: a method criterion accepts no working`);
    }
    // A GRAPH PART IS TWO CRITERIA AND NO WORKING BOX. Anything else is an
    // authoring error this check exists to catch, rather than a mark scheme that
    // silently awards nothing.
    if (p.response === "graph") {
      if (!p.graph) throw new Error(`structured item ${item.id}#${p.id}: a graph part has no line`);
      if (p.marks !== 2) throw new Error(`structured item ${item.id}#${p.id}: a graph part is gradient + intercept, so 2 marks`);
      if (p.method) throw new Error(`structured item ${item.id}#${p.id}: a graph part has no typed method`);
      if (p.graph.xMin >= p.graph.xMax || p.graph.yMin >= p.graph.yMax) {
        throw new Error(`structured item ${item.id}#${p.id}: the graph bounds are not a range`);
      }
    }
    if (p.response === "plot") {
      if (!p.plot) throw new Error(`structured item ${item.id}#${p.id}: a plot part has no points`);
      if (p.marks !== 2) throw new Error(`structured item ${item.id}#${p.id}: a plot part is the two-rung B2/B1 scheme, so 2 marks`);
      if (p.method) throw new Error(`structured item ${item.id}#${p.id}: a plot part has no typed method`);
      const g = p.plot;
      if (!(g.xMin < g.xMax && g.yMin < g.yMax)) {
        throw new Error(`structured item ${item.id}#${p.id}: the plot bounds are not a range`);
      }
      if (g.points.length < 2) throw new Error(`structured item ${item.id}#${p.id}: a line needs at least two required points`);
      if (!Number.isInteger(g.partialMin) || g.partialMin < 2 || g.partialMin > g.points.length) {
        throw new Error(`structured item ${item.id}#${p.id}: partialMin must be between 2 and the number of points`);
      }
      if (!(g.tolerance > 0)) throw new Error(`structured item ${item.id}#${p.id}: a plot tolerance must be positive`);
      if (g.points.some((q) => q.x < g.xMin || q.x > g.xMax || q.y < g.yMin || q.y > g.yMax)) {
        throw new Error(`structured item ${item.id}#${p.id}: a required point is outside the grid`);
      }
      if (!Number.isFinite(g.m) || !Number.isFinite(g.c)) {
        throw new Error(`structured item ${item.id}#${p.id}: the intended line is not finite`);
      }
    }
    if (p.response === "readoff") {
      if (!p.readOff) throw new Error(`structured item ${item.id}#${p.id}: a read-off part names no line`);
      if (p.marks !== 1) throw new Error(`structured item ${item.id}#${p.id}: a read-off part is 1 mark`);
      if (!Number.isFinite(p.readOff.at) || !(p.readOff.tolerance > 0)) {
        throw new Error(`structured item ${item.id}#${p.id}: a read-off needs an x and a positive tolerance`);
      }
    }
  }
  for (let i = 0; i < item.parts.length; i++) {
    const p = item.parts[i];
    if (p.response === "readoff" && p.readOff && !item.parts.slice(0, i).some((q) => q.id === p.readOff!.from)) {
      throw new Error(`structured item ${item.id}#${p.id}: read-off names part ${p.readOff.from}, which is not an earlier part`);
    }
  }
}

// ── Marking ─────────────────────────────────────────────────────────────────

/** What a learner typed, in a form two spellings can be compared in: trimmed,
 *  lower case, with the typographic minus and the non-breaking spaces a phone
 *  keyboard produces folded to their ASCII equivalents. */
export function normaliseTyped(raw: string): string {
  return String(raw ?? "")
    .replace(/[\u2212\u2013\u2014]/g, "-")
    .replace(/[\u00a0\u2009\u202f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** TWO POINTS from `x,y x,y`. Numbers are read in order, parentheses and tidy
 *  spaces are ignored, and anything else — a single point, prose, an expression —
 *  is not a line and returns null. */
export function parseGraphPoints(raw: string): Array<{ x: number; y: number }> | null {
  const nums = normaliseTyped(raw).match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 4) return null;
  const v = nums.slice(0, 4).map(Number);
  if (v.some((n) => !Number.isFinite(n))) return null;
  return [{ x: v[0], y: v[1] }, { x: v[2], y: v[3] }];
}

/** A PLOTTED ANSWER is points on this question's grid plus whether they were
 *  joined. JSON rather than prose: a point is two numbers and a mark scheme that
 *  parses them back out of a sentence is guessing. Everything malformed — bad
 *  JSON, a non-finite value, a point off the grid, an oversized payload — is
 *  refused here, before any mark can be computed. */
export function parsePlotAnswer(
  raw: string,
  g: PlotSpec,
): { points: PlotPoint[]; line: PlotLine | null } | null {
  if (!raw || raw.trim() === "") return null;
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!data || typeof data !== "object") return null;
  const obj = data as { points?: unknown; line?: unknown };
  if (!Array.isArray(obj.points) || obj.points.length > 24) return null;
  const inBounds = (p: PlotPoint) => p.x >= g.xMin - 1e-9 && p.x <= g.xMax + 1e-9
    && p.y >= g.yMin - 1e-9 && p.y <= g.yMax + 1e-9;
  const point = (v: unknown): PlotPoint | null => {
    if (!Array.isArray(v) || v.length !== 2) return null;
    const [x, y] = v;
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return null;
    const p = { x, y };
    return inBounds(p) ? p : null;
  };
  const points: PlotPoint[] = [];
  for (const rawPoint of obj.points) {
    const p = point(rawPoint);
    if (!p) return null;
    if (!points.some((q) => q.x === p.x && q.y === p.y)) points.push(p);
  }
  // THE LINE IS EXPLICIT. `null` means no line was drawn; an object names the
  // exact two points whose line the learner sees. A legacy `true` is accepted
  // by deriving the line ONCE from the points and storing that derivation in
  // the parsed answer, so an answer written before this format still marks.
  let line: PlotLine | null = null;
  if (obj.line === true) {
    line = definingLine(points);
  } else if (obj.line !== null) {
    if (typeof obj.line !== "object" || Array.isArray(obj.line)) return null;
    const l = obj.line as { a?: unknown; b?: unknown };
    const a = point(l.a);
    const b = point(l.b);
    if (!a || !b) return null;
    line = lineThrough(a, b);
    if (!line) return null;
  }
  return { points, line };
}

/** WORKING, normalised harder than an answer: case and every space go, and the
 *  multiplication signs a keyboard offers collapse to one, so `7.5 × 4`,
 *  `7.5*4` and `7.5 x 4` are one method rather than three. */
export function normaliseWorking(raw: string): string {
  return normaliseTyped(raw)
    .replace(/[×✕*]/g, "x")
    .replace(/[£$]/g, "")
    .replace(/[,\s]/g, "");
}

/** The spellings of a unit a learner may type. "m²" is one keystroke away from
 *  "m2", and both name the same thing. */
function unitForms(unit: string): string[] {
  const u = normaliseTyped(unit);
  return [...new Set([u, u.replace(/²/g, "2"), u.replace(/²/g, "^2"), u.replace(/³/g, "3")])];
}

function carriesUnit(raw: string, unit: string): boolean {
  const s = normaliseTyped(raw);
  return unitForms(unit).some((f) => s.endsWith(f));
}

function stripUnit(raw: string, unit: string): string {
  let s = normaliseTyped(raw);
  for (const f of unitForms(unit).sort((a, b) => b.length - a.length)) {
    if (s.endsWith(f)) { s = s.slice(0, -f.length).trim(); break; }
  }
  return s;
}

/** A typed answer as a number, with thousands separators tolerated and a leading
 *  currency symbol dropped. Null when it is not a number at all. */
export function parseTypedNumber(raw: string, unit?: string): number | null {
  let s = unit ? stripUnit(raw, unit) : normaliseTyped(raw);
  s = s.replace(/[£$]/g, "").replace(/,/g, "").trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/**
 * Mark one item. Each part is independent, and inside a part each CRITERION is
 * independent: a shown method earns its mark whatever the answer says.
 */
export function gradeStructuredParts(
  partsIn: StructuredPart[],
  given: string[],
  working: string[] = [],
): StructuredGrade {
  // Follow-through needs the line the learner ACTUALLY drew, kept as the parts
  // are marked in order. A read-off part reads from this map, never from the
  // question's coefficients.
  const gradedLines = new Map<string, PlotLine>();
  const parts: StructuredPartMark[] = partsIn.map((p, i) => {
    const raw = typeof given?.[i] === "string" ? given[i] : "";
    const shown = typeof working?.[i] === "string" ? working[i] : "";
    const typed = normaliseTyped(raw);

    // ── PLOTTED POINTS, MARKED ON THE SCHEME'S TWO RUNGS ────────────────
    // 2 marks: every required point plotted AND joined by a straight line.
    // 1 mark: at least `partialMin` required points plotted AND joined — the B1
    // rung, which is about line intention rather than line quality. A correct
    // set of points with no line is 0: the question asks for the graph, and two
    // typed coordinates that were never joined are not the graph it asks for.
    if (p.response === "plot" && p.plot) {
      const g = p.plot;
      const parsed = parsePlotAnswer(raw, g);
      const criterion = (awarded: number, met: boolean, why: string): StructuredCriterionMark => ({
        id: `${p.id}:plot`, kind: "accuracy", label: "required points plotted and joined",
        awarded, marks: p.marks, met, why,
      });
      if (!parsed) {
        return {
          partId: p.id, awarded: 0, marks: p.marks, correct: false, given: raw, working: "",
          criteria: [criterion(0, false, raw.trim()
            ? "The plotted answer could not be read: it must be points on this question's grid."
            : "No points were plotted.")],
        };
      }
      const matched = g.points.filter((r) =>
        parsed.points.some((s) => Math.abs(s.x - r.x) <= g.tolerance && Math.abs(s.y - r.y) <= g.tolerance));
      const required = g.points.length;
      // THE LINE THE LEARNER DREW, not one refitted here. `parsed.line` names the
      // two points whose line the editor renders; the same object is what the
      // read-off part below uses. Extra points cannot move it.
      const line = parsed.line;
      const coef = coefficients(line);
      const lineCorrect = !!coef
        && Math.abs(coef.m - g.m) <= g.lineTolerance.m
        && Math.abs(coef.c - g.c) <= g.lineTolerance.c;
      const all = matched.length === required;
      const some = matched.length >= g.partialMin;
      // THE LINE MUST ACTUALLY JOIN THE POINTS. Four correct dots with a line
      // drawn somewhere else is not "all points joined"; it is B1 intention at
      // best. A line that passes through every required point joins them by
      // definition (and a correctly placed line implies them even if no dots
      // were plotted, AQA's own note).
      const joinsAll = all && line !== null && g.points.every((r) => {
        if (line.a.x === line.b.x) return Math.abs(r.x - line.a.x) <= g.tolerance;
        const y = valueAt(line, r.x);
        return y !== null && Math.abs(y - r.y) <= g.tolerance;
      });
      const awarded = line ? (joinsAll || lineCorrect ? 2 : some ? 1 : 0) : 0;
      // Follow-through exists only once the plot earns a mark: a line with no
      // credited points is not the B1 rung the read-off part depends on.
      if (line && awarded >= 1) gradedLines.set(p.id, line);
      const why = awarded === 2
        ? lineCorrect && !joinsAll
          ? `The line is correctly placed; its position implies the ${required} required points, so the plot earns the full mark.`
          : `All ${required} required points are plotted and joined by a straight line.`
        : awarded === 1
          ? `${matched.length} of the ${required} required points are plotted and joined — at least ${g.partialMin} with a line earns the partial mark.`
          : !line
            ? `${matched.length} of the ${required} required points are plotted, but no straight line joins them.`
            : `Only ${matched.length} of the ${required} required points are plotted, so the line cannot earn the plot mark.`;
      return {
        partId: p.id, awarded, marks: p.marks, correct: awarded === p.marks, given: raw, working: "",
        criteria: [criterion(awarded, awarded === p.marks, why)],
      };
    }

    // ── A VALUE READ FROM THE LEARNER'S OWN LINE ─────────────────────────
    // Follow-through: the earlier part need not be right, only DRAWN. If the
    // learner plotted a shifted line and read their own graph correctly, that is
    // the skill this mark is for. No line from the earlier part, no mark.
    if (p.response === "readoff" && p.readOff) {
      const ro = p.readOff;
      const nums = normaliseTyped(raw).match(/-?\d+(?:\.\d+)?/g);
      const criterion = (met: boolean, why: string): StructuredCriterionMark => ({
        id: `${p.id}:read`, kind: "accuracy", label: "value read from your own line",
        awarded: met ? 1 : 0, marks: p.marks, met, why,
      });
      if (!nums) {
        return {
          partId: p.id, awarded: 0, marks: p.marks, correct: false, given: raw, working: "",
          criteria: [criterion(false, "No value was read from the graph.")],
        };
      }
      const value = Number(nums[0]);
      const line = gradedLines.get(ro.from);
      const expected = valueAt(line, ro.at);
      if (expected === null) {
        return {
          partId: p.id, awarded: 0, marks: p.marks, correct: false, given: raw, working: "",
          criteria: [criterion(false, "There is no line from the earlier part to read from.")],
        };
      }
      const met = Math.abs(value - expected) <= ro.tolerance;
      return {
        partId: p.id, awarded: met ? 1 : 0, marks: p.marks, correct: met, given: raw, working: "",
        criteria: [criterion(met, met
          ? `Read from the line you drew: at x = ${ro.at}, y = ${Number(expected.toFixed(2))}.`
          : `On the line you drew, x = ${ro.at} gives y = ${Number(expected.toFixed(2))}, not ${value}.`)],
      };
    }

    // ── AN ALGEBRAIC EXPRESSION, MARKED BY EQUIVALENCE ────────────────
    // `2(x + 3)` and `2x + 6` are the same answer. The marker compares the
    // polynomial the learner typed with every authored accepted form, so an
    // equivalent route is not marked wrong for spelling. Division, roots and
    // equations are outside this contract and parse to null — a question that
    // needs them must not use an `algebra` part until a marker supports them.
    if (p.response === "algebra" && p.algebra) {
      const variable = p.algebra.variable ?? "x";
      const criterion = (met: boolean, why: string): StructuredCriterionMark => ({
        id: `${p.id}:A1`, kind: "accuracy", label: "mathematically equivalent expression",
        awarded: met ? p.marks : 0, marks: p.marks, met, why,
      });
      if (typed === "") {
        return {
          partId: p.id, awarded: 0, marks: p.marks, correct: false, given: raw, working: "",
          criteria: [criterion(false, "No expression was given.")],
        };
      }
      const parsed = parsePolynomial(raw, variable);
      if (!parsed) {
        return {
          partId: p.id, awarded: 0, marks: p.marks, correct: false, given: raw, working: "",
          criteria: [criterion(false, `This marker checks polynomial expressions in ${variable}. The entry could not be read as one.`)],
        };
      }
      const equivalent = algebraEquivalent(raw, p.algebra.accepted, variable);
      const wrongForm = !!p.algebra.requireExpanded && /[()]/.test(raw);
      const met = equivalent && !wrongForm;
      return {
        partId: p.id, awarded: met ? p.marks : 0, marks: p.marks, correct: met, given: raw, working: "",
        criteria: [criterion(met, wrongForm
          ? `Your expression is equivalent, but the question asks for the expanded form — remove the brackets.`
          : met
            ? `Your expression is equivalent to ${p.algebra.accepted[0]}.`
            : `Your expression expands to ${formatPolynomial(parsed, variable)}, which is not equivalent to the required expression.`)],
      };
    }

    // ── A COMPLETED TABLE, ONE MARK PER BLANK CELL ──────────────────────
    // The value is JSON, one string per editable cell in reading order. Each
    // cell is its own criterion, so a learner who completes three of four values
    // keeps three marks and is told which cell failed. The cells that were
    // printed in the question are not editable and are not marked.
    if (p.response === "table" && p.table) {
      const blanks = p.table.rows.flatMap((row) => row.cells.filter((c) => c.answer !== undefined));
      let values: unknown;
      try { values = JSON.parse(raw); } catch { values = null; }
      const givenCells = Array.isArray(values) ? values : [];
      const criteria: StructuredCriterionMark[] = blanks.map((cell, i) => {
        const entry = typeof givenCells[i] === "string" ? givenCells[i] : "";
        const value = parseNumericInput(entry, cell.unit);
        const accepted = (cell.accepted ?? []).some((a) => normaliseTyped(a) === normaliseTyped(entry));
        const numeric = value !== null && cell.answer !== undefined && gradeNumeric(value, cell.answer, cell.tolerance);
        const met = entry.trim() !== "" && (accepted || numeric);
        return {
          id: `${p.id}:cell${i + 1}`, kind: "accuracy", label: `cell ${i + 1}`,
          awarded: met ? 1 : 0, marks: 1, met,
          why: entry.trim() === "" ? "This cell was left blank."
            : met ? "The value in this cell is correct."
              : cell.answer !== undefined ? `The value in this cell is not correct.` : "This cell is not correct.",
        };
      });
      const awarded = criteria.reduce((n, c) => n + c.awarded, 0);
      return {
        partId: p.id, awarded, marks: p.marks, correct: awarded === p.marks,
        given: raw, working: "", criteria,
      };
    }

    // ── A LINE, MARKED FROM ITS GEOMETRY ─────────────────────────────────
    // Gradient first, then intercept, each its own mark and its own reason. Two
    // learners who choose different points on the same line get the same marks:
    // the endpoints are a way of stating the line, not the answer.
    if (p.response === "graph" && p.graph) {
      const g = p.graph;
      const pts = parseGraphPoints(raw);
      const criterion = (id: string, label: string, met: boolean, why: string): StructuredCriterionMark =>
        ({ id, kind: "accuracy", label, awarded: met ? 1 : 0, marks: 1, met, why });
      const missing = (why: string): StructuredPartMark => ({
        partId: p.id, awarded: 0, marks: p.marks, correct: false, given: raw, working: "",
        criteria: [
          criterion(`${p.id}:gradient`, "correct gradient", false, why),
          criterion(`${p.id}:intercept`, "correct y-intercept", false, why),
        ],
      });
      if (!pts) return missing("No line was given: enter two points, as x,y and x,y.");
      const [a, b] = pts;
      const outside = [a, b].some((q) => q.x < g.xMin || q.x > g.xMax || q.y < g.yMin || q.y > g.yMax);
      if (outside) return missing("One of the points is outside the grid this question shows.");
      if (a.x === b.x) return missing("Both points have the same x, which is a vertical line — it has no gradient of this form.");
      const line = lineThrough(a, b);
      const coef = coefficients(line);
      if (!line || !coef) return missing("Those two points do not define a line.");
      const { m, c } = coef;
      // The line the learner GAVE is what part (d) reads from — even when it is
      // the wrong line. That is follow-through, and it is why the geometry is
      // stored before the marks are known.
      gradedLines.set(p.id, line);
      const gm = Math.abs(m - g.m) <= g.tolerance.m;
      const gc = Math.abs(c - g.c) <= g.tolerance.c;
      const criteria = [
        criterion(`${p.id}:gradient`, "correct gradient", gm,
          gm ? `The gradient is ${g.m}.` : `The gradient of the line through your points is ${Number(m.toFixed(2))}, not ${g.m}.`),
        criterion(`${p.id}:intercept`, "correct y-intercept", gc,
          gc ? `The line crosses the y-axis at ${g.c}.` : `Your line crosses the y-axis at ${Number(c.toFixed(2))}, not ${g.c}.`),
      ];
      const awarded = criteria.reduce((n, x) => n + x.awarded, 0);
      return {
        partId: p.id, awarded, marks: p.marks, correct: awarded === p.marks,
        given: raw, working: "", criteria,
      };
    }

    const methodMarks = p.method?.marks ?? 0;
    const answerMarks = p.marks - methodMarks;

    // ── The method criterion ────────────────────────────────────────────────
    const methodWork = normaliseWorking(shown);
    const methodMet = !!p.method && methodWork !== ""
      && p.method.accept.some((a) => normaliseWorking(a) === methodWork);
    const methodWhy = !p.method ? "" : methodMet
      ? `The working shows ${p.method.label}.`
      : methodWork === ""
        ? "No working was shown, so the method mark could not be awarded."
        : `The working does not match a form of ${p.method.label} this question can check.`;

    // ── The answer criterion ────────────────────────────────────────────────
    const accepted = (p.accepted ?? []).some((a) => normaliseTyped(a) === typed);
    const value = parseTypedNumber(raw, p.unit);
    const numeric = value !== null && typeof p.answer === "number" && gradeNumeric(value, p.answer, p.tolerance);
    // THE UNIT GATE belongs to the ANSWER criterion, and it survives the split
    // from the method criterion: `30` with the unit missing is not `30 m²`, and
    // a scheme that accepts the bare number marks a unit error as correct.
    const unitOk = !p.unitRequired || !p.unit || carriesUnit(raw, p.unit);
    const answerCorrect = typed !== "" && unitOk && (accepted || numeric);
    const answerWhy = typed === ""
      ? "No answer was given."
      : answerCorrect
        ? "The answer is correct."
        : p.unitRequired && p.unit && !carriesUnit(raw, p.unit)
          ? `The answer is missing its unit (${p.unit}).`
          : "The answer is not correct.";

    const criteria: StructuredCriterionMark[] = [];
    if (p.method) {
      criteria.push({
        id: p.method.id, kind: "method", label: p.method.label,
        awarded: methodMet ? p.method.marks : 0, marks: p.method.marks,
        met: methodMet, why: methodWhy,
      });
    }
    criteria.push({
      id: `${p.id}:A1`, kind: "accuracy", label: "correct answer",
      awarded: answerCorrect ? answerMarks : 0, marks: answerMarks,
      met: answerCorrect, why: answerWhy,
    });

    const awarded = Math.min(criteria.reduce((n, c) => n + c.awarded, 0), p.marks);
    return {
      partId: p.id, awarded, marks: p.marks,
      correct: criteria.every((c) => c.met),
      given: raw, working: shown, criteria,
    };
  });

  const awarded = parts.reduce((n, p) => n + p.awarded, 0);
  const marks = parts.reduce((n, p) => n + p.marks, 0);
  return {
    parts: parts.map((p) => ({ ...p, awarded: Math.min(p.awarded, p.marks) })),
    awarded: Math.min(awarded, marks),
    marks,
    answered: parts.filter((p) => p.given !== "" || p.working !== "").length,
  };
}

/** The item-shaped door, for a caller that holds the item itself. The key stores
 *  the parts, so marking a SAVED sitting goes through `gradeStructuredParts` and
 *  never needs the registry. */
export function gradeStructuredItem(item: StructuredItem, given: string[], working: string[] = []): StructuredGrade {
  return gradeStructuredParts(item.parts, given, working);
}
