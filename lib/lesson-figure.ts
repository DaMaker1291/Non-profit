// ─────────────────────────────────────────────────────────────────────────────
// A LESSON'S OWN DRAWINGS, COMPUTED FROM THE NUMBERS THEY TEACH.
//
// The authored lesson renderer used to carry only text: a Venn diagram was a
// sentence listing four counts, and a tree was a line of fractions. That is a
// description of a picture, not the picture. A learner who needs to see the
// overlap counted once, or the second branch change because the first counter
// was not replaced, was being asked to build the drawing in their head.
//
// These two kinds are deliberately SEPARATE from lib/types.ts#FigureSpec. A
// question figure must never give away its answer (`question-figure` is
// aria-hidden and captioned from the spec); a lesson figure is teaching, so its
// caption is authored prose and it may state the counts. Sharing a union would
// let a lesson drawing leak into a question, which is the one place a figure
// must not answer the question it illustrates.
//
// Geometry lives here, pure and testable. The renderer maps these numbers to
// SVG; it does not decide where a region goes or what a path is worth.
// ─────────────────────────────────────────────────────────────────────────────

export const LESSON_FIGURE_KINDS = ["venn", "tree", "bar"] as const;
export type LessonFigureKind = (typeof LESSON_FIGURE_KINDS)[number];

export type LessonFigureSpec =
  | {
      /** TWO OVERLAPPING SETS, WITH THE FOUR REGIONS COUNTED. */
      kind: "venn";
      labelA: string;
      labelB: string;
      onlyA: number;
      onlyB: number;
      both: number;
      neither: number;
    }
  | {
      /** A TWO-STAGE TREE. Each first branch carries its own second branches,
       *  because that is what "without replacement" means: the second
       *  probabilities depend on which first branch was taken. A single shared
       *  second list could not draw the lesson's 3-red-2-blue bag. */
      kind: "tree";
      first: readonly {
        readonly label: string;
        readonly probability: number;
        /** How the branch is written, e.g. `3/5`. Absent renders a percentage. */
        readonly display?: string;
        readonly second: readonly {
          readonly label: string;
          readonly probability: number;
          readonly display?: string;
          /** How the whole path is written, e.g. `6/20`. */
          readonly pathDisplay?: string;
        }[];
      }[];
    }
  | {
      /** A PART-WHOLE BAR: one bar split into proportional parts, with the
       *  whole stated underneath. A ratio is a relationship between parts, so a
       *  learner should be able to COUNT the parts and see the whole they make,
       *  not only read `5 : 2` as two numbers. Internal unit ticks keep the
       *  boxes equal; the part labels say what each side is worth. */
      kind: "bar";
      parts: readonly {
        readonly label: string;
        readonly units: number;
        readonly shade?: boolean;
      }[];
      /** What the whole bar is, e.g. `5 equal parts` or `£84`. */
      readonly totalLabel?: string;
    };

// ── Venn ────────────────────────────────────────────────────────────────────

export const VENN_W = 360;
export const VENN_H = 220;
export const VENN_R = 84;
export const VENN_CY = 108;
const VENN_AX = 132;
const VENN_BX = 228;

export interface VennLayout {
  width: number;
  height: number;
  circles: {
    key: "A" | "B";
    cx: number;
    cy: number;
    r: number;
    label: string;
    labelX: number;
    labelY: number;
  }[];
  regions: {
    key: "onlyA" | "onlyB" | "both" | "neither";
    x: number;
    y: number;
    count: number;
  }[];
  onlyA: number;
  onlyB: number;
  both: number;
  neither: number;
  union: number;
  total: number;
}

const countOf = (value: number): number => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function vennLayout(spec: Extract<LessonFigureSpec, { kind: "venn" }>): VennLayout {
  const onlyA = countOf(spec.onlyA);
  const onlyB = countOf(spec.onlyB);
  const both = countOf(spec.both);
  const neither = countOf(spec.neither);
  const union = onlyA + onlyB + both;
  return {
    width: VENN_W,
    height: VENN_H,
    circles: [
      {
        key: "A", cx: VENN_AX, cy: VENN_CY, r: VENN_R,
        label: spec.labelA, labelX: VENN_AX - 56, labelY: 24,
      },
      {
        key: "B", cx: VENN_BX, cy: VENN_CY, r: VENN_R,
        label: spec.labelB, labelX: VENN_BX + 56, labelY: 24,
      },
    ],
    regions: [
      { key: "onlyA", x: VENN_AX - 48, y: VENN_CY, count: onlyA },
      { key: "onlyB", x: VENN_BX + 48, y: VENN_CY, count: onlyB },
      { key: "both", x: (VENN_AX + VENN_BX) / 2, y: VENN_CY, count: both },
      { key: "neither", x: VENN_W - 34, y: VENN_H - 18, count: neither },
    ],
    onlyA, onlyB, both, neither, union, total: union + neither,
  };
}

// ── tree ────────────────────────────────────────────────────────────────────

export const TREE_W = 440;
export const TREE_H = 270;
const TREE_ROOT_X = 24;
const TREE_FIRST_X = 178;
const TREE_LEAF_X = 332;
const TREE_TOP = 38;
const TREE_BOTTOM = 232;

export interface TreeEdge {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string;
}

export interface TreePath {
  first: string;
  second: string;
  probability: number;
  label: string;
  leafX: number;
  leafY: number;
}

export interface TreeLayout {
  width: number;
  height: number;
  rootX: number;
  rootY: number;
  firstNodes: { x: number; y: number; label: string; probability: number }[];
  edges: TreeEdge[];
  paths: TreePath[];
  totalProbability: number;
}

function probabilityText(probability: number, display?: string): string {
  if (display && display.trim()) return display.trim();
  const percent = probability * 100;
  return `${Math.round(percent * 10) / 10}%`;
}

export function treeLayout(spec: Extract<LessonFigureSpec, { kind: "tree" }>): TreeLayout {
  const totalLeaves = Math.max(1, spec.first.reduce((n, branch) => n + branch.second.length, 0));
  const leafGap = totalLeaves > 1 ? (TREE_BOTTOM - TREE_TOP) / (totalLeaves - 1) : 0;
  const rootY = (TREE_TOP + TREE_BOTTOM) / 2;

  const paths: TreePath[] = [];
  const leavesByFirst: { x: number; y: number }[][] = [];
  let leafIndex = 0;
  for (const branch of spec.first) {
    const leaves: { x: number; y: number }[] = [];
    for (const next of branch.second) {
      const y = totalLeaves === 1 ? rootY : TREE_TOP + leafIndex * leafGap;
      const probability = branch.probability * next.probability;
      paths.push({
        first: branch.label,
        second: next.label,
        probability,
        label: `${next.label} ${probabilityText(probability, next.pathDisplay)}`,
        leafX: TREE_LEAF_X,
        leafY: y,
      });
      leaves.push({ x: TREE_LEAF_X, y });
      leafIndex += 1;
    }
    leavesByFirst.push(leaves);
  }

  const firstNodes = spec.first.map((branch, index) => {
    const leaves = leavesByFirst[index] ?? [];
    const y = leaves.length > 0
      ? (leaves[0].y + leaves[leaves.length - 1].y) / 2
      : totalLeaves === 1 ? rootY : TREE_TOP + (index + 0.5) * ((TREE_BOTTOM - TREE_TOP) / Math.max(1, spec.first.length));
    return {
      x: TREE_FIRST_X,
      y,
      label: `${branch.label} ${probabilityText(branch.probability, branch.display)}`,
      probability: branch.probability,
    };
  });

  const edges: TreeEdge[] = [];
  spec.first.forEach((branch, index) => {
    const first = firstNodes[index];
    edges.push({
      fromX: TREE_ROOT_X, fromY: rootY, toX: first.x, toY: first.y,
      label: probabilityText(branch.probability, branch.display),
    });
    branch.second.forEach((next, secondIndex) => {
      const leaf = leavesByFirst[index]?.[secondIndex];
      if (!leaf) return;
      edges.push({
        fromX: first.x, fromY: first.y, toX: leaf.x, toY: leaf.y,
        label: probabilityText(next.probability, next.display),
      });
    });
  });

  return {
    width: TREE_W,
    height: TREE_H,
    rootX: TREE_ROOT_X,
    rootY,
    firstNodes,
    edges,
    paths,
    totalProbability: paths.reduce((total, path) => total + path.probability, 0),
  };
}

// ── bar ─────────────────────────────────────────────────────────────────────
//
// A part-whole bar is the reusable representation behind ratio, proportion and
// percentage work. The widths are computed from the units, so the drawing can
// never say 3:2 while occupying three boxes and two boxes of a seven-box whole.

export const BAR_W = 420;
export const BAR_H = 118;
const BAR_PAD = 22;
const BAR_TOP = 44;
const BAR_THICKNESS = 38;

export interface BarLayout {
  width: number;
  height: number;
  bar: { x: number; y: number; w: number; h: number };
  total: number;
  parts: {
    label: string;
    units: number;
    shade: boolean;
    x: number;
    width: number;
    labelX: number;
  }[];
  /** Internal boundaries between equal units, including part boundaries. */
  ticks: number[];
  totalLabel: string;
}

export function barLayout(spec: Extract<LessonFigureSpec, { kind: "bar" }>): BarLayout {
  const parts = spec.parts
    .map((part) => ({
      label: part.label,
      units: Math.max(0, Math.round(Number(part.units))),
      shade: part.shade === true,
    }))
    .filter((part) => part.units > 0);
  const total = parts.reduce((sum, part) => sum + part.units, 0);
  const width = BAR_W - BAR_PAD * 2;
  const bar = { x: BAR_PAD, y: BAR_TOP, w: width, h: BAR_THICKNESS };
  let cursor = 0;
  const placed = total === 0
    ? []
    : parts.map((part) => {
        const x = BAR_PAD + (cursor / total) * width;
        const partWidth = (part.units / total) * width;
        cursor += part.units;
        return { ...part, x, width: partWidth, labelX: x + partWidth / 2 };
      });
  const ticks = total <= 1
    ? []
    : Array.from({ length: total - 1 }, (_, index) => BAR_PAD + ((index + 1) / total) * width);
  return {
    width: BAR_W,
    height: BAR_H,
    bar,
    total,
    parts: placed,
    ticks,
    totalLabel: spec.totalLabel?.trim() || `${total} equal parts`,
  };
}
