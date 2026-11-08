import type { AuthoredLesson } from "../../lesson-contract";

// THE EQUALS SIGN IS THE IDEA, NOT THE DECORATION. A learner who treats solving
// as "move it across and change the sign" can get the right answer for a while
// and then fail on brackets, division or unknowns on both sides. This lesson
// grounds every move in the balance and makes the substitution check the final,
// non-optional step.
export const MATHS_LINEAR_EQUATIONS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "linear-equations",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: solving linear equations",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published GCSE mathematics subject content. No specification or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Solve a two-step linear equation by undoing operations in reverse order, and explain why each operation is applied to both sides.",
      evidence:
        "For 4x − 7 = 17, the learner adds 7 to both sides and then divides both sides by 4, obtaining x = 6 and checking it by substitution.",
    },
    {
      statement:
        "Solve an equation with unknowns on both sides by collecting the unknown terms on one side and the numbers on the other.",
      evidence:
        "For 5x + 3 = 2x + 18, the learner subtracts 2x and then 3, obtains 3x = 15, and explains why the equation is still balanced.",
    },
    {
      statement:
        "Form a linear equation from a situation, solve it, and interpret the solution in the original context.",
      evidence:
        "For a phone contract with a fixed charge and a rate per minute, the learner forms an equation, solves it, and states the number of minutes with units.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["algebra-expressions"],
    check: [
      {
        id: "d1",
        question: "Simplify 3x + 2x − 4.",
        answer:
          "5x − 4. The like terms 3x and 2x combine to 5x, while the constant −4 cannot combine with an x term.",
        targets: ["algebra-expressions"],
      },
      {
        id: "d2",
        question: "Expand 3(x + 2).",
        answer:
          "3x + 6. The 3 multiplies both terms inside the bracket, not only the x.",
        targets: ["algebra-expressions"],
      },
    ],
  },

  introduction: {
    hook:
      "A shop sells identical notebooks and a £5 pen. Maya buys three notebooks and the pen, and pays £20. How much is one notebook? You could try prices until the total works, but algebra gives a direct route: let the notebook cost x, write 3x + 5 = 20, and undo the two operations that built the left-hand side. Subtract the 5, divide by 3, and the notebook costs £5. The same two moves solve every equation of this shape.",
    why:
      "An equation is a claim that two expressions have the same value. The equals sign is a balance: if you change one side without changing the other, the claim is no longer the one you started with. Solving means performing the same operation on both sides until the unknown is alone. The operations are undone in reverse order because the expression was built in a certain order: x was multiplied by 3, then 5 was added, so the addition is undone first. This lesson also covers unknowns on both sides, brackets, and the substitution check that catches a mistake before it becomes an answer.",
  },

  explanation: [
    {
      heading: "An equation is a balance, and every move must preserve it",
      paragraphs: [
        "The expression 3x + 5 is built from x by multiplying by 3 and then adding 5. The equation 3x + 5 = 20 says that the result of those operations is 20. To find x, we reverse the construction: remove the 5 that was added, then undo the multiplication by 3. Each move is an operation on a whole side, not a symbol crossing the equals sign. Subtracting 5 from the left alone would change the value of that side and destroy the equality.",
        "This is why the same operation is applied to both sides. Adding 7 to both sides of 4x − 7 = 17 gives 4x = 24, and the two sides are still equal because the same amount was added to each. Dividing both sides by 4 gives x = 6. The logic is not a set of rules imposed on algebra; it is the behaviour of a balance, and it remains true whether the operation is addition, subtraction, multiplication or division by a non-zero number.",
      ],
    },
    {
      heading: "Undo the operations in reverse order",
      paragraphs: [
        "Order matters. In 2x + 9 = 21, x was multiplied by 2 and then 9 was added. The last operation performed was the addition, so it is the first one undone: subtract 9 from both sides to get 2x = 12, then divide by 2 to get x = 6. If you divide by 2 first, you get x + 4.5 = 10.5, which is still true but has not isolated x; you then have to subtract 4.5, and the arithmetic is harder.",
        "The same principle handles subtraction and negative coefficients. In 5 − 2x = 11, the x term is subtracted, so adding 2x to both sides is often the clearest first move: 5 = 11 + 2x. Subtract 11, divide by 2, and x = −3. There is more than one valid route, but every route must keep the equality and must end with the unknown alone. A route that produces a true statement about x is finished; a route that produces a number with x still in it is not.",
      ],
    },
    {
      heading: "Unknowns on both sides: collect the unknown terms first",
      paragraphs: [
        "When x appears on both sides, the aim is to gather the unknown terms on one side and the numbers on the other. For 5x + 3 = 2x + 18, subtract 2x from both sides: 3x + 3 = 18. Then subtract 3: 3x = 15. Divide by 3: x = 5. The choice to subtract 2x rather than 5x is a judgement: subtracting the smaller coefficient leaves a positive x term, which is usually easier to work with, but either choice is valid if the arithmetic is correct.",
        "Brackets add a step, but not a new principle. In 3(x + 2) = 15, you can expand first to get 3x + 6 = 15 and then solve, or divide both sides by 3 first to get x + 2 = 5. Both routes are correct. Expanding is safer when the bracket is more complicated or when there are brackets on both sides; dividing first is quicker when the bracket is multiplied by a factor that divides the other side exactly. The choice should be made by looking at the numbers, not by applying one routine to every equation.",
      ],
    },
    {
      heading: "Substitute back: the check is part of the solution",
      paragraphs: [
        "A solution is a value that makes the original equation true. After finding x = 5 for 3x + 5 = 20, substitute 5 into the original left-hand side: 3 × 5 + 5 = 15 + 5 = 20, which matches the right-hand side. The check takes seconds and catches sign errors, arithmetic slips and mistakes made when collecting terms. It is especially important when the equation came from a word problem, because the algebra may be correct while the equation itself misrepresents the situation.",
        "Substitution also shows why 'moving across and changing the sign' is incomplete advice. It happens to work for a term that is added or subtracted, because subtracting a term from both sides is equivalent to moving it across with the opposite sign. It does not describe what happens when the unknown is multiplied or divided, and it gives no reason for the operation. If you can name the operation and say why it is applied to both sides, you can solve equations that the shortcut was never designed for.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Start with three bags and five weights balancing twenty weights. Take five weights from each pan, then share the remaining fifteen weights equally among the three bags.",
      notation: "3x + 5 = 20  →  3x = 15  →  x = 5",
      caption:
        "Each arrow is an operation applied to both sides. The balance is preserved at every step, so the final equation describes the same value of x as the first.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "With unknowns on both sides, subtract the smaller x term first. The unknown terms are then on one side and the constants on the other.",
      notation: "5x + 3 = 2x + 18  →  3x + 3 = 18  →  3x = 15  →  x = 5",
      caption:
        "Subtracting 2x from both sides removes the x term from the right without changing the equality. The remaining equation is a two-step equation.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A bracket can be expanded or divided away. Both routes reach the same value because both apply a valid operation to the whole equation.",
      notation: "3(x + 2) = 15  →  3x + 6 = 15  →  x = 3   ·   or   x + 2 = 5  →  x = 3",
      caption:
        "The two routes look different but use the same balance. Choosing the shorter route is a judgement about the numbers, not a different rule.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Solve 4x − 7 = 17.",
      steps: [
        {
          move: "Add 7 to both sides: 4x = 24.",
          why:
            "The expression was built by multiplying by 4 and then subtracting 7. Addition undoes the subtraction, and doing it to both sides preserves the balance.",
        },
        {
          move: "Divide both sides by 4: x = 6.",
          why:
            "Dividing by 4 undoes the multiplication by 4. The unknown is now alone, so the value is 6.",
        },
        {
          move: "Check by substitution: 4 × 6 − 7 = 24 − 7 = 17.",
          why:
            "The original right-hand side is 17, so the value satisfies the original equation. A check that reproduces the other side confirms the solution rather than merely repeating the working.",
        },
      ],
      answer: "x = 6",
    },
    {
      id: "w2",
      prompt: "Solve 5x + 3 = 2x + 18.",
      steps: [
        {
          move: "Subtract 2x from both sides: 3x + 3 = 18.",
          why:
            "Collecting the unknown terms on one side turns the equation into the two-step form already solved. Subtracting 2x from both sides is a valid operation on the whole of each side.",
        },
        {
          move: "Subtract 3 from both sides: 3x = 15.",
          why:
            "The constant 3 is now the only operation left on the x term, so subtraction isolates 3x.",
        },
        {
          move: "Divide both sides by 3: x = 5.",
          why:
            "Dividing by the coefficient leaves x alone. The solution is 5.",
        },
        {
          move: "Check: 5 × 5 + 3 = 28 and 2 × 5 + 18 = 28.",
          why:
            "Both sides of the original equation give 28, so x = 5 satisfies the equation and the working is consistent.",
        },
      ],
      answer: "x = 5",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "You can subtract a number from one side of an equation as long as you do the same thing later.",
      whyItFails:
        "The equals sign asserts that the two sides have the same value at every step. Changing one side alone makes that assertion false, so the equation you solve afterwards is a different equation. The answer may look tidy, but it does not satisfy the original.",
      correction:
        "Perform each operation on the whole of both sides, and record it on both sides in your working. The substitution check will expose a one-sided operation immediately.",
      contrast: {
        wrong: "3x + 5 = 20, so 3x = 20 and x = 20/3",
        right: "3x + 5 = 20, so 3x = 15 and x = 5",
      },
    },
    {
      id: "m2",
      belief: "When a term moves across the equals sign, it always changes sign; that is the rule for solving.",
      whyItFails:
        "Changing sides is not an operation. The rule is that the same operation is applied to both sides. For an added term, subtracting it from both sides happens to look like moving it across with the opposite sign, which is why the shortcut survives. It does not explain division, multiplication or brackets, and it gives no reason to check.",
      correction:
        "Name the inverse operation and apply it to both sides. 'Subtract 5 from both sides' is a reason; 'move the 5 across' is a description of the result.",
      contrast: {
        wrong: "move the 2x across and change its sign, so 5x + 2x = 18 + 3",
        right: "subtract 2x from both sides, so 3x + 3 = 18",
      },
    },
    {
      id: "m3",
      belief: "3(x + 2) means 3x + 2, because the 3 only multiplies the x.",
      whyItFails:
        "The bracket groups x + 2 as a single quantity, and the 3 multiplies that whole quantity. Expanding gives 3x + 6. Missing the 6 changes the equation and produces an answer that fails the check.",
      correction:
        "Multiply every term inside the bracket by the factor outside it. A quick numerical test with x = 1 shows the difference: 3(1 + 2) = 9, while 3 × 1 + 2 = 5.",
      contrast: {
        wrong: "3(x + 2) = 3x + 2",
        right: "3(x + 2) = 3x + 6",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Solve 2x + 9 = 21.",
      hint:
        "The 9 was added last, so undo it first. Subtract 9 from both sides, then divide by 2.",
      answer: "2x = 12, so x = 6. Check: 2 × 6 + 9 = 21.",
      feedback: {
        correct:
          "You undid the addition before the multiplication and checked the value in the original equation.",
        incorrect:
          "Subtract 9 from both sides first. Dividing before removing the 9 leaves a fraction and does not isolate x.",
      },
    },
    {
      id: "p2",
      prompt: "Solve 7x − 4 = 3x + 12.",
      hint:
        "Subtract 3x from both sides to gather the x terms, then deal with the constant.",
      answer:
        "Subtract 3x: 4x − 4 = 12. Add 4: 4x = 16. Divide by 4: x = 4. Check: 7 × 4 − 4 = 24 and 3 × 4 + 12 = 24.",
      feedback: {
        correct:
          "You collected the unknown terms first and kept the equation balanced through both operations.",
        incorrect:
          "Subtract 3x from both sides first, giving 4x − 4 = 12. Then add 4 and divide by 4.",
      },
    },
    {
      id: "p3",
      prompt: "Solve 2(x + 3) = 14.",
      hint:
        "You can divide both sides by 2 first, or expand the bracket. Choose one route and check the result.",
      answer:
        "Dividing by 2 gives x + 3 = 7, so x = 4. Alternatively, expanding gives 2x + 6 = 14, then 2x = 8 and x = 4. Check: 2(4 + 3) = 14.",
      feedback: {
        correct:
          "You used a valid route and checked the value inside the original bracket.",
        incorrect:
          "If you expand, multiply both terms by 2: 2x + 6, not 2x + 3. Dividing both sides by 2 first avoids that slip.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why solving 3x + 5 = 20 requires subtracting 5 from both sides before dividing by 3, and why the answer must be checked by substitution.",
      modelAnswer:
        "The expression 3x + 5 was built by multiplying x by 3 and then adding 5. To undo the construction, the last operation is reversed first: subtract 5 from both sides to get 3x = 15, then divide both sides by 3 to get x = 5. Subtracting only from the left would break the equality, so the same operation must be applied to both sides. Substituting x = 5 into the original equation gives 3 × 5 + 5 = 20, which confirms that the value satisfies the equation rather than merely fitting the rearranged one.",
      marking: [
        "Explains that the operations are undone in reverse order because of the order in which the expression was built.",
        "States that the same operation is applied to both sides to preserve the equality.",
        "Obtains x = 5 and shows the intermediate equation 3x = 15.",
        "Checks by substituting into the original equation and shows both sides equal 20.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Solve 6x − 5 = 25.",
      modelAnswer: "x = 5",
      marking: [
        "Adds 5 to both sides to obtain 6x = 30.",
        "Divides both sides by 6 to obtain x = 5.",
      ],
      check: { accepted: ["x = 5", "x=5", "5"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Solve 4x + 7 = 2x + 19.",
      modelAnswer: "x = 6",
      marking: [
        "Subtracts 2x from both sides to obtain 2x + 7 = 19.",
        "Subtracts 7 and divides by 2 to obtain x = 6.",
      ],
      check: { accepted: ["x = 6", "x=6", "6"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A phone contract costs £25 per month plus £0.10 per minute of calls. A second contract costs £40 per month plus £0.05 per minute. After how many minutes do the two contracts cost the same, and what is that cost?",
      whyItTransfers:
        "The lesson solves equations with numerical coefficients. Here the learner must form both expressions from a tariff, set them equal, solve the resulting equation with decimals on one side, and then interpret the solution as a number of minutes and a cost. The structure is the same, but the equation and the meaning of the answer are not given.",
      answer:
        "Let m be the number of minutes. The first contract costs 25 + 0.10m and the second costs 40 + 0.05m. Set them equal: 25 + 0.10m = 40 + 0.05m. Subtract 0.05m: 25 + 0.05m = 40. Subtract 25: 0.05m = 15. Divide by 0.05: m = 300. The cost is 25 + 0.10 × 300 = £55, and the second contract gives 40 + 0.05 × 300 = £55, so the two agree at 300 minutes and £55.",
      marking: [
        "Forms both expressions correctly, with the fixed charge and the rate multiplied by the number of minutes.",
        "Sets the expressions equal and collects the variable terms on one side.",
        "Solves correctly to 300 minutes, handling the decimal coefficient.",
        "Interprets the solution with units and checks the cost in both contracts.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Solve 2x + 7 = 19.",
      answer: "2x = 12, so x = 6.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Solve 5x − 3 = 2x + 9.",
      answer:
        "Subtract 2x: 3x − 3 = 9. Add 3: 3x = 12. Divide by 3: x = 4.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why must the same operation be applied to both sides of an equation?",
      answer:
        "Because the equation states that the two sides are equal; changing only one side destroys that equality and produces a different equation.",
      when: "month-later",
    },
  ],

  summary: [
    "An equation is a balance: every operation must be applied to the whole of both sides.",
    "Undo operations in reverse order, so for 3x + 5 = 20 subtract 5 before dividing by 3.",
    "With unknowns on both sides, collect the unknown terms on one side and the constants on the other, then solve the resulting two-step equation.",
    "Substitute the answer into the original equation; the check is part of solving, not an optional extra.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every equation is read aloud as an operation in words as well as symbols, and each step is written on its own line so the sequence is not lost in a dense paragraph.",
    },
    {
      need: "low-vision",
      alternative:
        "The balance is described in words and the equations are set in a large, high-contrast block; no meaning depends on a small superscript or a colour.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson uses one worked example per idea and keeps the operation on the left of each line, with the reason stated separately rather than embedded in the equation.",
    },
    {
      need: "motor",
      alternative:
        "All practice is typed or selected; no dragging of terms across a balance is required.",
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
        "All explanations, examples, practice and assessments are original to OpenMind.",
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
      authoredAt: "2026-11-08",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
