"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProfile, useI18n, loadLocalProfileId, loadLocalProfileSecret, useProfile } from "@/lib/client";
import { getConcept } from "@/lib/genome";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { SUBJECT_IDS, SUBJECT_LABELS, subjectFromParam } from "@/lib/subjects";
import { ctitle, mcName, mcCoaching } from "@/lib/content-i18n";
import { fill } from "@/lib/i18n";
import type { DiagnosticResult, Question, SubjectId } from "@/lib/types";

type Graded = { correct: boolean; explanation: string; answerIndex: number | null };

/** One diagnostic run, server-graded. The client only sends a choice index. */
export default function DiagnosticPage() {
  const params = useParams<{ subject: string }>();
  const subject: SubjectId = subjectFromParam(params?.subject);
  const { t, lang } = useI18n();
  /** The shell's own learner state. A finished sitting changes where this
   *  learner belongs, and the route guard derives that from here — see `next`. */
  const { set: setLearner } = useProfile();

  const [q, setQ] = useState<Question | null>(null);
  const [nextQ, setNextQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [n, setN] = useState(0);
  const [nCorrect, setNCorrect] = useState(0);
  const [done, setDone] = useState<DiagnosticResult | null>(null);
  /** True when this mount picked up a sitting that was already in progress. */
  const [resumed, setResumed] = useState(false);
  const [err, setErr] = useState("");
  const busy = useRef(false);

  const id = loadLocalProfileId();
  const secret = loadLocalProfileSecret();

  const start = useCallback(async () => {
    if (!id) { setErr(t("onb.title")); return; }
    const res = await fetch("/api/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", id, subject, lang, kind: "baseline", secret }),
    });
    const body = await res.json();
    if (!res.ok) { setErr(body.error ?? `HTTP ${res.status}`); return; }
    if (!body.question) { setErr(t("common.error")); return; }
    setQ(body.question);
    // A RESUMED SITTING SAYS SO, AND KEEPS ITS PLACE. The route used to replace
    // the live sitting on every mount, so a reload served a different question
    // 01 and `setN(1)` labelled it "01" — a learner reloading mid-diagnostic was
    // shown the start of something they had already done, with nothing on
    // screen to explain it. The server now hands back the unfinished sitting and
    // how far along it is, so the counter is honest and the banner names the
    // truth rather than letting the learner conclude the app lost their work.
    if (body.resumed && body.asked > 0) {
      setN(body.asked + 1);
      setResumed(true);
    } else {
      setN(1);
    }
  }, [id, subject]);

  useEffect(() => { void start(); }, [start]);

  async function answer(i: number) {
    if (graded || !q || busy.current || !id) return;
    busy.current = true;
    setPicked(i);
    // The resume notice described the moment they arrived; once they are
    // answering it is stale, and leaving it up would imply something was still
    // being recovered while they work.
    setResumed(false);
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", id, subject, questionId: q.id, chosen: i, lang, secret }),
      });
      const body = await res.json();
      if (!res.ok) { setErr(body.error ?? `HTTP ${res.status}`); return; }
      setGraded({ correct: !!body.correct, explanation: String(body.explanation ?? ""), answerIndex: typeof body.answerIndex === "number" ? body.answerIndex : null });
      setNCorrect((c) => c + (body.correct ? 1 : 0));
      setNextQ(body.next ?? null);
    } finally {
      busy.current = false;
    }
  }

  async function next() {
    if (nextQ) {
      setQ(nextQ);
      setNextQ(null);
      setPicked(null);
      setGraded(null);
      setN((v) => v + 1);
      return;
    }
    // ONE GUARD, BOTH PATHS. `answer` has always refused a second submission
    // while one was in flight; this one did not — so a double-click on the
    // button that ENDS the sitting asked the server to finish twice, and the
    // second ask is `400 no active session`, which the error branch below put on
    // screen as raw server text in the middle of a first run. Measured against
    // the live route: first finish 200 with the report, second 400 with that
    // error string.
    if (busy.current) return;
    busy.current = true;
    try {
      // ladder exhausted — close the session and show the report. The session's
      // per-concept ladders ride along (audit P0-A): the grading route folds
      // this run's evidence into the learner model, so the diagnostic actually
      // initializes the state the next-step engine reads.
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", id, subject, secret }),
      });
      const body = await res.json();
      if (!res.ok) { setErr(body.error ?? `HTTP ${res.status}`); return; }
      // A FINISHED SITTING IS A CHANGE TO WHERE THIS LEARNER BELONGS, and the
      // guard reads that from the shell's learner state. Nothing refreshed it
      // here, so the report's own primary CTA — "Home →" — was bounced straight
      // back into the diagnostic: `resolveRoute` still saw a learner with no
      // measurement and returned them to `/diagnostic/maths?return=/dashboard`,
      // at question 01 of a fresh sitting. Walking the first run is what found
      // it; a reload hid it, because a fresh mount re-probes. Refreshed the same
      // way the exercise page refreshes after grading.
      if (id) {
        const fresh = await fetchProfile(id);
        if (fresh) setLearner(fresh);
      }
      setDone(body.result ?? null);
    } finally {
      busy.current = false;
    }
  }

  // ── the report ─────────────────────────────────────────────────────────────
  if (done) {
    const probed = done.scores.filter((s) => s.asked > 0);
    // "What we found" is derived, never invented: the strongest and weakest
    // demand levels the bank actually measured, the levels it did NOT measure,
    // and any band the diagnostic skipped because it was already demonstrated.
    const measured = (done.skills ?? []).filter((s) => s.inBank && s.estimate.measured);
    const byValue = [...measured].sort((a, b) => (b.estimate.value ?? 0) - (a.estimate.value ?? 0));
    // "Strongest" must BE strong to be worth saying: calling the best of six
    // wrong answers "your strongest evidence" is the kind of hollow encouragement
    // that makes a report untrustworthy. It only appears when the number
    // actually clears the plan's strong line.
    const best = byValue[0];
    const strongest = best && (best.estimate.value ?? 0) >= 0.65 ? best : null;
    const weakest = byValue[byValue.length - 1];
    const weakLine = weakest && weakest !== strongest && (weakest.estimate.value ?? 1) < 0.65 ? weakest : null;
    // "Thin" counts bands this sitting COULD have measured and did not — not
    // bands the instrument or the course's own questions cannot reach, which
    // have their own notes and are not the learner's gap.
    const thin = (done.skills ?? []).filter((s) => s.inBank && s.reachable && !s.estimate.measured).length;
    const skipped = done.skippedBands ?? [];
    return (
      <main className="container narrow" style={{ paddingTop: 44 }}>
        <p className="eyebrow"><span className="no">✓</span> {t(`subj.${subject}`)} · {t("diag.title")}</p>
        {/* The report's OWN heading. It used to be `diag.done` — "Finish
            diagnostic" — which is the last question's button: the screen that
            says what was measured titled itself with the instruction the learner
            had just followed. The button keeps that string; the report names
            itself. */}
        <h1>{t("diag.report")}</h1>
        <p className="lead">{n} {t("diag.q1").toLowerCase()} · {nCorrect} ✓ · {done.misconceptions.length} {t("learn.misconceptions").toLowerCase()}</p>

        {done.misconceptions.length > 0 && (
          <section className="ruled">
            <p className="eyebrow"><span className="no">!</span> {t("learn.misconceptions")}</p>
            {done.misconceptions.map((m) => {
              const misc = MISCONCEPTIONS_BY_ID[m.id];
              return (
                <div key={m.id} className="note">
                  <strong>{mcName(lang, m.id, misc?.name ?? m.id)} <span className="mono">×{m.count}</span></strong>
                  <span className="small">{mcCoaching(lang, m.id, misc?.coaching ?? "")}</span>
                </div>
              );
            })}
          </section>
        )}

        {/* DEMAND LEVEL, not just topics. "Vaccination 50%" cannot be acted on;
            "you recall and apply, but unfamiliar data is where you lose marks"
            can. Each row carries the CONFIDENCE of its number, because 2/2 and
            6/6 are the same percentage and not the same evidence — showing the
            percentage without it would over-claim. Only skills the bank can
            actually measure get a number; the rest say "not measured", because
            a learner must never infer that their extended writing was assessed
            by a multiple-choice item. */}
        {done.skills && done.skills.length > 0 && (
          <section className="ruled">
            <p className="eyebrow"><span className="no">◎</span> {t("diag.skillsTitle")}</p>
            <p className="small muted" style={{ margin: "0 0 8px" }}>{t("diag.skillsSub")}</p>
            {done.skills.map((sk) => {
              const est = sk.estimate;
              return (
                <div key={sk.skill} className="rowline">
                  <span className="grow">{t(`skill.${sk.skill}`)}</span>
                  {!est.measured ? (
                    <span className="small muted">{t("diag.notMeasured")}</span>
                  ) : (
                    <span className="mono">
                      {est.correct}/{est.attempts} · {Math.round((est.value ?? 0) * 100)}%
                      {est.interval && <> · {Math.round(est.interval[0] * 100)}–{Math.round(est.interval[1] * 100)}%</>}
                      {" · "}{t(`conf.${est.confidence}`)}
                    </span>
                  )}
                </div>
              );
            })}
            <p className="small muted" style={{ marginTop: 8 }}>{t("diag.estNote")}</p>
            {/* Two different honesties, kept apart: a band the multiple-choice
                instrument cannot measure at all, and a band no question in the
                bank reaches yet. Neither is the learner's fault, and saying so
                is the difference between a measurement and an accusation. */}
            {done.skills.some((sk) => sk.skill === "extended_response" && !sk.inBank) && (
              <p className="small muted" style={{ marginTop: 4 }}>{t("diag.bankNote")}</p>
            )}
            {done.skills.some((sk) => sk.skill === "data_interpretation" && !sk.inBank) && (
              <p className="small muted" style={{ marginTop: 4 }}>{t("diag.depthNote")}</p>
            )}
            {done.skills.some((sk) => sk.inBank && !sk.reachable) && (
              <p className="small muted" style={{ marginTop: 4 }}>{t("diag.unreachableNote")}</p>
            )}
          </section>
        )}

        {/* §15: the report has to TELL the learner something rather than score
            them. Every sentence here is derived from the evidence above — the
            strongest and weakest measured levels, what was not measured, and
            any band skipped as already demonstrated. */}
        {(strongest || weakLine || thin > 0 || skipped.length > 0) && (
          <section className="ruled">
            <p className="eyebrow"><span className="no">✓</span> {t("diag.foundTitle")}</p>
            {strongest && (
              <p style={{ margin: "0 0 6px" }}>
                {fill(t("diag.foundStrong"), { band: t(`skill.${strongest.skill}`), a: strongest.estimate.correct, b: strongest.estimate.attempts })}
              </p>
            )}
            {weakLine && (
              <p style={{ margin: "0 0 6px" }}>
                {fill(t("diag.foundWeak"), { band: t(`skill.${weakLine.skill}`), a: weakLine.estimate.correct, b: weakLine.estimate.attempts })}
              </p>
            )}
            {thin > 0 && (
              <p style={{ margin: "0 0 6px" }}>{fill(t("diag.foundThin"), { k: thin })}</p>
            )}
            {skipped.map((b) => (
              <p key={b} className="small muted" style={{ margin: "0 0 6px" }}>
                {fill(t("diag.foundSkip"), { band: t(`skill.${b}`) })}
              </p>
            ))}
          </section>
        )}

        <section className="ruled">
          <p className="eyebrow">{t("map.strengths")} / {t("map.gaps")}</p>
          {probed.map((s) => (
            <Link key={s.conceptId} href={`/learn/${subject}/${s.conceptId}`} className="rowline">
              <span className={`mark ${s.mastery >= 0.65 ? "good" : "bad"}`} aria-hidden="true">
                {s.mastery >= 0.65 ? "✓" : "✗"}
              </span>
              <span className="grow">{ctitle(lang, s.conceptId)}</span>
              <span className="mono">{Math.round(s.mastery * 100)}%</span>
            </Link>
          ))}
          {/* There used to be a paragraph here listing `done.gaps` concepts
              this sitting had NOT probed, headed "Gaps to close" — an
              accusation built from eight never-asked coverage rows. `gaps` is
              now drawn only from probed concepts, so the branch was not just
              wrong but unreachable; the unmeasured state is reported where it
              belongs, as `asked: 0` coverage. */}
        </section>

        {/* Diagnose another subject without going back through the map — the
            maths-only path made the other four subjects look empty. */}
        <div className="actions" style={{ marginBottom: 4 }}>
          {SUBJECT_IDS.map((s) => (
            <Link
              key={s}
              href={`/diagnostic/${s}`}
              className={s === subject ? "btn small" : "btn small ghost"}
              aria-current={s === subject ? "page" : undefined}
            >
              {t(`subj.${s}`)}
            </Link>
          ))}
        </div>

        {/* Diagnostic → plan → Home: the measured learner is handed to the
            next-step engine, which is the only thing Home is for. */}
        <div className="actions">
          <Link href="/dashboard" className="btn">{t("nav.home")} →</Link>
          <Link href={`/learn/${subject}`} className="btn ghost">{t("dash.continue")}</Link>
          <Link href="/papers" className="btn ghost">{t("pp.title")}</Link>
        </div>
      </main>
    );
  }

  // ── the ladder ─────────────────────────────────────────────────────────────
  return (
    <main className="container narrow" style={{ paddingTop: 44 }}>
      <p className="eyebrow"><span className="no">{String(n).padStart(2, "0")}</span> {t("diag.title")} · {t(`subj.${subject}`)}</p>
      <h1 className="visually-small">{t("diag.sub")}</h1>

      {/* A resumed sitting SAYS SO. Reloading mid-diagnostic used to serve a
          different question 01 labelled "01", and the only honest reading of
          that was "the app threw my work away". One line, using a key that is
          already authored in every dictionary, says what actually happened. */}
      {resumed && (
        <p className="note" role="status">
          <span>{t("state.resume")}</span>
        </p>
      )}

      {err && (
        <div className="note">
          <span>{err}</span>
          <div className="actions"><Link href="/onboarding" className="btn small">{t("onb.start")}</Link></div>
        </div>
      )}

      {!q && !err && <p className="muted">{t("common.loading")}</p>}

      {q && (
        <div className="exercise">
          <p className="qnum mono">{String(n).padStart(2, "0")}.</p>
          <p className="qtext">{q.prompt}</p>
          <div className="choices">
            {q.choices.map((c, i) => (
              <button
                key={i}
                className="choice"
                data-state={graded ? (i === graded.answerIndex ? "right" : i === picked ? "wrong" : "dim") : ""}
                disabled={!!graded}
                onClick={() => answer(i)}
              >
                <span className="letter">{String.fromCharCode(65 + i)}</span>{c}
              </button>
            ))}
          </div>
          {graded && (
            <div className={`marking ${graded.correct ? "good" : "bad"}`}>
              <span className="mark" aria-hidden="true">{graded.correct ? "✓" : "✗"}</span>
              <p>{graded.explanation}</p>
            </div>
          )}
          <div className="actions">
            {graded && (
              <button className="btn" onClick={next}>
                {nextQ ? `${t("diag.next")} →` : `${t("diag.done")} →`}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
