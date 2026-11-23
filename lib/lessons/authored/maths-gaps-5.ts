import { defineGapLesson } from "./_gap-lesson";

// MATHS GAP BATCH 5 — loci, navigation and proportion graphs.

export const MATHS_LOCI_CONSTRUCTIONS = defineGapLesson({
  conceptId: "loci-constructions",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, geometry: loci and standard compass-and-straight-edge constructions",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for loci and constructions. The scenarios and explanations are original.",
  },
  objectives: [
    {
      statement:
        "Describe the locus of points at a fixed distance from a point, a line or two points.",
      evidence:
        "The learner states that a fixed distance from a point gives a circle and a fixed distance from a line gives a pair of parallel lines, and draws the boundary accurately.",
    },
    {
      statement:
        "Construct the perpendicular bisector of a segment and the angle bisector of an angle with compasses and a straight edge.",
      evidence:
        "The learner describes the equal-radius arcs from both endpoints and the line through their intersections, and verifies that points on it are equidistant.",
    },
    {
      statement:
        "Combine two loci to solve a region problem and describe the boundary of the solution.",
      evidence:
        "For a point 5 m from a hedge and 3 m from a tap, the learner intersects the parallel line and circle and describes the feasible region.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["area-perimeter", "angles-lines"],
    check: [
      {
        id: "d1",
        question: "What is the set of points at a fixed distance from a single point?",
        answer:
          "A circle centred on that point, with the fixed distance as its radius.",
        targets: ["area-perimeter"],
      },
      {
        id: "d2",
        question: "What is the angle bisector of an angle?",
        answer:
          "The line that divides the angle into two equal angles; every point on it is equidistant from the two arms.",
        targets: ["angles-lines"],
      },
    ],
  },
  introduction: {
    hook:
      "A gardener can plant a tree anywhere that is exactly 5 metres from a wall and 3 metres from a tap. The first condition alone gives two parallel lines, one on each side of the wall. The second gives a circle around the tap. The possible positions are where the circle crosses those lines, not the whole shaded area. A locus is the boundary described by a rule, and combining rules means intersecting boundaries.",
    why:
      "Loci are often reduced to a list of shapes to recognise. The list is useful, but the reasoning is what transfers: a fixed distance from a point is a circle because every radius is equal; a fixed distance from two points is a perpendicular bisector because every point on it is equidistant. The constructions produce those loci exactly, which is why compasses are used rather than measuring with a ruler.",
  },
  explanation: [
    {
      heading: "A locus is a set defined by a condition",
      paragraphs: [
        "A locus is every point that satisfies a stated rule, not a single point and not the region inside the boundary. “Exactly 4 cm from A” is a circle of radius 4 cm. “No more than 4 cm from A” is the filled disc, including its boundary. The word “exactly” gives a curve; “at most” gives a region. Read the inequality before drawing.",
        "The distance from a line is measured perpendicularly. Points a fixed distance from a straight line form two parallel lines, one on each side. If the line is a segment rather than an infinite line, the ends also produce semicircles, because a point beyond the end can be closest to the endpoint rather than to the segment. The shape changes at the ends, and a complete locus accounts for that.",
      ],
    },
    {
      heading: "Equal distances produce bisectors",
      paragraphs: [
        "The perpendicular bisector of AB is the set of points equidistant from A and B. Every point on it forms an isosceles triangle with A and B, so the two distances are equal. The construction uses arcs of the same radius from A and B; the two intersections define the line. A point not on the line is closer to one endpoint, which is why the boundary is exact.",
        "The angle bisector is the set of points equidistant from the two arms of an angle. A point on the bisector has the same perpendicular distance to each arm. The compass construction marks equal distances along the arms and intersects arcs from those marks, producing a line that splits the angle equally.",
      ],
    },
    {
      heading: "Combine loci by intersecting their boundaries",
      paragraphs: [
        "When a point must satisfy two conditions, each condition gives a locus and the solution is their intersection. “5 m from the wall and 3 m from the tap” means the circle around the tap meets the parallel lines at particular points. If the conditions are inequalities, the solution is the overlap of regions, and the boundary is made of pieces of each locus.",
        "A region problem needs a clear final description: which boundary arcs and line segments enclose it, and which side of each boundary is included. Shading the wrong side is a common error even when the construction is accurate. Testing one point inside the proposed region against both conditions is a quick check that the shading matches the rule.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The locus of points at a fixed distance r from a point O is a circle. The distance condition is the definition of the radius.",
      notation: "locus = {P : OP = r}",
      caption:
        "For r = 3 cm, every point on the circle is exactly 3 cm from O. The interior is not part of the locus unless the condition says “at most”.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The perpendicular bisector is defined by equal distances to the two endpoints. The construction creates that equality with equal-radius arcs.",
      notation: "locus = {P : PA = PB}",
      caption:
        "Every point on the perpendicular bisector of AB is equidistant from A and B. The line crosses AB at its midpoint at a right angle.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "Combining a circle and a parallel-line locus gives intersection points or arcs. The solution is the overlap, not the union, when both conditions must hold.",
      notation: "5 m from a wall: two parallel lines; 3 m from a tap: a circle; solution = intersections",
      caption:
        "The circle may meet each parallel line twice, once or not at all. The number of intersections is part of the answer.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Describe and construct the locus of points equidistant from two points A and B.",
      steps: [
        {
          move: "Open the compass to more than half of AB and draw arcs of the same radius from A and from B, above and below the segment.",
          why:
            "Equal radii guarantee that each intersection is the same distance from A and from B. The radius must be large enough for the arcs to meet.",
        },
        {
          move: "Join the two intersection points with a straight line.",
          why:
            "Both intersections satisfy PA = PB, and the line through them is the perpendicular bisector of AB.",
        },
        {
          move: "Check a point on the line: its distances to A and B are equal, and the line crosses AB at its midpoint at 90°.",
          why:
            "The construction is exact because it uses equal distances, not measurement. The check confirms both the equidistance and the right angle.",
        },
      ],
      answer:
        "The perpendicular bisector of AB, constructed from equal-radius arcs and checked at the midpoint.",
    },
    {
      id: "w2",
      prompt:
        "A point must be 5 m from a straight hedge and 3 m from a tap. Describe the possible positions.",
      steps: [
        {
          move: "The hedge condition gives two parallel lines 5 m from the hedge, one on each side.",
          why:
            "Distance from a line is measured perpendicularly, so every point on each parallel line is exactly 5 m away.",
        },
        {
          move: "The tap condition gives a circle of radius 3 m centred on the tap.",
          why:
            "A fixed distance from a point is the definition of a circle. The circle is the boundary, not the filled disc.",
        },
        {
          move: "The possible positions are the intersections of the circle with the two parallel lines.",
          why:
            "Both conditions must hold, so the solution is the intersection. The circle may meet each line twice, once or not at all.",
        },
      ],
      answer:
        "The intersection points of the 3 m circle with the two lines 5 m from the hedge.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The locus of points 3 cm from a point is a filled circle of radius 3 cm.",
      whyItFails:
        "“Exactly 3 cm” describes the boundary, not the interior. A point 1 cm from the centre is not 3 cm away, so it does not satisfy the condition. The filled disc answers “at most 3 cm” instead.",
      correction:
        "Read the condition as an equality or an inequality. Draw the circle for “exactly” and shade the disc only for “at most” or “within”.",
      contrast: {
        wrong: "Shade the whole disc for “3 cm from A”.",
        right: "Draw the circle of radius 3 cm for “exactly 3 cm from A”.",
      },
    },
    {
      id: "m2",
      belief: "The perpendicular bisector is any line through the midpoint of AB.",
      whyItFails:
        "Many lines pass through the midpoint, but only one is perpendicular to AB. A slanted line through the midpoint gives different distances to A and B for most of its points, so it does not satisfy the equidistance condition.",
      correction:
        "Construct equal-radius arcs from both endpoints and join their intersections. The resulting line is both perpendicular to AB and through its midpoint.",
      contrast: {
        wrong: "Draw any line through the midpoint.",
        right: "Draw the line through the two arc intersections, perpendicular to AB.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "What is the locus of points exactly 4 cm from a point P?",
      hint: "A fixed distance from one point traces a familiar curve.",
      answer: "A circle of radius 4 cm centred on P.",
      feedback: {
        correct: "You described the boundary, not the filled region.",
        incorrect:
          "Every point at the same distance from a centre lies on a circle. The locus is the circle of radius 4 cm.",
      },
    },
    {
      id: "p2",
      prompt: "What is the locus of points equidistant from two intersecting lines?",
      hint: "Think about the angle between the lines and the line that splits it.",
      answer: "The two angle bisectors of the angles formed by the lines.",
      feedback: {
        correct: "You included both bisectors, not only one.",
        incorrect:
          "Two intersecting lines form four angles; the points equidistant from both lines lie on the two angle bisectors.",
      },
    },
    {
      id: "p3",
      prompt:
        "A point must be within 2 m of a wall and within 3 m of a post. Describe the region.",
      hint: "Each “within” gives a region; the answer is their overlap.",
      answer:
        "The strip within 2 m of the wall intersected with the disc of radius 3 m around the post.",
      feedback: {
        correct: "You intersected the two regions rather than adding their boundaries.",
        incorrect:
          "Both conditions must hold, so the solution is the overlap of the strip and the disc, not the union of the two shapes.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "What is the name of the locus of points equidistant from two fixed points?",
      modelAnswer: "perpendicular bisector",
      marking: [
        "Names the line that crosses the segment at its midpoint at a right angle.",
        "Recognises that every point on it is the same distance from both endpoints.",
      ],
      check: { accepted: ["perpendicular bisector", "the perpendicular bisector"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What is the name of the locus of points equidistant from the two arms of an angle?",
      modelAnswer: "angle bisector",
      marking: [
        "Names the line that divides the angle into two equal parts.",
        "Connects it to equal perpendicular distances from the arms.",
      ],
      check: { accepted: ["angle bisector", "the angle bisector", "bisector"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why every point on the perpendicular bisector of AB is equidistant from A and B, and why the construction with equal-radius arcs produces that line.",
      modelAnswer:
        "A point on the perpendicular bisector forms two right triangles with the midpoint of AB; the triangles have equal legs and share the perpendicular, so their hypotenuses are equal. The compass construction draws equal-radius arcs from A and B, so each intersection is the same distance from both endpoints. Joining the two intersections gives the line of all such points.",
      marking: [
        "Explains the equal distances using the midpoint and right triangles.",
        "Describes the equal-radius arcs from both endpoints.",
        "Connects the two arc intersections to the perpendicular bisector.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A drone must stay at least 50 m from a building and at most 120 m from its controller. Describe the feasible region, name the two boundary loci, and explain how you would test whether a proposed point is allowed.",
      whyItTransfers:
        "The lesson combines exact-distance loci. The drone uses inequalities and a safety region, so the learner must distinguish boundaries from shaded areas and test a point against both conditions.",
      answer:
        "The building condition gives the region outside a 50 m boundary around the building; the controller condition gives the disc of radius 120 m around the controller. The feasible region is the overlap: inside the controller's circle but outside the building's exclusion zone. Test a point by measuring its shortest distance to the building (at least 50 m) and its distance to the controller (at most 120 m); both must hold.",
      marking: [
        "Names the exclusion boundary around the building and the circle around the controller.",
        "Intersects the two regions rather than adding them.",
        "Tests a point against both inequalities, including the boundary conditions.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the locus of points 5 cm from a straight line?",
      answer: "Two parallel lines, one on each side, 5 cm from the line.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What does the perpendicular bisector of AB contain?",
      answer:
        "Every point equidistant from A and B; it crosses AB at its midpoint at a right angle.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "How do you combine two loci when both conditions must hold?",
      answer:
        "Intersect them; the solution is the set of points satisfying both conditions.",
      when: "month-later",
    },
  ],
  summary: [
    "A locus is the set of points satisfying a rule; an equality gives a boundary, an inequality gives a region.",
    "A fixed distance from a point is a circle; from a line it is two parallel lines.",
    "Equidistance from two points gives the perpendicular bisector; from two lines, the angle bisectors.",
    "Combine loci by intersecting them and test a point to confirm the shading.",
  ],
});

export const MATHS_BEARINGS = defineGapLesson({
  conceptId: "bearings",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, geometry: bearings and navigation",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for bearings and scale drawings. The journeys and examples are original.",
  },
  objectives: [
    {
      statement:
        "Measure and state a bearing as a three-digit angle measured clockwise from north.",
      evidence:
        "The learner writes a bearing of 45° as 045° and explains that it is measured from north, not from the horizontal.",
    },
    {
      statement:
        "Find the reverse bearing by adding or subtracting 180° and explain why the result is the opposite direction.",
      evidence:
        "The learner converts a bearing of 060° from A to B into 240° from B to A.",
    },
    {
      statement:
        "Use a bearing with the sine or cosine rule to solve a navigation problem.",
      evidence:
        "Given two sides and the included angle from a port, the learner uses the cosine rule to find the distance and interprets the result.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["trig-rule"],
    check: [
      {
        id: "d1",
        question: "When would you use the cosine rule rather than the sine rule?",
        answer:
          "When two sides and the included angle are known, or when all three sides are known and an angle is required.",
        targets: ["trig-rule"],
      },
      {
        id: "d2",
        question: "What does a three-figure bearing measure?",
        answer:
          "The clockwise angle from north, written with three digits so 45° is 045°.",
        targets: ["trig-rule"],
      },
    ],
  },
  introduction: {
    hook:
      "A ship leaves port on a bearing of 060°. To return, it cannot simply steer 060° again; that would take it further away. The return bearing is 240°, the opposite direction. A bearing is not a slope or an angle from the horizontal; it is a clockwise turn from north, written with three digits so there is no ambiguity.",
    why:
      "Bearings combine a convention with geometry. The convention is easy to state but easy to break: clockwise, from north, three digits. The geometry is the part that transfers: a there-and-back journey reverses direction by 180°, and a navigation triangle can be solved with the sine or cosine rule. This lesson keeps the convention visible at every step so a correct triangle is not reported with the wrong heading.",
  },
  explanation: [
    {
      heading: "North is the reference, and clockwise is the direction",
      paragraphs: [
        "A bearing is measured clockwise from north. East is 090°, south is 180° and west is 270°. The three-digit format is not decoration: 045° and 45° mean the same angle, but the leading zero makes clear that the measurement is a bearing rather than an angle from some other line. A bearing is always between 000° and 360°.",
        "To measure a bearing on a diagram, draw a north line at the point and measure clockwise from it. If the angle given is anticlockwise or measured from another line, convert it before using it. A common error is to measure from the horizontal because the page is wide; the north line, not the page, is the reference.",
      ],
    },
    {
      heading: "The reverse bearing differs by 180°",
      paragraphs: [
        "If B is on a bearing of θ from A, then A is on the bearing θ + 180° from B, subtracting 360° if the result exceeds it. The two directions are opposite, so the line between them is the same line traversed in the other direction. For 060°, the reverse is 240°; for 310°, the reverse is 130°.",
        "The reverse bearing is not always the sum of the two headings in a multi-leg journey. Each leg has its own bearing, and the return bearing applies to that leg. Drawing the north lines at each point prevents the error of carrying one bearing across a turn.",
      ],
    },
    {
      heading: "Bearings become triangle problems",
      paragraphs: [
        "A navigation problem often gives two distances from a point and the angle between them, or two bearings and a distance. Convert the bearings into the interior angle of the triangle: the angle between two bearings from the same point is the difference between them. Then use the cosine rule for two sides and the included angle, or the sine rule when a matching pair is available.",
        "The final bearing must be converted back from the triangle's angle. A triangle may give an interior angle of 40°, but the bearing could be 040°, 140° or 220° depending on which side of north the direction lies. Sketch the north lines and the direction before writing the three-digit answer. The sketch is the check that the triangle's geometry and the compass direction describe the same journey.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The reverse bearing is the opposite direction, so it differs by a half turn.",
      notation: "reverse bearing = θ + 180° (mod 360°)",
      caption:
        "For θ = 060°, the reverse is 240°. For θ = 310°, adding 180° gives 490°, and subtracting 360° gives 130°.",
    },
    {
      id: "r2",
      kind: "maths.graph",
      body:
        "The angle between two bearings from the same point is the difference between them. That difference is the included angle in the navigation triangle.",
      notation: "bearing 030° and bearing 110° ⇒ included angle = 80°",
      caption:
        "Subtract the smaller bearing from the larger when both are measured from the same north line. The triangle uses the interior angle, not the bearings themselves.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "The cosine rule finds the distance between two positions when the two sides from the starting point and the included angle are known.",
      notation: "c² = a² + b² − 2ab cos C",
      caption:
        "For sides 8 km and 5 km with an included angle of 60°, c² = 64 + 25 − 40 = 49, so the distance is 7 km.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A ship sails from A on a bearing of 060° to B. What is the bearing of A from B?",
      steps: [
        {
          move: "The reverse direction is a half turn from the original bearing.",
          why:
            "Travelling from B back to A means facing the opposite way along the same line, so the bearing changes by 180°.",
        },
        {
          move: "Add 180° to 060° to get 240°.",
          why:
            "The result is between 000° and 360°, so no adjustment is needed. It points southwest, opposite the original northeast direction.",
        },
        {
          move: "Write the answer with three digits: 240°.",
          why:
            "The three-digit convention distinguishes a bearing from an ordinary angle and keeps the format consistent.",
        },
      ],
      answer: "The bearing of A from B is 240°.",
    },
    {
      id: "w2",
      prompt:
        "Two ships leave a port. One sails 8 km on a bearing of 030° and the other 5 km on a bearing of 090°. How far apart are they?",
      steps: [
        {
          move: "Find the angle between the two bearings: 090° − 030° = 60°.",
          why:
            "Both bearings are measured clockwise from the same north line, so their difference is the included angle at the port.",
        },
        {
          move: "Use the cosine rule with sides 8 and 5 and included angle 60°: c² = 64 + 25 − 2 × 8 × 5 × 0.5.",
          why:
            "The two routes form two sides of a triangle from the port, and the angle between them is known. The cosine rule gives the third side.",
        },
        {
          move: "c² = 89 − 40 = 49, so c = 7 km.",
          why:
            "The distance is the positive square root. It lies between the difference and the sum of the two sides, as the triangle inequality requires.",
        },
      ],
      answer: "The ships are 7 km apart.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The reverse of a bearing of 060° is 120°, because you add 60° twice.",
      whyItFails:
        "Doubling the bearing does not reverse the direction. The opposite direction is a half turn, 180°, so 060° becomes 240°. Adding 60° gives a direction that is only 60° further around, not the way back.",
      correction:
        "Add or subtract 180° and adjust into the range 000° to 360°. Sketch both north lines to see that the return journey faces the opposite way.",
      contrast: {
        wrong: "060° back is 120°",
        right: "060° back is 240°",
      },
    },
    {
      id: "m2",
      belief: "A bearing can be measured anticlockwise from north if that is the smaller angle.",
      whyItFails:
        "The convention fixes the direction: clockwise from north. An anticlockwise angle describes a different point unless it is converted. Two people using different conventions can draw the same number in opposite directions.",
      correction:
        "Always measure clockwise from the north line. If an angle is given anticlockwise, subtract it from 360° before treating it as a bearing.",
      contrast: {
        wrong: "30° anticlockwise from north is 030°.",
        right: "30° anticlockwise from north is 330°.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "What is the bearing of east?",
      hint: "East is a quarter turn clockwise from north.",
      answer: "090°.",
      feedback: {
        correct: "You used a quarter turn clockwise and wrote three digits.",
        incorrect:
          "East is 90° clockwise from north, written as 090° to show it is a bearing.",
      },
    },
    {
      id: "p2",
      prompt: "A bearing from A to B is 135°. What is the bearing from B to A?",
      hint: "Add 180° and adjust if the result exceeds 360°.",
      answer: "315°.",
      feedback: {
        correct: "You added a half turn to get the opposite direction.",
        incorrect:
          "135° + 180° = 315°, which is already between 000° and 360°. The reverse bearing is 315°.",
      },
    },
    {
      id: "p3",
      prompt:
        "Two bearings from the same point are 040° and 120°. What is the angle between the routes?",
      hint: "Subtract the smaller bearing from the larger.",
      answer: "80°.",
      feedback: {
        correct: "You used the difference of the bearings as the included angle.",
        incorrect:
          "Both are measured from the same north line, so the angle between them is 120° − 40° = 80°.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is the bearing of a direction 45° clockwise from north?",
      modelAnswer: "045°",
      marking: [
        "Measures clockwise from north.",
        "Writes the angle with three digits.",
      ],
      check: { accepted: ["045", "045°", "45°", "45"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A ship sails from A to B on a bearing of 060°. What is the bearing from B to A?",
      modelAnswer: "240°",
      marking: [
        "Adds 180° for the reverse direction.",
        "Keeps the result in the range 000° to 360°.",
      ],
      check: { accepted: ["240", "240°"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how to find the angle between two routes from the same point when their bearings are given, and why the result is not itself a bearing until you convert it back.",
      modelAnswer:
        "Both bearings are measured clockwise from the same north line, so the angle between the routes is the difference between the bearings. That difference is an interior angle of the triangle, not a direction from north. After using the sine or cosine rule, convert the triangle's angle back into a bearing by checking which side of north the direction lies on and writing the clockwise angle from north.",
      marking: [
        "Uses the difference of the bearings as the included angle.",
        "Distinguishes an interior triangle angle from a bearing.",
        "Converts the result back using the north line and clockwise direction.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A lifeboat leaves a harbour on a bearing of 110° and travels 12 km. A second boat leaves the same harbour on a bearing of 050° and travels 9 km. Find the distance between them and the bearing of the second boat from the first, explaining each conversion.",
      whyItTransfers:
        "The lesson uses a simple two-bearing triangle. The lifeboat problem asks for both a distance and a return bearing, so the learner must use the cosine rule and then convert an interior angle back to a compass direction.",
      answer:
        "The included angle is 110° − 50° = 60°. The distance squared is 12² + 9² − 2 × 12 × 9 × cos 60° = 144 + 81 − 108 = 117, so the distance is √117 ≈ 10.8 km. To find the bearing from the first boat to the second, use the sine rule for the angle at the first boat: sin θ / 9 = sin 60° / 10.8, so θ ≈ 46°. The second boat lies to the left of the first boat's outbound direction, so the bearing is approximately 110° − 46° = 064°.",
      marking: [
        "Uses the difference of bearings as the included angle.",
        "Applies the cosine rule and gets about 10.8 km.",
        "Uses the sine rule and converts the interior angle back to a three-digit bearing.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What are the three rules for writing a bearing?",
      answer: "Measure clockwise, from north, and write three digits.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "How do you find the reverse bearing?",
      answer: "Add 180° and subtract 360° if the result is 360° or more.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "How do you find the angle between two routes from the same point?",
      answer: "Subtract the smaller bearing from the larger.",
      when: "month-later",
    },
  ],
  summary: [
    "A bearing is measured clockwise from north and written with three digits.",
    "The reverse bearing differs by 180°, adjusted into the range 000° to 360°.",
    "The angle between two routes from one point is the difference of their bearings.",
    "After solving the triangle, convert the interior angle back to a bearing using a north-line sketch.",
  ],
});

export const MATHS_PROPORTIONAL_GRAPHS = defineGapLesson({
  conceptId: "proportional-graphs",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, ratio and proportion: direct and inverse proportion graphs",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for direct and inverse proportion. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Recognise a direct-proportion graph as a straight line through the origin and use its constant of proportionality.",
      evidence:
        "For y proportional to x with y = 6 when x = 4, the learner finds k = 1.5 and predicts y = 15 when x = 10.",
    },
    {
      statement:
        "Recognise an inverse-proportion graph as a hyperbola and use y = k/x to solve for an unknown.",
      evidence:
        "For y inversely proportional to x with y = 6 when x = 4, the learner finds k = 24 and y = 3 when x = 8.",
    },
    {
      statement:
        "Choose between direct and inverse models from a description of how quantities change together.",
      evidence:
        "The learner explains that speed and time for a fixed distance are inversely proportional while cost and quantity at a fixed price are directly proportional.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["proportion", "straight-lines"],
    check: [
      {
        id: "d1",
        question: "What does it mean for y to be directly proportional to x?",
        answer:
          "y = kx for a constant k; doubling x doubles y, and the graph is a straight line through the origin.",
        targets: ["proportion"],
      },
      {
        id: "d2",
        question: "What is the gradient of a straight line through the origin?",
        answer:
          "The constant ratio y/x, which is the same at every point on the line.",
        targets: ["straight-lines"],
      },
    ],
  },
  introduction: {
    hook:
      "A shop sells notebooks at a fixed price. Twice as many notebooks cost twice as much, and the graph of cost against quantity is a straight line through the origin. A car travelling a fixed distance behaves differently: twice the speed means half the time, and the graph curves toward the axes. Both are proportional relationships, but one multiplies and the other divides.",
    why:
      "Direct and inverse proportion are often taught as two formulas without the graph. The graph is the quickest diagnostic: a straight line through the origin is direct; a curve that never touches either axis is inverse. The constant of proportionality is the bridge between the two quantities, and finding it from one pair lets every other pair be predicted. This lesson uses the graph to choose the model, then the constant to compute.",
  },
  explanation: [
    {
      heading: "Direct proportion is a constant ratio",
      paragraphs: [
        "If y is directly proportional to x, then y/x is constant. The graph is a straight line through the origin because when x is zero, y is zero. The gradient is the constant of proportionality k. Doubling x doubles y; tripling x triples y. The relationship can also be written y = kx.",
        "A direct-proportion graph that does not pass through the origin is not direct proportion, even if it is a straight line. It may be a linear relationship with a fixed starting cost, but the ratio y/x changes. The origin is part of the definition, not a drawing detail.",
      ],
    },
    {
      heading: "Inverse proportion is a constant product",
      paragraphs: [
        "If y is inversely proportional to x, then xy is constant. The graph is a hyperbola that approaches both axes but never touches them: as x grows, y shrinks, and as x approaches zero, y grows without bound. The constant k is the product of the two quantities, and the equation is y = k/x.",
        "The inverse graph is not a straight line with a negative gradient. A straight line would eventually cross an axis, while the inverse curve never does. Doubling x halves y, which is a different pattern from subtracting a fixed amount. The product test is the quickest numerical check.",
      ],
    },
    {
      heading: "Choose the model from the relationship, not the data alone",
      paragraphs: [
        "Two points can fit many models. A direct model requires the ratio to stay constant; an inverse model requires the product to stay constant. With several pairs, compute both and see which is stable. With a description, reason about the mechanism: a fixed total distance makes speed and time inverse; a fixed price makes cost and quantity direct.",
        "The constant has units. In a direct model, k is the amount of y per unit of x. In an inverse model, k is the product of the two quantities and its units are the product of their units. Carrying the units helps distinguish a rate from a total and catches a model that has been inverted. A constant with the wrong units is a warning that the relationship has been misread, even when the arithmetic looks tidy. The units also tell you what a single unit of the constant actually represents.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Direct proportion has a constant ratio and a graph through the origin. The gradient is the constant of proportionality.",
      notation: "y = kx; y/x = k",
      caption:
        "For y = 6 when x = 4, k = 1.5. The point (10, 15) lies on the same line because 15/10 = 1.5.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Inverse proportion has a constant product. The graph is a hyperbola and neither axis is reached.",
      notation: "y = k/x; xy = k",
      caption:
        "For y = 6 when x = 4, k = 24. When x = 8, y = 3, and 8 × 3 = 24.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "A direct graph is a straight line through the origin; an inverse graph curves toward both axes without touching them.",
      notation: "direct: y = 1.5x; inverse: y = 24/x",
      caption:
        "The direct line doubles both coordinates together. The inverse curve halves the vertical coordinate when the horizontal doubles.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "y is directly proportional to x, and y = 6 when x = 4. Find k and y when x = 10.",
      steps: [
        {
          move: "Write y = kx and substitute the known pair: 6 = 4k.",
          why:
            "Direct proportion means the ratio y/x is constant, so one pair is enough to find the constant.",
        },
        {
          move: "Solve k = 6/4 = 1.5.",
          why:
            "The constant is the amount of y for each unit of x. It is also the gradient of the graph.",
        },
        {
          move: "Substitute x = 10: y = 1.5 × 10 = 15.",
          why:
            "The same constant applies to every pair. The point (10, 15) lies on the line through the origin.",
        },
      ],
      answer: "k = 1.5, and y = 15 when x = 10.",
    },
    {
      id: "w2",
      prompt:
        "y is inversely proportional to x, and y = 6 when x = 4. Find k and y when x = 8.",
      steps: [
        {
          move: "Write y = k/x and substitute: 6 = k/4.",
          why:
            "Inverse proportion means the product xy is constant, so the known pair gives the constant.",
        },
        {
          move: "Multiply by 4: k = 24.",
          why:
            "The constant is the product of the two quantities. It is not the ratio, which would be 1.5.",
        },
        {
          move: "Substitute x = 8: y = 24/8 = 3.",
          why:
            "Doubling x from 4 to 8 halves y from 6 to 3, which is the defining behaviour of inverse proportion.",
        },
      ],
      answer: "k = 24, and y = 3 when x = 8.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Any straight-line graph represents direct proportion.",
      whyItFails:
        "Direct proportion requires the line to pass through the origin. A line such as y = 2x + 5 is straight, but y/x changes with x and a zero input gives 5, not 0. The fixed 5 is a starting cost, not a proportional relationship.",
      correction:
        "Check both the straightness and the origin. If the line does not pass through (0, 0), the relationship is linear but not directly proportional.",
      contrast: {
        wrong: "y = 2x + 5 is direct proportion.",
        right: "y = 2x is direct proportion; y = 2x + 5 is only linear.",
      },
    },
    {
      id: "m2",
      belief: "Inverse proportion means y decreases as x increases, so any decreasing graph is inverse.",
      whyItFails:
        "A straight line with a negative gradient also decreases, but it eventually crosses the axes and does not have a constant product. Inverse proportion has a constant xy and a curved graph that approaches the axes without touching them.",
      correction:
        "Test the product xy across pairs. If it stays constant, the relationship is inverse; if the difference or ratio is constant instead, it is a different model.",
      contrast: {
        wrong: "y = 10 − x is inverse proportion.",
        right: "y = 10/x is inverse proportion.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "If y is directly proportional to x and y = 12 when x = 3, find k.",
      hint: "Divide y by x, because direct proportion has a constant ratio.",
      answer: "k = 12/3 = 4.",
      feedback: {
        correct: "You divided y by x for the constant ratio.",
        incorrect:
          "Direct proportion gives k = y/x, so k = 4, not 36.",
      },
    },
    {
      id: "p2",
      prompt: "If y is inversely proportional to x and y = 8 when x = 2, find y when x = 4.",
      hint: "Find the constant product first, then divide by the new x.",
      answer: "k = 16, so y = 16/4 = 4.",
      feedback: {
        correct: "You used the constant product and halved y when x doubled.",
        incorrect:
          "The constant is 2 × 8 = 16. At x = 4, y = 16/4 = 4, not 16.",
      },
    },
    {
      id: "p3",
      prompt:
        "A car travels a fixed 120 km. Are speed and time directly or inversely proportional? Explain.",
      hint: "At double the speed, what happens to the time for the same distance?",
      answer:
        "Inversely proportional: speed × time = 120, so doubling the speed halves the time.",
      feedback: {
        correct: "You identified the constant product and the halving behaviour.",
        incorrect:
          "The distance is fixed, so speed and time multiply to 120. That constant product makes them inversely proportional.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "y is directly proportional to x and y = 6 when x = 4. What is the constant of proportionality?",
      modelAnswer: "1.5",
      marking: [
        "Uses k = y/x.",
        "Divides 6 by 4 to get 1.5.",
      ],
      check: { accepted: ["1.5", "3/2", "1.5"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "y is inversely proportional to x and y = 6 when x = 4. What is y when x = 8?",
      modelAnswer: "3",
      marking: [
        "Finds the constant product 24.",
        "Divides 24 by 8 to get 3.",
      ],
      check: { accepted: ["3", "three"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how the graphs of direct and inverse proportion differ, and how you would use a table of values to decide which model fits.",
      modelAnswer:
        "A direct-proportion graph is a straight line through the origin, and the ratio y/x is constant. An inverse-proportion graph is a curve that approaches both axes, and the product xy is constant. From a table, compute y/x and xy for each pair; if the ratios agree, the model is direct, and if the products agree, it is inverse.",
      marking: [
        "Describes the direct graph as a straight line through the origin.",
        "Describes the inverse graph as a curve with a constant product.",
        "Uses the ratio and product tests on a table to choose the model.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A factory's output is directly proportional to the number of machines, and the time to complete an order is inversely proportional to the number of machines. With 6 machines, the factory produces 180 units per hour and takes 10 hours for an order. Find the output and time with 9 machines, and explain why the two answers move in opposite directions.",
      whyItTransfers:
        "The lesson treats direct and inverse models separately. The factory combines them in one scenario, so the learner must identify which quantity is direct and which is inverse, then apply the correct constant to each.",
      answer:
        "Output: 180/6 = 30 units per machine per hour, so 9 machines produce 270 units per hour. Time: 6 × 10 = 60 machine-hours, so 9 machines take 60/9 ≈ 6.67 hours. Output rises with machines because it is direct; time falls because the same total work is shared among more machines.",
      marking: [
        "Finds the direct constant 30 units per machine per hour.",
        "Finds the inverse constant 60 machine-hours and divides by 9.",
        "Explains why output increases while time decreases.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does the graph of direct proportion look like?",
      answer: "A straight line through the origin.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is constant in inverse proportion?",
      answer: "The product of the two quantities, xy = k.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "How can a table distinguish direct from inverse proportion?",
      answer:
        "Check whether y/x is constant (direct) or xy is constant (inverse).",
      when: "month-later",
    },
  ],
  summary: [
    "Direct proportion has a constant ratio, y = kx, and a straight-line graph through the origin.",
    "Inverse proportion has a constant product, y = k/x, and a hyperbola that never touches the axes.",
    "A straight line with an intercept is linear but not directly proportional.",
    "Use the mechanism and a table of ratios/products to choose the model, then apply its constant.",
  ],
});
