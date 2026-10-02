// ─────────────────────────────────────────────────────────────────────────────
// THE DEPTH LAYER — the questions a practicing student meets AFTER the basics.
//
// Why this file exists. The original bank was honest and shallow: every item
// was multiple-choice, most sat at difficulty 0.2–0.45, only three concepts
// could reach the multi-step band (0.55) and NOTHING reached the data-and-graphs
// band (0.75). The bank said so itself (`SKILLS_NOT_IN_BANK`) and `npm run
// verify` measured that claim against every generator — so the gap was declared
// rather than hidden. A declared gap is still a gap: a student who had mastered
// the recall items had nowhere to go, and "adaptive" could only mean "another
// easy draw from the same distribution".
//
// What this layer is:
//   · ONE deep family per flagship concept, composed ON TOP of the concept's
//     existing generator (`withDepth` in lib/questions.ts). Base draws are
//     untouched, so nothing that already worked was rewritten — and the
//     misconception declarations still hold, because every family below tags
//     only beliefs its concept already declares.
//   · Each family declares a difficulty per draw, and the declaration IS the
//     work: 0.55–0.74 means the item takes several pieces of working (a chain
//     of operations, a rearrangement, a back-substitution), and ≥0.75 means the
//     answer is not in the question — it has to be read out of a table, a
//     graph, a survey or a model. A number is not a level, so the deep variants
//     are written to the band they claim.
//   · Every distractor is a real error, not a nearby number: adding
//     denominators, applying a percentage to the wrong base, trusting the mean
//     through an outlier, reading the wrong trig ratio, forgetting the
//     intercept. Those are the beliefs the misconception catalogue coaches, and
//     an item that cannot separate them teaches the grader nothing.
//
// What this layer is NOT: a claim that multiple choice can measure extended
// writing. `extended_response` stays out of `SKILLS_IN_BANK` and every surface
// still says so.
//
// Determinism is a hard requirement (an item's id is `concept:seed`, and the
// ledger names questions without storing their text), so every family is a pure
// function of the seeded RNG. Helpers are local rather than imported from
// lib/questions.ts because that module imports THIS one at init: a value-level
// import back would make the pair circular, and a cycle that happens to work
// today is a cycle that breaks at the next refactor.
//
// The contract these families are held to is machine-checked, not promised:
// `npm run verify` sweeps each family over 240 seeds and fails unless every
// draw yields four distinct, non-empty options, a difficulty inside [0,1]
// (with the deep families actually reaching the bands they claim), and only
// misconception tags its own concept declares.
// ─────────────────────────────────────────────────────────────────────────────

/** The RNG surface a deep family may use — structurally identical to
 *  lib/questions.ts's `Rng`, declared here so this module never imports a VALUE
 *  from the module that imports it. */
export interface DeepRng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: T[]): T;
  nz(min: number, max: number): number;
  shuffle<T>(arr: T[]): T[];
}

export interface DeepItem {
  prompt: string;
  correct: string;
  wrongs: string[];
  tags: string[];
  explanation: string;
  difficulty: number;
}

export type DeepGen = (r: DeepRng) => DeepItem;

// ── Student-facing formatting ───────────────────────────────────────────────
// Never a floating-point tail, never `1e-4` where a student expects 10⁻⁴.

export function deepGcd(a: number, b: number): number {
  // A non-finite input must TERMINATE. `a % b` is NaN when either side is, and
  // NaN is not 0, so the unguarded form recursed until the stack overflowed —
  // a hang, in a module that ships inside the offline bundle a learner's phone
  // runs. A generator's own mistake should produce a wrong value, never a
  // frozen tab; 1 is the "no common factor known" answer the caller can live
  // with, and the wrong answer is caught by the content sweep.
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return b === 0 ? Math.abs(a) : deepGcd(b, a % b);
}

/** A fraction in lowest terms, as a student would write it. */
export function deepFrac(n: number, d: number): string {
  const g = deepGcd(n, d) || 1;
  const nn = n / g;
  const dd = d / g;
  if (dd === 1) return String(nn);
  return dd < 0 ? `${nn > 0 ? "-" : ""}${Math.abs(nn)}/${-dd}` : `${nn}/${dd}`;
}

/**
 * The first `n` candidates that are genuinely different from the answer and
 * from each other.
 *
 * Deep families are written with plausible distractors, but plausible is not
 * distinct: in a ratio question the "smaller amount" and "the difference" are
 * the same number whenever one part is half the other, and a proportion's
 * inverse answer is the other quantity's own value whenever the constant falls
 * out that way. Building the list and then filtering it is the difference
 * between a distractible question and one whose wrong option is the right
 * answer — so every family that can collide uses this. */
export function pickDistinct(correct: string, candidates: readonly (string | number)[], n = 3): string[] {
  const out: string[] = [];
  for (const cand of candidates) {
    const s = String(cand);
    if (s !== correct && !out.includes(s) && out.length < n) out.push(s);
  }
  return out;
}

export function deepNum(x: number, dp = 2): string {
  return String(Number(x.toFixed(dp)));
}

export function deepMoney(x: number): string {
  return `£${x.toFixed(2)}`;
}

const SUP_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** A number as Unicode superscript digits: 3 → ³, 12 → ¹². Used for ionic
 *  charges and formula subscripts, where the shape of the number is the
 *  chemistry. */
function sup(n: number): string {
  return String(Math.abs(n)).split("").map((c) => SUP_DIGITS[Number(c)]).join("");
}

/** `10⁴`, `10⁻⁶` — a real power of ten, never `1e-6`. */
export function deepPow(n: number): string {
  const sup = String(Math.abs(n)).split("").map((c) => SUP_DIGITS[Number(c)]).join("");
  return `10${n < 0 ? "⁻" : ""}${sup}`;
}

/** A×10ⁿ, with 1 ≤ A < 10 (or A = 0). */
export function deepSci(a: number, n: number): string {
  if (a === 0) return "0";
  const { a: ca, n: cn } = toSci(a);
  return `${deepNum(ca, 2)} × ${deepPow(cn + n)}`;
}

/** Reduce a number to [A, exponent] with 1 ≤ |A| < 10. */
export function toSci(x: number): { a: number; n: number } {
  if (x === 0) return { a: 0, n: 0 };
  const n = Math.floor(Math.log10(Math.abs(x)));
  const a = x / Math.pow(10, n);
  return { a: Number(a.toFixed(4)), n };
}

// ── The four-distinct-options safety net ────────────────────────────────────
//
// generateQuestion() pads a short option list with "None of these" as a last
// resort, and the question audit rightly calls that a broken question. So the
// deep layer guarantees its own four options: the families below are written
// with distinct distractors, and this pass perturbs the LAST number in the
// correct answer for the rare numeric draw where two still collide. For a
// numeric answer every perturbation is a plausible slip (one more, one less,
// a decimal place out) — never filler. The verify sweep asserts every family
// reaches four distinct options and never needs the textual fallback.

/** The last number in a string, with enough context to perturb it in place. */
function lastNumber(s: string): { start: number; end: number; value: number } | null {
  const m = [...s.matchAll(/-?\d+(?:\.\d+)?/g)];
  if (m.length === 0) return null;
  const hit = m[m.length - 1];
  return { start: hit.index ?? 0, end: (hit.index ?? 0) + hit[0].length, value: Number(hit[0]) };
}

function perturb(s: string): string[] {
  const hit = lastNumber(s);
  if (!hit) return [];
  const step = hit.value === 0 ? 1 : Math.max(0.5, Math.abs(hit.value) * 0.1);
  const out: string[] = [];
  for (const delta of [step, -step, step * 2, -step * 2, step * 10]) {
    const next = hit.value + delta;
    if (next < 0 && !s.includes("-")) continue;
    const text = Number(next.toFixed(4));
    const rendered = /^\d+$/.test(s.slice(hit.start, hit.end)) && Number.isInteger(text) ? String(text) : deepNum(text, 2);
    const candidate = s.slice(0, hit.start) + rendered + s.slice(hit.end);
    if (candidate !== s && !out.includes(candidate)) out.push(candidate);
  }
  return out;
}

/**
 * Exactly four distinct, non-empty options: the correct answer first, the
 * family's own distractors next, and a numeric perturbation only if the family
 * came up short.
 */
export function fourDistinct(correct: string, wrongs: readonly string[]): string[] {
  const out: string[] = [];
  const push = (v: string) => {
    const s = String(v ?? "").trim();
    if (s && !out.includes(s)) out.push(s);
  };
  push(correct);
  for (const w of wrongs) push(w);
  for (const p of perturb(correct)) {
    if (out.length >= 4) break;
    push(p);
  }
  return out.slice(0, 4);
}

// ─────────────────────────────────────────────────────────────────────────────
// THE FAMILIES
// ─────────────────────────────────────────────────────────────────────────────

export const DEEP_GENS: Record<string, DeepGen> = {
  // ── NUMBER ────────────────────────────────────────────────────────────────

  /** Three fractions, different denominators, with a subtraction: each term
   *  needs its own common denominator and the subtracted sign must survive. */
  "fraction-ops": (r) => {
    const [d1, d2, d3] = r.shuffle([3, 4, 5, 6, 8]).slice(0, 3);
    const n1 = r.int(1, d1 - 1);
    const n2 = r.int(1, d2 - 1);
    const n3 = r.int(1, d3 - 1);
    const lcm = [d1, d2, d3].reduce((acc, d) => (acc * d) / deepGcd(acc, d), 1);
    const a1 = (n1 * lcm) / d1;
    const a2 = (n2 * lcm) / d2;
    const a3 = (n3 * lcm) / d3;
    const total = a1 + a2 - a3;
    const correct = deepFrac(total, lcm);
    // Distractors are BUILT then de-duplicated against the correct answer and
    // each other, because a chain of three fractions can land on 0 or on a
    // value the denom-add slip happens to reproduce exactly. Five candidates,
    // take the first three that are genuinely different: the alternative is an
    // item whose "wrong" option is the right answer.
    const wrongs: string[] = [];
    for (const cand of [
      // Tops added, bottoms added — the classic slip.
      deepFrac(n1 + n2 - n3, d1 + d2 + d3),
      // The subtraction done as an addition.
      deepFrac(a1 + a2 + a3, lcm),
      // A whole left in: the chain stopped one common denominator short.
      deepFrac(total + lcm, lcm),
      deepFrac(total - lcm, lcm),
      // The numerated term not scaled with the rest.
      deepFrac(a1 + a2 - a3 + 1, lcm),
    ]) {
      if (cand !== correct && !wrongs.includes(cand) && wrongs.length < 3) wrongs.push(cand);
    }
    return {
      prompt: `Work out ${n1}/${d1} + ${n2}/${d2} − ${n3}/${d3}. Give your answer as a fraction in its simplest form.`,
      correct,
      wrongs,
      tags: ["denom-add"],
      explanation: `The denominators differ, so convert every fraction to the lowest common denominator ${lcm} first: ${a1}/${lcm} + ${a2}/${lcm} − ${a3}/${lcm} = ${total}/${lcm} = ${correct}. Adding the denominators instead — ${n1 + n2 - n3}/${d1 + d2 + d3} — treats the bottom number as a size to add rather than a count of equal parts, which is why it lands nowhere near the right value.`,
      difficulty: 0.56 + r.next() * 0.08,
    };
  },

  /** Two percentage changes in sequence. The trap is the changed base: the
   *  second percentage acts on a different amount. */
  percentages: (r) => {
    // Pairs whose net change is never 0, so the "no change" and "wrong sign"
    // distractors can never collide with the answer.
    const pairs: Array<[number, number]> = [[10, 10], [20, 20], [20, 10], [50, 40], [25, 10], [50, 25], [10, 20], [40, 25]];
    const [up, down] = r.pick(pairs);
    const m = (1 + up / 100) * (1 - down / 100);
    const change = (m - 1) * 100;
    const sign = change > 0 ? "+" : "−";
    const correct = `${sign}${deepNum(Math.abs(change), 2)}%`;
    // Built, then de-duplicated. The naive "subtract the percentages" answer and
    // the right-magnitude-wrong-sign answer coincide whenever |change| equals
    // |up − down| — which happens for exactly the pairs that make the best
    // teaching point, so it can never be left to chance.
    const wrongs: string[] = [];
    for (const cand of [
      `${up - down >= 0 ? "+" : "−"}${Math.abs(up - down)}%`,
      `${change > 0 ? "−" : "+"}${deepNum(Math.abs(change), 2)}%`,
      `${up + down}%`,
      `${deepNum(100 - Math.abs(change), 2)}%`,
      `${sign}${deepNum(Math.abs(change) + 5, 2)}%`,
    ]) {
      if (cand !== correct && !wrongs.includes(cand) && wrongs.length < 3) wrongs.push(cand);
    }
    return {
      prompt: `A price rises by ${up}% and then falls by ${down}%. What is the overall percentage change?`,
      correct,
      wrongs,
      tags: ["pct-base"],
      explanation: `Work with multipliers, never added percentages: a ${up}% rise is ×${deepNum(1 + up / 100, 2)} and a ${down}% fall is ×${deepNum(1 - down / 100, 2)}. Multiplying: ×${deepNum(m, 4)}, an overall change of ${sign}${deepNum(Math.abs(change), 2)}%. The fall acts on the RAISED price — a different base — which is why ${up}% up and ${down}% down do not cancel.`,
      difficulty: 0.58 + r.next() * 0.08,
    };
  },

  /** A ratio split where the DIFFERENCE is given: one step more than sharing a
   *  total, and it is the part size that has to be found first. */
  ratio: (r) => {
    const a = r.int(3, 7);
    const b = r.int(1, a - 1);
    const unit = r.int(2, 9);
    const larger = a * unit;
    const smaller = b * unit;
    const diff = larger - smaller;
    // The part-to-part reading makes "smaller" and "the difference" the same
    // number whenever a = 2b, and "the total" collides with "larger + one part"
    // when b = 1 — so the distractors are built and de-duplicated rather than
    // assumed distinct.
    const wrongs: string[] = [];
    for (const cand of [smaller, diff, (a + b) * unit, larger + unit, larger - unit]) {
      const s = String(cand);
      if (s !== String(larger) && !wrongs.includes(s) && wrongs.length < 3) wrongs.push(s);
    }
    return {
      prompt: `Two amounts are in the ratio ${a} : ${b}. The larger amount is ${diff} more than the smaller. What is the LARGER amount?`,
      correct: String(larger),
      wrongs,
      tags: [],
      explanation: `The gap between the amounts is ${a} − ${b} = ${a - b} parts, and those parts are worth ${diff} in total, so one part is ${diff} ÷ ${a - b} = ${unit}. The larger amount is ${a} parts: ${a} × ${unit} = ${larger}. Reporting the ${diff} itself treats the difference as the answer, and the ratio as a fraction of that difference instead of the whole.`,
      difficulty: 0.58 + r.next() * 0.07,
    };
  },

  /** Inverse proportion, worked through the constant — with the direct
   *  proportion answer always on offer, because that is the belief at stake. */
  proportion: (r) => {
    const k = r.pick([12, 18, 20, 24, 30, 36, 40, 60]);
    const digits = [2, 3, 4, 5, 6, 8, 10, 12].filter((d) => k % d === 0);
    const x1 = r.pick(digits);
    const y1 = k / x1;
    const others = digits.filter((d) => d !== x1 && k / d !== y1);
    const x2 = others.length ? r.pick(others) : x1 * 2;
    const y2 = k / x2;
    const direct = Number((y1 * (x2 / x1)).toFixed(4));
    return {
      prompt: `y is inversely proportional to x. When x = ${x1}, y = ${y1}. Find y when x = ${x2}.`,
      correct: String(y2),
      wrongs: pickDistinct(String(y2), [
        // Direct proportion: both quantities scaled the same way.
        direct,
        x2,
        y1 + x2,
        k,
        y2 + 1,
      ]),
      tags: ["inv-prop"],
      explanation: `Inverse proportion means xy never changes: k = ${x1} × ${y1} = ${k}. So when x = ${x2}, y = ${k} ÷ ${x2} = ${y2}. As x grew, y got ${y2 < y1 ? "smaller" : "larger"} — inverse relationships move in opposite directions, which ${direct} (the direct-proportion answer) gets wrong.`,
      difficulty: 0.58 + r.next() * 0.07,
    };
  },

  /** Bounds of a rounded measurement feeding an AREA: the bounds must be
   *  understood, not just quoted. */
  bounds: (r) => {
    const l = r.int(21, 89) / 10;
    const w = r.int(21, 89) / 10;
    const maxArea = (l + 0.05) * (w + 0.05);
    const correct = `${deepNum(maxArea, 4)} cm²`;
    return {
      prompt: `A rectangle measures ${deepNum(l, 1)} cm by ${deepNum(w, 1)} cm, each measured to the nearest 0.1 cm. What is the largest possible value of its area?`,
      correct,
      wrongs: pickDistinct(correct, [
        `${deepNum(l * w, 4)} cm²`,
        `${deepNum((l + 0.1) * (w + 0.1), 4)} cm²`,
        `${deepNum(2 * (l + 0.05) + 2 * (w + 0.05), 4)} cm²`,
        `${deepNum((l + 0.05) * (w - 0.05), 4)} cm²`,
        `${deepNum(l * w + 0.1, 4)} cm²`,
      ]),
      tags: ["round-half"],
      explanation: `To the nearest 0.1 cm, the true length is at most ${deepNum(l + 0.05, 2)} cm and the true width at most ${deepNum(w + 0.05, 2)} cm. The largest area uses BOTH upper bounds: ${deepNum(l + 0.05, 2)} × ${deepNum(w + 0.05, 2)} = ${deepNum(maxArea, 4)} cm². Using the measurements as written (${deepNum(l * w, 4)}) ignores the rounding altogether, and adding the whole 0.1 step assumes twice the real uncertainty.`,
      difficulty: 0.78 + r.next() * 0.06,
    };
  },

  /** Multiplying in standard form where the coefficient overflows 10 and the
   *  index must be rebalanced — the step that makes it multi-stage. */
  "standard-form": (r) => {
    const a = r.int(2, 9);
    const b = r.int(2, 9);
    const m = r.int(2, 6);
    const n = r.int(2, 6);
    const product = a * b;
    const correct = deepSci(product, m + n);
    return {
      prompt: `Work out (${a} × ${deepPow(m)}) × (${b} × ${deepPow(n)}). Give your answer in standard form.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The index raised one too far, or multiplied instead of added.
        deepSci(product, m + n + 1),
        deepSci(product, m * n),
        // Added indices but never rebalanced the coefficient: only wrong when
        // the product is at least 10, which is exactly when rebalancing bites.
        `${a * b} × ${deepPow(m + n)}`,
        deepSci(product, m + n - 1),
        deepSci(a + b, m + n),
      ]),
      tags: ["sf-sig"],
      explanation: `Multiply the coefficients and add the indices: ${a} × ${b} = ${product} and ${deepPow(m)} × ${deepPow(n)} = ${deepPow(m + n)}. That gives ${a * b} × ${deepPow(m + n)}, which is NOT standard form because ${product} is not between 1 and 10. One more step: rewrite the coefficient so it sits between 1 and 10 — ${product} = ${deepNum(product / 10, 1)} × 10, raising the index by one — so the answer is ${deepSci(product, m + n)}. Adding the indices rather than multiplying them (${deepPow(m * n)}) is the other common slip.`,
      difficulty: 0.6 + r.next() * 0.07,
    };
  },

  /** A frequency table: the answer is not in the question — it must be rebuilt
   *  from the table, and the table's whole reason for existing is the weights. */
  averages: (r) => {
    const base = r.int(4, 9);
    const values = [base, base + 1, base + 2, base + 3];
    const freqs = [r.int(2, 6), r.int(2, 6), r.int(2, 6), r.int(2, 6)];
    const totalN = freqs.reduce((s, f) => s + f, 0);
    const totalX = values.reduce((s, v, i) => s + v * freqs[i], 0);
    const mean = totalX / totalN;
    const correct = `${deepNum(mean, 2)} books`;
    return {
      prompt: `A survey recorded how many books ${totalN} students read last month:\n${values.map((v, i) => `${v} books: ${freqs[i]} students`).join("\n")}\nWhat is the mean number of books per student?`,
      correct,
      wrongs: pickDistinct(correct, [
        // The unweighted average of the four different values.
        `${deepNum(totalX / values.length, 2)} books`,
        `${values[3]} books`,
        `${deepNum(mean + 1, 2)} books`,
        `${deepNum(mean - 1, 2)} books`,
        `${totalN} books`,
      ]),
      tags: [],
      explanation: `A mean from a frequency table weights each value by how often it occurred: (${values.map((v, i) => `${v}×${freqs[i]}`).join(" + ")}) ÷ ${totalN} = ${totalX} ÷ ${totalN} = ${deepNum(mean, 2)} books. Averaging the four DIFFERENT values and ignoring their frequencies (${deepNum(totalX / values.length, 2)}) throws away the reason the table was given.`,
      difficulty: 0.76 + r.next() * 0.07,
    };
  },

  /** A survey table with the remainder missing: percentages are not counts, so
   *  the answer needs two conversions, and the "report the percentage" slip is
   *  the standard wrong answer. */
  "data-charts": (r) => {
    const total = r.pick([200, 400, 500, 800]);
    const aPct = r.pick([25, 30, 35, 40]);
    const bPct = r.pick([15, 20, 25]);
    const cPct = 100 - aPct - bPct;
    // Rounded, not left as a float: 0.55 × 800 is 440.00000000000006 in binary
    // floating point, and a count of people is a whole number anyway.
    const cCount = Math.round((cPct / 100) * total);
    const bCount = Math.round((bPct / 100) * total);
    const aCount = Math.round((aPct / 100) * total);
    const correct = String(cCount);
    return {
      prompt: `A survey of ${total} people recorded their preferred way to travel:\nbike: ${aPct}%\nbus: ${bPct}%\ntrain: the rest\nHow many people chose the train?`,
      correct,
      wrongs: pickDistinct(correct, [String(cPct), String(bCount), String(aCount), String(cCount + total / 100), String(total - cCount)]),
      tags: [],
      explanation: `The shares must add to 100, so the train share is 100 − ${aPct} − ${bPct} = ${cPct}%. A percentage is a share, not a count: ${cPct}% of ${total} is ${cPct}/100 × ${total} = ${cCount} people. Answering ${cPct} (or another group's count) is the slip this question exists to catch.`,
      difficulty: 0.76 + r.next() * 0.07,
    };
  },

  /** Read a line of best fit AND reason about what a correlation licenses: two
   *  separate steps, and the second is the one students skip. */
  "scatter-correlation": (r) => {
    if (r.next() < 0.5) {
      const x1 = 10;
      const y1 = r.int(40, 60);
      const x2 = 50;
      const y2 = y1 - r.int(21, 30);
      const slope = (y2 - y1) / (x2 - x1);
      const at = 30;
      const estimate = y1 + slope * (at - x1);
      const correct = `${deepNum(estimate, 1)} per day`;
      return {
        prompt: `A scatter graph plots 40 towns: average temperature (x °C) against hot-drink sales (y per day). The points slope downward, and a line of best fit passes through (${x1}, ${y1}) and (${x2}, ${y2}).\nUse the line to estimate hot-drink sales at ${at} °C.`,
        correct,
        wrongs: pickDistinct(correct, [
          // Read off at a point already given, instead of at the asked-for x.
          `${deepNum(y1, 1)} per day`,
          `${deepNum((y1 + y2) / 2, 1)} per day`,
          `${deepNum(y2, 1)} per day`,
          `${deepNum(estimate + 10, 1)} per day`,
          `${deepNum(estimate - 10, 1)} per day`,
        ]),
        tags: [],
        explanation: `The line's gradient is (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${deepNum(slope, 4)}, so each extra degree costs about ${deepNum(Math.abs(slope), 2)} sales. At ${at} °C: ${y1} + ${deepNum(slope, 4)} × (${at} − ${x1}) = ${deepNum(estimate, 1)} per day. Reading a value off at one of the given points ignores where ${at} °C actually sits on the line.`,
        difficulty: 0.78 + r.next() * 0.06,
      };
    }
    const pairs: Array<[string, string, string]> = [
      ["ice-cream sales", "drowning deaths", "the outside temperature"],
      ["shoe size", "reading ability in young children", "age"],
      ["number of firefighters at a fire", "damage caused by the fire", "the size of the fire"],
    ];
    const [a, b, third] = r.pick(pairs);
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    return {
      prompt: `A study finds a strong positive correlation between ${a} and ${b}. Which conclusion is justified?`,
      correct: `Only that the two move together — ${third} could plausibly be driving both`,
      wrongs: [
        `${cap(a)} cause ${b}`,
        `${cap(b)} cause ${a}`,
        "Nothing at all can be concluded from a correlation",
      ],
      tags: ["corr-cause"],
      explanation: `A correlation says two sets of numbers move together; it says nothing about mechanism. A third factor — ${third} — explains the pair without either causing the other, and only a controlled experiment separates cause from coincidence. That does not make the correlation worthless: it makes it a question worth investigating.`,
      difficulty: 0.8 + r.next() * 0.06,
    };
  },

  /** Probability from real counts, using the complement: the sum-to-1 rule has
   *  to be used rather than a stated probability read off. */
  "probability-basics": (r) => {
    const red = r.int(1, 3) * 2;
    const blue = r.int(1, 3) * 2;
    const green = r.int(1, 3) * 2;
    const total = red + blue + green;
    const correct = deepFrac(red + blue, total);
    return {
      prompt: `A bag holds ${red} red, ${blue} blue and ${green} green counters. One counter is taken at random. What is the probability that it is NOT green? Give your answer as a fraction in its simplest form.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The complement — the probability it IS green.
        deepFrac(green, total),
        // Green counted a second time in the numerator.
        deepFrac(red + green, total),
        deepFrac(blue + green, total),
        deepFrac(red, total),
        deepFrac(green, total - green),
      ]),
      tags: ["sum-one"],
      explanation: `Every outcome together has probability 1, so P(not green) = 1 − P(green) = 1 − ${deepFrac(green, total)} = ${deepFrac(red + blue, total)}. The answer ${deepFrac(red + green, total)} counts the green counters a second time in the numerator — the double-counting that breaks the sum-to-1 rule.`,
      difficulty: 0.58 + r.next() * 0.07,
    };
  },

  /** Compound growth where the rate and the period must be applied together:
   *  the simple-interest answer is always on offer, because that is the belief. */
  "growth-decay": (r) => {
    const P = r.pick([800, 1200, 1500, 2400, 3000]);
    const rate = r.pick([2, 3, 4, 5]);
    const years = r.int(2, 4);
    const amount = P * Math.pow(1 + rate / 100, years);
    return {
      prompt: `${deepMoney(P)} is invested at ${rate}% compound interest per year. What is the value after ${years} years?`,
      correct: deepMoney(amount),
      wrongs: [
        // Simple interest: the same amount added every year.
        deepMoney(P * (1 + (rate * years) / 100)),
        // Interest applied to the original only for the extra years.
        deepMoney(P + P * (rate / 100) * (years + 1)),
        deepMoney(P * Math.pow(1 + rate / 100, years - 1)),
      ],
      tags: ["simple-cp"],
      explanation: `Compound interest earns interest on interest, so the multiplier is applied once per year: ${deepMoney(P)} × ${deepNum(1 + rate / 100, 2)}^${years} = ${deepMoney(amount)}. ${deepMoney(P * (1 + (rate * years) / 100))} is the SIMPLE interest total — it adds ${rate}% of the original each year and never lets the interest itself earn anything. The word "compound" is the whole difference.`,
      difficulty: 0.58 + r.next() * 0.07,
    };
  },

  /** Volume under a scale factor: volume scales by k³, and the answer still has
   *  to be converted between units — three stages, not one. */
  volume: (r) => {
    const k = r.pick([2, 3, 4, 5, 10]);
    const modelVol = r.int(2, 9) * 8;
    const realVolCm3 = modelVol * k * k * k;
    const realLitres = realVolCm3 / 1000;
    return {
      prompt: `A model of a machine is built to a scale of 1 : ${k}. The model's volume is ${modelVol} cm³. What is the volume of the real machine, in litres? (1 litre = 1000 cm³)`,
      correct: `${deepNum(realLitres, 4)} litres`,
      wrongs: [
        // Length scaling instead of volume scaling.
        `${deepNum((modelVol * k) / 1000, 4)} litres`,
        // The area factor applied to a volume.
        `${deepNum((modelVol * k * k) / 1000, 4)} litres`,
        // The model's own volume, unit unchanged.
        `${deepNum(modelVol / 1000, 4)} litres`,
      ],
      tags: ["unit-sq"],
      explanation: `Lengths scale by ${k}, so VOLUMES scale by ${k}³ = ${k * k * k}: ${modelVol} × ${k * k * k} = ${realVolCm3} cm³. The question asks in litres, so the unit changes too: ${realVolCm3} ÷ 1000 = ${deepNum(realLitres, 4)} litres. Scaling by ${k} (a length factor) or ${k * k} (an area factor) leaves the volume short by a factor of ${k * k} or ${k}, and stopping at cm³ answers a question nobody asked.`,
      difficulty: 0.78 + r.next() * 0.06,
    };
  },

  /** A compound shape: the region is not a rectangle, so it must be split
   *  before anything can be multiplied. */
  "area-perimeter": (r) => {
    const a = r.int(6, 14);
    const b = r.int(4, 9);
    const cut = r.int(1, Math.min(3, b - 1));
    const width = r.int(2, Math.min(5, a - 2));
    const area = a * b - cut * width;
    const correct = `${area} m²`;
    return {
      prompt: `An L-shaped room is a ${a} m by ${b} m rectangle with a ${cut} m by ${width} m corner removed. What is the area of the floor?`,
      correct,
      wrongs: pickDistinct(correct, [
        // Counted the missing corner as floor.
        `${a * b} m²`,
        `${area + cut * width} m²`,
        // The perimeter of the full rectangle — an answer in m, not m².
        `${2 * (a + b)} m²`,
        `${a * b + cut * width} m²`,
        `${area - cut * width} m²`,
      ]),
      tags: ["unit-sq"],
      explanation: `Split the L-shape into the full ${a} × ${b} rectangle minus the ${cut} × ${width} corner: ${a * b} − ${cut * width} = ${area} m². ${a * b} m² counts the missing corner as floor, and ${2 * (a + b)} is the PERIMETER of the rectangle — an answer in m, not m², which cannot be an area at all.`,
      difficulty: 0.76 + r.next() * 0.07,
    };
  },

  // ── ALGEBRA ───────────────────────────────────────────────────────────────

  /** Unknowns on both sides AND a bracket: expand, collect, then divide, with
   *  the balance kept at every line. */
  "linear-equations": (r) => {
    const x = r.int(2, 12);
    const a = r.int(2, 5);
    const b = r.int(1, 7);
    const c = r.int(1, a - 1);
    const d = a * x - a * b - c * x;
    // Rendered sign-explicit: `${d}` alone turns a negative constant into
    // "+ -5", which is not how an equation is written on a page.
    const rhs = d < 0 ? `− ${Math.abs(d)}` : `+ ${d}`;
    return {
      prompt: `Solve ${a}(x − ${b}) = ${c === 1 ? "" : c}x ${rhs}.`,
      correct: `x = ${x}`,
      wrongs: [`x = ${x + 1}`, `x = ${x - 1}`, `x = ${2 * x}`],
      tags: ["bal-slip"],
      explanation: `Expand the bracket first: ${a}x − ${a * b} = ${c === 1 ? "" : c}x ${rhs}. Collect the x-terms on both sides — subtracting ${c}x and adding ${a * b} to BOTH sides — gives ${a - c}x = ${d + a * b}, so x = ${d + a * b} ÷ ${a - c} = ${x}. Doing any of that to one side only is the balance error: an equation is a scale, so every move happens twice.`,
      difficulty: 0.58 + r.next() * 0.08,
    };
  },

  /** Two equations where elimination needs scaling first, and the answer has to
   *  survive a decision about which letter to eliminate. */
  simultaneous: (r) => {
    const x = r.int(2, 7);
    const y = x + r.int(1, 5);
    const a1 = r.int(1, 3);
    const b1 = r.int(1, 3);
    const a2 = r.int(1, 3);
    const b2 = r.int(1, 3);
    const r1 = a1 * x + b1 * y;
    const r2 = a2 * x - b2 * y;
    // A coefficient of 1 is not written: "1x + 3y" reads as a print-out, and
    // the equation it is supposed to be is x + 3y.
    const cx = (n: number) => (n === 1 ? "" : String(n));
    return {
      prompt: `Solve the simultaneous equations:\n${cx(a1)}x + ${cx(b1)}y = ${r1}\n${cx(a2)}x − ${cx(b2)}y = ${r2}\nWhat is the value of x?`,
      correct: `x = ${x}`,
      wrongs: pickDistinct(`x = ${x}`, [
        // The other letter: reading off the wrong unknown.
        `x = ${y}`,
        // Eliminating by adding the equations as written.
        `x = ${deepNum((r1 + r2) / (a1 + a2), 2)}`,
        // The scaling slip: the first equation's y coefficient left alone.
        `x = ${deepNum((r1 + b2 * y) / a1, 2)}`,
        `x = ${deepNum(r1 / a1, 2)}`,
        `x = ${x + 1}`,
      ]),
      tags: ["sub-sign"],
      explanation: `The coefficients do not match, so SCALE before eliminating: the y-terms are +${b1}y and −${b2}y. Multiplying the first equation by ${b2} and the second by ${b1} makes them ${b1 * b2}y and −${b1 * b2}y, which cancel when the equations are added, leaving x = ${x}. Then back-substitute to get y = ${y}, writing the substitution out — a sign lost there is the most common way this question is failed after the hard part is already done.`,
      difficulty: 0.58 + r.next() * 0.08,
    };
  },

  /** A quadratic read off a graph: both roots must be reported, and the
   *  factorisation has to be reconstructed from the coefficients. */
  quadratics: (r) => {
    let p = r.nz(-6, 6);
    let q = r.nz(-6, 6);
    if (q === p) q = p > 0 ? p - 1 : p + 1;
    const b = -(p + q);
    const c = p * q;
    const lo = Math.min(p, q);
    const hi = Math.max(p, q);
    const correct = `x = ${lo} and x = ${hi}`;
    return {
      prompt: `The graph of y = x² ${b < 0 ? "−" : "+"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} crosses the x-axis at two points. What are the x-coordinates of those points?`,
      correct,
      wrongs: pickDistinct(correct, [
        // Both signs flipped: the "(x + p)" reading of a negative root. This is
        // the same pair as the answer for a symmetric quadratic, so it cannot be
        // assumed distinct.
        `x = ${Math.min(-p, -q)} and x = ${Math.max(-p, -q)}`,
        // The coefficients mistaken for the roots.
        `x = ${b} and x = ${c}`,
        // Only one root reported — the lost root, in the shape the belief takes.
        `x = ${hi} only`,
        `x = ${lo} only`,
        `x = ${lo} and x = ${hi + 1}`,
      ]),
      tags: ["lost-root"],
      explanation: `The crossings are where y = 0, so solve x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} = 0 by factorising: two numbers that multiply to ${c} and add to ${b} are ${p} and ${q}, giving (x ${-p < 0 ? "−" : "+"} ${Math.abs(p)})(x ${-q < 0 ? "−" : "+"} ${Math.abs(q)}) = 0. A product is zero when either factor is zero, so x = ${lo} OR x = ${hi} — reporting one root throws away half the answer.`,
      difficulty: 0.58 + r.next() * 0.08,
    };
  },

  /** Area given as a quadratic, width given as a factor: the other factor is
   *  the length, so the constant must SPLIT into the two numbers that add to
   *  the coefficient of x. */
  "algebra-expand": (r) => {
    const p = r.int(2, 6);
    let q = r.int(2, 6);
    if (q === p) q = p + 1;
    const sum = p + q;
    const product = p * q;
    return {
      prompt: `The area of a rectangle is (x² + ${sum}x + ${product}) cm² and its width is (x + ${p}) cm. What is its length, in terms of x?`,
      correct: `(x + ${q}) cm`,
      wrongs: [`(x + ${p}) cm`, `(x + ${sum}) cm`, `(x + ${product}) cm`],
      tags: ["sign-slip"],
      explanation: `Area = width × length, so length = area ÷ width. Factorise first: x² + ${sum}x + ${product} = (x + ${p})(x + ${q}), because ${p} × ${q} = ${product} and ${p} + ${q} = ${sum}. Dividing by the width (x + ${p}) leaves (x + ${q}) cm. The two numbers must MULTIPLY to the constant and ADD to the coefficient of x — a sign slip breaks one of those conditions, and the wrong factors are what the distractors are made of.`,
      difficulty: 0.58 + r.next() * 0.07,
    };
  },

  // ── GEOMETRY ──────────────────────────────────────────────────────────────

  /** Distance between two grid points: Pythagoras hidden inside a coordinate
   *  question, so the right triangle has to be built before it can be used. */
  pythagoras: (r) => {
    const triples: Array<[number, number, number]> = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15], [7, 24, 25]];
    const [dx, dy, hyp] = r.pick(triples);
    const x1 = r.int(1, 8);
    const y1 = r.int(1, 8);
    return {
      prompt: `On a coordinate grid, point A is (${x1}, ${y1}) and point B is (${x1 + dx}, ${y1 + dy}). What is the exact distance AB?`,
      correct: String(hyp),
      wrongs: [String(dx + dy), String(dx * dy), String(dy - dx > 0 ? dy - dx : dx - dy)],
      tags: ["hyp-leg"],
      explanation: `The horizontal gap is ${dx} and the vertical gap is ${dy}, so AB is the hypotenuse of a right triangle with those legs: AB = √(${dx}² + ${dy}²) = √${dx * dx + dy * dy} = ${hyp}. Adding the two gaps (${dx + dy}) is the distance you walk along the grid, which is always longer than the straight line — and squaring the wrong side is what the other distractors model.`,
      difficulty: 0.58 + r.next() * 0.08,
    };
  },

  /** The ladder problem: the wrong ratio gives a clean-looking wrong answer, so
   *  choosing the ratio — and knowing which side is the hypotenuse — is the
   *  actual test. */
  "trig-ratios": (r) => {
    const L = r.pick([6, 8, 10, 12, 14]);
    const angle = r.pick([30, 60]);
    const rad = (angle * Math.PI) / 180;
    const height = L * Math.sin(rad);
    const along = L * Math.cos(rad);
    const tangent = L * Math.tan(rad);
    const correct = `${deepNum(height, 2)} m`;
    return {
      prompt: `A ladder ${L} m long leans against a vertical wall, making an angle of ${angle}° with the horizontal ground. How far up the wall does the ladder reach? Give your answer to 2 decimal places.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The cosine answer: how far the foot is from the wall.
        `${deepNum(along, 2)} m`,
        // The ladder treated as adjacent rather than hypotenuse.
        `${deepNum(tangent, 2)} m`,
        `${deepNum(L / Math.tan(rad), 2)} m`,
        `${deepNum(L, 2)} m`,
      ]),
      tags: ["deg-rad", "hyp-leg-trig"],
      explanation: `The ladder is the HYPOTENUSE, and the height up the wall is opposite the ${angle}° angle, so use sine: sin ${angle}° = height ÷ ${L}, giving ${deepNum(Math.sin(rad), 4)} × ${L} = ${deepNum(height, 2)} m. ${deepNum(along, 2)} m is the cosine answer — how far the foot is from the wall — which is the slip that comes from mislabelling which side is opposite, and ${deepNum(tangent, 2)} m treats the ladder as the adjacent side instead of the hypotenuse.`,
      difficulty: 0.58 + r.next() * 0.08,
    };
  },

  /** A gradient read out of a real story, then used at a future point: two
   *  steps, and the intercept is where most of the marks are lost. */
  "straight-lines": (r) => {
    const start = r.int(20, 60);
    const rate = r.int(2, 8);
    const t = r.int(5, 15);
    const correct = `${start + rate * t} litres`;
    return {
      prompt: `A water tank holds ${start} litres. Water is added at a steady ${rate} litres per minute. A graph of volume (y litres) against time (x minutes) is a straight line. How much water is in the tank after ${t} minutes?`,
      correct,
      wrongs: pickDistinct(correct, [
        // The water ADDED, with the intercept dropped.
        `${rate * t} litres`,
        `${start * rate} litres`,
        `${start + rate} litres`,
        `${start * rate + t} litres`,
        `${start + rate * t + rate} litres`,
      ]),
      tags: ["grad-run"],
      explanation: `The line is y = ${rate}x + ${start}: the gradient ${rate} is the change per minute and ${start} is the volume at x = 0, the intercept. After ${t} minutes: ${rate} × ${t} + ${start} = ${start + rate * t} litres. Answering ${rate * t} reports the water ADDED rather than the water in the tank — the intercept dropped because it was never written down.`,
      difficulty: 0.58 + r.next() * 0.07,
    };
  },

  /** A sector: a fraction of the whole circle, with the area formula as the
   *  always-available distractor and the double-counted fraction behind it. */
  "circle-area-arc": (r) => {
    const radius = r.int(6, 15);
    const angle = r.pick([60, 90, 120, 240]);
    const arc = (angle / 360) * 2 * Math.PI * radius;
    const correct = `${deepNum(arc, 2)} cm`;
    return {
      prompt: `A sector of a circle of radius ${radius} cm has an angle of ${angle}° at the centre. What is the length of its arc? Give your answer to 2 decimal places.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The sector's AREA — the same fraction applied to πr².
        `${deepNum((angle / 360) * Math.PI * radius * radius, 2)} cm`,
        // The whole circumference: the fraction forgotten.
        `${deepNum(2 * Math.PI * radius, 2)} cm`,
        // The fraction applied to the RADIUS rather than to the circle.
        `${deepNum((angle / 360) * 2 * Math.PI * (radius + 1), 2)} cm`,
        `${deepNum(((angle + 60) / 360) * 2 * Math.PI * radius, 2)} cm`,
      ]),
      tags: [],
      explanation: `An arc is that fraction of the full circumference: (${angle}/360) × 2π × ${radius} = ${deepNum(arc, 2)} cm. The first distractor is the sector's AREA (the same fraction of πr²) and the second is the whole circumference — forgetting the fraction. Using ${angle}/180 double-counts the fraction, because 2πr already carries the full 360°.`,
      difficulty: 0.58 + r.next() * 0.07,
    };
  },

  // ── SEQUENCES, DATA AND MODELLING ─────────────────────────────────────────

  /** A quadratic sequence: the constant second difference is the fact that
   *  unlocks the n² term, and the nth term must be checked against n = 1. */
  sequences: (r) => {
    const a = r.int(1, 3);
    const b = r.int(1, 4);
    const c = r.int(1, 6);
    const T = (n: number) => a * n * n + b * n + c;
    const terms = [T(1), T(2), T(3), T(4)];
    const d1 = terms[1] - terms[0];
    const d2 = terms[2] - terms[1];
    const second = d2 - d1;
    const lead = a === 1 ? "" : String(a);
    const correct = `${lead}n² + ${b}n + ${c}`;
    // The linear rule through the first two terms, rendered sign-correct:
    // `${terms[0] - d1}` alone produces "n + -1" for a decreasing start.
    const lin = terms[0] - d1;
    const linStr = `${d1}n ${lin < 0 ? `− ${Math.abs(lin)}` : `+ ${lin}`}`;
    return {
      prompt: `A sequence begins ${terms.join(", ")} and its second differences are constant. What is the nth term?`,
      correct,
      wrongs: pickDistinct(correct, [
        // The n² term found but the linear correction left out.
        `${lead}n² + ${c}`,
        linStr,
        `${a + 1}n² + ${b}n + ${c}`,
        `n² + ${b}n + ${c}`,
        `${a}n² + ${b + 1}n + ${c}`,
      ]),
      tags: ["nth-term"],
      explanation: `First differences: ${d1}, ${d2}, ${terms[3] - terms[2]}. They are not constant, but they change by a constant ${second}, so the sequence is quadratic and 2a = ${second}, giving a = ${a}. Subtracting ${lead || "1"}n² from each term leaves the LINEAR sequence ${b}n + ${c}. Check with n = 1: ${lead || "1"} + ${b} + ${c} = ${terms[0]} ✓. A linear nth term (${d1}n + ${terms[0] - d1}) fits the first two terms and then walks away from the sequence.`,
      difficulty: 0.58 + r.next() * 0.08,
    };
  },

  /** Compound growth followed by a proportional fee: the multipliers must be
   *  applied in order, and subtracting two percentages is the classic error. */
  "financial-maths": (r) => {
    const P = r.pick([400, 600, 800, 1250]);
    const r1 = r.pick([3, 4, 5]);
    const r2 = r.pick([2, 3, 6]);
    const years = r.int(2, 4);
    const grown = P * Math.pow(1 + r1 / 100, years);
    const final_ = grown * Math.pow(1 - r2 / 100, 2);
    return {
      prompt: `${deepMoney(P)} is invested at ${r1}% compound interest per year for ${years} years. A management fee then takes ${r2}% of the balance at the end of each of the next 2 years. What is the balance then?`,
      correct: deepMoney(final_),
      wrongs: [
        // The balance before the fee.
        deepMoney(grown),
        // The rates subtracted and treated as one rate.
        deepMoney(P * Math.pow(1 + (r1 - r2) / 100, years + 2)),
        // The fee applied once instead of twice.
        deepMoney(grown * (1 - r2 / 100)),
      ],
      tags: ["simple-cp"],
      explanation: `Apply each change as a multiplier, in order: growth is ×${deepNum(1 + r1 / 100, 2)} each year for ${years} years, then ×${deepNum(1 - r2 / 100, 2)} twice for the two fee years. ${deepMoney(grown)} is the balance BEFORE the fees, and ${deepMoney(P * Math.pow(1 + (r1 - r2) / 100, years + 2))} comes from subtracting ${r2}% from ${r1}% — percentages of different amounts are not additive, so they cannot be combined into one rate.`,
      difficulty: 0.78 + r.next() * 0.06,
    };
  },

  /** Two rows of a proportional data table, used to answer about a third
   *  quantity: the constant has to be RECOGNISED from the data. */
  "proportional-graphs": (r) => {
    const k = r.int(3, 9);
    const x1 = r.int(2, 5);
    const x2 = x1 + r.int(1, 4);
    const total = x1 + x2;
    const correct = `${total * k} miles`;
    return {
      prompt: `A car travels at a constant speed. Its journey is recorded below:\n${x1} hours → ${x1 * k} miles\n${x2} hours → ${x2 * k} miles\nHow far does it travel in ${total} hours?`,
      correct,
      wrongs: pickDistinct(correct, [
        // The rate read as one mile per hour more than it is.
        `${total * (k + 1)} miles`,
        `${total * k + k} miles`,
        `${total * k - k} miles`,
        // The two given distances treated as the answer for the summed time.
        `${x2 * k} miles`,
        `${x2 * k + x2} miles`,
      ]),
      tags: [],
      explanation: `Both rows give the same ratio: ${x1 * k} ÷ ${x1} = ${k} and ${x2 * k} ÷ ${x2} = ${k} miles per hour. At a constant speed the distance is proportional to the time, so ${total} hours gives ${total} × ${k} = ${total * k} miles. The first distractor makes the mistake of treating "for ${total} hours" as "add the two distances already given".`,
      difficulty: 0.78 + r.next() * 0.06,
    };
  },

  // ── PHYSICS ───────────────────────────────────────────────────────────────
  //
  // The physics bank was honest and single-item: one carefully written question
  // per concept — several of them purely conceptual ("which rule…") — and
  // nothing a learner could be served twice. A fine assessment item, a poor
  // practice bank. Practice needs a RANGE to move through, and the adaptive
  // serve can only aim at a band the content actually reaches: a physics tier
  // of 0.45 with a stretch aim of 0.67 had no item to aim at, so every "harder"
  // serve fell back to the same 0.45 draw. These families give each concept its
  // range — reasoning at application, arithmetic chains at multi-step, and
  // table readings at the data band — without touching the base item that was
  // already good (withDepth composes; it does not replace). Every tags[] entry
  // is a belief the concept already declares, which the sweep enforces.

  /** Resultant forces: terminal velocity reasoning, push-against-friction
   *  arithmetic, an F = ma chain, and a force table to read. */
  "forces-basics": (r) => {
    const variant = r.next();
    if (variant < 0.28) {
      return {
        prompt: "A skydiver is falling at terminal velocity. Which statement about the forces on them is true?",
        correct: "Weight and air resistance are equal and opposite, so the resultant force is zero",
        wrongs: pickDistinct("", [
          "Air resistance is greater than their weight",
          "The resultant force points downward because they are still falling",
          "No forces act on them once the speed has become steady",
        ]),
        tags: ["bal-motion"],
        explanation: "Terminal velocity is the speed at which air resistance has grown to equal the weight. Equal and opposite forces cancel, so the resultant is zero — and constant velocity with a zero resultant is exactly Newton's first law. 'Still falling' is not a force: the skydiver keeps moving at a steady speed because nothing is left unbalanced to slow them down or speed them up.",
        difficulty: 0.45,
      };
    }
    if (variant < 0.5) {
      const push = r.pick([160, 200, 240, 300, 360]);
      const friction = r.pick([20, 30, 40, 50, 60]);
      const correct = `${push - friction} N`;
      return {
        prompt: `A crate is pushed forward with ${push} N while friction acts backward on it with ${friction} N. What is the resultant force (N, forward)?`,
        correct,
        wrongs: pickDistinct(correct, [`${push + friction} N`, `${push} N`, `${friction} N`, `${push - friction * 2} N`]),
        tags: ["bal-motion"],
        explanation: `The two forces are opposite, so they partly cancel: ${push} − ${friction} = ${push - friction} N forward. Adding them (${push + friction} N) treats a backward force as if it helped — the size of the push alone (${push} N) is the force applied, not the resultant, and the friction is what the resultant has to overcome, not the answer.
          `,
        difficulty: 0.38,
      };
    }
    if (variant < 0.75) {
      const m = r.pick([20, 40, 50]);
      const k = r.int(2, 4);
      const friction = r.pick([40, 60, 100]);
      const push = m * k + friction;
      const correct = `${k} m/s²`;
      return {
        prompt: `A crate of mass ${m} kg is pushed with a force of ${push} N. Friction opposes the motion with ${friction} N. What is the crate's acceleration (m/s²)?`,
        correct,
        wrongs: pickDistinct(correct, [
          `${deepNum(push / m, 2)} m/s²`,
          `${deepNum((push + friction) / m, 2)} m/s²`,
          `${deepNum(friction / m, 2)} m/s²`,
        ]),
        tags: ["bal-motion"],
        explanation: `First find the resultant: ${push} − ${friction} = ${push - friction} N. Then F = ma gives a = F ÷ m = ${push - friction} ÷ ${m} = ${k} m/s². Dividing the push by the mass (${deepNum(push / m, 2)}) forgets that friction is working against the push; dividing the FRICTION by the mass divides the wrong force entirely.`,
        difficulty: 0.62,
      };
    }
    const f1 = r.pick([120, 140, 160, 180]);
    const f2 = r.pick([40, 60, 80]);
    const b1 = r.pick([30, 50, 70, 90]);
    const b2 = r.pick([10, 20, 40, 50]);
    const correct = `${f1 + f2 - b1 - b2} N`;
    return {
      prompt: `The table records the horizontal forces acting on a cyclist:\nforward ${f1} N\nforward ${f2} N\nbackward ${b1} N\nbackward ${b2} N\nWhat is the resultant forward force (N)?`,
      correct,
      wrongs: pickDistinct(correct, [
        `${f1 + f2 + b1 + b2} N`,
        `${f1 + f2} N`,
        `${b1 + b2} N`,
      ]),
      tags: ["bal-motion"],
      explanation: `Add the forces acting the same way, then subtract the ones opposing: (${f1} + ${f2}) − (${b1} + ${b2}) = ${f1 + f2} − ${b1 + b2} = ${f1 + f2 - b1 - b2} N forward. Adding all four (${f1 + f2 + b1 + b2}) counts friction as if it pushed the cyclist along — the most common error with a force table.
        `,
      difficulty: 0.76 + r.next() * 0.06,
    };
  },

  /** Reading motion: the area under a velocity–time line, a deceleration
   *  calculated from two readings, a distance–time table, and a journey with a
   *  stationary stage. */
  "motion-graphs": (r) => {
    const variant = r.next();
    if (variant < 0.3) {
      const v = r.pick([8, 12, 15, 20]);
      const t = r.pick([5, 8, 10]);
      const correct = `${v * t} m`;
      return {
        prompt: `A car's velocity–time graph is a horizontal line at ${v} m/s for ${t} s. How far does it travel (m)?`,
        correct,
        wrongs: pickDistinct(correct, [`${(v * t) / 2} m`, `${v + t} m`, `${v} m`]),
        tags: ["dt-vt"],
        explanation: `On a velocity–time graph the AREA under the line is the distance. A horizontal line makes a rectangle: ${v} × ${t} = ${v * t} m. Halving it (${(v * t) / 2} m) is the triangle-area rule that belongs to a graph rising from zero; adding the two numbers (${v + t}) treats the axes as if they were the same quantity.
          `,
        difficulty: 0.52,
      };
    }
    if (variant < 0.55) {
      const end = r.pick([10, 15, 20]);
      const t = r.pick([2, 4, 5]);
      const k = r.int(2, 5);
      const start = end + t * k;
      const correct = `−${k} m/s²`;
      return {
        prompt: `A car slows from ${start} m/s to ${end} m/s in ${t} s. What is its acceleration (m/s²)?`,
        correct,
        wrongs: pickDistinct(correct, [`+${k} m/s²`, `${start - end} m/s²`, `−${deepNum(start / t, 2)} m/s²`]),
        tags: ["dt-vt"],
        explanation: `Acceleration is the CHANGE in velocity per second: (${end} − ${start}) ÷ ${t} = −${start - end} ÷ ${t} = −${k} m/s². The minus sign is information, not decoration — the car is slowing, so the acceleration opposes the motion. ${start - end} m/s² is the total change, not the rate of change.
          `,
        difficulty: 0.6,
      };
    }
    if (variant < 0.78) {
      const s = r.pick([3, 4, 5]);
      const rows = [2, 4, 6].map((t) => `${t} s → ${t * s} m`).join("\n");
      const correct = `${s} m/s`;
      return {
        prompt: `A trolley's distance–time results:\n${rows}\nWhat is its speed (m/s)?`,
        correct,
        wrongs: pickDistinct(correct, [`${s * 6} m/s`, `${deepNum(1 / s, 2)} m/s`, `${s * 2} m/s`]),
        tags: ["dt-vt"],
        explanation: `Speed is distance divided by time, and every row gives the same ratio: 2 s → ${2 * s} m gives ${s} m/s, and so do the others. A constant speed means the graph is a straight line, so ANY row gives the answer — ${s * 6} m/s is the total distance from the last row, a distance being read where a speed was asked for.
          `,
        difficulty: 0.72,
      };
    }
    const t1 = r.pick([4, 6, 8]);
    const v1 = r.pick([4, 5, 6]);
    const t2 = r.pick([2, 3, 4]);
    const t3 = r.pick([3, 4, 5]);
    const v3 = r.pick([6, 8, 10]);
    const correct = `${v1 * t1 + v3 * t3} m`;
    return {
      prompt: `A delivery van's velocity–time graph has three parts:\n${t1} s at a steady ${v1} m/s\n${t2} s stationary\n${t3} s at a steady ${v3} m/s\nHow far does it travel altogether (m)?`,
      correct,
      wrongs: pickDistinct(correct, [
        `${v1 * t1 + v3 * t3 + v3 * t2} m`,
        `${v1 * t1} m`,
        `${v3 * t3} m`,
      ]),
      tags: ["dt-vt"],
      explanation: `Distance is the area under each stage of the graph: ${v1} × ${t1} = ${v1 * t1} m while moving, 0 m while stationary, then ${v3} × ${t3} = ${v3 * t3} m. Total ${v1 * t1 + v3 * t3} m. A stationary van is still moving through TIME but not through distance — counting that stage as ${v3} m/s adds distance that was never travelled.
        `,
      difficulty: 0.78,
    };
  },

  /** Newton's second law: F ÷ m, weight as a force, a driving-force chain, and
   *  the same force applied to a heavier trolley. */
  "newton-laws": (r) => {
    const variant = r.next();
    if (variant < 0.3) {
      const m = r.pick([2, 4, 5]);
      const a = r.int(2, 9);
      const F = m * a;
      const correct = `${a} m/s²`;
      return {
        prompt: `A resultant force of ${F} N acts on a mass of ${m} kg. What is the acceleration (m/s²)?`,
        correct,
        wrongs: pickDistinct(correct, [`${F} m/s²`, `${deepNum(m / F, 2)} m/s²`, `${F - m} m/s²`]),
        tags: ["fma-v"],
        explanation: `F = ma rearranged gives a = F ÷ m = ${F} ÷ ${m} = ${a} m/s². ${F} m/s² is the force copied into the answer; ${deepNum(m / F, 2)} is the division done the wrong way round (mass ÷ force), which is why checking the units matters — N ÷ kg is m/s², kg ÷ N is not.
          `,
        difficulty: 0.45,
      };
    }
    if (variant < 0.5) {
      const m = r.pick([10, 20, 50, 70]);
      const correct = `${deepNum(9.8 * m, 2)} N`;
      return {
        prompt: `A student has a mass of ${m} kg. Taking g = 9.8 N/kg, what is their weight (N)?`,
        correct,
        wrongs: pickDistinct(correct, [`${m} N`, `${deepNum(m / 9.8, 2)} N`, `${m * 10} N`]),
        tags: ["fma-v"],
        explanation: `Weight is the FORCE of gravity: W = mg = ${m} × 9.8 = ${deepNum(9.8 * m, 2)} N. The mass in kilograms (${m}) is not a force — it is the same everywhere, while weight changes with g. Multiplying by 10 is the rough approximation used for mental arithmetic, not the answer when g = 9.8 is given.
          `,
        difficulty: 0.42,
      };
    }
    if (variant < 0.78) {
      const m = r.pick([800, 1200, 1500]);
      const a = r.pick([1.5, 2, 2.5]);
      const resistance = r.pick([400, 600, 800]);
      const correct = `${deepNum(m * a + resistance, 2)} N`;
      return {
        prompt: `A car of mass ${m} kg accelerates at ${a} m/s² while a resistance force of ${resistance} N acts on it. What driving force is needed (N)?`,
        correct,
        wrongs: pickDistinct(correct, [
          `${deepNum(m * a, 2)} N`,
          `${resistance} N`,
          `${deepNum(m * a - resistance, 2)} N`,
        ]),
        tags: ["fma-v"],
        explanation: `The driving force has two jobs: accelerating the car (F = ma = ${m} × ${a} = ${deepNum(m * a, 2)} N) and overcoming resistance (${resistance} N). So the total is ${deepNum(m * a + resistance, 2)} N. Leaving out the resistance (${deepNum(m * a, 2)} N) would mean the car accelerates while the resistance does nothing — subtracting it instead means the resistance is helping.
          `,
        difficulty: 0.66,
      };
    }
    // A force found from one experiment, then applied to a heavier trolley:
    // two steps, and the mass that matters is the NEW one.
    const combos: Array<[number, number, number]> = [[2, 6, 1], [3, 4, 1], [4, 3, 2], [2, 8, 2]];
    const [m, a, extra] = r.pick(combos);
    const F = m * a;
    const newMass = m + extra;
    const correct = `${deepNum(F / newMass, 2)} m/s²`;
    return {
      prompt: `A trolley of mass ${m} kg accelerates at ${a} m/s². Extra masses are loaded on so the trolley now has a mass of ${newMass} kg, and the same force is applied. What is the new acceleration (m/s²)?`,
      correct,
      wrongs: pickDistinct(correct, [`${a} m/s²`, `${newMass} m/s²`, `${deepNum(F / newMass * 2, 2)} m/s²`]),
      tags: ["fma-v"],
      explanation: `From the first run, F = ma = ${m} × ${a} = ${F} N. The force is unchanged, so in the second run a = F ÷ m = ${F} ÷ ${newMass} = ${deepNum(F / newMass, 2)} m/s². The old acceleration (${a} m/s²) is the one that MUST change when the mass does — more mass with the same force means less acceleration.
        `,
      difficulty: 0.72,
    };
  },

  /** Conservation of momentum: a collision, a recoil, an impulse force, and a
   *  rebound where the change of momentum is the point. */
  "momentum": (r) => {
    const variant = r.next();
    if (variant < 0.3) {
      const combos: Array<[number, number, number]> = [[2, 6, 4], [3, 4, 1], [2, 3, 1], [4, 2, 4]];
      const [m1, v1, m2] = r.pick(combos);
      const v = (m1 * v1) / (m1 + m2);
      const correct = `${deepNum(v, 2)} m/s`;
      return {
        prompt: `A ${m1} kg trolley travelling at ${v1} m/s collides with a stationary ${m2} kg trolley. They stick together. What is their common velocity (m/s)?`,
        correct,
        wrongs: pickDistinct(correct, [`${v1} m/s`, `${deepNum((m1 * v1) / m2, 2)} m/s`, `${deepNum(v1 / 2, 2)} m/s`]),
        tags: ["con-pair"],
        explanation: `Momentum before = ${m1} × ${v1} = ${m1 * v1} kg m/s, and there is none in the stationary trolley. Afterwards the combined mass ${m1 + m2} kg carries it: ${m1 + m2} × v = ${m1 * v1}, so v = ${deepNum(v, 2)} m/s. The velocity must DROP when mass is added at constant momentum — keeping ${v1} m/s invents momentum out of nothing.
          `,
        difficulty: 0.5,
      };
    }
    if (variant < 0.55) {
      const gun = r.pick([2, 4, 5]);
      const bullet = r.pick([0.01, 0.02]);
      const speed = r.pick([300, 400, 500]);
      const p = bullet * speed;
      const correct = `${deepNum(p / gun, 2)} m/s`;
      return {
        prompt: `A ${gun} kg rifle fires a ${bullet} kg bullet at ${speed} m/s. What is the rifle's recoil speed (m/s)?`,
        correct,
        wrongs: pickDistinct(correct, [`${deepNum(p, 2)} m/s`, `${speed} m/s`, `${deepNum(speed / gun, 2)} m/s`]),
        tags: ["con-pair"],
        explanation: `Total momentum was zero, so it stays zero: bullet momentum ${bullet} × ${speed} = ${deepNum(p, 2)} kg m/s backwards must be matched by the rifle going forwards at the same momentum. ${gun} × v = ${deepNum(p, 2)}, so v = ${deepNum(p / gun, 2)} m/s. Tiny mass × huge speed can equal big mass × tiny speed — the SPEEDS differ enormously, the momenta do not.
          `,
        difficulty: 0.6,
      };
    }
    if (variant < 0.8) {
      const m = r.pick([0.2, 0.4, 0.5]);
      const dv = r.pick([4, 5, 10]);
      const t = r.pick([0.02, 0.04, 0.5]);
      const correct = `${deepNum((m * dv) / t, 2)} N`;
      return {
        prompt: `A ball of mass ${m} kg changes speed by ${dv} m/s in ${t} s. What is the average force on it (N)?`,
        correct,
        wrongs: pickDistinct(correct, [`${deepNum(m * dv, 2)} N`, `${deepNum(dv / t, 2)} N`, `${deepNum(m / t, 2)} N`]),
        tags: ["con-pair"],
        explanation: `Force is the RATE of change of momentum: momentum changed by ${m} × ${dv} = ${deepNum(m * dv, 2)} kg m/s, and that took ${t} s, so F = ${deepNum(m * dv, 2)} ÷ ${t} = ${deepNum((m * dv) / t, 2)} N. ${deepNum(m * dv, 2)} N is the change in momentum itself — the same number only if the change took exactly one second.
          `,
        difficulty: 0.72,
      };
    }
    const m = r.pick([0.5, 0.2, 0.25]);
    const u = r.pick([8, 10, 6]);
    const back = r.pick([6, 4, 8]);
    const correct = `${deepNum(m * (u + back), 2)} kg m/s`;
    return {
      prompt: `A ball of mass ${m} kg hits a wall at ${u} m/s and rebounds in the opposite direction at ${back} m/s. What is the magnitude of its change in momentum (kg m/s)?`,
      correct,
      wrongs: pickDistinct(correct, [
        `${deepNum(m * (u - back), 2)} kg m/s`,
        `${u - back} kg m/s`,
        `${deepNum(m * u, 2)} kg m/s`,
      ]),
      tags: ["con-pair"],
      explanation: `Velocity has direction, so reversing it changes the sign: the change is ${m} × (${u} + ${back}) = ${deepNum(m * (u + back), 2)} kg m/s. Subtracting (${deepNum(m * (u - back), 2)}) treats the rebound as if the ball kept going the same way — a 10 m/s ball returning at 6 m/s changed speed by 16 m/s, not 4.
        `,
      difficulty: 0.78,
    };
  },

  /** Energy: kinetic, gravitational, a KE → height chain, and a table that
   *  shows energy going missing to the surroundings. */
  "energy-conservation": (r) => {
    const variant = r.next();
    if (variant < 0.28) {
      const m = r.pick([2, 4, 6]);
      const v = r.pick([3, 4, 5]);
      const ke = 0.5 * m * v * v;
      const correct = `${deepNum(ke, 2)} J`;
      return {
        prompt: `A ${m} kg ball moves at ${v} m/s. What is its kinetic energy (J)?`,
        correct,
        wrongs: pickDistinct(correct, [`${m * v} J`, `${m * v * v} J`, `${deepNum(0.5 * m * v, 2)} J`]),
        tags: ["ke-mass"],
        explanation: `KE = ½mv² = ½ × ${m} × ${v}² = ${deepNum(ke, 2)} J. The speed is SQUARED: doubling a speed multiplies kinetic energy by four. ${m * v * v} J forgets the ½, and ${m * v} J treats speed as if it were not squared at all.
          `,
        difficulty: 0.4,
      };
    }
    if (variant < 0.5) {
      const m = r.pick([2, 4, 5]);
      const h = r.pick([2, 3, 5]);
      const gpe = m * 10 * h;
      const correct = `${gpe} J`;
      return {
        prompt: `A ${m} kg box is lifted ${h} m onto a shelf. Taking g = 10 N/kg, how much gravitational potential energy does it gain (J)?`,
        correct,
        wrongs: pickDistinct(correct, [`${m * h} J`, `${10 * h} J`, `${m * 10} J`]),
        tags: ["ke-mass"],
        explanation: `GPE gained = mgh = ${m} × 10 × ${h} = ${gpe} J. All three factors are needed: ${m * h} J leaves g out, ${10 * h} J leaves the mass out, and ${m * 10} J is the weight — the force — rather than the energy of lifting it ${h} m.
          `,
        difficulty: 0.45,
      };
    }
    if (variant < 0.78) {
      const v = r.pick([4, 6, 8, 10]);
      const h = (v * v) / 20;
      const correct = `${deepNum(h, 2)} m`;
      return {
        prompt: `A ${r.pick([0.5, 1])} kg ball is thrown straight up at ${v} m/s. Taking g = 10 N/kg, how high does it rise (m)?`,
        correct,
        wrongs: pickDistinct(correct, [`${deepNum((v * v) / 10, 2)} m`, `${deepNum(v / 10, 2)} m`, `${deepNum(v * v, 2)} m`]),
        tags: ["ke-mass"],
        explanation: `At the top the ball has no kinetic energy, so all of it has become gravitational: ½v² = gh, i.e. h = v² ÷ (2 × 10) = ${v * v} ÷ 20 = ${deepNum(h, 2)} m. The mass cancels — a heavy ball and a light one thrown at the same speed rise the same height. Using (v² ÷ 10) forgets the ½ in ½mv².
          `,
        difficulty: 0.68,
      };
    }
    const gpe = r.pick([40, 50, 60, 80]);
    const ke = gpe - r.pick([4, 5, 6, 8]);
    const correct = `${gpe - ke} J`;
    return {
      prompt: `A pendulum is released with ${gpe} J of gravitational potential energy. At the lowest point of its swing, a light gate measures ${ke} J of kinetic energy.\nHow much energy has been transferred to the surroundings (J)?`,
      correct,
      wrongs: pickDistinct(correct, [`${gpe} J`, `${ke} J`, `${gpe + ke} J`]),
      tags: ["ke-mass"],
      explanation: `Energy is conserved, not destroyed: ${gpe} J at the start = ${ke} J of kinetic energy + ${gpe - ke} J that went into the air and pivot as heat and sound. The missing energy is the ANSWER, not a measurement error — a real pendulum never keeps 100% of its energy.
        `,
      difficulty: 0.78,
    };
  },

  /** Work and power: Fd, P = W/t, an efficiency calculation, and two cranes
   *  lifting the same load. */
  "work-power": (r) => {
    const variant = r.next();
    if (variant < 0.28) {
      const F = r.pick([150, 200, 250, 400]);
      const d = r.pick([4, 6, 8]);
      const correct = `${F * d} J`;
      return {
        prompt: `A force of ${F} N moves a crate ${d} m. How much work is done (J)?`,
        correct,
        wrongs: pickDistinct(correct, [`${F} J`, `${F + d} J`, `${(F * d) / 2} J`]),
        tags: ["eff-frac"],
        explanation: `Work = force × distance moved in the direction of the force = ${F} × ${d} = ${F * d} J. A force that moves something is doing work; the size of the force alone (${F} J) says nothing about how far it acted.
          `,
        difficulty: 0.4,
      };
    }
    if (variant < 0.5) {
      const combos: Array<[number, number]> = [[1200, 4], [2400, 8], [3600, 20], [4800, 30]];
      const [W, t] = r.pick(combos);
      const correct = `${W / t} W`;
      return {
        prompt: `An engine transfers ${W} J of energy in ${t} s. What is its power (W)?`,
        correct,
        wrongs: pickDistinct(correct, [`${W} W`, `${W * t} W`, `${t} W`]),
        tags: ["eff-frac"],
        explanation: `Power is the RATE of energy transfer: ${W} ÷ ${t} = ${W / t} W. Dividing the other way round (t ÷ W) or quoting the total energy (${W}) answers a different question — how much, rather than how fast.
          `,
        difficulty: 0.5,
      };
    }
    if (variant < 0.78) {
      const combos: Array<[number, number]> = [[1200, 300], [2000, 600], [2500, 500], [3000, 750]];
      const [total, wasted] = r.pick(combos);
      const useful = total - wasted;
      const eff = Math.round((useful / total) * 100);
      const correct = `${eff}%`;
      return {
        prompt: `A motor is supplied with ${total} J of energy and wastes ${wasted} J. What is its efficiency (%)?`,
        correct,
        wrongs: pickDistinct(correct, [
          `${Math.round((wasted / total) * 100)}%`,
          `${Math.round((total / useful) * 100)}%`,
          `${Math.round(eff / 2)}%`,
        ]),
        tags: ["eff-frac"],
        explanation: `Efficiency compares what you get out with what you put in: useful energy = ${total} − ${wasted} = ${useful} J, so efficiency = ${useful} ÷ ${total} × 100 = ${eff}%. ${Math.round((wasted / total) * 100)}% is the fraction WASTED, which is why it is the one that cannot be the efficiency — an efficiency over 100% would mean a machine making energy.
          `,
        difficulty: 0.66,
      };
    }
    const load = r.pick([600, 900, 1200]);
    const h = r.pick([2, 3, 4]);
    const tA = r.pick([4, 6]);
    const tB = tA * 2;
    const work = load * h;
    const correct = `${deepNum(work / tA, 2)} W`;
    return {
      prompt: `Two cranes lift the same ${load} N load through ${h} m. Crane A takes ${tA} s; crane B takes ${tB} s.\nWhat is the power of crane A (W)?`,
      correct,
      wrongs: pickDistinct(correct, [`${deepNum(work / tB, 2)} W`, `${work} W`, `${deepNum(work / tA / 2, 2)} W`]),
      tags: ["eff-frac"],
      explanation: `Both cranes do the same work (${load} × ${h} = ${work} J); power is that work divided by the time each takes. ${work} ÷ ${tA} = ${deepNum(work / tA, 2)} W for A, and B — taking twice as long — manages only ${deepNum(work / tB, 2)} W. Same energy, different rate: that is exactly what power measures.
        `,
      difficulty: 0.78,
    };
  },

  /** Circuits: V = IR, series current, parallel branches, and a results table
   *  where the resistance has to be read out of the data. */
  "electricity-circuits": (r) => {
    const variant = r.next();
    if (variant < 0.28) {
      const V = r.pick([6, 12, 24]);
      const I = r.pick([2, 3, 4]);
      const correct = `${deepNum(V / I, 2)} Ω`;
      return {
        prompt: `A resistor has a potential difference of ${V} V across it and a current of ${I} A through it. What is its resistance (Ω)?`,
        correct,
        wrongs: pickDistinct(correct, [`${deepNum(I / V, 2)} Ω`, `${V * I} Ω`, `${V + I} Ω`]),
        tags: ["series-par"],
        explanation: `V = IR rearranged gives R = V ÷ I = ${V} ÷ ${I} = ${deepNum(V / I, 2)} Ω. ${V * I} Ω comes from multiplying instead of dividing — the triangle V = I × R puts V on top, so resistance is V over I.
          `,
        difficulty: 0.45,
      };
    }
    if (variant < 0.5) {
      const combos: Array<[number, number, number]> = [[4, 2, 12], [6, 3, 18], [10, 2, 24], [6, 2, 24]];
      const [r1, r2, V] = r.pick(combos);
      const correct = `${deepNum(V / (r1 + r2), 2)} A`;
      return {
        prompt: `A ${r1} Ω resistor and a ${r2} Ω resistor are connected in series to a ${V} V supply. What is the current (A)?`,
        correct,
        wrongs: pickDistinct(correct, [`${deepNum(V / r1, 2)} A`, `${deepNum(V / r2, 2)} A`, `${deepNum(r1 + r2, 2)} A`]),
        tags: ["series-par"],
        explanation: `In series the resistances ADD: total ${r1} + ${r2} = ${r1 + r2} Ω carries the same current everywhere. I = V ÷ R = ${V} ÷ ${r1 + r2} = ${deepNum(V / (r1 + r2), 2)} A. Using one resistor's value (${deepNum(V / r1, 2)} A) ignores the other — the current flows through both.
          `,
        difficulty: 0.55,
      };
    }
    if (variant < 0.8) {
      const R = r.pick([4, 6, 8, 12]);
      const V = r.pick([12, 24]);
      const correct = `${deepNum((2 * V) / R, 2)} A`;
      return {
        prompt: `Two ${R} Ω resistors are connected in parallel across a ${V} V supply. What is the total current from the supply (A)?`,
        correct,
        wrongs: pickDistinct(correct, [
          `${deepNum(V / R, 2)} A`,
          `${deepNum(V / (2 * R), 2)} A`,
          `${deepNum(V * R, 2)} A`,
        ]),
        tags: ["series-par"],
        explanation: `Each branch has the full ${V} V across it, so each takes V ÷ R = ${deepNum(V / R, 2)} A. Two branches, so the supply delivers ${deepNum((2 * V) / R, 2)} A. In parallel the current SPLITS and adds back at the junction; ${deepNum(V / R, 2)} A is what one branch takes, which is the commonest slip.
          `,
        difficulty: 0.7,
      };
    }
    const R = r.pick([5, 10, 20]);
    const rows = [[0.4, 1], [0.8, 2], [1.2, 3]] as const;
    const correct = `${R} Ω`;
    return {
      prompt: `A student's results for a fixed resistor:\n${rows.map(([i, k]) => `${R * i} V → ${i} A`).join("\n")}\nWhat is the resistance of the resistor (Ω)?`,
      correct,
      wrongs: pickDistinct(correct, [`${deepNum(1 / R, 3)} Ω`, `${R * 2} Ω`, `${deepNum(R / 2, 2)} Ω`]),
      tags: ["series-par"],
      explanation: `Resistance is the RATIO of voltage to current, and every row gives the same one: ${R * rows[0][0]} ÷ ${rows[0][0]} = ${R} Ω, and so on for the rest. A straight line through the origin on a V–I graph means a constant resistance — it is the GRADIENT that is the answer, not any single reading.
        `,
      difficulty: 0.8,
    };
  },

  /** Nuclear physics: half-life chains, the fraction left, a time worked out
   *  from fallen count rates, and a count-rate table. */
  "radioactivity": (r) => {
    const variant = r.next();
    if (variant < 0.3) {
      const N = r.pick([80, 120, 160, 240]);
      const T = r.pick([2, 3, 5]);
      const k = r.int(2, 4);
      const left = N / Math.pow(2, k);
      const correct = `${deepNum(left, 2)} g`;
      return {
        prompt: `A radioactive sample of ${N} g has a half-life of ${T} days. What mass of the sample remains after ${k * T} days?`,
        correct,
        wrongs: pickDistinct(correct, [
          `${deepNum(N / Math.pow(2, k - 1), 2)} g`,
          `${deepNum(N / Math.pow(2, k + 1), 2)} g`,
          "0 g",
        ]),
        tags: ["half-life"],
        explanation: `${k * T} days is ${k} half-lives, and each one halves what is LEFT: ${N} → ${deepNum(N / 2, 2)} → ${deepNum(N / 4, 2)} … → ${deepNum(left, 2)} g. Never zero — the curve flattens but never reaches the axis, which is why '0 g' is a distractor rather than a rounding.
          `,
        difficulty: 0.5,
      };
    }
    if (variant < 0.55) {
      const k = r.int(2, 5);
      const correct = `1/${Math.pow(2, k)}`;
      return {
        prompt: `After ${k} half-lives, what fraction of the original radioactive nuclei remains?`,
        correct,
        wrongs: pickDistinct(correct, [`1/${k}`, `1/${Math.pow(2, k - 1)}`, "1/2"]),
        tags: ["half-life"],
        explanation: `Each half-life halves the number left, so after ${k} of them the fraction is ½ × ½ … (${k} times) = 1/${Math.pow(2, k)}. 1/${k} divides by the NUMBER of half-lives rather than by two ${k} times, and 1/2 is only right after exactly one.
          `,
        difficulty: 0.58,
      };
    }
    if (variant < 0.8) {
      const A0 = r.pick([800, 960, 1600]);
      const k = r.int(3, 5);
      const A = A0 / Math.pow(2, k);
      const T = r.pick([2, 3, 4]);
      const correct = `${k * T} days`;
      return {
        prompt: `A sample's count rate falls from ${A0} Bq to ${deepNum(A, 2)} Bq. Its half-life is ${T} days.\nHow long did that take (days)?`,
        correct,
        wrongs: pickDistinct(correct, [`${T} days`, `${(k + 1) * T} days`, `${k} days`]),
        tags: ["half-life"],
        explanation: `Count the halvings to get from ${A0} Bq to ${deepNum(A, 2)} Bq: ${A0} → ${deepNum(A0 / 2, 2)} → ${deepNum(A0 / 4, 2)} … is ${k} half-lives. Each takes ${T} days, so ${k} × ${T} = ${k * T} days. The half-life (${T} days) is the time for ONE halving, not for ${k} of them.
          `,
        difficulty: 0.7,
      };
    }
    const A0 = r.pick([960, 640, 800, 480]);
    const T = r.pick([4, 5, 6]);
    const want = A0 / 32;
    const correct = `${deepNum(want, 2)} Bq`;
    return {
      prompt: `A count-rate experiment:\n0 min → ${A0} Bq\n${T} min → ${A0 / 2} Bq\n${2 * T} min → ${A0 / 4} Bq\nWhat is the count rate at ${5 * T} min (Bq)?`,
      correct,
      wrongs: pickDistinct(correct, [`${deepNum(A0 / 16, 2)} Bq`, `${deepNum(A0 / 64, 2)} Bq`, "0 Bq"]),
      tags: ["half-life"],
      explanation: `The table shows the count rate halving every ${T} min, so the half-life is ${T} min. ${5 * T} min is 5 half-lives: ${A0} → ${A0 / 2} → ${A0 / 4} → ${A0 / 8} → ${A0 / 16} → ${deepNum(want, 2)} Bq. Halving four times (${deepNum(A0 / 16, 2)}) is one half-life short, and six times (${deepNum(A0 / 64, 2)}) is one too many — reading the table's own interval is what keeps count.
        `,
      difficulty: 0.8,
    };
  },

  /** Waves: v = fλ, period, a frequency worked out from speed and wavelength,
   *  and a ripple tank measured at two frequencies. */
  "waves-basics": (r) => {
    const variant = r.next();
    if (variant < 0.28) {
      const f = r.pick([2, 4, 5, 10]);
      const wl = r.pick([2, 3, 4]);
      const correct = `${f * wl} m/s`;
      return {
        prompt: `A wave has a frequency of ${f} Hz and a wavelength of ${wl} m. What is its speed (m/s)?`,
        correct,
        wrongs: pickDistinct(correct, [`${f + wl} m/s`, `${deepNum(f / wl, 2)} m/s`, `${deepNum(wl / f, 2)} m/s`]),
        tags: ["freq-pitch"],
        explanation: `Each second the wave delivers ${f} complete waves, each ${wl} m long, so it advances f × λ = ${f} × ${wl} = ${f * wl} m/s. Adding the numbers (${f + wl}) mixes waves per second with metres per wave — the units do not even multiply into a speed.
          `,
        difficulty: 0.4,
      };
    }
    if (variant < 0.5) {
      const f = r.pick([2, 4, 5, 10, 20]);
      const correct = `${deepNum(1 / f, 3)} s`;
      return {
        prompt: `A wave has a frequency of ${f} Hz. What is its period (s)?`,
        correct,
        wrongs: pickDistinct(correct, [`${f} s`, `${deepNum(f / 2, 2)} s`, `${deepNum(2 / f, 3)} s`]),
        tags: ["freq-pitch"],
        explanation: `Period and frequency are reciprocals: period = 1 ÷ ${f} = ${deepNum(1 / f, 3)} s. If ${f} whole waves pass every second then each one takes ${deepNum(1 / f, 3)} s. Quoting ${f} s confuses how many happen per second with how long one takes.
          `,
        difficulty: 0.5,
      };
    }
    if (variant < 0.8) {
      const v = r.pick([340, 330]);
      const wl = r.pick([0.5, 1, 2]);
      const correct = `${deepNum(v / wl, 2)} Hz`;
      return {
        prompt: `A sound wave travels at ${v} m/s and has a wavelength of ${wl} m. What is its frequency (Hz)?`,
        correct,
        wrongs: pickDistinct(correct, [`${deepNum(v * wl, 2)} Hz`, `${deepNum(wl / v, 4)} Hz`, `${v} Hz`]),
        tags: ["freq-pitch"],
        explanation: `v = fλ rearranged gives f = v ÷ λ = ${v} ÷ ${wl} = ${deepNum(v / wl, 2)} Hz. Long wavelength with the same speed means FEWER waves per second, so the frequency must come out lower than the speed — multiplying would turn a 0.5 m wavelength into a frequency no speaker could reach.
          `,
        difficulty: 0.62,
      };
    }
    const f1 = r.pick([10, 20]);
    const wl1 = r.pick([0.03, 0.04]);
    const speed = f1 * wl1;
    const correct = `${deepNum(speed, 3)} m/s`;
    return {
      prompt: `A ripple tank is measured at two frequencies:\n${f1} Hz → wavelength ${wl1} m\n${f1 * 2} Hz → wavelength ${deepNum(wl1 / 2, 4)} m\nWhat is the wave speed (m/s)?`,
      correct,
      wrongs: pickDistinct(correct, [
        `${deepNum(f1 * (wl1 / 2), 3)} m/s`,
        `${deepNum(f1 * 2 * wl1, 3)} m/s`,
        `${deepNum(wl1 / f1, 4)} m/s`,
      ]),
      tags: ["freq-pitch"],
      explanation: `Every row gives the same speed: ${f1} × ${wl1} = ${deepNum(speed, 3)} m/s, and ${f1 * 2} × ${deepNum(wl1 / 2, 4)} repeats it. Double the frequency, halve the wavelength — the speed is a property of the water, not of how fast you wiggle.
        `,
      difficulty: 0.78,
    };
  },

  /** Pressure: force over area, pressure with depth, a hydraulic force, and a
   *  depth–pressure table read at a depth between the rows. */
  "pressure-fluids": (r) => {
    const variant = r.next();
    if (variant < 0.28) {
      const F = r.pick([100, 200, 400, 600]);
      const A = r.pick([2, 4, 8]);
      const correct = `${deepNum(F / A, 2)} Pa`;
      return {
        prompt: `A force of ${F} N acts on an area of ${A} m². What is the pressure (Pa)?`,
        correct,
        wrongs: pickDistinct(correct, [`${F * A} Pa`, `${deepNum(A / F, 2)} Pa`, `${F + A} Pa`]),
        tags: [],
        explanation: `Pressure is force spread over area: P = F ÷ A = ${F} ÷ ${A} = ${deepNum(F / A, 2)} Pa. The same force over a smaller area gives a bigger pressure — that is why a drawing pin is sharp and a stiletto dents a floor.
          `,
        difficulty: 0.35,
      };
    }
    if (variant < 0.55) {
      const h = r.pick([2, 3, 5, 8]);
      const correct = `${1000 * 10 * h} Pa`;
      return {
        prompt: `What is the pressure due to the water at a depth of ${h} m? (Water density 1000 kg/m³, g = 10 N/kg.)`,
        correct,
        wrongs: pickDistinct(correct, [`${1000 * h} Pa`, `${10 * h} Pa`, "10000 Pa"]),
        tags: [],
        explanation: `P = ρgh = 1000 × 10 × ${h} = ${1000 * 10 * h} Pa. Add the atmospheric pressure above the surface and the TOTAL pressure is that much again — but the pressure DUE to the water is the weight of the column above each square metre. ${1000 * h} Pa leaves g out entirely.
          `,
        difficulty: 0.6,
      };
    }
    if (variant < 0.8) {
      const P = r.pick([20000, 40000, 50000]);
      const A = r.pick([0.05, 0.1, 0.2, 0.02]);
      const correct = `${deepNum(P * A, 2)} N`;
      return {
        prompt: `A hydraulic press applies a pressure of ${P} Pa over a piston of area ${deepNum(A, 2)} m². What force does the piston exert (N)?`,
        correct,
        wrongs: pickDistinct(correct, [`${deepNum(P / A, 2)} N`, `${deepNum(P + A, 2)} N`, `${deepNum(P / 10, 2)} N`]),
        tags: [],
        explanation: `P = F ÷ A rearranged gives F = P × A = ${P} × ${deepNum(A, 2)} = ${deepNum(P * A, 2)} N. Dividing instead (${deepNum(P / A, 2)} N) is the slip the formula encourages — the pressure is the FORCE PER square metre, so multiplying by the number of square metres is what recovers the force.
          `,
        difficulty: 0.7,
      };
    }
    const k = r.pick([10, 20]);
    const correct = `${deepNum(2.5 * k, 2)} kPa`;
    return {
      prompt: `A pressure sensor is lowered into a tank:\n1 m → ${k} kPa\n2 m → ${2 * k} kPa\n4 m → ${4 * k} kPa\nWhat pressure does the sensor read at 2.5 m (kPa)?`,
      correct,
      wrongs: pickDistinct(correct, [`${2 * k} kPa`, `${3 * k} kPa`, `${4 * k} kPa`]),
      tags: [],
      explanation: `The table is a straight line through the origin — ${k} kPa per metre — so 2.5 m is 2.5 × ${k} = ${deepNum(2.5 * k, 2)} kPa. Between the rows you interpolate rather than read the nearest one: the pressure at 2.5 m is half-way between 2 m and 3 m, not equal to the 2 m reading.
        `,
      difficulty: 0.8,
    };
  },

  // ── THE SINGLE-ITEM CONCEPTS, GIVEN FAMILIES ──────────────────────────────
  //
  // Forty-six generators were single designed items: honest assessment
  // material, but a student practising "cells" met the same sentence forever,
  // and the diagnostic — which by rule only samples variable generators — had
  // almost nothing to sample in biology or chemistry (two variable chemistry
  // generators, three in biology; a chemistry baseline probed two concepts and
  // a biology one three). These families keep the authored item untouched
  // (withDepth composes) and add the range practice needs: reasoning variants
  // at application, arithmetic chains at multi-step, and readings out of tables
  // and diagrams at the interpreting band. Every tags[] entry is a belief the
  // concept ALREADY declares — the sweep enforces it in both directions.

  // ── BIOLOGY ───────────────────────────────────────────────────────────────

  /** Cells: which organelle answers which job, a specialisation trade-off, and
   *  a structure/size reading out of a table. */
  "cells": (r) => {
    const variant = r.next();
    if (variant < 0.3) {
      const jobs: Array<[string, string, string[], string]> = [
        ["releases energy through respiration", "Mitochondria", ["Chloroplasts", "The nucleus", "The cell membrane"], "Respiration happens in the mitochondria — the cell's power stations. Chloroplasts are the photosynthesis organelle; the nucleus stores DNA; the membrane controls what enters and leaves."],
        ["controls what enters and leaves the cell", "The cell membrane", ["The nucleus", "The cell wall", "Mitochondria"], "The membrane is selectively permeable: it holds the cell together AND decides what crosses. The wall (in plants) is structural — it lets almost anything diffuse past."],
        ["carries the genetic instructions", "The nucleus", ["The cytoplasm", "The ribosome", "The vacuole"], "DNA lives in the nucleus; the cytoplasm is where the chemistry runs. Ribosomes build the proteins the nucleus's instructions describe."],
        ["captures light for photosynthesis", "Chloroplasts", ["Mitochondria", "The vacuole", "Ribosomes"], "Chloroplasts contain chlorophyll, which absorbs light energy. They are the reason plants are green — and the reason they, unlike animals, can build sugar from air and water."],
      ];
      const [job, answer, wrong] = jobs[r.int(0, jobs.length - 1)];
      return {
        prompt: `Which structure's job is to ${job}?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer[0].toUpperCase() + answer.slice(1)} — ${answer.startsWith("The") ? "it" : "they"} ${job}. Every organelle is a structure serving one function; name the function and you have found the structure.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.6) {
      const spec: Array<[string, string, string[], string]> = [
        ["A red blood cell has no nucleus.", "More room for haemoglobin, so more oxygen per cell", ["It can divide faster without DNA", "It lives longer than nucleated cells", "It can change into any other cell type"], "The nucleus is the plan; the cargo is haemoglobin. Dropping the nucleus frees space for more of it — a trade of flexibility (no division) for carrying capacity. Specialisation always trades one ability for another."],
        ["A sperm cell is packed with mitochondria in its tail.", "To release the energy the tail needs for swimming", ["To make DNA for the egg", "To keep the sperm warm", "To store nutrients for the journey"], "Swimming the distance to the egg is an energy problem, and mitochondria are where respiration happens. Structure serving function again — the tail's job dictates its power supply."],
        ["A root hair cell is long and thin with a huge surface area.", "To absorb water and minerals faster from the soil", ["To anchor the plant more firmly", "To store sugar made by the leaves", "To shield the root from pests"], "Absorption is a surface-area game: the more membrane touching soil, the faster water and minerals cross. Nothing about shape helps storage or defence — it is all uptake."],
      ];
      const [fact, answer, wrong] = spec[r.int(0, spec.length - 1)];
      return {
        prompt: `${fact} What is the advantage?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Ask of every specialisation: what job does this shape MAKE POSSIBLE, and what did the cell give up to get it?`,
        difficulty: 0.55,
      };
    }
    const rows: Array<[string, number, boolean, boolean]> = [
      ["Cheek lining (animal)", 60, false, true],
      ["Leaf palisade (plant)", 80, true, true],
      ["Yeast (fungus)", 8, false, false],
    ];
    const [name, width, chloro, nucleus] = rows[r.int(0, rows.length - 1)];
    const correct = `${nucleus ? "Nucleus" : "No nucleus"}, ${chloro ? "chloroplasts present" : "no chloroplasts"}`;
    return {
      prompt: `A microscope shows a cell about ${width} μm wide:\n· green disks are visible inside it: ${chloro ? "yes" : "no"}\n· a dark rounded shape is visible: ${nucleus ? "yes" : "no"}\nThe cell is most likely which, and why?`,
      correct: `${name} — ${nucleus ? "a nucleus is present" : "no nucleus is present"}${chloro ? " and chloroplasts show" : " and no chloroplasts show"}`,
      wrongs: pickDistinct(`${name} — ${nucleus ? "a nucleus is present" : "no nucleus is present"}${chloro ? " and chloroplasts show" : " and no chloroplasts show"}`, [
        `${nucleus ? "A fungus cell — no nucleus is present" : "An animal cell — a nucleus is present"}`,
        `${chloro ? "An animal cell — chloroplasts show" : "A plant cell — chloroplasts show"}`,
        `A bacterium — the width fits`,
      ]),
      tags: [],
      explanation: `Read each observation against the organelle checklist: a ${width} μm cell ${nucleus ? "with" : "without"} a nucleus and ${chloro ? "with" : "without"} chloroplasts matches ${name.toLowerCase()}. Bacteria sit around 1–5 μm, so the width alone already excludes them.`,
      difficulty: 0.78,
    };
  },

  /** Enzymes: a temperature/субstrate reading, a lock-and-key reasoning item,
   *  and an optimal-pH comparison across a table. */
  "enzymes": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const opt = r.pick([30, 37, 40]);
      const table = [10, 20, 30, 40, 50].map((t2) => {
        const rate = t2 < opt ? t2 : opt === 37 ? (t2 === 40 ? 90 : t2 === 50 ? 20 : 0) : t2 <= opt ? 95 : 25;
        return `${t2} °C → ${t2 === opt ? 100 : rate}%`;
      });
      return {
        prompt: `An enzyme's reaction rate was measured at five temperatures:\n${table.join("\n")}\nWhat happens ABOVE the peak temperature, and why?`,
        correct: "The rate falls sharply — the enzyme's active site denatures",
        wrongs: pickDistinct("The rate falls sharply — the enzyme's active site denatures", [
          "The rate stays at the peak — more heat cannot help or harm",
          "The rate keeps rising — heat always speeds reactions",
          "The rate falls gently — the substrate runs out",
        ]),
        tags: [],
        explanation: `Below the peak, heat gives molecules more kinetic energy — more successful collisions. Above it the protein vibrates so hard its three-dimensional shape warps: the active site no longer fits the substrate, so the rate COLLAPSES (in this table, from 100% to ${opt === 37 ? "90%" : "25%"} and below). Heat speeds chemistry but destroys protein shape — two effects fighting, and shape loses.`,
        difficulty: 0.72,
      };
    }
    if (variant < 0.67) {
      const sub: Array<[string, string, string]> = [
        ["starch", "amylase", "maltose"],
        ["protein", "protease", "amino acids"],
        ["fats", "lipase", "fatty acids and glycerol"],
      ];
      const [s2, e2, products] = sub[r.int(0, sub.length - 1)];
      return {
        prompt: `A student adds enzyme E to a solution of ${s2}. After 10 minutes the ${s2} has been digested into ${products}. Which statement identifies E and explains the specificity?`,
        correct: `E is ${e2} — its active site fits only the ${s2} molecule's shape`,
        wrongs: pickDistinct(`E is ${e2} — its active site fits only the ${s2} molecule's shape`, [
          `E is ${e2} — enzymes work on any large molecule they meet`,
          `E could be any digestive enzyme — all digest everything slowly`,
          `E is ${e2} — the ${s2} changed its own shape to fit the enzyme`,
        ]),
        tags: [],
        explanation: `Lock and key: ${e2}'s active site is shaped for ${s2} alone — that is what specificity MEANS. The substrate fits INTO the enzyme's site; the enzyme does not mould itself to the substrate, and no other digestive enzyme has a site shaped for ${s2}.`,
        difficulty: 0.6,
      };
    }
    const pepsin = r.int(1, 3);
    const amylase = 7;
    return {
      prompt: `Two enzymes' optimum pH:\n· Pepsin (stomach): pH ${pepsin === 1 ? 2 : pepsin === 3 ? 1 : 3}\n· Amylase (mouth): pH ${amylase}\nThe same amylase sample is placed at pH 2. What happens, and what does the comparison show?`,
      correct: "Activity falls to near zero — the sample denatures far from its optimum; optimum pH differs by location",
      wrongs: pickDistinct("Activity falls to near zero — the sample denatures far from its optimum; optimum pH differs by location", [
        "Activity doubles — acids activate enzymes",
        "Activity is unchanged — pH only matters for pepsin",
        "The amylase works better because pH 2 is lower, and lower is faster",
      ]),
      tags: [],
      explanation: `An enzyme works only near its optimum pH. Amylase's is ${amylase}; at pH 2 the ionic bonds holding its shape break, the active site warps, and activity collapses — the same denaturation heat causes, by a different route. Pepsin's optimum near pH 2 is why protein digestion works in the stomach but not the mouth: the enzymes are matched to their location's chemistry.`,
      difficulty: 0.76,
    };
  },

  /** Photosynthesis: a limiting-factor graph read, a glucose-fate reasoning
   *  item, and a pondweed experiment table. */
  "photosynthesis": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const sat = r.pick([8, 10, 12]);
      const table = `\nLight (a.u.) → bubbles/min\n5 → 14\n10 → 26\n20 → ${sat * 2 + 2}\n40 → ${sat * 2 + 2}\n80 → ${sat * 2 + 2}`;
      return {
        prompt: `Pondweed bubbles per minute against light intensity:${table}\nWhy does the count stop rising beyond 20 a.u.?`,
        correct: "A different factor (CO₂ or temperature) is now limiting",
        wrongs: pickDistinct("A different factor (CO₂ or temperature) is now limiting", [
          "The plant has used up all its light",
          "Chlorophyll stops working at high light",
          "The plant is photosynthesising less as light rises",
        ]),
        tags: [],
        explanation: `The plateau means light is no longer the bottleneck: some other input — CO₂ concentration or temperature — caps the rate. Law of the minimum: the scarcest requirement limits the whole process, no matter how much of the others you add.`,
        difficulty: 0.75,
      };
    }
    if (variant < 0.67) {
      const fates: Array<[string, string, string[], string]> = [
        ["stored as starch in the leaves", "Insoluble, so it can be packed in without disturbing cell chemistry", ["Because starch tastes bad to pests", "Because starch carries more energy per gram than glucose", "To keep the glucose out of the light"], "Glucose is soluble and reactive; starch is insoluble and compact. Storage needs exactly that: something that sits quietly in large amounts without shifting water balance or reacting away."],
        ["used in respiration", "To release energy for the plant's own chemistry", ["To build the cell wall directly", "To absorb more light", "To make the leaf green"], "Photosynthesis banks energy; respiration spends it. The glucose made in the chloroplast is the fuel the mitochondria burn — the two processes are the plant's earn-and-spend pair."],
      ];
      const [fate, why, wrong] = fates[r.int(0, fates.length - 1)];
      return {
        prompt: `Glucose made by photosynthesis is ${fate}. Why is it converted for that purpose?`,
        correct: why,
        wrongs: pickDistinct(why, wrong),
        tags: [],
        explanation: `${why}. Every use of glucose follows from its chemistry: soluble and reactive makes it a good fuel and a good building block, and insoluble-and-compact makes it a good store.`,
        difficulty: 0.6,
      };
    }
    const co2 = r.pick([0.04, 0.1]);
    const lo = 12, hi = 40;
    return {
      prompt: `Two sealed bell jars over identical pondweed:\n· Jar A: air (0.04% CO₂), bright light → ${lo} bubbles/min\n· Jar B: enriched CO₂ (${co2}%), same bright light → ${hi} bubbles/min\nWhat conclusion do the two jars support?`,
      correct: "CO₂ concentration limits the rate in jar A — with light held constant, more CO₂ raised it",
      wrongs: pickDistinct("CO₂ concentration limits the rate in jar A — with light held constant, more CO₂ raised it", [
        "Jar B is warmer, which alone explains the difference",
        "Light must be limiting in both jars",
        "The weed in jar B is a different species",
      ]),
      tags: [],
      explanation: `Light was held constant, so the only changed input is CO₂ — and the rate rose from ${lo} to ${hi}. That is a controlled experiment doing its job: change one factor, hold the rest, attribute the difference. If light were limiting, extra CO₂ would have changed nothing.`,
      difficulty: 0.78,
    };
  },

  /** Respiration: the two routes side by side, an oxygen-debt reasoning item,
   *  and a gas-comparison table. */
  "respiration": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const m = r.pick([20, 30, 45]);
      return {
        prompt: `A sprinter's muscles run out of oxygen during a ${m}-second dash. Compare the energy released per glucose molecule with aerobic respiration.`,
        correct: "Far less — anaerobic breaks down glucose only partially, to lactic acid",
        wrongs: pickDistinct("Far less — anaerobic breaks down glucose only partially, to lactic acid", [
          "The same — glucose is glucose either way",
          "More — working without oxygen is more efficient",
          "Zero — no oxygen means no respiration at all",
        ]),
        tags: [],
        explanation: `Aerobic respiration fully oxidises glucose to CO₂ and water, releasing its full energy. Anaerobic stops at lactic acid — a fuel still rich in energy, which is why so little is released. The sprinter is not choosing the worse route; they are borrowing speed now and repaying the debt (oxidising that lactic acid) after the finish line.`,
        difficulty: 0.62,
      };
    }
    if (variant < 0.67) {
      const ex = r.pick([70, 80, 90]);
      return {
        prompt: `During hard exercise a student's breathing rate stays high for minutes after stopping. What is the extra oxygen used for?`,
        correct: "Oxidising the lactic acid that built up in the muscles",
        wrongs: pickDistinct("Oxidising the lactic acid that built up in the muscles", [
          "Refilling the lungs, which emptied during the sprint",
          "Cooling the body down — oxygen is a coolant",
          "Making new red blood cells immediately",
        ]),
        tags: [],
        explanation: `The oxygen debt: anaerobic work leaves lactic acid banked in the muscles, and repaying it needs oxygen — the liver oxidises it back toward glucose. Breathing and pulse stay up until the debt is cleared, which takes minutes, not seconds.`,
        difficulty: 0.58,
      };
    }
    const yeast = r.int(18, 32);
    return {
      prompt: `A fermentation flask of yeast in sugar solution is kept at ${yeast} °C:\n· limewater in the outlet turns cloudy\n· the solution smells of alcohol\nWhich process, and what do the two observations show?`,
      correct: "Anaerobic respiration — CO₂ (limewater) and ethanol (the smell) are its products",
      wrongs: pickDistinct("Anaerobic respiration — CO₂ (limewater) and ethanol (the smell) are its products", [
        "Aerobic respiration — CO₂ and alcohol are its products",
        "Photosynthesis — yeast makes sugar from CO₂",
        "Denaturation — the yeast is breaking down at ${yeast} °C",
      ]),
      tags: [],
      explanation: `Yeast without oxygen: glucose → ethanol + CO₂. Cloudy limewater is the standard test for CO₂; the alcohol smell is the ethanol. The temperature matters too: warm speeds fermentation, but far above ~40 °C the yeast enzymes denature and it stops.`,
      difficulty: 0.72,
    };
  },

  /** Digestion: which enzyme, where, and a molecule-tracing table. */
  "digestion": (r) => {
    const variant = r.next();
    if (variant < 0.5) {
      const enz: Array<[string, string, string, string]> = [
        ["protein", "amino acids", "protease", "the stomach"],
        ["fats", "fatty acids and glycerol", "lipase", "the small intestine"],
        ["starch", "maltose", "amylase", "the mouth and small intestine"],
      ];
      const [food, product, enzyme, where] = enz[r.int(0, enz.length - 1)];
      return {
        prompt: `A food test on a sample taken from ${where} finds ${food} partially broken into ${product}. Which enzyme did the work?`,
        correct: enzyme,
        // Two real confusions (the wrong enzyme class; bile, which students
        // miscall an enzyme) alongside the two remaining names — four options
        // without leaning on the assembler's filler.
        wrongs: pickDistinct(enzyme, [...enz.map((e) => e[2]).filter((e) => e !== enzyme), "Bile"]),
        tags: [],
        explanation: `${enzyme} digests ${food} into ${product}, and it is produced ${where === "the stomach" ? "in the stomach lining" : where === "the small intestine" ? "in the pancreas and small intestine" : "in the salivary glands and pancreas"}. Match molecule → enzyme → location, and the digestive system reads as one production line.`,
        difficulty: 0.5,
      };
    }
    const acid = r.pick(["HCl (stomach acid)", "bile (alkaline)"]);
    return {
      prompt: `Pancreatic lipase works in the small intestine at around pH 7–8. ${acid === "HCl (stomach acid)" ? "Stomach contents entering the intestine are pH 2." : "Fat entering the intestine is in large oily drops."}\nHow does bile make fat digestion faster?`,
      correct: "It emulsifies fat into tiny droplets — more surface for lipase — and neutralises stomach acid",
      wrongs: pickDistinct("It emulsifies fat into tiny droplets — more surface for lipase — and neutralises stomach acid", [
        "It digests fat itself, so lipase only finishes the job",
        "It adds water to the fat, diluting it into submission",
        "It raises the fat's temperature so lipase works faster",
      ]),
      tags: [],
      explanation: `Bile is not an enzyme — it changes the CONDITIONS. Emulsification chops big drops into tiny ones, multiplying the surface lipase can attack (rate ∝ surface area). It is also alkaline, neutralising the pH 2 stomach acid so the intestinal enzymes can work. Two effects, one secretion.`,
      difficulty: 0.68,
    };
  },

  /** Atoms & elements: subatomic bookkeeping, isotope vs ion, and a particle
   *  table read. Anchor for the chemistry baseline. */
  "atoms-elements": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const p = r.pick([3, 6, 8, 11, 13, 17, 19, 20]);
      const n = p + r.pick([0, 1, 2, 3]);
      const e = p - r.pick([0, 0, 1, 2, 3]);
      const charge = p - e;
      const name = { 3: "Lithium", 6: "Carbon", 8: "Oxygen", 11: "Sodium", 13: "Aluminium", 17: "Chlorine", 19: "Potassium", 20: "Calcium" }[p] ?? "";
      return {
        prompt: `A particle of ${name} has ${p} protons, ${n} neutrons and ${e} electrons. What is it?`,
        correct: charge === 0 ? `A neutral ${name.toLowerCase()} atom` : `A ${name.toLowerCase()} ion with charge ${charge > 0 ? "+" + charge : charge}`,
        wrongs: pickDistinct(charge === 0 ? `A neutral ${name.toLowerCase()} atom` : `A ${name.toLowerCase()} ion with charge ${charge > 0 ? "+" + charge : charge}`, [
          charge === 0 ? `An ion with charge ${n % 2 === 0 ? "+" + n / 2 : "−1"}` : charge > 0 ? `A neutral ${name.toLowerCase()} atom` : `An ion with charge +${-charge}`,
          `A different element — the neutrons decide the identity`,
          `An isotope of a different element`,
        ]),
        tags: [],
        explanation: `Protons decide the element (${p} → ${name}); electrons decide the charge: ${p} − ${e} = ${charge === 0 ? "0, so it is neutral" : charge > 0 ? "+" + charge + ", a cation — it LOST electrons" : charge + ", an anion — it GAINED electrons"}. Neutrons (${n}) only make it one isotope of ${name} or another; they never change what it is.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      const a = r.pick([12, 14, 16, 35, 37]);
      const same = a === 12 ? 6 : a === 14 ? 6 : a === 16 ? 8 : 17;
      const other = a === 12 ? 14 : a === 14 ? 12 : a === 16 ? 18 : 35;
      return {
        prompt: `Two atoms of the same element have mass numbers ${a} and ${other} (this element's proton number is ${same}). What are they, and what differs?`,
        correct: "Isotopes — same protons, different neutron counts",
        wrongs: pickDistinct("Isotopes — same protons, different neutron counts", [
          "Ions — one has lost electrons to the other",
          "Different elements — the mass differs so the element differs",
          "Allotropes — the atoms are bonded in different structures",
        ]),
        tags: [],
        explanation: `Same element means the same proton count (${same}). Mass numbers ${a} and ${other} with ${same} protons leave ${a - same} and ${other - same} neutrons — isotopes. Ions differ in ELECTRONS, not neutrons; allotropes differ in how atoms are bonded (graphite vs diamond), not in the atoms themselves.`,
        difficulty: 0.6,
      };
    }
    const rows: Array<[string, number, number, number]> = [
      ["P", 15, 16, 15],
      ["K", 19, 20, 18],
      ["Mg", 12, 12, 10],
    ];
    const [sym, p, n, e] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `A particle is recorded as:\nprotons: ${p}\nneutrons: ${n}\nelectrons: ${e}\nWhich row of the table identifies it?\n· atomic number ${p}, mass number ${p + n}, charge ${p - e > 0 ? "+" + (p - e) : p - e}\n· atomic number ${p}, mass number ${p + n}, charge 0\n· atomic number ${n}, mass number ${p + n}, charge ${p - e > 0 ? "+" + (p - e) : p - e}`,
      correct: `Atomic number ${p}, mass number ${p + n}, charge ${p - e > 0 ? "+" + (p - e) : p - e}`,
      wrongs: pickDistinct(`Atomic number ${p}, mass number ${p + n}, charge ${p - e > 0 ? "+" + (p - e) : p - e}`, [
        `Atomic number ${p}, mass number ${p + n}, charge 0`,
        `Atomic number ${n}, mass number ${p + n}, charge ${p - e > 0 ? "+" + (p - e) : p - e}`,
        `Atomic number ${p}, mass number ${n}, charge 0`,
      ]),
      tags: [],
      explanation: `Atomic number = protons = ${p}; mass number = protons + neutrons = ${p} + ${n} = ${p + n}; charge = protons − electrons = ${p} − ${e} = ${p - e === 0 ? "0" : p - e > 0 ? "+" + (p - e) : p - e}. Each row of the particle's record fills exactly one column of its identification — no guessing.`,
      difficulty: 0.75,
    };
  },

  /** Ionic bonding: formula-deduction across charge pairs, a lattice property
   *  explanation, and a charge-balance puzzle. Anchor for the chemistry
   *  baseline. */
  "ionic-bonding": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const metals: Array<[string, number, string]> = [["Na", 1, "sodium"], ["Mg", 2, "magnesium"], ["Al", 3, "aluminium"]];
      const nonmetals: Array<[string, number, string]> = [["Cl", 1, "chloride"], ["O", 2, "oxide"], ["S", 2, "sulfide"]];
      const [m, mc, mn] = metals[r.int(0, 2)];
      const [x, xc, xn] = nonmetals[r.int(0, 2)];
      const lcmv = (mc * xc) / deepGcd(mc, xc);
      const nM = lcmv / mc, nX = lcmv / xc;
      const sub = (n: number) => (n === 1 ? "" : sup(n));
      const correct = `${m}${sub(nM)}${x}${sub(nX)}`;
      // The three confusions: ignoring charges entirely, crossing the ratio
      // the wrong way round, and over-supplying one ion. In the 1:1 case the
      // uncrossed pair IS the answer, so that branch swaps in two real slips
      // that cannot collide: a doubled metal count and an equal-but-reversed
      // subscript pair written as charges instead of counts.
      const wrongs = nM === nX
        ? [`${m}${sub(nM + 1)}${x}`, `${m}${x}${sub(nX + 1)}`, `${m}${sub(nM + 1)}${x}${sub(nX + 1)}`]
        : [`${m}${x}`, `${m}${sub(nX)}${x}${sub(nM)}`, `${m}${sub(nM + 1)}${x}${sub(nX)}`];
      return {
        prompt: `Metal M forms ${mn} ions with charge ${mc > 0 ? "+" + mc : mc}; non-metal X forms ${xn} ions with charge ${xc > 0 ? "+" + xc : xc}. What is the formula of the compound?`,
        correct,
        wrongs: pickDistinct(correct, wrongs),
        tags: [],
        explanation: `Total positive must equal total negative: ${nM} × (${mc > 0 ? "+" + mc : mc}) = ${nM * mc} and ${nX} × (${xc > 0 ? "+" + xc : xc}) = ${-(nX * xc) === 0 ? 0 : "−" + nX * xc}. So ${correct}. Crossing the charges over as subscripts is the shortcut; balancing to zero is the REASON.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      const props: Array<[string, string, string[], string]> = [
        ["solid ionic compounds do NOT conduct electricity", "The ions are fixed in the lattice — there are no mobile charges", ["The ions have no charge inside a lattice", "Covalent bonds block the current", "The electrons are shared and cannot move"], "Conduction needs mobile charged particles. In the solid lattice every ion is locked in place — melt or dissolve it and the ions free to move, which is exactly when conduction starts."],
        ["ionic compounds have HIGH melting points", "Strong electrostatic attraction between opposite ions throughout the lattice", ["The ions are very large and hard to separate", "Covalent bonds inside each ion are strong", "The lattice contains water holding it together"], "Melting means tearing the lattice apart, and every ion attracts several of the opposite charge around it. That network of electrostatic bonds takes enormous energy to break — hence NaCl melts at 801 °C."],
      ];
      const [fact, why, wrong] = props[r.int(0, props.length - 1)];
      return {
        prompt: `${fact}. Why?`,
        correct: why,
        wrongs: pickDistinct(why, wrong),
        tags: [],
        explanation: `${why}. Both properties come from the same cause — a giant lattice of charged particles: immobile charges explain the solid's non-conduction, and the lattice's bond strength explains the high melting point.`,
        difficulty: 0.6,
      };
    }
    const q = r.pick([[2, -1], [3, -2], [2, -3]]);
    return {
      prompt: `A student writes the formula of a metal ${q[0] > 0 ? "+" + q[0] : q[0]} ion with a ${q[1]} ion as MX₂, giving total charge ${q[0] + 2 * q[1]}. What is wrong, and what is the correct formula?`,
      correct: `The charges do not balance to zero — the correct ratio is ${-q[1]} : ${q[0]}, so M${sup(-q[1])}X${sup(q[0])}`,
      wrongs: pickDistinct(`The charges do not balance to zero — the correct ratio is ${-q[1]} : ${q[0]}, so M${sup(-q[1])}X${sup(q[0])}`, [
        `Nothing — MX₂ is correct because 2 is the subscript of the larger charge`,
        `The charges must be equal, so one ion's charge is wrong`,
        `The correct formula is M${sup(q[0])}X${sup(-q[1])} — the subscripts are never crossed`,
      ]),
      tags: [],
      explanation: `${q[0]} + 2 × (${q[1]}) = ${q[0] + 2 * q[1]} ≠ 0 — the compound as written carries a net charge, which a compound cannot. Balance instead: ${-q[1]} metal ions give ${-q[1] * q[0] > 0 ? "+" : ""}${-q[1] * q[0]}, and ${q[0]} X ions give ${q[0] * q[1]}, summing to zero. That ratio IS the crossed-subscripts rule, derived rather than memorised.`,
      difficulty: 0.72,
    };
  },

  // ── COMPUTING ────────────────────────────────────────────────────────────
  // Eleven single-item generators meant a computing student met the same
  // sentence per concept forever, and the diagnostic had exactly four variable
  // concepts to sample. These families give each its range; none needs a
  // misconception tag (the computing catalogue entries attach elsewhere).

  /** Debugging method: what to check first, a trace-and-locate item, and an
   *  error-message read. */
  "what-is-code": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const syms: Array<[string, string]> = [
        ["a program prints 'undefined' where a number was expected", "the value was never set before it was used — trace where it should have been assigned"],
        ["a program crashes on 'division by zero'", "a variable that should never be 0 reached 0 — find which input or branch let that happen"],
        ["a loop never ends", "the variable the loop condition checks is never updated inside the loop"],
      ];
      const [sym, cause] = syms[r.int(0, syms.length - 1)];
      return {
        prompt: `${sym.charAt(0).toUpperCase() + sym.slice(1)}. What is the most useful next step?`,
        correct: cause,
        wrongs: pickDistinct(cause, [
          "Rewrite the whole program from scratch with fewer features",
          "Add try/catch blocks everywhere so errors are ignored",
          "Restart the computer and run it again identically",
        ]),
        tags: [],
        explanation: `${cause.charAt(0).toUpperCase() + cause.slice(1)}. Debugging is reasoning about state: the error names a VALUE that is wrong, and the fix is finding the line where that value went wrong — not suppressing the message.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      const a = r.int(2, 5), b = r.int(6, 9);
      return {
        prompt: `def total(items):\n    s = 0\n    for i in range(len(items)):\n        s = s + items[i]\n    return s\n\ntotal([${a}, ${b}]) returns what, and what does range(len(items)) produce here?`,
        correct: `${a + b} — range(2) yields 0 and 1, the valid indexes`,
        wrongs: pickDistinct(`${a + b} — range(2) yields 0 and 1, the valid indexes`, [
          `${a + b} — range(2) yields 1 and 2`,
          "An error — range cannot take a list's length",
          `${a * b} — the loop multiplies as it goes`,
        ]),
        tags: [],
        explanation: `len([${a}, ${b}]) is 2, and range(2) yields 0, 1 — exactly the indexes of the two elements. So the loop adds items[0] + items[1] = ${a} + ${b} = ${a + b}. Most loop bugs are off-by-one bugs; knowing range's exclusive end prevents all of them.`,
        difficulty: 0.5,
      };
    }
    return {
      prompt: `A student's program prints the wrong total, but only when the input list contains a 0. What does that pattern tell you?`,
      correct: "The bug lives in the path that handles 0 — test with the smallest input containing one",
      wrongs: pickDistinct("The bug lives in the path that handles 0 — test with the smallest input containing one", [
        "The list function is broken whenever lists contain zeros",
        "The program is fine — zeros are not real numbers in code",
        "The bug must be in the display code, since only printing is wrong",
      ]),
      tags: [],
      explanation: `A bug that appears only with specific input narrows the search: the failing path is the one that input takes. Minimise to the smallest failing case, then trace it line by line — that is the debugging loop every developer actually uses.`,
      difficulty: 0.55,
    };
  },

  /** Rates of reaction: collision-energy reasoning, a rate–time curve read,
   *  and a two-experiment comparison. Anchor for the chemistry baseline. */
  "dictionaries": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const a = r.pick(["Ada", "Grace", "Alan"]), b = r.pick(["Edsger", "Margaret", "Tim"]);
      const n1 = r.int(20, 60), n2 = r.int(61, 99), n3 = r.int(10, 19);
      return {
        prompt: `ages = {"${a}": ${n1}, "${b}": ${n2}}\nages["${a}"] = ${n3}\nprint(len(ages)) — what prints?`,
        correct: "2",
        wrongs: ["3", String(n3), "1"] as [string, string, string],
        tags: [],
        explanation: `Assigning to an EXISTING key overwrites its value ("${a}" now maps to ${n3}) — it does not add a key. Two keys were defined, so the length stays 2.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const k = r.pick(["score", "level", "lives"]), other = r.pick(["name", "time", "moves"]);
      const v = r.int(3, 90);
      return {
        prompt: `state = {"${k}": ${v}}\nprint(state.get("${other}", 0)) — what prints, and why?`,
        correct: "0 — the key is missing, and get() returns the default instead of failing",
        wrongs: pickDistinct("0 — the key is missing, and get() returns the default instead of failing", [
          String(v) + " — get() returns the only value in the dictionary",
          "An error — missing keys always crash the program",
          `"${other}" — get() returns the key it was given`,
        ]),
        tags: [],
        explanation: `state["${other}"] would raise KeyError — but get() takes a second argument: the value to return when the key is absent. Reading a dictionary safely is exactly this choice between a crash and a default.`,
        difficulty: 0.5,
      };
    }
    const n = r.int(2, 5);
    return {
      prompt: `stock = {"pen": 4, "ink": ${n}}\nstock["pen"] = stock["pen"] + stock["ink"]\nstock["ink"] = 0\nWhat is stock["pen"]?`,
      correct: String(4 + n),
      wrongs: pickDistinct(String(4 + n), [String(n), "4", String(4 + n + 1)]),
      tags: [],
      explanation: `Line 2 reads the CURRENT values (4 and ${n}) and stores their sum: pen = ${4 + n}. Line 3 changes ink only. Each statement executes completely, in order, against the dictionary as it stands at that moment.`,
      difficulty: 0.58,
    };
  },

  /** Binary search: a count across sizes, a sorted-vs-unsorted trap, and a
   *  target trace. Anchor-adjacent reasoning for the computing ladder. */
  "algorithms-search": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const n = r.pick([100, 1000, 10000, 1000000]);
      const checks = Math.ceil(Math.log2(n));
      return {
        prompt: `Binary search on ${n.toLocaleString("en-GB")} sorted items needs at most how many checks?`,
        correct: String(checks),
        wrongs: pickDistinct(String(checks), [String(Math.ceil(checks * 2)), String(n.toLocaleString("en-GB")), String(Math.ceil(n / 2))].map(s => s)),
        tags: [],
        explanation: `Each check halves the search space: 2^${checks} ${checks * 2 >= n ? "≥" : "<"} ${n.toLocaleString("en-GB")}, so ${checks} halvings are enough. Logarithmic growth is the whole point — a billion items need ~30 checks.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      return {
        prompt: `A list of exam scores is UNSORTED. A student runs binary search for 72 and it fails to find a 72 that IS present. Why?`,
        correct: "Binary search only works on sorted data — the halving assumes the target must lie on one known side",
        wrongs: pickDistinct("Binary search only works on sorted data — the halving assumes the target must lie on one known side", [
          "The search needs a bigger computer for unsorted data",
          "72 was compared against too few items",
          "Binary search finds only the first occurrence", 
        ]),
        tags: [],
        explanation: `The algorithm discards half the list each step BECAUSE sorted order guarantees which half the target must be in. Unsorted, that guarantee is void: the discarded half may have held the 72. Sort first (or use linear search).`,
        difficulty: 0.55,
      };
    }
    const lo = 1, hi = r.pick([15, 16, 31]);
    const mid = Math.floor((lo + hi) / 2);
    return {
      prompt: `Binary search over positions ${lo}–${hi}. The first check compares the target against the item at which position?`,
      correct: String(mid),
      wrongs: pickDistinct(String(mid), [String(lo), String(hi), String(mid + 1)]),
      tags: [],
      explanation: `The middle: (${lo} + ${hi}) ÷ 2, rounded down = ${mid}. Comparing there splits the range as evenly as possible — that is what makes the halving logarithmic.`,
      difficulty: 0.45,
    };
  },

  /** Sorting: a comparison-count estimate, a stability/structure reasoning
   *  item, and a merge-sort split trace. */
  "algorithms-sort": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const n = r.pick([8, 100, 1000]);
      const bubble = n === 8 ? 64 : n === 100 ? 10000 : 1000000;
      return {
        prompt: `Roughly how many comparisons does bubble sort make on ${n.toLocaleString("en-GB")} items (n² behaviour)?`,
        correct: bubble.toLocaleString("en-GB"),
        wrongs: pickDistinct(bubble.toLocaleString("en-GB"), [
          Math.ceil(n * Math.log2(n)).toLocaleString("en-GB"),
          (n * 2).toLocaleString("en-GB"),
          Math.ceil(bubble / 2).toLocaleString("en-GB"),
        ]),
        tags: [],
        explanation: `Bubble sort compares every pair: n² = ${n.toLocaleString("en-GB")}² = ${bubble.toLocaleString("en-GB")}. The curve, not the constant, is what kills it at scale — which is why O(n log n) sorts exist.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      return {
        prompt: `Merge sort splits a list until pieces have one item, then merges sorted pieces. Why is merging the KEY step?`,
        correct: "Two already-sorted lists can be combined in one linear pass — the sortedness does the work",
        wrongs: pickDistinct("Two already-sorted lists can be combined in one linear pass — the sortedness does the work", [
          "Merging is where the list is actually compared to the target order",
          "Merging removes duplicate items cheaply",
          "Merging sorts each half a second time for safety",
        ]),
        tags: [],
        explanation: `Merging two sorted lists takes n single comparisons: look at both fronts, take the smaller, advance. The divide step costs nothing; ALL the structure that makes the algorithm fast is built by merging in sorted order.`,
        difficulty: 0.58,
      };
    }
    const q = r.int(6, 9);
    return {
      prompt: `A merge sort is running on ${q} items. After the first split, how large is each half?`,
      correct: `${Math.ceil(q / 2)} and ${Math.floor(q / 2)}`,
      wrongs: pickDistinct(`${Math.ceil(q / 2)} and ${Math.floor(q / 2)}`, [
        `${q} and 0`,
        `${Math.floor(q / 2)} and ${Math.floor(q / 2)}`,
        `1 and ${q - 1}`,
      ]),
      tags: [],
      explanation: `${q} splits into ${Math.ceil(q / 2)} and ${Math.floor(q / 2)} — halves as even as an odd count allows, each then sorted recursively. ${Math.floor(q / 2)} and ${Math.floor(q / 2)} would drop one item; merge sort never loses an element at a split.`,
      difficulty: 0.45,
    };
  },

  /** Recursion: a factorial-adjacent trace, a base-case reasoning item, and a
   *  call-stack depth count. */
  "recursion": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const n = r.int(5, 8);
      let f = 1; for (let i = 2; i <= n; i++) f *= i;
      return {
        prompt: `def mystery(n):\n    if n == 1: return 1\n    return n * mystery(n − 1)\n\nHow many TOTAL calls to mystery does mystery(${n}) make (including the first)?`,
        correct: String(n),
        wrongs: pickDistinct(String(n), [String(n - 1), String(n + 1), "1"]),
        tags: [],
        explanation: `mystery(${n}) calls mystery(${n - 1}) calls … down to mystery(1), which stops: ${n} calls in a chain. The base case is a call too — it returns without calling further, which is what makes the chain terminate.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      return {
        prompt: `A recursive function has no base case. What happens, and why?`,
        correct: "It calls itself forever until the call stack overflows — no condition ever stops the descent",
        wrongs: pickDistinct("It calls itself forever until the call stack overflows — no condition ever stops the descent", [
          "It returns None immediately — no base case means no work",
          "It loops endlessly but harmlessly inside one call",
          "The compiler inserts a base case automatically",
        ]),
        tags: [],
        explanation: `Each call waits for the next to return. With nothing to stop the descent, calls pile up until the stack's memory runs out — a stack overflow. The base case is not decoration; it is the only thing that lets any call in the chain finish.`,
        difficulty: 0.5,
      };
    }
    const a = r.int(2, 4), k = r.int(3, 5);
    return {
      prompt: `def grow(x):\n    if x >= ${k * a}: return x\n    return grow(x + ${a})\n\nHow many times is grow called for grow(0)?`,
      correct: String(k + 1),
      wrongs: pickDistinct(String(k + 1), [String(k), String(k + a), String(k * a)]),
      tags: [],
      explanation: `grow(0), grow(${a}), grow(${2 * a}) … the first call where x ≥ ${k * a} returns directly. That is ${k + 1} calls: ${k} that recurse plus the one that stops. Counting the stopping call is the whole question.`,
      difficulty: 0.62,
    };
  },

  /** Complexity: order these growths, an n-comparison, and a table read of
   *  which algorithm finishes. */
  "complexity": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const pairs: Array<[string, string, string[]]> = [
        ["O(n²)", "O(n log n)", ["O(n log n)", "O(n)", "O(2ⁿ)"]],
        ["O(log n)", "O(n)", ["O(n)", "O(n²)", "O(n log n)"]],
        ["O(n)", "O(n log n)", ["O(n log n)", "O(log n)", "O(n²)"]],
        ["O(n²)", "O(2ⁿ)", ["O(2ⁿ)", "O(n)", "O(n log n)"]],
        ["O(1)", "O(log n)", ["O(log n)", "O(n)", "O(n²)"]],
        ["O(n log n)", "O(n²)", ["O(n²)", "O(n)", "O(2ⁿ)"]],
      ];
      const [faster, slower, wrong] = pairs[r.int(0, pairs.length - 1)];
      return {
        prompt: `Which grows more slowly as n gets large: ${faster} or ${slower}?`,
        correct: faster,
        wrongs: pickDistinct(faster, wrong),
        tags: [],
        explanation: `${faster} grows more slowly than ${slower}. Ranking: O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ). The order — not the machine — decides what scales.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      const n = r.pick([100, 1000, 10000, 100000]);
      return {
        prompt: `At n = ${n.toLocaleString("en-GB")}, roughly how many MORE operations does O(n²) do than O(n)?`,
        correct: `About ${n.toLocaleString("en-GB")}× more — n² = ${(BigInt(n) * BigInt(n)).toLocaleString("en-GB")} versus n = ${n.toLocaleString("en-GB")}`,
        wrongs: pickDistinct(`About ${n.toLocaleString("en-GB")}× more — n² = ${(BigInt(n) * BigInt(n)).toLocaleString("en-GB")} versus n = ${n.toLocaleString("en-GB")}`, [
          "Twice as many — the square doubles the work",
          "The same — big-O ignores constants, so they are equal at any n",
          `About ${Math.log2(n).toFixed(0)}× more — the difference is logarithmic`,
        ]),
        tags: [],
        explanation: `n² ÷ n = n: at ${n.toLocaleString("en-GB")} items the quadratic algorithm does about ${n.toLocaleString("en-GB")} times the work. Big-O ignores constant factors, but the SHAPE of the curve is exactly what it compares — and n² versus n is a chasm, not a constant.`,
        difficulty: 0.6,
      };
    }
    const n = r.pick([8, 16, 64, 1024, 4096]);
    return {
      prompt: `Two algorithms on n = ${n.toLocaleString("en-GB")}:\n· A runs in n² steps → ${(BigInt(n) * BigInt(n)).toLocaleString("en-GB")}\n· B runs in n log₂n steps → ${n * Math.log2(n) | 0}\nIf each step takes 1 μs, which finishes in under a second?`,
      correct: `Only B — A needs ${(BigInt(n) * BigInt(n)).toLocaleString("en-GB")} μs, far more than a second`,
      wrongs: pickDistinct(`Only B — A needs ${(BigInt(n) * BigInt(n)).toLocaleString("en-GB")} μs, far more than a second`, [
        `Both — any algorithm finishes within a second at this size`,
        `Only A — fewer, faster steps`,
        `Neither — logarithmic algorithms cannot run in real time`,
      ]),
      tags: [],
      explanation: `A needs ${(BigInt(n) * BigInt(n)).toLocaleString("en-GB")} μs = ${(BigInt(n) * BigInt(n) / 1000000n).toLocaleString("en-GB")} s at best; B needs about ${Math.round(n * Math.log2(n)).toLocaleString("en-GB")} μs — well under a second. Same machine, same input: the growth CURVE is the difference.`,
      difficulty: 0.72,
    };
  },

  /** Networks and the web: protocol-matching, a request-lifecycle trace, and
   *  a client/server responsibility table. */
  "web-stack": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const roles: Array<[string, string, string[]]> = [
        ["styles a page's layout and colours", "CSS", ["HTML", "JavaScript", "SQL"]],
        ["makes the page fetch new data without reloading", "JavaScript", ["CSS", "HTML", "DNS"]],
        ["defines the page's structure and content", "HTML", ["CSS", "JavaScript", "SQL"]],
      ];
      const [job, tech, wrong] = roles[r.int(0, roles.length - 1)];
      return {
        prompt: `Which part of the web stack ${job}?`,
        correct: tech,
        wrongs: pickDistinct(tech, wrong),
        tags: [],
        explanation: `${tech} — ${job.startsWith("styles") ? "presentation is CSS's job: structure (HTML), behaviour (JavaScript) and storage (SQL) each stay in their own layer" : job.startsWith("makes") ? "JavaScript is the browser's programming language: it can fetch, react and change the page after load" : "HTML is the document: headings, paragraphs, links — everything else decorates or animates it"}.`,
        difficulty: 0.4,
      };
    }
    if (variant < 0.67) {
      const site = r.pick(["example.com", "school.org", "news.co.uk"]);
      return {
        prompt: `You type https://${site} into a browser. Put the first two steps in order:\n1. the browser asks a DNS server for the site's IP address\n2. the browser opens a connection to that server and requests the page\n3. the page's HTML arrives and is displayed`,
        correct: "1 then 2 — resolve the name before connecting to the server",
        wrongs: pickDistinct("1 then 2 — resolve the name before connecting to the server", [
          "2 then 1 — the connection can be made by name directly",
          "3 then 1 — the page is fetched by broadcast first",
          "They happen simultaneously — DNS travels with the request",
        ]),
        tags: [],
        explanation: `A connection needs an ADDRESS, and a name is not an address. DNS turns ${site} into an IP first; only then can the browser open a connection and ask for the page. Every web request starts with that translation.`,
        difficulty: 0.5,
      };
    }
    return {
      prompt: `A shop site stores products and takes payments. Which responsibilities belong to the SERVER rather than the browser?`,
      correct: "Storing the product database and processing payments — data and secrets must not live in the client",
      wrongs: pickDistinct("Storing the product database and processing payments — data and secrets must not live in the client", [
        "Rendering the product images and buttons",
        "Validating the basket's total is a number before submitting",
        "Remembering the page the user is scrolled to",
      ]),
      tags: [],
      explanation: `Anything the browser holds, the user can read and change — so databases, prices that matter and card processing live on the server. The browser does presentation and instant feedback (rendering, quick validation) but never trusts itself with authority.`,
      difficulty: 0.6,
    };
  },

  /** Cybersecurity: a phishing/hash reasoning pair and a salted-hash trace. */
  "cybersecurity": (r) => {
    const variant = r.next();
    if (variant < 0.5) {
      const msgs: Array<[string, string]> = [
        ["An email from 'your bank' asks you to 'confirm your password' on a linked site.", "Phishing — no real bank ever needs your password back"],
        ["A login page's address starts with https and shows a padlock.", "The connection is encrypted — but it says nothing about who runs the page"],
        ["A site stores passwords hashed with a unique random salt per user.", "A stolen table reveals no plaintext and no shared patterns between users"],
      ];
      const [situation, verdict] = msgs[r.int(0, msgs.length - 1)];
      return {
        prompt: `${situation}\nWhat is the correct security assessment?`,
        correct: verdict,
        wrongs: pickDistinct(verdict, [
          "It is safe — official-looking messages and padlocks prove legitimacy",
          "It is definitely an attack — any password handling is unsafe",
          "It only matters if the user has antivirus installed",
        ]),
        tags: [],
        explanation: `${verdict}. Security judgements come from the mechanism, not the appearance: encryption protects the CONNECTION, hashing protects the STORED COPY, and no mechanism makes a password request legitimate.`,
        difficulty: 0.55,
      };
    }
    const u1 = r.pick(["Amara", "Ben", "Chen"]), u2 = r.pick(["Dara", "Efe", "Fatima"]);
    return {
      prompt: `Two users choose the SAME password. The server stores:\n· ${u1}: hash(pw + salt1)\n· ${u2}: hash(pw + salt2), salt1 ≠ salt2\nWhy the different salts?`,
      correct: "Equal passwords produce different hashes, so a stolen table cannot reveal who shares a password",
      wrongs: pickDistinct("Equal passwords produce different hashes, so a stolen table cannot reveal who shares a password", [
        "Salts make the login faster for the server",
        "Salts are needed because hashing is reversible without them",
        "Each salt replaces the user's password before hashing",
      ]),
      tags: [],
      explanation: `Without salts, identical passwords give identical hashes — one glance at the stolen table exposes every account sharing it (and makes cracking worthwhile: break one, win many). A per-user salt means the attacker must attack each hash separately. The password is still hashed, still one-way; the salt just makes 'same password' stop LOOKING the same.`,
      difficulty: 0.65,
    };
  },

  /** Networks: which-layer-does-what, a packet-path trace, and a local vs
   *  global address read. */
  "networks": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const layers: Array<[string, string, string[]]> = [
        ["translates a website name into an IP address", "DNS", ["HTTPS", "The router", "The browser"]],
        ["encrypts the data travelling between browser and server", "HTTPS (TLS)", ["DNS", "The IP protocol", "HTML"]],
        ["forwards packets between your home network and the internet", "The router", ["DNS", "The browser", "The server"]],
      ];
      const [job, who, wrong] = layers[r.int(0, layers.length - 1)];
      return {
        prompt: `On the internet, what ${job}?`,
        correct: who,
        wrongs: pickDistinct(who, wrong),
        tags: [],
        explanation: `${who} — ${job.startsWith("translates") ? "names are for people, addresses are for machines; DNS is the translator between the two" : job.startsWith("encrypts") ? "TLS is the encryption layer that turns an open HTTP connection into an HTTPS one" : "the router is your network's doorway: it sends each packet one hop closer to its destination"}.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      return {
        prompt: `A web page is split into many packets that travel different routes to the same server. How does the receiver reassemble them correctly?`,
        correct: "Each packet carries sequence numbers — the receiver reorders them and requests any that are missing",
        wrongs: pickDistinct("Each packet carries sequence numbers — the receiver reorders them and requests any that are missing", [
          "The packets always arrive in order on the same route",
          "The last packet lists all the others by content",
          "The server resends the whole page if any packet is late",
        ]),
        tags: [],
        explanation: `Packet switching routes each packet independently — fast, and resilient to failed links, but out of order by design. Sequence numbers plus acknowledgements (TCP) put the stream back together; that reliability layer is what lets a fragile network carry an exact document.`,
        difficulty: 0.6,
      };
    }
    const ip = `192.168.${r.int(0, 9)}.${r.int(2, 250)}`;
    return {
      prompt: `A device on a home Wi-Fi has address ${ip}. A website's server answers from 93.184.216.34. What distinguishes the two addresses?`,
      correct: `${ip} is a private (local) address — it identifies the device only inside the home network; 93.184.216.34 is public and routable worldwide`,
      wrongs: pickDistinct(`${ip} is a private (local) address — it identifies the device only inside the home network; 93.184.216.34 is public and routable worldwide`, [
        `Both are equally public — the device could be reached directly from anywhere`,
        `${ip} is the server's real address, seen through a proxy`,
        `The server's address is private because websites protect themselves`,
      ]),
      tags: [],
      explanation: `Addresses beginning 192.168.x.x (and 10.x.x.x, 172.16–31.x.x) are reserved for private networks — millions of homes reuse them. Reaching the outside world, the router translates (NAT) to its ONE public address. The server needs a globally unique public address because anyone, anywhere must find it.`,
      difficulty: 0.7,
    };
  },

  /** Databases / SQL: a query to fetch exactly one thing, a filtering trace,
   *  and a primary-key reasoning item. */
  "databases-sql": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const col = r.pick(["name", "title", "email"]), tbl = r.pick(["students", "books", "members"]);
      const cmp = r.pick([[">", 80], [">=", 50], ["<", 20]]);
      return {
        prompt: `A table \`${tbl}\` has a \`${col}\` column and a \`grade\` column. Which query lists only \`${col}\` where grade is ${cmp[0]} ${cmp[1]}?`,
        correct: `SELECT ${col} FROM ${tbl} WHERE grade ${cmp[0]} ${cmp[1]}`,
        wrongs: pickDistinct(`SELECT ${col} FROM ${tbl} WHERE grade ${cmp[0]} ${cmp[1]}`, [
          `GET ${col} FROM ${tbl} IF grade ${cmp[0]} ${cmp[1]}`,
          `SELECT * WHERE grade ${cmp[0]} ${cmp[1]} FROM ${tbl}`,
          `SELECT ${col} WHERE ${tbl}.grade = ${cmp[1]}`,
        ]),
        tags: [],
        explanation: `SQL reads SELECT columns FROM table WHERE condition. GET/IF are not SQL; the FROM always precedes the WHERE; and = would keep only grades exactly ${cmp[1]} rather than the ${cmp[0]} ${cmp[1]} range.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const n = r.int(3, 6);
      return {
        prompt: `A table holds ${n} rows. You run:\nSELECT COUNT(*) FROM orders WHERE total > 10\nTwo of the rows have total = ${r.int(1, 9)}. What does the query return, and why?`,
        correct: `${n - 2} — COUNT(*) counts only the rows that pass the WHERE filter`,
        wrongs: pickDistinct(`${n - 2} — COUNT(*) counts only the rows that pass the WHERE filter`, [
          `${n} — WHERE cannot reduce a count`,
          "1 — COUNT always returns a single value of yes or no",
          `2 — the query counts the rows the filter removed`,
        ]),
        tags: [],
        explanation: `WHERE acts first, keeping only rows with total > 10; COUNT(*) then counts what survives: ${n} − 2 = ${n - 2}. Reading a query is reading its pipeline, left to right, clause by clause.`,
        difficulty: 0.55,
      };
    }
    const tbl = r.pick(["pupils", "orders", "films"]);
    return {
      prompt: `Why give every row of \`${tbl}\` a unique primary key?`,
      correct: "So any row can be addressed exactly once and other tables can reference it unambiguously",
      wrongs: pickDistinct("So any row can be addressed exactly once and other tables can reference it unambiguously", [
        "To make the table display in a nicer order",
        "To stop two users editing the database at once",
        "Because SQL refuses to store a table without one",
      ]),
      tags: [],
      explanation: `Names repeat (two pupils called Sam); a primary key cannot. It is the guarantee that 'the row with id 7' means exactly one thing — which is what lets another table point at it (a foreign key) without ambiguity. Uniqueness is identity, not cosmetics.`,
      difficulty: 0.58,
    };
  },

  /** AI basics: training-vs-running reasoning, a data-quality consequence,
   *  and a classification trace. */
  "ai-basics": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      return {
        prompt: `A spam filter was TRAINED on a million labelled emails. During use, it receives a new email. What does the model actually do with it?`,
        correct: "Applies the patterns it learned in training to decide spam or not — it does not keep learning from this email",
        wrongs: pickDistinct("Applies the patterns it learned in training to decide spam or not — it does not keep learning from this email", [
          "It retrains itself on the new email instantly",
          "It looks the email up in the million training emails",
          "It asks a human to decide, then remembers the answer",
        ]),
        tags: [],
        explanation: `Training and running are separate phases. After training, the model is FROZEN: its parameters encode the patterns of the million examples, and each new email is only classified against them. Learning from new emails is a deliberate retraining step, never a side effect of use.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      return {
        prompt: `A face-recognition model was trained only on photos taken in daylight. At night it fails badly. What is the lesson?`,
        correct: "A model only learns the distribution of its training data — conditions outside it are unpredictable",
        wrongs: pickDistinct("A model only learns the distribution of its training data — conditions outside it are unpredictable", [
          "The model needs a brighter camera, not better data",
          "The training data was too large, which causes overfitting to light",
          "Face recognition is impossible in principle at night",
        ]),
        tags: [],
        explanation: `The model never saw night photos, so it learned only daylight statistics — no amount of cleverness at run time recovers what the data never showed. Bias and brittleness in AI are usually data problems first.`,
        difficulty: 0.6,
      };
    }
    const spam = r.int(2, 8), ham = r.int(8, 20);
    return {
      prompt: `A classifier was tested on ${spam + ham} emails: it flagged ${spam} correctly as spam but also flagged ${Math.min(2, ham)} genuine emails. Which measure does the ${Math.min(2, ham)} false alarms damage most?`,
      correct: "Precision — how many of its spam flags were actually spam",
      wrongs: pickDistinct("Precision — how many of its spam flags were actually spam", [
        "Recall — how much spam it found",
        "Speed — it ran too slowly on the genuine ones",
        "Training size — the test set was too small to matter",
      ]),
      tags: [],
      explanation: `Precision is flagged-and-correct ÷ all flagged: ${spam} of ${spam + Math.min(2, ham)}, hurt directly by every false alarm. Recall (${spam} of ${spam + ham} spam emails) is about the spam it MISSED, which these false alarms do not change. Two different questions, two different measures — a false alarm is a precision problem.`,
      difficulty: 0.72,
    };
  },

  "rates-reaction": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const factor: Array<[string, string, string[], string]> = [
        ["raising the temperature", "Particles move faster AND more carry the minimum energy to react — both collision frequency and success rate rise", ["Particles only move faster — energy has no effect on success", "The activation energy of the reaction is lowered", "The particles become smaller, so they collide more"], "Temperature does two jobs: it raises collision frequency a little and the energy per collision a lot. The second is what matters — the fraction of collisions clearing the activation-energy bar climbs steeply, which is why ~10 °C roughly doubles many rates."],
        ["increasing the concentration", "More particles per unit volume — more collisions per second", ["Each particle carries more energy", "The activation energy drops", "The particles get closer to the required orientation"], "Concentration packs more reactant particles into the same volume. Collision FREQUENCY rises; the energy of each collision does not change. (A common confusion with temperature, which changes the energy instead.)"],
      ];
      const [change, why, wrong] = factor[r.int(0, factor.length - 1)];
      return {
        prompt: `A reaction speeds up after ${change}. Explain the effect using collision theory.`,
        correct: why,
        wrongs: pickDistinct(why, wrong),
        tags: [],
        explanation: `${why}. Collision theory reduces every rate change to two dials: how OFTEN particles collide, and what FRACTION of those collisions carry enough energy in the right orientation. Every rate factor works through one or both.`,
        difficulty: 0.6,
      };
    }
    if (variant < 0.67) {
      const steep = r.pick(["powdered marble", "warm acid", "concentrated acid"]);
      return {
        prompt: `Gas volume against time for marble + acid:\n· Curve P: rises steeply, then flattens at 60 cm³ after 40 s\n· Curve Q: rises gently, flattens at 60 cm³ after 120 s\nWhich curve used ${steep}, and how do you know?`,
        correct: "P — the steeper start means a faster rate; both flatten at the same volume, so the same amount of product formed",
        wrongs: pickDistinct("P — the steeper start means a faster rate; both flatten at the same volume, so the same amount of product formed", [
          "Q — the flatter curve shows more control, so more gas was made",
          "P — it reached a higher final volume",
          "Q — slower always means less product in the end",
        ]),
        tags: [],
        explanation: `The GRADIENT at the start is the rate; the PLATEAU is the total product. ${steep.charAt(0).toUpperCase() + steep.slice(1)} changes only how fast the same reaction runs, so both curves end at 60 cm³ — same reactant amounts. Reading a rate curve is exactly this two-step: gradient for speed, plateau for yield.`,
        difficulty: 0.7,
      };
    }
    const t1 = r.pick([20, 25]), t2 = t1 + 10;
    return {
      prompt: `The same mass of magnesium ribbon reacts with the same acid:\n· at ${t1} °C, 100 cm³ of gas collects in 80 s\n· at ${t2} °C, 100 cm³ collects in 40 s\nWhat does the comparison show about rate and temperature?`,
      correct: `The rate at ${t2} °C is double — a 10 °C rise roughly doubles the rate of many reactions`,
      wrongs: pickDistinct(`The rate at ${t2} °C is double — a 10 °C rise roughly doubles the rate of many reactions`, [
        `The rate quadrupled — rate scales with the square of temperature`,
        `The final volume doubles at the higher temperature`,
        `Temperature has no real effect until the acid boils`,
      ]),
      tags: [],
      explanation: `Same gas volume means the same reaction has run to completion; only the TIME halved, so the mean rate doubled (100/80 → 100/40 cm³/s). The often-quoted rule of thumb — about twice the rate per 10 °C — comes from the steep rise in the fraction of collisions clearing the activation energy.`,
      difficulty: 0.74,
    };
  },

  /** Circulation: the double loop traced end to end, a vessel-structure
   *  reasoning item, and a composition comparison. */
  "circulation": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const stops: Array<[string, string, string[]]> = [
        ["the body's organs", "vena cava → right atrium", ["aorta → left atrium", "pulmonary vein → right atrium", "pulmonary artery → left ventricle"]],
        ["the lungs", "pulmonary artery → pulmonary vein", ["vena cava → aorta", "aorta → vena cava", "pulmonary vein → pulmonary artery"]],
      ];
      const [to, path, wrong] = stops[r.int(0, stops.length - 1)];
      return {
        prompt: `Trace one full pass of a red blood cell from the heart to ${to} and back to the heart. Which vessels, in order?`,
        correct: path,
        wrongs: pickDistinct(path, wrong),
        tags: [],
        explanation: `${path} — the double circulation means blood passes through the heart TWICE per full circuit: once to be sent to the lungs, once to be sent to the body. Arteries always leave the heart; veins always return. The pulmonary vessels are the naming exception (they carry blood to/from the lungs, oxygenated or not).`,
        difficulty: 0.62,
      };
    }
    if (variant < 0.67) {
      return {
        prompt: `Capillaries are one cell thick; arteries have thick, elastic, muscular walls. Match each structure to its function.`,
        correct: "Thin capillaries exchange fast; thick arteries withstand high pressure",
        wrongs: pickDistinct("Thin capillaries exchange fast; thick arteries withstand high pressure", [
          "Both walls exist to stop blood leaking",
          "Thin capillaries carry more blood; thick arteries carry less",
          "Arteries are thick to store blood; capillaries are thin to save material",
        ]),
        tags: [],
        explanation: `Structure follows function in both cases. Exchange (oxygen, CO₂, glucose) needs a SHORT diffusion distance — hence one cell thick, and huge total surface from being so numerous. Arteries take the heart's pulse full-force: elastic walls stretch and recoil to smooth it. Each wall is exactly what its job requires.`,
        difficulty: 0.6,
      };
    }
    const rate = r.int(65, 75), ex = rate * 2;
    return {
      prompt: `A student's resting heart rate is ${rate} bpm; during exercise it rises to ${ex} bpm. What does the increase deliver?`,
      correct: "More oxygen and glucose to the muscles per second, and faster CO₂ removal",
      wrongs: pickDistinct("More oxygen and glucose to the muscles per second, and faster CO₂ removal", [
        "More red blood cells in the blood overall",
        "A higher blood pressure only — flow rate stays the same",
        "Extra blood volume produced by the heart",
      ]),
      tags: [],
      explanation: `Cardiac output = rate × volume per beat. Doubling the rate roughly doubles the delivery of oxygen and glucose to working muscle and the clearance of CO₂ — the supply chain matching demand. The blood's composition does not change; its FLOW does.`,
      difficulty: 0.7,
    };
  },

  // ── CHEMISTRY ──────────────────────────────────────────────────────────────

  /** Neutralisation products for four acid–alkali pairs, the strength-vs-
   *  concentration distinction that pH questions live and die by, and a
   *  dilution calculation where the pH shift has to be worked, not guessed. */
  "acids-bases": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const pairs: Array<[string, string, string[]]> = [
        ["HCl + NaOH", "NaCl + H₂O", ["NaCl + H₂", "NaOH + Cl₂", "Na₂Cl + H₂O"]],
        ["HNO₃ + KOH", "KNO₃ + H₂O", ["KNO₃ + H₂", "KOH + NO₃", "K₂NO₃ + H₂O"]],
        ["H₂SO₄ + 2NaOH", "Na₂SO₄ + 2H₂O", ["NaSO₄ + 2H₂O", "Na₂SO₄ + H₂", "Na₂S + 2H₂O"]],
        ["2HCl + Ca(OH)₂", "CaCl₂ + 2H₂O", ["CaCl + 2H₂O", "CaCl₂ + H₂", "Ca₂Cl + H₂O"]],
      ];
      const [reactants, products, wrong] = pairs[r.int(0, pairs.length - 1)];
      return {
        prompt: `Complete the neutralisation: ${reactants} → ?`,
        correct: products,
        wrongs: pickDistinct(products, wrong),
        tags: [],
        explanation: `Acid + alkali → salt + water, always: H⁺ + OH⁻ → H₂O while the remaining ions pair up as the salt. Check every element balances before moving on — the salt here is ${products.split(" +")[0]}.`,
        difficulty: 0.35,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["A: 1.0 mol/dm³ ethanoic acid (weak). B: 0.001 mol/dm³ hydrochloric acid (strong). Which has the LOWER pH?",
          "B — it is fully ionised despite being dilute, so its H⁺ concentration is higher",
          ["A — more acid molecules always means more H⁺ ions",
            "They have the same pH — both are acids",
            "Neither — a weak acid is neutral until concentrated"]],
        ["A: 0.1 mol/dm³ HCl (strong). B: 0.1 mol/dm³ ammonia solution (weak base). Which has the LOWER pH?",
          "A — the strong acid releases far more H⁺ than the weak base releases OH⁻",
          ["B — bases always have the lower pH in equal concentrations",
            "They have the same pH — the concentrations match",
            "Neither — a weak base cancels a strong acid exactly"]],
      ];
      const [prompt, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["strong-conc"],
        explanation: `${answer}. pH tracks the H⁺ concentration IN solution. Strength (how completely the acid ionises) and concentration (how much you dissolved) are independent dials — which is why a dilute strong acid can beat a concentrated weak one.`,
        difficulty: 0.55,
      };
    }
    const shift: Record<number, number> = { 10: 1, 100: 2, 1000: 3 };
    const df = r.pick([10, 100, 1000]);
    const pH0 = r.pick([1, 2, 3]);
    const pH1 = pH0 + shift[df];
    return {
      prompt: `An acid of pH ${pH0} is diluted to ${df}× its original volume. What is the new pH?`,
      correct: `pH ${pH1}`,
      wrongs: pickDistinct(`pH ${pH1}`, [
        `pH ${pH0} — dilution does not change pH`,
        `pH ${pH0 * 2} — pH doubles with the concentration`,
        `The solution is no longer acidic, so it has no pH`,
      ]),
      tags: [],
      explanation: `[H⁺] falls by a factor of ${df}, and each ×10 drop in concentration is one pH unit: pH ${pH0} → pH ${pH1}. The solution is more dilute but still acidic — pH only reaches 7 at exact neutralisation.`,
      difficulty: 0.7,
    };
  },

  /** Electrolysis: products from four molten salts, the aqueous cases where
   *  water competes, and reading a half-equation for what it says. */
  "electrolysis": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const salts: Array<[string, string, string, string[]]> = [
        ["molten NaCl", "sodium", "chlorine",
          ["hydrogen at the cathode, oxygen at the anode", "sodium at the anode, chlorine at the cathode", "nothing — molten salts do not conduct"]],
        ["molten KBr", "potassium", "bromine",
          ["hydrogen at the cathode, oxygen at the anode", "potassium at the anode, bromine at the cathode", "potassium hydroxide at both electrodes"]],
        ["molten Al₂O₃", "aluminium", "oxygen",
          ["oxygen at the cathode, aluminium at the anode", "carbon at both electrodes — the electrodes always take part", "hydrogen at the cathode, oxygen at the anode"]],
        ["molten MgCl₂", "magnesium", "chlorine",
          ["hydrogen at the cathode, chlorine at the anode", "magnesium at the anode, chlorine at the cathode", "nothing — the ions are held rigid in the melt"]],
      ];
      const [electrolyte, cath, an, wrong] = salts[r.int(0, salts.length - 1)];
      return {
        prompt: `Predict the products when ${electrolyte} is electrolysed.`,
        correct: `${cath} at the cathode, ${an} at the anode`,
        wrongs: pickDistinct(`${cath} at the cathode, ${an} at the anode`, wrong),
        tags: [],
        explanation: `In a MOLTEN salt the only ions present are the metal's cations and the non-metal's anions — no water to compete. Cations are attracted to the negative cathode and GAIN electrons; anions go to the positive anode and LOSE them. Hydrogen and oxygen products only appear once the electrolyte is aqueous.`,
        difficulty: 0.4,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["concentrated aqueous NaCl", "the cathode product is hydrogen",
          ["the cathode product is sodium — Na⁺ is the only metal ion present",
            "the cathode product is oxygen — water never wins at the cathode",
            "nothing forms at the cathode — water blocks the ions"]],
        ["dilute aqueous NaCl", "the anode product is oxygen",
          ["the anode product is chlorine — chloride always discharges first",
            "the anode product is hydrogen — gases swap sides when dilute",
            "nothing forms at the anode — dilution stops conduction"]],
      ];
      const [electrolyte, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `During electrolysis of ${electrolyte}, water is present alongside the salt ions. Which product shows water competing?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. In aqueous electrolysis there is a contest: between metal cations and H⁺ at the cathode (the LESS reactive element wins — which is why sodium, being highly reactive, stays in solution while hydrogen bubbles off), and between halide ions and OH⁻ at the anode, decided by concentration.`,
        difficulty: 0.6,
      };
    }
    const eqs: Array<[string, string, string[]]> = [
      ["2Cl⁻ → Cl₂ + 2e⁻", "oxidation — the chloride ions lose electrons at the anode",
        ["reduction — electrons appear as products, so they are gained", "neither — half-equations show no electron transfer", "reduction — chlorine gas always means reduction"]],
      ["Cu²⁺ + 2e⁻ → Cu", "reduction — the copper ions gain electrons at the cathode",
        ["oxidation — copper is a metal, and metals always oxidise", "neither — the charge is balanced, so no electrons moved", "oxidation — the ion is losing its charge"]],
      ["2H⁺ + 2e⁻ → H₂", "reduction — hydrogen ions gain electrons at the cathode",
        ["oxidation — hydrogen gas escaping is a loss from the solution", "neither — hydrogen is not a metal ion", "oxidation — two electrons is a transfer, so it must be oxidation"]],
    ];
    const [eq, answer, wrong] = eqs[r.int(0, eqs.length - 1)];
    return {
      prompt: `A half-equation from electrolysis: ${eq}. Is this oxidation or reduction, and at which electrode does it happen?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. OIL RIG: Oxidation Is Loss, Reduction Is Gain — of electrons. The electrode follows automatically: electrons are SUPPLIED at the cathode (so gains happen there) and removed at the anode (so losses happen there).`,
      difficulty: 0.55,
    };
  },

  /** The periodic table: three declared trends with their reasons, reading a
   *  group off a configuration, and melting-point data down a group. */
  "periodic-table": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const trends: Array<[string, string, string[], string]> = [
        ["Going DOWN group 1 (Li → Na → K), how does reactivity change, and why?",
          "It increases — the outer electron is further from the nucleus and lost more easily",
          ["It decreases — heavier atoms react more slowly",
            "It stays the same — every group 1 atom has one outer electron",
            "It increases then decreases — the trend peaks at sodium"], "group-trend"],
        ["Going DOWN group 7 (F → Cl → Br → I), how does reactivity change, and why?",
          "It decreases — the outer shell is further out, so attracting one more electron is harder",
          ["It increases — bigger atoms have more electrons to react with",
            "It stays the same — every halogen has seven outer electrons",
            "It decreases because halogens get lighter down the group"], "group-trend"],
        ["Going ACROSS period 3 (Na → Mg → Al → Si → P → S → Cl), how does metallic character change?",
          "It decreases — elements go from metals that lose electrons to non-metals that gain them",
          ["It increases — atoms gain electrons across the period",
            "It stays the same — nuclear charge and shielding cancel",
            "It increases then decreases — metals sit at both ends"], ""],
      ];
      const [prompt, answer, wrong, tag] = trends[r.int(0, trends.length - 1)];
      return {
        prompt,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: tag ? [tag] : [],
        explanation: `${answer}. Group trends run on shells: each step down adds shielding, which either eases electron LOSS (group 1) or weakens the pull that GAINS one (group 7) — opposite directions, opposite groups. Exams love that inversion.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const configs: Array<[string, string, string, string[]]> = [
        ["2, 7", "group 7", "gain one electron to form a 1− ion",
          ["group 2 — it needs two more shells", "group 17, so it is a transition metal", "gain seven electrons to complete a new shell"]],
        ["2, 8, 2", "group 2", "lose two electrons to form a 2+ ion",
          ["group 8 — the outer shell is nearly full", "lose seven electrons to reach a full shell", "gain two electrons to form a 2− ion"]],
        ["2, 8, 6", "group 6", "gain two electrons to form a 2− ion",
          ["group 16, because six electrons are LOST first", "lose six electrons to reach a full inner shell", "gain six electrons to complete the outer shell"]],
      ];
      const [cfg, group, action, wrong] = configs[r.int(0, configs.length - 1)];
      return {
        prompt: `An element has the electron configuration ${cfg}. Which group is it in, and what does it do in reactions?`,
        correct: `${group} — it will ${action}`,
        wrongs: pickDistinct(`${group} — it will ${action}`, wrong),
        tags: [],
        explanation: `${group} — it will ${action}. The number of OUTER electrons gives the group number, and the chemistry follows: fewer than four outer electrons are easier to lose, more than four are easier to gain. Atoms react toward a full outer shell — the cheap way, not the long way.`,
        difficulty: 0.55,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["melting point FALLS steadily down group 1 (Li 181 °C → Na 98 °C → K 63 °C)",
        "The metallic bonds weaken as the atoms get bigger — the outer electron is further from each nucleus",
        ["The atoms get heavier, and heavier things melt at lower temperatures",
          "The nuclei shrink down the group, pulling the structure apart",
          "Group 1 metals are impure at the bottom of the group"]],
      ["boiling point RISES steadily down group 7 (Cl₂ −34 °C → Br₂ 59 °C → I₂ 184 °C)",
        "The molecules get bigger, so the intermolecular forces between them strengthen",
        ["The covalent bonds get stronger down the group",
          "Heavier molecules are denser, and density raises boiling point",
          "The bonds between molecules get shorter and stronger"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `The table shows a trend: ${obs}. Which explanation accounts for the data?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. The data-reading step is separating what holds each PARTICLE together (metallic or covalent bonds) from what holds neighbouring particles together (forces between particles). Melting and boiling only ever break the second kind — which is why a giant structure melts at hundreds of degrees while a small molecule's forces give way far sooner.`,
      difficulty: 0.78,
    };
  },

  /** Compounds vs mixtures across six real materials, separation-technique
   *  matching, and a boiling/chromatography data read that separates pure
   *  from impure. */
  "compounds-mixtures": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const items: Array<[string, string, string[]]> = [
        ["brass (copper + zinc)", "a mixture — the metals are not bonded and keep their own properties",
          ["a compound — alloys are chemically combined", "an element — brass appears on some periodic tables", "a pure substance with a fixed formula"]],
        ["carbon dioxide", "a compound — the elements are chemically bonded in a fixed ratio",
          ["a mixture — carbon and oxygen are simply mixed", "an element — it is written with one symbol group", "a solution of carbon in oxygen"]],
        ["seawater", "a mixture — salt dissolved in water, separable by evaporation",
          ["a compound of sodium, chlorine, hydrogen and oxygen", "an element because it is uniform throughout", "a pure substance with a sharp boiling point"]],
        ["air", "a mixture — its components are not bonded and are separable physically",
          ["a compound of nitrogen and oxygen", "an element", "a compound because the proportions stay constant"]],
        ["sodium chloride", "a compound — Na and Cl are bonded in a fixed 1:1 ratio",
          ["a mixture — it contains two different elements", "an element because the crystal is uniform", "a solution of sodium in chlorine"]],
        ["concrete (cement, sand, aggregate)", "a mixture — its parts are just mingled, not bonded",
          ["a compound with the formula of cement", "an element — it is one solid material", "a pure substance because its composition is specified"]],
      ];
      const [material, answer, wrong] = items[r.int(0, items.length - 1)];
      return {
        prompt: `Classify: ${material}.`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The test is whether the components are CHEMICALLY BONDED in a fixed ratio (compound) or merely mingled with no bonds between them (mixture). Mixtures keep the properties of their parts and come apart by physical means — distillation, magnets, evaporation. Compounds need a chemical reaction to separate.`,
        difficulty: 0.3,
      };
    }
    if (variant < 0.67) {
      const jobs: Array<[string, string, string[]]> = [
        ["sand settled in water", "filtration — the insoluble solid is caught, the liquid passes",
          ["evaporation — boil off everything and keep the sand", "distillation — the sand condenses first", "chromatography — the sand particles separate by size"]],
        ["pure water from salt solution", "simple distillation — the solvent boils off and is condensed",
          ["filtration — the salt is too large to pass the paper", "chromatography — the salt travels up the paper", "decanting — the salt sinks and is poured off"]],
        ["ethanol from an ethanol–water mixture", "fractional distillation — the liquids boil at different temperatures",
          ["filtration — ethanol passes, water is trapped", "evaporation — the water is boiled away, leaving ethanol", "magnetism — ethanol is attracted, water is not"]],
        ["the dyes in a food colouring", "chromatography — the dyes travel different distances on the paper",
          ["distillation — each dye boils at its own temperature", "filtration — the dyes differ in particle size", "evaporation — each dye crystallises separately"]],
        ["iron filings mixed with sulfur powder", "a magnet — only the iron is attracted",
          ["dissolving — the sulfur dissolves, the iron does not", "heating — the iron melts first", "chromatography — the two powders separate on paper"]],
        ["pure copper sulfate crystals from its solution", "crystallisation — evaporate some solvent, then let the solution cool",
          ["distillation — the crystals condense in the delivery tube", "filtration — the dissolved crystals are caught by paper", "chromatography — the blue dye is separated from water"]],
      ];
      const [task, answer, wrong] = jobs[r.int(0, jobs.length - 1)];
      return {
        prompt: `You must separate ${task}. Which technique fits, and why?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Separation always exploits a DIFFERENCE: in solubility (filtration, crystallisation), in boiling point (distillation), in attraction to a stationary phase (chromatography) or in magnetism. Name the difference a technique needs before picking it.`,
        difficulty: 0.5,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["Substance P boils gradually over the range 78–102 °C. Substance Q boils sharply at 100 °C.",
        "P is a mixture — a boiling RANGE is the signature of mixed components",
        ["P is pure — a wide boiling range means one substance with many bonds",
          "Q is a mixture — sharp points are unstable and always mean contamination",
          "Both are pure — the difference is just sample size"]],
      ["A chromatogram shows spot 1 with ONE dot; spot 2 with THREE dots at different heights.",
        "Sample 1 is pure — one dye present; sample 2 is a mixture of three",
        ["Sample 1 is impure — a single dot means the dye failed to move",
          "Sample 2 is pure — more dots mean a more strongly bonded substance",
          "Both are pure — the number of dots depends only on the solvent"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `Interpret the evidence: ${obs}. What follows?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Purity has an operational definition, not a cosmetic one: a pure substance melts and boils at a SHARP temperature and shows exactly one chromatographic spot. Ranges and extra dots are each components making their own presence felt.`,
      difficulty: 0.75,
    };
  },

  /** Electron configurations for five elements, reading group and chemistry
   *  off a configuration, and isoelectronic ion identification. */
  "electron-shells": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const elements: Array<[string, number, string, string[]]> = [
        ["Oxygen (8 electrons)", 8, "2, 6", ["2, 8", "2, 6, 2", "2, 5, 1"]],
        ["Magnesium (12 electrons)", 12, "2, 8, 2", ["2, 10", "2, 8, 2, 0", "2, 9, 1"]],
        ["Silicon (14 electrons)", 14, "2, 8, 4", ["2, 12", "2, 8, 8", "2, 8, 2, 2"]],
        ["Phosphorus (15 electrons)", 15, "2, 8, 5", ["2, 13", "2, 8, 8", "2, 8, 4, 1"]],
        ["Sulfur (16 electrons)", 16, "2, 8, 6", ["2, 14", "2, 8, 8", "2, 8, 5, 1"]],
      ];
      const [name, z, correct, wrong] = elements[r.int(0, elements.length - 1)];
      return {
        prompt: `${name}. What is its electron configuration?`,
        correct,
        wrongs: pickDistinct(correct, wrong),
        tags: [],
        explanation: `${correct}. Fill the shells in order — 2, then 8, then 8 — and whatever remains lands in the outer shell. ${z} electrons: 2 + 8 = 10 in the inner shells, so the outer shell holds ${z - 10}.`,
        difficulty: 0.35,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["2, 8, 1", "period 3, group 1 — one easily lost outer electron, so it forms 1+ ions and reacts vigorously with water",
          ["period 8, group 3 — the outer shell defines the period",
            "period 3, group 8 — eleven electrons make it a noble gas",
            "period 2, group 1 — only shells beyond the first count"]],
        ["2, 8, 7", "period 3, group 7 — one electron short of a full shell, so it forms 1− ions and reacts with metals",
          ["period 7, group 3 — seven shells, three outer electrons",
            "period 3, group 8 — seven outer electrons is nearly full, so it is inert",
            "period 17, group 7 — the group number is the shell count"]],
        ["2, 8, 8, 2", "period 4, group 2 — two outer electrons to lose, so it forms 2+ ions",
          ["period 2, group 8 — four shells means period 8",
            "period 4, group 8 — the outer shell is nearly full",
            "period 4, group 18 — twenty electrons make a noble gas"]],
      ];
      const [cfg, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `An element has the electron configuration ${cfg}. Where does it sit in the periodic table, and what chemistry follows?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Shells give the PERIOD (which row); outer electrons give the GROUP (which column) — two independent readings of one configuration, and both drive the chemistry.`,
        difficulty: 0.55,
      };
    }
    const ions: Array<[string, string, string[]]> = [
      ["charge 1+, configuration 2, 8", "a sodium atom — it lost its one outer electron",
        ["a neon atom — the configuration matches neon exactly", "a chlorine atom — it lost seven electrons", "a potassium atom — it lost its outer shell entirely"]],
      ["charge 2+, configuration 2, 8", "a magnesium atom — it lost its two outer electrons",
        ["an oxygen atom — it gained two electrons", "an argon atom — the charge cancels its shells", "a calcium atom — it lost its inner shells"]],
      ["charge 2−, configuration 2, 8", "an oxygen atom — it gained two electrons into its outer shell",
        ["a magnesium atom — gaining two makes the charge 2−", "a neon atom — noble gases always carry 2− charges", "a fluorine atom — it gained seven electrons"]],
      ["charge 1−, configuration 2, 8, 8", "a chlorine atom — it gained one electron into its outer shell",
        ["an argon atom — it gained one to complete the set", "a potassium atom — it gained a whole extra shell", "a sodium atom — it gained one electron"]],
    ];
    const [obs, answer, wrong] = ions[r.int(0, ions.length - 1)];
    return {
      prompt: `An ion is found with configuration ${obs}. Which atom produced it, and how?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Ions form by gaining or losing OUTER electrons only — the inner shells never move. Match the ion's configuration back to the neutral atom whose proton count fits the charge: same configuration, different proton number, and the charge tells you which way the electrons travelled. Reaching a noble-gas configuration is exactly why ions form.`,
      difficulty: 0.75,
    };
  },

  /** Covalent bonding: counting shared pairs, matching structure type to
   *  property, and a boiling-point table that separates intermolecular forces
   *  from covalent bonds. */
  "covalent-bonding": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const molecules: Array<[string, string, string[]]> = [
        ["one molecule of H₂O", "two — oxygen shares one pair with each hydrogen",
          ["one — the two hydrogens share a single pair between them", "four — oxygen bonds to everything twice", "none — water is ionic, so electrons transfer"]],
        ["one molecule of CH₄", "four — one shared pair with each of the four hydrogens",
          ["one — the four hydrogens share one pair around the ring", "eight — carbon bonds twice to each hydrogen", "none — methane is held by electrostatic force alone"]],
        ["one molecule of N₂", "three — a triple bond of three shared pairs",
          ["one — nitrogen atoms share a single pair", "two — a double bond, like oxygen", "none — nitrogen's outer shells are already full"]],
        ["one molecule of O₂", "two — a double bond of two shared pairs",
          ["one — oxygen shares a single pair", "three — oxygen needs a triple bond to be stable", "none — oxygen atoms transfer electrons to each other"]],
        ["one molecule of NH₃", "three — nitrogen shares one pair with each of three hydrogens, with a lone pair left over",
          ["four — nitrogen bonds to the three hydrogens and itself", "one — the three hydrogens share a single pair", "none — ammonia conducts, so it must be ionic"]],
      ];
      const [mol, answer, wrong] = molecules[r.int(0, molecules.length - 1)];
      return {
        prompt: `How many shared pairs of electrons bond ${mol}?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. A single covalent bond IS one shared pair; a double bond is two and a triple is three. Count each atom's unpaired outer electrons — shared pairs appear where unpaired electrons from different atoms meet, and each atom ends with a full outer shell.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["Iodine is a solid at room temperature but boils at only 184 °C, far below metals.",
          "Simple molecular — weak forces between I₂ molecules are all that melting or boiling must break",
          ["Giant covalent — iodine's network of bonds breaks at high cost",
            "Metallic — iodine's electron sea is weak for a metal",
            "Ionic — the I₂ lattice breaks into charged particles"]],
        ["Diamond has a melting point of over 3500 °C and does not conduct.",
          "Giant covalent — every carbon is bonded into a rigid network with no free charges",
          ["Simple molecular — diamond is just very large molecules touching",
            "Metallic — diamond's free electrons hold it together",
            "Ionic — carbon ions lock into a lattice"]],
        ["Graphite conducts electricity and shears into flat sheets, despite being pure carbon like diamond.",
          "Giant covalent with delocalised electrons — each carbon bonds to only three others, leaving one free to move",
          ["Ionic — the carbon ions slide past each other and carry charge",
            "Simple molecular — small carbon molecules slide easily and conduct",
            "Metallic — graphite is technically a metal, which explains both properties"]],
      ];
      const [obs, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${obs} What structure type explains the behaviour?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Structure type is read from property fingerprints: low boiling point plus no conduction = simple molecular; huge melting point plus no conduction = giant covalent (all atoms locked in); huge melting point plus conduction = giant metallic (locked atoms, mobile electrons).`,
        difficulty: 0.6,
      };
    }
    const trend = r.int(0, 1);
    const obs = trend === 0
      ? "Boiling points of the halogens: Cl₂ −34 °C, Br₂ 59 °C, I₂ 184 °C."
      : "Boiling points of the first alkanes: CH₄ −162 °C, C₂H₆ −89 °C, C₃H₈ −42 °C.";
    return {
      prompt: `${obs} The molecules all get heavier down the series. Why does the boiling point rise?`,
      correct: "Bigger molecules have stronger intermolecular forces — more surface for attraction between neighbours",
      wrongs: pickDistinct("Bigger molecules have stronger intermolecular forces — more surface for attraction between neighbours", [
        "The covalent bonds inside the molecules get stronger down the series",
        "Heavier molecules sink, and pressure at the bottom raises the boiling point",
        "Bigger molecules have more electrons free to conduct, which heats them",
      ]),
      tags: [],
      explanation: `Boiling breaks the forces BETWEEN molecules, never the covalent bonds INSIDE them — the molecules leave intact. Larger molecules present more contact surface, so their intermolecular attraction climbs, and more energy is needed to separate them. This is why ${trend === 0 ? "solid iodine still vapourises as whole I₂ molecules" : "long-chain alkanes are thick liquids while short ones are gases"}.`,
      difficulty: 0.75,
    };
  },

  /** Balancing across five equations including one with brackets, and the
   *  conservation reasoning a mock-balanced equation exposes, plus a mole
   *  ratio read. */
  "equations-stoich": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const eqs: Array<[string, string, string[]]> = [
        ["__ H₂ + O₂ → __ H₂O", "2 and 2", ["1 and 1", "2 and 1", "4 and 2"]],
        ["__ Mg + O₂ → __ MgO", "2 and 2", ["1 and 1", "2 and 1", "4 and 4"]],
        ["__ Al + __ Cl₂ → AlCl₃", "2 and 3", ["3 and 2", "1 and 1", "2 and 2"]],
        ["__ Fe + O₂ → __ Fe₂O₃", "4 and 3", ["3 and 4", "2 and 3", "1 and 1"]],
        ["__ C₃H₈ + __ O₂ → 3CO₂ + 4H₂O", "1 and 5", ["1 and 3", "3 and 5", "1 and 7"]],
      ];
      const [blank, correct, wrong] = eqs[r.int(0, eqs.length - 1)];
      return {
        prompt: `Balance: ${blank}`,
        correct: `${correct}`,
        wrongs: pickDistinct(`${correct}`, wrong),
        tags: ["mass-balance"],
        explanation: `Balance element by element, saving H and O for last (they usually appear in more places). Atoms are only ever rearranged — coefficients multiply whole formulas, subscripts never change. Check by counting each element on both sides.`,
        difficulty: 0.4,
      };
    }
    if (variant < 0.67) {
      const mocks: Array<[string, string, string[]]> = [
        ["A student writes H₂ + O₂ → H₂O₂ for water forming.",
          "The atoms balance but the formula is wrong — H₂O₂ is hydrogen peroxide, not water; subscripts may never be altered to balance",
          ["It is valid — the atoms balance, so the equation is correct",
            "It only needs different coefficients to become correct",
            "It is valid because the charges balance"]],
        ["A student balances Mg + O₂ → MgO as 2Mg + O₂ → 2MgO, then writes the total mass of products is 2 × the mass of reactants.",
          "Mass is conserved, not doubled — the same atoms are present, just rearranged, so product mass EQUALS reactant mass",
          ["Correct — two products must weigh twice as much",
            "Correct — oxygen adds mass, so products always gain",
            "Wrong because mass is lost as light and heat during the reaction"]],
        ["A student writes 2H₂ + O₂ → 2H₂O and claims 4 g of hydrogen gives 36 g of water.",
          "Correct — the 2:1:2 ratio means 4 g H₂ (2 mol) forms 2 mol × 18 g = 36 g of water",
          ["Wrong — you cannot start from grams, only from volume",
            "Wrong — 4 g of hydrogen gives 18 g of water, half",
            "Correct — but only because oxygen is diatomic"]],
      ];
      const [claim, answer, wrong] = mocks[r.int(0, mocks.length - 1)];
      return {
        prompt: claim,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["mass-balance"],
        explanation: `${answer}. Conservation of mass is the law behind every balanced equation: no atom appears or vanishes, so total mass is IDENTICAL on both sides. Coefficients change the NUMBER of each species, never what it is made of.`,
        difficulty: 0.6,
      };
    }
    const ratios: Array<[string, string, string, string[]]> = [
      ["2H₂ + O₂ → 2H₂O", "4 mol of H₂", "8 mol of water",
        ["2 mol of water — one water per two hydrogens", "4 mol of water — the ratio is 1:1", "16 mol of water — double the hydrogen gives quadruple"]],
      ["N₂ + 3H₂ → 2NH₃", "9 mol of H₂", "6 mol of ammonia",
        ["9 mol of ammonia — every hydrogen becomes ammonia", "3 mol of ammonia — divide by three twice", "18 mol of ammonia — multiply by two twice"]],
      ["CH₄ + 2O₂ → CO₂ + 2H₂O", "0.5 mol of CH₄", "1 mol of CO₂",
        ["0.5 mol of CO₂ — halve everything", "2 mol of CO₂ — carbon dioxide always doubles", "1 mol of H₂O — the carbon becomes water"]],
    ];
    const [eq, given, answer, wrong] = ratios[r.int(0, ratios.length - 1)];
    return {
      prompt: `In ${eq}, what amount of product forms from ${given} (the other reactant in excess)?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Moles scale by the COEFFICIENTS, never by the masses: read the ratio straight off the balanced equation, multiply through, and the limiting reactant decides how far the reaction runs.`,
      difficulty: 0.7,
    };
  },

  /** Endothermic vs exothermic across three real reactions, energy-profile
   *  reading, and bond-energy arithmetic that decides ΔH. */
  "energy-changes": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const rxns: Array<[string, string, string[]]> = [
        ["thermal decomposition of calcium carbonate", "endothermic — it only proceeds while constantly heated, absorbing energy",
          ["exothermic — limestone gives out heat as it breaks up", "neither — decomposition is just a physical change", "exothermic, because all reactions release energy"]],
        ["combustion of methane", "exothermic — it heats its surroundings; the flame is the evidence",
          ["endothermic — fuels need igniting, so they absorb energy first", "neither — burning is a physical change", "endothermic, because carbon dioxide is more stable"]],
        ["dissolving ammonium nitrate in water (the flask cools)", "endothermic — the temperature drop shows it took energy from the water",
          ["exothermic — cold packs always give out energy", "neither — dissolving has no energy change", "exothermic — the salt's lattice stores the heat"]],
        ["a hand-warmer crystallising sodium ethanoate", "exothermic — crystallisation releases the energy the solution absorbed",
          ["endothermic — crystallisation always takes in heat", "neither — state changes carry no energy", "endothermic — the pack gets warm only from friction"]],
      ];
      const [rxn, answer, wrong] = rxns[r.int(0, rxns.length - 1)];
      return {
        prompt: `${rxn}. Exothermic or endothermic, and what is the evidence?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The direction is read from TEMPERATURE: surroundings warm → energy released (exothermic); surroundings cool → energy absorbed (endothermic). Every reaction needs activation energy to START — that says nothing about the net direction.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const profiles: Array<[string, string, string[]]> = [
        ["an energy diagram where the products sit LOWER than the reactants and the curve must climb before it descends",
          "Exothermic overall, and the climb is the activation energy",
          ["Endothermic overall — the climb shows energy being absorbed",
            "Exothermic, and the climb is the energy released",
            "No net change — the climb and descent cancel"]],
        ["an energy diagram where the products sit HIGHER than the reactants",
          "Endothermic — the products absorbed the difference from the surroundings",
          ["Exothermic — higher means more energy released",
            "Either — the diagram alone cannot decide the direction",
            "Neither — the reaction must be at equilibrium"]],
      ];
      const [obs, answer, wrong] = profiles[r.int(0, profiles.length - 1)];
      return {
        prompt: `You are shown ${obs}. What does the diagram show?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The RELATIVE heights of reactants and products decide the direction — down means released, up means absorbed. The hump between them is the activation energy either way, and it is independent of the net change: a catalyst lowers the hump, never the heights.`,
        difficulty: 0.55,
      };
    }
    const sets: Array<[number[], number[], string[]]> = [
      [[436, 436], [672, 436], ["The reaction is exothermic by 236 kJ/mol"]],
      [[498, 413, 413], [463, 463, 463], ["The reaction is endothermic by 137 kJ/mol"]],
      [[346, 435], [272, 431, 431], ["The reaction is exothermic by 353 kJ/mol"]],
    ];
    const [broken, made] = sets[r.int(0, sets.length - 1)];
    const eIn = broken.reduce((s, x) => s + x, 0);
    const eOut = made.reduce((s, x) => s + x, 0);
    const dH = eIn - eOut;
    const verdict = dH < 0 ? "exothermic" : "endothermic";
    return {
      prompt: `Bond energies (kJ/mol): to break ${broken.join(" + ")} in the reactants; forming the products releases ${made.join(" + ")}. Calculate ΔH and state the type.`,
      correct: `ΔH = ${dH} kJ/mol — ${verdict}`,
      wrongs: pickDistinct(`ΔH = ${dH} kJ/mol — ${verdict}`, [
        `ΔH = ${eOut - eIn} kJ/mol — the energies were subtracted the other way round`,
        `ΔH = ${eIn + eOut} kJ/mol — both energy terms are added`,
        `ΔH = ${Math.abs(dH)} kJ/mol — the sign always goes with the larger term`,
      ]),
      tags: [],
      explanation: `ΔH = energy IN to break bonds (${eIn}) − energy OUT when bonds form (${eOut}) = ${dH} kJ/mol. Negative means more energy came out than went in — ${verdict}. Forming bonds always RELEASES energy; breaking always COSTS it.`,
      difficulty: 0.75,
    };
  },

  /** Alkane/alkene identification, homologous-series reasoning, and a
   *  complete-combustion product read. */
  "organic-intro": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const formulas: Array<[string, string, string[]]> = [
        ["C₂H₄", "an alkene — it has a C=C double bond",
          ["an alkane — every hydrocarbon with 2 carbons is an alkane", "an alcohol — it is short enough to be one", "a cycloalkane — the formula closes a ring"]],
        ["C₃H₈", "an alkane — saturated, with only single bonds",
          ["an alkene — three carbons forces a double bond", "an alcohol — the formula fits CₙH₂ₙ₊₁OH", "a carboxylic acid — it matches the −COOH family"]],
        ["C₄H₈", "an alkene or cycloalkane — the formula is two hydrogens short of the alkane pattern",
          ["an alkane — butane is C₄H₈", "an alcohol — C₄H₈ is the alcohol general formula", "a diene — four carbons must have two double bonds"]],
        ["C₅H₁₂", "an alkane — it fits CₙH₂ₙ₊₂ exactly",
          ["an alkene — five carbons makes it unsaturated", "a cycloalkane — twelve hydrogens close a ring", "an arene — five carbons is the benzene family"]],
      ];
      const [formula, answer, wrong] = formulas[r.int(0, formulas.length - 1)];
      return {
        prompt: `Classify the hydrocarbon ${formula}.`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Test the general formulas: alkane CₙH₂ₙ₊₂, alkene CₙH₂ₙ. Two hydrogens short of the alkane pattern means ONE double bond or one ring — for small molecules in these questions, that is the alkene family.`,
        difficulty: 0.4,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["ethanol and ethane are both two-carbon molecules; ethanol boils at 78 °C and ethane at −89 °C.",
          "Ethanol's −OH group forms hydrogen bonds between its molecules — far stronger than the forces between ethane molecules",
          ["Ethanol is heavier, and mass raises boiling point",
            "Ethane's covalent bonds are weaker, so it boils sooner",
            "Ethanol's covalent bonds break at the higher temperature"]],
        ["bromine water decolourises when shaken with C₃H₆ but not with C₃H₈.",
          "C₃H₆ has the C=C double bond, which opens to add bromine across itself; the alkane is saturated and cannot",
          ["C₃H₈ reacts because its single bonds are more reactive",
            "Both should react — the observation is an error",
            "C₃H₆ is more flammable, which the test detects"]],
        ["the alkanes CH₄, C₂H₆, C₃H₈ show a smooth rise in boiling point with chain length.",
          "They form a homologous series: same general formula, same chemistry, properties changing predictably with n",
          ["They are isomers of one substance at different temperatures",
            "The trend shows covalent bonds strengthening with length",
            "Homologous means identical properties — the data must be wrong"]],
      ];
      const [obs, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${obs} What does the observation show?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Organic chemistry reasons from the FUNCTIONAL GROUP: it decides the family, the family decides the reactions, and intermolecular strength decides the physical properties. The bromine-water test is the classic saturation detector.`,
        difficulty: 0.6,
      };
    }
    const fuels: Array<[string, string, string[]]> = [
      ["C₂H₆ burns completely", "CO₂ and H₂O only",
        ["CO and H₂O — complete combustion always makes some CO", "CO₂ and H₂ — hydrogen is released when oxygen runs short", "C and CO₂ — the carbon deposits as soot"]],
      ["CH₄ burns in a poor air supply", "CO (and water) — incomplete combustion with limited oxygen",
        ["CO₂ and H₂O — lack of air changes nothing about methane", "C and H₂ — methane splits into its elements", "CO₂ only — the hydrogen does not burn"]],
    ];
    const [fuel, answer, wrong] = fuels[r.int(0, fuels.length - 1)];
    return {
      prompt: `${fuel}. What are the products?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Complete combustion (plenty of oxygen): hydrocarbon → CO₂ + H₂O. Incomplete (oxygen-limited): carbon monoxide or even soot joins the products — the same elements, less oxidised. CO is the silent killer; it binds haemoglobin where oxygen should.`,
      difficulty: 0.75,
    };
  },

  /** Le Chatelier applied to pressure, concentration and temperature with
   *  the yield-vs-cost trade-off the Haber process embodies. */
  "equilibria": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["N₂(g) + 3H₂(g) ⇌ 2NH₃(g): the pressure on the system is increased", "Right — 4 moles of gas become 2, so the right side relieves the pressure",
          ["Left — more pressure always pushes toward the reactants", "No shift — pressure only changes the rate", "Left then right — the system oscillates"]],
        ["N₂O₄(g) ⇌ 2NO₂(g): the pressure on the system is increased", "Left — 2 moles of gas become 1, so the left side relieves the pressure",
          ["Right — the darker colour shows NO₂ must increase", "No shift — both sides contain gases", "Right — pressure favours the side with more particles"]],
        ["A + B ⇌ C + D: more of A is added while the system is at equilibrium", "Right — the system consumes the extra A until a new equilibrium forms",
          ["Left — adding reactant pushes the balance back", "No shift — equilibrium means the composition is fixed", "Right permanently — A keeps converting until it is used up"]],
      ];
      const [change, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${change}. Which way does the equilibrium shift?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Le Chatelier: the system opposes the change. Count MOLES OF GAS on each side for pressure (the side with fewer relieves it); a concentration addition is opposed by removing that substance. Neither a catalyst nor the size of K enters the shift.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["In N₂ + 3H₂ ⇌ 2NH₃ (forward exothermic), raising the temperature", "Shifts left, lowering the ammonia yield — but reaching equilibrium faster",
          ["Shifts right — more heat means more product",
            "Has no effect — a catalyst cancels temperature",
            "Shifts right and slows the reaction"]],
        ["In the same reaction, lowering the temperature", "Raises the equilibrium yield but the reaction becomes too slow to be useful",
          ["Lowers the yield but speeds the reaction up",
            "Raises both the yield and the rate — the best of both",
            "Has no effect on yield, only on rate"]],
      ];
      const [change, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${change}. What happens to the yield and the rate?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The yield question and the rate question are separate: equilibrium position answers the first, kinetics the second. Industrial processes choose COMPROMISE conditions — the Haber process runs ~450 °C, trading yield for speed, with a catalyst to claw the rate back.`,
        difficulty: 0.6,
      };
    }
    const data: Array<[string, string, string[]]> = [
      ["The table shows ammonia yield falling from 35% at 300 °C to 15% at 400 °C to 5% at 500 °C (constant pressure).",
        "The forward reaction is exothermic — heating pushes the equilibrium backward, so yield falls",
        ["The forward reaction is endothermic — heat is a reactant, so yield should rise with temperature",
          "The catalyst loses effectiveness as temperature rises, cutting yield",
          "Lower yield at higher temperature means the reaction has sped up"]],
      ["The table shows yield rising from 15% at 100 atm to 35% at 300 atm for the same exothermic reaction.",
        "The right side has fewer gas moles, so pressure pulls the equilibrium toward the product",
        ["Higher pressure speeds the reaction, and faster means more product at equilibrium",
          "Pressure has no effect on equilibrium; the catalyst must differ between runs",
          "The yield rises because molecules are closer together and collide more"]],
    ];
    const [obs, answer, wrong] = data[r.int(0, data.length - 1)];
    return {
      prompt: `${obs} What conclusion follows from the data?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. A yield-vs-condition table is an equilibrium probe: temperature trend reveals the sign of ΔH (yield falls with heat → forward is exothermic), pressure trend reveals the gas-mole balance. Rate effects (collisions, catalysts) change how FAST equilibrium arrives, never where it sits.`,
      difficulty: 0.78,
    };
  },

  /** The four classic qualitative tests plus flame and hydroxide-precipitate
   *  identification, with anion/cation logic made explicit. */
  "analysis-tests": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const tests: Array<[string, string, string[]]> = [
        ["a lit splint is held to the gas and burns with a squeaky pop", "hydrogen (H₂)",
          ["oxygen (O₂) — the pop is the splint burning harder", "carbon dioxide (CO₂)", "chlorine (Cl₂) — it bleaches the flame"]],
        ["a glowing splint is inserted and RELIGHTS", "oxygen (O₂)",
          ["hydrogen (H₂) — oxygen also pops", "carbon dioxide (CO₂)", "nitrogen (N₂) — it supports combustion weakly"]],
        ["the gas bubbles through limewater, which turns cloudy", "carbon dioxide (CO₂)",
          ["oxygen (O₂) — limewater tests for oxidising gases", "hydrogen (H₂) — the pop test and this are the same", "sulfur dioxide — it also whitens solutions"]],
        ["damp blue litmus is bleached white by the gas", "chlorine (Cl₂)",
          ["oxygen (O₂) — oxygen bleaches slowly", "carbon dioxide (CO₂) — it turns litmus white after red", "hydrogen (H₂) — it is a reducing agent"]],
        ["a flame test shows a brick-red / crimson flame", "lithium or strontium ions",
          ["sodium ions — sodium burns yellow-red", "potassium ions — potassium gives lilac", "calcium ions — calcium is green"]],
        ["a flame test shows a lilac flame", "potassium ions",
          ["sodium ions — sodium is the pale flame", "lithium ions — lithium burns violet", "barium ions — barium is red"]],
      ];
      const [obs, answer, wrong] = tests[r.int(0, tests.length - 1)];
      return {
        prompt: `A test gives this observation: ${obs}. What is identified?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Each gas has exactly one signature test — pop (H₂), relight (O₂), limewater (CO₂), bleach (Cl₂) — and each metal ion one flame colour. The exam skill is matching the OBSERVATION to the ion, not reciting the test: always read what was SEEN first.`,
        difficulty: 0.35,
      };
    }
    if (variant < 0.67) {
      const ppts: Array<[string, string, string[]]> = [
        ["sodium hydroxide is added and a BLUE precipitate forms", "Cu²⁺ — copper(II) hydroxide is blue",
          ["Fe²⁺ — iron(II) hydroxide is blue-green", "Fe³⁺ — iron(III) hydroxide is rust-brown", "Ca²⁺ — calcium hydroxide is blue when dilute"]],
        ["sodium hydroxide is added and a BROWN precipitate forms", "Fe³⁺ — iron(III) hydroxide is brown",
          ["Cu²⁺ — copper precipitates brown when old", "Fe²⁺ — iron(II) is the brown one", "Zn²⁺ — zinc hydroxide stays brown in excess"]],
        ["sodium hydroxide is added drop by drop: a white precipitate forms, then DISSOLVES in excess NaOH", "Al³⁺ (or Zn²⁺) — amphoteric hydroxides redissolve in excess",
          ["Mg²⁺ — magnesium hydroxide dissolves on standing", "Ca²⁺ — calcium hydroxide is soluble, so it never precipitates", "Fe²⁺ — iron(II) dissolves in excess alkali"]],
        ["sodium hydroxide is added: a white precipitate forms and does NOT dissolve in excess", "Mg²⁺ (or Ca²⁺) — their hydroxides are not amphoteric",
          ["Al³⁺ — aluminium hydroxide never redissolves", "Zn²⁺ — zinc hydroxide is insoluble in everything", "Cu²⁺ — copper hydroxide is white at first"]],
      ];
      const [obs, answer, wrong] = ppts[r.int(0, ppts.length - 1)];
      return {
        prompt: `${obs}. Which ion is present?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Metal hydroxides are identified by COLOUR (blue = Cu²⁺, brown = Fe³⁺, green = Fe²⁺) and by BEHAVIOUR in excess alkali (Al³⁺ and Zn²⁺ redissolve; Mg²⁺/Ca²⁺ do not). Colour + solubility together narrow to one ion — that two-step is the exam question.`,
        difficulty: 0.55,
      };
    }
    const panels: Array<[string, string, string[]]> = [
      ["Unknown X: pops with a lit splint; turns limewater cloudy only after Y is bubbled through X's solution first. Unknown Y relights a glowing splint.",
        "X is CO₂ and Y is O₂ — the observations identify each gas independently",
        ["X is H₂ and Y is CO₂ — the pop test was from hydrogen",
          "X is O₂ and Y is H₂ — the tests were accidentally swapped",
          "Both are CO₂ — limewater is the universal gas test"]],
      ["Unknown P gives a lilac flame; unknown Q gives a brick-red flame and, with NaOH, a white precipitate insoluble in excess.",
        "P is K⁺; Q is Ca²⁺ — flame colour and hydroxide behaviour agree on calcium",
        ["P is Na⁺; Q is Mg²⁺ — the flame colours are reversed",
          "P is K⁺; Q is Al³⁺ — white precipitates always mean aluminium",
          "Q is Ca²⁺ but the precipitate should have redissolved"]],
    ];
    const [obs, answer, wrong] = panels[r.int(0, panels.length - 1)];
    return {
      prompt: `Two unknowns are tested: ${obs} What are the ions?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Multi-test identification is elimination: each observation removes candidates until one ion fits everything. When two tests both point at the same ion, that agreement is the evidence — a single test alone can mislead, a panel cannot.`,
      difficulty: 0.75,
    };
  },

  // ── PHYSICS ────────────────────────────────────────────────────────────────

  /** Motor vs generator effect with the rule for each, the factors that
   *  change magnetic force, and reading field-line diagrams. */
  "magnetism": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const pairs: Array<[string, string, string[]]> = [
        ["the FORCE on a current-carrying wire inside a magnetic field", "Fleming's LEFT-hand rule — the motor effect",
          ["Fleming's right-hand rule — that covers all electromagnetic effects", "Lenz's law — it predicts every electromagnetic direction", "The right-hand grip rule — it maps current to force"]],
        ["the DIRECTION of an induced current when a wire is moved through a field", "Fleming's RIGHT-hand rule — the generator effect",
          ["Fleming's left-hand rule — current and motion always use the same hand", "Lenz's law gives the numerical size of the current", "The left-hand grip rule — the induced current follows the force"]],
        ["the DIRECTION of the magnetic field around a straight current-carrying wire", "The right-hand grip rule — thumb along the current, fingers curl the field",
          ["Fleming's left-hand rule — the field is the motor force", "Lenz's law — it reverses the field direction", "Fleming's right-hand rule — the wire is being moved"]],
      ];
      const [situation, answer, wrong] = pairs[r.int(0, pairs.length - 1)];
      return {
        prompt: `Which rule predicts ${situation}?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["motor-gen"],
        explanation: `${answer}. The hand split is the exam's favourite discriminator: LEFT = MOTor (current + field → force), RIGHT = generator (motion + field → induced current). The grip rule is not Fleming's at all — it maps a CURRENT to the field it wraps around itself.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["the current in the wire is doubled while the field stays the same", "The force doubles — it is proportional to current",
          ["The force is unchanged — the field sets the force", "The force halves — more current means more resistance", "The force quadruples — current enters the formula squared"]],
        ["the wire is rotated to lie PARALLEL to the field lines", "The force becomes zero — only the perpendicular component of the field acts",
          ["The force is greatest in this orientation", "The force reverses direction but keeps its size", "The force is unchanged — orientation does not matter"]],
        ["the magnetic field strength is halved and the current is doubled", "The force is unchanged — each change cancels the other",
          ["The force doubles — current dominates the outcome", "The force halves — the field sets the limit", "The force quadruples — the two effects multiply"]],
      ];
      const [change, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `A current-carrying wire sits perpendicular to a magnetic field. ${change}. What happens to the force on the wire?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["motor-gen"],
        explanation: `${answer}. F = BIl, and the factor that matters for direction-questions is that the wire must CUT the field lines: force scales with current, with field strength, with length — and dies to zero when the wire lies along the field, cutting nothing.`,
        difficulty: 0.6,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["iron filings around a bar magnet cluster most densely at the two ends", "The poles — field lines are densest where the field is strongest",
        ["The poles repel the filings, so they pile up there", "The field is weakest at the ends, so filings settle untouched", "The filings align with the magnet's magnetisation, not the field"]],
      ["two field-line diagrams: one shows lines leaving a end and curving round to the other; the other shows lines crossing mid-air between neighbouring lines", "The first is correct — field lines never cross; each point has one field direction",
        ["Both are correct — crossing lines show a stronger field", "The second is correct — fields radiate in every direction at once", "Neither is correct — field lines only exist inside the magnet"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `Interpreting field diagrams: ${obs}. What does the evidence show?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Field lines are a map, not a physical object: closeness encodes strength, direction encodes the force on a north pole, and crossing is forbidden because a compass at one point cannot point two ways at once.`,
      difficulty: 0.75,
    };
  },

  /** Refraction with the normal convention, the angle-of-incidence cases,
   *  and a dispersion read separating refraction from colour. */
  "light-optics": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["air into glass", "It slows down and bends TOWARD the normal",
          ["It speeds up and bends away from the normal", "It keeps the same speed but changes direction", "It slows down and bends AWAY from the normal"]],
        ["glass into air", "It speeds up and bends AWAY from the normal",
          ["It slows down and bends toward the normal", "It keeps the same speed but changes direction", "It speeds up and bends toward the normal"]],
        ["air into water at 0° — along the normal", "It slows down with NO change of direction",
          ["It slows down and bends toward the normal anyway", "It passes through unchanged in every respect", "It bends away because water is denser"]],
      ];
      const [boundary, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `Light crosses from ${boundary}. What happens to speed and direction?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["norm-miss"],
        explanation: `${answer}. Denser medium → slower light; the change of speed pivots the wavefront. All angles are measured from the NORMAL — the perpendicular to the surface — never from the surface itself, which is the single most common refraction error. Along the normal there is nothing to pivot: no bend.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["A ray strikes a glass–air boundary at the critical angle.", "It travels along the surface — refraction at exactly 90° to the normal",
          ["It passes straight through, undeviated", "It reflects back along its own path", "It stops — no wave can exist at the critical angle"]],
        ["A ray inside glass hits the boundary at an angle GREATER than the critical angle.", "Total internal reflection — all the light reflects back into the glass",
          ["Most refracts out; a little reflects", "The light slows dramatically and stops", "The ray bends toward the normal and escapes"]],
        ["A ray crosses from water into glass, then from that glass back into water.", "Its direction is unchanged overall and its final speed equals its initial speed",
          ["Its final direction differs from its initial direction", "It ends up faster than it started", "Total internal reflection must occur at the second boundary"]],
      ];
      const [obs, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${obs} What happens to the ray?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["norm-miss"],
        explanation: `${answer}. Above the critical angle (measured from the NORMAL, in the denser medium), refraction cannot happen — Snell's law has no solution with a real angle — so ALL the light reflects: total internal reflection. Optical fibres run on exactly this.`,
        difficulty: 0.6,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["White light enters a prism and emerges spread into red through violet.", "Violet slows most and refracts most — each wavelength has its own refractive index",
        ["The prism adds colour to white light — white light contains no colours until then",
          "Red slows most, bending the most", "The spread is a reflection effect at the far face"]],
      ["A ray diagram shows the refracted ray labelled at 35° to the SURFACE, with the incident ray at 25° to the surface.", "The angles are misread — refracted angles are measured from the normal, so the true angles are 55° and 65°",
        ["The diagram is fine — refraction angles are measured from the surface",
          "The ray bends away from the normal because 35 > 25",
          "The ray could not refract with those numbers"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `${obs} Which interpretation is correct?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Dispersion is refraction differing by wavelength — the colours were always IN the white light. And every angle question starts with the same step: draw the normal, then measure from it. Skipping that step manufactures wrong answers out of correct diagrams.`,
      difficulty: 0.78,
    };
  },

  /** Sound needs a medium in three settings, the pitch/loudness/waveform
   *  mapping onto frequency/amplitude, and an echo-speed calculation. */
  "sound-acoustics": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["An astronaut shouts on the Moon; another stands 10 m away.", "Nothing — there is no medium to carry the sound",
          ["The shout, clearly — sound travels fine in vacuum", "A quiet, delayed version", "Only the echo — the ground returns it"]],
        ["A ringing bell is sealed in a vacuum jar and the air pumped out.", "The bell still swings but falls silent — the vibration continues without a medium to carry it",
          ["The bell stops moving — sound is what makes it swing", "The bell sounds louder — nothing absorbs the sound now", "The bell's pitch rises — sound travels faster in vacuum"]],
        ["A diver knocks two stones together underwater; a swimmer 30 m away hears it.", "The sound travels through the WATER — liquids carry sound",
          ["Nothing — water blocks sound like a wall", "Only through the air above — water reflects it down", "Only if the stones touch the seabed, which conducts"]],
      ];
      const [setting, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${setting} What is heard, and why?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["sound-vac"],
        explanation: `${answer}. Sound is a vibration of MATTER — a longitudinal wave travelling by particle-to-particle pushes. No particles, no sound; fewer particles, slower sound. Light and radio need no medium, which is why the astronauts use radios.`,
        difficulty: 0.3,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["the wave's frequency is increased while its amplitude stays the same", "The pitch rises — frequency is pitch; loudness is untouched",
          ["It gets louder — frequency is loudness", "Both pitch and loudness rise — they are the same thing", "The pitch falls — higher frequency means lower note"]],
        ["the wave's amplitude is increased while its frequency stays the same", "It gets louder — amplitude sets loudness; the pitch is untouched",
          ["The pitch rises — bigger waves vibrate faster", "The pitch falls — the energy drags the wave down", "Both loudness and pitch rise together"]],
        ["an oscilloscope trace is compared with a second: same number of waves across the screen, but taller", "Same pitch, louder — the spacing (frequency) matched, the height (amplitude) grew",
          ["Same loudness, higher pitch — height carries pitch", "Higher pitch and louder — both features grew", "Lower pitch — taller waves travel more slowly"]],
      ];
      const [change, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `A sound wave is changed: ${change}. How does the sound change?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Two independent dials: FREQUENCY → pitch, AMPLITUDE → loudness. Reading an oscilloscope is the same skill: horizontal spacing is frequency, vertical height is amplitude, and confusing the axes confuses the sound.`,
        difficulty: 0.55,
      };
    }
    const d = r.pick([170, 255, 340]);
    const v = 340;
    const t = deepNum((2 * d) / v, 2);
    return {
      prompt: `A student stands ${d} m from a cliff and claps. The echo returns after ${t} s. Show that this gives the speed of sound as ${v} m/s.`,
      correct: `The sound travels there and back: 2 × ${d} = ${2 * d} m, and ${2 * d} / ${t} = ${v} m/s`,
      wrongs: pickDistinct(`The sound travels there and back: 2 × ${d} = ${2 * d} m, and ${2 * d} / ${t} = ${v} m/s`, [
        `Use the one-way distance: ${d} / ${t} = ${deepNum(d / Number(t), 0)} m/s — the echo path was forgotten`,
        `The distance is doubled and the time halved, giving ${4 * d} m/s`,
        `Speed cannot be found from an echo — the cliff absorbs the timing information`,
      ]),
      tags: [],
      explanation: `An echo means a ROUND trip: distance = 2 × ${d} = ${2 * d} m, time = ${t} s, so speed = ${2 * d} / ${t} = ${v} m/s. Forgetting the factor of 2 is the classic error — the echo's existence is exactly what tells you the sound went twice.`,
      difficulty: 0.7,
    };
  },

  /** Conduction/convection/radiation discrimination across real settings,
   *  the temperature-vs-heat distinction that the spoon question exposes,
   *  and a specific-heating calculation. */
  "thermal-physics": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["a metal spoon and a wooden spoon stand in the same hot soup; the metal handle soon feels hotter", "Metal CONDUCTS heat along itself to your hand faster — both spoons are at the same temperature where they sit in the soup",
          ["The metal spoon is at a higher temperature — metals heat up more", "The wood generates insulating cold, cooling its own handle", "Metal has a lower density, so it heats through more quickly"]],
        ["a vacuum flask keeps soup hot; the walls have a vacuum between them", "A vacuum stops CONDUCTION and CONVECTION — both need matter to travel through",
          ["The vacuum absorbs the heat and stores it", "The vacuum reflects radiation like a mirror", "Heat cannot exist in a vacuum, so it is trapped"]],
        ["a house warms from sunlight through the glass with no air movement involved", "RADIATION — infrared crosses empty space and glass without matter",
          ["Conduction — the glass warms and passes warmth inward", "Convection — warm air circulates through the window frame", "Evaporation — moisture carries the energy inward"]],
        ["radiator warms a room mainly by setting up air currents", "CONVECTION — warm air expands, becomes less dense, and rises",
          ["Conduction — the air touches the radiator and passes heat on directly", "Radiation — air absorbs infrared better than surfaces", "Condensation — cooled air returns as moisture"]],
      ];
      const [setting, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${setting} Which transfer mechanism explains it?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["heat-temp"],
        explanation: `${answer}. Three mechanisms, three requirements: conduction needs CONTACT (particle-to-particle passes), convection needs a FLUID that can circulate, radiation needs NOTHING (electromagnetic waves). Naming the requirement the setting satisfies is the whole method.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["A cup of tea (0.3 kg) at 90 °C and a bathtub of water at 40 °C stand in the same room.", "The tea has the higher temperature, but the bath stores far more internal energy — energy depends on mass as well as temperature",
          ["The tea stores more energy — hotter always means more energy",
            "The bath is at the higher temperature because it holds more water",
            "Both store the same energy — water's specific heat cancels the difference"]],
        ["A student claims '0 °C ice contains no heat at all'.", "Wrong — internal energy exists at any temperature above absolute zero; 0 °C is far from that",
          ["Right — heat only exists above the freezing point of water",
            "Right — at 0 °C the particles stop moving entirely",
            "Wrong — ice actually contains MORE energy than steam at the same mass"]],
        ["Two blocks, A and B, receive the same energy. A's temperature rises twice as much as B's.", "B has twice the heat capacity (mass × specific heat) — the same energy spread over more capacity moves the temperature less",
          ["B must be twice as hot to start with",
            "A has twice the heat capacity — it absorbed more",
            "The blocks cannot be compared without knowing their colours"]],
      ];
      const [claim, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${claim} What is the right reading?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["heat-temp"],
        explanation: `${answer}. Temperature is the AVERAGE kinetic energy per particle; internal (heat) energy is the TOTAL — average × count. A small hot thing can hold less energy than a large cool one, which is why a spark at 2000 °C does not burn like boiling water at 100 °C.`,
        difficulty: 0.6,
      };
    }
    const masses = [0.5, 1, 2, 3];
    const m = r.pick(masses);
    const dT = r.pick([5, 10, 15, 20]);
    const c = 4200;
    const E = m * c * dT;
    return {
      prompt: `A ${m} kg pot of water is heated from 20 °C by ${dT} °C. Specific heat capacity of water: ${c} J/(kg·°C). How much energy is needed?`,
      correct: `${E.toLocaleString("en-GB")} J`,
      wrongs: pickDistinct(`${E.toLocaleString("en-GB")} J`, [
        `${(E / c).toLocaleString("en-GB")} J — the specific heat was dropped from the calculation`,
        `${(m * dT).toLocaleString("en-GB")} J — mass × temperature rise alone`,
        `${(E * 2).toLocaleString("en-GB")} J — the temperature was counted from 0 °C, not from 20 °C`,
      ]),
      tags: [],
      explanation: `ΔE = mcΔθ = ${m} × ${c} × ${dT} = ${E.toLocaleString("en-GB")} J. Three factors, one formula — and water's huge specific heat capacity is why kettles, radiators and climates all revolve around it: it soaks up enormous energy for each degree.`,
      difficulty: 0.75,
    };
  },

  /** Orbits as perpetual free-fall, the weight/mass and terminal-velocity
   *  reasoning, and a gravitational field-strength comparison table. */
  "gravity-fields": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["A satellite orbits Earth at constant speed.", "The resultant force is NOT zero — it points toward Earth, bending the path into a circle",
          ["The resultant force is zero — constant speed means no force", "The resultant force points along the satellite's direction of travel", "The resultant force points away from Earth — that is why it does not fall"]],
        ["A skydiver has reached terminal velocity.", "Weight and drag are balanced — the resultant force is zero, so the speed stays constant",
          ["Gravity has stopped acting at terminal velocity", "The resultant force still points down but is shrinking", "Drag exceeds weight — that is what slows the fall to constant speed"]],
        ["A ball is thrown straight up and is at the very top of its flight.", "Its speed is momentarily zero but the resultant force is NOT zero — gravity still acts fully",
          ["Both speed and force are zero at the top", "The force reverses to point upward, ready to bring it down", "The force is zero because the motion is momentarily balanced"]],
      ];
      const [setting, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${setting} What is the resultant force, and what does it do?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["bal-motion"],
        explanation: `${answer}. Constant SPEED does not mean zero force — force decides the CHANGE of velocity, and velocity has direction. An orbit is acceleration toward the centre at constant speed: the satellite is falling, but its sideways motion means it keeps missing the ground.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["An astronaut travels from Earth to the Moon.", "Mass is unchanged — it is the amount of matter; weight drops, because the Moon's field is weaker",
          ["Both mass and weight fall — the astronaut is lighter out there",
            "Mass falls and weight is unchanged — weight is the fundamental quantity",
            "Neither changes — both are fixed properties of the body"]],
        ["A parachutist jumps: at the instant of leaving the plane, and again at terminal velocity.", "Initially only weight acts — acceleration is g; at terminal velocity the forces balance and acceleration is zero",
          ["The acceleration is g at both instants — gravity never changes",
            "Initially the forces already balance; then drag takes over",
            "At terminal velocity the weight has fallen to match the drag — gravity weakens with speed"]],
        ["The same skydiver opens the parachute while at terminal velocity.", "Drag now exceeds weight — the resultant force points UP, so the skydiver decelerates to a new, slower terminal velocity",
          ["The upward resultant throws the skydiver back upward", "Weight instantly grows to exceed the larger drag", "The forces stay balanced — opening a parachute changes nothing"]],
      ];
      const [setting, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${setting} What happens to mass, weight and the forces?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["bal-motion"],
        explanation: `${answer}. Mass (kg) is invariant; weight (N) is mass × field strength and travels with the field. Terminal velocity is a moving equilibrium: the resultant falls to zero as drag rises with speed, and any new balance point (a bigger parachute) means a new, lower terminal velocity.`,
        difficulty: 0.65,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["Earth 9.8 N/kg, Moon 1.6 N/kg, Mars 3.7 N/kg. A 70 kg astronaut visits each.", "Weight: 686 N on Earth, 112 N on the Moon, 259 N on Mars — mass stays 70 kg throughout",
        ["Weight is the same everywhere; only mass changes with the field",
          "Mass drops on the Moon to about 11 kg, matching the weaker pull",
          "Weight is 70 N on each body — weight in newtons equals mass in kilograms"]],
      ["A planet where the same object weighs 2× its Earth weight.", "The field strength is 19.6 N/kg — double Earth's, so free-fall acceleration doubles too",
        ["The planet's mass must be exactly double Earth's — field scales only with mass",
          "The object's mass doubled on landing — mass follows the local field",
          "Free fall there is slower — heavier weight means more inertia to overcome"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `Using the data: ${obs} What follows?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Weight = mass × field strength (W = mg), and g is ALSO the free-fall acceleration — the same number doing two jobs. Reading a field-strength table is applying that one relationship per row while mass stays constant.`,
      difficulty: 0.78,
    };
  },

  /** Redshift and the expanding universe with the evidence chain, the
   *  life-cycle placement of a star by mass, and reading a CMB/redshift
   *  dataset for what it supports. */
  "astrophysics": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["Light from a distant galaxy shows its spectral lines shifted toward the RED end.", "The galaxy is moving away — the wavelengths are stretched, and the further the galaxy the bigger the shift",
          ["The galaxy is approaching — red light arrives first", "The light lost energy travelling through space, with no motion involved", "The galaxy is stationary — redshift is an artefact of the instruments"]],
        ["Redshift is measured for many galaxies: the further away, the LARGER the redshift.", "Space itself is expanding — Hubble's law — which points back to a hot, dense beginning",
          ["Our galaxy sits at the exact centre of the universe, pushing others away",
            "The galaxies are racing through static space, fastest ones furthest",
            "Gravity from nearby galaxies stretches the light on its way past"]],
        ["A satellite maps the cosmic microwave background: a nearly uniform microwave glow from every direction.", "It is the stretched remnant radiation of the early hot universe — key evidence for the Big Bang",
          ["It is starlight from the furthest galaxies, redshifted into microwaves by dust",
            "It is the reflection of the Sun off interstellar gas",
            "It is instrument noise — space contributes no background glow"]],
      ];
      const [obs, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${obs} What does the evidence show?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The evidence chain runs: spectral lines identified → shifted → recession → recession grows with distance → space expands → rewinding gives a hot dense start. Each step is forced; skipping a step is where the misconceptions live.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["A star with much MORE mass than the Sun reaches the end of its life.", "Supernova, then either a neutron star or a black hole depending on the remaining mass",
          ["It expands into a red giant and gently becomes a white dwarf — the same path as the Sun",
            "It collapses straight to a white dwarf without any explosion",
            "It evaporates — massive stars simply disperse without a final event"]],
        ["A star similar in mass to the Sun reaches the end of its main-sequence life.", "Red giant → planetary nebula → white dwarf, which slowly cools",
          ["Supernova → neutron star, because all stars end in an explosion",
            "Red giant → supernova → black hole, the standard end for every star",
            "It contracts back into a protostar and restarts its life"]],
        ["Astronomers find a star burning hydrogen steadily, like the Sun now.", "Main sequence — radiation pressure from fusion balances gravity's inward pull",
          ["Protostar — it is still gathering mass from the nebula",
            "Red giant — hydrogen burning is the giant phase",
            "White dwarf — fusion continues at a gentler rate there"]],
      ];
      const [obs, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${obs} What stage or end-state is this?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. One variable decides the fate: MASS. Above roughly eight solar masses the core collapses past white-dwarf density — neutron star, or black hole if enough mass remains. The Sun's path (giant → nebula → dwarf) is the quiet default, not the universal one.`,
        difficulty: 0.6,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["Galaxy A: distance 100 Mpc, recessional speed 7 000 km/s. Galaxy B: distance 300 Mpc, recessional speed 21 000 km/s.", "Speed is proportional to distance (Hubble's law) — the same ratio for both, supporting an expanding universe",
        ["Galaxy B is three times older than galaxy A",
          "The galaxies have different masses — heavier ones recede faster",
          "Galaxy A is accelerating; galaxy B is decelerating"]],
      ["A galaxy's Hydrogen-alpha line (emitted at 656 nm) is measured at 722 nm.", "The line is redshifted by 10% — the galaxy recedes at roughly a tenth of light speed",
        ["The line is blueshifted — 722 is above 656 in the rainbow",
          "The gas emitting it is hotter than lab hydrogen, stretching the line",
          "The measurement is an error — spectral lines cannot move"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `Read the data: ${obs} What conclusion follows?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Redshift z = (observed − emitted) / emitted; the per-cent shift gives the recession speed as a fraction of c. Hubble's law is the LINEARITY of speed with distance — the dataset's proportionality is the whole argument for expansion.`,
      difficulty: 0.78,
    };
  },

  // ── BIOLOGY ─────────────────────────────────────────────────────────────────

  /** The ventilation mechanism read both directions, the composition
   *  difference between inhaled and exhaled air worked from data, and the
   *  alveolus adaptation chain. */
  "breathing-gas": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["breathing IN", "The diaphragm CONTRACTS and flattens; the external intercostals lift the ribs — volume up, pressure down, air flows in",
          ["The diaphragm relaxes and domes up, squeezing air inward", "The ribs move down and in, drawing air in behind them", "The diaphragm stays still — the ribs do all the work"]],
        ["breathing OUT (at rest)", "The diaphragm RELAXES and domes up; the chest volume falls, pressure rises, air is pushed out — largely passive",
          ["The diaphragm contracts harder, squeezing the lungs", "The internal intercostals always power quiet exhalation", "Air is pushed out because the lungs actively contract themselves"]],
        ["forced exhalation (exercise or blowing out candles)", "The INTERNAL intercostals pull the ribs down and in; abdominal muscles push the diaphragm up — active",
          ["Only the diaphragm relaxes — forced breathing uses no new muscles", "The external intercostals contract again, reversing their action", "The lungs contract themselves — muscle inside the lung does the work"]],
      ];
      const [phase, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `During ${phase}, what do the diaphragm and intercostal muscles do, and what is the result?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Ventilation is a pressure pump, not a suction story: muscle action changes chest VOLUME, volume changes PRESSURE, and air always flows down its pressure gradient. Name the muscles, then the volume, then the pressure — in that order, every time.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const rows: Array<[string, string, string[]]> = [
        ["nitrogen: 78% inhaled, 78% exhaled", "Nitrogen is neither used nor made by the body — its percentage is unchanged even though the other gases' shares change",
          ["The body uses 78% of the nitrogen for proteins",
            "Nitrogen dissolves in the blood and is absorbed",
            "The table must be wrong — exhaled air cannot keep the same composition"]],
        ["oxygen: 21% inhaled, 16% exhaled; carbon dioxide: 0.04% inhaled, 4% exhaled; exhaled air is still 16% oxygen",
          "We use only about a QUARTER of the oxygen in each breath — exhaled air remains oxygen-rich, which is why mouth-to-mouth resuscitation works",
          ["The lungs remove all the oxygen — the 16% must be an error",
            "We exhale mostly carbon dioxide — around three-quarters of the breath",
            "The lungs convert oxygen into carbon dioxide molecule by molecule"]],
        ["exhaled air is saturated with water vapour, while inhaled air is not (a cold mirror fogs on exhalation)", "Gas exchange surfaces must be MOIST — oxygen dissolves in the film before crossing into the blood",
          ["The water is produced by burning hydrogen in the lungs during respiration",
            "Exhaled air picks up moisture only from drinking water",
            "The mirror fogging is condensation of the carbon dioxide"]],
      ];
      const [row, answer, wrong] = rows[r.int(0, rows.length - 1)];
      return {
        prompt: `The composition table shows: ${row}. What does this tell you?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The table's power is in what DOESN'T change (nitrogen — untouched) as much as what does (oxygen down ~5 points, CO₂ up ~100-fold). Respiration consumes O₂ and releases CO₂ in the cells, not in the lungs — the lungs are the exchange dock, not the reactor.`,
        difficulty: 0.6,
      };
    }
    const features: Array<[string, string, string[]]> = [
      ["alveoli are folded into millions of tiny spheres", "Enormous total surface area for the rate of diffusion",
        ["They trap dust before it reaches the blood", "The folding stores spare air between breaths", "Spherical shapes are strongest under pressure"]],
      ["each alveolus is wrapped in a dense capillary network", "A steep concentration gradient is maintained — blood constantly removes oxygen and delivers CO₂",
        ["The capillaries structurally support the alveoli's shape", "They warm the incoming air before it is used", "They carry oxygen to the alveoli to be exhaled"]],
      ["the alveolus wall and capillary wall are each a single flattened cell thick", "A very short diffusion distance — gases cross in a fraction of a millimetre",
        ["The thin walls filter bacteria out of the air", "Being thin lets the alveoli expand without muscle", "Thickness matters only for liquid exchange, not gases"]],
    ];
    const [feature, answer, wrong] = features[r.int(0, features.length - 1)];
    return {
      prompt: `Gas exchange: ${feature}. What is the advantage?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Diffusion rate rises with SURFACE AREA and the concentration GRADIENT, and falls with DISTANCE — the alveolus optimises all three at once. Every exchange surface in biology (gut villi, gills, roots) is the same three-part design argument.`,
      difficulty: 0.75,
    };
  },

  /** The reflex arc traced in order, synapse chemistry, and a reaction-time
   *  experiment read as data. */
  "nervous-system": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const arcs: Array<[string, string, string[]]> = [
        ["you touch a hot pan and pull your hand away", "Receptor → sensory neurone → relay neurone (spinal cord) → motor neurone → effector (muscle)",
          ["Receptor → motor neurone → brain → sensory neurone → muscle", "Muscle → sensory neurone → relay → receptor → motor", "Receptor → brain → sensory neurone → motor neurone → muscle"]],
        ["a knee-jerk test taps the patellar tendon", "The sensory neurone synapses almost directly onto the motor neurone — the fastest possible reflex",
          ["The impulse travels up to the cerebellum and back down", "The tap directly stimulates the muscle electrically", "The relay neurone stores the signal before releasing it"]],
        ["you see a ball flying at your face and flinch", "Receptors in the RETINA start the arc; the response is still automatic through the spinal reflex",
          ["Eye receptors are conscious, so this is a voluntary action, not a reflex", "The retina sends its signal straight to the muscle, skipping neurones", "Seeing cannot start a reflex — only touch can"]],
      ];
      const [scene, answer, wrong] = arcs[r.int(0, arcs.length - 1)];
      return {
        prompt: `${scene}. Which pathway is correct?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The reflex arc order is fixed: RECEPTOR → SENSORY → RELAY → MOTOR → EFFECTOR, with the relay sitting in the spinal cord, not the brain. Bypassing the conscious brain is the point — fewer synapses, milliseconds saved, and you feel the heat only after your hand has moved.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const synapses: Array<[string, string, string[]]> = [
        ["How does a signal cross the synapse between two neurones?", "Chemicals (neurotransmitters) are released, diffuse across the gap, and trigger the next neurone",
          ["The electrical impulse leaps directly across the gap", "The neurones touch, so the impulse passes by contact", "The impulse stops and restarts spontaneously on the far side"]],
        ["Why is the synapse a ONE-WAY junction?", "Vesicles releasing the transmitter exist only on the sending side; receptors only on the receiving side",
          ["Nerve impulses physically cannot travel backwards",
            "The gap closes behind the impulse like a valve",
            "Neurotransmitters are directional molecules with arrow-shaped shapes"]],
        ["Why are reflexes faster than conscious responses?", "Fewer synapses and no brain processing — each synapse adds delay",
          ["Reflex neurones are thicker, so impulses travel faster",
            "Conscious responses use hormones, which are slower chemicals",
            "Reflexes skip the neurones entirely and use direct muscle stimulation"]],
      ];
      const [q, answer, wrong] = synapses[r.int(0, synapses.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The synapse is chemistry doing what electricity cannot: bridging a gap and filtering the traffic. Its one-way design and its small delay are both consequences of the same structure — transmitter stored on one side, receptors waiting on the other.`,
        difficulty: 0.6,
      };
    }
    const rt = r.int(180, 260);
    const rtCaffeine = rt - r.int(30, 60);
    const n = r.pick([10, 15, 20]);
    const meanA = deepNum(rt / 10, 1).replace(".0", "");
    return {
      prompt: `A reaction-time experiment: without caffeine the mean of ${n} drops is ${meanA} ms; with caffeine the mean drops to ${deepNum(rtCaffeine / 10, 1)} ms. What conclusion is justified, and what improvement would strengthen it?`,
      correct: "Caffeine is associated with faster reactions in this sample — but repeat with more participants and a control (placebo) to rule out expectation",
      wrongs: pickDistinct("Caffeine is associated with faster reactions in this sample — but repeat with more participants and a control (placebo) to rule out expectation", [
        "Caffeine PROVES faster reactions — the mean is decisive",
        "No conclusion is possible from any number of trials of one person",
        "The faster mean shows the nervous system's synapses were eliminated",
      ]),
      tags: [],
      explanation: `A repeated-measures mean with a visible difference is evidence of an EFFECT, not yet proof of CAUSE for the population: sample size, control conditions and replication are what convert an observation into a confident claim. Reaction time is a classic reflex-arc measurement — the count of synapses and decisions is why it is never zero.`,
      difficulty: 0.75,
    };
  },

  /** The blood-glucose pair (insulin/glucagon) with the feedback loop,
   *  the other endocrine roles matched to their gland, and a negative-
   *  feedback graph read. */
  "hormones": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["blood glucose concentration is too HIGH (after a meal)", "Insulin — moves glucose into cells and stores it as glycogen in liver and muscle",
          ["Glucagon — it converts stored glycogen back to glucose", "ADH — it adjusts how much water is retained", "Adrenaline — it raises glucose further for fight-or-flight"]],
        ["blood glucose concentration is too LOW (hours after eating)", "Glucagon — the liver converts stored glycogen back into glucose and releases it",
          ["Insulin — it releases the stored glucose into the blood", "Oestrogen — it regulates the blood sugar cycle monthly", "Adrenaline is the only hormone that can raise blood glucose"]],
        ["a person has not eaten for a day, and the glycogen store runs low", "Glucagon plus gluconeogenesis keep blood glucose up — the brain cannot run without it",
          ["Insulin takes over, releasing the remaining glucose slowly",
            "Blood glucose simply falls with no correction available",
            "Adrenaline converts protein directly into insulin"]],
      ];
      const [state, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${state}. Which hormone corrects it, and what does it do?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Insulin LOWERS blood glucose (storage); glucagon RAISES it (mobilisation) — a pair with opposite effects on the same variable, which is what makes NEGATIVE FEEDBACK possible. The set point sits around 90 mg per 100 ml; both hormones pull toward it.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const pairs: Array<[string, string, string[]]> = [
        ["ADH and its role", "Released by the pituitary; makes kidney tubules reabsorb more water, concentrating the urine",
          ["Made by the kidney; increases the filtration rate", "Released by the pancreas; stores water as glycogen", "Made by the adrenal gland; triggers the fight-or-flight response"]],
        ["adrenaline and its role", "Released by the adrenal glands; raises heart rate, blood glucose and breathing rate — preparing for action",
          ["Released by the pancreas; lowers blood glucose for sudden activity", "Made by the pituitary; controls the monthly menstrual cycle", "Released by the thyroid; sets the basal metabolic rate"]],
        ["thyroxine and its role", "Released by the thyroid; regulates metabolic rate — how fast chemical reactions run",
          ["Released by the adrenal glands; controls blood calcium", "Made by the pancreas; controls the rate of digestion", "Released by the ovaries; maintains the uterus lining"]],
        ["the pituitary gland's role", "The master gland — its hormones (FSH, LH, ADH) direct other endocrine glands",
          ["It stores all hormones made elsewhere for gradual release", "It produces insulin and glucagon together", "It filters hormones from the blood once they are spent"]],
      ];
      const [q, answer, wrong] = pairs[r.int(0, pairs.length - 1)];
      return {
        prompt: `Identify the hormone and its action: ${q}.`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Each endocrine gland owns its hormone and its message — pancreas (insulin/glucagon, glucose), pituitary (ADH, FSH, LH — the conductor), thyroid (thyroxine, metabolism), adrenals (adrenaline, emergency). Matching gland → hormone → effect is the exam skill; the pancreas is BOTH an endocrine and digestive gland, which trips the unwary.`,
        difficulty: 0.6,
      };
    }
    const level = r.int(150, 250);
    const setpoint = 90;
    const dir = level > setpoint ? "above" : "below";
    const hormone = level > setpoint ? "insulin" : "glucagon";
    const effect = level > setpoint ? "falls" : "rises";
    return {
      prompt: `A graph shows blood glucose at ${level} mg/100 ml (set point: ${setpoint}). Trace the negative-feedback sequence that restores the set point.`,
      correct: `The ${level > setpoint ? "pancreas detects the high level and releases insulin" : "pancreas detects the low level and releases glucagon"}; glucose ${effect} toward ${setpoint}; when it reaches the set point the hormone's release stops`,
      wrongs: pickDistinct(`The ${level > setpoint ? "pancreas detects the high level and releases insulin" : "pancreas detects the low level and releases glucagon"}; glucose ${effect} toward ${setpoint}; when it reaches the set point the hormone's release stops`, [
        `The level stays ${dir} the set point — feedback only slows the change, never reverses it`,
        `The body overshoots deliberately to the opposite extreme, then corrects back`,
        `The set point rises to meet the new level — the body adapts its target instead`,
      ]),
      tags: [],
      explanation: `Negative feedback has four steps: DETECT the deviation from the set point, RELEASE the corrective hormone, COUNTERACT the deviation, SWITCH OFF when the set point returns. The switch-off is what makes it feedback rather than a one-way correction — and the set point itself never moves in these graphs.`,
      difficulty: 0.75,
    };
  },

  /** Natural selection traced through variation → selection → inheritance,
   *  the antibiotic-resistance story as applied selection, and speciation
   *  via isolation. */
  "evolution": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["Why did antibiotic-resistant bacteria become common in hospitals?", "Resistant cells already existed through random mutation; the antibiotic killed the rest, and the survivors reproduced",
          ["The antibiotics forced the bacteria to mutate useful resistance genes",
            "Bacteria learned individually to avoid the drug during treatment",
            "Resistance builds up gradually in each patient through repeated doses"]],
        ["Why do peppered moths in sooty industrial areas tend to be dark?", "Birds could see pale moths on dark bark, so dark variants survived to reproduce more — the selection pressure changed, not the moths' aims",
          ["The moths darkened themselves to match the soot during their lifetimes",
            "Soot stained the moths' wings, and the staining became inherited",
            "Dark moths chose to live in industrial areas, pale moths left"]],
        ["A population of mice colonises a sandy beach; lighter fur becomes common over generations.", "Lighter-furred mice were camouflaged from predators on sand, survived longer and left more offspring — selection favoured their alleles",
          ["The mice each grew lighter fur to blend in, and passed the change on",
            "Sand radiation mutated every mouse's fur gene simultaneously",
            "The mice are a different species that always had light fur"]],
      ];
      const [scene, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${scene} What is the mechanism?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Selection needs four ingredients, always in this order: VARIATION already present, a SELECTION PRESSURE, SURVIVAL of the better-suited, and INHERITANCE of the alleles that helped. Anything where the organism adapts on purpose, or the environment writes the DNA, is the classic misconception.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["What does 'survival of the fittest' actually mean in evolution?", "Best-suited to the environment — leaving the most offspring, not the strongest individual",
          ["The physically strongest animal outlives the others",
            "The fittest means the healthiest and least ill",
            "Only the fastest predators survive to breed"]],
        ["Why is genetic drift stronger in small populations?", "Chance has more influence when few individuals carry the alleles — a run of bad luck can delete a variant entirely",
          ["Small populations mutate faster — more change per individual",
            "Drift only acts through predators, which small populations attract",
            "It is not — drift is strongest in large populations"]],
        ["Two populations of the same species are separated by a new river and cannot interbreed.", "Their allele pools change independently (selection and drift act differently) — over time they may become two species",
          ["The river forces both populations to evolve identically",
            "They remain one species as long as they look similar",
            "Isolation stops evolution — change needs mixing"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Fitness is reproductive success, not gym performance; drift is randomness given room to act; and isolation is the seed of speciation because it splits the gene pool that selection then shapes separately. Speciation is complete when the two populations can no longer produce fertile offspring together.`,
        difficulty: 0.62,
      };
    }
    const n0 = r.pick([100, 200, 500]);
    const gen = r.pick([2, 3, 4]);
    const fit = 0.9;
    const survivors = deepNum(n0 * Math.pow(fit, gen), 0);
    return {
      prompt: `A sensitive bacterium population starts at ${n0} cells. Each generation of antibiotic treatment, only ${Math.round(fit * 100)}% survive (the rest are resistant already and all survive). Estimate the sensitive cells remaining after ${gen} generations.`,
      correct: `About ${survivors} sensitive cells — ${Math.round(fit * 100)}% of the population survives each generation, so ${n0} × (0.9)^${gen}`,
      wrongs: pickDistinct(`About ${survivors} sensitive cells — ${Math.round(fit * 100)}% of the population survives each generation, so ${n0} × (0.9)^${gen}`, [
        `${n0} × ${gen} × 0.9 = ${deepNum(n0 * gen * fit, 0)} — the generational effect was added, not compounded`,
        `Zero — any antibiotic treatment kills all sensitive cells in one step`,
        `${deepNum(n0 * Math.pow(fit, gen - 1), 0)} — the count stops one generation early`,
      ]),
      tags: [],
      explanation: `Survival compounds multiplicatively: each generation's survivors are 0.9 × the last, giving ${n0} × 0.9^${gen} ≈ ${survivors}. Meanwhile the resistant cells face NO such decline — their share of the population climbs every generation, which is exactly why courses must be finished and why resistance spreads so fast.`,
      difficulty: 0.75,
    };
  },

  /** Food-chain energy transfer with a calculation, the interdependence
   *  a removal cascades, and cycling of materials read from a diagram. */
  "ecosystems": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const chains: Array<[string, string, string[]]> = [
        ["Why are food chains rarely longer than five levels?", "About 90% of the energy is lost at each transfer — respiration, movement, heat, excretion — so too little remains to support another level",
          ["Predators refuse to hunt other predators, capping the chain",
            "Plants run out of sunlight to pass upward beyond five steps",
            "Larger animals need fewer calories, ending the chain naturally"]],
        ["In grass → rabbit → fox, the fox population crashes from disease. What happens first?", "The rabbit population rises — fewer foxes means less predation — then overshoots and may crash as grass runs short",
          ["The rabbits decline immediately — foxes keep them healthy",
            "Nothing changes — rabbits were limited by grass alone",
            "The grass population explodes, then stabilises at a new high"]],
        ["Why does a pyramid of biomass nearly always narrow going up?", "Each level's biomass is smaller because energy is lost between levels — consumers cannot contain more than they receive",
          ["Top predators are physically smaller than their prey",
            "Biomass shrinks because animals contain more water than plants",
            "The pyramid shape is drawn by convention, not by data"]],
      ];
      const [q, answer, wrong] = chains[r.int(0, chains.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The energy story runs everything: producers capture ~1% of sunlight, and each consumer level passes on only ~10% of what it receives. Every population is held by the level BELOW it and the level ABOVE it — interdependence is the exam's word for that two-way grip.`,
        difficulty: 0.45,
      };
    }
    if (variant < 0.67) {
      const calc: Array<[number, string]> = [
        [10000, "grass → grasshopper → shrew → owl"],
        [50000, "algae → zooplankton → small fish → heron"],
        [20000, "leaves → aphid → ladybird → songbird"],
      ];
      const [base, chain] = calc[r.int(0, calc.length - 1)];
      const lvl2 = base / 10;
      const lvl3 = lvl2 / 10;
      const lvl4 = lvl3 / 10;
      return {
        prompt: `A food chain (${chain}) starts with ${base.toLocaleString("en-GB")} J of energy in the producers. Assuming 10% transfer at each step, how much energy reaches the final (4th) consumer?`,
        correct: `${lvl4.toLocaleString("en-GB")} J — divide by 10 once per link (${base.toLocaleString("en-GB")} → ${lvl2.toLocaleString("en-GB")} → ${lvl3.toLocaleString("en-GB")} → ${lvl4.toLocaleString("en-GB")})`,
        wrongs: pickDistinct(`${lvl4.toLocaleString("en-GB")} J — divide by 10 once per link (${base.toLocaleString("en-GB")} → ${lvl2.toLocaleString("en-GB")} → ${lvl3.toLocaleString("en-GB")} → ${lvl4.toLocaleString("en-GB")})`, [
          `${(base / 3).toLocaleString("en-GB")} J — the energy splits evenly among the four levels`,
          `${lvl3.toLocaleString("en-GB")} J — divide only twice, since the producers themselves are level zero`,
          `${(base * 0.4).toLocaleString("en-GB")} J — each level keeps 40% of what it gets`,
        ]),
        tags: [],
        explanation: `Each link multiplies the remaining energy by 0.1: after three links, ${base.toLocaleString("en-GB")} × 0.1³ = ${lvl4.toLocaleString("en-GB")} J. The lost 90% at each step went to life processes, movement and heat — which is why top predators are rare and large territories are needed to support them.`,
        difficulty: 0.65,
      };
    }
    const cycles: Array<[string, string, string[]]> = [
      ["the water cycle: what drives the evaporation step and returns water to the atmosphere?", "Energy from the Sun — it powers evaporation and transpiration from leaves",
        ["Respiration in animals releases water vapour in sufficient quantity",
          "Gravity pulls groundwater upward through soil capillaries",
          "Wind alone converts liquid to vapour without an energy source"]],
      ["the carbon cycle: which process moves carbon FROM the atmosphere INTO living organisms?", "Photosynthesis — plants fix CO₂ into glucose",
          ["Respiration — it recycles carbon into sugars", "Combustion of fossil fuels, which plants then absorb", "Decomposition, which returns carbon to the soil"]],
      ["decomposers' role in both cycles", "They break down dead material, returning carbon to the air (respiration) and minerals to the soil — without them, nutrients would lock away",
        ["They produce their own food by photosynthesis, adding biomass",
          "They only recycle water, not carbon or minerals",
          "They prevent decay so that nutrients stay in living tissue"]],
    ];
    const [q, answer, wrong] = cycles[r.int(0, cycles.length - 1)];
      return {
      prompt: q,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Cycles have exactly one engine (the Sun) and two pumps (photosynthesis in, respiration out) for carbon; water rides the same engine through evaporation and transpiration. Decomposers are the closing gear — the reason material is AVAILABLE again rather than buried with the dead.`,
      difficulty: 0.75,
    };
  },

  /** Biodiversity: what it measures, why it matters (interdependence),
   *  and human-impact data read from a table. */
  "biodiversity": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["Which is the largest DIRECT driver of current species loss worldwide?", "Habitat destruction — land-use change to farmland and urban development",
          ["Natural predators increasing in the wild", "Species migrating into new regions", "Volcanic and tectonic activity"]],
        ["A farm switches from a monoculture field to one with hedgerows, wild strips and mixed crops. What happens to biodiversity, and why?", "It rises — more habitats and food sources support more species, and the interactions between them return",
          ["It falls — mixing crops introduces competition that eliminates species",
            "It is unchanged — biodiversity is genetic, not spatial",
            "It rises only if new species are deliberately introduced"]],
        ["Why does losing ONE species often cause others to decline?", "Interdependence — species rely on each other for food, pollination, shelter; removing one link cascades",
          ["Other species die of loneliness — social bonds are ecological",
            "The remaining species breed faster and outcompete everything",
            "It usually does not — ecosystems absorb every loss without effect"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Biodiversity counts SPECIES richness AND their interactions; a habitat is not a car park with different cars on it. Habitat change removes the stage on which every relationship plays out — which is why land-use change tops every global list of threats.`,
        difficulty: 0.4,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["A conservation programme breeds animals in zoos and releases them. Why does this often FAIL to save the species?", "The habitat that caused the decline may still be shrinking — captive breeding does not restore a place to live or the food web it belongs to",
          ["Zoo animals always lose the instincts their wild cousins had",
            "Released animals are rejected by species that never met them",
            "Captive breeding reduces genetic diversity permanently"]],
        ["Why is a large, single protected area usually better than several small ones of the same total area?", "Large areas support bigger populations and intact food webs — small fragments suffer edge effects and inbreeding",
          ["Small areas are always polluted by their surroundings",
            "Large areas receive more rainfall by definition",
            "Animals refuse to cross the boundaries of small reserves"]],
        ["An alien species is introduced and outcompetes natives. The best response is usually…", "Control or remove the invader AND restore the native habitat — the ecosystem must be able to support natives again",
          ["Introduce a second alien species to eat the first",
            "Breed the natives in captivity and release more each year",
            "Do nothing — balance restores itself within a generation"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Conservation reasoning is systems reasoning: a species is only as safe as its habitat, its food web and its gene pool. Single-lever fixes (breed and release, add a predator) fail precisely because they leave the original pressure untouched.`,
        difficulty: 0.6,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["A river survey: mayfly larvae drop from 200 to 20 per m² downstream of a farm outfall; dissolved oxygen is unchanged.", "A specific pollutant (likely pesticide or nutrient-driven food web change) harms the mayflies — oxygen alone cannot explain the drop",
        ["The river's oxygen must have fallen — no other factor affects larvae",
          "Mayflies migrated upstream to escape the farm",
          "The count error is too large — real populations never change 10-fold"]],
      ["Two woods: Wood A has 4 tree species and 30 invertebrate species; Wood B has 12 tree species and 90 invertebrate species.", "Wood B is more biodiverse — plant species richness supports more of the food web above it",
        ["Wood A is equally biodiverse — invertebrates do not count in biodiversity",
          "Wood A is more biodiverse — fewer species means less competition",
          "The woods cannot be compared without knowing the woods' areas"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `Interpret the data: ${obs} What conclusion is best supported?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Ecological data is read by holding variables in mind: what stayed the same (oxygen) rules out one explanation; what differs (plant richness) points at the mechanism — more plant diversity, more niches, more everything above.`,
      difficulty: 0.75,
    };
  },

  /** Pathogens vs defences, the vaccine/antibiotic distinction with the
   *  reason each works or fails, and herd-immunity data read. */
  "immune-health": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["Why don't antibiotics work against colds and flu?", "They are viral — antibiotics attack bacterial machinery (walls, ribosomes) that viruses do not have; viruses hijack your own cells",
          ["Colds are too strong for antibiotics to penetrate",
            "Antibiotics only prevent illness rather than curing it",
            "Viruses hide from every known chemical inside mucus"]],
        ["How does a vaccination protect against future infection?", "It exposes the immune system to a harmless form of the pathogen — memory cells form, so the real pathogen meets a fast secondary response",
          ["It fills the blood with ready-made antibodies that last a lifetime",
            "It kills all bacteria in the body before they can mutate",
            "It coats the skin so pathogens cannot enter at all"]],
        ["Why must a course of antibiotics be FINISHED even when you feel better?", "The most resistant bacteria survive the early doses — stopping early leaves them to multiply, spreading resistance",
          ["Feeling better is temporary — the symptoms always return without the full course",
            "Leftover antibiotics lose potency and become toxic if stored",
            "The remaining doses build a vaccine-like memory against reinfection"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Three facts carry the whole topic: viruses lack their OWN metabolism (so antibiotics have nothing to attack), vaccination trains MEMORY cells rather than supplying them, and unfinished courses are evolution in action — selection for the survivors.`,
        difficulty: 0.4,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["The body's FIRST line of defence", "Barriers — skin, mucus, stomach acid, clotting: they stop entry and are non-specific",
          ["White blood cells producing antibodies within minutes",
            "Fever, which slows pathogens by raising body temperature",
            "Memory cells from earlier infections"]],
        ["The role of ANTIBODIES in an infection", "They bind to specific antigens on a pathogen's surface, tagging it for destruction — each antibody fits one antigen shape",
          ["They engulf and digest pathogens directly, like miniature stomachs",
            "They neutralise all pathogens equally — a general-purpose chemical",
            "They reproduce inside the pathogen, destroying it from within"]],
        ["The SECOND infection with the same pathogen is fought off faster because…", "Memory B-cells from the first infection produce antibodies quickly and in quantity — the secondary response",
          ["The first infection permanently damaged the pathogen's abilities",
            "Antibodies from the first infection remain circulating at full strength",
            "The skin thickens at sites the pathogen previously entered"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The immune story is layered: barriers (non-specific, instant) → phagocytes (non-specific, hours) → lymphocytes and antibodies (specific, days) → memory (specific, lifelong-ready). Vaccination is a rehearsal of layers three and four without the disease.`,
        difficulty: 0.58,
      };
    }
    const threshold = r.pick([80, 85, 92, 95]);
    return {
      prompt: `For a highly contagious disease, roughly ${threshold}% of a population must be vaccinated for herd protection. A town vaccinates ${threshold - 10}% and an outbreak follows. Explain why unvaccinated AND vaccinated people were affected.`,
      correct: `Below the ${threshold}% threshold the disease still spreads — vaccinated individuals mostly avoid illness, but the outbreak exposes gaps; no vaccine is 100% effective, so some vaccinated people remain susceptible`,
      wrongs: pickDistinct(`Below the ${threshold}% threshold the disease still spreads — vaccinated individuals mostly avoid illness, but the outbreak exposes gaps; no vaccine is 100% effective, so some vaccinated people remain susceptible`, [
        "The vaccine failed entirely — vaccinated people should never catch the disease",
        "Unvaccinated people were the only ones affected; the report must be in error",
        "The threshold is a legal minimum, not a scientific one — the outbreak was coincidence",
      ]),
      tags: [],
      explanation: `Herd immunity is a population-level effect: transmission chains break when too few susceptible hosts remain. ${threshold}% is the threshold for THIS disease's contagion; below it, chains survive. Vaccinated individuals are far less likely to be ill (that is the point), but protection is probabilistic, not absolute — which is why the percentage matters so much.`,
      difficulty: 0.75,
    };
  },

  /** Iteration: substitution into recurrence relations across three
   *  relations, the fixed-point concept, and a convergence read. */
  "iteration": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const recs: Array<[string, number, string, string]> = [
        ["x_{n+1} = (x_n + 5/x_n)/2, x₀ = 2", 0, "2.25", "Newton's method for √5"],
        ["x_{n+1} = (x_n + 7/x_n)/2, x₀ = 3", 0, "2.6667", "Newton's method for √7"],
        ["x_{n+1} = x_n² − 1, x₀ = 1.5", 0, "1.25", "squaring then subtracting"],
      ];
      const [def, idx, correct, via] = recs[r.int(0, recs.length - 1)];
      return {
        prompt: `An iteration is defined by ${def}. Find x_{${idx + 1}}.`,
        correct,
        wrongs: pickDistinct(correct, ["2.5", "3.5", "2.2", "2.75", "1.75", "2.6", "1.25", "2.4"]),
        tags: [],
        explanation: `Substitute x₀ into the formula and evaluate once: x₁ = ${correct}. This is ${via} — each round of substitution normally lands closer to the fixed point the iteration is hunting.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["x_{n+1} = 2 + 1/x_n with x₀ = 1", "3 → 2.3333 → 2.4286 — the values are settling toward a fixed point",
          ["3 → 2.3333 → 2.4286 — the iteration diverges without limit",
            "3 → 2.3333 → 2.4286 — the values cycle in a fixed loop",
            "The iteration is invalid — x appears on both sides"]],
        ["Solving x³ + x = 10 is rewritten as x = ³√(10 − x). Why is this useful?", "It turns a cubic equation into an iteration — guess x, substitute, and repeat until the answer stops changing",
          ["The cubic can now be factorised more easily",
            "It removes the need for the x³ term entirely",
            "Iteration always gives an exact answer, unlike algebra"]],
        ["An iteration produces values 3, 3.1, 3.09, 3.091, 3.091… to more and more decimal places.", "The sequence has converged — 3.091 (to 3 d.p.) is the root the iteration found",
          ["The sequence has diverged — the values are growing",
            "The iteration is stuck and should be restarted with a new x₀",
            "Convergence means the values must reach exactly 3.091 and stop"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. An iteration hunts a FIXED POINT — a value that maps to itself. When successive values agree to the accuracy you need, you have found the root to that accuracy; the recurrence does the work that rearranging algebraically sometimes cannot.`,
        difficulty: 0.6,
      };
    }
    const a = r.pick([2, 3, 4, 5]);
    const x0 = r.pick([1, 2, 3]);
    const x1 = deepNum((x0 + a / x0) / 2, 4);
    const x2 = deepNum((Number(x1) + a / Number(x1)) / 2, 4);
    return {
      prompt: `Use the iteration xₙ₊₁ = (xₙ + ${a}/xₙ)/2 with x₀ = ${x0}. Find x₁ and x₂ to 3 decimal places, and state what the iteration converges to.`,
      correct: `x₁ = ${deepNum(Number(x1), 3)}, x₂ = ${deepNum(Number(x2), 3)} — converging to √${a} ≈ ${deepNum(Math.sqrt(a), 3)}`,
      wrongs: pickDistinct(`x₁ = ${deepNum(Number(x1), 3)}, x₂ = ${deepNum(Number(x2), 3)} — converging to √${a} ≈ ${deepNum(Math.sqrt(a), 3)}`, [
        `x₁ = ${deepNum(Number(x1), 3)}, x₂ = ${deepNum(Number(x2) + 0.1, 3)} — the second substitution used x₀ again`,
        `x₁ = ${deepNum(a / x0, 3)}, x₂ = ${deepNum(Number(x1), 3)} — only the division term was used`,
        `The iteration converges to ${deepNum(Number(x2), 3)} exactly — iterations stop changing after two steps`,
      ]),
      tags: [],
      explanation: `x₁ = (${x0} + ${a}/${x0})/2 = ${x1}; x₂ = (${x1} + ${a}/${x1})/2 = ${x2}. Each step is one round of Newton's method for √${a}, and the values close in on ${deepNum(Math.sqrt(a), 3)} — feed x₂ back in and the next value changes in the fourth decimal place only.`,
      difficulty: 0.75,
    };
  },

  // ── WIDENING FAMILIES — concepts whose base held only three scenes ────────

  /** Osmosis across three settings, the gradient logic both directions, and
   *  a surface-area/distance diffusion comparison. */
  "diffusion": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["an animal cell is placed in PURE water", "Water enters by osmosis and the cell BURSTS (lysis) — animal cells have no wall to resist the pressure",
          ["Water leaves — the cell shrivels like a plant cell would", "Nothing — membranes block water in animals", "The cell becomes turgid — that is the animal equivalent"]],
        ["a plant cell is placed in PURE water", "Water enters by osmosis and the cell becomes TURGID — the wall stops bursting, and turgor keeps the plant upright",
          ["It bursts — no cell survives pure water", "Water leaves — pure water sucks solutes out", "Nothing changes — plant membranes are waterproof"]],
        ["a plant cell sits in CONCENTRATED salt solution", "Water leaves by osmosis; the membrane pulls from the wall — plasmolysis — and the cell goes flaccid",
          ["Salt enters the cell until concentrations equalise", "Water enters to dilute the salt outside", "The wall collapses inward, bursting the membrane"]],
      ];
      const [setting, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${setting} What happens, and why?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Osmosis is water diffusing down its potential gradient through a partially permeable membrane — always from the MORE dilute side to the MORE concentrated. The wall (plant) versus no wall (animal) decides bursting versus turgor; that single difference is the question's hinge.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["Oxygen enters the blood from the lungs", "The blood's O₂ concentration is lower than the air's — diffusion runs down the gradient into the blood",
          ["The blood actively pumps oxygen in using energy",
            "Oxygen is attracted to haemoglobin from outside",
            "The lungs push oxygen in by increasing the pressure"]],
        ["Carbon dioxide leaves the blood at the lungs", "The blood's CO₂ concentration is higher than the air's — the gradient runs outward",
          ["CO₂ is actively transported out by carrier proteins",
            "Breathing physically squeezes CO₂ from the blood",
            "CO₂ diffuses in — blood always holds more than air"]],
        ["Glucose is reabsorbed from the kidney tubule into the blood even when blood glucose is already high", "Active transport — the gradient runs the wrong way for diffusion, so energy (ATP) is spent",
          ["Diffusion — the tubule fluid is more concentrated than the blood",
            "Osmosis — glucose travels with the water",
            "Filtration pressure pushes glucose against the gradient"]],
      ];
      const [setting, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${setting} Which transport process is at work, and how do you know?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The decision rule is the GRADIENT'S DIRECTION: down it, no energy (diffusion or osmosis for water); against it, energy (active transport). Exams hide the direction in the wording — "even when the blood is already high" is the giveaway that energy must be spent.`,
        difficulty: 0.65,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["A cube of agar at 1 cm³ colours in 2 minutes; the same volume cut into 27 tiny cubes colours in 20 seconds.", "Cutting raises the surface-area-to-volume ratio — diffusion only enters through the surface, so more surface per volume means faster colouring throughout",
        ["The small cubes are lighter, so the dye reaches them faster",
          "Cutting opens the agar's structure, letting dye flow through channels",
          "Total surface area is unchanged by cutting — the rate must be an error"]],
      ["A cell that is long and thin absorbs oxygen faster than a sphere of the same volume.", "The elongated shape maximises surface area for diffusion while keeping every interior point close to the membrane — short distance, big area",
        ["The elongated cell is thinner-walled, so oxygen leaks in faster",
          "Long cells have stronger membranes that pull oxygen in",
          "Shape does not affect diffusion — volume alone decides the rate"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `Exchange surfaces: ${obs} What principle explains it?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Diffusion time scales with DISTANCE SQUARED — doubling the depth a molecule must cross quadruples the wait. That brutal scaling is why no cell relies on diffusion alone beyond about a millimetre, and why gills, villi and alveoli are all thin, folded and wet.`,
      difficulty: 0.75,
    };
  },

  /** The induction factors in combinations, the transformer equation, and
   *  reading a dynamo/generator as the mirror of the motor. */
  "em-induction": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["the number of turns on the coil is doubled AND the magnet's speed is doubled", "The induced voltage is four times larger — both factors multiply the rate of change of flux",
          ["The voltage doubles — only the stronger factor counts",
            "The voltage is unchanged — the effects cancel",
            "The voltage halves — more turns adds resistance that swallows the gain"]],
        ["a magnet is pushed into a coil, held still, then pulled out", "Voltage appears on entry (one way), nothing while still, then voltage on exit (the other way) — only CHANGING flux induces",
          ["A constant voltage flows the whole time — presence of flux is enough",
            "Voltage appears only while the magnet is inside and stationary",
            "The entry and exit voltages flow the same direction"]],
        ["a wire cuts field lines at right angles, then at a shallower angle", "The shallower angle cuts FEWER lines per second — a smaller component of motion across the field, so less voltage",
          ["The angle does not matter — any motion induces fully",
            "The shallower angle increases voltage — more time in the field",
            "Only parallel motion induces a voltage"]],
      ];
      const [change, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: `${change} What happens to the induced voltage?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["motor-gen"],
        explanation: `${answer}. Induction scales with the RATE OF CHANGE of flux: more turns × faster motion × stronger magnet × the angle's perpendicular component. A stationary magnet in a coil induces nothing, however strong — flux must be CHANGING, which is the idea every distractor tries to blur.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["A transformer steps 230 V down to 11.5 V. The primary coil has 2 000 turns.", "250 turns — Vs/Vp = Ns/Np, so Ns = 2000 × 11.5/230",
          ["40 000 turns — the ratio is inverted (2000 × 230/11.5)", "2 000 turns — a transformer preserves the turn count",
            "46 turns — the voltage is divided by 5, so turns divide by 2000/11.5"]],
        ["A transformer is 100% efficient: 230 V in, 2 A drawn by the primary. The secondary delivers 46 V.", "10 A — power is conserved: 230 × 2 = 46 × Is",
          ["0.4 A — current transforms by the same ratio as voltage",
            "2 A — an ideal transformer passes current through unchanged",
            "20 A — current doubles when voltage halves and the numbers are small"]],
        ["A transformer's primary is connected to DC and the switch is closed — then held closed.", "A brief voltage pulse appears in the secondary only at switch-on and switch-off; between them the flux is constant and nothing is induced",
          ["A steady voltage appears in the secondary for as long as the switch stays closed",
            "The secondary delivers the same voltage continuously, just smaller",
            "Nothing is ever induced — DC cannot work a transformer even momentarily"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: ["motor-gen"],
        explanation: `${answer}. Two equations run transformers: turns ratio (Vs/Vp = Ns/Np) and power conservation (VpIp = VsIs for an ideal one). Voltage steps DOWN, current steps UP — they trade. And the DC question is really about CHANGE: closing and opening the switch are the only moments flux changes.`,
        difficulty: 0.65,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["A bicycle dynamo spins a magnet near a coil as the wheel turns. The lamp glows brighter as the cyclist pedals faster.", "Faster rotation changes the flux more quickly — larger induced voltage — and brightness reports that voltage",
        ["Faster pedalling pushes more pre-made current from the dynamo's stored charge",
          "The lamp's resistance falls at speed, drawing more current from a fixed voltage",
          "Brightness follows the magnet's strength, which grows with speed"]],
      ["A power station generator and a laboratory motor are the same device run in opposite directions.", "The generator converts motion to electrical energy (right-hand rule); the motor converts electrical energy to motion (left-hand rule) — mirror processes",
        ["They differ in construction — generators cannot be run as motors",
          "Both use the left-hand rule; only the energy flow direction differs on paper",
          "The motor's rule is the right hand because its current is induced"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `${obs} What does the comparison show?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. The generator effect IS the motor effect reversed: motion + field → induced current, versus current + field → force. Same physics, energy flowing the other way — which is why the rules use opposite hands and why regenerative braking exists at all.`,
      difficulty: 0.78,
    };
  },

  /** Metallic bonding: conduction, malleability and alloy-hardness as three
   *  faces of the same structure, plus melting-point data across metals. */
  "metallic-bonding": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const cases: Array<[string, string, string[]]> = [
        ["Why does a copper wire conduct electricity?", "Delocalised electrons from every atom form one mobile 'sea' — a voltage makes them drift, and that drift is the current",
          ["Copper ions slide along the wire carrying the charge",
            "Electrons are transferred permanently from atom to atom in a chain",
            "Copper's protons move through the lattice under voltage"]],
        ["Why does the same copper wire conduct heat well?", "The free electrons pick up kinetic energy and travel through the lattice, transferring it — the same mobility that carries current",
          ["Heat travels as radiation through the metal's structure",
            "The ions vibrate and physically travel along the wire",
            "Copper's low density lets heat rise through it like a fluid"]],
        ["Why is a metal's electrical conductivity lost when it MELTS?", "It is not — molten metals still conduct (the electrons remain free); it is ionic substances that lose conduction when their lattice locks",
          ["Melting freezes the electron sea in place",
            "Molten metals become insulators — all lattices break on melting",
            "Conductivity rises on melting because the ions flow freely"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The metallic model is: FIXED positive ions in a sea of DELOCALISED electrons. Everything follows — conduction (mobile electrons), heat transfer (the same), malleability (ions slide while the sea re-bonds). The melt question flips the comparison to ionic lattices, which do lose their charge carriers.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      const cases: Array<[string, string, string[]]> = [
        ["An aluminium alloy (with copper added) is stronger than pure aluminium. Why?", "The differently sized copper atoms disrupt the lattice's neat layers — planes can no longer slide easily, so the metal resists bending",
          ["Copper donates extra free electrons that bond the layers together",
            "The alloy's covalent bonds replace metallic ones and are far stronger",
            "Copper atoms fill the gaps, making the lattice denser and heavier"]],
        ["Pure gold is soft enough to shape by hand; 18-carat gold (with copper or silver) is much harder.", "The added atoms jam the slip planes — the same delocalised bonding holds, but layer-sliding is obstructed",
          ["The additives react chemically with the gold, forming a new compound",
            "Pure gold's electron sea is too strong, making it slippery",
            "Hardness comes from the additives' own higher melting points"]],
        ["A blacksmith hammers a red-hot iron bar into shape without shattering it.", "The layers of ions slide over each other while the delocalised electrons hold the structure together — non-directional bonding survives deformation",
          ["The heat melts the iron locally, and liquid iron fills the new shape",
            "Hammering aligns the iron's atoms into a stronger configuration",
            "Ionic bonds in the iron break and instantly reform at the new shape"]],
      ];
      const [q, answer, wrong] = cases[r.int(0, cases.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Malleability and alloying are two sides of one idea: pure metals deform because uniform layers SLIDE, and alloys resist because mixed sizes JAM the slide. The bonding itself never changes — no covalent or ionic story needed, which is exactly what the wrong options invent.`,
        difficulty: 0.65,
      };
    }
    const rows: Array<[string, string, string[]]> = [
      ["Melting points: Na 98 °C, Mg 650 °C, Al 660 °C — rising across the period.", "More delocalised electrons per atom and higher ionic charge strengthen the metallic bonding — more energy to pull the lattice apart",
        ["Heavier atoms need more energy to melt, and mass rises across the period",
          "The atoms shrink, so their nuclei are easier to separate",
          "Across the period the metals become more covalent, and covalent bonds are stronger"]],
      ["Mercury melts at −39 °C while tungsten melts at 3 422 °C — both are metals.", "Both have delocalised electrons (both conduct), but the STRENGTH of the metallic bonding differs enormously — bonding strength, not 'metal or not', sets the melting point",
        ["Mercury is not a true metal — only conductors with high melting points are",
          "Mercury's low melting point shows its electron sea is absent",
          "Tungsten's high melting point proves it conducts by ion flow instead"]],
    ];
    const [obs, answer, wrong] = rows[r.int(0, rows.length - 1)];
    return {
      prompt: `Interpret the data: ${obs} What does it show?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. 'Metallic' is a category, not a strength — the category guarantees mobile electrons (conductivity), while the charge on the ions and the number of delocalised electrons set the bond's strength. Data questions ask you to separate what the category promises from what the particular element delivers.`,
      difficulty: 0.78,
    };
  },

  /** Logic: three valid/invalid inferences beyond the base's fallacy set,
   *  quantifier reading, and counterexample construction. */
  "logic-maths": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const scenes: Array<[string, string, string[]]> = [
        ["\"If it rains, the match is cancelled.\" The match was NOT cancelled. What follows?",
          "It did not rain — this is the contrapositive, which always holds",
          ["It rained, but the match survived anyway", "Nothing — the contrapositive is not a valid step", "The statement itself must be false"]],
        ["\"Either the butler or the gardener did it.\" The butler did not do it. What follows?",
          "The gardener did it — disjunctive syllogism: one option eliminated, the other stands",
          ["Neither of them did it — the first statement was wrong", "Nothing — 'either' allows both to be innocent", "The butler did it after all"]],
        ["\"If A then B\" and \"If B then C\" both hold. What follows?",
          "If A then C — implications chain end to end",
          ["If C then A — chains run both ways", "Nothing — the two statements are unrelated", "If B then A — the middle term reverses"]],
      ];
      const [q, answer, wrong] = scenes[r.int(0, scenes.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Valid moves: the contrapositive (¬B → ¬A), disjunctive syllogism (one branch eliminated), and chaining. The classic invalid moves — denying the antecedent and affirming the consequent — are exactly the distractors above.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      const scenes: Array<[string, string, string[]]> = [
        ["\"All students in the club study French.\" Which statement MUST be true?",
          "Anyone who does not study French is not in the club",
          ["Everyone who studies French is in the club",
            "Some students in the club do not study French",
            "The club has no members who study German"]],
        ["\"Some prime numbers are odd.\" Which statement follows?",
          "At least one prime number is odd — and in fact all but one are",
          ["All prime numbers are odd — 2 is the exception that proves the rule",
            "No prime number is even",
            "Some primes are even — infinitely many"]],
        ["\"No reptile is warm-blooded.\" A python is a reptile. What follows?",
          "The python is not warm-blooded — the universal rule applies to every reptile",
          ["The python may or may not be warm-blooded",
            "Warm-blooded animals might still include pythons",
            "Nothing — universals never apply to specific cases"]],
      ];
      const [q, answer, wrong] = scenes[r.int(0, scenes.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Quantifiers have exact force: ALL licenses its contrapositive, SOME licenses only existence, NO works like 'all … are not'. The distractors each overstate or understate the quantifier — that is the whole error class.`,
        difficulty: 0.6,
      };
    }
    const claims: Array<[string, string, string[]]> = [
      ["\"n² − n + 7 is prime for every whole number n.\"", "n = 7: 49 − 7 + 7 = 49 = 7 × 7, not prime — one counterexample kills the universal claim",
        ["True — checking n = 1, 2, 3 all give primes",
          "It cannot be decided without checking infinitely many values",
          "n = 0 gives 7, which is prime, so the claim starts true"]],
      ["\"Every number of the form 2ⁿ − 1 is prime.\"", "n = 4: 2⁴ − 1 = 15 = 3 × 5 — composite, so the claim fails",
        ["True — 1, 3, 7, 15… are all prime",
          "It is undecidable — no counterexample can be written down",
          "n = 1 gives 1, which is prime, confirming the pattern"]],
      ["\"The sum of two square numbers is never a square.\"", "3² + 4² = 5² — one counterexample refutes the 'never'",
        ["True — squares grow too fast to sum to a square",
          "It depends on which two squares are chosen, so it is undecidable",
          "The claim is about algebra, so numbers cannot test it"]],
    ];
    const [claim, answer, wrong] = claims[r.int(0, claims.length - 1)];
    return {
      prompt: `${claim} Which response disposes of it?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. A universal claim ('every', 'never') dies by a single counterexample, and survives only by a general argument. Checking finitely many cases proves nothing about 'all' — but one bad case destroys everything.`,
      difficulty: 0.7,
    };
  },

  /** Proof technique matching, the flaw-spotting that examiners love, and
   *  an exhaustion-vs-algebra decision. */
  "proof": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const scenes: Array<[string, string, string[]]> = [
        ["Claim: \"the sum of two consecutive whole numbers is always odd.\" Which method proves it?",
          "Write them as n and n + 1; the sum is 2n + 1, which is odd for every n — algebra covers all cases at once",
          ["Test several pairs and observe every sum is odd",
            "Draw a number line and check the pattern visually",
            "Assume the sum can be even, then look for a counterexample"]],
        ["Claim: \"every even number squared is a multiple of 4.\" Which method proves it?",
          "Write it as 2k; (2k)² = 4k², a multiple of 4 by construction",
          ["Check 2, 4, 6, 8 and extrapolate",
            "Prove it for 2 and note the rest are multiples of 2",
            "Assume some even square is not a multiple of 4 and hunt for it"]],
        ["Claim: \"if n² is even then n is even.\" Which method proves it cleanly?",
          "The contrapositive: if n is odd, n = 2k + 1 gives n² = 4k² + 4k + 1, which is odd — so an even square forces n even",
          ["Test even squares and confirm their roots are even",
            "Directly divide n by 2 and show the remainder is zero",
            "Assume n² is even and n is odd, then assert a contradiction without deriving one"]],
      ];
      const [q, answer, wrong] = scenes[r.int(0, scenes.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. Algebra with a general n is the workhorse: one line covers every case. Finitely many checks are decoration, and the contrapositive turns 'then' statements into easier 'if' statements whenever the forward direction is awkward.`,
        difficulty: 0.55,
      };
    }
    if (variant < 0.67) {
      const flaws: Array<[string, string, string[]]> = [
        ["A student proves x = 1 = 2 by dividing both sides of (x − 1)(x − 2) = 0 by (x − 1). The flaw is…",
          "Dividing by (x − 1) is dividing by zero when x = 1 — the case being proved",
          ["The expansion of (x − 1)(x − 2) was wrong",
            "Two numbers cannot be equal and unequal at once",
            "Quadratics have two roots, so x must have two values"]],
        ["A student proves \"all roses are red\" by exhibiting three red roses. The flaw is…",
          "Three examples are not all roses — a universal claim needs a general argument or a definition",
          ["Roses come in shades, and shades are not colours",
            "The examples were not chosen randomly enough",
            "Nothing — inductive proof over examples is valid for universals"]],
        ["A student proves the angles of a triangle sum to 180° by measuring five triangles and averaging. The flaw is…",
          "Measurement error plus finitely many cases — averaging observations is evidence, not proof",
          ["The average of five angles cannot represent all triangles",
            "Triangles must be measured in radians for the sum to be exact",
            "Nothing — five is the smallest sample that proves a universal"]],
      ];
      const [q, answer, wrong] = flaws[r.int(0, flaws.length - 1)];
      return {
        prompt: q,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: [],
        explanation: `${answer}. The three classic proof crimes: dividing by a quantity that can be zero, generalising from finitely many examples, and substituting measurement for argument. Spotting the flaw is worth more than constructing a new proof — it shows you know what a proof IS.`,
        difficulty: 0.62,
      };
    }
    const scenes: Array<[string, string, string[]]> = [
      ["\"Every perfect square ends in 0, 1, 4, 5, 6 or 9.\"",
        "Exhaustion over the last digit of n (0–9), squaring each case — a finite list checked completely",
        ["Algebra: expand (10a + b)² and inspect",
          "Counterexample: find a square ending in 2",
          "Contradiction: assume a square ends in 2 and derive 0 = 1"]],
      ["\"√2 is irrational.\"",
        "Contradiction — assume a/b in lowest terms, show both a and b must be even, contradicting lowest terms",
        ["Exhaustion — check denominators up to some bound",
          "Induction on the continued-fraction expansion",
          "Counterexample — exhibit the fraction it equals"]],
      ["\"The sum of the first n odd numbers is n².\"",
        "Induction — verify n = 1, then show the (k + 1)th step adds 2k + 1, completing the square",
        ["Exhaustion over n up to 100",
          "Contradiction — assume the sum is never n²",
          "Counterexample is impossible, so the claim is self-evident"]],
    ];
    const [claim, answer, wrong] = scenes[r.int(0, scenes.length - 1)];
    return {
      prompt: `${claim} Which proof strategy is the right instrument, and why?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Match the tool to the claim's shape: finite case-space → exhaustion; a negative existence claim (irrationality) → contradiction; a statement indexed by n → induction. Choosing the instrument IS the proof-writing skill the question is testing.`,
      difficulty: 0.75,
    };
  },

  /** Independent events beyond the base's coin question: exactly-k heads,
   *  with-replacement pairs, and one-of-each draws. */
  "tree-diagrams": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const n = r.pick([3, 4]);
      const k = n === 3 ? r.pick([1, 2]) : r.pick([2, 3]);
      const comb = (m: number, j: number): number => { let out = 1; for (let i = 0; i < j; i++) out = (out * (m - i)) / (i + 1); return Math.round(out); };
      const ways = comb(n, k);
      const denom = 2 ** n;
      return {
        prompt: `A fair coin is flipped ${n} times. What is P(exactly ${k} head${k === 1 ? "" : "s"})?`,
        correct: `${ways}/${denom}`,
        wrongs: pickDistinct(`${ways}/${denom}`, [
          `1/${denom} — one specific order of ${k} heads`,
          `${k}/${denom} — one branch per head`,
          `${k + 1}/${denom} — the count of heads off by one`,
        ]),
        tags: ["ind-dep"],
        explanation: `${ways}/${denom}. The ${n} flips are independent, so every one of the ${denom} orderings is equally likely — and ${ways} of them contain exactly ${k} heads (counted by choosing which ${k} flips land heads). Multiply ALONG branches, ADD across branches that share the outcome.`,
        difficulty: 0.6,
      };
    }
    if (variant < 0.67) {
      const [r_, b] = r.pick([[2, 1], [3, 1], [3, 2], [4, 2]]);
      const total = r_ + b;
      const withRep = deepFrac(r_ * r_, total * total);
      const withoutRep = deepFrac(r_ * (r_ - 1), (total) * (total - 1));
      return {
        prompt: `A bag holds ${r_} red and ${b} blue counters. One is drawn, REPLACED, and a second is drawn. What is P(both red)?`,
        correct: withRep,
        wrongs: pickDistinct(withRep, [
          withoutRep === withRep ? `${deepFrac(r_ - 1, total - 1)} — the second draw treated as conditional` : withoutRep,
          deepFrac(r_, total),
          deepFrac(r_ * b, total * total),
        ]),
        tags: ["ind-dep"],
        explanation: `${withRep}. Replacement makes the second draw independent of the first: (${deepFrac(r_, total)})² = ${withRep}. Without replacement the denominator shrinks and the events become dependent — the tree's second layer must be re-drawn with the new counts.`,
        difficulty: 0.62,
      };
    }
    const [r_, b] = r.pick([[1, 1], [2, 2], [2, 1], [3, 3]]);
    const total = r_ + b;
    const oneEach = deepFrac(2 * r_ * b, total * total);
    return {
      prompt: `A bag holds ${r_} red and ${b} blue counters. Two are drawn WITH replacement. What is P(one of each colour, in either order)?`,
      correct: oneEach,
      wrongs: pickDistinct(oneEach, [
        deepFrac(r_ * b, total * total) === oneEach ? deepFrac(r_, total) : deepFrac(r_ * b, total * total),
        deepFrac(r_ * r_ + b * b, total * total),
        deepFrac(2 * r_ * b, (total) * (total - 1)),
      ]),
      tags: ["ind-dep"],
      explanation: `${oneEach}. Two branches give one of each — red-then-blue and blue-then-red — so their probabilities ADD: 2 × (${deepFrac(r_, total)} × ${deepFrac(b, total)}) = ${oneEach}. Forgetting to double is the standard error; the 'either order' in the question is the cue.`,
      difficulty: 0.7,
    };
  },

  /** Trigonometry taken past rule-choice into computation, including the
   *  impossible-sine discriminator. */
  "trig-rule": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const scenes: Array<[string, string, string, string[], string]> = [
        ["a = 8, B = 30°, b = 4", "sin A = (8 × sin 30°) / 4 = 1, so A = 90°",
          "Sine rule gives A", ["A = 60° — the 30° was doubled instead of the ratio", "A = 45° — the ratio was halved twice", "No such triangle — sin A cannot exceed 1"], ""],
        ["a = 6, B = 45°, b = 3", "No such triangle — sin A = (6 × sin 45°) / 3 ≈ 1.41, which is impossible (sine never exceeds 1)",
          "The data is inconsistent", ["A = 90° — sin A caps at 1, so round down", "A = 45° — the angle transfers across", "The triangle exists but is obtuse, so use the cosine rule"], "cos-amb"],
        ["b = 8, c = 6, A = 50°", "a² = 8² + 6² − 2 × 8 × 6 × cos 50°, so a = √(64 + 36 − 96 cos 50°) ≈ 6.13",
          "Cosine rule gives a", ["a ≈ 10.0 — the cos term was added, not subtracted", "a ≈ 7.0 — Pythagoras on 8 and 6", "a ≈ 4.0 — the 2bc factor was dropped"], ""],
      ];
      const [given, answer, method, wrong, tag] = scenes[r.int(0, scenes.length - 1)];
      return {
        prompt: `In triangle ABC: ${given}. Compute the missing side or angle, stating the rule you used.`,
        correct: `${answer} — ${method}`,
        wrongs: pickDistinct(`${answer} — ${method}`, wrong),
        tags: tag ? [tag] : [],
        explanation: `${answer} — ${method}. Two working habits decide these: write the rule BEFORE substituting, and sanity-check the sine rule's output — sin A > 1 means the given triangle cannot exist, not that the calculator is broken.`,
        difficulty: 0.65,
      };
    }
    if (variant < 0.67) {
      const [a, b] = r.pick([[5, 7], [6, 8], [4, 9]]);
      const c2 = a * a + b * b - a * b; // included angle 60°: 2ab cos 60° = ab
      const c = deepNum(Math.sqrt(c2), 2);
      return {
        prompt: `In triangle ABC, sides b = ${b} and c-adjacent a = ${a} enclose an angle of 60°. Find the third side a-side (the side opposite the 60° angle) to 2 decimal places.`,
        correct: `√${c2} ≈ ${c} — cosine rule with cos 60° = 0.5: x² = ${a}² + ${b}² − ${a}×${b}`,
        wrongs: pickDistinct(`√${c2} ≈ ${c} — cosine rule with cos 60° = 0.5: x² = ${a}² + ${b}² − ${a}×${b}`, [
          `√${a * a + b * b} ≈ ${deepNum(Math.sqrt(a * a + b * b), 2)} — the cos 60° term was dropped (that is Pythagoras, valid only at 90°)`,
          `√${a * a + b * b + a * b} ≈ ${deepNum(Math.sqrt(a * a + b * b + a * b), 2)} — the cos term was added`,
          `${a + b} — the sides were added directly`,
        ]),
        tags: [],
        explanation: `√${c2} ≈ ${c}. With the angle BETWEEN the two known sides, the cosine rule is the only instrument: x² = a² + b² − 2ab·cos(60°), and 2·cos 60° = 1 makes the cross-term exactly ${a}×${b}. At 90° the term vanishes — that is Pythagoras as a special case, not a rival rule.`,
        difficulty: 0.68,
      };
    }
    const scenes: Array<[string, string, string[]]> = [
      ["Two sides and the angle BETWEEN them are known; the third side is wanted.",
        "Cosine rule — the included angle makes the sine rule inapplicable (no complete side–angle pair)",
        ["Sine rule — it handles any two sides and an angle",
          "Pythagoras — the formula squares both sides",
          "Area = ½ab sin C — it shares the same givens"]],
      ["Two angles and one side are known; the remaining side is wanted.",
        "Sine rule — the known angles complete two side–angle opposite pairs",
        ["Cosine rule — it is the general case, so it always works",
          "Pythagoras — two angles fix the right angle",
          "Tangent ratio — angles imply a right triangle"]],
      ["All three sides are known; an angle is wanted.",
        "Cosine rule rearranged — cos A = (b² + c² − a²)/(2bc); with three sides there is no angle to pair in a sine rule",
        ["Sine rule — any three facts determine a triangle",
          "Pythagoras — check it first, then fall back",
          "The angle cannot be found from sides alone"]],
    ];
    const [given, answer, wrong] = scenes[r.int(0, scenes.length - 1)];
    return {
      prompt: `${given} Which rule, and why?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: ["cos-amb"],
      explanation: `${answer}. The sine rule needs a COMPLETE opposite pair (a side and its angle); the cosine rule needs either two sides with the included angle, or three sides. Matching the givens to that requirement is the decision the whole topic hangs on.`,
      difficulty: 0.58,
    };
  },

  /** Circle theorems chained: same-segment equality, alternate segment with
   *  numbers, and a two-theorem chain to the centre angle. */
  "circle-geometry-adv": (r) => {
    const variant = r.next();
    if (variant < 0.34) {
      const scenes: Array<[string, string, string[], string]> = [
        ["Two angles stand on the same arc, drawn from opposite points on the circumference.", "They are equal — angles in the same segment",
          ["They sum to 180° — opposite angles of a cyclic quadrilateral", "One is double the other — the centre rule", "Their sum is 90° — they are complementary"], "same-seg"],
        ["One angle stands at the centre, another at the circumference, on the same arc.", "The centre angle is double the circumference angle",
          ["They are equal — same arc, same angle", "The circumference angle is double", "They sum to 180°"], "same-seg"],
        ["A quadrilateral has all four vertices on the circle.", "Its opposite angles sum to 180° — the cyclic-quadrilateral property",
          ["All four angles are equal", "Adjacent angles are equal", "Its diagonals bisect the angles"], ""],
      ];
      const [obs, answer, wrong, tag] = scenes[r.int(0, scenes.length - 1)];
      return {
        prompt: `${obs} What is the relationship between the angles?`,
        correct: answer,
        wrongs: pickDistinct(answer, wrong),
        tags: tag ? [tag] : [],
        explanation: `${answer}. Three theorems, three geometries: same arc at the circumference → equal; centre versus circumference → double; four points on the circle → opposite angles supplementary. Naming WHICH arc each angle stands on is the reading step every mark depends on.`,
        difficulty: 0.5,
      };
    }
    if (variant < 0.67) {
      const t = r.pick([32, 40, 48, 55]);
      return {
        prompt: `A tangent meets a chord at the point of contact; the angle between them is ${t}°. Find the angle the chord subtends in the alternate segment, and the angle at the centre standing on the same chord.`,
        correct: `Alternate segment: ${t}°. Centre angle: ${2 * t}° — the inscribed angle on the same chord is the tangent–chord angle, and the centre angle doubles any inscribed angle`,
        wrongs: pickDistinct(`Alternate segment: ${t}°. Centre angle: ${2 * t}° — the inscribed angle on the same chord is the tangent–chord angle, and the centre angle doubles any inscribed angle`, [
          `Alternate segment: ${90 - t}°. Centre angle: ${180 - 2 * t}° — the complementary angle was used`,
          `Alternate segment: ${t}°. Centre angle: ${t}° — the centre angle equals the inscribed angle`,
          `Alternate segment: ${180 - t}°. Centre angle: ${360 - 2 * t}° — the supplement was taken`,
        ]),
        tags: ["alt-seg"],
        explanation: `Alternate segment: ${t}°; centre: ${2 * t}°. The tangent–chord angle equals the inscribed angle in the opposite segment (that IS the alternate segment theorem), and the centre angle standing on the same chord is twice any inscribed angle. Chaining two theorems is standard — each step's arc must be named.`,
        difficulty: 0.62,
      };
    }
    const scenes: Array<[string, string, string[]]> = [
      ["An isosceles triangle is inscribed in a circle with the equal sides as two radii.",
        "The triangle formed by the centre and a chord is isosceles (two radii), so its base angles are equal — and the inscribed angle on the same arc is half the centre angle",
        ["The triangle is equilateral — all radii are equal, so all angles are",
          "The base angles are right angles — radii meet chords at 90°",
          "The inscribed angle equals the centre angle — same chord"]],
      ["A diameter is drawn, and a point on the circumference joined to BOTH ends of it.",
        "The angle at that point is exactly 90° — the angle in a semicircle — so the triangle is right-angled",
        ["The angle equals half the diameter's central angle of 360°, so 180°",
          "The angle varies with where the point sits on the semicircle",
          "The two angles at the diameter's ends are equal to 90° each"]],
      ["Two tangents are drawn from an external point; the angle BETWEEN them at that point is 70°.",
        "The radii meet the tangents at 90° each, so the angle at the centre between the radii is 180° − 70° = 110°",
        ["The centre angle is 70° — it equals the angle between the tangents",
          "The centre angle is 290° — the reflex angle is always the answer",
          "The tangents meet the radii at 70°, so the centre angle is 40°"]],
    ];
    const [obs, answer, wrong] = scenes[r.int(0, scenes.length - 1)];
    return {
      prompt: `${obs} Work out the stated angle, naming each theorem as you use it.`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer}. Multi-step circle problems are a chain: radii → isosceles, semicircle → right angle, tangents → 90° at the point of contact. Each link is small; the skill is never skipping the naming step, because the named theorem is what justifies the number.`,
      difficulty: 0.78,
    };
  },

  // ── THE SENIOR PROCEDURAL CONCEPTS ────────────────────────────────────────
  //
  // Measured on the bank before these existed: of the 67 maths concepts with a
  // generator, 35 could not produce an item harder than band 3 — and the cap
  // fell exactly on the concepts a Year 11 Higher student spends the year on.
  // Differentiation topped out at 0.45, integration 0.50, vectors 0.35, surds
  // 0.45, completing the square 0.50, logs 0.55. The difficulty engine could
  // aim at 0.87 for that learner (tier 0.65 plus a stretch uplift of 0.22); the
  // bank had nothing above 0.5 to aim AT, so the serve returned the nearest
  // shallow draw — and the stretch rung redrew the same one-step question. A
  // learner who was doing well met the same item twice and learned nothing from
  // either. That is a content gap, not a tuning problem, and the fix is
  // content.
  //
  // Every family below is a CHAIN: differentiate then evaluate, integrate then
  // evaluate at BOTH limits and subtract, simplify both surds then divide,
  // complete the square and then read off the turning point. The bands are
  // honest — 0.55+ means several pieces of working, and the draws at the top of
  // each family are the ones where the answer is not in the question (a scale
  // factor, a minimum, a definite integral) and has to be produced.

  /** A derivative is not the answer — it is the instrument. Differentiate, then
   *  use the derivative: read the gradient at a point, or build the tangent's
   *  own equation from the point and the gradient. */
  "calculus-diff": (r) => {
    const a = r.int(1, 4), b = r.int(1, 5), c = r.int(1, 9), d = r.nz(-9, 9), k = r.nz(-3, 4);
    const t = (coef: number, sym: string) => (coef >= 0 ? `+ ${coef === 1 ? "" : coef}${sym}` : `− ${-coef === 1 ? "" : -coef}${sym}`);
    // A leading coefficient of 1 is not written: "1x³" is not a coefficient a
    // student would ever see in a question, and it wastes the first thing they
    // read. The other terms already go through `t`, which drops it there.
    const poly = `${a === 1 ? "" : a}x³ ${t(b, "x²")} ${t(-c, "x")} ${d >= 0 ? `+ ${d}` : `− ${-d}`}`;
    const grad = 3 * a * k * k + 2 * b * k - c;
    const value = a * k * k * k + b * k * k - c * k + d;
    const dy = `${3 * a === 1 ? "" : 3 * a}x² ${t(2 * b, "x")} ${t(-c, "")}`;
    if (r.next() < 0.5) {
      const correct = String(grad);
      return {
        prompt: `y = ${poly}.\nWork out the gradient of the curve at x = ${k}.`,
        correct,
        wrongs: pickDistinct(correct, [
          // Substituted into y instead of into dy/dx: the height, not the slope.
          String(value),
          // Dropped the −x term while differentiating, so its derivative is gone.
          String(3 * a * k * k + 2 * b * k),
          // Divided by the power instead of multiplying by it.
          String(a * k * k + b * k - c),
          String(grad + 2 * b),
        ]),
        tags: [],
        explanation: `Differentiate first: dy/dx = ${dy}. The gradient at a point is the VALUE of the derivative there, so put x = ${k} in: ${3 * a}×(${k})² + ${2 * b}×(${k}) − ${c} = ${grad}. Putting x = ${k} into the original equation instead gives ${value} — that is where the curve is, not how steep it is, and the two questions look almost identical on paper.`,
        difficulty: 0.62 + r.next() * 0.08,
      };
    }
    const intercept = value - grad * k;
    // A gradient of 1 is written as x, not 1x — including inside the option
    // list, where the correct answer and its two siblings all go through here.
    const line = (m: number, cc: number) => `y = ${m === 1 ? "" : m === -1 ? "−" : m}x ${cc >= 0 ? `+ ${cc}` : `− ${-cc}`}`;
    const correct = line(grad, intercept);
    return {
      prompt: `y = ${poly}.\nWork out the equation of the tangent to the curve at x = ${k}, in the form y = mx + c.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Used the height as the gradient, then drew the line through the point.
        line(value, value - value * k),
        // Correct gradient, but the constant term of the CURVE as the intercept.
        line(grad, d),
        // Correct gradient, point never used: a parallel line through the origin.
        `y = ${grad === 1 ? "" : grad === -1 ? "−" : grad}x`,
      ]),
      tags: [],
      explanation: `A tangent needs two things you are not given: the gradient there and a point it passes through. The gradient is dy/dx at x = ${k}: dy/dx = ${dy}, so m = ${grad}. The point is on the curve: at x = ${k}, y = ${value}, so (${k}, ${value}). Substitute through y = mx + c: ${value} = ${grad}×(${k}) + c, so c = ${intercept}, giving ${correct}. Reusing the curve's own constant ${d} as c is the standard slip — it is only the intercept for the ORIGINAL curve.`,
      difficulty: 0.75 + r.next() * 0.08,
    };
  },

  /** Definite integration is two evaluations and a subtraction, and finding the
   *  constant of integration needs the given point solved through. */
  "calculus-int": (r) => {
    if (r.next() < 0.55) {
      const k = r.int(2, 3);
      const p = (k + 1) * r.int(1, 4);
      const q = 2 * r.int(1, 4);
      const lo = r.int(0, 2), hi = lo + r.int(1, 3);
      const F = (x: number) => (p * Math.pow(x, k + 1)) / (k + 1) - (q * x * x) / 2;
      const correct = String(F(hi) - F(lo));
      return {
        prompt: `Work out ∫ (${p}x${sup(k)} − ${q}x) dx between x = ${lo} and x = ${hi}.`,
        correct,
        wrongs: pickDistinct(correct, [
          // Integrated and evaluated at the upper limit only — the blindingly
          // common slip, and the reason a definite integral is not one step.
          String(F(hi)),
          // Subtracted the wrong way round.
          String(F(lo) - F(hi)),
          // Differentiated instead of integrated, then evaluated.
          String(p * Math.pow(hi, k) - q * hi),
        ]),
        tags: [],
        explanation: `Integrate first: ∫(${p}x${sup(k)} − ${q}x) dx = ${p / (k + 1)}x${sup(k + 1)} − ${q / 2}x² (no + c is needed for a definite integral). Then evaluate at BOTH limits and subtract: at x = ${hi} it is ${F(hi)}, at x = ${lo} it is ${F(lo)}, so the integral is ${F(hi)} − ${F(lo)} = ${F(hi) - F(lo)}. Stopping at ${F(hi)} is the sign you have integrated by habit rather than by definition — the lower limit exists precisely to be subtracted.`,
        difficulty: 0.68 + r.next() * 0.08,
      };
    }
    const k = r.int(2, 3);
    // A power of 1 would print as "x¹", which no mathematician writes: the
    // derivative is only ever shown as a power when there IS one.
    // p is a multiple of k + 1, so every coefficient of the antiderivative is a
    // whole number — including the value at the given point. A float tail in a
    // prompt (23.333333333333332) is not a hard question, it is a broken one,
    // and the options built from it would be broken in the same way.
    const p = (k + 1) * r.int(1, 4);
    const q = r.int(1, 6);
    const c = r.int(1, 7);
    const x0 = r.int(1, 3);
    const F = (x: number) => (p * Math.pow(x, k + 1)) / (k + 1) - q * x;
    const y0 = F(x0) + c;
    const correct = String(c);
    return {
      prompt: `A curve has dy/dx = ${p}x${sup(k)} − ${q} and passes through the point (${x0}, ${y0}).\nWork out the constant of integration.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Used the point's y-value as the constant.
        String(y0),
        // Found the antiderivative at x0 and stopped.
        String(F(x0)),
        // Signed the subtraction the wrong way.
        String(F(x0) - y0),
      ]),
      tags: [],
      explanation: `Integrate with the constant still in place: y = ${p / (k + 1)}x${sup(k + 1)} − ${q}x + c. The point is the extra fact that fixes c: at x = ${x0} the curve is at y = ${y0}, so ${p / (k + 1)}×(${x0})${sup(k + 1)} − ${q}×(${x0}) + c = ${y0}, and ${F(x0)} + c = ${y0}, so c = ${y0} − ${F(x0)} = ${c}. Skipping the constant is right for a definite integral and wrong here — here the constant IS the question.`,
      difficulty: 0.66 + r.next() * 0.08,
    };
  },

  /** Logs as a calculator-free instrument: both numbers as powers, then the
   *  index law; and the base change that turns an exponential into arithmetic. */
  logs: (r) => {
    if (r.next() < 0.55) {
      // The (base, index) pairs whose power stays under 100, chosen as a pair:
      // filtering a fixed list against a draw already made emptied it for
      // (5, 3) and (5, 4), and an empty draw is not a smaller question — it is
      // an undefined one, which reached deepFrac as NaN.
      const [a, n] = r.pick([[2, 2], [2, 3], [2, 4], [3, 2], [3, 3], [3, 4], [5, 2]]);
      // k/n must be a genuine fraction in lowest terms: an integer index is a
      // different, easier question (log₂ 8 rather than log₂₇ 9).
      const k = r.pick([3, 5, 7].filter((k2) => k2 % n !== 0));
      const b = Math.pow(a, n), target = Math.pow(a, k);
      const correct = deepFrac(k, n);
      return {
        prompt: `Without a calculator, work out log${b}(${target}).`,
        correct,
        wrongs: pickDistinct(correct, [
          deepFrac(n, k),          // the ratio upside down
          String(Math.abs(k - n)), // subtracted the indices
          String(k * n),           // multiplied them
          deepFrac(b, target),     // divided the numbers themselves
        ]),
        tags: [],
        explanation: `Both numbers are powers of the same base: ${b} = ${a}${sup(n)} and ${target} = ${a}${sup(k)}. So log${b}(${target}) is the index x in (${a}${sup(n)})ˣ = ${a}${sup(k)}, and the index law makes that ${a}${sup(n)}ˣ = ${a}${sup(k)} — equal bases, so the indices are equal: n·x = k and x = ${deepFrac(k, n)}. Rewriting both sides in the same base is the whole method; reaching for a calculator hides the step being tested.`,
        difficulty: 0.68 + r.next() * 0.08,
      };
    }
    const b = r.pick([2, 3, 5]);
    const target = b === 2 ? r.pick([40, 50, 90, 120]) : b === 3 ? r.pick([40, 80, 200]) : r.pick([40, 90, 250]);
    const x = Math.log(target) / Math.log(b);
    const correct = deepNum(x, 2);
    return {
      prompt: `Solve ${b}ˣ = ${target}. Give your answer to 3 significant figures.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Divided by the base instead of taking logs.
        deepNum(target / b, 2),
        // Subtracted the logs — the same slip log laws invite.
        deepNum(Math.log(target / b), 2),
        // Inverted the answer.
        deepNum(1 / x, 2),
      ]),
      tags: [],
      explanation: `The unknown is in the INDEX, so take logs of both sides first: log(${b}ˣ) = log(${target}), and the power law brings the index down: x·log(${b}) = log(${target}). Divide: x = log(${target}) ÷ log(${b}) = ${deepNum(x, 4)}… = ${correct} to 3 significant figures. Dividing ${target} by ${b} (${deepNum(target / b, 2)}) is the answer to a different question — it is what you would do if x multiplied the base instead of sitting above it.`,
      difficulty: 0.66 + r.next() * 0.08,
    };
  },

  /** Two surds, simplified and then combined — never one surd on its own. */
  surds: (r) => {
    const s = r.pick([2, 3, 5, 6]);
    if (r.next() < 0.6) {
      const a = r.int(2, 5), b = r.int(2, 5);
      const A = a * a * s, B = b * b * s, C = s;
      // The answer is kept whole: (a + b) over 1. A denominator other than 1
      // would print as √13/2, which reads as either √(13/2) or √13 ÷ 2 — an
      // ambiguity in the OPTION LIST is a broken question, not a hard one.
      const correct = String(a + b);
      return {
        prompt: `Simplify fully: (√${A} + √${B}) ÷ √${C}.`,
        correct,
        wrongs: pickDistinct(correct, [
          // Added under the roots and never simplified: the classic.
          `√${a * a + b * b}`,
          // Simplified each surd but never divided by the denominator.
          `(${a} + ${b})√${s}`,
          // Multiplied the coefficients rather than adding them.
          String(a * b),
        ]),
        tags: ["sqrt-prod"],
        explanation: `No surd here is in its simplest form, and none can be combined until it is: √${A} = √(${a}²×${s}) = ${a}√${s} and √${B} = √(${b}²×${s}) = ${b}√${s}. Now they are like surds: (${a}√${s} + ${b}√${s}) ÷ √${s} = ${a + b}√${s} ÷ √${s}, and the √${s} cancels, leaving ${correct}. Adding ${A} + ${B} under one root is the slip this question is built to catch — √a + √b is not √(a + b).`,
        difficulty: 0.68 + r.next() * 0.08,
      };
    }
    const p = r.int(2, 5), q = r.int(1, 6);
    const correct = String(p * p * s - q * q);
    return {
      prompt: `Expand and simplify: (${p}√${s} + ${q})(${p}√${s} − ${q}).`,
      correct,
      wrongs: pickDistinct(correct, [
        // Signed the squares the wrong way, i.e. added them.
        String(p * p * s + q * q),
        // Squared the surd coefficient but not the number.
        String(p * p * s - q),
        // Squared the number but not the coefficient.
        String(p * s - q * q),
      ]),
      tags: ["sqrt-prod"],
      explanation: `This is the difference of two squares: (A + B)(A − B) = A² − B². Here A = ${p}√${s} and B = ${q}, so A² = ${p * p}×${s} = ${p * p * s} and B² = ${q * q}, giving ${p * p * s} − ${q * q} = ${correct}. Note the √${s} does NOT survive: squaring the surd term is what removes it, and that is why this expansion is the standard way to rationalise a surd denominator.`,
      difficulty: 0.62 + r.next() * 0.08,
    };
  },

  /** Vectors as relations between points, not arrows to add: a distance that
   *  needs Pythagoras, and a parallel test that needs the scale factor. */
  vectors: (r) => {
    if (r.next() < 0.5) {
      const [dx, dy] = r.pick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [8, 15], [9, 12]]);
      const sx = r.nz(-9, 9), sy = r.nz(-9, 9);
      const ex = sx + dx * r.pick([1, -1]), ey = sy + dy * r.pick([1, -1]);
      const len = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
      const correct = String(deepNum(len, 2));
      return {
        prompt: `A is (${sx}, ${sy}) and B is (${ex}, ${ey}).\nWork out the length of AB.`,
        correct,
        wrongs: pickDistinct(correct, [
          // Added the components instead of using Pythagoras.
          String(Math.abs(ex - sx) + Math.abs(ey - sy)),
          // Stopped before the square root.
          String((ex - sx) ** 2 + (ey - sy) ** 2),
          // Added the squares, then took the wrong root: |dx| + |dy| rounded.
          String(deepNum(Math.abs(ex - sx) - Math.abs(ey - sy), 2)),
        ]),
        tags: [],
        explanation: `AB is a displacement, so find its components first: (${ex} − ${sx}, ${ey} − ${sy}) = (${ex - sx}, ${ey - sy}). Its length is Pythagoras on those components: √((${ex - sx})² + (${ey - sy})²) = √${(ex - sx) ** 2 + (ey - sy) ** 2} = ${correct}. Adding the components gives a longer path along the edges, not the straight distance — which is why the answer is never the sum.`,
        difficulty: 0.6 + r.next() * 0.08,
      };
    }
    const p = r.int(1, 5), q = r.int(1, 5), k = r.int(2, 4);
    const correct = `Parallel — BC is ${k} times AB, so the vectors have the same direction`;
    return {
      prompt: `A, B and C are points. AB = ${p}a + ${q}b and BC = ${k * p}a + ${k * q}b, where a and b are not parallel.\nWhat does this tell you about the points?`,
      correct,
      wrongs: pickDistinct(correct, [
        `Not parallel — the coefficients in BC are different from those in AB`,
        `Parallel but in opposite directions — the coefficients got larger`,
        `Nothing — a and b are different vectors, so the two cannot be compared`,
      ]),
      tags: ["vec-dir"],
      explanation: `Compare the two vectors as VECTORS, not coefficient by coefficient: BC = ${k * p}a + ${k * q}b = ${k}(${p}a + ${q}b) = ${k}·AB. A scalar multiple means the same direction (positive scalar) and ${k} times the length, so AB and BC are parallel — and because they share the point B, A, B and C are collinear. The coefficients looking different is exactly what a scalar multiple produces; the test is whether ONE number reproduces both, and here ${k} does.`,
      difficulty: 0.66 + r.next() * 0.08,
    };
  },

  /** Completing the square with a purpose: the turning point of a curve, and
   *  exact roots. The base family stops at the number in the bracket. */
  "completing-square": (r) => {
    const h = r.int(1, 8);
    const b = 2 * h;
    const q = r.nz(-9, 9);
    const c = h * h + q;
    const bt = `${b}x`, ct = `${c >= 0 ? "+" : "−"} ${Math.abs(c)}`;
    if (r.next() < 0.5) {
      const correct = `Minimum ${q} when x = ${-h}`;
      return {
        prompt: `Express x² + ${bt} ${ct} in the form (x + p)² + q, and hence state the minimum value of the expression and the value of x at which it occurs.`,
        correct,
        wrongs: pickDistinct(correct, [
          `Minimum ${c} when x = ${-h}`,
          `Minimum ${q} when x = ${h}`,
          `Minimum ${-q} when x = ${-h}`,
          `Maximum ${q} when x = ${-h}`,
        ]),
        tags: ["b-half"],
        explanation: `Half the coefficient of x is ${h}, so the square is (x + ${h})² = x² + ${bt} + ${h * h}; the expression has ${c} there instead, so it is (x + ${h})² ${c - h * h >= 0 ? "+" : "−"} ${Math.abs(c - h * h)} = (x + ${h})² ${q >= 0 ? "+" : "−"} ${Math.abs(q)}. A square is never negative, so the SMALLEST the expression gets is when (x + ${h})² = 0 — that is x = ${-h}, and the minimum value is ${q}. The sign of p is the slip: it is −h in the bracket, so the minimum sits at the opposite sign, ${-h}.`,
        difficulty: 0.64 + r.next() * 0.08,
      };
    }
    // A GENUINE SURD, chosen before the constant: the number under the radical
    // is squarefree and never a perfect square. Deriving it from h and c the
    // other way round produced "x = −4 ± √1" — a surd-form question whose
    // answer is two integers, which teaches nothing about surds and reads as a
    // mistake to anyone marking it.
    const root = r.pick([2, 3, 5, 6, 7, 10, 11, 13, 14, 15]);
    const cs = h * h - root;
    const ct2 = `${cs >= 0 ? "+" : "−"} ${Math.abs(cs)}`;
    const correct = `x = ${-h} ± √${root}`;
    return {
      prompt: `Solve x² + ${bt} ${ct2} = 0 by completing the square. Give your answers in surd form.`,
      correct,
      wrongs: pickDistinct(correct, [
        `x = ${h} ± √${root}`,
        `x = ${-h} ± √${h * h}`,
        `x = ${-h} ± ${root}`,
      ]),
      tags: ["b-half"],
      explanation: `Complete the square: x² + ${bt} ${ct2} = (x + ${h})² − ${h * h} ${ct2} = (x + ${h})² ${cs - h * h >= 0 ? "+" : "−"} ${Math.abs(cs - h * h)}. Setting it to zero gives (x + ${h})² = ${root} — the constant part moves across with its sign flipped — so x + ${h} = ±√${root} and x = ${-h} ± √${root}. Two things are easy to lose: the bracket moves across with the OPPOSITE sign (${-h}, not ${h}), and the right-hand side keeps its square root — ${root} is the number UNDER the radical, not the answer.`,
      difficulty: 0.7 + r.next() * 0.08,
    };
  },
};