"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ALL SUBJECTS — the universal atlas.
//
// The five graded subjects are OpenMind courses. The twenty-one further routes are
// external open courses with video and diagrams, a subject map, and an explicit
// "not graded by OpenMind" badge. No route asks for a country, so every country
// reaches every route; the interface and map are translated in all 15
// dictionaries, while the external course's own language is printed.
//
// This page deliberately reads NO profile and NO curriculum. A subject route is
// not a national syllabus claim, and filtering by country would imply one. The
// only personalised door is the graded lesson link, which already owns its own
// course resolution.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useI18n } from "@/lib/client";
import { SubjectAtlasMap } from "@/components/subject-atlas-map";
import {
  ATLAS_EXTERNAL_COUNT,
  ATLAS_GRADED_COUNT,
  ATLAS_TOTAL_COUNT,
  SUBJECT_ATLAS,
  type AtlasSubject,
} from "@/lib/subject-atlas";

function labelFor(subject: AtlasSubject, t: (key: string) => string): string {
  return t(subject.labelKey);
}

export default function AllSubjectsPage() {
  const { t } = useI18n();
  const graded = SUBJECT_ATLAS.filter((s) => s.graded);
  const routes = SUBJECT_ATLAS.filter((s) => !s.graded);

  return (
    <main className="container page">
      <div className="page-head">
        <h1>{t("atlas.title")}</h1>
        <p className="lead">{t("atlas.lead")}</p>
        <p className="small muted mono">
          {ATLAS_TOTAL_COUNT} · {ATLAS_GRADED_COUNT} {t("atlas.graded")} · {ATLAS_EXTERNAL_COUNT} {t("atlas.route")}
        </p>
      </div>

      <section aria-labelledby="atlas-graded">
        <h2 id="atlas-graded">{t("atlas.graded")}</h2>
        <div className="grid cols2">
          {graded.map((subject) => {
            const label = labelFor(subject, t);
            return (
              <Link key={subject.id} href={subject.href ?? "/learn"} className="card atlas-card">
                <div className="atlas-card-head">
                  <h3>{label}</h3>
                  <span className="chip good">{t("atlas.graded")}</span>
                </div>
                <p>{subject.question}</p>
                <SubjectAtlasMap subject={subject} title={label} caption={t("atlas.mapCaption")} />
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="atlas-routes" style={{ marginTop: "var(--s4)" }}>
        <h2 id="atlas-routes">{t("atlas.route")}</h2>
        <p className="small muted" style={{ marginTop: 0 }}>{t("atlas.englishNote")}</p>
        <div className="grid cols2">
          {routes.map((subject) => {
            const label = labelFor(subject, t);
            const course = subject.course;
            if (!course) return null;
            return (
              <article key={subject.id} className="card atlas-card">
                <div className="atlas-card-head">
                  <h3>{label}</h3>
                  <span className="chip">{t("atlas.notGraded")}</span>
                </div>
                <p>{subject.question}</p>
                <SubjectAtlasMap subject={subject} title={label} caption={t("atlas.mapCaption")} />
                <p className="small muted">{course.summary}</p>
                <p className="small muted">
                  {course.source} · {course.language} · {t(`lesson.videoCaptions${course.captions === "unknown" ? "Unknown" : course.captions === "human" ? "Human" : course.captions === "auto" ? "Auto" : "None"}`)}
                </p>
                <a
                  className="btn ghost small"
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("atlas.open")} · {course.title} ↗
                </a>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
