"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret, fetchProfile } from "@/lib/client";
import * as api from "@/lib/api/client";
import { ApiError, answerQuestion } from "@/lib/api/client";
import { ctitle, cblurb, mcName, mcCoaching } from "@/lib/content-i18n";
import { dueLabel, fill, localeFor } from "@/lib/i18n";
import { isNextKind, type NextAction, type NextKind } from "@/lib/next-engine";
import { decideOne, decisionContextFrom } from "@/lib/decision";
import { loadLedger, conceptKnowledge, type LedgerFetch } from "@/lib/evidence-view";
import type { QuestionView } from "@/lib/questions";
import { SESSION_TARGET, type SessionResult } from "@/lib/session";
import { proofLabelKey, proofSentenceKey, verdictForGrade } from "@/lib/proof";
import { declareQuestion } from "@/lib/question-bank";
import { evidenceFor } from "@/lib/learner-model";
import SessionResultPanel from "@/components/session-result";
import { Dims } from "@/components/dims";
import TutorPanel from "@/components/tutor-panel";
import { getConcept, ancestorsOf } from "@/lib/genome";
import { SUBJECT_LABELS } from "@/lib/subjects";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { HINT_LEVELS } from "@/lib/hints";
import MicroDiagnostic from "@/components/micro-diagnostic";
import SpeakButton from "@/components/speak-button";
import { Icon } from "@/components/icons";
import PromptText from "@/components/prompt-text";
import MathText from "@/components/math-text";
import NumericAnswer from "@/components/numeric-answer";
import WorkSheet from "@/components/work-sheet";
import ListenFirst from "@/components/listen-first";
import PeerTeach from "@/components/peer-teach";
import LessonWorkedExample from "@/components/lesson-worked-example";
import RepairCard from "@/components/repair-card";
import { repairFor } from "@/lib/repair";
import { planFor } from "@/lib/lesson-plans";
import { exampleFor } from "@/lib/culture";
import type { FlarePayload } from "@/lib/microdiag";
import { subjectFromParam } from "@/lib/subjects";
import type { StudyPack } from "@/lib/types";

type Graded = { correct: boolean; explanation: string; misconceptionId?: string | null; answerIndex: number | null; flare?: FlarePayload | null; evidence?: AnswerEvidence | null };

/** WHAT THE SERVER SAW the answer being, returned with the grade.
 *
 *  The verdict says whether the answer was right. This says what it PROVED:
 *  whether the learner worked unaided, whether the idea was applied somewhere
 *  new, and whether this was delayed recall. All three are attributed
 *  server-side — the client renders them and never computes them, because a
 *  browser that could award itself autonomy could award itself mastery (§10,
 *  §14). Absent on an older response: the note is then simply not drawn, and
 *  no verdict is invented. */
type AnswerEvidence = { mode: "guided" | "independent" | "transfer"; hints: number; source: string; retained: boolean };

/** What the SERVE decided about difficulty, in the server's own words: which
 *  rule fired, the band the item actually falls in, and whether the learner
 *  needs support. The client renders it — it never computes it, because a
 *  browser that could compute its own reason could also invent one. */
type ServeTarget = { reason: "fresh" | "steady" | "stretch" | "repair"; band: number; scaffold: boolean; slipCheck?: boolean };

export default function ConceptPage() {
  const params = useParams<{ subject: string; concept: string }>();
  const subject = subjectFromParam(params?.subject);
  const conceptId = params?.concept ?? "";
  const c = getConcept(conceptId);
  /** THE AUTHORED LESSON, IF THIS CONCEPT HAS ONE. Null is the normal answer for
   *  most of the genome today, and every plan-only section is skipped rather than
   *  drawn empty — a card with a heading and no teaching is worse than no card. */
  const plan = planFor(conceptId);
  const { t, lang } = useI18n();
  const { state, set: setState } = useProfile();
  // The SERVED view, not the bank's Question: the answer is not on the wire,
  // and the type is what stops a surface from reaching for it.
  const [q, setQ] = useState<QuestionView | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);
  /** This answer is held on the device and will be marked on reconnect (§4
   *  offline). A third outcome beside right and wrong: the answer exists, the
   *  marking does not yet. */
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [why, setWhy] = useState<ServeTarget | null>(null);
  const [stage_, setStage_] = useState<"lesson" | "practise" | "transfer">("lesson");
  /**
   * WHICH STAGE OF THIS PAGE IS ON SCREEN — read, or practise.
   *
   * The page used to stack all of it: the status card, the lesson, "teach
   * someone else", the misconceptions, the evidence, the question and the tutor,
   * then the study packs. Measured on a 1,215px screen it ran 2,542px, so the
   * question was two screens below the point where a learner arrived and the
   * tutor sat beside a card they had to scroll to find. The four chips at the
   * top (1 Read · 2 Practise · 3 Prove · 4 Transfer) already told a learner this
   * page HAS stages; they simply did not switch anything. They switch now, and
   * the two of them that are views are buttons.
   *
   * Prove and Transfer are NOT views: they are stages of the session the SERVER
   * drives (a marked answer, then a re-framed one), so they stay status chips —
   * a chip that could be pressed to show a question that has not been staged
   * would be a control that lies about what it does.
   */
  const [view, setView] = useState<"read" | "practise">("read");
  /**
   * Did the transfer serve achieve a genuinely different surface?
   *
   * `null` until a transfer question is served (nothing to say yet). `false`
   * means the server could not re-frame this concept's question and served a
   * harder version of the SAME form — real stretch, but not transfer, and the
   * header must not claim otherwise. The server decides it; the client only
   * reports what the serve handed it (`reframed`).
   */
  const [reframed, setReframed] = useState<boolean | null>(null);
  /**
   * Can this concept's questions be put on a second surface at all? A fact the
   * SERVER owns (it asks the re-framer: lib/transfer.ts#canTransfer) and every
   * serve carries. It decides whether the last step of the path is Transfer or
   * deeper work on the same question — 133 of the 135 concepts in the bank
   * cannot yet be re-framed, and the path used to promise all of them transfer.
   * Undefined means "not told yet" (the first serve is still in flight).
   */
  const [transferable, setTransferable] = useState<boolean | undefined>(undefined);
  const [transferOk, setTransferOk] = useState(false);
  const busy = useState(false);
  // Audit P0-E moved every write behind the profile's capability secret. This
  // page was missed, so serve/answer/hint answered 401 and practice could not
  // be answered at all in a browser. Read it per request (never at render) and
  // a legacy profile binds it on the first call.
  const withSecret = () => loadLocalProfileSecret() ?? "";

  // ── The learning session (§ closed loop) ──────────────────────────────────
  // A session has a target, an end, and a result that says what changed. The
  // baseline it is measured against is captured server-side, so the before/after
  // on the result screen cannot be flattered by the client.
  const [phase, setPhase] = useState<"idle" | "active" | "feedback" | "proving" | "complete">("idle");
  const [target, setTarget] = useState(SESSION_TARGET);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [sessErr, setSessErr] = useState("");
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  // The ledger, so this page's decisions come through the same door as Home's.
  // Loaded lazily: the lesson renders from the model immediately, and the
  // citations arrive with the ledger.
  const [ledger, setLedger] = useState<LedgerFetch | null>(null);
  // Work a teacher set on THIS concept, if any: the deadline a learner needs
  // while they are actually doing the work, not only on Home. Null covers
  // "none set" AND "the read failed" — this page never claims either on the
  // strength of the other, and the panel on Home reports a failed read.
  const [assignedDue, setAssignedDue] = useState<number | null>(null);
  // The tutor is a PANEL beside the question (§tutor), not a page: on a phone
  // it is a sheet the learner opens with one button.
  const [tutorOpen, setTutorOpen] = useState(false);
  // Whether the full explanation has been asked for. On a wrong answer the
  // coaching line teaches and the explanation is OFFERED — dumping three
  // paragraphs on a learner the moment they get something wrong is how
  // feedback stops being read at all.
  const [showWhy, setShowWhy] = useState(false);

  // The exercise clock: how long this sitting has been open. A stopwatch, not
  // a deadline — it starts when a session starts and stops when it closes, so
  // a learner can see that the eight minutes the card promised is eight
  // minutes and not a guess. It is the learner's own clock, never a score.
  const [clock, setClock] = useState(0);
  const clockFrom = useRef<number | null>(null);
  useEffect(() => {
    const running = phase === "active" || phase === "feedback" || phase === "proving";
    if (!running) { clockFrom.current = null; return; }
    if (clockFrom.current === null) clockFrom.current = Date.now();
    const id = setInterval(() => setClock(Date.now() - (clockFrom.current ?? Date.now())), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const prereqs = c ? c.prereqs : [];
  const id = loadLocalProfileId();

  useEffect(() => {
    const pid = loadLocalProfileId();
    if (!pid || !conceptId) return;
    let alive = true;
    api.assignments(pid)
      .then((j) => {
        // The deadline of the work that covers THIS concept, if any was set.
        const w = (j.assigned ?? []).find((x) => x.assignment.conceptIds.includes(conceptId));
        if (alive && w) setAssignedDue(w.assignment.dueAt);
      })
      .catch(() => { /* no assignment read here — Home says so if it failed */ });
    return () => { alive = false; };
  }, [conceptId]);

  // What kind of work this is, taken from the plan rather than guessed: if the
  // engine's top recommendation is this concept, its action names the session
  // (a repair session is not the same work as a stretch one).
  const intent = useMemo<NextKind>(() => {
    // An explicit intent wins: a paper's "practise this weakness" or the
    // mistakes page says *what kind of work this is* — a repair session is not
    // the same work as a stretch one, and the result screen must say so.
    if (typeof window !== "undefined") {
      const asked = new URLSearchParams(window.location.search).get("intent");
      if (asked && isNextKind(asked)) return asked;
    }
    // The KIND is the model's to choose — a ledger that has not arrived yet
    // changes an action's CITATIONS, never which work is next — so this stays
    // right while the fetch is in flight, and the action it reads is flagged
    // `unknown` rather than dressed up as an evidence-free decision.
    const top = state
      ? decideOne(decisionContextFrom(state, ledger), { tt: t, title: (cid) => ctitle(lang, cid) })
      : undefined;
    return top && top.conceptId === conceptId ? top.kind : "PRACTISE";
  }, [state, conceptId, t, lang, ledger]);

  const load = useCallback(async () => {
    if (!id) { setErr(t("common.anon")); return; }
    setPicked(null);
    setGraded(null);
    setSaved(false);
    setStuck(false);
    setHint(null);
    setHintLevel(0);
    setStage_("lesson");
    setTransferOk(false);
    let body: api.ServedQuestionResponse;
    try {
      body = await api.serveQuestion(id, conceptId, { lang });
    } catch (e) {
      setErr(e instanceof ApiError ? (e.code || `HTTP ${e.status}`) : `HTTP ?`);
      return;
    }
    setQ(body.question ?? null);
    if (typeof body.transferable === "boolean") setTransferable(body.transferable);
    setWhy(body.target ?? null);
    // When the serve says this learner needs support, the ladder is OPEN rather
    // than merely available: a student who is struggling should not have to
    // guess that help exists. Nothing is recorded by opening it — hint credit
    // is only counted when a hint is actually asked for.
    setStuck(Boolean(body.target?.scaffold));
    setServedAt(Date.now());
  }, [id, conceptId, t, lang]);

  /** Open (or resume) the session. Resuming matters: a dropped connection must
   *  not silently restart the measurement the learner has already given. */
  const start = useCallback(async () => {
    if (!id) return;
    setSessErr("");
    setResult(null);
    setNextAction(null);
    try {
      // Resuming is the server's decision: a session already open for this
      // concept continues rather than silently restarting the measurement.
      const body = await api.startSession(id, conceptId, { kind: intent });
      setTarget(body.session?.target ?? SESSION_TARGET);
      setCount(body.session?.asked ?? 0);
      setPhase("active");
    } catch {
      setSessErr(t("sess.err"));
    }
  }, [id, conceptId, intent, t]);

  // Open the session once per concept visit. Without this guard the effect
  // re-fires when the profile refreshes (which changes `intent`, hence `start`)
  // and re-opening the session would clear the result panel the learner is
  // reading — the loop would close and then immediately rewind.
  const opened = useRef<string | null>(null);
  useEffect(() => {
    const key = `${id}:${conceptId}`;
    if (!id || opened.current === key) return;
    opened.current = key;
    void (async () => { await start(); await load(); })();
  }, [id, conceptId, start, load]);

  // The ledger for this page's decisions. Non-blocking and independent of the
  // session: the lesson renders from the model at once, and the citations
  // arrive when the ledger does (exactly as Home's card does).
  useEffect(() => {
    if (!id) return;
    let alive = true;
    loadLedger(id).then((l) => { if (alive) setLedger(l); });
    return () => { alive = false; };
    // `withSecret` is a fresh closure each render, so it must not be a dep or
    // this fetches on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Study packs: the community layer — write, fork, translate, vote ──────
  const [packs, setPacks] = useState<StudyPack[]>([]);
  const [composing, setComposing] = useState(false);
  const [packTitle, setPackTitle] = useState("");
  const [packBody, setPackBody] = useState("");
  const [packBusy, setPackBusy] = useState(false);

  // ── The "I'm stuck" ladder: graduated scaffolding, recorded per request ──
  const [stuck, setStuck] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintBusy, setHintBusy] = useState(false);
  const [servedAt, setServedAt] = useState(0);

  const loadPacks = useCallback(async () => {
    try {
      const j = await api.packsFor(conceptId);
      setPacks(j.packs ?? []);
    } catch {
      /* packs are a bonus layer; the lesson works without them */
    }
  }, [conceptId]);

  useEffect(() => { void loadPacks(); }, [loadPacks]);

  async function postPack(payload: { action: "create" | "fork" | "helpful"; [k: string]: unknown }) {
    if (!id) return;
    setPackBusy(true);
    try {
      await api.packAction({ id, ...payload });
      await loadPacks();
    } catch { /* packs are a bonus layer; the lesson works without them */ }
    finally {
      setPackBusy(false);
    }
  }

  async function submitPack() {
    await postPack({ action: "create", conceptId, title: packTitle.trim(), body: packBody.trim() });
    setPackTitle("");
    setPackBody("");
    setComposing(false);
  }

  if (!c) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        <p className="eyebrow"><span className="no">!</span> 404</p>
        <h1 className="visually-small">{t("learn.notFound")}</h1>
        {/* THE LABEL NAMES WHERE IT GOES. It read "Five subjects, one Knowledge
            Genome" — that is /learn's own heading — on a link that returns to
            ONE subject. A back link whose words describe a different page is a
            learner's cue to expect the wrong screen. */}
        <Link href={`/learn/${subject}`} className="btn ghost">← {t(SUBJECT_LABELS[subject])}</Link>
      </main>
    );
  }

  /** Submit an answer. ONE function for both response kinds, because the
   *  consequence of an answer — evidence, feedback, the session's count — must
   *  be identical whichever way it was given. Only the field the server reads
   *  differs: `choiceIndex` for a picked option, `numericAnswer` for a typed
   *  one. The server decides which shape the staged question actually was, so
   *  a client cannot grade a numeric item by picking an option.
   */
  async function answer(i: number) {
    await submit({ choiceIndex: i });
  }

  /** A server refusal, in the learner's language.
   *
   *  The raw codes name internal states — "not a number", "stale or unknown
   *  question", "bad request" — and the last of those reads as an accusation
   *  aimed at the learner. A learner typing a letter into a number box was shown
   *  the literal string "bad request" in the feedback panel. Known codes get
   *  their own sentence; anything else gets the neutral one.
   */
  function refusalText(code: unknown): string {
    if (code === "not a number") return t("answer.needNumber");
    return t("common.error");
  }

  async function submit(given: { choiceIndex: number } | { numericAnswer: string }) {
    if (graded || saved || !q || busy[0] || !id) return;
    busy[1](true);
    if ("choiceIndex" in given) setPicked(given.choiceIndex);
    try {
      // Every answer names its own SUBMISSION, and is delivered through the
      // queue's poster so a connection that drops mid-answer holds the work
      // instead of losing it. Online this is also what makes a lost response
      // safe: the server derives the ledger event's id from the submission, so
      // a replay is the same event rather than a second answer.
      const outcome = await answerQuestion({
        id, conceptId, questionId: q.id, ...given,
        ms: servedAt ? Date.now() - servedAt : undefined,
        lang,
      });
      if (outcome.kind === "offline") {
        // Not marked yet, and the learner is told exactly that. The question is
        // NOT consumed: nothing has been recorded, so nothing may be advanced.
        setSaved(true);
        return;
      }
      if (outcome.kind === "error") {
        setErr(refusalText(outcome.code));
        return;
      }
      const body = outcome.verdict;
      const correct = body.correct;
      const g: Graded = { correct, explanation: body.explanation, misconceptionId: body.misconceptionId, answerIndex: body.answerIndex, flare: body.flare ?? null, evidence: (body.demonstrated as AnswerEvidence | undefined) ?? null };
      setGraded(g);
      // The session's own count of what it has asked; the server holds the same
      // count authoritatively (it increments on grading) and wins at finish.
      setCount((n) => n + 1);
      setPhase("feedback");
      if (correct && stage_ === "transfer") setTransferOk(true);
    } finally {
      busy[1](false);
    }
  }

  /** Close the session: recompute the plan from the evidence just given and show
   *  what changed. Home is re-read afterwards so it renders the NEW decision. */
  async function finish() {
    if (!id) return;
    setSessErr("");
    try {
      let body: Record<string, unknown>;
      try {
        body = await api.finishSession(id, conceptId);
      } catch (e) {
        // "Nothing to close" is a different sentence from "we could not close
        // it", and a learner who never opened a session deserves the first.
        setSessErr(t(e instanceof ApiError && e.code === "no_session" ? "sess.nothing" : "sess.err"));
        return;
      }
      setResult(body.result as SessionResult);
      setPhase("complete");
      // Pull the recomputed state so the page (and Home, via the shared profile)
      // shows the plan the session produced rather than the one it started with.
      // The session just wrote evidence, so the ledger is re-read rather than
      // reused: the recomputed plan has to be the one the new evidence produced.
      const [fresh, led] = await Promise.all([fetchProfile(id), loadLedger(id)]);
      setLedger(led);
      if (fresh) {
        setState(fresh);
        setNextAction(decideOne(decisionContextFrom(fresh, led), { tt: t, title: (cid) => ctitle(lang, cid) }) ?? null);
      }
    } catch {
      setSessErr(t("sess.err"));
    }
  }

  /** Serve a fresh practice question — used for the transfer flow. */
  async function loadTransfer() {
    if (!id) return;
    setStage_("transfer");
    setTransferOk(false);
    setGraded(null);
    setPicked(null);
    setErr("");
    setHint(null);
    setHintLevel(0);
    setStuck(false);
    (async () => {
      try {
        // Transfer intent declared server-side: harder question staged, and the
        // grading is attributed as transfer by the server, not the client.
        const body = await api.serveQuestion(id, conceptId, { intent: "transfer", lang });
        const q = body.question;
        if (!q) return;
        setReframed(typeof body.reframed === "boolean" ? body.reframed : null);
        if (typeof body.transferable === "boolean") setTransferable(body.transferable);
        setQ(q);
        setServedAt(Date.now());
      } finally {
        // busy[1] is the setter from `const busy = useState(false)`.
        (busy as [boolean, (v: boolean) => void])[1](false);
      }
    })();
  }

  async function askHint(level: number) {
    if (!q || !id || hintBusy) return;
    setHintBusy(true);
    try {
      let body: api.HintPayload;
      try {
        body = await api.hint(id, conceptId, q.id, level);
      } catch (e) {
        setErr(e instanceof ApiError ? (e.code || `HTTP ${e.status}`) : t("common.error"));
        return;
      }
      const h = body.hint;
      if (h && (typeof h === "string" || typeof h.key === "string" || typeof h.text === "string")) {
        // KEY FIRST, THEN THE QUESTION'S OWN TEXT — the published twin composes
        // it in this order (docs/app.js) and this page used to do it the other
        // way round, so a rung that says "Subtract 5 from both sides" after
        // "Start from what the question gives you" read back to front. It
        // matters now that a rung can open with a translated sentence and follow
        // it with a repair's step: the lead-in has to come first.
        setHint(typeof h === "string" ? h : [h.key ? t(h.key) : "", h.text].filter(Boolean).join(" "));
        setHintLevel(level);
      } else {
        setErr(t("common.error"));
      }
    } finally {
      setHintBusy(false);
    }
  }

  const progress = state?.progress[conceptId];
  const streak = progress?.streak ?? 0;
  // The learner's own evidence for this concept, straight from the model every
  // other surface reads — shown before practice, so "practise this" is never a
  // bare instruction. "Not yet proven independently" is a real answer; the
  // panel never fills a gap with a number.
  const evidence = state ? evidenceFor(state, conceptId) : null;
  // WHAT WE KNOW about this concept, from the LEDGER's projection — the same
  // rows Mind and the evidence record read, so "Application: Developing" means
  // the identical thing on all three surfaces. Null while the ledger is in
  // flight: a loading ledger is not an empty one, and the dims below are not
  // drawn until the record has actually been read.
  const knowledge = ledger ? conceptKnowledge(ledger.projection, conceptId, t).rows : null;

  // Each new marking starts closed.
  useEffect(() => { setShowWhy(false); }, [graded]);

  // Learning path stages: lesson → practise → prove → transfer, now driven by
  // the session's own lifecycle instead of by "is there a question on screen".
  const stageDone: Record<string, boolean> = {
    lesson: true,
    practise: count >= target,
    prove: phase === "complete",
    transfer: transferOk,
  };
  const stageActive: Record<string, boolean> = {
    lesson: phase === "idle",
    practise: (phase === "active" || phase === "feedback") && stage_ !== "transfer",
    prove: stage_ === "transfer" || phase === "complete",
    transfer: stage_ === "transfer",
  };

  /** The stage actually on screen: the learner's own choice, and nothing else.
   *  It deliberately does NOT follow `phase`. The session opens on mount (so a
   *  dropped connection resumes rather than restarts), which means `phase` is
   *  already `"active"` the instant the page renders — a view derived from it
   *  would drop every learner onto a question before they had read the lesson,
   *  on a page whose first chip says "1. Read". */
  const showing: "read" | "practise" = view;

  // WHICH QUESTION THE LEARNER IS LOOKING AT, in one place.
  //
  // `count` is how many answers the server has graded, and it advances on
  // GRADING — not when the next question loads. Reading count + 1 unconditionally
  // relabelled the page "Question 2 of 5" the instant Q1 was answered, while Q1's
  // "not yet" and its Explanation/Retry controls were still the thing being read:
  // the header contradicted the panel beside it on the one screen that is a
  // countdown. Three call sites printed it, so they could disagree with each
  // other too; they read this now.
  //
  // The predicate is `graded`, because that is the value the screen itself uses
  // to choose between the feedback and the choices — `phase` looks equivalent but
  // is not: `load()` (the Next/Retry control) clears `graded` and serves a fresh
  // question without ever moving `phase` off "feedback", so a phase-based counter
  // under-reports by one for every question after a retry.
  const qOrdinal = Math.min(graded ? count : count + 1, target);

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <p className="eyebrow">{t(`subj.${c.subject}`)} · {ctitle(lang, c.id)}</p>
      <h1>{ctitle(lang, c.id)}</h1>
      <p className="lead">{cblurb(lang, c.id)}</p>
      {assignedDue !== null && (
        <p className="small" style={{ marginTop: -6, marginBottom: 14 }}>
          <span className="chip red">✎ {t("asg.setBy")}</span>{" "}
          <span className="muted">{fill(t("asg.due"), { date: dueLabel(lang, assignedDue) })}</span>
        </p>
      )}
      {state?.profile?.learningStyle && (
        <p className="small muted" style={{ marginTop: -10, marginBottom: 14 }}> {t("onb.learningStyle")}: <strong>{state.profile.learningStyle === "reading-writing" ? t("ls.reading") : t(`ls.${state.profile.learningStyle}`)}</strong>
          {state.profile.board && <> · {t("onb.board")}: {state.profile.board}</>}
          {state.profile.exam && <> · {t("learn.exam")}: {state.profile.exam}</>}
        </p>
      )}

      {/* Learning path: what you do next on this concept.
          The first two chips are the page's two stages, so they SWITCH it; the
          last two report the session's own progress. Everything below belongs
          to exactly one of the stages. */}
      <nav aria-label={t("path.aria")} style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "14px 0 20px" }}>
        {(["lesson", "practise", "prove", "transfer"] as const).map((s, i) => {
          const done = stageDone[s];
          const label =
            <>{i + 1}. {s === "lesson" ? t("path.read") : s === "practise" ? t("path.practise") : s === "prove" ? t("path.prove") : transferable === false ? t("next.title.stretch") : t("path.transfer")}{done && " ✓"}</>;
          // THE TWO STAGES THAT ARE PAGES, AS BUTTONS. Read and Practise are
          // what this screen can SHOW, so they are the two a learner can press;
          // Prove and Transfer are what the session is doing, so they are the two
          // that report. `aria-pressed` is what says which one is on screen —
          // the `.on` class is the same fact for a sighted learner.
          const tab = s === "lesson" ? "read" as const : s === "practise" ? "practise" as const : null;
          if (!tab) {
            return (
              <span key={s} className={`chip ${stageActive[s] ? "on" : ""} ${done ? "ok" : ""}`}>
                {label}
              </span>
            );
          }
          return (
            <button
              key={s}
              type="button"
              className={`chip ${showing === tab ? "on" : ""} ${done ? "ok" : ""}`}
              aria-pressed={showing === tab}
              onClick={() => setView(tab)}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* ── STAGE ONE: READ ─────────────────────────────────────────────────
          What OpenMind knows here, the lesson, the teach-back, the traps, the
          evidence and the community packs. Nothing on this stage is the
          session, so nothing here competes with a question. */}
      {showing === "read" && (
        <>
      {/* STATUS FIRST (§concept page): what OpenMind actually knows here,
          before the lesson text. Four dimensions and an honest dash, from the
          ledger — so a learner who has never been measured on transfer is told
          that, rather than shown an empty meter that reads as a failure. */}
      <section className="card" style={{ marginBottom: 18 }} aria-label={t("ev.eyebrow")}>
        <p className="eyebrow" style={{ margin: 0 }}>
          <span className="no">◍</span> {t("ev.eyebrow")} · {ctitle(lang, conceptId)}
        </p>
        {knowledge === null ? (
          <p className="small muted" style={{ margin: "6px 0 0" }}>{t("common.loading")}</p>
        ) : (
          <div style={{ marginTop: 6 }}>
            <Dims rows={knowledge} />
          </div>
        )}
      </section>

      {/* WHAT THIS BUILDS ON, WITH THE REASON EACH ONE MATTERS.

          This was one muted line of links — "Prerequisites: Fractions · Place
          value" — which tells a learner nothing they can act on. A prerequisite
          is a claim about what this idea needs, so each one now carries its own
          one-line explanation and its own link: if a learner is lost here, this
          section is where they find out which earlier idea to go and fix, in the
          same words the earlier lesson opens with. */}
      {prereqs.length > 0 && (
        <section className="card soft" style={{ marginBottom: 18 }} aria-label={t("learn.buildsOn")}>
          <p className="eyebrow" style={{ margin: 0 }}>{t("learn.buildsOn")}</p>
          <ul className="lesson-list">
            {prereqs.map((p) => (
              <li key={p}>
                <Link href={`/learn/${subject}/${p}`}>{ctitle(lang, p)}</Link>
                <span className="small muted"> — {cblurb(lang, p)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* THE LESSON, THEN A WORKED EXAMPLE — "I do" before "you do".

          It used to be one paragraph of prose and then straight to the session,
          so the first item a learner met was also the first one they had to do
          unaided, and the reading stage asked them to EXPLAIN the idea before
          they had answered anything about it (the teach-back box used to live
          here; it is below the session result now). The order this page follows
          is the one a classroom uses: the idea in words, one item worked in
          full, the misconceptions to watch for, then practice. */}
      {/* WHAT THE LESSON IS FOR, BEFORE THE LESSON.

          A learner opening a concept is asking "what will I be able to do?", and
          a topic name does not answer it. The objective is action-first and comes
          from the authored plan (lib/lesson-plans.ts), so it is written for this
          concept rather than generated from its title. */}
      {plan && (
        <section className="card plan-objective" style={{ marginBottom: 18 }} aria-label={t("plan.can")}>
          <p className="eyebrow" style={{ margin: 0 }}>{t("plan.can")}</p>
          <p className="reading lesson-lead" style={{ marginBottom: 0 }}>{plan.objective}</p>
        </section>
      )}

      {/* START HERE — THE INTUITION BEFORE THE TERMINOLOGY.

          A definition landing on a learner who has no picture for it is a
          sentence to memorise. The plan's intuition is a concrete situation the
          idea already lives in (a lift in an underground car park; three bags and
          five weights on a balance), so the formal paragraph after it has
          something to attach to. */}
      {plan && (
        <section className="card" style={{ marginBottom: 18 }} aria-label={t("plan.start")}>
          <p className="eyebrow" style={{ margin: 0 }}>{t("plan.start")}</p>
          <p className="reading lesson-text" style={{ marginTop: 10 }}>{plan.intuition}</p>
        </section>
      )}

      {/* THE IDEA, WITH ITS FIRST SENTENCE AS THE CLAIM.

          Every authored lesson opens with the sentence that states the whole
          thing ("Linear search checks each item — works on anything, slow on big
          data."); the sentences after it are the working. Rendered as one block
          they read as a wall, and the wall is why a lesson gets skimmed. The
          first sentence is set as a lead and the rest as the explanation, which
          is structure from the text we have rather than a heading invented over
          it.

          WITH A PLAN, EACH IDEA IS ITS OWN PARAGRAPH. That is the difference
          between teaching an idea and mentioning it: 3–6 paragraphs, in the order
          the idea has to land, instead of two-to-four sentences doing all of it at
          once. Concepts without a plan keep the split-prose rendering below, so
          nothing regressed into an empty card. */}
      <div className="card" style={{ marginBottom: 18 }}>
        <p className="eyebrow">{t("learn.idea")}</p>
        {plan ? (
          <>
            <p className="reading lesson-lead">{plan.idea[0]}</p>
            {plan.idea.slice(1).map((para, i) => (
              <p key={i} className="reading lesson-text">{para}</p>
            ))}
          </>
        ) : (
          (() => {
            const cut = c.lesson.indexOf(". ");
            const head = cut > 0 ? c.lesson.slice(0, cut + 1) : c.lesson;
            const rest = cut > 0 ? c.lesson.slice(cut + 2) : "";
            return (
              <>
                <p className="reading lesson-lead">{head}</p>
                {rest && <p className="reading lesson-text">{rest}</p>}
              </>
            );
          })()
        )}
        <p style={{ margin: "10px 0 0" }}>
          <SpeakButton text={plan ? [plan.intuition, ...plan.idea].join(" ") : c.lesson} />
        </p>
        {(() => {
          const culture = state?.profile.examples ?? "neutral";
          const ex = exampleFor(conceptId, culture);
          if (!ex || culture === "neutral") return null;
          return <p className="small muted" style={{ marginTop: 8 }}> {t("learn.think")}: {t(ex)}.</p>;
        })()}
      </div>

      <LessonWorkedExample conceptId={conceptId} />

      {/* "WE DO" — THE SAME ITEM, FADED.

          A worked example teaches a method by showing it whole; the next step is
          one the learner starts and does not finish, which is where the method
          actually transfers. Only plans carry this stage, because it is the plan
          that says the concept is ready for it. */}
      {plan && <LessonWorkedExample conceptId={conceptId} mode="guided" />}

      <ListenFirst lesson={plan ? [plan.intuition, ...plan.idea].join(" ") : c.lesson} />

      {/* WHERE THIS GOES WRONG — the authored traps, then the named
          misconceptions.

          The named misconception says WHAT the learner does ("bigger denominator
          = bigger slice"); the authored trap adds WHY it fails, because a rule a
          learner cannot see through is one they have to memorise. Both are kept:
          the names are what the evidence panel and the teacher's view refer to,
          and they are translated into every language the product ships. */}
      {plan && plan.traps.length > 0 && (
        <section className="card soft" style={{ marginBottom: 18 }} aria-label={t("plan.traps")}>
          <p className="eyebrow" style={{ margin: 0 }}><span className="no">!</span> {t("plan.traps")}</p>
          {plan.traps.map((trap, i) => (
            <div key={i} style={{ margin: "10px 0 0" }}>
              <p style={{ margin: 0 }}><strong>{trap.move}</strong></p>
              <p className="small muted" style={{ margin: "2px 0 0" }}>{trap.why}</p>
            </div>
          ))}
        </section>
      )}

      {c.misconceptions && c.misconceptions.length > 0 && (
        <div className="card soft" style={{ marginBottom: 18 }}>
          <p className="eyebrow"><span className="no">!</span> {t("res.misconceptions")}</p>
          {c.misconceptions.map((mid) => {
            const m = MISCONCEPTIONS_BY_ID[mid];
            if (!m) return null;
            return (
              <div key={mid} style={{ margin: "8px 0" }}>
                <strong>{mcName(lang, mid, m.name)}</strong>
                <p className="small muted" style={{ margin: "2px 0 0" }}>{mcCoaching(lang, mid, m.coaching)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* THE ONE THING THIS STAGE ASKS FOR. Everything above is reading, and a
          reading stage that ends without a door to the practice is how a learner
          reads the lesson, feels informed, and leaves. It is also the "we do"
          hand-off: the worked example has just shown one, this starts one they
          answer with the hint ladder beside it. */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: plan ? 8 : 20 }}>
        <button className="btn" onClick={() => setView("practise")}>
          {t("worked.next")} →
        </button>
      </div>

      {/* WHERE IT IS USED NEXT, AND WHO WROTE THIS.

          Two facts a learner is entitled to. The first stops a concept being an
          island — "this is the thing gradients were built on" is why the effort
          is worth it. The second is the honesty rule from the content strategy:
          a lesson written by the team and never read by a subject teacher says
          so ON THE SCREEN, not only in a document, because the screen is where a
          learner decides how much to trust it. */}
      {plan && (
        <p className="small muted" style={{ margin: "0 0 20px" }}>
          {plan.usedFor}{" "}
          <span className="tag">{t(plan.review === "subject-reviewed" ? "plan.reviewed" : "plan.unreviewed")}</span>
        </p>
      )}

      {evidence && (
        <section className="card soft" style={{ marginBottom: 18 }} aria-label={t("ev.eyebrow")}>
          <p className="eyebrow" style={{ margin: 0 }}>
            {t("ev.eyebrow")} · {ctitle(lang, conceptId)}
          </p>
          {evidence.attempts === 0 ? (
            <p className="small muted" style={{ margin: "6px 0 0" }}>{t("ev.none")}</p>
          ) : (
            <div className="small" style={{ marginTop: 6 }}>
              <p style={{ margin: "2px 0" }}>
                {t("sess.mastery")}: <strong className="mono">{Math.round(evidence.mastery * 100)}%</strong>{" "}
                <span className="muted">({t(`mm.${evidence.status === "untouched" || evidence.status === "new" ? "new" : evidence.status}`)})</span>
              </p>
              <p style={{ margin: "2px 0" }}>
                {t("ev.independent")}:{" "}
                <span className="mono">
                  {evidence.independentAsked > 0
                    ? `${Math.round((evidence.independentCorrect / evidence.independentAsked) * 100)}%`
                    : "—"}
                </span>
                {evidence.independentAsked === 0 && <span className="muted"> ({t("ev.notProven")})</span>}
              </p>
              <p style={{ margin: "2px 0" }}>
                {/* How the work was done, from the fold-owned count: `hintsUsed`
                    read the per-level tally the ledger does not carry, so this
                    line showed a learner who took help on every answer that
                    they had used none. */}
                {t("ev.answers")}: <span className="mono">{evidence.attempts}</span> · {t("ev.helped")}:{" "}
                <span className="mono">{evidence.hintedAnswers}</span>
                {evidence.lastSeen > 0 && (
                  <>
                    {" · "}{t("ev.lastSeen")}: {new Date(evidence.lastSeen).toLocaleDateString(localeFor(lang), { day: "numeric", month: "short", year: "numeric" })}
                  </>
                )}
              </p>
              {evidence.topMisconception && MISCONCEPTIONS_BY_ID[evidence.topMisconception] && (
                <p style={{ margin: "8px 0 0" }}>
                  <span className="tag">{t("ev.issue")}</span>{" "}
                  <strong>{mcName(lang, evidence.topMisconception, MISCONCEPTIONS_BY_ID[evidence.topMisconception].name)}</strong>{" — "}
                  {mcCoaching(lang, evidence.topMisconception, MISCONCEPTIONS_BY_ID[evidence.topMisconception].coaching)}
                  {evidence.misconceptionHits >= 2 && (
                    <>
                      {" "}
                      <Link href="/mistakes" className="small">
                        {evidence.misconceptionHits}× → {t("err.eyebrow")}
                      </Link>
                    </>
                  )}
                </p>
              )}
            </div>
          )}
        </section>
      )}
        </>
      )}

      {/* ── STAGE TWO: PRACTISE ─────────────────────────────────────────────
          The session, and only the session: the exercise header, the question
          and the tutor beside it. This is the screen the learner is meant to
          work on, so it gets the whole page rather than the bottom of one. */}
      {showing === "practise" && (
        <>
      {/* THE EXERCISE HEADER. Sticky, so the learner never loses which idea
          they are working on, which question of the set it is, or how long
          they have been at it — the three facts a paper sheet gives you for
          free and a web page usually does not. */}
      {!result && (
        <div className="qbar">
          <b>{ctitle(lang, c.id)}</b>
          <span className="where">{t(`subj.${c.subject}`)}</span>
          <span className="where">{fill(t("sess.qOf"), { n: qOrdinal, m: target })}</span>
          {stage_ === "transfer" && (
            <span className="where">{t(reframed === false ? "learn.deepenStage" : "learn.transferStage")}</span>
          )}
          <span className="clock" aria-label={t("sess.eyebrow")}>
            ⏱ {Math.floor(clock / 60000)}:{String(Math.floor(clock / 1000) % 60).padStart(2, "0")}
          </span>
        </div>
      )}

      {/* THE WORK AREA: the question, with the tutor beside it. */}
      <div className="work">
        <div className="work-main">
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          {/* The eyebrow names the session and NOTHING ELSE. It used to append
              "· Question 1 of 5" directly beneath the sticky bar's own
              "Question 1 of 5" — the same fact twice, one line apart, beside a
              third "of 5" on the level chip. The bar owns the position and stays
              on screen while the learner scrolls, so repeating it here was noise
              rather than reinforcement. */}
          <p className="eyebrow" style={{ margin: 0 }}>
            <span className="no">Q</span> {t("sess.eyebrow")}
          </p>
          {progress && (
            <span className="mono small">
              {Math.round(progress.mastery * 100)}% · {progress.attempts} ✕ · {streak > 0 ? `✓×${streak}` : "—"}
            </span>
          )}
        </div>
        {!result && <p className="small muted" style={{ margin: "4px 0 0" }}>{t("sess.lead")}</p>}

        {err && <div className="feedback no" style={{ marginTop: 14 }}>{err}</div>}
        {sessErr && (
          <div className="feedback no" style={{ marginTop: 14 }}>
            {sessErr}{" "}
            <button className="btn ghost small" onClick={() => void start()}>{t("sess.eyebrow")}</button>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 14 }}>
            <SessionResultPanel result={result} next={nextAction} />
            {/* TELL IT BACK — AFTER THE PRACTICE, WHICH IS WHERE AN EXPLANATION
                BELONGS. In the reading stage it asked a learner to explain an
                idea they had not yet used, so the box could only be filled by
                re-wording the paragraph above it. Once they have answered
                questions about it, an explanation is a real check on their own
                understanding — and it is not marked: see
                components/peer-teach.tsx and lib/peer-review.ts. */}
            <PeerTeach lesson={c.lesson} conceptTitle={ctitle(lang, c.id)} />
          </div>
        )}

        {!result && q && (
          <>
            {/* Why THIS question: the serve's own reason, the level of the item
                a learner is actually looking at, and — when the last answers
                slipped — the fact that support is right there. Showing the
                reason is the difference between "adaptive" and an unexplained
                difficulty swing. */}
            {why && !graded && (
              <p className="whyq">
                <span className="why-label">{t("target.why")}</span>
                <span>{t(`target.${why.reason}`)}</span>
                {/* AND WHETHER THIS ONE TESTS THE SLIP.
                    `repair` says the rung was lowered; it does not say the item
                    checks the belief, and the serve only sometimes finds one that
                    does. So the second sentence is printed only when the SERVE
                    reports `slipCheck` — the page never infers it from the reason,
                    because "this is built to catch your slip" is a claim about the
                    item and the learner is entitled to it being true. */}
                {why.reason === "repair" && why.slipCheck && <span>{t("target.slipCheck")}</span>}
                <span className="band">{fill(t("target.level"), { n: why.band })}</span>
                {why.scaffold && <span className="scaffold">{t("target.scaffold")}</span>}
              </p>
            )}
            <div className="qprompt">
              <PromptText text={q.prompt} figure={q.figure} />
              <SpeakButton text={q.prompt} />
            </div>
            {/* WHAT THIS QUESTION IS TESTING, said BEFORE it is answered.

                Every field in this line existed already and reached the learner
                only later: the demand level surfaced after the sitting, in the
                diagnostic report; the marks nowhere at all. The rule that
                composes them is lib/question-bank#declareQuestion, so this page
                and the published static page declare one item the same way.

                THE BELIEFS IT DISCRIMINATES ARE NOT NAMED HERE. Reading "sign
                slip" before answering is a hint, and a question that warns you
                about its own trap measures nothing — they appear with the
                verdict, where they can teach instead of pre-empt. */}
            <QuestionDeclaration q={q} t={t} />
            {/* ── WHERE THE WORKING GOES ────────────────────────────────────
                The question asks for an answer; this is the paper it is worked
                out on. It is deliberately placed BEFORE the options and before
                the answer box, because that is the order the work happens in,
                and it survives a wrong answer so a retry is the same sheet
                rather than a blank one. Nothing reads it (the sheet says so
                itself) — see components/work-sheet.tsx for why that is a rule
                rather than a gap. */}
            <WorkSheet
              questionId={q.id}
              label={t("work.label")}
              placeholder={t("work.ph")}
              note={t("work.note")}
            />
            {/* ── HOW THIS QUESTION IS ANSWERED ────────────────────────────
                A numeric item asks the learner to PRODUCE the answer, so it
                gets a box; everything else keeps the four options. The switch
                is on the question's own declared kind, so no surface has to
                guess and a numeric item can never be answered by recognition
                just because that is what the page used to draw. */}
            {q.responseKind === "numeric" ? (
              <NumericAnswer
                unit={q.tolerance?.unit}
                disabled={!!graded || saved || busy[0]}
                label={t("answer.label")}
                checkLabel={t("learn.check")}
                emptyHint={t("answer.needNumber")}
                onSubmit={(raw) => void submit({ numericAnswer: raw })}
              />
            ) : (
              <div className="choices">
                {q.choices.map((choice, i) => {
                  const cls =
                    graded
                      ? i === graded.answerIndex ? "ok" : i === picked ? "bad" : ""
                      : picked === i ? "sel" : "";
                  return (
                    <button
                      key={i}
                      className={`choice ${cls}`}
                      disabled={!!graded || saved || busy[0]}
                      onClick={() => answer(i)}
                    >
                      <span className="mark" data-idx={String.fromCharCode(65 + i)} />
                      <span className="choice-text"><MathText text={choice} /></span>
                    </button>
                  );
                })}
              </div>
            )}
            {saved && (
              // Honest, and in the learner's language: the answer is safe, the
              // marking has not happened, and the bar above says how many are
              // waiting. No verdict is invented for it.
              <p className="small muted" style={{ marginTop: 12 }}>{t("offline.answerSaved")}</p>
            )}
            {q && !graded && !saved && (
              <div style={{ marginTop: 14 }}>
                {!stuck ? (
                  <button className="btn ghost small" onClick={() => setStuck(true)}>
                    <Icon name="stuck" />
                    {t("hint.stuck")}
                  </button>
                ) : (
                  <div className="card soft" style={{ padding: 14, marginBottom: 0 }}>
                    <p className="small" style={{ margin: "0 0 10px", fontWeight: 600 }}>{t("hint.howMuch")}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {HINT_LEVELS.map((h) => (
                        <button
                          key={h.level}
                          className={`btn ghost small ${hintLevel >= h.level ? "sel" : ""}`}
                          disabled={hintBusy}
                          title={t(h.descKey)}
                          onClick={() => void askHint(h.level)}
                        >
                          {/* How much help this level is, as a filled meter of
                              four. Drawn rather than typed: the emoji dots this
                              replaces were set by the device's own emoji font,
                              so the row of controls disagreed about size, and
                              the ramp ended in the marking red — which marks a
                              wrong answer, not a learner asking for help. */}
                          <span className="hint-dot" aria-hidden="true">
                            {[1, 2, 3, 4].map((n) => <i key={n} className={n <= h.level ? "on" : ""} />)}
                          </span>
                          {t(h.labelKey)}
                        </button>
                      ))}
                    </div>
                    {hint && (
                      <div className="note" style={{ marginTop: 10 }}>
                        <strong>{t("learn.hint")} · {hintLevel}</strong>
                        <span><MathText text={hint} /></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {graded && (
              // The verdict is the thing a learner waits for and a screen reader
              // has nothing to read: without a live region the marking happens
              // in silence and the page "does nothing". Announced politely, so
              // the explanation is not cut off mid-sentence by the next one.
              <div className={`feedback ${graded.correct ? "ok" : "no"}`} role="status" aria-live="polite">
                <span className="verdict">{graded.correct ? `✓ ${t("learn.correct")}` : `✗ ${t("learn.wrong")}`}</span>
                {/* On a wrong answer the likely mistake comes FIRST and in one
                    line — that is the sentence that teaches. The worked
                    explanation is offered underneath it rather than dumped on
                    top of it, because three paragraphs of algebra arriving the
                    instant an answer is marked is how feedback stops being
                    read at all. */}
                {graded.misconceptionId && MISCONCEPTIONS_BY_ID[graded.misconceptionId] && (() => {
                  // A TARGETED REPAIR WHEN ONE EXISTS, and the old one-liner when
                  // it does not. The fallback used to be the ONLY behaviour: the
                  // name of the belief, then the first sentence of its coaching
                  // paragraph — the same sentence for every learner who made any
                  // mistake on this concept. `repairFor` answers null outside the
                  // authored set, so nothing renders as an empty card.
                  const repair = repairFor(conceptId, graded.misconceptionId);
                  if (repair) {
                    return (
                      <div style={{ margin: "0 0 10px" }}>
                        <p style={{ margin: "0 0 8px" }}>
                          <b className="tag">
                            {mcName(lang, graded.misconceptionId!, MISCONCEPTIONS_BY_ID[graded.misconceptionId!]?.name ?? graded.misconceptionId)}
                          </b>
                        </p>
                        <RepairCard plan={repair} />
                      </div>
                    );
                  }
                  return (
                    <p style={{ margin: "0 0 8px" }}>
                      <b className="tag">{mcName(lang, graded.misconceptionId!, MISCONCEPTIONS_BY_ID[graded.misconceptionId!]?.name ?? graded.misconceptionId)}</b>
                      {" — "}{MISCONCEPTIONS_BY_ID[graded.misconceptionId!].coaching.split(".")[0]}.
                    </p>
                  );
                })()}
                {graded.correct || showWhy ? (
                  <>
                    <span className="why-title">{t("learn.explain")}</span>
                    <MathText text={graded.explanation} />
                  </>
                ) : (
                  <button type="button" className="linkish" onClick={() => setShowWhy(true)}>
                    {t("learn.explain")} →
                  </button>
                )}
                {/* WHAT THE ANSWER PROVED, not just that it was right: the
                    verdict in its short name (the same word the evidence
                    tables and the teacher's monitor use) plus the sentence
                    that explains it. The difference between "correct" and
                    "independently correct" is the whole basis of the learner
                    model, and until recently only the model knew it. */}
                {(() => {
                  // The ONE verdict rule (lib/proof.ts#verdictForGrade): this
                  // page decides nothing about what an answer proved — it
                  // renders the word the shared rule gives the facts the SERVER
                  // attributed, exactly as /try and /solve now do.
                  const v = verdictForGrade(graded.evidence, graded.correct);
                  return v ? (
                    <p className="proof-line">
                      <span className="proof-k">{t("ev.eyebrow")}</span>
                      <span className={`chip ${v === "independent" || v === "transfer" || v === "retained" ? "good" : ""}`}>{t(proofLabelKey(v))}</span>
                      <span className="small">{t(proofSentenceKey(v))}</span>
                    </p>
                  ) : null;
                })()}
                {/* WHAT THE ITEM WAS CHECKING FOR is not listed here, and that is
                    a design fact rather than an omission: a served question
                    withholds its tags with the rest of the answer key
                    (QuestionView), so the beliefs an item discriminates reach
                    the learner as the DIAGNOSIS above — named for the mistake
                    actually made, which teaches, rather than as a list of traps
                    to watch for, which is a hint. The full tag list is in the
                    declaration for the surfaces that hold the key. */}
              </div>
            )}
            {graded?.flare && <MicroDiagnostic flare={graded.flare} lang={lang} />}
            {/* The session's one primary action, and it always has a next step:
                another question, the prove-it, or the result screen. */}
            {graded && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {stage_ === "transfer" ? (
                  <button className="btn" onClick={() => void finish()} disabled={busy[0]}>
                    {t("sess.finish")} →
                  </button>
                ) : count >= target ? (
                  <>
                    <button className="btn" onClick={() => void loadTransfer()} disabled={busy[0]}>
                      {t(transferable === false ? "sess.deepProve" : "sess.prove")} →
                    </button>
                    <button className="btn ghost" onClick={() => void finish()} disabled={busy[0]}>
                      {t("sess.finish")}
                    </button>
                  </>
                ) : (
                  // On a wrong answer the SAME action is offered under its
                  // honest name: a fresh question on this idea. "Next" after a
                  // mistake reads as "move on", which is the opposite of what
                  // the engine does next.
                  <button className="btn" onClick={load} disabled={busy[0]}>
                    {graded.correct ? t("learn.next") : t("common.retry")} →
                  </button>
                )}
              </div>
            )}
          </>
        )}
        {!result && !q && !err && <p className="muted small">{t("common.loading")}</p>}
      </div>
        </div>

        {/* The tutor, beside the question and never instead of it. */}
        <TutorPanel
          conceptId={conceptId}
          questionText={q?.prompt}                  questionNumber={fill(t("sess.qOf"), { n: qOrdinal, m: target })}
          open={tutorOpen}
          onToggle={() => setTutorOpen((v) => !v)}
        />
      </div>
        </>
      )}

      {showing === "read" && (
      <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginTop: 8, marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          {/* WHAT THIS SECTION IS, IN ONE SENTENCE. It was called "Study
              packs" with a button reading "Add a pack" and a "Fork" action
              under each note — the same word the product already uses for a
              teacher's PRINTABLE weekly pack, and two pieces of developer
              vocabulary describing a shared note board. A learner had no way to
              know what they were looking at, which is exactly how it read. */}
          <p className="eyebrow" style={{ margin: 0 }}><span className="no">✎</span> {t("pack.title")}</p>
          <p className="small muted" style={{ margin: "4px 0 0" }}>{t("pack.lead")}</p>
          <button className="btn ghost small" onClick={() => setComposing((v) => !v)}>{t("pack.add")}</button>
        </div>

        {composing && (
          <div style={{ margin: "12px 0" }}>
            <input
              type="text"
              value={packTitle}
              onChange={(e) => setPackTitle(e.target.value)}
              placeholder={t("pack.phTitle")}
              aria-label={t("pack.phTitle")}
              style={{ marginBottom: 8 }}
            />
            <textarea
              value={packBody}
              onChange={(e) => setPackBody(e.target.value)}
              placeholder={t("pack.phBody")}
              aria-label={t("pack.phBody")}
              rows={3}
              style={{ width: "100%", marginBottom: 8 }}
            />
            <button
              className="btn small"
              disabled={packBusy || !packTitle.trim() || !packBody.trim()}
              onClick={() => void submitPack()}
            >
              {t("pack.add")}
            </button>
          </div>
        )}

        {packs.length === 0 && !composing && <p className="small muted">{t("pack.none")}</p>}
        {packs.map((pk) => (
          <div key={pk.id} className="note" style={{ marginTop: 10 }}>
            <strong>
              {pk.title}
              <span className="small muted" style={{ marginLeft: 8, fontWeight: 400 }}>
                {pk.author} · {pk.language}
                {pk.forkOf && ` · ${t("pack.forkOf")} ${packs.find((x) => x.id === pk.forkOf)?.title ?? pk.forkOf.slice(0, 12)}`}
              </span>
            </strong>
            <span className="small" style={{ whiteSpace: "pre-wrap" }}>{pk.body}</span>
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button className="btn ghost small" disabled={packBusy} onClick={() => void postPack({ action: "helpful", packId: pk.id })}>
                ▲ {t("pack.helpful")} · {pk.helpful}
              </button>
              <button className="btn ghost small" disabled={packBusy} onClick={() => void postPack({ action: "fork", packId: pk.id })}>
                ⑂ {t("pack.fork")}
              </button>
            </div>
          </div>
        ))}
      </section>
      )}

      <div className="actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <Link href={`/learn/${subject}`} className="btn ghost small">← {t(SUBJECT_LABELS[subject])}</Link>
        {/* ONE DOOR TO THE TUTOR. This linked to the old standalone tutor PAGE
            while the panel sat beside the question on this very screen — two
            affordances for one thing, and the button navigated a learner AWAY
            from the question to ask about it. The panel is the tutor now (§tutor)
            and the page it pointed at is reachable only by URL; this is the
            duplicate the reviewer saw at the bottom of the page. */}
      </div>
    </main>
  );
}

/** WHAT THIS QUESTION IS TESTING — the demand it asks for, and what it is worth.
 *
 *  The record itself is lib/question-bank#declareQuestion's; this only words it,
 *  so the React question screen and the published static one declare one item
 *  the same way. The beliefs the item discriminates are deliberately NOT part of
 *  this line: naming them before the answer is a hint, and they are rendered
 *  with the verdict instead (see the feedback block above).
 */
function QuestionDeclaration({ q, t }: { q: Parameters<typeof declareQuestion>[0]; t: (key: string) => string }) {
  const declared = declareQuestion(q);
  return (
    <p className="small muted" style={{ margin: "6px 0 0" }}>
      <span className="why-label">{t("ask.whatTesting")}</span>{" "}
      {t(`skill.${declared.skill}`)}
      {" · "}
      {t("own.marks")}: {declared.marks}
    </p>
  );
}
