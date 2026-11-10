import type { AuthoredLesson } from "../../lesson-contract";

// ANGLE FACTS ARE CONSTRAINTS, NOT LABELS TO RECOGNISE.
//
// A learner who has only memorised "Z angles are equal" can find a missing angle
// when the diagram happens to look like a Z and cannot say why the answer is
// true. The lesson therefore makes every fact a consequence of a half-turn or a
// full turn, requires the reason to be named with the number, and treats the
// F/Z shapes as memory cues that are valid ONLY when the lines are marked
// parallel. The polygon formula is derived by splitting a polygon into
// triangles, so it is not a second unrelated rule.
export const MATHS_ANGLES_LINES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "angles-lines",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry: angles at a point and on a straight line, vertically opposite angles, alternate and corresponding angles on parallel lines, and interior angles of polygons",
    level: "Key Stage 3 to GCSE Foundation",
    note:
      "Scope cited against the published GCSE mathematics subject content and the National Curriculum. No specification, textbook or commercial lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Use the straight-line, point and vertically opposite angle facts to find a missing angle, and name the fact that justifies each step.",
      evidence:
        "The learner finds a missing angle of 65° on a straight line containing 52° and 63°, and writes that the three angles make a half-turn of 180° rather than only writing the number.",
    },
    {
      statement:
        "Use alternate and corresponding angles on parallel lines, and co-interior angles, giving the parallel-line reason rather than relying on an F or Z shape.",
      evidence:
        "Given one angle of 68° at a transversal crossing two marked parallel lines, the learner gives the alternate angle as 68° and the co-interior angle as 112°, explaining that co-interior angles make a straight angle together.",
    },
    {
      statement:
        "Derive and use the interior angle sum of a polygon, including the interior and exterior angles of a regular polygon.",
      evidence:
        "The learner derives 540° for a pentagon from three triangles, finds 108° for each interior angle of a regular pentagon and 72° for each exterior angle, and checks that the exterior angles total 360°.",
    },
  ],

  priorKnowledge: {
    // The genome declares no prerequisites for `angles-lines`. These two
    // foundations are named because the lesson uses them, and both are probed:
    // an assumption about course order is not evidence that the learner has them.
    conceptIds: ["subtraction", "division"],
    check: [
      {
        id: "d1",
        question: "Work out 180 − 68.",
        answer:
          "112. The two angles on a straight line make 180°, so the missing part is the whole half-turn minus the known part.",
        targets: ["subtraction"],
      },
      {
        id: "d2",
        question: "Work out 720 ÷ 6.",
        answer:
          "120. The total interior angle sum of a hexagon is 720°, and a regular hexagon shares that total equally between six angles.",
        targets: ["division"],
      },
    ],
  },

  introduction: {
    hook:
      "A joiner is fitting a diagonal brace across two parallel rails. The brace meets the top rail at 68°, and the workshop drawing marks the other cuts. Before measuring anything, the joiner can say what the other angles must be: the alternate angle is also 68°, and the angle inside the rails on the same side is 112°, because together they make a straight angle. The drawing is not to scale, but the constraints are exact.",
    why:
      "An angle is the amount of turn between two lines, so angle facts are statements about how turns fit together. A half-turn is 180°, a full turn is 360°, and a triangle is half of a parallelogram, which is why its angles total 180°. Those facts let you deduce an angle you cannot measure and check an angle someone else reports. The lesson teaches the reason for each fact, because a diagram that looks like an F or a Z is not evidence that the lines are parallel and is not a reason a learner can use in an examination.",
  },

  explanation: [
    {
      heading: "A straight line is a half-turn, and a point is a full turn",
      paragraphs: [
        "Angles that sit together on one side of a straight line fill a half-turn, so their total is 180°. If two of them are 52° and 63°, the third is 180° − 52° − 63° = 65°. Angles that fill the space around a point make a complete turn, so their total is 360°; if three known angles are 60°, 95° and 105°, the remaining angle is 100°. The arithmetic is not a separate rule from the geometry: it is the whole turn minus the parts already accounted for.",
        "When two straight lines cross, the angles opposite each other are equal. The reason is again a half-turn: each of the two angles on one line makes 180° with the same neighbouring angle, so the two opposite angles must have the same size. If one angle is 30°, the angle vertically opposite is 30° and each neighbour is 150°. An angle greater than 180° is called reflex; it is still part of the same full turn, so subtracting the smaller angle from 360° gives it.",
      ],
    },
    {
      heading: "Parallel lines make the angle pairs equal or supplementary",
      paragraphs: [
        "A transversal is a line that crosses two other lines. When the two lines are parallel, corresponding angles are equal: they sit in the same position at each crossing, which is why the F shape is a useful cue. Alternate angles are also equal: they are on opposite sides of the transversal, between the parallel lines, and the Z shape is the usual memory picture. Neither shape is the reason. The reason is that a translation along the transversal maps one crossing onto the other, so the corresponding angle is unchanged; the alternate angle is then equal to that corresponding angle through vertically opposite angles.",
        "Co-interior angles sit on the same side of the transversal, between the parallel lines. They are not equal: they are supplementary, adding to 180°. In the 68° example, the alternate angle is 68°, and the co-interior angle next to it makes a straight angle with that 68°, so it is 112°. The F and Z pictures can be upside down or back to front, and a Z can be drawn on lines that are not parallel; that is why a diagram must mark the parallel lines and why the written reason must name the relationship, not the letter shape.",
      ],
    },
    {
      heading: "A triangle is half a parallelogram, and a polygon is made of triangles",
      paragraphs: [
        "The angles in any triangle total 180°. One way to see it is to draw a line through one vertex parallel to the opposite side. The two angles made with that line are equal to the triangle's other two angles, by alternate angles, and the three angles at the vertex then make a straight line. The same argument shows why a quadrilateral totals 360°: a diagonal splits it into two triangles, each contributing 180°.",
        "A polygon with n sides can be split from one vertex into n − 2 triangles, so its interior angles total (n − 2) × 180°. A pentagon gives three triangles and 540°; a hexagon gives four and 720°. In a regular polygon all interior angles are equal, so each one is the total divided by n: a regular hexagon has 720° ÷ 6 = 120°. The exterior angles of any convex polygon total 360°, one full turn as you walk around it, so each exterior angle of a regular polygon is 360° ÷ n. For a regular hexagon that is 60°, and 120° + 60° = 180°, as the straight angle at each vertex requires.",
      ],
    },
    {
      heading: "Write the reason with the number, then check that the answer is possible",
      paragraphs: [
        "A complete angle calculation names the fact and shows the arithmetic. \"x = 180° − 52° − 63° = 65° because the angles on a straight line total 180°\" can be checked by someone else; \"x = 65°\" cannot. In a multi-step problem, carry the reason forward: find a corresponding angle first, use it to find a co-interior angle second, and say which fact was used at each step. A diagram that is not drawn to scale is normal; the constraints, not the apparent size, decide the answer.",
        "Finally, check the result against the whole turn and the shape. An angle on a straight line must be between 0° and 180°, an angle around a point must fit within 360°, and the angles of a triangle must total exactly 180°. If a calculation gives 195° for an angle in a triangle, the arithmetic or the chosen fact is wrong. A useful estimate is often enough to catch a sign or subtraction slip before it becomes an answer.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Two angles on a straight line make a half-turn. The missing angle is the whole 180° minus the known part; around a point, the whole is 360°.",
      notation:
        "52° + 63° + x = 180°   so   x = 65°   ·   60° + 95° + 105° + y = 360°   so   y = 100°",
      caption:
        "The equation is the angle fact written down. The missing angle is not found by guessing from the drawing; it is the part of the half-turn or full turn that is left.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A transversal crosses two parallel lines. Alternate angles are equal; co-interior angles are on the same side and add to 180°. The parallel marks are part of the given information, not decoration.",
      notation:
        "alternate:  x = 68°   ·   co-interior:  x + y = 180°   so   y = 112°",
      caption:
        "The 68° angle and its alternate angle are equal because the lines are parallel. The co-interior angle is the supplement, not another 68°: together they make the straight angle at that crossing.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A polygon with n sides splits into n − 2 triangles. For a regular polygon, divide the interior total by n; the exterior angles always total 360°, so each exterior angle is 360° divided by n.",
      notation:
        "interior sum = (n − 2) × 180°   ·   regular pentagon: 540° ÷ 5 = 108°   ·   exterior: 360° ÷ 5 = 72°",
      caption:
        "The pentagon's five interior angles share 540°, so each is 108°. The exterior angle is the turn at each vertex; five turns of 72° make the full 360° journey around the shape.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Two angles on a straight line are 52° and 63°. Find the third angle, x.",
      steps: [
        {
          move: "Write the fact: the three angles on the straight line make a half-turn, so their total is 180°.",
          why:
            "The straight line is the whole, and the three angles are its parts. Naming the whole before subtracting prevents the common slip of treating 180° as one of the parts.",
        },
        {
          move: "Add the known parts: 52° + 63° = 115°.",
          why:
            "The known angles are the part of the half-turn already accounted for. Adding them first makes the remaining part a single subtraction.",
        },
        {
          move: "Subtract from 180°: x = 180° − 115° = 65°. Check: 52° + 63° + 65° = 180°.",
          why:
            "The missing angle is what remains of the half-turn. Substituting all three values back into the straight-line total checks that no part was missed or counted twice.",
        },
      ],
      answer: "x = 65°",
    },
    {
      id: "w2",
      prompt:
        "A transversal crosses two parallel lines. One acute angle is 68°. Find its alternate angle and the co-interior angle on the same side as the 68° angle.",
      steps: [
        {
          move: "Use the alternate-angle fact: the angle on the opposite side of the transversal, between the parallel lines, is also 68°.",
          why:
            "Alternate angles are equal when the lines are parallel. The equality is justified by the parallel lines, not by the Z shape the two angles happen to make.",
        },
        {
          move: "Use the straight-angle fact at the second crossing: the co-interior angle and the 68° alternate angle make 180°.",
          why:
            "The two angles sit next to each other on the same straight line at that crossing. The co-interior angle is therefore the supplement of the alternate angle, not a second copy of it.",
        },
        {
          move: "Calculate the co-interior angle: 180° − 68° = 112°. Check: 68° + 112° = 180°.",
          why:
            "The subtraction leaves the part of the straight angle that is not the 68° angle. The check confirms the pair is supplementary, which is what co-interior means.",
        },
      ],
      answer: "alternate = 68°; co-interior = 112°",
    },
    {
      id: "w3",
      prompt:
        "Find each interior angle and each exterior angle of a regular pentagon.",
      steps: [
        {
          move: "Use the polygon formula: a pentagon has five sides, so its interior angles total (5 − 2) × 180° = 3 × 180° = 540°.",
          why:
            "A pentagon can be split into three triangles from one vertex, and each triangle contributes 180°. The subtraction of 2 counts the triangles, not the sides.",
        },
        {
          move: "Divide the total equally: 540° ÷ 5 = 108°, so each interior angle is 108°.",
          why:
            "Regular means every interior angle has the same size. The total is shared equally, so dividing by the number of angles gives one angle; using 540° as one angle would be five times too large.",
        },
        {
          move: "Use the straight angle at a vertex, or the exterior total: 180° − 108° = 72°, and 360° ÷ 5 = 72°.",
          why:
            "The interior and exterior angles at a vertex lie on a straight line, so they add to 180°. Independently, the five equal exterior turns must make the full 360°, which gives the same 72° and checks the result.",
        },
      ],
      answer: "each interior angle = 108°; each exterior angle = 72°",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "If two angles make a Z shape, they must be equal, because that is what a Z angle is.",
      whyItFails:
        "The Z is a shape drawn on the page, not a geometric condition. A Z-like arrangement can be drawn across two lines that are not parallel, and then the two angles are not equal. The equality depends on the lines being parallel; the letter is only a way to remember which pair to look at.",
      correction:
        "Mark the parallel lines and name the relationship: alternate angles are equal because the lines are parallel. In an examination, write the reason as 'alternate angles are equal' or 'alternate angles on parallel lines', never 'Z angles'.",
      contrast: {
        wrong: "the angles are equal because they make a Z",
        right: "the lines are parallel, so the alternate angles are equal",
      },
    },
    {
      id: "m2",
      belief:
        "Co-interior angles are equal because they are both inside the parallel lines.",
      whyItFails:
        "Being on the inside does not make two angles equal. Co-interior angles are on the same side of the transversal and together make a straight angle, so they add to 180°. If the acute angle is 68°, the co-interior angle is 112°, not another 68°.",
      correction:
        "Identify the pair as co-interior and write the sum: x + 68° = 180°. Then subtract. Check that the two angles are supplementary; if they are equal, you have probably chosen alternate or corresponding angles instead.",
      contrast: {
        wrong: "co-interior angles are equal, so the other angle is 68°",
        right: "co-interior angles add to 180°, so the other angle is 112°",
      },
    },
    {
      id: "m3",
      belief:
        "The formula (n − 2) × 180° gives each interior angle of a polygon, so a hexagon has an interior angle of 720°.",
      whyItFails:
        "The formula gives the total of all the interior angles, not one angle. A hexagon's interior angles total 720°; only in a regular hexagon are they equal, and then each is 720° ÷ 6 = 120°. Reporting 720° for one angle confuses the whole with one of its parts.",
      correction:
        "First calculate the total with (n − 2) × 180°, then divide by n only when the polygon is regular. Keep the total and the single angle as separate lines of working, and check that the single angle is less than 180° for a convex polygon.",
      contrast: {
        wrong: "a regular hexagon has an interior angle of 720°",
        right: "a hexagon's interior angles total 720°, so each regular angle is 120°",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Two angles on a straight line are 47° and x. Find x.",
      hint:
        "The straight line is a half-turn of 180°. Subtract the known angle from the whole.",
      answer: "x = 180° − 47° = 133°. Check: 47° + 133° = 180°.",
      feedback: {
        correct:
          "You used the straight-line total and checked that the two parts make the full half-turn.",
        incorrect:
          "The two angles make 180°, so x is 180° − 47° = 133°, not 47°. Add your two values to check that they total 180°.",
      },
    },
    {
      id: "p2",
      prompt:
        "A transversal crosses two parallel lines. One angle is 112°. Find its alternate angle and the co-interior angle next to it.",
      hint:
        "Alternate angles are equal. Co-interior angles sit on the same side and make a straight angle, so they add to 180°.",
      answer:
        "The alternate angle is 112°. The co-interior angle is 180° − 112° = 68°. Check: 112° + 68° = 180°.",
      feedback: {
        correct:
          "You kept the equal pair separate from the supplementary pair and named which relationship produced each value.",
        incorrect:
          "Do not give 112° for both. The alternate angle is equal to 112°, but the co-interior angle is supplementary: 180° − 112° = 68°.",
      },
    },
    {
      id: "p3",
      prompt:
        "Find each interior angle and each exterior angle of a regular octagon.",
      hint:
        "An octagon has eight sides. Find the interior total first, then divide by eight; the exterior angles total 360°.",
      answer:
        "Interior total = (8 − 2) × 180° = 1,080°. Each interior angle = 1,080° ÷ 8 = 135°. Each exterior angle = 360° ÷ 8 = 45°. Check: 135° + 45° = 180°.",
      feedback: {
        correct:
          "You separated the total from one angle and used the exterior total as a second check.",
        incorrect:
          "The 1,080° is the total for all eight interior angles, not one angle. Divide by 8 to get 135°, and use 360° ÷ 8 = 45° for the exterior angle.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why alternate angles are equal when a transversal crosses two parallel lines, and why co-interior angles add to 180°. Then explain why drawing a Z shape is not, by itself, a proof that two angles are equal.",
      modelAnswer:
        "When the two lines are parallel, translating one crossing along the transversal onto the other leaves the corresponding angle unchanged, so corresponding angles are equal. At the second crossing, the alternate angle is vertically opposite that corresponding angle, so it has the same size. The co-interior angle is the angle next to the alternate angle on a straight line, so the two add to 180°. A Z shape is only a picture of the positions: if the lines are not parallel, the translation does not map one crossing onto the other, and the angles need not be equal. The reason must name the parallel lines and the angle relationship.",
      marking: [
        "Explains that corresponding angles are equal because the lines are parallel, using translation or an equivalent argument.",
        "Connects the alternate angle to the corresponding angle through vertically opposite angles.",
        "Explains that a co-interior angle is supplementary because it forms a straight angle with the alternate angle.",
        "States that a Z shape alone does not establish equality; the lines must be parallel, and the reason must name the relationship.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Two angles on a straight line are (3x + 15)° and (2x + 35)°. Find x.",
      modelAnswer: "x = 26",
      marking: [
        "Forms the straight-line equation 3x + 15 + 2x + 35 = 180.",
        "Collects the terms to obtain 5x + 50 = 180 and solves x = 26.",
        "Checks the angles: 93° + 87° = 180°.",
      ],
      check: { accepted: ["x = 26", "x=26", "26"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Each exterior angle of a regular polygon is 24°. How many sides does the polygon have?",
      modelAnswer: "15 sides",
      marking: [
        "Uses the fact that the exterior angles of any convex polygon total 360°.",
        "Divides 360° by 24° to obtain 15 sides.",
        "Checks that 15 × 24° = 360°.",
      ],
      check: { accepted: ["15", "15 sides", "a 15-sided polygon"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A paving company uses regular hexagonal slabs. Three hexagons meet at each vertex. Show that the three interior angles fit exactly, and explain why three regular pentagons cannot meet in the same way. Use the interior angles, not a picture.",
      whyItTransfers:
        "The lesson finds angles inside one polygon. Here the learner must calculate an interior angle, combine several copies at a point, and use the result to decide whether a tiling is possible. The algebra is familiar; the question about fitting shapes together is not.",
      answer:
        "A regular hexagon has interior angle (6 − 2) × 180° ÷ 6 = 720° ÷ 6 = 120°. Three of them give 3 × 120° = 360°, a complete turn, so they meet with no gap or overlap. A regular pentagon has interior angle (5 − 2) × 180° ÷ 5 = 540° ÷ 5 = 108°. Three give 3 × 108° = 324°, leaving a 36° gap; four give 4 × 108° = 432°, which overlaps. No whole number of 108° angles makes exactly 360°, so regular pentagons cannot meet three-to-a-vertex in this way.",
      marking: [
        "Calculates the regular hexagon interior angle as 120°.",
        "Adds three hexagon angles to 360° and explains that this is a complete turn with no gap or overlap.",
        "Calculates the regular pentagon interior angle as 108°.",
        "Compares whole-number multiples of 108° with 360° and concludes that no exact fit is possible.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "An angle of 125° and an angle x make a straight line. Find x.",
      answer: "x = 180° − 125° = 55°.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A transversal crosses two parallel lines and one angle is 73°. State the alternate angle and the co-interior angle.",
      answer:
        "The alternate angle is 73° because alternate angles on parallel lines are equal. The co-interior angle is 107° because co-interior angles add to 180°.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why does a polygon with n sides have an interior angle sum of (n − 2) × 180°?",
      answer:
        "A diagonal from one vertex splits the polygon into n − 2 triangles. Each triangle has an angle sum of 180°, so the polygon's interior angles total (n − 2) × 180°.",
      when: "month-later",
    },
  ],

  summary: [
    "Angles on a straight line total 180°; angles around a point total 360°; vertically opposite angles are equal.",
    "On parallel lines, alternate and corresponding angles are equal, while co-interior angles add to 180°.",
    "A polygon with n sides has an interior angle sum of (n − 2) × 180°; a regular polygon divides that total equally.",
    "Name the angle fact with the calculation, check the total, and never treat an F or Z shape as a proof without parallel lines.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every diagram is described in words before its question: which lines are parallel, which angles are marked, and whether the pair is alternate, corresponding or co-interior. The description is part of the teaching, not an image caption added afterwards.",
    },
    {
      need: "low-vision",
      alternative:
        "Angle sizes and reasons are written in the text and in large notation blocks; no answer depends on judging an angle by sight or on a colour difference.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation follows the same visible order: state the whole turn, add the known parts, subtract, then check. Reasons are short and kept on the same line as the number they justify.",
    },
    {
      need: "colour-vision",
      alternative:
        "Angle pairs are named in words (alternate, corresponding, co-interior) and marked by position, not by colour alone.",
    },
    {
      need: "motor",
      alternative:
        "All practice is typed or selected; no dragging, measuring or rotating is required. A learner can sketch the diagram on paper but is not assessed on the drawing.",
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
        "All explanations, examples, practice, assessments and the hexagon-and-pentagon transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content and the National Curriculum for geometry and measures.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-09",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
