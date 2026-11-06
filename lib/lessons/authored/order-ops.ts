import type { AuthoredLesson } from "../../lesson-contract";

// Batch 6 — order of operations, the convention every later expression stands on.
//
// `algebra-expressions` and `indices-intro` both declare this concept as a
// prerequisite, and both fail for the same reason when it is missing: a learner
// who reads an expression left to right will evaluate 2x + 3 at x = 4 as 20, and
// will read a power as if it were a multiplication written carelessly.
//
// The lesson does not present the order as a rule to memorise. It shows why the
// convention exists (an expression has to mean one thing), why multiplication
// binds tighter (it is already a grouped amount), and that brackets are a tool a
// learner can ADD to say which amount they mean — which is the step that turns
// the rule into reasoning, and the step exam questions actually test.
export const MATHS_ORDER_OPS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "order-ops",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: order of operations, brackets and powers",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Evaluate an expression with several operations, explaining why the multiplication is carried out before the addition.",
      evidence:
        "The learner works out 2 + 3 × 4 as 14 and says that the product is one amount of twelve to which the two is added, rather than reading the three as a separate number to add.",
    },
    {
      statement:
        "Apply the rank order including brackets, and treat multiplication and division as equal rank evaluated from left to right.",
      evidence:
        "The learner evaluates 12 ÷ 3 × 2 as 8, not 2, and says that the division runs first because it stands to the left at the same rank.",
    },
    {
      statement: "Insert brackets into an expression so that it takes a required value.",
      evidence:
        "The learner brackets 3 + 4 × 5 as (3 + 4) × 5 to make 35, and can say why the unbracketed form gives 23 instead.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["place-value", "multiplication"],
    check: [
      {
        id: "o1",
        question: "What is 3 × 4, and how many groups of three is it?",
        answer: "Twelve, made of four groups of three.",
        targets: ["multiplication"],
      },
      {
        id: "o2",
        question: "In 156, what is the 5 worth?",
        answer: "Fifty, because it sits in the tens column.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "Two people read the same three numbers and get different answers: one says two plus three times four is twenty, the other says it is fourteen. Neither has made an arithmetic slip. They disagree about which operation happens first, and a written expression has no tone of voice to settle it.",
    why:
      "So the order of operations is a convention, published and shared, and it exists to make an expression mean exactly one thing. The convention is not arbitrary: multiplication is kept as a single amount because that is what it already describes, and brackets are the way a problem says which amount it means. Learn the reasons and the rule stops needing to be memorised.",
  },

  explanation: [
    {
      heading: "A convention, because an expression must mean one thing",
      paragraphs: [
        "An expression with more than one operation has to mean the same thing to everybody, so the order in which the operations are carried out is an agreed convention rather than a personal preference. Without it, two people could read two plus three times four and honestly disagree: one gets twenty by working left to right, the other gets fourteen by multiplying first. An agreed order removes that ambiguity, and every calculator and spreadsheet obeys the same one.",
        "The reason multiplication binds more tightly is not arbitrary. Three times four is a single amount — twelve, made of four groups of three — and the two in front of it is added to that amount once. Reading left to right treats the three as something to add rather than as part of a group, which is why it overcounts. The convention protects the grouping the multiplication already expresses.",
      ],
    },
    {
      heading: "Brackets first, then powers, then multiplying and dividing",
      paragraphs: [
        "The order is brackets, then powers, then multiplication and division, then addition and subtraction. Work inside the innermost brackets first, because a bracket exists to say that this part is one amount. Powers come next, since a power is a multiplication of equal factors written compactly. Multiplication and division then share the same rank, and addition and subtraction share the rank below them; where two operations share a rank, work from left to right.",
        "Sharing a rank matters more than it looks. Twelve divided by three times two is eight, not two, because the division runs first and the multiplication second: the two is not underneath the division sign. Subtraction behaves the same way — ten minus three minus two is five, since the first subtraction leaves seven and the second takes two from it. Read the expression as a sequence of steps at each rank rather than as a list of symbols.",
      ],
    },
    {
      heading: "Brackets are a tool you can add, not only a rule you obey",
      paragraphs: [
        "Brackets do not merely have to be respected; they can be written. The numbers two, three and four give fourteen when the multiplication runs first and twenty when the addition is bracketed, so the same numbers carry different values depending on the grouping. Writing a bracket is how a problem states which quantity it means, and substituting the numbers back after bracketing is how a learner confirms the value was not changed by accident.",
        "That makes brackets a tool for solving rather than a rule to survive. Given a target value, a learner can ask which grouping produces it: if three plus four times five must equal thirty-five, the addition has to be bracketed, because only the bracketed form adds first. Working backwards from the target is exactly the reasoning used when a question asks where a bracket belongs, and it is the step most often skipped.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "Two plus three times four, unbracketed: the multiplication is one amount of twelve.",
      notation: "2 + 3 × 4 = 14",
      caption:
        "The product is a single quantity, so the two is added once to twelve rather than to the three.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body: "The same three numbers with the addition bracketed: five is now the single amount.",
      notation: "(2 + 3) × 4 = 20",
      caption:
        "The bracket changes which quantity is a group, and the value changes with it. Neither form is wrong; they answer different questions.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body: "Equal rank, read left to right: divide first, then multiply what is left.",
      notation: "12 ÷ 3 × 2 = 8",
      caption:
        "Four is produced by the division, and the two multiplies that four. Reading the two as part of the divisor would give two instead.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 2 + 3 × 4.",
      steps: [
        {
          move: "Find the multiplication first: 3 × 4 = 12, because it is one grouped amount.",
          why:
            "Multiplication binds tighter than addition, so the product is a single quantity rather than two numbers to be handled in turn.",
        },
        {
          move: "Add the 2 to that amount: 2 + 12 = 14.",
          why:
            "Only one addition remains, and it applies to the whole product rather than to the three on its own.",
        },
        {
          move: "Compare the other reading: (2 + 3) × 4 = 20, which is why a bracket has to be written when that value is meant. Unbracketed, the value is 14.",
          why:
            "Seeing both values shows that a bracket is a claim about grouping, not decoration added for tidiness.",
        },
      ],
      answer: "14",
    },
    {
      id: "w2",
      prompt: "Work out 36 ÷ (2 + 4) × 3.",
      steps: [
        {
          move: "Evaluate the bracket first: 2 + 4 = 6.",
          why:
            "The bracket states that the sum is a single amount, and it is that amount which gets divided.",
        },
        {
          move: "Divide: 36 ÷ 6 = 6.",
          why:
            "Division and multiplication share a rank, so the division standing on the left runs before the multiplication on the right.",
        },
        {
          move: "Multiply the result by 3: 6 × 3 = 18, and check by reversing: 18 ÷ 3 × 6 = 36.",
          why:
            "The reverse returns the starting number, which confirms both the rank order and the bracket together.",
        },
      ],
      answer: "18",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Work left to right through any expression, so 2 + 3 × 4 = 20.",
      whyItFails:
        "Left to right is only the tie-break between operations of the same rank. Multiplication outranks addition because the product is already a grouped amount of twelve, and the two is added to that amount once. Applying the tie-break too early adds the two to the three, which is a different expression from the one written.",
      correction:
        "Scan the expression for the highest rank present before doing anything: brackets, then powers, then multiplication and division. Only use left to right when two operations share that rank.",
      contrast: {
        wrong: "2 + 3 × 4 = 20, adding first because the two is on the left",
        right: "2 + 3 × 4 = 14, because 3 × 4 is one amount of twelve",
      },
    },
    {
      id: "m2",
      belief: "Division outranks multiplication, so 12 ÷ 3 × 2 = 2.",
      whyItFails:
        "Division and multiplication have the same rank; neither is stronger. Twelve divided by three is four, and multiplying that four by two gives eight. Reading the two as part of the divisor turns the expression into twelve divided by six, which is a different question with a different answer.",
      correction:
        "Treat multiplication and division as one rank and work along the expression from left to right within it. A division sign applies only to the number immediately after it, never to a following multiplication.",
      contrast: {
        wrong: "12 ÷ 3 × 2 = 2, multiplying the divisor by two first",
        right: "12 ÷ 3 × 2 = 8, dividing first because the division is on the left",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Work out 5 + 2 × 6.",
      hint: "Find the highest rank in the expression before doing any arithmetic.",
      answer: "17, because 2 × 6 is twelve and five more makes seventeen",
      feedback: {
        correct: "The multiplication was treated as one amount and added once.",
        incorrect:
          "Two times six is twelve, and the five is added to that twelve rather than to the two.",
      },
    },
    {
      id: "p2",
      prompt: "Work out (8 − 3) × 4.",
      hint: "The bracket says which part is a single amount.",
      answer: "20, because the bracket makes five and five times four is twenty",
      feedback: {
        correct: "The bracket was evaluated first, so the multiplication applied to the whole difference.",
        incorrect:
          "Eight minus three is five, and the bracket makes that difference the amount being multiplied.",
      },
    },
    {
      id: "p3",
      prompt: "Insert brackets so that 3 + 4 × 5 equals 35.",
      hint: "Work backwards from the target: which amount must be multiplied by five?",
      answer: "(3 + 4) × 5 = 35",
      feedback: {
        correct: "The bracket made the sum the amount multiplied, which is what the target required.",
        incorrect:
          "For the answer to be thirty-five, seven must be multiplied by five, so the addition has to be bracketed.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 4 + 6 ÷ 2.",
      modelAnswer: "7",
      marking: [
        "Carries out the division before the addition, because division outranks addition.",
        "Gives the result as 7.",
      ],
      check: { accepted: ["7"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner writes 3 + 4 × 5 = 35 and says they added first because the addition comes first in the expression. Explain what is wrong, give the correct value, and say what would have to change for 35 to be right.",
      modelAnswer:
        "Addition does not outrank multiplication; the position of a symbol in the expression does not decide its rank. Four times five is a single amount of twenty, and adding three gives 23. For the value to be 35, seven would have to be multiplied by five, which requires the addition to be bracketed: (3 + 4) × 5 = 35. The learner has used left-to-right order where it does not apply.",
      marking: [
        "States that multiplication outranks addition regardless of position.",
        "Gives the correct value, 23.",
        "Writes the bracketed form (3 + 4) × 5 and explains that it changes which amount is multiplied.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A taxi charges a fixed £3 plus £2 for each kilometre travelled. A pupil works out the fare for seven kilometres as (3 + 2) × 7 = 35 and says the bracket makes no difference. Give the correct fare and explain which quantity the bracket has changed.",
      whyItTransfers:
        "The learner has to read a written rule, decide which quantity is fixed and which is per kilometre, and express that decision in the order of operations. No calculation on the page shows whether that reading was made.",
      answer:
        "The fare is £17, because 3 + 2 × 7 multiplies the two by seven kilometres and then adds the fixed three. The bracket turns five into a per-kilometre rate, charging the fixed amount seven times; the fixed £3 is charged once, so it must stay outside the multiplication.",
      marking: [
        "Gives £17.",
        "Explains that only the £2 is multiplied by the seven kilometres.",
        "Names what the bracket changed: it made the fixed charge part of the rate.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Work out 24 ÷ 4 + 2.",
      answer: "8, because the division gives six and two more makes eight.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Work out 2 × (7 − 3) + 5.",
      answer: "13, because the bracket gives four, twice four is eight, and five more is thirteen.",
      when: "week-later",
    },
  ],

  summary: [
    "An expression has one agreed reading, so everyone who evaluates it gets the same value.",
    "Brackets come first, then powers, then multiplication and division, then addition and subtraction.",
    "Multiplication and division share a rank, and so do addition and subtraction: within a rank, work left to right.",
    "Brackets can be added to say which amount you mean, and working back from a target value shows where they belong.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each step is announced with the operation named and the amount it produced, so a rank is heard as a decision rather than as a symbol order.",
    },
    {
      need: "dyslexia",
      alternative:
        "Brackets are described in words beside the expression, and each worked example states which amount is being handled before the arithmetic appears.",
    },
    {
      need: "motor",
      alternative:
        "Answers are typed one value at a time, so an expression is evaluated step by step instead of in a single box that requires the whole chain.",
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
