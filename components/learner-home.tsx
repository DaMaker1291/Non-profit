"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE LEARNER HOME — "what should I do now?", answered in the first screen.
//
// Extracted from app/dashboard/page.tsx so that the nav item called "Home" and
// the route /dashboard are the SAME screen. They were not: "/" served a
// marketing page to signed-in learners while this lived at /dashboard, so the
// first item in the navigation never answered the question the whole product
// exists to answer. One implementation, two routes.
//
// The page is a desk, not a dashboard, and it is laid out in the order a
// learner uses it:
//
//   1. WHO AM I / WHAT AM I STUDYING?  → the course line and the greeting
//   2. WHAT SHOULD I DO NOW?           → the one dominant decision card
//   3. WHAT IS TODAY?                  → the day's checklist, from the engine
//   4. AM I ACTUALLY GETTING ANYWHERE? → four counts, each from the record
//   5. WHAT HAVE I DONE?               → the answers themselves
//   6. WHAT IS COMING?                 → exam, teacher's work, work in progress
//
// Two rules this page keeps:
//
//   · ONE primary action. The decision card is the only thing on Home with a
//     primary button; everything else is a quiet link. Nine equally-weighted
//     CTAs is the same as none.
//   · NOTHING IS COUNTED TWICE. The plan queue renders the REST of the ranking
//     the card already presented (`.slice(1)`), so the same decision can never
//     appear as two different pieces of advice.
//
// Everything shown is derived: the decision comes through the ONE door
// (lib/decision) over the model AND the ledger it was projected from; the
// counts are folded from recorded answers; the deadline is the learner's own.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret } from "@/lib/client";
import { hasRecordedWork, loadLedger, type LedgerFetch } from "@/lib/evidence-view";
import { pathFor, sessionState } from "@/lib/api/client";
import { dueLabel, fill } from "@/lib/i18n";
import { reasonKey } from "@/lib/session";
import { proofLabelKey, strongestProof } from "@/lib/proof";
import { bySubject, getConcept } from "@/lib/genome";
import { dueReviews } from "@/lib/retention";
import { diagnosedSubjects } from "@/lib/app-state";
import NextStep from "@/components/next-step";
import AssignmentsPanel from "@/components/assignments";
import RecentAnswers from "@/components/recent-answers";
import ExamCountdown from "@/components/exam-countdown";
import { Loading } from "@/components/states";
import { decide, decisionContextFrom } from "@/lib/decision";
import { ctitle } from "@/lib/content-i18n";
import type { PathStep, ProfileState } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

export default function LearnerHome() {
  const { t, lang } = useI18n();
  const { state } = useProfile();
  const [paths, setPaths] = useState<Record<string, PathStep[]>>({});
  // An unfinished session is the most concrete "continue where you left off"
  // there is, so Home asks the session API rather than guessing.
  const [openSession, setOpenSession] = useState<{ conceptId: string; asked: number; target: number } | null>(null);
  // The ledger: Home explains itself with the learner's real recorded evidence
  // (the drawer cites the events that caused the decision, and the answer list
  // below is the record itself). Loading is lazy and non-blocking — the card
  // renders from the model immediately; the citations arrive when the ledger
  // does. null ⇒ the honest fallback, never a spinner in front of the
  // decision.
  const [ledger, setLedger] = useState<LedgerFetch | null>(null);

  useEffect(() => {
    const pid = loadLocalProfileId();
    if (!pid) return;
    const secret = loadLocalProfileSecret() ?? "";
    loadLedger(pid).then((l) => setLedger(l));
    sessionState(pid)
      .then((j) => { if (j.session && !j.session.complete) setOpenSession(j.session); })
      .catch(() => { /* no open session is the normal case */ });
  }, []);

  // State-derived navigation used to live here, in a check this page did for
  // itself. It now happens once, centrally, in the route guard — so Home can
  // assume it is only ever rendered for a learner the system has measured.

  useEffect(() => {
    // The path is used for ONE thing now: the step after the next one, on the
    // goal line. It is fetched only when the learner has stated a goal.
    const id = loadLocalProfileId();
    if (!id || !state?.profile.goal) return;
    for (const s of state.profile.subjects) {
      pathFor(id, s)
        .then((j) => setPaths((p) => ({ ...p, [s]: (j.path ?? []) as PathStep[] })))
        .catch(() => { /* a path we could not read is not an empty path */ });
    }
  }, [state]);

  // The guard has already established that a learner profile exists; this is
  // the gap before the profile lands. A skeleton, not a blank page, and not a
  // page of zeros claiming to be their history.
  if (!state) {
    return (
      <main className="container narrow page">
        <Loading lines={4} />
      </main>
    );
  }

  const p = state.profile;
  // Progress toward the goal, counted from the record — the same rule the
  // progress page uses (an idea is mastered at 0.9, and never before it has
  // been measured at all).
  const goalSubject = p.subjects[0] ?? "maths";
  const goalConcepts = p.goal ? bySubject(goalSubject) : [];
  const remaining = goalConcepts.filter((c) => (state.progress[c.id]?.mastery ?? 0) < 0.9);
  const goalDone = goalConcepts.length - remaining.length;
  const nextStep = remaining[0];
  const afterStep = remaining[1];
  const afterPath = afterStep ? (paths[goalSubject] ?? []).find((s) => s.conceptId === afterStep.id) : undefined;

  // ── The four counts. Each one is a fold of recorded answers, never a stored
  // tally: concepts with an answer at all, concepts proved unaided, concepts
  // proved in a new context, concepts the model now calls mastered. A "87%
  // overall mastery" would be a number nobody can act on; "9 of 67 concepts
  // measured" is a sentence about this learner's record.
  const entries = Object.entries(state.progress).filter(([cid]) => !!getConcept(cid));
  const measured = entries.filter(([, pr]) => (pr.attempts ?? 0) > 0).length;
  const independent = entries.filter(([, pr]) => (pr.independent?.correct ?? 0) > 0).length;
  const transfer = entries.filter(([, pr]) => (pr.transfer?.correct ?? 0) > 0).length;
  const mastered = entries.filter(([, pr]) => (pr.mastery ?? 0) >= 0.9).length;
  const curriculumSize = new Set(p.subjects.flatMap((s) => bySubject(s).map((c) => c.id))).size;
  const due = dueReviews(state);

  // ── YOUR PROGRESS, as concepts and not only as counts (§home-progress).
  // The spec's own example is a row per idea — "Fractions · Developing" — and
  // the counts alone never answer "do I know fractions?". Up to three concepts
  // the record actually holds answers for, most-recorded first, each named with
  // the SHARED proof vocabulary (lib/proof) so "Independent" here and
  // "Independent" under a question are one claim rather than two.
  //
  // A concept with answers but nothing PROVED carries its own fraction and no
  // word at all: a miss is not a verdict, and the vocabulary has no word for
  // one. Nothing is invented to fill a row — a learner with no answers gets no
  // rows, which is the same honest emptiness the counts already show as 0/67.
  const progressRows = entries
    .filter(([, pr]) => (pr.attempts ?? 0) > 0)
    .sort((a, b) => (b[1].attempts ?? 0) - (a[1].attempts ?? 0) || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([cid, pr]) => ({
      cid,
      proved: strongestProof({
        correct: pr.correct,
        independentCorrect: pr.independent?.correct ?? 0,
        transferCorrect: pr.transfer?.correct ?? 0,
        retentionCorrect: pr.retention?.correct ?? 0,
      }),
      correct: pr.correct,
      attempts: pr.attempts,
    }));

  return (
    <main className="container narrow page">
      {/* Identity without database residue: the eyebrow carries course
          context, never the auto-id. A chosen name appears in the greeting
          itself; an unnamed learner is simply greeted.

          Which greeting is decided by the EVIDENCE, not by the existence of a
          profile: setup creates a profile and no record, and opening this page
          for the first time with "Welcome back" over it is a claim the empty
          ledger underneath contradicts. Nobody arrives here having been here
          before.

          The predicate itself is NOT decided here either: it used to read
          `entries.length === 0`, while the static build read
          `recentAnswers(events, 5).length === 0` — two different facts about the
          same learner, which is how the two products came to disagree about a
          sentence the learner reads first. lib/evidence-view#hasRecordedWork is
          the one owner. */}
      {/* The course, then the person. The course line is mono and quiet — a
          label on the exercise book, not a heading — so the only large text on
          Home is the learner's own name and the decision under it. */}
      {(p.country !== "XX" || p.board || p.exam) && (
        <p className="courseline">
          {p.country !== "XX" ? p.country : ""}
          {p.board && `${p.country !== "XX" ? " · " : ""}${p.board}`}
          {p.exam && ` · ${p.exam}`}
        </p>
      )}        <h1 className="greeting">
          {t(hasRecordedWork(state) ? "dash.hi" : "dash.hello")}
          {p.handle ? `, ${p.handle}` : ""}
        </h1>

      {/* 2: what to do, why, and the one button that starts it. This is the
          only primary action on the page. */}
      <NextStep state={state} ledger={ledger} />

      {/* 3: the day. The engine's own ranking, drawn as a checklist — the item
          in hand, the work that follows it, and the review the scheduler has
          brought back. Nothing here is invented: an item appears because the
          decision engine put it there or because a retention window elapsed. */}
      <TodayPlan state={state} ledger={ledger} due={due.map((d) => d.conceptId)} />

      {/* 4: the model, as four counts in the mark-book register — the way a
          teacher writes a record, not a dashboard of tiles. Each number is a
          fold of recorded answers, and none of them is a percentage of a
          hundred concepts the learner has never opened. */}
      <section className="card soft" style={{ padding: 18, margin: "0 0 16px" }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="no">▦</span> {t("prog.title")}</p>
        {progressRows.length > 0 && (
          <div style={{ margin: "10px 0 2px" }}>
            {progressRows.map((r) => (
              <div className="rowline" key={r.cid}>
                <span className="grow small">
                  <Link href={`/learn/${getConcept(r.cid)?.subject ?? goalSubject}/${r.cid}`}>{ctitle(lang, r.cid)}</Link>
                </span>
                {r.proved
                  // The strongest thing the record PROVED, in the same four
                  // words the lesson list, the mark's own sentence and the
                  // evidence record use.
                  ? <span className={`chip ${r.proved !== "supported" ? "good" : ""}`}>{t(proofLabelKey(r.proved))}</span>
                  : <span className="mono small muted">{r.correct}/{r.attempts}</span>}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 8 }}>
          <Metric label={t("evv.dim.recalled")} value={`${measured}/${curriculumSize}`} />
          <Metric label={t("prog.independent")} value={String(independent)} />
          <Metric label={t("prog.transfer")} value={String(transfer)} />
          <Metric label={t("learn.mastered")} value={String(mastered)} />
        </div>
        <p className="small muted" style={{ margin: "10px 0 0" }}>
          {t("map.concepts")} · <Link href="/progress">{t("prog.title")} →</Link>
        </p>
      </section>

      {/* The goal, and how far the record says the learner is toward it. */}
      {p.goal && goalConcepts.length > 0 && (
        <section className="card soft" style={{ padding: 18, margin: "0 0 16px" }}>
          <p className="eyebrow" style={{ margin: 0 }}><span className="no">→</span> {t("goal.title")}</p>
          <p style={{ margin: "8px 0 10px", fontSize: 17, fontWeight: 600 }}>“{p.goal}”</p>
          <p className="small muted" style={{ margin: "0 0 8px" }}>
            <span className="mono">{goalDone}/{goalConcepts.length}</span> · {t("dash.mastery")}
          </p>
          {remaining.length === 0 ? (
            <p className="small muted" style={{ margin: 0 }}>✓ {t("goal.done")}</p>
          ) : (
            <p className="small" style={{ margin: 0 }}>
              <span className="chip" style={{ marginRight: 8 }}>{t("goal.now")}</span>
              <Link href={`/learn/${goalSubject}/${nextStep.id}`}>{ctitle(lang, nextStep.id)}</Link>
              {afterStep && (
                <span className="muted">
                  {" · "}{t("goal.step")} 2:{" "}
                  <Link href={`/learn/${goalSubject}/${afterStep.id}`}>{ctitle(lang, afterStep.id)}</Link>
                  {afterPath?.note ? ` — ${afterPath.note}` : ""}
                </span>
              )}
            </p>
          )}
        </section>
      )}

      {/* The model, visibly moving. This is the line that answers "is this
          thing actually adapting to me?" without asking the learner to
          remember the previous screen. */}
      {state.lastSession && (
        <p className="small muted" style={{ margin: "0 0 16px" }}>
          <span className="no" aria-hidden="true">↻</span> {t("dash.since")}:{" "}
          <Link href={`/learn/${getConcept(state.lastSession.conceptId)?.subject ?? "maths"}/${state.lastSession.conceptId}`}>
            {ctitle(lang, state.lastSession.conceptId)}
          </Link>
          {" · "}{t("sess.mastery")}{" "}
          <span className="mono">
            {Math.round(state.lastSession.before.mastery * 100)}% → {Math.round(state.lastSession.after.mastery * 100)}%
          </span>
          {" · "}{t(`mm.${state.lastSession.after.band}`)}
          {" — "}{state.lastSession.nextStepChanged ? t("sess.changed") : t("sess.unchanged")} {t(reasonKey(state.lastSession.changeReason))}
        </p>
      )}

      {/* 5: the record itself — real answers, newest first. Absent while the
          ledger is unread, and it says so rather than claiming emptiness. */}
      <section className="ruled" style={{ borderTop: "1.5px solid var(--ink)", paddingTop: 18, marginBottom: 26 }}>
        <p className="eyebrow" style={{ margin: 0 }}><span className="no">·</span> {t("prog.recent")}</p>
        {ledger === null ? (
          <Loading lines={3} />
        ) : (
          <RecentAnswers ledger={ledger} limit={4} />
        )}
        <p className="small" style={{ margin: "12px 0 0" }}>
          <Link href="/progress">{t("prog.title")} →</Link>
          {" · "}<Link href="/mind">{t("mm.yourKnowledge")} →</Link>
        </p>
      </section>

      {/* 6: what is coming — the learner's own exam, work a teacher set, and
          work already in progress. Each of these renders nothing at all when
          there is nothing to say, rather than an empty box. */}
      <section style={{ marginBottom: 40 }}>
        {/* No heading here on purpose: the countdown and the assignment panel
            each carry their own label and render nothing when they have
            nothing to say, so a section title would be the only thing left
            standing on an empty day. */}
        <ExamCountdown exam={p.exam} examDate={p.examDate} />
        {openSession && (
          <p style={{ margin: "0 0 14px" }}>
            <Link href={`/learn/${getConcept(openSession.conceptId)?.subject ?? "maths"}/${openSession.conceptId}`} className="chip">
              ↻ {fill(t("sess.resume"), { n: openSession.asked, m: openSession.target })} · {ctitle(lang, openSession.conceptId)}
            </Link>
          </p>
        )}
      </section>

      {/* Work a teacher actually set, with its deadline, as a selectable
          task — and nothing at all when none was set. Opening it takes the
          ordinary concept page, so the answer lands on the ordinary ledger. */}
      <AssignmentsPanel />
    </main>
  );
}

/** One line of the record: what it counts, and how many. */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rowline">
      <span className="grow small">{label}</span>
      <span className="mono small">{value}</span>
    </div>
  );
}

/** THE DAY, as a checklist (§home-today).
 *
 *  Three kinds of row, and each has a different reason for being here:
 *
 *    ✓ the work the product asked for and the learner has done — the
 *      diagnostic;
 *    → the action the engine is recommending right now (the same one the card
 *      above presents, named again because a checklist is read top-to-bottom
 *      and a card can be scrolled past);
 *    ○ the rest of the ranking, and any concept whose retention window has
 *      elapsed. A due review is a REAL scheduled event (lib/retention), not a
 *      placeholder promising "retrieval tomorrow".
 *
 *  Nothing is fabricated to fill a row: if the engine offers no further work
 *  and nothing is due, the list is short, and that is the truth. */
function TodayPlan({
  state,
  ledger,
  due,
}: {
  state: ProfileState;
  ledger: LedgerFetch | null;
  due: string[];
}) {
  const { t, lang } = useI18n();
  // The REST of the ranking the engine produced for the card above — through
  // the same door, over the same ledger, so the queue can only add recall and
  // never contradict the presented action's order or its citations.
  const steps = decide(decisionContextFrom(state, ledger), {
    max: 4,
    tt: t,
    title: (id) => ctitle(lang, id),
  }).slice(1);
  const diagnosed = Object.keys(state.diagnostics ?? {}).length > 0;
  const subjectOf = (id: string) => getConcept(id)?.subject ?? "maths";
  if (!diagnosed && steps.length === 0 && due.length === 0) return null;

  return (
    <section className="card soft" style={{ padding: 18, margin: "0 0 16px" }}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">✓</span> {t("sb.today")}</p>
      <ul className="today" style={{ margin: "10px 0 0" }}>
        {diagnosed && (
          <li>
            <span className="tick done" aria-hidden="true">✓</span>
            <span className="small">
              {t("prog.diagnostic")}
              {/* The record is keyed by RUN (`subject:startedAt`), so naming the
                  keys named the same subject once per sitting — see
                  lib/app-state.ts#diagnosedSubjects, which owns the question. */}
              <span className="muted">
                {" · "}{diagnosedSubjects(state).map((s) => t(`subj.${s}`)).join(" · ")}
              </span>
            </span>
          </li>
        )}
        {steps.map((s, i) => (
          <li key={`${s.kind}-${i}`}>
            <span className={`tick ${i === 0 ? "next" : "todo"}`} aria-hidden="true">{i === 0 ? "→" : "○"}</span>
            <span className="small">
              <Link href={s.href}>{s.title}</Link>
              <span className="muted"> · ~{s.minutes} {t("next.ev.min")}</span>
            </span>
          </li>
        ))}
        {due.slice(0, 2).map((cid) => (
          <li key={cid}>
            <span className="tick todo" aria-hidden="true">○</span>
            <span className="small">
              {t("evv.dim.retention")}: <Link href={`/learn/${subjectOf(cid)}/${cid}`}>{ctitle(lang, cid)}</Link>
              <span className="muted"> · {dueLabel(lang, Date.now() + DAY)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
