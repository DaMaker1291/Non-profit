// ─────────────────────────────────────────────────────────────────────────────
// PROBABILITY ACTIVITIES — THE MATHEMATICS, SEPARATE FROM THE PIXELS.
//
// A Venn diagram and a probability tree are reusable representations, but the
// thing that must not be duplicated is the arithmetic: which regions make a
// union, whether a typed 6/30 is the same answer as 1/5, and whether a tree
// path is a product of the branches above it. Those live here, pure and
// callable from both the browser component and the server route.
//
// The server never accepts an expected answer from the client. It names the
// activity, grades the submitted response against this module's own constants,
// and records the result through the ordinary evidence transaction.
// ─────────────────────────────────────────────────────────────────────────────

import type { LessonFigureSpec } from "./lesson-figure";

export type VennSetCount = 2 | 3;

export type Venn2Region = "onlyA" | "onlyB" | "both" | "neither";

export type Venn3Region =
  | "onlyA"
  | "onlyB"
  | "onlyC"
  | "bothAB"
  | "bothAC"
  | "bothBC"
  | "all"
  | "neither";

export type VennRegionKey = Venn2Region | Venn3Region;

const VENN2_KEYS = ["onlyA", "onlyB", "both", "neither"] as const;
const VENN3_KEYS = [
  "onlyA", "onlyB", "onlyC", "bothAB", "bothAC", "bothBC", "all", "neither",
] as const;

/** Which sets a region belongs to. `[]` is "outside every set". */
const REGION_MEMBERS: Readonly<Record<VennRegionKey, readonly number[]>> = {
  onlyA: [0],
  onlyB: [1],
  onlyC: [2],
  both: [0, 1],
  bothAB: [0, 1],
  bothAC: [0, 2],
  bothBC: [1, 2],
  all: [0, 1, 2],
  neither: [],
};

export interface VennSpec {
  readonly sets: VennSetCount;
  readonly labels: readonly string[];
  readonly counts: Readonly<Record<string, number>>;
}

export interface VennRegion {
  readonly key: VennRegionKey;
  readonly label: string;
  readonly count: number;
  readonly members: readonly number[];
}

/** The two-set diagram already drawn by lib/lesson-figure.ts#vennLayout. */
export const PROBABILITY_VENN: VennSpec = {
  sets: 2,
  labels: ["Football", "Tennis"],
  counts: { onlyA: 12, onlyB: 6, both: 6, neither: 6 },
};

// ── regions ─────────────────────────────────────────────────────────────────

export function vennRegionKeys(spec: VennSpec): VennRegionKey[] {
  return spec.sets === 2 ? [...VENN2_KEYS] : [...VENN3_KEYS];
}

export function vennRegionLabel(spec: VennSpec, key: VennRegionKey): string {
  const a = spec.labels[0] ?? "A";
  const b = spec.labels[1] ?? "B";
  const c = spec.labels[2] ?? "C";
  switch (key) {
    case "onlyA": return `${a} only`;
    case "onlyB": return `${b} only`;
    case "onlyC": return `${c} only`;
    case "both":
    case "bothAB": return `${a} and ${b} only`;
    case "bothAC": return `${a} and ${c} only`;
    case "bothBC": return `${b} and ${c} only`;
    case "all": return `All three (${a}, ${b} and ${c})`;
    case "neither": return "Neither";
  }
}

export function vennRegions(spec: VennSpec): VennRegion[] {
  return vennRegionKeys(spec).map((key) => ({
    key,
    label: vennRegionLabel(spec, key),
    count: Math.max(0, Math.round(Number(spec.counts[key]) || 0)),
    members: REGION_MEMBERS[key],
  }));
}

export function vennTotal(spec: VennSpec): number {
  return vennRegions(spec).reduce((total, region) => total + region.count, 0);
}

function membersOf(key: VennRegionKey): readonly number[] {
  return REGION_MEMBERS[key];
}

/** The regions that belong to at least one of the named sets. */
export function unionRegions(spec: VennSpec, setIndexes: readonly number[]): VennRegionKey[] {
  const wanted = new Set(setIndexes);
  return vennRegionKeys(spec).filter((key) => membersOf(key).some((member) => wanted.has(member)));
}

/** The regions in none of the named sets — the complement of their union. */
export function complementRegions(spec: VennSpec, setIndexes: readonly number[]): VennRegionKey[] {
  const union = new Set(unionRegions(spec, setIndexes));
  return vennRegionKeys(spec).filter((key) => !union.has(key));
}

export interface Fraction {
  readonly n: number;
  readonly d: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function reduce(n: number, d: number): Fraction | null {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0 || n < 0) return null;
  const denominator = Math.abs(Math.round(d));
  const numerator = Math.round(n);
  const divisor = gcd(numerator, denominator);
  return { n: numerator / divisor, d: denominator / divisor };
}

/** Parse a probability typed as a fraction, decimal or percentage.
 *
 *  `6/30`, `0.2`, `20%` and `1 / 5` are the same answer. A negative value is
 *  refused: no probability in this lesson is negative, and accepting one would
 *  let a nonsense response compare equal to a valid fraction after reduction.
 */
export function parseRational(raw: string): Fraction | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 40) return null;
  const percent = /%\s*$/.test(trimmed);
  const text = trimmed
    .replace(/%\s*$/, "")
    .replace(/\s+/g, "")
    .replace(/,/g, "")
    .replace(/\u2212/g, "-");
  if (!text) return null;

  if (text.includes("/")) {
    const parts = text.split("/");
    if (parts.length !== 2) return null;
    if (!/^\d+$/.test(parts[0]) || !/^\d+$/.test(parts[1])) return null;
    return reduce(Number(parts[0]), Number(parts[1]));
  }

  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  if (percent) {
    const n = Number(text);
    return Number.isFinite(n) ? reduce(n, 100) : null;
  }
  const decimals = text.includes(".") ? text.split(".")[1].length : 0;
  const denominator = 10 ** decimals;
  const numerator = Number(text) * denominator;
  return reduce(numerator, denominator);
}

export function rationalEquals(a: Fraction | null, b: Fraction | null): boolean {
  return !!a && !!b && a.n * b.d === b.n * a.d;
}

export function rationalText(value: Fraction): string {
  return value.d === 1 ? String(value.n) : `${value.n}/${value.d}`;
}

/** A region count as a probability, with the unreduced count shown too. */
export function vennProbability(
  spec: VennSpec,
  keys: readonly VennRegionKey[],
): { count: number; total: number; fraction: Fraction; text: string } | null {
  const total = vennTotal(spec);
  if (total === 0) return null;
  const wanted = new Set(keys);
  const count = vennRegions(spec)
    .filter((region) => wanted.has(region.key))
    .reduce((sum, region) => sum + region.count, 0);
  const fraction = reduce(count, total);
  if (!fraction) return null;
  return {
    count,
    total,
    fraction,
    text: `${count}/${total} = ${rationalText(fraction)}`,
  };
}

// ── activities ──────────────────────────────────────────────────────────────

export type ProbabilityActivityId = "venn-union" | "venn-neither" | "tree-values";

export const PROBABILITY_ACTIVITY_CONCEPT = "probability-basics";

export function probabilityActivityConcept(activityId: string): string | null {
  if (activityId === "venn-union" || activityId === "venn-neither" || activityId === "tree-values") {
    return PROBABILITY_ACTIVITY_CONCEPT;
  }
  return null;
}

export interface FieldResult {
  readonly key: string;
  readonly label: string;
  readonly correct: boolean;
  readonly modelAnswer: string;
}

export interface ProbabilityActivityResult {
  readonly correct: boolean;
  readonly modelAnswer: string;
  readonly feedback: string;
  readonly fields?: readonly FieldResult[];
}

const VENN_UNION_EXPECTED = unionRegions(PROBABILITY_VENN, [0, 1]);
const VENN_NEITHER_EXPECTED = { n: 1, d: 5 } as const;

function sameKeys(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

function gradeVennUnion(response: unknown): ProbabilityActivityResult | null {
  if (!Array.isArray(response) || response.some((value) => typeof value !== "string")) return null;
  const valid = new Set<string>(vennRegionKeys(PROBABILITY_VENN));
  const picked = response as string[];
  if (picked.some((key) => !valid.has(key))) return null;
  // A repeated region is not a second answer; it is malformed input.
  if (new Set(picked).size !== picked.length) return null;

  const correct = sameKeys(picked, VENN_UNION_EXPECTED);
  const labels = VENN_UNION_EXPECTED.map((key) => vennRegionLabel(PROBABILITY_VENN, key));
  return {
    correct,
    modelAnswer: `Football only, Tennis only, and the overlap (${labels.join("; ")}).`,
    feedback: correct
      ? "The union counts every learner in either circle exactly once: 12 + 6 + 6 = 24 of 30."
      : "The union is every region inside at least one circle. It includes the overlap once, and it excludes the 6 learners outside both circles.",
  };
}

function gradeVennNeither(response: unknown): ProbabilityActivityResult | null {
  if (typeof response !== "string") return null;
  const given = parseRational(response);
  if (!given) return null;
  const correct = rationalEquals(given, VENN_NEITHER_EXPECTED);
  return {
    correct,
    modelAnswer: "6/30 = 1/5 = 0.2 = 20%",
    feedback: correct
      ? "24 learners are in at least one circle, so 30 − 24 = 6 are in neither; 6/30 simplifies to 1/5."
      : "First find the union: 12 + 6 + 6 = 24. The learners in neither are the complement, 30 − 24 = 6, so the probability is 6/30.",
  };
}

/** The same 3-red/2-blue bag the lesson's tree draws. */
export const PROBABILITY_TREE: Extract<LessonFigureSpec, { kind: "tree" }> = {
  kind: "tree",
  first: [
    {
      label: "Red",
      probability: 3 / 5,
      display: "3/5",
      second: [
        { label: "Red", probability: 2 / 4, display: "2/4", pathDisplay: "6/20" },
        { label: "Blue", probability: 2 / 4, display: "2/4", pathDisplay: "6/20" },
      ],
    },
    {
      label: "Blue",
      probability: 2 / 5,
      display: "2/5",
      second: [
        { label: "Red", probability: 3 / 4, display: "3/4", pathDisplay: "6/20" },
        { label: "Blue", probability: 1 / 4, display: "1/4", pathDisplay: "2/20" },
      ],
    },
  ],
};

export interface TreeField {
  readonly key: "rr" | "bb" | "atLeastOneRed" | "dependent";
  readonly label: string;
  readonly kind: "value" | "choice";
  readonly answer: string;
  readonly options?: readonly string[];
}

export const TREE_FIELDS: readonly TreeField[] = [
  { key: "rr", label: "P(red then red)", kind: "value", answer: "6/20" },
  { key: "bb", label: "P(blue then blue)", kind: "value", answer: "2/20" },
  { key: "atLeastOneRed", label: "P(at least one red)", kind: "value", answer: "18/20" },
  {
    key: "dependent",
    label: "Are the two draws independent?",
    kind: "choice",
    answer: "Dependent",
    options: ["Independent", "Dependent"],
  },
];

function gradeTree(response: unknown): ProbabilityActivityResult | null {
  if (!response || typeof response !== "object" || Array.isArray(response)) return null;
  const submitted = response as Record<string, unknown>;
  const fields: FieldResult[] = [];
  let invalid = false;

  for (const field of TREE_FIELDS) {
    const raw = submitted[field.key];
    if (field.kind === "choice") {
      if (typeof raw !== "string" || !field.options?.includes(raw)) {
        invalid = true;
        break;
      }
      fields.push({
        key: field.key,
        label: field.label,
        correct: raw === field.answer,
        modelAnswer: field.answer,
      });
      continue;
    }
    if (raw === undefined || raw === null) {
      fields.push({ key: field.key, label: field.label, correct: false, modelAnswer: field.answer });
      continue;
    }
    if (typeof raw !== "string") {
      invalid = true;
      break;
    }
    const trimmed = raw.trim();
    if (!trimmed) {
      fields.push({ key: field.key, label: field.label, correct: false, modelAnswer: field.answer });
      continue;
    }
    const given = parseRational(trimmed);
    if (!given) {
      invalid = true;
      break;
    }
    const expected = parseRational(field.answer);
    fields.push({
      key: field.key,
      label: field.label,
      correct: rationalEquals(given, expected),
      modelAnswer: field.answer,
    });
  }

  if (invalid) return null;
  const correct = fields.every((field) => field.correct);
  return {
    correct,
    modelAnswer:
      "P(red then red) = 6/20; P(blue then blue) = 2/20; P(at least one red) = 18/20 = 9/10; the draws are dependent.",
    feedback: correct
      ? "The second branch depends on the first: after a red, 2 red and 2 blue remain; after a blue, 3 red and 1 blue remain. The four paths total 1."
      : "Multiply along a path, not across branches. The four paths are 6/20, 6/20, 6/20 and 2/20; they should total 1. At least one red is the complement of blue then blue.",
    fields,
  };
}

export function gradeProbabilityActivity(
  activityId: string,
  response: unknown,
): ProbabilityActivityResult | null {
  switch (activityId) {
    case "venn-union": return gradeVennUnion(response);
    case "venn-neither": return gradeVennNeither(response);
    case "tree-values": return gradeTree(response);
    default: return null;
  }
}
