import type { AuthoredLesson } from "../../lesson-contract";

// CONDITIONALS ARE WHERE A PROGRAM STOPS RUNNING EVERY LINE AND STARTS CHOOSING
// A PATH. The lesson makes the branch the object of study: a trace shows which
// branch ran and why, the boundary tests show that order matters, and the
// debug exercise separates `=` from `==` and independent `if`s from `elif`.
export const COMPUTING_CONDITIONALS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "conditionals",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, programming: selection, Boolean conditions, if/elif/else",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Write an if/elif/else decision that chooses exactly one branch for every possible input.",
      evidence:
        "Given a set of ranges, the learner writes a program whose branches cover the whole number line without gaps or overlaps, and whose output matches each range.",
    },
    {
      statement:
        "Trace a conditional program and state which branch runs and why.",
      evidence:
        "The learner records the value of the condition at each test, identifies the first true branch, and explains why later branches are skipped.",
    },
    {
      statement:
        "Diagnose a boundary or ordering bug in a conditional and repair it.",
      evidence:
        "The learner explains why a threshold placed in the wrong order makes a later branch unreachable, or why an independent if can print two labels, and gives a corrected program.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["variables"],
    check: [
      {
        id: "d1",
        question: "What is the difference between assigning a value and comparing two values?",
        answer:
          "Assignment stores a value under a name using one equals sign. Comparison asks whether two values are equal using two equals signs, and produces True or False.",
        targets: ["variables"],
      },
      {
        id: "d2",
        question:
          "What does this print?\\nscore = 40\\nscore = score + 5\\nprint(score)",
        answer:
          "45. The old value 40 is read, 5 is added, and the result is stored back in score before it is printed.",
        targets: ["variables"],
      },
    ],
  },

  introduction: {
    hook:
      "A thermostat does not heat the room all the time. It checks the temperature, compares it with a target, and chooses one of two actions: switch the heater on, or switch it off. That choice is a conditional. The same three-line idea runs inside a game that decides whether a player has won, a website that checks a password, and a phone that warns you when storage is nearly full.",
    why:
      "A conditional lets a program choose a path instead of running every statement in order. The condition is a Boolean expression: something that evaluates to True or False, built with comparisons such as ==, !=, < and >, and combined with and, or and not. An if runs its block only when the condition is true. An elif is tested only when every previous condition was false. An else runs when none of the earlier conditions matched. The order of the tests is part of the logic, not decoration, and most conditional bugs are boundary or ordering bugs.",
  },

  explanation: [
    {
      heading: "A condition is a question with a True or False answer",
      paragraphs: [
        "A comparison such as temperature >= 30 produces a Boolean value, True or False. The program can use that value directly in an if statement. The comparison is not the same as assignment: temperature = 30 stores 30 in the variable, while temperature == 30 asks whether the variable already holds 30. Mixing the two is a syntax error in Python, and in languages where it is not, it is a silent bug that changes the program's meaning.",
        "Conditions can be combined. and requires both sides to be true; or requires at least one; not reverses a Boolean. A range check written as 0 < score < 100 is valid Python and means both comparisons must hold. When a condition becomes long, name it in a variable with a descriptive name. That does not make the program faster, but it makes the branch readable, and a branch nobody can read is a branch nobody can check.",
      ],
    },
    {
      heading: "if, elif and else choose one path, in order",
      paragraphs: [
        "Python tests the if condition first. If it is true, the indented block runs and every later elif and else is skipped. If it is false, the next elif condition is tested, and so on. The else block runs only when no earlier condition was true. This is why an elif chain can print at most one label, while a series of separate if statements can print several.",
        "The order of the tests matters when the ranges overlap. If the first condition is temperature >= 20 and the second is temperature >= 30, a temperature of 35 matches the first test, prints the warmer label and never reaches the hotter one. The more specific or more extreme condition must come first. Writing the ranges in ascending order is a common habit, but it is wrong for an elif chain that is meant to classify by threshold.",
      ],
    },
    {
      heading: "Boundaries decide whether a value belongs to this branch or the next",
      paragraphs: [
        "A boundary is the value at which one range ends and another begins. The choice between > and >= changes which branch owns that value. For a classification where 30 should count as hot, the test must be >= 30; with > 30, a temperature of exactly 30 falls through to the warm branch. Neither operator is universally correct: the specification of the ranges decides, and the test cases must include the boundary itself.",
        "A complete set of branches has no gaps and no overlaps. For a temperature classifier, the branches might be below 20, from 20 to 29, and 30 or above. If the first test is < 20, the second is < 30 and the else handles the rest, every number has exactly one home. Testing 19, 20, 29, 30 and 35 checks both boundaries and the two interior regions. Testing only 25 proves almost nothing.",
      ],
    },
    {
      heading: "Trace the condition, not just the output",
      paragraphs: [
        "A trace for a conditional records the value of each condition and the branch it selects. For temperature = 26, the first test 26 >= 30 is False, the second 26 >= 20 is True, and the program prints warm. The trace makes the decision visible: a learner who writes only the output can be right for the wrong reason, while a learner who records False then True has shown why the second branch ran.",
        "The same trace exposes unreachable branches. If the first condition is always true for every value that reaches it, the later branches can never run. That is not a runtime error; the program simply behaves as if the later code did not exist. Reading the trace is how you notice that a branch is dead, and testing a value that should have reached it is how you prove the bug.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "This program classifies a temperature into one of three labels. The tests are ordered from the highest threshold downwards, so a hot day cannot be caught by the warm branch first.",
      notation:
        "temperature = 26\\nif temperature >= 30:\\n    print(\\\"hot\\\")\\nelif temperature >= 20:\\n    print(\\\"warm\\\")\\nelse:\\n    print(\\\"cool\\\")",
      caption:
        "Only one branch can run. If the first condition is true, the elif and else are skipped entirely.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "Trace the program with temperature = 26. The first comparison is false, the second is true, and the else is skipped because a branch has already run.",
      notation:
        "temperature = 26 · 26 >= 30 = False · 26 >= 20 = True · output = \\\"warm\\\"",
      caption:
        "The trace records the value of each test, not just the final print. That is how the branch is justified.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "Five tests cover the two boundaries and the three regions. The values 30 and 20 are the important ones: they are where an incorrect operator changes the branch.",
      notation:
        "35 → \\\"hot\\\" · 30 → \\\"hot\\\" · 29 → \\\"warm\\\" · 20 → \\\"warm\\\" · 19 → \\\"cool\\\"",
      caption:
        "Testing only 26 would pass even if the boundary operators were wrong. The boundary tests are what distinguish a correct classifier from a plausible one.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "This program is meant to print one label, but a temperature of 35 prints both warm and hot. The two if statements are independent, so the first one does not stop the second from running.",
      notation:
        "temperature = 35\\nif temperature >= 20:\\n    print(\\\"warm\\\")\\nif temperature >= 30:\\n    print(\\\"hot\\\")\\n\\n# repair: use elif so only one branch runs\\nif temperature >= 30:\\n    print(\\\"hot\\\")\\nelif temperature >= 20:\\n    print(\\\"warm\\\")\\nelse:\\n    print(\\\"cool\\\")",
      caption:
        "The bug is not the comparison; it is the independence of the two branches and the order of the thresholds.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Trace this program and state its output:\\ntemperature = 18\\nif temperature >= 30:\\n    print(\\\"hot\\\")\\nelif temperature >= 20:\\n    print(\\\"warm\\\")\\nelse:\\n    print(\\\"cool\\\")",
      steps: [
        {
          move: "Evaluate the first condition: 18 >= 30 is False.",
          why:
            "The if branch is tested first. A false result means its block is skipped and the program moves to the next test.",
        },
        {
          move: "Evaluate the second condition: 18 >= 20 is False.",
          why:
            "The elif is reached only because the first test failed. It is also false, so the warm branch is skipped.",
        },
        {
          move: "No earlier branch ran, so execute the else block and print cool.",
          why:
            "The else is the fallback for every value that matched none of the tests. It is not a test of its own.",
        },
      ],
      answer:
        "Both threshold tests are false, so the else branch runs and the output is cool.",
    },
    {
      id: "w2",
      prompt:
        "This program should print one label for any temperature, but 35 prints two:\\ntemperature = 35\\nif temperature >= 20:\\n    print(\\\"warm\\\")\\nif temperature >= 30:\\n    print(\\\"hot\\\")\\nExplain the bug and repair it.",
      steps: [
        {
          move:
            "Notice that the two if statements are independent, so the first does not prevent the second from running.",
          why:
            "An elif is skipped once an earlier branch has run. A new if starts a new decision, so both blocks can execute for the same value.",
        },
        {
          move:
            "Check the order of the thresholds: the lower threshold is tested first.",
          why:
            "A value of 35 satisfies the lower test, so it prints warm before the program ever considers the hot branch. Even with elif, this order would make hot unreachable for values that also satisfy warm.",
        },
        {
          move:
            "Repair the program by testing the higher threshold first and using elif for the lower one.",
          why:
            "The most specific condition must be evaluated before the more general one, and elif ensures that exactly one branch runs.",
        },
      ],
      answer:
        "The two if statements are independent, and the lower threshold is tested first. Test temperature >= 30 first, then elif temperature >= 20, then else, so 35 prints only hot.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A single equals sign can be used for comparison; == is just a style choice.",
      whyItFails:
        "In Python, = assigns a value and == compares two values. Writing if score = 90 is a syntax error because the condition must produce True or False, not store a value. In a language that allows assignment inside a condition, the same mistake can silently change the variable instead of testing it.",
      correction:
        "Read = as 'becomes' and == as 'is equal to'. If the line is asking a question, it needs two equals signs.",
      contrast: {
        wrong: "if score = 90:",
        right: "if score == 90:",
      },
    },
    {
      id: "m2",
      belief: "elif is just another way to write if, so it makes no difference to the output.",
      whyItFails:
        "An elif is tested only when every earlier condition was false, and it is skipped once a branch has run. A separate if always gets tested. Two independent if statements can therefore print two labels for one value, while an if/elif chain prints at most one.",
      correction:
        "Choose elif when the conditions are alternatives that should exclude one another. Choose separate if statements only when more than one action genuinely should happen.",
      contrast: {
        wrong: "if hot: print hot; if warm: print warm (both can run)",
        right: "if hot: print hot; elif warm: print warm (only one runs)",
      },
    },
    {
      id: "m3",
      belief: "The order of the tests does not matter, because the program checks them all.",
      whyItFails:
        "An if/elif chain stops at the first true branch. If a broad condition such as temperature >= 20 is tested before a narrower one such as temperature >= 30, every hot value is caught by the broad test and the hot branch is never reached.",
      correction:
        "Order the tests from the most specific or most extreme range to the least. Then test a value from every range, including both boundaries, to prove each branch is reachable.",
      contrast: {
        wrong: "test >= 20 before >= 30, so 35 is labelled warm",
        right: "test >= 30 before >= 20, so 35 is labelled hot",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Trace this program for n = 7 and state the output:\\nn = 7\\nif n > 10:\\n    print(\\\"large\\\")\\nelif n > 5:\\n    print(\\\"medium\\\")\\nelse:\\n    print(\\\"small\\\")",
      hint:
        "Evaluate n > 10 first. If it is false, evaluate n > 5 before deciding on the else.",
      answer:
        "7 > 10 is false, and 7 > 5 is true, so the program prints medium. The else is skipped.",
      feedback: {
        correct:
          "You evaluated both tests in order and stopped at the first true branch.",
        incorrect:
          "The first test is false, but the second is true. The else only runs when every test is false.",
      },
    },
    {
      id: "p2",
      prompt:
        "A score of exactly 50 should count as a pass. The program uses if score > 50: print(\\\"pass\\\"). What is wrong, and how do you repair it?",
      hint:
        "Decide which side of the boundary 50 belongs to, then choose > or >=.",
      answer:
        "The test excludes 50, so a learner who scores exactly 50 is not given the pass label. Change the comparison to score >= 50 so the boundary value is included.",
      feedback: {
        correct:
          "You identified the boundary as the bug and changed the operator rather than adding a special case.",
        incorrect:
          "The issue is exactly at 50. Decide whether 50 should satisfy the condition, then choose the operator that includes it.",
      },
    },
    {
      id: "p3",
      prompt:
        "Why can this program print two labels for one value?\\nif temperature >= 20:\\n    print(\\\"warm\\\")\\nif temperature >= 30:\\n    print(\\\"hot\\\")",
      hint:
        "Does the first if stop the second one from being tested?",
      answer:
        "The two if statements are independent, so both conditions are tested. A temperature of 35 satisfies both, so both blocks run. Using elif for the second test makes the branches alternatives and ensures only one label prints.",
      feedback: {
        correct:
          "You explained the independence of the two decisions, not just the output.",
        incorrect:
          "There is no elif between them. Each if starts a new decision, so the first true branch does not skip the second.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Write a Python program that reads a score and prints excellent for a score of 90 or more, pass for a score of 50 or more but below 90, and retry for anything below 50. Use if, elif and else, and make sure the boundaries 90 and 50 are included in the correct branches.",
      modelAnswer:
        "score = int(input(\\\"Score: \\\"))\\nif score >= 90:\\n    print(\\\"excellent\\\")\\nelif score >= 50:\\n    print(\\\"pass\\\")\\nelse:\\n    print(\\\"retry\\\")",
      marking: [
        "Tests the higher boundary first, so a score of 95 is not caught by the pass branch.",
        "Uses >= for both 90 and 50 so the boundary values are included in the intended branches.",
        "Uses elif rather than a second independent if, so exactly one label is printed.",
        "Has an else that handles every score below 50, including zero.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What is printed by this program?\\nn = 20\\nif n > 20:\\n    print(\\\"over\\\")\\nelif n == 20:\\n    print(\\\"exactly\\\")\\nelse:\\n    print(\\\"under\\\")",
      modelAnswer: "exactly",
      marking: [
        "Evaluates n > 20 as false for n = 20.",
        "Recognises that the elif equality test is true, so its branch runs.",
      ],
      check: { accepted: ["exactly"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Explain why replacing the elif in an if/elif/else chain with a second if can change the program's output, even when the conditions themselves are unchanged.",
      modelAnswer:
        "An elif is tested only when every earlier condition was false, and it is skipped once a branch has run. A second if is a new decision, so it is tested even if the first branch already ran. If a value satisfies both conditions, the chain prints one label while the two independent ifs print two. The conditions are the same, but the control flow is different.",
      marking: [
        "States that elif is skipped after an earlier true branch.",
        "States that a separate if is always tested, regardless of earlier branches.",
        "Gives an example where one value satisfies both conditions and produces two outputs.",
        "Connects the difference to control flow, not to the truth value of the conditions.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A traffic light controller receives a colour name and must print stop for red, ready for amber, and go for green. Any other input must print unknown. Write the conditional structure and explain how you ordered the branches.",
      whyItTransfers:
        "The lesson uses numeric thresholds. Here the conditions are equality tests on strings, and the final case is an unrecognised input rather than a numeric range. The same if/elif/else structure applies, but the learner must choose equality rather than ordering and must include a fallback that is not a threshold.",
      answer:
        "colour = input(\\\"Colour: \\\")\\nif colour == \\\"red\\\":\\n    print(\\\"stop\\\")\\nelif colour == \\\"amber\\\":\\n    print(\\\"ready\\\")\\nelif colour == \\\"green\\\":\\n    print(\\\"go\\\")\\nelse:\\n    print(\\\"unknown\\\") The branches are equality tests, so their order does not create overlapping ranges; the else handles every value that is not one of the three recognised colours.",
      marking: [
        "Uses == for string comparisons, not =.",
        "Uses elif so exactly one label is printed.",
        "Includes an else for an unrecognised colour.",
        "Explains that equality tests do not have the same ordering hazard as overlapping numeric ranges.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What is the difference between = and == in Python?",
      answer:
        "= assigns a value to a name; == compares two values and produces True or False.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "When is the else block of an if/elif/else chain executed?",
      answer:
        "Only when none of the if or elif conditions was true.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why should the condition temperature >= 30 come before temperature >= 20 in an elif chain?",
      answer:
        "Because a value of 30 or more also satisfies the lower test, so the lower branch would catch it first and the hotter branch would never run.",
      when: "month-later",
    },
  ],

  summary: [
    "A condition is a Boolean expression that evaluates to True or False; == compares, while = assigns.",
    "An if/elif/else chain tests conditions in order and runs at most one branch, skipping the rest once a branch has run.",
    "Order matters when ranges overlap: test the most specific or highest threshold first, and include the boundary values deliberately.",
    "A complete conditional covers every possible input and is checked at both boundaries, not only in the middle of a range.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every code listing is also described in prose, and the trace is written as a sequence of values and true/false results rather than as an image.",
    },
    {
      need: "colour-vision",
      alternative:
        "Branches are labelled by name (if, elif, else) and by their output, never by colour alone.",
    },
    {
      need: "dyslexia",
      alternative:
        "The syntax is introduced one construct at a time, with the same short example extended rather than replaced, and indentation is described explicitly because Python uses it as syntax.",
    },
    {
      need: "motor",
      alternative:
        "The assessment accepts typed code; no drag-and-drop or timed interaction is required.",
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
        "All explanations, examples, practice and assessments are original to OpenMind.",
    },
    {
      sourceId: "gcse-computing-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE computer science subject content for selection.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-08",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
