import type { AuthoredLesson } from "../../lesson-contract";

// LISTS ARE WHERE A LEARNER FIRST HAS TO HOLD A COLLECTION IN MIND.
//
// The lesson is organised around the two errors that survive a vocabulary
// test: treating the first index as 1, and using the length as if it were the
// last index. The code lab makes the boundary observable, and the transfer
// task uses a list of sensor readings rather than another list of names.
export const COMPUTING_LISTS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "lists-arrays",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference:
      "GCSE Computer Science, programming: lists, zero-based indexing, iteration, list methods and fixed-size arrays",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Access and update items in a Python list by index, and predict the IndexError caused by reading past the end.",
      evidence:
        "The learner states that a three-item list has indices 0, 1 and 2, updates an item by its index, and explains why index 3 raises IndexError.",
    },
    {
      statement:
        "Traverse a list to calculate a total or select items, using the length correctly rather than treating it as the last index.",
      evidence:
        "The learner writes a loop that visits every item once and prints 311 for the scores used in the lesson, not 239 from a loop that starts at index 1.",
    },
    {
      statement:
        "Choose between a Python list and a fixed-size array, and use append when the collection must grow.",
      evidence:
        "The learner explains that a list can change size and that append adds at the end, while an array has a fixed size and a declared element type.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["variables", "loops"],
    check: [
      {
        id: "d1",
        question: "What is the value of total after this program runs?\ntotal = 0\ntotal = total + 7",
        answer:
          "Seven. The assignment reads the old value, adds seven and stores the result back under the same name.",
        targets: ["variables"],
      },
      {
        id: "d2",
        question: "How many times does the body of for n in range(3): run?",
        answer:
          "Three times, with n equal to 0, 1 and 2. The upper bound is excluded, so range(3) does not produce a 3.",
        targets: ["loops"],
      },
    ],
  },

  introduction: {
    hook:
      "A teacher marks a stack of tests. Each score belongs to one learner, the order matters, and the same operation is applied to every score. Writing a separate variable for each paper would not survive a class of thirty, let alone a school. A list gives the whole collection one name and gives every item a numbered position.",
    why:
      "A Python list is an ordered collection. The position of an item is its index, and Python counts the first position as 0. That single convention explains both the first item and the last-valid index. A list can grow with append and shrink with remove, while an array is usually a fixed-size collection whose length is decided when it is created. The difference matters: a list is convenient when the number of items changes, while a fixed array makes the size a promise the program can rely on. This lesson uses the index as a position, not as a count, then builds traversal and aggregation on that distinction.",
  },

  explanation: [
    {
      heading: "An index is a position, and the first position is zero",
      paragraphs: [
        "In a Python list, square brackets hold the items and commas separate them. scores = [72, 85, 64, 90] creates four items. The item at index 0 is 72, index 1 is 85, index 2 is 64 and index 3 is 90. The number in the brackets is an offset from the start, so the first item is zero steps from the beginning. Reading scores[1] therefore gives the second item, not the first.",
        "The valid indices of a list of length n are 0 through n − 1. A four-item list has indices 0 to 3; index 4 is one past the end and raises IndexError. A negative index counts from the end: scores[-1] is the last item, scores[-2] the second last. Negative indices are convenient, but they do not change the rule that every position must exist. An empty list has no valid index at all, not even zero.",
      ],
    },
    {
      heading: "Traverse the items, not the indices, when order is not the point",
      paragraphs: [
        "A for loop can visit every item directly: for score in scores: uses each value in turn, without asking the learner to manage an index. That is the clearest form when the job is to add the values, count them or find the largest. The loop body runs once per item, so a four-item list produces four iterations. The variable score is a copy of the current value, not a permanent reference to the list.",
        "Use an index loop when the position itself matters, such as replacing every item or comparing item i with item i + 1. The safest index loop is for i in range(len(scores)): because range stops before its upper bound. Writing range(1, len(scores)) skips index 0, while range(len(scores) + 1) eventually asks for an index that does not exist. The boundary is not a detail to memorise after the fact; it follows from the length being a count and the last index being count − 1.",
      ],
    },
    {
      heading: "Methods change the list; their return value is often None",
      paragraphs: [
        "append adds one item to the end and changes the existing list. scores.append(95) gives the list five items; it does not create a second list. The method returns None, so scores = scores.append(95) replaces the list with None and loses every score. The same pattern appears with sort and remove: the useful result is the changed collection, not the method's return value.",
        "Index assignment replaces an item without changing the length: scores[0] = 80 changes 72 to 80. Slicing copies a section: scores[1:3] gives the items at indices 1 and 2, and the stop index is excluded. An empty slice is possible, but an out-of-range index in an assignment is not silently ignored. Read the list before and after a method call, and state which object changed.",
      ],
    },
    {
      heading: "A list and an array make different promises",
      paragraphs: [
        "A Python list is dynamic: append and remove can change its length while the program runs, and its items can be of different types. That flexibility is useful for a queue of messages or a growing set of readings. A fixed-size array is declared with a length and usually one element type; the program cannot add a fifth item to a four-item array. The restriction can be a feature because the memory layout and the size are known in advance.",
        "Choosing a structure is a design decision, not a spelling choice. If the program needs fast lookup by a unique label, a list forces a scan; a dictionary will be the better structure in the next lesson. If the program needs order and repeated traversal, a list is natural. If the size is known and fixed, an array makes that constraint explicit. Start from the operations the program must perform, then choose the collection that makes those operations clear.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "This program has an off-by-one error. It starts at index 1, so it adds the second, third and fourth scores but never the first. Run it, then repair the range so that every score is counted once.",
      notation: `scores = [72, 85, 64, 90]
total = 0
for i in range(1, len(scores)):
    total = total + scores[i]
print(total)`,
      caption:
        "The output is 239, not 311. The missing 72 is the first item, at index 0; the loop's start is the bug.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "Trace the repaired loop over the four scores. The index column is a position, while the total column is the running sum after that iteration.",
      notation:
        "i = 0: scores[0] = 72, total = 72 · i = 1: scores[1] = 85, total = 157 · i = 2: scores[2] = 64, total = 221 · i = 3: scores[3] = 90, total = 311",
      caption:
        "Four iterations for four items. The last index is 3, one less than len(scores), which is 4.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "The tests check the normal case, the first index and the boundary. The third case is deliberately invalid: it proves that the program reports an IndexError rather than silently returning a made-up value.",
      notation:
        "scores[0] = 72 · scores[3] = 90 · len(scores) = 4 · scores[4] raises IndexError",
      caption:
        "A boundary test is not an optional extra. It is the test that distinguishes a list of length four from a list with a fifth position.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "This program is meant to add a score and keep the list, but it replaces the list with None. The append method changes the list in place and returns None, so assigning its result discards the collection.",
      notation: `scores = [72, 85, 64]
scores = scores.append(90)
print(scores)  # None

# repair: keep the list, call the method for its effect
scores = [72, 85, 64]
scores.append(90)
print(scores)  # [72, 85, 64, 90]`,
      caption:
        "Read a method call as an action plus a return value. Here the action is useful and the return value is not.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Trace this program and state the final total:\nscores = [72, 85, 64]\ntotal = 0\nfor score in scores:\n    total = total + score",
      steps: [
        {
          move: "Start with total = 0 and the first item, 72.",
          why:
            "A running total must start at the identity value for addition. If it started at 72, the first score would be counted twice.",
        },
        {
          move: "After the first iteration, total = 0 + 72 = 72.",
          why:
            "The loop variable takes the value of the current item. The body runs once for each item, in list order.",
        },
        {
          move: "After the second iteration, total = 72 + 85 = 157.",
          why:
            "The old total is read before the assignment stores the new one. This is the same right-hand-side rule as an ordinary variable assignment.",
        },
        {
          move: "After the third iteration, total = 157 + 64 = 221.",
          why:
            "There are three items, so the body runs three times. The loop ends after the last item; it does not run once more to check a fourth.",
        },
      ],
      answer:
        "The final total is 221. The three iterations add 72, then 85, then 64; the loop runs exactly three times.",
    },
    {
      id: "w2",
      prompt:
        "This program should print 311 for the four scores, but it prints 239:\nscores = [72, 85, 64, 90]\ntotal = 0\nfor i in range(1, len(scores)):\n    total = total + scores[i]\nprint(total)\nFind the error, repair it, and explain why the repair is not simply adding one to the total.",
      steps: [
        {
          move: "Read the range: range(1, 4) produces 1, 2 and 3.",
          why:
            "The start is included and the stop is excluded. The first index produced is 1, so index 0 is never visited.",
        },
        {
          move: "Compare the skipped score with the output: 239 = 311 − 72.",
          why:
            "The difference identifies the missing item. A numerical check localises the bug faster than rereading the loop without a hypothesis.",
        },
        {
          move: "Change the start to 0, or use for score in scores.",
          why:
            "Index 0 is the first item. Starting at 0 makes the loop cover indices 0 through 3, which is exactly the four-item list.",
        },
        {
          move: "Run the repaired program and check the output is 311.",
          why:
            "Adding 72 to 239 would hide the bug for this input but fail for any list whose first item is different. The repair must fix the traversal, not compensate for the missing value.",
        },
      ],
      answer:
        "Use range(len(scores)) or iterate over scores directly. The repaired loop adds 72 + 85 + 64 + 90 = 311; starting at index 1 skipped the first item.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The first item of a list is at index 1, because that is the first item a person counts.",
      whyItFails:
        "An index is an offset from the start, not an ordinal number. The first item is zero steps from the beginning, so it is at index 0. A three-item list has indices 0, 1 and 2; index 3 is the first position that does not exist.",
      correction:
        "Translate between count and position explicitly. The item at position k in ordinary counting is at index k − 1 in Python, and the last valid index is length − 1.",
      contrast: {
        wrong: "the first of three items is items[1]",
        right: "the first of three items is items[0], and the last is items[2]",
      },
    },
    {
      id: "m2",
      belief: "Calling append returns a new list, so you should assign it back to the variable.",
      whyItFails:
        "append changes the existing list in place. Its return value is None, so scores = scores.append(90) stores None and loses the list. The method has done its work, but its result is not the collection.",
      correction:
        "Call the method for its effect: scores.append(90). Assign only when an operation returns a new value, such as a slice or a comprehension.",
      contrast: {
        wrong: "scores = scores.append(90) leaves scores as None",
        right: "scores.append(90) leaves the same list with one more item",
      },
    },
    {
      id: "m3",
      belief: "The length of a list is also its last valid index.",
      whyItFails:
        "Length counts the items, while an index names a position. A four-item list has length 4 and indices 0 to 3. Using the length as an index asks for the fifth position, which raises IndexError.",
      correction:
        "Keep the two facts side by side: length is the number of items; last index is length − 1. range(len(items)) stops at the last valid index because the upper bound is excluded.",
      contrast: {
        wrong: "for i in range(len(items) + 1) visits every item",
        right: "for i in range(len(items)) visits every item without going past the end",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "What is printed?\nitems = [\"pen\", \"book\", \"bag\"]\nprint(items[1])\nprint(items[-1])\nprint(len(items))",
      hint: "Index 1 is the second item. A negative index counts from the end, and len returns a count.",
      answer:
        "It prints book, then bag, then 3. Index 1 is the second item, index −1 is the last item, and len counts the three items.",
      feedback: {
        correct:
          "You kept the index position separate from the ordinary-language count and read the negative index from the end.",
        incorrect:
          "items[1] is not the first item; index 0 is. Read the brackets as positions before translating them into first, second and last.",
      },
    },
    {
      id: "p2",
      prompt:
        "What is the final value of numbers?\nnumbers = [4, 7, 2]\nnumbers.append(9)\nnumbers[0] = 10\nprint(numbers)",
      hint: "append changes the end; assignment at index 0 changes the first item. Track the length after each line.",
      answer:
        "The list becomes [10, 7, 2, 9]. append adds 9 at the end, and the index assignment replaces 4 with 10.",
      feedback: {
        correct:
          "You separated the method that changes the length from the assignment that changes a value in place.",
        incorrect:
          "append does not replace the first item, and the assignment at 0 does not add an item. Follow each line in order.",
      },
    },
    {
      id: "p3",
      prompt:
        "This program is meant to print every name, but it crashes after printing all three:\nnames = [\"Ada\", \"Grace\", \"Lin\"]\nfor i in range(len(names) + 1):\n    print(names[i])\nExplain the crash and give a repaired loop.",
      hint: "The length is 3. Which indices exist, and what does range(4) produce?",
      answer:
        "The valid indices are 0, 1 and 2. range(len(names) + 1) produces 0, 1, 2 and 3; the last iteration reads names[3], which does not exist, so Python raises IndexError. Use range(len(names)) or iterate directly over names.",
      feedback: {
        correct:
          "You identified the extra upper-bound value and repaired the range rather than catching the error and hiding it.",
        incorrect:
          "The loop does not run out of names at index 2. It asks for index 3 because the range goes one beyond the length.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Repair this function so it returns the number of values greater than the threshold, then run the program. It should print 3 for the given list.",
      modelAnswer:
        "def count_above(values, threshold):\n    count = 0\n    for value in values:\n        if value > threshold:\n            count = count + 1\n    return count\n\nprint(count_above([12, 18, 9, 25, 21], 15))",
      code: {
        starterCode:
          "def count_above(values, threshold):\n    count = 0\n    for value in values:\n        if value > threshold:\n            count = count + 1\n    print(count)\n\nprint(count_above([12, 18, 9, 25, 21], 15))",
        timeoutMs: 12000,
        tests: [{ name: "the function returns 3 and the program prints 3", expectedStdout: "3" }],
      },
      marking: [
        "Traverses every value rather than stopping at the first match.",
        "Uses a strict comparison, so a value equal to the threshold is not counted.",
        "Returns the count instead of printing it inside the function.",
        "The caller prints the returned value, and the result is 3 for the given data.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What is printed?\nvalues = [3, 8, 5]\nvalues.append(values[0])\nprint(values)",
      modelAnswer: "[3, 8, 5, 3]",
      marking: [
        "Reads values[0] before the append operation.",
        "Adds the copied value at the end, giving four items rather than replacing the first.",
      ],
      check: { accepted: ["[3, 8, 5, 3]", "[3,8,5,3]"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A list has three items. Explain why items[3] raises an error, and state the last valid index.",
      modelAnswer:
        "The valid indices are 0, 1 and 2, because an index is a position starting at zero. Index 3 is one past the end of the three-item list, so Python raises IndexError. The last valid index is 2.",
      marking: [
        "States that indexing starts at 0.",
        "Distinguishes the length 3 from the last valid index 2.",
        "Names IndexError or explains that the position does not exist.",
      ],
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "What is printed?\ntotal = 0\nfor n in [2, 4, 6]:\n    total = total + n\nprint(total)",
      modelAnswer: "12",
      marking: [
        "Adds the three items in order: 2, then 6, then 12.",
        "Prints the final total rather than the last item.",
      ],
      check: { accepted: ["12", "twelve"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A weather station stores one temperature reading per day in a list. Write a function count_above(readings, limit) that returns how many readings are strictly above the limit, and explain what it should return for an empty list. Then explain why a fixed-size array would be a poor choice if the station keeps adding days.",
      whyItTransfers:
        "The lesson counts values in a list of scores. Here the list is sensor data, the threshold is a temperature, and the empty list is a boundary the lesson did not use. The learner must reuse traversal and comparison while recognising that a growing collection needs a structure whose size can change.",
      answer:
        "def count_above(readings, limit):\n    count = 0\n    for reading in readings:\n        if reading > limit:\n            count = count + 1\n    return count\n\nThe empty list has no readings to compare, so the function returns 0 rather than failing. A fixed-size array cannot grow when another day is added; a list can, so it matches the station's changing number of readings.",
      marking: [
        "Traverses every reading and compares it with the limit using >.",
        "Returns 0 for an empty list rather than indexing an item that does not exist.",
        "Explains that a list can grow while a fixed-size array cannot.",
        "Names the return value and the comparison, not only the loop syntax.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What are the valid indices of a list with five items?",
      answer: "0, 1, 2, 3 and 4. The length is 5, but the last valid index is 4.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does scores = scores.append(90) leave scores as None?",
      answer:
        "append changes the list in place and returns None. Assigning that return value replaces the list with None.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "When would you use an index loop instead of for item in items?",
      answer:
        "Use an index loop when the position matters, such as replacing items by index or comparing an item with the next one. Use direct iteration when you only need each value.",
      when: "month-later",
    },
  ],

  summary: [
    "A list is an ordered collection; its first index is 0, and a list of length n has valid indices 0 to n − 1.",
    "Iterate directly when you need the values, and use range(len(items)) when you need the positions; the upper bound is excluded.",
    "append and many other list methods change the list in place and return None, so do not assign their result back to the list.",
    "A Python list can grow and hold mixed types; a fixed-size array promises a size and usually one element type. Choose by the operations the program needs.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every code block is short enough to be read line by line, and each trace states the index, value and running total in words before the code is shown.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson keeps one statement per line and names the index and length in full rather than relying on abbreviations or bracket counting.",
    },
    {
      need: "colour-vision",
      alternative:
        "Index positions are written as numbers and labels, not shown by colour; the invalid boundary is named IndexError in text.",
    },
    {
      need: "motor",
      alternative:
        "The code lab requires typing, not dragging or timed clicking; the starter program can be copied and run again after a timeout.",
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
        "All explanations, examples, practice, assessments and code in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-computing-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE computer science subject content for programming and data structures.",
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
