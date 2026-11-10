import type { AuthoredLesson } from "../../lesson-contract";

// THE PAIR IS AN ADDRESS, NOT TWO NUMBERS THAT HAPPEN TO SIT TOGETHER.
//
// The reported failure is not "cannot plot a point". It is that (2, 5) and
// (5, 2) are treated as the same place, that a zero is read as "on the axis it
// names", and that an equation is treated as a label for a picture rather than
// a rule every point on the line must satisfy. This lesson makes the pair a
// journey — along, then up — makes substitution the test of membership, and
// makes "which coordinate is fixed?" the question that tells a horizontal line
// from a vertical one. The plan beside it already draws y = 2x + 1; this lesson
// teaches what that drawing means and how to check a point against it.
export const MATHS_COORDINATES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "coordinates",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra and graphs: coordinates in all four quadrants, straight-line graphs, and the intersection of two lines",
    level: "Key Stage 3 to GCSE Foundation",
    note:
      "Scope cited against the published GCSE mathematics subject content. No specification, textbook or commercial lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Plot and read an ordered pair in any of the four quadrants, including negative coordinates, and explain why the order of the two numbers is part of the address.",
      evidence:
        "The learner places (3, -2) three right and two down, distinguishes it from (-3, 2) and from (2, 3), names the quadrant, and says that a coordinate of zero means no movement along that axis.",
    },
    {
      statement:
        "Use an equation as a rule: build a table of values, plot the points, join them, and decide by substitution whether a given point lies on the line.",
      evidence:
        "For y = 2x + 1 the learner produces the pairs (-1, -1), (0, 1), (1, 3) and (2, 5), and rejects (2, 4) because 2(2) + 1 = 5 rather than 4.",
    },
    {
      statement:
        "Distinguish a horizontal line from a vertical one by asking which coordinate its equation fixes, and read where two lines meet.",
      evidence:
        "The learner describes y = 3 as horizontal at height 3 and x = -2 as vertical at -2, gives their intersection as (-2, 3), and explains that the crossing is the pair satisfying both equations.",
    },
  ],

  priorKnowledge: {
    // The genome declares `negatives` as the only prerequisite. Both checks
    // probe it in the form this lesson actually uses: a move along an axis, and
    // a substitution that multiplies a negative.
    conceptIds: ["negatives"],
    check: [
      {
        id: "d1",
        question: "Work out -3 + 5.",
        answer:
          "2. Start three places left of zero and move five places right; the result is two places right of zero. Plotting a negative coordinate is the same move along an axis.",
        targets: ["negatives"],
      },
      {
        id: "d2",
        question: "Work out 2 × (-3) + 1.",
        answer:
          "-5. Doubling three to the left gives six to the left, and adding one moves one place back towards zero. This is exactly how a negative x is substituted into y = 2x + 1.",
        targets: ["negatives"],
      },
    ],
  },

  introduction: {
    hook:
      "A city is laid out on a grid with the railway station at the centre. A friend texts 'meet me at (3, 2)'. Three blocks east and two north is a café; two blocks east and three north is the canal. The same two numbers, written in a different order, name two different places. Coordinates are an address, and the order is the part of the address that says which street you turn onto first.",
    why:
      "A grid turns a pair of numbers into a place, and an equation into a set of places. That is why graphs are useful: the picture is not decoration, it is every pair that obeys a rule. Three questions make every later graph readable. Which number is horizontal and which is vertical? What does a zero coordinate mean? Which quantity does the equation fix? A learner who can answer those three can plot a point, test whether it lies on a line, tell a horizontal line from a vertical one, and read where two lines cross — which is the same as solving two equations at once.",
  },

  explanation: [
    {
      heading: "A pair is a journey: along first, then up",
      paragraphs: [
        "The first number in (x, y) is the horizontal coordinate and the second is the vertical one. From the origin (0, 0), (3, -2) means move three places right and two places down. The order follows the alphabet — x before y — and it follows the way a map reference is spoken: easting before northing, along the corridor before up the stairs. The two axes divide the plane into four quadrants. In the top-right both coordinates are positive; in the top-left x is negative and y positive; in the bottom-left both are negative; in the bottom-right x is positive and y negative.",
        "A zero coordinate is information, not a missing number. (0, 3) means no horizontal movement at all, so the point sits on the vertical axis, three up. (4, 0) means no vertical movement, so it sits on the horizontal axis, four right. That is why the axes themselves are the lines x = 0 and y = 0. Swapping the two numbers reflects the point in the line y = x: (2, 5) is two right and five up, while (5, 2) is five right and two up. They are different places unless the two numbers happen to be equal, and every gradient or distance read from the wrong one will be wrong with it.",
      ],
    },
    {
      heading: "An equation is a rule for which points belong",
      paragraphs: [
        "y = 2x + 1 does not name a picture; it states a relationship. Choose an x, double it, add one, and the result is the y that belongs with it. Choosing x = -1, 0, 1 and 2 gives y = -1, 1, 3 and 5, so the pairs (-1, -1), (0, 1), (1, 3) and (2, 5) all satisfy the rule. Plotting those pairs and joining them gives a straight line, and the straightness is a fact about the rule: each step of 1 in x adds a constant 2 to y. A curve drawn through points from a linear rule is evidence of an arithmetic slip in the table, not a discovery about the rule.",
        "A point lies on the line exactly when its two coordinates satisfy the equation. To test (2, 4), substitute x = 2: 2(2) + 1 = 5, and the point's y is 4, so (2, 4) is not on the line; it sits one unit below (2, 5). The test is not optional, because a graph read by eye can be one square out, and because a table can contain a slip that the picture then faithfully draws. The intercept is the point where x = 0: here (0, 1). The place where the line crosses the horizontal axis is where y = 0, which needs solving 2x + 1 = 0 rather than reading the table.",
      ],
    },
    {
      heading: "Horizontal and vertical lines fix one coordinate",
      paragraphs: [
        "A line whose equation contains only y fixes the height. Every point on y = 3 has y = 3, whatever its x, so (0, 3), (2, 3) and (-1, 3) are all on it and the line runs horizontally. A line whose equation contains only x fixes the horizontal position: every point on x = -2 has x = -2, so (-2, 0), (-2, 3) and (-2, -1) are on it and the line runs vertically. The equation's letter tells you which coordinate is pinned, and the pinned coordinate decides the direction: pinned y means horizontal, pinned x means vertical.",
        "This is also why y = 0 is the horizontal axis and x = 0 is the vertical axis rather than two more lines to memorise. The axes are the lines where one coordinate is always zero. A line such as y = 2x passes through the origin because substituting x = 0 gives y = 0; a line such as y = 2x + 1 does not, because its intercept is 1. Reading an intercept off a graph is a substitution in disguise, and checking it that way protects against a mislabelled or unevenly scaled axis.",
      ],
    },
    {
      heading: "A crossing is a pair that satisfies both rules",
      paragraphs: [
        "Where two lines cross, the same point lies on both, so its coordinates satisfy both equations at once. If y = x + 3 and y = 2x + 1 meet, then at the crossing x + 3 = 2x + 1, which gives x = 2 and then y = 5. The point (2, 5) satisfies the first rule (5 = 2 + 3) and the second (5 = 2(2) + 1). That is what solving a pair of simultaneous equations means, and the graph is a picture of the answer rather than a different method.",
        "A graph is only as honest as its axes. If the horizontal and vertical scales differ, a line with gradient 1 can look steeper than a line with gradient 2, so angles read off the picture are not trustworthy; coordinates read against the labels still are. Always name the axes and check the scale before describing a shape. The arithmetic test — substitute and compare — is what settles a claim about a point, a line or a crossing, and it works whatever the picture appears to show.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A pair is a journey from the origin. The first number moves horizontally, the second vertically, and the signs say which way.",
      notation:
        "(3, -2) = 3 right, 2 down   ·   (-3, 2) = 3 left, 2 up   ·   (0, -4) = no horizontal move, 4 down",
      caption:
        "Swapping the numbers swaps the journey: (3, -2) is bottom-right and (-3, 2) is top-left. A zero means no movement along that axis, which is why (0, -4) sits on the vertical axis rather than in a quadrant.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "An equation gives one y for each x. A table turns the rule into points, and a point belongs only when its pair satisfies the rule.",
      notation:
        "y = 2x + 1   ·   x = -1, 0, 1, 2   ·   y = -1, 1, 3, 5   ·   test (2, 4): 2(2) + 1 = 5, not 4",
      caption:
        "The point (2, 5) is on the line because the rule produces 5 from x = 2; (2, 4) is one unit below it and fails the same test. The intercept (0, 1) is the row of the table where x = 0.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A line whose equation contains only y fixes the height, so it is horizontal. A line whose equation contains only x fixes the horizontal position, so it is vertical.",
      notation:
        "y = 3: (0, 3), (2, 3), (-1, 3)   ·   x = -2: (-2, 0), (-2, 3), (-2, -1)   ·   intersection (-2, 3)",
      caption:
        "Every point on y = 3 has height 3 whatever its x, which makes a horizontal line; every point on x = -2 has x = -2 whatever its height. They meet once, at (-2, 3), the one pair that satisfies both.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Plot A(3, -2), B(-3, 2) and C(0, -4) on one grid. Describe the journey to each and name where it lies.",
      steps: [
        {
          move: "For A(3, -2), move 3 right from the origin and then 2 down. A is in the bottom-right quadrant.",
          why:
            "The first number is horizontal and the second vertical. The negative sign on the 2 sends the vertical move downwards, not leftwards.",
        },
        {
          move: "For B(-3, 2), move 3 left and then 2 up. B is in the top-left quadrant.",
          why:
            "The negative sign belongs to the x coordinate, so it reverses the horizontal move only. B is not the same place as A with the signs changed.",
        },
        {
          move: "For C(0, -4), make no horizontal move and go 4 down. C lies on the vertical axis, not in a quadrant.",
          why:
            "A zero coordinate means the point never leaves that axis. C is on the y-axis because x = 0; it would be on the x-axis only if its y were 0.",
        },
        {
          move: "Check the order: A is (3, -2), not (-2, 3). Reading the pair backwards would put A in the top-left, where B is.",
          why:
            "Reversing the pair is not a small notational slip; it moves the point to a different quadrant. Saying the journey aloud — 'three right, two down' — is the check.",
        },
      ],
      answer:
        "A is 3 right and 2 down (bottom-right); B is 3 left and 2 up (top-left); C is 4 down on the vertical axis.",
    },
    {
      id: "w2",
      prompt:
        "Complete a table for y = 2x - 1 for x = -1, 0, 1 and 2, plot the points and join them. Then decide whether (3, 4) lies on the line.",
      steps: [
        {
          move: "Substitute each x: 2(-1) - 1 = -3; 2(0) - 1 = -1; 2(1) - 1 = 1; 2(2) - 1 = 3.",
          why:
            "The table is the rule applied four times. Handling the negative x first is what keeps the first row correct: doubling -1 gives -2, not +2.",
        },
        {
          move: "The pairs are (-1, -3), (0, -1), (1, 1) and (2, 3). Plot them and join with a straight line.",
          why:
            "Each pair is (x, y) in that order. The points are collinear because each step of 1 in x adds a constant 2 to y; a wobble would mean a row of the table is wrong.",
        },
        {
          move: "The line crosses the vertical axis at (0, -1), which is the value of y when x = 0.",
          why:
            "The intercept is a table entry rather than a separate fact. Reading it off the equation and off the table should give the same point.",
        },
        {
          move: "Test (3, 4): substitute x = 3 into the rule, giving 2(3) - 1 = 5. The point's y is 4, so (3, 4) is not on the line; (3, 5) is.",
          why:
            "A point belongs only when both coordinates satisfy the equation. Substitution is the test because a graph read by eye can easily be one square out.",
        },
      ],
      answer:
        "Table: -3, -1, 1, 3 for x = -1, 0, 1, 2; intercept (0, -1); (3, 4) is not on the line because the rule gives 5 at x = 3.",
    },
    {
      id: "w3",
      prompt:
        "On one grid, describe the lines y = 3 and x = -2, and give the point where they meet.",
      steps: [
        {
          move: "y = 3 fixes the height at 3. Points such as (0, 3), (2, 3) and (-1, 3) all satisfy it, so the line is horizontal.",
          why:
            "The equation contains only y, so x is free to be anything. A free horizontal coordinate with a fixed height produces a left-to-right line.",
        },
        {
          move: "x = -2 fixes the horizontal position at -2. Points such as (-2, 0), (-2, 3) and (-2, -1) all satisfy it, so the line is vertical.",
          why:
            "Here y is free and x is pinned. The letter in the equation is the coordinate that cannot change, and that is what decides the direction.",
        },
        {
          move: "The crossing must satisfy both: its x is -2 and its y is 3, so it is (-2, 3).",
          why:
            "A point on both lines must obey both equations at once. Reading the crossing off the picture and checking it by substitution is the same answer reached two ways.",
        },
      ],
      answer: "y = 3 is horizontal at height 3; x = -2 is vertical at -2; they meet at (-2, 3).",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "(2, 5) and (5, 2) name the same point, because both use the numbers 2 and 5.",
      whyItFails:
        "The order is the address. (2, 5) is two right and five up; (5, 2) is five right and two up. Swapping the pair reflects the point in the line y = x, so the two points are different places unless the numbers are equal. Every later read of a gradient or an intersection inherits the error.",
      correction:
        "Say the journey aloud before plotting — 'two right, five up' — and write x before y every time. On a map, use easting before northing. If a point looks wrong, check its order first, before checking the arithmetic.",
      contrast: {
        wrong: "(2, 5) and (5, 2) are the same place",
        right: "(2, 5) is 2 right and 5 up; (5, 2) is 5 right and 2 up",
      },
    },
    {
      id: "m2",
      belief: "(0, 3) lies on the x-axis, because the first coordinate is 0.",
      whyItFails:
        "A zero x means no horizontal movement, so the point never leaves the vertical axis; it is 3 up, on the y-axis. The x-axis is the set of points with y = 0, such as (4, 0), not the set of points with x = 0.",
      correction:
        "Ask which coordinate is fixed at zero, then name the other axis: x = 0 is the vertical axis, y = 0 is the horizontal axis. Plot the point and look at which axis it sits on rather than reasoning from the number's position in the pair.",
      contrast: {
        wrong: "(0, 3) is on the x-axis",
        right: "(0, 3) is on the y-axis; (3, 0) is on the x-axis",
      },
    },
    {
      id: "m3",
      belief: "y = 3 is a vertical line, because the equation starts with y.",
      whyItFails:
        "The equation fixes y, which is the height, for every point; x is free. A fixed height with a free horizontal position draws a horizontal line. x = 3 does the opposite: it fixes the horizontal position, so that line is vertical.",
      correction:
        "Pick two points that satisfy the equation. If they share a y and differ in x, the line is horizontal; if they share an x and differ in y, it is vertical. The letter present is the coordinate pinned, and the pinned coordinate decides the direction.",
      contrast: {
        wrong: "y = 3 is vertical",
        right: "y = 3 is horizontal at height 3; x = 3 is vertical at 3",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A point is 4 places left and 3 places down from the origin. Write its coordinates and name the quadrant it lies in.",
      hint:
        "Left is the negative horizontal direction and down is the negative vertical direction. Write the horizontal move first.",
      answer:
        "The point is (-4, -3). Both coordinates are negative, so it lies in the bottom-left quadrant, the third quadrant.",
      feedback: {
        correct:
          "You kept the horizontal move first and gave both negatives their direction, rather than treating the signs as decoration.",
        incorrect:
          "Left makes the x negative and down makes the y negative, so the pair is (-4, -3) in that order. Writing (-3, -4) would be 3 left and 4 down, a different point.",
      },
    },
    {
      id: "p2",
      prompt:
        "Complete a table for y = 3x - 2 for x = 0, 1 and 2. Then decide whether (2, 5) lies on the line.",
      hint:
        "Substitute each x into the rule. For the last part, compare the y the rule produces with the y in the pair, not just the x.",
      answer:
        "The table is y = -2, 1 and 4 for x = 0, 1 and 2. At x = 2 the rule gives 3(2) - 2 = 4, but the point has y = 5, so (2, 5) is not on the line; (2, 4) is.",
      feedback: {
        correct:
          "You used the rule to generate the table and used it again to test the point, which is the same operation in two directions.",
        incorrect:
          "The rule gives 4 when x = 2, not 5, so (2, 5) is one unit above the line. A point is on the line only when the rule produces its y from its x.",
      },
    },
    {
      id: "p3",
      prompt: "Describe the lines y = -1 and x = 4, and give the point where they meet.",
      hint:
        "Ask which coordinate each equation fixes. A fixed y gives a horizontal line; a fixed x gives a vertical line.",
      answer:
        "y = -1 is horizontal at height -1; x = 4 is vertical at 4. They meet at (4, -1), the one pair whose x is 4 and whose y is -1.",
      feedback: {
        correct:
          "You named the direction from the coordinate each equation fixes, then combined the two fixed values to find the crossing.",
        incorrect:
          "y = -1 fixes the height, so it is horizontal; x = 4 fixes the horizontal position, so it is vertical. The crossing is (4, -1), not (-1, 4).",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A point P is 2 places left and 5 places up from the origin. Write P's coordinates and name its quadrant. Explain why (2, 5) is a different point, correct a learner who says (0, 3) lies on the x-axis, and decide by substitution whether (4, 7) lies on y = 2x - 1.",
      modelAnswer:
        "P is (-2, 5), in the top-left quadrant. (2, 5) is 2 right and 5 up, while (-2, 5) is 2 left and 5 up; the sign of the x coordinate moves the point across the vertical axis, so they are different places. (0, 3) has no horizontal movement, so it lies on the y-axis, three up; a point on the x-axis has y = 0, such as (3, 0). For (4, 7): substituting x = 4 into y = 2x - 1 gives 2(4) - 1 = 7, which equals the point's y, so (4, 7) does lie on the line. The substitution checks both coordinates at once; reading it off a graph could be one square out.",
      marking: [
        "Writes P as (-2, 5) and names the top-left, second quadrant.",
        "Explains that the sign of the x coordinate, not merely the size, distinguishes (2, 5) from (-2, 5).",
        "Corrects (0, 3) to the y-axis and gives an example of a point on the x-axis with y = 0.",
        "Substitutes x = 4 into the rule, obtains 7, and concludes that (4, 7) is on the line.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Write the coordinates of the point 3 places right and 4 places down from the origin.",
      modelAnswer: "(3, -4)",
      marking: [
        "Writes the horizontal move first: 3.",
        "Uses a negative for the downward move: -4, giving (3, -4).",
      ],
      check: { accepted: ["(3, -4)", "(3,-4)", "3, -4", "3,-4"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Where does the line x = -2 cross the x-axis? Give the coordinates of the crossing.",
      modelAnswer: "(-2, 0)",
      marking: [
        "Uses x = -2 for the vertical line.",
        "Sets y = 0 on the x-axis, giving (-2, 0).",
      ],
      check: { accepted: ["(-2, 0)", "(-2,0)", "-2, 0", "-2,0"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A walking app shows two straight paths across a park: path A is y = x + 3 and path B is y = 2x + 1. Two checkpoints are marked at (-2, 1) and (2, 5). Show that both checkpoints lie on path A, decide which one also lies on path B, and find where the paths cross without drawing them. Explain what the crossing means, and why comparing the steepness of the two paths from a picture could mislead.",
      whyItTransfers:
        "The lesson plots a table, tests one point against one rule, and reads one crossing. Here the learner must test two points against two rules, use the shared point as the crossing, solve the pair algebraically without a grid, and then reason about what a shared solution means and what a distorted scale can and cannot show. The arithmetic is familiar; the decision about which facts are being compared is new.",
      answer:
        "For path A, (-2, 1) gives -2 + 3 = 1 and (2, 5) gives 2 + 3 = 5, so both checkpoints lie on it. For path B, (-2, 1) gives 2(-2) + 1 = -3, not 1, so it is not on B; (2, 5) gives 2(2) + 1 = 5, so it is. The crossing is the point satisfying both rules: x + 3 = 2x + 1, so x = 2 and then y = 5, which is (2, 5), the checkpoint both paths share. That crossing is the solution of the pair of equations: it is the one pair of values that makes both statements true at once. Comparing steepness by eye is unreliable when the axes have different scales, because equal steps on the two axes are then different distances on the page; coordinates read against the labels remain correct, but the apparent angle does not.",
      marking: [
        "Substitutes both checkpoints into y = x + 3 and shows that both satisfy it.",
        "Tests both checkpoints in y = 2x + 1 and identifies (2, 5) as the one on both paths.",
        "Solves x + 3 = 2x + 1 to obtain x = 2, then y = 5, and names (2, 5) as the crossing.",
        "Explains that the crossing is the pair satisfying both equations, and that unequal axis scales make visual steepness an unreliable comparison.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Write the coordinates of the point 5 places left and 2 places up from the origin.",
      answer: "(-5, 2): the horizontal move is negative and comes first, the vertical move is positive and comes second.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Decide whether (3, 8) lies on the line y = 3x - 1, showing the substitution.",
      answer:
        "Substituting x = 3 gives 3(3) - 1 = 8, which equals the point's y, so (3, 8) is on the line.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Describe the lines y = -2 and x = 4, and give the point where they meet.",
      answer:
        "y = -2 fixes the height, so it is horizontal at -2; x = 4 fixes the horizontal position, so it is vertical at 4. They meet at (4, -2).",
      when: "month-later",
    },
  ],

  summary: [
    "A pair is (x, y): move horizontally first, then vertically. The order is the address, and swapping the numbers moves the point.",
    "A zero coordinate means no movement along that axis: x = 0 is the vertical axis, y = 0 is the horizontal axis.",
    "An equation is a rule for which points belong. Build a table to plot the line; substitute to decide whether a given point is on it.",
    "A fixed y gives a horizontal line; a fixed x gives a vertical line. The pinned coordinate decides the direction.",
    "Where two lines cross, the coordinates satisfy both equations at once — that is what solving them simultaneously means.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every point is described as a direction and a distance in words as well as a pair of numbers, and every table is written as a list of (x, y) pairs in order, so no answer depends on seeing the grid.",
    },
    {
      need: "low-vision",
      alternative:
        "Coordinates and equations are set in the reading text at the learner's chosen size. The drawing in the plan is described by its caption, and this lesson's answers name the point in words as well as symbols.",
    },
    {
      need: "dyslexia",
      alternative:
        "The horizontal move is always stated before the vertical one, and the rule is applied in four short numbered steps rather than a dense table, so a reader can track one operation at a time.",
    },
    {
      need: "colour-vision",
      alternative:
        "Quadrants and lines are named by their coordinates and by direction words — top-left, horizontal at height 3 — never by colour. Nothing in the lesson asks the learner to distinguish lines by hue.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers are typed. No dragging points, drawing lines or clicking a grid is required to demonstrate the method.",
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
        "All explanations, examples, practice, assessments and the two-path park transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for algebra and graphs.",
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
