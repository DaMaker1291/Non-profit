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
 * THE AUTHORED REPAIRS — one per misconception on the six concepts that carry a
 * lesson plan, plus the two slips whose items the bank itself discriminates most
 * often. A misconception with no entry answers null and the page falls back to
 * the coaching sentence it always showed, so nothing renders empty.
 */
export const REPAIRS: Readonly<Record<string, RepairPlan>> = {
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
