import type { AuthoredLesson } from "../../lesson-contract";

// THE IDENTITY IS PYTHAGORAS ON THE UNIT CIRCLE, AND THE GRAPHS ARE THE SAME
// FACT READ AROUND A FULL TURN.
//
// The lesson starts from the unit circle because it explains three things at
// once: why sin and cos can be negative outside the first quadrant, why their
// squares still add to 1, and why tan is undefined where cos is zero. The two
// identities are then used as replacements, not as slogans. The most common
// error in this topic is not a wrong value; it is cancelling a term from a sum,
// so the lesson separates "a factor common to the whole side" from "one term of
// a sum" with a numerical counterexample. Exact values are derived from the
// half-square and half-equilateral triangles, and the graphs are read for
// period, amplitude, intercepts and asymptotes before a simple equation is
// solved with more than one solution.
export const MATHS_TRIG_IDENTITY: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "trig-identity",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry and measures: trigonometric ratios, exact values, the identity sin²θ + cos²θ = 1, and the graphs of sine, cosine and tangent",
    level: "Key Stage 4 to GCSE Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the tide-model transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Read sin θ and cos θ as the coordinates of a point on the unit circle, including for angles outside the first quadrant.",
      evidence:
        "The learner explains why a point at 150° has a positive sine and a negative cosine, and why its coordinates still satisfy x² + y² = 1.",
    },
    {
      statement:
        "Use sin²θ + cos²θ = 1 and tan θ = sin θ / cos θ to find a missing ratio or simplify an expression, stating any restriction.",
      evidence:
        "Given sin θ = 3/5 with θ acute, the learner obtains cos θ = 4/5 and tan θ = 3/4, and simplifies (1 − sin²θ)/cos θ to cos θ for cos θ ≠ 0.",
    },
    {
      statement:
        "Derive and use the exact values of sine, cosine and tangent at 0°, 30°, 45°, 60° and 90°.",
      evidence:
        "The learner states sin 30° = 1/2, cos 30° = √3/2 and tan 45° = 1 without a calculator, and explains the values from the special triangles.",
    },
    {
      statement:
        "Read period, amplitude, intercepts and asymptotes from the sine, cosine and tangent graphs, and solve a simple trig equation over a full turn.",
      evidence:
        "The learner gives both solutions of sin θ = 1/2 in 0° ≤ θ ≤ 360° as 30° and 150°, and explains why tan θ is undefined at 90°.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["trig-ratios", "functions"],
    check: [
      {
        id: "d1",
        question: "In a right triangle, write the three trig ratios for an acute angle θ.",
        answer:
          "sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse, tan θ = opposite/adjacent. The hypotenuse is opposite the right angle; the other two labels depend on θ.",
        targets: ["trig-ratios"],
      },
      {
        id: "d2",
        question: "For f(x) = 2x + 1, evaluate f(3) and explain what the bracket means.",
        answer:
          "f(3) = 2(3) + 1 = 7. The bracket is the input to the function, not multiplication: every x in the rule is replaced by 3.",
        targets: ["functions"],
      },
      {
        id: "d3",
        question: "What does it mean for a function to be one-to-one on its domain?",
        answer:
          "Each output comes from exactly one input. Two different inputs never share an output, so the inverse is also a function on that domain.",
        targets: ["functions"],
      },
    ],
  },

  introduction: {
    hook:
      "A point moves anticlockwise around a circle of radius 1. Its coordinates are (cos θ, sin θ). At 0° it is at (1, 0); at 90° it is at (0, 1); at 180° it is at (−1, 0). The distance from the origin never changes, so the squares of the two coordinates always add to 1. That single geometric fact is the identity sin²θ + cos²θ = 1. The same moving point also explains why sine and cosine become negative in some quadrants, and why the tangent graph has a vertical asymptote at 90°.",
    why:
      "The identities are the algebra that lets one trig ratio stand in for another. They turn a messy expression into a simple one and connect a triangle's sides to a circle's coordinates. The graphs are the same information over a full turn: a sine wave repeats every 360°, a cosine wave is the same shape shifted, and tangent repeats every 180° with gaps where cosine is zero. Exact values let you work without a calculator, and the graph explains why an equation such as sin θ = 1/2 has two solutions in one turn rather than the one an inverse function returns.",
  },

  explanation: [
    {
      heading: "The unit circle extends the triangle ratios to every angle",
      paragraphs: [
        "A unit circle has centre at the origin and radius 1. Start at (1, 0) and rotate anticlockwise through an angle θ. The point you reach has coordinates (cos θ, sin θ). At 0° the point is (1, 0), so cos 0° = 1 and sin 0° = 0. At 90° it is (0, 1), so cos 90° = 0 and sin 90° = 1. At 180° it is (−1, 0), so cos 180° = −1 and sin 180° = 0. This agrees with the right-triangle ratios in the first quadrant and extends them to angles that no right triangle can show.",
        "The x-coordinate is the cosine and the y-coordinate is the sine. That is the whole definition. A point in the second quadrant has a negative x and a positive y, so cos θ is negative and sin θ is positive. A point in the third quadrant has both negative. A point in the fourth has positive cosine and negative sine. The signs are not arbitrary rules to memorise; they are the signs of the coordinates in that part of the plane.",
        "The tangent is the ratio of the coordinates: tan θ = y/x = sin θ/cos θ. It is the gradient of the radius from the origin to the point. When the point is on the y-axis, x = 0, so the gradient is undefined and tangent has no value. That happens at 90°, 270° and every angle coterminal with them. The tangent graph's asymptotes are exactly those places.",
      ],
    },
    {
      heading: "The Pythagorean identity is a distance that does not change",
      paragraphs: [
        "The point (cos θ, sin θ) lies on the unit circle, so its distance from the origin is 1. By Pythagoras, x² + y² = 1², which gives cos²θ + sin²θ = 1. The notation sin²θ means (sin θ)², not sin(θ²). The identity holds for every angle, not only acute ones, because the point stays on the circle through every quadrant.",
        "The identity lets you replace one squared ratio with the other. If sin θ = 3/5, then (3/5)² + cos²θ = 1, so cos²θ = 1 − 9/25 = 16/25. The acute angle has a positive cosine, so cos θ = 4/5. If the angle were in the second quadrant, the same squared value would give cos θ = −4/5, because the x-coordinate is negative there. The identity fixes the size of the cosine; the quadrant fixes its sign.",
        "The identity does not say sin θ + cos θ = 1. Squaring changes the sum. At θ = 30°, sin 30° + cos 30° = 0.5 + 0.866 ≈ 1.366, not 1, while (0.5)² + (0.866)² = 0.25 + 0.75 = 1. The squares add to 1 because they are the two legs of a right triangle with hypotenuse 1; the unsquared lengths do not.",
      ],
    },
    {
      heading: "The quotient identity turns tangent into sine and cosine",
      paragraphs: [
        "Because tan θ = y/x and the coordinates are sin θ and cos θ, tan θ = sin θ/cos θ wherever cos θ ≠ 0. This is not a new definition; it is the unit-circle definition written in the two coordinates. It is useful when an expression mixes tangent with sine and cosine, because it gives every term the same two ingredients.",
        "The restriction matters. At 90°, cos 90° = 0, so the fraction has a zero denominator and tangent is undefined. Writing tan 90° = sin 90°/cos 90° = 1/0 does not produce a very large number; it produces no value at all. A graph drawn through that point would be a lie, which is why the tangent graph is drawn as separate branches with a vertical asymptote.",
        "The quotient identity also explains the sign of tangent. In the first quadrant both coordinates are positive, so tan is positive. In the second, sine is positive and cosine negative, so tan is negative. In the third both are negative, so their quotient is positive. In the fourth, sine is negative and cosine positive, so tan is negative. The ASTC pattern — all, sine, tangent, cosine positive — is a summary of the coordinate signs, not a separate rule.",
      ],
    },
    {
      heading: "Exact values come from two triangles",
      paragraphs: [
        "A 45° right triangle is half a square. If the two equal legs are 1, the hypotenuse is √2, so sin 45° = 1/√2 = √2/2 and cos 45° = √2/2. The tangent is 1/1 = 1. A 30°–60°–90° triangle is half an equilateral triangle of side 2. Its shortest side is 1, its hypotenuse is 2 and its remaining side is √3, so sin 30° = 1/2, cos 30° = √3/2 and tan 30° = 1/√3 = √3/3. Swapping the angle swaps sine and cosine and gives the 60° values.",
        "The exact values at 0° and 90° come from the unit circle, not from a triangle. At 0° the point is (1, 0), so sin 0° = 0, cos 0° = 1 and tan 0° = 0. At 90° the point is (0, 1), so sin 90° = 1 and cos 90° = 0; tangent is undefined. These values are the endpoints of the first-quadrant table and the reason the sine graph starts at 0 and the cosine graph starts at 1.",
        "The same angles in radians are π/6, π/4, π/3 and π/2. The values of sine and cosine do not change when the unit changes; only the number used to name the angle changes. A calculator in degree mode returns 0.5 for sin 30; in radian mode it evaluates 30 radians and returns a different number. The exact-value table is a check on the mode as well as a set of facts.",
      ],
    },
    {
      heading: "The graphs are the identities over a full turn",
      paragraphs: [
        "The sine graph starts at 0, rises to 1 at 90°, returns to 0 at 180°, falls to −1 at 270° and returns to 0 at 360°. It repeats every 360°, so its period is 360°, and it oscillates between −1 and 1, so its amplitude is 1. The cosine graph starts at 1, reaches 0 at 90°, −1 at 180°, 0 at 270° and 1 at 360°. It has the same period and amplitude but is the sine graph shifted by 90°.",
        "The tangent graph starts at 0, rises through 1 at 45°, and becomes arbitrarily large as the angle approaches 90° from below. Immediately after 90° it reappears from far below, rises through 0 at 180°, and repeats. Its period is 180°, not 360°, because tan(θ + 180°) = tan θ: adding half a turn sends the point to the opposite side of the circle, changing the signs of both coordinates, so their quotient is unchanged. Tangent has no amplitude because it takes every real value.",
        "A trig equation over a full turn usually has more than one solution. The inverse sine of 1/2 returns 30°, but sin 150° is also 1/2, because the point at 150° has the same positive y-coordinate. The graph shows both crossings. For cosine, the symmetry is about the y-axis: cos θ = −1/2 has solutions at 120° and 240°. Reading the graph or the unit circle after the inverse function is what prevents a learner from stopping at the principal value.",
      ],
    },
    {
      heading: "Simplify by replacing, never by cancelling a term",
      paragraphs: [
        "An identity is used by replacing a whole expression with an equal one. In (1 − sin²θ)/cos θ, the numerator is cos²θ by the Pythagorean identity, so the fraction becomes cos²θ/cos θ = cos θ, provided cos θ ≠ 0. The replacement is legitimate because 1 − sin²θ and cos²θ are equal for every θ. The division is legitimate only where the denominator is not zero, which is why the restriction is part of the answer.",
        "Cancelling is different. You may cancel a factor that multiplies the whole numerator and the whole denominator, not a term that is added to something else. In (sin²θ + cos²θ)/cos²θ, the numerator is 1, so the expression is 1/cos²θ. You may not cancel cos²θ from the sum to leave sin²θ; that removes a term rather than a factor and changes the value.",
        "A numerical check catches this class of error. At θ = 45°, sin²θ + cos²θ = 1, while sin²θ alone is 1/2. If a simplification turns 1 into 1/2, it has done something illegal. Identities are proved by showing both sides are the same expression for every allowed angle, not by performing the same operation on each side until they happen to look alike.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A point on the unit circle has coordinates (cos θ, sin θ), so the distance from the origin gives the Pythagorean identity.",
      notation:
        "x² + y² = 1  →  cos²θ + sin²θ = 1   ·   sin²θ means (sin θ)²",
      caption:
        "The identity holds in every quadrant because the point stays on the circle. The signs of sin θ and cos θ change, but their squares do not.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Tangent is the quotient of the coordinates, so it is undefined wherever cosine is zero.",
      notation:
        "tan θ = sin θ / cos θ   ·   tan 90° is undefined because cos 90° = 0   ·   tan(θ + 180°) = tan θ",
      caption:
        "The quotient identity is why the tangent graph repeats every 180° and why it has a vertical asymptote at 90°, 270° and every half-turn after them.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "The exact values at the special angles are read from a half-square and a half-equilateral triangle.",
      notation:
        "sin 0° = 0, cos 0° = 1   ·   sin 30° = 1/2, cos 30° = √3/2   ·   sin 45° = cos 45° = √2/2   ·   sin 60° = √3/2, cos 60° = 1/2   ·   sin 90° = 1, cos 90° = 0",
      caption:
        "Tangent is the quotient: tan 30° = 1/√3 = √3/3, tan 45° = 1, tan 60° = √3. At 90° it is undefined, not zero.",
    },
    {
      id: "r4",
      kind: "maths.graph",
      body:
        "The sine and cosine graphs repeat every 360° with amplitude 1; the tangent graph repeats every 180° and has asymptotes where cosine is zero.",
      notation:
        "y = sin θ: 0, 1, 0, −1, 0 at 0°, 90°, 180°, 270°, 360°   ·   y = cos θ: 1, 0, −1, 0, 1 at the same angles   ·   y = tan θ: asymptote at 90° and 270°",
      caption:
        "The equations sin θ = 1/2 and cos θ = −1/2 each have two solutions in one full turn because the graph crosses the horizontal line twice.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Given sin θ = 3/5 and θ is acute, find cos θ and tan θ without a calculator.",
      steps: [
        {
          move: "Use the Pythagorean identity: sin²θ + cos²θ = 1, so (3/5)² + cos²θ = 1.",
          why:
            "The identity connects the two squared ratios for every angle. It is the unit-circle distance written in coordinates.",
        },
        {
          move: "Compute (3/5)² = 9/25, so cos²θ = 1 − 9/25 = 16/25.",
          why:
            "Subtracting the known square isolates the unknown square. The arithmetic is on the squares, not on the ratios themselves.",
        },
        {
          move: "Take the square root: cos θ = ±4/5. Because θ is acute, the point is in the first quadrant, where cosine is positive, so cos θ = 4/5.",
          why:
            "The identity fixes the size of cosine but not its sign. The quadrant decides the sign from the coordinates of the unit-circle point.",
        },
        {
          move: "Use the quotient identity: tan θ = sin θ/cos θ = (3/5)/(4/5) = 3/4.",
          why:
            "Dividing by a fraction multiplies by its reciprocal: (3/5) × (5/4) = 3/4. The result is positive, as tangent is in the first quadrant.",
        },
        {
          move: "Check: cos²θ + sin²θ = (4/5)² + (3/5)² = 16/25 + 9/25 = 1, and tan θ = 3/4.",
          why:
            "The check confirms both the identity and the quotient. The 3–4–5 triangle is the same ratio scaled, which is why the numbers are familiar.",
        },
      ],
      answer: "cos θ = 4/5 and tan θ = 3/4",
    },
    {
      id: "w2",
      prompt:
        "Simplify (1 − sin²θ)/cos θ, stating any restriction.",
      steps: [
        {
          move: "Recognise the numerator as a rearrangement of the Pythagorean identity: 1 − sin²θ = cos²θ.",
          why:
            "The identity is sin²θ + cos²θ = 1, so subtracting sin²θ from both sides gives 1 − sin²θ = cos²θ. This is a replacement of the whole numerator.",
        },
        {
          move: "Substitute: (1 − sin²θ)/cos θ = cos²θ/cos θ.",
          why:
            "The numerator and denominator now use the same ratio, so the fraction can be reduced by cancelling a common FACTOR.",
        },
        {
          move: "Cancel one factor of cos θ: cos²θ/cos θ = cos θ.",
          why:
            "cos²θ means cos θ × cos θ, so one factor cancels with the denominator. The result is cos θ, not cos²θ.",
        },
        {
          move: "State the restriction cos θ ≠ 0, so θ ≠ 90° + 180°n.",
          why:
            "The original fraction is undefined where the denominator is zero. The simplification is valid only on the domain where the original expression exists.",
        },
        {
          move: "The simplified expression is cos θ, provided cos θ ≠ 0.",
          why:
            "The check is structural: replacing 1 − sin²θ by cos²θ is an identity, and the only excluded values are the zeros of the original denominator.",
        },
      ],
      answer: "cos θ, for cos θ ≠ 0",
    },
    {
      id: "w3",
      prompt:
        "Solve sin θ = 1/2 for 0° ≤ θ ≤ 360°. Explain why there is more than one solution.",
      steps: [
        {
          move: "Find the principal value: sin⁻¹(1/2) = 30°.",
          why:
            "The inverse sine returns the angle in the first quadrant whose sine is 1/2. This is one solution, not necessarily all of them.",
        },
        {
          move: "Use the unit circle: sine is the y-coordinate. The horizontal line y = 1/2 cuts the circle at two points, one in the first quadrant and one in the second.",
          why:
            "The second point has the same positive y-coordinate, so it has the same sine. The angle is 180° − 30° = 150°.",
        },
        {
          move: "Check both: sin 30° = 1/2 and sin 150° = 1/2.",
          why:
            "The reference angle is 30° in both cases; the second-quadrant angle has the same sine because its y-coordinate is the same.",
        },
        {
          move: "No other angle in 0° to 360° has sine 1/2: the third and fourth quadrants have negative y-coordinates.",
          why:
            "Sine is negative below the x-axis, so the line y = 1/2 cannot meet the circle there. The two intersections are the complete solution set for this interval.",
        },
        {
          move: "The solutions are θ = 30° and θ = 150°, and both have sine 1/2.",
          why:
            "Writing both values is the answer to the equation over the full turn. Stopping at 30° answers only the inverse-function question.",
        },
      ],
      answer: "θ = 30° or 150°",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "sin²θ + cos²θ = 1 means sin θ + cos θ = 1.",
      whyItFails:
        "Squaring a sum is not the same as adding the squares. At θ = 30°, sin 30° + cos 30° ≈ 0.5 + 0.866 = 1.366, while sin²30° + cos²30° = 0.25 + 0.75 = 1. The identity is about the squares, because those are the two legs of the unit-circle right triangle.",
      correction:
        "Keep the squares until the identity has done its job. Replace a squared ratio with the other squared ratio, then take a square root only when the sign is decided by the quadrant.",
      contrast: {
        wrong: "sin θ + cos θ = 1",
        right: "sin²θ + cos²θ = 1",
      },
    },
    {
      id: "m2",
      belief: "I can cancel sin²θ from sin²θ + cos²θ because it is one of the terms.",
      whyItFails:
        "There is no sin²θ on the other side to cancel with; 1 is a separate term. Cancelling a term from a sum changes the value. At θ = 45°, sin²θ + cos²θ = 1, but sin²θ alone is 1/2. The operation has turned a true identity into a false statement.",
      correction:
        "Cancel only a factor common to the whole numerator and denominator. In (sin²θ + cos²θ)/cos²θ, replace the numerator by 1; do not remove one of its terms.",
      contrast: {
        wrong: "(sin²θ + cos²θ)/cos²θ = sin²θ",
        right: "(sin²θ + cos²θ)/cos²θ = 1/cos²θ",
      },
    },
    {
      id: "m3",
      belief: "The sine graph has period 180° and amplitude 2 because it goes from −1 to 1.",
      whyItFails:
        "The sine graph returns to the same value and the same direction after 360°, not 180°. After 180° it is at 0 but heading downward, whereas at 0° it was heading upward. Amplitude is half the distance from the minimum to the maximum: (1 − (−1))/2 = 1, not 2.",
      correction:
        "Read a full cycle from one peak to the next, or from one rising zero crossing to the next. The sine and cosine periods are 360°; the tangent period is 180° because both coordinates change sign together.",
      contrast: {
        wrong: "y = sin θ has period 180° and amplitude 2",
        right: "y = sin θ has period 360° and amplitude 1",
      },
    },
    {
      id: "m4",
      belief: "The inverse sine gives every solution of a trig equation.",
      whyItFails:
        "The inverse sine is defined to return one principal value, usually between −90° and 90°. It cannot return 150° for sin θ = 1/2, even though 150° is a solution, because a function must give one output. The equation has two solutions in a full turn; the inverse function reports one of them.",
      correction:
        "Use the inverse to find the reference angle, then use the unit circle or graph to find every angle in the required interval with the same sine or cosine. Check the quadrant signs.",
      contrast: {
        wrong: "sin θ = 1/2 has the only solution θ = 30°",
        right: "sin θ = 1/2 has θ = 30° and θ = 150° in 0° to 360°",
      },
    },
    {
      id: "m5",
      belief: "tan 90° is a very large number because sin 90° is 1 and cos 90° is close to 0.",
      whyItFails:
        "cos 90° is exactly 0, not a small positive number. The quotient 1/0 is undefined. As the angle approaches 90° the tangent grows without bound, but at 90° there is no point on the y-axis with a finite gradient.",
      correction:
        "State that tangent is undefined where cosine is zero. The graph has a vertical asymptote there, and the value is not a number to be approximated.",
      contrast: {
        wrong: "tan 90° = a very large number",
        right: "tan 90° is undefined; the graph has an asymptote",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Given cos θ = 5/13 and θ is acute, find sin θ and tan θ.",
      hint:
        "Use sin²θ = 1 − cos²θ. The acute angle has positive sine; then use tan θ = sin θ/cos θ.",
      answer: "sin θ = 12/13 and tan θ = 12/5",
      feedback: {
        correct:
          "sin²θ = 1 − 25/169 = 144/169, so sin θ = 12/13. Then tan θ = (12/13)/(5/13) = 12/5. The 5–12–13 triangle is the scaled check.",
        incorrect:
          "Square the cosine first: cos²θ = 25/169. Then sin²θ = 144/169 and, because θ is acute, sin θ = 12/13. Divide sine by cosine to get tan θ = 12/5.",
      },
    },
    {
      id: "p2",
      prompt:
        "Simplify (1 − cos²θ)/sin θ, stating any restriction.",
      hint:
        "Replace 1 − cos²θ using the Pythagorean identity, then cancel the common factor.",
      answer: "sin θ, for sin θ ≠ 0",
      feedback: {
        correct:
          "1 − cos²θ = sin²θ, so the fraction is sin²θ/sin θ = sin θ. The original denominator cannot be zero, so θ ≠ 0°, 180°, 360°, …",
        incorrect:
          "The numerator becomes sin²θ, not sin θ. Then sin²θ/sin θ = sin θ. State that sin θ cannot be zero because it was the original denominator.",
      },
    },
    {
      id: "p3",
      prompt:
        "Solve sin θ = √3/2 for 0° ≤ θ ≤ 360°.",
      hint:
        "The principal value is 60°. Sine is positive in the first and second quadrants; find the second-quadrant angle with the same reference angle.",
      answer: "θ = 60° or 120°",
      feedback: {
        correct:
          "sin⁻¹(√3/2) = 60°. The other point with the same positive y-coordinate is 180° − 60° = 120°. Both have sine √3/2.",
        incorrect:
          "Start with 60° from the inverse sine. The second solution is 180° − 60° = 120°, not 360° − 60°, because sine is positive in the second quadrant and negative in the fourth.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Given sin θ = 7/25 and θ is acute, find cos θ and tan θ as exact fractions.",
      modelAnswer: "cos θ = 24/25 and tan θ = 7/24",
      marking: [
        "Squares 7/25 to obtain 49/625 and subtracts from 1 to get 576/625.",
        "Takes the positive square root for the acute angle: cos θ = 24/25.",
        "Divides sine by cosine to obtain tan θ = 7/24.",
      ],
      check: {
        accepted: [
          "cos θ = 24/25 and tan θ = 7/24",
          "24/25 and 7/24",
          "cos θ = 24/25, tan θ = 7/24",
        ],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "Explain why sin²θ + cos²θ = 1 using the unit circle. Then explain, with a numerical example, why sin θ + cos θ is not generally equal to 1.",
      modelAnswer:
        "The point (cos θ, sin θ) lies on the unit circle, whose equation is x² + y² = 1, so cos²θ + sin²θ = 1. The identity is about the squares, which are the legs of a right triangle with hypotenuse 1. It does not say the unsquared coordinates add to 1: at θ = 30°, sin 30° + cos 30° ≈ 0.5 + 0.866 = 1.366, not 1, while 0.5² + 0.866² = 0.25 + 0.75 = 1.",
      marking: [
        "Places (cos θ, sin θ) on the unit circle or uses a right triangle with hypotenuse 1.",
        "Applies Pythagoras or x² + y² = 1 to obtain sin²θ + cos²θ = 1.",
        "Gives a numerical example showing sin θ + cos θ ≠ 1 in general.",
        "Distinguishes the squares from the unsquared ratios.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Solve cos θ = −1/2 for 0° ≤ θ ≤ 360°.",
      modelAnswer: "θ = 120° or 240°",
      marking: [
        "Finds the reference angle 60° from cos⁻¹(1/2).",
        "Places cosine negative in the second and third quadrants: 180° − 60° and 180° + 60°.",
        "Gives both solutions, 120° and 240°, in the required interval.",
      ],
      check: {
        accepted: [
          "θ = 120° or 240°",
          "120° and 240°",
          "120, 240",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "The height of water at a harbour is modelled by h(t) = 10 + 6 sin(30t°), where h is in metres and t is in hours after midnight. State the period, maximum and minimum height. Find the first two times after midnight when the height is 13 m, and explain why there are two.",
      whyItTransfers:
        "The learner must read a trigonometric model rather than a triangle: the coefficient 30 sets the period, the 6 sets the amplitude around a mean of 10, and the equation h = 13 becomes sin(30t°) = 1/2. The two solutions are the two crossings of a sine wave on its way up and on its way down, which is the graph idea applied to a real cycle.",
      answer:
        "The sine term repeats every 360°, so 30t = 360 gives a period of 12 hours. The maximum is 10 + 6 = 16 m and the minimum is 10 − 6 = 4 m. Setting h = 13 gives 6 sin(30t°) = 3, so sin(30t°) = 1/2. The solutions in one cycle are 30t = 30 or 150, so t = 1 or 5 hours. There are two because the tide is at 13 m once on the rising tide and once on the falling tide.",
      marking: [
        "Reads the period as 12 hours from 30t = 360.",
        "States the maximum 16 m and minimum 4 m from the amplitude 6 about the mean 10.",
        "Forms sin(30t°) = 1/2 and finds both t = 1 and t = 5 within the first cycle.",
        "Explains that the two times are the rising and falling crossings of the same height.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State the exact values of sin 30°, cos 60° and tan 45°.",
      answer:
        "sin 30° = 1/2, cos 60° = 1/2 and tan 45° = 1. The 30° and 60° values come from the half-equilateral triangle; tan 45° = 1 because the half-square has equal legs.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Given cos θ = 8/17 and θ is acute, find sin θ and tan θ.",
      answer:
        "sin²θ = 1 − 64/289 = 225/289, so sin θ = 15/17. Then tan θ = (15/17)/(8/17) = 15/8. The 8–15–17 triangle is the check.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "What are the period and amplitude of y = sin θ? What is the period of y = tan θ, and why is tan 90° undefined?",
      answer:
        "y = sin θ has period 360° and amplitude 1. y = tan θ has period 180° because adding 180° changes the signs of both coordinates and their quotient is unchanged. tan 90° is undefined because cos 90° = 0, so the quotient sin 90°/cos 90° has a zero denominator; the graph has a vertical asymptote there.",
      when: "month-later",
    },
  ],

  summary: [
    "A point on the unit circle has coordinates (cos θ, sin θ), so cos²θ + sin²θ = 1 for every angle.",
    "The identity is about the squares; sin θ + cos θ is not generally 1.",
    "tan θ = sin θ/cos θ where cos θ ≠ 0; tangent is undefined wherever cosine is zero.",
    "The signs of sine, cosine and tangent follow the coordinates in each quadrant; ASTC summarises them.",
    "The exact values at 0°, 30°, 45°, 60° and 90° come from the unit circle and the two special triangles.",
    "Sine and cosine have period 360° and amplitude 1; tangent has period 180° and no amplitude, with asymptotes at 90° + 180°n.",
    "A trig equation over a full turn can have two solutions; use the inverse for the reference angle, then the circle or graph for the rest.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "sin²θ is read as “sine squared theta”, not “sine theta squared”, and tan θ is read as “tangent theta”. Each identity is read as a full sentence so the superscript is not lost.",
    },
    {
      need: "dyslexia",
      alternative:
        "The exact-value table is written as one value per line, and each simplification names the replacement before showing the symbols. The lesson avoids long chains of fractions in a single sentence.",
    },
    {
      need: "cognitive",
      alternative:
        "Every identity problem follows the same three questions: which identity connects these terms, what is the allowed domain, and what does the quadrant say about the sign? The routine is repeated in the examples and practice.",
    },
    {
      need: "colour-vision",
      alternative:
        "Quadrant signs are stated as words and coordinates, not shown only by colour. The graphs are described by their values at 0°, 90°, 180°, 270° and 360°.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no graphing, dragging or interactive unit-circle manipulation is required.",
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
        "All teaching prose, examples, practice, assessment and the tide-model transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for trigonometric ratios, exact values, trigonometric identities and graphs.",
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
