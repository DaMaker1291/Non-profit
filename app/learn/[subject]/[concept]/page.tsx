"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret, fetchProfile, withCapability } from "@/lib/client";
import { ctitle, cblurb, mcName, mcCoaching } from "@/lib/content-i18n";
import { dueLabel, fill } from "@/lib/i18n";
import { isNextKind, type NextAction, type NextKind } from "@/lib/next-engine";
import { decideOne, decisionContextFrom } from "@/lib/decision";
import { loadLedger, type LedgerFetch } from "@/lib/evidence-view";
import { newSubmissionId, postAnswer } from "@/lib/sync-queue";
import { SESSION_TARGET, type SessionResult } from "@/lib/session";
import { evidenceFor } from "@/lib/learner-model";
import SessionResultPanel from "@/components/session-result";
import { getConcept, ancestorsOf } from "@/lib/genome";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { HINT_LEVELS } from "@/lib/hints";
import MicroDiagnostic from "@/components/micro-diagnostic";
import SpeakButton from "@/components/speak-button";
import ListenFirst from "@/components/listen-first";
import PeerTeach from "@/components/peer-teach";
import { exampleFor } from "@/lib/culture";
import type { FlarePayload } from "@/lib/microdiag";
import { subjectFromParam } from "@/lib/subjects";
import type { Question, StudyPack } from "@/lib/types";

type Graded = { correct: boolean; explanation: string; misconceptionId?: string | null; answerIndex: number | null; flare?: FlarePayload | null };

/** What the SERVE decided about difficulty, in the server's own words: which
 *  rule fired, the band the item actually falls in, and whether the learner
 *  needs support. The client renders it — it never computes it, because a
 *  browser that could compute its own reason could also invent one. */
type ServeTarget = { reason: "fresh" | "steady" | "stretch" | "repair"; band: number; scaffold: boolean };

export default function ConceptPage() {
  const params = useParams<{ subject: string; concept: string }>();
  const subject = subjectFromParam(params?.subject);
  const conceptId = params?.concept ?? "";
  const c = getConcept(conceptId);
  const { t, lang } = useI18n();
  const { state, set: setState } = useProfile();
  const [q, setQ] = useState<Question | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);
  /** This answer is held on the device and will be marked on reconnect (§4
   *  offline). A third outcome beside right and wrong: the answer exists, the
   *  marking does not yet. */
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [why, setWhy] = useState<ServeTarget | null>(null);
  const [stage_, setStage_] = useState<"lesson" | "practise" | "transfer">("lesson");
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

  const prereqs = c ? c.prereqs : [];
  const id = loadLocalProfileId();

  useEffect(() => {
    const pid = loadLocalProfileId();
    if (!pid || !conceptId) return;
    let alive = true;
    fetch(withCapability(`/api/assignments?me=${encodeURIComponent(pid)}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http ${r.status}`))))
      .then((j) => {
        const w = (j.assigned ?? []).find(
          (x: { assignment: { conceptIds: string[] }; mine: { outstanding: string[] } }) =>
            x.assignment.conceptIds.includes(conceptId),
        );
        if (alive && w) setAssignedDue(w.assignment.dueAt as number);
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
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "serve", id, conceptId, lang, secret: withSecret() }),
    });
    if (!res.ok) { setErr(`HTTP ${res.status}`); return; }
    const body = await res.json();
    setQ(body.question ?? null);
    setWhy((body.target as ServeTarget | null) ?? null);
    // When the serve says this learner needs support, the ladder is OPEN rather
    // than merely available: a student who is struggling should not have to
    // guess that help exists. Nothing is recorded by opening it — hint credit
    // is only counted when a hint is actually asked for.
    setStuck(Boolean((body.target as ServeTarget | null)?.scaffold));
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
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", id, conceptId, kind: intent, secret: withSecret() }),
      });
      if (!res.ok) { setSessErr(t("sess.err")); return; }
      const body = await res.json();
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
    loadLedger(id, withSecret()).then((l) => { if (alive) setLedger(l); });
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
      const res = await fetch(`/api/packs?conceptId=${encodeURIComponent(conceptId)}`);
      if (!res.ok) return;
      const j = await res.json();
      setPacks(j.packs ?? []);
    } catch {
      /* packs are a bonus layer; the lesson works without them */
    }
  }, [conceptId]);

  useEffect(() => { void loadPacks(); }, [loadPacks]);

  async function postPack(payload: Record<string, unknown>) {
    if (!id) return;
    setPackBusy(true);
    try {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (res.ok) await loadPacks();
    } finally {
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
        <Link href={`/learn/${subject}`} className="btn ghost">← {t("subj.title")}</Link>
      </main>
    );
  }

  async function answer(i: number) {
    if (graded || saved || !q || busy[0] || !id) return;
    busy[1](true);
    setPicked(i);
    try {
      // Every answer names its own SUBMISSION, and is delivered through the
      // queue's poster so a connection that drops mid-answer holds the work
      // instead of losing it. Online this is also what makes a lost response
      // safe: the server derives the ledger event's id from the submission, so
      // a replay is the same event rather than a second answer.
      const outcome = await postAnswer("/api/progress", {
        submissionId: newSubmissionId(),
        deviceAt: Date.now(),
        body: {
          action: "answer", id, conceptId, questionId: q.id, choiceIndex: i,
          ms: servedAt ? Date.now() - servedAt : undefined,
          lang, secret: withSecret(),
        },
      });
      if (outcome.kind === "held") {
        // Not marked yet, and the learner is told exactly that. The question is
        // NOT consumed: nothing has been recorded, so nothing may be advanced.
        setSaved(true);
        return;
      }
      if (outcome.kind === "refused") {
        const refused = (await outcome.res.json().catch(() => ({}))) as { error?: string };
        setErr(refused.error ?? `HTTP ${outcome.status}`);
        return;
      }
      const res = outcome.res;
      const body = await res.json();
      if (!res.ok) { setErr(body.error ?? `HTTP ${res.status}`); return; }
      const correct = !!body.correct;
      const g: Graded = { correct, explanation: body.explanation ?? "", misconceptionId: body.misconceptionId, answerIndex: typeof body.answerIndex === "number" ? body.answerIndex : null, flare: body.flare ?? null };
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
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "finish", id, conceptId, secret: withSecret() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSessErr(t(body.error === "no_session" ? "sess.nothing" : "sess.err"));
        return;
      }
      setResult(body.result as SessionResult);
      setPhase("complete");
      // Pull the recomputed state so the page (and Home, via the shared profile)
      // shows the plan the session produced rather than the one it started with.
      // The session just wrote evidence, so the ledger is re-read rather than
      // reused: the recomputed plan has to be the one the new evidence produced.
      const [fresh, led] = await Promise.all([fetchProfile(id), loadLedger(id, withSecret())]);
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
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Transfer intent declared server-side: harder question staged, and
          // the grading is attributed as transfer by the server, not the client.
          body: JSON.stringify({ action: "serve", id, conceptId, intent: "transfer", lang, secret: withSecret() }),
        });
        if (!res.ok) return;
        const body = await res.json();
        const q = body.question;
        if (!q) return;
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
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "hint", id, conceptId, questionId: q.id, level, secret: withSecret() }),
      });
      const body = await res.json();
      if (res.ok && body.hint && (typeof body.hint === "string" || typeof body.hint.key === "string" || typeof body.hint.text === "string")) {
        setHint(typeof body.hint === "string" ? body.hint : [body.hint.text, body.hint.key ? t(body.hint.key) : ""].filter(Boolean).join(" "));
        setHintLevel(level);
      } else {
        setErr(body.error ?? `HTTP ${res.status}`);
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

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">{String(c.stage)}</span> {t(`subj.${c.subject}`)} · {ctitle(lang, c.id)}</p>
      <h1>{ctitle(lang, c.id)}</h1>
      <p className="lead">{cblurb(lang, c.id)}</p>
      {assignedDue !== null && (
        <p className="small" style={{ marginTop: -6, marginBottom: 14 }}>
          <span className="chip red">✎ {t("asg.setBy")}</span>{" "}
          <span className="muted">{fill(t("asg.due"), { date: dueLabel(lang, assignedDue) })}</span>
        </p>
      )}
      {state?.profile?.learningStyle && (
        <p className="small muted" style={{ marginTop: -10, marginBottom: 14 }}>
          🧠 {t("onb.learningStyle")}: <strong>{state.profile.learningStyle === "reading-writing" ? t("ls.reading") : t(`ls.${state.profile.learningStyle}`)}</strong>
          {state.profile.board && <> · {t("onb.board")}: {state.profile.board}</>}
          {state.profile.exam && <> · {t("learn.exam")}: {state.profile.exam}</>}
        </p>
      )}

      {/* Learning path: what you do next on this concept */}
      <nav aria-label={t("path.aria")} style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "14px 0 20px" }}>
        {["lesson", "practise", "prove", "transfer"].map((s, i) => {
          const active = stageActive[s];
          const done = stageDone[s];
          return (
            <span key={s} className={`chip ${active ? "on" : ""} ${done ? "ok" : ""}`}>
              {i + 1}. {s === "lesson" ? t("path.read") : s === "practise" ? t("path.practise") : s === "prove" ? t("path.prove") : t("path.transfer")}
              {done && " ✓"}
            </span>
          );
        })}
      </nav>

      {prereqs.length > 0 && (
        <p className="small muted" style={{ marginBottom: 14 }}>
          {t("common.prereqs")}:{" "}
          {prereqs.map((p, i) => (
            <span key={p}>
              {i > 0 && " · "}
              <Link href={`/learn/${subject}/${p}`}>{ctitle(lang, p)}</Link>
            </span>
          ))}
        </p>
      )}

      <div className="card" style={{ marginBottom: 18 }}>
        <p className="eyebrow"><span className="no">§</span> {t("learn.lesson")}</p>
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.7 }}>
          {c.lesson}
          <SpeakButton text={c.lesson} />
        </p>
        {(() => {
          const culture = state?.profile.examples ?? "neutral";
          const ex = exampleFor(conceptId, culture);
          if (!ex || culture === "neutral") return null;
          return <p className="small muted" style={{ marginTop: 8 }}>🌎 {t("learn.think")}: {t(ex)}.</p>;
        })()}
      </div>

      <ListenFirst lesson={c.lesson} />
      <PeerTeach lesson={c.lesson} conceptTitle={ctitle(lang, c.id)} conceptId={conceptId} />

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

      {evidence && (
        <section className="card soft" style={{ marginBottom: 18 }} aria-label={t("ev.eyebrow")}>
          <p className="eyebrow" style={{ margin: 0 }}>
            <span className="no">📊</span> {t("ev.eyebrow")} · {ctitle(lang, conceptId)}
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
                {t("ev.answers")}: <span className="mono">{evidence.attempts}</span> · {t("ev.hints")}:{" "}
                <span className="mono">{evidence.hintsUsed}</span>
                {evidence.lastSeen > 0 && (
                  <>
                    {" · "}{t("ev.lastSeen")}: {new Date(evidence.lastSeen).toLocaleDateString(lang)}
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

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <p className="eyebrow" style={{ margin: 0 }}>
            <span className="no">Q</span> {t("sess.eyebrow")}
            {!result && (
              <>{" · "}<span className="mono">{fill(t("sess.qOf"), { n: Math.min(count + 1, target), m: target })}</span></>
            )}
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
                <span className="band">{fill(t("target.level"), { n: why.band })}</span>
                {why.scaffold && <span className="scaffold">{t("target.scaffold")}</span>}
              </p>
            )}
            <p className="qprompt">
              {q.prompt}
              <SpeakButton text={q.prompt} />
            </p>
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
                    <span className="choice-text">{choice}</span>
                  </button>
                );
              })}
            </div>
            {saved && (
              // Honest, and in the learner's language: the answer is safe, the
              // marking has not happened, and the bar above says how many are
              // waiting. No verdict is invented for it.
              <p className="small muted" style={{ marginTop: 12 }}>{t("offline.answerSaved")}</p>
            )}
            {q && !graded && !saved && (
              <div style={{ marginTop: 14 }}>
                {!stuck ? (
                  <button className="btn ghost small" onClick={() => setStuck(true)}>{t("hint.stuck")}</button>
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
                          {h.level === 1 ? "🟢" : h.level === 2 ? "🟡" : h.level === 3 ? "🟠" : "🔴"} {t(h.labelKey)}
                        </button>
                      ))}
                    </div>
                    {hint && (
                      <div className="note" style={{ marginTop: 10 }}>
                        <strong>{t("learn.hint")} · {hintLevel}</strong>
                        <span>{hint}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {graded && (
              <div className={`feedback ${graded.correct ? "ok" : "no"}`}>
                <span className="verdict">{graded.correct ? `✓ ${t("learn.correct")}` : `✗ ${t("learn.wrong")}`}</span>
                {graded.explanation}
                {graded.misconceptionId && MISCONCEPTIONS_BY_ID[graded.misconceptionId] && (
                  <> <b className="tag">{mcName(lang, graded.misconceptionId, MISCONCEPTIONS_BY_ID[graded.misconceptionId]?.name ?? graded.misconceptionId)}:</b>{" "}
                    {MISCONCEPTIONS_BY_ID[graded.misconceptionId].coaching.split(".")[0]}.</>
                )}
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
                      {t("sess.prove")} →
                    </button>
                    <button className="btn ghost" onClick={() => void finish()} disabled={busy[0]}>
                      {t("sess.finish")}
                    </button>
                  </>
                ) : (
                  <button className="btn" onClick={load} disabled={busy[0]}>
                    {t("learn.next")} →
                  </button>
                )}
              </div>
            )}
          </>
        )}
        {!result && !q && !err && <p className="muted small">{t("common.loading")}</p>}
      </div>

      <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginTop: 8, marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
          <p className="eyebrow" style={{ margin: 0 }}><span className="no">✎</span> {t("pack.title")}</p>
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

      <div className="actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        <Link href={`/learn/${subject}`} className="btn ghost small">← {t("subj.title")}</Link>
        <Link href={`/tutor/${c.id}`} className="btn small">{t("learn.ask")} →</Link>
      </div>
    </main>
  );
}
