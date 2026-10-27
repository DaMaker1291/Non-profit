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
import { proofLabelKey } from "@/lib/proof";
import { conceptStanding, demonstratedLabelKey } from "@/lib/learner-model";
import { decideOne, decisionContextFrom } from "@/lib/decision";
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

  // WHICH IDEA "YOU ARE HERE" IS — not the first row, and not a guess. It is the
  // concept the ONE decision door points at, so this list and the card on Home
  // cannot name two different next actions. The ledger is not loaded on this
  // screen, so the decision's BASIS is `unknown`; the CHOICE of work never
  // depends on it (lib/decision#decisionContextFrom).
  const currentId = state
    ? decideOne(decisionContextFrom(state, null), { tt: t, title: (id) => ctitle(lang, id) })?.conceptId ?? null
    : null;

  /** One row of the syllabus. EVERY fact in it comes from
   *  lib/learner-model#conceptStanding — the same function the published static
   *  page asks. This row used to band a concept with its own accuracy ratio
   *  while the static list used the shared proof vocabulary, so one learner's
   *  record produced two different words for one idea depending on the product.
   *
   *  The marker is the ONE glyph a list can afford: ✓ finished (as the ENGINE
   *  means it), ◐ underway, ○ nothing measured. An unmeasured concept is ○, and
   *  says "not yet measured" — never "0%" and never "weak": a prior is not a
   *  measurement. */
  const row = (c: (typeof all)[number]) => {
    const s = state ? conceptStanding(state, c.id) : null;
    const pr = state?.progress[c.id];
    const mark = s?.mark === "done" ? "✓" : s?.mark === "underway" ? "◐" : "○";
    const here = !!s && currentId === c.id;
    return (
      <Link key={c.id} href={`/learn/${subject}/${c.id}`} className="concept-row">
        <span className="grow">
          <b>
            <span className="mark" aria-hidden="true" style={{ fontFamily: "var(--mono)", marginInlineEnd: 6 }}>{mark}</span>
            {ctitle(lang, c.id)}
          </b>
          {!s?.proved && !here && <span className="blurb">{cblurb(lang, c.id)}</span>}
          {here && s && (s.pending.length > 0 || s.blockedBy.length > 0) && (
            <span className="standing" style={{ display: "block", marginTop: 4 }}>
              {/* ONE RUNG, NOT FOUR. This row used to carry the whole proof
                  breakdown — "You have demonstrated: Recall, Application" and
                  "You haven't yet demonstrated: Transfer, Long-term retention"
                  — which is four chips of a card's worth of detail inside one
                  line of a fifty-five-row index, and it repeated what the row's
                  own proof chip already says about what IS known. What the row
                  adds is the ONE rung the next session is aimed at; the rest is
                  on Home, where it belongs. */}
              {s.pending.length > 0 && (
                <span className="small">
                  <span className="muted">{t("next.notYetDemonstrated")}</span>{" "}
                  <span className="chip on" style={{ marginInlineStart: 6 }}>
                    △ {t(demonstratedLabelKey(s.pending[0]))}
                  </span>
                </span>
              )}
              {s.blockedBy.length > 0 && (
                <span style={{ display: "block", marginTop: 4 }} className="small muted">
                  {t("common.prereqs")} {s.blockedBy.map((id) => ctitle(lang, id)).join(" · ")} — {t("path.prerequisite")}
                </span>
              )}
            </span>
          )}
        </span>
        {/* THE CELL SAYS SOMETHING, OR NOTHING. Every row used to carry a grey
            "Not yet measured" pill, so 55 identical pills were the loudest thing
            on the page and none of them told a learner anything the row's own ○
            did not. A row now reports only when the record has something to
            report: the strongest proof it has, and the answers behind it. */}
        {(s?.proved || (pr && pr.attempts > 0)) && (
          <span className="concept-state">
            {s?.proved && (
              <span className={`chip ${s.proved !== "supported" ? "good" : ""}`}>{t(proofLabelKey(s.proved))}</span>
            )}
            {pr && pr.attempts > 0 && (
              <span className="mono small muted">{pr.correct}/{pr.attempts}</span>
            )}
          </span>
        )}
        {/* NO PER-ROW ARROW. Every row IS a link, and 55 identical "→" down the
            right edge is a column of decoration that says the same thing 55
            times — the pointer and the full-row target already say it. */}
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
        <p className="eyebrow">{t("nav.subjects")}</p>
        {/* THE PAGE'S ONE ACTION SITS BESIDE ITS TITLE, not at the far end of a
            wrap-around row. It was the second child of the summary below, with
            the summary pushed apart by `space-between`, so on a 1440px screen
            "Start: Negative numbers" floated ~870px to the right of the count it
            belongs to, alone against the margin. A page action belongs on the
            title's line; the counts belong under it. */}
        <div className="page-title-row">
          <h1>{label}</h1>
          {currentId && (
            <Link href={`/learn/${subject}/${currentId}`} className="btn subject-next">
              {t("next.start")}: {ctitle(lang, currentId)} →
            </Link>
          )}
        </div>
        {/* WHAT THE LIST ADDS UP TO, before the list: how much of the course has
            been measured. Without this the page opened with 55 rows of identical
            "not yet measured" and no answer to "so what should I do?". */}
        <div className="subject-summary">
          <div>
            {/* ONE FRACTION, ONE FIGURE. `8` and `/ 55` were two text runs in
                two sizes, which reads as a number followed by punctuation; the
                pair is set as a single figure and the noun is the caption. */}
            <p className="subject-count">
              <span className="num">{touched}/{listed.length}</span>{" "}
              <span className="muted">{t("map.concepts")}</span>
            </p>
            <div className="coverage-bar" role="img" aria-label={`${touched} / ${listed.length} ${t("map.concepts")}`}>
              <span style={{ width: `${listed.length ? Math.round((touched / listed.length) * 100) : 0}%` }} />
            </div>
            {/* The count is ALREADY above the bar — this line used to repeat it
                ("55 concepts · Take a diagnostic →"), so the same number was
                printed twice in three lines and neither copy was the one the
                learner could act on. It carries the action only. */}
            <p className="small muted" style={{ margin: "8px 0 0" }}>
              <Link href={`/diagnostic/${subject}`}>{t("dash.diagnose")} →</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Which course this is, in the learner's own terms, and how much of this
          list it covers — ONE line, because they are one fact: the qualification
          and its extent. Two paragraphs here stacked three lines of metadata
          between the header and the first concept. Nothing is defaulted: an
          unresolved course shows the honest gap sentence instead. */}
      {(active || courseNote) && (
        <p className="subject-course-line">
          {active && (
            <>
              <span className="chip">{active.spec.name}</span>
              <span className="chip" style={{ marginInlineStart: 8 }}>{t(`lvl.${active.level.tier}`)}</span>
            </>
          )}
          {courseNote && <span className="small muted">{courseNote}</span>}
        </p>
      )}

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
              {/* A bare `1/2` beside a stage name reads as a score. The band
                  chip below already carries the same numbers with the word for
                  what they mean, so the fraction is dropped rather than
                  repeated without one. */}
              {d.rate && (
                <span className={`chip ${d.band === "strong" ? "good" : ""}`} style={{ marginInlineStart: 8 }}>
                  {t(bandKey(d.band))} <span className="mono">{d.rate.correct}/{d.rate.asked}</span>
                </span>
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
