"use client";

// Every lesson gets the same four doors: the idea, one worked example, real
// practice, and a route to another provider's video, visual model or exam
// questions. The first three are IN this lesson and are the ones that teach;
// the external links are discovery, not a substitute for the teaching.
//
// No new copy is invented here. The labels come from the existing dictionary
// (`try.learnMore`, `plan.start`, `worked.eyebrow`, `learn.practice`), so all
// fifteen interface languages already have them. The first door is called
// "Start here" rather than "The idea" because the page's own source-order check
// uses the first `learn.idea` as the start of the teaching; a navigation label
// carrying the same string above it would make that check point at the door
// instead of the lesson. Brand names stay as brands.
import { useI18n } from "@/lib/client";
import { studyResourcesFor } from "@/lib/lesson-resources";
import type { SubjectId } from "@/lib/types";

export default function LessonStudyTools({
  conceptId,
  subject,
  onPractise,
}: {
  conceptId: string;
  subject: SubjectId;
  onPractise: () => void;
}) {
  const { t } = useI18n();
  const resources = studyResourcesFor(conceptId, subject);

  return (
    <section className="card soft study-tools" aria-label={t("try.learnMore")}>
      <p className="eyebrow" style={{ margin: 0 }}>{t("try.learnMore")}</p>

      <div className="study-steps">
        <a className="study-step" href="#lesson-idea">
          <span className="study-step-num" aria-hidden="true">01</span>
          <span>{t("plan.start")}</span>
        </a>
        <a className="study-step" href="#lesson-worked">
          <span className="study-step-num" aria-hidden="true">02</span>
          <span>{t("worked.eyebrow")}</span>
        </a>
        <button type="button" className="study-step" onClick={onPractise}>
          <span className="study-step-num" aria-hidden="true">03</span>
          <span>{t("learn.practice")}</span>
        </button>
      </div>

      <p className="study-links-label small muted">{t("rights.note.external_link")}</p>
      <div className="study-links">
        {resources.map((resource) => (
          <a
            key={resource.id}
            className="study-link"
            data-kind={resource.kind}
            href={resource.url}
            target="_blank"
            rel="noreferrer noopener"
            title={`${resource.label} — ${t("nav.search")}`}
          >
            <span aria-hidden="true">{resource.kind === "visual" ? "◇" : resource.kind === "exam" ? "≣" : "▶"}</span>
            <span>{resource.label}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
