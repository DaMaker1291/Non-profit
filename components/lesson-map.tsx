"use client";

// ONE LEARNING MAP, DRAWN FOR EVERY LESSON.
//
// This is deliberately a separate component from the question-figure renderer.
// A question figure must never give away its answer; a learning map has no answer
// to give. It shows prerequisites, this idea and what comes next, in the genome's
// own order. The SVG is aria-hidden and the caption carries the lesson: the map
// is a navigation aid, not a replacement for the teaching.
import { ctitle } from "@/lib/content-i18n";
import { useI18n } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { listNames } from "@/lib/i18n-lessons";
import { lessonMapFor, wrapLessonMapLabel } from "@/lib/lesson-map";

function labelFor(id: string, lang: string): string {
  return ctitle(lang, id);
}

export function LessonMap({ conceptId }: { conceptId: string }) {
  const { lang, t } = useI18n();
  const map = lessonMapFor(conceptId);
  if (!map) return null;
  const before = map.nodes.filter((n) => n.role === "before");
  const after = map.nodes.filter((n) => n.role === "after");
  const nearby = map.nodes.filter((n) => n.role === "nearby");
  const beforeNames = before.map((n) => labelFor(n.id, lang));
  const afterNames = after.map((n) => labelFor(n.id, lang));
  const nearbyNames = nearby.map((n) => labelFor(n.id, lang));
  const conceptName = labelFor(conceptId, lang);
  const caption = [
    beforeNames.length
      ? fill(t("lesson.mapAfter"), { concept: conceptName, names: listNames(lang, beforeNames) })
      : fill(t("lesson.mapStart"), { concept: conceptName }),
    afterNames.length
      ? fill(t("lesson.mapNext"), { names: listNames(lang, afterNames) })
      : nearbyNames.length
        ? fill(t("lesson.mapNearby"), { names: listNames(lang, nearbyNames) })
        : t("lesson.mapEnd"),
    t("lesson.mapNote"),
  ].join(" ");

  return (
    <figure className="lesson-map" data-map="learning-path" data-concept={conceptId}>
      <div className="lesson-map-scroll">
        <svg
          viewBox={`0 0 ${map.width} ${map.height}`}
          role="presentation"
          aria-hidden="true"
          focusable="false"
          style={{ maxWidth: map.width }}
        >
          {map.edges.map((edge, i) => {
            const angle = Math.atan2(edge.y2 - edge.y1, edge.x2 - edge.x1);
            const head = 11;
            const a = 0.42;
            return (
              <g key={`${edge.from}-${edge.to}-${i}`} className="lesson-map-edge">
                <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} />
                <polygon
                  points={[
                    `${edge.x2},${edge.y2}`,
                    `${edge.x2 - head * Math.cos(angle - a)},${edge.y2 - head * Math.sin(angle - a)}`,
                    `${edge.x2 - head * Math.cos(angle + a)},${edge.y2 - head * Math.sin(angle + a)}`,
                  ].join(" ")}
                />
              </g>
            );
          })}
          {map.nodes.map((node) => {
            const lines = wrapLessonMapLabel(labelFor(node.id, lang));
            const lineHeight = 15;
            const startY = node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + 4;
            return (
              <g key={node.id} className={`lesson-map-node ${node.role}`} data-node={node.id}>
                <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={10} />
                {lines.map((line, i) => (
                  <text key={i} x={node.x + node.width / 2} y={startY + i * lineHeight} textAnchor="middle">
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="small muted reading">{caption}</figcaption>
    </figure>
  );
}