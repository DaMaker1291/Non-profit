"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The micro-diagnostic panel (§4–5). When a misconception flares — a repeated
// recent pattern, never a single mistake — the response carries its name, the
// student's likely belief, the coaching line, and (when due) a one-question
// probe on the misconception's home concept. The probe's result classifies
// the failure honestly: conceptual (the idea itself) or procedural (execution).
// Shared by /solve, /try and the learn page.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useI18n } from "@/lib/client";
import { anonMicroCheck } from "@/lib/anon-practice";
import { mcName, mcCoaching } from "@/lib/content-i18n";
import type { FlarePayload } from "@/lib/microdiag";

export default function MicroDiagnostic({ flare, lang }: { flare: FlarePayload; lang: string }) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<{ status: string; correct: boolean; explanation: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function answer(i: number) {
    if (!flare.check || picked !== null || busy) return;
    setPicked(i);
    setBusy(true);
    try {
      const r = await anonMicroCheck(
        // The flare lives on the concept the student was working on — NOT the
        // probe's home concept, which the server derives internally.
        flare.conceptId,
        flare.misconceptionId,
        flare.check.question.id,
        i,
        lang,
      );
      if (r) setResult(r);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card soft" style={{ marginTop: 12, borderColor: "var(--ink)" }}>
      <p className="eyebrow" style={{ margin: 0 }}>
        <span className="no">!</span> {t("micro.eyebrow")}
      </p>
      <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{mcName(lang, flare.misconceptionId, flare.name)}</p>
      <p className="small" style={{ margin: "4px 0 0" }}>{mcCoaching(lang, `p:${flare.misconceptionId}`, flare.pattern)}</p>
      <p className="small" style={{ margin: "6px 0 0" }}>{mcCoaching(lang, flare.misconceptionId, flare.coaching)}</p>

      {flare.check && !result && (
        <div style={{ marginTop: 12 }}>
          <p className="small" style={{ fontWeight: 600, margin: "0 0 8px" }}>{t("micro.question")}</p>
          <p className="qprompt">{flare.check.question.prompt}</p>
          <div className="choices">
            {flare.check.question.choices.map((ch, i) => (
              <button
                key={i}
                className={`choice ${picked === i ? "sel" : ""}`}
                disabled={picked !== null || busy}
                onClick={() => void answer(i)}
              >
                <span className="mark" data-idx={String.fromCharCode(65 + i)} />
                <span className="choice-text">{ch}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className={`feedback ${result.correct ? "ok" : "no"}`} style={{ marginTop: 12 }}>
          <span className="verdict">
            {result.correct ? `✓ ${t("micro.procedural")}` : `⚠ ${t("micro.conceptual")}`}
          </span>
          {result.explanation}
          <span className="small" style={{ display: "block", marginTop: 6 }}>
            {result.correct ? t("micro.proceduralNote") : t("micro.conceptualNote")}
          </span>
        </div>
      )}
    </div>
  );
}
