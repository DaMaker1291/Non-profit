"use client";

import { useState } from "react";
import { reviewExplanation } from "@/lib/peer-review";
import { loadLocalProfileId, loadLocalProfileSecret, useI18n } from "@/lib/client";

/** Peer teach (§13): "explain it in your own words" — checked offline for
 *  correctness coverage, clarity gaps and missing threads. */
export default function PeerTeach({ lesson, conceptTitle, conceptId }: { lesson: string; conceptTitle: string; conceptId: string }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [fb, setFb] = useState<string | null>(null);
  return (
    <section className="card soft" style={{ marginTop: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">🧑‍🤝‍🧑</span> {t("peer.eyebrow")} · {conceptTitle}</p>
      <p className="small muted">{t("peer.prompt")}</p>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("peer.placeholder")}
        style={{ width: "100%" }}
      />
      <button
        className="btn small"
        style={{ marginTop: 8 }}
        disabled={text.trim().length < 20}
        onClick={async () => {
          const v = reviewExplanation(lesson, text, t);
          setFb(v.feedback);
          // Teaching is evidence: record the check (strong or not) so Next
          // Step can consume it — every action feeds the same learner model.
          const id = loadLocalProfileId();
          if (id) {
            try {
              await fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "peer", id, conceptId, strong: v.verdict === "strong", secret: loadLocalProfileSecret() ?? "" }),
              });
            } catch { /* evidence is bonus; the feedback already landed */ }
          }
        }}
      >
        {t("peer.checkBtn")}
      </button>
      {fb && <p className="small" style={{ marginTop: 8 }}>{fb}</p>}
    </section>
  );
}
