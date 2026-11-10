"use client";

// Every lesson gets three doors: the idea, one worked example and real practice.
// All three are IN this lesson. Provider SEARCH links used to sit below them and
// were removed: a search page is not a recommendation, and it asked the learner
// to find the relevant material themselves. Exact-concept resources are chosen
// by lib/exact-resources.ts; a provider is never offered as a brand shortcut.
//
// No new copy is invented here. The labels come from the existing dictionary
// (`try.learnMore`, `plan.start`, `worked.eyebrow`, `learn.practice`), so all
// fifteen interface languages already have them.
import { useI18n } from "@/lib/client";
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

  return (
    <section className="card soft study-tools" aria-label={t("try.learnMore")} data-subject={subject} data-concept={conceptId}>
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
    </section>
  );
}
