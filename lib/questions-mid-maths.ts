// ─────────────────────────────────────────────────────────────────────────────
// THE MISSING MIDDLE — maths.
//
// Why this file exists. `npm run content-audit` draws each concept's WHOLE
// catalogue (240 seeds) and asks, per course, whether any draw sits in the
// demand band that course is serving at — because `generateQuestionNear`
// prefers an item in the target's own band over a nearer item outside it, so
// "can this concept answer this rung?" is a question about BANDS, not distance.
// Fifty of the 135 concepts could not answer one or more of their courses, and
// for almost every one of them the shape was identical: a base family at
// 0.25–0.45 and a depth family at 0.85–0.96, with NOTHING between them. Band 3
// (0.45–0.60) and band 4 (0.60–0.80) were unreachable, so a learner sitting at
// the rung between "recall" and "read it out of a table" was served the easy
// item or the very hard one and never the step in between.
//
// The cause is NOT the search, and that was measured rather than assumed:
// raising the production serve's draw budget from 40 to 400 moved nothing
// (audit/content-coverage.json reports cause A = 0 for every single course —
// no case where an in-band item existed and the serve failed to find one).
// There was nothing to find. The fix is content, and this is it.
//
// What a band-3/4 item IS. Not "a harder addition". The demand ladder
// (lib/skills.ts) puts recall below 0.5 and multi-step at 0.5, so a band-4 item
// must genuinely take SEVERAL LINKED STEPS — with the answer still stated in
// the question, because reading it out of a table is what band 5 means. Every
// family below is written to that definition and declares the band it earns:
//
//   mid3()   0.47–0.58   two linked steps
//   mid4()   0.63–0.77   three linked steps
//   deep5()  0.80–0.86   three linked steps AND the value read out of a table
//
// The ceilings are deliberately held below 0.90. `verify` asserts that a
// learner strong on stage-0 work is not offered a concept whose depth exceeds
// 0.9, and a mid-layer family has no business claiming a stage-5 ceiling: these
// exist to fill a HOLE, not to raise the top of the bank. (`gate:ceiling`'s
// named concepts, which must each reach 0.88, are all already above it.)
//
// Every answer is COMPUTED by the generator — the sum of three readings, the
// angle left in a triangle, the base-b rendering of a sum — so the key cannot
// drift from the item. Each distractor is a real step error: reporting the unit
// instead of the answer, forgetting the second stage, applying the change to
// the wrong base, reading marks off a tally without multiplying by the key.
//
// Only TYPES are imported from the depth layer: lib/questions.ts composes these
// records into its own generator table, so a value-level import back would
// close a module cycle — and a cycle that works today breaks at the next
// refactor. That is also why the small helpers are local.
// ─────────────────────────────────────────────────────────────────────────────
import type { DeepGen, DeepRng } from "./questions-deep";

/** The first `n` candidates genuinely different from the answer and each other.
 *  A family that returns fewer than three distinct wrong answers makes the
 *  assembler fall back to filler ("None of these"), which the question audit
 *  rightly calls a broken item — so every family passes more candidates than it
 *  needs and lets this decide. */
function distinct(correct: string, candidates: readonly (string | number)[], n = 3): string[] {
  const out: string[] = [];
  for (const cand of candidates) {
    const s = String(cand);
    if (s !== correct && !out.includes(s) && out.length < n) out.push(s);
  }
  return out;
}

/** A number a student would write: never a floating-point tail. */
function num(x: number, dp = 2): string {
  return String(Number(x.toFixed(dp)));
}

function gcd(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/** A fraction in lowest terms, as a student writes it. */
function frac(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  const nn = n / g;
  const dd = d / g;
  if (dd === 1) return String(nn);
  return dd < 0 ? `${nn > 0 ? "-" : ""}${Math.abs(nn)}/${-dd}` : `${nn}/${dd}`;
}

/** A bearing as three digits with the degree sign: 45 → `045°`. */
function bearing(deg: number): string {
  return `${String(((Math.round(deg) % 360) + 360) % 360).padStart(3, "0")}°`;
}

/** A whole number rendered in base b (2…8, so every digit is unambiguous). */
function toBase(n: number, b: number): string {
  if (n <= 0) return "0";
  let out = "";
  let m = n;
  while (m > 0) {
    out = String(m % b) + out;
    m = Math.floor(m / b);
  }
  return out;
}

/** Band 3 (0.45–0.60): two linked steps. */
function mid3(r: DeepRng): number {
  return 0.47 + r.next() * 0.11;
}

/** Band 4 (0.60–0.80): three linked steps. */
function mid4(r: DeepRng): number {
  return 0.63 + r.next() * 0.14;
}

/** Band 4's UPPER half (0.66–0.79) — three linked steps placed near the TOP of
 *  the band rather than at its floor.
 *
 *  Why `mid4` was not enough, measured rather than assumed. `mid4` fixed the
 *  concepts that had NO band-4 item at all. A second audit pass — "what is the
 *  best item IN the band the course asked for?" — found thirteen more whose
 *  band-4 draws all sat at 0.60–0.65: `inequalities` and `mixture-problems` had
 *  none at all, jumping from ~0.55 straight to 0.85, while `quadratics`,
 *  `pythagoras` and `trig-ratios` managed a handful at 0.60. A course whose
 *  climbed target lands at 0.77 (declared 0.55) is therefore served a 0.60
 *  item — in the right BAND, at the wrong depth, and the band-preference in
 *  `generateQuestionNear` keeps it there because an in-band item beats any
 *  nearer out-of-band one. This raises the floor of the band those concepts can
 *  reach. */
function upper4(r: DeepRng): number {
  return 0.66 + r.next() * 0.13;
}

/** A signed term as it is written in a bracket: `+ 4` or `− 4`. */
const plus = (n: number): string => (n < 0 ? `− ${-n}` : `+ ${n}`);

/** Band 5 (0.80–0.90), held under 0.90 on purpose: three linked steps AND the
 *  value read out of a table. Never above 0.90, so a mid family can never be
 *  mistaken for the bank's deepest work. */
function deep5(r: DeepRng): number {
  return 0.8 + r.next() * 0.06;
}

const MONTHS = ["Monday", "Tuesday", "Wednesday", "Thursday"];

export const MID_MATHS: Record<string, DeepGen> = {
  // ── ANGLES ────────────────────────────────────────────────────────────────
  /** Band 3: form the equation from the angle sum, then divide. Band 4: the
   *  angles of a triangle in a ratio — parts, one part, then back up. */
  "angles-lines": (r) => {
    if (r.next() < 0.5) {
      // Every pair makes the two unknown angles integer multiples of x, so the
      // answer is exact rather than a rounded decimal.
      const [k, x] = r.pick([[2, 30], [2, 35], [2, 40], [2, 45], [3, 20], [3, 25], [3, 30], [3, 35], [4, 15], [4, 20], [4, 25]]);
      const third = 180 - (k + 1) * x;
      const correct = String(x);
      return {
        prompt: `In a triangle, the three angles are x°, ${k}x° and ${third}°. Work out the value of x.`,
        correct,
        wrongs: distinct(correct, [k * x, third, k * x + third, 180 / (k + 1), Math.round((180 - third) / k), x + k]),
        tags: [],
        explanation: `The angles of a triangle add to 180°, so x + ${k}x + ${third} = 180. The two unknown angles are ${k + 1} lots of x between them, leaving ${k + 1}x = 180 − ${third} = ${180 - third}, so x = ${180 - third} ÷ ${k + 1} = ${x}. Reporting ${k * x} gives the OTHER unknown angle, and ${third} is the angle that was already given.`,
        difficulty: mid3(r),
      };
    }
    const [a, b, c] = r.pick([[1, 2, 3], [2, 3, 4], [1, 3, 5], [1, 2, 6], [1, 4, 5], [2, 2, 5], [3, 4, 5], [2, 3, 7]]);
    const unit = 180 / (a + b + c);
    const largest = Math.max(a, b, c) * unit;
    const correct = `${num(largest, 0)}°`;
    return {
      prompt: `The three angles of a triangle are in the ratio ${a} : ${b} : ${c}. Work out the size of the largest angle.`,
      correct,
      wrongs: distinct(correct, [
        // The whole turned into ONE part.
        `${num(unit, 0)}°`,
        `${num(Math.min(a, b, c) * unit, 0)}°`,
        // 180 minus the answer, and the answer with one part added.
        `${num(180 - largest, 0)}°`,
        `${num(largest + unit, 0)}°`,
        `${num(largest - unit, 0)}°`,
      ]),
      tags: [],
      explanation: `A ratio needs the parts counted before anything can be shared out: ${a} + ${b} + ${c} = ${a + b + c} parts, and 180° ÷ ${a + b + c} = ${num(unit, 2)}° per part. The largest angle is the largest share, ${Math.max(a, b, c)} parts: ${Math.max(a, b, c)} × ${num(unit, 2)} = ${num(largest, 1)}°. Answering ${num(unit, 0)}° gives one part, not the biggest angle.`,
      difficulty: mid4(r),
    };
  },

  // ── AREA & PERIMETER ─────────────────────────────────────────────────────
  /** Band 3: an L-shape's perimeter, where the missing sides have to be
   *  reconstructed (and the answer is the bounding rectangle's). Band 4: the
   *  area, then the cost — three linked steps. */
  "area-perimeter": (r) => {
    const W = r.int(8, 16);
    const H = r.int(8, 16);
    const nw = r.int(2, W - 4);
    const nh = r.int(2, H - 4);
    const outer = 2 * (W + H);
    if (r.next() < 0.5) {
      const correct = `${outer} cm`;
      return {
        prompt: `An L-shape is made by cutting a ${nw} cm by ${nh} cm rectangle out of a corner of a ${W} cm by ${H} cm rectangle. Work out the perimeter of the L-shape.`,
        correct,
        wrongs: distinct(correct, [
          // The notch's edges added to the perimeter instead of moved to it.
          `${outer + 2 * (nw + nh)} cm`,
          `${outer - 2 * (nw + nh)} cm`,
          // The AREA quoted as a perimeter.
          `${W * H - nw * nh} cm`,
          `${W * H} cm`,
          `${outer - (nw + nh)} cm`,
        ]),
        tags: [],
        explanation: `Cutting a rectangle from a CORNER does not change the perimeter: the two edges of the notch are exactly as long as the two edges they replace. So the perimeter is the outer rectangle's, 2 × (${W} + ${H}) = ${outer} cm. Adding the notch's edges on top (${outer + 2 * (nw + nh)} cm) counts every side as if it had been added rather than moved, and ${W * H - nw * nh} cm is the AREA in square units.`,
        difficulty: mid3(r),
      };
    }
    const area = W * H - nw * nh;
    const rate = r.pick([12, 15, 18, 22, 25, 30]);
    const cost = area * rate;
    const correct = `£${cost}`;
    return {
      prompt: `A floor is a ${W} m by ${H} m rectangle with a ${nw} m by ${nh} m rectangle missing from one corner. Carpet costs £${rate} per square metre. Work out the total cost of carpeting the floor.`,
      correct,
      wrongs: distinct(correct, [
        // The whole rectangle carpeted, notch and all.
        `£${W * H * rate}`,
        // Only the notch costed.
        `£${nw * nh * rate}`,
        // The area reported instead of the cost.
        `£${area}`,
        `£${area * rate + rate}`,
      ]),
      tags: [],
      explanation: `Three steps. Find the whole rectangle: ${W} × ${H} = ${W * H} m². Take off the part that is missing: ${W * H} − ${nw * nh} = ${area} m². Then price it: ${area} × £${rate} = ${correct}. Costing the full ${W * H} m² (£${W * H * rate}) carpets the corner that is not there, and £${area} is the area, not the cost.`,
      difficulty: mid4(r),
    };
  },

  // ── AVERAGES ──────────────────────────────────────────────────────────────
  /** Band 3: the total is not given — it has to be reconstructed from the mean
   *  before the missing value can be found. Band 4: a combined mean, where the
   *  group SIZES matter and the unweighted average is the trap. */
  averages: (r) => {
    if (r.next() < 0.5) {
      const n = r.pick([4, 5, 6]);
      const given: number[] = [];
      let sum = 0;
      for (let i = 0; i < n - 1; i++) {
        const v = r.int(10, 32);
        given.push(v);
        sum += v;
      }
      // The missing reading is chosen from the values that make the stated mean
      // a whole number, so the item has no rounding in it anywhere.
      const candidates: number[] = [];
      for (let m = 8; m <= 36; m++) if ((sum + m) % n === 0) candidates.push(m);
      const missing = r.pick(candidates.length ? candidates : [sum % n === 0 ? 0 : n - (sum % n)]);
      const mean = (sum + missing) / n;
      const correct = String(missing);
      return {
        prompt: `The mean of ${n} readings is ${mean}. ${n - 1} of them are ${given.join(", ")}. What is the missing reading?`,
        correct,
        wrongs: distinct(correct, [
          // The mean quoted back.
          mean,
          // The total, not the missing part of it.
          sum + missing,
          // Only the known readings added up.
          sum,
          // The answer moved by one step either way.
          missing + n,
          missing - n,
        ]),
        tags: [],
        explanation: `The mean is the TOTAL shared out, so start by rebuilding the total: ${n} × ${mean} = ${sum + missing}. The ${n - 1} readings we have add to ${sum}, so the missing one is ${sum + missing} − ${sum} = ${missing}. Answering ${mean} gives the mean back, and ${sum + missing} is the whole total rather than the gap in it.`,
        difficulty: mid3(r),
      };
    }
    let na = r.int(9, 26);
    let nb = r.int(9, 26);
    if (na === nb) nb += 1;
    const ma = r.int(42, 82);
    let mb = r.int(42, 82);
    if (mb === ma) mb += 3;
    const combined = (na * ma + nb * mb) / (na + nb);
    const correct = `${num(combined, 2)} marks`;
    return {
      prompt: `Class A has ${na} students with a mean test mark of ${ma}. Class B has ${nb} students with a mean test mark of ${mb}. Work out the mean mark of both classes together. Give your answer to 2 decimal places.`,
      correct,
      wrongs: distinct(correct, [
        // The unweighted average: correct only when the groups are the same size.
        `${num((ma + mb) / 2, 2)} marks`,
        // The total marks, never divided by the total number of students.
        `${na * ma + nb * mb} marks`,
        `${ma} marks`,
        `${mb} marks`,
        `${num(combined + 1, 2)} marks`,
      ]),
      tags: [],
      explanation: `A mean cannot be averaged without its group size. Convert both back to totals first: ${na} × ${ma} = ${na * ma} and ${nb} × ${mb} = ${nb * mb}, so the two classes hold ${na * ma + nb * mb} marks between ${na + nb} students. The combined mean is ${na * ma + nb * mb} ÷ ${na + nb} = ${num(combined, 2)}. Averaging the two means (${num((ma + mb) / 2, 2)}) is only right when the classes are the same size, and ${na * ma + nb * mb} is the total the mean describes rather than the mean itself.`,
      difficulty: mid4(r),
    };
  },

  // ── FRACTIONS ─────────────────────────────────────────────────────────────
  /** Band 3: unlike denominators, put over a common one, then add or subtract.
   *  Band 4: a fraction, then a fraction OF WHAT IS LEFT — three stages. */
  fractions: (r) => {
    if (r.next() < 0.5) {
      const [d1, d2] = r.shuffle([3, 4, 5, 6, 8, 10]).slice(0, 2);
      const n1 = r.int(1, d1 - 1);
      const n2 = r.int(1, d2 - 1);
      const lcm = (d1 * d2) / gcd(d1, d2);
      const a1 = (n1 * lcm) / d1;
      const a2 = (n2 * lcm) / d2;
      const adding = r.next() < 0.5 || a1 === a2;
      const top = adding ? a1 + a2 : Math.abs(a1 - a2);
      const correct = frac(top, lcm);
      const symbol = adding ? "+" : "−";
      return {
        prompt: `Work out ${n1}/${d1} ${symbol} ${n2}/${d2}. Give your answer as a fraction in its simplest form.`,
        correct,
        wrongs: distinct(correct, [
          // Tops added and bottoms added: the classic slip.
          frac(n1 + n2, d1 + d2),
          // The bottoms multiplied instead of finding the lowest common one.
          frac(n1 * d2 + n2 * d1, d1 * d2),
          // The untouched operand.
          `${n2}/${d2}`,
          `${n1}/${d1}`,
          frac(top + lcm, lcm),
        ]),
        tags: [],
        explanation: `The denominators are different, so the fractions cannot be counted directly. The lowest common denominator of ${d1} and ${d2} is ${lcm}: ${n1}/${d1} = ${a1}/${lcm} and ${n2}/${d2} = ${a2}/${lcm}. So the answer is (${a1} ${symbol} ${a2})/${lcm} = ${correct}. Adding the bottoms (${n1 + n2}/${d1 + d2}) treats the denominator as a size to add rather than a count of equal parts — the bottom number says what the parts are, never how many.`,
        difficulty: mid3(r),
      };
    }
    // Three stages: a fraction of the whole, then a fraction of what is LEFT.
    const total = r.pick([24, 30, 36, 40, 48, 60, 72]);
    const den1 = r.pick([3, 4, 5, 6].filter((d) => total % d === 0));
    const num1 = r.int(1, den1 - 1);
    const first = (total * num1) / den1;
    const rest = total - first;
    const den2 = r.pick([2, 3, 4, 5].filter((d) => rest % d === 0));
    const num2 = r.int(1, den2 - 1);
    const second = (rest * num2) / den2;
    const left = rest - second;
    const correct = String(left);
    return {
      prompt: `A box holds ${total} pens. ${num1}/${den1} of them are red. Of the pens that are NOT red, ${num2}/${den2} are blue. How many pens are neither red nor blue?`,
      correct,
      wrongs: distinct(correct, [
        // The blue count, one subtraction short of the answer.
        second,
        // The red count.
        first,
        // The fraction taken from the WHOLE box instead of from the rest.
        total - first - (total * num2) / den2,
        rest,
        left + second,
      ]),
      tags: [],
      explanation: `Read it in stages, and each stage uses what the last one LEFT. Red: ${num1}/${den1} of ${total} = ${first}. Not red: ${total} − ${first} = ${rest}. Blue: ${num2}/${den2} of ${rest} = ${second} — of the REST, not of the whole box. Neither: ${rest} − ${second} = ${left}. Taking the second fraction of the whole box (${num2}/${den2} of ${total}) uses the wrong base entirely, and ${second} is the blue count.`,
      difficulty: mid4(r),
    };
  },

  // ── DATA CHARTS ───────────────────────────────────────────────────────────
  /** Band 3 only for this concept — the depth layer already supplies its ≥0.75
   *  table read, so what was missing was the two-step tally in between. */
  "data-charts": (r) => {
    const key = r.pick([2, 4, 5, 10]);
    const marks = MONTHS.map(() => r.int(2, 7));
    const counts = marks.map((m) => m * key);
    const hi = counts.indexOf(Math.max(...counts));
    const lo = counts.indexOf(Math.min(...counts));
    const diff = counts[hi] - counts[lo];
    const correct = String(diff);
    return {
      prompt: `A chart records how many people visited a museum. Each tally mark stands for ${key} people.\n${MONTHS.map((d, i) => `· ${d}: ${"|".repeat(marks[i])}`).join("\n")}\nHow many more people visited on ${MONTHS[hi]} than on ${MONTHS[lo]}?`,
      correct,
      wrongs: distinct(correct, [
        // The difference counted in MARKS, before the key was applied.
        marks[hi] - marks[lo],
        // The two counts added instead of compared.
        counts[hi] + counts[lo],
        // Only the busier day counted.
        counts[hi],
        diff + key,
        marks[hi],
      ]),
      tags: [],
      explanation: `A tally mark is a GROUP, not one person, so the key has to be applied before anything is compared. ${MONTHS[hi]} shows ${marks[hi]} marks, which is ${marks[hi]} × ${key} = ${counts[hi]} people; ${MONTHS[lo]} shows ${marks[lo]} marks, which is ${marks[lo]} × ${key} = ${counts[lo]} people. The difference is ${counts[hi]} − ${counts[lo]} = ${diff}. Reporting ${marks[hi] - marks[lo]} is the gap in MARKS, which answers a question about tally marks rather than about people.`,
      difficulty: mid3(r),
    };
  },

  // ── LOCI ──────────────────────────────────────────────────────────────────
  /** Band 4: a region built from a rule, where the fraction of the circle has
   *  to be worked out before anything is evaluated. The answer stays a multiple
   *  of π, so the item never depends on which approximation a student's
   *  calculator holds. */
  "loci-constructions": (r) => {
    const rad = r.pick([4, 6, 8, 10, 12]);
    const [fracNum, fracDen, where] = r.pick([
      [3, 4, "the corner of a square barn"],
      [1, 2, "a point on a straight fence"],
      [1, 4, "the point where two walls meet at a right angle"],
    ]);
    const coef = (fracNum * rad * rad) / fracDen;
    const correct = `${num(coef, 2).replace(/\.00$/, "")}π m²`;
    return {
      prompt: `A goat is tied to ${where} with a rope ${rad} m long. The wall blocks part of the circle the goat could otherwise reach, so it can graze ${fracNum}/${fracDen} of that circle. Work out the area the goat can graze, in terms of π.`,
      correct,
      wrongs: distinct(correct, [
        // The whole circle, before the fraction is applied.
        `${rad * rad}π m²`,
        // The wrong fraction of the same circle.
        `${num((rad * rad) / fracDen, 2).replace(/\.00$/, "")}π m²`,
        `${num((2 * rad * rad) / fracDen, 2).replace(/\.00$/, "")}π m²`,
        // The area doubled, or halved once too often.
        `${coef * 2}π m²`,
        `${num(coef / 2, 2).replace(/\.00$/, "")}π m²`,
      ]),
      tags: [],
      explanation: `Two steps before the fraction means anything. First the circle the full rope would reach: πr² = π × ${rad}² = ${rad * rad}π m². Then the share the wall leaves: ${fracNum}/${fracDen} of ${rad * rad}π = ${num(coef, 2).replace(/\.00$/, "")}π m². Reporting ${rad * rad}π m² forgets that the wall is there at all — the rule that defines the locus is "how far from the tie, WITHIN what the wall leaves", and both halves have to be used.`,
      difficulty: mid4(r),
    };
  },

  // ── TRANSFORMATIONS ───────────────────────────────────────────────────────
  /** Band 4: two transformations applied in order, where the second one acts on
   *  the output of the first. A single transformation is a lookup; two in
   *  sequence is where the order starts to matter. */
  transformations: (r) => {
    const x = r.int(1, 8);
    const y = r.int(1, 8);
    const a = r.int(1, 6);
    const b = r.int(1, 6);
    if (r.next() < 0.5) {
      // 90° clockwise about the origin: (x, y) → (y, −x), then translate.
      const correct = `(${y + a}, ${b - x})`;
      return {
        prompt: `Point A is at (${x}, ${y}). A shape containing A is rotated 90° clockwise about the origin, and then translated by ${a} to the right and ${b} up. What are the coordinates of the image of A?`,
        correct,
        wrongs: distinct(correct, [
          // The translation only — the rotation dropped.
          `(${x + a}, ${y + b})`,
          // Rotated ANTICLOCKWISE: (x, y) → (−y, x).
          `(${a - y}, ${x + b})`,
          // The two coordinates swapped by the rotation and then not moved.
          `(${y}, ${-x})`,
          // The translation applied to the original coordinates.
          `(${b - y}, ${x + a})`,
        ]),
        tags: [],
        explanation: `Do them in the order given. A 90° clockwise turn about the origin sends (x, y) to (y, −x), so A goes to (${y}, ${-x}). The translation then moves that point ${a} right and ${b} up: (${y} + ${a}, ${-x} + ${b}) = (${y + a}, ${b - x}). Translating the ORIGINAL point (${x + a}, ${y + b}) skips the rotation, and a 90° anticlockwise turn — (x, y) → (−y, x) — is the commonest mix-up because both are "90 degrees".`,
        difficulty: mid4(r),
      };
    }
    // Enlargement by k about the origin, then a reflection in the x-axis.
    const k = r.pick([2, 3, 4, 5]);
    const correct = `(${k * x}, ${-k * y})`;
    return {
      prompt: `Point A is at (${x}, ${y}). A shape containing A is enlarged by scale factor ${k} about the origin, and then reflected in the x-axis. What are the coordinates of the image of A?`,
      correct,
      wrongs: distinct(correct, [
        // Reflected in the y-axis instead of the x-axis.
        `(${-k * x}, ${k * y})`,
        // Added k instead of multiplying by it.
        `(${x + k}, ${y + k})`,
        // Reflected but never enlarged.
        `(${x}, ${-y})`,
        // Enlarged and then reflected in the line y = x.
        `(${-k * y}, ${k * x})`,
      ]),
      tags: [],
      explanation: `An enlargement about the origin MULTIPLIES both coordinates: (${x}, ${y}) → (${k * x}, ${k * y}). A reflection in the x-axis leaves the x-coordinate alone and flips the sign of the y-coordinate, giving (${k * x}, ${-k * y}). Reflecting in the y-axis flips the other one (${-k * x}, ${k * y}), and adding the scale factor (${x + k}, ${y + k}) is the slip that confuses "scale factor ${k}" with "move ${k} squares".`,
      difficulty: mid4(r),
    };
  },

  // ── SETS & VENN ───────────────────────────────────────────────────────────
  /** Band 4: the union, then the complement, then the split — three linked
   *  steps, with "at least one" always offered as the wrong answer because that
   *  is the step learners stop at. */
  "sets-venn": (r) => {
    const both = r.int(4, 13);
    const onlyA = r.int(3, 15);
    const onlyB = r.int(3, 15);
    const neither = r.int(2, 11);
    const total = both + onlyA + onlyB + neither;
    const a = onlyA + both;
    const b = onlyB + both;
    const exactlyOne = onlyA + onlyB;
    const correct = String(exactlyOne);
    return {
      prompt: `In a survey of ${total} people, ${a} like tea, ${b} like coffee and ${both} like both. How many like EXACTLY ONE of the two drinks?`,
      correct,
      wrongs: distinct(correct, [
        // At least one — the union, one step short of the answer.
        a + b - both,
        // The two totals added, counting the overlap twice.
        a + b,
        // Everybody who likes neither.
        total - (a + b - both),
        // The overlap itself.
        both,
        // Everybody who does not like both.
        total - both,
      ]),
      tags: [],
      explanation: `Subtract the overlap before splitting: the people who like at least one drink number ${a} + ${b} − ${both} = ${a + b - both}. Of those, ${both} like both, so exactly one drink is liked by ${a + b - both} − ${both} = ${exactlyOne}. Stopping at ${a + b - both} answers "at least one", and ${a + b} counts the ${both} people who like both a second time — which is why the two totals cannot simply be added.`,
      difficulty: mid4(r),
    };
  },

  // ── NUMBER BASES ──────────────────────────────────────────────────────────
  /** Band 4: two conversions around an addition. Three linked steps, and the
   *  decimal sum is always on offer because that is where learners stop. */
  "number-bases": (r) => {
    const base = r.pick([2, 3, 4, 5, 8]);
    const a = r.int(1, base * base + base);
    const b = r.int(1, base * base + base);
    const totalDec = a + b;
    const correct = toBase(totalDec, base);
    return {
      prompt: `Work out ${toBase(a, base)} + ${toBase(b, base)}, giving your answer in base ${base}.`,
      correct,
      wrongs: distinct(correct, [
        // The answer left in decimal.
        String(totalDec),
        // The sum one place out, either side.
        toBase(totalDec + 1, base),
        toBase(totalDec - 1, base),
        // Place value applied as if the base were ten.
        String(Number(toBase(a, base)) + Number(toBase(b, base))),
        toBase(a * b, base),
      ]),
      tags: [],
      explanation: `A base is a place-value system, so convert, add, and convert back. In base ${base}, ${toBase(a, base)} is worth ${a} and ${toBase(b, base)} is worth ${b}; adding gives ${totalDec} in decimal. Writing ${totalDec} in base ${base} means dividing by ${base} repeatedly: ${totalDec} → ${correct}. Answering ${totalDec} leaves the sum in decimal, and ${String(Number(toBase(a, base)) + Number(toBase(b, base)))} adds the digits as if the column were worth ten — the exact error the base exists to change.`,
      difficulty: mid4(r),
    };
  },

  // ── BEARINGS ──────────────────────────────────────────────────────────────
  /** Band 3: two equal legs at a right angle, so the direct bearing bisects
   *  the turn. Band 4: an unequal right-angled pair, where the angle has to be
   *  found with trigonometry and then converted into a three-figure bearing. */
  bearings: (r) => {
    if (r.next() < 0.5) {
      const start = r.pick([0, 45, 90, 135, 180, 225, 270, 315]);
      const dir = r.next() < 0.5 ? 1 : -1;
      const turnDeg = (start + dir * 90 + 360) % 360;
      const final = (start + dir * 45 + 360) % 360;
      const dist = r.int(4, 20);
      const correct = bearing(final);
      return {
        prompt: `A walker sets off from a hut and walks ${dist} km on a bearing of ${bearing(start)}. They then turn and walk another ${dist} km on a bearing of ${bearing(turnDeg)}. Work out the bearing of the walker from the hut.`,
        correct,
        wrongs: distinct(correct, [
          bearing(turnDeg),
          bearing(start),
          bearing(final + 180),
          bearing(start - dir * 45),
          bearing(turnDeg + dir * 45),
        ]),
        tags: [],
        explanation: `The two legs are the same length and meet at 90° (${bearing(start)} to ${bearing(turnDeg)} is a right-angle turn), so the triangle is isosceles and the direct line splits that 90° into two 45° angles. The walker is therefore 45° round from the first bearing in the direction they turned: ${bearing(start)} + ${dir * 45}° = ${correct}. Reporting ${bearing(turnDeg)} is the SECOND leg's direction, and ${bearing(final + 180)} is the bearing back — a bearing is measured at its own starting point.`,
        difficulty: mid3(r),
      };
    }
    // A right-angled pair with unequal legs: the angle needs the tangent.
    const legs: Array<[string, string, number, number]> = [
      ["north", "east", 0, 1],
      ["south", "east", 0, -1],
      ["south", "west", 0, -1],
      ["north", "west", 0, 1],
    ];
    const [firstDir, secondDir, ns, ew] = r.pick(legs);
    const d1 = r.int(3, 14);
    const d2 = r.int(3, 14);
    // First leg runs north/south (ns), the second east/west (ew).
    const E = ew * d2;
    const N = ns * d1;
    const angle = ((Math.atan2(E, N) * 180) / Math.PI + 360) % 360;
    const correct = `${num(angle, 1)}°`;
    return {
      prompt: `A ship sails ${d1} km ${firstDir}, then ${d2} km ${secondDir}. Work out the bearing of the ship from its starting point. Give your answer to 1 decimal place.`,
      correct,
      wrongs: distinct(correct, [
        `${num((90 - angle + 360) % 360, 1)}°`,
        `${num((angle + 90) % 360, 1)}°`,
        `${num((360 - angle) % 360, 1)}°`,
        `${num(d2 / d1, 1)}°`,
        `${num(((Math.atan2(N, E) * 180) / Math.PI + 360) % 360, 1)}°`,
      ]),
      tags: [],
      explanation: `Draw it: the two legs are perpendicular, so the direct line is the hypotenuse of a right-angled triangle ${
        firstDir === "north" || firstDir === "south" ? `with the ${Math.abs(N)} km leg running north–south` : ""
      } and the ${Math.abs(E)} km leg east–west. The angle is found from the tangent of the legs: tan θ = ${Math.abs(E)}/${Math.abs(N)}, so θ = ${num(angle, 1)}°. Bearings are measured CLOCKWISE FROM NORTH, so the angle from the north line is the bearing itself when the ship finishes north-east of where it started, and ${num((360 - angle) % 360, 1)}° when it finishes north-west. Dividing the legs (${num(d2 / d1, 1)}°) gives a ratio, not an angle.`,
      difficulty: mid4(r),
    };
  },

  // ── CIRCLE THEOREMS ───────────────────────────────────────────────────────
  /** Band 4: two theorems used one after the other. The chord AC is a diameter,
   *  so BOTH triangles on it are right-angled, and the answer is the sum of the
   *  two angles that are left. */
  "circle-theorems": (r) => {
    const p = r.pick([20, 25, 30, 35, 40]);
    const q = r.pick([15, 20, 25, 30, 35]);
    const acb = 90 - p; // angle in a semicircle, then the angle sum of ABC
    const acd = 90 - q; // the same two theorems again in ACD
    const bcd = acb + acd;
    const correct = `${bcd}°`;
    return {
      prompt: `A, B, C and D are four points on a circle, in that order. The chord AC passes through the centre of the circle. Angle BAC = ${p}° and angle CAD = ${q}°. Work out the size of angle BCD.`,
      correct,
      wrongs: distinct(correct, [
        // Only one of the two triangles used.
        `${acb}°`,
        `${acd}°`,
        // The angles at A added and then subtracted from 180 — the same sum
        // only if the two semicircle facts are both used, which is the point.
        `${180 - p - q}°`,
        `${p + q}°`,
        // The semicircle angle quoted on its own.
        "90°",
      ]),
      tags: [],
      explanation: `AC is a diameter, so the angle in a semicircle makes both triangles right-angled: angle ABC = ${90}° and angle ADC = ${90}°. Two steps follow, one per triangle. In ABC, angle ACB = 180 − 90 − ${p} = ${acb}. In ACD, angle ACD = 180 − 90 − ${q} = ${acd}. Angle BCD is those two together — ${acb} + ${acd} = ${bcd}. Using only one triangle gives ${acb}°, and ${p + q}° is the angle at A, which is the angle the two interior angles are measured from, not the answer.`,
      difficulty: mid4(r),
    };
  },

  // ── QUADRATIC GRAPHS ──────────────────────────────────────────────────────
  /** Band 4: the turning point, where the x-coordinate comes from completing
   *  the square and the y-coordinate needs that value substituted back. */
  "quadratic-graphs": (r) => {
    const b = r.pick([2, 4, 6, 8, 10, 12]) * (r.next() < 0.5 ? 1 : -1);
    const c = r.int(-9, 12);
    const h = -b / 2;
    const k = c - h * h;
    const sign = b > 0 ? "+" : "−";
    const correct = String(k);
    return {
      prompt: `The graph of y = x² ${sign} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} has a minimum point at (${h}, k). Work out the value of k.`,
      correct,
      wrongs: distinct(correct, [
        // The y-intercept, left where the line starts instead of moved to the
        // turning point.
        String(c),
        String(-k),
        String(k + 1),
        String(h),
        String(k - h),
      ]),
      tags: [],
      explanation: `Complete the square: x² ${sign} ${Math.abs(b)}x ${c < 0 ? "−" : "+"} ${Math.abs(c)} = (x ${h < 0 ? "+" : "−"} ${Math.abs(h)})² ${k < 0 ? "−" : "+"} ${Math.abs(k)}, so the least value of y is ${k} and it happens at x = ${h}. Notice that the k is NOT the ${c} where the graph crosses the y-axis (that is the y-value at x = 0, not at the turning point), and (x${h < 0 ? "+" : "−"}${Math.abs(h)})² is never negative, which is why ${k} is a minimum and not just a value.`,
      difficulty: mid4(r),
    };
  },

  // ── FUNCTIONS ─────────────────────────────────────────────────────────────
  /** Band 3: rearrange for the input that gives a stated output. Band 4: two
   *  functions composed, where the inner one has to be evaluated first. */
  functions: (r) => {
    const a = r.int(2, 7);
    const b = r.int(1, 12);
    const c = r.int(2, 9);
    const d = r.int(1, 12);
    if (r.next() < 0.5) {
      // f⁻¹: solve ax + b = target for a whole-number input.
      const target = a * r.int(3, 12) + b;
      const input = (target - b) / a;
      const correct = String(input);
      return {
        prompt: `f(x) = ${a}x + ${b}. Work out the value of x for which f(x) = ${target}.`,
        correct,
        wrongs: distinct(correct, [
          // The output quoted as the input.
          target,
          // The subtraction done the wrong way round.
          num((target + b) / a, 1),
          // The division applied before the subtraction.
          num(target / a - b, 1),
          // One step out.
          input + 1,
          input - 1,
        ]),
        tags: [],
        explanation: `f(x) = ${target} means ${a}x + ${b} = ${target}. Undo the operations in reverse order: subtract ${b} first, giving ${a}x = ${target - b}, then divide by ${a}, so x = ${correct}. Answering ${target} gives the OUTPUT of the function rather than the input that produced it, and ${num(target / a - b, 1)} divides before subtracting — undoing has to take the last operation off first.`,
        difficulty: mid3(r),
      };
    }
    const inner = r.int(2, 12);
    const first = a * inner + b; // f(inner)
    const result = c * first + d; // g(f(inner)) with g(x) = cx + d
    const correct = String(result);
    return {
      prompt: `f(x) = ${a}x + ${b} and g(x) = ${c}x + ${d}. Work out the value of g(f(${inner})).`,
      correct,
      wrongs: distinct(correct, [
        // The inner function's value, one step short.
        first,
        // The order of composition swapped: f(g(inner)).
        a * (c * inner + d) + b,
        // The two functions multiplied.
        first * (c * inner + d),
        // Both functions applied to the same input and added.
        first + c * inner + d,
        // The outer function applied to the raw input.
        c * inner + d,
      ]),
      tags: [],
      explanation: `g(f(${inner})) is read inside out, and the brackets say so. First f(${inner}) = ${a} × ${inner} + ${b} = ${first}. That value becomes the input to g: g(${first}) = ${c} × ${first} + ${d} = ${correct}. Stopping at ${first} answers f(${inner}), and f(g(${inner})) = ${a * (c * inner + d) + b} exists too — but it is a different function, because composition does not commute.`,
      difficulty: mid4(r),
    };
  },

  // ── DECIMALS ──────────────────────────────────────────────────────────────
  /** Band 5: three measurements in three different units, read from a table,
   *  each needing a conversion before anything can be added. */
  decimals: (r) => {
    const m = r.int(1, 9);
    const cm = r.int(11, 89);
    const mm = r.int(11, 89);
    const total = m + cm / 100 + mm / 1000;
    const correct = `${num(total, 3)} m`;
    return {
      prompt: `A table lists the lengths of three pipes:
· pipe A: ${m} m
· pipe B: ${cm} cm
· pipe C: ${mm} mm
Work out the total length of the three pipes in metres.`,
      correct,
      wrongs: distinct(correct, [
        // The numbers added as if they shared a unit.
        `${num(m + cm + mm, 3)} m`,
        // The last measurement dropped.
        `${num(m + cm / 100, 3)} m`,
        // The centimetres converted as millimetres and vice versa.
        `${num(m + cm / 1000 + mm / 100, 3)} m`,
        `${num(total * 1000, 3)} m`,
        `${num(total * 100, 3)} m`,
      ]),
      tags: [],
      explanation: `A table with mixed units cannot be added until every row is in the SAME unit, and the question asks for metres. Pipe B is ${cm} cm = ${num(cm / 100, 2)} m (divide by 100) and pipe C is ${mm} mm = ${num(mm / 1000, 3)} m (divide by 1000). So the total is ${m} + ${num(cm / 100, 2)} + ${num(mm / 1000, 3)} = ${num(total, 3)} m. Adding ${m}, ${cm} and ${mm} as they stand (${num(m + cm + mm, 3)}) treats a millimetre as a metre — a factor of a thousand, which is the whole reason the units are printed.`,
      difficulty: deep5(r),
    };
  },

  // ── INDICES ───────────────────────────────────────────────────────────────
  /** Band 5: the index laws chained — add the indices, subtract the third, and
   *  only then evaluate the power. A negative result has to be turned into a
   *  reciprocal, which is the second thing the laws license. */
  "indices-intro": (r) => {
    // The answer's index is chosen FIRST and the divisor derived from it, so the
    // result is a whole number of times the base rather than something that has
    // to be rounded into a distractor.
    const base = r.pick([2, 3, 5]);
    const p = r.int(3, 7);
    const q = r.int(2, 6);
    const net = r.int(2, 4);
    const s = p + q - net;
    if (r.next() < 0.5) {
      // Positive index: add, subtract, then evaluate.
      const value = Math.pow(base, net);
      const correct = String(value);
      return {
        prompt: `Work out (${base}${sup(p)} × ${base}${sup(q)}) ÷ ${base}${sup(s)}. Give your answer as a whole number.`,
        correct,
        wrongs: distinct(correct, [
          // The indices multiplied (the power-of-a-power law) instead of added.
          String(p * q),
          // The divisor's index added instead of subtracted.
          String(Math.pow(base, p + q + s)),
          // One out either way.
          String(Math.pow(base, net + 1)),
          String(Math.pow(base, net + 2)),
          String(base * p * q),
        ]),
        tags: [],
        explanation: `The index laws work on the indices first, and only then on the number. Multiplying powers of ${base} ADDS the indices: ${p} + ${q} = ${p + q}. Dividing SUBTRACTS: ${p + q} − ${s} = ${net}. So the expression is ${base}${sup(net)} = ${value}. Multiplying the indices (${p} × ${q}) is a real law too — but it belongs to a power OF a power, that is (${base}${sup(p)})${sup(q)}, and there is no bracket here.`,
        difficulty: deep5(r),
      };
    }
    // A negative index: the answer is a reciprocal, and a fraction is the honest
    // way to write it rather than a decimal that never terminates.
    const p2 = r.int(2, 5);
    const s2 = p2 + net + 1;
    const denom = Math.pow(base, s2 - p2);
    const correct = frac(1, denom);
    return {
      prompt: `Work out ${base}${sup(p2)} ÷ ${base}${sup(s2)}. Give your answer as a fraction in its simplest form.`,
      correct,
      wrongs: distinct(correct, [
        // The reciprocal the other way up.
        String(denom),
        // The indices ADDED where they should be subtracted.
        String(Math.pow(base, p2 + s2)),
        // The negative sign kept on the whole number.
        `-${denom}`,
        frac(1, denom + 1),
        frac(1, denom * base),
      ]),
      tags: [],
      explanation: `Dividing powers of the same base SUBTRACTS the indices: ${p2} − ${s2} = ${p2 - s2}. A NEGATIVE index means a reciprocal, not a negative number: ${base}${sup(p2 - s2)} = 1 ÷ ${base}${sup(s2 - p2)} = ${correct}. Answering ${denom} turns the reciprocal the wrong way up, and −${denom} treats an index of ${p2 - s2} as "minus ${denom}" — a negative index never makes a negative value.`,
      difficulty: deep5(r),
    };
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// THE UPPER HALF OF BAND 4, AND WHY IT IS A SEPARATE RECORD.
//
// Band 4 spans 0.60–0.80. Mission "the middle of the ladder" filled the band
// for 42 concepts; a second pass asked a sharper question — not "is there an
// item in the band?" but "what is the nearest item IN the band?" — and found
// thirteen more whose band-4 draws all sat at 0.60–0.65. `inequalities` and
// `mixture-problems` had none at all, jumping from ~0.55 straight to 0.85, so a
// course whose climbed target lands at 0.77 (declared 0.55) was served a 0.60
// item: right band, wrong depth, and the band-preference in
// `generateQuestionNear` holds it there because an in-band item beats any
// nearer out-of-band one. Every family below places its items at 0.66 and
// above, and each is three LINKED steps rather than a bigger number in the same
// step — which is what the demand ladder means by band 4 (lib/skills.ts puts
// multi-step at 0.5).
//
// WHY IT CANNOT LIVE IN `MID_MATHS`. `withDepth` consumes one draw from the
// shared RNG and gives the new family 50% of everything beneath it, so every
// layer added ABOVE the deep families halves their share of the draws. Composed
// where MID_MATHS is (inside the subject layers) that took `circle-area-arc`'s
// ceiling from 0.92 to 0.788 and `trig-identity`'s to 0.876 — caught by
// `npm run gate:ceiling`, which holds both at 0.88, and caught before it shipped
// because that gate is absolute for its named concepts. Composed INNERMOST
// instead — directly onto the BASE family, in lib/questions.ts — the new layer
// takes its share from the base family and every deep family keeps exactly the
// share it had. Which is the whole point: this layer exists to fill a gap in
// the middle, and a gap-filler that lowers a ceiling has made the bank worse.
export const MID_UPPER_MATHS: Record<string, DeepGen> = {
  // ── THE THIRTEEN CONCEPTS WITH NO UPPER BAND 4 ─────────────────────────────

  // ── INEQUALITIES ──────────────────────────────────────────────────────────
  /** Band 4: solve a DOUBLE inequality and then act on the solution set — count
   *  the integers inside it, or pick the largest one. Both are a stage beyond
   *  solving: the solve gives a set, and the question is about the set. */
  "inequalities": (r) => {
    if (r.next() < 0.5) {
      const m = r.pick([2, 3, 4, 5]);
      const lo = r.int(-6, 4);
      const count = r.int(3, 6);
      const hi = lo + count;
      // Non-zero, so the prompt never prints "+ 0"; and both ends stay exact
      // integers, so the solution set is counted rather than estimated.
      const c = r.pick([-9, -7, -5, -3, -2, 2, 3, 4, 5, 7, 8, 9]);
      const a = m * lo + c;
      const b = m * hi + c;
      const correct = String(count);
      return {
        prompt: `Solve the inequality ${a} ≤ ${m}x ${plus(c)} < ${b}.\n\nHow many integer values of x satisfy it?`,
        correct,
        wrongs: distinct(correct, [
          // The upper endpoint counted as a solution, which the strict half of
          // the inequality excludes.
          count + 1,
          count - 1,
          // The endpoints quoted as counts.
          hi,
          lo,
          hi - lo + 1,
        ]),
        tags: [],
        explanation: `Every part moves together. Subtract ${c}: ${m * lo} ≤ ${m}x < ${m * hi}. Divide each part by ${m}: ${lo} ≤ x < ${hi}. The integers from ${lo} up to but NOT INCLUDING ${hi} are ${Array.from({ length: Math.max(0, Math.min(count, 5)) }, (_, i) => lo + i).join(", ")}${count > 5 ? ", …" : ""} — that is ${count} values. Counting ${hi} as well (${count + 1} values) reads the second inequality as “≤”, and ${hi} does not satisfy it.`,
        difficulty: upper4(r),
      };
    }
    // The answer A is chosen first, and the boundary is placed strictly between
    // A and A+1, so "largest integer" is unambiguous: A satisfies and A+1 does not.
    const d = r.pick([2, 3, 4, 5]);
    const A = r.int(3, 8);
    const j = r.int(1, d - 1);
    const k = d * A + j;
    const t = r.int(1, 9);
    const q = k - t;
    // k = q + t needs q positive for a prompt without a double sign.
    if (q <= 0) return MID_UPPER_MATHS["inequalities"](r);
    const s = r.int(1, 6);
    const p = s + d;
    const correct = String(A);
    return {
      prompt: `Find the largest integer value of x for which ${p}x − ${q} < ${s}x + ${t}.`,
      correct,
      wrongs: distinct(correct, [
        //  x < k/d read as x ≤ k/d.
        A + 1,
        A - 1,
        // The boundary quoted as an answer, and the coefficient that survives.
        Math.ceil(k / d),
        Math.floor(k / d),
        d,
      ]),
      tags: [],
      explanation: `Collect the x-terms on one side first: subtracting ${s}x from both sides gives ${d}x − ${q} < ${t}, and adding ${q} gives ${d}x < ${q + t} = ${k}. Dividing by ${d}: x < ${k}/${d}. Since ${k}/${d} lies strictly between ${A} and ${A + 1}, x can be at most ${A} — and ${A + 1} does NOT satisfy the inequality, because the sign is < and not ≤. That slip is the whole trap: dividing by ${d} when the answer should stay a whole number gives ${Math.ceil(k / d)}, which is one too big.`,
      difficulty: upper4(r),
    };
  },

  // ── MIXTURE PROBLEMS ──────────────────────────────────────────────────────
  /** Band 4: conservation of the SOLUTE as well as of the volume. The two
   *  equations are the whole item — get one and the answer is wrong in a way
   *  that still adds up to the right total, which is why this reads as three
   *  linked steps rather than a percentage calculation. */
  "mixture-problems": (r) => {
    // Every combination gives an INTEGER result, so the answer is exact. The
    // list is checked by the content sweep rather than trusted.
    const [p, q, x, y] = r.pick([
      [20, 50, 10, 20], [20, 50, 20, 10], [10, 30, 20, 20], [30, 60, 20, 20],
      [40, 70, 20, 20], [10, 50, 30, 10], [5, 25, 20, 20], [20, 60, 30, 10],
      [25, 55, 20, 20], [15, 35, 30, 10], [20, 40, 25, 25], [10, 40, 30, 10],
    ]);
    const total = x + y;
    const mix = (p * x + q * y) / total;
    // A non-integer mixture would make the prompt a rounding exercise; the
    // combination is bad, not the family.
    if (!Number.isInteger(mix)) return MID_UPPER_MATHS["mixture-problems"](r);
    const correct = String(y);
    return {
      prompt: `A chemist mixes a ${p}% solution with a ${q}% solution to make ${total} litres of a ${mix}% solution.\n\nHow many litres of the ${q}% solution are used?`,
      correct,
      wrongs: distinct(correct, [
        // The other volume: right total, wrong question.
        x,
        // Half the mixture, and the whole mixture.
        Math.round(total / 2),
        total,
        y + 2,
        Math.abs(x - y),
        Math.round((total * (mix - p)) / (q - p)) + 1,
      ]),
      tags: [],
      explanation: `Two things are conserved, and using only one of them is how this goes wrong. The volumes add up: (${p}% litres) + (${q}% litres) = ${total}. The SOLUTE does not appear or vanish: ${p}% of the first plus ${q}% of the second must equal ${mix}% of the total, so ${p}x + ${q}y = ${mix} × ${total} = ${(mix * total).toFixed(0)} per 100 — which is what makes x = ${x} and y = ${y} the only solution. Answering ${x} gives the OTHER volume: it still adds to ${total} litres, so the total looks right even though the mixture is not ${mix}%.`,
      difficulty: upper4(r),
    };
  },

  // ── GROWTH & DECAY ────────────────────────────────────────────────────────
  /** Band 4: the percentage applies to a value that has ALREADY changed, which
   *  is what separates compound from simple, plus the subtraction that turns the
   *  new value into the change asked for. */
  "growth-decay": (r) => {
    if (r.next() < 0.5) {
      const P = r.pick([2000, 2500, 4000, 5000, 8000, 10000, 12000, 15000, 20000, 40000, 50000]);
      const n = r.pick([2, 3]);
      const rate = r.pick([2, 3, 4, 5, 6, 8, 10, 12]);
      const after = Math.round(P * Math.pow(1 + rate / 100, n));
      const grown = after - P;
      const simple = Math.round((P * rate * n) / 100);
      const correct = String(grown);
      return {
        prompt: `The population of a town is ${P}. It grows by ${rate}% each year.\n\nBy how many people will the population have grown after ${n} years? (Give your answer to the nearest whole number.)`,
        correct,
        wrongs: distinct(correct, [
          // SIMPLE interest: the same amount each year, off the original figure.
          simple,
          // The new total, and the growth of the last year alone.
          after,
          after - Math.round(P * Math.pow(1 + rate / 100, n - 1)),
          Math.round((P * rate) / 100),
          after + P,
        ]),
        tags: [],
        explanation: `“${rate}% each year” compounds: each year's increase is taken on the value at the START of that year, not on the original ${P}. So the population is ${P} × ${num(1 + rate / 100, 2)}${sup(n)} = ${after} after ${n} years, and the GROWTH is ${after} − ${P} = ${grown}. The tempting error is ${simple}, which is ${rate}% of the original ${P} counted ${n} times — simple interest. It is wrong from the second year onwards, when the increase is ${rate}% of a bigger number.`,
        difficulty: upper4(r),
      };
    }
    const V = r.pick([12000, 15000, 16000, 18000, 20000, 24000, 25000, 30000, 45000, 50000]);
    const n = r.pick([2, 3]);
    const rate = r.pick([5, 8, 10, 12, 15, 20, 25]);
    const factor = 1 - rate / 100;
    const worth = Math.round(V * Math.pow(factor, n));
    const straight = Math.round(V - (V * rate * n) / 100);
    const correct = `£${worth}`;
    return {
      prompt: `A car is bought new for £${V}. Its value falls by ${rate}% each year.\n\nWhat is the car worth after ${n} years? (Give your answer to the nearest pound.)`,
      correct,
      wrongs: distinct(correct, [
        // Straight-line: ${rate}% of the PRICE PAID, once per year.
        `£${straight}`,
        // One year's depreciation, and the last year's fall on its own.
        `£${Math.round(V * factor)}`,
        `£${V - worth}`,
        `£${Math.round(V * Math.pow(factor, n + 1))}`,
        `£${Math.round(V * (1 - rate / 100 / n))}`,
      ]),
      tags: [],
      explanation: `“Falls by ${rate}% each year” is compound DECAY: multiply by ${num(factor, 2)} once for every year, so £${V} × ${num(factor, 2)}${sup(n)} = £${worth}. The percentage applies to the value at the start of each year, not to the price first paid — taking ${rate}% of the ORIGINAL £${V} every year gives £${straight}, which is straight-line depreciation and a different model. Answering £${V - worth} gives the total LOSS, not what the car is worth.`,
      difficulty: upper4(r),
    };
  },

  // ── ALGEBRA: EXPANDING ────────────────────────────────────────────────────
  /** Band 4: pick ONE coefficient out of the expansion (the two x-terms must be
   *  collected) or expand and then substitute. Both are harder than "expand",
   *  because the answer is not the whole expression. */
  "algebra-expand": (r) => {
    const A = r.int(1, 5);
    const C = r.int(1, 5);
    const B = r.pick([-7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]);
    const D = r.pick([-7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]);
    if (r.next() < 0.5) {
      const coeff = A * D + B * C;
      // A vanishing x-term makes "the coefficient of x" a trick answer.
      if (coeff === 0) return MID_UPPER_MATHS["algebra-expand"](r);
      const correct = String(coeff);
      return {
        prompt: `Expand and simplify (${A}x ${plus(B)})(${C}x ${plus(D)}).\n\nWhat is the coefficient of x in the expansion?`,
        correct,
        wrongs: distinct(correct, [
          // One pair only: the outer product or the inner one.
          A * D,
          B * C,
          // The neighbouring coefficients, and the sign flip.
          A * C,
          B * D,
          -coeff,
          A * D - B * C,
        ]),
        tags: [],
        explanation: `The x-term is the sum of the two CROSS products: the outer pair ${A}x × ${D} = ${A * D}x, and the inner pair ${B} × ${C}x = ${B * C}x. Adding them: ${A * D} ${plus(B * C)} → the coefficient is ${coeff}. Stopping at ${A * D} forgets the inner pair, and ${B * C} forgets the outer one — the two halves of the same step. ${A * C} is the coefficient of x², and ${B * D} is the constant.`,
        difficulty: upper4(r),
      };
    }
    const k = r.int(-4, 4);
    const L = A * k + B;
    const R = C * k + D;
    const value = L * R;
    const correct = String(value);
    return {
      prompt: `Given (${A}x ${plus(B)})(${C}x ${plus(D)}), work out the value of the expression when x = ${k}.`,
      correct,
      wrongs: distinct(correct, [
        // Substituting with the signs dropped.
        (A * k - B) * (C * k - D),
        // Expanding but substituting into only the squared term.
        A * C * k * k + B * D,
        // One bracket evaluated, the other used raw.
        L * (C * k + D) + 0,
        L + R,
        -value,
        A * C * k * k + B + D,
      ]),
      tags: [],
      explanation: `Substitute into each bracket and multiply — there is no need to expand first. ${A}(${k}) ${plus(B)} = ${L}, and ${C}(${k}) ${plus(D)} = ${R}, so the value is ${L} × ${R} = ${value}. (Expanding and then substituting gives the same number by a longer route — the point is that both routes agree, and ${L + R} adds the brackets instead of multiplying them.)`,
      difficulty: upper4(r),
    };
  },

  // ── CIRCLE AREA & ARC ─────────────────────────────────────────────────────
  /** Band 4: the arc or the sector, and then the step that turns it into the
   *  quantity actually asked for — the perimeter (which adds two radii) or the
   *  major sector (which subtracts from the whole circle). */
  "circle-area-arc": (r) => {
    // The prompt states π = 3.142, so the generator uses 3.142 too: a family
    // that computed with Math.PI and told the learner to use 3.142 would mark a
    // correct answer wrong at the first decimal place.
    const PI = 3.142;
    if (r.next() < 0.5) {
      const rad = r.pick([4, 5, 6, 7, 8, 9, 10, 12, 15]);
      const ang = r.pick([30, 36, 45, 60, 72, 90, 120, 135, 144, 210, 240, 300]);
      const arc = (ang / 360) * 2 * PI * rad;
      const perim = arc + 2 * rad;
      const area = (ang / 360) * PI * rad * rad;
      const correct = `${num(perim, 1)} cm`;
      return {
        prompt: `A sector of a circle has radius ${rad} cm and an angle of ${ang}° at the centre.\n\nWork out the PERIMETER of the sector, in cm. (Use π = 3.142 and give your answer to 1 decimal place.)`,
        correct,
        wrongs: distinct(correct, [
          // The curved edge only: the two straight radii are missing.
          `${num(arc, 1)} cm`,
          // The two radii only, the sector AREA, and one radius added.
          `${num(2 * rad, 1)} cm`,
          `${num(area, 1)} cm`,
          `${num(arc + rad, 1)} cm`,
          `${num(2 * PI * rad, 1)} cm`,
        ]),
        tags: [],
        explanation: `A sector's boundary is the ARC plus the TWO radii, and skipping the radii is the usual error. Arc: ${ang}⁄360 × 2 × 3.142 × ${rad} = ${num(arc, 2)} cm. Add the straight edges: ${num(arc, 2)} + 2 × ${rad} = ${num(arc, 2)} + ${2 * rad} = ${num(perim, 1)} cm. Answering ${num(arc, 1)} cm measures only the curved part, and ${num(area, 1)} is the AREA of the sector — a different quantity with the same units' shape.`,
        difficulty: upper4(r),
      };
    }
    // Under 180°, so the major sector is genuinely the larger piece.
    const rad = r.pick([5, 6, 7, 8, 9, 10, 12]);
    const ang = r.pick([30, 36, 45, 60, 72, 90, 120, 135, 144]);
    const minor = (ang / 360) * PI * rad * rad;
    const whole = PI * rad * rad;
    const major = whole - minor;
    const correct = `${num(major, 1)} cm²`;
    return {
      prompt: `A sector of a circle has radius ${rad} cm and an angle of ${ang}° at the centre.\n\nWork out the area of the MAJOR sector, in cm². (Use π = 3.142 and give your answer to 1 decimal place.)`,
      correct,
      wrongs: distinct(correct, [
        // The MINOR sector: the smaller piece, not the bigger one.
        `${num(minor, 1)} cm²`,
        // The whole circle, the sum instead of the difference, and a doubling.
        `${num(whole, 1)} cm²`,
        `${num(whole + minor, 1)} cm²`,
        `${num(2 * minor, 1)} cm²`,
        `${num(2 * PI * rad, 1)} cm²`,
      ]),
      tags: [],
      explanation: `The two sectors together ARE the whole circle, so the major sector is the circle MINUS the minor one — that subtraction is the step this item is testing. Whole circle: 3.142 × ${rad}² = ${num(whole, 2)} cm². Minor sector: ${ang}⁄360 × ${num(whole, 2)} = ${num(minor, 2)} cm². Major sector: ${num(whole, 2)} − ${num(minor, 2)} = ${num(major, 1)} cm². Answering ${num(minor, 1)} cm² gives the sector named in the question, not the one it asked for, and ${num(2 * PI * rad, 1)} is a CIRCUMFERENCE, whose units are cm, not cm².`,
      difficulty: upper4(r),
    };
  },

  // ── STRAIGHT LINES ────────────────────────────────────────────────────────
  /** Band 4: gradient from two points, then the intercept, then the ROOT — the
   *  coordinate asked for is not either point given. */
  "straight-lines": (r) => {
    const m = r.pick([1, 2, 3, 4, -1, -2, -3]);
    // The x-intercept is −k, chosen first so it is a whole number: c = m·k makes
    // −c/m = −k exact, and no answer is a rounded gradient.
    const k = r.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
    const x1 = r.int(1, 4);
    const c = m * k;
    const y1 = m * x1 + c;
    const x2 = x1 + 1;
    const y2 = m * x2 + c;
    const correct = `(${-k}, 0)`;
    return {
      prompt: `A straight line passes through (${x1}, ${y1}) and (${x2}, ${y2}).\n\nWork out the coordinates of the point where the line crosses the x-axis.`,
      correct,
      wrongs: distinct(correct, [
        // The Y-intercept: the same question asked of the other axis.
        `(0, ${c})`,
        // The sign dropped off the root.
        `(${k}, 0)`,
        // The y-intercept with the axes swapped, and the two mixed up.
        `(0, ${-k})`,
        `(${-k}, ${c})`,
        `(${c}, 0)`,
      ]),
      tags: [],
      explanation: `Three steps, and the third is the one asked for. Gradient: (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${y2 - y1} ÷ ${x2 - x1} = ${m}. Intercept: at (${x1}, ${y1}), ${y1} = ${m} × ${x1} + c, so c = ${c}. Root: the line crosses the x-axis where y = 0, so 0 = ${m}x ${plus(c)}, giving x = ${-k}. The point is (${-k}, 0). Answering (0, ${c}) is where the line crosses the Y-axis — the same shape of question about the other axis.`,
      difficulty: upper4(r),
    };
  },

  // ── MATRICES ──────────────────────────────────────────────────────────────
  /** Band 4: one entry of a product (the row-by-column rule), or the determinant
   *  of a product through det(AB) = det(A)det(B) — a transfer step, since the
   *  matrices are never multiplied. */
  "matrices-intro": (r) => {
    const A = r.int(1, 6);
    const B = r.int(-5, 5);
    const C = r.int(-5, 5);
    const D = r.int(1, 6);
    const E = r.int(1, 6);
    const F = r.int(-5, 5);
    const G = r.int(-5, 5);
    const H = r.int(1, 6);
    const detA = A * D - B * C;
    const detB = E * H - F * G;
    if (r.next() < 0.5) {
      const correct = String(A * E + B * G);
      return {
        prompt: `A = [[${A}, ${B}], [${C}, ${D}]] and B = [[${E}, ${F}], [${G}, ${H}]].\n\nWork out the TOP-LEFT entry of the product AB.`,
        correct,
        wrongs: distinct(correct, [
          // One of the two products, and the difference instead of the sum.
          A * E,
          B * G,
          A * E - B * G,
          // The other column of B, and the pairings crossed over.
          A * F + B * H,
          A * G + B * E,
          A + E,
        ]),
        tags: [],
        explanation: `An entry of a product is a ROW of the first matrix against a COLUMN of the second. The top-left entry uses row 1 of A — (${A}, ${B}) — and column 1 of B — (${E}, ${G}). Multiply position by position and add: (${A} × ${E}) + (${B} × ${G}) = ${A * E} + ${B * G} = ${A * E + B * G}. Using column 2 instead (${A} × ${F} + ${B} × ${H} = ${A * F + B * H}) gives the top-RIGHT entry, and crossing the pairings (${A * G + B * E}) is the same numbers in the wrong positions.`,
        difficulty: upper4(r),
      };
    }
    const correct = String(detA * detB);
    return {
      prompt: `A = [[${A}, ${B}], [${C}, ${D}]] and B = [[${E}, ${F}], [${G}, ${H}]].\n\nWork out the determinant of the matrix product AB.`,
      correct,
      wrongs: distinct(correct, [
        // The determinants combined with the wrong operation.
        detA + detB,
        detA - detB,
        // The determinant of A + B, which is not the product's.
        (A + E) * (D + H) - (B + F) * (C + G),
        // One determinant only.
        detA,
        -detA * detB,
      ]),
      tags: [],
      explanation: `det(AB) = det(A) × det(B) is an identity, so the matrices never have to be multiplied: det A = (${A} × ${D}) − (${B} × ${C}) = ${A * D} − ${B * C} = ${detA}; det B = (${E} × ${H}) − (${F} × ${G}) = ${E * H} − ${F * G} = ${detB}; and the product's determinant is ${detA} × ${detB} = ${correct}. Adding them (${detA + detB}) is the wrong operation — determinants MULTIPLY when the matrices multiply.`,
      difficulty: upper4(r),
    };
  },

  // ── KINEMATICS ────────────────────────────────────────────────────────────
  /** Band 4: two suvat equations in sequence — the acceleration is not given, so
   *  the distance needs a stage before it. */
  "kinematics": (r) => {
    // t even keeps ½at² whole; every answer is exact rather than rounded.
    const t = r.pick([4, 6, 8, 10]);
    const accel = r.pick([1, 2, 3, 4, 5]);
    const u = r.pick([0, 2, 4, 5, 10, 12, 15, 20]);
    const v = u + accel * t;
    const half = 0.5 * accel * t * t;
    const s = u * t + half;
    const correct = `${num(s, 0)} m`;
    return {
      prompt: `A cyclist accelerates uniformly from ${u} m/s to ${v} m/s in ${t} seconds.\n\nHow far does she travel while accelerating?`,
      correct,
      wrongs: distinct(correct, [
        // The speed held constant: the starting one, and the final one.
        `${num(u * t, 0)} m`,
        `${num(v * t, 0)} m`,
        // Average speed applied without halving it.
        `${num((u + v) * t, 0)} m`,
        // The acceleration quoted as a distance.
        `${num(accel, 0)} m`,
        `${num(half, 0)} m`,
      ]),
      tags: [],
      explanation: `The distance is not asked for directly, so one stage comes first. Acceleration: a = (v − u) ÷ t = (${v} − ${u}) ÷ ${t} = ${accel} m/s². Distance: s = ut + ½at² = ${u} × ${t} + ½ × ${accel} × ${t}² = ${num(u * t, 0)} + ${num(half, 0)} = ${num(s, 0)} m. The average-speed route agrees — (${u} + ${v}) ÷ 2 × ${t} = ${num((u + v) / 2, 1)} × ${t} = ${num(s, 0)} m — which is why ${num(v * t, 0)} m (assuming she travelled the whole time at her FINAL speed) overshoots, and ${num(u * t, 0)} m (all of it at the starting speed) undershoots.`,
      difficulty: upper4(r),
    };
  },

  // ── TRIGONOMETRIC IDENTITIES ──────────────────────────────────────────────
  /** Band 4: an identity plus a QUADRANT, in either direction — build the third
   *  side from a ratio and read tan off it, or use sin² + cos² = 1 and get the
   *  sign right. */
  "trig-identity": (r) => {
    if (r.next() < 0.5) {
      const [opp, adj, hyp] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]);
      const correct = `${opp}/${adj}`;
      return {
        prompt: `θ is an acute angle and sin θ = ${opp}/${hyp}.\n\nWork out the exact value of tan θ.`,
        correct,
        wrongs: distinct(correct, [
          // The reciprocal, and the other two ratios of the same triangle.
          `${adj}/${opp}`,
          `${hyp}/${opp}`,
          `${adj}/${hyp}`,
          `${opp}/${hyp}`,
          `${hyp}/${adj}`,
        ]),
        tags: [],
        explanation: `sin θ = opposite ÷ hypotenuse, so draw the right-angled triangle with opposite ${opp} and hypotenuse ${hyp}. The third side comes from Pythagoras: √(${hyp}² − ${opp}²) = √${hyp * hyp - opp * opp} = ${adj}. Then tan θ = opposite ÷ adjacent = ${opp}/${adj}. Turning the fraction over (${adj}/${opp}) gives cot θ, and ${adj}/${hyp} is cos θ — the ratio that shares its adjacent side but has the hypotenuse underneath.`,
        difficulty: upper4(r),
      };
    }
    // cos is given NEGATIVE (the angle is obtuse), so the sign of the answer is
    // the whole second step: in the second quadrant sin is positive.
    const [cosAbs, sinVal] = r.pick([[0.8, 0.6], [0.6, 0.8], [0.28, 0.96], [0.96, 0.28]]);
    const correct = num(sinVal, 2);
    return {
      prompt: `θ is an obtuse angle and cos θ = −${num(cosAbs, 2)}.\n\nWork out the value of sin θ.`,
      correct,
      wrongs: distinct(correct, [
        // The negative root, which belongs to the third quadrant.
        num(-sinVal, 2),
        // 1 − cos (instead of 1 − cos²), and cos itself.
        num(1 - cosAbs, 2),
        num(cosAbs, 2),
        // cos², left before the square root.
        num(cosAbs * cosAbs, 2),
        num(1 + cosAbs, 2),
      ]),
      tags: [],
      explanation: `Use sin²θ + cos²θ = 1: sin²θ = 1 − (−${num(cosAbs, 2)})² = 1 − ${num(cosAbs * cosAbs, 2)} = ${num(sinVal * sinVal, 2)}. Squaring loses the sign, so both roots are possible — and the QUADRANT decides. An obtuse angle lies between 90° and 180°, where sin is POSITIVE and cos is negative, so sin θ = +${correct}. Answering −${correct} is not a slip in the algebra: it is the reflex angle's root, and the second step of this question is knowing which of the two it is.`,
      difficulty: upper4(r),
    };
  },
};

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** A Unicode superscript, so an index is printed as an index and never as `^`.
 *  A negative index keeps its minus sign in front (`10⁻³`). */
function sup(n: number): string {
  const digits = String(Math.abs(n))
    .split("")
    .map((c) => SUP[Number(c)])
    .join("");
  return n < 0 ? `⁻${digits}` : digits;
}

