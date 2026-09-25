"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n, useProfile, loadLocalProfileId, withCapability } from "@/lib/client";
import { ctitle } from "@/lib/content-i18n";
import { dueLabel, fill } from "@/lib/i18n";
import { getConcept } from "@/lib/genome";
import { SUBJECT_LABELS } from "@/lib/subjects";
import type { Assignment, AssignmentMemberProgress, SubjectId } from "@/lib/types";

/** What one learner sees about work set for them: the assignment, the class it
 *  came from, and their OWN derived row (lib/server/assignment-view). The row is
 *  a projection of their ledger, so the panel never carries a number the client
 *  could have computed differently — and never another member's work. */
export interface AssignedWork {
  assignment: Assignment;
  className: string;
  subject: SubjectId;
  mine: AssignmentMemberProgress;
}

/**
 * ASSIGNED WORK, on the surfaces a learner actually opens.
 *
 * A task is selectable and carries its deadline, because "you have homework" is
 * useless without "for what" and "by when". Opening it takes the learner to the
 * ordinary concept page, where the ordinary serve → answer path records the
 * ordinary evidence — the assignment does not have its own answering mechanism,
 * and deliberately so: if it did, the same work would land on two records.
 *
 * The panel renders nothing at all when no work has been set: an empty
 * assignment section on every learner's Home would be decoration.
 */
export default function AssignmentsPanel({ conceptId }: { conceptId?: string }) {
  const { t, lang } = useI18n();
  const { state } = useProfile();
  const [work, setWork] = useState<AssignedWork[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = loadLocalProfileId();
    if (!id) return;
    fetch(withCapability(`/api/assignments?me=${encodeURIComponent(id)}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http ${r.status}`))))
      // A read that failed is not an empty list: it says so rather than telling
      // a learner with homework that none was set. (A fetch with no profile yet
      // simply returns before this, and renders nothing.)
      .then((j) => setWork((j.assigned ?? []) as AssignedWork[]))
      .catch(() => setFailed(true));
  }, [state]);

  if (failed) {
    return (
      <section className="card soft" style={{ padding: 16, margin: "0 0 16px" }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="no">✎</span> {t("asg.title")}</p>
        <p className="small muted" style={{ margin: "6px 0 0" }}>{t("asg.error")}</p>
      </section>
    );
  }
  if (!work || work.length === 0) return null;

  // A concept page shows only the work that touches THIS concept; Home shows
  // everything. Unfinished first, then by deadline, so the next thing to do is
  // the first thing read.
  const shown = conceptId
    ? work.filter((w) => w.assignment.conceptIds.includes(conceptId))
    : [...work].sort(
        (a, b) =>
          Number(a.mine.complete) - Number(b.mine.complete) ||
          a.assignment.dueAt - b.assignment.dueAt ||
          a.assignment.createdAt - b.assignment.createdAt,
      );
  if (shown.length === 0) return null;

  const now = Date.now();
  return (
    <section className="card soft" style={{ padding: 16, margin: "0 0 16px" }} aria-label={t("asg.title")}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">✎</span> {t("asg.title")}</p>
      {shown.map((w) => {
        const total = w.assignment.conceptIds.length;
        const done = total - w.mine.outstanding.length;
        const overdue = !w.mine.complete && w.assignment.dueAt < now;
        const nextConcept = w.mine.outstanding[0] ?? w.assignment.conceptIds[0];
        return (
          <div key={w.assignment.id} style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
              <strong>{w.assignment.title || ctitle(lang, w.assignment.conceptIds[0])}</strong>
              <span className="small muted">
                {t(SUBJECT_LABELS[w.subject])} · {w.className} · {t("asg.setBy")}
              </span>
            </div>
            <p className="small" style={{ margin: "4px 0 0" }}>
              <span className={overdue ? "chip red" : "chip"}>
                {overdue ? fill(t("asg.overdue"), { date: dueLabel(lang, w.assignment.dueAt) }) : fill(t("asg.due"), { date: dueLabel(lang, w.assignment.dueAt) })}
              </span>
              {w.mine.complete
                ? <span className="chip" style={{ marginLeft: 6 }}>✓ {t("asg.done")}</span>
                : <span className="muted" style={{ marginLeft: 8 }}>{fill(t("asg.todo"), { n: w.mine.outstanding.length, m: total })}</span>}
            </p>
            <p className="small muted" style={{ margin: "4px 0 8px" }}>
              {w.assignment.conceptIds.map((id) => (
                <span key={id} style={{ marginRight: 10 }}>
                  {w.mine.concepts[id] ? "✓" : "○"} {ctitle(lang, id)}
                </span>
              ))}
            </p>
            {!w.mine.complete && nextConcept && getConcept(nextConcept) && (
              <Link href={`/learn/${w.subject}/${nextConcept}`} className="btn ghost small">
                {done > 0 ? t("asg.cont") : t("asg.start")} → {ctitle(lang, nextConcept)}
              </Link>
            )}
          </div>
        );
      })}
    </section>
  );
}
