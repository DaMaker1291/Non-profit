import type { AuthoredLesson } from "../../lesson-contract";

// Foundation batch 4, concept 4 — replacing a number by a near one.
//
// WHY THIS CONCEPT. Rounding is the first place a learner is asked to give a
// DELIBERATELY imprecise answer, and the first place an answer can be wrong for a
// reason that is not arithmetic. Taught as "look at the next digit", it produces
// three habits that survive into GCSE: rounding the wrong place, treating the
// halfway case as a law of nature rather than a convention, and trusting an
// estimate as though it were the exact answer.
export const MATHS_ROUNDING: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "rounding",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: rounding, estimation and approximation",
    level: "Key Stage 2 to Key Stage 3",
    note: "Objective phrased against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Round a whole number to the nearest ten, hundred or thousand, and a decimal to a given number of places.",
      evidence:
        "The learner rounds 47 to 50 and 43 to 40, rounds 396 to 400 at the nearest hundred, and rounds 0.649 to 0.65 at two decimal places, each time naming the column that decided it.",
    },
    {
      statement: "Choose an accuracy that makes an estimate useful for the question being asked.",
      evidence:
        "Asked whether 198 multiplied by 41 could be 81,180, the learner estimates with 200 and 40 to get 8,000 and rejects the answer on size rather than by recomputing it.",
    },
    {
      statement: "Explain why rounding can change the value of a later calculation as well as a single number.",
      evidence:
        "The learner says that rounding both factors before multiplying can move the estimate away from the exact product, so an estimate checks size and does not replace the calculation.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["place-value"],
    check: [
      {
        id: "d1",
        question: "In 4,782, which column does the 7 sit in, and what is it worth?",
        answer: "The hundreds column, so the 7 is worth seven hundred.",
        targets: ["place-value"],
      },
      {
        id: "d2",
        question: "Which column is worth more, the tens or the hundreds?",
        answer: "The hundreds, because each column is ten times the one on its right.",
        targets: ["place-value"],
      },
    ],
  },

  introduction: {
    hook:
      "A stadium announces an attendance of forty-seven thousand. The turnstiles counted 47,832. Nobody is lying and nobody has lost 832 people: the number was replaced by a nearby round one, because the exact figure is not what the announcement is for.",
    why:
      "Rounding replaces a number with the nearest number of a chosen size. The size you choose is the accuracy, and it is chosen for the question, not for the number. Once that is clear, the rule about which digit to look at is a consequence rather than something to memorise, and the halfway case can be seen for the convention it is.",
  },

  explanation: [
    {
      heading: "The place you round to decides which digit looks at which",
      paragraphs: [
        "To round to the nearest ten, the answer has to be a multiple of ten, so the ones digit is the one that must go. Everything depends on how far the number is from the two multiples of ten either side of it: forty-seven sits between forty and fifty, and it is seven away from forty and three away from fifty, so fifty is nearer. The digit in the ones column is not a magic signal; it is a shorthand for that distance.",
        "The same reasoning works at any accuracy. Rounding to the nearest hundred keeps the hundreds and above and clears everything smaller, so the tens digit measures the distance to the two neighbouring hundreds. Rounding to two decimal places keeps two columns after the point and clears the rest, so the third decimal place is the one that measures the distance. In every case, one digit reports the distance and every digit below it is discarded.",
      ],
    },
    {
      heading: "Halfway is a choice, so it has to be agreed",
      paragraphs: [
        "When a number sits exactly halfway between two candidates, neither is nearer and the distance test cannot choose. Something has to be decided by agreement, and the convention in school mathematics is to round up in that case: forty-five to the nearest ten becomes fifty, and 0.65 to one decimal place becomes 0.7. It is worth knowing that this is a convention rather than a fact, because other conventions exist and a calculator may not share the one you were taught.",
        "Because the halfway case is a convention, an answer that sits exactly on it is not evidence of a mistake either way; the working has to say which rule was used. That is also why rounding a list of values and adding them can differ from adding and then rounding: each halfway decision adds a small push in one direction, and enough small pushes in the same direction become visible.",
      ],
    },
    {
      heading: "Rounding cascades, and estimates are not answers",
      paragraphs: [
        "Rounding one digit can force the ones above it to change. Nine point nine six rounded to one decimal place needs the hundredths digit to push the tenths from nine to ten, and a ten in the tenths column carries into the ones, so the answer is ten point zero rather than nine point ten. The carry behaves exactly as it does in whole-number addition, which is why the result can gain a digit.",
        "An estimate made from rounded numbers is a statement about size, not a substitute for the exact value. Two hundred times forty is eight thousand, so an answer of eighty-one thousand is the wrong size and something has gone wrong. But an answer of eight thousand one hundred and eighteen is also consistent with that estimate, and only the exact calculation can tell you whether it is right. The estimate can reject; it cannot confirm.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body: "The same number rounded at three different accuracies, each time to the place named.",
      notation: "47 → 50 (nearest 10) · 396 → 400 (nearest 100) · 0.649 → 0.65 (2 d.p.)",
      caption:
        "The accuracy is chosen first, and it decides which digit measures the distance to the neighbouring values.",
    },
    {
      id: "r2",
      kind: "maths.number-line",
      body: "Forty-seven sitting between the two multiples of ten that could replace it.",
      notation: "40 — 45 — 47 — 50",
      caption:
        "Forty-seven is three from fifty and seven from forty, so it rounds to fifty. The halfway point at forty-five is what the 5 rule refers to.",
    },
    {
      id: "r3",
      kind: "maths.area-model",
      body:
        "Forty-seven counters arranged in rows of ten, with the incomplete row left loose. Rounding to the nearest ten asks whether the loose counters complete another row.",
      notation: "4 tens + 7 loose → 5 tens",
      caption:
        "Seven loose counters are closer to a full row of ten than to an empty row, which is the distance test drawn as a picture.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Round 4,782 to the nearest hundred.",
      steps: [
        {
          move: "Identify the column being rounded to: the hundreds column, where the 7 sits.",
          why:
            "The accuracy names the last column that survives. Everything to its right is discarded, so the columns have to be named before any decision is made.",
        },
        {
          move: "Look at the digit immediately to its right, the tens digit, which is 8.",
          why:
            "That digit reports how far the number is from the two neighbouring hundreds. It is the only digit that can change the answer.",
        },
        {
          move: "Because 8 is five or more, round the hundreds up to 8 and clear the rest, giving 4,800.",
          why:
            "Four thousand seven hundred and eighty-two is nearer to four thousand eight hundred than to four thousand seven hundred, which is what the 8 is telling you.",
        },
      ],
      answer: "4,800",
    },
    {
      id: "w2",
      prompt: "Round 0.649 to two decimal places, and say why the answer needs a third place.",
      steps: [
        {
          move: "Keep two columns after the point, so the hundredths digit is the last one kept.",
          why:
            "Two decimal places means tenths and hundredths. Naming which column survives stops the rounding being applied to the wrong digit.",
        },
        {
          move: "Read the third decimal place, the 9, which is five or more, so the hundredths digit increases by one.",
          why:
            "The 9 measures the distance to the neighbouring hundredths. At nine tenths of the way to the next one, the number is closer to 0.65 than to 0.64.",
        },
        {
          move: "Write the answer as 0.65, with two decimal places and no extra digits.",
          why:
            "Keeping a third place would claim an accuracy the rounding has just removed. The answer states exactly the precision that was asked for.",
        },
      ],
      answer: "0.65",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Always look at the last digit of the number to decide whether to round up.",
      whyItFails:
        "The last digit only measures the distance to the neighbouring values when you are rounding to the column immediately to its left. Rounding 4,782 to the nearest hundred by looking at the 2 gives 4,700, which is eighty-two away from the number, while 4,800 is only eighteen away. The digit that matters is the one just right of the accuracy, not the one at the end.",
      correction:
        "Name the column you are rounding to first, then read the single digit to its right. Everything further right is discarded without being consulted, because it cannot change which neighbouring value is nearer.",
      contrast: {
        wrong: "4,782 to the nearest hundred is 4,700, decided by the final 2",
        right: "4,782 to the nearest hundred is 4,800, decided by the 8 in the tens column",
      },
    },
    {
      id: "m2",
      belief: "An estimate that is close to your answer proves the answer is right.",
      whyItFails:
        "Rounding changes the numbers before the calculation, so an estimate is a statement about size, not a check of digits. Two hundred times forty is eight thousand, and both 8,118 and 7,940 are consistent with it, but at most one of them is the product. The estimate can reject a wrong-sized answer without confirming a right-sized one.",
      correction:
        "Use the estimate to reject answers of the wrong size, then do the exact calculation and check it another way — by a second method or by working backwards. Agreement in size is necessary and not sufficient.",
      contrast: {
        wrong: "198 × 41 ≈ 8,000, so 8,118 must be correct",
        right: "198 × 41 ≈ 8,000, which rules out 81,180 but leaves the digits to the exact calculation",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Round 3,951 to the nearest hundred.",
      hint: "Find the hundreds digit first, then look only at the digit to its right.",
      answer: "4,000, because the tens digit 5 rounds the hundreds up and the carry reaches the thousands",
      feedback: {
        correct: "You followed the carry through, which is where this one usually goes wrong.",
        incorrect: "The hundreds digit is 9; rounding it up makes ten hundreds, which carries into the thousands.",
      },
    },
    {
      id: "p2",
      prompt: "Round 6.487 to two decimal places.",
      hint: "Name the column that survives, then read the digit immediately after it.",
      answer: "6.49, because the third decimal place is 7",
      feedback: {
        correct: "Two places kept, and the third decided it.",
        incorrect: "The hundredths digit is 8 and the next digit is 7, so the hundredths round up to 9.",
      },
    },
    {
      id: "p3",
      prompt: "Estimate 397 multiplied by 21, and say whether 8,337 is a plausible answer.",
      hint: "Round both numbers to the nearest hundred and ten before multiplying.",
      answer: "About 8,000, so 8,337 is plausible but the estimate cannot confirm it",
      feedback: {
        correct: "You used the estimate for what it can do and no more.",
        incorrect: "Four hundred times twenty is eight thousand: an answer near eight thousand is plausible, not proven.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Round 0.649 to two decimal places.",
      modelAnswer: "0.65",
      marking: [
        "Keeps exactly two decimal places in the answer.",
        "Rounds the hundredths up because the third decimal place is 9.",
      ],
      check: { accepted: ["0.65", ".65", "0.650"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner rounds 4,782 to the nearest hundred and writes 4,700, explaining that the last digit is a 2 so the number rounds down. Explain what has gone wrong.",
      modelAnswer:
        "They looked at the last digit rather than at the digit immediately right of the hundreds column. Rounding to the nearest hundred keeps the hundreds and clears the tens and ones, so the tens digit, which is 8, decides: 4,782 is eighteen from 4,800 and eighty-two from 4,700, so 4,800 is nearer. The 2 is discarded and never consulted.",
      marking: [
        "Identifies that the wrong digit was used to decide.",
        "Names the tens digit as the one that reports the distance.",
        "Gives 4,800 and supports it with the distances to each neighbouring hundred.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A charity reports that 12,847 people attended an event, and a newspaper prints 'about 13,000'. A second paper prints 'about 12,800'. Both are rounded from the same count. Explain what accuracy each paper chose, and which is more useful to a reader deciding whether the event filled a 13,000-seat stadium.",
      whyItTransfers:
        "The learner has to choose an accuracy for a purpose rather than for a number, and to justify one rounding as more useful than another. That judgement is the skill, and it is not visible in a rounding exercise.",
      answer:
        "The first paper rounded to the nearest thousand and the second to the nearest hundred. For the stadium question the nearest thousand is more useful, because the comparison is against a capacity of about thirteen thousand and 13,000 answers it directly.",
      marking: [
        "Names the accuracy each paper used.",
        "Connects the choice of accuracy to the question the reader is asking.",
        "Justifies one choice rather than declaring both equally good.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Round 47 to the nearest ten.",
      answer: "50, because it is three from fifty and seven from forty.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Round 9.96 to one decimal place.",
      answer: "10.0, because rounding the tenths up carries into the ones.",
      when: "month-later",
    },
  ],

  summary: [
    "Rounding replaces a number by the nearest number of a chosen size; the size is the accuracy.",
    "The digit immediately right of the accuracy measures the distance; every digit below it is discarded.",
    "Exactly halfway is a convention, not a fact, so the rule used has to be stated.",
    "An estimate can reject a wrong-sized answer, and cannot confirm a right-sized one.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The rounded column and the deciding digit are announced by name, so the decision is available without seeing which digit is adjacent.",
    },
    {
      need: "dyslexia",
      alternative:
        "Numbers are shown with column headings and the deciding digit is boxed, so the position being read is visible rather than inferred.",
    },
    {
      need: "colour-vision",
      alternative:
        "The deciding digit is marked with a box and a label, never by colour alone.",
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
