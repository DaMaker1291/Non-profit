import type { AuthoredLesson } from "../../lesson-contract";

// VARIABLES IS WHERE A LEARNER FIRST HAS TO HOLD A CHANGING STATE IN MIND.
//
// The genome paragraph lists int, float, string and boolean, which is a
// vocabulary list. This lesson makes the state the object of study: assignment
// reads the right-hand side first, types decide what an operator means, and the
// reliable way to know what a program does is to trace its values rather than
// guess from the names.
export const COMPUTING_VARIABLES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "variables",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, programming: variables, data types, assignment and tracing",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Predict the value and type of a variable after a sequence of assignments, including reassignment.",
      evidence:
        "The learner traces each line in order and states the final value with its type, rather than reading the last line in isolation.",
    },
    {
      statement:
        "Trace a short program in a table, record each variable's value, and use the trace to explain its output.",
      evidence:
        "The learner produces a line-by-line table and an output that matches the trace, including a case where a variable is overwritten.",
    },
    {
      statement:
        "Diagnose a type error caused by treating text as a number, and repair the program.",
      evidence:
        "The learner explains that input returns a string, identifies the line where a number is needed, and adds the conversion.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["what-is-code"],
    check: [
      {
        id: "d1",
        question: "What is a program?",
        answer:
          "A program is a sequence of instructions that a computer follows in order to carry out a task.",
        targets: ["what-is-code"],
      },
      {
        id: "d2",
        question: "Why does the order of two instructions matter?",
        answer:
          "Each instruction changes the state the next one sees, so running them in a different order can produce a different result or an error.",
        targets: ["what-is-code"],
      },
    ],
  },

  introduction: {
    hook:
      "A game shows your score in the corner of the screen. It starts at zero, rises when you collect something, and is still there after the next level loads. The computer is not remembering the number because it is displayed; it is remembering it because the program gave that value a name and kept updating it. Remove the name and the score would be lost between lines.",
    why:
      "A variable is a name for a stored value. The name lets one part of a program write a value and another part read it later, which is what makes a program more than a single calculation. The type of the value decides what operations mean: adding two numbers is arithmetic, while adding two strings joins them together. Most beginner bugs are not mysterious; they are a value of the wrong type, or a variable read before it was changed.",
  },

  explanation: [
    {
      heading: "A variable is a name for a stored value",
      paragraphs: [
        "An assignment statement stores a value under a name. In score = 0, the name score is created, or its old value is replaced, and the value 0 is stored. Reading the name later gives the stored value back. The name is not the value itself; it is a label the program uses to find it, which is why two names can hold equal values without being the same storage location.",
        "Reassignment uses the same form. score = score + 10 reads the current value of score, adds 10, and stores the result back under the same name. The right-hand side is evaluated first, using the old value; only then does the name take the new value. That order is why the statement increases the score rather than producing an error about an undefined name.",
      ],
    },
    {
      heading: "Types decide what an operation means",
      paragraphs: [
        "A value has a type, and the type determines which operations are valid. Integers are whole numbers, floats are numbers with a decimal part, strings are sequences of characters in quotes, and booleans are true or false. The symbols may look the same to a reader, but 3 + 4 uses arithmetic while \"3\" + \"4\" joins two strings into \"34\".",
        "Some conversions are explicit. int(\"42\") turns the string \"42\" into the number 42, and str(42) turns the number back into text. Python will not silently add a string to an integer; it raises a TypeError instead. That error is useful: it says the program has mixed two kinds of value that do not share an operation, which is usually a sign that input has not been converted.",
      ],
    },
    {
      heading: "Assignment happens right to left",
      paragraphs: [
        "The equals sign in an assignment is not the equals sign of algebra. x = 5 means store 5 under the name x; it does not ask whether x already equals 5. A comparison uses two equals signs: x == 5 asks a question and produces True or False. Mixing them up is common because both are read as equals in ordinary English.",
        "The direction matters in a trace. After a = 5 and then b = a, both names hold 5, but they hold it independently: changing a afterwards does not change b, because the value was copied when b was assigned. For the numbers and strings in this lesson, the old value stays as it was. Lists and other mutable objects behave differently, which is a later topic, not a reason to abandon the simple rule now.",
      ],
    },
    {
      heading: "Trace the state, not the text",
      paragraphs: [
        "A trace is a table with one row per line and one column per variable. For each line, record the values after that line has run. The table turns a program from a block of text into a sequence of states, and it makes an unexpected output easy to locate: the first row where a value differs from your prediction is the line to examine.",
        "Testing is the second check. A test states an input and the output that should result, so a wrong program fails visibly instead of quietly producing a plausible number. Good tests include a normal case, a boundary case such as zero, and a case with text where a number was expected. Names help too: total_score is easier to trace than t, but a good name cannot rescue a program whose types are wrong.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "The program stores a score, increases it by reading the old value and adding ten, stores a name, and prints a sentence built from both. The print line converts the number to text because a string can only be joined to another string.",
      notation:
        "score = 0\nscore = score + 10\nname = \"Ada\"\nprint(name + \" scored \" + str(score))",
      caption:
        "Line 2 is the important one: score appears on both sides, but the right-hand score is read before the left-hand name is updated.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "After line 1, score = 0. After line 2, score = 10, because the right-hand side read the old value of 0 before storing the sum. After line 3, name = \"Ada\". The output is the sentence Ada scored 10.",
      notation: "line 2: score = 0 + 10 = 10 · line 4: \"Ada\" + \" scored \" + \"10\"",
      caption:
        "A trace records the value after each line, not the value you expect at the end. The intermediate rows are where a wrong prediction becomes visible.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "A test fixes the expected output so the program can fail honestly. The normal case expects Ada scored 10; changing line 2 to add the string \"10\" instead should raise a TypeError, which is the behaviour the test records.",
      notation: "expected: \"Ada scored 10\" · error case: score + \"10\" raises TypeError",
      caption:
        "A test that only checks the final sentence would miss a wrong intermediate score if the sentence happened to print the same text. Test the value as well as the output.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "This program asks for an age and tries to add one, but input returns a string. Adding the integer 1 to a string raises a TypeError, so the repair is to convert the input before doing arithmetic.",
      notation:
        "age = input(\"Age: \")\nnext_age = age + 1\nprint(next_age)\n\n# repair\nage = int(input(\"Age: \"))\nnext_age = age + 1",
      caption:
        "The error names the line and the types involved. Read it as evidence about the value, not as a message to hide with a try block.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Trace this program and state its output:\nx = 5\ny = x + 2\nx = y + y\nprint(x)",
      steps: [
        {
          move: "Trace line 1: x becomes 5.",
          why:
            "The first assignment creates the name and stores the value. Nothing on the right-hand side needs an earlier value.",
        },
        {
          move: "Trace line 2: y becomes 5 + 2, which is 7.",
          why:
            "The right-hand side is evaluated using the current value of x, which is 5. The result is stored under y, so x is unchanged.",
        },
        {
          move: "Trace line 3: x becomes 7 + 7, which is 14.",
          why:
            "Both references to y read the value stored on line 2. The old value of x is not used, because the name x is being overwritten rather than read.",
        },
      ],
      answer:
        "The output is 14. After line 1 x is 5, after line 2 y is 7, and after line 3 x is 14.",
    },
    {
      id: "w2",
      prompt:
        "This program crashes when the user types 12:\nage = input(\"Age: \")\nnext_age = age + 1\nExplain why and repair it.",
      steps: [
        {
          move: "Identify the type that input returns.",
          why:
            "input always returns a string, even when the characters look like a number. The value stored in age is the text \"12\", not the integer 12.",
        },
        {
          move: "Explain the operation that fails.",
          why:
            "The expression age + 1 tries to add an integer to a string. Python does not define that operation, so it raises a TypeError at the line where the addition happens.",
        },
        {
          move: "Repair the input line with an explicit conversion.",
          why:
            "Wrapping the input in int converts the text to a number before the addition: int(input(\"Age: \")). The conversion can fail for non-numeric text, which is a separate case to handle later.",
        },
      ],
      answer:
        "The program fails because input returns the string \"12\" and a string cannot be added to the integer 1. Change the first line to age = int(input(\"Age: \")) so that age holds the number 12 and next_age becomes 13.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The equals sign in a program checks whether two values are equal.",
      whyItFails:
        "A single equals sign is an assignment: it stores the value on the right under the name on the left. A comparison uses two equals signs and produces a boolean. That is why score = score + 10 is a sensible instruction rather than a false equation.",
      correction:
        "Read a single equals sign as becomes or stores. If you want to ask a question, use == and expect True or False as the result.",
      contrast: {
        wrong: "score = score + 10 asks whether the score has increased",
        right: "score = score + 10 stores the old score plus ten back in score",
      },
    },
    {
      id: "m2",
      belief: "input returns a number when the user types digits.",
      whyItFails:
        "input returns a string of characters regardless of what those characters look like. The program must convert the string to an integer or float before doing arithmetic. Without the conversion, adding 1 raises a TypeError rather than producing the next number.",
      correction:
        "Name the type at the boundary: text comes in, so convert it before it reaches the arithmetic. int(input(...)) for whole numbers, float(input(...)) when decimals are allowed.",
      contrast: {
        wrong: "typing 12 makes age the number 12",
        right: "typing 12 makes age the string \"12\" until it is converted",
      },
    },
    {
      id: "m3",
      belief: "Assigning a new value to a variable also changes every other variable that was set from it.",
      whyItFails:
        "For the numbers and strings in this lesson, assignment copies the value. After a = 5 and b = a, b holds 5; changing a to 10 does not reach back and change b. The two names refer to values independently, which is why a trace can treat them as separate columns.",
      correction:
        "Trace each name separately. If two variables should stay in step, the program must update both; assuming they are linked is how a total and a count drift apart.",
      contrast: {
        wrong: "b was set from a, so b changes when a changes",
        right: "b copied a's value at the moment of assignment and keeps it",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "What does this program print?\na = 3\nb = a\na = 10\nprint(b)",
      hint: "Trace each line. Which value was copied into b, and does the later change to a reach it?",
      answer:
        "It prints 3. b received the value of a at line 2, before a was changed; line 3 changes only a.",
      feedback: {
        correct:
          "You traced the copy at the moment of assignment instead of assuming the names stay linked.",
        incorrect:
          "b does not follow a. Look at the value a had on the line where b was assigned.",
      },
    },
    {
      id: "p2",
      prompt: "What is the value of total after this program runs?\ntotal = \"5\"\ntotal = total + \"5\"\nprint(total)",
      hint: "Both values are strings. What does + do to two strings?",
      answer:
        "The value is the string \"55\", because + joins two strings rather than adding their numerical values.",
      feedback: {
        correct:
          "You recognised that the quotes make these strings, so the operator joins rather than adds.",
        incorrect:
          "The quotes are part of the value. Adding two strings does not produce the number 10.",
      },
    },
    {
      id: "p3",
      prompt:
        "This program is meant to add one to a score but crashes:\nscore = 0\nscore = score + \"1\"\nExplain the error and give a repaired line.",
      hint: "What type is \"1\", and what type is score?",
      answer:
        "score is an integer and \"1\" is a string, so the addition is undefined and raises a TypeError. Use score = score + 1, or convert with int(\"1\") if the value really arrives as text.",
      feedback: {
        correct:
          "You named both types and repaired the operation rather than removing the addition.",
        incorrect:
          "The problem is not that score is zero. The two values on either side of + are different types.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Write a program that starts with score = 0, adds 5 to it, doubles the result by adding the score to itself, and prints the final score. State the expected output.",
      modelAnswer:
        "score = 0\nscore = score + 5\nscore = score + score\nprint(score)\n\nThe expected output is 10.",
      marking: [
        "Starts with an integer assignment and updates the same variable rather than creating unrelated names.",
        "Adds 5 before doubling, so the order of operations is correct.",
        "Doubles by reading the current value, not by adding a fixed 10 that would only work for this starting value.",
        "States the expected output as 10 and shows a trace or comment that supports it.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the value of x after this program runs?\nx = 4\nx = x + 3",
      modelAnswer: "7",
      marking: [
        "Reads the old value of x before the assignment.",
        "Gives 7 rather than 4 or 3.",
      ],
      check: { accepted: ["7", "seven"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "What is the value of len(\"12\") + 3?",
      modelAnswer: "5",
      marking: [
        "Counts the two characters in the string.",
        "Adds 3 to the length rather than converting the string to a number.",
      ],
      check: { accepted: ["5", "five"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A quiz program stores the user's answer with answer = input(\"Your answer: \") and then checks if answer == 10. A learner types 10, but the program never accepts it. Explain why, and give a repaired version of the check.",
      whyItTransfers:
        "The lesson repairs a type error in an arithmetic line. Here the same string-versus-number mistake appears in a comparison, in a program the learner has not seen. The learner must recognise the type at the input boundary and transfer the conversion to a different operation.",
      answer:
        "input returns the string \"10\", so answer == 10 compares a string with an integer and is always False. Convert before comparing, for example score = int(input(\"Your answer: \")) and then if score == 10. If non-numeric input is possible, the conversion needs its own error handling.",
      marking: [
        "Identifies that input returns a string, so the comparison is between different types.",
        "Explains why the comparison is False even when the characters are 10.",
        "Repairs the program by converting the input before the comparison.",
        "Mentions that the conversion can fail for non-numeric input, rather than assuming every answer is a number.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What is the difference between = and == in a program?",
      answer:
        "= assigns a value to a name; == compares two values and produces True or False.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does input need converting before arithmetic?",
      answer:
        "input returns a string, and arithmetic needs a number, so the string must be converted with int or float first.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Trace: total = 2; total = total + total; total = total + 1. What is the final value?",
      answer:
        "After the first line total is 2, after the second it is 4, and after the third it is 5.",
      when: "month-later",
    },
  ],

  summary: [
    "A variable is a name for a stored value; assignment evaluates the right-hand side first and then stores the result.",
    "Types decide what an operation means: adding numbers is arithmetic, while adding strings joins them.",
    "A trace records each variable after each line, which turns a prediction into something that can be checked.",
    "input returns a string, so convert it before arithmetic or comparison; most beginner type errors happen at that boundary.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every code block is short enough to be read line by line, and each trace names the line and the value in words before the code is shown.",
    },
    {
      need: "dyslexia",
      alternative:
        "Code is presented with one statement per line and the trace repeats each variable's name in full, so no step depends on remembering an abbreviation.",
    },
    {
      need: "colour-vision",
      alternative:
        "Syntax is explained by the words and structure of the statement, not by colour highlighting; the repaired line is labelled as the repair in text.",
    },
    {
      need: "motor",
      alternative:
        "The lesson requires typing, not dragging or timed clicking; every code block can be copied and run in any Python environment.",
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
        "Scope cited against the published GCSE computer science subject content for programming and data types.",
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
