import type { AuthoredLesson } from "../../lesson-contract";

// Batch 8 — percentages, the thinnest served explanation in the bank.
//
// The concept is where two earlier ideas meet: a fraction's denominator names a
// size of part (`fractions`), and a decimal is that same value written in base ten
// (`decimals`). A percent is simply the case where the size of the part is fixed
// at one hundred, which is why percentages compare amounts taken from different
// wholes fairly — and why a learner who forgets the fixed part size cannot see why
// 15% of 40 is smaller than 15% of 80.
//
// The lesson then builds change on one idea that is cheap to teach and expensive to
// miss: a percentage change is a MULTIPLIER, so a reverse percentage divides by
// that multiplier rather than adding a percentage of the answer, and two changes
// multiply (1.2 × 0.8 = 0.96) which is why +20% then −20% does not return to the
// start.
export const MATHS_PERCENTAGES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "percentages",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: percentages, percentage change and reverse percentages",
    level: "Key Stage 2 to Key Stage 4",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Convert between fractions, decimals and percentages, explaining a percent as a part size of one hundred rather than as a separate kind of number.",
      evidence:
        "The learner explains that 85% and 0.85 and 85/100 are the same value written three ways, and says the denominator is fixed at 100 so two amounts can be compared.",
    },
    {
      statement: "Find a percentage of an amount, using either ten-per-cent chunks or a single multiplier.",
      evidence:
        "The learner works out 15% of 40 as 6, either by adding 10% and 5% of 40 or by multiplying 40 by 0.15, and can check the answer against a rough ten per cent.",
    },
    {
      statement:
        "Use a multiplier to apply and reverse a percentage change, and explain why an increase and an equal decrease do not cancel.",
      evidence:
        "The learner finds the original price from £48 after 20% off as £60 by dividing by 0.8, and says that a 20% rise then a 20% fall multiplies by 1.2 and 0.8 to give 0.96 of the start.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["fractions", "decimals"],
    check: [
      {
        id: "pc1",
        question: "What does the 4 in three quarters tell you?",
        answer: "That the whole is cut into four equal parts and each part is a quarter.",
        targets: ["fractions"],
      },
      {
        id: "pc2",
        question: "Write 0.25 as a fraction in its simplest form.",
        answer: "One quarter, because 25 hundredths simplifies to a quarter.",
        targets: ["decimals"],
      },
    ],
  },

  introduction: {
    hook:
      "Two shops advertise 15% off. One is discounting a £40 item, the other a £400 item. The percentage is identical and the saving is not, because a percentage is not an amount: it is a share whose size is fixed at one hundredth of whatever whole you are talking about.",
    why:
      "That fixed part size is what makes percentages useful in the first place. Half of a small class and half of a large one are different numbers of pupils and the same share, so a comparison of shares needs a common measuring unit. A percent is that unit: one hundredth. Once it is read as a share rather than a number in its own right, converting, finding a percentage and applying a change are all the same skill with different multipliers.",
  },

  explanation: [
    {
      heading: "A percent is a part size fixed at one hundred",
      paragraphs: [
        "Percent means per hundred, so a percentage is a fraction whose denominator has already been chosen. Fifteen per cent is fifteen hundredths, which is why 15%, 0.15 and 15/100 are three ways of writing one value rather than three numbers. The fixed denominator is the whole point: because every percentage counts hundredths, two shares taken from different wholes can be compared directly, which is what a league table, a discount and a test score all need.",
        "Reading a percentage as a share also explains the questions that look strange. Twelve and a half per cent is possible and equals one eighth, because hundredths can be grouped. A percentage above one hundred means more than the whole, which is normal for a price rise and impossible for a proportion of a class. A percentage below one is a very small share, not a very small number: 0.5% of 400 is 2, while 50% of 400 is 200.",
      ],
    },
    {
      heading: "Finding a percentage is multiplying by a share",
      paragraphs: [
        "Fifteen per cent of forty means fifteen hundredths of forty, so the calculation is forty multiplied by 0.15, which is 6. The same answer comes from splitting the percentage into parts that are easy to find: ten per cent of forty is 4, five per cent is half of that, 2, and 4 + 2 = 6. Both routes are worth having, because the splitting method needs no calculator and the multiplier method extends to 17% or 3.5% without changing approach.",
        "The multiplication reading also gives a free check on the size of an answer. Ten per cent is a tenth, so a percentage of an amount must be roughly a tenth of it per ten per cent: 15% of 40 must be near 4, and 6 passes while 60 would not. Percentages of different wholes are not comparable without that step — 15% of a large amount can dwarf 40% of a small one, and only the multiplier tells you which.",
      ],
    },
    {
      heading: "Change is a multiplier, so reversing it divides",
      paragraphs: [
        "An increase of twenty per cent multiplies by 1.2, because the original is kept and a fifth of it is added; a decrease of twenty per cent multiplies by 0.8. Writing change as a multiplier makes combined changes mechanical: two changes multiply, so a 20% rise followed by a 20% fall multiplies by 1.2 and then 0.8, giving 0.96 — ninety-six per cent of the start, not one hundred. Forty pounds becomes £48 and then £38.40.",
        "The same idea answers reverse questions, which is where percentages are most often got wrong. If a coat costs £48 after twenty per cent off, then £48 is eighty per cent of the original, so the original is 48 divided by 0.8, which is £60. Adding twenty per cent of £48 gives £57.60, a price that would discount to £46.08 rather than £48. Dividing by the multiplier is the only route that returns the number the discount started from.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.area-model",
      body:
        "A hundred-square grid with fifteen squares shaded. The grid is the whole, each square is one per cent, and the shaded region is the share.",
      notation: "15% of 40 = 6",
      caption:
        "Fifteen squares out of a hundred is fifteen hundredths; applied to forty, each square is worth 0.4 of the amount, and fifteen of them make 6.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body: "Splitting a percentage into parts that are easy to find without a calculator.",
      notation: "15% of 40 = 10% + 5% = 4 + 2 = 6",
      caption:
        "Ten per cent is a tenth of the amount and five per cent is half of that, so the split route and the 0.15 multiplier agree.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body: "A rise and an equal fall are two multipliers, and multiplying them shows why they do not cancel.",
      notation: "40 × 1.2 × 0.8 = 38.40",
      caption:
        "The multipliers are applied to different amounts — the second to the raised price — so together they give 0.96 of the start rather than 1.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 15% of 40.",
      steps: [
        {
          move: "Read the percentage as a share: 15% is 15 hundredths, or 0.15.",
          why:
            "A percentage is a fraction with the denominator fixed at one hundred, so it converts to a decimal by dividing by one hundred.",
        },
        {
          move: "Multiply the amount by that share: 40 × 0.15 = 6.",
          why:
            "Finding a percentage of an amount is finding that share of it, which is multiplication rather than a separate operation.",
        },
        {
          move: "Check by the split route: 10% of 40 is 4 and 5% is 2, so 4 + 2 = 6, and the answer is 6.",
          why:
            "Two independent routes agreeing, and a result near a tenth per ten per cent, is what makes the answer trustworthy.",
        },
      ],
      answer: "6",
    },
    {
      id: "w2",
      prompt: "A coat costs £48 after a 20% discount. Work out its price before the discount.",
      steps: [
        {
          move: "Name what £48 represents: after taking 20% off, it is 80% of the original price.",
          why:
            "A discount of twenty per cent leaves eighty per cent, so the price on the label is a share of the original rather than the original itself.",
        },
        {
          move: "Write the relationship as a multiplier: original × 0.8 = 48.",
          why:
            "A percentage decrease is a single multiplication, which is what makes the relationship reversible by division.",
        },
        {
          move: "Divide to reverse it: 48 ÷ 0.8 = 60, and check that 60 × 0.8 = 48.",
          why:
            "Dividing by the multiplier returns the amount the discount started from, and the check confirms the £60 price.",
        },
      ],
      answer: "£60",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "To find the price before a 20% discount, add 20% of the discounted price: £48 becomes £57.60.",
      whyItFails:
        "Twenty per cent of the discounted price is twenty per cent of a smaller amount, so adding it cannot restore the original. The discount was taken from the original, and £48 is eighty per cent of that original; adding a fifth of £48 gives a price that would itself discount to £46.08, not £48. The percentage has been applied to the wrong whole.",
      correction:
        "Decide which amount is the whole before choosing the operation. Going forward multiplies by the multiplier; going back divides by the same multiplier, so £48 divided by 0.8 gives £60.",
      contrast: {
        wrong: "48 + 20% of 48 = £57.60",
        right: "48 ÷ 0.8 = £60, because £48 is 80% of the original",
      },
    },
    {
      id: "m2",
      belief: "A 20% rise followed by a 20% fall returns a price to where it started.",
      whyItFails:
        "The two percentages are taken from different amounts. The rise is twenty per cent of the original, while the fall is twenty per cent of the raised price, which is larger — so the fall removes more than the rise added. Written as multipliers, 1.2 × 0.8 = 0.96, which leaves ninety-six per cent of the start: £40 becomes £48 and then £38.40.",
      correction:
        "Multiply the multipliers rather than adding or subtracting the percentages. Only a pair whose product is 1 returns the start, and 1.2 × 0.8 is 0.96.",
      contrast: {
        wrong: "40 → +20% → 48 → −20% → 40",
        right: "40 × 1.2 × 0.8 = 38.40, because the fall is taken from £48",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Work out 30% of 80.",
      hint: "Thirty per cent is three lots of ten per cent, and ten per cent is a tenth.",
      answer: "24, because a tenth of 80 is 8 and three of those make 24",
      feedback: {
        correct: "The percentage was built from tenths, which needs no calculator and is easy to check.",
        incorrect:
          "Ten per cent of 80 is 8, and thirty per cent is three of those, so the answer is twenty-four.",
      },
    },
    {
      id: "p2",
      prompt: "Increase 250 by 12%.",
      hint: "An increase keeps the whole and adds the share, so the multiplier is above one.",
      answer: "280, because 250 × 1.12 = 280",
      feedback: {
        correct: "The increase was written as a multiplier above one, so the original amount was kept.",
        incorrect:
          "Twelve per cent of 250 is 30, and adding it to 250 gives 280; the multiplier 1.12 does both steps at once.",
      },
    },
    {
      id: "p3",
      prompt: "After a 25% discount a jacket costs £36. Work out the price before the discount.",
      hint: "Decide what share of the original £36 represents before dividing.",
      answer: "£48, because £36 is 75% of the original and 36 ÷ 0.75 = 48",
      feedback: {
        correct: "The discounted price was treated as a share of the original, so division reversed the change.",
        incorrect:
          "A quarter off leaves three quarters, so £36 is seventy-five per cent of the original and 36 divided by 0.75 is 48.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 18% of 50.",
      modelAnswer: "9",
      marking: [
        "Multiplies by 0.18 or builds the amount from 10% and 8% rather than adding the percentage to the amount.",
        "Gives the result as 9.",
      ],
      check: { accepted: ["9"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A pupil says that a £40 item raised by 20% and then reduced by 20% is back to £40. Explain what actually happens, and why the two percentages do not cancel.",
      modelAnswer:
        "The rise takes the price to £48, because 40 × 1.2 = 48. The fall is twenty per cent of £48, not of £40, so it removes £9.60 and leaves £38.40. Written as multipliers the two changes are 1.2 and 0.8, whose product is 0.96: ninety-six per cent of the starting price, not one hundred. The percentages are equal but they are taken from different wholes, which is why only their product can tell you the result.",
      marking: [
        "Gives £38.40 with the intermediate £48.",
        "States that the fall is taken from the raised price.",
        "Uses the multipliers 1.2 and 0.8 and their product 0.96.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Shop A offers 15% off and then a further 10% off the reduced price. Shop B offers a single 25% discount. A pupil says the two shops are the same because 15 + 10 = 25. Decide which is cheaper and explain, using the multipliers.",
      whyItTransfers:
        "The learner must recognise that successive discounts multiply rather than add, and then compare two total multipliers on a price that is never named. Nothing in the arithmetic shows whether the reading was made, which is exactly what makes it a transfer task.",
      answer:
        "Shop B is cheaper. Shop A multiplies by 0.85 and then 0.9, giving 0.765, which is a 23.5% discount; Shop B multiplies by 0.75, a 25% discount. The second discount in Shop A is taken from the already reduced price, so the ten per cent removes less than ten per cent of the original, and the two reductions cannot be added.",
      marking: [
        "Multiplies the successive discounts, 0.85 × 0.9 = 0.765.",
        "Compares 0.765 with 0.75 and names Shop B as cheaper.",
        "Explains that the second discount applies to a smaller amount, so percentages of change do not add.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Write 45% as a decimal and as a fraction in its simplest form.",
      answer: "0.45 and nine twentieths, because 45 hundredths simplifies by five.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Work out 12.5% of 80.",
      answer: "10, because 12.5% is one eighth and an eighth of 80 is 10.",
      when: "week-later",
    },
  ],

  summary: [
    "A percent is a share with the part size fixed at one hundredth of the whole.",
    "Finding a percentage is multiplying by that share, and ten-per-cent chunks give a check without a calculator.",
    "A percentage change is a multiplier: 1.2 for a 20% rise, 0.8 for a 20% fall.",
    "Reversing a change divides by the multiplier, and successive changes multiply rather than add.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every percentage is read as a share of a named whole, so the amount and the whole are heard together rather than as a bare number with a sign after it.",
    },
    {
      need: "dyslexia",
      alternative:
        "The multiplier for each change is written on its own line before the calculation, so the percentage and the multiplication are never crowded into one expression.",
    },
    {
      need: "motor",
      alternative:
        "Answers are entered as a single value with the units already supplied, so no currency symbol or percentage sign has to be typed.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note: "All explanations, examples, practice and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution: "Scope cited against the published GCSE mathematics subject content for number.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-04",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
