import { defineGapLesson } from "./_gap-lesson";

// MATHS GAP BATCH 7 — circle theorems, place value in other bases, and propositional logic.

export const MATHS_CIRCLE_GEOMETRY_ADV = defineGapLesson({
  conceptId: "circle-geometry-adv",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, geometry: advanced circle theorems and intersecting chords",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for circle theorems. The diagrams are described in words and the examples are original.",
  },
  objectives: [
    {
      statement:
        "Use the intersecting-chords theorem to find an unknown length when two chords cross inside a circle.",
      evidence:
        "For chords crossing at P with PA = 4, PB = 6 and PC = 3, the learner uses PA × PB = PC × PD to find PD = 8.",
    },
    {
      statement:
        "Use the tangent-secant theorem to relate a tangent length to a secant through an external point.",
      evidence:
        "For a tangent of length t and a secant with external part 4 and total length 9, the learner solves t² = 4 × 9 and finds t = 6.",
    },
    {
      statement:
        "Apply the alternate segment theorem and the equal-tangent property in a multi-step angle problem.",
      evidence:
        "The learner identifies the angle between a tangent and a chord as equal to the angle in the alternate segment and chains it with an isosceles triangle.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["circle-theorems"],
    check: [
      {
        id: "d1",
        question: "What is the angle in a semicircle?",
        answer:
          "A right angle, because the angle subtended by a diameter at the circumference is 90°.",
        targets: ["circle-theorems"],
      },
      {
        id: "d2",
        question: "What is true of the two tangents drawn from an external point to a circle?",
        answer:
          "They are equal in length and make equal angles with the line joining the external point to the centre.",
        targets: ["circle-theorems"],
      },
    ],
  },
  introduction: {
    hook:
      "Two chords cross inside a circle. The products of their two parts are equal, even though the chords have different lengths and cross at an awkward angle. Move the crossing point and the individual lengths change, but the product stays fixed. That invariant is one of a small set of circle theorems that turn a tangle of lines into a solvable equation.",
    why:
      "The advanced circle theorems are often memorised as separate facts, which makes it hard to know which one to use. The underlying idea is similarity: triangles formed by chords and tangents share angles, so their sides are in proportion. The product rules are the similarity ratios written without the fractions. This lesson states each theorem, shows the product or angle it produces, and chains them in a multi-step problem.",
  },
  explanation: [
    {
      heading: "Intersecting chords: equal products",
      paragraphs: [
        "When two chords AB and CD intersect at P inside a circle, PA × PB = PC × PD. The triangles formed by joining the endpoints are similar, so the ratios of corresponding sides are equal; cross-multiplying gives the product rule. The rule works for any two chords, including a diameter, and does not require the chords to be perpendicular.",
        "The product uses the two parts of each chord measured from the intersection. If a chord has total length 10 and one part is 4, the other part is 6. Confusing a whole chord with a part is the most common arithmetic error. Label the parts from the crossing point before substituting.",
      ],
    },
    {
      heading: "Tangent and secant: the tangent squared",
      paragraphs: [
        "From an external point P, a tangent touches the circle at T and a secant meets the circle at A and B, with A nearer P. Then PT² = PA × PB, where PA is the external part and PB is the whole secant. The tangent length is squared because the two tangent segments from P are equal; the similarity ratio reduces to that single product.",
        "The secant must be measured as the whole length from P to the far intersection, not only the part outside the circle. For an external part of 4 and a total of 9, the product is 36 and the tangent is 6. Using 4 × 5 would incorrectly use the internal chord instead of the whole secant.",
      ],
    },
    {
      heading: "Alternate segment and equal tangents",
      paragraphs: [
        "The angle between a tangent and a chord at the point of contact equals the angle in the alternate segment, on the other side of the chord. This converts a tangent-chord angle into a circumference angle. The equal-tangent property then supplies equal lengths and an isosceles triangle when two tangents meet at an external point.",
        "A multi-step problem usually chains these: use the alternate segment theorem to move an angle, use the equal tangent lengths to mark a triangle isosceles, then use the angle sum or an exterior angle. Each step should name the theorem that licenses it. A correct number without a reason is not a complete solution. Writing the theorem beside the step also makes a wrong turn easy to find.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "For two chords crossing at P, the product of the parts of one chord equals the product of the parts of the other.",
      notation: "PA × PB = PC × PD",
      caption:
        "With PA = 4, PB = 6 and PC = 3, the product is 24, so PD = 24/3 = 8.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "For a tangent and a secant from the same external point, the tangent squared equals the external part times the whole secant.",
      notation: "PT² = PA × PB",
      caption:
        "With external part 4 and whole secant 9, PT² = 36, so the tangent is 6.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "The alternate segment theorem moves an angle from the tangent-chord boundary to the opposite arc. The two angles are equal.",
      notation: "angle between tangent and chord = angle in the alternate segment",
      caption:
        "The theorem is an angle equality, not a length rule. It is often paired with the equal-tangent property, which gives an isosceles triangle.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Chords AB and CD intersect at P inside a circle. PA = 4 cm, PB = 6 cm and PC = 3 cm. Find PD.",
      steps: [
        {
          move: "Apply the intersecting-chords theorem: PA × PB = PC × PD.",
          why:
            "The two chords cross inside the circle, so the products of their parts are equal.",
        },
        {
          move: "Substitute: 4 × 6 = 3 × PD, so 24 = 3PD.",
          why:
            "Both parts of the first chord are known. The second chord has one known part and one unknown part.",
        },
        {
          move: "Divide by 3: PD = 8 cm.",
          why:
            "The result is a length, so it must be positive. It is also longer than PC, which is consistent with the product staying fixed.",
        },
      ],
      answer: "PD = 8 cm.",
    },
    {
      id: "w2",
      prompt:
        "From an external point P, a tangent PT touches a circle and a secant meets the circle at A and B. PA = 4 cm and AB = 5 cm. Find PT.",
      steps: [
        {
          move: "The whole secant is PB = PA + AB = 4 + 5 = 9 cm.",
          why:
            "The tangent-secant theorem uses the whole secant from the external point, not only the part outside the circle.",
        },
        {
          move: "Apply PT² = PA × PB = 4 × 9 = 36.",
          why:
            "The tangent length squared equals the product of the external part and the whole secant.",
        },
        {
          move: "Take the positive square root: PT = 6 cm.",
          why:
            "A length cannot be negative, so only the positive root is meaningful.",
        },
      ],
      answer: "PT = 6 cm.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The intersecting-chords rule is PA + PB = PC + PD.",
      whyItFails:
        "The theorem comes from similar triangles, whose sides are in proportion, not from equal sums. A sum rule would fail as soon as the crossing point moves: the parts change in opposite directions, keeping the product fixed, not the sum.",
      correction:
        "Multiply the two parts of each chord. Check with a simple case such as two diameters crossing at the centre, where all four parts are radii and the products are equal.",
      contrast: {
        wrong: "4 + 6 = 3 + PD, so PD = 7",
        right: "4 × 6 = 3 × PD, so PD = 8",
      },
    },
    {
      id: "m2",
      belief: "The secant length in the tangent-secant theorem is only the part outside the circle.",
      whyItFails:
        "The theorem uses the whole secant from the external point to the far intersection. Using only the external part would pair a tangent with a shorter segment and give the wrong length. The similar-triangle ratio includes the chord inside the circle.",
      correction:
        "Add the external part and the internal chord to get the whole secant before multiplying. Label P, A and B so the whole length is unambiguous.",
      contrast: {
        wrong: "PT² = 4 × 5",
        right: "PT² = 4 × 9",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Two chords cross at P. One has parts 5 cm and 8 cm; the other has parts 4 cm and x. Find x.",
      hint: "Set the products of the parts equal.",
      answer: "5 × 8 = 4x, so x = 10 cm.",
      feedback: {
        correct: "You multiplied the parts and divided by the known part.",
        incorrect:
          "The product is 40, so x = 40/4 = 10 cm. The rule is a product, not a sum.",
      },
    },
    {
      id: "p2",
      prompt:
        "A tangent of length 8 cm is drawn from P, and a secant from P has external part 4 cm. Find the whole secant.",
      hint: "Square the tangent and set it equal to the external part times the whole secant.",
      answer: "64 = 4 × whole, so the whole secant is 16 cm.",
      feedback: {
        correct: "You solved for the whole secant, not just the internal chord.",
        incorrect:
          "The whole secant is 64/4 = 16 cm. The internal chord would be 12 cm, but the theorem uses the whole length.",
      },
    },
    {
      id: "p3",
      prompt:
        "What is the angle between a tangent and a chord equal to?",
      hint: "Look at the angle in the segment on the other side of the chord.",
      answer: "The angle in the alternate segment.",
      feedback: {
        correct: "You named the alternate segment theorem.",
        incorrect:
          "The tangent-chord angle equals the angle in the alternate segment, the segment on the opposite side of the chord.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Chords AB and CD intersect at P. PA = 4 cm, PB = 6 cm and PC = 3 cm. Find PD.",
      modelAnswer: "8 cm",
      marking: [
        "Applies PA × PB = PC × PD.",
        "Computes 24 ÷ 3 = 8.",
      ],
      check: { accepted: ["8", "8 cm", "8cm"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "From an external point, a tangent has length t and a secant has external part 4 cm and whole length 9 cm. Find t.",
      modelAnswer: "6 cm",
      marking: [
        "Uses t² = 4 × 9.",
        "Takes the positive square root of 36.",
      ],
      check: { accepted: ["6", "6 cm", "6cm"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how the intersecting-chords theorem and the tangent-secant theorem both come from similar triangles, and why one uses a product of two parts while the other uses a tangent squared.",
      modelAnswer:
        "Joining the endpoints of the chords or secants creates triangles with equal angles, so corresponding sides are in proportion. Cross-multiplying the ratio gives the product of the parts. For two tangents from the same external point, the two tangent lengths are equal, so the two factors in the product are the same and the rule becomes the tangent squared.",
      marking: [
        "Identifies similar triangles as the source of the ratio.",
        "Explains the product of chord parts from cross-multiplying.",
        "Explains that equal tangents make the two factors equal, giving a square.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A circular arch has a horizontal span AB of 12 m. A vertical strut through a point P on the span, 3 m from A, meets the arch at C and the circle again at D. CP = 4 m. Find CD and the radius, stating the theorem you use and why the strut is not a diameter.",
      whyItTransfers:
        "The lesson applies chord products. The arch embeds two chords in a physical structure, so the learner must identify the parts measured from the crossing point and use the product rule before interpreting the result as a diameter and radius.",
      answer:
        "AP = 3 m and PB = 9 m, so the intersecting-chords theorem gives CP × PD = AP × PB: 4 × PD = 27, so PD = 6.75 m. Then CD = 4 + 6.75 = 10.75 m, and the radius is 5.375 m. The strut is not a diameter because P is 3 m from A, not at the midpoint of the span; a diameter would cross AB at its midpoint.",
      marking: [
        "Identifies the intersecting-chords theorem.",
        "Uses AP = 3 and PB = 9 to find PD = 6.75 m.",
        "Adds CP and PD for the chord, halves it for the radius, and explains why the strut is not central.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the intersecting-chords theorem?",
      answer:
        "If two chords cross at P, the products of their parts are equal: PA × PB = PC × PD.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is the tangent-secant theorem?",
      answer:
        "From an external point, tangent² = external part × whole secant.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What does the alternate segment theorem say?",
      answer:
        "The angle between a tangent and a chord equals the angle in the alternate segment.",
      when: "month-later",
    },
  ],
  summary: [
    "Intersecting chords give equal products of their parts.",
    "A tangent squared equals the external part times the whole secant.",
    "The alternate segment theorem moves angles between a tangent-chord boundary and the opposite arc.",
    "Name the theorem at each step in a multi-step circle problem.",
  ],
});

export const MATHS_NUMBER_BASES = defineGapLesson({
  conceptId: "number-bases",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: place value in bases other than ten, including binary and hexadecimal",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for number bases and place value. The conversions are original.",
  },
  objectives: [
    {
      statement:
        "Convert a number from base 2 or base 16 to base 10 using place value.",
      evidence:
        "The learner evaluates 1011₂ as 8 + 2 + 1 = 11 and 2A₁₆ as 2 × 16 + 10 = 42.",
    },
    {
      statement:
        "Convert a base-10 number to another base by repeated division, reading remainders in reverse.",
      evidence:
        "The learner converts 42 to base 2 as 101010 and to base 5 as 132.",
    },
    {
      statement:
        "Explain why hexadecimal is a compact notation for binary and convert between the two in groups of four bits.",
      evidence:
        "The learner pairs 1010 1010 with AA and explains that each hex digit represents four binary digits.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["place-value"],
    check: [
      {
        id: "d1",
        question: "What does the 3 in 3,405 represent?",
        answer:
          "Three thousands, because its place value is 10³ = 1000.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "Why does a base-10 number use only the digits 0 to 9?",
        answer:
          "A place can hold at most nine units before it regroups into the next place; ten is the base.",
        targets: ["place-value"],
      },
    ],
  },
  introduction: {
    hook:
      "A computer stores the number 11 as 1011. The digits look like a count of ones, but they are place values: 8, 4, 2 and 1. Only the 8, 2 and 1 places are switched on. Hexadecimal compresses the same bits into fewer symbols, which is why colour codes look like #2A5CFF. Base 10 is a convention, not a law of arithmetic.",
    why:
      "Number bases are place value with a different multiplier. Once that is clear, conversion is not a set of tricks: it is expanding a number into powers of the base, or repeatedly dividing and collecting remainders. Binary and hexadecimal matter because computers use them, and the grouping of four bits per hex digit is a direct consequence of 16 = 2⁴. This lesson builds both directions and the bridge between the two.",
  },
  explanation: [
    {
      heading: "Every base is place value",
      paragraphs: [
        "In base b, the places are powers of b: b⁰, b¹, b², and so on from right to left. The digits allowed are 0 to b − 1. In base 2, only 0 and 1 are allowed; in base 5, 0 to 4; in base 16, 0 to 15, with A to F standing for 10 to 15. The value of a numeral is the sum of each digit times its place value.",
        "For 1011₂, the places from the right are 1, 2, 4, 8. The digits contribute 1 × 1 + 1 × 2 + 0 × 4 + 1 × 8 = 11. The leading 1 is the most significant digit because it carries the largest place value. Reading the numeral left to right as a decimal number ignores the place values and is the usual first error.",
      ],
    },
    {
      heading: "Converting to base 10 is expansion; from base 10 is division",
      paragraphs: [
        "To convert to base 10, expand the numeral in powers of its base and add. For 2A₁₆, A is 10, so the value is 2 × 16 + 10 = 42. For 132₅, the value is 1 × 25 + 3 × 5 + 2 = 42. Different numerals can represent the same number because the base changes, not the quantity.",
        "To convert from base 10, divide repeatedly by the target base and record the remainders. The remainders, read from the last to the first, are the digits. For 42 in base 2: 42 ÷ 2 = 21 remainder 0; 21 ÷ 2 = 10 remainder 1; 10 ÷ 2 = 5 remainder 0; 5 ÷ 2 = 2 remainder 1; 2 ÷ 2 = 1 remainder 0; 1 ÷ 2 = 0 remainder 1. Reading upward gives 101010.",
      ],
    },
    {
      heading: "Hexadecimal is shorthand for four bits",
      paragraphs: [
        "Because 16 = 2⁴, each hexadecimal digit corresponds to exactly four binary digits. Group the binary number into fours from the right, pad the leftmost group with leading zeros if needed, and convert each group. 1010 1010 becomes A A, or AA. This is why hex is used for colours, memory addresses and byte values: two hex digits represent one byte.",
        "The grouping must start at the right, not the left, because the least significant bits define the ones place. Padding on the left preserves the value; padding on the right multiplies it by a power of two. A leading zero in a group is meaningful for the grouping even though it does not change the value.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A base-2 numeral is a sum of powers of two. Only the positions with a 1 contribute.",
      notation: "1011₂ = 1×8 + 0×4 + 1×2 + 1×1 = 11",
      caption:
        "The places from the right are 1, 2, 4 and 8. The zero in the fours place means that power is not used.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A base-16 numeral uses A to F for ten to fifteen. Each digit is multiplied by a power of sixteen.",
      notation: "2A₁₆ = 2×16 + 10×1 = 42",
      caption:
        "The symbol A stands for ten. The numeral is not “twenty-A”; it is a place-value expression.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Repeated division by the target base produces the digits as remainders, read from last to first.",
      notation: "42 ÷ 2: remainders 0, 1, 0, 1, 0, 1 ⇒ 101010₂",
      caption:
        "The first remainder is the least significant digit. Reading the remainders in the order produced would reverse the number.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Convert 1011₂ to base 10.",
      steps: [
        {
          move: "Write the place values from the right: 1, 2, 4, 8.",
          why:
            "Base 2 uses powers of two. The rightmost place is 2⁰ = 1 and each place to the left doubles.",
        },
        {
          move: "Multiply each digit by its place value: 1×8 + 0×4 + 1×2 + 1×1.",
          why:
            "Only the positions with a 1 contribute. The 0 in the fours place means no four is added.",
        },
        {
          move: "Add: 8 + 0 + 2 + 1 = 11.",
          why:
            "The sum is the base-10 value. The numeral 1011 is not one thousand and eleven in base 2.",
        },
      ],
      answer: "1011₂ = 11.",
    },
    {
      id: "w2",
      prompt: "Convert 42 to base 2 and to base 5.",
      steps: [
        {
          move: "Divide 42 repeatedly by 2: 42→21 rem 0; 21→10 rem 1; 10→5 rem 0; 5→2 rem 1; 2→1 rem 0; 1→0 rem 1.",
          why:
            "Each remainder is the digit in the current place. Dividing by the base strips off the least significant digit each time.",
        },
        {
          move: "Read the remainders from last to first: 101010.",
          why:
            "The first remainder is the ones digit, so the order must be reversed to write the numeral left to right.",
        },
        {
          move: "For base 5, divide by 5: 42 = 8 rem 2; 8 = 1 rem 3; 1 = 0 rem 1. Read upward: 132.",
          why:
            "The same division method works for any base. Check: 1×25 + 3×5 + 2 = 42.",
        },
      ],
      answer: "42 = 101010₂ = 132₅.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "1011₂ means one thousand and eleven.",
      whyItFails:
        "The subscript 2 says the places are powers of two, not powers of ten. Reading the digits as a decimal number ignores the base. The correct value is 11, which is much smaller because the highest place is 8, not 1000.",
      correction:
        "Write the place values above the digits before converting. In base 2, the fourth place from the right is 8, not 1000.",
      contrast: {
        wrong: "1011₂ = 1011",
        right: "1011₂ = 8 + 2 + 1 = 11",
      },
    },
    {
      id: "m2",
      belief: "When converting from base 10, read the remainders in the order they appear.",
      whyItFails:
        "The first division produces the least significant digit, because it is the remainder after removing all higher powers. Reading in that order reverses the number. For 42, the first remainder is 0 (the ones digit), so starting with it would put a zero in the most significant place.",
      correction:
        "Write the remainders in a column and read from the bottom to the top. Check by expanding the result back to base 10.",
      contrast: {
        wrong: "Remainders 0,1,0,1,0,1 give 010101",
        right: "Remainders read upward give 101010",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Convert 110₂ to base 10.",
      hint: "The places are 4, 2 and 1.",
      answer: "4 + 2 + 0 = 6.",
      feedback: {
        correct: "You expanded the numeral in powers of two.",
        incorrect:
          "110₂ = 1×4 + 1×2 + 0×1 = 6, not one hundred and ten.",
      },
    },
    {
      id: "p2",
      prompt: "Convert 10 to base 2.",
      hint: "Divide by 2 and read the remainders upward.",
      answer: "1010₂.",
      feedback: {
        correct: "You used repeated division and reversed the remainders.",
        incorrect:
          "10 ÷ 2 = 5 rem 0; 5 ÷ 2 = 2 rem 1; 2 ÷ 2 = 1 rem 0; 1 ÷ 2 = 0 rem 1. Reading upward gives 1010.",
      },
    },
    {
      id: "p3",
      prompt: "Convert 1111 0000₂ to hexadecimal.",
      hint: "Group the bits in fours from the right.",
      answer: "F0₁₆.",
      feedback: {
        correct: "You converted each four-bit group to one hex digit.",
        incorrect:
          "1111 is F and 0000 is 0, so the hexadecimal form is F0. Grouping must start at the right.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Convert 1011₂ to base 10.",
      modelAnswer: "11",
      marking: [
        "Expands the places 8, 4, 2 and 1.",
        "Adds 8 + 2 + 1.",
      ],
      check: { accepted: ["11", "eleven"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Convert 2A₁₆ to base 10.",
      modelAnswer: "42",
      marking: [
        "Treats A as 10.",
        "Computes 2 × 16 + 10.",
      ],
      check: { accepted: ["42", "forty-two", "forty two"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how place value works in base 5, and use it to convert 132₅ to base 10 and 42 to base 5.",
      modelAnswer:
        "In base 5 the places are powers of five: 25, 5 and 1. The digit 132 means 1 × 25 + 3 × 5 + 2 = 42. To convert 42 back, divide repeatedly by 5: 42 = 8 remainder 2, 8 = 1 remainder 3, 1 = 0 remainder 1. Reading the remainders upward gives 132.",
      marking: [
        "States the place values as powers of five.",
        "Expands 132₅ to 42.",
        "Uses repeated division and reads the remainders upward.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A colour is stored as the hexadecimal value #2A5C. Convert each pair of hex digits to binary and explain why two hex digits are used for one byte. What decimal value does the middle pair 5C represent?",
      whyItTransfers:
        "The lesson converts between bases and groups bits. The colour code uses the same grouping in a real format, and the middle pair asks for a decimal value, so the learner must move between hex, binary and base 10.",
      answer:
        "#2A5C groups as 2A and 5C. 2A = 0010 1010₂; 5C = 0101 1100₂. Each hex digit is four bits, so two hex digits are eight bits, one byte. 5C = 5 × 16 + 12 = 92 in decimal.",
      marking: [
        "Converts 2A and 5C to eight-bit binary groups.",
        "Explains that one byte is eight bits and each hex digit is four bits.",
        "Converts 5C to 92 using place value and C = 12.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What are the place values in base 2?",
      answer: "Powers of two: 1, 2, 4, 8, 16, … from the right.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "How do you convert a base-10 number to another base?",
      answer:
        "Divide repeatedly by the base and read the remainders from last to first.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why does one hexadecimal digit represent four binary digits?",
      answer: "Because 16 = 2⁴, so each hex place covers four binary places.",
      when: "month-later",
    },
  ],
  summary: [
    "In base b, places are powers of b and digits run from 0 to b − 1.",
    "Expanding in powers of the base converts to base 10.",
    "Repeated division with remainders read upward converts from base 10.",
    "Hexadecimal groups four bits per digit because 16 = 2⁴.",
  ],
});

export const MATHS_LOGIC_MATHS = defineGapLesson({
  conceptId: "logic-maths",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra and proof: propositions, connectives and truth tables",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for logical argument and truth tables. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Combine propositions with AND, OR and NOT and evaluate the result for given truth values.",
      evidence:
        "The learner completes a four-row truth table for P AND Q and identifies the single true row.",
    },
    {
      statement:
        "Construct a truth table for an implication and distinguish it from its converse.",
      evidence:
        "The learner states that P → Q is false only when P is true and Q is false, and that the converse Q → P is a different proposition.",
    },
    {
      statement:
        "Use a truth table to test whether two compound propositions are logically equivalent.",
      evidence:
        "The learner compares the columns for NOT (P AND Q) and (NOT P) OR (NOT Q) and shows they match.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["sets-venn"],
    check: [
      {
        id: "d1",
        question: "What does the intersection of two sets contain?",
        answer:
          "The elements in both sets; it corresponds to AND.",
        targets: ["sets-venn"],
      },
      {
        id: "d2",
        question: "What does the union of two sets contain?",
        answer:
          "The elements in either set or both; it corresponds to OR.",
        targets: ["sets-venn"],
      },
    ],
  },
  introduction: {
    hook:
      "A website says: “If you are a member, you get free delivery.” When is that promise broken? Only when someone is a member and does not get free delivery. A non-member getting free delivery does not break it, and a non-member not getting it does not break it either. That asymmetry is the truth table for implication, and it is why “if” is not the same as “if and only if”.",
    why:
      "Logic turns everyday connectives into rules with exact truth conditions. AND, OR and NOT behave like intersection, union and complement, which is why set diagrams and truth tables reinforce each other. Implication is the one that surprises people: it is false only in the case where the premise is true and the conclusion is false. This lesson builds truth tables systematically so the result is checked rather than guessed.",
  },
  explanation: [
    {
      heading: "Propositions and the basic connectives",
      paragraphs: [
        "A proposition is a statement that is either true or false, not a question or a command. “It is raining” is a proposition; “Is it raining?” is not. Compound propositions combine simpler ones with AND, OR and NOT. P AND Q is true only when both are true. P OR Q is true when at least one is true, including the case where both are.",
        "NOT reverses the truth value. These connectives match set operations: AND is intersection, OR is union, NOT is complement. A truth table lists every combination of truth values for the inputs and evaluates the compound statement for each row. With two inputs there are four rows; with three, eight. The number doubles with each additional proposition.",
      ],
    },
    {
      heading: "Implication has one false case",
      paragraphs: [
        "P → Q means “if P then Q”. It is false only when P is true and Q is false. In every other row it is true, including the rows where P is false. This is not a claim that P causes Q; it is a promise that the combination P true and Q false does not occur. A false premise makes the implication vacuously true.",
        "The converse Q → P swaps the premise and conclusion and is a different proposition. “If it is a square, it is a rectangle” is true, but its converse “if it is a rectangle, it is a square” is false. The inverse and contrapositive are further variations; the contrapositive NOT Q → NOT P is logically equivalent to the original implication, while the converse is not.",
      ],
    },
    {
      heading: "Truth tables test equivalence",
      paragraphs: [
        "Two compound propositions are logically equivalent when their truth tables have identical output columns for every row. This is a mechanical check that does not depend on intuition. For example, NOT (P AND Q) and (NOT P) OR (NOT Q) have the same column, which is one of De Morgan's laws.",
        "A single mismatching row is enough to disprove equivalence. Construct the tables with the same input order and compare row by row. The table is also a proof: it covers every possible case, so no counterexample can be hiding outside it. That completeness is why truth tables are accepted as a rigorous method for finite propositional logic.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "AND is true only when both inputs are true. OR is true when at least one is true.",
      notation: "P AND Q; P OR Q",
      caption:
        "For P true and Q false, P AND Q is false, while P OR Q is true. The connectives differ on exactly that row.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "An implication is false only when the premise is true and the conclusion is false.",
      notation: "P → Q is false exactly when P is true and Q is false",
      caption:
        "The three other rows are true, including the rows where P is false. The promise is not broken by a false premise.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "De Morgan's law rewrites a negated conjunction as a disjunction of negations.",
      notation: "NOT (P AND Q) = (NOT P) OR (NOT Q)",
      caption:
        "The two expressions have identical truth columns. A truth table proves the equivalence by covering all four rows.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Construct the truth table for P AND Q and state when it is true.",
      steps: [
        {
          move: "List the four combinations of P and Q: TT, TF, FT, FF.",
          why:
            "Two propositions have two possible values each, so there are 2 × 2 = 4 rows. Every combination must appear exactly once.",
        },
        {
          move: "Evaluate AND on each row: TT gives true; TF, FT and FF give false.",
          why:
            "AND requires both inputs to be true. A single false input makes the conjunction false.",
        },
        {
          move: "The compound proposition is true only in the TT row.",
          why:
            "That is the only row where both P and Q hold. The other three rows each contain at least one false.",
        },
      ],
      answer: "P AND Q is true only when both P and Q are true.",
    },
    {
      id: "w2",
      prompt:
        "Construct the truth table for P → Q and explain why it is true when P is false.",
      steps: [
        {
          move: "List the four rows: TT, TF, FT, FF.",
          why:
            "The implication has two inputs, so the same four combinations apply.",
        },
        {
          move: "Mark the implication false only in the TF row, where P is true and Q is false.",
          why:
            "That is the only case that breaks the promise “if P then Q”. The other rows do not exhibit P true with Q false.",
        },
        {
          move: "The FT and FF rows are true because the premise is false; the implication is vacuously satisfied.",
          why:
            "A false premise cannot produce the forbidden combination. The statement does not claim that P is true, only what follows if it is.",
        },
      ],
      answer:
        "P → Q is false only when P is true and Q is false; all other rows are true.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "P → Q is false whenever Q is false.",
      whyItFails:
        "If P is also false, the implication is true because the forbidden combination (P true, Q false) has not occurred. For example, “if it is a square, it has four sides” is not refuted by a triangle, which is not a square and does not have four sides.",
      correction:
        "Check the premise first. The implication fails only in the row where P is true and Q is false. A false Q with a false P does not break it.",
      contrast: {
        wrong: "P false, Q false makes P → Q false.",
        right: "P false, Q false makes P → Q true.",
      },
    },
    {
      id: "m2",
      belief: "A statement and its converse are logically equivalent.",
      whyItFails:
        "Swapping premise and conclusion changes the truth conditions. “If it is a square, it is a rectangle” is true, but “if it is a rectangle, it is a square” is false for a non-square rectangle. The two propositions have different truth tables.",
      correction:
        "Write the converse separately and test it with a counterexample. Only the contrapositive is equivalent to the original implication.",
      contrast: {
        wrong: "P → Q and Q → P are the same.",
        right: "P → Q and Q → P can differ; only NOT Q → NOT P is equivalent to P → Q.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "If P is true and Q is false, what is P OR Q?",
      hint: "OR needs at least one true input.",
      answer: "True.",
      feedback: {
        correct: "You applied the inclusive OR.",
        incorrect:
          "OR is true when at least one input is true. Since P is true, P OR Q is true even though Q is false.",
      },
    },
    {
      id: "p2",
      prompt: "If P is true and Q is false, what is P → Q?",
      hint: "This is the one row where the implication fails.",
      answer: "False.",
      feedback: {
        correct: "You identified the only false row for implication.",
        incorrect:
          "An implication is false when the premise is true and the conclusion is false, so P → Q is false here.",
      },
    },
    {
      id: "p3",
      prompt: "How many rows does a truth table with three propositions need?",
      hint: "Each proposition doubles the number of combinations.",
      answer: "8 rows.",
      feedback: {
        correct: "You used 2³ = 8.",
        incorrect:
          "Three propositions give 2 × 2 × 2 = 8 combinations, so the table needs 8 rows.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "If P is true and Q is false, what is the truth value of P → Q?",
      modelAnswer: "false",
      marking: [
        "Recalls that implication fails when the premise is true and the conclusion is false.",
        "Applies it to the given row.",
      ],
      check: { accepted: ["false", "False", "no"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the contrapositive of “if P then Q”.",
      modelAnswer: "if not Q then not P",
      marking: [
        "Negates both parts and swaps their order.",
        "Distinguishes it from the converse.",
      ],
      check: {
        accepted: [
          "if not q then not p",
          "if not Q then not P",
          "not Q implies not P",
          "¬Q → ¬P",
        ],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Use a truth table to show that NOT (P AND Q) is equivalent to (NOT P) OR (NOT Q). Explain what the table proves.",
      modelAnswer:
        "The four rows are TT, TF, FT, FF. P AND Q is true only in TT, so NOT (P AND Q) is false only in TT and true in the other three rows. NOT P is false in the T rows and true in the F rows; NOT Q is false in the T rows for Q and true otherwise. Their OR is false only in TT and true in the other three rows. The output columns match in every row, so the propositions are equivalent.",
      marking: [
        "Lists all four input combinations.",
        "Evaluates both compound propositions row by row.",
        "Shows identical output columns and concludes equivalence.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A security rule says: “The alarm sounds if the door is opened AND the code is not entered.” Write the rule using P and Q, state when it is false, and explain how the contrapositive describes the same rule.",
      whyItTransfers:
        "The lesson evaluates connectives and implications. The security rule combines AND and NOT in a real conditional, so the learner must translate the sentence, identify the false case and form the contrapositive without changing the meaning.",
      answer:
        "Let P be “the door is opened” and Q be “the code is entered”. The rule is P AND NOT Q → alarm. It is false when the door is opened, the code is not entered, and the alarm does not sound. The contrapositive is: if the alarm does not sound, then it is not the case that (P and not Q), which means the door was not opened or the code was entered.",
      marking: [
        "Translates the sentence into P AND NOT Q implying the alarm.",
        "Identifies the false case as the premise true and the alarm false.",
        "Forms the contrapositive correctly using De Morgan's law.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "When is P AND Q true?",
      answer: "Only when both P and Q are true.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "When is P → Q false?",
      answer: "Only when P is true and Q is false.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What is the contrapositive of P → Q, and how does it relate to the original?",
      answer:
        "NOT Q → NOT P; it is logically equivalent to P → Q.",
      when: "month-later",
    },
  ],
  summary: [
    "AND requires both inputs; OR requires at least one; NOT reverses the value.",
    "An implication is false only when the premise is true and the conclusion is false.",
    "The converse swaps the parts and is not equivalent; the contrapositive is equivalent.",
    "Truth tables compare every row and prove logical equivalence when the output columns match.",
  ],
});
