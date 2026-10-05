// ─────────────────────────────────────────────────────────────────────────────
// NUMERIC ITEMS, PART TWO — the CORE curriculum.
//
// lib/numeric-items.ts opened the answer box on 31 concepts. This is the rest of
// the core sequence: the number work, the algebra, the measurement, the physics
// and chemistry where a learner is expected to COMPUTE a value rather than spot
// it among four printed strings.
//
// Every item here follows the same contract as part one: a real question a
// teacher would set, the unit stated where the answer has one, a tolerance the
// ITEM declares (exact for a count, slack for a measurement), distractors that
// are the mistakes the question actually produces, and an explanation that says
// why — not merely what.
//
// Split into its own module purely for size. It is merged into the same
// registry, so the bank, the gate and every surface treat the two alike.
// ─────────────────────────────────────────────────────────────────────────────

import type { NumericGen } from "./numeric-items";

export const CORE_NUMERIC_GENS: Record<string, NumericGen> = {
  // ── NUMBER ──────────────────────────────────────────────────────────────

  "place-value": (r) => {
    const h = r.int(1, 9), t = r.int(1, 9), o = r.int(1, 9);
    const n = h * 100 + t * 10 + o;
    const which = r.pick(["tens", "hundreds", "ones"] as const);
    const value = which === "tens" ? t * 10 : which === "hundreds" ? h * 100 : o;
    return {
      prompt: `In the number ${n}, what is the VALUE of the ${which} digit?`,
      value, wrongs: [String(which === "tens" ? t : which === "hundreds" ? h : o), String(value * 10), String(value / 10)],
      tags: [], difficulty: 0.35,
      explanation: `The ${which} column is worth ${which === "tens" ? "10" : which === "hundreds" ? "100" : "1"} each, so the digit contributes ${value}. The digit itself (${which === "tens" ? t : which === "hundreds" ? h : o}) is not its value — the column is.`,
    };
  },

  addition: (r) => {
    const a = r.int(120, 980), b = r.int(120, 980);
    return {
      prompt: `Work out ${a} + ${b}.`,
      value: a + b, wrongs: [String(a + b + 10), String(a + b - 10), String(a + b + 100)],
      tags: [], difficulty: 0.3,
      explanation: `${a} + ${b} = ${a + b}. Add the hundreds, then the tens, then the ones, and carry where a column reaches 10.`,
    };
  },

  subtraction: (r) => {
    const a = r.int(400, 980), b = r.int(120, a - 50);
    return {
      prompt: `Work out ${a} − ${b}.`,
      value: a - b, wrongs: [String(a - b + 10), String(a - b - 10), String(b - a)],
      tags: [], difficulty: 0.3,
      explanation: `${a} − ${b} = ${a - b}. ${b - a} would be the wrong way round — the answer must be positive because ${a} is bigger.`,
    };
  },

  multiplication: (r) => {
    const a = r.int(12, 40), b = r.int(3, 12);
    return {
      prompt: `Work out ${a} × ${b}.`,
      value: a * b, wrongs: [String(a * b + a), String(a * b - b), String(a + b)],
      tags: [], difficulty: 0.35,
      explanation: `${a} × ${b} = ${a * b}. Split ${b} into tens and ones if it helps: ${a} × 10 = ${a * 10}, then add ${a} × ${b - 10 >= 0 ? b - 10 : b}.`,
    };
  },

  division: (r) => {
    const b = r.int(3, 12), q = r.int(3, 12);
    const a = b * q;
    return {
      prompt: `Work out ${a} ÷ ${b}.`,
      value: q, wrongs: [String(q + 1), String(q - 1), String(b)],
      tags: [], difficulty: 0.35,
      explanation: `${a} ÷ ${b} = ${q}, because ${b} × ${q} = ${a}. Division is multiplication read backwards — check by multiplying.`,
    };
  },

  negatives: (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const a = r.int(-9, -2), b = r.int(2, 9);
      return {
        prompt: `Work out ${a} + ${b}.`,
        value: a + b, wrongs: [String(a - b), String(-(a + b)), String(Math.abs(a) + b)],
        tags: ["neg-slip"], difficulty: 0.35,
        explanation: `${a} + ${b} = ${a + b}. Starting at ${a} and moving ${b} to the right on the number line.`,
      };
    }
    if (v === 1) {
      const a = r.int(2, 9), b = r.int(-9, -2);
      return {
        prompt: `Work out ${a} − (${b}).`,
        value: a - b, wrongs: [String(a + b), String(b - a), String(-(a - b))],
        tags: ["neg-slip"], difficulty: 0.45,
        explanation: `Subtracting a negative is ADDING: ${a} − (${b}) = ${a} + ${Math.abs(b)} = ${a - b}. Taking away a debt leaves you richer.`,
      };
    }
    const a = r.int(-6, -2), b = r.int(-6, -2);
    return {
      prompt: `Work out (${a}) × (${b}).`,
      value: a * b, wrongs: [String(a * b * -1), String(a + b), String(Math.abs(a * b))],
      tags: ["neg-slip"], difficulty: 0.45,
      explanation: `Two negatives multiply to a POSITIVE: (${a}) × (${b}) = ${a * b}. The opposite of the opposite is the original direction.`,
    };
  },

  fractions: (r) => {
    const d = r.int(3, 9), n = r.int(1, d - 1), k = r.int(2, 5);
    return {
      prompt: `Work out ${n}/${d} of ${d * k}.`,
      value: n * k, wrongs: [String(n * d), String(k), String(n * k + d)],
      // No tag. The item asks for a fraction OF a quantity, and its three wrong
      // options are multiply-by-the-denominator, divide-and-stop, and
      // add-the-denominator. None of them reveals "a bigger denominator means a
      // bigger slice" — the concept's one catalogued belief — so carrying
      // `frac-slice` here recorded evidence against a belief the item cannot
      // test, exactly the defect lib/questions.ts documents for a positive index
      // that used to carry "neg-exp". It is not merely wrong in principle: this
      // is the tag a learner accumulates by missing a few of these, and it made
      // the decision door answer "you can do the steps, but 'Bigger denominator
      // = bigger slice' keeps recurring" to someone who cannot yet find 3/4 of
      // 12 at all — a named cause where the record says the idea is unbuilt.
      tags: [], difficulty: 0.4,
      explanation: `Divide by the denominator first: ${d * k} ÷ ${d} = ${k}, then multiply by the numerator: ${k} × ${n} = ${n * k}.`,
    };
  },

  "fraction-ops": (r) => {
    const a = r.int(1, 5), b = r.int(2, 7), c = r.int(1, 5), d = r.int(2, 7);
    const num = a * d + c * b;
    const den = b * d;
    return {
      prompt: `Work out ${a}/${b} + ${c}/${d}. Give your answer as a decimal (2 d.p.).`,
      value: Number((num / den).toFixed(2)), tolerance: { abs: 0.01 },
      wrongs: [String(Number(((a + c) / (b + d)).toFixed(2))), String(Number((a / b).toFixed(2))), String(Number((num / den + 0.1).toFixed(2)))],
      tags: ["denom-add"], difficulty: 0.55,
      explanation: `A common denominator: ${a}/${b} + ${c}/${d} = ${a * d}/${den} + ${c * b}/${den} = ${num}/${den} = ${Number((num / den).toFixed(2))}. Adding tops and bottoms (${a + c}/${b + d}) is the classic error — the answer must be BIGGER than either fraction.`,
    };
  },

  decimals: (r) => {
    const a = r.int(10, 90) / 10, b = r.int(10, 90) / 10;
    return {
      prompt: `Work out ${a} × ${b}.`,
      value: Number((a * b).toFixed(4)), tolerance: { abs: 0.005 },
      wrongs: [String(Number((a * b * 10).toFixed(4))), String(Number((a * b / 10).toFixed(4))), String(Number((a + b).toFixed(4)))],
      tags: [], difficulty: 0.45,
      explanation: `${a} × ${b} = ${Number((a * b).toFixed(4))}. Multiply as if the points were not there (${Math.round(a * 10)} × ${Math.round(b * 10)} = ${Math.round(a * 10) * Math.round(b * 10)}), then put back the two decimal places.`,
    };
  },

  percentages: (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const pct = r.pick([15, 20, 25, 35, 40]), amount = r.pick([40, 60, 80, 120, 200]);
      return {
        prompt: `Work out ${pct}% of ${amount}.`,
        value: (pct * amount) / 100, tolerance: { abs: 0.01 },
        wrongs: [String((pct * amount) / 10), String(amount - (pct * amount) / 100), String(pct * amount)],
        tags: ["pct-base"], difficulty: 0.4,
        explanation: `${pct}% means ${pct}/100, so ${pct}% of ${amount} = ${amount} × ${pct}/100 = ${(pct * amount) / 100}.`,
      };
    }
    if (v === 1) {
      const pct = r.pick([10, 20, 25, 50]), amount = r.pick([60, 80, 120, 240]);
      return {
        prompt: `A price of ${amount} rises by ${pct}%. What is the new price?`,
        value: amount * (1 + pct / 100), tolerance: { abs: 0.01 },
        wrongs: [String(amount + pct), String((amount * pct) / 100), String(amount * (1 - pct / 100))],
        tags: ["pct-base"], difficulty: 0.45,
        explanation: `A ${pct}% rise is a multiplier of ${1 + pct / 100}: ${amount} × ${1 + pct / 100} = ${amount * (1 + pct / 100)}. Adding ${pct} would be adding ${pct} pounds, not ${pct} percent.`,
      };
    }
    const pct = r.pick([20, 25, 40]), amount = r.pick([80, 120, 200]);
    return {
      prompt: `A price of ${amount} falls by ${pct}%. What is the new price?`,
      value: amount * (1 - pct / 100), tolerance: { abs: 0.01 },
      wrongs: [String(amount - pct), String(amount * (1 + pct / 100)), String((amount * pct) / 100)],
      tags: ["pct-base"], difficulty: 0.45,
      explanation: `A ${pct}% fall is a multiplier of ${1 - pct / 100}: ${amount} × ${1 - pct / 100} = ${amount * (1 - pct / 100)}.`,
    };
  },

  ratio: (r) => {
    const a = r.int(1, 5);
    // a === b makes "what is the SMALLER share?" a question with two right
    // answers, and prints an unsimplified ratio (3:3) as if it were one — a
    // learner who simplifies it first gets a different question from the one
    // printed. Keep the two parts distinct.
    const raw = r.int(1, 5);
    const b = raw >= a ? (raw % 5) + 1 : raw;
    const k = r.int(2, 6);
    const total = (a + b) * k;
    return {
      prompt: `£${total} is shared in the ratio ${a}:${b}. What is the SMALLER share?`,
      value: Math.min(a, b) * k, wrongs: [String(Math.max(a, b) * k), String(total / 2), String(Math.min(a, b) * (k + 1))],
      tags: [], difficulty: 0.5,
      explanation: `There are ${a + b} parts, each worth ${total} ÷ ${a + b} = ${k}. The smaller share is ${Math.min(a, b)} parts = ${Math.min(a, b) * k}.`,
    };
  },

  proportion: (r) => {
    const n = r.int(2, 8), cost = r.int(2, 9), m = r.int(2, 6);
    return {
      prompt: `If ${n} pens cost £${n * cost}, how much do ${m} pens cost, in pounds?`,
      value: m * cost, tolerance: { abs: 0.01, unit: "£" },
      wrongs: [String(n * cost), String(cost), String(m * cost + cost)],
      tags: ["inv-prop"], difficulty: 0.45,
      explanation: `Find the UNIT price first: £${n * cost} ÷ ${n} = £${cost} each. Then ${m} × £${cost} = £${m * cost}. This is direct proportion — more pens, more money.`,
    };
  },

  rounding: (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const n = r.int(1000, 9999) / 100;
      return {
        prompt: `Round ${n} to 1 decimal place.`,
        value: Number(n.toFixed(1)), tolerance: { abs: 0.001 },
        wrongs: [String(Number(n.toFixed(2))), String(Math.round(n)), String(Number((n - 0.1).toFixed(1)))],
        tags: ["round-half"], difficulty: 0.4,
        explanation: `Look at the second decimal (${String(n).split(".")[1]?.[1] ?? 0}): 5 or more rounds up, below 5 rounds down. So ${n} → ${Number(n.toFixed(1))}.`,
      };
    }
    if (v === 1) {
      const n = r.int(1000, 9999);
      return {
        prompt: `Round ${n} to the nearest 100.`,
        value: Math.round(n / 100) * 100, wrongs: [Math.round(n / 10) * 10, Math.round(n / 1000) * 1000, n - 100],
        tags: ["round-half"], difficulty: 0.4,
        explanation: `The tens digit decides: ${n} sits between ${Math.floor(n / 100) * 100} and ${Math.ceil(n / 100) * 100}, nearer ${Math.round(n / 100) * 100}.`,
      };
    }
    const sf = r.pick([2, 3]);
    const n = r.int(10000, 99999);
    const rounded = Number(n.toPrecision(sf));
    return {
      prompt: `Round ${n} to ${sf} significant figures.`,
      value: rounded, wrongs: [Number(n.toPrecision(sf + 1)), Number(n.toPrecision(sf - 1)), Math.round(n / 1000) * 1000],
      tags: ["round-half"], difficulty: 0.5,
      explanation: `Significant figures count from the first non-zero digit. ${n} to ${sf} s.f. is ${rounded}.`,
    };
  },

  "order-ops": (r) => {
    const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9);
    return {
      prompt: `Work out ${a} + ${b} × ${c}.`,
      value: a + b * c, wrongs: [(a + b) * c, a * b + c, a + b + c],
      tags: ["order-ops"], difficulty: 0.4,
      explanation: `Multiplication binds tighter than addition: ${b} × ${c} = ${b * c} first, then ${a} + ${b * c} = ${a + b * c}. Working left to right gives ${(a + b) * c}, which is wrong.`,
    };
  },

  "indices-intro": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const b = r.int(2, 5), e = r.int(2, 4);
      return {
        prompt: `Work out ${b}^${e}.`,
        value: Math.pow(b, e), wrongs: [b * e, Math.pow(b, e + 1), Math.pow(e, b)],
        // No tag: a POSITIVE index cannot reveal that the learner reads a
        // negative one as a negative number. See lib/questions.ts, which fixed
        // this same assignment on the base family ("evidence recorded against a
        // belief the item could not test"). The negative-index draw below still
        // carries `neg-exp`, so the concept's belief stays reachable.
        tags: [], difficulty: 0.4,
        explanation: `${b}^${e} means ${b} multiplied by itself ${e} times = ${Math.pow(b, e)}. It is NOT ${b} × ${e}.`,
      };
    }
    if (v === 1) {
      const b = r.int(2, 5), e = r.int(2, 3);
      return {
        prompt: `Work out ${b}^${-e} as a decimal (3 d.p.).`,
        value: Number((1 / Math.pow(b, e)).toFixed(3)), tolerance: { abs: 0.002 },
        wrongs: [String(-Math.pow(b, e)), String(Number((-b / e).toFixed(3))), String(Number((1 / (b * e)).toFixed(3)))],
        tags: ["neg-exp"], difficulty: 0.55,
        explanation: `A negative index flips into a fraction: ${b}^${-e} = 1/${b}^${e} = 1/${Math.pow(b, e)} = ${Number((1 / Math.pow(b, e)).toFixed(3))}. The answer is POSITIVE — the sign of the index never changes the sign of the value.`,
      };
    }
    const b = r.int(2, 4), e = r.int(2, 3);
    return {
      prompt: `Work out (${b}^${e})².`,
      value: Math.pow(b, e * 2), wrongs: [Math.pow(b, e) * 2, Math.pow(b, e + 2), Math.pow(b * 2, e)],
      // No tag: this item is about multiplying indices in a power of a power,
      // and every index in it is positive. `neg-exp` is not what a wrong answer
      // here shows — the slip is "add the indices instead of multiplying", which
      // this concept's catalogue does not name.
      tags: [], difficulty: 0.5,
      explanation: `A power of a power MULTIPLIES the indices: (${b}^${e})² = ${b}^${e * 2} = ${Math.pow(b, e * 2)}.`,
    };
  },

  // ── ALGEBRA ─────────────────────────────────────────────────────────────

  simultaneous: (r) => {
    const x = r.int(1, 7), y = r.int(1, 7);
    const a = r.int(1, 4), b = r.int(1, 4), c = r.int(1, 4), d = r.int(1, 4);
    const e1 = a * x + b * y, e2 = c * x + d * y;
    if (a * d === c * b) return { prompt: `Solve x + y = ${x + y} and 2x + 2y = ${2 * (x + y)}. These are the same line — how many solutions are there?`, value: 0, wrongs: ["1", "2", "-1"], tags: [], difficulty: 0.6, explanation: `The second equation is just twice the first, so every point on the line works: infinitely many solutions, which the bank records as 0 unique. Parallel-but-different lines would give none.` };
    return {
      prompt: `Solve the simultaneous equations:\n${a}x + ${b}y = ${e1}\n${c}x + ${d}y = ${e2}\nWhat is x?`,
      value: x, wrongs: [y, x + 1, x - 1],
      tags: ["sub-sign"], difficulty: 0.6,
      explanation: `Eliminate one variable by matching coefficients, then substitute back. Here x = ${x} (and y = ${y}). Always check BOTH equations with your pair.`,
    };
  },

  "straight-lines": (r) => {
    const m = r.int(1, 5), c = r.int(-6, 6);
    const x = r.int(1, 6);
    return {
      prompt: `A line has equation y = ${m}x ${c < 0 ? "− " + Math.abs(c) : "+ " + c}. What is y when x = ${x}?`,
      value: m * x + c, wrongs: [m * x, m * x - c, (m + c) * x],
      tags: ["grad-run"], difficulty: 0.45,
      explanation: `Substitute: y = ${m}(${x}) ${c < 0 ? "− " + Math.abs(c) : "+ " + c} = ${m * x} ${c < 0 ? "− " + Math.abs(c) : "+ " + c} = ${m * x + c}.`,
    };
  },

  quadratics: (r) => {
    const p = r.int(1, 7), q = r.int(1, 7);
    return {
      prompt: `Solve x² − ${p + q}x + ${p * q} = 0. What is the LARGER root?`,
      value: Math.max(p, q), wrongs: [Math.min(p, q), p + q, p * q],
      tags: ["lost-root"], difficulty: 0.55,
      explanation: `Factorise: (x − ${p})(x − ${q}) = 0, so x = ${p} or x = ${q}. The larger root is ${Math.max(p, q)}. Both roots are real answers — a quadratic normally has two.`,
    };
  },

  sequences: (r) => {
    const v = r.int(0, 1);
    const a = r.int(2, 9), d = r.int(2, 7);
    if (v === 0) {
      const n = r.int(5, 12);
      return {
        prompt: `A sequence starts ${a}, ${a + d}, ${a + 2 * d}, … What is the ${n}th term?`,
        value: a + (n - 1) * d, wrongs: [a + n * d, a * n, a + (n - 1) * (d + 1)],
        tags: ["nth-term"], difficulty: 0.5,
        explanation: `The nth term is a + (n − 1)d = ${a} + ${n - 1} × ${d} = ${a + (n - 1) * d}. Using n rather than n − 1 gives ${a + n * d} — an off-by-one that fails at the first term.`,
      };
    }
    const n = r.int(5, 10);
    return {
      prompt: `A sequence has nth term ${d}n + ${a}. What is the ${n}th term?`,
      value: d * n + a, wrongs: [d * n, d * n + a * n, d * (n + 1) + a],
      tags: ["nth-term"], difficulty: 0.45,
      explanation: `Substitute n = ${n}: ${d}(${n}) + ${a} = ${d * n} + ${a} = ${d * n + a}.`,
    };
  },

  functions: (r) => {
    const a = r.int(2, 5), b = r.int(1, 7), x = r.int(2, 8);
    return {
      prompt: `f(x) = ${a}x + ${b}. What is f(${x})?`,
      value: a * x + b, wrongs: [a * (x + b), a * x, (a + b) * x],
      tags: [], difficulty: 0.4,
      explanation: `Substitute x = ${x}: f(${x}) = ${a}(${x}) + ${b} = ${a * x} + ${b} = ${a * x + b}.`,
    };
  },

  surds: (r) => {
    const k = r.pick([2, 3, 5, 6, 7]);
    const sq = r.pick([4, 9, 16, 25]);
    const n = k * sq;
    const outside = Math.sqrt(sq);
    return {
      prompt: `Simplify √${n} as a√b where a is as large as possible. What is a?`,
      value: outside, wrongs: [outside + 1, k, Number(Math.sqrt(n).toFixed(3))],
      tags: ["sqrt-prod"], difficulty: 0.55,
      explanation: `√${n} = √(${sq} × ${k}) = √${sq} × √${k} = ${outside}√${k}. Take out the largest perfect square — here ${sq}.`,
    };
  },

  "completing-square": (r) => {
    const h = r.int(1, 8);
    return {
      prompt: `Write x² + ${2 * h}x + ${h * h + 5} in the form (x + p)² + q. What is q?`,
      value: 5, wrongs: [h * h + 5, -h, h * h],
      tags: ["b-half"], difficulty: 0.6,
      explanation: `Halve the x coefficient: p = ${h}, so (x + ${h})² = x² + ${2 * h}x + ${h * h}. The constant was ${h * h + 5}, so q = ${h * h + 5} − ${h * h} = 5. Forgetting to subtract the added ${h * h} is the classic error.`,
    };
  },

  "growth-decay": (r) => {
    const p = r.pick([200, 400, 500, 800]), rate = r.pick([5, 10, 20]), years = r.int(2, 4);
    const amount = p * Math.pow(1 + rate / 100, years);
    return {
      prompt: `£${p} is invested at ${rate}% compound interest per year. What is its value after ${years} years (to the nearest penny)?`,
      value: Number(amount.toFixed(2)), tolerance: { abs: 0.01, unit: "£" },
      wrongs: [Number((p * (1 + (rate * years) / 100)).toFixed(2)), Number((p * (1 + rate / 100) * years).toFixed(2)), Number((p + rate * years).toFixed(2))],
      tags: ["simple-cp"], difficulty: 0.6,
      explanation: `Compound means interest on interest: A = P(1 + r)ⁿ = ${p}(1 + ${rate / 100})^${years} = ${Number(amount.toFixed(2))}. Simple interest would give ${Number((p * (1 + (rate * years) / 100)).toFixed(2))} — the gap IS the compounding.`,
    };
  },

  "financial-maths": (r) => {
    const p = r.pick([1200, 2400, 3600]), rate = r.pick([3, 4, 5]), years = r.int(2, 5);
    const interest = (p * rate * years) / 100;
    return {
      prompt: `£${p} earns simple interest at ${rate}% per year for ${years} years. How much INTEREST is earned, in pounds?`,
      value: interest, tolerance: { abs: 0.01, unit: "£" },
      wrongs: [p + interest, (p * rate) / 100, interest * years],
      tags: ["simple-cp"], difficulty: 0.5,
      explanation: `Simple interest = P × r × n ÷ 100 = ${p} × ${rate} × ${years} ÷ 100 = £${interest}. The interest is the EXTRA, not the total (${p + interest}).`,
    };
  },

  bounds: (r) => {
    const n = r.int(20, 90) / 10;
    const half = 0.05;
    return {
      prompt: `A length is measured as ${n} cm, rounded to 1 decimal place. What is the UPPER bound, in cm?`,
      value: Number((n + half).toFixed(3)), tolerance: { abs: 0.001, unit: "cm" },
      wrongs: [Number((n - half).toFixed(3)), n, Number((n + half * 2).toFixed(3))],
      tags: ["round-half"], difficulty: 0.55,
      explanation: `Rounding to 1 d.p. means the true value could be up to half a unit of the last place higher: ${n} + 0.05 = ${Number((n + half).toFixed(2))} cm.`,
    };
  },

  "algebraic-fractions": (r) => {
    const a = r.int(2, 9), b = r.int(2, 9);
    return {
      prompt: `Simplify (x² + ${a + b}x + ${a * b}) / (x + ${a}). At x = ${a + 1}, what is the simplified expression's value?`,
      value: a + 1 + b, wrongs: [a + 1, a + b, a * b],
      tags: ["cancel-term"], difficulty: 0.7,
      explanation: `Factorise the top: (x + ${a})(x + ${b}), so the fraction is x + ${b}. At x = ${a + 1} that is ${a + 1 + b}. Cancelling term-by-term without factorising first is the error this asks you to avoid.`,
    };
  },

  "sets-venn": (r) => {
    const both = r.int(2, 8), onlyA = r.int(3, 10), onlyB = r.int(3, 10);
    const neither = r.int(1, 6);
    const total = both + onlyA + onlyB + neither;
    return {
      prompt: `In a class of ${total}, ${both + onlyA} study French, ${both + onlyB} study Spanish and ${both} study both. How many study NEITHER?`,
      value: neither, wrongs: [both, total - (both + onlyA) - (both + onlyB), 0],
      tags: ["sum-one"], difficulty: 0.55,
      explanation: `The overlap is counted twice, so subtract it once: |F ∪ S| = ${both + onlyA} + ${both + onlyB} − ${both} = ${both + onlyA + onlyB}. Neither = ${total} − ${both + onlyA + onlyB} = ${neither}.`,
    };
  },

  "number-bases": (r) => {
    // The DECIMAL value of a base-d numeral, not the numeral itself. Asking a
    // learner to type "10110" as a number and reading it back as ten thousand
    // would be a question whose displayed answer and graded answer disagree —
    // which is exactly what the first draft of this family did. Converting the
    // other way is a genuine numeric question with a genuine numeric answer.
    const v = r.int(0, 1);
    if (v === 0) {
      const digits = r.int(2, 6);
      const n = r.int(Math.pow(2, digits - 1), Math.pow(2, digits) - 1);
      const bits = n.toString(2);
      return {
        prompt: `What is the decimal (base 10) value of the binary number ${bits}₂?`,
        value: n, wrongs: [bits.length, n + 2, n - 1],
        tags: [], difficulty: 0.55,
        explanation: `${bits}₂ = ${bits.split("").map((b, i) => (b === "1" ? Math.pow(2, bits.length - 1 - i) : 0)).filter((x) => x > 0).join(" + ")} = ${n}. Each position is worth a power of 2, read right to left.`,
      };
    }
    const n = r.int(10, 60);
    const oct = n.toString(8);
    return {
      prompt: `What is the decimal (base 10) value of the octal number ${oct}₈?`,
      value: n, wrongs: [Number(oct), n + 8, n - 8],
      tags: [], difficulty: 0.55,
      explanation: `${oct}₈ = ${n}. Each octal position is worth a power of 8, so it is NOT the same as the decimal number ${Number(oct)}.`,
    };
  },

  "matrices-intro": (r) => {
    const a = r.int(1, 5), b = r.int(1, 5), c = r.int(1, 5), d = r.int(1, 5);
    return {
      prompt: `For the matrix [[${a}, ${b}], [${c}, ${d}]], what is the determinant ad − bc?`,
      value: a * d - b * c, wrongs: [a * d + b * c, a + d, b * c - a * d],
      tags: [], difficulty: 0.6,
      explanation: `Determinant = ad − bc = ${a}×${d} − ${b}×${c} = ${a * d} − ${b * c} = ${a * d - b * c}. It is zero exactly when the matrix has no inverse.`,
    };
  },

  polynomials: (r) => {
    const a = r.int(1, 5), b = r.int(1, 5), x = r.int(2, 5);
    return {
      prompt: `p(x) = x³ + ${a}x² − ${b}x + ${a * b}. What is p(${x})?`,
      value: Math.pow(x, 3) + a * x * x - b * x + a * b,
      wrongs: [Math.pow(x, 3) + a * x * x - b * x, Math.pow(x, 3) + a * x - b + a * b, Math.pow(x, 3) + a * x * x + b * x + a * b],
      tags: [], difficulty: 0.65,
      explanation: `Substitute x = ${x} term by term: ${x}³ = ${Math.pow(x, 3)}, +${a}(${x}²) = ${a * x * x}, −${b}(${x}) = ${b * x}, +${a * b}. Total ${Math.pow(x, 3) + a * x * x - b * x + a * b}. Keep every sign with its term.`,
    };
  },

  binomial: (r) => {
    const n = r.int(2, 4), a = r.int(1, 4);
    // coefficient of x^k in (1 + ax)^n is C(n,k) a^k
    const k = r.int(1, n);
    const comb = (N: number, K: number) => { let v = 1; for (let i = 1; i <= K; i++) v = (v * (N - K + i)) / i; return v; };
    const coeff = comb(n, k) * Math.pow(a, k);
    return {
      prompt: `In the expansion of (1 + ${a}x)^${n}, what is the coefficient of x^${k}?`,
      value: coeff, wrongs: [Math.pow(a, k), comb(n, k), coeff + a],
      tags: ["row-n"], difficulty: 0.7,
      explanation: `The x^${k} term is C(${n},${k}) × (${a}x)^${k} = ${comb(n, k)} × ${Math.pow(a, k)}x^${k}, so the coefficient is ${coeff}.`,
    };
  },

  "sim-equations-quad": (r) => {
    const p = r.int(1, 5), q = r.int(1, 5);
    return {
      prompt: `Solve y = x² and y = ${p + q}x − ${p * q}. The line meets the curve at two points. What is the LARGER x?`,
      value: Math.max(p, q), wrongs: [Math.min(p, q), p + q, p * q],
      tags: ["lost-root"], difficulty: 0.65,
      explanation: `Set them equal: x² − ${p + q}x + ${p * q} = 0, so (x − ${p})(x − ${q}) = 0. The larger x is ${Math.max(p, q)}. Two solutions, because a line can cut a parabola twice.`,
    };
  },

  iteration: (r) => {
    const a = r.int(2, 9);
    const start = r.int(1, 4);
    const next = Math.sqrt(a + start);
    return {
      prompt: `Use the iteration xₙ₊₁ = √(${a} + xₙ) starting from x₀ = ${start}. What is x₁, to 4 decimal places?`,
      value: Number(next.toFixed(4)), tolerance: { abs: 0.001 },
      wrongs: [Number((a + start).toFixed(4)), Number((start + a / start).toFixed(4)), Number(Math.sqrt(a).toFixed(4))],
      tags: [], difficulty: 0.6,
      explanation: `Feed the current value back in: x₁ = √(${a} + ${start}) = √${a + start} = ${Number(next.toFixed(4))}. Repeat and the digits settle on the solution.`,
    };
  },

  logs: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const b = r.pick([2, 3, 10]), e = r.int(2, 5);
      return {
        prompt: `What is log base ${b} of ${Math.pow(b, e)}?`,
        value: e, wrongs: [Math.pow(b, e), b * e, e - 1],
        tags: [], difficulty: 0.5,
        explanation: `log base ${b} asks "what power of ${b} gives this?" Since ${b}^${e} = ${Math.pow(b, e)}, the answer is ${e}.`,
      };
    }
    const b = r.pick([2, 3, 10]), e1 = r.int(2, 4), e2 = r.int(2, 3);
    return {
      prompt: `What is log base ${b} of ${Math.pow(b, e1)} plus log base ${b} of ${Math.pow(b, e2)}?`,
      value: e1 + e2, wrongs: [e1 * e2, Math.pow(b, e1) + Math.pow(b, e2), e1 - e2],
      tags: [], difficulty: 0.6,
      explanation: `Adding logs multiplies the arguments: log${b}(${Math.pow(b, e1)} × ${Math.pow(b, e2)}) = log${b}(${Math.pow(b, e1 + e2)}) = ${e1 + e2}.`,
    };
  },

  "trig-ratios": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const hyp = r.pick([10, 13, 20, 26]);
      return {
        prompt: `In a right-angled triangle the hypotenuse is ${hyp} cm and one angle is 30°. How long is the side OPPOSITE that angle, in cm?`,
        value: hyp / 2, tolerance: { unit: "cm" },
        wrongs: [hyp, Number((hyp * 0.866).toFixed(2)), Math.round(hyp / 3)],
        tags: ["hyp-leg-trig"], difficulty: 0.5,
        explanation: `sin 30° = 0.5 = opposite/hypotenuse, so opposite = 0.5 × ${hyp} = ${hyp / 2} cm.`,
      };
    }
    const adj = r.pick([6, 8, 9, 12]), angle = r.pick([30, 45, 60]);
    const hyp = adj / Math.cos((angle * Math.PI) / 180);
    return {
      prompt: `In a right-angled triangle the side ADJACENT to a ${angle}° angle is ${adj} cm. How long is the hypotenuse, in cm (1 d.p.)?`,
      value: Number(hyp.toFixed(1)), tolerance: { abs: 0.1, unit: "cm" },
      wrongs: [Number((adj * Math.cos((angle * Math.PI) / 180)).toFixed(1)), Number((adj / Math.sin((angle * Math.PI) / 180)).toFixed(1)), adj],
      tags: ["hyp-leg-trig"], difficulty: 0.55,
      explanation: `cos ${angle}° = adjacent/hypotenuse, so hypotenuse = ${adj} ÷ cos ${angle}° = ${Number(hyp.toFixed(1))} cm. Dividing by the cosine (not multiplying) is the whole step.`,
    };
  },

  pythagoras: (r) => {
    const triples: Array<[number, number, number]> = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
    const [a, b, c] = r.pick(triples);
    return {
      prompt: `A right-angled triangle has legs ${a} cm and ${b} cm. How long is the hypotenuse, in cm?`,
      value: c, tolerance: { unit: "cm" },
      wrongs: [a + b, c + 1, c - 1],
      tags: ["hyp-leg"], difficulty: 0.45,
      explanation: `a² + b² = c²: ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, so c = √${c * c} = ${c} cm.`,
    };
  },

  "angles-lines": (r) => {
    const a = r.int(30, 150);
    return {
      prompt: `Two angles on a straight line are ${a}° and x°. What is x, in degrees?`,
      value: 180 - a, wrongs: [a, 360 - a, 90 - a],
      tags: ["alt-corr"], difficulty: 0.35,
      explanation: `Angles on a straight line sum to 180°: x = 180 − ${a} = ${180 - a}°.`,
    };
  },

  "area-perimeter": (r) => {
    const v = r.int(0, 2);
    const l = r.int(3, 15), w = r.int(2, 12);
    if (v === 0) {
      return {
        prompt: `A rectangle is ${l} cm by ${w} cm. What is its AREA, in cm²?`,
        value: l * w, tolerance: { unit: "cm²" }, wrongs: [2 * (l + w), l + w, l * w + l],
        tags: [], difficulty: 0.35,
        explanation: `Area = length × width = ${l} × ${w} = ${l * w} cm². The answer is in SQUARE centimetres, and ${2 * (l + w)} is the perimeter, not the area.`,
      };
    }
    if (v === 1) {
      return {
        prompt: `A rectangle is ${l} cm by ${w} cm. What is its PERIMETER, in cm?`,
        value: 2 * (l + w), tolerance: { unit: "cm" }, wrongs: [l * w, l + w, 2 * l + w],
        tags: [], difficulty: 0.35,
        explanation: `Perimeter = 2(length + width) = 2(${l} + ${w}) = ${2 * (l + w)} cm. It is a LENGTH; ${l * w} would be the area.`,
      };
    }
    const t = r.int(3, 12), h = r.int(2, 10);
    return {
      prompt: `A triangle has base ${t} cm and perpendicular height ${h} cm. What is its area, in cm²?`,
      value: (t * h) / 2, tolerance: { abs: 0.01, unit: "cm²" }, wrongs: [t * h, t + h, (t * h) / 4],
      tags: [], difficulty: 0.4,
      explanation: `Area = ½ × base × height = ½ × ${t} × ${h} = ${(t * h) / 2} cm². Forgetting the ½ doubles the answer.`,
    };
  },

  volume: (r) => {
    const v = r.int(0, 1);
    const l = r.int(2, 9), w = r.int(2, 9), h = r.int(2, 9);
    if (v === 0) {
      return {
        prompt: `A cuboid is ${l} cm × ${w} cm × ${h} cm. What is its volume, in cm³?`,
        value: l * w * h, tolerance: { unit: "cm³" }, wrongs: [2 * (l * w + w * h + l * h), l + w + h, l * w],
        tags: [], difficulty: 0.4,
        explanation: `Volume = ${l} × ${w} × ${h} = ${l * w * h} cm³. Three lengths multiplied give a CUBIC unit — ${2 * (l * w + w * h + l * h)} is the surface area.`,
      };
    }
    const radius = r.int(2, 6);
    return {
      prompt: `A cylinder has radius ${radius} cm and height ${h} cm. Its volume is kπ cm³. What is k?`,
      value: radius * radius * h, tolerance: { unit: "cm³" }, wrongs: [2 * radius * h, radius * h, radius * radius],
      tags: [], difficulty: 0.5,
      explanation: `V = πr²h = π × ${radius}² × ${h} = ${radius * radius * h}π cm³. The radius is SQUARED; 2r is the circumference factor, not this one.`,
    };
  },

  vectors: (r) => {
    const a1 = r.int(-6, 6), a2 = r.int(-6, 6), b1 = r.int(-6, 6), b2 = r.int(-6, 6);
    return {
      prompt: `Vector a = (${a1}, ${a2}) and b = (${b1}, ${b2}). What is the x-component of a + b?`,
      value: a1 + b1, wrongs: [a1 - b1, a1 * b1, a2 + b2],
      tags: ["vec-dir"], difficulty: 0.45,
      explanation: `Vectors add component by component: x = ${a1} + ${b1} = ${a1 + b1}. Direction is half the information — keep the signs.`,
    };
  },

  averages: (r) => {
    const v = r.int(0, 2);
    const nums = Array.from({ length: 5 }, () => r.int(2, 20));
    const sorted = [...nums].sort((x, y) => x - y);
    if (v === 0) {
      const sum = nums.reduce((s, n) => s + n, 0);
      return {
        prompt: `What is the MEAN of ${nums.join(", ")}? (2 d.p.)`,
        value: Number((sum / nums.length).toFixed(2)), tolerance: { abs: 0.01 },
        wrongs: [sum, sorted[2], Number((sum / (nums.length - 1)).toFixed(2))],
        tags: ["outlier-mean"], difficulty: 0.4,
        explanation: `Add them (${sum}) and divide by how many there are (${nums.length}): ${Number((sum / nums.length).toFixed(2))}.`,
      };
    }
    if (v === 1) {
      return {
        prompt: `What is the MEDIAN of ${nums.join(", ")}?`,
        value: sorted[2], wrongs: [Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2)), sorted[0], sorted[4]],
        tags: ["outlier-mean"], difficulty: 0.4,
        explanation: `Put them in order: ${sorted.join(", ")}. With five values the median is the middle one, ${sorted[2]}.`,
      };
    }
    return {
      prompt: `What is the RANGE of ${nums.join(", ")}?`,
      value: sorted[4] - sorted[0], wrongs: [sorted[4], sorted[0], sorted[2]],
      tags: [], difficulty: 0.35,
      explanation: `Range = largest − smallest = ${sorted[4]} − ${sorted[0]} = ${sorted[4] - sorted[0]}. It measures spread, not position.`,
    };
  },

  "data-charts": (r) => {
    const values = Array.from({ length: 4 }, () => r.int(2, 12));
    const total = values.reduce((s, n) => s + n, 0);
    return {
      prompt: `A bar chart shows four categories with values ${values.join(", ")}. What is the TOTAL of the four bars?`,
      value: total, wrongs: [Math.round(total / 4), total + values[0], Math.max(...values)],
      tags: [], difficulty: 0.35,
      explanation: `Add the bars: ${values.join(" + ")} = ${total}. ${Math.round(total / 4)} would be the mean, which the question did not ask for.`,
    };
  },

  "scatter-correlation": (r) => {
    const pts: Array<[number, number]> = [[1, 2], [2, 4], [3, 6], [4, 8], [5, 10]];
    const j = r.int(0, 4);
    const [x, y] = pts[j];
    return {
      prompt: `Five points on a scatter graph are (1, 2), (2, 4), (3, 6), (4, 8) and (5, 10). Using the line of best fit y = 2x, what is the predicted y when x = ${x}?`,
      value: 2 * x, wrongs: [x, x + 2, 2 * x + 2],
      tags: ["corr-cause"], difficulty: 0.4,
      explanation: `Substitute into the line of best fit: y = 2 × ${x} = ${2 * x}. Every point lies exactly on it, which is why the correlation here is perfect — real data rarely is.`,
    };
  },

  "proportional-graphs": (r) => {
    const k = r.int(2, 8), x = r.int(2, 9);
    return {
      prompt: `y is directly proportional to x, and y = ${k * 3} when x = 3. What is y when x = ${x}?`,
      value: k * x, wrongs: [k * 3, k + x, Math.round(k / x * 10) / 10],
      tags: ["inv-prop"], difficulty: 0.5,
      explanation: `Direct proportion means y = kx. Find k first: k = ${k * 3} ÷ 3 = ${k}. Then y = ${k} × ${x} = ${k * x}.`,
    };
  },

  transformations: (r) => {
    const k = r.int(2, 5), l = r.int(2, 8);
    return {
      prompt: `A square of side ${l} cm is enlarged by scale factor ${k}. What is its new AREA, in cm²?`,
      value: k * k * l * l, tolerance: { unit: "cm²" },
      wrongs: [k * l * l, k * l, k * k * l],
      tags: ["sf-area"], difficulty: 0.55,
      explanation: `Lengths scale by ${k}, so areas scale by ${k}² = ${k * k}: new area = ${k * k} × ${l}² = ${k * k * l * l} cm². Scaling the area by ${k} instead is the classic error.`,
    };
  },

  "circle-theorems": (r) => {
    const angle = r.pick([20, 25, 30, 35, 40]);
    return {
      prompt: `An angle at the circumference is ${angle}°, standing on a particular arc. What is the angle at the CENTRE standing on the SAME arc, in degrees?`,
      value: 2 * angle, wrongs: [angle, 180 - angle, 90 - angle],
      tags: ["same-seg"], difficulty: 0.5,
      explanation: `The angle at the centre is TWICE the angle at the circumference on the same arc: 2 × ${angle} = ${2 * angle}°. The "same arc" is the condition that makes it true.`,
    };
  },

  "circle-geometry-adv": (r) => {
    const angle = r.pick([25, 35, 40, 50]);
    return {
      prompt: `A tangent and a chord meet at ${angle}°. By the alternate segment theorem, what is the angle in the alternate segment, in degrees?`,
      value: angle, wrongs: [2 * angle, 180 - angle, 90 - angle],
      tags: ["alt-seg"], difficulty: 0.55,
      explanation: `The tangent–chord angle EQUALS the angle in the alternate segment: ${angle}°. Doubling it (${2 * angle}°) would be the centre rule, which is a different theorem.`,
    };
  },

  kinematics: (r) => {
    const u = r.int(2, 10), a = r.int(2, 5), t = r.int(2, 6);
    return {
      prompt: `A body starts at ${u} m/s and accelerates at ${a} m/s² for ${t} s. What is its final velocity, in m/s?`,
      value: u + a * t, tolerance: { unit: "m/s" },
      wrongs: [u * t, a * t, u + a],
      tags: [], difficulty: 0.45,
      explanation: `v = u + at = ${u} + ${a} × ${t} = ${u + a * t} m/s.`,
    };
  },

  "calculus-diff": (r) => {
    const a = r.int(2, 6), n = r.int(2, 4), x = r.int(1, 5);
    return {
      prompt: `y = ${a}x^${n}. What is dy/dx at x = ${x}?`,
      value: a * n * Math.pow(x, n - 1),
      wrongs: [a * Math.pow(x, n), a * n * Math.pow(x, n), a * n],
      tags: [], difficulty: 0.65,
      explanation: `Differentiate by the power rule: dy/dx = ${a * n}x^${n - 1}. At x = ${x}: ${a * n} × ${x}^${n - 1} = ${a * n * Math.pow(x, n - 1)}.`,
    };
  },

  "calculus-int": (r) => {
    const a = r.int(2, 6), n = r.int(1, 3), x = r.int(1, 4);
    const upper = a * Math.pow(x, n + 1) / (n + 1);
    return {
      prompt: `What is the definite integral of ${a}x^${n} from 0 to ${x}?`,
      value: Number(upper.toFixed(3)), tolerance: { abs: 0.01 },
      wrongs: [a * Math.pow(x, n), a * Math.pow(x, n) * (n + 1), Number((upper * (n + 1)).toFixed(3))],
      tags: [], difficulty: 0.7,
      explanation: `Integrate: ${a}x^${n} → ${a}x^${n + 1}/${n + 1}. Evaluate from 0 to ${x}: ${Number(upper.toFixed(3))}. The power goes UP by one and the new power divides.`,
    };
  },

  // ── PHYSICS ─────────────────────────────────────────────────────────────

  "newton-laws": (r) => {
    const m = r.int(2, 12), a = r.int(2, 6);
    return {
      prompt: `A ${m} kg mass experiences an acceleration of ${a} m/s². What is the resultant force, in newtons?`,
      value: m * a, tolerance: { unit: "N" },
      wrongs: [m + a, Math.round(m / a), m * a * 10],
      tags: ["fma-v"], difficulty: 0.4,
      explanation: `F = ma = ${m} × ${a} = ${m * a} N. Resultant force, not any single force.`,
    };
  },

  momentum: (r) => {
    const m = r.int(2, 12), v = r.int(2, 15);
    return {
      prompt: `What is the momentum of a ${m} kg object moving at ${v} m/s, in kg m/s?`,
      value: m * v, tolerance: { unit: "kg m/s" },
      wrongs: [Math.round(m / v), m + v, Math.round(0.5 * m * v * v)],
      tags: ["con-pair"], difficulty: 0.4,
      explanation: `p = mv = ${m} × ${v} = ${m * v} kg m/s. Momentum is mass times velocity; ${Math.round(0.5 * m * v * v)} is kinetic energy, a different quantity.`,
    };
  },

  "energy-conservation": (r) => {
    const m = r.int(1, 10), v = r.int(2, 12);
    return {
      prompt: `What is the kinetic energy of a ${m} kg object moving at ${v} m/s, in joules?`,
      value: 0.5 * m * v * v, tolerance: { abs: 0.01, unit: "J" },
      wrongs: [m * v, m * v * v, Math.round(0.5 * m * v)],
      tags: ["ke-mass"], difficulty: 0.5,
      explanation: `KE = ½mv² = ½ × ${m} × ${v}² = ${0.5 * m * v * v} J. The velocity is SQUARED, which is why doubling speed quadruples the energy.`,
    };
  },

  "work-power": (r) => {
    const v = r.int(0, 1);
    const f = r.int(10, 200), d = r.int(2, 20);
    if (v === 0) {
      return {
        prompt: `A force of ${f} N moves an object ${d} m. How much work is done, in joules?`,
        value: f * d, tolerance: { unit: "J" },
        wrongs: [f + d, Math.round(f / d), f * d * 10],
        tags: ["eff-frac"], difficulty: 0.4,
        explanation: `Work = force × distance = ${f} × ${d} = ${f * d} J.`,
      };
    }
    const w = r.int(100, 900), t = r.int(2, 20);
    return {
      prompt: `${w} J of work is done in ${t} s. What is the power, in watts?`,
      value: w / t, tolerance: { abs: 0.01, unit: "W", display: String(Number((w / t).toFixed(2))) },
      wrongs: [w * t, t, w - t],
      tags: ["eff-frac"], difficulty: 0.45,
      explanation: `Power = work ÷ time = ${w} ÷ ${t} = ${Number((w / t).toFixed(2))} W. Power is the RATE of energy transfer, not the amount.`,
    };
  },

  "waves-basics": (r) => {
    const f = r.pick([2, 4, 5, 10, 20]), wl = r.pick([2, 3, 5, 10]);
    return {
      prompt: `A wave has frequency ${f} Hz and wavelength ${wl} m. What is its speed, in m/s?`,
      value: f * wl, tolerance: { unit: "m/s" },
      wrongs: [Math.round(f / wl), f + wl, Math.round(wl / f * 100) / 100],
      tags: ["freq-pitch"], difficulty: 0.4,
      explanation: `v = fλ = ${f} × ${wl} = ${f * wl} m/s. Frequency × wavelength is speed; adding them measures nothing.`,
    };
  },

  "electricity-circuits": (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      const I = r.int(2, 10), R = r.int(2, 20);
      return {
        prompt: `A current of ${I} A flows through a resistance of ${R} Ω. What is the voltage across it, in volts?`,
        value: I * R, tolerance: { unit: "V" },
        wrongs: [I + R, Math.round(R / I), I * R * 10],
        tags: ["series-par"], difficulty: 0.4,
        explanation: `V = IR = ${I} × ${R} = ${I * R} V.`,
      };
    }
    if (v === 1) {
      const R1 = r.int(2, 20), R2 = r.int(2, 20);
      return {
        prompt: `Two resistors, ${R1} Ω and ${R2} Ω, are in SERIES. What is the total resistance, in ohms?`,
        value: R1 + R2, tolerance: { unit: "Ω" },
        wrongs: [Number(((R1 * R2) / (R1 + R2)).toFixed(2)), Math.abs(R1 - R2), R1 * R2],
        tags: ["series-par"], difficulty: 0.4,
        explanation: `In series resistances ADD: ${R1} + ${R2} = ${R1 + R2} Ω. ${Number(((R1 * R2) / (R1 + R2)).toFixed(2))} Ω would be the parallel value, which is always SMALLER than either.`,
      };
    }
    const R1 = r.int(2, 20), R2 = r.int(2, 20);
    return {
      prompt: `Two resistors, ${R1} Ω and ${R2} Ω, are in PARALLEL. What is the total resistance, in ohms (2 d.p.)?`,
      value: Number(((R1 * R2) / (R1 + R2)).toFixed(2)), tolerance: { abs: 0.02, unit: "Ω" },
      wrongs: [R1 + R2, Math.abs(R1 - R2), R1 * R2],
      tags: ["series-par"], difficulty: 0.6,
      explanation: `1/R = 1/${R1} + 1/${R2}, so R = (${R1}×${R2})/(${R1}+${R2}) = ${Number(((R1 * R2) / (R1 + R2)).toFixed(2))} Ω. Adding them (${R1 + R2}) is the series rule — parallel resistance is always smaller than the smallest branch.`,
    };
  },

  magnetism: (r) => {
    const n = r.pick([50, 100, 200, 400]);
    const dPhi = r.pick([0.02, 0.05, 0.1]);
    const dt = r.pick([0.1, 0.2, 0.5]);
    const emf = (n * dPhi) / dt;
    return {
      prompt: `A coil of ${n} turns has its magnetic flux changed by ${dPhi} Wb in ${dt} s. What EMF is induced, in volts?`,
      value: Number(emf.toFixed(2)), tolerance: { abs: 0.01, unit: "V" },
      wrongs: [Number((dPhi / dt).toFixed(2)), Number((n * dPhi * dt).toFixed(2)), n],
      tags: ["motor-gen"], difficulty: 0.6,
      explanation: `EMF = N × (ΔΦ/Δt) = ${n} × (${dPhi}/${dt}) = ${Number(emf.toFixed(2))} V. A faster change or more turns both raise it.`,
    };
  },

  "pressure-fluids": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const f = r.int(20, 500), a = r.int(2, 20);
      return {
        prompt: `A force of ${f} N acts on an area of ${a} m². What is the pressure, in pascals?`,
        value: Number((f / a).toFixed(2)), tolerance: { abs: 0.01, unit: "Pa" },
        wrongs: [f * a, f - a, a],
        tags: [], difficulty: 0.4,
        explanation: `Pressure = force ÷ area = ${f} ÷ ${a} = ${Number((f / a).toFixed(2))} Pa. The same force over a smaller area is a bigger pressure — that is why a drawing pin works.`,
      };
    }
    const rho = r.pick([1000, 800, 13600]), depth = r.int(1, 20);
    const g = 10;
    return {
      prompt: `What is the pressure ${depth} m below the surface of a fluid of density ${rho} kg/m³? (g = ${g} N/kg). Give your answer in pascals.`,
      value: rho * g * depth, tolerance: { unit: "Pa" },
      wrongs: [rho * depth, g * depth, rho * g],
      tags: [], difficulty: 0.55,
      explanation: `p = ρgh = ${rho} × ${g} × ${depth} = ${rho * g * depth} Pa. Depth matters, not the shape of the container.`,
    };
  },

  "atoms-nucleus": (r) => {
    const protons = r.int(2, 20), neutrons = r.int(2, 25);
    const v = r.int(0, 2);
    if (v === 0) return {
      prompt: `An atom has ${protons} protons and ${neutrons} neutrons. What is its mass number?`,
      value: protons + neutrons, wrongs: [protons, neutrons, protons - neutrons],
      tags: [], difficulty: 0.35,
      explanation: `Mass number = protons + neutrons = ${protons} + ${neutrons} = ${protons + neutrons}. The mass number counts both nucleons.`,
    };
    if (v === 1) return {
      prompt: `An atom has ${protons} protons and ${neutrons} neutrons. What is its atomic (proton) number?`,
      value: protons, wrongs: [neutrons, protons + neutrons, neutrons - protons],
      tags: [], difficulty: 0.35,
      explanation: `The atomic number is the number of PROTONS = ${protons}. It is what identifies the element; neutrons vary between isotopes.`,
    };
    return {
      prompt: `An atom has ${protons} protons, ${neutrons} neutrons and ${protons} electrons. What is its overall charge?`,
      value: 0, wrongs: [protons, -protons, neutrons],
      tags: [], difficulty: 0.4,
      explanation: `Protons (+) and electrons (−) balance exactly: ${protons} − ${protons} = 0. The atom is neutral — lose an electron and it becomes a positive ion.`,
    };
  },

  astrophysics: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const ly = r.pick([4, 8, 10, 100]);
      return {
        prompt: `A star is ${ly} light-years away. How many years does its light take to reach us?`,
        value: ly, wrongs: [ly * 2, Math.round(ly / 2), ly * 1000],
        tags: [], difficulty: 0.4,
        explanation: `A light-year is the DISTANCE light travels in one year, so light from ${ly} light-years away takes ${ly} years. Looking out is looking back in time.`,
      };
    }
    const m = r.int(2, 9);
    return {
      prompt: `A main-sequence star has a mass ${m} times the Sun's. Using the rough rule L ∝ M³, what is its luminosity in solar units?`,
      value: Math.pow(m, 3), wrongs: [m, Math.pow(m, 2), m * 3],
      tags: [], difficulty: 0.6,
      explanation: `L ∝ M³, so a star ${m}× the Sun's mass is ${m}³ = ${Math.pow(m, 3)}× as luminous. The cube is why massive stars are so short-lived.`,
    };
  },

  // ── CHEMISTRY ───────────────────────────────────────────────────────────

  "atoms-elements": (r) => {
    const z = r.pick([1, 2, 6, 8, 11, 17]);
    const names: Record<number, string> = { 1: "hydrogen", 2: "helium", 6: "carbon", 8: "oxygen", 11: "sodium", 17: "chlorine" };
    return {
      prompt: `An element has ${z} protons. How many electrons does a NEUTRAL atom of it have?`,
      value: z, wrongs: [z + 1, z - 1, 0],
      tags: [], difficulty: 0.35,
      explanation: `A neutral atom has equal protons and electrons, so ${z} protons means ${z} electrons (${names[z]}). Charge only appears when electrons are gained or lost.`,
    };
  },

  "compounds-mixtures": (r) => {
    const a = r.int(1, 4), b = r.int(1, 4);
    return {
      prompt: `A compound forms from element X (valency ${a}) and element Y (valency ${b}). In the formula XₚY_q, what is p + q when they are in their simplest whole-number ratio?`,
      value: (b / gcd(a, b)) + (a / gcd(a, b)), wrongs: [a + b, a * b, 2],
      tags: [], difficulty: 0.6,
      explanation: `Swap the valencies: X takes Y's valency (${b}) and Y takes X's (${a}), giving X${b / gcd(a, b)}Y${a / gcd(a, b)}. So p + q = ${(b / gcd(a, b)) + (a / gcd(a, b))}. The total charge must cancel.`,
    };
  },

  "electron-shells": (r) => {
    const n = r.pick([2, 3, 4]);
    const counts: Record<number, number> = { 2: 2, 3: 8, 4: 18 };
    return {
      prompt: `What is the MAXIMUM number of electrons the shell with principal quantum number n = ${n} can hold?`,
      value: counts[n], wrongs: [n * 2, n * n, counts[n] + 2],
      tags: [], difficulty: 0.5,
      explanation: `A shell holds up to 2n² electrons: 2 × ${n}² = ${counts[n]}. The n = 1 shell holds 2, n = 2 holds 8.`,
    };
  },

  "ionic-bonding": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      return {
        prompt: `A magnesium atom (2 outer electrons) reacts with oxygen (6 outer electrons). What is the charge on the magnesium ion formed?`,
        value: 2, wrongs: ["-2", "1", "6"],
        tags: [], difficulty: 0.5,
        explanation: `Metals LOSE their outer electrons to form positive ions: magnesium loses 2, giving Mg²⁺, so the charge is +2. Oxygen gains them and becomes −2.`,
      };
    }
    const g = r.int(1, 2), l = r.int(1, 2);
    return {
      prompt: `A metal forms ions of charge +${g} and a non-metal forms ions of charge −${l}. In the neutral compound, if the metal appears m times and the non-metal n times, what is m + n in the simplest ratio?`,
      value: g / gcd(g, l) + l / gcd(g, l), wrongs: [g + l, g * l, 2],
      tags: [], difficulty: 0.6,
      explanation: `Total positive charge must equal total negative: ${g}m = ${l}n. Simplest is m = ${l / gcd(g, l)}, n = ${g / gcd(g, l)}, so m + n = ${g / gcd(g, l) + l / gcd(g, l)}.`,
    };
  },

  "covalent-bonding": (r) => {
    const v = r.pick([2, 3, 4]);
    return {
      prompt: `A molecule has ${v} shared pairs of electrons between two atoms. How many electrons in total are involved in the bond?`,
      value: v * 2, wrongs: [v, v * 4, v + 2],
      tags: [], difficulty: 0.4,
      explanation: `Each shared PAIR is 2 electrons, so ${v} pairs = ${v * 2} electrons. A single bond is 1 pair (2 electrons), a double bond 2 pairs (4).`,
    };
  },

  "equations-stoich": (r) => {
    const a = r.int(2, 4), b = r.int(2, 4);
    return {
      prompt: `For the equation ${a}H₂ + O₂ → ${a}H₂O, how many oxygen atoms are on the LEFT-hand side in total?`,
      value: 2, wrongs: [a, a * 2, 1],
      tags: ["mass-balance"], difficulty: 0.45,
      explanation: `There is one O₂ molecule on the left, and each O₂ has 2 atoms, so 2 oxygen atoms. The ${a} in front of H₂ multiplies hydrogen only.`,
    };
  },

  "rates-reaction": (r) => {
    const t = r.pick([20, 25, 40, 50]), vol = r.pick([20, 40, 60, 80]);
    return {
      prompt: `${vol} cm³ of gas is produced in ${t} s. What is the average rate of reaction, in cm³/s?`,
      value: Number((vol / t).toFixed(3)), tolerance: { abs: 0.01, unit: "cm³/s" },
      wrongs: [vol * t, t, Number((t / vol).toFixed(3))],
      tags: [], difficulty: 0.45,
      explanation: `Rate = amount ÷ time = ${vol} ÷ ${t} = ${Number((vol / t).toFixed(3))} cm³/s. Dividing the wrong way gives a tiny number — the units catch it.`,
    };
  },

  "energy-changes": (r) => {
    const m = r.int(1, 4), dT = r.int(5, 30), c = 4200;
    return {
      prompt: `How much energy is needed to raise ${m} kg of water by ${dT} °C? (c = ${c} J/kg°C). Give your answer in joules.`,
      value: m * c * dT, tolerance: { unit: "J" },
      wrongs: [m * dT, c * dT, m * c * dT * 10],
      tags: [], difficulty: 0.5,
      explanation: `Q = mcΔT = ${m} × ${c} × ${dT} = ${m * c * dT} J. All three multiply.`,
    };
  },

  "acids-bases": (r) => {
    const h = r.int(1, 5);
    const ph = -Math.log10(Math.pow(10, -h));
    return {
      prompt: `A solution has a hydrogen ion concentration of 1 × 10^−${h} mol/dm³. What is its pH?`,
      value: h, wrongs: [ph, 14 - h, h * 10],
      tags: ["strong-conc"], difficulty: 0.55,
      explanation: `pH = −log₁₀[H⁺] = −log₁₀(10^−${h}) = ${h}. The pH scale is logarithmic, so a change of 1 is a tenfold change in concentration.`,
    };
  },

  electrolysis: (r) => {
    const I = r.int(1, 5), t = r.int(60, 600);
    const charge = I * t;
    return {
      prompt: `A current of ${I} A flows for ${t} s. How much charge passes, in coulombs?`,
      value: charge, tolerance: { unit: "C" },
      wrongs: [I, t, I + t],
      tags: [], difficulty: 0.45,
      explanation: `Charge = current × time = ${I} × ${t} = ${charge} C. It is this charge that decides how much substance is deposited.`,
    };
  },

  "organic-intro": (r) => {
    const n = r.int(1, 6);
    return {
      prompt: `An alkane has ${n} carbon atoms. Using the general formula CₙH₂ₙ₊₂, how many hydrogen atoms does it have?`,
      value: 2 * n + 2, wrongs: [2 * n, n, n * 2 - 2],
      tags: [], difficulty: 0.45,
      explanation: `CₙH₂ₙ₊₂ with n = ${n}: H = 2(${n}) + 2 = ${2 * n + 2}. Alkanes are saturated — every carbon has as many hydrogens as it can hold.`,
    };
  },

  equilibria: (r) => {
    const a = r.int(1, 3), b = r.int(1, 3), c = r.int(1, 3), d = r.int(1, 3);
    return {
      prompt: `For the equilibrium aA + bB ⇌ cC + dD, the equilibrium constant is Kc = [C]^c[D]^d / ([A]^a[B]^b). In the expression for THIS reaction, what is the exponent on [C]?`,
      value: c, wrongs: [a, d, b],
      tags: [], difficulty: 0.55,
      explanation: `Each concentration is raised to its own coefficient, so [C] carries the exponent ${c}. Products on top, reactants below — that is the whole shape of Kc.`,
    };
  },

  "analysis-tests": (r) => {
    const tests: Array<[string, string]> = [
      ["a flame test gives a lilac colour", "potassium"],
      ["a flame test gives a brick-red colour", "calcium"],
      ["dilute acid produces fizzing with limewater turning milky", "carbonate"],
    ];
    const [desc] = r.pick(tests);
    return {
      prompt: `A sample ${desc}. How many of the following are TRUE: it is a pure element, it is a compound, it is a mixture?`,
      value: 1, wrongs: ["2", "3", "0"],
      tags: [], difficulty: 0.6,
      explanation: `A positive test identifies ONE substance, which may be an element or a compound — exactly one of those three descriptions is the honest answer, so 1. The test narrows it; it does not tell you which category.`,
    };
  },

  "metallic-bonding": (r) => {
    const v = r.pick([2, 3, 4]);
    return {
      prompt: `A metal atom has ${v} outer electrons and releases them all into the delocalised sea. How many positive charges does the resulting ion carry?`,
      value: v, wrongs: [v * 2, -v, 0],
      tags: [], difficulty: 0.45,
      explanation: `Losing ${v} electrons leaves ${v} more protons than electrons, so the ion carries ${v}+ charge. The sea of these released electrons is what conducts.`,
    };
  },

  // ── BIOLOGY ─────────────────────────────────────────────────────────────

  digestion: (r) => {
    const v = r.int(0, 2);
    if (v === 0) return {
      prompt: `Starch is broken down by amylase into maltose. If a solution contains 24 starch molecules and every one is split into two maltose molecules, how many maltose molecules are produced?`,
      value: 48, wrongs: ["24", "12", "6"],
      tags: [], difficulty: 0.45,
      explanation: `One starch → two maltose, so 24 × 2 = 48. Amylase is a carbohydrase; it catalyses this specific split.`,
    };
    if (v === 1) return {
      prompt: `Lipase breaks each fat molecule into 3 fatty acids and 1 glycerol. From 5 fat molecules, how many fatty acid molecules are released?`,
      value: 15, wrongs: ["5", "20", "10"],
      tags: [], difficulty: 0.5,
      explanation: `Each fat gives 3 fatty acids, so 5 × 3 = 15. Bile emulsifies the fat first so lipase has more surface to work on.`,
    };
    return {
      prompt: `Protease breaks proteins into amino acids. A protein chain of 10 amino acids is broken into individual amino acids. How many bonds must be broken?`,
      value: 9, wrongs: ["10", "11", "5"],
      tags: [], difficulty: 0.55,
      explanation: `n amino acids are joined by n − 1 bonds, so a 10-amino-acid chain has 9 peptide bonds. Breaking all of them releases 10 amino acids.`,
    };
  },

  "breathing-gas": (r) => {
    const bpm = r.pick([12, 15, 18, 20]);
    return {
      prompt: `A person breathes ${bpm} times per minute. How many breaths do they take in one hour?`,
      value: bpm * 60, tolerance: { unit: "breaths" },
      wrongs: [bpm * 30, bpm * 100, bpm * 24],
      tags: [], difficulty: 0.4,
      explanation: `${bpm} breaths/min × 60 min = ${bpm * 60} breaths in an hour.`,
    };
  },

  diffusion: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      return {
        prompt: `Diffusion is faster when the concentration gradient is steeper. A gradient of 10 units/m over a 2 m distance gives a rate proportional to gradient ÷ distance. What is it?`,
        value: 5, wrongs: ["20", "10", "2"],
        tags: [], difficulty: 0.5,
        explanation: `Rate ∝ gradient ÷ distance = 10 ÷ 2 = 5. A shorter distance means a steeper effective gradient and faster diffusion — that is why alveoli are so thin.`,
      };
    }
    const t = r.pick([20, 30, 37, 40]);
    return {
      prompt: `The rate of diffusion increases with temperature. At ${t} °C, particles have more kinetic energy than at 20 °C. By how many degrees has the temperature risen?`,
      value: t - 20, wrongs: [t, t + 20, 20],
      tags: [], difficulty: 0.35,
      explanation: `${t} − 20 = ${t - 20} °C. Higher temperature means faster-moving particles and faster diffusion.`,
    };
  },

  respiration: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      return {
        prompt: `In aerobic respiration, 1 glucose molecule yields 32 ATP. How many ATP from 4 glucose molecules?`,
        value: 128, wrongs: ["32", "64", "16"],
        tags: [], difficulty: 0.45,
        explanation: `4 × 32 = 128 ATP. Aerobic respiration needs oxygen; without it, anaerobic respiration yields far less per glucose.`,
      };
    }
    const n = r.int(1, 5);
    return {
      prompt: `Anaerobic respiration in muscle yields 2 ATP per glucose. How many ATP from ${n} glucose molecules?`,
      value: 2 * n, wrongs: [n, n * 32, n * 4],
      tags: [], difficulty: 0.4,
      explanation: `Anaerobic yields only 2 ATP per glucose, so ${n} × 2 = ${2 * n}. That is the reason vigorous exercise cannot be sustained on anaerobic respiration alone.`,
    };
  },

  "nervous-system": (r) => {
    const speed = r.pick([20, 50, 100, 120]), dist = r.pick([1, 2, 3]);
    return {
      prompt: `A nerve impulse travels at ${speed} m/s. How long does it take to travel ${dist} m, in seconds (4 d.p.)?`,
      value: Number((dist / speed).toFixed(4)), tolerance: { abs: 0.0005, unit: "s" },
      wrongs: [Number((speed / dist).toFixed(4)), speed * dist, Number((dist / speed * 1000).toFixed(4))],
      tags: [], difficulty: 0.5,
      explanation: `time = distance ÷ speed = ${dist} ÷ ${speed} = ${Number((dist / speed).toFixed(4))} s. Myelinated neurones conduct much faster — that is what the myelin sheath buys.`,
    };
  },

  hormones: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      return {
        prompt: `Blood glucose is normally kept around 5 mmol/dm³. After a meal it rises to 8. How many mmol/dm³ above normal is that?`,
        value: 3, wrongs: ["8", "5", "13"],
        tags: [], difficulty: 0.35,
        explanation: `8 − 5 = 3 mmol/dm³ above normal. Insulin is released to bring it back down by converting glucose to glycogen.`,
      };
    }
    const d = r.pick([2, 3, 4]);
    return {
      prompt: `A hormone is released in pulses every ${d} hours. How many pulses occur in 24 hours?`,
      value: 24 / d, wrongs: [24 * d, d, 24 - d],
      tags: [], difficulty: 0.35,
      explanation: `24 ÷ ${d} = ${24 / d} pulses. Hormones act more slowly than nerve impulses but last longer.`,
    };
  },

  genetics: (r) => {
    const v = r.int(0, 2);
    if (v === 0) {
      return {
        prompt: `Two heterozygous parents (Aa × Aa) have offspring. Out of 4 offspring, how many would be expected to show the RECESSIVE phenotype?`,
        value: 1, wrongs: ["2", "3", "0"],
        tags: [], difficulty: 0.5,
        explanation: `Aa × Aa gives AA, Aa, Aa, aa — a 3:1 ratio, so 1 in 4 shows the recessive phenotype. The 3:1 ratio is the classic Mendelian result.`,
      };
    }
    if (v === 1) {
      return {
        prompt: `A heterozygous individual (Aa) is crossed with a homozygous recessive (aa). Out of 4 offspring, how many are expected to be heterozygous?`,
        value: 2, wrongs: ["1", "3", "4"],
        tags: [], difficulty: 0.5,
        explanation: `Aa × aa gives Aa, Aa, aa, aa — a 1:1 ratio, so 2 of 4 are heterozygous. This cross is the test cross used to reveal an unknown genotype.`,
      };
    }
    const n = r.int(2, 6);
    return {
      prompt: `A species has a diploid chromosome number of ${n * 2}. How many chromosomes are in each gamete?`,
      value: n, wrongs: [n * 2, n * 4, n / 2],
      tags: [], difficulty: 0.45,
      explanation: `Gametes are haploid — half the diploid number: ${n * 2} ÷ 2 = ${n}. Fusion of two gametes restores the full set.`,
    };
  },

  evolution: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const gens = r.int(3, 10), rate = r.pick([2, 5, 10]);
      return {
        prompt: `A population's mean beak depth changes by ${rate} mm per generation. After ${gens} generations, by how many mm has it changed in total?`,
        value: rate * gens, tolerance: { unit: "mm" },
        wrongs: [rate, gens, rate + gens],
        tags: [], difficulty: 0.45,
        explanation: `${rate} mm/generation × ${gens} generations = ${rate * gens} mm. Small changes per generation, compounded over many, are how natural selection produces large shifts.`,
      };
    }
    const p = r.int(10, 90);
    return {
      prompt: `In a population, ${p}% of individuals survive to reproduce. How many of a population of 200 survive?`,
      value: (p * 200) / 100, wrongs: [p, 200 - p, (p * 200) / 1000],
      tags: [], difficulty: 0.4,
      explanation: `${p}% of 200 = 200 × ${p}/100 = ${(p * 200) / 100}. Differential survival is the engine of natural selection.`,
    };
  },

  ecosystems: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const producers = r.int(1000, 9000);
      return {
        prompt: `A food chain has producers holding ${producers} kJ of energy. If only 10% passes to the next trophic level, how much energy reaches the primary consumers, in kJ?`,
        value: producers / 10, tolerance: { abs: 0.5, unit: "kJ" },
        wrongs: [producers, producers * 10, producers / 100],
        tags: [], difficulty: 0.5,
        explanation: `10% of ${producers} = ${producers / 10} kJ. The other 90% is lost as heat, movement and waste — which is why food chains are short.`,
      };
    }
    const n = r.int(3, 6);
    return {
      prompt: `A food chain has ${n} trophic levels. If 10% of energy passes between each, what fraction of the original energy reaches the top, as a decimal to 4 d.p.?`,
      value: Number(Math.pow(0.1, n - 1).toFixed(4)), tolerance: { abs: 0.00005 },
      wrongs: [Number(Math.pow(0.1, n).toFixed(4)), Number((0.1 * n).toFixed(4)), Number((1 / n).toFixed(4))],
      tags: [], difficulty: 0.65,
      explanation: `${n} levels means ${n - 1} transfers, each keeping 10%: 0.1^${n - 1} = ${Number(Math.pow(0.1, n - 1).toFixed(4))}. That is why there are rarely more than four or five levels.`,
    };
  },

  biodiversity: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const species = r.int(20, 80), lost = r.int(5, 15);
      return {
        prompt: `A habitat holds ${species} species and ${lost} are lost. What percentage of species remain (1 d.p.)?`,
        value: Number((((species - lost) / species) * 100).toFixed(1)), tolerance: { abs: 0.05, unit: "%" },
        wrongs: [Number(((lost / species) * 100).toFixed(1)), species - lost, Number(((species / lost) * 100).toFixed(1))],
        tags: [], difficulty: 0.5,
        explanation: `Remaining = ${species} − ${lost} = ${species - lost}, so ${species - lost}/${species} × 100 = ${Number((((species - lost) / species) * 100).toFixed(1))}%.`,
      };
    }
    const n = r.int(3, 8);
    return {
      prompt: `A sample of ${n} quadrats finds 4, 6, 5, 7, 3, 8, 6, 5 species respectively (take the first ${n}). What is the mean number of species per quadrat (2 d.p.)?`,
      value: Number(([4, 6, 5, 7, 3, 8, 6, 5].slice(0, n).reduce((s, x) => s + x, 0) / n).toFixed(2)),
      tolerance: { abs: 0.01 },
      wrongs: [Number(([4, 6, 5, 7, 3, 8, 6, 5].slice(0, n).reduce((s, x) => s + x, 0)).toFixed(2)), 6, n],
      tags: [], difficulty: 0.45,
      explanation: `Mean = total ÷ count = ${[4, 6, 5, 7, 3, 8, 6, 5].slice(0, n).reduce((s, x) => s + x, 0)} ÷ ${n} = ${Number(([4, 6, 5, 7, 3, 8, 6, 5].slice(0, n).reduce((s, x) => s + x, 0) / n).toFixed(2))}.`,
    };
  },

  "immune-health": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      return {
        prompt: `A vaccine causes the body to make memory cells. If a later infection would take 10 days to fight unaided but only 3 days with memory cells, how many days does the vaccine save?`,
        value: 7, wrongs: ["10", "3", "13"],
        tags: [], difficulty: 0.4,
        explanation: `10 − 3 = 7 days faster. Memory cells mean the second response starts from a much larger, better-matched population — that is the whole point of vaccination.`,
      };
    }
    const n = r.int(2, 8);
    return {
      prompt: `A population has ${n} cases of a disease in 1000 people. What is the rate per 1000 people?`,
      value: n, wrongs: [n * 10, Number((1000 / n).toFixed(2)), 1000],
      tags: [], difficulty: 0.35,
      explanation: `The rate is already per 1000, so it is ${n} per 1000 people. Rates are always reported against a stated population.`,
    };
  },

  // ── COMPUTING ───────────────────────────────────────────────────────────

  variables: (r) => {
    const a = r.int(2, 9), b = r.int(2, 9);
    return {
      prompt: `What is printed?\n\nx = ${a}\ny = ${b}\nx = x + y\nprint(x)`,
      value: a + b, wrongs: [a, b, a * b],
      tags: [], difficulty: 0.4,
      explanation: `x starts as ${a}, then is reassigned to x + y = ${a} + ${b} = ${a + b}. A variable holds the LATEST value assigned, not the first.`,
    };
  },

  conditionals: (r) => {
    const a = r.int(2, 9), b = r.int(2, 9);
    return {
      prompt: `What is printed?\n\nx = ${a}\nif x > ${b}:\n    print(1)\nelse:\n    print(0)`,
      value: a > b ? 1 : 0, wrongs: [a > b ? 0 : 1, a, b],
      tags: [], difficulty: 0.4,
      explanation: `The condition x > ${b} is ${a > b ? "true" : "false"} because ${a} ${a > b ? ">" : "≤"} ${b}, so the ${a > b ? "first" : "else"} branch runs and prints ${a > b ? 1 : 0}.`,
    };
  },

  loops: (r) => {
    const n = r.int(3, 9);
    return {
      prompt: `How many lines are printed?\n\nfor i in range(${n}):\n    print(i)`,
      value: n, wrongs: [n - 1, n + 1, n * n],
      tags: [], difficulty: 0.4,
      explanation: `range(${n}) yields ${n} values (0 to ${n - 1}), so the body runs ${n} times.`,
    };
  },

  "lists-arrays": (r) => {
    const items = Array.from({ length: 5 }, () => r.int(1, 20));
    const idx = r.int(0, 4);
    return {
      prompt: `What is printed?\n\nitems = [${items.join(", ")}]\nprint(items[${idx}])`,
      value: items[idx], wrongs: [items[idx === 0 ? 1 : idx - 1], idx, items.length],
      tags: [], difficulty: 0.45,
      explanation: `Lists are indexed from 0, so items[${idx}] is the ${idx + 1}th element: ${items[idx]}. Forgetting the zero start is the classic off-by-one.`,
    };
  },

  "functions-code": (r) => {
    const k = r.int(2, 9), x = r.int(2, 9);
    return {
      prompt: `What is printed?\n\ndef add_${k}(n):\n    return n + ${k}\n\nprint(add_${k}(${x}))`,
      value: x + k, wrongs: [x, k, x * k],
      tags: [], difficulty: 0.45,
      explanation: `The function returns n + ${k}; called with ${x} it returns ${x} + ${k} = ${x + k}.`,
    };
  },

  dictionaries: (r) => {
    const keys = ["a", "b", "c", "d"];
    const vals = Array.from({ length: 4 }, () => r.int(1, 30));
    const i = r.int(0, 3);
    return {
      prompt: `What is printed?\n\nd = {"${keys[0]}": ${vals[0]}, "${keys[1]}": ${vals[1]}, "${keys[2]}": ${vals[2]}, "${keys[3]}": ${vals[3]}}\nprint(d["${keys[i]}"])`,
      value: vals[i], wrongs: [vals[(i + 1) % 4], i, 4],
      tags: [], difficulty: 0.45,
      explanation: `A dictionary is looked up by KEY, not position: d["${keys[i]}"] is ${vals[i]}. The order you write the pairs in does not change the lookup.`,
    };
  },

  "algorithms-search": (r) => {
    const n = r.pick([8, 16, 32, 64]);
    return {
      prompt: `A sorted list of ${n} items is searched by binary search. What is the MAXIMUM number of comparisons?`,
      value: Math.log2(n), wrongs: [n, Math.log2(n) + 1, Math.ceil(Math.log2(n) * 2)],
      tags: [], difficulty: 0.6,
      explanation: `Each comparison halves the space: log₂(${n}) = ${Math.log2(n)}. Linear search would need up to ${n}.`,
    };
  },

  "algorithms-sort": (r) => {
    const n = r.int(4, 10);
    return {
      prompt: `Bubble sort compares adjacent pairs. For ${n} items, roughly how many comparisons does one full pass make?`,
      value: n - 1, wrongs: [n, n * n, n + 1],
      tags: [], difficulty: 0.5,
      explanation: `One pass compares each adjacent pair: ${n} items have ${n - 1} gaps, so ${n - 1} comparisons. The full sort repeats this up to ${n - 1} times — that is the n² cost.`,
    };
  },

  recursion: (r) => {
    const n = r.int(2, 6);
    let f = 1; for (let i = 2; i <= n; i++) f *= i;
    return {
      prompt: `What does this return?\n\ndef fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(${n}))`,
      value: f, wrongs: [n, Math.pow(2, n), f / n],
      tags: [], difficulty: 0.6,
      explanation: `fact(${n}) = ${n} × ${n - 1} × … × 1 = ${f}. The base case (n ≤ 1) is what stops the recursion — without it the function would never return.`,
    };
  },

  "binary-data": (r) => {
    const bits = r.pick([4, 8, 12, 16]);
    return {
      prompt: `How many different values can ${bits} bits represent?`,
      value: Math.pow(2, bits), wrongs: [bits * 2, Math.pow(2, bits) - 1, bits],
      tags: [], difficulty: 0.45,
      explanation: `Each bit doubles the possibilities, so ${bits} bits give 2^${bits} = ${Math.pow(2, bits)} values. If you need to count from 0, the highest value is one less.`,
    };
  },

  cybersecurity: (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      const chars = r.pick([26, 52, 62]);
      return {
        prompt: `A password uses an alphabet of ${chars} possible characters and is 2 characters long. How many possible passwords are there?`,
        value: chars * chars, wrongs: [chars * 2, Math.pow(chars, 3), chars + 2],
        tags: [], difficulty: 0.5,
        explanation: `${chars} choices per character, 2 characters: ${chars}² = ${chars * chars}. Length multiplies the space far faster than alphabet size — which is why long passphrases beat short complex ones.`,
      };
    }
    const keyBits = r.pick([8, 16, 32]);
    return {
      prompt: `A key has ${keyBits} bits. How many times harder is a key with one extra bit to guess by brute force?`,
      value: 2, wrongs: [keyBits, 1, keyBits * 2],
      tags: [], difficulty: 0.55,
      explanation: `One extra bit DOUBLES the search space, so it is 2× harder. That is why key length matters so much: every bit doubles the work for an attacker.`,
    };
  },

  "databases-sql": (r) => {
    const rows = r.int(3, 12), matching = r.int(1, rows);
    return {
      prompt: `A table has ${rows} rows. A SELECT with a WHERE clause matching ${matching} rows returns how many rows?`,
      value: matching, wrongs: [rows, rows - matching, matching * rows],
      tags: [], difficulty: 0.4,
      explanation: `WHERE filters, so only the ${matching} matching rows are returned — not all ${rows}. SELECT * with no WHERE would return everything.`,
    };
  },

  "ai-basics": (r) => {
    const v = r.int(0, 1);
    if (v === 0) {
      return {
        prompt: `A model is trained on 800 examples and tested on 200. What percentage of the data is the TEST set?`,
        value: 20, wrongs: ["80", "200", "10"],
        tags: [], difficulty: 0.4,
        explanation: `200 ÷ 1000 × 100 = 20%. The test set is kept separate so the score measures generalisation, not memorisation.`,
      };
    }
    const correct = r.int(60, 95), total = 100;
    return {
      prompt: `A classifier gets ${correct} of ${total} test examples right. What is its accuracy, as a percentage?`,
      value: correct, wrongs: [100 - correct, correct / 10, correct * 10],
      tags: [], difficulty: 0.35,
      explanation: `Accuracy = correct ÷ total × 100 = ${correct}%. On imbalanced data accuracy alone can mislead — a model that always says "no" scores well on rare events.`,
    };
  },

  "statistics-data": (r) => {
    const nums = Array.from({ length: 5 }, () => r.int(2, 30));
    const sorted = [...nums].sort((a, b) => a - b);
    return {
      prompt: `What is the MEAN of ${nums.join(", ")}? (2 d.p.)`,
      value: Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2)), tolerance: { abs: 0.01 },
      wrongs: [sorted[2], nums.reduce((s, n) => s + n, 0), Number((sorted[4] - sorted[0]).toFixed(2))],
      tags: ["outlier-mean"], difficulty: 0.4,
      explanation: `Mean = total ÷ count = ${nums.reduce((s, n) => s + n, 0)} ÷ 5 = ${Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2))}. The median would be ${sorted[2]} — different, and chosen for different reasons.`,
    };
  },

  coordinates: (r) => {
    const x1 = r.int(-8, 8), y1 = r.int(-8, 8), x2 = r.int(-8, 8), y2 = r.int(-8, 8);
    return {
      prompt: `What is the x-coordinate of the midpoint of (${x1}, ${y1}) and (${x2}, ${y2})?`,
      value: (x1 + x2) / 2, tolerance: { abs: 0.01 },
      wrongs: [(y1 + y2) / 2, x1 + x2, x2 - x1],
      tags: [], difficulty: 0.5,
      explanation: `The midpoint averages each coordinate: x = (${x1} + ${x2})/2 = ${(x1 + x2) / 2}. Averaging the y's would give the other coordinate.`,
    };
  },

  microscopy: (r) => {
    const real = r.pick([5, 10, 20, 50]), mag = r.pick([100, 200, 400, 1000]);
    return {
      prompt: `A cell ${real} μm wide is viewed at ×${mag} magnification. How wide does it appear, in μm?`,
      value: real * mag, tolerance: { unit: "μm" },
      wrongs: [real + mag, Number((real / mag).toFixed(6)), real * (mag / 10)],
      tags: [], difficulty: 0.4,
      explanation: `image = real × magnification = ${real} × ${mag} = ${real * mag} μm. The image must be bigger than the object — dividing is the warning sign.`,
    };
  },

  "loci-constructions": (r) => {
    const d = r.pick([3, 4, 5, 6]);
    return {
      prompt: `The locus of points a distance of ${d} cm from a fixed point is a circle. What is its radius, in cm?`,
      value: d, tolerance: { unit: "cm" },
      wrongs: [d * 2, d / 2, d * d],
      tags: [], difficulty: 0.4,
      explanation: `Every point at distance ${d} from the centre lies on a circle of radius ${d} cm. Doubling would give the diameter.`,
    };
  },

  "trig-identity": (r) => {
    const theta = r.pick([30, 45, 60]);
    const rad = (theta * Math.PI) / 180;
    const val = Math.sin(rad) * Math.sin(rad) + Math.cos(rad) * Math.cos(rad);
    return {
      prompt: `Using sin²θ + cos²θ = 1, what is sin²${theta}° + cos²${theta}°?`,
      value: Number(val.toFixed(3)), tolerance: { abs: 0.01 },
      wrongs: [0, 2, Number(Math.sin(rad).toFixed(3))],
      tags: [], difficulty: 0.45,
      explanation: `The identity holds for EVERY angle, so the value is 1 (here ${Number(val.toFixed(3))}, the tiny gap being floating-point rounding). It follows from the unit circle.`,
    };
  },

  "mixture-problems": (r) => {
    const a = r.int(2, 9), b = r.int(2, 9), x = r.int(2, 9);
    const y = r.int(2, 9);
    return {
      prompt: `A shop mixes ${a} kg of nuts costing £${x} per kg with ${b} kg of raisins costing £${y} per kg. What is the cost per kg of the mixture, in pounds (2 d.p.)?`,
      value: Number(((a * x + b * y) / (a + b)).toFixed(2)), tolerance: { abs: 0.01, unit: "£" },
      wrongs: [Number(((x + y) / 2).toFixed(2)), Number((a * x + b * y).toFixed(2)), Number(((a * y + b * x) / (a + b)).toFixed(2))],
      tags: [], difficulty: 0.6,
      explanation: `Total cost ÷ total mass: (${a}×${x} + ${b}×${y}) ÷ (${a}+${b}) = ${a * x + b * y} ÷ ${a + b} = £${Number(((a * x + b * y) / (a + b)).toFixed(2))} per kg. The plain average of the two prices (${Number(((x + y) / 2).toFixed(2))}) is wrong because the masses differ.`,
    };
  },

  kinematics_extra: (r) => {
    const u = r.int(2, 10), a = r.int(2, 5), t = r.int(2, 6);
    return {
      prompt: `A body starts at ${u} m/s and accelerates at ${a} m/s² for ${t} s. How far does it travel, in metres?`,
      value: u * t + 0.5 * a * t * t, tolerance: { abs: 0.01, unit: "m" },
      wrongs: [u * t, 0.5 * a * t * t, (u + a * t) * t],
      tags: [], difficulty: 0.6,
      explanation: `s = ut + ½at² = ${u}(${t}) + ½(${a})(${t}²) = ${u * t + 0.5 * a * t * t} m. The ½ is why the acceleration term is not simply at².`,
    };
  },
};

/** Greatest common divisor — used by the valency and ion-ratio items. */
function gcd(a: number, b: number): number {
  let x = Math.abs(a), y = Math.abs(b);
  while (y) { const t = y; y = x % y; x = t; }
  return x || 1;
}
