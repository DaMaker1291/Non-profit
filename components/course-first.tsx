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
import { SUBJECT_LABELS } from "@/lib/subjects";
import type { SubjectId } from "@/lib/types";

export default function CourseFirst({ subject }: { subject: SubjectId }) {
  const { t } = useI18n();
  return (
    <section className="card" style={{ borderLeft: "4px solid var(--margin-red)" }} aria-label={t("next.aria")}>
      <p className="eyebrow" style={{ margin: 0 }}>
        <span className="no">§</span> {t("next.courseFirst")}
      </p>
      <p className="small" style={{ margin: "8px 0 6px" }}>{t("next.courseFirstNote")}</p>
      <p className="small muted" style={{ margin: "0 0 14px" }}>
        <strong>{t(SUBJECT_LABELS[subject] as Parameters<typeof t>[0])}</strong> — {t("onb.courseNeed")}
      </p>
      <Link href="/curriculum" className="btn">{t("curr.course")} →</Link>
    </section>
  );
}
