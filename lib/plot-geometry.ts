// ─────────────────────────────────────────────────────────────────────────────
// THE GEOMETRY OF A LINE THE LEARNER DREW.
//
// The graph question asks a learner to plot points and join them. The line they
// SEE and the line the marker READS must be the same object: a marker that fits
// its own regression through the points can award a follow-through mark for a
// line the editor never drew. So the answer carries the line explicitly, and
// both renderer and marker call this module.
//
// Why the line is stored as two points rather than `m`/`c`: a vertical line has
// no gradient, and silently refusing it would make a mathematically valid answer
// unmarkable. Two distinct points name every straight line, vertical included.
// ─────────────────────────────────────────────────────────────────────────────

export interface PlotPoint {
  x: number;
  y: number;
}

export interface PlotLine {
  a: PlotPoint;
  b: PlotPoint;
}

export interface PlotBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** The line through two distinct, finite points; null when they do not name one. */
export function lineThrough(a: PlotPoint, b: PlotPoint): PlotLine | null {
  if (!finite(a?.x) || !finite(a?.y) || !finite(b?.x) || !finite(b?.y)) return null;
  if (a.x === b.x && a.y === b.y) return null;
  return { a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } };
}

/**
 * The line a learner's plotted points define WHEN THEY ASK TO JOIN THEM.
 *
 * This is called once, at the moment the line is switched on, and its result is
 * STORED in the answer. Adding or removing points afterwards must not move the
 * line: the learner sees a line, and that line is what gets marked.
 *
 * The two furthest-apart points are chosen so the line spans the plotted set
 * rather than leaning on two adjacent points; a vertical set is ordered by y.
 */
export function definingLine(points: PlotPoint[]): PlotLine | null {
  if (!Array.isArray(points) || points.length < 2) return null;
  const unique = points.filter((p, i) => finite(p?.x) && finite(p?.y)
    && points.findIndex((q) => q.x === p.x && q.y === p.y) === i);
  if (unique.length < 2) return null;

  let best: [PlotPoint, PlotPoint] | null = null;
  let bestD = -1;
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const d = (unique[i].x - unique[j].x) ** 2 + (unique[i].y - unique[j].y) ** 2;
      if (d > bestD) { bestD = d; best = [unique[i], unique[j]]; }
    }
  }
  return best ? lineThrough(best[0], best[1]) : null;
}

/** Gradient and intercept. Null for a vertical line, which has no gradient. */
export function coefficients(line: PlotLine | null | undefined): { m: number; c: number } | null {
  if (!line || !finite(line.a?.x) || !finite(line.b?.x)) return null;
  if (line.a.x === line.b.x) return null;
  const m = (line.b.y - line.a.y) / (line.b.x - line.a.x);
  if (!Number.isFinite(m)) return null;
  return { m, c: line.a.y - m * line.a.x };
}

/** The y value on the line at x. Null when the line is vertical. */
export function valueAt(line: PlotLine | null | undefined, x: number): number | null {
  const coef = coefficients(line);
  if (!coef || !finite(x)) return null;
  const y = coef.m * x + coef.c;
  return Number.isFinite(y) ? y : null;
}

/**
 * The line clipped to the visible grid, as two points in QUESTION coordinates.
 * This is what the renderer draws and what a reader can check against the
 * marker's `valueAt` — one straight line, not a segment between whichever
 * points happen to be plotted.
 */
export function clipToBounds(line: PlotLine | null | undefined, b: PlotBounds): [PlotPoint, PlotPoint] | null {
  if (!line) return null;
  const eps = 1e-9;
  const inBox = (p: PlotPoint) => p.x >= b.xMin - eps && p.x <= b.xMax + eps
    && p.y >= b.yMin - eps && p.y <= b.yMax + eps;
  const out: PlotPoint[] = [];
  const add = (x: number, y: number) => {
    const p = { x, y };
    if (!finite(x) || !finite(y) || !inBox(p)) return;
    if (out.some((q) => Math.abs(q.x - x) < eps && Math.abs(q.y - y) < eps)) return;
    out.push(p);
  };

  if (line.a.x === line.b.x) {
    add(line.a.x, b.yMin);
    add(line.a.x, b.yMax);
  } else {
    const coef = coefficients(line);
    if (!coef) return null;
    add(b.xMin, coef.m * b.xMin + coef.c);
    add(b.xMax, coef.m * b.xMax + coef.c);
    if (coef.m !== 0) {
      add((b.yMin - coef.c) / coef.m, b.yMin);
      add((b.yMax - coef.c) / coef.m, b.yMax);
    }
  }
  if (out.length < 2) return null;
  out.sort((p, q) => (p.x - q.x) || (p.y - q.y));
  return [out[0], out[out.length - 1]];
}
