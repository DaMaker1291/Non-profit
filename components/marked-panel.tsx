"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE MARKED ANSWER — what a learner reads the instant they press Check.
//
// WHY THIS IS ONE COMPONENT. The server has always sent the teaching WITH the
// verdict: `explanation` (the worked reasoning) and `misconceptionId` (the named
// belief a wrong answer sat on). The signed-in concept page rendered both. The
// two ANONYMOUS surfaces — /try (the learning link a friend was sent) and /solve
// (the wedge a stranger arrives at) — stored only `correct` and threw the rest
// away, so the first thing a brand-new learner ever saw after answering was
// "✗ Not yet" and nothing else on the screen. That is the one outcome this
// product must never produce: it tells somebody they are wrong and leaves them
// exactly where they were.
//
// So the words, the order and the disclosure live here, once, and every surface
// that marks an answer renders this. The order is the sentence that teaches:
//
//   · a WRONG answer leads with the named mistake and the right answer, then
//     offers the working underneath. Three paragraphs of algebra arriving the
//     instant an answer is marked is how feedback stops being read at all.
//   · a CORRECT answer opens the reasoning at once — it is the confirmation of
//     why it worked, which is the difference between a verdict and an
//     understanding.
//
// The verdict line itself is kept and is deliberately not the whole panel: the
// generic "Correct! / Incorrect!" the surfaces used to render was a verdict with
// no teaching, which measures nothing and teaches nothing.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { mcName, mcCoaching } from "@/lib/content-i18n";
import { proofLabelKey, proofSentenceKey, type ProofVerdict } from "@/lib/proof";

export interface MarkedPanelProps {
  /** The server's verdict. */
  correct: boolean;
  /** The options as SERVED, so a wrong answer can be told which one was right.
   *  `choices[answerIndex]` is the correct answer's display form, for a typed
   *  numeric answer as much as for a picked one (lib/answer#answerDisplay). */
  choices: string[];
  /** The correct option's index — post-grade only, and null on a duplicate
   *  replay, where there is no fresh verdict to explain. */
  answerIndex: number | null;
  /** The worked reasoning. Empty when the server has none to give. */
  explanation: string;
  /** The belief this wrong answer sat on, when the item probed a named one. */
  misconceptionId: string | null;
  /** For naming the belief in the learner's own language, as MicroDiagnostic
   *  does. The words come from the catalogue, never from this component. */
  lang: string;
  /** WHAT THIS ANSWER PROVED — the verdict lib/proof.ts gives the attribution
   *  the SERVER made (`verdictForGrade`). Null on a wrong answer and on a
   *  replayed one, and that is the rule rather than an omission: this line
   *  describes achievement, and the coaching below is where a miss is answered. */
  proof?: ProofVerdict | null;
  /** The dictionary, for the two proof words. Passed in like the labels, so
   *  this component resolves nothing of its own beyond the belief catalogue. */
  t: (key: string) => string;
  /** Labels, passed in so this component carries no dictionary of its own. */
  correctLabel: string;
  wrongLabel: string;
  answerLabel: string;
  explainLabel: string;
}

export default function MarkedPanel({
  correct, choices, answerIndex, explanation, misconceptionId, lang, proof, t,
  correctLabel, wrongLabel, answerLabel, explainLabel,
}: MarkedPanelProps) {
  // Reset with the question, not with the panel: each new serve remounts this
  // (the callers key it by question id), so a learner never sees the previous
  // answer's working behind a fresh verdict.
  const [showWhy, setShowWhy] = useState(false);

  // A belief is named only when the catalogue KNOWS it. An id that resolves to
  // nothing would render as `mc.some-id` on the screen, which reads to a learner
  // as a bug in their answer rather than a gap in our content.
  const mid = misconceptionId && MISCONCEPTIONS_BY_ID[misconceptionId] ? misconceptionId : null;
  const miscName = mid ? mcName(lang, mid, MISCONCEPTIONS_BY_ID[mid].name) : null;
  const miscLine = mid ? mcCoaching(lang, mid, MISCONCEPTIONS_BY_ID[mid].coaching).split(".")[0] : null;

  // The right answer, when there is one to show. A numeric item is answered by
  // typing, but its options still carry the values it was built from, so
  // `choices[answerIndex]` names the number the learner should have reached.
  const right = !correct && answerIndex !== null ? choices[answerIndex] : undefined;
  const hasWhy = explanation.trim().length > 0;
  // Correct → the reasoning is the reward and shows at once. Wrong → it is
  // offered, under the diagnosis.
  const whyShown = correct || showWhy;

  return (
    <div className={`feedback ${correct ? "ok" : "no"}`} role="status" aria-live="polite">
      <span className="verdict">{correct ? `✓ ${correctLabel}` : `✗ ${wrongLabel}`}</span>
      {right && (
        <p style={{ margin: "0 0 8px" }}>
          <b>{answerLabel}</b> <span className="mono">{right}</span>
        </p>
      )}
      {miscName && (
        <p style={{ margin: "0 0 8px" }}>
          <b className="tag">{miscName}</b>
          {" — "}{miscLine}.
        </p>
      )}
      {hasWhy && (
        whyShown ? (
          <>
            <span className="why-title">{explainLabel}</span>
            {explanation}
          </>
        ) : (
          <button type="button" className="linkish" onClick={() => setShowWhy(true)}>
            {explainLabel} →
          </button>
        )
      )}
      {/* WHAT THE ANSWER PROVED, which is a different claim from whether it was
          right: "correct" and "independently correct" are the whole basis of the
          learner model and until now only the signed-in page said so. The
          markup is deliberately /learn's, character for character, so one
          answer cannot be described two ways on two screens. */}
      {proof && (
        <p className="proof-line">
          <span className="proof-k">{t("ev.eyebrow")}</span>
          <span className={`chip ${proof === "supported" ? "" : "good"}`}>{t(proofLabelKey(proof))}</span>
          <span className="small">{t(proofSentenceKey(proof))}</span>
        </p>
      )}
    </div>
  );
}
