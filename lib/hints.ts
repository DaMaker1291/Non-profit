// ─────────────────────────────────────────────────────────────────────────────
// The "I'm stuck" ladder. A student never gets the answer for free — they
// choose how much scaffolding they want, and each request is recorded.
//
// Hints are returned as i18n keys + optional curriculum text. The generic
// nudge/strategy lines are fully translated; anything drawn from the question
// itself (the explanation, or a repair's own step) stays curriculum content,
// like the questions are.
//
// ── WHAT WAS WRONG WITH THIS FILE, AND WHY IT IS NOT JUST COPY ──────────────
//
// The ladder was rung-shaped but not learner-shaped. Rungs 1 and 2 returned a
// fixed sentence for all 135 concepts, so a learner stuck on a negative-number
// item and a learner stuck on a poem read the same two lines; and rung 3 cut the
// explanation at its first full stop, `explanation.split(".")[0]`, which reports
// `13 ÷ 5 = 2` for a question whose answer is `2.6`. Both were live: the same
// split had already been fixed for the lesson's fade (lib/lesson-plans.ts
// `firstMoveOf`, whose guards are measured on every concept's explanations), and
// this file was still doing it by hand.
//
// ── THE TWO THINGS THAT ARE NOW DIFFERENT ───────────────────────────────────
//
// 1. RUNGS 3 AND 4 ASK THE SAME MODULE THE LESSON DOES where the first move
//    comes from, so the two surfaces cannot disagree about where a sentence
//    ends, and a decimal is not mistaken for a full stop.
//
// 2. A LEARNER WITH A CURRENT SLIP GETS HELP WITH THAT SLIP. `currentSlip`
//    (lib/learner-model.ts) is the product's one rule for "this belief is still
//    live" — three clean answers retire it — and `lib/repair.ts` already holds
//    authored content per slip: what the move reveals, the contrast that decides
//    the case, and the corrected step. A hint on a concept where that rule says
//    a slip is current now says the slip's own sentence instead of a nudge
//    written for everyone. That is the difference between "help" and "help with
//    what went wrong" — and it is the rung the strategy note calls *the hint
//    should target the actual difficulty* (Orient → Select → Scaffold → Explain).
//
// WHAT IT STILL CANNOT DO, said here rather than discovered later: without a
// slip, rungs 1 and 2 are still the translated generic lines. Making those
// question-specific needs authored per-concept hint text, and there are 135
// concepts; writing 135 × 2 sentences of scaffolding is a content job this file
// must not fake by generating prose. The slip branch is where learner state
// genuinely changes the answer, and that is the branch that exists.
// ─────────────────────────────────────────────────────────────────────────────
import { firstMoveOf } from "./lesson-plans";
import { contrastFor, repairFor } from "./repair";

export interface HintLevel {
  level: 1 | 2 | 3 | 4;
  /** i18n key of the button label. */
  labelKey: string;
  /** i18n key of the aria description. */
  descKey: string;
}

export const HINT_LEVELS: HintLevel[] = [
  { level: 1, labelKey: "hint.tiny", descKey: "hint.tinyDesc" },
  { level: 2, labelKey: "hint.strong", descKey: "hint.strongDesc" },
  { level: 3, labelKey: "hint.firstStep", descKey: "hint.firstStepDesc" },
  { level: 4, labelKey: "hint.walkthrough", descKey: "hint.walkthroughDesc" },
];

export interface Hint {
  /** i18n key of the generic ladder text, if this level has one. */
  key?: string;
  /** Curriculum text drawn from the question's own explanation, or from the
   *  repair for the learner's current slip (English). */
  text?: string;
}

/** WHAT THE PRODUCT KNOWS ABOUT WHERE THIS LEARNER IS. Both fields are optional
 *  so the published static twin, which holds no repair catalogue, keeps calling
 *  this two-argument and gets the general ladder — the same shape it has always
 *  rendered, from the same compiled module. */
export interface HintContext {
  /** The concept the question belongs to. */
  conceptId?: string;
  /** The slip still current on it (`currentSlip(state.progress[conceptId])`),
   *  or null. A hint for a slip nobody has authored a repair for falls back to
   *  the general ladder rather than inventing a sentence. */
  slip?: string | null;
}

/** Build the hint for a question at a given ladder level from the question's
 *  own explanation, the learner's current slip, and misconception tags.
 *  Deterministic, no external calls: the ladder must work offline. */
export function buildHint(
  q: { prompt: string; explanation: string },
  level: number,
  ctx: HintContext = {},
): Hint {
  if (level <= 1) {
    // Tiny hint: point at the goal, never the method. Unchanged — this is the
    // rung a learner takes when they do not yet know what is stopping them, and
    // naming a slip here would hand over a diagnosis they have not asked for.
    return { key: "hint.body.tiny" };
  }
  // The repair for the CURRENT slip, when one is live and authored, AND the pair
  // inside it that describes the shape of THIS item. A slip with two moves has
  // no pair for a third shape (`-9 + 6` is neither `5 − (−3)` nor `(−2) × (−4)`),
  // and `contrastFor` answers null there — so the ladder says something general
  // instead of giving an instruction about a move the item does not contain.
  const plan = ctx.slip && ctx.conceptId ? repairFor(ctx.conceptId, ctx.slip) : null;
  const pair = plan ? contrastFor(plan, q.prompt) : null;
  if (level <= 2) {
    if (plan && pair) {
      // Select: what the move reveals, so the learner knows which step to watch
      // before they start — not the corrected step yet.
      return { key: "hint.body.yourSlip", text: plan.reveals };
    }
    return { key: "hint.body.strong" };
  }
  if (level <= 3) {
    if (pair) {
      // Scaffold: the corrected step FOR THE MOVE THIS ITEM IS ABOUT.
      return { key: "hint.body.yourSlip", text: pair.move };
    }
    // First step: the opening move, spelled out. Split by the lesson's own
    // measured rule, never by `split(".")` — that cut `13 ÷ 5 = 2.6.` in half
    // and reported "13 ÷ 5 = 2" as the first step.
    const { first } = firstMoveOf(q.explanation);
    return { key: "hint.body.strong", text: first || undefined };
  }
  // Level 4: full walkthrough = the explanation itself (curriculum content).
  return { text: q.explanation };
}
