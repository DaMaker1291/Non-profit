"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE WEDGE. "Got a question you can't solve?" — no account, no course, no
// onboarding. Value inside two minutes: paste the question, get the idea
// behind it, prove you understand it, share it. The anonymous profile is
// created lazily *here*, so the quiet learner-model still starts recording
// from the very first interaction.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n, loadLocalProfileId, useLearnLangs, loadLocalProfileSecret, withCapability } from "@/lib/client";
import { ctitle, cblurb } from "@/lib/content-i18n";
import { getConcept } from "@/lib/genome";
import { anonServe, anonServeTransfer, anonAnswer } from "@/lib/anon-practice";
import type { AnonPracticeQ } from "@/lib/anon-practice";
import MicroDiagnostic from "@/components/micro-diagnostic";
import SpeakButton from "@/components/speak-button";
import VoiceInput from "@/components/voice-input";
import StarterMode from "@/components/starter-mode";
import type { FlarePayload } from "@/lib/microdiag";

type Stage = "ask" | "matched" | "proving" | "transfer" | "mastered";

export default function SolvePage() {
  const { t, lang } = useI18n();
  const { langs } = useLearnLangs();
  const teachLang = langs.teaching ?? lang;
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("ask");
  const [conceptId, setConceptId] = useState<string | null>(null);
  const [altIds, setAltIds] = useState<string[]>([]);
  const [unsure, setUnsure] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [q, setQ] = useState<AnonPracticeQ | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [flare, setFlare] = useState<FlarePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  /** This answer is held on the device and will be marked on reconnect. */
  const [saved, setSaved] = useState(false);
  const [nextId, setNextId] = useState<string | null>(null);
  const [servedAt, setServedAt] = useState(0);
  const [transferOk, setTransferOk] = useState<boolean | null>(null);

  // Screen 9 (§27): after mastery, ask the next-step engine what follows.
  // Hooks must run unconditionally — the effect no-ops outside the mastered
  // stage — so this lives at the top, before any early return.
  useEffect(() => {
    if (stage !== "mastered" || !conceptId || nextId) return;
    const id = loadLocalProfileId();
    if (!id) return;
    const subject = getConcept(conceptId)?.subject ?? "maths";
    let cancelled = false;
    (async () => {
      try {
        // "Based on today's work" must mean the student's real data: suggest
        // their weakest *reported* concept first. Unseen concepts default to
        // 0.2 mastery in the path engine, so the raw path would point a
        // student with history at stage-0 concepts they've long outgrown.
        const res = await fetch(`/api/progress?id=${encodeURIComponent(id)}&subject=${encodeURIComponent(subject)}&secret=${encodeURIComponent(loadLocalProfileSecret() ?? "")}`);
        if (res.ok) {
          const j = await res.json();
          const weak = (Object.entries(j?.progress ?? {}) as Array<[string, { mastery?: number }]>)
            .filter(([cid, p]) => cid !== conceptId && (p.mastery ?? 0) < 0.65 && getConcept(cid)?.subject === subject)
            .sort((a, b) => (a[1].mastery ?? 0) - (b[1].mastery ?? 0))[0];
          if (weak) { if (!cancelled) setNextId(weak[0]); return; }
        }
        // Fallback for a brand-new student: the path engine's foundations-first pick.
        const pr = await fetch(withCapability(`/api/path?subject=${encodeURIComponent(subject)}&id=${encodeURIComponent(id)}`));
        if (!pr.ok || cancelled) return;
        const j = await pr.json();
        const first = j?.path?.find((s: { conceptId: string }) => s.conceptId && s.conceptId !== conceptId);
        if (first) setNextId(first.conceptId);
      } catch { /* the suggestion is a bonus layer; never block the moment */ }
    })();
    return () => { cancelled = true; };
  }, [stage, conceptId, nextId]);

  async function match() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = await res.json();
      if (!res.ok) { setErr(j.error ?? `HTTP ${res.status}`); return; }
      if (j.match) {
        setConceptId(j.match.conceptId);
        setAltIds(j.alternatives ?? []);
        setUnsure(!j.match.confident);
      } else {
        setConceptId(null);
        setAltIds([]);
        setUnsure(true);
      }
      setStage("matched");
    } finally {
      setBusy(false);
    }
  }

  const c = conceptId ? getConcept(conceptId) : null;

  async function askTutor() {
    if (!conceptId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId, message: text.slice(0, 400), language: teachLang }),
      });
      const j = await res.json();
      if (res.ok) setHint(j.reply ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function prove() {
    if (!conceptId) return;
    setBusy(true);
    setErr("");
    try {
      const question = await anonServe(conceptId, teachLang);
      if (!question) { setErr(t("common.error")); return; }
      setQ(question);
      setServedAt(Date.now());
      setPicked(null);
      setAnswerIndex(null);
      setCorrect(null);
      setFlare(null);
      setTransferOk(null);
      setSaved(false);
      setStage("proving");
    } finally {
      setBusy(false);
    }
  }

  /** Transfer: a genuinely different challenge — the serve request declares
   *  transfer intent, the server stages a harder question and attributes the
   *  grading. The client cannot claim credit for an ordinary practice draw. */
  async function proveTransfer() {
    if (!conceptId) return;
    setBusy(true);
    setErr("");
    try {
      const question = await anonServeTransfer(conceptId, teachLang);
      if (!question) { setErr(t("common.error")); return; }
      setQ(question);
      setServedAt(Date.now());
      setPicked(null);
      setAnswerIndex(null);
      setCorrect(null);
      setFlare(null);
      setTransferOk(null);
      setSaved(false);
      setStage("transfer");
    } finally {
      setBusy(false);
    }
  }

  async function answer(i: number) {
    if (!q || picked !== null) return;
    setPicked(i);
    setBusy(true);
    try {
      // No mode, no hint count: attribution is the server's (staged transfer
      // intent + its own hint ledger).
      const o = await anonAnswer(q.conceptId, q.id, i, teachLang, {
        ms: servedAt ? Date.now() - servedAt : undefined,
      });
      // Three outcomes, and offline is one of them: the answer is held on this
      // device and marked on reconnect, so the learner is told that instead of
      // being shown a verdict nobody has decided yet.
      if (o.kind === "offline") { setSaved(true); return; }
      if (o.kind === "error") { setErr(t("common.error")); return; }
      setCorrect(o.grade.correct);
      setAnswerIndex(o.grade.answerIndex);
      setFlare(o.grade.flare);
      if (stage === "transfer") setTransferOk(o.grade.correct);
    } finally {
      setBusy(false);
    }
  }

  if (stage === "ask") {
    return (
      <main className="container narrow" style={{ paddingTop: 56 }}>
        <p className="eyebrow"><span className="no">?</span> {t("solve.eyebrow")}</p>
        <h1 className="visually-small">{t("solve.title")}</h1>
        <p className="lead">{t("solve.lead")}</p>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("solve.placeholder")}
          style={{ width: "100%", marginTop: 18 }}
        />
        <div className="actions" style={{ marginTop: 14 }}>
          <button className="btn" disabled={busy || !text.trim()} onClick={() => void match()}>
            {t("solve.match")} →
          </button>
          <VoiceInput onText={(v) => setText((prev) => (prev ? `${prev} ${v}` : v))} lang={lang} />
        </div>
        {err && <p className="small" style={{ color: "var(--bad, #b00)" }}>{err}</p>}
        <p className="small muted" style={{ marginTop: 26 }}>
          {t("solve.noAccount")}
        </p>
      </main>
    );
  }

  if (stage === "matched") {
    return (
      <main className="container narrow" style={{ paddingTop: 56 }}>
        {c && !unsure && (
          <>
            <p className="eyebrow"><span className="no">✓</span> {t("solve.found")}</p>
            <h1 className="visually-small">{ctitle(lang, c.id)}</h1>
            <p className="lead">{cblurb(lang, c.id)}</p>
            <div className="note" style={{ marginTop: 14 }}>
              <span>{c.lesson.split(". ").slice(0, 2).join(". ")}.</span>
            </div>
            <div className="actions" style={{ marginTop: 18 }}>
              <button className="btn" disabled={busy} onClick={() => void prove()}>
                {t("solve.prove")} →
              </button>
              <button className="btn ghost" disabled={busy} onClick={() => void askTutor()}>
                {t("solve.stuck")}
              </button>
              <Link className="btn ghost" href={`/learn/${c.subject}/${c.id}`}>{t("solve.lesson")}</Link>
            </div>
          </>
        )}
        {unsure && (
          <>
            <p className="eyebrow"><span className="no">~</span> {t("solve.unsureTitle")}</p>
            <h1 className="visually-small">{c ? c.title : t("solve.unsureTitle")}</h1>
            <p className="lead">{t("solve.unsureLead")}</p>
            {altIds.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {altIds.map((aid) => {
                  const ac = getConcept(aid);
                  if (!ac) return null;
                  return (
                    <button key={aid} className="btn ghost small" onClick={() => { setConceptId(aid); setUnsure(false); setAltIds([]); }}>
                      {ctitle(lang, aid)}
                    </button>
                  );
                })}
              </div>
            )}
            {c && (
              <div className="actions" style={{ marginTop: 18 }}>
                <button className="btn" disabled={busy} onClick={() => void prove()}>
                  {t("solve.prove")} →
                </button>
                <Link className="btn ghost" href={`/learn/${c.subject}/${c.id}`}>{t("solve.lesson")}</Link>
              </div>
            )}
          </>
        )}
        {hint && (
          <div className="note" style={{ marginTop: 16 }}>
            <strong>{t("tutor.title")}</strong>
            <span>{hint}</span>
          </div>
        )}
        <button className="btn ghost small" style={{ marginTop: 26 }} onClick={() => { setStage("ask"); setText(""); setHint(null); setConceptId(null); setUnsure(false); }}>
          ← {t("solve.another")}
        </button>
      </main>
    );
  }

  if (stage === "proving" && q) {
    return (
      <main className="container narrow" style={{ paddingTop: 56 }}>
        <p className="eyebrow"><span className="no">✎</span> {t("solve.proveEyebrow")} · {t("solve.independentTag")}</p>
        <h1 className="visually-small">{t("solve.proveTitle")}</h1>
        <div className="card" style={{ marginTop: 16 }}>
          <p className="qprompt">
            {q.prompt}
            <SpeakButton text={q.prompt} />
          </p>
          <div className="choices">
            {q.choices.map((ch, i) => {
              const cls =
                picked === null ? "" :
                i === answerIndex ? "ok reveal" :
                i === picked ? "bad" : "";
              return (
                <button key={i} className={`choice ${cls}`} disabled={picked !== null || busy} onClick={() => void answer(i)}>
                  <span className="mark" data-idx={String.fromCharCode(65 + i)} />
                  <span className="choice-text">{ch}</span>
                </button>
              );
            })}
          </div>
          {picked === null && <StarterMode conceptId={q.conceptId} questionId={q.id} lang={lang} />}
          {correct !== null && (
            <div className={`feedback ${correct ? "ok" : "no"}`}>
              <span className="verdict">{correct ? "✓ " + t("solve.nailed") : "✗ " + t("solve.notYet")}</span>
            </div>
          )}
          {flare && <MicroDiagnostic flare={flare} lang={lang} />}
          {saved && <p className="small muted">{t("offline.answerSaved")}</p>}
          {err && <p className="small">{err}</p>}
        </div>
        {correct && (
          <div className="actions" style={{ marginTop: 18 }}>
            <button className="btn" onClick={() => void proveTransfer()}>{t("solve.transferBtn")} →</button>
          </div>
        )}
      </main>
    );
  }

  if (stage === "transfer" && q) {
    return (
      <main className="container narrow" style={{ paddingTop: 56 }}>
        <p className="eyebrow"><span className="no">⇄</span> {t("solve.transferEyebrow")}</p>
        <h1 className="visually-small">{t("solve.transferTitle")}</h1>
        <div className="card" style={{ marginTop: 16 }}>
          <p className="qprompt">
            {q.prompt}
            <SpeakButton text={q.prompt} />
          </p>
          <div className="choices">
            {q.choices.map((ch, i) => {
              const cls =
                picked === null ? "" :
                i === answerIndex ? "ok reveal" :
                i === picked ? "bad" : "";
              return (
                <button key={i} className={`choice ${cls}`} disabled={picked !== null || busy} onClick={() => void answer(i)}>
                  <span className="mark" data-idx={String.fromCharCode(65 + i)} />
                  <span className="choice-text">{ch}</span>
                </button>
              );
            })}
          </div>
          {correct !== null && (
            <div className={`feedback ${correct ? "ok" : "no"}`}>
              <span className="verdict">{correct ? "✓ " + t("solve.transferOk") : "✗ " + t("solve.transferNo")}</span>
            </div>
          )}
          {saved && <p className="small muted">{t("offline.answerSaved")}</p>}
          {err && <p className="small">{err}</p>}
        </div>
        {transferOk && (
          <div className="actions" style={{ marginTop: 18 }}>
            <button className="btn" onClick={() => setStage("mastered")}>{t("solve.masteredCta")} →</button>
          </div>
        )}
      </main>
    );
  }

  // stage === "mastered": the shareable moment, closed by the next-step
  // engine — "based on today's work, here's what I'd learn next" (§27, screen 9).
  const subject = c?.subject ?? "maths";
  const nextConcept = nextId ? getConcept(nextId) : null;
  return (
    <main className="container narrow" style={{ paddingTop: 56 }}>
      <p className="eyebrow"><span className="no">✓</span> {t("solve.masteredEyebrow")}</p>
      <h1 className="visually-small">{t("solve.masteredTitle")}</h1>
      <p className="lead">{c ? c.title : ""} · {t("solve.masteredLead")}</p>
      <div className="actions" style={{ marginTop: 18 }}>
        <Link className="btn" href={`/try/${conceptId}`}>{t("solve.challengeFriend")} →</Link>
        <Link className="btn ghost" href={`/learn/${subject}/${conceptId}`}>{t("solve.keepGoing")}</Link>
      </div>
      <p className="small muted" style={{ marginTop: 24 }}>{t("solve.teachPrompt")}</p>
      <div className="actions">
        <Link className="btn ghost small" href={`/learn/${subject}/${conceptId}`}>{t("solve.teachCta")}</Link>
      </div>
      {nextConcept && (
        <div className="card soft" style={{ marginTop: 22 }}>
          <p className="eyebrow" style={{ margin: 0 }}><span className="no">→</span> {t("solve.nextEyebrow")}</p>
          <p style={{ margin: "6px 0 2px", fontWeight: 700 }}>{ctitle(lang, nextConcept.id)}</p>
          <p className="small muted" style={{ margin: 0 }}>{cblurb(lang, nextConcept.id)}</p>
          <div className="actions">
            <Link className="btn small" href={`/learn/${nextConcept.subject}/${nextConcept.id}`}>
              {t("solve.nextCta")} →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
