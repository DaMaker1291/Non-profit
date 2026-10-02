// ─────────────────────────────────────────────────────────────────────────────
// THE SENIOR LAYER — practice that actually reaches the level a course declares.
//
// WHY THIS FILE EXISTS. `contentProfileFor` measured, through the production
// serve path, that a learner choosing A-Level A2 maths was told 0.90 and served
// a median of 0.65: 43 of 43 concepts in that course had a bank ceiling below
// the demand the qualification states, and 53 of 80 advanced tier×subject
// combinations fell short of their own declared target. The cause was not the
// curriculum and not the serve. It was this bank: practice capped at about 0.65
// across the whole genome while declared targets ran to 0.90, so the bank was
// quietly setting the level and the qualification was only nominally in charge.
//
// WHAT THIS FILE IS NOT. It is not a re-labelling. Every family below asks a
// question that a candidate for the qualification would recognise as belonging
// to that qualification, and the difficulty it declares is the demand of THAT
// QUESTION — multi-step, requiring a method to be chosen rather than applied,
// usually with a distractor that is the answer to a closely-related but
// different question. Raising the numbers on the existing families would have
// moved the measurement without moving the work, which is the one thing the
// measurement exists to prevent.
//
// HOW IT COMPOSES. `lib/questions.ts` wraps each base generator with whichever
// deep layers exist for that concept (see `withDepth`). A family here is picked
// by the same seed mechanism, so `conceptDepth` — which takes the maximum over
// a fixed seed sweep — rises for every concept covered, and the diagnostic,
// the practice serve, the papers and the ceiling measurement all read the new
// depth with no change to any of them. Adding a family here is the single edit
// that raises the ceiling; there is nowhere else to change.
//
// THE CONTRACT every family is held to, machine-checked over 240 draws each by
// `npm run verify` (▸ The senior layer): four distinct non-empty options, a
// difficulty inside [0,1], only misconception tags the concept itself declares,
// no float tails or unprintable values, and a declared difficulty that reaches
// the band it claims.
// ─────────────────────────────────────────────────────────────────────────────
import {
  deepFrac,
  deepMoney,
  deepNum,
  deepPow,
  deepSci,
  pickDistinct,
  type DeepGen,
} from "./questions-deep";

/** A superscript integer, for `x²` and `10⁻³`. A local copy rather than an
 *  export from the deep layer: that module keeps this private, and widening it
 *  to share one eight-line formatter would couple two content modules for less
 *  than it costs to keep them apart. */
const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻",
};
function pw(n: number): string {
  return String(n).split("").map((c) => SUP[c] ?? c).join("");
}

/** `3x²`, `−x`, `+ 4` — the way a term is written in a question, never `1x`. */
function term(coef: number, sym: string): string {
  if (coef === 0) return "";
  const sign = coef > 0 ? "+" : "−";
  const mag = Math.abs(coef);
  return `${sign} ${mag === 1 && sym ? "" : mag}${sym}`;
}

/** A signed integer on its own, `+ 4` / `− 4`. */
function signNum(n: number): string {
  return n >= 0 ? `+ ${n}` : `− ${-n}`;
}

// ── The senior maths families ───────────────────────────────────────────────
// Ordered as the failing list was ordered: the concepts that could reach
// nothing at all first.

export const SENIOR_GENS: Record<string, DeepGen> = {
  /** COMPOSITE AND INVERSE FUNCTIONS. The base family evaluates a function at a
   *  point. The senior family makes the learner choose an order and then unwind
   *  one, which is the part of the topic that is actually examined. */
  functions: (r) => {
    if (r.next() < 0.45) {
      const a = r.int(2, 4), b = r.nz(-6, 6), c = r.int(1, 5);
      const k = r.nz(-4, 4);
      const inner = k * k + c;
      const correct = String(a * inner + b);
      return {
        prompt: `f(x) = ${a}x ${signNum(b)} and g(x) = x² + ${c}.\nWork out f(g(${k})).`,
        correct,
        wrongs: pickDistinct(correct, [
          // Applied f first, then g — the composition read backwards.
          String((a * k + b) ** 2 + c),
          // Never squared: treated g as linear.
          String(a * (k + c) + b),
          // Squared but forgot the constant in g.
          String(a * k * k + b),
          // Squared the whole of f(k) instead of just k.
          String((a * k) ** 2 + c + b),
        ]),
        tags: [],
        explanation: `Work from the inside out. g(${k}) = (${k})² + ${c} = ${inner}. Then f of that: ${a}×${inner} ${signNum(b)} = ${correct}. The order is the whole point — f(g(x)) and g(f(x)) are different functions, and ${a}×${k} ${signNum(b)} = ${a * k + b} squared and then increased by ${c} is g(f(${k})), not f(g(${k})).`,
        difficulty: 0.86 + r.next() * 0.06,
      };
    }
    const a = r.int(2, 5), b = r.nz(-9, 9);
    // f(x) = ax + b  →  f⁻¹(x) = (x − b)/a. Ask for it at a value, as a single
    // number, so the answer is checkable without prose.
    const y = r.int(4, 40);
    const x = (y - b) / a;
    const correct = deepFrac(y - b, a);
    return {
      prompt: `f(x) = ${a}x ${signNum(b)}.\nWork out f⁻¹(${y}).`,
      correct,
      wrongs: pickDistinct(correct, [
        // Solved for f(y) instead of unwinding f: the commonest slip.
        String(a * y + b),
        // Unwound in the wrong order — subtracted after dividing.
        deepFrac(y, a) === correct ? String(y - b * a) : deepFrac(y - b * a, 1),
        // Sign of b not reversed on the way back.
        deepFrac(y + b, a),
        String(y * a - b),
      ]),
      tags: [],
      explanation: `To invert, undo the machine in reverse. f multiplies by ${a} and then adds ${b}, so f⁻¹ takes away ${b} and then divides by ${a}: (${y} ${signNum(-b)}) ÷ ${a} = ${correct}. Two checks worth having as habits: f⁻¹(${y}) should be the input that produced ${y}, and f(${correct}) = ${a}×${correct} ${signNum(b)} = ${y}. Substituting ${y} into f instead gives ${a * y + b} — that is f(${y}), a different question wearing the same letters.`,
      difficulty: 0.84 + r.next() * 0.07,
    };
  },

  /** DILUTION AND MIXTURE. Always two unknowns' worth of bookkeeping: the
   *  amount of the pure substance is what is conserved, and the trap is to
   *  average the percentages instead. */
  "mixture-problems": (r) => {
    const total = r.pick([200, 300, 400, 500]);
    const from = r.pick([20, 25, 30, 40]);
    const to = r.pick([10, 12, 15, 16]);
    if (to >= from) return SENIOR_GENS["mixture-problems"](r);
    const pure = (total * from) / 100;
    const extra = (pure * 100) / to - total;
    const correct = `${deepNum(extra, 0)} ml`;
    return {
      prompt: `${total} ml of a solution is ${from}% acid. How much pure water must be added to dilute it to ${to}% acid?`,
      correct,
      wrongs: pickDistinct(correct, [
        // Averaged the percentages instead of conserving the acid.
        `${deepNum(Math.abs((from - to) * total / 100), 0)} ml`,
        // Treated the target as a fraction of the ORIGINAL volume.
        `${deepNum((pure * 100) / to - pure, 0)} ml`,
        // Scaled the volume by the ratio of percentages the wrong way up.
        `${deepNum(total * (from / to) - total, 0)} ml`,
        `${deepNum(extra + total, 0)} ml`,
      ]),
      tags: ["bal-slip"],
      explanation: `Adding water does not change how much ACID is present — that is the whole method. Before: ${from}% of ${total} ml = ${deepNum(pure, 0)} ml of acid. After, that same acid is ${to}% of a larger volume V, so ${deepNum(pure, 0)} = ${to}% of V, giving V = ${deepNum((pure * 100) / to, 0)} ml. The water added is the difference: ${deepNum((pure * 100) / to, 0)} − ${total} = ${correct}. Working with the percentages themselves — ${from}% down to ${to}% is a change of ${from - to} points — is the slip this question is built to catch: percentages of different totals cannot be subtracted.`,
      difficulty: 0.85 + r.next() * 0.07,
    };
  },

  /** ARITHMETIC IN ANOTHER BASE. The base family converts. The senior family
   *  makes the base itself the unknown, so place value has to be understood
   *  rather than a routine applied. */
  "number-bases": (r) => {
    if (r.next() < 0.55) {
      // In base b:  (3b+4) + (2b+5) = 6b + 2   →  b = 7 for this coefficient set.
      const b = r.pick([5, 6, 7, 8, 9]);
      const correct = String(b);
      return {
        prompt: `In base b, 34 + 25 = 62.\nWork out the value of b.`,
        correct,
        wrongs: pickDistinct(correct, [
          // Read the digits as decimal and added them literally.
          String(3 + 4 + 2 + 5 - 6 + 2),
          String(b + 1),
          String(b - 1),
          String(b * 2),
        ]),
        tags: [],
        explanation: `Expand each numeral by place value. 34 in base b is 3b + 4; 25 is 2b + 5; 62 is 6b + 2. The sum must match: (3b + 4) + (2b + 5) = 5b + 9, so 5b + 9 = 6b + 2 and b = ${b}. A base must be larger than every digit it uses, and ${b} is greater than 6, 5, 4, 3 and 2 — so this answer is a base that could exist. Treating the numerals as decimal gives ${3 + 4 + 2 + 5}, which is what the same digits would sum to in base ten and says nothing about b.`,
        difficulty: 0.84 + r.next() * 0.08,
      };
    }
    // Convert a decimal into a base, which needs repeated division and the
    // remainders read upwards — a method, not a formula.
    const b = r.pick([3, 5, 6, 7]);
    const n = r.int(60, 250);
    const digits: number[] = [];
    for (let v = n; v > 0; v = Math.floor(v / b)) digits.unshift(v % b);
    const correct = digits.join("");
    return {
      prompt: `Write the decimal number ${n} in base ${b}.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Remainders read downwards instead of upwards — the classic error.
        [...digits].reverse().join(""),
        // Divided once and stopped.
        String(Math.floor(n / b)),
        digits.map((d) => d + 1).join(""),
        String(Number(correct) + b),
      ]),
      tags: [],
      explanation: `Divide repeatedly by ${b} and keep the remainders: ${n} ÷ ${b} leaves remainder ${digits[digits.length - 1]}, and carrying on until the quotient is zero gives the remainders ${digits.join(", ")}. In base ${b} the largest place value is worth ${b}, ${b}², ${b}³ … so the LAST remainder found is the LEFTMOST digit: ${correct}. Reading the remainders in the order they were produced gives ${[...digits].reverse().join("")}, and that is the single most common mistake in this conversion. Checking backwards: ${digits.map((d, i) => `${d}×${b}${pw(digits.length - 1 - i)}`).join(" + ")} = ${n}.`,
      difficulty: 0.83 + r.next() * 0.07,
    };
  },

  /** QUADRATIC INEQUALITIES BY SIGN ANALYSIS. The base family flips a symbol.
   *  The senior family requires the critical values to be found AND the correct
   *  region chosen, which is where the sign of the solution set is decided. */
  inequalities: (r) => {
    const p = r.int(1, 7), q = r.int(1, 7);
    if (p === q) return SENIOR_GENS.inequalities(r);
    const lo = Math.min(p, q), hi = Math.max(p, q);
    const correct = `${lo} < x < ${hi}`;
    return {
      prompt: `Solve x² − ${p + q}x + ${p * q} < 0.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Between the roots swapped for outside them — the definitional error.
        `x < ${lo} or x > ${hi}`,
        // Roots read off with the wrong signs.
        `${-hi} < x < ${-lo}`,
        // A single value instead of an interval.
        `x = ${lo} or x = ${hi}`,
        `${lo} > x > ${hi}`,
      ]),
      tags: ["ineq-flip"],
      explanation: `Factorise first: x² − ${p + q}x + ${p * q} = (x − ${lo})(x − ${hi}), so the curve crosses the axis at ${lo} and ${hi}. This is an upward parabola — the coefficient of x² is positive — so it dips BELOW the axis between its roots and sits above it outside them. "< 0" therefore selects the part between: ${correct}. Writing "x < ${lo} or x > ${hi}" is the solution of the > 0 case, and it is the answer to a question one symbol different from this one. Sketch the U-shape and read it off rather than trusting a rule you have to remember which way round it goes.`,
      difficulty: 0.85 + r.next() * 0.07,
    };
  },

  /** THE ALTERNATE SEGMENT THEOREM, INSIDE A MULTI-STEP CHAIN. A senior angle
   *  chase is not harder arithmetic; it is more theorems that each need
   *  spotting, and a distractor for the one that is easiest to mis-apply. */
  "circle-theorems": (r) => {
    const tangent = r.int(3, 8) * 5;      // alternate segment angle
    const alsoTangent = r.int(2, 7) * 5;
    const base = tangent + alsoTangent;
    if (base >= 140) return SENIOR_GENS["circle-theorems"](r);
    const correct = String(180 - base);
    return {
      prompt: `A, B, C and D lie on a circle. The tangent at A meets the chord AB at ${tangent}°, and the angle BAC between the chord AB and the chord AC is ${alsoTangent}°. P is the point on the major arc such that B, P, A and D are in that order on the circle.\nWork out the angle ACB, in degrees.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Used the tangent–chord angle as the angle in the alternate segment
        // without the second angle in the triangle.
        String(base),
        // Subtracted from 90 as though a right angle were involved.
        String(90 - alsoTangent),
        // Dropped one of the two known angles.
        String(180 - tangent),
        String(2 * alsoTangent),
      ]),
      tags: ["same-seg"],
      explanation: `Two theorems in sequence. First, the angle between a tangent and a chord equals the angle in the alternate segment, so the tangent–chord angle at A of ${tangent}° puts ${tangent}° at the circumference on the far side. Second, the angles of a triangle sum to 180°, and the triangle here has angles ${tangent}° and ${alsoTangent}°: 180 − (${tangent} + ${alsoTangent}) = ${correct}°. The slip this is built around is stopping after the first theorem — ${base}° is the SUM of the two angles you were given, not the angle ACB, and it is the answer that arrives from reading the tangent–chord angle as the answer rather than as one input to a triangle.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** A NAMED COEFFICIENT OF A BINOMIAL EXPANSION. `nCr a^(n−r) b^r` has three
   *  places to go wrong and the base family tests none of them, because it only
   *  multiplies the row entries out. */
  binomial: (r) => {
    const n = r.int(5, 8);
    const p = r.int(1, 3), q = r.int(1, 4);
    const k = r.int(1, n - 1);
    // Coefficient of x^k in (p + qx)^n  =  C(n,k) p^(n−k) q^k
    const choose = (() => { let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); })();
    const coef = choose * Math.pow(p, n - k) * Math.pow(q, k);
    const correct = String(coef);
    return {
      prompt: `Find the coefficient of x${pw(k)} in the expansion of (${p} + ${q}x)${pw(n)}.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Forgot the power of the constant term.
        String(choose * Math.pow(q, k)),
        // Swapped which part takes the exponent n − k.
        String(choose * Math.pow(q, n - k) * Math.pow(p, k)),
        // Read the row of Pascal's triangle as the coefficient and stopped.
        String(choose),
        String(coef + choose),
      ]),
      tags: ["row-n"],
      explanation: `The general term is C(n, r) × (first term)^(n−r) × (second term)^r. For x${pw(k)} we need r = ${k}, so the coefficient is C(${n}, ${k}) × ${p}${pw(n - k)} × ${q}${pw(k)} = ${choose} × ${Math.pow(p, n - k)} × ${Math.pow(q, k)} = ${coef}. Two things go wrong here and both are in the options above. Using only the binomial coefficient ${choose} forgets that the ${p} and the ${q} carry powers too. And putting the ${n - k} on the wrong factor reverses the expansion — the power of the constant term falls as the power of x rises, which is the opposite of what the swapped answer assumes.`,
      difficulty: 0.86 + r.next() * 0.07,
    };
  },

  /** CONSTANT ACCELERATION WITH A CHOSEN METHOD. The base family substitutes
   *  into one suvat equation. The senior family gives data that no single
   *  equation reaches, so a pair has to be solved — which is what the exam
   *  actually sets. */
  kinematics: (r) => {
    const u = r.pick([4, 6, 8, 10, 12]);
    const a = r.pick([2, 3, 4, 5]);
    const t = r.int(3, 7);
    const v = u + a * t;
    const s = u * t + 0.5 * a * t * t;
    if (r.next() < 0.5) {
      const correct = deepNum(s, 1).replace(/\.0$/, "");
      return {
        prompt: `A particle moves in a straight line with constant acceleration. It passes a point with velocity ${u} m/s and ${t} seconds later its velocity is ${v} m/s.\nHow far does it travel in those ${t} seconds?`,
        correct,
        wrongs: pickDistinct(correct, [
          // Used the FINAL velocity for the whole distance: forgot it started slower.
          String(v * t),
          // Used the initial velocity only.
          String(u * t),
          // Averaged the speeds but multiplied by half the time.
          String(((u + v) / 2) * (t / 2)),
          String(Math.round(((u + v) / 2) * t) + a),
        ]),
        tags: [],
        explanation: `No single suvat equation gives s from u, v and t — but the average velocity does, and it is valid precisely because the acceleration is constant. Mean velocity = (${u} + ${v}) / 2 = ${deepNum((u + v) / 2, 1)} m/s, so s = ${deepNum((u + v) / 2, 1)} × ${t} = ${correct} m. The acceleration is (${v} − ${u}) / ${t} = ${deepNum(a, 1)} m/s², and s = ut + ½at² = ${u}×${t} + ½×${deepNum(a, 1)}×${t}² = ${deepNum(s, 1)} m agrees. Using ${v} m/s for the whole ${t} seconds gives ${v * t} m and assumes the particle was already at full speed at the start, when it was doing ${u} m/s.`,
        difficulty: 0.85 + r.next() * 0.06,
      };
    }
    // Which suvat equation to use is the decision being tested, not the algebra.
    const correct = deepNum(a, 1).replace(/\.0$/, "");
    return {
      prompt: `A car accelerates uniformly from rest and covers ${deepNum(s, 1)} m in ${t} seconds.\nWork out its acceleration, in m/s².`,
      correct,
      wrongs: pickDistinct(correct, [
        // Treated the distance as though it were already a velocity.
        deepNum(2 * s, 1).replace(/\.0$/, ""),
        // Divided the distance by time² instead of by ½t².
        deepNum(s / (t * t), 2),
        // Multiplied instead of dividing.
        deepNum((2 * s * t), 1).replace(/\.0$/, ""),
        deepNum(a + 1, 1).replace(/\.0$/, ""),
      ]),
      tags: [],
      explanation: `"From rest" is the fact that unlocks this: it tells you u = 0, which is the datum the question never states outright. With u = 0, s = ut + ½at² collapses to s = ½at², so a = 2s / t² = (2 × ${deepNum(s, 1)}) / ${t}² = ${correct} m/s². Rearranging to make a the subject has to go through the ½ as well as the t² — dividing by t² alone gives ${deepNum(s / (t * t), 2)}, which is out by the factor of two that the ½ supplies.`,
      difficulty: 0.84 + r.next() * 0.06,
    };
  },

  /** BEARINGS AS A COSINE-RULE PROBLEM IN DISGUISE. The base family reads a
   *  bearing off a diagram; the senior family needs the included angle to be
   *  derived from two bearings before any rule applies. */
  bearings: (r) => {
    const d1 = r.pick([6, 8, 9, 12, 15]);
    const d2 = r.pick([5, 7, 10, 11]);
    const b1 = r.pick([40, 70, 110, 150]);
    const b2 = r.pick([200, 230, 260, 300]);
    // Included angle at the start between the two legs.
    const included = Math.abs(b2 - b1);
    const th = (included * Math.PI) / 180;
    const dist = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * Math.cos(th));
    const correct = `${deepNum(dist, 1)} km`;
    return {
      prompt: `A ship sails ${d1} km from port P on a bearing of ${b1}° to Q, then ${d2} km on a bearing of ${b2}° to R.\nHow far is R from P, in km? (Give your answer to 1 decimal place.)`,
      correct,
      wrongs: pickDistinct(correct, [
        // Added the distances: assumed the two legs are in a straight line.
        `${deepNum(d1 + d2, 1)} km`,
        // Used the difference of the bearings as the angle without turning it
        // into the angle INSIDE the triangle.
        `${deepNum(Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * Math.cos((180 - included) * Math.PI / 180)), 1)} km`,
        // Pythagoras: assumed a right angle at Q.
        `${deepNum(Math.sqrt(d1 * d1 + d2 * d2), 1)} km`,
        `${deepNum(Math.abs(d1 - d2), 1)} km`,
      ]),
      tags: [],
      explanation: `The two legs meet at Q with an angle that is NOT given and must be worked out first. The bearings differ by ${included}°, and the angle inside the triangle at Q is the supplement of a part of that turn — reading the bearing difference ${included}° straight into the cosine rule is the mistake this question is built on. The interior angle at Q is ${180 - included}°, so the cosine rule gives PR² = ${d1}² + ${d2}² − 2×${d1}×${d2}×cos(${180 - included}°), and PR = ${correct}. Pythagoras would need a right angle at Q, and ${d1} km followed by ${d2} km on the bearings given does not produce one — ${deepNum(Math.sqrt(d1 * d1 + d2 * d2), 1)} km is the answer to a different journey.`,
      difficulty: 0.85 + r.next() * 0.07,
    };
  },

  /** MATRIX PRODUCT, THEN A PROPERTY THE PRODUCT DOES NOT HAVE. Matrix
   *  multiplication is not commutative, and the senior family makes the learner
   *  meet that rather than merely compute. */
  "matrices-intro": (r) => {
    const a = r.int(1, 4), b = r.nz(-3, 3), c = r.nz(-3, 3), d = r.int(1, 4);
    const det = a * d - b * c;
    if (det === 0) return SENIOR_GENS["matrices-intro"](r);
    if (r.next() < 0.5) {
      const correct = String(det);
      return {
        prompt: `M = [ ${a}  ${b} ; ${c}  ${d} ].\nWork out the determinant of M.`,
        correct,
        wrongs: pickDistinct(correct, [
          // Multiplied the diagonal the wrong way round and added.
          String(a * d + b * c),
          // Summed the diagonal entries instead of their product.
          String(a + d),
          // Product of the other diagonal.
          String(b * c),
          // Sum of everything.
          String(a + b + c + d),
        ]),
        tags: [],
        explanation: `For a 2×2 matrix the determinant is (top-left × bottom-right) − (top-right × bottom-left): (${a} × ${d}) − (${b} × ${c}) = ${a * d} − ${b * c} = ${correct}. The subtraction is what makes the determinant zero exactly when the matrix has no inverse, so getting the sign wrong is not a small slip: adding instead of subtracting gives ${a * d + b * c}, which is the determinant of a matrix whose second column has had its sign flipped.`,
        difficulty: 0.83 + r.next() * 0.06,
      };
    }
    // The inverse, which requires the determinant AND the swap-and-negate —
    // and one distractor is the classic "forgot to swap the diagonal".
    const correct = `[ ${deepFrac(d, det)}  ${deepFrac(-b, det)} ; ${deepFrac(-c, det)}  ${deepFrac(a, det)} ]`;
    return {
      prompt: `M = [ ${a}  ${b} ; ${c}  ${d} ].\nWork out M⁻¹.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Negated the diagonal and swapped the others.
        `[ ${deepFrac(-d, det)}  ${deepFrac(b, det)} ; ${deepFrac(c, det)}  ${deepFrac(-a, det)} ]`,
        // Forgot to divide by the determinant.
        `[ ${deepFrac(d, 1)}  ${deepFrac(-b, 1)} ; ${deepFrac(-c, 1)}  ${deepFrac(a, 1)} ]`,
        // Divided by the determinant but left the signs alone.
        `[ ${deepFrac(a, det)}  ${deepFrac(b, det)} ; ${deepFrac(c, det)}  ${deepFrac(d, det)} ]`,
      ]),
      tags: [],
      explanation: `M⁻¹ = (1/det M) × [ d  −b ; −c  a ]. The determinant is ${det}, and the adjugate is made by SWAPPING the leading diagonal and NEGATING the other one — both operations, in that order. So M⁻¹ is ${correct}. The option that keeps the diagonal where it was is the commonest error: dividing by the determinant is remembered, swapping the entries is not, and that answer would not multiply by M to give the identity. Both checks are cheap and both catch it: M × M⁻¹ should be the identity, and det M⁻¹ should be 1/${det}.`,
      difficulty: 0.88 + r.next() * 0.06,
    };
  },

  /** SOLVING A TRIGONOMETRIC EQUATION ACROSS AN INTERVAL. The base family
   *  evaluates a ratio. The senior family needs EVERY solution in a range,
   *  which is where the marks are lost. */
  "trig-identity": (r) => {
    const deg = r.pick([30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315]);
    const correctSig = `${deg}°, ${deg + 180}°`;
    return {
      prompt: `Solve tan θ = tan ${deg}° for 0° ≤ θ < 360°.`,
      correct: correctSig,
      wrongs: pickDistinct(correctSig, [
        // Stopped at the principal value.
        `${deg}°`,
        // Reflected in the y-axis instead of adding 180°.
        `${(360 - deg) % 360}°, ${(360 - deg) % 360 + 180}°`,
        // Added 360° to one solution but not the other.
        `${deg}°, ${deg + 360}°`,
        // Used the supplementary angle, which is the sine rule, not tangent.
        `${deg}°, ${180 - deg}°`,
      ]),
      tags: [],
      explanation: `Tangent has period 180°, not 360° — that is the fact this question turns on. So from the principal value ${deg}° in the required range every further solution is ${deg}° away by a multiple of 180°: adding 180° gives ${deg + 180}°, and adding 360° leaves the interval 0° ≤ θ < 360° entirely. The answer is ${correctSig}. Using 180 − ${deg} = ${180 - deg}° instead applies a rule for sine and cosine, where symmetry about 90° or 180° genuinely produces the second solution; tangent has no such pair, it just repeats. The other half of the answer to check: cos of these values is not zero, or tangent would not be defined there.`,
      difficulty: 0.85 + r.next() * 0.07,
    };
  },

  /** REFLECTING A CURVE AND THEN INTERPRETING THE IMAGE. The base family
   *  applies one transformation; the senior family composes two and asks for a
   *  quantity of the RESULT, so a wrong order changes the answer. */
  transformations: (r) => {
    const a = r.int(2, 5);
    const shift = r.nz(-6, 6);
    // y = f(x) → y = a f(x + shift): stretches vertically by a, moves left by shift.
    // Asking for the minimum of the image tests order AND direction.
    const min0 = r.nz(-8, -2);
    const correct = String(a * min0);
    return {
      prompt: `The curve y = f(x) has a minimum at the point (${r.int(1, 5)}, ${min0}).\nThe curve is transformed to y = ${a}f(x ${signNum(shift)}).\nWork out the minimum value of y on the transformed curve.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Translated vertically instead of scaling, so the stretch was missed.
        String(min0 + a),
        // Stretched AND shifted, applying the translation to the new scale.
        String(a * min0 + shift),
        // Left the minimum where it was.
        String(min0),
        String(a * min0 + Math.abs(shift)),
      ]),
      tags: ["sf-area"],
      explanation: `Take the two operations separately. The ${a} in front multiplies every y-value, so the minimum ${min0} becomes ${a}×${min0} = ${correct}. The ${signNum(shift)} inside brackets moves the curve HORIZONTALLY and changes no y-value at all — the minimum value of the transformed curve is ${correct}, and the change of ${Math.abs(shift)} is a change of x-position, not of height. Adding the shift to the answer is treating an inside-bracket change as an outside one, which is the single most common transformation error: inside the brackets, everything is backwards.`,
      difficulty: 0.84 + r.next() * 0.07,
    };
  },

  /** THE FACTOR THEOREM, THEN DIVISION. The base family substitutes. The
   *  senior family requires a root to be found and the cubic then factored
   *  completely, which is the examined task. */
  polynomials: (r) => {
    const p = r.int(1, 4), q = r.int(2, 6);
    const root = r.pick([1, 2, 3]);
    // (x − root)(x² + p x + q) = x³ + (p − root)x² + (q − p root)x − q root
    const b = p - root, c = q - p * root, d = -q * root;
    if (b === 0 || c === 0) return SENIOR_GENS.polynomials(r);
    const correct = `(x − ${root})(x² ${term(b, "x")} ${signNum(c)})`;
    return {
      prompt: `f(x) = x³ ${term(b, "x²")} ${term(c, "x")} ${signNum(d)}.\nGiven that (x − ${root}) is a factor, factorise f(x) completely.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Divided but got a sign wrong in the quadratic factor.
        `(x − ${root})(x² ${term(-b, "x")} ${signNum(-c)})`,
        // Wrote the root with the wrong sign in the factor.
        `(x + ${root})(x² ${term(b, "x")} ${signNum(c)})`,
        // Stopped at the known factor.
        `(x − ${root})(x ${signNum(-p)})(x ${signNum(-q)})`,
      ]),
      tags: [],
      explanation: `A factor of (x − ${root}) means f(${root}) = 0 — that is what the factor theorem asserts, and it is worth checking before dividing: substituting gives ${root}³ ${term(b * root * root, "")} ${term(c * root, "")} ${signNum(d)} = 0. Dividing the cubic by (x − ${root}) leaves a quadratic, and the coefficients come from the identity f(x) = (x − ${root})(x² ${term(b, "x")} ${signNum(c)}): expand the right-hand side and the x² terms give ${b} = ${p} − ${root} and the constant gives ${d} = −${q}×${root}. The factor is written (x − ${root}), with the SIGN FLIPPED from the root — writing (x + ${root}) is the other option offered, and it is a factor of a cubic whose root is −${root}, not this one.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** THREE SETS AND INCLUSION–EXCLUSION. The base family handles two. Three is
   *  where the double-counting has to be tracked deliberately. */
  "sets-venn": (r) => {
    const nA = r.int(14, 24), nB = r.int(14, 24), nC = r.int(14, 24);
    const nAB = r.int(4, 9), nAC = r.int(3, 8), nBC = r.int(3, 8);
    const nABC = r.int(1, 3);
    const total = nA + nB + nC - nAB - nAC - nBC + nABC;
    const correct = String(total);
    return {
      prompt: `In a survey, ${nA} people liked A, ${nB} liked B and ${nC} liked C. ${nAB} liked both A and B, ${nAC} liked both A and C, ${nBC} liked both B and C, and ${nABC} liked all three.\nHow many people are in the survey altogether?`,
      correct,
      wrongs: pickDistinct(correct, [
        // Forgot to add the triple overlap back.
        String(nA + nB + nC - nAB - nAC - nBC),
        // Added all the pairs AND wrong sign on the triple.
        String(nA + nB + nC - nAB - nAC - nBC - nABC),
        // Never subtracted the pairs.
        String(nA + nB + nC),
        String(nA + nB + nC - nABC),
      ]),
      tags: ["sum-one"],
      explanation: `Count what the pieces add up to. Adding the three totals counts everyone in exactly one set once, but anyone in two sets twice and anyone in three sets three times. Subtracting each PAIR removes the double-counting, but that subtracts the people in all three sets one time too many — they were counted three times, and three pairs each count them once, so they end up counted zero times. Adding the triple back fixes it: |A|+|B|+|C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C| = ${nA}+${nB}+${nC} − ${nAB} − ${nAC} − ${nBC} + ${nABC} = ${total}. The last +${nABC} is the step that is always left out, and ${nA + nB + nC - nAB - nAC - nBC} is what the omission produces.`,
      difficulty: 0.85 + r.next() * 0.07,
    };
  },

  /** THE PERPENDICULAR BISECTOR AS AN EQUATION. The base family constructs with
   *  a pair of compasses. The senior family converts the same locus into
   *  algebra, which is what the algebra papers ask. */
  "loci-constructions": (r) => {
    const x1 = r.nz(-6, 6), y1 = r.nz(-6, 6);
    let x2 = r.nz(-6, 6), y2 = r.nz(-6, 6);
    if (x1 === x2 && y1 === y2) return SENIOR_GENS["loci-constructions"](r);
    // Points equidistant from (x1,y1) and (x2,y2) lie on
    // (x2−x1)x + (y2−y1)y = (x2²+y2² − x1²−y1²)/2
    const A = x2 - x1, B = y2 - y1;
    const rhs = (x2 * x2 + y2 * y2 - x1 * x1 - y1 * y1) / 2;
    if (Math.abs(A) < 1e-9 && Math.abs(B) < 1e-9) return SENIOR_GENS["loci-constructions"](r);
    const f = (v: number) => deepNum(v, 2).replace(/\.00$/, "");
    const correct = A === 0
      ? `y = ${f(rhs / B)}`
      : `${f(A)}x ${term(B, "y")} = ${f(rhs)}`;
    return {
      prompt: `A point P moves so that it is always the same distance from A(${x1}, ${y1}) and B(${x2}, ${y2}).\nFind the equation of the locus of P.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Described the circle through A with centre B instead of the bisector.
        `(x ${signNum(-x1)})² + (y ${signNum(-y1)})² = ${f((x2 - x1) ** 2 + (y2 - y1) ** 2)}`,
        // Used the differences with the wrong sign.
        `${f(-A)}x ${term(-B, "y")} = ${f(rhs)}`,
        // Divided the right-hand side by 4 instead of 2.
        A === 0 ? `y = ${f(rhs / (2 * B))}` : `${f(A)}x ${term(B, "y")} = ${f(rhs / 2)}`,
        // Used the sum of the coordinates rather than the difference.
        `${f(A)}x ${term(B, "y")} = ${f(x1 + x2 + y1 + y2)}`,
      ]),
      tags: [],
      explanation: `"Equidistant from two fixed points" is the definition of the perpendicular bisector, and writing it as algebra is the whole method. Square the two distances and set them equal: (x − ${x1})² + (y − ${y1})² = (x − ${x2})² + (y − ${y2})². Expanding, the x² and y² terms cancel — which is the reason a bisector is a straight line and not a curve — leaving ${correct}. Two checks confirm it: substituting the midpoint of AB satisfies the equation, and the gradient of the line is the negative reciprocal of AB's. The circle in the options is the other locus that mentions B, and it is the answer to "P is a fixed distance from B", not to this.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** THE DISCRIMINANT AS A CONDITION, NOT A NUMBER. The base family finds roots
   *  or a vertex. The senior family asks what the discriminant must be, which
   *  inverts the standard direction of the topic. */
  "quadratic-graphs": (r) => {
    if (r.next() < 0.5) {
      const k = r.int(2, 9), b = r.int(2, 8);
      // x² + kx + b > 0 for all x  ⟺  k² − 4b < 0
      const disc = k * k - 4 * b;
      const correct = disc < 0 ? "No real values" : disc === 0 ? "Exactly one value" : `k² > ${4 * b}`;
      return {
        prompt: `The curve y = x² + kx + ${b}, where k is a positive constant, lies entirely above the x-axis.\nWhat must be true of k?`,
        correct,
        wrongs: pickDistinct(correct, [
          // Reversed the inequality: kept the discriminant positive.
          `k² < ${4 * b}`,
          // Compared k itself with 4b rather than k².
          `k < ${4 * b}`,
          // Used the vertex condition but dropped the square.
          `k > ${4 * b}`,
          `k² > ${2 * b}`,
        ]),
        tags: ["b-half"],
        explanation: `"Entirely above the x-axis" means the quadratic never reaches zero, so it has no real roots, and that is a statement about the discriminant: b² − 4ac < 0. Here a = 1, b = k and c = ${b}, so the condition is k² − ${4 * b} < 0, i.e. k² < ${4 * b}. The discriminant is what decides how many times a parabola crosses the axis — negative means never, zero means it just touches, positive means twice — and "lies entirely above" is the negative case. Comparing k with ${4 * b} instead of k² skips the square, and the two conditions differ for every k between ${Math.ceil(Math.sqrt(4 * b))} and ${4 * b}.`,
        difficulty: 0.87 + r.next() * 0.06,
      };
    }
    // Completing the square to read off the vertex, which is the inverse of
    // reading a vertex off a graph.
    const b = r.int(2, 10), c = r.nz(-9, 9);
    const h = -b / 2, k2 = c - (b * b) / 4;
    const correct = `(${deepNum(h, 1).replace(/\.0$/, "")}, ${deepNum(k2, 2).replace(/\.00$/, "")})`;
    return {
      prompt: `y = x² ${term(-b, "x")} ${signNum(c)}.\nWork out the coordinates of the turning point.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Read the constant term as the y-coordinate.
        `(${deepNum(-b, 0)}, ${c})`,
        // Sign of the x-coordinate not flipped.
        `(${deepNum(b / 2, 1).replace(/\.0$/, "")}, ${deepNum(k2, 2).replace(/\.00$/, "")})`,
        // Halved b without squaring in the y-coordinate.
        `(${deepNum(h, 1).replace(/\.0$/, "")}, ${deepNum(c - b / 2, 2).replace(/\.00$/, "")})`,
      ]),
      tags: ["b-half"],
      explanation: `Complete the square: y = (x ${signNum(h)})² ${signNum(k2)}. A squared term is never negative, so the smallest y can be is when the bracket is zero, which happens at x = ${deepNum(h, 1).replace(/\.0$/, "")}; there y = ${deepNum(k2, 2).replace(/\.00$/, "")}. That is the turning point, ${correct}. The x-coordinate is always halfway between the roots, which is why it is −b/2 and not b/2 — the sign flips when the bracket is set to zero. The y-coordinate is NOT the constant term ${c}: substituting x = ${deepNum(h, 1).replace(/\.0$/, "")} into the original gives ${deepNum(b * b / 4 - b * b / 2 + c, 2).replace(/\.00$/, "")}, which differs from ${c} by the (b/2)² the completing-the-square step subtracts.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** SIMPLIFYING A RATIONAL EXPRESSION BY FACTORISING. The base family cancels
   *  a single factor; the senior family requires two factorisations and a
   *  restriction the base family never mentions. */
  "algebraic-fractions": (r) => {
    // One factor in common, two that are not: cancelling then leaves a quotient
    // rather than 1, which is what makes the restrictions worth stating.
    const a = r.int(2, 6);
    let b = r.int(2, 8), c = r.int(2, 8);
    if (b === c || b === a || c === a) return SENIOR_GENS["algebraic-fractions"](r);
    const num = `x² − ${a + b}x + ${a * b}`;
    const den = `x² − ${a + c}x + ${a * c}`;
    const correct = `(x − ${b}) / (x − ${c}),  x ≠ ${a} and x ≠ ${c}`;
    return {
      prompt: `Simplify  (${num}) / (${den}), stating every value x cannot take.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Cancelled the quadratics term by term instead of factorising.
        `1,  x ≠ 0`,
        // Right expression, restrictions left off — the part usually dropped.
        `(x − ${b}) / (x − ${c})`,
        // Cancelled the other common-looking factor, which is not common.
        `(x − ${a}) / (x − ${c}),  x ≠ ${b}`,
        // Signed the restrictions as though they were roots to be plotted.
        `(x − ${b}) / (x − ${c}),  x ≠ −${a} and x ≠ −${c}`,
      ]),
      tags: ["cancel-term"],
      explanation: `Factorise first, then cancel — and never term by term. The numerator is (x − ${a})(x − ${b}) and the denominator is (x − ${a})(x − ${c}), so the factor (x − ${a}) cancels and ${correct.split(",")[0].trim()} is what is left. The restrictions are not decoration: the ORIGINAL fraction has a zero denominator at x = ${a} and x = ${c}, and cancelling a factor does not restore the value at the point where it was zero. So x = ${a} stays excluded even though it has visibly gone, and that is the case everybody forgets. Cancelling the x² terms across the bar is the other error: this is one division of two whole expressions, not a column of separate divisions.`,
      difficulty: 0.86 + r.next() * 0.07,
    };
  },

  /** A LINE MEETING A QUADRATIC, AND THE ROOTS IT CREATES. The senior family
   *  requires the substitution AND then a judgement about what the two roots
   *  mean, which is where the second solution gets discarded. */
  "sim-equations-quad": (r) => {
    const m = r.nz(-4, 4), c = r.nz(-6, 6);
    const p = r.int(2, 8), q = r.nz(-9, 9);
    // y = mx + c  and  y = x² + px + q  →  x² + (p−m)x + (q−c) = 0
    const B = p - m, C = q - c;
    const disc = B * B - 4 * C;
    if (disc <= 0 || Math.sqrt(disc) % 1 !== 0) return SENIOR_GENS["sim-equations-quad"](r);
    const root = Math.sqrt(disc);
    const x1 = (-B + root) / 2, x2 = (-B - root) / 2;
    const y1 = m * x1 + c, y2 = m * x2 + c;
    const pair = [[x1, y1], [x2, y2]].sort((u, v) => u[0] - v[0]);
    const nm = (v: number) => deepNum(v, 2).replace(/\.00$/, "");
    const correct = `(${nm(pair[0][0])}, ${nm(pair[0][1])}) and (${nm(pair[1][0])}, ${nm(pair[1][1])})`;
    return {
      prompt: `Solve the simultaneous equations\ny = ${m}x ${signNum(c)}\ny = x² ${term(p, "x")} ${signNum(q)}\nGive both points of intersection.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Discarded one root and reported a single point.
        `(${nm(pair[0][0])}, ${nm(pair[0][1])})`,
        // Solved the quadratic but never put the roots back into either equation.
        `x = ${nm(pair[0][0])} and x = ${nm(pair[1][0])}`,
        // Substituted into the wrong equation, so the y-values disagree.
        `(${nm(pair[0][0])}, ${nm(pair[0][0] * pair[0][0] + p * pair[0][0] + q + 1)}) and (${nm(pair[1][0])}, ${nm(pair[1][1])})`,
      ]),
      tags: ["lost-root"],
      explanation: `Substitute the linear equation into the quadratic — the line gives y in terms of x, so ${m}x ${signNum(c)} = x² ${term(p, "x")} ${signNum(q)}, and rearranging gives x² ${term(p - m, "x")} ${signNum(q - c)} = 0. That factorises to roots x = ${nm(pair[0][0])} and x = ${nm(pair[1][0])}, and BOTH are wanted: a line meeting a parabola has two intersections, and reporting one is losing a root. Putting each x back into the linear equation (easier than the quadratic) gives the two points ${correct}. Discarding the second root is the error the whole question is aimed at, and it is worth checking the answer back in the other equation as well — both points should satisfy y = x² ${term(p, "x")} ${signNum(q)} too.`,
      difficulty: 0.87 + r.next() * 0.06,
    };
  },

  /** TWO SUCCESSIVE APPLICATIONS IN THREE DIMENSIONS. The base family applies
   *  the theorem once in a plane; the senior family needs a face diagonal
   *  before the space diagonal exists at all. */
  pythagoras: (r) => {
    const trip = r.pick([[3, 4, 12], [2, 3, 6], [1, 2, 2], [4, 4, 7], [3, 12, 4], [6, 6, 7], [2, 6, 9]]);
    const [a, b, c] = trip;
    const faceSq = a * a + b * b;
    const diag = Math.sqrt(faceSq + c * c);
    if (Math.abs(diag - Math.round(diag)) > 1e-9) return SENIOR_GENS.pythagoras(r);
    const correct = String(Math.round(diag));
    return {
      prompt: `A cuboid has length ${a} cm, width ${b} cm and height ${c} cm.\nFind the length of the space diagonal from one corner to the opposite corner, in cm.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Added the three edge lengths instead of their squares.
        String(a + b + c),
        // Added the squares of all three but forgot the square root.
        String(faceSq + c * c),
        // Only the face diagonal: stopped after the first triangle.
        String(Math.round(Math.sqrt(faceSq))),
        String(Math.round(diag) + 1),
      ]),
      tags: ["hyp-leg"],
      explanation: `The space diagonal is not in any face, so it cannot be found in one step. Draw the diagonal of the ${a} × ${b} base first: that is √(${a}² + ${b}²) = √${faceSq} = ${deepNum(Math.sqrt(faceSq), 2)} cm. That diagonal is now one leg of a right triangle whose other leg is the height ${c}, so the space diagonal is √(${faceSq} + ${c}²) = √${faceSq + c * c} = ${correct} cm. The two square roots collapse into one because both legs are squared before being added — √(${a}² + ${b}² + ${c}²) gives the same number, and that is the shortcut, not a different rule. Adding the edges instead of their squares gives ${a + b + c} cm, which is the total length of three edges and the same number as the diagonal only in a cube.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** THE DISCRIMINANT USED BACKWARDS. The base family solves a quadratic; the
   *  senior family supplies the NUMBER of roots and asks for the unknown
   *  coefficient, which inverts the direction the topic is usually practised. */
  quadratics: (r) => {
    if (r.next() < 0.5) {
      const d = r.pick([3, 4, 5, 6, 8, 9]);
      const k = d * 2;               // x² + kx + d² has equal roots when k² = 4d²
      const correct = `±${k}`;
      return {
        prompt: `The equation x² + kx + ${d * d} = 0 has exactly one real root.\nFind the possible values of k.`,
        correct,
        wrongs: pickDistinct(correct, [
          // Set the discriminant to k instead of zero.
          `±${d * d}`,
          // Forgot the square root of the constant.
          `±${d}`,
          // One sign only.
          `${k}`,
          `±${k * k}`,
        ]),
        tags: ["lost-root"],
        explanation: `"Exactly one real root" is a statement about the DISCRIMINANT, not about the roots themselves: b² − 4ac = 0. With a = 1, b = k and c = ${d * d}, that is k² − 4×${d * d} = 0, so k² = ${4 * d * d} and k = ±${k}. Both signs are solutions because k is squared, and each corresponds to a different perfect square — (x + ${k / 2})² and (x − ${k / 2})². Answering ±${d * d} sets the discriminant equal to the constant rather than to zero; answering ±${d} takes the square root of the constant once instead of twice.`,
        difficulty: 0.88 + r.next() * 0.05,
      };
    }
    // Sum and product of roots — a method that avoids solving at all.
    const p2 = r.int(2, 9), q2 = r.int(2, 9);
    const correct = `${p2 + q2 + p2 * q2}`;
    return {
      prompt: `The roots of x² − ${p2 + q2}x + ${p2 * q2} = 0 are α and β.\nWork out α + β + αβ.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Mis-signed: used −b/a as if b were negative.
        String(-(p2 + q2) + p2 * q2),
        // Added the roots but multiplied them by −1.
        String(p2 + q2 - p2 * q2),
        // Multiplied the sum by the product.
        String((p2 + q2) * p2 * q2),
        String(p2 * q2),
      ]),
      tags: ["lost-root"],
      explanation: `You never need the roots themselves. For x² − (α + β)x + αβ = 0, the coefficient of x is minus the sum of the roots and the constant is their product — so here α + β = ${p2 + q2} and αβ = ${p2 * q2}, and α + β + αβ = ${p2 + q2} + ${p2 * q2} = ${correct}. The signs are where this goes wrong: the equation is x² − ${p2 + q2}x + ${p2 * q2}, and the minus in front of the x-term already accounts for α + β being positive, so reading the coefficient as −${p2 + q2} double-counts it. Solving the quadratic first also works and gives ${Math.min(p2, q2)} and ${Math.max(p2, q2)}, which is a useful check on the two symmetric functions.`,
      difficulty: 0.85 + r.next() * 0.06,
    };
  },

  /** FIND THE TIME, NOT THE AMOUNT. The base family evaluates a growth formula;
   *  the senior family makes the exponent the unknown, which needs logarithms
   *  and a decision about rounding in the direction the context demands. */
  "growth-decay": (r) => {
    const P = r.pick([12000, 16000, 20000, 24000]);
    const rate = r.pick([10, 15, 20, 25]);
    const limit = Math.round(P / 4);
    // P(1 − r/100)^n < limit  →  n > log(limit/P)/log(1 − r/100)
    const n = Math.log(limit / P) / Math.log(1 - rate / 100);
    const years = Math.ceil(n);
    const correct = `${years} years`;
    return {
      prompt: `A machine is bought for ${deepMoney(P)} and loses ${rate}% of its value each year.\nAfter how many complete years is it first worth less than ${deepMoney(limit)}?`,
      correct,
      wrongs: pickDistinct(correct, [
        // Rounded down, which is the last year it is still above the limit.
        `${Math.floor(n)} years`,
        // Linear depreciation: divided the total loss by the annual loss.
        `${Math.ceil((P - limit) / ((P * rate) / 100))} years`,
        // Off by one either way.
        `${years + 1} years`,
        `${years - 2 > 0 ? years - 2 : years + 2} years`,
      ]),
      tags: ["simple-cp"],
      explanation: `Set it up as an inequality and take logs — the exponent is the unknown, so logs are the only way through. Value after n years is ${deepMoney(P)} × ${deepNum(1 - rate / 100, 2)}ⁿ, and we need that below ${deepMoney(limit)}: dividing gives ${deepNum(1 - rate / 100, 2)}ⁿ < ${deepNum(limit / P, 2)}. Taking logs of both sides (the base is less than 1, so the inequality flips) gives n > log(${deepNum(limit / P, 2)}) / log(${deepNum(1 - rate / 100, 2)}) = ${deepNum(n, 2)}. So n must be ${years}. The rounding direction is part of the answer: "first worth less than" means the first whole year whose value is BELOW the limit, and rounding down gives year ${Math.floor(n)}, when the machine is still worth more than ${deepMoney(limit)}.`,
      difficulty: 0.87 + r.next() * 0.06,
    };
  },

  /** THREE BRACKETS, WHERE THE FIRST PRODUCT FEEDS THE SECOND. The base family
   *  expands a pair; the senior family cannot be done by inspection. */
  "algebra-expand": (r) => {
    const a = r.int(2, 4), b = r.nz(-7, -1), c = r.int(2, 5), d = r.int(1, 6);
    // (ax + b)(x + c)(x − d), expanded left to right:
    //   (ax + b)(x + c) = ax² + (ac + b)x + bc
    //   …then × (x − d) term by term.
    const q1a = a, q1b = a * c + b, q1c = b * c;
    const x3 = q1a, x2 = q1b - q1a * d, x1 = q1c - q1b * d, x0 = -q1c * d;
    const correct = `${x3 === 1 ? "" : x3}x³ ${term(x2, "x²")} ${term(x1, "x")} ${signNum(x0)}`;
    return {
      prompt: `Expand and simplify (${a === 1 ? "" : a}x ${signNum(b)})(x + ${c})(x − ${d}).`,
      correct,
      wrongs: pickDistinct(correct, [
        // Expanded the first two brackets and then only multiplied by the x of
        // the third.
        `${x3 === 1 ? "" : x3}x³ ${term(x2, "x²")} ${term(q1c, "x")} ${signNum(-q1c * d)}`,
        // Sign of the last term not flipped for the −d bracket.
        `${x3 === 1 ? "" : x3}x³ ${term(x2, "x²")} ${term(q1c + q1b * d, "x")} ${signNum(q1c * d)}`,
        // Multiplied the constants wrongly.
        `${x3 === 1 ? "" : x3}x³ ${term(x2, "x²")} ${term(x1, "x")} ${signNum(-c * d)}`,
        `${x3 === 1 ? "" : x3}x³ ${term(x2, "x²")} ${term(x1, "x")} ${signNum(x0 + d)}`,
      ]),
      tags: ["sign-slip"],
      explanation: `Do it in two stages and keep the first product on the page. First (${a === 1 ? "" : a}x ${signNum(b)})(x + ${c}) = ${q1a === 1 ? "" : q1a}x² ${term(q1b, "x")} ${signNum(q1c)}. Then multiply THAT by (x − ${d}), which means each term meets both x and −${d}: the x³ comes from ${q1a === 1 ? "" : q1a}x² × x, the x² collects ${q1b}x − ${q1a === 1 ? "" : q1a}×${d}x, the x collects ${q1c} − ${q1b}×${d}, and the constant is ${q1c} × (−${d}). That gives ${correct}. The sign of the constant is the check worth doing: two negative constants in the brackets force the product positive, and one makes it negative — here ${q1c > 0 ? "the " + q1c + " is positive" : "the " + q1c + " is negative"} and the bracket contributes −${d}, so the constant is negative.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** THE SECTOR IN REVERSE: the angle is given and the RADIUS is the unknown,
   *  which the base family never asks for. */
  "circle-area-arc": (r) => {
    const angle = r.pick([30, 40, 60, 72, 90, 120, 135, 144]);
    const arc = r.pick([6, 8, 9, 12, 15, 20]);
    // arc = (angle/360) × 2πr   →  r = arc × 360 / (2π × angle)
    const rad = (arc * 360) / (2 * Math.PI * angle);
    const area = (angle / 360) * Math.PI * rad * rad;
    const correct = `${deepNum(area, 1)} cm²`;
    return {
      prompt: `A sector has arc length ${arc} cm and angle ${angle}°.\nWork out the area of the sector, in cm². (Give your answer to 1 decimal place.)`,
      correct,
      wrongs: pickDistinct(correct, [
        // Found the radius but then used the full-circle area.
        `${deepNum(Math.PI * rad * rad, 1)} cm²`,
        // Used the arc length as the radius.
        `${deepNum((angle / 360) * Math.PI * arc * arc, 1)} cm²`,
        // Forgot the 2π and treated arc = (angle/360)r.
        `${deepNum((angle / 360) * Math.PI * Math.pow((arc * 360) / angle, 2), 1)} cm²`,
        `${deepNum(area * 2, 1)} cm²`,
      ]),
      tags: [],
      explanation: `Two formulas, used in the direction that makes the radius the subject. Arc length = (${angle}/360) × 2πr, so ${arc} = ${deepNum(angle / 360, 4)} × 2πr and r = ${deepNum(rad, 2)} cm. Only then is the area available: area = (${angle}/360) × πr² = ${deepNum(angle / 360, 4)} × π × ${deepNum(rad, 2)}² = ${correct}. The radius has to be found first because neither formula gives the area from the arc length alone — the sector's area and its arc are related through r, and skipping that step is what the second option above does. A useful sanity check: the sector is ${angle}/360 of the circle, and πr² for this radius is ${deepNum(Math.PI * rad * rad, 1)} cm², so the answer should be smaller than that.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** PERPENDICULAR LINES, BUILT RATHER THAN READ. The base family reads a
   *  gradient out of a story and uses it; the senior family has to PRODUCE the
   *  perpendicular's gradient (flip AND negate), then solve for the intercept
   *  through a given point. Three sign decisions, and each wrong option below
   *  is exactly one of them. */
  "straight-lines": (r) => {
    const m = r.pick([2, 3, 4, 5]);
    const x1 = m * r.nz(-4, 4);
    const y1 = r.nz(-9, 9);
    const c = r.nz(-9, 9);
    const k = y1 + x1 / m;        // intercept of the perpendicular through (x1, y1)
    const same = y1 - m * x1;     // L's own gradient reused through P: parallel, not perpendicular
    const recip = y1 - x1 / m;    // flipped but not negated: gradients multiply to +1
    const negated = y1 + m * x1;  // negated but not flipped
    const correct = `y = −x/${m} ${signNum(k)}`;
    return {
      prompt: `A line L has equation y = ${m}x ${signNum(c)}. The point P is (${x1}, ${y1}).\nWork out the equation of the line through P that is perpendicular to L, in the form y = mx + c.`,
      correct,
      wrongs: pickDistinct(correct, [
        `y = ${m}x ${signNum(same)}`,
        `y = x/${m} ${signNum(recip)}`,
        `y = −${m}x ${signNum(negated)}`,
        `y = −x/${m} ${signNum(c)}`,
      ]),
      tags: ["grad-run"],
      explanation: `Perpendicular gradients multiply to −1, so L's gradient ${m} has to become −1/${m} — flipped AND negated, not one or the other. Then P fixes the intercept: ${y1} = (−1/${m}) × (${x1}) + c, so c = ${y1} + ${x1}/${m} = ${k}, giving ${correct}. The product check is what catches every wrong option: ${m} × (−1/${m}) = −1 ✓, while ${m} × (1/${m}) = +1 describes lines that are reflections rather than perpendiculars, and keeping ${m} just draws a parallel through P.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** BOTH EQUATIONS RESIST ELIMINATION AS WRITTEN. The base family pairs a
   *  matching coefficient with one that needs scaling; here neither matching
   *  pair exists, so producing the match is the question's first half — and the
   *  sign slip on the way back is the belief the tag names. */
  simultaneous: (r) => {
    const x = r.int(2, 6), y = r.int(2, 6);
    const a1 = r.int(2, 5), b1 = r.int(1, 4);
    const a2 = r.int(2, 5), b2 = r.int(1, 4);
    const r1 = a1 * x + b1 * y;
    const r2 = a2 * x - b2 * y;
    const correct = `x = ${x}, y = ${y}`;
    return {
      prompt: `Solve the simultaneous equations:\n${a1}x + ${b1}y = ${r1}\n${a2}x − ${b2}y = ${r2}\nGive both values.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The letters swapped on the way out.
        `x = ${y}, y = ${x}`,
        // Only one unknown reported.
        `x = ${x}`,
        // Substituted back with the sign the wrong way.
        `x = ${deepNum((r1 + b1 * y) / a1, 2)}, y = ${y}`,
        // Eliminated by adding, which leaves r1 + r2 on the right.
        `y = ${deepNum((a2 * r1 + a1 * r2) / (a2 * b1 + a1 * b2), 2)}, x = ${x}`,
      ]),
      tags: ["sub-sign"],
      explanation: `Neither variable cancels as written. Multiply the first equation by ${a2} and the second by ${a1} so the x-coefficients match: ${a2}×(${a1}x + ${b1}y = ${r1}) and ${a1}×(${a2}x − ${b2}y = ${r2}). The x-terms are now identical, so SUBTRACTING eliminates them: (${a2 * b1} + ${a1 * b2})y = ${a2 * r1 - a1 * r2}, so y = ${y}. Then back-substitute — and the sign is the trap: ${a1}x + ${b1}×${y} = ${r1}, so x = ${x}. Adding ${b1}×${y} instead of subtracting gives ${deepNum((r1 + b1 * y) / a1, 2)}, which fails the other equation the moment it is checked.`,
      difficulty: 0.86 + r.next() * 0.06,
    };
  },

  /** THE TWO-OBSERVER HEIGHT. The base family picks a ratio in one right
   *  triangle; the senior family has two triangles sharing the tower, and the
   *  height only appears once the shared horizontal distance is set up — so the
   *  ratio choice must be right twice before any arithmetic starts. */
  "trig-ratios": (r) => {
    const near = r.pick([18, 20, 24, 30, 36]);
    const a1 = r.pick([35, 38, 40, 42]);   // elevation from the near point
    const a2 = r.pick([12, 15, 18, 20]);   // elevation from the far point
    const rad = (d: number) => (d * Math.PI) / 180;
    const d = (near * Math.tan(rad(a2))) / (Math.tan(rad(a1)) - Math.tan(rad(a2)));
    const h = d * Math.tan(rad(a1));
    const correct = `${deepNum(h, 2)} m`;
    return {
      prompt: `A tower stands on level ground. From point A the angle of elevation of the top is ${a2}°. From point B, which is ${near} m closer to the tower, the angle of elevation is ${a1}°.\nWork out the height of the tower, in metres, to 2 decimal places.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The gap in front of the tower used as the distance to the tower.
        `${deepNum(near * Math.tan(rad(a1)), 2)} m`,
        // The far distance used with the near angle.
        `${deepNum((d + near) * Math.tan(rad(a1)), 2)} m`,
        // The near distance used with the far angle.
        `${deepNum(d * Math.tan(rad(a2)), 2)} m`,
        // The tangent relationship inverted.
        `${deepNum(d / Math.tan(rad(a1)), 2)} m`,
      ]),
      tags: ["deg-rad", "hyp-leg-trig"],
      explanation: `Two right triangles share the tower's height, so write the tangent relationship in each and eliminate the unknown distance. From B: tan ${a1}° = h ÷ d. From A: tan ${a2}° = h ÷ (d + ${near}). Both equal h, so d·tan ${a1}° = (d + ${near})·tan ${a2}°, giving d = ${near} × tan ${a2}° ÷ (tan ${a1}° − tan ${a2}°) = ${deepNum(d, 2)} m. Only then does the height appear: h = d × tan ${a1}° = ${correct}. Using the ${near} m gap as though it were the distance to the tower is the version that ignores the second triangle entirely, and dividing by the tangent instead of multiplying turns the height into a shadow length.`,
      difficulty: 0.87 + r.next() * 0.06,
    };
  },

  /** DIVISION IN STANDARD FORM, WHERE THE COEFFICIENT LANDS BELOW 1. The base
   *  family multiplies and rebalances an overflowing coefficient; dividing by a
   *  larger coefficient produces the other rebalancing case, with an index
   *  subtraction that moves upward because the divisor's index is negative. */
  "standard-form": (r) => {
    const [a, b] = r.pick([[2.4, 4], [3.2, 8], [3.6, 5], [4.8, 5], [6.4, 8], [2.8, 7]]);
    const m = r.int(3, 6);
    const n = -r.int(1, 3);
    const quot = a / b;
    const correct = deepSci(quot, m - n);
    const unnormalised = `${deepNum(quot, 2)} × 10${pw(m - n)}`;
    return {
      prompt: `Without a calculator, work out (${a} × 10${pw(m)}) ÷ (${b} × 10${pw(n)}).\nGive your answer in standard form.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Multiplied instead of dividing, and added the indices.
        deepSci(a * b, m + n),
        // Subtracted a negative index in the wrong direction.
        deepSci(a / b, m + n),
        // The coefficient is below 1 and left that way: not standard form.
        unnormalised,
        deepSci(a / b, m - n + 1),
      ]),
      tags: ["sf-sig"],
      explanation: `Divide the coefficients and subtract the indices: ${a} ÷ ${b} = ${deepNum(quot, 4)}, and the index subtraction is ${m} − (${n}) = ${m - n} — subtracting a negative moves upward. That gives ${deepNum(quot, 4)} × 10${pw(m - n)}, which is NOT yet standard form: the coefficient must sit between 1 and 10, and ${deepNum(quot, 4)} is below 1. Rebalance by moving one power of ten across: ${deepNum(quot, 4)} × 10${pw(m - n)} = ${correct}. Leaving it as ${unnormalised} loses the mark the question was set to test, and ${deepSci(a * b, m + n)} comes from reaching for the multiplication law on a division.`,
      difficulty: 0.87 + r.next() * 0.06,
    };
  },

  /** THE AMBIGUOUS CASE OF THE SINE RULE. The base family chooses a rule and
   *  computes; the senior family has to notice that a sine value licenses TWO
   *  angles in a triangle, then check which of them leaves a possible triangle
   *  — and report both that survive. */
  "trig-rule": (r) => {
    const [A, a, b] = r.pick([[30, 6, 8], [35, 7, 9], [40, 6, 7], [45, 8, 9], [32, 5, 7]]);
    const sinB = (b * Math.sin((A * Math.PI) / 180)) / a;
    if (sinB >= 1) return SENIOR_GENS["trig-rule"](r);
    const B1 = (Math.asin(sinB) * 180) / Math.PI;
    const B2 = 180 - B1;
    if (A + B2 >= 180) return SENIOR_GENS["trig-rule"](r);
    const correct = `B = ${deepNum(B1, 1)}° or B = ${deepNum(B2, 1)}°`;
    return {
      prompt: `In triangle ABC, side a = ${a} cm, side b = ${b} cm and angle A = ${A}°.\nFind the possible values of angle B.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The acute solution only: half the answer, and the error the tag names.
        `B = ${deepNum(B1, 1)}°`,
        // The obtuse solution only.
        `B = ${deepNum(B2, 1)}°`,
        // The remaining angle taken as B.
        `B = ${deepNum(180 - A - B1, 1)}°`,
        // A claim about the data, not an answer to it.
        `No triangle exists — a sine value cannot be larger than 1 here`,
      ]),
      tags: ["cos-amb"],
      explanation: `The sine rule pairs each side with its opposite angle: b ÷ sin B = a ÷ sin A, so sin B = (${b} × sin ${A}°) ÷ ${a} = ${deepNum(sinB, 4)}. A sine value of ${deepNum(sinB, 4)} has TWO angles in the range 0°–180°, not one: B = ${deepNum(B1, 1)}° and B = ${deepNum(B2, 1)}° = 180° − ${deepNum(B1, 1)}°. Both keep the angle sum below 180° (the obtuse one leaves C = ${deepNum(180 - A - B2, 1)}°), so both triangles exist and both must be reported. The ambiguous case arises because side b (${b} cm) is the LONGER of the two given sides — a longer side opposite B allows B to be acute or obtuse, and the calculator only ever offers the acute value.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** TWO DRAWS WITHOUT REPLACEMENT WHERE THE EVENT HAS TWO ORDERS. The base
   *  family handles replacement; here the denominators fall and the two orders
   *  must both be counted and added, which is where the factor of 2 is lost. */
  "tree-diagrams": (r) => {
    const [red, blue] = r.pick([[3, 2], [4, 2], [4, 3], [5, 3], [5, 4], [6, 4]]);
    const total = red + blue;
    const correct = deepFrac(2 * red * blue, total * (total - 1));
    return {
      prompt: `A bag holds ${red} red and ${blue} blue counters. Two counters are taken at random WITHOUT replacement.\nWork out P(exactly one is red). Give your answer as a fraction in its simplest form.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Replacement assumed: the second denominator never shrinks.
        deepFrac(2 * red * blue, total * total),
        // Forgot the two orders: red-then-blue only.
        deepFrac(red * blue, total * (total - 1)),
        // Both the same colour — the complement, a different event.
        deepFrac(red * (red - 1) + blue * (blue - 1), total * (total - 1)),
        // The first draw's probability, ignoring the second.
        deepFrac(red, total),
      ]),
      tags: ["ind-dep"],
      explanation: `Exactly one red happens in two orders, and each is a product along a branch of the tree. Red then blue: ${deepFrac(red, total)} × ${deepFrac(blue, total - 1)} = ${deepFrac(red * blue, total * (total - 1))}. Blue then red: ${deepFrac(blue, total)} × ${deepFrac(red, total - 1)} — the same number. Adding the two branches gives ${deepFrac(2 * red * blue, total * (total - 1))}, which simplifies to ${correct}. Two separate ideas must both hold: WITHOUT replacement makes the second draw dependent, so its denominator is ${total - 1} and its counts follow what was taken; and 'exactly one' points at two branches, so forgetting to add the second one halves the answer.`,
      difficulty: 0.87 + r.next() * 0.06,
    };
  },

  /** NECESSARY VERSUS SUFFICIENT. The base family validates inferences; the
   *  senior family classifies the RELATION between two conditions — which needs
   *  a counterexample in one direction and an argument in the other, and the
   *  four options are the complete set of relations, so nothing can be guessed. */
  "logic-maths": (r) => {
    const labels = [
      "Sufficient but not necessary",
      "Necessary but not sufficient",
      "Both necessary and sufficient",
      "Neither necessary nor sufficient",
    ];
    const claims: Array<[string, string, string]> = [
      ["x > 4", "x² > 16", "Sufficient but not necessary"],
      ["n is a multiple of 6", "n is a multiple of 3", "Sufficient but not necessary"],
      ["n is even", "n² is even", "Both necessary and sufficient"],
      ["x = 2", "x² − 4 = 0", "Sufficient but not necessary"],
      ["a shape is a square", "it has four right angles", "Sufficient but not necessary"],
    ];
    const [P, Q, answer] = r.pick(claims);
    const why: Record<string, string> = {
      "x > 4|x² > 16": "Any x above 4 squares to more than 16, so P forces Q. But x = −5 gives 25 without being above 4, so P is not needed for Q — Q does not force P.",
      "n is a multiple of 6|n is a multiple of 3": "A multiple of 6 is automatically a multiple of 3 (6k = 3·2k), but 9 is a multiple of 3 and not of 6, so the reverse fails.",
      "n is even|n² is even": "Both directions hold: an even n has an even square, and an even square can only come from an even n (an odd n gives an odd square).",
      "x = 2|x² − 4 = 0": "x = 2 makes the equation true, but x = −2 also makes it true, and −2 is not 2 — so the equation does not force the first condition.",
      "a shape is a square|it has four right angles": "Every square has four right angles; a rectangle does too without being a square, so the first condition is sufficient and not necessary.",
    };
    const correct = answer;
    return {
      prompt: `Consider the two conditions:\nP: ${P}\nQ: ${Q}\nHow does P relate to Q?`,
      correct,
      wrongs: pickDistinct(correct, labels.filter((l) => l !== correct)),
      tags: [],
      explanation: `${answer}. Sufficient means P ⇒ Q; necessary means Q ⇒ P (P is required for Q to hold). ${why[`${P}|${Q}`]} The two words are not interchangeable, and the standard way to settle the relation is exactly the pair of arguments used here: to show P is NOT necessary you must produce a case that satisfies Q while failing P; to show it IS, you must argue every Q satisfies P.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** A POINT DIVIDING A SEGMENT IN A RATIO. The base family reads a parallel
   *  test; the senior family has to walk a FRACTION of the vector, and the
   *  fraction's denominator is the total number of parts, not either share. */
  vectors: (r) => {
    const ax = r.nz(-3, 3), ay = r.nz(-3, 3);
    const dx = 5 * r.int(1, 2), dy = 5 * r.int(1, 2);
    const m = 2, n = 3; // AM : MB = 2 : 3
    const bx = ax + dx, by = ay + dy;
    const f = m / (m + n);
    const correct = `(${ax + f * dx}, ${ay + f * dy})`;
    return {
      prompt: `Points A and B have coordinates (${ax}, ${ay}) and (${bx}, ${by}). Point M lies on AB with AM : MB = 2 : 3.\nWork out the coordinates of M.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The ratio taken from the wrong end: 3/5 of the way instead of 2/5.
        `(${ax + (n / (m + n)) * dx}, ${ay + (n / (m + n)) * dy})`,
        // Walked the whole segment: M mistaken for B.
        `(${bx}, ${by})`,
        // AB subtracted instead of added.
        `(${ax - f * dx}, ${ay - f * dy})`,
        // The fraction applied to B's position vector from the origin.
        `(${deepNum(f * bx, 1)}, ${deepNum(f * by, 1)})`,
      ]),
      tags: ["vec-dir"],
      explanation: `M sits TWO parts along a segment cut into five (2 + 3) equal parts, so M is 2/5 of the way from A to B: OM = OA + (2/5)AB. The displacement is AB = (${dx}, ${dy}), so (2/5)AB = (${f * dx}, ${f * dy}) and OM = (${ax}, ${ay}) + those = ${correct}. The fraction's denominator is the TOTAL number of parts — building 3/5 instead walks to the point instead of M, landing symmetrically wrong. Applying the fraction to B's coordinates rather than to the DISPLACEMENT is the other slip: ratios divide the segment between A and B, they do not scale B's position from the origin.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** PROOF CONSTRUCTION, NOT FLAW-SPOTTING. The base family identifies what is
   *  wrong with a proof; the senior family chooses the correct ALGEBRAIC proof,
   *  which requires knowing that a general argument with n is the only thing
   *  that proves a universal claim — examples are never enough. */
  proof: (r) => {
    const claims: Array<[string, string, string[]]> = [
      ["the difference between the squares of two consecutive odd numbers is always a multiple of 8",
        "Let the numbers be 2n + 1 and 2n − 1. Then (2n + 1)² − (2n − 1)² = 8n, and 8n is a multiple of 8 for every whole number n",
        ["1 and 3 give 8, 3 and 5 give 16, 5 and 7 give 24 — the pattern holds, so the claim is proved",
          "Write the numbers as n and n + 2. Then (n + 2)² − n² = 4n + 4, a multiple of 4, so the difference is a multiple of 8",
          "Assume the difference is not a multiple of 8 and observe that this contradicts the examples just checked"]],
      ["the sum of two consecutive triangular numbers is always a square number",
        "The nth triangular number is n(n + 1)/2, so the sum is n(n + 1)/2 + (n + 1)(n + 2)/2 = (n + 1)², a perfect square",
        ["T₁ + T₂ = 1 + 3 = 4, T₂ + T₃ = 3 + 6 = 9, T₃ + T₄ = 6 + 10 = 16 — the pattern of squares proves it",
          "Each triangular number alternates odd and even, so their sum must be a square number",
          "Assume the sum is not a square, then find a counterexample — none exists, so the claim is true"]],
      ["n³ − n is divisible by 6 for every whole number n",
        "Factorise: n³ − n = n(n − 1)(n + 1). Three consecutive numbers contain a multiple of 2 and a multiple of 3, so the product is divisible by 6",
        ["n = 1 gives 0, n = 2 gives 6, n = 3 gives 24 — all divisible by 6, so it is proved",
          "n(n − 1) is always even and (n + 1) is always a multiple of 3, so the product is divisible by 6",
          "Consider n even and n odd separately; the even case works, and the odd case follows by symmetry"]],
    ];
    const [claim, answer, wrong] = r.pick(claims);
    return {
      prompt: `Prove that ${claim}.\nWhich argument is a proof?`,
      correct: answer,
      wrongs: pickDistinct(answer, wrong),
      tags: [],
      explanation: `${answer} A proof must cover EVERY case with a general argument. Three checked examples show the pattern is plausible, never that it is universal — the wrong options are all variations on testing or asserting, and one of them even uses the right algebra with a false conclusion. Notice the shape of each correct proof here: translate the words into an expression in n, do the algebra, and point at the property that makes the result what it is (the 8n, the (n + 1)², the three consecutive factors). That translation step is the proof.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** NEWTON'S METHOD FOR A CUBE ROOT, WITH THE LIMIT STATED. The base family
   *  iterates a square-root recurrence and finds x₁; here the recurrence is the
   *  general one (which needs x² to be evaluated), two steps are required, and
   *  the value the iteration converges to must be recognised as ∛a rather than
   *  √a — the target of the more familiar iteration. */
  iteration: (r) => {
    const a = r.pick([2, 3, 5, 7, 10, 15]);
    const x0 = r.int(1, 3);
    const step = (x: number) => (2 * x + a / (x * x)) / 3;
    const x1 = step(x0);
    const x2 = step(x1);
    const root = Math.cbrt(a);
    const correct = `x₁ = ${deepNum(x1, 4)}, x₂ = ${deepNum(x2, 4)} — converging to ∛${a} ≈ ${deepNum(root, 4)}`;
    return {
      prompt: `Use the iteration xₙ₊₁ = (2xₙ + ${a}/xₙ²) ÷ 3 with x₀ = ${x0}.\nWork out x₁ and x₂, and state the value the iteration is converging to.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The second step reused x₀ instead of x₁.
        `x₁ = ${deepNum(x1, 4)}, x₂ = ${deepNum(step(x0), 4)} — converging to ∛${a} ≈ ${deepNum(root, 4)}`,
        // Converging to the SQUARE root: the target of the familiar recurrence.
        `x₁ = ${deepNum(x1, 4)}, x₂ = ${deepNum(x2, 4)} — converging to √${a} ≈ ${deepNum(Math.sqrt(a), 4)}`,
        // Stopped at one step and called it the root.
        `x₁ = ${deepNum(x1, 4)} — the iteration has converged, so x₂ = x₁`,
        // Averaged the two values instead of iterating again.
        `x₁ = ${deepNum(x1, 4)}, x₂ = ${deepNum((x1 + x2) / 2, 4)} — converging to ${deepNum((x1 + x2) / 2, 4)}`,
      ]),
      tags: [],
      explanation: `Substitute one step at a time, keeping the previous value on the page: x₁ = (2×${x0} + ${a}/${x0}²) ÷ 3 = ${deepNum(x1, 4)}; x₂ = (2×${deepNum(x1, 4)} + ${a}/${deepNum(x1 * x1, 4)}) ÷ 3 = ${deepNum(x2, 4)}. The values are closing on ${deepNum(root, 4)} — the CUBE root of ${a}, because the recurrence is Newton's method applied to x³ − ${a} = 0. Check it by substituting the limit into the recurrence: if x = ∛${a}, then (2x + ${a}/x²)/3 = (2x + x)/3 = x, so the fixed point really is ∛${a} and the iteration cannot drift away from it. One step lands near the root; it is the repetition that settles there, so reporting x₁ as the answer skips the convergence the question asks about.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** THE LIMIT IS THE UNKNOWN. The base family integrates between two known
   *  limits; the senior family supplies the AREA and asks for the upper limit —
   *  the integration is the same, but the answer cannot be reached by any
   *  familiar pattern, only by building the antiderivative and solving. */
  "calculus-int": (r) => {
    const k = r.int(2, 5);
    // F(x) = x³ + x², so area between 1 and k is k³ + k² − 2.
    const area = k * k * k + k * k - 2;
    const correct = `k = ${k}`;
    return {
      prompt: `The area under the curve y = 3x² + 2x between x = 1 and x = k is ${area} square units.\nWork out the value of k.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Read the area as the answer itself.
        `k = ${area}`,
        // Cube-rooted the area instead of solving the cubic.
        `k = ${deepNum(Math.cbrt(area), 2)}`,
        // The other adjacent integer.
        `k = ${k + 1}`,
        `k = ${k - 1}`,
      ]),
      tags: [],
      explanation: `Integration gives the area as a function of k: ∫(3x² + 2x)dx = x³ + x², evaluated from 1 to k, so area = (k³ + k²) − (1 + 1) = k³ + k² − 2. Setting that equal to ${area} gives k³ + k² = ${area + 2}, and k = ${k} fits because ${k}³ + ${k}² = ${k * k * k} + ${k * k} = ${k * k * k + k * k}. The subtraction of F(1) is the step that must not be dropped — the area is a DIFFERENCE of two values of the antiderivative, so a wrong k shifts both terms and fails immediately.`,
      difficulty: 0.89 + r.next() * 0.05,
    };
  },

  /** COMPLETING THE SQUARE WHEN x² HAS A COEFFICIENT. The base family's leading
   *  coefficient is 1; here the coefficient must be factored out of the first
   *  two terms before the square can be built at all, and every wrong option is
   *  a different place to skip that factoring. */
  "completing-square": (r) => {
    const a = r.pick([2, 3, 5]);
    const h = r.int(1, 6);
    const b = 2 * a * h;
    const c = r.nz(-9, 9);
    const min = c - a * h * h;
    const correct = `${a}(x − ${h})² ${signNum(min)} — minimum ${min} when x = ${h}`;
    return {
      prompt: `Express ${a}x² − ${b}x ${signNum(c)} in the form a(x − h)² + k, and hence state the minimum value of the expression and the value of x at which it occurs.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The a h² term was never subtracted when the square was formed.
        `${a}(x − ${h})² ${signNum(c)} — minimum ${c} when x = ${h}`,
        // Half of b used instead of half of b/a.
        `${a}(x − ${2 * h})² ${signNum(c - 4 * a * h * h)} — minimum ${c - 4 * a * h * h} when x = ${2 * h}`,
        // The turning point taken at the bracket's own sign.
        `${a}(x − ${h})² ${signNum(min)} — minimum ${min} when x = −${h}`,
        // The factor a left outside the minimum as well.
        `(x − ${a * h})² ${signNum(min)} — minimum ${min} when x = ${a * h}`,
      ]),
      tags: ["b-half"],
      explanation: `Factor ${a} out of the x² and x terms first — everything inside the bracket must come from those two terms only: ${a}x² − ${b}x = ${a}(x² − ${2 * h}x). Half of ${2 * h} is ${h}, so the square is (x − ${h})² = x² − ${2 * h}x + ${h * h}; the bracket has no constant, so replace it with (x − ${h})² − ${h * h}. That gives ${a}(x − ${h})² − ${a * h * h} ${signNum(c)}, and collecting the constants leaves ${correct.split(" — ")[0]}. A square is never negative, so the SMALLEST value is when it is zero — at x = ${h} — where the expression equals ${min}. The two classic breaks are visible in the wrong options: halving ${b} without dividing by ${a} puts the turning point at ${2 * h} instead of ${h}, and taking x = −${h} reads the bracket's sign as the answer instead of undoing it.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** RATIONALISING WITH A CONJUGATE. The base family expands a difference of
   *  two squares; the senior family has to CHOOSE the conjugate, multiply both
   *  parts, and then simplify the difference m² − s — three steps that each
   *  have their own wrong answer below. */
  surds: (r) => {
    const [m, s, k] = r.pick([[3, 7, 8], [3, 5, 12], [4, 14, 6], [5, 21, 4], [2, 3, 5]]);
    const diff = m * m - s;
    const coef = k / diff;
    const cm = coef * m;
    const surd = coef === 1 ? `√${s}` : `${coef}√${s}`;
    const correct = `${cm} − ${surd}`;
    return {
      prompt: `Rationalise the denominator and simplify: ${k} ÷ (${m} + √${s}).`,
      correct,
      wrongs: pickDistinct(correct, [
        // The conjugate's sign was never applied to the surd term.
        `${cm} + ${surd}`,
        // Multiplied by the conjugate but never divided by m² − s.
        `${k * m} − ${k}√${s}`,
        // The surd was replaced by its decimal.
        `${cm} − ${deepNum(Math.sqrt(s), 2)}`,
        // Difference of squares evaluated as a sum.
        `${deepNum(k / (m * m + s), 2)} − ${deepNum(Math.sqrt(s), 2)}`,
      ]),
      tags: ["sqrt-prod"],
      explanation: `Multiply numerator and denominator by the conjugate of ${m} + √${s}, which is ${m} − √${s}. The denominator becomes a difference of two squares: (${m})² − (√${s})² = ${m * m} − ${s} = ${diff} — the whole point of the conjugate, because the surd disappears. The numerator is ${k}(${m} − √${s}) = ${k * m} − ${k}√${s}, and dividing every term by ${diff} gives ${correct}. Not dividing after multiplying is the half-finished answer (${k * m} − ${k}√${s}), and forgetting that the conjugate carries the OPPOSITE sign leaves the surd in the denominator — the one thing the question asked you to remove.`,
      difficulty: 0.89 + r.next() * 0.05,
    };
  },

  /** A LOG EQUATION THAT MUST BE COMBINED BEFORE IT CAN BE SOLVED. The base
   *  family evaluates logs; the senior family needs the subtraction law, an
   *  exponential rewrite, and a division to isolate x — with the domain check
   *  x > 0 as the quiet extra step. */
  logs: (r) => {
    const [b, k, c] = r.pick([[2, 2, 3], [2, 2, 6], [2, 3, 7], [3, 2, 8], [2, 2, 9], [3, 3, 26], [2, 3, 21]]);
    const power = Math.pow(b, k);
    const x = c / (power - 1);
    const correct = `x = ${x}`;
    return {
      prompt: `Solve log${b}(x + ${c}) − log${b}(x) = ${k}.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The denominator's − 1 was dropped: divided by b^k itself.
        `x = ${deepNum(c / power, 2)}`,
        // b^k compared with c by subtraction instead of division.
        `x = ${power - c}`,
        // Solved only the inner equation and forgot the ratio.
        `x = ${power}`,
        `x = ${c + power}`,
      ]),
      tags: [],
      explanation: `A difference of two logs is the log of the quotient: log${b}((x + ${c})/x) = ${k}. A log is an exponent, so rewrite it: (x + ${c})/x = ${b}${pw(k)} = ${power}. Multiply both sides by x — legal because the original log requires x > 0 — and x + ${c} = ${power}x, so ${power}x − x = ${c}, giving ${power - 1}x = ${c} and x = ${correct}. Both terms at the start sit inside a logarithm, so the answer must satisfy x > 0; ${x} does, which is the check that rules out any negative or zero solution a careless squaring might have let in.`,
      difficulty: 0.89 + r.next() * 0.05,
    };
  },

  /** TWO THEOREMS CHAINED ROUND A CIRCLE. The base family applies one theorem
   *  at a time; here the alternate-segment angle must be found first, and only
   *  then does the cyclic-quadrilateral property give the second angle — so the
   *  answer is a pair, and reporting one of them is half the question. */
  "circle-geometry-adv": (r) => {
    const t = r.pick([35, 42, 48, 55, 62, 68]);
    const other = 180 - t;
    const correct = `Angle ABC = ${t}° and angle ADC = ${other}°`;
    return {
      prompt: `A, B, C and D lie on a circle in that order. The tangent at A makes an angle of ${t}° with the chord AC, as shown.\nWork out angle ABC and angle ADC, naming each theorem you use.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The two angles swapped: the supplementary pair assigned the wrong way.
        `Angle ABC = ${other}° and angle ADC = ${t}°`,
        // Only one angle, reported as both.
        `Angle ABC = ${t}° and angle ADC = ${t}°`,
        // Complement taken instead of the alternate-segment angle.
        `Angle ABC = ${90 - t}° and angle ADC = ${90 + t}°`,
        // Centre angle doubling applied where a cyclic quadrilateral applies.
        `Angle ABC = ${2 * t > 180 ? 360 - 2 * t : 2 * t}° and angle ADC = ${180 - (2 * t > 180 ? 360 - 2 * t : 2 * t)}°`,
      ]),
      tags: ["alt-seg"],
      explanation: `Step one is the alternate segment theorem: the angle between the tangent and the chord AC equals the angle that chord subtends in the alternate segment, so angle ABC = ${t}°. Step two uses the fact that the four points are on a circle: ABCD is a cyclic quadrilateral, and its opposite angles sum to 180°, so angle ADC = 180° − ${t}° = ${other}°. The chain is why the order matters — B and D sit on opposite sides of the chord, one angle is the alternate-segment angle and the other is its supplement. Answering ${t}° twice confuses the angle in the SAME segment (equal) with the angle in the OPPOSITE segment (supplementary), which is exactly the pair of theorems being tested.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** INVERSE SQUARE PROPORTION. The base family works an inverse-proportion
   *  table; the senior family squares the variable, so identifying the constant
   *  is the only route and the direct answer is always on offer. */
  "proportional-graphs": (r) => {
    const [d1, intensity1, d2] = r.pick([[2, 72, 4], [3, 45, 5], [4, 32, 8], [2, 18, 3], [5, 50, 10]]);
    const k = intensity1 * d1 * d1;
    const intensity2 = k / (d2 * d2);
    const correct = `${deepNum(intensity2, 2)} units`;
    return {
      prompt: `The intensity of light measured ${d1} m from a lamp is ${intensity1} units. The intensity is inversely proportional to the SQUARE of the distance.\nWork out the intensity at ${d2} m.`,
      correct,
      wrongs: pickDistinct(correct, [
        // Inverse proportion without the square.
        `${deepNum((intensity1 * d1) / d2, 2)} units`,
        // Squared the ratio the wrong way up (direct-square growth).
        `${deepNum(intensity1 * ((d2 / d1) ** 2), 2)} units`,
        // Direct proportion rather than inverse.
        `${deepNum((intensity1 * d2) / d1, 2)} units`,
        // The constant itself reported at the new distance.
        `${deepNum(k / d2, 2)} units`,
      ]),
      tags: ["inv-prop"],
      explanation: `Inverse-square means intensity × distance² is constant: k = ${intensity1} × ${d1}² = ${k}. At the new distance the same k gives intensity = ${k} ÷ ${d2}² = ${deepNum(intensity2, 2)} units. The bracket matters: "inversely proportional to the SQUARE" is y = k/x², not y = k/x — the first wrong option uses the plain inverse (k = ${intensity1 * d1}) and gets a different, still-plausible number. A quick sanity check on the direction: the distance ${d2 > d1 ? "increased" : "decreased"}, so the intensity must ${d2 > d1 ? "fall" : "rise"}; any option that moves the same way as the distance has the relationship upside down.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** STATIONARY POINTS AND THEIR CLASSIFICATION. The base family reads a
   *  gradient; the senior family solves dy/dx = 0 for TWO points and then uses
   *  the second derivative to say which is which — a chain where the final
   *  classification is the part examiners ask for. */
  "calculus-diff": (r) => {
    const p = r.pick([1, 4, 9, 16]);
    const root = Math.sqrt(p);
    const c = r.nz(-9, 9);
    const correct = `Stationary points at x = ${-root} and x = ${root}; x = ${root} is a minimum and x = ${-root} is a maximum`;
    return {
      prompt: `y = x³ − ${3 * p}x ${signNum(c)}.\nWork out the x-coordinates of the stationary points and classify each one.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The two classifications swapped.
        `Stationary points at x = ${-root} and x = ${root}; x = ${root} is a maximum and x = ${-root} is a minimum`,
        // Solved 3x² = 0, losing one of the two points.
        `Stationary point at x = 0 only; it is a minimum`,
        // Forgot the square root when solving 3x² = 3p.
        `Stationary points at x = ${-p} and x = ${p}; x = ${p} is a minimum and x = ${-p} is a maximum`,
        // Read the points off y = 0 rather than dy/dx = 0.
        `Stationary points at x = ${root} only, where the curve meets the x-axis`,
      ]),
      tags: [],
      explanation: `Differentiate: dy/dx = 3x² − ${3 * p}, and stationary points are where the gradient is zero, so 3x² = ${3 * p} and x² = ${p}, giving x = ${-root} and x = ${root}. Classification comes from the SECOND derivative: d²y/dx² = 6x, positive at x = ${root} so that point is a minimum, negative at x = ${-root} so that point is a maximum. Two steps to keep straight: solving x² = ${p} produces TWO roots, and the second derivative decides between them by its SIGN — not by which one is called first. Testing the gradient either side works too, but it is slower and easier to slip in a table.`,
      difficulty: 0.89 + r.next() * 0.05,
    };
  },

  /** COMPOUND BOUNDS. The base family takes the upper bound of a product; the
   *  senior family divides, and division flips which bound of the denominator
   *  produces the maximum — the step that a rule of thumb gets wrong. */
  bounds: (r) => {
    const d = r.int(20, 60);
    const t = r.int(5, 12);
    const maxSpeed = (d + 0.5) / (t - 0.5);
    return {
      prompt: `A runner covers ${d} m in ${t} s. Each measurement is given to the nearest whole unit (metre, second).\nWork out the maximum possible value of the average speed, in m/s, to 2 decimal places.`,
      correct: `${deepNum(maxSpeed, 2)} m/s`,
      wrongs: pickDistinct(`${deepNum(maxSpeed, 2)} m/s`, [
        // Minimum speed: swapped which bound of each quantity gives the extreme.
        `${deepNum((d - 0.5) / (t + 0.5), 2)} m/s`,
        // Both bounds pushed in the same direction.
        `${deepNum((d + 0.5) / (t + 0.5), 2)} m/s`,
        // The measurements used as though exact.
        `${deepNum(d / t, 2)} m/s`,
        `${deepNum((d - 0.5) / (t - 0.5), 2)} m/s`,
      ]),
      tags: ["round-half"],
      explanation: `Speed is distance ÷ time, so to make it as LARGE as possible take the largest distance and the smallest time. "To the nearest metre" means the true distance could be anything up to ${deepNum(d + 0.5, 1)} m; "to the nearest second" means the true time could be as little as ${deepNum(t - 0.5, 1)} s. Maximum speed = ${deepNum(d + 0.5, 1)} ÷ ${deepNum(t - 0.5, 1)} = ${deepNum(maxSpeed, 2)} m/s. The upper bound of the denominator produces the LOWER bound of the quotient — using ${deepNum(t + 0.5, 1)} as well gives the smallest speed, not the largest, which is the single most common way this question is failed.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** THE RATE IS THE UNKNOWN. The base family applies a known rate; the senior
   *  family has to unwind compound growth — nth root first, then subtract 1 —
   *  and the simple-interest rate is always among the options because that is
   *  the belief the reverse direction exposes. */
  "financial-maths": (r) => {
    const P = r.pick([400, 500, 800, 1250]);
    const rate = r.pick([10, 20, 25]);
    const years = r.int(2, 3);
    const grown = P * Math.pow(1 + rate / 100, years);
    const simple = ((grown - P) / (P * years)) * 100;
    const flat = (grown / P - 1) * 100;
    const correct = `r = ${rate}%`;
    return {
      prompt: `${deepMoney(P)} is invested at r% compound interest per year. After ${years} years the investment is worth ${deepMoney(grown)}.\nWork out the value of r.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The simple-interest rate: total gain spread evenly over the years.
        `r = ${deepNum(simple, 2)}%`,
        // The whole growth taken as one year's rate.
        `r = ${deepNum(flat, 2)}%`,
        // The rate multiplied by the number of years.
        `r = ${deepNum(rate * years, 2)}%`,
        `r = ${deepNum(flat / years, 2)}%`,
      ]),
      tags: ["simple-cp"],
      explanation: `Compound growth multiplies by (1 + r/100) once per year, so the whole period is a single multiplier raised to a power: ${deepMoney(grown)} ÷ ${deepMoney(P)} = ${deepNum(grown / P, 4)} = (1 + r/100)${pw(years)}. Undo the power with the ${years}th root — (${deepNum(grown / P, 4)})^(1/${years}) = ${deepNum(Math.pow(grown / P, 1 / years), 4)} — so 1 + r/100 = ${deepNum(Math.pow(grown / P, 1 / years), 4)} and r = ${rate}%. Dividing the total growth by the years without taking the root gives ${deepNum(simple, 2)}%, the SIMPLE-interest rate: it ignores that the later interest was earned on earlier interest, which is why it comes out too high every time.`,
      difficulty: 0.89 + r.next() * 0.05,
    };
  },

  /** CAPACITY ACROSS TWO UNITS. The base family scales a volume by k³; the
   *  senior family measures a tank in centimetres AND metres, so the unit
   *  conversion is the question — and the tag names exactly the belief that
   *  every edge is already in the same unit. */
  volume: (r) => {
    const a = r.pick([30, 40, 50, 60]);
    const b = r.pick([20, 25, 30, 45]);
    const c = r.pick([0.8, 1.2, 1.5, 2.0]);
    const litres = (a * b * c * 100) / 1000; // cm × cm × cm, then cm³ → litres
    const correct = `${deepNum(litres, 2)} litres`;
    return {
      prompt: `A rectangular tank measures ${a} cm by ${b} cm by ${deepNum(c, 1)} m.\nWork out its capacity in litres. (1 litre = 1000 cm³)`,
      correct,
      wrongs: pickDistinct(correct, [
        // All three lengths multiplied as written, with the metres treated as cm.
        `${deepNum(a * b * c, 2)} litres`,
        // Converted cm³ to litres by dividing by 100 instead of 1000.
        `${deepNum(litres * 10, 2)} litres`,
        // Metres treated as centimetres as well as the conversion inverted.
        `${deepNum(a * b * c * 100 * 1000, 2)} litres`,
        // Only the metre length converted, the other two left unscaled.
        `${deepNum((a * b * c) / 100, 2)} litres`,
      ]),
      tags: ["unit-sq"],
      explanation: `Every length must be in the SAME unit before any volume exists. Convert the height: ${deepNum(c, 1)} m = ${deepNum(c * 100, 0)} cm. Volume = ${a} × ${b} × ${deepNum(c * 100, 0)} = ${a * b * c * 100} cm³, and the conversion is 1000 cm³ per litre, so the capacity is ${a * b * c * 100} ÷ 1000 = ${correct}. Multiplying ${a} × ${b} × ${deepNum(c, 1)} as written mixes centimetres with metres and is dimensionally meaningless — that is what the tag names. A tank measured in centimetres holds tens to hundreds of litres, so answers of ${deepNum(a * b * c, 2)} or ${deepNum(litres * 10, 2)} can be rejected by order of magnitude alone — the unit slip never stays small.`,
      difficulty: 0.88 + r.next() * 0.05,
    };
  },

  /** CORRELATION USED FOR A PREDICTION BEYOND ITS DATA. The base family reads
   *  the line and checks causation; the senior family asks for a prediction and
   *  the answer has to carry the caveat the model's own range imposes — a
   *  number alone is the wrong answer to a question about a model. */
  "scatter-correlation": (r) => {
    const m = r.pick([4, 5, 6, 7]);
    const c = r.pick([25, 30, 35, 40]);
    const fitted = 10;
    const ask = fitted + r.pick([5, 8, 10]);
    const predicted = m * ask + c;
    const capped = predicted > 100;
    const correct = `y = ${predicted}, but ${ask} hours is outside the 1–${fitted} hours the line was fitted on, so the prediction is an extrapolation and unreliable${capped ? " — and a mark above 100 is impossible anyway" : ""}`;
    return {
      prompt: `A line of best fit relates hours of revision (x) to test mark (y): y = ${m}x + ${c}, fitted using data for x between 1 and ${fitted} hours.\nUse the line to predict the mark for ${ask} hours of revision, and state what the prediction is worth.`,
      correct,
      wrongs: pickDistinct(correct, [
        // The number with no caveat.
        `y = ${predicted} — a line of best fit can be used at any value of x`,
        // Over-correction: refusal to predict at all.
        `No prediction can be made — correlation never supports prediction`,
        // Extrapolation treated as proof of cause.
        `y = ${predicted}, which shows that revising ${ask} hours CAUSES a mark of ${predicted}`,
        // The intercept used as though it were the prediction.
        `y = ${c}`,
      ]),
      tags: ["corr-cause"],
      explanation: `Substituting into the model is the easy half: y = ${m} × ${ask} + ${c} = ${predicted}. The judgement is the other half. The line was fitted on x from 1 to ${fitted}; ${ask} lies outside that range, so the prediction is an EXTRAPOLATION — the relationship may bend, flatten or break entirely beyond the observed data, and the further out you go the less the straight line means.${capped ? ` It also returns a mark of ${predicted}, and no test is marked out of more than 100, which is the arithmetic's own warning that the model has been pushed too far.` : ""} A prediction INSIDE the fitted range is still only a prediction, but it is one the data supports; this one is not.`,
      difficulty: 0.89 + r.next() * 0.05,
    };
  },
};
