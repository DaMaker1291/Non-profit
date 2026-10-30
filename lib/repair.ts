// ─────────────────────────────────────────────────────────────────────────────
// TARGETED REPAIR — the teaching that follows a SPECIFIC wrong move.
//
// The defect this exists for is one line of the concept page. On a wrong answer
// it printed:
//
//     <misconception name> — {coaching.split(".")[0]}.
//
// so a learner who broke a balance and a learner who added denominators read the
// same truncated sentence, and the sentence they read was the FIRST sentence of a
// paragraph written for a different purpose. The catalogue's `coaching` text is
// good, but it is one paragraph per belief, shown the same way to everybody, and
// cut at its first full stop.
//
// WHAT THIS ADDS, and why each part is here:
//
//   1. `reveals`   — what the wrong move shows about the idea, in the second
//                    person, so the learner recognises the move rather than the
//                    label. (A label is a verdict; a description is a diagnosis.)
//   2. `contrast`  — THE CONTRAST PAIR: two near-identical items, one in which
//                    the tempting move gives the right answer and one in which
//                    the very same move fails. This is the intervention the
//                    strategy note names twice, and it is the only one here that
//                    can change what a learner BELIEVES rather than what they
//                    remember: the pair isolates the single difference that
//                    decides the case.
//   3. `move`      — the corrected step as one instruction they can carry out,
//                    not a rule to recite.
//   4. `check`     — how to prove it independently, which is the only thing that
//                    turns a repair into evidence.
//
// HONESTY ABOUT ATTRIBUTION, which is a design decision and not a caveat. The
// bank tags an ITEM with the misconception it discriminates (`misconceptionTags`,
// one id per item); it does not tag each distractor, so the product cannot say
// "you chose the option that adds the denominators" — only "this question was
// built to catch this slip". The card therefore says what it knows: this is the
// slip the question was watching for. It never claims to have watched the
// learner's specific option.
//
// REVIEW STATE IS PART OF THE CONTENT (`plan.reviewed` / `plan.unreviewed` are
// reused on screen), because a repair written by the team and never read by a
// subject teacher must say so where the learner reads it.
// ─────────────────────────────────────────────────────────────────────────────
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";

/** The pair that isolates the decision: the same move, twice, with different
 *  outcomes. */
export interface RepairContrast {
  /** An item where the tempting move gives the RIGHT answer. */
  readonly works: string;
  /** Why it works here. */
  readonly worksNote: string;
  /** A near-identical item where the SAME move gives the wrong answer. */
  readonly fails: string;
  /** Why it breaks there. */
  readonly failsNote: string;
  /** The one thing that differs — the decision the learner has to make. */
  readonly difference: string;
  /** THE CORRECTED STEP FOR THIS MOVE, not for the slip in general. It lives on
   *  the pair for the same reason the pair exists: a slip can have two moves
   *  (`neg-slip`), and an instruction written for one of them is wrong advice
   *  about the other. Measured live: the card's single move sentence told a
   *  learner who had multiplied two negatives to "read the sign in front of the
   *  bracket". */
  readonly move: string;
}

export interface RepairPlan {
  readonly misconceptionId: string;
  /** The concept this repair is filed under. Checked against the misconception's
   *  own `concepts` list by `npm run verify`, so a repair cannot be attached to a
   *  pair that can never co-occur. */
  readonly conceptId: string;
  /** What the wrong move shows about the idea. Second person, describing the
   *  move rather than naming the learner. */
  readonly reveals: string;
  /** ONE OR MORE CONTRAST PAIRS. More than one when the slip has genuinely
   *  different moves behind the same name: `neg-slip` is both "subtracting a
   *  negative" and "multiplying two negatives", and an item drawn from the
   *  multiplication family was being answered with a pair about subtraction.
   *  Found by answering a real question on a running server, not by reading the
   *  data — the text was correct about a move the learner had not made. */
  readonly contrasts: readonly RepairContrast[];

  /** How to prove it without help. */
  readonly check: string;
  readonly review: "unreviewed" | "subject-reviewed";
}

/**
 * THE AUTHORED REPAIRS — one for every concept in the pilot pack (the count is
 * the pack's, and `npm run verify` reads it from there rather than trusting a
 * number written here: `audit/pilot-pack.json`). The pilot is the pathway whose
 * lessons are a sequence rather than a paragraph, and a lesson that opens where
 * the learner's slip is has to have something to open WITH: without an entry here the
 * branch renders nothing and that learner reads the lesson it always had. So the
 * two content sets are now the same set, which is a testable claim rather than a
 * slogan — `npm run verify` asserts that a repair exists for every pilot concept
 * that declares a misconception.
 *
 * A misconception with no entry still answers null and the page falls back to the
 * coaching sentence it always showed, so nothing renders empty outside the pilot.
 *
 * ONE PAIR PER SLIP, DELIBERATELY, except `neg-slip`. `contrastFor` picks between
 * pairs by the item's own operator, and a pair it cannot place makes the hint
 * ladder say something general — correct, but silent. Every pair here is written
 * to be true of the shape its concept actually serves (measured: 12 of 12 served
 * items on each of these five concepts carry the tag), so one pair that is always
 * returned teaches the move on screen, which two pairs would not.
 */
export const REPAIRS: Readonly<Record<string, RepairPlan>> = {
  // ── THE FOUNDATIONS RING ───────────────────────────────────────────────────
  // ── decimals · the point ────────────────────────────────────────────────
  //
  // TWO contrast pairs, because the bank's decimals items hide the same belief
  // behind two different moves: the adding family drops the point entirely
  // (0.3 + 0.4 = 7), and the multiplying family keeps it but counts places in
  // only one factor (0.3 × 0.2 = 0.6). A single pair about addition would tell a
  // learner who multiplied two decimals something about a move they had not
  // made — the exact defect `neg-slip` carries a second pair for.
  "dec-point@decimals": {
    misconceptionId: "dec-point",
    conceptId: "decimals",
    reveals:
      "The digits were multiplied or added as whole numbers and the point was then put back anywhere, or nowhere. The point is not punctuation — it records which place value each digit is in, so how many places the answer needs is decided by the question, not by taste.",
    contrasts: [
      {
        works: "0.3 + 0.4 = 0.7",
        worksNote:
          "Correct, and the point stayed where it was: three tenths and four tenths are seven tenths. Writing the numbers one under the other puts the points in the same column, so the digits being added are the same size.",
        fails: "0.3 + 0.4 = 7",
        failsNote:
          "Here the points were ignored, so 3 + 4 = 7 was computed and no point was put back. Seven is ten times seven tenths, and the answer is no longer even the same sort of number as the question.",
        difference:
          "Whether the digits were kept in their own place value while adding. The sum of two tenths is still counted in tenths.",
        move:
          "Write the numbers one under the other so the points line up in a column, add the columns, and keep the point in the same place in the answer.",
      },
      {
        works: "0.3 × 2 = 0.6",
        worksNote:
          "One of the factors has one decimal place, so the product has one: 3 × 2 = 6, one place back, 0.6. This is the case that makes \"just move the point once\" look like a rule.",
        fails: "0.3 × 0.2 = 0.06, not 0.6",
        failsNote:
          "BOTH factors have a decimal place, so the product needs two: 3 × 2 = 6, two places back. 0.6 is the answer to 0.3 × 2, and it is also ten times too big — a product of two numbers under 1 cannot be bigger than either of them.",
        difference:
          "How many decimal places the two factors had between them: one place in the first item, two in the second.",
        move:
          "Multiply the digits as whole numbers, count the decimal places in BOTH factors, and put that many back at the end. Then check: two numbers below 1 must multiply to something below both.",
      },
    ],
    check:
      "Work four items unaided — two additions and two multiplications, each written with the points lined up or the places counted beside it — and check every answer against an estimate: 0.3 + 0.4 is near half, and 0.3 × 0.2 is smaller than 0.3.",
    review: "unreviewed",
  },

  "frac-slice@fractions": {
    misconceptionId: "frac-slice",
    conceptId: "fractions",
    reveals:
      "The bottom number was read as a size, so a bigger denominator looked like more. It is the count of pieces the whole was cut into, and more pieces means smaller pieces — the top number is the one that says how much you get.",
    contrasts: [
      {
        works: "3/8 > 1/8",
        worksNote: "Correct, and it is where the \"bigger number is bigger\" instinct comes from: the bottoms match, so the pieces are the same size and the bigger top simply counts more of them.",
        fails: "1/8 < 1/4, not 1/8 > 1/4",
        failsNote: "Here it is the BOTTOM that changed. Cutting the same whole into eight instead of four made every piece half the size, so one piece of eight is less than one piece of four — even though 8 is bigger than 4.",
        difference: "Which of the two numbers changed. Changing the top adds pieces of the same size; changing the bottom resizes every piece.",
        move: "Before comparing, say what the bottom number is doing: \"cut into 8 equal pieces\", not \"8\". Then compare amounts of chocolate, not the numerals.",
      },
    ],
    check:
      "Draw two identical bars on paper, split one into quarters and the other into eighths, and shade a single piece in each. Then answer four comparison questions unaided — half of them with a repeated bottom and half with a repeated top — and check each by shading.",
    review: "unreviewed",
  },

  "denom-add@fraction-ops": {
    misconceptionId: "denom-add",
    conceptId: "fraction-ops",
    reveals:
      "The bottoms were treated as quantities and added with the tops. They are not quantities — the bottom names the SIZE of the piece being counted, so adding them changes the size of every piece in the answer and turns a sum into a number that no longer answers the question.",
    contrasts: [
      {
        works: "3/8 + 1/8 = 4/8 = 1/2",
        worksNote:
          "Correct, and it is where the instinct comes from: the pieces are the same size, so the tops simply count them and the bottom does not change. Nothing had to be converted.",
        fails: "2/3 + 5/6 = 9/6 = 1 1/2, not 7/9",
        failsNote:
          "Here the pieces are different sizes, so they have to be made the same before counting: 2/3 is 4/6, and 4/6 + 5/6 = 9/6. Adding the bottoms gives 7/9, which is SMALLER than 5/6 — and adding a positive amount to 5/6 cannot make it smaller.",
        difference:
          "Whether the two bottoms already match. Same size of piece means add the tops and keep the bottom; different sizes mean convert first, then add.",
        move:
          "Ask whether the bottoms match. If they do, add the tops. If they do not, rename one or both so they share a bottom — 2/3 = 4/6 — and only then add. Check the answer is bigger than the larger fraction.",
      },
      {
        works: "1/4 + 3/4 = 1",
        worksNote:
          "Four quarters fill the whole, and the tops add to the number of pieces that make it: 1 + 3 = 4 of them. The bottom stayed 4 because the piece never changed size.",
        fails: "1/2 + 1/3 = 3/5 or 2/5, not 5/6",
        failsNote:
          "Halves and thirds are different sizes, so neither top counts the other's pieces. Sixths is a size both can be counted in: 3/6 + 2/6 = 5/6. Both wrong answers are smaller than 1/2, which is impossible when you are adding to it.",
        difference:
          "Whether the fractions are already counted in the same unit. Halves and thirds are not; quarters and quarters are.",
        move:
          "Before adding, say what the pieces are out loud — \"halves and thirds\" — and if the words differ, find one size both can be counted in before doing any arithmetic.",
      },
    ],
    check:
      "Answer four additions unaided: two with matching bottoms, two where one fraction has to be rescaled — and write the size check beside each (the answer must be larger than the larger fraction).",
    review: "unreviewed",
  },

  "pct-base@percentages": {
    misconceptionId: "pct-base",
    conceptId: "percentages",
    reveals:
      "The second percentage was applied to the amount you started with instead of the amount you had by then. A percentage always acts on the CURRENT amount, and after a change the current amount is not the one from the beginning.",
    contrasts: [
      {
        works: "£100 − 10% → £90, so a further 10% is £9, not £10",
        worksNote: "Correct, and the numbers say why: the second 10% is taken of the £90 in front of you, so it is a smaller amount than the first. A fall shrinks its own base as it goes.",
        fails: "£100 + 20% → £120, then 20% of the ORIGINAL £100 = £20, giving £100 again",
        failsNote: "Wrong at the second step: the price in front of you is £120, so 20% of it is £24 and the tag reads £96. Taking the percentage of the original is the same as pretending the rise never happened.",
        difference: "Which amount the second percentage is taken of — the one in hand after the first change, or the one you began with.",
        move: "Write the change as a multiplier chain and multiply it out: ×1.2 then ×0.8 is ×0.96, which is a 4% loss in one line.",
      },
      {
        works: "A price rises 25% to £100: 100 ÷ 1.25 = £80, and 80 × 1.25 = 100 ✓",
        worksNote: "Correct: dividing by the multiplier undoes the change, because the 25% was taken of the 80 — so 80 is what must be multiplied by 1.25 to give 100.",
        fails: "100 − 25% = £75 as the original",
        failsNote: "Wrong: 25% of 100 is 25, but the 25% was never taken of 100 — it was taken of the original, which is the number you are trying to find. £75 × 1.25 = £93.75, not £100, so the answer fails its own check.",
        difference: "Which number the percentage was taken of. Going forwards the base is the starting amount; going backwards you must divide, never subtract.",
        move: "Name the base out loud before calculating — \"20% of WHAT?\" — and when the answer is the base itself, divide by the multiplier instead of subtracting.",
      },
    ],
    check:
      "Answer three questions unaided: a rise then a fall of the same percentage, the same the other way round, and one that gives you the final amount and asks for the original. Check each by multiplying your answer forward to see whether it reproduces the figure you were given.",
    review: "unreviewed",
  },

  "neg-slip@negatives": {
    misconceptionId: "neg-slip",
    conceptId: "negatives",
    reveals:
      "A minus sign was treated as decoration — dropped, or acted on only once — so the result points the wrong way. This slip shows up in two different moves, one about taking away and one about multiplying: read the pair that matches the question you were just asked, then the other.",
    contrasts: [
      {
        works: "5 − 3 = 2",
        worksNote: "Here the number after the minus is positive, so subtracting really does take 3 away and move you left.",
        fails: "5 − (−3) = 8, not 2",
        failsNote: "The number after the minus is itself negative, so you are taking away a deficit — removing a debt leaves you better off, and the move is to the RIGHT.",
        difference: "The sign of the number being subtracted. A minus touching a positive takes you left; a minus touching a negative takes you right.",
        move: "Read the sign in front of the bracket aloud before you calculate: \"subtract a negative\" becomes \"add\", and the move is to the right.",
      },
      {
        works: "2 × 4 = 8",
        worksNote: "Two positive numbers multiply to a positive product — nothing reverses the direction here.",
        fails: "(−2) × (−4) = 8, not −8",
        failsNote: "Each negative reverses the direction once, and two reversals cancel: the product of two negative numbers is positive. (−2) × 4 = −8 would be the one-negative case.",
        difference: "How many of the two numbers are negative. One negative gives a negative product; two give a positive one.",
        move: "Count the minus signs before multiplying: two of them cancel and the product is positive, one of them stays and the product is negative.",
      },
    ],
    check: "Answer four questions unaided from this idea — two where a negative is subtracted and two where two negatives are multiplied — and check each one on a number line.",
    review: "unreviewed",
  },

  "order-ops@order-ops": {
    misconceptionId: "order-ops",
    conceptId: "order-ops",
    reveals:
      "The expression was worked straight through from left to right, so a multiplication that had not been finished yet got joined to the number in front of it.",
    contrasts: [
      {
        works: "3 × 4 + 2 = 14",
        worksNote: "Left to right happens to give the right answer here, because the multiplication was written first anyway — the order did not have to be decided.",
        fails: "3 + 4 × 2 = 11, not 14",
        failsNote: "Here the multiplication is written second, and it still binds tighter than the addition: 4 × 2 is one quantity (8) before anything is joined to it.",
        difference: "Whether the multiplication appears before or after the addition in the written expression. Where it appears does not change its rank.",
        move: "Circle every multiplication and division before you touch anything else, then evaluate what you circled.",
      },
    ],
    check: "Evaluate five mixed expressions unaided, writing the circled operation out first each time, and check the hardest one with a calculator run in the same order.",
    review: "unreviewed",
  },

  "like-terms@algebra-expressions": {
    misconceptionId: "like-terms",
    conceptId: "algebra-expressions",
    reveals:
      "The counts and the letters were added together, which merges two things that are counted separately — a number of boxes and a number of counters.",
    contrasts: [
      {
        works: "3x + 2x = 5x",
        worksNote: "Both terms are the same size of thing, so their counts add and the letter part is unchanged: five boxes.",
        fails: "3x + 2y stays 3x + 2y, and 3x + 2x² stays as it is",
        failsNote: "x, y and x² are different things. Adding counts how many you have of each, so they can only be counted within their own family.",
        difference: "Whether the letter part is identical. Identical parts add; different parts sit side by side.",
        move: "Sort the terms into families by letter part first, then add the numbers in front of each family separately.",
      },
    ],
    check: "Simplify four expressions that mix x, x² and y without hints, then test one by substituting a value into both the original and your answer.",
    review: "unreviewed",
  },

  "bal-slip@linear-equations": {
    misconceptionId: "bal-slip",
    conceptId: "linear-equations",
    reveals:
      "An operation was applied to one side of the equation and not the other, so the two sides stopped being equal and the value you read off answers a different question.",
    contrasts: [
      {
        works: "3x + 5 = 20 → subtract 5 from both sides → 3x = 15 → x = 5",
        worksNote: "The same operation on both pans keeps the balance, and the check confirms it: 3(5) + 5 = 20.",
        fails: "3x + 5 = 20 → 3x = 25",
        failsNote: "The 5 moved across without changing sign, which is the same as adding 5 to one side only. Testing x = 8 gives 29 ≠ 20, so it was never a solution.",
        difference: "Whether the operation was performed on the whole of both sides. A term that crosses the equals sign must change sign because subtracting it is what moves it.",
        move: "Write the operation on its own line under both sides — \"subtract 5 from both sides\" — before doing anything to either one.",
      },
    ],
    check: "Solve three two-step equations with unknowns on both sides, and substitute every answer back into the ORIGINAL equation.",
    review: "unreviewed",
  },

  "axis-swap@coordinates": {
    misconceptionId: "axis-swap",
    conceptId: "coordinates",
    reveals:
      "The two numbers were read in the wrong order: the pair was taken as (up, across) instead of (across, up), which puts the point where the numbers would name if the axes swapped jobs.",
    contrasts: [
      {
        works: "(3, 5) is 3 across and 5 up",
        worksNote: "The first number is the horizontal move and the second is the vertical one, so the pair walks 3 right, then 5 up — each axis keeps its own job.",
        fails: "(5, 3) is a different point from (3, 5)",
        failsNote: "Swapping the numbers moves the point rather than renaming the same one: 5 across and 3 up is elsewhere on the grid, and the swap reflects the original point in the line y = x.",
        difference: "Which axis each number belongs to. Across is always first and up is always second, whatever the sizes of the two numbers happen to be.",
        move: "Say the pair out loud as the instruction it is — \"across first, then up\" — before plotting it or reading it off the grid.",
      },
    ],
    check: "Name and plot four points without help, at least two of them with a negative coordinate, then read one back off the grid and compare it with the pair you wrote.",
    review: "unreviewed",
  },

  "neg-exp@indices-intro": {
    misconceptionId: "neg-exp",
    conceptId: "indices-intro",
    reveals:
      "A negative index was read as a negative value. The index counts copies and picks the direction — it never tells you the sign of the answer.",
    contrasts: [
      {
        works: "2³ = 8",
        worksNote: "A positive index counts copies of the base: three 2s multiplied together.",
        fails: "2⁻³ = 1/8, not −8",
        failsNote: "A negative index means the reciprocal — one over the same power. The value stays positive, which is why the answer is smaller than 1 rather than below zero.",
        difference: "The sign of the INDEX chooses between multiplying and taking the reciprocal. It says nothing about whether the answer is positive or negative.",
        move: "Rewrite any negative index as a fraction — a⁻ⁿ → 1/aⁿ — before you calculate anything.",
      },
    ],
    check: "Rewrite five negative indices as fractions unaided, and check one by dividing the powers out longhand (a² ÷ a⁵).",
    review: "unreviewed",
  },

  // ── THE REST OF THE PILOT ──────────────────────────────────────────────────
  // Symptoms all five of the items below are drawn for: the served bank for each
  // of these concepts is dominated by ONE shape (expand two brackets and read b;
  // read the gradient off y = mx + c; give q after completing the square; give
  // one root of a factorable quadratic; simplify a surd). That was measured on
  // the serve, not assumed, and it is what shapes each pair: a repair for the
  // catalogue's general belief, written for a move the served item never asks
  // for, is the defect `-9 + 6` exposed on the card.

  "sign-slip@algebra-expand": {
    misconceptionId: "sign-slip",
    conceptId: "algebra-expand",
    reveals:
      "The middle term came out of the two numbers rather than out of the cross terms. The coefficient of x is the two cross products added WITH their signs — so a minus in one bracket makes the numbers work against each other, and an item with no minus at all still needs both cross terms added rather than one of them counted twice.",
    contrasts: [
      {
        works: "(x + 3)(x + 2) = x² + 5x + 6",
        worksNote:
          "Both brackets hold a plus, so the two numbers really do work together: adding them gives the coefficient of x and multiplying them gives the constant, and the shortcut agrees with the full expansion.",
        fails: "(x + 2)(x − 5) = x² − 3x − 10, not x² + 7x − 10",
        failsNote:
          "The −5 multiplies the x as well as the 2, so the cross terms are −5x and +2x and they partly cancel: b is −3, not the 2 + 5 = 7 the two numbers give when their signs are dropped. The constant −10 is right, which is what makes the wrong answer convincing.",
        difference:
          "The sign on one bracket. The coefficient of x is the two numbers added WITH their signs, so a minus makes them work against each other instead of together.",
        // NO NUMBERS FROM THE PAIR'S OWN EXAMPLE IN HERE. The move is also rung 3
        // of the hint ladder, on whatever item the learner is holding, and it
        // originally read "x·x, x·(−5), 2·x, 2·(−5)" — which quotes a minus that
        // the served item `(x + 5)(x + 7)` does not contain (found by building
        // the ladder and reading it, not by reading this file).
        move: "Write all four products on one line with their signs before collecting anything — every term in the first bracket times every term in the second — so each sign is multiplied rather than assumed.",
      },
    ],
    check: "Expand three products where exactly one bracket holds a minus, unaided, and check each by substituting x = 1: the expanded form and the original brackets must give the same number.",
    review: "unreviewed",
  },

  "grad-run@straight-lines": {
    misconceptionId: "grad-run",
    conceptId: "straight-lines",
    reveals:
      "The gradient was read without deciding which way the line goes. Either the two differences went the wrong way up, or a minus in front of the x was dropped — and either way the number written describes a different line from the one in the question.",
    contrasts: [
      {
        works: "y = 4x + 1 has gradient 4",
        worksNote:
          "The number multiplying x is the gradient, and here it is positive: for every 1 across the line goes 4 up, so the line rises as you read it left to right.",
        fails: "y = −3x + 1 has gradient −3, not 3",
        failsNote:
          "The minus belongs to the coefficient, not to the equation: for every 1 across the line goes 3 DOWN, so the gradient is negative. The +1 is where the line crosses the y-axis and says nothing about steepness — reading it as the gradient is the second half of the slip.",
        difference:
          "Whether the number in front of x carries a minus. The constant is the crossing point; the coefficient, with its sign, is the steepness.",
        move: "Cover everything except the term holding x, keep the minus attached to it, and read that number as the gradient — then say out loud whether the line rises or falls.",
      },
    ],
    check: "Find the gradient of y = −4x + 2 and of the line through (1, 5) and (4, −1) unaided, and say which of the two falls from left to right.",
    review: "unreviewed",
  },

  "b-half@completing-square": {
    misconceptionId: "b-half",
    conceptId: "completing-square",
    reveals:
      "The square was written into the answer without giving back the number the trick had just added, so q came out as the original constant. The bracket builds in a square the expression did not have, and nothing took it away again.",
    contrasts: [
      {
        works: "x² + 4x + 4 = (x + 2)²",
        worksNote:
          "Here the constant already IS the square the trick adds — half of 4 is 2, and 2² = 4 — so there is nothing left to give back and the bracket alone is the whole answer.",
        fails: "x² + 4x + 9 = (x + 2)² + 5, not (x + 2)² + 9",
        failsNote:
          "The bracket builds a 4 into the expression, not a 9: (x + 2)² expands to x² + 4x + 4, so the 5 that is left over is 9 − 4. Writing + 9 counts the 4 twice — once inside the bracket and once in the constant.",
        difference:
          "Whether the constant equals (b/2)². When it does, the correction is zero and the bracket alone is right; when it does not, the difference has to be carried outside as q.",
        move: "Write the square of the halved coefficient as its own number first, then write \"original constant − that number\" before simplifying q.",
      },
    ],
    check: "Complete the square on three expressions with different constants unaided, then EXPAND each answer back and check it matches the expression you started with.",
    review: "unreviewed",
  },

  "lost-root@quadratics": {
    misconceptionId: "lost-root",
    conceptId: "quadratics",
    reveals:
      "Only one solution came out of a quadratic. Either the equation was divided by x, which deletes the root at zero, or the two brackets were not both read, so a root that exists never appeared — and a question asking for the smaller one is then a guess between one number and nothing.",
    contrasts: [
      {
        works: "x² − 7x + 6 = 0 → (x − 1)(x − 6) = 0 → the roots are 1 and 6",
        worksNote:
          "Two brackets, two roots, both on the page before the question is answered. That is what makes 'the smaller root' a choice between two numbers rather than a guess.",
        fails: "x² = 3x → divide by x → x = 3, and a root has gone missing",
        failsNote:
          "x = 0 satisfies the original, 0 = 0, so it is a root and the division deleted it. Dividing by x quietly assumes x is not zero. Factorising keeps it: x(x − 3) = 0 gives x = 0 or x = 3, and the smaller root is 0.",
        difference:
          "Whether every term carried an x. With a constant term, zero cannot be a root at all; with none, zero IS a root and dividing by x throws it away — and both brackets still have to be read either way.",
        move: "Move everything to one side and factorise, read one root off each bracket, and write the full list before choosing the smaller or the larger.",
      },
    ],
    check: "Solve four quadratics unaided — two with a missing constant and two without — write every root down before answering, then substitute each root back into the equation you started with.",
    review: "unreviewed",
  },

  "sqrt-prod@surds": {
    misconceptionId: "sqrt-prod",
    conceptId: "surds",
    reveals:
      "The root was split in a way that only ever works for multiplication. A square root divides a PRODUCT into the roots of its factors and lets out only the SQUARE ones — it never splits a sum, and it never sends a factor out without taking its root.",
    contrasts: [
      {
        works: "√12 = √(4 × 3) = 2√3",
        worksNote:
          "12 splits as 4 × 3, the 4 is the square factor, so its root 2 leaves and the 3 stays inside. Squaring back checks it: (2)² × 3 = 12.",
        fails: "√27 = 3√3, not 3√9",
        failsNote:
          "27 splits as 9 × 3, so the square is the 9 and the number that leaves is its root, 3 — the 9 must not travel with it. Since √9 is 3, writing 3√9 is really 9, and the true value is about 5.2.",
        difference:
          "Which of the two factors leaves the root. The SQUARE factor leaves, as its own root; the factor that is not a square stays underneath. Swapping them multiplies the answer by √3.",
        move: "Find the largest square number that divides the number under the root, put its root outside and leave the rest inside, then square your answer back to check.",
      },
    ],
    check: "Simplify √50, √72 and √27 unaided and square each answer back to the number you started with; then work out √9 + √16 and √(9 + 16) and say which one is 7 and which is 5.",
    review: "unreviewed",
  },
};

/** THE PAIR THAT MATCHES THE ITEM IN FRONT OF THE LEARNER.
 *
 *  The card prints every pair, because a repair is read after the fact and a
 *  slip with two moves is best understood by seeing both. A HINT cannot: it is
 *  one short instruction, read BEFORE the answer, and an instruction written for
 *  "take away a negative" handed to a learner facing (−4) × (−5) is wrong advice
 *  about the move in front of them — the defect the card's two-move list was
 *  fixed for, one surface over.
 *
 *  So a hint asks this function which pair the item is about, and the answer can
 *  be NULL: null means "this repair does not describe the shape of this item",
 *  and a caller must then say something general rather than hand over an
 *  instruction about a move that is not on the screen.
 *
 *  THAT NULL WAS FOUND LIVE, not reasoned about. The first version of this rule
 *  fell back to the first pair, and a served `-9 + 6` gave the learner "read the
 *  sign in front of the bracket aloud" — an item with no bracket, in a repair
 *  written for `5 − (−3)`. The same mistake the card's single-move instruction
 *  made, one level down.
 *
 *  A SINGLE-PAIR PLAN IS ALWAYS ITS OWN PAIR: those moves are shape-independent
 *  ("circle every multiplication", "rewrite a negative index as a fraction"), so
 *  a match would only reject correct advice. */
const MUL = /[×*]|\btimes\b/;
/** A minus meeting a minus: `5 − (−3)`, `− −3`, `-(-3)`. NOT any minus — an
 *  addition like `-9 + 6` is a third shape this repair does not describe. */
const NESTED_MINUS = /[−-]\s*\(\s*[−-]|[−-]\s*[−-]/;

export function contrastFor(plan: RepairPlan, prompt: string): RepairContrast | null {
  if (plan.contrasts.length === 1) return plan.contrasts[0];
  // Multiplication is tested FIRST and deliberately: `(-4) × (-5)` contains a
  // minus as well, and it is a multiplication question.
  const want = MUL.test(prompt) ? MUL : NESTED_MINUS.test(prompt) ? NESTED_MINUS : null;
  const hit = want ? plan.contrasts.find((c) => want.test(c.fails)) : undefined;
  return hit ?? null;
}

/** The repair for one learner's specific slip, or null when nobody has written
 *  one. Null is the normal answer outside the authored set, and the page then
 *  shows the catalogue's coaching sentence as it always did. */
export function repairFor(conceptId: string, misconceptionId: string | null | undefined): RepairPlan | null {
  if (!misconceptionId) return null;
  return REPAIRS[`${misconceptionId}@${conceptId}`] ?? null;
}

/** The key a repair is filed under, so the suite and the callers agree on the
 *  shape rather than re-deriving it. */
export function repairKey(misconceptionId: string, conceptId: string): string {
  return `${misconceptionId}@${conceptId}`;
}

/** Every repair whose misconception does not actually list its concept — a pair
 *  that can never co-occur, which would be a card that never renders. Empty is
 *  the only acceptable answer, and `npm run verify` asserts it. */
export function orphanRepairs(): string[] {
  return Object.values(REPAIRS)
    .filter((r) => {
      const m = MISCONCEPTIONS_BY_ID[r.misconceptionId];
      return !m || !m.concepts.includes(r.conceptId);
    })
    .map((r) => repairKey(r.misconceptionId, r.conceptId));
}

/** Repairs with no author, or with text too thin to teach from. Measured in the
 *  suite rather than trusted. */
export function thinRepairs(): string[] {
  const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
  return Object.values(REPAIRS)
    .filter((r) => {
      const thinPlan = words(r.reveals) < 12 || words(r.check) < 8 || r.contrasts.length === 0;
      const thinPair = r.contrasts.some(
        (c) =>
          words(c.move) < 5 ||
          words(c.worksNote) < 8 ||
          words(c.failsNote) < 12 ||
          words(c.difference) < 8 ||
          c.works === c.fails,
      );
      return thinPlan || thinPair;
    })
    .map((r) => repairKey(r.misconceptionId, r.conceptId));
}
