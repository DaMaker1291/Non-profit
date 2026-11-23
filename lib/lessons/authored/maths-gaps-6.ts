import { defineGapLesson } from "./_gap-lesson";

// MATHS GAP BATCH 6 — graphs, rational expressions and numerical iteration.

export const MATHS_QUADRATIC_GRAPHS = defineGapLesson({
  conceptId: "quadratic-graphs",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra and graphs: quadratic functions and their graphs",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for quadratic graphs, roots and turning points. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Sketch a quadratic from its equation, identifying the direction of opening, the roots and the y-intercept.",
      evidence:
        "For y = x² − 4x + 3, the learner factors to (x − 1)(x − 3), states the roots 1 and 3, and marks the y-intercept 3.",
    },
    {
      statement:
        "Find the turning point by completing the square and identify the axis of symmetry.",
      evidence:
        "The learner rewrites x² − 4x + 3 as (x − 2)² − 1 and states the vertex (2, −1) and axis x = 2.",
    },
    {
      statement:
        "Use the discriminant to decide how many times the graph crosses the x-axis without solving the equation.",
      evidence:
        "The learner computes b² − 4ac and distinguishes two, one or no real roots from the sign.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["quadratics", "completing-square"],
    check: [
      {
        id: "d1",
        question: "How do you find the roots of a quadratic from its factorised form?",
        answer:
          "Set each factor equal to zero and solve; for (x − 1)(x − 3), the roots are 1 and 3.",
        targets: ["quadratics"],
      },
      {
        id: "d2",
        question: "What is the turning point of y = (x − 2)² − 1?",
        answer:
          "The minimum is (2, −1), because the square is zero at x = 2 and the constant is −1.",
        targets: ["completing-square"],
      },
    ],
  },
  introduction: {
    hook:
      "A ball's height follows a quadratic. The graph crosses the ground at two times, reaches a highest point halfway between them and is symmetric about that line. The equation contains all of that structure: the roots are the ground crossings, the completed square gives the highest point, and the sign of the x² coefficient says whether the curve opens up or down. No table of values is needed to sketch it.",
    why:
      "Quadratic graphs are often plotted point by point, which produces a shape but not an explanation. The structure is faster and more reliable: factorise for roots, complete the square for the vertex, read the intercept from the constant. The axis of symmetry is halfway between the roots. This lesson connects the algebra to the picture so a sketch becomes an argument, not a decoration.",
  },
  explanation: [
    {
      heading: "The coefficient of x² decides the shape",
      paragraphs: [
        "The graph of y = ax² + bx + c is a parabola. If a is positive, it opens upward and has a minimum; if a is negative, it opens downward and has a maximum. The magnitude of a controls the width: a larger absolute value makes a narrower curve, while a fraction makes it wider. The constant c is the y-intercept because substituting x = 0 leaves c.",
        "The roots are where y = 0, so they are the x-intercepts. A quadratic can have two, one repeated or no real roots. The discriminant b² − 4ac decides which before any solving: positive gives two, zero gives one repeated root, negative gives none. The graph's crossings and the discriminant must agree.",
      ],
    },
    {
      heading: "Completing the square locates the vertex",
      paragraphs: [
        "Writing y = (x − h)² + k shows the vertex at (h, k). The square is zero at x = h and cannot be negative, so k is the minimum when the bracket is added and the maximum when it is subtracted. For y = x² − 4x + 3, completing the square gives (x − 2)² − 1, so the vertex is (2, −1) and the axis of symmetry is x = 2.",
        "The axis of symmetry is halfway between the two roots when they exist. For roots 1 and 3, the midpoint is 2, matching the vertex's x-coordinate. This is a check on both calculations: if the vertex is not halfway between the roots, one of them is wrong.",
      ],
    },
    {
      heading: "Sketch the structure, not a table of points",
      paragraphs: [
        "A useful sketch marks the roots, the y-intercept, the vertex and the direction of opening. Those four features determine the shape well enough to answer questions about where the graph is positive, negative or increasing. A table of values can fill in detail, but it should not be the source of the structure. The sketch is a summary of the algebra, so every marked point should be traceable to a calculation.",
        "The graph also solves inequalities. If the parabola opens upward and crosses at 1 and 3, it is below the x-axis between the roots and above outside them. Reading the regions from the sketch is faster than testing many values, provided the roots and the opening direction are correct. The sketch turns an algebraic inequality into a question about which side of the axis the curve lies on.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Factoring gives the roots directly. The x-intercepts are the values that make each factor zero.",
      notation: "y = x² − 4x + 3 = (x − 1)(x − 3)",
      caption:
        "The roots are 1 and 3. The y-intercept is 3 because substituting x = 0 gives the constant.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Completing the square exposes the vertex. The bracket's constant gives the x-coordinate with the opposite sign, and the outside constant gives the y-coordinate.",
      notation: "y = (x − 2)² − 1; vertex (2, −1); axis x = 2",
      caption:
        "The square is zero at x = 2, so the minimum value is −1. The axis of symmetry is the vertical line through the vertex.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "The discriminant counts the x-intercepts. A positive value gives two, zero gives a repeated root, and a negative value gives none.",
      notation: "b² − 4ac for x² − 4x + 3: 16 − 12 = 4 > 0",
      caption:
        "A positive discriminant confirms two distinct roots, matching the crossings at 1 and 3. The sign of a tells you whether the curve opens up or down.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Sketch y = x² − 4x + 3 by finding its roots, vertex and y-intercept.",
      steps: [
        {
          move: "Factorise: y = (x − 1)(x − 3), so the roots are 1 and 3.",
          why:
            "The roots are where y = 0. A product is zero when either factor is zero, giving the two x-intercepts.",
        },
        {
          move: "The y-intercept is 3 because substituting x = 0 leaves the constant.",
          why:
            "The constant term is the value on the vertical axis. It gives a third point for the sketch.",
        },
        {
          move: "Complete the square: (x − 2)² − 1, so the vertex is (2, −1) and the axis is x = 2.",
          why:
            "The vertex lies halfway between the roots, at x = 2. The minus one is the minimum value because the square is non-negative.",
        },
        {
          move: "The roots are 1 and 3; the vertex is (2, −1); the curve opens upward.",
          why:
            "The positive x² coefficient makes the parabola open upward, so the vertex is a minimum and the arms rise on both sides.",
        },
      ],
      answer: "Roots 1 and 3, vertex (2, −1), y-intercept 3, opening upward.",
    },
    {
      id: "w2",
      prompt:
        "Find the roots and vertex of y = (x + 2)² − 9.",
      steps: [
        {
          move: "Set y = 0: (x + 2)² = 9.",
          why:
            "The completed-square form isolates the square, making the roots accessible by taking both square roots.",
        },
        {
          move: "Take both roots: x + 2 = 3 or x + 2 = −3, so x = 1 or x = −5.",
          why:
            "A positive number has two square roots. Taking only the positive one would lose the left-hand crossing.",
        },
        {
          move: "The vertex is (−2, −9), because the square is zero at x = −2 and the constant is −9.",
          why:
            "The bracket's sign reverses for the x-coordinate. The outside constant is the minimum value.",
        },
      ],
      answer: "Roots 1 and −5; vertex (−2, −9).",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The vertex of y = (x − 2)² − 1 is (−2, −1).",
      whyItFails:
        "The bracket is zero when x = 2, not x = −2. Substituting x = −2 gives (−4)² − 1 = 15, which is not the minimum. The sign of the x-coordinate is opposite to the sign inside the bracket.",
      correction:
        "Set the bracket equal to zero and solve for x. For (x − 2)², that gives x = 2; for (x + 2)², it gives x = −2.",
      contrast: {
        wrong: "Vertex at (−2, −1)",
        right: "Vertex at (2, −1)",
      },
    },
    {
      id: "m2",
      belief: "A quadratic with no real roots does not cross the x-axis, so it has no vertex.",
      whyItFails:
        "The vertex is a turning point, not a root. A parabola that never reaches the x-axis still has a highest or lowest point. For example, y = (x − 1)² + 4 has vertex (1, 4) and no real roots.",
      correction:
        "Find the vertex from the completed-square form independently of the roots. The discriminant tells you about x-intercepts, not about the turning point.",
      contrast: {
        wrong: "No roots means no vertex.",
        right: "No roots means no x-intercepts; the vertex still exists above or below the axis.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Find the roots of y = x² − 5x + 6.",
      hint: "Factorise into two brackets whose numbers multiply to 6 and add to −5.",
      answer: "(x − 2)(x − 3), so the roots are 2 and 3.",
      feedback: {
        correct: "You found the factor pair and set each bracket to zero.",
        incorrect:
          "The factors are (x − 2)(x − 3). The roots are 2 and 3, not −2 and −3.",
      },
    },
    {
      id: "p2",
      prompt: "Find the vertex of y = (x − 3)² + 2.",
      hint: "The bracket is zero at the x-coordinate; the outside constant is the y-coordinate.",
      answer: "Vertex (3, 2), a minimum.",
      feedback: {
        correct: "You reversed the sign inside the bracket for x and kept the outside constant.",
        incorrect:
          "The bracket is zero at x = 3, and the minimum value is 2. The vertex is (3, 2), not (−3, 2).",
      },
    },
    {
      id: "p3",
      prompt: "How many times does y = x² + 2x + 5 cross the x-axis?",
      hint: "Compute the discriminant b² − 4ac.",
      answer: "4 − 20 = −16 < 0, so it does not cross the x-axis.",
      feedback: {
        correct: "You used the discriminant's sign to count real roots.",
        incorrect:
          "The discriminant is 2² − 4 × 1 × 5 = −16. A negative discriminant means no real roots, so there are no crossings.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What are the roots of y = x² − 4x + 3?",
      modelAnswer: "1 and 3",
      marking: [
        "Factorises as (x − 1)(x − 3).",
        "Sets each factor to zero to get 1 and 3.",
      ],
      check: { accepted: ["1 and 3", "1, 3", "x = 1 or x = 3", "3 and 1"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the x-coordinate of the vertex of y = (x − 2)² − 1?",
      modelAnswer: "2",
      marking: [
        "Sets the bracket x − 2 equal to zero.",
        "Reverses the sign inside the bracket.",
      ],
      check: { accepted: ["2", "two", "x = 2"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how the roots, vertex and y-intercept together determine the sketch of a quadratic. Use y = x² − 4x + 3 as your example.",
      modelAnswer:
        "The roots 1 and 3 are the x-intercepts. The y-intercept is 3 because substituting x = 0 leaves the constant. Completing the square gives (x − 2)² − 1, so the vertex is (2, −1) and the axis of symmetry is x = 2, halfway between the roots. The positive x² coefficient means the parabola opens upward, so the vertex is a minimum.",
      marking: [
        "Identifies the roots as the x-intercepts.",
        "Uses the completed-square form to locate the vertex and axis.",
        "Uses the sign of the x² coefficient to choose the opening direction.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A ball's height is h = 20t − 5t² metres after t seconds. Find when it hits the ground, its maximum height and the time of that maximum. Explain how the graph's symmetry checks the answer.",
      whyItTransfers:
        "The lesson sketches a quadratic from its equation. The ball adds a physical domain and asks for the meaning of the roots and vertex, so the learner must interpret the algebra in context and reject a negative time.",
      answer:
        "Set h = 0: 5t(4 − t) = 0, so t = 0 or t = 4. The ball hits the ground at 4 seconds. Completing the square gives 20t − 5t² = −5(t² − 4t) = −5((t − 2)² − 4) = −5(t − 2)² + 20. The vertex is (2, 20), so the maximum height is 20 m at 2 seconds, halfway between the roots.",
      marking: [
        "Sets the height to zero and finds the non-zero root.",
        "Completes the square correctly and identifies the maximum height and time.",
        "Uses the midpoint of the roots as a symmetry check.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does the sign of the x² coefficient tell you about a parabola?",
      answer:
        "Positive opens upward and has a minimum; negative opens downward and has a maximum.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is the axis of symmetry of y = (x − 3)² + 2?",
      answer: "x = 3, the vertical line through the vertex.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What does a negative discriminant mean for a quadratic graph?",
      answer:
        "It has no real roots, so the graph does not cross the x-axis.",
      when: "month-later",
    },
  ],
  summary: [
    "The sign of the x² coefficient decides whether the parabola opens upward or downward.",
    "Roots are the x-intercepts; the y-intercept is the constant term.",
    "Completing the square gives the vertex and the axis of symmetry.",
    "The discriminant counts real roots and must agree with the graph's crossings.",
  ],
});

export const MATHS_ALGEBRAIC_FRACTIONS = defineGapLesson({
  conceptId: "algebraic-fractions",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: simplifying, adding and solving algebraic fractions",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for algebraic fractions. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Factorise a numerator or denominator before cancelling common factors in an algebraic fraction.",
      evidence:
        "The learner simplifies (x² − 9)/(x + 3) to x − 3 by factorising the difference of squares and stating the restriction x ≠ −3.",
    },
    {
      statement:
        "Add or subtract algebraic fractions by constructing a common denominator from their factors.",
      evidence:
        "The learner combines 1/x and 1/(x + 1) into (2x + 1)/(x(x + 1)) and states the domain.",
    },
    {
      statement:
        "Solve an equation containing an algebraic fraction by multiplying through, then check for extraneous solutions.",
      evidence:
        "The learner solves 3/(x − 1) = 2 to get x = 2.5 and checks that the denominator is not zero.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["fraction-ops", "algebra-expand"],
    check: [
      {
        id: "d1",
        question: "How do you add 1/2 and 1/3?",
        answer:
          "Use the common denominator 6: 3/6 + 2/6 = 5/6.",
        targets: ["fraction-ops"],
      },
      {
        id: "d2",
        question: "Factorise x² − 9.",
        answer:
          "It is a difference of squares: (x − 3)(x + 3).",
        targets: ["algebra-expand"],
      },
    ],
  },
  introduction: {
    hook:
      "The fraction (x² − 9)/(x + 3) looks complicated until the numerator is factorised. Then it is (x − 3)(x + 3)/(x + 3), and the common factor cancels, leaving x − 3, provided x is not −3. The restriction matters: the original fraction is undefined at −3 even though the simplified expression is perfectly happy there.",
    why:
      "Algebraic fractions are ordinary fractions with letters. The same rules apply: factorise before cancelling, build a common denominator before adding, and multiply through before solving. The new difficulty is the domain. Cancelling a factor removes a hole in the graph, and multiplying by an expression that can be zero can introduce a solution that does not satisfy the original equation. This lesson keeps those conditions visible.",
  },
  explanation: [
    {
      heading: "Factorise before cancelling",
      paragraphs: [
        "A fraction can be simplified only when the numerator and denominator have a common factor. In (x² − 9)/(x + 3), the numerator is a difference of squares and factors to (x − 3)(x + 3). The factor (x + 3) is common, so it cancels, leaving x − 3. Cancelling before factorising is the algebraic equivalent of cancelling the 2 in (2 + 4)/2 to get 1 + 4, which is false.",
        "The cancelled factor may be zero. The original fraction is undefined when x + 3 = 0, so x = −3 must be excluded from the domain. The simplified expression x − 3 is defined at −3, but it is not equal to the original there because the original has no value. Stating the restriction is part of the simplification, not an optional footnote. The same reasoning applies to every cancelled factor, including ones that look harmless because they are linear.",
      ],
    },
    {
      heading: "A common denominator is built from factors",
      paragraphs: [
        "To add 1/x and 1/(x + 1), multiply each fraction by the denominator it lacks: the first by (x + 1)/(x + 1), the second by x/x. The common denominator is x(x + 1), not x + (x + 1). The numerators become (x + 1) + x = 2x + 1, so the sum is (2x + 1)/(x(x + 1)).",
        "When the denominators already share a factor, the least common multiple is smaller than the product. For 1/(x + 1) and 1/(x + 1)², the common denominator is (x + 1)², not (x + 1)³. Factoring first reveals the shared part and keeps the algebra simpler. A larger denominator is not wrong, but it creates extra cancellation and more chances for a slip.",
      ],
    },
    {
      heading: "Multiplying through can create false solutions",
      paragraphs: [
        "To solve 3/(x − 1) = 2, multiply both sides by x − 1 to get 3 = 2(x − 1), so x = 2.5. The step is valid only if x ≠ 1, because the original fraction is undefined there. A solution that makes a denominator zero is extraneous and must be rejected even if it satisfies the multiplied equation.",
        "The check is substitution into the original equation, not the cleared one. If the left side is undefined at the candidate, the candidate is not a solution. This is the same domain issue as cancelling, seen through an equation rather than a simplification. A quick domain list before solving saves the later check from becoming a guessing game.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Factorising the difference of squares reveals the common factor. The restriction records the value that made the original denominator zero.",
      notation: "(x² − 9)/(x + 3) = (x − 3)(x + 3)/(x + 3) = x − 3, x ≠ −3",
      caption:
        "The simplified expression is x − 3, but the original fraction has a hole at x = −3. The domain restriction preserves that fact.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Adding fractions requires a common denominator built from the product of the distinct factors.",
      notation: "1/x + 1/(x + 1) = (x + 1 + x)/(x(x + 1)) = (2x + 1)/(x(x + 1))",
      caption:
        "Each numerator is multiplied by the factor its denominator lacks. The result is one fraction, not a sum of two.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Multiplying through by the denominator clears the fraction, but the candidate must be checked against the original domain.",
      notation: "3/(x − 1) = 2 ⇒ 3 = 2(x − 1) ⇒ x = 2.5, x ≠ 1",
      caption:
        "The solution 2.5 does not make the denominator zero, so it is valid. A candidate equal to 1 would be rejected.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Simplify (x² − 9)/(x + 3), stating any restriction.",
      steps: [
        {
          move: "Factorise the numerator as a difference of squares: (x − 3)(x + 3).",
          why:
            "The numerator has no common factor until it is written as a product. The difference of squares pattern gives the two factors directly.",
        },
        {
          move: "Cancel the common factor x + 3, leaving x − 3.",
          why:
            "The same factor appears in the numerator and denominator, so it divides to 1. This is valid only where the factor is not zero.",
        },
        {
          move: "State x ≠ −3, because the original denominator is zero there.",
          why:
            "The simplified expression is defined at −3, but the original fraction is not. The restriction records the original domain.",
        },
      ],
      answer: "x − 3, with x ≠ −3.",
    },
    {
      id: "w2",
      prompt: "Write 1/x + 1/(x + 1) as a single fraction.",
      steps: [
        {
          move: "The common denominator is x(x + 1), the product of the distinct factors.",
          why:
            "Each denominator is missing the other factor. Multiplying by that factor creates a common denominator without changing the value.",
        },
        {
          move: "Rewrite each fraction: (x + 1)/(x(x + 1)) + x/(x(x + 1)).",
          why:
            "The first numerator is multiplied by x + 1 and the second by x. The denominators are now identical.",
        },
        {
          move: "Add the numerators: x + 1 + x = 2x + 1, so the result is (2x + 1)/(x(x + 1)).",
          why:
            "Only the numerators add; the denominator stays as the common denominator. The expression is undefined at x = 0 and x = −1.",
        },
      ],
      answer: "(2x + 1)/(x(x + 1)), with x ≠ 0 and x ≠ −1.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "(x² − 9)/(x + 3) simplifies to x − 3 by cancelling the 9 and the 3.",
      whyItFails:
        "Cancelling individual terms is not valid because division distributes over a product, not over a sum or difference. The numerator must be factorised first, and the common factor is x + 3, not the number 3. At x = 1 the original fraction is −2, and the correct simplification x − 3 is also −2; cancelling 9 and 3 term by term would give 1/3 − 3, which is not equal to −2.",
      correction:
        "Factorise the numerator and denominator completely, then cancel whole factors. Never cancel a term across a plus or minus sign.",
      contrast: {
        wrong: "(x² − 9)/(x + 3) = x²/3 − 3",
        right: "(x² − 9)/(x + 3) = x − 3, x ≠ −3",
      },
    },
    {
      id: "m2",
      belief: "Multiplying both sides of an equation by a denominator cannot change the solution set.",
      whyItFails:
        "Multiplying by an expression that can be zero can introduce a value that makes the original equation undefined. For example, multiplying by x − 2 can produce x = 2 as a candidate, but the original fraction may have a zero denominator there. The new equation is not equivalent at that point.",
      correction:
        "Record the values that make each denominator zero, solve the cleared equation, then reject any candidate in that excluded set. Check in the original equation.",
      contrast: {
        wrong: "Multiply by x − 2 and accept every solution.",
        right: "Multiply by x − 2, solve, then reject x = 2 because the original is undefined there.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Simplify (x² − 4)/(x − 2).",
      hint: "Factorise the numerator as a difference of squares.",
      answer: "x + 2, with x ≠ 2.",
      feedback: {
        correct: "You factorised and cancelled the whole factor, then stated the restriction.",
        incorrect:
          "The numerator is (x − 2)(x + 2), so the fraction simplifies to x + 2 for x ≠ 2. Do not cancel the 4 and 2 separately.",
      },
    },
    {
      id: "p2",
      prompt: "Write 1/x + 1/(x − 1) as one fraction.",
      hint: "The common denominator is x(x − 1).",
      answer: "(2x − 1)/(x(x − 1)), with x ≠ 0, 1.",
      feedback: {
        correct: "You built the common denominator and added the numerators.",
        incorrect:
          "The numerators are (x − 1) and x, giving 2x − 1 over x(x − 1). The denominator is not x + (x − 1).",
      },
    },
    {
      id: "p3",
      prompt: "Solve 4/(x + 2) = 2 and check the domain.",
      hint: "Multiply both sides by x + 2, then check that the result is not −2.",
      answer: "4 = 2(x + 2), so x = 0. The denominator is 2, so the solution is valid.",
      feedback: {
        correct: "You solved the cleared equation and checked the denominator.",
        incorrect:
          "Multiplying gives 4 = 2x + 4, so x = 0. The denominator at x = 0 is 2, not zero, so the solution is valid.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Simplify (x² − 9)/(x + 3), stating the restriction.",
      modelAnswer: "x − 3, x ≠ −3",
      marking: [
        "Factorises the numerator as (x − 3)(x + 3).",
        "Cancels the common factor and excludes x = −3.",
      ],
      check: { accepted: ["x - 3, x ≠ -3", "x − 3, x ≠ −3", "x-3", "x − 3"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Write 1/x + 1/(x + 1) as a single fraction.",
      modelAnswer: "(2x + 1)/(x(x + 1))",
      marking: [
        "Uses the common denominator x(x + 1).",
        "Adds the numerators to get 2x + 1.",
      ],
      check: {
        accepted: [
          "(2x + 1)/(x(x + 1))",
          "(2x+1)/(x(x+1))",
          "(2x + 1)/(x(x + 1)), x ≠ 0, −1",
        ],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why cancelling a common factor in an algebraic fraction can create a domain restriction, and why a solution obtained after multiplying by a denominator must be checked.",
      modelAnswer:
        "Cancelling removes a factor that may be zero. The simplified expression is defined at that value, but the original fraction is not, so the value must be excluded. Multiplying an equation by a denominator can introduce a candidate that makes the denominator zero; the cleared equation is not equivalent there. Both issues are handled by recording the excluded values and checking candidates in the original equation.",
      marking: [
        "Explains that the cancelled factor can be zero.",
        "States that the original expression is undefined at that value.",
        "Connects multiplication by a denominator to extraneous candidates and checking.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A rate model gives the time for a journey as t = 120/(v − 5), where v is the speed in km/h. Explain the domain restriction, find the speed that gives t = 3 hours, and explain why v = 5 is not a solution even if a calculation seems to approach it.",
      whyItTransfers:
        "The lesson simplifies and solves algebraic fractions. The rate model gives the restriction a physical meaning (zero denominator means division by zero speed difference), so the learner must connect the algebra to the context and check the solution.",
      answer:
        "The denominator cannot be zero, so v ≠ 5. Set 120/(v − 5) = 3: 120 = 3(v − 5), so v − 5 = 40 and v = 45 km/h. At v = 5 the model divides by zero and has no finite time; the expression grows without bound as v approaches 5, which is a breakdown of the model, not a journey time.",
      marking: [
        "States v ≠ 5 and explains the zero denominator.",
        "Solves the equation to get 45 km/h.",
        "Explains that v = 5 makes the model undefined rather than giving a finite time.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What must you do before cancelling terms in an algebraic fraction?",
      answer: "Factorise the numerator and denominator completely.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is the common denominator of 1/(x + 1) and 1/(x + 1)²?",
      answer: "(x + 1)², because it already contains the first denominator as a factor.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why can multiplying by a denominator introduce a false solution?",
      answer:
        "The multiplier can be zero at a candidate value, making the original fraction undefined while the cleared equation still holds.",
      when: "month-later",
    },
  ],
  summary: [
    "Factorise before cancelling; cancel whole factors, never individual terms.",
    "Record the values that make a denominator zero and exclude them from the domain.",
    "Build a common denominator from the distinct factors when adding or subtracting.",
    "After multiplying through an equation, check candidates in the original to reject extraneous solutions.",
  ],
});

export const MATHS_ITERATION = defineGapLesson({
  conceptId: "iteration",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: iterative methods for solving equations",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for numerical iteration. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Use a rearrangement x = g(x) to generate a sequence of approximations from a starting value.",
      evidence:
        "Starting from x₀ = 1 with xₙ₊₁ = (xₙ + 5)/2, the learner computes x₁ = 3 and x₂ = 4.",
    },
    {
      statement:
        "Explain what convergence means and how to recognise it from successive values.",
      evidence:
        "The learner states that the values settle toward a limit when the differences shrink, and distinguishes that from oscillation or divergence.",
    },
    {
      statement:
        "Use iteration to solve an equation to a stated accuracy and check the result by substitution.",
      evidence:
        "The learner iterates to a root of x³ + x = 20 and verifies the final value in the original equation rather than only in the rearrangement.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["quadratics", "functions"],
    check: [
      {
        id: "d1",
        question: "What is a function, and what does f(3) mean?",
        answer:
          "A function maps an input to one output; f(3) is the output when the input is 3.",
        targets: ["functions"],
      },
      {
        id: "d2",
        question: "Why can some equations not be solved by factorising?",
        answer:
          "They may have no rational roots or no simple factorisation, so numerical methods approximate the solution instead.",
        targets: ["quadratics"],
      },
    ],
  },
  introduction: {
    hook:
      "A calculator's solve button does not factorise every equation. It starts with a guess, evaluates a rearrangement, feeds the result back in, and repeats until the digits stop changing. The method is simple enough to do by hand for a few steps, and its behaviour reveals whether the rearrangement is stable or runs away.",
    why:
      "Iteration is numerical problem solving rather than symbolic manipulation. The equation is rewritten as x = g(x), and the output becomes the next input. A good rearrangement converges quickly; an unstable one can oscillate or diverge even when the same root exists. This lesson uses a simple linear rearrangement to make convergence visible, then applies the idea to an equation with no neat factorisation.",
  },
  explanation: [
    {
      heading: "A rearrangement turns a root into a fixed point",
      paragraphs: [
        "If x is a solution of an equation, it satisfies x = g(x) for some rearrangement. Starting with x₀, compute x₁ = g(x₀), then x₂ = g(x₁), and so on. A fixed point of g is a value that returns itself, which is exactly a root of the original equation. The iteration is a search for that fixed point.",
        "Different rearrangements of the same equation can behave differently. For x² − x − 2 = 0, x = (x + 2)/x is one rearrangement and x = x² − 2 is another. The first may converge from a suitable start while the second diverges. The algebra is equivalent at the root, but the iteration's stability depends on the rearrangement. Choosing a good one is part of the method, not a detail after it.",
      ],
    },
    {
      heading: "Convergence is a shrinking gap",
      paragraphs: [
        "A sequence converges when successive values get closer to a limit. On a calculator, the digits settle: 3, 4, 4.5, 4.75, … approaches 5. The differences 1, 0.5, 0.25, 0.125 shrink by a constant factor. That factor is related to the gradient of g near the fixed point; a gradient smaller than one in magnitude usually contracts the gap.",
        "Divergence is the opposite: the values move farther apart or grow without bound. Oscillation can persist between two values without settling. Checking several steps is therefore part of the method, not an optional extra. A single output that looks stable may be the first step of a slow drift.",
      ],
    },
    {
      heading: "Accuracy and checking",
      paragraphs: [
        "Iteration gives an approximation, so the answer must be reported to the accuracy the question asks for. Stopping when two successive values round to the same number is a practical criterion, but the final value should be substituted into the original equation. A value that satisfies the rearrangement but not the original is either a different root or an arithmetic slip.",
        "The starting value matters. A rearrangement can have several fixed points, and different starts can converge to different ones. A sketch or a sign change helps choose a start near the root you want. The method does not replace understanding the equation; it refines a guess. A poor start can converge to the wrong root even when the rearrangement itself is stable.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The iteration feeds each output back as the next input. The fixed point is the value that does not change.",
      notation: "xₙ₊₁ = g(xₙ); at the limit, x = g(x)",
      caption:
        "For g(x) = (x + 5)/2 and x₀ = 1, the sequence is 1, 3, 4, 4.5, 4.75, … approaching 5.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The equation x³ + x = 20 can be rearranged as x = cube root of 20 − x. The iteration evaluates that rearrangement repeatedly.",
      notation: "xₙ₊₁ = ∛(20 − xₙ)",
      caption:
        "Starting at 2 gives about 2.621, then 2.585, then 2.596, settling near 2.59. The exact value is not a simple surd.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "A fixed point is where the graph of y = g(x) meets the line y = x. A staircase or cobweb diagram shows the convergence visually.",
      notation: "g(x) = (x + 5)/2; fixed point at x = 5",
      caption:
        "The line y = x and the line y = (x + 5)/2 cross at 5. Starting at 1, each step moves toward the crossing.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Use xₙ₊₁ = (xₙ + 5)/2 with x₀ = 1 to find x₁ and x₂.",
      steps: [
        {
          move: "Substitute x₀ = 1: x₁ = (1 + 5)/2 = 3.",
          why:
            "The output of the rearrangement becomes the next input. The subscript records the step, not a power.",
        },
        {
          move: "Substitute x₁ = 3: x₂ = (3 + 5)/2 = 4.",
          why:
            "The same rule is applied to the new value. The sequence is defined recursively, so each term depends on the previous one.",
        },
        {
          move: "The values are increasing toward 5, the fixed point where x = (x + 5)/2.",
          why:
            "Solving the fixed-point equation gives x = 5. The iteration approaches it because the gap halves each step.",
        },
      ],
      answer: "x₁ = 3 and x₂ = 4, approaching the fixed point 5.",
    },
    {
      id: "w2",
      prompt:
        "Use xₙ₊₁ = ∛(20 − xₙ) from x₀ = 2 to find x₁ and x₂, and comment on convergence.",
      steps: [
        {
          move: "x₁ = ∛(20 − 2) = ∛18 ≈ 2.621.",
          why:
            "Substitute the starting value into the rearrangement. The cube root is the inverse of cubing, which is why it isolates x.",
        },
        {
          move: "x₂ = ∛(20 − 2.621) = ∛17.379 ≈ 2.591.",
          why:
            "The second value uses the first approximation. The change from 2.621 to 2.591 is smaller than the first step.",
        },
        {
          move: "The values are settling near 2.59, so the iteration appears to converge to that root.",
          why:
            "Shrinking differences are the practical sign of convergence. The final value should be checked in x³ + x = 20.",
        },
      ],
      answer: "x₁ ≈ 2.621 and x₂ ≈ 2.591, converging near 2.59.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Any rearrangement of an equation will converge to its root.",
      whyItFails:
        "Convergence depends on the rearrangement's behaviour near the fixed point. Some rearrangements move away from the root or oscillate. The equation is equivalent at the root, but the iteration is a dynamical process, and different processes can have different stability.",
      correction:
        "Test several steps and check whether the differences shrink. If they grow or oscillate, choose a different rearrangement or a better starting value.",
      contrast: {
        wrong: "The rearrangement is algebraically correct, so it must converge.",
        right: "The rearrangement is correct at the root, but its iteration may still diverge.",
      },
    },
    {
      id: "m2",
      belief: "Two successive values that round to the same number prove the answer is exact.",
      whyItFails:
        "Rounding can hide a small but growing error, and a slow convergence can produce identical rounded values while the true value is still moving. The agreement is evidence of stability at the displayed precision, not a proof of exactness.",
      correction:
        "Substitute the value into the original equation and state the accuracy. Continue until the change is smaller than the required tolerance, not merely invisible at the current display.",
      contrast: {
        wrong: "The calculator shows 2.59 twice, so 2.59 is exact.",
        right: "The values agree to two decimal places; check the residual in the original equation.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "For xₙ₊₁ = (xₙ + 3)/2 with x₀ = 1, find x₁ and x₂.",
      hint: "Substitute the previous value, not the original, at each step.",
      answer: "x₁ = 2 and x₂ = 2.5.",
      feedback: {
        correct: "You fed each output back into the rule.",
        incorrect:
          "x₁ = (1 + 3)/2 = 2; then x₂ = (2 + 3)/2 = 2.5. Do not reuse x₀ for the second step.",
      },
    },
    {
      id: "p2",
      prompt: "What does it mean for an iteration to converge?",
      hint: "Look at the differences between successive values.",
      answer:
        "The successive values approach a fixed limit, with the differences shrinking toward zero.",
      feedback: {
        correct: "You described convergence as a limit, not just a single stable-looking value.",
        incorrect:
          "Convergence means the sequence settles toward a limit; the gaps between successive terms become smaller and approach zero.",
      },
    },
    {
      id: "p3",
      prompt: "Why should an iterative solution be checked in the original equation?",
      hint: "The rearrangement can have several fixed points or an arithmetic slip.",
      answer:
        "The iteration may converge to a different root or accumulate a slip; substituting into the original confirms it satisfies the equation asked.",
      feedback: {
        correct: "You treated the iteration as an approximation needing verification.",
        incorrect:
          "A fixed point of the rearrangement should solve the original, but rounding and multiple roots mean the final value must be substituted back.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "For xₙ₊₁ = (xₙ + 5)/2 with x₀ = 1, what is x₁?",
      modelAnswer: "3",
      marking: [
        "Substitutes x₀ = 1 into the rearrangement.",
        "Computes (1 + 5)/2 = 3.",
      ],
      check: { accepted: ["3", "three"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Using the same iteration, what is x₂?",
      modelAnswer: "4",
      marking: [
        "Uses x₁ = 3, not x₀, in the next step.",
        "Computes (3 + 5)/2 = 4.",
      ],
      check: { accepted: ["4", "four"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain what convergence means for an iteration and why a rearrangement can fail to converge even when it is algebraically equivalent to the original equation at the root.",
      modelAnswer:
        "Convergence means successive values approach a fixed limit, with the differences shrinking. A rearrangement has the same root, but the iteration's behaviour depends on how the function g moves a value near the root. If the gradient of g is too large in magnitude, the gap grows or oscillates instead of shrinking, so the sequence diverges even though the fixed point exists.",
      marking: [
        "Defines convergence as approaching a limit with shrinking differences.",
        "Distinguishes algebraic equivalence at the root from the iteration's stability.",
        "Explains that the behaviour of the rearrangement near the root controls convergence.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A population model uses pₙ₊₁ = 1.8pₙ(1 − pₙ/1000). Starting from 100, compute two steps and explain whether the population appears to be settling or changing rapidly. What does this show about iteration in a non-linear model?",
      whyItTransfers:
        "The lesson iterates a convergent linear rearrangement. The population model is non-linear and can oscillate or become chaotic, so the learner must compute carefully and interpret the sequence rather than assume convergence.",
      answer:
        "p₁ = 1.8 × 100 × (1 − 0.1) = 162. p₂ = 1.8 × 162 × (1 − 0.162) = 244.4 (approximately). The population is growing quickly, not settling; two steps are not enough to identify a long-term pattern, and non-linear iterations can converge, oscillate or behave chaotically depending on the parameter.",
      marking: [
        "Computes p₁ = 162 and p₂ ≈ 244.4.",
        "Observes that the values are changing rapidly rather than converging.",
        "Explains that non-linear iteration can have several behaviours, so more steps or analysis are needed.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is a fixed point of an iteration?",
      answer: "A value x such that x = g(x), so the next value is the same.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is a practical sign that an iteration is converging?",
      answer: "Successive values get closer and their differences shrink.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why can two rearrangements of the same equation behave differently?",
      answer:
        "They define different functions g, whose behaviour near the root determines whether the iteration contracts or diverges.",
      when: "month-later",
    },
  ],
  summary: [
    "An iteration rewrites an equation as x = g(x) and feeds each output back as the next input.",
    "A fixed point of g is a root of the original equation.",
    "Convergence means successive values approach a limit; divergence or oscillation means the rearrangement is unsuitable.",
    "Check the final approximation in the original equation and report it to the required accuracy.",
  ],
});
