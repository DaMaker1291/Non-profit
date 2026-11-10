import type { AuthoredLesson } from "../../lesson-contract";

// AN AVERAGE IS A SUMMARY, NOT A VERDICT.
//
// The reported failure is not forgetting the mean formula. It is treating one
// number as the whole story: a single large salary makes the mean look typical,
// the median is calculated without sorting, and the range is reported as if it
// were another average. This lesson keeps four questions separate — what is the
// total shared out, what is the middle after ordering, what is most frequent,
// and how spread out is the data — and makes the choice of summary part of the
// answer rather than a formula to pick at random.
export const MATHS_AVERAGES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "averages",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, statistics: mean, median, mode and range; frequency tables; describing, interpreting and comparing distributions",
    level: "Key Stage 3 to GCSE Foundation",
    note:
      "Scope cited against the published GCSE mathematics subject content and the National Curriculum for statistics. No specification, textbook or commercial lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Calculate the mean, median, mode and range of a data set, including a frequency table, and state what each number measures.",
      evidence:
        "For 12, 15, 15, 18, 40 the learner gives mean 20, median 15, mode 15 and range 28, and explains that the mean is a total shared out rather than the middle value.",
    },
    {
      statement:
        "Choose an appropriate average for a context and justify the choice using outliers, skew, data type and spread.",
      evidence:
        "Given daily sales 120, 140, 140, 160 and 940, the learner chooses the median 140 rather than the mean 300 as the typical day, because 940 is an outlier; the learner also says that a mode is needed for categorical data and that range measures spread rather than a typical value.",
    },
    {
      statement:
        "Solve reverse-mean and combined-mean problems, including explaining why group sizes matter.",
      evidence:
        "The learner reconstructs a total from a mean to find a missing value, calculates a combined mean from two group totals, and explains why averaging the two group means is wrong when the groups have different sizes.",
    },
  ],

  priorKnowledge: {
    // The genome declares no prerequisites for `averages`. These two are named
    // because the mean is a total divided by a count, and both are probed.
    conceptIds: ["addition", "division"],
    check: [
      {
        id: "d1",
        question: "Work out 48 + 36 + 27.",
        answer:
          "111. The mean starts by rebuilding the total, so the addition must be secure before the division can be meaningful.",
        targets: ["addition"],
      },
      {
        id: "d2",
        question: "Work out 111 ÷ 3.",
        answer:
          "37. The mean of 48, 36 and 27 is 37: the total, 111, shared equally among three readings.",
        targets: ["division"],
      },
    ],
  },

  introduction: {
    hook:
      "Five weekly pay packets are £180, £220, £250, £270 and £1,080. The mean is £400, but four of the five workers earn less than that. The median is £250. Both numbers are correct, but they answer different questions: the mean is the total payroll shared equally, while the median is the middle pay packet after the five are put in order. A manager who reports only £400 has not lied about the total, but has said something misleading about a typical worker.",
    why:
      "An average replaces a list with one number, and the number is only useful if it answers the question being asked. The mean uses every value, so it is pulled by an extreme one. The median uses position after ordering, so it is resistant to an outlier. The mode uses frequency, which is the only one of the three that can summarise categories such as colours or makes of car. The range is not an average at all: it says how far apart the smallest and largest values are. Choosing a summary is part of the answer, and the choice should be justified by the shape of the data, not by habit.",
  },

  explanation: [
    {
      heading: "The mean is a total shared out, not the middle value",
      paragraphs: [
        "The mean is the total of all the values divided by how many there are. For 4, 7, 7, 9 and 13, the total is 40 and there are five values, so the mean is 40 ÷ 5 = 8. If the total is not given, it can be rebuilt from the mean and the count: a mean of 8 over five values means a total of 8 × 5 = 40. That reverse step is how a missing value is found. The mean does not have to be one of the data values — 8 is not in the list — and it must lie between the smallest and largest values unless the calculation is wrong.",
        "Because the mean uses every value, one extreme value moves it. The list 3, 4, 4, 5, 30 has total 46 and mean 9.2, even though four of the five values are 5 or less. The median is 4. The mean is answering 'what would each value be if the total were shared equally', and 30 pounds or 30 minutes of data contributes thirty times as much as a value of 1. That is a strength when every value genuinely belongs to the same group; it is a weakness when one value is a data-entry error, a breakdown or a billionaire.",
      ],
    },
    {
      heading: "The median is positional; the mode is frequency; the range is spread",
      paragraphs: [
        "The median is the middle value after the data are put in order. For 3, 4, 4, 5, 30, the middle is the third value, 4. For an even number of values there is no single middle, so the median is the mean of the two middle values: 2, 4, 5, 7, 8, 9 has middle pair 5 and 7, so the median is 6. Sorting is not optional. In 9, 2, 8, 4, 7 the unsorted middle is 8, but the ordered list is 2, 4, 7, 8, 9 and the median is 7. The median is resistant to an outlier because moving the largest value from 30 to 3,000 changes the middle position not at all.",
        "The mode is the value that occurs most often. A data set can have one mode, several modes, or no mode at all when every value occurs once. The mode is the only average that works for categories: the modal colour of a set of cars can be blue, but the mean colour is meaningless. The range is largest minus smallest. For 4, 7, 7, 9, 13 it is 13 − 4 = 9. It is a measure of spread, not a typical value, and like the mean it is sensitive to an outlier: 3, 4, 4, 5, 30 has range 27 because of the 30. A small range means the values are packed together; it does not mean they are all close to the median.",
      ],
    },
    {
      heading: "Frequency tables and combined groups use totals, not shortcuts",
      paragraphs: [
        "A frequency table records how many times each value occurs. To find the mean, multiply each value by its frequency, add those products, and divide by the total frequency. For values 0, 1, 2, 3 with frequencies 2, 5, 2, 1, the total is 0×2 + 1×5 + 2×2 + 3×1 = 12 and there are 10 values, so the mean is 1.2. The median is the middle position in the ordered list: the fifth and sixth values are both 1, so the median is 1. The mode is the value with the largest frequency, 1. The range is the largest value present minus the smallest, 3 − 0 = 3. The frequencies are counts, not values; multiplying by them reconstructs the total without writing every item out.",
        "A combined mean needs both groups' totals, not the average of their means. Class A has 10 students with mean 60, so its total is 10 × 60 = 600. Class B has 20 students with mean 75, so its total is 20 × 75 = 1,500. Together the 30 students hold 2,100 marks, so the combined mean is 2,100 ÷ 30 = 70. The unweighted average of 60 and 75 is 67.5, which is wrong because Class B has twice as many students: its mean must count twice as much. Averaging two means is only valid when the group sizes are equal.",
      ],
    },
    {
      heading: "Choosing a summary is part of the answer",
      paragraphs: [
        "Use the mean when the values are measured on a numerical scale, the distribution is reasonably balanced, and every value should contribute; use the median when there are outliers or strong skew, because it reports the middle of the data rather than the balance point of the total. Use the mode for categories, and for numerical data when the most common value is the question. Report the range alongside a measure of centre when spread matters: two classes can have the same mean and very different ranges. Do not choose an average because it is the one you remember; choose it because it answers the question without hiding the shape of the data.",
        "A new value changes the mean by changing the total and the count. If the new value equals the old mean, the mean stays the same; if it is above the old mean, the mean rises; if it is below, the mean falls. The median may not move at all, because one extra value only shifts the middle position. Adding 100 to a group whose mean is 62 raises the mean, but the median is still controlled by the middle of the ordered list. Always check that the mean lies between the smallest and largest values, that the median is an actual value or the midpoint of two middle values, that the mode appears in the data, and that the range is not negative. The unit of the mean, median, mode and range is the unit of the data; a mean of 20 minutes is not 20.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "One small data set, four different questions. The mean uses the total; the median uses position after sorting; the mode uses frequency; the range uses the two extremes.",
      notation:
        "4, 7, 7, 9, 13   ·   mean = 40 ÷ 5 = 8   ·   median = 7   ·   mode = 7   ·   range = 13 − 4 = 9",
      caption:
        "The median and mode happen to be the same value here, but they were found in different ways. Changing the 13 to 130 would leave the median and mode unchanged, move the mean from 8 to 31.4, and increase the range from 9 to 126.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A frequency table stores the counts. Multiply each value by its frequency to rebuild the total, and use cumulative frequencies to locate the median.",
      notation:
        "value 0, 1, 2, 3   ·   frequency 2, 5, 2, 1   ·   total = 0×2 + 1×5 + 2×2 + 3×1 = 12   ·   n = 10   ·   mean = 12 ÷ 10 = 1.2   ·   median = 1   ·   mode = 1   ·   range = 3",
      caption:
        "The mean 1.2 is not one of the recorded values, which is allowed. The fifth and sixth values both fall in the frequency-five group for 1, so the median is 1; the mode is the value with the largest frequency, also 1.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Two groups with different sizes cannot be combined by averaging their means. Convert each mean back to a total first.",
      notation:
        "A: 10 × 60 = 600   ·   B: 20 × 75 = 1,500   ·   combined = (600 + 1,500) ÷ 30 = 2,100 ÷ 30 = 70   ·   unweighted = (60 + 75) ÷ 2 = 67.5",
      caption:
        "The unweighted 67.5 gives each class equal influence even though Class B has twice as many students. The correct combined mean, 70, is closer to 75 because the larger group carries more weight.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A cafe records five daily takings in pounds: 12, 15, 15, 18 and 40. Find the mean, median, mode and range, and say which average best describes a typical day.",
      steps: [
        {
          move: "Add the values: 12 + 15 + 15 + 18 + 40 = 100. Divide by the count, 5: mean = 100 ÷ 5 = 20.",
          why:
            "The mean is the total shared equally among the five days. The addition must include every value, including the 40.",
        },
        {
          move: "Put the values in order: 12, 15, 15, 18, 40. The middle (third) value is 15, so the median is 15.",
          why:
            "With five values, the median is the third after sorting. It is not the unsorted middle and it is not the mean.",
        },
        {
          move: "The value 15 occurs twice and no other value occurs more often, so the mode is 15. The range is 40 − 12 = 28.",
          why:
            "Frequency decides the mode; the two extremes decide the range. The range is a spread, not a typical value.",
        },
        {
          move: "The mean 20 is above four of the five values because the 40 pulls it up. The median 15 describes a typical day better; report the median and the range, and mention the mean only with the outlier explained.",
          why:
            "A summary that hides the unusually large day would mislead. The median is resistant to it, while the range still shows that the days are not all alike.",
        },
      ],
      answer: "mean 20; median 15; mode 15; range 28; median is the better typical value here",
    },
    {
      id: "w2",
      prompt:
        "A frequency table records values 1, 2, 3 and 4 with frequencies 3, 4, 2 and 1. Find the mean, median, mode and range.",
      steps: [
        {
          move: "Rebuild the total: 1×3 + 2×4 + 3×2 + 4×1 = 3 + 8 + 6 + 4 = 21. The total frequency is 3 + 4 + 2 + 1 = 10.",
          why:
            "The frequency is how many times a value occurs. Multiplying reconstructs all ten values without listing them.",
        },
        {
          move: "Mean = 21 ÷ 10 = 2.1. The largest value present is 4 and the smallest is 1, so the range is 3.",
          why:
            "The mean uses the total and the count. The range uses the extreme values that actually occur, not the frequency totals.",
        },
        {
          move: "Cumulative frequencies are 3, 7, 9, 10. The fifth and sixth values both lie in the group for 2 (positions 4 to 7), so the median is 2.",
          why:
            "With ten values, the median is the mean of the fifth and sixth. Both are 2, so the median is 2, not 2.1.",
        },
        {
          move: "The largest frequency is 4, attached to the value 2, so the mode is 2.",
          why:
            "The mode is the value with the highest count. It is not the highest value in the table.",
        },
      ],
      answer: "mean 2.1; median 2; mode 2; range 3",
    },
    {
      id: "w3",
      prompt:
        "Class A has 12 students with a mean score of 65. Class B has 18 students with a mean score of 80. Find the mean score of both classes together.",
      steps: [
        {
          move: "Convert each mean back to a total: Class A has 12 × 65 = 780 marks; Class B has 18 × 80 = 1,440 marks.",
          why:
            "A mean is a total divided by a count. Multiplying recovers the total that the mean summarises, and the two group sizes are different.",
        },
        {
          move: "Add the totals and the counts: 780 + 1,440 = 2,220 marks across 12 + 18 = 30 students.",
          why:
            "The combined group is one group of 30 once the totals are known. The counts must be added as well as the totals.",
        },
        {
          move: "Divide: 2,220 ÷ 30 = 74. The unweighted average of 65 and 80 is 72.5, which is wrong because Class B is larger.",
          why:
            "The combined mean must give the 18-student class more weight. Averaging the two means gives the classes equal weight and undercounts Class B.",
        },
      ],
      answer: "combined mean = 74",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "The mean is the middle value. In 3, 4, 4, 5, 30 the middle is 4, so the mean is 4.",
      whyItFails:
        "The middle value is the median, not the mean. The mean is the total divided by the count: 46 ÷ 5 = 9.2. It is pulled above four of the five values by the 30, which is exactly why the mean and median answer different questions.",
      correction:
        "Write the formula as total ÷ count, not 'middle'. Rebuild the total first, then divide. If the data are skewed, calculate both the mean and median and compare them rather than assuming they are the same number.",
      contrast: {
        wrong: "mean = 4 because 4 is in the middle",
        right: "mean = (3 + 4 + 4 + 5 + 30) ÷ 5 = 46 ÷ 5 = 9.2; median = 4",
      },
    },
    {
      id: "m2",
      belief:
        "The median can be read from the list as written. In 9, 2, 8, 4, 7 the middle is 8, so the median is 8.",
      whyItFails:
        "The median is positional only after the values are ordered. The sorted list is 2, 4, 7, 8, 9, so the middle is 7. The unsorted middle is just whichever value happens to be in the third position.",
      correction:
        "Sort first, then count to the middle. For an even count, average the two middle values. Write the sorted list down rather than finding the middle of the original order.",
      contrast: {
        wrong: "median = 8 from 9, 2, 8, 4, 7",
        right: "sorted 2, 4, 7, 8, 9 → median = 7",
      },
    },
    {
      id: "m3",
      belief:
        "The mean is always the fairest average, so a report should quote it even when one value is an extreme outlier.",
      whyItFails:
        "The mean is the total shared equally, so an outlier contributes in full proportion to its size. In 120, 140, 140, 160, 940 the mean is 300, above four of the five days. The median 140 describes a typical day; the mean 300 describes the total takings divided by five, which is a different and easily misleading claim.",
      correction:
        "Ask what the summary is for. Use the median for a typical value when the data are skewed or contain an outlier, the mode for categories, and the mean when every value should count and the distribution is reasonably balanced. Report the range or another measure of spread beside it; never let one number stand for the whole distribution.",
      contrast: {
        wrong: "the mean is 300, so 300 is the typical day",
        right: "the median is 140; the mean 300 is pulled up by the 940 day and should be reported with that fact",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Find the mean, median, mode and range of 6, 9, 9, 12 and 14.",
      hint:
        "Add all five for the mean. Sort them for the median. Count repeats for the mode, and subtract the smallest from the largest for the range.",
      answer:
        "Mean = (6 + 9 + 9 + 12 + 14) ÷ 5 = 50 ÷ 5 = 10. Sorted, the middle is 9, so the median is 9. The mode is 9. The range is 14 − 6 = 8.",
      feedback: {
        correct:
          "You kept the total, the middle position, the frequency and the spread separate.",
        incorrect:
          "The four answers are mean 10, median 9, mode 9 and range 8. If you gave 9 for the mean, you found the middle rather than dividing the total.",
      },
    },
    {
      id: "p2",
      prompt:
        "A frequency table has values 0, 1 and 2 with frequencies 4, 3 and 3. Find the mean, median and mode.",
      hint:
        "The total frequency is 10. Rebuild the total value with 0×4 + 1×3 + 2×3, then divide. For the median, locate the fifth and sixth values using cumulative frequencies.",
      answer:
        "Total = 0×4 + 1×3 + 2×3 = 0 + 3 + 6 = 9, and there are 10 values, so the mean is 0.9. The cumulative frequencies are 4 and 7; the fifth and sixth values are both 1, so the median is 1. The largest frequency is 4, attached to 0, so the mode is 0.",
      feedback: {
        correct:
          "You used the frequencies as counts and did not mistake the most frequent value for the largest value.",
        incorrect:
          "The mean is 0.9, the median is 1 and the mode is 0. The mode is the value with frequency 4, not the largest value in the table.",
      },
    },
    {
      id: "p3",
      prompt:
        "The mean of six values is 14. Five of the values add to 67. What is the sixth value?",
      hint:
        "Rebuild the total from the mean and the count, then subtract the five known values.",
      answer:
        "The total is 6 × 14 = 84. The five known values add to 67, so the sixth is 84 − 67 = 17.",
      feedback: {
        correct:
          "You rebuilt the total first; multiplying the mean by the count is the step that makes a missing value findable.",
        incorrect:
          "The total is 6 × 14 = 84, not 14 + 6. The missing value is 84 − 67 = 17.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A shop records five daily sales in pounds: 120, 140, 140, 160 and 940. Calculate the mean, median, mode and range. Which average best represents a typical day, and why? Explain when the mode is the only sensible average and why the range is not an average.",
      modelAnswer:
        "The total is 120 + 140 + 140 + 160 + 940 = 1,500, so the mean is 1,500 ÷ 5 = 300. Sorted, the middle value is 140, so the median is 140. The mode is 140 because it occurs twice. The range is 940 − 120 = 820. The median best represents a typical day: four of the five days are £160 or less, while the mean is pulled up by the £940 day. The mode is the only sensible average for categorical data such as colours or makes, where adding and dividing have no meaning. The range is not an average because it measures the distance between the smallest and largest values, not a typical value; it also shows that the sales are very spread out.",
      marking: [
        "Calculates the mean 300 from the total 1,500 and the count 5.",
        "Sorts or otherwise identifies the median 140 and the mode 140, and calculates the range 820.",
        "Chooses the median for a typical day because 940 is an outlier, not merely because it is smaller.",
        "Explains that the mode works for categories and that the range is a measure of spread, not a measure of centre.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A frequency table records values 1, 2 and 3 with frequencies 2, 5 and 3. Find the mean.",
      modelAnswer: "2.1",
      marking: [
        "Rebuilds the total as 1×2 + 2×5 + 3×3 = 21.",
        "Uses the total frequency 2 + 5 + 3 = 10, not the number of rows.",
        "Divides 21 by 10 to get 2.1.",
      ],
      check: { accepted: ["2.1", "2.10", "2.1 items"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "The mean of eight values is 15. Seven of the values add to 103. What is the eighth value?",
      modelAnswer: "17",
      marking: [
        "Rebuilds the total as 8 × 15 = 120.",
        "Subtracts the seven known values: 120 − 103 = 17.",
      ],
      check: { accepted: ["17", "17.0"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Two evening classes revise for a test. Class A has 12 learners with a mean score of 62. Class B has 18 learners with a mean score of 77. The tutor averages the two means and reports 69.5. Find the correct combined mean and explain the error. Then a 13th learner joins Class A and scores 100. Explain why Class A's mean rises more than its median. Which summary should the tutor publish, and what should it say?",
      whyItTransfers:
        "The lesson calculates means from a list and from a table. Here the learner must convert two means back to totals, give the larger group its proper weight, and then reason about a new outlier without being given the individual scores. The arithmetic is familiar; the decision about what the two summaries mean is new.",
      answer:
        "Class A holds 12 × 62 = 744 marks and Class B holds 18 × 77 = 1,386 marks, so the combined mean is (744 + 1,386) ÷ (12 + 18) = 2,130 ÷ 30 = 71. The reported 69.5 is the unweighted average of 62 and 77, which gives each class equal influence even though Class B has 18 learners to Class A's 12. When a 13th learner scores 100, Class A's new mean is (744 + 100) ÷ 13 ≈ 64.9, a rise of about 2.9 marks, because the mean uses the full size of the 100. The median moves much less: one new value changes the middle position but does not make the score of 100 carry its full arithmetic weight. The tutor should publish the median and the range, or both the mean and median with the group sizes, and say that the mean is pulled upward by the 100; publishing only the unweighted 69.5 hides the unequal group sizes and the outlier.",
      marking: [
        "Converts both means back to totals: 744 and 1,386, then divides 2,130 by 30 to get 71.",
        "Explains that the unweighted average 69.5 ignores the different group sizes; Class B must carry more weight.",
        "Calculates Class A's new mean (744 + 100) ÷ 13 ≈ 64.9 and explains that the mean responds to the full size of the 100.",
        "Explains that the median is positional and therefore changes much less, and recommends publishing a summary that names the outlier and the spread rather than hiding them.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "The mean of five values is 9. Four of them add to 31. What is the fifth value?",
      answer:
        "The total is 5 × 9 = 45, so the fifth value is 45 − 31 = 14.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "For 2, 9, 4, 7, 5 and 8, find the median, the range and the mode.",
      answer:
        "Sorted: 2, 4, 5, 7, 8, 9. The middle pair is 5 and 7, so the median is 6. The range is 9 − 2 = 7. Every value occurs once, so there is no mode.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A frequency table has values 1, 2 and 3 with frequencies 5, 3 and 2. Find the mean and the median.",
      answer:
        "The total is 1×5 + 2×3 + 3×2 = 5 + 6 + 6 = 17 over 10 values, so the mean is 1.7. The cumulative frequencies are 5 and 8; the fifth and sixth values are 1 and 2, so the median is 1.5.",
      when: "month-later",
    },
  ],

  summary: [
    "Mean = total ÷ count. It uses every value and moves when an outlier moves.",
    "Median = the middle after sorting, or the mean of the two middle values. Mode = most frequent. Range = largest − smallest, a measure of spread.",
    "In a frequency table, multiply each value by its frequency to rebuild the total; the count is the total frequency.",
    "A combined mean needs both group totals. Average the two means only when the group sizes are equal.",
    "Choose the summary that answers the question without hiding outliers, skew or categories, and report spread alongside centre.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every data set is written in order in the prompt, and the sorted order is repeated in each worked explanation. No answer depends on seeing a table layout; frequency pairs are also described in words.",
    },
    {
      need: "low-vision",
      alternative:
        "Numbers and formulas are set in the reading text at the learner's chosen size. The frequency table is a short written list, not an image with small labels.",
    },
    {
      need: "dyslexia",
      alternative:
        "The calculation order is explicit and repeated: sort, count, total, divide, check. Mean, median, mode and range answers are written on separate lines with their names.",
    },
    {
      need: "colour-vision",
      alternative:
        "Values and categories are named in words, never distinguished by colour. The 'typical' choice is justified in prose, not by a coloured highlight.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers are typed. No dragging, sorting by hand or drawing is required; a learner may write a sorted list on paper but is not assessed on the handwriting.",
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
        "All explanations, examples, practice, assessments and the two-class transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content and the National Curriculum for statistics.",
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
