import type { AuthoredLesson } from "../../lesson-contract";

// Batch 7 — fraction-ops, the concept the `denom-add` repair assumes.
//
// The bank already catches the most common belief in the whole curriculum (adding
// the bottoms: 1/3 + 1/4 = 2/7) and offers a coaching paragraph for it. That
// repair only works if the lesson has taught WHY counts can be combined only when
// the part sizes match, so the teaching here is built on one sentence: a
// denominator names a size, and a numerator counts those sizes.
//
// Multiplication and division are then read as English rather than as procedures —
// "two thirds OF three fifths" and "how many sixths FIT IN two thirds" — because
// the flip rule is unmemorable when it is only a rule, and obvious when the
// question it answers is on the page.
export const MATHS_FRACTION_OPS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "fraction-ops",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: adding, subtracting, multiplying and dividing fractions, including improper fractions and mixed numbers",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Add and subtract fractions by rewriting them to a common denominator, explaining why the counts cannot be combined until the sizes match.",
      evidence:
        "The learner rewrites one third and one quarter as four twelfths and three twelfths, gives seven twelfths, and says that the sizes had to match before the counts could be added.",
    },
    {
      statement: "Multiply two fractions, reading the operation as 'of' a quantity.",
      evidence:
        "The learner works out two thirds of three fifths as six fifteenths, simplifies it to two fifths, and explains that the answer is smaller than both fractions because it is a part of a part.",
    },
    {
      statement:
        "Divide by a fraction by asking how many of the divisor fit, and use that to justify inverting and multiplying.",
      evidence:
        "The learner answers two thirds divided by one sixth as 4, saying four sixths fit into two thirds, and confirms it with two thirds multiplied by six over one.",
    },
    {
      statement:
        "Convert between mixed numbers and improper fractions, and add, subtract, multiply or divide mixed numbers by converting first.",
      evidence:
        "The learner converts 2 3/4 to 11/4, adds 1 1/2 as 6/4 to get 17/4 = 4 1/4, and explains why the whole parts cannot simply be combined with an improper fraction part and left there.",
    },
  ],

  priorKnowledge: {
    // ONLY WHAT THE GENOME DECLARES.
    //
    // This lesson first listed `multiplication` here, because multiplying the
    // counts is what section three asks a learner to do. The gate refused it:
    // `fraction-ops` declares `fractions`, so any prior knowledge has to be a
    // transitive DECLARED prerequisite, and inventing one makes the page's
    // assumptions disagree with the path that delivered the learner. It is the
    // rule the mandate sets, enforced in code — so the multiplication reading is
    // TAUGHT inside the lesson ("a part of a part") rather than asserted before it.
    conceptIds: ["fractions"],
    check: [
      {
        id: "f1",
        question: "What does the 4 in three quarters tell you?",
        answer: "That the whole is cut into four equal parts, and each part is a quarter.",
        targets: ["fractions"],
      },
      {
        id: "f2",
        question: "Are one half and three sixths the same amount?",
        answer: "Yes, because multiplying the top and bottom by three changes the way it is written, not what it is worth.",
        targets: ["fractions"],
      },
    ],
  },

  introduction: {
    hook:
      "A recipe says two thirds of a cup, and the measuring jug is marked in twelfths. Nothing has gone wrong: two thirds is not a different amount in twelfths, it is the same amount written in a different size of part. Almost every fraction mistake is a mistake about the SIZE of the part rather than about the arithmetic.",
    why:
      "A denominator names how big one part is and a numerator counts how many of those parts you have. You can add counts only when the sizes are the same, exactly as you can add three metres to four metres but not to four centimetres. Once that sentence is secure, adding fractions, simplifying them, multiplying them and dividing them all become consequences rather than rules to remember.",
  },

  explanation: [
    {
      heading: "A denominator is a size, and only equal sizes can be counted",
      paragraphs: [
        "A fraction carries two separate pieces of information. The denominator says how big one part is: quarters are bigger than sixths, because the same whole cuts into fewer pieces. The numerator says how many of those parts you have. Adding three quarters to one quarter is easy because both counts refer to the same size, so four quarters is one whole. Adding one third to one quarter is not the same kind of sum, because the parts being counted are different sizes.",
        "The everyday version of this is measurement. Three metres plus four metres is seven metres, and three metres plus four centimetres is not seven of anything until one of them is converted. Fractions behave identically, which is why a sum like one third plus one quarter has to be rewritten before the counts mean the same thing. Recognising that the sizes differ is the whole of the diagnosis; the arithmetic afterwards is ordinary counting.",
      ],
    },
    {
      heading: "A common denominator rewrites both fractions without changing what they are worth",
      paragraphs: [
        "Multiplying the top and the bottom of a fraction by the same number changes its appearance and not its value, because the part size and the number of parts are scaled together. One third becomes four twelfths when both numbers are multiplied by four: the parts are four times smaller and there are four times as many of them. One quarter becomes three twelfths by multiplying both numbers by three, and now both fractions count twelfths.",
        "Any common multiple will do, and the lowest one keeps the numbers small: twelve serves thirds and quarters, while twenty-four would also work and would need simplifying at the end. Subtraction uses exactly the same rewriting, since taking away a count of parts requires the parts to be the same size just as adding does. What must never happen is combining the denominators themselves, because adding two sizes produces a size that belongs to neither fraction.",
      ],
    },
    {
      heading: "Multiplying is 'of', and dividing is 'how many fit'",
      paragraphs: [
        "Two thirds of three fifths means a part of a part, so the answer must be smaller than either fraction, and it is found by multiplying the counts and the sizes: six fifteenths, which simplifies to two fifths. The picture is a rectangle cut into five columns and three rows, with two columns and three rows shaded. Reading multiplication as 'of' also explains why the answer can be tiny: half of a half is a quarter, not one.",
        "Division asks a different question: how many of the divisor fit inside the dividend. Two thirds divided by one sixth asks how many sixths fit in two thirds, and the answer is four, because two thirds is four sixths. That is why inverting the divisor and multiplying gives the same result — multiplying by six over one counts sixths directly. A division by a fraction below one therefore gives an answer larger than the dividend, which is a check a learner can apply before trusting the arithmetic.",
      ],
    },
    {
      heading: "A mixed number is a whole plus a fraction; an improper fraction counts the same parts",
      paragraphs: [
        "Two and three quarters means two wholes plus three quarters. Each whole is four quarters, so the two wholes are eight quarters, and eight quarters plus three quarters is eleven quarters. The mixed form tells you the size at a glance; the improper form gives one count of a single part size, which is what the four operations need. Neither form is more correct, and converting between them does not change the number.",
        "To add two and three quarters to one and a half, convert both first: two and three quarters is eleven quarters, and one and a half is three halves, which is six quarters. The sum is seventeen quarters. Seventeen quarters is four wholes, because four wholes make sixteen quarters, plus one quarter, so the answer is four and a quarter. Adding the whole parts and the fraction parts separately gives three and five quarters; that is also four and a quarter, but only after the five quarters is converted. Stopping at three and five quarters leaves an improper fraction inside a mixed number.",
        "Multiplication and division must also start from the improper form. One and a half multiplied by two and two thirds is three halves multiplied by eight thirds, which is twenty-four sixths, or four. Multiplying the whole parts and the fraction parts separately gives two and one third, which is not four. The mixed number is one number, not a whole number and a fraction that can be operated on independently.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "Both fractions rewritten in twelfths, so the counts refer to the same size of part.",
      notation: "1/3 + 1/4 = 4/12 + 3/12 = 7/12",
      caption:
        "The top and bottom of each fraction were multiplied by the same number, so the values did not change; only the size of the parts did.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "A rectangle cut into five columns and three rows. Three of the five columns are shaded, and two of the three rows are shaded, so the overlap is six fifteenths of the whole.",
      notation: "2/3 × 3/5 = 6/15 = 2/5",
      caption:
        "The overlap is the part of a part, and the grid shows why the counts multiply: two of the three rows within three of the five columns.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "Two thirds marked in sixths: each third is two sixths, so two thirds is four sixths.",
      notation: "2/3 ÷ 1/6 = 4",
      caption:
        "Counting the sixths up to two thirds gives four, which is the division answered as a question about fit rather than about flipping.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 1/3 + 1/4.",
      steps: [
        {
          move: "Notice the part sizes differ: thirds and quarters cannot be counted together.",
          why:
            "The counts only mean something once the sizes match, so the sum has to be rewritten before any adding happens.",
        },
        {
          move: "Rewrite both in twelfths: 1/3 = 4/12 by multiplying top and bottom by 4, and 1/4 = 3/12 by multiplying by 3.",
          why:
            "Multiplying both numbers by the same factor changes the size of the parts and the count together, so the value is unchanged.",
        },
        {
          move: "Add the counts of twelfths: 4/12 + 3/12 = 7/12, and check that the answer sits between one third and one half.",
          why:
            "Twelfths are now the same size, so adding the counts is ordinary addition; the estimate confirms the size of the result.",
        },
      ],
      answer: "7/12",
    },
    {
      id: "w2",
      prompt: "Work out 2/3 ÷ 1/6, and explain why the answer is larger than 2/3.",
      steps: [
        {
          move: "Read the division as a question: how many sixths fit inside two thirds?",
          why:
            "The fit reading turns a rule into a count, and it shows what the answer is measuring before any symbols are moved.",
        },
        {
          move: "Rewrite two thirds in sixths: 2/3 = 4/6, because each third is two sixths.",
          why:
            "A common denominator is what makes the counts comparable, exactly as it does when adding.",
        },
        {
          move: "Count: four sixths fit, so the answer is 4, and confirm with 2/3 × 6/1 = 12/3 = 4.",
          why:
            "Inverting the divisor multiplies by the number of sixths in one whole, which is the same count arrived at directly.",
        },
      ],
      answer: "4",
    },
    {
      id: "w3",
      prompt: "Work out 3 1/3 + 2 1/2.",
      steps: [
        {
          move: "Convert both mixed numbers to improper fractions: 3 1/3 = 10/3 and 2 1/2 = 5/2.",
          why:
            "Each whole contributes the same denominator as the fraction part, so three wholes are nine thirds and two wholes are four halves. Writing one count of each part size makes the addition possible.",
        },
        {
          move: "Use a common denominator of six: 10/3 = 20/6 and 5/2 = 15/6, so the sum is 35/6.",
          why:
            "Thirds and halves are different part sizes, and only counts of the same size can be added. Six is the smallest number both denominators divide into.",
        },
        {
          move: "Convert 35/6 back to a mixed number: 35 ÷ 6 = 5 remainder 5, so the answer is 5 5/6.",
          why:
            "Six sixths make one whole, so thirty-six sixths would be six wholes. Thirty-five sixths is five wholes and five sixths, which is the same amount written in the form the question used.",
        },
      ],
      answer: "5 5/6",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Add the tops and the bottoms: one third plus one quarter is two sevenths.",
      whyItFails:
        "The denominator names the size of a part, so adding the sizes invents a part size, one seventh, that is smaller than both original parts. A sum of two positive fractions must be larger than either one, and two sevenths is smaller than one third, so the answer cannot be right. The counts were added while the sizes were different, which is the one thing counting does not allow.",
      correction:
        "Rewrite both fractions to a common denominator first, then add only the numerators: one third and one quarter become four twelfths and three twelfths, which add to seven twelfths.",
      contrast: {
        wrong: "1/3 + 1/4 = 2/7, adding the numerators and the denominators",
        right: "1/3 + 1/4 = 4/12 + 3/12 = 7/12, counting twelfths",
      },
    },
    {
      id: "m2",
      belief: "Divide fractions by dividing the tops and the bottoms, so two thirds divided by one sixth is two eighteenths.",
      whyItFails:
        "That calculation answers a different question: it takes two eighteenths of the first fraction rather than counting how many sixths fit in it. Two thirds holds four sixths, and the answer must be larger than two thirds because the divisor is below one. Two eighteenths is smaller than both numbers in the question, which is the sign that the operation was read wrongly.",
      correction:
        "Read the division as how many of the divisor fit, and either count them on a common denominator or invert the divisor and multiply: two thirds multiplied by six over one gives four.",
      contrast: {
        wrong: "2/3 ÷ 1/6 = 2/18, dividing the tops and the bottoms",
        right: "2/3 ÷ 1/6 = 4, because four sixths fit into two thirds",
      },
    },
    {
      id: "m3",
      belief: "Mixed numbers can be multiplied by multiplying the whole parts and the fraction parts separately: 1 1/2 × 2 2/3 = 2 1/3.",
      whyItFails:
        "A mixed number is one number, not a whole number plus a separate fraction to be multiplied independently. One and a half is three halves, and two and two thirds is eight thirds; their product is twenty-four sixths, which is four. Multiplying one by two and one half by two thirds gives two and one third, a much smaller number, because most of each factor has been left out of the multiplication.",
      correction:
        "Convert every mixed number to an improper fraction before multiplying or dividing. Then multiply the numerators and denominators, simplify, and convert back only if the question asks for a mixed number.",
      contrast: {
        wrong: "1 1/2 × 2 2/3 = 2 1/3, multiplying wholes and fractions separately",
        right: "1 1/2 × 2 2/3 = 3/2 × 8/3 = 24/6 = 4",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Work out 1/2 + 1/5.",
      hint: "Halves and fifths are different sizes; find a size both can be written in.",
      answer: "7/10, because one half is five tenths and one fifth is two tenths",
      feedback: {
        correct: "Both fractions were rewritten to tenths before any counts were added.",
        incorrect:
          "Ten serves both halves and fifths: one half is five tenths and one fifth is two tenths, so the total is seven tenths.",
      },
    },
    {
      id: "p2",
      prompt: "Work out 2/3 × 3/4.",
      hint: "Read it as two thirds OF three quarters, so the answer must be smaller than both.",
      answer: "1/2, because six twelfths simplifies to one half",
      feedback: {
        correct: "The counts multiplied and the result was simplified, and the size was checked against both fractions.",
        incorrect:
          "Multiplying the counts gives six twelfths, which simplifies to one half, and a half is smaller than both fractions.",
      },
    },
    {
      id: "p3",
      prompt: "Work out 3/4 ÷ 1/8.",
      hint: "Ask how many eighths fit inside three quarters.",
      answer: "6, because three quarters is six eighths",
      feedback: {
        correct: "The division was answered as a count of eighths, so the rule was not needed.",
        incorrect:
          "Each quarter holds two eighths, so three quarters holds six, and six eighths is the whole of three quarters.",
      },
    },
    {
      id: "p4",
      prompt: "Work out 2 1/4 × 1 1/3.",
      hint: "Convert both mixed numbers to improper fractions before multiplying. Two and a quarter is nine quarters, and one and a third is four thirds.",
      answer: "3, because 9/4 × 4/3 = 36/12 = 3",
      feedback: {
        correct:
          "Both mixed numbers were converted first, so the whole parts could not be multiplied separately by mistake.",
        incorrect:
          "Two and a quarter is 9/4 and one and a third is 4/3. Multiplying gives 36/12, which simplifies to 3; multiplying the whole parts and fraction parts separately gives 2 1/12 and is not the same number.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 2/5 + 1/2.",
      modelAnswer: "9/10",
      marking: [
        "Rewrites both fractions to a common denominator of ten rather than adding the numerators and denominators.",
        "Gives nine tenths, which is larger than a half as it must be.",
      ],
      check: { accepted: ["9/10", "0.9"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner writes one third plus one quarter equals two sevenths and says they added the tops and the bottoms. Explain why that answer cannot be right, then give the correct sum.",
      modelAnswer:
        "Adding the denominators adds two part sizes, which produces a part size of one seventh that belongs to neither fraction. A sum of two positive fractions must be larger than either addend, and two sevenths is smaller than one third, so it fails a check that needs no arithmetic. The fractions must first be written in the same size of part: one third is four twelfths and one quarter is three twelfths, which add to seven twelfths.",
      marking: [
        "States that the denominators name part sizes and cannot be added.",
        "Uses the size check: the sum must exceed either fraction.",
        "Rewrites both fractions in twelfths and gives seven twelfths.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Work out 4 1/5 − 2 3/4. Give your answer as a mixed number.",
      modelAnswer: "1 9/20",
      marking: [
        "Converts both mixed numbers to improper fractions: 21/5 and 11/4.",
        "Uses a common denominator of 20 and subtracts 55/20 from 84/20 to get 29/20.",
        "Converts 29/20 back to 1 9/20.",
      ],
      check: { accepted: ["1 9/20", "29/20", "1.45"] },
    },
    {
      id: "a4",
      kind: "structured",
      prompt:
        "A baker has 3 3/4 kg of flour. Each full batch of cakes uses 2/3 kg. Work out how many full batches can be made and how much flour is left over.",
      modelAnswer:
        "3 3/4 = 15/4. Dividing by 2/3 is the same as multiplying by 3/2: 15/4 × 3/2 = 45/8 = 5 5/8. So 5 full batches can be made. Five batches use 5 × 2/3 = 10/3 kg. The flour left is 15/4 − 10/3 = 45/12 − 40/12 = 5/12 kg. The 5/8 in 5 5/8 is five eighths of a batch, not five eighths of a kilogram.",
      marking: [
        "Converts 3 3/4 to the improper fraction 15/4 (M1).",
        "Replaces division by 2/3 with multiplication by its reciprocal 3/2, or uses an equivalent common-denominator division (M1).",
        "Gives 45/8 or 5 5/8 (A1).",
        "Interprets the quotient as 5 full batches (A1).",
        "Finds the remaining mass as 5/12 kg, distinguishing it from the fractional part of the batch count (A1).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Write 3 3/4 as an improper fraction.",
            marks: 1,
            answer: 3.75,
            accepted: ["15/4", "3.75"],
            explanation:
              "Three whole ones are twelve quarters, and the extra three quarters make fifteen quarters. So 3 3/4 = 15/4. The denominator stays four because the pieces are still quarters.",
          },
          {
            id: "b",
            prompt:
              "Work out 3 3/4 ÷ 2/3. Show your working and give the answer as a mixed number.",
            marks: 2,
            answer: 5.625,
            accepted: ["45/8", "5 5/8", "5.625"],
            method: {
              id: "b:M1",
              marks: 1,
              prompt: "Show the division changed into a multiplication by the reciprocal, or an equivalent common-denominator division.",
              accept: [
                "15/4 × 3/2",
                "15/4 * 3/2",
                "15/4 ÷ 2/3",
                "45/12 ÷ 8/12",
                "45/12 / 8/12",
                "45 ÷ 8",
                "3 3/4 ÷ 2/3",
              ],
              label: "a correct division by 2/3 (multiplying by 3/2 or dividing eighths into twelfths)",
            },
            explanation:
              "15/4 ÷ 2/3 means how many two-thirds fit into fifteen quarters. Dividing by a fraction is multiplying by its reciprocal: 15/4 × 3/2 = 45/8. Forty-five eighths is five whole ones and five eighths, so 5 5/8. A common-denominator method gives the same count: 45/12 ÷ 8/12 = 45 ÷ 8 = 5 5/8. The reciprocal is 3/2, not 2/3: the question is not asking for two thirds of the flour.",
          },
          {
            id: "c",
            prompt: "How many FULL batches can the baker make?",
            marks: 1,
            answer: 5,
            accepted: ["5", "5 batches", "five"],
            explanation:
              "The division gives 5 5/8 batches. Five full batches use 5 × 2/3 = 10/3 = 3 1/3 kg, and the remaining flour is not enough for another 2/3 kg batch. So the baker can make 5 full batches. The fractional part of the quotient is a fraction of a batch, not a number of kilograms.",
          },
          {
            id: "d",
            prompt:
              "How much flour is left over? Give your answer in kilograms.",
            marks: 1,
            answer: 5 / 12,
            tolerance: { abs: 0.0001 },
            accepted: ["5/12", "5/12 kg", "5/12kg", "0.4167", "0.417"],
            unit: "kg",
            explanation:
              "Five batches use 5 × 2/3 = 10/3 kg. Subtract that from the flour the baker started with: 15/4 − 10/3 = 45/12 − 40/12 = 5/12 kg. The 5/8 in 5 5/8 is five eighths of a batch, not five eighths of a kilogram. One batch is 2/3 kg, so the leftover part is 5/8 × 2/3 = 5/12 kg, which agrees with the subtraction.",
          },
        ],
      },
    },
    {
      id: "a5",
      kind: "structured",
      prompt:
        "Work out 2 1/3 × 3/4. Show your working and give your answer as a mixed number in its simplest form.",
      modelAnswer:
        "2 1/3 = 7/3. Multiplying the numerators and the denominators gives 7/3 × 3/4 = 21/12. The common factor of 3 cancels: 21/12 = 7/4, which is 1 3/4. The answer is larger than 3/4, as multiplying by a number greater than one must be, and smaller than 2 1/3, as multiplying by a number less than one must be.",
      marking: [
        "Converts 2 1/3 to the improper fraction 7/3 (M1).",
        "Multiplies the numerators and the denominators, then simplifies 21/12 to 7/4 or 1 3/4 (A1).",
      ],
      structured: {
        parts: [
          {
            id: "a",
            prompt: "Write 2 1/3 as an improper fraction.",
            marks: 1,
            answer: 7 / 3,
            tolerance: { abs: 0.0001 },
            accepted: ["7/3", "2.3333", "2.333"],
            explanation:
              "Two whole ones are six thirds, because each whole contains three thirds. Add the extra third: six thirds plus one third is seven thirds, so 2 1/3 = 7/3. The denominator stays three because the pieces are still thirds.",
          },
          {
            id: "b",
            prompt:
              "Work out 2 1/3 × 3/4. Give your answer as a mixed number in its simplest form.",
            marks: 1,
            answer: 1.75,
            accepted: ["7/4", "1 3/4", "1.75"],
            explanation:
              "Use the improper fraction: 7/3 × 3/4 = 21/12. Both 21 and 12 divide by three, so 21/12 = 7/4. Seven quarters is one whole and three quarters, written 1 3/4. The three in the numerator and the three in the denominator cancel before multiplying, which is the same simplification done earlier.",
          },
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A baker has 4 cups of flour and each loaf needs 2/3 of a cup. A pupil works out 4 × 2/3 = 8/3 and says they can bake two and a bit loaves. Give the correct number of loaves and explain which operation the question actually asked for.",
      whyItTransfers:
        "The learner has to decide whether the situation is a part-of or a how-many-fit question, then choose the operation that matches. The arithmetic in both readings is easy; the reading is the concept, and it is invisible in a bare calculation.",
      answer:
        "Six loaves, because 4 ÷ 2/3 = 4 × 3/2 = 12/2 = 6: the question asks how many two-thirds fit into four cups, so it is a division. Multiplying gives the amount of flour used by two and two thirds loaves, which is the wrong direction — it answers how much, not how many.",
      marking: [
        "Gives 6 loaves.",
        "Writes the division 4 ÷ 2/3 and evaluates it, or counts two-thirds up to four.",
        "Explains that multiplication would answer how much flour is used, not how many loaves fit.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Work out 1/4 + 1/8.",
      answer: "3/8, because one quarter is two eighths and one eighth more makes three.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Work out 3/5 × 5/6.",
      answer: "1/2, because fifteen thirtieths simplifies to one half.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Work out 5/6 − 1/3, and explain why sixths are a useful common denominator.",
      answer:
        "1/2. One third is two sixths, and five sixths minus two sixths is three sixths, which simplifies to one half. Sixths work because the existing denominator is already a multiple of three.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt: "Convert 3 2/5 to an improper fraction, then multiply it by 5/17 and simplify.",
      answer:
        "3 2/5 = 17/5. Multiplying by 5/17 gives 85/85, which is 1. Converting first exposed the common factor 17 and 5.",
      when: "month-later",
    },
  ],

  summary: [
    "A denominator names the size of a part and a numerator counts those parts.",
    "Counts can be added or subtracted only when the sizes match, so rewrite to a common denominator first.",
    "Multiplying fractions is finding a part of a part, so the answer is smaller than either fraction.",
    "Dividing asks how many of the divisor fit, which is why inverting the divisor and multiplying gives the same count.",
    "A mixed number is a whole plus a fraction; convert it to an improper fraction before adding, subtracting, multiplying or dividing.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each fraction is read as a count and a size in words as well as in notation, so a denominator is never heard as a second number to add.",
    },
    {
      need: "dyslexia",
      alternative:
        "The common denominator step is written as two separate lines before the sum, so the rewriting and the adding are never on one crowded line.",
    },
    {
      need: "motor",
      alternative:
        "The answer can be entered as a numerator and a denominator separately, so no stacked fraction has to be drawn in a single field.",
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
