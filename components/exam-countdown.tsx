"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE DEADLINE — the learner's own exam, counted from their own profile.
//
// `examDate` was collected at enrolment and then read by nothing: the field
// promised to "drive the countdown on Home" and no surface ever showed it. A
// learner who told OpenMind when their exam is deserves to see that OpenMind
// remembers, and it is the single most useful piece of urgency on the page.
//
// Three rules, because a countdown is a claim about time:
//
//   1. NO DATE, NO COUNTDOWN. Absent means the learner never chose one — an
//      invented date, or a default exam session, would be a fabricated deadline.
//   2. The date is parsed as a CALENDAR day (local midnight), not as an instant,
//      so "the exam is today" does not flip to "tomorrow" at 23:00 UTC.
//   3. A date in the past says so and points at the place that fixes it. It does
//      not silently disappear, which would leave a learner who mistyped the year
//      with a deadline they cannot see and cannot correct.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useI18n } from "@/lib/client";
import { daysUntil } from "@/lib/deadline";

export default function ExamCountdown({ exam, examDate }: { exam?: string; examDate?: string }) {
  const { t, lang } = useI18n();
  const days = daysUntil(examDate);
  if (!examDate || days === null) return null;

  const when = new Date(`${examDate}T00:00:00`).toLocaleDateString(lang === "en" ? undefined : lang, {
    day: "numeric", month: "short", year: "numeric",
  });
  const line = days < 0
    ? t("home.examPast")
    : days <= 1
      ? t("home.examNear")
      : t("home.examCountdown").replace("{days}", String(days));

  return (
    <section className="card soft" style={{ padding: 14, margin: "0 0 16px" }} aria-label={t("onb.examDate")}>
      <p className="small" style={{ margin: 0 }}>
        <span className="no" aria-hidden="true">◷</span>{" "}
        {exam ? <strong>{exam}</strong> : <strong>{t("onb.examDate")}</strong>}
        {" · "}<span className="mono">{when}</span>
      </p>
      <p className="small muted" style={{ margin: "4px 0 0" }}>
        {line}
        {days < 0 && <> {" "}<Link href="/access">{t("curr.change")} →</Link></>}
      </p>
    </section>
  );
}
