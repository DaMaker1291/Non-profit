import type { BoardId, Question, SubjectId } from "./types";
import { localizeStem } from "./qterms";
// The demand ladder lives on its own (lib/skills.ts) because the SERVE aims an
// item at a demand level and the DIAGNOSTIC REPORT buckets it back into one.
// The bank re-exports it for other consumers; this module imports it directly,
// since the bank already imports this one and a re-export cannot be a
// back-import.
import { skillForDifficulty } from "./skills";
import { applyTerminology } from "./specifications";
import { DEEP_GENS, fourDistinct, type DeepGen } from "./questions-deep";

/** The demand band a difficulty falls in (1–5).
 *
 *  One definition, in the difficulty engine: a tier, a served item and a
 *  surface's label must all read the band from the same boundaries, or the
 *  same question is "band 3" on one screen and "band 4" in the payload.
 *  lib/question-bank.ts re-exports it so existing imports keep working. */
export function difficultyBandFor(d: number): 1 | 2 | 3 | 4 | 5 {
  if (d < 0.3) return 1;
  if (d < 0.45) return 2;
  if (d < 0.6) return 3;
  if (d < 0.8) return 4;
  return 5;
}

// ── Deterministic seeded RNG ────────────────────────────────────────────────
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class Rng {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0 || 1; }
  next(): number {
    let x = this.s;
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    this.s = x;
    return x / 4294967296;
  }
  int(min: number, max: number): number { return min + Math.floor(this.next() * (max - min + 1)); }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  nz(min: number, max: number): number { // non-zero int in range
    let v = 0;
    do { v = this.int(min, max); } while (v === 0);
    return v;
  }
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// ── Student-facing number formatting ────────────────────────────────────────
// Computed values must never reach a student as floating-point noise. The audit
// (scripts/verify-questions.mjs) caught 629.9999999999999, 3.4641016151377544
// and 16.333333333333332 being printed as answers and in explanations.

/** Smallest denominator 2…12 that makes `x` (near enough to) an integer. */
function smallDenom(x: number): number | null {
  for (let d = 2; d <= 12; d++) {
    const v = x * d;
    if (Math.abs(v - Math.round(v)) < 1e-6) return d;
  }
  return null;
}

function gcdInt(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcdInt(b, a % b);
}

/** Format a computed number for display. Exact at `dp` places when it is, then
 *  a genuine small fraction (1/3, 49/3) when the decimal would be a lie, and
 *  never a long floating-point tail. `6.000000000000001 → "6"`,
 *  `-0.3333333333333333 → "-1/3"`, `0.5 → "0.5"`. */
export function fmtNum(x: number, dp = 2): string {
  if (!Number.isFinite(x)) return "—";
  const rounded = Number(x.toFixed(dp));
  if (Math.abs(x - rounded) < 1e-9) return String(rounded);
  const d = smallDenom(x);
  if (d) {
    const num = Math.round(x * d);
    const g = gcdInt(num, d);
    const den = d / g;
    if (den <= 12) return den === 1 ? String(num / g) : `${num / g}/${den}`;
  }
  return String(rounded);
}

/** Largest perfect-square divisor of n: √72 → 36, √50 → 25, √12 → 4. */
export function largestSquareDivisor(n: number): number {
  let best = 1;
  for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) best = k * k;
  return best;
}

type Gen = (r: Rng) => Omit<Question, "id" | "conceptId">;

/**
 * The depth composition: a concept's base family, plus the deeper family from
 * lib/questions-deep.ts, chosen per draw.
 *
 * The share is deliberate. A generator is the concept's WHOLE range, so the
 * composition has to keep both ends reachable: too small a share and the deep
 * items are unreachable through the seed search that difficulty targeting uses
 * (`generateQuestionAt` looks at up to 12 draws, so 50% puts a deep draw out of
 * reach about once in four thousand calls); too large and the base items
 * disappear, which would quietly change what practice serves at the EASY end.
 *
 * Deterministic like everything else here: the share is consumed from the same
 * seeded stream, so the same seed rebuilds the same item with the same text.
 */
export function withDepth(base: RawGen, deep: DeepGen, share = 0.5): RawGen {
  return (r) => {
    if (r.next() >= share) return base(r);
    const item = deep(r);
    // Four guaranteed-distinct options, produced HERE rather than left to the
    // assembler's last-resort "None of these" padding: a deep item that ends up
    // needing filler reads as a broken question to the student and to the
    // question audit, which both rightly call it a defect.
    return { ...item, wrongs: fourDistinct(item.correct, item.wrongs).slice(1) };
  };
}

// Every generator returns { prompt, correct, wrongs, tags, explanation, difficulty }.
// `wrongs` are distractors designed to expose specific misconceptions.
// `wrongs` is string[] rather than a fixed triple: a generator whose three
// distractors can collide for some draws supplies a spare, and generateQuestion
// keeps the first three distinct ones.
type RawGen = (r: Rng) => { prompt: string; correct: string; wrongs: string[]; tags: string[]; explanation: string; difficulty: number };

// ── MATHS generators ────────────────────────────────────────────────────────
const MATHS_GENS: Record<string, RawGen> = {
  // WHAT THIS ITEM ASKS, AND WHAT IT USED TO GRADE. Three real defects lived in
  // these eight lines, all found by answering the question rather than reading
  // it:
  //
  //   · the prompt asks for the VALUE of a digit — in 295 the tens digit is 9
  //     and its value is 90 — while the answer was the DIGIT itself, so the
  //     question and its marking disagreed and the explanation printed the digit
  //     as the contribution;
  //   · the tens digit could be 0, so "the value of the tens digit in 607" had
  //     0 as its answer — a trick whose other options were the remaining two
  //     digits, measuring nothing about place value;
  //   · the distractor list could thin to fewer than three distinct values, and
  //     `+ 1` on a correct answer of 0 produced the correct answer again.
  //
  // Now every digit is non-zero (the zero case is a real teaching point, but it
  // belongs in a question written for it, not as a degenerate draw here), the
  // answer is what the prompt asks for, and the distractors are the mistakes
  // this question actually produces: the digit read literally, and a slide of
  // one place either way.
  "place-value": (r) => {
    const h = r.int(1, 9), t = r.int(1, 9), o = r.int(1, 9);
    const n = h * 100 + t * 10 + o;
    const pos = r.pick(["hundreds", "tens", "ones"] as const);
    const digit = pos === "hundreds" ? h : pos === "tens" ? t : o;
    const value = pos === "hundreds" ? h * 100 : pos === "tens" ? t * 10 : o;
    const correct = String(value);
    return {
      prompt: `What is the value of the ${pos} digit in ${n}?`,
      correct,
      wrongs: [
        String(digit),            // 9 read as 9, not as 90
        String(value * 10),       // one place too far
        String(value + 1),        // arithmetic slip
        String(value > 10 ? value / 10 : value * 10 + 1), // one place short
      ],
      tags: [], explanation: `${n} = ${h * 100} + ${t * 10} + ${o}, so the ${pos} digit contributes ${value}.`,
      difficulty: 0.1,
    };
  },
  "addition": (r) => {
    const a = r.int(24, 98), b = r.int(17, 89);
    const s = a + b;
    return {
      prompt: `Work out ${a} + ${b}.`,
      correct: String(s),
      wrongs: [String(s - 10), String(s + 1), String(a + b - (a % 10) + (b % 10))] as [string, string, string],
      tags: [], explanation: `Line up place value and add the columns: ${a} + ${b} = ${s}. Check: ${s} − ${a} = ${b} ✓.`,
      difficulty: 0.08,
    };
  },
  "subtraction": (r) => {
    const a = r.int(50, 99), b = r.int(12, 49);
    const d = a - b;
    return {
      prompt: `Work out ${a} − ${b}.`,
      correct: String(d),
      wrongs: [String(d + 10), String(d - 1), String(b - a + a)] as [string, string, string],
      tags: [], explanation: `${a} − ${b} = ${d}. Check by adding back: ${d} + ${b} = ${a} ✓.`,
      difficulty: 0.1,
    };
  },
  "multiplication": (r) => {
    const a = r.int(6, 12), b = r.int(6, 12);
    const p = a * b;
    return {
      prompt: `Work out ${a} × ${b}.`,
      correct: String(p),
      wrongs: [String(p + a), String(p - b), String(a * b + a + b)] as [string, string, string],
      tags: [], explanation: `${a} × ${b} = ${a} lots of ${b} = ${p}. (Split it: (${a - 1 > 0 ? a - 1 : a}) × ${b} + 1 × ${b}.)`,
      difficulty: 0.12,
    };
  },
  "division": (r) => {
    const b = r.int(3, 9), q = r.int(4, 12);
    const a = b * q;
    return {
      prompt: `Work out ${a} ÷ ${b}.`,
      correct: String(q),
      wrongs: [String(q + 1), String(q - 1), String(a - b)] as [string, string, string],
      tags: [], explanation: `${b} × ${q} = ${a}, so ${a} ÷ ${b} = ${q}. Division undoes multiplication.`,
      difficulty: 0.12,
    };
  },
  "negatives": (r) => {
    const kind = r.int(1, 3);
    if (kind === 1) {
      const a = r.int(1, 9), b = r.int(1, 9);
      const ans = a + b;
      return {
        prompt: `Work out ${a} − (−${b}).`,
        correct: String(ans),
        wrongs: [String(a - b), String(-(a + b)), String(b - a)] as [string, string, string],
        tags: ["neg-slip"], explanation: `Subtracting a negative ADDS: ${a} − (−${b}) = ${a} + ${b} = ${ans}. Taking away a debt makes you richer.`,
        difficulty: 0.25,
      };
    }
    if (kind === 2) {
      const a = r.nz(-6, 6), b = r.nz(-6, 6);
      const ans = a * b;
      return {
        prompt: `Work out (${a}) × (${b}).`,
        correct: String(ans),
        wrongs: [String(-ans), String(a + b), String(a - b)] as [string, string, string],
        tags: ["neg-slip"], explanation: `(${a}) × (${b}) = ${ans} because ${a < 0 && b < 0 ? "two negatives multiply to a positive" : a < 0 || b < 0 ? "one negative makes the product negative" : "both are positive"}.`,
        difficulty: 0.3,
      };
    }
    const a = r.int(5, 15), b = r.int(10, 25);
    return {
      prompt: `Work out ${a} − ${b}.`,
      correct: String(a - b),
      wrongs: [String(b - a), String(a + b), String(-(a + b))] as [string, string, string],
      tags: ["neg-slip"], explanation: `${a} − ${b} = ${a - b} (negative — ${b} is larger). On the number line you move ${b} left from ${a}.`,
      difficulty: 0.2,
    };
  },
  // One concept, the WHOLE demand ladder: reading a fraction (recall), scaling
  // an equivalent one (recall), applying a fraction to a quantity
  // (application), and chaining two applications where the second acts on what
  // the first left (multi-step). The vertical slice is only complete if a
  // concept can be probed at every band the bank can measure, so the bands a
  // concept can express are decided by its DRAWS (measured by `conceptDepth`) —
  // never by a declaration. Distractor values below are chosen so no two
  // options can collapse into the same string: an option set that silently
  // thins to three is a broken question, not a hard one.
  "fractions": (r) => {
    const which = r.int(1, 4);
    if (which === 1) {
      const [small, big] = r.pick([[2, 8], [3, 6], [4, 12]] as const);
      return {
        prompt: `Which fraction is larger: 1/${small} or 1/${big}?`,
        correct: `1/${small}`,
        wrongs: [`1/${big}`, "They are equal", "Cannot tell"] as [string, string, string],
        tags: ["frac-slice"], explanation: `Cut the whole into ${small} parts vs ${big} parts — fewer parts means BIGGER slices, so 1/${small} > 1/${big}.`,
        difficulty: 0.15,
      };
    }
    if (which === 2) {
      const n = r.int(2, 4), d = r.int(5, 9);
      const k = r.int(2, 3);
      return {
        prompt: `Write an equivalent fraction: ${n}/${d} = ?/${d * k}`,
        correct: String(n * k),
        wrongs: [String(n + k), String(d * k - d), String(n * k + 1)] as [string, string, string],
        tags: [], explanation: `Multiply top and bottom by ${k}: ${n}×${k} = ${n * k}. Scaling both equally keeps the value.`,
        difficulty: 0.2,
      };
    }
    if (which === 3) {
      // Application: a fraction OF a quantity. The three distractors are the
      // slips this actually produces — reading n/d as 1/d, answering the group
      // the question did not ask about, and counting one part too many.
      //
      // The (d, n) pairs are chosen so the four option strings stay DISTINCT
      // for every k in range: n = d/2 would put the complement on the answer,
      // and d − 2n = 1 with k = n would put "one part too many" on it. A
      // colliding pair does not become a duplicate option — the shared numeric
      // padder drops the authored distractor and offers "the answer ± 1"
      // instead, which teaches nothing (found by audit on the previous pairs,
      // two of which were 1/2).
      const [d, n] = r.pick([[5, 3], [6, 2], [8, 3], [8, 5], [10, 3], [10, 7]] as const);
      const k = r.int(2, 6);
      const amount = d * k;
      const ans = n * k;
      return {
        prompt: `A year group has ${amount} students. ${n}/${d} of them walk to school. How many walk?`,
        correct: String(ans),
        wrongs: [String(k), String(amount - ans), String(ans + n)] as [string, string, string],
        tags: [], explanation: `Divide by the denominator, multiply by the numerator: ${amount} ÷ ${d} = ${k} per part, then ${k} × ${n} = ${ans}. Check it is sensible — ${n}/${d} is ${n * 2 > d ? "more" : "less"} than half, so the answer must be ${n * 2 > d ? "more" : "less"} than ${amount / 2}.`,
        difficulty: 0.4,
      };
    }
    // Multi-step: two fractions in sequence, where the second acts on what the
    // FIRST left behind rather than on the original total. That distinction is
    // the whole demand of the question, and the distractors encode each way of
    // missing it: stopping after the first step (the online count), applying
    // the refund fraction to the WHOLE hall (total ÷ d2), and dividing by the
    // first denominator instead of the second (total ÷ d1).
    //
    // The third distractor used to be the "un-refunded online tickets",
    // (d1 − 1)(d2 − 1)k, which COLLAPSES onto the correct answer whenever
    // d2 = 2 — three of the four pairs — so the padder replaced it with
    // "answer ± 1" on 72% of multi-step draws (found by audit). total ÷ d2 is
    // a genuine two-step error, and it is distinct from the answer, the online
    // count and total ÷ d1 for every pair and every k by construction.
    const [d1, d2] = r.pick([[4, 2], [5, 2], [6, 2], [6, 3]] as const);
    const k = r.int(3, 12);
    const total = d1 * d2 * k;
    const online = (d1 - 1) * d2 * k;
    const ans = (d1 - 1) * k;
    return {
      prompt: `A hall has ${total} tickets. ${d1 - 1}/${d1} of them were sold online. Of the online tickets, 1/${d2} were later refunded. How many were refunded?`,
      correct: String(ans),
      wrongs: [String(online), String(total / d2), String(d2 * k)] as [string, string, string],
      tags: [], explanation: `First step: ${d1 - 1}/${d1} of ${total} = ${online} tickets online. Second step: 1/${d2} OF THOSE is ${online} ÷ ${d2} = ${ans}. The second fraction acts on what the first left, not on the original ${total}.`,
      difficulty: 0.6,
    };
  },
  "fraction-ops": (r) => {
    const kind = r.int(1, 3);
    if (kind === 1) {
      const d1 = r.pick([3, 4, 6]), d2 = r.pick([4, 6, 8]);
      const n1 = r.int(1, d1 - 1), n2 = r.int(1, d2 - 1);
      const lcm = (x: number, y: number): number => { const gg = (a: number, b: number): number => (b ? gg(b, a % b) : a); return (x * y) / gg(x, y); };
      const L = lcm(d1, d2);
      const sum = (n1 * L) / d1 + (n2 * L) / d2;
      return {
        prompt: `Work out ${n1}/${d1} + ${n2}/${d2}. Give your answer as a fraction.`,
        correct: `${sum}/${L}`,
        wrongs: [`${n1 + n2}/${d1 + d2}`, `${n1 + n2}/${L}`, `${sum}/${L + 1}`, `${sum + 1}/${L}`],
        tags: ["denom-add"], explanation: `Common denominator ${L}: ${(n1 * L) / d1}/${L} + ${(n2 * L) / d2}/${L} = ${sum}/${L}. You can only add same-size slices — never add the denominators.`,
        difficulty: 0.4,
      };
    }
    if (kind === 2) {
      const n1 = r.int(1, 5), d1 = r.int(2, 6), n2 = r.int(1, 5), d2 = r.int(2, 6);
      const num = n1 * n2, den = d1 * d2;
      const gg = (a: number, b: number): number => (b ? gg(b, a % b) : a);
      const G = gg(num, den);
      return {
        prompt: `Work out ${n1}/${d1} × ${n2}/${d2}. Give your answer in simplest form.`,
        correct: `${num / G}/${den / G}`,
        wrongs: [`${n1 * d2}/${d1 * n2}`, `${num}/${den + G}`, `${n1 + n2}/${d1 + d2}`] as [string, string, string],
        tags: [], explanation: `Multiply straight across: (${n1}×${n2})/(${d1}×${d2}) = ${num}/${den} = ${num / G}/${den / G} after cancelling ${G}.`,
        difficulty: 0.35,
      };
    }
    const n1 = r.int(1, 4), d1 = r.int(2, 5), n2 = r.int(1, 5), d2 = r.int(2, 6);
    const num = n1 * d2, den = d1 * n2;
    const gg = (a: number, b: number): number => (b ? gg(b, a % b) : a);
    const G = gg(num, den);
    return {
      prompt: `Work out ${n1}/${d1} ÷ ${n2}/${d2}.`,
      correct: `${num / G}/${den / G}`,
      wrongs: [`${n1 * n2}/${d1 * d2}`, `${d1 * n2}/${n1 * d2}`, `${num}/${den + 1}`] as [string, string, string],
      tags: [], explanation: `Keep–flip–multiply: ${n1}/${d1} × ${d2}/${n2} = ${num}/${den} = ${num / G}/${den / G}. Dividing by ${n2}/${d2} asks how many of them fit.`,
      difficulty: 0.45,
    };
  },
  "decimals": (r) => {
    const which = r.int(1, 2);
    if (which === 1) {
      const a = (r.int(11, 99) / 10).toFixed(1), b = (r.int(11, 99) / 10).toFixed(1);
      const s = (parseFloat(a) + parseFloat(b)).toFixed(1);
      return {
        prompt: `Work out ${a} + ${b}.`,
        correct: s,
        wrongs: [(parseFloat(a) + parseFloat(b)).toFixed(2), (parseFloat(a) * 10 + parseFloat(b)).toFixed(1), (parseFloat(a) + parseFloat(b) + 1).toFixed(1)] as [string, string, string],
        tags: [], explanation: `Line up the decimal points and add columns: ${a} + ${b} = ${s}.`,
        difficulty: 0.2,
      };
    }
    const a = r.int(2, 9), b = r.int(2, 9);
    const prod = ((a / 10) * (b / 10)).toFixed(2);
    return {
      prompt: `Work out 0.${a} × 0.${b}.`,
      correct: prod,
      wrongs: [`${(a * b) / 10}`, `${a * b}`, `0.${a * b}0`.replace(/0$/, "")] as [string, string, string],
      tags: [], explanation: `${a} × ${b} = ${a * b}, and tenths × tenths = hundredths, so 0.${a} × 0.${b} = ${prod}.`,
      difficulty: 0.3,
    };
  },
  "percentages": (r) => {
    const kind = r.int(1, 3);
    if (kind === 1) {
      const p = r.pick([15, 20, 35, 40, 65, 85]), n = r.int(2, 9) * 20;
      const ans = (p * n) / 100; // integer arithmetic: 0.35 × 180 drifts in binary
      return {
        prompt: `Work out ${p}% of ${n}.`,
        correct: fmtNum(ans),
        wrongs: [fmtNum(n - ans), fmtNum(ans * 10), fmtNum((p / 10) * (n / 10) + ans)] as [string, string, string],
        tags: [], explanation: `${p}% = ${p}/100 = ${p / 100}. So ${p}% of ${n} = ${p / 100} × ${n} = ${fmtNum(ans)}.`,
        difficulty: 0.25,
      };
    }
    if (kind === 2) {
      // A discount applied to a price: one percentage, one subtraction. It sits
      // between the bare "find p%" item and the reversed-base trap below, and
      // it is the band a learner is eased to when the tier's own item is not
      // landing — without it, "easier" meant dropping two bands. Prices are
      // multiples of 20 and every discount divides 100, so no item is ever
      // served with a fractional price, and £100 is excluded because the
      // "subtract the percentage" distractor would then equal the answer.
      const price = r.pick([40, 60, 80, 120, 140, 180, 220, 240]);
      const off = r.pick([10, 15, 20, 25, 30, 40, 45]);
      const cut = (price * off) / 100;
      const sale = price - cut;
      return {
        prompt: `A jacket costs £${price}. In a sale it is reduced by ${off}%. What is the sale price (in £)?`,
        correct: fmtNum(sale),
        wrongs: [fmtNum(cut), fmtNum(price - off), fmtNum(price + cut), fmtNum(price)] as [string, string, string, string],
        tags: [], explanation: `${off}% of £${price} = ${fmtNum(cut)}, so the sale price is £${price} − £${fmtNum(cut)} = £${fmtNum(sale)}. The discount is what comes OFF the price, not the price.`,
        difficulty: 0.38,
      };
    }
    const start = 100, rise = r.pick([10, 20, 25, 50]);
    const mid = start + rise;
    return {
      prompt: `A price of $${start} rises by ${rise}%, then falls by ${rise}%. What is the final price (in $)?`,
      correct: fmtNum(mid + (mid * -rise) / 100),
      wrongs: [String(start), String(start - rise), String(mid + rise)] as [string, string, string],
      tags: ["pct-base"], explanation: `${start} → ${mid} after the rise. The fall acts on ${mid}, not ${start}: ${mid} − ${rise}% of ${mid} = ${fmtNum(mid + (mid * -rise) / 100)}. Percentages act on the CURRENT base.`,
      difficulty: 0.45,
    };
  },
  "ratio": (r) => {
    const a = r.int(2, 5), b = r.int(2, 4), parts = r.int(2, 6) * (a + b);
    const unit = parts / (a + b);
    return {
      prompt: `Share $${parts} between two people in the ratio ${a} : ${b}. How much does the larger share get (in $)?`,
      correct: String(Math.max(a, b) * unit),
      wrongs: [String(Math.min(a, b) * unit), String(parts / 2), String(parts - Math.max(a, b) * unit + unit)] as [string, string, string],
      tags: [], explanation: `${a} + ${b} = ${a + b} parts. Each part = ${parts} ÷ ${a + b} = ${unit}. Larger share = ${Math.max(a, b)} × ${unit} = $${Math.max(a, b) * unit}.`,
      difficulty: 0.35,
    };
  },
  "proportion": (r) => {
    const workers = r.pick([4, 5, 6]), days = r.pick([6, 8, 10, 12]);
    const w2 = workers * 2;
    const d2 = (workers * days) / w2;
    return {
      prompt: `${workers} workers build a wall in ${days} days. How long would ${w2} workers take (same rate)?`,
      correct: `${d2} days`,
      wrongs: [`${days * 2} days`, `${d2 + 1} days`, `${days} days`] as [string, string, string],
      tags: ["inv-prop"], explanation: `More workers → LESS time (inverse proportion): workers × days = constant = ${workers * days}. ${w2} workers: ${workers * days} ÷ ${w2} = ${d2} days.`,
      difficulty: 0.4,
    };
  },
  "rounding": (r) => {
    const n = r.int(100, 999);
    const to = r.pick(["nearest 10", "nearest 100"] as const);
    const ans = to === "nearest 10" ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
    return {
      prompt: `Round ${n} to the ${to}.`,
      correct: String(ans),
      wrongs: [String(ans + (ans > n ? 10 : -10)), String(n), String(ans + (ans > n ? 100 : -100))] as [string, string, string],
      tags: ["round-half"], explanation: `Look at the digit to the right of the place you're rounding to: ${n} → ${ans}. 5 or more rounds up.`,
      difficulty: 0.15,
    };
  },
  "order-ops": (r) => {
    const a = r.int(2, 6), b = r.int(2, 6), c = r.int(2, 9);
    const ans = a + b * c;
    return {
      prompt: `Work out ${a} + ${b} × ${c}.`,
      correct: String(ans),
      wrongs: [String((a + b) * c), String(a + b + c), String(a * b + c)] as [string, string, string],
      tags: ["order-ops"], explanation: `Multiplication before addition: ${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${ans}.`,
      difficulty: 0.2,
    };
  },
  "indices-intro": (r) => {
    const kind = r.int(1, 3);
    const a = r.int(2, 5);
    if (kind === 1) {
      const m = r.int(2, 4), n = r.int(2, 4);
      return {
        prompt: `Simplify a^${m} × a^${n}.`,
        correct: `a^${m + n}`,
        wrongs: [`a^${m * n}`, `a^${m + n + 1}`, `2a^${m + n}`, `a^${m + n - 1}`],
        tags: [], explanation: `Same base: ADD the indices. a^${m} × a^${n} = a^${m}+${n} = a^${m + n}.`,
        difficulty: 0.3,
      };
    }
    if (kind === 2) {
      const n = r.int(3, 5);
      const v = Math.pow(a, n);
      return {
        prompt: `Evaluate ${a}^${n}.`,
        correct: String(v),
        wrongs: [String(a * n), String(Math.pow(a, n - 1)), String(v + a)] as [string, string, string],
        // No tag: this item shows a POSITIVE index, so a wrong answer here
        // cannot reveal "a⁻² is a negative number". It used to carry
        // "neg-exp", which meant a learner who read 4^5 as 4 × 5 was shown
        // negative-index coaching — evidence recorded against a belief the
        // item could not test.
        tags: [], explanation: `${a}^${n} = ${Array.from({ length: n }, () => a).join(" × ")} = ${v}. (${a}^${n} means ${n} factors of ${a} — not ${a} × ${n}.)`,
        difficulty: 0.2,
      };
    }
    // The belief's real detector: a negative index, where the sign-flip option
    // is what a learner who reads the minus as the sign of the VALUE picks.
    // Pairs keep a^p ≠ a × p, so "used the product in the denominator" cannot
    // collapse onto the correct fraction. Difficulty stays at the concept's
    // existing ceiling (0.3), so this adds a detector without deepening the
    // concept — the depth a course can reach is a separate, measured fact.
    const [b, p] = r.pick([[2, 3], [2, 4], [3, 2], [3, 3], [4, 2], [4, 3]] as const);
    const val = Math.pow(b, p);
    return {
      prompt: `Evaluate ${b}^−${p}.`,
      correct: `1/${val}`,
      wrongs: [`−${val}`, String(val), `1/${b * p}`] as [string, string, string],
      tags: ["neg-exp"], explanation: `A minus in the index means RECIPROCAL, not a negative value: ${b}^−${p} = 1/${b}^${p} = 1/${val}. The answer is positive — the sign of the index never changes the sign of the value.`,
      difficulty: 0.3,
    };
  },
  "standard-form": (r) => {
    // Keep the mantissa as DIGITS: 6.8 / 10 is 0.6799999999999999 in binary.
    const d = r.int(11, 99);
    const a = `${Math.floor(d / 10)}.${d % 10}`;
    const n = r.int(3, 9);
    const big = Number(a) * Math.pow(10, n);
    return {
      prompt: `Write ${big.toLocaleString("en-US").replace(/,/g, " ")} in standard form.`,
      correct: `${a} × 10^${n}`,
      wrongs: [`${d} × 10^${n - 1}`, `${a} × 10^${n + 1}`, `0.${d} × 10^${n + 1}`] as [string, string, string],
      tags: ["sf-sig"], explanation: `A must be between 1 and 10: ${a} × 10^${n}. Count the places the point moved to check the power.`,
      difficulty: 0.35,
    };
  },
  "algebra-expressions": (r) => {
    const a = r.int(2, 6), b = r.int(2, 5), c = r.int(1, 4);
    return {
      prompt: `Simplify ${a}x + ${b}x − ${c}x.`,
      correct: `${a + b - c}x`,
      wrongs: [`${a + b + c}x`, `${a + b - c}x²`, `${a * b - c}x`, `${a + b - c + 1}x`],
      tags: ["like-terms"], explanation: `All three are x-terms (same species): (${a} + ${b} − ${c})x = ${a + b - c}x. You cannot add x and x² — different species.`,
      difficulty: 0.25,
    };
  },
  "algebra-expand": (r) => {
    const p = r.nz(-5, 5), q = r.nz(-5, 5);
    return {
      prompt: `Expand and simplify (x + ${p})(x + ${q}).`,
      correct: `x² ${p + q < 0 ? "−" : "+"} ${Math.abs(p + q)}x ${p * q < 0 ? "−" : "+"} ${Math.abs(p * q)}`,
      wrongs: [
        `x² ${p + q < 0 ? "+" : "−"} ${Math.abs(p + q)}x ${p * q < 0 ? "−" : "+"} ${Math.abs(p * q)}`,
        `x² ${p * q < 0 ? "−" : "+"} ${Math.abs(p * q)}`,
        `x² ${p + q < 0 ? "−" : "+"} ${Math.abs(p + q)}x ${p * q < 0 ? "+" : "−"} ${Math.abs(p * q)}`,
      ] as [string, string, string],
      tags: ["sign-slip"], explanation: `x² + ${q}x + ${p}x + ${p * q} = x² ${p + q < 0 ? "−" : "+"} ${Math.abs(p + q)}x ${p * q < 0 ? "−" : "+"} ${Math.abs(p * q)}. Every term carries its sign.`,
      difficulty: 0.45,
    };
  },
  "linear-equations": (r) => {
    const a = r.int(2, 8), x = r.nz(-5, 6), b = r.nz(-9, 9);
    const c = a * x + b;
    return {
      prompt: `Solve: ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${c}`,
      correct: `x = ${x}`,
      // The third distractor used to be (c − b)/a + 1, which IS x + 1 — the same
      // string as the second, so every draw fell back to "None of these".
      wrongs: [`x = ${-x}`, `x = ${x + 1}`, `x = ${x - 1}`] as [string, string, string],
      tags: ["bal-slip"], explanation: `${b < 0 ? "Add" : "Subtract"} ${Math.abs(b)} both sides: ${a}x = ${c - b}. Divide by ${a}: x = ${x}. Check: ${a}(${x}) ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${c} ✓.`,
      difficulty: 0.3,
    };
  },
  "inequalities": (r) => {
    const a = r.int(2, 6), x = r.nz(-6, 5), b = r.nz(-9, 9);
    const c = a * x + b;
    return {
      prompt: `Solve: ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} < ${c}`,
      correct: `x < ${x}`,
      wrongs: [`x > ${x}`, `x < ${-x}`, `x > ${-x}`] as [string, string, string],
      tags: ["ineq-flip"], explanation: `Solve like an equation: ${a}x < ${c - b}, so x < ${x}. (Only if you divided by a NEGATIVE would the sign flip to >.)`,
      difficulty: 0.4,
    };
  },
  "simultaneous": (r) => {
    const x = r.int(1, 6), y = r.nz(-5, 6), a = r.int(1, 3), b = r.int(1, 3);
    const e1x = a, e1y = 1, c1 = a * x + y;
    const c2 = b * x + b * y;
    return {
      prompt: `Solve: ${a}x + y = ${c1} and ${b}x + ${b}y = ${c2}. What is x + y?`,
      correct: String(x + y),
      wrongs: [String(x - y), String(x), String(y)] as [string, string, string],
      tags: ["sub-sign"], explanation: `Divide the second by ${b}: x + y = ${x + y}. (First equation gives ${a}x + y = ${c1}; subtracting gives x = ${x}, then y = ${y}.)`,
      difficulty: 0.5,
    };
  },
  "straight-lines": (r) => {
    const m = r.nz(-4, 5), c = r.nz(-6, 8);
    return {
      prompt: `What is the gradient of the line y = ${m}x ${c < 0 ? "−" : "+"} ${Math.abs(c)}?`,
      correct: String(m),
      wrongs: [String(-m), String(c), fmtNum(1 / m)] as [string, string, string],
      tags: ["grad-run"], explanation: `In y = mx + c, m is the gradient: here m = ${m} (it slopes ${m < 0 ? "downhill" : "uphill"}). c is only where it crosses the y-axis.`,
      difficulty: 0.25,
    };
  },
  "quadratics": (r) => {
    const p = r.int(1, 6), q = r.int(1, 6);
    const b = p + q, c = p * q;
    return {
      prompt: `Solve x² − ${b}x + ${c} = 0. Give the smaller root.`,
      correct: String(Math.min(p, q)),
      wrongs: [String(Math.max(p, q)), String(-Math.min(p, q)), String(b)] as [string, string, string],
      tags: ["lost-root"], explanation: `Factorise: (x − ${p})(x − ${q}) = 0, so x = ${p} or x = ${q}. The smaller root is ${Math.min(p, q)}.`,
      difficulty: 0.5,
    };
  },
  "sequences": (r) => {
    const d = r.int(2, 7), first = r.int(2, 9);
    const nth = (n: number) => first + (n - 1) * d;
    const term = r.int(3, 8);
    return {
      prompt: `A sequence starts ${first}, ${nth(2)}, ${nth(3)}, ${nth(4)}, … What is the ${term}th term?`,
      correct: String(nth(term)),
      wrongs: [String(nth(term) + d), String(nth(term) - d), String(first + term * d)] as [string, string, string],
      tags: ["nth-term"], explanation: `Term-to-term rule: +${d}. nth term = ${d}n + ${first - d}. So term ${term} = ${d}×${term} + ${first - d} = ${nth(term)}.`,
      difficulty: 0.35,
    };
  },
  "functions": (r) => {
    const a = r.int(2, 5), b = r.nz(-6, 8), x = r.nz(-4, 5);
    const val = a * x + b;
    return {
      prompt: `If f(x) = ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}, what is f(${x})?`,
      correct: String(val),
      wrongs: [String(-val), String(a * x - b), String(a + x + b)] as [string, string, string],
      tags: [], explanation: `Substitute: f(${x}) = ${a}(${x}) ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${val}. Keep the sign of ${x} in the substitution.`,
      difficulty: 0.3,
    };
  },
  "trig-ratios": (r) => {
    // The second variant exists because `deg-rad` (the calculator-mode belief)
    // had NO detector in the bank: the catalogue warned about it and no item
    // could reveal it. Setting the trap explicitly is the only way a learner
    // who holds it can ever be shown to hold it — and the only way the coaching
    // line is ever earned rather than assumed.
    if (r.next() < 0.5) {
      const which = r.pick(["sin", "cos", "tan"] as const);
      const angle = r.pick([15, 30, 45, 60, 75]);
      const rad = (angle * Math.PI) / 180;
      const valOf = (w: "sin" | "cos" | "tan") => (w === "sin" ? Math.sin(rad) : w === "cos" ? Math.cos(rad) : Math.tan(rad));
      const fmt = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(3).replace(/0+$/, "").replace(/\.$/, ""));
      const correct = fmt(valOf(which));
      const others = (["sin", "cos", "tan"] as const).filter((x) => x !== which).map((x) => fmt(valOf(x)));
      return {
        prompt: `Evaluate ${which} ${angle}° (calculator, degrees).`,
        correct,
        wrongs: [others[0], others[1], fmt(valOf(which) * 2)] as [string, string, string],
        tags: ["hyp-leg-trig"], explanation: `In DEGREE mode: ${which} ${angle}° = ${correct}. Sanity-check your calculator's mode — sin 30° must be 0.5.`,
        difficulty: 0.3,
      };
    }
    const shown = Math.sin(30).toFixed(3); // radian mode: sin(30 rad) ≈ −0.988
    return {
      prompt: `A calculator in RADIAN mode reports sin(30) = ${shown}. What should it have been, and why?`,
      correct: "sin 30° = 0.5 — the calculator was in the wrong mode",
      wrongs: [`${shown} is the right value for sin 30°`, "sin 30° = 1", "sin 30° cannot be found without a table"] as [string, string, string],
      tags: ["deg-rad"], explanation: `In radian mode "30" means 30 RADIANS — about 1719°, which is why the value is ${shown}. Degrees multiply by π/180 before the ratio: sin 30° = 0.5. Check the mode before you press anything: sin 30° must be 0.5, and a value of ${shown} means RAD.`,
      difficulty: 0.35,
    };
  },
  "pythagoras": (r) => {
    const triples: Array<[number, number, number]> = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
    const [a, b, c] = r.pick(triples);
    return {
      prompt: `A right triangle has legs ${a} and ${b}. What is the hypotenuse?`,
      correct: String(c),
      wrongs: [String(a + b), String(c + 1), String(Math.abs(b - a))] as [string, string, string],
      tags: ["hyp-leg"], explanation: `a² + b² = c²: ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, so c = ${c}. The hypotenuse is opposite the right angle — always the longest side.`,
      difficulty: 0.35,
    };
  },
  "angles-lines": (r) => {
    const kind = r.int(1, 2);
    if (kind === 1) {
      const a = r.int(35, 145);
      return {
        prompt: `Two angles on a straight line: one is ${a}°. What is the other?`,
        correct: String(180 - a),
        wrongs: [String(360 - a), String(90 - a), String(a)] as [string, string, string],
        tags: [], explanation: `Angles on a straight line sum to 180°: 180° − ${a}° = ${180 - a}°.`,
        difficulty: 0.15,
      };
    }
    // Only polygon sizes whose interior angle is a whole number of degrees
    // (7 and 11 give 128.57142857142858°).
    const sides = r.pick([5, 6, 8, 9, 10, 12]);
    const interior = ((sides - 2) * 180) / sides;
    return {
      prompt: `What is each interior angle of a REGULAR ${sides}-sided polygon?`,
      correct: `${interior}°`,
      // The exterior angle is 180 − interior, so offering both collided; the
      // three errors below are genuinely distinct.
      wrongs: [`${(sides - 2) * 180}°`, `${360 / sides}°`, `180°`] as [string, string, string],
      tags: ["alt-corr"], explanation: `Interior sum = (n − 2) × 180° = ${(sides - 2) * 180}°. Regular: divide by ${sides} → ${interior}°.`,
      difficulty: 0.4,
    };
  },
  "area-perimeter": (r) => {
    const w = r.int(3, 12), h = r.int(3, 12);
    return {
      prompt: `A rectangle is ${w} cm by ${h} cm. What is its AREA (cm²)?`,
      correct: String(w * h),
      wrongs: [String(2 * (w + h)), String(w + h), String(w * h + w + h)] as [string, string, string],
      tags: ["unit-sq"], explanation: `Area = length × width = ${w} × ${h} = ${w * h} cm². (${2 * (w + h)} cm would be the perimeter.)`,
      difficulty: 0.15,
    };
  },
  "volume": (r) => {
    const l = r.int(2, 6), w = r.int(2, 6), h = r.int(2, 6);
    return {
      prompt: `A cuboid measures ${l} cm × ${w} cm × ${h} cm. Volume (cm³)?`,
      correct: String(l * w * h),
      wrongs: [String(l * w), String(2 * (l * w + w * h + l * h)), String(l + w + h)] as [string, string, string],
      tags: ["unit-sq"], explanation: `V = lwh = ${l} × ${w} × ${h} = ${l * w * h} cm³. (${l * w} cm² is the base area, ${2 * (l * w + w * h + l * h)} cm² the surface area.)`,
      difficulty: 0.25,
    };
  },
  "vectors": (r) => {
    const a = [r.nz(-4, 4), r.nz(-4, 4)], b = [r.nz(-4, 4), r.nz(-4, 4)];
    const s = [a[0] + b[0], a[1] + b[1]];
    return {
      prompt: `Add the vectors (${a[0]}, ${a[1]}) + (${b[0]}, ${b[1]}).`,
      correct: `(${s[0]}, ${s[1]})`,
      // `a = −b` collapses both the swap and the negation onto the (0, 0)
      // answer, so the component-shift candidates below carry the third wrong.
      wrongs: [`(${a[0] - b[0]}, ${a[1] - b[1]})`, `(${s[1]}, ${s[0]})`, `(${a[0] * b[0]}, ${a[1] * b[1]})`, `(${-s[0]}, ${-s[1]})`, `(${s[0] + 1}, ${s[1]})`, `(${s[0]}, ${s[1] + 1})`],
      tags: ["vec-dir"], explanation: `Add component-wise: x: ${a[0]} + ${b[0]} = ${s[0]}, y: ${a[1]} + ${b[1]} = ${s[1]} → (${s[0]}, ${s[1]}).`,
      difficulty: 0.35,
    };
  },
  "probability-basics": (r) => {
    const red = r.int(2, 6), blue = r.int(2, 6), green = r.int(1, 4);
    const total = red + blue + green;
    return {
      prompt: `A bag has ${red} red, ${blue} blue and ${green} green counters. P(blue)?`,
      correct: `${blue}/${total}`,
      wrongs: [`${blue}/${red + blue}`, `${blue}/${green + blue}`, `${total}/${blue}`, `${blue + 1}/${total}`],
      tags: ["sum-one"], explanation: `Favourable ÷ total = ${blue}/${total}. Every counter counts — include ALL colours in the denominator.`,
      difficulty: 0.2,
    };
  },
  "tree-diagrams": (r) => {
    const n = r.pick([3, 4, 5]);
    const total = 2 ** n;
    return {
      prompt: `A fair coin is flipped ${n} times. What is P(all ${n} are heads)?`,
      correct: `1/${total}`,
      // Sharing out linearly (n equal outcomes); treating every count of heads as
      // equally likely; and one branch short of the full tree.
      wrongs: [`${n}/${total}`, `1/${n + 1}`, `1/${total - 1}`],
      tags: ["ind-dep"], explanation: `Independent flips multiply ALONG the branch: (1/2)^${n} = 1/${total}. Each extra flip halves the chance again.`,
      difficulty: 0.35,
    };
  },
  "averages": (r) => {
    const nums = Array.from({ length: 5 }, () => r.int(1, 20));
    const sorted = [...nums].sort((a, b) => a - b);
    const mean = nums.reduce((s, x) => s + x, 0) / 5;
    const median = sorted[2];
    return {
      prompt: `Find the MEDIAN of: ${nums.join(", ")}.`,
      correct: String(median),
      wrongs: [String(mean % 1 === 0 ? mean : +mean.toFixed(1)), String(sorted[1]), String(nums[2])] as [string, string, string],
      tags: ["outlier-mean"], explanation: `Sort first: ${sorted.join(", ")}. The middle (3rd) value is ${median}. (${mean % 1 === 0 ? mean : mean.toFixed(1)} is the mean — a different thing.)`,
      difficulty: 0.25,
    };
  },
  "data-charts": (r) => {
    // Only sectors that divide 360 exactly, so the share is a clean fraction.
    const deg = r.pick([30, 40, 45, 60, 72, 90, 120, 180]);
    const share = 360 / deg;
    return {
      prompt: `A pie chart shows ${deg}° for "walk". What fraction of the students walk?`,
      correct: `1/${share}`,
      wrongs: [`${deg}/360`, `${deg}/180`, `1/${share - 1}`, `1/${share + 1}`],
      tags: [], explanation: `A whole pie is 360°: ${deg}/360 = 1/${share}. Divide the sector angle by 360 and cancel — not by 180 (that is half a circle).`,
      difficulty: 0.2,
    };
  },
  "scatter-correlation": (r) => {
    const scenes = [
      {
        prompt: `Ice-cream sales and drowning deaths rise together every summer. What does this show?`,
        correct: "A third factor (heat) causes both",
        wrongs: ["Ice cream causes drowning", "Drowning causes ice-cream buying", "Nothing — the data must be wrong"],
        tags: ["corr-cause"],
        explanation: `Correlation ≠ causation. Temperature drives both variables — a confounder. Only a controlled study establishes causation.`,
      },
      {
        prompt: `Students who eat breakfast get better grades. What can you conclude?`,
        correct: "Breakfast may not cause it — other factors differ too",
        wrongs: ["Breakfast causes better grades", "Grades cause breakfast", "The study proves nothing about either"],
        tags: ["corr-cause"],
        explanation: `A correlation without a controlled comparison. Sleep, routine and home circumstances all differ between the groups, and each could drive the grades.`,
      },
      {
        prompt: `Regions with more storks also record more births. What is the best explanation?`,
        correct: "A third factor (population size) drives both",
        wrongs: ["Storks deliver babies", "More babies attract storks", "The data must be fabricated"],
        tags: ["corr-cause"],
        explanation: `Bigger regions have both more people and more roofs to nest on. When two counts scale with population, they rise together without causing each other.`,
      },
    ];
    const s = r.pick(scenes);
    return { ...s, difficulty: 0.4 };
  },
  "surds": (r) => {
    // Draw the RADICAND, then reduce it exactly. The old table paired numbers
    // it called perfect squares that were not (36 = 12 × 3), so "Simplify √36"
    // was answered 3.4641016151377544√3 — both wrong and unsimplified.
    const inside = r.pick([8, 12, 18, 20, 24, 27, 32, 36, 45, 48, 50, 72, 75, 98, 100, 108, 200]);
    const sq = largestSquareDivisor(inside);
    const root = inside / sq;      // square-free remainder
    const coef = Math.sqrt(sq);
    const exact = root === 1;      // the radicand is itself a perfect square
    const correct = exact ? String(coef) : `${coef}√${root}`;
    // Distractors encode the two real errors: pulling the factor out unsquared,
    // and multiplying by it instead of rooting it.
    const pool = exact
      ? [`${coef}√2`, String(coef * 2), String((coef * coef) / 2)]
      : [`${sq}√${root}`, `${coef * root}√${root}`, Math.sqrt(inside).toFixed(2)];
    const wrongs: string[] = [];
    for (const w of pool) if (w !== correct && !wrongs.includes(w)) wrongs.push(w);
    let pad = 2;
    while (wrongs.length < 3) {
      const w = fmtNum(coef * pad++);
      if (w !== correct && !wrongs.includes(w)) wrongs.push(w);
    }
    return {
      prompt: `Simplify √${inside}.`,
      correct,
      wrongs: wrongs.slice(0, 3) as [string, string, string],
      tags: ["sqrt-prod"],
      explanation: exact
        ? `√${inside} = ${coef} exactly — ${inside} is a perfect square, so nothing is left under the root.`
        : `√${inside} = √(${sq} × ${root}) = √${sq} × √${root} = ${coef}√${root}. Take the largest perfect-square factor first.`,
      difficulty: 0.45,
    };
  },
  "completing-square": (r) => {
    const b = r.int(2, 9) * 2, c = r.nz(-8, 8);
    const h = b / 2;
    const k = c - h * h;
    return {
      prompt: `Complete the square: x² + ${b}x + ${c} = (x + ${h})² + ?`,
      correct: String(k),
      wrongs: [String(c), String(h * h), String(k + 2 * h * h)] as [string, string, string],
      tags: ["b-half"], explanation: `(${h})² = ${h * h} was added inside, so subtract it: ${c} − ${h * h} = ${k}. Expand to check.`,
      difficulty: 0.5,
    };
  },
  "circle-area-arc": (r) => {
    // Only (radius, angle) pairs where the sector coefficient is a whole number
    // of π; r = 7 with 120° gave a student "16.333333333333332π".
    const [rad, deg] = r.pick([
      [3, 120], [6, 60], [6, 90], [6, 120], [12, 45], [12, 60], [12, 90], [12, 120],
    ] as const);
    const coef = (deg * rad * rad) / 360;
    return {
      prompt: `A sector has radius ${rad} and angle ${deg}°. Area in terms of π?`,
      correct: `${fmtNum(coef)}π`,
      wrongs: [
        `${fmtNum(rad * rad)}π`,
        `${fmtNum((deg * rad) / 360)}π`,
        `${fmtNum((2 * deg * rad) / 360)}π`,
      ] as [string, string, string],
      tags: [], explanation: `Fraction of circle = ${deg}/360. Area = ${deg}/360 × πr² = ${deg}/360 × ${rad * rad}π = ${fmtNum(coef)}π.`,
      difficulty: 0.45,
    };
  },
  "mixture-problems": (r) => {
    const x = r.int(4, 12), a = r.int(2, 4), b = r.int(5, 15);
    const total = a * x + b;
    return {
      prompt: `I think of a number, multiply it by ${a} and add ${b}. I get ${total}. What was the number?`,
      correct: String(x),
      wrongs: [fmtNum((total + b) / a), String(total - b), String(x + 1)] as [string, string, string],
      tags: ["bal-slip"], explanation: `${a}x + ${b} = ${total} → ${a}x = ${total - b} → x = ${x}. Undo operations in reverse order.`,
      difficulty: 0.3,
    };
  },
  "growth-decay": (r) => {
    const p = r.pick([100, 200, 500, 1000]), rate = r.pick([10, 20, 25]);
    const yrs = 2;
    const ans = p * Math.pow(1 + rate / 100, yrs);
    return {
      prompt: `$${p} grows ${rate}% per year, compounded. Value after ${yrs} years (to nearest $)?`,
      correct: String(Math.round(ans)),
      wrongs: [String(p + (rate / 100) * p * yrs), String(Math.round(ans * 1.1)), String(Math.round(ans - p)) + " profit"] as [string, string, string],
      tags: ["simple-cp"], explanation: `Compound: ${p} × (1.${rate})^${yrs} = ${Math.round(ans)}. Simple interest would give only $${p + (rate / 100) * p * yrs} — interest earns interest.`,
      difficulty: 0.45,
    };
  },
  "financial-maths": (r) => {
    const p = r.pick([400, 600, 800]), r_ = 5, n = 3;
    const simple = p + (p * r_ * n) / 100;
    return {
      prompt: `$${p} invested at ${r_}% SIMPLE interest per year. Total after ${n} years ($)?`,
      correct: String(simple),
      wrongs: [String(Math.round(p * Math.pow(1.05, n))), String(p + (p * r_) / 100), String(simple + p * 0.05)] as [string, string, string],
      tags: ["simple-cp"], explanation: `Simple interest adds the same each year: ${n} × ${r_}% of ${p} = ${(p * r_ * n) / 100}. Total = ${simple}. (Compound would give ${Math.round(p * Math.pow(1.05, n))}.)`,
      difficulty: 0.4,
    };
  },
  "bounds": (r) => {
    // The draw was already random here but the prompt and every option were
    // hardcoded to 3.6 — so this concept asked the same question forever.
    const v = r.int(15, 90) / 10;
    const written = v.toFixed(1);
    const lower = (v - 0.05).toFixed(2);
    const upper = (v + 0.05).toFixed(2);
    return {
      prompt: `A length is ${written} m correct to 1 d.p. What is its LOWER bound (m)?`,
      correct: lower,
      // Upper bound (rounded the wrong way); a whole 0.1 below (treated the
      // precision as 0.1 of slack instead of half of it); the rounded value
      // itself.
      wrongs: [upper, (v - 0.1).toFixed(2), written],
      tags: ["round-half"], explanation: `To 1 d.p., ${written} covers [${lower}, ${upper}). The lower bound is half the last written digit's place value below the rounded value — 0.05, not 0.1.`,
      difficulty: 0.4,
    };
  },
  "trig-rule": (r) => {
    // The skill being trained is choosing the rule from the given information,
    // so the scene varies: the same decision asked three different ways.
    const scenes = [
      {
        prompt: `In triangle ABC, a = 7, B = 40°, b = 5. Which rule finds angle A?`,
        correct: "Sine rule: a/sin A = b/sin B",
        wrongs: ["Cosine rule: a² = b² + c² − 2bc cos A", "Pythagoras", "Area = ½ab sin C"],
        tags: ["cos-amb"],
        explanation: `Two angle–opposite-side pairs (a with A, b with B) → sine rule: sin A = a sin B / b. The cosine rule needs three sides, or two sides with the angle between them.`,
      },
      {
        prompt: `In triangle ABC, b = 8, c = 6 and the angle A = 50° lies between them. Which rule finds side a?`,
        correct: "Cosine rule: a² = b² + c² − 2bc cos A",
        wrongs: ["Sine rule: a/sin A = b/sin B", "Pythagoras", "Area = ½ab sin C"],
        tags: [],
        explanation: `Two sides PLUS the angle between them → cosine rule. Pythagoras only works for a right angle; the sine rule needs an opposite pair.`,
      },
      {
        prompt: `In triangle ABC you know all three sides a, b, c and need angle A. Which rule?`,
        correct: "Cosine rule, rearranged: cos A = (b² + c² − a²)/(2bc)",
        wrongs: ["Sine rule: a/sin A = b/sin B", "Pythagoras", "Sine rule, rearranged for an angle"],
        tags: [],
        explanation: `Three sides, no angle → cosine rule rearranged for the angle: cos A = (b² + c² − a²)/(2bc). The sine rule would need one angle to start from.`,
      },
    ];
    const s = r.pick(scenes);
    return { ...s, difficulty: 0.45 };
  },
  "circle-theorems": (r) => {
    const centre = r.pick([80, 100, 120, 140, 160]);
    const circ = centre / 2;
    return {
      prompt: `The angle at the CENTRE subtended by an arc is ${centre}°. What is the angle at the CIRCUMFERENCE on the same arc?`,
      correct: `${circ}°`,
      // The centre angle itself; double it (the rule backwards); the
      // supplementary angle (treating the arc as a straight line); and a
      // near-miss so the (120°, 60°) draw, where the supplementary angle IS the
      // answer, still has three distinct wrongs.
      wrongs: [`${centre}°`, `${centre * 2}°`, `${180 - centre}°`, `${circ + 5}°`],
      tags: ["same-seg"], explanation: `Centre angle = 2 × circumference angle (same arc): ${centre} ÷ 2 = ${circ}°. It is exactly double, not equal to, the angle at the circumference.`,
      difficulty: 0.4,
    };
  },
  "proportional-graphs": (r) => {
    const m = r.int(2, 3); // how many times bigger x gets
    const x1 = r.int(2, 9);
    const y1 = r.int(2, 6) * m; // keeps y2 a whole number
    const k = x1 * y1;
    const x2 = x1 * m;
    const y2 = y1 / m;
    return {
      prompt: `y is inversely proportional to x. When x = ${x1}, y = ${y1}. Find y when x = ${x2}.`,
      correct: String(y2),
      // Scaled y the same way as x (read "inversely" as "proportionally");
      // left y unchanged; and the constant k itself.
      wrongs: [String(y1 * m), String(y1), String(k), String(y1 + 1)],
      tags: ["inv-prop"], explanation: `Inverse proportion: xy = k for every pair. k = ${x1} × ${y1} = ${k}, so when x = ${x2}: y = ${k}/${x2} = ${y2}. Multiplying x by ${m} DIVIDES y by ${m}.`,
      difficulty: 0.4,
    };
  },
  "quadratic-graphs": (r) => {
    const h = r.nz(-4, 4), k = r.nz(-5, 5);
    return {
      prompt: `y = (x ${h < 0 ? "+" : "−"} ${Math.abs(h)})² ${k < 0 ? "−" : "+"} ${Math.abs(k)}. Turning point?`,
      correct: `(${h}, ${k})`,
      wrongs: [`(${-h}, ${k})`, `(${h}, ${-k})`, `(${-h}, ${-k})`] as [string, string, string],
      tags: ["b-half"], explanation: `Completed-square form gives the vertex directly: (x − h)² + k has turning point (h, k). Here x ${h < 0 ? "+" : "−"} ${Math.abs(h)} means h = ${h}, so (${h}, ${k}).`,
      difficulty: 0.5,
    };
  },
  "algebraic-fractions": (r) => {
    const a = r.int(2, 6);
    return {
      prompt: `Simplify (x² − ${a * a})/(x − ${a}) for x ≠ ${a}.`,
      correct: `x + ${a}`,
      wrongs: [`x − ${a}`, `x`, `${a}`] as [string, string, string],
      tags: ["cancel-term"], explanation: `Difference of squares: x² − ${a * a} = (x − ${a})(x + ${a}). Cancel the common factor (x − ${a}): answer x + ${a}.`,
      difficulty: 0.5,
    };
  },
  "sets-venn": (r) => {
    const both = r.int(3, 8), onlyA = r.int(2, 8), onlyB = r.int(2, 8);
    const neither = r.int(1, 6);
    const total = both + onlyA + onlyB + neither;
    return {
      prompt: `In a class of ${total}: ${onlyA + both} like maths, ${onlyB + both} like physics, ${both} like both. How like NEITHER?`,
      correct: String(neither),
      wrongs: [String(total - onlyA - onlyB), String(neither + both), String(onlyA + onlyB)] as [string, string, string],
      tags: ["sum-one"], explanation: `Union = ${onlyA + both} + ${onlyB + both} − ${both} (don't double-count) = ${onlyA + onlyB + both}. Neither = ${total} − ${onlyA + onlyB + both} = ${neither}.`,
      difficulty: 0.45,
    };
  },
  "proof": (r) => {
    const scenes = [
      {
        prompt: `Claim: "n² + n + 41 is prime for every whole number n." Best response?`,
        correct: "Disprove: n = 41 gives 41² + 41 + 41 = 41 × 43, not prime",
        wrongs: ["It's true — check n = 1, 2, 3", "Prove by checking n up to 40", "It cannot be decided"],
        tags: [],
        explanation: `One counterexample kills a universal claim. At n = 41: 41² + 41 + 41 = 41 × 43 — composite. Checking finitely many cases never proves "for all".`,
      },
      {
        prompt: `Claim: "Every odd number squared leaves remainder 1 when divided by 8." Which method proves it?`,
        correct: "Write the odd number as 2k + 1 and expand",
        wrongs: ["Test odd numbers until one fails", "Draw the graph of y = x²", "Assume it is false and look for a counterexample"],
        tags: [],
        explanation: `(2k + 1)² = 4k² + 4k + 1 = 4k(k + 1) + 1, and k(k + 1) is always even — so 4k(k + 1) is a multiple of 8. Algebra covers every odd number at once.`,
      },
      {
        prompt: `Claim: "√2 cannot be written as a fraction." Which approach proves it?`,
        correct: "Assume √2 = a/b in lowest terms, then derive a contradiction",
        wrongs: ["Show its decimal never repeats", "Find a fraction very close to √2", "State that no one has found one"],
        tags: [],
        explanation: `Proof by contradiction: from √2 = a/b in lowest terms you get a² = 2b², so a is even, then b is even too — contradicting "lowest terms". A long decimal is never proof.`,
      },
    ];
    const s = r.pick(scenes);
    return { ...s, difficulty: 0.55 };
  },
  "number-bases": (r) => {
    const bits = [1, 0, 1, 1].map((b) => (r.next() < 0.5 ? b : 1 - b));
    const val = bits[0] * 8 + bits[1] * 4 + bits[2] * 2 + bits[3];
    return {
      prompt: `Convert ${bits.join("")}₂ to denary.`,
      correct: String(val),
      wrongs: [String(bits[3] * 8 + bits[2] * 4 + bits[1] * 2 + bits[0]), String(val + 1), String(parseInt(bits.join(""), 2) + 8)] as [string, string, string],
      tags: [], explanation: `Place values 8, 4, 2, 1: ${bits.map((b, i) => b ? [8, 4, 2, 1][i] : 0).filter(Boolean).join(" + ") || 0} = ${val}. Leftmost bit is the biggest place.`,
      difficulty: 0.3,
    };
  },
  "logic-maths": (r) => {
    // One valid inference and two classic fallacies — the same skill (can this
    // conclusion actually be drawn?) in three different wordings.
    const scenes = [
      {
        prompt: `"If it rains, the match is cancelled." It did NOT rain. What follows?`,
        correct: "Nothing — the match may or may not be cancelled",
        wrongs: ["The match was cancelled", "The match was not cancelled", "The statement is false"],
        tags: [],
        explanation: `A → B says only what happens WHEN A holds. Without rain (¬A) it is silent — the 'denying the antecedent' fallacy.`,
      },
      {
        prompt: `"If a shape is a square, it has 4 sides." This shape has 4 sides. What follows?`,
        correct: "Nothing — a rectangle or rhombus also has 4 sides",
        wrongs: ["It is a square", "It is not a square", "The statement is false"],
        tags: [],
        explanation: `B does not give you A ('affirming the consequent'): squares are a SUBSET of 4-sided shapes. Only the reverse implication would hold.`,
      },
      {
        prompt: `"If n is even then n² is even." n² is NOT even. What follows?`,
        correct: "n is not even",
        wrongs: ["n is even", "Nothing follows", "n² might still be even"],
        tags: [],
        explanation: `If A → B and B is false, then A must be false (modus tollens). This is the one direction that always works — it is how proof by contradiction runs.`,
      },
    ];
    const s = r.pick(scenes);
    return { ...s, difficulty: 0.5 };
  },
  "matrices-intro": (r) => {
    const a = r.int(1, 4), b = r.int(1, 4), c = r.int(1, 4), d = r.int(1, 4);
    const det = a * d - b * c;
    return {
      prompt: `Matrix [[${a}, ${b}], [${c}, ${d}]]. Determinant?`,
      correct: String(det),
      wrongs: [String(a * d + b * c), String(a + d - b - c), String(det + 2 * b * c)] as [string, string, string],
      tags: [], explanation: `det = ad − bc = ${a}×${d} − ${b}×${c} = ${det}. Zero would mean the matrix collapses the plane (no inverse).`,
      difficulty: 0.4,
    };
  },
  "polynomials": (r) => {
    const a = r.nz(-3, 3), b = r.nz(-3, 3), c = r.nz(-3, 3), d = r.nz(-4, 4);
    const val = a * a * a + b * a * a + c * a + d;
    return {
      prompt: `P(x) = x³ + ${b}x² + ${c}x + ${d}. P(${a}) = ?`,
      correct: String(val),
      wrongs: [String(-val), String(val + a), String(a * a * a + b * a + c)] as [string, string, string],
      tags: [], explanation: `Substitute x = ${a}: ${a * a * a} + ${b * a * a} + ${c * a} + ${d} = ${val}. (If this were 0, (x − ${a}) would be a factor — factor theorem.)`,
      difficulty: 0.45,
    };
  },
  "binomial": (r) => {
    // Row n of Pascal's triangle, built by addition so it cannot drift.
    const row = (n: number): number[] => {
      let cur = [1];
      for (let i = 1; i <= n; i++) cur = [...cur.map((v, j) => v + (cur[j - 1] ?? 0)), 1];
      return cur;
    };
    const n = r.pick([2, 3, 4, 5]);
    const coefs = row(n);
    const slipped = [...coefs];
    slipped[1] += 1; // the "added the 1s wrong" slip
    const pretty = (xs: number[]) => xs.join(", ");
    return {
      prompt: `Coefficients of (a + b)^${n}, in order?`,
      correct: pretty(coefs),
      wrongs: [pretty(row(n - 1)), pretty(row(n + 1)), pretty(slipped)],
      tags: ["row-n"], explanation: `Pascal's row ${n} (${n + 1} entries): ${pretty(coefs)}. Row n holds the coefficients of (a + b)^${n} — each entry is the two above it added.`,
      difficulty: 0.4,
    };
  },
  "trig-identity": (r) => {
    // Pythagorean triples only — every answer is exact, no decimals.
    const [a, b, c] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]);
    const flip = r.next() < 0.5;
    const given = flip ? a : b;
    const want = flip ? b : a;
    return {
      prompt: `θ is acute and sin θ = ${given}/${c}. What is cos θ?`,
      correct: `${want}/${c}`,
      // tan θ (the ratio of the two legs, not the hypotenuse); the reciprocal;
      // and the "forgot the hypotenuse" slip.
      wrongs: [`${a}/${b}`, `${c}/${want}`, `${c - given}/${c}`],
      tags: [], explanation: `sin²θ + cos²θ = 1, so cos²θ = 1 − (${given}/${c})² = ${c * c - given * given}/${c * c} and cos θ = ${want}/${c}. A ${a}-${b}-${c} triangle in disguise.`,
      difficulty: 0.45,
    };
  },
  "iteration": (r) => {
    return {
      prompt: `x₀ = 2, x_{n+1} = (x_n + 5/x_n)/2. x₁ = ?`,
      correct: "2.25",
      wrongs: ["2.5", "3.5", "2.2"] as [string, string, string],
      tags: [], explanation: `x₁ = (2 + 5/2)/2 = (2 + 2.5)/2 = 2.25. This iteration converges to √5 — Newton's method for square roots.`,
      difficulty: 0.5,
    };
  },
  "circle-geometry-adv": (r) => {
    const scenes = [
      {
        prompt: `Two tangents are drawn from the same external point to a circle. Their lengths are…?`,
        correct: "Equal",
        wrongs: ["In the ratio 1 : 2", "Perpendicular to each other", "Always chords of the circle"],
        tags: [],
        explanation: `Tangents from the same external point are equal: each forms a right angle with its radius, and the two right-angled triangles share the hypotenuse to the centre (RHS congruent).`,
      },
      {
        prompt: `An angle is subtended by a diameter at the circumference. Its size is…?`,
        correct: "90°",
        wrongs: ["45°", "60°", "It depends on the radius"],
        tags: ["same-seg"],
        explanation: `The diameter subtends 180° at the centre, and the circumference angle is always half the centre angle: 180 ÷ 2 = 90°. This is Thales' theorem.`,
      },
      {
        prompt: `A tangent and a chord meet at a point on the circle. The angle between them equals…?`,
        correct: "The angle in the alternate segment",
        wrongs: ["The angle at the centre", "Twice the angle in the alternate segment", "Always 90°"],
        tags: ["alt-seg"],
        explanation: `Alternate segment theorem: the angle between tangent and chord equals the angle that the same chord subtends in the opposite segment.`,
      },
    ];
    const s = r.pick(scenes);
    return { ...s, difficulty: 0.45 };
  },
  "kinematics": (r) => {
    const u = r.int(2, 10), a = r.int(1, 4), t = r.int(2, 6);
    const v = u + a * t;
    return {
      prompt: `u = ${u} m/s, a = ${a} m/s², t = ${t} s. Final velocity v (m/s)?`,
      correct: String(v),
      wrongs: [String(u + a), String(v + t), String(u * a * t)] as [string, string, string],
      tags: [], explanation: `v = u + at = ${u} + ${a}×${t} = ${v}. (Distance needs s = ut + ½at².)`,
      difficulty: 0.4,
    };
  },
  "calculus-diff": (r) => {
    const n = r.int(2, 6), a = r.int(1, 5);
    return {
      prompt: `y = ${a === 1 ? "" : a}x^${n}. dy/dx = ?`,
      correct: `${a * n}x^${n - 1}`,
      wrongs: [`${a}x^${n - 1}`, `${a * n}x^${n}`, `${a * (n + 1)}x^${n + 1}`] as [string, string, string],
      tags: [], explanation: `Power rule: multiply by the power, reduce it by one: dy/dx = ${a}·${n}x^${n - 1} = ${a * n}x^${n - 1}.`,
      difficulty: 0.45,
    };
  },
  "calculus-int": (r) => {
    const n = r.int(1, 4), a = r.int(1, 5);
    return {
      prompt: `∫ ${a === 1 ? "" : a}x^${n} dx = ?`,
      correct: `${a / (n + 1) % 1 === 0 ? a / (n + 1) : `${a}/${n + 1}`}x^${n + 1} + c`,
      wrongs: [`${a}x^${n + 1} + c`, `${a * n}x^${n - 1} + c`, `${a / (n + 1) % 1 === 0 ? a / (n + 1) : `${a}/${n + 1}`}x^${n + 1}`] as [string, string, string],
      tags: [], explanation: `Raise the power, divide by the new power: ∫xⁿ dx = xⁿ⁺¹/(n+1) + c. Never forget + c — derivatives lose constants.`,
      difficulty: 0.5,
    };
  },
};

// ── SCIENCE generators ──────────────────────────────────────────────────────
const SCI_GENS: Record<string, RawGen> = {
  "forces-basics": (r) => {
    const v = r.pick([2, 5, 8, 12]);
    return {
      prompt: `A box slides across ice at a steady 4 m/s. The resultant horizontal force on it is…?`,
      correct: "Zero — steady velocity means balanced forces",
      wrongs: ["Forward, to keep it moving", "Backward, because it will slow eventually", "Equal to its weight"] as [string, string, string],
      tags: ["bal-motion"], explanation: `Newton's first law: constant velocity → zero RESULTANT force. No push is needed to keep something moving — only to change its motion.`,
      difficulty: 0.4,
    };
  },
  "motion-graphs": (r) => {
    return {
      prompt: `On a velocity–time graph, the AREA under the line gives…?`,
      correct: "Distance travelled",
      wrongs: ["Acceleration", "Speed", "Force"] as [string, string, string],
      tags: ["dt-vt"], explanation: `Velocity–time: gradient = acceleration, AREA = distance. (On distance–time: gradient = speed.)`,
      difficulty: 0.35,
    };
  },
  "newton-laws": (r) => {
    const m = r.pick([2, 4, 5, 8]), a = r.pick([2, 3, 5]);
    return {
      prompt: `A ${m} kg trolley accelerates at ${a} m/s². Resultant force (N)?`,
      correct: String(m * a),
      wrongs: [String(m + a), fmtNum(m / a), String(m * a * 10)] as [string, string, string],
      tags: ["fma-v"], explanation: `F = ma = ${m} × ${a} = ${m * a} N. (Weight would be mg — a different quantity.)`,
      difficulty: 0.3,
    };
  },
  "momentum": (r) => {
    const m1 = r.pick([2, 3]), v1 = r.pick([2, 3, 4]), m2 = r.pick([1, 2]);
    const after = m1 + m2;
    const v = (m1 * v1) / after;
    return {
      prompt: `A ${m1} kg trolley at ${v1} m/s hits a stationary ${m2} kg trolley and they stick together. Common velocity (m/s)?`,
      correct: fmtNum(v),
      wrongs: [String(v1), fmtNum((m1 * v1) / m2), fmtNum(v1 / 2)] as [string, string, string],
      tags: ["con-pair"], explanation: `Momentum before = ${m1}×${v1} = ${m1 * v1}. After: (${m1}+${m2})v = ${after}v. So v = ${m1 * v1}/${after} = ${v % 1 === 0 ? v : v.toFixed(2)} m/s.`,
      difficulty: 0.5,
    };
  },
  "energy-conservation": (r) => {
    const m = r.pick([1, 2, 3]);
    const v = r.pick([2, 4, 6]);
    const ke = 0.5 * m * v * v;
    return {
      prompt: `A ${m} kg ball moves at ${v} m/s. Kinetic energy (J)?`,
      correct: String(ke),
      wrongs: [String(m * v), String(m * v * v), String(0.5 * m * v)] as [string, string, string],
      tags: ["ke-mass"], explanation: `KE = ½mv² = ½ × ${m} × ${v}² = ${ke} J. Note v is SQUARED — double the speed, quadruple the energy.`,
      difficulty: 0.35,
    };
  },
  "work-power": (r) => {
    const f = r.pick([400, 500, 800]), d = r.pick([2, 4, 5]), t = r.pick([8, 10, 20]);
    const w = f * d;
    return {
      prompt: `A crane lifts with ${f} N through ${d} m in ${t} s. Power (W)?`,
      correct: String(w / t),
      wrongs: [String(w), String(w * t), String(f / t)] as [string, string, string],
      tags: ["eff-frac"], explanation: `Work = Fd = ${f}×${d} = ${w} J. Power = work/time = ${w}/${t} = ${w / t} W.`,
      difficulty: 0.4,
    };
  },
  "waves-basics": (r) => {
    // Two variants, because the two things a wave can do are independent and
    // students conflate them: how FAST it travels (v = fλ, the first variant)
    // and how LOUD/BRIGHT it is versus how high its pitch is (the second). The
    // second exists because `freq-pitch` had no detector anywhere in the bank —
    // the catalogue named the belief and no item could reveal it, so every
    // declaration of it was unfalsifiable. A belief OpenMind cannot detect is a
    // belief it must not claim to coach.
    if (r.next() < 0.5) {
      const f = r.pick([2, 4, 5, 10]), wl = r.pick([2, 3, 4]);
      return {
        prompt: `A wave has frequency ${f} Hz and wavelength ${wl} m. Speed (m/s)?`,
        correct: String(f * wl),
        wrongs: [String(f + wl), fmtNum(f / wl), fmtNum(wl / f)] as [string, string, string],
        tags: [], explanation: `v = fλ = ${f} × ${wl} = ${f * wl} m/s.`,
        difficulty: 0.3,
      };
    }
    return {
      prompt: `Two sound waves travel through the same air at the same speed. Wave A is drawn taller than wave B. What is different about A?`,
      correct: "It is louder — a bigger amplitude carries more energy",
      wrongs: ["It has a higher pitch", "It has a higher frequency", "It is travelling faster than B"] as [string, string, string],
      tags: ["freq-pitch"], explanation: `Height on a wave diagram is AMPLITUDE, which is energy: taller means louder. Pitch comes from frequency — how many waves pass per second — and the diagram's height says nothing about it. Two independent dials: amplitude = loudness/brightness, frequency = pitch/colour.`,
      difficulty: 0.4,
    };
  },
  "light-optics": (r) => {
    return {
      prompt: `Light passes from air into glass. What happens to its speed and direction?`,
      correct: "Slows down and bends TOWARD the normal",
      wrongs: ["Speeds up and bends away from the normal", "Same speed, bends toward the normal", "Slows down and bends away from the normal"] as [string, string, string],
      tags: ["norm-miss"], explanation: `Entering a denser medium light slows; the wavefront pivots toward the normal. All refraction angles are measured from the NORMAL, not the surface.`,
      difficulty: 0.45,
    };
  },
  "sound-acoustics": (r) => {
    return {
      prompt: `An astronaut shouts on the Moon. Another astronaut 10 m away hears…?`,
      correct: "Nothing — there is no medium to carry sound",
      wrongs: ["The shout clearly, sound travels fine in vacuum", "A quiet version, delayed", "Only the echo"] as [string, string, string],
      tags: ["sound-vac"], explanation: `Sound is a vibration of MATTER. No air on the Moon → no sound. Light and radio work fine, which is why radios are used.`,
      difficulty: 0.3,
    };
  },
  "electricity-circuits": (r) => {
    const v = r.pick([6, 12, 24]), i = r.pick([2, 3, 4]);
    return {
      prompt: `A resistor has ${v} V across it and ${i} A through it. Resistance (Ω)?`,
      correct: fmtNum(v / i),
      wrongs: [String(v * i), fmtNum(i / v), String(v + i)] as [string, string, string],
      tags: ["series-par"], explanation: `V = IR → R = V/I = ${v}/${i} = ${fmtNum(v / i)} Ω.`,
      difficulty: 0.3,
    };
  },
  "magnetism": (r) => {
    return {
      prompt: `Which rule predicts the FORCE on a current-carrying wire in a magnetic field?`,
      correct: "Fleming's LEFT-hand rule",
      wrongs: ["Fleming's right-hand rule", "Right-hand grip rule for the field", "Lenz's law"] as [string, string, string],
      tags: ["motor-gen"], explanation: `Left hand = MOTor effect (current + field → force). Right hand = generator effect (movement → induced current). Field lines index→middle = current, thumb = force.`,
      difficulty: 0.45,
    };
  },
  "thermal-physics": (r) => {
    return {
      prompt: `Why does a metal spoon feel colder than a wooden one at the same room temperature?`,
      correct: "Metal conducts heat away from your hand faster",
      wrongs: ["Metal is at a lower temperature", "Metal has a higher density", "Wood generates heat"] as [string, string, string],
      tags: ["heat-temp"], explanation: `Both are at room temperature. Metal's high thermal conductivity pulls heat from your hand quickly — you sense the RATE of heat loss, not temperature itself.`,
      difficulty: 0.45,
    };
  },
  "pressure-fluids": (r) => {
    const f = r.pick([100, 200, 400]), a = r.pick([2, 4, 8]);
    return {
      prompt: `A force of ${f} N acts on an area of ${a} m². Pressure (Pa)?`,
      correct: String(f / a),
      wrongs: [String(f * a), String(a / f), String(f + a)] as [string, string, string],
      tags: [], explanation: `P = F/A = ${f}/${a} = ${f / a} Pa. Same force on a smaller area → much higher pressure (stiletto vs flat shoe).`,
      difficulty: 0.25,
    };
  },
  "radioactivity": (r) => {
    return {
      prompt: `A sample has a 2-day half-life, starting at 80 g. Mass after 6 days?`,
      correct: "10 g",
      wrongs: ["20 g", "0 g", "13.3 g"] as [string, string, string],
      tags: ["half-life"], explanation: `6 days = 3 half-lives: 80 → 40 → 20 → 10 g. Half of what REMAINS decays each interval — it never reaches zero.`,
      difficulty: 0.4,
    };
  },
  "gravity-fields": (r) => {
    return {
      prompt: `A satellite orbits Earth at constant speed. The resultant force on it…?`,
      correct: "Is nonzero, pointing toward Earth (centripetal)",
      wrongs: ["Is zero — it moves at constant speed", "Points along its direction of travel", "Points away from Earth"] as [string, string, string],
      tags: ["bal-motion"], explanation: `Constant SPEED but changing DIRECTION = acceleration. Gravity provides the centripetal force, bending the path into an orbit — the satellite is 'falling around' Earth.`,
      difficulty: 0.5,
    };
  },
  "atoms-nucleus": (r) => {
    const p = r.pick([6, 8, 11, 17]);
    const n = p + r.int(1, 3);
    return {
      prompt: `An atom has ${p} protons and ${n} neutrons. Mass number?`,
      correct: String(p + n),
      wrongs: [String(p), String(n), String(p + n + 2)] as [string, string, string],
      tags: [], explanation: `Mass number = protons + neutrons = ${p} + ${n} = ${p + n}. Atomic number (${p}) alone identifies the element.`,
      difficulty: 0.25,
    };
  },
  "astrophysics": (r) => {
    return {
      prompt: `Light from distant galaxies is redshifted. What does this tell us?`,
      correct: "The galaxies are moving away — the universe is expanding",
      wrongs: ["The galaxies are approaching us", "The light is losing energy in space", "Galaxies are stationary"] as [string, string, string],
      tags: [], explanation: `Redshift = wavelengths stretched = recession. The further the galaxy, the bigger the redshift (Hubble's law) → space itself is expanding → Big Bang.`,
      difficulty: 0.45,
    };
  },
  "atoms-elements": (r) => {
    return {
      prompt: `What defines WHICH element an atom is?`,
      correct: "Number of protons",
      wrongs: ["Number of neutrons", "Number of electrons", "Total mass"] as [string, string, string],
      tags: [], explanation: `Atomic number = proton count = element identity. Change protons → different element. Neutrons make isotopes; electrons make ions.`,
      difficulty: 0.2,
    };
  },
  "compounds-mixtures": (r) => {
    return {
      prompt: `Air is best described as…`,
      correct: "A mixture — separable by physical means",
      wrongs: ["A compound of nitrogen and oxygen", "An element", "A pure substance"] as [string, string, string],
      tags: [], explanation: `Air's components (N₂, O₂, Ar, CO₂) are not chemically bonded and keep their properties — a mixture, separated by fractional distillation.`,
      difficulty: 0.25,
    };
  },
  "periodic-table": (r) => {
    return {
      prompt: `Going DOWN group 1 (Li → Na → K), reactivity…`,
      correct: "Increases — the outer electron is lost more easily",
      wrongs: ["Decreases — atoms get heavier", "Stays the same", "Increases then decreases"] as [string, string, string],
      tags: ["group-trend"], explanation: `Bigger atoms hold the outer electron more weakly (further from the nucleus, shielded) → easier to lose → MORE reactive down group 1. (Group 7 runs the OPPOSITE way.)`,
      difficulty: 0.45,
    };
  },
  "electron-shells": (r) => {
    const p = r.pick([3, 11, 13, 17, 19, 20]);
    const cfg: Record<number, [string, string, number]> = {
      3: ["2, 1", "2, 2", 1], 11: ["2, 8, 1", "2, 9", 1], 13: ["2, 8, 3", "2, 8, 5", 3],
      17: ["2, 8, 7", "2, 8, 8", 7], 19: ["2, 8, 8, 1", "2, 8, 9", 1], 20: ["2, 8, 8, 2", "2, 8, 8, 3", 2],
    };
    const [correct, wrong, outer] = cfg[p];
    const names: Record<number, string> = { 3: "Lithium", 11: "Sodium", 13: "Aluminium", 17: "Chlorine", 19: "Potassium", 20: "Calcium" };
    return {
      prompt: `${names[p]} has ${p} electrons. Its electron configuration is…`,
      correct,
      wrongs: [wrong, p === 19 || p === 20 ? "2, 8, 8" : "2, 8, 8, 1", String(p).split("").join(", ")] as [string, string, string],
      tags: [], explanation: `Shells fill 2, then 8, then 8: ${correct}. The ${outer} outer electron(s) drive its chemistry.`,
      difficulty: 0.3,
    };
  },
  "ionic-bonding": (r) => {
    return {
      prompt: `Aluminium (Al³⁺) and oxygen (O²⁻) form…`,
      correct: "Al₂O₃ — charges must balance to zero",
      wrongs: ["AlO", "Al₃O₂", "AlO₃"] as [string, string, string],
      tags: [], explanation: `Total positive = total negative: 2 × (+3) = +6 and 3 × (−2) = −6. So Al₂O₃. Cross the charges over as subscripts.`,
      difficulty: 0.45,
    };
  },
  "covalent-bonding": (r) => {
    return {
      prompt: `Why does water (H₂O) have a low boiling point for its formula mass?`,
      correct: "Simple molecules: weak forces BETWEEN molecules break, not strong bonds",
      wrongs: ["Its covalent bonds are weak", "It is ionic", "Hydrogen is light"] as [string, string, string],
      tags: [], explanation: `Boiling overcomes intermolecular forces, NOT covalent bonds — the H–O bonds stay intact in steam. Small molecules have weak intermolecular forces → low boiling points.`,
      difficulty: 0.5,
    };
  },
  "moles-calcs": (r) => {
    const mr = r.pick([18, 44, 40, 32]);
    const moles = r.pick([2, 3, 5]);
    return {
      prompt: `How many grams is ${moles} moles of a compound with Mr = ${mr}?`,
      correct: String(moles * mr),
      wrongs: [fmtNum(mr / moles), String(moles + mr), String(moles * mr * 10)] as [string, string, string],
      tags: ["mr-mass"], explanation: `mass = moles × Mr = ${moles} × ${mr} = ${moles * mr} g. (Dividing by Mr goes the other way: g → moles.)`,
      difficulty: 0.35,
    };
  },
  "equations-stoich": (r) => {
    return {
      prompt: `Balance: CH₄ + __ O₂ → CO₂ + __ H₂O`,
      correct: "2 and 2",
      wrongs: ["1 and 1", "2 and 3", "4 and 2"] as [string, string, string],
      tags: ["mass-balance"], explanation: `C balances (1:1). H: 4 left → 2 × H₂O. O: right has 2 + 2 = 4 → 2 O₂. Only coefficients change, never subscripts.`,
      difficulty: 0.4,
    };
  },
  "rates-reaction": (r) => {
    return {
      prompt: `Powdered marble reacts FASTER than lumps with acid because…`,
      correct: "Larger surface area → more collision sites per second",
      wrongs: ["Powder has more energy", "Powder lowers the temperature", "Powder changes the acid's concentration"] as [string, string, string],
      tags: [], explanation: `Rate = collision frequency × energy success. Powder exposes far more surface → more collisions per second → faster reaction. Same particles, same energy — just more contact.`,
      difficulty: 0.4,
    };
  },
  "energy-changes": (r) => {
    return {
      prompt: `In an ENDOTHERMIC reaction…`,
      correct: "Energy is absorbed — products have MORE energy than reactants",
      wrongs: ["Energy is released — products have less energy", "No energy changes at all", "The temperature always rises"] as [string, string, string],
      tags: [], explanation: `Endothermic = energy IN (breaking bonds wins): photosynthesis, thermal decomposition. The flask cools. Exothermic is the mirror image.`,
      difficulty: 0.4,
    };
  },
  "acids-bases": (r) => {
    return {
      prompt: `HCl + NaOH → ?`,
      correct: "NaCl + H₂O",
      wrongs: ["NaCl + H₂", "NaOH + Cl₂", "Na₂Cl + H₂O"] as [string, string, string],
      tags: ["strong-conc"], explanation: `Neutralisation: acid + alkali → salt + water. H⁺ + OH⁻ → H₂O, leaving Na⁺Cl⁻. Check: Na, Cl, H, O all balance.`,
      difficulty: 0.35,
    };
  },
  "electrolysis": (r) => {
    return {
      prompt: `During electrolysis of molten NaCl, sodium forms at the cathode because…`,
      correct: "Na⁺ ions gain electrons at the negative electrode",
      wrongs: ["Na atoms lose electrons there", "Chloride ions attract them", "Sodium is less dense"] as [string, string, string],
      tags: [], explanation: `Cathode = negative → attracts cations (Na⁺), which GAIN electrons: Na⁺ + e⁻ → Na. (Anode: 2Cl⁻ → Cl₂ + 2e⁻.)`,
      difficulty: 0.5,
    };
  },
  "organic-intro": (r) => {
    return {
      prompt: `Which is the general formula of ALKANES?`,
      correct: "CₙH₂ₙ₊₂",
      wrongs: ["CₙH₂ₙ", "CₙHₙ", "CₙH₂ₙ₊₁"] as [string, string, string],
      tags: [], explanation: `Alkanes are saturated: CₙH₂ₙ₊₂ (methane CH₄, ethane C₂H₆). CₙH₂ₙ fits alkenes with their C=C double bond.`,
      difficulty: 0.4,
    };
  },
  "equilibria": (r) => {
    return {
      prompt: `N₂ + 3H₂ ⇌ 2NH₃ (forward reaction exothermic). Raising the temperature shifts equilibrium…`,
      correct: "Left — toward the endothermic direction",
      wrongs: ["Right — more ammonia forms", "No shift — catalysts cancel it", "Left then right"] as [string, string, string],
      tags: [], explanation: `Le Chatelier: the system opposes the change. Extra heat is 'used up' by the endothermic (reverse) direction → less NH₃. This is why Haber runs a compromise temperature.`,
      difficulty: 0.55,
    };
  },
  "analysis-tests": (r) => {
    return {
      prompt: `Limewater turns cloudy/milky. Which gas?`,
      correct: "Carbon dioxide (CO₂)",
      wrongs: ["Hydrogen", "Oxygen", "Chlorine"] as [string, string, string],
      tags: [], explanation: `CO₂ + Ca(OH)₂ → CaCO₃ (insoluble white precipitate) + H₂O — the cloudiness. (H₂: squeaky pop. O₂: relights splint. Cl₂: bleaches litmus.)`,
      difficulty: 0.35,
    };
  },
  "cells": (r) => {
    return {
      prompt: `Which structure is found in PLANT cells but NOT animal cells?`,
      correct: "Cellulose cell wall",
      wrongs: ["Mitochondria", "Cell membrane", "Nucleus"] as [string, string, string],
      tags: [], explanation: `Plant-only: cellulose wall, chloroplasts, permanent vacuole. Mitochondria, membrane and nucleus are in both.`,
      difficulty: 0.2,
    };
  },
  "enzymes": (r) => {
    return {
      prompt: `An enzyme is denatured above 50 °C. This means…`,
      correct: "Its active site changes shape — the substrate no longer fits",
      wrongs: ["It is destroyed completely", "It works faster but less accurately", "Its substrate changes shape instead"] as [string, string, string],
      tags: [], explanation: `Heat vibrates the protein until its 3-D shape warps. The active site no longer fits the substrate — activity collapses. The enzyme isn't 'used up'; it's disabled.`,
      difficulty: 0.4,
    };
  },
  "digestion": (r) => {
    return {
      prompt: `Which enzyme breaks STARCH into sugars?`,
      correct: "Amylase",
      wrongs: ["Protease", "Lipase", "Bile"] as [string, string, string],
      tags: [], explanation: `Amylase → starch → maltose/sugars. Protease digests protein; lipase digests fats; bile emulsifies fat (not an enzyme).`,
      difficulty: 0.3,
    };
  },
  "circulation": (r) => {
    return {
      prompt: `Which vessel carries oxygenated blood FROM the lungs to the heart?`,
      correct: "Pulmonary vein",
      wrongs: ["Pulmonary artery", "Aorta", "Vena cava"] as [string, string, string],
      tags: [], explanation: `Pulmonary VEIN: lungs → left atrium, oxygen-rich (the exception — veins usually carry deoxygenated). Pulmonary artery goes lungs-ward, oxygen-poor.`,
      difficulty: 0.45,
    };
  },
  "breathing-gas": (r) => {
    return {
      prompt: `When you breathe IN, the diaphragm…`,
      correct: "Contracts and flattens — volume up, pressure down",
      wrongs: ["Relaxes and domes up", "Stays still — ribs do everything", "Contracts into a dome"] as [string, string, string],
      tags: [], explanation: `Contraction flattens the diaphragm, enlarging the chest. Bigger volume → lower pressure → air flows IN. Expiration is mostly relaxation.`,
      difficulty: 0.4,
    };
  },
  "diffusion": (r) => {
    const kind = r.int(1, 3);
    if (kind === 1) {
      return {
        prompt: `A plant cell is placed in PURE water. What happens?`,
        correct: "Water enters by osmosis — the cell becomes turgid",
        wrongs: ["Water leaves — the cell shrivels", "Nothing — membranes block water", "Solutes leave the cell"] as [string, string, string],
        tags: [], explanation: `Pure water outside = higher water potential → net water IN through the partially permeable membrane. The wall stops bursting: turgid, not lysed.`,
        difficulty: 0.45,
      };
    }
    if (kind === 2) {
      return {
        prompt: `A plant cell is placed in CONCENTRATED salt solution. What happens?`,
        correct: "Water leaves by osmosis — the cell becomes flaccid (plasmolysed)",
        wrongs: ["Water enters — the cell bursts", "Nothing changes", "Salt enters by osmosis"] as [string, string, string],
        tags: [], explanation: `Concentrated outside = lower water potential → water LEAVES. The membrane pulls from the wall: plasmolysis. (Animal cells would crenate.)`,
        difficulty: 0.5,
      };
    }
    return {
      prompt: `Oxygen enters the blood from the lungs because…`,
      correct: "Blood has lower O₂ concentration — diffusion down the gradient",
      wrongs: ["Blood actively pumps O₂ in", "Oxygen is pushed by pressure alone", "The heart sucks it in"] as [string, string, string],
      tags: [], explanation: `Diffusion needs NO energy: particles net-migrate from high → low concentration. Alveoli keep blood O₂ low so the gradient never flattens.`,
      difficulty: 0.35,
    };
  },
  "photosynthesis": (r) => {
    return {
      prompt: `Which are the two raw materials of photosynthesis?`,
      correct: "Carbon dioxide and water",
      wrongs: ["Oxygen and glucose", "Glucose and water", "Nitrogen and water"] as [string, string, string],
      tags: [], explanation: `6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (light energy). CO₂ and water IN; glucose and oxygen OUT. Oxygen is a by-product, not an input.`,
      difficulty: 0.3,
    };
  },
  "respiration": (r) => {
    return {
      prompt: `Anaerobic respiration in human muscle produces…`,
      correct: "Lactic acid (and much less energy)",
      wrongs: ["Ethanol and CO₂", "More energy than aerobic", "Oxygen debt repaid instantly"] as [string, string, string],
      tags: [], explanation: `Human muscle: glucose → lactic acid (the 'oxygen debt' repaid later). Yeast: glucose → ethanol + CO₂. Both release FAR less energy than aerobic respiration.`,
      difficulty: 0.4,
    };
  },
  "nervous-system": (r) => {
    return {
      prompt: `The reflex arc bypasses the brain to…`,
      correct: "Save time — automatic, faster responses",
      wrongs: ["Use hormones instead of nerves", "Store the memory permanently", "Increase sensation"] as [string, string, string],
      tags: [], explanation: `Receptor → sensory → relay (spine) → motor → effector. Fewer synapses, no conscious decision → milliseconds. You feel the heat AFTER your hand has moved.`,
      difficulty: 0.4,
    };
  },
  "hormones": (r) => {
    return {
      prompt: `Blood glucose is too HIGH. Which hormone, and what does it do?`,
      correct: "Insulin — moves glucose into cells, stored as glycogen",
      wrongs: ["Glucagon — releases stored glucose", "ADH — retains water", "Adrenaline — raises it further"] as [string, string, string],
      tags: [], explanation: `Insulin LOWERS glucose (storage as glycogen); glucagon RAISES it (glycogen → glucose). Negative feedback keeps ~90 mg/100 ml.`,
      difficulty: 0.45,
    };
  },
  "genetics": (r) => {
    const [D, d] = r.pick([["B", "b"], ["A", "a"], ["R", "r"], ["T", "t"]]);
    const cross = r.int(1, 3);
    const askRecessive = r.next() < 0.5;
    let p1: string, p2: string, fracs: [string, string, string, string], expl: string;
    if (cross === 1) {
      p1 = `${D}${d}`; p2 = `${D}${d}`;
      fracs = askRecessive ? ["1/4", "1/2", "3/4", "0"] : ["3/4", "1/2", "1/4", "1"];
      expl = `Punnett: ${D}${D}, ${D}${d}, ${D}${d}, ${d}${d} — the 3:1 monohybrid signature. ${askRecessive ? "Only " + d + d + " shows recessive → 1/4." : "Any genotype with " + D + " shows dominant → 3/4."}`;
    } else if (cross === 2) {
      p1 = `${D}${d}`; p2 = `${d}${d}`;
      fracs = askRecessive ? ["1/2", "1/4", "3/4", "1"] : ["1/2", "1/4", "3/4", "0"];
      expl = `Test cross: ${D}${d} × ${d}${d} gives ${D}${d}, ${D}${d}, ${d}${d}, ${d}${d} — 1:1, so ${askRecessive ? "1/2 recessive" : "1/2 dominant"}.`;
    } else {
      p1 = `${D}${D}`; p2 = `${D}${d}`;
      fracs = askRecessive ? ["0", "1/4", "1/2", "1/4"] : ["1", "3/4", "1/2", "0"];
      expl = `${D}${D} × ${D}${d}: offspring ${D}${D} or ${D}${d} — all show dominant (${askRecessive ? "0 recessive" : "all 1"}).`;
    }
    return {
      prompt: `Cross ${p1} × ${p2}. What fraction of offspring shows the ${askRecessive ? "RECESSIVE" : "DOMINANT"} phenotype?`,
      correct: fracs[0],
      wrongs: [fracs[1], fracs[2], fracs[3]] as [string, string, string],
      tags: [], explanation: expl,
      difficulty: 0.45,
    };
  },
  "evolution": (r) => {
    return {
      prompt: `Antibiotic-resistant bacteria evolve because…`,
      correct: "Resistant survivors reproduce — selection increases resistance alleles",
      wrongs: ["Antibiotics force bacteria to mutate usefully", "Bacteria learn to avoid the drug", "Resistance appears only after many doses in one patient"] as [string, string, string],
      tags: [], explanation: `Variation exists already. The drug kills non-resistant cells; survivors multiply, passing on resistance. Evolution = selection on existing variation, not need-driven mutation.`,
      difficulty: 0.5,
    };
  },
  "ecosystems": (r) => {
    return {
      prompt: `Why are food chains rarely longer than 5 levels?`,
      correct: "~90% of energy is lost at each transfer",
      wrongs: ["Predators stop hunting each other", "Plants run out of sunlight", "Larger animals need fewer calories"] as [string, string, string],
      tags: [], explanation: `Each level: respiration, movement, heat, excretion consume ~90%. 10 000 J of grass ≈ 10 J at the 4th level — not enough to support another level.`,
      difficulty: 0.45,
    };
  },
  "biodiversity": (r) => {
    return {
      prompt: `Which is the LARGEST direct driver of current species loss?`,
      correct: "Habitat destruction (land-use change)",
      wrongs: ["Natural predators", "Species migrating", "Volcanic activity"] as [string, string, string],
      tags: [], explanation: `Converting habitats to farmland/urban use removes the home and food of species — the top driver globally, ahead of overexploitation, pollution, invasives and climate change.`,
      difficulty: 0.4,
    };
  },
  "immune-health": (r) => {
    return {
      prompt: `Why don't antibiotics work on colds?`,
      correct: "Colds are viral — antibiotics target bacterial machinery only",
      wrongs: ["Colds are too strong for antibiotics", "Antibiotics only prevent illness", "Viruses hide from everything"] as [string, string, string],
      tags: [], explanation: `Antibiotics attack bacterial walls/ribosomes — things viruses lack (they hijack YOUR cells). Misuse breeds resistant bacteria. Vaccines and hygiene fight viruses.`,
      difficulty: 0.4,
    };
  },
  "what-is-code": (r) => {
    return {
      prompt: `A program prints the wrong total. What is the FIRST thing to check?`,
      correct: "Trace the logic step by step with a small example",
      wrongs: ["Rewrite the whole program", "Reinstall the computer", "Add more features"] as [string, string, string],
      tags: [], explanation: `Debugging = tracing state through the code by hand (or with prints) on the smallest input that fails. Computers do exactly what you said — find what you actually said.`,
      difficulty: 0.3,
    };
  },
  "variables": (r) => {
    const a = r.int(3, 9), b = r.int(2, 5);
    return {
      prompt: `x = ${a}; y = ${b}; x = x + y; y = x − y. What is y now?`,
      correct: String(a),
      wrongs: [String(b), String(a + b), String(a + 2 * b)] as [string, string, string],
      tags: [], explanation: `After line 3: x = ${a + b}. Line 4: y = (${a + b}) − ${b} = ${a}. Trace each variable's value line by line.`,
      difficulty: 0.35,
    };
  },
  "conditionals": (r) => {
    const x = r.int(15, 45);
    return {
      prompt: `if x > 30: print("A") elif x > 20: print("B") else: print("C") — with x = ${x}, what prints?`,
      correct: x > 30 ? "A" : "B",
      wrongs: x > 30 ? ["B", "C", "A and B"] : ["A", "C", "B and C"] as [string, string, string],
      tags: [], explanation: `Conditions check TOP-DOWN and stop at the first true branch. x = ${x} ${x > 30 ? "passes the first check → A" : "fails >30, passes >20 → B"}.`,
      difficulty: 0.35,
    };
  },
  "loops": (r) => {
    const n = r.int(3, 6);
    let total = 0;
    for (let i = 1; i <= n; i++) total += i;
    return {
      prompt: `total = 0\nfor i in range(1, ${n + 1}):\n    total = total + i\nWhat is total?`,
      correct: String(total),
      wrongs: [String(total + n + 1), String(n), String(total - 1)] as [string, string, string],
      tags: [], explanation: `range(1, ${n + 1}) gives 1…${n}. Sum: ${Array.from({ length: n }, (_, i) => i + 1).join(" + ")} = ${total}. The loop end value is EXCLUSIVE.`,
      difficulty: 0.4,
    };
  },
  "lists-arrays": (r) => {
    const items = r.shuffle(["kiwi", "apple", "plum", "fig", "pear", "date"]).slice(0, 4);
    const idx = r.int(1, 3);
    return {
      prompt: `fruits = [${items.map((s) => `"${s}"`).join(", ")}]\nprint(fruits[${idx}]) — what prints?`,
      correct: items[idx],
      // The three indices that are NOT the answer — guaranteed distinct, so a
      // Python indexing question can never fall back to a filler option.
      wrongs: [items[(idx + 1) % items.length], items[(idx - 1 + items.length) % items.length], items[(idx + 2) % items.length]],
      tags: [], explanation: `Indexing starts at 0: fruits[0] = "${items[0]}", fruits[${idx}] = "${items[idx]}". fruits[1] is the SECOND element.`,
      difficulty: 0.35,
    };
  },
  "functions-code": (r) => {
    const a = r.int(2, 6), b = r.int(2, 6), x = r.int(2, 8);
    return {
      prompt: `def f(n):\n    return n * 2 + 1\n\ndef g(n):\n    return f(n) * 3\n\nWhat is g(${x})?`,
      correct: String((x * 2 + 1) * 3),
      wrongs: [String(x * 2 + 1), String(x * 2 * 3 + 1), String((x + 1) * 2 * 3)] as [string, string, string],
      tags: [], explanation: `g(${x}) = f(${x}) × 3 = (${x}×2 + 1) × 3 = ${x * 2 + 1} × 3 = ${(x * 2 + 1) * 3}. Compose inside-out: f first, then g.`,
      difficulty: 0.45,
    };
  },
  "dictionaries": (r) => {
    return {
      prompt: `ages = {"Ada": 36, "Grace": 85}\nages["Ada"] = 37\nWhat is ages["Ada"]?`,
      correct: "37",
      wrongs: ["36", "73", "Error"] as [string, string, string],
      tags: [], explanation: `Assignment OVERWRITES the existing key: "Ada" now maps to 37. Dictionaries keep at most one value per key.`,
      difficulty: 0.3,
    };
  },
  "algorithms-search": (r) => {
    return {
      prompt: `Binary search on 1,000,000 sorted items needs at most about how many checks?`,
      correct: "20",
      wrongs: ["1,000,000", "500,000", "1000"] as [string, string, string],
      tags: [], explanation: `Each check halves: 2²⁰ ≈ 1,000,000 → ~20 checks. Halving is exponentially powerful — but the data MUST be sorted first.`,
      difficulty: 0.45,
    };
  },
  "algorithms-sort": (r) => {
    return {
      prompt: `Why is merge sort preferred over bubble sort for large data?`,
      correct: "O(n log n) vs O(n²) — dramatically fewer comparisons as n grows",
      wrongs: ["It uses no extra memory", "It only works on numbers", "It is easier to write"] as [string, string, string],
      tags: [], explanation: `At n = 1,000,000: bubble ≈ 10¹² comparisons, merge ≈ 2×10⁷. The growth CURVE, not the machine, decides what scales.`,
      difficulty: 0.45,
    };
  },
  "recursion": (r) => {
    const n = r.int(4, 7);
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return {
      prompt: `def fact(n):\n    if n == 0: return 1\n    return n * fact(n − 1)\n\nfact(${n}) = ?`,
      correct: String(f),
      wrongs: [String(f * (n + 1)), String(n * n), String(f / n)] as [string, string, string],
      tags: [], explanation: `Unwind: ${n} × ${n - 1} × … × 1 = ${f}. The base case (n = 0 → 1) stops the descent; each call multiplies on the way back up.`,
      difficulty: 0.45,
    };
  },
  "complexity": (r) => {
    // The base used to be one fixed item; with a deep family composed at a 50%
    // share, a student met this exact prompt half the time forever. Three angles
    // of the same ranking skill keep the base honest alongside the family.
    const angle = r.int(0, 2);
    if (angle === 0) {
      return {
        prompt: `Which growth is FASTEST as n gets large?`,
        correct: "2ⁿ",
        wrongs: ["n²", "n log n", "n³"] as [string, string, string],
        tags: [], explanation: `Order for large n: 2ⁿ ≫ n³ > n² > n log n > n > log n. Exponential algorithms hit a wall no computer can climb.`,
        difficulty: 0.45,
      };
    }
    if (angle === 1) {
      return {
        prompt: `Which growth is SLOWEST as n gets large?`,
        correct: "log n",
        wrongs: ["n²", "n log n", "2ⁿ"] as [string, string, string],
        tags: [], explanation: `Order for large n: log n < n < n log n < n² < 2ⁿ. Binary search survives on how slowly log n climbs — doubling n adds one step.`,
        difficulty: 0.45,
      };
    }
    return {
      prompt: `Put these in order from slowest- to fastest-growing: n log n, n², n`,
      correct: "n, then n log n, then n²",
      wrongs: ["n log n, then n, then n²", "n², then n log n, then n", "n, then n², then n log n"] as [string, string, string],
      tags: [], explanation: `Multiply n by log n and it outgrows plain n; multiply n by n and you get n². Each factor that grows with n pushes the curve up an order: n < n log n < n².`,
      difficulty: 0.5,
    };
  },
  "binary-data": (r) => {
    const bits = r.shuffle([1, 0, 1, 0, 1, 1, 0, 0]);
    const val = bits.reduce((s, b) => s * 2 + b, 0);
    return {
      prompt: `What denary value is the byte ${bits.join("")}?`,
      correct: String(val),
      wrongs: [String(val + 1), String(255 - val), String(bits.filter(Boolean).length)] as [string, string, string],
      tags: [], explanation: `Place values 128, 64, 32, 16, 8, 4, 2, 1: sum where bits are 1 → ${val}. 8 bits = 1 byte = 0–255.`,
      difficulty: 0.4,
    };
  },
  "networks": (r) => {
    return {
      prompt: `What does DNS do?`,
      correct: "Translates domain names into IP addresses",
      wrongs: ["Encrypts your traffic", "Compresses web pages", "Stores your passwords"] as [string, string, string],
      tags: [], explanation: `DNS is the internet's phonebook: example.com → 93.184.216.34. Without it you'd memorise numbers; HTTPS then encrypts what DNS helps you reach.`,
      difficulty: 0.35,
    };
  },
  "cybersecurity": (r) => {
    return {
      prompt: `Why store passwords HASHED, not encrypted?`,
      correct: "Hashing is one-way — even a stolen database can't reveal passwords",
      wrongs: ["Hashing is faster to type", "Encryption is illegal", "Hashes are shorter"] as [string, string, string],
      tags: [], explanation: `Encryption is reversible with the key — steal the key, read every password. A hash can't be reversed: on login, hash the attempt and compare. (Plus a salt, always.)`,
      difficulty: 0.5,
    };
  },
  "databases-sql": (r) => {
    return {
      prompt: `Which SQL fetches names of students with grade above 80?`,
      correct: "SELECT name FROM students WHERE grade > 80",
      wrongs: ["GET name FROM students IF grade > 80", "SELECT * WHERE grade > 80 FROM students", "SELECT name WHERE students.grade = 80"] as [string, string, string],
      tags: [], explanation: `SQL grammar: SELECT columns FROM table WHERE condition. SELECT * returns ALL columns — rarely what you want in production.`,
      difficulty: 0.4,
    };
  },
  "web-stack": (r) => {
    return {
      prompt: `Which technology controls the LAYOUT and colours of a web page?`,
      correct: "CSS",
      wrongs: ["HTML", "JavaScript", "SQL"] as [string, string, string],
      tags: [], explanation: `HTML = structure (what it is), CSS = presentation (how it looks), JavaScript = behaviour (what it does). SQL lives on the server with the database.`,
      difficulty: 0.25,
    };
  },
  "ai-basics": (r) => {
    return {
      prompt: `Machine learning differs from classical programming because…`,
      correct: "Rules are LEARNED from data, not hand-written",
      wrongs: ["It needs no data", "It always uses neural networks", "It cannot make mistakes"] as [string, string, string],
      tags: [], explanation: `Classical: rules + data → answers. ML: data + answers → rules. The model infers the pattern — which is why data quality caps everything.`,
      difficulty: 0.4,
    };
  },
  "statistics-data": (r) => {
    const data = r.shuffle([2, 4, 4, 5, 6, 7, 8, 9, 45]).slice(0, 7);
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const mean = +(data.reduce((s, x) => s + x, 0) / data.length).toFixed(1);
    return {
      prompt: `Data: ${data.join(", ")}. Which average best represents it?`,
      correct: `The median (${median})`,
      wrongs: [`The mean (${mean})`, "The mode", "The range"] as [string, string, string],
      tags: ["outlier-mean"], explanation: `The outlier (${sorted[sorted.length - 1]}) drags the mean to ${mean}, above every value but one. The median (${median}) resists outliers — skew demands median.`,
      difficulty: 0.45,
    };
  },
};

// ── Late additions: the nine concepts that previously shipped without a
// generator ("Practise" dead-ended). Variable per seed, house style, and
// honest difficulty — matching the lesson text they test.
type XY = { x: number; y: number };
const fmt = (n: number) => (n < 0 ? `−${-n}` : `${n}`);
const sup = (n: number) => String(n).split("").map((d) => ("⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)] ?? d)).join("");

const LATE_GENS: Record<string, RawGen> = {
  "coordinates": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const p: XY = { x: r.nz(-6, 6), y: r.nz(-6, 6) };
      return {
        prompt: `A point has x-coordinate ${fmt(p.x)} and y-coordinate ${fmt(p.y)}. Which is its coordinate pair?`,
        correct: `(${fmt(p.x)}, ${fmt(p.y)})`,
        wrongs: [`(${fmt(p.y)}, ${fmt(p.x)})`, `(${fmt(-p.x)}, ${fmt(p.y)})`, `(${fmt(p.x)}, ${fmt(-p.y)})`, `(${fmt(-p.x)}, ${fmt(-p.y)})`],
        tags: [], explanation: `Order is alphabetical: (x, y). The x-coordinate counts steps right (positive) or left (negative); the y-coordinate counts steps up or down. Swapping the pair walks to a different point.`,
        difficulty: 0.15,
      };
    }
    if (v === 1) {
      const p: XY = { x: r.nz(-5, 5), y: r.nz(-5, 5) };
      const d2 = p.x * p.x + p.y * p.y;
      const d = Math.sqrt(d2);
      const whole = Number.isInteger(d);
      return {
        prompt: `How far is the point (${fmt(p.x)}, ${fmt(p.y)}) from the origin (0, 0)?`,
        correct: whole ? String(d) : `√${d2}`,
        // Staircase (|x| + |y|, the classic "walk the grid" answer), d² (forgot
        // the root), |Δ| (subtracted instead of adding), and |x·y| — the last one
        // exists so (±1, ±1), where the staircase and d² coincide, still has
        // three distinct wrongs.
        wrongs: [String(Math.abs(p.x) + Math.abs(p.y)), String(d2), String(Math.abs(Math.abs(p.x) - Math.abs(p.y))), String(Math.abs(p.x * p.y))],
        tags: [], explanation: `Distance from the origin is Pythagoras: d = √(x² + y²) = √(${p.x}² + ${p.y}²)${whole ? ` = ${d}` : ` = √${d2}`}. Adding |x| + |y| measures the staircase walk, not the straight line.`,
        difficulty: 0.45,
      };
    }
    const onY = r.next() < 0.5;
    const other = r.nz(-6, 6);
    return {
      prompt: onY
        ? `The point (0, ${fmt(other)}) lies on which axis?`
        : `The point (${fmt(other)}, 0) lies on which axis?`,
      correct: onY ? "The y-axis" : "The x-axis",
      wrongs: [onY ? "The x-axis" : "The y-axis", "The origin", "Neither — it is off both axes"] as [string, string, string],
      tags: [], explanation: `x = 0 means zero steps right or left — the point sits on the vertical (y) axis. y = 0 puts it on the horizontal (x) axis. The origin (0, 0) is the only point on both.`,
      difficulty: 0.25,
    };
  },
  "sim-equations-quad": (r) => {
    const p = r.nz(-4, 4), q0 = r.nz(-4, 4);
    const q = q0 === p ? q0 + r.pick([-2, -1, 1, 2]) : q0;
    const m = p + q, c = r.int(-3, 5), d = c - p * q;
    const hi = Math.max(p, q), lo = Math.min(p, q);
    return {
      prompt: `The line y = ${fmt(m)}x ${d < 0 ? "−" : "+"} ${Math.abs(d)} meets the curve y = x² ${c < 0 ? "−" : "+"} ${Math.abs(c)}. What is the larger x-coordinate of their intersection points?`,
      correct: String(hi),
      wrongs: [String(lo), String(m), String(p * q)] as [string, string, string],
      tags: ["lost-root"], explanation: `Substitute the line into the curve: ${fmt(m)}x ${d < 0 ? "−" : "+"} ${Math.abs(d)} = x² ${c < 0 ? "−" : "+"} ${Math.abs(c)} → x² − ${fmt(m)}x ${p * q < 0 ? "−" : "+"} ${Math.abs(p * q)} = 0 → (x ${lo < 0 ? "+" : "−"} ${Math.abs(lo)})(x ${hi < 0 ? "+" : "−"} ${Math.abs(hi)}) = 0 → x = ${lo} or ${hi}. The larger is ${hi}.`,
      difficulty: 0.6,
    };
  },
  "transformations": (r) => {
    const v = r.int(0, 2);
    const p: XY = { x: r.nz(-6, 6), y: r.nz(-6, 6) };
    if (v === 0) {
      const axis = r.next() < 0.5 ? "x" : "y";
      const land = axis === "x" ? { x: p.x, y: -p.y } : { x: -p.x, y: p.y };
      return {
        prompt: `The point (${fmt(p.x)}, ${fmt(p.y)}) is reflected in the ${axis}-axis. Where does it land?`,
        correct: `(${fmt(land.x)}, ${fmt(land.y)})`,
        wrongs: [`(${fmt(-land.x)}, ${fmt(land.y)})`, `(${fmt(land.y)}, ${fmt(land.x)})`, `(${fmt(-p.x)}, ${fmt(-p.y)})`, `(${fmt(p.x)}, ${fmt(p.y)})`],
        tags: [], explanation: `Reflection in the ${axis}-axis flips the ${axis === "x" ? "y" : "x"}-coordinate's sign only — distance to the mirror line is preserved on the other side. The other coordinate is untouched.`,
        difficulty: 0.3,
      };
    }
    if (v === 1) {
      const t: XY = { x: r.nz(-5, 5), y: r.nz(-5, 5) };
      const land = { x: p.x + t.x, y: p.y + t.y };
      return {
        prompt: `The point (${fmt(p.x)}, ${fmt(p.y)}) is translated by the vector (${fmt(t.x)}, ${fmt(t.y)}). Where does it land?`,
        correct: `(${fmt(land.x)}, ${fmt(land.y)})`,
        wrongs: [`(${fmt(t.x)}, ${fmt(t.y)})`, `(${fmt(land.y)}, ${fmt(land.x)})`, `(${fmt(p.x - t.x)}, ${fmt(p.y - t.y)})`] as [string, string, string],
        tags: [], explanation: `Translation adds the vector: new x = ${fmt(p.x)} ${t.x < 0 ? "−" : "+"} ${Math.abs(t.x)} = ${fmt(land.x)}, new y = ${fmt(p.y)} ${t.y < 0 ? "−" : "+"} ${Math.abs(t.y)} = ${fmt(land.y)}. Every point of the shape moves the same way — the shape only slides.`,
        difficulty: 0.35,
      };
    }
    const k = r.pick([2, 3, -1, -2]);
    const land = { x: p.x * k, y: p.y * k };
    return {
      prompt: `A vertex at (${fmt(p.x)}, ${fmt(p.y)}) is enlarged by scale factor ${fmt(k)} about the origin. Where does it move to?`,
      correct: `(${fmt(land.x)}, ${fmt(land.y)})`,
      wrongs: [`(${fmt(p.x + k)}, ${fmt(p.y + k)})`, `(${fmt(k)}, ${fmt(k)})`, `(${fmt(Math.round(p.x / k))}, ${fmt(Math.round(p.y / k))})`] as [string, string, string],
      tags: ["sf-area"], explanation: `Enlargement multiplies both coordinates by the scale factor from the centre: (${fmt(p.x)}, ${fmt(p.y)}) × ${fmt(k)} = (${fmt(land.x)}, ${fmt(land.y)}). A negative k also rotates 180° about the centre.`,
      difficulty: 0.45,
    };
  },
  "logs": (r) => {
    if (r.next() < 0.55) {
      const b = r.pick([2, 3, 5]), n = r.int(2, 5);
      return {
        prompt: `log${fmt(b)} ${fmt(Math.pow(b, n))} = ?`,
        correct: String(n),
        wrongs: [String(n + 1), String(n - 1), String(Math.pow(b, n))] as [string, string, string],
        tags: [], explanation: `log${fmt(b)} ${fmt(Math.pow(b, n))} asks: ${fmt(b)} to what power gives ${fmt(Math.pow(b, n))}? Since ${fmt(b)}${sup(n)} = ${fmt(Math.pow(b, n))}, the answer is ${n}. Logs invert exponentials.`,
        difficulty: 0.4,
      };
    }
    const pair = r.pick([[4, 25], [2, 50], [5, 20]]);
    return {
      prompt: `Without a calculator: log ${pair[0]} + log ${pair[1]} = ?`,
      correct: "2",
      wrongs: [`log ${pair[0] + pair[1]}`, String(pair[0] * pair[1]), `log ${pair[0] * pair[1]} − 100`] as [string, string, string],
      tags: [], explanation: `The product law: log a + log b = log(ab). Here log ${pair[0]} + log ${pair[1]} = log ${pair[0] * pair[1]} = log 100 = 2 (base 10: 10² = 100). Adding arguments is the classic slip.`,
      difficulty: 0.55,
    };
  },
  "loci-constructions": (r) => {
    const v = r.int(0, 3);
    if (v === 0) return {
      prompt: `A goat is tethered by a 5 m rope to a post. Which shape shows everywhere the goat can reach?`,
      correct: "A circle of radius 5 m centred on the post",
      wrongs: ["A line 5 m from the post", "The interior of a 5 m square around the post", "A circle of radius 10 m centred on the post"] as [string, string, string],
      tags: [], explanation: `Fixed distance from a fixed point: every reachable point is exactly 5 m away — that locus is a circle of radius 5 m centred on the post. Inside it the rope would be slack, not taut.`,
      difficulty: 0.35,
    };
    if (v === 1) return {
      prompt: `Points equidistant from two fixed points A and B lie on...`,
      correct: "the perpendicular bisector of AB",
      wrongs: ["the line AB itself", "a circle through A and B", "the angle bisector at A"] as [string, string, string],
      tags: [], explanation: `Equal distance from both ends is the definition of the perpendicular bisector — it cuts AB in half at 90°. Compasses construct it as two equal arcs crossing.`,
      difficulty: 0.4,
    };
    if (v === 2) return {
      prompt: `Points equidistant from two straight roads that cross lie on...`,
      correct: "the angle bisectors of the roads",
      wrongs: ["the perpendicular bisector of the roads", "a circle centred where they cross", "a line parallel to one road"] as [string, string, string],
      tags: [], explanation: `Equal distance from two lines means equal perpendicular distance to each — that locus is the pair of angle bisectors. Bisect the angle where the roads cross with compasses.`,
      difficulty: 0.45,
    };
    return {
      prompt: `A fence must be built no more than 3 m from a straight hedge. Which region shows where the fence may go?`,
      correct: "A strip of width 3 m running along the hedge",
      wrongs: ["A circle of radius 3 m", "A line exactly 3 m from the hedge", "A 3 m × 3 m square at each end"] as [string, string, string],
      tags: [], explanation: `"Within 3 m of a line" is a band: every point up to 3 m perpendicular distance. Combined loci like this (with, say, 10 m from a well) carve real site plans into allowed regions.`,
      difficulty: 0.5,
    };
  },
  "bearings": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const b = r.pick([30, 70, 120, 205, 310]);
      const back = (b + 180) % 360;
      return {
        prompt: `A ship leaves port on a bearing of ${String(b).padStart(3, "0")}°. On what bearing does it sail back to port?`,
        correct: `${String(back).padStart(3, "0")}°`,
        wrongs: [`${String(b).padStart(3, "0")}°`, `${String((b + 90) % 360).padStart(3, "0")}°`, `${String((360 - b) % 360).padStart(3, "0")}°`] as [string, string, string],
        tags: [], explanation: `A there-and-back journey flips the bearing by 180°: ${String(b).padStart(3, "0")}° ${b + 180 >= 360 ? "−" : "+"} 180° = ${String(back).padStart(3, "0")}°. North still points the same way, but you now face the opposite direction.`,
        difficulty: 0.4,
      };
    }
    if (v === 1) return {
      prompt: `Which of these is a correctly written three-figure bearing?`,
      correct: "045°",
      wrongs: ["45°", "45° east of north", "N45°E"] as [string, string, string],
      tags: [], explanation: `Bearings are measured clockwise from north and always written as three digits: 045°, not 45°. The leading zero is the convention that prevents misreading at sea.`,
      difficulty: 0.25,
    };
    return {
      prompt: `South-east as a three-figure bearing is:`,
      correct: "135°",
      wrongs: ["045°", "225°", "315°"] as [string, string, string],
      tags: [], explanation: `Compass points are 45° apart clockwise from north: NE 045°, SE 135°, SW 225°, NW 315°. South-east is 90° (south) + 45° (east of south) = 135°.`,
      difficulty: 0.35,
    };
  },
  "em-induction": (r) => {
    const v = r.int(0, 2);
    if (v === 0) return {
      prompt: `Which change increases the voltage induced in a coil by a moving magnet?`,
      correct: "Moving the magnet into the coil faster",
      wrongs: ["Holding the magnet still inside the coil", "Using a weaker magnet", "Reducing the number of turns on the coil"] as [string, string, string],
      tags: ["motor-gen"], explanation: `Induced voltage grows with the RATE of change of flux: faster motion, stronger magnet, more turns. A still magnet has unchanging flux — nothing is induced, however close it sits.`,
      difficulty: 0.4,
    };
    if (v === 1) return {
      prompt: `Why will a transformer not work with a steady DC supply on the primary coil?`,
      correct: "The magnetic flux is unchanging, so nothing is induced in the secondary",
      wrongs: ["DC carries too little energy for a transformer", "The primary coil would overheat instantly", "DC reverses direction too often"] as [string, string, string],
      tags: ["motor-gen"], explanation: `Transformers need a CHANGING flux in the core. Steady DC gives constant flux — no change, no induced voltage in the secondary. AC constantly changes, which is why mains is AC.`,
      difficulty: 0.5,
    };
    return {
      prompt: `A wire is moved downwards through a magnetic field between two poles. What happens in the wire?`,
      correct: "A voltage is induced, which can drive a current",
      wrongs: ["The wire becomes permanently magnetised", "Nothing — fields only act on magnets", "The poles reverse their polarity"] as [string, string, string],
      tags: ["motor-gen"], explanation: `Movement + field = the generator effect: cutting field lines induces a voltage across the wire (Fleming's RIGHT-hand rule predicts its direction). Close the circuit and current flows.`,
      difficulty: 0.45,
    };
  },
  "metallic-bonding": (r) => {
    const v = r.int(0, 2);
    if (v === 0) return {
      prompt: `Why do metals conduct electricity so well?`,
      correct: "Delocalised electrons are free to move through the whole lattice",
      wrongs: ["Positive ions drift along the metal", "Electrons are transferred permanently between atoms", "Protons move through the lattice"] as [string, string, string],
      tags: [], explanation: `Metal atoms release outer electrons into a shared 'sea' that spans the crystal. These mobile charges drift when a voltage is applied — that current IS conduction. Ions stay fixed in place.`,
      difficulty: 0.35,
    };
    if (v === 1) return {
      prompt: `Why are alloys harder than the pure metals they contain?`,
      correct: "Different-sized atoms disrupt the layers, so they cannot slide easily",
      wrongs: ["Alloys contain fewer free electrons", "Covalent bonds replace the metallic bonds", "Alloy atoms are always heavier"] as [string, string, string],
      tags: [], explanation: `Pure metals bend because neat layers of same-sized ions slide over each other. Mixing in different-sized atoms jams the layers — that is why bronze and steel outperform pure copper and iron.`,
      difficulty: 0.45,
    };
    return {
      prompt: `Metals can be hammered into shape without shattering because...`,
      correct: "layers of positive ions can slide over each other while the electron sea holds the structure together",
      wrongs: ["the ionic bonds break and instantly reform", "the electrons push the layers apart", "metals have very low melting points"] as [string, string, string],
      tags: [], explanation: `The non-directional metallic bond is the key: after layers slide, the delocalised electrons still surround the shifted ions and bonding is restored. Ionic crystals shatter instead — like charges meet.`,
      difficulty: 0.4,
    };
  },
  "microscopy": (r) => {
    if (r.next() < 0.55) {
      const real = r.pick([5, 10, 20, 50]), mag = r.pick([100, 200, 400, 1000]);
      return {
        prompt: `A cell ${real} μm wide is viewed at ×${mag} magnification. How wide does it appear?`,
        correct: `${real * mag} μm`,
        wrongs: [`${Math.round((real / mag) * 1e6) / 1e3} μm`, `${real + mag} μm`, `${real * (mag / 10)} μm`, `${real * mag * 10} μm`],
        tags: [], explanation: `Magnification = image size ÷ real size, so image = real × mag = ${real} μm × ${mag} = ${real * mag} μm. Dividing instead of multiplying is the classic slip — check the image is BIGGER than the object.`,
        difficulty: 0.4,
      };
    }
    return {
      prompt: `A microscope's RESOLUTION is its ability to...`,
      correct: "show two close points as two separate points",
      wrongs: ["make an image look bigger", "keep a moving specimen in focus", "show only surface detail"] as [string, string, string],
      tags: [], explanation: `Resolution is distinguishing detail: the minimum separation at which two points still look like two. Electron microscopes win because their wavelength is far shorter than light's — more resolution, not just more magnification.`,
      difficulty: 0.35,
    };
  },
};

const BASE_GENS: Record<string, RawGen> = { ...MATHS_GENS, ...SCI_GENS, ...LATE_GENS };

/** Every concept's generator, with the depth layer composed on wherever one
 *  exists. Concepts with no deep family keep their original generator exactly:
 *  this file added depth, it did not rewrite the bank. */
const ALL_GENS: Record<string, RawGen> = Object.fromEntries(
  Object.entries(BASE_GENS).map(([id, base]) => [id, DEEP_GENS[id] ? withDepth(base, DEEP_GENS[id]) : base]),
);

/** Concepts whose practice range now reaches the deep bands — exported so a
 *  test can assert the depth is where it claims to be, per concept. */
export const DEPTH_CONCEPT_IDS: string[] = Object.keys(DEEP_GENS).filter((id) => id in BASE_GENS);

/**
 * Generator classes:
 * - "variable": parameters are drawn per seed → fresh questions forever.
 * - "designed": a fixed, carefully-authored template (constant output); it
 *   functions as an evergreen assessment item. The diagnostic sampler skips
 *   these so no student ever sees a repeated item in one session.
 */
// Generators with exactly one question. The maths ones that used to live here
// have been parameterised (the audit showed they asked the identical question
// forever), so what remains is genuinely single-item concept material plus the
// science and computing items still awaiting variant families.
const CONSTANT_GENS = new Set([
  // The physics concepts that gained depth families (forces-basics,
  // motion-graphs, radioactivity) are NOT in this set any more: each now draws
  // from a family of variants as well as its authored item, and a concept
  // declared "designed/stable" that returns different prompts each draw would
  // make the declaration a lie — which is exactly what the sweep checks.
  //
  // The biology set (cells, enzymes, photosynthesis, respiration, digestion,
  // circulation) has since joined them: each now composes a variant family from
  // lib/questions-deep.ts and is swept by the same contract.
  //
  // The computing set (what-is-code, dictionaries, algorithms, recursion,
  // complexity, networks, databases-sql, cybersecurity, web-stack, ai-basics)
  // joined most recently — training-vs-inference, data-quality and
  // query-reading variants — and left this set for the same reason.
  "iteration",
  "loci-constructions",
  "light-optics", "sound-acoustics", "magnetism", "thermal-physics",
  "gravity-fields", "astrophysics", "compounds-mixtures", "periodic-table",
  "electron-shells", "covalent-bonding", "equations-stoich",
  "energy-changes", "acids-bases", "electrolysis", "organic-intro", "equilibria", "analysis-tests",
  "breathing-gas", "nervous-system", "hormones", "evolution", "ecosystems", "biodiversity",
  "immune-health",
]);

export function isVariableGen(conceptId: string): boolean {
  return !CONSTANT_GENS.has(conceptId);
}

// ── Public API ──────────────────────────────────────────────────────────────

const FALLBACK_WRONGS = [
  "None of these",
  "Cannot be determined from the information given",
  "Not enough information",
];

export function generateQuestion(conceptId: string, seed: string): Question | null {
  const gen = ALL_GENS[conceptId];
  if (!gen) return null;
  const r = new Rng(hashSeed(`${conceptId}:${seed}`));
  const q = gen(r);
  // Assemble choices: correct + 3 unique wrongs.
  //
  // Generators do collide (three digits all equal, p === q in a quadratic), and
  // the old code papered over it with "None of these" / "Cannot be determined"
  // — 43 of 135 generators did this, which reads as a broken question. Fill
  // from plausible near-misses instead, and keep the notational filler strictly
  // as a last resort for answers that are not numbers at all.
  const uniq: string[] = [q.correct];
  for (const w of q.wrongs) if (!uniq.includes(w)) uniq.push(w);

  const num = Number(q.correct);
  const numeric = Number.isFinite(num) && !/[√π^]/.test(q.correct);
  if (numeric) {
    const scale = Math.max(1, Math.abs(num));
    for (let step = 1; uniq.length < 4 && step <= 20; step++) {
      for (const cand of [num + step, num - step, num + step * 10]) {
        if (uniq.length >= 4) break;
        const rounded = Number(cand.toFixed(4));
        const s = String(rounded);
        if (!uniq.includes(s) && rounded >= 0 && rounded <= scale * 100) uniq.push(s);
      }
    }
  }
  // Structured answers the numeric padder above cannot touch. Venues that ask
  // for a fraction or a coordinate pair must be padded *in that form*: offering
  // "Not enough information" next to (−2, −1) is not a distractor a student can
  // confuse with the answer, so it teaches nothing. Perturb the parts instead.
  //
  // The perturbations below are mutually distinct by construction, and only one
  // of them can ever equal the answer, so at most three can be dropped and the
  // four-option contract still holds.
  if (uniq.length < 4) {
    const neg = q.correct.includes("−") ? "−" : "-";
    const plain = q.correct.replace(/−/g, "-");
    const signed = (n: number) => (n < 0 ? `${neg}${Math.abs(n)}` : String(n));
    const frac = plain.match(/^(\d+)\/(\d+)$/);
    if (frac) {
      const a = Number(frac[1]);
      const b = Number(frac[2]);
      // Same denominator, wrong numerator (missed the cancellation / added
      // wrongly); same numerator, denominator off by one (cancelled too much).
      for (const cand of [`${a + 1}/${b}`, `${a + 2}/${b}`, `${a}/${b + 1}`, `${a + 1}/${b + 1}`]) {
        if (uniq.length >= 4) break;
        if (!uniq.includes(cand)) uniq.push(cand);
      }
    }
    const pair = plain.match(/^\((-?[\d.]+), (-?[\d.]+)\)$/);
    if (pair && uniq.length < 4) {
      const x = Number(pair[1]);
      const y = Number(pair[2]);
      const fmtPair = (px: number, py: number) => `(${signed(px)}, ${signed(py)})`;
      // One component shifted (a sign or component slip), both shifted, and the
      // sign-flip that a translation/negation misreading produces.
      for (const cand of [
        fmtPair(x + 1, y),
        fmtPair(x, y + 1),
        fmtPair(x + 1, y + 1),
        fmtPair(-x, -y),
      ]) {
        if (uniq.length >= 4) break;
        if (!uniq.includes(cand)) uniq.push(cand);
      }
    }
  }
  for (const f of FALLBACK_WRONGS) {
    if (uniq.length >= 4) break;
    if (!uniq.includes(f)) uniq.push(f);
  }
  while (uniq.length < 4) uniq.push(`Option ${uniq.length + 1}`);
  const choices = r.shuffle(uniq.slice(0, 4));
  const answer = choices.indexOf(q.correct);
  return {
    id: `${conceptId}:${seed}`,
    conceptId,
    difficulty: q.difficulty,
    prompt: q.prompt,
    choices,
    answer: answer >= 0 ? answer : 0,
    explanation: q.explanation,
    misconceptionTags: q.tags,
  };
}

/** Serve the draw whose difficulty is CLOSEST to a curriculum tier's band.
 *
 *  `generateQuestionAt` (below) finds draws at or above a floor — the right
 *  semantics for transfer, where the challenge must be harder by construction.
 *  It is the wrong semantics for a curriculum tier: a GCSE Foundation student
 *  targeting 0.45 on a concept whose generator spans 0.30–0.50 would be served
 *  the 0.50 draw, i.e. the hardest work available, because "≥ 0.45" is
 *  satisfied by the top of the range. A tier is a target, not a floor.
 *
 *  So search seeds and keep the best draw, where "best" means the target's own
 *  demand BAND first and the nearest difficulty inside it second. That second
 *  term matters: several generators produce a cluster of difficulties that
 *  straddles a band boundary (a concept whose items sit at 0.58 and 0.62 has
 *  work on both sides of it), and pure nearest-difficulty picks between them by
 *  luck — so the SAME fresh learner, aimed at the same tier, can be served band
 *  3 on one draw and band 4 on the next. Reading the band first makes the tier
 *  the thing that decides, and the difficulty the tie-break inside it.
 *  Reasoning is deliberately not a difficulty order away from the band: an
 *  out-of-band candidate costs a full point, far more than any in-band gap can.
 *
 *  Where a generator cannot reach a tier's band at all, no draw can match, and
 *  the closest difficulty wins (ties break toward the easier item — the honest
 *  direction when the bank is coarser than the curriculum). The question's true
 *  difficulty rides along, so the surface never claims work the item is not;
 *  the depth lever is then the concept set the specification selects. */
export function generateQuestionNear(conceptId: string, seed: string, target: number, attempts = 4): Question | null {
  const wantBand = difficultyBandFor(target);
  let best: Question | null = null;
  let bestKey = Infinity;
  for (let i = 0; i < Math.max(1, attempts); i++) {
    const q = generateQuestion(conceptId, `${seed}:n${i}`);
    if (!q) return null;
    const gap = q.difficulty - target;
    const inBand = difficultyBandFor(q.difficulty) === wantBand;
    // Band match dominates (a full point); inside a band the nearest wins, with
    // a hairline preference for the easier side of an exact tie.
    const key = (inBand ? 0 : 1) + Math.abs(gap) + (gap > 0 ? 1e-6 : 0);
    if (key < bestKey) { bestKey = key; best = q; }
  }
  return best;
}

/** Serve a question that actually meets a difficulty target.
 *
 *  `generateQuestion` samples a generator's full difficulty range — which is
 *  the right default for practice, but wrong when the caller has promised a
 *  harder question (the diagnostic ladder, transfer). Rewriting 120+
 *  generators to take difficulty parameters is not needed: generators are
 *  deterministic in the seed, so we search seeds until the drawn question's
 *  self-declared difficulty meets the target. Bounded, offline, and honest —
 *  if the generator cannot reach the band, the best draw wins and the caller
 *  sees the true difficulty (no fake claims).
 *
 *  `attempt` varies the seed so the search space differs per call.
 *
 *  ── Why the search does not stop at one seed family ──────────────────────
 *  The first version searched twelve draws from the caller's own seed and
 *  returned the best of those when none reached the target. That made the
 *  served difficulty a LOTTERY: a concept whose items are {0.20, 0.25, 0.30}
 *  missed its own 0.30 draw in ~1% of searches, so a ladder stage that had
 *  promised a harder question silently served an easier one, and two things
 *  downstream were wrong in ways nobody could reproduce:
 *
 *    · the diagnostic's per-band report could end a full sitting with a band
 *      the course CAN express unmeasured — a gap that is an artefact of the
 *      draw, not a fact about the learner;
 *    · a band-first serve could return an item from the band BELOW the one it
 *      was aiming at while believing it had not.
 *
 *  The generator is deterministic in its seed, so the honest search is the one
 *  that knows what the concept can reach. `conceptDepth` has already measured
 *  the ceiling from the `depth:i` seed family (memoised, a property of the
 *  code), so this function targets `min(target, ceiling)` — never asking for
 *  more than the generator can give, which is what made the old fallback a
 *  lottery — and widens into that same measured `depth:i` family when the
 *  caller's family cannot reach it. The result is deterministic per
 *  (session, concept, slot) and can no longer disagree with the ceiling that
 *  caps the learner's claim.
 */
export function generateQuestionAt(
  conceptId: string,
  seed: string,
  minDifficulty: number,
  attempt = 0,
  exclude?: ReadonlySet<string>,
): Question | null {
  const ceiling = conceptDepth(conceptId);
  const want = Math.min(minDifficulty, ceiling);
  // Aim by DEMAND, not only by number. `skillForDifficulty` is the classifier
  // the diagnostic's per-band report buckets answers with, so a ladder stage
  // that means "application" must serve an item THAT report will call
  // application — a 0.31 draw is inside band 2 but below the application floor,
  // and serving it would leave the band unmeasured while the ladder believed it
  // had tested it.
  const wantSkill = skillForDifficulty(want);
  let best: Question | null = null;
  let bestKey = Infinity;
  for (const family of [`${seed}:${attempt}`, "depth"]) {
    for (let i = 0; i < 24; i++) {
      const q = generateQuestion(conceptId, family === "depth" ? `depth:${i}` : `${family}:${i}`);
      if (!q) return null;
      // An item this sitting has ALREADY served is not a candidate. The
      // diagnostic pools are single-use by design, and the ranking below is a
      // pure function of (target, candidates) — so without this, a band whose
      // demanded skill the concept cannot express (no rank-0 item at all)
      // makes the "nearest above" the winner on EVERY attempt, the caller's
      // retry loop sees the same question six times, closes the concept as
      // "generator run dry" and truncates the ladder at whatever band it
      // happened to be on. Excluding the spent item lets those six attempts do
      // what they were written for: find the next-best item instead of the
      // same one.
      if (exclude?.has(`${q.prompt}|${q.choices[q.answer]}`)) continue;
      const skill = skillForDifficulty(q.difficulty);
      const rank = skill === wantSkill ? 0 : SKILL_RANK[skill] > SKILL_RANK[wantSkill] ? 1 : 2;
      // In-demand wins; then the nearest draw above it; then the nearest below
      // (the generator cannot express this demand on this concept). Distance
      // only breaks ties inside a rank, so the aim can never be lost to a
      // hairline difference.
      const key = rank + Math.abs(q.difficulty - want) / 100;
      if (key < bestKey) { bestKey = key; best = q; }
      if (rank === 0 && Math.abs(q.difficulty - want) < 0.02) return q;
    }
  }
  return best;
}

/** Ladder position of each demand level, so "above" and "below" mean the same
 *  thing to the serve as they do to the report. */
const SKILL_RANK: Record<string, number> = { recall: 0, application: 1, multi_step: 2, data_interpretation: 3, extended_response: 4 };

/** A question as the client may see it *before* grading: the answer index,
 *  explanation, and misconception tags are stripped. Server-side grading is
 *  the point of the architecture — leaking the answer would make "practice"
 *  a multiple-choice cheat sheet, and the tags are the grader's own
 *  discriminators, not learner-facing data. */
export type QuestionView = Omit<Question, "answer" | "explanation" | "misconceptionTags">;

/** Strip grader-only fields. When a language is supplied, maths command-stem
 *  prompts are localized ("Work out" → "Calcula" …) — bodies keep their
 *  numbers/notation verbatim. */
export function serveView(q: Question, lang?: string, board?: BoardId): QuestionView {
  const { answer: _a, explanation: _e, misconceptionTags: _m, ...view } = q;
  if (lang && lang !== "en") {
    view.prompt = localizeStem(view.prompt, lang);
  } else if (board) {
    // The student's own curriculum vocabulary (§4): "gradient" → "slope" for a
    // Common Core student, "BIDMAS" → "BODMAS" for CBSE. Only for English
    // delivery — a translated stem is already in the student's language.
    view.prompt = applyTerminology(view.prompt, board);
  }
  return view;
}

/** How deep a concept's generator can actually go.
 *
 *  Every generator declares its own difficulty per draw, and the declared
 *  ranges differ wildly across the bank: some concepts can only ever emit
 *  recall-level items, a handful reach multi-step, and (measured, not assumed)
 *  none reaches data interpretation. Anything that plans a difficulty ladder —
 *  the diagnostic, the blueprint, a future past-paper sampler — therefore has
 *  to ASK this question rather than assume every concept can express every
 *  band. A diagnostic that assumes otherwise reports a demand level as "not
 *  measured" for every learner forever, which is a sampling bug wearing the
 *  costume of a fact about the learner.
 *
 *  Deterministic (a fixed seed sweep) and memoised: this is a property of the
 *  code, not of a student. */
const DEPTH_SEEDS = 24;
const depthCache = new Map<string, number>();

export function conceptDepth(conceptId: string): number {
  const cached = depthCache.get(conceptId);
  if (cached !== undefined) return cached;
  let max = 0;
  for (let i = 0; i < DEPTH_SEEDS; i++) {
    const q = generateQuestion(conceptId, `depth:${i}`);
    if (!q) break;
    if (q.difficulty > max) max = q.difficulty;
  }
  depthCache.set(conceptId, max);
  return max;
}

/** The deepest question the bank can serve across `conceptIds` — the honest
 *  answer to "which demand levels can this platform measure at all?". */
export function bankDepth(conceptIds: readonly string[]): number {
  let max = 0;
  for (const id of conceptIds) max = Math.max(max, conceptDepth(id));
  return max;
}

/** Concepts that have dedicated question generators (evergreen practice pool). */
export const GENERATED_CONCEPT_IDS = Object.keys(ALL_GENS);

export function hasGenerator(conceptId: string): boolean {
  return conceptId in ALL_GENS;
}

export function generatorSubject(conceptId: string): SubjectId | null {
  if (conceptId in MATHS_GENS) return "maths";
  if (conceptId in SCI_GENS) {
    const sci: Record<string, SubjectId> = {
      "forces-basics": "physics", "motion-graphs": "physics", "newton-laws": "physics", "momentum": "physics",
      "energy-conservation": "physics", "work-power": "physics", "waves-basics": "physics", "light-optics": "physics",
      "sound-acoustics": "physics", "electricity-circuits": "physics", "magnetism": "physics", "thermal-physics": "physics",
      "pressure-fluids": "physics", "radioactivity": "physics", "gravity-fields": "physics", "atoms-nucleus": "physics", "astrophysics": "physics",
      "atoms-elements": "chemistry", "compounds-mixtures": "chemistry", "periodic-table": "chemistry", "electron-shells": "chemistry",
      "ionic-bonding": "chemistry", "covalent-bonding": "chemistry", "moles-calcs": "chemistry", "equations-stoich": "chemistry",
      "rates-reaction": "chemistry", "energy-changes": "chemistry", "acids-bases": "chemistry", "electrolysis": "chemistry",
      "organic-intro": "chemistry", "equilibria": "chemistry", "analysis-tests": "chemistry",
      "cells": "biology", "enzymes": "biology", "digestion": "biology", "circulation": "biology", "breathing-gas": "biology",
      "diffusion": "biology", "photosynthesis": "biology", "respiration": "biology", "nervous-system": "biology", "hormones": "biology",
      "genetics": "biology", "evolution": "biology", "ecosystems": "biology", "biodiversity": "biology", "immune-health": "biology",
      "what-is-code": "computing", "variables": "computing", "conditionals": "computing", "loops": "computing", "lists-arrays": "computing",
      "functions-code": "computing", "dictionaries": "computing", "algorithms-search": "computing", "algorithms-sort": "computing",
      "recursion": "computing", "complexity": "computing", "binary-data": "computing", "networks": "computing", "cybersecurity": "computing",
      "databases-sql": "computing", "web-stack": "computing", "ai-basics": "computing", "statistics-data": "computing",
    };
    return sci[conceptId] ?? null;
  }
  return null;
}
