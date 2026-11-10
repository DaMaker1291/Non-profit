import type { AuthoredLesson } from "../../lesson-contract";

// THE FIRST LETTER IS A QUANTITY, NOT A DECORATION.
//
// A learner who reads 3x as "three and x" can still add numerical expressions
// and will fail the moment a letter is substituted, expanded or compared. This
// lesson makes the coefficient a count of an unknown, makes the letter part the
// thing that decides whether two terms are the same family, and makes the area
// model the reason an expansion multiplies every term. Substitution is the
// closing check because it can expose a simplification that has changed the
// value of the expression.
export const MATHS_ALGEBRA_EXPRESSIONS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "algebra-expressions",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: notation, collecting like terms and expanding brackets",
    level: "Key Stage 3 to GCSE Foundation",
    note:
      "Scope cited against the published GCSE mathematics subject content. No specification or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Read a term such as 5x as a coefficient multiplying an unknown, and explain the difference between 5x, 5 + x and x multiplied by x.",
      evidence:
        "For x = 4, the learner evaluates 5x as 20, distinguishes it from 5 + x = 9, and explains that x multiplied by x is x squared rather than 2x.",
    },
    {
      statement:
        "Simplify an expression by collecting terms with the same letter part, and say why unlike terms cannot be merged.",
      evidence:
        "The learner simplifies 7x + 4 − 3x + 9 to 4x + 13, groups the x terms separately from the constants, and rejects 3x + 2y = 5xy with a substitution.",
    },
    {
      statement:
        "Expand a single bracket by multiplying every term inside it, and evaluate the result for a given value as a check.",
      evidence:
        "The learner expands 3(x + 4) to 3x + 12, explains why 3x + 4 is too small, and checks both forms at x = 2 by obtaining 18 from each.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["order-ops"],
    check: [
      {
        id: "d1",
        question: "Work out 3 + 4 × 2.",
        answer:
          "11. The multiplication is one amount of eight, and the three is added to it; working left to right would wrongly give 14.",
        targets: ["order-ops"],
      },
      {
        id: "d2",
        question: "Work out (3 + 4) × 2.",
        answer:
          "14. The bracket makes seven the amount being doubled, which is a different grouping from the expression in the first check.",
        targets: ["order-ops"],
      },
    ],
  },

  introduction: {
    hook:
      "A school stores its whiteboard pens in identical boxes. Each box holds the same unknown number of pens, and there are three boxes plus four loose pens on the shelf. Writing the total as 3x + 4 is shorter than drawing every box, but it is only useful if you can still answer questions: how many pens are there if a box holds six? What happens if another teacher adds two more boxes? The expression is a compact description of a quantity, not a code to memorise.",
    why:
      "Algebra begins when a number is not known yet but still has to be counted, combined and compared. A letter is a name for that number, and the number in front of it says how many copies are being counted. The same letter can stand for different values in different problems, but within one expression it stands for one value. This lesson teaches three moves that follow from that idea: collecting terms that describe the same kind of thing, expanding a bracket that multiplies a whole quantity, and substituting a value to check that the expression still means what it did before.",
  },

  explanation: [
    {
      heading: "A letter is a number with a name, not a label to ignore",
      paragraphs: [
        "In the expression 5x, the 5 is called the coefficient and the x is the unknown. The expression means five copies of x added together, so if x is 4 the value is 20. It does not mean five followed by four, and it does not mean five plus four. The coefficient tells you how many of the unknown quantity you have; the letter tells you which quantity is being counted. That is why 5x and 5 + x are different expressions even though both contain the same two symbols.",
        "A letter can stand for a variable, a number that changes between cases, or for an unknown, a number we have not found yet. In a formula for the cost of n notebooks at £3 each, n is a variable because the number of notebooks can change. In the question 'three boxes and four loose pens make twenty-two pens', x is an unknown because there is one value to find. The algebra is the same in both cases: substitute a value and the expression becomes a number. Keeping that meaning in view prevents the common mistake of treating x as a physical object or as a shorthand for the digit 1.",
      ],
    },
    {
      heading: "Only like terms can be counted together",
      paragraphs: [
        "Terms are the parts of an expression separated by addition or subtraction. In 7x + 4 − 3x + 9 there are four terms: two x terms and two constants. The x terms are like terms because their letter part is exactly the same; the constants are also like terms, because they have no letter part at all. Collecting 7x and −3x gives 4x, and collecting 4 and 9 gives 13, so the expression simplifies to 4x + 13. The order of the terms does not change the value, but grouping the families makes the count visible.",
        "Terms with different letter parts cannot be merged by adding their coefficients. In 3x + 2y, x and y are different unknowns, so the expression describes three of one thing and two of another; it stays as 3x + 2y. Writing 5xy invents a product that was never in the question, and the error is easy to expose by substitution: with x = y = 2 the original expression is 10, while 5xy is 20. The same rule separates x and x squared. One x is a length, x squared is an area, and 3x + 2x squared cannot become 5x squared or 5x cubed because the letter parts name different-sized quantities.",
      ],
    },
    {
      heading: "Expanding multiplies a whole bracket, not only its first term",
      paragraphs: [
        "A bracket groups terms into one quantity. In 3(x + 4), the whole amount x + 4 is being tripled, so both the x and the 4 must be tripled: 3x + 12. The area model makes the reason visible. Draw a rectangle three units high, split its width into a part labelled x and a part labelled 4. The large cell has area 3x, the narrow cell has area 12, and the total area is the sum of the two cells. Expanding is simply writing the two cell areas separately instead of naming the whole rectangle at once.",
        "The same rule applies when a bracket contains subtraction or when the factor is negative. In 4(2x − 3), the 4 multiplies both 2x and −3, giving 8x − 12. In −2(x + 5), the negative sign belongs to the factor, so both products change sign: −2x − 10. A useful check is to substitute a number after expanding. At x = 1, 4(2x − 3) is 4 × (−1) = −4, and 8x − 12 is 8 − 12 = −4; if the two values disagree, a term was missed or a sign was lost.",
      ],
    },
    {
      heading: "Substitution is the check that the expression still means the same thing",
      paragraphs: [
        "Substitution means replacing every copy of the letter with a number and evaluating the result. It is the most direct test of a simplification because the original and the simplified expression must give the same value for every allowed number. Take 7x + 4 − 3x + 9 and its simplification 4x + 13. At x = 2 the original is 14 + 4 − 6 + 9 = 21, and the simplified expression is 8 + 13 = 21. If a learner had written 4x + 9, the value would be 17, and the check would locate the missing constant immediately.",
        "Substitution also turns an expression into a tool for a situation. If a rectangle's width is x centimetres and its length is twice the width plus five centimetres, the perimeter is 2x + 2(2x + 5), which simplifies to 6x + 10. At x = 8 the perimeter is 58 centimetres. The algebra has not changed the rectangle; it has made the relationship short enough to evaluate, compare and use in a second problem. The final substitution is not an optional extra: it is how the expression is connected back to the quantity it describes.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A coefficient counts copies of one unknown. Three boxes and four loose counters are three copies of x plus four, not the digits three and four placed side by side.",
      notation: "3x + 4",
      caption:
        "The 3 tells you there are three boxes; the x names what is in a box. The 4 counts loose counters, so it is a separate family and cannot be merged with the boxes.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "A rectangle three units high with widths x and 4 splits into two cells. The cell areas are 3x and 12, so the whole area is their sum.",
      notation: "3(x + 4) = 3 × x + 3 × 4 = 3x + 12",
      caption:
        "The area model explains why every term inside the bracket is multiplied. The 12 is not an optional extra; it is the area of the second cell.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Collecting like terms is grouping by the letter part first. The x terms and the constants are counted in separate families, then written together.",
      notation: "7x + 4 − 3x + 9 = (7x − 3x) + (4 + 9) = 4x + 13",
      caption:
        "The x terms combine to four copies of x, while the constants combine to thirteen. The two results stay separate because they describe different kinds of quantity.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Simplify 7x + 4 − 3x + 9.",
      steps: [
        {
          move: "Group the x terms together and the constants together: 7x − 3x and 4 + 9.",
          why:
            "Only terms with the same letter part can be counted together. Separating the families before calculating makes it harder to merge an x term with a constant by mistake.",
        },
        {
          move: "Subtract the x coefficients: 7 − 3 = 4, so the x terms make 4x.",
          why:
            "The coefficients count copies of the same unknown, so their counts subtract while the letter part stays x.",
        },
        {
          move: "Add the constants: 4 + 9 = 13, and write the simplified expression as 4x + 13.",
          why:
            "The constants are a separate family, so thirteen remains a constant. The answer contains both the 4 from the x terms and the 13 from the constants.",
        },
      ],
      answer: "4x + 13",
    },
    {
      id: "w2",
      prompt: "Expand and simplify 3(2x − 5) + 4x.",
      steps: [
        {
          move: "Multiply both terms inside the bracket by 3: 3 × 2x = 6x and 3 × (−5) = −15.",
          why:
            "The bracket is one quantity being tripled, so every term inside it is tripled; multiplying only the 2x would leave the −5 at its original size.",
        },
        {
          move: "Write the expansion as 6x − 15 + 4x, then collect the x terms.",
          why:
            "The 6x and the 4x are like terms, while the −15 is a constant. Collecting the like terms gives 6x + 4x = 10x.",
        },
        {
          move: "The simplified expression is 10x − 15; check it at x = 2: the original gives 3(−1) + 8 = 5, and the answer gives 20 − 15 = 5.",
          why:
            "The substitution produces the same value from both forms, which confirms that the expansion and the collection preserved the expression. The answer contains the 10 from the x terms and the 15 from the constant.",
        },
      ],
      answer: "10x − 15",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "3x + 2y simplifies to 5xy because the coefficients add and the letters join together.",
      whyItFails:
        "Adding counts how many copies of each kind you have. The x and y are different kinds, so their counts cannot be merged, and joining the letters turns a sum into a product that was never there. At x = y = 2 the original expression is 10, while 5xy is 20.",
      correction:
        "Keep terms with different letter parts separate. Write 3x + 2y as it stands, and substitute a value into both the original and any proposed simplification to show that the values differ.",
      contrast: {
        wrong: "3x + 2y = 5xy",
        right: "3x + 2y stays 3x + 2y, because x and y are unlike terms",
      },
    },
    {
      id: "m2",
      belief: "3(x + 4) expands to 3x + 4 because the 3 multiplies the x but leaves the 4 alone.",
      whyItFails:
        "The bracket groups x + 4 as one quantity, and the 3 multiplies that whole quantity. The 4 is a part of the grouped amount, so it must be multiplied too. At x = 2 the true value is 18, while 3x + 4 is 10.",
      correction:
        "Draw the two cells of the area model or write the multiplication over both terms: 3 × x plus 3 × 4. Then substitute a value into the bracket and into the expansion; a mismatch means a term was missed.",
      contrast: {
        wrong: "3(x + 4) = 3x + 4",
        right: "3(x + 4) = 3x + 12",
      },
    },
    {
      id: "m3",
      belief: "x multiplied by x is 2x, because the two x terms add their coefficients.",
      whyItFails:
        "Multiplication and addition are different operations. Two copies of x added together make 2x; two copies multiplied together make x squared, because the letter is used as a factor twice. At x = 3, 2x is 6 while x squared is 9.",
      correction:
        "Ask whether the expression is counting copies or multiplying factors. Use the area model for a product: a square of side x has area x squared, not twice x. Keep the coefficient and the power separate in your written working.",
      contrast: {
        wrong: "x × x = 2x",
        right: "x × x = x squared, while x + x = 2x",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Simplify 5x + 8 − 2x + 3.",
      hint:
        "Separate the x terms from the constants before doing any arithmetic. Only terms in the same family can be combined.",
      answer:
        "The x terms make 5x − 2x = 3x, and the constants make 8 + 3 = 11, so the expression is 3x + 11.",
      feedback: {
        correct:
          "You collected each family separately and kept the x term and the constant from merging.",
        incorrect:
          "Group 5x and −2x together, then group 8 and 3 together. The two results stay separate: 3x + 11, not 14x.",
      },
    },
    {
      id: "p2",
      prompt: "Expand 2(3x + 4).",
      hint:
        "The 2 multiplies the whole bracket, so it must reach both the 3x and the 4.",
      answer:
        "2 × 3x = 6x and 2 × 4 = 8, so the expansion is 6x + 8. Check at x = 1: 2(7) = 14 and 6 + 8 = 14.",
      feedback: {
        correct:
          "Both terms inside the bracket were multiplied, and the substitution check gives the same value from both forms.",
        incorrect:
          "Multiply the 4 as well as the 3x. The bracket is one quantity being doubled, so 2(3x + 4) is 6x + 8, not 6x + 4.",
      },
    },
    {
      id: "p3",
      prompt: "Evaluate 4x − 3 when x = −2.",
      hint:
        "Put the negative value in brackets before multiplying, so the sign travels with the number. Multiplication is completed before the subtraction.",
      answer:
        "4 × (−2) − 3 = −8 − 3 = −11. The negative value makes the first term negative, and subtracting three more takes the result to −11.",
      feedback: {
        correct:
          "You substituted the negative value with its sign and completed the multiplication before subtracting.",
        incorrect:
          "Write 4 × (−2) first, which is −8, then subtract 3: −8 − 3 = −11. Writing 4 × −2 without brackets is how the sign gets lost.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why 3x + 2y cannot be simplified to 5xy, and why 3(x + 4) expands to 3x + 12 rather than 3x + 4. Use a substitution in at least one of your explanations.",
      modelAnswer:
        "The terms 3x and 2y have different letter parts, so they describe different kinds of quantity and their counts cannot be added. Writing 5xy turns their sum into a product; at x = y = 2 the original is 10 while 5xy is 20, so the proposed simplification has changed the value. In 3(x + 4), the bracket groups x + 4 as one quantity and the 3 multiplies the whole group, so both terms are tripled: 3x + 12. At x = 2 the bracket gives 18, and 3x + 12 also gives 18, while 3x + 4 gives only 10. The area model shows the same thing: the 12 is the area of the second cell, not an optional extra.",
      marking: [
        "States that x and y are unlike terms, so their coefficients cannot be added.",
        "Explains that 5xy is a product rather than a sum, and supports the distinction with a substitution.",
        "Explains that the factor multiplies the whole bracket, not only its first term.",
        "Expands correctly to 3x + 12 and uses a substitution or area model to confirm the value.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Simplify 8x + 5 − 3x + 2.",
      modelAnswer: "5x + 7",
      marking: [
        "Collects the x terms: 8x − 3x = 5x.",
        "Collects the constants: 5 + 2 = 7, and keeps the two families separate.",
      ],
      check: { accepted: ["5x + 7", "5x+7"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Expand 4(2x − 3).",
      modelAnswer: "8x − 12",
      marking: [
        "Multiplies 4 by 2x to obtain 8x.",
        "Multiplies 4 by −3 to obtain −12, keeping the negative sign.",
      ],
      check: { accepted: ["8x - 12", "8x−12", "8x-12"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A rectangle has width x centimetres and length 2x + 5 centimetres. Write and simplify an expression for its perimeter, then work out the perimeter when x = 8.",
      whyItTransfers:
        "The lesson simplifies expressions and expands a single bracket in a worked example. Here the learner must choose the perimeter structure, form two copies of each dimension, expand the bracket, collect the resulting terms and then evaluate the simplified expression in the original situation. The algebra is familiar; the quantity and the order of the steps are not given.",
      answer:
        "The perimeter is 2x + 2(2x + 5). Expanding gives 2x + 4x + 10, which simplifies to 6x + 10. When x = 8, the perimeter is 6 × 8 + 10 = 48 + 10 = 58 centimetres. A check from the dimensions gives width 8 cm and length 21 cm, so 2(8 + 21) = 58 cm.",
      marking: [
        "Forms the perimeter as twice the width plus twice the length, rather than adding only one of each.",
        "Expands 2(2x + 5) to 4x + 10 and collects the x terms to obtain 6x + 10.",
        "Substitutes x = 8 into the simplified expression and obtains 58.",
        "States the unit as centimetres and checks the result from the actual dimensions.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Simplify 4x + 3x − 2.",
      answer:
        "The x terms combine to 7x, while the constant stays separate, so the expression is 7x − 2.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Expand 5(x − 2).",
      answer:
        "The 5 multiplies both terms inside the bracket: 5x − 10. At x = 3 the bracket is 5 and the expansion is 15 − 10 = 5.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why is 3x + 2x squared not equal to 5x squared?",
      answer:
        "The letter parts are different: x and x squared are different-sized quantities, so their coefficients cannot be added. At x = 2 the original is 6 + 8 = 14, while 5x squared is 20.",
      when: "month-later",
    },
  ],

  summary: [
    "A coefficient counts copies of an unknown: 3x means three copies of x, not three plus x.",
    "Only terms with exactly the same letter part can be collected; 3x + 2y and 3x + 2x squared stay separate.",
    "Expanding multiplies every term inside the bracket, so 3(x + 4) = 3x + 12.",
    "Substitute a value into the original and the simplified form; the values must agree.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every expression is read as a sentence as well as symbols: 3x is described as three copies of x, and each worked step names the operation before the result.",
    },
    {
      need: "low-vision",
      alternative:
        "The area model is described in words, and expressions are placed in large, high-contrast blocks with no meaning carried by colour or a small superscript alone.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson separates the family being collected from the arithmetic result on its own line, so a reader does not have to track two kinds of term through a dense paragraph.",
    },
    {
      need: "motor",
      alternative:
        "All practice is typed or selected, and no drag-and-drop movement of terms is required.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note:
        "The explanations, examples, practice and assessment are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for algebra.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-09",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
