"use client";

import { useState } from "react";
import { reviewExplanation, type ExplanationReview } from "@/lib/peer-review";
import { useI18n } from "@/lib/client";

/**
 * TEACH IT BACK — after the questions, and never marked.
 *
 * Two things changed here, and both were complaints about the same box:
 *
 * 1. IT MOVED TO THE END. It used to sit in the reading stage, above the
 *    practice: a learner was asked to explain a concept they had not been served
 *    a single question on, so the only way to fill the box was to re-word the
 *    lesson paragraph. Explanation is a way to find out whether you can use an
 *    idea, so it now comes after using it — the concept page renders this below
 *    the session result, not before the session.
 *
 * 2. IT STOPPED SCORING. `reviewExplanation` (lib/peer-review.ts) no longer
 *    returns a verdict, and nothing is written into the learner's record from
 *    here. What is left is a checklist: which of the concept's own key ideas the
 *    explanation named. That is checkable by a keyword scan honestly, whereas
 *    "is this explanation correct" is not — see the four reasons listed at the
 *    top of lib/peer-review.ts.
 *
 * The component says so out loud rather than implying a mark with a tick: a
 * learner who writes something good, gets a shorter checklist than they expect
 * and believes a machine judged them wrong is worse off than one who is told
 * plainly that this is for their own thinking.
 */
export default function PeerTeach({ lesson, conceptTitle }: { lesson: string; conceptTitle: string }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [review, setReview] = useState<ExplanationReview | null>(null);
  return (
    <section className="card soft" style={{ marginTop: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}>
        {t("peer.eyebrow")} · {conceptTitle}
      </p>
      <p className="small muted">{t("peer.prompt")}</p>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        /* THE EXAMPLE IS THE CONCEPT'S OWN NAME. It used to be one authored
           sentence about photosynthesis, printed for all 135 concepts, so a
           fractions lesson showed a stranger's biology answer as the model. */
        placeholder={conceptTitle}
        aria-label={t("peer.eyebrow")}
        style={{ width: "100%" }}
      />
      <button
        className="btn small"
        style={{ marginTop: 8 }}
        disabled={text.trim().length < 20}
        onClick={() => setReview(reviewExplanation(lesson, text))}
      >
        {t("peer.checkBtn")}
      </button>
      {review && (
        <div style={{ marginTop: 12 }} role="status">
          <p className="small" style={{ margin: 0 }}>
            <strong>{t("peer.ideas")}</strong>
          </p>
          {/* BOTH LISTS, SIDE BY SIDE IN ONE COLUMN, WITH NO TALLY. A count
              ("3 of 5") is a score whatever it is called, and a learner who
              covered four of five ideas understands the concept. The marker is
              a tick or a dot, not a right or a wrong. */}
          <ul className="small" style={{ margin: "6px 0 0 18px", padding: 0 }}>
            {[...review.covered.map((idea) => ({ idea, used: true })), ...review.missing.map((idea) => ({ idea, used: false }))]
              .map(({ idea, used }) => (
                <li key={idea} style={{ marginBottom: 2, opacity: used ? 1 : 0.65 }}>
                  <span aria-hidden="true">{used ? "✓" : "○"}</span>{" "}
                  <span className="mono">{idea}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}
