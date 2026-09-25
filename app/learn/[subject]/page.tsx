"use client";

import Link from "next/link";
import { use } from "react";
import { useI18n, useProfile } from "@/lib/client";
import { bySubject, ancestorsOf } from "@/lib/genome";
import { ctitle, cblurb } from "@/lib/content-i18n";
import type { SubjectId } from "@/lib/types";

export default function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: raw } = use(params);
  const { t, lang } = useI18n();
  const { state } = useProfile();
  const subject = (["maths", "physics", "chemistry", "biology", "computing"] as SubjectId[]).includes(raw as SubjectId)
    ? (raw as SubjectId)
    : "maths";
  const label = t(`subj.${subject}`);
  const concepts = bySubject(subject);
  // "Measured" means the learner's own record holds at least one answer —
  // never a mastery threshold. Every entry starts with a baseline mastery of
  // 0.2 and no evidence, so counting by the score would describe untouched
  // concepts as progress.
  const measuredCount = (id: string) => (state?.progress[id]?.attempts ?? 0) > 0;
  const touched = concepts.filter((c) => measuredCount(c.id)).length;
  const p = state?.profile;
  const boardLabel = p?.board ? (p.board.charAt(0).toUpperCase() + p.board.slice(1)) : "";

  // For untouched learners, show only the entry points (no prereqs) so
  // they're not overwhelmed by 72 concepts. Once they have any progress,
  // show the full graph.
  const hasProgress = touched > 0;
  const entryPoints = hasProgress ? [] : concepts.filter((c) => c.prereqs.length === 0);

  return (
    <main className="container" style={{ paddingTop: 36 }}>
      <p className="eyebrow"><span className="no">§</span> {t("nav.subjects")} <span className="mono">{touched}/{concepts.length}</span></p>
      <h1 className="visually-small">{label}</h1>

       {!hasProgress && entryPoints.length > 0 ? (
        <>
          <p className="lead">
            {t("learn.notStarted")}
            {boardLabel && <span style={{ marginLeft: 8 }} className="chip">{boardLabel}</span>}
            {p?.exam && <span style={{ marginLeft: 8 }} className="chip warn">{p.exam}</span>}
            {p?.learningStyle && <span style={{ marginLeft: 8 }} className="chip">{t("onb.learningStyle")}</span>}
            <Link href={`/diagnostic/${subject}`} style={{ marginLeft: 8 }}>{t("dash.diagnose")} →</Link>
          </p>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {entryPoints.map((c) => {
              return (
                <Link key={c.id} href={`/learn/${subject}/${c.id}`} className="node" style={{ fontSize: 17, padding: 16 }}>
                  <b>{ctitle(lang, c.id)}</b>
                  <span className="small muted" style={{ marginTop: 4 }}>{cblurb(lang, c.id)}</span>
                </Link>
              );
            })}
          </div>
          <p className="small muted" style={{ marginTop: 20 }}>
            {entryPoints.length} {t("learn.foundations")}
          </p>
        </>
      ) : (
        <>
          <p className="lead">
            {concepts.length} {t("map.concepts")} · <Link href={`/diagnostic/${subject}`}>{t("dash.diagnose")} →</Link>
          </p>
          {[0, 1, 2, 3, 4, 5].map((stage) => {
            const band = concepts.filter((c) => c.stage === stage);
            if (!band.length) return null;
            return (
              <section key={stage}>
                <div className="stage-label">
                  <span className="roman">{stage}</span> · {t(`stage.${stage}`)}
                </div>
                <div className="genome-row">
                  {band.map((c) => {
                    // What the learner's own record supports, in the same shape
                    // the concept page uses: counts and a band word, or an
                    // explicit "not yet measured". A bare percentage used to sit
                    // here — a single number that hid whether it came from four
                    // answers or forty, and read as a claim the evidence had not
                    // made.
                    const p = state?.progress[c.id];
                    const measured = (p?.attempts ?? 0) > 0;
                    const rate = p?.accuracy ?? p?.mastery ?? 0;
                    const strong = rate >= 0.8;
                    const cls = measured ? (strong ? "strong" : "weak") : "";
                    const bl = cblurb(lang, c.id);
                    return (
                      <Link key={c.id} href={`/learn/${subject}/${c.id}`} className={`node ${cls}`}>
                        {ctitle(lang, c.id)}
                        <span className="sub">
                          {measured && p ? (
                            <>
                              <span className={`chip ${strong ? "good" : ""}`}>
                                {t(strong ? "mm.strong" : "mm.developing")}
                              </span>{" "}
                              <span className="mono small muted">{p.correct}/{p.attempts}</span>
                            </>
                          ) : bl.length > 60 ? `${bl.slice(0, 60)}…` : bl}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </>
      )}
      <div style={{ height: 30 }} />
    </main>
  );
}
