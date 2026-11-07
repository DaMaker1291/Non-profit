// ─────────────────────────────────────────────────────────────────────────────
// FIGURE GEOMETRY, COMPUTED ONCE, IN ONE PLACE.
//
// `components/question-figure.tsx` draws a FigureSpec. It used to compute every
// coordinate inside its own JSX, which meant the one thing a diagram must get
// right — that the picture agrees with the numbers — could only be checked by
// looking at it. A figure that says "5 − (−3) jumps right" and draws the arrow
// left is a diagram that actively teaches the wrong thing, and no assertion over
// a React tree would see it.
//
// So the arithmetic lives here, as pure functions of the spec, and the renderer
// is a mapping from these numbers to SVG elements. The suite drives them
// directly: a tick order, a pan that must be level, a cell whose width must be
// proportional to the term it stands for.
//
// THE THREE NEW KINDS ARE HERE FOR A REASON, NOT FOR COVERAGE.
//
//   number-line — the pilot cluster's first concept is `negatives`, and the
//                 fact a learner gets wrong (subtracting a negative moves
//                 RIGHT) is a fact about a line. The picture makes the direction
//                 visible before the rule is stated.
//   balance     — `linear-equations` is taught as a balance beam in its own
//                 plan; without a picture "whatever you do to one side" is a
//                 sentence to memorise. Both pans carry their bags and weights
//                 so the learner can COUNT the difference the equation states.
//   rectangle   — `algebra-expressions` teaches 3(x + 4); the area model is what
//                 makes "the 4 is multiplied too" visible rather than asserted.
//
// Values are computed from the spec, never hardcoded, so a figure cannot go
// stale beside the numbers it was written for.
// ─────────────────────────────────────────────────────────────────────────────
import type { FigureSpec } from "./types";

export const FIGURE_KINDS = [
  "axes",
  "pie",
  "right-triangle",
  "number-line",
  "balance",
  "rectangle",
  "surd-square",
  "particles",
  "circuit",
  "cell",
  "atom",
  "energy-profile",
  "chem",
] as const;

export type FigureKind = (typeof FIGURE_KINDS)[number];

export type NumberLineSpec = Extract<FigureSpec, { kind: "number-line" }>;
export type BalanceSpec = Extract<FigureSpec, { kind: "balance" }>;
export type RectangleSpec = Extract<FigureSpec, { kind: "rectangle" }>;
export type SurdSquareSpec = Extract<FigureSpec, { kind: "surd-square" }>;

// ── number line ─────────────────────────────────────────────────────────────

export const NL_W = 380;
export const NL_H = 132;
export const NL_PAD = 28;

export interface NumberLineLayout {
  width: number;
  height: number;
  /** The line itself, at a fixed height above the tick labels. */
  baselineY: number;
  ticks: { value: number; x: number }[];
  fromX: number;
  toX: number;
  /** WHICH WAY THE JOURNEY TRAVELS — the fact the picture exists to show. */
  direction: "right" | "left" | "none";
  /** How far the arrowhead points, in pixels (0 for a journey of no length). */
  span: number;
}

export function numberLineLayout(spec: NumberLineSpec): NumberLineLayout {
  const min = Math.min(spec.min, spec.max);
  const max = Math.max(spec.min, spec.max);
  const span = max - min;
  const x = (v: number) => (span === 0 ? NL_W / 2 : NL_PAD + ((v - min) / span) * (NL_W - NL_PAD * 2));
  // A tick on every integer where the range allows, otherwise every whole step
  // that still leaves room for its own label. The tick values are what the
  // learner reads the jump against, so they cannot be decorative.
  const step = span <= 20 ? 1 : Math.max(1, Math.ceil(span / 16));
  const ticks: { value: number; x: number }[] = [];
  for (let v = Math.ceil(min); v <= Math.floor(max); v += step) {
    ticks.push({ value: v, x: x(v) });
  }
  const direction = spec.to > spec.from ? "right" : spec.to < spec.from ? "left" : "none";
  return {
    width: NL_W,
    height: NL_H,
    baselineY: 62,
    ticks,
    fromX: x(spec.from),
    toX: x(spec.to),
    direction,
    span: Math.abs(x(spec.to) - x(spec.from)),
  };
}

// ── balance ─────────────────────────────────────────────────────────────────

export const BAL_W = 340;
export const BAL_H = 206;
const BAL_BEAM_Y = 54;
const BAL_PAN_Y = 96;
const BAL_ARM = 96;

/* THE VESSEL'S OWN MEASUREMENTS, in one place.
 *
 * The pan used to be a fixed 96 × 20 trapezoid with the contents placed by
 * arithmetic that did not know about it: the bags row sat ABOVE the rim
 * (`BAL_PAN_Y - bagH - 4`) and the weight rows marched DOWN past a floor that
 * was twenty pixels under the lip. A screenshot of 3x + 5 = 20 showed three
 * bags floating over a pan and sixteen of the twenty weights below it — a
 * picture of an equation the lesson does not state. The layout now measures its
 * contents FIRST, sizes the vessel to them, and lays them out from the FLOOR up,
 * so "the weights are in the pan" is true at every count rather than at zero. */
const PAN_PAD = 12;        // clearance between the contents and the rim
const PAN_FLOOR_INSET = 6; // the vessel narrows slightly at the floor
const PAN_MIN_W = 104;
const PAN_MIN_DEPTH = 48;
const BAG_W = 18;
const BAG_H = 26;
const BAG_GAP_ABOVE_UNITS = 8;
const UNIT_R = 7;
const UNIT_GAP = 4;
const UNIT_PITCH = UNIT_R * 2 + UNIT_GAP; // one weight plus its gap
const UNITS_PER_ROW = 5;
const ROW_PITCH = UNIT_R * 2 + 3;

export interface BalanceLayout {
  width: number;
  height: number;
  beam: { x1: number; x2: number; y: number };
  fulcrum: { x: number; y: number; baseY: number };
  pans: {
    side: "left" | "right";
    /** The pan's own top edge, and the centre its contents hang from. */
    topY: number;
    centreX: number;
    width: number;
    /** How far the vessel extends below its lip, and where its floor is. Both
     *  renderers draw the pan from these, so they cannot disagree about the
     *  shape the contents are claimed to sit in. */
    depth: number;
    bottomY: number;
    bags: { x: number; y: number }[];
    units: { x: number; y: number }[];
    /** WHAT THIS PAN HOLDS, in symbols: `3x + 5`. Derived from the counts, so
     *  the label and the shapes cannot disagree. */
    label: string;
    /** The baseline the label is set on — below the pan and below its lowest
     *  weight, so a full pan never has a number written through it. */
    labelY: number;
  }[];
  /** What each pan holds — the equation, as counts rather than as symbols. */
  left: { bags: number; units: number };
  right: { bags: number; units: number };
  /** Bags on one side against bags on the other: the move the plan teaches
   *  (take the same away from both) is only visible when this is not zero. */
  bagDifference: number;
  unitDifference: number;
}

/**
 * WHAT A PAN HOLDS, WRITTEN AS THE EQUATION DOES.
 *
 * Three bags and five weights is `3x + 5`; no bags is just `20`. A coefficient of
 * 1 is not written ("1x" is a notation nobody uses), and a pan holding nothing
 * says `0` rather than an empty string — an empty label on a pan reads as a
 * drawing error, not as zero.
 *
 * Pure and exported because the renderer must not compute it: a label assembled
 * inside JSX is a label no test can compare against the counts it sits under.
 */
export function panLabel(pan: { bags: number; units: number }, variable = "x"): string {
  const bags = Math.max(0, Math.floor(pan.bags));
  const units = Math.max(0, Math.floor(pan.units));
  const bag = bags === 0 ? "" : bags === 1 ? variable : `${bags}${variable}`;
  if (bag === "") return `${units}`;
  return units === 0 ? bag : `${bag} + ${units}`;
}

export function balanceLayout(spec: BalanceSpec): BalanceLayout {
  const cx = BAL_W / 2;
  const variable = spec.variable && spec.variable.trim() ? spec.variable.trim() : "x";

  // 1 · MEASURE EACH SIDE. How many rows of weights, how wide the widest row is,
  // and how tall the contents are — all before a single coordinate is chosen.
  const measure = (bags: number, units: number) => {
    const b = Math.max(0, Math.floor(bags));
    const u = Math.max(0, Math.floor(units));
    const rows = Math.ceil(u / UNITS_PER_ROW);
    const widest = Math.max(
      b > 0 ? (b - 1) * UNIT_PITCH + BAG_W : 0,
      rows > 0 ? (Math.min(u, UNITS_PER_ROW) - 1) * UNIT_PITCH + UNIT_R * 2 : 0,
    );
    const contentH = (b > 0 ? BAG_H + (rows > 0 ? BAG_GAP_ABOVE_UNITS : 0) : 0) + rows * ROW_PITCH;
    return { b, u, rows, width: Math.max(PAN_MIN_W, widest + PAN_PAD * 2), contentH };
  };
  const shapeL = measure(spec.left.bags, spec.left.units);
  const shapeR = measure(spec.right.bags, spec.right.units);
  // ONE VESSEL SIZE FOR BOTH PANS, and one depth: a balance whose pans are
  // different sizes reads as two different containers, which is noise in a
  // picture whose job is "the same operation on both sides".
  const panW = Math.max(shapeL.width, shapeR.width);
  const depth = Math.max(PAN_MIN_DEPTH, PAN_PAD * 2 + Math.max(shapeL.contentH, shapeR.contentH));
  const bottomY = BAL_PAN_Y + depth;

  const pan = (side: "left" | "right", shape: ReturnType<typeof measure>) => {
    const { b, u, rows } = shape;
    const centreX = side === "left" ? cx - BAL_ARM : cx + BAL_ARM;
    // 2 · LAY THE CONTENTS OUT FROM THE FLOOR UP, so they rest IN the vessel at
    // every count. The weight block is bottom-aligned; the bags stand on top of
    // it, and an empty pan simply has nothing to place.
    const floorY = bottomY - PAN_PAD;
    const unitRow = Array.from({ length: u }, (_, i) => {
      const row = Math.floor(i / UNITS_PER_ROW);
      const inRow = Math.min(UNITS_PER_ROW, u - row * UNITS_PER_ROW);
      const idx = i % UNITS_PER_ROW;
      return {
        x: centreX - ((inRow - 1) * UNIT_PITCH) / 2 + idx * UNIT_PITCH,
        y: floorY - UNIT_R - (rows - 1 - row) * ROW_PITCH,
      };
    });
    const bagBlockTop = floorY - rows * ROW_PITCH;
    // BAGS ARE CENTRED BY THEIR OWN BOX, not by a shared corner: `x` is a rect's
    // LEFT edge, so spacing the left edges evenly shifted the whole row half a
    // bag to the right of the pan's centre (measured in the screenshot: three
    // bags sat over the right half of the weights). Centres are spaced, then the
    // width is subtracted back off.
    const bagRow = Array.from({ length: b }, (_, i) => ({
      x: centreX + (i - (b - 1) / 2) * UNIT_PITCH - BAG_W / 2,
      y: bagBlockTop - BAG_H - (rows > 0 ? BAG_GAP_ABOVE_UNITS : 0),
    }));
    // 3 · THE LABEL GOES UNDER THE VESSEL, never inside it: it is a caption for
    // the contents, and writing it through the bottom row of weights is the
    // defect the current layout used to have.
    const labelY = bottomY + 18;
    return {
      side,
      topY: BAL_PAN_Y,
      centreX,
      width: panW,
      depth,
      bottomY,
      bags: bagRow,
      units: unitRow,
      label: panLabel({ bags: b, units: u }, variable),
      labelY,
    };
  };

  const pans = [pan("left", shapeL), pan("right", shapeR)];
  // A pan deep enough to need more rows pushes the labels down, and the picture
  // grows with them rather than clipping the sentence it exists to show.
  const height = Math.max(BAL_H, ...pans.map((p) => p.labelY + 12));

  return {
    width: BAL_W,
    height,
    beam: { x1: cx - BAL_ARM, x2: cx + BAL_ARM, y: BAL_BEAM_Y },
    fulcrum: { x: cx, y: BAL_BEAM_Y, baseY: height - 18 },
    pans,
    left: { bags: spec.left.bags, units: spec.left.units },
    right: { bags: spec.right.bags, units: spec.right.units },
    bagDifference: spec.left.bags - spec.right.bags,
    unitDifference: spec.left.units - spec.right.units,
  };
}

// ── pie ─────────────────────────────────────────────────────────────────────
//
// ONE CIRCLE, ONE SHADED SECTOR — and, when the spec asks, the equal cuts that
// make the same shading readable as a different count of pieces.
//
// The geometry is here rather than in the two renderers because there ARE two
// (the React component and the offline twin) and each used to compute its own
// arc: the sector path, the start angle at 12 o'clock, the large-arc flag, all
// written twice in two languages. Two copies of one arc is one copy too many
// when the claim the drawing makes is "this shaded part IS that fraction": a
// rounded degree in one renderer and not the other is a picture that disagrees
// with the caption beside it on every device but the author's.
//
// `slices` is the part a learner can read. 240° shaded is "a lot"; 240° shaded
// with the circle cut into six equal pieces is FOUR of them, which is the fact
// `fraction-ops` needs before it can add 5/6.

export const PIE_SIDE = 240;
export const PIE_R = 82;

export type PieSpec = Extract<FigureSpec, { kind: "pie" }>;

export interface PieLayout {
  width: number;
  height: number;
  cx: number;
  cy: number;
  radius: number;
  /** The marked sector, clamped to the circle: 0 draws nothing, 360 fills it. */
  degrees: number;
  /** The sector's bounding angles, in degrees measured clockwise from 12
   *  o'clock, so a renderer never re-derives the convention that the arc starts
   *  at the top. */
  start: number;
  end: number;
  /** The sector's arc endpoints, in pixels. */
  arcFrom: [number, number];
  arcTo: [number, number];
  /** SVG's large-arc flag for this sector — arithmetic, not a judgement call. */
  largeArc: boolean;
  /** The circle is entirely shaded: there is no sector edge to draw. */
  full: boolean;
  /** Angles of the equal cuts across the WHOLE circle, degrees from 12 o'clock.
   *  Empty when the spec does not ask for slices, and when the count cannot make
   *  equal pieces (fewer than 2, more than 24, or not a whole number). */
  divisions: number[];
  /** How many equal pieces each division is worth, for a caller that labels one. */
  sliceDegrees: number;
  /** WHAT IS WRITTEN UNDER THE CHART. The labelled fraction when the spec names
   *  one, with the angle appended only where the caller asked for it. */
  labelText: string;
}

export function pieLayout(spec: PieSpec): PieLayout {
  const cx = PIE_SIDE / 2;
  const cy = PIE_SIDE / 2;
  const degrees = Math.max(0, Math.min(360, Number(spec.sectorDegrees) || 0));
  const start = 0; // 12 o'clock; the arc sweeps clockwise from it
  const end = degrees;
  const at = (deg: number): [number, number] => {
    const a = -Math.PI / 2 + (deg * Math.PI) / 180;
    return [cx + PIE_R * Math.cos(a), cy + PIE_R * Math.sin(a)];
  };
  // Equal cuts: the count has to DIVIDE the circle to give equal pieces, so a
  // fractional or absurd count draws none rather than a ragged last slice.
  const n = spec.slices == null ? 0 : Math.round(Number(spec.slices));
  const exact = n >= 2 && n <= 24 && Number.isFinite(n) && Math.abs(n - Number(spec.slices)) < 1e-9;
  const sliceDegrees = exact ? 360 / n : 0;
  const divisions = exact ? Array.from({ length: n }, (_, i) => i * sliceDegrees) : [];
  const showDegrees = spec.showDegrees !== false;
  const labelText =
    degrees <= 0
      ? ""
      : spec.label && degrees < 360
        ? showDegrees
          ? `${spec.label} · ${degrees}°`
          : spec.label
        : showDegrees
          ? `${degrees}°`
          : "";
  return {
    width: PIE_SIDE,
    height: PIE_SIDE,
    cx,
    cy,
    radius: PIE_R,
    degrees,
    start,
    end,
    arcFrom: at(start),
    arcTo: at(end),
    largeArc: degrees > 180,
    full: degrees >= 360,
    divisions,
    sliceDegrees,
    labelText,
  };
}

// ── what a drawing SAYS, in words ──────────────────────────────
//
// A question's SVG is `aria-hidden`, and the reason given for that was "the stem
// says everything the picture says". MEASURED, THAT WAS NOT TRUE: `scatter-
// correlation` plots the data itself, so its points appear nowhere in the stem,
// and a screen-reader learner was being asked about a scatter plot they could
// not read. The fix is not to un-hide the SVG (a screen reader reads a grid of
// unlabelled shapes as noise) but to say what it shows, once, in the reader's
// own language.
//
// The words are built HERE, from the same spec the drawing is built from, so a
// caption cannot describe a different chart from the one on screen: the numbers
// in it are the numbers in `spec`, not a sentence an author typed beside it.
//
// IT ANSWERS NULL FOR A KIND WITH NO TEMPLATE, deliberately. A caption invented
// for an untaught kind would be prose nobody reviewed; a null makes the suite
// fail instead (every question figure must have one), which is how the next
// family an author writes gets told it needs words rather than shipping silent.

export interface FigureCaption {
  /** The dictionary key holding the sentence, with `{placeholders}`. */
  key: string;
  values: Record<string, string>;
}

export function figureCaption(spec: FigureSpec): FigureCaption | null {
  if (spec.kind === "axes") {
    // EVERY plotted point, because for a scatter plot the points ARE the data.
    // A blank grid would be a caption of the frame rather than of the chart.
    const points = (spec.points ?? []).map((p) => `(${p.at[0]}, ${p.at[1]})`);
    return { key: "fig.cap.axes", values: { points: points.join(", ") || "—" } };
  }
  if (spec.kind === "right-triangle") {
    const unit = spec.unit ?? "";
    return { key: "fig.cap.triangle", values: { a: String(spec.legA), b: String(spec.legB), unit } };
  }
  return null;
}

// ── rectangle (area model) ──────────────────────────────────────────────────

export const RECT_W = 340;
const RECT_MAX_H = 200;
const RECT_MARGIN = 34;

export interface RectangleLayout {
  width: number;
  height: number;
  /** One cell per (column band × row band), each labelled with its term. The
   *  `emphasis` flag is resolved HERE from the spec's labels, so the renderer
   *  never has to decide what a highlighted cell is. */
  cells: { x: number; y: number; w: number; h: number; label: string; emphasis: boolean }[];
  /** Column boundaries, left to right, in pixels. */
  colX: number[];
  /** Row boundaries, top to bottom, in pixels. */
  rowY: number[];
  widthUnits: number;
  heightUnits: number;
}

/** WHAT ONE CELL OF AN AREA MODEL STANDS FOR.
 *
 *  The cells are the teaching, not decoration: 3 rows of an x-band and a 4-band
 *  is `3x` beside `12`, and seeing `12` is what makes "the 4 is multiplied too"
 *  a fact rather than an assertion. So the label is the PRODUCT of the two band
 *  labels, and it is computed rather than authored — a spec cannot pair a 3 with
 *  a 4 and print 34.
 *
 *  A coefficient of 1 is dropped (`1x` is `x`), which is the convention every
 *  textbook uses and the one a learner will be expected to write. */
/** A band label read as coefficient × symbol^power, so two labels can be
 *  MULTIPLIED rather than glued together. `2x` is 2·x¹, `x²` is 1·x², `3` is 3
 *  with no symbol. Anything this cannot read answers null and the caller falls
 *  back to concatenation: an author's unusual label must never silently become a
 *  wrong product, which is the whole reason this function exists. */
function readTerm(t: string): { coef: number; sym: string; pow: number } | null {
  const s = t.trim().replace(/\s+/g, "");
  if (s === "") return null;
  const m = s.match(/^(\d*)([A-Za-z]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+|\^\d+)?$/);
  if (!m) return null;
  const [, coefRaw, symRaw, powRaw] = m;
  if (coefRaw === "" && symRaw === "" && !powRaw) return null;
  let pow = 1;
  if (powRaw) {
    const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    pow = powRaw.startsWith("^")
      ? Number(powRaw.slice(1))
      : [...powRaw].reduce((acc, ch) => acc * 10 + SUP.indexOf(ch), 0);
    if (!Number.isFinite(pow)) return null;
  }
  return { coef: coefRaw === "" ? 1 : Number(coefRaw), sym: symRaw, pow: symRaw === "" ? 0 : pow };
}

/** The superscript form of a power, for a label a learner reads as maths. */
const SUP_DIGITS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
function superscript(n: number): string {
  return n <= 9 ? SUP_DIGITS[n] : `^${n}`;
}

function writeTerm(coef: number, sym: string, pow: number): string {
  if (sym === "") return String(coef);
  const head = coef === 1 ? "" : String(coef);
  return pow === 1 ? `${head}${sym}` : `${head}${sym}${superscript(pow)}`;
}

export function areaTerm(row: string, col: string): string {
  const r = row.trim();
  const c = col.trim();
  const a = readTerm(r);
  const b = readTerm(c);
  // A label this cannot read is left exactly as it was written, joined — the old
  // behaviour, kept for the one case where guessing would be worse.
  if (!a || !b) return `${r}${c}`;
  if (a.sym === "" || b.sym === "") {
    // One side is a pure number: it scales the other, and a pure number times a
    // pure number is the plain product (the 3 × 4 corner that must read 12).
    return writeTerm(a.coef * b.coef, a.sym || b.sym, a.sym ? a.pow : b.pow);
  }
  if (a.sym !== b.sym) return `${r}${c}`;
  // Both sides carry the SAME letter, which is what an expansion grid needs:
  // x × x is x², not "xx". The coefficients multiply and the powers add, which
  // is the index law the very next concept teaches.
  return writeTerm(a.coef * b.coef, a.sym, a.pow + b.pow);
}

export function rectangleLayout(spec: RectangleSpec): RectangleLayout {
  const widthUnits = spec.widthParts.reduce((s, p) => s + Math.max(0, p.units), 0) || 1;
  const heightUnits = spec.heightParts.reduce((s, p) => s + Math.max(0, p.units), 0) || 1;
  // The rectangle keeps its parts' own PROPORTIONS, and the frame keeps the
  // whole shape's: a 3 × 5 model drawn square would teach the wrong area.
  const boxW = RECT_W - RECT_MARGIN * 2;
  let boxH = (boxW * heightUnits) / widthUnits;
  let width = RECT_W;
  if (boxH > RECT_MAX_H) {
    boxH = RECT_MAX_H;
    width = Math.min(RECT_W, (boxH * widthUnits) / heightUnits + RECT_MARGIN * 2);
  }
  const drawW = width - RECT_MARGIN * 2;
  const x0 = RECT_MARGIN;
  const y0 = RECT_MARGIN / 2;

  const colX = [x0];
  for (const p of spec.widthParts) colX.push(colX[colX.length - 1] + (drawW * Math.max(0, p.units)) / widthUnits);
  const rowY = [y0];
  for (const p of spec.heightParts) rowY.push(rowY[rowY.length - 1] + (boxH * Math.max(0, p.units)) / heightUnits);

  const marked = new Set(spec.emphasis ?? []);
  const cells: RectangleLayout["cells"] = [];
  spec.heightParts.forEach((hp, r) => {
    spec.widthParts.forEach((wp, c) => {
      const label = areaTerm(hp.label, wp.label);
      cells.push({
        x: colX[c],
        y: rowY[r],
        w: colX[c + 1] - colX[c],
        h: rowY[r + 1] - rowY[r],
        label,
        emphasis: marked.has(label),
      });
    });
  });

  return { width, height: boxH + RECT_MARGIN, cells, colX, rowY, widthUnits, heightUnits };
}

// ── a square cut into equal squares (a surd simplification) ─────────────────
//
// √50 = 5√2 is a rule learners memorise and cannot see. Drawn, it is a tiling: a
// square of area 50 is 25 squares of area 2 laid 5 by 5, so one edge is five of
// them — five √2s — long. The figure states the AREA and the NUMBER of parts and
// computes the rest, so it cannot label an edge with a value the tiling does not
// have.

export const SURD_SIDE = 300;
const SURD_PAD = 36;

export interface SurdSquareLayout {
  width: number;
  height: number;
  /** Squares along one edge. */
  n: number;
  /** Whether `parts` really tiles the square. A spec that does not ({50, 49})
   *  is REFUSED: the renderer draws nothing, because a ragged last row would
   *  show a division that does not exist. */
  exact: boolean;
  total: number;
  /** The area of one small square — 2 in the √50 case, which is the number under
   *  the simplified root. */
  cellArea: number;
  cells: { x: number; y: number; w: number; h: number }[];
  /** The edge, in surd form (`5√2`) — the thing the picture exists to show. */
  sideLabel: string;
  /** The small square's AREA, which is what the tiling counts. */
  cellLabel: string;
}

export function surdSquareLayout(spec: SurdSquareSpec): SurdSquareLayout {
  const n = Math.round(Math.sqrt(Math.max(0, spec.parts)));
  const exact = n > 0 && n * n === spec.parts && spec.total > 0;
  const cellArea = exact ? spec.total / spec.parts : NaN;
  const box = SURD_SIDE - SURD_PAD * 2;
  const cellPx = exact ? box / n : 0;
  const cells = exact
    ? Array.from({ length: n * n }, (_, i) => ({
        x: SURD_PAD + (i % n) * cellPx,
        y: SURD_PAD + Math.floor(i / n) * cellPx,
        w: cellPx,
        h: cellPx,
      }))
    : [];
  const num = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(3))));
  const sideLabel = !exact ? "" : cellArea === 1 ? num(n) : n === 1 ? `√${num(spec.total)}` : `${num(n)}√${num(cellArea)}`;
  return {
    width: SURD_SIDE,
    height: SURD_SIDE,
    n,
    exact,
    total: spec.total,
    cellArea,
    cells,
    sideLabel,
    cellLabel: exact ? num(cellArea) : "",
  };
}

// ── a parabola, from its coefficients ───────────────────────────────────────
//
// THE SHAPE IS THE TEACHING. A factored expression on the page says "the roots
// are 2 and 3"; the curve says WHY (it crosses there), what the turning point
// has to do with them (it sits halfway), and what a negative discriminant means
// (the curve never arrives) — none of which a learner can see in (x − 2)(x − 3).
//
// So the points are computed from a, b and c rather than authored, and the
// SUITE drives the arithmetic: a drawing that crossed anywhere but at its own
// roots would be a picture contradicting the paragraph beside it.

export interface ParabolaSpec {
  a: number; b: number; c: number;
  xMin: number; xMax: number; yMin: number; yMax: number;
  /** How finely the curve is sampled across the frame. The default is one point
   *  per ~1.5 px of a 340-px frame, which is smoother than the eye resolves. */
  samples?: number;
}

export interface ParabolaLayout {
  /** Consecutive runs of plotted points, in the spec's own DATA units.
   *
   *  A curve that leaves the frame is BROKEN, not clamped: pinning its points to
   *  yMax would draw a flat section and claim the function stops rising there.
   *  More than one run therefore means "the curve was outside and came back" —
   *  which is what a parabola does when the frame is narrow and it is steep. */
  runs: [number, number][][];
  /** The x-values where it crosses zero, ascending. Empty when it never does,
   *  and ONE value when it only touches — an invented second root would be the
   *  "repeated root" mistake drawn as fact. */
  roots: number[];
  vertex: { x: number; y: number };
  opens: "up" | "down";
  discriminant: number;
}

export function parabolaLayout(spec: ParabolaSpec): ParabolaLayout {
  const { a, b, c, xMin, xMax, yMin, yMax } = spec;
  const f = (x: number) => a * x * x + b * x + c;
  const n = Math.max(2, Math.min(2000, Math.round(spec.samples ?? 240)));
  const eps = 1e-9;

  const runs: [number, number][][] = [];
  let run: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = xMin + ((xMax - xMin) * i) / n;
    const y = f(x);
    if (y >= yMin - eps && y <= yMax + eps) {
      run.push([x, Math.min(yMax, Math.max(yMin, y))]);
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);

  const flat = Math.abs(a) < 1e-12; // not a parabola: a line, or a constant
  const discriminant = b * b - 4 * a * c;
  let roots: number[];
  if (flat) {
    roots = Math.abs(b) < 1e-12 ? [] : [Number((-c / b).toFixed(12))];
  } else if (Math.abs(discriminant) <= eps) {
    roots = [Number((-b / (2 * a)).toFixed(12))];
  } else if (discriminant < 0) {
    roots = [];
  } else {
    const s = Math.sqrt(discriminant);
    roots = [Number(((-b - s) / (2 * a)).toFixed(12)), Number(((-b + s) / (2 * a)).toFixed(12))].sort((p, q) => p - q);
  }
  const vx = flat ? 0 : -b / (2 * a);

  return {
    // One point draws nothing, so a "run" of one is not a curve — dropping it
    // keeps the renderer from emitting a degenerate polyline.
    runs: runs.filter((r) => r.length >= 2),
    roots,
    vertex: { x: vx, y: f(vx) },
    opens: a >= 0 ? "up" : "down",
    discriminant,
  };
}

// ── a rise/run triangle ─────────────────────────────────────────────────────
//
// `m = rise ÷ run` is a sentence until the two legs are drawn on the line: the
// horizontal leg shows the run, the vertical leg the rise, and the division is
// the thing the learner does with them. The legs are labelled with their own
// LENGTHS (the sign is carried by the direction the leg travels, which the
// drawing shows and a label cannot).

export interface GradientLayout {
  from: [number, number];
  to: [number, number];
  /** The right angle: across from the start, level with the end. */
  corner: [number, number];
  run: number;
  rise: number;
  runLabel: string;
  riseLabel: string;
}

export function gradientLayout(g: { from: [number, number]; to: [number, number] }): GradientLayout {
  const run = g.to[0] - g.from[0];
  const rise = g.to[1] - g.from[1];
  const num = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(3))));
  return {
    from: g.from,
    to: g.to,
    corner: [g.to[0], g.from[1]],
    run,
    rise,
    runLabel: `run ${num(Math.abs(run))}`,
    riseLabel: `rise ${num(Math.abs(rise))}`,
  };
}

// ── a chemical equation as particles ────────────────────────────────────────
//
// The coefficient is the thing learners misread. 2H₂ + O₂ → 2H₂O has four
// hydrogen atoms and two oxygen atoms on each side, but a learner who counts
// the FORMULAS sees "two plus one becomes two". Drawing every molecule makes the
// rearrangement visible, and the layout returns the atom counts it drew so a
// caption or a test never has to count them again by eye.

export const PART_W = 380;
export const PART_H = 220;
export const PART_PAD = 24;

interface PlacedAtom { x: number; y: number; label: string }
export interface PlacedMolecule {
  x: number;
  y: number;
  atoms: PlacedAtom[];
  bonds: [number, number][];
}
export interface ParticlesLayout {
  width: number;
  height: number;
  left: PlacedMolecule[];
  right: PlacedMolecule[];
  arrow: { x1: number; x2: number; y: number };
  leftAtoms: Record<string, number>;
  rightAtoms: Record<string, number>;
  /** True only when the drawn atoms are the same on both sides. Unbalanced is a
   *  legitimate teaching state (a learner is asked to balance it), so the layout
   *  reports the fact rather than refusing to draw. */
  balanced: boolean;
}

/** Where the atoms of ONE molecule sit, relative to its centre. The first atom
 *  is the centre for a three- or four-atom molecule, which is why H₂O is
 *  authored as ["O", "H", "H"]. */
function atomOffsets(atoms: string[]): { label: string; dx: number; dy: number; bonds: [number, number][] }[] {
  const labels = atoms.slice(0, 4);
  if (labels.length <= 1) return [{ label: labels[0] ?? "?", dx: 0, dy: 0, bonds: [] }];
  if (labels.length === 2) {
    return labels.map((label, i) => ({ label, dx: i === 0 ? -10 : 10, dy: 0, bonds: [[0, 1] as [number, number]] }));
  }
  if (labels.length === 3) {
    const spots = [{ dx: 0, dy: 0 }, { dx: -13, dy: -8 }, { dx: 13, dy: -8 }];
    return labels.map((label, i) => ({ label, ...spots[i], bonds: [[0, 1], [0, 2]] as [number, number][] }));
  }
  const spots = [{ dx: -10, dy: -10 }, { dx: 10, dy: -10 }, { dx: -10, dy: 10 }, { dx: 10, dy: 10 }];
  return labels.map((label, i) => ({
    label,
    ...spots[i],
    bonds: [[0, 1], [1, 3], [3, 2], [2, 0]] as [number, number][],
  }));
}

function expandMolecules(molecules: { atoms: string[]; count: number }[]): { atoms: string[] }[] {
  const out: { atoms: string[] }[] = [];
  for (const molecule of molecules) {
    const copies = Math.max(0, Math.round(Number(molecule.count) || 0));
    for (let i = 0; i < copies; i++) out.push({ atoms: molecule.atoms });
  }
  return out;
}

function atomCounts(molecules: { atoms: string[]; count: number }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const molecule of molecules) {
    const copies = Math.max(0, Math.round(Number(molecule.count) || 0));
    for (const atom of molecule.atoms) counts[atom] = (counts[atom] ?? 0) + copies;
  }
  return counts;
}

function sameCounts(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => (a[key] ?? 0) === (b[key] ?? 0));
}

function placeGroup(
  molecules: { atoms: string[]; count: number }[],
  x0: number,
  width: number,
): PlacedMolecule[] {
  const list = expandMolecules(molecules);
  if (!list.length) return [];
  const cols = list.length <= 3 ? list.length : 2;
  const rows = Math.ceil(list.length / cols);
  const cellW = width / cols;
  const cellH = 70;
  const top = PART_H / 2 - (rows * cellH) / 2 + 8;
  return list.map((molecule, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x0 + (col + 0.5) * cellW;
    const cy = top + row * cellH + cellH / 2;
    const offsets = atomOffsets(molecule.atoms);
    return {
      x: cx,
      y: cy,
      atoms: offsets.map((a) => ({ label: a.label, x: cx + a.dx, y: cy + a.dy })),
      // One bond list is enough: every atom in a molecule shares the same list.
      bonds: offsets[0]?.bonds ?? [],
    };
  });
}

export function particlesLayout(spec: Extract<FigureSpec, { kind: "particles" }>): ParticlesLayout {
  const groupW = 150;
  const left = placeGroup(spec.left, PART_PAD, groupW);
  const right = placeGroup(spec.right, PART_W - PART_PAD - groupW, groupW);
  const leftAtoms = atomCounts(spec.left);
  const rightAtoms = atomCounts(spec.right);
  return {
    width: PART_W,
    height: PART_H,
    left,
    right,
    arrow: { x1: PART_PAD + groupW + 4, x2: PART_W - PART_PAD - groupW - 4, y: PART_H / 2 },
    leftAtoms,
    rightAtoms,
    balanced: Object.keys(leftAtoms).length > 0 && sameCounts(leftAtoms, rightAtoms),
  };
}

// ── a circuit ───────────────────────────────────────────────────────────────
//
// A schematic, not a picture of a bench. The one thing it must get right is the
// CONNECTION: the ammeter is in the same path as the resistor, and the voltmeter
// is across it. The wire segments and the meter positions come from one layout,
// so a renderer cannot draw a voltmeter in series by accident.

export const CIRC_W = 360;
export const CIRC_H = 220;

export interface CircuitLayout {
  width: number;
  height: number;
  wires: { points: [number, number][]; dashed?: boolean }[];
  battery: { x: number; y: number };
  resistor: { x1: number; x2: number; y: number };
  ammeter: { x: number; y: number; r: number };
  voltmeter: { x: number; y: number; r: number } | null;
}

export function circuitLayout(spec: Extract<FigureSpec, { kind: "circuit" }>): CircuitLayout {
  const left = 40;
  const right = 320;
  const top = 50;
  const bottom = 170;
  const mid = (top + bottom) / 2;
  const resistor = { x1: 140, x2: 220, y: top };
  const showVoltmeter = spec.showVoltmeter !== false;
  const wires: { points: [number, number][]; dashed?: boolean }[] = [
    { points: [[left, top], [resistor.x1, top]] },
    { points: [[resistor.x2, top], [right, top]] },
    { points: [[right, top], [right, bottom]] },
    { points: [[right, bottom], [left, bottom]] },
    { points: [[left, bottom], [left, mid + 20]] },
    { points: [[left, mid - 20], [left, top]] },
  ];
  if (showVoltmeter) {
    wires.push(
      { points: [[resistor.x1, top], [resistor.x1, 145], [162, 145]], dashed: true },
      { points: [[resistor.x2, top], [resistor.x2, 145], [198, 145]], dashed: true },
    );
  }
  return {
    width: CIRC_W,
    height: CIRC_H,
    wires,
    battery: { x: left, y: mid },
    resistor,
    ammeter: { x: right, y: mid, r: 18 },
    voltmeter: showVoltmeter ? { x: 180, y: 145, r: 18 } : null,
  };
}

// ── a cell ──────────────────────────────────────────────────────────────────
//
// Numbered organelles, not English labels. The caption is the teaching and is
// translatable; the drawing stays language-neutral. The numbers are part of the
// layout so a caption and a picture cannot disagree about which part is 4.

export const CELL_W = 360;
export const CELL_H = 270;

export type CellShapeKind =
  | "wall"
  | "membrane"
  | "nucleus"
  | "nucleolus"
  | "vacuole"
  | "chloroplast"
  | "mitochondrion";

export interface CellShape {
  kind: CellShapeKind;
  x: number;
  y: number;
  /** Rectangles (`wall`, `membrane`). */
  w?: number;
  h?: number;
  /** Ellipses and circles (`vacuole`, `chloroplast`, `mitochondrion`, `nucleus`). */
  rx?: number;
  ry?: number;
  rotate?: number;
  fill: "none" | "sunken" | "accent";
}

export interface CellLayout {
  width: number;
  height: number;
  variant: "plant" | "animal";
  shapes: CellShape[];
  numbers: { n: number; x: number; y: number }[];
}

export function cellLayout(spec: Extract<FigureSpec, { kind: "cell" }>): CellLayout {
  if (spec.variant === "animal") {
    return {
      width: CELL_W,
      height: CELL_H,
      variant: "animal",
      shapes: [
        { kind: "membrane", x: 28, y: 28, w: 304, h: 214, fill: "sunken" },
        { kind: "nucleus", x: 140, y: 120, rx: 38, ry: 38, fill: "sunken" },
        { kind: "nucleolus", x: 140, y: 120, rx: 10, ry: 10, fill: "accent" },
        { kind: "mitochondrion", x: 75, y: 80, rx: 22, ry: 10, rotate: 25, fill: "accent" },
        { kind: "mitochondrion", x: 285, y: 170, rx: 22, ry: 10, rotate: -20, fill: "accent" },
      ],
      numbers: [
        { n: 1, x: 140, y: 120 },
        { n: 2, x: 75, y: 140 },
        { n: 3, x: 75, y: 80 },
        { n: 4, x: 30, y: 40 },
      ],
    };
  }
  return {
    width: CELL_W,
    height: CELL_H,
    variant: "plant",
    shapes: [
      { kind: "wall", x: 16, y: 16, w: 328, h: 238, fill: "none" },
      { kind: "membrane", x: 28, y: 28, w: 304, h: 214, fill: "sunken" },
      { kind: "vacuole", x: 235, y: 145, rx: 62, ry: 52, fill: "accent" },
      { kind: "nucleus", x: 130, y: 120, rx: 36, ry: 36, fill: "sunken" },
      { kind: "nucleolus", x: 130, y: 120, rx: 10, ry: 10, fill: "accent" },
      { kind: "chloroplast", x: 70, y: 190, rx: 20, ry: 10, rotate: -20, fill: "accent" },
      { kind: "chloroplast", x: 255, y: 75, rx: 20, ry: 10, rotate: 30, fill: "accent" },
      { kind: "chloroplast", x: 290, y: 205, rx: 18, ry: 9, rotate: -35, fill: "accent" },
      { kind: "mitochondrion", x: 70, y: 75, rx: 22, ry: 10, rotate: 25, fill: "accent" },
      { kind: "mitochondrion", x: 290, y: 120, rx: 22, ry: 10, rotate: -20, fill: "accent" },
    ],
    numbers: [
      { n: 1, x: 130, y: 120 },
      { n: 2, x: 65, y: 140 },
      { n: 3, x: 235, y: 145 },
      { n: 4, x: 70, y: 190 },
      { n: 5, x: 70, y: 75 },
      { n: 6, x: 30, y: 40 },
    ],
  };
}

// ── a reaction-energy profile ────────────────────────────────────────────────
//
// Energetics is the one chemistry topic where a sentence and a picture can
// contradict each other without either looking wrong: "exothermic" beside a
// diagram whose product line is ABOVE the reactant line is a lesson teaching the
// opposite of its caption. The layout therefore derives both levels from one
// signed ΔH, and the renderer only maps these numbers to SVG.

export const EP_W = 420;
export const EP_H = 260;
export const EP_PAD = 42;

export interface EnergyProfileLayout {
  width: number;
  height: number;
  x1: number;
  x2: number;
  peakX: number;
  reactantY: number;
  productY: number;
  peakY: number;
  /** The polyline the renderer draws, already in SVG coordinates. */
  points: [number, number][];
  activation: number;
  delta: number;
  exothermic: boolean;
  activationLabel: string;
  deltaLabel: string;
}

export function energyProfileLayout(
  spec: Extract<FigureSpec, { kind: "energy-profile" }>,
): EnergyProfileLayout {
  const activation = Math.max(0, Number(spec.activation) || 0);
  const delta = Number(spec.delta) || 0;
  // Place the REACTANTS inside the frame, not on its bottom edge. An exothermic
  // product is drawn BELOW the reactants, so anchoring reactants at the bottom
  // pushed the product out of the picture; the baseline now leaves room on both
  // sides. The peak sits an activation above the higher level, so an endothermic
  // reaction needs delta + activation of headroom.
  const spanAbove = Math.max(0, delta) + activation;
  const spanBelow = Math.max(0, -delta);
  const scale = (EP_H - EP_PAD * 2) / Math.max(spanAbove + spanBelow, 1);
  const reactantY = EP_PAD + spanAbove * scale;
  const productY = reactantY - delta * scale;
  const peakY = Math.min(reactantY, productY) - activation * scale;
  const x1 = EP_PAD;
  const x2 = EP_W - EP_PAD;
  const peakX = (x1 + x2) / 2;
  return {
    width: EP_W,
    height: EP_H,
    x1,
    x2,
    peakX,
    reactantY,
    productY,
    peakY,
    points: [
      [x1, reactantY],
      [x1 + 18, reactantY],
      [peakX - 24, peakY],
      [peakX, peakY],
      [peakX + 24, peakY],
      [x2 - 18, productY],
      [x2, productY],
    ],
    activation,
    delta,
    exothermic: delta < 0,
    activationLabel: "Ea",
    deltaLabel: `ΔH = ${delta > 0 ? "+" : ""}${delta} kJ/mol`,
  };
}

// ── an atom ─────────────────────────────────────────────────────────────────
//
// The shells are not decoration: they are the electron configuration the lesson
// names. Every dot comes from `shells`, so sodium cannot be drawn as 2,8,2 or
// carbon as 2,2,2 while the caption says 2,4. The first three shells fit the
// frame; a fourth would be outside it, so the layout reports `truncated` rather
// than drawing a dot on the edge.

export const ATOM_W = 360;
export const ATOM_H = 260;
export const ATOM_CX = ATOM_W / 2;
export const ATOM_CY = 132;
export const ATOM_NUCLEUS_R = 26;

export interface AtomShell {
  radius: number;
  electrons: { x: number; y: number }[];
}

export interface AtomLayout {
  width: number;
  height: number;
  cx: number;
  cy: number;
  nucleusRadius: number;
  shells: AtomShell[];
  electronsTotal: number;
  truncated: boolean;
}

// ── chemistry schematics ────────────────────────────────────────────────────
//
// A small scene vocabulary rather than nine separate SVG components: a shape is
// still DATA, every coordinate is computed here, and both renderers consume the
// same list. The variants are deliberately fixed schematics (which group/period,
// which ions, which pH values) because each is attached to exactly one lesson;
// the caption states the relationship and the drawing repeats it.

export type ChemPaint =
  | "accent" | "muted" | "line" | "surface" | "sunken" | "text" | "none"
  // Real flame-test colours. Tokens rather than raw hex so the static twin and
  // the React renderer cannot drift, and so a theme can still override them.
  | "flame-li" | "flame-na" | "flame-k" | "flame-ca" | "flame-cu";

export type ChemShape =
  | { kind: "rect"; x: number; y: number; w: number; h: number; rx?: number; fill?: ChemPaint; fillOpacity?: number; stroke?: ChemPaint; strokeWidth?: number }
  | { kind: "circle"; cx: number; cy: number; r: number; fill?: ChemPaint; fillOpacity?: number; stroke?: ChemPaint; strokeWidth?: number }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; stroke?: ChemPaint; strokeWidth?: number; dashed?: boolean }
  | { kind: "path"; d: string; fill?: ChemPaint; fillOpacity?: number; stroke?: ChemPaint; strokeWidth?: number }
  | { kind: "polyline"; points: readonly (readonly [number, number])[]; stroke?: ChemPaint; strokeWidth?: number; dashed?: boolean }
  | { kind: "text"; x: number; y: number; text: string; size?: number; anchor?: "start" | "middle" | "end"; weight?: number; fill?: ChemPaint };

export interface ChemLayout {
  width: number;
  height: number;
  shapes: readonly ChemShape[];
}

const CHEM_W = 360;
const CHEM_H = 220;

function particleBoxShapes(): ChemShape[] {
  const out: ChemShape[] = [];
  const boxes = [12, 130, 248];
  // THE BOXES USED TO BE UNLABELLED, so a learner saw three arrangements of
  // dots and had to read the caption to know which was which. The formula under
  // each box is the diagram's own key: one element, one compound, a mixture.
  const keys = ["C", "H₂O", "O₂ + N₂"];
  for (const [i, x] of boxes.entries()) {
    out.push({ kind: "rect", x, y: 34, w: 100, h: 126, rx: 8, fill: "surface", stroke: "line" });
    if (i === 0) {
      for (let n = 0; n < 6; n++) out.push({ kind: "circle", cx: x + 24 + (n % 3) * 26, cy: 66 + Math.floor(n / 3) * 30, r: 9, fill: "accent" });
    } else if (i === 1) {
      // Water is two H joined to one O, not three equal circles. The sizes and
      // colours carry that before the formula under the box names it.
      out.push({ kind: "line", x1: x + 34, y1: 82, x2: x + 50, y2: 108, stroke: "line" });
      out.push({ kind: "line", x1: x + 66, y1: 82, x2: x + 50, y2: 108, stroke: "line" });
      out.push({ kind: "circle", cx: x + 34, cy: 78, r: 7, fill: "muted" });
      out.push({ kind: "circle", cx: x + 66, cy: 78, r: 7, fill: "muted" });
      out.push({ kind: "circle", cx: x + 50, cy: 112, r: 12, fill: "accent" });
    } else {
      // Two separate diatomic molecules: O₂ and N₂. The line inside each pair
      // is the covalent bond; there is no line between the two molecules.
      out.push({ kind: "line", x1: x + 32, y1: 72, x2: x + 50, y2: 72, stroke: "line" });
      out.push({ kind: "circle", cx: x + 30, cy: 72, r: 8, fill: "accent" });
      out.push({ kind: "circle", cx: x + 52, cy: 72, r: 8, fill: "accent" });
      out.push({ kind: "line", x1: x + 66, y1: 112, x2: x + 82, y2: 128, stroke: "line" });
      out.push({ kind: "circle", cx: x + 64, cy: 110, r: 9, fill: "muted" });
      out.push({ kind: "circle", cx: x + 84, cy: 130, r: 9, fill: "muted" });
    }
    out.push({ kind: "text", x: x + 50, y: 181, text: keys[i], size: i === 1 ? 12 : 11, anchor: "middle", weight: 700, fill: i === 1 ? "accent" : "text" });
  }
  return out;
}

function periodicShapes(): ChemShape[] {
  const out: ChemShape[] = [];
  const x0 = 30;
  const y0 = 30;
  const cell = 16;
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 18; col++) {
      const x = x0 + col * cell;
      const y = y0 + row * cell;
      const highlight = col === 0 || row === 2;
      out.push({ kind: "rect", x, y, w: cell - 2, h: cell - 2, rx: 2, fill: highlight ? "accent" : "surface", fillOpacity: highlight ? 0.22 : 1, stroke: "line" });
    }
  }
  out.push({ kind: "text", x: x0 + 6, y: y0 + cell * 2 + 12, text: "Na", size: 11, anchor: "middle", weight: 700, fill: "text" });
  out.push({ kind: "text", x: x0 - 9, y: y0 + cell * 2 + 11, text: "1", size: 10, anchor: "end", weight: 700, fill: "accent" });
  out.push({ kind: "text", x: x0 + 5, y: y0 + cell * 2 - 5, text: "3", size: 10, anchor: "start", weight: 700, fill: "accent" });
  return out;
}

function ionicShapes(): ChemShape[] {
  return [
    { kind: "circle", cx: 105, cy: 110, r: 36, fill: "surface", stroke: "accent", strokeWidth: 2 },
    { kind: "text", x: 105, y: 115, text: "Na⁺", size: 16, anchor: "middle", weight: 700, fill: "text" },
    { kind: "circle", cx: 255, cy: 110, r: 36, fill: "surface", stroke: "accent", strokeWidth: 2 },
    { kind: "text", x: 255, y: 115, text: "Cl⁻", size: 16, anchor: "middle", weight: 700, fill: "text" },
    { kind: "circle", cx: 105, cy: 62, r: 5, fill: "accent" },
    { kind: "line", x1: 118, y1: 66, x2: 225, y2: 82, stroke: "accent", strokeWidth: 2 },
    { kind: "path", d: "M 218 75 L 228 84 L 220 91", fill: "none", stroke: "accent", strokeWidth: 2 },
    { kind: "text", x: 172, y: 58, text: "e⁻", size: 10, anchor: "middle", fill: "muted" },
  ];
}

function covalentShapes(): ChemShape[] {
  return [
    { kind: "circle", cx: 135, cy: 110, r: 32, fill: "surface", stroke: "accent", strokeWidth: 2 },
    { kind: "text", x: 135, y: 115, text: "H", size: 18, anchor: "middle", weight: 700, fill: "text" },
    { kind: "circle", cx: 225, cy: 110, r: 32, fill: "surface", stroke: "accent", strokeWidth: 2 },
    { kind: "text", x: 225, y: 115, text: "H", size: 18, anchor: "middle", weight: 700, fill: "text" },
    { kind: "circle", cx: 169, cy: 102, r: 4, fill: "accent" },
    { kind: "circle", cx: 191, cy: 102, r: 4, fill: "accent" },
    { kind: "line", x1: 169, y1: 102, x2: 191, y2: 102, stroke: "accent", strokeWidth: 1 },
    { kind: "text", x: 180, y: 72, text: "2e⁻", size: 10, anchor: "middle", fill: "muted" },
  ];
}

function metallicShapes(): ChemShape[] {
  const out: ChemShape[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cx = 100 + c * 80;
      const cy = 65 + r * 48;
      out.push({ kind: "circle", cx, cy, r: 15, fill: "surface", stroke: "accent", strokeWidth: 1.5 });
      out.push({ kind: "text", x: cx, y: cy + 4, text: "+", size: 11, anchor: "middle", weight: 700, fill: "accent" });
    }
  }
  for (const [cx, cy] of [[140, 89], [220, 89], [180, 113], [140, 137], [220, 137]] as const) {
    out.push({ kind: "circle", cx, cy, r: 3, fill: "accent" });
  }
  out.push({ kind: "text", x: 180, y: 30, text: "e⁻", size: 10, anchor: "middle", fill: "muted" });
  return out;
}

function moleShapes(): ChemShape[] {
  return [
    { kind: "rect", x: 70, y: 35, w: 220, h: 150, rx: 12, fill: "surface", stroke: "accent", strokeWidth: 2 },
    { kind: "text", x: 180, y: 72, text: "1 mol", size: 18, anchor: "middle", weight: 700, fill: "text" },
    { kind: "text", x: 180, y: 102, text: "H₂O", size: 20, anchor: "middle", weight: 700, fill: "accent" },
    { kind: "text", x: 180, y: 132, text: "18 g", size: 16, anchor: "middle", weight: 700, fill: "text" },
    { kind: "text", x: 180, y: 158, text: "6.02 × 10²³", size: 12, anchor: "middle", fill: "muted" },
    { kind: "line", x1: 70, y1: 185, x2: 290, y2: 185, stroke: "line", strokeWidth: 1 },
  ];
}

function chartShapes(spec: Extract<FigureSpec, { kind: "chem" }>): ChemShape[] {
  const out: ChemShape[] = [];
  const x0 = 42;
  const y0 = CHEM_H - 32;
  const x1 = CHEM_W - 18;
  const y1 = 24;
  const xMax = spec.xMax && spec.xMax > 0 ? spec.xMax : 10;
  const yMax = spec.yMax && spec.yMax > 0 ? spec.yMax : 10;
  out.push({ kind: "line", x1: x0, y1, x2: x0, y2: y0, stroke: "line", strokeWidth: 1.5 });
  out.push({ kind: "line", x1: x0, y1: y0, x2: x1, y2: y0, stroke: "line", strokeWidth: 1.5 });
  for (const s of spec.series ?? []) {
    const points = s.points.map(([x, y]) => [x0 + (Math.max(0, Math.min(xMax, x)) / xMax) * (x1 - x0), y0 - (Math.max(0, Math.min(yMax, y)) / yMax) * (y0 - y1)] as const);
    out.push({ kind: "polyline", points, stroke: s.tone === "muted" ? "muted" : "accent", strokeWidth: 2.5, dashed: s.dashed });
  }
  // An unlabelled pair of axes is a squiggle, not a graph: the reader cannot
  // tell time from temperature or see where zero is. The caption still carries
  // the full explanation; these labels name the axes and the origin.
  out.push({ kind: "text", x: x1, y: y0 + 14, text: "t", size: 10, anchor: "end", fill: "muted" });
  out.push({ kind: "text", x: x0 + 4, y: y1 - 6, text: "amount", size: 9, anchor: "start", fill: "muted" });
  out.push({ kind: "text", x: x0 - 6, y: y0 + 4, text: "0", size: 9, anchor: "end", fill: "muted" });
  return out;
}

function phShapes(): ChemShape[] {
  const out: ChemShape[] = [];
  const x0 = 20;
  const step = 320 / 15;
  for (let i = 0; i < 15; i++) {
    out.push({ kind: "rect", x: x0 + i * step, y: 88, w: step - 1, h: 22, fill: i < 7 ? "accent" : i === 7 ? "muted" : "accent", fillOpacity: i < 7 ? 0.9 - i * 0.08 : i === 7 ? 1 : 0.35 + (i - 7) * 0.035, stroke: "none" });
    out.push({ kind: "text", x: x0 + i * step + (step - 1) / 2, y: 128, text: String(i), size: 9, anchor: "middle", fill: "muted" });
  }
  for (const [i, range] of [[2, "0–6"], [7, "7"], [12, "8–14"]] as const) {
    const cx = x0 + i * step + (step - 1) / 2;
    out.push({ kind: "circle", cx, cy: 99, r: 5, fill: "surface", stroke: "text", strokeWidth: 1.5 });
    out.push({ kind: "text", x: cx, y: 70, text: String(i), size: 13, anchor: "middle", weight: 700, fill: "text" });
    out.push({ kind: "text", x: cx, y: 162, text: range, size: 9, anchor: "middle", fill: "muted" });
  }
  out.push({ kind: "text", x: 30, y: 48, text: "H⁺", size: 13, weight: 700, fill: "accent" });
  out.push({ kind: "text", x: 330, y: 48, text: "OH⁻", size: 13, anchor: "end", weight: 700, fill: "accent" });
  return out;
}

function electrolysisShapes(): ChemShape[] {
  return [
    { kind: "rect", x: 70, y: 75, w: 220, h: 105, rx: 6, fill: "surface", stroke: "line", strokeWidth: 2 },
    { kind: "rect", x: 78, y: 126, w: 204, h: 48, fill: "accent", fillOpacity: 0.16, stroke: "none" },
    { kind: "line", x1: 125, y1: 95, x2: 125, y2: 160, stroke: "text", strokeWidth: 5 },
    { kind: "line", x1: 235, y1: 95, x2: 235, y2: 160, stroke: "text", strokeWidth: 5 },
    { kind: "line", x1: 125, y1: 95, x2: 125, y2: 42, stroke: "text", strokeWidth: 2 },
    { kind: "line", x1: 235, y1: 95, x2: 235, y2: 42, stroke: "text", strokeWidth: 2 },
    { kind: "line", x1: 125, y1: 42, x2: 235, y2: 42, stroke: "text", strokeWidth: 2 },
    { kind: "line", x1: 164, y1: 42, x2: 164, y2: 33, stroke: "text", strokeWidth: 2 },
    { kind: "line", x1: 180, y1: 33, x2: 180, y2: 51, stroke: "text", strokeWidth: 3 },
    { kind: "text", x: 125, y: 30, text: "+", size: 12, anchor: "middle", weight: 700, fill: "text" },
    { kind: "text", x: 235, y: 30, text: "−", size: 12, anchor: "middle", weight: 700, fill: "text" },
    { kind: "circle", cx: 145, cy: 145, r: 3, fill: "surface" },
    { kind: "circle", cx: 154, cy: 136, r: 2.5, fill: "surface" },
    { kind: "circle", cx: 218, cy: 145, r: 3, fill: "surface" },
    { kind: "circle", cx: 207, cy: 136, r: 2.5, fill: "surface" },
  ];
}

function flameShapes(): ChemShape[] {
  const out: ChemShape[] = [];
  const ions = ["Li⁺", "Na⁺", "K⁺", "Ca²⁺", "Cu²⁺"];
  const colours = ["flame-li", "flame-na", "flame-k", "flame-ca", "flame-cu"] as const;
  for (let i = 0; i < 5; i++) {
    const x = 54 + i * 63;
    // The colour IS the observation in a flame test. Five identical flames with
    // different captions would be a key, not a diagram.
    out.push({ kind: "path", d: `M ${x} 170 C ${x - 20} 140 ${x - 12} 105 ${x} 70 C ${x + 12} 105 ${x + 20} 140 ${x} 170 Z`, fill: colours[i], fillOpacity: 0.28, stroke: colours[i], strokeWidth: 2 });
    out.push({ kind: "text", x, y: 194, text: ions[i], size: 12, anchor: "middle", weight: 700, fill: "text" });
  }
  return out;
}

function organicShapes(): ChemShape[] {
  return [
    { kind: "circle", cx: 180, cy: 110, r: 26, fill: "surface", stroke: "accent", strokeWidth: 2 },
    { kind: "text", x: 180, y: 115, text: "C", size: 16, anchor: "middle", weight: 700, fill: "text" },
    { kind: "line", x1: 180, y1: 84, x2: 180, y2: 44, stroke: "line", strokeWidth: 2 },
    { kind: "line", x1: 180, y1: 136, x2: 180, y2: 176, stroke: "line", strokeWidth: 2 },
    { kind: "line", x1: 154, y1: 110, x2: 110, y2: 110, stroke: "line", strokeWidth: 2 },
    { kind: "line", x1: 206, y1: 110, x2: 250, y2: 110, stroke: "line", strokeWidth: 2 },
    { kind: "text", x: 180, y: 34, text: "H", size: 14, anchor: "middle", weight: 700, fill: "accent" },
    { kind: "text", x: 180, y: 194, text: "H", size: 14, anchor: "middle", weight: 700, fill: "accent" },
    { kind: "text", x: 98, y: 115, text: "H", size: 14, anchor: "middle", weight: 700, fill: "accent" },
    { kind: "text", x: 262, y: 115, text: "H", size: 14, anchor: "middle", weight: 700, fill: "accent" },
    { kind: "text", x: 180, y: 210, text: "CH₄", size: 12, anchor: "middle", fill: "muted" },
  ];
}

export function chemLayout(spec: Extract<FigureSpec, { kind: "chem" }>): ChemLayout {
  const shapes: ChemShape[] =
    spec.variant === "particle-box" ? particleBoxShapes()
      : spec.variant === "periodic" ? periodicShapes()
        : spec.variant === "ionic" ? ionicShapes()
          : spec.variant === "covalent" ? covalentShapes()
            : spec.variant === "metallic" ? metallicShapes()
              : spec.variant === "mole" ? moleShapes()
                : spec.variant === "chart" ? chartShapes(spec)
                  : spec.variant === "ph" ? phShapes()
                    : spec.variant === "electrolysis" ? electrolysisShapes()
                      : spec.variant === "flame" ? flameShapes()
                        : organicShapes();
  return { width: CHEM_W, height: CHEM_H, shapes };
}

export function atomLayout(spec: Extract<FigureSpec, { kind: "atom" }>): AtomLayout {
  const shown = spec.shells.slice(0, 3);
  const shells: AtomShell[] = shown.map((count, i) => {
    const radius = 48 + i * 30;
    const electrons = Math.max(0, Math.min(8, Math.round(Number(count) || 0)));
    const offset = -Math.PI / 2 + i * 0.28;
    return {
      radius,
      electrons: Array.from({ length: electrons }, (_, j) => {
        const angle = offset + (2 * Math.PI * j) / Math.max(electrons, 1);
        return { x: ATOM_CX + Math.cos(angle) * radius, y: ATOM_CY + Math.sin(angle) * radius };
      }),
    };
  });
  const electronsTotal = spec.shells.reduce((n, count) => n + Math.max(0, Math.round(Number(count) || 0)), 0);
  return {
    width: ATOM_W,
    height: ATOM_H,
    cx: ATOM_CX,
    cy: ATOM_CY,
    nucleusRadius: ATOM_NUCLEUS_R,
    shells,
    electronsTotal,
    truncated: spec.shells.length > 3,
  };
}
