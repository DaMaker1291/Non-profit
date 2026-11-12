import type { AuthoredLesson } from "../../lesson-contract";

// STANDARD FORM IS PLACE VALUE WITH A RECORD OF HOW FAR THE POINT MOVED.
//
// The notation A × 10ⁿ is often taught as a formatting rule: move the decimal
// point until the number is between 1 and 10, then count the moves. That rule
// produces the right answer and leaves the learner unable to say whether the
// exponent should be positive or negative, or why multiplying numbers in
// standard form adds their indices. This lesson keeps the movement and the place
// value together: the exponent records how many positions the digits were
// shifted, and its sign records which way. The index laws then do the arithmetic
// that the movement describes.
//
// The lesson also treats order-of-magnitude comparison as a reading skill. A
// learner comparing 3.4 × 10⁴ with 3.4 × 10³ should not need to expand both to
// full numbers; the exponent already says which is ten times larger.
export const MATHS_STANDARD_FORM: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "standard-form",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, number: standard form, converting between ordinary and standard form, comparing magnitudes, and calculating with numbers in standard form",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice items, assessments and the data-transfer task are original. No specification text, textbook extract or examination question is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Write a large or small number in standard form and explain the sign of the exponent from the direction the decimal point moved.",
      evidence:
        "The learner writes 3,600,000 as 3.6 × 10⁶ and 0.00042 as 4.2 × 10⁻⁴, stating that six places left gives a positive exponent and four places right gives a negative exponent.",
    },
    {
      statement:
        "Convert a number from standard form back to ordinary form without losing or inventing zeros.",
      evidence:
        "The learner writes 5.08 × 10³ as 5,080 and 2.7 × 10⁻² as 0.027, placing the digits from the coefficient rather than counting zeros by guesswork.",
    },
    {
      statement:
        "Multiply and divide numbers in standard form by combining the coefficients and applying the index laws to the powers of ten.",
      evidence:
        "The learner calculates (3 × 10⁵) × (4 × 10⁻²) as 1.2 × 10⁴ and (6 × 10⁷) ÷ (3 × 10³) as 2 × 10⁴, adjusting the coefficient when it leaves the range from 1 to 10.",
    },
    {
      statement:
        "Compare two numbers in standard form by their order of magnitude, and use that comparison to judge a claim about scale.",
      evidence:
        "The learner states that 3.4 × 10⁴ is ten times 3.4 × 10³ because the exponents differ by one, without expanding either number.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["indices-intro", "place-value"],
    check: [
      {
        id: "d1",
        question:
          "In the number 4072, what does the 4 stand for, and what does the 7 stand for?",
        answer:
          "The 4 stands for four thousands, because it is four places to the left of the units. The 7 stands for seven tens, because it is one place to the left of the units. Moving one place left multiplies a digit's value by ten.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question:
          "What is 10³ × 10², and what happens to the indices when powers with the same base are multiplied?",
        answer:
          "10³ × 10² = 10⁵. The indices add because the first factor contributes three tens and the second contributes two more, making five tens multiplied together in total.",
        targets: ["indices-intro"],
      },
      {
        id: "d3",
        question:
          "What is 10⁻² as a fraction, and why does a negative index produce a fraction rather than a negative number?",
        answer:
          "10⁻² = 1 ÷ 10² = 1/100. A negative index records division by that many factors of ten, not a negative value; the result is positive and smaller than one.",
        targets: ["indices-intro"],
      },
    ],
  },

  introduction: {
    hook:
      "The distance from the Earth to the Sun is about 150,000,000 kilometres, and the width of a human hair is about 0.00007 metres. Both numbers are awkward to read, easy to miscount and almost impossible to compare at a glance. Standard form writes them as 1.5 × 10⁸ km and 7 × 10⁻⁵ m. The digits that carry the measurement stay, and the power of ten records the scale.",
    why:
      "Science is full of quantities whose sizes differ by many powers of ten, from the mass of an electron to the mass of a galaxy. Writing every zero makes the important digits disappear and makes arithmetic fragile: one missing zero changes the answer by a factor of ten. Standard form keeps the significant digits in one place and the scale in another, so multiplication becomes index arithmetic and comparison becomes a look at the exponents. The rule is not a decoration for very large numbers; it is a way of separating a value from its scale.",
  },

  explanation: [
    {
      heading: "The coefficient holds the digits; the power holds the scale",
      paragraphs: [
        "A number is in standard form when it is written as A × 10ⁿ, where A is at least 1 and less than 10, and n is a whole number. The coefficient A carries the significant digits, and the power 10ⁿ carries the size. For 3,600,000 the digits are 3 and 6, so the coefficient is 3.6. The decimal point in 3.6 sits after the 6, while in 3,600,000 it sits after the final zero, six places to the right. Moving it six places left gives 3.6, so the number is 3.6 × 10⁶. The exponent is positive because the ordinary number is larger than the coefficient.",
        "For a number smaller than one the movement goes the other way. The first non-zero digit of 0.00042 is 4, and the decimal point must move four places right to sit after that 4, giving 4.2. Moving the point right makes the written coefficient larger than the original number, so the power of ten must make it smaller again: 4.2 × 10⁻⁴. The negative exponent is not a negative value; it records division by four factors of ten. This is why 4.2 × 10⁻⁴ is positive, while −4.2 × 10⁴ would be negative.",
        "The range 1 ≤ A < 10 is what makes the representation unique. Without it, 36 × 10⁵ and 0.36 × 10⁷ would both describe the same quantity, and two correct answers could look different. Fixing the coefficient between 1 and 10 gives every non-zero number exactly one standard-form representation. Zero is the exception: it has no non-zero leading digit, so it is usually written simply as 0 rather than forced into a form the definition cannot supply.",
      ],
    },
    {
      heading: "Converting back is placing digits, not counting zeros",
      paragraphs: [
        "To convert 5.08 × 10³ to ordinary form, move the decimal point three places right: 5.08 becomes 50.8, then 508, then 5080. The digits 5, 0 and 8 keep their order; the point moves. The result is 5,080, not 508,000 and not 5,008. Counting zeros by eye is where most errors enter, because the coefficient may already contain a zero that is part of the measurement. Placing the digits from the coefficient avoids that trap.",
        "A negative exponent moves the point left. For 2.7 × 10⁻², move the point two places left from 2.7: first to 0.27, then to 0.027. The leading zero before the point is not a significant digit; it marks the position of the point. The same movement rule works for any coefficient: the exponent tells you how many places, and its sign tells you which direction. Writing the intermediate step once is enough to catch a point moved one place too far.",
        "A useful check is to compare the size of the answer with the exponent. A positive exponent should produce a number at least as large as the coefficient, and usually much larger. A negative exponent should produce a number smaller than one. If 2.7 × 10⁻² came out as 270, the direction of the movement was wrong even if the digits were right. The check costs one second and catches the error that a page of zeros hides.",
      ],
    },
    {
      heading: "Multiplying and dividing separates the digits from the powers",
      paragraphs: [
        "Multiplication in standard form uses the fact that the order of multiplication can be rearranged. (3 × 10⁵) × (4 × 10⁻²) is the same as (3 × 4) × (10⁵ × 10⁻²). The coefficients multiply to 12, and the powers add to 10³, giving 12 × 10³. This is not yet standard form because 12 is not less than 10. Rewrite 12 as 1.2 × 10¹ and combine the powers: 1.2 × 10¹ × 10³ = 1.2 × 10⁴. The adjustment is not an optional tidy-up; it is what restores the unique coefficient range.",
        "Division works the same way with subtraction of indices. (6 × 10⁷) ÷ (3 × 10³) separates into (6 ÷ 3) × (10⁷ ÷ 10³), which is 2 × 10⁴. If the coefficient division produces a number below 1, move one factor of ten from the power into the coefficient. For example, (2 × 10³) ÷ (8 × 10⁵) gives 0.25 × 10⁻², which becomes 2.5 × 10⁻³. The exponent decreases by one because the coefficient was multiplied by ten to bring it into range.",
        "Addition and subtraction are different: the powers must match before the coefficients can be combined. 4.2 × 10⁵ + 3.5 × 10⁴ is not 7.7 × 10⁹. Rewrite the smaller power to match the larger: 3.5 × 10⁴ = 0.35 × 10⁵, then add 4.2 + 0.35 = 4.55, giving 4.55 × 10⁵. The exponent stays at the larger scale, and the coefficient may need renormalising afterwards. Keeping multiplication, division and addition in separate methods prevents the index laws from being applied to the wrong operation.",
      ],
    },
    {
      heading: "The exponent is an order-of-magnitude label",
      paragraphs: [
        "Two numbers in standard form can be compared by their exponents before their coefficients. 3.4 × 10⁴ and 3.4 × 10³ have the same coefficient, but the first is ten times the second because its exponent is one larger. 9 × 10³ is still smaller than 1.1 × 10⁴, even though 9 is larger than 1.1: the exponent dominates because it multiplies the coefficient by a further factor of ten. Only when the exponents are equal do the coefficients decide the comparison.",
        "This is the language of orders of magnitude. A difference of one in the exponent is a factor of ten; a difference of three is a factor of a thousand. Saying that one quantity is two orders of magnitude larger than another is a statement about the exponents, not about the exact coefficients. It is approximate by design, and that is useful when the numbers come from measurements with only one or two significant figures.",
        "The label also exposes false precision. Writing 150,000,000 km suggests that every zero is measured, which it is not. Writing 1.5 × 10⁸ km states two significant figures and a scale. The number of digits in the coefficient is a claim about precision, and standard form makes that claim visible instead of burying it among placeholder zeros. A learner who understands the exponent can therefore read both the size and the honesty of a measurement.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The coefficient must be at least 1 and less than 10. The exponent then records how many places the decimal point moved and in which direction.",
      notation: "3,600,000 = 3.6 × 10⁶   ·   0.00042 = 4.2 × 10⁻⁴",
      caption:
        "For 3,600,000 the point moves six places left, so the exponent is positive six. For 0.00042 it moves four places right, so the exponent is negative four. The digits never change; only their scale is recorded.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Multiplication combines the coefficients and adds the powers. If the new coefficient is not between 1 and 10, one factor of ten is moved into or out of the exponent.",
      notation: "(3 × 10⁵) × (4 × 10⁻²) = 12 × 10³ = 1.2 × 10⁴",
      caption:
        "The coefficients give 12 and the powers give 10³. Rewriting 12 as 1.2 × 10¹ adds one to the exponent, so the final answer is 1.2 × 10⁴, not 12 × 10³.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Division subtracts the indices after the coefficients have been divided. A coefficient below 1 needs one factor of ten moved back from the power.",
      notation: "(6 × 10⁷) ÷ (3 × 10³) = 2 × 10⁴   ·   (2 × 10³) ÷ (8 × 10⁵) = 0.25 × 10⁻² = 2.5 × 10⁻³",
      caption:
        "The first division gives a coefficient already in range. The second gives 0.25, so multiplying by ten and reducing the exponent by one restores standard form without changing the value.",
    },
    {
      id: "r4",
      kind: "maths.number-line",
      body:
        "On a logarithmic scale, each power of ten is the same distance from the next. Equal distances therefore represent equal factors, not equal differences.",
      notation: "10⁰ —— 10¹ —— 10² —— 10³   ·   each step is ×10",
      caption:
        "A jump from 10² to 10³ is a factor of ten, just like a jump from 10⁰ to 10¹. This is why comparing exponents compares orders of magnitude, and why a difference of one exponent is so much larger than a difference of one unit in the coefficient.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Write 0.000072 in standard form and explain the sign of the exponent.",
      steps: [
        {
          move:
            "Find the first non-zero digit, which is 7, and place the decimal point immediately after it to form 7.2.",
          why:
            "The coefficient must lie between 1 and 10, so the point is placed after the first non-zero digit rather than after an arbitrary zero.",
        },
        {
          move:
            "Count how many places the point moved from 0.000072 to 7.2: five places to the right.",
          why:
            "The number of places becomes the size of the exponent, and each place is a factor of ten.",
        },
        {
          move:
            "Use a negative exponent because the original number is smaller than one: 7.2 × 10⁻⁵.",
          why:
            "Moving the point right made the coefficient larger than the original, so the power of ten must divide by five factors of ten to restore the original size.",
        },
        {
          move:
            "Check by moving the point five places left from 7.2, which returns 0.000072.",
          why:
            "The reverse movement must recover the starting number; if it does not, the exponent or its sign is wrong.",
        },
      ],
      answer: "7.2 × 10⁻⁵",
    },
    {
      id: "w2",
      prompt:
        "Calculate (3 × 10⁵) × (4 × 10⁻²), giving the answer in standard form.",
      steps: [
        {
          move:
            "Multiply the coefficients: 3 × 4 = 12.",
          why:
            "The coefficient parts are ordinary numbers and can be multiplied independently of the powers of ten.",
        },
        {
          move:
            "Add the indices: 10⁵ × 10⁻² = 10³, because 5 + (−2) = 3.",
          why:
            "Multiplying powers with the same base adds their indices; the negative index reduces the total number of factors of ten.",
        },
        {
          move:
            "Combine to get 12 × 10³, then rewrite 12 as 1.2 × 10¹.",
          why:
            "The coefficient 12 is outside the allowed range, so it must be expressed as a number between 1 and 10 multiplied by a power of ten.",
        },
        {
          move:
            "Add the extra power: 1.2 × 10¹ × 10³ = 1.2 × 10⁴.",
          why:
            "The factor of ten used to reduce the coefficient must be balanced by increasing the exponent, so the value is unchanged.",
        },
      ],
      answer: "1.2 × 10⁴",
    },
    {
      id: "w3",
      prompt:
        "A bacterium has a mass of about 9.5 × 10⁻¹³ kg. A grain of sand has a mass of about 2.5 × 10⁻⁵ kg. How many times heavier is the grain of sand?",
      steps: [
        {
          move:
            "Divide the two masses: (2.5 × 10⁻⁵) ÷ (9.5 × 10⁻¹³).",
          why:
            "A ratio of two masses answers how many times one contains the other, and division is the operation that compares by repeated multiplication.",
        },
        {
          move:
            "Divide the coefficients: 2.5 ÷ 9.5 ≈ 0.263.",
          why:
            "The numerical parts are handled separately from the scale so that each part of the calculation can be checked.",
        },
        {
          move:
            "Subtract the indices: −5 − (−13) = 8, so the power is 10⁸.",
          why:
            "Dividing powers subtracts indices, and subtracting a negative index adds its magnitude, which is why the result is a large positive power.",
        },
        {
          move:
            "The ratio is about 0.263 × 10⁸, which is 2.63 × 10⁷ after moving one factor of ten.",
          why:
            "The coefficient must be at least 1, so multiplying it by ten and reducing the exponent by one gives the standard-form value without changing the size.",
        },
      ],
      answer: "about 2.6 × 10⁷ times heavier",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A negative exponent makes the whole number negative.",
      whyItFails:
        "The exponent describes division by a power of ten, not the sign of the coefficient. 4.2 × 10⁻⁴ means 4.2 divided by 10,000, which is 0.00042 and is positive. A negative sign in front of the coefficient, as in −4.2 × 10⁴, is a separate statement about direction on the number line. Confusing the two turns a tiny positive measurement into a negative one.",
      correction:
        "Read the exponent as a movement instruction: positive means the ordinary number is larger than the coefficient, negative means it is smaller. The sign of the value is carried by the coefficient, not by the exponent.",
      contrast: {
        wrong: "4.2 × 10⁻⁴ is a negative number because the exponent is negative",
        right: "4.2 × 10⁻⁴ is positive and equals 0.00042; the negative exponent records division by ten thousand",
      },
    },
    {
      id: "m2",
      belief: "To convert back, count the number of zeros shown and write that many digits.",
      whyItFails:
        "The exponent counts places moved, not zeros visible in the written coefficient. 5.08 × 10³ has one zero inside its coefficient, but the exponent is three and the ordinary form is 5,080. Counting zeros would give 5,008 or 500,800 depending on where the count started. The digits must be placed from the coefficient, with the point moved the number of places the exponent states.",
      correction:
        "Move the decimal point one place per unit of the exponent, and write the digits in order. The exponent is the number of moves, not the number of zeros.",
      contrast: {
        wrong: "5.08 × 10³ has one zero, so it is 5,008",
        right: "5.08 × 10³ moves the point three places, giving 5,080",
      },
    },
    {
      id: "m3",
      belief: "When multiplying numbers in standard form, multiply the powers of ten as well as the coefficients.",
      whyItFails:
        "Multiplying 10⁵ by 10⁻² does not give 10⁻¹⁰; it gives 10³, because the indices add. Treating the powers as ordinary factors and multiplying them confuses the law for multiplication of powers with the law for a power raised to a power. The coefficients multiply, but the powers combine by adding their indices.",
      correction:
        "Separate the calculation into two lines: multiply the coefficients, then add the indices. Check the result by estimating the size of the original factors; a product of 10⁵ and 10⁻² should be around 10³, not 10⁻¹⁰.",
      contrast: {
        wrong: "(3 × 10⁵) × (4 × 10⁻²) = 12 × 10⁻¹⁰",
        right: "(3 × 10⁵) × (4 × 10⁻²) = 12 × 10³ = 1.2 × 10⁴",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Write 0.00063 in standard form.",
      hint:
        "Find the first non-zero digit, place the point after it, and count the places the point moved. The original number is less than one, so decide what that means for the sign.",
      answer: "6.3 × 10⁻⁴, because the point moves four places right and the number is less than one.",
      feedback: {
        correct:
          "The coefficient is between 1 and 10, the exponent counts four places, and the negative sign records that the original number is smaller than one.",
        incorrect:
          "The first non-zero digit is 6, so the coefficient is 6.3. The point moves four places from 0.00063 to 6.3, and because the original is less than one the exponent is negative four.",
      },
    },
    {
      id: "p2",
      prompt: "Write 4.07 × 10³ as an ordinary number.",
      hint:
        "Move the decimal point three places right and keep the digits 4, 0 and 7 in order. Do not count zeros in the coefficient.",
      answer: "4,070",
      feedback: {
        correct:
          "You moved the point three places and kept the zero inside the coefficient, so the ordinary number is 4,070 rather than 4,007.",
        incorrect:
          "The exponent 3 means three places right: 4.07 becomes 40.7, then 407, then 4,070. The zero belongs between the 4 and the 7 because it is part of the coefficient.",
      },
    },
    {
      id: "p3",
      prompt: "Calculate (5 × 10⁶) ÷ (2 × 10²) and give the answer in standard form.",
      hint:
        "Divide the coefficients and subtract the indices. If the coefficient is already between 1 and 10, no further adjustment is needed.",
      answer: "2.5 × 10⁴",
      feedback: {
        correct:
          "The coefficient division gives 2.5 and the index subtraction gives 10⁴, so the answer is already in standard form.",
        incorrect:
          "Divide 5 by 2 to get 2.5, then subtract the indices: 6 − 2 = 4. The answer is 2.5 × 10⁴, not 2.5 × 10³ or 2.5 × 10⁸.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Write 0.00000082 in standard form.",
      modelAnswer: "8.2 × 10⁻⁷",
      marking: [
        "Places the decimal point after the first non-zero digit to obtain a coefficient between 1 and 10.",
        "Counts seven places of movement and uses a negative exponent because the original number is less than one.",
      ],
      check: { accepted: ["8.2 × 10⁻⁷", "8.2 x 10^-7", "8.2*10^-7"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner writes 0.00036 as 36 × 10⁻⁵. Explain why this is not in standard form, and give the correct standard-form answer.",
      modelAnswer:
        "The coefficient 36 is not between 1 and 10, so the representation is not standard form even though its value is correct. Rewrite 36 as 3.6 × 10¹ and combine the powers: 3.6 × 10¹ × 10⁻⁵ = 3.6 × 10⁻⁴. The value is unchanged, but the coefficient is now in the required range. This also shows why 36 × 10⁻⁵ and 3.6 × 10⁻⁴ are the same number written in two ways.",
      marking: [
        "States that the coefficient must be at least 1 and less than 10, so 36 is outside the allowed range.",
        "Rewrites 36 as 3.6 × 10¹ and combines the powers correctly.",
        "Gives 3.6 × 10⁻⁴ and explains that the value has not changed.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Calculate (2.4 × 10³) × (5 × 10⁴), giving your answer in standard form.",
      modelAnswer: "1.2 × 10⁸",
      marking: [
        "Multiplies the coefficients to obtain 12 and adds the indices to obtain 10⁷.",
        "Rewrites 12 × 10⁷ as 1.2 × 10⁸ so the coefficient lies between 1 and 10.",
      ],
      check: { accepted: ["1.2 × 10⁸", "1.2 x 10^8", "1.2*10^8"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A storage company advertises a data centre holding 8.4 × 10¹⁵ bytes. A smartphone holds 1.28 × 10¹¹ bytes. The company claims the data centre holds about 10,000 times as much data as the phone. Test the claim using standard form, and state the ratio to two significant figures.",
      whyItTransfers:
        "The learner must choose division rather than multiplication, subtract a negative-free pair of indices correctly, and then interpret the result as an order-of-magnitude claim. The situation is new, but the structure is the same comparison used in the lesson: divide the coefficients, subtract the exponents, and read the remaining factor of ten as scale.",
      answer:
        "The ratio is (8.4 × 10¹⁵) ÷ (1.28 × 10¹¹). The coefficients give 8.4 ÷ 1.28 = 6.5625, and the indices give 10⁴, so the ratio is 6.5625 × 10⁴, or about 6.6 × 10⁴. That is about 66,000 times, not 10,000 times. The company's claim is too low by a factor of about 6.6; in orders of magnitude it is closer to five orders of magnitude than four.",
      marking: [
        "Sets up a division of the two quantities in standard form.",
        "Divides the coefficients and subtracts the indices correctly to obtain 6.5625 × 10⁴.",
        "Converts the result to about 66,000 and compares it with the claimed 10,000, noting that the claim is too low.",
        "States the ratio to two significant figures as 6.6 × 10⁴.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Write 7,200,000 in standard form.",
      answer: "7.2 × 10⁶, because the decimal point moves six places left from 7,200,000 to 7.2.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Which is larger, 9.1 × 10³ or 1.2 × 10⁴? Explain without expanding either number.",
      answer:
        "1.2 × 10⁴ is larger. Its exponent is one greater, so it is multiplied by an extra factor of ten; 1.2 × 10⁴ = 12,000, while 9.1 × 10³ = 9,100. The exponent decides before the coefficient does.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Calculate (8 × 10⁻³) ÷ (4 × 10⁻⁶) and give the answer in standard form.",
      answer:
        "Divide the coefficients to get 2 and subtract the indices: −3 − (−6) = 3. The answer is 2 × 10³, which is 2,000.",
      when: "month-later",
    },
  ],

  summary: [
    "Standard form is A × 10ⁿ with 1 ≤ A < 10; the coefficient carries the digits and the exponent carries the scale.",
    "Moving the decimal point left gives a positive exponent; moving it right gives a negative exponent. The exponent counts places, not zeros.",
    "To multiply, multiply the coefficients and add the indices; to divide, divide the coefficients and subtract the indices. Renormalise if the coefficient leaves the range.",
    "To add or subtract, first rewrite both numbers with the same power of ten, then combine the coefficients.",
    "Compare magnitudes by comparing exponents first; a difference of one exponent is a factor of ten.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every power of ten is read as a sentence, such as three point six times ten to the power six, and every movement is described as places left or right rather than as a visual shift of a point.",
    },
    {
      need: "low-vision",
      alternative:
        "The notation is set in the same enlarged text as the prose, and the exponent is spoken in the accessible name as well as drawn as a superscript so it does not depend on tiny raised type.",
    },
    {
      need: "dyslexia",
      alternative:
        "The conversion method is presented as three numbered actions — find the first digit, move the point, count the moves — with one line per action rather than a dense paragraph.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed; no dragging of a decimal point or interactive slider is required.",
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
        "All explanations, examples, practice items, assessment prompts and the data-centre transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for standard form.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-11",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};