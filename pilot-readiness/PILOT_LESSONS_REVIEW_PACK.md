# Pilot lessons — educator review packet

**This is a review packet, not an approved course.** No lesson in it has been reviewed by a subject teacher. The reviewer should write their own name, role and date; the product will not generate them.

Scope: **CBSE Class 10 (with the Class 9 cell prerequisite) — Mathematics and Science (English medium)** · CBSE Curriculum 2025–26 · lesson version **2026-11-01.3**.

## What approval means

A lesson may be used in the learner path only for the curriculum, level and language recorded here. Approval requires every checklist item to be true and the reviewer to sign the exact lesson version. Any content edit changes the version and voids the approval.

## How to return a review

Copy `pilot-readiness/REVIEW_RECORD_TEMPLATE.json`, fill it in as the reviewer, and validate it with `npm run pilot:review -- --file <record>.json`. The command refuses a missing name, role or date, a future date, an unticked checklist, a tool signing as the reviewer, or a review of an older lesson version. It never writes an approval: a valid record is filed with the project owner, and a deliberate code change to `PILOT_APPROVALS` is what would open the learner path. Until that happens every lesson below remains `needs-educator-review`.

## Rights and provenance

Every lesson is OpenMind-authored; its figures are generated from OpenMind FigureSpecs. The CBSE syllabus entries are curriculum references, not copied teaching text. The source registry is in `lib/source-registry.ts`; `npm run pilot:pack` also writes `SOURCE_AND_RIGHTS_REGISTRY.md`. Unknown or unproven external rights block ingestion.

## Review checklist (per lesson)

- [ ] Subject accuracy: every factual and mathematical statement is correct.
- [ ] Explanation quality: the idea is taught, not merely described.
- [ ] Worked examples: each step is valid and the answer is correct.
- [ ] Questions and marking: the key is correct; distractors are plausible; explanations teach.
- [ ] Diagram quality: labels, units, scale and caption agree with the text.
- [ ] Language and terminology: suitable for the declared English medium.
- [ ] Age appropriateness: examples and wording suit the declared level.
- [ ] Accessibility: readable at 320 px; figure has a spoken caption.

---

## Fractions (`fractions`)

- **Subject / level:** maths · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Number Systems — Rational numbers: representation and operations between them.
- **Source:** Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-maths-2025-26 (link-only); external assets: 0.

### Objective

Read a fraction as a number, compare two of them, and say why 1/8 is smaller than 1/4 when 8 is bigger.

### Intuition

Two chocolate bars, identical. One is broken into four pieces, the other into eight, and you are handed one piece of each. The eight-piece bar gave you the SMALLER piece even though 8 is the bigger number — because the number underneath the fraction is not how much you get, it is how many pieces the bar was cut into. Every fraction question starts by asking which of those two things the number is doing.

### Figure

Kind: `pie`. Three quarters of one whole: the circle is the 1, and the shaded part is three of its four equal slices. A quarter is one slice, so three of them are 3/4 — and four of them would fill the circle exactly.

### The idea

A fraction counts equal pieces of one whole. In 3/4 the bottom number, 4, says the whole was cut into four equal pieces; the top number, 3, says how many of them you have. Say it out loud that way — "three pieces, each a quarter" — and the notation stops being two numbers stacked up.

The bottom number is a SIZE, not a quantity. Cutting a bar into more pieces makes each piece smaller, so a bigger denominator means a smaller slice: 1/8 < 1/4. This is the single most common wrong answer in the whole of fractions, and it is not carelessness — it is reading the denominator as an amount, which is exactly what the top number is for.

Equivalent fractions say the same amount in different pieces. 1/2 = 2/4 = 3/6 because multiplying the top and the bottom by the same number doubles the count AND halves the slice size, so the amount of chocolate is unchanged. That is why you may scale a fraction up or down as long as you scale both parts: you are renaming the pieces, not changing the amount.

To compare fractions with different bottoms, make the pieces the same size — a common denominator. 2/3 and 3/4 become 8/12 and 9/12, and now the tops can be compared directly. The other reliable method needs no arithmetic: compare each fraction with 1/2. A fraction whose top is less than half its bottom (3/8) is below 1/2, and one whose top is more than half its bottom (5/8) is above it, so 3/8 < 5/8 and you never had to compute anything.

A fraction is ONE number, not a division you have not finished. 3/4 sits at a definite place on the number line, between 0 and 1, closer to 1 than to 0 — and once you can see it there, adding, comparing and scaling it are operations on a number rather than rules about two integers that happen to be written on top of each other.

Decimals and percentages are the same idea in other notation: 3/4 = 0.75 = 75%. Nothing about the quantity changes when the notation does, and a learner who knows where 3/4 sits on the line already knows most of what the next two concepts teach.

### Traps

- **"1/8 is bigger than 1/4 because 8 is bigger than 4."** The bottom number counts the pieces, so a bigger bottom means each piece is smaller. Cut the same bar into eight and every piece is half the size of the quarter you had before. Compare the slices, not the numbers.
- **"2/3 is bigger than 3/4 because 2 and 3 are bigger than 3 and 4 in the other one."** Comparing tops alone only works when the bottoms match. Here the pieces are different sizes, so 2 of one size and 3 of another cannot be counted against each other until the sizes are made equal: 8/12 against 9/12.
- **"3/4 + 1/4 = 4/8."** Adding the bottoms together changes the size of every piece in the answer, so the addition is no longer about the same wholes. Quarters and quarters are the same size, so the tops simply add: 3/4 + 1/4 = 1. (Different bottoms are next concept, and they need a common denominator first.)

### Where it is used next

Percentages and decimals are fractions in another notation, ratio compares two of them, and probability is one: the chance of a six is 1/6, which is a fraction before it is ever a percentage.

### Questions for the reviewer to check

**Q1.** Work out 1/6 of 24.
  - A. 4
  - B. 10
  - C. 6
  - D. 5
  - **Key:** A
  - **Explanation:** Finding 1/6 of 24 means cutting 24 into 6 equal parts and taking 1 of them. Each part is 24 ÷ 6 = 4. Taking one part gives 4. Multiplying the numerator by the denominator (6) is not a step in this method.
  - **Misconception tags:** none

**Q2.** A survey of 30 students asked their favourite subject.
· 1/5 of the students chose art
· of the students who chose art, 1/3 were in Year 10
How many Year 10 students chose art?
  - A. 10
  - B. 6
  - C. 28
  - D. 2
  - **Key:** D
  - **Explanation:** Read the table in two stages. First the art count: 1/5 of 30 = 6. Then the Year 10 share of THOSE: 1/3 of 6 = 2. Taking 1/3 of the whole 30 reads the second fraction against the wrong base — that is where 10 comes from.
  - **Misconception tags:** none

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Decimals (`decimals`)

- **Subject / level:** maths · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Number Systems — Decimal representation of rational numbers, including terminating and recurring decimals.
- **Source:** Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-maths-2025-26 (link-only); external assets: 0.

### Objective

Read 0.45 aloud as 45 hundredths, put a list of decimals in size order, and add or multiply two of them without losing the decimal point.

### Intuition

Two prices on a shelf: £0.50 and £0.45. The second one has MORE digits, and the first is worth more — 50p beats 45p. That is the whole difficulty of decimals in one comparison: the digits are not the amount, their position is. A decimal continues the place-value system whole numbers already use, past a point and into tenths, hundredths and thousandths, so the column a digit sits in decides what it counts.

### The idea

Read the point as the word "and": 0.45 is 4 tenths and 5 hundredths, which is 45/100. Everything to the right of the point is a fraction whose denominator is a power of ten, and each step further right divides the value by ten again — tenths, then hundredths, then thousandths. A digit's position is doing exactly the work it does in 452, where the 4 means 400, except now it continues into amounts smaller than one.

Comparing decimals is decided column by column, not by how long the number is. Write them with the same number of places — 0.5 becomes 0.50 — and compare from the left: the tenths decide it, and only if they tie do you look at the hundredths. That is why 0.09 is smaller than 0.1 despite 9 being bigger than 1: 0.09 has no tenths at all, and 0.1 has one.

To add or subtract, put the points in a line — one number under the other with the points in the same column — fill any gaps with zeros, and add the columns exactly as you would whole numbers. 0.3 + 0.4 is three tenths plus four tenths: seven tenths, 0.7. The point is not written in because it was moved; it stays in the column it started in, which is why lining it up is the whole method.

Multiplying needs a different routine, because the columns no longer have to match. Multiply the digits as if the points were not there, then count the decimal places in BOTH factors and put that many back into the answer: 3 × 2 = 6, and 0.3 and 0.2 have one place each, so the answer needs two — 0.06. That count is not a trick; tenths times tenths really is hundredths, which is the same fact as 1/10 × 1/10 = 1/100.

A decimal is one quantity written in another notation, so converting costs nothing: 0.45 = 45/100 = 45%. The same number can be a price, a length, a probability or a percentage, and none of those changes its size. What does change is the precision a written decimal claims — 2.4 said to one decimal place means "between 2.35 and 2.45" — which is why rounding is a decision about which column matters rather than a tidy-up.

Multiplying or dividing by ten shifts the digits, not the quantity: 0.45 × 10 = 4.5 and 0.45 ÷ 10 = 0.045, with the point moving one place each time because every digit has moved one column. That is the one legitimate use of "move the point", and saying the operation out loud — "divide by ten" — keeps it attached to something true.

### Traps

- **"0.45 is bigger than 0.5, because 45 is bigger than 5."** Comparing the digits as if the point were not there ignores the column each one is in. Give both numbers the same number of places — 0.50 against 0.45 — and the tenths decide: five tenths beat four tenths. A longer decimal is not a bigger amount; 0.09 is smaller than 0.1.
- **"0.3 × 0.2 = 0.6."** That is 0.3 × 2 — the point moved one place when the two factors had two decimal places between them. 3 × 2 = 6, so two places back gives 0.06. The check that catches it: multiplying two numbers smaller than 1 must give an answer smaller than either of them, and 0.6 is bigger than 0.3.
- **"0.3 + 0.4 = 7, because 3 + 4 = 7."** Dropping the points multiplied both numbers by ten, so the answer is ten times too big. Three tenths plus four tenths is seven tenths, 0.7. Write the numbers one under the other with the points in a column: the digits you are adding are then the ones in the same place value.

### Where it is used next

Percentages (0.45 is 45%), measurement to a stated precision, ratio and standard form all read decimals, and rounding an answer to one decimal place is a judgement about which column the question cares about.

### Questions for the reviewer to check

**Q1.** Work out 0.4 × 0.7.
  - A. 28
  - B. 2.8
  - C. 0.28
  - D. 1.28
  - **Key:** C
  - **Explanation:** Multiply the digits first, then place the decimal point by counting places: 4 × 7 = 28, and each factor has one decimal place, so the answer needs two. That gives 0.4 × 0.7 = 0.28. Writing 28 answers the whole-number question instead, and 2.8 moves the point only one place, which is what happens when tenths times tenths is treated as tenths.
  - **Misconception tags:** dec-point

**Q2.** Work out 4 × 1.7.
  - A. 68
  - B. 5.7
  - C. 6.8
  - D. 0.68
  - **Key:** C
  - **Explanation:** Decimals multiply by ignoring the points, multiplying the whole numbers, and then restoring the places: 40 × 17 = 680, and two decimal places go back on at the end, giving 6.8. Adding the two numbers instead (5.7) is a different operation, and shifting one place too far (68) is a miscount of the places rather than a wrong multiplication.
  - **Misconception tags:** dec-point

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Negative numbers (`negatives`)

- **Subject / level:** maths · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Number Systems — Integers and their operations, including the number line.
- **Source:** Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-maths-2025-26 (link-only); external assets: 0.

### Objective

Read, compare and calculate with numbers below zero — and know which way the answer goes.

### Intuition

An underground car park already uses this idea. You are parked on level −2 and you drive up four floors. You do not arrive at 5: you arrive at 3, because you started below street level and passing zero changes nothing about the counting. Every rule about negatives is that one picture — a number line where zero is not a wall you stop at, but a line you can walk straight past.

### Figure

Kind: `number-line`. Start at 5. Taking away −3 is removing a leftward move, so the journey goes RIGHT to 8 — the arrow does not turn round because the sign does.

### The idea

A negative number is an amount below zero. −4 sits the same distance from zero as 4 does, on the other side, which is why the sign is the only thing separating them: the distance of −4 from zero is 4, exactly as it is for 4. The sign says direction, not size.

Adding and subtracting are moves along the line. Adding a negative moves left: 6 + (−4) = 2. Subtracting a negative needs a second look, because it takes away a leftward move, which leaves you further right: 5 − (−3) = 5 + 3 = 8. You do not have to memorise that. 5 − (−3) asks "what number added to −3 gives 5?", and only 8 does.

Multiplying is repeated addition, so signs follow the moves. (−3) × 4 is four jumps of three to the left: −12. (−3) × (−4) reverses direction twice — taking away four debts of 3 leaves you 12 better off — so the answer is positive. One negative gives a negative answer; two negatives give a positive one.

Comparing catches people out because the line runs the other way from the numbers: −2 is greater than −5, even though 5 is greater than 2. Rightwards is larger. That single fact is also why an inequality flips sign the moment you multiply or divide by a negative.

### Traps

- **Turning 5 − (−3) into 5 − 3 = 2.** The minus in front acts on a value that is already negative; it does not cancel the subtraction. On the line, subtracting a leftward move of three has to take you further right, and 5 + 3 = 8 is the only value for which 8 + (−3) comes back to 5.
- **Saying −8 is bigger than −3 because 8 is bigger than 3.** Distance from zero is not size. −3 sits three steps to the RIGHT of −8, and rightwards is larger, so −3 > −8. Learners who reorder numbers this way later read inequalities backwards, which is why this one is worth fixing now.
- **Working out (−2) × (−3) as −6.** Both signs reverse the direction, so the result points back to the positive side. Test it against the rule you already trust: (−2) × 3 = −6, so (−2) × (−3) must be the opposite of that, which is 6.

### Where it is used next

Coordinates, gradients and inequalities all stand on this: a point below the axis, a line falling to the right, or any inequality you multiply by −1.

### Questions for the reviewer to check

**Q1.** Work out 15 − 22.
  - A. -37
  - B. -7
  - C. 7
  - D. 37
  - **Key:** B
  - **Explanation:** 15 − 22 = -7 (negative — 22 is larger). On the number line you move 22 left from 15.
  - **Misconception tags:** neg-slip

**Q2.** Work out (-5) × (-3).
  - A. -8
  - B. 15
  - C. -15
  - D. 16
  - **Key:** B
  - **Explanation:** Multiplying two negative numbers gives a POSITIVE, because the opposite of the opposite points back where you started: (-5) × (-3) = 15. Negating the product (-15) keeps one sign too many, and adding the two numbers (-8) is a different operation — a product of 5 and 3 cannot be that small.
  - **Misconception tags:** neg-slip

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Order of operations (`order-ops`)

- **Subject / level:** maths · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Number Systems — Conventions for the order of operations on real numbers.
- **Source:** Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-maths-2025-26 (link-only); external assets: 0.

### Objective

Evaluate any arithmetic expression the way the rest of the world does, and explain why that order is the one.

### Intuition

3 + 4 × 2 is 11, not 14 — and the reason is not that 11 is the more pleasing answer. Multiplication is repeated addition, so 4 × 2 is a single quantity: eight. The expression reads "three, plus the object eight". It never says "three plus four, and then double it".

### The idea

Brackets are a request to act early. They do not change the rules; they say "work this out first": 3 × (4 + 2) = 18, where 3 × 4 + 2 = 14.

Indices come next because a power is already a finished multiplication: 3² means 3 × 3. So 2 + 3² is 2 + 9 = 11, and someone who reads it left to right gets 25 from squaring (2 + 3).

Multiplication and division have the SAME rank, as do addition and subtraction. Equal ranks are worked left to right: 12 ÷ 4 × 3 = 9, because 12 ÷ 4 = 3 and 3 × 3 = 9. Reading it right to left gives 1, which is a different sum.

The order is a shared convention, not a law of mathematics — without it, one written expression would have several values and nobody could check anybody's work. It is also what makes formulae predictable later: in 3x² with x = 4, the power belongs to x, so the value is 3 × 16 = 48.

### Traps

- **Working straight through from left to right.** That gives 14 for 3 + 4 × 2. The 4 × 2 is one quantity — eight — and quantities are finished before they are joined to anything.
- **Doing multiplication before division because M comes first in BIDMAS.** They share a rank, so 12 ÷ 4 × 3 is 9. Taking the multiplication first makes 12 ÷ 12 = 1. The letters are a memory aid, not three separate ranks.
- **Reading −3² as 9.** The power binds to 3 alone and the minus is applied afterwards: −(3²) = −9. If the negative is meant to be squared, it has to be bracketed as (−3)², which is why that bracket gets written.

### Where it is used next

Every formula you meet later — substituting into 3x² + 2, evaluating a physics equation, simplifying an expression — is this order applied to letters instead of numbers.

### Questions for the reviewer to check

**Q1.** Work out 3 + 5 × 6.
  - A. 33
  - B. 48
  - C. 14
  - D. 21
  - **Key:** A
  - **Explanation:** Multiplication binds tighter than addition, so the product is worked out before the sum: 5 × 6 = 30 comes first, and then 3 + 30 = 33. Working left to right instead (48) adds before multiplying, which is a different expression — it is exactly why 3 + 5 × 6 is not 48.
  - **Misconception tags:** order-ops

**Q2.** Work out 3 + 3 × 8.
  - A. 48
  - B. 17
  - C. 14
  - D. 27
  - **Key:** D
  - **Explanation:** Multiplication before addition: 3 × 8 = 24, then 3 + 24 = 27.
  - **Misconception tags:** order-ops

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Expanding & factorising (`algebra-expand`)

- **Subject / level:** maths · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Algebra — Expansion and factorisation of algebraic expressions, including identities.
- **Source:** Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-maths-2025-26 (link-only); external assets: 0.

### Objective

Multiply out a pair of brackets, say where each of the four terms came from, and factorise a simple quadratic back again.

### Intuition

A garden is x + 3 metres long and x + 2 metres wide, with the x part cut off at a fixed place on each side. Its area is not one number you can look up — but the garden splits into four rectangular beds, and each bed has an area you can write down. Expanding brackets is that split written out, which is why nothing is ever dropped.

### Figure

Kind: `rectangle`. (x + 3)(x + 2) drawn as four beds: x², 2x, 3x and 6. The middle term of the answer is the two cross beds added together, and leaving one of them out is exactly how x² + 6 appears instead.

### The idea

One bracket is one quantity multiplied. 3(x + 4) says: the whole quantity x + 4 is tripled, so both parts are tripled — 3x + 12. The 4 is a length inside the bracket, not a separate add-on, which is why 3x + 4 is too small.

Two brackets multiply every term of the first by every term of the second, because each side is a length and the area model needs a rectangle for each pair. (x + 3)(x + 2) gives four pieces: x², 2x, 3x and 6.

The middle term is made of the two CROSS pieces. 2x and 3x are different rectangles, and they add to 5x — so x² + 5x + 6. The 5 is not 3 + 2 arrived at separately; it is what the two crossings come to, which is also why x² + 6 is a real answer to a different question.

A sign belongs to the term it sits in front of, and it travels into every product that term takes part in. (x − 3)(x + 2) = x² + 2x − 3x − 6 = x² − x − 6: the −3 changes both of its products, which is what turns +2x into 2x − 3x = −x.

Factorising reverses the multiplication, so it is a search with two clues. In x² + 5x + 6 the two numbers must multiply to 6 (the constant) and add to 5 (the middle), which only 2 and 3 do. The sign of the constant tells you whether the two numbers share a sign; the sign of the middle tells you which sign they share when they do.

(x + 3)(x − 3) = x² − 9: the cross pieces are +3x and −3x, equal and opposite, so they cancel and no middle term survives. That is the difference of two squares, and it is a pattern you can recognise rather than a separate rule to memorise.

### Traps

- **Writing (x + 3)(x + 2) = x² + 6.** The two cross pieces have been dropped. With x = 10 the brackets give 13 × 12 = 156, while x² + 6 gives 106 — the missing 50 is 2x + 3x. Any expansion can be checked the same way, by substituting a value into the brackets and into the answer.
- **Expanding 3(x + 4) as 3x + 4.** Only the first term was multiplied. The bracket is one length tripled: with x = 2 the true value is 3 × 6 = 18, and 3x + 4 gives 10. One substitution at the end catches this every time.
- **Writing (x − 3)(x + 2) = x² + 5x − 6.** The −3 was multiplied by x but its sign was not carried into the second product: the pieces are −3 × 2 = −6 AND −3 × x = −3x. Adding the middle terms honestly gives 2x − 3x = −x, so the answer is x² − x − 6.
- **Factorising x² + 5x + 6 as (x + 1)(x + 6).** Those numbers multiply to 6 but add to 7, and the middle term says 5. Both clues have to hold at once; check by expanding the pair back and seeing whether you recover the expression you started with.

### Where it is used next

Quadratics, completing the square, the quadratic formula and any area problem with an unknown side — this is the multiplication that all of them are built on.

### Questions for the reviewer to check

**Q1.** Expand (3x + 3)(x + 2). The result is 3x² + bx + c. What is the value of b?
  - A. 9
  - B. 6
  - C. 11
  - D. 3
  - **Key:** A
  - **Explanation:** The x term has two sources, because either term of the first bracket can meet the x in the second: 3x × 2 = 6x, and 3 × x = 3x. Adding those gives 9x, so b = 9. The other pairing, 3x with 3, is a term in x², and 3 × 2 = 6 is the constant.
  - **Misconception tags:** sign-slip

**Q2.** Expand and simplify (2x − 2)(x + 2)(x − 2).
  - A. 2x³ − 2x² − 8x − 4
  - B. 2x³ − 2x² − 4x + 8
  - C. 2x³ − 2x² − 8x + 8
  - D. 2x³ − 2x²  − 8
  - **Key:** C
  - **Explanation:** Do it in two stages and keep the first product on the page. First (2x − 2)(x + 2) = 2x² + 2x − 4. Then multiply THAT by (x − 2), which means each term meets both x and −2: the x³ comes from 2x² × x, the x² collects 2x − 2×2x, the x collects -4 − 2×2, and the constant is -4 × (−2). That gives 2x³ − 2x² − 8x + 8. The sign of the constant is the check worth doing: two negative constants in the brackets force the product positive, and one makes it negative — here the -4 is negative and the bracket contributes −2, so the constant is negative.
  - **Misconception tags:** sign-slip

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Linear equations (`linear-equations`)

- **Subject / level:** maths · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Algebra — Linear equations in two variables, solved algebraically and represented graphically.
- **Source:** Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-maths-2025-26 (link-only); external assets: 0.

### Objective

Solve one- and two-step equations, including with unknowns on both sides, and check the answer.

### Intuition

The equals sign is a balance beam. 3x + 5 = 20 says: three identical bags plus five weights balance twenty weights. Whatever you take off one pan you must take off the other, or the beam tips and the two sides are no longer equal — which is the whole reason the rules of solving work.

### Figure

Kind: `balance`. 3x + 5 = 20 as a balance: three bags and five weights against twenty weights. Take the same five off both pans, and the three bags are left holding fifteen — so one bag is 5.

### The idea

An equation is a claim: these two expressions are equal. Solving means finding the value of x that makes the claim true. A value that breaks the balance is not a solution, however tidy the working looked.

Undo the operations in the reverse order to the one that built the expression. x was multiplied by 3 and then had 5 added; undo the addition first. Subtract 5 from both sides: 3x = 15. Then divide both sides by 3: x = 5.

Both sides, always. Subtracting 5 from the left only breaks the balance, and the value you end up with will not satisfy the original equation — which is what the check at the end is for.

Unknowns on both sides reduce to the same discipline: 5x = 2x + 9. Subtract 2x from both sides — that is a move performed on the whole of each side — leaving 3x = 9, so x = 3.

Brackets can be expanded (3(x + 2) = 15 → 3x + 6 = 15 → x = 3) or divided away first (x + 2 = 5 → x = 3). Both routes are correct; picking the shorter one is a judgement, not a rule.

Finish by substituting your answer back into the ORIGINAL equation: with x = 5, the left side is 3(5) + 5 = 20, which is what the right side says. The check takes five seconds and it is the one step that catches the sign slip the algebra hid — an answer that came from broken working still has to survive being put back.

### Traps

- **Subtracting 5 from only the left-hand side.** That tips the balance, so the two sides stop being equal and any x you read off afterwards is answering a different question. Every operation is applied to a whole side — which is also why dividing "the 3x by 3" and leaving the +5 alone is the same mistake in a different disguise.
- **Moving 2x across the equals sign to get 7x = 9 on 5x = 2x + 9.** Changing sides is not an operation; subtracting is. Subtract 2x from both sides and 5x − 2x = 9 gives 3x = 9. "Moves across and changes sign" happens to give the same result for added terms, which is why it survives — but it stops being true for multiplication, and it hides what is actually being done.
- **Reporting x = 3 from 3(x + 2) = 15 without expanding correctly.** The 3 multiplies both terms inside the bracket, so the left side is 3x + 6, not 3x + 2. Missing it gives 3x + 2 = 15, x = 13/3 — an answer that a single check by substitution would have refused.

### Where it is used next

Formulae, simultaneous equations, rearranging, and every "find the value of" question in maths and science; also the discipline of checking an answer by substituting it back.

### Questions for the reviewer to check

**Q1.** Solve 2x + 1 = 0x + 15.
  - A. 8
  - B. 7
  - C. 14
  - D. 6
  - **Key:** B
  - **Explanation:** With x on both sides, collect it on one side first: subtracting 0x leaves 2x + 1 = 15, and subtracting 1 leaves 2x = 14, so dividing by 2 gives x = 7. Substituting back confirms it, since both sides then agree. Stopping at 14 leaves the coefficient of x unused, so the value is not yet the solution.
  - **Misconception tags:** bal-slip

**Q2.** Solve: 2x + 5 = 15
  - A. x = 6
  - B. x = -5
  - C. x = 4
  - D. x = 5
  - **Key:** D
  - **Explanation:** Subtract 5 both sides: 2x = 10. Divide by 2: x = 5. Check: 2(5) + 5 = 15 ✓.
  - **Misconception tags:** bal-slip

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Quadratic equations (`quadratics`)

- **Subject / level:** maths · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Algebra — Quadratic equations solved by factorisation and the quadratic formula.
- **Source:** Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-maths-2025-26 (link-only); external assets: 0.

### Objective

Solve a quadratic equation by factorising, and know from the equation itself when to reach for the formula instead.

### Intuition

A ball thrown upwards is at 6 metres on the way up and again on the way down. "When is it 6 metres high?" has two answers, and that is not a quirk of the ball — it is what a quadratic equation is: the same value reached twice, before and after the turning point. A quadratic can have two solutions, one, or none, and the equation itself tells you which.

### Figure

Kind: `axes`. y = x² − 5x + 6 drawn from its own coefficients: it crosses the horizontal axis at 2 and 3, the two roots the factorising gives, and it turns on the dashed line exactly halfway between them. A pair of answers with no such crossing is a pair the algebra got wrong.

### The idea

Put it in standard form first: everything on one side, zero on the other. x² − 5x = −6 becomes x² − 5x + 6 = 0. Factorising only works against zero, because the whole method rests on a product being zero — so this rearrangement is the first step, not tidying up.

Factorising is a search with two clues: two numbers that multiply to the constant (+6) and add to the coefficient of x (−5). Here −2 and −3, so (x − 2)(x − 3) = 0. Check by expanding — that is the one habit that catches a wrong pair before it becomes a wrong answer.

The zero product rule finishes it: if two things multiply to zero, at least one of them is zero. So x − 2 = 0 or x − 3 = 0, giving x = 2 or x = 3. Both are solutions; the equation is satisfied by either, not by both at once.

When no pair of whole numbers fits, the formula does the same job without guessing: x = (−b ± √(b² − 4ac)) ÷ 2a, with a, b and c read off standard form INCLUDING their signs. It is not a different method — it is the same equation solved by completing the square once and for all, which is why it never fails.

The discriminant b² − 4ac decides how many answers to expect before you compute anything: positive gives two real roots, zero gives one repeated root (the curve just touches the axis), negative gives none (the curve never reaches it). Negative is an answer about the curve, not a mistake in the arithmetic.

The two roots are where the parabola crosses the x-axis, and the turning point sits exactly halfway between them. So a sketch is a check on the algebra: if your answers are 2 and 3, the curve must cross at 2 and 3 and turn at 2.5 — an answer of 2 and 8 for a curve whose sketch crosses close together means the factorising went wrong.

### Traps

- **Solving x² = 3x by dividing both sides by x.** Dividing by x throws away the case x = 0, and x = 0 really is a solution. Move everything to one side and factorise instead: x² − 3x = 0, so x(x − 3) = 0, giving x = 0 or x = 3. Do not divide by a variable unless you have first checked that it cannot be zero; factorise it out instead.
- **Reading (x − 2)(x − 3) = 0 as x = −2 or x = −3.** Each bracket is set to zero and solved, which reverses its sign: x − 2 = 0 gives x = +2. Substituting back settles it in seconds — putting x = 2 into the original makes the first bracket zero, which is exactly what the equation claims.
- **Using the formula with c taken as positive from 2x² + 3x − 5.** The signs belong to the terms: a = 2, b = 3, c = −5. Dropping the minus changes the discriminant from 9 + 40 = 49 to 9 − 40 = −31 and turns two real roots into none — a wrong answer that looks like a legitimate "no solutions" conclusion.
- **Reporting a negative discriminant as an error.** It is information: the parabola sits entirely above or below the axis, so there is no real x making the expression zero. Say so, and support it with the sign of a — that is a complete answer, not a failed one.

### Where it is used next

Curve sketching, where a line meets a curve, maximum-area and optimisation problems, and any "when does it reach" question in physics — the two roots are the two times.

### Questions for the reviewer to check

**Q1.** Solve x² − 10x + 24 = 0. What is the LARGER root?
  - A. 10
  - B. 24
  - C. 4
  - D. 6
  - **Key:** D
  - **Explanation:** A quadratic is solved by writing it as a product, since a product is zero when either factor is: x² − 10x + 24 factorises to (x − 6)(x − 4), so x = 6 or x = 4. The question asks for the larger of the two, which is 6. The other root (4) is a real answer to the equation but not to the question — a quadratic normally has two roots, and the stem says which one it wants.
  - **Misconception tags:** lost-root

**Q2.** The graph of y = x² + 5x + 4 crosses the x-axis at two points. What are the x-coordinates of those points?
  - A. x = 1 and x = 4
  - B. x = -4 and x = -1
  - C. x = -1 only
  - D. x = 5 and x = 4
  - **Key:** B
  - **Explanation:** The crossings are where y = 0, so solve x² + 5x + 4 = 0 by factorising: two numbers that multiply to 4 and add to 5 are -4 and -1, giving (x + 4)(x + 1) = 0. A product is zero when either factor is zero, so x = -4 OR x = -1 — reporting one root throws away half the answer.
  - **Misconception tags:** lost-root

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Coordinates & graphs (`coordinates`)

- **Subject / level:** maths · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Coordinate Geometry — Distance formula, section formula and the area of a triangle from coordinates.
- **Source:** Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-maths-2025-26 (link-only); external assets: 0.

### Objective

Plot and read points on a grid, and read an equation as the shape it draws.

### Intuition

A map reference works like this: go along the corridor, then up the stairs. Coordinates always give the horizontal move first. (3, 2) and (2, 3) are two different places, which is why the order is not a detail you can shrug at.

### Figure

Kind: `axes`. y = 2x + 1 plotted: from (0, 1) each step of 1 across goes 2 up, so the points sit on one straight line. A wobble in the line would be an arithmetic slip in the table, not a discovery.

### The idea

The axes cross at the origin (0, 0). x counts to the right, with negatives to the left; y counts upwards, with negatives downwards. The grid is four regions — the quadrants — and each is defined by the signs of its points.

A point is written (x, y) — along, then up. So (3, −2) is three right and two down, which puts it in the bottom-right quadrant. (−3, 2) is a different point on the other side.

An equation is a rule for which points belong. y = 2x + 1 says: pick an x, double it, add one, and that is the y. Choosing x = 0, 1, 2 gives (0, 1), (1, 3), (2, 5).

Joining those points gives a straight line, and the straightness is information: a constant step in x producing a constant step in y is what "linear" means. A curve on a linear equation is evidence of an arithmetic slip in the table, not a discovery.

Reading a graph and solving an equation are the same fact in two languages. Where two lines cross, that point's coordinates satisfy both equations at once — which is what solving a pair of equations simultaneously is.

### Traps

- **Plotting (3, −2) as three up and two left.** The pair is x then y, the same order as the alphabet. Swapping them puts the point in a different place entirely — it reflects the point in the line y = x — and every gradient and distance read from that point then comes out wrong.
- **Reading a y-value off the horizontal axis.** The horizontal axis is x. A point that sits ON the x-axis has y = 0, which is why its coordinates look like (4, 0) and why an intercept on that axis is where the graph crosses zero.
- **Freehand-joining plotted points into a wobbly curve.** Two points are enough to fix a straight line, so a curve on a linear equation means a mistake in the table. Checking one plotted point by substituting its x into the equation catches it before the line is drawn.

### Where it is used next

Straight-line graphs, gradients, quadratics and every graph in science: this is where algebra becomes something you can see.

### Questions for the reviewer to check

**Q1.** What is the x-coordinate of the midpoint of (-7, -3) and (7, -6)?
  - A. 0
  - B. -4.5
  - C. 1
  - D. 14
  - **Key:** A
  - **Explanation:** The midpoint sits exactly halfway between the two points, so each coordinate is the mean of the two: x = (-7 + 7) ÷ 2 = 0. Averaging the y values instead (-4.5) gives the midpoint's other coordinate, and adding the x values without halving (0) measures the run between the points rather than the middle of it.
  - **Misconception tags:** none

**Q2.** A data plot has two markers, recorded in the table as
· (12, 4)
· (22, 16)
What is the midpoint of the two markers?
  - A. (18, 10)
  - B. (10, 12)
  - C. (34, 20)
  - D. (17, 10)
  - **Key:** D
  - **Explanation:** The midpoint averages each coordinate: x is (12 + 22) ÷ 2 = 17 and y is (4 + 16) ÷ 2 = 10, giving (17, 10). Adding the coordinates instead of averaging gives (34, 20).
  - **Misconception tags:** none

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Cells (`cells`)

- **Subject / level:** biology · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** The Fundamental Unit of Life — Cells as the basic structural and functional unit of life; plant and animal cell structure; organelles and their functions; cell division is outside this lesson.
- **Source:** Science (Subject Code 086), Class IX — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-9-science-2025-26 (link-only); external assets: 0.

### Objective

Name the parts of an animal and a plant cell, and explain how each part's structure helps it do its job.

### Intuition

A brick wall and a living factory look equally solid from a distance, and only one of them is doing anything. A cell is the smallest piece of a living thing that can carry out all the processes of life: it takes in materials, releases energy, makes what it needs and gets rid of waste. Most cells are too small to see without a microscope, which is why the idea feels abstract until you look at one.

### The idea

A cell is the basic structural and functional unit of life. Every living organism is made of one cell (a bacterium) or many cells (a plant, an animal, you). The cell is not a container with parts floating in it by accident: each part, or organelle, has a job, and the shape of the part is tied to that job.

An animal cell has a cell membrane around the outside, cytoplasm inside, a nucleus, and mitochondria. The membrane is a thin, flexible boundary that controls what enters and leaves. The cytoplasm is where many reactions happen. The nucleus holds the genetic material (DNA) and controls the cell's activities. Mitochondria are where aerobic respiration releases energy from glucose.

A plant cell has the same four parts and three more that matter here: a cellulose cell wall outside the membrane, chloroplasts, and a large permanent vacuole. The wall is strong and gives the cell its shape; it is fully permeable, so the membrane underneath is still the gatekeeper. Chloroplasts contain chlorophyll and carry out photosynthesis. The vacuole is filled with cell sap and helps keep the cell firm.

Specialised cells show the same rule at a larger scale: structure serves function. A red blood cell has no nucleus and is packed with haemoglobin, leaving more room to carry oxygen. A root hair cell has a long, thin extension that increases the surface area for absorbing water and minerals. A sperm cell has many mitochondria to power its journey. A nerve cell is long so it can carry an electrical impulse from one part of the body to another.

Cells are not all the same size, and the units matter. Most plant and animal cells are measured in micrometres (μm): one micrometre is one-thousandth of a millimetre, or 10⁻⁶ m. A typical cheek cell is about 50–100 μm across. Magnification tells you how many times larger the image is than the object; it does not, by itself, tell you how much detail you can resolve.

Similar cells group into tissues, tissues into organs, and organs into organ systems. This hierarchy is why a single cell does not need to do everything in a large organism: specialised cells do one job well, and the system coordinates them. It also explains why a large organism cannot simply be one giant cell — the surface area available for exchange grows more slowly than the volume that needs supplying.

### Terms

- **cell membrane:** The thin, flexible boundary that controls which substances enter and leave the cell.
- **nucleus:** The organelle that contains DNA and controls the cell's activities.
- **chloroplast:** A plant-cell organelle containing chlorophyll, where photosynthesis takes place.
- **vacuole:** A fluid-filled space; the large permanent vacuole in a plant cell helps keep the cell firm.
- **mitochondrion:** The organelle where aerobic respiration releases energy from glucose.

### Authored worked examples

**1. A root hair cell has a long, narrow extension into the soil. Explain one way this shape helps the cell do its job.**

- Identify the job: the root hair cell absorbs water and dissolved mineral ions from the soil.
- Connect shape to job: absorption happens across the cell membrane, so a larger membrane surface allows more water and ions to enter in a given time.
- Name the principle: the long extension increases the surface area to volume ratio; it does not increase the volume of soil the root reaches by magic.

Answer: **The extension increases the surface area of membrane available for absorbing water and minerals, so the cell can take them in faster.**

**2. A palisade cell from a leaf and a human cheek cell are compared. Which organelles would you expect in the palisade cell but not in the cheek cell, and why?**

- Recall the plant-cell additions: a cellulose cell wall, chloroplasts and a large permanent vacuole.
- Check the job: palisade cells are packed with chloroplasts because they are the main photosynthetic cells of the leaf.
- Do not overclaim: a cheek cell is an animal cell, so it has no chloroplasts and no cellulose wall; both cell types still have mitochondria and a nucleus.

Answer: **Chloroplasts (and a cellulose cell wall and large permanent vacuole). The palisade cell photosynthesises, so it needs chlorophyll; the cheek cell does not.**

### Traps

- **"Plant cells have no mitochondria because they get energy from sunlight."** Photosynthesis makes glucose; respiration releases energy from glucose, and plant cells carry out respiration day and night. Mitochondria are therefore present in plant cells too. Sunlight is the energy source for making the glucose, not a replacement for respiring it.
- **"The cell wall controls what enters the cell."** The cellulose wall is strong and fully permeable: it gives shape and support, but it does not select substances. The cell membrane underneath is the selectively permeable boundary that does that job.
- **"A red blood cell has a nucleus like every other cell."** A mature human red blood cell loses its nucleus during development. That leaves more space for haemoglobin, so each cell can carry more oxygen. The absence is a specialisation, not a mistake in the diagram.

### Where it is used next

Photosynthesis, respiration, gas exchange and transport all depend on cell structure: chloroplasts, mitochondria, membranes and surface area are the same ideas used again in every later biology lesson.

### Recap

- A cell is the smallest unit that carries out all the processes of life; its parts are organelles with specific jobs.
- Animal and plant cells share a membrane, cytoplasm, nucleus and mitochondria; plant cells also have a wall, chloroplasts and a large vacuole.
- Specialised cells have shapes that increase the surface area or machinery needed for their particular job.

### Questions for the reviewer to check

**Q1.** A cell 10 μm wide is viewed at ×1000 magnification. How wide does it appear, in μm?
  - A. 1010
  - B. 0.01
  - C. 1000
  - D. 10000
  - **Key:** D
  - **Explanation:** image = real × magnification = 10 × 1000 = 10000 μm. The image must be BIGGER than the object, so dividing is the warning sign.
  - **Misconception tags:** none

**Q2.** Which structure is found in PLANT cells but NOT animal cells?
  - A. A nucleus, holding the genetic material
  - B. A cell membrane, controlling what enters and leaves
  - C. Mitochondria, where aerobic respiration happens
  - D. Cellulose cell wall
  - **Key:** D
  - **Explanation:** Plant-only: cellulose wall, chloroplasts, permanent vacuole. Mitochondria, membrane and nucleus are in both.
  - **Misconception tags:** none

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Photosynthesis (`photosynthesis`)

- **Subject / level:** biology · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Life Processes — Nutrition — Photosynthesis: raw materials, site and basic steps; the balanced equation; limiting factors and the rate of photosynthesis.
- **Source:** Science (Subject Code 086), Class X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-science-2025-26 (link-only); external assets: 0.

### Objective

Write the balanced equation for photosynthesis, explain what limits its rate, and interpret a rate-versus-light graph.

### Intuition

A leaf is a solar-powered factory with no chimney. It takes carbon dioxide in through tiny pores, draws water up from the roots, and uses light energy to build glucose — while releasing oxygen that every animal, including you, needs. The mass of a tree does not come mostly from the soil; it comes mostly from carbon dioxide in the air. That is the surprising idea this lesson makes visible.

### Figure

Kind: `axes`. Rate of photosynthesis against light intensity. The points rise while light is limiting, then flatten at a plateau: beyond that point another factor, such as carbon dioxide or temperature, is setting the ceiling.

### The idea

Photosynthesis is the process by which plants, algae and some bacteria use light energy to convert carbon dioxide and water into glucose and oxygen. The balanced symbol equation is 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Read it as six carbon dioxide molecules plus six water molecules, using light energy and chlorophyll, forming one glucose molecule and six oxygen molecules.

The reaction happens in chloroplasts, which contain the green pigment chlorophyll. Chlorophyll absorbs mainly red and blue-violet light and reflects green, which is why leaves look green. Light energy is used to split water and drive the reactions that fix carbon dioxide into glucose; the oxygen released comes from water, not from carbon dioxide.

A leaf is shaped for the job. It is broad and thin, so light reaches the palisade cells near the upper surface and gases do not have far to diffuse. The epidermis is transparent, and stomata — usually on the lower surface — let carbon dioxide in and oxygen out, while a network of veins brings water and carries away sucrose. The palisade cells are packed with chloroplasts; the spongy layer has air spaces that connect to the stomata.

The rate of photosynthesis is not unlimited. Light intensity, carbon dioxide concentration and temperature are limiting factors: at any moment the factor in shortest supply sets the ceiling. Increase light and the rate rises, but only until another factor becomes limiting; the graph then flattens into a plateau. A plateau is not a failure of the plant — it is evidence that light is no longer the bottleneck.

Temperature affects the enzymes that control the reactions. The rate rises with temperature up to an optimum and then falls sharply as the enzymes denature. That is a different shape from the light curve: a peak, not a plateau. A learner who can tell the two shapes apart can explain the biology rather than recite a list.

The glucose made is not all used immediately. Some is respired to release energy, some is converted to starch for storage, some becomes cellulose for cell walls, and some is transported as sucrose to growing parts. The oxygen is released as a by-product. Photosynthesis and respiration both run in a plant; in daylight photosynthesis usually exceeds respiration, so there is a net release of oxygen, while at night only respiration continues and carbon dioxide is released.

### Terms

- **chlorophyll:** The green pigment in chloroplasts that absorbs light energy for photosynthesis.
- **chloroplast:** The plant-cell organelle where photosynthesis takes place.
- **stomata:** Small pores in the leaf surface that let carbon dioxide in and oxygen and water vapour out.
- **limiting factor:** The factor in shortest supply that sets the maximum rate of a process at that moment.

### Authored worked examples

**1. A plant is given brighter and brighter light, but its rate of photosynthesis stops increasing after a point. Explain what is happening.**

- Start from the graph's shape: the rate rises with light at first, then levels off.
- Identify what a plateau means: light is no longer the factor in shortest supply, so adding more cannot help.
- Name a plausible limiting factor: carbon dioxide concentration or temperature. If the plant is warm and well lit but in still air, CO₂ is the usual candidate.
- State the conclusion carefully: the rate is now limited by another factor, not by the plant refusing to photosynthesise.

Answer: **Light has stopped being the limiting factor. Another factor — most often carbon dioxide concentration or temperature — now sets the maximum rate, so the graph flattens.**

**2. A leafy plant is kept in complete darkness for 24 hours. Explain why it still releases carbon dioxide.**

- Separate the two processes: photosynthesis needs light; respiration does not.
- In darkness, photosynthesis stops, so no new glucose and no oxygen are produced.
- Respiration continues in every living cell, using glucose and oxygen and releasing carbon dioxide and water.

Answer: **Respiration continues in the dark, releasing carbon dioxide, while photosynthesis has stopped because there is no light.**

### Traps

- **"Plants take their food from the soil."** The soil supplies water and mineral ions, not the carbon and energy that make up most of the plant's dry mass. The carbon comes from carbon dioxide in the air and the energy from sunlight; the glucose is made in the leaves.
- **"More light always means a faster rate of photosynthesis."** Only while light is the limiting factor. Once another factor — carbon dioxide or temperature — is in shortest supply, extra light cannot increase the rate, and the graph plateaus. The plateau is the evidence that the limiting factor has changed.
- **"Photosynthesis is the same thing as respiration, just in reverse."** The equations look like reverses, but the processes are not interchangeable. Photosynthesis stores energy in glucose using light; respiration releases that energy in a controlled series of reactions. They happen in different organelles and are active at different times.

### Where it is used next

Every food chain begins with photosynthesis, and the carbon and oxygen cycles are its large-scale consequences. Respiration, ecosystems and climate change all depend on the rate at which plants fix carbon.

### Recap

- Photosynthesis uses light energy to turn carbon dioxide and water into glucose and oxygen: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.
- Chloroplasts contain chlorophyll; the leaf's broad, thin shape and stomata make gas exchange and light capture efficient.
- Light, carbon dioxide and temperature can each limit the rate; a plateau means the limiting factor has changed, not that the plant has stopped working.

### Questions for the reviewer to check

**Q1.** Which are the two raw materials of photosynthesis?
  - A. Glucose and water stored in the leaf
  - B. Nitrogen and water from the soil
  - C. Oxygen and glucose, made by the plant
  - D. Carbon dioxide and water
  - **Key:** D
  - **Explanation:** 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (light energy). CO₂ and water IN; glucose and oxygen OUT. Oxygen is a by-product, not an input.
  - **Misconception tags:** none

**Q2.** A plant takes in 1 molecules of CO₂. How many molecules of glucose can it build at most, if 6 CO₂ are needed for each?
  - A. 0
  - B. 6
  - C. 1
  - D. 10
  - **Key:** A
  - **Explanation:** It takes 6 CO₂ per glucose, so 1 CO₂ gives ⌊1/6⌋ = 0 glucose — the rest is left over.
  - **Misconception tags:** none

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Chemical equations (`equations-stoich`)

- **Subject / level:** chemistry · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Chemical Reactions and Equations — Balanced chemical equations, conservation of mass, state symbols, and the common reaction types named in the syllabus.
- **Source:** Science (Subject Code 086), Class X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-science-2025-26 (link-only); external assets: 0.

### Objective

Balance a chemical equation by counting atoms, add state symbols correctly, and explain why balancing does not change the substances.

### Intuition

A chemical equation is a recipe written in symbols, and the recipe has a strict rule: atoms are not created or destroyed. You can rearrange the same atoms into new groups, but you cannot make a new atom appear. That is why the number of each kind of atom on the left must equal the number on the right — not approximately, exactly.

### The idea

A chemical reaction rearranges atoms. The starting substances are reactants, written on the left; the new substances are products, written on the right. A word equation names them, and a symbol equation replaces names with formulas: methane + oxygen → carbon dioxide + water becomes CH₄ + O₂ → CO₂ + H₂O.

The law of conservation of mass says the total mass of reactants equals the total mass of products in a closed system, because atoms are only rearranged. Balancing an equation is how that law is written down. Count each element on both sides; if the counts differ, adjust the coefficient in front of a formula, never the subscript inside it.

A coefficient multiplies the whole formula. 2H₂O means two water molecules, so it contains four hydrogen atoms and two oxygen atoms. Changing H₂O to H₂O₂ changes the substance itself — that is hydrogen peroxide, not water — so subscript editing is not a balancing move. This is the single most damaging shortcut in the topic, because the equation then balances a reaction that did not happen.

Balance by inspection, one element at a time, leaving hydrogen and oxygen until late. For CH₄ + O₂ → CO₂ + H₂O: carbon is already one on each side; hydrogen needs two water molecules on the right, giving four hydrogen; that makes four oxygen on the right, so put a 2 in front of O₂ on the left. The balanced equation is CH₄ + 2O₂ → CO₂ + 2H₂O.

State symbols record the physical form: (s) solid, (l) liquid, (g) gas, (aq) dissolved in water. They are not decoration. A reaction between aqueous solutions and one that produces a gas look different in the laboratory, and the symbol is how the equation says so. Ionic equations go further and remove spectator ions, leaving only the species that actually change.

Recognise the common reaction types so a name can be attached to the equation: combination (two or more reactants form one product), decomposition (one reactant breaks into two or more), displacement (a more reactive element takes the place of a less reactive one), double displacement (ions swap partners, often making a precipitate), and redox (oxidation and reduction happen together). Exothermic reactions release energy and endothermic reactions absorb it; that is a separate fact from whether the equation balances.

### Terms

- **reactant:** A starting substance in a chemical reaction, written on the left of the arrow.
- **product:** A new substance formed in a chemical reaction, written on the right of the arrow.
- **coefficient:** The number in front of a formula; it multiplies the whole formula and is the only thing changed when balancing.
- **state symbol:** (s), (l), (g) or (aq), recording the physical state of a substance in the equation.

### Authored worked examples

**1. Balance: Fe + O₂ → Fe₂O₃.**

- Count oxygen: two on the left, three on the right. The lowest common multiple is six, so use 3O₂ and 2Fe₂O₃.
- That gives six oxygen on each side and four iron on the right.
- Balance iron: put a 4 in front of Fe on the left.
- Check every element: 4 Fe and 6 O on both sides.

Answer: **4Fe + 3O₂ → 2Fe₂O₃.**

**2. Balance: Al + HCl → AlCl₃ + H₂.**

- Chlorine appears as HCl on the left and AlCl₃ on the right; the lowest common multiple of 1 and 3 is 3, so use 3HCl and 1AlCl₃.
- That gives three chlorine on each side and one aluminium on the right, so put a 2 in front of Al on the left? No — check hydrogen first: 3HCl gives three hydrogen, and H₂ needs two.
- Use 6HCl instead: six chlorine and six hydrogen on the left. Then 2AlCl₃ gives six chlorine, and 3H₂ gives six hydrogen.
- Balance aluminium: 2Al on the left. Check: 2 Al, 6 H, 6 Cl on both sides.

Answer: **2Al + 6HCl → 2AlCl₃ + 3H₂.**

### Traps

- **Changing H₂O to H₂O₂ to make the oxygen count match.** The subscript is part of the substance's identity: H₂O is water and H₂O₂ is hydrogen peroxide. Changing it balances a reaction that did not happen. Only coefficients may change.
- **Counting molecules instead of atoms.** One O₂ molecule contains two oxygen atoms, and one H₂O molecule contains one. A count of 'two molecules on the left' says nothing about the number of atoms; the conservation law is about atoms.
- **Writing 2H₂ + O₂ → 2H₂O and then saying the mass has doubled.** The coefficients describe the ratio in which the substances react; they do not create extra mass. Four hydrogen atoms and two oxygen atoms are rearranged into two water molecules, and the total mass is unchanged.

### Where it is used next

Every later chemistry calculation — moles, concentrations, limiting reagents, electrolysis and energy changes — starts from a balanced equation, because the coefficients are the ratio in which particles react.

### Recap

- A balanced equation has the same number of each kind of atom on both sides; only coefficients may be changed.
- State symbols record solid, liquid, gas or aqueous form and are part of the chemistry, not decoration.
- Reaction types describe how atoms are rearranged; exothermic and endothermic describe the energy change, which is a separate question.

### Questions for the reviewer to check

**Q1.** Relative atomic masses:
· Ca = 40
· C = 12
· O = 16

150 g of CaCO₃ reacts completely:

CaCO₃ → CaO + CO₂

What mass of CaO is formed?
  - A. 84 g
  - B. 267.857 g
  - C. 56 g
  - D. 150 g
  - **Key:** A
  - **Explanation:** Convert what you are given into MOLES before using the equation: 150 ÷ 100 = 1.5 mol of CaCO₃. The equation's coefficients give the ratio, so 1.5 mol of CaO forms, weighing 1.5 × 56 = 84 g. The equation balances ATOMS, not masses: the product mass is different from the reactant mass because a different substance is being weighed.
  - **Misconception tags:** none

**Q2.** For the equation 2H₂ + O₂ → 2H₂O, how many oxygen atoms are on the LEFT-hand side in total?
  - A. 3
  - B. 4
  - C. 1
  - D. 2
  - **Key:** D
  - **Explanation:** There is one O₂ molecule on the left, and each O₂ has 2 atoms, so 2 oxygen atoms. The 2 in front of H₂ multiplies hydrogen only.
  - **Misconception tags:** mass-balance

**Reviewer decision:** approve for this scope / request revisions / reject.

---

## Circuits (`electricity-circuits`)

- **Subject / level:** physics · class10
- **State:** needs-educator-review — no structural gaps
- **Curriculum:** Electricity — Electric current and potential difference, Ohm's law, resistance, series and parallel circuits, and the heating effect of current.
- **Source:** Science (Subject Code 086), Class X — syllabus, Central Board of Secondary Education (India), Academic Unit, 2025-26 session — https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Science_Sec_2025-26.pdf
- **Mapping status:** provisional-unreviewed; reviewer: none
- **Rights:** clear — teaching openmind-authored-pilot-12, figures openmind-generated-figures, curriculum cbse-10-science-2025-26 (link-only); external assets: 0.

### Objective

Use V = IR to calculate current, voltage or resistance, and apply the series and parallel rules to a simple circuit.

### Intuition

A circuit is a closed path with a pump, a flow and a narrow place. The battery is the pump that gives charge energy; current is the rate at which charge flows; resistance is the narrowness that turns some of that energy into heat. The analogy is useful only up to a point — charge is not water, and it is not used up as it goes round — so the lesson replaces the picture with the quantities as soon as they are defined.

### Figure

Kind: `axes`. A current–voltage graph for a fixed resistor: the line passes through the origin and is straight, so V is proportional to I. The gradient of this line is the resistance (8 V ÷ 4 A = 2 Ω).

### The idea

Electric current is the rate of flow of electric charge: I = Q/t, measured in amperes (A), where one ampere is one coulomb per second. Conventional current is drawn from the positive terminal to the negative terminal, even though electrons move the other way. An ammeter measures current and is connected in series, because the same current must pass through it and the component.

Potential difference, or voltage, is the energy transferred per unit charge between two points: V = W/Q, measured in volts (V). One volt is one joule per coulomb. A voltmeter measures the difference across a component and is connected in parallel with it, because it must compare the two sides without interrupting the current.

Ohm's law says that, at constant temperature, the current through a metallic conductor is directly proportional to the potential difference across it: V = IR. Resistance R is measured in ohms (Ω) and depends on the material, length, cross-sectional area and temperature. A longer wire has more resistance; a thicker wire has less; a hotter metal usually has more.

In a series circuit there is one path, so the current is the same through every component. The potential differences add to the supply voltage, and the total resistance is the sum: R = R₁ + R₂ + … . Adding a resistor in series always increases the total resistance and reduces the current.

In a parallel circuit the components are connected across the same two points, so the potential difference is the same across each branch. The currents add to the total, and the total resistance is found from 1/R = 1/R₁ + 1/R₂ + … . The total resistance is less than the smallest branch resistance, because the extra branch gives charge another path.

Electrical power is the rate of energy transfer: P = VI = I²R = V²/R. A resistor converts electrical energy to heat, which is the heating effect used in a filament lamp, a kettle and a fuse. The same power can be delivered at a lower current by using a higher voltage, which is why electricity is transmitted at high voltage and low current: less energy is lost as heat in the cables.

### Terms

- **current:** The rate of flow of electric charge, measured in amperes; I = Q/t.
- **potential difference:** The energy transferred per unit charge between two points, measured in volts.
- **resistance:** The opposition to current in a component, measured in ohms; V = IR at constant temperature.
- **series:** A circuit with one path, so the same current flows through every component.
- **parallel:** A circuit with branches across the same two points, so the voltage is the same across each branch.

### Authored worked examples

**1. A 12 V battery is connected across a 4 Ω resistor. Calculate the current and the power dissipated.**

- Write the rule: V = IR, so I = V/R.
- Substitute: I = 12 V ÷ 4 Ω = 3 A.
- Use P = VI: P = 12 V × 3 A = 36 W. Check with P = I²R = 9 × 4 = 36 W.

Answer: **Current = 3 A; power = 36 W.**

**2. Two 6 Ω resistors are connected first in series and then in parallel across a 12 V supply. Find the total resistance and the total current in each case.**

- Series: R = 6 + 6 = 12 Ω. Current I = V/R = 12/12 = 1 A.
- Parallel: 1/R = 1/6 + 1/6 = 2/6, so R = 3 Ω. Current I = 12/3 = 4 A.
- Check the direction: the parallel combination has less resistance, so it draws more current from the same supply.

Answer: **Series: 12 Ω, 1 A. Parallel: 3 Ω, 4 A.**

### Traps

- **"The current is used up as it goes round the circuit."** Charge is conserved: the same current enters and leaves a component in series. What is transferred is energy, not charge. A bulb does not consume current; it transfers electrical energy to light and heat, and the current continues.
- **"Two resistors in parallel have a total resistance of R₁ + R₂."** The series rule adds resistances because the same current passes through both. In parallel, each branch has the same voltage and the currents add, so the total resistance is smaller than either branch — for two 6 Ω resistors it is 3 Ω, not 12 Ω. Adding a branch makes it easier for charge to flow.
- **"A voltmeter goes in series with the component."** A voltmeter has a very high resistance and is connected in parallel, so it measures the potential difference across the component without diverting much current. An ammeter has a very low resistance and goes in series. Swapping them gives a reading that is not the quantity asked for.

### Where it is used next

Household wiring, fuses, the heating effect, electrical power bills and the transmission of electricity all use these rules; later electromagnetism and electronics depend on them.

### Recap

- Current is charge flow per second, voltage is energy per unit charge, and resistance is the opposition that links them: V = IR.
- Series: same current, voltages add, resistances add. Parallel: same voltage, currents add, total resistance is less than the smallest branch.
- Power is P = VI; a higher voltage can deliver the same power at a lower current, which reduces heating losses in transmission.

### Questions for the reviewer to check

**Q1.** Two resistors, 5 Ω and 20 Ω, are connected in PARALLEL across a 6 V supply. What is the current drawn from the supply?
  - A. 1.5 A
  - B. 1.2 A
  - C. 0.24 A
  - D. 4 A
  - **Key:** A
  - **Explanation:** First combine the resistors: 1/R = 1/5 + 1/20, so R = (5 × 20) ÷ (5 + 20) = 4 Ω — LOWER than either resistor, which is what adding a parallel path means. Then I = V ÷ R = 6 ÷ 4 = 1.5 A. Adding the resistances (25 Ω) gives the answer for a SERIES circuit; here each resistor is across the full 6 V, so the currents add up instead of the resistances.
  - **Misconception tags:** none

**Q2.** Two resistors, 10 Ω and 6 Ω, are in PARALLEL. What is the total resistance, in ohms (2 d.p.)?
  - A. 60
  - B. 3.75
  - C. 4
  - D. 16
  - **Key:** B
  - **Explanation:** 1/R = 1/10 + 1/6, so R = (10×6)/(10+6) = 3.75 Ω. Adding them (16) is the series rule — parallel resistance is always smaller than the smallest branch.
  - **Misconception tags:** series-par

**Reviewer decision:** approve for this scope / request revisions / reject.

