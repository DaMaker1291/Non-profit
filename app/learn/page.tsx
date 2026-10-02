"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LEARN — the index behind the sidebar's "Learn": WHAT this learner studies,
// and where each subject stands.
//
// WHY IT EXISTS. `/learn` is the second item in the sidebar, the second in the
// phone's bottom bar, step 01 of Help, the landing page's student card, and the
// destination of the curriculum and papers CTAs — and it had no page at all, so
// every one of those doors opened Next's own "This page could not be found".
// The product's primary navigation was the dead end.
//
// It is a SUBJECT index, not a concept list. `/learn/<subject>` already lists
// concepts with their own evidence, and a second list here would put two
// answers to "what should I learn?" in the same menu. What only this screen can
// say is which subjects are this learner's, which course each one is being
// taught as, and how much of it they have actually touched.
//
// NOTHING HERE IS INFERRED. A subject with no answers says "Not yet measured" —
// the words the evidence pages use — and a subject whose course is incomplete
// NAMES the missing field and points at the screen that sets it, rather than
// counting coverage against a qualification nobody chose.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useI18n, useProfile } from "@/lib/client";
import { bySubject } from "@/lib/genome";
import { fill } from "@/lib/i18n";
import { levelLabel } from "@/lib/content-i18n";
import { courseGaps, coverageOf, specForProfile } from "@/lib/specifications";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { FIELD_LABEL } from "@/components/course-first";
import type { SubjectId } from "@/lib/types";

export default function LearnIndexPage() {
  const { t, lang } = useI18n();
  const { state, loading } = useProfile();
  const profile = state?.profile;
  const declared = profile?.subjects ?? [];
  // The learner's OWN subjects once they have declared any; the platform's five
  // otherwise (the same rule the sidebar uses). Never a course they did not pick.
  const subjects: SubjectId[] = declared.length > 0 ? declared : SUBJECT_IDS;

  if (loading) {
    return (
      <main className="container page">
        <p className="muted">{t("common.loading")}</p>
      </main>
    );
  }

  const rows = subjects.map((subject) => {
    const concepts = bySubject(subject);
    // "Measured" means the learner's own record holds at least one answer, never
    // a mastery threshold — the same definition `/learn/<subject>` uses, so the
    // two screens can never disagree about the same subject.
    const touched = concepts.filter((c) => (state?.progress[c.id]?.attempts ?? 0) > 0).length;
    // What this subject's course still has not decided. `courseGaps` is the ONE
    // owner of that question, so this screen cannot claim a course the rest of
    // the product would refuse to plan against.
    const gaps = profile ? courseGaps(profile, subject) : [];
    // Only a COMPLETE course may be counted against. An incomplete one still
    // resolves deterministically inside specForProfile (country → first
    // listing), and a coverage count from a qualification nobody chose is
    // exactly the claim the gate exists to prevent.
    const active = profile && gaps.length === 0 ? specForProfile(profile, subject) : null;
    const inCourse = active ? coverageOf(active).filter((c) => c.subject === subject).length : null;
    // THE number this row counts, and therefore the number the header counts.
    // A course the learner has chosen gives the concepts in THAT course; a
    // subject without one falls back to the whole subject, which is what the row
    // prints. One denominator on the screen, not two that cannot be reconciled.
    return { subject, counted: inCourse ?? concepts.length, touched, gaps, active };
  });

  const touchedAll = rows.reduce((n, r) => n + r.touched, 0);
  const totalAll = rows.reduce((n, r) => n + r.counted, 0);
  const anyGap = rows.some((r) => r.gaps.length > 0);

  return (
    <main className="container page">
      <div className="page-head">
        <p className="eyebrow">
          {t("nav.subjects")} <span className="mono">{touchedAll}/{totalAll}</span>
        </p>
        <h1>{t("nav.subjects")}</h1>
        <p className="lead" style={{ marginBottom: 0 }}>
          {/* Three states, in the order a learner meets them: nothing chosen yet,
              chosen but untouched, and under way. */}
          {declared.length === 0 ? t("next.courseFirstNote")
            : touchedAll === 0 ? t("learn.notStarted")
              : t("learn.pickSubject")}
        </p>
      </div>

      {rows.map(({ subject, counted, touched, gaps, active }) => (
        <Link key={subject} href={`/learn/${subject}`} className="concept-row">
          <span className="grow">
            <b>{t(SUBJECT_LABELS[subject])}</b>
            {/* ONE course line: the course in force, or — in the same place,
                with the same words Home and the wizard use — what is still
                missing before this subject has one. It lives here rather than
                as a chip on the right because the field names are long ("Your
                grade level"), and a row that wraps them over three lines is
                three times the height of the rows it sits beside. */}
            <span className="blurb">
              {`${counted} ${t("map.concepts")}`}
              {active
                ? ` · ${active.spec.name} · ${levelLabel(lang, active.level.tier, active.level.name)}`
                : gaps.length > 0 && (
                    <span style={{ color: "var(--amber)" }}>
                      {` · ${fill(t("next.courseMissing"), { fields: gaps.map((f) => t(FIELD_LABEL[f])).join(" · ") })}`}
                    </span>
                  )}
            </span>
          </span>
          <span className="state">
            {touched > 0
              ? <span className="chip good">{touched} {t("next.ev.touched")}</span>
              : <span className="chip">{t("evv.unmeasured")}</span>}
          </span>
          <span className="muted" aria-hidden="true">→</span>
        </Link>
      ))}

      {/* A course that is not finished choosing is the one thing that blocks
          personalised work, so the way to finish it sits at the foot of the list
          — never nested inside the row it belongs to. */}
      {anyGap && (
        <div className="actions">
          <Link href="/curriculum" className="btn">{t("curr.course")} →</Link>
        </div>
      )}
      <div style={{ height: "var(--s4)" }} />
    </main>
  );
}
