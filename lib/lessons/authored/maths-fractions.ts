import type { AuthoredLesson } from "../../lesson-contract";

// One representative Mathematics lesson, authored to openmind.lesson/1.0.
//
// WHY THIS CONCEPT. Fractions is the first place a learner meets a number that
// is not a count, and the misunderstanding it plants — "the bottom number is an
// amount" — is carried into ratio, proportion, probability and algebra. A
// lesson here is load-bearing for the rest of the mathematics genome.
export const MATHS_FRACTIONS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "fractions",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: fractions",
    level: "Key Stage 3 to Foundation GCSE",
    note: "Objective phrased against the published subject content. No specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Decide which of two fractions is larger and justify it by the size of the pieces, not the size of the numbers.",
      evidence:
        "Given three eighths and two fifths, the learner writes that three eighths is smaller because fifteen fortieths is fewer than sixteen fortieths — or compares each with one half — rather than because eight is bigger than four.",
    },
    {
      statement:
        "Write an equivalent fraction and explain why its value has not changed.",
      evidence:
        "The learner produces fifteen twentieths for three quarters and says that multiplying the top and the bottom by the same number renames the pieces without changing how much there is.",
    },
    {
      statement:
        "Place a fraction on a number line between zero and one and read its position as a size.",
      evidence:
        "The learner puts five eighths to the right of one half and left of one, and says why it is nearer to one half than to one.",
    },
  ],

  priorKnowledge: {
    // The genome declares no prerequisites for this stage-0 concept, so the
    // lesson names what a learner needs and PROBES it: the division check below
    // is the evidence, not an assumption about the course order.
    conceptIds: ["division"],
    check: [
      {
        id: "d1",
        question:
          "A chocolate bar is cut into four equal pieces and you eat one. A second identical bar is cut into eight equal pieces and you eat one of those. Which piece was bigger, and why?",
        answer:
          "The quarter. Cutting the same bar into more pieces makes each piece smaller, so an eighth is half the size of a quarter.",
        targets: ["division", "fractions"],
      },
      {
        id: "d2",
        question: "What does twelve divided by three mean, in words?",
        answer:
          "Either how many groups of three fit into twelve, or how big each share is when twelve is split into three equal parts. Both answers are four.",
        targets: ["division"],
      },
    ],
  },

  introduction: {
    hook:
      "Two friends order the same size pizza. One cuts hers into four slices and eats one. The other cuts his into eight slices and eats one. Both say they had a slice, and one of them had twice as much pizza as the other.",
    why:
      "Both statements are true, and the reason is the whole idea: a fraction is two numbers doing two different jobs. The bottom number says how many pieces the whole was cut into — it is a size. The top number counts the pieces you have — it is an amount. Almost every fraction mistake comes from reading the bottom number as though it were the top one.",
  },

  explanation: [
    {
      heading: "Fractions count pieces of a declared size",
      paragraphs: [
        "In three quarters, the four declares that the whole was cut into four equal pieces, and the three says how many of them you have. Read it aloud that way — three pieces, each a quarter — and the notation stops being two numbers stacked on top of each other. The bar between them is not a minus sign and not a division you have forgotten to finish; it is the word of, as in three of the four equal pieces.",
        "That reading immediately explains the fact that surprises almost everyone: one eighth is smaller than one quarter, even though eight is bigger than four. The bottom number is not how much you get. It is how many ways the whole was divided, so a larger bottom number means a smaller slice. If you cut the same cake into more pieces, each piece must be smaller — there is no way around it, because the cake did not grow.",
      ],
    },
    {
      heading: "The same amount can wear different names",
      paragraphs: [
        "One half, two quarters and three sixths are the same amount of the same whole. Multiplying the top and the bottom by the same number doubles the count and halves the piece size at the same time, and those two changes cancel exactly. You are renaming the pieces, not changing the amount of cake. That is why an equivalent fraction is written with an equals sign rather than an arrow: the number has not moved.",
        "This is the move that makes comparison possible. Two fractions cut into different sizes of piece cannot be compared by their top numbers, because three big pieces and two small pieces are not counts of the same thing. Give both fractions the same denominator — the same size of piece — and the top numbers become plain counts that can be compared directly.",
      ],
    },
    {
      heading: "A fraction is one number in a place on the line",
      paragraphs: [
        "Three quarters is not a calculation waiting to happen. It is a single number that sits between zero and one, closer to one than to zero. Once you can see it there, adding, comparing and scaling it are operations on a number rather than rules about two integers that happen to be written above and below a line.",
        "The number line also gives you a check that needs no arithmetic at all. Compare each fraction with one half: a fraction whose top is less than half its bottom is below one half, and one whose top is more than half its bottom is above it. Three eighths is below one half because three is less than four; two fifths is below one half because two is less than two and a half. To decide between them you still need a common denominator, but the check tells you immediately when an answer is impossible.",
      ],
    },
    {
      heading: "Decimals and percentages are the same number in another notation",
      paragraphs: [
        "Three quarters is also nought point seven five and also seventy-five per cent. Nothing about the quantity changes when the notation does: a fraction, a decimal and a percentage are three ways of writing one position on the number line. A learner who knows where three quarters sits already knows most of what the next two topics teach, and a learner who does not will find percentages mysterious for a reason that has nothing to do with percentages.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The same amount written three ways. Each line is one number, not a sum.",
      notation: "3/4 = 0.75 = 75%",
      caption:
        "Three quarters, nought point seven five and seventy-five per cent are the same position on the number line. The equals signs are true because the quantity is unchanged, only its name.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "Two identical bars. The top bar is cut into four equal parts with three shaded; the bottom is cut into eight equal parts with six shaded. The shaded area is the same, which is what three quarters equals six eighths means.",
      notation: "bar A: 4 parts, 3 shaded | bar B: 8 parts, 6 shaded",
      caption:
        "Cutting every quarter in half doubles the number of pieces and halves each piece, so the shaded amount does not move. This is why multiplying top and bottom by the same number never changes the value.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body:
        "A line from zero to one with halves marked, then quarters, then eighths. Three quarters sits three quarters of the way along; five eighths sits just past the halfway mark.",
      notation: "0 — 1/8 — 1/4 — 3/8 — 1/2 — 5/8 — 3/4 — 7/8 — 1",
      caption:
        "Position is size. Five eighths is past one half because five is more than half of eight, and that comparison needs no common denominator.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Which is larger, three eighths or two fifths? Show how you decide.",
      steps: [
        {
          move:
            "Notice that the two fractions are cut into different sizes of piece: eighths and fifths, so the top numbers cannot be compared yet.",
          why:
            "Comparing three with two only works when both counts describe pieces of the same size. Here three eighths and two fifths are counts of different things.",
        },
        {
          move:
            "Rewrite both with a common denominator of forty: three eighths becomes fifteen fortieths, and two fifths becomes sixteen fortieths.",
          why:
            "Multiplying the top and the bottom by the same number renames the pieces without changing the amount, so each fraction keeps its value. Forty is the smallest number that both eight and five divide into.",
        },
        {
          move:
            "Now compare the counts of fortieths: fifteen is fewer than sixteen, so three eighths is the smaller fraction.",
          why:
            "Once the pieces are the same size, the top number is a plain count and can be compared directly. Fifteen fortieths is less than sixteen fortieths.",
        },
      ],
      answer: "three eighths is smaller than two fifths (15/40 against 16/40, so 3/8 < 2/5)",
    },
    {
      id: "w2",
      prompt:
        "One recipe uses three quarters of a bag of flour and another uses five sixths of a bag. Which uses more, and by what fraction of a bag?",
      steps: [
        {
          move:
            "Find a common denominator for quarters and sixths, which is twelve.",
          why:
            "The two amounts are in different sizes of piece, so they cannot be subtracted or compared until the pieces match. Twelve is the smallest number both four and six divide into.",
        },
        {
          move:
            "Convert both: three quarters is nine twelfths, and five sixths is ten twelfths.",
          why:
            "Each conversion multiplies top and bottom by the same number, so the amount of flour in each recipe is unchanged — only the way it is counted changes.",
        },
        {
          move:
            "Compare ten twelfths with nine twelfths, then subtract to find the difference: ten minus nine is one twelfth.",
          why:
            "With equal-sized pieces the counts can be compared and subtracted directly. The answer is a difference of one twelfth of a bag, not one twelfth of a recipe.",
        },
      ],
      answer: "five sixths is larger, by 1/12 of a bag",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "One eighth is bigger than one quarter, because eight is bigger than four.",
      whyItFails:
        "The bottom number counts the pieces, so a larger bottom number means each piece is smaller. Cutting the same bar into eight makes every piece half the size of the quarter you had before. The numbers on the bottom are describing the cut, not the amount.",
      correction:
        "Read the bottom number as a size and the top as a count. One piece of a bar cut into eight is smaller than one piece of the same bar cut into four, because there are more pieces sharing the same whole.",
      contrast: {
        wrong: "1/8 > 1/4 because 8 > 4",
        right: "1/8 < 1/4 because eighths are half the size of quarters",
      },
    },
    {
      id: "m2",
      belief:
        "Two fractions with different bottom numbers can be compared by looking at their top numbers.",
      whyItFails:
        "The top number is a count of pieces, and a piece of one size is not the same as a piece of another. Two large slices and three small slices cannot be counted against each other until the slices are the same size. Comparing tops alone answers a different question from the one that was asked.",
      correction:
        "Make the pieces the same size first, by finding a common denominator, and only then compare the counts. Alternatively compare each fraction with one half, which needs no conversion.",
      contrast: {
        wrong: "3/8 > 2/5 because 3 > 2",
        right: "3/8 < 2/5 because 15/40 < 16/40",
      },
    },
    {
      id: "m3",
      belief: "Adding two fractions means adding the tops and adding the bottoms.",
      whyItFails:
        "Adding the bottoms changes the size of every piece in the answer, so the sum is no longer made of the pieces you started with. One half plus one half would become two quarters, which is one half — but two halves are a whole. The arithmetic has described a different operation from the one intended.",
      correction:
        "Add counts of pieces that are already the same size. If the denominators match, add only the tops. If they do not, convert to a common denominator first, then add the tops.",
      contrast: {
        wrong: "1/2 + 1/2 = 2/4",
        right: "1/2 + 1/2 = 2/2 = 1",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Which is larger, two thirds or three fifths? Show the common denominator you used.",
      hint:
        "The smallest number that both three and five divide into is fifteen. Convert both fractions to fifteenths before comparing.",
      answer: "two thirds is larger: 2/3 = 10/15 and 3/5 = 9/15",
      feedback: {
        correct:
          "You converted both to fifteenths and compared ten with nine. The common denominator is what made the comparison possible.",
        incorrect:
          "Check which number you converted to. If the tops were compared directly, the pieces were still different sizes — convert both to fifteenths first.",
      },
    },
    {
      id: "p2",
      prompt: "Write a fraction equivalent to three quarters with denominator twenty.",
      hint:
        "Ask what four was multiplied by to reach twenty, then multiply the top by the same number.",
      answer: "fifteen twentieths",
      feedback: {
        correct:
          "Four times five is twenty, so three times five is fifteen. Multiplying both parts by five renamed the pieces without changing the amount.",
        incorrect:
          "If you wrote three twentieths, only the bottom changed — that makes the fraction five times smaller. Whatever you multiply the bottom by, multiply the top by too.",
      },
    },
    {
      id: "p3",
      prompt: "Put five eighths, one half and nine sixteenths in order, smallest first.",
      hint:
        "Sixteenths is a common denominator for all three. Convert each fraction before ordering.",
      answer: "one half, then nine sixteenths, then five eighths",
      feedback: {
        correct:
          "In sixteenths the three are eight, nine and ten, so the order is one half, nine sixteenths, five eighths.",
        incorrect:
          "Check the conversion of five eighths: eight times two is sixteen, so the top must also double to ten. Ordering by the top numbers alone would put five eighths first instead of last.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why one eighth is smaller than one quarter, even though eight is larger than four.",
      modelAnswer:
        "The bottom number says how many equal pieces the whole was cut into, so it describes the size of each piece rather than how many you have. Cutting the same whole into eight pieces instead of four makes every piece half as large, so one eighth is half of one quarter.",
      marking: [
        "States that the denominator describes the number (or size) of the pieces, not the quantity taken.",
        "Uses the same whole being cut into more pieces, so each piece must be smaller.",
        "Concludes that one eighth is smaller than one quarter, consistent with the reasoning.",
      ],
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "Sam writes one half plus one half equals two quarters. Explain what has gone wrong and give the correct answer.",
      modelAnswer:
        "Sam added the denominators, which changes the size of the pieces in the answer. Halves and halves are already the same size, so only the top numbers should be added: one plus one is two halves, which is one whole. The answer is one, not two quarters.",
      marking: [
        "Identifies that adding the denominators changed the size of the pieces.",
        "States that fractions with the same denominator are added by adding the numerators only.",
        "Gives the correct answer of one whole.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Two classes of the same size sit the same test. Three fifths of Class A pass and five eighths of Class B pass. Which class had the larger share pass? Decide without turning either fraction into a percentage, and say how you know.",
      whyItTransfers:
        "The comparison is the same one the worked example made, but the familiar bar model is gone and the quantities are described as shares of a group rather than parts of a shape. The learner has to choose the method rather than follow a diagram.",
      answer:
        "Class B: five eighths is larger than three fifths, because in fortieths they are twenty-five fortieths against twenty-four fortieths.",
      marking: [
        "Chooses a valid comparison method (common denominator or comparison with one half).",
        "Shows the converted values or the reasoning that establishes the order.",
        "Names Class B and connects the conclusion to the comparison.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Without a calculator, say which is larger: seven twelfths or four sevenths.",
      answer:
        "Four sevenths: in eighty-fourths they are forty-nine eighty-fourths against forty-eight eighty-fourths.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Write nought point six as a fraction in its simplest form, and explain the link to tenths.",
      answer: "Three fifths, because nought point six is six tenths and both parts divide by two.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A learner says one ninth is bigger than one tenth because nine is bigger than ten. What would you say to them?",
      answer:
        "The bottom number is the number of pieces the whole was cut into, so a ninth is a larger piece than a tenth — here the learner has the order right by accident and the reason wrong, which will fail on the next question.",
      when: "month-later",
    },
  ],

  summary: [
    "The bottom number names the size of the pieces; the top number counts them.",
    "More pieces means smaller pieces, so a larger denominator is a smaller fraction.",
    "Multiplying top and bottom by the same number renames the pieces without changing the amount, which is what makes comparison possible.",
    "A fraction is one number at one place on the line — decimals and percentages are the same place in another notation.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every fraction is announced as words — three eighths — and the bar model is described as the number of shaded parts out of the number of equal parts.",
    },
    {
      need: "dyslexia",
      alternative:
        "Paragraphs are short and each worked example repeats the same three moves in the same order, so the structure is predictable even when the numbers change.",
    },
    {
      need: "motor",
      alternative:
        "Nothing in the lesson requires dragging. Answers are typed or selected, and the number line is readable without interaction.",
    },
    {
      need: "colour-vision",
      alternative:
        "Shaded parts of the bar model are distinguished by pattern and by a written count, not by colour alone.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note: "All explanations, examples, practice and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Objective phrased against the published GCSE mathematics subject content for number.",
      reproduction: "none",
      note: "Cited for scope only. No specification or textbook text is reproduced, and no question is copied.",
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
