import type { AuthoredLesson } from "../../lesson-contract";

// EXPANDING IS THE AREA MODEL, AND FACTORISING IS THE SAME PICTURE READ BACKWARDS.
//
// The usual failure is not a missing rule but a missing rectangle: a learner
// writes (x + 3)(x + 2) = x² + 6 because there is no image in which the two
// cross pieces have a place. This lesson therefore starts with four beds in a
// garden and keeps returning to the fact that the middle term is two areas, not
// two numbers added for decoration. Factorising is then a search constrained by
// two independent clues, which is why a pair that multiplies to the constant but
// misses the middle coefficient is rejected rather than accepted as close enough.
//
// Signs get their own treatment because a minus belongs to the term it precedes
// and travels into every product that term joins. The difference of two squares
// is derived as the case where the cross pieces cancel, not presented as a
// separate spell to memorise. Every expansion can be checked by substitution,
// and that check is taught before it is used as an assessment.
export const MATHS_ALGEBRA_EXPAND: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "algebra-expand",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra: expanding single and double brackets, collecting like terms, factorising quadratic expressions and the difference of two squares",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published GCSE mathematics subject content. The lesson derives the expansion from an area model and writes all examples, practice, assessment and transfer tasks itself. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Expand a single bracket by multiplying every term inside it, and explain why the term outside cannot be applied only to the first term.",
      evidence:
        "The learner expands 4(2x − 5) to 8x − 20, states that both the 2x and the −5 are multiplied by 4, and checks the result at x = 3 by evaluating both forms.",
    },
    {
      statement:
        "Expand a pair of brackets by forming all four products, collect the cross terms, and show where the middle coefficient comes from.",
      evidence:
        "The learner expands (x + 3)(x + 2) to x² + 5x + 6, identifies x², 2x, 3x and 6 as four separate products, and explains that the 5 is the sum of the two cross coefficients.",
    },
    {
      statement:
        "Factorise a quadratic with a leading coefficient of 1 by finding two numbers that satisfy both the product and the sum conditions.",
      evidence:
        "The learner factorises x² + 7x + 12 as (x + 3)(x + 4), shows that 3 × 4 = 12 and 3 + 4 = 7, and rejects (x + 2)(x + 6) because its middle term would be 8x.",
    },
    {
      statement:
        "Recognise and use the difference of two squares, including a coefficient on the squared term.",
      evidence:
        "The learner factorises x² − 25 as (x + 5)(x − 5) and 9x² − 16 as (3x + 4)(3x − 4), explaining that the cross terms cancel because they are equal and opposite.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["algebra-expressions"],
    check: [
      {
        id: "d1",
        question: "Simplify 5x + 3 − 2x + 8, naming the like terms you combined.",
        answer:
          "The x terms 5x and −2x combine to 3x, and the constants 3 and 8 combine to 11, so the expression is 3x + 11. Only terms with the same letter part can be collected.",
        targets: ["algebra-expressions"],
      },
      {
        id: "d2",
        question: "What does 3(x + 4) mean before any expanding is done?",
        answer:
          "It means three copies of the whole quantity x + 4. Every part of that quantity is tripled, so the result is 3x + 12; the 4 is inside the bracket and cannot be left unmultiplied.",
        targets: ["algebra-expressions"],
      },
      {
        id: "d3",
        question: "If x = 4, what is the value of x², and why is it not 2x?",
        answer:
          "x² means x multiplied by x, so at x = 4 it is 16. 2x means two copies of x, which is 8. The index counts repeated factors of x, while the coefficient counts copies of the term.",
        targets: ["algebra-expressions"],
      },
    ],
  },

  introduction: {
    hook:
      "A garden is x + 3 metres long and x + 2 metres wide, with the x part marked off at the same place on each side. The whole area is not one rectangle you can look up, but the garden splits along those marks into four smaller rectangles: a square of area x², two strips of areas 2x and 3x, and a corner of area 6. The total area is x² + 5x + 6, and the 5x is not a rule someone invented; it is the two strips standing next to each other.",
    why:
      "Expanding brackets is often taught as a chant: first, outside, inside, last. The chant can produce the right symbols while leaving a learner unable to explain why the middle term exists, which is why x² + 6 is such a persistent wrong answer. The area model makes the missing pieces visible. Factorising then becomes the reverse search for the side lengths that would produce those four areas. The same picture supports quadratics, completing the square and the difference of two squares, so the effort spent understanding it is repaid several times.",
  },

  explanation: [
    {
      heading: "A bracket is one quantity, so every part is multiplied",
      paragraphs: [
        "An expression such as 4(2x − 5) means four copies of the whole bracket. The bracket is a single quantity made of two terms, and multiplying the quantity by four multiplies each of its parts. Four copies of 2x give 8x, and four copies of −5 give −20, so the expansion is 8x − 20. Writing 8x − 5 applies the four only to the first term and leaves the second unchanged, which changes the value of the expression.",
        "The distributive law is the formal name for this, but the area model is the reason it is true. A rectangle of width 4 and length 2x − 5 can be split into a rectangle of area 8x and a rectangle of area −20 only if the negative part is treated as a part of the length. The negative sign is not decoration outside the calculation; it belongs to the term and is multiplied along with its size.",
        "A substitution check makes the rule self-correcting. At x = 3, the original 4(2x − 5) is 4 × 1 = 4. The correct expansion 8x − 20 gives 24 − 20 = 4. The incorrect 8x − 5 gives 24 − 5 = 19. One value of x is enough to expose the error, and the check does not require trusting the expansion you are checking.",
      ],
    },
    {
      heading: "Two brackets make four products, and two of them are cross pieces",
      paragraphs: [
        "(x + 3)(x + 2) is the area of a rectangle whose length and width are each split into two parts. The four smaller rectangles have areas x², 2x, 3x and 6. The first comes from x times x, the next two from the cross products x times 2 and 3 times x, and the last from 3 times 2. Expanding means writing all four areas and then collecting the two that are like terms: 2x + 3x = 5x.",
        "The coefficient 5 is therefore not 3 + 2 chosen arbitrarily. It is the sum of the two numbers that each multiply x once. In (x + 3)(x + 2) those numbers are 3 and 2; in (x + 7)(x + 1) they are 7 and 1, so the middle term is 8x. The constant is always the product of the two numbers, while the middle coefficient is their sum. Seeing both jobs at once is what makes factorising possible later.",
        "A sign belongs to the term it precedes. In (x − 3)(x + 2), the second bracket contributes +2x, while the first contributes −3x and −6. The cross terms are +2x and −3x, whose sum is −x, and the constant is −6. The expansion is x² − x − 6. The minus in front of the 3 does not disappear when the term is multiplied by x; it changes the sign of that whole product.",
      ],
    },
    {
      heading: "Factorising is the same rectangle read from its area",
      paragraphs: [
        "Factorising x² + 5x + 6 asks which two numbers could have produced the constant and the middle coefficient. The constant 6 is the product of the two numbers, and the middle coefficient 5 is their sum. The pair 2 and 3 satisfies both: 2 × 3 = 6 and 2 + 3 = 5, so the expression is (x + 2)(x + 3). The order of the brackets does not matter because multiplication is commutative, but both numbers must satisfy both conditions.",
        "A pair that satisfies only one condition is not a factorisation. The pair 1 and 6 multiplies to 6 but adds to 7, so (x + 1)(x + 6) expands to x² + 7x + 6, not the expression we started with. The middle coefficient is the independent check, and it is the one most often skipped. Expanding the candidate back is the reliable test: if the original expression returns, the factors are correct.",
        "Signs narrow the search. If the constant is positive, the two numbers have the same sign; their sum then has that same sign. If the constant is negative, the two numbers have opposite signs, and the middle coefficient tells you which sign is larger in magnitude. For x² − x − 6, the product is negative and the sum is negative, so the negative number must be larger: −3 and +2 give −6 and −1, hence (x − 3)(x + 2).",
      ],
    },
    {
      heading: "When the cross pieces cancel, the middle term disappears",
      paragraphs: [
        "(x + 5)(x − 5) has cross terms +5x and −5x. They are equal in size and opposite in sign, so they add to zero, leaving x² − 25. This is the difference of two squares: a squared quantity minus another squared quantity. The pattern is not a special exception to expansion; it is what expansion always does when the two brackets differ only in the sign of the same number.",
        "The pattern also works when the squared terms have coefficients. 9x² − 16 is (3x)² − 4², so it factorises as (3x + 4)(3x − 4). The square root of the first term gives the x-part of each bracket, and the square root of the second gives the number. A common error is to write (3x + 4)(3x + 4), which squares the bracket and produces a middle term instead of removing it.",
        "Recognising the pattern saves time, but the expansion check still applies. Multiply the candidate factors back and confirm that the cross terms cancel. If a middle term survives, either the original expression was not a difference of two squares or the factors were chosen incorrectly. The check keeps a useful shortcut from becoming a guess.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A single bracket multiplies every term inside it. The number outside is a multiplier of the whole quantity, not a label attached to the first term.",
      notation: "4(2x − 5) = 8x − 20   ·   3(x + 4) = 3x + 12",
      caption:
        "The 4 multiplies both 2x and −5. Checking at x = 3 gives 4 × 1 = 4 for the bracket and 24 − 20 = 4 for the expansion, so the two forms agree.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "A product of two brackets is a rectangle split into four smaller rectangles. Every term of the first bracket meets every term of the second, and the two cross rectangles are collected into the middle term.",
      notation: "(x + 3)(x + 2) = x² + 2x + 3x + 6 = x² + 5x + 6",
      caption:
        "The four areas are x², 2x, 3x and 6. The middle coefficient 5 is the sum of the two cross coefficients, not a separate number chosen to make the answer look tidy.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Factorising reverses the area model. The constant gives the product of the two numbers and the middle coefficient gives their sum, so both clues must hold at once.",
      notation: "x² + 7x + 12 = (x + 3)(x + 4)   because 3 × 4 = 12 and 3 + 4 = 7",
      caption:
        "The pair 2 and 6 also multiplies to 12, but it adds to 8, so (x + 2)(x + 6) is rejected. Expanding the candidate back is the check that both conditions were met.",
    },
    {
      id: "r4",
      kind: "maths.proof",
      body:
        "The difference of two squares is the case where the cross products are equal and opposite. Their cancellation is a consequence of expansion, not a separate rule.",
      notation: "(x + 5)(x − 5) = x² − 5x + 5x − 25 = x² − 25",
      caption:
        "The +5x and −5x cancel because they are the same size with opposite signs. The surviving terms are the square of the first term and the negative square of the second.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Expand and simplify (2x + 3)(x − 4).",
      steps: [
        {
          move: "Multiply 2x by x and by −4 to get 2x² and −8x.",
          why:
            "The first term of the first bracket must meet both terms of the second, so it produces two products rather than one.",
        },
        {
          move: "Multiply 3 by x and by −4 to get 3x and −12.",
          why:
            "The second term of the first bracket also meets both terms of the second, completing the four rectangles of the area model.",
        },
        {
          move: "Collect the like terms: −8x + 3x = −5x.",
          why:
            "The two x terms are the cross pieces and have the same letter part, so their coefficients add; the x² and constant terms are different kinds and stay separate.",
        },
        {
          move: "The expansion is 2x² − 5x − 12. Check at x = 1: the brackets give 5 × (−3) = −15, and the expansion gives 2 − 5 − 12 = −15.",
          why:
            "One substitution tests the whole expansion, including the signs, without relying on the same steps that produced it.",
        },
      ],
      answer: "2x² − 5x − 12",
    },
    {
      id: "w2",
      prompt: "Factorise x² + 9x + 20.",
      steps: [
        {
          move: "List factor pairs of the constant 20: 1 and 20, 2 and 10, 4 and 5.",
          why:
            "The constant is the product of the two numbers in the brackets, so only pairs that multiply to 20 can be candidates.",
        },
        {
          move: "Add each pair: 1 + 20 = 21, 2 + 10 = 12, 4 + 5 = 9.",
          why:
            "The middle coefficient is the sum of the same two numbers, so the pair must also produce 9.",
        },
        {
          move: "Choose 4 and 5, giving (x + 4)(x + 5).",
          why:
            "This is the only pair that satisfies both the product and the sum conditions, so it is the factorisation rather than a near miss.",
        },
        {
          move: "Expand (x + 4)(x + 5) to check: x² + 5x + 4x + 20 = x² + 9x + 20.",
          why:
            "Expanding the candidate recovers the original expression, which proves the factors are correct for every value of x.",
        },
      ],
      answer: "(x + 4)(x + 5)",
    },
    {
      id: "w3",
      prompt: "Factorise 16x² − 25.",
      steps: [
        {
          move: "Recognise 16x² as the square of 4x and 25 as the square of 5.",
          why:
            "The difference-of-two-squares pattern needs both terms to be perfect squares before the factors can be written.",
        },
        {
          move: "Write the factors with the same two terms, one using a plus and one using a minus: (4x + 5)(4x − 5).",
          why:
            "The opposite signs make the cross products +20x and −20x, which cancel and leave no middle term.",
        },
        {
          move: "Expand (4x + 5)(4x − 5) to check: 16x² − 20x + 20x − 25 = 16x² − 25.",
          why:
            "The cancellation of the cross terms is the defining feature of the pattern, so seeing it in the expansion confirms the factors rather than merely matching the first term.",
        },
      ],
      answer: "(4x + 5)(4x − 5)",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "(x + 3)(x + 2) expands to x² + 6 because the only product that matters is the two numbers.",
      whyItFails:
        "The two brackets contain four products, not one. Besides x times x and 3 times 2, there are the cross products x times 2 and 3 times x, which add to 5x. Dropping them changes the value: at x = 10 the brackets give 13 × 12 = 156, while x² + 6 gives 106. The missing 50 is exactly the two cross pieces.",
      correction:
        "Write all four products before collecting anything: x², 2x, 3x and 6. Then combine the two x terms. The area model is the reminder that the cross pieces are real rectangles, not optional extras.",
      contrast: {
        wrong: "(x + 3)(x + 2) = x² + 6",
        right: "(x + 3)(x + 2) = x² + 5x + 6",
      },
    },
    {
      id: "m2",
      belief: "A minus sign in front of a bracket only changes the first term inside it.",
      whyItFails:
        "The minus belongs to every term that follows it inside the bracket. In (x − 3)(x + 2), the −3 multiplies both x and +2, producing −3x and −6. Applying it only to the first product leaves the constant positive and changes the value of the expansion. A substitution at x = 4 exposes the difference immediately.",
      correction:
        "Treat the sign as part of the term. Write the four products with their signs attached, then collect. If it helps, rewrite subtraction as addition of a negative before expanding.",
      contrast: {
        wrong: "(x − 3)(x + 2) = x² + 5x + 6",
        right: "(x − 3)(x + 2) = x² − x − 6",
      },
    },
    {
      id: "m3",
      belief: "Any pair of numbers that multiplies to the constant is a valid factorisation.",
      whyItFails:
        "The constant and the middle coefficient are two independent clues. For x² + 5x + 6, the pair 1 and 6 multiplies to 6 but adds to 7, so (x + 1)(x + 6) expands to x² + 7x + 6. The candidate has the right constant and the wrong middle term, which means it is a different expression. Both conditions must hold.",
      correction:
        "Check the sum as well as the product, then expand the candidate back. A factorisation is correct only when the expansion returns the original expression exactly.",
      contrast: {
        wrong: "x² + 5x + 6 = (x + 1)(x + 6) because 1 × 6 = 6",
        right: "x² + 5x + 6 = (x + 2)(x + 3) because 2 × 3 = 6 and 2 + 3 = 5",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Expand 3(2x + 7).",
      hint:
        "Multiply both terms inside the bracket by 3. Check at x = 1 once you have an answer.",
      answer: "6x + 21",
      feedback: {
        correct:
          "Both terms were multiplied: 3 × 2x = 6x and 3 × 7 = 21. The check at x = 1 gives 3 × 9 = 27 and 6 + 21 = 27.",
        incorrect:
          "The 3 must multiply the whole bracket, not only 2x. The correct expansion is 6x + 21; 6x + 7 would give 13 at x = 1 while the bracket gives 27.",
      },
    },
    {
      id: "p2",
      prompt: "Expand (x + 6)(x − 2).",
      hint:
        "Write all four products, keeping the minus sign with the 2. Then collect the two x terms.",
      answer: "x² + 4x − 12",
      feedback: {
        correct:
          "The four products are x², −2x, 6x and −12. The cross terms combine to +4x, so the expansion is x² + 4x − 12.",
        incorrect:
          "The cross terms are −2x and +6x, which add to +4x, not +8x or −8x. The constant is −12 because +6 times −2 is negative.",
      },
    },
    {
      id: "p3",
      prompt: "Factorise x² − 2x − 15.",
      hint:
        "The constant is negative, so the two numbers have opposite signs. Their sum is −2, so the negative number must be larger in size.",
      answer: "(x − 5)(x + 3)",
      feedback: {
        correct:
          "−5 × 3 = −15 and −5 + 3 = −2, so both clues are satisfied. Expanding gives x² + 3x − 5x − 15 = x² − 2x − 15.",
        incorrect:
          "The pair must multiply to −15 and add to −2. The pair −5 and +3 does both, giving (x − 5)(x + 3); the pair −3 and +5 adds to +2 instead.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Expand and simplify (x + 7)(x − 3).",
      modelAnswer: "x² + 4x − 21",
      marking: [
        "Forms all four products, including the two cross terms −3x and 7x.",
        "Collects the cross terms to 4x and keeps the constant negative.",
      ],
      check: { accepted: ["x² + 4x − 21", "x^2+4x-21", "x²+4x−21"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner says x² + 10x + 16 factorises as (x + 2)(x + 8) because 2 × 8 = 16. Explain whether the learner is correct, and justify your answer by expanding.",
      modelAnswer:
        "The learner is correct. The product 2 × 8 = 16 gives the constant, and the sum 2 + 8 = 10 gives the middle coefficient. Expanding (x + 2)(x + 8) gives x² + 8x + 2x + 16 = x² + 10x + 16, which is the original expression. Both clues hold, so the factorisation is valid. A pair that multiplied to 16 but added to something other than 10, such as 1 and 16, would not work.",
      marking: [
        "Checks both the product 16 and the sum 10.",
        "Expands the candidate to recover the original expression.",
        "Concludes that the factorisation is correct and explains why a product-only check is insufficient.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Factorise 25x² − 49.",
      modelAnswer: "(5x + 7)(5x − 7)",
      marking: [
        "Recognises both terms as squares and uses opposite signs in the two brackets.",
        "Checks that the cross terms cancel, leaving no x term.",
      ],
      check: { accepted: ["(5x + 7)(5x − 7)", "(5x-7)(5x+7)", "(5x+7)(5x-7)"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A rectangular frame has an outer length of x + 8 metres and an outer width of x + 3 metres. The frame is 2 metres thick on every side, so the inner rectangle has length x + 4 and width x − 1. Write expressions for the outer area and the inner area, subtract to get the area of the frame, and expand the result. Check the expression at x = 5.",
      whyItTransfers:
        "The learner must build two products from a described physical object, subtract one area from another, and expand a difference of two bracket products. The algebra is the same expansion, but the situation requires deciding which dimensions to multiply and interpreting a negative inner width as a condition on x. That decision-making is the transfer, not a reworded expansion drill.",
      answer:
        "Outer area = (x + 8)(x + 3) = x² + 11x + 24. Inner area = (x + 4)(x − 1) = x² + 3x − 4. Frame area = (x² + 11x + 24) − (x² + 3x − 4) = 8x + 28. At x = 5, the outer rectangle is 13 by 8 with area 104, the inner is 9 by 4 with area 36, and the frame is 68; the expression gives 8 × 5 + 28 = 68. The inner width x − 1 is positive only when x > 1, so the model applies only to frames with x greater than 1.",
      marking: [
        "Expands both the outer and inner areas correctly, including the signs in the inner product.",
        "Subtracts the inner area from the outer area and simplifies to 8x + 28.",
        "Checks the expression at x = 5 against the dimensions.",
        "States the condition x > 1 for the inner width to be positive.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Expand 5(3x − 4).",
      answer: "15x − 20, because both terms inside the bracket are multiplied by 5.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Factorise x² + 8x + 15.",
      answer:
        "(x + 3)(x + 5). The pair 3 and 5 multiplies to 15 and adds to 8, and expanding the factors returns the original expression.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Expand (x − 6)(x + 6) and explain why there is no x term.",
      answer:
        "x² − 36. The cross products are −6x and +6x, equal and opposite, so they cancel. This is the difference of two squares.",
      when: "month-later",
    },
  ],

  summary: [
    "Expanding a single bracket multiplies every term inside it; a multiplier outside applies to the whole bracket.",
    "Two brackets produce four products, and the middle coefficient is the sum of the two cross coefficients.",
    "Factorising a quadratic with leading coefficient 1 requires two numbers that multiply to the constant and add to the middle coefficient.",
    "A minus sign belongs to the term it precedes and must travel into every product that term joins.",
    "The difference of two squares is the case where the cross products cancel; check any factorisation by expanding it back.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The four-product expansion is read as a list of four areas with their signs, and squared terms are spoken as x squared rather than as a superscript symbol.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each expansion is laid out as one product per line before the collected answer, so the learner does not have to track several terms inside one dense line of symbols.",
    },
    {
      need: "colour-vision",
      alternative:
        "No part of the area model relies on colour to distinguish the four regions; each region carries a text label and the caption names the areas in order.",
    },
    {
      need: "motor",
      alternative:
        "All factorisations and expansions are typed; there is no drag-and-drop matching of factors.",
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
        "All teaching prose, examples, practice, assessments and the picture-frame transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for algebraic expansion and factorisation.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-11",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};