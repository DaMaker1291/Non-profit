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
      explanation: `In ${n} the columns are worth 100, 10 and 1 from the left, so every digit is scaled by the column it sits in. The ${h} hundreds are worth ${h * 100}, the ${t} tens are worth ${t * 10} and the ${o} ones are worth ${o}, and those add back to ${n}. The ${which} digit on its own is ${which === "tens" ? t : which === "hundreds" ? h : o}, but its VALUE is ${value} — writing the digit instead of the value is the usual slip, and ${value * 10} would be one column further left.`,
    };
  },

  addition: (r) => {
    const a = r.int(120, 980), b = r.int(120, 980);
    return {
      prompt: `Work out ${a} + ${b}.`,
      value: a + b, wrongs: [String(a + b + 10), String(a + b - 10), String(a + b + 100)],
      tags: [], difficulty: 0.3,
      explanation: `Write the two numbers in columns and add from the right: the ones first, then the tens, then the hundreds, carrying a ten into the next column whenever one column reaches 10. ${a} + ${b} comes to ${a + b}. The answers ${a + b + 10} and ${a + b - 10} are what a single column does when its carry is added twice or dropped.`,
    };
  },

  subtraction: (r) => {
    const a = r.int(400, 980), b = r.int(120, a - 50);
    return {
      prompt: `Work out ${a} − ${b}.`,
      value: a - b, wrongs: [String(a - b + 10), String(a - b - 10), String(b - a)],
      tags: [], difficulty: 0.3,
      explanation: `Take ${b} away from ${a} column by column, borrowing one ten from the next column whenever the digit on top is smaller than the digit below it. Working that through, ${a} − ${b} = ${a - b}. Swapping the order gives ${b - a}, a negative amount that no longer answers "how many are left", and ${a - b + 10} is what one column produces when the borrow is added instead of taken.`,
    };
  },

  multiplication: (r) => {
    const a = r.int(12, 40), b = r.int(3, 12);
    return {
      prompt: `Work out ${a} × ${b}.`,
      value: a * b, wrongs: [String(a * b + a), String(a * b - b), String(a + b)],
      tags: [], difficulty: 0.35,
      explanation: `${a} × ${b} means ${b} lots of ${a}, which comes to ${a * b}. Multiplying in two steps is the reliable way to get there: ${a} × ${b - 1} = ${a * (b - 1)}, and one more ${a} takes it to ${a * b}. Adding the two numbers instead (${a + b}) is the commonest slip, and it is not multiplication at all — ${b} lots of ${a} is far more than the two numbers added together.`,
    };
  },

  division: (r) => {
    const b = r.int(3, 12), q = r.int(3, 12);
    const a = b * q;
    return {
      prompt: `Work out ${a} ÷ ${b}.`,
      value: q, wrongs: [String(q + 1), String(q - 1), String(b)],
      tags: [], difficulty: 0.35,
      explanation: `${a} ÷ ${b} asks how many groups of ${b} fit into ${a}. Since ${b} × ${q} = ${a}, the answer is ${q}, and multiplying back is the check that catches a slip. The options ${q + 1} and ${q - 1} are one group too many and one group too few, and ${b} is the size of the group rather than how many of them there are.`,
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
        explanation: `Start at ${a} on the number line and move ${b} places to the right, because adding a positive number always moves right. That lands on ${a + b}. Subtracting ${b} instead (${a - b}) moves the wrong way, and ${-(a + b)} flips the sign of the answer as though the sum were a distance from zero rather than a position.`,
      };
    }
    if (v === 1) {
      const a = r.int(2, 9), b = r.int(-9, -2);
      return {
        prompt: `Work out ${a} − (${b}).`,
        value: a - b, wrongs: [String(a + b), String(b - a), String(-(a - b))],
        tags: ["neg-slip"], difficulty: 0.45,
        explanation: `Taking away a negative is the same as adding the positive version of it, because removing a debt increases what you have: ${a} − (${b}) = ${a} + ${Math.abs(b)} = ${a - b}. Adding the negative instead (${a + b}) keeps the sign it was supposed to remove, and subtracting the other way round (${b - a}) changes which number is being taken away.`,
      };
    }
    const a = r.int(-6, -2), b = r.int(-6, -2);
    return {
      prompt: `Work out (${a}) × (${b}).`,
      value: a * b, wrongs: [String(a * b * -1), String(a + b), String(Math.abs(a * b))],
      tags: ["neg-slip"], difficulty: 0.45,
      explanation: `Multiplying two negative numbers gives a POSITIVE, because the opposite of the opposite points back where you started: (${a}) × (${b}) = ${a * b}. Negating the product (${a * b * -1}) keeps one sign too many, and adding the two numbers (${a + b}) is a different operation — a product of ${Math.abs(a)} and ${Math.abs(b)} cannot be that small.`,
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
      // THE PROSE WAS WRONG IN TWO WAYS A LEARNER WOULD HAVE READ:
      //   · "so 1 parts come to …" — the draw takes n = 1 one time in seven, and
      //     the sentence was written for the plural only;
      //   · "Multiplying by the denominator (${n * d})" — for n = 2, d = 5 it
      //     printed "the denominator (10)" beside a denominator of 5. The number
      //     it printed is the numerator-times-denominator DISTRACTOR, so the
      //     sentence named the right wrong option with the wrong words.
      // The split below also drops the "stopping after the division" trap when
      // n = 1, because there stopping after the division IS the answer — a
      // warning against the correct method is worse than no warning.
      explanation: [
        `Finding ${n}/${d} of ${d * k} means cutting ${d * k} into ${d} equal parts and taking ${n} of them.`,
        `Each part is ${d * k} ÷ ${d} = ${k}.`,
        n === 1 ? `Taking one part gives ${k}.` : `Taking ${n} of them gives ${k} × ${n} = ${n * k}.`,
        `Multiplying the numerator by the denominator (${n * d}) is not a step in this method.`,
        n === 1 ? "" : `Nor is stopping after the division (${k}) — that takes one part, and the question asks for ${n}.`,
      ].filter(Boolean).join(" "),
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
      explanation: `Fractions can only be added once the pieces are the same size, so both are rewritten over the common denominator ${den}: ${a}/${b} = ${a * d}/${den} and ${c}/${d} = ${c * b}/${den}. Adding the numerators then gives ${num}/${den} = ${Number((num / den).toFixed(2))}. Adding the tops and the bottoms (${a + c}/${b + d}) is the classic error, and it can even produce a fraction smaller than one of the originals — which a sum never is.`,
    };
  },

  decimals: (r) => {
    const a = r.int(10, 90) / 10, b = r.int(10, 90) / 10;
    return {
      prompt: `Work out ${a} × ${b}.`,
      value: Number((a * b).toFixed(4)), tolerance: { abs: 0.005 },
      wrongs: [String(Number((a * b * 10).toFixed(4))), String(Number((a * b / 10).toFixed(4))), String(Number((a + b).toFixed(4)))],
      tags: [], difficulty: 0.45,
      explanation: `Decimals multiply by ignoring the points, multiplying the whole numbers, and then restoring the places: ${Math.round(a * 10)} × ${Math.round(b * 10)} = ${Math.round(a * 10) * Math.round(b * 10)}, and two decimal places go back on at the end, giving ${Number((a * b).toFixed(4))}. Adding the two numbers instead (${Number((a + b).toFixed(4))}) is a different operation, and shifting one place too far (${Number((a * b * 10).toFixed(4))}) is a miscount of the places rather than a wrong multiplication.`,
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
        explanation: `A percentage is a fraction of a hundred, so ${pct}% means ${pct}/100. Of ${amount} that is ${amount} × ${pct}/100 = ${(pct * amount) / 100}. Dividing by 10 instead (${(pct * amount) / 10}) treats the percentage as a tenth, and ${pct * amount} forgets to divide by 100 at all.`,
      };
    }
    if (v === 1) {
      const pct = r.pick([10, 20, 25, 50]), amount = r.pick([60, 80, 120, 240]);
      return {
        prompt: `A price of ${amount} rises by ${pct}%. What is the new price?`,
        value: amount * (1 + pct / 100), tolerance: { abs: 0.01 },
        wrongs: [String(amount + pct), String((amount * pct) / 100), String(amount * (1 - pct / 100))],
        tags: ["pct-base"], difficulty: 0.45,
        explanation: `A rise of ${pct}% is one multiplication by ${1 + pct / 100}, because the new price is the whole original price plus the extra part of it. So ${amount} × ${1 + pct / 100} = ${amount * (1 + pct / 100)}. Adding ${pct} to the price (${amount + pct}) treats the percentage as ${pct} pounds, and ${(amount * pct) / 100} is only the increase, not the new price.`,
      };
    }
    const pct = r.pick([20, 25, 40]), amount = r.pick([80, 120, 200]);
    return {
      prompt: `A price of ${amount} falls by ${pct}%. What is the new price?`,
      value: amount * (1 - pct / 100), tolerance: { abs: 0.01 },
      wrongs: [String(amount - pct), String(amount * (1 + pct / 100)), String((amount * pct) / 100)],
      tags: ["pct-base"], difficulty: 0.45,
      explanation: `A fall of ${pct}% leaves ${100 - pct}% of the price, so the whole calculation is one multiplication by ${1 - pct / 100}: ${amount} × ${1 - pct / 100} = ${amount * (1 - pct / 100)}. Subtracting ${pct} from the price treats the percentage as ${pct} pounds, and multiplying by ${1 + pct / 100} applies a rise instead of a cut.`,
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
      explanation: `A ratio of ${a}:${b} splits the total into ${a + b} equal parts, and only then shares them out. One part is £${total} ÷ ${a + b} = £${k}, so ${Math.min(a, b)} parts — the smaller share — come to ${Math.min(a, b)} × £${k} = £${Math.min(a, b) * k}. Halving the total (${total / 2}) assumes the two shares are equal, and ${Math.max(a, b) * k} is the larger share, which the question did not ask for.`,
    };
  },

  proportion: (r) => {
    const n = r.int(2, 8), cost = r.int(2, 9), m = r.int(2, 6);
    return {
      prompt: `If ${n} pens cost £${n * cost}, how much do ${m} pens cost, in pounds?`,
      value: m * cost, tolerance: { abs: 0.01, unit: "£" },
      wrongs: [String(n * cost), String(cost), String(m * cost + cost)],
      tags: ["inv-prop"], difficulty: 0.45,
      explanation: `Direct proportion goes through one unit, because the price of a single pen is what the two situations share. £${n * cost} buys ${n} pens, so each costs £${cost}, and ${m} pens therefore cost ${m} × £${cost} = £${m * cost}. Multiplying the original total by the new number of pens (${n * cost}) leaves ${n} in the answer, and £${cost} is the price of one pen rather than of ${m}.`,
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
        explanation: `Rounding to one decimal place looks at the NEXT digit along, because that digit is the part being dropped and it decides which way to go. Here the second decimal is ${String(n).split(".")[1]?.[1] ?? 0}, so ${n} rounds to ${Number(n.toFixed(1))}. Keeping both decimals (${Number(n.toFixed(2))}) is not rounding at all, and ${Math.round(n)} rounds to a whole number instead.`,
      };
    }
    if (v === 1) {
      const n = r.int(1000, 9999);
      return {
        prompt: `Round ${n} to the nearest 100.`,
        value: Math.round(n / 100) * 100, wrongs: [Math.round(n / 10) * 10, Math.round(n / 1000) * 1000, n - 100],
        tags: ["round-half"], difficulty: 0.4,
        explanation: `Rounding to the nearest 100 puts ${n} on one of the hundreds either side of it, ${Math.floor(n / 100) * 100} and ${Math.ceil(n / 100) * 100}, and the tens digit decides which. Here the tens digit is ${Math.floor((n % 100) / 10)}, so ${n} is nearer ${Math.round(n / 100) * 100}. Rounding to the nearest 10 or 1000 (${Math.round(n / 10) * 10}, ${Math.round(n / 1000) * 1000}) answers a different question.`,
      };
    }
    const sf = r.pick([2, 3]);
    const n = r.int(10000, 99999);
    const rounded = Number(n.toPrecision(sf));
    return {
      prompt: `Round ${n} to ${sf} significant figures.`,
      value: rounded, wrongs: [Number(n.toPrecision(sf + 1)), Number(n.toPrecision(sf - 1)), Math.round(n / 1000) * 1000],
      tags: ["round-half"], difficulty: 0.5,
      explanation: `Significant figures count from the first non-zero digit, not from the decimal point or the left-hand zeros. ${n} keeps its first ${sf} significant digits and the rest become place-holding zeros, giving ${rounded}. Keeping one more figure (${Number(n.toPrecision(sf + 1))}) is not rounding at all, and keeping one fewer (${Number(n.toPrecision(sf - 1))}) throws away a digit the question asked for.`,
    };
  },

  "order-ops": (r) => {
    const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9);
    return {
      prompt: `Work out ${a} + ${b} × ${c}.`,
      value: a + b * c, wrongs: [(a + b) * c, a * b + c, a + b + c],
      tags: ["order-ops"], difficulty: 0.4,
      explanation: `Multiplication binds tighter than addition, so the product is worked out before the sum: ${b} × ${c} = ${b * c} comes first, and then ${a} + ${b * c} = ${a + b * c}. Working left to right instead (${(a + b) * c}) adds before multiplying, which is a different expression — it is exactly why ${a} + ${b} × ${c} is not ${(a + b) * c}.`,
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
        explanation: `A positive index means repeated multiplication, so ${b}^${e} is ${b} written as a factor ${e} times, which multiplies out to ${Math.pow(b, e)}. Multiplying the base by the index instead (${b * e}) is the classic error: ${b}^${e} is not ${b} × ${e}, and the two answers grow at completely different rates.`,
      };
    }
    if (v === 1) {
      const b = r.int(2, 5), e = r.int(2, 3);
      return {
        prompt: `Work out ${b}^${-e} as a decimal (3 d.p.).`,
        value: Number((1 / Math.pow(b, e)).toFixed(3)), tolerance: { abs: 0.002 },
        wrongs: [String(-Math.pow(b, e)), String(Number((-b / e).toFixed(3))), String(Number((1 / (b * e)).toFixed(3)))],
        tags: ["neg-exp"], difficulty: 0.55,
        explanation: `A negative index means the reciprocal of the positive power: ${b}^${-e} is 1 divided by ${b}^${e}, which is 1/${Math.pow(b, e)} = ${Number((1 / Math.pow(b, e)).toFixed(3))}. Building the power and then turning it upside down is the whole rule. The answer is POSITIVE — the minus sign moves the value below 1 and never makes it negative, so replying ${-Math.pow(b, e)} changes a sign that was never there.`,
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
      explanation: `A power raised to another power MULTIPLIES the indices, because the factors are themselves repeated: (${b}^${e})² means ${b}^${e} written twice, which is ${e} + ${e} = ${e * 2} factors of ${b}. So the value is ${b}^${e * 2} = ${Math.pow(b, e * 2)}. Adding the indices instead (${b}^${e + 2} = ${Math.pow(b, e + 2)}) is the rule for multiplying powers, not for raising one to a power, and doubling the value of ${b}^${e} (${Math.pow(b, e) * 2}) is not a power at all.`,
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
      explanation: `Solving a pair means removing one variable: scale an equation so the coefficients of one variable match, add or subtract to cancel it, and solve for what is left. Doing that here gives x = ${x}, and substituting back gives y = ${y}. Checking both values in BOTH original equations is the last step, because an elimination slip satisfies one equation and fails the other.`,
    };
  },

  "straight-lines": (r) => {
    const m = r.int(1, 5), c = r.int(-6, 6);
    const x = r.int(1, 6);
    return {
      prompt: `A line has equation y = ${m}x ${c < 0 ? "− " + Math.abs(c) : "+ " + c}. What is y when x = ${x}?`,
      value: m * x + c, wrongs: [m * x, m * x - c, (m + c) * x],
      tags: ["grad-run"], difficulty: 0.45,
      explanation: `The equation gives y in terms of x, so finding y when x is ${x} means putting ${x} wherever x appears. ${m} × ${x} = ${m * x}, and then ${c < 0 ? "subtracting " + Math.abs(c) : "adding " + c} gives ${m * x + c}. Dropping the ${c < 0 ? Math.abs(c) : c} altogether (${m * x}) forgets that the line does not pass through the origin, and getting its sign the other way round (${m * x - c}) puts the intercept on the wrong side.`,
    };
  },

  quadratics: (r) => {
    const p = r.int(1, 7), q = r.int(1, 7);
    return {
      prompt: `Solve x² − ${p + q}x + ${p * q} = 0. What is the LARGER root?`,
      value: Math.max(p, q), wrongs: [Math.min(p, q), p + q, p * q],
      tags: ["lost-root"], difficulty: 0.55,
      explanation: `A quadratic is solved by writing it as a product, since a product is zero when either factor is: x² − ${p + q}x + ${p * q} factorises to (x − ${p})(x − ${q}), so x = ${p} or x = ${q}. The question asks for the larger of the two, which is ${Math.max(p, q)}. The other root (${Math.min(p, q)}) is a real answer to the equation but not to the question — a quadratic normally has two roots, and the stem says which one it wants.`,
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
        explanation: `The nth term of an arithmetic sequence is the first term plus the common difference added one fewer time than the term number, because the first term has the difference added zero times. So term ${n} is ${a} + ${n - 1} × ${d} = ${a + (n - 1) * d}. Adding the difference ${n} times instead (${a + n * d}) is the classic off-by-one, and it fails on the very first term, where the answer must be ${a}.`,
      };
    }
    const n = r.int(5, 10);
    return {
      prompt: `A sequence has nth term ${d}n + ${a}. What is the ${n}th term?`,
      value: d * n + a, wrongs: [d * n, d * n + a * n, d * (n + 1) + a],
      tags: ["nth-term"], difficulty: 0.45,
      explanation: `The nth term is a rule written in n, so finding the ${n}th term means putting ${n} where n is. ${d} × ${n} = ${d * n}, and adding ${a} gives ${d * n + a}. Leaving out the +${a} (${d * n}) drops the constant term, and ${d * (n + 1) + a} uses the next term number — which is why an off-by-one always fails on the very first term.`,
    };
  },

  functions: (r) => {
    const a = r.int(2, 5), b = r.int(1, 7), x = r.int(2, 8);
    return {
      prompt: `f(x) = ${a}x + ${b}. What is f(${x})?`,
      value: a * x + b, wrongs: [a * (x + b), a * x, (a + b) * x],
      tags: [], difficulty: 0.4,
      explanation: `f(${x}) means "apply the rule to the input ${x}", so every x in ${a}x + ${b} becomes ${x}. That gives ${a} × ${x} + ${b} = ${a * x} + ${b} = ${a * x + b}. Adding before multiplying (${a * (x + b)}) changes the order of operations and multiplies the ${b} as well, and leaving the +${b} out (${a * x}) drops the constant.`,
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
      explanation: `A surd simplifies by finding the largest perfect square that divides the number under the root, because √(m × n) = √m × √n. Here ${n} = ${sq} × ${k}, so √${n} = √${sq} × √${k} = ${outside}√${k}, and ${sq} is the largest square available. Replying ${k} takes the number still under the root rather than the one drawn out of it, and ${Number(Math.sqrt(n).toFixed(3))} is the decimal value — an approximation, not the simplified surd the question asks for.`,
    };
  },

  "completing-square": (r) => {
    const h = r.int(1, 8);
    return {
      prompt: `Write x² + ${2 * h}x + ${h * h + 5} in the form (x + p)² + q. What is q?`,
      value: 5, wrongs: [h * h + 5, -h, h * h],
      tags: ["b-half"], difficulty: 0.6,
      explanation: `Completing the square starts from the x coefficient: half of ${2 * h} is ${h}, and (x + ${h})² expands to x² + ${2 * h}x + ${h * h}. The expression's constant is ${h * h + 5}, which is ${h * h} more than the square supplies, so the leftover is q = ${h * h + 5} − ${h * h} = 5. Forgetting to subtract the ${h * h} that completing the square added (answering ${h * h + 5}) is the classic error.`,
    };
  },

  "growth-decay": (r) => {
    const p = r.pick([200, 400, 500, 800]), rate = r.pick([5, 10, 20]), years = r.int(2, 4);
    const amount = p * Math.pow(1 + rate / 100, years);
    // Money, written to the penny — for the ANSWER as well as the distractors.
    // The stem asks for the value "to the nearest penny", and `tolerance.display`
    // is what sets the printed option, so the answer reads 220.50 while the
    // marked value (and the typed-answer tolerance) is unchanged. Before this,
    // the MCQ twin printed the key as "220.5" beside distractors "240", "420"
    // and "220": the key was the only option carrying a decimal point, so a
    // learner who ignored the question and picked the longest string beat the
    // 25% chance line. Every option is now the same kind of number.
    const money = (x: number) => x.toFixed(2);
    return {
      prompt: `£${p} is invested at ${rate}% compound interest per year. What is its value after ${years} years (to the nearest penny)?`,
      value: Number(amount.toFixed(2)), tolerance: { abs: 0.01, unit: "£", display: money(amount) },
      wrongs: [
        // simple interest — the classic error, and the same magnitude as the answer
        money(p * (1 + (rate * years) / 100)),
        // compounded for one year too few — an off-by-one in the exponent
        money(p * Math.pow(1 + rate / 100, years - 1)),
        // multiplied by the term instead of compounding it
        money(p * (1 + rate / 100) * years),
      ],
      tags: ["simple-cp"], difficulty: 0.6,
      explanation: `Compound interest means each year's interest earns interest in the years after it, so the multiplier ${1 + rate / 100} is applied once for every year rather than once in total. After ${years} years that is £${p} × ${1 + rate / 100} raised to the power ${years}, which comes to £${money(amount)}. Simple interest — one year's interest multiplied by ${years} — gives £${money(p * (1 + (rate * years) / 100))}, and the gap between the two IS the compounding; £${money(p * Math.pow(1 + rate / 100, years - 1))} applies the multiplier one year too few.`,
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
      explanation: `Simple interest is a fixed percentage of the ORIGINAL amount, charged once for each year, so it is one multiplication: ${p} × ${rate} × ${years} ÷ 100 = £${interest}. The question asks for the interest alone, so £${p + interest} — the interest added back to the money already there — answers a different question. ${(p * rate) / 100} is one year's interest when ${years} years were asked for.`,
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
      explanation: `Rounding a measurement to one decimal place means the true value could be up to half of that last place either side of what was written down, because anything inside that band rounds to the same figure. Half of 0.1 is 0.05, so the upper bound is ${n} + 0.05 = ${Number((n + half).toFixed(2))} cm. ${Number((n - half).toFixed(2))} is the LOWER bound rather than the upper one, and ${Number((n + half * 2).toFixed(2))} uses a whole place value instead of half of one.`,
    };
  },

  "algebraic-fractions": (r) => {
    const a = r.int(2, 9), b = r.int(2, 9);
    return {
      prompt: `Simplify (x² + ${a + b}x + ${a * b}) / (x + ${a}). At x = ${a + 1}, what is the simplified expression's value?`,
      value: a + 1 + b, wrongs: [a + 1, a + b, a * b],
      tags: ["cancel-term"], difficulty: 0.7,
      explanation: `A fraction can only be cancelled once the top is written as a product, so factorise before cancelling: x² + ${a + b}x + ${a * b} = (x + ${a})(x + ${b}). The factor (x + ${a}) then cancels with the denominator, leaving x + ${b}, and at x = ${a + 1} that expression is worth ${a + 1 + b}. Cancelling an x from the squared term against the single x below — the mistake this question is built to catch — is not the same as cancelling a shared FACTOR, and ${a + 1} is what that route produces.`,
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
      explanation: `Adding the two subject totals counts the learners who study both languages twice, so the overlap has to be taken off once: ${both + onlyA} + ${both + onlyB} − ${both} = ${both + onlyA + onlyB} study at least one of them. Taking that from the class of ${total} leaves ${neither} who study neither. Forgetting to remove the overlap (${total - (both + onlyA) - (both + onlyB)}) counts those learners twice and makes the answer too small.`,
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
        explanation: `Every position in a binary number is worth a power of 2, and the powers are counted from 1 on the right, so the leftmost digit is worth much more than the last one. In ${bits}₂ the 1s stand for ${bits.split("").map((b, i) => (b === "1" ? Math.pow(2, bits.length - 1 - i) : 0)).filter((x) => x > 0).join(" + ")}, which add to ${n}. Counting the digits instead (${bits.length}) answers how long the number is, not what it is worth.`,
      };
    }
    const n = r.int(10, 60);
    const oct = n.toString(8);
    return {
      prompt: `What is the decimal (base 10) value of the octal number ${oct}₈?`,
      value: n, wrongs: [Number(oct), n + 8, n - 8],
      tags: [], difficulty: 0.55,
      explanation: `Each position in an octal number is worth a power of 8, counted from 1 on the right, so the same digits mean different amounts from the decimal version. ${oct}₈ works out to ${n}. Reading the digits as though they were decimal (${Number(oct)}) is the mistake this question is aimed at, and adding or subtracting 8 (${n + 8}, ${n - 8}) treats the base as a single place value rather than the whole numbering system.`,
    };
  },

  "matrices-intro": (r) => {
    const a = r.int(1, 5), b = r.int(1, 5), c = r.int(1, 5), d = r.int(1, 5);
    return {
      prompt: `For the matrix [[${a}, ${b}], [${c}, ${d}]], what is the determinant ad − bc?`,
      value: a * d - b * c, wrongs: [a * d + b * c, a + d, b * c - a * d],
      tags: [], difficulty: 0.6,
      explanation: `The determinant of the 2×2 matrix [[${a}, ${b}], [${c}, ${d}]] is the product of its leading diagonal minus the product of its other diagonal, which is why it is written ad − bc. The leading diagonal runs from ${a} to ${d}, giving ${a} × ${d} = ${a * d}; the other runs from ${b} to ${c}, giving ${b} × ${c} = ${b * c}. Subtracting gives ${a * d} − ${b * c} = ${a * d - b * c}, and adding the two products instead (${a * d + b * c}) is the commonest slip — it is not a determinant of anything, and only the subtraction is zero when the matrix has no inverse.`,
    };
  },

  polynomials: (r) => {
    const a = r.int(1, 5), b = r.int(1, 5), x = r.int(2, 5);
    return {
      prompt: `p(x) = x³ + ${a}x² − ${b}x + ${a * b}. What is p(${x})?`,
      value: Math.pow(x, 3) + a * x * x - b * x + a * b,
      wrongs: [Math.pow(x, 3) + a * x * x - b * x, Math.pow(x, 3) + a * x - b + a * b, Math.pow(x, 3) + a * x * x + b * x + a * b],
      tags: [], difficulty: 0.65,
      explanation: `p(${x}) means putting ${x} in place of every x, and each term is then worked out with its own power and its own sign. ${x}³ = ${Math.pow(x, 3)}; ${a}x² becomes ${a} × ${x}² = ${a * x * x}; the −${b}x term is ${b} × ${x} = ${b * x}, which is subtracted; and the constant is ${a * b}. Adding those gives ${Math.pow(x, 3) + a * x * x - b * x + a * b}. Dropping the constant (${Math.pow(x, 3) + a * x * x - b * x}) and turning the subtracted term into an added one (${Math.pow(x, 3) + a * x * x + b * x + a * b}) are the two slips the options hold.`,
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
      explanation: `Each term of the expansion comes from choosing ${k} of the ${n} brackets to supply the x, and there are ${comb(n, k)} ways to make that choice. Each chosen bracket contributes ${a}x, so the term's coefficient is ${comb(n, k)} × ${a} to the power ${k} = ${coeff}. Counting the choices without raising ${a} to the power (${comb(n, k)}) is only right when ${a} is 1, and ${Math.pow(a, k)} forgets how many ways the term can be made.`,
    };
  },

  "sim-equations-quad": (r) => {
    const p = r.int(1, 5), q = r.int(1, 5);
    return {
      prompt: `Solve y = x² and y = ${p + q}x − ${p * q}. The line meets the curve at two points. What is the LARGER x?`,
      value: Math.max(p, q), wrongs: [Math.min(p, q), p + q, p * q],
      tags: ["lost-root"], difficulty: 0.65,
      explanation: `The line and the curve meet where their y values agree, so set the right-hand sides equal: x² = ${p + q}x − ${p * q}, which rearranges to x² − ${p + q}x + ${p * q} = 0. Factorising gives (x − ${p})(x − ${q}) = 0, so x = ${p} or x = ${q}, and the larger is ${Math.max(p, q)}. Giving the smaller root (${Math.min(p, q)}) drops the fact that a line can cut a parabola twice.`,
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
      explanation: `An iteration feeds the current value back into the formula to produce the next one, so x₁ comes from putting x₀ = ${start} on the right-hand side. That gives √(${a} + ${start}) = √${a + start} = ${Number(next.toFixed(4))}, and repeating it settles on the value the formula converges to. Forgetting the root (${a + start}) answers a different question, and ${Number((start + a / start).toFixed(4))} is a step of a different iteration.`,
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
        explanation: `log base ${b} asks "what power of ${b} gives this?" Since ${b} multiplied by itself ${e} times is ${Math.pow(b, e)}, the answer is ${e}, because the logarithm is the number of times the base is repeated. Replying with the number itself (${Math.pow(b, e)}) or with ${b} × ${e} both answer something other than the power.`,
      };
    }
    const b = r.pick([2, 3, 10]), e1 = r.int(2, 4), e2 = r.int(2, 3);
    return {
      prompt: `What is log base ${b} of ${Math.pow(b, e1)} plus log base ${b} of ${Math.pow(b, e2)}?`,
      value: e1 + e2, wrongs: [e1 * e2, Math.pow(b, e1) + Math.pow(b, e2), e1 - e2],
      tags: [], difficulty: 0.6,
      explanation: `Adding two logarithms with the same base multiplies their arguments, because the powers add. Here the first log is ${e1} and the second is ${e2}, so the sum is ${e1 + e2}, and multiplying the arguments confirms it: log${b}(${Math.pow(b, e1)} × ${Math.pow(b, e2)}) = log${b}(${Math.pow(b, e1 + e2)}). Multiplying the two logs (${e1 * e2}) applies the rule for a power to a sum, and adding the arguments as ordinary numbers (${Math.pow(b, e1) + Math.pow(b, e2)}) is not what the rule does.`,
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
        explanation: `Sine links the side OPPOSITE the angle to the hypotenuse, and sin 30° is exactly 0.5, so the opposite side is half the hypotenuse: 0.5 × ${hyp} = ${hyp / 2} cm. Using the cosine instead (${Number((hyp * 0.866).toFixed(2))}) picks out the adjacent side, and the hypotenuse itself (${hyp}) is the longest side — it cannot be the one opposite the angle.`,
      };
    }
    const adj = r.pick([6, 8, 9, 12]), angle = r.pick([30, 45, 60]);
    const hyp = adj / Math.cos((angle * Math.PI) / 180);
    return {
      prompt: `In a right-angled triangle the side ADJACENT to a ${angle}° angle is ${adj} cm. How long is the hypotenuse, in cm (1 d.p.)?`,
      value: Number(hyp.toFixed(1)), tolerance: { abs: 0.1, unit: "cm" },
      wrongs: [Number((adj * Math.cos((angle * Math.PI) / 180)).toFixed(1)), Number((adj / Math.sin((angle * Math.PI) / 180)).toFixed(1)), adj],
      tags: ["hyp-leg-trig"], difficulty: 0.55,
      explanation: `Cosine is the adjacent side over the hypotenuse, so the hypotenuse is the adjacent side DIVIDED by cos ${angle}°, not multiplied by it: ${adj} ÷ cos ${angle}° = ${Number(hyp.toFixed(1))} cm. Dividing by the sine instead (${Number((adj / Math.sin((angle * Math.PI) / 180)).toFixed(1))}) pairs the given side with the wrong ratio, and ${adj} leaves the side unchanged — but the hypotenuse is the longest side, so it cannot equal the adjacent one.`,
    };
  },

  pythagoras: (r) => {
    const triples: Array<[number, number, number]> = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
    const [a, b, c] = r.pick(triples);
    return {
      prompt: `A right-angled triangle has legs ${a} cm and ${b} cm. How long is the hypotenuse, in cm?`,
      value: c, tolerance: { unit: "cm" },
      wrongs: [a + b, c + 1, c - 1],
      // Same plate the composed family draws, from the same two legs: the slide
      // shows both given sides and a `?` for the side being asked for.
      figure: { kind: "right-triangle", legA: a, legB: b, unit: " cm", labelA: true, labelB: true },
      tags: ["hyp-leg"], difficulty: 0.45,
      explanation: `Pythagoras' theorem links the two shorter sides to the longest one: the squares of the legs add to the square of the hypotenuse. So ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, which makes the hypotenuse √${c * c} = ${c} cm. Adding the legs without squaring them (${a + b}) is the commonest error, and it always comes out too small, because squaring is what makes the hypotenuse the longest side.`,
    };
  },

  "angles-lines": (r) => {
    const a = r.int(30, 150);
    return {
      prompt: `Two angles on a straight line are ${a}° and x°. What is x, in degrees?`,
      value: 180 - a, wrongs: [a, 360 - a, 90 - a],
      tags: ["alt-corr"], difficulty: 0.35,
      explanation: `The angles along a straight line fill a half turn, which is 180°, so the two angles must add up to 180. That makes x = 180 − ${a} = ${180 - a}°. The value ${a} is the angle already given, and ${360 - a} would only be right if the angles completed a full turn instead of a half.`,
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
        explanation: `Area counts the square centimetres that fit inside the rectangle, so it is length multiplied by width: ${l} × ${w} = ${l * w} cm². Going round the edge instead (${2 * (l + w)}) measures the perimeter, which is a distance, and ${l + w} is only half of that.`,
      };
    }
    if (v === 1) {
      return {
        prompt: `A rectangle is ${l} cm by ${w} cm. What is its PERIMETER, in cm?`,
        value: 2 * (l + w), tolerance: { unit: "cm" }, wrongs: [l * w, l + w, 2 * l + w],
        tags: [], difficulty: 0.35,
        explanation: `Perimeter is the distance all the way round the rectangle, which is two lengths plus two widths: 2 × (${l} + ${w}) = ${2 * (l + w)} cm. It is a length, so it is measured in centimetres; ${l * w} is the area in square centimetres and answers a different question, and ${l + w} is only one length and one width.`,
      };
    }
    const t = r.int(3, 12), h = r.int(2, 10);
    return {
      prompt: `A triangle has base ${t} cm and perpendicular height ${h} cm. What is its area, in cm²?`,
      value: (t * h) / 2, tolerance: { abs: 0.01, unit: "cm²" }, wrongs: [t * h, t + h, (t * h) / 4],
      tags: [], difficulty: 0.4,
      explanation: `A triangle is half of the rectangle that would surround it, which is why the formula halves the product of base and height: ½ × ${t} × ${h} = ${(t * h) / 2} cm². Forgetting the ½ doubles the answer (${t * h}), and ${t + h} adds the two lengths instead of multiplying them.`,
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
        explanation: `Volume counts cubic centimetres, so it takes three lengths multiplied together: ${l} × ${w} × ${h} = ${l * w * h} cm³. The surface area of the box (${2 * (l * w + w * h + l * h)}) is measured in square centimetres and answers a different question, and adding the three lengths (${l + w + h}) is neither an area nor a volume.`,
      };
    }
    const radius = r.int(2, 6);
    return {
      prompt: `A cylinder has radius ${radius} cm and height ${h} cm. Its volume is kπ cm³. What is k?`,
      value: radius * radius * h, tolerance: { unit: "cm³" }, wrongs: [2 * radius * h, radius * h, radius * radius],
      tags: [], difficulty: 0.5,
      explanation: `A cylinder is a stack of circular slices, so its volume is the area of the circle multiplied by the height: π × ${radius}² × ${h} = ${radius * radius * h}π cm³, which makes k = ${radius * radius * h}. The radius is squared — using 2r instead (${2 * radius * h}) gives the circumference times the height, a curved surface area rather than a volume.`,
    };
  },

  vectors: (r) => {
    const a1 = r.int(-6, 6), a2 = r.int(-6, 6), b1 = r.int(-6, 6), b2 = r.int(-6, 6);
    return {
      prompt: `Vector a = (${a1}, ${a2}) and b = (${b1}, ${b2}). What is the x-component of a + b?`,
      value: a1 + b1, wrongs: [a1 - b1, a1 * b1, a2 + b2],
      tags: ["vec-dir"], difficulty: 0.45,
      explanation: `Vectors add component by component, so the x-components are added separately from the y-components. ${a1} + ${b1} = ${a1 + b1}, and that is the new x-component. Subtracting instead (${a1 - b1}) reverses one of them, and ${a2 + b2} is the y-component — the other row of the same addition.`,
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
        explanation: `The mean shares the total equally among the values, so add them and divide by how many there are: ${sum} ÷ ${nums.length} = ${Number((sum / nums.length).toFixed(2))}. The sum on its own (${sum}) is not an average, the median (${sorted[2]}) is a different kind of middle, and dividing by ${nums.length - 1} divides by one fewer value than there are.`,
      };
    }
    if (v === 1) {
      return {
        prompt: `What is the MEDIAN of ${nums.join(", ")}?`,
        value: sorted[2], wrongs: [Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2)), sorted[0], sorted[4]],
        tags: ["outlier-mean"], difficulty: 0.4,
        explanation: `The median is the middle value once the numbers are put in order, not the value in the middle of the list as it was written. In order they are ${sorted.join(", ")}, so with five values the third is the median: ${sorted[2]}. The mean (${Number((nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(2))}) is a different average, and the smallest or largest value is an end, not a middle.`,
      };
    }
    return {
      prompt: `What is the RANGE of ${nums.join(", ")}?`,
      value: sorted[4] - sorted[0], wrongs: [sorted[4], sorted[0], sorted[2]],
      tags: [], difficulty: 0.35,
      explanation: `The range measures how spread out the data is: the largest value minus the smallest, ${sorted[4]} − ${sorted[0]} = ${sorted[4] - sorted[0]}. The largest value by itself (${sorted[4]}) says where the data ends rather than how widely it is spread, and the median (${sorted[2]}) is a middle value.`,
    };
  },

  "data-charts": (r) => {
    const values = Array.from({ length: 4 }, () => r.int(2, 12));
    const total = values.reduce((s, n) => s + n, 0);
    return {
      prompt: `A bar chart shows four categories with values ${values.join(", ")}. What is the TOTAL of the four bars?`,
      value: total, wrongs: [Math.round(total / 4), total + values[0], Math.max(...values)],
      tags: [], difficulty: 0.35,
      explanation: `The total of a bar chart is the sum of its bars, so add them: ${values.join(" + ")} = ${total}. The value ${Math.round(total / 4)} is the MEAN of the four bars, which the question did not ask for, and ${Math.max(...values)} is only the tallest single bar.`,
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
      explanation: `Substitute the x value into the equation of the line of best fit: y = 2 × ${x} = ${2 * x}. That is what the line PREDICTS — a point need not sit exactly there — and here all five points do lie on it, so the correlation is perfect, which real data almost never is. Reading the x value back as the answer (${x}) or adding two to it (${x + 2}) does not use the line at all.`,
    };
  },

  "proportional-graphs": (r) => {
    const k = r.int(2, 8), x = r.int(2, 9);
    return {
      prompt: `y is directly proportional to x, and y = ${k * 3} when x = 3. What is y when x = ${x}?`,
      value: k * x, wrongs: [k * 3, k + x, Math.round(k / x * 10) / 10],
      tags: ["inv-prop"], difficulty: 0.5,
      explanation: `Direct proportion means the two quantities are linked by a single multiplier, y = kx, so the pair given finds k first: k = ${k * 3} ÷ 3 = ${k}. Then at x = ${x} the value is ${k} × ${x} = ${k * x}. Reusing ${k * 3} leaves x where it was, and ${k + x} adds the multiplier to x instead of multiplying by it.`,
    };
  },

  transformations: (r) => {
    const k = r.int(2, 5), l = r.int(2, 8);
    return {
      prompt: `A square of side ${l} cm is enlarged by scale factor ${k}. What is its new AREA, in cm²?`,
      value: k * k * l * l, tolerance: { unit: "cm²" },
      wrongs: [k * l * l, k * l, k * k * l],
      tags: ["sf-area"], difficulty: 0.55,
      explanation: `An enlargement scales every length by the scale factor, so a side of ${l} cm becomes ${k * l} cm. Area is two lengths multiplied, which is why it scales by the factor twice: ${k} × ${k} = ${k * k}, giving ${k * k} × ${l}² = ${k * k * l * l} cm². Scaling the area by ${k} once (${k * l * l}) is the classic error — the factor is applied to each dimension, not to the result.`,
    };
  },

  "circle-theorems": (r) => {
    const angle = r.pick([20, 25, 30, 35, 40]);
    return {
      prompt: `An angle at the circumference is ${angle}°, standing on a particular arc. What is the angle at the CENTRE standing on the SAME arc, in degrees?`,
      value: 2 * angle, wrongs: [angle, 180 - angle, 90 - angle],
      tags: ["same-seg"], difficulty: 0.5,
      explanation: `The angle at the centre is TWICE the angle at the circumference on the same arc: 2 × ${angle} = ${2 * angle}°. The "same arc" is the condition that makes the doubling valid — an angle anywhere else on the circle would not be double the centre angle. Answering ${angle} treats both angles as if they were at the circumference, and ${180 - angle} is the supplement, which belongs to cyclic quadrilaterals rather than to this theorem.`,
    };
  },

  "circle-geometry-adv": (r) => {
    const angle = r.pick([25, 35, 40, 50]);
    return {
      prompt: `A tangent and a chord meet at ${angle}°. By the alternate segment theorem, what is the angle in the alternate segment, in degrees?`,
      value: angle, wrongs: [2 * angle, 180 - angle, 90 - angle],
      tags: ["alt-seg"], difficulty: 0.55,
      explanation: `The angle between a tangent and a chord equals the angle that chord subtends in the alternate segment, so the answer is the same ${angle}°. Doubling it (${2 * angle}°) applies the centre rule, which needs an angle at the centre, and ${180 - angle} supplements it — neither is what the alternate segment theorem says.`,
    };
  },

  kinematics: (r) => {
    const u = r.int(2, 10), a = r.int(2, 5), t = r.int(2, 6);
    return {
      prompt: `A body starts at ${u} m/s and accelerates at ${a} m/s² for ${t} s. What is its final velocity, in m/s?`,
      value: u + a * t, tolerance: { unit: "m/s" },
      wrongs: [u * t, a * t, u + a],
      tags: [], difficulty: 0.45,
      explanation: `Final velocity is the velocity it started with plus however much the acceleration has added, and an acceleration of ${a} m/s² adds that many m/s in every second. So v = ${u} + ${a} × ${t} = ${u + a * t} m/s. Multiplying the starting speed by the time (${u * t}) gives the distance covered at a steady speed, and ${a * t} is only the change in velocity — it leaves out the speed it started from.`,
    };
  },

  "calculus-diff": (r) => {
    const a = r.int(2, 6), n = r.int(2, 4), x = r.int(1, 5);
    return {
      prompt: `y = ${a}x^${n}. What is dy/dx at x = ${x}?`,
      value: a * n * Math.pow(x, n - 1),
      wrongs: [a * Math.pow(x, n), a * n * Math.pow(x, n), a * n],
      tags: [], difficulty: 0.65,
      explanation: `Differentiating ${a}x^${n} uses the power rule: multiply by the old power and drop the power by one, giving ${a * n}x^${n - 1}. At x = ${x} that is ${a * n} × ${x} to the power ${n - 1}, which is ${a * n * Math.pow(x, n - 1)}. Stopping before substituting (${a * n}) leaves the gradient function rather than the gradient at a point, and ${a * Math.pow(x, n)} is the value of y itself, not its rate of change.`,
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
      explanation: `Integrating raises the power by one and divides by the new power, so ${a}x^${n} integrates to ${a}x^${n + 1}/${n + 1}. Evaluating that between 0 and ${x} means the value at ${x} minus the value at 0, which is nothing, giving ${Number(upper.toFixed(3))}. Dividing by the OLD power (${Number((upper * (n + 1)).toFixed(3))}) is like differentiating twice, and ${a * Math.pow(x, n)} is the original expression rather than its integral.`,
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
    // An EVEN mass keeps ½mv² a whole number, so the answer never carries a
    // decimal point that the distractors lack — the decimal alone used to mark
    // the key on every draw (`npm run audit:options`, numeric form: a learner
    // picking the longest option scored about 55% on this concept).
    // v starts at 3: at v = 2 the answer ½mv² equals the momentum mv, so the item
    // would print the same number twice and offer only three real options.
    const m = 2 * r.int(1, 6), v = r.int(3, 12);
    const ke = 0.5 * m * v * v;
    return {
      prompt: `What is the kinetic energy of a ${m} kg object moving at ${v} m/s, in joules?`,
      value: ke, tolerance: { abs: 0.01, unit: "J" },
      wrongs: [
        m * v * v,           // dropped the ½ — the commonest error
        m * v,               // energy left as momentum
        0.5 * m * v,         // forgot to square the speed
      ],
      tags: ["ke-mass"], difficulty: 0.5,
      explanation: `KE = ½mv² = ½ × ${m} × ${v}² = ${ke} J. The velocity is SQUARED, which is why doubling speed quadruples the energy. ${m * v} J is the momentum and ${m * v * v} J comes from dropping the ½ — neither is an energy.`,
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
    // Every option is the same quantity — watts, to 2 d.p. — so the printed
    // length of an option says nothing about whether it is the answer. The three
    // wrong values are the wrong-parameter slips this question actually invites:
    // the work reported without dividing, and the division done against half or
    // twice the time. The old set (w × t, t, w − t) put a value up to 4000 W
    // beside an answer of 62.5 W: an option no learner could consider, and the
    // longest string on screen.
    const watts = (x: number) => x.toFixed(2);
    return {
      prompt: `${w} J of work is done in ${t} s. What is the power, in watts?`,
      value: Number((w / t).toFixed(2)), tolerance: { abs: 0.01, unit: "W", display: watts(w / t) },
      wrongs: [
        watts(w / (t + 1)),
        watts(w / (t * 2)),
        watts(w * 2 / t),
      ],
      tags: ["eff-frac"], difficulty: 0.45,
      explanation: `Power = work ÷ time = ${w} ÷ ${t} = ${watts(w / t)} W. Power is the RATE of energy transfer, not the amount — and dividing by the time is what turns an amount into a rate.`,
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
      // Pa to 2 d.p. on every option, and the distractors are the slips that
      // keep the answer's magnitude: the AREA used one out of step, and the
      // answer halved or doubled (using twice, or half, the stated area). The
      // famous "multiplied instead of divided" error (f × a) is deliberately NOT
      // among them: it lands two or three orders of magnitude away, which makes
      // it both obvious to any learner and — because it is by far the longest
      // string on screen — a giveaway to one who reads only lengths.
      const pascals = (x: number) => x.toFixed(2);
      return {
        prompt: `A force of ${f} N acts on an area of ${a} m². What is the pressure, in pascals?`,
        value: Number((f / a).toFixed(2)), tolerance: { abs: 0.01, unit: "Pa", display: pascals(f / a) },
        wrongs: [pascals(f / (a + 1)), pascals(f / (a * 2)), pascals((f * 2) / a)],
        tags: [], difficulty: 0.4,
        explanation: `Pressure = force ÷ area = ${f} ÷ ${a} = ${pascals(f / a)} Pa. The same force over a smaller area is a bigger pressure — that is why a drawing pin works.`,
      };
    }
    // The depth starts at 2 m so that "one metre deeper" and "double the depth"
    // are always two different pressures — with depth = 1 they are the same
    // value and the item would offer the answer twice.
    const rho = r.pick([1000, 800, 13600]), depth = r.int(2, 20);
    const g = 10;
    return {
      prompt: `What is the pressure ${depth} m below the surface of a fluid of density ${rho} kg/m³? (g = ${g} N/kg). Give your answer in pascals.`,
      value: rho * g * depth, tolerance: { unit: "Pa" },
      // Every option is ρgh-shaped and the same order of magnitude: the depth
      // read one metre out, the depth doubled, and the answer with g taken as
      // 1 N/kg. The old set (ρ × depth, g × depth, ρ × g) put 50 Pa beside
      // 50000 Pa — an option nobody could consider, and because it was also the
      // shortest string on the page it handed a length-only guesser the key.
      wrongs: [rho * g * (depth + 1), rho * g * depth * 2, (rho * g * depth) / 10],
      tags: [], difficulty: 0.55,
      explanation: `p = ρgh = ${rho} × ${g} × ${depth} = ${rho * g * depth} Pa. Depth matters, not the shape of the container — and dropping g measures something else entirely.`,
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
        // Year counts in one band: doubled, halved, and a power-of-ten slip. The
        // old `ly × 1000` was four or five characters longer than the answer on
        // every draw — a length cue and an implausible option at once.
        value: ly, wrongs: [ly * 2, Math.round(ly / 2), ly * 10],
        tags: [], difficulty: 0.4,
        explanation: `A light-year is the DISTANCE light travels in one year, so light from ${ly} light-years away takes ${ly} years. Looking out is looking back in time.`,
      };
    }
    const m = r.int(2, 9);
    return {
      prompt: `A main-sequence star has a mass ${m} times the Sun's. Using the rough rule L ∝ M³, what is its luminosity in solar units?`,
      // The three ways of getting the exponent wrong: the square (a very common
      // slip), three times the mass, and the fourth power. The fourth power also
      // keeps the option band honest — m, m² and 3m are ALL smaller than m³, so
      // the key used to be the longest string on every draw.
      value: Math.pow(m, 3), wrongs: [Math.pow(m, 2), m * 3, Math.pow(m, 4)],
      tags: [], difficulty: 0.6,
      explanation: `L ∝ M³, so a star ${m}× the Sun's mass is ${m}³ = ${Math.pow(m, 3)}× as luminous. The cube is why massive stars are so short-lived — the square (${Math.pow(m, 2)}) or the fourth power (${Math.pow(m, 4)}) is the wrong exponent.`,
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
      // BOTH INDICES IN ONE NOTATION, AND BRACED: this read `XₚY_q` — a unicode
      // subscript on one letter and an underscore on the next — while the
      // explanation printed `X4Y3` with no indices at all. Three spellings of one
      // formula in three lines. `X_{p}Y_{q}` is the form lib/math-text.ts draws as
      // a subscript in BOTH places, so the formula on the page is the formula in
      // the working. (Braced rather than `X_pY_q` because a bare `_p` directly
      // followed by another letter is left alone on purpose — that is how an
      // identifier like `data_dir` stays an identifier.)
      prompt: `A compound forms from element X (valency ${a}) and element Y (valency ${b}). In the formula X_{p}Y_{q}, what is p + q when they are in their simplest whole-number ratio?`,
      value: (b / gcd(a, b)) + (a / gcd(a, b)), wrongs: [a + b, a * b, 2],
      tags: [], difficulty: 0.6,
      explanation: `Swap the valencies: X takes Y's valency (${b}) and Y takes X's (${a}), giving X_{${b / gcd(a, b)}}Y_{${a / gcd(a, b)}}. So p + q = ${(b / gcd(a, b)) + (a / gcd(a, b))}. The total charge must cancel.`,
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
    const total = nums.reduce((s, n) => s + n, 0);
    const mean = total / nums.length;
    // The stem asks for 2 d.p., so EVERY option is written to 2 d.p. — the
    // answer included, through `tolerance.display`, which sets the printed
    // option while leaving the marked value alone. The old distractors (the
    // median and the total as bare integers) were a different kind of number
    // from a 2 d.p. answer, and on the MCQ twin that difference was the only
    // signal a learner reading lengths needed. The three wrong values are the
    // three real confusions: median for mean, the total divided by the wrong
    // count, and range for mean.
    const dp = (x: number) => x.toFixed(2);
    return {
      prompt: `What is the MEAN of ${nums.join(", ")}? (2 d.p.)`,
      value: Number(mean.toFixed(2)), tolerance: { abs: 0.01, display: dp(mean) },
      // The fourth candidate is the total itself. It is needed because the
      // median distractor IS the mean whenever the median happens to be the
      // mean's value (`29, 8, 17, 21, 30` → both 21), and the assembler drops a
      // distractor that duplicates an option already taken — leaving two
      // wrongs, which the numeric padder then filled with `22` beside the
      // existing `22.00`. Offering the sum is a real confusion, and it means
      // the option set never has to be padded.
      wrongs: [dp(sorted[2]), dp(total / (nums.length - 1)), dp(sorted[4] - sorted[0]), dp(total)],
      tags: ["outlier-mean"], difficulty: 0.4,
      explanation: `Mean = total ÷ count = ${total} ÷ 5 = ${dp(mean)}. The median is ${sorted[2]} — a different average, chosen for different reasons — and dividing by 4 instead of 5 gives ${dp(total / 4)}.`,
    };
  },

  coordinates: (r) => {
    const x1 = r.int(-8, 8), y1 = r.int(-8, 8), x2 = r.int(-8, 8), y2 = r.int(-8, 8);
    return {
      prompt: `What is the x-coordinate of the midpoint of (${x1}, ${y1}) and (${x2}, ${y2})?`,
      // THE TWO MARKERS ARE PLOTTED, because this is a coordinate-geometry item
      // and a learner should be able to SEE where the pair sits before averaging
      // it. The range is the full tick grid the coordinates are drawn from, so
      // the points are always inside the frame and always in the stem's units.
      //
      // The MIDPOINT is deliberately not marked — it is the answer — which is the
      // rule in lib/types.ts#FigureSpec: a figure may restate the question, never
      // mark the answer.
      figure: { kind: "axes", xMin: -9, xMax: 9, yMin: -9, yMax: 9, points: [{ at: [x1, y1] }, { at: [x2, y2] }] },
      value: (x1 + x2) / 2, tolerance: { abs: 0.01 },
      wrongs: [(y1 + y2) / 2, x1 + x2, x2 - x1],
      tags: [], difficulty: 0.5,
      explanation: `The midpoint sits exactly halfway between the two points, so each coordinate is the mean of the two: x = (${x1} + ${x2}) ÷ 2 = ${(x1 + x2) / 2}. Averaging the y values instead (${(y1 + y2) / 2}) gives the midpoint's other coordinate, and adding the x values without halving (${x1 + x2}) measures the run between the points rather than the middle of it.`,
    };
  },

  microscopy: (r) => {
    const real = r.pick([5, 10, 20, 50]), mag = r.pick([100, 200, 400, 1000]);
    return {
      prompt: `A cell ${real} μm wide is viewed at ×${mag} magnification. How wide does it appear, in μm?`,
      value: real * mag, tolerance: { unit: "μm" },
      // Magnification cannot shrink an image, so every option stays in the
      // answer's own magnitude band: the magnification read one dial step out
      // either way, and the size with the magnification ADDED instead of applied.
      // The old set printed the inverse (real ÷ mag, a tiny decimal) beside the
      // answer, so the key was the longest string on the page on every draw.
      wrongs: [real * (mag + 10), real * (mag - 10), real + mag],
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
      explanation: `A locus is the set of every point that satisfies a single condition, and the points a fixed distance from one point trace out a circle. That distance IS the radius, ${d} cm, because every point on the circle is exactly ${d} from the centre. Doubling it (${d * 2}) describes the diameter instead, and ${d * d} squares the distance, which is not a length at all.`,
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
      explanation: `sin²θ + cos²θ = 1 is an identity: it holds for EVERY angle, not as a fact about ${theta}° in particular, because the sine and cosine are the legs of a right-angled triangle whose hypotenuse is 1. Substituting gives ${Number(val.toFixed(3))}, and the tiny difference from 1 is floating-point rounding in the calculation, not in the identity. Replying 0 would mean the two were opposites, and 2 would mean the identity had been applied twice.`,
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
      explanation: `The cost of a mixture per kilogram is the TOTAL cost divided by the TOTAL mass, never the average of the two prices. The nuts cost ${a} × £${x} = £${a * x} and the raisins ${b} × £${y} = £${b * y}, so £${a * x + b * y} spread over ${a + b} kg is £${Number(((a * x + b * y) / (a + b)).toFixed(2))} per kg. The plain average of the two prices (${Number(((x + y) / 2).toFixed(2))}) would only be right if the two masses were equal, which is exactly what the question varies.`,
    };
  },

  kinematics_extra: (r) => {
    const u = r.int(2, 10), a = r.int(2, 5), t = r.int(2, 6);
    return {
      prompt: `A body starts at ${u} m/s and accelerates at ${a} m/s² for ${t} s. How far does it travel, in metres?`,
      value: u * t + 0.5 * a * t * t, tolerance: { abs: 0.01, unit: "m" },
      wrongs: [u * t, 0.5 * a * t * t, (u + a * t) * t],
      tags: [], difficulty: 0.6,
      explanation: `The distance has two parts: the steady travel at the starting speed, plus what the acceleration adds on top. The acceleration part carries a ½ because the speed rises steadily from ${u} rather than jumping, so its average contribution is half of ${a} × ${t}². Adding up, s = ${u} × ${t} + ½ × ${a} × ${t}² = ${u * t + 0.5 * a * t * t} m; using ${u * t} alone assumes no acceleration, and ${(u + a * t) * t} assumes the final speed for the whole journey.`,
    };
  },
};

/** Greatest common divisor — used by the valency and ion-ratio items. */
function gcd(a: number, b: number): number {
  let x = Math.abs(a), y = Math.abs(b);
  while (y) { const t = y; y = x % y; x = t; }
  return x || 1;
}
