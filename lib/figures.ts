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
