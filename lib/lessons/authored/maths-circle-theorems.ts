import type { AuthoredLesson } from "../../lesson-contract";

// A CIRCLE THEOREM IS A RELATIONSHIP BETWEEN TWO ANGLES, AND THE ARC IS THE
// OBJECT THAT DECIDES WHICH RELATIONSHIP APPLIES.
//
// The lesson is deliberately text-first: the lesson-figure system has no circle
// drawing, and a generated circle that placed the points for the learner would
// remove the very act the theorem needs — mark the arc, identify the two angles
// that stand on it, and only then choose a rule. Each theorem is therefore
// presented with a precise construction in words, a statement in notation, and a
// worked calculation that names the theorem as its reason. The advanced circle
// theorems (alternate segment, intersecting chords, two tangents) are left to the
// later concept and are not assumed here.
export const MATHS_CIRCLE_THEOREMS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "circle-theorems",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry and measures: circle theorems — angle at the centre, angle in a semicircle, angles in the same segment, cyclic quadrilaterals and the tangent–radius property",
    level: "Key Stage 4 to GCSE Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, constructions, examples, practice, assessment and the Ferris-wheel transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Identify the arc an angle stands on and distinguish angles on the same arc from angles on different arcs.",
      evidence:
        "Given a circle with several marked angles, the learner states which pairs subtend the same arc and explains why two angles on opposite sides of a chord are not automatically equal.",
    },
    {
      statement:
        "Apply the centre–circumference theorem and the angle-in-a-semicircle theorem with a stated reason.",
      evidence:
        "The learner finds a circumference angle of 65° from a centre angle of 130°, and proves that an angle in a semicircle is 90° by using a centre angle of 180°.",
    },
    {
      statement:
        "Apply the same-segment and cyclic-quadrilateral theorems, forming and solving an equation where the angles are given algebraically.",
      evidence:
        "The learner solves x + (2x + 30) = 180 for a cyclic quadrilateral and obtains opposite angles 50° and 130°, naming the theorem each time.",
    },
    {
      statement:
        "Use the tangent–radius property and the isosceles triangle formed by two radii to complete a multi-step angle calculation.",
      evidence:
        "Given a tangent at A, centre O and angle APO = 32°, the learner uses the right angle at A to obtain angle AOP = 58° and states why OA is perpendicular to PA.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["angles-lines"],
    check: [
      {
        id: "d1",
        question: "Two angles lie on a straight line and one is 115°. What is the other?",
        answer:
          "Angles on a straight line add to 180°, so the other angle is 180° − 115° = 65°.",
        targets: ["angles-lines"],
      },
      {
        id: "d2",
        question: "Two angles of a triangle are 48° and 67°. Find the third angle.",
        answer:
          "The angles of a triangle add to 180°, so the third is 180° − 48° − 67° = 65°.",
        targets: ["angles-lines"],
      },
      {
        id: "d3",
        question: "A triangle has two equal sides. What is true about the angles opposite them?",
        answer:
          "The base angles are equal. An isosceles triangle has two equal angles opposite its two equal sides.",
        targets: ["angles-lines"],
      },
    ],
  },

  introduction: {
    hook:
      "Draw a circle and a chord AB. Put a point C on the major arc and join C to A and B. Now move C anywhere along that same arc: the angle ACB does not change. Put a point D on the other arc and the angle ADB is different — it is supplementary to ACB, not equal to it. The chord and the arc decide which angles are related. Circle theorems are not a list of shapes to recognise; they are statements about which arc an angle stands on.",
    why:
      "Circle theorems turn a diagram that looks unanswerable into a short chain of reasons. A surveyor can find an angle from a curved boundary, a designer can prove a joint is square, and a learner can justify a step instead of guessing from the picture. The same discipline — mark the arc, name the theorem, calculate, state the reason — is what an examiner rewards. The later advanced circle theorems build on exactly this habit, so the first five facts must be secure before the alternate-segment and intersecting-chord rules are introduced.",
  },

  explanation: [
    {
      heading: "The arc is the object; the angle is measured from it",
      paragraphs: [
        "An arc is a continuous part of a circle. A chord is the straight line joining the two endpoints of an arc. An angle subtends an arc when its two arms pass through the endpoints of that arc. The angle at the centre has its vertex at the centre O; an angle at the circumference has its vertex on the circle. Two angles can look similar and still stand on different arcs, which is why the first step is always to mark the arc rather than choose a formula.",
        "For a chord AB, the circle is divided into two arcs, called the major and minor arcs unless they are equal. A point on one arc sees the chord AB from one side; a point on the other arc sees it from the opposite side. Angles whose vertices lie on the same arc are in the same segment. Angles whose vertices lie on opposite arcs are in opposite segments. The same-segment theorem applies only to the first group.",
        "The word subtend is worth using precisely. Angle AOB subtends arc AB at the centre; angle ACB subtends the same arc AB at the circumference when C is on the other arc. If a question gives two angles and you cannot say which arc each one subtends, stop and mark the endpoints. A theorem applied to the wrong arc produces a number that looks plausible and is wrong.",
      ],
    },
    {
      heading: "The centre angle is twice the circumference angle on the same arc",
      paragraphs: [
        "Take an arc AB and a point C on the other part of the circle. The angle at the centre, AOB, is twice the angle at the circumference, ACB: ∠AOB = 2∠ACB. The reason is that the triangle formed by joining C to O can be split into two isosceles triangles, because OA, OB and OC are all radii. The two base angles in each isosceles triangle are equal, and adding the two exterior angles gives the centre angle as twice the angle at C.",
        "The theorem is often used in the direction “centre given, circumference wanted”, so divide by two. If ∠AOB = 130°, then ∠ACB = 65°. It can also be used the other way: if ∠ACB = 41°, the centre angle on the same arc is 82°. The result is an angle, so the unit stays degrees; the factor of two is not a unit conversion.",
        "The same-arc condition is the whole theorem. If C and D are on opposite arcs, ∠ACB and ∠ADB do not both equal half the same centre angle; they are supplementary. A learner who applies “centre is double” to an angle on the other arc is not making an arithmetic slip; they have chosen the wrong arc.",
      ],
    },
    {
      heading: "A semicircle and a shared segment are two consequences",
      paragraphs: [
        "If AB is a diameter, the centre angle AOB is a straight angle of 180°. The centre–circumference theorem then gives ∠ACB = 90° for any point C on the circle other than A or B. This is the angle-in-a-semicircle theorem. The triangle is not necessarily isosceles: the right angle is fixed, while the other two angles can vary and still add to 90°.",
        "Angles in the same segment are equal. If C and D are on the same arc and both are joined to the endpoints of chord AB, then ∠ACB = ∠ADB. Each angle is half the same centre angle, so they are equal to each other. The theorem is useful when a diagram gives one angle at the circumference and asks for another angle that stands on the same chord from the same side.",
        "Angles in opposite segments are supplementary, not equal. If C and D are on opposite arcs, the quadrilateral ACBD is cyclic, and its opposite angles at C and D add to 180°. This is the same cyclic-quadrilateral theorem in a different wording. The distinction between “same segment” and “opposite segments” is the most common source of wrong answers in this topic.",
      ],
    },
    {
      heading: "A cyclic quadrilateral has opposite angles summing to 180°",
      paragraphs: [
        "A cyclic quadrilateral is a four-sided shape whose four vertices all lie on one circle. Its opposite angles are supplementary: ∠A + ∠C = 180° and ∠B + ∠D = 180°. The proof joins two opposite vertices to the centre and uses the centre–circumference theorem; the two centre angles on the two arcs add to 360°, so the two circumference angles add to 180°.",
        "The theorem applies to both pairs of opposite angles, not just the pair that looks widest. If one angle is 110°, the angle opposite it is 70°. The other two angles are a separate pair and must also sum to 180°, so a complete quadrilateral has two supplementary pairs. This gives a strong check: once three angles are known, the fourth is fixed, and the two pair sums must both hold.",
        "An algebraic angle is still an angle. If opposite angles are x and 2x + 30, the equation is x + (2x + 30) = 180, not x + 2x + 30 = 90. Solving gives 3x = 150, so x = 50 and the angles are 50° and 130°. Substitute both back: 50 + 130 = 180. The reason is the cyclic-quadrilateral theorem, not the fact that the diagram looks like a particular shape.",
      ],
    },
    {
      heading: "A tangent is perpendicular to the radius at the point of contact",
      paragraphs: [
        "A tangent is a line that touches a circle at exactly one point, called the point of contact. At that point, the radius drawn to the point of contact is perpendicular to the tangent. If PA is tangent at A and O is the centre, then OA ⟂ PA and ∠OAP = 90°. The right angle is at the point of contact, not at the external point P.",
        "This right angle often creates a right triangle. In triangle OAP, the angle at A is 90°. If ∠APO = 32°, then ∠AOP = 180° − 90° − 32° = 58°. The calculation uses the triangle angle sum, but the reason the triangle is right-angled is the tangent–radius theorem. Both reasons belong in the written solution.",
        "A line from the centre to some other point on the tangent is not generally perpendicular to the tangent. Only the radius to the point of contact is. The tangent also does not pass through the centre; if it did, it would cut the circle twice and would be a secant, not a tangent. These distinctions matter when a diagram shows several lines through an external point.",
      ],
    },
    {
      heading: "Build a chain of reasons, not a chain of guesses",
      paragraphs: [
        "Most circle-theorem questions need more than one fact. A reliable routine is: mark the arc or the point of contact; write the theorem that connects the known and unknown angles; substitute the numbers; solve; then write the reason beside the answer. If the diagram contains a radius and a tangent, look for the right angle. If it contains a diameter, look for a right angle at the circumference. If it contains four points on a circle, look for a cyclic quadrilateral.",
        "A triangle with two radii is isosceles. If OA and OB are radii, then OA = OB, so the angles opposite them are equal. This is not a circle theorem in its own right, but it is often the bridge between a centre angle and a circumference angle. It also explains why the centre–circumference proof works: two isosceles triangles share the radius OC.",
        "Finally, check the answer against the diagram's constraints. An angle in a triangle must be positive and the three angles must sum to 180°. A cyclic quadrilateral's opposite pairs must both sum to 180°. A tangent–radius angle must be exactly 90°. If a calculated angle violates one of these, the theorem was applied to the wrong arc or the wrong pair of angles.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.proof",
      body:
        "For an arc AB, the angle at the centre is twice the angle at the circumference when both stand on that arc.",
      notation:
        "∠AOB = 2 × ∠ACB   ·   centre 130° → circumference 65°   ·   circumference 41° → centre 82°",
      caption:
        "The vertex C must be on the arc opposite the arc AB used for the centre angle. Mark the arc before applying the factor of two.",
    },
    {
      id: "r2",
      kind: "maths.proof",
      body:
        "A diameter makes a straight centre angle, so every angle in the semicircle is a right angle; angles in the same segment are equal.",
      notation:
        "AB diameter → ∠ACB = 90°   ·   C and D in the same segment → ∠ACB = ∠ADB",
      caption:
        "The semicircle result is the centre–circumference theorem with a centre angle of 180°. The same-segment result is the same theorem applied to the same arc from two different points.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Opposite angles of a cyclic quadrilateral are supplementary, and the equation is formed from that pair.",
      notation:
        "∠A + ∠C = 180°   ·   ∠B + ∠D = 180°   ·   x + (2x + 30) = 180 → x = 50",
      caption:
        "The angles are opposite, not adjacent. Solving gives 50° and 130°; substituting both back confirms the pair sums to 180°.",
    },
    {
      id: "r4",
      kind: "maths.proof",
      body:
        "The tangent at A is perpendicular to the radius OA, so triangle OAP has a right angle at A.",
      notation:
        "OA ⟂ PA at A   ·   ∠OAP = 90°   ·   ∠APO = 32° → ∠AOP = 180° − 90° − 32° = 58°",
      caption:
        "The right angle is at the point of contact A. The external point P is not the right angle, and the tangent does not pass through the centre.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A, B and C lie on a circle with centre O. The angle at the centre, ∠AOB, is 130°. C is on the major arc. Find the angle at the circumference, ∠ACB.",
      steps: [
        {
          move: "Mark the arc AB that the centre angle stands on. The angle at C uses the same endpoints A and B, so it stands on the same arc.",
          why:
            "The centre–circumference theorem requires both angles to subtend the same arc. Marking the arc first prevents using an angle from the other side of the chord.",
        },
        {
          move: "Write the theorem: ∠AOB = 2 × ∠ACB.",
          why:
            "The angle at the centre is twice the angle at the circumference on the same arc. This is the relationship, not a formula to rearrange blindly.",
        },
        {
          move: "Substitute 130° = 2 × ∠ACB.",
          why:
            "The centre angle is known and the circumference angle is unknown. Substituting first makes the division explicit.",
        },
        {
          move: "Divide both sides by 2: ∠ACB = 65°.",
          why:
            "The unknown was multiplied by 2, so division undoes it. The answer is an angle in degrees.",
        },
        {
          move: "Check: 2 × 65° = 130°, so the circumference angle is 65°.",
          why:
            "The check reverses the theorem and confirms that the centre angle is double the circumference angle.",
        },
      ],
      answer: "∠ACB = 65°",
    },
    {
      id: "w2",
      prompt:
        "ABCD is a cyclic quadrilateral. The angle at A is x and the opposite angle at C is 2x + 30. Find both angles.",
      steps: [
        {
          move: "Identify the opposite pair: A and C are opposite vertices of the cyclic quadrilateral.",
          why:
            "The cyclic-quadrilateral theorem applies to opposite angles. A and C are not adjacent; they are separated by B and D around the circle.",
        },
        {
          move: "Write the theorem as an equation: x + (2x + 30) = 180.",
          why:
            "Opposite angles of a cyclic quadrilateral sum to 180°. Both angle expressions belong on the same side of the equation because they are the two angles being added.",
        },
        {
          move: "Collect like terms: 3x + 30 = 180, then subtract 30: 3x = 150.",
          why:
            "The equation is linear in x. Subtracting the constant from both sides isolates the x-term.",
        },
        {
          move: "Divide by 3: x = 50.",
          why:
            "Division undoes the multiplication by 3. This is the value of the unknown, not yet the two angle measures.",
        },
        {
          move: "Substitute back: ∠A = 50° and ∠C = 2(50) + 30 = 130°. Check 50° + 130° = 180°.",
          why:
            "Both angles must be stated, and the pair must sum to 180°. The check catches an arithmetic error before it becomes the final answer.",
        },
      ],
      answer: "∠A = 50° and ∠C = 130°",
    },
    {
      id: "w3",
      prompt:
        "PA is a tangent to a circle at A. O is the centre and P is an external point. Angle APO = 32°. Find angle AOP.",
      steps: [
        {
          move: "Draw OA, the radius to the point of contact A.",
          why:
            "The tangent–radius theorem is about the radius at the point of contact. Without OA there is no right angle to use.",
        },
        {
          move: "State the tangent–radius theorem: OA ⟂ PA, so ∠OAP = 90°.",
          why:
            "A tangent is perpendicular to the radius at the point where it touches the circle. The right angle is at A, not at P.",
        },
        {
          move: "In triangle OAP, the angles sum to 180°: ∠AOP + 90° + 32° = 180°.",
          why:
            "The triangle angle sum applies to triangle OAP once the right angle at A is known.",
        },
        {
          move: "Subtract: ∠AOP = 180° − 90° − 32° = 58°.",
          why:
            "The two known angles are removed from 180° to leave the angle at the centre.",
        },
        {
          move: "Check: 90° + 32° + 58° = 180°, so ∠AOP = 58°.",
          why:
            "The three angles of triangle OAP must sum to 180°. The check also confirms that the right angle was placed at the point of contact.",
        },
      ],
      answer: "∠AOP = 58°",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The angle at the centre is twice any angle at the circumference in the same circle.",
      whyItFails:
        "The theorem compares two angles that stand on the same arc. If the circumference angle is on the other arc, it is not half the same centre angle; the two angles are supplementary instead. Applying the factor of two to the wrong arc gives a plausible but false value.",
      correction:
        "Mark the chord endpoints and the arc first. Use ∠AOB = 2∠ACB only when both angles subtend the same arc AB. If the points are on opposite arcs, use the cyclic-quadrilateral relationship.",
      contrast: {
        wrong: "Any centre angle is twice any circumference angle.",
        right: "The centre angle is twice the circumference angle on the SAME arc.",
      },
    },
    {
      id: "m2",
      belief: "Angles in the same segment can have their vertices on opposite sides of the chord.",
      whyItFails:
        "The segment is the region between the chord and one arc. Points on opposite sides of the chord lie in opposite segments, and their angles are supplementary, not equal. The equality comes from both angles standing on the same arc from the same side.",
      correction:
        "Shade the segment containing the two vertices. If they are in the same shaded region, the angles are equal; if they are in opposite regions, use the cyclic-quadrilateral theorem.",
      contrast: {
        wrong: "∠ACB = ∠ADB for any C and D on the circle",
        right: "∠ACB = ∠ADB when C and D are in the same segment; on opposite sides they are supplementary",
      },
    },
    {
      id: "m3",
      belief: "The angle in a semicircle is 90° only when the triangle is isosceles.",
      whyItFails:
        "The right angle comes from the diameter, not from equal sides. The centre angle on a diameter is 180°, so every circumference angle on that arc is 90°. The other two angles can be any pair that adds to 90°, so the triangle is usually not isosceles.",
      correction:
        "Look for a diameter, not for equal marks. If AB is a diameter and C is any other point on the circle, ∠ACB = 90° regardless of where C sits.",
      contrast: {
        wrong: "The angle is 90° only if CA = CB",
        right: "Any angle subtended by a diameter is 90°",
      },
    },
    {
      id: "m4",
      belief: "A tangent is perpendicular to every radius, or the right angle is at the external point P.",
      whyItFails:
        "The perpendicularity is only at the point of contact. A radius drawn to any other point of the tangent is not generally perpendicular. The right angle is between the tangent and the radius OA at A, not between the tangent and the line OP at P.",
      correction:
        "Draw the radius to the point where the tangent touches the circle. Mark the right angle there. Use triangle OAP with the right angle at A; the angle at P is one of the acute angles.",
      contrast: {
        wrong: "∠OPA = 90° because PA is a tangent",
        right: "∠OAP = 90° at the point of contact A",
      },
    },
    {
      id: "m5",
      belief: "Opposite angles of a cyclic quadrilateral are equal.",
      whyItFails:
        "They are supplementary: each pair sums to 180°. They are equal only in the special case where both are 90°, which is not true of a general cyclic quadrilateral. Using equality instead of a sum halves or doubles the wrong angle.",
      correction:
        "Write the pair sum as an equation: ∠A + ∠C = 180°. Substitute the expressions, solve, then check both angles add to 180°.",
      contrast: {
        wrong: "∠A = ∠C for a cyclic quadrilateral",
        right: "∠A + ∠C = 180°",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A, B and C lie on a circle with centre O. ∠AOB = 84° and C is on the major arc. Find ∠ACB.",
      hint:
        "Both angles stand on arc AB. Use the centre–circumference theorem and divide by 2.",
      answer: "∠ACB = 42°",
      feedback: {
        correct:
          "∠AOB = 2∠ACB, so 84° = 2∠ACB and ∠ACB = 42°. The check is 2 × 42° = 84°.",
        incorrect:
          "The centre angle is double the circumference angle on the same arc. Divide 84° by 2 to get 42°, not multiply by 2.",
      },
    },
    {
      id: "p2",
      prompt:
        "AB is a diameter of a circle and C is a point on the circle. Angle ABC = 28°. Find angle ACB and angle BAC.",
      hint:
        "A diameter makes the angle at C a right angle. Then use the triangle angle sum.",
      answer: "∠ACB = 90° and ∠BAC = 62°",
      feedback: {
        correct:
          "The angle in a semicircle is 90°, so ∠ACB = 90°. Then ∠BAC = 180° − 90° − 28° = 62°.",
        incorrect:
          "Start with the diameter: the angle at C is 90°. The remaining two angles of the triangle add to 90°, so ∠BAC = 62°, not 28°.",
      },
    },
    {
      id: "p3",
      prompt:
        "PQRS is a cyclic quadrilateral. Opposite angles at P and R are 3x and x + 20. Find x and both angles.",
      hint:
        "Opposite angles of a cyclic quadrilateral sum to 180°. Form an equation and solve.",
      answer: "x = 40, so the angles are 120° and 60°",
      feedback: {
        correct:
          "3x + (x + 20) = 180, so 4x = 160 and x = 40. The angles are 120° and 60°, which sum to 180°.",
        incorrect:
          "The opposite angles are supplementary, not equal: 3x + x + 20 = 180. Solve 4x = 160 to get x = 40, then substitute for 120° and 60°.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A, B and C lie on a circle with centre O. ∠AOB = 146° and C is on the major arc. Find ∠ACB.",
      modelAnswer: "∠ACB = 73°",
      marking: [
        "States the centre–circumference theorem: the centre angle is twice the circumference angle on the same arc.",
        "Forms 146° = 2∠ACB and divides by 2.",
        "Gives ∠ACB = 73° with degrees.",
      ],
      check: {
        accepted: ["∠ACB = 73°", "73°", "73"],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "AB is a diameter of a circle with centre O and C is another point on the circle. Explain why ∠ACB = 90°. Then explain why two angles in the same segment are equal.",
      modelAnswer:
        "AB is a diameter, so the centre angle ∠AOB is 180°, a straight angle. The angle at the centre is twice the angle at the circumference on the same arc, so ∠ACB = 180°/2 = 90°. For two points C and D in the same segment, both angles ∠ACB and ∠ADB stand on the same arc AB. Each is half the same centre angle, so they are equal. The same-arc condition is essential: points on opposite sides of the chord would be in opposite segments and their angles would be supplementary, not equal.",
      marking: [
        "States that a diameter gives a centre angle of 180°.",
        "Applies the centre–circumference theorem to obtain 90°.",
        "Explains that same-segment angles stand on the same arc and are each half the same centre angle.",
        "Distinguishes same-segment from opposite-segment angles.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "In a cyclic quadrilateral, one pair of opposite angles is 4x and 2x + 30. Find x and both angles.",
      modelAnswer: "x = 25°, so the angles are 100° and 80°",
      marking: [
        "Forms the equation 4x + (2x + 30) = 180 from the cyclic-quadrilateral theorem.",
        "Solves 6x = 150 to obtain x = 25.",
        "Substitutes to get 100° and 80°, and checks that they sum to 180°.",
      ],
      check: {
        accepted: [
          "x = 25°, so the angles are 100° and 80°",
          "x = 25; 100° and 80°",
          "25, 100, 80",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A Ferris wheel has a circular rim with diameter AB. A cabin at point C on the rim is connected to A and B by straight support cables. Explain why triangle ACB is right-angled. If angle ABC is 35°, find angle BAC. The wheel's lowest point has a horizontal tangent; explain why the radius to that point is vertical.",
      whyItTransfers:
        "The learner must transfer the semicircle and tangent–radius theorems from an abstract circle diagram to a physical structure. The diameter is the wheel's rim, the cabin is a point on the circumference, and the tangent is the ground-level platform. The final part asks for the geometric reason behind a familiar horizontal/vertical relationship, not a calculation.",
      answer:
        "AB is a diameter, so the angle at C in the semicircle is 90°. Triangle ACB therefore has a right angle at C. Its angles sum to 180°, so ∠BAC = 180° − 90° − 35° = 55°. At the lowest point, the tangent is horizontal; the radius to the point of contact is perpendicular to the tangent, so that radius is vertical.",
      marking: [
        "Identifies AB as a diameter and applies the angle-in-a-semicircle theorem.",
        "States ∠ACB = 90° and uses the triangle angle sum to obtain ∠BAC = 55°.",
        "States that the tangent at the lowest point is horizontal.",
        "Uses the tangent–radius theorem to conclude that the radius at that point is vertical.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State the centre–circumference theorem in your own words. If the centre angle is 110°, what is the circumference angle on the same arc?",
      answer:
        "The angle at the centre is twice the angle at the circumference standing on the same arc. The circumference angle is 110°/2 = 55°. The two angles must use the same arc.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "In a cyclic quadrilateral, opposite angles are 4x and 5x. Find x and both angles.",
      answer:
        "Opposite angles sum to 180°, so 4x + 5x = 180, 9x = 180 and x = 20. The angles are 80° and 100°, which sum to 180°.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain the difference between angles in the same segment and angles in opposite segments. What is special about an angle in a semicircle, and where is the right angle formed by a tangent and a radius?",
      answer:
        "Angles in the same segment have vertices on the same side of the chord and are equal; angles in opposite segments are supplementary. An angle in a semicircle is 90° because the diameter gives a centre angle of 180°. A tangent is perpendicular to the radius at the point of contact, so the right angle is at that point.",
      when: "month-later",
    },
  ],

  summary: [
    "An angle subtends an arc; mark the arc before choosing a theorem.",
    "The angle at the centre is twice the angle at the circumference on the same arc.",
    "An angle in a semicircle is 90° because the diameter gives a centre angle of 180°.",
    "Angles in the same segment are equal; angles in opposite segments are supplementary.",
    "Opposite angles of a cyclic quadrilateral sum to 180°.",
    "A tangent is perpendicular to the radius at the point of contact, creating a right angle there.",
    "Write the theorem as the reason beside each calculated angle; a correct number without a reason is not a complete solution.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each theorem is read as a sentence with its arc named, for example “angle A O B equals two times angle A C B on the same arc”. The construction is described in words before the notation, so the diagram is not required to follow the argument.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation is on its own line with the reason written in words. The lesson avoids long chains of symbols and names the angle pair before substituting.",
    },
    {
      need: "cognitive",
      alternative:
        "Every example uses the same four-step routine: mark the arc or point of contact, name the theorem, substitute, solve and check. The routine is repeated across the worked examples, practice and assessment.",
    },
    {
      need: "colour-vision",
      alternative:
        "Angles and arcs are identified by their letter names and positions, not by colour. The same-segment distinction is stated in words as “same side of the chord”.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no dragging, measuring or interactive circle construction is required. A learner can draw the construction on paper if they choose.",
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
        "All teaching prose, constructions, examples, practice, assessment and the Ferris-wheel transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for circle theorems.",
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
