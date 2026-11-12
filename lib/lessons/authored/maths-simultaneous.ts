import type { AuthoredLesson } from "../../lesson-contract";

// TWO UNKNOWNS NEED TWO INDEPENDENT FACTS.
//
// The lesson starts with a pair of conditions that must be true at the same
// time, because a single equation such as x + y = 10 has infinitely many
// solutions. Elimination is taught as a way of making one unknown disappear by
// combining the equations, not as a sequence of signs to copy. Substitution is
// taught as the same idea when one equation already names one unknown in terms of
// the other. The graphical meaning is kept visible: each equation is a line, and
// the solution is their intersection. That picture also explains the two special
// cases — parallel lines with no intersection and coincident lines with every
// point in common — which a purely algebraic method can otherwise present as
// arithmetic accidents.
export const MATHS_SIMULTANEOUS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "simultaneous",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra: simultaneous linear equations, elimination, substitution and graphical interpretation",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the ticket-price transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain why one linear equation with two unknowns does not determine a single pair of values.",
      evidence:
        "The learner states that x + y = 10 has infinitely many pairs, gives at least two examples, and explains that a second independent equation is needed to fix one pair.",
    },
    {
      statement:
        "Solve a pair of simultaneous equations by elimination, including when a multiplier is needed first.",
      evidence:
        "The learner solves 2x + 3y = 12 and 4x − 3y = 6 by adding to eliminate y, obtains x = 3 and y = 2, and checks both original equations.",
    },
    {
      statement:
        "Solve a pair of simultaneous equations by substitution when one equation is already in the form y = ... .",
      evidence:
        "The learner substitutes y = 2x + 1 into 3x + 2y = 16, solves 7x + 2 = 16 to get x = 2, and back-substitutes to get y = 5.",
    },
    {
      statement:
        "Interpret the solution graphically and distinguish one solution from no solution or infinitely many.",
      evidence:
        "The learner explains that the solution is the intersection of two lines, that parallel lines give no solution, and that two copies of the same line give infinitely many.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["linear-equations"],
    check: [
      {
        id: "d1",
        question: "Solve 2x + 5 = 17, showing each inverse operation.",
        answer:
          "Subtract 5 from both sides to get 2x = 12, then divide by 2 to get x = 6. The same operation is applied to both sides so the equation stays balanced.",
        targets: ["linear-equations"],
      },
      {
        id: "d2",
        question: "If y = 3x + 2 and x = 4, what is y?",
        answer:
          "Substitute 4 for x: y = 3 × 4 + 2 = 14. The expression gives y directly once x is known.",
        targets: ["linear-equations"],
      },
      {
        id: "d3",
        question: "What does it mean for two equations to be independent?",
        answer:
          "It means neither equation can be obtained from the other by rearranging or multiplying. Two independent equations provide different information, which is why together they can fix two unknowns.",
        targets: ["linear-equations"],
      },
    ],
  },

  introduction: {
    hook:
      "A cinema sells adult tickets for £9 and child tickets for £5. One evening 40 tickets are sold and the total taken is £260. Let a be the number of adult tickets and c the number of child tickets. Then a + c = 40 and 9a + 5c = 260. Neither equation alone determines a and c: many pairs add to 40. Together they describe the same evening, and only one pair satisfies both. Solving the pair is the mathematics of finding the one story that fits all the facts.",
    why:
      "Simultaneous equations appear wherever two conditions constrain the same two quantities: mixing two ingredients to hit a target, comparing two tariffs that meet, finding where a line crosses a curve. The method is not a new kind of algebra. It is the same balancing used in one equation, applied to two equations so that one unknown is removed. The graphical view is equally important: each equation is a line, and solving the pair asks where the lines meet. That picture explains why some pairs have no solution and others have infinitely many.",
  },

  explanation: [
    {
      heading: "One equation is a relationship, not a value",
      paragraphs: [
        "An equation such as x + y = 10 is true for infinitely many pairs: (1, 9), (4, 6), (10, 0) and every other pair whose sum is 10. It constrains the two unknowns to a relationship but does not choose one pair. A second equation adds a different relationship. If the second is x − y = 4, only the pair (7, 3) satisfies both. The two equations are independent when one cannot be rearranged into the other; if the second were 2x + 2y = 20, it would say exactly the same thing as the first and add no information.",
        "The graphical reading makes the count of solutions visible. Each linear equation is a straight line, and every point on the line is a pair that satisfies it. A solution of the pair is a point on both lines, so it is their intersection. Two non-parallel lines meet once; parallel lines never meet; identical lines meet everywhere. The algebra and the picture must agree, and when they seem not to, one of them has been drawn or solved incorrectly.",
        "A solution is a pair of values, not two separate answers. Writing x = 3 and y = 2 is complete only when both values together satisfy both equations. Checking only the first equation is not enough: a pair can satisfy one line and miss the other. The check must substitute both values into both original equations, and both must be true.",
      ],
    },
    {
      heading: "Elimination removes one unknown by combining the equations",
      paragraphs: [
        "Elimination uses the fact that adding equal quantities to both sides of an equation preserves it. If two equations are both true, their left sides can be added and their right sides can be added, producing another true equation. When the coefficients of one unknown are equal and opposite, that unknown cancels. For 2x + 3y = 12 and 4x − 3y = 6, adding gives 6x = 18, so x = 3. The y terms disappeared because +3y and −3y sum to zero.",
        "Once one unknown is known, substitute it into either original equation to find the other. With x = 3 in 2x + 3y = 12, 6 + 3y = 12, so 3y = 6 and y = 2. Substituting into the other equation as a check gives 12 − 6 = 6, which is true. The pair (3, 2) satisfies both equations, so it is the solution.",
        "If the coefficients are not already equal or opposite, multiply one or both equations to make them so. For 3x + 2y = 16 and x + y = 6, multiplying the second equation by 2 gives 2x + 2y = 12. Subtracting that from the first gives x = 4, and substituting back gives y = 2. The multiplier must be applied to the whole equation, not only to the term containing the unknown being eliminated.",
      ],
    },
    {
      heading: "Substitution uses one equation to name an unknown",
      paragraphs: [
        "When one equation is already in the form y = ..., substitution is often shorter than elimination. For y = 2x + 1 and 3x + 2y = 16, replace y in the second equation with 2x + 1: 3x + 2(2x + 1) = 16. Expanding gives 3x + 4x + 2 = 16, so 7x = 14 and x = 2. Then y = 2 × 2 + 1 = 5. The pair (2, 5) satisfies both equations.",
        "The substituted expression must be treated as a single quantity. Writing 2(2x + 1) as 4x + 1 loses the multiplication of the 1 by 2, which changes the equation. Brackets are not decoration; they keep the whole expression together while it is substituted. Expanding carefully after the substitution is the step that protects the solution.",
        "Substitution also works when neither equation is solved for a variable. Rearranging one equation to make x or y the subject is the same operation as solving a one-variable equation. The choice of which unknown to isolate is a practical one: choose the one with coefficient 1 or −1 if possible, because it avoids fractions. The method is not different in kind from elimination; it is a different way of using one equation to reduce the other to a single unknown.",
      ],
    },
    {
      heading: "No solution and infinitely many are real answers",
      paragraphs: [
        "Two lines with the same gradient but different intercepts are parallel and never meet, so the pair has no solution. The algebra reflects this by producing a false statement such as 0 = 5 after elimination. That is not an arithmetic mistake; it is the equations saying that no pair can satisfy both. A learner who forces a value for x at that point has ignored the contradiction.",
        "Two equations that describe the same line have infinitely many solutions. Multiplying x + y = 4 by 2 gives 2x + 2y = 8, which is the same relationship. Elimination produces 0 = 0, which is true for every point on the line. The correct answer is that the solution is the whole line, not a single pair. Recognising the dependent case prevents a learner from dividing by zero or inventing an intersection.",
        "In a modelling problem, the number of solutions has a meaning. A unique intersection means one break-even point; no intersection means two cost models never meet; infinitely many means the two descriptions are the same. The algebra should be translated back into the situation, because a bare “no solution” can look like a failure when it is actually the answer to the question.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Elimination combines the equations so that one unknown has coefficients that cancel. The resulting equation contains only the other unknown.",
      notation: "2x + 3y = 12   ·   4x − 3y = 6   ·   add: 6x = 18   ·   x = 3, y = 2",
      caption:
        "The y terms are +3y and −3y, so they cancel. The resulting equation gives x directly, and back-substitution gives y.",
    },
    {
      id: "r2",
      kind: "maths.graph",
      body:
        "Each equation is a line. A solution is a point on both lines, so it is the intersection of the two graphs.",
      notation: "x + y = 10 and x − y = 4   ·   intersection (7, 3)",
      caption:
        "The point (7, 3) lies on both lines: 7 + 3 = 10 and 7 − 3 = 4. Parallel lines would have no shared point; identical lines would share every point.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Substitution replaces one unknown with an expression from the other equation, reducing the pair to a single equation.",
      notation: "y = 2x + 1 into 3x + 2y = 16   →   3x + 2(2x + 1) = 16   →   7x + 2 = 16   →   x = 2, y = 5",
      caption:
        "The bracket keeps the whole expression 2x + 1 together while it is substituted. Expanding it before solving gives one equation in x.",
    },
    {
      id: "r4",
      kind: "maths.proof",
      body:
        "Adding two true equations produces a true equation. That is why elimination is legitimate rather than a trick.",
      notation: "if A = B and C = D, then A + C = B + D",
      caption:
        "The rule is the same balance used in one equation. Equal quantities are added to equal quantities, so the resulting equation remains true.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Solve the simultaneous equations 2x + 3y = 12 and 4x − 3y = 6.",
      steps: [
        {
          move: "Add the two equations: 2x + 4x = 6x, 3y + (−3y) = 0, and 12 + 6 = 18, so 6x = 18.",
          why:
            "The y coefficients are equal and opposite, so adding makes the y terms cancel and leaves one equation in x.",
        },
        {
          move: "Divide by 6: x = 3.",
          why:
            "The resulting equation contains only x, so dividing by its coefficient gives the value of x.",
        },
        {
          move: "Substitute x = 3 into 2x + 3y = 12: 6 + 3y = 12, so 3y = 6 and y = 2.",
          why:
            "Once one unknown is known, either original equation becomes a one-variable equation for the other.",
        },
        {
          move: "Check the pair (3, 2) in both equations: 2 × 3 + 3 × 2 = 12 and 4 × 3 − 3 × 2 = 6.",
          why:
            "A solution must satisfy both original equations, not just the one used for back-substitution.",
        },
      ],
      answer: "x = 3, y = 2",
    },
    {
      id: "w2",
      prompt: "Solve y = 2x + 1 and 3x + 2y = 16 by substitution.",
      steps: [
        {
          move: "Replace y in the second equation with 2x + 1: 3x + 2(2x + 1) = 16.",
          why:
            "Substitution uses the first equation to express y entirely in terms of x, leaving one unknown in the second equation.",
        },
        {
          move: "Expand the bracket: 3x + 4x + 2 = 16, so 7x + 2 = 16.",
          why:
            "Every term inside the bracket is multiplied by 2; dropping the +2 would change the equation and the solution.",
        },
        {
          move: "Subtract 2 and divide by 7: 7x = 14, so x = 2. Then y = 2 × 2 + 1 = 5.",
          why:
            "The one-variable equation gives x, and the original expression for y then gives the matching value.",
        },
        {
          move: "Check (2, 5) in 3x + 2y = 16: 6 + 10 = 16.",
          why:
            "The second equation was used for substitution, so checking it confirms the pair and catches any bracket error.",
        },
      ],
      answer: "x = 2, y = 5",
    },
    {
      id: "w3",
      prompt:
        "A theatre sells 40 tickets. Adult tickets cost £9 and child tickets cost £5, and the total taken is £260. Find the number of adult and child tickets.",
      steps: [
        {
          move: "Let a be adult tickets and c child tickets. Write a + c = 40 and 9a + 5c = 260.",
          why:
            "The first equation counts tickets and the second counts money; they are independent facts about the same two unknowns.",
        },
        {
          move: "Multiply the first equation by 5: 5a + 5c = 200. Subtract it from the money equation: 4a = 60.",
          why:
            "Making the coefficients of c equal lets subtraction eliminate c, leaving the cost difference per adult ticket.",
        },
        {
          move: "Divide by 4: a = 15. Then c = 40 − 15 = 25.",
          why:
            "The number of adult tickets is found first, and the ticket-count equation gives the child tickets directly.",
        },
        {
          move: "Check the money: 15 × 9 + 25 × 5 = 135 + 125 = 260.",
          why:
            "The total confirms that both the count and the prices have been used correctly.",
        },
      ],
      answer: "15 adult tickets and 25 child tickets",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Adding the equations always eliminates one of the unknowns.",
      whyItFails:
        "Adding only eliminates an unknown when its coefficients are equal and opposite. For 2x + 3y = 12 and 4x + 3y = 18, adding gives 6x + 6y = 30, which still contains both unknowns. Subtracting would eliminate y because the coefficients are equal and have the same sign. The operation must be chosen from the coefficients, not applied automatically.",
      correction:
        "Compare the coefficients of one unknown. If they are opposite, add; if they are equal, subtract; if neither, multiply one or both equations to make them match first.",
      contrast: {
        wrong: "always add the equations to eliminate a variable",
        right: "add when the coefficients are opposite, subtract when they are equal; otherwise scale first",
      },
    },
    {
      id: "m2",
      belief: "Once x is found, any value of y will do because the hard part is over.",
      whyItFails:
        "The solution is a pair, and the second value must satisfy both equations. For 2x + 3y = 12 with x = 3, the equation requires 6 + 3y = 12, so y must be 2. Choosing y = 0 gives 6, not 12. The pair is only a solution when both values are correct together.",
      correction:
        "Back-substitute the known value into an original equation and solve for the other unknown. Then check the pair in the other equation as well.",
      contrast: {
        wrong: "x = 3, so any y works",
        right: "x = 3 forces y = 2 in 2x + 3y = 12",
      },
    },
    {
      id: "m3",
      belief: "Two equations always have exactly one solution.",
      whyItFails:
        "Two lines can be parallel, in which case they never meet and the pair has no solution. They can also be the same line, in which case every point on it is a solution. For example, x + y = 4 and 2x + 2y = 8 are the same relationship, so there are infinitely many pairs. The number of solutions is a property of the pair, not a guarantee of the method.",
      correction:
        "Compare the gradients and intercepts, or interpret the result of elimination. A false statement means no solution; a statement that is always true means infinitely many.",
      contrast: {
        wrong: "every pair of linear equations has one solution",
        right: "parallel lines give none, identical lines give infinitely many, and crossing lines give one",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Solve x + y = 10 and x − y = 4.",
      hint: "Add the equations: the y terms are opposite, so they cancel. Then substitute the x-value into either equation.",
      answer: "x = 7, y = 3",
      feedback: {
        correct:
          "Adding gives 2x = 14, so x = 7, and substituting gives y = 3. The pair satisfies both equations.",
        incorrect:
          "Adding eliminates y because +y and −y cancel: 2x = 14, so x = 7. Then 7 + y = 10 gives y = 3, not another value.",
      },
    },
    {
      id: "p2",
      prompt: "Solve 3x + y = 11 and y = x + 3.",
      hint: "Substitute x + 3 for y in the first equation, expand carefully, and solve for x.",
      answer: "x = 2, y = 5",
      feedback: {
        correct:
          "Substitution gives 3x + x + 3 = 11, so 4x = 8 and x = 2. Then y = 2 + 3 = 5, and 6 + 5 = 11 confirms the first equation.",
        incorrect:
          "Replace y by the whole expression x + 3: 3x + (x + 3) = 11, so 4x + 3 = 11 and x = 2. Then y = 5.",
      },
    },
    {
      id: "p3",
      prompt: "Solve 2x + 3y = 16 and x + y = 6.",
      hint: "Multiply the second equation by 2 so the x coefficients match, then subtract.",
      answer: "x = 2, y = 4",
      feedback: {
        correct:
          "Multiplying x + y = 6 by 2 gives 2x + 2y = 12. Subtracting from 2x + 3y = 16 leaves y = 4; substituting back gives x + 4 = 6, so x = 2. Check: 4 + 12 = 16.",
        incorrect:
          "Scale the whole second equation: 2x + 2y = 12. Subtracting from 2x + 3y = 16 gives y = 4, then x = 2. The pair is (2, 4), not (4, 2).",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Solve x + y = 12 and x − y = 2.",
      modelAnswer: "x = 7, y = 5",
      marking: [
        "Adds the equations to eliminate y and obtains 2x = 14.",
        "Back-substitutes x = 7 to obtain y = 5 and checks both equations.",
      ],
      check: { accepted: ["x = 7, y = 5", "x=7,y=5", "7,5"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner solving 2x + 3y = 12 and 4x + 3y = 18 adds the equations and gets 6x + 6y = 30. Explain why adding did not help, state which operation would eliminate y, and solve the pair.",
      modelAnswer:
        "Adding did not eliminate y because both equations have +3y, so the y terms add to +6y rather than cancelling. Subtracting the first equation from the second eliminates y because 3y − 3y = 0. That gives 2x = 6, so x = 3. Substituting into 2x + 3y = 12 gives 6 + 3y = 12, so y = 2. The solution is x = 3, y = 2, and it satisfies both equations. Adding is only the right operation when the coefficients of the chosen unknown are opposite.",
      marking: [
        "Explains that adding equal-sign coefficients produces 6y rather than eliminating y.",
        "Chooses subtraction and obtains 2x = 6, so x = 3.",
        "Back-substitutes to get y = 2 and checks both equations.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Solve y = x + 2 and 2x + y = 11.",
      modelAnswer: "x = 3, y = 5",
      marking: [
        "Substitutes x + 2 for y to obtain 3x + 2 = 11.",
        "Solves x = 3 and finds y = 5, checking the pair.",
      ],
      check: { accepted: ["x = 3, y = 5", "x=3,y=5", "3,5"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A leisure centre sells 120 visits in a month. An adult visit costs £6 and a child visit costs £3.50. The total income is £570. Find the number of adult and child visits. Then explain what the solution would mean if the total income were £600 instead, and solve that case if it has a solution.",
      whyItTransfers:
        "The learner must form a count equation and a money equation, choose a multiplier that eliminates one unknown, and interpret the result. The second total changes the right-hand side of the money equation, so the learner has to solve a new pair and compare it, rather than reuse the first answer. The task also asks whether the new pair is physically possible, which connects the algebra to the context.",
      answer:
        "Let a be adult visits and c child visits. Then a + c = 120 and 6a + 3.5c = 570. Multiply the first equation by 3.5: 3.5a + 3.5c = 420. Subtract from the money equation: 2.5a = 150, so a = 60. Then c = 60. Check: 60 × 6 + 60 × 3.5 = 360 + 210 = 570. For £600, 6a + 3.5c = 600 with a + c = 120 gives 2.5a = 180, so a = 72 and c = 48. Both counts are whole and non-negative, so the £600 case is possible; the extra £30 comes from replacing 12 child visits with 12 adult visits, each worth £2.50 more.",
      marking: [
        "Writes both equations and scales the count equation correctly.",
        "Eliminates one unknown to obtain 60 adult and 60 child visits for £570.",
        "Repeats the method for £600 and obtains 72 adult and 48 child visits.",
        "Checks the totals and explains the change as the replacement of child visits by adult visits.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Solve x + y = 9 and x − y = 3.",
      answer: "x = 6, y = 3, because adding gives 2x = 12 and substituting gives y = 3.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does a pair of parallel lines have no simultaneous solution?",
      answer:
        "A solution is a point on both lines. Parallel lines never meet, so no point lies on both, and the equations have no common pair of values.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Solve 2x + y = 10 and y = x + 1.",
      answer:
        "Substitute x + 1 for y: 2x + x + 1 = 10, so 3x = 9, x = 3 and y = 4. Check: 6 + 4 = 10.",
      when: "month-later",
    },
  ],

  summary: [
    "One linear equation with two unknowns has infinitely many pairs; two independent equations can determine one pair.",
    "Elimination combines equations so one unknown cancels: add when coefficients are opposite, subtract when they are equal, and scale first when neither.",
    "Substitution replaces one unknown with an expression from the other equation and reduces the pair to one equation.",
    "Graphically, the solution is the intersection of two lines; parallel lines give no solution and identical lines give infinitely many.",
    "Always check the pair in both original equations, and interpret the result in the context of the problem.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The two equations are read as separate sentences with their operations named, and the solution is read as a pair of values rather than as a coordinate string.",
    },
    {
      need: "dyslexia",
      alternative:
        "Elimination is laid out one operation per line, with the operation named between the equations, so the cancellation is visible without tracking a dense block of symbols.",
    },
    {
      need: "colour-vision",
      alternative:
        "The two lines in the graphical representation are distinguished by their equations and labels as well as by visual style, and the intersection is named in the caption.",
    },
    {
      need: "motor",
      alternative:
        "Both values are typed; no dragging of lines or clicking an intersection point is required.",
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
        "All teaching prose, examples, practice, assessments and the leisure-centre transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for simultaneous equations.",
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