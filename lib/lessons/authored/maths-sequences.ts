import type { AuthoredLesson } from "../../lesson-contract";

// A SEQUENCE IS A RULE ATTACHED TO POSITIONS, NOT A LIST TO CONTINUE BY FEEL.
//
// The concept is stage 1 and has no declared prerequisite, so the lesson probes
// the arithmetic it needs instead of inventing a graph edge. The central move is
// the distinction between a term-to-term rule (what changes from one term to the
// next) and a position-to-term rule (what the nth term is). The second is what
// makes a distant term reachable without listing every term before it.
export const MATHS_SEQUENCES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "sequences",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra: sequences, term-to-term and position-to-term rules, arithmetic sequences, geometric sequences and the nth term",
    level: "Key Stage 3 to GCSE Foundation",
    note:
      "Scope cited against the published subject content. The lesson treats a sequence as a function from position to term, derives the nth term of an arithmetic sequence from its common difference, and includes geometric sequences and a quadratic contrast. No specification or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Describe a sequence by a term-to-term rule and use it to find the next terms, including arithmetic and geometric sequences.",
      evidence:
        "For 4, 7, 10, 13 the learner states the rule add 3 and finds 16 and 19; for 3, 6, 12, 24 the learner states multiply by 2 and finds 48, distinguishing a common difference from a common ratio.",
    },
    {
      statement:
        "Find and use a position-to-term rule for an arithmetic sequence, and explain why the coefficient of n is the common difference.",
      evidence:
        "The learner derives the nth term of 5, 9, 13, 17 as 4n + 1, checks it at n = 1 and n = 4, and uses it to find the 20th term without listing twenty terms.",
    },
    {
      statement:
        "Use a position-to-term rule to find a missing term or a distant term, and test whether a proposed rule generates the given sequence.",
      evidence:
        "The learner finds the missing term in 2, 7, 12, ?, 22 as 17 from the rule 5n − 3, and rejects 4n for 5, 9, 13, 17 because it gives 4, 8, 12, 16.",
    },
  ],

  priorKnowledge: {
    // `sequences` declares no prerequisites. The checks probe substitution and
    // subtraction, the two moves the lesson cannot proceed without.
    conceptIds: [],
    check: [
      {
        id: "d1",
        question: "What is the value of 4n when n = 3?",
        answer:
          "12, because 4n means 4 multiplied by n, and 4 × 3 = 12. The letter is a placeholder for the position number.",
        targets: ["algebra-expressions"],
      },
      {
        id: "d2",
        question: "What is the difference between 7 and 13, and between 13 and 19?",
        answer:
          "Both differences are 6. Subtracting the earlier number from the later one gives the change from one term to the next.",
        targets: [],
      },
    ],
  },

  introduction: {
    hook:
      "A theatre has 20 seats in the first row, 23 in the second, 26 in the third and 29 in the fourth. You could add three seats row by row until you reach row 30, but that is twenty-six additions. The position-to-term rule is faster: the number of seats is 3n + 17, so row 30 has 3 × 30 + 17 = 107 seats. The pattern is not a list to continue by memory; it is a rule that turns a position into a term.",
    why:
      "Sequences are the first place algebra is used to describe a pattern rather than solve an equation. The term-to-term rule answers what happens next, and the position-to-term rule answers what happens at any position. Learners often stop at the first and then try to count their way to a distant term, which is both slow and easy to lose. This lesson separates the two rules, derives the nth term from the common difference, and uses the same position idea for geometric and quadratic patterns so that 'sequence' does not become a synonym for 'add the same number'.",
  },

  explanation: [
    {
      heading: "A sequence is ordered, and a rule explains the order",
      paragraphs: [
        "A sequence is a list of numbers in a definite order, and each number is called a term. The order matters: 2, 5, 8 is not the same sequence as 8, 5, 2. A term-to-term rule describes how to get from one term to the next. In 4, 7, 10, 13 the rule is add 3, so the next terms are 16 and 19. In 3, 6, 12, 24 the rule is multiply by 2, so the next terms are 48 and 96. The first is an arithmetic sequence because the difference is constant; the second is geometric because the ratio is constant.",
        "Writing the rule in words is not a preliminary to the mathematics; it is the mathematics. A rule that says add 3 predicts every later term, while a list of four terms predicts nothing beyond itself. The difference between consecutive terms is found by subtracting, and the ratio is found by dividing one term by the previous one. Arithmetic sequences have a common difference; geometric sequences have a common ratio. A sequence can be neither: the square numbers 1, 4, 9, 16 have differences 3, 5, 7, which change, so their rule is not a single addition.",
      ],
    },
    {
      heading: "The nth term turns a position into a term",
      paragraphs: [
        "The position of a term is its term number: the first term is at position 1, the second at position 2, and the general position is n. A position-to-term rule, or nth term, is an expression that gives the term directly from n. For the arithmetic sequence 5, 9, 13, 17 the common difference is 4, so the rule begins 4n. At n = 1, 4n gives 4, but the first term is 5, so the rule needs one more: 4n + 1. Checking n = 2 gives 9 and n = 4 gives 17, so the adjustment works for every term.",
        "The coefficient of n is the common difference because each step from one position to the next adds one more copy of that difference. The constant at the end is the adjustment that makes the first term correct. This gives a reliable method: find the difference, write that number before n, compare the first term with the value the coefficient alone gives, and add or subtract the difference. The method is not a trick to memorise; it follows from the sequence being a straight-line relationship between position and term.",
      ],
    },
    {
      heading: "Not every sequence is arithmetic",
      paragraphs: [
        "Geometric sequences multiply by a fixed ratio instead of adding a fixed difference. The sequence 3, 6, 12, 24 has ratio 2, so its nth term is 3 × 2ⁿ⁻¹: the first term is 3, and each later position doubles one more time. The exponent is n − 1 because the first term has not been doubled yet. A geometric sequence can grow quickly, and its graph curves upward rather than forming a straight line.",
        "Quadratic sequences have a constant second difference. For 1, 4, 9, 16, the first differences are 3, 5, 7 and the second differences are 2, 2, so the rule contains an n² term rather than a single n term. A learner who tries to fit 4n + something to a quadratic sequence will find that no constant works. The first step is always to inspect the differences: a constant first difference means arithmetic, a constant second difference means quadratic, and a constant ratio means geometric.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The term-to-term rule describes the step; the position-to-term rule describes the term at any position. The second is what makes a distant term reachable without listing every term before it.",
      notation: "4, 7, 10, 13, ...   ·   term-to-term: add 3   ·   position-to-term: 3n + 1   ·   n = 10 → 31",
      caption:
        "The common difference is 3, so the rule starts with 3n. At n = 1, 3n is 3 but the first term is 4, so the rule is 3n + 1. The tenth term is 31 without listing ten terms.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A table makes the position and the term separate quantities. Substituting the position into the rule must reproduce the term in the same column.",
      notation: "n: 1, 2, 3, 4   ·   term: 5, 9, 13, 17   ·   rule: 4n + 1   ·   4(1) + 1 = 5, 4(4) + 1 = 17",
      caption:
        "The table is the check on the rule. Every pair must satisfy the same expression, so a rule that fits the first term but fails the fourth has not been found; it has only been guessed.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body:
        "Plotting the terms against their positions shows whether the sequence is linear. An arithmetic sequence gives equally spaced points on a straight line; a geometric sequence curves upward.",
      notation: "positions 1, 2, 3, 4 → terms 3, 6, 12, 24   ·   ratio 2   ·   nth term 3 × 2ⁿ⁻¹",
      caption:
        "The points for 3, 6, 12, 24 do not rise by equal steps; they double. The ratio is constant even though the difference is not, which is why the sequence is geometric rather than arithmetic.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Find the nth term of the sequence 5, 9, 13, 17.",
      steps: [
        {
          move:
            "Subtract consecutive terms: 9 − 5 = 4, 13 − 9 = 4 and 17 − 13 = 4, so the common difference is 4.",
          why:
            "The common difference is the amount added at each position. It is also the coefficient of n, because moving one position along adds one more copy of that difference.",
        },
        {
          move:
            "Write 4n and test the first position: at n = 1, 4n = 4, but the first term is 5, so the rule needs an adjustment of +1.",
          why:
            "The coefficient alone gives the right step but the wrong starting value. The constant is found by comparing the first term with the value at n = 1, not by guessing.",
        },
        {
          move:
            "The rule is 4n + 1. Check n = 4: 4 × 4 + 1 = 17, so the fourth term is 17, matching the sequence.",
          why:
            "A rule is only correct if it reproduces every given term. Checking the fourth term catches an adjustment that happened to fit only the first one.",
        },
      ],
      answer: "4n + 1",
    },
    {
      id: "w2",
      prompt: "Find the next two terms and the nth term of 3, 6, 12, 24.",
      steps: [
        {
          move:
            "Divide each term by the one before it: 6 ÷ 3 = 2, 12 ÷ 6 = 2 and 24 ÷ 12 = 2, so the common ratio is 2.",
          why:
            "A geometric sequence has a constant ratio, not a constant difference. Dividing is the test that distinguishes it from an arithmetic sequence whose differences happen to grow.",
        },
        {
          move:
            "Multiply the last term by 2 twice: 24 × 2 = 48 and 48 × 2 = 96, so the next two terms are 48 and 96.",
          why:
            "The term-to-term rule applies the same multiplier at every step. Applying it twice gives the next two terms without needing the nth term first.",
        },
        {
          move:
            "The first term is 3 and each later position doubles one more time, so the nth term is 3 × 2ⁿ⁻¹. Check n = 4: 3 × 2³ = 24, the fourth term.",
          why:
            "The exponent is n − 1 because the first term has not yet been doubled. Substituting the fourth position and recovering 24 checks both the first term and the number of doublings.",
        },
      ],
      answer: "48 and 96; nth term 3 × 2ⁿ⁻¹",
    },
    {
      id: "w3",
      prompt: "The sequence is 2, 7, 12, ?, 22. Find the missing term and the nth term.",
      steps: [
        {
          move:
            "Find the common difference from the terms on either side of the gap: 7 − 2 = 5, and 22 is two steps after 12, so 22 − 12 = 10 and each step is 5.",
          why:
            "The gap does not prevent the difference being found. The known terms are enough to establish the step, and the missing term must fit the same rule.",
        },
        {
          move:
            "Add 5 to 12 to get 17, and check 17 + 5 = 22. The missing term is 17.",
          why:
            "The missing term is one step after 12, so the common difference gives it directly. The following term confirms that the same difference continues.",
        },
        {
          move:
            "The difference is 5, so start with 5n. At n = 1, 5n = 5 but the first term is 2, so subtract 3: the rule is 5n − 3. Check n = 4: 5 × 4 − 3 = 17.",
          why:
            "The coefficient is the difference and the constant adjusts the first term. Checking the missing position reproduces 17, so the rule and the gap agree.",
        },
      ],
      answer: "17; nth term 5n − 3",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The nth term is just the common difference multiplied by n.",
      whyItFails:
        "The coefficient gives the right step but not necessarily the right starting value. For 5, 9, 13, 17 the difference is 4, but 4n gives 4, 8, 12, 16, which is the sequence shifted down by one. The first term is 5, so the rule needs +1. Without the adjustment, every term is wrong even though the gaps are right.",
      correction:
        "Find the difference, write it before n, then compare the first term with the value at n = 1 and adjust by the difference. Check the rule at a later term as well.",
      contrast: {
        wrong: "5, 9, 13, 17 has nth term 4n",
        right: "5, 9, 13, 17 has nth term 4n + 1, because 4(1) + 1 = 5",
      },
    },
    {
      id: "m2",
      belief: "A sequence that grows quickly is arithmetic if the differences look like a pattern.",
      whyItFails:
        "Arithmetic sequences have a constant first difference. The sequence 3, 6, 12, 24 has differences 3, 6 and 12, which are not constant; its ratio is 2 every time. It is geometric, not arithmetic. Calling it arithmetic because the terms increase would predict 36 next, while the actual rule gives 48.",
      correction:
        "Test the differences and the ratios. A constant difference means arithmetic; a constant ratio means geometric. If neither is constant, the sequence is a different kind, such as quadratic.",
      contrast: {
        wrong: "3, 6, 12, 24 adds increasing amounts, so it is arithmetic",
        right: "3, 6, 12, 24 multiplies by 2 each time, so it is geometric",
      },
    },
    {
      id: "m3",
      belief: "The 10th term is found by substituting the term's value into the rule instead of its position.",
      whyItFails:
        "The input to an nth-term rule is the position, not the term. For 4n + 1, the 10th term is 4 × 10 + 1 = 41. Substituting 41 into the rule gives 165, which is the term at position 41, not the 10th term. The confusion reverses the direction of the rule.",
      correction:
        "Decide whether the number you have is a position or a term. To find a term, substitute its position for n. To find which position a term occupies, solve the rule equal to that term.",
      contrast: {
        wrong: "the 10th term of 4n + 1 is 4(41) + 1 = 165",
        right: "the 10th term is 4(10) + 1 = 41",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Find the nth term of 6, 10, 14, 18, and use it to find the 20th term.",
      hint:
        "The common difference is 4, so start with 4n. Compare 4n at n = 1 with the first term, then adjust.",
      answer: "4n + 2; the 20th term is 4 × 20 + 2 = 82",
      feedback: {
        correct:
          "The difference gave the coefficient, the first term gave the adjustment, and substituting n = 20 gave the distant term without listing it.",
        incorrect:
          "The difference is 4, but 4n gives 4 at n = 1, so the rule is 4n + 2. The 20th term is 82, not 80; the adjustment applies at every position.",
      },
    },
    {
      id: "p2",
      prompt: "Find the next two terms of 2, 6, 18, 54.",
      hint:
        "Divide one term by the previous term. If the ratio is constant, multiply the last term by it twice.",
      answer: "162 and 486, because the common ratio is 3",
      feedback: {
        correct:
          "You tested the ratio rather than the difference, so you recognised a geometric sequence and applied the multiplier twice.",
        incorrect:
          "The terms multiply by 3 each time: 6 ÷ 2 = 3, 18 ÷ 6 = 3 and 54 ÷ 18 = 3. The next terms are 162 and 486, not 58 and 62.",
      },
    },
    {
      id: "p3",
      prompt:
        "Find the nth term of 10, 16, 22, 28, and use it to find the 50th term.",
      hint:
        "The common difference is 6, so start with 6n. Compare 6n at n = 1 with the first term, then adjust.",
      answer:
        "6n + 4; the 50th term is 6 × 50 + 4 = 304",
      feedback: {
        correct:
          "The difference gave the coefficient, the first term gave the adjustment, and substituting n = 50 reached the distant term directly.",
        incorrect:
          "The difference is 6 and 6n gives 6 at n = 1, so the rule is 6n + 4. The 50th term is 304, not 300; the adjustment applies at every position.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "A sequence has nth term 5n − 2. Find the 12th term.",
      modelAnswer: "58",
      marking: [
        "Substitutes n = 12 into the position-to-term rule.",
        "Calculates 5 × 12 − 2 = 58.",
      ],
      check: { accepted: ["58"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "The sequence is 3, 7, 11, 15. A learner says the nth term is 4n. Explain why that rule is wrong and give the correct rule.",
      modelAnswer:
        "The common difference is 4, so the rule starts with 4n, but at n = 1, 4n gives 4 while the first term is 3. The rule must be shifted down by 1: 4n − 1. Checking n = 2 gives 7, n = 3 gives 11 and n = 4 gives 15, so the adjustment works for every term. The rule 4n would generate 4, 8, 12, 16, which has the right gaps but the wrong starting value.",
      marking: [
        "Identifies the common difference of 4 and the correct coefficient 4n.",
        "Compares 4n at n = 1 with the first term, 3, and finds the adjustment −1.",
        "Gives 4n − 1 and checks at least one later term.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Find the next term of 80, 40, 20, 10.",
      modelAnswer: "5",
      marking: [
        "Recognises the common ratio of 1/2 rather than a constant difference.",
        "Multiplies 10 by 1/2 to obtain 5.",
      ],
      check: { accepted: ["5"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A tiling pattern uses 5 tiles in figure 1, 8 tiles in figure 2 and 11 tiles in figure 3. Find the nth-term rule for the number of tiles, the number in figure 20, and the first figure that uses more than 100 tiles.",
      whyItTransfers:
        "The learner has to move from a visual growth pattern to an arithmetic sequence, then use the rule in two directions: forwards to a distant figure and backwards to find which position first crosses a bound. The last question cannot be answered by continuing the list, which is why the position-to-term rule is the tool.",
      answer:
        "The common difference is 3, so the rule is 3n + 2: at n = 1, 3n is 3 and the first figure has 5, so the adjustment is +2. Figure 20 has 3 × 20 + 2 = 62 tiles. For more than 100, solve 3n + 2 > 100, so 3n > 98 and n > 32.67; the first whole position is n = 33, with 3 × 33 + 2 = 101 tiles. Figure 32 has 98 tiles, so figure 33 is the first to exceed 100.",
      marking: [
        "Finds the common difference 3 and writes 3n + 2, checking it against at least one figure.",
        "Substitutes n = 20 to get 62 tiles.",
        "Solves or tests the inequality to find n = 33, and checks that figure 32 has 98 tiles.",
        "Explains why the answer is the first whole position rather than 32.67.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Find the next two terms of 11, 15, 19, 23.",
      answer:
        "27 and 31, because the common difference is 4. The nth term would be 4n + 7, and substituting n = 5 and n = 6 gives 27 and 31.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Find the nth term of 7, 12, 17, 22.",
      answer:
        "5n + 2. The difference is 5, and 5n at n = 1 is 5, which is 2 less than the first term.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Is 2, 6, 18, 54 arithmetic or geometric? Give the rule.",
      answer:
        "Geometric, because each term is multiplied by 3. The nth term is 2 × 3ⁿ⁻¹, and the next term is 162.",
      when: "month-later",
    },
  ],

  summary: [
    "A term-to-term rule tells you how to get the next term; a position-to-term rule gives any term directly from its position.",
    "An arithmetic sequence has a constant difference, so its nth term is of the form an + b, where a is the common difference.",
    "A geometric sequence has a constant ratio, so its nth term multiplies the first term by a power of that ratio.",
    "Find the difference or ratio first, then check the rule at more than one position; a rule that fits only the first term is a guess.",
    "A distant term is found by substituting its position, not by continuing the list.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each sequence is read as an ordered list with its positions named, and every rule is read as a sentence — for example, the nth term is four n plus one — rather than as a string of symbols.",
    },
    {
      need: "dyslexia",
      alternative:
        "The difference and the adjustment are written on separate lines, so the rule is built in two visible steps rather than appearing as one unexplained expression.",
    },
    {
      need: "motor",
      alternative:
        "Terms and rules are typed; no drag-and-drop ordering or interactive graph manipulation is required.",
    },
    {
      need: "colour-vision",
      alternative:
        "The table and the graph are both described by their values and their constant difference or ratio, so no pattern depends on colour alone.",
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
        "All explanations, examples, practice, assessments and the tiling transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for algebra and sequences.",
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
