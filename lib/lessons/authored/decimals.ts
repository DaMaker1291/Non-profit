import type { AuthoredLesson } from "../../lesson-contract";

// Foundation batch 4, concept 1 — place value continued to the right of the point.
//
// WHY THIS IS THE FIRST OF THE SIX. Decimals are not a new system: they are the
// same columns place value already established, extended to the right, where each
// column is worth a tenth of the one on its left. A learner who meets this as
// "numbers with a dot in them" meets a second, unrelated system on top of the
// first, and every comparison after that is guesswork.
export const MATHS_DECIMALS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "decimals",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: decimals and decimal place value",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Read the value of a digit to the right of the decimal point, and compare two decimals by their highest differing column rather than by the length of their digits.",
      evidence:
        "Given 0.45 and 0.5, the learner says 0.5 is larger because the tenths column holds 5 against 4, and does not argue from 45 being greater than 5.",
    },
    {
      statement: "Write a decimal as a fraction over ten, a hundred or a thousand, and back again.",
      evidence:
        "The learner writes 0.07 as seven hundredths and writes three tenths as 0.3, naming the denominator from the column the digit sits in.",
    },
    {
      statement: "Multiply two decimals and place the point by reasoning about the size of the answer.",
      evidence:
        "The learner works out 0.3 multiplied by 0.2 as 0.06 and says the answer is smaller than both factors, because two tenths of three tenths is six hundredths.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["place-value"],
    check: [
      {
        id: "d1",
        question: "In the number 452, what is the 4 worth, and why?",
        answer:
          "Four hundred, because it sits in the hundreds column: a digit is worth its face value times the column it occupies.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "What happens to a digit's value when it moves one column to the left?",
        answer:
          "It becomes worth ten times as much, because every column is ten of the column on its right.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "Two sprinters' times are printed as 10.9 seconds and 10.45 seconds. The second number has more digits, and the runner who recorded it won: 10.45 seconds is the faster time, because 45 hundredths is less than 9 tenths.",
    why:
      "A decimal is not a whole number with a decoration on the end. It is the same row of columns place value already gave you, continued past the ones, and the point only marks where the ones column stops. Once that is clear, comparing decimals is comparing columns, and multiplying them is counting columns.",
  },

  explanation: [
    {
      heading: "The point marks where the ones end",
      paragraphs: [
        "Everything to the left of the point counts wholes: ones, tens, hundreds, each column ten times the one on its right. Everything to the right continues the same pattern in the other direction, so the first column past the point counts tenths, the next counts hundredths, and each is a tenth of the column to its left. A decimal number is therefore one row of columns, not two numbers joined by a dot.",
        "That is why 0.3 is read as three tenths rather than as zero point three. The digit 3 sits in the tenths column, so it counts three of them, and three tenths is the same amount as the fraction three over ten. The digit has not changed its meaning from whole numbers: it is still a count. What changed is the size of the thing being counted.",
      ],
    },
    {
      heading: "Trailing zeroes are silent, inner zeroes are not",
      paragraphs: [
        "A zero at the end of a decimal does not change its value, because it counts zero hundredths or zero thousandths and adds nothing. So 0.50 and 0.5 are the same number, and 2.700 is 2.7. Writing the extra zero can be useful when you want both numbers to show the same columns, for instance when adding, but it never changes what the number is worth.",
        "A zero between the point and a digit is doing the opposite job. In 0.05 the zero in the tenths column says that column is empty, and the 5 counts hundredths, which is five hundredths. Remove that zero and you have 0.5, which is five tenths and ten times larger. The inner zero holds a column open, exactly as the zero in 3,040 does.",
      ],
    },
    {
      heading: "Multiplying decimals means counting columns",
      paragraphs: [
        "When you multiply two decimals, the digits multiply as whole numbers and the columns decide where the point goes. Three tenths multiplied by two tenths asks for two tenths of three tenths: three times two is six, and a tenth of a tenth is a hundredth, so the answer is six hundredths, written 0.06. The number of decimal places in the answer is the total number of decimal places in the two factors.",
        "The answer is smaller than both factors, which surprises learners who expect multiplication to grow a number. It grows a number only when the multiplier is more than one. Multiplying by a number below one takes a part of the original amount, so a half of a half is a quarter, and two tenths of three tenths is less than three tenths. Checking that direction is how you catch a misplaced point.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "The same amount written as a decimal and as a fraction, column for column.",
      notation: "0.3 = 3/10   0.07 = 7/100   0.25 = 25/100",
      caption:
        "One decimal place means tenths, two mean hundredths. The denominator is decided by the column, not by the digit.",
    },
    {
      id: "r2",
      kind: "maths.number-line",
      body: "Two numbers that look similar in digits but sit in different places on the line.",
      notation: "0.09 — 0.10",
      caption:
        "Nine hundredths is to the left of ten hundredths. The digits 9 and 1 are misleading; the tenths column, 0 against 1, decides it.",
    },
    {
      id: "r3",
      kind: "maths.area-model",
      body:
        "A square cut into one hundred equal cells. Three tenths of the square is a band of thirty cells, and two tenths of that band is six cells.",
      notation: "0.3 × 0.2 = 0.06",
      caption:
        "Six cells out of a hundred is six hundredths. The picture shows why tenths multiplied by tenths land in the hundredths column.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Which is larger, 0.09 or 0.1? Explain your answer.",
      steps: [
        {
          move: "Write both numbers with the same number of decimal places, so the columns line up.",
          why:
            "Comparing is a column-by-column act, and columns only line up if both numbers show the same ones. Writing 0.1 as 0.10 puts a digit in the hundredths column instead of leaving it blank.",
        },
        {
          move: "Compare the tenths column first: 0 against 1.",
          why:
            "The highest column that differs settles the comparison, because a tenth is worth more than any number of hundredths below it. Here it decides the answer immediately.",
        },
        {
          move: "Conclude that 0.1 is larger, and check with an amount you know.",
          why:
            "Ten hundredths is one tenth, which is ten pence against the nine pence of 0.09. The money check agrees with the columns, which is what makes the conclusion trustworthy.",
        },
      ],
      answer: "0.1 is larger, because its tenths column holds one against zero",
    },
    {
      id: "w2",
      prompt: "Work out 0.4 multiplied by 0.3.",
      steps: [
        {
          move: "Multiply the digits as though the points were not there: four times three is twelve.",
          why:
            "The digits behave exactly as they do in whole-number multiplication. Only the position of the point is in question, so the digits can be done first and placed afterwards.",
        },
        {
          move: "Count the decimal places: one in 0.4 and one in 0.3, so the answer needs two.",
          why:
            "A tenth multiplied by a tenth gives a hundredth, so each decimal place in a factor adds one to the answer. Two places is the total here.",
        },
        {
          move: "Place the point to give 0.12, then check the size against the factors.",
          why:
            "Three tenths of four tenths should be a small part of 0.4, and 0.12 is a bit less than half of it. A point placed wrongly would give 1.2, which is larger than both factors and therefore impossible.",
        },
      ],
      answer: "0.12",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "0.45 is larger than 0.5, because 45 is larger than 5.",
      whyItFails:
        "The digits are being read as whole numbers, as though both sat in the same column. They do not: 0.45 is forty-five hundredths and 0.5 is fifty hundredths, and fifty is the larger count. Comparing digit strings ignores the columns that give each digit its size.",
      correction:
        "Give both numbers the same number of decimal places, then compare column by column from the left. Written as 0.45 and 0.50, the tenths column reads 4 against 5 and the question is settled before the hundredths are reached.",
      contrast: {
        wrong: "0.45 is bigger than 0.5 because 45 is bigger than 5",
        right: "0.5 is bigger than 0.45, because five tenths is fifty hundredths",
      },
    },
    {
      id: "m2",
      belief: "Multiplying always makes a number bigger, so 0.3 multiplied by 0.2 must be more than 0.3.",
      whyItFails:
        "Multiplying grows a number only when the multiplier is greater than one. A multiplier below one takes a part of the original amount, so the answer must be smaller than the number you started with. Expecting growth makes a misplaced point look reasonable.",
      correction:
        "Read the multiplication as a fraction of an amount: two tenths of three tenths. A tenth of three tenths is three hundredths, so two of them is six hundredths, which is smaller than three tenths. The estimate gives you the size before you place the point.",
      contrast: {
        wrong: "0.3 × 0.2 = 0.6, because three times two is six",
        right: "0.3 × 0.2 = 0.06, because tenths times tenths are hundredths",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "What is the digit 7 worth in 0.27?",
      hint: "Count the columns to the right of the point: tenths first, then hundredths.",
      answer: "Seven hundredths, because it is in the second column after the point",
      feedback: {
        correct: "You named the column first, and the value followed from it.",
        incorrect: "The 7 is not worth seven tenths. The tenths column holds the 2; the 7 is one column further right.",
      },
    },
    {
      id: "p2",
      prompt: "Which is larger, 0.6 or 0.58?",
      hint: "Write both with two decimal places before you compare anything.",
      answer: "0.6 is larger, because 0.60 has six tenths against five tenths",
      feedback: {
        correct: "Making the places equal turned a digit comparison into a column comparison.",
        incorrect: "Compare the tenths column, not the digits: 6 against 5 settles it before the hundredths matter.",
      },
    },
    {
      id: "p3",
      prompt: "Work out 0.5 multiplied by 0.6, and say whether the answer should be smaller than 0.5.",
      hint: "Multiply five by six first, then decide how many decimal places the answer needs.",
      answer: "0.30, which is smaller than 0.5 because six tenths of it is a part of it",
      feedback: {
        correct: "Two decimal places, and the size check agrees with the digits.",
        incorrect: "Five times six is thirty, and two decimal places gives 0.30: an answer of 3 or 0.3 has the point in the wrong place.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 0.3 multiplied by 0.2. Give your answer as a decimal.",
      modelAnswer: "0.06",
      marking: [
        "Multiplies the digits to get six.",
        "Gives the answer two decimal places, because each factor has one.",
      ],
      check: { accepted: ["0.06", ".06", "0.060"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner says 0.45 must be larger than 0.5 because 45 is bigger than 5. Explain what is wrong with the reasoning, and show the comparison that settles it.",
      modelAnswer:
        "The reasoning compares the digits as though they were whole numbers in the same column, but they are not: 0.45 is forty-five hundredths and 0.5 is five tenths, which is fifty hundredths. Written with the same number of decimal places, 0.45 and 0.50, the tenths column reads 4 against 5, so 0.5 is the larger number. The digit count is irrelevant; the column is what gives a digit its value.",
      marking: [
        "States that the two numbers' digits sit in different columns.",
        "Converts both to hundredths, or pads 0.5 to 0.50, to compare like with like.",
        "Concludes that 0.5 is larger, consistent with the column comparison.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A pharmacy label reads 0.5 mg and a second reads 0.45 mg. A patient says the second label must be the larger dose because it has more digits. Which dose is larger, and what would you say to correct the reasoning without simply repeating the rule?",
      whyItTransfers:
        "The setting is a medicine label rather than a worksheet, and a wrong answer has a consequence. The learner must use the column comparison to correct a belief rather than to compute an answer.",
      answer:
        "The 0.5 mg dose is larger: five tenths is fifty hundredths against forty-five hundredths. More digits means more precision in the printing, not a larger amount.",
      marking: [
        "Identifies 0.5 mg as the larger dose.",
        "Explains the comparison in hundredths, or by padding 0.5 to 0.50.",
        "Separates the number of digits from the size of the amount.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Which is larger, 0.7 or 0.65?",
      answer: "0.7, because seven tenths is seventy hundredths against sixty-five.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Work out 0.5 multiplied by 0.4.",
      answer: "0.2, because five times four is twenty and two decimal places gives twenty hundredths.",
      when: "week-later",
    },
  ],

  summary: [
    "Columns continue past the point: tenths, hundredths, thousandths, each a tenth of the one before.",
    "Compare decimals column by column, after giving both the same number of decimal places.",
    "A zero at the end changes nothing; a zero just after the point holds a column open.",
    "Multiplying decimals: multiply the digits, add the decimal places, then check the size of the answer.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each decimal is announced column by column, with the point named as the boundary between ones and tenths, so the digit and its column are heard together.",
    },
    {
      need: "dyslexia",
      alternative:
        "Decimals are shown with the columns spaced and labelled above the digits, and comparisons are written one number above the other so the columns visibly align.",
    },
    {
      need: "motor",
      alternative:
        "Answers can be given with the point already placed and only the digits typed, so the response does not depend on finding a small key.",
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
  translations: [],
};
