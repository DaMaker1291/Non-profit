import { defineGapLesson } from "./_gap-lesson";

// MATHS GAP BATCH 2 — modelling, repeated change and the first calculus idea.

export const MATHS_MIXTURE_PROBLEMS = defineGapLesson({
  conceptId: "mixture-problems",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: forming and solving equations from word problems",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE mathematics subject content for modelling and linear equations. The contexts and examples are original.",
  },
  objectives: [
    {
      statement:
        "Define an unknown in words and translate each phrase of a problem into an operation before solving.",
      evidence:
        "For “three more than twice a number is 17”, the learner writes 2x + 3 = 17 and states that x is the number, not the answer.",
    },
    {
      statement:
        "Solve a mixture problem by expressing the amount of a component before and after a change.",
      evidence:
        "The learner sets up 6 + x = 0.5(20 + x) for 20 litres of 30% juice with x litres of pure juice added, and solves x = 8.",
    },
    {
      statement:
        "Check a solution against the original story and reject a value that is impossible in context.",
      evidence:
        "The learner substitutes the value back into the sentence and rejects a negative length or a fractional number of people.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["linear-equations", "ratio"],
    check: [
      {
        id: "d1",
        question: "Solve 3x + 5 = 20.",
        answer:
          "Subtract 5 from both sides to get 3x = 15, then divide by 3 to get x = 5.",
        targets: ["linear-equations"],
      },
      {
        id: "d2",
        question: "What does a ratio of 2 : 3 tell you about two amounts?",
        answer:
          "For every 2 parts of the first amount there are 3 parts of the second; the total has 5 equal parts.",
        targets: ["ratio"],
      },
    ],
  },
  introduction: {
    hook:
      "A café mixes 20 litres of juice that is 30% concentrate with x litres of pure concentrate. The new mixture is 50% concentrate. The story contains no equation, but the sentence “the amount of concentrate is half the new total” is an equation waiting to be written. The difficulty is not the algebra; it is deciding what x means and which quantities must balance.",
    why:
      "Word problems fail for a predictable reason: the learner starts manipulating numbers before defining the unknown. This lesson makes the translation explicit. It names the variable, writes the amount of the important component in the old and new mixture, and only then solves. The final step returns to the story, because an algebraically correct value can still be a nonsensical amount.",
  },
  explanation: [
    {
      heading: "Define the unknown before writing symbols",
      paragraphs: [
        "“Three more than twice a number is 17” contains three operations in a fixed order: double the number, add three, and the result is 17. Writing 2x + 3 = 17 preserves that order. Writing 2(x + 3) = 17 doubles the wrong quantity. The variable should be defined in words first — “let x be the number” — so the expression can be checked against the sentence.",
        "The equals sign marks a relationship, not a command to calculate. Everything to the left describes one quantity, everything to the right another, and the equation says they are the same. That is why the same problem can produce different-looking correct equations; they are different descriptions of the same balance.",
      ],
    },
    {
      heading: "Mixtures are conserved quantities",
      paragraphs: [
        "In a mixture problem, track the component that is being changed. If 20 litres is 30% concentrate, it contains 6 litres of concentrate. Adding x litres of pure concentrate adds x to both the concentrate and the total. The new concentration is (6 + x) / (20 + x). Setting that equal to 0.5 gives an equation about the final state, not about the amount added.",
        "Percentages must be converted to amounts before they can be added. Adding 30% and 50% as if they were ordinary numbers ignores the different volumes. The component equation — concentrate before plus concentrate added equals concentrate after — is the reliable structure. The same idea handles alloy, salt and paint mixtures.",
      ],
    },
    {
      heading: "The answer must survive the story",
      paragraphs: [
        "A solution can satisfy the equation and still be impossible. A negative time, a negative length or 2.5 people cannot be the answer to a real question. Substituting back into the original sentence is the check: does the resulting statement make sense, and does it answer what was asked rather than only the variable?",
        "Sometimes the equation gives two solutions and the context selects one. A quadratic model of a thrown object may have a negative time root; the positive root is the physical one. Rejecting a root is not ignoring mathematics; it is applying the domain the story supplies. Writing the domain down before solving makes that choice deliberate rather than an afterthought, and it stops a plausible-looking number from being reported as a real quantity.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The sentence is translated operation by operation. The variable is the number, and the left side is the result of doubling it and adding three.",
      notation: "2x + 3 = 17",
      caption:
        "Solving gives x = 7. The answer to the question “what is the number?” is 7, not 17.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The mixture equation balances the concentrate. The left side is the amount after adding x litres of pure juice; the right side is half of the new total.",
      notation: "6 + x = 0.5(20 + x)",
      caption:
        "Solving gives x = 8 litres. Substituting back gives 14 litres of concentrate in 28 litres, which is 50%.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "A work-rate problem adds rates, not times. If one painter finishes in 4 hours and another in 6, their combined rate is the sum of the fractions of the job done per hour.",
      notation: "1/4 + 1/6 = 5/12 job per hour, so the time is 12/5 = 2.4 hours",
      caption:
        "Adding 4 and 6 would give 10 hours, which is longer than either painter alone. Rates add; times do not.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Three more than twice a number is 17. Find the number and check it in the original sentence.",
      steps: [
        {
          move: "Let x be the number, then twice the number is 2x and three more is 2x + 3.",
          why:
            "The order of operations in the sentence is double first, then add. The expression must preserve that order.",
        },
        {
          move: "Set 2x + 3 = 17, subtract 3 to get 2x = 14, then divide by 2.",
          why:
            "The equation is a balance. Subtracting the same amount from both sides isolates the term containing x.",
        },
        {
          move: "x = 7. Check: twice 7 is 14, and three more is 17.",
          why:
            "The check substitutes back into the original words, not just the simplified equation. It confirms both the value and the translation.",
        },
      ],
      answer: "The number is 7.",
    },
    {
      id: "w2",
      prompt:
        "Twenty litres of juice is 30% concentrate. How much pure concentrate must be added to make the mixture 50% concentrate?",
      steps: [
        {
          move: "The original concentrate is 30% of 20, which is 6 litres. Let x be the litres of pure concentrate added.",
          why:
            "The component is measured in litres, not percentage points. Defining x as litres keeps the units consistent.",
        },
        {
          move: "After adding, concentrate is 6 + x and total volume is 20 + x, so 6 + x = 0.5(20 + x).",
          why:
            "The new concentration is the new concentrate divided by the new total. Setting it to 50% gives the equation.",
        },
        {
          move: "Solve: 6 + x = 10 + 0.5x, so 0.5x = 4 and x = 8 litres.",
          why:
            "Subtracting 0.5x from both sides collects the variable. The result is positive and smaller than the original volume, which is plausible.",
        },
        {
          move: "Check: 6 + 8 = 14 litres of concentrate in 28 litres total, which is 50%.",
          why:
            "The check uses the new totals, not the old concentration. It confirms the answer satisfies the final state described in the question.",
        },
      ],
      answer: "8 litres of pure concentrate.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "“Three more than twice a number” means 2(x + 3).",
      whyItFails:
        "2(x + 3) doubles the number and also doubles the three, giving 2x + 6. The sentence says double the number first, then add three, which is 2x + 3. At x = 7 the two expressions give 17 and 20, so the difference is visible.",
      correction:
        "Translate the sentence in the order it is written, then test with a small value. If the expression gives a different result from the words, the grouping is wrong.",
      contrast: {
        wrong: "2(x + 3) = 17",
        right: "2x + 3 = 17",
      },
    },
    {
      id: "m2",
      belief: "Adding 20 litres of 30% juice to 20 litres of 50% juice gives 80% juice.",
      whyItFails:
        "Percentages are not amounts that can be added directly. The first container has 6 litres of concentrate and the second has 10; together they have 16 litres in 40 litres, which is 40%, not 80%. The concentration of a mixture lies between the concentrations mixed, never above both.",
      correction:
        "Convert each percentage to an amount using its own total, add the amounts and the totals separately, then divide. Check that the result lies between the two starting concentrations.",
      contrast: {
        wrong: "30% + 50% = 80%",
        right: "6 + 10 = 16 litres in 40, so the mixture is 40%",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Five less than three times a number is 16. Write an equation and solve it.",
      hint: "Triple the number first, then subtract five.",
      answer: "3x − 5 = 16, so 3x = 21 and x = 7.",
      feedback: {
        correct: "You preserved the order: multiply first, then subtract.",
        incorrect:
          "The expression is 3x − 5, not 3(x − 5). Adding 5 gives 3x = 21, so x = 7.",
      },
    },
    {
      id: "p2",
      prompt:
        "Ten litres of paint is 20% white. How much pure white paint must be added to make it 50% white?",
      hint: "The original white is 2 litres. After adding x, white is 2 + x and total is 10 + x.",
      answer: "2 + x = 0.5(10 + x), so 2 + x = 5 + 0.5x and x = 6 litres.",
      feedback: {
        correct: "You balanced the white component against half the new total.",
        incorrect:
          "The equation is 2 + x = 0.5(10 + x). Solving gives 0.5x = 3, so x = 6 litres, not 8.",
      },
    },
    {
      id: "p3",
      prompt:
        "One painter takes 4 hours and another takes 6 hours. How long do they take together?",
      hint: "Add their rates as fractions of the job per hour, then take the reciprocal.",
      answer: "1/4 + 1/6 = 5/12 job per hour, so the time is 12/5 = 2.4 hours.",
      feedback: {
        correct: "You added rates and converted back to time.",
        incorrect:
          "Adding 4 and 6 gives 10 hours, which is slower than either painter. Rates add: 1/4 + 1/6 = 5/12, so the job takes 12/5 hours.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Three more than twice a number is 17. What is the number?",
      modelAnswer: "7",
      marking: [
        "Forms 2x + 3 = 17 rather than doubling the sum.",
        "Solves to x = 7 and checks it in the sentence.",
      ],
      check: { accepted: ["7", "seven"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Twenty litres of 30% juice is mixed with pure juice until it is 50%. How many litres of pure juice are added?",
      modelAnswer: "8",
      marking: [
        "Uses 6 litres of concentrate in the original mixture.",
        "Solves 6 + x = 0.5(20 + x) to get x = 8.",
      ],
      check: { accepted: ["8", "8 litres", "eight"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why you must convert percentages to amounts before solving a mixture problem, and why the final answer must be checked against the story rather than only the equation.",
      modelAnswer:
        "A percentage is a fraction of a particular total, so 30% of 20 litres is 6 litres while 30% of 50 litres is 15 litres. Adding percentages directly ignores the different totals. After solving, substitute back into the original quantities: the new concentration must lie between the starting concentrations, and a negative or oversized amount is impossible even if it satisfies the algebra.",
      marking: [
        "Explains that a percentage depends on the total it is taken from.",
        "Converts each percentage to an amount before combining.",
        "Checks the solution's size and meaning in the original context.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A school buys 120 tickets for a trip. Adult tickets cost £9 and child tickets cost £5. The total cost is £760. Find the number of adult and child tickets, and explain why the answer must be checked for whole-number counts.",
      whyItTransfers:
        "The lesson models one unknown and one mixture. The ticket problem has two unknowns and two constraints, so the learner must define both variables and use both the count and the cost equations.",
      answer:
        "Let a be adult tickets and c child tickets. Then a + c = 120 and 9a + 5c = 760. Substituting c = 120 − a gives 9a + 600 − 5a = 760, so 4a = 160 and a = 40; c = 80. Both are whole numbers and non-negative, so the solution is valid.",
      marking: [
        "Defines two variables and writes both the count and cost equations.",
        "Solves the system and gets 40 adults and 80 children.",
        "Checks that both values are non-negative whole numbers.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "Translate “five less than three times a number” into an expression.",
      answer: "3x − 5, because the multiplication happens before the subtraction.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why do work rates add rather than times?",
      answer:
        "Each rate is a fraction of the job done per hour; together they complete the sum of those fractions each hour, so the combined time is the reciprocal.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Give one example of an algebraic solution that must be rejected in context.",
      answer:
        "A negative time or a fractional number of people, because the story's domain requires non-negative or whole values.",
      when: "month-later",
    },
  ],
  summary: [
    "Define the unknown in words before writing an expression, and preserve the order of operations in the sentence.",
    "In a mixture, convert percentages to amounts and balance the component before and after the change.",
    "Rates add; times do not. The combined time is the reciprocal of the sum of the rates.",
    "Check the solution in the original story and reject values outside the context's domain.",
  ],
});

export const MATHS_GROWTH_DECAY = defineGapLesson({
  conceptId: "growth-decay",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, ratio, proportion and rates of change: exponential growth and decay",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for repeated proportional change. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Write repeated percentage change as a multiplier and use a power for n periods.",
      evidence:
        "The learner writes a 4% annual increase as ×1.04 and computes £500 × 1.04³ = £562.43 after three years.",
    },
    {
      statement:
        "Distinguish exponential decay from simple subtraction by using a repeated multiplier below one.",
      evidence:
        "The learner computes 80 g after three half-lives as 80 × (1/2)³ = 10 g rather than 80 − 3 × 40.",
    },
    {
      statement:
        "Interpret doubling time or half-life and use it to compare growth or decay rates.",
      evidence:
        "The learner explains that a quantity with a 20-year half-life is not reduced by the same absolute amount each year.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["indices-intro", "percentages"],
    check: [
      {
        id: "d1",
        question: "What is 1.04³ as a single multiplier?",
        answer:
          "1.04 × 1.04 × 1.04 ≈ 1.124864, so three years of 4% growth is about a 12.49% total increase.",
        targets: ["indices-intro"],
      },
      {
        id: "d2",
        question: "What multiplier represents a 12% decrease?",
        answer:
          "0.88, because the new amount is 100% − 12% = 88% of the old amount.",
        targets: ["percentages"],
      },
    ],
  },
  introduction: {
    hook:
      "A town of 1,200 people grows by 5% each year. After one year it has 1,260; after two, the 5% applies to the larger total, not the original 1,200. The increase itself grows. That is why a graph of the population bends upward rather than following a straight line, and why “5% for ten years” is not the same as “50% in total”.",
    why:
      "Simple interest and compound growth are often conflated because both start with a percentage. The difference is the base: simple change always uses the original amount, while exponential change uses the current amount. A multiplier and a power express that recursion in one expression. This lesson uses compound interest, population and half-life so the same structure is seen in growth and decay.",
  },
  explanation: [
    {
      heading: "A percentage change is a multiplier",
      paragraphs: [
        "Increasing by 5% gives 105% of the old amount, so the multiplier is 1.05. Decreasing by 12% gives 88%, so the multiplier is 0.88. For several periods, multiply repeatedly: after n periods the amount is the starting amount times the multiplier to the power n. The power is not a shorthand for adding percentages; it counts how many times the current amount is multiplied.",
        "The multiplier must match the period. A 5% annual rate applied monthly is not 5% each month. Either convert the rate to the period or convert the time to years. Mixing an annual multiplier with a monthly count is one of the most common errors in finance and science problems.",
      ],
    },
    {
      heading: "Compound growth uses the new total each time",
      paragraphs: [
        "After one year, £500 at 4% becomes £520. The second year's interest is 4% of £520, not 4% of £500. The expression 500 × 1.04² gives 540.80, and 500 × 1.04³ gives 562.43. The extra compared with simple interest is the interest earned on earlier interest.",
        "The same recursion describes population growth, a spreading infection in its early phase and a savings account. The model assumes the rate stays constant and the quantity is unrestricted. Real populations meet limits, and real interest rates change; the exponential expression is a model with assumptions, not a law. Naming those assumptions is part of using the formula responsibly, because a curve that fits the first few years can fail badly once a limiting factor appears.",
      ],
    },
    {
      heading: "Decay is a multiplier below one",
      paragraphs: [
        "A 12% annual decrease is ×0.88 per year. After three years the amount is the start × 0.88³. Half-life is the special case where the multiplier is 1/2 for each fixed time interval: after h years, the remaining fraction is (1/2) raised to t/h. After three half-lives, one eighth remains, not one half minus three halves.",
        "Doubling time is the growth counterpart. If a quantity doubles every d years, after t years the multiplier is 2 raised to t/d. The phrase “doubles every 10 years” contains the same structure as “halves every 10 years”; only the base differs. Recognising that structure lets one formula handle both, and comparing a result with a simple-interest estimate gives a quick check that compounding has not been forgotten.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Repeated proportional change is a starting amount times a multiplier raised to the number of periods.",
      notation: "A = P(1 + r)ⁿ for growth; A = P(1 − r)ⁿ for decay",
      caption:
        "For P = 500, r = 0.04 and n = 3, the amount is 500 × 1.04³ = £562.43. The exponent counts periods, not the percentage.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Half-life uses a multiplier of one half for each interval of h. The exponent is the number of intervals, t divided by h.",
      notation: "A = A₀ × (1/2)^(t/h)",
      caption:
        "For a 20 g sample with a 5-year half-life, after 15 years the exponent is 3, so 20 × (1/2)³ = 2.5 g remains.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "Exponential growth curves upward because the increase is proportional to the current amount. Exponential decay approaches zero without reaching it in the model.",
      notation: "y = 1200 × 1.05ˣ versus y = 1200 + 60x",
      caption:
        "After 10 years the exponential model gives about 1,955, while the linear model gives 1,800. The gap widens because the exponential increase itself grows.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "£500 is invested at 4% compound interest per year. Find the amount after three years, to the nearest penny.",
      steps: [
        {
          move: "Write the annual multiplier as 1.04, because a 4% increase leaves 104% of the amount.",
          why:
            "The multiplier applies to the current balance. Adding 4% of the original each year would be simple interest, not compound interest.",
        },
        {
          move: "Raise the multiplier to the third power for three years: 1.04³.",
          why:
            "Each year multiplies the previous balance, so the same factor is applied three times.",
        },
        {
          move: "Multiply: 500 × 1.04³ = 562.432, which rounds to £562.43.",
          why:
            "The result is larger than 500 + 3 × 20 = 560 because interest is earned on earlier interest. The units are pounds.",
        },
      ],
      answer: "£562.43 after three years.",
    },
    {
      id: "w2",
      prompt:
        "A radioactive sample has a half-life of 5 years. How much of an 80 g sample remains after 15 years?",
      steps: [
        {
          move: "Find the number of half-lives: 15 ÷ 5 = 3.",
          why:
            "The exponent counts intervals of one half-life, not years. Three intervals means the sample is halved three times.",
        },
        {
          move: "Apply the multiplier: 80 × (1/2)³.",
          why:
            "Each half-life multiplies the remaining mass by one half. The process is repeated, not subtracted.",
        },
        {
          move: "Compute 80 × 1/8 = 10, so 10 g remains.",
          why:
            "The result is one eighth of the original, not 80 − 3 × 40. The units are grams.",
        },
      ],
      answer: "10 g remains after 15 years.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "A 5% increase for 10 years is a 50% increase in total.",
      whyItFails:
        "Each year's 5% is taken from a larger balance, so the increases themselves grow. The correct multiplier is 1.05¹⁰ ≈ 1.6289, a 62.89% increase, not 50%. Adding percentages ignores the compounding base.",
      correction:
        "Convert the rate to a multiplier and raise it to the number of periods. Compare with the simple-interest result to see the extra from compounding.",
      contrast: {
        wrong: "5% × 10 = 50% total",
        right: "1.05¹⁰ − 1 ≈ 62.89% total",
      },
    },
    {
      id: "m2",
      belief: "After three half-lives, none of the sample remains.",
      whyItFails:
        "Each half-life removes half of what is left, not a fixed amount. After one half-life 1/2 remains, after two 1/4, after three 1/8. The model approaches zero but never reaches it in a finite number of half-lives.",
      correction:
        "Multiply by 1/2 once per half-life. The remaining fraction after n half-lives is (1/2)ⁿ, which is small but positive.",
      contrast: {
        wrong: "Three half-lives remove everything.",
        right: "Three half-lives leave one eighth of the original mass.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Write a 12% annual decrease as a multiplier.",
      hint: "The new amount is 100% − 12% of the old amount.",
      answer: "0.88, because 88% of the old amount remains.",
      feedback: {
        correct: "You subtracted the percentage from 100% before converting to a decimal.",
        incorrect:
          "A 12% decrease leaves 88%, so the multiplier is 0.88, not 0.12 or 1.12.",
      },
    },
    {
      id: "p2",
      prompt: "A population of 1,200 grows by 5% per year. What is the multiplier after 10 years?",
      hint: "Use 1.05 raised to 10, not 1.05 × 10.",
      answer: "1.05¹⁰ ≈ 1.6289, so the population is about 1,955.",
      feedback: {
        correct: "You raised the multiplier to the number of years.",
        incorrect:
          "The exponent counts years: 1.05¹⁰, not 1.05 × 10. The result is about 1.6289 times the starting population.",
      },
    },
    {
      id: "p3",
      prompt: "A 40 g sample loses half its mass every 8 years. How much remains after 24 years?",
      hint: "24 years is three half-lives.",
      answer: "40 × (1/2)³ = 5 g.",
      feedback: {
        correct: "You counted three half-lives and applied the halving multiplier three times.",
        incorrect:
          "24 ÷ 8 = 3 half-lives. The remaining mass is 40 × 1/8 = 5 g, not 40 − 3 × 20.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "£500 grows at 4% compound interest for three years. What is the amount to the nearest penny?",
      modelAnswer: "562.43",
      marking: [
        "Uses the multiplier 1.04 raised to 3.",
        "Rounds the result to two decimal places and includes the correct magnitude.",
      ],
      check: { accepted: ["562.43", "£562.43", "562.43 pounds"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "An 80 g sample has a half-life of 5 years. How many grams remain after 15 years?",
      modelAnswer: "10",
      marking: [
        "Counts three half-lives in 15 years.",
        "Multiplies 80 by (1/2)³ rather than subtracting a fixed amount.",
      ],
      check: { accepted: ["10", "10 g", "10 grams", "ten"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain the difference between simple interest and compound interest on £500 at 4% for three years. Include both amounts and say why the gap grows with time.",
      modelAnswer:
        "Simple interest pays 4% of the original £500 each year, so the total is 500 + 3 × 20 = £560. Compound interest applies 4% to the current balance, giving 500 × 1.04³ = £562.43. The gap is £2.43 after three years and grows because each year's interest is added to the base for the next year, so later interest is earned on earlier interest.",
      marking: [
        "Computes simple interest as three fixed payments of £20.",
        "Computes compound interest with the multiplier 1.04³.",
        "Explains that the gap grows because interest is earned on earlier interest.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A patient takes 200 mg of a medicine that leaves the body at 15% per hour. A second dose is safe only when less than 40 mg remains. Estimate when the next dose can be taken, and explain why a linear subtraction model would give a different and unsafe answer.",
      whyItTransfers:
        "The lesson uses annual and half-life examples. The medicine adds a safety threshold and an hourly rate, so the learner must solve an inequality with a repeated multiplier and compare it with the wrong linear model.",
      answer:
        "The remaining amount is 200 × 0.85ᵗ. Solve 200 × 0.85ᵗ < 40, so 0.85ᵗ < 0.2. Taking logs gives t > log(0.2)/log(0.85) ≈ 10.2 hours. A linear model subtracting 30 mg per hour would predict about 5.3 hours, but the body removes a percentage of what remains, so the true decay slows and the safe time is later.",
      marking: [
        "Writes the repeated-decay expression with multiplier 0.85.",
        "Solves the inequality using logarithms or systematic trial.",
        "Explains that linear subtraction removes too much early and predicts an unsafe early dose.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What multiplier represents a 9% increase?",
      answer: "1.09, because the new amount is 109% of the old amount.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "After four half-lives, what fraction remains?",
      answer: "One sixteenth, because (1/2)⁴ = 1/16.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why does an exponential growth curve bend upward?",
      answer:
        "The increase is proportional to the current amount, so as the amount grows the increase also grows.",
      when: "month-later",
    },
  ],
  summary: [
    "A percentage change is a multiplier: 1 + r for growth and 1 − r for decay.",
    "Repeated change raises the multiplier to the number of periods; it does not multiply the percentage by the periods.",
    "Half-life and doubling time count intervals, so the exponent is time divided by the interval.",
    "Exponential models assume a constant rate and no limiting factor; state that assumption when applying them.",
  ],
});

export const MATHS_LOGS = defineGapLesson({
  conceptId: "logs",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: logarithms and solving exponential equations",
    level: "Key Stage 5",
    note:
      "Scope cites the published advanced mathematics subject content for logarithms and exponential equations. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Interpret a logarithm as the exponent needed to produce a number and evaluate simple logarithms exactly.",
      evidence:
        "The learner evaluates log₂ 32 = 5 and log₃(1/9) = −2, explaining each as an exponent rather than a division.",
    },
    {
      statement:
        "Use logarithms to solve an exponential equation where the unknown is in the exponent.",
      evidence:
        "For 3ˣ = 20, the learner takes logs of both sides and obtains x = log 20 / log 3 ≈ 2.727.",
    },
    {
      statement:
        "Apply the laws of logarithms to combine or split terms, and state the domain restriction.",
      evidence:
        "The learner writes log a + log b = log(ab) and explains that logarithms are defined only for positive arguments.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["indices-intro", "growth-decay"],
    check: [
      {
        id: "d1",
        question: "What does 2⁵ equal, and what exponent gives 32?",
        answer: "2⁵ = 32, so the exponent that turns 2 into 32 is 5.",
        targets: ["indices-intro"],
      },
      {
        id: "d2",
        question: "Why can an exponential equation not be solved by subtracting the base?",
        answer:
          "The unknown is in the exponent, so the base is raised to an unknown power; inverse operations must undo exponentiation, not addition.",
        targets: ["growth-decay"],
      },
    ],
  },
  introduction: {
    hook:
              "A population doubles every 10 years. How long until it is 20 times its starting size? The equation is 2 to the power t/10 equals 20, and the unknown is in the exponent. Trial and improvement can narrow it, but a logarithm answers it directly: the log tells you what exponent produces a given number. It is the inverse question to “raise this base to a power”.",
    why:
      "Logarithms are often introduced as button presses with no meaning. The meaning is an exponent. Once that is clear, the laws follow from the laws of indices: multiplying powers adds exponents, so adding logs multiplies arguments. This lesson starts with exact powers, moves to the change of base needed for an arbitrary base, and keeps the domain restriction visible because a logarithm of zero or a negative number has no real value.",
  },
  explanation: [
    {
      heading: "A logarithm is an exponent",
      paragraphs: [
        "log₂ 32 asks “what power of 2 gives 32?”. Since 2⁵ = 32, the answer is 5. The base is written small; the argument is the result. log₁₀ 1000 = 3 because 10³ = 1000. A logarithm is not a different kind of number; it is the exponent in a known base.",
        "The definition immediately gives two identities: logₐ 1 = 0 because a⁰ = 1, and logₐ a = 1 because a¹ = a. It also restricts the argument to positive values, because a positive base raised to any real power is positive. Trying to take the log of zero or a negative number is not a hard calculation; it is outside the real domain.",
      ],
    },
    {
      heading: "The laws come from adding exponents",
      paragraphs: [
        "When you multiply powers of the same base, you add the exponents: a to the power m times a to the power n equals a to the power m + n. Taking logs reverses that, so log(ab) = log a + log b. Division subtracts exponents, so log(a/b) = log a − log b. A power moves the exponent to the front: log(aⁿ) = n log a. These are not three unrelated rules; they are the index laws read backwards.",
        "The laws require the same base and positive arguments. log 4 + log 9 = log 36, but log 4 + log₃ 9 is not a single logarithm without changing a base. Combining terms with different bases is a common error because the notation looks similar.",
      ],
    },
    {
      heading: "Taking logs turns an exponent into a factor",
      paragraphs: [
        "To solve 3ˣ = 20, take logarithms of both sides: log(3ˣ) = log 20, so x log 3 = log 20. The unknown is no longer an exponent; it is multiplied by a known number, so divide. The result x = log 20 / log 3 ≈ 2.727 is the same whichever base you use, as long as both sides use the same one.",
        "The change-of-base formula logₐ b = log b / log a is that same division. It lets a calculator with only base-10 or natural logs evaluate any base. The answer should be checked by substitution: 3 to the power 2.727 is about 20, and the exponent lies between 2 (9) and 3 (27), as it must. A logarithm therefore answers a question about time or growth as naturally as it answers a question about exponents.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The definition links a logarithm to the exponent in a power. The base stays the same on both sides.",
      notation: "logₐ b = c  ⇔  aᶜ = b, for a > 0, a ≠ 1, b > 0",
      caption:
        "log₂ 32 = 5 because 2⁵ = 32. The logarithm answers “what exponent?”, not “what root?”.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The product law is the index law for adding exponents, read in reverse. The arguments multiply while the logs add.",
      notation: "logₐ(xy) = logₐ x + logₐ y",
      caption:
        "For x = 4 and y = 8 with base 2, log₂ 4 + log₂ 8 = 2 + 3 = 5, and log₂ 32 = 5. The two sides agree.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "The graph of y = log x is the reflection of y = 10ˣ in the line y = x. It grows without bound but ever more slowly and is undefined at x = 0.",
      notation: "y = log₁₀ x; domain x > 0; y = 0 at x = 1",
      caption:
        "The curve crosses the x-axis at 1 and never touches the y-axis. The vertical asymptote at x = 0 is the domain restriction made visible.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Evaluate log₂ 32 without a calculator.",
      steps: [
        {
          move: "Ask what power of 2 gives 32: 2¹ = 2, 2² = 4, 2³ = 8, 2⁴ = 16, 2⁵ = 32.",
          why:
            "The logarithm is the exponent, so the task is to express 32 as a power of the given base.",
        },
        {
          move: "The exponent is 5, so log₂ 32 = 5.",
          why:
            "The definition says logₐ b = c exactly when aᶜ = b. Substituting 2⁵ = 32 confirms the value.",
        },
      ],
      answer: "log₂ 32 = 5.",
    },
    {
      id: "w2",
      prompt: "Solve 3ˣ = 20, giving the answer to three decimal places.",
      steps: [
        {
          move: "Take logarithms of both sides: log(3ˣ) = log 20.",
          why:
            "Applying the same increasing function to both sides preserves the equality. The logarithm is the inverse that can bring the exponent down.",
        },
        {
          move: "Use the power law: x log 3 = log 20.",
          why:
            "The exponent moves to the front as a multiplier. The unknown is now outside the exponent.",
        },
        {
          move: "Divide: x = log 20 / log 3 ≈ 2.727.",
          why:
            "The result lies between 2 and 3 because 3² = 9 and 3³ = 27. Substituting back gives approximately 20.",
        },
      ],
      answer: "x = log 20 / log 3 ≈ 2.727.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "log(a + b) = log a + log b.",
      whyItFails:
        "The product law applies to multiplication, not addition. Taking a = 10 and b = 90, log(100) = 2, while log 10 + log 90 ≈ 2.954. The two sides differ, so the proposed law is false. There is no simple log law for a sum.",
      correction:
        "Use log(ab) = log a + log b for a product. For a sum, simplify the sum first or leave it as a single logarithm; do not split it.",
      contrast: {
        wrong: "log(10 + 90) = log 10 + log 90",
        right: "log(10 × 90) = log 10 + log 90",
      },
    },
    {
      id: "m2",
      belief: "You can take the logarithm of any number, including zero and negatives.",
      whyItFails:
        "A positive base raised to any real power is always positive, so no real exponent produces zero or a negative result. The real logarithm is defined only for positive arguments. A calculator error is reporting the domain, not a temporary glitch.",
      correction:
        "State the domain x > 0 before solving. If an equation leads to a log of a non-positive value, that branch has no real solution.",
      contrast: {
        wrong: "log(−5) is just a negative logarithm.",
        right: "log(−5) has no real value; the domain is positive arguments only.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Evaluate log₃ 81.",
      hint: "What power of 3 gives 81?",
      answer: "4, because 3⁴ = 81.",
      feedback: {
        correct: "You expressed 81 as a power of the base.",
        incorrect:
          "3⁴ = 81, so the exponent is 4. The logarithm is not 81 divided by 3.",
      },
    },
    {
      id: "p2",
      prompt: "Simplify log 6 + log 5 using one logarithm.",
      hint: "The sum of logs of the same base is the log of the product.",
      answer: "log 30, because 6 × 5 = 30.",
      feedback: {
        correct: "You applied the product law in the forward direction.",
        incorrect:
          "Adding logs multiplies the arguments: log 6 + log 5 = log 30. It does not give log 11.",
      },
    },
    {
      id: "p3",
      prompt: "Solve 2ˣ = 50 to three significant figures.",
      hint: "Take logs of both sides and divide by log 2.",
      answer: "x = log 50 / log 2 ≈ 5.64.",
      feedback: {
        correct: "You brought the exponent down and divided by the log of the base.",
        incorrect:
          "Taking logs gives x log 2 = log 50, so x ≈ 5.64. It lies between 5 (32) and 6 (64), as expected.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is log₂ 32?",
      modelAnswer: "5",
      marking: [
        "Expresses 32 as 2⁵.",
        "Reads the exponent as the logarithm.",
      ],
      check: { accepted: ["5", "five"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is log₃(1/9)?",
      modelAnswer: "−2",
      marking: [
        "Recognises 1/9 as 3⁻².",
        "Reports the negative exponent rather than a positive one.",
      ],
      check: { accepted: ["-2", "−2", "negative two"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why log(ab) = log a + log b, using the index law for multiplying powers. State the domain restriction and give one numerical check.",
      modelAnswer:
        "Write a = 10ᵐ and b = 10ⁿ, so log a = m and log b = n. Then ab = 10ᵐ × 10ⁿ = 10 to the power m + n, so log(ab) = m + n = log a + log b. The arguments must be positive because a positive base raised to a real power is positive. For example, log 4 + log 25 = log 100 = 2, and 4 × 25 = 100.",
      marking: [
        "Writes each argument as a power of the base and adds the exponents.",
        "Connects the added exponents to the sum of the logarithms.",
        "States that the arguments must be positive and supplies a numerical check.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A bacterial culture doubles every 3 hours. Starting with 500 cells, how long until it reaches 20,000? Solve with logarithms and explain why the answer is not 40 × 3 hours.",
      whyItTransfers:
        "The lesson solves bare exponential equations. The culture adds a starting amount and a doubling interval, so the learner must form the model 500 times 2 to the power t/3 equals 20,000 before taking logs.",
      answer:
        "Divide by 500: 2 to the power t/3 equals 40. Take logs: (t/3) log 2 = log 40, so t = 3 log 40 / log 2 ≈ 15.97 hours. The answer is not 40 × 3 because 40 is the factor increase, not the number of doublings; log₂ 40 ≈ 5.32 doublings are needed, and 5.32 × 3 ≈ 15.97 hours.",
      marking: [
        "Forms 500 times 2 to the power t/3 equal to 20,000 and divides by the starting amount.",
        "Takes logarithms and solves for t in hours.",
        "Explains that the factor 40 is not the number of doublings.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is logₐ 1 for any valid base a?",
      answer: "0, because a⁰ = 1.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Write log(a/b) as a difference of logarithms.",
      answer: "log a − log b, for positive a and b.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why is the logarithm of a negative number undefined in the real numbers?",
      answer:
        "A positive base raised to any real exponent is positive, so no real exponent can produce a negative argument.",
      when: "month-later",
    },
  ],
  summary: [
    "A logarithm is the exponent needed to produce a number in a given base.",
    "The product, quotient and power laws are the index laws read in reverse.",
    "Taking logs brings an unknown exponent down as a multiplier, which makes the equation solvable.",
    "Logarithms require positive arguments and a valid base greater than zero but not equal to one.",
  ],
});

export const MATHS_CALCULUS_DIFF = defineGapLesson({
  conceptId: "calculus-diff",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, calculus: differentiation, gradients and stationary points",
    level: "Key Stage 5",
    note:
      "Scope cites the published advanced mathematics subject content for differentiation and its applications. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Differentiate a polynomial using the power rule and evaluate the derivative at a point.",
      evidence:
        "For y = 3x² − 4x + 1, the learner writes dy/dx = 6x − 4 and evaluates the gradient at x = 2 as 8.",
    },
    {
      statement:
        "Find a stationary point by solving the derivative equal to zero and classify it using the second derivative or a sign change.",
      evidence:
        "For y = 3x² − 12x + 5, the learner solves 6x − 12 = 0 to get x = 2 and identifies the point as a minimum.",
    },
    {
      statement:
        "Use differentiation to solve an optimisation problem with a constraint.",
      evidence:
        "For a rectangle with perimeter 20, the learner writes area in one variable, differentiates, and finds the maximum at a square of side 5.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["functions", "indices-intro"],
    check: [
      {
        id: "d1",
        question: "What does f(2) mean for a function f?",
        answer:
          "It means the output of the function when the input is 2, not f multiplied by 2.",
        targets: ["functions"],
      },
      {
        id: "d2",
        question: "Simplify x⁵ divided by x².",
        answer:
          "x³, because dividing powers of the same base subtracts the exponents.",
        targets: ["indices-intro"],
      },
    ],
  },
  introduction: {
    hook:
      "A ball's height is modelled by h = 20t − 5t². Its gradient is not constant: it rises quickly, slows, stops at the top and then falls. Differentiation gives the gradient at any instant. Setting the derivative to zero finds the moment the height stops changing, which is the maximum. A graph can suggest that point; calculus proves it.",
    why:
      "The derivative is often taught as a rule for bringing down a power. The rule is useful, but the idea is a limit: the gradient of a curve at a point is the gradient of the tangent there. This lesson connects the rule to the geometry, then uses stationary points and optimisation. The second derivative is introduced as a classification tool, not as a separate ritual.",
  },
  explanation: [
    {
      heading: "The derivative is the gradient at a point",
      paragraphs: [
        "For a straight line, the gradient is the same everywhere. For a curve, the gradient changes, so “the gradient” only makes sense at a chosen point. The derivative is the limit of the gradient between two nearby points as the gap shrinks. It gives the gradient of the tangent, which is the instantaneous rate of change.",
        "The power rule follows from that limit: the derivative of xⁿ is n times x to the power n − 1 for a constant n. A constant term differentiates to zero because a horizontal line has zero gradient. A constant multiplier stays in front. These rules let a polynomial be differentiated term by term, which is enough for the curves in this lesson.",
      ],
    },
    {
      heading: "Stationary points are where the gradient is zero",
      paragraphs: [
        "At a maximum or minimum, the tangent is horizontal, so the derivative is zero. Solving dy/dx = 0 gives the x-coordinates of the stationary points; substitute back into the original equation for the y-coordinate. A stationary point can also be a point of inflection, where the curve flattens but does not turn, so zero gradient alone does not prove a maximum or minimum.",
        "The second derivative measures how the gradient itself is changing. If the second derivative is positive, the gradient is increasing and the curve is concave up, which makes the stationary point a minimum. If it is negative, the curve is concave down and the point is a maximum. If it is zero, the test is inconclusive and a sign table is needed.",
      ],
    },
    {
      heading: "Optimisation turns a constraint into one variable",
      paragraphs: [
        "An optimisation problem usually has a quantity to maximise or minimise and a constraint linking two variables. Write the quantity in terms of one variable using the constraint, state the valid domain, differentiate and solve. For a rectangle with fixed perimeter 20, the sides are x and 10 − x, so the area is x(10 − x). Differentiating gives 10 − 2x, zero at x = 5, and the second derivative is negative, so it is a maximum.",
        "The domain matters. A length must be positive, so x lies between 0 and 10. A stationary point outside that interval is not a valid answer. The endpoints may also be candidates in a real optimisation problem, so compare the stationary value with the boundary values rather than assuming the derivative found the best case.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The power rule differentiates each term of a polynomial. The exponent becomes a multiplier and then decreases by one.",
      notation: "d/dx (axⁿ) = an x^(n−1); d/dx (constant) = 0",
      caption:
        "For y = 3x² − 4x + 1, the derivative is 6x − 4. The constant 1 disappears because it does not change the gradient.",
    },
    {
      id: "r2",
      kind: "maths.graph",
      body:
        "At a stationary point the tangent is horizontal. The sign of the gradient changes from positive to negative at a maximum and from negative to positive at a minimum.",
      notation: "dy/dx = 0 at x = 2; y = 3x² − 12x + 5 has a minimum at (2, −7)",
      caption:
        "The second derivative is 6, which is positive, so the curve is concave up and the stationary point is a minimum.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A fixed perimeter turns the area into a function of one side. The constraint removes the second variable before differentiation.",
      notation: "P = 2x + 2y = 20 ⇒ y = 10 − x; A = x(10 − x) = 10x − x²",
      caption:
        "Differentiating gives 10 − 2x, so x = 5 and y = 5. The maximum area is 25 square units, attained by a square.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Differentiate y = 3x² − 4x + 1 and find the gradient at x = 2.",
      steps: [
        {
          move: "Differentiate term by term: 3x² becomes 6x, −4x becomes −4, and 1 becomes 0.",
          why:
            "The power rule multiplies by the exponent and reduces it by one. A constant has zero gradient, so it disappears.",
        },
        {
          move: "Write dy/dx = 6x − 4.",
          why:
            "The derivative is a new function that gives the gradient at any x, not a single number.",
        },
        {
          move: "Substitute x = 2: 6(2) − 4 = 8.",
          why:
            "The value 8 is the gradient of the tangent at x = 2. It is positive, so the curve is rising there.",
        },
      ],
      answer: "dy/dx = 6x − 4, and the gradient at x = 2 is 8.",
    },
    {
      id: "w2",
      prompt:
        "Find the stationary point of y = 3x² − 12x + 5 and classify it.",
      steps: [
        {
          move: "Differentiate: dy/dx = 6x − 12.",
          why:
            "The power rule gives 6x from 3x² and −12 from −12x; the constant 5 vanishes.",
        },
        {
          move: "Set the derivative to zero: 6x − 12 = 0, so x = 2.",
          why:
            "A stationary point has a horizontal tangent, which is exactly a zero derivative.",
        },
        {
          move: "Substitute x = 2 into the original: y = 12 − 24 + 5 = −7. The second derivative is 6 > 0, so it is a minimum.",
          why:
            "The y-coordinate belongs to the original curve, not the derivative. A positive second derivative means the gradient is increasing, so the curve turns upward.",
        },
      ],
      answer: "The stationary point is (2, −7), a minimum.",
    },
    {
      id: "w3",
      prompt:
        "A rectangle has perimeter 20 cm. Find the dimensions that maximise its area.",
      steps: [
        {
          move: "Let the sides be x and y. The perimeter gives 2x + 2y = 20, so y = 10 − x.",
          why:
            "The constraint removes one variable. Without it, many rectangles share the same perimeter but have different areas.",
        },
        {
          move: "Write the area A = x(10 − x) = 10x − x², with 0 < x < 10.",
          why:
            "The domain comes from the sides being positive. A stationary point outside this interval would not describe a rectangle.",
        },
        {
          move: "Differentiate: dA/dx = 10 − 2x. Set it to zero to get x = 5, so y = 5 and A = 25.",
          why:
            "The second derivative is −2, which is negative, so the stationary point is a maximum. The square gives the largest area for this perimeter.",
        },
      ],
      answer: "The maximum area is 25 cm² for a 5 cm by 5 cm square.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The derivative of 3x² is 3x, because the 2 is removed.",
      whyItFails:
        "The power rule multiplies by the exponent before reducing it: 3x² becomes 2 × 3x = 6x. Dropping the factor of 2 underestimates the gradient by half. At x = 1 the correct derivative is 6, not 3.",
      correction:
        "Bring the exponent down as a multiplier, then subtract one from the exponent. Check the coefficient before simplifying.",
      contrast: {
        wrong: "d/dx(3x²) = 3x",
        right: "d/dx(3x²) = 6x",
      },
    },
    {
      id: "m2",
      belief: "Every point where the derivative is zero is a maximum or minimum.",
      whyItFails:
        "A point of inflection can also have zero gradient, such as y = x³ at x = 0. The curve flattens there but continues in the same direction. Zero gradient is necessary for a turning point, not sufficient.",
      correction:
        "Check the second derivative or the sign of the gradient on both sides. A sign change identifies a turn; no sign change indicates an inflection.",
      contrast: {
        wrong: "dy/dx = 0, so it must be a minimum.",
        right: "dy/dx = 0, so it is stationary; check the second derivative or sign change to classify it.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Differentiate y = 5x³ − 2x + 7.",
      hint: "Apply the power rule to each term; the constant disappears.",
      answer: "dy/dx = 15x² − 2.",
      feedback: {
        correct: "You multiplied by each exponent and reduced it by one.",
        incorrect:
          "5x³ becomes 15x², −2x becomes −2, and 7 becomes 0. The derivative is 15x² − 2.",
      },
    },
    {
      id: "p2",
      prompt: "Find the stationary point of y = x² − 6x + 4.",
      hint: "Differentiate, set to zero, then substitute back for y.",
      answer: "dy/dx = 2x − 6 = 0 gives x = 3; y = 9 − 18 + 4 = −5, so (3, −5).",
      feedback: {
        correct: "You found the x-coordinate from the derivative and the y from the original.",
        incorrect:
          "The derivative gives x = 3; the y-coordinate comes from the original equation, giving −5. The point is (3, −5).",
      },
    },
    {
      id: "p3",
      prompt:
        "A rectangle has perimeter 24 cm. Write its area as a function of one side and find the maximum.",
      hint: "If the sides are x and 12 − x, the area is x(12 − x).",
      answer: "A = 12x − x², dA/dx = 12 − 2x = 0 gives x = 6, so the maximum area is 36 cm².",
      feedback: {
        correct: "You used the perimeter to eliminate one variable before differentiating.",
        incorrect:
          "The sides are x and 12 − x, so A = 12x − x². The derivative gives x = 6 and A = 36 cm².",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "For y = 3x² − 4x + 1, what is the gradient at x = 2?",
      modelAnswer: "8",
      marking: [
        "Differentiates to 6x − 4.",
        "Substitutes x = 2 to get 8.",
      ],
      check: { accepted: ["8", "eight"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "At what x-coordinate is the stationary point of y = 3x² − 12x + 5?",
      modelAnswer: "2",
      marking: [
        "Differentiates to 6x − 12.",
        "Solves 6x − 12 = 0.",
      ],
      check: { accepted: ["2", "two", "x = 2"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why a zero derivative locates a stationary point but does not by itself prove a maximum or minimum. Use y = x³ at x = 0 as an example.",
      modelAnswer:
        "A zero derivative means the tangent is horizontal, which happens at maxima, minima and points of inflection. For y = x³, dy/dx = 3x², which is zero at x = 0, but the gradient is positive on both sides, so the curve does not turn. The second derivative is also zero there, so a sign table is needed; the point is an inflection, not an extremum.",
      marking: [
        "Defines a stationary point as one with zero gradient.",
        "Explains that a point of inflection can also have zero gradient.",
        "Uses y = x³ to show no sign change and classifies it as an inflection.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A farmer has 60 m of fencing to enclose a rectangular pen against an existing straight wall, so only three sides need fencing. Find the dimensions that maximise the area and compare the result with a four-sided pen of the same perimeter. Explain why the answers differ.",
      whyItTransfers:
        "The lesson optimises a rectangle with a fixed perimeter. The wall removes one side from the constraint, so the learner must rebuild the area function and interpret a different domain rather than reuse the earlier answer.",
      answer:
        "Let the two sides perpendicular to the wall be x and the side parallel be 60 − 2x. Area = x(60 − 2x) = 60x − 2x². dA/dx = 60 − 4x = 0 gives x = 15, so the parallel side is 30 m and the maximum area is 450 m². A four-sided pen with 60 m has a maximum square of 15 m by 15 m, area 225 m². The wall allows the same fencing to cover twice the area because one side is free.",
      marking: [
        "Uses only three fenced sides in the constraint.",
        "Differentiates the correct area function and finds 15 m by 30 m.",
        "Compares 450 m² with the four-sided maximum and explains the wall's effect.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "Differentiate x⁴.",
      answer: "4x³.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What does a positive second derivative tell you about a stationary point?",
      answer:
        "The gradient is increasing, so the curve is concave up and the point is a local minimum.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why does a constant term disappear when differentiating?",
      answer:
        "A constant shifts the graph vertically without changing its gradient, so its rate of change is zero.",
      when: "month-later",
    },
  ],
  summary: [
    "The derivative is the gradient of the tangent at a point, not the gradient of the whole curve.",
    "The power rule multiplies by the exponent and reduces it by one; constants differentiate to zero.",
    "A stationary point has zero gradient; classify it with the second derivative or a sign change.",
    "Optimisation uses the constraint to write the quantity in one variable, then differentiates within the valid domain.",
  ],
});
