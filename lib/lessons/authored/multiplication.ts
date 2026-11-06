import type { AuthoredLesson } from "../../lesson-contract";

// Foundation batch 4, concept 5 — equal groups combined.
//
// WHY THIS CONCEPT. Multiplication is where learners first meet a structure
// rather than a count: four groups of three is not four plus three. Taught as
// repeated addition alone, it survives small numbers and collapses at the
// two-digit method, where the second partial product is written a column left
// and the missing zero becomes the most common error in the whole of arithmetic.
export const MATHS_MULTIPLICATION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "multiplication",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: multiplication and written methods",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Multiply a two-digit number by a one-digit number, splitting it by place value.",
      evidence:
        "The learner works out 23 multiplied by 4 as 92 by doing 20 fours and 3 fours separately, rather than counting on four twenty-three times.",
    },
    {
      statement: "Multiply two two-digit numbers using partial products, placing the second product one column left.",
      evidence:
        "The learner works out 23 multiplied by 14 as 322 and explains why the second partial product is 230 rather than 23.",
    },
    {
      statement: "Say when multiplication makes a number smaller, and predict the size of a product before computing it.",
      evidence:
        "The learner says that multiplying by a number below one takes a part of the amount, so 0.5 multiplied by 0.5 is 0.25 rather than 2.5.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["place-value"],
    check: [
      {
        id: "d1",
        question: "In 23, what is the 2 worth?",
        answer: "Twenty, because it sits in the tens column.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "If you move a digit one column to the left, what happens to its value?",
        answer: "It becomes ten times larger, which is why a partial product shifts a column.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "A hall has fourteen rows of twenty-three chairs. Nobody counts the chairs one at a time. The seating is a rectangle, and a rectangle can be cut into pieces that are easy to count: ten rows of twenty-three, and four rows of twenty-three.",
    why:
      "Multiplication combines equal groups, and its written methods are ways of cutting a rectangle into pieces whose sizes you already know. That is why place value matters here: a product can be split into a tens part and a ones part, and the parts added back. Seeing the structure also explains the rule that multiplying does not always make a number bigger.",
  },

  explanation: [
    {
      heading: "Multiplication counts equal groups, not different ones",
      paragraphs: [
        "Four groups of three is twelve because the groups are the same size: three, and again three, and again, and again. Four plus three would be seven, and the difference between the two operations is the whole point. Multiplication is only defined when the groups are equal, which is why a rectangle is its natural picture: equal rows, each of the same length.",
        "That structure is what makes the times tables worth knowing by heart. Recognising that twenty-four is four sixes lets a learner factorise, simplify a fraction and estimate without recalculating, because the fact is stored as a relationship rather than as a sequence of additions. Fluency here is not speed for its own sake: it frees attention for the method that follows.",
      ],
    },
    {
      heading: "Splitting by place value turns a hard product into two easy ones",
      paragraphs: [
        "Twenty-three multiplied by four is hard only because twenty-three is not a single fact. But twenty-three is twenty and three, and four groups of twenty-three is four groups of twenty plus four groups of three: eighty and twelve, which is ninety-two. The split is legal because the two parts together are the whole amount, and each part is multiplied by the same four.",
        "The written method does exactly this and records it. When the product of the ones is more than nine, the tens of that product carry into the tens column, just as they do in addition, because they are tens and belong there. The carry is not a rule about small numbers written above the line; it is the same exchange of ten ones for one ten.",
      ],
    },
    {
      heading: "The second partial product starts a column to the left",
      paragraphs: [
        "Twenty-three multiplied by fourteen cuts the rectangle into ten rows of twenty-three and four rows of twenty-three. Ten rows of twenty-three is two hundred and thirty, not twenty-three: multiplying by the 1 in the tens column means multiplying by ten, and multiplying by ten moves every digit one column left. Writing 23 in the second row without that shift is the most common error in the method.",
        "The same reasoning explains a product smaller than its factors. Multiplying by a number below one takes a part of the amount, so a half of a half is a quarter. The written method still works, because the digits multiply as whole numbers and the point is placed afterwards by counting decimal places. What changes is the size, and predicting it is how you catch a point in the wrong place.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "A two-digit product split by place value, with the carry recorded.",
      notation: "23 × 4 = (20 × 4) + (3 × 4) = 80 + 12 = 92",
      caption:
        "The rectangle is cut into twenty fours and three fours. The twelve from the ones carries one ten into the tens column.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "A rectangle fourteen wide and twenty-three high, cut into four blocks by the tens and ones of each number.",
      notation: "(10 + 4) × (20 + 3) = 200 + 30 + 80 + 12",
      caption:
        "Four blocks, four partial products. The 200 block is what the shifted row of the written method represents.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "Four jumps of twenty-three, split into jumps of twenty and jumps of three.",
      notation: "0 → 80 → 92",
      caption:
        "Four twenties take the line to eighty, and four threes add twelve more. The jumps are equal in size, which is what makes this multiplication.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 23 multiplied by 4.",
      steps: [
        {
          move: "Split 23 into 20 and 3 before multiplying anything.",
          why:
            "Twenty-three is not one of the facts you know by heart, but twenty and three are. Splitting by place value turns one unfamiliar product into two familiar ones.",
        },
        {
          move: "Multiply each part by 4: 20 fours make 80, and 3 fours make 12.",
          why:
            "The same multiplier applies to both parts because together they are the whole amount. Multiplying only one part would give a product of part of the number.",
        },
        {
          move: "Add the parts to get 92, carrying the ten from the 12 into the tens column.",
          why:
            "Eighty and twelve are ninety-two, and the ten inside the twelve is why the written method records a carry rather than writing twelve in the ones column.",
        },
      ],
      answer: "92",
    },
    {
      id: "w2",
      prompt: "Work out 23 multiplied by 14.",
      steps: [
        {
          move: "Split 14 into 10 and 4, and multiply 23 by each part separately.",
          why:
            "Fourteen rows of twenty-three is ten rows plus four rows. Cutting the rectangle at the tens boundary keeps each product small enough to be certain of.",
        },
        {
          move: "Four rows give 92, and ten rows give 230, because multiplying by ten shifts every digit one column left.",
          why:
            "The 1 in 14 sits in the tens column, so it multiplies by ten rather than by one. That shift is the whole reason the second row of the written method starts a column to the left.",
        },
        {
          move: "Add the two partial products: 230 plus 92 makes 322.",
          why:
            "The parts are the two pieces of the same rectangle, so their total is the total number of chairs. Writing 23 instead of 230 for the second row would lose two hundred from the answer.",
        },
      ],
      answer: "322",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "In the written method, the second partial product is just the ones product written again on the next line.",
      whyItFails:
        "The second row is multiplied by the tens digit, so every digit in it is ten times larger. Twenty-three multiplied by the 1 in fourteen is two hundred and thirty, not twenty-three. Omitting the shift loses two hundred and makes 23 times 14 come out as 115, which is barely more than a quarter of the true product.",
      correction:
        "Write a zero in the ones column of the second row, or start it one column to the left, and say aloud that the row is counting tens. The placement is the arithmetic, not a layout preference.",
      contrast: {
        wrong: "23 × 14 = 23 + 92 = 115",
        right: "23 × 14 = 230 + 92 = 322",
      },
    },
    {
      id: "m2",
      belief: "Multiplying always makes a number bigger, so a product must exceed both factors.",
      whyItFails:
        "Multiplication grows an amount only when the multiplier is greater than one. Half of a half is a quarter, so 0.5 multiplied by 0.5 is 0.25, which is smaller than either factor. Believing otherwise makes a misplaced decimal point look acceptable, because 2.5 fits the expectation and 0.25 does not.",
      correction:
        "Predict the size before computing: two tenths of three tenths must be less than three tenths. If the digits then give a larger result, the point has been placed wrongly, and the prediction is what catches it.",
      contrast: {
        wrong: "0.5 × 0.5 = 2.5, because multiplying makes numbers bigger",
        right: "0.5 × 0.5 = 0.25, because a half of a half is a quarter",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Work out 68 multiplied by 7.",
      hint: "Split 68 into 60 and 8, then multiply each part by 7.",
      answer: "476, because 60 sevens are 420 and 8 sevens are 56",
      feedback: {
        correct: "Splitting by place value kept both products inside the tables.",
        incorrect: "Sixty sevens make 420 and eight sevens make 56; adding them gives 476.",
      },
    },
    {
      id: "p2",
      prompt: "Work out 34 multiplied by 12, and say why the second row starts one column left.",
      hint: "Twelve is ten and two. Multiply by each and line the results up by place value.",
      answer: "408, because 34 tens are 340 and 34 twos are 68",
      feedback: {
        correct: "You placed the tens product where its value belongs.",
        incorrect: "The 1 in 12 is worth ten, so 34 times it is 340, not 34.",
      },
    },
    {
      id: "p3",
      prompt: "Without calculating, decide whether 0.4 multiplied by 0.6 is more or less than 0.4.",
      hint: "The multiplier is below one, so ask what fraction of 0.4 you are taking.",
      answer: "Less, because six tenths of 0.4 is a part of 0.4",
      feedback: {
        correct: "The prediction is the check that catches a misplaced point.",
        incorrect: "You are taking six tenths of 0.4, which must be smaller than 0.4 itself.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 23 multiplied by 14.",
      modelAnswer: "322",
      marking: [
        "Multiplies by the tens digit as tens, shifting the product one column left.",
        "Adds both partial products rather than writing the second one in the ones column.",
      ],
      check: { accepted: ["322"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner works out 23 multiplied by 14 as 115, writing 23 and then 92 on the next line and adding. Explain the mistake and give the correct answer.",
      modelAnswer:
        "The second line is the product of 23 with the 1 in 14, and that 1 is worth ten, so the line should be 230 rather than 23. Fourteen rows of twenty-three is ten rows of twenty-three plus four rows, which is 230 plus 92, giving 322. The learner's 115 is the sum of four rows and one row, so it counts five rows instead of fourteen.",
      marking: [
        "Identifies that the 1 in 14 multiplies as ten, not as one.",
        "Shows the second partial product as 230, or explains the column shift.",
        "Gives 322 and connects it to the two parts of the rectangle.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A tiler is covering a floor twelve tiles wide and thirty-four tiles long, and has 400 tiles in the van. Use a multiplication you can justify to decide whether the van holds enough, and explain how you know your answer is the right size.",
      whyItTransfers:
        "The numbers require the two-digit method, the question asks for a decision rather than a product, and the learner has to justify the size of the answer in a setting where an error has a cost.",
      answer:
        "The floor needs 408 tiles, because 34 tens are 340 and 34 twos are 68. The van holds 400, so it is eight short; the estimate of about 400 confirms the size.",
      marking: [
        "Multiplies 34 by 12, splitting 12 into ten and two.",
        "Gives 408 and compares it with 400.",
        "States the decision, that the van is short, consistently with the product.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Work out 46 multiplied by 3.",
      answer: "138, because 40 threes are 120 and 6 threes are 18.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Without calculating, is 0.7 multiplied by 0.8 more or less than 0.7?",
      answer: "Less, because eight tenths of 0.7 is a part of it.",
      when: "week-later",
    },
  ],

  summary: [
    "Multiplication counts equal groups, which is why a rectangle is its natural picture.",
    "Splitting a number by place value turns one hard product into two easy ones.",
    "The tens digit of a multiplier counts tens, so its partial product shifts one column left.",
    "Multiplying by a number below one takes a part of the amount, so the product is smaller.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each partial product is announced with the multiplier that produced it, so the column shift is described rather than seen.",
    },
    {
      need: "dyslexia",
      alternative:
        "The area model is labelled with all four partial products, and the written method is shown beside it with matching labels.",
    },
    {
      need: "motor",
      alternative:
        "Partial products can be entered one per line with the column alignment handled by the page, so the method is not lost to spacing errors.",
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
