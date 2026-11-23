import { defineGapLesson } from "./_gap-lesson";

// COMPUTING GAP BATCH 3 — recursion, data and the web.
//
// Each lesson keeps one executable observation. The code lab compares the whole
// stdout of a run with one expected string, so an exercise with several prints
// names the combined output rather than pretending each test runs separately.

export const COMPUTING_RECURSION = defineGapLesson({
  conceptId: "recursion",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, recursion and recursive algorithms",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for functions, recursion and algorithm design. The traces and programs are original.",
  },
  objectives: [
    {
      statement:
        "Trace a recursive function through its base case and recursive calls, recording the stack of pending returns.",
      evidence:
        "For factorial(4), the learner writes the calls down to factorial(0), then unwinds 1, 1, 2, 6 in the correct order.",
    },
    {
      statement:
        "Explain why a recursive function needs a base case and what happens when the input does not move toward it.",
      evidence:
        "The learner identifies a missing or unreachable base case as the cause of infinite recursion and names the resulting stack overflow.",
    },
    {
      statement:
        "Choose recursion or iteration for a stated problem and justify the choice using depth, readability and memory.",
      evidence:
        "The learner chooses iteration for a million-step loop because recursion would create a million pending frames, but accepts recursion for a shallow tree traversal.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["functions-code"],
    check: [
      {
        id: "d1",
        question: "What happens when a function returns a value to its caller?",
        answer:
          "The caller receives that value and continues from the point after the call, using the returned result in its own expression.",
        targets: ["functions-code"],
      },
      {
        id: "d2",
        question: "What is a call stack?",
        answer:
          "It is the structure that records active function calls and the point each one must return to when it finishes.",
        targets: ["functions-code"],
      },
    ],
  },
  introduction: {
    hook:
      "A set of nested Russian dolls contains another doll, which contains another. To count them, you open one, then solve the same problem for the smaller set inside, and stop when a doll does not open. The stopping case is not an afterthought: without it, you keep opening and never return an answer. Recursion is that shape in code.",
    why:
      "A recursive function is often introduced with factorial and then left as a trick. The important idea is that the function solves a smaller instance of the same problem and trusts the result. That trust is only safe when the input moves toward a base case every time. The call stack is what remembers the unfinished work; it is also the resource that overflows when the stopping condition is wrong or too deep.",
  },
  explanation: [
    {
      heading: "A recursive call is a smaller version of the same problem",
      paragraphs: [
        "factorial(4) is defined as 4 × factorial(3). The function does not expand the whole chain in one step; it asks for the smaller result and multiplies when that result returns. The same definition applies at every level, which is why the code is short. The price is that the function must be able to recognise when the problem is small enough to answer directly.",
        "The base case is the smallest instance with a known answer. For factorial, factorial(0) = 1. For a list sum, the empty list sums to zero. The base case must be reached by every path; a function that only reduces an even number, for example, will miss the odd case and recurse forever. Writing the base case first makes that condition part of the design rather than a patch.",
      ],
    },
    {
      heading: "The stack remembers where each call must return",
      paragraphs: [
        "When factorial(4) calls factorial(3), the first call is suspended with a pending multiplication by 4. That pending work sits on the call stack. The calls nest until factorial(0) returns 1, then the stack unwinds: 1 returns to factorial(1), which computes 1 × 1 = 1; that returns to factorial(2), which computes 2 × 1 = 2; and so on until 4 × 6 = 24.",
        "The stack is finite. A recursion a million levels deep can overflow even when each frame is small, because every pending call consumes memory. A language may optimise tail calls, where the recursive call is the last operation and no work remains after it, but a learner should not assume that optimisation. Depth is part of the algorithm's cost, just like time.",
      ],
    },
    {
      heading: "Recursion and iteration are different shapes for repetition",
      paragraphs: [
        "Any recursion can be rewritten as a loop with an explicit stack, and many simple recursions become a loop with an accumulator. Iteration usually uses constant extra memory and avoids function-call overhead. Recursion usually expresses a divide-and-conquer structure more directly: a tree walk visits a node and then recursively visits its children, which mirrors the data.",
        "The choice is not about which is more advanced. A factorial is clearer as a loop for most readers; a directory tree or a parser is clearer recursively because the data is nested. The engineering question is whether the natural expression is worth the stack depth. If the depth is bounded and small, recursion can be the better explanation; if it grows with user input, an explicit loop or stack is safer.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "The function has one base case and one recursive step. The parameter decreases by one on every call, so the base case is reachable for every non-negative integer.",
      notation:
        "def factorial(n):\n    if n < 0:\n        raise ValueError(\"n must be non-negative\")\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(4))",
      caption:
        "The guard rejects an input that would never reach the base case. The recursive call uses n − 1, so each level moves toward zero.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace separates the descent from the unwind. The left column records pending work; the right column records the value returned as each frame finishes.",
      notation:
        "call factorial(4) -> pending 4 * ?\ncall factorial(3) -> pending 3 * ?\ncall factorial(2) -> pending 2 * ?\ncall factorial(1) -> pending 1 * ?\ncall factorial(0) -> return 1\nunwind: 1 * 1 = 1; 2 * 1 = 2; 3 * 2 = 6; 4 * 6 = 24",
      caption:
        "The multiplication cannot happen until the smaller call returns. The stack holds four pending multiplications at the deepest point.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "The tests cover the base case, a normal case and the invalid negative input. The negative case is important because a missing guard would recurse forever rather than fail clearly.",
      notation:
        "assert factorial(0) == 1\nassert factorial(5) == 120\nassert factorial(1) == 1\ntry:\n    factorial(-1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError(\"negative input must be refused\")",
      caption:
        "A base case of zero does not protect negative inputs. The guard is a second boundary, and the test makes it part of the contract.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Trace factorial(3) and state the value returned at each level.",
      steps: [
        {
          move: "factorial(3) calls factorial(2) with a pending multiplication by 3.",
          why:
            "The function cannot finish until the smaller result arrives. The pending work is stored on the call stack rather than lost.",
        },
        {
          move: "factorial(2) calls factorial(1), which calls factorial(0). The base case returns 1.",
          why:
            "Each call reduces n by one, so the chain reaches zero. The base case gives the first concrete value the unwind can use.",
        },
        {
          move: "Unwind: factorial(1) returns 1, factorial(2) returns 2, factorial(3) returns 6.",
          why:
            "Each pending multiplication is applied as its call resumes. The final result is the product of every integer from 1 to 3.",
        },
      ],
      answer: "factorial(3) returns 6; the intermediate returns are 1, 1, 2 and 6.",
    },
    {
      id: "w2",
      prompt:
        "A recursive directory walk visits a folder, then each child folder. Explain why it stops and why a very deep tree can still fail.",
      steps: [
        {
          move: "The base case is a folder with no child folders: it returns after visiting its files.",
          why:
            "A leaf has no smaller directory to recurse into, so that branch finishes and returns to its parent.",
        },
        {
          move: "Every recursive call moves one level down the tree, and a finite tree has finite depth.",
          why:
            "The input is structurally smaller at each call. That is the condition that guarantees the base case is eventually reached.",
        },
        {
          move: "A pathologically deep tree can still exhaust the call stack before reaching a leaf.",
          why:
            "Termination and resource use are separate. The recursion may be logically finite and still need more frames than the runtime allows.",
        },
      ],
      answer:
        "It stops at leaf folders; a deep tree can overflow the stack because each level keeps a pending frame.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "A recursive function is just a function that calls itself, so any self-call is recursion.",
      whyItFails:
        "A self-call without a reachable base case or without reducing the problem is infinite recursion, not a usable recursive definition. The structure needs a smaller instance and a stopping case; the self-call alone is only the mechanism.",
      correction:
        "Check two things before calling it recursion: every path must move toward a base case, and the base case must return without another call. Then verify the depth is acceptable for the input.",
      contrast: {
        wrong: "def count(n): return count(n + 1)",
        right: "def count(n): return 0 if n == 0 else 1 + count(n - 1)",
      },
    },
    {
      id: "m2",
      belief: "Recursion is always slower and should always be replaced by a loop.",
      whyItFails:
        "Recursion has call overhead and stack memory, so it can be slower for a simple linear repetition. But a recursive tree traversal can be clearer and less error-prone than an explicit stack, and the depth may be small. The costs depend on the shape of the data and the language.",
      correction:
        "Compare the depth, the readability and the memory. Use iteration for a long linear repetition; use recursion when the data is naturally nested and the depth is bounded.",
      contrast: {
        wrong: "Never use recursion; a loop is always better.",
        right: "Use a loop for a million-step count; use recursion for a shallow tree whose structure mirrors the call.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "What is the base case of a recursive sum of a list?",
      hint: "What is the sum of no items?",
      answer: "The empty list has sum 0; that case returns without another call.",
      feedback: {
        correct: "You chose the smallest instance with a known answer.",
        incorrect:
          "The base case is the empty list, whose sum is zero. A one-item list can also be a base, but the empty list is the natural boundary.",
      },
    },
    {
      id: "p2",
      prompt: "Why does factorial(-1) need an explicit guard?",
      hint: "Subtracting one from a negative number moves away from zero, not toward it.",
      answer:
        "Without a guard, n − 1 becomes more negative and never reaches the base case, so the calls continue until the stack overflows.",
      feedback: {
        correct: "You checked that the input moves toward the base case, not only that a base case exists.",
        incorrect:
          "The base case is n = 0, but −1 steps to −2, −3 and so on. The guard refuses an input that cannot reach the base case.",
      },
    },
    {
      id: "p3",
      prompt:
        "A file system may nest 10,000 folders deep. Would you use recursion or an explicit stack, and why?",
      hint: "Each recursive call keeps a frame until its children finish.",
      answer:
        "Use an explicit stack or an iterative walk. The logical recursion is finite, but 10,000 pending frames may exceed the runtime's stack; an explicit structure puts the depth in heap memory and can be bounded.",
      feedback: {
        correct: "You separated logical termination from the runtime's stack limit.",
        incorrect:
          "A finite tree can still be too deep for the call stack. An explicit stack makes the depth a data structure you can monitor rather than a runtime failure.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is factorial(5)?",
      modelAnswer: "120",
      marking: [
        "Multiplies 5 × 4 × 3 × 2 × 1.",
        "Includes the base case factorial(0) = 1 without changing the product.",
      ],
      check: { accepted: ["120", "one hundred and twenty"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What part of a recursive function stops the chain of calls?",
      modelAnswer: "base case",
      marking: [
        "Names the case that returns without another recursive call.",
        "Recognises that every path must reach it.",
      ],
      check: { accepted: ["base case", "the base case", "stopping case"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Complete the recursive factorial function. It must return 1 for n = 0, multiply n by the factorial of n − 1 for positive n, and refuse a negative input with ValueError.",
      modelAnswer:
        "Check for a negative input first, return 1 at zero, otherwise return n multiplied by the recursive call on n minus one so each level moves toward the base case.",
      marking: [
        "Includes a reachable base case and a recursive step that reduces n.",
        "Refuses negative input instead of recursing away from zero.",
      ],
      code: {
        starterCode:
          "def factorial(n):\n    # Add the guard, base case and recursive step.\n    return 1\n\nprint(factorial(5))\n",
        tests: [
          { name: "factorial of five", expectedStdout: "120" },
        ],
      },
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A parser reads nested brackets such as “(a + (b × c))”. Explain why recursion fits the structure, what the base case is, and one input that would make the recursion unsafe without a depth limit.",
      whyItTransfers:
        "The lesson uses factorial and a directory tree. A parser adds grammar and adversarial input, so the learner must identify the nested substructure and a depth guard rather than repeat a numeric example.",
      answer:
        "A bracketed expression contains a smaller expression, so parsing the inside is the same problem on a smaller input; a token or a parenthesised group with no nested brackets is the base case. An attacker can send thousands of opening brackets, creating a deep chain of pending calls; a depth limit or an explicit stack prevents a stack overflow.",
      marking: [
        "Identifies the nested subexpression as the smaller instance of the same problem.",
        "Names a base case that returns without another parse call.",
        "Explains that adversarial nesting can exhaust the call stack without a depth limit.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does a base case return?",
      answer:
        "The known answer for the smallest instance, without making another recursive call.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What does the call stack store during recursion?",
      answer:
        "The active calls and the point each must return to, including pending work such as a multiplication still to be applied.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Give one reason to prefer iteration over recursion.",
      answer:
        "A long linear repetition would create many pending frames; a loop uses constant stack space and avoids call overhead.",
      when: "month-later",
    },
  ],
  summary: [
    "A recursive function solves a smaller instance of the same problem and combines the returned result.",
    "A reachable base case stops the calls; the call stack holds the unfinished work until each call returns.",
    "Depth is a resource: a logically finite recursion can still overflow the stack.",
    "Use iteration for long linear repetition and recursion when the data is naturally nested and shallow enough.",
  ],
});

export const COMPUTING_STATISTICS_DATA = defineGapLesson({
  conceptId: "statistics-data",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, data analysis and statistics",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for data representation, analysis and drawing conclusions. The data sets and programs are original.",
  },
  objectives: [
    {
      statement:
        "Compute and interpret mean, median, range and an outlier for a small data set, choosing the summary that answers the question.",
      evidence:
        "For a set with one extreme value, the learner explains why the median is more representative than the mean and names the outlier.",
    },
    {
      statement:
        "Write a program that loads a list of records, filters them and computes a summary without hard-coding the answer.",
      evidence:
        "The learner writes a loop that accumulates a count and a total, then divides by the count while handling the empty case.",
    },
    {
      statement:
        "Identify a sampling bias or a misleading chart and explain how it could change a conclusion.",
      evidence:
        "The learner explains that a survey of one club cannot support a claim about a whole school and that a truncated axis exaggerates a small difference.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["averages", "lists-arrays"],
    check: [
      {
        id: "d1",
        question: "How is the mean of a list calculated, and what happens if the list is empty?",
        answer:
          "Add the values and divide by how many there are; an empty list has no mean, so the code must return a defined result rather than divide by zero.",
        targets: ["averages"],
      },
      {
        id: "d2",
        question: "How do you traverse every item in a list?",
        answer:
          "Use a loop over the list, either directly over the items or over their indices, and process one item per iteration.",
        targets: ["lists-arrays"],
      },
    ],
  },
  introduction: {
    hook:
      "Two classes both average 60% on a test. In one, every pupil scored between 55 and 65. In the other, half scored 90 and half scored 30. The mean is identical and the experiences were not. A summary that reports only the average has thrown away the shape of the data, which is often the part that matters.",
    why:
      "Data analysis is not a hunt for a single number. The useful questions are: what is typical, how spread out is it, is any point pulling the summary, and who was measured? Code makes it easy to compute a thousand means and just as easy to compute a misleading one. This lesson pairs the calculation with the judgement, so a learner does not mistake a precise-looking output for a valid conclusion.",
  },
  explanation: [
    {
      heading: "Mean, median and range answer different questions",
      paragraphs: [
        "The mean adds every value and divides by the count; it uses all the data and is pulled by an extreme value. The median sorts the values and takes the middle one (or the mean of the two middle values), so it is resistant to outliers. The range is the largest minus the smallest and describes the total spread, but a single extreme value can make it large without saying where the rest of the data sits.",
        "A good summary names the question. For a salary distribution with one very high earner, the median is a better description of a typical worker; the mean is useful if the total payroll matters. For a quality-control process, the range may matter because any value outside the limits is a fault. Reporting all three and explaining the choice is stronger than choosing one number and calling it “the average”.",
      ],
    },
    {
      heading: "The shape of the data changes the conclusion",
      paragraphs: [
        "A histogram groups values into bins and shows where they cluster. A box plot marks the median and quartiles and makes skew visible. A line chart implies an order over time, so using one for unordered categories invents a trend. The chart type is an argument about the data, not decoration; a truncated vertical axis exaggerates a small difference, and a pie chart with too many slices hides the comparison it claims to show.",
        "An outlier is a value far from the rest, but “far” needs a reason. It may be a data-entry error, a different population or a genuine rare event. Removing it silently is a form of editing the evidence. The defensible move is to identify it, investigate its source and report the summary with and without it when the choice changes the conclusion.",
      ],
    },
    {
      heading: "Sampling decides what the number can support",
      paragraphs: [
        "A sample that is not representative cannot be repaired by making it larger. A survey of the school chess club may have ten thousand responses and still say nothing about the school's favourite sport. Random selection, a clear population and a check for non-response bias are what let a sample support a claim about a wider group.",
        "Correlation is not causation. Two quantities can move together because a third factor drives both, or by coincidence. A dataset can show that ice-cream sales and drowning incidents rise together without either causing the other; hot weather is the common cause. Before making a causal claim, ask whether the data came from a controlled comparison, whether the order is known and whether a plausible confounder was measured.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "The function returns a summary dictionary and handles the empty list explicitly. The loop accumulates a count and a total, so the mean is computed from the data rather than typed in.",
      notation:
        "def summarise(values):\n    if not values:\n        return {\"count\": 0, \"mean\": None, \"median\": None}\n    ordered = sorted(values)\n    middle = len(ordered) // 2\n    median = ordered[middle] if len(ordered) % 2 else (ordered[middle - 1] + ordered[middle]) / 2\n    return {\"count\": len(ordered), \"mean\": sum(ordered) / len(ordered), \"median\": median}\n\nprint(summarise([4, 6, 8, 10]))",
      caption:
        "Sorting is needed only for the median; the mean uses the original values. The empty case returns null rather than crashing on a division by zero.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace records how a single extreme value moves the mean but not the median. The two summaries are computed from the same list.",
      notation:
        "data = [10, 12, 12, 14, 100]\nsum = 148; count = 5; mean = 29.6\nsorted = [10, 12, 12, 14, 100]; median = 12\nwithout outlier: mean = 12; median = 12\noutlier = 100; range = 90",
      caption:
        "The mean moves from 12 to 29.6 when the 100 is included, while the median stays at 12. The outlier changes the story a mean tells.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "The tests cover an even count, an odd count and the empty list. The even case is where a median needs the mean of two middle values, a step that is easy to omit.",
      notation:
        "assert summarise([]) == {\"count\": 0, \"mean\": None, \"median\": None}\nassert summarise([1, 3, 5])[\"median\"] == 3\nassert summarise([1, 2, 3, 4])[\"median\"] == 2.5\nassert summarise([10, 12, 12, 14, 100])[\"mean\"] == 29.6",
      caption:
        "The even-length median is 2.5, not 2 or 3. The extreme-value case shows the mean being pulled while the median remains 12.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Find the mean and median of [4, 6, 8, 10] and explain which better represents a typical value.",
      steps: [
        {
          move: "Add the values: 4 + 6 + 8 + 10 = 28, then divide by 4 to get a mean of 7.",
          why:
            "The mean uses every value and the count. It is the balance point of the data, not necessarily a value that appears in the list.",
        },
        {
          move: "Sort the four values and average the two middle ones: (6 + 8) / 2 = 7.",
          why:
            "With an even count there is no single middle item, so the median is the midpoint of the two central values.",
        },
        {
          move: "Both summaries are 7 here, so the data is symmetric enough that the choice does not change the description.",
          why:
            "The mean and median agree when the data is balanced around the centre. Comparing them is a quick check for skew or an outlier.",
        },
      ],
      answer: "Mean 7 and median 7; either represents this symmetric set.",
    },
    {
      id: "w2",
      prompt:
        "The values [10, 12, 12, 14, 100] have a mean of 29.6 and a median of 12. Which is more representative, and what should be investigated?",
      steps: [
        {
          move: "Compare the mean with the median: 29.6 is far above 12, which signals a right-skewed set.",
          why:
            "The mean is pulled toward the large value while the median counts positions. A large gap is evidence of skew or an outlier, not a reason to pick the friendlier number.",
        },
        {
          move: "Identify 100 as the extreme value and ask whether it is a data error or a genuine case.",
          why:
            "An outlier can be a typo, a different population or a real rare event. The source determines whether it should be corrected, kept or reported separately.",
        },
        {
          move: "Report the median as the typical value and the mean with a note about the outlier.",
          why:
            "The median answers “what is typical?” while the mean answers “what is the total per item?”. Naming both prevents the summary from hiding the spread.",
        },
      ],
      answer:
        "The median, 12, is more representative; investigate the 100 and report the mean alongside the outlier.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The mean is always the best average because it uses every value.",
      whyItFails:
        "Using every value also means an extreme value can pull the mean away from the typical case. A salary or house-price distribution with a few very large values can have a mean that almost nobody earns or pays. The median can describe the typical case better.",
      correction:
        "Choose the summary that matches the question and report the shape. If the total matters, use the mean; if the typical case matters and the data is skewed, use the median; show the spread as well.",
      contrast: {
        wrong: "The average salary is 80,000, so most staff earn around that.",
        right: "The median salary is 32,000; the mean is 80,000 because a few senior salaries pull it up.",
      },
    },
    {
      id: "m2",
      belief: "A larger sample is always more trustworthy, even if it comes from one group.",
      whyItFails:
        "Sample size reduces random noise but does not remove bias. A huge sample from a chess club is still a chess-club sample and cannot estimate the whole school's favourite sport. The selection mechanism, not only the count, determines what the data can represent.",
      correction:
        "Describe the population and how the sample was selected. A smaller random sample with a known response rate can support a broader claim than a huge convenience sample.",
      contrast: {
        wrong: "We surveyed 5,000 chess-club members, so this is the school's favourite sport.",
        right: "The sample is large but selected from one club, so it describes that club, not the whole school.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Find the median of [3, 7, 9, 12].",
      hint: "Sort first, then average the two middle values because the count is even.",
      answer: "The middle pair is 7 and 9, so the median is 8.",
      feedback: {
        correct: "You handled the even count by averaging the two central values.",
        incorrect:
          "With four values there is no single middle item. The median is (7 + 9) / 2 = 8, not 7 or 9.",
      },
    },
    {
      id: "p2",
      prompt: "A list has mean 20 and median 12. What does the difference suggest?",
      hint: "Which summary is pulled by a few large values?",
      answer:
        "The data is likely right-skewed or contains a high outlier, because the mean is above the median. Inspect the largest values before choosing a summary.",
      feedback: {
        correct: "You read the gap as a shape clue rather than treating the two numbers as interchangeable.",
        incorrect:
          "A mean above the median usually means a long right tail or an outlier pulling the mean up. The median is more resistant to that pull.",
      },
    },
    {
      id: "p3",
      prompt:
        "A bar chart starts its vertical axis at 90 instead of 0, and two bars are 92 and 96. What impression does the chart create?",
      hint: "Compare the visible heights with the actual difference.",
      answer:
        "The 96 bar appears several times taller than the 92 bar even though the values differ by four. A truncated axis exaggerates a small difference and should be labelled clearly.",
      feedback: {
        correct: "You separated the visual ratio from the numerical difference.",
        incorrect:
          "Starting at 90 cuts off the common baseline, so small differences look large. The chart is not necessarily lying, but it is making a stronger visual claim than the data supports.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is the mean of 4, 6, 8 and 10?",
      modelAnswer: "7",
      marking: [
        "Adds the values to 28 and divides by 4.",
        "Reports the mean, not the median or the range.",
      ],
      check: { accepted: ["7", "seven"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the range of 3, 7, 9 and 12?",
      modelAnswer: "9",
      marking: [
        "Subtracts the smallest value from the largest: 12 − 3.",
        "Reports a spread, not a middle value.",
      ],
      check: { accepted: ["9", "nine"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Complete summarise(values) so it returns the count, mean and median. Return None for mean and median when the list is empty, and average the two middle values for an even count.",
      modelAnswer:
        "Handle the empty list first, sort a copy for the median, use the middle item for an odd count and the average of the two middle items for an even count, and divide the sum by the count for the mean.",
      marking: [
        "Handles the empty list without dividing by zero.",
        "Computes the median correctly for both odd and even counts.",
      ],
      code: {
        starterCode:
          "def summarise(values):\n    # Return count, mean and median.\n    return {\"count\": 0, \"mean\": None, \"median\": None}\n\nprint(summarise([4, 6, 8, 10]))\n",
        tests: [
          {
            name: "even count has mean 7 and median 7",
            expectedStdout: "{'count': 4, 'mean': 7.0, 'median': 7.0}",
          },
        ],
      },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "A bar chart of average salaries starts its vertical axis at £20,000. Two bars are labelled £24,000 and £28,000. Explain what the chart exaggerates, calculate the true percentage difference between the salaries, and say how the chart could mislead a reader.",
      modelAnswer:
        "The bars are drawn 4,000 and 8,000 units tall above the baseline, so the second looks twice as tall as the first. The true difference is 28,000 − 24,000 = 4,000, which is 4,000 ÷ 24,000 × 100 = 16.7% of the lower salary, not 100%. A reader compares the bar lengths rather than the printed values, so a 16.7% difference looks like a doubling; starting the axis at zero would show the true proportion.",
      marking: [
        "Reads the drawn heights as 4,000 and 8,000, or states that the second bar looks twice as tall.",
        "Calculates the true difference as 4,000 and the percentage as 16.7% of 24,000.",
        "Explains that the truncated axis makes a 16.7% difference look like a doubling because readers compare bar lengths.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A school reports that the average score in a revision app is 78% and concludes the app is effective. The data comes from pupils who chose to use the app and completed at least ten sessions. Explain two reasons the conclusion is unsafe and one additional measurement that would strengthen it.",
      whyItTransfers:
        "The lesson computes summaries on clean lists. The school claim adds self-selection and a causal conclusion, so the learner must question who is in the data and what comparison is missing rather than only recompute the mean.",
      answer:
        "The sample is self-selected: pupils who choose to revise and persist may already be more motivated or stronger. Completing ten sessions also selects survivors, so pupils who struggled and stopped are absent. The 78% has no comparison group. Measure a comparable group that did not use the app, or a before-and-after assessment with the same pupils, and report who was excluded.",
      marking: [
        "Names self-selection or survivor bias in the sample.",
        "Explains that an average without a comparison cannot establish effectiveness.",
        "Proposes a comparison group or a before-and-after measure and names who is missing.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "When is the median more representative than the mean?",
      answer:
        "When the data is skewed or has an extreme value that pulls the mean away from the typical case.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What does the range measure?",
      answer:
        "The distance between the largest and smallest values, a simple measure of total spread.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why can a large sample still be biased?",
      answer:
        "Its selection mechanism can over-represent one group, so size reduces random noise but not systematic bias.",
      when: "month-later",
    },
  ],
  summary: [
    "Mean uses every value and is pulled by extremes; median is positional and resists outliers.",
    "Range and charts describe spread and shape, which a single average hides.",
    "An outlier should be investigated, not silently deleted; report its effect on the summary.",
    "Sample selection limits the claims a data set can support, and correlation alone does not establish causation.",
  ],
});

export const COMPUTING_WEB_STACK = defineGapLesson({
  conceptId: "web-stack",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, web technologies and client-server systems",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for HTML, CSS, JavaScript and client-server architecture. The example page and program are original.",
  },
  objectives: [
    {
      statement:
        "Separate a web page's structure, presentation and behaviour, and name which language owns each.",
      evidence:
        "Given a page with a heading, a styled button and a click handler, the learner assigns each part to HTML, CSS or JavaScript.",
    },
    {
      statement:
        "Trace an HTTP request and response from a browser to a server, including the client-server boundary and the status code.",
      evidence:
        "The learner orders the request, server processing, response and rendering, and explains that the browser does not see the server's database query.",
    },
    {
      statement:
        "Explain why validation on the client improves feedback but cannot replace validation on the server.",
      evidence:
        "The learner states that a browser check can be bypassed or disabled, so the server must validate every submitted value again.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["networks"],
    check: [
      {
        id: "d1",
        question: "What does an HTTP request travel over, and what does the server return?",
        answer:
          "It travels over a network connection to a server, which returns a response with a status code, headers and a body such as HTML or JSON.",
        targets: ["networks"],
      },
      {
        id: "d2",
        question: "Why does a browser need a server's IP address?",
        answer:
          "The address identifies where to send the request; the domain name is resolved to it by DNS.",
        targets: ["networks"],
      },
    ],
  },
  introduction: {
    hook:
      "A button on a shop page says “Add to basket”. HTML creates the button, CSS makes it look pressable, and JavaScript sends the request when it is clicked. If the page is refreshed and the basket is still there, a server and a database were involved. If the count changes instantly but disappears on refresh, it lived only in the browser. One interaction crosses three languages and a network boundary.",
    why:
      "The web is often taught as three separate syntax courses, so a learner can write a heading and still not explain where the data goes. This lesson keeps the boundary visible. Structure, style and behaviour are separate jobs; the client and server have different trust levels; and a request is a message with a method, a path, headers and a body. That model makes debugging possible: a layout bug, a failed request and a rejected password are different layers.",
  },
  explanation: [
    {
      heading: "Structure, presentation and behaviour are separate jobs",
      paragraphs: [
        "HTML describes meaning: headings, paragraphs, lists, links, forms. CSS describes presentation: colour, spacing, layout and responsive rules. JavaScript describes behaviour: respond to an event, change the DOM, fetch data. Keeping them separate makes a page easier to change: a new colour scheme should not require rewriting the content, and a new interaction should not require duplicating the markup.",
        "The DOM is the browser's live tree of the page. HTML is parsed into that tree, CSS is applied to it, and JavaScript can read or modify it. A change to the DOM is a change to the running page, not to the original HTML file. That distinction explains why “view source” may not show what is currently on screen and why a script error can leave a page half-rendered.",
      ],
    },
    {
      heading: "A request is a message with a method and a path",
      paragraphs: [
        "A browser sends an HTTP request with a method such as GET or POST, a path, headers and sometimes a body. GET asks for a resource and should not change server state; POST submits data and may create or update something. The server chooses a status code: 200 for success, 404 for not found, 401 for unauthenticated, 403 for forbidden, 500 for a server fault. The code is part of the response's meaning, not decoration.",
        "The client-server boundary is a trust boundary. The browser runs on a device the user controls, so any JavaScript validation can be skipped, modified or replayed. The server must validate the same input again and enforce permissions. A client-side check is a usability feature: it gives fast feedback and reduces wasted requests. It is not a security control.",
      ],
    },
    {
      heading: "The back end owns data and authority",
      paragraphs: [
        "A back-end service receives a request, authenticates the caller, applies business rules, reads or writes a database and returns a response. The browser never needs the database credentials or the SQL. It receives only the data the server chooses to expose. This separation limits what a malicious client can do: it can send any request, but the server decides whether that request is allowed.",
        "Caching and rendering decide how fresh and how fast the page feels. A static asset can be cached for a long time because its URL changes when the content changes; an API response may need a short lifetime or revalidation. Rendering can happen on the server, in the browser or both. The choice affects first paint, searchability and how much JavaScript the device must run, so it is an engineering decision rather than a framework preference.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "The page has one heading, one button and one script. The HTML supplies structure, the CSS supplies appearance and the JavaScript supplies the click behaviour; none of the three depends on a framework.",
      notation:
        "<main>\n  <h1>Revision planner</h1>\n  <p id=\"count\">0 topics</p>\n  <button id=\"add\">Add topic</button>\n</main>\n<style>\n  button { padding: 0.6rem 1rem; }\n</style>\n<script>\n  let count = 0;\n  document.querySelector(\"#add\").addEventListener(\"click\", () => {\n    count += 1;\n    document.querySelector(\"#count\").textContent = count + \" topics\";\n  });\n</script>",
      caption:
        "The button's appearance is CSS; its label and page position are HTML; the counter and click response are JavaScript. The script changes the DOM's text, not the source file.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace follows a form submission across the boundary. The client's validation happens before the request, but the server repeats it because the client cannot be trusted.",
      notation:
        "browser: user submits email=\"ada@example.com\"\nclient: check contains @ -> pass\nPOST /api/signup  body={\"email\":\"ada@example.com\"}\nserver: validate again -> insert row -> 201 Created\nbrowser: receive 201 -> show confirmation\n# A modified request can skip the client check; the server still validates.",
      caption:
        "The server's validation is the one that protects the database. The client check only saves a round trip for the honest user.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "The test checks the rendered output for a small data set. It treats the HTML string as the product, so escaping and structure can be observed without a browser.",
      notation:
        "rows = [(\"Ada\", 82), (\"Ben\", 79)]\nhtml = render_rows(rows)\nassert \"<li>Ada: 82</li>\" in html\nassert \"<li>Ben: 79</li>\" in html\nassert html.count(\"<li>\") == 2\n# A name containing < must be escaped before it reaches the page.",
      caption:
        "The count checks that the loop rendered every row, and the escaping note names the injection risk that a string-building renderer must handle.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A page shows a list of topics from a server. Explain which parts run in the browser and which run on the server when the page loads.",
      steps: [
        {
          move: "The browser sends GET /topics and the server authenticates the request and queries its database.",
          why:
            "The database credentials and query stay on the server. The browser only asks for a resource it is allowed to see.",
        },
        {
          move: "The server returns a response, such as JSON or HTML, with a status code.",
          why:
            "The response is the boundary object. A 200 with data and a 401 without data lead to different client behaviour.",
        },
        {
          move: "The browser parses the response, builds or updates the DOM and applies CSS.",
          why:
            "Rendering is a client job. The server may send HTML or data, but the browser decides how it is displayed on this device.",
        },
      ],
      answer:
        "The server authenticates and queries; the browser requests, receives and renders.",
    },
    {
      id: "w2",
      prompt:
        "A sign-up form checks that an email contains “@” in JavaScript. Explain why the server must check it again.",
      steps: [
        {
          move: "The JavaScript runs on the user's device, where the user can edit it, disable it or send a request directly.",
          why:
            "The client is not a trusted environment. Any check that exists only there can be bypassed without using the page at all.",
        },
        {
          move: "The server receives the request body and must validate its shape and its meaning before writing to the database.",
          why:
            "The server is the authority for stored data. It cannot assume the request came from its own page or that the page's script ran.",
        },
        {
          move: "Return a clear 400 response for invalid input and keep the client check for fast feedback.",
          why:
            "The two checks have different jobs: usability on the client, integrity and permission on the server. Removing either weakens a different property.",
        },
      ],
      answer:
        "The client check is usability; the server check is the actual validation because the client can be bypassed.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "HTML, CSS and JavaScript all do the same job, so a page can use any of them for anything.",
      whyItFails:
        "HTML describes structure and meaning, CSS describes presentation and JavaScript describes behaviour. A page can be made to look or behave in a way that ignores the separation, but that makes it harder to maintain, accessible and secure. Using a div with a click handler instead of a button also removes keyboard and screen-reader behaviour that the element provides.",
      correction:
        "Choose the element for its meaning, the stylesheet for appearance and the script for interaction. Semantic HTML is part of the interface contract, not a stylistic preference.",
      contrast: {
        wrong: "<div onclick=\"save()\">Save</div>",
        right: "<button type=\"button\" onclick=\"save()\">Save</button>",
      },
    },
    {
      id: "m2",
      belief: "Client-side validation is enough because users cannot bypass the page.",
      whyItFails:
        "Users can disable JavaScript, edit the page or send an HTTP request without the browser UI. An attacker will do exactly that. If the server trusts the client's validation, invalid or malicious data reaches the database and can break other users.",
      correction:
        "Treat every request as untrusted. Validate and authorise on the server, then use client validation only to give honest users faster feedback.",
      contrast: {
        wrong: "The form checks the email, so the API can trust it.",
        right: "The form checks for speed; the API validates again because the request may not come from the form.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Which language should define a page's heading and paragraph structure?",
      hint: "It is the language of meaning, not appearance or behaviour.",
      answer: "HTML defines the heading and paragraph structure; CSS and JavaScript should not be the source of that meaning.",
      feedback: {
        correct: "You chose the language whose job is structure and meaning.",
        incorrect:
          "HTML supplies headings, paragraphs and other semantic structure. CSS changes how they look and JavaScript changes what they do.",
      },
    },
    {
      id: "p2",
      prompt: "What does an HTTP 404 status mean, and whose responsibility is it?",
      hint: "The request reached a server, but the resource was not found.",
      answer:
        "404 means the server could not find the requested resource. It is a server-side response about the request path, not a network failure.",
      feedback: {
        correct: "You distinguished a server response from a connection failure.",
        incorrect:
          "A 404 is an HTTP response: the server was reached but has no resource at that path. A DNS or connection failure would happen earlier.",
      },
    },
    {
      id: "p3",
      prompt:
        "Why is a button element better than a clickable div for an action?",
      hint: "Think about keyboard focus, Enter/Space and screen-reader announcement.",
      answer:
        "A button is focusable, activates with the keyboard and is announced as a button; a div needs those behaviours recreated and is usually inaccessible without extra work.",
      feedback: {
        correct: "You connected semantic HTML to behaviour that users and assistive technology rely on.",
        incorrect:
          "A div has no built-in button role, focus or keyboard activation. The native button supplies them, which is why semantics are functional.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Which language provides the structure and meaning of a web page's headings and paragraphs?",
      modelAnswer: "HTML",
      marking: [
        "Names the markup language rather than CSS or JavaScript.",
        "Connects it to structure and meaning, not appearance.",
      ],
      check: { accepted: ["HTML", "html", "HyperText Markup Language"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "In a client-server web app, which side owns the database and enforces permissions?",
      modelAnswer: "server",
      marking: [
        "Names the back-end server, not the browser.",
        "Recognises that the client is untrusted for authority.",
      ],
      check: { accepted: ["server", "the server", "back end", "backend"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Complete render_rows(rows) so it returns an HTML unordered list with one list item per row, showing “name: score”. The caller prints the returned string.",
      modelAnswer:
        "Build an opening ul tag, loop over the rows appending an li for each name and score, close the ul and return the string rather than printing inside the loop.",
      marking: [
        "Produces one list item per input row inside a single unordered list.",
        "Returns the HTML string rather than printing each row separately.",
      ],
      code: {
        starterCode:
          "def render_rows(rows):\n    # Return a complete <ul> with one <li> per row.\n    return \"\"\n\nprint(render_rows([(\"Ada\", 82), (\"Ben\", 79)]))\n",
        tests: [
          {
            name: "two rows become two list items",
            expectedStdout: "<ul><li>Ada: 82</li><li>Ben: 79</li></ul>",
          },
        ],
      },
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A school builds a results page that fetches marks from an API and renders them in the browser. A pupil changes the JavaScript to show 100% and screenshots it. Explain why the school's database is unaffected, why the screenshot is not evidence of a changed mark, and what the server must check when a teacher edits a mark.",
      whyItTransfers:
        "The lesson separates structure, style and behaviour on a static page. The results page adds authority and evidence, so the learner must apply the client-server trust boundary to a claim about data rather than repeat an HTML definition.",
      answer:
        "The browser only displays data the server returned; editing the DOM changes the local page, not the stored record. A screenshot is therefore evidence of what the browser rendered, not of the database. When a teacher edits a mark, the server must authenticate the teacher, check that they are allowed to change that pupil's result, validate the value, write it transactionally and record an audit entry.",
      marking: [
        "Explains that client-side changes do not alter server data.",
        "Distinguishes a rendered screenshot from authoritative stored evidence.",
        "Requires authentication, authorisation and server-side validation for the edit.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the DOM?",
      answer:
        "The browser's live tree of the page, which scripts can read and modify after the HTML is parsed.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why must a server repeat client-side validation?",
      answer:
        "The client can be bypassed or modified, so the server cannot trust that its own page performed the check.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What does an HTTP 401 status mean?",
      answer:
        "The request is unauthenticated: the server does not know who the caller is, or the supplied credentials are missing or invalid.",
      when: "month-later",
    },
  ],
  summary: [
    "HTML gives structure and meaning, CSS gives presentation, and JavaScript gives behaviour over the live DOM.",
    "An HTTP request carries a method, path, headers and optional body; the response carries a status and a representation.",
    "The client is untrusted for authority; the server authenticates, authorises, validates and owns the database.",
    "Client-side validation improves feedback, but server-side validation is the control that protects stored data.",
  ],
});
