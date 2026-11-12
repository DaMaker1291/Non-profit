import type { AuthoredLesson } from "../../lesson-contract";

// A SURD IS AN EXACT ROOT, NOT A DECIMAL WAITING TO BE ROUNDED.
//
// The lesson begins with the difference between an approximation and the number
// itself: 1.414 is close to the square root of two, but squaring it does not give
// exactly two. That distinction is what makes surds worth keeping. Simplifying
// uses the product rule for roots, which is derived by squaring both sides rather
// than asserted. Rationalising the denominator is then a multiplication by a form
// of one, chosen so that the irrational part disappears: multiply by the surd for
// a single-term denominator, and by the conjugate for a two-term denominator.
//
// The lesson keeps three operations separate — simplifying, adding and
// rationalising — because each has a different reason and learners often apply
// the product rule where it does not belong. The transfer uses an exact area to
// show why the form is useful in geometry: the answer is 3, not a rounded value
// that only looks like 3.
export const MATHS_SURDS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "surds",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, number: surds, simplifying square roots, adding and multiplying surds, and rationalising denominators",
    level: "Key Stage 4 to GCSE Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the exact-area transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain what a surd is and why an exact root can be more useful than a decimal approximation.",
      evidence:
        "The learner states that √2 is irrational, that 1.414 is only an approximation, and that squaring 1.414 does not return exactly 2.",
    },
    {
      statement:
        "Simplify a square root by extracting the largest square factor, using the product rule for roots.",
      evidence:
        "The learner simplifies √72 to 6√2 by writing 72 as 36 × 2 and using √36 = 6, and simplifies √50 to 5√2.",
    },
    {
      statement:
        "Add or multiply surds only when the operation is valid, collecting like surds and using the product rule correctly.",
      evidence:
        "The learner simplifies √18 + √8 to 5√2, while rejecting √2 + √3 = √5 and explaining why the sum cannot be combined.",
    },
    {
      statement:
        "Rationalise a denominator containing a surd, including a two-term denominator using its conjugate.",
      evidence:
        "The learner rationalises 6/√3 to 2√3 and 1/(3 + √2) to (3 − √2)/7, showing the multiplier that makes the denominator rational.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["indices-intro"],
    check: [
      {
        id: "d1",
        question: "What does it mean to square a number, and what is the square root of 49?",
        answer:
          "Squaring means multiplying a number by itself, so 7 squared is 49. The square root of 49 is 7 because 7 × 7 = 49; a square root asks which number was squared to produce the given value.",
        targets: ["indices-intro"],
      },
      {
        id: "d2",
        question: "What is 36 × 2, and why might splitting 72 into those two factors be useful?",
        answer:
          "36 × 2 = 72. The factor 36 is a perfect square, so its square root is a whole number; splitting a number into a square factor and a remaining factor is what makes a root simpler to write.",
        targets: ["indices-intro"],
      },
      {
        id: "d3",
        question: "What is the difference between 2√5 and √10?",
        answer:
          "2√5 means two copies of the square root of five, while √10 is the square root of ten. They are different numbers: 2√5 is about 4.47 and √10 is about 3.16. A coefficient outside a surd multiplies it; it is not pulled inside as a factor of the radicand.",
        targets: ["indices-intro"],
      },
    ],
  },

  introduction: {
    hook:
      "A square has area 2 square metres. Its side length is the square root of 2 metres, but no fraction can write that length exactly: the decimal 1.414 goes on forever without repeating. If a builder rounds the side to 1.4, the area becomes 1.96 square metres, and the error grows when several such lengths are multiplied. Keeping the side as √2 preserves the exact relationship. A surd is the number itself, written in the form that remains exact.",
    why:
      "Surds appear whenever a calculation reverses a square: Pythagoras, the quadratic formula, trigonometry and exact areas. Rounding early can turn an exact cancellation into a small error and hide the structure of an answer. Simplifying surds also makes them comparable: √50 and 5√2 are the same number, and seeing that fact lets a learner add or cancel terms correctly. The rules are not a separate algebra to memorise; they follow from squaring and from the product rule for roots.",
  },

  explanation: [
    {
      heading: "An exact root is a number, not a decimal approximation",
      paragraphs: [
        "The square root of a number is the value that produces it when squared. The square root of 9 is 3 because 3 × 3 = 9, and the square root of 2 is the positive value whose square is 2. That value cannot be written as a fraction of two integers, so its decimal expansion never terminates or repeats. Writing √2 keeps the exact value; writing 1.414 keeps only four decimal places and is therefore an approximation, not the same number.",
        "The difference matters when an answer is squared or cancelled. If a side is √2, the area is exactly 2. If the side is rounded to 1.414, the area is 1.999396, and a calculation that should produce a whole number produces something slightly below it. The error is small in this example, but it can grow when several rounded values are multiplied or when a large number of terms is added. Exact forms are a way of postponing rounding until the end, when it can be chosen deliberately.",
        "A surd can still be simplified without being approximated. √72 is the square root of 72, but 72 is 36 × 2 and √36 = 6, so √72 = 6√2. The simplified form is exact and easier to compare with other surds. Simplifying does not change the value; it changes the way the value is written so that its structure is visible.",
      ],
    },
    {
      heading: "The product rule lets a square factor come out of a root",
      paragraphs: [
        "The product rule says that the square root of a product is the product of the square roots, so √(a × b) = √a × √b for non-negative a and b. The rule follows from squaring: the square of the right-hand side is √a × √b × √a × √b, which rearranges to a × b. Since both sides are non-negative, having the same square makes them equal. This is why a perfect-square factor can be extracted from a root.",
        "For √72, find the largest square factor of 72. The factors 36 and 2 work because 36 is a square and 36 × 2 = 72. Then √72 = √36 × √2 = 6√2. Choosing 9 × 8 would give 3√8, which is correct but not fully simplified because 8 still contains the square factor 4. The largest square factor gives the simplest form, and checking that no square factor remains is part of the method.",
        "The same rule works in reverse for multiplication. √3 × √12 = √36 = 6, which is a whole number. √5 × √5 = 5 because the two identical roots multiply to the number under the root. A coefficient multiplies separately: 2√3 × 4√5 = 8√15. The numbers outside the roots multiply together and the numbers inside multiply together; they do not cross over.",
      ],
    },
    {
      heading: "Only like surds can be added",
      paragraphs: [
        "Addition follows the same logic as collecting like terms. 3√2 + 4√2 = 7√2 because there are seven copies of the same surd. But √2 + √3 cannot be combined into √5: the two roots are different numbers, and their sum is not the root of the sum. A quick decimal check shows the error: √2 + √3 is about 3.146, while √5 is about 2.236. The expressions are not close, so the proposed rule fails.",
        "Surds that look different may become like surds after simplification. √18 = 3√2 and √8 = 2√2, so √18 + √8 = 5√2. The first step is always to simplify each root, because the common surd may be hidden inside a larger number. Multiplying or dividing the coefficient does not change the surd part; only the number under the root does.",
        "A sum such as √2 + √8 can be simplified because the second term contains √2, but √2 + √3 cannot. The test is whether the numbers under the roots have a common square-free part. If they do, extract it and collect; if they do not, leave the sum as it is. Leaving an exact sum uncombined is not a failure to finish; it is the correct exact form.",
      ],
    },
    {
      heading: "Rationalising changes the form without changing the value",
      paragraphs: [
        "A denominator containing a surd is not wrong, but it is often inconvenient: comparing fractions or adding them is easier when the denominator is rational. Rationalising multiplies the fraction by a form of one chosen to remove the root from the denominator. For 6/√3, multiply top and bottom by √3: the numerator becomes 6√3 and the denominator becomes 3, so the result is 2√3. The value is unchanged because the multiplier is √3/√3 = 1.",
        "For a denominator such as 3 + √2, multiplying by √2 alone will not remove the root because the denominator is a sum. The conjugate 3 − √2 is the useful multiplier: (3 + √2)(3 − √2) = 9 − 2 = 7, a rational number, because the cross terms cancel. The numerator must be multiplied by the same conjugate, so 1/(3 + √2) becomes (3 − √2)/7. The denominator is now rational and the value is the same.",
        "The conjugate is found by changing the sign between the two terms, not by changing the sign of the whole denominator. For 5 − √3 the conjugate is 5 + √3, and their product is 25 − 3 = 22. Multiplying by the wrong sign leaves a surd in the denominator and usually changes the value, so the result should be checked by substituting a decimal approximation before and after. A correct rationalisation gives the same decimal, only in a different form.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A square factor can be extracted from a root because the root of a product is the product of the roots. The largest square factor gives the simplest surd.",
      notation: "√72 = √(36 × 2) = √36 × √2 = 6√2",
      caption:
        "The factor 36 is a perfect square, so its root is the whole number 6. The remaining factor 2 has no square factor other than 1, so 6√2 is fully simplified.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Like surds add by collecting coefficients; unlike surds stay separate. Simplifying first can reveal a common surd that was hidden.",
      notation: "√18 + √8 = 3√2 + 2√2 = 5√2   ·   √2 + √3 cannot be combined",
      caption:
        "The first sum has five copies of the same surd. The second has two different surds, and their sum is not the root of the sum of the radicands.",
    },
    {
      id: "r3",
      kind: "maths.proof",
      body:
        "Rationalising multiplies by a form of one. For a two-term denominator, the conjugate removes the cross terms and leaves a difference of squares.",
      notation: "1/(3 + √2) × (3 − √2)/(3 − √2) = (3 − √2)/(9 − 2) = (3 − √2)/7",
      caption:
        "The denominator becomes 7 because the surd terms cancel. The numerator changes, but the fraction's value does not because it was multiplied by one.",
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "Squaring is the test for comparing surd expressions. If two positive expressions have different squares, they are different numbers.",
      notation: "(√2 + √3)² = 5 + 2√6 ≈ 9.899   ·   (√5)² = 5",
      caption:
        "The square of √2 + √3 is much larger than 5, so √2 + √3 is not √5. The cross term 2√6 is the reason the sum cannot be combined into one root.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Simplify √72.",
      steps: [
        {
          move: "Find the largest perfect-square factor of 72: 36 × 2 = 72, and 36 is a square.",
          why:
            "Extracting a square factor is what turns part of the root into a whole number; the largest one gives the simplest result.",
        },
        {
          move: "Use the product rule: √72 = √36 × √2.",
          why:
            "The root of a product is the product of the roots, so the square factor can be separated from the remaining factor.",
        },
        {
          move: "Replace √36 with 6 to get 6√2.",
          why:
            "The square root of 36 is exactly 6, leaving the irreducible root of 2 as the surd part.",
        },
        {
          move: "Check that 2 has no square factor greater than 1, so 6√2 is fully simplified.",
          why:
            "A remaining square factor would mean the surd could be simplified further, so the check establishes that the form is complete.",
        },
      ],
      answer: "6√2",
    },
    {
      id: "w2",
      prompt: "Simplify √18 + √8.",
      steps: [
        {
          move: "Simplify each root: √18 = √(9 × 2) = 3√2, and √8 = √(4 × 2) = 2√2.",
          why:
            "Simplifying first exposes the common surd; without it the two terms look unlike and might be left uncombined.",
        },
        {
          move: "Both terms now contain √2, so collect the coefficients: 3√2 + 2√2 = 5√2.",
          why:
            "The coefficient counts how many copies of the same surd are present, exactly as it does for like algebraic terms.",
        },
        {
          move: "Check with decimals: 3√2 is about 4.243 and 2√2 is about 2.828, whose sum is about 7.071, and 5√2 is about 7.071.",
          why:
            "A decimal check confirms that the combined form has the same value as the original sum.",
        },
      ],
      answer: "5√2",
    },
    {
      id: "w3",
      prompt: "Rationalise the denominator of 1/(3 + √2).",
      steps: [
        {
          move: "Multiply the numerator and denominator by the conjugate 3 − √2.",
          why:
            "The conjugate is chosen so that the surd terms cancel when the two brackets are multiplied, leaving a rational denominator.",
        },
        {
          move: "Expand the denominator: (3 + √2)(3 − √2) = 9 − 2 = 7.",
          why:
            "The expression is a difference of two squares, so the cross terms cancel and only the squares remain.",
        },
        {
          move: "The numerator is 3 − √2, so the fraction becomes (3 − √2)/7.",
          why:
            "The numerator is multiplied by the same conjugate, which keeps the value unchanged while moving the surd out of the denominator.",
        },
        {
          move: "Check numerically: 1/(3 + 1.414) is about 0.2265, and (3 − 1.414)/7 is also about 0.2265.",
          why:
            "A decimal comparison confirms that rationalising changed only the form, not the value of the expression.",
        },
      ],
      answer: "(3 − √2)/7",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The square root of a sum is the sum of the square roots, so √2 + √3 = √5.",
      whyItFails:
        "Squaring the two sides shows the error. The square of √5 is 5. The square of √2 + √3 is 2 + 3 + 2√6, which is 5 + 2√6, about 9.899. The cross term is missing from the proposed rule. The two expressions are not equal, and the decimal values confirm that √2 + √3 is about 3.146 while √5 is about 2.236.",
      correction:
        "The product rule applies to multiplication, not addition. Add surds only when they are like surds, and leave unlike sums in exact form rather than inventing a combined root.",
      contrast: {
        wrong: "√2 + √3 = √5",
        right: "√2 + √3 stays as it is; √2 × √3 = √6 because the product rule applies",
      },
    },
    {
      id: "m2",
      belief: "A coefficient outside a surd can be moved inside by adding it to the number under the root.",
      whyItFails:
        "2√5 means 2 × √5, not √(5 + 2). Moving the coefficient inside requires squaring it: 2√5 = √(4 × 5) = √20. Adding the 2 to the 5 gives √7, which is a different and much smaller number. The coefficient is a multiplier, so its inverse operation is division, not subtraction, when it is brought back out.",
      correction:
        "To move a coefficient inside a square root, square it first. To bring a square factor out, take its square root and write it as the coefficient.",
      contrast: {
        wrong: "2√5 = √7",
        right: "2√5 = √20, because 2 squared is 4 and 4 × 5 = 20",
      },
    },
    {
      id: "m3",
      belief: "Rationalising a denominator only requires multiplying by the surd, even when the denominator has two terms.",
      whyItFails:
        "For 3 + √2, multiplying by √2 gives 3√2 + 2, which still contains a surd. The denominator is a sum, so the surd cannot be removed by a single factor. The conjugate 3 − √2 is needed because the cross terms then cancel through the difference of two squares.",
      correction:
        "Use the surd itself for a one-term denominator such as √3, and use the conjugate for a two-term denominator such as 3 + √2. Multiply both numerator and denominator by the chosen form of one.",
      contrast: {
        wrong: "1/(3 + √2) is rationalised by multiplying by √2",
        right: "1/(3 + √2) is rationalised by multiplying by (3 − √2)/(3 − √2)",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Simplify √50.",
      hint: "Find the largest square factor of 50. The square numbers are 1, 4, 9, 16, 25, 36 and 49.",
      answer: "5√2, because 50 = 25 × 2 and √25 = 5.",
      feedback: {
        correct:
          "You extracted the largest square factor and left the irreducible root of 2, so the surd is fully simplified.",
        incorrect:
          "The largest square factor of 50 is 25, not 5. √50 = √25 × √2 = 5√2, and 2 has no square factor left.",
      },
    },
    {
      id: "p2",
      prompt: "Simplify √75 + √12.",
      hint: "Simplify each root separately. Look for the largest square factor in 75 and in 12, then see whether the remaining surds match.",
      answer: "7√3, because √75 = 5√3 and √12 = 2√3.",
      feedback: {
        correct:
          "Both roots contain √3 after simplification, so the coefficients 5 and 2 add to 7.",
        incorrect:
          "√75 = √(25 × 3) = 5√3 and √12 = √(4 × 3) = 2√3. The sum is 7√3, not √87; unlike the product rule, addition does not combine the numbers under the roots.",
      },
    },
    {
      id: "p3",
      prompt: "Rationalise 8/√2.",
      hint: "Multiply numerator and denominator by √2. The denominator becomes 2, so the fraction can then be simplified.",
      answer: "4√2",
      feedback: {
        correct:
          "Multiplying by √2/√2 gives 8√2/2, which simplifies to 4√2.",
        incorrect:
          "The denominator becomes 2, not 1, so the numerator 8√2 is divided by 2. The answer is 4√2, not 8√2 or 4.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Simplify √98.",
      modelAnswer: "7√2",
      marking: [
        "Finds the largest square factor 49 and writes √98 = √49 × √2.",
        "Replaces √49 with 7 and leaves √2 in the answer.",
      ],
      check: { accepted: ["7√2", "7 sqrt 2", "7sqrt2"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner writes √2 + √8 = √10. Explain why this is wrong, give the correct simplified sum, and describe the test that would catch the error.",
      modelAnswer:
        "The learner has added the numbers under the roots, but the square root of a sum is not the sum of the square roots. Simplify √8 first: √8 = √(4 × 2) = 2√2. Then √2 + 2√2 = 3√2. The proposed √10 is about 3.162, while 3√2 is about 4.243, so the values are not equal. Squaring both sides, or checking decimals, catches the error: the square of √2 + √8 contains a cross term that √10 does not have.",
      marking: [
        "States that roots cannot be added by adding the radicands.",
        "Simplifies √8 to 2√2 and collects like surds to obtain 3√2.",
        "Uses a decimal or squaring check to show that √10 and 3√2 are different.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Rationalise the denominator of 10/√5.",
      modelAnswer: "2√5",
      marking: [
        "Multiplies numerator and denominator by √5.",
        "Simplifies 10√5/5 to 2√5.",
      ],
      check: { accepted: ["2√5", "2 sqrt 5", "2sqrt5"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A rectangle has sides of length √7 + 2 metres and √7 − 2 metres. Calculate its area exactly, show that the result is a whole number, and explain why the two side lengths cannot both be rational.",
      whyItTransfers:
        "The learner must multiply a pair of conjugate surds, recognise the difference of two squares, and interpret the exact result in a geometric context. The side lengths are irrational individually but their product is rational, which is a property of conjugates rather than a coincidence. The task also asks for a reason, not just a number.",
      answer:
        "Area = (√7 + 2)(√7 − 2) = 7 − 4 = 3 square metres. The cross terms +2√7 and −2√7 cancel because the brackets are conjugates, leaving the difference of the squares. A whole-number area does not make either side rational: √7 is irrational, and adding or subtracting 2 does not remove that irrational part. The product is rational because the irrational parts are equal and opposite.",
      marking: [
        "Multiplies the two binomials and cancels the cross terms correctly.",
        "Obtains the exact area 3 square metres.",
        "Explains that each side contains √7 and is therefore irrational, while their product is rational because the brackets are conjugates.",
        "States the result with square units.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Simplify √45.",
      answer: "3√5, because 45 = 9 × 5 and √9 = 3.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Simplify √12 + √27.",
      answer:
        "√12 = 2√3 and √27 = 3√3, so the sum is 5√3. The roots become like surds after simplification.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Rationalise 3/(2 − √3).",
      answer:
        "Multiply by (2 + √3)/(2 + √3). The denominator becomes 4 − 3 = 1, so the result is 3(2 + √3) = 6 + 3√3.",
      when: "month-later",
    },
  ],

  summary: [
    "A surd is an exact irrational root; a decimal is an approximation, even when it has many places.",
    "Simplify a root by extracting the largest square factor: √72 = 6√2 and √50 = 5√2.",
    "Add only like surds; simplify first to reveal a common surd, and never add the numbers under the roots.",
    "Multiply surds using the product rule, keeping coefficients outside and radicands inside.",
    "Rationalise a one-term denominator with the surd itself and a two-term denominator with its conjugate; both are multiplications by one.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every surd is read as the square root of a number, and every coefficient is spoken as a multiplier, so two root five is not mistaken for the root of twenty-five.",
    },
    {
      need: "dyslexia",
      alternative:
        "The simplification is laid out as three short lines — factor, split the root, evaluate the square root — rather than as one dense chain of symbols.",
    },
    {
      need: "low-vision",
      alternative:
        "The radical sign and the radicand are set in the same enlarged text as the prose, and the notation is available as a spoken formula rather than only as a small glyph.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed; no dragging of factors out of a root or interactive simplification is required.",
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
        "All teaching prose, examples, practice, assessments and the conjugate-rectangle transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for surds.",
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