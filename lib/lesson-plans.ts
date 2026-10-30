// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED LESSONS — a concept's teaching, as a SEQUENCE rather than a
// paragraph.
//
// The genome gives every concept a `lesson` field of two to four sentences. That
// is enough to remind someone, and not enough to teach someone who has never met
// the idea — which is the learner this product exists for. The read stage was
// therefore a paragraph followed by a question, and the first item a learner met
// was also the first they had to do unaided.
//
// This module is the missing half: an authored plan per concept that the lesson
// page renders in the order a classroom uses.
//
//   1. objective   — what you will be able to DO by the end (not a topic name)
//   2. intuition   — a concrete situation the idea already lives in, before any
//                    terminology, so the words have something to attach to
//   3. idea        — the formal teaching, one paragraph per idea, several of
//                    them: this is the part that was one sentence long
//   4. worked      — a real item from the concept's own generator, solved (the
//                    page composes this from the live bank; see
//                    app/api/worked-example/route.ts, so it can never drift
//                    from what the practice serves)
//   5. together    — the same, faded: the first step is shown, the learner
//                    supplies the rest, then checks
//   6. traps       — the wrong moves a learner actually makes here, each with
//                    WHY it fails, because "don't do that" teaches nothing
//   7. your turn   — the door into practice
//
// WHY THIS IS A SEPARATE FILE AND NOT A GENOME FIELD. The genome's rows are a
// compact tuple table with 135 entries; a structured lesson does not fit in a
// tuple, and reshaping that table to carry one would have touched every row and
// every gate that reads it. Keeping plans keyed by concept id also makes the
// coverage honest and countable: `planFor` answers null for a concept nobody has
// written a plan for, and the page then renders the prose it always did. There is
// no generated filler standing in for teaching nobody wrote.
//
// PROVENANCE IS PART OF THE CONTENT (§3 of the strategy note: authored ≠
// reviewed ≠ pilot-tested). Every plan states its review state, and the page
// PRINTS it. A lesson written by the team and never read by a subject teacher
// must say so on the screen, not just in a document.
// ─────────────────────────────────────────────────────────────────────────────
import { CONCEPTS } from "./genome";
import type { FigureSpec } from "./types";

/** One wrong move, and why it does not work. */
export interface LessonTrap {
  /** What the learner does — written as they would say it. */
  readonly move: string;
  /** Why it fails. Never "that's just the rule": a trap a learner cannot see
   *  through is a rule to memorise, and rules to memorise are what they came
   *  here to escape. */
  readonly why: string;
}

/** How far a plan has been checked. The strategy note's review ladder starts
 *  here and climbs; a plan may not claim a rung it has not reached. */
export type PlanReview =
  /** Written by the project team. No subject teacher has read it. */
  | "unreviewed"
  /** A qualified teacher of the subject has read the mathematics and the
   *  explanations. */
  | "subject-reviewed";

export interface LessonPlan {
  /** The genome id this teaches. Checked against the genome by `npm run
   *  verify` — a plan filed under a typo'd id would render for nobody. */
  readonly conceptId: string;
  /** One sentence, action-first: what the learner will be able to do. */
  readonly objective: string;
  /** A concrete situation, before terminology. */
  readonly intuition: string;
  /** The formal teaching — one paragraph per idea, in the order it must land. */
  readonly idea: readonly string[];
  /** Wrong moves, each with the reason it fails. */
  readonly traps: readonly LessonTrap[];
  /** Where this idea is used next, in plain words, so the concept is not an
   *  island: the read stage prints it under the practice door. */
  readonly usedFor: string;
  readonly review: PlanReview;
  /** THE PICTURE THIS IDEA NEEDS, when it needs one.
   *
   *  A figure belongs to a plan only when the picture makes a relationship
   *  visible that prose has to assert — the direction of a negative jump, what
   *  "both sides" looks like, the term an incomplete expansion leaves out. A
   *  diagram drawn beside every lesson is decoration, and decoration teaches a
   *  learner to skip pictures.
   *
   *  The caption is the teaching, in words, and is required: the SVG itself is
   *  `aria-hidden` (see components/question-figure.tsx), so a learner using a
   *  screen reader — or printing in greyscale, or on a phone — must be able to
   *  get the whole point from the sentence under it. */
  readonly figure?: { readonly spec: FigureSpec; readonly caption: string };
}

/**
 * THE AUTHORED PLANS.
 *
 * Deliberately a small set, and deliberately the START of the GCSE pilot
 * cluster rather than its end: these are the stage 0–1 concepts (negatives,
 * order of operations, expressions, coordinates, indices, equations) that every
 * later concept in the pathway stands on, and they are the concepts whose
 * one-paragraph lessons were thinnest. `algebra-expand`, `straight-lines`,
 * `completing-square`, `quadratics` and `surds` complete that pathway, so ALL
 * ELEVEN concepts of the reviewed pilot now teach as a sequence.
 *
 * THEN THE FRONT OF THE PATHWAY WAS CLOSED. `fractions` and `percentages` are
 * the two concepts the pilot assumed and did not teach — the first prerequisite
 * of the data-and-ratio work every science course leans on. They are authored
 * here as a SEQUENCE (fractions → percentages, with `decimals` between them in
 * the genome and still on the prose), which makes THIRTEEN. The other 122
 * concepts still render the prose: this is a pathway with both ends closed, not
 * the curriculum, and saying otherwise is the exact claim this format exists to
 * avoid. `npm run verify` measures the count rather than trusting this
 * paragraph, and `audit/pilot-pack.json` is regenerated from it.
 */
export const LESSON_PLANS: Readonly<Record<string, LessonPlan>> = {
  // ── THE FOUNDATIONS RING, ADDED AFTER THE PILOT WAS VERIFIED ────────────────
  //
  // The pilot is a pathway through stage 0–3 algebra and number. A learner who
  // wants to START that pathway cannot: `fractions` is a prerequisite of
  // `percentages`, which is a prerequisite of the ratio and proportion work every
  // science course assumes, and all of them still rendered the genome paragraph.
  //
  // These two are the smallest sequence that closes the FRONT of the pathway
  // rather than extending its tail: `fractions` is where a learner who cannot
  // order 1/4 and 1/8 is stuck, and `percentages` is the one concept the whole of
  // data, finance and science teaching leans on. Both are in the served bank (so
  // the worked example and the practice are real items, not prose), and both name
  // a misconception the catalog already holds — which is what lets the read stage
  // open on a learner's own slip instead of a generic paragraph.
  // ── decimals · the first concept in the pilot pathway ───────────────────
  //
  // The entry point of the pathway and the one concept with no teaching at all:
  // a learner arriving at the start of the course met a paragraph and then a
  // question. It is deliberately placed here, before `fractions`, because that
  // is the order a learner meets them — the same quantity written two ways.
  //
  // NO FIGURE, on purpose. The relationship this lesson turns on is PLACE VALUE —
  // the column a digit sits in — and no kind the union declares draws a
  // place-value table: a pie of 0.45 would show that almost half is shaded and
  // say nothing about why 0.45 < 0.5, which is the thing being taught. A drawing
  // that teaches nothing is decoration, and decoration teaches a learner to skip
  // pictures.
  decimals: {
    conceptId: "decimals",
    objective:
      "Read 0.45 aloud as 45 hundredths, put a list of decimals in size order, and add or multiply two of them without losing the decimal point.",
    intuition:
      "Two prices on a shelf: £0.50 and £0.45. The second one has MORE digits, and the first is worth more — 50p beats 45p. That is the whole difficulty of decimals in one comparison: the digits are not the amount, their position is. A decimal continues the place-value system whole numbers already use, past a point and into tenths, hundredths and thousandths, so the column a digit sits in decides what it counts.",
    idea: [
      "Read the point as the word \"and\": 0.45 is 4 tenths and 5 hundredths, which is 45/100. Everything to the right of the point is a fraction whose denominator is a power of ten, and each step further right divides the value by ten again — tenths, then hundredths, then thousandths. A digit's position is doing exactly the work it does in 452, where the 4 means 400, except now it continues into amounts smaller than one.",
      "Comparing decimals is decided column by column, not by how long the number is. Write them with the same number of places — 0.5 becomes 0.50 — and compare from the left: the tenths decide it, and only if they tie do you look at the hundredths. That is why 0.09 is smaller than 0.1 despite 9 being bigger than 1: 0.09 has no tenths at all, and 0.1 has one.",
      "To add or subtract, put the points in a line — one number under the other with the points in the same column — fill any gaps with zeros, and add the columns exactly as you would whole numbers. 0.3 + 0.4 is three tenths plus four tenths: seven tenths, 0.7. The point is not written in because it was moved; it stays in the column it started in, which is why lining it up is the whole method.",
      "Multiplying needs a different routine, because the columns no longer have to match. Multiply the digits as if the points were not there, then count the decimal places in BOTH factors and put that many back into the answer: 3 × 2 = 6, and 0.3 and 0.2 have one place each, so the answer needs two — 0.06. That count is not a trick; tenths times tenths really is hundredths, which is the same fact as 1/10 × 1/10 = 1/100.",
      "A decimal is one quantity written in another notation, so converting costs nothing: 0.45 = 45/100 = 45%. The same number can be a price, a length, a probability or a percentage, and none of those changes its size. What does change is the precision a written decimal claims — 2.4 said to one decimal place means \"between 2.35 and 2.45\" — which is why rounding is a decision about which column matters rather than a tidy-up.",
      "Multiplying or dividing by ten shifts the digits, not the quantity: 0.45 × 10 = 4.5 and 0.45 ÷ 10 = 0.045, with the point moving one place each time because every digit has moved one column. That is the one legitimate use of \"move the point\", and saying the operation out loud — \"divide by ten\" — keeps it attached to something true.",
    ],
    traps: [
      {
        move: "\"0.45 is bigger than 0.5, because 45 is bigger than 5.\"",
        why: "Comparing the digits as if the point were not there ignores the column each one is in. Give both numbers the same number of places — 0.50 against 0.45 — and the tenths decide: five tenths beat four tenths. A longer decimal is not a bigger amount; 0.09 is smaller than 0.1.",
      },
      {
        move: "\"0.3 × 0.2 = 0.6.\"",
        why: "That is 0.3 × 2 — the point moved one place when the two factors had two decimal places between them. 3 × 2 = 6, so two places back gives 0.06. The check that catches it: multiplying two numbers smaller than 1 must give an answer smaller than either of them, and 0.6 is bigger than 0.3.",
      },
      {
        move: "\"0.3 + 0.4 = 7, because 3 + 4 = 7.\"",
        why: "Dropping the points multiplied both numbers by ten, so the answer is ten times too big. Three tenths plus four tenths is seven tenths, 0.7. Write the numbers one under the other with the points in a column: the digits you are adding are then the ones in the same place value.",
      },
    ],
    usedFor:
      "Percentages (0.45 is 45%), measurement to a stated precision, ratio and standard form all read decimals, and rounding an answer to one decimal place is a judgement about which column the question cares about.",
    review: "unreviewed",
  },

  fractions: {
    conceptId: "fractions",
    objective: "Read a fraction as a number, compare two of them, and say why 1/8 is smaller than 1/4 when 8 is bigger.",
    intuition:
      "Two chocolate bars, identical. One is broken into four pieces, the other into eight, and you are handed one piece of each. The eight-piece bar gave you the SMALLER piece even though 8 is the bigger number — because the number underneath the fraction is not how much you get, it is how many pieces the bar was cut into. Every fraction question starts by asking which of those two things the number is doing.",
    idea: [
      "A fraction counts equal pieces of one whole. In 3/4 the bottom number, 4, says the whole was cut into four equal pieces; the top number, 3, says how many of them you have. Say it out loud that way — \"three pieces, each a quarter\" — and the notation stops being two numbers stacked up.",
      "The bottom number is a SIZE, not a quantity. Cutting a bar into more pieces makes each piece smaller, so a bigger denominator means a smaller slice: 1/8 < 1/4. This is the single most common wrong answer in the whole of fractions, and it is not carelessness — it is reading the denominator as an amount, which is exactly what the top number is for.",
      "Equivalent fractions say the same amount in different pieces. 1/2 = 2/4 = 3/6 because multiplying the top and the bottom by the same number doubles the count AND halves the slice size, so the amount of chocolate is unchanged. That is why you may scale a fraction up or down as long as you scale both parts: you are renaming the pieces, not changing the amount.",
      "To compare fractions with different bottoms, make the pieces the same size — a common denominator. 2/3 and 3/4 become 8/12 and 9/12, and now the tops can be compared directly. The other reliable method needs no arithmetic: compare each fraction with 1/2. A fraction whose top is less than half its bottom (3/8) is below 1/2, and one whose top is more than half its bottom (5/8) is above it, so 3/8 < 5/8 and you never had to compute anything.",
      "A fraction is ONE number, not a division you have not finished. 3/4 sits at a definite place on the number line, between 0 and 1, closer to 1 than to 0 — and once you can see it there, adding, comparing and scaling it are operations on a number rather than rules about two integers that happen to be written on top of each other.",
      "Decimals and percentages are the same idea in other notation: 3/4 = 0.75 = 75%. Nothing about the quantity changes when the notation does, and a learner who knows where 3/4 sits on the line already knows most of what the next two concepts teach.",
    ],
    traps: [
      {
        move: "\"1/8 is bigger than 1/4 because 8 is bigger than 4.\"",
        why: "The bottom number counts the pieces, so a bigger bottom means each piece is smaller. Cut the same bar into eight and every piece is half the size of the quarter you had before. Compare the slices, not the numbers.",
      },
      {
        move: "\"2/3 is bigger than 3/4 because 2 and 3 are bigger than 3 and 4 in the other one.\"",
        why: "Comparing tops alone only works when the bottoms match. Here the pieces are different sizes, so 2 of one size and 3 of another cannot be counted against each other until the sizes are made equal: 8/12 against 9/12.",
      },
      {
        move: "\"3/4 + 1/4 = 4/8.\"",
        why: "Adding the bottoms together changes the size of every piece in the answer, so the addition is no longer about the same wholes. Quarters and quarters are the same size, so the tops simply add: 3/4 + 1/4 = 1. (Different bottoms are next concept, and they need a common denominator first.)",
      },
    ],
    usedFor:
      "Percentages and decimals are fractions in another notation, ratio compares two of them, and probability is one: the chance of a six is 1/6, which is a fraction before it is ever a percentage.",
    review: "unreviewed",
    // THE PICTURE THE IDEA NEEDS. "A bigger bottom means smaller pieces" is a
    // claim about SHAPE — the same circle, cut more ways — so the drawing shows
    // three quarters of one whole and the caption says what to notice: four of
    // these slices fill it.
    figure: {
      spec: { kind: "pie", sectorDegrees: 270, label: "3/4" },
      caption:
        "Three quarters of one whole: the circle is the 1, and the shaded part is three of its four equal slices. A quarter is one slice, so three of them are 3/4 — and four of them would fill the circle exactly.",
    },
  },

  // ── THE LINK BETWEEN THE TWO, AND THE MOST-HIT BELIEF IN THE BANK ────────
  //
  // `denom-add` is the misconception this concept exists for, and until now it
  // had a name, a pattern, a coaching paragraph and NO REPAIR — a learner who
  // added the bottoms was told what they had done and given nowhere to go. The
  // concept sits between `fractions` (what a fraction IS) and `percentages`
  // (what a proportion OF something is), so the pathway now runs front to back
  // without a hole in the middle.
  "fraction-ops": {
    conceptId: "fraction-ops",
    objective:
      "Add and subtract two fractions whose bottoms differ, by making the pieces the same size first — and say why the bottoms are never added.",
    intuition:
      "Two people both eat some pizza. One eats half of a pizza, the other eats a third of a pizza the same size. Together they have not eaten two fifths of anything: a half and a third are counts of DIFFERENT-SIZED pieces, and until both are counted in the same size, there is no number to add. That is the whole method, and the only reason a common denominator appears at all — it is the unit you agree to count in.",
    idea: [
      "The bottom number names the size of the piece being counted. 3/4 is \"three quarters\"; 2/3 is \"two thirds\". Adding them is asking for a count of pieces you have not yet chosen a size for, which is why the rule that follows is about converting and not about arithmetic.",
      "Any two fractions can be counted in the same size of piece, because multiplying the top and the bottom of a fraction by the same number renames the pieces without changing the amount: 1/2 = 3/6 = 50/100. The smallest shared size is convenient, not compulsory — the product of the two bottoms always works, and is what to do when the smallest is not obvious. For 2/3 and 5/6 the shared size is sixths: 2/3 = 4/6.",
      "Once the pieces match, the addition is the tops: 4/6 + 5/6 = 9/6. Nine sixths, which simplifies to 3/2, or 1 1/2. The bottom is not part of the addition because it is not a quantity — it is the name of the piece, and adding names is how 2/3 + 5/6 becomes 7/9, an answer smaller than 5/6, one of the numbers being added.",
      "That size check is what makes the wrong answer visible instead of plausible. Adding two positive fractions must give MORE than either one: 1/3 + 1/4 is more than 1/3, so 2/7 cannot be right — 2/7 is smaller than 1/3. Before writing an answer down, ask whether it is the right sort of size; it catches the denominator slip without any arithmetic at all.",
      "Subtraction uses the same method, and the same check in reverse: 3/4 − 2/3 = 9/12 − 8/12 = 1/12, which is less than 3/4 and more than nothing. A difference bigger than the number you started with is a sign that the pieces were never made the same size.",
      "Mixed numbers are added in two parts — the wholes, then the fractions — and the fraction part still needs a common denominator: 2 1/2 + 1 1/3 = 3 + (3/6 + 2/6) = 3 5/6. The answer is then simplified if it can be, and only at the end: 9/6 was 3/2 all along, and simplifying mid-calculation is how a learner loses a factor they needed.",
    ],
    traps: [
      {
        move: "\"2/3 + 5/6 = 7/9 — add the tops, add the bottoms.\"",
        why: "Adding the bottoms changes the size of the piece in the answer, so the sum is no longer about the same whole. The size check settles it without argument: 7/9 is smaller than 5/6, and adding 2/3 to 5/6 cannot make it smaller. Convert to sixths first: 4/6 + 5/6 = 9/6.",
      },
      {
        move: "\"2/3 + 5/6 = 7/6 — keep the bigger bottom and add the tops.\"",
        why: "Sixths is the right unit, but 2/3 was never converted into it: two thirds is four sixths, not two sixths. Keeping the denominator without rescaling the fraction quietly adds a smaller number than the question asked for. Nine sixths is the answer, and it is 1 1/2 rather than 1 1/6.",
      },
      {
        move: "\"2 1/2 + 1 1/3 = 3 2/5 — add the wholes, then the fractions.\"",
        why: "The whole parts may be added directly, but the fraction parts are counted in halves and thirds, so they need a shared size first: 3/6 + 2/6 = 5/6, giving 3 5/6. The 2/5 comes from adding halves to thirds as if the bottoms were quantities — the same slip as 1/2 + 1/3 = 2/5.",
      },
    ],
    usedFor:
      "Percentages (a percentage is a fraction with 100 on the bottom), ratio and proportion, probability added along a tree's branches, and algebraic fractions — x/2 + x/3 needs exactly this shared-denominator move with letters in it.",
    review: "unreviewed",
    // THE PICTURE STATES THE MOVE THE METHOD ASKS FOR. A shaded sector says "this
    // much"; the same shading with the circle cut into six says "four of six",
    // which is the fact a learner has to see before 5/6 can be added to it. The
    // sector is 240° of 360° = four of six slices, so the picture, the label and
    // the caption are one claim (and `npm run verify` drives that arithmetic).
    figure: {
      spec: { kind: "pie", sectorDegrees: 240, slices: 6, label: "2/3 = 4/6", showDegrees: false },
      caption:
        "Two thirds, cut into sixths: the same shaded amount is four of the six equal slices, because cutting each third in half doubles the count and halves the size. So 2/3 = 4/6 — and now 5/6 can be added to it directly, because both are counted in sixths.",
    },
  },

  percentages: {
    conceptId: "percentages",
    objective: "Find a percentage of an amount, work out a percentage change, and explain why a 20% rise followed by a 20% fall does not return to where you started.",
    intuition:
      "A shop raises a £100 jacket by 20%, and the price tag now reads £120. A month later it takes 20% off — and the tag reads £96, not £100. Nobody made a mistake and nothing was hidden: the second 20% was taken off a bigger number, because the first one had already changed what \"the price\" is. Percentages always act on whatever the amount is NOW, and almost every percentage error is a question about which amount that is.",
    idea: [
      "Per cent means \"per hundred\", so a percentage is a fraction with 100 on the bottom. 45% = 45/100 = 0.45, and 7% = 0.07. Writing the percentage as a decimal is not a shortcut, it is the definition: it is the number you can multiply by.",
      "\"Of\" is multiplication. 15% of 60 is 0.15 × 60 = 9. Two reliable ways to get there: build 10% by dividing by 10 (6), then take half of that for 5% (3) and add them for 15% (9); or multiply by the decimal in one step. The first is what people do in a shop without a calculator, and the second is what generalises.",
      "Percentage CHANGE always divides by the ORIGINAL amount. If a price goes from 80 to 92, the change is 12 and the original is 80, so the change is 12/80 = 15%. Dividing by the new amount would give 12/92 ≈ 13% — a number that is not the change at all, because the change was measured against what you started with.",
      "One multiplication can do a whole percentage change, and this is the tool that makes the jacket obvious. A 20% rise multiplies by 1.2; a 20% fall multiplies by 0.8. Doing both is ×1.2 then ×0.8 = ×0.96 — a 4% LOSS, because 0.96 is less than 1. The two percentages do not cancel: the second multiplies a bigger base, which is why the fall takes more money than the rise added.",
      "Reversing a percentage change is division, not subtraction. If £96 is the price AFTER a 20% rise, the original is 96 ÷ 1.2 = £80. Subtracting 20% of £96 gives £76.80 and is wrong, because the 20% was taken of the original — the very number the question is asking for.",
      "Percentages of different wholes cannot be compared directly. 30% of a small class and 20% of a large one can be the same number of learners, so a percentage on its own says how much of a whole, never how many. Say what the whole is before you compare two percentages — that is the same discipline the percentage-change rule enforces, applied to two quantities at once.",
    ],
    traps: [
      {
        move: "\"A 20% rise then a 20% fall returns to the starting price.\"",
        why: "The second percentage acts on the raised price, so 20% of it is a bigger amount of money than the first 20% added. In multipliers: 1.2 × 0.8 = 0.96, a 4% net loss — and the gap grows with the percentage, which is why 50% up then 50% down loses a quarter.",
      },
      {
        move: "\"The original price is the new price minus the percentage.\"",
        why: "The percentage was taken of the ORIGINAL, so removing it from the NEW price removes the wrong amount. £96 after a 20% rise came from £80, and 96 ÷ 1.2 = 80; 96 − 19.2 = 76.80 is not an original, it is a number produced by taking 20% of the wrong base.",
      },
      {
        move: "\"The change is 12 out of 92, so it went up by about 13%.\"",
        why: "The change is measured against the amount before it happened, which was 80: 12/80 = 15%. Dividing by the new value understates every increase and overstates every decrease, and the error is largest exactly where percentages matter most — big changes.",
      },
    ],
    usedFor:
      "Interest and depreciation, every statistic in a news report, concentration in chemistry and efficiency in physics, and the ratio and proportion work that follows it.",
    review: "unreviewed",
    // NO FIGURE, and that is a decision rather than an omission. Every kind the
    // figure union declares draws ONE scale — an area model, a pie, an axis. The
    // belief this lesson exists to break is that there are TWO bases, and a
    // drawing of one whole cannot show a base changing. A picture here would be
    // decoration beside the one claim it cannot make.
  },

  negatives: {
    conceptId: "negatives",
    objective: "Read, compare and calculate with numbers below zero — and know which way the answer goes.",
    intuition:
      "An underground car park already uses this idea. You are parked on level −2 and you drive up four floors. You do not arrive at 5: you arrive at 3, because you started below street level and passing zero changes nothing about the counting. Every rule about negatives is that one picture — a number line where zero is not a wall you stop at, but a line you can walk straight past.",
    idea: [
      "A negative number is an amount below zero. −4 sits the same distance from zero as 4 does, on the other side, which is why the sign is the only thing separating them: the distance of −4 from zero is 4, exactly as it is for 4. The sign says direction, not size.",
      "Adding and subtracting are moves along the line. Adding a negative moves left: 6 + (−4) = 2. Subtracting a negative needs a second look, because it takes away a leftward move, which leaves you further right: 5 − (−3) = 5 + 3 = 8. You do not have to memorise that. 5 − (−3) asks \"what number added to −3 gives 5?\", and only 8 does.",
      "Multiplying is repeated addition, so signs follow the moves. (−3) × 4 is four jumps of three to the left: −12. (−3) × (−4) reverses direction twice — taking away four debts of 3 leaves you 12 better off — so the answer is positive. One negative gives a negative answer; two negatives give a positive one.",
      "Comparing catches people out because the line runs the other way from the numbers: −2 is greater than −5, even though 5 is greater than 2. Rightwards is larger. That single fact is also why an inequality flips sign the moment you multiply or divide by a negative.",
    ],
    traps: [
      {
        move: "Turning 5 − (−3) into 5 − 3 = 2.",
        why: "The minus in front acts on a value that is already negative; it does not cancel the subtraction. On the line, subtracting a leftward move of three has to take you further right, and 5 + 3 = 8 is the only value for which 8 + (−3) comes back to 5.",
      },
      {
        move: "Saying −8 is bigger than −3 because 8 is bigger than 3.",
        why: "Distance from zero is not size. −3 sits three steps to the RIGHT of −8, and rightwards is larger, so −3 > −8. Learners who reorder numbers this way later read inequalities backwards, which is why this one is worth fixing now.",
      },
      {
        move: "Working out (−2) × (−3) as −6.",
        why: "Both signs reverse the direction, so the result points back to the positive side. Test it against the rule you already trust: (−2) × 3 = −6, so (−2) × (−3) must be the opposite of that, which is 6.",
      },
    ],
    usedFor:
      "Coordinates, gradients and inequalities all stand on this: a point below the axis, a line falling to the right, or any inequality you multiply by −1.",
    review: "unreviewed",
    // THE PICTURE IS THE RULE. 5 − (−3) is the one move in this concept that a
    // learner reliably gets backwards, and it is backwards because they picture
    // it as "take away", which travels left. Drawn, the journey travels right
    // and the sentence in the plan describes what the picture already shows.
    figure: {
      spec: { kind: "number-line", min: -6, max: 10, from: 5, to: 8 },
      caption:
        "Start at 5. Taking away −3 is removing a leftward move, so the journey goes RIGHT to 8 — the arrow does not turn round because the sign does.",
    },
  },

  "order-ops": {
    conceptId: "order-ops",
    objective: "Evaluate any arithmetic expression the way the rest of the world does, and explain why that order is the one.",
    intuition:
      "3 + 4 × 2 is 11, not 14 — and the reason is not that 11 is the more pleasing answer. Multiplication is repeated addition, so 4 × 2 is a single quantity: eight. The expression reads \"three, plus the object eight\". It never says \"three plus four, and then double it\".",
    idea: [
      "Brackets are a request to act early. They do not change the rules; they say \"work this out first\": 3 × (4 + 2) = 18, where 3 × 4 + 2 = 14.",
      "Indices come next because a power is already a finished multiplication: 3² means 3 × 3. So 2 + 3² is 2 + 9 = 11, and someone who reads it left to right gets 25 from squaring (2 + 3).",
      "Multiplication and division have the SAME rank, as do addition and subtraction. Equal ranks are worked left to right: 12 ÷ 4 × 3 = 9, because 12 ÷ 4 = 3 and 3 × 3 = 9. Reading it right to left gives 1, which is a different sum.",
      "The order is a shared convention, not a law of mathematics — without it, one written expression would have several values and nobody could check anybody's work. It is also what makes formulae predictable later: in 3x² with x = 4, the power belongs to x, so the value is 3 × 16 = 48.",
    ],
    traps: [
      {
        move: "Working straight through from left to right.",
        why: "That gives 14 for 3 + 4 × 2. The 4 × 2 is one quantity — eight — and quantities are finished before they are joined to anything.",
      },
      {
        move: "Doing multiplication before division because M comes first in BIDMAS.",
        why: "They share a rank, so 12 ÷ 4 × 3 is 9. Taking the multiplication first makes 12 ÷ 12 = 1. The letters are a memory aid, not three separate ranks.",
      },
      {
        move: "Reading −3² as 9.",
        why: "The power binds to 3 alone and the minus is applied afterwards: −(3²) = −9. If the negative is meant to be squared, it has to be bracketed as (−3)², which is why that bracket gets written.",
      },
    ],
    usedFor:
      "Every formula you meet later — substituting into 3x² + 2, evaluating a physics equation, simplifying an expression — is this order applied to letters instead of numbers.",
    review: "unreviewed",
  },

  "algebra-expressions": {
    conceptId: "algebra-expressions",
    objective: "Write an expression for a situation, simplify it by collecting like terms, and evaluate it for a given value.",
    intuition:
      "A letter is a label on a box you have not opened. \"3x + 2\" says: three boxes of the same size, and two loose counters. You can merge boxes with boxes — 2x + 3x is five boxes — but a box cannot be added to a counter, which is exactly why 3x + 2y stays as it is.",
    idea: [
      "A term is built from a coefficient and a letter part: in 5x the 5 multiplies the x. 5x means x + x + x + x + x. It does not mean 5 followed by x, and it does not mean 5 + x.",
      "Like terms have exactly the same letter part. 3x + 2x = 5x, and 7x − 4x = 3x. 3x + 2x² does not simplify: x and x² are different sizes of thing, a box and a square of boxes, so their counts cannot be added.",
      "Multiplying is not adding. 3x × 2x = 6x², because the coefficients multiply (3 × 2) and the letter parts multiply as well (x × x = x²). The commonest error in this topic is doing the multiplying rule on an adding question.",
      "Substituting means replacing the letter with a number, and a negative value goes in BRACKETS so the sign travels with it: x = −2 in 3x + 2 gives 3(−2) + 2 = −6 + 2 = −4.",
      "Expanding reverses the brackets: 3(x + 4) = 3x + 12, because the whole bracket is one quantity being tripled, so every term inside is tripled. Missing the second term is what leaves 3x + 4.",
    ],
    traps: [
      {
        move: "3x + 2y = 5xy.",
        why: "Adding counts how many of one thing you have; x and y are different things, so their counts cannot merge. 5xy is a product — five times x times y — which is a different quantity altogether, and you can see it: with x = y = 2, the left side is 10 and 5xy is 20.",
      },
      {
        move: "3 + 2x = 5x.",
        why: "The 3 is a number and the 2x is a count of boxes; joining them invents a box that was never there. Substitute to check: with x = 3, 3 + 2x = 9 while 5x = 15.",
      },
      {
        move: "Reading 2x² as (2x)².",
        why: "The power belongs to x alone. With x = 3, 2x² = 2 × 9 = 18, while (2x)² = 36. Whenever the coefficient is meant to be squared too, the bracket has to be written.",
      },
    ],
    usedFor:
      "Solving equations, expanding and factorising, and every formula in science: once you can read 3x + 2 as a quantity, the rest of algebra is the same language.",
    review: "unreviewed",
    // THE AREA MODEL OF EXPANSION. "Every term inside is multiplied" is a rule a
    // learner can recite and still not apply; a rectangle whose corner cell is
    // 12 is the same statement as a count. The `x` band is one unit wide so the
    // 4-band is visibly four times it.
    figure: {
      spec: {
        kind: "rectangle",
        widthParts: [{ units: 1, label: "x" }, { units: 4, label: "4" }],
        heightParts: [{ units: 3, label: "3" }],
      },
      caption:
        "3(x + 4) as an area: three rows, each holding an x and a 4. The cells read 3x and 12 — the 12 is the term left out when someone writes 3x + 4.",
    },
  },

  coordinates: {
    conceptId: "coordinates",
    objective: "Plot and read points on a grid, and read an equation as the shape it draws.",
    intuition:
      "A map reference works like this: go along the corridor, then up the stairs. Coordinates always give the horizontal move first. (3, 2) and (2, 3) are two different places, which is why the order is not a detail you can shrug at.",
    idea: [
      "The axes cross at the origin (0, 0). x counts to the right, with negatives to the left; y counts upwards, with negatives downwards. The grid is four regions — the quadrants — and each is defined by the signs of its points.",
      "A point is written (x, y) — along, then up. So (3, −2) is three right and two down, which puts it in the bottom-right quadrant. (−3, 2) is a different point on the other side.",
      "An equation is a rule for which points belong. y = 2x + 1 says: pick an x, double it, add one, and that is the y. Choosing x = 0, 1, 2 gives (0, 1), (1, 3), (2, 5).",
      "Joining those points gives a straight line, and the straightness is information: a constant step in x producing a constant step in y is what \"linear\" means. A curve on a linear equation is evidence of an arithmetic slip in the table, not a discovery.",
      "Reading a graph and solving an equation are the same fact in two languages. Where two lines cross, that point's coordinates satisfy both equations at once — which is what solving a pair of equations simultaneously is.",
    ],
    traps: [
      {
        move: "Plotting (3, −2) as three up and two left.",
        why: "The pair is x then y, the same order as the alphabet. Swapping them puts the point in a different place entirely — it reflects the point in the line y = x — and every gradient and distance read from that point then comes out wrong.",
      },
      {
        move: "Reading a y-value off the horizontal axis.",
        why: "The horizontal axis is x. A point that sits ON the x-axis has y = 0, which is why its coordinates look like (4, 0) and why an intercept on that axis is where the graph crosses zero.",
      },
      {
        move: "Freehand-joining plotted points into a wobbly curve.",
        why: "Two points are enough to fix a straight line, so a curve on a linear equation means a mistake in the table. Checking one plotted point by substituting its x into the equation catches it before the line is drawn.",
      },
    ],
    usedFor:
      "Straight-line graphs, gradients, quadratics and every graph in science: this is where algebra becomes something you can see.",
    review: "unreviewed",
    // THE POINTS AND THE LINE THEY MAKE. A table of values plus a rule is how
    // the idea is taught; the picture is what makes "constant step in x, constant
    // step in y" visible, and the line is drawn from the same rule the plan
    // quotes (y = 2x + 1) rather than from the counts.
    figure: {
      spec: {
        kind: "axes",
        xMin: -1, xMax: 4, yMin: -1, yMax: 6,
        points: [{ at: [0, 1] }, { at: [1, 3] }, { at: [2, 5] }],
        lines: [{ from: [-1, -1], to: [2.5, 6] }],
      },
      caption:
        "y = 2x + 1 plotted: from (0, 1) each step of 1 across goes 2 up, so the points sit on one straight line. A wobble in the line would be an arithmetic slip in the table, not a discovery.",
    },
  },

  "algebra-expand": {
    conceptId: "algebra-expand",
    objective: "Multiply out a pair of brackets, say where each of the four terms came from, and factorise a simple quadratic back again.",
    intuition:
      "A garden is x + 3 metres long and x + 2 metres wide, with the x part cut off at a fixed place on each side. Its area is not one number you can look up — but the garden splits into four rectangular beds, and each bed has an area you can write down. Expanding brackets is that split written out, which is why nothing is ever dropped.",
    idea: [
      "One bracket is one quantity multiplied. 3(x + 4) says: the whole quantity x + 4 is tripled, so both parts are tripled — 3x + 12. The 4 is a length inside the bracket, not a separate add-on, which is why 3x + 4 is too small.",
      "Two brackets multiply every term of the first by every term of the second, because each side is a length and the area model needs a rectangle for each pair. (x + 3)(x + 2) gives four pieces: x², 2x, 3x and 6.",
      "The middle term is made of the two CROSS pieces. 2x and 3x are different rectangles, and they add to 5x — so x² + 5x + 6. The 5 is not 3 + 2 arrived at separately; it is what the two crossings come to, which is also why x² + 6 is a real answer to a different question.",
      "A sign belongs to the term it sits in front of, and it travels into every product that term takes part in. (x − 3)(x + 2) = x² + 2x − 3x − 6 = x² − x − 6: the −3 changes both of its products, which is what turns +2x into 2x − 3x = −x.",
      "Factorising reverses the multiplication, so it is a search with two clues. In x² + 5x + 6 the two numbers must multiply to 6 (the constant) and add to 5 (the middle), which only 2 and 3 do. The sign of the constant tells you whether the two numbers share a sign; the sign of the middle tells you which sign they share when they do.",
      "(x + 3)(x − 3) = x² − 9: the cross pieces are +3x and −3x, equal and opposite, so they cancel and no middle term survives. That is the difference of two squares, and it is a pattern you can recognise rather than a separate rule to memorise.",
    ],
    traps: [
      {
        move: "Writing (x + 3)(x + 2) = x² + 6.",
        why: "The two cross pieces have been dropped. With x = 10 the brackets give 13 × 12 = 156, while x² + 6 gives 106 — the missing 50 is 2x + 3x. Any expansion can be checked the same way, by substituting a value into the brackets and into the answer.",
      },
      {
        move: "Expanding 3(x + 4) as 3x + 4.",
        why: "Only the first term was multiplied. The bracket is one length tripled: with x = 2 the true value is 3 × 6 = 18, and 3x + 4 gives 10. One substitution at the end catches this every time.",
      },
      {
        move: "Writing (x − 3)(x + 2) = x² + 5x − 6.",
        why: "The −3 was multiplied by x but its sign was not carried into the second product: the pieces are −3 × 2 = −6 AND −3 × x = −3x. Adding the middle terms honestly gives 2x − 3x = −x, so the answer is x² − x − 6.",
      },
      {
        move: "Factorising x² + 5x + 6 as (x + 1)(x + 6).",
        why: "Those numbers multiply to 6 but add to 7, and the middle term says 5. Both clues have to hold at once; check by expanding the pair back and seeing whether you recover the expression you started with.",
      },
    ],
    usedFor:
      "Quadratics, completing the square, the quadratic formula and any area problem with an unknown side — this is the multiplication that all of them are built on.",
    review: "unreviewed",
    // THE FOUR BEDS OF THE GARDEN. "Every term meets every term" is a rule a
    // learner can recite and still leave a cross piece out; the grid makes the
    // two crossings two separate rectangles whose labels sum to the middle term.
    // The cell labels are COMPUTED (`areaTerm`), so a grid can never print a
    // product that is not the product of its own bands.
    figure: {
      spec: {
        kind: "rectangle",
        heightParts: [{ units: 1, label: "x" }, { units: 3, label: "3" }],
        widthParts: [{ units: 1, label: "x" }, { units: 2, label: "2" }],
      },
      caption:
        "(x + 3)(x + 2) drawn as four beds: x², 2x, 3x and 6. The middle term of the answer is the two cross beds added together, and leaving one of them out is exactly how x² + 6 appears instead.",
    },
  },

  "straight-lines": {
    conceptId: "straight-lines",
    objective: "Find the gradient and intercept of a line from its equation or from two points, and say what each number does to the picture.",
    intuition:
      "A taxi fare is a fixed charge to get in plus a price per mile: 3 + 2d. Change d and the fare changes at a steady rate; that rate is the whole line. Every straight line is a starting value plus a rate — and a graph is the fare chart you could read without doing the arithmetic again.",
    idea: [
      "y = mx + c carries two numbers. m is the gradient — how much y changes for each 1 across — and c is the value of y when x is 0, which is where the line crosses the vertical axis.",
      "The gradient is rise ÷ run, and rise is vertical while run is horizontal: a line that climbs 3 for every 2 across has m = 3/2. Between two points it is (y₂ − y₁) ÷ (x₂ − x₁) — the SAME point first on top and bottom, because swapping one and not the other flips the sign.",
      "Direction matters as much as steepness. A line falling from left to right has a negative gradient; a horizontal line has m = 0; a vertical line has no gradient at all, because the run is zero and division by zero is not a number.",
      "c is the y-intercept, at the point (0, c) — not the x-intercept. Where the line crosses the horizontal axis is where y = 0, so it is found by solving mx + c = 0. Those two intercepts are usually different numbers, and reading one off as the other is a reliable way to lose marks.",
      "Parallel lines share the same m and differ only in c. Perpendicular lines have gradients that multiply to −1, so a line perpendicular to y = 2x has gradient −1/2: it falls while the first climbs, and by the reciprocal amount.",
      "A gradient is a rate, which is why this idea leaves maths: speed on a distance–time graph, cost per item, degrees per minute. Given a table, the gradient is the change in the second column per ONE unit of the first — divide the difference by however many units the step covered.",
    ],
    traps: [
      {
        move: "Computing run ÷ rise instead of rise ÷ run.",
        why: "That inverts every answer, so a steep line reads as shallow. Check with one step: going 1 across should move the line up by m, and if the picture moves up 3 while your gradient says 2, the fraction is upside down.",
      },
      {
        move: "Working out (y₂ − y₁) ÷ (x₁ − x₂).",
        why: "One difference has been reversed and the other not, which flips the sign of the gradient — so a climbing line comes out falling. Pick which point is 'first' and use it first in both differences.",
      },
      {
        move: "Reading c as the x-intercept — saying y = 2x + 4 crosses the horizontal axis at 4.",
        why: "c is the value at x = 0, so 4 is where it crosses the VERTICAL axis. The horizontal crossing solves 2x + 4 = 0, which is x = −2. Substituting 0 for x, and separately 0 for y, tells you which is which without memorising anything.",
      },
    ],
    usedFor:
      "Distance–time and velocity–time graphs, every rate in science, simultaneous equations solved by graphs, and finding the equation of a line through two given points.",
    review: "unreviewed",
    // THE TRIANGLE IS THE DEFINITION. `m = rise ÷ run` is a sentence a learner can
    // recite while reading a steep line as shallow; drawn on the line, the two
    // legs are lengths they can count, and the division is the thing they do with
    // them. The quotient is deliberately NOT printed — the picture raises the
    // question the lesson answers, and the intercept is marked with the SYMBOL c
    // rather than its value for the same reason.
    figure: {
      spec: {
        kind: "axes",
        xMin: -1, xMax: 4, yMin: -3, yMax: 6,
        lines: [{ from: [-1, -3], to: [3, 5] }],
        points: [{ at: [0, -1], label: "c" }],
        gradient: { from: [1, 1], to: [3, 5] },
      },
      caption:
        "y = 2x − 1 with the rise/run triangle drawn on it: 2 across and 4 up, so the gradient is 4 ÷ 2 = 2. The line meets the vertical axis at c, one step below zero — that is the number after the x, not the place it crosses the other axis.",
    },
  },

  "completing-square": {
    conceptId: "completing-square",
    objective: "Rewrite x² + bx + c in the form (x + p)² + q, and read the turning point straight off the result.",
    intuition:
      "Lay a patio x metres by x metres, then add two strips along two sides to make it bigger. The shape you now have is not a square: there is a notch where the two strips fail to meet. x² + 6x is exactly that shape — a square plus two 3-by-x strips — and the only thing missing to make it a square again is the little corner where the strips would cross.",
    idea: [
      "x² + 6x is not a perfect square, and the reason is visible: a square of side x has area x², and adding 6x is adding two equal strips, 3x each. Splitting the 6 in half is where the 3 comes from, which is why the method starts by halving the coefficient of x.",
      "Completing the square means adding the missing corner. The strips are 3 wide, so the corner is 3 × 3 = 9. Adding it gives x² + 6x + 9, which is a square of side (x + 3), because (x + 3)² = x² + 6x + 9.",
      "If the expression does not already contain that 9, you add it and take it straight back out, so the value never changes: x² + 6x + 5 = (x² + 6x + 9) − 9 + 5 = (x + 3)² − 4. The bracket is the completed square; the number after it is whatever is left over.",
      "The rule, once and for all: halve the coefficient of x, square it, write (x + half)², then subtract the square you added. For x² − 6x the half is −3, so the form is (x − 3)² − 9 plus whatever constant the expression already had. The sign of the half follows the sign of the x term — it is never chosen for tidiness.",
      "WHY anyone bothers: a square cannot be negative. (x + 3)² is 0 at least, so (x + 3)² − 4 is −4 at least, and it reaches −4 exactly when x = −3. That is the turning point read off with no table of values and no calculus: the minimum is −4, at x = −3. With the sign outside different — a −(x + 3)² − 4 — it would be a maximum instead.",
      "It also solves equations that factorising cannot reach. (x + 3)² − 4 = 0 gives (x + 3)² = 4, and a square equal to 4 has TWO roots, x + 3 = 2 or x + 3 = −2, so x = −1 or x = −5. Taking only the positive branch is the same error as forgetting a ± in the quadratic formula, because it is literally the same step.",
    ],
    traps: [
      {
        move: "Writing (x + 3)² = x² + 9.",
        why: "The square of a bracket is not the sum of the squares of its parts: (x + 3)² = (x + 3)(x + 3) = x² + 3x + 3x + 9. The two 3x strips are the whole point of the shape, so dropping them removes exactly the term the method is trying to explain.",
      },
      {
        move: "Turning x² + 6x + 5 into (x + 3)² − 9 and stopping.",
        why: "The 9 has been taken away but the original +5 has gone missing, so the expression is no longer equal to the one you started with. Substitute x = 0 to see it: the original is 5, while (x + 3)² − 9 is 0. The form must be (x + 3)² − 4, and the check is that both sides agree at any value of x.",
      },
      {
        move: "Solving (x + 3)² = 4 by taking the positive root only.",
        why: "Both 2 and −2 square to 4, so the equation has two solutions, x = −1 and x = −5. A sketch of the parabola shows two crossings of the axis, which is the independent check that a root has not been lost.",
      },
      {
        move: "Completing the square on x² − 6x + 5 as (x + 3)² − 4.",
        why: "The half of −6 is −3, not +3, so the bracket is (x − 3)². Expanding your answer is the test: (x + 3)² − 4 gives x² + 6x + 5 — the wrong sign on the middle term, which the expansion makes obvious in one line.",
      },
    ],
    usedFor:
      "Turning points and curve sketching, maximum and minimum problems, solving quadratics that do not factorise, and the derivation of the quadratic formula itself.",
    review: "unreviewed",
    // THE MISSING CORNER, DRAWN. x² + 6x is a square with two strips and a notch;
    // the 9 is the piece that closes it, and it has to READ as the added piece
    // rather than as one of four equal cells. The grid is the same verified area
    // model as the expansion lesson — (x + 3)² is four cells whose areas are the
    // terms — with the corner marked.
    figure: {
      spec: {
        kind: "rectangle",
        heightParts: [{ units: 1, label: "x" }, { units: 3, label: "3" }],
        widthParts: [{ units: 1, label: "x" }, { units: 3, label: "3" }],
        emphasis: ["9"],
      },
      caption:
        "x² + 6x drawn as a shape: the x-by-x square plus two 3-by-x strips (3x each), with a notch where they fail to meet. The marked 9 is the corner that closes it, so x² + 6x + 9 = (x + 3)².",
    },
  },

  quadratics: {
    conceptId: "quadratics",
    objective: "Solve a quadratic equation by factorising, and know from the equation itself when to reach for the formula instead.",
    intuition:
      "A ball thrown upwards is at 6 metres on the way up and again on the way down. \"When is it 6 metres high?\" has two answers, and that is not a quirk of the ball — it is what a quadratic equation is: the same value reached twice, before and after the turning point. A quadratic can have two solutions, one, or none, and the equation itself tells you which.",
    idea: [
      "Put it in standard form first: everything on one side, zero on the other. x² − 5x = −6 becomes x² − 5x + 6 = 0. Factorising only works against zero, because the whole method rests on a product being zero — so this rearrangement is the first step, not tidying up.",
      "Factorising is a search with two clues: two numbers that multiply to the constant (+6) and add to the coefficient of x (−5). Here −2 and −3, so (x − 2)(x − 3) = 0. Check by expanding — that is the one habit that catches a wrong pair before it becomes a wrong answer.",
      "The zero product rule finishes it: if two things multiply to zero, at least one of them is zero. So x − 2 = 0 or x − 3 = 0, giving x = 2 or x = 3. Both are solutions; the equation is satisfied by either, not by both at once.",
      "When no pair of whole numbers fits, the formula does the same job without guessing: x = (−b ± √(b² − 4ac)) ÷ 2a, with a, b and c read off standard form INCLUDING their signs. It is not a different method — it is the same equation solved by completing the square once and for all, which is why it never fails.",
      "The discriminant b² − 4ac decides how many answers to expect before you compute anything: positive gives two real roots, zero gives one repeated root (the curve just touches the axis), negative gives none (the curve never reaches it). Negative is an answer about the curve, not a mistake in the arithmetic.",
      "The two roots are where the parabola crosses the x-axis, and the turning point sits exactly halfway between them. So a sketch is a check on the algebra: if your answers are 2 and 3, the curve must cross at 2 and 3 and turn at 2.5 — an answer of 2 and 8 for a curve whose sketch crosses close together means the factorising went wrong.",
    ],
    traps: [
      {
        move: "Solving x² = 3x by dividing both sides by x.",
        why: "Dividing by x throws away the case x = 0, and x = 0 really is a solution. Move everything to one side and factorise instead: x² − 3x = 0, so x(x − 3) = 0, giving x = 0 or x = 3. Never divide by a variable — factorise it out.",
      },
      {
        move: "Reading (x − 2)(x − 3) = 0 as x = −2 or x = −3.",
        why: "Each bracket is set to zero and solved, which reverses its sign: x − 2 = 0 gives x = +2. Substituting back settles it in seconds — putting x = 2 into the original makes the first bracket zero, which is exactly what the equation claims.",
      },
      {
        move: "Using the formula with c taken as positive from 2x² + 3x − 5.",
        why: "The signs belong to the terms: a = 2, b = 3, c = −5. Dropping the minus changes the discriminant from 9 + 40 = 49 to 9 − 40 = −31 and turns two real roots into none — a wrong answer that looks like a legitimate \"no solutions\" conclusion.",
      },
      {
        move: "Reporting a negative discriminant as an error.",
        why: "It is information: the parabola sits entirely above or below the axis, so there is no real x making the expression zero. Say so, and support it with the sign of a — that is a complete answer, not a failed one.",
      },
    ],
    usedFor:
      "Curve sketching, where a line meets a curve, maximum-area and optimisation problems, and any \"when does it reach\" question in physics — the two roots are the two times.",
    review: "unreviewed",
    // THE CROSSINGS ARE THE ROOTS, DRAWN. The plan's last idea says a sketch is a
    // check on the algebra; this is that sketch, computed from the same
    // coefficients the plan solves (x² − 5x + 6), with the axis of symmetry
    // dashed in. A pair of answers that does not sit either side of that line
    // cannot be the roots of this curve.
    figure: {
      spec: {
        kind: "axes",
        xMin: -1, xMax: 6, yMin: -2, yMax: 8,
        curve: { a: 1, b: -5, c: 6 },
        points: [{ at: [2, 0] }, { at: [3, 0] }],
        lines: [{ from: [2.5, -2], to: [2.5, 8], dashed: true }],
      },
      caption:
        "y = x² − 5x + 6 drawn from its own coefficients: it crosses the horizontal axis at 2 and 3, the two roots the factorising gives, and it turns on the dashed line exactly halfway between them. A pair of answers with no such crossing is a pair the algebra got wrong.",
    },
  },

  surds: {
    conceptId: "surds",
    objective: "Simplify, combine and rationalise surds, and say why an exact root can be a better answer than a decimal.",
    intuition:
      "Draw a square one metre by one metre and measure its diagonal. The length is real — you can cut a piece of string for it — but no fraction names it exactly. That length is √2, and a surd is how mathematics writes a number it can point at precisely but cannot write as a decimal that stops.",
    idea: [
      "A surd is a root of a number that is not a perfect square, kept in root form. √2 is about 1.41421356, and the digits never end and never repeat, so any decimal you write is an approximation — while √2 is the number itself. That is the whole reason surds are kept rather than evaluated.",
      "Simplify by pulling out the largest square factor. √50 = √(25 × 2) = √25 × √2 = 5√2, using √(ab) = √a × √b — a rule about MULTIPLICATION only, which is why it cannot be applied to a sum. The largest square matters: pulling out 1 leaves the surd unchanged and looks like working without being any.",
      "Surds add like algebraic terms, because that is exactly what they are. 3√2 + 5√2 = 8√2, the same way 3x + 5x = 8x. √2 + √3 does not combine, the same way x + y does not: the roots are different sizes of thing.",
      "Rationalising removes a root from a denominator by multiplying top and bottom by something that squares it away. 1/√2 becomes √2/2, because √2 × √2 = 2 — and multiplying both parts by the same thing does not change the value, only its form. For 1/(1 + √2) the multiplier is the conjugate 1 − √2, chosen so the denominator becomes 1 − 2 by the difference of two squares.",
      "The check that catches the commonest error in the topic: √(a + b) is NOT √a + √b. With 9 and 16, √25 = 5 while √9 + √16 = 7. Roots distribute over multiplication and division only, and testing one pair of numbers is enough to see it.",
      "Exactness has a practical pay-off. (5√2)² is 25 × 2 = 50 exactly, while squaring 7.0710678 gives something that only rounds to 50. In a multi-step problem the rounding error grows at every step, which is why the exact form is kept until the final line.",
    ],
    traps: [
      {
        move: "Writing √(a + b) = √a + √b.",
        why: "Test it: √(9 + 16) = √25 = 5, but √9 + √16 = 3 + 4 = 7. The rule that lets you split a root is about a PRODUCT — √(ab) = √a × √b — and using it on a sum is the single most common surd error.",
      },
      {
        move: "Simplifying √50 as 25√2.",
        why: "25 is the square, not the root: √50 = √25 × √2 = 5√2. The answer must be checked by squaring it back — (5√2)² = 50, while (25√2)² = 1250, which is not the number you started with.",
      },
      {
        move: "Rationalising by multiplying only the numerator by √2.",
        why: "That changes the value: 1/√2 does not equal √2/√2. Top AND bottom must be multiplied by the same thing, so the fraction is unchanged in value — 1/√2 becomes √2/2, and the check is that both still equal about 0.707.",
      },
      {
        move: "Adding √2 + √3 as √5.",
        why: "The roots are different sizes, so they do not combine — the same reason 3x + 5y is not 8xy. Numerically √2 + √3 ≈ 3.146 while √5 ≈ 2.236, and one decimal place of checking shows the sum is not the root of the sum.",
      },
    ],
    usedFor:
      "Pythagoras and trig questions that need exact lengths, the quadratic formula (whose answers are often surds), circle geometry, and any calculation where rounding early would compound the error.",
    review: "unreviewed",
    // THE SIMPLIFICATION IS A TILING. "Pull out the largest square factor" is a
    // procedure; a square of area 50 that is exactly 25 squares of area 2, five
    // along each edge, is WHY the edge is 5√2 — and why the answer is exact
    // rather than a decimal that nearly works. The grid comes from the two
    // numbers (50, 25), so it cannot label an edge the tiling does not have.
    figure: {
      spec: { kind: "surd-square", total: 50, parts: 25 },
      caption:
        "A square of area 50 cut into 25 equal squares: each small square has area 2, so its side is √2, and the big square is five of them along each edge. That is why √50 = 5√2 — the root is the edge of the square, drawn.",
    },
  },

  "indices-intro": {
    conceptId: "indices-intro",
    objective: "Use the index laws to multiply, divide and simplify powers — and say why each law is true.",
    intuition:
      "a³ is shorthand, not a new operation: it is a × a × a. Almost every index law is just counting how many copies of a you have written down, which is why the laws are simple — multiplying two powers does not need a rule so much as a tally.",
    idea: [
      "aᵐ means m copies of a multiplied together, so a⁵ = a × a × a × a × a. The base is the a; the index is the 5. The index counts copies, and it is not a value — a⁵ is not 5a.",
      "Multiplying adds the counts: a² × a³ = (a × a)(a × a × a) = a⁵. Dividing subtracts them: a⁵ ÷ a² cancels two copies and leaves a³. Neither law needs memorising if you are willing to write the copies out once.",
      "a⁰ = 1 follows from the subtraction law: aⁿ ÷ aⁿ = a⁰, and a quantity divided by itself is 1. It is not a special case bolted on — it is what the pattern forces.",
      "Negative indices carry the same pattern downwards: a² ÷ a⁴ = a⁻², and that division is 1/a². So a⁻² means the reciprocal of a².",
      "Fractional indices are roots, and the reason is the multiplication law turned around: a^(1/2) × a^(1/2) = a¹, so a^(1/2) must be the number that squares to a — the square root.",
      "The laws hold only for the SAME base. 2³ × 2² = 2⁵, but 2³ × 3² stays as it is, because the copies are of different things.",
    ],
    traps: [
      {
        move: "a² × a³ = a⁶.",
        why: "That multiplies the indices, but multiplying powers ADDS how many copies you have. The multiplication sign has already done the combining; squaring the index would count every copy twice.",
      },
      {
        move: "a² + a³ = a⁵.",
        why: "The laws are for multiplying and dividing only. Adding powers means adding their VALUES: with a = 2, that is 4 + 8 = 12, not 32.",
      },
      {
        move: "Reading 2a³ as (2a)³.",
        why: "The power binds to the a alone, and the 2 is not inside it. With a = 2, 2a³ is 2 × 8 = 16, while (2a)³ is 2 × 2 × 2 × 8 = 64 — so a bracket has to be written whenever the coefficient was meant to be cubed too.",
      },
    ],
    usedFor:
      "Standard form, growth and decay, surds and quadratic formulae all rest on these laws — and they are the difference between manipulating algebra and guessing at it.",
    review: "unreviewed",
  },

  "linear-equations": {
    conceptId: "linear-equations",
    objective: "Solve one- and two-step equations, including with unknowns on both sides, and check the answer.",
    intuition:
      "The equals sign is a balance beam. 3x + 5 = 20 says: three identical bags plus five weights balance twenty weights. Whatever you take off one pan you must take off the other, or the beam tips and the two sides are no longer equal — which is the whole reason the rules of solving work.",
    idea: [
      "An equation is a claim: these two expressions are equal. Solving means finding the value of x that makes the claim true. A value that breaks the balance is not a solution, however tidy the working looked.",
      "Undo the operations in the reverse order to the one that built the expression. x was multiplied by 3 and then had 5 added; undo the addition first. Subtract 5 from both sides: 3x = 15. Then divide both sides by 3: x = 5.",
      "Both sides, always. Subtracting 5 from the left only breaks the balance, and the value you end up with will not satisfy the original equation — which is what the check at the end is for.",
      "Unknowns on both sides reduce to the same discipline: 5x = 2x + 9. Subtract 2x from both sides — that is a move performed on the whole of each side — leaving 3x = 9, so x = 3.",
      "Brackets can be expanded (3(x + 2) = 15 → 3x + 6 = 15 → x = 3) or divided away first (x + 2 = 5 → x = 3). Both routes are correct; picking the shorter one is a judgement, not a rule.",
      "Finish by substituting your answer back into the ORIGINAL equation: with x = 5, the left side is 3(5) + 5 = 20, which is what the right side says. The check takes five seconds and it is the one step that catches the sign slip the algebra hid — an answer that came from broken working still has to survive being put back.",
    ],
    traps: [
      {
        move: "Subtracting 5 from only the left-hand side.",
        why: "That tips the balance, so the two sides stop being equal and any x you read off afterwards is answering a different question. Every operation is applied to a whole side — which is also why dividing \"the 3x by 3\" and leaving the +5 alone is the same mistake in a different disguise.",
      },
      {
        move: "Moving 2x across the equals sign to get 7x = 9 on 5x = 2x + 9.",
        why: "Changing sides is not an operation; subtracting is. Subtract 2x from both sides and 5x − 2x = 9 gives 3x = 9. \"Moves across and changes sign\" happens to give the same result for added terms, which is why it survives — but it stops being true for multiplication, and it hides what is actually being done.",
      },
      {
        move: "Reporting x = 3 from 3(x + 2) = 15 without expanding correctly.",
        why: "The 3 multiplies both terms inside the bracket, so the left side is 3x + 6, not 3x + 2. Missing it gives 3x + 2 = 15, x = 13/3 — an answer that a single check by substitution would have refused.",
      },
    ],
    usedFor:
      "Formulae, simultaneous equations, rearranging, and every \"find the value of\" question in maths and science; also the discipline of checking an answer by substituting it back.",
    review: "unreviewed",
    // THE BALANCE, AS COUNTS. 3x + 5 = 20 drawn as three bags and five weights
    // against twenty weights: the picture supplies the reason the operation is
    // applied to both sides, which the prose can only assert. The units are
    // drawn as single circles so the five can be taken off by counting.
    figure: {
      spec: { kind: "balance", left: { bags: 3, units: 5 }, right: { bags: 0, units: 20 } },
      caption:
        "3x + 5 = 20 as a balance: three bags and five weights against twenty weights. Take the same five off both pans, and the three bags are left holding fifteen — so one bag is 5.",
    },
  },
};

/** The plan for a concept, or null when nobody has written one. Null is a real
 *  answer, not an error: the page falls back to the genome's prose, so a concept
 *  without a plan renders what it always did rather than an empty shell. */
export function planFor(conceptId: string): LessonPlan | null {
  return LESSON_PLANS[conceptId] ?? null;
}

/** Words of authored teaching in a plan, for the coverage report and the
 *  assertion that a plan is longer than the paragraph it replaces. Counts the
 *  objective, intuition, idea paragraphs and trap explanations — the teaching —
 *  and not the internal ids. */
export function planWordCount(plan: LessonPlan): number {
  const text = [
    plan.objective,
    plan.intuition,
    ...plan.idea,
    ...plan.traps.flatMap((tr) => [tr.move, tr.why]),
    plan.usedFor,
  ].join(" ");
  return text.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
}

/** The FIRST MOVE of a marking explanation, and the rest of the working.
 *
 *  This is what makes the faded "we do" stage possible without authoring a
 *  second item: the bank's explanation already opens with the first thing to do
 *  ("Multiply the numerators: 3 × 2 = 6, then the denominators. The answer is
 *  6/15."), so the opening sentence is the part the learner is shown and the
 *  remainder is the part they have to reach themselves.
 *
 *  THE TWO GUARDS ARE THE WHOLE POINT, and both are measured in `npm run
 *  verify`:
 *   - a full stop only ends a sentence when WHITESPACE follows it, so a decimal
 *     ("13 ÷ 5 = 2.6. The answer is 2.6.") is not cut at "2.";
 *   - the next character must be a capital letter or an opening bracket, so an
 *     abbreviation ("e.g.", "i.e.") does not end the move.
 *  A one-sentence explanation has no rest: the learner then sees the whole
 *  method on the first press, which is still a fade relative to the worked
 *  example above it, because they had to start it.
 */
export function firstMoveOf(explanation: string): { first: string; rest: string } {
  const m = explanation.match(/^(.+?[.!?])\s+([A-Z(].*)$/s);
  if (m) return { first: m[1], rest: m[2] };
  return { first: explanation, rest: "" };
}

/** Which concepts have a plan. Reported, never asserted to be 135: a coverage
 *  number that lies is worse than a small honest one. */
export function plannedConceptIds(): string[] {
  return Object.keys(LESSON_PLANS);
}

/** Concepts a plan names that the genome does not hold. Must be empty — a plan
 *  filed under a typo'd id would render for nobody, silently. Exported so the
 *  suite can assert it rather than trusting the table above. */
export function orphanPlans(): string[] {
  const ids = new Set(CONCEPTS.map((c) => c.id));
  return plannedConceptIds().filter((id) => !ids.has(id));
}
