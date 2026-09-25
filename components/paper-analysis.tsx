"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Marks lost BY IDEA, and the one thing to do about it.
//
// A score tells a learner nothing they can act on. This panel answers: which
// ideas cost marks, which of them came up more than once (a pattern, not a
// slip), how much of the loss sat on those ideas, and where to go next.
//
// The breakdown is by CONCEPT — the finest grouping the specification layer
// actually supports. No board topic names are invented to make the table look
// more familiar than the data is.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useI18n } from "@/lib/client";
import { ctitle, mcCoachingNative, mcName } from "@/lib/content-i18n";
import { getConcept } from "@/lib/genome";
import { fill } from "@/lib/i18n";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";

export interface ConceptTallyShape {
  conceptId: string;
  subject: string;
  questions: number;
  marksAvailable: number;
  marksAwarded: number;
  marksLost: number;
  correct: number;
  wrong: number;
  unanswered: number;
  tags: Array<{ id: string; hits: number }>;
}

export interface PaperAnalysisShape {
  lostMarks: number;
  unansweredCount: number;
  byConcept: ConceptTallyShape[];
  recurring: ConceptTallyShape[];
  weakest: ConceptTallyShape | null;
  concentration: number;
}

const linkFor = (t: ConceptTallyShape, intent?: "REMEDIATE") =>
  `/learn/${getConcept(t.conceptId)?.subject ?? "maths"}/${t.conceptId}${intent ? `?intent=${intent}` : ""}`;

export default function PaperAnalysisPanel({ analysis }: { analysis: PaperAnalysisShape }) {
  const { t, lang } = useI18n();
  const lost = analysis.byConcept.filter((c) => c.marksLost > 0);

  return (
    <section className="exercise" style={{ marginTop: 20 }} aria-label={t("an.eyebrow")}>
      <p className="eyebrow" style={{ margin: 0 }}>
        <span className="no">§</span> {t("an.eyebrow")}
      </p>

      {lost.length === 0 ? (
        <p className="small muted" style={{ margin: "8px 0 0" }}>{t("an.none")}</p>
      ) : (
        <>
          <h3 style={{ margin: "10px 0 4px" }}>{t("an.lost")}</h3>
          {lost.map((c) => (
            <div
              key={c.conceptId}
              style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "7px 0", borderTop: "1px solid var(--line)" }}
            >
              <Link href={linkFor(c)} className="small" style={{ flex: "1 1 45%" }}>
                {ctitle(lang, c.conceptId)}
              </Link>
              <span className="mono small muted" style={{ flex: "0 0 auto" }}>
                {c.questions} {c.questions === 1 ? t("an.qsOne") : t("an.qs")}
                {c.unanswered > 0 && ` · ${c.unanswered} ${t("an.unanswered")}`}
              </span>
              <span className="mono small" style={{ flex: "0 0 auto" }}>
                {t("an.lostMarks")} {c.marksLost}/{c.marksAvailable}
              </span>
            </div>
          ))}

          {analysis.recurring.length > 0 && (
            <div className="card soft" style={{ marginTop: 14, borderLeft: "4px solid var(--margin-red)" }}>
              <p className="eyebrow" style={{ margin: 0 }}>
                <span className="no">!</span> {t("an.recurring")}
              </p>
              {analysis.recurring.map((c) => (
                <p key={c.conceptId} className="small" style={{ margin: "6px 0 0" }}>
                  {fill(t("an.recurringLine"), {
                    m: c.marksLost,
                    n: c.questions,
                    t: ctitle(lang, c.conceptId),
                  })}
                  {c.tags[0] && MISCONCEPTIONS_BY_ID[c.tags[0].id] && (
                    <>
                      {" "}
                      {(() => {
                        // Coaching has no native line yet, so it is shown only when
                        // that line is in the reader's language — never English
                        // spliced into the middle of a translated sentence. With no
                        // line, the name ends the sentence instead of dangling
                        // before an empty colon.
                        const line = mcCoachingNative(lang, c.tags[0].id);
                        return (
                          <>
                            <strong className="tag">
                              {mcName(lang, c.tags[0].id, MISCONCEPTIONS_BY_ID[c.tags[0].id].name)}
                              {line ? ":" : "."}
                            </strong>
                            {line ? ` ${line.split(".")[0]}.` : ""}
                          </>
                        );
                      })()}
                    </>
                  )}
                </p>
              ))}
              <p className="small muted" style={{ margin: "8px 0 0" }}>
                {fill(t("an.concentration"), {
                  m: analysis.recurring.reduce((s, c) => s + c.marksLost, 0),
                  total: analysis.lostMarks,
                })}
              </p>
            </div>
          )}

          {analysis.weakest && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <Link href={linkFor(analysis.weakest, "REMEDIATE")} className="btn">
                {t("an.weakest")} → {ctitle(lang, analysis.weakest.conceptId)}
              </Link>
              <Link href="/mistakes" className="btn ghost">
                {t("err.eyebrow")}
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
