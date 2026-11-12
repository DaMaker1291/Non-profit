import type { AuthoredLesson } from "../../lesson-contract";

// THE HYPOTENUSE IS THE SIDE OPPOSITE THE RIGHT ANGLE, AND IT IS ALWAYS c.
//
// Almost every Pythagoras error is a labelling error before it is an arithmetic
// error: a leg is called c, so the equation adds when it should subtract, or the
// learner takes the square root of only one term. The lesson therefore makes
// "circle the hypotenuse first" the opening move, shows the leg rearrangement as
// a subtraction, and uses the converse as a separate claim — a triangle with
// sides that satisfy a² + b² = c² is right-angled, but a triangle without a right
// angle never satisfies the theorem in the first place. The 3-4-5 triangle is
// presented as a scaled family, not as the only triple.
export const MATHS_PYTHAGORAS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "pythagoras",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry and measures: Pythagoras' theorem and its converse in right-angled triangles",
    level: "Key Stage 3 to GCSE Foundation and Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the ladder-safety transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Identify the hypotenuse as the side opposite the right angle and the longest side of a right triangle.",
      evidence:
        "Given a right triangle with the right angle marked at a different vertex, the learner names the hypotenuse and explains why neither leg can be c in the equation.",
    },
    {
      statement:
        "Use a² + b² = c² to find a hypotenuse, and rearrange it to c² − a² to find a leg.",
      evidence:
        "The learner finds a hypotenuse of 10 cm from legs 6 cm and 8 cm, and a leg of 12 cm from hypotenuse 13 cm and leg 5 cm, subtracting in the second case.",
    },
    {
      statement:
        "Use the converse to decide whether a triangle with three given sides is right-angled.",
      evidence:
        "The learner checks 9² + 12² = 15² and concludes that the triangle is right-angled, with the right angle opposite the 15 cm side.",
    },
    {
      statement:
        "Apply Pythagoras to a real situation, keeping units consistent and checking the answer against the triangle's longest side.",
      evidence:
        "The learner finds the height reached by a 6.5 m ladder whose foot is 2.5 m from a wall as 6.0 m, and checks that the height is shorter than the ladder.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["indices-intro"],
    check: [
      {
        id: "d1",
        question: "Evaluate 7² and (−7)².",
        answer:
          "7² = 49 and (−7)² = 49. Squaring a negative number gives a positive result because the two negative signs multiply to positive.",
        targets: ["indices-intro"],
      },
      {
        id: "d2",
        question: "Evaluate √81 and explain why √81 is not −9.",
        answer:
          "√81 = 9. The square root symbol asks for the non-negative number whose square is 81; −9 also squares to 81, but the principal square root is positive.",
        targets: ["indices-intro"],
      },
      {
        id: "d3",
        question: "Solve x² = 49 for a positive x.",
        answer:
          "Take the positive square root: x = 7. The negative root −7 also satisfies the equation, but a length must be positive.",
        targets: ["indices-intro"],
      },
    ],
  },

  introduction: {
    hook:
      "A 6.5 m ladder is placed with its foot 2.5 m from a wall. How high up the wall does it reach? The ladder, wall and ground form a right triangle. The ladder is the hypotenuse, the ground distance is one leg, and the height is the other. If you guess 6 m, you are right — but a guess is not a method. The relationship between the three sides lets you calculate the height, not estimate it: the square on the hypotenuse equals the sum of the squares on the two legs.",
    why:
      "Pythagoras is the distance formula behind ladders, screen diagonals, roof slopes, navigation and coordinate geometry. It is also the first theorem where the converse matters: the equation can prove that an angle is right, not only use a right angle that is already given. The routine — identify the hypotenuse, substitute, rearrange, square-root, check against the longest side — is the same for every problem, and it is the foundation for trigonometric ratios and the cosine rule later.",
  },

  explanation: [
    {
      heading: "The hypotenuse is fixed by the right angle",
      paragraphs: [
        "A right triangle has one angle of 90°. The side opposite that angle is the hypotenuse. It is always the longest side, and it never touches the right angle. The other two sides are called legs; they meet at the right angle. If the triangle is rotated, the hypotenuse rotates with it. The labels do not depend on which side looks horizontal or vertical.",
        "The theorem is a² + b² = c², where c is the hypotenuse and a and b are the legs. The equation only works with that labelling. If a learner puts a leg in the c position, the equation says the square of a shorter side equals the sum of two squares, which cannot be true. Circling the hypotenuse before writing anything is the cheapest way to avoid the most common error.",
        "The theorem is about squares of lengths, not the lengths themselves. A 3-4-5 triangle has 3² + 4² = 9 + 16 = 25 = 5². The side lengths are 3, 4 and 5; the equation compares their squares. This is why the final step is a square root: after adding or subtracting squares, you have c² or a², not c or a.",
      ],
    },
    {
      heading: "Finding the hypotenuse means adding the squares",
      paragraphs: [
        "When the two legs are known and the hypotenuse is wanted, substitute the legs for a and b, add their squares, and take the positive square root. For legs 6 cm and 8 cm: c² = 6² + 8² = 36 + 64 = 100, so c = √100 = 10 cm. The hypotenuse must be longer than either leg, and 10 is longer than both 6 and 8.",
        "The units stay consistent. If the legs are in centimetres, the squares are in square centimetres and the final length is in centimetres. Mixing metres and centimetres before squaring changes the scale by a factor of 100, so convert first. The theorem does not care which leg is called a and which is b; the sum is the same.",
        "A Pythagorean triple is a set of three whole numbers satisfying the equation. The 3-4-5 triangle is the smallest; 5-12-13, 8-15-17 and 7-24-25 are others. Any multiple of a triple is also a triple: 6-8-10 is 3-4-5 doubled, and 9-12-15 is tripled. Recognising a triple can save time, but it is a shortcut, not a substitute for the equation.",
      ],
    },
    {
      heading: "Finding a leg means subtracting the known square",
      paragraphs: [
        "When the hypotenuse and one leg are known, the unknown is a leg. Rearrange before substituting: a² = c² − b². For hypotenuse 13 cm and leg 5 cm: a² = 13² − 5² = 169 − 25 = 144, so a = √144 = 12 cm. Adding instead would give 194, whose square root is about 13.9, longer than the hypotenuse — an immediate contradiction.",
        "The subtraction is not a different theorem; it is the same equation rearranged. c² is the total of the two squares, so removing the known leg's square leaves the other leg's square. The unknown leg must be shorter than the hypotenuse, and the check is built into the geometry: if your answer is longer than c, you added instead of subtracting or mislabelled the hypotenuse.",
        "Do not take the square root too early. A common error is to write √(c² − b²) as c − b, which is not equal in general: √(13² − 5²) = 12, while 13 − 5 = 8. The square root applies to the whole difference, not to each term separately. Evaluate the squares and subtract before taking the root.",
      ],
    },
    {
      heading: "The converse decides whether an angle is right",
      paragraphs: [
        "The theorem says: if a triangle is right-angled, then the squares of the two legs add to the square of the hypotenuse. The converse says: if the three sides satisfy a² + b² = c², where c is the longest side, then the triangle is right-angled. The converse is what lets you test a triangle from its side lengths alone, without seeing a right angle.",
        "For sides 9 cm, 12 cm and 15 cm, the longest is 15. Check 9² + 12² = 81 + 144 = 225 and 15² = 225. They are equal, so the triangle is right-angled, and the right angle is opposite the 15 cm side. If the sum were smaller than c², the angle opposite c would be obtuse; if larger, it would be acute. The equality is the right-angle case.",
        "The converse does not say that every triangle with a right angle has sides 3, 4 and 5. It says the equality holds for the right angle's opposite side. Testing the wrong side as c can make a right triangle appear not to work, so always identify the longest side first.",
      ],
    },
    {
      heading: "Pythagoras applies only to right triangles",
      paragraphs: [
        "The theorem is a statement about right triangles. A triangle with sides 7, 8 and 12 has 7² + 8² = 113, while 12² = 144; the equality fails because the triangle is not right-angled. Do not force the formula onto a triangle just because two sides are known. For a general triangle, the sine rule or cosine rule is the correct tool.",
        "A right angle can be implied by a rectangle, a square, a vertical wall meeting level ground, or a tangent meeting a radius. It can also be given by a diagram or by the word perpendicular. If no right angle is present or implied, Pythagoras is not available. The converse is the one way to establish the right angle from the sides themselves.",
        "In a coordinate problem, a horizontal and a vertical displacement form the legs of a right triangle. The straight-line distance is the hypotenuse. This is the same theorem in a different setting, not a new formula. Keep the order of the differences consistent: the horizontal change is one leg, the vertical change is the other, and their squares are added.",
      ],
    },
    {
      heading: "Check the answer against the triangle",
      paragraphs: [
        "The hypotenuse must be the longest side. A calculated hypotenuse that is shorter than a leg is impossible, and a calculated leg that is longer than the hypotenuse is impossible. These checks catch a mislabelled c, an addition where a subtraction was needed, and a square root taken of the wrong quantity.",
        "The squares must be non-negative, and the final length must be positive. A negative result under the square root means the numbers cannot describe a real right triangle; check whether the hypotenuse and leg were swapped. A length of zero is possible only in a degenerate triangle, not in an ordinary diagram.",
        "Round only at the end. If the square root is not exact, keep the calculator value through any further step and round the final answer to a sensible number of significant figures. A length answer needs a unit, and a check that compares it with the hypotenuse is part of the solution, not an optional extra.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The square on the hypotenuse equals the sum of the squares on the two legs. The hypotenuse is opposite the right angle.",
      notation:
        "a² + b² = c²   ·   legs 6 and 8 → c² = 36 + 64 = 100 → c = 10",
      caption:
        "c is the longest side and never touches the right angle. The equation adds the squares of the two legs, then a square root returns the length.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "To find a leg, rearrange the theorem before substituting: subtract the known leg's square from the hypotenuse's square.",
      notation:
        "a² = c² − b²   ·   c = 13, b = 5 → a² = 169 − 25 = 144 → a = 12",
      caption:
        "Adding instead gives 194 and a leg longer than the hypotenuse, which is impossible. The unknown leg must be shorter than c.",
    },
    {
      id: "r3",
      kind: "maths.proof",
      body:
        "The converse: if the longest side's square equals the sum of the other two squares, the triangle is right-angled.",
      notation:
        "9² + 12² = 81 + 144 = 225 = 15²   →   right-angled, with the right angle opposite the 15 cm side",
      caption:
        "Test the longest side as c. If the equality fails, the triangle is not right-angled; if the sum is larger, the angle opposite c is acute, and if smaller, obtuse.",
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "A Pythagorean triple is a whole-number solution; every multiple of a triple is another triple.",
      notation:
        "3² + 4² = 5²   ·   6-8-10 = 2 × (3-4-5)   ·   5² + 12² = 13²   ·   8² + 15² = 17²",
      caption:
        "Recognising a triple is a shortcut, not a replacement for the equation. The triple must be scaled as a whole, not by adding the same number to each side.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A right triangle has legs 6 cm and 8 cm. Find the hypotenuse.",
      steps: [
        {
          move: "Identify the hypotenuse: it is the side opposite the right angle and the longest side. Call it c; the two legs are 6 cm and 8 cm.",
          why:
            "The theorem uses c for the hypotenuse. Circling it first prevents putting a leg in the c position.",
        },
        {
          move: "Write a² + b² = c² and substitute the legs: 6² + 8² = c².",
          why:
            "The two known sides are the legs, so they go in the a and b positions. The unknown hypotenuse is c.",
        },
        {
          move: "Evaluate the squares: 36 + 64 = 100, so c² = 100.",
          why:
            "The equation is about squares. Adding 6 and 8 first would give 14, which is not the hypotenuse.",
        },
        {
          move: "Take the positive square root: c = √100 = 10 cm.",
          why:
            "A length is positive, so only the positive root is used. The result has the same unit as the legs.",
        },
        {
          move: "Check: 6² + 8² = 36 + 64 = 100 = 10², so the hypotenuse is 10 cm.",
          why:
            "The hypotenuse is longer than either leg. The 3-4-5 triple scaled by 2 confirms the result.",
        },
      ],
      answer: "10 cm",
    },
    {
      id: "w2",
      prompt:
        "A right triangle has hypotenuse 13 cm and one leg 5 cm. Find the other leg.",
      steps: [
        {
          move: "Identify the hypotenuse: 13 cm is opposite the right angle, so c = 13. The known leg is 5 cm; the unknown is the other leg, a.",
          why:
            "The hypotenuse is the longest side. The unknown is a leg, so the equation must be rearranged rather than used in its addition form.",
        },
        {
          move: "Rearrange a² + b² = c² to a² = c² − b².",
          why:
            "The two leg squares add to the hypotenuse square, so subtracting the known leg square leaves the unknown leg square.",
        },
        {
          move: "Substitute: a² = 13² − 5² = 169 − 25 = 144.",
          why:
            "The subtraction is between the squares, not between the lengths. 13 − 5 = 8 is not the unknown leg.",
        },
        {
          move: "Take the positive square root: a = √144 = 12 cm.",
          why:
            "The unknown is a length, so the positive root is required. The result is shorter than the hypotenuse, as a leg must be.",
        },
        {
          move: "Check: 5² + 12² = 25 + 144 = 169 = 13², so the other leg is 12 cm.",
          why:
            "The check restores the original theorem and confirms the 5-12-13 triple.",
        },
      ],
      answer: "12 cm",
    },
    {
      id: "w3",
      prompt:
        "A triangle has sides 9 cm, 12 cm and 15 cm. Decide whether it is right-angled, and state where the right angle would be.",
      steps: [
        {
          move: "Identify the longest side: 15 cm. It must play the role of c if the triangle is right-angled.",
          why:
            "The converse tests the longest side against the other two. Using a shorter side as c can make a right triangle fail the test.",
        },
        {
          move: "Compute the sum of the squares of the two shorter sides: 9² + 12² = 81 + 144 = 225.",
          why:
            "The converse compares this sum with the square of the longest side. The squares are the quantities in the theorem.",
        },
        {
          move: "Compute the square of the longest side: 15² = 225.",
          why:
            "The comparison is between 225 and 225, not between 9 + 12 and 15.",
        },
        {
          move: "The two values are equal, so the converse applies: the triangle is right-angled.",
          why:
            "Equality is the right-angle case. The right angle is opposite the longest side, which is the 15 cm side.",
        },
        {
          move: "Check: 9² + 12² = 81 + 144 = 225 = 15²; the right angle is opposite the 15 cm side.",
          why:
            "The check states the conclusion in terms of the side, not just the number. The 9-12-15 triangle is 3-4-5 scaled by 3.",
        },
      ],
      answer: "right-angled, with the right angle opposite the 15 cm side",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Any side can be c in a² + b² = c²; the letters are just labels.",
      whyItFails:
        "c is defined as the hypotenuse, the side opposite the right angle and the longest side. If a leg is put in the c position, the equation claims a shorter side's square equals the sum of two squares, which cannot hold. The arithmetic may be correct while the labelling is wrong.",
      correction:
        "Circle the hypotenuse before writing the equation. It is opposite the right angle and longer than either leg. Put that side in the c position; the other two are a and b.",
      contrast: {
        wrong: "5² + 13² = x² for a triangle with hypotenuse 13 and leg 5",
        right: "5² + x² = 13², so x² = 13² − 5²",
      },
    },
    {
      id: "m2",
      belief: "To find a missing leg, add the squares just as you do for the hypotenuse.",
      whyItFails:
        "Adding gives a square larger than the hypotenuse's square, so the resulting leg would be longer than the hypotenuse. A leg must be shorter than the hypotenuse. The unknown leg's square is the difference, not the sum.",
      correction:
        "If the unknown is a leg, rearrange to a² = c² − b². Subtract the known leg's square from the hypotenuse's square, then take the root.",
      contrast: {
        wrong: "a² = 13² + 5² = 194",
        right: "a² = 13² − 5² = 144, so a = 12",
      },
    },
    {
      id: "m3",
      belief: "√(c² − b²) can be simplified to c − b.",
      whyItFails:
        "The square root of a difference is not the difference of the square roots. For c = 13 and b = 5, √(169 − 25) = √144 = 12, while 13 − 5 = 8. The two results are different, so the simplification is invalid.",
      correction:
        "Evaluate the squares and subtract first, then take the square root of the whole result. Do not distribute the root across a subtraction.",
      contrast: {
        wrong: "√(13² − 5²) = 13 − 5 = 8",
        right: "√(13² − 5²) = √144 = 12",
      },
    },
    {
      id: "m4",
      belief: "Pythagoras works for any triangle once two sides are known.",
      whyItFails:
        "The theorem is derived from a right angle. In a triangle with sides 7, 8 and 12, 7² + 8² = 113 while 12² = 144, so the equality fails. The triangle is not right-angled, and the theorem does not apply.",
      correction:
        "Check for a right angle first. If one is given or implied, use Pythagoras; if not, use the sine or cosine rule. The converse can establish a right angle from the sides, but only when the equality holds.",
      contrast: {
        wrong: "Use a² + b² = c² on any triangle",
        right: "Use it only on a right triangle, or use the converse to test whether the triangle is right-angled",
      },
    },
    {
      id: "m5",
      belief: "The only Pythagorean triple is 3-4-5.",
      whyItFails:
        "There are infinitely many triples, including 5-12-13, 8-15-17 and 7-24-25. Multiples of a triple are also triples: 6-8-10 and 9-12-15 are scaled 3-4-5 triangles. Recognising only one triple leads a learner to reject valid whole-number answers.",
      correction:
        "Use the equation as the test, and recognise common triples as shortcuts. A triple can be scaled by multiplying all three sides by the same factor, not by adding the same amount to each side.",
      contrast: {
        wrong: "Only 3-4-5 is a Pythagorean triple",
        right: "5-12-13 and 8-15-17 are triples too; 6-8-10 is 3-4-5 scaled by 2",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A right triangle has legs 9 cm and 12 cm. Find the hypotenuse.",
      hint:
        "The hypotenuse is c. Add the squares of the legs, then take the positive square root.",
      answer: "15 cm",
      feedback: {
        correct:
          "c² = 9² + 12² = 81 + 144 = 225, so c = 15 cm. The 9-12-15 triangle is 3-4-5 scaled by 3.",
        incorrect:
          "Add the squares, not the lengths: 9² + 12² = 225. Then c = √225 = 15 cm. The hypotenuse is longer than both legs.",
      },
    },
    {
      id: "p2",
      prompt:
        "A right triangle has hypotenuse 17 cm and one leg 8 cm. Find the other leg.",
      hint:
        "The unknown is a leg. Rearrange to a² = c² − b² before substituting.",
      answer: "15 cm",
      feedback: {
        correct:
          "a² = 17² − 8² = 289 − 64 = 225, so a = 15 cm. The 8-15-17 triple confirms it.",
        incorrect:
          "Subtract the squares because the unknown is a leg: 289 − 64 = 225. Then a = 15 cm, which is shorter than the 17 cm hypotenuse.",
      },
    },
    {
      id: "p3",
      prompt:
        "A rectangle is 5 m long and 12 m wide. Find the length of its diagonal.",
      hint:
        "The diagonal is the hypotenuse of a right triangle with legs 5 m and 12 m.",
      answer: "13 m",
      feedback: {
        correct:
          "d² = 5² + 12² = 25 + 144 = 169, so d = 13 m. The diagonal is longer than either side.",
        incorrect:
          "The length and width are perpendicular, so they are the legs: 5² + 12² = 169. The diagonal is √169 = 13 m, not 17 m.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A right triangle has legs 7 cm and 24 cm. Find the hypotenuse.",
      modelAnswer: "25 cm",
      marking: [
        "Identifies the hypotenuse as the unknown and writes 7² + 24² = c².",
        "Evaluates 49 + 576 = 625.",
        "Takes the positive square root to obtain 25 cm.",
      ],
      check: {
        accepted: ["25 cm", "25", "c = 25 cm"],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner finding a missing leg writes a² = 13² + 5² = 194 and obtains a ≈ 13.9 cm. Explain what is wrong with the method and the answer, and give the correct value.",
      modelAnswer:
        "The learner added the squares, but when the unknown is a leg the known leg's square must be subtracted from the hypotenuse's square: a² = 13² − 5² = 169 − 25 = 144, so a = 12 cm. Adding gives a leg longer than the 13 cm hypotenuse, which is impossible. The answer 13.9 cm should have been rejected immediately because a leg cannot be longer than the hypotenuse.",
      marking: [
        "Identifies that the squares should be subtracted, not added.",
        "Obtains a² = 144 and a = 12 cm.",
        "Explains why 13.9 cm is impossible: a leg must be shorter than the hypotenuse.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A 6.5 m ladder reaches a window. Its foot is 2.5 m from the wall. How high up the wall does it reach?",
      modelAnswer: "6.0 m",
      marking: [
        "Identifies the ladder as the hypotenuse and the ground distance as a leg.",
        "Forms h² = 6.5² − 2.5² = 42.25 − 6.25 = 36.",
        "Takes the positive square root to obtain 6.0 m.",
      ],
      check: {
        accepted: ["6.0 m", "6 m", "6"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A rectangular field is 24 m long and 10 m wide. A path runs diagonally from one corner to the opposite corner. Find the length of the path. Then a second field has diagonal 26 m and length 24 m; find its width. Explain why the diagonal is always the longest side.",
      whyItTransfers:
        "The learner must see the rectangle's diagonal as the hypotenuse of a right triangle, apply the theorem in both directions — finding a hypotenuse and then a leg — and justify the geometric constraint. The two fields use the same 10-24-26 triple, so the second calculation is a check on the first rather than a new procedure.",
      answer:
        "For the first field: d² = 24² + 10² = 576 + 100 = 676, so d = 26 m. For the second: w² = 26² − 24² = 676 − 576 = 100, so w = 10 m. The diagonal is the hypotenuse of the right triangle formed by the length, width and diagonal, so it is opposite the right angle and is longer than either side.",
      marking: [
        "Uses the length and width as legs and obtains 26 m for the first diagonal.",
        "Uses the diagonal as the hypotenuse and subtracts to obtain 10 m for the width.",
        "Explains that the diagonal is the hypotenuse and therefore the longest side.",
        "Keeps the units in metres and checks the second result against the first.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "A right triangle has legs 3 cm and 4 cm. Find the hypotenuse and state which side is c.",
      answer:
        "c is the hypotenuse, opposite the right angle. c² = 3² + 4² = 9 + 16 = 25, so c = 5 cm. The hypotenuse is the longest side.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A right triangle has hypotenuse 10 cm and one leg 6 cm. Find the other leg.",
      answer:
        "The unknown is a leg: a² = 10² − 6² = 100 − 36 = 64, so a = 8 cm. The 6-8-10 triangle is 3-4-5 scaled by 2.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "How can you decide whether a triangle with sides 8 cm, 15 cm and 17 cm is right-angled? Where would the right angle be?",
      answer:
        "Test the converse with the longest side as c: 8² + 15² = 64 + 225 = 289 = 17². The triangle is right-angled, with the right angle opposite the 17 cm side.",
      when: "month-later",
    },
  ],

  summary: [
    "The hypotenuse is opposite the right angle, is the longest side, and is c in a² + b² = c².",
    "Finding the hypotenuse means adding the squares of the legs and taking the positive square root.",
    "Finding a leg means subtracting the known leg's square from the hypotenuse's square before taking the root.",
    "Do not simplify √(c² − b²) to c − b; evaluate the squares and subtract first.",
    "The converse: if the longest side's square equals the sum of the other two squares, the triangle is right-angled.",
    "Pythagorean triples include 3-4-5, 5-12-13, 8-15-17 and 7-24-25; multiples of a triple are also triples.",
    "Pythagoras applies only to right triangles; a non-right triangle needs the sine or cosine rule.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The theorem is read as “a squared plus b squared equals c squared”, and c is described as the hypotenuse opposite the right angle. The construction is stated in words so the diagram is not required.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation is on its own line, with the square and square-root steps named in words. The lesson separates the leg case from the hypotenuse case rather than mixing both in one dense formula.",
    },
    {
      need: "cognitive",
      alternative:
        "Every problem uses the same five-step routine: identify the hypotenuse, substitute, add or subtract, take the root, check against the longest side. The routine is repeated in the examples and practice.",
    },
    {
      need: "colour-vision",
      alternative:
        "The hypotenuse is identified by its position opposite the right angle, not by colour. Every diagram is described by side names and the right-angle position.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no dragging, measuring or interactive triangle construction is required. A learner may draw the triangle on paper if useful.",
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
        "All teaching prose, examples, practice, assessment and the ladder-safety transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for Pythagoras' theorem and its converse.",
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
