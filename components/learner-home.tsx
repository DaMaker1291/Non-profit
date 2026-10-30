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
//   2. WHAT DO I OWE?                  → teacher-set work and its deadline
//   3. WHAT SHOULD I DO NOW?           → the one dominant decision card
//   4. WHAT IS TODAY?                  → the day's checklist, from the engine
//   5. AM I ACTUALLY GETTING ANYWHERE? → four counts, each from the record
//   6. WHAT HAVE I DONE?               → the answers themselves
//   7. WHAT IS COMING?                 → the exam, and work already in progress
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
import { COUNTRIES, dueLabel, fill } from "@/lib/i18n";
import { levelLabel } from "@/lib/content-i18n";
import { boardName } from "@/lib/curriculum";
import { coverageOf, specForProfile } from "@/lib/specifications";
import { reasonKey } from "@/lib/session";
import { proofLabelKey, strongestProof } from "@/lib/proof";
import { bySubject, getConcept } from "@/lib/genome";
import { dueReviews } from "@/lib/retention";
import { diagnosedSubjects } from "@/lib/app-state";
import NextStep from "@/components/next-step";
import AssignmentsPanel from "@/components/assignments";
import RecentAnswers from "@/components/recent-answers";
import ExamCountdown from "@/components/exam-countdown";
import Momentum from "@/components/momentum";
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
  // THE DENOMINATOR IS THE LEARNER'S COURSE, NOT THE WHOLE GENOME.
  //
  // It was every concept in every declared subject — 135 for a five-subject GCSE
  // learner — so Home greeted them with "0/135" for work that is not on their
  // syllabus at all. A count a learner cannot finish is not progress; it is a
  // reminder of how much is missing. Each subject contributes the concepts its
  // OWN course covers, and a subject whose course is not yet chosen falls back
  // to that subject's whole list rather than to nothing.
  const courseConcepts = (() => {
    const ids = new Set<string>();
    for (const s of p.subjects) {
      try {
        const active = specForProfile(p, s);
        for (const c of coverageOf(active)) if (c.subject === s) ids.add(c.id);
      } catch {
        for (const c of bySubject(s)) ids.add(c.id);
      }
    }
    return ids.size;
  })();
  const curriculumSize = courseConcepts || 1;
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
      {/* THE LINE NAMES THE LEARNER'S COURSE IN WORDS.
       *
       *  It printed the stored CODES — `p.country` and `p.board` are ids, so a
       *  Kenyan learner's Home opened with "KE" over their own name, and anyone
       *  whose profile carried a board read "GB · aqa". Measured on the rendered
       *  page (`.courseline` → "KE"). The two resolvers already exist and every
       *  other surface uses them: COUNTRIES for the country (`context-strip.tsx`
       *  and `/curriculum` both name it in full) and `boardName` for the
       *  awarding body ("AQA", "Kenya National Examinations (KNEC)"). A code is
       *  not a label a learner reads; it is what the record stores. */}
      <CourseCard p={p} />
      <h1 className="greeting">
          {t(hasRecordedWork(state) ? "dash.hi" : "dash.hello")}
          {p.handle ? `, ${p.handle}` : ""}
        </h1>

      {/* 1b: WHAT I OWE — before what the engine recommends.

          MEASURED, against the products a UK learner already uses: Educake opens
          on the teacher-set quizzes, each labelled with subject, name, teacher
          and due date, and one tap starts one (help.educake.co.uk/how-do-i-find-
          my-homework); Satchel One calls the same list its to-do list. The EEF's
          feedback guidance is the reason it is not merely a layout preference:
          feedback has to give a pupil a way to ACT on it, and a deadline somebody
          else set is the most actionable thing on this page
          (educationendowmentfoundation.org.uk — feedback).

          This panel used to sit at the FOOT of Home, below the decision, the
          day's plan, four counts, the goal and the answer history — so a learner
          with homework due tomorrow read five sections before meeting it, and
          the engine's own suggestion came first as though the obligation were
          optional. It renders NOTHING when no work was set (`if (!work ||
          work.length === 0) return null`), so a learner without homework sees
          exactly the page they saw before: no empty box, no new heading.

          The decision card stays the page's ONLY primary action and stays
          directly under this — the settlement is ordering, not a second
          dashboard. */}
      <AssignmentsPanel />

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
      <section className="card soft home-panel">
        <p className="eyebrow flush"><span className="no">▦</span> {t("prog.title")}</p>
        {progressRows.length > 0 && (
          <div className="home-rows">
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
        {/* HOW MUCH OF THE COURSE HAS BEEN MEASURED, as a bar and a fraction.
            Four counts under a bar is a record; four counts on their own were a
            wall of zeros on day one. */}
        <div className="coverage-bar" aria-hidden="true">
          <span style={{ width: `${Math.min(100, Math.round((measured / curriculumSize) * 100))}%` }} />
        </div>
        <div className="home-metrics">
          <Metric label={t("evv.dim.recalled")} value={`${measured}/${curriculumSize}`} />
          <Metric label={t("prog.independent")} value={String(independent)} />
          <Metric label={t("prog.transfer")} value={String(transfer)} />
          <Metric label={t("learn.mastered")} value={String(mastered)} />
        </div>
        {/* ONLY THE LINK. This line used to read `{t("map.concepts")} · link`,
            i.e. the bare word "Concepts" followed by a link — a label whose value
            was never written, because the count had already moved into the
            `Recall 9/122` metric above. A caption that says one word and then
            points somewhere reads as a rendering bug, not as a footer. */}
        <p className="small muted home-foot">
          <Link href="/progress">{t("prog.title")} →</Link>
        </p>
      </section>

      {/* THE RUN, and the next thing to aim at. Placed with the record rather
          than above it: a streak shown before the decision would compete with the
          one primary action, and what this panel answers — "is this adding up over
          time?" — is a question asked after "what do I do now?" has been settled.
          It renders from the ledger, so a record that cannot be read shows the
          honest "reading your record" line instead of a run of zero days. */}
      <Momentum events={ledger ? ledger.events : null} />

      {/* The goal, and how far the record says the learner is toward it. */}
      {p.goal && goalConcepts.length > 0 && (
        <section className="card soft home-panel">
          <p className="eyebrow flush"><span className="no">→</span> {t("goal.title")}</p>
          <p className="home-goal-line">“{p.goal}”</p>
          <p className="small muted home-goal-counts">
            <span className="mono">{goalDone}/{goalConcepts.length}</span> · {t("dash.mastery")}
          </p>
          {remaining.length === 0 ? (
            <p className="small muted flush">✓ {t("goal.done")}</p>
          ) : (
            <p className="small flush">
              <span className="chip home-goal-now">{t("goal.now")}</span>
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
        <p className="small muted home-since">
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
      <section className="ruled home-record">
        <p className="eyebrow flush"><span className="no">·</span> {t("prog.recent")}</p>
        {ledger === null ? (
          <Loading lines={3} />
        ) : (
          <RecentAnswers ledger={ledger} limit={4} />
        )}
        <p className="small home-links">
          <Link href="/progress">{t("prog.title")} →</Link>
          {" · "}<Link href="/mind">{t("mm.yourKnowledge")} →</Link>
        </p>
      </section>

      {/* 6: what is coming — the learner's own exam, and work already in
          progress. (Work a teacher set is at the TOP of the page now: see 1b.)
          Each of these renders nothing at all when there is nothing to say,
          rather than an empty box. */}
      <section className="home-coming">
        {/* No heading here on purpose: the countdown and the assignment panel
            each carry their own label and render nothing when they have
            nothing to say, so a section title would be the only thing left
            standing on an empty day. */}
        <ExamCountdown exam={p.exam} examDate={p.examDate} />
        {openSession && (
          <p className="home-resume">
            <Link href={`/learn/${getConcept(openSession.conceptId)?.subject ?? "maths"}/${openSession.conceptId}`} className="chip">
              ↻ {fill(t("sess.resume"), { n: openSession.asked, m: openSession.target })} · {ctitle(lang, openSession.conceptId)}
            </Link>
          </p>
        )}
      </section>

    </main>
  );
}

/** THE COURSE CARD.
 *
 *  A learner's first question on their own home is "what am I being taught as?",
 *  and the page answered it with one quiet mono line of country · board · exam
 *  in the eyebrow position — where it read as metadata rather than as the thing
 *  that decides every question, paper and word on the page.
 *
 *  So it is a card, in the register a school platform uses for the same fact:
 *  the country, the qualification, the tier and the year group, with the way to
 *  change it. Resolved through `specForProfile`, so it can only name a course the
 *  record actually resolves; a course still being chosen renders nothing here
 *  and the page's own gate says what is missing. */
function CourseCard({ p }: { p: ProfileState["profile"] }) {
  const { t, lang } = useI18n();
  const subject = p.subjects?.[0];
  if (!subject) return null;
  let active: ReturnType<typeof specForProfile> | null = null;
  try {
    active = specForProfile(p, subject);
  } catch {
    active = null;
  }
  if (!active) return null;
  const country = p.country === "XX" ? "" : COUNTRIES.find((c) => c.code === p.country)?.name ?? "";
  const board = p.board ? boardName(p.board) : "";
  const tier = active.level ? levelLabel(lang, active.level.tier, active.level.name) : "";
  const parts = [country, active.spec.name, tier, board, p.grade ?? ""].filter((x) => x && x.trim().length > 0);
  if (parts.length === 0) return null;
  return (
    <section className="course-card">
      <p className="eyebrow flush" style={{ margin: 0 }}>{t("nav.currTitle")}</p>
      <p className="course-card-line">{parts.join(" · ")}</p>
      <p className="small muted course-card-foot">
        {p.subjects.map((s) => t(`subj.${s}`)).join(" · ")}
        {" · "}<Link href="/curriculum">{t("curr.title")} →</Link>
      </p>
    </section>
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
    <section className="card soft home-panel">
      <p className="eyebrow flush"><span className="no">✓</span> {t("sb.today")}</p>
      <ul className="today spaced">
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
