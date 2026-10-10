// ─────────────────────────────────────────────────────────────────────────────
// NUMERIC ITEMS — the questions the bank could not ask before, because every
// item it could build was four printed options.
//
// The audit measured the gap (§4.3): 68 of 135 concepts could not produce a
// numeric answer at all, so on those concepts a learner could only ever RECOGNISE
// a value among four strings and never PRODUCE one. Recognition and production
// are different achievements — the first is what a quiz measures, the second is
// what a mathematics or science course examines — and a bank that can only do
// the first overstates what it has measured about a learner.
//
// These families are AUTHORED, not generated from a template: each one asks a
// question a teacher would actually set, states the unit, and declares its own
// tolerance, because only the item knows whether 12 is exact or 12.0 is a
// measurement. Where a value is a count it is exact; where it is computed from a
// measurement the tolerance says so, and the explanation names the rounding the
// course expects rather than pretending the answer is precise.
//
// They compose onto the existing bank through the SAME `withDepth` machinery the
// deep and senior layers use (lib/questions.ts), so a concept gains an answer
// box without any surface, gate or diagnostic learning a second code path.
// ─────────────────────────────────────────────────────────────────────────────

import type { FigureSpec, NumericTolerance } from "./types";
// Type-only: the bank imports THIS module at runtime, so importing the RNG as a
// value here would be a cycle. Only the shape is needed.
import type { Rng } from "./questions";
import { CORE_NUMERIC_GENS } from "./numeric-items-core";

export interface NumericItem {
  prompt: string;
  /** The canonical answer, as a number. */
  value: number;
  /** How close a typed answer must be. Absent = exact. */
  tolerance?: NumericTolerance;
  /** Three plausible wrong values for the MCQ twin. Numbers are accepted and
   *  stringified by the composer — a distractor written as `a + b` is a
   *  number in the source and a display string on the page, and forcing every
   *  family to wrap it in String() would only add noise. */
  wrongs: Array<string | number>;
  tags: string[];
  explanation: string;
  difficulty: number;
  /** The diagram this item needs, when it needs one — carried through
   *  `numericRaw` unchanged, so an answer-box item draws the same figure its
   *  four-option twin does (lib/types.ts#FigureSpec). */
  figure?: FigureSpec;
}

export type NumericGen = (r: Rng) => NumericItem;

/** Exact-count tolerance: nothing, so the grader compares exactly. */
const EXACT: NumericTolerance | undefined = undefined;

const OPENING_GENS: Record<string, NumericGen> = {
  // ── MATHS ────────────────────────────────────────────────────────────────

  "standard-form": (r) => {
    // A power of ten is an integer a learner can state exactly.
    const v = r.int(0, 3);
    if (v === 0) {
      const n = r.pick([35000, 420000, 8100, 60700]);
      return {
        prompt: `Write ${n.toLocaleString("en-GB")} in standard form A × 10ⁿ. What is the value of n?`,
        value: String(n).length - 1, wrongs: [String(String(n).length), String(String(n).length - 2), "1"],
        tags: [], difficulty: 0.3,
        explanation: `${n} = ${Number(n).toExponential(1).replace("e+", " × 10^")}, so n = ${String(n).length - 1}: the decimal point moves ${String(n).length - 1} places to sit just after the first digit.`,
      };
    }
    if (v === 1) {
      const n = r.pick([0.00042, 0.0071, 0.000003, 0.025]);
      const e = Math.floor(Math.log10(n));
      return {
        prompt: `Write ${n} in standard form A × 10ⁿ. What is the value of n?`,
        value: e, wrongs: [String(-e), String(e + 1), String(e - 1)],
        tags: [], difficulty: 0.35,
        explanation: `For a number below 1, the power is negative. ${n} = ${n.toExponential(1).replace("e", " × 10^")}, so n = ${e}.`,
      };
    }
    if (v === 2) {
      const a = r.int(2, 9), b = r.int(2, 9), c = r.int(1, 5);
      return {
        prompt: `Work out (${a} × 10^${b}) × (${c} × 10^${c}), giving your answer as A × 10ⁿ. What is n?`,
        value: b + c, wrongs: [String(b * c), String(b + c + 1), String(b - c)],
        tags: [], difficulty: 0.5,
        explanation: `Multiply the A's and ADD the powers: 10^${b} × 10^${c} = 10^${b + c}. So n = ${b + c}.`,
      };
    }
    const m = r.int(2, 9);
    return {
      prompt: `A number is written as ${m} × 10^4. What is its value as an ordinary number?`,
      value: m * 10000, wrongs: [String(m * 1000), String(m * 100000), String(m * 40000)],
      tags: [], difficulty: 0.3,
      explanation: `× 10⁴ shifts the digits four places: ${m} × 10^4 = ${m * 10000}.`,
    };
  },

  "algebra-expressions": (r) => {
    const v = r.int(0, 2);
    const x = r.int(2, 9), y = r.int(2, 9);
    if (v === 0) {
      const a = r.int(2, 6), b = r.int(2, 6);
      return {
        prompt: `Evaluate ${a}x + ${b}y when x = ${x} and y = ${y}.`,
        value: a * x + b * y, wrongs: [String(a * x + b * y + 2), String(a * x - b * y), String((a + b) * (x + y))],
        tags: ["like-terms"], difficulty: 0.35,
        explanation: `Substitute, keeping the multiplication: ${a}(${x}) + ${b}(${y}) = ${a * x} + ${b * y} = ${a * x + b * y}.`,
      };
    }
    if (v === 1) {
      const a = r.int(2, 6), b = r.int(2, 5);
      return {
        prompt: `Evaluate ${a}x² − ${b}x when x = ${x}.`,
        value: a * x * x - b * x, wrongs: [String(a * x * x - b), String((a * x - b) * (a * x - b)), String(a * x * 2 - b * x)],
        tags: ["like-terms"], difficulty: 0.45,
        explanation: `Square first, then multiply: ${a}(${x}²) = ${a * x * x}, minus ${b}(${x}) = ${b * x}. So ${a * x * x} − ${b * x} = ${a * x * x - b * x}.`,
      };
    }
    const k = r.int(2, 5), a = r.int(2, 6);
    return {
      prompt: `A rectangle has length ${a}w and width ${k}w. What is its area when w = ${x}?`,
      value: a * k * x * x, wrongs: [String(a * k * x), String((a + k) * x), String(a * k * x * x + k)],
      tags: ["like-terms"], difficulty: 0.5,
      explanation: `Area = ${a}w × ${k}w = ${a * k}w². With w = ${x}: ${a * k}(${x}²) = ${a * k * x * x}.`,
    };
  },

  "algebra-expand": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const p = r.int(2, 7), q = r.int(2, 7);
      return {
        prompt: `Expand (x + ${p})(x + ${q}). The result is x² + bx + c. What is the value of b?`,
        value: p + q, wrongs: [String(p * q), String(p + q + 1), String(Math.abs(p - q))],
        tags: ["sign-slip"], difficulty: 0.45,
        explanation: `The x-terms are ${p}x + ${q}x = ${p + q}x, so b = ${p + q}. (And c = ${p} × ${q} = ${p * q}.)`,
      };
    }
    if (v === 1) {
      const p = r.int(2, 8), q = r.int(2, 8);
      return {
        prompt: `Expand (x − ${p})(x + ${q}). The result is x² + bx + c. What is the value of c?`,
        value: -p * q, wrongs: [String(p * q), String(q - p), String(-(p + q))],
        tags: ["sign-slip"], difficulty: 0.5,
        explanation: `The constants multiply with their signs: (−${p}) × (+${q}) = −${p * q}, so c = ${-p * q}.`,
      };
    }
    const a = r.int(2, 4), p = r.int(2, 6), q = r.int(2, 6);
    return {
      prompt: `Expand (${a}x + ${p})(x + ${q}). The result is ${a}x² + bx + c. What is the value of b?`,
      value: a * q + p, wrongs: [String(a * p + q), String(p * q), String(a * q - p)],
      tags: ["sign-slip"], difficulty: 0.6,
      explanation: `The x-terms come from ${a}x × ${q} and ${p} × x: ${a * q}x + ${p}x = ${a * q + p}x, so b = ${a * q + p}.`,
    };
  },

  "linear-equations": (r) => {
    const v = r.int(0, 3);
    if (v === 0) {
      const a = r.int(2, 7), x = r.int(2, 9), b = r.int(1, 9);
      return {
        prompt: `Solve ${a}x + ${b} = ${a * x + b}.`,
        value: x, wrongs: [String(x + 1), String(x - 1), String(Math.round((a * x + b) / a))],
        tags: ["bal-slip"], difficulty: 0.35,
        explanation: `Subtract ${b} from both sides: ${a}x = ${a * x}. Divide by ${a}: x = ${x}.`,
      };
    }
    if (v === 1) {
      const a = r.int(2, 6), x = r.int(2, 9), b = r.int(2, 9);
      return {
        prompt: `Solve ${a}x − ${b} = ${a * x - b}.`,
        value: x, wrongs: [String(x + 1), String(x - 1), String(Math.round((a * x - b) / a))],
        tags: ["bal-slip"], difficulty: 0.35,
        explanation: `Add ${b} to both sides: ${a}x = ${a * x}. Divide by ${a}: x = ${x}.`,
      };
    }
    if (v === 2) {
      const a = r.int(2, 5), b = r.int(1, 6), x = r.int(2, 8);
      // a·x + b = c·x + d with a − c = 2 and d chosen so the solution is x.
      const c = a - 2;
      const d = (a - c) * x + b;
      return {
        prompt: `Solve ${a}x + ${b} = ${c}x + ${d}.`,
        value: x, wrongs: [String(x + 1), String(x - 1), String(d - b)],
        tags: ["bal-slip"], difficulty: 0.55,
        explanation: `Collect the x's on one side: ${a - c}x = ${d - b}, so x = ${x}. Checking: ${a}(${x}) + ${b} = ${c}(${x}) + ${d}.`,
      };
    }
    const a = r.int(2, 6), b = r.int(1, 5), x = r.int(2, 8);
    return {
      prompt: `Solve ${a}(x + ${b}) = ${a * (x + b)}.`,
      value: x, wrongs: [String(x + b), String(x - b), String(Math.round(a * (x + b) / (a + b)))],
      tags: ["bal-slip"], difficulty: 0.5,
      explanation: `Divide both sides by ${a}: x + ${b} = ${x + b}, so x = ${x}. (Expanding first works too: ${a}x + ${a * b} = ${a * (x + b)}.)`,
    };
  },

  "inequalities": (r) => {
    const v = r.int(0, 1);
    const a = r.int(2, 6), b = r.int(1, 8), x = r.int(2, 8);
    if (v === 0) {
      return {
        prompt: `Solve ${a}x + ${b} > ${a * x + b}. What is the smallest whole number that works?`,
        value: x + 1, wrongs: [String(x), String(x - 1), String(x + 2)],
        tags: ["ineq-flip"], difficulty: 0.5,
        explanation: `Subtract ${b}: ${a}x > ${a * x}, so x > ${x}. The smallest whole number strictly greater than ${x} is ${x + 1} — ${x} itself does NOT satisfy a strict inequality.`,
      };
    }
    const n = r.int(2, 5);
    return {
      prompt: `Solve −${n}x < ${-n * x}. What is the smallest whole number that works?`,
      value: x, wrongs: [String(x - 1), String(-x), String(x + 1)],
      tags: ["ineq-flip"], difficulty: 0.6,
      explanation: `Dividing by a negative REVERSES the inequality: x > ${x}. The smallest whole number is ${x} (not ${x - 1} — the flip is the whole question).`,
    };
  },

  "probability-basics": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const d = r.pick([6, 8, 10, 12]);
      const target = r.pick([1, 2, 3]);
      const k = target;
      return {
        prompt: `A fair ${d}-sided die is rolled once. Give P(score ≤ ${k}) as a decimal.`,
        value: k / d, tolerance: { abs: 0.005, display: String(Number((k / d).toFixed(4))) }, wrongs: [String(Number((1 / d).toFixed(4))), String(Number((k / (d - k)).toFixed(4))), String(Number((k / d + 0.1).toFixed(4)))],
        tags: ["sum-one"], difficulty: 0.4,
        explanation: `${k} of the ${d} equally likely scores are ${k} or less, so P = ${k}/${d} = ${Number((k / d).toFixed(4))}.`,
      };
    }
    const red = r.int(2, 6), blue = r.int(2, 6);
    return {
      prompt: `A bag holds ${red} red and ${blue} blue counters. One is taken at random. Give P(red) as a decimal.`,
      value: red / (red + blue), tolerance: { abs: 0.005, display: String(Number((red / (red + blue)).toFixed(4))) }, wrongs: [String(Number((blue / (red + blue)).toFixed(4))), String(Number((red / blue).toFixed(4))), String(Number((1 / (red + blue)).toFixed(4)))],
      tags: ["sum-one"], difficulty: 0.4,
      explanation: `P(red) = red ÷ total = ${red}/${red + blue} = ${Number((red / (red + blue)).toFixed(4))}. Probabilities are out of the WHOLE bag, not the other colour.`,
    };
  },

  "tree-diagrams": (r) => {
    const p = r.int(1, 4);
    const a = p, b = p; // P = a/b
    const both = (a / b) * (a / b);
    return {
      prompt: `Two independent events each have probability ${a}/${b}. Give the probability that BOTH happen, as a decimal.`,
      value: both, tolerance: { abs: 0.005 }, wrongs: [String(Number((a / b + a / b).toFixed(4))), String(Number((1 - both).toFixed(4))), String(Number((a / b).toFixed(4)))],
      tags: ["ind-dep"], difficulty: 0.5,
      explanation: `Multiply ALONG the branches when the events are independent: ${a}/${b} × ${a}/${b} = ${Number(both.toFixed(4))}. Adding them would be for "either", not "both".`,
    };
  },

  "quadratic-graphs": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const h = r.int(1, 6);
      return {
        prompt: `y = x² − ${2 * h}x + ${h * h - 3}. At what value of x is the minimum?`,
        value: h, wrongs: [String(2 * h), String(-h), String(h * h - 3)],
        tags: ["b-half"], difficulty: 0.55,
        explanation: `The turning point is at x = −b/2a = ${2 * h}/2 = ${h} (completing the square gives (x − ${h})² − 3).`,
      };
    }
    if (v === 1) {
      const p = r.int(1, 5), q = r.int(2, 6);
      return {
        prompt: `y = (x − ${p})(x + ${q}). The graph crosses the x-axis at two points. What is the POSITIVE root?`,
        value: p, wrongs: [String(-q), String(q), String(p + q)],
        tags: ["b-half"], difficulty: 0.5,
        explanation: `A product is zero when a factor is zero: x − ${p} = 0 gives x = ${p}, and x + ${q} = 0 gives x = −${q}. The positive root is ${p}.`,
      };
    }
    const k = r.int(1, 6);
    return {
      prompt: `y = x² + ${k}. What is the y-intercept of the graph?`,
      value: k, wrongs: ["0", String(-k), String(k * k)],
      tags: [], difficulty: 0.35,
      explanation: `Set x = 0: y = 0² + ${k} = ${k}. The y-intercept is the constant term when the equation is in this form.`,
    };
  },

  proof: (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const n = r.pick([8, 9, 10, 12, 15]);
      return {
        prompt: `The sum of the first n whole numbers is n(n + 1)/2. What is the sum of the first ${n} whole numbers?`,
        value: (n * (n + 1)) / 2, wrongs: [String(n * n), String(n * (n + 1)), String((n * (n + 1)) / 2 + n)],
        tags: [], difficulty: 0.45,
        explanation: `n(n + 1)/2 = ${n} × ${n + 1} ÷ 2 = ${(n * (n + 1)) / 2}. This is the pairing argument: ${n} terms pair to ${n + 1} each, and there are ${n}/2 pairs.`,
      };
    }
    if (v === 1) {
      const k = r.int(2, 6);
      return {
        prompt: `An odd number has the form 2n + 1. Using n = ${k}, what is the odd number?`,
        value: 2 * k + 1, wrongs: [String(2 * k), String(2 * k + 2), String(k * k)],
        tags: [], difficulty: 0.4,
        explanation: `2n + 1 with n = ${k} gives 2(${k}) + 1 = ${2 * k + 1}. The form is what makes a proof about ALL odd numbers possible.`,
      };
    }
    const a = r.int(3, 9), b = r.int(3, 9);
    return {
      prompt: `Show (a + b)² = a² + 2ab + b². Using a = ${a} and b = ${b}, what is the value of 2ab?`,
      value: 2 * a * b, wrongs: [String(a * b), String(a * a + b * b), String(a + b)],
      tags: [], difficulty: 0.5,
      explanation: `2ab = 2 × ${a} × ${b} = ${2 * a * b}. The cross term is the whole content of the identity — a² + b² alone would miss it.`,
    };
  },

  "logic-maths": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      return {
        prompt: `In Boolean algebra, "1" means true and "0" means false. What is the value of A AND (NOT A)?`,
        value: 0, wrongs: ["1", "2", "-1"],
        tags: [], difficulty: 0.4,
        explanation: `A statement cannot be both true and false, so A AND NOT A is always false = 0. It is the contradiction, whatever A is.`,
      };
    }
    if (v === 1) {
      return {
        prompt: `In Boolean algebra, "1" means true and "0" means false. What is the value of A OR (NOT A)?`,
        value: 1, wrongs: ["0", "2", "-1"],
        tags: [], difficulty: 0.4,
        explanation: `Either A is true or it is not — one of the two always holds, so A OR NOT A is always true = 1.`,
      };
    }
    const a = r.int(0, 1), b = r.int(0, 1);
    return {
      prompt: `In Boolean algebra, 1 = true and 0 = false. Given A = ${a} and B = ${b}, what is A AND B?`,
      value: a & b, wrongs: [String(a | b), String(a ^ b), String(1 - (a & b))],
      tags: [], difficulty: 0.35,
      explanation: `AND is 1 only when BOTH inputs are 1. Here ${a} AND ${b} = ${a & b}.`,
    };
  },

  bearings: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const dirs: Array<[string, number]> = [["due north", 0], ["due east", 90], ["due south", 180], ["due west", 270]];
      const [name, deg] = r.pick(dirs);
      return {
        prompt: `What is the bearing of a direction ${name}, in degrees?`,
        value: deg, wrongs: [String((deg + 90) % 360), String((deg + 180) % 360), String(deg === 0 ? 360 : 0)],
        tags: [], difficulty: 0.3,
        explanation: `Bearings are measured CLOCKWISE from due north: north = 0°, east = 90°, south = 180°, west = 270°. So ${name} is ${deg}°.`,
      };
    }
    const d = r.pick([30, 40, 50, 60]);
    return {
      prompt: `A bearing is ${d}°. Measured the other way (anticlockwise from north), the same direction is 360 − ${d}. What is it, in degrees?`,
      value: 360 - d, wrongs: [String(d), String(180 - d), String(360 + d)],
      tags: [], difficulty: 0.35,
      explanation: `A full turn is 360°, so the opposite reading is 360 − ${d} = ${360 - d}°.`,
    };
  },

  "circle-area-arc": (r) => {
    const v = r.int(0, 2);
    const radius = r.int(2, 12);
    if (v === 0) {
      return {
        prompt: `A circle has radius ${radius} cm. Its area is kπ cm². What is the value of k?`,
        value: radius * radius, tolerance: { unit: "cm²" }, wrongs: [String(2 * radius), String(radius), String(radius * radius * 2)],
        tags: [], difficulty: 0.4,
        explanation: `Area = πr² = π × ${radius}² = ${radius * radius}π cm², so k = ${radius * radius}. The k is r², not r.`,
      };
    }
    if (v === 1) {
      return {
        prompt: `A circle has radius ${radius} cm. Its circumference is kπ cm. What is the value of k?`,
        value: 2 * radius, tolerance: { unit: "cm" }, wrongs: [String(radius), String(radius * radius), String(4 * radius)],
        tags: [], difficulty: 0.35,
        explanation: `Circumference = 2πr = 2π × ${radius} = ${2 * radius}π cm, so k = ${2 * radius}. Circumference is a LENGTH (one r); area has two.`,
      };
    }
    const deg = r.pick([60, 90, 120, 180]);
    const num = (deg / 360) * radius * radius;
    return {
      prompt: `A sector of a circle of radius ${radius} cm has angle ${deg}°. Its area is kπ cm². What is the value of k?`,
      value: num, tolerance: { abs: 0.01, unit: "cm²", display: String(Number(num.toFixed(2))) }, wrongs: [String(Number((radius * radius).toFixed(2))), String(Number(((deg / 180) * radius * radius).toFixed(2))), String(Number(((deg / 360) * 2 * radius).toFixed(2)))],
      tags: [], difficulty: 0.55,
      explanation: `A sector is the fraction ${deg}/360 of the whole: (${deg}/360) × π${radius}² = ${Number(num.toFixed(2))}π cm².`,
    };
  },

  "trig-rule": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const triples: Array<[number, number, number]> = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15]];
      const [a, b, c] = r.pick(triples);
      return {
        prompt: `A right-angled triangle has legs ${a} cm and ${b} cm. How long is the hypotenuse, in cm?`,
        value: c, tolerance: { unit: "cm" }, wrongs: [String(a + b), String(c + 1), String(c - 1)],
        tags: ["cos-amb"], difficulty: 0.45,
        explanation: `Pythagoras: ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, so the hypotenuse is √${c * c} = ${c} cm.`,
      };
    }
    if (v === 1) {
      const triples: Array<[number, number, number]> = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]];
      const [a, b, c] = r.pick(triples);
      return {
        prompt: `In a right-angled triangle the hypotenuse is ${c} cm and one leg is ${a} cm. How long is the other leg, in cm?`,
        value: b, tolerance: { unit: "cm" }, wrongs: [String(c - a), String(b + 1), String(a + c)],
        tags: ["cos-amb"], difficulty: 0.5,
        explanation: `Rearrange Pythagoras for a leg: ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}, so the leg is √${b * b} = ${b} cm.`,
      };
    }
    const angle = r.pick([30, 45, 60]);
    const hyp = r.pick([10, 12, 20, 24]);
    // sin(30)=0.5, sin(45)=√2/2, sin(60)=√3/2 — give the answer as opp/hyp × hyp for 30 only; use exact for 30.
    if (angle === 30) {
      return {
        prompt: `In a right-angled triangle the hypotenuse is ${hyp} cm and one angle is 30°. How long is the side OPPOSITE that angle, in cm?`,
        value: hyp / 2, tolerance: { unit: "cm" }, wrongs: [String(hyp), String(Math.round(hyp * 0.866)), String(Math.round(hyp / 3))],
        tags: ["cos-amb"], difficulty: 0.5,
        explanation: `sin 30° = 0.5, and sin = opposite/hypotenuse, so opposite = 0.5 × ${hyp} = ${hyp / 2} cm.`,
      };
    }
    return {
      prompt: `In a right-angled triangle the hypotenuse is ${hyp} cm and one angle is ${angle}°. How long is the side ADJACENT to that angle, in cm (1 d.p.)?`,
      value: Number((hyp * Math.cos((angle * Math.PI) / 180)).toFixed(1)),
      tolerance: { abs: 0.05, unit: "cm" },
      wrongs: [String(Number((hyp * Math.sin((angle * Math.PI) / 180)).toFixed(1))), String(hyp), String(Number((hyp / 2).toFixed(1)))],
      tags: ["cos-amb"], difficulty: 0.55,
      explanation: `cos ${angle}° = adjacent/hypotenuse, so adjacent = ${hyp} × cos ${angle}° = ${Number((hyp * Math.cos((angle * Math.PI) / 180)).toFixed(1))} cm.`,
    };
  },

  // ── PHYSICS ──────────────────────────────────────────────────────────────

  "forces-basics": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const m = r.int(2, 12), a = r.int(2, 6);
      return {
        prompt: `A mass of ${m} kg accelerates at ${a} m/s². Using F = ma, what is the resultant force, in newtons?`,
        value: m * a, tolerance: { unit: "N" }, wrongs: [String(m + a), String(Math.round(m / a)), String(m * a * 10)],
        tags: ["bal-motion"], difficulty: 0.35,
        explanation: `F = ma = ${m} × ${a} = ${m * a} N. Force is in newtons, not kilograms — the units are part of the answer.`,
      };
    }
    if (v === 1) {
      const m = r.int(2, 10), g = 10;
      return {
        prompt: `A mass of ${m} kg is weighed on Earth, where g = ${g} N/kg. What is its weight, in newtons?`,
        value: m * g, tolerance: { unit: "N" }, wrongs: [String(m), String(m * g + 10), String(Math.round(m / g))],
        tags: ["bal-motion"], difficulty: 0.35,
        explanation: `Weight = mass × g = ${m} × ${g} = ${m * g} N. The mass stays ${m} kg wherever it is; the WEIGHT changes with g.`,
      };
    }
    const f = r.int(20, 90), a = r.int(2, 6);
    return {
      prompt: `A resultant force of ${f} N acts on a mass, giving an acceleration of ${a} m/s². What is the mass, in kg?`,
      value: f / a, tolerance: { abs: 0.01, unit: "kg", display: String(Number((f / a).toFixed(2))) }, wrongs: [String(f * a), String(f - a), String(Number((a / f).toFixed(3)))],
      tags: ["bal-motion"], difficulty: 0.45,
      explanation: `Rearrange F = ma: m = F ÷ a = ${f} ÷ ${a} = ${Number((f / a).toFixed(2))} kg.`,
    };
  },

  "motion-graphs": (r) => {
    const v = r.int(0, 2);
    const d = r.int(40, 400), t = r.int(2, 20);
    if (v === 0) {
      const dist = d - (d % t);
      return {
        prompt: `A car travels ${dist} m in ${t} s. What is its average speed, in m/s?`,
        value: dist / t, tolerance: { abs: 0.01, unit: "m/s" }, wrongs: [String(dist * t), String(t), String(Number((t / dist).toFixed(3)))],
        tags: ["dt-vt"], difficulty: 0.35,
        explanation: `Speed = distance ÷ time = ${dist} ÷ ${t} = ${dist / t} m/s. Dividing the wrong way round gives a tiny number — check the units.`,
      };
    }
    if (v === 1) {
      const u = r.int(2, 8), a = r.int(2, 5), tt = r.int(2, 6);
      return {
        prompt: `A body starts at ${u} m/s and accelerates at ${a} m/s² for ${tt} s. What is its final velocity, in m/s?`,
        value: u + a * tt, tolerance: { unit: "m/s" }, wrongs: [String(u * tt), String(a * tt), String(u + a)],
        tags: ["dt-vt"], difficulty: 0.45,
        explanation: `v = u + at = ${u} + ${a} × ${tt} = ${u + a * tt} m/s. The initial velocity still counts — it does not reset to zero.`,
      };
    }
    const u = r.int(2, 10), a = r.int(2, 5), tt = r.int(2, 6);
    return {
      prompt: `A body starts at ${u} m/s and accelerates at ${a} m/s² for ${tt} s. How far does it travel, in metres?`,
      value: u * tt + 0.5 * a * tt * tt,
      tolerance: { abs: 0.01, unit: "m" },
      wrongs: [String(u * tt), String(0.5 * a * tt * tt), String((u + a * tt) * tt)],
      tags: ["dt-vt"], difficulty: 0.6,
      explanation: `s = ut + ½at² = ${u}(${tt}) + ½(${a})(${tt}²) = ${u * tt} + ${0.5 * a * tt * tt} = ${u * tt + 0.5 * a * tt * tt} m. The ½ is the whole reason the acceleration term is not just at².`,
    };
  },

  "sound-acoustics": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const f = r.pick([20, 50, 100, 250, 500]);
      return {
        prompt: `A sound wave has frequency ${f} Hz. What is its period, in seconds?`,
        value: 1 / f, tolerance: { abs: 0.0005, unit: "s" }, wrongs: [String(f), String(Number((1 / (f / 2)).toFixed(6))), String(Number((2 / f).toFixed(6)))],
        tags: ["sound-vac"], difficulty: 0.5,
        explanation: `Period = 1 ÷ frequency = 1/${f} = ${Number((1 / f).toFixed(6))} s. Higher frequency means a SHORTER period — the two move opposite ways.`,
      };
    }
    if (v === 1) {
      const f = r.pick([50, 100, 200, 340]);
      const speed = 340;
      return {
        prompt: `A sound wave of frequency ${f} Hz travels at 340 m/s. What is its wavelength, in metres (2 d.p.)?`,
        value: Number((speed / f).toFixed(2)), tolerance: { abs: 0.01, unit: "m" },
        wrongs: [String(Number((speed * f).toFixed(2))), String(Number((f / speed).toFixed(2))), String(Number((speed / (f * 2)).toFixed(2)))],
        tags: ["sound-vac"], difficulty: 0.5,
        explanation: `v = fλ, so λ = v ÷ f = 340 ÷ ${f} = ${Number((speed / f).toFixed(2))} m.`,
      };
    }
    const t = r.pick([2, 3, 4, 5]);
    return {
      prompt: `A sound is heard ${t} s after a flash of lightning. Taking the speed of sound as 340 m/s, how far away was the strike, in metres?`,
      value: 340 * t, tolerance: { unit: "m" }, wrongs: [String(340 * t + 340), String(t * 1000), String(340)],
      tags: [], difficulty: 0.4,
      explanation: `distance = speed × time = 340 × ${t} = ${340 * t} m. Light arrives almost instantly; the delay is sound, and that is what is being timed.`,
    };
  },

  "light-optics": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const inc = r.int(15, 75);
      return {
        prompt: `A ray of light hits a plane mirror. The angle of incidence (measured from the normal) is ${inc}°. What is the angle of reflection, in degrees?`,
        value: inc, wrongs: [String(90 - inc), String(180 - inc), String(inc + 10)],
        tags: ["norm-miss"], difficulty: 0.3,
        explanation: `The angle of reflection EQUALS the angle of incidence, both measured from the normal: ${inc}°. ${90 - inc}° would be the angle to the mirror SURFACE, which is the classic error.`,
      };
    }
    const n = r.pick([1.5, 2, 2.5]);
    const inc = r.pick([30, 40, 50]);
    const sinR = Math.sin((inc * Math.PI) / 180) / n;
    const rDeg = Number(((Math.asin(sinR) * 180) / Math.PI).toFixed(1));
    return {
      prompt: `Light enters glass of refractive index ${n} at an angle of incidence of ${inc}°. What is the angle of refraction, in degrees (1 d.p.)?`,
      value: rDeg, tolerance: { abs: 0.2, unit: "°" },
      wrongs: [String(Number((inc / n).toFixed(1))), String(Number((inc * n).toFixed(1))), String(inc)],
      tags: ["norm-miss"], difficulty: 0.6,
      explanation: `Snell's law: n₁ sin θ₁ = n₂ sin θ₂, so sin θ₂ = sin ${inc}° ÷ ${n} = ${Number(sinR.toFixed(4))}, giving θ₂ = ${rDeg}°. Note the angle does NOT simply divide by n.`,
    };
  },

  "thermal-physics": (r) => {
    const v = r.int(0, 1);
    const c = 4200;
    if (v === 0) {
      const m = r.int(1, 4), dT = r.int(5, 40);
      return {
        prompt: `How much energy is needed to raise ${m} kg of water by ${dT} °C? (specific heat capacity of water = ${c} J/kg°C). Give your answer in joules.`,
        value: m * c * dT, tolerance: { unit: "J" }, wrongs: [String(m * dT), String(c * dT), String(m * c * dT * 10)],
        tags: ["heat-temp"], difficulty: 0.5,
        explanation: `Q = mcΔT = ${m} × ${c} × ${dT} = ${m * c * dT} J. The mass multiplies — a bath and a spoonful at the same temperature hold very different energy.`,
      };
    }
    const m = r.int(1, 4), dT = r.int(5, 30);
    return {
      prompt: `A ${m} kg block is heated with ${m * c * dT} J and rises by ${dT} °C. What is its specific heat capacity, in J/kg°C?`,
      value: c, tolerance: { abs: 1, unit: "J/kg°C" }, wrongs: [String(c * 10), String(Math.round(c / 10)), String(m * dT)],
      tags: ["heat-temp"], difficulty: 0.55,
      explanation: `Rearrange Q = mcΔT: c = Q ÷ (mΔT) = ${m * c * dT} ÷ (${m} × ${dT}) = ${c} J/kg°C — water's value, as expected.`,
    };
  },

  "gravity-fields": (r) => {
    const m = r.int(2, 12);
    const g = r.pick([10, 9.8]);
    return {
      prompt: `A mass of ${m} kg is taken to a place where the gravitational field strength is ${g} N/kg. What is its weight there, in newtons?`,
      value: Number((m * g).toFixed(1)), tolerance: { abs: 0.05, unit: "N" },
      wrongs: [String(m), String(Number((m * g + g).toFixed(1))), String(Number((m / g).toFixed(2)))],
      tags: ["bal-motion"], difficulty: 0.4,
      explanation: `Weight = mass × field strength = ${m} × ${g} = ${Number((m * g).toFixed(1))} N. Mass (kg) is unchanged by where you are; weight is not.`,
    };
  },

  "em-induction": (r) => {
    const n = r.pick([100, 200, 400, 500]);
    const dPhi = r.pick([0.02, 0.05, 0.1, 0.04]);
    const dt = r.pick([0.1, 0.2, 0.5]);
    const emf = (n * dPhi) / dt;
    return {
      prompt: `A coil of ${n} turns has its flux changed by ${dPhi} Wb in ${dt} s. Using EMF = NΔΦ/Δt, what is the induced EMF, in volts?`,
      value: Number(emf.toFixed(2)), tolerance: { abs: 0.01, unit: "V" },
      wrongs: [String(Number((dPhi / dt).toFixed(2))), String(Number((n * dPhi * dt).toFixed(2))), String(Number((n * dt).toFixed(2)))],
      tags: ["motor-gen"], difficulty: 0.6,
      explanation: `EMF = N × (ΔΦ/Δt) = ${n} × (${dPhi}/${dt}) = ${Number(emf.toFixed(2))} V. More turns multiply the EMF; a faster change multiplies it too.`,
    };
  },

  radioactivity: (r) => {
    const start = r.pick([80, 100, 120, 160]);
    const half = r.pick([2, 3, 4, 5]);
    const n = r.int(1, 4);
    const left = start / Math.pow(2, n);
    return {
      prompt: `A sample of ${start} g has a half-life of ${half} days. What mass remains after ${half * n} days, in grams?`,
      value: left, tolerance: { abs: 0.01, unit: "g" },
      wrongs: [String(Number((start / (n + 1)).toFixed(2))), String(start / Math.pow(2, n + 1)), String(left + start / 4)],
      tags: ["half-life"], difficulty: 0.5,
      explanation: `${half * n} days is ${n} half-lives, so the mass halves ${n} times: ${start} → ${start / 2} → ${start / 4} → ${start / 8} → ${left} g. It never reaches zero.`,
    };
  },

  // ── CHEMISTRY ────────────────────────────────────────────────────────────

  "moles-calcs": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const mr = r.pick([18, 40, 44, 58.5, 16]);
      const moles = r.pick([0.5, 1, 2, 3, 0.25]);
      const mass = mr * moles;
      return {
        prompt: `How many moles are in ${Number(mass.toFixed(2))} g of a substance with Mr = ${mr}?`,
        value: moles, tolerance: { abs: 0.01, unit: "mol" },
        wrongs: [String(Number((mr * mass).toFixed(2))), String(Number((mass / (mr * 2)).toFixed(3))), String(Number((mr / mass).toFixed(3)))],
        tags: ["mr-mass"], difficulty: 0.5,
        explanation: `moles = mass ÷ Mr = ${Number(mass.toFixed(2))} ÷ ${mr} = ${moles} mol. Multiplying instead of dividing is the classic slip — a mole is a huge number, so the count should be SMALL.`,
      };
    }
    const mr = r.pick([18, 40, 44, 58.5]);
    const moles = r.pick([0.5, 1, 2, 1.5]);
    return {
      prompt: `What is the mass of ${moles} mol of a substance with Mr = ${mr}? Give your answer in grams.`,
      value: Number((mr * moles).toFixed(2)), tolerance: { abs: 0.01, unit: "g" },
      wrongs: [String(Number((mr / moles).toFixed(2))), String(mr), String(Number((mr * moles * 2).toFixed(2)))],
      tags: ["mr-mass"], difficulty: 0.5,
      explanation: `mass = moles × Mr = ${moles} × ${mr} = ${Number((mr * moles).toFixed(2))} g.`,
    };
  },

  "periodic-table": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const configs: Array<[string, number]> = [["2,8,1", 1], ["2,8,2", 2], ["2,8,7", 7], ["2,8,8", 0], ["2,1", 1]];
      const [cfg, group] = r.pick(configs);
      return {
        prompt: `An atom has the electron configuration ${cfg}. Which group of the periodic table is it in?`,
        value: group, wrongs: [String(group + 1), String(group === 0 ? 8 : group - 1), String(cfg.split(",").length)],
        tags: ["group-trend"], difficulty: 0.5,
        explanation: `The GROUP is decided by the OUTER shell only: ${cfg.split(",")[cfg.split(",").length - 1]} outer electrons → group ${group}. The inner shells say which PERIOD it is in, not which group.`,
      };
    }
    const configs: Array<[string, number]> = [["2,8,1", 3], ["2,8,7", 3], ["2,1", 2], ["2,8,8,1", 4]];
    const [cfg, period] = r.pick(configs);
    return {
      prompt: `An atom has the electron configuration ${cfg}. Which period of the periodic table is it in?`,
      value: period, wrongs: [String(cfg.split(",").length + 1), String(period - 1), String(Number(cfg.split(",")[cfg.split(",").length - 1]))],
      tags: ["group-trend"], difficulty: 0.5,
      explanation: `The PERIOD is the number of occupied shells: ${cfg} has ${cfg.split(",").length} shells, so it is in period ${period}.`,
    };
  },

  // ── BIOLOGY ──────────────────────────────────────────────────────────────

  cells: (r) => {
    const real = r.pick([5, 10, 20, 50]);
    const mag = r.pick([100, 200, 400, 1000]);
    return {
      prompt: `A cell ${real} μm wide is viewed at ×${mag} magnification. How wide does it appear, in μm?`,
      value: real * mag, tolerance: { unit: "μm" },
      wrongs: [String(real + mag), String(Math.round((real / mag) * 1000) / 1000), String(real * (mag / 10))],
      tags: [], difficulty: 0.4,
      explanation: `image = real × magnification = ${real} × ${mag} = ${real * mag} μm. The image must be BIGGER than the object, so dividing is the warning sign.`,
    };
  },

  photosynthesis: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      return {
        prompt: `Complete the word equation: carbon dioxide + water → glucose + oxygen. In the balanced symbol equation 6CO₂ + 6H₂O → C₆H₁₂O₆ + xO₂, what is x?`,
        value: 6, wrongs: ["3", "12", "1"],
        tags: [], difficulty: 0.5,
        explanation: `Balance the oxygens: the left has 6×2 + 6×1 = 18 O atoms; glucose uses 6, leaving 12, so xO₂ needs x = 6. Every atom must be conserved.`,
      };
    }
    const n = r.int(1, 5);
    return {
      prompt: `A plant takes in ${n} molecules of CO₂. How many molecules of glucose can it build at most, if 6 CO₂ are needed for each?`,
      value: Math.floor(n / 6), wrongs: [String(n), String(n * 6), String(Math.ceil(n / 6))],
      tags: [], difficulty: 0.45,
      explanation: `It takes 6 CO₂ per glucose, so ${n} CO₂ gives ⌊${n}/6⌋ = ${Math.floor(n / 6)} glucose — the rest is left over.`,
    };
  },

  enzymes: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      return {
        prompt: `Pepsin is a protease enzyme that works in the stomach. What is its optimum pH?`,
        value: 2, wrongs: ["7", "9", "14"],
        tags: [], difficulty: 0.4,
        explanation: `The stomach is acidic, around pH 2. Pepsin is built for it — at pH 7 it denatures and stops working. Enzymes are shaped for their environment.`,
      };
    }
    const p = r.pick([1, 2, 3, 4]);
    return {
      prompt: `An enzyme works best at pH ${p + 4}. What is its optimum pH?`,
      value: p + 4, wrongs: [String(p), String(14 - (p + 4)), String(p + 5)],
      tags: [], difficulty: 0.35,
      explanation: `The optimum pH is ${p + 4} — the pH at which the enzyme's active site fits its substrate best.`,
    };
  },

  circulation: (r) => {
    const bpm = r.pick([60, 70, 72, 80, 90]);
    return {
      prompt: `A resting heart rate is ${bpm} beats per minute. How many times does the heart beat in one hour?`,
      value: bpm * 60, tolerance: { unit: "beats" }, wrongs: [String(bpm * 30), String(bpm * 100), String(bpm * 24)],
      tags: [], difficulty: 0.4,
      explanation: `${bpm} beats/min × 60 min = ${bpm * 60} beats in an hour. Multiplying by 24 gives the daily figure (${bpm * 60 * 24}), which the question did not ask for.`,
    };
  },

  // ── COMPUTING ────────────────────────────────────────────────────────────

  "what-is-code": (r) => {
    const n = r.int(2, 6);
    return {
      prompt: `How many times does this loop body run?\n\nfor i in range(${n}):\n    print(i)`,
      value: n, wrongs: [String(n + 1), String(n - 1), String(n * n)],
      tags: [], difficulty: 0.4,
      explanation: `range(${n}) yields ${n} values — 0 up to ${n - 1} — so the body runs ${n} times. Starting at 0 is why the count is ${n}, not ${n + 1}.`,
    };
  },

  complexity: (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const p = r.pick([8, 16, 32, 64, 128]);
      return {
        prompt: `A sorted list of ${p} items is searched by binary search. What is the MAXIMUM number of comparisons needed?`,
        value: Math.log2(p), wrongs: [String(p), String(Math.log2(p) + 1), String(Math.ceil(Math.log2(p) * 2))],
        tags: [], difficulty: 0.6,
        explanation: `Each comparison halves the search space, so the worst case is log₂(${p}) = ${Math.log2(p)}. Linear search would need up to ${p} — this is why sorted data is worth keeping.`,
      };
    }
    if (v === 1) {
      const n = r.pick([5, 10, 20, 50]);
      return {
        prompt: `An algorithm does n² operations. For n = ${n}, how many operations is that?`,
        value: n * n, wrongs: [String(2 * n), String(n * n * 2), String(n * n * n)],
        tags: [], difficulty: 0.4,
        explanation: `n² with n = ${n} is ${n} × ${n} = ${n * n}. Doubling n would quadruple the work — that is what makes quadratic algorithms slow.`,
      };
    }
    const n = r.pick([10, 20, 100, 1000]);
    return {
      prompt: `An algorithm does n log₂(n) operations. For n = ${n}, how many operations is that?`,
      value: n * Math.log2(n), tolerance: { abs: 0.5, display: String(Number((n * Math.log2(n)).toFixed(2))) }, wrongs: [String(n), String(n * n), String(Number(Math.log2(n).toFixed(2)))],
      tags: [], difficulty: 0.6,
      explanation: `n log₂n = ${n} × ${Number(Math.log2(n).toFixed(2))} ≈ ${Number((n * Math.log2(n)).toFixed(2))}. This is the cost of good sorting algorithms, and it grows far more slowly than n².`,
    };
  },

  networks: (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      return {
        prompt: `How many bits are in an IPv4 address?`,
        value: 32, wrongs: ["16", "64", "128"],
        tags: [], difficulty: 0.4,
        explanation: `IPv4 addresses are 32 bits — four 8-bit groups, which is why they look like 192.168.0.1. IPv6 uses 128 bits.`,
      };
    }
    if (v === 1) {
      const prefix = r.pick([24, 25, 26, 28]);
      const hosts = Math.pow(2, 32 - prefix) - 2;
      return {
        prompt: `A subnet uses the prefix /${prefix}. How many USABLE host addresses does it hold?`,
        value: hosts, wrongs: [String(Math.pow(2, 32 - prefix)), String(Math.pow(2, 32 - prefix) - 1), String(prefix)],
        tags: [], difficulty: 0.7,
        explanation: `/${prefix} leaves ${32 - prefix} host bits → 2^${32 - prefix} = ${Math.pow(2, 32 - prefix)} addresses, minus 2 (the network and broadcast addresses) = ${hosts} usable.`,
      };
    }
    return {
      prompt: `How many bits are in an IPv6 address?`,
      value: 128, wrongs: ["32", "64", "256"],
      tags: [], difficulty: 0.4,
      explanation: `IPv6 addresses are 128 bits, written as eight groups of four hex digits. That is what makes the address space effectively inexhaustible.`,
    };
  },

  "web-stack": (r) => {
    const codes: Array<[number, string]> = [[200, "OK"], [301, "moved permanently"], [404, "not found"], [500, "server error"]];
    const [code] = r.pick(codes);
    return {
      prompt: `An HTTP response has the status code ${code}. In the 1xx/2xx/3xx/4xx/5xx scheme, what is the first digit (the response CLASS)?`,
      value: Math.floor(code / 100), wrongs: [String(Math.floor(code / 100) + 1), String(code % 10), String(Math.floor(code / 10))],
      tags: [], difficulty: 0.5,
      explanation: `The first digit IS the class: 2xx success, 3xx redirect, 4xx client error, 5xx server error. ${code} is a ${Math.floor(code / 100)}xx, so the first digit is ${Math.floor(code / 100)}.`,
    };
  },
};

/**
 * THE WHOLE NUMERIC LAYER: the opening families (this file) plus the core
 * curriculum (lib/numeric-items-core.ts). Merged here so the bank, the content
 * gate and every surface see ONE registry — a second one would be a second
 * thing to disagree with about which concepts have an answer box.
 *
 * A core family deliberately does not overwrite an opening one: where both name
 * a concept, the opening family is the one authored first and kept, so this
 * merge can never silently change a question a learner has already met.
 */
export const NUMERIC_GENS: Record<string, NumericGen> = {
  ...CORE_NUMERIC_GENS,
  ...OPENING_GENS,
};

/** Concepts whose numeric family this module supplies — exported so the content
 *  gate can assert the coverage it claims rather than trust the list. */
export const NUMERIC_CONCEPT_IDS: string[] = Object.keys(NUMERIC_GENS);
