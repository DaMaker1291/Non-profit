import type { AuthoredLesson } from "../../lesson-contract";

// Batch 5 — the concept the whole secondary graph rests on.
//
// `negatives` is the prerequisite `coordinates` declares, and coordinates is the
// prerequisite of straight lines, graphs and every later curve. A pupil who reads
// minus seven as "seven, with a sign on it" cannot order a set of integers, cannot
// subtract a negative, and cannot plot a point below the x-axis — three failures
// that all look like three different topics.
//
// The lesson therefore teaches one idea (a negative is a POSITION, and the sign
// says which side of zero it sits on) and derives every rule from it: ordering
// from position, adding and subtracting from moves along the line, and the sign of
// a product from reversing direction twice. Nothing here is stated as a rule to
// memorise, because the rules are what a learner who forgot them cannot recall.
export const MATHS_NEGATIVES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "negatives",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: negative numbers, ordering and the four operations",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Place negative numbers on a number line and order a mixed set, explaining why a larger digit below zero means a smaller number.",
      evidence:
        "The learner orders minus nine, minus four, zero and two correctly and says that minus nine is further left, so it is smaller even though nine is the larger digit.",
    },
    {
      statement:
        "Subtract a negative number by treating it as undoing a move to the left, and justify the direction with a number line.",
      evidence:
        "The learner works out 5 minus minus three as 8 and explains that removing a debt of three leaves them three better off, rather than subtracting the sizes to get 2.",
    },
    {
      statement:
        "Decide the sign of a product or quotient before calculating, and check a division against its multiplication.",
      evidence:
        "The learner says minus two times minus three must be positive because the direction reverses twice, gives 6, and checks it with 6 divided by minus three equals minus two.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["place-value"],
    check: [
      {
        id: "n1",
        question: "In 156, what is the 5 worth?",
        answer: "Fifty, because it sits in the tens column.",
        targets: ["place-value"],
      },
      {
        id: "n2",
        question: "Which number is further from zero: 7 or 2?",
        answer: "Seven, by five steps.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "An underground car park numbers its floors minus one, minus two and minus three. Nothing about minus two means 'take away two cars': it is a floor, two levels below the street. Once a negative is a position, every question about negatives becomes a question about where something sits and which way a move goes.",
    why:
      "The same reading covers a temperature below zero, a debt, a depth below sea level and a point under the x-axis. What changes between them is the direction that counts as below; what stays the same is that the sign says which side of zero a value is on, and the digits say how far from zero it reaches. Every rule in this lesson is derived from that one picture, which is why a learner who has forgotten the rules can rebuild them.",
  },

  explanation: [
    {
      heading: "Below zero is still a position",
      paragraphs: [
        "A negative number is a position on the number line, not a minus sign attached to an amount. Temperatures below zero, floors below ground, depths under water and debts are all measured in one direction: downward, leftward, below the line where zero sits. Two is two steps to the right of zero and minus two is two steps to the left, so the two numbers are equally far from zero and sit on opposite sides of it.",
        "Distance from zero and position matter separately, which is why ordering negatives surprises people. Seven is bigger than two, but minus seven is further left than minus two, so minus seven is the smaller number. The digits tell you how far from zero a value sits; the sign tells you which side. Reading left to right along the line always gives the order from smallest to largest, so minus seven comes before minus two.",
      ],
    },
    {
      heading: "Adding moves right, subtracting moves left",
      paragraphs: [
        "Adding moves you along the line, subtracting moves you the opposite way, and the sign of the number says which direction the move has. Adding four moves right four; adding minus four moves left four. Subtraction undoes a move: subtracting three moves left three, and subtracting minus three undoes a leftward move, which sends you right three. The operation names the move and the sign names the direction.",
        "That is why five minus minus three is eight rather than two. A debt of three cancelled is three you no longer owe, so your position improves by three and the total rises from five to eight. Read as a journey, starting at five and removing a move of three to the left lands you at eight. Checking the answer against the line catches the common slip of subtracting the sizes instead of the signed values.",
      ],
    },
    {
      heading: "Two negatives multiply to a positive, and the pattern proves it",
      paragraphs: [
        "Multiplying by a negative number reverses direction, and multiplying by two negatives reverses it twice, which returns you to where you started. Multiplying six by minus one gives minus six; applying minus one again gives six back. That is the whole reason two negatives give a positive: each negative factor flips the sign, and two flips cancel. Division follows the same rule, because a division asks which number multiplied by the divisor gives the result.",
        "A pattern makes the rule visible without appealing to it. Three times minus two is minus six, two times minus two is minus four, one times minus two is minus two, and zero times minus two is zero; each time the first factor falls by one, the product rises by two. Continuing the pattern one more line gives minus one times minus two as two. A rule that contradicted the pattern would break the arithmetic on either side of it.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.number-line",
      body:
        "Start at five. Subtracting minus three removes a move of three to the left, so the journey continues three to the right and ends at eight.",
      notation: "5 − (−3) = 8",
      caption:
        "The arrow turns around rather than shortening: removing a leftward move sends the position right, which is why the answer grows.",
    },
    {
      id: "r2",
      kind: "maths.number-line",
      body:
        "Four values on one line: minus nine, minus four, zero and two, read from left to right.",
      notation: "−9 < −4 < 0 < 2",
      caption:
        "Left to right is smallest to largest. Minus nine is furthest left, so it is the smallest, even though nine is the largest digit on the line.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "The sign of a product is decided before the arithmetic: each negative factor flips the sign once, and the size is the product of the two sizes.",
      notation: "(−2) × (−3) = 6",
      caption:
        "Two flips restore the positive sign; the size, six, comes from multiplying the two sizes and is unaffected by the signs.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 5 − (−3).",
      steps: [
        {
          move: "Read the calculation as starting at 5 and undoing a move of 3 to the left.",
          why:
            "Subtracting a negative undoes a leftward move, so the journey reverses direction rather than continuing it.",
        },
        {
          move: "Undoing three left is three right, so move from 5 to 8.",
          why:
            "The size of the move is unchanged and only its direction reverses, which is exactly what the double sign does.",
        },
        {
          move: "State the answer as 8, then check it by adding: 8 + (−3) = 5.",
          why:
            "Adding the negative back returns the starting value, which confirms the direction was reversed correctly rather than ignored.",
        },
      ],
      answer: "8",
    },
    {
      id: "w2",
      prompt: "Work out (−2) × (−3) by continuing a pattern, and check the sign.",
      steps: [
        {
          move:
            "Write the run of products as the first factor falls: 3 × (−2) = −6, 2 × (−2) = −4, 1 × (−2) = −2, 0 × (−2) = 0.",
          why:
            "Each line is one fewer copy of the same negative amount, so the pattern is forced by the arithmetic rather than chosen.",
        },
        {
          move: "Notice that the product rises by 2 every time the first factor falls by 1.",
          why:
            "The step size is the size of the second factor, because one fewer copy removes exactly that amount from a negative total.",
        },
        {
          move:
            "Continue one line: (−1) × (−2) = 2, so (−2) × (−3) = 6, and check with 6 ÷ (−3) = −2.",
          why:
            "The division returns the factor that was multiplied, and it confirms the sign: a positive divided by a negative is negative.",
        },
      ],
      answer: "6",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Minus seven is bigger than minus two, because seven is bigger than two.",
      whyItFails:
        "Order on the number line is position, not distance. Minus seven sits further left than minus two, and further left is smaller, so comparing the digits gives the opposite answer. A temperature of minus seven is colder than minus two, which is the ordering a learner can check against something real.",
      correction:
        "Compare positions rather than digits: locate both numbers on the line and read left to right. When the signs differ, the negative is always the smaller; when both are negative, the larger digits make the smaller number.",
      contrast: {
        wrong: "−7 > −2, because 7 is greater than 2",
        right: "−7 < −2, because −7 is further left and seven degrees colder",
      },
    },
    {
      id: "m2",
      belief: "5 − (−3) = 2, because subtracting always makes a number smaller.",
      whyItFails:
        "The rule that subtraction reduces applies to subtracting a positive amount. Subtracting a negative removes a debt, so the total rises by the size of that debt. Cancelling three of debt leaves the borrower three better off, so the position moves up to 8 rather than down to 2.",
      correction:
        "Rewrite every subtraction of a negative as an addition of its opposite before calculating, so 5 − (−3) becomes 5 + 3. The direction is then unambiguous and the number line agrees with the answer.",
      contrast: {
        wrong: "5 − (−3) = 2, because subtracting makes it smaller",
        right: "5 − (−3) = 8, because removing a debt of 3 leaves 3 more than before",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Put these in order, smallest first: −4, 2, −9, 0.",
      hint: "Find where each value sits relative to zero before comparing any two of them.",
      answer: "−9, −4, 0, 2",
      feedback: {
        correct: "Ordering by position on the line rather than by digit size gives this straight away.",
        incorrect:
          "Minus nine is furthest left, so it comes first; the digits only tell you how far from zero each value sits.",
      },
    },
    {
      id: "p2",
      prompt: "Work out 3 − (−6).",
      hint: "Subtracting a negative undoes a leftward move, so the position travels right.",
      answer: "9, because undoing a leftward move of 6 from 3 lands at 9",
      feedback: {
        correct: "The double sign reversed the direction and the answer grew, which is the check that it worked.",
        incorrect:
          "Three with a move of six to the left removed travels six to the right instead, arriving at nine.",
      },
    },
    {
      id: "p3",
      prompt: "Work out (−4) × 5, and decide the sign before you multiply.",
      hint: "One negative factor flips the sign once; the size is 4 multiplied by 5.",
      answer: "−20, because one negative factor makes the product negative",
      feedback: {
        correct: "The sign was decided from the number of negative factors, not from the digits.",
        incorrect:
          "Four times five is twenty, and one negative factor makes that product negative, so the answer is minus twenty.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out −6 + 9.",
      modelAnswer: "3",
      marking: [
        "Moves nine places to the right from minus six rather than adding the sizes regardless of sign.",
        "Gives the result as 3.",
      ],
      check: { accepted: ["3", "+3"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner writes (−2) × (−3) = −6 and says that two negatives always make a negative. Explain what is wrong and give the correct product.",
      modelAnswer:
        "Each negative factor reverses direction, so two negative factors reverse it twice and the product is positive. The size is two times three, which is six, so the product is 6 and not minus six. Checking with division confirms it: six divided by minus three is minus two, which returns the factor that was multiplied. The learner has applied the rule for one negative factor to a product that has two.",
      marking: [
        "States that each negative factor flips the sign, so two flips cancel.",
        "Gives the product as 6 with the size two times three.",
        "Checks the answer by dividing, and names the rule the learner over-applied.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "At the summit of a mountain the temperature is −7 °C and at sea level it is 3 °C. A pupil says the difference is 4 °C, because 7 − 3 = 4. Give the correct difference and explain what the subtraction represents.",
      whyItTransfers:
        "The learner must choose a signed difference rather than a difference of sizes, and then interpret the number as a span on the line. That choice is the concept, and no bare calculation on the page shows whether it was made.",
      answer:
        "The difference is 10 °C, because 3 − (−7) = 10: from the summit to sea level the temperature rises by ten degrees, crossing zero on the way. Subtracting 3 from 7 measures the gap between the two digits and ignores the side of zero the summit sits on.",
      marking: [
        "Gives 10 °C.",
        "Writes the signed subtraction, 3 − (−7), rather than 7 − 3.",
        "Explains that the span crosses zero and that the pupil compared sizes instead of positions.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Work out 4 − (−6).",
      answer: "10, because removing a move of six to the left from four lands at ten.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Work out (−3) × (−4), and say how many sign flips there are.",
      answer: "12, because two negative factors flip the sign twice.",
      when: "week-later",
    },
  ],

  summary: [
    "A negative number is a position to the left of zero; the sign says which side and the digits say how far.",
    "Left to right on the line is smallest to largest, so minus seven is smaller than minus two.",
    "Subtracting a negative undoes a leftward move, which is why 5 − (−3) = 8.",
    "Each negative factor flips the sign once, so two negatives give a positive product.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each journey is announced as a start, a direction and an end, so a move to the left is heard as a direction rather than as a minus sign before a number.",
    },
    {
      need: "dyslexia",
      alternative:
        "The sign and the size of each number are labelled separately in the worked examples, so a minus sign is never read as a dash between two amounts.",
    },
    {
      need: "motor",
      alternative:
        "Answers are typed as signed numbers, so ordering and subtracting negatives never require dragging markers along a line.",
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
