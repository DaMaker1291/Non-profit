"use client";

// The full-subject theory map. The SVG is aria-hidden and the caption carries
// the claim for a screen reader; the concept list below the disclosure remains
// the clickable route into every lesson.
import { ctitle } from "@/lib/content-i18n";
import { useI18n } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { wrapLessonMapLabel } from "@/lib/lesson-map";
import { theoryMapFor } from "@/lib/theory-map";
import type { SubjectId } from "@/lib/types";

export function SubjectTheoryMap({ subject }: { subject: SubjectId }) {
  const { lang, t } = useI18n();
  const map = theoryMapFor(subject);
  if (!map) return null;
  const subjectName = t(`subj.${subject}`);
  const caption = fill(t("theory.caption"), { n: map.nodes.length, subject: subjectName });

  return (
    <figure className="theory-map" data-map="subject-theory" data-subject={subject}>
      {/* The graph is a left-to-right prerequisite sequence even when the UI is
          RTL. Without `dir="ltr"` an Arabic page opens the scroller at its right
          edge, on the concepts nothing has unlocked yet. */}
      <div className="theory-map-scroll" dir="ltr">
        <svg
          viewBox={`0 0 ${map.width} ${map.height}`}
          width={map.width}
          height={map.height}
          role="presentation"
          aria-hidden="true"
          focusable="false"
        >
          {map.edges.map((edge) => (
            <line
              key={`${edge.from}-${edge.to}`}
              className="theory-map-edge"
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
            />
          ))}
          {map.nodes.map((node) => {
            const lines = wrapLessonMapLabel(ctitle(lang, node.id));
            const lineHeight = 13;
            const startY = node.y + node.height / 2 - ((lines.length - 1) * lineHeight) / 2 + 4;
            return (
              <g key={node.id} className="theory-map-node" data-node={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={8}
                />
                {lines.map((line, i) => (
                  <text
                    key={i}
                    x={node.x + node.width / 2}
                    y={startY + i * lineHeight}
                    textAnchor="middle"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="theory-map-caption small muted">{caption}</figcaption>
    </figure>
  );
}
