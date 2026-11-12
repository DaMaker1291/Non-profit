import type { AuthoredLesson } from "../../lesson-contract";

// A VECTOR IS A DISPLACEMENT, NOT A POSITION AND NOT A LENGTH.
//
// The errors in this topic cluster around three category mistakes: adding
// magnitudes instead of components, treating a vector as tied to one starting
// point, and calling any two arrows "parallel" without checking a common scale
// factor. The lesson therefore separates the displacement from the coordinates
// of its endpoints, makes the order of a subtraction visible, and tests
// parallelism by solving for one scalar rather than by comparing slopes.
// Vector proof is kept concrete: a midpoint result is first calculated from
// coordinates, then explained as half the corresponding side vector.
export const MATHS_VECTORS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "vectors",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry and measures: vector notation, addition and subtraction of vectors, scalar multiplication, parallel vectors and vector proof",
    level: "Key Stage 3 to GCSE Foundation and Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the transfer proof are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Represent a displacement as a column vector and distinguish a vector from the coordinates of a point.",
      evidence:
        "The learner writes the displacement from (1, 2) to (4, 0) as (3, −2), and explains why the same vector can be drawn starting at any point.",
    },
    {
      statement:
        "Add and subtract vectors component by component, including a journey with more than two legs.",
      evidence:
        "The learner combines (3, −2) and (−1, 4) to obtain (2, 2), and finds the reverse journey as (−2, −2).",
    },
    {
      statement:
        "Multiply a vector by a scalar and use a common scale factor to decide whether two vectors are parallel.",
      evidence:
        "The learner shows that (6, −9) and (−4, 6) are both scalar multiples of (2, −3), with factors 3 and −2, and states that they are parallel but not equal.",
    },
    {
      statement:
        "Use vector arithmetic to prove a simple geometric fact, including a midpoint result.",
      evidence:
        "The learner shows that the vector joining the midpoints of two sides of a triangle is half the third side vector, and therefore parallel to it.",
    },
    {
      statement:
        "Interpret a resultant and explain why adding magnitudes is not the same as adding vectors.",
      evidence:
        "The learner explains that two displacements of equal length can produce a zero resultant when they point in opposite directions, so their magnitudes alone do not determine the sum.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["coordinates"],
    check: [
      {
        id: "d1",
        question: "Plot the points A(1, 2) and B(4, 0).",
        answer:
          "A is 1 right and 2 up from the origin; B is 4 right and on the x-axis. The first coordinate is horizontal and the second is vertical.",
        targets: ["coordinates"],
      },
      {
        id: "d2",
        question: "How do you find the horizontal change from A(1, 2) to B(4, 0)?",
        answer:
          "Subtract the starting x-coordinate from the finishing x-coordinate: 4 − 1 = 3. The change is positive, so the movement is to the right.",
        targets: ["coordinates"],
      },
      {
        id: "d3",
        question: "How do you find the vertical change from A(1, 2) to B(4, 0)?",
        answer:
          "Subtract the starting y-coordinate from the finishing y-coordinate: 0 − 2 = −2. The change is negative, so the movement is downwards.",
        targets: ["coordinates"],
      },
      {
        id: "d4",
        question: "What is the midpoint of the segment joining (0, 0) and (4, 2)?",
        answer:
          "Average each coordinate: ((0 + 4)/2, (0 + 2)/2) = (2, 1). The midpoint is halfway along in both the horizontal and vertical directions.",
        targets: ["coordinates"],
      },
    ],
  },

  introduction: {
    hook:
      "A delivery drone starts at a depot, flies 3 km east and 2 km south, then 1 km west and 4 km north. Where does it end relative to the depot? The two legs can be replaced by one displacement: 3 − 1 = 2 km east and −2 + 4 = 2 km north. The drone's path is not the same as the straight-line displacement — it flew further — but the resultant is the single vector that has the same effect. That distinction between the journey and the resultant is the heart of vector arithmetic.",
    why:
      "Vectors describe anything with both size and direction: forces, velocities, displacements, electric fields and changes in computer graphics. They also give geometry an algebraic engine. Instead of measuring a diagram, you can show that two sides are parallel by showing that one vector is a scalar multiple of the other, or that a midpoint divides a side in half by calculating the midpoint vector. The same component rules work in two and three dimensions, which is why they appear again in mechanics, physics and machine learning.",
  },

  explanation: [
    {
      heading: "A vector is a displacement, not a point",
      paragraphs: [
        "A vector records a change: how far to move horizontally and how far to move vertically, with signs giving the direction. In column notation the top number is the horizontal component and the bottom number is the vertical component. The vector (3, −2) means 3 right and 2 down. Right and up are positive; left and down are negative.",
        "A point such as (3, −2) is a position. A vector such as (3, −2) is a displacement. The point is fixed to the origin; the vector can be drawn starting anywhere. The arrow from (1, 1) to (4, −1) and the arrow from (5, 5) to (8, 3) are different arrows in different places, but they represent the same vector (3, −2). Equal vectors have equal components, not equal starting points.",
        "This distinction matters when a question gives two points. The vector from A to B is found by subtracting A's coordinates from B's: AB = B − A. Reversing the order gives BA = A − B = −AB. The arrow's direction is part of the vector, so AB and BA are not the same vector even though they have the same length.",
      ],
    },
    {
      heading: "Adding vectors: place them tip to tail",
      paragraphs: [
        "To add two vectors, add their horizontal components and add their vertical components separately. If a = (3, −2) and b = (−1, 4), then a + b = (3 + (−1), −2 + 4) = (2, 2). Geometrically, draw a, then start b where a ends. The resultant runs from the start of a to the end of b.",
        "The order of addition does not matter: a + b = b + a. The parallelogram formed by the two vectors has the same diagonal either way. This is useful for forces and velocities, where two effects act at the same time rather than one after the other. The component calculation gives the same resultant as the tip-to-tail diagram.",
        "The zero vector (0, 0) represents no displacement. Adding it changes nothing. A journey that returns to its starting point has resultant zero, even though the distance travelled is not zero. Distance and displacement are different quantities: distance adds the lengths of the legs, while displacement adds the vectors.",
      ],
    },
    {
      heading: "Subtracting vectors: add the negative",
      paragraphs: [
        "Subtraction is addition of the opposite vector: a − b = a + (−b). The negative of a vector has both components' signs changed, so it points in exactly the opposite direction. If b = (4, 1), then −b = (−4, −1).",
        "The vector from A to B is B − A. For A(−2, 5) and B(4, 1), AB = (4 − (−2), 1 − 5) = (6, −4). Check by adding the vector to A: (−2 + 6, 5 − 4) = (4, 1) = B. The vector BA is A − B = (−6, 4), which is −AB. Both point along the same line but in opposite directions.",
        "A common error is to subtract the coordinates in the wrong order. The finishing point comes first in the subtraction. Writing the rule as “image minus object” or “end minus start” keeps the order fixed. A quick check is to add the result back to the starting point; it must recover the finishing point.",
      ],
    },
    {
      heading: "Scalar multiples: stretching, shrinking and reversing",
      paragraphs: [
        "Multiplying a vector by a scalar multiplies both components by that number. If a = (−2, 1), then 3a = (−6, 3) and −2a = (4, −2). A positive scalar greater than 1 stretches the vector; a positive scalar between 0 and 1 shrinks it; a negative scalar reverses its direction as well as changing its length.",
        "Two vectors are parallel exactly when one is a scalar multiple of the other. (6, −9) = 3(2, −3) and (−4, 6) = −2(2, −3), so both are parallel to (2, −3). They are not equal to each other: the first points the same way as (2, −3), the second points the opposite way. “Parallel” allows both directions; “same direction” requires a positive scalar.",
        "To test parallelism, try to find one number k with both components satisfying the same equation. For (4, −6) and (2, −3), the horizontal equation gives k = 2 and the vertical equation gives k = 2, so they are parallel. For (4, 6) and (2, −3), the horizontal equation gives k = 2 but the vertical equation gives k = −2; no single k works, so they are not parallel. Comparing only one component, or only the slopes without checking the signs, can miss the distinction.",
      ],
    },
    {
      heading: "Resultants and reverse journeys",
      paragraphs: [
        "A resultant is the single vector equivalent to a sequence of displacements. Add the legs in order. A drone that moves (3, −2), then (−1, 4), then (2, 1) has resultant (3 − 1 + 2, −2 + 4 + 1) = (4, 3). The resultant does not record the route; it records the net change.",
        "The reverse of a resultant is its negative. If the outward journey has resultant (4, 3), the return journey that ends at the start has vector (−4, −3). Adding them gives (0, 0). This is the vector form of “back to where you began”.",
        "Forces and velocities use the same rule. Two forces acting on an object have a resultant found by adding their vectors. If the resultant is zero, the forces are balanced. This is not the same as saying the forces have equal magnitudes: two forces of equal magnitude in opposite directions balance, but two forces of equal magnitude at right angles do not.",
      ],
    },
    {
      heading: "Vector proof: let the algebra do the geometry",
      paragraphs: [
        "Vector proof replaces measurement with calculation. To prove that two segments are parallel, express each as a vector and show that one is a scalar multiple of the other. To prove that two segments are equal, show that their vectors are equal. To prove that a point is a midpoint, show that the vector to it is half the whole side vector.",
        "A standard midpoint proof: in triangle OAB, let M be the midpoint of OA and N the midpoint of OB. Then OM = ½OA and ON = ½OB. The vector MN = ON − OM = ½OB − ½OA = ½(OB − OA) = ½AB. So MN is parallel to AB and half its length. The result does not depend on the particular triangle, because the calculation uses only the midpoint definitions and the distributive rule.",
        "A proof should name each vector and each rule. “It looks half as long” is not a proof. The chain MN = ON − OM = ½OB − ½OA = ½AB is a proof because each equality follows from a definition or a vector law. The same structure proves collinearity: points P, Q and R are collinear when PQ is a scalar multiple of PR and they share a point.",
      ],
    },
    {
      heading: "Checking a vector answer",
      paragraphs: [
        "Check the components separately. For an addition, the horizontal component of the result should equal the sum of the horizontal components, and likewise for the vertical. For a subtraction, add the result back to the vector being subtracted and recover the first vector. For a scalar multiple, divide each component by the scalar and recover the original.",
        "Check the geometry. A resultant should point roughly where the combined arrows point. A reverse vector should point the opposite way. A parallel pair should have components in the same ratio, including signs. If a calculation gives a vector that is much longer than either input in an addition, suspect that magnitudes were added instead of components.",
        "Check the notation. A vector may be written as a column, as a bold lowercase letter, or with an arrow above it. A point is written with parentheses and is not a vector. The vector from A to B is AB with an arrow, not AB as a distance. Keeping the notation straight prevents the common mistake of treating a displacement as a position.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A column vector records a horizontal change and a vertical change. The same vector can start at any point.",
      notation:
        "(3, −2) means 3 right and 2 down   ·   from A(1, 2) to B(4, 0): AB = (3, −2)",
      caption:
        "The top component is horizontal and the bottom is vertical. Equal vectors have equal components, regardless of where they are drawn.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Add vectors component by component. Tip to tail, the resultant runs from the start of the first to the end of the second.",
      notation:
        "a = (3, −2), b = (−1, 4)   ·   a + b = (3 + (−1), −2 + 4) = (2, 2)",
      caption:
        "Addition is commutative: a + b = b + a. The two orders trace different sides of the same parallelogram and share the same diagonal.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Subtract by adding the negative. The vector from A to B is B − A, not A − B.",
      notation:
        "A(−2, 5), B(4, 1)   ·   AB = B − A = (6, −4)   ·   BA = −AB = (−6, 4)",
      caption:
        "Add AB back to A to check: (−2 + 6, 5 − 4) = (4, 1) = B. Reversing the arrow changes both signs.",
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "A scalar multiple stretches or reverses a vector. Two vectors are parallel when one is a scalar multiple of the other.",
      notation:
        "3(−2, 1) = (−6, 3)   ·   −2(4, −3) = (−8, 6)   ·   (6, −9) = 3(2, −3)",
      caption:
        "A positive scalar keeps the direction; a negative scalar reverses it. Both are still parallel to the original vector.",
    },
    {
      id: "r5",
      kind: "maths.expression",
      body:
        "A resultant replaces a sequence of displacements. The reverse journey is its negative.",
      notation:
        "A(1, 2) → B(5, 1) by (4, −1) → C(3, 4) by (−2, 3)   ·   AC = (4, −1) + (−2, 3) = (2, 2)",
      caption:
        "The route A → B → C and the single displacement A → C have the same start and end. The reverse C → A is (−2, −2).",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Add the vectors a = (3, −2) and b = (−1, 4). Draw the tip-to-tail journey and state the resultant.",
      steps: [
        {
          move:
            "Add the horizontal components: 3 + (−1) = 2. The resultant moves 2 units right.",
          why:
            "The horizontal changes combine independently of the vertical changes. A rightward move and a leftward move partly cancel.",
        },
        {
          move:
            "Add the vertical components: −2 + 4 = 2. The resultant moves 2 units up.",
          why:
            "A downward move and an upward move combine on the vertical axis. The signs carry the directions.",
        },
        {
          move:
            "The resultant is a + b = (2, 2). Tip to tail, start at any point, draw a, then draw b from the end of a; the resultant joins the start to the final point.",
          why:
            "The column calculation and the diagram agree because both add the same two component changes. The resultant is one vector with the same net effect as the two legs.",
        },
        {
          move:
            "Check by adding in the other order: b + a = (−1 + 3, 4 + (−2)) = (2, 2). The same result confirms commutativity.",
          why:
            "Vector addition forms a parallelogram; both orders trace two sides and share the same diagonal. A different result would signal a component error.",
        },
      ],
      answer: "a + b = (2, 2)",
    },
    {
      id: "w2",
      prompt:
        "A(−2, 5) and B(4, 1) are two points. Find the vector AB and the vector BA.",
      steps: [
        {
          move:
            "Use AB = B − A. Subtract the starting coordinates from the finishing coordinates: (4 − (−2), 1 − 5).",
          why:
            "The vector records the change from A to B, so B is the end and A is the start. Reversing this order would give the opposite arrow.",
        },
        {
          move:
            "Simplify the components: 4 − (−2) = 6 and 1 − 5 = −4. So AB = (6, −4).",
          why:
            "Subtracting a negative is addition: the horizontal change is 6 units right. The vertical change is 4 units down.",
        },
        {
          move:
            "For BA, reverse the subtraction: A − B = (−2 − 4, 5 − 1) = (−6, 4).",
          why:
            "BA is the same journey in the opposite direction. Every component changes sign, so BA = −AB.",
        },
        {
          move:
            "Check AB by adding it to A: (−2 + 6, 5 + (−4)) = (4, 1) = B. The vector AB = (6, −4) and BA = (−6, 4).",
          why:
            "Adding a displacement to its starting point must recover the finishing point. This catches a sign error that a plausible-looking arrow might hide.",
        },
      ],
      answer: "AB = (6, −4) and BA = (−6, 4)",
    },
    {
      id: "w3",
      prompt:
        "Let a = (−2, 1) and b = (4, −3). Find 3a and −2b, and state whether 3a and −2b are parallel.",
      steps: [
        {
          move:
            "Multiply each component of a by 3: 3a = (3 × (−2), 3 × 1) = (−6, 3).",
          why:
            "A scalar multiplies both components. Multiplying only the first would change the direction of the vector, not just its length.",
        },
        {
          move:
            "Multiply each component of b by −2: −2b = (−2 × 4, −2 × (−3)) = (−8, 6).",
          why:
            "The negative scalar reverses the direction; the factor 2 doubles the length. Both components must receive the same factor.",
        },
        {
          move:
            "Test for one common scalar: divide the matching components. For 3a = (−6, 3), the vertical-to-horizontal ratio is 3 ÷ (−6) = −1/2. For −2b = (−8, 6), it is 6 ÷ (−8) = −3/4.",
          why:
            "Parallel vectors must have proportional components. Dividing one component by the other is a quick ratio test, provided neither horizontal component is zero.",
        },
        {
          move:
            "The ratios −1/2 and −3/4 are different, so 3a = (−6, 3) and −2b = (−8, 6) are not parallel. They both point up and to the left, but at different slopes.",
          why:
            "A shared general direction is not enough: the components must share the same scale factor. Checking only the signs, or only one component, would wrongly call these parallel.",
        },
      ],
      answer: "3a = (−6, 3), −2b = (−8, 6); they are not parallel",
    },
    {
      id: "w4",
      prompt:
        "A point moves from A(1, 2) to B(5, 1) by the vector (4, −1), then from B to C(3, 4) by (−2, 3). Find the resultant AC and the reverse vector CA.",
      steps: [
        {
          move:
            "Add the two legs component by component: (4 + (−2), −1 + 3) = (2, 2).",
          why:
            "The resultant is the single displacement with the same net effect as the two-leg journey. The intermediate point B does not appear in the resultant.",
        },
        {
          move:
            "Check by subtracting the endpoints: C − A = (3 − 1, 4 − 2) = (2, 2).",
          why:
            "The direct vector from the start to the finish must equal the sum of the legs. Both routes agree, so the resultant is correct.",
        },
        {
          move:
            "Reverse the resultant: CA = −AC = (−2, −2).",
          why:
            "The return journey must undo the outward displacement. Adding AC and CA gives (0, 0), the zero vector.",
        },
        {
          move:
            "The resultant is AC = (2, 2) and the reverse is CA = (−2, −2). The drone ends 2 units right and 2 units up from its start.",
          why:
            "The result records net displacement, not total distance. The two legs could be long while the resultant is short, or even zero if the journey returns to its start.",
        },
      ],
      answer: "AC = (2, 2), CA = (−2, −2)",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "To add vectors, add their lengths and keep the direction of the larger one.",
      whyItFails:
        "Vectors have direction as well as size, so their components must be added. Two displacements of length 5 can produce a resultant anywhere from 0 to 10 depending on their directions. Adding lengths ignores the angle between them and can give a result that no actual journey produces.",
      correction:
        "Add the horizontal components and the vertical components separately. For (3, 4) and (4, −3), the resultant is (7, 1), not a vector of length 5 + 5 = 10. Sketch the tip-to-tail diagram to see the difference.",
      contrast: {
        wrong: "(3, 4) + (4, −3) has length 5 + 5 = 10",
        right: "(3, 4) + (4, −3) = (7, 1), whose length is √50, not 10",
      },
    },
    {
      id: "m2",
      belief: "The vector from A to B is A − B.",
      whyItFails:
        "The vector from A to B records the change needed to get from A to B, so it is B − A. Using A − B gives the arrow from B to A. The two vectors have the same length but opposite directions, so the sign error reverses the journey.",
      correction:
        "Use “end minus start”. For A(1, 2) and B(4, 0), AB = (4 − 1, 0 − 2) = (3, −2). Check by adding AB to A: (1 + 3, 2 − 2) = (4, 0) = B.",
      contrast: {
        wrong: "AB = A − B = (1 − 4, 2 − 0) = (−3, 2)",
        right: "AB = B − A = (4 − 1, 0 − 2) = (3, −2)",
      },
    },
    {
      id: "m3",
      belief: "Multiplying a vector by a scalar means multiplying only the top component.",
      whyItFails:
        "A scalar changes the whole displacement, both horizontally and vertically. Multiplying only one component changes the direction of the vector rather than stretching it along the same line. For example, 3(2, 1) is (6, 3), not (6, 1).",
      correction:
        "Multiply every component by the scalar. To check, divide each component of the result by the scalar and recover the original vector. If one component does not return, the multiplication was incomplete.",
      contrast: {
        wrong: "3(2, 1) = (6, 1)",
        right: "3(2, 1) = (6, 3)",
      },
    },
    {
      id: "m4",
      belief: "Parallel vectors must point in the same direction.",
      whyItFails:
        "Parallel lines never meet, and that includes lines that run in opposite directions. A vector and its negative are parallel because one is a scalar multiple of the other with a negative factor. They point in opposite directions but lie along the same line.",
      correction:
        "Test for a single scalar k. If b = ka, the vectors are parallel. If k > 0 they point the same way; if k < 0 they point in opposite directions. Both cases count as parallel.",
      contrast: {
        wrong: "(2, 3) and (−4, −6) are not parallel because they point opposite ways",
        right: "(2, 3) and (−4, −6) are parallel: (−4, −6) = −2(2, 3)",
      },
    },
    {
      id: "m5",
      belief: "A vector's coordinates depend on where the arrow starts.",
      whyItFails:
        "A vector records a displacement, not a location. The arrow from (1, 1) to (4, −1) and the arrow from (5, 5) to (8, 3) both have components (3, −2). They are the same vector drawn in different places. Only the endpoints' coordinates differ.",
      correction:
        "Calculate the vector as end minus start. If two arrows have the same component differences, they represent the same vector. Translating an arrow without rotating or stretching it does not change the vector.",
      contrast: {
        wrong: "The vector from (1, 1) to (4, −1) is (1, 1) because that is where it starts",
        right: "The vector is (4 − 1, −1 − 1) = (3, −2), wherever it is drawn",
      },
    },
    {
      id: "m6",
      belief: "If two vectors have proportional components, they must be equal.",
      whyItFails:
        "Proportional components show parallelism, not equality. (1, 1) and (2, 2) have the same direction but different lengths; they are scalar multiples, not the same vector. Equality requires both components to match exactly.",
      correction:
        "Check equality component by component. If the components differ but share a common ratio, describe the vectors as parallel and give the scale factor. Only a scale factor of 1 makes them equal.",
      contrast: {
        wrong: "(1, 1) and (2, 2) are equal because they point the same way",
        right: "(2, 2) = 2(1, 1): parallel, but not equal",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Add the vectors (3, −2) and (1, 4).",
      hint: "Add the horizontal components, then add the vertical components.",
      answer: "(4, 2)",
      feedback: {
        correct:
          "(3 + 1, −2 + 4) = (4, 2). The resultant moves 4 right and 2 up.",
        incorrect:
          "Keep the components separate: x = 3 + 1 = 4 and y = −2 + 4 = 2. The answer is (4, 2), not (4, −6) or (3, 4).",
      },
    },
    {
      id: "p2",
      prompt: "Subtract (4, 1) from (−2, 5).",
      hint: "Subtract component by component: (−2 − 4, 5 − 1).",
      answer: "(−6, 4)",
      feedback: {
        correct:
          "(−2 − 4, 5 − 1) = (−6, 4). This is the vector from (4, 1) to (−2, 5).",
        incorrect:
          "Subtract the second vector from the first: x = −2 − 4 = −6 and y = 5 − 1 = 4. Reversing the order would give (6, −4), the opposite arrow.",
      },
    },
    {
      id: "p3",
      prompt: "Multiply the vector (2, −1) by the scalar 3.",
      hint: "Multiply both components by 3.",
      answer: "(6, −3)",
      feedback: {
        correct:
          "3(2, −1) = (6, −3). The vector is three times as long and points the same way.",
        incorrect:
          "Both components are multiplied: (3 × 2, 3 × (−1)) = (6, −3). Multiplying only the first gives (6, −1), which changes the direction.",
      },
    },
    {
      id: "p4",
      prompt:
        "Find the scalar k such that (4, −6) = k(2, −3). What does this tell you about the two vectors?",
      hint: "Divide either component of (4, −6) by the matching component of (2, −3), then check the other component.",
      answer: "k = 2; the vectors are parallel and point the same way",
      feedback: {
        correct:
          "4 ÷ 2 = 2 and −6 ÷ (−3) = 2, so k = 2. The vectors are parallel and (4, −6) is twice as long as (2, −3).",
        incorrect:
          "The same k must work in both components: 4/2 = 2 and −6/(−3) = 2. Since both give 2, the vectors are parallel, with (4, −6) twice as long.",
      },
    },
    {
      id: "p5",
      prompt:
        "A point moves by (2, −3), then by (−1, 4). Find the resultant and the vector that reverses the whole journey.",
      hint: "Add the legs for the resultant; change both signs for the reverse.",
      answer: "resultant (1, 1); reverse (−1, −1)",
      feedback: {
        correct:
          "(2 − 1, −3 + 4) = (1, 1). The reverse journey is (−1, −1), which returns to the start.",
        incorrect:
          "Add component by component: (2 + (−1), −3 + 4) = (1, 1). The reverse is the negative of the resultant, (−1, −1), not the negative of one leg.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Add the vectors (−2, 3) and (5, −4).",
      modelAnswer: "(3, −1)",
      marking: [
        "Adds the horizontal components: −2 + 5 = 3.",
        "Adds the vertical components: 3 + (−4) = −1.",
      ],
      check: {
        accepted: ["(3, −1)", "(3,-1)", "3, −1", "3, -1"],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A hiker walks 3 km east and 1 km south, then 1 km west and 4 km north. Find the resultant displacement and explain why it is not found by adding the distances walked.",
      modelAnswer:
        "The first leg is (3, −1) and the second is (−1, 4). Their resultant is (3 + (−1), −1 + 4) = (2, 3), so the hiker ends 2 km east and 3 km north of the start. The distances walked are 3 + 1 = 4 km and 1 + 4 = 5 km, a total of 9 km, but distance is a scalar and adds without direction. The displacement adds the component changes, so the northward and southward parts partially cancel. The resultant is not the sum of the distances; it is the single vector from the start to the finish.",
      marking: [
        "Writes the legs as vectors (3, −1) and (−1, 4).",
        "Adds the horizontal components to obtain 2.",
        "Adds the vertical components to obtain 3.",
        "States the resultant (2, 3) with its direction (2 km east, 3 km north).",
        "Distinguishes distance travelled (a scalar total of 9 km) from displacement (the resultant vector).",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Multiply the vector (3, −2) by the scalar 2.",
      modelAnswer: "(6, −4)",
      marking: [
        "Multiplies the horizontal component: 2 × 3 = 6.",
        "Multiplies the vertical component: 2 × (−2) = −4.",
      ],
      check: {
        accepted: ["(6, −4)", "(6,-4)", "6, −4", "6, -4"],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "Are the vectors (6, −9) and (−4, 6) parallel? Justify your answer by finding scalar multiples of a common vector, and state whether they point in the same direction.",
      modelAnswer:
        "Both vectors are multiples of (2, −3): (6, −9) = 3(2, −3) and (−4, 6) = −2(2, −3). Since each is a scalar multiple of the same vector, they are parallel. The scale factors 3 and −2 have opposite signs, so the vectors point in opposite directions. They are parallel but not equal, and their lengths are in the ratio 3 : 2.",
      marking: [
        "Finds a common direction vector, such as (2, −3).",
        "Shows (6, −9) = 3(2, −3).",
        "Shows (−4, 6) = −2(2, −3).",
        "Concludes that they are parallel because both are scalar multiples of the same vector.",
        "Distinguishes the opposite signs, so the vectors point in opposite directions rather than the same direction.",
      ],
    },
    {
      id: "a5",
      kind: "short-answer",
      prompt:
        "Find the vector from A(2, 3) to B(5, −2).",
      modelAnswer: "(3, −5)",
      marking: [
        "Subtracts the starting coordinates from the finishing coordinates: 5 − 2 = 3.",
        "Subtracts the vertical coordinates: −2 − 3 = −5.",
      ],
      check: {
        accepted: ["(3, −5)", "(3,-5)", "3, −5", "3, -5"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "In triangle OAB, O is the origin, A is (4, 2) and B is (2, 6). M is the midpoint of OA and N is the midpoint of OB. Find MN and AB, show that MN is parallel to AB and half its length, and explain why the result holds for any triangle, not only this one.",
      whyItTransfers:
        "The learner must calculate midpoints, form a vector between them, compare it with a side vector, and then move from a numerical example to a general argument. The final explanation tests whether the learner can use the distributive law with vectors rather than merely notice a pattern in one diagram.",
      answer:
        "M = ((0 + 4)/2, (0 + 2)/2) = (2, 1) and N = ((0 + 2)/2, (0 + 6)/2) = (1, 3). So MN = N − M = (1 − 2, 3 − 1) = (−1, 2). Also AB = B − A = (2 − 4, 6 − 2) = (−2, 4). Therefore MN = ½AB: the midpoint vector is half the side vector, so MN is parallel to AB and half as long. For any triangle, OM = ½OA and ON = ½OB, so MN = ON − OM = ½OB − ½OA = ½(OB − OA) = ½AB. The calculation uses only the midpoint definitions and the distributive rule, so it does not depend on the particular coordinates.",
      marking: [
        "Calculates M = (2, 1) and N = (1, 3).",
        "Forms MN = (−1, 2) by subtracting M from N.",
        "Forms AB = (−2, 4) by subtracting A from B.",
        "Shows MN = ½AB, not merely that the components look related.",
        "Concludes that MN is parallel to AB and half its length.",
        "Generalises using OM = ½OA and ON = ½OB to obtain MN = ½AB for any triangle.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Add (1, 2) and (−3, 5).",
      answer:
        "(1 + (−3), 2 + 5) = (−2, 7). The resultant moves 2 left and 7 up.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Subtract (2, −3) from (−4, 1).",
      answer:
        "(−4 − 2, 1 − (−3)) = (−6, 4). This is the vector from (2, −3) to (−4, 1).",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Multiply (3, −1) by −2.",
      answer:
        "−2(3, −1) = (−6, 2). The vector is twice as long and points in the opposite direction.",
      when: "week-later",
    },
    {
      id: "x4",
      prompt: "Find k such that (8, −4) = k(2, −1).",
      answer:
        "8 ÷ 2 = 4 and −4 ÷ (−1) = 4, so k = 4. The vectors are parallel and (8, −4) is four times as long.",
      when: "month-later",
    },
    {
      id: "x5",
      prompt:
        "A journey has legs (2, −1), (−1, 3) and (3, −2). Find the resultant and the reverse vector.",
      answer:
        "The resultant is (2 − 1 + 3, −1 + 3 − 2) = (4, 0). The reverse is (−4, 0), which returns to the start.",
      when: "month-later",
    },
  ],

  summary: [
    "A vector is a displacement with a horizontal component and a vertical component; it is not a point and not a length.",
    "The vector from A to B is B − A. Reversing the arrow changes both signs: BA = −AB.",
    "Add vectors component by component; tip to tail, the resultant runs from the start of the first to the end of the last.",
    "Subtract by adding the negative vector. A resultant of (0, 0) means the journey returns to its start, not that no distance was travelled.",
    "Multiplying by a scalar multiplies both components. A positive scalar keeps the direction; a negative scalar reverses it.",
    "Two vectors are parallel exactly when one is a scalar multiple of the other; the sign of the scalar distinguishes the same direction from the opposite direction.",
    "Vector proof replaces measurement with algebra: show a common scalar multiple for parallel lines, equal vectors for equal segments, or half a side vector for a midpoint.",
    "Check component sums, add a displacement back to its start, and test parallelism with one scalar in both components.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every vector is read as an ordered pair with its directions: “the vector three, negative two: three right, two down”. The rule is stated in words before it is used, so the column layout is not the only carrier of meaning.",
    },
    {
      need: "dyslexia",
      alternative:
        "Horizontal and vertical components are kept in the same order in every example. Direction words sit beside the signs, and subtraction is described as “end minus start” rather than relying on arrow notation alone.",
    },
    {
      need: "cognitive",
      alternative:
        "Each operation has one worked pattern: add components; subtract end minus start; multiply both components; test parallelism with one scalar. The same check — add the result back, or substitute into both components — is repeated.",
    },
    {
      need: "colour-vision",
      alternative:
        "Vectors are distinguished by labels and component values, not by colour. The tip-to-tail diagram is described in words, and the resultant is named by its endpoints.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no dragging of arrows is required. A learner may sketch the journey, but the component calculation provides a complete non-manipulative route.",
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
        "All teaching prose, examples, practice, assessment and the midpoint transfer proof are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for vector notation, vector arithmetic and vector proof.",
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
