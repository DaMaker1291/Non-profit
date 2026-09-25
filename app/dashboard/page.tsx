"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HOME — one day, one decision, and the four questions it must answer.
//
//   1. Who am I / what am I studying?   → the course context line
//   2. What should I do today?          → the decision card + today's plan
//   3. Why am I doing it?               → the engine's reason, with the drawer
//                                         that expands the cited answers
//   4. What should I do next?           → the one primary CTA, and the plan
//
// This page previously answered those four questions AND showed a mastery
// percentage per subject, a route per subject, a coverage count, a learning
// style chip, a continuity toggle, a rooms tile, a genome tile, a mind map and
// a stat grid. Nine of those were the same information or none: a number that
// cannot be acted on is decoration, and decoration on Home is what makes a
// learning product feel like a dashboard instead of a desk.
//
// Everything removed is still reachable, one click away, on the page that owns
// it: /learn (subjects and routes), /mind (the map), /progress (the full
// evidence view), /curriculum (the course), /offline (the pack, and the
// continuity setting now lives with the other configuration on /access).
//
// What remains is derived: the decision comes through the ONE door
// (lib/decision) over the model AND the ledger it was projected from; the
// deadline comes from the learner's own profile; the goal line and the recent
// answers are counted from the same record, never from a stored tally.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret } from "@/lib/client";
import { loadLedger, type LedgerFetch } from "@/lib/evidence-view";
import { fill } from "@/lib/i18n";
import { reasonKey } from "@/lib/session";
import { bySubject, getConcept } from "@/lib/genome";
import NextStep from "@/components/next-step";
import AssignmentsPanel from "@/components/assignments";
import RecentAnswers from "@/components/recent-answers";
import ExamCountdown from "@/components/exam-countdown";
import { decide, decisionContextFrom } from "@/lib/decision";
import { ctitle } from "@/lib/content-i18n";
import type { PathStep, ProfileState } from "@/lib/types";

export default function Dashboard() {
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
    loadLedger(pid, secret).then((l) => setLedger(l));
    fetch(`/api/session?id=${encodeURIComponent(pid)}&secret=${encodeURIComponent(secret)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.session && !j.session.complete) setOpenSession(j.session); })
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
      fetch(`/api/path?id=${id}&subject=${s}&secret=${encodeURIComponent(loadLocalProfileSecret() ?? "")}`)
        .then((r) => r.json())
        .then((j) => setPaths((p) => ({ ...p, [s]: j.path ?? [] })))
        .catch(() => { /* a path we could not read is not an empty path */ });
    }
  }, [state]);

  // The guard has already established that a learner profile exists; this is
  // only the frame before the profile lands.
  if (!state) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        <p className="eyebrow"><span className="no">§</span> {t("onb.title")}</p>
        <h1 className="visually-small">{t("dash.hi")}</h1>
        <p className="lead">{t("common.anon")} {t("dash.anonNote")}</p>
        <Link href="/onboarding" className="btn">{t("onb.start")} →</Link>
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

  return (
    <main>
      <div className="container narrow" style={{ paddingTop: 40 }}>
        {/* Identity without database residue: the eyebrow carries course
            context, never the auto-id. A chosen name appears in the greeting
            itself; an unnamed learner is simply "Welcome back". */}
        {(p.country !== "XX" || p.board || p.exam) && (
          <p className="eyebrow">
            {p.country !== "XX" ? p.country : ""}
            {p.board && `${p.country !== "XX" ? " · " : ""}${p.board}`}
            {p.exam && ` · ${p.exam}`}
          </p>
        )}
        <h1 className="visually-small">{t("dash.hi")}{p.handle ? `, ${p.handle}` : ""}</h1>

        {/* 2 + 3 + 4: what to do, why, and the one button that starts it. */}
        <NextStep state={state} ledger={ledger} />

        {/* The learner's own exam, from the learner's own profile. */}
        <ExamCountdown exam={p.exam} examDate={p.examDate} />

        {openSession && (
          <p style={{ margin: "0 0 14px" }}>
            <Link href={`/learn/${getConcept(openSession.conceptId)?.subject ?? "maths"}/${openSession.conceptId}`} className="chip">
              ↻ {fill(t("sess.resume"), { n: openSession.asked, m: openSession.target })} · {ctitle(lang, openSession.conceptId)}
            </Link>
          </p>
        )}

        {/* Work a teacher actually set, with its deadline, as a selectable
            task — and nothing at all when none was set. Opening it takes the
            ordinary concept page, so the answer lands on the ordinary ledger. */}
        <AssignmentsPanel />

        {/* The plan as a QUEUE, not a duplicate of the next step: the same
            ranked engine feed, minus the one action the card above already
            presents. Nothing is shown twice, and the list can only add recall,
            never contradict the engine's order. */}
        <PlanQueue state={state} ledger={ledger} />

        {/* The goal, and how far the record says the learner is toward it. */}
        {p.goal && goalConcepts.length > 0 && (
          <section className="card soft" style={{ padding: 16, margin: "0 0 16px" }}>
            <p className="eyebrow" style={{ margin: 0 }}><span className="no">→</span> {t("goal.title")}</p>
            <p style={{ margin: "6px 0 10px", fontSize: 17, fontWeight: 600 }}>“{p.goal}”</p>
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
          <p className="small muted" style={{ margin: "0 0 14px" }}>
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

        {/* The record itself: real answers, newest first. Absent while the
            ledger is unread — never rendered as "nothing recorded yet". */}
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 16, marginBottom: 26 }}>
          <p className="eyebrow" style={{ margin: 0 }}><span className="no">·</span> {t("prog.recent")}</p>
          <RecentAnswers ledger={ledger} limit={4} />
          <p className="small" style={{ margin: "10px 0 0" }}>
            <Link href="/progress">{t("prog.title")} →</Link>
          </p>
        </section>

        {/* Wayfinding, one line. Every destination has a page of its own; the
            nav carries the same routes, so this is a reminder rather than a
            menu. */}
        <p className="small muted" style={{ margin: "0 0 40px" }}>
          <Link href="/learn">{t("nav.learn")}</Link>
          {" · "}<Link href="/mind">{t("mm.yourKnowledge")}</Link>
          {" · "}<Link href="/papers">{t("nav.papers")}</Link>
          {" · "}<Link href="/offline">{t("nav.offlineTitle")}</Link>
        </p>
      </div>
    </main>
  );
}

/** The plan as a QUEUE (§home-plan): the engine's ranked feed minus the one
 *  action NextStep already presents above, so the same decision is never shown
 *  twice and the card can only add recall, never contradict the engine's
 *  order. Everything after the first row is subordinate: small, quiet links.
 *  This is also the honest empty state — no fabricated data to fill it. */
function PlanQueue({ state, ledger }: { state: ProfileState; ledger: LedgerFetch | null }) {
  const { t, lang } = useI18n();
  // The REST of the ranking the engine produced for the card above — through
  // the same door, over the same ledger, so the queue can only add recall and
  // never contradict the presented action's order or its citations.
  const steps = decide(decisionContextFrom(state, ledger), {
    max: 4,
    tt: t,
    title: (id) => ctitle(lang, id),
  }).slice(1);
  if (steps.length === 0) return null;
  return (
    <section className="card soft" style={{ padding: 16, margin: "0 0 16px" }}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">≡</span> {t("dash.planHow")}</p>
      <ol style={{ margin: "8px 0 4px", paddingLeft: 20 }}>
        {steps.map((s, i) => (
          <li key={`${s.kind}-${i}`} className="small" style={{ margin: "4px 0" }}>
            <Link href={s.href}>{s.title} →</Link>
            <span className="muted"> · ~{s.minutes} {t("next.ev.min")}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
