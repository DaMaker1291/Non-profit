import type { AuthoredLesson } from "../../lesson-contract";

// Batch 7 — fraction-ops, the concept the `denom-add` repair assumes.
//
// The bank already catches the most common belief in the whole curriculum (adding
// the bottoms: 1/3 + 1/4 = 2/7) and offers a coaching paragraph for it. That
// repair only works if the lesson has taught WHY counts can be combined only when
// the part sizes match, so the teaching here is built on one sentence: a
// denominator names a size, and a numerator counts those sizes.
//
// Multiplication and division are then read as English rather than as procedures —
// "two thirds OF three fifths" and "how many sixths FIT IN two thirds" — because
// the flip rule is unmemorable when it is only a rule, and obvious when the
// question it answers is on the page.
export const MATHS_FRACTION_OPS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "fraction-ops",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: adding, subtracting, multiplying and dividing fractions",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Add and subtract fractions by rewriting them to a common denominator, explaining why the counts cannot be combined until the sizes match.",
      evidence:
        "The learner rewrites one third and one quarter as four twelfths and three twelfths, gives seven twelfths, and says that the sizes had to match before the counts could be added.",
    },
    {
      statement: "Multiply two fractions, reading the operation as 'of' a quantity.",
      evidence:
        "The learner works out two thirds of three fifths as six fifteenths, simplifies it to two fifths, and explains that the answer is smaller than both fractions because it is a part of a part.",
    },
    {
      statement:
        "Divide by a fraction by asking how many of the divisor fit, and use that to justify inverting and multiplying.",
      evidence:
        "The learner answers two thirds divided by one sixth as 4, saying four sixths fit into two thirds, and confirms it with two thirds multiplied by six over one.",
    },
  ],

  priorKnowledge: {
    // ONLY WHAT THE GENOME DECLARES.
    //
    // This lesson first listed `multiplication` here, because multiplying the
    // counts is what section three asks a learner to do. The gate refused it:
    // `fraction-ops` declares `fractions`, so any prior knowledge has to be a
    // transitive DECLARED prerequisite, and inventing one makes the page's
    // assumptions disagree with the path that delivered the learner. It is the
    // rule the mandate sets, enforced in code — so the multiplication reading is
    // TAUGHT inside the lesson ("a part of a part") rather than asserted before it.
    conceptIds: ["fractions"],
    check: [
      {
        id: "f1",
        question: "What does the 4 in three quarters tell you?",
        answer: "That the whole is cut into four equal parts, and each part is a quarter.",
        targets: ["fractions"],
      },
      {
        id: "f2",
        question: "Are one half and three sixths the same amount?",
        answer: "Yes, because multiplying the top and bottom by three changes the way it is written, not what it is worth.",
        targets: ["fractions"],
      },
    ],
  },

  introduction: {
    hook:
      "A recipe says two thirds of a cup, and the measuring jug is marked in twelfths. Nothing has gone wrong: two thirds is not a different amount in twelfths, it is the same amount written in a different size of part. Almost every fraction mistake is a mistake about the SIZE of the part rather than about the arithmetic.",
    why:
      "A denominator names how big one part is and a numerator counts how many of those parts you have. You can add counts only when the sizes are the same, exactly as you can add three metres to four metres but not to four centimetres. Once that sentence is secure, adding fractions, simplifying them, multiplying them and dividing them all become consequences rather than rules to remember.",
  },

  explanation: [
    {
      heading: "A denominator is a size, and only equal sizes can be counted",
      paragraphs: [
        "A fraction carries two separate pieces of information. The denominator says how big one part is: quarters are bigger than sixths, because the same whole cuts into fewer pieces. The numerator says how many of those parts you have. Adding three quarters to one quarter is easy because both counts refer to the same size, so four quarters is one whole. Adding one third to one quarter is not the same kind of sum, because the parts being counted are different sizes.",
        "The everyday version of this is measurement. Three metres plus four metres is seven metres, and three metres plus four centimetres is not seven of anything until one of them is converted. Fractions behave identically, which is why a sum like one third plus one quarter has to be rewritten before the counts mean the same thing. Recognising that the sizes differ is the whole of the diagnosis; the arithmetic afterwards is ordinary counting.",
      ],
    },
    {
      heading: "A common denominator rewrites both fractions without changing what they are worth",
      paragraphs: [
        "Multiplying the top and the bottom of a fraction by the same number changes its appearance and not its value, because the part size and the number of parts are scaled together. One third becomes four twelfths when both numbers are multiplied by four: the parts are four times smaller and there are four times as many of them. One quarter becomes three twelfths by multiplying both numbers by three, and now both fractions count twelfths.",
        "Any common multiple will do, and the lowest one keeps the numbers small: twelve serves thirds and quarters, while twenty-four would also work and would need simplifying at the end. Subtraction uses exactly the same rewriting, since taking away a count of parts requires the parts to be the same size just as adding does. What must never happen is combining the denominators themselves, because adding two sizes produces a size that belongs to neither fraction.",
      ],
    },
    {
      heading: "Multiplying is 'of', and dividing is 'how many fit'",
      paragraphs: [
        "Two thirds of three fifths means a part of a part, so the answer must be smaller than either fraction, and it is found by multiplying the counts and the sizes: six fifteenths, which simplifies to two fifths. The picture is a rectangle cut into five columns and three rows, with two columns and three rows shaded. Reading multiplication as 'of' also explains why the answer can be tiny: half of a half is a quarter, not one.",
        "Division asks a different question: how many of the divisor fit inside the dividend. Two thirds divided by one sixth asks how many sixths fit in two thirds, and the answer is four, because two thirds is four sixths. That is why inverting the divisor and multiplying gives the same result — multiplying by six over one counts sixths directly. A division by a fraction below one therefore gives an answer larger than the dividend, which is a check a learner can apply before trusting the arithmetic.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "Both fractions rewritten in twelfths, so the counts refer to the same size of part.",
      notation: "1/3 + 1/4 = 4/12 + 3/12 = 7/12",
      caption:
        "The top and bottom of each fraction were multiplied by the same number, so the values did not change; only the size of the parts did.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "A rectangle cut into five columns and three rows. Three of the five columns are shaded, and two of the three rows are shaded, so the overlap is six fifteenths of the whole.",
      notation: "2/3 × 3/5 = 6/15 = 2/5",
      caption:
        "The overlap is the part of a part, and the grid shows why the counts multiply: two of the three rows within three of the five columns.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "Two thirds marked in sixths: each third is two sixths, so two thirds is four sixths.",
      notation: "2/3 ÷ 1/6 = 4",
      caption:
        "Counting the sixths up to two thirds gives four, which is the division answered as a question about fit rather than about flipping.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 1/3 + 1/4.",
      steps: [
        {
          move: "Notice the part sizes differ: thirds and quarters cannot be counted together.",
          why:
            "The counts only mean something once the sizes match, so the sum has to be rewritten before any adding happens.",
        },
        {
          move: "Rewrite both in twelfths: 1/3 = 4/12 by multiplying top and bottom by 4, and 1/4 = 3/12 by multiplying by 3.",
          why:
            "Multiplying both numbers by the same factor changes the size of the parts and the count together, so the value is unchanged.",
        },
        {
          move: "Add the counts of twelfths: 4/12 + 3/12 = 7/12, and check that the answer sits between one third and one half.",
          why:
            "Twelfths are now the same size, so adding the counts is ordinary addition; the estimate confirms the size of the result.",
        },
      ],
      answer: "7/12",
    },
    {
      id: "w2",
      prompt: "Work out 2/3 ÷ 1/6, and explain why the answer is larger than 2/3.",
      steps: [
        {
          move: "Read the division as a question: how many sixths fit inside two thirds?",
          why:
            "The fit reading turns a rule into a count, and it shows what the answer is measuring before any symbols are moved.",
        },
        {
          move: "Rewrite two thirds in sixths: 2/3 = 4/6, because each third is two sixths.",
          why:
            "A common denominator is what makes the counts comparable, exactly as it does when adding.",
        },
        {
          move: "Count: four sixths fit, so the answer is 4, and confirm with 2/3 × 6/1 = 12/3 = 4.",
          why:
            "Inverting the divisor multiplies by the number of sixths in one whole, which is the same count arrived at directly.",
        },
      ],
      answer: "4",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Add the tops and the bottoms: one third plus one quarter is two sevenths.",
      whyItFails:
        "The denominator names the size of a part, so adding the sizes invents a part size, one seventh, that is smaller than both original parts. A sum of two positive fractions must be larger than either one, and two sevenths is smaller than one third, so the answer cannot be right. The counts were added while the sizes were different, which is the one thing counting does not allow.",
      correction:
        "Rewrite both fractions to a common denominator first, then add only the numerators: one third and one quarter become four twelfths and three twelfths, which add to seven twelfths.",
      contrast: {
        wrong: "1/3 + 1/4 = 2/7, adding the numerators and the denominators",
        right: "1/3 + 1/4 = 4/12 + 3/12 = 7/12, counting twelfths",
      },
    },
    {
      id: "m2",
      belief: "Divide fractions by dividing the tops and the bottoms, so two thirds divided by one sixth is two eighteenths.",
      whyItFails:
        "That calculation answers a different question: it takes two eighteenths of the first fraction rather than counting how many sixths fit in it. Two thirds holds four sixths, and the answer must be larger than two thirds because the divisor is below one. Two eighteenths is smaller than both numbers in the question, which is the sign that the operation was read wrongly.",
      correction:
        "Read the division as how many of the divisor fit, and either count them on a common denominator or invert the divisor and multiply: two thirds multiplied by six over one gives four.",
      contrast: {
        wrong: "2/3 ÷ 1/6 = 2/18, dividing the tops and the bottoms",
        right: "2/3 ÷ 1/6 = 4, because four sixths fit into two thirds",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Work out 1/2 + 1/5.",
      hint: "Halves and fifths are different sizes; find a size both can be written in.",
      answer: "7/10, because one half is five tenths and one fifth is two tenths",
      feedback: {
        correct: "Both fractions were rewritten to tenths before any counts were added.",
        incorrect:
          "Ten serves both halves and fifths: one half is five tenths and one fifth is two tenths, so the total is seven tenths.",
      },
    },
    {
      id: "p2",
      prompt: "Work out 2/3 × 3/4.",
      hint: "Read it as two thirds OF three quarters, so the answer must be smaller than both.",
      answer: "1/2, because six twelfths simplifies to one half",
      feedback: {
        correct: "The counts multiplied and the result was simplified, and the size was checked against both fractions.",
        incorrect:
          "Multiplying the counts gives six twelfths, which simplifies to one half, and a half is smaller than both fractions.",
      },
    },
    {
      id: "p3",
      prompt: "Work out 3/4 ÷ 1/8.",
      hint: "Ask how many eighths fit inside three quarters.",
      answer: "6, because three quarters is six eighths",
      feedback: {
        correct: "The division was answered as a count of eighths, so the rule was not needed.",
        incorrect:
          "Each quarter holds two eighths, so three quarters holds six, and six eighths is the whole of three quarters.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 2/5 + 1/2.",
      modelAnswer: "9/10",
      marking: [
        "Rewrites both fractions to a common denominator of ten rather than adding the numerators and denominators.",
        "Gives nine tenths, which is larger than a half as it must be.",
      ],
      check: { accepted: ["9/10", "0.9"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner writes one third plus one quarter equals two sevenths and says they added the tops and the bottoms. Explain why that answer cannot be right, then give the correct sum.",
      modelAnswer:
        "Adding the denominators adds two part sizes, which produces a part size of one seventh that belongs to neither fraction. A sum of two positive fractions must be larger than either addend, and two sevenths is smaller than one third, so it fails a check that needs no arithmetic. The fractions must first be written in the same size of part: one third is four twelfths and one quarter is three twelfths, which add to seven twelfths.",
      marking: [
        "States that the denominators name part sizes and cannot be added.",
        "Uses the size check: the sum must exceed either fraction.",
        "Rewrites both fractions in twelfths and gives seven twelfths.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A baker has 4 cups of flour and each loaf needs 2/3 of a cup. A pupil works out 4 × 2/3 = 8/3 and says they can bake two and a bit loaves. Give the correct number of loaves and explain which operation the question actually asked for.",
      whyItTransfers:
        "The learner has to decide whether the situation is a part-of or a how-many-fit question, then choose the operation that matches. The arithmetic in both readings is easy; the reading is the concept, and it is invisible in a bare calculation.",
      answer:
        "Six loaves, because 4 ÷ 2/3 = 4 × 3/2 = 12/2 = 6: the question asks how many two-thirds fit into four cups, so it is a division. Multiplying gives the amount of flour used by two and two thirds loaves, which is the wrong direction — it answers how much, not how many.",
      marking: [
        "Gives 6 loaves.",
        "Writes the division 4 ÷ 2/3 and evaluates it, or counts two-thirds up to four.",
        "Explains that multiplication would answer how much flour is used, not how many loaves fit.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Work out 1/4 + 1/8.",
      answer: "3/8, because one quarter is two eighths and one eighth more makes three.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Work out 3/5 × 5/6.",
      answer: "1/2, because fifteen thirtieths simplifies to one half.",
      when: "week-later",
    },
  ],

  summary: [
    "A denominator names the size of a part and a numerator counts those parts.",
    "Counts can be added or subtracted only when the sizes match, so rewrite to a common denominator first.",
    "Multiplying fractions is finding a part of a part, so the answer is smaller than either fraction.",
    "Dividing asks how many of the divisor fit, which is why inverting the divisor and multiplying gives the same count.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each fraction is read as a count and a size in words as well as in notation, so a denominator is never heard as a second number to add.",
    },
    {
      need: "dyslexia",
      alternative:
        "The common denominator step is written as two separate lines before the sum, so the rewriting and the adding are never on one crowded line.",
    },
    {
      need: "motor",
      alternative:
        "The answer can be entered as a numerator and a denominator separately, so no stacked fraction has to be drawn in a single field.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note: "All explanations, examples, practice and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution: "Scope cited against the published GCSE mathematics subject content for number.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-04",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
