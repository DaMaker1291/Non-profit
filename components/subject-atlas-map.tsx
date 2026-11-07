import type { AtlasSubject } from "@/lib/subject-atlas";
import {
  ATLAS_MAP_HEIGHT,
  ATLAS_MAP_WIDTH,
  atlasMapLayout,
  wrapAtlasLabel,
} from "@/lib/subject-atlas";

/**
 * A subject map: the route's five questions, drawn as a route overview.
 *
 * The SVG is `aria-hidden`; the visible caption is the accessible claim. The
 * lines come from geometry in lib/subject-atlas.ts so a gate can assert they
 * stay inside the frame, never overlap a box and do not imply causation.
 */
export function SubjectAtlasMap({
  subject,
  title,
  caption,
}: {
  subject: AtlasSubject;
  title: string;
  caption: string;
}) {
  const layout = atlasMapLayout(subject);
  const centreLines = wrapAtlasLabel(title, 22).slice(0, 2);
  return (
    <figure className="atlas-map">
      <svg
        viewBox={`0 0 ${ATLAS_MAP_WIDTH} ${ATLAS_MAP_HEIGHT}`}
        role="presentation"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          x={layout.centre.x}
          y={layout.centre.y}
          width={layout.centre.width}
          height={layout.centre.height}
          rx="14"
          className="atlas-map-centre"
        />
        {layout.edges.map((edge) => (
          <line
            key={edge.index}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            className="atlas-map-edge"
          />
        ))}
        {centreLines.map((line, i) => (
          <text
            key={line + i}
            x={layout.centre.x + layout.centre.width / 2}
            y={layout.centre.y + (centreLines.length === 1 ? 41 : 32 + i * 18)}
            textAnchor="middle"
            className="atlas-map-centre-text"
          >
            {line}
          </text>
        ))}
        {layout.nodes.map((node) => (
          <g key={node.index}>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="10"
              className="atlas-map-node"
            />
            {node.lines.map((line, i) => (
              <text
                key={line + i}
                x={node.x + 14}
                y={node.y + (node.lines.length === 1 ? 29 : 20 + i * 16)}
                className="atlas-map-node-text"
              >
                {line}
              </text>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="small muted">{caption}</figcaption>
    </figure>
  );
}
