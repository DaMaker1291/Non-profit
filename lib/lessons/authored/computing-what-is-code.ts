import type { AuthoredLesson } from "../../lesson-contract";

// One representative Computing lesson, authored to openmind.lesson/1.0.
//
// WHY THIS CONCEPT. "What is code?" is usually taught as vocabulary and
// finishes with a definition. A learner who can only define code cannot read a
// program, predict it, or find the line that made it wrong — and those are the
// three things every later Computing concept assumes.
export const COMPUTING_WHAT_IS_CODE: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "what-is-code",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, programming: sequence, selection and iteration",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Read a short program and predict its output without running it.",
      evidence:
        "Given a loop that adds the numbers one to five, the learner states that the output is fifteen and can point to the line where the running total changes.",
    },
    {
      statement:
        "Trace a program's variables one line at a time and record their values.",
      evidence:
        "The learner produces a table whose rows are the loop iterations and whose columns are the loop variable and the running total, and the final row matches the printed output.",
    },
    {
      statement:
        "Find a fault in a program by comparing the trace with the intended behaviour, and repair it.",
      evidence:
        "Given a loop that starts at zero or stops one iteration early, the learner names the line, states what it should be, and explains why the change fixes the output.",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question:
          "A recipe says: crack two eggs, whisk, then pour into a pan. Does the order matter?",
        answer:
          "Yes. Steps in a sequence happen in order, and swapping them changes the result — pouring unwhisked eggs into a pan is a different outcome.",
        targets: ["what-is-code"],
      },
      {
        id: "d2",
        question: "What is a variable in mathematics?",
        answer:
          "A name that stands for a value which can change, such as x in an equation.",
        targets: ["what-is-code"],
      },
    ],
  },

  introduction: {
    hook:
      "A calculator has no idea what a number is. Press the buttons in one order and you get an answer; press the same buttons in another order and you get a different one. The machine did exactly what it was told both times.",
    why:
      "Code is a list of instructions a computer follows exactly, in order, without judgement. That is why a program can be wrong while running perfectly: the computer has no idea what you meant. Learning to read code is learning to predict what the machine will do, which is the only reliable way to find out why it did something else.",
  },

  explanation: [
    {
      heading: "A program is a sequence of instructions",
      paragraphs: [
        "Code is written as a list of statements, and the computer executes them one after another, top to bottom, unless a statement changes the order. Each statement does one small thing: stores a value, adds two numbers, compares two values, prints something. Nothing happens by implication — if the program does not say it, it does not happen.",
        "That is why the same instructions in a different order produce a different result. It is also why a program that runs is not necessarily correct: the computer will faithfully execute a wrong instruction.",
      ],
    },
    {
      heading: "Variables are named boxes",
      paragraphs: [
        "A variable is a name for a stored value. Writing total = 0 puts zero in a box labelled total. Later, total = total + 5 reads the value in the box, adds five, and puts the new value back in the same box. The equals sign here is not a mathematical claim that both sides are equal; it is an instruction to store.",
        "Understanding that distinction is what makes a trace possible. After total = total + 5 you can say exactly what is in the box, and that is the state of the program at that moment.",
      ],
    },
    {
      heading: "Selection and iteration change which lines run",
      paragraphs: [
        "An if statement runs a block only when a condition is true. A for loop runs a block once for each value in a sequence. Between them they are why a program can be short and still do a great deal of work.",
        "A for loop is not a vague repetition. It names a variable, gives it each value in turn, and runs the body once per value. Knowing how many times the body runs is the difference between predicting the output and guessing it.",
      ],
    },
    {
      heading: "A trace is how you find out what a program actually did",
      paragraphs: [
        "A trace is a table with one row per iteration and one column per variable that changes. Fill it in by hand, following the program line by line. At the end, the last row tells you the values the program finished with, which is what the output must be.",
        "Tracing is also the debugging method. If the intended answer is fifteen and the trace ends at ten, the difference is not a mystery: the last iteration did not run, or the running total started in the wrong place. The trace localises the fault to a line, which a guess cannot do.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "A program that adds the numbers from one to five. Read it as five instructions plus a loop, not as a sentence.",
      notation: "total = 0\nfor n in range(1, 6):\n    total = total + n\nprint(total)",
      caption:
        "The loop variable n takes the values one, two, three, four and five. The running total is updated once per value, and the print happens after the loop.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace of the program above. Each row is one pass through the loop; the last row is the state when the loop ends.",
      notation: "n = 1  total = 1\nn = 2  total = 3\nn = 3  total = 6\nn = 4  total = 10\nn = 5  total = 15",
      caption:
        "The total after the final iteration is fifteen, so that is what the program prints. If your prediction is different, the disagreement is in one of these five rows.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "Three tests for a program that is meant to add the numbers from one to n. One normal case, one boundary case and one invalid case, because a program that works for five may fail at zero.",
      notation: "n = 5 → 15\nn = 1 → 1\nn = 0 → 0",
      caption:
        "The boundary case is the one that catches a loop written as range(1, n) instead of range(1, n + 1): it returns zero for n equal to one.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "A faulty version of the same program. The loop stops one value early, so the last addition never happens.",
      notation: "total = 0\nfor n in range(1, 5):\n    total = total + n\nprint(total)",
      caption:
        "The output is ten rather than fifteen. The fault is the upper bound of the range, not the addition and not the print.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Predict the output of this program without running it:\n\ntotal = 0\nfor n in range(1, 6):\n    total = total + n\nprint(total)",
      steps: [
        {
          move:
            "Work out how many times the loop body runs: range(1, 6) gives one, two, three, four and five, so five times.",
          why:
            "The upper bound in a range is exclusive in Python. Reading it as inclusive gives four iterations and a wrong total, which is the most common prediction error in this shape.",
        },
        {
          move:
            "Trace the running total: after one it is one, after two it is three, after three it is six, after four it is ten, after five it is fifteen.",
          why:
            "Each iteration adds the current loop value to what is already in the box. Writing the intermediate values down is what makes the final answer checkable rather than remembered.",
        },
        {
          move: "Read the print statement: it is outside the loop, so it prints once, after the last iteration, giving fifteen.",
          why:
            "Indentation decides which lines are inside the loop. A print inside the loop would print five times, once per iteration.",
        },
      ],
      answer: "The program prints 15.",
    },
    {
      id: "w2",
      prompt:
        "This program is meant to add the numbers from one to five but prints ten. Find the fault and repair it:\n\ntotal = 0\nfor n in range(1, 5):\n    total = total + n\nprint(total)",
      steps: [
        {
          move:
            "Trace the program as written: n takes one to four, giving totals one, three, six and ten.",
          why:
            "A trace turns 'it is wrong' into 'it stops after four'. Debugging starts from what the program did, not from what it was meant to do.",
        },
        {
          move:
            "Compare the trace with the intended behaviour: the addition is correct and the print is correct, but the last iteration is missing.",
          why:
            "Two of the three parts of the program behave correctly, which narrows the fault to the loop bound. Changing the addition would break a part that already works.",
        },
        {
          move: "Repair the range to range(1, 6), then re-trace: the final total is fifteen, which is the intended output.",
          why:
            "An exclusive upper bound must be one more than the last value you want. Re-tracing confirms the repair rather than assuming it.",
        },
      ],
      answer: "Change range(1, 5) to range(1, 6). The output becomes 15.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The computer understands what you meant, so small mistakes in the code will be worked out.",
      whyItFails:
        "A computer executes exactly the instructions it is given. There is no step that checks intent. A loop that runs four times instead of five is not a rough approximation of the intended program; it is a different program that happens to look similar.",
      correction:
        "Read the program as written, not as intended. If the code does not say it, it does not happen — which is what makes a trace more reliable than intuition.",
      contrast: {
        wrong: "it obviously means one to five, so the computer will add all five",
        right: "range(1, 5) stops at four, so the computer adds four numbers",
      },
    },
    {
      id: "m2",
      belief: "A program that runs without an error message is correct.",
      whyItFails:
        "An error message only reports that the program could not run. A program that produces the wrong answer runs perfectly. Ten is a perfectly valid output of the faulty loop, and the computer has no way to know that fifteen was wanted.",
      correction:
        "Correctness is tested against expected outputs, not against the absence of crashes. Test a normal case, a boundary case and an invalid case.",
      contrast: {
        wrong: "no error, so it works",
        right: "it runs and prints 10, but the test says 15, so it is wrong",
      },
    },
    {
      id: "m3",
      belief: "The equals sign in total = total + 5 is a mathematical equation.",
      whyItFails:
        "Read as an equation, total would have to equal itself plus five, which is impossible. The statement is not a claim about equality; it is an instruction to evaluate the right-hand side and store the result in the named box.",
      correction:
        "Read assignment as 'becomes'. The right-hand side is calculated first using the current value, and the result replaces what was in the variable.",
      contrast: {
        wrong: "total = total + 5 is impossible, so nothing changes",
        right: "total becomes its old value plus five",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "How many times does the body of this loop run?\n\nfor i in range(0, 4):\n    print(i)",
      hint: "List the values range(0, 4) produces before counting them.",
      answer: "Four times, printing 0, 1, 2 and 3.",
      feedback: {
        correct:
          "You listed the values the range produces rather than counting to the end number, which is the reliable method.",
        incorrect:
          "The upper bound is exclusive, so 4 is not produced. List the values first and count the list.",
      },
    },
    {
      id: "p2",
      prompt:
        "Trace this program and state its output:\n\ntotal = 1\nfor n in range(1, 4):\n    total = total + n\nprint(total)",
      hint: "Start from one, and add each of one, two and three in turn.",
      answer: "Seven: one plus one is two, plus two is four, plus three is seven.",
      feedback: {
        correct:
          "Your trace carried the running total forward from the previous iteration rather than restarting at the loop value.",
        incorrect:
          "Check whether you restarted from the loop value each time. Each iteration updates whatever is already in the box.",
      },
    },
    {
      id: "p3",
      prompt:
        "This loop is meant to print the numbers 1 to 5 but prints 1 to 4. What single change fixes it?\n\nfor i in range(1, 5):\n    print(i)",
      hint: "Decide which value is missing, then ask what the upper bound must be to include it.",
      answer: "Change the range to range(1, 6).",
      feedback: {
        correct:
          "You changed the bound rather than the starting value, which is the only edit that includes five without adding a duplicate.",
        incorrect:
          "Changing the start to zero would add a number you do not want. The missing value is at the top of the range.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Write a program that prints the total of the even numbers from 2 to 10 inclusive. Then give the trace of the running total for at least two iterations, and state the output.",
      modelAnswer:
        "total = 0\nfor n in range(2, 11, 2):\n    total = total + n\nprint(total)\n\nThe trace is: n = 2 gives total 2; n = 4 gives total 6; and so on to n = 10, which gives 30. The output is 30.",
      marking: [
        "Uses a loop with an upper bound that includes ten.",
        "Updates a running total inside the loop rather than recomputing it from scratch.",
        "Prints the total after the loop, not inside it.",
        "Gives a trace whose final value matches the stated output.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Explain why a program can run without any error message and still be wrong. Use an example from a loop in your answer.",
      modelAnswer:
        "An error message only means the program could not run. A loop with the wrong upper bound still runs and still prints a number; the number is simply not the one intended. For example, range(1, 5) adds one to four and prints ten, which is a valid output of a wrong program.",
      marking: [
        "Distinguishes a runtime error from an incorrect output.",
        "Gives a concrete loop example with a wrong bound.",
        "States that correctness is judged against expected output, not against the absence of a crash.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A vending machine program is meant to refuse a purchase when the credit is less than the price. It currently allows a purchase when the credit exactly equals the price minus one penny. Describe how you would find the fault using a trace, and what kind of test would have caught it before release.",
      whyItTransfers:
        "The setting is a state machine rather than a counting loop, and the fault is a boundary comparison rather than a range bound. The method — trace the state, compare with intended behaviour, test the boundary — is the same one the lesson taught.",
      answer:
        "Trace the credit and the decision for several inputs, including the exact boundary, and find the comparison that is off by one. A boundary test at credit equal to price minus one penny would have failed before release, which is why boundary cases belong in the test set.",
      marking: [
        "Describes tracing the credit value and the decision at each step.",
        "Identifies an off-by-one comparison as the likely fault.",
        "Names a boundary test as the test that would have caught it.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What does range(1, 4) produce, and how many times does a loop over it run?",
      answer: "It produces 1, 2 and 3, so the loop body runs three times.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain the difference between `total = total + 1` and `total == total + 1`.",
      answer:
        "The single equals sign stores a new value in total; the double equals sign compares two values and produces true or false, changing nothing.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A loop is meant to run five times but runs four. What are the two most likely causes, and how would a trace distinguish them?",
      answer:
        "An exclusive upper bound one too low, or a starting value one too high. The trace shows which values the loop variable actually took, distinguishing the two immediately.",
      when: "month-later",
    },
  ],

  summary: [
    "A program is a sequence of instructions executed exactly, in order.",
    "A variable is a named box, and the equals sign stores rather than claims equality.",
    "A loop's iteration count follows from the values it is given, not from the number written at the end.",
    "A trace turns a wrong output into a named line, which is what makes debugging possible.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Code is announced line by line with indentation stated as 'inside the loop', so block structure is audible rather than visual.",
    },
    {
      need: "low-vision",
      alternative:
        "Code renders at a large monospaced size with high contrast, and every listing is also available as plain text.",
    },
    {
      need: "dyslexia",
      alternative:
        "Program listings are kept to under six lines, and the trace is given as a table so the values do not have to be held in memory.",
    },
    {
      need: "motor",
      alternative:
        "The code assessment can be answered in a plain text box; no drag-and-drop block editor is required.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note: "All programs, explanations, examples, practice and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-computing-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution: "Scope cited against the published GCSE computer science subject content for programming.",
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
