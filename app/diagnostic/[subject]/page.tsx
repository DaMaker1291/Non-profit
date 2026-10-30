"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProfile, useI18n, loadLocalProfileId, useProfile } from "@/lib/client";
import * as api from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import { getConcept } from "@/lib/genome";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { SUBJECT_IDS, SUBJECT_LABELS, subjectFromParam } from "@/lib/subjects";
import { ctitle, mcName, mcCoaching } from "@/lib/content-i18n";
import PromptText from "@/components/prompt-text";
import MathText from "@/components/math-text";
import { fill } from "@/lib/i18n";
import type { DiagnosticResult, SubjectId } from "@/lib/types";
import type { QuestionView } from "@/lib/questions";

type Graded = { correct: boolean; explanation: string; answerIndex: number | null };

/** One diagnostic run, server-graded. The client only sends a choice index. */
export default function DiagnosticPage() {
  const params = useParams<{ subject: string }>();
  const subject: SubjectId = subjectFromParam(params?.subject);
  const { t, lang } = useI18n();
  /** The shell's own learner state. A finished sitting changes where this
   *  learner belongs, and the route guard derives that from here — see `next`. */
  const { set: setLearner } = useProfile();

  // SERVED views: the diagnostic grades server-side, and the answer is not on
  // the wire. `Question` would be a type claiming a field that is not there.
  const [q, setQ] = useState<QuestionView | null>(null);
  const [nextQ, setNextQ] = useState<QuestionView | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  /** What the learner says about their OWN knowing, before they see the choices
   *  and before any verdict. Committed early on purpose: a grade shown first
   *  contaminates the self-report, and the whole point is a clean signal.
   *  "I don't know" is not a value here — it runs `skip`, a refusal to answer. */
  const [certainty, setCertainty] = useState<"sure" | "unsure" | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [n, setN] = useState(0);
  const [nCorrect, setNCorrect] = useState(0);
  const [done, setDone] = useState<DiagnosticResult | null>(null);
  /** True when this mount picked up a sitting that was already in progress. */
  const [resumed, setResumed] = useState(false);
  /** How long the whole sitting will be, from the server's forward simulation
   *  (`plannedQuestions`). Zero until it arrives, so the counter degrades to a
   *  bare number rather than to a total the app invented. */
  const [estimate, setEstimate] = useState(0);
  const [err, setErr] = useState("");
  const busy = useRef(false);

  const id = loadLocalProfileId();

  /** One refused step, in a form the learner reads rather than a status code. */
  function stepError(e: unknown): string {
    return e instanceof ApiError ? (e.code || `HTTP ${e.status}`) : `HTTP ?`;
  }

  const start = useCallback(async () => {
    if (!id) { setErr(t("onb.title")); return; }
    let body: Awaited<ReturnType<typeof api.diagnose>>;
    try {
      body = await api.diagnose({ action: "start", id, subject, lang, kind: "baseline" });
    } catch (e) {
      setErr(stepError(e));
      return;
    }
    if (!body.question) { setErr(t("common.error")); return; }
    setQ(body.question);
    // An adaptive sitting has NO fixed length, so the server hands back a
    // measured estimate (it simulates the climb). The counter says "about"
    // because that is exactly what the number is.
    setEstimate(typeof body.estimate === "number" ? body.estimate : 0);
    // A RESUMED SITTING SAYS SO, AND KEEPS ITS PLACE. The route used to replace
    // the live sitting on every mount, so a reload served a different question
    // 01 and `setN(1)` labelled it "01" — a learner reloading mid-diagnostic was
    // shown the start of something they had already done, with nothing on
    // screen to explain it. The server now hands back the unfinished sitting and
    // how far along it is, so the counter is honest and the banner names the
    // truth rather than letting the learner conclude the app lost their work.
    const asked = body.asked ?? 0;
    if (body.resumed && asked > 0) {
      setN(asked + 1);
      setResumed(true);
    } else {
      setN(1);
    }
  }, [id, subject, lang, t]);

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
      const body = await api.diagnose({
        action: "answer", id, subject, questionId: q.id, chosen: i, lang, certainty: certainty ?? undefined,
      });
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
      // The NEXT question is its own question: the previous one's self-report is
      // already on the ledger and must not carry over as if it had been stated
      // about this one.
      setCertainty(null);
      setN((v) => v + 1);
      return;
    }
    await finish();
  }

  /** "I don't know" — close the concept being measured and take the next one.
   *  The server has owned this action (`skip`) all along; the page never
   *  offered it, so a learner who genuinely did not know had to guess, and a
   *  guess is a worse measurement than an admission — it is noise the report
   *  then has to reason about. When nothing follows, the sitting is over and
   *  closes exactly as the last question would. */
  async function skip() {
    if (busy.current || graded || !id) return;
    busy.current = true;
    try {
      let body: Awaited<ReturnType<typeof api.diagnose>>;
      try {
        body = await api.diagnose({ action: "skip", id, subject, lang });
      } catch (e) {
        setErr(stepError(e));
        return;
      }
      setResumed(false);
      if (!body.next) {
        // Release the lock so `finish` can take it — it guards the same ref.
        busy.current = false;
        await finish();
        return;
      }
      setQ(body.next);
      setNextQ(null);
      setPicked(null);
      setGraded(null);
      setCertainty(null);
      setN((v) => v + 1);
    } finally {
      busy.current = false;
    }
  }

  /** Close the sitting and show the report. */
  async function finish() {
    // ONE GUARD, BOTH PATHS. `answer` has always refused a second submission
    // while one was in flight; this one did not — so a double-click on the
    // button that ENDS the sitting asked the server to finish twice, and the
    // second ask is `400 no active session`, which the error branch below put on
    // screen as raw server text in the middle of a first run. Measured against
    // the live route: first finish 200 with the report, second 400 with that
    // error string.
    // `start` already refuses without a learner, so this is unreachable in the
    // ordinary flow — but the sitting is about a NAMED learner, and a close with
    // no name is not a close.
    if (!id) { setErr(t("onb.title")); return; }
    if (busy.current) return;
    busy.current = true;
    try {
      // ladder exhausted — close the session and show the report. The session's
      // per-concept ladders ride along (audit P0-A): the grading route folds
      // this run's evidence into the learner model, so the diagnostic actually
      // initializes the state the next-step engine reads.
      let body: Awaited<ReturnType<typeof api.diagnose>>;
      try {
        body = await api.diagnose({ action: "finish", id, subject });
      } catch (e) {
        setErr(stepError(e));
        return;
      }
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
    // The strengths/gaps list is ONE list with two kinds of row, so its heading
    // has to name the kinds it actually contains: below the plan's 0.65 line
    // there is a gap to close, above it there is a strength. (The same line the
    // strongest-evidence check uses, so one report cannot call a concept strong
    // in one place and a gap in another.)
    const hasGap = probed.some((s) => s.mastery < 0.65);
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
    // have their own notes and are not the learner's gap, and not bands the
    // sitting's own PLACEMENT opened above (`notAsked`), which a learner who
    // answered correctly on the way up used to be shown as a bare "not
    // measured" — an absence of a question presented as an absence of knowing.
    const thin = (done.skills ?? []).filter((s) => s.inBank && s.reachable && !s.estimate.measured && !s.notAsked).length;
    const notAsked = (done.skills ?? []).filter((s) => s.inBank && s.notAsked);
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

        {/* WHAT THE LEARNER SAID ABOUT THEIR OWN KNOWING. A score counts a
            confident right answer and a half-guessed one identically; this is
            the one line that tells them apart, and it is only shown when there
            is something to say — never as an empty reassurance. */}
        {/* …AND ONLY WHEN THERE IS A CONTRAST TO DRAW. With a single correct
            answer the sentence rendered "You were unsure on 1 of the 1 answers
            you got right", which is a claim about nothing stated clumsily: the
            note exists to say a learner's accuracy OVERSTATES their grip, and
            that needs at least two right answers to mean anything. */}
        {done.certainty && done.certainty.unsureCorrect > 0 && nCorrect >= 2 && (
          <p className="note" data-certainty-note>
            <span>{fill(t("diag.certaintyNote"), { u: done.certainty.unsureCorrect, n: nCorrect })}</span>
          </p>
        )}

        {done.misconceptions.length > 0 && (
          <section className="ruled">
            <p className="eyebrow"><span className="no">!</span> {t("learn.misconceptions")}</p>
            {done.misconceptions.map((m) => {
              const misc = MISCONCEPTIONS_BY_ID[m.id];
              return (
                <div key={m.id} className="note">
                  <strong>{mcName(lang, m.id, misc?.name ?? m.id)} <span className="mono">×{m.count}</span></strong>
                  {mcCoaching(lang, m.id, misc?.coaching ?? "") !== "" && (
                    <span className="small">{mcCoaching(lang, m.id, misc?.coaching ?? "")}</span>
                  )}
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
            {/* The third honesty — a level the sitting started above — is stated
                ONCE, in "What we found" below, where it names the band ("Recall
                sits below where your course starts you"). It used to be printed
                here as a general paragraph AND there as a specific line, so the
                same explanation appeared twice on one screen with one of them
                adding nothing. `notAsked` still gates that block. */}
          </section>
        )}

        {/* §15: the report has to TELL the learner something rather than score
            them. Every sentence here is derived from the evidence above — the
            strongest and weakest measured levels, what was not measured, and
            any band skipped as already demonstrated. */}
        {(strongest || weakLine || thin > 0 || skipped.length > 0 || notAsked.length > 0) && (
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
            {notAsked.map((s) => (
              <p key={s.skill} className="small muted" style={{ margin: "0 0 6px" }}>
                {fill(t("diag.foundNotAsked"), { band: t(`skill.${s.skill}`) })}
              </p>
            ))}
            {skipped.map((b) => (
              <p key={b} className="small muted" style={{ margin: "0 0 6px" }}>
                {fill(t("diag.foundSkip"), { band: t(`skill.${b}`) })}
              </p>
            ))}
          </section>
        )}

        <section className="ruled">
          {/* NAMED FOR WHAT IT HOLDS. The heading always read "Strengths / Gaps
              to close", and a sitting where every probed concept landed above
              the bar printed it over a list of strengths alone — a title
              promising a second list that is not there. */}
          <p className="eyebrow">{hasGap ? `${t("map.strengths")} / ${t("map.gaps")}` : t("map.strengths")}</p>
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

        {/* Diagnostic → plan → Home: the measured learner is handed to the
            next-step engine, which is the only thing Home is for. These come
            FIRST: they are what the report is for. */}
        <div className="actions">
          <Link href="/dashboard" className="btn">{t("nav.home")} →</Link>
          <Link href={`/learn/${subject}`} className="btn ghost">{t("dash.continue")}</Link>
          <Link href="/papers" className="btn ghost">{t("pp.title")}</Link>
        </div>

        {/* Diagnose another subject without going back through the map — the
            maths-only path made the other four subjects look empty.

            UNDER A LABEL, AND AFTER THE ACTIONS. Five pills sat here unlabelled
            and ABOVE the primary buttons: on screen they read as a tab bar whose
            selection was already made, and two stacked rows of pills doing
            different jobs with nothing saying which was which. The label is
            `nav.subjects` — a noun every dictionary already has — so the row
            announces itself as navigation and the actions keep the eye first. */}
        <p className="small muted" style={{ margin: "18px 0 6px" }}>{t("nav.subjects")}</p>
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
      </main>
    );
  }

  // ── the ladder ─────────────────────────────────────────────────────────────
  return (
    <main className="container narrow" style={{ paddingTop: 44 }}>
      {/* THE TITLE IS THE SUBJECT, THE EYEBROW IS THE SHELF. The h1 here used
          to BE the guidance sentence ("A few questions per concept…"), so the
          page's largest text printed a paragraph and the learner had to reach
          the grey line to find out what they were sitting. Same shape as
          /learn/<subject>: a shelf label, then the subject, then the sentence
          that explains the task. */}
      <p className="eyebrow"><span className="no">{String(n).padStart(2, "0")}</span> {t("diag.title")} · {t(`subj.${subject}`)}</p>
      <h1>{t(`subj.${subject}`)}</h1>
      <p className="lead">{t("diag.sub")}</p>

      {/* HOW LONG THIS IS, AND A WAY OUT. The only number on this screen used
          to be a bare `01.`, with no total and no exit, so the sitting read as
          open-ended. The total is an ESTIMATE — a sitting is adaptive, so the
          server measures it by simulating the climb and the counter says
          "about" — and the concept is NAMED, so the learner knows what is
          being measured rather than only how many are left. Leaving keeps the
          sitting: the server resumes the same kind of sitting, and the notice
          below says so when they come back. */}
      <div className="rowline" style={{ marginBottom: 6 }}>
        <span className="grow small muted" role="status" aria-live="polite">
          {estimate > 0 ? fill(t("diag.progress"), { n, m: estimate }) : String(n)}
          {q?.conceptId ? ` · ${ctitle(lang, q.conceptId)}` : ""}
        </span>
        <Link href={`/learn/${subject}`} className="small muted">{t("diag.leave")}</Link>
      </div>
      {/* HOW FAR THROUGH, AS A BAR. The counter above says "question 3 of about
          16", which a learner has to read and divide; a sitting is a bounded
          piece of work and every platform a school uses draws it. It is the same
          device the subject page uses for the same idea (`.coverage-bar`), so
          "how much of this is done" looks the same everywhere. Decorative to a
          screen reader — the counter beside it is already announced. */}
      {estimate > 0 && (
        <div className="coverage-bar" aria-hidden="true" style={{ margin: "0 0 10px" }}>
          <span style={{ width: `${Math.min(100, Math.round((Math.min(n, estimate) / estimate) * 100))}%` }} />
        </div>
      )}
      {/* It measures a starting point; it is not a grade. One line, already
          authored in every dictionary, shown on the FIRST question of a fresh
          sitting only — a resumed sitting is past being introduced to itself,
          and a reassurance repeated under every question is noise. */}
      {!resumed && n === 1 && (
        <p className="small muted" style={{ margin: "0 0 8px" }}>{t("state.needsDiagnostic")}</p>
      )}

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
          <div className="qtext"><PromptText text={q.prompt} figure={q.figure} /></div>
          {/* HOW SURE ARE YOU — asked FIRST, before the choices are revealed and
              before anything is marked, so the grade cannot contaminate the
              self-report. "I don't know" runs the existing skip action: a
              refusal to answer, which is a better measurement than a guess. */}
          {!certainty && !graded && (
            <div className="actions" role="group" aria-label={t("diag.certaintyAsk")} data-certainty>
              <span className="small muted" style={{ flexBasis: "100%" }}>{t("diag.certaintyAsk")}</span>
              <button className="btn ghost small" onClick={() => setCertainty("sure")}>{t("diag.sure")}</button>
              <button className="btn ghost small" onClick={() => setCertainty("unsure")}>{t("diag.unsure")}</button>
              <button className="btn ghost small" onClick={skip}>{t("diag.dontKnow")}</button>
            </div>
          )}
          {(certainty || graded) && (
          <div className="choices">
            {q.choices.map((c, i) => (
              <button
                key={i}
                className="choice"
                data-state={graded ? (i === graded.answerIndex ? "right" : i === picked ? "wrong" : "dim") : ""}
                disabled={!!graded}
                onClick={() => answer(i)}
              >
                <span className="letter">{String.fromCharCode(65 + i)}</span><MathText text={c} />
              </button>
            ))}
          </div>
          )}
          {graded && (
            <div className={`marking ${graded.correct ? "good" : "bad"}`}>
              <span className="mark" aria-hidden="true">{graded.correct ? "✓" : "✗"}</span>
              <p><MathText text={graded.explanation} /></p>
            </div>
          )}
          <div className="actions">
            {/* The ways out are all above the fold now: "I don't know" sits
                beside the two certainty options (it is a refusal to answer, and
                a refusal the server already knew how to record), and once an
                answer is marked this is the single primary action. */}
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
