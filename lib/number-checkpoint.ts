// ── ONE SITTING ACROSS THE NUMBER OBJECTIVES ────────────────────────────────
//
// The five assessment-complete Number objectives each have their own lesson
// assessment. A learner who has studied them one at a time has still not met
// the experience of a single paper: choosing a method without a heading telling
// them which one, carrying marks across parts, and finding out which objective
// the lost marks belong to.
//
// ── WHY THESE ARE NOT THE LESSON ITEMS ─────────────────────────────────────
//
// The first version of this checkpoint composed the lessons' own assessment
// items. That was an assessment-validity defect, not a convenience: every one
// of those items appears on its lesson page with its model answer and marking
// criteria, and a learner can reveal them before sitting the checkpoint. A
// checkpoint built from those items measures whether the learner has read the
// answer, not whether they can do the mathematics.
//
// Every item below is written for THIS paper. None of these prompts or values
// appears in a lesson assessment, and no lesson page can reveal one. The
// objectives and mark weights are the same (9 / 6 / 2 / 5 / 8 across the five
// objectives, 30 marks in 14 questions), so the sitting still covers the same
// requirements at the same demand.
//
// ── AND WHY THE ATTEMPTS ARE NOT LESSON EVIDENCE ──────────────────────────
//
// The checkpoint is marked through its own action in app/api/progress/route.ts,
// not through `lessonCheck`. That door writes an evidence event with
// `source: "assessment"` and `questionId: "checkpoint:<paper>:<item>"`, and it
// deliberately does not increment `progress.<concept>.lessonCheck`. A sitting
// therefore cannot make the lesson look as though its own assessment had been
// attempted, and the two kinds of evidence stay distinguishable in the ledger.
//
// This is a practice checkpoint, not a qualification. It covers the objectives
// whose teaching and assessment are complete (N2-fractions, N2-negatives,
// N4-factors, N4-prime-factor, N10-recurring); it does not claim to cover all
// of AQA 8300 Number, and it must not be described as a predicted grade.
import type { AssessmentItem } from "./lesson-contract";

export const NUMBER_CHECKPOINT_ID = "number-checkpoint-1";

export interface CheckpointPartView {
  id: string;
  prompt: string;
  marks: number;
  /** A display hint from the authored part; never an answer. */
  response?: string;
  unit?: string;
  /** Present when the part has a method mark. The learner's working is sent to
   *  the same marker the lesson uses; it is not graded in the browser. */
  methodPrompt?: string;
  methodMarks?: number;
}

export interface CheckpointItemView {
  number: number;
  objectiveId: string;
  conceptId: string;
  itemId: string;
  prompt: string;
  marks: number;
  /** A single-answer item has no parts and is submitted with `answer`. */
  single: boolean;
  parts: CheckpointPartView[];
}

export interface CheckpointObjectiveView {
  id: string;
  title: string;
  requirement: string;
  conceptId: string;
  lessonHref: string;
  curriculum: string;
  marks: number;
  items: CheckpointItemView[];
}

export interface NumberCheckpointView {
  id: string;
  title: string;
  subject: "maths";
  level: string;
  totalMarks: number;
  itemCount: number;
  suggestedMinutes: number;
  notice: string;
  objectives: CheckpointObjectiveView[];
}

interface ObjectivePlan {
  id: string;
  title: string;
  requirement: string;
  conceptId: string;
  lessonHref: string;
  curriculum: string;
  /** The objective's published mark total. If an authored part changes, the
   *  build fails rather than silently changing the paper's value. */
  marks: number;
}

interface CheckpointItemRecord {
  objectiveId: string;
  conceptId: string;
  item: AssessmentItem;
}

const OBJECTIVES: ObjectivePlan[] = [
  {
    id: "N2-fractions",
    title: "Fraction arithmetic",
    requirement:
      "Add, subtract, multiply and divide fractions and mixed numbers, including a context where the remainder must be interpreted.",
    conceptId: "fraction-ops",
    lessonHref: "/learn/maths/fraction-ops",
    curriculum: "AQA GCSE Mathematics 8300 · N2",
    marks: 9,
  },
  {
    id: "N2-negatives",
    title: "Negative fractions",
    requirement:
      "Order, add, subtract, multiply and divide signed fractions, using a common denominator and the reciprocal correctly.",
    conceptId: "negatives",
    lessonHref: "/learn/maths/negatives",
    curriculum: "AQA GCSE Mathematics 8300 · N2",
    marks: 6,
  },
  {
    id: "N4-prime-factor",
    title: "Prime factorisation",
    requirement:
      "Write a whole number as a product of primes, including index notation.",
    conceptId: "factors-primes",
    lessonHref: "/learn/maths/factors-primes",
    curriculum: "AQA GCSE Mathematics 8300 · N4",
    marks: 2,
  },
  {
    id: "N4-factors",
    title: "Factors, multiples, HCF and LCM",
    requirement:
      "Find common factors and multiples, and use prime factorisations to find an HCF and an LCM.",
    conceptId: "factors-primes",
    lessonHref: "/learn/maths/factors-primes",
    curriculum: "AQA GCSE Mathematics 8300 · N4",
    marks: 5,
  },
  {
    id: "N10-recurring",
    title: "Recurring decimals",
    requirement:
      "Convert between recurring decimals and fractions in both directions, and explain the denominator test.",
    conceptId: "decimals",
    lessonHref: "/learn/maths/decimals",
    curriculum: "AQA GCSE Mathematics 8300 · N10",
    marks: 8,
  },
];

// ── THE PAPER ───────────────────────────────────────────────────────────────
//
// The order is deliberate: the paper opens with the two fraction objectives,
// then factors, then recurring decimals. Item ids are prefixed `c` so a
// checkpoint item can never be mistaken for a lesson item (`a1`, `a2`, …) in a
// ledger, a report or a bug report.
const ITEMS: CheckpointItemRecord[] = [
  // ── N2-fractions (9 marks) ────────────────────────────────────────────────
  {
    objectiveId: "N2-fractions",
    conceptId: "fraction-ops",
    item: {
      id: "c1",
      kind: "short-answer",
      prompt: "Work out 3/4 + 1/6. Give your answer as a fraction in its simplest form.",
      modelAnswer: "11/12",
      marking: [
        "Rewrites both fractions to twelfths: 3/4 = 9/12 and 1/6 = 2/12, rather than adding the numerators and denominators.",
        "Adds the counts of twelfths to give 11/12, which is larger than 3/4 and smaller than 1, as a sum of two positive fractions must be.",
      ],
      check: { accepted: ["11/12", "11 / 12"] },
    },
  },
  {
    objectiveId: "N2-fractions",
    conceptId: "fraction-ops",
    item: {
      id: "c2",
      kind: "short-answer",
      prompt:
        "Work out 3 2/5 − 1 3/4. Give your answer as a mixed number in its simplest form.",
      modelAnswer: "1 13/20",
      marking: [
        "Converts both mixed numbers to improper fractions: 17/5 and 7/4.",
        "Uses a common denominator of 20, giving 68/20 − 35/20 = 33/20.",
        "Converts 33/20 back to 1 13/20.",
      ],
      check: { accepted: ["1 13/20", "33/20", "1.65"] },
    },
  },
  {
    objectiveId: "N2-fractions",
    conceptId: "fraction-ops",
    item: {
      id: "c3",
      kind: "structured",
      prompt:
        "A recipe uses 2 1/2 kg of apples. Each tart needs 3/8 kg of apples. Work out how many full tarts can be made and how much apple is left over.",
      modelAnswer:
        "2 1/2 = 5/2. Dividing by 3/8 is the same as multiplying by 8/3: 5/2 × 8/3 = 40/6 = 20/3 = 6 2/3. So 6 full tarts can be made. Six tarts use 6 × 3/8 = 18/8 = 9/4 = 2 1/4 kg. The apple left is 5/2 − 9/4 = 10/4 − 9/4 = 1/4 kg. The 2/3 in 6 2/3 is two thirds of a tart, not two thirds of a kilogram.",
      marking: [
        "Part (a): writes 2 1/2 as the improper fraction 5/2 (1 mark).",
        "Part (b): replaces division by 3/8 with multiplication by its reciprocal 8/3, or uses an equivalent common-denominator division (M1).",
        "Part (b): gives 20/3 or 6 2/3 (A1).",
        "Part (c): interprets the quotient as 6 full tarts (1 mark).",
        "Part (d): finds the apple left over as 1/4 kg, distinguishing it from the fractional part of a tart (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Write 2 1/2 as an improper fraction.",
            marks: 1,
            answer: 2.5,
            accepted: ["5/2", "2.5"],
            explanation:
              "Two whole ones are four halves, because each whole contains two halves. Add the extra half: four halves plus one half is five halves, so 2 1/2 = 5/2. The denominator stays two because the pieces are still halves.",
          },
          {
            id: "b",
            prompt:
              "Work out 2 1/2 ÷ 3/8. Show your working and give the answer as a mixed number.",
            marks: 2,
            answer: 20 / 3,
            tolerance: { abs: 0.0001 },
            accepted: ["20/3", "6 2/3", "6.6667"],
            method: {
              id: "b:M1",
              marks: 1,
              prompt:
                "Show the division changed into a multiplication by the reciprocal, or an equivalent common-denominator division.",
              accept: [
                "5/2 × 8/3",
                "5/2 * 8/3",
                "20/8 ÷ 3/8",
                "20/8 / 3/8",
                "20 ÷ 3",
              ],
              label:
                "a correct division by 3/8 (multiplying by 8/3 or using eighths throughout)",
            },
            explanation:
              "5/2 ÷ 3/8 asks how many eighths-of-a-kilogram portions fit into five halves. Fifths and eighths are different part sizes, so write both in eighths: 5/2 = 20/8, and 20/8 ÷ 3/8 is 20 ÷ 3 = 6 2/3. The reciprocal route gives the same count: 5/2 × 8/3 = 40/6 = 20/3. The answer is larger than 5/2 because the divisor is less than one, which is the check that the operation was read as a division.",
          },
          {
            id: "c",
            prompt: "How many FULL tarts can be made?",
            marks: 1,
            answer: 6,
            accepted: ["6", "6 tarts", "six"],
            explanation:
              "The division gives 6 2/3 tarts. Six full tarts use 6 × 3/8 = 18/8 = 2 1/4 kg, leaving 1/4 kg, and 1/4 kg is less than the 3/8 kg one more tart would need. So the number of full tarts is 6. The 2/3 is a fraction of a tart, not a number of kilograms.",
          },
          {
            id: "d",
            prompt: "How much apple is left over? Give your answer in kilograms.",
            marks: 1,
            answer: 1 / 4,
            tolerance: { abs: 0.0001 },
            accepted: ["1/4", "1/4 kg", "0.25", "0.25 kg"],
            unit: "kg",
            explanation:
              "Six tarts use 6 × 3/8 = 18/8 = 9/4 kg. Subtract that from the 5/2 kg the recipe starts with: 5/2 − 9/4 = 10/4 − 9/4 = 1/4 kg. The leftover is one quarter of a kilogram, which agrees with the fraction of a tart left in the quotient: 2/3 of a tart × 3/8 kg per tart = 1/4 kg.",
          },
        ],
      },
    },
  },
  {
    objectiveId: "N2-fractions",
    conceptId: "fraction-ops",
    item: {
      id: "c4",
      kind: "structured",
      prompt:
        "Work out 1 3/4 × 2/5. Show your working and give your answer as a fraction in its simplest form.",
      modelAnswer:
        "1 3/4 = 7/4. Multiplying the numerators and the denominators gives 7/4 × 2/5 = 14/20 = 7/10. The answer is smaller than 1 3/4 because it is multiplied by a number below one, and larger than 2/5 because 1 3/4 is greater than one.",
      marking: [
        "Part (a): converts 1 3/4 to the improper fraction 7/4 (1 mark).",
        "Part (b): multiplies the numerators and the denominators, then simplifies 14/20 to 7/10 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Write 1 3/4 as an improper fraction.",
            marks: 1,
            answer: 1.75,
            accepted: ["7/4", "1.75"],
            explanation:
              "One whole is four quarters, so one whole plus three quarters is four quarters plus three quarters, which is seven quarters. The denominator stays four because the pieces are still quarters, so 1 3/4 = 7/4.",
          },
          {
            id: "b",
            prompt:
              "Work out 1 3/4 × 2/5. Give your answer as a fraction in its simplest form.",
            marks: 1,
            answer: 0.7,
            accepted: ["7/10", "0.7"],
            explanation:
              "Using the improper fraction, 7/4 × 2/5 = 14/20. Both 14 and 20 divide by two, so 14/20 = 7/10. The answer is smaller than 1 3/4 because 2/5 is less than one, and it is larger than 2/5 because 1 3/4 is greater than one, so the size is plausible.",
          },
        ],
      },
    },
  },

  // ── N2-negatives (6 marks) ────────────────────────────────────────────────
  {
    objectiveId: "N2-negatives",
    conceptId: "negatives",
    item: {
      id: "c5",
      kind: "structured",
      prompt: "Work out −3/5 + 1/2. Show the common denominator.",
      modelAnswer: "−3/5 = −6/10 and 1/2 = 5/10, so −3/5 + 1/2 = −6/10 + 5/10 = −1/10.",
      marking: [
        "Part (a): writes −3/5 as −6/10 when the denominator is 10 (1 mark).",
        "Part (b): adds the signed numerators to get −1 (1 mark).",
        "Part (b): writes the answer as −1/10 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "What is the numerator when −3/5 is written with denominator 10?",
            marks: 1,
            answer: -6,
            explanation:
              "Multiplying both the numerator and the denominator of −3/5 by 2 gives −6/10. The negative sign belongs to the whole fraction, so the numerator is −6 and the denominator is 10.",
          },
          {
            id: "b",
            prompt: "Hence work out −3/5 + 1/2. Give your answer as a fraction.",
            marks: 2,
            response: "short",
            short: [
              {
                id: "b1",
                marks: 2,
                label: "−1/10",
                accept: ["-1/10", "−1/10"],
              },
            ],
            explanation:
              "−3/5 is −6/10 and 1/2 is 5/10, so the sum is −6/10 + 5/10 = −1/10. The negative term is larger in size, so the result is still negative. The answer lies between −3/5 and 1/2, which is where a sum of those two values must sit.",
          },
        ],
      },
    },
  },
  {
    objectiveId: "N2-negatives",
    conceptId: "negatives",
    item: {
      id: "c6",
      kind: "structured",
      prompt: "Work out −5/6 ÷ 3/4. Give your answer as a fraction or a mixed number.",
      modelAnswer: "−5/6 ÷ 3/4 = −5/6 × 4/3 = −20/18 = −10/9 = −1 1/9.",
      marking: [
        "Part (a): identifies the reciprocal of 3/4 as 4/3 (1 mark).",
        "Part (b): multiplies 5/6 by 4/3 to get 20/18 (1 mark).",
        "Part (b): simplifies to 10/9 and applies the negative sign, giving −10/9 or −1 1/9 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "What is the reciprocal of 3/4?",
            marks: 1,
            response: "short",
            short: [
              {
                id: "a1",
                marks: 1,
                label: "4/3",
                accept: ["4/3", "4 / 3"],
              },
            ],
            explanation:
              "The reciprocal of a fraction swaps its numerator and denominator. Dividing by 3/4 asks how many three-quarters fit, which is the same as multiplying by 4/3, so the reciprocal is 4/3.",
          },
          {
            id: "b",
            prompt: "Hence work out −5/6 ÷ 3/4.",
            marks: 2,
            response: "short",
            short: [
              {
                id: "b1",
                marks: 2,
                label: "−10/9",
                accept: ["-10/9", "−10/9", "-1 1/9", "−1 1/9"],
              },
            ],
            explanation:
              "One negative value makes the quotient negative. The sizes multiply: 5/6 × 4/3 = 20/18, and both divide by two to give 10/9. Applying the sign gives −10/9, which is −1 1/9. The size is larger than 5/6 because division by a number below one increases the count.",
          },
        ],
      },
    },
  },

  // ── N4-prime-factor (2 marks) ─────────────────────────────────────────────
  {
    objectiveId: "N4-prime-factor",
    conceptId: "factors-primes",
    item: {
      id: "c7",
      kind: "short-answer",
      prompt: "Write 84 as a product of its prime factors. Do not use index notation.",
      modelAnswer: "2 × 2 × 3 × 7",
      marking: [
        "Divides by the smallest primes: 84 = 2 × 42 = 2 × 2 × 21 = 2 × 2 × 3 × 7.",
        "Every factor in the product is prime, and the product is 84.",
      ],
      check: {
        accepted: [
          "2 × 2 × 3 × 7",
          "2 x 2 x 3 x 7",
          "2x2x3x7",
          "2*2*3*7",
          "2, 2, 3, 7",
        ],
      },
    },
  },
  {
    objectiveId: "N4-prime-factor",
    conceptId: "factors-primes",
    item: {
      id: "c8",
      kind: "short-answer",
      prompt: "Write 180 as a product of its prime factors in index form.",
      modelAnswer: "2² × 3² × 5",
      marking: [
        "Splits 180 into primes: 180 = 2 × 90 = 2 × 2 × 45 = 2 × 2 × 3 × 3 × 5.",
        "Groups the repeated primes with indices to give 2² × 3² × 5, which still equals 180.",
      ],
      check: {
        accepted: [
          "2^2 × 3^2 × 5",
          "2^2*3^2*5",
          "2^2 x 3^2 x 5",
          "2^2x3^2x5",
          "2² × 3² × 5",
          "2²*3²*5",
          "2²x3²x5",
        ],
      },
    },
  },

  // ── N4-factors (5 marks) ──────────────────────────────────────────────────
  {
    objectiveId: "N4-factors",
    conceptId: "factors-primes",
    item: {
      id: "c9",
      kind: "short-answer",
      prompt: "Work out the highest common factor (HCF) of 42 and 56.",
      modelAnswer: "14",
      marking: [
        "Writes 42 = 2 × 3 × 7 and 56 = 2 × 2 × 2 × 7.",
        "Takes the shared primes at the lower power: 2 × 7 = 14, and checks that 14 divides both numbers.",
      ],
      check: { accepted: ["14"] },
    },
  },
  {
    objectiveId: "N4-factors",
    conceptId: "factors-primes",
    item: {
      id: "c10",
      kind: "structured",
      prompt: "Use prime factorisations to find the HCF and LCM of 30 and 45.",
      modelAnswer:
        "30 = 2 × 3 × 5 and 45 = 3² × 5, so HCF = 3 × 5 = 15 and LCM = 2 × 3² × 5 = 90.",
      marking: [
        "Part (a): writes both numbers as prime products and takes the shared primes at the lower power to get 15 (1 mark).",
        "Part (b): takes every prime at the highest power to get 90 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "What is the HCF of 30 and 45?",
            marks: 1,
            answer: 15,
            explanation:
              "30 = 2 × 3 × 5 and 45 = 3 × 3 × 5. The primes shared by both are 3 and 5, taken at the lower power: 3 × 5 = 15. Fifteen divides 30 and 45, and no larger number does.",
          },
          {
            id: "b",
            prompt: "What is the LCM of 30 and 45?",
            marks: 1,
            answer: 90,
            explanation:
              "Take every prime that appears in either factorisation at its highest power: 2 × 3² × 5 = 90. Ninety is divisible by both 30 and 45, and it is the first number that is.",
          },
        ],
      },
    },
  },
  {
    objectiveId: "N4-factors",
    conceptId: "factors-primes",
    item: {
      id: "c11",
      kind: "structured",
      prompt:
        "A gardener has 36 tulip bulbs and 48 daffodil bulbs. They are planted in identical rows. Each row contains only one type of bulb, every row has the same number of bulbs, and no bulbs are left over. Work out the greatest number of bulbs in each row and the total number of rows.",
      modelAnswer:
        "HCF(36, 48) = 12, so each row has at most 12 bulbs. 36 ÷ 12 = 3 rows of tulips and 48 ÷ 12 = 4 rows of daffodils, giving 7 rows in total. Twelve is the greatest common factor, so no larger row size divides both counts.",
      marking: [
        "Part (a): identifies the row size as the HCF of 36 and 48 and gives 12 (1 mark).",
        "Part (b): divides both counts by 12 and adds to get 7 rows (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "What is the greatest number of bulbs in each row?",
            marks: 1,
            answer: 12,
            explanation:
              "36 = 2² × 3² and 48 = 2⁴ × 3. The highest common factor is 2² × 3 = 12, so 12 bulbs per row divides both counts exactly. A larger number would leave a remainder from at least one type of bulb.",
          },
          {
            id: "b",
            prompt: "How many rows are there altogether?",
            marks: 1,
            answer: 7,
            explanation:
              "36 ÷ 12 = 3 rows of tulips, and 48 ÷ 12 = 4 rows of daffodils. The total is 3 + 4 = 7 rows. Each row has the same number of bulbs, and every bulb is in a row.",
          },
        ],
      },
    },
  },

  // ── N10-recurring (8 marks) ───────────────────────────────────────────────
  {
    objectiveId: "N10-recurring",
    conceptId: "decimals",
    item: {
      id: "c12",
      kind: "structured",
      prompt:
        "Write 0.454545... as a fraction in its simplest form. Show the subtraction that removes the repeating part.",
      modelAnswer:
        "Let x = 0.454545... . Then 100x = 45.454545..., because multiplying by 100 moves the point past one whole block of two digits. Subtracting x from 100x gives 99x = 45, so x = 45/99 = 5/11.",
      marking: [
        "Part (a): multiplies by 100, because the repeating block has two digits (1 mark).",
        "Part (b): obtains 99x = 45 (1 mark).",
        "Part (c): writes 45/99 and simplifies to 5/11 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt:
              "Let x = 0.454545... . By what number should x be multiplied so that one whole block of repeating digits moves past the decimal point?",
            marks: 1,
            answer: 100,
            explanation:
              "The repeating block is two digits, 45. Multiplying by 100 moves the decimal point two places, so 100x = 45.454545... . Multiplying by 10 would move only one digit and would not align the repeating blocks for subtraction.",
          },
          {
            id: "b",
            prompt: "What is 100x − x?",
            marks: 1,
            answer: 45,
            explanation:
              "100x = 45.454545... and x = 0.454545... . The repeating tails are identical, so subtracting cancels them and leaves 45 exactly. The left-hand side is 99x, so 99x = 45.",
          },
          {
            id: "c",
            prompt: "Hence write x as a fraction in its simplest form.",
            marks: 1,
            response: "short",
            short: [
              {
                id: "c1",
                marks: 1,
                label: "5/11",
                accept: ["5/11", "5 / 11"],
              },
            ],
            explanation:
              "The subtraction gives 99x = 45, so x = 45/99. Both numbers divide by 9, giving 5/11. The answer is less than 1 and close to 0.45, which matches the original decimal.",
          },
        ],
      },
    },
  },
  {
    objectiveId: "N10-recurring",
    conceptId: "decimals",
    item: {
      id: "c13",
      kind: "structured",
      prompt: "Write 7/12 as a decimal. Use dots or an ellipsis to show the repeating part.",
      modelAnswer: "0.58333..., where the 3 repeats. With dot notation, the dot sits over the 3.",
      marking: [
        "Part (a): writes 0.58333... and shows the 3 repeating (1 mark).",
        "Part (b): identifies 3 as the repeating digit (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Write 7/12 as a decimal, continuing until a digit repeats.",
            marks: 1,
            response: "short",
            short: [
              {
                id: "a1",
                marks: 1,
                label: "0.58333... with the 3 repeating",
                accept: ["0.58333", "0.5833", "0.583 recurring"],
              },
            ],
            explanation:
              "Dividing 7 by 12 gives 0.5 with remainder 10, then 0.58 with remainder 4, then 0.583 with remainder 4 again. The remainder 4 repeats, so every following digit is 3: 0.58333... .",
          },
          {
            id: "b",
            prompt: "Which digit repeats?",
            marks: 1,
            answer: 3,
            explanation:
              "After the digits 5 and 8, the remainder 4 keeps returning, so every following digit is 3. The repeating part is the single digit 3.",
          },
        ],
      },
    },
  },
  {
    objectiveId: "N10-recurring",
    conceptId: "decimals",
    item: {
      id: "c14",
      kind: "structured",
      prompt:
        "Write 0.3888... as a fraction in its simplest form. Show the two multiplications you subtract.",
      modelAnswer:
        "Let x = 0.3888... . Then 100x = 38.888... and 10x = 3.888... . Subtracting gives 90x = 35, so x = 35/90 = 7/18.",
      marking: [
        "Part (a): works out 100x − 10x = 35 (1 mark).",
        "Part (b): writes 35/90 (1 mark).",
        "Part (b): simplifies 35/90 to 7/18 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Let x = 0.3888... . What is 100x − 10x?",
            marks: 1,
            answer: 35,
            explanation:
              "100x = 38.888... and 10x = 3.888... . The repeating 8 tail is the same in both numbers, so subtracting cancels it and leaves 35 exactly. The left-hand side is 90x, so 90x = 35.",
          },
          {
            id: "b",
            prompt: "Hence write x as a fraction in its simplest form.",
            marks: 2,
            response: "short",
            short: [
              {
                id: "b1",
                marks: 1,
                label: "35/90, before simplifying",
                accept: ["35/90", "35 / 90", "7/18", "7 / 18"],
              },
              {
                id: "b2",
                marks: 1,
                label: "7/18, fully simplified",
                accept: ["7/18", "7 / 18"],
              },
            ],
            explanation:
              "The subtraction gives 90x = 35, so x = 35/90. Both numbers divide by 5, giving 7/18. The answer is less than 1 and close to 0.39, which matches the original decimal, and 7/18 has no common factor left.",
          },
        ],
      },
    },
  },
];

function itemRecord(itemId: string): CheckpointItemRecord | null {
  return ITEMS.find((record) => record.item.id === itemId) ?? null;
}

/** The marks a learner can earn on an item. A single-answer item is one mark;
 *  a structured item's parts are the authoritative total. */
export function checkpointItemMarks(item: AssessmentItem): number {
  if (item.structured) return item.structured.parts.reduce((sum, part) => sum + part.marks, 0);
  return 1;
}

function partView(part: NonNullable<AssessmentItem["structured"]>["parts"][number]): CheckpointPartView {
  return {
    id: part.id,
    prompt: part.prompt,
    marks: part.marks,
    ...(part.response ? { response: part.response } : {}),
    ...(part.unit ? { unit: part.unit } : {}),
    ...(part.method
      ? { methodPrompt: part.method.prompt, methodMarks: part.method.marks }
      : {}),
  };
}

function viewItem(record: CheckpointItemRecord, number: number): CheckpointItemView {
  const { item } = record;
  return {
    number,
    objectiveId: record.objectiveId,
    conceptId: record.conceptId,
    itemId: item.id,
    prompt: item.prompt,
    marks: checkpointItemMarks(item),
    single: !item.structured,
    parts: item.structured ? item.structured.parts.map(partView) : [],
  };
}

export function numberCheckpointView(): NumberCheckpointView {
  let number = 0;
  const objectives = OBJECTIVES.map((objective) => {
    const records = ITEMS.filter((record) => record.objectiveId === objective.id);
    if (records.length === 0) throw new Error(`Number checkpoint objective has no items: ${objective.id}`);
    const items = records.map((record) => viewItem(record, ++number));
    const marks = items.reduce((sum, item) => sum + item.marks, 0);
    if (marks !== objective.marks) {
      throw new Error(
        `Number checkpoint mark total changed for ${objective.id}: ` +
          `published ${objective.marks}, authored ${marks}. Update the checkpoint deliberately.`,
      );
    }
    return {
      id: objective.id,
      title: objective.title,
      requirement: objective.requirement,
      conceptId: objective.conceptId,
      lessonHref: objective.lessonHref,
      curriculum: objective.curriculum,
      marks,
      items,
    };
  });

  const totalMarks = objectives.reduce((sum, objective) => sum + objective.marks, 0);
  return {
    id: NUMBER_CHECKPOINT_ID,
    title: "Number checkpoint 1",
    subject: "maths",
    level: "AQA GCSE Mathematics 8300 · Foundation and Higher Number",
    totalMarks,
    itemCount: number,
    suggestedMinutes: 40,
    notice:
      "Practice checkpoint, not a qualification. These questions are written for this paper and do not appear in the lessons, so a model answer cannot be looked up before the sitting. It covers the five Number objectives whose teaching and assessment are complete, does not cover every AQA 8300 Number objective, and cannot predict a grade.",
    objectives,
  };
}

/** The server's view of one checkpoint item: the full authored record, including
 *  the key. NEVER send this to the browser — `numberCheckpointView()` is the
 *  public boundary. */
export function numberCheckpointItemFor(
  checkpointId: string,
  itemId: string,
): { objectiveId: string; conceptId: string; item: AssessmentItem } | null {
  if (checkpointId !== NUMBER_CHECKPOINT_ID) return null;
  const record = itemRecord(itemId);
  if (!record) return null;
  return { objectiveId: record.objectiveId, conceptId: record.conceptId, item: record.item };
}
