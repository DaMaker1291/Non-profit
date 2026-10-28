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
}

/**
 * THE AUTHORED PLANS.
 *
 * Deliberately a small set, and deliberately the START of the GCSE pilot
 * cluster rather than its end: these are the stage 0–1 concepts (negatives,
 * order of operations, expressions, coordinates, indices, equations) that every
 * later concept in the pathway stands on, and they are the concepts whose
 * one-paragraph lessons were thinnest. The rest of the pilot's 11 concepts, and
 * the other 124, still render the prose.
 */
export const LESSON_PLANS: Readonly<Record<string, LessonPlan>> = {
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
