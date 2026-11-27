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
    level: "Key Stage 3 to GCSE Higher",
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
    {
      statement:
        "Change a recurring decimal into a fraction, and decide from a fraction's denominator whether its decimal terminates or recurs.",
      evidence:
        "The learner converts 0.272727... to 3/11 by subtracting a shifted copy, and says that 5/12 must recur because 12 has a prime factor of 3 as well as 2.",
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
    {
      heading: "Some fractions never terminate",
      paragraphs: [
        "Divide 1 by 3 and the remainder is 1 at every step: 10 divided by 3 is 3 remainder 1, then the same division happens again, so the digit 3 repeats forever. The result is written 0.333... or with a dot over the 3. The ellipsis or the dot is not an approximation sign: it records that a fixed block of digits repeats without end. In the same way 1/6 = 0.1666..., where the 6 repeats, and 1/7 = 0.142857142857..., where the six-digit block 142857 cycles.",
        "Whether a fraction in simplest form terminates is decided by its denominator, not by its numerator. A terminating decimal can always be written with a denominator of 10, 100, 1000 and so on, and those denominators are built only from the primes 2 and 5. So a fraction in simplest form terminates exactly when its denominator has no prime factors other than 2 and 5. 3/8 terminates because 8 = 2 cubed and 3/8 = 0.375. 5/12 recurs because 12 = 2 squared times 3, and no power of ten is divisible by 3. The factor 3 is what forces the division to cycle.",
      ],
    },
    {
      heading: "A repeating decimal can be turned into a fraction by subtraction",
      paragraphs: [
        "The repeating tail is what makes the conversion possible. Take x = 0.272727... and multiply by 100, which moves the point past one whole repeating block: 100x = 27.272727... . Both numbers have the same digits after the point, so subtracting x removes the tail completely: 99x = 27, and x = 27/99 = 3/11. The multiplier is 10 raised to the length of the repeating block, so a two-digit block needs 100 and a one-digit block needs 10.",
        "When only part of the decimal repeats, shift by the length of the whole repeating section before subtracting. For x = 0.41666..., 100x = 41.666... and 10x = 4.1666... . Subtracting gives 90x = 37.5, so x = 37.5/90 = 375/900 = 5/12. The same argument settles 0.999...: 10x = 9.999..., so 9x = 9 and x = 1. A decimal that repeats is still a rational number. Going on forever does not mean having no fraction; it means the same block of digits occurs again and again.",
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
    {
      id: "r4",
      kind: "maths.expression",
      body: "Three divisions that never reach a remainder of zero, and the block that repeats.",
      notation: "1/3 = 0.333...   1/6 = 0.1666...   1/7 = 0.142857142857...",
      caption:
        "The dots or the ellipsis mark the block that repeats. The length of the block decides what to multiply by when converting back to a fraction.",
    },
    {
      id: "r5",
      kind: "maths.expression",
      body: "The subtraction that removes the repeating tail, written as an equation.",
      notation: "x = 0.272727...   100x = 27.272727...   99x = 27   x = 27/99 = 3/11",
      caption:
        "Multiplying by 100 lines up two copies of the repeating block. Subtracting one from the other leaves a whole-number equation with no decimal tail.",
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
    {
      id: "w3",
      prompt: "Write 0.41666... as a fraction in its simplest form.",
      steps: [
        {
          move: "Let x = 0.41666... and multiply by 100, so 100x = 41.666... .",
          why:
            "The block that repeats is the single digit 6, but the first digit after the point, 4, does not repeat. Multiplying by 100 moves the point past the 4 and the first 6, so the repeating tail begins immediately after the point in 100x.",
        },
        {
          move: "Also multiply by 10: 10x = 4.1666... .",
          why:
            "The two shifted copies must have the same repeating tail, so subtracting one from the other cancels it. 10x is shifted one place, which lines 4.1666... up under 41.666... .",
        },
        {
          move: "Subtract: 90x = 37.5, so x = 37.5/90 = 375/900 = 5/12.",
          why:
            "41.666... minus 4.1666... is 37.5. Multiplying the numerator and denominator by 10 clears the decimal inside the fraction, and dividing both by 75 simplifies to 5/12. The answer is less than 1 and close to 0.4, which matches the original decimal.",
        },
      ],
      answer: "5/12",
    },
    {
      id: "w4",
      prompt: "Write 5/12 as a decimal, and say whether it terminates or recurs.",
      steps: [
        {
          move: "Divide 5 by 12 using long division, keeping the remainders.",
          why:
            "A decimal is the result of division, and long division shows why a decimal either stops or cycles. 50 divided by 12 is 4 remainder 2; bringing down a zero makes 20, and 20 divided by 12 is 1 remainder 8.",
        },
        {
          move: "Keep going: 80 divided by 12 is 6 remainder 8, and the remainder 8 has appeared before.",
          why:
            "Once a remainder repeats, every following digit must repeat too, because the same division is being performed again. The decimal does not stop; it cycles: 0.41666... .",
        },
        {
          move: "Conclude that 5/12 = 0.41666..., which recurs, and check the denominator: 12 = 2 squared times 3, where the factor 3 is neither 2 nor 5.",
          why:
            "A terminating decimal needs a denominator made only from 2s and 5s, because those are the only primes in 10, 100 and 1000. No power of ten is a multiple of 12, so the fraction cannot terminate and must recur.",
        },
      ],
      answer: "0.41666..., which recurs",
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
    {
      id: "m3",
      belief: "0.999... is less than 1, because it begins with 0 and never reaches 1.",
      whyItFails:
        "The notation does not describe a process that stops just short of 1. It names the single number that the sequence 0.9, 0.99, 0.999, ... approaches. Let x = 0.999... . Then 10x = 9.999..., and subtracting gives 9x = 9, so x = 1. There is no number between 0.999... and 1, so they are the same number written two ways.",
      correction:
        "Treat the repeating decimal as a number, not as an unfinished sum, and use the subtraction argument. If the two numbers were different, their difference would be positive. Every finite truncation falls short of 1 by an amount that shrinks below any positive bound, so no positive difference remains. The algebra makes the equality exact rather than approximate.",
      contrast: {
        wrong: "0.999... is just under 1",
        right: "0.999... equals 1",
      },
    },
    {
      id: "m4",
      belief: "A decimal that goes on forever cannot be written as a fraction, so it must be irrational.",
      whyItFails:
        "Going on forever is not the same as having no pattern. A recurring decimal repeats a fixed block, and the subtraction method turns that block into a fraction: 0.272727... = 3/11. Irrational numbers such as the square root of 2 have decimals that neither terminate nor repeat. A repeating decimal is rational by construction.",
      correction:
        "Look for the repeating block. If there is one, multiply by 10 raised to the block length, subtract the original number, and solve. The result is a fraction of two integers, so the number is rational. Only a decimal with no repeating block can be irrational.",
      contrast: {
        wrong: "0.333... is irrational because it never ends",
        right: "0.333... equals 1/3, so it is rational",
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
    {
      id: "p4",
      prompt: "Write 1/6 as a decimal, and say which digit repeats.",
      hint: "Divide 1 by 6 and watch the remainder after the first digit.",
      answer: "0.1666..., so the 6 repeats",
      feedback: {
        correct: "You followed the remainder, which is what makes the repeating digit visible.",
        incorrect: "One divided by six is not 0.16. After the first digit the remainder is 4, and bringing down zero gives 40 divided by 6, which is 6 remainder 4; the 6 repeats.",
      },
    },
    {
      id: "p5",
      prompt: "Write 0.444... as a fraction in its simplest form.",
      hint: "Let x = 0.444..., then multiply by 10 and subtract x.",
      answer: "4/9, because 10x minus x is 9x, and 9x = 4",
      feedback: {
        correct: "The subtraction removed the repeating tail and left a whole-number equation.",
        incorrect: "Multiplying by 10 gives 4.444..., not 4. Subtract the original x as well: 10x minus x is 9x, and the tails cancel to leave 4.",
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
    {
      id: "a3",
      kind: "structured",
      prompt:
        "Write 0.272727... as a fraction in its simplest form. Show the subtraction that removes the repeating part.",
      modelAnswer:
        "Let x = 0.272727... . Then 100x = 27.272727..., because multiplying by 100 moves the point past one whole block of two digits. Subtracting x from 100x gives 99x = 27, so x = 27/99 = 3/11. The repeating tail cancels because both numbers have the same digits after the point.",
      marking: [
        "Part (a): 100x − x = 27 (1 mark).",
        "Part (b): writes the fraction 27/99 (1 mark).",
        "Part (b): simplifies 27/99 to 3/11 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Let x = 0.272727... . What is 100x − x?",
            marks: 1,
            answer: 27,
            explanation:
              "100x = 27.272727... and x = 0.272727..., so subtracting gives 27 exactly. The repeating tail is identical in both numbers and cancels.",
          },
          {
            id: "b",
            prompt: "Hence write x as a fraction in its simplest form.",
            marks: 2,
            response: "short",
            short: [
              {
                id: "b1",
                marks: 2,
                label: "3/11",
                accept: ["3/11", "3 / 11"],
              },
            ],
            explanation:
              "The subtraction gives 99x = 27, so x = 27/99. Both numbers divide by 9, giving 3/11. The answer is less than 1 and close to 0.27, which matches the original decimal.",
          },
        ],
      },
    },
    {
      id: "a4",
      kind: "structured",
      prompt:
        "Write 5/12 as a decimal. Use dots or an ellipsis to show the repeating part.",
      modelAnswer:
        "0.41666..., where the 6 repeats. With dot notation, the dot sits over the 6.",
      marking: [
        "Part (a): writes 0.41666... and shows the 6 repeating (1 mark).",
        "Part (b): identifies 6 as the repeating digit (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Write 5/12 as a decimal, continuing until a digit repeats.",
            marks: 1,
            response: "short",
            short: [
              {
                id: "a1",
                marks: 1,
                label: "0.41666... with the 6 repeating",
                accept: ["0.41666", "0.4166", "0.416 recurring"],
              },
            ],
            explanation:
              "Dividing 5 by 12 gives 0.4 with remainder 2, then 0.41 with remainder 8, then 0.416 with remainder 8 again. The remainder 8 repeats, so the digit 6 repeats forever: 0.41666... .",
          },
          {
            id: "b",
            prompt: "Which digit repeats?",
            marks: 1,
            answer: 6,
            explanation:
              "After the digits 4 and 1, the remainder 8 keeps returning, so every following digit is 6. The repeating part is the single digit 6.",
          },
        ],
      },
    },
    {
      id: "a5",
      kind: "constructed-response",
      prompt:
        "Explain why 5/12 recurs rather than terminates. Use the prime factors of 12 in your answer.",
      modelAnswer:
        "12 = 2 × 2 × 3. A fraction in simplest form has a terminating decimal only when its denominator can be written using powers of 2 and 5, because those are the only prime factors of 10, 100, 1000 and the other denominators that give terminating decimals. The factor 3 in 12 cannot be cancelled because 5 and 12 share no common factor, so no power of ten is a multiple of 12. The division therefore never reaches a remainder of zero and the decimal recurs: 5/12 = 0.41666... .",
      marking: [
        "Writes 12 = 2 squared times 3, or lists the primes 2, 2 and 3 (1 mark).",
        "States that a terminating decimal requires a denominator built only from 2s and 5s (1 mark).",
        "Concludes that the factor 3 makes the decimal recur, noting that 5/12 is already in simplest form (1 mark).",
      ],
    },
    {
      id: "a6",
      kind: "constructed-response",
      prompt:
        "A learner says 0.999... must be less than 1 because it begins with 0. Explain, using algebra, why 0.999... = 1.",
      modelAnswer:
        "Let x = 0.999... . Then 10x = 9.999... . Subtracting x from 10x gives 9x = 9, so x = 1. The subtraction is exact: the infinite tails are identical and cancel. There is no number between 0.999... and 1, so the two notations name the same number. The 0 before the point describes the first digit, not a value that stops short of 1.",
      marking: [
        "Sets x = 0.999... and multiplies by 10 (1 mark).",
        "Subtracts to obtain 9x = 9 (1 mark).",
        "Concludes x = 1 and explains that the repeating tails cancel exactly, rather than being rounded away (1 mark).",
      ],
    },
    {
      id: "a7",
      kind: "structured",
      prompt:
        "Write 0.41666... as a fraction in its simplest form. Show the two multiplications you subtract.",
      modelAnswer:
        "Let x = 0.41666... . Then 100x = 41.666... and 10x = 4.1666... . Subtracting gives 90x = 37.5, so x = 37.5/90 = 375/900 = 5/12.",
      marking: [
        "Part (a): 100x − 10x = 37.5 (1 mark).",
        "Part (b): writes 375/900 (1 mark).",
        "Part (b): simplifies 375/900 to 5/12 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Let x = 0.41666... . What is 100x − 10x?",
            marks: 1,
            answer: 37.5,
            explanation:
              "100x = 41.666... and 10x = 4.1666..., so subtracting gives 37.5. The repeating 6 tail is the same in both numbers and cancels.",
          },
          {
            id: "b",
            prompt: "Hence write x as a fraction in its simplest form.",
            marks: 2,
            response: "short",
            short: [
              {
                id: "b1",
                marks: 2,
                label: "5/12",
                accept: ["5/12", "5 / 12"],
              },
            ],
            explanation:
              "The subtraction gives 90x = 37.5, so x = 37.5/90. Multiplying numerator and denominator by 10 gives 375/900, and dividing both by 75 gives 5/12.",
          },
        ],
      },
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
    {
      id: "t2",
      prompt:
        "A till splits £1 equally between three people. It shows each share as £0.33, and a customer says the till has lost a penny. Explain what the exact share is, why the display is rounded, and whether a penny has been lost.",
      whyItTransfers:
        "The learner must distinguish an exact recurring value from a rounded display, and reason about where the missing fraction of a penny has gone rather than treating the display as the answer.",
      answer:
        "Each exact share is 1/3 = £0.333..., which recurs. The till shows £0.33 because it displays money to the nearest penny. Three displays of £0.33 add to £0.99, but the penny is not lost: the exact shares add to £1, and a cash payment would need a rounding decision. The recurring decimal is the exact value, not an approximation.",
      marking: [
        "Gives the exact share as 1/3 or £0.333... (1 mark).",
        "Explains that £0.33 is a rounded display to the nearest penny (1 mark).",
        "Accounts for the apparent penny without claiming the exact shares sum to £0.99 (1 mark).",
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
    {
      id: "x3",
      prompt: "Which is larger, 0.305 or 0.35? Explain by naming the column that decides.",
      answer:
        "0.35 is larger. Compare tenths first: both have three tenths, then 0.305 has no hundredths while 0.35 has five hundredths, so the hundredths column decides.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt: "Write 0.363636... as a fraction in its simplest form.",
      answer: "4/11, because 100x − x = 99x = 36, and 36/99 simplifies to 4/11.",
      when: "week-later",
    },
    {
      id: "x5",
      prompt: "Which of 7/8 and 5/6 has a terminating decimal? Explain using the denominator.",
      answer:
        "7/8 terminates, because 8 = 2 cubed and the denominator uses only the prime 2. 5/6 recurs, because 6 = 2 × 3 and the factor 3 is not 2 or 5.",
      when: "month-later",
    },
  ],

  summary: [
    "Columns continue past the point: tenths, hundredths, thousandths, each a tenth of the one before.",
    "Compare decimals column by column, after giving both the same number of decimal places.",
    "A zero at the end changes nothing; a zero just after the point holds a column open.",
    "Multiplying decimals: multiply the digits, add the decimal places, then check the size of the answer.",
    "A fraction in simplest form terminates only when its denominator has no prime factors other than 2 and 5; otherwise its decimal recurs.",
    "To convert a recurring decimal to a fraction, multiply by a power of ten that aligns one repeating block, then subtract the original and solve.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each decimal is announced column by column, with the point named as the boundary between ones and tenths, so the digit and its column are heard together. A recurring decimal is announced as 'nought point three recurring', or with the repeating block named, so the dot is not read as an unfinished number.",
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
