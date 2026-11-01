"use client";

// A coordinate grid a learner actually plots on: tap or click to place a point
// on the question's own scale, tap it again to remove it, join the points with a
// straight line. The coordinate field below the grid is NOT a fallback bolted on
// afterwards — it is the keyboard path, and every plotted point is listed with
// its coordinates so the answer is readable without seeing the picture.
//
// The value the paper submits is the MATHEMATICS — `{ points, line }` as JSON —
// never a screenshot and never pixels. The target points and the intended line
// live on the server; this component only knows the grid's bounds.

import { useMemo, useState } from "react";
import { clipToBounds, definingLine, lineThrough, type PlotLine, type PlotPoint } from "@/lib/plot-geometry";

export interface GraphBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

type Pt = { x: number; y: number };

const W = 360;
const H = 300;
const PAD = 30;

const px = (x: number, b: GraphBounds) => PAD + ((x - b.xMin) / (b.xMax - b.xMin)) * (W - 2 * PAD);
const py = (y: number, b: GraphBounds) => H - PAD - ((y - b.yMin) / (b.yMax - b.yMin)) * (H - 2 * PAD);

/** Read a controlled value defensively: a malformed string draws an empty grid
 *  rather than throwing during a sitting. The line is an explicit object; a
 *  legacy `true` is migrated once from the points, which is what it used to
 *  mean. */
function read(value: string): { points: Pt[]; line: PlotLine | null } {
  try {
    const data = JSON.parse(value) as { points?: unknown; line?: unknown };
    if (!Array.isArray(data?.points)) return { points: [], line: null };
    const points: Pt[] = [];
    for (const p of data.points) {
      if (!Array.isArray(p) || p.length !== 2) continue;
      const [x, y] = p;
      if (typeof x === "number" && typeof y === "number" && Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
      }
    }
    const line = data.line === true ? definingLine(points) : data.line;
    if (!line || typeof line !== "object") return { points, line: null };
    const readPoint = (v: unknown): PlotPoint | null => {
      // The answer stores a point as [x, y]; a hand-written object is accepted
      // too, because the renderer must not lose a line over its spelling.
      if (Array.isArray(v) && v.length === 2 && Number.isFinite(v[0]) && Number.isFinite(v[1])) {
        return { x: Number(v[0]), y: Number(v[1]) };
      }
      const p = v as { x?: number; y?: number } | null;
      return Number.isFinite(p?.x) && Number.isFinite(p?.y)
        ? { x: Number(p!.x), y: Number(p!.y) }
        : null;
    };
    const l = line as { a?: unknown; b?: unknown };
    const a = readPoint(l.a);
    const b = readPoint(l.b);
    return { points, line: a && b ? lineThrough(a, b) : null };
  } catch {
    return { points: [], line: null };
  }
}

export default function GraphPlot({
  bounds,
  value,
  onChange,
  label,
}: {
  bounds: GraphBounds;
  value: string;
  onChange: (next: string) => void;
  label: string;
}) {
  const { points, line } = useMemo(() => read(value), [value]);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");

  const emit = (nextPoints: Pt[], nextLine: PlotLine | null) => {
    onChange(nextPoints.length === 0 && !nextLine ? "" : JSON.stringify({
      points: nextPoints.map((p) => [p.x, p.y]),
      line: nextLine ? { a: [nextLine.a.x, nextLine.a.y], b: [nextLine.b.x, nextLine.b.y] } : null,
    }));
  };

  /** THE LINE IS FIXED WHEN IT IS DRAWN. Adding or removing points afterwards
   *  must not move the line the learner is looking at, so the endpoints are
   *  stored in the answer instead of being recomputed from the point list. */
  const toggleLine = (on: boolean) => {
    if (!on) { emit(points, null); return; }
    const candidate = line ?? definingLine(points);
    if (!candidate) { setErr("Plot at least two different points before joining them."); return; }
    setErr("");
    emit(points, candidate);
  };

  const toggle = (x: number, y: number) => {
    const existing = points.findIndex((p) => p.x === x && p.y === y);
    if (existing >= 0) {
      emit(points.filter((_, i) => i !== existing), line);
      return;
    }
    if (points.length >= 12) {
      setErr("Twelve points is the most this grid accepts.");
      return;
    }
    setErr("");
    emit([...points, { x, y }], line);
  };

  const fromPointer = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    const sy = ((e.clientY - r.top) / r.height) * H;
    const x = Math.round(bounds.xMin + ((sx - PAD) / (W - 2 * PAD)) * (bounds.xMax - bounds.xMin));
    const y = Math.round(bounds.yMin + (((H - PAD) - sy) / (H - 2 * PAD)) * (bounds.yMax - bounds.yMin));
    if (x < bounds.xMin || x > bounds.xMax || y < bounds.yMin || y > bounds.yMax) return;
    toggle(x, y);
  };

  const addTyped = () => {
    const nums = draft.match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length < 2) {
      setErr("Enter a point as x,y — for example 2,3.");
      return;
    }
    const x = Number(nums[0]);
    const y = Number(nums[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)
      || x < bounds.xMin || x > bounds.xMax || y < bounds.yMin || y > bounds.yMax) {
      setErr(`That point is outside the grid (x ${bounds.xMin} to ${bounds.xMax}, y ${bounds.yMin} to ${bounds.yMax}).`);
      return;
    }
    if (points.some((p) => p.x === x && p.y === y)) {
      setErr("That point is already plotted.");
      return;
    }
    setErr("");
    setDraft("");
    emit([...points, { x, y }], line);
  };

  const seg = clipToBounds(line, bounds);
  const xs: number[] = [];
  for (let x = Math.ceil(bounds.xMin); x <= Math.floor(bounds.xMax); x++) xs.push(x);
  const ys: number[] = [];
  for (let y = Math.ceil(bounds.yMin); y <= Math.floor(bounds.yMax); y++) ys.push(y);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${label}. A grid with x from ${bounds.xMin} to ${bounds.xMax} and y from ${bounds.yMin} to ${bounds.yMax}, with ${points.length} point${points.length === 1 ? "" : "s"} plotted.`}
        onClick={fromPointer}
        data-plot-points={points.length}
        data-plot-line={seg ? `${seg[0].x},${seg[0].y} ${seg[1].x},${seg[1].y}` : ""}
        style={{ width: "100%", maxWidth: 460, height: "auto", border: "1px solid var(--rule, #e5e7eb)", borderRadius: 10, background: "var(--surface, #fff)", touchAction: "manipulation", cursor: "crosshair" }}
      >
        {xs.map((x) => (
          <line key={`gx${x}`} x1={px(x, bounds)} x2={px(x, bounds)} y1={PAD} y2={H - PAD}
            stroke="var(--rule, #e5e7eb)" strokeWidth={x === 0 ? 0 : 0.5} />
        ))}
        {ys.map((y) => (
          <line key={`gy${y}`} x1={PAD} x2={W - PAD} y1={py(y, bounds)} y2={py(y, bounds)}
            stroke="var(--rule, #e5e7eb)" strokeWidth={y === 0 ? 0 : 0.5} />
        ))}
        {bounds.yMin <= 0 && bounds.yMax >= 0 && (
          <line x1={PAD} x2={W - PAD} y1={py(0, bounds)} y2={py(0, bounds)} stroke="var(--ink-2, #273640)" strokeWidth={1.5} />
        )}
        {bounds.xMin <= 0 && bounds.xMax >= 0 && (
          <line x1={px(0, bounds)} x2={px(0, bounds)} y1={PAD} y2={H - PAD} stroke="var(--ink-2, #273640)" strokeWidth={1.5} />
        )}
        {xs.map((x) => (
          <text key={`tx${x}`} x={px(x, bounds)} y={H - PAD + 14} textAnchor="middle"
            fontSize={9} fill="var(--ink-2, #273640)">{x}</text>
        ))}
        {ys.map((y) => (
          <text key={`ty${y}`} x={PAD - 6} y={py(y, bounds) + 3} textAnchor="end"
            fontSize={9} fill="var(--ink-2, #273640)">{y}</text>
        ))}
        {seg && (
          <line x1={px(seg[0].x, bounds)} y1={py(seg[0].y, bounds)}
            x2={px(seg[1].x, bounds)} y2={py(seg[1].y, bounds)}
            stroke="var(--teal, #126B68)" strokeWidth={2} />
        )}
        {points.map((p, i) => (
          <g key={`p${i}`}>
            <circle cx={px(p.x, bounds)} cy={py(p.y, bounds)} r={5}
              fill="var(--teal, #126B68)" stroke="var(--surface, #fff)" strokeWidth={2} />
            <text x={px(p.x, bounds) + 8} y={py(p.y, bounds) - 8} fontSize={10}
              fill="var(--ink-2, #273640)">{`(${p.x}, ${p.y})`}</text>
          </g>
        ))}
      </svg>
      <p className="small muted" style={{ margin: 0 }}>
        Tap or click the grid to plot a point; tap a plotted point to remove it. The field below does the same from the keyboard.
        {" "}The line stays where it is when you add or remove points; switch it off and on to redraw it through the current points.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="2,3"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setErr(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTyped(); } }}
          aria-label={`${label}: add a point as x,y`}
          style={{ padding: "8px 10px", border: "1px solid var(--rule, #e5e7eb)", borderRadius: 8, width: 110 }}
        />
        <button type="button" className="btn" onClick={addTyped}>Add point</button>
        <button
          type="button"
          className="btn ghost small"
          aria-pressed={!!line}
          onClick={() => toggleLine(!line)}
        >
          {line ? "Line drawn — remove it" : "Join my points with a straight line"}
        </button>
      </div>
      {err && <p className="small" role="alert" style={{ margin: 0, color: "var(--danger, #b42318)" }}>{err}</p>}
      {points.length > 0 && (
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          {points.map((p, i) => (
            <li key={`row${i}`}>
              ({p.x}, {p.y}){" "}
              <button
                type="button"
                onClick={() => emit(points.filter((_, j) => j !== i), line)}
                aria-label={`Remove point (${p.x}, ${p.y})`}
                style={{ background: "none", border: "none", color: "var(--teal, #126B68)", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}
              >remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
