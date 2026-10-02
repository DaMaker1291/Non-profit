"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LEARN — "what should I learn?", as a list you can read top to bottom.
//
// The ordering is the GENOME's, not a board's topic names, and that is a
// deliberate limit rather than an oversight: the concept graph records a stage
// band and real prerequisites, and it does not record "Number / Algebra /
// Geometry" headings. Inventing them here would make the page look more
// authoritative than the data is — the headings would be decoration that
// happens to be wrong about a specific board's syllabus. So the bands are the
// stages the curriculum is actually built on, and each row carries the thing a
// learner needs to choose: the idea, what it is, and WHAT THEIR OWN RECORD SAYS
// about it.
//
// The evidence chips are the honest ones. A concept with no recorded answer
// says nothing at all about recall — not "0%", not "weak" — because the model
// starts every concept at a prior and a prior is not a measurement.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { use } from "react";
import { useI18n, useProfile } from "@/lib/client";
import { bySubject } from "@/lib/genome";
import { ctitle, cblurb } from "@/lib/content-i18n";
import { proofLabelKey, strongestProof } from "@/lib/proof";
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

  /** The right-hand side of a row: what this learner's record already supports.
   *  Returns [] for an untouched concept, which is the point — an empty cell
   *  claims nothing. */
  const stateChips = (id: string) => {
    const pr = state?.progress[id];
    if (!pr || (pr.attempts ?? 0) === 0) return [];
    const chips: { label: string; strong: boolean }[] = [
      { label: t("evv.dim.recalled"), strong: (pr.accuracy ?? pr.mastery ?? 0) >= 0.8 },
    ];
    // The strongest thing the record PROVED, in the same four words the mark's
    // own sentence uses (lib/proof) — so "Independent" on this list and
    // "Independent" under a question mean the same claim.
    const proved = strongestProof({
      correct: pr.correct,
      independentCorrect: pr.independent?.correct ?? 0,
      transferCorrect: pr.transfer?.correct ?? 0,
      retentionCorrect: pr.retention?.correct ?? 0,
    });
    if (proved) chips.push({ label: t(proofLabelKey(proved)), strong: proved !== "supported" });
    return chips;
  };

  const row = (c: (typeof concepts)[number]) => {
    const chips = stateChips(c.id);
    const pr = state?.progress[c.id];
    return (
      <Link key={c.id} href={`/learn/${subject}/${c.id}`} className="concept-row">
        <span className="grow">
          <b>{ctitle(lang, c.id)}</b>
          {chips.length === 0 && <span className="blurb">{cblurb(lang, c.id)}</span>}
        </span>
        <span className="state">
          {chips.map((ch) => (
            <span key={ch.label} className={`chip ${ch.strong ? "good" : ""}`}>{ch.label}</span>
          ))}
          {chips.length > 0 && pr && (
            <span className="mono small muted">{pr.correct}/{pr.attempts}</span>
          )}
        </span>
        <span className="muted" aria-hidden="true">→</span>
      </Link>
    );
  };

  return (
    <main className="container page">
      <div className="page-head">
        <p className="eyebrow">
          {t("nav.subjects")} <span className="mono">{touched}/{concepts.length}</span>
        </p>
        <h1>{label}</h1>
        <p className="lead" style={{ marginBottom: 0 }}>
          {concepts.length} {t("map.concepts")} · <Link href={`/diagnostic/${subject}`}>{t("dash.diagnose")} →</Link>
        </p>
      </div>

      {/* Who this course is, in one line: the board and the exam the learner
          actually chose. Nothing here is defaulted — an absent board is absent. */}
      {(boardLabel || p?.exam) && (
        <p style={{ margin: "0 0 var(--s3)" }}>
          {boardLabel && <span className="chip">{boardLabel}</span>}
          {p?.exam && <span className="chip warn" style={{ marginInlineStart: 8 }}>{p.exam}</span>}
        </p>
      )}

      {!hasProgress && entryPoints.length > 0 ? (
        <>
          <p className="small muted" style={{ marginBottom: 4 }}>{t("learn.notStarted")}</p>
          <div>{entryPoints.map(row)}</div>
          <p className="small muted" style={{ marginTop: "var(--s3)" }}>
            {entryPoints.length} {t("learn.foundations")}
          </p>
        </>
      ) : (
        [0, 1, 2, 3, 4, 5].map((stage) => {
          const band = concepts.filter((c) => c.stage === stage);
          if (!band.length) return null;
          const bandTouched = band.filter((c) => measuredCount(c.id)).length;
          return (
            <section key={stage}>
              <div className="stage-label">
                <span className="roman">{stage}</span> · {t(`stage.${stage}`)}
                <span className="mono" style={{ marginInlineStart: 8 }}>{bandTouched}/{band.length}</span>
              </div>
              <div>{band.map(row)}</div>
            </section>
          );
        })
      )}
      <div style={{ height: "var(--s4)" }} />
    </main>
  );
}
