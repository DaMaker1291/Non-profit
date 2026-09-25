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
      prompt: `Solve ${a}(x − ${b}) = ${c}x ${rhs}.`,
      correct: `x = ${x}`,
      wrongs: [`x = ${x + 1}`, `x = ${x - 1}`, `x = ${2 * x}`],
      tags: ["bal-slip"],
      explanation: `Expand the bracket first: ${a}x − ${a * b} = ${c}x ${rhs}. Collect the x-terms on both sides — subtracting ${c}x and adding ${a * b} to BOTH sides — gives ${a - c}x = ${d + a * b}, so x = ${d + a * b} ÷ ${a - c} = ${x}. Doing any of that to one side only is the balance error: an equation is a scale, so every move happens twice.`,
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
    return {
      prompt: `Solve the simultaneous equations:\n${a1}x + ${b1}y = ${r1}\n${a2}x − ${b2}y = ${r2}\nWhat is the value of x?`,
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
      prompt: `The graph of y = x² ${b < 0 ? "−" : "+"} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} crosses the x-axis at two points. What are the x-coordinates of those points?`,
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
};
