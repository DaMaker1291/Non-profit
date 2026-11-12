import type { AuthoredLesson } from "../../lesson-contract";

// A TRANSFORMATION IS A RULE APPLIED TO EVERY POINT, NOT A PICTURE THAT LOOKS RIGHT.
//
// The common errors in this topic are description errors: a rotation given
// without its centre, a reflection described as a translation, an enlargement
// whose area is said to double when its lengths do. The lesson therefore makes
// the complete description the object of study — vector, mirror line, centre
// with angle and direction, centre with scale factor — and checks each image by
// applying the rule to coordinates rather than by matching a shape by eye.
// Congruence and similarity are kept separate: the first three transformations
// preserve both length and angle, while an enlargement preserves angle and
// multiplies every length by the same factor.
export const MATHS_TRANSFORMATIONS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "transformations",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry and measures: translation, rotation, reflection and enlargement on a coordinate grid, including fractional and negative scale factors",
    level: "Key Stage 3 to GCSE Foundation and Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the design-transfer task are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Describe a translation completely with a column vector and apply it to every vertex of a shape.",
      evidence:
        "The learner translates a triangle by the vector (4, −1), gives all three image coordinates, and states that the shape's size and orientation are unchanged.",
    },
    {
      statement:
        "Reflect a shape in a given horizontal, vertical or diagonal mirror line and identify the invariant line.",
      evidence:
        "The learner reflects (1, 2), (3, 2) and (2, 4) in y = x to obtain (2, 1), (2, 3) and (4, 2), and explains that points on y = x do not move.",
    },
    {
      statement:
        "Rotate a shape about a stated centre by 90°, 180° or 270°, clockwise or anticlockwise, and describe the rotation fully.",
      evidence:
        "The learner rotates a triangle 90° clockwise about the origin, gives the image coordinates, and names the angle, direction and centre in a complete description.",
    },
    {
      statement:
        "Enlarge a shape from a stated centre by a positive, fractional or negative scale factor, and distinguish the length factor from the area factor.",
      evidence:
        "The learner enlarges a 3 cm by 2 cm rectangle by scale factor 3 to obtain lengths three times as long and an area 9 times as large, and explains why the area factor is 9 rather than 3.",
    },
    {
      statement:
        "Distinguish congruence from similarity and recognise when a single transformation can replace a sequence.",
      evidence:
        "The learner states that translations, reflections and rotations produce congruent images, that an enlargement produces a similar image, and that a 180° rotation about the origin followed by a reflection in the x-axis is the same as a reflection in the y-axis.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["coordinates"],
    check: [
      {
        id: "d1",
        question: "Plot the point (3, −2) and state which axis each coordinate refers to.",
        answer:
          "The first coordinate, 3, is the horizontal x-value; the second, −2, is the vertical y-value. Start at the origin, move 3 right and 2 down.",
        targets: ["coordinates"],
      },
      {
        id: "d2",
        question: "Find the midpoint of the segment joining (1, 1) and (5, 3).",
        answer:
          "The midpoint is ((1 + 5)/2, (1 + 3)/2) = (3, 2). Average each coordinate separately.",
        targets: ["coordinates"],
      },
      {
        id: "d3",
        question: "A point moves 4 units right and 1 unit down. Write this as a column vector.",
        answer:
          "The horizontal change is +4 and the vertical change is −1, so the column vector is (4 over −1). Right and up are positive; left and down are negative.",
        targets: ["coordinates"],
      },
      {
        id: "d4",
        question: "How many units are between (2, 5) and (2, −1)?",
        answer:
          "The x-coordinates are equal, so the distance is the difference of the y-coordinates: 5 − (−1) = 6 units.",
        targets: ["coordinates"],
      },
    ],
  },

  introduction: {
    hook:
      "A logo is a triangle with vertices at (1, 1), (3, 1) and (1, 2). A designer slides it right, flips it, turns it and enlarges it. Each move has a complete description: a translation by a vector, a reflection in a named line, a rotation about a named centre through a named angle and direction, or an enlargement from a named centre by a named scale factor. The picture alone is not enough. Two different rotations can produce the same image if their centres differ, and a reflection can look like a slide if you only glance at the result. The coordinates are what make the description testable.",
    why:
      "Transformations are the grammar of shape: they describe how patterns repeat, how maps and screens are composed, how molecules and crystals are arranged, and how animations move. They also carry two ideas that run through mathematics — invariance (what stays the same under a change) and similarity (what changes by a common factor). A learner who can say exactly which points move and which stay fixed can reason about symmetry, tessellation and scale instead of relying on a diagram that happens to look right.",
  },

  explanation: [
    {
      heading: "A transformation is a rule for every point",
      paragraphs: [
        "A transformation maps each point of a shape to an image point. The original is the object; the result is the image. A prime mark distinguishes them: A maps to A′. The rule must be applied to every vertex, not only to the ones that are easy to see. Once the vertices are placed, the sides follow because a straight side maps to a straight side.",
        "Translations, reflections and rotations are rigid motions: they preserve every length and every angle, so the image is congruent to the object. An enlargement preserves every angle but multiplies every length by the same scale factor, so the image is similar but not congruent unless the factor is 1 or −1. This is the first check on any description: if the image is a different size, the transformation cannot be a translation, reflection or rotation alone.",
        "Orientation is the second check. A translation keeps the shape facing the same way. A reflection reverses the order of the vertices — a clockwise triangle becomes anticlockwise — which is why a reflected word reads backwards. A rotation keeps the order but turns the shape. An enlargement with a positive factor keeps the order; a negative factor reverses it as well as turning the shape through 180° about the centre.",
      ],
    },
    {
      heading: "Translation: add the same vector to every point",
      paragraphs: [
        "A translation slides a shape without turning or flipping it. It is described by a column vector: the top number is the horizontal change, the bottom number the vertical change. Right and up are positive; left and down are negative. The vector (4, −1) means 4 right and 1 down.",
        "To translate a point, add the vector to its coordinates. A triangle with vertices A(1, 2), B(3, 2) and C(2, 4), translated by (4, −1), has images A′(1 + 4, 2 − 1) = (5, 1), B′(3 + 4, 2 − 1) = (7, 1) and C′(2 + 4, 4 − 1) = (6, 3). Every vertex moves the same distance in the same direction, so the sides remain parallel and equal and the angles are unchanged.",
        "A translation has no fixed points unless the vector is zero. Every point moves. The description is complete when the vector is given; saying “it moved right” is not enough, because the distance and the vertical change are part of the rule. A translation never changes the size, the orientation or the order of the vertices.",
      ],
    },
    {
      heading: "Reflection: every point crosses the mirror line at the same distance",
      paragraphs: [
        "A reflection flips a shape across a mirror line. Each point and its image are the same perpendicular distance from the line, on opposite sides, and the segment joining them is perpendicular to the mirror. Points on the mirror line do not move; the mirror line is invariant. A reflection reverses orientation: a clockwise labelling becomes anticlockwise.",
        "For a vertical line x = a, the y-coordinate stays the same and the x-coordinate is reflected: x′ = 2a − x. For a horizontal line y = b, the x-coordinate stays the same and y′ = 2b − y. For the line y = x, the coordinates swap: (x, y) maps to (y, x). For the line y = −x, (x, y) maps to (−y, −x). These rules are shortcuts for the perpendicular construction, not a separate theory.",
        "Reflect the triangle A(1, 2), B(3, 2), C(2, 4) in y = x. A′ = (2, 1), B′ = (2, 3) and C′ = (4, 2). The side AB was horizontal; its image is vertical, because the mirror line is diagonal. Lengths and angles are unchanged, but the order of the vertices is reversed. Check that a point on the mirror, such as (5, 5), maps to itself; that is the invariant line doing its job.",
      ],
    },
    {
      heading: "Rotation: turn about a centre through a stated angle",
      paragraphs: [
        "A rotation turns a shape about a fixed centre. A complete description needs three things: the angle, the direction (clockwise or anticlockwise) and the centre. The centre is a point, not a shape; without it the same angle produces a different image. A rotation preserves lengths, angles and orientation — the shape is congruent — but it changes the direction the shape faces.",
        "About the origin, the common rotations have coordinate rules. A 90° clockwise rotation maps (x, y) to (y, −x). A 180° rotation maps (x, y) to (−x, −y). A 90° anticlockwise rotation maps (x, y) to (−y, x). A 270° clockwise rotation is the same as 90° anticlockwise. For a centre that is not the origin, subtract the centre's coordinates, apply the rule, then add the centre back.",
        "Rotate the triangle A(1, 1), B(3, 1), C(1, 2) by 90° clockwise about the origin. A′ = (1, −1), B′ = (1, −3) and C′ = (2, −1). The right angle at A is still a right angle, and the side lengths are unchanged. The triangle has turned, not flipped: the order A, B, C remains clockwise. A 180° rotation about the origin would give (−1, −1), (−3, −1) and (−1, −2), which is the same as an enlargement by scale factor −1 from the origin.",
      ],
    },
    {
      heading: "Enlargement: multiply distances from the centre by the scale factor",
      paragraphs: [
        "An enlargement needs a centre and a scale factor. For every vertex, draw a ray from the centre through the vertex and measure its distance. The image lies on the same ray at the scale factor times that distance. A factor greater than 1 enlarges; a factor between 0 and 1 shrinks; a factor of 1 leaves the shape unchanged. The centre itself is fixed.",
        "For an enlargement from the origin with factor k, (x, y) maps to (kx, ky). With k = 2, A(1, 1) maps to (2, 2), B(3, 1) to (6, 2) and C(1, 2) to (2, 4). Every side is twice as long, so the perimeter is twice as long. Every angle is unchanged, so the image is similar to the object, not congruent. The area is multiplied by k²: with k = 2 the area is four times as large; with k = 3 it is nine times as large; with k = 1/2 it is one quarter.",
        "A negative scale factor places the image on the opposite ray from the centre. A factor of −1 maps (x, y) to (−x, −y): the image is the same size, turned through 180° about the centre. A factor of −2 also turns it 180° and makes every length twice as long. A negative enlargement is not a reflection; it is a rotation through 180° combined with a scaling. The area factor is k², so it is positive even when k is negative.",
      ],
    },
    {
      heading: "Describe fully, then check the invariants",
      paragraphs: [
        "A complete description has a different shape for each transformation. Translation: give the vector. Reflection: give the equation of the mirror line. Rotation: give the angle, the direction and the centre. Enlargement: give the centre and the scale factor. “It turned” or “it flipped” is not a description; the mark scheme needs the parameters that determine the image uniquely.",
        "Check congruence and orientation first. If lengths and angles are unchanged and the order of the vertices is unchanged, the transformation may be a translation or rotation. If lengths and angles are unchanged but the order is reversed, it is a reflection (or a combination containing one). If lengths have changed by a common factor and angles are unchanged, it is an enlargement. A mixture of size change and reversal indicates an enlargement with a negative factor, or a sequence.",
        "Finally, check a point. Apply the proposed rule to one vertex and see whether it lands on the stated image. For a rotation, the distance from the centre must be the same before and after. For a reflection, the mirror line must be the perpendicular bisector of the segment joining a point and its image. For an enlargement, the centre, the object point and the image point must be collinear, and the distance ratio must equal the scale factor. These checks catch a wrong centre, a sign error and a reflection confused with a rotation.",
      ],
    },
    {
      heading: "Sequences and a single equivalent transformation",
      paragraphs: [
        "Two transformations applied one after the other can produce an image that a single transformation could also produce. For example, a 180° rotation about the origin maps (x, y) to (−x, −y), and a reflection in the x-axis maps that to (−x, y), which is exactly a reflection in the y-axis. The two-step sequence and the single reflection have the same effect on every point, so they are equivalent.",
        "Not every sequence collapses to one of the four basic transformations. A reflection followed by a translation parallel to the mirror line is a glide reflection, which is not a translation, a reflection, a rotation or an enlargement. The lesson's claim is narrower and safer: check whether the final coordinates match a single candidate rule; if they do not, describe the sequence rather than inventing a transformation.",
        "Order matters. A translation after a rotation generally gives a different image from the same rotation after the translation. When a question asks for a sequence, apply the transformations in the order stated and track each vertex. When it asks for a single equivalent transformation, test a candidate on all vertices, not just the one that suggested it.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A translation adds one vector to every vertex. The shape keeps its size and orientation.",
      notation:
        "A(1, 2) + (4, −1) = A′(5, 1)   ·   B(3, 2) → B′(7, 1)   ·   C(2, 4) → C′(6, 3)",
      caption:
        "The top number of the vector is the horizontal change and the bottom number the vertical change. Right and up are positive.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A reflection puts each point the same perpendicular distance on the other side of the mirror line. Points on the line do not move.",
      notation:
        "in y = x: (x, y) → (y, x)   ·   (1, 2) → (2, 1)   ·   in y = −x: (x, y) → (−y, −x)",
      caption:
        "The mirror line is the perpendicular bisector of every segment joining a point to its image. Reflection reverses orientation.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A rotation about the origin has a coordinate rule. A complete description also names the centre and the direction.",
      notation:
        "90° clockwise: (x, y) → (y, −x)   ·   180°: (x, y) → (−x, −y)   ·   90° anticlockwise: (x, y) → (−y, x)",
      caption:
        "For a centre other than the origin, subtract the centre, apply the rule, then add the centre back. Rotation preserves orientation.",
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "An enlargement from the origin multiplies each coordinate by the scale factor. Lengths change by k; area changes by k².",
      notation:
        "k = 2: (x, y) → (2x, 2y)   ·   lengths ×2   ·   area ×4   ·   k = −1: (x, y) → (−x, −y)",
      caption:
        "The image is similar, not congruent, unless |k| = 1. A negative factor puts the image on the opposite ray and turns it through 180°.",
    },
    {
      id: "r5",
      kind: "maths.expression",
      body:
        "The invariants identify the transformation family before any coordinates are calculated.",
      notation:
        "translation/rotation: lengths and orientation preserved   ·   reflection: lengths preserved, orientation reversed   ·   enlargement: angles preserved, lengths ×k, area ×k²",
      caption:
        "If the image is a different size, it is not a rigid motion. If the vertex order is reversed with no size change, a reflection is involved.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A triangle has vertices A(1, 2), B(3, 2) and C(2, 4). Translate it by the vector (4, −1) and give the image coordinates.",
      steps: [
        {
          move:
            "Identify the vector: 4 right and 1 down. A translation adds the same vector to every vertex.",
          why:
            "The top number is horizontal and the bottom number vertical. The signs say right and down, not left and up.",
        },
        {
          move: "A′ = (1 + 4, 2 − 1) = (5, 1).",
          why:
            "Add the horizontal component to x and the vertical component to y. The prime marks the image point.",
        },
        {
          move: "B′ = (3 + 4, 2 − 1) = (7, 1).",
          why:
            "Every vertex moves by the same vector, so B moves exactly as A did. The side AB stays horizontal and the same length.",
        },
        {
          move: "C′ = (2 + 4, 4 − 1) = (6, 3).",
          why:
            "Applying the rule to all three vertices avoids drawing a shape that is the right size but in the wrong place.",
        },
        {
          move:
            "The image is A′(5, 1), B′(7, 1), C′(6, 3). It is congruent to the object and faces the same way, as a translation must.",
          why:
            "The final check uses the invariants of a translation: equal lengths, equal angles and unchanged orientation.",
        },
      ],
      answer: "A′(5, 1), B′(7, 1), C′(6, 3)",
    },
    {
      id: "w2",
      prompt:
        "Reflect the triangle A(1, 2), B(3, 2), C(2, 4) in the line y = x. Give the image coordinates and state what stays fixed.",
      steps: [
        {
          move:
            "Use the rule for reflection in y = x: swap the coordinates, (x, y) → (y, x).",
          why:
            "The line y = x is the set of points whose two coordinates are equal. A reflection in it exchanges the horizontal and vertical distances.",
        },
        {
          move: "A′ = (2, 1) and B′ = (2, 3).",
          why:
            "Swapping each pair places the image on the opposite side of y = x at the same perpendicular distance.",
        },
        {
          move: "C′ = (4, 2).",
          why:
            "Every vertex follows the same rule. The side AC, originally vertical, becomes horizontal in the image.",
        },
        {
          move:
            "The mirror line y = x is invariant: a point such as (5, 5) maps to itself because its coordinates are already equal.",
          why:
            "Points on the mirror line have zero distance from it, so they cannot move. This is the fixed set of the reflection.",
        },
        {
          move:
            "The image is A′(2, 1), B′(2, 3), C′(4, 2); lengths and angles are unchanged and the vertex order is reversed.",
          why:
            "The final sentence checks the defining invariants of a reflection: congruence with reversed orientation.",
        },
      ],
      answer: "A′(2, 1), B′(2, 3), C′(4, 2); the line y = x is fixed",
    },
    {
      id: "w3",
      prompt:
        "Rotate the triangle A(1, 1), B(3, 1), C(1, 2) through 90° clockwise about the origin. Give the image coordinates and describe the rotation fully.",
      steps: [
        {
          move:
            "Write the rule for a 90° clockwise rotation about the origin: (x, y) → (y, −x).",
          why:
            "A quarter turn clockwise takes the positive x-direction to the negative y-direction. The rule encodes that turn for every point.",
        },
        {
          move: "A′ = (1, −1) and B′ = (1, −3).",
          why:
            "The old y-coordinate becomes the new x-coordinate, and the old x-coordinate becomes the new y with its sign changed.",
        },
        {
          move: "C′ = (2, −1).",
          why:
            "The vertex C was above A; after the turn it lies to the right of A′. A sketch of the three image points confirms the quarter turn.",
        },
        {
          move:
            "The full description is a rotation of 90° clockwise about the origin (0, 0).",
          why:
            "Angle, direction and centre are all required. Saying only “90°” would leave the image undetermined.",
        },
        {
          move:
            "The image is A′(1, −1), B′(1, −3), C′(2, −1). Lengths and angles are unchanged and the order of the vertices is still clockwise.",
          why:
            "A rotation is a rigid motion and preserves orientation, unlike a reflection. The distances from the origin are unchanged.",
        },
      ],
      answer: "A′(1, −1), B′(1, −3), C′(2, −1); 90° clockwise about the origin",
    },
    {
      id: "w4",
      prompt:
        "Enlarge the triangle A(1, 1), B(3, 1), C(1, 2) by scale factor 2 from the origin. Give the image coordinates and state the effect on area.",
      steps: [
        {
          move:
            "Use the enlargement rule from the origin: (x, y) → (2x, 2y).",
          why:
            "Each coordinate is a distance from the origin along its axis. Multiplying both by 2 puts every image point twice as far from the centre.",
        },
        {
          move: "A′ = (2, 2), B′ = (6, 2) and C′ = (2, 4).",
          why:
            "Every vertex is doubled. The image sides are parallel to the object sides because the same factor is applied to both coordinates.",
        },
        {
          move:
            "The object's area is ½ × 2 × 1 = 1 square unit; the image's area is ½ × 4 × 2 = 4 square units.",
          why:
            "The base and height both double, so the area is multiplied by 2 × 2. A direct count of grid squares confirms the factor of 4.",
        },
        {
          move:
            "The length scale factor is 2 and the area scale factor is 2² = 4. The image is similar but not congruent.",
          why:
            "Enlargement preserves angles, so the shape is the same in form; it changes every length by k and every area by k².",
        },
        {
          move:
            "The image is A′(2, 2), B′(6, 2), C′(2, 4), with every length twice as long and the area 4 times as large.",
          why:
            "The final line names both factors. Saying “area doubles” would confuse the length factor with the area factor.",
        },
      ],
      answer: "A′(2, 2), B′(6, 2), C′(2, 4); area ×4",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A reflection in the x-axis changes the x-coordinate, because the mirror is horizontal.",
      whyItFails:
        "Reflection in the x-axis keeps each point's horizontal position and reverses its vertical distance from the axis: (x, y) → (x, −y). Changing the x-coordinate is a reflection in the y-axis. The axis named in the mirror line is the coordinate that stays the same, not the one that changes.",
      correction:
        "For a reflection in the x-axis, the image of (3, 4) is (3, −4). For a reflection in the y-axis, it is (−3, 4). Sketch the mirror line and check which coordinate is measured perpendicular to it.",
      contrast: {
        wrong: "Reflect (3, 4) in the x-axis → (−3, 4)",
        right: "Reflect (3, 4) in the x-axis → (3, −4)",
      },
    },
    {
      id: "m2",
      belief: "A rotation is fully described by its angle.",
      whyItFails:
        "The same angle about different centres produces different images. A 90° clockwise rotation about the origin and a 90° clockwise rotation about (5, 0) move the same triangle to different places. The direction also matters: clockwise and anticlockwise are different rotations unless the angle is 180°.",
      correction:
        "Give three facts: angle, direction and centre. Check the description by rotating one vertex and confirming that its distance from the centre is unchanged.",
      contrast: {
        wrong: "Rotate 90°",
        right: "Rotate 90° clockwise about the origin (0, 0)",
      },
    },
    {
      id: "m3",
      belief: "An enlargement by scale factor 2 doubles the area.",
      whyItFails:
        "An enlargement by factor k multiplies every length by k, so it multiplies area by k². A 3 cm by 2 cm rectangle has area 6 cm²; its image under k = 2 is 6 cm by 4 cm with area 24 cm², four times as large. Doubling the area would correspond to a length factor of √2, not 2.",
      correction:
        "Keep the length factor and the area factor separate: lengths ×k, area ×k². For k = 3, lengths ×3 and area ×9; for k = 1/2, lengths ×1/2 and area ×1/4.",
      contrast: {
        wrong: "k = 2, so the area doubles from 6 cm² to 12 cm²",
        right: "k = 2, so the area is 4 × 6 = 24 cm²",
      },
    },
    {
      id: "m4",
      belief: "A negative scale factor is impossible, or it gives the same image as the positive factor.",
      whyItFails:
        "A negative scale factor places the image on the opposite ray from the centre. With k = −1, (x, y) maps to (−x, −y): the image is the same size but turned through 180° about the centre. With k = −2, it is also twice as large. The area factor is k², which is positive, so the image is not “negative area”.",
      correction:
        "Plot the centre, the object point and the image point. For a negative factor they are collinear with the centre between the object and the image. A factor of −1 is a 180° rotation about the centre, not a reflection.",
      contrast: {
        wrong: "k = −1 gives the same image as k = 1",
        right: "k = −1 gives (−x, −y), a half-turn about the centre",
      },
    },
    {
      id: "m5",
      belief: "A translation changes the shape's size or turns it around.",
      whyItFails:
        "A translation only slides: every point moves by the same vector. Lengths, angles and orientation are unchanged, so the image is congruent and faces the same way. A size change indicates an enlargement; a turn indicates a rotation; a reversal indicates a reflection.",
      correction:
        "Compare one side and one angle before and after. If they are equal and the shape faces the same way, the move is a translation. Then check the vector by subtracting an object coordinate from its image coordinate.",
      contrast: {
        wrong: "The triangle got bigger, so it was translated",
        right: "The triangle kept its size and orientation, so it was translated; its vector is image − object",
      },
    },
    {
      id: "m6",
      belief: "Any sequence of two transformations is equivalent to one of the four basic transformations.",
      whyItFails:
        "A reflection followed by a translation parallel to the mirror line is a glide reflection, which is not a translation, reflection, rotation or enlargement. Even when a single equivalent exists, the order matters: a rotation then a translation generally differs from the translation then the rotation.",
      correction:
        "Test a candidate single rule on every vertex. If the coordinates do not match, keep the sequence as the answer. Do not force a sequence into a named transformation just because the final picture looks familiar.",
      contrast: {
        wrong: "Reflect then slide is just a translation",
        right: "Reflect in a line then slide along it is a glide reflection, not one of the four basic moves",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Translate the point (−2, 3) by the vector (5, −4).",
      hint: "Add the horizontal component to x and the vertical component to y.",
      answer: "(3, −1)",
      feedback: {
        correct:
          "(−2 + 5, 3 − 4) = (3, −1). The point moves 5 right and 4 down.",
        incorrect:
          "Add each component separately: x = −2 + 5 = 3 and y = 3 − 4 = −1. The image is (3, −1), not (7, −1) or (3, 7).",
      },
    },
    {
      id: "p2",
      prompt: "Reflect the point (4, −1) in the x-axis.",
      hint: "The x-axis is horizontal, so the x-coordinate stays and the y-coordinate changes sign.",
      answer: "(4, 1)",
      feedback: {
        correct:
          "(4, −1) → (4, 1). The point crosses the x-axis vertically and stays the same distance from it.",
        incorrect:
          "Reflection in the x-axis changes the sign of y only: (4, −1) → (4, 1). Changing x would be a reflection in the y-axis.",
      },
    },
    {
      id: "p3",
      prompt: "Rotate the point (2, 5) through 180° about the origin.",
      hint: "A half-turn about the origin changes the sign of both coordinates.",
      answer: "(−2, −5)",
      feedback: {
        correct:
          "(2, 5) → (−2, −5). The point ends on the opposite side of the origin, the same distance away.",
        incorrect:
          "For 180° about the origin, both coordinates change sign: (−2, −5). Changing only one sign would be a reflection, not a half-turn.",
      },
    },
    {
      id: "p4",
      prompt:
        "Enlarge the point (3, −2) by scale factor 3 from the origin. Give the image and the area factor.",
      hint: "Multiply both coordinates by 3; the area factor is the square of the length factor.",
      answer: "(9, −6); area ×9",
      feedback: {
        correct:
          "(3 × 3, −2 × 3) = (9, −6). Lengths are three times as long, so area is 3² = 9 times as large.",
        incorrect:
          "Multiply each coordinate by the scale factor: (9, −6). The area factor is 9, not 3, because area uses two dimensions.",
      },
    },
    {
      id: "p5",
      prompt: "Reflect the point (2, 5) in the line y = x.",
      hint: "Reflection in y = x swaps the coordinates.",
      answer: "(5, 2)",
      feedback: {
        correct:
          "(2, 5) → (5, 2). The point and its image are the same perpendicular distance from the diagonal line.",
        incorrect:
          "Swap the coordinates for y = x: (5, 2). Changing signs would be a reflection in y = −x, not y = x.",
      },
    },
    {
      id: "p6",
      prompt: "Rotate the point (3, 1) through 90° anticlockwise about the origin.",
      hint: "A 90° anticlockwise turn maps (x, y) to (−y, x).",
      answer: "(−1, 3)",
      feedback: {
        correct:
          "(−1, 3). The old y becomes the new negative x, and the old x becomes the new y.",
        incorrect:
          "Use (x, y) → (−y, x): (3, 1) → (−1, 3). The clockwise rule would give (1, −3), a different quarter turn.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Translate the point (1, −2) by the vector (−3, 5).",
      modelAnswer: "(−2, 3)",
      marking: [
        "Adds the horizontal component: 1 + (−3) = −2.",
        "Adds the vertical component: −2 + 5 = 3.",
      ],
      check: {
        accepted: ["(−2, 3)", "(-2, 3)", "−2, 3", "-2, 3"],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "Triangle ABC has vertices A(1, 1), B(3, 1) and C(1, 2). Its image has vertices A′(1, −1), B′(1, −3) and C′(2, −1). Describe fully the single transformation that maps ABC to A′B′C′. Explain how your description accounts for every vertex.",
      modelAnswer:
        "The transformation is a rotation of 90° clockwise about the origin (0, 0). The rule (x, y) → (y, −x) gives A(1, 1) → (1, −1), B(3, 1) → (1, −3) and C(1, 2) → (2, −1), which are exactly A′, B′ and C′. Lengths and angles are unchanged and the order of the vertices is still clockwise, so it is a rotation rather than a reflection. The distances from the origin are unchanged: A and A′ are both √2 from the origin.",
      marking: [
        "Names a rotation, not a reflection or translation.",
        "Gives the angle 90° and the direction clockwise.",
        "Gives the centre as the origin (0, 0).",
        "Applies the rule (x, y) → (y, −x) to all three vertices or otherwise verifies all three images.",
        "Explains that lengths and orientation are preserved, so the image is congruent.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A rectangle is 3 cm by 2 cm. It is enlarged by scale factor 3. Find the area of the image.",
      modelAnswer: "54 cm²",
      marking: [
        "Finds the original area: 3 × 2 = 6 cm².",
        "Uses the area factor k² = 9, not k = 3, to obtain 54 cm².",
      ],
      check: {
        accepted: ["54 cm²", "54 cm2", "54"],
      },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt: "Reflect the point (3, −4) in the line y = x.",
      modelAnswer: "(−4, 3)",
      marking: [
        "Swaps the coordinates for reflection in y = x.",
        "Obtains (−4, 3), keeping both signs correctly.",
      ],
      check: {
        accepted: ["(−4, 3)", "(-4, 3)", "−4, 3", "-4, 3"],
      },
    },
    {
      id: "a5",
      kind: "constructed-response",
      prompt:
        "A shape is enlarged by scale factor −1 about the origin. Describe the image and explain why this is not a reflection.",
      modelAnswer:
        "The rule is (x, y) → (−x, −y): every point moves to the opposite side of the origin, the same distance away. The image is the same size as the object, so the area factor is (−1)² = 1. The shape is rotated through 180° about the origin, so its orientation is preserved; a reflection would reverse the order of the vertices. A negative scale factor is therefore a half-turn combined with a scaling, not a mirror image.",
      marking: [
        "Gives the coordinate rule (x, y) → (−x, −y).",
        "States that the image is the same size and the area factor is 1.",
        "Identifies the half-turn about the origin.",
        "Distinguishes rotation, which preserves orientation, from reflection, which reverses it.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A rectangle 3 cm by 2 cm is enlarged by scale factor 2 about the origin, and its image is then enlarged by scale factor 3 about the origin. Find the single enlargement that maps the original rectangle to the final image, and the final area. Then a point (2, 3) is rotated 180° about the origin and reflected in the x-axis. Show that the result is the same as a reflection in the y-axis. Explain why the order of the two moves matters in general.",
      whyItTransfers:
        "The learner must compose two enlargements into one scale factor, distinguish the length factor from the area factor, track a point through two different transformations, and justify an equivalence by coordinates rather than by appearance. The final explanation tests whether the learner understands that transformations are functions applied in order.",
      answer:
        "The combined enlargement has scale factor 2 × 3 = 6 about the origin. The original area is 3 × 2 = 6 cm²; the final area is 6 × 6² = 216 cm². For the point: a 180° rotation about the origin maps (2, 3) to (−2, −3); reflection in the x-axis maps that to (−2, 3), which is the reflection of (2, 3) in the y-axis. The two-step sequence is therefore equivalent to that single reflection. In general the order matters: a rotation followed by a translation usually gives a different image from the translation followed by the rotation, because the translation moves the centre the second transformation acts about.",
      marking: [
        "Multiplies the scale factors to obtain 6, not adds them to obtain 5.",
        "Uses the area factor 6² = 36 and obtains 216 cm².",
        "Tracks (2, 3) through the half-turn to (−2, −3) and the reflection to (−2, 3).",
        "Recognises (−2, 3) as the reflection of (2, 3) in the y-axis.",
        "Explains that order matters because the second transformation acts on the image, including its centre.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Translate (2, −3) by the vector (−4, 1).",
      answer:
        "(2 − 4, −3 + 1) = (−2, −2). The point moves 4 left and 1 up.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Reflect (−3, 5) in the y-axis.",
      answer:
        "Reflection in the y-axis changes the sign of x: (−3, 5) → (3, 5). The y-coordinate stays the same.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Rotate (4, −2) through 90° clockwise about the origin.",
      answer:
        "Use (x, y) → (y, −x): (4, −2) → (−2, −4). The point is a quarter turn clockwise from its original position.",
      when: "week-later",
    },
    {
      id: "x4",
      prompt:
        "A shape of area 20 cm² is enlarged by scale factor 1/2. Find the image area.",
      answer:
        "The area factor is (1/2)² = 1/4, so the image area is 20 ÷ 4 = 5 cm². The lengths are halved, but the area is quartered.",
      when: "month-later",
    },
    {
      id: "x5",
      prompt: "Enlarge (−2, 3) by scale factor −1 about the origin.",
      answer:
        "(−2, 3) → (2, −3). A negative factor of −1 is a half-turn about the origin: both coordinates change sign, and the size is unchanged.",
      when: "month-later",
    },
  ],

  summary: [
    "A transformation is a rule applied to every point; the image is marked with primes, A → A′.",
    "Translation: add the same column vector to every vertex; lengths, angles and orientation are unchanged.",
    "Reflection: each point crosses the mirror line at the same perpendicular distance; points on the line are fixed and orientation is reversed.",
    "Rotation: give the angle, the direction and the centre. About the origin, 90° clockwise is (x, y) → (y, −x) and 180° is (x, y) → (−x, −y).",
    "Enlargement: give the centre and scale factor; lengths ×k, area ×k², angles unchanged. A negative k places the image on the opposite ray and turns it 180°.",
    "Translations, reflections and rotations produce congruent images; an enlargement produces a similar image unless |k| = 1.",
    "A complete description names every parameter: vector, mirror line, angle with direction and centre, or centre and scale factor.",
    "Check a proposed rule on all vertices, and check the invariants — size, angle and orientation — before accepting the description.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every transformation is described in words and coordinates: “A prime is at five, one”, “reflect in the line y equals x”, “rotate ninety degrees clockwise about the origin”. The rule is stated before the picture, so the diagram is not required to follow the reasoning.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each transformation has its own section and its own worked example. Coordinate pairs are written with the x-value first and the y-value second, consistently, and the direction words are kept beside the numbers rather than replaced by arrows.",
    },
    {
      need: "cognitive",
      alternative:
        "The lesson uses one description frame for each move: translation → vector; reflection → line; rotation → angle, direction, centre; enlargement → centre, factor. The invariant check is the same three questions every time: same size, same angles, same orientation?",
    },
    {
      need: "colour-vision",
      alternative:
        "Object and image are distinguished by prime labels and coordinates, not by colour. The mirror line is named by its equation, and the centre of rotation or enlargement is named by its coordinates.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no dragging, tracing or interactive rotation is required. A learner may use tracing paper or a sketch, but the coordinate rules provide a complete non-manipulative route.",
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
        "All teaching prose, examples, practice, assessment and the design-transfer task are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for translations, reflections, rotations and enlargements.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-12",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
