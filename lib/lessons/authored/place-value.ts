import type { AuthoredLesson } from "../../lesson-contract";

// Foundation batch 3, concept 1 — the root of the mathematics chain.
//
// WHY THIS CONCEPT FIRST. Every later idea in the maths genome reads a written
// number: decimals extend this system to the right of the point, standard form
// compresses it, and column arithmetic relies on it entirely. A learner who
// reads "452" as three separate digits will find every one of those topics
// arbitrary.
export const MATHS_PLACE_VALUE: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "place-value",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: place value and the number system",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Read a digit's value from its position, and compare two numbers by their highest place value rather than by their length.",
      evidence:
        "Given 3,040 and 3,400, the learner says 3,400 is larger because the hundreds digit is 4 rather than 0, and does not compare 3040 with 3400 digit by digit from the left as though the digits were independent.",
    },
    {
      statement: "Write a number in expanded form and rebuild it from its parts.",
      evidence:
        "The learner writes 3,040 as 3,000 + 40 and explains that the zero in the hundreds column holds that column empty rather than adding nothing.",
    },
    {
      statement: "Explain why moving a digit one place to the left multiplies its value by ten.",
      evidence:
        "The learner says each column is ten times the column on its right, so the same digit in the next column along is worth ten of what it was.",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question: "Count on from 8 by one. What comes after 9?",
        answer: "Ten: the count of ten ones is written as 1 in the next column.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "Which is more, 7 or 2?",
        answer: "Seven. This matters because the same question about digits in a number has a different answer.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "A shop assistant reads a price tag aloud as \"forty-five, not four and five\". The two digits are the same shapes on the card, and the only thing that turned them into a price was where they sat.",
    why:
      "Written numbers are not a list of digits. Each position is a column with a fixed value, and the digit in it says how many of that column there are. That single rule is why ten symbols can write any number at all, and why the same digit can be worth four or four hundred.",
  },

  explanation: [
    {
      heading: "Every column has a value of its own",
      paragraphs: [
        "In four hundred and fifty-two, the digit four does not mean four. It sits in the hundreds column, so it means four hundreds. The five sits in the tens column and means fifty. The two sits in the ones column and means two. The number is those three amounts added, which is why four hundred and fifty-two is larger than either four or fifty-two on their own.",
        "The columns are fixed in advance, not decided by the digits. That is what lets the same symbol do different jobs in different numbers: a seven in the tens column is seventy, and the same seven in the thousands column is seven thousand. The symbol is a count; the column is the unit being counted.",
      ],
    },
    {
      heading: "Each column is ten of the one on its right",
      paragraphs: [
        "Ten ones make one ten; ten tens make one hundred; ten hundreds make one thousand. Because each column is worth ten times the column to its right, moving a digit one place to the left multiplies what it is worth by ten. This is the whole of the written number system, and it is the reason we carry when a column reaches ten.",
        "The pattern continues to the right of the decimal point, where each column is worth a tenth of the one on its left. A number is therefore not split into a whole part and a fraction that ignore each other: it is one row of columns, and the point only marks where the ones column ends.",
      ],
    },
    {
      heading: "A zero holds a column open",
      paragraphs: [
        "In three thousand and forty, the zero in the hundreds column says that column is empty. It is not nothing: without it the digits would slide right and the number would read as three hundred and four. The zero is a placeholder, and a number written without it is a different number, not a shortened version of the same one.",
        "This also explains why a longer number is not automatically larger, and why a shorter one is not automatically smaller. Nine hundred and ninety-nine is longer than one thousand but smaller. What decides size is the leftmost column that is not empty, because that column is worth more than every column to its right combined.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "One number, written as the three amounts its columns hold.",
      notation: "452 = 400 + 50 + 2",
      caption:
        "The digit four is worth four hundreds, the five is worth fifty and the two is worth two. Adding the three amounts gives the number back.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "Base-ten blocks for 452: four flat hundreds, five ten-rods and two unit cubes. The picture is the same sum the notation states.",
      notation: "4 hundreds + 5 tens + 2 ones",
      caption:
        "Ten unit cubes make one rod, and ten rods make one flat. That is why a column is worth ten of the column on its right, and why carrying works.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "The same digits in two positions, far apart on the line.",
      notation: "3,040 — 3,400",
      caption:
        "In 3,040 the hundreds digit is 0; in 3,400 it is 4. The highest column that differs decides which number is larger, which is the hundreds column here.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Which is larger, 452 or 425? Explain your answer.",
      steps: [
        {
          move: "Line the two numbers up by column, not by the order their digits happen to be written.",
          why:
            "Comparing left to right only works when the columns are aligned. Written one under the other with the ones under the ones, each digit faces the digit in the same column.",
        },
        {
          move: "Compare the highest column first: both have 4 hundreds, so hundreds do not decide it.",
          why:
            "The highest column that differs settles the comparison, because it is worth more than all the columns below it combined. Equal hundreds mean the decision moves one column right.",
        },
        {
          move: "Compare the tens: 5 tens against 2 tens, so 452 is larger.",
          why:
            "Fifty is more than twenty, and the ones column cannot make up a difference of thirty. This is why 452 beats 425 even though the later digits would suggest otherwise.",
        },
      ],
      answer: "452 is larger, because 5 tens is more than 2 tens",
    },
    {
      id: "w2",
      prompt: "Write 3,040 in expanded form, and say what the zero is doing.",
      steps: [
        {
          move: "Read each column in turn: 3 thousands, 0 hundreds, 4 tens, 0 ones.",
          why:
            "Expanded form works column by column from the left. Reading the digits in order keeps the columns from sliding, which is the error this step prevents.",
        },
        {
          move: "Write the amounts that are not zero: 3,000 + 40.",
          why:
            "Zero hundreds contribute nothing to the sum, so they are left out of the addition. Leaving them out of the WRITTEN number would be a different mistake entirely.",
        },
        {
          move: "Keep the zero in the original number: 3,040, where it holds the hundreds column open between the 3 and the 4.",
          why:
            "Without that zero the digits would shift right and the number would read as three hundred and four. The zero is doing structural work, not standing for an amount.",
        },
      ],
      answer: "3,040 = 3,000 + 40, and the zero holds the hundreds column open",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The longer number is always the larger one.",
      whyItFails:
        "Length counts columns, and a column can be empty or small. Nine hundred and ninety-nine has three digits and one thousand has four, yet one thousand is larger. Deciding by length ignores what each column is worth.",
      correction:
        "Compare the leftmost column that is not empty. That column outweighs every column to its right, so it decides the comparison before any other digit is read.",
      contrast: {
        wrong: "999 is bigger than 1,000 because it has more of its digits filled",
        right: "1,000 is bigger because its highest column is thousands",
      },
    },
    {
      id: "m2",
      belief: "A zero adds nothing, so it can be left out of a number.",
      whyItFails:
        "The zero has no value of its own, but it holds a column open. Removing it slides every digit to its right one column left, which changes what each of those digits is worth. Three thousand and forty becomes three hundred and four.",
      correction:
        "Read the zero as an instruction about the column, not an amount. It says this column is empty; it does not say the column can be deleted.",
      contrast: {
        wrong: "3,040 = 340",
        right: "3,040 = 3,000 + 40, with the hundreds column empty",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "What is the digit 7 worth in 5,720?",
      hint: "Name the column the 7 sits in before you say its value.",
      answer: "Seven hundred, because it sits in the hundreds column",
      feedback: {
        correct: "You named the column first, which is what makes the value follow.",
        incorrect: "The 7 is not worth seven. Count the columns from the right: ones, tens, hundreds.",
      },
    },
    {
      id: "p2",
      prompt: "Write 6,005 in expanded form.",
      hint: "There are two empty columns. Name each column before you add anything.",
      answer: "6,000 + 5",
      feedback: {
        correct: "Six thousands and five ones, with the hundreds and tens columns empty.",
        incorrect: "Check the columns: 6 in thousands, 0 hundreds, 0 tens, 5 ones.",
      },
    },
    {
      id: "p3",
      prompt: "Which is larger, 4,099 or 4,100? Say which column decides it.",
      hint: "The thousands are equal. Move one column right and compare again.",
      answer: "4,100 is larger; the hundreds column decides it",
      feedback: {
        correct: "Nine hundred and ninety-nine versus one hundred is decided in the hundreds column.",
        incorrect: "Compare column by column from the left, not digit by digit within the number.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Write 3,040 as a number with no comma and no spaces.",
      // A short-answer item's answer IS its key: "3040" is the whole answer, and
      // padding it into a sentence would be writing for the gate rather than for
      // the learner. The marking notes are what a person would still look at —
      // the columns, not just the digits — so there are two of them.
      modelAnswer: "3040",
      marking: [
        "Writes four digits, with the same columns as 3,040.",
        "Keeps the zero between the 3 and the 4, so the 4 stays in the tens column rather than sliding into the hundreds.",
      ],
      check: { accepted: ["3040", "3,040"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner says 999 is larger than 1,000 because it has three of its digits filled and 1,000 has only one. Explain what is wrong with that reasoning.",
      modelAnswer:
        "Counting filled digits compares columns as though they were all worth the same. The columns are not equal: the 1 in 1,000 is worth one thousand, which is more than the 999's nine hundreds, nine tens and nine ones added together. The leftmost non-empty column decides the comparison.",
      marking: [
        "States that columns have different values rather than all counting the same.",
        "Identifies the thousands column as outweighing the hundreds, tens and ones together.",
        "Concludes that 1,000 is larger, consistent with the reasoning.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A till displays 1,050 and a receipt prints 1,500. A customer says the receipt must be wrong because both numbers have four digits and the same first two digits. Use place value to explain which is larger and why the digits alone do not settle it.",
      whyItTransfers:
        "The setting is a receipt rather than a worksheet and the two numbers differ in a column that is easy to skip. The learner has to apply the column rule to a real comparison instead of a written exercise.",
      answer:
        "1,500 is larger, because the hundreds digit is 5 rather than 0. Both have 1 thousand, so the decision moves to the hundreds column.",
      marking: [
        "Aligns the numbers by column.",
        "Identifies the hundreds column as the one that differs.",
        "Concludes that 1,500 is larger, referring to the column rather than the digit count.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What is the digit 8 worth in 2,806?",
      answer: "Eight hundred, because it sits in the hundreds column.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Write four thousand and six in digits.",
      answer: "4,006, with the hundreds and tens columns empty.",
      when: "week-later",
    },
  ],

  summary: [
    "A digit's value comes from its column: hundreds, tens, ones, and on to the left and right.",
    "Each column is worth ten of the column on its right, which is why a digit moving left is worth ten times more.",
    "A zero holds a column open; removing it slides the digits and changes the number.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Column headings are announced before the digits beneath them, so the digit and its column are heard together rather than as a run of symbols.",
    },
    {
      need: "dyslexia",
      alternative:
        "Long numbers are grouped by column with visible spacing, and expanded form is written one column per line.",
    },
    {
      need: "colour-vision",
      alternative:
        "Base-ten blocks are distinguished by shape and by a printed count, never by colour alone.",
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
      attribution: "Scope cited against the published GCSE mathematics subject content for number.",
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
  // The RECORD of what exists in other languages. It lives on the English
  // source as well as on each translation, so the catalogue can count
  // translations without loading every translated lesson — and so "machine" is
  // visible where a reader looks up the lesson's own status.
  translations: [
    { language: "es", status: "machine", translator: "OpenMind translation pipeline", lessonVersion: "1.0.0" },
    { language: "fr", status: "machine", translator: "OpenMind translation pipeline", lessonVersion: "1.0.0" },
  ],
};
