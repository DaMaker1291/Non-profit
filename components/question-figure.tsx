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
import { figureCaptionText } from "@/lib/content-i18n";
import { useI18n } from "@/lib/client";
import {
  NL_PAD,
  balanceLayout,
  gradientLayout,
  numberLineLayout,
  parabolaLayout,
  pieLayout,
  rectangleLayout,
  surdSquareLayout,
} from "@/lib/figures";

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
  // ── THE TICK LABELS SIT OUTSIDE THE PLOT, NOT ON THE AXES ────────────────
  // They used to be set just under the x-axis and just left of the y-axis —
  // INSIDE the plotting area — so on y = x² − 5x + 6 the numbers ran through
  // the curve and the y-axis's own labels collided with the x-axis's at the
  // origin (measured in a screenshot: “-1” and “1” drawn on top of each other).
  // A label is a caption for the gutter: x values go under the bottom frame,
  // y values to the left of the left frame, in the padding that exists for them.
  // A frame that contains zero still draws its axes inside; the labels simply
  // do not follow them in.
  for (let v = Math.ceil(xMin); v <= Math.floor(xMax); v++) {
    if (v === 0 || v % labelEvery !== 0) continue;
    parts.push(<text key={`lx${v}`} x={X(v)} y={Y(yMin) + 15} textAnchor="middle" fontSize={11} fill="var(--text-muted)">{v}</text>);
  }
  for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v++) {
    if (v === 0 || v % labelEvery !== 0) continue;
    parts.push(<text key={`ly${v}`} x={X(xMin) - 7} y={Y(v) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">{v}</text>);
  }
  // ── THE CURVE ────────────────────────────────────────────────────────────
  // Drawn from its coefficients, so the line on screen IS the function the
  // lesson names. Points outside the frame are dropped rather than clamped (see
  // parabolaLayout): a parabola pinned to the top edge would draw a flat shelf
  // and claim the curve stops rising.
  if (spec.curve) {
    const curve = parabolaLayout({ ...spec.curve, xMin, xMax, yMin, yMax });
    curve.runs.forEach((run, i) => {
      const d = run.map(([x, y], j) => `${j === 0 ? "M" : "L"} ${X(x).toFixed(2)} ${Y(y).toFixed(2)}`).join(" ");
      parts.push(
        <path key={`cv${i}`} d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />,
      );
    });
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
  // ── THE RISE/RUN TRIANGLE ────────────────────────────────────────────────
  // Two legs and a right angle, labelled with their own lengths. The QUOTIENT
  // is deliberately not printed: rise ÷ run is the calculation the lesson asks
  // for, so stating the answer would answer the picture's own question.
  if (spec.gradient) {
    const tri = gradientLayout(spec.gradient);
    const [x0, y0] = tri.from;
    const [x1, y1] = tri.corner;
    const [x2, y2] = tri.to;
    parts.push(
      <path
        key="grad"
        d={`M ${X(x0)} ${Y(y0)} L ${X(x1)} ${Y(y1)} L ${X(x2)} ${Y(y2)}`}
        fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="5 4"
      />,
    );
    // The right-angle marker, drawn small and at the corner that owns it.
    const arm = 8;
    const sx = x1 >= x0 ? -arm : arm;
    const sy = y1 >= y2 ? arm : -arm;
    parts.push(
      <path
        key="gradrt"
        d={`M ${X(x1) + sx} ${Y(y1)} L ${X(x1) + sx} ${Y(y1) + sy} L ${X(x1)} ${Y(y1) + sy}`}
        fill="none" stroke="var(--accent)" strokeWidth={1.5}
      />,
    );
    parts.push(
      <text key="grun" x={(X(x0) + X(x1)) / 2} y={Y(y1) + (y1 >= y0 ? 15 : -7)} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="var(--text)">{tri.runLabel}</text>,
    );
    parts.push(
      <text key="grise" x={X(x1) + (x1 >= x0 ? 7 : -7)} y={(Y(y1) + Y(y2)) / 2 + 4} textAnchor={x1 >= x0 ? "start" : "end"} fontSize={11.5} fontWeight={700} fill="var(--text)">{tri.riseLabel}</text>,
    );
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
      // A HALO, because a point label sits ON a grid — and often on the line it
      // is naming. `c` on y = 2x − 1 was drawn straight through the line at the
      // intercept; a surface-coloured outline behind the glyph keeps it legible
      // without moving it away from the point it labels.
      parts.push(
        <text
          key={`ptl${i}`} x={X(p.at[0]) + 10} y={Y(p.at[1]) - 9}
          fontSize={12.5} fontWeight={700} fill="var(--text)"
          stroke="var(--surface)" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round"
        >{p.label}</text>,
      );
    }
  }
  return <svg viewBox={`0 0 ${AX_SIDE} ${AX_SIDE}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

/** One marked sector of a pie chart. The sector's ANGLE is drawn (it is in the
 *  prompt); the FRACTION it equals is not, because that is the answer.
 *
 *  The geometry comes from `lib/figures.ts#pieLayout`, not from here: the offline
 *  twin draws the same chart in another language, and two copies of one arc is
 *  one copy too many when the claim is "this shading IS that fraction". */
function Pie({ spec }: { spec: Extract<FigureSpec, { kind: "pie" }> }) {
  const L = pieLayout(spec);
  const { cx: c, cy: cy, radius: PIE_R, degrees: deg } = L;
  const parts: React.ReactNode[] = [
    <circle key="whole" cx={c} cy={cy} r={PIE_R} fill="var(--surface-sunken)" stroke="var(--line)" strokeWidth={1.5} />,
  ];
  if (L.full) {
    parts.push(<circle key="all" cx={c} cy={cy} r={PIE_R} fill="var(--accent)" />);
  } else if (deg > 0) {
    parts.push(
      <path
        key="sector"
        d={`M ${c} ${cy} L ${L.arcFrom[0]} ${L.arcFrom[1]} A ${PIE_R} ${PIE_R} 0 ${L.largeArc ? 1 : 0} 1 ${L.arcTo[0]} ${L.arcTo[1]} Z`}
        fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5}
      />,
    );
  }
  // ── THE CUTS, WHEN THE SPEC ASKS FOR THEM ────────────────────────────────
  //
  // A shaded sector says "this much". The same shading with the circle cut into
  // six equal pieces says "four of six" — which is a different fact, and the one
  // a learner needs before they can see that 2/3 and 4/6 are the same amount.
  // Drawn OVER the fill and UNDER the caption, in the page's line colour so a
  // greyscale print still shows the pieces.
  for (const d of L.divisions) {
    const a = -Math.PI / 2 + (d * Math.PI) / 180;
    parts.push(
      <line
        key={`cut-${d}`}
        x1={c} y1={cy}
        x2={c + PIE_R * Math.cos(a)} y2={cy + PIE_R * Math.sin(a)}
        stroke="var(--line)" strokeWidth={1.25}
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
  if (L.labelText) {
    // The caption is FITTED to the frame instead of trusted to fit it: a long
    // sector name steps the size down (0.55em/char is close enough for a width
    // estimate) until it is inside the chart's own width. The floor stops the
    // shrinking at 10px, where a name that still overflows is a content problem
    // rather than a rendering one.
    const usable = L.width - 12;
    let fontSize = 15;
    while (fontSize > 10 && L.labelText.length * fontSize * 0.55 > usable) fontSize -= 1;
    parts.push(
      <text key="angle" x={c} y={cy + PIE_R + 22} textAnchor="middle" fontSize={fontSize} fontWeight={700} fill="var(--text)">
        {L.labelText}
      </text>,
    );
  }
  return <svg viewBox={`0 0 ${L.width} ${L.height}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

const NL_JUMP_LIFT = 30;

/**
 * A number line with one journey drawn on it.
 *
 * The arrow is the message: subtracting a negative travels RIGHT, and a learner
 * who believes minus signs are decoration has that belief contradicted by the
 * picture before any rule is stated. The geometry comes from
 * `lib/figures.ts#numberLineLayout`, so the direction drawn and the sign of the
 * journey are the same fact rather than two facts that happen to agree.
 *
 * The journey sits ABOVE the line and is joined to it by hairlines at each end:
 * a segment drawn ON the line would cover the ticks it is being read against.
 */
function NumberLine({ spec }: { spec: Extract<FigureSpec, { kind: "number-line" }> }) {
  const L = numberLineLayout(spec);
  const jy = L.baselineY - NL_JUMP_LIFT;
  const sign = L.direction === "right" ? 1 : L.direction === "left" ? -1 : 0;
  const head = 8;
  const parts: React.ReactNode[] = [
    <line key="axis" x1={NL_PAD - 12} y1={L.baselineY} x2={L.width - NL_PAD + 12} y2={L.baselineY} stroke="var(--line)" strokeWidth={1.5} />,
  ];
  for (const t of L.ticks) {
    parts.push(<line key={`t${t.value}`} x1={t.x} y1={L.baselineY - 5} x2={t.x} y2={L.baselineY + 5} stroke="var(--line)" strokeWidth={1.5} />);
    parts.push(
      <text key={`tl${t.value}`} x={t.x} y={L.baselineY + 21} textAnchor="middle" fontSize={12} fill="var(--text-muted)">{t.value}</text>,
    );
  }
  if (sign !== 0) {
    parts.push(
      <line key="jumpline" x1={L.fromX} y1={jy} x2={L.toX - sign * head * 1.4} y2={jy} stroke="var(--accent)" strokeWidth={2.5} />,
      <polygon
        key="arrowhead"
        points={`${L.toX},${jy} ${L.toX - sign * head * 1.6},${jy - head * 0.75} ${L.toX - sign * head * 1.6},${jy + head * 0.75}`}
        fill="var(--accent)"
      />,
    );
  }
  parts.push(
    <line key="tickFrom" x1={L.fromX} y1={L.baselineY - 6} x2={L.fromX} y2={jy - 4} stroke="var(--line-soft)" strokeWidth={1.5} strokeDasharray="4 4" />,
    <line key="tickTo" x1={L.toX} y1={L.baselineY - 6} x2={L.toX} y2={jy - 4} stroke="var(--line-soft)" strokeWidth={1.5} strokeDasharray="4 4" />,
    // The two ends the journey is read between, in the page's ink rather than on
    // a fill: a value label must stay legible in both themes.
    <text key="from" x={L.fromX} y={jy - 12} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">{spec.from}</text>,
    <text key="to" x={L.toX} y={jy - 12} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">{spec.to}</text>,
  );
  return <svg viewBox={`0 0 ${L.width} ${L.height}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

/**
 * A balance with unknown BAGS and known UNIT weights on each pan.
 *
 * Two shapes, not one: a bag is what you do not know the value of and a weight
 * is what you do, and the operation the plan teaches — take the same thing off
 * both pans — is only visible if a learner can count them separately. The beam
 * is level because the equation is a claim that the sides are equal; the picture
 * shows what equality LOOKS like before any symbol does.
 */
function Balance({ spec }: { spec: Extract<FigureSpec, { kind: "balance" }> }) {
  const L = balanceLayout(spec);
  const parts: React.ReactNode[] = [
    <line key="beam" x1={L.beam.x1} y1={L.beam.y} x2={L.beam.x2} y2={L.beam.y} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />,
    <polygon
      key="fulcrum"
      points={`${L.fulcrum.x},${L.fulcrum.y} ${L.fulcrum.x - 14},${L.fulcrum.baseY} ${L.fulcrum.x + 14},${L.fulcrum.baseY}`}
      fill="var(--surface-sunken)" stroke="var(--line)" strokeWidth={1.5}
    />,
    <line key="stand" x1={L.fulcrum.x} y1={L.fulcrum.y} x2={L.fulcrum.x} y2={L.fulcrum.baseY} stroke="var(--line)" strokeWidth={1.5} />,
  ];
  for (const pan of L.pans) {
    parts.push(
      // Hanger, then the pan drawn as an open vessel rather than a filled box:
      // the weights have to look like they are IN something.
      <line key={`hang${pan.side}`} x1={pan.centreX} y1={L.beam.y} x2={pan.centreX} y2={pan.topY} stroke="var(--line)" strokeWidth={1.5} />,
      // THE VESSEL IS DRAWN FROM THE LAYOUT'S OWN DEPTH. It used to be a fixed
      // 20px trapezoid while the contents were placed by arithmetic that ignored
      // it — bags above the rim, weight rows through the floor. `depth` and
      // `bottomY` are the shape the layout actually measured, so the drawing and
      // the claim "these are in the pan" cannot disagree.
      <path
        key={`pan${pan.side}`}
        d={`M ${pan.centreX - pan.width / 2} ${pan.topY} L ${pan.centreX + pan.width / 2} ${pan.topY} L ${pan.centreX + pan.width / 2 - 6} ${pan.bottomY} L ${pan.centreX - pan.width / 2 + 6} ${pan.bottomY} Z`}
        fill="var(--surface-sunken)" stroke="var(--line)" strokeWidth={1.5}
      />,
    );
    for (const [i, b] of pan.bags.entries()) {
      parts.push(
        <rect key={`bag${pan.side}${i}`} x={b.x} y={b.y} width={18} height={26} rx={4} fill="var(--accent)" opacity={0.85} />,
      );
    }
    for (const [i, u] of pan.units.entries()) {
      parts.push(<circle key={`unit${pan.side}${i}`} cx={u.x} cy={u.y} r={7} fill="var(--accent)" opacity={0.55} />);
    }
    // WHAT THE PAN HOLDS, under it. The shapes are countable and the label is
    // the same fact written down: a learner should not have to count twenty
    // weights to see that the right side of 3x + 5 = 20 is 20. The string comes
    // from `balanceLayout`, so it is derived from the counts drawn above it and
    // cannot say a different equation from the one in the lesson.
    parts.push(
      <text
        key={`label${pan.side}`}
        x={pan.centreX}
        y={pan.labelY}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill="var(--text)"
      >{pan.label}</text>,
    );
  }
  return <svg viewBox={`0 0 ${L.width} ${L.height}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

/**
 * An area model: a rectangle split into parts, each cell labelled with the
 * PRODUCT of its two bands (`3` against `x` is `3x`; `3` against `4` is `12`).
 *
 * The product is computed in `lib/figures.ts#areaTerm`, not written into the
 * spec, so a figure cannot pair a 3 with a 4 and print 34. Seeing `12` in the
 * corner is the whole teaching move: it is the term a learner who expands
 * `3x + 4` has left out.
 */
function Rectangle({ spec }: { spec: Extract<FigureSpec, { kind: "rectangle" }> }) {
  const L = rectangleLayout(spec);
  const parts: React.ReactNode[] = [];
  for (const [i, cell] of L.cells.entries()) {
    const w = cell.w - 4;
    const h = cell.h - 4;
    // An emphasised cell is the piece the lesson is about — in
    // `completing-square` the corner that was ADDED. A tint plus a heavier
    // accent edge, not a solid fill: the label stays in the page's ink, so it is
    // legible in both themes, and the emphasis survives a greyscale print as a
    // border weight rather than disappearing with the colour.
    parts.push(
      <g key={`cell${i}`}>
        <rect
          x={cell.x + 2} y={cell.y + 2} width={Math.max(0, w)} height={Math.max(0, h)}
          fill={cell.emphasis ? "var(--accent)" : "var(--surface-sunken)"}
          fillOpacity={cell.emphasis ? 0.22 : undefined}
          stroke={cell.emphasis ? "var(--accent)" : "var(--line)"}
          strokeWidth={cell.emphasis ? 2.5 : 1.5}
          rx={3}
        />,
        <text
          x={cell.x + cell.w / 2}
          y={cell.y + cell.h / 2 + 5}
          textAnchor="middle"
          fontSize={Math.max(11, Math.min(18, Math.min(cell.w, cell.h) / 2.2))}
          fontWeight={700}
          fill="var(--text)"
        >
          {cell.label}
        </text>
      </g>,
    );
  }
  return <svg viewBox={`0 0 ${L.width} ${L.height}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

/**
 * A surd, as a tiling. √50 = 5√2 says a square of area 50 is 25 squares of area
 * 2 with five along each edge — which is what is drawn, one rect per cell, from
 * a layout that computes the grid out of the two authored numbers.
 *
 * A spec whose parts do not tile the square draws NOTHING: a ragged final row
 * would be a picture of a division that does not exist, and this is the one
 * figure whose entire claim is that the tiling is exact.
 */
function SurdSquare({ spec }: { spec: Extract<FigureSpec, { kind: "surd-square" }> }) {
  const L = surdSquareLayout(spec);
  if (!L.exact) return null;
  const parts: React.ReactNode[] = [];
  for (const [i, c] of L.cells.entries()) {
    parts.push(
      <rect
        key={`sq${i}`}
        x={c.x} y={c.y} width={c.w} height={c.h}
        fill="var(--surface-sunken)" stroke="var(--line)" strokeWidth={1}
      />,
    );
  }
  const last = L.cells[L.cells.length - 1];
  parts.push(
    <rect
      key="outline"
      x={L.cells[0].x} y={L.cells[0].y} width={L.cells[0].w * L.n} height={L.cells[0].h * L.n}
      fill="none" stroke="var(--line)" strokeWidth={2.5}
    />,
  );
  parts.push(
    <text key="cell" x={last.x + last.w / 2} y={last.y + last.h / 2 + 5} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{L.cellLabel}</text>,
  );
  // THE EDGE LABEL IS THE WHOLE POINT: five of the small sides along one edge is
  // 5√2, which is the simplified surd.
  parts.push(
    <text key="side" x={L.cells[0].x} y={L.cells[0].y - 10} textAnchor="start" fontSize={13} fontWeight={700} fill="var(--text)">{L.sideLabel}</text>,
  );
  return <svg viewBox={`0 0 ${L.width} ${L.height}`} role="presentation" aria-hidden="true">{parts}</svg>;
}

/** THE DRAWING, WITHOUT A FRAME AROUND IT.
 *
 *  A question wraps its figure in `<figure class="qfigure">`; a LESSON already
 *  has a `<figure>` of its own, because a lesson figure carries a `<figcaption>`
 *  that is part of the teaching. Rendering the question's frame inside the
 *  lesson's produced `figure > figure`, which is not what a figure is for: the
 *  caption then belongs to the outer one and the inner one is a figure with no
 *  content of its own.
 *
 *  So the drawing is exported on its own and both surfaces wrap it themselves.
 *  ONE renderer still: two wrappers, one set of shapes. */
export function FigureGraphic({ spec }: { spec: FigureSpec }) {
  return (
    <>
      {spec.kind === "axes" && <Axes spec={spec} />}
      {spec.kind === "pie" && <Pie spec={spec} />}
      {spec.kind === "right-triangle" && <RightTriangle spec={spec} />}
      {spec.kind === "number-line" && <NumberLine spec={spec} />}
      {spec.kind === "balance" && <Balance spec={spec} />}
      {spec.kind === "rectangle" && <Rectangle spec={spec} />}
      {spec.kind === "surd-square" && <SurdSquare spec={spec} />}
    </>
  );
}

/** The figure, or nothing at all — a question with no diagram renders no box.
 *
 *  THE CAPTION IS WHAT MAKES `aria-hidden` HONEST. The header of this file used
 *  to say the stem states everything the drawing shows, so a screen reader loses
 *  nothing. Measured across the bank, that was false: `scatter-correlation` plots
 *  the data, and those points appear in no prompt — a learner was being asked
 *  about a chart they could not read. So the sentence is rendered here, composed
 *  from the same spec the drawing is (`lib/figures.ts#figureCaption`), in the
 *  interface's own language. It sits BEFORE the question text in the reading
 *  order, which is where a sighted reader's eye goes.
 */
export default function QuestionFigure({ spec }: { spec?: FigureSpec | null }) {
  const { lang } = useI18n();
  if (!spec) return null;
  const caption = figureCaptionText(lang, spec);
  return (
    <figure className="qfigure" data-figure={spec.kind}>
      <FigureGraphic spec={spec} />
      {caption && <figcaption className="qfigure-cap">{caption}</figcaption>}
    </figure>
  );
}
