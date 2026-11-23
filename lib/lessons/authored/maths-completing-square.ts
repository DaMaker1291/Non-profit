import type { AuthoredLesson } from "../../lesson-contract";

// COMPLETING THE SQUARE IS A PICTURE BEFORE IT IS A PROCEDURE.
//
// The usual lesson gives the rule — halve the coefficient, square it, add and
// subtract — and leaves the learner to remember which number is subtracted from
// what. The plan's area model makes the reason visible: x² + 6x is a square with
// two 3-by-x strips and a missing corner, and the 9 is the piece that closes it.
// This lesson therefore starts with the shape, derives the rule from the shape,
// and uses expansion and substitution as independent checks rather than as
// decoration at the end.
//
// The figure is the plan's, not a second drawing: `lib/lesson-plans.ts` owns the
// rectangle with the `9` corner emphasised, and `verify` already asserts that the
// marked cell is the added corner and is nine times the x² cell. The authored
// representations below say what the picture means in words and in notation.
export const MATHS_COMPLETING_SQUARE: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "completing-square",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra: completing the square, turning points and solving quadratic equations",
    level: "Key Stage 4, Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. The patio model, examples, practice, assessment, transfer and retrieval are original to OpenMind. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Rewrite a quadratic of the form x² + bx + c as (x + p)² + q by halving the x coefficient and adjusting the constant, and explain why the value is unchanged.",
      evidence:
        "Given x² + 6x + 5, the learner writes (x + 3)² − 4, shows that 9 was added inside the bracket and subtracted outside, and checks that both forms give 5 when x is zero.",
    },
    {
      statement:
        "Read the turning point and the minimum or maximum value directly from completed-square form, including when the sign inside the bracket is negative.",
      evidence:
        "For (x − 4)² − 5, the learner states that the minimum is −5 and that it occurs at x = 4, and explains that the square cannot be negative.",
    },
    {
      statement:
        "Solve a quadratic equation by isolating a perfect square and taking both roots, and check the result by substitution.",
      evidence:
        "For x² + 4x + 1 = 0, the learner reaches (x + 2)² = 3, writes x = −2 + √3 or x = −2 − √3, and substitutes one root back into the original equation.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["quadratics", "algebra-expand"],
    check: [
      {
        id: "d1",
        question: "Expand (x + 3)² without dropping the middle term.",
        answer:
          "(x + 3)(x + 3) = x² + 3x + 3x + 9 = x² + 6x + 9. The two 3x terms are the cross products and must be collected, not discarded.",
        targets: ["algebra-expand"],
      },
      {
        id: "d2",
        question: "Solve x² − 5x + 6 = 0 by factorising, and say what the two solutions mean on a graph.",
        answer:
          "The factors are (x − 2)(x − 3), so x = 2 or x = 3. Those are the two x-values where the parabola crosses the x-axis.",
        targets: ["quadratics"],
      },
    ],
  },

  introduction: {
    hook:
      "A patio is a square x metres by x metres. Two identical strips, each 3 metres wide, are added along two neighbouring sides to make the patio bigger. The new shape is almost a square, but there is a square notch at the corner where the strips fail to meet: the strips are 3 metres wide, so the missing corner is 3 metres by 3 metres. The area so far is x² + 3x + 3x = x² + 6x, and the notch is the 9 that would finish the square.",
    why:
      "Completing the square is usually taught as a sequence of symbols: halve the coefficient, square it, add it, subtract it. That sequence is easy to recite and easy to apply to the wrong number. The patio makes the sequence answer a question the learner can see. Halving 6 gives the width of each strip; squaring 3 gives the missing corner; adding and subtracting the same 9 changes the way the expression is written without changing its value. Once the shape is understood, the turning point and the roots are consequences of the same picture rather than two more rules.",
  },

  explanation: [
    {
      heading: "A square plus two equal strips leaves a notch",
      paragraphs: [
        "The expression x² + 6x is not a perfect square. The x² is a square of side x, and the 6x is two equal strips of area 3x, one along each of two neighbouring sides. Splitting 6 into 3 + 3 is not a trick: the strips are equal because the original shape is a square, so each strip takes half of the x coefficient. The shape is a square with two strips attached and a corner missing, which is exactly why it cannot yet be written as one bracket squared.",
        "The missing corner is 3 metres by 3 metres, so its area is 9. Adding that corner produces x² + 6x + 9, a square of side x + 3. Expanding (x + 3)² gives x² + 3x + 3x + 9, which is the same four pieces: the original square, the two strips and the corner. The picture and the expansion are two descriptions of one object, and either can be used to check the other. The coefficient 6 was halved because there are two equal strips, not because 6 is a convenient number.",
      ],
    },
    {
      heading: "Add the corner and take it straight back out",
      paragraphs: [
        "If the expression already contains a constant, the missing corner may not be there. x² + 6x + 5 has the square and the strips, but its constant is 5 rather than 9, so the corner is not yet included. Add 9 to create the completed square, then subtract 9 immediately: x² + 6x + 5 = (x² + 6x + 9) − 9 + 5. The two changes cancel, so the expression has the same value for every x; the bracket is now a perfect square and the remaining numbers can be combined.",
        "The result is (x + 3)² − 4. The bracket is the completed square, and −4 is what remains after the added 9 has been removed and the original 5 has been included. The rule can be stated in one line: halve the coefficient of x, square that half, write the bracket with the half inside, and subtract the square from the original constant. For x² + 6x + 5 the half is 3, its square is 9, and 5 − 9 = −4, so the form is (x + 3)² − 4.",
        "The sign of the half follows the sign of the x term. For x² − 6x the half is −3, so the bracket is (x − 3)² and the square being subtracted is still 9. Writing (x + 3)² for x² − 6x is not a small slip: expanding it gives a middle term of +6x, which is the wrong sign, so the expression has changed. The expansion check catches that error in one line, and it is the reason the method should end with a check rather than with a memorised answer.",
      ],
    },
    {
      heading: "The completed square shows the turning point without a table",
      paragraphs: [
        "A square cannot be negative. (x + 3)² is zero when x = −3 and positive for every other value, so (x + 3)² − 4 is at least −4. It reaches −4 exactly when the bracket is zero, which happens at x = −3. That gives the turning point (−3, −4) and tells you it is a minimum, without substituting a table of values or drawing the whole parabola. The number after the bracket is the minimum value; the number that makes the bracket zero is the x-coordinate, with its sign reversed from the bracket.",
        "If the completed square is subtracted, the conclusion reverses. 5 − (x − 2)² has a maximum of 5 at x = 2, because the square is at least zero and is being taken away. The sign in front of the bracket decides whether the turning point is a minimum or a maximum. The sign inside the bracket decides the x-coordinate, and it is always the value that makes the bracket zero. Keeping those two signs separate is most of the skill.",
      ],
    },
    {
      heading: "The same move solves equations and derives the formula",
      paragraphs: [
        "Completing the square also solves equations that do not factorise. Starting with x² + 4x + 1 = 0, write the left side as (x + 2)² − 3. Moving the −3 across gives (x + 2)² = 3. A square equal to 3 has two square roots, +√3 and −√3, so x + 2 = √3 or x + 2 = −√3, and therefore x = −2 + √3 or x = −2 − √3. Taking only the positive root loses one of the two solutions, just as forgetting the ± in the quadratic formula does.",
        "The quadratic formula is this same process applied to ax² + bx + c = 0 once and for all. Divide by a, complete the square on the general coefficients, and the formula appears with its ± because a square has two roots. That is why the formula never needs a separate derivation to be believed: it is the completed-square method with letters instead of numbers. The discriminant under the root is the part that decides whether the two roots are real, repeated or absent, which is the same information the graph gives.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.area-model",
      body:
        "The patio is a square of side x with two 3-by-x strips attached. The missing corner is 3 by 3, so its area is 9. The marked corner in the plan's figure is the piece that turns the notched shape into a square.",
      notation: "x² + 6x + 9 = (x + 3)²",
      caption:
        "The x² square and the two 3x strips account for x² + 6x. The marked 9 is the corner that closes the square, so the completed square has side x + 3 and area (x + 3)².",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "When the expression already has a constant, add the missing corner and subtract it again. The two changes cancel, so the value is unchanged and the bracket becomes a perfect square.",
      notation: "x² + 6x + 5 = (x² + 6x + 9) − 9 + 5 = (x + 3)² − 4",
      caption:
        "The 9 is added inside the completed square and taken straight back out. At x = 0 both forms give 5, which is the check that the rewriting preserved the expression.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "The completed-square form is a translation of y = x². The bracket moves the curve horizontally and the constant moves it vertically, so the turning point can be read from the numbers.",
      notation: "y = (x + 3)² − 4   ·   turning point (−3, −4)",
      caption:
        "The square is zero at x = −3, so the lowest point is there. The −4 after the bracket lowers the whole curve by 4, making −4 the minimum value.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Write x² + 6x + 5 in the form (x + p)² + q, and state the turning point.",
      steps: [
        {
          move: "Halve the coefficient of x: half of 6 is 3, so the bracket is (x + 3).",
          why:
            "The 6x is two equal 3x strips, so half the coefficient gives the side length added to x. The bracket must use that half, not the whole coefficient.",
        },
        {
          move: "Square the half: 3² = 9. Add 9 inside the completed square and subtract 9 outside.",
          why:
            "Adding the missing corner completes the square, while subtracting the same 9 keeps the expression equal to its original value.",
        },
        {
          move: "Replace x² + 6x + 9 by (x + 3)² and combine the constants: (x + 3)² − 9 + 5 = (x + 3)² − 4.",
          why:
            "The bracket is now a perfect square. The remaining constants combine to −4, which is the number left after the added corner is removed and the original 5 is included.",
        },
        {
          move: "The square is zero at x = −3, so the minimum is −4 and the turning point is (−3, −4).",
          why:
            "A square cannot be negative, so the smallest value of the expression is the constant after the bracket. The x-coordinate is the value that makes the bracket zero.",
        },
      ],
      answer: "(x + 3)² − 4; turning point (−3, −4), a minimum.",
    },
    {
      id: "w2",
      prompt: "Write x² − 8x + 11 in completed-square form and state its minimum value.",
      steps: [
        {
          move: "Halve −8 to get −4, so the bracket is (x − 4).",
          why:
            "The sign of the half follows the sign of the x term. A bracket of (x + 4) would expand to a middle term of +8x, which is the wrong sign.",
        },
        {
          move: "Square −4 to get 16, then add 16 and subtract 16.",
          why:
            "The square of a negative half is positive, so the missing corner has area 16. Adding and subtracting the same number preserves the value.",
        },
        {
          move: "Write (x − 4)² − 16 + 11 = (x − 4)² − 5.",
          why:
            "The first three terms form the completed square, and the remaining constants combine to −5.",
        },
        {
          move: "The bracket is zero at x = 4, so the minimum is −5 at the point (4, −5).",
          why:
            "The square contributes zero at x = 4 and is positive elsewhere, so the whole expression is smallest there.",
        },
      ],
      answer: "(x − 4)² − 5; minimum −5 at x = 4, turning point (4, −5).",
    },
    {
      id: "w3",
      prompt: "Solve x² + 4x + 1 = 0 by completing the square.",
      steps: [
        {
          move: "Half of 4 is 2, so begin with (x + 2)².",
          why:
            "The coefficient 4 splits into two equal 2x strips, which is why the bracket uses 2 rather than 4.",
        },
        {
          move: "Add 4 and subtract 4: x² + 4x + 1 = (x + 2)² − 4 + 1 = (x + 2)² − 3.",
          why:
            "The 4 completes the square and the same 4 is removed, leaving the original constant included in the −3.",
        },
        {
          move: "Set the completed square equal to zero: (x + 2)² − 3 = 0, so (x + 2)² = 3.",
          why:
            "Moving the constant to the other side isolates the square, which is the form from which both roots can be taken.",
        },
        {
          move: "Take both roots: x + 2 = √3 or x + 2 = −√3, so x = −2 + √3 or x = −2 − √3.",
          why:
            "Both a positive and a negative number square to 3, so taking only the positive root would lose one of the two solutions.",
        },
      ],
      answer: "x = −2 + √3 or x = −2 − √3.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "(x + 3)² is x² + 9, because squaring the bracket squares each part.",
      whyItFails:
        "Squaring a bracket means multiplying the whole bracket by itself: (x + 3)(x + 3) = x² + 3x + 3x + 9. The two 3x terms are the strips in the patio, and dropping them removes the entire middle term. At x = 1 the correct square is 16, while x² + 9 is 10, so the proposed rule already fails at a value the learner can check.",
      correction:
        "Write the bracket twice and multiply every term in the first by every term in the second. The result always has a middle term unless the cross products cancel, as they do in a difference of two squares.",
      contrast: {
        wrong: "(x + 3)² = x² + 9",
        right: "(x + 3)² = x² + 6x + 9",
      },
    },
    {
      id: "m2",
      belief: "x² + 6x + 5 becomes (x + 3)² − 9, because the 9 is the number subtracted.",
      whyItFails:
        "The subtraction removes the corner that was added, but the original +5 has been left out, so the expression is no longer equal to the one you started with. Substituting x = 0 exposes it: the original is 5, while (x + 3)² − 9 is 0. The remaining constant must include the original 5 as well as the subtracted 9.",
      correction:
        "After completing the square, combine every remaining constant. Here −9 + 5 = −4, so the form is (x + 3)² − 4, and substituting x = 0 gives 9 − 4 = 5 as required.",
      contrast: {
        wrong: "x² + 6x + 5 = (x + 3)² − 9",
        right: "x² + 6x + 5 = (x + 3)² − 4",
      },
    },
    {
      id: "m3",
      belief: "The bracket for x² − 6x + 5 is (x + 3)², because half of 6 is 3.",
      whyItFails:
        "The half of −6 is −3, not +3. The sign belongs to the x term, so it must travel into the bracket. Expanding (x + 3)² gives x² + 6x + 9, whose middle term has the wrong sign; the original expression has −6x. The expansion check catches this before the wrong form is used.",
      correction:
        "Halve the signed coefficient: −6 ÷ 2 = −3, so the bracket is (x − 3)². Expand the candidate to confirm that the middle term returns with the original sign.",
      contrast: {
        wrong: "x² − 6x + 5 = (x + 3)² − 4",
        right: "x² − 6x + 5 = (x − 3)² − 4",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Write x² + 10x + 7 in completed-square form and state the minimum value.",
      hint:
        "Half of 10 is 5, so start with (x + 5)². Square the 5, then add and subtract it before combining the constants.",
      answer: "(x + 5)² − 18; the minimum is −18 at x = −5.",
      feedback: {
        correct:
          "You halved 10, squared 5 to get 25, and combined −25 + 7 to leave −18. The bracket is zero at x = −5, so −18 is the minimum.",
        incorrect:
          "The bracket should be (x + 5)² and the square being subtracted is 25. Combining −25 with the original 7 gives −18, not 7 or −25.",
      },
    },
    {
      id: "p2",
      prompt: "Write x² − 4x + 1 in completed-square form and state its turning point.",
      hint:
        "Half of −4 is −2, so the bracket uses a minus sign. Square −2 to get 4, then add and subtract 4.",
      answer: "(x − 2)² − 3; the turning point is (2, −3), a minimum.",
      feedback: {
        correct:
          "The bracket is (x − 2)² and the constants combine to −3. The bracket is zero at x = 2, so the minimum is −3.",
        incorrect:
          "The half of −4 is −2, so the bracket is (x − 2), not (x + 2). After subtracting 4 and adding the original 1, the constant is −3.",
      },
    },
    {
      id: "p3",
      prompt: "Solve x² + 6x + 2 = 0 by completing the square.",
      hint:
        "Half of 6 is 3. Write (x + 3)², subtract 9, and include the original 2. Then isolate the square and take both roots.",
      answer: "(x + 3)² = 7, so x = −3 + √7 or x = −3 − √7.",
      feedback: {
        correct:
          "Completing the square gives (x + 3)² − 7 = 0. Taking both square roots gives the two exact solutions.",
        incorrect:
          "The completed square is (x + 3)² − 7, not (x + 3)² − 9. After moving 7 across, take both the positive and negative square roots; otherwise one solution is lost.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "What number must be added and subtracted to complete the square for x² + 12x?",
      modelAnswer: "36",
      marking: [
        "Halves the coefficient 12 to get 6.",
        "Squares the half to get 36, which is the missing corner.",
      ],
      check: {
        accepted: ["36", "36.0"],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "The expression x² − 10x + 27 is written as (x − 5)² + q. What is the minimum value of the expression?",
      modelAnswer: "2",
      marking: [
        "Completes the square: (x − 5)² − 25 + 27 = (x − 5)² + 2.",
        "Reads the minimum as the constant after the square, which is 2.",
      ],
      check: {
        accepted: ["2", "2.0"],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why adding 9 and then subtracting 9 preserves the value of x² + 6x + 5, and explain why (x + 3)² is not equal to x² + 9. Use one substitution to support each point.",
      modelAnswer:
        "Adding 9 and subtracting 9 is adding zero, so the expression has the same value for every x: x² + 6x + 5 = (x² + 6x + 9) − 9 + 5 = (x + 3)² − 4. At x = 0 both the original and the completed form give 5. But (x + 3)² means (x + 3)(x + 3), which expands to x² + 3x + 3x + 9 = x² + 6x + 9, not x² + 9. At x = 1 the correct bracket gives 16 while x² + 9 gives 10, so the missing cross terms are not optional.",
      marking: [
        "Explains that adding and subtracting the same number is adding zero, so the value is unchanged.",
        "Shows the completed-square form (x + 3)² − 4 and a substitution that agrees with the original.",
        "Expands (x + 3)² to x² + 6x + 9, naming the two cross terms.",
        "Uses a numerical substitution to show that x² + 9 is not equal to the square.",
      ],
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "The graph of y = (x + 3)² − 4 has a turning point. State its coordinates and the equation of its axis of symmetry, and explain how the completed-square form shows that −4 is the minimum value.",
      modelAnswer:
        "The turning point is (−3, −4) and the axis of symmetry is x = −3. A square is never negative, so (x + 3)² ≥ 0 for every x. Adding −4 gives y ≥ −4, and the value −4 is reached when x + 3 = 0, at x = −3. That is why −4 is the minimum rather than merely a point on the curve.",
      marking: [
        "States the turning point (−3, −4).",
        "Gives the axis of symmetry x = −3.",
        "Explains that (x + 3)² is never negative, so y is at least −4 and reaches that value at x = −3.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A theatre models its monthly profit, in hundreds of pounds, as P = 80x − 2x² − 600, where x is the ticket price in pounds. Complete the square to find the ticket price that maximises profit and the maximum profit. Explain why the coefficient −2 must be factored out first.",
      whyItTransfers:
        "The quadratic has a leading coefficient of −2 and describes a maximum rather than a minimum, so the learner must factor before completing the square and interpret the negative bracket correctly. The context also requires the answer to be stated in pounds and as a price, not only as an algebraic point.",
      answer:
        "P = −2(x² − 40x + 300) = −2((x − 20)² − 100) = −2(x − 20)² + 200. The bracket is zero at x = 20, and the negative coefficient makes the turning point a maximum, so the maximum profit is 200 hundred pounds, or £20,000, at a ticket price of £20. The −2 is factored out first because the completed-square rule assumes a leading coefficient of 1; leaving it inside would make the bracket expand to −2x² rather than x².",
      marking: [
        "Factors out −2 before completing the square.",
        "Obtains P = −2(x − 20)² + 200.",
        "Reads the maximum as 200 hundred pounds, or £20,000.",
        "States the ticket price as £20 and explains why the negative coefficient makes this a maximum.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Write x² + 8x + 7 in completed-square form.",
      answer: "(x + 4)² − 9, because half of 8 is 4 and 7 − 16 = −9.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Solve (x − 2)² = 5, giving both roots.",
      answer: "x = 2 + √5 or x = 2 − √5; both signs are needed because both square to 5.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Write x² − 12x + 32 in completed-square form and state its turning point.",
      answer:
        "(x − 6)² − 4, so the turning point is (6, −4) and it is a minimum.",
      when: "month-later",
    },
  ],

  summary: [
    "x² + bx is a square of side x with two equal strips; half of b is the strip width, and squaring that half gives the missing corner.",
    "To complete the square, add the corner inside the bracket and subtract the same number outside, then combine the remaining constants.",
    "The completed square (x + p)² + q has its turning point at (−p, q); the square cannot be negative, so q is a minimum when the bracket is added and a maximum when it is subtracted.",
    "Solving by completing the square isolates a perfect square and takes both roots, because a positive number has a positive and a negative square root.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every completed-square expression is read in words as well as symbols: “x plus three, all squared, minus four”, so the bracket and the subtracted constant are not mistaken for separate terms.",
    },
    {
      need: "dyslexia",
      alternative:
        "The method is laid out as four short labelled moves — halve, square, adjust, read — with one line per move rather than a dense block of symbols.",
    },
    {
      need: "colour-vision",
      alternative:
        "The plan's area model labels the marked 9 with its value as well as shading it, so the added corner is identifiable without relying on colour.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed into ordinary text boxes; the figure is read-only and no dragging or precise pointer movement is required.",
    },
    {
      need: "low-vision",
      alternative:
        "The figure and its caption are set at the same text size as the explanation, and the caption states the completed square in words for a learner who cannot read the drawing.",
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
        "All teaching prose, patio model, examples, practice, assessment, transfer and retrieval are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for algebra and quadratic equations.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-12",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
