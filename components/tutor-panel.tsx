"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE TUTOR, AS A PANEL (§tutor).
//
// It used to be a separate page: to ask one question about the problem on
// screen, a learner had to leave the problem. That is the wrong shape for the
// whole feature — the tutor is a companion to the work, so it sits beside the
// question on a laptop and slides over it on a phone, and the question is
// never replaced by a chat window.
//
// Three things it must always know, and always shows: the concept it is
// grounded in, the question on screen, and the learner's own level. The
// concept and the level are read from the learner's record server-side
// (lib/server/tutor.ts); the question is the one actually in front of them.
//
// And one rule it must never break: a reply carries its own disclosure. If the
// answer came from OpenMind's deterministic tutor rather than a model, it says
// so on the reply — a screen that labels both "Tutor" and implies intelligence
// where there was a lookup is lying to a thirteen-year-old (§11).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { loadLocalProfileId, loadLocalProfileSecret, useI18n } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { ctitle } from "@/lib/content-i18n";
import { disclosureKey } from "@/lib/tutor-context";
import VoiceInput from "@/components/voice-input";

interface Turn {
  role: "you" | "tutor";
  text: string;
  labelKey?: string;
  why?: string;
}

/** The grounding line, rendered from the payload — the client never composes
 *  the reason a decision was made. */
function whyLine(grounding: unknown, t: (k: string) => string, conceptTitle: string): string | undefined {
  const g = grounding as { decision?: { reason?: string; title?: string } } | null;
  const reason = g?.decision?.reason;
  if (!reason) return undefined;
  return fill(t("tutor.whyThis"), { concept: g?.decision?.title || conceptTitle, reason });
}

export default function TutorPanel({
  conceptId,
  questionText,
  questionNumber,
  open,
  onToggle,
}: {
  conceptId: string;
  /** The question currently on screen, so the tutor's context is the real one. */
  questionText?: string;
  questionNumber?: string;
  /** Phone only: the sheet is closed until tapped open. Ignored on desktop. */
  open?: boolean;
  onToggle?: () => void;
}) {
  const { t, lang } = useI18n();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo(0, 1e6);
  }, [turns.length, open]);

  async function send(message: string) {
    const body = message.trim();
    if (!body || busy) return;
    setBusy(true);
    setText("");
    setTurns((prev) => [...prev, { role: "you", text: body }]);
    try {
      // The learner's capability rides along so the turn can be grounded in
      // their own projection. The question in front of them rides along as
      // CONTEXT, never as an instruction.
      const id = loadLocalProfileId();
      const secret = id ? loadLocalProfileSecret() : null;
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId,
          message: body,
          // The question on screen travels as its OWN field, not glued onto the
          // learner's sentence: a tutor that reads "what is the capital of
          // France? [question: 3/4 + 2/5]" cannot tell what the learner said
          // from what the page said.
          question: questionText ? questionText.slice(0, 300) : undefined,
          language: lang,
          id,
          secret,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error ?? `HTTP ${res.status}`);
      setTurns((prev) => [...prev, {
        role: "tutor",
        text: payload.reply ?? "…",
        labelKey: disclosureKey(payload),
        why: whyLine(payload.grounding, t, ctitle(lang, conceptId)),
      }]);
    } catch {
      setTurns((prev) => [...prev, { role: "tutor", text: t("tutor.err") }]);
    } finally {
      setBusy(false);
    }
  }

  // Two starters, because on a phone typing a maths sentence is the slowest
  // thing on the screen and "I don't know what to ask" is the real first
  // problem.
  const starters = [t("ask.whatTesting"), t("ask.workThrough")];

  return (
    <>
      {/* The phone's door to the panel: one button in the thumb's reach. */}
      {!open && (
        <button type="button" className="tutor-fab" onClick={() => onToggle?.()}>
          <span aria-hidden="true">?</span> {t("learn.ask")}
        </button>
      )}

      <aside className="tutor-panel" data-open={open ? "true" : "false"} aria-label={t("tutor.title")}>
        <div className="tutor-head">
          <b>{t("tutor.title")}</b>
          {/* The three things the tutor's context is built from, on screen. */}
          <span className="tutor-where">{ctitle(lang, conceptId)}</span>
          <button type="button" className="tutor-close" onClick={() => onToggle?.()}>{t("common.close")}</button>
        </div>

        {questionText && (
          <p className="small muted" style={{ margin: 0, padding: "10px var(--s2) 0" }}>
            {questionNumber && <span className="mono">{questionNumber} · </span>}
            {questionText.length > 90 ? `${questionText.slice(0, 90)}…` : questionText}
          </p>
        )}

        <div className="tutor-body" ref={scroller}>
          {turns.length === 0 && <p className="small muted" style={{ margin: 0 }}>{t("tutor.sub")}</p>}
          {turns.map((turn, i) => (
            <div key={i} className={`msg ${turn.role === "you" ? "me" : "tutor"}`}>
              <span className="who">{turn.role === "you" ? t("tutor.you") : t("tutor.title")}</span>
              {turn.text}
              {turn.why && <span className="small muted" style={{ display: "block", marginTop: 6 }}>{turn.why}</span>}
              {/* Who answered, on every reply, or nothing at all. */}
              {turn.labelKey && <span className="small muted" style={{ display: "block", marginTop: 4 }}>{t(turn.labelKey)}</span>}
            </div>
          ))}
          {busy && <div className="msg tutor"><span className="who">…</span></div>}
        </div>

        <div className="tutor-starters">
          {starters.map((s) => (
            <button key={s} type="button" className="chip" disabled={busy} onClick={() => void send(s)}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="tutor-form"
          onSubmit={(e) => { e.preventDefault(); void send(text); }}
        >
          <label className="visually-hidden" htmlFor={`tutor-${conceptId}`}>{t("tutor.ph")}</label>
          <textarea
            id={`tutor-${conceptId}`}
            value={text}
            rows={2}
            placeholder={t("tutor.ph")}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(text); }
            }}
          />
          <VoiceInput onText={(v) => setText((p) => (p ? `${p} ${v}` : v))} lang={lang} />
          <button type="submit" className="btn" disabled={busy || !text.trim()}>{t("learn.ask")}</button>
        </form>
      </aside>
    </>
  );
}
