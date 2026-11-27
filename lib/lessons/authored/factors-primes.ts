import type { AuthoredLesson } from "../../lesson-contract";

// AQA GCSE Mathematics 8300, Number reference N4.
//
// This lesson exists because N4 was the first content omission in the Number
// pathway: the audit could name the objective but no concept, generator, lesson
// or assessment could teach it. The sequence deliberately keeps two directions
// separate — a FACTOR divides a number, a MULTIPLE is made by multiplying it —
// because swapping those two is the error that survives into HCF and LCM work.
//
// Prime factorisation is not presented as a list of tricks. It is the claim that
// every whole number greater than 1 can be broken into primes in exactly one way
// apart from order, and that this breakdown makes HCF and LCM visible rather than
// remembered. The assessment asks for the product, its index form, HCF, LCM and
// the uniqueness reason separately, so a learner who can produce 2 × 2 × 3 × 3
// but cannot say why no other prime product works is not recorded as complete.
export const MATHS_FACTORS_PRIMES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "factors-primes",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, number: prime numbers, factors, multiples, common factors, common multiples, HCF, LCM and prime factorisation",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Decide whether a number is a factor or a multiple of another, and find all the factor pairs of a whole number.",
      evidence:
        "The learner lists 1 × 36, 2 × 18, 3 × 12, 4 × 9 and 6 × 6 for 36, and explains that 36 is a multiple of 6 while 6 is a factor of 36.",
    },
    {
      statement:
        "Write a whole number as a product of prime factors, using index notation where appropriate.",
      evidence:
        "The learner breaks 36 into 2 × 2 × 3 × 3 and writes the same product as 2² × 3², saying that every factor left is prime.",
    },
    {
      statement:
        "Find the highest common factor and lowest common multiple of two numbers from their prime factorisations.",
      evidence:
        "The learner uses 24 = 2³ × 3 and 36 = 2² × 3² to get HCF = 2² × 3 = 12 and LCM = 2³ × 3² = 72, and explains which powers are chosen in each case.",
    },
    {
      statement:
        "Explain why a whole number greater than 1 has only one prime factorisation, apart from the order of the factors.",
      evidence:
        "The learner says that breaking a composite into smaller factors must stop at primes, and that two different prime products for the same number would contradict the fact that a prime cannot be built from other primes.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["multiplication", "division"],
    check: [
      {
        id: "f1",
        question: "What does 7 × 8 mean, and what is the answer?",
        answer:
          "Seven groups of eight, or eight groups of seven; both give 56.",
        targets: ["multiplication"],
      },
      {
        id: "f2",
        question: "What question does 56 ÷ 7 answer?",
        answer:
          "How many groups of 7 fit into 56, which is 8; it also shares 56 into 7 equal parts of 8.",
        targets: ["division"],
      },
    ],
  },

  introduction: {
    hook:
      "A tiler has 36 identical square tiles and wants to arrange them as a rectangle with no gaps. She can make 1 row of 36, 2 rows of 18, 3 rows of 12, 4 rows of 9, or 6 rows of 6. The same 36 tiles keep producing different rectangles: each one is a factor pair, and the number of tiles never changes.",
    why:
      "Factors and multiples are the two directions of one multiplication fact. 6 × 6 = 36 makes 6 a factor of 36 and 36 a multiple of 6. Once those directions are secure, the highest common factor and lowest common multiple are not new rules: they are questions about which prime factors two numbers share, and which primes are needed to build both.",
  },

  explanation: [
    {
      heading: "A factor divides; a multiple is made by multiplying",
      paragraphs: [
        "A factor of a whole number divides it exactly, leaving no remainder. The factors of 36 are 1, 2, 3, 4, 6, 9, 12, 18 and 36, and they arrive in pairs because a division fact and a multiplication fact describe the same relationship: 4 × 9 = 36, so 4 and 9 are both factors. The factor pairs of 36 are 1 × 36, 2 × 18, 3 × 12, 4 × 9 and 6 × 6. The square pair 6 × 6 appears once because both factors are the same number.",
        "A multiple of 6 is made by multiplying 6 by a whole number: 6, 12, 18, 24, 30, and so on for ever. 36 is a multiple of 6 because 6 × 6 = 36; 6 is a factor of 36. The two words are not interchangeable. A number is a factor of 36 only if it divides 36 exactly; it is a multiple of 6 only if 6 divides it exactly. Asking 'is 9 a multiple of 36?' is therefore a different question from 'is 9 a factor of 36?' — the first is false, the second is true.",
        "Every whole number greater than 1 has at least two factors: 1 and itself. A prime number has exactly those two factors and no others. 2, 3, 5, 7, 11 and 13 are prime. 1 is not prime because it has only one factor, itself; 4 is not prime because 2 × 2 = 4 adds a third factor; 9 is not prime because 3 × 3 = 9. The number 2 is the only even prime, since every other even number is divisible by 2.",
      ],
    },
    {
      heading: "Prime factorisation breaks a number until every factor is prime",
      paragraphs: [
        "A factor tree starts with the number and splits it into any factor pair, then splits each composite factor again until only primes remain. For 36: split into 4 × 9; split 4 into 2 × 2; split 9 into 3 × 3. The leaves are 2, 2, 3 and 3, so 36 = 2 × 2 × 3 × 3. A different first split, such as 6 × 6, gives the same leaves, because 6 = 2 × 3 and the two copies produce 2 × 3 × 2 × 3. The order changes; the multiset of prime factors does not.",
        "Index notation counts repeated factors: 2 × 2 × 3 × 3 = 2² × 3². The index is not a decoration and it is not a different number. It is the compact way to write a repeated multiplication, exactly as 4³ means 4 × 4 × 4. A prime factorisation is finished only when every factor shown is prime. 2 × 2 × 9 is not finished because 9 is composite; 3 × 12 is not finished because 12 is composite.",
        "The uniqueness is the quiet engine of the whole topic. If 36 could be built from two genuinely different sets of primes, then dividing out the primes the sets share would leave two different products equal to the same number with no common factor — impossible, because a prime cannot be split into other primes. That is why a factor tree may start in many ways and always ends in the same prime factors. It is also why HCF and LCM can be read from the prime factorisations once, without listing every factor of both numbers.",
      ],
    },
    {
      heading: "HCF takes the shared primes; LCM takes every prime at its highest power",
      paragraphs: [
        "Write both numbers as prime products and line up the primes. For 24 and 36: 24 = 2 × 2 × 2 × 3 = 2³ × 3, and 36 = 2 × 2 × 3 × 3 = 2² × 3². A common factor can only use primes that appear in both lists, and it cannot use more copies than the number that has fewer. The shared primes are two 2s and one 3, so the HCF is 2² × 3 = 12. The HCF is the largest number that divides both 24 and 36 exactly.",
        "A common multiple must contain enough primes to build each number. To build 24 it needs three 2s and one 3; to build 36 it needs two 2s and two 3s. Taking the highest power of each prime present gives 2³ × 3² = 8 × 9 = 72, the LCM. The LCM is the smallest number both 24 and 36 divide into. The product 24 × 36 = 864 is also a common multiple, but it contains extra copies of the shared primes; it is not the lowest one.",
        "For two numbers, HCF × LCM = product of the numbers. Here 12 × 72 = 864 = 24 × 36. That identity is a check, not a method to memorise: it works because the HCF keeps the shared primes and the LCM keeps every prime at its highest power, so between them each prime is counted exactly as often as it appears in the two original numbers. The identity does not extend to three numbers, which is why the prime-factor method is the reliable one.",
      ],
    },
    {
      heading: "A context tells you whether the question is a factor question or a multiple question",
      paragraphs: [
        "Packing identical boxes from two quantities is a factor question: the number in each box must divide both quantities, and 'greatest possible' asks for the HCF. Two events that repeat and next coincide is a multiple question: the waiting time must be a multiple of both intervals, and 'next together' asks for the LCM. The arithmetic can be identical; the decision is the concept.",
        "The check is always the same. An HCF answer must divide both original numbers and must not exceed either of them. An LCM answer must be at least as large as both original numbers and must be divisible by both. A learner who writes 864 for the LCM of 24 and 36 has found a common multiple, but not the lowest; a learner who writes 6 for the HCF of 24 and 36 has found a common factor, but not the highest. The words 'highest' and 'lowest' are doing real work, and an answer that satisfies only the weaker condition is not finished.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The factor pairs of 36, written as multiplication facts. Each pair divides 36 with no remainder.",
      notation:
        "1 × 36 = 36\n2 × 18 = 36\n3 × 12 = 36\n4 × 9 = 36\n6 × 6 = 36",
      caption:
        "The pairs run out at 6 × 6 because the next factor after 6 would repeat a pair already written. 6 is the square root of 36, which is why the square pair appears only once.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "A rectangle 4 tiles wide and 9 tiles tall uses 36 tiles. Rotating it gives 9 wide and 4 tall, the same factor pair in the other order.",
      notation: "4 × 9 = 36",
      caption:
        "The area is the product of the side lengths. Every factor pair of 36 is a rectangle with those side lengths, so 'factor pair' is a statement about shape as well as arithmetic.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A factor tree for 36. Split 36 into 4 × 9, then split 4 into 2 × 2 and 9 into 3 × 3. The prime leaves are circled in the lesson's written method.",
      notation:
        "36 = 4 × 9\n4 = 2 × 2\n9 = 3 × 3\n36 = 2 × 2 × 3 × 3 = 2² × 3²",
      caption:
        "The factor tree is finished when every leaf is prime. Changing the first split to 6 × 6 gives the same four prime leaves, because 6 = 2 × 3.",
    },
    {
      id: "r4",
      kind: "maths.number-line",
      body:
        "Multiples of 6 and multiples of 8 marked from zero. The first number on both lists is 24, so 24 is the lowest common multiple.",
      notation:
        "6: 6, 12, 18, 24, 30, ...\n8: 8, 16, 24, 32, ...\nLCM(6, 8) = 24",
      caption:
        "A common multiple is a number both lists reach. The lowest one is the first meeting point; the product 48 is also common but is not the lowest.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Write 36 as a product of its prime factors, then in index form.",
      steps: [
        {
          move: "Split 36 into a factor pair: 4 × 9.",
          why:
            "Any factor pair is a valid start; the method does not depend on finding the cleverest split.",
        },
        {
          move: "Split 4 into 2 × 2 and 9 into 3 × 3.",
          why:
            "4 and 9 are composite, so each must be broken further; 2 and 3 are prime and cannot be split.",
        },
        {
          move: "Collect the prime leaves: 2 × 2 × 3 × 3, so 36 = 2² × 3².",
          why:
            "The index counts how many times each prime appears. There are two 2s and two 3s, so both indices are 2.",
        },
      ],
      answer: "36 = 2 × 2 × 3 × 3 = 2² × 3²",
    },
    {
      id: "w2",
      prompt: "Find the HCF and LCM of 24 and 36.",
      steps: [
        {
          move: "Write both as prime products: 24 = 2³ × 3 and 36 = 2² × 3².",
          why:
            "The prime factorisation is the common language in which the two numbers can be compared.",
        },
        {
          move:
            "For the HCF, take the shared primes at the lower power: 2² × 3 = 12.",
          why:
            "A common factor cannot use a prime that is missing from one number, and cannot use more copies than the number with fewer. The lower power is the largest shared amount.",
        },
        {
          move:
            "For the LCM, take every prime at its highest power: 2³ × 3² = 8 × 9 = 72.",
          why:
            "A common multiple must contain enough primes to build each number. The highest power of each prime is exactly what is needed.",
        },
        {
          move: "Check: 12 × 72 = 864 = 24 × 36.",
          why:
            "For two numbers the HCF and LCM multiply to the product of the numbers. The check catches a wrong power before the answer is used.",
        },
      ],
      answer: "HCF = 12; LCM = 72",
    },
    {
      id: "w3",
      prompt:
        "At 09:00 two bells ring together. One rings every 18 minutes and the other every 24 minutes. When do they next ring together?",
      steps: [
        {
          move: "Recognise that the waiting time must be a multiple of both 18 and 24.",
          why:
            "The first bell rings at multiples of 18 minutes after nine; the second at multiples of 24. They coincide only at a number both lists reach.",
        },
        {
          move: "Find LCM(18, 24): 18 = 2 × 3² and 24 = 2³ × 3, so the LCM is 2³ × 3² = 72.",
          why:
            "The highest power of 2 is 2³ and the highest power of 3 is 3²; using lower powers would not build one of the numbers.",
        },
        {
          move: "Add 72 minutes to 09:00: the next time is 10:12.",
          why:
            "The LCM is a waiting time in minutes, not a clock time. 60 minutes takes the clock to 10:00, and the remaining 12 minutes take it to 10:12.",
        },
      ],
      answer: "10:12",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "1 is a prime number, because it has no factors other than 1 and itself.",
      whyItFails:
        "A prime has exactly two DIFFERENT factors: 1 and the number itself. For 1 those are the same factor, so 1 has only one factor, not two. Treating 1 as prime also breaks the uniqueness of prime factorisation: 36 could then be written as 2² × 3² or 1 × 2² × 3² or 1 × 1 × 2² × 3², and the factorisation would no longer be unique.",
      correction:
        "The primes start at 2. A prime has exactly two distinct factors, 1 and itself. 1 is neither prime nor composite; it is the unit.",
      contrast: {
        wrong: "1 is prime because nothing else divides it",
        right: "2, 3, 5, 7, 11, ... are prime; 1 is not prime",
      },
    },
    {
      id: "m2",
      belief: "9 is a multiple of 36 because 36 is bigger than 9.",
      whyItFails:
        "Being smaller does not make a number a multiple. A multiple of 36 is 36 × a whole number: 36, 72, 108, and so on, all at least 36. 9 is a FACTOR of 36 because 9 × 4 = 36. The relationship has a direction, and reversing it turns a true factor statement into a false multiple statement.",
      correction:
        "Ask which number is being multiplied. 9 × 4 = 36 makes 9 a factor of 36 and 36 a multiple of 9. A multiple of 36 must be 36 times a whole number.",
      contrast: {
        wrong: "9 is a multiple of 36",
        right: "9 is a factor of 36; 36 is a multiple of 9",
      },
    },
    {
      id: "m3",
      belief: "The HCF of 24 and 36 is 6 because 6 is a common factor.",
      whyItFails:
        "6 does divide both numbers, so it is a common factor — but the question asks for the HIGHEST common factor. 12 also divides both (24 ÷ 12 = 2 and 36 ÷ 12 = 3), and 12 > 6, so 6 cannot be the highest. Stopping at the first common factor found is a search that has not finished.",
      correction:
        "Use the prime factorisations: 24 = 2³ × 3 and 36 = 2² × 3². The shared primes at their lower powers give 2² × 3 = 12. Check that 12 divides both and that no larger common factor exists.",
      contrast: {
        wrong: "HCF(24, 36) = 6 because both are even and divisible by 6",
        right: "HCF(24, 36) = 12 = 2² × 3",
      },
    },
    {
      id: "m4",
      belief: "The LCM of 24 and 36 is 864 because 24 × 36 = 864.",
      whyItFails:
        "864 is a common multiple, since both 24 and 36 divide it, but it is not the LOWEST. The product always contains extra copies of the primes the numbers share. Here 24 × 36 counts the shared 2² × 3 twice, while the LCM needs each prime only at its highest power.",
      correction:
        "Take the highest power of every prime present: 2³ × 3² = 72. Check that 72 ÷ 24 = 3 and 72 ÷ 36 = 2. The product is an upper bound, not the answer to 'lowest'.",
      contrast: {
        wrong: "LCM(24, 36) = 24 × 36 = 864",
        right: "LCM(24, 36) = 2³ × 3² = 72",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "List all the factor pairs of 40.",
      hint:
        "Start with 1 × 40 and work upwards. Stop when the factor you are testing would repeat a pair you already have.",
      answer:
        "1 × 40, 2 × 20, 4 × 10 and 5 × 8. The next candidate is 8, which would repeat 5 × 8.",
      feedback: {
        correct:
          "The pairs are complete and the search stopped at the square-root boundary, where pairs begin to repeat.",
        incorrect:
          "Test each whole number from 1 upwards: 1 × 40, 2 × 20, 3 does not divide 40, 4 × 10, 5 × 8, and 6, 7 do not divide 40. The pair 8 × 5 repeats 5 × 8, so the list is complete.",
      },
    },
    {
      id: "p2",
      prompt: "Write 60 as a product of its prime factors in index form.",
      hint: "Start with 6 × 10, then break both factors into primes.",
      answer: "60 = 2 × 2 × 3 × 5 = 2² × 3 × 5",
      feedback: {
        correct:
          "Every factor left is prime, and the repeated 2 is written with an index.",
        incorrect:
          "6 × 10 = (2 × 3) × (2 × 5) = 2 × 2 × 3 × 5. Two 2s make 2², and the 3 and 5 each appear once, so 60 = 2² × 3 × 5.",
      },
    },
    {
      id: "p3",
      prompt: "Find the HCF and LCM of 18 and 30.",
      hint:
        "18 = 2 × 3² and 30 = 2 × 3 × 5. For the HCF take shared primes at the lower power; for the LCM take every prime at the highest power.",
      answer: "HCF = 6; LCM = 90",
      feedback: {
        correct:
          "The HCF uses 2 × 3, and the LCM uses 2 × 3² × 5; both checks divide correctly.",
        incorrect:
          "The shared primes are one 2 and one 3, so HCF = 6. The LCM needs the highest power of every prime present: 2 × 3² × 5 = 90. Check 90 ÷ 18 = 5 and 90 ÷ 30 = 3.",
      },
    },
    {
      id: "p4",
      prompt:
        "A teacher has 24 rulers and 36 pencils. They are shared into identical packs with no items left over, each pack containing only one type of item and every pack having the same number of items. What is the greatest number of items in each pack?",
      hint:
        "The number in each pack must divide both 24 and 36. 'Greatest' means the HCF.",
      answer:
        "12 items per pack, because HCF(24, 36) = 12; that makes 2 packs of rulers and 3 packs of pencils.",
      feedback: {
        correct:
          "The context was read as a common-factor question and the HIGHEST factor was chosen, not merely any common factor.",
        incorrect:
          "The pack size must divide 24 and 36, so it is a common factor. The greatest common factor is 12: 24 ÷ 12 = 2 and 36 ÷ 12 = 3, with no remainder. 6 is a common factor but not the greatest, so it does not use the largest possible pack.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Write 36 as a product of its prime factors. Do not use index notation.",
      modelAnswer: "2 × 2 × 3 × 3",
      marking: [
        "All four factors are prime; no composite factor remains.",
        "The four factors multiply to 36. Both conditions are required for the single mark.",
      ],
      check: {
        accepted: [
          "2 × 2 × 3 × 3",
          "2*2*3*3",
          "2 x 2 x 3 x 3",
          "2x2x3x3",
          "2, 2, 3, 3",
        ],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Write 36 as a product of its prime factors in index form, using a raised index for a repeated factor.",
      modelAnswer: "2² × 3²",
      marking: [
        "Writes the two repeated 2s and two repeated 3s using indices, not as four separate factors.",
        "The expression is exactly 2² × 3² and still equals 36. Both conditions are required for the single mark.",
      ],
      check: {
        accepted: [
          "2^2 × 3^2",
          "2^2*3^2",
          "2^2 x 3^2",
          "2^2x3^2",
          "2² × 3²",
          "2²*3²",
          "2²x3²",
        ],
      },
    },
    {
      id: "a3",
      kind: "structured",
      prompt:
        "Complete the table with one correct answer in each row.",
      modelAnswer:
        "A factor of 36 greater than 10: 12 (18 and 36 are also correct). A multiple of 7 between 20 and 30: 21 (28 is also correct).",
      marking: [
        "Chooses a number that divides 36 exactly and is greater than 10 (1 mark).",
        "Chooses a number that is 7 times a whole number and lies between 20 and 30 (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Write a factor of 36 that is greater than 10.",
            marks: 1,
            answer: 0,
            response: "table",
            table: {
              columns: ["Your answer"],
              rows: [
                {
                  label: "A factor of 36 greater than 10",
                  cells: [{ answer: 12, accepted: ["18", "36"] }],
                },
              ],
            },
            explanation:
              "A factor of 36 must divide it exactly: 12 × 3 = 36, 18 × 2 = 36 and 36 × 1 = 36, so 12, 18 or 36 all work. 9 is below 10, and 8 does not divide 36 exactly because 36 ÷ 8 leaves a remainder of 4.",
          },
          {
            id: "b",
            prompt: "Write a multiple of 7 that is between 20 and 30.",
            marks: 1,
            answer: 0,
            response: "table",
            table: {
              columns: ["Your answer"],
              rows: [
                {
                  label: "A multiple of 7 between 20 and 30",
                  cells: [{ answer: 21, accepted: ["28"] }],
                },
              ],
            },
            explanation:
              "A multiple of 7 is 7 times a whole number: 7, 14, 21, 28, 35, ... Between 20 and 30 the only multiples are 21 (7 × 3) and 28 (7 × 4). 24 is not a multiple of 7, and 14 is below 20.",
          },
        ],
      },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt: "Write down all the common factors of 9 and 12.",
      modelAnswer: "1 and 3",
      marking: [
        "Gives both 1 and 3.",
        "Does not include any number that fails to divide 9 or 12; both conditions are required for the single mark.",
      ],
      check: {
        accepted: [
          "1 and 3",
          "1, 3",
          "1,3",
          "3 and 1",
          "1 and 3 only",
        ],
      },
    },
    {
      id: "a5",
      kind: "structured",
      prompt: "For the numbers 9 and 12, work out the HCF and the LCM.",
      modelAnswer:
        "HCF = 3 and LCM = 36, because 3 is the greatest shared factor and 36 is the first shared multiple.",
      marking: [
        "HCF is the largest number dividing both 9 and 12 (1 mark).",
        "LCM is the smallest number both 9 and 12 divide into (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Work out the highest common factor (HCF) of 9 and 12.",
            marks: 1,
            answer: 3,
            explanation:
              "The factors of 9 are 1, 3 and 9; the factors of 12 are 1, 2, 3, 4, 6 and 12. The shared factors are 1 and 3, and the highest is 3. So HCF(9, 12) = 3.",
          },
          {
            id: "b",
            prompt: "Work out the lowest common multiple (LCM) of 9 and 12.",
            marks: 1,
            answer: 36,
            explanation:
              "Multiples of 9 are 9, 18, 27, 36, ... and multiples of 12 are 12, 24, 36, ... The first number in both lists is 36, so LCM(9, 12) = 36. The product 9 × 12 = 108 is also a common multiple, but it is not the lowest.",
          },
        ],
      },
    },
    {
      id: "a6",
      kind: "structured",
      prompt:
        "Use prime factorisations to find the HCF and LCM of 24 and 36.",
      modelAnswer:
        "24 = 2³ × 3 and 36 = 2² × 3²; HCF = 2² × 3 = 12; LCM = 2³ × 3² = 72.",
      marking: [
        "HCF is the product of the shared primes at the lower powers (1 mark).",
        "LCM is the product of every prime at its highest power (1 mark).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Work out the HCF of 24 and 36.",
            marks: 1,
            answer: 12,
            explanation:
              "24 = 2 × 2 × 2 × 3 and 36 = 2 × 2 × 3 × 3. The shared primes are two 2s and one 3, so the HCF is 2 × 2 × 3 = 12. Check: 24 ÷ 12 = 2 and 36 ÷ 12 = 3.",
          },
          {
            id: "b",
            prompt: "Work out the LCM of 24 and 36.",
            marks: 1,
            answer: 72,
            explanation:
              "Take every prime at its highest power: 2³ × 3² = 8 × 9 = 72. Check: 72 ÷ 24 = 3 and 72 ÷ 36 = 2. The product 24 × 36 = 864 is a common multiple, but it is not the lowest because it counts the shared primes twice.",
          },
        ],
      },
    },
    {
      id: "a7",
      kind: "constructed-response",
      prompt:
        "Explain why a whole number greater than 1 has only one prime factorisation, apart from the order of the factors. Use 36 = 2² × 3² as an example.",
      modelAnswer:
        "A composite number can be split into smaller factors until every factor is prime; the process must stop because the factors get smaller and cannot go below 2. If 36 had a different prime factorisation, dividing out the primes the two products share would leave two different products of primes equal to the same number with no common prime factor. That is impossible: a prime cannot be built by multiplying other primes, so the remaining products would have to be equal. The primes in 2² × 3² are therefore the only primes that multiply to 36; changing their order changes nothing about the product.",
      marking: [
        "Explains that repeated factorisation must end in primes (1 mark).",
        "Explains why two different prime products cannot represent the same number, or uses the shared-prime argument for 36 (1 mark).",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A school buys 48 red pens and 60 blue pens. The pens are packed into identical boxes. Each box contains pens of only one colour, every box has the same number of pens, and no pens are left over. What is the greatest number of pens each box can contain, and how many boxes are needed?",
      whyItTransfers:
        "The learner must decide that the box size is a common factor of 48 and 60, choose the greatest one, and then divide both quantities to get the number of boxes. The decision comes first; the arithmetic is the easy part.",
      answer:
        "12 pens per box. 48 ÷ 12 = 4 boxes of red pens and 60 ÷ 12 = 5 boxes of blue pens, so 9 boxes in total. The HCF is 12; 6 is a common factor but not the greatest, so it would need more boxes than necessary.",
      marking: [
        "Recognises the box size as a common factor and chooses the HCF.",
        "Gives 12 pens per box.",
        "Divides both quantities by 12 and gives 9 boxes in total.",
      ],
    },
    {
      id: "t2",
      prompt:
        "Two buses leave a station every 15 minutes and every 20 minutes. They leave together at 08:00. When will they next leave together, and why is the answer not 35 minutes later?",
      whyItTransfers:
        "The situation is a common-multiple question, but the tempting wrong move is to add the intervals. The learner has to explain why addition does not model two independent repeating schedules.",
      answer:
        "At 09:00, because LCM(15, 20) = 60 minutes. The first bus leaves at 15, 30, 45, 60, ... minutes and the second at 20, 40, 60, ... minutes; 60 is the first time both lists meet. Adding 15 + 20 = 35 would be the time when each bus has made one more journey, not the time when their departure times coincide.",
      marking: [
        "Gives 09:00 or 60 minutes after 08:00.",
        "Uses the LCM rather than the sum.",
        "Explains that 35 minutes is when each bus has departed once more, not when the departures coincide.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "List the factor pairs of 28.",
      answer: "1 × 28, 2 × 14 and 4 × 7.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Write 45 as a product of prime factors in index form.",
      answer: "45 = 3 × 3 × 5 = 3² × 5.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Find the HCF and LCM of 16 and 24. Check your answer with HCF × LCM = 16 × 24.",
      answer:
        "16 = 2⁴ and 24 = 2³ × 3, so HCF = 2³ = 8 and LCM = 2⁴ × 3 = 48. Check: 8 × 48 = 384 = 16 × 24.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt:
        "A shop has 30 notebooks and 42 folders. They are packed into identical boxes with no item left over and only one type of item in each box. What is the greatest number of items per box?",
      answer:
        "6, because HCF(30, 42) = 6. 30 ÷ 6 = 5 boxes and 42 ÷ 6 = 7 boxes, so 12 boxes in total.",
      when: "month-later",
    },
  ],

  summary: [
    "A factor divides a number exactly; a multiple is that number times a whole number.",
    "Every whole number greater than 1 has at least the factors 1 and itself; a prime has exactly those two distinct factors, and 1 is not prime.",
    "Prime factorisation breaks a number until every factor is prime; index notation counts repeated primes.",
    "The HCF uses the shared primes at their lower powers; the LCM uses every prime at its highest power.",
    "A context decides which one is needed: identical groups use the HCF, repeated events that coincide use the LCM.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Factor trees are written as a sequence of multiplication lines, so the structure is read in order rather than inferred from a drawing. Powers are written both with an index and in words.",
    },
    {
      need: "dyslexia",
      alternative:
        "HCF and LCM methods are separated into two labelled blocks, and the shared primes are listed before any multiplication, so the two procedures are not mixed in one paragraph.",
    },
    {
      need: "motor",
      alternative:
        "Factor and multiple answers may be typed as digits or as a product with spaces; the accepted forms include both × and * so the keyboard does not decide the mark.",
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
        "All explanations, examples, practice and assessment items in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for number.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-26",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
