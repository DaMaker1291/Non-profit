"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LEARN — the learner's OWN curriculum, with a status per topic.
//
// This page used to print the PLATFORM's concept count under the learner's own
// qualification, and read the flat `board` field that mirrors a learner's FIRST
// subject. Measured against the real courses those are different numbers:
// uk-alevel/a2 covers 43 of 67 maths concepts and uk-gcse/foundation 55 of 67,
// so an A2 learner was reading `place-value` and `addition` as A-Level work and
// a Foundation learner was reading completing-square and binomial under a
// Foundation heading.
//
// Three claims, each made where it can be checked:
//
//   THE LIST IS THE COURSE. It comes from `coverageOf(specForProfile(p, subject))`
//   — the course resolved WITH the subject — and the header cannot print the
//   platform's count as if it were the learner's. A course the learner has not
//   finished choosing lists nothing rather than everything.
//
//   THE TOPICS CARRY A STATUS. One band per topic, from the learner's own
//   answers, through the SAME function that bands a single concept. A second
//   threshold here would give one learner two words for the same 8 of 10.
//
//   WHAT IS OUTSIDE IS NAMED. Not deleted, and not presented as the syllabus:
//   the genome is larger than any qualification, and that is a feature.
//
// The evidence chips stay honest. A concept with no recorded answer says
// nothing at all about recall — not "0%", not "weak" — because a prior is not a
// measurement.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { use } from "react";
import { useI18n, useProfile } from "@/lib/client";
import { bySubject } from "@/lib/genome";
import { ctitle, cblurb } from "@/lib/content-i18n";
import { proofLabelKey, strongestProof } from "@/lib/proof";
import { coverageOf, courseGaps, specForProfile } from "@/lib/specifications";
import { dimensionFor } from "@/lib/evidence-view";
import { bandKey } from "@/components/dims";
import { fill } from "@/lib/i18n";
import type { SubjectId } from "@/lib/types";

export default function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: raw } = use(params);
  const { t, lang } = useI18n();
  const { state } = useProfile();
  const subject = (["maths", "physics", "chemistry", "biology", "computing"] as SubjectId[]).includes(raw as SubjectId)
    ? (raw as SubjectId)
    : "maths";
  const label = t(`subj.${subject}`);
  const p = state?.profile;

  // The WHOLE subject, as the genome defines it. This is the platform's list,
  // not the learner's course, so it is never the thing the header counts.
  const all = bySubject(subject);

  // What this learner's course still has not decided FOR THIS SUBJECT. A
  // learner who declared no subjects has nothing to configure, so the page
  // still lists the subject rather than refusing to render.
  const gaps = p ? courseGaps(p, subject) : [];

  // THE COURSE IN FORCE, resolved WITH the subject. Null until the course is
  // complete: a recommendation must never rest on a course nobody chose.
  const active = p && gaps.length === 0 ? specForProfile(p, subject) : null;
  const inCourse = active ? coverageOf(active).filter((c) => c.subject === subject) : null;
  const listed = inCourse ?? all;

  // "Measured" means the learner's own record holds at least one answer — never
  // a mastery threshold. Counting by the score would describe untouched
  // concepts as progress.
  const askedOf = (id: string) => state?.progress[id]?.attempts ?? 0;
  const correctOf = (id: string) => state?.progress[id]?.correct ?? 0;
  const touched = listed.filter((c) => askedOf(c.id) > 0).length;

  // What the course does NOT cover: computed, not assumed away, and never
  // deleted — it stays one link away on the same screen.
  const inIds = inCourse ? new Set(inCourse.map((c) => c.id)) : null;
  const outside = inIds ? all.filter((c) => !inIds.has(c.id)) : [];

  /** The right-hand side of a row: what this learner's record already supports.
   *  Returns [] for an untouched concept, which is the point — an empty cell
   *  claims nothing. */
  const stateChips = (id: string) => {
    const pr = state?.progress[id];
    const asked = askedOf(id);
    if (!pr || asked === 0) return [];
    // The chip is banded by the SAME rule every other surface uses, so this
    // row's word and a concept page's word can never disagree about one rate.
    const recalled = dimensionFor("recalled", t("evv.dim.recalled"), { asked, correct: correctOf(id) });
    const chips: { label: string; strong: boolean }[] = [
      { label: t("evv.dim.recalled"), strong: recalled.band === "strong" },
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

  const row = (c: (typeof all)[number]) => {
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

  // The two sentences about WHICH course is in force, and they are different
  // sentences: a course not yet finished is named as such, and a finished one
  // says how much of the subject it covers.
  const courseNote = p && gaps.length > 0
    ? t("curr.unmapped")
    : inCourse
      ? fill(t("cur.covers"), { n: String(inCourse.length), total: String(all.length) })
      : null;

  return (
    <main className="container page">
      <div className="page-head">
        <p className="eyebrow">
          {t("nav.subjects")} <span className="mono">{touched}/{listed.length}</span>
        </p>
        <h1>{label}</h1>
        <p className="lead" style={{ marginBottom: 0 }}>
          {listed.length} {t("map.concepts")} · <Link href={`/diagnostic/${subject}`}>{t("dash.diagnose")} →</Link>
        </p>
      </div>

      {/* Which course this is, in the learner's own terms. Nothing here is
          defaulted: an unresolved course shows the honest gap sentence. */}
      {active && (
        <p style={{ margin: "0 0 var(--s2)" }}>
          <span className="chip">{active.spec.name}</span>
          <span className="chip" style={{ marginInlineStart: 8 }}>{t(`lvl.${active.level.tier}`)}</span>
        </p>
      )}
      {courseNote && <p className="small muted" style={{ marginBottom: "var(--s3)" }}>{courseNote}</p>}

      {touched === 0 && listed.length > 0 && (
        <p className="small muted" style={{ marginBottom: 4 }}>{t("learn.notStarted")}</p>
      )}

      {/* One disclosure per topic. A topic's status is the learner's own answers
          in it, banded by the SAME rule a single concept uses, and an untouched
          topic is UNMEASURED rather than banded from a prior. */}
      {[0, 1, 2, 3, 4, 5].map((stage) => {
        const topic = { stage, concepts: listed.filter((c) => c.stage === stage) };
        if (!topic.concepts.length) return null;
        const a = topic.concepts.reduce((n, c) => n + askedOf(c.id), 0);
        const k = topic.concepts.reduce((n, c) => n + correctOf(c.id), 0);
        const d = dimensionFor("recalled", t(`stage.${stage}`), a > 0 ? { asked: a, correct: k } : null);
        return (
          <details key={topic.stage} className="topic" open={topic.concepts.some((c) => askedOf(c.id) > 0)}>
            <summary>
              <span className="roman">{stage}</span> · {t(`stage.${stage}`)}
              <span className="mono" style={{ marginInlineStart: 8 }}>
                {topic.concepts.filter((c) => askedOf(c.id) > 0).length}/{topic.concepts.length}
              </span>
              {d.rate ? (
                <span className={`chip ${d.band === "strong" ? "good" : ""}`} style={{ marginInlineStart: 8 }}>
                  {t(bandKey(d.band))} <span className="mono">{d.rate.correct}/{d.rate.asked}</span>
                </span>
              ) : (
                <span className="chip" style={{ marginInlineStart: 8 }}>{t("teach.unmeasured")}</span>
              )}
            </summary>
            <div>{topic.concepts.map(row)}</div>
          </details>
        );
      })}

      {/* Not in the course — named, counted, and still reachable. */}
      {outside.length > 0 && (
        <section>
          <div className="stage-label">
            {t("cur.outside")} <span className="mono">{outside.length}</span>
          </div>
          <p className="small muted">
            {fill(t("cur.outsideNote"), { n: String(outside.length), spec: active ? active.spec.name : "" })}
          </p>
          <div>{outside.map(row)}</div>
        </section>
      )}

      <div style={{ height: "var(--s4)" }} />
    </main>
  );
}
