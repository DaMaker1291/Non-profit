import type { AuthoredLesson } from "../../lesson-contract";

// LOOPS ARE WHERE A PROGRAM STOPS BEING A LIST OF STATEMENTS AND STARTS HAVING
// A SHAPE. The genome note names for and while; this lesson makes the choice
// between them depend on the task, makes the trace the way to see an accumulator
// working, and treats the boundary as the place loops actually fail.
export const COMPUTING_LOOPS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "loops",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, programming: iteration, for and while loops, tracing",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Choose between a for loop and a while loop for a given task and justify the choice.",
      evidence:
        "The learner selects for when the number of repetitions is known or a sequence is being processed, and while when repetition depends on a condition that may change unpredictably.",
    },
    {
      statement:
        "Trace a loop line by line, recording the loop variable and any accumulator, and state the output.",
      evidence:
        "The learner produces a table of values for each iteration and an output that matches the trace, including the final value after the loop ends.",
    },
    {
      statement:
        "Identify and repair an off-by-one or non-terminating loop.",
      evidence:
        "The learner explains why the boundary excludes or includes one extra value, or why the condition never becomes false, and gives a corrected loop.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["variables"],
    check: [
      {
        id: "d1",
        question: "What does an assignment statement do?",
        answer:
          "It stores a value under a name, evaluating the right-hand side before updating the name on the left.",
        targets: ["variables"],
      },
      {
        id: "d2",
        question: "What is the value of total after: total = 3; total = total + 2?",
        answer:
          "5, because the old value 3 is read, 2 is added, and the result is stored back in total.",
        targets: ["variables"],
      },
    ],
  },

  introduction: {
    hook:
      "A program that prints one name is useful once. A program that prints every name on a register needs the same instruction to run once per name, without the programmer writing it out a hundred times. A loop is that instruction: a block of code that repeats, with a variable that changes each time so the repetitions are not identical.",
    why:
      "Iteration is what lets a program handle data whose size it does not know in advance. A for loop walks through a known sequence, such as a range of numbers or the items in a list. A while loop repeats as long as a condition is true, which suits a task whose end depends on what happens inside it. The accumulator pattern, a variable updated on every pass, is the shape behind totals, counts and searches. Most loop bugs are boundary bugs, and a trace is how you see them.",
  },

  explanation: [
    {
      heading: "A loop repeats a block, with a variable that changes",
      paragraphs: [
        "A for loop takes a sequence and runs its body once for each item. In for n in range(1, 6), n takes the values 1, 2, 3, 4 and 5 in turn, and the body runs five times. The loop variable is reassigned automatically at the start of each pass, which is why changing it inside the body does not change the sequence. The range's stop value is excluded, a rule that causes more bugs than any other part of the syntax.",
        "A while loop repeats as long as its condition is true. It does not have a built-in sequence, so the program must change something inside the body that eventually makes the condition false. If it does not, the loop runs forever. That is not a rare failure mode; it is the defining risk of while, and the reason a counter or a sentinel value usually appears in the body.",
      ],
    },
    {
      heading: "Choose the loop from the task, not from habit",
      paragraphs: [
        "Use a for loop when the number of repetitions is known before the loop starts, or when every item in a sequence must be processed. Summing a list, printing a times table and checking each character in a string are for-loop tasks. The sequence already defines the boundary, so the programmer does not have to maintain a counter by hand.",
        "Use a while loop when the end depends on a condition rather than a count: keep asking until the user enters zero, keep rolling until the total exceeds a target, keep searching while there are items left. A for loop can imitate this with break, but a while loop states the condition directly. The choice is about which form makes the termination condition visible, because that is the part a reader must be able to check.",
      ],
    },
    {
      heading: "The accumulator pattern: a variable updated every pass",
      paragraphs: [
        "Many loops build a result rather than print one. The pattern is always the same: create the starting value before the loop, update it inside the loop, and use it after the loop. For a total, start at 0 and add each item. For a count, start at 0 and add 1 when a condition holds. For a maximum, start with the first item or a very small value and replace it when a larger one appears.",
        "The starting value is not decoration. A total must start at 0 because 0 is the identity for addition; a product must start at 1 because 1 is the identity for multiplication. Starting a total at the first item and then also adding the first item inside the loop is a common double-count. The trace makes this visible: the accumulator column shows the value after every pass, so a wrong start appears on the first row.",
      ],
    },
    {
      heading: "Boundaries are where loops fail",
      paragraphs: [
        "An off-by-one error means the loop runs one time too many or one time too few. In Python, range(1, 5) produces 1, 2, 3 and 4, not 5. If the task is to include 5, the stop must be 6. The same issue appears with list indices: the last valid index is one less than the length, so looping to the length includes an index that does not exist.",
        "A trace and a boundary test are the two checks that catch this. Trace a small case by hand and compare it with the output. Then test the boundaries deliberately: an empty sequence, a sequence with one item, and a case at the exact limit. A loop that works for five items may still fail for zero, and the zero case is often the one a user meets first.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "This program adds the numbers 1 to 5. The total is created before the loop, updated on every pass, and printed once after the loop finishes.",
      notation:
        "total = 0\nfor n in range(1, 6):\n    total = total + n\nprint(total)",
      caption:
        "range(1, 6) gives 1, 2, 3, 4 and 5. The stop value 6 is excluded, which is why the loop includes 5.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "Before the loop, total = 0. On the first pass n = 1, so total = 0 + 1 = 1. On the second pass n = 2, so total = 1 + 2 = 3. The passes continue until n = 5, after which total = 15 and the loop ends.",
      notation: "n = 1 → total = 1 · n = 2 → total = 3 · n = 5 → total = 15",
      caption:
        "The trace records the values after each pass. The final row is the value the program prints, not the value at the start of the last pass.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "The normal test expects 15 for range(1, 6). A boundary test with range(1, 1) expects 0, because the range is empty and the body never runs. A one-item test with range(1, 2) expects 1. These three cases separate a correct loop from one that is off by one.",
      notation: "range(1, 6) → 15 · range(1, 1) → 0 · range(1, 2) → 1",
      caption:
        "An empty range is not a broken test; it is the case that catches a loop that assumes at least one item.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "This while loop never ends because count is never changed inside the body. The condition count < 5 stays true forever, so the program prints 0 repeatedly. The repair adds an update to count on every pass.",
      notation:
        "count = 0\nwhile count < 5:\n    print(count)\n\n# repair\ncount = 0\nwhile count < 5:\n    print(count)\n    count = count + 1",
      caption:
        "A while loop needs a change that moves the condition towards false. Without it, the loop is valid syntax and an infinite program.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Trace this program and state its output:\ntotal = 0\nfor n in range(1, 4):\n    total = total + n\nprint(total)",
      steps: [
        {
          move: "Write the values the loop variable takes: 1, 2 and 3.",
          why:
            "range(1, 4) starts at 1 and stops before 4, so the body runs three times. Reading the stop value as inclusive would produce one extra pass.",
        },
        {
          move: "Update the accumulator after each pass: 1, then 3, then 6.",
          why:
            "Each pass adds the current n to the previous total. The accumulator carries its value from one pass to the next, which is what makes the loop build a single result.",
        },
        {
          move: "Print the total after the loop ends.",
          why:
            "The print is outside the loop, so it runs once, after the final update. Printing inside the loop would show every intermediate total instead of the answer.",
        },
      ],
      answer:
        "The loop runs for n = 1, 2 and 3, giving totals of 1, 3 and 6. The output is 6.",
    },
    {
      id: "w2",
      prompt:
        "This program is meant to print the numbers 0 to 4, but it never stops:\ncount = 0\nwhile count < 5:\n    print(count)\nExplain why and repair it.",
      steps: [
        {
          move: "Identify the condition that controls the loop.",
          why:
            "The loop continues while count < 5. For it to end, count must reach 5 or more at some point.",
        },
        {
          move: "Check what changes count inside the body.",
          why:
            "Nothing changes count, so it stays 0 forever. The condition is always true, and the loop has no route to termination.",
        },
        {
          move: "Add an update that moves count towards the boundary.",
          why:
            "Adding count = count + 1 at the end of the body makes count rise by one each pass, so the condition eventually becomes false after the pass with count = 4.",
        },
      ],
      answer:
        "The loop never ends because count is never updated. Add count = count + 1 inside the body, after the print, so the loop runs for 0, 1, 2, 3 and 4 and then stops.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "range(1, 5) includes 5.",
      whyItFails:
        "The second argument is the stop value and is excluded. range(1, 5) produces 1, 2, 3 and 4. A loop meant to include 5 must use range(1, 6). This is the most common off-by-one error in Python, and it produces an answer that is wrong by exactly the missing term.",
      correction:
        "Read range(start, stop) as 'start is included, stop is not'. Test the boundary with a one-item range and count the passes before trusting a longer one.",
      contrast: {
        wrong: "range(1, 5) gives 1, 2, 3, 4, 5",
        right: "range(1, 5) gives 1, 2, 3, 4; use range(1, 6) to include 5",
      },
    },
    {
      id: "m2",
      belief: "A while loop repeats forever by nature.",
      whyItFails:
        "A while loop repeats while its condition is true, and it stops when the condition becomes false. It only runs forever when nothing inside the body changes the condition. The infinite loop is a bug in the body, not a property of while.",
      correction:
        "For every while loop, name the thing that changes and the value at which the condition becomes false. If you cannot name both, the loop is not finished.",
      contrast: {
        wrong: "while always loops forever",
        right: "while stops when its condition becomes false; the body must make that happen",
      },
    },
    {
      id: "m3",
      belief: "A for loop automatically adds up the items it visits.",
      whyItFails:
        "The for loop only assigns each item to the loop variable and runs the body. It does not accumulate anything unless the body updates an accumulator. Without total = total + n, the loop visits every number and produces no total at all.",
      correction:
        "Separate the loop from the calculation. The loop supplies the sequence; the accumulator, created before the loop and updated inside it, produces the result.",
      contrast: {
        wrong: "for n in range(1, 6) already calculates the sum",
        right: "the loop visits n; total = total + n builds the sum",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",        prompt: "The range below starts at 3 and stops before 8. Count the passes the body makes:\nfor i in range(3, 8):\n    print(i)",
      hint: "List the values range(3, 8) produces before counting them.",
      answer:
        "It runs five times, for i = 3, 4, 5, 6 and 7. The stop value 8 is excluded.",
      feedback: {
        correct:
          "You listed the values rather than subtracting the endpoints, which is the reliable way to count a range.",
        incorrect:
          "The stop value is not included. Count the values 3, 4, 5, 6 and 7.",
      },
    },
    {
      id: "p2",
      prompt:
        "What is the value of total after this program runs?\ntotal = 0\nfor n in range(1, 4):\n    total = total + n\nprint(total)",
      hint: "Trace the accumulator after each pass: 1, then add 2, then add 3.",
      answer:
        "The total is 6, because the passes add 1, then 2, then 3. The loop stops before 4.",
      feedback: {
        correct:
          "You traced the accumulator across passes instead of adding the endpoints.",
        incorrect:
          "Add each value the loop visits in turn: 1 + 2 + 3. The value 4 is not visited.",
      },
    },
    {
      id: "p3",
      prompt:
        "This loop never stops:\ncount = 0\nwhile count < 3:\n    print(count)\nExplain the bug and give the repaired body.",
      hint: "What has to change for count < 3 to become false?",
      answer:
        "count is never updated, so the condition stays true. Add count = count + 1 inside the body after the print, so count reaches 3 and the loop ends.",
      feedback: {
        correct:
          "You named the missing update and placed it inside the body.",
        incorrect:
          "Changing the condition outside the loop does not help while it is running. The body must move count towards the boundary.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Write a program that adds the even numbers from 2 to 10 inclusive and prints the total. Use a loop and an accumulator, and state the expected output.",
      modelAnswer:
        "total = 0\nfor n in range(2, 11, 2):\n    total = total + n\nprint(total)\n\nThe expected output is 30.",
      marking: [
        "Creates an accumulator before the loop and updates it inside the loop.",
        "Uses a range that starts at 2 and includes 10, either with a step of 2 or an explicit condition.",
        "Prints once after the loop rather than inside it.",
        "States the expected output as 30 and supports it with a trace or a check.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What does this loop print?\nfor i in range(2, 5):\n    print(i)",
      modelAnswer: "2, 3, 4",
      marking: [
        "Lists 2, 3 and 4.",
        "Excludes 5 because it is the stop value.",
      ],
      check: {
        accepted: ["2 3 4", "2, 3, 4", "2\n3\n4", "234"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "How many times does the body run?\nx = 0\nwhile x < 3:\n    x = x + 1",
      modelAnswer: "3",
      marking: [
        "Counts the passes for x = 0, 1 and 2.",
        "Recognises that the loop stops when x reaches 3.",
      ],
      check: { accepted: ["3", "three"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A program must ask the user for numbers until they enter 0, then print how many numbers were entered. Explain why a for loop is unsuitable, write the while loop's condition, and describe what must change inside the body.",
      whyItTransfers:
        "The lesson uses a while loop with a counter that the programmer controls. Here the termination depends on input the program cannot predict, so the learner must choose the loop form for a new reason and identify the state that changes. The code shape transfers, but the boundary is no longer a number the programmer chooses.",
      answer:
        "A for loop is unsuitable because the number of repetitions is not known before the program runs; it depends on when the user enters 0. Use a while loop with a condition such as number != 0, read a number inside the body, and update the count only when the number is not 0. The input changes the condition, which is what allows the loop to end.",
      marking: [
        "Explains that the number of repetitions is unknown before the loop starts.",
        "Chooses a while loop and gives a condition that becomes false on the sentinel value.",
        "Describes reading a new value inside the body so the condition can change.",
        "Updates the count only for valid numbers, not for the terminating zero.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "When should you use a for loop rather than a while loop?",
      answer:
        "When the number of repetitions is known or every item in a sequence must be processed.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What values does range(4, 9) produce?",
      answer: "4, 5, 6, 7 and 8; the stop value 9 is excluded.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Trace: total = 0; for n in range(1, 4): total = total + n. What is total?",
      answer:
        "6, because the passes add 1, then 2, then 3; the loop stops before 4.",
      when: "month-later",
    },
  ],

  summary: [
    "A for loop repeats over a known sequence; a while loop repeats while a condition is true and needs a change inside the body to end.",
    "An accumulator is created before the loop, updated on each pass, and used after the loop; its starting value must be the identity for the operation.",
    "range(start, stop) includes start and excludes stop, which is the usual source of off-by-one errors.",
    "Trace a small case and test the boundaries — empty, one item, exact limit — before trusting a loop.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each loop is read line by line with its indentation described, and every trace names the variable and value in words before the code is shown.",
    },
    {
      need: "dyslexia",
      alternative:
        "Code is kept to one statement per line, and the trace is presented as a sequence of short lines rather than a dense table.",
    },
    {
      need: "colour-vision",
      alternative:
        "The loop body and the statement after the loop are distinguished by indentation and labels, not by colour highlighting.",
    },
    {
      need: "motor",
      alternative:
        "The lesson requires typing, not dragging blocks or timed clicking; every program can be copied and run in any Python environment.",
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
        "All explanations, examples, practice and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-computing-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE computer science subject content for programming and iteration.",
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
