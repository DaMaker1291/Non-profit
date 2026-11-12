import type { AuthoredLesson } from "../../lesson-contract";

// A TRIG RATIO IS A PROPERTY OF THE ANGLE, NOT OF THE TRIANGLE'S SIZE.
//
// The lesson starts from similar triangles and proportion, because that is why
// sin, cos and tan are constant for a given angle at all: enlarge the triangle
// and every side grows together, so the ratio does not move. The three ratios are
// then a labelling problem before they are a calculator problem. Most errors a
// learner makes here are not arithmetic errors — they are choosing the wrong
// pair of sides, treating sin⁻¹ as a reciprocal, or leaving the calculator in the
// wrong angle mode. Those three are taught as misconceptions with a contrast
// pair, and the worked examples rearrange the ratio BEFORE substituting so the
// unknown is isolated rather than moved by guesswork.
export const MATHS_TRIG_RATIOS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "trig-ratios",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry and measures: trigonometric ratios in right-angled triangles; angles of elevation and depression",
    level: "Key Stage 4 to GCSE Foundation and Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the surveyor transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Label the opposite, adjacent and hypotenuse sides of a right triangle relative to a chosen acute angle.",
      evidence:
        "Given a right triangle with the angle marked at a different vertex, the learner names the three sides from that angle and explains why the hypotenuse does not change.",
    },
    {
      statement:
        "Choose sine, cosine or tangent from the pair of sides a question connects, using SOH-CAH-TOA as three ratios rather than three formulas to memorise.",
      evidence:
        "The learner selects sin for opposite and hypotenuse, cos for adjacent and hypotenuse, and tan for opposite and adjacent, and rejects a ratio that uses a side the question does not involve.",
    },
    {
      statement:
        "Rearrange a trig ratio before substituting so the unknown is isolated, then evaluate with the calculator in the correct angle mode.",
      evidence:
        "For sin 35° = x/12 the learner writes x = 12 sin 35° and obtains about 6.88 cm, rather than dividing by sin 35° or using radian mode.",
    },
    {
      statement:
        "Use an inverse trig function to find an angle from two sides, and check that the result is plausible.",
      evidence:
        "For opposite 7 and adjacent 10, the learner writes tan θ = 0.7 and obtains θ ≈ 35.0°, then checks that an acute angle near 35° is consistent with the side lengths.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["straight-lines", "proportion"],
    check: [
      {
        id: "d1",
        question: "A map uses the scale 1 : 25,000. What real distance does 4 cm represent?",
        answer:
          "4 cm × 25,000 = 100,000 cm = 1,000 m = 1 km. The scale multiplies every length by the same factor, so the shape stays the same.",
        targets: ["proportion"],
      },
      {
        id: "d2",
        question: "Find the gradient of the straight line through (1, 2) and (5, 10).",
        answer:
          "Gradient = change in y ÷ change in x = (10 − 2)/(5 − 1) = 8/4 = 2. The gradient compares a vertical change with a horizontal change.",
        targets: ["straight-lines"],
      },
      {
        id: "d3",
        question: "Solve x/12 = 0.6.",
        answer:
          "Multiply both sides by 12: x = 12 × 0.6 = 7.2. The fraction bar means division, so undoing it uses multiplication.",
        targets: ["proportion"],
      },
    ],
  },

  introduction: {
    hook:
      "A 6 m ladder leans against a wall with its foot 2.1 m from the wall. How steep is the ladder, and how high does it reach? You could draw the triangle to scale, but there is a better way. The angle at the ground fixes the ratio of the horizontal distance to the ladder's length: 2.1/6 = 0.35. That ratio belongs to an angle of about 69.5°. Once the angle is known, the same triangle's vertical side follows from another ratio. Trigonometry is the set of three ratios that lets one angle and one side determine the rest.",
    why:
      "Right triangles appear wherever a vertical height is measured from a horizontal distance: ramps, roofs, trees, cliffs, navigation and satellite dishes. The three ratios are also the bridge from geometry to waves and circles later. The important idea is not the button labelled sin on a calculator. It is that, for a fixed angle, every right triangle is a scaled copy of every other one, so a ratio of two sides is a property of the angle alone. That is why a surveyor can find the height of a tower without climbing it.",
  },

  explanation: [
    {
      heading: "Similar triangles make the ratios constant",
      paragraphs: [
        "Two right triangles with the same acute angle are similar: one is an enlargement of the other. Every side of the larger triangle is the same multiple of the matching side of the smaller one. That common multiplier cancels in a ratio. If the small triangle has sides 3, 4 and 5 and the large one has 6, 8 and 10, then opposite/hypotenuse is 3/5 in the small triangle and 6/10 = 3/5 in the large one. The ratio depends on the angle, not on the size.",
        "This is the proportion idea from the diagnostic check applied to a shape. The scale factor changes the lengths, but it does not change the comparisons between lengths. A triangle with the same angles but twice the sides has the same sine, cosine and tangent. That is what makes a table of trig values possible: the table records a property of the angle, not a property of one particular drawing.",
        "The three ratios are defined from a right triangle and one acute angle. The hypotenuse is the side opposite the right angle; it is always the longest side. The opposite side faces the chosen angle and does not touch it. The adjacent side touches the chosen angle but is not the hypotenuse. The hypotenuse is fixed for the triangle, while opposite and adjacent swap if you choose the other acute angle. Label the angle first, then label the sides from it.",
      ],
    },
    {
      heading: "SOH-CAH-TOA is a choice between three side pairs",
      paragraphs: [
        "Sine compares the side opposite the angle with the hypotenuse: sin θ = opposite/hypotenuse. Cosine compares the adjacent side with the hypotenuse: cos θ = adjacent/hypotenuse. Tangent compares the opposite side with the adjacent side: tan θ = opposite/adjacent. The mnemonic SOH-CAH-TOA names those three pairs in order. It is not a spell to recite; it is a way to ask which two sides the question connects.",
        "Start by marking the known side and the side you need. If those two are opposite and hypotenuse, use sine. If they are adjacent and hypotenuse, use cosine. If they are opposite and adjacent, use tangent. A ratio that uses a side the question never mentions is the wrong choice even if the arithmetic is correct. For example, if the question gives the angle and the hypotenuse and asks for the adjacent side, cosine is the direct route; sine would introduce the opposite side, which is not wanted.",
        "The angle must be one of the acute angles, not the right angle. The opposite side to the right angle is the hypotenuse, and the other two sides are the legs. If the marked angle is at the top of the triangle rather than the bottom, the labels rotate with it. Redrawing the triangle with the chosen angle marked is often faster than trying to remember which side was horizontal in the original picture.",
      ],
    },
    {
      heading: "Rearrange before you substitute",
      paragraphs: [
        "A trig equation is an equation like any other. If sin 35° = x/12, multiply both sides by 12 to get x = 12 sin 35°. If cos 62° = 15/x, the unknown is in the denominator: multiply by x, then divide by cos 62°, giving x = 15/cos 62°. If tan 40° = 7/x, the same rearrangement gives x = 7/tan 40°. Isolating the unknown first keeps the calculator work to one evaluation and makes the structure of the problem visible.",
        "Substituting numbers before rearranging invites the error of dividing by the wrong quantity. A learner who writes x = sin 35°/12 has divided by 12 instead of multiplying, and the answer is far too small. A learner who writes x = 15 × cos 62° when the unknown is the hypotenuse has multiplied when the unknown was dividing. The rearrangement step is where those mistakes become visible, so write it down rather than doing it in your head.",
        "Keep the calculator's full value until the final rounding. If you round sin 35° to 0.57 and then multiply by 12, you get 6.84 instead of 6.88; the difference is small here but can matter in a multi-step problem. Round the final answer to a sensible number of significant figures and state the unit. Lengths in the same triangle must be in the same unit before the ratio is formed.",
      ],
    },
    {
      heading: "An inverse trig function returns an angle",
      paragraphs: [
        "When two sides are known and the angle is not, the ratio gives a number and the inverse function turns that number back into an angle. If sin θ = 5/13, then θ = sin⁻¹(5/13) ≈ 22.6°. The notation sin⁻¹ means “the angle whose sine is”, not “1 divided by sin”. The inverse is a different operation from the reciprocal, just as “undo” is different from “take the reciprocal”.",
        "The inverse sine and inverse cosine accept values from −1 to 1, because a sine or cosine ratio cannot be larger than 1 in a right triangle. If a calculation gives sin θ = 1.2, the triangle is impossible and the error is in the side labels or the arithmetic, not in the inverse button. The inverse tangent accepts any real number, because the opposite and adjacent sides can be in any proportion. An inverse result should be checked against the diagram: an acute angle in a right triangle lies between 0° and 90°.",
        "The inverse function is also how you recover an angle from a gradient. The tangent of the angle a line makes with the horizontal is its gradient, because tan θ = opposite/adjacent = rise/run. A line with gradient 0.7 makes an angle of tan⁻¹(0.7) ≈ 35° with the horizontal. This is the same ratio as the triangle, read on a graph rather than in a drawing.",
      ],
    },
    {
      heading: "The calculator's angle mode is part of the answer",
      paragraphs: [
        "Sine, cosine and tangent can be evaluated in degrees or radians. The two are different units for angle, just as centimetres and inches are different units for length. In degree mode, sin 30° = 0.5. In radian mode, the calculator reads 30 as 30 radians, which is many full turns, and returns about −0.988. The number is not wrong for 30 radians; it is wrong for the angle the question asked about.",
        "Before evaluating a trig function, check the mode shown on the calculator or the software. The default is not a mathematical fact; it is a setting. A useful sanity check is sin 30° = 0.5. If that produces a negative value near −0.988, the calculator is in radian mode. For a question written with a degree symbol, use degree mode; for a question written in radians, use radian mode. Do not mix the two inside one calculation.",
        "Angle mode is not the only assumption to check. SOH-CAH-TOA applies to right triangles only. A triangle without a right angle needs the sine rule or the cosine rule, which are later tools. If a question gives three sides and no angle, or two sides and an angle that is not between them, do not force a right-triangle ratio onto it. The first question is always: is there a right angle, and which angle am I labelling from?",
      ],
    },
    {
      heading: "Check the answer against the triangle",
      paragraphs: [
        "The hypotenuse must be longer than either leg, so a calculated hypotenuse shorter than a leg is a sign that the ratio was inverted. The sine and cosine of an acute angle must lie between 0 and 1, so a result outside that range cannot be a right-triangle ratio. The tangent can be any positive number for an acute angle, but a very large tangent means the opposite side is much longer than the adjacent side, which should match the picture.",
        "Angles in a right triangle add to 180°, with 90° already used by the right angle, so the two acute angles add to 90°. If one acute angle is 35°, the other is 55°. That gives a second check: the side opposite 55° is the side adjacent to 35°. A calculation that produces an angle of 100° in a right triangle has made an error somewhere, even if the calculator accepted the input.",
        "Finally, check the units and the wording. A height is a length, an angle is measured in degrees or radians, and a ratio has no unit. If the question asks for the angle, do not stop at the side length; if it asks for a side, do not stop at the ratio. The answer should name what it is and, where appropriate, include a unit and a sensible rounding.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The three ratios pair the sides differently. Choose the ratio whose two sides are the ones the question connects.",
      notation:
        "sin θ = opposite/hypotenuse   ·   cos θ = adjacent/hypotenuse   ·   tan θ = opposite/adjacent",
      caption:
        "SOH-CAH-TOA is a decision aid: sine uses the opposite and hypotenuse, cosine uses the adjacent and hypotenuse, tangent uses the opposite and adjacent.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Rearrange the ratio before substituting, so the unknown is alone on one side.",
      notation:
        "sin 35° = x/12  →  x = 12 sin 35° ≈ 6.88   ·   cos 62° = 15/x  →  x = 15/cos 62° ≈ 31.95",
      caption:
        "In the first equation the unknown is multiplied by 1/12, so multiply by 12. In the second it is in the denominator, so multiply by x and divide by cos 62°.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "An inverse trig function turns a ratio back into an angle. It is not a reciprocal.",
      notation:
        "tan θ = 7/10 = 0.7  →  θ = tan⁻¹(0.7) ≈ 35.0°   ·   sin⁻¹(0.5) = 30°",
      caption:
        "tan⁻¹(0.7) asks “which angle has tangent 0.7?”, while 1/tan(0.7) is a different number entirely. The inverse returns an angle; the reciprocal returns a ratio.",
    },
    {
      id: "r4",
      kind: "maths.graph",
      body:
        "The tangent of the angle a line makes with the horizontal is the line's gradient, because both compare rise with run.",
      notation:
        "gradient = rise/run = opposite/adjacent = tan θ   ·   a line of gradient 1 makes a 45° angle with the horizontal",
      caption:
        "This connects the straight-line gradient to the triangle: a gradient of 1 means equal rise and run, so tan θ = 1 and θ = 45°.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A right triangle has an angle of 35° and a hypotenuse of 12 cm. Find the side opposite the 35° angle and the side adjacent to it.",
      steps: [
        {
          move: "Label the sides from the 35° angle: the hypotenuse is 12 cm, the opposite is the unknown x, and the adjacent is the other unknown y.",
          why:
            "The hypotenuse is opposite the right angle. The opposite side faces the 35° angle, and the adjacent side touches it but is not the hypotenuse.",
        },
        {
          move: "For the opposite side, use sine because it connects opposite and hypotenuse: sin 35° = x/12.",
          why:
            "The question connects the unknown opposite side with the known hypotenuse, which is the SOH pair. Cosine would connect the adjacent side instead.",
        },
        {
          move: "Multiply both sides by 12 before substituting: x = 12 sin 35° ≈ 6.88 cm.",
          why:
            "The unknown is divided by 12, so multiplication undoes it. Rearranging first keeps the calculator work to one step.",
        },
        {
          move: "For the adjacent side, use cosine: cos 35° = y/12, so y = 12 cos 35° ≈ 9.83 cm.",
          why:
            "The adjacent side and the hypotenuse are the CAH pair. The two acute angles are complementary, so the side adjacent to 35° is opposite the 55° angle.",
        },
        {
          move: "Check: 6.88² + 9.83² ≈ 47.33 + 96.63 = 143.96 ≈ 144 = 12², and 6.88 < 12, 9.83 < 12.",
          why:
            "The two legs must be shorter than the hypotenuse, and the right-triangle relationship between the sides must hold. The check catches a swapped ratio or a mode error.",
        },
      ],
      answer: "opposite ≈ 6.88 cm and adjacent ≈ 9.83 cm",
    },
    {
      id: "w2",
      prompt:
        "A right triangle has an opposite side of 7 cm and an adjacent side of 10 cm to an unknown acute angle θ. Find θ.",
      steps: [
        {
          move: "The two known sides are opposite and adjacent, so choose tangent: tan θ = 7/10 = 0.7.",
          why:
            "Tangent is the only ratio that uses the opposite and adjacent sides. Sine would need the hypotenuse, which is not given.",
        },
        {
          move: "Apply the inverse tangent: θ = tan⁻¹(0.7).",
          why:
            "The ratio 0.7 is the tangent of the angle, so the inverse function returns the angle whose tangent is 0.7.",
        },
        {
          move: "With the calculator in degree mode, θ ≈ 34.99°, which rounds to 35.0°.",
          why:
            "The inverse tangent gives an angle in the mode the calculator is using. Degree mode is required because the question asks for an angle in a right-triangle diagram, and the result should be acute.",
        },
        {
          move: "Check: tan 35° ≈ 0.700, and 0.7 × 10 = 7, matching the given sides.",
          why:
            "Substituting the angle back into the ratio confirms that the side lengths and the angle agree.",
        },
      ],
      answer: "θ ≈ 35.0°",
    },
    {
      id: "w3",
      prompt:
        "A tree casts a shadow 14 m long on level ground. The angle of elevation of the sun is 38°. Find the height of the tree.",
      steps: [
        {
          move: "Draw the right triangle: the shadow is the adjacent side (14 m), the tree is the opposite side (h), and the angle at the ground is 38°.",
          why:
            "The angle of elevation is measured upward from the horizontal. The height is opposite that angle; the shadow is along the adjacent side.",
        },
        {
          move: "Use tangent because the question connects the opposite height and the adjacent shadow: tan 38° = h/14.",
          why:
            "The hypotenuse is not known or needed. TOA is the direct ratio for opposite and adjacent.",
        },
        {
          move: "Rearrange: h = 14 tan 38°.",
          why:
            "The height is divided by 14, so multiplying both sides by 14 isolates it.",
        },
        {
          move: "Evaluate in degree mode: h ≈ 14 × 0.7813 = 10.94 m, so the tree is about 10.9 m tall.",
          why:
            "The answer is a length, so it carries metres. Rounding to three significant figures reflects the precision of the given measurements.",
        },
        {
          move: "Check: the height is about 10.9 m, so 10.9 m/14 m ≈ 0.78, close to tan 38° ≈ 0.781; the height is shorter than the shadow because 38° is less than 45°.",
          why:
            "For angles below 45°, tan θ < 1, so the opposite side is shorter than the adjacent side. The picture and the ratio agree.",
        },
      ],
      answer: "about 10.9 m",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The trig ratios work in every triangle, so I can use SOH-CAH-TOA whenever I know two sides.",
      whyItFails:
        "The three ratios are defined from a right triangle. Without a right angle there is no hypotenuse in the required sense, and the opposite/adjacent labels do not fix a single pair. A triangle with sides 7, 8 and 12 has no right angle, so none of the three ratios applies directly.",
      correction:
        "First check for a right angle. If there is one, label from an acute angle and use SOH-CAH-TOA. If there is not, use the sine rule or cosine rule, which are designed for non-right triangles.",
      contrast: {
        wrong: "Use sin θ = opposite/hypotenuse in any triangle.",
        right: "Use SOH-CAH-TOA only after identifying a right angle; otherwise use the sine or cosine rule.",
      },
    },
    {
      id: "m2",
      belief: "sin⁻¹(x) means 1/sin(x), so I should divide by the sine value.",
      whyItFails:
        "The inverse function and the reciprocal are different operations. If sin 30° = 0.5, then sin⁻¹(0.5) = 30°, which returns the angle. The reciprocal 1/sin 30° = 2, which is not an angle and does not undo the sine. Using the reciprocal gives a number with the wrong meaning.",
      correction:
        "Read sin⁻¹ as “the angle whose sine is”. Use it when two sides are known and the angle is wanted. Use the reciprocal only when the mathematics genuinely calls for 1/sin θ, which is not the same as the inverse.",
      contrast: {
        wrong: "sin⁻¹(0.5) = 1/0.5 = 2",
        right: "sin⁻¹(0.5) = 30°, because sin 30° = 0.5",
      },
    },
    {
      id: "m3",
      belief: "The adjacent side is always the horizontal side, and the opposite side is always the vertical one.",
      whyItFails:
        "Opposite and adjacent are defined relative to the chosen angle, not relative to the page. If the triangle is rotated, or the angle is moved to the other acute vertex, the labels swap. A side that was adjacent to one angle is opposite the other acute angle.",
      correction:
        "Mark the chosen angle first. The opposite side faces it and does not touch it; the adjacent side touches it but is not the hypotenuse. Redraw or rotate the triangle so the chosen angle is easy to see, then label from that angle.",
      contrast: {
        wrong: "The bottom side is always adjacent and the upright side is always opposite.",
        right: "The labels depend on the marked angle; rotating the triangle rotates the labels with it.",
      },
    },
    {
      id: "m4",
      belief: "The calculator's degree/radian setting does not matter as long as I press the right buttons.",
      whyItFails:
        "Degrees and radians are different units. In degree mode sin 30° = 0.5; in radian mode the same keystrokes evaluate sin 30 radians ≈ −0.988. The calculator is answering a different question, so the ratio, the angle and every later step are wrong.",
      correction:
        "Check the mode before evaluating. Use degree mode when the question uses degrees, and radian mode when it uses radians. A quick check is sin 30° = 0.5; a negative value near −0.988 means the calculator is in radians.",
      contrast: {
        wrong: "sin 30 = −0.988, so the side is negative",
        right: "sin 30° = 0.5 in degree mode; the same number in radian mode is a different angle",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A right triangle has a 40° angle and a hypotenuse of 10 cm. Find the side opposite the 40° angle.",
      hint:
        "The known hypotenuse and the wanted opposite side form the SOH pair. Rearrange sin 40° = x/10 before substituting.",
      answer: "x = 10 sin 40° ≈ 6.43 cm",
      feedback: {
        correct:
          "sin 40° = x/10, so x = 10 sin 40° ≈ 6.43 cm. The opposite side is shorter than the hypotenuse, as it must be.",
        incorrect:
          "Use sine because the question connects the opposite side and the hypotenuse: sin 40° = x/10. Multiply by 10 to get x = 10 sin 40° ≈ 6.43 cm, not 10/sin 40°.",
      },
    },
    {
      id: "p2",
      prompt:
        "A right triangle has a 62° angle and an adjacent side of 15 cm. Find the hypotenuse.",
      hint:
        "The adjacent side and the hypotenuse form the CAH pair. The unknown is in the denominator of cos 62° = 15/x.",
      answer: "x = 15/cos 62° ≈ 31.95 cm",
      feedback: {
        correct:
          "cos 62° = 15/x. Multiply by x and divide by cos 62°: x = 15/cos 62° ≈ 31.95 cm. The hypotenuse is longer than the adjacent side.",
        incorrect:
          "The ratio is cos 62° = 15/x. Rearrange to x = 15/cos 62° ≈ 31.95 cm. Multiplying by cos 62° would make the hypotenuse shorter than the adjacent side, which is impossible.",
      },
    },
    {
      id: "p3",
      prompt:
        "A right triangle has an opposite side of 5 cm and a hypotenuse of 13 cm. Find the acute angle θ for which the 5 cm side is opposite.",
      hint:
        "Opposite and hypotenuse form the SOH pair. Use sin θ = 5/13, then the inverse sine.",
      answer: "θ = sin⁻¹(5/13) ≈ 22.62°",
      feedback: {
        correct:
          "sin θ = 5/13 ≈ 0.3846, so θ = sin⁻¹(0.3846) ≈ 22.62°. The angle is acute and the opposite side is the shorter leg, which fits the picture.",
        incorrect:
          "Use sine for opposite and hypotenuse: sin θ = 5/13. Then θ = sin⁻¹(5/13) ≈ 22.62°. Do not use 1/sin(5/13); the inverse returns the angle.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A right triangle has a 28° angle and a hypotenuse of 20 cm. Find the opposite and adjacent sides, to 2 decimal places.",
      modelAnswer: "opposite ≈ 9.39 cm and adjacent ≈ 17.66 cm",
      marking: [
        "Uses sine for the opposite side: sin 28° = opposite/20, so opposite = 20 sin 28°.",
        "Uses cosine for the adjacent side: cos 28° = adjacent/20, so adjacent = 20 cos 28°.",
        "Evaluates in degree mode and rounds both lengths to 2 decimal places with centimetres.",
      ],
      check: {
        accepted: [
          "opposite ≈ 9.39 cm and adjacent ≈ 17.66 cm",
          "opposite = 9.39 cm, adjacent = 17.66 cm",
          "9.39 cm and 17.66 cm",
          "9.39 and 17.66",
        ],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner writes tan 35° = x/12 and then concludes x = tan 35°/12 ≈ 0.058. Explain the rearrangement error, give the correct value of x, and state one check that would have caught the mistake.",
      modelAnswer:
        "The learner divided by 12 when the equation has x divided by 12. Multiplying both sides by 12 gives x = 12 tan 35° ≈ 8.40, not tan 35°/12. A check would notice that the opposite side should be comparable to the adjacent side: tan 35° is about 0.7, so x should be about 12 × 0.7 = 8.4, not 0.058. The units and the size of the triangle make 0.058 cm implausible.",
      marking: [
        "Identifies that both sides must be multiplied by 12, not divided.",
        "Obtains x = 12 tan 35° ≈ 8.40.",
        "Gives a plausibility check, such as tan 35° ≈ 0.7 so x ≈ 8.4, or notes that 0.058 cm is far too small for the given triangle.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A right triangle has an opposite side of 9 cm and an adjacent side of 40 cm to an acute angle θ. Find tan θ and θ, to 2 decimal places.",
      modelAnswer: "tan θ = 9/40 = 0.225, so θ ≈ 12.68°",
      marking: [
        "Forms the tangent ratio from opposite and adjacent: tan θ = 9/40.",
        "Evaluates the ratio as 0.225 and applies the inverse tangent.",
        "Gives θ ≈ 12.68° in degree mode, an acute angle consistent with a small opposite side.",
      ],
      check: {
        accepted: [
          "tan θ = 9/40 = 0.225, so θ ≈ 12.68°",
          "tan θ = 0.225 and θ ≈ 12.68°",
          "0.225; 12.68°",
          "12.68°",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A surveyor measures the angle of elevation to the top of a tower from two points on level ground. From 30 m away the angle is 40°; from 40 m away it is 32°. Calculate the height implied by each measurement. Do the two values agree? Explain what the comparison does and does not prove.",
      whyItTransfers:
        "The learner must set up two different right triangles from a described physical situation, choose tangent both times because the height is opposite and the ground distance is adjacent, and then compare the results rather than treating one calculation as the answer. The final question asks about measurement and model assumptions, which is a different demand from finding a side.",
      answer:
        "From 30 m: h = 30 tan 40° ≈ 25.17 m. From 40 m: h = 40 tan 32° ≈ 24.99 m. The two values agree to about 0.18 m, which is strong evidence that the same height is being measured and that the ground is approximately level. It does not prove the height exactly: the angles are rounded, the ground may not be perfectly horizontal, and the tower may not be vertical. A third measurement or a stated uncertainty would strengthen the conclusion.",
      marking: [
        "Uses tangent for both triangles: h = 30 tan 40° and h = 40 tan 32°.",
        "Obtains approximately 25.17 m and 24.99 m, with the same unit.",
        "Compares the two values and states that they agree to within a small rounding/measurement difference.",
        "Explains that agreement supports the model but does not prove it, naming at least one assumption such as level ground, a vertical tower or rounded angles.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "A right triangle has a 30° angle and a hypotenuse of 14 cm. Find the opposite side and the adjacent side.",
      answer:
        "opposite = 14 sin 30° = 7 cm; adjacent = 14 cos 30° ≈ 12.12 cm. The side opposite 30° is half the hypotenuse, which is the exact value sin 30° = 1/2.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A right triangle has an opposite side of 9 cm and an adjacent side of 12 cm. Find the acute angle θ.",
      answer:
        "tan θ = 9/12 = 0.75, so θ = tan⁻¹(0.75) ≈ 36.87°. The angle is acute and tan θ is less than 1, consistent with the opposite side being shorter than the adjacent side.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain why sin θ cannot equal 1.2 for an acute angle in a right triangle. What would you check if a calculator showed sin 30° ≈ −0.988?",
      answer:
        "Sine is opposite/hypotenuse, and the hypotenuse is the longest side, so the ratio must be between 0 and 1 for an acute angle. A value of 1.2 would mean the opposite side is longer than the hypotenuse, which is impossible. A calculator showing sin 30° ≈ −0.988 is in radian mode; it is evaluating 30 radians, not 30 degrees. Switch to degree mode.",
      when: "month-later",
    },
  ],

  summary: [
    "For a fixed acute angle, every right triangle is a scaled copy, so opposite/hypotenuse, adjacent/hypotenuse and opposite/adjacent depend only on the angle.",
    "Label the sides from the chosen angle: the hypotenuse is opposite the right angle, the opposite faces the angle, and the adjacent touches it but is not the hypotenuse.",
    "SOH-CAH-TOA chooses the ratio from the pair of sides the question connects: sine uses opposite and hypotenuse, cosine uses adjacent and hypotenuse, tangent uses opposite and adjacent.",
    "Rearrange the ratio before substituting, especially when the unknown is in the denominator; then evaluate in the correct angle mode.",
    "An inverse trig function returns an angle from a ratio; sin⁻¹(x) is not 1/sin(x).",
    "SOH-CAH-TOA applies to right triangles only. Check the mode, the side lengths and the size of the angle against the picture before accepting an answer.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "θ is read as “theta”, sin as “sine”, cos as “cosine” and tan as “tangent”. Each ratio is read as a sentence, for example “sine of theta equals opposite divided by hypotenuse”, so the formula is not a string of letters.",
    },
    {
      need: "dyslexia",
      alternative:
        "The side labels are written in words before the symbols, and every rearrangement is on its own line with the operation named: “multiply both sides by 12”. The lesson avoids dense inline chains of algebra.",
    },
    {
      need: "cognitive",
      alternative:
        "Every example follows the same four steps: label the sides, choose the ratio, rearrange, evaluate and check. The repeated routine reduces the number of decisions held at once.",
    },
    {
      need: "colour-vision",
      alternative:
        "Sides are identified by name and position, never by colour. Any diagram described in the text names the opposite, adjacent and hypotenuse explicitly.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no dragging, measuring or interactive triangle construction is required.",
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
        "All teaching prose, examples, practice, assessment and the surveyor transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for trigonometric ratios in right-angled triangles and angles of elevation and depression.",
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
