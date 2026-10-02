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

import { translator } from "./i18n";
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
 */
export const TRANSFER_SURFACE_ATTEMPTS = 6;

/** Draws the inverse may look at while collecting its three distractors. */
export const INVERSE_DISTRACTOR_ATTEMPTS = 24;

/** Linear-equation pattern: [coef]x ± k = n, optionally inside $...$. */
const LINEAR = /\$?\s*(-?\d*\.?\d*)\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)\s*=\s*(-?\d+\.?\d*)\s*\$?/;

/** Two-step form: A(x ± B) = C x ± D — the shape the multi-step work uses. */
const LINEAR_BRACKET = /\$?\s*(-?\d*\.?\d*)\s*\(\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)\s*\)\s*=\s*(-?\d*\.?\d*)\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)/;

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
  const m = prompt.match(LINEAR);
  if (m) {
    const a = num(m[1]);
    const neg = m[2] === "-" || m[2] === "\u2212";
    const b = parseFloat(m[3]);
    const rhs = parseFloat(m[4]);
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(rhs) && a !== 0) {
      return { a, b: neg ? -b : b, rhs };
    }
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

/** Story surface: the equation ax + b = rhs retold as fixed fee + repeated
 *  amount. The monthly amount IS the original unknown — same skill, new
 *  world. Choice list and answer index are untouched. */
function storyQuestion(q: Question, lang: string, a: number, b: number, rhs: number): Question {
  const t = translator(lang);
  const prompt = [
    t("tr.story0"), fmt(Math.abs(b)),
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
  const lead = translator(lang)("tr.whichAnswer");
  const { items, answer } = shuffleWithAnswer([target.prompt, ...used.map((d) => d.prompt)], 0, seed);
  return {
    question: {
      ...target,
      id: `${target.id}:rev`,
      // The value reads FIRST, so the frame is a lowercase fragment in every
      // language — `tr.whichAnswer` is authored that way (see
      // scripts/i18n-transfer.mjs) and appended here exactly as documented.
      prompt: `${value} — ${lead}?`,
      choices: items,
      answer,
      difficulty: Math.min(0.95, target.difficulty + 0.05),
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
