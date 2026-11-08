import type { AuthoredLesson } from "../../lesson-contract";

// Quadratic equations are the first secondary algebra topic where a learner can
// follow every step of a worked example and still be unable to start the next
// one. The lesson therefore teaches the STRUCTURE — a product equal to zero —
// before the factorising routine, and makes the learner explain that structure
// rather than recite a list of steps.
export const MATHS_QUADRATICS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "quadratics",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: quadratic equations and graphs",
    level: "Key Stage 4, Foundation to Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. No specification or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Solve a quadratic equation by factorising, and explain why a product equal to zero lets you split the equation into two simpler equations.",
      evidence:
        "Given x squared plus five x plus six equals zero, the learner writes the two factors, sets each factor to zero, and explains that a product can be zero only when at least one factor is zero.",
    },
    {
      statement:
        "Decide whether a quadratic has two, one or no real solutions by using the discriminant, and connect that number to the graph.",
      evidence:
        "For x squared minus four x plus five equals zero, the learner calculates the discriminant as negative four, states that there are no real roots, and says the parabola does not cross the x-axis.",
    },
    {
      statement:
        "Translate a geometric or everyday situation into a quadratic and reject a solution that the situation cannot allow.",
      evidence:
        "For a rectangle whose length is five centimetres more than its width and whose area is twenty-four square centimetres, the learner forms x times x plus five equals twenty-four, solves it, and rejects the negative root because a length cannot be negative.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["algebra-expand", "straight-lines"],
    check: [
      {
        id: "d1",
        question: "Expand (x + 2)(x + 3).",
        answer:
          "x squared plus five x plus six: each term in the first bracket multiplies each term in the second, and the two x terms combine.",
        targets: ["algebra-expand"],
      },
      {
        id: "d2",
        question:
          "What does the graph of y equals x squared look like, and where does it cross the x-axis?",
        answer:
          "It is a U-shaped parabola with its lowest point at the origin. It touches the x-axis at x equals zero and does not cross it anywhere else.",
        targets: ["straight-lines", "quadratics"],
      },
    ],
  },

  introduction: {
    hook:
      "A rectangular garden is five metres longer than it is wide, and its area is twenty-four square metres. You could guess the width and keep checking, but there is a better way: call the width x, write the area as x times x plus five, and set it equal to twenty-four. The equation you get is a quadratic, and solving it gives the one width that works.",
    why:
      "A quadratic is not a formula to memorise. It is a relationship in which one quantity depends on the square of another, so its graph is a curve rather than a straight line. The curve can cross the x-axis twice, once, or not at all, and those crossings are the solutions. The factorised form, the completed square and the discriminant are three ways of reading the same curve. This lesson teaches what each one tells you, so a method you have not seen is still a problem you can start.",
  },

  explanation: [
    {
      heading: "A quadratic describes a curve, and its roots are where the curve meets the axis",
      paragraphs: [
        "A quadratic expression has an x squared term as its highest power, such as x squared plus five x plus six. Its graph is a parabola: a smooth U-shape that opens upwards when the x squared coefficient is positive and downwards when it is negative. The solutions of the equation are the x-values where the curve crosses the x-axis, because those are the points where the expression equals zero. A curve can cross twice, just touch the axis once, or miss it entirely, so a quadratic can have two, one or no real solutions.",
        "That geometric picture is the check on every algebraic answer. If factorising gives two roots, the parabola should cross the axis at those two values. If the discriminant says there are no real roots, the curve should sit entirely above or entirely below the axis. An answer that disagrees with the picture is not a small slip; one of the two representations is wrong, and the disagreement is the information you need.",
      ],
    },
    {
      heading: "Factorising works because a product can be zero only when a factor is zero",
      paragraphs: [
        "The zero product property is the engine of this method: if two numbers multiply to zero, at least one of them must be zero. So if x plus two times x plus three equals zero, then either x plus two is zero or x plus three is zero. That gives x equals negative two or x equals negative three. The step is not a trick for moving numbers across the equals sign; it is a fact about multiplication that turns one quadratic equation into two linear equations.",
        "Factorising reverses expansion. Expanding x plus two times x plus three gives x squared plus five x plus six, so a quadratic whose constant and middle coefficient come from the same pair can be written back as a product. The pair must multiply to the constant term and add to the x coefficient. When the x squared coefficient is not one, the pair has to account for that coefficient as well, which is why checking by expanding is not optional: it is how you know the factors are right before you rely on them.",
      ],
    },
    {
      heading: "Completing the square and the discriminant answer different questions",
      paragraphs: [
        "Completing the square rewrites the quadratic around its turning point. Half the x coefficient, square it, and add and subtract it so the value is unchanged: x squared plus six x plus five becomes x plus three squared minus four. The bracket shows that the smallest value is negative four, reached at x equals negative three, which is the vertex. That form is useful when the question asks for a maximum, a minimum or a turning point rather than a crossing.",
        "The discriminant, b squared minus four a c, answers how many real roots exist before you find them. A positive value gives two roots, zero gives one repeated root, and a negative value gives no real roots. It is a check on the graph and on the factorisation, not a substitute for them. A learner who knows all three forms can choose the one that fits the question instead of applying the only procedure they remember.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The same quadratic in expanded and factorised form. The factors are the two numbers that multiply to six and add to five.",
      notation: "x² + 5x + 6 = (x + 2)(x + 3)",
      caption:
        "Expanding the right-hand side returns the left-hand side exactly. The roots are the values that make a bracket zero, so they are negative two and negative three, not positive two and positive three.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "A rectangle split into four regions. The x-by-x square has area x squared; the two x-by-number strips contribute five x; the corner contributes six.",
      notation: "(x + 2)(x + 3) = x² + 2x + 3x + 6 = x² + 5x + 6",
      caption:
        "The area model shows why expanding works: every term in one bracket meets every term in the other, and the two x-strips combine into the middle term.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "The discriminant is the part under the square root in the quadratic formula. Its sign decides how many times the parabola meets the x-axis.",
      notation: "x = (−b ± √(b² − 4ac)) / 2a   ·   Δ = b² − 4ac",
      caption:
        "A positive discriminant gives two real roots, zero gives one repeated root, and a negative discriminant gives no real roots. The formula still works, but the square root of a negative number is not real.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Solve x² + 5x + 6 = 0 by factorising.",
      steps: [
        {
          move:
            "Look for two numbers that multiply to six and add to five: two and three.",
          why:
            "The constant term is the product of the two numbers in the brackets, and the x coefficient is their sum. Checking both conditions before writing the brackets prevents a pair that fits one but not the other.",
        },
        {
          move: "Write the quadratic as (x + 2)(x + 3) = 0.",
          why:
            "Expanding gives back x squared plus five x plus six, so the factorised form is equivalent. The equation has not changed; only the way it is written has.",
        },
        {
          move:
            "Use the zero product property: x + 2 = 0 or x + 3 = 0, so x = −2 or x = −3.",
          why:
            "A product is zero only when one of its factors is zero. Each bracket therefore gives a linear equation, and solving both gives both roots. The signs are negative because each bracket is set to zero, not to the number inside it.",
        },
      ],
      answer: "x = −2 or x = −3",
    },
    {
      id: "w2",
      prompt:
        "A rectangle is five centimetres longer than it is wide and has an area of 24 square centimetres. Find its width.",
      steps: [
        {
          move:
            "Let the width be x, so the length is x + 5, and write the area equation x(x + 5) = 24.",
          why:
            "Area is width times length. Naming the width first means the length can be written from the same variable, so the equation has one unknown rather than two.",
        },
        {
          move:
            "Expand and rearrange: x² + 5x − 24 = 0, then factorise as (x + 8)(x − 3) = 0.",
          why:
            "The equation must equal zero before the zero product property can be used. The pair eight and negative three multiplies to negative twenty-four and adds to five, which matches the expanded form.",
        },
        {
          move:
            "Solve the factors: x = −8 or x = 3. Reject −8 because a width cannot be negative, so the width is 3 cm.",
          why:
            "Both values solve the algebra, but only one describes the rectangle. Checking the answer against the situation is part of solving a modelled problem, not an optional extra.",
        },
      ],
      answer: "The width is 3 cm, so the length is 8 cm.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "If (x + 2)(x + 3) = 6, then x + 2 = 6 or x + 3 = 6.",
      whyItFails:
        "The zero product property works only when the product is zero. Six has many factor pairs, so a product of six does not force either bracket to equal six. The equation must be rearranged so one side is zero before the factors can be split.",
      correction:
        "Move every term to one side first, expand and simplify, then factorise the expression that equals zero. Only then set each factor to zero.",
      contrast: {
        wrong: "(x + 2)(x + 3) = 6, so x = 4 or x = 3",
        right: "x² + 5x + 6 = 6 becomes x² + 5x = 0, so x(x + 5) = 0 and x = 0 or x = −5",
      },
    },
    {
      id: "m2",
      belief:
        "The roots of (x + 2)(x + 3) = 0 are positive two and positive three.",
      whyItFails:
        "The roots are the values that make each bracket zero. The bracket x plus two is zero when x is negative two, not positive two. Reading the numbers inside the brackets as the roots reverses every sign.",
      correction:
        "Set each bracket equal to zero and solve the resulting small equation. The sign of the root is the opposite of the number in the bracket.",
      contrast: {
        wrong: "the roots are 2 and 3",
        right: "x + 2 = 0 gives x = −2, and x + 3 = 0 gives x = −3",
      },
    },
    {
      id: "m3",
      belief:
        "A quadratic always has two solutions, so an answer with one root must be incomplete.",
      whyItFails:
        "A repeated root is still one value, and a negative discriminant gives no real roots at all. The number of real solutions is a property of the curve, not a rule that every quadratic must produce two different numbers.",
      correction:
        "Use the discriminant or the graph to decide how many real roots exist before solving. If the discriminant is zero, say there is one repeated root; if it is negative, say there are no real roots.",
      contrast: {
        wrong: "every quadratic has two different roots",
        right: "x² − 4x + 4 = (x − 2)² has one repeated root, x = 2",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Factorise and solve x² + 7x + 12 = 0.",
      hint:
        "Find two numbers that multiply to twelve and add to seven. Write the brackets first, then set each bracket to zero.",
      answer: "(x + 3)(x + 4) = 0, so x = −3 or x = −4.",
      feedback: {
        correct:
          "Three and four multiply to twelve and add to seven, and setting each bracket to zero gives the two negative roots.",
        incorrect:
          "Check both conditions: the pair must multiply to twelve and add to seven. Then remember that a bracket equal to zero gives the opposite sign for x.",
      },
    },
    {
      id: "p2",
      prompt: "Solve x² − 4x = 0.",
      hint:
        "There is a common factor of x in both terms. Take it out before looking for two brackets.",
      answer: "x(x − 4) = 0, so x = 0 or x = 4.",
      feedback: {
        correct:
          "Taking out the common factor gives a product equal to zero, so one root is zero and the other comes from x minus four equals zero.",
        incorrect:
          "Do not divide both sides by x: that loses the solution x equals zero. Factorise instead, so both factors remain visible.",
      },
    },
    {
      id: "p3",
      prompt:
        "A ball's height in metres after t seconds is h = 12t − 5t². When does it return to the ground?",
      hint:
        "The ground is h = 0. Factorise the right-hand side by taking out t, then solve both factors.",
      answer: "t(12 − 5t) = 0, so t = 0 or t = 2.4 seconds.",
      feedback: {
        correct:
          "The two solutions are the launch time and the landing time. The question asks when it returns, so the non-zero solution is 2.4 seconds.",
        incorrect:
          "Both solutions are mathematically valid, but t equals zero is the launch. The return to the ground is the other root.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why (x + 2)(x + 3) = 0 allows you to conclude that x = −2 or x = −3, but (x + 2)(x + 3) = 6 does not allow you to conclude that x = 4 or x = 3.",
      modelAnswer:
        "Zero is special because a product of two numbers is zero only when at least one of the numbers is zero. So each bracket can be set to zero, giving x = −2 or x = −3. Six is not zero: many pairs of numbers multiply to six, so neither bracket is forced to equal six. The equation with six must be rearranged to equal zero before its factors can be split.",
      marking: [
        "States the zero product property: a product is zero only if a factor is zero.",
        "Applies it correctly to the equation equal to zero and obtains both negative roots.",
        "Explains that a non-zero product does not force either factor to equal that product.",
        "Recognises that the second equation must be rearranged to zero before factorising.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Solve x² − 7x + 10 = 0.",
      modelAnswer: "x = 2 or x = 5",
      marking: [
        "Factorises as (x − 2)(x − 5) = 0.",
        "Sets each factor to zero and gives both roots.",
      ],
      check: {
        accepted: ["x = 2 or x = 5", "x=2 or x=5", "2 or 5", "2, 5"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "How many real roots does x² − 4x + 5 = 0 have? Use the discriminant.",
      modelAnswer: "no real roots",
      marking: [
        "Substitutes a = 1, b = −4 and c = 5 into b² − 4ac.",
        "Interprets the negative discriminant as no real roots.",
      ],
      check: {
        accepted: ["no real roots", "0 real roots", "zero real roots"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A rectangular stage is three metres longer than it is wide. A safety rule says its area must be at least forty square metres. Find the smallest whole-number width that satisfies the rule, and explain why the negative root is rejected.",
      whyItTransfers:
        "The setting is a design constraint rather than a textbook equation, and the inequality changes what counts as an acceptable answer. The learner still has to form the quadratic, solve it and interpret the roots in context.",
      answer:
        "Let the width be x, so x(x + 3) is at least 40. The boundary equation x² + 3x − 40 = 0 factorises as (x + 8)(x − 5) = 0, giving x = 5 or x = −8. The smallest whole-number width that meets the rule is 5 m; the negative root is rejected because a width cannot be negative.",
      marking: [
        "Forms the area expression x(x + 3) and sets up the inequality or boundary equation.",
        "Solves the quadratic correctly and obtains 5 and −8.",
        "Rejects −8 with a reason about the physical width.",
        "Chooses 5 as the smallest whole-number width that satisfies the area rule.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Factorise and solve x² + 8x + 15 = 0.",
      answer: "(x + 3)(x + 5) = 0, so x = −3 or x = −5.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "What does a negative discriminant tell you about the graph of a quadratic?",
      answer:
        "The parabola does not cross the x-axis, so the equation has no real roots.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A rectangle has width x and length x + 4. Its area is 21. Form and solve the equation, and explain why one root is rejected.",
      answer:
        "x² + 4x − 21 = 0, so (x + 7)(x − 3) = 0 and x = 3 or x = −7. The width must be positive, so x = 3 and the length is 7.",
      when: "month-later",
    },
  ],

  summary: [
    "A quadratic's roots are where its parabola meets the x-axis; it can have two, one or no real roots.",
    "Factorising turns a product equal to zero into two linear equations, because a product is zero only when a factor is zero.",
    "Completing the square reveals the turning point; the discriminant tells you how many real roots exist.",
    "In a modelled problem, solve the algebra and then reject any root the situation cannot allow.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every expression is announced in words as well as symbols, with brackets named, and the graph's roots are described as values on the x-axis.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each worked example follows the same three labelled moves — find the pair, write the factors, set each factor to zero — so the structure is predictable while the numbers change.",
    },
    {
      need: "colour-vision",
      alternative:
        "The area model's regions are labelled with their expressions as well as shaded, so no part depends on colour.",
    },
    {
      need: "motor",
      alternative:
        "The lesson requires typing or selecting, not dragging; the area model and graph are readable without interaction.",
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
      authoredAt: "2026-11-07",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
