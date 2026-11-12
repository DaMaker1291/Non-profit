import type { AuthoredLesson } from "../../lesson-contract";

// A LINE AND A CURVE CAN MEET TWICE, ONCE, OR NOT AT ALL.
//
// The algebra is substitution, which the learner already owns from simultaneous
// linear equations. The new idea is that substituting a linear expression into a
// quadratic produces a quadratic in one unknown, and that its roots are the
// x-coordinates of the intersections — not yet the points. The lesson keeps the
// graph and the discriminant beside the algebra so "two roots", "one repeated
// root" and "no real root" are three visible geometric cases rather than three
// formula outcomes. The worked examples deliberately include a tangent and a
// miss, because a learner who only ever sees two crossings starts believing that
// two is guaranteed.
export const MATHS_SIM_EQUATIONS_QUAD: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "sim-equations-quad",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra: simultaneous equations with one linear and one quadratic equation; line–curve intersection",
    level: "Key Stage 4 to GCSE Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the break-even transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Solve a linear–quadratic pair by substituting the linear expression into the quadratic and forming a quadratic in one unknown.",
      evidence:
        "The learner turns y = x + 3 and y = x² + 1 into x + 3 = x² + 1, rearranges to x² − x − 2 = 0, factorises it and obtains both x-values.",
    },
    {
      statement:
        "Turn each x-value into a coordinate pair by substituting into the line, and check both pairs in both original equations.",
      evidence:
        "The learner reports (2, 5) and (−1, 2) for that pair, substitutes each point into both equations, and does not stop at x = 2 and x = −1.",
    },
    {
      statement:
        "Use the discriminant or the graph to distinguish two intersections, one tangent intersection and no real intersection.",
      evidence:
        "The learner explains that a positive discriminant gives two points, zero gives one repeated point, and a negative discriminant gives no real point.",
    },
    {
      statement:
        "Avoid losing a root when the substituted equation has a common factor, and avoid pairing an x-value with the wrong y-value.",
      evidence:
        "The learner factorises x² − x = 0 as x(x − 1) = 0 rather than dividing by x, and pairs each x with the y from the same line.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["quadratics", "simultaneous"],
    check: [
      {
        id: "d1",
        question: "Solve x² − 5x + 6 = 0 by factorising.",
        answer:
          "x² − 5x + 6 = (x − 2)(x − 3), so x = 2 or x = 3. A product is zero when either factor is zero.",
        targets: ["quadratics"],
      },
      {
        id: "d2",
        question: "Solve the simultaneous equations y = x + 3 and y = 2x − 1.",
        answer:
          "Both expressions equal y, so x + 3 = 2x − 1. Then 4 = x, and y = 7. The solution is (4, 7).",
        targets: ["simultaneous"],
      },
      {
        id: "d3",
        question: "What does the discriminant b² − 4ac tell you about a quadratic?",
        answer:
          "It tells you how many real roots there are: positive gives two, zero gives one repeated root, and negative gives no real roots.",
        targets: ["quadratics"],
      },
    ],
  },

  introduction: {
    hook:
      "A skateboard ramp is modelled by the straight line y = x + 3 and a curved bank by the parabola y = x² + 1. The two surfaces meet where both equations are true at once. Setting the expressions equal gives x + 3 = x² + 1, which rearranges to x² − x − 2 = 0. Its solutions are x = 2 and x = −1, and the matching points are (2, 5) and (−1, 2). The algebra has found two crossings — but only because the equation had two real roots. Change the ramp's height and the same method can return one touching point or none at all.",
    why:
      "A line–curve pair is the first simultaneous system where the number of solutions is not fixed. Two straight lines meet once, never, or everywhere; a line and a quadratic meet at most twice, and may miss entirely. Substitution is the same move as before, but the resulting equation is quadratic, so its discriminant and its graph now decide how many points are real. This is also the algebra behind break-even analysis, where a linear cost meets a quadratic revenue, and behind any question that asks where a straight path crosses a curved one.",
  },

  explanation: [
    {
      heading: "Substitution turns two equations into one quadratic",
      paragraphs: [
        "The linear equation is the useful one to rearrange because it has no squared term. If it is already written as y = x + 3, then every y in the quadratic can be replaced by x + 3. Substituting into y = x² + 1 gives x + 3 = x² + 1. The y has gone, and what remains is a quadratic in x.",
        "Collect every term on one side before solving. x + 3 = x² + 1 becomes 0 = x² − x − 2, or equivalently x² − x − 2 = 0. Rearranging is not cosmetic: a quadratic must equal zero before the zero-product rule or the quadratic formula can be used. The same operation must be applied to the whole expression, so subtracting x and 3 from both sides changes every term, not only the first one.",
        "Factorising x² − x − 2 gives (x − 2)(x + 1) = 0, so x = 2 or x = −1. Those are the x-coordinates of the intersections. They are not the final answer on their own. A point on a graph has two coordinates, and the question asks where the line and curve meet, so each x must be paired with its y.",
      ],
    },
    {
      heading: "Each x becomes a point through the line",
      paragraphs: [
        "Substitute each x into the simpler original equation, which is the line. For x = 2, y = 2 + 3 = 5, giving (2, 5). For x = −1, y = −1 + 3 = 2, giving (−1, 2). Using the line is not a shortcut that skips checking: it is the same relationship the pair must satisfy, and it gives the y-value with less arithmetic than the quadratic.",
        "Pair the values by their own x. The point (2, 5) uses the x = 2 root and the y that root produced; it is not (2, 2) or (−1, 5). A common error is to find two x-values and two y-values and then match them by position rather than by substitution. Writing the working as x = 2 → y = 5 and x = −1 → y = 2 keeps each pair together and makes the wrong matching visible.",
        "Check each point in both original equations. For (2, 5): 5 = 2 + 3 and 5 = 2² + 1 = 5. For (−1, 2): 2 = −1 + 3 and 2 = (−1)² + 1 = 2. The check is not redundant. It catches a sign error in the rearrangement, a lost root, or a y-value taken from the wrong equation. A point that satisfies only the line is not an intersection with the curve.",
      ],
    },
    {
      heading: "The discriminant counts the intersections before you draw",
      paragraphs: [
        "A line and a quadratic can meet twice, touch once, or miss. After substitution and rearrangement, the quadratic's discriminant b² − 4ac reports which case is real. In x² − x − 2 = 0, the discriminant is (−1)² − 4(1)(−2) = 9, which is positive, so there are two distinct real roots and two intersection points.",
        "If the discriminant is zero, the quadratic has one repeated root and the line touches the curve at a single point. The line is then a tangent. For y = 2x − 3 and y = x² − 4x + 6, substitution gives x² − 6x + 9 = 0, whose discriminant is 36 − 36 = 0. The repeated root is x = 3, and the line gives y = 3, so the only intersection is (3, 3). Saying “one solution” is correct here, but it is one point with a repeated root, not an equation that failed to produce a second answer.",
        "If the discriminant is negative, there are no real roots and the line never meets the curve. For y = x + 1 and y = x² + 2, substitution gives x² − x + 1 = 0, whose discriminant is 1 − 4 = −3. A graph of the two would show the line below the parabola with a gap between them. The algebra and the picture agree; neither is a special exception to the method.",
      ],
    },
    {
      heading: "Do not lose a root by dividing by the unknown",
      paragraphs: [
        "Some substitutions produce a quadratic with no constant term. For y = x and y = x², substitution gives x = x², or x² − x = 0. Factorising gives x(x − 1) = 0, so x = 0 or x = 1. The points are (0, 0) and (1, 1). Dividing both sides by x before factorising would give x = 1 and silently delete the intersection at the origin.",
        "The zero-product rule is safe precisely because it keeps both factors. Dividing by a variable is only legitimate when the variable is known to be non-zero, and here x = 0 is one of the answers being sought. Move every term to one side and factorise, even when the factor looks inconvenient. The same warning applies to a common numerical factor: divide the whole equation by it, but never divide away a factor that contains the unknown.",
        "A repeated root is not a lost root. (x − 3)² = 0 has two equal roots, x = 3 and x = 3, which describe one point. A learner who counts “two roots” and expects two distinct points has confused multiplicity with the number of intersections. The graph shows one touching point because the two roots coincide.",
      ],
    },
    {
      heading: "Read the answer as a geometric statement",
      paragraphs: [
        "Each solution is a point on both graphs. Two points mean the line cuts the parabola twice; one point means it is tangent; no real point means the line misses. The number of points is visible before solving if the discriminant is computed, and visible after solving if the points are plotted. When a question asks for an intersection, both coordinates are part of the answer; when it asks for the x-coordinates only, the wording must say so.",
        "The graph also shows why there cannot be three intersections. A line can cut a parabola at most twice, because substituting the line into the quadratic produces a quadratic equation, and a quadratic has at most two real roots. That is an argument from the structure of the equations, not a fact to memorise from a picture. It also explains why the method generalises: a line meeting a curve of higher degree can produce more intersections, and the substituted equation's degree tells you the maximum.",
        "In a modelling question, the coordinates need interpretation. If x is time and y is height, a negative x may be outside the physical situation even though it is a valid algebraic root; if x is a quantity that cannot be negative, say so and reject that root with a reason. Rejecting a root is not the same as losing it: the algebra found it, and the context decided it was not admissible. The distinction belongs in the answer.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Substituting the line into the curve leaves a quadratic in one unknown. Its roots are the x-coordinates of the intersections.",
      notation:
        "y = x + 3 and y = x² + 1  →  x + 3 = x² + 1  →  x² − x − 2 = 0  →  (x − 2)(x + 1) = 0  →  x = 2 or x = −1",
      caption:
        "The matching points are (2, 5) and (−1, 2). Each y comes from the line, and each pair satisfies both original equations.",
    },
    {
      id: "r2",
      kind: "maths.graph",
      body:
        "A line can cut a parabola twice, touch it once, or miss it. The discriminant reports which case is real.",
      notation:
        "b² − 4ac > 0: two points   ·   b² − 4ac = 0: one tangent point   ·   b² − 4ac < 0: no real point",
      caption:
        "For y = x + 3 and y = x² + 1, the rearranged quadratic has discriminant 9, so the graphs cross twice. A tangent has discriminant zero; a miss has a negative discriminant.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A common factor must be factorised, not divided away, because the zero root is a real intersection.",
      notation: "x = x²  →  x² − x = 0  →  x(x − 1) = 0  →  x = 0 or x = 1  →  (0, 0) and (1, 1)",
      caption:
        "Dividing by x would leave x = 1 only and delete the intersection at the origin. The zero-product rule keeps both factors and both roots.",
    },
    {
      id: "r4",
      kind: "maths.proof",
      body:
        "The number of intersections is at most the degree of the substituted equation, because each intersection is a real root of that equation.",
      notation:
        "line into quadratic  →  quadratic in x  →  at most two real roots  →  at most two intersection points",
      caption:
        "A line and a parabola cannot meet three times. The algebra explains the geometric limit rather than merely illustrating it.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Solve y = x + 3 and y = x² + 1.",
      steps: [
        {
          move: "Substitute x + 3 for y in the quadratic: x + 3 = x² + 1.",
          why:
            "Both expressions equal y, so they equal each other. Substitution removes y and leaves one equation in x.",
        },
        {
          move: "Collect everything on one side: x² − x − 2 = 0.",
          why:
            "A quadratic must equal zero before it can be factorised or solved. Subtract x and 3 from both sides and combine like terms.",
        },
        {
          move: "Factorise: (x − 2)(x + 1) = 0, so x = 2 or x = −1.",
          why:
            "A product is zero only when a factor is zero. Both factors give a possible x-coordinate.",
        },
        {
          move: "Use the line for each y: x = 2 gives y = 5; x = −1 gives y = 2. The points are (2, 5) and (−1, 2).",
          why:
            "An intersection is a point, not an x-value. The line is the simpler equation for producing the matching y.",
        },
        {
          move: "Check both points in both equations: 5 = 2 + 3 and 5 = 2² + 1; 2 = −1 + 3 and 2 = (−1)² + 1.",
          why:
            "A valid intersection must satisfy the line and the curve. The check catches a pairing or sign error before it becomes the final answer.",
        },
      ],
      answer: "(2, 5) and (−1, 2)",
    },
    {
      id: "w2",
      prompt: "Solve y = 2x − 3 and y = x² − 4x + 6. Explain why there is only one intersection.",
      steps: [
        {
          move: "Substitute 2x − 3 for y: 2x − 3 = x² − 4x + 6.",
          why:
            "The line is already in y = ... form, so it can replace y in the quadratic directly.",
        },
        {
          move: "Rearrange: x² − 6x + 9 = 0.",
          why:
            "Subtract 2x and add 3 to both sides, then combine like terms. The result is a quadratic equal to zero.",
        },
        {
          move: "Factorise: (x − 3)² = 0, so x = 3 is a repeated root.",
          why:
            "A repeated root is one x-value counted twice. It does not produce two different points.",
        },
        {
          move: "The line gives y = 2(3) − 3 = 3, so the only point is (3, 3). Check: 3 = 2(3) − 3 and 3 = 3² − 4(3) + 6.",
          why:
            "The discriminant is zero, so the line is tangent to the parabola. The graph touches at one point rather than crossing twice.",
        },
      ],
      answer: "(3, 3), a tangent point with a repeated root",
    },
    {
      id: "w3",
      prompt: "Solve y = x + 1 and y = x² + 2. What does the result tell you about the graphs?",
      steps: [
        {
          move: "Substitute: x + 1 = x² + 2.",
          why:
            "The linear expression replaces y in the quadratic, leaving one unknown.",
        },
        {
          move: "Rearrange: x² − x + 1 = 0.",
          why:
            "Subtract x and 1 from both sides so the quadratic is equal to zero.",
        },
        {
          move: "Compute the discriminant: (−1)² − 4(1)(1) = 1 − 4 = −3.",
          why:
            "A negative discriminant means the quadratic has no real roots, so there is no real x-coordinate to pair with a y.",
        },
        {
          move: "There is no real intersection: the discriminant is −3, so the line and the parabola never meet.",
          why:
            "The absence of a real root is a geometric answer, not a failure to finish the calculation.",
        },
      ],
      answer: "No real intersection; the discriminant is −3",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The x-values are the final answer; the y-values are optional.",
      whyItFails:
        "The question asks where two graphs meet, and a meeting place is a point. x = 2 and x = −1 on their own describe vertical lines, not the intersections of y = x + 3 and y = x² + 1. The points are (2, 5) and (−1, 2); a learner who stops at the x-values has answered a different question.",
      correction:
        "After finding each x, substitute it into the line to obtain its y. Write each pair together, then check the pair in both original equations.",
      contrast: {
        wrong: "x = 2 or x = −1",
        right: "(2, 5) and (−1, 2)",
      },
    },
    {
      id: "m2",
      belief: "A quadratic always has two intersections with a line.",
      whyItFails:
        "A quadratic can have two distinct real roots, one repeated root or no real roots. y = 2x − 3 and y = x² − 4x + 6 give (x − 3)² = 0, so there is one tangent point. y = x + 1 and y = x² + 2 give a negative discriminant, so there is no real point at all. Two is the maximum, not a guarantee.",
      correction:
        "Use the discriminant or the graph to decide the number of intersections before or after solving. Positive means two, zero means one repeated point, negative means none.",
      contrast: {
        wrong: "every line–quadratic pair has two solutions",
        right: "two, one tangent point, or none, according to the discriminant",
      },
    },
    {
      id: "m3",
      belief: "Dividing both sides by x is a harmless simplification.",
      whyItFails:
        "For y = x and y = x², substitution gives x = x². Dividing by x assumes x is not zero, but x = 0 gives the valid intersection (0, 0). The division deletes that root and leaves only (1, 1).",
      correction:
        "Move every term to one side and factorise: x² − x = x(x − 1) = 0, so x = 0 or x = 1. Never divide by a variable whose zero value could be a solution.",
      contrast: {
        wrong: "x = x², divide by x, so x = 1",
        right: "x² − x = x(x − 1) = 0, so x = 0 or x = 1",
      },
    },
    {
      id: "m4",
      belief: "The two x-values can be paired with the two y-values in either order.",
      whyItFails:
        "Each y belongs to one x through the line. For y = x + 3, x = 2 gives y = 5 and x = −1 gives y = 2. Pairing 2 with 2 gives (2, 2), which lies on neither graph; the y-values are not interchangeable.",
      correction:
        "Substitute each x separately and write the arrow from that x to its y. Check each finished pair in both equations.",
      contrast: {
        wrong: "x = 2, −1 and y = 5, 2, so the points are (2, 2) and (−1, 5)",
        right: "(2, 5) and (−1, 2), each y produced by its own x",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Solve y = x + 2 and y = x².",
      hint:
        "Substitute x + 2 for y, rearrange to x² − x − 2 = 0, factorise, then use the line for each y.",
      answer: "(2, 4) and (−1, 1)",
      feedback: {
        correct:
          "x + 2 = x² gives x² − x − 2 = (x − 2)(x + 1) = 0, so x = 2 or x = −1. The line gives y = 4 and y = 1. Both points check in y = x².",
        incorrect:
          "Move every term to one side before factorising: x² − x − 2 = 0. The factors are (x − 2)(x + 1), and each x must still be put into the line to find its y.",
      },
    },
    {
      id: "p2",
      prompt: "Solve y = 2x and y = x² + 1. How many intersections are there?",
      hint:
        "Substitute 2x for y, rearrange to x² − 2x + 1 = 0, and recognise a perfect square.",
      answer: "One intersection at (1, 2), because (x − 1)² = 0 has a repeated root.",
      feedback: {
        correct:
          "2x = x² + 1 gives x² − 2x + 1 = (x − 1)² = 0, so x = 1 and y = 2. The discriminant is zero, so the line is tangent at one point.",
        incorrect:
          "The quadratic is x² − 2x + 1 = 0, which factorises as (x − 1)². A repeated root gives one point, not two: x = 1 and y = 2.",
      },
    },
    {
      id: "p3",
      prompt: "Solve y = x + 4 and y = x² + 2.",
      hint:
        "Substitute x + 4 for y, rearrange, and factorise the resulting quadratic.",
      answer: "(2, 6) and (−1, 3)",
      feedback: {
        correct:
          "x + 4 = x² + 2 gives x² − x − 2 = 0, so x = 2 or x = −1. The line gives y = 6 and y = 3, and both pairs satisfy the curve.",
        incorrect:
          "Collect on one side: x² − x − 2 = 0. Its factors are (x − 2)(x + 1), and substituting each x into y = x + 4 gives the matching y-values.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Solve y = x + 6 and y = x².",
      modelAnswer: "(3, 9) and (−2, 4)",
      marking: [
        "Substitutes x + 6 for y and rearranges to x² − x − 6 = 0.",
        "Factorises to (x − 3)(x + 2) = 0 and obtains x = 3 or x = −2.",
        "Uses the line to obtain y = 9 and y = 4, and checks both points in the curve.",
      ],
      check: { accepted: ["(3, 9) and (−2, 4)", "(3,9),(-2,4)", "x = 3, y = 9; x = −2, y = 4"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner solves y = 2x − 1 and y = x² − 2x + 3 and obtains (x − 2)² = 0. Explain what this tells them about the graphs, state the intersection point, and say why “there is only one root” does not mean the method lost an answer.",
      modelAnswer:
        "The equation (x − 2)² = 0 has a repeated root at x = 2, so its discriminant is zero and the line is tangent to the parabola. The line gives y = 2(2) − 1 = 3, so the single intersection is (2, 3). The quadratic has two equal roots, x = 2 and x = 2, which describe the same point; no distinct second point exists, so nothing was lost. A positive discriminant would give two distinct x-values and two points, while a negative discriminant would give no real point.",
      marking: [
        "Interprets the repeated root as a tangent or discriminant-zero case.",
        "Obtains the point (2, 3) by substituting x = 2 into the line.",
        "Explains that the two equal roots coincide, so one point is the complete answer.",
        "Contrasts this with the positive and negative discriminant cases.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A learner finds x = 1 and x = 4 for y = x + 1 and y = x² − 4x + 5, then writes the solutions as (1, 1) and (4, 4). Correct the pairings and explain the error.",
      modelAnswer:
        "(1, 2) and (4, 5). The y-values must come from substituting each x into the same line: 1 + 1 = 2 and 4 + 1 = 5. The learner used each x as its own y, which is not the line's rule.",
      marking: [
        "Corrects both points to (1, 2) and (4, 5).",
        "Explains that the y-coordinate is obtained from the line for that x, not copied from x.",
      ],
      check: {
        accepted: [
          "(1, 2) and (4, 5). The y-values must come from substituting each x into the same line: 1 + 1 = 2 and 4 + 1 = 5. The learner used each x as its own y, which is not the line's rule.",
          "(1, 2) and (4, 5)",
          "(1,2),(4,5)",
          "x = 1, y = 2; x = 4, y = 5",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A small workshop's revenue from selling n items is R = 12n − n² pounds, and its cost is C = 2n + 9 pounds. Find the break-even values of n by solving R = C. Explain what the two solutions mean, and state the values of n for which the workshop makes a profit.",
      whyItTransfers:
        "The learner must recognise that break-even means the two expressions are equal, substitute one into the other, solve a quadratic in context, and then interpret both roots rather than automatically accepting them. The profit interval requires reading the quadratic's sign between its roots, which is a different question from finding the roots. The context also makes the two-intersection case meaningful: one break-even point would be a tangent, and no real point would mean the workshop never covers its costs.",
      answer:
        "Set 12n − n² = 2n + 9. Rearranging gives n² − 10n + 9 = 0, so (n − 1)(n − 9) = 0 and n = 1 or n = 9. At n = 1, R = 11 and C = 11; at n = 9, R = 27 and C = 27. The workshop breaks even at 1 item and at 9 items. Between them, for 1 < n < 9, revenue is greater than cost, so it makes a profit; outside that interval it makes a loss. Both roots are admissible because a whole number of items can be 1 or 9.",
      marking: [
        "Sets the revenue and cost expressions equal and rearranges to n² − 10n + 9 = 0.",
        "Factorises or solves the quadratic to obtain n = 1 and n = 9.",
        "Checks both break-even values in R and C.",
        "Explains that profit occurs between the roots, not at them, and states 1 < n < 9.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Solve y = x and y = x².",
      answer:
        "x = x² gives x² − x = x(x − 1) = 0, so x = 0 or x = 1. The points are (0, 0) and (1, 1). Dividing by x would have lost the origin.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Without solving, how many real intersections do y = x + 5 and y = x² + 1 have? Explain using the discriminant.",
      answer:
        "Substitution gives x² − x − 4 = 0. Its discriminant is 1 + 16 = 17, which is positive, so there are two distinct real intersections.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain why a line and a quadratic cannot have three intersection points.",
      answer:
        "Substituting the line into the quadratic produces a quadratic equation in one unknown. A quadratic has at most two real roots, and each intersection gives one of those roots, so there can be at most two intersection points.",
      when: "month-later",
    },
  ],

  summary: [
    "Substitute the linear expression into the quadratic to obtain a quadratic in one unknown.",
    "Rearrange to zero, factorise or use the quadratic formula, and keep every root.",
    "Each root is an x-coordinate; substitute it into the line to obtain the matching y and write the point.",
    "The discriminant decides the geometry: positive gives two points, zero gives one tangent point, negative gives no real point.",
    "Never divide by a variable that could be zero; factorise instead.",
    "Check each coordinate pair in both original equations and interpret the roots in context.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each equation is read as a separate sentence, substitution is announced as “replace y with x plus three”, and each intersection is read as a coordinate pair with its two values named.",
    },
    {
      need: "dyslexia",
      alternative:
        "The rearrangement is laid out one operation per line, with the operation named between lines, so collecting terms and factorising are not hidden inside a dense block of symbols.",
    },
    {
      need: "colour-vision",
      alternative:
        "The line and curve in the graph are distinguished by their equations and labels as well as by colour, and the number of intersections is stated in text beside the drawing.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed. No dragging a line, clicking an intersection or manipulating a graph is required.",
    },
    {
      need: "cognitive",
      alternative:
        "The three cases are presented as a repeated structure: substitute, rearrange, discriminate, solve, pair, check. The same six steps are used in every worked example.",
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
        "All teaching prose, examples, practice, assessment and the workshop break-even transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for simultaneous equations with one linear and one quadratic equation.",
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
