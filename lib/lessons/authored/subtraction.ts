import type { AuthoredLesson } from "../../lesson-contract";

// Foundation batch 4, concept 3 — taking one amount from another.
//
// WHY THIS CONCEPT NEXT. Subtraction is the first place a learner meets an
// exchange in the other direction: a column that cannot be reduced borrows a ten
// from its neighbour. Taught as "borrow" with no account of what is borrowed, it
// produces the classic error of taking the smaller digit from the larger in each
// column, which is a rule about digits rather than a calculation about amounts.
export const MATHS_SUBTRACTION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "subtraction",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: subtraction and written methods",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Subtract one whole number from another with a written method, exchanging a ten when a column cannot be reduced.",
      evidence:
        "The learner works out 63 minus 28 as 35 and shows the exchanged ten in the ones column, rather than reversing the digits to avoid the exchange.",
    },
    {
      statement: "Say what subtraction answers, and choose between taking away and finding the difference.",
      evidence:
        "The learner answers a 'how many left' question and a 'how far apart' question with the same calculation, and says which reading the question asked for.",
    },
    {
      statement: "Check a subtraction by adding the answer back, and by estimating first.",
      evidence:
        "The learner checks 300 minus 47 as 253 by adding 253 and 47, and rejects an answer larger than the starting amount.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["place-value"],
    check: [
      {
        id: "d1",
        question: "In 63, what is the 6 worth and what is the 3 worth?",
        answer: "The 6 is worth sixty and the 3 is worth three, because of their columns.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "If you take one ten apart into ones, how many ones have you made?",
        answer: "Ten ones, because one ten is ten ones written in one symbol.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "A jar holds 63 marbles. Forty of them are red and twenty-three are blue. Working out how many are not blue can be done by counting back, and working out how many more red than blue can be done from the same two numbers: subtraction answers both questions.",
    why:
      "Subtraction is the inverse of addition, which is why it can be checked by adding back. The written method mirrors the addition method with one new move: when a column does not hold enough to take away from, one of the next column's tens is exchanged for ten ones. Nothing is created or destroyed, and the amount is unchanged.",
  },

  explanation: [
    {
      heading: "Two questions, one calculation",
      paragraphs: [
        "Sixty-three take away twenty-three asks how much is left when one amount is removed from another. The number of red marbles is found that way. Sixty-three minus forty asks something slightly different: how much further apart are the two amounts, which here is twenty-three, and is the same calculation with the parts named the other way round.",
        "Both readings give the same answer because subtraction counts the gap between two amounts. That is why a 'how many more' question and a 'how many left' question can share a calculation, and why the difference is the more general way to read the operation. Choosing the reading is the step that tells you whether the answer needs a unit, a sign or a comparison.",
      ],
    },
    {
      heading: "Exchanging is the reverse of carrying",
      paragraphs: [
        "In sixty-three minus twenty-eight, the ones column holds three and needs to lose eight. Rather than reversing the digits, one of the six tens is exchanged for ten ones: the tens column drops to five and the ones column becomes thirteen. Thirteen take away eight is five, and five tens take away two tens is three, so the answer is thirty-five.",
        "The exchange is legal because a ten and ten ones are the same amount written differently, exactly as in addition. What changes is the form, not the total. The figure recorded above the column is a note of the exchange, so a reader can see where the extra ten came from rather than having to trust it.",
        "When the column you need to exchange from is itself empty, the exchange has to be made one column further left first. Three hundred take away forty-seven has no tens to borrow, so a hundred becomes ten tens, and then one of those tens becomes ten ones. Doing the two exchanges in that order is what keeps the amount unchanged while making each column large enough to reduce.",
      ],
    },
    {
      heading: "The answer is checkable, because the operation has an inverse",
      paragraphs: [
        "Because subtraction undoes addition, adding the answer back must return the number you started with. Two hundred and fifty-three plus forty-seven is three hundred, so the subtraction is correct. A check that does not return the start is not a nitpick: it is evidence that something in the working is wrong.",
        "Estimation checks the other direction. Three hundred minus fifty is two hundred and fifty, so an answer near two hundred and fifty is the right size, and an answer of three hundred and forty-seven is impossible because taking away cannot make a number larger. Direction and size together catch nearly every slip before it reaches a reader.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "The written subtraction, with one ten exchanged for ten ones.",
      notation: "63 − 28 = 35",
      caption:
        "Thirteen ones take away eight leaves five; five tens take away two leaves three. The exchange is the only new move.",
    },
    {
      id: "r2",
      kind: "maths.area-model",
      body:
        "Base-ten blocks for sixty-three, with one rod broken into ten cubes so that eight cubes can be removed.",
      notation: "5 tens + 13 ones  −  2 tens + 8 ones  =  3 tens + 5 ones",
      caption:
        "The picture shows the exchange: a rod becomes ten cubes, so the tens count falls by one and the ones count rises by ten.",
    },
    {
      id: "r3",
      kind: "maths.number-line",
      body: "Two ways to find the same answer on the line.",
      notation: "28 → 35 → 63",
      caption:
        "Counting on from twenty-eight to sixty-three is the same as taking twenty-eight from sixty-three: subtraction measures the gap.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Work out 300 minus 47.",
      steps: [
        {
          move: "Write the numbers by column: three hundreds, zero tens, zero ones, take away four tens and seven ones.",
          why:
            "The columns have to be visible before you can see that this sum needs more than one exchange. Writing it out is how the shortage appears.",
        },
        {
          move: "The ones column cannot lose seven, and the tens column is empty, so exchange a hundred for ten tens first.",
          why:
            "An exchange can only take from a column that has something in it. Dealing with the empty tens column before the ones column is what makes the second exchange possible.",
        },
        {
          move: "Exchange one of those tens for ten ones, then subtract: ten ones minus seven is three.",
          why:
            "After the first exchange the tens column holds ten; taking one of them leaves nine tens and ten ones. Now the ones column can be reduced and the amount is still three hundred.",
        },
        {
          move: "Subtract the tens, nine minus four, and read the answer as 253.",
          why:
            "Nine tens take away four tens leaves five tens. The answer is smaller than three hundred, which is the direction the estimate demanded.",
        },
      ],
      answer: "253",
    },
    {
      id: "w2",
      prompt: "Work out 63 minus 28, then check the answer.",
      steps: [
        {
          move: "Exchange one ten for ten ones, so the ones column holds thirteen and the tens column holds five.",
          why:
            "Three ones cannot lose eight. Exchanging keeps the total at sixty-three while making the ones column large enough to be reduced.",
        },
        {
          move: "Subtract the ones and the tens: thirteen minus eight is five, and five minus two is three.",
          why:
            "Each column is now large enough, so the subtraction is a direct one in both columns and no further exchange is needed.",
        },
        {
          move: "Check by adding 35 and 28 to get 63, the number you started with.",
          why:
            "The check returns the number you started with, which is exactly what the inverse relationship promises. A wrong answer usually fails this step.",
        },
      ],
      answer: "35",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "In each column, take the smaller digit from the larger one, whoever is on top.",
      whyItFails:
        "That rule makes the answer independent of which number is being subtracted, so 63 minus 28 and 28 minus 63 come out the same. Subtraction is not commutative: the order names which amount is being removed, and reversing it changes the answer's meaning and its sign.",
      correction:
        "When a column cannot be reduced, exchange one from the next column left rather than reversing the digits. Thirteen ones minus eight is five, and the exchange leaves five tens to subtract from.",
      contrast: {
        wrong: "63 − 28 = 45, by taking 3 from 8 in the ones column",
        right: "63 − 28 = 35, by exchanging a ten for ten ones",
      },
    },
    {
      id: "m2",
      belief: "Subtracting makes a number bigger when you count on, so an answer larger than the starting number is possible.",
      whyItFails:
        "Counting on is a method for finding the gap, not a second subtraction that adds. The gap between two numbers can never exceed the larger of them, so an answer bigger than the number you started with is not a near miss: it is impossible.",
      correction:
        "Estimate before calculating: 300 take away about 50 is about 250, so the answer must sit below 300. If the result is larger than the start, the columns were added rather than subtracted.",
      contrast: {
        wrong: "300 − 47 = 347, because 300 and 47 were combined",
        right: "300 − 47 = 253, which is below 300 as taking away must be",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Work out 52 minus 37.",
      hint: "The ones column cannot lose seven. Decide what to exchange before subtracting anything.",
      answer: "15, because one ten is exchanged to make twelve ones",
      feedback: {
        correct: "The exchange came first, so both columns could be subtracted directly.",
        incorrect: "Twelve ones minus seven is five, and four tens minus three is one: the answer is fifteen.",
      },
    },
    {
      id: "p2",
      prompt: "A shop has 250 boxes and sells 76. Roughly how many are left, and is 326 a possible answer?",
      hint: "Round both numbers, then think about which direction the answer should move.",
      answer: "About 170, so 326 is impossible: selling boxes cannot leave more than you had",
      feedback: {
        correct: "The estimate ruled out an answer that no subtraction could produce.",
        incorrect: "Two hundred and fifty take away about eighty is about one hundred and seventy, not three hundred and twenty-six.",
      },
    },
    {
      id: "p3",
      prompt: "Check whether 81 minus 46 equals 35 by adding back.",
      hint: "Add the answer to the number being subtracted.",
      answer: "Yes: 35 plus 46 is 81, so the subtraction is correct",
      feedback: {
        correct: "Adding back returned the starting number, which is what the check is for.",
        incorrect: "Thirty-five plus forty-six is eighty-one, not eighty-five: recheck the tens column.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Work out 300 minus 47.",
      modelAnswer: "253",
      marking: [
        "Exchanges a hundred for ten tens before the ones column is reduced.",
        "Gives an answer below three hundred, as taking away must.",
      ],
      check: { accepted: ["253"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner works out 63 minus 28 and writes 45, explaining that they took 3 from 8 in the ones column. Explain what has gone wrong and what the correct answer is, referring to the amounts rather than to a rule.",
      modelAnswer:
        "Taking 3 from 8 has reversed the subtraction in that column, which makes the answer the same whichever number is on top, so it cannot be right. Three ones cannot lose eight, so one of the six tens is exchanged for ten ones: the tens column falls to five and the ones column becomes thirteen. Thirteen minus eight is five, five tens minus two tens is three tens, and the answer is 35. Adding 35 and 28 returns 63, which checks it.",
      marking: [
        "Identifies that reversing the digits in a column changes which amount is being subtracted.",
        "Describes the exchange of one ten for ten ones, with the tens count falling by one.",
        "Gives 35 and supports it with an addition check.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Two towns are 147 km apart. A driver has covered 89 km. Work out how much of the journey remains, and explain why counting on from 89 gives the same answer as taking 89 from 147.",
      whyItTransfers:
        "The question is phrased as remaining distance rather than as a subtraction, and it asks the learner to justify the method rather than only produce the number. Choosing the reading of the operation is the transferable act.",
      answer:
        "58 km remain. Counting on from 89 to 147 passes through 100 and then 47 more, so the gap is 58; taking 89 from 147 removes the same distance, so both methods measure the same gap.",
      marking: [
        "Gives 58 km.",
        "Explains that both methods measure the gap between the two amounts.",
        "Shows the counting-on steps or the written subtraction consistently.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Work out 74 minus 38.",
      answer: "36, because exchanging a ten makes fourteen ones and fourteen minus eight is six.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What must be added to 47 to make 100?",
      answer: "53, because 47 plus 53 is 100.",
      when: "week-later",
    },
  ],

  summary: [
    "Subtraction finds what is left or how far apart two amounts are; both readings use the same calculation.",
    "When a column cannot be reduced, exchange one from the next column left for ten of the current column.",
    "Subtraction is not commutative: the order names which amount is removed.",
    "Add the answer back to check, and estimate first to reject impossible sizes.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The exchanged column is announced with both its before and after values, so the change of form is heard rather than inferred from a floating figure.",
    },
    {
      need: "dyslexia",
      alternative:
        "Columns are ruled and labelled, and the exchange is shown as a struck-through ten with ten ones written in the column beside it.",
    },
    {
      need: "colour-vision",
      alternative:
        "Exchanged amounts are marked by shape and label, never by a change of colour alone.",
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
