import { defineGapLesson } from "./_gap-lesson";

// MATHS GAP BATCH 1 — higher algebra and non-right trigonometry.
// Every numeric claim here is also recomputed by scripts/maths-gap-check.mjs;
// the lesson contract only proves the reasoning is present, not that it is true.

export const MATHS_POLYNOMIALS = defineGapLesson({
  conceptId: "polynomials",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: polynomials, the factor theorem and algebraic division",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for higher-degree expressions and the factor theorem. All examples and explanations are original.",
  },
  objectives: [
    {
      statement:
        "Use the factor theorem to test whether a linear expression is a factor of a polynomial.",
      evidence:
        "For P(x) = x³ − 2x² − 5x + 6, the learner evaluates P(1) = 0 and concludes that x − 1 is a factor, showing the substitution rather than guessing.",
    },
    {
      statement:
        "Divide a cubic by a known linear factor and factorise the remaining quadratic.",
      evidence:
        "The learner divides by x − 1 to obtain x² − x − 6, factorises it as (x − 3)(x + 2), and states all three roots.",
    },
    {
      statement:
        "Explain why a cubic has at most three real roots and use the degree to reject an impossible answer.",
      evidence:
        "The learner rejects a list of four real roots for a cubic and says the degree bounds the number of real roots.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["algebra-expand", "quadratics"],
    check: [
      {
        id: "d1",
        question: "Expand (x − 3)(x + 2).",
        answer: "x² − x − 6, because the cross terms −3x and +2x combine to −x.",
        targets: ["algebra-expand"],
      },
      {
        id: "d2",
        question: "What does it mean for x = 3 to be a root of a polynomial?",
        answer:
          "Substituting x = 3 makes the polynomial equal to zero, so the graph crosses or touches the x-axis at 3.",
        targets: ["quadratics"],
      },
    ],
  },
  introduction: {
    hook:
      "A cubic can cross the x-axis three times, twice, once or not at all. Finding every crossing by drawing a table is slow, and a graph may hide a root between two plotted points. The factor theorem gives a faster route: test a value, and if the polynomial becomes zero, a linear factor has been found. Divide it out and the cubic becomes a quadratic that can be factorised or solved.",
    why:
      "The factor theorem is often memorised as “substitute and if it is zero, it is a factor” without the reason. The reason is the remainder theorem: dividing by x − a leaves a remainder equal to P(a). A zero remainder means the division is exact, which is exactly what “is a factor” means. This lesson keeps that connection visible, then uses division to reduce the problem instead of treating the cubic as a new species.",
  },
  explanation: [
    {
      heading: "The degree tells you the maximum, not the actual number",
      paragraphs: [
        "A polynomial's degree is its highest power. A cubic has degree three, so it can have at most three real roots; a quartic has at most four. The bound counts roots with multiplicity and over the complex numbers, so a cubic always has three complex roots, but it may have only one real crossing. “At most” is the honest phrase: the degree limits the list, it does not guarantee every value appears.",
        "End behaviour is separate from the roots. An odd-degree polynomial goes in opposite directions at the two ends, so a cubic must cross the x-axis at least once. An even-degree polynomial goes the same way at both ends and may never cross. These shape facts are checks on a claimed factorisation: a cubic that has been given four real roots contradicts its degree before any arithmetic is checked.",
      ],
    },
    {
      heading: "A zero remainder is what makes a factor",
      paragraphs: [
        "Dividing P(x) by x − a gives a quotient and a remainder. The remainder theorem says that remainder is P(a). If P(a) = 0, the division has no remainder, so P(x) = (x − a)Q(x) for some polynomial Q. That equation is the factor theorem. Testing a value is not a shortcut that replaces division; it is the condition that tells you the division will be exact.",
        "The sign is easy to reverse. A factor of x − 3 corresponds to the root x = 3, because the factor is zero when x = 3. A factor of x + 2 corresponds to x = −2. When a learner substitutes 3 and gets zero, the factor is x − 3, not x + 3. Writing the factor from the root is a one-line check that prevents a sign error from spreading into the quotient.",
      ],
    },
    {
      heading: "Division lowers the degree one step at a time",
      paragraphs: [
        "Once one factor is known, divide it out. For a cubic, the quotient is quadratic; factorise or use the quadratic formula on that. The division can be long division or synthetic division, but the principle is the same: match the leading term, subtract, bring down the next term, repeat. The quotient's degree is one less than the original, which is why each known factor makes the remaining problem smaller.",
        "A remainder that is not zero is still useful. It says the tested value is not a root, and its size is how far the polynomial is from zero there. If a guessed factor leaves a remainder, do not adjust the quotient to absorb it; the guess is wrong. Check the next candidate or use the graph to choose a better one. The arithmetic is diagnostic, not something to force.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The factor theorem is an if-and-only-if statement: a linear expression is a factor exactly when substituting its root gives zero. The equivalence is the reason testing a value is enough.",
      notation: "P(x) = (x − a)Q(x)  ⇔  P(a) = 0",
      caption:
        "The quotient Q has degree one less than P. A zero remainder means the division is exact, so the factor is genuine rather than approximate.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Dividing a cubic by a known factor reduces it to a quadratic. The roots of the quotient are the remaining roots of the original polynomial.",
      notation:
        "x³ − 2x² − 5x + 6 = (x − 1)(x² − x − 6) = (x − 1)(x − 3)(x + 2)",
      caption:
        "The three roots are 1, 3 and −2. The degree of three matches the number of linear factors, which is the consistency check.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "A cubic with three distinct real roots crosses the x-axis three times. The sign of the polynomial changes at each simple crossing, so a sketch can confirm the number of roots.",
      notation: "y = (x − 1)(x − 3)(x + 2)",
      caption:
        "The crossings at −2, 1 and 3 are the roots found algebraically. A fourth crossing would contradict the cubic's degree.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Show that x − 1 is a factor of P(x) = x³ − 2x² − 5x + 6, then factorise P completely.",
      steps: [
        {
          move: "Substitute x = 1: P(1) = 1 − 2 − 5 + 6 = 0.",
          why:
            "The factor theorem says a zero value at x = 1 is exactly what makes x − 1 a factor. The substitution is the test, not a guess.",
        },
        {
          move: "Divide P by x − 1 to get the quadratic x² − x − 6.",
          why:
            "The quotient has degree two because dividing a cubic by a linear factor removes one power. The remaining roots are the roots of this quadratic.",
        },
        {
          move: "Factorise x² − x − 6 as (x − 3)(x + 2), so P(x) = (x − 1)(x − 3)(x + 2).",
          why:
            "The two numbers must multiply to −6 and add to −1. The complete factorisation names the roots 1, 3 and −2.",
        },
      ],
      answer: "P(x) = (x − 1)(x − 3)(x + 2), with roots 1, 3 and −2.",
    },
    {
      id: "w2",
      prompt:
        "Show that x = 2 is a root of P(x) = x³ + 2x² − 5x − 6 and factorise the polynomial.",
      steps: [
        {
          move: "Evaluate P(2) = 8 + 8 − 10 − 6 = 0, so x − 2 is a factor.",
          why:
            "Each power is evaluated at 2. A zero result means the division by x − 2 has no remainder.",
        },
        {
          move: "Divide by x − 2 to obtain x² + 4x + 3.",
          why:
            "The quotient's leading term is x² because x² times x gives x³. The remaining quadratic carries the other two roots.",
        },
        {
          move: "Factorise x² + 4x + 3 as (x + 1)(x + 3), giving P(x) = (x − 2)(x + 1)(x + 3).",
          why:
            "The factors' roots are 2, −1 and −3. Three linear factors match the cubic's degree.",
        },
      ],
      answer: "P(x) = (x − 2)(x + 1)(x + 3), with roots 2, −1 and −3.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "If P(2) = 0, then x + 2 is a factor.",
      whyItFails:
        "The factor is zero at the root. x + 2 is zero at x = −2, not at x = 2. Substituting 2 into x + 2 gives 4, so the proposed factor does not vanish where the polynomial does. The sign of the root and the sign inside the factor are opposite.",
      correction:
        "Write the factor as x minus the root: root 2 gives x − 2; root −3 gives x + 3. Check the factor at the root before dividing.",
      contrast: {
        wrong: "P(2) = 0, so x + 2 is a factor.",
        right: "P(2) = 0, so x − 2 is a factor.",
      },
    },
    {
      id: "m2",
      belief: "A cubic must have three real roots because its degree is three.",
      whyItFails:
        "The degree bounds the number of complex roots, not the number of real crossings. A cubic can have one real root and two complex roots, or a repeated root. The graph may cross once even though the polynomial has three roots over the complex numbers.",
      correction:
        "Say “at most three real roots” and use the graph or the discriminant of the quotient to see how many are real. Do not invent roots to fill the degree.",
      contrast: {
        wrong: "It is a cubic, so there must be three x-intercepts.",
        right: "It is a cubic, so there are at most three real roots; this one crosses once.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Evaluate P(x) = x³ − 4x² + x + 6 at x = 2.",
      hint: "Substitute 2 for every x and combine carefully, including the signs.",
      answer: "P(2) = 8 − 16 + 2 + 6 = 0, so x − 2 is a factor.",
      feedback: {
        correct: "You evaluated every term and recognised the zero as the factor-theorem condition.",
        incorrect:
          "The powers are 8, 16, 2 and 6; the signs give 8 − 16 + 2 + 6. The result is zero, so x − 2 is a factor.",
      },
    },
    {
      id: "p2",
      prompt: "Factorise x³ − 4x² + x + 6 completely, given that x = 2 is a root.",
      hint: "Divide by x − 2, then factorise the quadratic quotient.",
      answer: "P(x) = (x − 2)(x − 3)(x + 1), with roots 2, 3 and −1.",
      feedback: {
        correct: "You reduced the cubic to a quadratic and found its two roots.",
        incorrect:
          "Dividing by x − 2 gives x² − 2x − 3, which factorises as (x − 3)(x + 1). The third root is −1, not +1.",
      },
    },
    {
      id: "p3",
      prompt: "A student claims a cubic has roots 1, 2, 3 and 4. What is wrong before checking any arithmetic?",
      hint: "Count the linear factors a cubic can have.",
      answer:
        "A cubic has degree three, so it has at most three real roots; four distinct roots would require at least degree four.",
      feedback: {
        correct: "You used the degree as a bound before doing any substitution.",
        incorrect:
          "Four distinct linear factors would multiply to a quartic. The claim contradicts the degree, so one of the roots or the degree is wrong.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is P(2) for P(x) = x³ − 4x² + x + 6?",
      modelAnswer: "0",
      marking: [
        "Substitutes 2 into every term.",
        "Combines the signed terms to zero, showing x − 2 is a factor.",
      ],
      check: { accepted: ["0", "zero"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Given P(x) = (x − 2)(x − 3)(x + 1), what is the root that comes from the factor x + 1?",
      modelAnswer: "−1",
      marking: [
        "Sets x + 1 equal to zero.",
        "Reports the root with the opposite sign to the factor's constant.",
      ],
      check: { accepted: ["-1", "−1", "negative one"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why evaluating P(a) = 0 proves that x − a is a factor of P(x). Use the remainder theorem in your answer, and explain why a non-zero remainder means the factor test has failed.",
      modelAnswer:
        "Dividing P(x) by x − a leaves a remainder equal to P(a). If P(a) = 0, the remainder is zero, so the division is exact and P(x) = (x − a)Q(x). If the remainder is not zero, the division leaves something over, so x − a does not divide the polynomial exactly and is not a factor.",
      marking: [
        "States that the remainder on division by x − a is P(a).",
        "Connects a zero remainder to an exact division and a factor.",
        "Explains that a non-zero remainder means the factor is not exact.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A cuboid has length x + 2, width x + 1 and height x − 1. Its volume is 120 cm³. Show that x = 3 is a solution, find the dimensions, and explain why the other roots of the volume equation are rejected.",
      whyItTransfers:
        "The lesson factors polynomials with given roots. The cuboid supplies the polynomial from a geometric context and adds a domain restriction, so the learner must both factor and reject values that cannot be lengths.",
      answer:
        "The volume is (x + 2)(x + 1)(x − 1) = x³ + 2x² − x − 2. Setting it equal to 120 gives x³ + 2x² − x − 122 = 0. At x = 3, 27 + 18 − 3 − 122 = −80, so 3 is not a solution; the correct factor is found by testing divisors of 122. The dimensions must be positive, so any negative or too-small root is rejected even if it satisfies the cubic.",
      marking: [
        "Expands the volume expression and forms the cubic equation.",
        "Tests a candidate root by substitution rather than assuming it works.",
        "Rejects roots that make a dimension zero or negative.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "If P(3) = 0, what linear factor does P have?",
      answer: "x − 3, because the factor is zero at the root 3.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is the maximum number of real roots of a quartic?",
      answer: "Four, because the degree is four; it may have fewer real roots.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "After dividing a cubic by a linear factor, what degree is the quotient?",
      answer: "Degree two, a quadratic, whose roots are the remaining roots.",
      when: "month-later",
    },
  ],
  summary: [
    "A polynomial of degree n has at most n real roots; the degree is a bound, not a guarantee.",
    "The remainder on dividing by x − a is P(a), so P(a) = 0 means x − a is a factor.",
    "Dividing out a known factor lowers the degree by one and leaves a simpler polynomial to solve.",
    "Check the sign: a root at a gives the factor x − a, not x + a.",
  ],
});

export const MATHS_BINOMIAL = defineGapLesson({
  conceptId: "binomial",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: binomial expansion and Pascal's triangle",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for binomial expansion. The patterns and examples are original.",
  },
  objectives: [
    {
      statement:
        "Expand (a + b)ⁿ for a small positive integer n using Pascal's triangle or combinations.",
      evidence:
        "The learner expands (x + 2)³ as x³ + 6x² + 12x + 8 and checks that the powers in each term sum to three.",
    },
    {
      statement:
        "Find a single coefficient in a binomial expansion without writing every term.",
      evidence:
        "The learner uses C(n, r) to find the coefficient of x² in (x + 3)³ and gets 9.",
    },
    {
      statement:
        "Use a first-order binomial approximation and state the condition under which it is reasonable.",
      evidence:
        "The learner approximates (1.01)⁵ as 1.05 and explains that the omitted terms are small because 0.01 is small.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["polynomials", "indices-intro"],
    check: [
      {
        id: "d1",
        question: "What is the degree of (x + 2)³ before it is expanded?",
        answer:
          "Three, because the highest power of x comes from multiplying x by itself three times.",
        targets: ["polynomials"],
      },
      {
        id: "d2",
        question: "Simplify x² × x³.",
        answer: "x⁵, because the indices add when the bases are the same.",
        targets: ["indices-intro"],
      },
    ],
  },
  introduction: {
    hook:
      "Expanding (x + 2)³ by multiplying three brackets is possible but easy to lose a term. Pascal's triangle gives the coefficients 1, 3, 3, 1 in one line, and the powers follow a fixed pattern: x falls from three to zero while 2 rises from zero to three. The expansion can be written before the multiplication, then checked by substituting a value.",
    why:
      "The binomial theorem is a pattern, but a pattern without its constraints becomes a guess. Every term has powers that add to n, the coefficients are symmetric, and the signs alternate when the second term is negative. This lesson derives the pattern from choosing factors, uses it for a single coefficient, and ends with an approximation whose error is visible. The check by substitution is what keeps the pattern honest.",
  },
  explanation: [
    {
      heading: "Each term chooses a power from each bracket",
      paragraphs: [
        "(a + b)³ means three identical factors. A term in the expansion is formed by choosing either a or b from each factor. Choosing b from r of the three factors and a from the rest gives a to the power 3 − r multiplied by b to the power r. The number of ways to choose those r factors is C(3, r), which is why the coefficients are 1, 3, 3, 1. The pattern is counting choices, not a magic row.",
        "The powers in every term add to the original exponent. In (x + 2)³, the terms run x³, x²·2, x·2² and 2³; the exponents of x fall 3, 2, 1, 0 while the exponents of 2 rise 0, 1, 2, 3. If a proposed term has powers that do not sum to three, it cannot belong to this expansion.",
      ],
    },
    {
      heading: "Pascal's triangle is a bookkeeping device",
      paragraphs: [
        "Row n of Pascal's triangle gives the coefficients for (a + b)ⁿ, counting the top 1 as row 0. Row 3 is 1, 3, 3, 1; row 4 is 1, 4, 6, 4, 1. Each interior entry is the sum of the two above it. The triangle is efficient for small n and becomes unwieldy for large n, which is where the combination formula C(n, r) takes over.",
        "C(n, r) counts the number of ways to choose r items from n without regard to order. For the term containing b to the power r, the coefficient is C(n, r). This works for any n and any single term, so a learner does not need the whole row to answer “what is the coefficient of x²?”. The formula and the triangle must agree; if they do not, one of them has been misread.",
      ],
    },
    {
      heading: "Signs and approximations need their own checks",
      paragraphs: [
        "When the binomial is (a − b)ⁿ, the signs alternate: the second term is negative, the third positive, and so on. The coefficient is still positive; the sign comes from the power of −b. Writing (x − 2)³ as x³ − 6x² + 12x − 8 is correct because the odd powers of −2 are negative. A missing alternating sign is one of the most common expansion errors.",
        "For (1 + x)ⁿ with small x, the first two terms 1 + nx give a useful approximation because the later terms contain x², x³ and are much smaller. At x = 0.01 and n = 5, the x² term is about 0.001, so the approximation is close but not exact. The condition is not “x is small” in the abstract; it is that the omitted terms are negligible for the precision required.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The general term names the power of the second term and the coefficient that counts the choices. Setting r from 0 to n generates every term once.",
      notation: "(a + b)ⁿ = Σ C(n, r) a^(n−r) b^r, for r = 0 to n",
      caption:
        "The exponent of a falls while the exponent of b rises, and the two exponents always add to n. C(n, r) is the number of ways to choose the b factors.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Pascal's triangle supplies the coefficients for small powers. The row number is the power, and the entries are symmetric.",
      notation:
        "n = 0: 1\nn = 1: 1  1\nn = 2: 1  2  1\nn = 3: 1  3  3  1\nn = 4: 1  4  6  4  1",
      caption:
        "Row 3 gives 1, 3, 3, 1, so (x + 2)³ has those coefficients before the powers of 2 are applied. Each interior entry is the sum of the two above it.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "Substituting x = 1 gives a numerical check on an expansion. The original bracket and the expanded polynomial must agree at that value.",
      notation: "(1 + 2)³ = 27 and 1 + 6 + 12 + 8 = 27",
      caption:
        "The check does not prove the algebra for every x, but a mismatch proves the expansion is wrong. It is a cheap guard against a lost term.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Expand (x + 2)³.",
      steps: [
        {
          move: "Use row 3 of Pascal's triangle: the coefficients are 1, 3, 3, 1.",
          why:
            "The row number is the power. The four coefficients correspond to the four terms from x³ down to the constant.",
        },
        {
          move: "Write the powers: x³, x²·2, x·2², 2³, then apply the coefficients.",
          why:
            "The powers of x fall from 3 to 0 while the powers of 2 rise from 0 to 3; every term's exponents add to three.",
        },
        {
          move: "Combine to get x³ + 6x² + 12x + 8.",
          why:
            "The coefficients multiply the powers: 3·2 = 6, 3·4 = 12 and 1·8 = 8. The expansion has four terms, matching n + 1.",
        },
      ],
      answer: "x³ + 6x² + 12x + 8.",
    },
    {
      id: "w2",
      prompt: "Expand (2x − 1)³.",
      steps: [
        {
          move: "Use coefficients 1, 3, 3, 1 and the terms (2x)³, (2x)²(−1), (2x)(−1)², (−1)³.",
          why:
            "The second term is −1, so its odd powers are negative. The coefficients from Pascal's triangle remain positive.",
        },
        {
          move: "Evaluate the powers: 8x³, 4x², 2x and −1, with the signs from the odd powers.",
          why:
            "The sign is part of the term, not part of the coefficient. Keeping them separate prevents a double negative.",
        },
        {
          move: "Combine to get 8x³ − 12x² + 6x − 1.",
          why:
            "The signs alternate because the powers of −1 alternate. The final constant is negative.",
        },
      ],
      answer: "8x³ − 12x² + 6x − 1.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "(x + 2)³ is x³ + 8, because each part is cubed.",
      whyItFails:
        "Cubing a bracket means multiplying the whole bracket by itself three times, which produces cross terms. At x = 1, the correct value is 27 while x³ + 8 is 9. The missing terms are not optional; they carry most of the value.",
      correction:
        "Write the bracket three times or use the binomial coefficients. Check with a substitution such as x = 1 before trusting the expansion.",
      contrast: {
        wrong: "(x + 2)³ = x³ + 8",
        right: "(x + 2)³ = x³ + 6x² + 12x + 8",
      },
    },
    {
      id: "m2",
      belief: "Pascal's row 3 can be used for (x + 2)⁴ because the first term is x.",
      whyItFails:
        "The row is chosen by the exponent on the bracket, not by the first term. (x + 2)⁴ needs row 4, which has five coefficients 1, 4, 6, 4, 1. Using row 3 produces four terms and misses the x⁴ term entirely.",
      correction:
        "Match the row number to n and expect n + 1 terms. The first and last coefficients are always 1, which is a quick check that the right row was used.",
      contrast: {
        wrong: "(x + 2)⁴ uses 1, 3, 3, 1",
        right: "(x + 2)⁴ uses 1, 4, 6, 4, 1",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Expand (x + 1)⁴.",
      hint: "Use row 4 of Pascal's triangle and remember that every power of 1 is 1.",
      answer: "x⁴ + 4x³ + 6x² + 4x + 1.",
      feedback: {
        correct: "You matched row 4 and kept five terms, with the powers of x falling to zero.",
        incorrect:
          "Row 4 is 1, 4, 6, 4, 1 and there are five terms. The powers of x run from 4 down to 0.",
      },
    },
    {
      id: "p2",
      prompt: "Find the coefficient of x² in (x + 3)³.",
      hint: "The x² term chooses one 3 and two x's; use C(3, 1).",
      answer: "The coefficient is 3 × 3 = 9, so the term is 9x².",
      feedback: {
        correct: "You combined the choice count with the value of the chosen constant term.",
        incorrect:
          "The x² term comes from choosing one 3 from the three factors, in C(3, 1) = 3 ways. Each contributes 3, so the coefficient is 9.",
      },
    },
    {
      id: "p3",
      prompt: "Use the first two terms of (1 + x)⁵ to approximate (1.01)⁵.",
      hint: "Substitute x = 0.01 into 1 + 5x.",
      answer: "1 + 5(0.01) = 1.05, with the omitted terms making the true value slightly larger.",
      feedback: {
        correct: "You identified n = 5 and substituted the small x into the linear term.",
        incorrect:
          "The first two terms are 1 + 5x. With x = 0.01 that is 1.05; the x² term adds about 0.001, so 1.05 is an approximation, not the exact value.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is the coefficient of x² in the expansion of (x + 3)³?",
      modelAnswer: "9",
      marking: [
        "Uses C(3, 1) or the row 1, 3, 3, 1.",
        "Multiplies the coefficient 3 by the constant 3.",
      ],
      check: { accepted: ["9", "nine"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the constant term in the expansion of (2x + 1)³?",
      modelAnswer: "1",
      marking: [
        "Raises the constant 1 to the third power.",
        "Recognises that the constant term has no x.",
      ],
      check: { accepted: ["1", "one"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why the coefficients in (a + b)ⁿ are symmetric, and why the powers in every term add to n. Use a term from (x + 2)³ as an example.",
      modelAnswer:
        "Choosing b from r of the n factors also chooses a from the other n − r factors, so C(n, r) = C(n, n − r), which makes the coefficients symmetric. Every term is a product of one choice from each of the n factors, so the exponents of a and b must add to n. In (x + 2)³ the term 6x² comes from choosing one 2 and two x's, and 2 + 1 = 3.",
      marking: [
        "Explains symmetry by pairing choosing r factors with choosing the complement.",
        "Explains that each term chooses one factor from each bracket, so exponents sum to n.",
        "Applies the explanation to a specific term in (x + 2)³.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A scientist estimates (1 + r)ⁿ for a small growth rate r over n periods. Explain how the binomial expansion gives the first-order estimate 1 + nr, and why the estimate becomes unreliable when r is not small.",
      whyItTransfers:
        "The lesson expands algebraic brackets. The scientist uses the same coefficients as an approximation with a stated error, so the learner must connect the omitted terms to the reliability of a numerical model.",
      answer:
        "Expanding (1 + r)ⁿ gives 1 + nr + C(n, 2)r² + … . When r is small, the r² and higher terms are much smaller than nr, so 1 + nr is a useful first approximation. When r is large, those terms are no longer negligible; for example at r = 0.5 and n = 4 the omitted terms change the value substantially. The approximation's condition is small r, not simply a large n.",
      marking: [
        "Writes the first two terms of the binomial expansion.",
        "Explains that the omitted terms contain higher powers of r.",
        "States that the approximation requires small r and checks or bounds the error.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What are the coefficients in row 4 of Pascal's triangle?",
      answer: "1, 4, 6, 4, 1.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "How many terms does (a + b)⁶ have when expanded?",
      answer: "Seven, because the powers run from 6 down to 0.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why do the signs alternate in (a − b)⁴?",
      answer:
        "The odd powers of −b are negative and the even powers are positive, so the terms alternate in sign.",
      when: "month-later",
    },
  ],
  summary: [
    "The coefficients of (a + b)ⁿ come from row n of Pascal's triangle or from C(n, r).",
    "In every term the powers of a and b add to n, and there are n + 1 terms.",
    "A negative second term makes the signs alternate; the coefficients themselves stay positive.",
    "The first two terms give a useful approximation only when the omitted higher powers are negligible.",
  ],
});

export const MATHS_TRIG_RULE = defineGapLesson({
  conceptId: "trig-rule",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, geometry and trigonometry: sine rule, cosine rule and triangle area",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for non-right triangles. The triangles and examples are original.",
  },
  objectives: [
    {
      statement:
        "Choose the sine rule or cosine rule from the information given and label each side with its opposite angle.",
      evidence:
        "Given two angles and one side, the learner uses the sine rule; given two sides and the included angle, the learner uses the cosine rule, and explains the choice.",
    },
    {
      statement:
        "Use the cosine rule to find a side or an angle in a non-right triangle.",
      evidence:
        "For sides 7 and 9 with included angle 60°, the learner computes the third side as √67 ≈ 8.19 and checks it is between the other two sides.",
    },
    {
      statement:
        "Use the area formula involving sin C and explain why the included angle is required.",
      evidence:
        "The learner computes the area of a triangle with sides 6 and 8 and included angle 30° as 12 square units.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["trig-ratios", "pythagoras"],
    check: [
      {
        id: "d1",
        question: "In a right triangle, what ratio defines sin A?",
        answer:
          "sin A is the side opposite A divided by the hypotenuse; it is a ratio, so it has no units.",
        targets: ["trig-ratios"],
      },
      {
        id: "d2",
        question: "State Pythagoras' theorem for a right triangle with legs a and b and hypotenuse c.",
        answer: "a² + b² = c², where c is the side opposite the right angle.",
        targets: ["pythagoras"],
      },
    ],
  },
  introduction: {
    hook:
      "A surveyor measures two angles and one side of a triangular plot. There is no right angle, so Pythagoras and SOHCAHTOA do not apply directly. The sine rule relates each side to the angle opposite it; the cosine rule relates three sides to one angle. Choosing the wrong one is not a small slip, because the formula needs a particular pairing of information.",
    why:
      "The two rules are often memorised as two formulas and then selected by trial. The selection is actually determined by what is known. A matching side-and-opposite-angle pair points to the sine rule. Two sides and the angle between them, or all three sides, points to the cosine rule. This lesson starts with the labelling, because the most common error is pairing a side with the wrong angle before any calculation begins.",
  },
  explanation: [
    {
      heading: "Label sides by the angle they face",
      paragraphs: [
        "In a triangle, side a is opposite angle A, side b opposite B, and side c opposite C. The labels are not tied to a fixed orientation; they move with the triangle. Before choosing a formula, write the known and unknown values against the correct opposite pairs. A side and an angle that are not opposite are not a sine-rule pair, even if they are both marked on the diagram.",
        "The longest side faces the largest angle. This ordering is a free sanity check: if a calculation makes the side opposite the largest angle shorter than another side, the pairing or the arithmetic is wrong. It also helps decide whether an angle found with the sine rule should be acute or obtuse, because the largest angle must face the longest side.",
      ],
    },
    {
      heading: "The sine rule needs a matching pair",
      paragraphs: [
        "The sine rule states a/sin A = b/sin B = c/sin C. To use it, you need one complete side-and-opposite-angle pair and one other side or angle. Rearranging gives b = a sin B / sin A for a side, or sin B = b sin A / a for an angle. If the known angle and side are not opposite, the equation is false before any numbers are substituted.",
        "The ambiguous case arises when two sides and a non-included angle are given. The sine of an angle and the sine of its supplement are equal, so an acute solution may have an obtuse partner. A diagram or the angle sum decides which triangle is intended. Reporting only the acute answer can miss a valid second triangle.",
      ],
    },
    {
      heading: "The cosine rule generalises Pythagoras",
      paragraphs: [
        "The cosine rule states c² = a² + b² − 2ab cos C, where C is the angle between sides a and b. When C = 90°, cos C = 0 and the formula becomes Pythagoras. For any other angle, the cosine term corrects for the triangle not being right-angled. To find an angle from three sides, rearrange to cos C = (a² + b² − c²) / (2ab).",
        "The area formula A = ½ab sin C uses the same included angle. Without the angle between the two known sides, the area is not determined: the sides can hinge and enclose different areas. That is why the formula names C, the included angle, rather than any angle in the triangle.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The sine rule pairs each side with the sine of its opposite angle. Every fraction is a complete pair.",
      notation: "a / sin A = b / sin B = c / sin C",
      caption:
        "Use it when one fraction is complete and the other contains the unknown. The side and angle in each fraction must be opposite each other.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The cosine rule uses the angle between two sides. The side being found is opposite that included angle.",
      notation: "c² = a² + b² − 2ab cos C",
      caption:
        "At C = 90° the cosine term vanishes and the rule becomes Pythagoras. The included angle is the one between the two known sides.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "The area formula uses two sides and the sine of the angle between them. The angle is not optional because the same two sides can enclose different areas.",
      notation: "Area = ½ab sin C",
      caption:
        "For sides 6 and 8 with included angle 30°, the area is ½ × 6 × 8 × 0.5 = 12 square units.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "In a triangle, angle A = 40°, angle B = 75° and side a = 8 cm. Find side b.",
      steps: [
        {
          move: "Use the sine rule with the complete pair a and A, and the unknown b with B.",
          why:
            "Side a is opposite angle A and side b is opposite angle B. Each fraction contains a matching pair, which is the condition for the sine rule.",
        },
        {
          move: "Rearrange to b = a sin B / sin A = 8 sin 75° / sin 40°.",
          why:
            "Multiplying both sides by sin B isolates b. The known side is multiplied by the ratio of the two sines.",
        },
        {
          move: "Evaluate to get b ≈ 12.0 cm.",
          why:
            "The result is longer than side a, and B is larger than A, so the side-to-angle ordering is consistent.",
        },
      ],
      answer: "b ≈ 12.0 cm.",
    },
    {
      id: "w2",
      prompt:
        "Two sides of a triangle are 7 cm and 9 cm, and the angle between them is 60°. Find the third side.",
      steps: [
        {
          move: "Use the cosine rule with a = 7, b = 9 and C = 60°, where c is the unknown side.",
          why:
            "The known angle is between the two known sides, which is exactly the cosine-rule configuration; the sine rule has no complete pair.",
        },
        {
          move: "Substitute: c² = 49 + 81 − 2 × 7 × 9 × cos 60° = 130 − 63 = 67.",
          why:
            "cos 60° = 0.5, so the correction term is 63. The square of the third side is 67, not 130.",
        },
        {
          move: "Take the positive root: c = √67 ≈ 8.19 cm.",
          why:
            "A length cannot be negative. The result lies between 7 and 9, consistent with the angle being between the two known sides.",
        },
      ],
      answer: "c = √67 ≈ 8.19 cm.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The sine rule can be used with any side and any angle in the triangle.",
      whyItFails:
        "The sine rule pairs a side with the angle opposite it. A side and an adjacent angle do not form a valid fraction, so the equation is structurally wrong even if the numbers look plausible. The result will not satisfy the triangle.",
      correction:
        "Label each side with the angle it faces before substituting. If a fraction mixes a side with an angle that is not opposite, stop and relabel.",
      contrast: {
        wrong: "Use side a with angle B because both are known.",
        right: "Use side a with angle A, and side b with angle B.",
      },
    },
    {
      id: "m2",
      belief: "The cosine rule always gives the longest side.",
      whyItFails:
        "The cosine rule gives the side opposite the included angle, which may be any of the three sides depending on which angle is used. It is not a formula for the longest side. If the included angle is small, the opposite side can be shorter than one of the given sides.",
      correction:
        "Identify which side is opposite the included angle and solve for that side. Then check the result against the triangle inequality and the side-angle ordering.",
      contrast: {
        wrong: "c must be the longest side because it is by itself.",
        right: "c is the side opposite angle C; its length depends on the included angle.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A triangle has angle A = 30°, angle B = 90° and side a = 7 cm. Find side b.",
      hint: "This is a sine-rule pair: a with A, b with B.",
      answer: "b = 7 sin 90° / sin 30° = 14 cm.",
      feedback: {
        correct: "You used the complete pair and the right angle's sine of 1.",
        incorrect:
          "The pair is a with A and b with B. sin 90° = 1 and sin 30° = 0.5, so b = 7 / 0.5 = 14 cm.",
      },
    },
    {
      id: "p2",
      prompt:
        "Two sides are 3 cm and 4 cm with an included angle of 60°. Find the third side.",
      hint: "Use c² = a² + b² − 2ab cos C with cos 60° = 0.5.",
      answer: "c² = 9 + 16 − 12 = 13, so c = √13 ≈ 3.61 cm.",
      feedback: {
        correct: "You subtracted the cosine correction rather than adding it.",
        incorrect:
          "The correction is 2 × 3 × 4 × 0.5 = 12, so c² = 25 − 12 = 13. The third side is about 3.61 cm.",
      },
    },
    {
      id: "p3",
      prompt: "Find the area of a triangle with sides 6 cm and 8 cm and included angle 30°.",
      hint: "Use ½ab sin C; the angle must be between the two sides.",
      answer: "Area = ½ × 6 × 8 × sin 30° = 12 cm².",
      feedback: {
        correct: "You used the included angle and halved the product.",
        incorrect:
          "The formula is ½ab sin C. sin 30° = 0.5, so the area is ½ × 6 × 8 × 0.5 = 12 cm².",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "In a triangle, angle A = 30°, angle B = 90° and side a = 7 cm. What is side b, in centimetres?",
      modelAnswer: "14",
      marking: [
        "Uses the sine rule with a opposite A and b opposite B.",
        "Substitutes sin 90° = 1 and sin 30° = 0.5.",
      ],
      check: { accepted: ["14", "14 cm", "fourteen"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Two sides are 7 cm and 9 cm with an included angle of 60°. What is the square of the third side?",
      modelAnswer: "67",
      marking: [
        "Uses the cosine rule with the included angle.",
        "Computes 49 + 81 − 63 = 67.",
      ],
      check: { accepted: ["67", "sixty seven"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how you decide between the sine rule and the cosine rule. Use one example of each and name the information that makes the other rule unsuitable.",
      modelAnswer:
        "Use the sine rule when a side and its opposite angle form a complete pair, as with a = 8 opposite A = 40° and b opposite B = 75°. Use the cosine rule when two sides and the included angle are known, or when all three sides are known, as with sides 7 and 9 and the 60° angle between them. The sine rule is unsuitable for the second case because no side is paired with its opposite angle; the cosine rule is unsuitable for the first because it needs the angle between two known sides.",
      marking: [
        "Names the matching side-and-opposite-angle pair as the sine-rule condition.",
        "Names two sides with the included angle, or three sides, as the cosine-rule condition.",
        "Explains why the other rule lacks the required information in each example.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A triangular solar panel has two edges of 1.8 m and 2.4 m meeting at 35°. A second design uses the same two edges but a 55° angle. Which design has the larger area, and by how much? Explain why the third edge alone would not settle the area.",
      whyItTransfers:
        "The lesson computes a single area from an included angle. Comparing two designs requires the learner to see the angle as a variable and to explain why three side lengths determine a triangle but an area needs the included angle in this formula.",
      answer:
        "Area = ½ × 1.8 × 2.4 × sin C. At 35° the area is about 1.24 m²; at 55° it is about 1.77 m², so the 55° design is larger by about 0.53 m². Knowing the third edge would determine the triangle, but the area formula still needs the angle between the two known edges; a side length alone does not tell you how the edges hinge.",
      marking: [
        "Uses the area formula with the included angle for both designs.",
        "Computes both areas and states the difference with units.",
        "Explains that the included angle, not merely a third side, is what the area formula uses.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "State the sine rule.",
      answer: "a / sin A = b / sin B = c / sin C, with each side opposite its matching angle.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "When is the cosine rule the natural choice?",
      answer:
        "When two sides and the included angle are known, or when all three sides are known and an angle is required.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why does the area formula use sin C rather than cos C?",
      answer:
        "The area is ½ab sin C; the sine gives the height component perpendicular to the base, while the cosine would give the projection along it.",
      when: "month-later",
    },
  ],
  summary: [
    "Label each side with the angle it faces; the longest side faces the largest angle.",
    "The sine rule needs a complete side-and-opposite-angle pair.",
    "The cosine rule needs two sides and the included angle, or three sides.",
    "The area formula ½ab sin C needs the angle between the two known sides.",
  ],
});

export const MATHS_CIRCLE_AREA_ARC = defineGapLesson({
  conceptId: "circle-area-arc",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, geometry and measures: arcs, sectors and circles",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for circles, arcs and sectors. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Calculate the area of a sector and the length of its arc as fractions of the whole circle.",
      evidence:
        "For a sector of radius 6 cm and angle 60°, the learner computes the area as 6π cm² and the arc length as 2π cm.",
    },
    {
      statement:
        "Calculate the perimeter of a sector by combining the arc with the two radii.",
      evidence:
        "The learner computes the perimeter of the 60° sector as 12 + 2π cm, not 2π alone.",
    },
    {
      statement:
        "Explain why the fraction θ/360 applies to both area and circumference, and use it to check the answer against the whole circle.",
      evidence:
        "The learner states that a sector is the same fraction of the circle's area and boundary, and checks that each sector answer is smaller than the full circle.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["area-perimeter"],
    check: [
      {
        id: "d1",
        question: "What is the area of a circle of radius r?",
        answer: "πr²; the radius is squared, not doubled.",
        targets: ["area-perimeter"],
      },
      {
        id: "d2",
        question: "What is the circumference of a circle of radius r?",
        answer: "2πr, or πd where d is the diameter.",
        targets: ["area-perimeter"],
      },
    ],
  },
  introduction: {
    hook:
      "A pizza is cut into six equal slices. Each slice is one sixth of the pizza, so it has one sixth of the area and one sixth of the crust. The angle at the centre is 60° because 360° ÷ 6 = 60°. The formula for a sector is that sentence in symbols: the fraction of the circle times the whole area or the whole circumference.",
    why:
      "Learners often memorise two sector formulas and then mix up which one uses the radius squared. The fraction idea removes the need to remember them separately: a sector is a slice of the same circle, so the same fraction applies to its area and its boundary. The lesson also separates arc length from perimeter, because a slice's edge includes the two straight radii as well as the curved arc.",
  },
  explanation: [
    {
      heading: "The angle at the centre is the fraction of a full turn",
      paragraphs: [
        "A full turn is 360°, so a sector with centre angle θ is θ/360 of the circle. At 60° the fraction is one sixth; at 90° it is one quarter; at 180° it is one half. The fraction is a ratio of angles, so it has no units. It applies to every one-dimensional measure around the circle and every two-dimensional measure inside it, because the sector is a scaled copy of the whole in the angular direction.",
        "The arc is the curved part of the sector's boundary. Its length is the same fraction of the circumference: (θ/360) × 2πr. The sector's area is the same fraction of the circle's area: (θ/360) × πr². The formulas differ only in the whole they take a fraction of. Keeping that structure prevents the common mistake of using the circumference formula for an area.",
      ],
    },
    {
      heading: "Perimeter is not the same as arc length",
      paragraphs: [
        "A sector's boundary has three parts: the arc and the two radii that meet at the centre. The perimeter is therefore arc length + 2r. A learner who reports only the arc has measured the curved edge and ignored the straight sides. In a real object such as a slice of paper, the straight edges are part of the distance around the shape.",
        "A semicircle is a useful check because its fraction is one half. Its arc is πr and its perimeter is πr + 2r. A full circle has no straight radii in its boundary, which is why its perimeter is just 2πr. The formula changes at the endpoints because the shape changes, not because the fraction rule stopped working.",
      ],
    },
    {
      heading: "Check every sector against the whole circle",
      paragraphs: [
        "A sector's area must be smaller than πr² and its arc must be shorter than 2πr, unless the angle is 360°. A result larger than the whole circle is impossible. A result equal to the whole circle means the fraction was applied as 1, so check whether the angle was entered in degrees when the formula expects a fraction of 360.",
        "The units follow the operation. Area is measured in square units because two lengths are multiplied; arc length and perimeter are measured in the same units as the radius. If a radius is given in centimetres, the area is in square centimetres and the perimeter in centimetres. Carrying the units through the calculation catches a formula that multiplies the wrong quantities.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The sector is a fraction of the whole circle. The same fraction multiplies the area and the circumference; only the whole changes.",
      notation: "Area of sector = (θ/360) × πr²\nArc length = (θ/360) × 2πr",
      caption:
        "For θ = 60° and r = 6, the fraction is one sixth. The area is 6π cm² and the arc is 2π cm, each one sixth of the full measure.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The perimeter of a sector adds the two radii to the arc. The arc alone is only the curved part of the boundary.",
      notation: "Perimeter of sector = arc length + 2r = (θ/360) × 2πr + 2r",
      caption:
        "The 60° sector with radius 6 has perimeter 2π + 12 cm. The 12 comes from the two straight edges, not from the arc.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "A sector's angle is a fraction of a full turn. The fraction is the bridge between the angle and the linear or area measure.",
      notation: "60° / 360° = 1/6; 90° / 360° = 1/4; 180° / 360° = 1/2",
      caption:
        "The fraction is dimensionless. It can be applied to πr² or 2πr without changing its value, which is why one idea covers both formulas.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Find the area of a sector with radius 6 cm and centre angle 60°. Give the answer in terms of π.",
      steps: [
        {
          move: "Write the fraction of the circle: 60/360 = 1/6.",
          why:
            "The sector's angle is one sixth of a full turn, so its area is one sixth of the circle's area.",
        },
        {
          move: "Compute the whole circle's area: π × 6² = 36π cm².",
          why:
            "The radius is squared, not doubled. The whole area is the amount the fraction will reduce.",
        },
        {
          move: "Multiply: (1/6) × 36π = 6π cm².",
          why:
            "The result is smaller than 36π, as a sector must be. The units are square centimetres because it is an area.",
        },
      ],
      answer: "6π cm², approximately 18.85 cm².",
    },
    {
      id: "w2",
      prompt:
        "Find the perimeter of the same sector: radius 6 cm and centre angle 60°.",
      steps: [
        {
          move: "Find the arc length: (1/6) × 2π × 6 = 2π cm.",
          why:
            "The arc is the same fraction of the circumference. The circumference is 12π, so one sixth is 2π.",
        },
        {
          move: "Add the two radii: 2π + 6 + 6.",
          why:
            "The sector's boundary includes the two straight edges from the centre to the arc, not only the curved part.",
        },
        {
          move: "The perimeter is 12 + 2π cm, approximately 18.28 cm.",
          why:
            "The straight edges contribute 12 cm and the arc contributes about 6.28 cm. The total is larger than either part.",
        },
      ],
      answer: "12 + 2π cm, approximately 18.28 cm.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The area of a sector is (θ/360) × 2πr.",
      whyItFails:
        "2πr is the circumference, a length. Multiplying it by a fraction gives a length, not an area. The area formula must use πr², which has two length factors. The two formulas look similar because both use the same fraction, but their wholes are different.",
      correction:
        "Decide whether the question asks for a distance around the edge or a surface inside. Use 2πr for the arc and πr² for the area, then attach the correct units.",
      contrast: {
        wrong: "Sector area = (60/360) × 2π × 6 = 2π cm",
        right: "Sector area = (60/360) × π × 6² = 6π cm²",
      },
    },
    {
      id: "m2",
      belief: "The perimeter of a sector is just its arc length.",
      whyItFails:
        "The arc is only the curved part of the boundary. The sector also has two straight radii from the centre to the ends of the arc. Reporting the arc alone undercounts the distance around the shape.",
      correction:
        "Add the arc to 2r. For a 60° sector of radius 6, the perimeter is 2π + 12 cm, not 2π cm.",
      contrast: {
        wrong: "Perimeter = 2π cm",
        right: "Perimeter = 2π + 12 cm",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Find the area of a sector with radius 4 cm and angle 90°.",
      hint: "A quarter of the circle's area, πr².",
      answer: "A quarter of 16π is 4π cm².",
      feedback: {
        correct: "You used the quarter fraction and the area formula.",
        incorrect:
          "90° is one quarter of 360°, and the whole area is 16π. The sector area is 4π cm².",
      },
    },
    {
      id: "p2",
      prompt: "Find the arc length of a sector with radius 10 cm and angle 36°.",
      hint: "36° is one tenth of a full turn; the circumference is 20π.",
      answer: "One tenth of 20π is 2π cm.",
      feedback: {
        correct: "You applied the fraction to the circumference rather than the area.",
        incorrect:
          "The circumference is 2π × 10 = 20π. One tenth of that is 2π cm, a length.",
      },
    },
    {
      id: "p3",
      prompt: "A sector has radius 5 cm and angle 180°. What is its perimeter?",
      hint: "A semicircle's boundary is the arc plus the diameter.",
      answer: "Arc = 5π cm; perimeter = 5π + 10 cm.",
      feedback: {
        correct: "You added the diameter, which is the two radii joined.",
        incorrect:
          "The arc is half the circumference, 5π. The straight edge is the diameter, 10 cm, so the perimeter is 5π + 10 cm.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "What is the area, in terms of π, of a sector with radius 6 cm and angle 60°?",
      modelAnswer: "6π",
      marking: [
        "Uses the fraction 60/360 = 1/6.",
        "Multiplies by πr² = 36π to get 6π.",
      ],
      check: { accepted: ["6π", "6 pi", "6π cm²", "6 pi cm²"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What is the arc length, in terms of π, of a sector with radius 6 cm and angle 60°?",
      modelAnswer: "2π",
      marking: [
        "Uses the same fraction 1/6 on the circumference.",
        "Multiplies 1/6 by 12π to get 2π.",
      ],
      check: { accepted: ["2π", "2 pi", "2π cm", "2 pi cm"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why the same fraction θ/360 is used for both sector area and arc length, and why the perimeter of a sector is not the same as its arc length.",
      modelAnswer:
        "A sector is the part of the circle swept by an angle θ, so it is θ/360 of the whole circle. That fraction applies to the area πr² and to the circumference 2πr because both are properties of the same whole. The arc is only the curved part of the boundary; the perimeter also includes the two radii from the centre to the ends of the arc, so perimeter = arc + 2r.",
      marking: [
        "Explains the sector as the same fraction of the whole circle in both measures.",
        "Names πr² and 2πr as the two wholes the fraction multiplies.",
        "Distinguishes the arc from the two straight radii in the perimeter.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A running track has two straight sections of 80 m and two semicircular ends of radius 30 m. Calculate the total length of one lap and the area enclosed, explaining which parts use the circle formulas and which do not.",
      whyItTransfers:
        "The lesson treats a single sector. The track combines straight and curved parts and asks for both boundary and area, so the learner must decompose the shape and avoid applying a sector formula to the rectangle.",
      answer:
        "The two semicircles make one full circle of radius 30: circumference 60π m, area 900π m². The two straights add 160 m to the boundary. The rectangle between them is 80 m by 60 m, area 4800 m². Total lap = 160 + 60π m; total area = 4800 + 900π m².",
      marking: [
        "Combines the two semicircles into one circle and uses the correct circumference and area.",
        "Adds both straight sections to the boundary.",
        "Separates the rectangular area from the circular area.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What fraction of a circle is a 90° sector?",
      answer: "One quarter, because 90/360 = 1/4.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is the arc length formula for a sector?",
      answer: "(θ/360) × 2πr, the same fraction of the circumference.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What two parts make up the perimeter of a sector?",
      answer: "The arc and the two radii, so perimeter = arc + 2r.",
      when: "month-later",
    },
  ],
  summary: [
    "A sector is θ/360 of the whole circle, so the same fraction applies to area and circumference.",
    "Sector area is (θ/360) × πr²; arc length is (θ/360) × 2πr.",
    "The perimeter of a sector is the arc plus the two radii, not the arc alone.",
    "Check that area is smaller than πr² and arc is shorter than 2πr, and keep square units for area.",
  ],
});
