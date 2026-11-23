import { defineGapLesson } from "./_gap-lesson";

// MATHS GAP BATCH 4 — sets, money and measurement error.

export const MATHS_SETS_VENN = defineGapLesson({
  conceptId: "sets-venn",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, probability and set notation: union, intersection and complement",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for sets, Venn diagrams and probability. The survey examples are original.",
  },
  objectives: [
    {
      statement:
        "Use union, intersection and complement notation to describe the regions of a two-set Venn diagram.",
      evidence:
        "For A = {1, 2, 3, 4, 5} and B = {4, 5, 6, 7}, the learner lists A ∪ B with seven elements and A ∩ B with two.",
    },
    {
      statement:
        "Apply the addition rule P(A ∪ B) = P(A) + P(B) − P(A ∩ B) and explain why the overlap is subtracted.",
      evidence:
        "For a survey with 18 football, 12 tennis and 5 both, the learner computes the number in either as 25 and the number in neither as 5.",
    },
    {
      statement:
        "Translate a word problem into a Venn diagram and use the completed regions to answer a counting or probability question.",
      evidence:
        "The learner fills the four regions from the total and the overlap, then answers a question about “only one” rather than “either”.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["probability-basics"],
    check: [
      {
        id: "d1",
        question: "What is the probability of an event that is certain?",
        answer: "1, because every possible outcome is in the event.",
        targets: ["probability-basics"],
      },
      {
        id: "d2",
        question: "If two events cannot happen together, how do you find the probability of either?",
        answer:
          "Add their probabilities, because there is no overlap to subtract.",
        targets: ["probability-basics"],
      },
    ],
  },
  introduction: {
    hook:
      "A survey asks 30 pupils whether they play football or tennis. Eighteen play football, twelve play tennis, and five play both. Adding 18 and 12 gives 30, which would suggest nobody plays neither. But the five who play both have been counted twice. The correct count in at least one sport is 25, leaving five pupils outside both. A Venn diagram makes the double count visible.",
    why:
      "Set notation is compact, but the compactness can hide the decision that matters: whether an element belongs to one set, the other, both or neither. The addition rule is not a formula to memorise; it is what happens when two lists overlap. This lesson builds the diagram from the overlap outward, so the arithmetic follows the regions rather than guessing which numbers to add or subtract.",
  },
  explanation: [
    {
      heading: "The four regions of a two-set diagram",
      paragraphs: [
        "Two sets divide the universal set into four regions: only A, only B, both, and neither. The union A ∪ B contains the first three; the intersection A ∩ B is the middle region; the complement of A is everything outside the A circle, including the neither region. A number written in a region belongs to exactly that combination, so the regions must not overlap in the diagram's meaning.",
        "The “both” region is the one that causes double counting. If you add the number in A to the number in B, each member of the overlap is counted twice. Subtracting the overlap once repairs the count. This is the addition rule in words: count A, count B, then remove the duplication.",
      ],
    },
    {
      heading: "Build from the overlap outward",
      paragraphs: [
        "When a problem gives the overlap, fill it first. Then subtract it from each set's total to get the “only” regions. Finally, subtract the three inside regions from the universal total to get “neither”. Filling in this order avoids the common error of putting the full set total in the only region, which counts the overlap twice again.",
        "When the problem does not give the overlap, use the total and the neither count to find it. Let x be the overlap; the union is the sum of the set totals minus x, and the universal total is the union plus neither. Solving that equation is the same region logic with one unknown.",
      ],
    },
    {
      heading: "“Either” and “only one” are different questions",
      paragraphs: [
        "“Plays football or tennis” usually means the union, including those who play both. “Plays only football” excludes the overlap. A question can turn on that word, and a correct diagram can still produce a wrong answer if the region is misread. Underline the exact phrase before selecting a region.",
        "Probability follows the same regions. If a pupil is chosen at random, the probability of the union is the number in the union divided by the universal total. The complement's probability is one minus the event's probability, which is often faster than counting the outside region directly. The diagram and the probability rule should agree, and a mismatch usually means a region was filled from the wrong total. Checking the regions sum to the universal total catches that error immediately.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The union counts everything in either set; the intersection counts only the shared elements. The addition rule subtracts the shared part once.",
      notation: "n(A ∪ B) = n(A) + n(B) − n(A ∩ B)",
      caption:
        "For A = {1, 2, 3, 4, 5} and B = {4, 5, 6, 7}, 5 + 4 − 2 = 7. The union has seven elements.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The complement of A is everything outside A. Its probability is one minus the probability of A.",
      notation: "P(A′) = 1 − P(A)",
      caption:
        "If 25 of 30 pupils play at least one of the two sports, the probability of neither is 5/30, which is also 1 − 25/30.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "The four regions are only A, only B, both and neither. Filling the overlap first makes the other regions follow by subtraction.",
      notation: "football only = 18 − 5 = 13; tennis only = 12 − 5 = 7; both = 5; neither = 30 − 25 = 5",
      caption:
        "The union is 13 + 5 + 7 = 25. Adding 18 and 12 without subtracting the 5 would count the overlap twice.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A = {1, 2, 3, 4, 5} and B = {4, 5, 6, 7}. Find A ∪ B, A ∩ B and the number in neither if the universal set is {1, 2, 3, 4, 5, 6, 7, 8}.",
      steps: [
        {
          move: "List the shared elements: A ∩ B = {4, 5}, so the intersection has two elements.",
          why:
            "The intersection contains elements that appear in both sets. Listing it first makes the double count visible.",
        },
        {
          move: "Combine the sets without repeating the shared elements: A ∪ B = {1, 2, 3, 4, 5, 6, 7}, seven elements.",
          why:
            "The union contains each element once, even if it belongs to both sets. Repeating 4 and 5 would overcount the union.",
        },
        {
          move: "The universal set has 8, and the union has 7, so one element, 8, is in neither.",
          why:
            "The neither region is the complement of the union. It is found by subtracting the union from the universal total.",
        },
      ],
      answer: "A ∪ B has 7 elements, A ∩ B has 2, and 1 element is in neither.",
    },
    {
      id: "w2",
      prompt:
        "In a class of 30, 18 play football, 12 play tennis and 5 play both. How many play at least one, and how many play neither?",
      steps: [
        {
          move: "Put 5 in the both region, then subtract: football only = 18 − 5 = 13 and tennis only = 12 − 5 = 7.",
          why:
            "The set totals include the overlap. Subtracting it once gives the regions that belong to only one set.",
        },
        {
          move: "Add the three inside regions: 13 + 5 + 7 = 25 play at least one.",
          why:
            "The union is the sum of the disjoint regions. Adding 18 and 12 directly would count the five twice and give 30.",
        },
        {
          move: "Subtract from the class total: 30 − 25 = 5 play neither.",
          why:
            "The neither region is outside both circles. It is not part of either set total.",
        },
      ],
      answer: "25 play at least one sport and 5 play neither.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The number in A ∪ B is always n(A) + n(B).",
      whyItFails:
        "That sum counts every element in the overlap twice. If five pupils play both sports, adding 18 and 12 counts those five twice, producing 30 instead of 25. The union needs the overlap subtracted once.",
      correction:
        "Use n(A ∪ B) = n(A) + n(B) − n(A ∩ B). If the overlap is unknown, fill the Venn regions or solve for it using the total.",
      contrast: {
        wrong: "18 + 12 = 30 play at least one.",
        right: "18 + 12 − 5 = 25 play at least one.",
      },
    },
    {
      id: "m2",
      belief: "“A or B” means only A or only B, never both.",
      whyItFails:
        "In set notation, “or” is inclusive unless the question says “exclusive”. A ∪ B includes the intersection. A pupil who plays both still plays football or tennis, so excluding them undercounts the union.",
      correction:
        "Read “or” as “at least one” and “only” as the exclusive region. If the question means one but not both, it will usually say “only one” or “exactly one”.",
      contrast: {
        wrong: "Football or tennis means 13 + 7 = 20.",
        right: "Football or tennis includes both, so 13 + 7 + 5 = 25.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "If n(A) = 10, n(B) = 7 and n(A ∩ B) = 3, what is n(A ∪ B)?",
      hint: "Add the set sizes and subtract the overlap once.",
      answer: "10 + 7 − 3 = 14.",
      feedback: {
        correct: "You removed the double count.",
        incorrect:
          "Adding 10 and 7 counts the three shared elements twice. Subtracting 3 gives 14.",
      },
    },
    {
      id: "p2",
      prompt:
        "In a survey, 20 like tea, 15 like coffee and 8 like both. How many like at least one?",
      hint: "Use the addition rule with the overlap.",
      answer: "20 + 15 − 8 = 27.",
      feedback: {
        correct: "You subtracted the overlap once from the sum.",
        incorrect:
          "The overlap is counted in both totals, so 20 + 15 − 8 = 27 like at least one.",
      },
    },
    {
      id: "p3",
      prompt:
        "A class of 25 has 12 cyclists and 9 swimmers, with 4 who do both. How many do neither?",
      hint: "Find the union first, then subtract from 25.",
      answer: "Union = 12 + 9 − 4 = 17, so 25 − 17 = 8 do neither.",
      feedback: {
        correct: "You found the union before using the class total.",
        incorrect:
          "The union is 17. The neither group is 25 − 17 = 8, not 25 − 12 − 9.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A = {1, 2, 3, 4, 5} and B = {4, 5, 6, 7}. How many elements are in A ∪ B?",
      modelAnswer: "7",
      marking: [
        "Combines the sets without repeating 4 and 5.",
        "Counts the seven distinct elements.",
      ],
      check: { accepted: ["7", "seven"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Using the same sets, how many elements are in A ∩ B?",
      modelAnswer: "2",
      marking: [
        "Identifies the shared elements 4 and 5.",
        "Counts two elements rather than the four elements of A or B alone.",
      ],
      check: { accepted: ["2", "two"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why n(A ∪ B) = n(A) + n(B) − n(A ∩ B). Use a survey with an overlap to support your explanation.",
      modelAnswer:
        "Adding n(A) and n(B) counts every element in the intersection twice, once as a member of A and once as a member of B. Subtracting n(A ∩ B) once removes the duplicate. In a class where 18 play football, 12 play tennis and 5 play both, 18 + 12 − 5 = 25 play at least one, not 30.",
      marking: [
        "Explains the double count of the intersection.",
        "Subtracts the intersection once to correct it.",
        "Supports the rule with a numerical survey example.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A school surveys 120 pupils about two clubs. 70 join chess, 45 join coding, and 20 join neither. Find the number who join both, then the probability that a randomly chosen pupil joins exactly one club.",
      whyItTransfers:
        "The lesson builds a diagram from a known overlap. This survey gives the neither count instead, so the learner must solve for the overlap and then distinguish “exactly one” from the union.",
      answer:
        "The union is 120 − 20 = 100. Let x be the overlap; 70 + 45 − x = 100, so x = 15 join both. Exactly one is (70 − 15) + (45 − 15) = 40 + 30 = 70, so the probability is 70/120 = 7/12.",
      marking: [
        "Subtracts the neither count to find the union.",
        "Solves for the overlap using the addition rule.",
        "Computes exactly one, not the union, and divides by the universal total.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does A ∩ B contain?",
      answer: "The elements that belong to both A and B.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "How is the complement of A written and what does it contain?",
      answer:
        "A′ contains everything in the universal set that is not in A.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why is the overlap subtracted in the addition rule?",
      answer:
        "It is counted once in each set total, so subtracting it once removes the duplicate.",
      when: "month-later",
    },
  ],
  summary: [
    "A two-set Venn diagram has four regions: only A, only B, both and neither.",
    "The union counts everything in either set; the intersection counts only the shared elements.",
    "n(A ∪ B) = n(A) + n(B) − n(A ∩ B) removes the double count.",
    "“Either” includes both; “only one” excludes the overlap.",
  ],
});

export const MATHS_FINANCIAL_MATHS = defineGapLesson({
  conceptId: "financial-maths",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, finance: simple and compound interest, depreciation and loans",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for percentages, interest and financial mathematics. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Distinguish simple from compound interest and compute both over several periods.",
      evidence:
        "For £500 at 4% for three years, the learner computes £560 simple and £562.43 compound, explaining the difference.",
    },
    {
      statement:
        "Use a multiplier for depreciation and compare the result with a linear subtraction.",
      evidence:
        "For a £12,000 car losing 15% per year, the learner computes 12000 × 0.85³ ≈ £7,369.50 after three years.",
    },
    {
      statement:
        "Compare two financial offers by computing their total cost rather than comparing headline rates.",
      evidence:
        "The learner compares a lower rate with a fee against a higher rate without a fee and states the assumption about the repayment period.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["percentages", "growth-decay"],
    check: [
      {
        id: "d1",
        question: "What is 15% of £80?",
        answer: "£12, because 0.15 × 80 = 12.",
        targets: ["percentages"],
      },
      {
        id: "d2",
        question: "What multiplier represents a 15% decrease?",
        answer: "0.85, because 85% of the amount remains.",
        targets: ["growth-decay"],
      },
    ],
  },
  introduction: {
    hook:
      "Two savings accounts both advertise 4%. One pays simple interest, the other compound. After one year they are identical. After ten years the compound account is ahead, and the gap keeps growing because it pays interest on interest. The headline rate is the same; the structure of the calculation is not.",
    why:
      "Financial mathematics is percentage change with a time dimension. The key decisions are whether the rate applies to the original amount or the current balance, whether the rate is annual or monthly, and whether fees are paid once or repeatedly. This lesson computes both interest types, applies the same multiplier logic to depreciation, and compares offers by total cost. The arithmetic is simple; the assumptions are where the money is.",
  },
  explanation: [
    {
      heading: "Simple interest uses the original amount every time",
      paragraphs: [
        "Simple interest pays a fixed percentage of the principal each period. For £500 at 4% for three years, each year pays £20, so the total interest is £60 and the balance is £560. The calculation is linear: principal × rate × number of years. The interest does not earn interest because it is not added to the base for the next calculation.",
        "Simple interest is useful for short-term loans and as a comparison, but most savings and loans compound. The difference is small at first and grows with time. A three-year comparison may look almost identical; a thirty-year comparison does not. The reason is that the interest itself becomes part of the base, so the growth is proportional to the growing balance rather than to a fixed principal.",
      ],
    },
    {
      heading: "Compound interest applies the rate to the current balance",
      paragraphs: [
        "Compound interest adds the interest to the balance before the next period, so the next percentage is taken from a larger amount. The multiplier is 1 + r, and after n periods the balance is P(1 + r)ⁿ. For £500 at 4% for three years, 500 × 1.04³ = £562.43. The extra £2.43 over simple interest is interest on the first two years' interest.",
        "The compounding period must match the rate. A nominal annual rate compounded monthly uses r/12 for each month and 12n periods. That is not the same as applying the annual rate once. The difference is the effective annual rate, which is the number a saver should compare across accounts.",
      ],
    },
    {
      heading: "Depreciation and loans are the same structure",
      paragraphs: [
        "Depreciation is repeated percentage decrease, so the multiplier is below one. A car losing 15% per year retains 85%, and after three years its value is 12000 × 0.85³ ≈ £7,369.50. Subtracting 15% of the original each year would overstate the value, because the later losses are taken from a smaller base.",
        "A loan repayment splits each payment between interest and principal. Early payments are mostly interest because the balance is large; later payments reduce the principal faster. Comparing offers by monthly payment alone can hide a longer term or a large final payment. The honest comparison is total amount repaid, including fees, over the same period. That total is the number that leaves the borrower's account, so it is the fairest single figure for a like-for-like choice.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Simple interest is linear in time because the same principal is used each period.",
      notation: "I = P × r × t; A = P + I",
      caption:
        "For P = 500, r = 0.04 and t = 3, the interest is £60 and the amount is £560.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Compound interest multiplies the current balance by the same factor each period. The exponent counts periods.",
      notation: "A = P(1 + r)ⁿ",
      caption:
        "For the same £500 at 4% for three years, 500 × 1.04³ = £562.43. The extra comes from interest on earlier interest.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "Depreciation uses a multiplier below one. The value falls quickly at first and then more slowly in absolute terms, but never reaches zero in the model.",
      notation: "V = 12000 × 0.85ᵗ; after 3 years V ≈ 7369.50",
      caption:
        "The car loses 15% of its current value each year, not 15% of the original £12,000. The difference grows with time.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Find the simple interest on £500 at 4% per year for three years.",
      steps: [
        {
          move: "Convert the rate to a decimal: 4% = 0.04.",
          why:
            "A percentage is a fraction of 100. Using 4 instead of 0.04 would multiply the interest by 100.",
        },
        {
          move: "Multiply principal × rate × time: 500 × 0.04 × 3 = 60.",
          why:
            "Simple interest takes the same percentage of the original principal each year, so the annual interest is constant.",
        },
        {
          move: "Add the interest to the principal: 500 + 60 = 560.",
          why:
            "The question asks for the amount, not only the interest. The balance is £560 after three years.",
        },
      ],
      answer: "£60 interest, so the amount is £560.",
    },
    {
      id: "w2",
      prompt: "Find the compound amount on £500 at 4% per year for three years.",
      steps: [
        {
          move: "Write the annual multiplier: 1 + 0.04 = 1.04.",
          why:
            "Each year's balance is 104% of the previous balance. The multiplier applies to the current amount, not the original.",
        },
        {
          move: "Raise the multiplier to the third power: 1.04³ ≈ 1.124864.",
          why:
            "Three years means three multiplications. The exponent counts periods, not the interest rate.",
        },
        {
          move: "Multiply by the principal: 500 × 1.124864 = 562.432, which is £562.43.",
          why:
            "The result is £2.43 more than simple interest because the interest earns interest in later years.",
        },
      ],
      answer: "£562.43 after three years.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Compound interest is just simple interest plus 4% of the interest.",
      whyItFails:
        "That description misses the recursion: each year's interest is added to the balance, and the next year's percentage applies to the new balance. The extra is not a fixed 4% of the first year's interest; it grows because the base grows.",
      correction:
        "Use the multiplier 1.04 for each year and raise it to the number of years. Compare the result with simple interest to see the compounding effect.",
      contrast: {
        wrong: "Add 4% of £20 each year to the simple interest.",
        right: "Multiply the whole balance by 1.04 each year.",
      },
    },
    {
      id: "m2",
      belief: "A 15% annual depreciation means subtracting 15% of the original price every year.",
      whyItFails:
        "Depreciation applies to the current value, which is smaller each year. Subtracting 15% of the original £12,000 every year removes £1,800 each time and reaches zero after fewer than seven years, while the percentage model never reaches zero in finite time.",
      correction:
        "Use the multiplier 0.85 each year. The absolute loss shrinks as the value shrinks, which is why the curve flattens.",
      contrast: {
        wrong: "£12,000 − 3 × £1,800 = £6,600",
        right: "£12,000 × 0.85³ ≈ £7,369.50",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Find the simple interest on £800 at 3% for four years.",
      hint: "Use P × r × t with the rate as a decimal.",
      answer: "800 × 0.03 × 4 = £96.",
      feedback: {
        correct: "You kept the principal fixed and multiplied by the number of years.",
        incorrect:
          "The annual interest is 0.03 × 800 = £24; over four years that is £96, not £24.",
      },
    },
    {
      id: "p2",
      prompt: "Find the compound amount on £800 at 3% for four years.",
      hint: "Raise the compound multiplier 1.03 to the fourth power and multiply by 800.",
      answer: "800 × 1.03⁴ ≈ £900.41.",
      feedback: {
        correct: "You raised the multiplier to the number of years.",
        incorrect:
          "The multiplier is 1.03 and the exponent is 4, giving about £900.41. Adding four separate 3% amounts to the original would be simple interest.",
      },
    },
    {
      id: "p3",
      prompt: "A £12,000 car loses 15% of its value each year. What is it worth after three years?",
      hint: "Use 12000 × 0.85³, not 12000 − 3 × 1800.",
      answer: "12000 × 0.614125 ≈ £7,369.50.",
      feedback: {
        correct: "You applied the percentage to the current value each year.",
        incorrect:
          "The multiplier is 0.85 for each year. Three years gives about £7,369.50, which is higher than subtracting three fixed £1,800 losses.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is the amount after simple interest on £500 at 4% for three years?",
      modelAnswer: "560",
      marking: [
        "Computes the annual interest as £20.",
        "Adds three years of interest to the principal.",
      ],
      check: { accepted: ["560", "£560", "560 pounds"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the amount after compound interest on £500 at 4% for three years, to the nearest penny?",
      modelAnswer: "562.43",
      marking: [
        "Uses the multiplier 1.04 raised to 3.",
        "Rounds to two decimal places.",
      ],
      check: { accepted: ["562.43", "£562.43", "562.43 pounds"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why compound interest eventually grows faster than simple interest, using the £500 at 4% example. State what happens to the gap over time.",
      modelAnswer:
        "Simple interest pays 4% of the original £500 each year, so it adds £20 every year. Compound interest adds the interest to the balance, so the next 4% is taken from a larger amount. After three years the compound amount is £562.43 against £560 simple, a gap of £2.43. The gap grows each year because the interest itself begins to earn interest.",
      marking: [
        "Explains that simple interest uses the original principal.",
        "Explains that compound interest uses the current balance.",
        "Uses the numerical example and states that the gap grows over time.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A £9,000 loan is offered at 6% annual simple interest over 4 years, or 5.5% compound over 4 years with a £150 arrangement fee. Compare the total repayments and explain which is cheaper, stating one assumption.",
      whyItTransfers:
        "The lesson computes interest in isolation. The loan adds a fee and two different structures, so the learner must compute total cost rather than compare headline rates and must state an assumption about repayment timing.",
      answer:
        "Simple: interest = 9000 × 0.06 × 4 = £2,160, total £11,160. Compound: 9000 × 1.055⁴ ≈ £11,154.77, plus the £150 fee gives about £11,304.77. The simple-interest loan is cheaper by about £144.77. The comparison assumes no repayments are made until the end and the fee is paid upfront.",
      marking: [
        "Computes simple interest on the original principal.",
        "Computes compound interest with 1.055⁴ and adds the fee.",
        "Compares totals and states the repayment assumption.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the difference between simple and compound interest?",
      answer:
        "Simple interest is calculated on the original principal; compound interest is calculated on the current balance including earlier interest.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What multiplier represents 15% depreciation?",
      answer: "0.85, because 85% of the current value remains.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why should loan offers be compared by total repayment?",
      answer:
        "A lower monthly payment can hide a longer term or a large final payment; total repayment including fees shows the actual cost.",
      when: "month-later",
    },
  ],
  summary: [
    "Simple interest uses the original principal each period; compound interest uses the current balance.",
    "Use A = P(1 + r)ⁿ for compound growth and P(1 + r × t) for simple interest.",
    "Depreciation is repeated percentage decrease with a multiplier below one.",
    "Compare financial offers by total cost, including fees and the repayment period.",
  ],
});

export const MATHS_BOUNDS = defineGapLesson({
  conceptId: "bounds",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, number: upper and lower bounds and error intervals",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for rounding and bounds. The measurements and examples are original.",
  },
  objectives: [
    {
      statement:
        "Write the error interval for a value rounded to a given accuracy and identify its upper and lower bounds.",
      evidence:
        "For 12 rounded to the nearest whole number, the learner writes 11.5 ≤ x < 12.5 and names both bounds.",
    },
    {
      statement:
        "Calculate the bounds of a sum, difference, product or quotient using the correct combination of bounds.",
      evidence:
        "For a rectangle measured to the nearest centimetre, the learner uses lower × lower for the minimum area and upper × upper for the maximum.",
    },
    {
      statement:
        "Explain why a calculated value should be reported with its error interval rather than as a single exact number.",
      evidence:
        "The learner states that a measurement rounded to 1 decimal place represents a range and that calculations inherit that uncertainty.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["rounding"],
    check: [
      {
        id: "d1",
        question: "What is 7.46 rounded to one decimal place?",
        answer:
          "7.5, because the hundredths digit 6 rounds the tenths digit up.",
        targets: ["rounding"],
      },
      {
        id: "d2",
        question: "What does “to the nearest whole number” mean?",
        answer:
          "The true value lies within half a unit of the reported whole number, so the interval has width one.",
        targets: ["rounding"],
      },
    ],
  },
  introduction: {
    hook:
      "A table is measured as 120 cm to the nearest centimetre. Its true length is not exactly 120; it could be 119.6 or 120.3. If the width is also rounded, the area calculated from the two rounded values has a range. Reporting “area = 7,200 cm²” as if it were exact hides that range, and in engineering the range can decide whether a part fits.",
    why:
      "Bounds are the arithmetic of uncertainty. Every rounded measurement stands for an interval, and calculations combine those intervals. The combination rules are not arbitrary: a maximum product uses both upper bounds because both factors can be at their largest, while a minimum difference uses the lower bound of the first and the upper bound of the second. This lesson derives the rules from the interval rather than listing them as formulas to memorise.",
  },
  explanation: [
    {
      heading: "A rounded value represents an interval",
      paragraphs: [
        "Rounding to the nearest whole number means the true value is within 0.5 of the reported value. A report of 12 therefore represents 11.5 ≤ x < 12.5. The lower bound is included and the upper bound is not, because a value exactly 12.5 would round up to 13. The half-unit width comes from the rounding precision, not from the number of digits in the report.",
        "For one decimal place, the half-unit is 0.05: 3.6 represents 3.55 ≤ x < 3.65. For two decimal places, it is 0.005. The pattern is half of the place value of the last reported digit. Writing the interval first makes the later calculation a question about ranges, not a hunt for a formula.",
      ],
    },
    {
      heading: "Combine bounds according to the operation",
      paragraphs: [
        "For a sum, the maximum uses both upper bounds and the minimum uses both lower bounds. For a difference, the maximum uses the upper bound of the first minus the lower bound of the second; the minimum reverses that. Subtraction is where learners often add the wrong pair, because the operation's direction matters.",
        "For a product, the maximum uses upper × upper and the minimum uses lower × lower when both quantities are positive. For a quotient, the maximum uses the upper bound of the numerator divided by the lower bound of the denominator, and the minimum uses the lower numerator over the upper denominator. These rules follow from choosing the values that make the result as large or small as possible within the intervals.",
      ],
    },
    {
      heading: "Report the interval, not a false precision",
      paragraphs: [
        "A calculated value cannot be more precise than the measurements that produced it. If the sides are known only to the nearest centimetre, an area reported to five decimal places suggests an accuracy the data does not support. The honest report is the central estimate with its bounds, or a suitably rounded value with the interval stated separately.",
        "Bounds also reveal when a claim is unsafe. If a component's minimum length is below a required threshold, the measurement does not prove it fits, even if the central estimate is above the threshold. The decision should use the bound that matters, not the rounded number that looks convenient. That is the practical reason tolerance is part of the drawing, not an afterthought.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The error interval is centred on the reported value and extends half a unit of the last place in each direction.",
      notation: "12 rounded to nearest whole: 11.5 ≤ x < 12.5",
      caption:
        "The lower bound is 11.5 and the upper bound is 12.5. The upper bound is excluded because 12.5 would round to 13.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "For a difference, the maximum reverses the combination: the larger first value minus the smaller second value.",
      notation: "max(a − b) = a_upper − b_lower; min(a − b) = a_lower − b_upper",
      caption:
        "If a is between 7 and 8 and b is between 2 and 3, the difference ranges from 4 to 6, not from 5 to 5.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "For a product of positive quantities, the maximum uses both upper bounds and the minimum uses both lower bounds.",
      notation: "max(ab) = a_upper × b_upper; min(ab) = a_lower × b_lower",
      caption:
        "A 5 cm by 4 cm rectangle measured to the nearest centimetre has area between 4.5 × 3.5 = 15.75 and 5.5 × 4.5 = 24.75 cm².",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A length is 12 cm to the nearest centimetre. Write its error interval and state the lower and upper bounds.",
      steps: [
        {
          move: "The rounding precision is one whole centimetre, so half a unit is 0.5 cm.",
          why:
            "The nearest whole number changes at the half-unit point. That half-unit is the maximum distance between the true value and the report.",
        },
        {
          move: "Subtract and add 0.5: the lower bound is 11.5 and the upper bound is 12.5.",
          why:
            "The interval is centred on 12. A value below 11.5 would round to 11; a value of 12.5 or more would round to 13.",
        },
        {
          move: "Write 11.5 ≤ x < 12.5, with the upper bound excluded.",
          why:
            "The strict inequality matters at the boundary because 12.5 rounds up. The interval has width 1 cm.",
        },
      ],
      answer: "11.5 ≤ x < 12.5; lower bound 11.5 cm, upper bound 12.5 cm.",
    },
    {
      id: "w2",
      prompt:
        "A square has side 5.0 cm to one decimal place. Find the lower and upper bounds of its perimeter.",
      steps: [
        {
          move: "The half-unit for one decimal place is 0.05, so the side is between 4.95 and 5.05 cm.",
          why:
            "The last reported digit is the tenths place; half of 0.1 is 0.05. The true side lies in that interval.",
        },
        {
          move: "The minimum perimeter uses the lower side four times: 4 × 4.95 = 19.8 cm.",
          why:
            "All four sides are the same measured length, so the smallest possible perimeter uses the smallest possible side.",
        },
        {
          move: "The maximum uses 4 × 5.05 = 20.2 cm, so the perimeter is between 19.8 and 20.2 cm.",
          why:
            "The upper bound is the largest possible perimeter. Reporting 20 cm alone would hide the range.",
        },
      ],
      answer: "The perimeter is between 19.8 cm and 20.2 cm.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The upper bound of 12 rounded to the nearest whole number is 12.4.",
      whyItFails:
        "The rounding boundary is halfway to the next whole number, which is 12.5. A value of 12.4 still rounds to 12; a value of 12.5 rounds to 13. Using 12.4 excludes valid measurements between 12.4 and 12.5.",
      correction:
        "Take half of the place value of the last reported digit and add it to the reported value. For whole numbers the half-unit is 0.5.",
      contrast: {
        wrong: "11.6 ≤ x ≤ 12.4",
        right: "11.5 ≤ x < 12.5",
      },
    },
    {
      id: "m2",
      belief: "To find the maximum of a difference, subtract the upper bound from the upper bound.",
      whyItFails:
        "Upper minus upper can be smaller than other combinations. To make a difference as large as possible, the first quantity must be as large as possible and the second as small as possible. The combination is upper minus lower, not upper minus upper.",
      correction:
        "Think about the direction of the operation: addition pushes both bounds the same way; subtraction reverses the second. For a difference, use upper − lower for the maximum.",
      contrast: {
        wrong: "max(a − b) = a_upper − b_upper",
        right: "max(a − b) = a_upper − b_lower",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Write the error interval for 3.6 rounded to one decimal place.",
      hint: "Half of 0.1 is 0.05.",
      answer: "3.55 ≤ x < 3.65.",
      feedback: {
        correct: "You used half the place value of the last digit.",
        incorrect:
          "The last digit is tenths, so the half-unit is 0.05. The interval is 3.55 to 3.65, with the upper bound excluded.",
      },
    },
    {
      id: "p2",
      prompt:
        "A length is 8 cm to the nearest centimetre. What are its lower and upper bounds?",
      hint: "Subtract and add half a centimetre.",
      answer: "7.5 cm and 8.5 cm.",
      feedback: {
        correct: "You centred the interval on the reported value.",
        incorrect:
          "The half-unit is 0.5 cm, so the bounds are 7.5 and 8.5, not 7 and 9.",
      },
    },
    {
      id: "p3",
      prompt:
        "A rectangle is 5 cm by 4 cm, each measured to the nearest centimetre. Find the minimum possible area.",
      hint: "The minimum area uses both lower bounds.",
      answer: "4.5 × 3.5 = 15.75 cm².",
      feedback: {
        correct: "You multiplied the two lower bounds for the minimum.",
        incorrect:
          "The lower bounds are 4.5 and 3.5, so the minimum area is 15.75 cm², not 20 cm².",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is the upper bound of 12 rounded to the nearest whole number?",
      modelAnswer: "12.5",
      marking: [
        "Adds half a unit to the reported value.",
        "Recognises that the upper bound is excluded.",
      ],
      check: { accepted: ["12.5", "12.5 cm", "12.5 centimetres"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the lower bound of 12 rounded to the nearest whole number?",
      modelAnswer: "11.5",
      marking: [
        "Subtracts half a unit from the reported value.",
        "Includes the lower boundary in the interval.",
      ],
      check: { accepted: ["11.5", "11.5 cm", "11.5 centimetres"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why the maximum of a difference uses the upper bound of the first quantity and the lower bound of the second, while the maximum of a sum uses both upper bounds.",
      modelAnswer:
        "A sum is largest when both contributions are as large as possible, so both upper bounds are used. A difference is largest when the quantity being subtracted is as small as possible, because subtracting a smaller amount leaves more. Therefore the maximum difference is the upper bound of the first minus the lower bound of the second. For example, 8 minus 3 is larger than 8 minus 5.",
      marking: [
        "Explains that both terms of a sum push the result in the same direction.",
        "Explains that subtracting a smaller amount makes a difference larger.",
        "Gives a numerical comparison that supports the rule.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A metal rod must be at least 50.0 cm long. A supplier reports lengths as 50 cm to the nearest centimetre. Can the supplier guarantee that every rod meets the requirement? Explain using bounds and state what additional information would settle it.",
      whyItTransfers:
        "The lesson computes bounds from a rounded value. The supplier adds a threshold and a guarantee, so the learner must compare the lower bound with the requirement rather than the rounded report.",
      answer:
        "No. A report of 50 cm to the nearest centimetre represents 49.5 ≤ x < 50.5, so a rod could be 49.6 cm and fail the 50.0 cm requirement. The lower bound is below the threshold, so the rounded report cannot guarantee compliance. A measurement with a smaller error interval, or a guaranteed minimum length, would be needed.",
      marking: [
        "Writes the error interval 49.5 ≤ x < 50.5.",
        "Compares the lower bound with the 50.0 cm requirement.",
        "States that a tighter measurement or a guaranteed minimum would settle it.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the error interval for 7 rounded to the nearest whole number?",
      answer: "6.5 ≤ x < 7.5.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Which bounds give the maximum of a product of two positive quantities?",
      answer: "The product of both upper bounds.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why is an upper bound often excluded from an error interval?",
      answer:
        "A value exactly at the upper bound would round to the next value up, so it belongs to the next interval.",
      when: "month-later",
    },
  ],
  summary: [
    "A rounded value represents an interval of half a unit of the last reported place on each side.",
    "For a sum, use both upper bounds for the maximum and both lower bounds for the minimum.",
    "For a difference, use upper minus lower for the maximum and lower minus upper for the minimum.",
    "Report calculated values with their error interval rather than implying false precision.",
  ],
});
