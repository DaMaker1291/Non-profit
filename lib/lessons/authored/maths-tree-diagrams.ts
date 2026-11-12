import type { AuthoredLesson } from "../../lesson-contract";
import { TREE_DIAGRAMS_TREE } from "../../probability-activities";

// A TREE IS A PICTURE OF THE SAMPLE SPACE, NOT A DECORATION BESIDE IT.
//
// The concept has two independent ideas that learners collapse into one rule:
// multiply along a path, and add the paths that satisfy an event. The lesson
// keeps them separate, checks that a complete set of paths sums to 1, and makes
// "without replacement" visible by changing the second-stage denominator. The
// spinner tree is also the lesson's interactive activity, so the same tree the
// prose explains is the one the learner completes and has marked.
export const MATHS_TREE_DIAGRAMS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "tree-diagrams",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, probability: tree diagrams for independent and dependent combined events, the multiplication rule and the addition rule for mutually exclusive paths",
    level: "Key Stage 3 to GCSE Foundation and Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the transfer task are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Draw a tree diagram for two-stage combined events and multiply along each complete path.",
      evidence:
        "The learner draws a spinner tree with first branches 1/3 and 2/3, repeats them on the second stage, and obtains path probabilities 1/9, 2/9, 2/9 and 4/9.",
    },
    {
      statement:
        "Add the probabilities of distinct paths that satisfy the same event, and check that all complete paths total 1.",
      evidence:
        "The learner obtains P(exactly one red) = 2/9 + 2/9 = 4/9 and shows that 1/9 + 2/9 + 2/9 + 4/9 = 1.",
    },
    {
      statement:
        "Use a complement to find 'at least one' without listing every successful path.",
      evidence:
        "The learner finds P(at least one head in three flips) = 1 − (1/2)³ = 7/8 and explains why the complement is a single path.",
    },
    {
      statement:
        "Change the second-stage denominator when an item is not replaced, and distinguish dependent from independent events.",
      evidence:
        "The learner draws a bag tree with first branch 5/8 and second branch 4/7 after a red, and states that the draws are dependent because the first draw changes what remains.",
    },
    {
      statement:
        "Interpret a completed tree as a sample space and use it to compare combined events.",
      evidence:
        "The learner explains why the four spinner paths are equally structured but not equally likely, and why the two paths for 'exactly one red' must be added rather than multiplied.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["probability-basics"],
    check: [
      {
        id: "d1",
        question: "A fair coin is flipped once. What is P(heads)?",
        answer:
          "There are two equally likely outcomes, heads and tails, so P(heads) = 1/2. A probability is a number from 0 to 1.",
        targets: ["probability-basics"],
      },
      {
        id: "d2",
        question: "A bag has 5 red and 3 blue counters. What is P(red)?",
        answer:
          "There are 5 + 3 = 8 counters, of which 5 are red, so P(red) = 5/8. The denominator is the whole sample space, not the number of colours.",
        targets: ["probability-basics"],
      },
      {
        id: "d3",
        question: "What is 1 − 3/8?",
        answer:
          "Write 1 as 8/8, then subtract: 8/8 − 3/8 = 5/8. The complement of an event with probability 3/8 is 5/8.",
        targets: ["probability-basics"],
      },
      {
        id: "d4",
        question: "Are the probabilities of all mutually exclusive outcomes allowed to total more than 1?",
        answer:
          "No. A complete set of mutually exclusive outcomes covers the whole sample space exactly once, so the probabilities total 1. A total above 1 means something has been counted twice.",
        targets: ["probability-basics"],
      },
    ],
  },

  introduction: {
    hook:
      "A spinner lands on red with probability 1/3 and blue with probability 2/3. Spin it twice. There are four ordered results: red-red, red-blue, blue-red and blue-blue. The tree draws the first spin as two branches and repeats the same two branches from each result. Multiply along a path to get its probability, then add the paths that answer the question. Red then red is 1/3 × 1/3 = 1/9; exactly one red is 2/9 + 2/9 = 4/9; at least one red is 1 − 4/9 = 5/9. Every path has a place, and the four probabilities add to 1.",
    why:
      "Tree diagrams turn a compound event into a sequence of simpler choices. They make the sample space visible, which is exactly what is needed when events are not independent: a second draw from a bag without replacement has a different denominator, and a tree shows that change instead of hiding it. The same structure models medical tests, games of chance, quality control and multi-stage decisions. The multiplication and addition rules are not two tricks to memorise; they are the two ways paths combine — along a path for 'and', across paths for 'or'.",
  },

  explanation: [
    {
      heading: "A tree lists the order of events",
      paragraphs: [
        "A tree diagram represents a sequence of stages. The first set of branches shows the possible results of the first stage. From the end of each first branch, a second set shows the possible results of the second stage. A complete path from the start to a final tip is one ordered outcome, such as red then blue. The order matters: red then blue and blue then red are different paths even when the final counts are the same.",
        "The probability written on a branch is conditional on reaching that point. A first branch uses the original sample space. A second branch uses the sample space that remains after the first result. For independent stages, the second set of branches is the same regardless of the first; for dependent stages, it changes. The tree makes this distinction visible because the numbers sit on the branches rather than in a formula.",
        "The number of complete paths is the product of the numbers of choices at each stage. Two stages with two choices each give four paths; three coin flips give 2 × 2 × 2 = 8 paths. Listing the paths is a check on the tree: if the count is wrong, a branch is missing or duplicated.",
      ],
    },
    {
      heading: "Multiply along a path for 'and'",
      paragraphs: [
        "A complete path means the first result and the second result both happen. To find its probability, multiply the probabilities on its branches. For the spinner, red then red is 1/3 × 1/3 = 1/9. Red then blue is 1/3 × 2/3 = 2/9. Blue then red is 2/3 × 1/3 = 2/9, and blue then blue is 2/3 × 2/3 = 4/9.",
        "Multiplication is not adding the branch probabilities. Adding 1/3 + 1/3 would give 2/3, which is far larger than the chance of two reds in a row. The product is smaller than either factor because both conditions must hold. A quick sanity check is that a path probability cannot exceed the probability of any branch on it.",
        "The four spinner paths total 1/9 + 2/9 + 2/9 + 4/9 = 9/9 = 1. This is not a coincidence: the paths are mutually exclusive and together cover every possible pair of spins. If a tree's complete paths do not total 1, either a path is missing, a path is counted twice, or a branch probability is wrong.",
      ],
    },
    {
      heading: "Add across paths for 'or'",
      paragraphs: [
        "Different complete paths are mutually exclusive: the spinner cannot land red-red and blue-blue on the same two spins. When an event can happen through more than one path, add the probabilities of those paths. Exactly one red happens through red-blue or blue-red, so P(exactly one red) = 2/9 + 2/9 = 4/9. Adding is correct because the two paths are separate ways for the same event to occur.",
        "Do not add branches within one path. Red then blue is a single sequence: its probability is the product 1/3 × 2/3. The addition rule applies between complete paths, not between stages. A useful sentence to keep the two rules apart is: 'and' multiplies along a path; 'or' adds between paths.",
        "The paths that satisfy an event may not be equally likely. The two 'exactly one red' paths happen to have the same probability here because the spinner is symmetric, but a bag with different counts can give different path probabilities. Add the actual path probabilities, not a count of paths multiplied by one convenient value.",
      ],
    },
    {
      heading: "Without replacement changes the second denominator",
      paragraphs: [
        "Removing a counter instead of putting it back changes the next draw. Start with 5 red and 3 blue: the first denominator is 8. If that counter is red, the bag left behind holds 4 red and 3 blue, so the second fraction has denominator 7. If it is blue, the leftover bag holds 5 red and 2 blue, again over 7. The stages are dependent, and the tree needs two different second-stage rows.",
        "The red-red path is 5/8 × 4/7 = 20/56 = 5/14. The blue-blue path is 3/8 × 2/7 = 6/56 = 3/28. The mixed paths are 5/8 × 3/7 = 15/56 and 3/8 × 5/7 = 15/56. The four paths total 20/56 + 15/56 + 15/56 + 6/56 = 56/56 = 1, which confirms that both the numerators and denominators have been handled consistently.",
        "With replacement, the item is put back, so the second denominator stays 8 and the stages are independent. The phrase 'without replacement' is the signal to change the denominator. A tree drawn with the same second denominator after a removal is not a small arithmetic slip; it models a different experiment.",
      ],
    },
    {
      heading: "'At least one' is usually a complement",
      paragraphs: [
        "For four coin flips, 'at least one head' includes one head, two heads, three heads and four heads. Listing those paths means adding fifteen of the sixteen equally likely outcomes. The complement is 'no heads', which is the single path tails-tails-tails-tails with probability (1/2)⁴ = 1/16. So P(at least one head) = 1 − 1/16 = 15/16.",
        "The complement method works because an event and its complement partition the sample space. Every outcome is in exactly one of them, so their probabilities add to 1. Choose the smaller side: 'at least one' is the complement of 'none'; 'at most one' is the complement of 'two or more'. The tree still shows the paths, but the calculation can use the one path that is easier to count.",
        "For the spinner, P(at least one red) = 1 − P(no red) = 1 − P(blue-blue) = 1 − 4/9 = 5/9. This agrees with adding red-red, red-blue and blue-red: 1/9 + 2/9 + 2/9 = 5/9. The two methods must agree; if they do not, one of the paths has been misread.",
      ],
    },
    {
      heading: "Independent and dependent trees look different",
      paragraphs: [
        "In an independent tree, the second-stage branches are identical after every first-stage result. A coin does not remember the previous flip, and a spinner does not change after a spin. In a dependent tree, the second-stage branches differ by first result because the sample space has changed. A bag without replacement is the standard example.",
        "You can test independence numerically: if P(A and B) = P(A) × P(B), the events are independent. For the spinner, P(red then red) = 1/9 and P(red) × P(red) = 1/3 × 1/3 = 1/9, so the spins are independent. For the bag, P(red then red) = 5/14, while P(red) × P(red) = 5/8 × 5/8 = 25/64; these are not equal, so the draws are dependent.",
        "Independence is a property of the events, not of the picture. A tree with two stages can be either; the numbers on the second branches tell you which. Do not assume that every tree means independent events just because the branches look tidy.",
      ],
    },
    {
      heading: "Reading a tree backwards and checking an answer",
      paragraphs: [
        "A completed tree can answer questions in both directions. Given a path probability, you can identify the sequence; given a sequence, you can calculate its probability. If a question gives P(red then blue) and asks for a missing branch probability, divide the path probability by the known branch. This is the same multiplication rule rearranged.",
        "Always run three checks. First, each branch probability lies between 0 and 1. Second, the branches leaving any one node total 1, because from that point the next stage must produce one of those results. Third, all complete paths total 1. These checks catch a missing branch, a denominator that was not updated and a path that was added instead of multiplied.",
        "A tree is a representation, not a substitute for the question. The final sentence must say what event was found and in which order. '4/9' is a number; 'the probability of exactly one red in two spins is 4/9' is an answer. Writing the event beside the number is what makes the work checkable by someone else.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The spinner tree has two stages. The same branches repeat because the spinner is unchanged, and each complete path is a product.",
      notation:
        "first: red 1/3, blue 2/3   ·   second: red 1/3, blue 2/3   ·   paths: 1/9, 2/9, 2/9, 4/9",
      caption:
        "The four ordered paths are red-red, red-blue, blue-red and blue-blue. Their probabilities total 1.",
      figure: {
        spec: TREE_DIAGRAMS_TREE,
        caption:
          "A two-stage probability tree for two independent spins. The first branches are red with probability one third and blue with probability two thirds; the same pair repeats on the second stage. The four complete paths have probabilities one ninth, two ninths, two ninths and four ninths.",
      },
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Multiply along a path for 'and'. Add between complete paths for 'or'.",
      notation:
        "P(red then blue) = 1/3 × 2/3 = 2/9   ·   P(exactly one red) = 2/9 + 2/9 = 4/9",
      caption:
        "The two exactly-one-red paths are different orders. They are added because either one satisfies the event.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Without replacement, the second denominator is one smaller. The second branches differ by what was removed.",
      notation:
        "bag 5 red, 3 blue: P(red then red) = 5/8 × 4/7 = 20/56 = 5/14",
      caption:
        "After a red, 4 red and 3 blue remain out of 7. After a blue, 5 red and 2 blue remain out of 7. The stages are dependent.",
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "'At least one' is the complement of 'none'. Use whichever side has fewer paths.",
      notation:
        "P(at least one head in 3 flips) = 1 − (1/2)³ = 1 − 1/8 = 7/8",
      caption:
        "The complement is the single path tails-tails-tails. The event and its complement partition all eight equally likely outcomes.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A spinner lands on red with probability 1/3 and blue with probability 2/3. It is spun twice. Draw the tree and find the probability of each ordered result.",
      steps: [
        {
          move:
            "Draw two first-stage branches: red with probability 1/3 and blue with probability 2/3. They total 1.",
          why:
            "The first spin must produce one of these two results, and the probabilities of a complete set of first-stage outcomes sum to 1.",
        },
        {
          move:
            "From each first branch, draw the same two second-stage branches: red 1/3 and blue 2/3.",
          why:
            "The spinner is unchanged between spins, so the second spin is independent of the first. Repeating the branches is what independence looks like in a tree.",
        },
        {
          move:
            "Multiply along each path: red-red = 1/3 × 1/3 = 1/9; red-blue = 1/3 × 2/3 = 2/9; blue-red = 2/3 × 1/3 = 2/9; blue-blue = 2/3 × 2/3 = 4/9.",
          why:
            "A path means both results happen in order, so the branch probabilities multiply. The order red-blue differs from blue-red even though both contain one of each colour.",
        },
        {
          move:
            "Check the total: 1/9 + 2/9 + 2/9 + 4/9 = 9/9 = 1. The four ordered results are red-red 1/9, red-blue 2/9, blue-red 2/9 and blue-blue 4/9.",
          why:
            "The four paths are mutually exclusive and cover the whole sample space, so they must total 1. Any other total signals a missing or duplicated path.",
        },
      ],
      answer: "red-red 1/9, red-blue 2/9, blue-red 2/9, blue-blue 4/9",
    },
    {
      id: "w2",
      prompt:
        "A bag has 5 red and 3 blue counters. Two are drawn without replacement. Find P(red then red) and P(at least one red).",
      steps: [
        {
          move:
            "The first draw is from 8 counters: P(red) = 5/8 and P(blue) = 3/8.",
          why:
            "The denominator is the total number of counters before anything is removed. The numerators are the counts of each colour.",
        },
        {
          move:
            "After a red, 4 red and 3 blue remain, so the second draw is from 7: P(red) = 4/7. After a blue, 5 red and 2 blue remain, so P(red) = 5/7.",
          why:
            "Without replacement, the first counter is not available for the second draw. Both the colour count and the total have changed.",
        },
        {
          move:
            "Multiply along the red-red path: 5/8 × 4/7 = 20/56 = 5/14.",
          why:
            "The path means red on the first draw and red on the second, so the conditional probabilities multiply.",
        },
        {
          move:
            "For at least one red, use the complement: the only path with no red is blue-blue = 3/8 × 2/7 = 6/56 = 3/28. So P(at least one red) = 1 − 3/28 = 25/28.",
          why:
            "The complement of 'at least one red' is 'no red', a single path. The event and its complement cover the sample space, so their probabilities total 1.",
        },
        {
          move:
            "P(red then red) = 5/14 and P(at least one red) = 25/28. The draws are dependent because the second denominator changed from 8 to 7.",
          why:
            "The numbers alone do not establish dependence; the changed sample space does. The tree shows that change on its second branches.",
        },
      ],
      answer: "P(red then red) = 5/14; P(at least one red) = 25/28; the draws are dependent",
    },
    {
      id: "w3",
      prompt:
        "A fair coin is flipped three times. Find the probability of at least one head, and explain why the complement is shorter than listing the successful paths.",
      steps: [
        {
          move:
            "Each flip has two equally likely results, so the tree has 2 × 2 × 2 = 8 complete paths, each with probability 1/8.",
          why:
            "The flips are independent, so each path multiplies three factors of 1/2. There are eight ordered sequences from HHH to TTT.",
        },
        {
          move:
            "The complement of 'at least one head' is 'no heads', which is the single path TTT.",
          why:
            "Every sequence either contains a head or contains no head. Those two cases are mutually exclusive and cover all eight paths.",
        },
        {
          move:
            "P(TTT) = 1/2 × 1/2 × 1/2 = 1/8, so P(at least one head) = 1 − 1/8 = 7/8.",
          why:
            "The complement has one path, while the event has seven. Using the complement avoids listing HHH, HHT, HTH, HTT, THH, THT and TTH.",
        },
        {
          move:
            "The probability of at least one head in three flips is 7/8. The complement method is shorter because 'none' is one path, not because the event is impossible to list.",
          why:
            "The method is a choice about which side of the partition to count. The tree still represents all eight paths, and the answer agrees with adding the seven successful ones.",
        },
      ],
      answer: "P(at least one head) = 7/8",
    },
    {
      id: "w4",
      prompt:
        "For the two-spin spinner, find P(exactly one red) by adding paths, then check it against the complement of 'no red' or 'two reds'.",
      steps: [
        {
          move:
            "Identify the paths with exactly one red: red-blue and blue-red. Their probabilities are 2/9 and 2/9.",
          why:
            "Exactly one red can happen in two orders. The paths are distinct because the first and second results are different.",
        },
        {
          move:
            "Add the path probabilities: P(exactly one red) = 2/9 + 2/9 = 4/9.",
          why:
            "The two paths are mutually exclusive ways for the same event to happen, so their probabilities add.",
        },
        {
          move:
            "Check with the complement: P(exactly one red) = 1 − P(red-red) − P(blue-blue) = 1 − 1/9 − 4/9 = 4/9.",
          why:
            "The sample space splits into no red, exactly one red, and two reds. Subtracting the two paths that do not satisfy the event leaves the same answer.",
        },
        {
          move:
            "P(exactly one red) = 4/9. The two orders are added; they are not multiplied together, because either order satisfies the event.",
          why:
            "Multiplying 2/9 by 2/9 would give the chance of both paths occurring on one pair of spins, which is impossible. The addition rule is the one for alternative paths.",
        },
      ],
      answer: "P(exactly one red) = 4/9",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Multiply along a path by multiplying the first probability by itself, even when the item is not replaced.",
      whyItFails:
        "Without replacement, the second draw is from a smaller sample space. In a bag of 5 red and 3 blue, the first red has probability 5/8, but the second red has probability 4/7 because one red has gone. Using 5/8 × 5/8 models drawing with replacement, a different experiment.",
      correction:
        "Change both the numerator and the denominator on the second branch. After a red, 4 red and 3 blue remain out of 7; after a blue, 5 red and 2 blue remain out of 7. Write the remaining counts beside the second branches so the change is visible.",
      contrast: {
        wrong: "P(red then red) = 5/8 × 5/8 = 25/64",
        right: "P(red then red) = 5/8 × 4/7 = 20/56 = 5/14",
      },
    },
    {
      id: "m2",
      belief: "Add the probabilities along a path to find the chance of both events.",
      whyItFails:
        "A path means both events happen, so the branch probabilities multiply. Adding 1/3 + 1/3 gives 2/3 for two reds in a row, which is larger than the chance of either single red and cannot be a probability of a more specific event.",
      correction:
        "Use 'and multiplies along a path; or adds between paths'. For red then red, multiply 1/3 × 1/3 = 1/9. For red-red or blue-blue, add the two complete path probabilities.",
      contrast: {
        wrong: "P(red then red) = 1/3 + 1/3 = 2/3",
        right: "P(red then red) = 1/3 × 1/3 = 1/9",
      },
    },
    {
      id: "m3",
      belief: "For 'exactly one red', multiply the two paths together.",
      whyItFails:
        "Red-blue and blue-red are alternative orders, not conditions that must both happen. Multiplying their probabilities gives the chance of both orders occurring on the same two spins, which is impossible. The event is satisfied when either order occurs.",
      correction:
        "Add the probabilities of the distinct paths that satisfy the event: 2/9 + 2/9 = 4/9. Multiplication is for stages within one path; addition is for separate paths.",
      contrast: {
        wrong: "P(exactly one red) = 2/9 × 2/9 = 4/81",
        right: "P(exactly one red) = 2/9 + 2/9 = 4/9",
      },
    },
    {
      id: "m4",
      belief: "Every tree diagram represents independent events because the branches look separate.",
      whyItFails:
        "Independence is about whether the first event changes the second event's sample space. A tree can show either kind. The bag without replacement has different second branches after red and after blue, so the events are dependent even though the drawing is a tree.",
      correction:
        "Compare the second-stage branches after different first results. If they are identical, the stages are independent; if they differ, they are dependent. Numerically, check whether P(A and B) = P(A) × P(B).",
      contrast: {
        wrong: "It is a tree, so the two draws are independent",
        right: "The second branches differ after red and blue, so the draws are dependent",
      },
    },
    {
      id: "m5",
      belief: "'At least one' can be found by multiplying the probability of one by the number of stages.",
      whyItFails:
        "Multiplying 1/3 by 2 for two spins gives 2/3, but P(at least one red) is 5/9. The multiplication double-counts the red-red path and treats overlapping events as if they were separate. The number of stages is not the number of successful paths.",
      correction:
        "Use the complement of 'none': P(at least one red) = 1 − P(blue-blue) = 1 − 4/9 = 5/9. Alternatively, add the three paths that contain a red and check that the total agrees.",
      contrast: {
        wrong: "P(at least one red) = 2 × 1/3 = 2/3",
        right: "P(at least one red) = 1 − 4/9 = 5/9",
      },
    },
    {
      id: "m6",
      belief: "A tree's branch probabilities should total 1 at every stage, including the second branches after different first results.",
      whyItFails:
        "The branches leaving any one node total 1, but branches at different nodes are not one set. The four second-stage branches in a two-stage tree are two separate pairs, each conditional on a different first result. Adding all four can exceed 1 without anything being wrong.",
      correction:
        "Check totals node by node: the first-stage branches total 1, and the second-stage branches leaving each first result total 1. Then check that all complete paths total 1.",
      contrast: {
        wrong: "The four second branches add to 2, so the tree is wrong",
        right: "Each pair of second branches totals 1; the four complete paths total 1",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "For the spinner with P(red) = 1/3 and P(blue) = 2/3, find P(red then red) in two spins.",
      hint: "The spins are independent. Multiply the probability of red by itself.",
      answer: "1/9",
      feedback: {
        correct:
          "1/3 × 1/3 = 1/9. The path means red on the first spin and red on the second.",
        incorrect:
          "Multiply along the path, not add: 1/3 × 1/3 = 1/9. Adding would give 2/3, which is the chance of a red on one spin, not two.",
      },
    },
    {
      id: "p2",
      prompt:
        "For the same spinner, find P(exactly one red) in two spins.",
      hint: "There are two orders: red-blue and blue-red. Find each path, then add.",
      answer: "4/9",
      feedback: {
        correct:
          "2/9 + 2/9 = 4/9. The two orders are separate paths, so their probabilities add.",
        incorrect:
          "Red-blue is 1/3 × 2/3 = 2/9 and blue-red is 2/3 × 1/3 = 2/9. Add the two orders: 4/9. Do not multiply them together.",
      },
    },
    {
      id: "p3",
      prompt:
        "A bag has 5 red and 3 blue counters. Two are drawn without replacement. Find P(red then red).",
      hint: "After one red is removed, 4 red and 3 blue remain out of 7.",
      answer: "5/14",
      feedback: {
        correct:
          "5/8 × 4/7 = 20/56 = 5/14. Both the red count and the total count fall by one.",
        incorrect:
          "The first red is 5/8; after it is removed, the second red is 4/7. Multiply: 20/56 = 5/14. Using 5/8 twice would model replacement.",
      },
    },
    {
      id: "p4",
      prompt:
        "For the same bag, find P(at least one red) in two draws without replacement.",
      hint: "The complement is blue-blue: 3/8 × 2/7.",
      answer: "25/28",
      feedback: {
        correct:
          "P(blue-blue) = 3/8 × 2/7 = 6/56 = 3/28, so P(at least one red) = 1 − 3/28 = 25/28.",
        incorrect:
          "Use the complement: blue-blue = 3/8 × 2/7 = 6/56. Then 1 − 6/56 = 50/56 = 25/28. Adding 5/8 and 4/7 would double-count the red-red path.",
      },
    },
    {
      id: "p5",
      prompt:
        "A fair coin is flipped three times. Find P(at least one head).",
      hint: "The complement is three tails. Each flip has probability 1/2.",
      answer: "7/8",
      feedback: {
        correct:
          "P(TTT) = 1/2 × 1/2 × 1/2 = 1/8, so P(at least one head) = 1 − 1/8 = 7/8.",
        incorrect:
          "The complement is TTT with probability 1/8. Subtract from 1: 7/8. Multiplying 1/2 by 3 gives 3/2, which cannot be a probability.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "For the spinner with P(red) = 1/3 and P(blue) = 2/3, find P(blue then blue) in two independent spins.",
      modelAnswer: "4/9",
      marking: [
        "Recognises that the spins are independent and the second branch is unchanged.",
        "Multiplies along the path: 2/3 × 2/3 = 4/9.",
      ],
      check: {
        accepted: ["4/9", "8/18"],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A bag contains 5 red and 3 blue counters. Two counters are drawn without replacement. Draw or describe the tree, find P(red then red), and find P(at least one red). Explain why the second denominator is not 8.",
      modelAnswer:
        "The first draw is from 8 counters: P(red) = 5/8 and P(blue) = 3/8. After a red, 4 red and 3 blue remain, so the second draw is from 7: P(red) = 4/7 and P(blue) = 3/7. After a blue, 5 red and 2 blue remain, so P(red) = 5/7 and P(blue) = 2/7. The red-red path is 5/8 × 4/7 = 20/56 = 5/14. The only path with no red is blue-blue, 3/8 × 2/7 = 6/56 = 3/28, so P(at least one red) = 1 − 3/28 = 25/28. The second denominator is 7 because the first counter is not put back: the sample space has one fewer counter, and the counts of the remaining colours depend on which colour was removed.",
      marking: [
        "Uses first-draw probabilities 5/8 for red and 3/8 for blue.",
        "Changes the second denominator to 7.",
        "Uses 4/7 for a second red after a red, and 5/7 for a red after a blue.",
        "Calculates P(red then red) = 20/56 = 5/14.",
        "Uses the blue-blue complement 6/56 to obtain P(at least one red) = 25/28.",
        "Explains that without replacement the first counter is removed, so both the total and the colour counts change.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A fair coin is flipped three times. Find the probability of exactly two heads.",
      modelAnswer: "3/8",
      marking: [
        "Identifies the three orders: HHT, HTH, THH.",
        "Adds their equal probabilities: 3 × 1/8 = 3/8.",
      ],
      check: {
        accepted: ["3/8", "0.375", "6/16"],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "Explain the difference between an independent tree and a dependent tree. Use one example of each and state what changes on the second branches.",
      modelAnswer:
        "In an independent tree, the second-stage branches are identical after every first result because the first event does not change the second event's sample space. Two spins of the same spinner are independent: each spin still has P(red) = 1/3 and P(blue) = 2/3, so P(red then red) = 1/9. In a dependent tree, the second branches differ because the first event removes something. Drawing two counters from a bag of 5 red and 3 blue without replacement is dependent: after a red, 4 red and 3 blue remain out of 7, while after a blue, 5 red and 2 blue remain out of 7. The second denominator and the colour counts change. Independence can be checked by testing whether P(A and B) = P(A) × P(B).",
      marking: [
        "Defines independence as the first event not changing the second event's probabilities.",
        "Gives the spinner as an independent example with unchanged second branches.",
        "Gives the bag without replacement as a dependent example.",
        "States that the second denominator changes from 8 to 7.",
        "States that the remaining colour counts change according to what was removed.",
        "Mentions the numerical test P(A and B) = P(A) × P(B).",
      ],
    },
    {
      id: "a5",
      kind: "short-answer",
      prompt:
        "For the spinner, find P(red then blue) in that order.",
      modelAnswer: "2/9",
      marking: [
        "Multiplies the first red 1/3 by the second blue 2/3.",
        "Obtains 2/9 and keeps the order red then blue.",
      ],
      check: {
        accepted: ["2/9", "4/18"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Two fair dice are rolled. Draw a tree for the first die and the second die, find P(at least one six), and find P(exactly one six). Explain why the two answers are different and why the complement is useful for the first.",
      whyItTransfers:
        "The learner must apply the same multiplication and addition rules to a six-branch tree, distinguish 'at least one' from 'exactly one', and choose the complement rather than listing eleven successful ordered pairs. The final explanation tests whether the learner understands the event structure rather than only the arithmetic.",
      answer:
        "Each die is independent, with P(six) = 1/6 and P(not six) = 5/6. For at least one six, use the complement: P(no six) = 5/6 × 5/6 = 25/36, so P(at least one six) = 1 − 25/36 = 11/36. For exactly one six, the two orders are six-then-not-six and not-six-then-six: 1/6 × 5/6 + 5/6 × 1/6 = 5/36 + 5/36 = 10/36 = 5/18. The answers differ because 'at least one' also includes the double-six path (1/36); 10/36 + 1/36 = 11/36. The complement is useful because 'no six' is a single path, while 'at least one six' has eleven ordered paths.",
      marking: [
        "Uses P(six) = 1/6 and P(not six) = 5/6.",
        "Forms the no-six path as 5/6 × 5/6 = 25/36.",
        "Obtains P(at least one six) = 11/36 by complement.",
        "Forms both exactly-one-six orders and adds them to obtain 10/36 = 5/18.",
        "Explains that at least one also includes double six, so it is larger by 1/36.",
        "Explains why the complement is shorter: one path versus eleven ordered paths.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "A fair coin is flipped twice. Find P(heads then heads).",
      answer:
        "The flips are independent: 1/2 × 1/2 = 1/4. There are four equally likely ordered paths.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A bag has 4 red and 2 blue counters. One red is removed. What fraction of the remaining counters is red?",
      answer:
        "After removing a red, 3 red and 2 blue remain, so 5 counters remain and 3/5 are red. The denominator has changed from 6 to 5.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A fair coin is flipped three times. Find P(no heads).",
      answer:
        "The only path is tails-tails-tails: 1/2 × 1/2 × 1/2 = 1/8.",
      when: "week-later",
    },
    {
      id: "x4",
      prompt:
        "For two independent spins with P(red) = 1/4, find P(at least one red) in two spins.",
      answer:
        "P(no red) = 3/4 × 3/4 = 9/16, so P(at least one red) = 1 − 9/16 = 7/16.",
      when: "month-later",
    },
    {
      id: "x5",
      prompt:
        "A bag has 3 red and 2 blue counters. Two are drawn without replacement. Find P(blue then blue).",
      answer:
        "P(first blue) = 2/5. After a blue is removed, 1 blue and 3 red remain out of 4, so P(second blue) = 1/4. The product is 2/5 × 1/4 = 2/20 = 1/10.",
      when: "month-later",
    },
  ],

  summary: [
    "A tree lists stages in order. Each complete path is one ordered outcome.",
    "Multiply along a path for 'and'; add between distinct paths for 'or'.",
    "Every complete set of paths totals 1, and the branches leaving any one node total 1.",
    "Without replacement, the second denominator shrinks and the remaining colour counts change; the stages are dependent.",
    "With replacement, the second branches repeat and the stages are independent.",
    "For 'at least one', use the complement of 'none'; for 'exactly one', add the distinct orders.",
    "Independence can be tested numerically with P(A and B) = P(A) × P(B).",
    "State the event beside the probability, not just the fraction, and check the total before finishing.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The tree is described stage by stage in the caption and in words before the numbers: first red one third and blue two thirds; after either result the same pair repeats. Every branch is named with its result and probability, so the SVG is not required.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each path is written as an ordered sentence, 'red then blue', before its fraction. The multiplication is set out as one line per path, and the addition of paths is kept separate from the multiplication along a path.",
    },
    {
      need: "cognitive",
      alternative:
        "The lesson uses one routine: draw the stages, multiply along a path, add the paths that answer the question, check the total. The same four checks are repeated for the spinner, the bag and the coin.",
    },
    {
      need: "colour-vision",
      alternative:
        "Branches are labelled 'red' and 'blue' in text as well as by colour, and path probabilities are written as fractions rather than shown only by line thickness or shading.",
    },
    {
      need: "motor",
      alternative:
        "The interactive tree uses typed values and a select box, with no dragging or drawing required. The prose tree can be reproduced on paper or followed entirely from the branch table.",
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
        "All teaching prose, examples, practice, assessment and the two-dice transfer task are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for tree diagrams and combined events.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-12",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
