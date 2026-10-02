"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CHOOSE YOUR COURSE FIRST — the card Home shows INSTEAD of a recommendation
// when the subject that work belongs to has no course yet.
//
// Why this exists as a card rather than as a warning strip above the plan:
//
//   specForProfile falls back deterministically (country → first listing) when a
//   learner never picked a qualification or a tier. That fallback is correct for
//   a countdown or a paper tag — a reader that needs SOME course. It is wrong
//   as the basis of a day's learning: the coverage set, the difficulty band and
//   the terminology would all be somebody else's course, presented as this
//   learner's plan. A plan that cannot say which qualification it is for is not
//   a personalised plan, so the card asks for the missing choice and names the
//   subject it is missing for.
//
// It is a separate component so the decision card keeps exactly ONE primary
// CTA: the two are mutually exclusive on screen (never both, never neither).
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useI18n } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { SUBJECT_LABELS } from "@/lib/subjects";
import type { CourseField } from "@/lib/specifications";
import type { SubjectId } from "@/lib/types";

/** The label for each field a course can be missing — the SAME labels the form
 *  that sets them uses, so the card's promise and the screen behind it agree.
 *  Exported because the wizard's course step names its gaps too; one owner for
 *  "how a missing course field is called". */
export const FIELD_LABEL: Record<CourseField, string> = {
  country: "onb.country",
  grade: "onb.grade",
  spec: "onb.spec",
  specLevel: "onb.level",
};

/**
 * WHY THIS CARD NAMES THE FIELD.
 *
 * It used to say "needs a course" for every gap and send the learner to the
 * course screen. But a course has four parts (`CourseField`), and the gate that
 * produces this card reports WHICH are missing — `incompleteSubjects` returns
 * `missing`, and the only caller dropped it one line before the card. So a
 * learner who had chosen GCSE Maths (Foundation) and simply never picked a year
 * group was told they needed "a course", sent to the course screen, changed
 * nothing there (it could not set a year group), came back, and was told the same
 * thing. Naming the missing field is the difference between a prompt and a loop.
 */
export default function CourseFirst({ subject, missing }: { subject: SubjectId; missing: CourseField[] }) {
  const { t } = useI18n();
  const fields = (missing.length ? missing : (["spec"] as CourseField[]))
    .map((f) => t(FIELD_LABEL[f] as Parameters<typeof t>[0]))
    .join(" · ");
  return (
    <section className="card" style={{ borderLeft: "4px solid var(--margin-red)" }} aria-label={t("next.aria")}>
      <p className="eyebrow" style={{ margin: 0 }}>
        {t("next.courseFirst")}
      </p>
      <p className="small" style={{ margin: "8px 0 6px" }}>{t("next.courseFirstNote")}</p>
      <p className="small muted" style={{ margin: "0 0 14px" }}>
        <strong>{t(SUBJECT_LABELS[subject] as Parameters<typeof t>[0])}</strong> — {fill(t("next.courseMissing"), { fields })}
      </p>
      <Link href="/curriculum" className="btn">{t("curr.course")} →</Link>
    </section>
  );
}
