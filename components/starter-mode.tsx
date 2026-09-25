"use client";

// ─────────────────────────────────────────────────────────────────────────────
// The Starter Mode panel (§6/§15). For the student who says "I understand the
// question but don't know how to start." Four steps, none of which solve
// anything: what are you looking FOR → what do you KNOW → which idea
// CONNECTS those → here's the first move, the rest is yours.
//
// Steps 1 and 2 never leave the browser: they're scratch thinking, and a
// nonprofit serving young students should collect as little text as possible.
// Step 3 is the only server interaction, because the pick is learner-model
// data (which connector a student believes is the bridge).
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useI18n } from "@/lib/client";
import { anonStarter, anonStarterPick } from "@/lib/anon-practice";
import type { StarterReveal } from "@/lib/starter";

export default function StarterMode({
  conceptId,
  questionId,
  lang,
}: {
  conceptId: string;
  questionId: string;
  lang: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 closed · 1 goal · 2 givens · 3 connector · 4 reveal
  const [goal, setGoal] = useState("");
  const [givens, setGivens] = useState("");
  const [choices, setChoices] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [reveal, setReveal] = useState<StarterReveal | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function start() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const v = await anonStarter(conceptId, questionId, lang);
      if (!v) { setFailed(true); return; }
      setOpen(true);
      if (v.step === 4) { setReveal(null); setStep(4); return; } // no discriminative connectors
      setStep(v.step);
      setChoices(v.choices ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function pickConnector(i: number) {
    if (busy || picked !== null) return;
    setPicked(i);
    setBusy(true);
    try {
      const r = await anonStarterPick(conceptId, questionId, i, lang);
      if (r) { setReveal(r); setStep(4); }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div style={{ marginTop: 14 }}>
        <button className="btn ghost small" disabled={busy} onClick={() => void start()}>
          🧭 {t("starter.open")}
        </button>
        {failed && <p className="small muted" style={{ marginTop: 6 }}>{t("starter.unavailable")}</p>}
      </div>
    );
  }

  return (
    <div className="note" style={{ marginTop: 16 }}>
      <strong>🧭 {t("starter.title")}</strong>

      {step === 1 && (
        <>
          <p style={{ marginTop: 8 }}>{t("starter.askGoal")}</p>
          <textarea
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={t("starter.placeholderGoal")}
            style={{ width: "100%" }}
          />
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="btn small" onClick={() => setStep(2)}>{t("common.next")} →</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ marginTop: 8 }}>
            {goal.trim() && <span className="muted">“{goal.trim().slice(0, 120)}” — </span>}
            {t("starter.askGivens")}
          </p>
          <textarea
            rows={2}
            value={givens}
            onChange={(e) => setGivens(e.target.value)}
            placeholder={t("starter.placeholderGivens")}
            style={{ width: "100%" }}
          />
          <div className="actions" style={{ marginTop: 10 }}>
            {choices ? (
              <button className="btn small" onClick={() => setStep(3)}>{t("common.next")} →</button>
            ) : (
              <p className="small muted">{t("common.next")}…</p>
            )}
          </div>
        </>
      )}

      {step === 3 && choices && (
        <>
          <p style={{ marginTop: 8 }}>
            {givens.trim() && <span className="muted">“{givens.trim().slice(0, 120)}” — </span>}
            {t("starter.askBridge")}
          </p>
          <div className="choices" style={{ marginTop: 8 }}>
            {choices.map((ch, i) => (
              <button
                key={i}
                className={`choice ${picked !== null ? (i === picked ? (reveal?.correct ? "ok reveal" : "bad") : "") : ""}`}
                disabled={picked !== null || busy}
                onClick={() => void pickConnector(i)}
              >
                <span className="mark" data-idx={String.fromCharCode(65 + i)} />
                <span className="choice-text">{ch}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 4 && (
        reveal ? (
          <>
            <p style={{ marginTop: 8 }}>
              {reveal.correct ? "✓ " : ""}{t("starter.bridgeIs")} <strong>{reveal.connectorTitle}</strong>
              {reveal.connectorBlurb ? <span className="muted"> — {reveal.connectorBlurb}</span> : null}
            </p>
            {(reveal.firstMoveText || reveal.firstMoveKey) && (
              <p style={{ marginTop: 6 }}>
                <span className="muted">{t("starter.firstMove")}</span>{" "}
                {reveal.firstMoveText ?? t(reveal.firstMoveKey!)}
              </p>
            )}
            <p className="small muted" style={{ marginTop: 6 }}>{t("starter.yours")}</p>
          </>
        ) : (
          <p className="small muted" style={{ marginTop: 8 }}>{t("starter.noBridge")}</p>
        )
      )}
    </div>
  );
}
