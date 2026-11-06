import type { AuthoredLesson } from "../../lesson-contract";

// Foundation batch 4, concept 6 — sharing into equal groups.
//
// WHY THIS CONCEPT LAST. Division is the inverse of multiplication, so it can
// only be taught once multiplication's equal-group structure is secure. It is
// also the operation whose result most often surprises: a quotient can be larger
// than the number you started with, a remainder is not a decimal, and the two
// readings of the operation (sharing and grouping) answer different questions
// with the same calculation.
export const MATHS_DIVISION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "division",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: division, remainders and written methods",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Divide a whole number by a one-digit number with a written method, carrying the remainder between columns.",
      evidence:
        "The learner works out 156 divided by 4 as 39 and carries the remainder from the hundreds into the tens rather than dropping it.",
    },
    {
      statement: "Distinguish sharing from grouping, and say which reading a word problem is asking for.",
      evidence:
        "The learner answers 'how many groups of 4 fit in 156' and 'how big is each share when 156 is split into 4 parts' with the same division, and explains why the reading changes the meaning of the remainder.",
    },
    {
      statement: "Say when a quotient is larger than the number being divided, and check a division by multiplying.",
      evidence:
        "The learner says that dividing by one half doubles the number, so 47 divided by 0.5 is 94, and checks a division by multiplying the answer by the divisor.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["place-value"],
    check: [
      {
        id: "d1",
        question: "In 156, what is the 5 worth?",
        answer: "Fifty, because it sits in the tens column.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "What does it mean to exchange one ten for ten ones?",
        answer: "The amount stays the same while its form changes, so the ten becomes ten ones.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "A coach has 156 players and four minibuses of the same size. Two questions sound different and are answered by the same calculation: how many players fit in each bus, and how many buses of four players each could be filled. The answer, 39, is the same; what it describes is not.",
    why:
      "Division undoes multiplication, so every division can be checked by multiplying. The written method works left to right because place value does: the hundreds are shared first, and what is left over is carried into the tens as tens. A remainder is not a decimal and not a mistake; it is the amount that could not be shared into a whole group.",
  },

  explanation: [
    {
      heading: "Two readings, one calculation",
      paragraphs: [
        "Sharing splits an amount into a known number of equal parts and asks how big each part is: 156 players into four buses gives 39 per bus. Grouping takes a known group size and asks how many groups fit: 156 players in groups of four fills 39 buses. Both are division, and the number sentence is identical, but the question being answered is different and the remainder means something different in each.",
        "That difference matters as soon as the answer is not exact. Thirteen sweets shared between four children gives three each with one left over, and the leftover is a sweet that cannot be split without cutting it. Thirteen sweets put into bags of four fills three bags with one sweet left over. The arithmetic is the same; whether the remainder is a usable amount or an unopened bag depends on which reading the question asked for.",
      ],
    },
    {
      heading: "The written method shares by column and carries what is left",
      paragraphs: [
        "One hundred and fifty-six divided by four starts with the hundreds: one hundred cannot be shared into four whole hundreds, so it is exchanged for ten tens, giving fifteen tens. Fifteen tens shared into four gives three tens each with three tens left, and those three tens become thirty ones, which join the six to make thirty-six ones. Thirty-six shared into four is nine, so each share is thirty-nine.",
        "Each step keeps the amount unchanged while changing its form, exactly as the exchanges in addition and subtraction did. The remainder carried from one column is not discarded: it is converted into ten of the next column down, because that is what the place value says it is worth. Dropping it is the single most common error in the method.",
      ],
    },
    {
      heading: "Division does not always make smaller",
      paragraphs: [
        "Dividing by a number greater than one gives a smaller quotient, because the amount is being cut into more than one part. Dividing by a number below one does the opposite: asking how many halves fit in forty-seven gives ninety-four, because every whole contains two halves. The quotient is larger than the number being divided, and that is not an error.",
        "Because division and multiplication are inverses, every division has a check: multiply the answer by the divisor and add any remainder. If the result is not the number you started with, the working is wrong. That check works on decimals too, which is why it is worth using even when the arithmetic looks straightforward.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "Sharing by column, with the remainder carried from the hundreds into the tens.",
      notation: "156 ÷ 4 = 39",
      caption:
        "One hundred becomes ten tens, giving fifteen tens; three tens are left after the tens are shared and become thirty ones, which join the six.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "A rectangle of 156 unit squares cut into four equal columns. Each column holds thirty-nine squares.",
      notation: "4 × 39 = 156",
      caption:
        "The picture is the inverse relationship: four columns of thirty-nine is the 156 the division started from.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "Counting in fours from zero to one hundred and fifty-six, and counting the jumps.",
      notation: "0 → 40 → 80 → 120 → 156",
      caption:
        "Four jumps of thirty-nine, shown here as grouped jumps, reach 156. Grouping asks how many groups of four fit, and the jumps are the answer.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 156 divided by 4.",
      steps: [
        {
          move: "Start at the hundreds: 1 hundred cannot be shared into 4 whole hundreds, so exchange it for 10 tens.",
          why:
            "Sharing happens one column at a time, from the left, and a column that cannot be shared has to be exchanged rather than skipped. Skipping it would silently lose a hundred.",
        },
        {
          move: "Share 15 tens into 4: 3 tens each, with 3 tens left over.",
          why:
            "Three tens times four is twelve tens, and three remain. That remainder is tens, so it must be converted before the ones column is shared.",
        },
        {
          move: "Turn the 3 remaining tens into 30 ones, add the 6 ones, and share 36 into 4 to get 9.",
          why:
            "Thirty-six ones shared into four equal parts is nine in each part. Converting the remainder is what makes the final digit correct rather than three short.",
        },
        {
          move: "Read the answer as 39, then check by multiplying 39 by 4 to get 156.",
          why:
            "The check returns the starting number, which is what the inverse relationship guarantees when the working is right.",
        },
      ],
      answer: "39",
    },
    {
      id: "w2",
      prompt: "Work out 47 divided by 0.5, and explain why the answer is larger than 47.",
      steps: [
        {
          move: "Read the division as a grouping question: how many halves fit inside 47?",
          why:
            "The grouping reading makes the size of the answer visible before any arithmetic. Dividing by a half is not cutting 47 in half.",
        },
        {
          move: "Each whole contains two halves, so 47 wholes contain 47 lots of two halves.",
          why:
            "The relationship between a whole and its halves is exact and needs no borrowing. Multiplying by two is the same operation written differently.",
        },
        {
          move: "Conclude that the answer is 94, and check it by multiplying 94 by 0.5 to get 47.",
          why:
            "The check returns the starting number, and it also confirms the direction: a quotient larger than the dividend is correct when the divisor is below one.",
        },
      ],
      answer: "94",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Division always makes a number smaller, so a quotient larger than the number you started with must be wrong.",
      whyItFails:
        "Division asks how many of the divisor fit into the amount. When the divisor is below one, more than one of them fits into every whole, so the quotient exceeds the amount. Dividing 47 by 0.5 gives 94 because each whole holds two halves, and rejecting that answer throws away a correct result.",
      correction:
        "Compare the divisor with one before predicting the size. Above one, the quotient is smaller; below one, it is larger; equal to one, it is unchanged. The prediction then checks the arithmetic rather than fighting it.",
      contrast: {
        wrong: "47 ÷ 0.5 must be less than 47, so the answer is 23.5",
        right: "47 ÷ 0.5 = 94, because every whole contains two halves",
      },
    },
    {
      id: "m2",
      belief: "A remainder can be dropped, or written as a decimal by putting it after a point, so 13 divided by 4 is 3.1.",
      whyItFails:
        "The remainder is a count of ones, not a count of tenths. One left over from sharing thirteen into four parts is one quarter of the next whole, so the exact quotient is 3.25, not 3.1. Dropping it instead loses a quarter of the amount entirely.",
      correction:
        "Convert the remainder into the next column down before continuing: one remainder becomes ten tenths, which shared into four gives two tenths and a remainder of two, and the process continues to 3.25.",
      contrast: {
        wrong: "13 ÷ 4 = 3.1, writing the remainder of 1 as a tenth",
        right: "13 ÷ 4 = 3 remainder 1 = 3.25, because the remainder is a whole one",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Work out 96 divided by 8.",
      hint: "Start at the tens: can 9 tens be shared into 8 equal parts?",
      answer: "12, because 8 tens give 1 ten each with 1 ten left, which becomes 16 ones",
      feedback: {
        correct: "The remainder from the tens column was converted rather than dropped.",
        incorrect: "Nine tens shared into eight gives one ten each and one ten left, which is sixteen ones.",
      },
    },
    {
      id: "p2",
      prompt: "Thirteen sweets are shared between four children. How many each, and what happens to the leftover?",
      hint: "Decide whether the question is sharing or grouping before you deal with the remainder.",
      answer: "Three each with one left over; the leftover cannot be shared without cutting it",
      feedback: {
        correct: "The remainder was interpreted, not just computed.",
        incorrect: "Four threes make twelve, so one sweet remains and the question is what it means here.",
      },
    },
    {
      id: "p3",
      prompt: "Without calculating, is 250 divided by 5 larger or smaller than 250?",
      hint: "Compare the divisor with one before predicting.",
      answer: "Smaller, because the divisor is greater than one and the amount is cut into five parts",
      feedback: {
        correct: "The prediction gives you a size to check the answer against.",
        incorrect: "Dividing by five cuts 250 into five parts, so the quotient must be smaller.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 156 divided by 4.",
      modelAnswer: "39",
      marking: [
        "Exchanges the hundred for ten tens before sharing the tens column.",
        "Converts the remainder from the tens column into ones rather than dropping it.",
      ],
      check: { accepted: ["39"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner says 47 divided by 0.5 must be smaller than 47, because division makes numbers smaller, and writes 23.5. Explain what is wrong and give the correct answer.",
      modelAnswer:
        "Division asks how many of the divisor fit into the amount, so the quotient is smaller only when the divisor is greater than one. A half fits into every whole twice, so 47 wholes contain 94 halves and the answer is 94. The learner has halved 47 instead of counting halves, and multiplying 94 by 0.5 returns 47, which checks the correct answer.",
      marking: [
        "States that division by a number below one gives a larger quotient.",
        "Explains the grouping reading: two halves fit in each whole.",
        "Gives 94 and checks it by multiplying by 0.5.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A school has 1,250 sheets of paper and photocopiers that use 25 sheets per booklet. Staff also want to split the paper equally between five year groups. Which question can the paper not answer twice, and what does the remainder mean in each case?",
      whyItTransfers:
        "The learner has to choose between the two readings of division for the same quantity, and to interpret a remainder differently in each. That decision is the concept, and it is not visible in a bare calculation.",
      answer:
        "The paper divides exactly both ways: 1,250 divided by 25 is 50 booklets, and 1,250 divided by 5 is 250 sheets per year group. If the numbers did not divide exactly, a leftover sheet would be an unusable part of a booklet in the first reading and a sheet that could still be given out in the second.",
      marking: [
        "Gives both quotients, 50 and 250.",
        "Names the reading used in each case, grouping and sharing.",
        "Explains what a remainder would mean in each reading.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Work out 84 divided by 7.",
      answer: "12, because seven twelves are eighty-four.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is 13 divided by 4, as a decimal?",
      answer: "3.25, because the remainder of one is a quarter of the next whole.",
      when: "week-later",
    },
  ],

  summary: [
    "Division undoes multiplication, so every division can be checked by multiplying.",
    "Sharing and grouping are two readings of the same calculation, and they interpret a remainder differently.",
    "The written method shares from the left and converts each remainder into ten of the next column.",
    "Dividing by a number below one gives a quotient larger than the amount you started with.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each column's share and remainder are announced together, so the carried amount is heard as part of the next column rather than as a lost digit.",
    },
    {
      need: "dyslexia",
      alternative:
        "The written method is laid out in labelled columns with the converted remainder written in the next column, matching the area model beside it.",
    },
    {
      need: "motor",
      alternative:
        "The division can be answered by entering each column's quotient and remainder separately, so a single long division layout is not required.",
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
