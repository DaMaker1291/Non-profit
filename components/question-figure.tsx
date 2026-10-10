"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE DIAGRAM, DRAWN.
//
// One renderer for every figure a question carries, so the practice surface,
// the diagnostic, the paper, the micro-check and the offline pack all draw the
// same picture from the same numbers. The spec is data (lib/types.ts#FigureSpec)
// and this file is the only place it becomes pixels.
//
// IT CARRIES NO TEXT A LEARNER MUST READ. Every label here is a number or a
// word the prompt already states ("walk", the coordinate pair, the tick values),
// so the SVG is `aria-hidden`: a screen-reader user loses nothing, because the
// stem says everything the picture says. Translating a diagram would mean
// translating numbers, and the words on it are the question's own.
//
// Geometry is computed, never hardcoded: a generator that changes its numbers
// changes the drawing, and a figure cannot go stale beside a question that
// moved. Segments are CLIPPED to the frame, so a line drawn from two points
// outside the view still lands correctly inside it.
//
// Colour comes from the design system's own tokens (`currentColor` and the CSS
// variables), so the figure is legible in both themes and in the print pack
// without a second palette.
// ─────────────────────────────────────────────────────────────────────────────

import type { FigureSpec } from "@/lib/types";

/** Data value → pixel, along one axis. A degenerate range centres the value
 *  rather than dividing by zero. */
function scale(v: number, lo: number, hi: number, a: number, b: number): number {
  if (hi === lo) return (a + b) / 2;
  return a + ((v - lo) / (hi - lo)) * (b - a);
}

/**
 * Liang–Barsky clip of a segment against a box, in DATA coordinates.
 *
 * A line like y = 2x + 5 leaves the frame long before its own end points do, and
 * an unclipped SVG draws it straight over the axis labels. Clipping here (rather
 * than in each generator) means a figure spec cannot be wrong about it.
 */
function clipSegment(
  x1: number, y1: number, x2: number, y2: number,
  xMin: number, xMax: number, yMin: number, yMax: number,
): [number, number, number, number] | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xMin, xMax - x1, y1 - yMin, yMax - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
      continue;
    }
    const r = q[i] / p[i];
    if (p[i] < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return [x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy];
}

const RT_W = 340;
const RT_H = 250;
const RT_PAD = 42;

/**
 * A right-angled triangle, drawn to scale from its own legs.
 *
 * The right angle sits at the bottom-left, the horizontal leg along the bottom
 * and the vertical leg up the left — the orientation every textbook uses, so
 * "the hypotenuse" is recognisable at a glance and needs no words.
 *
 * A side the question does NOT give is drawn as `?`, not with a value and not
 * omitted: the unknown is the thing being asked about, and a diagram that
 * answers its own question is a broken instrument.
 */
function RightTriangle({ spec }: { spec: Extract<FigureSpec, { kind: "right-triangle" }> }) {
  const { legA, legB, unit = "" } = spec;
  // Scale to the frame while keeping the legs' OWN ratio: a 3–4 triangle must
  // not be drawn as an equilateral one, or the picture teaches the wrong shape.
  const maxW = RT_W - RT_PAD * 2;
  const maxH = RT_H - RT_PAD * 2;
  const ratio = legA > 0 && legB > 0 ? legB / legA : 0.75;
  let w = maxW;
  let h = w * ratio;
  if (h > maxH) { h = maxH; w = ratio > 0 ? h / ratio : maxW; }
  const originX = RT_PAD;
  const baseY = RT_H - RT_PAD;
  const bx = originX + w;
  const cy = baseY - h;
  const at = (v: number) => `${v}${unit}`;
  const parts: React.ReactNode[] = [
    <polygon
      key="body"
      points={`${originX},${baseY} ${bx},${baseY} ${originX},${cy}`}
      fill="var(--surface-sunken)" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round"
    />,
    // The right-angle square: the one mark that makes this triangle readable as
    // a right triangle rather than an arbitrary one.
    <polygon
      key="right"
      points={`${originX + 16},${baseY} ${originX + 16},${baseY - 16} ${originX},${baseY - 16}`}
      fill="none" stroke="var(--accent)" strokeWidth={2}
    />,
  ];
  parts.push(
    <text key="la" x={originX + w / 2} y={baseY + 26} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--text)">
      {spec.labelA ? at(legA) : "?"}
    </text>,
  );
  parts.push(
    <text key="lb" x={originX - 12} y={cy + h / 2 + 5} textAnchor="end" fontSize={15} fontWeight={700} fill="var(--text)">
      {spec.labelB ? at(legB) : "?"}
    </text>,
  );
  parts.push(
    <text key="lc" x={originX + w / 2 + 16} y={cy + h / 2 - 8} fontSize={15} fontWeight={700} fill="var(--text)">
      {spec.labelC ? at(Math.round(Math.hypot(legA, legB) * 1000) / 1000) : "?"}
    </text>,
  );
  return <svg viewBox={`0 0 ${RT_W} ${RT_H}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

const AX_SIDE = 340;
const AX_PAD = 30;

/** A coordinate grid: the only figure that needs BOTH axes drawn, since the
 *  origin is the reference point a "distance from the origin" item turns on. */
function Axes({ spec }: { spec: Extract<FigureSpec, { kind: "axes" }> }) {
  const { xMin, xMax, yMin, yMax } = spec;
  const X = (v: number) => scale(v, xMin, xMax, AX_PAD, AX_SIDE - AX_PAD);
  const Y = (v: number) => AX_SIDE - AX_PAD - scale(v, yMin, yMax, 0, AX_SIDE - AX_PAD * 2);
  const span = Math.max(xMax - xMin, yMax - yMin);
  const labelEvery = span <= 14 ? 1 : Math.ceil(span / 12);

  const parts: React.ReactNode[] = [];
  // Grid: every integer step, faint. It is what makes a plotted point readable.
  for (let v = Math.ceil(xMin); v <= Math.floor(xMax); v++) {
    parts.push(<line key={`gx${v}`} x1={X(v)} y1={Y(yMin)} x2={X(v)} y2={Y(yMax)} stroke="var(--line-soft)" strokeWidth={1} />);
  }
  for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v++) {
    parts.push(<line key={`gy${v}`} x1={X(xMin)} y1={Y(v)} x2={X(xMax)} y2={Y(v)} stroke="var(--line-soft)" strokeWidth={1} />);
  }
  // The axes themselves are drawn only where they belong: a frame whose range
  // excludes zero has no x-axis in it, and drawing one at the edge would lie.
  if (yMin <= 0 && yMax >= 0) parts.push(<line key="ax" x1={X(xMin)} y1={Y(0)} x2={X(xMax)} y2={Y(0)} stroke="var(--line)" strokeWidth={1.5} />);
  if (xMin <= 0 && xMax >= 0) parts.push(<line key="ay" x1={X(0)} y1={Y(yMin)} x2={X(0)} y2={Y(yMax)} stroke="var(--line)" strokeWidth={1.5} />);
  for (let v = Math.ceil(xMin); v <= Math.floor(xMax); v++) {
    if (v === 0 || v % labelEvery !== 0) continue;
    parts.push(<text key={`lx${v}`} x={X(v)} y={Y(yMin <= 0 && yMax >= 0 ? 0 : yMin) + 15} textAnchor="middle" fontSize={11} fill="var(--text-muted)">{v}</text>);
  }
  for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v++) {
    if (v === 0 || v % labelEvery !== 0) continue;
    parts.push(<text key={`ly${v}`} x={X(xMin <= 0 && xMax >= 0 ? 0 : xMin) - 6} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">{v}</text>);
  }
  for (const [i, l] of (spec.lines ?? []).entries()) {
    const clipped = clipSegment(l.from[0], l.from[1], l.to[0], l.to[1], xMin, xMax, yMin, yMax);
    if (!clipped) continue;
    parts.push(
      <line
        key={`ln${i}`}
        x1={X(clipped[0])} y1={Y(clipped[1])} x2={X(clipped[2])} y2={Y(clipped[3])}
        stroke="var(--accent)" strokeWidth={2.5}
        strokeDasharray={l.dashed ? "6 5" : undefined}
      />,
    );
    if (l.label) {
      parts.push(<text key={`lnl${i}`} x={X(clipped[2])} y={Y(clipped[3]) - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{l.label}</text>);
    }
  }
  for (const [i, p] of (spec.points ?? []).entries()) {
    parts.push(
      <circle
        key={`pt${i}`}
        cx={X(p.at[0])} cy={Y(p.at[1])} r={5.5}
        fill={p.open ? "var(--surface)" : "var(--accent)"}
        stroke="var(--accent)" strokeWidth={2.5}
      />,
    );
    if (p.label) {
      parts.push(<text key={`ptl${i}`} x={X(p.at[0]) + 10} y={Y(p.at[1]) - 9} fontSize={12.5} fontWeight={700} fill="var(--text)">{p.label}</text>);
    }
  }
  return <svg viewBox={`0 0 ${AX_SIDE} ${AX_SIDE}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

const PIE_SIDE = 240;
const PIE_R = 82;

/** One marked sector of a pie chart. The sector's ANGLE is drawn (it is in the
 *  prompt); the FRACTION it equals is not, because that is the answer. */
function Pie({ spec }: { spec: Extract<FigureSpec, { kind: "pie" }> }) {
  const c = PIE_SIDE / 2;
  const deg = Math.max(0, Math.min(360, spec.sectorDegrees));
  const parts: React.ReactNode[] = [
    <circle key="whole" cx={c} cy={c} r={PIE_R} fill="var(--surface-sunken)" stroke="var(--line)" strokeWidth={1.5} />,
  ];
  if (deg >= 360) {
    parts.push(<circle key="all" cx={c} cy={c} r={PIE_R} fill="var(--accent)" />);
  } else if (deg > 0) {
    const a0 = -Math.PI / 2;
    const a1 = a0 + (deg * Math.PI) / 180;
    const p0 = [c + PIE_R * Math.cos(a0), c + PIE_R * Math.sin(a0)];
    const p1 = [c + PIE_R * Math.cos(a1), c + PIE_R * Math.sin(a1)];
    parts.push(
      <path
        key="sector"
        d={`M ${c} ${c} L ${p0[0]} ${p0[1]} A ${PIE_R} ${PIE_R} 0 ${deg > 180 ? 1 : 0} 1 ${p1[0]} ${p1[1]} Z`}
        fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5}
      />,
    );
  }
  // ── THE LABELS SIT OFF THE PIE, IN THE PAGE'S OWN INK ────────────────────
  //
  // They were drawn ON the pie in `--text-on-strong` — the theme's ON-FILL ink,
  // which is only legible where the accent fill actually is. A 30° wedge does
  // not reach the middle of the circle, so the "30°" label landed on
  // `--surface-sunken` and was painted in the paper colour: white on pale in
  // light mode, dark on dark in the dark theme. Invisible both ways, on the one
  // part of the figure that carries the number the question turns on.
  //
  // So the marked sector is captioned UNDER the chart, in `--text` — legible on
  // the page in both themes, and the caption reads like one. The first attempt
  // at this placed the name just outside its own arc and CLAMPED it back into
  // the frame, which was still wrong: at a 138° sector the clamp pulled the name
  // 4px inside the circle edge, onto the fill again (measured over all 359
  // sector sizes). A position that has to hold for every angle and every label
  // length is a rule with more edges than the caption needs, so the caption it
  // is — one text baseline, no geometry, nothing that can land on a fill.
  //
  // The angle is drawn and the FRACTION it equals is not, because that is the
  // answer. A full circle has no sector to name (an unnamed whole is the only
  // honest reading of "the whole circle is marked"), so its caption carries the
  // angle alone.
  if (deg > 0) {
    const caption = spec.label && deg < 360 ? `${spec.label} · ${deg}°` : `${deg}°`;
    // The caption is FITTED to the frame instead of trusted to fit it: a long
    // sector name steps the size down (0.55em/char is close enough for a width
    // estimate) until it is inside the chart's own width. The floor stops the
    // shrinking at 10px, where a name that still overflows is a content problem
    // rather than a rendering one.
    const usable = PIE_SIDE - 12;
    let fontSize = 15;
    while (fontSize > 10 && caption.length * fontSize * 0.55 > usable) fontSize -= 1;
    parts.push(
      <text key="angle" x={c} y={c + PIE_R + 22} textAnchor="middle" fontSize={fontSize} fontWeight={700} fill="var(--text)">
        {caption}
      </text>,
    );
  }
  return <svg viewBox={`0 0 ${PIE_SIDE} ${PIE_SIDE}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

/** The figure, or nothing at all — a question with no diagram renders no box. */
export default function QuestionFigure({ spec }: { spec?: FigureSpec | null }) {
  if (!spec) return null;
  return (
    <figure className="qfigure" data-figure={spec.kind}>
      {spec.kind === "axes" && <Axes spec={spec} />}
      {spec.kind === "pie" && <Pie spec={spec} />}
      {spec.kind === "right-triangle" && <RightTriangle spec={spec} />}
    </figure>
  );
}
