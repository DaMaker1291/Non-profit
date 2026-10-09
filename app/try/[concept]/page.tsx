"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The learning link. "Can you solve this?" — a friend's challenge lands
// straight on a live generated question for the concept. No account, no
// landing page, no pitch. Answer it and OpenMind teaches; the wedge takes
// over from there. Grading is server-side: the visitor's answer is recorded
// against a lazily created anonymous profile.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/client";
import { getConcept } from "@/lib/genome";
import { ctitle, cblurb } from "@/lib/content-i18n";
import { anonServe, anonAnswer } from "@/lib/anon-practice";
import type { AnonPracticeQ } from "@/lib/anon-practice";
import MicroDiagnostic from "@/components/micro-diagnostic";
import SpeakButton from "@/components/speak-button";
import PromptText from "@/components/prompt-text";
import NumericAnswer from "@/components/numeric-answer";
import MarkedPanel from "@/components/marked-panel";
import WorkSheet from "@/components/work-sheet";
import { verdictForGrade } from "@/lib/proof";
import type { FlarePayload } from "@/lib/microdiag";

export default function TryConceptPage() {
  const params = useParams<{ concept: string }>();
  const conceptId = params?.concept ?? "";
  const { t, lang } = useI18n();
  const c = getConcept(conceptId);
  const [q, setQ] = useState<AnonPracticeQ | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  // The teaching the server sent WITH the verdict. This page used to receive
  // both and drop both, so a stranger's first answer was answered with a bare
  // "Not yet". Held here and handed to MarkedPanel.
  const [explanation, setExplanation] = useState("");
  const [misconceptionId, setMisconceptionId] = useState<string | null>(null);
  // The server's attribution of WHAT this answer demonstrated. Dropped here
  // until now, which is why a visitor was never told their work was
  // independent while the same answer on /learn said so.
  const [demonstrated, setDemonstrated] = useState<{ mode?: string; hints?: number; source?: string; retained?: boolean } | null>(null);
  const [flare, setFlare] = useState<FlarePayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  /** The answer is held on this device and will be marked on reconnect. Not an
   *  error, and not a verdict — a third outcome, said in the learner's words. */
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!c) return;
    setBusy(true);
    try {
      const question = await anonServe(conceptId, lang);
      setQ(question);
      setPicked(null);
      setAnswerIndex(null);
      setCorrect(null);
      setExplanation("");
      setMisconceptionId(null);
      setDemonstrated(null);
      setFlare(null);
      setSaved(false);
    } finally {
      setBusy(false);
    }
  }, [c, conceptId, lang]);

  useEffect(() => { void load(); }, [load]);

  /** One path for both response kinds: the consequence of an answer is the
   *  same whichever way it was given, and only the field the server reads
   *  differs. */
  async function submit(given: { choiceIndex: number } | { numericAnswer: string }) {
    if (!q || picked !== null || busy) return;
    if ("choiceIndex" in given) setPicked(given.choiceIndex);
    setBusy(true);
    try {
      const o = await anonAnswer(q.conceptId, q.id, given, lang);
      if (o.kind === "offline") { setSaved(true); return; }
      if (o.kind === "error") { setErr(t("common.error")); return; }
      setCorrect(o.grade.correct);
      setAnswerIndex(o.grade.answerIndex);
      setExplanation(o.grade.explanation);
      setMisconceptionId(o.grade.misconceptionId);
      setDemonstrated(o.grade.demonstrated);
      setFlare(o.grade.flare);
    } finally {
      setBusy(false);
    }
  }

  if (!c) {
    return (
      <main className="container narrow" style={{ paddingTop: 56 }}>
        <p className="eyebrow"><span className="no">!</span> 404</p>
        <h1 className="visually-small">{t("learn.notFound")}</h1>
        <Link className="btn ghost" href="/solve">{t("solve.eyebrow")}</Link>
      </main>
    );
  }

  return (
    <main className="container narrow" style={{ paddingTop: 56 }}>
      <p className="eyebrow"><span className="no">→</span> {t("try.eyebrow")}</p>
      <h1 className="visually-small">{t("try.title")}</h1>
      <p className="lead">{ctitle(lang, c.id)} — {cblurb(lang, c.id)}</p>
      {q && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="qprompt">
            <PromptText text={q.prompt} />
            <SpeakButton text={q.prompt} />
          </div>
          {/* Somewhere to work, before the place to answer. It never leaves the
              browser (components/work-sheet.tsx) and the sheet says so. */}
          <WorkSheet
            questionId={q.id}
            label={t("work.label")}
            placeholder={t("work.ph")}
            note={t("work.note")}
          />
          {q.responseKind === "numeric" ? (
            <NumericAnswer
              unit={q.tolerance?.unit}
              disabled={picked !== null || busy}
              label={t("answer.label")}
              checkLabel={t("learn.check")}
              emptyHint={t("answer.needNumber")}
              onSubmit={(raw) => void submit({ numericAnswer: raw })}
            />
          ) : (
            <div className="choices">
              {q.choices.map((ch, i) => {
                const cls =
                  picked === null ? "" :
                  i === answerIndex ? "ok reveal" :
                  i === picked ? "bad" : "";
                return (
                  <button key={i} className={`choice ${cls}`} disabled={picked !== null || busy} onClick={() => void submit({ choiceIndex: i })}>
                    <span className="mark" data-idx={String.fromCharCode(65 + i)} />
                    <span className="choice-text">{ch}</span>
                  </button>
                );
              })}
            </div>
          )}
          {correct !== null && (
            // Keyed by question: a re-serve remounts the panel, so the previous
            // answer's working can never sit under a fresh verdict.
            <MarkedPanel
              key={q.id}
              correct={correct}
              choices={q.choices}
              answerIndex={answerIndex}
              explanation={explanation}
              misconceptionId={misconceptionId}
              lang={lang}
              proof={verdictForGrade(demonstrated, correct)}
              t={t}
              correctLabel={t("learn.correct")}
              wrongLabel={t("learn.wrong")}
              answerLabel={t("fb.answerIs")}
              explainLabel={t("learn.explain")}
            />
          )}
          {flare && <MicroDiagnostic flare={flare} lang={lang} />}
          {saved && <p className="small muted">{t("offline.answerSaved")}</p>}
          {err && <p className="small">{err}</p>}
        </div>
      )}
      {!q && <p className="muted small">{busy ? t("common.loading") : t("common.error")}</p>}
      {correct !== null && (
        <div className="actions" style={{ marginTop: 18 }}>
          {correct ? (
            <Link className="btn" href={`/learn/${c.subject}/${c.id}`}>{t("try.learnMore")} →</Link>
          ) : (
            <Link className="btn" href={`/learn/${c.subject}/${c.id}`}>{t("try.fixIt")} →</Link>
          )}
          <button className="btn ghost" onClick={() => void load()}>{t("try.again")}</button>
        </div>
      )}
    </main>
  );
}
