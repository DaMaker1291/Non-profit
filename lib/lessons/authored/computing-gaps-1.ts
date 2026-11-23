import { defineGapLesson } from "./_gap-lesson";

// COMPUTING GAP BATCH 1 — representation, ordering and growth.
//
// Each lesson contains runnable code, a state trace and a test because the
// Computing framework refuses a lesson that only names vocabulary. The code
// assessments are browser-side: they observe printed output, not a learner's
// explanation, so the marking criteria still carry the reasoning.

export const COMPUTING_AI_BASICS = defineGapLesson({
  conceptId: "ai-basics",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, artificial intelligence and machine learning",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for algorithms, data and the social and ethical consequences of technology. All examples and code are original.",
  },
  objectives: [
    {
      statement:
        "Distinguish a rule-based program from a model that learns a rule from labelled examples, and name the evidence that shows which one is operating.",
      evidence:
        "Given a spam filter, the learner identifies whether its decisions come from hand-written conditions or from weights fitted to examples, and points to the training data or rule list that supports the answer.",
    },
    {
      statement:
        "Explain training data, features and labels, and why performance on the training examples is not evidence of performance on new examples.",
      evidence:
        "The learner describes a train/test split and explains that a model can memorise its training set while failing on an unseen email.",
    },
    {
      statement:
        "Identify a false positive and a false negative in a deployed classifier and explain how the cost of each depends on the situation.",
      evidence:
        "For a medical screening model, the learner says a false negative is more dangerous than a false positive and justifies that judgement by the consequence, not by the overall accuracy.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["complexity", "statistics-data"],
    check: [
      {
        id: "d1",
        question: "What does a loop with a nested loop inside it usually cost as the input grows?",
        answer:
          "The inner work happens for every outer step, so the number of operations grows with the square of the input size — O(n²) for a simple pair of loops.",
        targets: ["complexity"],
      },
      {
        id: "d2",
        question: "Why can an average hide an important difference between two data sets?",
        answer:
          "Two sets can share the same mean while having very different spreads or clusters; the mean compresses the distribution into one number and can be pulled by an outlier.",
        targets: ["statistics-data"],
      },
    ],
  },
  introduction: {
    hook:
      "A spam filter labels one hundred emails. Ninety are sorted correctly, but a hospital appointment reminder lands in spam and a fake invoice reaches the inbox. The overall score looks excellent; the two mistakes are the ones a person notices. The question is not whether the filter is “intelligent”, but what examples it learned from and which mistake its threshold makes more likely.",
    why:
      "Machine learning is introduced as a mysterious box far too often. The useful idea is modest: instead of writing every rule by hand, give a program many examples of inputs and correct outputs, and let it adjust a rule so those examples are reproduced. That changes the engineering problem. The difficulty moves from imagining every case to collecting representative examples, measuring errors and deciding which error matters more.",
  },
  explanation: [
    {
      heading: "Rules and examples are two different programs",
      paragraphs: [
        "A classical program is written by a person who states the rule. A spam filter might say that a message is spam when it contains more than two links and the phrase “claim your prize”. The programmer can read that rule, test it on a message and change it. A learned filter is given messages already labelled spam or not spam; it adjusts numerical weights until its own labels match the examples well enough. Nobody writes the final boundary by hand, though somebody chose the features, the examples and the threshold.",
        "Both approaches can produce the same output, so the output alone does not tell you which is running. The evidence is in how the system changes. A rule-based filter changes when a developer edits a condition. A learned filter changes when its training data or weights change, and it can produce a boundary no person wrote down. That is why questions about responsibility do not disappear when the model is learned; they move to the people who chose the data and the objective.",
      ],
    },
    {
      heading: "Training is practice; testing is the exam",
      paragraphs: [
        "A model is fitted on a training set and then evaluated on examples it did not see. If it scores highly on the training set but poorly on the held-out set, it has memorised particular examples rather than learned a pattern that generalises. This is overfitting. A model that is too simple can instead underfit: it misses the pattern in both sets. The train/test split is therefore not administration; it is the experiment that asks whether the rule survives new cases.",
        "Features are the measurements the model is allowed to use, such as the number of links, the sender's domain or the time of day. Labels are the correct answers supplied during training. A feature that is present when the label is assigned but absent when the model is used — the colour of a form, for example — creates leakage: the model learns a shortcut that cannot exist in production. Good evaluation asks whether the test data was collected in the same way as the data the model will meet.",
      ],
    },
    {
      heading: "A model inherits the priorities in its data",
      paragraphs: [
        "If the training examples under-represent one group, the model has less evidence about that group and its errors can be concentrated there. If the labels were produced by a biased process, the model learns that bias and can reproduce it at scale. The problem is not that the algorithm is malicious; it is that “fit the examples” has no built-in instruction to be fair. Fairness has to be named as a requirement, measured separately and traded off explicitly against other errors.",
        "The threshold is a decision, not a law of nature. Lowering a spam threshold catches more spam but also catches more genuine mail: more false positives. Raising it does the reverse. In medical screening, a false negative can delay treatment while a false positive causes an anxious follow-up test, so the two errors do not carry equal cost. A single accuracy percentage hides that difference; a confusion matrix and a stated cost make it visible.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "A rule-based classifier is readable line by line. This program does not learn; every decision is an explicit condition a person can inspect and change.",
      notation:
        "def classify(links, subject):\n    if links > 2 and \"prize\" in subject.lower():\n        return \"spam\"\n    return \"ham\"\n\nfor email in emails:\n    print(email[\"id\"], classify(email[\"links\"], email[\"subject\"]))",
      caption:
        "The function is the complete rule. If a genuine newsletter is misclassified, a developer edits the condition rather than retraining a model.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "A learned model is followed through one example. The score is a weighted sum, and the threshold turns that number into a label. The trace records the value at each step so a prediction can be checked rather than guessed.",
      notation:
        "links = 3        -> weight 0.4 × 3 = 1.2\nprize = True     -> weight 0.5 × 1 = 0.5\nknown_sender = 0 -> weight -0.3 × 0 = 0.0\nscore = 1.7; threshold = 1.0; label = spam",
      caption:
        "The score is not a probability unless the model has been calibrated. It is a number compared with a chosen threshold, and moving the threshold changes which mistakes the system makes.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "A test set is the independent check. These cases were not used to choose the weights, and each one names the behaviour it is checking rather than only the expected label.",
      notation:
        "assert classify(0, \"team lunch\") == \"ham\"\nassert classify(4, \"claim your prize\") == \"spam\"\nassert classify(3, \"invoice attached\") == \"ham\"\n# The third case is the hard one: a short message with links is not automatically spam.",
      caption:
        "A test that only repeats training examples measures memory. The third assertion is deliberately unlike the training pattern and exposes a classifier that overfits on link count.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A school writes a rule: a message is urgent when it contains “today” and comes from a teacher. Classify “Music rehearsal today” from a teacher and “Trip forms today” from the office.",
      steps: [
        {
          move: "Check the sender condition first: the music message comes from a teacher, while the office message does not.",
          why:
            "The rule uses “and”, so both conditions must be true. Checking one condition at a time keeps the failure visible instead of collapsing the rule into a guess.",
        },
        {
          move: "Check the word condition for the music message: it contains “today”, so both parts are true and the label is urgent.",
          why:
            "The message satisfies the complete conjunction. A rule-based label is justified by the conditions, not by whether the message feels urgent to a reader.",
        },
        {
          move: "The office message contains “today” but fails the sender condition, so it is not urgent under this rule.",
          why:
            "One false part is enough to make an “and” false. The example also shows a limitation: a genuinely urgent office message is missed because the rule only trusts teachers.",
        },
      ],
      answer: "The music message is urgent; the office message is not urgent under this rule.",
    },
    {
      id: "w2",
      prompt:
        "Four labelled examples have scores 0.2, 0.4, 0.6 and 0.8, with labels ham, ham, spam, spam. Choose a threshold between the two groups and classify a new message scoring 0.55.",
      steps: [
        {
          move: "Put the examples in score order: 0.2 ham, 0.4 ham, 0.6 spam, 0.8 spam.",
          why:
            "A threshold can separate the classes only if the ordering agrees with the labels. Sorting makes any overlap visible before a number is chosen.",
        },
        {
          move: "Place the threshold at 0.5, halfway between the highest ham and the lowest spam.",
          why:
            "Any value between 0.4 and 0.6 would separate these four examples; 0.5 is a simple choice, not a discovered truth. The midpoint is a decision about this sample.",
        },
        {
          move: "The new score 0.55 is above 0.5, so the model predicts spam.",
          why:
            "The threshold converts a continuous score into a discrete label. A score close to the boundary is exactly where a small change in weights can flip the answer.",
        },
      ],
      answer: "A threshold of 0.5 classifies the new score 0.55 as spam.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "A machine-learning model understands the task in the way a person does.",
      whyItFails:
        "The model has learned statistical associations between the features it was given and the labels it was trained on. It has no model of the meaning of a word, the purpose of an email or the consequence of a mistake. It can reproduce a pattern while being fooled by a small change that a person would immediately notice.",
      correction:
        "Describe what the system actually does: it computes a score from features and compares it with a threshold or decision rule. Then ask separately whether that score is a good proxy for the outcome we care about.",
      contrast: {
        wrong: "The filter knows that this invoice is fake.",
        right: "The filter has learned that invoices with these features were labelled fake in its training data.",
      },
    },
    {
      id: "m2",
      belief: "Collecting more data always makes a model better.",
      whyItFails:
        "More of the same biased or unrepresentative data makes the model more confident about the same narrow pattern. If the new examples all come from one school, one region or one labelling process, they add volume without adding the cases the model is failing. Data quality and coverage matter before quantity.",
      correction:
        "Ask what the new data adds: which groups, edge cases or error types it represents. Measure performance on a held-out set that includes those cases rather than assuming a larger row count is progress.",
      contrast: {
        wrong: "We doubled the training set, so the model must be twice as reliable.",
        right: "We added examples from the groups the model was failing, so the held-out error for those groups can now be measured.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A photo app labels every picture of a dog as “pet”. Is that a rule-based program or a learned model? What evidence would you ask for?",
      hint:
        "Look for where the decision boundary lives. Is it a written condition, or a set of weights fitted to labelled photos?",
      answer:
        "The label alone does not decide. Ask whether a developer wrote breed or shape conditions, or whether the app was trained on labelled photos and stores weights. The presence of training data and a held-out evaluation points to a learned model.",
      feedback: {
        correct:
          "You separated the output from the mechanism and asked for the evidence that would distinguish them.",
        incorrect:
          "A correct-looking label can come from either approach. The distinguishing evidence is how the rule was produced: written by a person or fitted to examples.",
      },
    },
    {
      id: "p2",
      prompt:
        "A model scores 99% on its training set and 62% on new emails. What is the most likely problem, and what would you change first?",
      hint:
        "Compare the two numbers. A large gap between memorised examples and unseen examples has a name.",
      answer:
        "The model is overfitting. Check for leakage, reduce model complexity, add regularization, and evaluate on a properly held-out set that matches the messages it will meet.",
      feedback: {
        correct:
          "You named the gap as overfitting and proposed an evaluation and complexity fix rather than simply adding more rows.",
        incorrect:
          "The 99% is not the achievement; the 62% is the result that matters. The gap points to memorisation or leakage, so inspect the split before celebrating the training score.",
      },
    },
    {
      id: "p3",
      prompt:
        "A screening model misses 8 cancers in 1,000 patients and flags 40 healthy patients for further tests. Which error is a false negative, and why might the threshold be lowered?",
      hint:
        "A false negative is the case the model labelled healthy when the patient was not. Lowering the threshold makes it easier to flag someone.",
      answer:
        "The 8 missed cancers are false negatives. Lowering the threshold flags more patients, which can catch more cancers but also increases false positives and follow-up tests; the trade-off depends on the harm and capacity of each error.",
      feedback: {
        correct:
          "You identified the dangerous error and explained the cost on the other side of the trade-off.",
        incorrect:
          "A false negative is a missed true case, so the eight cancers are the false negatives. Lowering the threshold usually catches more of them while also flagging more healthy people.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "What name is given to the labelled examples a model is fitted to?",
      modelAnswer: "training data",
      marking: [
        "Names the examples used to fit the model.",
        "Distinguishes them from the held-out examples used to evaluate it.",
      ],
      check: { accepted: ["training data", "training set", "the training data"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A model labels a genuine hospital reminder as spam. What kind of error is this: a false positive or a false negative?",
      modelAnswer: "false positive",
      marking: [
        "Recognises that the model predicted the positive class (spam) when the true label was negative.",
        "Uses the direction of the error, not the emotional word “positive”, to decide.",
      ],
      check: { accepted: ["false positive", "false-positive"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Complete the function so it returns “spam” only when a message contains both “prize” and more than two links. Keep the existing tests passing and add no new dependencies.",
      modelAnswer:
        "The function must combine the two conditions with and, lower-case the subject before searching, and compare the link count with 2 using a strict greater-than test.",
      marking: [
        "Uses a conjunction so both conditions must hold.",
        "Normalises the text before searching and uses the correct link comparison.",
      ],
      code: {
        starterCode:
          "def classify(links, subject):\n    text = subject.lower()\n    # Return spam only when both conditions are true.\n    return \"ham\"\n\nprint(classify(3, \"Claim your prize\"))\nprint(classify(1, \"Claim your prize\"))\nprint(classify(3, \"Team lunch\"))\n",
        tests: [
          { name: "both conditions true, then one condition false, then no prize word", expectedStdout: "spam\nham\nham" },
        ],
      },
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A clinic deploys a model that predicts whether a patient needs an urgent appointment. The model is 92% accurate. Explain why accuracy alone is not enough to approve it, name the two error types, and describe one measurement you would require before deployment.",
      whyItTransfers:
        "The spam example makes threshold errors visible in a low-cost setting. A clinic changes the cost of each error and adds a duty of care, so the learner must carry the confusion-matrix idea into a setting where a false negative can harm a person.",
      answer:
        "Accuracy hides the split between false positives and false negatives. In a clinic, a false negative sends a sick patient home while a false positive uses a scarce appointment. Require the confusion matrix, sensitivity for the urgent class, performance across patient groups, and a stated review threshold; then compare those numbers with the clinic's capacity and the harm of each error.",
      marking: [
        "Names false positives and false negatives and explains that their costs differ.",
        "Requires a measurement beyond overall accuracy, such as sensitivity or group-level error.",
        "Connects the threshold to the clinic's capacity and the harm of a missed case.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the difference between a feature and a label?",
      answer:
        "A feature is an input measurement the model may use; a label is the correct output supplied during training.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why is a train/test split necessary?",
      answer:
        "It measures whether the learned rule generalises to examples that were not used to fit it; training performance alone can reward memorisation.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Give one reason a model can be biased even when its code is correct.",
      answer:
        "Its training examples or labels can under-represent a group or encode a past decision, so the fitted pattern reproduces that disadvantage.",
      when: "month-later",
    },
  ],
  summary: [
    "A rule-based program encodes conditions a person wrote; a learned model fits weights to labelled examples.",
    "Training data teaches, a held-out test set evaluates, and a large gap between them is overfitting.",
    "Features, labels and the threshold are human choices, and they determine which errors the system makes.",
    "False positives and false negatives have different costs, so accuracy alone cannot decide whether a model is fit to deploy.",
  ],
});

export const COMPUTING_ALGORITHMS_SORT = defineGapLesson({
  conceptId: "algorithms-sort",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, algorithms and sorting",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for standard algorithms and their complexity. The traces and programs are original.",
  },
  objectives: [
    {
      statement:
        "Trace a bubble sort and a merge sort on a small list, recording the list after each pass or merge.",
      evidence:
        "Given [4, 2, 3, 1], the learner writes the list after the first bubble pass and shows the two sorted halves and merged result for merge sort.",
    },
    {
      statement:
        "Explain why bubble sort is O(n²) while merge sort is O(n log n), using the number of comparisons rather than a stopwatch.",
      evidence:
        "The learner counts the comparisons on a list of size 4 and explains how the counts grow as the list doubles.",
    },
    {
      statement:
        "Choose a sorting algorithm for a stated situation and justify the choice using input size, memory and stability.",
      evidence:
        "The learner chooses merge sort for a million records because the growth is n log n, and explains the extra memory the merge needs.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["algorithms-search"],
    check: [
      {
        id: "d1",
        question: "What does a linear search do, and what is its worst-case number of checks for n items?",
        answer:
          "It checks items one at a time until it finds the target; in the worst case it checks all n items, so the cost grows linearly.",
        targets: ["algorithms-search"],
      },
      {
        id: "d2",
        question: "Why can a binary search discard half the list at each step?",
        answer:
          "Because the list is sorted, the target must lie on one side of the middle item; the other half cannot contain it and can be discarded.",
        targets: ["algorithms-search"],
      },
    ],
  },
  introduction: {
    hook:
      "A teacher has a pile of 30 exam papers to put in order. Bubble sort compares neighbouring papers and swaps them until the pile is ordered; merge sort splits the pile into single papers and repeatedly merges sorted piles. Both finish, and on 30 papers the difference is small. On three million records the difference is the difference between a usable system and one that never returns.",
    why:
      "Sorting is the clearest place to learn that an algorithm is a process with a cost curve. A program that works on a test list can still be unusable on real data. Bubble sort is worth reading because its invariant is visible; merge sort is worth reading because its divide-and-conquer shape recurs in searching, compression and databases. Comparing them by operation counts, not by seconds on one machine, is the habit this lesson builds.",
  },
  explanation: [
    {
      heading: "Bubble sort moves the largest remaining item to the end",
      paragraphs: [
        "One bubble pass compares each neighbouring pair from left to right and swaps when the left item is larger. After the pass, the largest item has moved to the last position, because every comparison pushes it one place right. The next pass can stop one position earlier: the end is already in its final place. The invariant is “the tail is sorted and contains the largest items”, and each pass extends that tail by one.",
        "The simple version always makes n − 1 passes. A useful optimisation stops early when a pass makes no swaps, because no swaps means every neighbour is already in order. That does not change the worst case, which is a reversed list, but it changes the best case to one pass. The algorithm is stable when equal items are never swapped, which matters when records have a second key such as a name.",
      ],
    },
    {
      heading: "Merge sort splits until the pieces are trivial, then merges",
      paragraphs: [
        "Merge sort divides the list in half, sorts each half recursively, and merges the two sorted halves by repeatedly taking the smaller front item. A one-item list is already sorted, so the recursion stops there. The merge is where the ordering is established: at each step, the smallest remaining item must be one of the two fronts, so comparing those two fronts is enough.",
        "The recursion has log₂ n levels because each split halves the problem. Every level merges all n items once, so the total work is about n log n comparisons. The cost is extra memory: the merge needs a second array for the combined result unless the implementation is unusually careful. That trade-off is why an in-place sort may be preferred when memory is tight even though its worst-case comparisons are worse.",
      ],
    },
    {
      heading: "Big-O describes growth, not a stopwatch",
      paragraphs: [
        "Doubling a bubble-sorted input roughly quadruples the comparisons, because the nested passes scale with n × n. Doubling a merge-sorted input a little more than doubles the work, because n log n grows almost linearly. Big-O keeps the fastest-growing term and discards constants, so it answers “what happens when the input gets much larger?” rather than “which program wins on this laptop today?”.",
        "A small input can favour the simpler algorithm: bubble sort has low overhead and may beat merge sort on ten items. That is not a contradiction. Complexity describes the shape of growth; constants and memory decide the crossover. The engineering question is therefore two-part: what is the largest input this system must survive, and which cost — time, memory or stability — is the binding constraint?",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "This is a complete bubble sort with the early-exit flag. The swapped flag is the evidence that the list is already ordered; without it the loop would keep making passes that cannot change anything.",
      notation:
        "def bubble_sort(values):\n    items = list(values)\n    for end in range(len(items) - 1, 0, -1):\n        swapped = False\n        for i in range(end):\n            if items[i] > items[i + 1]:\n                items[i], items[i + 1] = items[i + 1], items[i]\n                swapped = True\n        if not swapped:\n            break\n    return items\n\nprint(bubble_sort([4, 2, 3, 1]))",
      caption:
        "The outer loop shrinks the unsorted region from the right. The inner loop performs one pass, and the flag turns “no swaps” into an early stop.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace records the list after each pass. The vertical bar marks the sorted tail, so the shrinking region is visible rather than remembered.",
      notation:
        "start:        [4, 2, 3, 1]\npass 1:       [2, 3, 1 | 4]\npass 2:       [2, 1 | 3, 4]\npass 3:       [1 | 2, 3, 4]\ncomparisons:   3 + 2 + 1 = 6",
      caption:
        "Each pass places one more item in the sorted tail. The comparison count for this four-item list is six, which is n(n − 1)/2 for n = 4.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "The tests cover the empty list, a reversed list and duplicates. The duplicate case is the one that catches an unstable swap or a merge that drops an equal item.",
      notation:
        "assert bubble_sort([]) == []\nassert bubble_sort([3, 2, 1]) == [1, 2, 3]\nassert bubble_sort([2, 2, 1]) == [1, 2, 2]\nassert bubble_sort([1, 2, 3, 4]) == [1, 2, 3, 4]",
      caption:
        "The already-sorted case checks the early exit, while the duplicate case checks that equal values survive the merge or swap unchanged.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Trace one bubble-sort pass over [4, 2, 3, 1] and state the list at the end of the pass.",
      steps: [
        {
          move: "Compare 4 and 2: 4 is larger, so swap. The list becomes [2, 4, 3, 1].",
          why:
            "Bubble sort compares neighbours and puts the larger one on the right, so the largest value travels toward the end of the pass.",
        },
        {
          move: "Compare 4 and 3: swap, giving [2, 3, 4, 1]. Then compare 4 and 1: swap, giving [2, 3, 1, 4].",
          why:
            "The same neighbour rule is applied across the pass. The 4 keeps moving right until it meets the end, which is why one pass is enough to place the maximum.",
        },
        {
          move: "The pass ends at [2, 3, 1, 4]; the 4 is now in its final position and the next pass can stop before it.",
          why:
            "The sorted tail is the invariant. The next pass only needs to sort the first three items because the largest item cannot move again.",
        },
      ],
      answer: "[2, 3, 1, 4] after one pass, with 4 fixed at the end.",
    },
    {
      id: "w2",
      prompt: "Merge [1, 3, 5] and [2, 4, 6], showing which front item is chosen at each step.",
      steps: [
        {
          move: "Compare the fronts 1 and 2: choose 1. Compare 3 and 2: choose 2. The merged prefix is [1, 2].",
          why:
            "Each front is the smallest remaining item in its own sorted list, so the smaller front is the smallest item overall.",
        },
        {
          move: "Compare 3 and 4: choose 3. Compare 5 and 4: choose 4. The prefix is now [1, 2, 3, 4].",
          why:
            "The merge never needs to look deeper than the two fronts. That is why merging two sorted lists costs only a linear pass.",
        },
        {
          move: "Compare 5 and 6: choose 5, then append the remaining 6. The merged list is [1, 2, 3, 4, 5, 6].",
          why:
            "When one list is exhausted, the rest of the other is already sorted and can be copied without further comparisons.",
        },
      ],
      answer: "[1, 2, 3, 4, 5, 6].",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Merge sort is always faster, so bubble sort should never be used.",
      whyItFails:
        "On a tiny list, merge sort's splitting, recursion and extra array can cost more than a few neighbour comparisons. Bubble sort is also easier to verify and can be stable with no extra memory. The right choice depends on input size, memory and whether stability matters, not on a slogan.",
      correction:
        "Compare the growth first, then the constants and memory for the actual input range. A simple sort is defensible for a handful of items; it is indefensible for a million records.",
      contrast: {
        wrong: "Merge sort is O(n log n), so it wins everywhere.",
        right: "Merge sort wins as n grows, but a small in-place sort can win on a short list with tight memory.",
      },
    },
    {
      id: "m2",
      belief: "Big-O tells you exactly how many seconds an algorithm will take.",
      whyItFails:
        "Big-O discards constant factors and lower-order terms. Two O(n log n) programs can differ by a large constant because of memory access, language or implementation. It describes the growth shape as n becomes large, not a runtime on one machine.",
      correction:
        "Use Big-O to reject algorithms that cannot scale, then benchmark the realistic input sizes and implementations. Report the machine and the input, not only the class.",
      contrast: {
        wrong: "This sort is O(n log n), so it will take 2 seconds.",
        right: "This sort grows as n log n; measure it on the target machine and input size.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "How many comparisons does one full bubble pass make on a list of 5 items?",
      hint: "A pass compares each adjacent pair once, from the first pair to the last pair.",
      answer: "Four comparisons: (1,2), (2,3), (3,4) and (4,5).",
      feedback: {
        correct: "You counted adjacent pairs rather than items; n items have n − 1 gaps.",
        incorrect:
          "A pass compares neighbours, so five items have four adjacent pairs. The number of passes is a separate question.",
      },
    },
    {
      id: "p2",
      prompt: "After the first bubble pass on [5, 1, 4, 2], what is the list?",
      hint: "Move left to right, swapping whenever the left value is larger.",
      answer: "[1, 4, 2, 5], because 5 travels to the end.",
      feedback: {
        correct: "You applied the neighbour rule across the whole pass and fixed the maximum at the end.",
        incorrect:
          "The 5 must be compared with every later item and swapped each time, so it ends in the last position. The other items keep their relative order until a swap moves them.",
      },
    },
    {
      id: "p3",
      prompt:
        "A list of 1,000,000 records must be sorted, and memory is tight. Which cost matters most when choosing between bubble sort and merge sort?",
      hint: "One algorithm needs an extra array proportional to the input; the other is in place but grows quadratically.",
      answer:
        "Bubble sort's quadratic comparisons make it unusable at that size; merge sort needs extra memory but scales as n log n. A memory-tight system might choose an in-place n log n sort such as heapsort rather than either extreme.",
      feedback: {
        correct:
          "You treated memory and time as separate constraints and rejected the false choice between only two algorithms.",
        incorrect:
          "At a million records, bubble sort's n² comparisons dominate. Merge sort is the scalable choice but its extra array is a real cost, so an in-place n log n alternative may be the engineering answer.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "How many comparisons does bubble sort make in total on the list [3, 1, 2] with early exit enabled?",
      modelAnswer: "3",
      marking: [
        "Counts two comparisons in the first pass and one in the second.",
        "Recognises that the third pass would make no swaps and stops.",
      ],
      check: { accepted: ["3", "three"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "After the first pass of bubble sort on [5, 1, 4, 2], which value is fixed at the end?",
      modelAnswer: "5",
      marking: [
        "Follows the largest value as it is swapped right across the pass.",
        "Distinguishes the fixed maximum from the unsorted prefix.",
      ],
      check: { accepted: ["5", "five"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Repair the bubble sort so it returns a new list in ascending order and stops early when a pass makes no swaps. Keep the function pure: do not mutate the caller's list.",
      modelAnswer:
        "Copy the input first, compare each adjacent pair inside a shrinking outer loop, swap when the left value is larger, and break when a complete pass records no swap.",
      marking: [
        "Copies the input, so the caller's list is unchanged.",
        "Uses a nested pass with the correct neighbour comparison and an early-exit flag.",
      ],
      code: {
        starterCode:
          "def bubble_sort(values):\n    items = list(values)\n    # Add the passes, swaps and early exit.\n    return items\n\nprint(bubble_sort([4, 2, 3, 1]))\nprint(bubble_sort([1, 2, 3]))\n",
        tests: [
          { name: "mixed list then already-sorted list", expectedStdout: "[1, 2, 3, 4]\n[1, 2, 3]" },
        ],
      },
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A library must sort one million loan records by due date, and records with the same date must keep their original order. Explain which algorithm you would choose, why stability matters here, and what cost you accept.",
      whyItTransfers:
        "The lesson traces small lists; the library changes the scale and adds a second key. The learner must connect the growth class and stability to a real requirement instead of choosing the algorithm with the friendliest name.",
      answer:
        "Use a stable O(n log n) sort such as merge sort. One million records makes bubble sort's quadratic comparisons impractical, and stability preserves the original order of loans with the same due date. Accept the extra memory for the merge array unless an in-place stable sort is available and measured to fit the server.",
      marking: [
        "Chooses an O(n log n) algorithm and rejects bubble sort for the stated scale.",
        "Explains stability as preserving the original order of equal keys.",
        "Names the memory or implementation cost rather than claiming a free improvement.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does one bubble-sort pass guarantee?",
      answer:
        "It moves the largest remaining item to the end of the unsorted region, so that item is fixed for the next pass.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does merge sort have log n levels?",
      answer:
        "Each split halves the number of items, so the number of halvings needed to reach one-item lists is log₂ n.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What does a stable sort preserve?",
      answer:
        "The original relative order of items whose sort keys are equal.",
      when: "month-later",
    },
  ],
  summary: [
    "Bubble sort repeatedly swaps neighbours; each pass fixes the largest remaining item at the end.",
    "Merge sort splits to one-item lists and merges sorted fronts, costing about n log n comparisons and extra memory.",
    "Big-O describes the growth of work as input size increases, not the runtime on one machine.",
    "Stability and memory can decide an algorithm choice even when two algorithms share a complexity class.",
  ],
});

export const COMPUTING_COMPLEXITY = defineGapLesson({
  conceptId: "complexity",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, computational thinking and algorithm efficiency",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for abstraction, decomposition and algorithmic complexity. The examples and measurements are original.",
  },
  objectives: [
    {
      statement:
        "Classify a simple algorithm as O(1), O(log n), O(n), O(n log n) or O(n²) from the way its work grows.",
      evidence:
        "Given a loop, a nested loop and a halving loop, the learner assigns the correct class and explains the operation count for n = 8.",
    },
    {
      statement:
        "Use decomposition and abstraction to describe a problem before choosing an algorithm, naming what detail is deliberately hidden.",
      evidence:
        "For a route-planning problem, the learner separates map data, graph model and search, and says which real-world detail the graph omits.",
    },
    {
      statement:
        "Compare two algorithms at a stated input size and choose one using growth, memory and the largest input the system must survive.",
      evidence:
        "The learner rejects an O(n²) approach for a million records and states the measured or estimated operation count that supports the choice.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["algorithms-sort", "functions-code"],
    check: [
      {
        id: "d1",
        question: "Why is merge sort O(n log n) rather than O(n²)?",
        answer:
          "It splits the input into log n levels and merges all n items once per level, so the work is about n multiplied by log n.",
        targets: ["algorithms-sort"],
      },
      {
        id: "d2",
        question: "What does a function's return value allow a caller to do?",
        answer:
          "It lets the caller use the result without knowing the function's internal steps, which is the basis of abstraction and decomposition.",
        targets: ["functions-code"],
      },
    ],
  },
  introduction: {
    hook:
      "Two programs both find a name in a sorted list. The first checks every name from the top; the second opens the middle, decides which half cannot contain the name, and repeats. On ten names the difference is a few checks. On a billion names the first program may run for hours while the second needs about thirty comparisons. Same problem, different growth.",
    why:
      "Complexity is not notation to memorise; it is a way of asking what happens when the input becomes real. A nested loop is easy to write and can be perfectly correct, yet unusable on a large data set. The lesson therefore counts operations on small inputs, fits the count to a growth class, and then uses that class to make an engineering decision. Abstraction and decomposition are included because the choice of model often decides the cost before a line of code is written.",
  },
  explanation: [
    {
      heading: "Decompose the problem before optimising the loop",
      paragraphs: [
        "Decomposition splits a problem into parts that can be solved and checked separately: read the map, build a graph, find a route, render the route. Abstraction chooses what each part must expose and what it may hide. The graph needs junctions and travel times; it does not need the colour of the buildings. A good abstraction keeps the decisions that affect the answer and discards the rest, which also keeps the data small enough to process.",
        "Optimising before decomposing often produces a fast version of the wrong model. If the graph stores every possible pair of junctions, the memory cost is quadratic before any search begins. If it stores only neighbours, the same route can be found with a smaller structure. The data model is part of the algorithm's cost, not a separate storage detail.",
      ],
    },
    {
      heading: "Count the work, then keep the fastest-growing term",
      paragraphs: [
        "A single statement is O(1): its cost does not depend on n. One pass through n items is O(n). A loop that halves n until it reaches one is O(log n), because the number of halvings is the logarithm. A loop inside a loop that both run n times is O(n²), because the inner work is repeated n times for each of n outer steps. These are counts of dominant operations, not seconds.",
        "When an algorithm does n work at each of log n levels, the product is O(n log n). When a function does an O(n) pass and then an O(n²) pass, the quadratic term dominates as n grows, so the whole is O(n²). Constants and smaller terms still matter at small n; they are discarded only to describe the growth shape at large n.",
      ],
    },
    {
      heading: "The input range decides which class is acceptable",
      paragraphs: [
        "An O(n²) algorithm on 100 items is 10,000 operations, which may be instant. On 1,000,000 items it is 1,000,000,000,000, which is not. The same code can be acceptable in a classroom exercise and unusable in production. The engineering question is not “which is fastest?” in the abstract but “what is the largest input, how often does it run, and what latency does the user tolerate?”.",
        "Memory has the same shape. An algorithm that stores every pair is O(n²) in space even if its time is linear. A cache can turn repeated work into O(1) lookups while consuming memory that another process needs. A complexity claim should therefore name the resource and the input, not only a letter. “O(n) time and O(1) extra space” is a more useful sentence than “efficient”.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "The counter makes the growth visible. The nested loop performs n × n inner steps; the binary search instead halves the remaining interval each time.",
      notation:
        "def pair_count(n):\n    operations = 0\n    for i in range(n):\n        for j in range(n):\n            operations += 1\n    return operations\n\ndef halving_steps(n):\n    steps = 0\n    while n > 1:\n        n = n // 2\n        steps += 1\n    return steps\n\nprint(pair_count(4), halving_steps(16))",
      caption:
        "The first function returns 16 for n = 4, which is n². The second returns 4 for n = 16, which is log₂ 16. The code shapes are the complexity classes.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace records the remaining interval in a binary search. Each comparison removes half the candidates, so the number of rows is logarithmic in the list size.",
      notation:
        "search 23 in [2, 5, 8, 12, 16, 23, 38, 56]\nstep 1: mid = 12, 23 > 12 -> keep [16, 23, 38, 56]\nstep 2: mid = 38, 23 < 38 -> keep [16, 23]\nstep 3: mid = 23 -> found\ncomparisons = 3; list size = 8; log2(8) = 3",
      caption:
        "The interval halves at every step. The final comparison count of three is the ceiling of log₂ 8, not a coincidence of this particular list.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "These assertions pin the operation counts rather than a runtime. They would still pass on a slower machine, which is the point of measuring growth instead of seconds.",
      notation:
        "assert pair_count(4) == 16\nassert pair_count(10) == 100\nassert halving_steps(16) == 4\nassert halving_steps(1024) == 10\nassert halving_steps(1) == 0",
      caption:
        "The pair count quadruples when n doubles, while the halving count increases by one. The tests demonstrate the two growth curves without timing anything.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Classify a linear search through 8 items and count its worst-case comparisons.",
      steps: [
        {
          move: "The search checks one item per step until it finds the target, so the work grows with n.",
          why:
            "There is one comparison per item in the worst case, which is a single pass rather than a nested or halving structure.",
        },
        {
          move: "For 8 items the worst case is 8 comparisons, so the class is O(n).",
          why:
            "The count is proportional to the input size. Doubling the list doubles the worst-case checks, which is the defining behaviour of linear growth.",
        },
      ],
      answer: "O(n), with 8 comparisons in the worst case for 8 items.",
    },
    {
      id: "w2",
      prompt: "Classify a binary search through 8 sorted items and count its worst-case comparisons.",
      steps: [
        {
          move: "Each comparison halves the remaining interval: 8, then 4, then 2, then 1.",
          why:
            "The search discards the half that cannot contain the target because the list is ordered. The number of halvings is logarithmic.",
        },
        {
          move: "For 8 items the worst case is 3 comparisons, so the class is O(log n).",
          why:
            "log₂ 8 = 3. The count grows by one when the list doubles, not by a factor of two.",
        },
      ],
      answer: "O(log n), with 3 comparisons in the worst case for 8 items.",
    },
    {
      id: "w3",
      prompt: "A program has one O(n) pass followed by a nested O(n²) pass. What is the overall class?",
      steps: [
        {
          move: "Write the total as n + n² dominant operations.",
          why:
            "The two parts run one after the other, so their costs add rather than multiply.",
        },
        {
          move: "For large n, n² dominates n, so keep n² and discard the linear term.",
          why:
            "At n = 1,000, the quadratic term is 1,000,000 while the linear term is 1,000; the smaller term does not change the growth shape.",
        },
      ],
      answer: "O(n²).",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "O(n²) means the program performs exactly n² operations.",
      whyItFails:
        "Big-O is an upper bound on growth, and it discards constants and smaller terms. A nested loop might perform n²/2 comparisons, or 3n² + 7n operations, and still be O(n²). The notation describes the shape as n grows, not an exact instruction count.",
      correction:
        "Use Big-O to compare growth classes, then count or measure the actual operations when constants matter. State the input size and the operation you counted.",
      contrast: {
        wrong: "The loop is O(n²), so it runs in exactly 100 steps for n = 10.",
        right: "The loop grows quadratically; its exact count for n = 10 depends on the constants and comparisons.",
      },
    },
    {
      id: "m2",
      belief: "A faster computer makes an exponential algorithm practical.",
      whyItFails:
        "Exponential growth outruns hardware improvements. Doubling the processor speed adds one to the largest n a 2ⁿ algorithm can finish; it does not change the shape. Going from n = 30 to n = 31 doubles the work, while a linear algorithm barely notices.",
      correction:
        "Change the algorithm or the model, not only the hardware. If the input can grow without bound, an exponential approach needs a different strategy such as approximation, pruning or a polynomial-time reformulation.",
      contrast: {
        wrong: "Buy a faster server and the exponential search will scale.",
        right: "A faster server shifts the boundary by one input size; the exponential growth still dominates.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "What is the complexity of a loop that halves n until it reaches 1?",
      hint: "Count how many times you can divide 16 by 2 before reaching 1.",
      answer: "O(log n), because the number of halvings is logarithmic in n.",
      feedback: {
        correct: "You connected repeated halving to the logarithm rather than to a single pass.",
        incorrect:
          "The loop does not visit every item; it removes half the remaining candidates each time, which is logarithmic growth.",
      },
    },
    {
      id: "p2",
      prompt: "A nested loop runs n times inside n times. What is its complexity, and what happens when n doubles?",
      hint: "Multiply the outer repetitions by the inner repetitions, then compare n and 2n.",
      answer: "O(n²); doubling n roughly quadruples the inner work.",
      feedback: {
        correct: "You multiplied the loops and translated the square into a fourfold increase.",
        incorrect:
          "The inner loop runs in full for every outer step, so the total is n × n. Doubling n therefore multiplies the work by about four.",
      },
    },
    {
      id: "p3",
      prompt:
        "Name one detail a graph model of a bus network can hide, and one detail it must keep to answer a journey-time query.",
      hint: "Think about what changes the answer versus what only makes the map look realistic.",
      answer:
        "It can hide building colours, road names and bus liveries. It must keep stops, connections and travel times (or frequencies) because those change the journey time.",
      feedback: {
        correct: "You separated decorative detail from the information that changes the computed answer.",
        incorrect:
          "An abstraction may discard appearance, but it must keep the entities and costs the question depends on: stops, links and travel times.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What complexity class describes a binary search on a sorted list?",
      modelAnswer: "O(log n)",
      marking: [
        "Names logarithmic growth rather than linear or constant.",
        "Connects the answer to halving the remaining search interval.",
      ],
      check: { accepted: ["O(log n)", "log n", "O(logn)"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What complexity class describes two nested loops that each run n times?",
      modelAnswer: "O(n²)",
      marking: [
        "Multiplies the outer and inner repetitions.",
        "Uses quadratic growth rather than O(n) or O(2n).",
      ],
      check: { accepted: ["O(n²)", "O(n^2)", "n²", "n^2", "quadratic"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Write count_pairs(n) so it returns the number of ordered pairs (i, j) with 0 ≤ i < n and 0 ≤ j < n, using nested loops. The tests check the count, not the pairs themselves.",
      modelAnswer:
        "The function needs two loops, one nested inside the other, and a counter incremented once per inner iteration; the result is n squared for non-negative n.",
      marking: [
        "Uses a nested loop whose bounds produce every ordered pair once.",
        "Returns a count rather than printing inside the loop.",
      ],
      code: {
        starterCode:
          "def count_pairs(n):\n    total = 0\n    # Add the nested loops and count each pair.\n    return total\n\nprint(count_pairs(3))\nprint(count_pairs(5))\n",
        tests: [
          { name: "three items then five items", expectedStdout: "9\n25" },
        ],
      },
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A delivery company can test every possible route through 25 stops, or use a heuristic that checks nearby stops first. Explain why the exhaustive approach is impractical, which complexity idea applies, and what the heuristic gives up.",
      whyItTransfers:
        "The lesson uses small loops and searches; the delivery problem is a different algorithmic structure with real stakes. The learner must recognise factorial or exponential growth, not force the problem into O(n²), and state the quality trade-off of a heuristic.",
      answer:
        "The number of routes grows factorially, far faster than any polynomial; 25 stops already produces an astronomical search space, so exhaustive testing is impractical. A heuristic can find a good route in polynomial time but gives up the guarantee of the optimal route. The choice depends on whether “good enough quickly” is acceptable.",
      marking: [
        "Recognises that the route count grows faster than polynomial (factorial or exponential).",
        "Explains why exhaustive search is impractical at the stated size.",
        "States that the heuristic trades optimality for tractable runtime.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does O(1) mean?",
      answer:
        "The work does not grow with the input size; the operation takes a bounded number of steps regardless of n.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does a single pass followed by a nested loop have complexity O(n²)?",
      answer:
        "The costs add as n + n², and the quadratic term dominates as n grows, so the smaller term is discarded.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Name one cost that Big-O time complexity does not describe.",
      answer:
        "Memory or space usage; an algorithm can be fast in time and still need quadratic extra storage.",
      when: "month-later",
    },
  ],
  summary: [
    "Decomposition splits a problem into parts; abstraction chooses the detail each part must expose.",
    "Count the dominant operations, then keep the fastest-growing term to describe the complexity class.",
    "Halving gives O(log n), a pass gives O(n), nested passes give O(n²), and n work at log n levels gives O(n log n).",
    "The acceptable class depends on the largest input, the available memory and the latency the user can tolerate.",
  ],
});
