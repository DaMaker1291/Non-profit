import type { AuthoredLesson } from "../../lesson-contract";

// PROBABILITY IS A MEASURE ON A SET OF OUTCOMES, NOT A FORMULA TO MATCH.
//
// The reported failures are not arithmetic. They are assumptions: adding
// probabilities of overlapping events and counting the overlap twice, reading
// "mutually exclusive" as "independent", treating "at least one" as "exactly
// one", and applying a repeated-trials formula to draws that are not
// independent. This lesson makes the sample space and its equally-likely
// assumption explicit, derives the addition rule from a Venn count, and derives
// the at-least-one rule from the complement rather than presenting it as a
// formula. The transfer is a diagnostic test, where ignoring the base rate is
// the same error in a setting the lesson never mentions.
export const MATHS_PROBABILITY_BASICS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "probability-basics",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, probability: the probability scale, equally likely outcomes, relative frequency, complementary events, mutually exclusive events, the addition rule, independent events and tree diagrams",
    level: "Key Stage 3 to GCSE Foundation and Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content for probability. The lesson keeps the sample-space assumption explicit, derives the addition rule rather than asking for recall, and separates mutually exclusive from independent. No specification, textbook or commercial lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Construct a sample space, count favourable outcomes, and state the assumption that makes a probability count valid.",
      evidence:
        "For two dice the learner lists the 36 ordered outcomes, finds six ways to make 7 and one way to make 12, and says the count is valid only because the dice are fair and the outcomes are equally likely.",
    },
    {
      statement:
        "Use the complement, the mutually exclusive addition rule and the general addition rule with the intersection, and say which one a situation requires.",
      evidence:
        "The learner computes P(not A) = 1 − P(A), adds 0.3 and 0.5 for mutually exclusive events, and computes 18/30 + 12/30 − 6/30 = 4/5 for two overlapping groups rather than 30/30.",
    },
    {
      statement:
        "Distinguish mutually exclusive from independent, and calculate repeated independent trials and at least one success from the complement.",
      evidence:
        "The learner explains that a heart and a spade cannot both occur while a heart and a king can, computes P(at least one head in three tosses) = 7/8, and does not apply 1 − (1 − p)ⁿ to a draw without replacement.",
    },
  ],

  priorKnowledge: {
    // The genome declares NO prerequisites for probability-basics. The two checks
    // probe skills the lesson uses — a fraction of a whole and a percentage of a
    // count — without claiming a graph edge that does not exist.
    conceptIds: [],
    check: [
      {
        id: "d1",
        question: "A bag has 5 red and 3 green counters. What fraction of the counters is red?",
        answer:
          "5/8. There are 5 + 3 = 8 counters in total and 5 are red, so the fraction is 5/8. The denominator is the whole set, not the number of colours.",
        targets: ["fractions"],
      },
      {
        id: "d2",
        question: "What is 40% of 30?",
        answer:
          "12. Ten per cent of 30 is 3, so 40% is 4 × 3 = 12. Percentages are fractions of 100, and the same 'part of the whole' idea is what a probability records.",
        targets: ["percentages"],
      },
    ],
  },

  introduction: {
    hook:
      "In a group of 30 students, 18 like football, 12 like tennis and 6 like both. How many like at least one? The tempting answer is 18 + 12 = 30, which would leave nobody out. But the 6 students who like both have been counted twice, so the true number is 24, and 6 students like neither. The overlap is not a detail to tidy up at the end; it is the reason the addition rule contains a subtraction. A probability is a measure on a set of outcomes, and the set has to be built before the arithmetic can be trusted.",
    why:
      "Probability looks like a collection of formulas because the formulas are easy to write down. The hard part is deciding which one the situation allows. Three questions decide almost every school probability problem: what are the possible outcomes, and are they equally likely? Do the events overlap? Are the trials independent, or does one change the chances of the next? A fair coin and a biased coin both have two outcomes, but only one has probability 1/2 for heads. Two events can be mutually exclusive, independent, both or neither, and the words are not synonyms. This lesson answers the three questions from the sample space, then uses the answers to choose the rule.",
  },

  explanation: [
    {
      heading: "Outcomes, events and the sample space",
      paragraphs: [
        "An outcome is one result of a trial: a coin lands heads, a die shows 4, a counter drawn from a bag is red. An event is a set of outcomes. 'The die shows an even number' contains three outcomes, {2, 4, 6}, and its probability is the total probability of those outcomes. The sample space is the set of all possible outcomes, listed once each. For one fair die the sample space is {1, 2, 3, 4, 5, 6}; for two dice it is the 36 ordered pairs (1,1), (1,2), …, (6,6), because a 3 then a 5 is a different outcome from a 5 then a 3 even though the total is the same.",
        "For equally likely outcomes, the probability of an event is the number of favourable outcomes divided by the total number of outcomes. Every probability lies between 0 and 1: 0 for an impossible event, 1 for a certain one, and the probabilities of all the outcomes in the sample space sum to 1 because the list contains every possibility exactly once. The equally-likely condition is an assumption, not a fact about the word 'random'. A bag with 3 red and 2 blue counters has two colours but five counters, so P(red) = 3/5, not 1/2. A weighted die has six faces but may not have six equally likely outcomes. Before counting, say what makes the outcomes equally likely — a fair coin, a fair die, a well-mixed bag, a random draw from a complete list.",
      ],
    },
    {
      heading: "Theoretical probability and relative frequency",
      paragraphs: [
        "Theoretical probability comes from the structure of the situation: a fair coin has P(heads) = 1/2 because there are two equally likely outcomes and one is heads. Experimental probability, or relative frequency, comes from what happened: if a coin lands heads 47 times in 100 tosses, the relative frequency is 47/100 = 0.47. The two numbers need not be equal in a finite experiment. A fair coin can produce 47 heads, or 55, without being biased; the variation is the point of running the experiment, not evidence that the model is wrong.",
        "As the number of trials grows, the relative frequency of a fair coin tends to settle near 1/2, but it is never guaranteed to equal it exactly and a run of ten tosses says very little. A result of 7 heads in 10 tosses is unremarkable; 700 in 1000 would be surprising for a fair coin. Experimental probability is an estimate of the underlying probability, not a replacement for it, and a simulation is not an observation of the real world. If a computer simulates 10,000 coin tosses, it shows what the model produces; it does not tell you whether the physical coin in your hand is fair.",
      ],
    },
    {
      heading: "The complement, and the two meanings of 'one'",
      paragraphs: [
        "The complement of an event A is 'A does not happen', written not A. Because an event either happens or does not, P(not A) = 1 − P(A). If P(rain) = 0.35, P(no rain) = 0.65. The rule is useful because the complement is sometimes much easier to count: the chance of at least one head in three tosses is not easy to add directly, but the only way to fail is to toss no heads at all, which is TTT with probability 1/8. So P(at least one head) = 1 − 1/8 = 7/8.",
        "'At least one' and 'exactly one' are different events, and the complement trick answers only the first. In three tosses, exactly one head means HTT, THT or TTH: three of the eight equally likely lists, so P(exactly one head) = 3/8. At least one head is seven of the eight lists, because it also includes two heads and three heads. The same distinction appears with repeated independent trials: if each trial succeeds with probability p, the chance of at least one success in n trials is 1 − (1 − p)ⁿ, because every trial fails with probability 1 − p and independence lets those failures be multiplied. For four rolls of a fair die, P(at least one six) = 1 − (5/6)⁴ = 671/1296 ≈ 0.5177, while P(exactly one six) = 4 × (1/6) × (5/6)³ = 500/1296 ≈ 0.3858.",
      ],
    },
    {
      heading: "Mutually exclusive is not independent",
      paragraphs: [
        "Two events are mutually exclusive when they cannot both happen in the same trial: a single card cannot be a heart and a spade, and a single die roll cannot be even and 1. For mutually exclusive events, P(A ∩ B) = 0, so P(A ∪ B) = P(A) + P(B). Two events are independent when one happening does not change the probability of the other: the first toss of a coin does not affect the second, and a card's suit does not change the chance that it is a king. For independent events, P(A ∩ B) = P(A) × P(B).",
        "The two ideas answer different questions. Exclusivity is about a single trial and forbids the overlap; independence is about information across trials or attributes and permits it. A heart and a king can both happen — the king of hearts — and they are independent, because P(heart) = 13/52, P(king) = 4/52 and P(heart and king) = 1/52 = (13/52) × (4/52). A heart and a spade are mutually exclusive but not independent: knowing the card is a heart makes it certain it is not a spade. In fact, two events with non-zero probability cannot be both mutually exclusive and independent, because exclusivity makes their joint probability 0 while independence makes it the product of two positive numbers.",
      ],
    },
    {
      heading: "The addition rule, the Venn diagram and the tree",
      paragraphs: [
        "For any two events, P(A ∪ B) = P(A) + P(B) − P(A ∩ B). The subtraction removes the outcomes counted in both events. In the group of 30 students, 18 like football, 12 like tennis and 6 like both: 18 + 12 counts the 6 twice, so P(football or tennis) = 18/30 + 12/30 − 6/30 = 24/30 = 4/5. The Venn diagram makes the counts visible: 12 like football only, 6 like tennis only, 6 like both and 6 like neither, and 12 + 6 + 6 + 6 = 30. Exactly one sport is 12 + 6 = 18, so its probability is 18/30 = 3/5; neither is 6/30 = 1/5.",
        "A tree diagram handles trials where the probabilities change. A bag has 3 red and 2 blue counters; two are drawn without replacement. On the first draw P(red) = 3/5 and P(blue) = 2/5. If red is drawn, 2 red and 2 blue remain, so the second draw is red with probability 2/4; if blue is drawn, 3 red and 1 blue remain, so red is 3/4. Multiplying along each path gives P(red then red) = (3/5)(2/4) = 6/20, P(red then blue) = (3/5)(2/4) = 6/20, P(blue then red) = (2/5)(3/4) = 6/20 and P(blue then blue) = (2/5)(1/4) = 2/20. The four path probabilities sum to 20/20, and P(at least one red) = 1 − P(blue then blue) = 1 − 2/20 = 18/20 = 9/10. With replacement, the second draw would not depend on the first, and 1 − (2/5)² = 21/25 would be correct instead. The formula is not wrong; it is answering a different case.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A probability is a position on a scale from impossible to certain, and the marked values are fractions of the whole sample space.",
      notation:
        "0 impossible · 1/8 · 1/4 · 1/2 · 3/4 · 7/8 · 1 certain   ·   P(not A) = 1 − P(A)",
      caption:
        "The scale runs from 0 to 1, never below or above. The marks are not equally spaced by accident: 1/8 and 7/8 are the chances of no heads and at least one head in three tosses, and their sum is 1 because they are complements.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "Two fair dice produce 36 ordered outcomes. Counting the pairs that give each total is the sample-space method; the total 7 has six ways and the total 12 has one.",
      notation:
        "sum 7: (1,6) (2,5) (3,4) (4,3) (5,2) (6,1) = 6 ways   ·   sum 12: (6,6) = 1 way   ·   P(7) = 6/36 = 1/6   ·   P(12) = 1/36",
      caption:
        "The six ways to make 7 are different outcomes even though they share a total, because the dice are distinguishable. The pair (3,4) and the pair (4,3) are counted separately for the same reason: there are two ways for the dice to fall that way.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A Venn diagram turns the addition rule into counts of four regions: only A, only B, both, and neither.",
      notation:
        "30 students: football 18, tennis 12, both 6   ·   football only 12 · tennis only 6 · both 6 · neither 6   ·   P(F ∪ T) = 24/30 = 4/5   ·   P(neither) = 6/30 = 1/5",
      caption:
        "The 18 football lovers include the 6 who also like tennis, and the 12 tennis lovers include the same 6. Adding 18 and 12 counts the both-region twice, which is why the union is 24 rather than 30; the 6 who like neither were never in either count.",
      figure: {
        spec: {
          kind: "venn",
          labelA: "Football",
          labelB: "Tennis",
          onlyA: 12,
          onlyB: 6,
          both: 6,
          neither: 6,
        },
        caption:
          "Each student appears in exactly one region. The 18 football lovers are the 12 football-only plus the 6 in the overlap; the 12 tennis lovers are the 6 tennis-only plus the same 6. The 6 outside both circles are why the four regions total 30 while the union is only 24.",
      },
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "A tree diagram records what remains after each draw. Multiplying along a path gives the probability of that whole sequence, and the complete paths sum to 1.",
      notation:
        "3 red, 2 blue, two draws without replacement   ·   RR 3/5 × 2/4 = 6/20 · RB 3/5 × 2/4 = 6/20 · BR 2/5 × 3/4 = 6/20 · BB 2/5 × 1/4 = 2/20   ·   P(at least one red) = 1 − 2/20 = 9/10",
      caption:
        "The second branch uses the counters that remain, so the denominator falls from 5 to 4 and the numerator depends on the first draw. The four path probabilities sum to 20/20; only BB has no red, so the complement gives the chance of at least one red.",
      figure: {
        spec: {
          kind: "tree",
          first: [
            {
              label: "Red",
              probability: 3 / 5,
              display: "3/5",
              second: [
                { label: "Red", probability: 2 / 4, display: "2/4", pathDisplay: "6/20" },
                { label: "Blue", probability: 2 / 4, display: "2/4", pathDisplay: "6/20" },
              ],
            },
            {
              label: "Blue",
              probability: 2 / 5,
              display: "2/5",
              second: [
                { label: "Red", probability: 3 / 4, display: "3/4", pathDisplay: "6/20" },
                { label: "Blue", probability: 1 / 4, display: "1/4", pathDisplay: "2/20" },
              ],
            },
          ],
        },
        caption:
          "The first branch changes the second: after a red counter is taken, 2 red and 2 blue remain, so the next red is 2/4; after a blue is taken, 3 red and 1 blue remain, so the next red is 3/4. The four complete paths are 6/20, 6/20, 6/20 and 2/20, and their sum is 1.",
      },
    },
    {
      id: "r5",
      kind: "maths.expression",
      body:
        "Repeated independent trials are handled by the complement: the chance of at least one success is one minus the chance that every trial fails.",
      notation:
        "four fair dice rolls   ·   P(no six) = (5/6)⁴ = 625/1296   ·   P(at least one six) = 1 − 625/1296 = 671/1296 ≈ 0.5177   ·   P(exactly one six) = 4 × (1/6) × (5/6)³ = 500/1296 ≈ 0.3858",
      caption:
        "At least one six and exactly one six are different events. The complement counts every outcome with one, two, three or four sixes; exactly one counts only the four lists with a single six and three other results. Their probabilities are close, which is why the words have to be read carefully.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Two fair dice are rolled. Find the probability that the total is 7 or 12.",
      steps: [
        {
          move: "List the sample space as 36 ordered pairs, because each die is distinguishable and each pair is equally likely.",
          why:
            "The count of favourable outcomes is only valid if every outcome in the list has the same probability. Two fair dice give 6 × 6 = 36 equally likely ordered pairs.",
        },
        {
          move: "Count the ways to make 7: (1,6), (2,5), (3,4), (4,3), (5,2) and (6,1), so six outcomes.",
          why:
            "The total 7 can be made in six different ways. The order matters in the sample space, so (3,4) and (4,3) are two outcomes even though both total 7.",
        },
        {
          move: "Count the ways to make 12: only (6,6), so one outcome. The events 'total 7' and 'total 12' cannot both happen, so they are mutually exclusive.",
          why:
            "A single roll cannot have two different totals. With no overlap, the addition rule needs no subtraction, and the favourable counts can simply be added.",
        },
        {
          move: "Add the counts: 6 + 1 = 7 favourable outcomes out of 36, so P(7 or 12) = 7/36.",
          why:
            "The two events are disjoint, so the number of favourable outcomes is 7 and the probability is 7/36. If the events had overlapped, adding the counts would have counted the shared outcomes twice.",
        },
      ],
      answer: "7/36",
    },
    {
      id: "w2",
      prompt: "A fair coin is tossed three times. Find the probability of at least one head, and the probability of exactly one head.",
      steps: [
        {
          move: "List the eight equally likely outcomes: HHH, HHT, HTH, HTT, THH, THT, TTH, TTT.",
          why:
            "Three independent tosses give 2 × 2 × 2 = 8 ordered lists. Each list is equally likely because the coin is fair and the tosses do not affect one another.",
        },
        {
          move: "For at least one head, count the complement instead: the only list with no head is TTT, with probability 1/8.",
          why:
            "Counting at least one directly means counting seven lists. Counting none is one list, and the complement rule turns that into the answer with a single subtraction.",
        },
        {
          move: "Subtract from 1: P(at least one head) = 1 − 1/8 = 7/8.",
          why:
            "At least one head and no heads are complements, so their probabilities sum to 1. The subtraction is exact because the two events cover the whole sample space exactly once.",
        },
        {
          move: "For exactly one head, count HTT, THT and TTH: three lists, so P(exactly one head) = 3/8. At least one head is 7/8, which includes the three lists with two heads and HHH as well.",
          why:
            "Exactly one is a smaller event than at least one, and it is not the complement of none. The 7/8 and 3/8 are different answers to different questions, and the eight lists account for both.",
        },
      ],
      answer: "7/8 for at least one head; 3/8 for exactly one head",
    },
    {
      id: "w3",
      prompt:
        "In a group of 30 students, 18 like football, 12 like tennis and 6 like both. Find the probability that a student chosen at random likes football or tennis, and the probability that they like neither.",
      steps: [
        {
          move: "Draw the Venn diagram with four regions: football only, tennis only, both, and neither.",
          why:
            "The two groups overlap, so the counts cannot be put in two separate circles without deciding where the 6 students who like both belong. The four regions make every student counted once.",
        },
        {
          move: "Put 6 in the overlap. Then football only is 18 − 6 = 12 and tennis only is 12 − 6 = 6. The three sport regions total 12 + 6 + 6 = 24, so neither is 30 − 24 = 6.",
          why:
            "The 18 who like football include the 6 who also like tennis, so subtracting the overlap gives the football-only count. The same subtraction on the tennis side prevents the overlap being counted twice.",
        },
        {
          move: "Use the addition rule: P(football or tennis) = 18/30 + 12/30 − 6/30 = 24/30 = 4/5.",
          why:
            "Adding the two event probabilities counts the 6 students in both twice. Subtracting the intersection once restores the correct union, which is the 24 students in at least one sport.",
        },
        {
          move: "The students in neither sport are the complement of the union: 6 of the 30, so P(neither) = 6/30 = 1/5. The union is 24 of 30, so 24/30 = 4/5, and 4/5 + 1/5 = 1.",
          why:
            "Every student is in the union or outside it, so the two probabilities must sum to 1. The 24 and the 30 are the counts the fractions use, and the 4 and 5 are the simplified fraction.",
        },
      ],
      answer: "4/5 for football or tennis; 1/5 for neither",
    },
    {
      id: "w4",
      prompt:
        "A bag contains 3 red and 2 blue counters. Two counters are drawn without replacement. Find the probability of at least one red.",
      steps: [
        {
          move: "Treat the two draws as ordered: 5 choices for the first and 4 for the second, so 20 equally likely ordered pairs.",
          why:
            "Without replacement the second draw has one fewer counter. Listing ordered pairs keeps every sequence distinct and gives a sample space in which each pair is equally likely.",
        },
        {
          move: "Count the pairs with no red: both must be blue, so 2 choices for the first blue and 1 for the second, which is 2 pairs.",
          why:
            "No red means blue on both draws. The second blue is drawn from the single blue that remains, so there are 2 × 1 = 2 ordered pairs.",
        },
        {
          move: "Use the complement: P(at least one red) = 1 − 2/20 = 18/20 = 9/10.",
          why:
            "The complement of at least one red is no red at all, which is the 2 blue-blue pairs. Subtracting their probability from 1 counts every other pair, including the red-blue and blue-red sequences.",
        },
        {
          move: "Compare with replacement: the second draw would still have 2 blue out of 5, so P(no red) = (2/5)² = 4/25 and P(at least one red) = 21/25, not 9/10. The two cases differ because the first draw changes the second.",
          why:
            "Without replacement the trials are dependent, so the probabilities on the second branch change. With replacement they are independent and the product rule applies to both draws; 9/10 and 21/25 are the two different answers.",
        },
      ],
      answer: "9/10",
    },
    {
      id: "w5",
      prompt: "A fair die is rolled four times. Find the probability of at least one six, and the probability of exactly one six.",
      steps: [
        {
          move: "For at least one six, start with the complement: no six on any roll. Each roll has probability 5/6 of not being a six.",
          why:
            "The rolls are independent, so the chance of no six on all four is the product of the four individual chances. Independence is what allows the multiplication.",
        },
        {
          move: "Multiply: P(no six) = (5/6)⁴ = 625/1296.",
          why:
            "Four independent failures, each with probability 5/6, multiply to 625/1296. The denominator 1296 is 6⁴, the number of ordered results of four rolls.",
        },
        {
          move: "Subtract from 1: P(at least one six) = 1 − 625/1296 = 671/1296 ≈ 0.5177.",
          why:
            "At least one six and no six are complements, so their probabilities sum to 1. The result is slightly more than half, which is plausible for four rolls but not obvious without the calculation.",
        },
        {
          move: "For exactly one six, choose which roll is the six in 4 ways, give it probability 1/6, and give the other three rolls 5/6 each: 4 × (1/6) × (5/6)³ = 500/1296 ≈ 0.3858. The at-least-one answer is 671/1296 ≈ 0.5177, and the two are not the same event.",
          why:
            "Exactly one six fixes one success and three failures, and the four choices of which roll succeeds are separate outcomes. The at-least-one event also includes two, three and four sixes, so its probability must be larger.",
        },
      ],
      answer: "671/1296 ≈ 0.5177 for at least one six; 500/1296 ≈ 0.3858 for exactly one six",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "P(A or B) = P(A) + P(B), even when A and B can happen together.",
      whyItFails:
        "Adding the probabilities counts the outcomes in both events twice. In the group of 30, 18 like football and 12 like tennis, but 6 like both: 18 + 12 counts those 6 twice and gives 30, as though nobody liked neither. The union is 24, not 30, and the 6 who like neither are the visible sign that the count has gone wrong.",
      correction:
        "Subtract the intersection once: P(A ∪ B) = P(A) + P(B) − P(A ∩ B). Draw the Venn diagram and count the four regions before adding anything, so the overlap is placed rather than double-counted.",
      contrast: {
        wrong: "18/30 + 12/30 = 30/30, so every student likes a sport",
        right: "18/30 + 12/30 − 6/30 = 24/30 = 4/5, and 6 students like neither",
      },
    },
    {
      id: "m2",
      belief:
        "Mutually exclusive and independent mean the same thing: if two events cannot happen together, they do not affect each other.",
      whyItFails:
        "Exclusivity is about one trial and forbids the overlap; independence is about information and permits it. A heart and a spade cannot both be drawn, but knowing the card is a heart makes it certain it is not a spade, so they are as dependent as events can be. A heart and a king can both happen, and they are independent, because the king of hearts is exactly the overlap the product rule predicts.",
      correction:
        "Ask two separate questions. Can they both happen in this trial? If no, they are mutually exclusive and the joint probability is 0. Does one happening change the other's probability? If no, they are independent and the joint probability is the product. Two events with non-zero probability cannot be both.",
      contrast: {
        wrong: "a heart and a spade are independent because a card cannot be both",
        right: "a heart and a spade are mutually exclusive, but knowing one rules out the other, so they are dependent",
      },
    },
    {
      id: "m3",
      belief:
        "\"At least one\" and \"exactly one\" are the same, so the complement formula answers both.",
      whyItFails:
        "\"At least one head in three tosses\" includes HTT, THT, TTH, HHT, HTH, THH and HHH, which is 7 of the 8 lists. \"Exactly one\" includes only HTT, THT and TTH, which is 3 of the 8. The complement of \"none\" counts every list with one or more heads, not the lists with precisely one.",
      correction:
        "Read the words as sets. At least one means one or more, so use 1 − P(none). Exactly one means precisely one, so count the positions of the single success and multiply by the probability of the failures: n × p × (1 − p)ⁿ⁻¹.",
      contrast: {
        wrong: "at least one head in three tosses is 3/8, the same as exactly one",
        right: "at least one head is 7/8, while exactly one head is 3/8",
      },
    },
    {
      id: "m4",
      belief:
        "If an experiment gives 7 heads in 10 tosses, the coin is biased, because the theoretical probability is 1/2.",
      whyItFails:
        "A fair coin can produce 7 heads in 10 tosses; the probability of doing so is not negligible. Relative frequency varies around the theoretical probability, and ten trials is far too few to distinguish a fair coin from a slightly biased one. The theoretical probability describes the long-run tendency, not a promise about a short run.",
      correction:
        "Treat relative frequency as an estimate with variation. Compare the observed proportion with what the model predicts over a reasonable number of trials, and remember that a simulation tests the model, not the physical coin. Increasing the number of trials generally narrows the variation but never guarantees an exact match.",
      contrast: {
        wrong: "7 heads in 10 tosses proves the coin is biased",
        right: "7 heads in 10 tosses is unsurprising for a fair coin; 700 in 1000 would need explaining",
      },
    },
    {
      id: "m5",
      belief:
        "The formula 1 − (1 − p)ⁿ applies to any repeated trial, including drawing without replacement.",
      whyItFails:
        "The formula multiplies the failure probability n times, which is only valid when the trials are independent and p stays the same. Drawing without replacement changes the bag: after one blue counter is removed, the chance of a second blue is smaller, so the second factor is not 1 − p. Using the formula there gives the with-replacement answer to a without-replacement question.",
      correction:
        "Check independence before using the power formula. If the trials are dependent, draw a tree and multiply along each path using the probabilities that actually apply at that branch. If the probabilities differ from trial to trial, there is no single p to put in the formula.",
      contrast: {
        wrong: "for 3 red and 2 blue drawn twice without replacement, P(no red) = (2/5)²",
        right: "P(blue then blue) = (2/5)(1/4) = 2/20, because only one blue remains",
      },
    },
    {
      id: "m6",
      belief:
        "A situation with two possible outcomes has probability 1/2 for each, because the outcomes are equally likely.",
      whyItFails:
        "Two outcomes are not automatically equally likely. A bag with 3 red and 2 blue counters has two colours but five counters, so P(red) = 3/5. A biased coin has two faces but not probability 1/2 for heads. The word 'equally likely' is an assumption about the mechanism, not a consequence of the number of categories.",
      correction:
        "Justify equal likelihood from the mechanism — a fair coin, a fair die, a well-mixed bag, a random draw from a complete list — or count the individual outcomes rather than the categories. If the mechanism is unknown, the probabilities must be estimated or left unknown.",
      contrast: {
        wrong: "there are two colours, so P(red) = 1/2",
        right: "there are five counters and three are red, so P(red) = 3/5",
      },
    },
    {
      id: "m7",
      belief:
        "The probabilities of the outcomes in a sample space do not have to add to 1, as long as each one is between 0 and 1.",
      whyItFails:
        "The sample space lists every possible outcome exactly once, so the total probability must be 1. If the probabilities sum to 0.9, an outcome is missing; if they sum to 1.1, an outcome has been counted twice or the outcomes overlap. The sum is the check that the list is complete and disjoint.",
      correction:
        "List the outcomes once each, check that they are mutually exclusive, and add the probabilities. If the total is not 1, find the missing or duplicated outcome before using any of the probabilities.",
      contrast: {
        wrong: "0.6 + 0.5 = 1.1 is acceptable because both values are below 1",
        right: "the total must be 1, so 1.1 means an outcome was counted twice",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "A bag has 5 red and 3 green counters. Find P(red) and P(not red).",
      hint:
        "Count all the counters for the denominator, not the number of colours. The complement rule gives the second answer from the first.",
      answer:
        "There are 8 counters and 5 are red, so P(red) = 5/8. P(not red) = 1 − 5/8 = 3/8, which is also the 3 green counters out of 8.",
      feedback: {
        correct:
          "You used the total number of counters, not the number of colours, and the complement matched the green count.",
        incorrect:
          "The denominator is 5 + 3 = 8 counters, so P(red) = 5/8. The complement is 1 − 5/8 = 3/8, which is the chance of green.",
      },
    },
    {
      id: "p2",
      prompt: "A fair coin is tossed twice. Find P(at least one head) and P(exactly one head).",
      hint:
        "List the four outcomes HH, HT, TH, TT. At least one head is the complement of TT; exactly one head is the two lists with one H and one T.",
      answer:
        "The outcomes are HH, HT, TH and TT, each with probability 1/4. At least one head is 1 − P(TT) = 1 − 1/4 = 3/4. Exactly one head is HT or TH, so 2/4 = 1/2.",
      feedback: {
        correct:
          "You separated the event with one or more heads from the event with precisely one, and both counts came from the same four outcomes.",
        incorrect:
          "At least one head is 3/4, because only TT has none. Exactly one head is 2/4 = 1/2, because only HT and TH have one; HH has two.",
      },
    },
    {
      id: "p3",
      prompt:
        "In a group of 40 students, 25 like tea, 15 like coffee and 8 like both. Find P(tea or coffee) and P(neither).",
      hint:
        "Subtract the 8 who like both once before adding. The students in neither are the complement of the union.",
      answer:
        "P(tea or coffee) = 25/40 + 15/40 − 8/40 = 32/40 = 4/5. The union has 32 students, so 8 of the 40 like neither and P(neither) = 8/40 = 1/5.",
      feedback: {
        correct:
          "You subtracted the overlap once and used the complement for the students outside both groups.",
        incorrect:
          "Adding 25 and 15 counts the 8 who like both twice: the union is 25 + 15 − 8 = 32, so P(tea or coffee) = 32/40 = 4/5. The remaining 8 give P(neither) = 1/5.",
      },
    },
    {
      id: "p4",
      prompt:
        "A bag has 4 red and 2 blue counters. Two are drawn without replacement. Find P(both blue) and P(at least one red).",
      hint:
        "The second draw has one fewer counter. Multiply along the blue-blue branch, then use the complement for at least one red.",
      answer:
        "P(blue then blue) = (2/6)(1/5) = 2/30 = 1/15. P(at least one red) = 1 − 1/15 = 14/15.",
      feedback: {
        correct:
          "You changed the denominator on the second draw and used the complement of the blue-blue path.",
        incorrect:
          "The first blue is 2/6; after it, one blue and five counters remain, so the second is 1/5. The product is 2/30 = 1/15, and the complement gives P(at least one red) = 14/15.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      // This is a reflection, not a mark. The page says so, and the API refuses
      // to award a verdict because there is no valid rubric for free prose.
      scored: false,
      prompt:
        "A bag has 4 red and 3 blue counters. Two counters are drawn without replacement. Explain why the draws are dependent, calculate the probability of at least one red, and explain why 1 − (4/7)² would be the wrong calculation.",
      modelAnswer:
        "The draws are dependent because the first counter is not replaced: after it is removed, there are 6 counters left, and the number of red counters left depends on what the first draw was. If the first is red, 3 red and 3 blue remain, so the second red has probability 3/6; if the first is blue, 4 red and 2 blue remain, so the second red has probability 4/6. To find the probability of at least one red, use the complement: the only way to fail is blue then blue, which has probability (3/7)(2/6) = 6/42 = 1/7. So P(at least one red) = 1 − 1/7 = 6/7. The expression 1 − (4/7)² is wrong because it treats the two draws as independent with the same probability 4/7 of red on each draw. After a red is removed the chance of a second red is 3/6, not 4/7, so the failure probability is not (4/7)². That expression would answer the with-replacement question, where the bag is restored and the draws are independent.",
      marking: [
        "Explains dependence by the changing contents: 6 counters remain and the number of reds left depends on the first draw.",
        "Gives the correct second-draw probabilities for both first-draw cases (3/6 and 4/6).",
        "Computes P(blue then blue) = (3/7)(2/6) = 1/7 and P(at least one red) = 6/7.",
        "Explains that 1 − (4/7)² assumes independence and a constant 4/7, so it answers the with-replacement case.",
        "Distinguishes the complement event (no red) from the event being calculated (at least one red).",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "A bag has 5 red and 3 green counters. What is P(not red)?",
      modelAnswer: "3/8",
      marking: [
        "Counts 8 counters in total.",
        "Uses the complement or the 3 green counters: 1 − 5/8 = 3/8.",
      ],
      check: { accepted: ["3/8", "0.375", "37.5%", "3/8ths"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A and B are independent with P(A) = 0.4 and P(B) = 0.5. What is P(A and B)?",
      modelAnswer: "0.2",
      marking: [
        "Multiplies the probabilities because the events are independent.",
        "Obtains 0.4 × 0.5 = 0.2.",
      ],
      check: { accepted: ["0.2", "1/5", "20%", "0.20"] },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "A and B are mutually exclusive with P(A) = 0.3 and P(B) = 0.5. What is P(A or B)?",
      modelAnswer: "0.8",
      marking: [
        "Adds the probabilities because the events cannot both happen.",
        "Obtains 0.3 + 0.5 = 0.8, with no intersection to subtract.",
      ],
      check: { accepted: ["0.8", "4/5", "80%", "0.80"] },
    },
    {
      id: "a5",
      kind: "short-answer",
      prompt:
        "In a group of 30 students, 18 like football, 12 like tennis and 6 like both. What is the probability that a student chosen at random likes neither?",
      modelAnswer: "1/5",
      marking: [
        "Finds the union: 18 + 12 − 6 = 24 like at least one sport.",
        "Takes the complement: (30 − 24)/30 = 6/30 = 1/5.",
      ],
      check: { accepted: ["1/5", "0.2", "20%", "6/30"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A diagnostic test for a condition is 90% sensitive (it is positive in 90% of people who have the condition) and 90% specific (it is negative in 90% of people who do not). In a population of 10,000 people, 1% have the condition. A person tests positive. Explain why the probability they have the condition is not 90%, calculate it from the 10,000 people, and explain what happens to the answer if 10% of the population had the condition instead.",
      whyItTransfers:
        "The lesson calculates probabilities from a fully specified sample space and separates P(A) from P(A given B). Here the sample space is a population with two attributes, the test result and the condition, and the question asks for the share of positives who are true positives. The arithmetic is percentages and counts the lesson already uses; the new move is building the two-way table and seeing that the base rate is part of the calculation. No formula for conditional probability is required or named.",
      answer:
        "With 10,000 people and 1% prevalence, 100 have the condition. The test is positive in 90% of them, so 90 true positives. The other 9,900 do not have the condition, and the test is wrongly positive in 10% of them, so 990 false positives. There are 90 + 990 = 1,080 positive tests, of which 90 are true positives, so the probability is 90/1,080 = 1/12 ≈ 8.3%, not 90%. The 90% sensitivity is the chance of a positive test given the condition, while the question asks for the chance of the condition given a positive test; the base rate decides how many false positives there are. If 10% had the condition, 1,000 people would be affected and 900 would test positive; the 9,000 unaffected would produce 900 false positives. Then 900/1,800 = 1/2, so the answer would be 50%. The same test gives a very different answer because the prevalence changed, which is why a positive result cannot be read without knowing how common the condition is.",
      marking: [
        "Builds the two-way counts for 10,000 people: 100 with the condition and 9,900 without.",
        "Computes 90 true positives and 990 false positives, and divides 90 by 1,080 to get 1/12 ≈ 8.3%.",
        "Explains that 90% is P(positive given condition), while the question asks for P(condition given positive).",
        "Repeats the calculation at 10% prevalence and obtains 900/1,800 = 50%.",
        "States that the base rate, not the test's accuracy alone, drives the answer.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "P(A) = 0.35. What is P(not A)?",
      answer:
        "0.65, because A and not A are complements and their probabilities sum to 1: 1 − 0.35 = 0.65.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "A and B are independent with P(A) = 0.2 and P(B) = 0.5. What is P(A and B)?",
      answer:
        "0.1. Independence means the probabilities multiply: 0.2 × 0.5 = 0.1. If the events were mutually exclusive the answer would be 0, which shows the two conditions are different.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "A fair coin is tossed twice. What is P(at least one head)?",
      answer:
        "3/4. The complement is two tails, with probability 1/4, so at least one head is 1 − 1/4 = 3/4. Exactly one head would be 1/2, because HH has two heads and is excluded from 'exactly one'.",
      when: "month-later",
    },
  ],

  summary: [
    "A probability is a measure on a sample space: count the favourable outcomes and divide by the total only when the outcomes are equally likely, and check that every probability lies between 0 and 1.",
    "The probabilities of all the outcomes in a sample space sum to 1; P(not A) = 1 − P(A), which turns a hard count into a subtraction.",
    "For mutually exclusive events, P(A or B) = P(A) + P(B); for overlapping events, P(A ∪ B) = P(A) + P(B) − P(A ∩ B), and the subtraction removes the double count.",
    "Mutually exclusive is not independent: exclusivity forbids the overlap in one trial, while independence multiplies probabilities across trials or attributes.",
    "For n independent trials with success probability p, P(at least one) = 1 − (1 − p)ⁿ; 'exactly one' is a different event, and dependent trials need a tree rather than the formula.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every set is also given as a list of outcomes and counts in words, and each probability notation is read alongside a sentence naming the event (P of red, the probability that the counter is not red), so no answer depends on recognising a symbol.",
    },
    {
      need: "low-vision",
      alternative:
        "Fractions and notation are set in the reading text at the learner's chosen size, and the Venn and tree results are repeated as counts in the paragraph beside them rather than only inside a diagram.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each rule is stated on its own line, the event being calculated is named in words before its notation, and the reading routine is three short questions: outcomes, overlap, independence.",
    },
    {
      need: "colour-vision",
      alternative:
        "Venn regions are labelled with their counts rather than distinguished by colour, and tree branches are named by their outcome (red then blue), so the diagram never relies on a colour key.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers are typed. No dragging counters, shading regions or manipulating a tree is required to demonstrate the method.",
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
        "All explanations, examples, practice, assessment and the diagnostic-test transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for probability.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-09",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
