import type { LessonFigureSpec } from "@/lib/lesson-figure";
import { barLayout, scatterLayout, treeLayout, vennLayout } from "@/lib/lesson-figure";

// THE LESSON'S DRAWING, WITH THE CAPTION THE AUTHOR WROTE.
//
// The SVG is aria-hidden for the same reason a question figure is: a screen
// reader reads a grid of unlabelled shapes as noise. Unlike a question figure,
// the caption here is not composed from the spec — it is teaching prose, and it
// is the thing a learner using assistive technology is meant to read. The
// browser walk checks that the caption, including its counts, reaches the
// accessibility tree, and that the SVG itself does not.
//
// No `role="img"` on the wrapper: that would make the caption presentational
// beneath an accessible name. The drawing is silent; the sentence is not.

function Venn({ spec }: { spec: Extract<LessonFigureSpec, { kind: "venn" }> }) {
  const L = vennLayout(spec);
  const [a, b] = L.circles;
  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <circle cx={a.cx} cy={a.cy} r={a.r} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeWidth={1.6} />
      <circle cx={b.cx} cy={b.cy} r={b.r} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeWidth={1.6} />
      <text x={a.labelX} y={a.labelY} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{a.label}</text>
      <text x={b.labelX} y={b.labelY} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{b.label}</text>
      {L.regions.map((region) => (
        <text
          key={region.key}
          data-region={region.key}
          x={region.x}
          y={region.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={16}
          fontWeight={700}
          fill="var(--text)"
        >
          {region.count}
        </text>
      ))}
      <text x={L.width - 8} y={L.height - 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">
        neither = outside both circles
      </text>
    </svg>
  );
}

function Tree({ spec, showPaths = true }: { spec: Extract<LessonFigureSpec, { kind: "tree" }>; showPaths?: boolean }) {
  const L = treeLayout(spec);
  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {L.edges.map((edge, index) => (
        <g key={`${edge.fromX}-${edge.fromY}-${edge.toX}-${edge.toY}-${index}`}>
          <line
            x1={edge.fromX}
            y1={edge.fromY}
            x2={edge.toX}
            y2={edge.toY}
            stroke="var(--line)"
            strokeWidth={1.6}
          />
          <text
            x={(edge.fromX + edge.toX) / 2}
            y={(edge.fromY + edge.toY) / 2 - 4}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-muted)"
          >
            {edge.label}
          </text>
        </g>
      ))}
      {L.firstNodes.map((node) => (
        <g key={`first-${node.x}-${node.y}`}>
          <circle cx={node.x} cy={node.y} r={3} fill="var(--accent)" />
          <text x={node.x} y={node.y - 9} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">
            {node.label}
          </text>
        </g>
      ))}
      {showPaths && L.paths.map((path) => (
        <text
          key={`${path.first}-${path.second}`}
          data-path={`${path.first}-${path.second}`}
          x={path.leafX + 8}
          y={path.leafY + 4}
          fontSize={11}
          fill="var(--text)"
        >
          {path.label}
        </text>
      ))}
      <text x={L.rootX} y={L.rootY - 10} fontSize={10} fill="var(--text-muted)">start</text>
    </svg>
  );
}

function Bar({ spec }: { spec: Extract<LessonFigureSpec, { kind: "bar" }> }) {
  const L = barLayout(spec);
  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <rect
        data-bar="whole"
        x={L.bar.x}
        y={L.bar.y}
        width={L.bar.w}
        height={L.bar.h}
        fill="var(--surface-sunken)"
        stroke="var(--line)"
        strokeWidth={1.5}
      />
      {L.parts.map((part, index) => (
        <g key={`${part.label}-${index}`}>
          <rect
            data-bar-part={index}
            data-units={part.units}
            data-shade={part.shade ? "true" : "false"}
            x={part.x}
            y={L.bar.y}
            width={part.width}
            height={L.bar.h}
            fill={part.shade ? "var(--accent)" : "var(--surface)"}
            fillOpacity={part.shade ? 0.22 : 1}
          />
          <text
            x={part.labelX}
            y={L.bar.y - 10}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="var(--text)"
          >
            {part.label}
          </text>
        </g>
      ))}
      {L.ticks.map((x, index) => (
        <line
          key={`tick-${index}`}
          x1={x}
          y1={L.bar.y}
          x2={x}
          y2={L.bar.y + L.bar.h}
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}
      <text
        x={L.width / 2}
        y={L.height - 8}
        textAnchor="middle"
        fontSize={11}
        fill="var(--text-muted)"
      >
        {L.totalLabel}
      </text>
    </svg>
  );
}

function Scatter({ spec }: { spec: Extract<LessonFigureSpec, { kind: "scatter" }> }) {
  const L = scatterLayout(spec);
  const tick = (value: number) => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {L.yTicks.map((entry) => (
        <g key={`y-${entry.value}`}>
          <line
            x1={L.plot.x}
            y1={entry.position}
            x2={L.plot.x + L.plot.w}
            y2={entry.position}
            stroke="var(--line)"
            strokeWidth={1}
            opacity={0.45}
          />
          <text
            x={L.plot.x - 6}
            y={entry.position}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={18}
            fill="var(--text-muted)"
          >
            {tick(entry.value)}
          </text>
        </g>
      ))}
      {L.xTicks.map((entry) => (
        <g key={`x-${entry.value}`}>
          <line
            x1={entry.position}
            y1={L.plot.y}
            x2={entry.position}
            y2={L.plot.y + L.plot.h}
            stroke="var(--line)"
            strokeWidth={1}
            opacity={0.45}
          />
          <line
            x1={entry.position}
            y1={L.plot.y + L.plot.h}
            x2={entry.position}
            y2={L.plot.y + L.plot.h + 4}
            stroke="var(--text-muted)"
            strokeWidth={1}
          />
          <text
            x={entry.position}
            y={L.plot.y + L.plot.h + 17}
            textAnchor="middle"
            fontSize={18}
            fill="var(--text-muted)"
          >
            {tick(entry.value)}
          </text>
        </g>
      ))}
      <line
        x1={L.plot.x}
        y1={L.plot.y}
        x2={L.plot.x}
        y2={L.plot.y + L.plot.h}
        stroke="var(--text)"
        strokeWidth={1.6}
      />
      <line
        x1={L.plot.x}
        y1={L.plot.y + L.plot.h}
        x2={L.plot.x + L.plot.w}
        y2={L.plot.y + L.plot.h}
        stroke="var(--text)"
        strokeWidth={1.6}
      />
      <text
        x={L.plot.x + L.plot.w / 2}
        y={L.height - 8}
        textAnchor="middle"
        fontSize={19}
        fontWeight={600}
        fill="var(--text)"
      >
        {spec.xLabel}
      </text>
      <text
        transform={`translate(12 ${L.plot.y + L.plot.h / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={19}
        fontWeight={600}
        fill="var(--text)"
      >
        {spec.yLabel}
      </text>
      {L.line && (
        <line
          data-scatter-line="fitted"
          x1={L.line.start.cx}
          y1={L.line.start.cy}
          x2={L.line.end.cx}
          y2={L.line.end.cy}
          stroke="var(--text-muted)"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      )}
      {L.points.map((point, index) => (
        <circle
          key={`${point.x}-${point.y}-${index}`}
          data-scatter-point={index}
          data-x={point.x}
          data-y={point.y}
          cx={point.cx}
          cy={point.cy}
          r={4.5}
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth={1.4}
        />
      ))}
    </svg>
  );
}

export function LessonFigure({
  spec,
  caption,
  showPaths = true,
}: {
  spec: LessonFigureSpec;
  caption: string;
  /** Hide the leaf totals when the drawing is an assessment surface rather than
   *  a worked representation. The branch probabilities stay visible. */
  showPaths?: boolean;
}) {
  return (
    <div className="authored-figure" data-figure={spec.kind} style={{ marginTop: 12 }}>
      <div style={{ maxWidth: spec.kind === "scatter" ? 320 : 440, margin: "0 auto" }}>
        {spec.kind === "venn" ? (
          <Venn spec={spec} />
        ) : spec.kind === "tree" ? (
          <Tree spec={spec} showPaths={showPaths} />
        ) : spec.kind === "scatter" ? (
          <Scatter spec={spec} />
        ) : (
          <Bar spec={spec} />
        )}
      </div>
      <p className="reading small muted authored-figure-cap" style={{ marginTop: 8 }}>
        {caption}
      </p>
    </div>
  );
}
