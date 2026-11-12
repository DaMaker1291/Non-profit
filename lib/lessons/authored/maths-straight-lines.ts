import type { AuthoredLesson } from "../../lesson-contract";

// A LINE IS A CONSTANT RATE WITH A STARTING VALUE.
//
// y = mx + c is often learned as a pair of letters to label on a graph. The
// lesson begins with a fare, because a fare is a number you can explain: a fixed
// charge to begin and a price for each unit travelled. The graph is then a record
// of that situation, not a separate topic. Gradient is rise over run and is
// computed from two points; the intercept is the value at x = 0. The lesson keeps
// those two questions separate because a line's steepness and its starting height
// are independent facts, and reading c as the x-intercept is the commonest way to
// collapse them.
//
// The lesson also treats the gradient as a rate that leaves mathematics. The same
// division appears in speed, cost per item and any quantity that changes by a
// fixed amount per unit. That is why the final task is a comparison of two
// tariffs rather than another sketch.
export const MATHS_STRAIGHT_LINES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "straight-lines",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra and graphs: straight-line graphs, gradient, intercept, equations of lines, parallel and perpendicular lines, and rates of change",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the tariff comparison are original. No specification text or examination question is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Find the gradient of a line from its equation or from two points, and explain what the gradient measures.",
      evidence:
        "The learner finds the gradient through (2, 5) and (6, 13) as 2, shows the division of the change in y by the change in x, and states that y rises two units for every one unit across.",
    },
    {
      statement:
        "Identify the gradient and y-intercept from y = mx + c, and distinguish the y-intercept from the x-intercept.",
      evidence:
        "For y = 3x − 4 the learner states that the gradient is 3 and the line crosses the vertical axis at −4, and solves 3x − 4 = 0 to find that it crosses the horizontal axis at 4/3.",
    },
    {
      statement:
        "Find the equation of a straight line through two points or through one point with a given gradient.",
      evidence:
        "The learner finds the equation through (1, 3) and (4, 9) as y = 2x + 1, and checks that both points satisfy the equation.",
    },
    {
      statement:
        "Recognise parallel and perpendicular gradients and use them to solve a simple geometric or modelling problem.",
      evidence:
        "The learner states that a line perpendicular to y = 2x + 1 has gradient −1/2, and uses two cost equations to find where one tariff becomes cheaper.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["coordinates", "linear-equations"],
    check: [
      {
        id: "d1",
        question: "On a coordinate grid, what does the point (4, −2) mean?",
        answer:
          "It means four units to the right of the origin and two units down. The first coordinate is horizontal and the second is vertical, and the negative sign places the point below the horizontal axis.",
        targets: ["coordinates"],
      },
      {
        id: "d2",
        question: "Solve 3x − 5 = 10, showing the inverse operations.",
        answer:
          "Add 5 to both sides to get 3x = 15, then divide both sides by 3 to get x = 5. Each step keeps the equation balanced.",
        targets: ["linear-equations"],
      },
      {
        id: "d3",
        question: "What is the difference between the x-axis and the y-axis?",
        answer:
          "The x-axis is the horizontal number line where y = 0. The y-axis is the vertical number line where x = 0. A point on the x-axis has a y-coordinate of zero, while a point on the y-axis has an x-coordinate of zero.",
        targets: ["coordinates"],
      },
    ],
  },

  introduction: {
    hook:
      "A taxi charges £3 to start the journey and £2 for each kilometre. The fare for d kilometres is 3 + 2d. For 1 km it is £5, for 2 km £7, for 3 km £9, and those points lie on a straight line. The £3 is where the line starts when d = 0; the £2 is how much the fare climbs for each extra kilometre. Every straight-line equation carries those two pieces of information, even when the situation is not a taxi.",
    why:
      "A graph is a compact record of a relationship, and the equation is the rule that produced it. Learners who only plot points can describe what a line looks like but cannot answer why it crosses the axis where it does or how two lines meet. Separating the gradient from the intercept gives a line two independent dials: one changes its steepness, the other lifts or lowers it without tilting it. That separation is used whenever a rate is compared, a cost is modelled or a graph in science is interpreted.",
  },

  explanation: [
    {
      heading: "The gradient is a rate, not a slant to describe by eye",
      paragraphs: [
        "The gradient measures how much the vertical coordinate changes when the horizontal coordinate increases by one. It is calculated as the change in y divided by the change in x, often called rise over run. Through the points (2, 5) and (6, 13), the change in y is 13 − 5 = 8 and the change in x is 6 − 2 = 4, so the gradient is 8 ÷ 4 = 2. The line rises two units for every one unit it moves right.",
        "The order of subtraction matters. Using the first point first in both differences gives the same result as using the second point first in both; reversing only one difference changes the sign. The gradient is negative when the line falls from left to right, zero when it is horizontal, and undefined when it is vertical because the run is zero. A vertical line is not a function of x and cannot be written in the form y = mx + c.",
        "Because the gradient is a rate, its units come from the axes. A distance–time graph with distance in metres and time in seconds has a gradient in metres per second. A cost–quantity graph has a gradient in pounds per item. Reading the gradient as a number without its units hides what the line actually claims about the situation.",
      ],
    },
    {
      heading: "The intercept says where the line starts, not where it crosses the other axis",
      paragraphs: [
        "In y = mx + c, the value c is the y-coordinate when x = 0, so the line crosses the vertical axis at (0, c). For y = 3x − 4, the line crosses the vertical axis at −4. The horizontal crossing is a different question: it is where y = 0, so solve 3x − 4 = 0 to get x = 4/3. The two intercepts are usually different numbers, and calling both of them c is a reliable source of error.",
        "The value m is the gradient, and it is the coefficient of x because each increase of one in x adds one more copy of m to y. If m is positive the line climbs; if m is negative it falls. Changing c moves the whole line up or down without changing its steepness, while changing m tilts the line about its intercept. Two lines with the same m are parallel because they rise at the same rate and never meet.",
        "A horizontal line has equation y = c, which is the same as y = 0x + c. Its gradient is zero because the vertical coordinate does not change. A vertical line has equation x = a; it has no gradient in the y = mx + c sense, and its slope is described as undefined rather than as infinite. Keeping those two special cases separate prevents a formula from being applied where it does not exist.",
      ],
    },
    {
      heading: "Two points determine the line, and one point plus a gradient does too",
      paragraphs: [
        "If two points are known, the gradient is found first and then substituted into y = mx + c using either point. For (1, 3) and (4, 9), the gradient is (9 − 3) ÷ (4 − 1) = 2. Substituting x = 1 and y = 3 into y = 2x + c gives 3 = 2 + c, so c = 1. The equation is y = 2x + 1, and checking the other point gives 2 × 4 + 1 = 9.",
        "If one point and the gradient are known, only the intercept remains unknown. A line with gradient −3 through (2, 7) satisfies 7 = −3 × 2 + c, so c = 13 and the equation is y = −3x + 13. The same substitution works whichever point is chosen; if the two points give different values of c, the gradient was calculated incorrectly.",
        "Parallel lines share the same gradient because they rise at the same rate. Perpendicular lines have gradients whose product is −1, so a line perpendicular to y = 2x + 1 has gradient −1/2. The negative sign turns the climb into a fall, and the reciprocal makes the angle turn by a right angle rather than merely becoming less steep. This relationship is a fact about the geometry, not a convention to memorise separately.",
      ],
    },
    {
      heading: "A graph is a comparison you can read",
      paragraphs: [
        "Two straight lines can be compared by their equations. If one tariff is 5 + 0.2d and another is 2 + 0.5d, the first has a higher starting charge but a lower rate per kilometre. Setting the expressions equal gives 5 + 0.2d = 2 + 0.5d, so 3 = 0.3d and d = 10. At 10 km the tariffs are equal; below 10 km the second is cheaper, and above 10 km the first is cheaper. The intersection point is the answer to a real question, not just a coordinate.",
        "The same reading applies to scientific graphs. A distance–time graph's gradient is speed, and a flat section means the object is stationary. A velocity–time graph's gradient is acceleration, and the area under it is displacement. The straight-line equation is the bridge between the picture and the quantities, which is why the gradient and intercept must be read with their units and their meaning.",
        "A graph can mislead if its axes are not read carefully. A line that looks steep may have a small gradient if the vertical scale is compressed, and a line that looks flat may have a large gradient if the horizontal scale is stretched. The numbers on the axes are part of the evidence. The equation is independent of the drawing, so it is the more reliable description when the two disagree.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The equation names the starting value and the rate. The coefficient of x is the gradient, and the constant is the value at x = 0.",
      notation: "y = 2x + 1   ·   gradient 2   ·   y-intercept 1   ·   through (0, 1)",
      caption:
        "The line rises two units for every one unit across and crosses the vertical axis at 1. The horizontal crossing is found separately by solving 2x + 1 = 0, which gives x = −1/2.",
    },
    {
      id: "r2",
      kind: "maths.graph",
      body:
        "The rise/run triangle is the definition of gradient drawn on the line. The vertical leg is the change in y and the horizontal leg is the change in x.",
      notation: "points (1, 3) and (4, 9)   ·   rise 6   ·   run 3   ·   gradient 6 ÷ 3 = 2",
      caption:
        "The triangle does not change the line; it makes the division visible. A line that climbs six units over three has the same gradient as one that climbs two over one.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A perpendicular gradient is the negative reciprocal. The product of the two gradients is −1, which is the algebraic signature of a right angle.",
      notation: "y = 2x + 1   ·   perpendicular gradient = −1/2   ·   2 × (−1/2) = −1",
      caption:
        "The perpendicular line falls half a unit for every unit across. Its negative sign and reciprocal size are both necessary; changing only one of them does not produce a right angle.",
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "Two lines meet where their y-values are equal. Solving that equation gives the x-coordinate of the intersection, and either original equation gives the y-coordinate.",
      notation: "5 + 0.2d = 2 + 0.5d   →   3 = 0.3d   →   d = 10",
      caption:
        "At 10 km both tariffs charge the same amount. The equation of each line is a claim about cost, and the intersection is the distance at which the claims agree.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Find the equation of the straight line through the points (1, 3) and (4, 9).",
      steps: [
        {
          move: "Find the gradient: (9 − 3) ÷ (4 − 1) = 6 ÷ 3 = 2.",
          why:
            "The gradient is the change in y divided by the change in x, using the points in the same order in both differences.",
        },
        {
          move: "Substitute the gradient and one point into y = 2x + c. Using (1, 3): 3 = 2 × 1 + c, so c = 1.",
          why:
            "The point lies on the line, so its coordinates must satisfy the equation. Substituting them leaves only the intercept unknown.",
        },
        {
          move: "Write the equation y = 2x + 1 and check the other point: 2 × 4 + 1 = 9.",
          why:
            "The second point was not used to find c, so it is an independent check that the equation describes the same line.",
        },
      ],
      answer: "y = 2x + 1",
    },
    {
      id: "w2",
      prompt:
        "For the line y = −3x + 12, state the gradient and both intercepts, and describe where the line crosses each axis.",
      steps: [
        {
          move: "Read the gradient from the coefficient of x: the gradient is −3.",
          why:
            "In y = mx + c the number multiplying x is the gradient, including its negative sign, which means the line falls from left to right.",
        },
        {
          move: "The y-intercept is 12, so the line crosses the vertical axis at (0, 12).",
          why:
            "The constant is the value of y when x is zero, which is exactly the vertical-axis crossing.",
        },
        {
          move: "Solve −3x + 12 = 0 to find the x-intercept: −3x = −12, so x = 4, and the line crosses the horizontal axis at (4, 0).",
          why:
            "The horizontal crossing is where y is zero, so the equation must be solved rather than read from the constant.",
        },
      ],
      answer: "gradient −3; y-intercept (0, 12); x-intercept (4, 0)",
    },
    {
      id: "w3",
      prompt:
        "A phone contract costs £12 per month plus £0.10 per gigabyte. A second costs £20 per month with no data charge. Find the equation for each total monthly cost for g gigabytes and determine when the first is cheaper.",
      steps: [
        {
          move: "Write the first cost as 12 + 0.10g and the second as 20.",
          why:
            "The fixed monthly charge is the intercept and the per-gigabyte charge is the gradient; the second contract has zero gradient because its cost does not change with data.",
        },
        {
          move: "Set the expressions equal: 12 + 0.10g = 20, so 0.10g = 8 and g = 80.",
          why:
            "The equality gives the usage at which the two total costs are the same, which is the boundary between one being cheaper and the other being cheaper.",
        },
        {
          move: "Test a value below 80, such as 50: the first costs 17 and the second 20, so the first is cheaper below 80 gigabytes. Above 80 the first is more expensive.",
          why:
            "The comparison either side of the intersection confirms the direction; testing only the intersection does not say which side is cheaper.",
        },
      ],
      answer: "First: 12 + 0.10g; second: 20; the first is cheaper for g < 80 gigabytes.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The gradient is run divided by rise.",
      whyItFails:
        "Reversing the division inverts every gradient, so a steep line is reported as shallow. A line through (0, 0) and (2, 6) rises six for a run of two, so its gradient is 3. Run divided by rise gives 1/3, which would describe a much shallower line. The vertical change must be on top because gradient measures change in y per unit change in x.",
      correction:
        "Write rise over run, then substitute the two differences. Check with one step: moving one unit right should change y by the gradient, so a line that climbs six over two climbs three over one.",
      contrast: {
        wrong: "the gradient through (0, 0) and (2, 6) is 2 ÷ 6 = 1/3",
        right: "the gradient through (0, 0) and (2, 6) is 6 ÷ 2 = 3",
      },
    },
    {
      id: "m2",
      belief: "The number c in y = mx + c is the x-intercept.",
      whyItFails:
        "The constant c is the value of y when x = 0, so it is the vertical-axis crossing. For y = 2x + 4, the line crosses the vertical axis at 4, not the horizontal axis. The horizontal crossing is where y = 0, which solves to x = −2. Confusing the two puts the intercept on the wrong axis and changes every sketch.",
      correction:
        "Substitute x = 0 to find the y-intercept, and substitute y = 0 to find the x-intercept. The two questions produce different equations and usually different numbers.",
      contrast: {
        wrong: "y = 2x + 4 crosses the horizontal axis at 4",
        right: "y = 2x + 4 crosses the vertical axis at 4 and the horizontal axis at −2",
      },
    },
    {
      id: "m3",
      belief: "A perpendicular line has the reciprocal gradient, without changing the sign.",
      whyItFails:
        "A reciprocal alone keeps the line climbing when it should fall, so the angle is not a right angle. The gradients of perpendicular lines multiply to −1, which requires both the reciprocal and the sign change. A line perpendicular to y = 3x has gradient −1/3, not 1/3.",
      correction:
        "Flip the gradient and change its sign, then check the product: 3 × (−1/3) = −1. If the product is not −1, the lines are not perpendicular.",
      contrast: {
        wrong: "a line perpendicular to y = 3x has gradient 1/3",
        right: "a line perpendicular to y = 3x has gradient −1/3, because 3 × (−1/3) = −1",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Find the gradient of the line through (2, 1) and (5, 10).",
      hint: "Subtract the y-coordinates and the x-coordinates in the same order, then divide the change in y by the change in x.",
      answer: "3, because (10 − 1) ÷ (5 − 2) = 9 ÷ 3 = 3.",
      feedback: {
        correct:
          "The vertical change is 9 and the horizontal change is 3, so the line rises three units for every one unit across.",
        incorrect:
          "The change in y is 10 − 1 = 9, not 5 − 2 = 3. Divide 9 by 3 to get the gradient 3; reversing the division would give 1/3.",
      },
    },
    {
      id: "p2",
      prompt: "State the gradient and y-intercept of y = −4x + 7.",
      hint: "Compare the equation with y = mx + c. The sign belongs to the coefficient of x.",
      answer: "gradient −4; y-intercept 7",
      feedback: {
        correct:
          "The coefficient of x is −4, so the line falls four units for each unit across, and the constant 7 is the value at x = 0.",
        incorrect:
          "The gradient is the whole coefficient −4, not 4. The y-intercept is the constant 7, which is the value when x = 0.",
      },
    },
    {
      id: "p3",
      prompt: "Find the equation of the line with gradient 3 that passes through (2, 11).",
      hint: "Substitute x = 2 and y = 11 into y = 3x + c, then solve for c.",
      answer: "y = 3x + 5",
      feedback: {
        correct:
          "11 = 3 × 2 + c gives c = 5, and checking the point gives 3 × 2 + 5 = 11.",
        incorrect:
          "The point must satisfy the equation: 11 = 6 + c, so c = 5. The equation is y = 3x + 5, not y = 3x + 11.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Find the gradient of the line through (−1, 4) and (3, 12).",
      modelAnswer: "2",
      marking: [
        "Subtracts the coordinates in a consistent order: 12 − 4 = 8 and 3 − (−1) = 4.",
        "Divides the change in y by the change in x to obtain 2.",
      ],
      check: { accepted: ["2", "2/1"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A line has equation y = 4x − 8. A learner says its x-intercept is −8. Explain why this is wrong, find the correct x-intercept, and state the y-intercept.",
      modelAnswer:
        "The constant −8 is the y-intercept because it is the value of y when x = 0, so the line crosses the vertical axis at (0, −8). The x-intercept is where y = 0, so solve 4x − 8 = 0: 4x = 8 and x = 2. The line crosses the horizontal axis at (2, 0). The learner has read the constant as the wrong intercept; the two intercepts answer different questions and are usually different points.",
      marking: [
        "Identifies −8 as the y-intercept and explains that it is the value at x = 0.",
        "Solves 4x − 8 = 0 correctly to obtain x = 2.",
        "States both intercepts as coordinates or clearly distinguishes the axes.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "A line is parallel to y = −2x + 5 and passes through (1, 1). Find its equation.",
      modelAnswer: "y = −2x + 3",
      marking: [
        "Uses the same gradient −2 because parallel lines share a gradient.",
        "Substitutes (1, 1) to find the intercept 3 and checks the point.",
      ],
      check: { accepted: ["y = −2x + 3", "y=-2x+3", "y = -2x + 3"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A cyclist's distance from home after t hours is modelled by d = 18t + 5. A second cyclist starts 20 km from home and rides towards home at 12 km per hour, so their distance is d = 20 − 12t. Find when they meet and where, and explain what the gradients mean in the situation.",
      whyItTransfers:
        "The learner must interpret two equations as journeys, recognise that one gradient is positive and the other negative, solve for the intersection, and then translate the coordinates back into time and distance. The algebra is the same comparison of two lines, but the signs and the physical meaning require a decision that a sketch alone does not supply.",
      answer:
        "Set 18t + 5 = 20 − 12t. Then 30t = 15, so t = 0.5 hours, or 30 minutes. Substitute to find d = 18 × 0.5 + 5 = 14 km from home. The first cyclist's gradient +18 means distance from home increases by 18 km each hour. The second gradient −12 means distance from home decreases by 12 km each hour, because the cyclist is riding towards home. The gradients have opposite signs because the distances are changing in opposite directions.",
      marking: [
        "Sets the two distance expressions equal and solves for t.",
        "Substitutes the time back into either equation to obtain the meeting distance.",
        "Explains the positive gradient as moving away and the negative gradient as moving towards home, with units of km per hour.",
        "States the meeting time as 0.5 hours or 30 minutes and the distance as 14 km.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "State the gradient and y-intercept of y = 5x − 2.",
      answer: "gradient 5; y-intercept −2, at the point (0, −2).",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Find the gradient of the line through (0, 4) and (3, 10).",
      answer: "2, because (10 − 4) ÷ (3 − 0) = 6 ÷ 3 = 2.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What is the gradient of a line perpendicular to y = −1/2 x + 7?",
      answer: "2. The negative reciprocal of −1/2 is 2, and their product is −1.",
      when: "month-later",
    },
  ],

  summary: [
    "A straight line is a starting value plus a constant rate: y = mx + c, where m is the gradient and c is the y-intercept.",
    "Gradient is the change in y divided by the change in x; it is a rate and carries the units of the axes.",
    "The y-intercept is the value at x = 0; the x-intercept is found by solving y = 0 and is usually a different point.",
    "Two points determine a line: find the gradient first, then substitute one point to find the intercept.",
    "Parallel lines share a gradient; perpendicular gradients multiply to −1; an intersection is where two equations give the same y.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every line is described by its equation, its gradient and both intercepts in words, so the graph is not the only source of the relationship.",
    },
    {
      need: "low-vision",
      alternative:
        "The rise and run are stated as numerical differences before the division, and the equation is set in the same large text as the prose rather than as a small image.",
    },
    {
      need: "colour-vision",
      alternative:
        "The two lines in a comparison are distinguished by their equations and labels as well as by any visual style, so the cheaper tariff can be identified without relying on colour.",
    },
    {
      need: "motor",
      alternative:
        "The learner types gradients and equations; no dragging of points or drawing of lines is required.",
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
        "All teaching prose, examples, practice, assessments and the two-cyclist transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for straight-line graphs.",
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