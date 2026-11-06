import type { AuthoredLesson } from "../../lesson-contract";

// Foundation batch 4, concept 2 — combining quantities.
//
// WHY THIS CONCEPT. Addition is the first operation the genome places on top of
// place value, and the first place a learner's column reading is tested: the
// method only works because ones meet ones and tens meet tens. It is also where
// carrying is usually taught as a trick ("put the one on top") rather than as
// the exchange it is, which is why the same learner who can carry cannot say why
// the column total became a ten.
export const MATHS_ADDITION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "addition",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: addition and written methods",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Add two whole numbers with a written method that lines up place values, carrying a group of ten into the next column.",
      evidence:
        "The learner works out 47 plus 25 as 72 and shows the ten ones exchanged for one ten, rather than writing a two-digit total inside a single column.",
    },
    {
      statement: "Say why addition gives the same total in either order, and use that to choose an easier order.",
      evidence:
        "The learner reorders 198 plus 203 as 200 plus 201, or adds 2 to one number and takes 2 from the other, and states that the total is unchanged.",
    },
    {
      statement: "Check an addition by estimating first and by adding back.",
      evidence:
        "The learner estimates 47 plus 25 as about 75, rejects an answer of 612 as impossible, and checks a subtraction by adding the parts.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["place-value"],
    check: [
      {
        id: "d1",
        question: "In 47, what is the 4 worth, and what is the 7 worth?",
        answer: "The 4 is worth forty and the 7 is worth seven, because of the columns they sit in.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "How many ones make one ten?",
        answer: "Ten ones make one ten, which is why a column that reaches ten can be exchanged.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "A stadium turnstile counts 47 people through one gate and 25 through another. Nobody adds the digits 4, 7, 2 and 5 and gets 18: the two queues are counted as amounts, forty-seven and twenty-five, and the total is seventy-two.",
    why:
      "Adding is combining two amounts of the same kind. The written method is not a set of rules to memorise but a way of keeping the kinds apart: ones are added to ones and tens to tens, and when a column holds ten or more, ten of them are exchanged for one of the next column. That exchange is the only new idea in the whole method.",
  },

  explanation: [
    {
      heading: "You can only add things of the same kind",
      paragraphs: [
        "Adding forty-seven and twenty-five means putting two collections together: forty-seven objects and twenty-five more. The answer is a single collection, and to count it reliably the objects need to be gathered by kind, ones with ones and tens with tens. That is what the columns of a written sum do. They are not decoration; they are the instruction to add like with like.",
        "This is why the numbers are written one above the other with the ones vertically aligned. If the 7 and the 5 were not in the same column, the additions would mix tens with ones, and the total would describe a quantity nobody has. Aligning by column is the whole reason the method gives a correct answer.",
      ],
    },
    {
      heading: "Carrying is an exchange, not a trick",
      paragraphs: [
        "In 47 plus 25, the ones column holds 7 and 5, which is 12 ones. Twelve ones is one ten and two ones, so the ten is exchanged for a single ten in the next column and two ones stay where they are. The small 1 written above the tens column is a record of that exchange, not a lucky charm: it says one ten has moved in from the column on the right.",
        "Because it is an exchange, the amount never changes, only its form. Twelve ones and one ten plus two ones are the same quantity, written differently. A learner who can say that sentence can carry in any column and can also explain why the method stops being needed when the column total is below ten: there is nothing to exchange.",
      ],
    },
    {
      heading: "Order does not change the total, and that is useful",
      paragraphs: [
        "Putting the two collections together in the other order gives the same collection, so addition is commutative: forty-seven plus twenty-five and twenty-five plus forty-seven are both seventy-two. Grouping three numbers differently also leaves the total unchanged, which is why a long list can be added in whatever order is easiest without altering the answer.",
        "That freedom is a calculation tool, not just a fact. Two hundred and three plus one hundred and ninety-eight is awkward column work, but it is two hundred plus two hundred and one, which is four hundred and one. Noticing a number that is close to a round one, and adjusting, is often faster and always easier to check than the written method.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "The written sum, with the exchange recorded above the tens column.",
      notation: "47 + 25 = 72",
      caption:
        "Seven ones and five ones make twelve ones: two stay in the ones column and one ten is carried into the tens column.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "Base-ten blocks for both numbers: four tens and seven ones beside two tens and five ones. The seven loose ones and five loose ones make a new rod, with two cubes left over.",
      notation: "4 tens + 7 ones  +  2 tens + 5 ones  =  7 tens + 2 ones",
      caption:
        "The picture is the exchange: ten unit cubes become one rod, which is why the carried one belongs in the tens column.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "Adding twenty-five in two jumps, tens first and then ones.",
      notation: "47 → 67 → 72",
      caption:
        "Forty-seven plus twenty is sixty-seven, and plus five more is seventy-two. Jumps on the line show addition as movement, which is the mental method written down.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 68 plus 27 using a written method.",
      steps: [
        {
          move: "Write the numbers one above the other, with the ones under the ones.",
          why:
            "The method only adds like with like if the columns line up. Aligning by column is what turns two numbers into two collections of the same kinds.",
        },
        {
          move: "Add the ones: 8 and 7 make 15, so write 5 and carry one ten.",
          why:
            "Fifteen ones is one ten and five ones. Only five can stay in the ones column, and the ten has to be exchanged into the column where tens are counted.",
        },
        {
          move: "Add the tens, including the carried ten: 6 and 2 and 1 make 9.",
          why:
            "The carried ten is a ten, so it belongs with the other tens. Leaving it out is the most common slip and loses ten from the answer.",
        },
        {
          move: "Read the total as 95, and check it against a rough estimate.",
          why:
            "Seventy plus thirty is about a hundred, so ninety-five is the right size. An estimate cannot prove the answer, but it can reject one that is wildly wrong.",
        },
      ],
      answer: "95",
    },
    {
      id: "w2",
      prompt: "Work out 198 plus 203 without a written column method.",
      steps: [
        {
          move: "Notice that both numbers sit close to a round number.",
          why:
            "A number two away from two hundred can be adjusted in the head far more easily than it can be added column by column. Choosing the method is part of doing the sum.",
        },
        {
          move: "Write 198 as 200 minus 2, and 203 as 200 plus 3.",
          why:
            "Both forms describe the same amounts. Writing them this way puts the round parts together and leaves only a small adjustment.",
        },
        {
          move: "Add 200 and 200 to get 400, then take 2 and add 3, giving 401.",
          why:
            "The adjustments are opposites, so they partly cancel. Doing them after the round parts keeps the arithmetic small enough to trust without writing anything down.",
        },
      ],
      answer: "401",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Add each column and write the whole two-digit total in that column, so 47 plus 25 becomes 612.",
      whyItFails:
        "Writing 12 in the ones column puts a ten where ones are counted, so the answer claims twelve ones and no tens. The total 612 is not merely untidy: it is a different quantity, because each column can hold only one digit and the rest has to be exchanged.",
      correction:
        "When a column reaches ten or more, keep one digit there and exchange each ten for one in the next column left. Twelve ones becomes two ones and one ten, and the ten is added with the tens.",
      contrast: {
        wrong: "47 + 25 = 612, with 12 written in the ones column",
        right: "47 + 25 = 72, with 12 ones exchanged for one ten and two ones",
      },
    },
    {
      id: "m2",
      belief: "The carried ten is separate from the other tens and can be written beside the answer instead of added.",
      whyItFails:
        "The carry is a ten that has joined the tens column, so it is part of that column's total. Recording it separately loses it from the sum: 68 plus 27 would be recorded as 85 rather than 95, and the missing ten is exactly the exchanged group.",
      correction:
        "Add the carried ten in the same step as the other tens. Writing it small above the column is a reminder of what is coming, not a place to leave it.",
      contrast: {
        wrong: "68 + 27 = 85, with the carried one noted but not added",
        right: "68 + 27 = 95, with 6 and 2 and the carried 1 making 9 tens",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Work out 36 plus 48.",
      hint: "Start with the ones column, then decide whether anything needs exchanging.",
      answer: "84, because 6 and 8 make 14, giving 4 ones and one carried ten",
      feedback: {
        correct: "The exchange was made before the tens were added, which is the order that works.",
        incorrect: "Check the ones: 6 plus 8 is 14, so 4 stays and one ten carries into the tens column.",
      },
    },
    {
      id: "p2",
      prompt: "Estimate 397 plus 205, then say whether an answer of 6,020 is plausible.",
      hint: "Round both numbers to the nearest hundred before deciding.",
      answer: "About 600, so 6,020 is ten times too large",
      feedback: {
        correct: "An estimate is enough to reject an answer that is the wrong size.",
        incorrect: "Four hundred plus two hundred is six hundred, not six thousand.",
      },
    },
    {
      id: "p3",
      prompt: "Work out 199 plus 201 by adjusting a round number.",
      hint: "One number is one below two hundred and the other is one above.",
      answer: "400, because the two adjustments cancel",
      feedback: {
        correct: "The adjustments cancelled, which is why the round total stayed exact.",
        incorrect: "Try 200 plus 200, then take one and add one: the total is unchanged.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 68 plus 27.",
      modelAnswer: "95",
      marking: [
        "Adds the ones and exchanges ten of them for one ten.",
        "Adds the carried ten with the other tens, giving nine tens rather than eight.",
      ],
      check: { accepted: ["95"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner works out 47 plus 25 and writes 612 as the answer. Explain what they have done and what the correct answer is, in a way that shows why the carry exists.",
      modelAnswer:
        "They added each column and wrote the whole total in the column, so twelve ones were written as 12 in a column that can hold only one digit. Twelve ones is one ten and two ones, so the two stays in the ones column and the ten is exchanged into the tens column, where it is added to 4 and 2 to give 7 tens. The answer is 72, and the carry is the record of that exchange.",
      marking: [
        "Identifies that the ones column total was written as two digits in one column.",
        "Explains the exchange of ten ones for one ten, rather than describing a rule to memorise.",
        "Gives 72 and shows the carried ten added to the tens column.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A club's three collections hold 198, 205 and 197 badges. Work out the total in a way you could do without writing a column sum, and explain the adjustment you made.",
      whyItTransfers:
        "The numbers are chosen so that three amounts sit either side of a round number, and the learner has to decide on a method before computing. Recognising when not to use the written method is the skill being tested.",
      answer:
        "600 badges: 200 plus 205 plus 200 is 605, then take 2 and 3, or note that 198 and 197 are 3 below 400 in total, giving 600.",
      marking: [
        "Uses a round number and adjusts, rather than adding digit by digit.",
        "Accounts for every adjustment made, in the right direction.",
        "Gives 600 with the reasoning visible enough to check.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Work out 58 plus 36.",
      answer: "94, because 8 and 6 make 14 and the carried ten makes 9 tens.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is 199 plus 205?",
      answer: "404, because 200 plus 205 is 405 and taking one leaves 404.",
      when: "week-later",
    },
  ],

  summary: [
    "Addition combines two amounts of the same kind, which is why the columns are aligned.",
    "A column that reaches ten exchanges ten of its units for one of the column to its left.",
    "The total is the same in any order or grouping, which makes some sums easier in the head.",
    "Estimate first: an estimate cannot prove a total, but it can reject the wrong size.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "A written sum is announced column by column, with the carried figure named as part of the tens column rather than as a separate number.",
    },
    {
      need: "dyslexia",
      alternative:
        "Columns are ruled and labelled (hundreds, tens, ones), and the carried figure is placed in a marked box above its column instead of floating.",
    },
    {
      need: "motor",
      alternative:
        "The exchange can be recorded by selecting a carry button rather than writing a small figure above the column.",
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
