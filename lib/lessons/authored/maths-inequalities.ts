import type { AuthoredLesson } from "../../lesson-contract";

// AN INEQUALITY IS A RANGE, AND THE RANGE HAS A DIRECTION.
//
// x > 3 has infinitely many solutions. The lesson keeps three questions
// separate: where the boundary is, whether the boundary is included, and which
// side satisfies the comparison. The sign-flip rule is derived from reflection
// on the number line rather than announced as a special case, so a learner can
// test it with one substitution. Compound inequalities are one interval with two
// boundaries, and a contextual answer is not finished until the range has been
// translated back into whole items, whole people or whole crates.
export const MATHS_INEQUALITIES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "inequalities",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra: linear inequalities, solution sets on a number line, compound inequalities and integer solutions",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the delivery-van transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Solve a linear inequality and represent its solution set on a number line.",
      evidence:
        "The learner solves 4x − 3 ≤ 17 as x ≤ 5, draws a filled circle at 5 with the arrow left, and checks that 5 satisfies the inequality while 6 does not.",
    },
    {
      statement:
        "Explain why multiplying or dividing by a negative reverses the inequality, and apply the rule correctly.",
      evidence:
        "The learner solves −3x + 2 > 11 as x < −3, states that dividing by −3 reverses the order, and checks a value on each side of −3.",
    },
    {
      statement:
        "Solve a compound inequality and list its integer solutions.",
      evidence:
        "The learner solves −2 ≤ 2x + 4 < 10 as −3 ≤ x < 3 and lists −3, −2, −1, 0, 1 and 2, excluding 3 because the upper boundary is strict.",
    },
    {
      statement:
        "Turn a constraint in words into an inequality and interpret the result in context.",
      evidence:
        "The learner models a £20 budget with a £5 entry fee and £3 tickets as 3n + 5 ≤ 20, solves n ≤ 5, and states that at most five tickets can be bought.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["linear-equations"],
    check: [
      {
        id: "d1",
        question: "Solve 5x + 4 = 19, showing each inverse operation.",
        answer:
          "Subtract 4 from both sides to get 5x = 15, then divide both sides by 5 to get x = 3. The same operation is applied to both sides to keep the equation balanced.",
        targets: ["linear-equations"],
      },
      {
        id: "d2",
        question: "On a number line, which is greater, −2 or −5?",
        answer:
          "−2 is greater because it lies to the right of −5. Greater means further right, so a negative number closer to zero is larger than one further from zero.",
        targets: ["linear-equations"],
      },
      {
        id: "d3",
        question: "What does ≤ mean, and how is it different from <?",
        answer:
          "≤ means less than or equal to, so the boundary is included. < means strictly less than, so the boundary is not included. That difference decides whether a circle is filled or open.",
        targets: ["linear-equations"],
      },
    ],
  },

  introduction: {
    hook:
      "A lift has a maximum load of 400 kilograms. If each crate weighs 25 kilograms and the porter weighs 80 kilograms, the number of crates c must satisfy 25c + 80 ≤ 400. Solving gives c ≤ 12.8, so the practical answer is at most 12 crates: 13 would exceed the limit, and a fraction of a crate is not a possible load. The algebra produces a range, and the situation decides which values in that range make sense.",
    why:
      "Equations ask for one value; inequalities ask for a set of values that satisfy a condition. That difference matters whenever a quantity is bounded by a budget, a speed limit, a temperature range or a maximum load. The mathematics is almost the same as solving an equation, with one genuine exception: multiplying or dividing by a negative reverses the order. Learners who memorise the exception without seeing why often apply it in the wrong place, while learners who understand the reflection can check any solution by substituting a value on each side.",
  },

  explanation: [
    {
      heading: "The solution is a range, not a single number",
      paragraphs: [
        "An inequality compares two expressions rather than asserting that they are equal. The statement x > 3 is true for every number greater than 3, so its solution is an infinite set. On a number line it is an open circle at 3 with an arrow pointing right: the circle excludes 3 and the arrow shows the direction of the values that work. For x ≥ 3 the circle is filled because 3 is included. The boundary and the direction are two separate pieces of information, and both must be shown.",
        "Solving uses the same inverse operations as an equation. For 4x − 3 ≤ 17, add 3 to both sides to get 4x ≤ 20, then divide by 4 to get x ≤ 5. Adding or subtracting the same quantity shifts both expressions equally, so their order is unchanged. Multiplying or dividing by a positive number scales both expressions by the same positive factor, which also preserves the order. These operations are safe for the same reason they are safe in an equation.",
        "The answer should be checked by substitution, not by rereading the working. For x ≤ 5, choose 5 and a number on the other side, such as 6. The original gives 17 at x = 5, which satisfies ≤ 17, and 21 at x = 6, which does not. One value inside and one outside the boundary tests both the boundary and the direction. A solution that passes only the boundary check may still have its arrow pointing the wrong way.",
      ],
    },
    {
      heading: "Multiplying by a negative reflects the number line",
      paragraphs: [
        "The order of two numbers reverses when both are multiplied by a negative. On the number line, 2 is to the right of 1, but −2 is to the left of −1. The same reflection happens to every point, so the whole line is turned around. This is why −3x > 9 becomes x < −3 rather than x > −3: dividing by −3 reverses the comparison, just as multiplying by −1 reflects the positions.",
        "The rule applies to multiplication and division by a negative, not to addition or subtraction. Adding −5 to both sides does not reverse the inequality, because addition slides the line without flipping it. For −3x + 2 > 11, first subtract 2 to get −3x > 9, then divide by −3 and reverse: x < −3. The first step preserves order and the second reverses it. Doing both operations correctly is what makes the final direction trustworthy.",
        "A substitution check is especially valuable here because a sign error is easy to make and hard to see. Test x = −4, which should satisfy x < −3: the original gives 12 + 2 = 14, and 14 > 11 is true. Test x = 0, which should fail: the original gives 2, and 2 > 11 is false. If the direction had been left as x > −3, the test at −4 would fail immediately.",
      ],
    },
    {
      heading: "A compound inequality is one interval with two boundaries",
      paragraphs: [
        "A statement such as −2 ≤ 2x + 4 < 10 says that the middle expression is at least −2 and strictly less than 10. It is one range, not two separate problems. The operations are applied to all three parts at once: subtract 4 to get −6 ≤ 2x < 6, then divide by 2 to get −3 ≤ x < 3. The lower boundary is included and the upper boundary is not, which is why the integer list stops at 2 rather than 3.",
        "The two boundaries can have different inclusion rules, and that difference is part of the answer. A filled circle at −3 and an open circle at 3 describe the same set as the symbols. If the original had been −2 < 2x + 4 ≤ 10, the endpoints would reverse their inclusion: −3 would be excluded and 3 included. Reading the symbols carefully is therefore not pedantry; it changes which values are in the solution.",
        "When the variable is in the middle, every operation must be applied to all three parts. If the coefficient of x is negative, dividing all three parts by it reverses both comparisons: −6 ≤ −2x < 4 becomes 3 ≥ x > −2, usually rewritten as −2 < x ≤ 3. The range is the same, but every boundary and direction has been turned around.",
      ],
    },
    {
      heading: "The context decides which values are admissible",
      paragraphs: [
        "The solution set of an inequality is a mathematical range, but a real problem may allow only some of its values. A number of tickets must be whole, a length must be positive, and a time cannot be negative. The lift example gives c ≤ 12.8, but c must be an integer, so the greatest possible number of crates is 12. The inequality has found the boundary; the context says how to read it.",
        "A useful answer states the inequality, solves it, and then translates the result back into words. Writing c ≤ 12.8 alone leaves the reader to decide whether 12.8 crates is possible. Writing “at most 12 crates” answers the question that was asked. The final sentence should name the quantity and the direction of the bound, not merely repeat the algebra.",
        "Boundary cases deserve special attention. If the limit is exactly reached, the answer may be included or excluded depending on the wording. “No more than 400 kg” includes 400, while “less than 400 kg” does not. The symbol should match the wording before solving begins, because a correct calculation from the wrong inequality is still the wrong answer to the problem.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.number-line",
      body:
        "A solution set is drawn with a circle at the boundary and an arrow in the direction of the values that satisfy it. A filled circle includes the boundary; an open circle excludes it.",
      notation: "x ≤ 5: filled circle at 5, arrow left   ·   x > 3: open circle at 3, arrow right",
      caption:
        "The boundary and the direction are separate claims. A filled circle with the arrow pointing the wrong way would describe a different set, so both must be read from the symbols.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Addition and subtraction preserve order; multiplication or division by a negative reverses it. The reversal is a reflection of the number line.",
      notation: "−3x + 2 > 11   →   −3x > 9   →   x < −3",
      caption:
        "Subtracting 2 preserves the direction. Dividing by −3 flips it, because every point on the line is reflected to the opposite side of zero.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A compound inequality applies the same operation to all three parts. Its answer is one interval with a lower and an upper boundary.",
      notation: "−2 ≤ 2x + 4 < 10   →   −6 ≤ 2x < 6   →   −3 ≤ x < 3",
      caption:
        "The integer solutions are −3, −2, −1, 0, 1 and 2. The value 3 is excluded because the upper comparison is strict, and −3 is included because the lower comparison includes equality.",
    },
    {
      id: "r4",
      kind: "maths.proof",
      body:
        "The sign-flip rule follows from order. If one number is less than another, multiplying both by a negative reflects them across zero.",
      notation: "1 < 2   ·   multiply by −1   ·   −1 > −2",
      caption:
        "The smaller number becomes the larger after reflection. The same reflection applies to every pair of values, which is why the inequality sign reverses when both sides are multiplied or divided by a negative.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Solve 4x − 3 ≤ 17 and describe the solution on a number line.",
      steps: [
        {
          move: "Add 3 to both sides: 4x ≤ 20.",
          why:
            "Adding the same quantity to both sides shifts both expressions equally, so the order is unchanged.",
        },
        {
          move: "Divide both sides by 4: x ≤ 5.",
          why:
            "Dividing by a positive number scales both sides by the same positive factor and preserves the direction.",
        },
        {
          move: "Draw a filled circle at 5 with an arrow pointing left.",
          why:
            "The filled circle shows that 5 satisfies ≤, and the leftward arrow shows that every smaller value also satisfies it.",
        },
        {
          move: "Check 5 and 6: 4 × 5 − 3 = 17 satisfies the inequality, while 4 × 6 − 3 = 21 does not.",
          why:
            "One value inside and one outside the boundary tests both the boundary and the direction.",
        },
      ],
      answer: "x ≤ 5",
    },
    {
      id: "w2",
      prompt: "Solve −3x + 2 > 11.",
      steps: [
        {
          move: "Subtract 2 from both sides: −3x > 9.",
          why:
            "Subtraction is addition of a negative and does not reverse the order, so the inequality sign stays as it is.",
        },
        {
          move: "Divide both sides by −3 and reverse the inequality: x < −3.",
          why:
            "Dividing by a negative reflects every point on the number line, so the direction of the comparison must reverse as well.",
        },
        {
          move: "Check x = −4: the original gives 12 + 2 = 14, and 14 > 11 is true. Check x = 0: the original gives 2, and 2 > 11 is false. The boundary is x = −3, and the true side is below it.",
          why:
            "A value on each side of the boundary confirms both the direction and the position of the solution.",
        },
      ],
      answer: "x < −3",
    },
    {
      id: "w3",
      prompt:
        "A school trip costs £5 per learner for entry plus a £40 coach charge. The total budget is £160. Write an inequality for the number of learners n, solve it, and state the greatest possible number of learners.",
      steps: [
        {
          move: "Write the total cost as 5n + 40 and require it to be at most 160: 5n + 40 ≤ 160.",
          why:
            "The entry cost changes with the number of learners, while the coach charge is fixed; the budget sets an upper bound on the total.",
        },
        {
          move: "Subtract 40 from both sides: 5n ≤ 120.",
          why:
            "Removing the fixed charge leaves the part of the budget available for learner tickets, and subtraction preserves the inequality.",
        },
        {
          move: "Divide by 5: n ≤ 24.",
          why:
            "Dividing by a positive number keeps the direction and gives the maximum number of learner tickets the remaining budget can buy.",
        },
        {
          move: "The greatest whole number of learners is 24, with total cost 5 × 24 + 40 = 160.",
          why:
            "The context requires a whole number of learners, and checking the boundary shows that the budget is exactly exhausted rather than exceeded.",
        },
      ],
      answer: "5n + 40 ≤ 160, so n ≤ 24; at most 24 learners.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The inequality sign only reverses when the variable is negative.",
      whyItFails:
        "The sign reverses when both sides are multiplied or divided by a negative number, regardless of whether the variable is negative. Dividing 4x ≤ 20 by positive 4 keeps the direction. Dividing −4x ≤ 20 by negative 4 reverses it to x ≥ −5. The trigger is the operation, not the appearance of a minus sign in the answer.",
      correction:
        "Look at the number being divided or multiplied. If it is negative, reverse the sign; if it is positive, leave it alone. Addition and subtraction never reverse it.",
      contrast: {
        wrong: "−4x ≤ 20 becomes x ≤ −5 because the answer is negative",
        right: "−4x ≤ 20 becomes x ≥ −5 because both sides are divided by −4",
      },
    },
    {
      id: "m2",
      belief: "The circle on a number line is always open because the statement is an inequality.",
      whyItFails:
        "The circle records whether the boundary itself is in the solution set, not whether the statement is an inequality. For x ≤ 5 the boundary 5 satisfies the inequality, so the circle is filled. For x < 5 the boundary does not satisfy it, so the circle is open. Making every circle open would exclude values that the symbol includes.",
      correction:
        "Match the circle to the symbol: fill it for ≤ or ≥, leave it open for < or >. Then check the boundary value in the original inequality.",
      contrast: {
        wrong: "x ≤ 5 is drawn with an open circle at 5",
        right: "x ≤ 5 is drawn with a filled circle at 5 and an arrow to the left",
      },
    },
    {
      id: "m3",
      belief: "A compound inequality can be solved by working on the middle expression alone.",
      whyItFails:
        "The comparisons connect the middle expression to both outer quantities. Applying an operation only to the middle changes it without changing the two sides in the same way, so the inequalities no longer describe the same range. Subtracting 4 from 2x alone in −2 ≤ 2x + 4 < 10 would compare the wrong quantities.",
      correction:
        "Apply every operation to all three parts. If dividing by a negative, reverse both comparison signs, because both comparisons have been reflected.",
      contrast: {
        wrong: "−2 ≤ 2x + 4 < 10 is solved by subtracting 4 only from 2x",
        right: "−2 ≤ 2x + 4 < 10 becomes −6 ≤ 2x < 6, then −3 ≤ x < 3",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Solve 7x + 2 < 30.",
      hint: "Subtract 2 from both sides, then divide by the positive coefficient 7. The direction should not change.",
      answer: "x < 4",
      feedback: {
        correct:
          "Subtracting 2 gives 7x < 28, and dividing by 7 gives x < 4. The boundary 4 is excluded because the sign is strict.",
        incorrect:
          "The operations give 7x < 28 and then x < 4. Dividing by positive 7 does not reverse the sign, and the boundary is open because the inequality is < rather than ≤.",
      },
    },
    {
      id: "p2",
      prompt: "Solve −2x ≥ 10.",
      hint: "Divide both sides by −2. Decide what happens to the direction before writing the answer.",
      answer: "x ≤ −5",
      feedback: {
        correct:
          "Dividing by a negative reverses the order, so −2x ≥ 10 becomes x ≤ −5. Check x = −6: −2 × −6 = 12, and 12 ≥ 10 is true.",
        incorrect:
          "The division by −2 reverses the sign. The answer is x ≤ −5, not x ≥ −5; the check at x = −6 satisfies the original, while x = 0 does not.",
      },
    },
    {
      id: "p3",
      prompt: "Solve 1 < 3x − 5 ≤ 13 and list the integer solutions.",
      hint: "Add 5 to all three parts, then divide all three by 3. Keep track of which boundaries are included.",
      answer: "2 < x ≤ 6, so the integer solutions are 3, 4, 5 and 6.",
      feedback: {
        correct:
          "Adding 5 gives 6 < 3x ≤ 18, and dividing by 3 gives 2 < x ≤ 6. The lower boundary is excluded and the upper boundary is included.",
        incorrect:
          "All three parts must be changed: 1 + 5 < 3x ≤ 13 + 5 gives 6 < 3x ≤ 18, then 2 < x ≤ 6. The integers start at 3 because 2 is excluded, and include 6 because ≤ includes it.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Solve −5x ≥ 20.",
      modelAnswer: "x ≤ −4",
      marking: [
        "Divides both sides by −5 and reverses the inequality sign.",
        "States the solution as x ≤ −4 and preserves the negative boundary.",
      ],
      check: { accepted: ["x ≤ −4", "x<=-4", "x ≤ -4"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner solves −4x + 3 < 19 and writes x < −4. Explain what is wrong, give the correct solution, and use a test value to justify the direction.",
      modelAnswer:
        "The learner subtracted 3 correctly to get −4x < 16, but then divided by −4 without reversing the inequality. The correct solution is x > −4. Testing x = 0 gives 3 < 19, which is true, and 0 is greater than −4. Testing x = −5 gives 23 < 19, which is false, and −5 is less than −4. The direction must therefore be greater than, not less than.",
      marking: [
        "Identifies the missing reversal when dividing by −4.",
        "Gives the correct solution x > −4.",
        "Uses a test value inside and outside the range to justify the direction.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "How many integer values satisfy −1 ≤ 2x + 3 < 9?",
      modelAnswer: "5",
      marking: [
        "Solves the compound inequality to obtain −2 ≤ x < 3.",
        "Counts the integers −2, −1, 0, 1 and 2, giving 5 values after excluding 3.",
      ],
      check: { accepted: ["5", "five"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A delivery van can carry at most 900 kg. It already carries a 150 kg driver and equipment. Each box has mass 32 kg. Write and solve an inequality for the number of boxes b, and state the greatest number that can be loaded. Then explain how the answer changes if each box weighs 35 kg instead.",
      whyItTransfers:
        "The learner has to build the inequality from a capacity constraint, solve it with a positive coefficient, and round down because boxes are whole. The second part changes one parameter and asks for a comparison, testing whether the learner understands the boundary rather than remembering the first answer.",
      answer:
        "The load is 150 + 32b, so 150 + 32b ≤ 900. Subtract 150: 32b ≤ 750. Divide by 32: b ≤ 23.4375, so at most 23 boxes. With 35 kg boxes, 150 + 35b ≤ 900 gives 35b ≤ 750 and b ≤ 21.428..., so at most 21 boxes. The heavier boxes reduce the maximum by two because each one uses more of the same remaining capacity.",
      marking: [
        "Writes 150 + 32b ≤ 900 and solves it correctly.",
        "Rounds down to 23 whole boxes and explains why a fraction of a box is not allowed.",
        "Repeats the calculation for 35 kg and obtains 21 boxes.",
        "Compares the two answers and explains the change in terms of capacity per box.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Solve 2x + 7 > 15.",
      answer: "x > 4, because subtracting 7 gives 2x > 8 and dividing by 2 preserves the direction.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "When does the direction of an inequality reverse?",
      answer:
        "When both sides are multiplied or divided by a negative number. Adding or subtracting a negative does not reverse it, and multiplying or dividing by a positive number does not reverse it either.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Solve −3 ≤ x + 2 < 5 and list the integer solutions.",
      answer:
        "Subtract 2 from all parts to get −5 ≤ x < 3. The integers are −5, −4, −3, −2, −1, 0, 1 and 2; 3 is excluded.",
      when: "month-later",
    },
  ],

  summary: [
    "An inequality describes a range; the boundary is included for ≤ or ≥ and excluded for < or >.",
    "Solve with inverse operations as for an equation, but reverse the sign when multiplying or dividing both sides by a negative.",
    "The reversal is a reflection of the number line: 1 < 2 becomes −1 > −2 after multiplying by −1.",
    "A compound inequality applies every operation to all three parts and describes one interval with two boundaries.",
    "Check with a value inside and outside the range, and let the context decide whether the boundary must be a whole number.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every number-line solution is also stated in words, such as all values less than or equal to five, and every inequality symbol is read by name rather than as a character.",
    },
    {
      need: "colour-vision",
      alternative:
        "Included and excluded boundaries are distinguished by filled versus open circles and by the words in the caption, not by colour alone.",
    },
    {
      need: "dyslexia",
      alternative:
        "The sign-flip rule is shown as a before-and-after line with the operation named between them, so the reversal is not buried in a paragraph.",
    },
    {
      need: "motor",
      alternative:
        "Solutions are typed; no dragging of a point along a number line is required.",
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
        "All teaching prose, examples, practice, assessments and the delivery-van transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for inequalities.",
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