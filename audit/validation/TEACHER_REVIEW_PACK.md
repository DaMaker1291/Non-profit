# Teacher review pack — Independent Educational Validation 1.0

Generated from the compiled authored lessons on 2026-11-10T18:59:12.639Z.
Contract: `openmind.lesson/1.0`.

**This is a request for review, not a review.** No qualified teacher has completed
the forms below. The pack contains answer keys because a reviewer must be able to
check the mathematics; it is an internal audit document and must not be given to
a learner as a worksheet.

## What the reviewer is asked to do

1. Open the exact lesson at `/learn/maths/<concept>` and compare it with the
   version and content hash printed for that lesson.
2. Judge the lesson against the criteria in its blank review form. Record a
   **specific finding** — “the second worked example adds the denominators” is
   useful; “good lesson” is not.
3. Mark each finding's severity and the change required. Do not average the
   criteria into a score.
4. Return the form without editing the lesson. A later version needs a new
   review; the hash is there to make that visible.

The questions a reviewer is answering are:

- Is the mathematics correct, and is the notation used consistently?
- Is the curriculum reference accurate for the stated level?
- Does the explanation make the idea, not just the procedure, intelligible?
- Do the worked examples show the reasoning behind each move?
- Are the misconceptions plausible, and are their corrections sound?
- Is the difficulty appropriate, and does the assessment test what was taught?
- Is the lesson’s accessibility alternative genuinely usable?

## Current human-evidence status

| Measure | Value |
| --- | ---: |
| Target lessons | **5** |
| Teacher reviews recorded on these lessons | **0** |
| Learner-testing records on these lessons | **0** |
| Authored lessons in the catalogue | **65** |
| Machine-checked lessons in the catalogue | **65** |
| Educator-reviewed lessons in the catalogue | **0** |
| Learner-tested lessons in the catalogue | **0** |

## Exact versions in this pack

| Lesson | Version | Content hash | Catalogue status | Human review | Reviews | Learner tests |
| --- | --- | --- | --- | --- | ---: | ---: |
| Probability (`probability-basics`) | `1.0.0` | `322701ed77660d3aa059d30678516bd97d37110db41f778e27444b1dc0c4b7f0` | `machine_checked` | `unreviewed` | 0 | 0 |
| Ratio (`ratio`) | `1.0.0` | `bb9379a0927d31572417299c2530d0d977b36812bb7ee83f49b2345822803272` | `machine_checked` | `unreviewed` | 0 | 0 |
| Proportion (`proportion`) | `1.0.0` | `3a3ec029f96c718603163b1a2b1fda457ef4e667a1a0d177c698bc41513b58e7` | `machine_checked` | `unreviewed` | 0 | 0 |
| Sequences (`sequences`) | `1.0.0` | `88a103da99de0cd9a6671a237ee07496044de3763bd66935167f3e2fbc9c041a` | `machine_checked` | `unreviewed` | 0 | 0 |
| Index laws (`indices-intro`) | `1.0.0` | `f6fe1d7628e7ac144566c6a084998f107a8d8f0c12a8475d3df3f1db9d3e6ef3` | `machine_checked` | `unreviewed` | 0 | 0 |

## Human review records

No human review record is on file. The blank forms below are a request for review, not evidence.

## The lessons

## Probability

- **Concept:** `probability-basics`
- **Subject:** maths
- **Version:** `1.0.0`
- **Content hash:** `322701ed77660d3aa059d30678516bd97d37110db41f778e27444b1dc0c4b7f0`
- **Declared status:** `draft`
- **Catalogue status:** `machine_checked`
- **Current human review:** `unreviewed`
- **Curriculum reference:** GCSE Mathematics, probability: the probability scale, equally likely outcomes, relative frequency, complementary events, mutually exclusive events, the addition rule, independent events and tree diagrams
- **Level:** Key Stage 3 to GCSE Foundation and Higher
- **Scope note:** Scope cited against the published GCSE mathematics subject content for probability. The lesson keeps the sample-space assumption explicit, derives the addition rule rather than asking for recall, and separates mutually exclusive from independent. No specification, textbook or commercial lesson text is reproduced.

### Authorship and evidence

- OpenMind curriculum team — instructional author — ai-assisted-then-edited — 2026-11-09

- **Teacher reviews on record:** 0
- **Learner-testing records on record:** 0

### 1. Objectives and evidence

**Objective:** Construct a sample space, count favourable outcomes, and state the assumption that makes a probability count valid.

**Evidence sought:** For two dice the learner lists the 36 ordered outcomes, finds six ways to make 7 and one way to make 12, and says the count is valid only because the dice are fair and the outcomes are equally likely.

**Objective:** Use the complement, the mutually exclusive addition rule and the general addition rule with the intersection, and say which one a situation requires.

**Evidence sought:** The learner computes P(not A) = 1 − P(A), adds 0.3 and 0.5 for mutually exclusive events, and computes 18/30 + 12/30 − 6/30 = 4/5 for two overlapping groups rather than 30/30.

**Objective:** Distinguish mutually exclusive from independent, and calculate repeated independent trials and at least one success from the complement.

**Evidence sought:** The learner explains that a heart and a spade cannot both occur while a heart and a king can, computes P(at least one head in three tosses) = 7/8, and does not apply 1 − (1 − p)ⁿ to a draw without replacement.

### 2. Prior knowledge

Prerequisite concepts: none declared.

**d1.** A bag has 5 red and 3 green counters. What fraction of the counters is red?

Expected answer: 5/8. There are 5 + 3 = 8 counters in total and 5 are red, so the fraction is 5/8. The denominator is the whole set, not the number of colours.

**d2.** What is 40% of 30?

Expected answer: 12. Ten per cent of 30 is 3, so 40% is 4 × 3 = 12. Percentages are fractions of 100, and the same 'part of the whole' idea is what a probability records.

### 3. Introduction

In a group of 30 students, 18 like football, 12 like tennis and 6 like both. How many like at least one? The tempting answer is 18 + 12 = 30, which would leave nobody out. But the 6 students who like both have been counted twice, so the true number is 24, and 6 students like neither. The overlap is not a detail to tidy up at the end; it is the reason the addition rule contains a subtraction. A probability is a measure on a set of outcomes, and the set has to be built before the arithmetic can be trusted.

Probability looks like a collection of formulas because the formulas are easy to write down. The hard part is deciding which one the situation allows. Three questions decide almost every school probability problem: what are the possible outcomes, and are they equally likely? Do the events overlap? Are the trials independent, or does one change the chances of the next? A fair coin and a biased coin both have two outcomes, but only one has probability 1/2 for heads. Two events can be mutually exclusive, independent, both or neither, and the words are not synonyms. This lesson answers the three questions from the sample space, then uses the answers to choose the rule.

### 4. Explanation

#### Outcomes, events and the sample space

An outcome is one result of a trial: a coin lands heads, a die shows 4, a counter drawn from a bag is red. An event is a set of outcomes. 'The die shows an even number' contains three outcomes, {2, 4, 6}, and its probability is the total probability of those outcomes. The sample space is the set of all possible outcomes, listed once each. For one fair die the sample space is {1, 2, 3, 4, 5, 6}; for two dice it is the 36 ordered pairs (1,1), (1,2), …, (6,6), because a 3 then a 5 is a different outcome from a 5 then a 3 even though the total is the same.

For equally likely outcomes, the probability of an event is the number of favourable outcomes divided by the total number of outcomes. Every probability lies between 0 and 1: 0 for an impossible event, 1 for a certain one, and the probabilities of all the outcomes in the sample space sum to 1 because the list contains every possibility exactly once. The equally-likely condition is an assumption, not a fact about the word 'random'. A bag with 3 red and 2 blue counters has two colours but five counters, so P(red) = 3/5, not 1/2. A weighted die has six faces but may not have six equally likely outcomes. Before counting, say what makes the outcomes equally likely — a fair coin, a fair die, a well-mixed bag, a random draw from a complete list.

#### Theoretical probability and relative frequency

Theoretical probability comes from the structure of the situation: a fair coin has P(heads) = 1/2 because there are two equally likely outcomes and one is heads. Experimental probability, or relative frequency, comes from what happened: if a coin lands heads 47 times in 100 tosses, the relative frequency is 47/100 = 0.47. The two numbers need not be equal in a finite experiment. A fair coin can produce 47 heads, or 55, without being biased; the variation is the point of running the experiment, not evidence that the model is wrong.

As the number of trials grows, the relative frequency of a fair coin tends to settle near 1/2, but it is never guaranteed to equal it exactly and a run of ten tosses says very little. A result of 7 heads in 10 tosses is unremarkable; 700 in 1000 would be surprising for a fair coin. Experimental probability is an estimate of the underlying probability, not a replacement for it, and a simulation is not an observation of the real world. If a computer simulates 10,000 coin tosses, it shows what the model produces; it does not tell you whether the physical coin in your hand is fair.

#### The complement, and the two meanings of 'one'

The complement of an event A is 'A does not happen', written not A. Because an event either happens or does not, P(not A) = 1 − P(A). If P(rain) = 0.35, P(no rain) = 0.65. The rule is useful because the complement is sometimes much easier to count: the chance of at least one head in three tosses is not easy to add directly, but the only way to fail is to toss no heads at all, which is TTT with probability 1/8. So P(at least one head) = 1 − 1/8 = 7/8.

'At least one' and 'exactly one' are different events, and the complement trick answers only the first. In three tosses, exactly one head means HTT, THT or TTH: three of the eight equally likely lists, so P(exactly one head) = 3/8. At least one head is seven of the eight lists, because it also includes two heads and three heads. The same distinction appears with repeated independent trials: if each trial succeeds with probability p, the chance of at least one success in n trials is 1 − (1 − p)ⁿ, because every trial fails with probability 1 − p and independence lets those failures be multiplied. For four rolls of a fair die, P(at least one six) = 1 − (5/6)⁴ = 671/1296 ≈ 0.5177, while P(exactly one six) = 4 × (1/6) × (5/6)³ = 500/1296 ≈ 0.3858.

#### Mutually exclusive is not independent

Two events are mutually exclusive when they cannot both happen in the same trial: a single card cannot be a heart and a spade, and a single die roll cannot be even and 1. For mutually exclusive events, P(A ∩ B) = 0, so P(A ∪ B) = P(A) + P(B). Two events are independent when one happening does not change the probability of the other: the first toss of a coin does not affect the second, and a card's suit does not change the chance that it is a king. For independent events, P(A ∩ B) = P(A) × P(B).

The two ideas answer different questions. Exclusivity is about a single trial and forbids the overlap; independence is about information across trials or attributes and permits it. A heart and a king can both happen — the king of hearts — and they are independent, because P(heart) = 13/52, P(king) = 4/52 and P(heart and king) = 1/52 = (13/52) × (4/52). A heart and a spade are mutually exclusive but not independent: knowing the card is a heart makes it certain it is not a spade. In fact, two events with non-zero probability cannot be both mutually exclusive and independent, because exclusivity makes their joint probability 0 while independence makes it the product of two positive numbers.

#### The addition rule, the Venn diagram and the tree

For any two events, P(A ∪ B) = P(A) + P(B) − P(A ∩ B). The subtraction removes the outcomes counted in both events. In the group of 30 students, 18 like football, 12 like tennis and 6 like both: 18 + 12 counts the 6 twice, so P(football or tennis) = 18/30 + 12/30 − 6/30 = 24/30 = 4/5. The Venn diagram makes the counts visible: 12 like football only, 6 like tennis only, 6 like both and 6 like neither, and 12 + 6 + 6 + 6 = 30. Exactly one sport is 12 + 6 = 18, so its probability is 18/30 = 3/5; neither is 6/30 = 1/5.

A tree diagram handles trials where the probabilities change. A bag has 3 red and 2 blue counters; two are drawn without replacement. On the first draw P(red) = 3/5 and P(blue) = 2/5. If red is drawn, 2 red and 2 blue remain, so the second draw is red with probability 2/4; if blue is drawn, 3 red and 1 blue remain, so red is 3/4. Multiplying along each path gives P(red then red) = (3/5)(2/4) = 6/20, P(red then blue) = (3/5)(2/4) = 6/20, P(blue then red) = (2/5)(3/4) = 6/20 and P(blue then blue) = (2/5)(1/4) = 2/20. The four path probabilities sum to 20/20, and P(at least one red) = 1 − P(blue then blue) = 1 − 2/20 = 18/20 = 9/10. With replacement, the second draw would not depend on the first, and 1 − (2/5)² = 21/25 would be correct instead. The formula is not wrong; it is answering a different case.

### 5. Representations

#### r1 — `maths.expression`

A probability is a position on a scale from impossible to certain, and the marked values are fractions of the whole sample space.

```text
0 impossible · 1/8 · 1/4 · 1/2 · 3/4 · 7/8 · 1 certain   ·   P(not A) = 1 − P(A)
```

**Caption:** The scale runs from 0 to 1, never below or above. The marks are not equally spaced by accident: 1/8 and 7/8 are the chances of no heads and at least one head in three tosses, and their sum is 1 because they are complements.

#### r2 — `maths.expression`

Two fair dice produce 36 ordered outcomes. Counting the pairs that give each total is the sample-space method; the total 7 has six ways and the total 12 has one.

```text
sum 7: (1,6) (2,5) (3,4) (4,3) (5,2) (6,1) = 6 ways   ·   sum 12: (6,6) = 1 way   ·   P(7) = 6/36 = 1/6   ·   P(12) = 1/36
```

**Caption:** The six ways to make 7 are different outcomes even though they share a total, because the dice are distinguishable. The pair (3,4) and the pair (4,3) are counted separately for the same reason: there are two ways for the dice to fall that way.

#### r3 — `maths.expression`

A Venn diagram turns the addition rule into counts of four regions: only A, only B, both, and neither.

```text
30 students: football 18, tennis 12, both 6   ·   football only 12 · tennis only 6 · both 6 · neither 6   ·   P(F ∪ T) = 24/30 = 4/5   ·   P(neither) = 6/30 = 1/5
```

**Caption:** The 18 football lovers include the 6 who also like tennis, and the 12 tennis lovers include the same 6. Adding 18 and 12 counts the both-region twice, which is why the union is 24 rather than 30; the 6 who like neither were never in either count.

**Drawn figure:** `venn`

**Figure caption:** Each student appears in exactly one region. The 18 football lovers are the 12 football-only plus the 6 in the overlap; the 12 tennis lovers are the 6 tennis-only plus the same 6. The 6 outside both circles are why the four regions total 30 while the union is only 24.

```json
{
  "kind": "venn",
  "labelA": "Football",
  "labelB": "Tennis",
  "onlyA": 12,
  "onlyB": 6,
  "both": 6,
  "neither": 6
}
```

#### r4 — `maths.expression`

A tree diagram records what remains after each draw. Multiplying along a path gives the probability of that whole sequence, and the complete paths sum to 1.

```text
3 red, 2 blue, two draws without replacement   ·   RR 3/5 × 2/4 = 6/20 · RB 3/5 × 2/4 = 6/20 · BR 2/5 × 3/4 = 6/20 · BB 2/5 × 1/4 = 2/20   ·   P(at least one red) = 1 − 2/20 = 9/10
```

**Caption:** The second branch uses the counters that remain, so the denominator falls from 5 to 4 and the numerator depends on the first draw. The four path probabilities sum to 20/20; only BB has no red, so the complement gives the chance of at least one red.

**Drawn figure:** `tree`

**Figure caption:** The first branch changes the second: after a red counter is taken, 2 red and 2 blue remain, so the next red is 2/4; after a blue is taken, 3 red and 1 blue remain, so the next red is 3/4. The four complete paths are 6/20, 6/20, 6/20 and 2/20, and their sum is 1.

```json
{
  "kind": "tree",
  "first": [
    {
      "label": "Red",
      "probability": 0.6,
      "display": "3/5",
      "second": [
        {
          "label": "Red",
          "probability": 0.5,
          "display": "2/4",
          "pathDisplay": "6/20"
        },
        {
          "label": "Blue",
          "probability": 0.5,
          "display": "2/4",
          "pathDisplay": "6/20"
        }
      ]
    },
    {
      "label": "Blue",
      "probability": 0.4,
      "display": "2/5",
      "second": [
        {
          "label": "Red",
          "probability": 0.75,
          "display": "3/4",
          "pathDisplay": "6/20"
        },
        {
          "label": "Blue",
          "probability": 0.25,
          "display": "1/4",
          "pathDisplay": "2/20"
        }
      ]
    }
  ]
}
```

#### r5 — `maths.expression`

Repeated independent trials are handled by the complement: the chance of at least one success is one minus the chance that every trial fails.

```text
four fair dice rolls   ·   P(no six) = (5/6)⁴ = 625/1296   ·   P(at least one six) = 1 − 625/1296 = 671/1296 ≈ 0.5177   ·   P(exactly one six) = 4 × (1/6) × (5/6)³ = 500/1296 ≈ 0.3858
```

**Caption:** At least one six and exactly one six are different events. The complement counts every outcome with one, two, three or four sixes; exactly one counts only the four lists with a single six and three other results. Their probabilities are close, which is why the words have to be read carefully.

### 6. Worked examples

#### w1

**Prompt:** Two fair dice are rolled. Find the probability that the total is 7 or 12.

1. **Move:** List the sample space as 36 ordered pairs, because each die is distinguishable and each pair is equally likely.
   **Why:** The count of favourable outcomes is only valid if every outcome in the list has the same probability. Two fair dice give 6 × 6 = 36 equally likely ordered pairs.
2. **Move:** Count the ways to make 7: (1,6), (2,5), (3,4), (4,3), (5,2) and (6,1), so six outcomes.
   **Why:** The total 7 can be made in six different ways. The order matters in the sample space, so (3,4) and (4,3) are two outcomes even though both total 7.
3. **Move:** Count the ways to make 12: only (6,6), so one outcome. The events 'total 7' and 'total 12' cannot both happen, so they are mutually exclusive.
   **Why:** A single roll cannot have two different totals. With no overlap, the addition rule needs no subtraction, and the favourable counts can simply be added.
4. **Move:** Add the counts: 6 + 1 = 7 favourable outcomes out of 36, so P(7 or 12) = 7/36.
   **Why:** The two events are disjoint, so the number of favourable outcomes is 7 and the probability is 7/36. If the events had overlapped, adding the counts would have counted the shared outcomes twice.

**Answer:** 7/36

#### w2

**Prompt:** A fair coin is tossed three times. Find the probability of at least one head, and the probability of exactly one head.

1. **Move:** List the eight equally likely outcomes: HHH, HHT, HTH, HTT, THH, THT, TTH, TTT.
   **Why:** Three independent tosses give 2 × 2 × 2 = 8 ordered lists. Each list is equally likely because the coin is fair and the tosses do not affect one another.
2. **Move:** For at least one head, count the complement instead: the only list with no head is TTT, with probability 1/8.
   **Why:** Counting at least one directly means counting seven lists. Counting none is one list, and the complement rule turns that into the answer with a single subtraction.
3. **Move:** Subtract from 1: P(at least one head) = 1 − 1/8 = 7/8.
   **Why:** At least one head and no heads are complements, so their probabilities sum to 1. The subtraction is exact because the two events cover the whole sample space exactly once.
4. **Move:** For exactly one head, count HTT, THT and TTH: three lists, so P(exactly one head) = 3/8. At least one head is 7/8, which includes the three lists with two heads and HHH as well.
   **Why:** Exactly one is a smaller event than at least one, and it is not the complement of none. The 7/8 and 3/8 are different answers to different questions, and the eight lists account for both.

**Answer:** 7/8 for at least one head; 3/8 for exactly one head

#### w3

**Prompt:** In a group of 30 students, 18 like football, 12 like tennis and 6 like both. Find the probability that a student chosen at random likes football or tennis, and the probability that they like neither.

1. **Move:** Draw the Venn diagram with four regions: football only, tennis only, both, and neither.
   **Why:** The two groups overlap, so the counts cannot be put in two separate circles without deciding where the 6 students who like both belong. The four regions make every student counted once.
2. **Move:** Put 6 in the overlap. Then football only is 18 − 6 = 12 and tennis only is 12 − 6 = 6. The three sport regions total 12 + 6 + 6 = 24, so neither is 30 − 24 = 6.
   **Why:** The 18 who like football include the 6 who also like tennis, so subtracting the overlap gives the football-only count. The same subtraction on the tennis side prevents the overlap being counted twice.
3. **Move:** Use the addition rule: P(football or tennis) = 18/30 + 12/30 − 6/30 = 24/30 = 4/5.
   **Why:** Adding the two event probabilities counts the 6 students in both twice. Subtracting the intersection once restores the correct union, which is the 24 students in at least one sport.
4. **Move:** The students in neither sport are the complement of the union: 6 of the 30, so P(neither) = 6/30 = 1/5. The union is 24 of 30, so 24/30 = 4/5, and 4/5 + 1/5 = 1.
   **Why:** Every student is in the union or outside it, so the two probabilities must sum to 1. The 24 and the 30 are the counts the fractions use, and the 4 and 5 are the simplified fraction.

**Answer:** 4/5 for football or tennis; 1/5 for neither

#### w4

**Prompt:** A bag contains 3 red and 2 blue counters. Two counters are drawn without replacement. Find the probability of at least one red.

1. **Move:** Treat the two draws as ordered: 5 choices for the first and 4 for the second, so 20 equally likely ordered pairs.
   **Why:** Without replacement the second draw has one fewer counter. Listing ordered pairs keeps every sequence distinct and gives a sample space in which each pair is equally likely.
2. **Move:** Count the pairs with no red: both must be blue, so 2 choices for the first blue and 1 for the second, which is 2 pairs.
   **Why:** No red means blue on both draws. The second blue is drawn from the single blue that remains, so there are 2 × 1 = 2 ordered pairs.
3. **Move:** Use the complement: P(at least one red) = 1 − 2/20 = 18/20 = 9/10.
   **Why:** The complement of at least one red is no red at all, which is the 2 blue-blue pairs. Subtracting their probability from 1 counts every other pair, including the red-blue and blue-red sequences.
4. **Move:** Compare with replacement: the second draw would still have 2 blue out of 5, so P(no red) = (2/5)² = 4/25 and P(at least one red) = 21/25, not 9/10. The two cases differ because the first draw changes the second.
   **Why:** Without replacement the trials are dependent, so the probabilities on the second branch change. With replacement they are independent and the product rule applies to both draws; 9/10 and 21/25 are the two different answers.

**Answer:** 9/10

#### w5

**Prompt:** A fair die is rolled four times. Find the probability of at least one six, and the probability of exactly one six.

1. **Move:** For at least one six, start with the complement: no six on any roll. Each roll has probability 5/6 of not being a six.
   **Why:** The rolls are independent, so the chance of no six on all four is the product of the four individual chances. Independence is what allows the multiplication.
2. **Move:** Multiply: P(no six) = (5/6)⁴ = 625/1296.
   **Why:** Four independent failures, each with probability 5/6, multiply to 625/1296. The denominator 1296 is 6⁴, the number of ordered results of four rolls.
3. **Move:** Subtract from 1: P(at least one six) = 1 − 625/1296 = 671/1296 ≈ 0.5177.
   **Why:** At least one six and no six are complements, so their probabilities sum to 1. The result is slightly more than half, which is plausible for four rolls but not obvious without the calculation.
4. **Move:** For exactly one six, choose which roll is the six in 4 ways, give it probability 1/6, and give the other three rolls 5/6 each: 4 × (1/6) × (5/6)³ = 500/1296 ≈ 0.3858. The at-least-one answer is 671/1296 ≈ 0.5177, and the two are not the same event.
   **Why:** Exactly one six fixes one success and three failures, and the four choices of which roll succeeds are separate outcomes. The at-least-one event also includes two, three and four sixes, so its probability must be larger.

**Answer:** 671/1296 ≈ 0.5177 for at least one six; 500/1296 ≈ 0.3858 for exactly one six

### 7. Misconceptions

#### m1 — P(A or B) = P(A) + P(B), even when A and B can happen together.

**Why it fails:** Adding the probabilities counts the outcomes in both events twice. In the group of 30, 18 like football and 12 like tennis, but 6 like both: 18 + 12 counts those 6 twice and gives 30, as though nobody liked neither. The union is 24, not 30, and the 6 who like neither are the visible sign that the count has gone wrong.

**Correction:** Subtract the intersection once: P(A ∪ B) = P(A) + P(B) − P(A ∩ B). Draw the Venn diagram and count the four regions before adding anything, so the overlap is placed rather than double-counted.

**Contrast — wrong:** 18/30 + 12/30 = 30/30, so every student likes a sport

**Contrast — right:** 18/30 + 12/30 − 6/30 = 24/30 = 4/5, and 6 students like neither

#### m2 — Mutually exclusive and independent mean the same thing: if two events cannot happen together, they do not affect each other.

**Why it fails:** Exclusivity is about one trial and forbids the overlap; independence is about information and permits it. A heart and a spade cannot both be drawn, but knowing the card is a heart makes it certain it is not a spade, so they are as dependent as events can be. A heart and a king can both happen, and they are independent, because the king of hearts is exactly the overlap the product rule predicts.

**Correction:** Ask two separate questions. Can they both happen in this trial? If no, they are mutually exclusive and the joint probability is 0. Does one happening change the other's probability? If no, they are independent and the joint probability is the product. Two events with non-zero probability cannot be both.

**Contrast — wrong:** a heart and a spade are independent because a card cannot be both

**Contrast — right:** a heart and a spade are mutually exclusive, but knowing one rules out the other, so they are dependent

#### m3 — "At least one" and "exactly one" are the same, so the complement formula answers both.

**Why it fails:** "At least one head in three tosses" includes HTT, THT, TTH, HHT, HTH, THH and HHH, which is 7 of the 8 lists. "Exactly one" includes only HTT, THT and TTH, which is 3 of the 8. The complement of "none" counts every list with one or more heads, not the lists with precisely one.

**Correction:** Read the words as sets. At least one means one or more, so use 1 − P(none). Exactly one means precisely one, so count the positions of the single success and multiply by the probability of the failures: n × p × (1 − p)ⁿ⁻¹.

**Contrast — wrong:** at least one head in three tosses is 3/8, the same as exactly one

**Contrast — right:** at least one head is 7/8, while exactly one head is 3/8

#### m4 — If an experiment gives 7 heads in 10 tosses, the coin is biased, because the theoretical probability is 1/2.

**Why it fails:** A fair coin can produce 7 heads in 10 tosses; the probability of doing so is not negligible. Relative frequency varies around the theoretical probability, and ten trials is far too few to distinguish a fair coin from a slightly biased one. The theoretical probability describes the long-run tendency, not a promise about a short run.

**Correction:** Treat relative frequency as an estimate with variation. Compare the observed proportion with what the model predicts over a reasonable number of trials, and remember that a simulation tests the model, not the physical coin. Increasing the number of trials generally narrows the variation but never guarantees an exact match.

**Contrast — wrong:** 7 heads in 10 tosses proves the coin is biased

**Contrast — right:** 7 heads in 10 tosses is unsurprising for a fair coin; 700 in 1000 would need explaining

#### m5 — The formula 1 − (1 − p)ⁿ applies to any repeated trial, including drawing without replacement.

**Why it fails:** The formula multiplies the failure probability n times, which is only valid when the trials are independent and p stays the same. Drawing without replacement changes the bag: after one blue counter is removed, the chance of a second blue is smaller, so the second factor is not 1 − p. Using the formula there gives the with-replacement answer to a without-replacement question.

**Correction:** Check independence before using the power formula. If the trials are dependent, draw a tree and multiply along each path using the probabilities that actually apply at that branch. If the probabilities differ from trial to trial, there is no single p to put in the formula.

**Contrast — wrong:** for 3 red and 2 blue drawn twice without replacement, P(no red) = (2/5)²

**Contrast — right:** P(blue then blue) = (2/5)(1/4) = 2/20, because only one blue remains

#### m6 — A situation with two possible outcomes has probability 1/2 for each, because the outcomes are equally likely.

**Why it fails:** Two outcomes are not automatically equally likely. A bag with 3 red and 2 blue counters has two colours but five counters, so P(red) = 3/5. A biased coin has two faces but not probability 1/2 for heads. The word 'equally likely' is an assumption about the mechanism, not a consequence of the number of categories.

**Correction:** Justify equal likelihood from the mechanism — a fair coin, a fair die, a well-mixed bag, a random draw from a complete list — or count the individual outcomes rather than the categories. If the mechanism is unknown, the probabilities must be estimated or left unknown.

**Contrast — wrong:** there are two colours, so P(red) = 1/2

**Contrast — right:** there are five counters and three are red, so P(red) = 3/5

#### m7 — The probabilities of the outcomes in a sample space do not have to add to 1, as long as each one is between 0 and 1.

**Why it fails:** The sample space lists every possible outcome exactly once, so the total probability must be 1. If the probabilities sum to 0.9, an outcome is missing; if they sum to 1.1, an outcome has been counted twice or the outcomes overlap. The sum is the check that the list is complete and disjoint.

**Correction:** List the outcomes once each, check that they are mutually exclusive, and add the probabilities. If the total is not 1, find the missing or duplicated outcome before using any of the probabilities.

**Contrast — wrong:** 0.6 + 0.5 = 1.1 is acceptable because both values are below 1

**Contrast — right:** the total must be 1, so 1.1 means an outcome was counted twice

### 8. Guided practice

#### p1

**Prompt:** A bag has 5 red and 3 green counters. Find P(red) and P(not red).

**Hint:** Count all the counters for the denominator, not the number of colours. The complement rule gives the second answer from the first.

**Answer:** There are 8 counters and 5 are red, so P(red) = 5/8. P(not red) = 1 − 5/8 = 3/8, which is also the 3 green counters out of 8.

**Feedback if correct:** You used the total number of counters, not the number of colours, and the complement matched the green count.

**Feedback if incorrect:** The denominator is 5 + 3 = 8 counters, so P(red) = 5/8. The complement is 1 − 5/8 = 3/8, which is the chance of green.

#### p2

**Prompt:** A fair coin is tossed twice. Find P(at least one head) and P(exactly one head).

**Hint:** List the four outcomes HH, HT, TH, TT. At least one head is the complement of TT; exactly one head is the two lists with one H and one T.

**Answer:** The outcomes are HH, HT, TH and TT, each with probability 1/4. At least one head is 1 − P(TT) = 1 − 1/4 = 3/4. Exactly one head is HT or TH, so 2/4 = 1/2.

**Feedback if correct:** You separated the event with one or more heads from the event with precisely one, and both counts came from the same four outcomes.

**Feedback if incorrect:** At least one head is 3/4, because only TT has none. Exactly one head is 2/4 = 1/2, because only HT and TH have one; HH has two.

#### p3

**Prompt:** In a group of 40 students, 25 like tea, 15 like coffee and 8 like both. Find P(tea or coffee) and P(neither).

**Hint:** Subtract the 8 who like both once before adding. The students in neither are the complement of the union.

**Answer:** P(tea or coffee) = 25/40 + 15/40 − 8/40 = 32/40 = 4/5. The union has 32 students, so 8 of the 40 like neither and P(neither) = 8/40 = 1/5.

**Feedback if correct:** You subtracted the overlap once and used the complement for the students outside both groups.

**Feedback if incorrect:** Adding 25 and 15 counts the 8 who like both twice: the union is 25 + 15 − 8 = 32, so P(tea or coffee) = 32/40 = 4/5. The remaining 8 give P(neither) = 1/5.

#### p4

**Prompt:** A bag has 4 red and 2 blue counters. Two are drawn without replacement. Find P(both blue) and P(at least one red).

**Hint:** The second draw has one fewer counter. Multiply along the blue-blue branch, then use the complement for at least one red.

**Answer:** P(blue then blue) = (2/6)(1/5) = 2/30 = 1/15. P(at least one red) = 1 − 1/15 = 14/15.

**Feedback if correct:** You changed the denominator on the second draw and used the complement of the blue-blue path.

**Feedback if incorrect:** The first blue is 2/6; after it, one blue and five counters remain, so the second is 1/5. The product is 2/30 = 1/15, and the complement gives P(at least one red) = 14/15.

### 9. Independent assessment

#### a1 — `constructed-response` — UNSCORED REFLECTION

**Prompt:** A bag has 4 red and 3 blue counters. Two counters are drawn without replacement. Explain why the draws are dependent, calculate the probability of at least one red, and explain why 1 − (4/7)² would be the wrong calculation.

**Model answer (reviewer copy):** The draws are dependent because the first counter is not replaced: after it is removed, there are 6 counters left, and the number of red counters left depends on what the first draw was. If the first is red, 3 red and 3 blue remain, so the second red has probability 3/6; if the first is blue, 4 red and 2 blue remain, so the second red has probability 4/6. To find the probability of at least one red, use the complement: the only way to fail is blue then blue, which has probability (3/7)(2/6) = 6/42 = 1/7. So P(at least one red) = 1 − 1/7 = 6/7. The expression 1 − (4/7)² is wrong because it treats the two draws as independent with the same probability 4/7 of red on each draw. After a red is removed the chance of a second red is 3/6, not 4/7, so the failure probability is not (4/7)². That expression would answer the with-replacement question, where the bag is restored and the draws are independent.

**Marking criteria:**

- Explains dependence by the changing contents: 6 counters remain and the number of reds left depends on the first draw.
- Gives the correct second-draw probabilities for both first-draw cases (3/6 and 4/6).
- Computes P(blue then blue) = (3/7)(2/6) = 1/7 and P(at least one red) = 6/7.
- Explains that 1 − (4/7)² assumes independence and a constant 4/7, so it answers the with-replacement case.
- Distinguishes the complement event (no red) from the event being calculated (at least one red).

**Mastery rule:** this item is explicitly unscored and must not contribute to mastery.

#### a2 — `short-answer`

**Prompt:** A bag has 5 red and 3 green counters. What is P(not red)?

**Model answer (reviewer copy):** 3/8

**Marking criteria:**

- Counts 8 counters in total.
- Uses the complement or the 3 green counters: 1 − 5/8 = 3/8.

**Accepted deterministic answers:** `3/8`, `0.375`, `37.5%`, `3/8ths`

#### a3 — `short-answer`

**Prompt:** A and B are independent with P(A) = 0.4 and P(B) = 0.5. What is P(A and B)?

**Model answer (reviewer copy):** 0.2

**Marking criteria:**

- Multiplies the probabilities because the events are independent.
- Obtains 0.4 × 0.5 = 0.2.

**Accepted deterministic answers:** `0.2`, `1/5`, `20%`, `0.20`

#### a4 — `short-answer`

**Prompt:** A and B are mutually exclusive with P(A) = 0.3 and P(B) = 0.5. What is P(A or B)?

**Model answer (reviewer copy):** 0.8

**Marking criteria:**

- Adds the probabilities because the events cannot both happen.
- Obtains 0.3 + 0.5 = 0.8, with no intersection to subtract.

**Accepted deterministic answers:** `0.8`, `4/5`, `80%`, `0.80`

#### a5 — `short-answer`

**Prompt:** In a group of 30 students, 18 like football, 12 like tennis and 6 like both. What is the probability that a student chosen at random likes neither?

**Model answer (reviewer copy):** 1/5

**Marking criteria:**

- Finds the union: 18 + 12 − 6 = 24 like at least one sport.
- Takes the complement: (30 − 24)/30 = 6/30 = 1/5.

**Accepted deterministic answers:** `1/5`, `0.2`, `20%`, `6/30`

### 10. Transfer

#### t1

**Prompt:** A diagnostic test for a condition is 90% sensitive (it is positive in 90% of people who have the condition) and 90% specific (it is negative in 90% of people who do not). In a population of 10,000 people, 1% have the condition. A person tests positive. Explain why the probability they have the condition is not 90%, calculate it from the 10,000 people, and explain what happens to the answer if 10% of the population had the condition instead.

**Why it transfers:** The lesson calculates probabilities from a fully specified sample space and separates P(A) from P(A given B). Here the sample space is a population with two attributes, the test result and the condition, and the question asks for the share of positives who are true positives. The arithmetic is percentages and counts the lesson already uses; the new move is building the two-way table and seeing that the base rate is part of the calculation. No formula for conditional probability is required or named.

**Answer:** With 10,000 people and 1% prevalence, 100 have the condition. The test is positive in 90% of them, so 90 true positives. The other 9,900 do not have the condition, and the test is wrongly positive in 10% of them, so 990 false positives. There are 90 + 990 = 1,080 positive tests, of which 90 are true positives, so the probability is 90/1,080 = 1/12 ≈ 8.3%, not 90%. The 90% sensitivity is the chance of a positive test given the condition, while the question asks for the chance of the condition given a positive test; the base rate decides how many false positives there are. If 10% had the condition, 1,000 people would be affected and 900 would test positive; the 9,000 unaffected would produce 900 false positives. Then 900/1,800 = 1/2, so the answer would be 50%. The same test gives a very different answer because the prevalence changed, which is why a positive result cannot be read without knowing how common the condition is.

**Marking criteria:**

- Builds the two-way counts for 10,000 people: 100 with the condition and 9,900 without.
- Computes 90 true positives and 990 false positives, and divides 90 by 1,080 to get 1/12 ≈ 8.3%.
- Explains that 90% is P(positive given condition), while the question asks for P(condition given positive).
- Repeats the calculation at 10% prevalence and obtains 900/1,800 = 50%.
- States that the base rate, not the test's accuracy alone, drives the answer.

### 11. Retrieval

#### x1 — next-day

**Prompt:** P(A) = 0.35. What is P(not A)?

**Answer:** 0.65, because A and not A are complements and their probabilities sum to 1: 1 − 0.35 = 0.65.

#### x2 — week-later

**Prompt:** A and B are independent with P(A) = 0.2 and P(B) = 0.5. What is P(A and B)?

**Answer:** 0.1. Independence means the probabilities multiply: 0.2 × 0.5 = 0.1. If the events were mutually exclusive the answer would be 0, which shows the two conditions are different.

#### x3 — month-later

**Prompt:** A fair coin is tossed twice. What is P(at least one head)?

**Answer:** 3/4. The complement is two tails, with probability 1/4, so at least one head is 1 − 1/4 = 3/4. Exactly one head would be 1/2, because HH has two heads and is excluded from 'exactly one'.

### 12. Summary and accessibility alternatives

- A probability is a measure on a sample space: count the favourable outcomes and divide by the total only when the outcomes are equally likely, and check that every probability lies between 0 and 1.
- The probabilities of all the outcomes in a sample space sum to 1; P(not A) = 1 − P(A), which turns a hard count into a subtraction.
- For mutually exclusive events, P(A or B) = P(A) + P(B); for overlapping events, P(A ∪ B) = P(A) + P(B) − P(A ∩ B), and the subtraction removes the double count.
- Mutually exclusive is not independent: exclusivity forbids the overlap in one trial, while independence multiplies probabilities across trials or attributes.
- For n independent trials with success probability p, P(at least one) = 1 − (1 − p)ⁿ; 'exactly one' is a different event, and dependent trials need a tree rather than the formula.

- **screen-reader:** Every set is also given as a list of outcomes and counts in words, and each probability notation is read alongside a sentence naming the event (P of red, the probability that the counter is not red), so no answer depends on recognising a symbol.
- **low-vision:** Fractions and notation are set in the reading text at the learner's chosen size, and the Venn and tree results are repeated as counts in the paragraph beside them rather than only inside a diagram.
- **dyslexia:** Each rule is stated on its own line, the event being calculated is named in words before its notation, and the reading routine is three short questions: outcomes, overlap, independence.
- **colour-vision:** Venn regions are labelled with their counts rather than distinguished by colour, and tree branches are named by their outcome (red then blue), so the diagram never relies on a colour key.
- **motor:** All practice and assessment answers are typed. No dragging counters, shading regions or manipulating a tree is required to demonstrate the method.

### 13. Provenance

- **openmind-authored** — openmind-authored — licence: OpenMind internal — reproduction: none
  - Written for OpenMind.
  - Note: All explanations, examples, practice, assessment and the diagnostic-test transfer are original to OpenMind.
- **gcse-mathematics-subject-content** — curriculum-citation — licence: official-reference — reproduction: none
  - Scope cited against the published GCSE mathematics subject content for probability.

### Review record — Probability

**Lesson:** `probability-basics`

**Exact version:** `1.0.0`

**Content hash:** `322701ed77660d3aa059d30678516bd97d37110db41f778e27444b1dc0c4b7f0`

**Current status:** `machine_checked`

**Record online:** `/lesson-review/probability-basics` (signed-in teaching account)

**Reviewer name:** ______________________________

**Role / qualification:** ______________________________

**Date:** ______________________________

| Criterion | Specific finding (name the section) | Severity | Required change |
| --- | --- | --- | --- |
| Subject accuracy |  |  |  |
| Curriculum accuracy |  |  |  |
| Teaching quality |  |  |  |
| Worked-example quality |  |  |  |
| Assessment validity |  |  |  |
| Accessibility |  |  |  |

**Overall verdict:** ______________________________

**Anything the reviewer believes is unsafe, misleading or unsuitable for the stated level:**

______________________________________________________________________________

Findings recorded online become improvement tasks automatically. A blocking
finding makes an approval impossible; a completed task does not approve a later
version.

The verdict is deliberately blank. Only a qualified reviewer who has read the
exact version above may complete it. A review of an earlier version does not
apply to this hash.

---

## Ratio

- **Concept:** `ratio`
- **Subject:** maths
- **Version:** `1.0.0`
- **Content hash:** `bb9379a0927d31572417299c2530d0d977b36812bb7ee83f49b2345822803272`
- **Declared status:** `draft`
- **Catalogue status:** `machine_checked`
- **Current human review:** `unreviewed`
- **Curriculum reference:** GCSE Mathematics, ratio, proportion and rates of change: ratio notation, simplifying and equivalent ratios, dividing a quantity in a given ratio, and ratios in context
- **Level:** Key Stage 3 to GCSE Foundation
- **Scope note:** Scope cited against the published subject content. The lesson keeps part-to-part and part-to-whole distinct, and treats a ratio as a comparison rather than as a fraction. No specification or textbook text is reproduced.

### Authorship and evidence

- OpenMind curriculum team — instructional author — ai-assisted-then-edited — 2026-11-09

- **Teacher reviews on record:** 0
- **Learner-testing records on record:** 0

### 1. Objectives and evidence

**Objective:** Interpret a ratio as a comparison of parts, and say what the whole is when the parts are combined.

**Evidence sought:** For a ratio of 3 : 2 the learner identifies three parts of one kind and two of another, states that there are five parts altogether, and writes the two shares as 3/5 and 2/5 of the whole rather than as 3/2 and 2/3.

**Objective:** Simplify a ratio and form an equivalent ratio by multiplying or dividing every part by the same non-zero number.

**Evidence sought:** The learner simplifies 18 : 24 to 3 : 4 by dividing both parts by 6, and explains why adding 1 to both parts of 3 : 2 gives 4 : 3, which is not equivalent.

**Objective:** Divide a quantity in a given ratio, including a ratio whose parts have different units, and check that the shares reconstruct the whole.

**Evidence sought:** The learner shares £84 in the ratio 5 : 2 as £60 and £24, and converts 1.5 m : 50 cm to 150 : 50 before simplifying it to 3 : 1.

### 2. Prior knowledge

Prerequisite concepts: fractions.

**d1.** A class has 12 girls and 18 boys. What fraction of the class is girls?

Expected answer: 12/30, which simplifies to 2/5. The denominator is the whole class, 12 + 18 = 30, not the number of boys.

**d2.** Simplify 15/20 and say what you divided both parts by.

Expected answer: 3/4, after dividing the numerator and denominator by 5. The value is unchanged because both parts were divided by the same number.

### 3. Introduction

A squash bottle says one part concentrate to four parts water. A learner who reads that as one quarter concentrate makes a drink that is far too weak: the bottle describes five parts in total, not four, because the concentrate and the water are both parts of the drink. The colon is not a fraction bar. It is a statement that two quantities are being compared part for part.

Ratios appear in recipes, maps, paint, wages and scale drawings, and the arithmetic is usually simple once the parts are visible. The hard part is choosing the whole. A ratio compares one part with another part, while a fraction compares a part with the whole. Those are different comparisons, and confusing them is what turns 3 : 2 into 3/2 of a mixture. This lesson makes the parts explicit, then uses the same bar model for simplifying, sharing and converting units.

### 4. Explanation

#### A ratio compares parts with parts

In the ratio 3 : 2, the three and the two count parts of the same kind of whole. Three parts of one ingredient are compared with two parts of another, and the total is five parts. The ratio does not say how large a part is; it says how many parts of each kind there are. That is why 3 : 2, 6 : 4 and 30 : 20 describe the same comparison: each is five parts altogether, with three of every five in the first group and two of every five in the second.

The whole matters as soon as a share is expressed as a fraction. In a 3 : 2 mixture there are five parts, so the first ingredient is 3/5 of the mixture and the second is 2/5. Writing 3/2 reverses the comparison: that is the first part measured against the second part, not against the whole. A ratio can therefore be turned into fractions only after the parts have been added, and the two fractions must add to one because together they are the whole mixture.

#### Equivalent ratios are made by scaling every part

Multiplying or dividing every part of a ratio by the same number gives an equivalent ratio. Starting from 3 : 2, multiplying both parts by 4 gives 12 : 8; the number of parts has grown, but every group still has three of the first kind for every two of the second. Dividing both parts by their highest common factor gives the simplest form. For 18 : 24, both parts divide by 6, so the simplest form is 3 : 4.

Adding the same amount to both parts is not scaling, and it does not preserve the comparison. From 3 : 2, adding one to each part gives 4 : 3, which is not equivalent: 3 : 2 puts three of the first kind against two of the second, while 4 : 3 puts four against three. A recipe doubled by adding one cup to every ingredient would not be the same recipe. Only multiplication or division by the same non-zero number keeps the parts in the same proportion.

#### Sharing a quantity means giving each part its value

To share a quantity in a ratio, first add the parts to find how many equal parts the whole contains. For 5 : 2, the total is seven parts. Divide the quantity by seven to find the value of one part, then multiply that value by each part of the ratio. Sharing £84 in 5 : 2 gives one part worth £12, so the shares are five times £12 = £60 and two times £12 = £24. The check is not optional: £60 + £24 = £84, so the shares rebuild the whole.

A bar model makes the same calculation visible. Draw seven equal boxes, label five of them for the first share and two for the second, and write the value of one box inside it. The model also catches a wrong whole: if a learner divides by five because the ratio contains a five, the seven boxes no longer account for the full quantity. The number of boxes is the sum of the parts, never one of the parts. The same method works when the parts have different units, but the units must be converted before the boxes are drawn.

### 5. Representations

#### r1 — `maths.expression`

A ratio compares parts of the same whole. The colon is a comparison sign, not a division sign, and the parts must be added before a fraction of the whole can be written.

```text
3 : 2   →   3 parts to 2 parts   →   3 + 2 = 5 parts in total   →   3/5 and 2/5 of the whole
```

**Caption:** The ratio 3 : 2 has five parts altogether. The first share is three of those five parts and the second is two, so the fractions of the whole are 3/5 and 2/5, not 3/2 and 2/3.

#### r2 — `maths.area-model`

A bar split into five equal boxes. Three boxes are shaded for the first share and two are left plain for the second, so the bar shows the parts and the whole at the same time.

```text
3 : 2   →   [ ][ ][ ] | [ ][ ]   →   five equal parts
```

**Caption:** The bar has five boxes because 3 + 2 = 5. Shading three boxes makes the first share three fifths of the bar; the remaining two boxes are two fifths. The picture would be wrong if it had only three boxes, because the two parts of the second share would have nowhere to go.

**Drawn figure:** `bar`

**Figure caption:** A bar split into five equal boxes: three shaded and two plain. The whole is five parts, so the shaded share is 3/5 and the plain share is 2/5.

```json
{
  "kind": "bar",
  "parts": [
    {
      "label": "3 parts",
      "units": 3,
      "shade": true
    },
    {
      "label": "2 parts",
      "units": 2
    }
  ],
  "totalLabel": "5 equal parts"
}
```

#### r3 — `maths.expression`

A ratio with different units is not simplified until both quantities are measured in the same unit.

```text
1.5 m : 50 cm   →   150 cm : 50 cm   →   150 : 50   →   3 : 1
```

**Caption:** One and a half metres is 150 centimetres, so the comparison is 150 to 50, which simplifies to 3 : 1. Writing 1.5 : 50 would compare metres with centimetres and produce a meaningless decimal ratio.

### 6. Worked examples

#### w1

**Prompt:** Simplify 18 : 24 and write each share as a fraction of the whole.

1. **Move:** Find a number that divides both parts. Six divides 18 and 24, so divide both by 6.
   **Why:** Dividing every part by the same number keeps the comparison unchanged; it packs the same parts into larger groups rather than altering the mixture.
2. **Move:** The simplified ratio is 3 : 4. Add the parts to find the whole: 3 + 4 = 7.
   **Why:** The whole is the sum of the parts, so the simplified ratio has seven equal parts in total. The whole is not 3 + 4 = 7 only by coincidence; it is the definition of combining the two shares.
3. **Move:** The first share is 3 of the 7 parts and the second is 4 of the 7, so the fractions are 3/7 and 4/7. Check that 3/7 + 4/7 = 1.
   **Why:** A fraction of the whole uses the total number of parts as its denominator, and the two shares must add to one because together they are the whole. The simplified ratio 3 : 4 therefore represents 3/7 and 4/7, not 3/4 and 4/3.

**Answer:** 3 : 4; the shares are 3/7 and 4/7 of the whole

#### w2

**Prompt:** Share £84 in the ratio 5 : 2.

1. **Move:** Add the parts: 5 + 2 = 7 equal parts altogether.
   **Why:** The ratio tells us how many parts each share receives, not how much one part is worth. Adding the parts gives the number of equal boxes the whole must be split into.
2. **Move:** Divide £84 by 7 to find the value of one part: 84 ÷ 7 = £12.
   **Why:** If seven equal parts make £84, one part is £84 divided by seven. This is the unit value that every share is built from.
3. **Move:** Multiply each part of the ratio by £12: 5 × 12 = £60 and 2 × 12 = £24. Check £60 + £24 = £84.
   **Why:** The first share gets five of the seven parts and the second gets two, so the shares are five and two times the unit value. The check confirms that the shares reconstruct the original amount rather than losing or duplicating a part.

**Answer:** £60 and £24

#### w3

**Prompt:** Write the ratio 1.5 m : 50 cm in its simplest form.

1. **Move:** Convert both quantities to the same unit. 1.5 m is 150 cm, so the ratio becomes 150 cm : 50 cm.
   **Why:** A ratio compares quantities of the same kind, and metres and centimetres are different-sized units. Converting first makes the numbers describe the same unit, which is what the comparison requires.
2. **Move:** Remove the common unit and divide both parts by 50: 150 ÷ 50 = 3 and 50 ÷ 50 = 1.
   **Why:** Once both quantities are in centimetres, the unit is common to both parts and can be left out of the ratio notation. Dividing both numbers by the same factor simplifies the comparison.
3. **Move:** The simplest form is 3 : 1, meaning the first length is three times the second.
   **Why:** The simplified ratio says that 150 cm is three times 50 cm. The numbers 3 and 1 are the comparison, not the original measurements, and the check 3 × 50 = 150 confirms it.

**Answer:** 3 : 1

### 7. Misconceptions

#### m1 — A ratio of 3 : 2 means the first share is 3/2 of the whole.

**Why it fails:** The fraction 3/2 compares the first part with the second part, not with the whole. The whole contains both shares, so it has 3 + 2 = 5 parts. The first share is 3/5 of the mixture and the second is 2/5. Treating 3/2 as a share of the whole produces more than one whole before the second ingredient has been counted at all.

**Correction:** Add the parts first to find the whole, then put each part over that total. For 3 : 2 the shares are 3/5 and 2/5, and those two fractions add to 1.

**Contrast — wrong:** 3 : 2 means 3/2 of the mixture is the first ingredient

**Contrast — right:** 3 : 2 means 3/5 of the mixture is the first ingredient and 2/5 is the second

#### m2 — Adding the same amount to both parts keeps a ratio equivalent.

**Why it fails:** Adding changes the size of the parts without scaling them together. From 3 : 2, adding one to each part gives 4 : 3, and four parts against three is a different comparison from three against two. The first share has grown from three fifths to four sevenths of the whole, so the mixture has changed. Only multiplying or dividing every part by the same number preserves the comparison.

**Correction:** Scale by multiplication or division, not addition. Multiply both parts by the same factor to make a larger batch, or divide both by a common factor to simplify; adding a constant changes the ratio unless the constant is zero.

**Contrast — wrong:** 3 : 2 is equivalent to 4 : 3 because 1 was added to both parts

**Contrast — right:** 3 : 2 is equivalent to 6 : 4 because both parts were multiplied by 2

#### m3 — A ratio can be simplified without converting different units first.

**Why it fails:** The numbers in a ratio only compare quantities measured in the same unit. The ratio 1.5 m : 50 cm is not 1.5 : 50, because the first number counts metres and the second counts centimetres. Dividing those numbers compares a metre with a centimetre and gives a value that is a hundred times too small for the first part.

**Correction:** Convert both quantities to a common unit before simplifying. 1.5 m becomes 150 cm, so the ratio is 150 : 50, which simplifies to 3 : 1.

**Contrast — wrong:** 1.5 m : 50 cm simplifies to 1.5 : 50

**Contrast — right:** 1.5 m : 50 cm is 150 cm : 50 cm, which simplifies to 3 : 1

### 8. Guided practice

#### p1

**Prompt:** Simplify the ratio 24 : 36.

**Hint:** Find the largest number that divides both parts. Both are multiples of twelve, so divide each part by twelve.

**Answer:** 2 : 3, because 24 ÷ 12 = 2 and 36 ÷ 12 = 3

**Feedback if correct:** Both parts were divided by the same factor, so the comparison is unchanged and the ratio is in its simplest form.

**Feedback if incorrect:** The largest common factor is 12: 24 divided by 12 is 2 and 36 divided by 12 is 3, so the simplest form is 2 : 3. Dividing only one part would change the comparison.

#### p2

**Prompt:** Share 45 in the ratio 4 : 5.

**Hint:** Add the parts first. Four parts plus five parts make nine equal parts, so one part is 45 divided by nine.

**Answer:** 20 and 25, because 4 + 5 = 9, 45 ÷ 9 = 5, and 4 × 5 = 20 while 5 × 5 = 25

**Feedback if correct:** The parts were added to find the whole, one part was valued, and the two shares were checked against 45.

**Feedback if incorrect:** There are nine equal parts, so one part is 5. The shares are four parts and five parts: 20 and 25. Dividing 45 by four or by five would use one share as though it were the whole.

#### p3

**Prompt:** A recipe uses flour and sugar in the ratio 5 : 2. If the recipe uses 300 g of flour, how much sugar is needed, and what is the total mass?

**Hint:** The ratio says five parts of flour is 300 g. Find the mass of one part first, then use the two parts for sugar.

**Answer:** 120 g of sugar, and 420 g in total. One part is 300 ÷ 5 = 60 g, so sugar is 2 × 60 = 120 g; the mass is 300 + 120 = 420 g.

**Feedback if correct:** You valued one part from the flour and used it for both the sugar and the total, so the ratio was applied consistently.

**Feedback if incorrect:** Five parts of flour are 300 g, so one part is 60 g. Sugar is two parts, 120 g, and the total is 300 + 120 = 420 g; dividing 300 by 2 would reverse the ratio.

### 9. Independent assessment

#### a1 — `short-answer`

**Prompt:** Simplify the ratio 45 : 60.

**Model answer (reviewer copy):** 3 : 4

**Marking criteria:**

- Divides both parts by the same common factor, here 15.
- Gives the ratio in its simplest form as 3 : 4.

**Accepted deterministic answers:** `3 : 4`, `3:4`, `3 to 4`

#### a2 — `constructed-response`

**Prompt:** A learner says that 3 : 2 means the first share is 3/2 of the whole. Explain what is wrong and write the two shares as fractions of the whole.

**Model answer (reviewer copy):** The ratio 3 : 2 compares the first part with the second part, not with the whole. The whole contains both shares, so it has 3 + 2 = 5 equal parts. The first share is therefore 3/5 of the whole and the second is 2/5. The fraction 3/2 compares the first part with the second part, and it is larger than one whole because the first part is larger than the second; it cannot be a share of the whole when the second part also has to fit inside it. The check is that 3/5 + 2/5 = 1, so the two shares account for the entire mixture.

**Marking criteria:**

- Identifies that the ratio compares part with part, while a fraction of the whole compares a part with the total.
- Adds the parts to obtain a whole of five parts.
- Gives 3/5 and 2/5 and checks that they sum to one.

#### a3 — `short-answer`

**Prompt:** Share 72 in the ratio 5 : 4.

**Model answer (reviewer copy):** 40 and 32

**Marking criteria:**

- Adds the parts to get nine equal parts and divides 72 by 9.
- Multiplies 5 and 4 by the value of one part, 8.

**Accepted deterministic answers:** `40 and 32`, `40:32`, `40,32`, `40 and 32 pounds`

### 10. Transfer

#### t1

**Prompt:** A concrete mix uses cement and sand in the ratio 1 : 4 by mass. A builder has 150 kg of cement and 750 kg of sand. If the builder uses all 150 kg of cement, how much sand is needed, how much sand is left, and what would be needed to use all 750 kg of sand instead?

**Why it transfers:** The learner must choose the whole from a real stock rather than share a total that has already been given. The ratio is unchanged, but the question asks which ingredient limits the mix, so the arithmetic has to be attached to a decision. That is a different task from dividing a stated quantity, even though it uses the same parts.

**Answer:** With 150 kg of cement, the ratio 1 : 4 requires 4 × 150 = 600 kg of sand, so 750 − 600 = 150 kg of sand is left. To use all 750 kg of sand at the same ratio, the cement needed is 750 ÷ 4 = 187.5 kg, which is 37.5 kg more than the builder has. The cement is therefore the limiting ingredient; using all the sand would require more cement, not a different ratio.

**Marking criteria:**

- Uses the ratio to calculate 600 kg of sand for 150 kg of cement.
- Subtracts to find 150 kg of sand left.
- Divides 750 by 4 to find 187.5 kg of cement and states that the builder is 37.5 kg short.
- Explains that the ratio stays 1 : 4; only the available quantities decide which ingredient limits the batch.

### 11. Retrieval

#### x1 — next-day

**Prompt:** Simplify 16 : 24.

**Answer:** 2 : 3, because both parts divide by 8. The comparison is unchanged; the parts have simply been grouped into larger units.

#### x2 — week-later

**Prompt:** Share 35 in the ratio 2 : 5.

**Answer:** 10 and 25. There are seven parts, one part is 5, and the shares are 2 × 5 and 5 × 5.

#### x3 — month-later

**Prompt:** A ratio is 4 : 5 and the whole is 63. What are the two shares?

**Answer:** 28 and 35. There are nine parts, 63 ÷ 9 = 7, and 4 × 7 = 28 while 5 × 7 = 35.

### 12. Summary and accessibility alternatives

- A ratio compares parts with parts; the whole is the sum of the parts, not either part on its own.
- A part-to-part ratio becomes a fraction of the whole only after the parts are added; 3 : 2 gives 3/5 and 2/5.
- Equivalent ratios are made by multiplying or dividing every part by the same non-zero number, never by adding.
- To share a quantity, add the parts, divide by the total number of parts, then multiply by each share and check the sum.
- Convert different units to the same unit before simplifying a ratio such as 1.5 m : 50 cm.

- **screen-reader:** Every ratio is read as words — three to two — and the bar model is described as three shaded boxes out of five equal boxes, so the colon is never the only cue.
- **dyslexia:** The parts are listed on separate lines before the ratio notation appears, and each sharing example repeats the same three moves: add the parts, value one part, multiply each share.
- **motor:** All answers are typed as numbers or short phrases; no dragging or colouring is required to demonstrate the ratio method.
- **colour-vision:** The bar model labels each group with its part count and its share, so the two groups do not rely on a colour difference.

### 13. Provenance

- **openmind-authored** — openmind-authored — licence: OpenMind internal — reproduction: none
  - Written for OpenMind.
  - Note: All explanations, examples, practice, assessments and the concrete-mix transfer are original to OpenMind.
- **gcse-mathematics-subject-content** — curriculum-citation — licence: official-reference — reproduction: none
  - Scope cited against the published GCSE mathematics subject content for ratio, proportion and rates of change.

### Review record — Ratio

**Lesson:** `ratio`

**Exact version:** `1.0.0`

**Content hash:** `bb9379a0927d31572417299c2530d0d977b36812bb7ee83f49b2345822803272`

**Current status:** `machine_checked`

**Record online:** `/lesson-review/ratio` (signed-in teaching account)

**Reviewer name:** ______________________________

**Role / qualification:** ______________________________

**Date:** ______________________________

| Criterion | Specific finding (name the section) | Severity | Required change |
| --- | --- | --- | --- |
| Subject accuracy |  |  |  |
| Curriculum accuracy |  |  |  |
| Teaching quality |  |  |  |
| Worked-example quality |  |  |  |
| Assessment validity |  |  |  |
| Accessibility |  |  |  |

**Overall verdict:** ______________________________

**Anything the reviewer believes is unsafe, misleading or unsuitable for the stated level:**

______________________________________________________________________________

Findings recorded online become improvement tasks automatically. A blocking
finding makes an approval impossible; a completed task does not approve a later
version.

The verdict is deliberately blank. Only a qualified reviewer who has read the
exact version above may complete it. A review of an earlier version does not
apply to this hash.

---

## Proportion

- **Concept:** `proportion`
- **Subject:** maths
- **Version:** `1.0.0`
- **Content hash:** `3a3ec029f96c718603163b1a2b1fda457ef4e667a1a0d177c698bc41513b58e7`
- **Declared status:** `draft`
- **Catalogue status:** `machine_checked`
- **Current human review:** `unreviewed`
- **Curriculum reference:** GCSE Mathematics, ratio, proportion and rates of change: direct and inverse proportion, the constant of proportionality, and graphs of proportional relationships
- **Level:** Key Stage 3 to GCSE Foundation and Higher
- **Scope note:** Scope cited against the published subject content. The lesson derives direct and inverse relationships from their invariants, uses a table and a graph, and does not treat every straight line as proportional. No specification or textbook text is reproduced.

### Authorship and evidence

- OpenMind curriculum team — instructional author — ai-assisted-then-edited — 2026-11-09

- **Teacher reviews on record:** 0
- **Learner-testing records on record:** 0

### 1. Objectives and evidence

**Objective:** Decide whether two quantities are directly proportional by testing whether their quotient is constant, and find the constant of proportionality.

**Evidence sought:** Given a table in which every y divided by x is 3.5, the learner identifies direct proportion, writes y = 3.5x, and explains why a table whose differences are constant but whose quotients are not is not proportional.

**Objective:** Use a direct proportion to scale a quantity, including a quantity that is not in the table, and check the result against the unit rate.

**Evidence sought:** The learner finds that 5 kg costs £12.50, calculates the unit rate £2.50 per kg, and uses it to find the cost of 8 kg as £20 rather than adding £12.50 and £7.50 by guesswork.

**Objective:** Recognise inverse proportion from a constant product, use y = k/x, and distinguish it from a relationship that merely decreases.

**Evidence sought:** The learner shows that six workers take eight days and four workers take twelve because both give 48 worker-days, and rejects y = 10 − x as inverse proportion because its product is not constant.

### 2. Prior knowledge

Prerequisite concepts: ratio.

**d1.** A recipe uses 2 parts flour to 3 parts milk. What fraction of the mixture is flour?

Expected answer: 2/5. The whole has 2 + 3 = 5 parts, so the flour is two of those five parts; 2/3 would compare flour with milk rather than with the whole.

**d2.** Simplify the ratio 18 : 24.

Expected answer: 3 : 4, after dividing both parts by 6. The comparison is unchanged because both quantities were divided by the same number.

### 3. Introduction

A shop sells potatoes at a fixed price per kilogram. Five kilograms cost £12.50, so eight kilograms cost £20: every kilogram adds the same £2.50. A second shop charges £5 delivery plus £2 per kilogram, so its five-kilogram order is £15 and its eight-kilogram order is £21. Both prices rise as the weight rises, but only the first is proportional. The difference is not the direction of the change; it is what stays constant.

Proportion is the mathematics of a fixed rate. A recipe, a currency exchange, a map scale and a machine's output can all be modelled by one constant, and once that constant is known every other pair of values follows. Inverse proportion is the same idea with the constant in the product rather than the quotient. The lesson teaches the test before the formula: divide to check direct proportion, multiply to check inverse proportion, and only then write the equation. That order is what stops a learner from calling every straight-line graph proportional.

### 4. Explanation

#### Direct proportion has a constant quotient

Two quantities are directly proportional when one is a constant multiple of the other. If y is directly proportional to x, there is a number k such that y = kx, and dividing both sides by x gives y/x = k. The quotient is the test and the constant at the same time. A shop charging £2.50 per kilogram has y/x = 2.50 for every weight, so the cost is directly proportional to the weight. Doubling the weight doubles the cost; tripling it triples the cost; the graph is a straight line through the origin.

A straight line is not enough. The delivery shop's cost is 2x + 5, which is a straight line but not a proportional one: five kilograms cost £15 and eight kilograms cost £21, so the quotients are 3 and 2.625, not equal. The £5 delivery charge is paid once, so it does not scale with the weight. Direct proportion requires both a constant rate and no fixed starting amount; the graph must pass through the origin, and the quotient test is what proves it.

#### Find the constant, then use it

The constant of proportionality is the amount for one unit. From five kilograms costing £12.50, divide 12.50 by 5 to get £2.50 per kilogram. The equation is C = 2.50m, where C is the cost and m is the mass. The unit rate is not a separate trick: it is k, and writing the equation makes it reusable for any mass, including one that is not in the original table. A learner who only scales by adding the same amount each time will be stuck as soon as the new quantity is not a whole-number multiple.

A table can show the same relationship in three columns: the input, the output, and the quotient. If the quotient column is constant, the relationship is direct and that value is k. If the quotient changes, the relationship is not direct, even when the output rises steadily. This is why a table of values is more informative than a picture of a line: the table exposes the invariant, and the graph shows its shape, but only the quotient establishes the proportion.

#### Inverse proportion has a constant product

Two quantities are inversely proportional when their product is constant: xy = k, so y = k/x. Six workers completing a job in eight days give 6 × 8 = 48 worker-days. Four workers need 48 ÷ 4 = 12 days if the work is the same and every worker contributes at the same rate. Doubling the number of workers halves the time, but the reason is the fixed total amount of work, not a general rule that one quantity must fall whenever another rises.

A decreasing relationship is not automatically inverse. The amount of water left in a tank, y = 100 − 2x, falls as x rises, but its product with x is not constant: at x = 5 the product is 450, and at x = 10 it is 800. The product test distinguishes a fixed total shared among a changing number from a quantity that simply declines. The same test also gives the equation: find k from one complete pair, then divide by the new value of x.

### 5. Representations

#### r1 — `maths.expression`

Direct proportion is a constant quotient. The constant is the amount for one unit, and the equation lets that unit rate be used for any input.

```text
y = kx   ·   k = y/x   ·   C = 2.50m   ·   5 kg → £12.50, so k = 2.50
```

**Caption:** The quotient is the test and the constant. Five kilograms at £2.50 per kilogram gives £12.50, and eight kilograms gives £20 because every kilogram contributes the same amount.

#### r2 — `maths.graph`

A table of a direct proportion has a constant quotient. The graph of the same relationship is a straight line through the origin, so the two representations agree.

```text
x: 2, 4, 6   ·   y: 7, 14, 21   ·   y/x = 3.5 every time   ·   y = 3.5x
```

**Caption:** The table shows the quotient is 3.5 for every pair, which is the evidence for direct proportion. The graph would rise steadily and pass through the origin; a line with a fixed starting charge would rise but miss the origin.

#### r3 — `maths.expression`

Inverse proportion is a constant product. The equation divides the constant by the changing quantity, and the product test replaces the quotient test.

```text
xy = k   ·   y = k/x   ·   6 workers × 8 days = 48 worker-days   ·   4 workers → 48 ÷ 4 = 12 days
```

**Caption:** Six workers for eight days and four workers for twelve days both give 48 worker-days. The total work is fixed, so multiplying the two quantities is the invariant; the product is not the number of workers or the number of days on its own.

### 6. Worked examples

#### w1

**Prompt:** Five kilograms of potatoes cost £12.50 at a fixed price per kilogram. Find the cost of eight kilograms.

1. **Move:** Check that the price is directly proportional to the mass by finding the cost of one kilogram: 12.50 ÷ 5 = £2.50.
   **Why:** A fixed price per kilogram means the quotient cost divided by mass is constant. Dividing by five gives the unit rate, which is the constant of proportionality.
2. **Move:** Write the relationship as C = 2.50m, where C is the cost in pounds and m is the mass in kilograms.
   **Why:** The equation records the constant once and makes it reusable. It is not a new method; it is the unit rate written in a form that works for any mass.
3. **Move:** Substitute m = 8: C = 2.50 × 8 = 20, so eight kilograms cost £20. Check that 20 ÷ 8 = 2.50, the same unit rate.
   **Why:** Substitution applies the constant to the new mass, and the check confirms that the new pair has the same quotient as the original pair. The answer is £20, not £12.50 plus a guessed increment.

**Answer:** £20

#### w2

**Prompt:** Six workers can complete a job in eight days. Assuming they work at the same rate, how long will four workers take?

1. **Move:** Find the fixed amount of work by multiplying the number of workers by the number of days: 6 × 8 = 48 worker-days.
   **Why:** The job is the same total amount of work, so the product of workers and days is constant. This is the inverse-proportion invariant.
2. **Move:** Use the equation 4 × d = 48, because four workers must still complete the same 48 worker-days.
   **Why:** With fewer workers, each worker's contribution is unchanged and the total work does not change. The product stays 48, so the number of days must rise.
3. **Move:** Divide both sides by 4: d = 48 ÷ 4 = 12, so four workers take twelve days. Check that 4 × 12 = 48.
   **Why:** The division isolates the new time, and the check confirms the product is the same as the original pair. The answer is twelve days, not eight plus two.

**Answer:** 12 days

#### w3

**Prompt:** The table shows x = 2, 5, 8 and y = 7, 17.5, 28. Decide whether y is directly proportional to x, and write the relationship.

1. **Move:** Divide each y by its x: 7 ÷ 2 = 3.5, 17.5 ÷ 5 = 3.5, and 28 ÷ 8 = 3.5.
   **Why:** Direct proportion requires the quotient to be the same for every pair. If any quotient differs, the relationship is not direct, even if all the outputs are increasing.
2. **Move:** The quotient is constant at 3.5, so the relationship is directly proportional and k = 3.5.
   **Why:** A constant quotient is the definition of direct proportion. The constant is the multiplier that turns each x into its y, not the difference between successive y-values.
3. **Move:** Write y = 3.5x. Check with the third pair: 3.5 × 8 = 28, which matches the table.
   **Why:** The equation is the relationship that generates every pair. Substituting one of the original inputs and recovering its output is the check that the constant has been applied correctly.

**Answer:** Yes, y = 3.5x

### 7. Misconceptions

#### m1 — Every straight-line relationship is a direct proportion.

**Why it fails:** A direct proportion must have a constant quotient and pass through the origin. The line y = 3x + 2 is straight, but at x = 1 the quotient is 5 and at x = 2 it is 4, so the quotient is not constant. The plus 2 is a fixed amount that does not scale with x, which is why doubling x does not double y.

**Correction:** Test the quotient, not the shape. Divide y by x for at least two pairs; if the results differ, the relationship is linear but not proportional. The graph must pass through the origin as well.

**Contrast — wrong:** y = 3x + 2 is proportional because its graph is a straight line

**Contrast — right:** y = 3x is proportional; y = 3x + 2 has a fixed charge, so its quotient changes

#### m2 — If one quantity goes up while the other goes down, the relationship is inverse proportion.

**Why it fails:** A decreasing relationship can have any rule. The amount y = 100 − 2x falls as x rises, but its product with x is not constant: at x = 5, xy = 450, and at x = 10, xy = 800. Inverse proportion requires the product to stay the same, because the same total is being shared among a changing number.

**Correction:** Multiply the pair, not just compare the direction. If xy is constant, the relationship is inverse; if the product changes, the decline is caused by something else.

**Contrast — wrong:** the tank is emptying, so the time and volume are inversely proportional

**Contrast — right:** the volume falls, but only a constant product would make the relationship inverse

#### m3 — The constant of proportionality is the amount added each time, so a table with equal steps is proportional.

**Why it fails:** Equal steps mean the output changes by the same amount for each unit, which is a constant difference, not a constant quotient. The sequence 3, 6, 9, 12 has equal steps but the quotient y/x changes: 3/1, 6/2, 9/3 and 12/4 are all 3, so that one happens to be proportional; the sequence 5, 8, 11, 14 has equal steps but quotients 5, 4, 3.67 and 3.5, so it is not. The difference alone cannot decide.

**Correction:** Find k by dividing one output by its input, then test the same quotient on another pair. A constant difference is not the same as a constant ratio.

**Contrast — wrong:** 5, 8, 11, 14 has a constant step of 3, so it is proportional

**Contrast — right:** 5/1, 8/2, 11/3 and 14/4 are not equal, so the relationship is not proportional

### 8. Guided practice

#### p1

**Prompt:** Four pens cost £6. At the same rate, how much do ten pens cost?

**Hint:** Find the cost of one pen first by dividing £6 by four. Then multiply that unit rate by ten.

**Answer:** £15, because one pen costs £1.50 and 10 × 1.50 = 15

**Feedback if correct:** You found the unit rate and used it for the new number of pens, so the same quotient applies to both pairs.

**Feedback if incorrect:** Four pens cost £6, so one pen costs £1.50. Ten pens cost ten times that, which is £15; adding £6 and £9 without a unit rate would only work by coincidence.

#### p2

**Prompt:** Five machines take twelve hours to complete a job. How long would six machines take at the same rate?

**Hint:** The total work is constant. Multiply the machines by the hours to find the number of machine-hours, then divide by six.

**Answer:** 10 hours, because 5 × 12 = 60 machine-hours and 60 ÷ 6 = 10

**Feedback if correct:** You used the constant product, not a constant difference, so the extra machine shortened the job by the right amount.

**Feedback if incorrect:** The fixed work is 5 × 12 = 60 machine-hours. Six machines would take 60 ÷ 6 = 10 hours, not twelve minus one; the product is what stays constant.

#### p3

**Prompt:** y is inversely proportional to x. When x = 5, y = 8. Find y when x = 10.

**Hint:** Inverse proportion has a constant product. Multiply 5 by 8 to find the constant, then divide by the new x.

**Answer:** 4, because 5 × 8 = 40 and 40 ÷ 10 = 4

**Feedback if correct:** You used the constant product and checked that 10 × 4 is also 40, so the inverse relationship is preserved.

**Feedback if incorrect:** The constant is 5 × 8 = 40. The new value is 40 ÷ 10 = 4, not 8 ÷ 2 by guesswork; doubling x halves y only because the product stays 40.

### 9. Independent assessment

#### a1 — `short-answer`

**Prompt:** y is directly proportional to x. When x = 6, y = 18. Find y when x = 10.

**Model answer (reviewer copy):** 30

**Marking criteria:**

- Finds the constant from 18 ÷ 6 = 3.
- Multiplies the constant by 10 to obtain 30.

**Accepted deterministic answers:** `30`

#### a2 — `constructed-response`

**Prompt:** A learner says y = 3x + 2 is a direct proportion because doubling x doubles the 3x part. Explain why the relationship is not directly proportional.

**Model answer (reviewer copy):** Direct proportion requires the quotient y/x to be constant and the graph to pass through the origin. For y = 3x + 2, when x = 1, y = 5 and y/x = 5; when x = 2, y = 8 and y/x = 4. The quotient has changed, so the relationship is not direct. Doubling x doubles 3x, but the fixed 2 is still paid once; 2(3x + 2) = 6x + 4, while substituting 2x into the rule gives 6x + 2, so the outputs are not in the same ratio. The line is straight but its intercept is 2, not 0.

**Marking criteria:**

- States that direct proportion requires a constant quotient and a graph through the origin.
- Computes two quotients, such as 5/1 and 8/2, and shows they differ.
- Explains that the fixed 2 does not scale with x, so doubling x does not double y.

#### a3 — `short-answer`

**Prompt:** y is inversely proportional to x. When x = 3, y = 4. Find y when x = 6.

**Model answer (reviewer copy):** 2

**Marking criteria:**

- Finds the constant product 3 × 4 = 12.
- Divides 12 by the new x to obtain 2.

**Accepted deterministic answers:** `2`

### 10. Transfer

#### t1

**Prompt:** A cyclist's journey time is inversely proportional to average speed for a fixed route. At 15 km/h the journey takes 40 minutes. How long does it take at 20 km/h, and what average speed would make the journey take 30 minutes?

**Why it transfers:** The learner has to choose inverse proportion from a real situation, find the constant from a time and a speed rather than from a count of workers, and then use the same constant in two directions. The units are different from the lesson's examples, so the invariant has to be understood rather than matched to a remembered table.

**Answer:** The constant is 15 × 40 = 600 speed-minutes. At 20 km/h the time is 600 ÷ 20 = 30 minutes. For a 30-minute journey the speed is 600 ÷ 30 = 20 km/h, which agrees with the first result. The product stays 600 because the route is the same; doubling the speed halves the time, but only because the distance is fixed.

**Marking criteria:**

- Multiplies 15 by 40 to find the constant 600.
- Divides 600 by 20 to get 30 minutes.
- Divides 600 by 30 to get 20 km/h.
- Explains that the fixed distance makes the product constant, so the relationship is inverse.

### 11. Retrieval

#### x1 — next-day

**Prompt:** If y is directly proportional to x and y = 12 when x = 4, find y when x = 7.

**Answer:** 21. The constant is 12 ÷ 4 = 3, so y = 3 × 7 = 21; the quotient is 3 for both pairs.

#### x2 — week-later

**Prompt:** If y is inversely proportional to x and y = 5 when x = 6, find y when x = 15.

**Answer:** 2. The product is 30, so y = 30 ÷ 15 = 2; the product is 30 for both pairs.

#### x3 — month-later

**Prompt:** A table gives x = 1, 2, 3 and y = 4, 7, 10. Is y directly proportional to x? Explain in one sentence.

**Answer:** No: the quotients are 4, 3.5 and 3.33, so they are not constant. The equal differences of 3 show a linear relationship, not a proportional one.

### 12. Summary and accessibility alternatives

- Direct proportion means y = kx: the quotient y/x is constant, k is the unit rate, and the graph passes through the origin.
- Inverse proportion means xy = k: the product is constant, and y = k/x, so doubling one quantity halves the other when the total is fixed.
- A straight line or a decreasing graph is not enough; test the quotient or the product before naming the relationship.
- Find the constant from one complete pair, then use it to calculate any other pair and check that the invariant still holds.

- **screen-reader:** Each relationship is read as a sentence — y equals k times x, or x times y equals k — and every table is described by its pairs rather than by column position alone.
- **dyslexia:** The test is written on its own line before the algebra: divide for direct proportion, multiply for inverse proportion, then write the equation.
- **motor:** Answers are typed as a value or a short equation; no graph plotting or dragging is required to demonstrate the relationship.
- **colour-vision:** The graph is described by its intercept and its constant quotient, so a colour difference between lines is never the only evidence.

### 13. Provenance

- **openmind-authored** — openmind-authored — licence: OpenMind internal — reproduction: none
  - Written for OpenMind.
  - Note: All explanations, tables, worked examples, practice items and the cycling transfer are original to OpenMind.
- **gcse-mathematics-subject-content** — curriculum-citation — licence: official-reference — reproduction: none
  - Scope cited against the published GCSE mathematics subject content for ratio, proportion and rates of change.

### Review record — Proportion

**Lesson:** `proportion`

**Exact version:** `1.0.0`

**Content hash:** `3a3ec029f96c718603163b1a2b1fda457ef4e667a1a0d177c698bc41513b58e7`

**Current status:** `machine_checked`

**Record online:** `/lesson-review/proportion` (signed-in teaching account)

**Reviewer name:** ______________________________

**Role / qualification:** ______________________________

**Date:** ______________________________

| Criterion | Specific finding (name the section) | Severity | Required change |
| --- | --- | --- | --- |
| Subject accuracy |  |  |  |
| Curriculum accuracy |  |  |  |
| Teaching quality |  |  |  |
| Worked-example quality |  |  |  |
| Assessment validity |  |  |  |
| Accessibility |  |  |  |

**Overall verdict:** ______________________________

**Anything the reviewer believes is unsafe, misleading or unsuitable for the stated level:**

______________________________________________________________________________

Findings recorded online become improvement tasks automatically. A blocking
finding makes an approval impossible; a completed task does not approve a later
version.

The verdict is deliberately blank. Only a qualified reviewer who has read the
exact version above may complete it. A review of an earlier version does not
apply to this hash.

---

## Sequences

- **Concept:** `sequences`
- **Subject:** maths
- **Version:** `1.0.0`
- **Content hash:** `88a103da99de0cd9a6671a237ee07496044de3763bd66935167f3e2fbc9c041a`
- **Declared status:** `draft`
- **Catalogue status:** `machine_checked`
- **Current human review:** `unreviewed`
- **Curriculum reference:** GCSE Mathematics, algebra: sequences, term-to-term and position-to-term rules, arithmetic sequences, geometric sequences and the nth term
- **Level:** Key Stage 3 to GCSE Foundation
- **Scope note:** Scope cited against the published subject content. The lesson treats a sequence as a function from position to term, derives the nth term of an arithmetic sequence from its common difference, and includes geometric sequences and a quadratic contrast. No specification or textbook text is reproduced.

### Authorship and evidence

- OpenMind curriculum team — instructional author — ai-assisted-then-edited — 2026-11-09

- **Teacher reviews on record:** 0
- **Learner-testing records on record:** 0

### 1. Objectives and evidence

**Objective:** Describe a sequence by a term-to-term rule and use it to find the next terms, including arithmetic and geometric sequences.

**Evidence sought:** For 4, 7, 10, 13 the learner states the rule add 3 and finds 16 and 19; for 3, 6, 12, 24 the learner states multiply by 2 and finds 48, distinguishing a common difference from a common ratio.

**Objective:** Find and use a position-to-term rule for an arithmetic sequence, and explain why the coefficient of n is the common difference.

**Evidence sought:** The learner derives the nth term of 5, 9, 13, 17 as 4n + 1, checks it at n = 1 and n = 4, and uses it to find the 20th term without listing twenty terms.

**Objective:** Use a position-to-term rule to find a missing term or a distant term, and test whether a proposed rule generates the given sequence.

**Evidence sought:** The learner finds the missing term in 2, 7, 12, ?, 22 as 17 from the rule 5n − 3, and rejects 4n for 5, 9, 13, 17 because it gives 4, 8, 12, 16.

### 2. Prior knowledge

Prerequisite concepts: none declared.

**d1.** What is the value of 4n when n = 3?

Expected answer: 12, because 4n means 4 multiplied by n, and 4 × 3 = 12. The letter is a placeholder for the position number.

**d2.** What is the difference between 7 and 13, and between 13 and 19?

Expected answer: Both differences are 6. Subtracting the earlier number from the later one gives the change from one term to the next.

### 3. Introduction

A theatre has 20 seats in the first row, 23 in the second, 26 in the third and 29 in the fourth. You could add three seats row by row until you reach row 30, but that is twenty-six additions. The position-to-term rule is faster: the number of seats is 3n + 17, so row 30 has 3 × 30 + 17 = 107 seats. The pattern is not a list to continue by memory; it is a rule that turns a position into a term.

Sequences are the first place algebra is used to describe a pattern rather than solve an equation. The term-to-term rule answers what happens next, and the position-to-term rule answers what happens at any position. Learners often stop at the first and then try to count their way to a distant term, which is both slow and easy to lose. This lesson separates the two rules, derives the nth term from the common difference, and uses the same position idea for geometric and quadratic patterns so that 'sequence' does not become a synonym for 'add the same number'.

### 4. Explanation

#### A sequence is ordered, and a rule explains the order

A sequence is a list of numbers in a definite order, and each number is called a term. The order matters: 2, 5, 8 is not the same sequence as 8, 5, 2. A term-to-term rule describes how to get from one term to the next. In 4, 7, 10, 13 the rule is add 3, so the next terms are 16 and 19. In 3, 6, 12, 24 the rule is multiply by 2, so the next terms are 48 and 96. The first is an arithmetic sequence because the difference is constant; the second is geometric because the ratio is constant.

Writing the rule in words is not a preliminary to the mathematics; it is the mathematics. A rule that says add 3 predicts every later term, while a list of four terms predicts nothing beyond itself. The difference between consecutive terms is found by subtracting, and the ratio is found by dividing one term by the previous one. Arithmetic sequences have a common difference; geometric sequences have a common ratio. A sequence can be neither: the square numbers 1, 4, 9, 16 have differences 3, 5, 7, which change, so their rule is not a single addition.

#### The nth term turns a position into a term

The position of a term is its term number: the first term is at position 1, the second at position 2, and the general position is n. A position-to-term rule, or nth term, is an expression that gives the term directly from n. For the arithmetic sequence 5, 9, 13, 17 the common difference is 4, so the rule begins 4n. At n = 1, 4n gives 4, but the first term is 5, so the rule needs one more: 4n + 1. Checking n = 2 gives 9 and n = 4 gives 17, so the adjustment works for every term.

The coefficient of n is the common difference because each step from one position to the next adds one more copy of that difference. The constant at the end is the adjustment that makes the first term correct. This gives a reliable method: find the difference, write that number before n, compare the first term with the value the coefficient alone gives, and add or subtract the difference. The method is not a trick to memorise; it follows from the sequence being a straight-line relationship between position and term.

#### Not every sequence is arithmetic

Geometric sequences multiply by a fixed ratio instead of adding a fixed difference. The sequence 3, 6, 12, 24 has ratio 2, so its nth term is 3 × 2ⁿ⁻¹: the first term is 3, and each later position doubles one more time. The exponent is n − 1 because the first term has not been doubled yet. A geometric sequence can grow quickly, and its graph curves upward rather than forming a straight line.

Quadratic sequences have a constant second difference. For 1, 4, 9, 16, the first differences are 3, 5, 7 and the second differences are 2, 2, so the rule contains an n² term rather than a single n term. A learner who tries to fit 4n + something to a quadratic sequence will find that no constant works. The first step is always to inspect the differences: a constant first difference means arithmetic, a constant second difference means quadratic, and a constant ratio means geometric.

### 5. Representations

#### r1 — `maths.expression`

The term-to-term rule describes the step; the position-to-term rule describes the term at any position. The second is what makes a distant term reachable without listing every term before it.

```text
4, 7, 10, 13, ...   ·   term-to-term: add 3   ·   position-to-term: 3n + 1   ·   n = 10 → 31
```

**Caption:** The common difference is 3, so the rule starts with 3n. At n = 1, 3n is 3 but the first term is 4, so the rule is 3n + 1. The tenth term is 31 without listing ten terms.

#### r2 — `maths.expression`

A table makes the position and the term separate quantities. Substituting the position into the rule must reproduce the term in the same column.

```text
n: 1, 2, 3, 4   ·   term: 5, 9, 13, 17   ·   rule: 4n + 1   ·   4(1) + 1 = 5, 4(4) + 1 = 17
```

**Caption:** The table is the check on the rule. Every pair must satisfy the same expression, so a rule that fits the first term but fails the fourth has not been found; it has only been guessed.

#### r3 — `maths.number-line`

Plotting the terms against their positions shows whether the sequence is linear. An arithmetic sequence gives equally spaced points on a straight line; a geometric sequence curves upward.

```text
positions 1, 2, 3, 4 → terms 3, 6, 12, 24   ·   ratio 2   ·   nth term 3 × 2ⁿ⁻¹
```

**Caption:** The points for 3, 6, 12, 24 do not rise by equal steps; they double. The ratio is constant even though the difference is not, which is why the sequence is geometric rather than arithmetic.

### 6. Worked examples

#### w1

**Prompt:** Find the nth term of the sequence 5, 9, 13, 17.

1. **Move:** Subtract consecutive terms: 9 − 5 = 4, 13 − 9 = 4 and 17 − 13 = 4, so the common difference is 4.
   **Why:** The common difference is the amount added at each position. It is also the coefficient of n, because moving one position along adds one more copy of that difference.
2. **Move:** Write 4n and test the first position: at n = 1, 4n = 4, but the first term is 5, so the rule needs an adjustment of +1.
   **Why:** The coefficient alone gives the right step but the wrong starting value. The constant is found by comparing the first term with the value at n = 1, not by guessing.
3. **Move:** The rule is 4n + 1. Check n = 4: 4 × 4 + 1 = 17, so the fourth term is 17, matching the sequence.
   **Why:** A rule is only correct if it reproduces every given term. Checking the fourth term catches an adjustment that happened to fit only the first one.

**Answer:** 4n + 1

#### w2

**Prompt:** Find the next two terms and the nth term of 3, 6, 12, 24.

1. **Move:** Divide each term by the one before it: 6 ÷ 3 = 2, 12 ÷ 6 = 2 and 24 ÷ 12 = 2, so the common ratio is 2.
   **Why:** A geometric sequence has a constant ratio, not a constant difference. Dividing is the test that distinguishes it from an arithmetic sequence whose differences happen to grow.
2. **Move:** Multiply the last term by 2 twice: 24 × 2 = 48 and 48 × 2 = 96, so the next two terms are 48 and 96.
   **Why:** The term-to-term rule applies the same multiplier at every step. Applying it twice gives the next two terms without needing the nth term first.
3. **Move:** The first term is 3 and each later position doubles one more time, so the nth term is 3 × 2ⁿ⁻¹. Check n = 4: 3 × 2³ = 24, the fourth term.
   **Why:** The exponent is n − 1 because the first term has not yet been doubled. Substituting the fourth position and recovering 24 checks both the first term and the number of doublings.

**Answer:** 48 and 96; nth term 3 × 2ⁿ⁻¹

#### w3

**Prompt:** The sequence is 2, 7, 12, ?, 22. Find the missing term and the nth term.

1. **Move:** Find the common difference from the terms on either side of the gap: 7 − 2 = 5, and 22 is two steps after 12, so 22 − 12 = 10 and each step is 5.
   **Why:** The gap does not prevent the difference being found. The known terms are enough to establish the step, and the missing term must fit the same rule.
2. **Move:** Add 5 to 12 to get 17, and check 17 + 5 = 22. The missing term is 17.
   **Why:** The missing term is one step after 12, so the common difference gives it directly. The following term confirms that the same difference continues.
3. **Move:** The difference is 5, so start with 5n. At n = 1, 5n = 5 but the first term is 2, so subtract 3: the rule is 5n − 3. Check n = 4: 5 × 4 − 3 = 17.
   **Why:** The coefficient is the difference and the constant adjusts the first term. Checking the missing position reproduces 17, so the rule and the gap agree.

**Answer:** 17; nth term 5n − 3

### 7. Misconceptions

#### m1 — The nth term is just the common difference multiplied by n.

**Why it fails:** The coefficient gives the right step but not necessarily the right starting value. For 5, 9, 13, 17 the difference is 4, but 4n gives 4, 8, 12, 16, which is the sequence shifted down by one. The first term is 5, so the rule needs +1. Without the adjustment, every term is wrong even though the gaps are right.

**Correction:** Find the difference, write it before n, then compare the first term with the value at n = 1 and adjust by the difference. Check the rule at a later term as well.

**Contrast — wrong:** 5, 9, 13, 17 has nth term 4n

**Contrast — right:** 5, 9, 13, 17 has nth term 4n + 1, because 4(1) + 1 = 5

#### m2 — A sequence that grows quickly is arithmetic if the differences look like a pattern.

**Why it fails:** Arithmetic sequences have a constant first difference. The sequence 3, 6, 12, 24 has differences 3, 6 and 12, which are not constant; its ratio is 2 every time. It is geometric, not arithmetic. Calling it arithmetic because the terms increase would predict 36 next, while the actual rule gives 48.

**Correction:** Test the differences and the ratios. A constant difference means arithmetic; a constant ratio means geometric. If neither is constant, the sequence is a different kind, such as quadratic.

**Contrast — wrong:** 3, 6, 12, 24 adds increasing amounts, so it is arithmetic

**Contrast — right:** 3, 6, 12, 24 multiplies by 2 each time, so it is geometric

#### m3 — The 10th term is found by substituting the term's value into the rule instead of its position.

**Why it fails:** The input to an nth-term rule is the position, not the term. For 4n + 1, the 10th term is 4 × 10 + 1 = 41. Substituting 41 into the rule gives 165, which is the term at position 41, not the 10th term. The confusion reverses the direction of the rule.

**Correction:** Decide whether the number you have is a position or a term. To find a term, substitute its position for n. To find which position a term occupies, solve the rule equal to that term.

**Contrast — wrong:** the 10th term of 4n + 1 is 4(41) + 1 = 165

**Contrast — right:** the 10th term is 4(10) + 1 = 41

### 8. Guided practice

#### p1

**Prompt:** Find the nth term of 6, 10, 14, 18, and use it to find the 20th term.

**Hint:** The common difference is 4, so start with 4n. Compare 4n at n = 1 with the first term, then adjust.

**Answer:** 4n + 2; the 20th term is 4 × 20 + 2 = 82

**Feedback if correct:** The difference gave the coefficient, the first term gave the adjustment, and substituting n = 20 gave the distant term without listing it.

**Feedback if incorrect:** The difference is 4, but 4n gives 4 at n = 1, so the rule is 4n + 2. The 20th term is 82, not 80; the adjustment applies at every position.

#### p2

**Prompt:** Find the next two terms of 2, 6, 18, 54.

**Hint:** Divide one term by the previous term. If the ratio is constant, multiply the last term by it twice.

**Answer:** 162 and 486, because the common ratio is 3

**Feedback if correct:** You tested the ratio rather than the difference, so you recognised a geometric sequence and applied the multiplier twice.

**Feedback if incorrect:** The terms multiply by 3 each time: 6 ÷ 2 = 3, 18 ÷ 6 = 3 and 54 ÷ 18 = 3. The next terms are 162 and 486, not 58 and 62.

#### p3

**Prompt:** Find the nth term of 10, 16, 22, 28, and use it to find the 50th term.

**Hint:** The common difference is 6, so start with 6n. Compare 6n at n = 1 with the first term, then adjust.

**Answer:** 6n + 4; the 50th term is 6 × 50 + 4 = 304

**Feedback if correct:** The difference gave the coefficient, the first term gave the adjustment, and substituting n = 50 reached the distant term directly.

**Feedback if incorrect:** The difference is 6 and 6n gives 6 at n = 1, so the rule is 6n + 4. The 50th term is 304, not 300; the adjustment applies at every position.

### 9. Independent assessment

#### a1 — `short-answer`

**Prompt:** A sequence has nth term 5n − 2. Find the 12th term.

**Model answer (reviewer copy):** 58

**Marking criteria:**

- Substitutes n = 12 into the position-to-term rule.
- Calculates 5 × 12 − 2 = 58.

**Accepted deterministic answers:** `58`

#### a2 — `constructed-response`

**Prompt:** The sequence is 3, 7, 11, 15. A learner says the nth term is 4n. Explain why that rule is wrong and give the correct rule.

**Model answer (reviewer copy):** The common difference is 4, so the rule starts with 4n, but at n = 1, 4n gives 4 while the first term is 3. The rule must be shifted down by 1: 4n − 1. Checking n = 2 gives 7, n = 3 gives 11 and n = 4 gives 15, so the adjustment works for every term. The rule 4n would generate 4, 8, 12, 16, which has the right gaps but the wrong starting value.

**Marking criteria:**

- Identifies the common difference of 4 and the correct coefficient 4n.
- Compares 4n at n = 1 with the first term, 3, and finds the adjustment −1.
- Gives 4n − 1 and checks at least one later term.

#### a3 — `short-answer`

**Prompt:** Find the next term of 80, 40, 20, 10.

**Model answer (reviewer copy):** 5

**Marking criteria:**

- Recognises the common ratio of 1/2 rather than a constant difference.
- Multiplies 10 by 1/2 to obtain 5.

**Accepted deterministic answers:** `5`

### 10. Transfer

#### t1

**Prompt:** A tiling pattern uses 5 tiles in figure 1, 8 tiles in figure 2 and 11 tiles in figure 3. Find the nth-term rule for the number of tiles, the number in figure 20, and the first figure that uses more than 100 tiles.

**Why it transfers:** The learner has to move from a visual growth pattern to an arithmetic sequence, then use the rule in two directions: forwards to a distant figure and backwards to find which position first crosses a bound. The last question cannot be answered by continuing the list, which is why the position-to-term rule is the tool.

**Answer:** The common difference is 3, so the rule is 3n + 2: at n = 1, 3n is 3 and the first figure has 5, so the adjustment is +2. Figure 20 has 3 × 20 + 2 = 62 tiles. For more than 100, solve 3n + 2 > 100, so 3n > 98 and n > 32.67; the first whole position is n = 33, with 3 × 33 + 2 = 101 tiles. Figure 32 has 98 tiles, so figure 33 is the first to exceed 100.

**Marking criteria:**

- Finds the common difference 3 and writes 3n + 2, checking it against at least one figure.
- Substitutes n = 20 to get 62 tiles.
- Solves or tests the inequality to find n = 33, and checks that figure 32 has 98 tiles.
- Explains why the answer is the first whole position rather than 32.67.

### 11. Retrieval

#### x1 — next-day

**Prompt:** Find the next two terms of 11, 15, 19, 23.

**Answer:** 27 and 31, because the common difference is 4. The nth term would be 4n + 7, and substituting n = 5 and n = 6 gives 27 and 31.

#### x2 — week-later

**Prompt:** Find the nth term of 7, 12, 17, 22.

**Answer:** 5n + 2. The difference is 5, and 5n at n = 1 is 5, which is 2 less than the first term.

#### x3 — month-later

**Prompt:** Is 2, 6, 18, 54 arithmetic or geometric? Give the rule.

**Answer:** Geometric, because each term is multiplied by 3. The nth term is 2 × 3ⁿ⁻¹, and the next term is 162.

### 12. Summary and accessibility alternatives

- A term-to-term rule tells you how to get the next term; a position-to-term rule gives any term directly from its position.
- An arithmetic sequence has a constant difference, so its nth term is of the form an + b, where a is the common difference.
- A geometric sequence has a constant ratio, so its nth term multiplies the first term by a power of that ratio.
- Find the difference or ratio first, then check the rule at more than one position; a rule that fits only the first term is a guess.
- A distant term is found by substituting its position, not by continuing the list.

- **screen-reader:** Each sequence is read as an ordered list with its positions named, and every rule is read as a sentence — for example, the nth term is four n plus one — rather than as a string of symbols.
- **dyslexia:** The difference and the adjustment are written on separate lines, so the rule is built in two visible steps rather than appearing as one unexplained expression.
- **motor:** Terms and rules are typed; no drag-and-drop ordering or interactive graph manipulation is required.
- **colour-vision:** The table and the graph are both described by their values and their constant difference or ratio, so no pattern depends on colour alone.

### 13. Provenance

- **openmind-authored** — openmind-authored — licence: OpenMind internal — reproduction: none
  - Written for OpenMind.
  - Note: All explanations, examples, practice, assessments and the tiling transfer are original to OpenMind.
- **gcse-mathematics-subject-content** — curriculum-citation — licence: official-reference — reproduction: none
  - Scope cited against the published GCSE mathematics subject content for algebra and sequences.

### Review record — Sequences

**Lesson:** `sequences`

**Exact version:** `1.0.0`

**Content hash:** `88a103da99de0cd9a6671a237ee07496044de3763bd66935167f3e2fbc9c041a`

**Current status:** `machine_checked`

**Record online:** `/lesson-review/sequences` (signed-in teaching account)

**Reviewer name:** ______________________________

**Role / qualification:** ______________________________

**Date:** ______________________________

| Criterion | Specific finding (name the section) | Severity | Required change |
| --- | --- | --- | --- |
| Subject accuracy |  |  |  |
| Curriculum accuracy |  |  |  |
| Teaching quality |  |  |  |
| Worked-example quality |  |  |  |
| Assessment validity |  |  |  |
| Accessibility |  |  |  |

**Overall verdict:** ______________________________

**Anything the reviewer believes is unsafe, misleading or unsuitable for the stated level:**

______________________________________________________________________________

Findings recorded online become improvement tasks automatically. A blocking
finding makes an approval impossible; a completed task does not approve a later
version.

The verdict is deliberately blank. Only a qualified reviewer who has read the
exact version above may complete it. A review of an earlier version does not
apply to this hash.

---

## Index laws

- **Concept:** `indices-intro`
- **Subject:** maths
- **Version:** `1.0.0`
- **Content hash:** `f6fe1d7628e7ac144566c6a084998f107a8d8f0c12a8475d3df3f1db9d3e6ef3`
- **Declared status:** `draft`
- **Catalogue status:** `machine_checked`
- **Current human review:** `unreviewed`
- **Curriculum reference:** GCSE Mathematics, number: integer and fractional indices, roots, and the laws of indices for multiplying and dividing powers
- **Level:** Key Stage 3 to GCSE Foundation and Higher
- **Scope note:** Scope cited against the published GCSE mathematics subject content for number. The lesson derives the laws rather than asking for recall, and keeps the same-base condition explicit. No specification, textbook or commercial lesson text is reproduced.

### Authorship and evidence

- OpenMind curriculum team — instructional author — ai-assisted-then-edited — 2026-11-09

- **Teacher reviews on record:** 0
- **Learner-testing records on record:** 0

### 1. Objectives and evidence

**Objective:** Explain an index as a count of repeated factors, and evaluate a power without treating the index as a multiplier.

**Evidence sought:** The learner says 3⁴ is 3 × 3 × 3 × 3 = 81 rather than 12, explains why 2¹⁰ is 1024 rather than 20, and reads 2x³ as 2 × x³ rather than (2x)³.

**Objective:** Use the multiplication, division and power-of-a-power laws on expressions with the same base, and state why each law is true.

**Evidence sought:** The learner simplifies 3a² × 4a³ to 12a⁵, 8x⁵ ÷ 2x² to 4x³ and (2x³)² × x⁴ to 4x¹⁰, deriving the index arithmetic from written copies and refusing to combine 2³ × 3² into one power.

**Objective:** Explain and evaluate zero, negative and fractional indices from the division law and the reverse of the multiplication law.

**Evidence sought:** The learner derives a⁰ = 1 from aⁿ ÷ aⁿ, evaluates 2⁻³ as 1/8, and evaluates 27²⁄³ as 9 by taking the cube root before squaring, stating which number is the root and which is the power.

### 2. Prior knowledge

Prerequisite concepts: order-ops.

**d1.** Evaluate 2 + 3 × 4.

Expected answer: 14. Multiplication is evaluated before addition, so 3 × 4 = 12 and 2 + 12 = 14. Reading left to right would give 20, which is the answer to the next check, not this one.

**d2.** Evaluate (2 + 3) × 4.

Expected answer: 20. The bracket is evaluated first: 2 + 3 = 5, then 5 × 4 = 20. Brackets change which operation acts first, which is the same reason a bracket changes the base of a power in this lesson.

### 3. Introduction

A sheet of paper is about 0.1 mm thick. Fold it in half ten times, in principle, and the stack is 0.1 × 2¹⁰ = 102.4 mm thick — about the width of an adult hand. The number of layers is 1024, not 10 × 2 = 20. An index counts how many times the base is multiplied by itself, so a repeated doubling grows far faster than a repeated addition. The same shorthand makes 2⁵ × 2³ equal to 2⁸, while 2⁵ + 2³ is 40: the multiplication law combines copies, and addition does not.

An index is not a new operation; it is shorthand for repeated multiplication. That is why the laws are simple: a² × a³ has five copies of a written down, a⁵ ÷ a² cancels two of them, and (a²)³ is three groups of two copies. The laws hold only when the base is the same, because copies of different numbers cannot be counted together. Zero, negative and fractional indices are not three exceptions bolted onto the rules: a⁰ follows from dividing a power by itself, a⁻² follows from continuing the subtraction below zero, and a¹⁄² follows from asking what number multiplied by itself gives a. The lesson ends with one check that works on any doubtful claim: substitute a small number and evaluate both sides.

### 4. Explanation

#### An index counts copies, it does not multiply

aⁿ means n copies of a multiplied together: a⁵ = a × a × a × a × a. The a is the base and the 5 is the index, or exponent. The index counts copies; it is not a multiplier. 3⁴ = 3 × 3 × 3 × 3 = 81, not 3 × 4 = 12, and 2¹⁰ = 1024, not 20. This is why powers grow so much faster than multiples: doubling the index squares the value, because a²ⁿ = (aⁿ)², while doubling a multiplier only doubles the result.

The notation is already present in the units used for area and volume. A square of side 5 cm has area 5² = 25 cm², because the area is 5 × 5 squares of 1 cm²; a cube of side 5 cm has volume 5³ = 125 cm³. In algebra the same shorthand keeps expressions short: x · x · x is x³. The power binds to what it is written on, so 2x³ means 2 × x³, with the coefficient 2 outside the power. A bracket changes the base: (2x)³ = 8x³, while 2x³ = 2 × x³.

#### Multiplying adds the counts, dividing subtracts them

a² × a³ = (a × a)(a × a × a) = a⁵. Multiplication needs no new rule: the two groups of copies are written one after the other, so their counts add. In general aᵐ × aⁿ = aᵐ⁺ⁿ, provided the base is the same. That condition is not decoration: 2³ × 2² = 2⁵, but 2³ × 3² cannot be written as one power, because the copies are of different numbers. Its value is 8 × 9 = 72, not 6⁵.

Division cancels copies: a⁵ ÷ a² = (a × a × a × a × a)/(a × a) = a³, so aᵐ ÷ aⁿ = aᵐ⁻ⁿ for a ≠ 0. Coefficients are handled separately because they are not powers of the base: 3a² × 4a³ = (3 × 4)(a² × a³) = 12a⁵, and 8x⁵ ÷ 2x² = 4x³. A power raised to a power multiplies the indices, because (a²)³ means three copies of a², which is six copies of a: (aᵐ)ⁿ = aᵐⁿ. That is a different law from multiplication, and confusing the two is the commonest index error.

#### Zero and negative indices continue the pattern

a⁰ = 1 for any non-zero base. It is not a definition invented to fill a gap: aⁿ ÷ aⁿ = aⁿ⁻ⁿ = a⁰, and any non-zero quantity divided by itself is 1. For example 5³ ÷ 5³ = 125 ÷ 125 = 1, so 5⁰ = 1. The base must not be zero, because 0ⁿ ÷ 0ⁿ would divide by zero; 0⁰ is undefined, and so is 0 raised to a negative power.

A negative index means a reciprocal, not a negative value. The subtraction law continues below zero: 2² ÷ 2⁵ = 2⁻³, and the same division is 4 ÷ 32 = 1/8, so 2⁻³ = 1/8. In general a⁻ⁿ = 1/aⁿ for a ≠ 0, and the result is positive whenever a is positive. The descending powers of 2 show the pattern without any algebra: 32, 16, 8, 4, 2, 1, 1/2, 1/4, each term half the one before. A negative index moves the power across the fraction bar; it does not change the sign of the answer.

#### Fractional indices, and the two traps that remain

A fractional index is a root. If a¹⁄² × a¹⁄² = a¹ by the multiplication law, then a¹⁄² must be the number that squares to a, which is √a for a ≥ 0. The denominator of the fraction is the root and the numerator is the power: aᵐ⁄ⁿ = (ⁿ√a)ᵐ. So 16³⁄⁴ = (⁴√16)³ = 2³ = 8, and 27²⁄³ = (³√27)² = 3² = 9. A fractional index does not mean multiply by the fraction: 16³⁄⁴ is 8, not 12.

Two traps survive every rule above. The first is where the power binds: 2x³ means 2 × x³, while (2x)³ means (2x)(2x)(2x) = 8x³. With x = 2 the first is 16 and the second is 64, so a missing bracket is not a cosmetic difference. The second is applying a law to the wrong operation: a² × a³ = a⁵, but a² + a³ is not a⁵ — with a = 2 it is 4 + 8 = 12, while a⁵ is 32. When a claimed law is in doubt, substitute a small number and evaluate both sides. A rule that fails for a = 2 is not a rule.

### 5. Representations

#### r1 — `maths.expression`

Every law is visible when the copies are written out. The multiplication law joins two groups, the division law cancels copies, and the power law counts groups of copies.

```text
a² × a³ = (a·a)(a·a·a) = a⁵   ·   a⁵ ÷ a² = a³   ·   (a²)³ = a⁶   ·   3a² × 4a³ = 12a⁵
```

**Caption:** The first line has two copies then three copies, five in total, so the indices add. The second cancels two of five, leaving three, so they subtract. The third is three groups of two copies, six in total, so they multiply. The coefficient 3 × 4 is separate because it counts whole terms, not copies of a.

#### r2 — `maths.expression`

A descending list of powers shows zero and negative indices as the continuation of the same pattern, not as new definitions.

```text
2⁵ 32 · 2⁴ 16 · 2³ 8 · 2² 4 · 2¹ 2 · 2⁰ 1 · 2⁻¹ 1/2 · 2⁻² 1/4   ·   each term is the one before divided by 2
```

**Caption:** Every step divides by 2. Continuing past 2¹ forces 2⁰ = 1, then 2⁻¹ = 1/2 and 2⁻² = 1/4. The values stay positive; only the index becomes negative, because a negative index records a division rather than a negative number.

#### r3 — `maths.expression`

A fractional index is read in two parts: the denominator takes the root, then the numerator raises the result to a power.

```text
16³⁄⁴ = (⁴√16)³ = 2³ = 8   ·   27²⁄³ = (³√27)² = 3² = 9   ·   aᵐ⁄ⁿ = (ⁿ√a)ᵐ
```

**Caption:** The order is a choice, not a rule: the root can be taken before or after the power. Taking the root first keeps the numbers small — the fourth root of 16 is 2, then 2³ is 8 — while raising first would give the fourth root of 4096, which is the same 8 but harder to see.

### 6. Worked examples

#### w1

**Prompt:** Simplify 3a² × 4a³, and check the result with a = 2.

1. **Move:** Multiply the coefficients: 3 × 4 = 12.
   **Why:** The coefficient counts how many whole copies of a² and a³ there are. It is not a power of a, so the index law does not apply to it; it multiplies separately.
2. **Move:** Add the indices of the same base: a² × a³ = a²⁺³ = a⁵.
   **Why:** Writing the copies gives (a × a)(a × a × a), which is five copies of a. The multiplication sign has already combined the groups, so the counts add rather than multiply.
3. **Move:** Combine the two parts: 3a² × 4a³ = 12a⁵.
   **Why:** The expression is a product of a number and a power, so the coefficient and the power are multiplied, not added. Writing 12a⁵ keeps the coefficient outside the power, which is what the original expression meant.
4. **Move:** Check with a = 2: the original is 3 × 4 × 4 × 8 = 384, and 12a⁵ is 12 × 32 = 384. The coefficient 12 and the index 5 both survive the substitution.
   **Why:** A substitution evaluates the original and the simplified form independently. If either the coefficient or the index were wrong, the two numbers would differ, and no amount of tidiness in the working would hide it.

**Answer:** 12a⁵

#### w2

**Prompt:** Simplify (2x³)² × x⁴, and check the result with x = 2.

1. **Move:** Square the coefficient and double the index inside the bracket: (2x³)² = 2² × x⁶ = 4x⁶.
   **Why:** The bracket makes 2x³ the base, so the power applies to both factors: (2x³)(2x³). The coefficient is squared and the index is multiplied, because three copies squared is six copies.
2. **Move:** Multiply by x⁴: 4x⁶ × x⁴ = 4x⁶⁺⁴ = 4x¹⁰.
   **Why:** The bases are now both x, so the multiplication law adds the counts: six copies and four copies make ten. The coefficient 4 is unchanged because x⁴ has no coefficient of its own beyond 1.
3. **Move:** Check with x = 2: (2 × 8)² = 256, then 256 × 16 = 4096, and 4 × 2¹⁰ = 4 × 1024 = 4096. The coefficient 4 and the index 10 agree.
   **Why:** The check runs the original operations in their original order, including the bracket, so it catches a power applied to the wrong base as well as an index added instead of multiplied.

**Answer:** 4x¹⁰

#### w3

**Prompt:** Evaluate 27²⁄³ without a calculator.

1. **Move:** Read the denominator as a root: 27¹⁄³ = ∛27 = 3, because 3³ = 27.
   **Why:** The denominator 3 asks which number, multiplied by itself three times, gives 27. That is the cube root, and finding it first keeps the numbers small.
2. **Move:** Read the numerator as a power: raise the root to the power 2, so 3² = 9.
   **Why:** The numerator counts how many copies of the root are multiplied. Taking the root first and then squaring is the same as raising first and taking the root, but the arithmetic is easier.
3. **Move:** Check by reversing the index: 9³⁄² = (√9)³ = 3³ = 27, which returns the original base, so 27²⁄³ = 9 is consistent.
   **Why:** The two fractional indices 2/3 and 3/2 multiply to 1, so applying one and then the other must return the base. A wrong root or a wrong power would not come back to 27.
4. **Move:** State the result: 27²⁄³ = 9, with the denominator 3 giving the root 3 and the numerator 2 giving the square 9.
   **Why:** Naming which part of the index produced which number makes the method reusable. The answer 9 is not a coincidence of 27; it is the cube root squared.

**Answer:** 9

### 7. Misconceptions

#### m1 — a² × a³ = a⁶, because multiplying powers means multiplying the indices.

**Why it fails:** The multiplication sign has already combined the two groups of copies, so the counts add: (a × a)(a × a × a) is five copies, not six. Multiplying the indices is the rule for a power of a power, (a²)³ = a⁶, which is a different expression. With a = 2, a² × a³ is 4 × 8 = 32, which is 2⁵, not 2⁶ = 64.

**Correction:** Add the indices when multiplying powers of the same base, subtract them when dividing, and multiply them only when a power is raised to a power. Check with a small base if the three rules are being confused.

**Contrast — wrong:** a² × a³ = a⁶, so 2² × 2³ = 64

**Contrast — right:** a² × a³ = a⁵, so 2² × 2³ = 32

#### m2 — a⁻² is a negative number, because the index is negative.

**Why it fails:** The sign of the index records a division, not the sign of the value. Continuing the descending powers of 2 gives 2⁰ = 1, 2⁻¹ = 1/2 and 2⁻² = 1/4, all positive. The negative index moves the power below the fraction bar: a⁻² = 1/a², and for a positive base that is positive.

**Correction:** Rewrite a negative index as a reciprocal before evaluating: a⁻ⁿ = 1/aⁿ. Then decide the sign from the base, not from the index. A negative base raised to an even power is positive, but that is a separate rule about the base.

**Contrast — wrong:** 2⁻² = −4, because the index is negative

**Contrast — right:** 2⁻² = 1/2² = 1/4, which is positive

#### m3 — 2a³ = (2a)³, because the power applies to the whole term.

**Why it fails:** A power binds only to what it is written on. In 2a³ the base is a, and the coefficient 2 is outside the power; in (2a)³ the bracket makes 2a the base, so the 2 is cubed too. With a = 2, 2a³ is 2 × 8 = 16, while (2a)³ is 4³ = 64.

**Correction:** Write the bracket whenever the coefficient is meant to be included in the power. Read 2a³ as 2 × a³, and (2a)³ as 2³ × a³ = 8a³. Substituting a value distinguishes the two immediately.

**Contrast — wrong:** 2a³ = (2a)³ = 8a³

**Contrast — right:** 2a³ = 2 × a³, while (2a)³ = 8a³

### 8. Guided practice

#### p1

**Prompt:** Write 5⁴ × 5³ as a single power.

**Hint:** The base is the same in both factors. Count the copies of 5: four in the first power and three in the second.

**Answer:** 5⁷. The copies are 5 × 5 × 5 × 5 and 5 × 5 × 5, seven in total, so the indices add: 4 + 3 = 7. The value is 78,125, which is 5⁷.

**Feedback if correct:** You added the counts because the bases matched, which is exactly what the multiplication law says.

**Feedback if incorrect:** Add the indices rather than multiplying them: 5⁴ × 5³ = 5⁴⁺³ = 5⁷. Four copies and three copies make seven copies, while 5¹² would be four groups of three copies, a different expression.

#### p2

**Prompt:** Simplify 8x⁵ ÷ 2x².

**Hint:** Divide the coefficients separately from the powers of x, then subtract the indices because the operation is division.

**Answer:** 4x³. The coefficients give 8 ÷ 2 = 4, and the powers give x⁵⁻² = x³. Check with x = 2: 8 × 32 = 256 and 2 × 4 = 8, so the quotient is 32, which is 4 × 8 = 4x³.

**Feedback if correct:** You separated the coefficient from the power and subtracted the indices, then checked the result numerically.

**Feedback if incorrect:** Divide the coefficients and subtract the indices: 8 ÷ 2 = 4 and 5 − 2 = 3, so the answer is 4x³. Multiplying the indices would treat the division as a power of a power, which it is not.

#### p3

**Prompt:** Evaluate 2⁻³ and 16¹⁄².

**Hint:** A negative index means a reciprocal, so write 2⁻³ as 1/2³ before evaluating. A half index means the square root.

**Answer:** 2⁻³ = 1/2³ = 1/8, which is 0.125. 16¹⁄² = √16 = 4, because 4 × 4 = 16. Neither answer is negative: the negative index recorded a division, and the fractional index recorded a root.

**Feedback if correct:** You rewrote the negative index as a reciprocal and the fractional index as a root before doing any arithmetic.

**Feedback if incorrect:** Rewrite first: 2⁻³ = 1/2³ = 1/8, not −8, and 16¹⁄² = √16 = 4. The sign of the index and the size of the index do different jobs.

### 9. Independent assessment

#### a1 — `constructed-response`

**Prompt:** Explain why a⁰ = 1 for a ≠ 0, and why a⁻² = 1/a². Use the division law and a numerical example in each case.

**Model answer (reviewer copy):** Start from the division law, aᵐ ÷ aⁿ = aᵐ⁻ⁿ, which holds for a ≠ 0 because dividing by zero is undefined. If m and n are equal, the law gives aⁿ ÷ aⁿ = aⁿ⁻ⁿ = a⁰. The same division written out is a number divided by itself, which is 1, so a⁰ must be 1. For example 5³ ÷ 5³ = 125 ÷ 125 = 1, and the law gives 5³⁻³ = 5⁰, so 5⁰ = 1. Now take a smaller power divided by a larger one: a² ÷ a⁴ = a²⁻⁴ = a⁻². Written out, the division cancels two copies and leaves 1/a², so a⁻² = 1/a². For example 3² ÷ 3⁴ = 9 ÷ 81 = 1/9, and the law gives 3⁻², so 3⁻² = 1/9. The negative index is the result of subtracting a larger index from a smaller one; it records a reciprocal, not a negative value.

**Marking criteria:**

- States the division law and the condition a ≠ 0.
- Derives a⁰ from aⁿ ÷ aⁿ and a numerical example such as 5³ ÷ 5³ = 1.
- Derives a⁻² from a smaller power divided by a larger one, or from continuing the pattern below zero.
- Gives a numerical example such as 3⁻² = 1/9 and states that the value is positive, not negative.

#### a2 — `short-answer`

**Prompt:** Simplify 4x² × 3x⁵.

**Model answer (reviewer copy):** 12x⁷

**Marking criteria:**

- Multiplies the coefficients: 4 × 3 = 12.
- Adds the indices of the same base: 2 + 5 = 7, giving 12x⁷.

**Accepted deterministic answers:** `12x^7`, `12x⁷`, `12 x^7`, `12x7`

#### a3 — `short-answer`

**Prompt:** Evaluate 27²⁄³.

**Model answer (reviewer copy):** 9

**Marking criteria:**

- Takes the cube root first: 27¹⁄³ = 3.
- Squares the root: 3² = 9.

**Accepted deterministic answers:** `9`

### 10. Transfer

#### t1

**Prompt:** A rumour starts with one person. In each hour, every person who heard it in the previous hour tells three new people. Write the number who hear it in hour n as a power. How many hear it in hour 4, and how many people in total have heard it by then, including the first person? After how many hours does the number hearing it in one hour first exceed 100? Explain why the answer is not 3n, and why the total is not 3⁵.

**Why it transfers:** The lesson evaluates single powers and simplifies algebraic expressions. Here the learner must model a process with a power, compute a single hour and a cumulative total, find the first hour crossing a threshold, and explain two different errors — treating the growth as linear and treating the cumulative total as the next power. The index laws are familiar; building the expression and separating the hourly count from the running total are new.

**Answer:** Hour 0 has 1 = 3⁰ person, hour 1 has 3 = 3¹, hour 2 has 9 = 3², so hour n has 3ⁿ new listeners. Hour 4 has 3⁴ = 81. The total by hour 4 is 1 + 3 + 9 + 27 + 81 = 121, which is (3⁵ − 1)/2. Hour 4 gives 81, below 100, and hour 5 gives 3⁵ = 243, above 100, so the hourly number first exceeds 100 in hour 5. The answer is not 3n: at hour 4 that would be 12, because it adds three each hour instead of multiplying the previous hour's listeners by three. The total is not 3⁵ = 243: that is the number who hear it in hour 5 alone, while the total counts every hour including the first, so it is 121.

**Marking criteria:**

- Writes the hourly number as 3ⁿ, identifying 3 as the multiplier and n as the number of hours.
- Computes 3⁴ = 81 for hour 4.
- Sums the hours to 121, or uses (3⁵ − 1)/2, and distinguishes the running total from the hourly count.
- Finds hour 5 as the first hour above 100 (243) and explains why 3n and 3⁵ are both wrong answers to different questions.

### 11. Retrieval

#### x1 — next-day

**Prompt:** Write a⁵ ÷ a² as a single power, and say which operation the indices undergo.

**Answer:** a³, because five copies of a divided by two copies cancels two and leaves three. The indices are subtracted: 5 − 2 = 3.

#### x2 — week-later

**Prompt:** What is 7⁰, and why is it not 0?

**Answer:** 7⁰ = 1. Dividing 7ⁿ by 7ⁿ gives 7ⁿ⁻ⁿ = 7⁰, and a non-zero number divided by itself is 1. The value is not 0 because the index counts copies; zero copies of a factor leave the multiplicative identity, 1, not nothing.

#### x3 — month-later

**Prompt:** Evaluate 25¹⁄² and 8¹⁄³.

**Answer:** 25¹⁄² = √25 = 5, because 5² = 25. 8¹⁄³ = ∛8 = 2, because 2³ = 8. The denominator of the fractional index is the root.

### 12. Summary and accessibility alternatives

- aⁿ means n copies of a multiplied together; the index counts copies and is not a multiplier, so 3⁴ = 81, not 12.
- Multiplying powers of the same base adds the indices, dividing subtracts them, and a power of a power multiplies them; different bases cannot be combined.
- a⁰ = 1 for a ≠ 0 follows from aⁿ ÷ aⁿ, and a⁻ⁿ = 1/aⁿ continues the subtraction below zero; a negative index means a reciprocal, not a negative value.
- aᵐ⁄ⁿ = (ⁿ√a)ᵐ: the denominator is the root and the numerator is the power, so 27²⁄³ = 9.
- A power binds only to its base, so 2x³ = 2 × x³ while (2x)³ = 8x³; when a law is in doubt, substitute a small number and evaluate both sides.

- **screen-reader:** Every power is also written in words in the surrounding sentence (a to the power 5, the cube root of 27), and each expansion is given as a list of factors, so no answer depends on reading a superscript position.
- **low-vision:** Powers and roots are set in the reading text at the learner's chosen size, and the three laws are repeated as a plain list rather than only inside a diagram or a small label.
- **dyslexia:** Each law is stated on its own line with the same-base condition beside it, and the numerical check is a two-step routine: substitute a small value, evaluate both sides, compare.
- **motor:** All practice and assessment answers are typed. No dragging, drawing or selecting a superscript is required to demonstrate the method.
- **no-audio:** The lesson's teaching is entirely in text. The optional plan video is not required for any objective, and its caption status is marked unknown rather than described as captioned.

### 13. Provenance

- **openmind-authored** — openmind-authored — licence: OpenMind internal — reproduction: none
  - Written for OpenMind.
  - Note: All explanations, examples, practice, assessment and the rumour-spreading transfer are original to OpenMind.
- **gcse-mathematics-subject-content** — curriculum-citation — licence: official-reference — reproduction: none
  - Scope cited against the published GCSE mathematics subject content for number: integer and fractional indices.

### Review record — Index laws

**Lesson:** `indices-intro`

**Exact version:** `1.0.0`

**Content hash:** `f6fe1d7628e7ac144566c6a084998f107a8d8f0c12a8475d3df3f1db9d3e6ef3`

**Current status:** `machine_checked`

**Record online:** `/lesson-review/indices-intro` (signed-in teaching account)

**Reviewer name:** ______________________________

**Role / qualification:** ______________________________

**Date:** ______________________________

| Criterion | Specific finding (name the section) | Severity | Required change |
| --- | --- | --- | --- |
| Subject accuracy |  |  |  |
| Curriculum accuracy |  |  |  |
| Teaching quality |  |  |  |
| Worked-example quality |  |  |  |
| Assessment validity |  |  |  |
| Accessibility |  |  |  |

**Overall verdict:** ______________________________

**Anything the reviewer believes is unsafe, misleading or unsuitable for the stated level:**

______________________________________________________________________________

Findings recorded online become improvement tasks automatically. A blocking
finding makes an approval impossible; a completed task does not approve a later
version.

The verdict is deliberately blank. Only a qualified reviewer who has read the
exact version above may complete it. A review of an earlier version does not
apply to this hash.

---


## What to do with completed reviews

A real review is recorded through `/lesson-review/<concept>` by a signed-in
teacher, or through `POST /api/lesson-review` with the same account session. The
server takes the reviewer identity from that account and rejects a stale version
or hash. The catalogue derives `educator_reviewed` from the actual version and
hash; this pack does not raise a status by itself. A reviewer who asks for changes
keeps the lesson at its current rung until those changes are made and the new
version is reviewed.
