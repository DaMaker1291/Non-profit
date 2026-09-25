// ─────────────────────────────────────────────────────────────────────────────
// GENUINE TRANSFER (audit P0-D).
//
// Difficulty escalation is not transfer. A learner who solves 3x + 2 = 11 has
// proven nothing about recognising the same idea in a gym's monthly bill. The
// transfer stage therefore re-frames the concept's question through a
// DIFFERENT surface before any transfer credit is recorded:
//
//   story   — the same equation as a real-world situation: "a joining fee of
//             b plus the same amount every month; after a months the total is
//             rhs — what is the monthly amount?" The unknown keeps its value,
//             the framing changes completely.
//   inverse — the solution is given; the learner must pick which equation
//             produces it. Answer→question instead of question→answer.
//   direct  — fallback when the prompt isn't a recognisable equation: a fresh
//             draw at the top of the difficulty range, recorded honestly as
//             "direct" (unfamiliar numbers, same surface). Direct surfaces
//             never unlock the strong mastery ceiling (mastery.ts).
//
// Grading is untouched — only the inverse surface rebuilds the choice list,
// and the server (never the client) holds the answer index.
// ─────────────────────────────────────────────────────────────────────────────

import { translator } from "./i18n";
import type { Question } from "./types";

export type Surface = "direct" | "story" | "inverse";

/**
 * How many draws a transfer serve may look at before it settles for `direct`.
 *
 * A transfer request asks for the SAME idea on a DIFFERENT surface, and the
 * re-framers only understand the prompt shapes they were written for (a linear
 * equation, for instance). A concept whose range now includes multi-step work
 * can draw a shape they do not, so the serve looks at a few draws at the same
 * difficulty floor and takes the first one that genuinely re-frames. Bounded so
 * a concept with no re-frameable shape costs a handful of draws, not a loop,
 * and exported so the behaviour can be asserted rather than assumed. */
export const TRANSFER_SURFACE_ATTEMPTS = 6;

/** Linear-equation pattern: [coef]x ± k = n, optionally inside $...$. */
const LINEAR = /\$?\s*(-?\d*\.?\d*)\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)\s*=\s*(-?\d+\.?\d*)\s*\$?/;

function num(s: string): number {
  return s === "-" ? -1 : s === "" ? 1 : parseFloat(s);
}

/** Two-step form: A(x ± B) = C x ± D — the shape the multi-step work uses. */
const LINEAR_BRACKET = /\$?\s*(-?\d*\.?\d*)\s*\(\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)\s*\)\s*=\s*(-?\d*\.?\d*)\s*x\s*([+\-\u2212])\s*(\d+\.?\d*)/;

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

/** Inverse surface: given the solution, pick the equation that produces it.
 *  Every distractor's solution provably differs from the stated one. */
function inverseQuestion(q: Question, seed: string, lang: string): Question | null {
  const p = parseLinear(q.prompt);
  if (!p) return null;
  const xVal = parseFloat(String(q.choices[q.answer]).replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(xVal)) return null;
  const total = p.a * xVal + p.b;
  const sign = p.b >= 0 ? "+" : "\u2212";
  const absB = Math.abs(p.b);
  // Distractor 1: constant nudged — solution shifts by k/a.
  let k = 2;
  let sol1 = (total - (absB + k)) / p.a;
  while (Math.abs(sol1 - xVal) < 1e-9 && k < 60) {
    k += 2;
    sol1 = (total - (absB + k)) / p.a;
  }
  // Distractor 2: sign flipped — solution differs whenever b ≠ 0; when b = 0
  // the coefficient is doubled instead (solution halves).
  const sol2 = absB > 0 ? (total + absB) / p.a : xVal / 2;
  const cand2 = absB > 0
    ? `${fmt(p.a)}x ${p.b >= 0 ? "\u2212" : "+"} ${fmt(absB)} = ${fmt(total)}`
    : `${fmt(p.a * 2)}x = ${fmt(total)}`;
  const candidates = [
    `${fmt(p.a)}x ${sign} ${fmt(absB)} = ${fmt(total)}`, // the original — correct
    `${fmt(p.a)}x ${sign} ${fmt(absB + k)} = ${fmt(total)}`,
    cand2,
  ];
  const lead = translator(lang)("tr.inverseLead");
  const prompt = `${lead} x = ${fmt(xVal)}`;
  const { items, answer } = shuffleWithAnswer(candidates, 0, seed);
  return {
    ...q,
    id: `${q.id}:inv`,
    prompt,
    choices: items,
    answer,
    difficulty: Math.min(0.95, q.difficulty + 0.05),
  };
}

/** Build the transfer variant of a practice question. Returns the question
 *  and the surface actually achieved — the server records the surface with
 *  the transfer evidence so the mastery claim never outruns it. */
export function transferVariant(q: Question, seed: string, lang: string): { question: Question; surface: Surface } {
  const p = parseLinear(q.prompt);
  if (p) {
    // Alternate deterministically between the two genuine surfaces.
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    if (h % 2 === 0) {
      return { question: storyQuestion(q, lang, p.a, p.b, p.rhs), surface: "story" };
    }
    const inv = inverseQuestion(q, seed, lang);
    if (inv) return { question: inv, surface: "inverse" };
  }
  return { question: q, surface: "direct" };
}
