// ─────────────────────────────────────────────────────────────────────────────
// GENUINE TRANSFER (audit P0-D).
//
// Difficulty escalation is not transfer. A learner who solves 3x + 2 = 11 has
// proven nothing about recognising the same idea in a gym's monthly bill.
//
// ONE OWNER. This file decides what a second surface IS, whether a concept can
// offer one, and which draw to serve — all three through `serveTransfer` below.
// Nothing else sweeps draws or names a surface: the route calls `serveTransfer`,
// the decision engine and the exercise page ask `canTransfer`, and the page
// renders only what the serve told it. (A second, unused set of surface
// wrappers lived in lib/qterms.ts; it was deleted rather than left to drift.)
//
// TWO SURFACES, both built from content the bank really generates:
//
//   story   — the same one-unknown equation retold as a real-world situation:
//             a joining fee plus the same amount every month, with the total
//             paid given after n months. The unknown keeps its value; the
//             framing changes completely.
//   inverse — THE RULE, generalised. Four REAL questions of this concept, drawn
//             at the concept's own band, with the learner asked which of them
//             produces a stated result. The target question is one of the four,
//             so exactly one option is correct by construction, every option is
//             content the bank already serves, and the answer index stays
//             server-side. Nothing is authored and nothing is truncated.
//
// A concept can be re-framed when the bank can serve that inverse: a question
// whose ANSWER is a value rather than prose, readable as one line, plus three
// other real questions at the same band whose OWN answers are different values.
// Both exclusions are documented on `answerValueKey` and `readableOption`. Where
// they bite, `canTransfer` says so and the stage stays DEEPER WORK: coverage is
// never bought by loosening the rule.
// ─────────────────────────────────────────────────────────────────────────────

import { fill, translator } from "./i18n";
import { generateQuestion, generateQuestionAt } from "./questions";
import type { Question } from "./types";

export type Surface = "direct" | "story" | "inverse";

/**
 * How many draws a transfer serve may look at before it settles for `direct`.
 *
 * A transfer request asks for the SAME idea on a DIFFERENT surface, and the
 * inverse needs three other questions at this band whose answers differ from
 * the target's — so a concept with a narrow range can take a few draws to find
 * them. Bounded so a concept with no second surface costs a handful of draws,
 * not a loop, and exported so the behaviour can be asserted.
 *
 * RAISED FROM 6 TO 12 BY MEASUREMENT, when the per-subject depth layers landed
 * (lib/questions-{computing,chemistry,physics,biology}.ts). Those layers added
 * TABLE items — a results table, a set of recorded forces, a Punnett square —
 * and `readableOption` above excludes any prompt carrying a newline from an
 * option list, which is right: four three-line tables as choices is a wall of
 * text, not a question. The effect was that a share of the draws at each band
 * can no longer BECOME an option, and at 6 attempts the serve ran out of draws
 * before it found its three - the suite measured 99 inverse items where it had
 * insisted on more than 100, i.e. transfer coverage really did shrink. The
 * answer is to look further, not to loosen the rule: the exclusion is what keeps
 * "exactly one option is correct" true, and a deeper bank legitimately needs a
 * few more draws to put the same idea on a second surface.
 */
export const TRANSFER_SURFACE_ATTEMPTS = 12;

/** Draws the inverse may look at while collecting its three distractors. */
export const INVERSE_DISTRACTOR_ATTEMPTS = 24;

/** Linear-equation pattern: [coef]x ± k = n, optionally inside $...$. */
const LINEAR = /\$?\s*(-?\d*\.?\d*)\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)\s*=\s*(-?\d+\.?\d*)\s*\$?/;

/** Two-step form: A(x ± B) = C x ± D — the shape the multi-step work uses. */
const LINEAR_BRACKET = /\$?\s*(-?\d*\.?\d*)\s*\(\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)\s*\)\s*=\s*(-?\d*\.?\d*)\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)/;

/** The bracketless two-sided form: A x ± B = C x ± D. Matched BEFORE the plain
 *  pattern, which cannot see it whole — see `parseLinear`. */
const LINEAR_TWO_SIDED = /\$?\s*(-?\d*\.?\d*)\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)\s*=\s*(-?\d*\.?\d*)\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)/;

function num(s: string): number {
  return s === "-" ? -1 : s === "" ? 1 : parseFloat(s);
}

/**
 * Parse a one-unknown linear equation into `a·x + b = rhs`, whichever of the
 * two shapes it arrives in.
 *
 * The bracket form is expanded and NORMALISED rather than refused, because a
 * concept that now serves multi-step work must still be transferable: a
 * re-framer that only understood `ax + b = c` would quietly record a hard draw
 * as "direct" — same surface, harder numbers — which is exactly the thing the
 * transfer stage exists NOT to claim.
 *
 * For `A(x + sB) = Cx + tD` the expansion gives `(A − C)x = tD − A·sB`. The
 * story surface needs a joining fee as well as a monthly amount, so the split
 * is chosen to make the story read naturally — the fee is one month's payment —
 * which changes the SITUATION and not the unknown. That is what a story surface
 * is: the same skill in a new world, and the learner's answer is the same x.
 * Only `a = A − C > 0` is accepted; anything else is left to the caller's
 * `direct` fallback rather than dressed up as a story with negative months.
 */
function parseLinear(prompt: string): { a: number; b: number; rhs: number } | null {
  // ── THE TWO-SIDED FORM IS MATCHED FIRST, because the plain pattern cannot
  // see it whole. `LINEAR` is unanchored, so on "Solve 2x + 5 = 0x + 19" it
  // matched the PREFIX "2x + 5 = 0": rhs read as 0 instead of 19, and the story
  // surface then told the learner a total its own answer key contradicted
  // ("a joining fee of 5, after 2 months the total paid is 0" for an item whose
  // answer is 7). A wrong number shown to a learner is not a cosmetic defect,
  // so the shape that provoked it is matched properly rather than skipped.
  const two = prompt.match(LINEAR_TWO_SIDED);
  if (two) {
    const A = num(two[1]);
    const bSign = two[2] === "-" || two[2] === "\u2212" ? -1 : 1;
    const B = bSign * parseFloat(two[3]);
    const C = num(two[4]);
    const dSign = two[5] === "-" || two[5] === "\u2212" ? -1 : 1;
    const D = dSign * parseFloat(two[6]);
    const a = A - C;
    if ([A, B, C, D, a].every(Number.isFinite) && a > 0 && B >= 0) return { a, b: B, rhs: D };
    return null;
  }
  // The PLAIN form, and only when the equation really is plain. "Solve
  // 3(2x + 1) = 15" also contains a matchable "2x + 1 = 15" — a DIFFERENT
  // equation from the one on the page — so a prompt carrying a bracket is left
  // to the bracket pattern below and, failing that, to the caller's `direct`
  // fallback instead of being re-told as something it is not. A NEGATIVE
  // constant is refused for the same reason: the story words it as a joining
  // fee, so a discount would have to be said as a discount to stay true, which
  // is a reading this template cannot express.
  const m = prompt.includes("(") ? null : prompt.match(LINEAR);
  if (m) {
    const a = num(m[1]);
    const neg = m[2] === "-" || m[2] === "\u2212";
    const b = parseFloat(m[3]);
    const rhs = parseFloat(m[4]);
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(rhs) && a !== 0) {
      return neg ? null : { a, b, rhs };
    }
    return null;
  }
  const br = prompt.match(LINEAR_BRACKET);
  if (!br) return null;
  const A = num(br[1]);
  const innerSign = br[2] === "-" || br[2] === "\u2212" ? -1 : 1;
  const inner = innerSign * parseFloat(br[3]);
  const C = num(br[4]);
  const outerSign = br[5] === "-" || br[5] === "\u2212" ? -1 : 1;
  const D = outerSign * parseFloat(br[6]);
  const a = A - C;
  if (![A, inner, C, D, a].every(Number.isFinite) || a <= 0) return null;
  // (A − C)x = D − A·inner, told as "fee a, then a every month, total rhs".
  const product = D - A * inner;
  return { a, b: a, rhs: product + a };
}

/**
 * THE ANSWER AS A VALUE, or null when the answer is prose.
 *
 * This is the first half of what makes the inverse honest. The item asks which
 * of four questions produces a stated result, and two PROSE answers can be the
 * same fact said differently — "Increases — the outer electron is lost more
 * easily" against "it increases — the outer electron is further from the
 * nucleus and lost more easily". A learner picking the second would be marked
 * wrong for a defensible answer, which is a lie, not a measurement.
 *
 * So an answer counts as a value only when it is short and specific: at most
 * two tokens once spacing around operators is collapsed ("800", "x=5",
 * "43 litres", "-1/60", "5.6×10⁹"), and it must carry a digit unless it is a
 * single word. Anything longer is prose, and the concept keeps its deeper-work
 * stage. Operator spacing is collapsed for COMPARISON only — the text the
 * learner reads is the bank's own, untouched.
 */
export function answerValueKey(raw: string): string | null {
  const s = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!s) return null;
  const collapsed = s.replace(/\s*([+\-\u2212×÷=/<>^])\s*/g, "$1");
  const tokens = collapsed.split(" ");
  if (tokens.length > 2) return null;
  if (!/[0-9]/.test(collapsed) && tokens.length > 1) return null;
  return collapsed.toLowerCase();
}

/**
 * The second half: a question may serve as one of four OPTIONS only when it is
 * one readable line.
 *
 * A multi-part stem or a paragraph is a wall of text inside a choice list, so
 * a concept whose items are like that is not re-framed this way — the gate says
 * no and the stage stays deeper work. Truncated variants (the generators emit
 * "…" summary forms) are excluded too: a summary's own answer is a summary, and
 * pairing the two is what produced two defensibly-correct options when this
 * rule was first measured.
 */
function readableOption(prompt: string): boolean {
  return typeof prompt === "string"
    && prompt.length > 0
    && prompt.length <= 120
    && !/[\n…]/.test(prompt);
}

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

/**
 * THE ONE LETTER AN EQUATION IS SOLVED FOR, or null when the prompt is not a
 * single-unknown equation.
 *
 * The inverse surface used to be framed generically — "3 — which of these
 * questions gives this answer?" — and that sentence is grammatical but not
 * teachable: it asks a learner to read four equations, solve all four, and
 * compare, without ever saying that this is what the item wants. When the four
 * options ARE equations, the question the item is asking has a name, and this
 * finds it so the prompt can say it.
 *
 * Only SINGLE-LETTER runs count, because the prompts are sentences ("Solve
 * 3(x + 3) = 30.") and the word "Solve" contains five letters that are not a
 * variable. The letter must also be a plausible unknown — one letter, and the
 * same one in every option — so a prompt with several variables (a formula such
 * as `v = u + at`) is refused and keeps the generic wording rather than being
 * told it has "a solution for v" when it has three unknowns.
 */
export function equationVariable(prompt: string): string | null {
  if (typeof prompt !== "string" || !prompt.includes("=")) return null;
  const singles = (prompt.match(/(?<![A-Za-z])[A-Za-z](?![A-Za-z])/g) ?? []).map((s) => s.toLowerCase());
  const distinct = [...new Set(singles)];
  if (distinct.length !== 1) return null;
  return distinct[0];
}

/**
 * THE SOLUTION OF A ONE-UNKNOWN EQUATION, read straight off the prompt.
 *
 * This exists to make a CLAIM CHECKABLE rather than to serve an item. The
 * inverse frame asserts "only one of these equations has that solution", and
 * that assertion is only true if the bank's own answer for each option is the
 * equation's own solution. Those are two different facts that happen to agree
 * today — a generator that printed `Solve 2(x + 3) = 18` and keyed 6.5 would
 * break both the item and the claim — so the frame is offered only when this
 * function and the option's answer key agree, and `npm run verify` re-derives
 * it from the served item rather than trusting this file.
 *
 * Deliberately STRICTER about shape and LAXER about signs than `parseLinear`:
 * the story surface needs a fee it can word as a fee, while a solution is a
 * solution whether the constant is added or subtracted.
 */
export function equationSolution(prompt: string): number | null {
  if (typeof prompt !== "string" || !prompt.includes("=")) return null;
  const clean = prompt.replace(/\u2212/g, "-");
  const two = clean.match(/(-?\d*\.?\d*)\s*x\s*([+\-])\s*(\d+(?:\.\d+)?)\s*=\s*(-?\d*\.?\d*)\s*x\s*([+\-])\s*(\d+(?:\.\d+)?)/);
  if (two) {
    const A = two[1] === "-" ? -1 : two[1] === "" ? 1 : parseFloat(two[1]);
    const B = (two[2] === "-" ? -1 : 1) * parseFloat(two[3]);
    const C = two[4] === "-" ? -1 : two[4] === "" ? 1 : parseFloat(two[4]);
    const D = (two[5] === "-" ? -1 : 1) * parseFloat(two[6]);
    return A === C ? null : (D - B) / (A - C);
  }
  const bracket = clean.match(/(-?\d*\.?\d*)\s*\(\s*x\s*([+\-])\s*(\d+(?:\.\d+)?)\s*\)\s*=\s*(-?\d*\.?\d*)/);
  if (bracket) {
    const A = bracket[1] === "-" ? -1 : bracket[1] === "" ? 1 : parseFloat(bracket[1]);
    const inner = (bracket[2] === "-" ? -1 : 1) * parseFloat(bracket[3]);
    const rhs = parseFloat(bracket[4]);
    if (!A) return null;
    return rhs / A - inner;
  }
  const plain = clean.match(/(-?\d*\.?\d*)\s*x\s*([+\-])\s*(\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/);
  if (plain) {
    const a = plain[1] === "-" ? -1 : plain[1] === "" ? 1 : parseFloat(plain[1]);
    const b = (plain[2] === "-" ? -1 : 1) * parseFloat(plain[3]);
    const rhs = parseFloat(plain[4]);
    if (!a) return null;
    return (rhs - b) / a;
  }
  return null;
}

/** Two values agree to the precision a printed answer carries. */
function sameValue(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

/**
 * IS THIS FOUR-OPTION SET AN EQUATION SET, and if so what does it ask?
 *
 * Answers null unless every option is a one-unknown equation whose OWN answer
 * is its own solution — the condition under which "which equation has x = 3 as
 * its solution" is true of the item rather than merely worded about it. The
 * variables must agree across the four options, because a frame naming `x`
 * beside an option in `y` would be naming something the learner cannot see.
 */
export function equationFrame(
  prompts: string[],
  answers: string[],
  correctIndex: number,
): { variable: string; value: number } | null {
  if (prompts.length === 0 || prompts.length !== answers.length) return null;
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= prompts.length) return null;
  const vars = prompts.map(equationVariable);
  const first = vars[0];
  if (!first || vars.some((v) => v !== first)) return null;
  const solutions: number[] = [];
  for (let i = 0; i < prompts.length; i++) {
    const solved = equationSolution(prompts[i]);
    const own = answerValueKey(answers[i]);
    if (solved === null || own === null) return null;
    // The option's own answer must BE its solution, to the printed tolerance:
    // one is what the bank keyed, the other is what the equation means.
    const ownNum = Number(own.replace(`${first}=`, ""));
    if (!Number.isFinite(ownNum) || !sameValue(ownNum, solved)) return null;
    solutions.push(ownNum);
  }
  // THE STATED VALUE IS THE CORRECT OPTION'S, not the first one's: the frame
  // names the value that exactly one option solves to, and the caller's answer
  // index is the only thing that says which that is. A second exact match would
  // make two options right, so it is refused here rather than shipped.
  const value = solutions[correctIndex];
  if (!Number.isFinite(value)) return null;
  if (solutions.filter((s) => sameValue(s, value)).length !== 1) return null;
  return { variable: first, value };
}

/** Story surface: the equation ax + b = rhs retold as fixed fee + repeated
 *  amount. The monthly amount IS the original unknown — same skill, new
 *  world. Choice list and answer index are untouched. */
function storyQuestion(q: Question, lang: string, a: number, b: number, rhs: number): Question | null {
  const t = translator(lang);
  // `b` needs no absolute value here: `parseLinear` refuses a negative
  // constant precisely because this sentence can only state a fee.
  //
  // AND A ONE-MONTH STORY IS REFUSED, for the same reason: the sentence says
  // "After {n} months", which is grammatical for every count except one — and a
  // real draw at band 0.7 printed "After 1 months the total paid is 7", read out
  // of the served bank rather than imagined. The count is the unknown, so it can
  // be 1. The template has no singular form (adding one would mean fifteen more
  // sentences that differ by one letter), and the honest alternative is to let
  // this draw take another surface — `inverse` or `direct` — rather than print a
  // sentence a learner can see is wrong. Coverage is not bought by wording a
  // learner has to forgive.
  // THE NUMBER IN THE SENTENCE IS `a`, THE COEFFICIENT — which IS the number of
  // months, because the story is exactly `fee + months × monthly = total`. It is
  // NOT the solution: `(rhs − b) / a` is the unknown, and printing that into the
  // prompt would hand the learner the answer on a plate.
  if (Math.abs(a - 1) < 1e-9) return null;
  // ── AND THE STORY MUST BE A TRUE RE-TELLING, WHICH IS FOUR CONDITIONS ──
  // `parseLinear` is a shape match, and a shape match on a fragment of a prompt
  // that is not a one-step equation produces a sentence that is grammatical and
  // false. Measured on the served bank before these guards: `quadratics` was
  // offered "A gym charges a joining fee of 4 plus the same amount every month.
  // After 4 months the total paid is 0" — a total of zero after four monthly
  // payments of a fee that was already paid, and a monthly amount of −1, which
  // this template cannot state (it has no way to say "we take 1 off you each
  // month"). So:
  //   1. the unknown has to be POSITIVE — a negative or zero payment is the
  //      "discount" case the plain pattern already refuses by design;
  //   2. the item's own keyed answer has to BE that unknown, so the re-told story
  //      asks for the same number the original marks;
  //   3. the answer has to be a VALUE, not prose (`answerValueKey`) — a story
  //      whose four options are still a parabola's crossings is not re-framed;
  //   4. the sentence needs a plural, which `a === 1` does not have.
  const unknown = (rhs - b) / a;
  if (!Number.isFinite(unknown) || unknown <= 0) return null;
  // An answer keyed as "x = 6" is the number 6 — `answerValueKey` keeps the
  // variable because the OTHER surfaces print it that way, so it is stripped
  // here rather than treated as prose. Without this the story surface silently
  // collapsed to almost no items, which is a worse outcome than a wrong sentence
  // only because it is quieter.
  const keyed = answerValueKey(String(q.choices[q.answer] ?? ""));
  const keyedNum = keyed === null ? NaN : Number(keyed.replace(/^[a-z]\s*=\s*/, ""));
  if (!Number.isFinite(keyedNum) || Math.abs(keyedNum - unknown) > 1e-9) return null;
  const prompt = [
    t("tr.story0"), fmt(b),
    t("tr.story1"), fmt(a),
    t("tr.story2"), fmt(rhs),
    t("tr.story3"),
  ].join("");
  return { ...q, id: `${q.id}:story`, prompt, difficulty: Math.min(0.95, q.difficulty + 0.05) };
}

/** Deterministic shuffle that keeps track of the correct index. */
function shuffleWithAnswer(items: string[], correctIdx: number, seed: string): { items: string[]; answer: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const idx = items.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { items: idx.map((i) => items[i]), answer: idx.indexOf(correctIdx) };
}

/**
 * THE INVERSE SURFACE — the rule that widens transfer coverage.
 *
 * Given the target question, collect three more questions of the SAME concept,
 * drawn at the SAME band, whose own answers are different values, and ask which
 * of the four produces the target's result. Every option is real generated
 * content; the correct one is the target, whose answer index the server already
 * holds. So "exactly one option is correct" is true by construction: the three
 * distractors' own answers were required to differ from the stated value.
 *
 * Returns null — never a weaker item — when the target's answer is prose, when
 * a prompt cannot be read as one line, or when the band cannot produce three
 * distinct valued answers. That null is what keeps `canTransfer` honest.
 */
function inverseFromDraws(
  conceptId: string,
  seed: string,
  aim: number,
  lang: string,
  target: Question,
): { question: Question; distractors: Question[] } | null {
  const value = target.choices[target.answer] ?? "";
  const targetKey = answerValueKey(value);
  if (!targetKey || !readableOption(target.prompt)) return null;
  const used: Question[] = [];
  for (let i = 0; i < INVERSE_DISTRACTOR_ATTEMPTS && used.length < 3; i++) {
    const q = generateQuestionAt(conceptId, `${seed}:i${i}`, aim, 0);
    if (!q || q.prompt === target.prompt || !readableOption(q.prompt)) continue;
    const key = answerValueKey(q.choices[q.answer] ?? "");
    if (!key || key === targetKey) continue;
    if (used.some((d) => d.prompt === q.prompt)) continue;
    used.push(q);
  }
  if (used.length < 3) return null;
  const t = translator(lang);
  const { items, answer } = shuffleWithAnswer([target.prompt, ...used.map((d) => d.prompt)], 0, seed);
  // ── THE QUESTION SAYS WHAT IT IS ASKING ────────────────────────────────
  //
  // The prompt used to be `${value} — which of these questions gives this
  // answer?`: a bare number, an em dash and a fragment. It is grammatical and it
  // is nearly unanswerable — a learner reads four equations, is told a number, and
  // has to work out from the shape of the sentence that the task is "solve all
  // four and find the one that comes to 3". The product's own reviewer asked why
  // the question was worded that way, which is the only evidence a prompt needs.
  //
  // Where the four options really are one-unknown equations, the task has a name
  // and this says it: "Which equation has x = 3 as its solution?" That frame is
  // used ONLY when `equationFrame` can re-derive it from what is on screen — every
  // option a solvable equation, every option's own keyed answer equal to its own
  // solution, one variable shared, exactly one option solving to the stated value.
  // Otherwise the generic sentence stays, because it is true of any four questions
  // and the equation sentence would not be.
  //
  // The stated value is printed WITHOUT a leading variable when the frame already
  // names one ("x = 3", not "x = x=3"), and the answer strings are the bank's own
  // answer keys for those four draws — the same keys the grader uses.
  // The answers travel with their prompts THROUGH the shuffle: `items` is
  // re-ordered and `answer` follows it, so a list read straight off `used` would
  // be checked against the wrong option. The prompts are unique by construction
  // above (a duplicate option would be a second correct answer), which is what
  // makes this lookup exact rather than a guess.
  const source = [target.prompt, ...used.map((d) => d.prompt)];
  const answerOf = [target.choices[target.answer] ?? "", ...used.map((d) => d.choices[d.answer] ?? "")];
  const answers = items.map((p) => answerOf[source.indexOf(p)]);
  const frame = equationFrame(items, answers, answer);
  const prompt = frame
    ? fill(t("tr.whichSolution"), { var: frame.variable, v: fmt(frame.value) })
    : fill(t("tr.whichAnswer"), { v: value });
  return {
    question: {
      ...target,
      id: `${target.id}:rev`,
      prompt,
      choices: items,
      answer,
      difficulty: Math.min(0.95, target.difficulty + 0.05),
      // ── THE INVERSE IS A CHOICE, WHATEVER ITS TARGET WAS ────────────────
      // `...target` carries a NUMERIC draw's `responseKind`, `answerValue`,
      // `tolerance` and `choiceValues` — and those are the numbers of the
      // TARGET'S OWN four options, while the choices above are four PROMPT
      // strings with `answer` indexing them. Left in place they graded a
      // correct pick against an unrelated number (a right answer recorded as
      // wrong, which the end-to-end suite measured on `linear-equations`) and
      // told the client to render a typed box for a question whose options are
      // sentences. The inverse asks "which of these produces this value?" — an
      // option to pick, so the typed-answer fields are cleared rather than
      // inherited.
      responseKind: undefined,
      answerValue: undefined,
      tolerance: undefined,
      choiceValues: undefined,
    },
    distractors: used,
  };
}

/**
 * THE ONE SWEEP. Serve this concept's idea on a second surface if the bank can
 * really do it, and otherwise serve the draw itself as `direct`.
 *
 * `source` is the direct draw the surface was built from, and `distractors`
 * the real questions whose stems became the other options — both returned so a
 * test can RE-DERIVE what the item claims (which question produces the stated
 * result, and whether any other option's own answer also does) by grading the
 * draws itself rather than trusting this function. The route ignores both.
 *
 * Surface choice is deterministic per attempt, alternating so a concept that
 * supports both does not show the learner the same framing every time.
 */
export function serveTransfer(
  conceptId: string,
  seed: string,
  aim: number,
  lang: string,
): { question: Question; surface: Surface; source: Question; distractors: Question[] } | null {
  let first: Question | null = null;
  for (let attempt = 0; attempt < TRANSFER_SURFACE_ATTEMPTS; attempt++) {
    const drawn = generateQuestionAt(conceptId, seed, aim, attempt);
    if (!drawn) break;
    first ??= drawn;
    const linear = parseLinear(drawn.prompt);
    const preferStory = attempt % 2 === 0;
    const tryStory = () => (linear ? storyQuestion(drawn, lang, linear.a, linear.b, linear.rhs) : null);
    const tryInverse = () => inverseFromDraws(conceptId, `${seed}:a${attempt}`, aim, lang, drawn);
    const variants = preferStory ? [tryStory, tryInverse] : [tryInverse, tryStory];
    for (const build of variants) {
      const built = build();
      if (!built) continue;
      if ("question" in built) {
        return { question: built.question, surface: "inverse", source: drawn, distractors: built.distractors };
      }
      return { question: built, surface: "story", source: drawn, distractors: [] };
    }
  }
  return first ? { question: first, surface: "direct", source: first, distractors: [] } : null;
}

/** Seeds the probe sweeps. Fixed, so `canTransfer` is a fact about the
 *  concept rather than about when it was asked. */
const TRANSFER_PROBE_SEEDS = ["tf1", "tf2", "tf3", "tf4"] as const;
/** The bands worth probing: a concept whose EASY draws re-frame but whose hard
 *  draws do not is not transferable in the sense that matters — the transfer
 *  stage serves the top of the range. */
const TRANSFER_PROBE_BANDS = [0.5, 0.7, 0.85] as const;

/**
 * CAN THIS CONCEPT BE PUT ON A SECOND SURFACE AT ALL?
 *
 * Asked of the serve rather than of a rule of thumb: the answer depends on the
 * questions a concept's generator actually draws — whether any of them has a
 * valued answer with three differently-valued neighbours at the same band — so
 * this probes `serveTransfer` on fixed seeds and bands and reports what it
 * finds. Two facts use it: the decision engine may only offer TRANSFER when the
 * serve can honour it, and the exercise page labels the stage Transfer or
 * Deeper from the serve's own answer.
 *
 * MEMOISED, and that is not an optimisation merely: the probe asks a pure
 * question ("can this concept be re-framed?"), the same question is asked on
 * every serve and on every decision, and the sweep behind it draws up to a
 * hundred questions. One answer per concept per process is what keeps the
 * honest gate affordable enough to ask everywhere.
 */
const transferCache = new Map<string, boolean>();
export function canTransfer(conceptId: string): boolean {
  const cached = transferCache.get(conceptId);
  if (cached !== undefined) return cached;
  let answer = false;
  for (const seed of TRANSFER_PROBE_SEEDS) {
    for (const band of TRANSFER_PROBE_BANDS) {
      const served = serveTransfer(conceptId, `probe:${seed}`, band, "en");
      if (served && served.surface !== "direct") {
        answer = true;
        break;
      }
    }
    if (answer) break;
  }
  transferCache.set(conceptId, answer);
  return answer;
}
