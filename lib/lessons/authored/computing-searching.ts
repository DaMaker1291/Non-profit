import type { AuthoredLesson } from "../../lesson-contract";

// BINARY SEARCH IS THE FIRST ALGORITHM WHERE THE SPEED-UP IS THE LESSON. A
// learner who can recite "it halves the list" and cannot trace the bounds has
// learned a slogan. So the lesson runs the trace first, makes the sorted-data
// requirement an argument rather than a rule, and ends with the off-by-one that
// actually breaks real implementations.
export const COMPUTING_SEARCHING: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "algorithms-search",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, algorithms: linear and binary search",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Trace a linear search and a binary search on the same list, recording the bounds and the comparisons at each step.",
      evidence:
        "For the list 2, 5, 8, 12, 16, 23, 38, 56, 72, 91 and the target 23, the learner records low, high and mid at each step and reports that binary search finds index 5 after three comparisons.",
    },
    {
      statement:
        "Explain why binary search requires sorted data and why halving the candidates makes it faster than checking each item.",
      evidence:
        "The learner explains that discarding half the list is only valid if the ordering tells you which half the target must be in, and that a million items need about twenty halvings rather than a million comparisons.",
    },
    {
      statement:
        "Write and test a binary search function, and repair an off-by-one error in its bounds.",
      evidence:
        "The learner writes a function that returns the index of a target or −1 when it is absent, and passes tests for an empty list, a single item, the first item, the last item and a missing target.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["lists-arrays", "conditionals"],
    check: [
      {
        id: "d1",
        question: "In a list of ten items, what is the index of the first item and the last item?",
        answer:
          "The first item is at index 0 and the last is at index 9, because indexing starts at zero and there are ten items.",
        targets: ["lists-arrays"],
      },
      {
        id: "d2",
        question: "What does the condition in an if statement have to be?",
        answer:
          "An expression that is either true or false, such as a comparison between two values, so the program can choose which branch to run.",
        targets: ["conditionals"],
      },
      {
        id: "d3",
        question: "Why does a while loop need its condition to change inside the loop?",
        answer:
          "Otherwise the condition stays true forever and the loop never ends, which is an infinite loop.",
        targets: ["conditionals"],
      },
    ],
  },

  introduction: {
    hook:
      "A dictionary has about half a million words. If you checked every word from the first page, finding one entry could take half a million comparisons. Open it in the middle instead: one comparison tells you which half your word is in, and you can throw the other half away. Twenty halvings take you from half a million words to one. That is the whole idea of binary search, and it is why a sorted list is worth the trouble of sorting.",
    why:
      "Searching is the first place where the choice of algorithm changes what is possible. Linear search works on any list and is the right choice for a short one or an unsorted one. Binary search is dramatically faster but demands order. Understanding that trade is more useful than memorising either algorithm, because the same reasoning explains why databases keep indexes and why a sorted list is worth maintaining.",
  },

  explanation: [
    {
      heading: "A search is a loop with a decision",
      paragraphs: [
        "A linear search starts at the first item and checks each one in turn until it finds the target or reaches the end. It needs no ordering, because every item is examined, but its worst case is one comparison per item: a list of a million entries can need a million comparisons. That is fine for a short list and painful for a large one.",
        "The loop has two exits, and both matter. One exit is finding the target, which returns its index. The other is running out of items, which must return a clear failure value such as −1 rather than nothing at all, because the caller has to be able to distinguish 'not found' from 'found at index 0'. A search that cannot report absence is not finished.",
      ],
    },
    {
      heading: "Binary search throws away half the candidates each time",
      paragraphs: [
        "Binary search keeps two bounds, low and high, that mark the part of the list still worth checking. It looks at the middle item. If that item is the target, it returns the index. If the middle item is smaller than the target, the target cannot be in the left half, so low moves to the right of the middle. If it is larger, high moves to the left. Each comparison therefore removes about half of the remaining candidates.",
        "Halving is what makes the difference. A list of a million items has about twenty halvings before one item remains, because two to the twentieth is a little over a million. So the worst case is about twenty comparisons rather than a million. The comparison count grows with the logarithm of the list size, which is why doubling the list adds only one more comparison.",
      ],
    },
    {
      heading: "The sorted requirement is an argument, not a rule",
      paragraphs: [
        "Binary search discards a half only because the ordering guarantees where the target can be. If the list is not sorted, a middle value smaller than the target tells you nothing about the left half: the target could be on either side. The algorithm would still run, and it would sometimes return the wrong answer, which is worse than failing loudly.",
        "Sorting has a cost, so it is worth doing when many searches will follow. Sorting once and then searching many times is usually cheaper than scanning the whole list for every lookup. For a single search of a small list, sorting first is wasted work. The right question is not which algorithm is better in general, but how many searches the data will face and whether it is already ordered.",
      ],
    },
    {
      heading: "Bounds are where binary search breaks",
      paragraphs: [
        "The classic bug is an off-by-one in the bounds. If the loop runs while low is less than high, a one-item range is never checked. If the update sets low to the middle instead of one past it, the range stops shrinking and the loop never ends. If high starts at the list length rather than one less, the first middle calculation can point past the end.",
        "The remedy is to test the edges deliberately: an empty list, a single item, the first item, the last item and a target that is absent. Those five cases catch almost every bounds error, and they are cheap to write. A binary search that works on a ten-item example in the middle of the list can still fail on all five.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "A binary search over a sorted list. The function returns the index of the target, or −1 when the target is absent, and the loop shrinks the range by moving a bound past the middle each time.",
      notation:
        "def binary_search(items, target):\n    low = 0\n    high = len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return mid\n        if items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
      caption:
        "The loop condition includes equality, because a range of one item is still worth checking. Each branch moves a bound past the middle, so the range always shrinks.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "Trace for the target 23 in the sorted list 2, 5, 8, 12, 16, 23, 38, 56, 72, 91. Step 1: low = 0, high = 9, mid = 4, value 16, which is too small. Step 2: low = 5, high = 9, mid = 7, value 56, which is too large. Step 3: low = 5, high = 6, mid = 5, value 23, found at index 5.",
      notation:
        "low = 0, high = 9 → mid = 4 (16) → low = 5\nlow = 5, high = 9 → mid = 7 (56) → high = 6\nlow = 5, high = 6 → mid = 5 (23) → return 5",
      caption:
        "Three comparisons, and the range shrank from ten items to one. Notice that high becomes six, not five: the middle has already been checked, so it is excluded from the next range.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "Five tests cover the cases that bounds errors break: an empty list returns −1, a single-item list returns 0 when the item matches and −1 when it does not, the first and last items are found, and a target between two values returns −1.",
      notation:
        "binary_search([], 3) = -1\nbinary_search([7], 7) = 0\nbinary_search([7], 3) = -1\nbinary_search([1, 3, 5, 7], 1) = 0\nbinary_search([1, 3, 5, 7], 7) = 3\nbinary_search([1, 3, 5, 7], 4) = -1",
      caption:
        "The last test is the important one: 4 lies between two real values, so a buggy implementation can return a wrong index rather than a clean failure.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "A version that never checks a one-item range: the loop runs while low is less than high, so when the bounds meet the loop exits and returns −1 without comparing the only remaining item. Searching for the last item of a list therefore fails.",
      notation:
        "while low < high:        # wrong: excludes the final item\n    mid = (low + high) // 2\n    if items[mid] < target:\n        low = mid + 1\n    else:\n        high = mid",
      caption:
        "The repair is to use low <= high and to move high to mid − 1, so the range can shrink to a single item and that item is still checked.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Trace binary search for the target 38 in the sorted list 2, 5, 8, 12, 16, 23, 38, 56, 72, 91. State the value of low, high and mid at each step.",
      steps: [
        {
          move:
            "Start with low = 0 and high = 9, so mid = 4 and the value is 16. Since 16 is less than 38, set low = 5.",
          why:
            "The middle value is smaller than the target, and the list is sorted, so the target cannot be in the left half. Every index up to and including the middle is discarded.",
        },
        {
          move:
            "With low = 5 and high = 9, mid = 7 and the value is 56. Since 56 is greater than 38, set high = 6.",
          why:
            "The middle value is now too large, so the target must be to its left. The right half, including index 7, is discarded.",
        },
        {
          move:
            "With low = 5 and high = 6, mid = 5 and the value is 23. Since 23 is less than 38, set low = 6.",
          why:
            "Only two candidates remain, and the middle one is too small. Moving low past it leaves a single candidate rather than an empty range.",
        },
        {
          move:
            "With low = 6 and high = 6, mid = 6 and the value is 38, so return index 6.",
          why:
            "The range has shrunk to one item and that item is the target. Four comparisons found it, and the loop still had a valid range to check because the condition includes equality.",
        },
      ],
      answer: "The target 38 is at index 6, found after four comparisons.",
    },
    {
      id: "w2",
      prompt:
        "A binary search returns −1 when asked for the last item of a list, even though the item is present. The loop condition is while low < high. Explain the bug and give the corrected line.",
      steps: [
        {
          move:
            "Trace the final steps: the bounds eventually become equal, so low equals high and the loop condition is false.",
          why:
            "A loop that runs only while low is strictly less than high never executes when the range is a single item. The item that remains is never compared.",
        },
        {
          move:
            "Change the condition to while low <= high so a one-item range is still checked.",
          why:
            "The range is valid while low is at or below high. Equality is exactly the case where one candidate remains, and that candidate might be the target.",
        },
        {
          move:
            "Check the bound updates: high must become mid − 1 and low must become mid + 1, so the range shrinks and the loop terminates.",
          why:
            "If a bound is set to the middle itself, the same middle can be chosen again and the loop never ends. Moving one past the middle guarantees progress.",
        },
      ],
      answer:
        "The condition should be while low <= high, with high = mid - 1 and low = mid + 1, so the final single item is compared and the range always shrinks.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Binary search works on any list, and sorting only makes it a little faster.",
      whyItFails:
        "The algorithm discards half the list by assuming the ordering tells it where the target cannot be. On an unsorted list that assumption is false, so the discarded half may contain the target and the search returns the wrong answer. Sorting is a precondition, not an optimisation.",
      correction:
        "Ask whether the comparison at the middle tells you which side the target must be on. If the data is not sorted, it does not, so use a linear search or sort first.",
      contrast: {
        wrong: "binary search is just a faster linear search",
        right: "binary search is only valid on sorted data, because it relies on the order to discard half",
      },
    },
    {
      id: "m2",
      belief: "Binary search checks every item, just in a clever order.",
      whyItFails:
        "It never looks at most of the list. Each comparison removes about half of the remaining candidates, so for a million items it makes about twenty comparisons and leaves almost every item unexamined. That is the entire reason it is fast.",
      correction:
        "Count the comparisons in a trace rather than picturing a scan. If the range is halving, the algorithm is not visiting the discarded items at all.",
      contrast: {
        wrong: "it still looks at each item, only faster",
        right: "it discards half the remaining items at every step, so most items are never examined",
      },
    },
    {
      id: "m3",
      belief: "A binary search that works on a normal example is finished.",
      whyItFails:
        "The failures live at the edges: an empty list, a single item, the first item, the last item, and a target that is absent. A test in the middle of a long list exercises none of those, which is why a bounds bug can pass it and still break real use.",
      correction:
        "Test the five edge cases explicitly, including a target that lies between two values, because that is where a wrong index is returned instead of a clean failure.",
      contrast: {
        wrong: "it found the item in my example, so it works",
        right: "it must also handle empty, single, first, last and missing targets",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "For the sorted list 1, 4, 9, 16, 25, 36, 49, trace the first two steps of a binary search for the target 36. State low, high, mid and the value at mid.",
      hint: "There are seven items, so the last index is 6. The first middle is three, and the value there is 16.",
      answer:
        "Step 1: low = 0, high = 6, mid = 3, value 16, so low becomes 4. Step 2: low = 4, high = 6, mid = 5, value 36, which is the target.",
      feedback: {
        correct:
          "You updated low past the middle because 16 was too small, then recalculated the middle from the new bounds.",
        incorrect:
          "Do not set low to the middle itself. The middle has been compared and excluded, so low becomes one past it.",
      },
    },
    {
      id: "p2",
      prompt:
        "A list has 1,024 items and is sorted. Explain how many comparisons a binary search needs in the worst case, and why.",
      hint: "How many times can you halve 1,024 before one item remains?",
      answer:
        "Ten comparisons, because halving 1,024 ten times leaves one item, and two to the tenth power is 1,024.",
      feedback: {
        correct:
          "You connected the number of halvings to the power of two rather than guessing a fraction of the list.",
        incorrect:
          "The answer is not half the list. Each comparison removes half of what remains, so the count is the number of halvings, not the size of the list.",
      },
    },
    {
      id: "p3",
      prompt:
        "A program searches an unsorted list of 50 names for one name, once. Explain whether sorting the list first would be a good idea.",
      hint: "Sorting costs work too. Compare the cost of one linear scan with the cost of sorting and then searching.",
      answer:
        "No. A single linear search of 50 names needs at most 50 comparisons, while sorting the list first would take far more work than that. Sorting pays off only when many searches follow.",
      feedback: {
        correct:
          "You weighed the cost of sorting against the number of searches, which is the real decision.",
        incorrect:
          "Binary search is faster per search, but the sort is not free. For one search of a short list, the total work is larger.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Write a function contains(items, target) that returns True when target is in the sorted list items and False otherwise. Use binary search, and include the case where the list is empty.",
      modelAnswer:
        "def contains(items, target):\n    low = 0\n    high = len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return True\n        if items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return False\n\nAn empty list gives high = -1, so the loop does not run and the function returns False.",
      marking: [
        "Uses low and high bounds and a loop that includes the case low equals high.",
        "Moves the correct bound past the middle so the range shrinks.",
        "Returns False after the loop and handles the empty list without an index error.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A sorted list contains 1,000 items. What is the largest number of comparisons a binary search needs? Explain your answer.",
      modelAnswer: "ten",
      marking: [
        "Gives ten comparisons.",
        "Justifies it by repeated halving or by the nearest power of two.",
      ],
      check: {
        accepted: ["10", "ten", "10 comparisons", "ten comparisons"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Explain why binary search cannot be used on an unsorted list.",
      modelAnswer:
        "It decides which half to keep by comparing the middle value with the target, and that decision is only valid if the list is ordered, so on an unsorted list it can discard the half containing the target.",
      marking: [
        "States that the algorithm discards half the list at each step.",
        "Explains that the discard is only justified by the ordering.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A website stores 50 million usernames in alphabetical order and looks one up on every sign-in. A rival stores the same usernames in the order people registered. Compare the work each site does for one lookup, and explain one situation in which the rival's approach would be the better choice.",
      whyItTransfers:
        "The numbers are far larger than any trace in the lesson, and the question asks for a design judgement rather than a trace. The learner has to transfer the comparison count to a real system and then recognise the case where the faster algorithm is not worth its precondition.",
      answer:
        "The ordered site can use binary search, which needs about 26 comparisons for 50 million names, because two to the twenty-sixth is about 67 million. The unordered site must scan, which averages 25 million comparisons and can reach 50 million. The rival's approach is better when the list is small, when new names arrive constantly and re-sorting would cost more than it saves, or when only one lookup will ever be made.",
      marking: [
        "Estimates the ordered site's cost as around 26 comparisons, using halving or a power of two.",
        "Contrasts that with a linear scan of up to 50 million comparisons.",
        "Names a situation where maintaining order is not worth the cost, such as few searches, a small list, or frequent insertions.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "State one advantage and one disadvantage of linear search compared with binary search.",
      answer:
        "Linear search works on unsorted data and is simple; it is much slower on large lists because it may check every item.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why must the loop in a binary search move a bound past the middle rather than to the middle?",
      answer:
        "Because the middle has already been compared. Setting a bound to the middle can leave the same range and cause an infinite loop.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A sorted list of 8,000 items is searched with binary search. About how many comparisons are needed, and how did you decide?",
      answer:
        "About thirteen, because two to the thirteenth power is 8,192, so thirteen halvings reduce the list to one item.",
      when: "month-later",
    },
  ],

  summary: [
    "Linear search checks items in turn and works on any list, but its worst case grows with the list size.",
    "Binary search keeps low and high bounds and discards half the remaining items at each comparison.",
    "It requires sorted data, because the ordering is what justifies discarding a half.",
    "Edge cases — empty, single, first, last and absent — are where bounds errors appear.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each code listing is followed by a plain-language description of what the loop does, and every trace is given as a spoken sequence of bound values.",
    },
    {
      need: "dyslexia",
      alternative:
        "Code is shown in short lines with one statement each, and indentation is described in words where it carries meaning.",
    },
    {
      need: "low-vision",
      alternative:
        "Code can be enlarged without wrapping, and the trace is also available as a table of values rather than only as monospaced text.",
    },
    {
      need: "motor",
      alternative:
        "The code assessment is typed, and no step requires dragging or connecting blocks.",
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
      sourceId: "gcse-computer-science-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE computer science subject content for algorithms.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-07",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
