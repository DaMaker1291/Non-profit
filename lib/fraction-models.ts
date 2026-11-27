// ─────────────────────────────────────────────────────────────────────────────
// FRACTIONS — magnitude on a line, and why the bottoms are never added.
//
// WHAT THE RESEARCH CHANGED. The pilot's fraction bar taught the part-whole
// reading — "3 of 4 equal pieces" — and that reading is necessary but not
// sufficient. In a study of 227 at-risk fourth-graders, part-whole understanding
// did NOT predict fewer whole-number ordering errors once fraction-magnitude
// estimation was controlled, while accuracy on a NUMBER LINE did (Bailey et al.
// 2016, recorded as `pmc-2016-fraction-ordering` in lib/learning-research.ts).
// A second study found the denominator-only comparison MORE common in Grade 6
// than in Grade 4 (Newstead & Murray 1998) — teaching the bar alone can entrench
// it. So the model that teaches `fractions` now puts the fraction ON A LINE and
// prints which side of one half it falls, and the bar remains as the picture of
// why the pieces shrank.
//
// The second model exists for the other measured error: learners add numerators
// and denominators separately, because that is what multiplying fractions and
// adding whole numbers both reward (Ejceel 2024: 74.2% of 63 Basic 7 learners
// failed 1/2 + 1/3; Ejmste 2022: over 60% of 40 Grade 7 learners treated fraction
// addition as whole-number addition). The model SHOWS the wrong answer as an
// amount, so the learner can see it is smaller than one of the numbers being
// added — which no correct sum can be.
//
// Pure: no React, no DOM. Every sentence the components print is built here, so
// the suite can drive the mathematics without a browser.
// ─────────────────────────────────────────────────────────────────────────────

/** Denominators are bounded so the drawing stays readable at 320 px and the
 *  arithmetic stays checkable in a learner's head. */
export const FRACTION_LIMIT = 12;

function whole(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/** "3/8" — never a decimal, because the notation is what the lesson is teaching. */
export function fractionLabel(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
}

function simplify(numerator: number, denominator: number): string {
  const g = gcd(numerator, denominator);
  return fractionLabel(numerator / g, denominator / g);
}

export type BenchmarkSide = "below-half" | "at-half" | "above-half";

export interface FractionLineReading {
  readonly numerator: number;
  readonly denominator: number;
  readonly label: string;
  /** Where the marker sits between 0 and 1. */
  readonly position: number;
  readonly benchmark: BenchmarkSide;
  /** The unit fraction for this denominator, e.g. "1/8". */
  readonly unitLabel: string;
  /** What one piece would be if the whole were cut one more time. */
  readonly finerUnitLabel: string;
  /** The sentence the component prints. */
  readonly sentence: string;
}

/** What one fraction is, as a POSITION. The half-benchmark is deliberately the
 *  first comparison: it needs one multiplication, not a common denominator, and
 *  it separates 3/8 from 5/8 without any arithmetic on the learner's part. */
export function readFractionLine(numeratorIn: number, denominatorIn: number): FractionLineReading {
  const denominator = whole(denominatorIn, 2, FRACTION_LIMIT);
  const numerator = whole(numeratorIn, 0, denominator);
  const position = numerator / denominator;
  const twice = numerator * 2;
  const benchmark: BenchmarkSide = twice < denominator ? "below-half" : twice === denominator ? "at-half" : "above-half";
  // THE ENDS OF THE LINE ARE NOT "ABOVE 1/2". A full bar is one whole and an empty
  // one is zero; saying 3/3 is "above 1/2" is true and unhelpful, and it was visible
  // in the screenshot. The benchmark stays as data (the half comparison is still the
  // teaching point) but the sentence names the endpoint when the marker is on it.
  const benchmarkWords =
    numerator === 0
      ? `at ZERO, the left end of the line: no pieces are taken`
      : numerator === denominator
        ? `at ONE WHOLE, the right end of the line, because all ${denominator} pieces are taken`
        : benchmark === "below-half"
          ? `below 1/2, because twice the top (${twice}) is less than the bottom (${denominator})`
          : benchmark === "at-half"
            ? `exactly 1/2, because twice the top (${twice}) equals the bottom`
            : `above 1/2, because twice the top (${twice}) is more than the bottom (${denominator})`;

  const piece =
    denominator === 1
      ? "the whole"
      : `1/${denominator} of the whole`;
  const finer = denominator < FRACTION_LIMIT ? `1/${denominator + 1}` : null;

  return {
    numerator,
    denominator,
    label: fractionLabel(numerator, denominator),
    position,
    benchmark,
    unitLabel: `1/${denominator}`,
    finerUnitLabel: finer ?? `1/${denominator}`,
    sentence:
      `${fractionLabel(numerator, denominator)} is ${numerator} piece${numerator === 1 ? "" : "s"}, each worth ${piece}. ` +
      `On the line from 0 to 1 the marker sits at ${position.toFixed(3)} — ${benchmarkWords}. ` +
      (finer
        ? `Cutting the same whole into ${denominator + 1} pieces instead makes each piece smaller, so ${finer} sits to the LEFT of ${fractionLabel(1, denominator)} even though ${denominator + 1} is the bigger number. `
        : "") +
      `The bottom number is the SIZE of a piece, never how many you have.`,
  };
}

export interface FractionComparison {
  readonly left: string;
  readonly right: string;
  readonly relation: "<" | "=" | ">";
  readonly commonDenominator: number;
  readonly leftConverted: string;
  readonly rightConverted: string;
  /** What comparing the denominators alone would conclude, and whether that is
   *  the right answer. `bottomRuleHappensToWork` is true only when the two
   *  denominators' order coincides with the fractions' order — which is why the
   *  rule survives in learners' heads. */
  readonly bottomRuleHappensToWork: boolean;
  readonly sentence: string;
}

export function compareFractions(
  leftNumerator: number,
  leftDenominator: number,
  rightNumerator: number,
  rightDenominator: number,
): FractionComparison {
  const ln = whole(leftNumerator, 0, FRACTION_LIMIT);
  const ld = whole(leftDenominator, 2, FRACTION_LIMIT);
  const rn = whole(rightNumerator, 0, FRACTION_LIMIT);
  const rd = whole(rightDenominator, 2, FRACTION_LIMIT);
  const common = lcm(ld, rd);
  const leftTop = (ln * common) / ld;
  const rightTop = (rn * common) / rd;
  const relation = leftTop < rightTop ? "<" : leftTop > rightTop ? ">" : "=";
  // The whole-number trap: "the bigger bottom is the bigger fraction".
  const bottomSaysGreater = ld > rd;
  const bottomRuleHappensToWork =
    (bottomSaysGreater && relation === ">") || (ld < rd && relation === "<") || ld === rd;

  return {
    left: fractionLabel(ln, ld),
    right: fractionLabel(rn, rd),
    relation,
    commonDenominator: common,
    leftConverted: fractionLabel(leftTop, common),
    rightConverted: fractionLabel(rightTop, common),
    bottomRuleHappensToWork,
    sentence:
      `In ${common}ths, ${fractionLabel(ln, ld)} is ${fractionLabel(leftTop, common)} and ` +
      `${fractionLabel(rn, rd)} is ${fractionLabel(rightTop, common)}, so ` +
      `${fractionLabel(ln, ld)} ${relation} ${fractionLabel(rn, rd)}. ` +
      (ld === rd
        ? `The bottoms match, so the tops decide it — but only because the pieces are already the same size.`
        : bottomRuleHappensToWork
          ? `Here the bigger bottom really does belong to the bigger fraction, which is why the shortcut feels safe — it is a coincidence of these two numbers, not a rule.`
          : `Comparing the bottoms alone would get this BACKWARDS: ${ld} is ${ld > rd ? "bigger" : "smaller"} than ${rd}, but the bigger bottom means smaller pieces, not a bigger amount.`),
  };
}

export interface FractionSumReading {
  readonly left: string;
  readonly right: string;
  readonly commonDenominator: number;
  readonly leftConverted: string;
  readonly rightConverted: string;
  /** The correct sum, as an improper-fraction label and simplified. */
  readonly sumLabel: string;
  readonly simplifiedLabel: string;
  /** Numerator and denominator of the correct sum, before simplifying. */
  readonly sumNumerator: number;
  /** The "add the tops and the bottoms" answer, as an amount. */
  readonly wrongLabel: string;
  readonly wrongValue: number;
  readonly correctValue: number;
  /** True when the wrong answer is smaller than the LARGER of the two numbers
   *  added, which is impossible for a sum of two positive fractions. The mediant
   *  (a+c)/(b+d) always lies between the two fractions, so it is the larger one it
   *  falls short of — not both. */
  readonly wrongIsImpossible: boolean;
  readonly sentence: string;
}

export function addFractions(
  leftNumerator: number,
  leftDenominator: number,
  rightNumerator: number,
  rightDenominator: number,
): FractionSumReading {
  const ln = whole(leftNumerator, 0, FRACTION_LIMIT);
  const ld = whole(leftDenominator, 2, FRACTION_LIMIT);
  const rn = whole(rightNumerator, 0, FRACTION_LIMIT);
  const rd = whole(rightDenominator, 2, FRACTION_LIMIT);
  const common = lcm(ld, rd);
  const leftTop = (ln * common) / ld;
  const rightTop = (rn * common) / rd;
  const sumNumerator = leftTop + rightTop;
  const correctValue = sumNumerator / common;
  const wrongLabel = fractionLabel(ln + rn, ld + rd);
  const wrongValue = (ln + rn) / (ld + rd);
  const leftValue = ln / ld;
  const rightValue = rn / rd;
  // The mediant lies between the addends, so it can never exceed the larger one;
  // it is strictly below it whenever the two fractions differ. That is the test a
  // learner can run: "my answer is smaller than 3/4, one of the numbers I added".
  const wrongIsImpossible =
    wrongValue < Math.max(leftValue, rightValue) - 1e-12;

  const simplified = simplify(sumNumerator, common);
  return {
    left: fractionLabel(ln, ld),
    right: fractionLabel(rn, rd),
    commonDenominator: common,
    leftConverted: fractionLabel(leftTop, common),
    rightConverted: fractionLabel(rightTop, common),
    sumLabel: fractionLabel(sumNumerator, common),
    simplifiedLabel: simplified,
    sumNumerator,
    wrongLabel,
    wrongValue,
    correctValue,
    wrongIsImpossible,
    sentence:
      `Both fractions are counted in ${common}ths: ${fractionLabel(ln, ld)} = ${fractionLabel(leftTop, common)} and ` +
      `${fractionLabel(rn, rd)} = ${fractionLabel(rightTop, common)}. Add the tops only: ` +
      `${leftTop} + ${rightTop} = ${sumNumerator}, so the sum is ${fractionLabel(sumNumerator, common)}` +
      (simplified !== fractionLabel(sumNumerator, common) ? ` = ${simplified}` : "") +
      `. Adding the bottoms as well would give ${wrongLabel}, which is ${wrongValue.toFixed(3)} — ` +
      (wrongIsImpossible
        ? `SMALLER than ${leftValue >= rightValue ? fractionLabel(ln, ld) : fractionLabel(rn, rd)}, one of the numbers being added. A sum of two positive amounts cannot be smaller than one of its parts.`
        : `not the sum: the bottoms are piece sizes, and adding sizes does not add amounts.`),
  };
}

export interface FractionBelief {
  readonly id:
    | "bigger-bottom-bigger-fraction"
    | "compare-by-bottoms"
    | "part-whole-is-enough"
    | "add-tops-and-bottoms"
    | "same-bottom-add-tops";
  readonly belief: string;
  readonly holds: boolean;
  readonly why: string;
  readonly sourceId: string;
}

/** Claims ABOUT THESE MODELS, checked in the suite. Each names an inspected
 *  source, so a pedagogical sentence in the component is traceable to something
 *  a person actually read. */
export const FRACTION_BELIEFS: readonly FractionBelief[] = [
  {
    id: "bigger-bottom-bigger-fraction",
    belief: "1/8 is bigger than 1/4, because 8 is bigger than 4.",
    holds: false,
    why: "The bottom number is the number of pieces the whole was cut into, so a bigger bottom means a smaller piece. Cutting the same whole into eight pieces instead of four cannot make a piece bigger.",
    sourceId: "ejceel-2024-fractions-basic7",
  },
  {
    id: "compare-by-bottoms",
    belief: "To compare two fractions, compare the bottom numbers.",
    holds: false,
    why: "The bottoms only decide it when they match. Otherwise the pieces are different sizes and the tops count different things: 2/3 is greater than 3/5 even though 3 < 5. Renaming both in the same size of piece is what makes the tops comparable.",
    sourceId: "pmc-2016-fraction-ordering",
  },
  {
    id: "part-whole-is-enough",
    belief: "A learner who can shade 3/4 of a shape can order fractions.",
    holds: false,
    why: "Part-whole shading is necessary but not sufficient. In a study of 227 at-risk fourth-graders, part-whole understanding did not predict fewer whole-number ordering errors once number-line estimation was controlled, while number-line accuracy did.",
    sourceId: "pmc-2016-fraction-ordering",
  },
  {
    id: "add-tops-and-bottoms",
    belief: "1/2 + 1/3 = 2/5, by adding the tops and the bottoms.",
    holds: false,
    why: "2/5 is smaller than 1/2, and a sum of two positive amounts cannot be smaller than one of them. The bottoms are piece sizes, not quantities, so they are not added — they are made the same first.",
    sourceId: "ejmste-2022-fraction-misconceptions",
  },
  {
    id: "same-bottom-add-tops",
    belief: "When the bottoms match, add the tops and keep the bottom.",
    holds: true,
    why: "Once the pieces are the same size, the tops are counts of the same thing: 4/6 + 5/6 is nine sixths. The model converts both fractions into the same denominator before adding, so this is an observation rather than a rule to memorise.",
    sourceId: "newstead-murray-1998-fractions",
  },
];
