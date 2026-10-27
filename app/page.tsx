"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE FRONT PAGE: what this is, who it is for, and one way in.
//
// The shape follows what a UK department actually looks for before they will put
// a product in front of a class — a statement of what it is, evidence that the
// practice is real, what the syllabus coverage is, and what teachers get — in
// that order, on one page, with no more than one primary action per audience.
//
// What it used to be: a visitor's first screen carried the LEARNER's shell (Home,
// My evidence, Your knowledge, a subject list they had never chosen), a
// "Continue where you left off" card whose only content was "your course and
// subjects are not set yet", and a panel headed "About you: not measured" with an
// empty square in it. Every one of those was true and every one of them told a
// stranger they had arrived in the middle of somebody else's account.
//
// Three rules hold this page:
//
//   · ONE PRIMARY ACTION PER AUDIENCE. A learner presses Start; a teacher presses
//     the secondary door beside it. Nothing else on the page is a filled button.
//   · EVERY FIGURE IS MEASURED, at module load, from the genome, the question
//     bank and the specification list — never typed in. A number on a marketing
//     page that cannot be checked is decoration.
//   · A LEARNER WHO IS ALREADY PLACED NEVER SEES IT. The state machine redirects
//     them to their own home; this page is for people who are not in yet.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAppState, useI18n, useProfile } from "@/lib/client";
import { CONCEPTS, bySubject } from "@/lib/genome";
import { SPECIFICATIONS } from "@/lib/specifications";
import { bankDepth, hasGenerator } from "@/lib/questions";
import { difficultyBandFor } from "@/lib/question-bank";
import type { SubjectId } from "@/lib/types";

const SUBJECTS: { href: string; label: string; id: SubjectId }[] = [
  { href: "/learn/maths", label: "subj.maths", id: "maths" },
  { href: "/learn/physics", label: "subj.physics", id: "physics" },
  { href: "/learn/chemistry", label: "subj.chemistry", id: "chemistry" },
  { href: "/learn/biology", label: "subj.biology", id: "biology" },
  { href: "/learn/computing", label: "subj.computing", id: "computing" },
];

/**
 * How deep the practice actually goes, per subject, measured from the bank.
 *
 * A subject row that says "18 concepts" tells a student nothing about whether
 * the work there is real. The deepest band the bank can serve for that subject
 * does — said on the row rather than discovered by a disappointed student.
 */
const SUBJECT_LEVEL: Record<string, { concepts: number; band: number }> = Object.fromEntries(
  SUBJECTS.map((s) => {
    const ids = bySubject(s.id).filter((c) => hasGenerator(c.id)).map((c) => c.id);
    return [s.id, { concepts: bySubject(s.id).length, band: difficultyBandFor(bankDepth(ids)) }];
  }),
);

/** The top of the depth scale, measured from the bank rather than typed in — the
 *  table says "3 / 5" because five is the deepest band any subject reaches. */
const BAND_MAX = difficultyBandFor(
  bankDepth(CONCEPTS.filter((c) => hasGenerator(c.id)).map((c) => c.id)),
);

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const { appState, ready, lifecycle } = useAppState();
  // WHOSE PAGE THIS IS. A visitor has no record, so there is nothing to resume
  // and no course to name. `appState.stage !== "welcome"` alone was not enough:
  // a first-time visitor's stage is "onboarding" (the product knows what the
  // NEXT step is), so the page greeted them with "Continue where you left off"
  // over a setup they had not started.
  const { state } = useProfile();
  const resuming = ready && appState !== null && appState.stage !== "welcome" && Boolean(state?.profile);

  // Somebody the system has already placed belongs on their own home, not on the
  // marketing page. `appState.route`, NOT a hardcoded "/dashboard": a teacher's
  // home is their class list (lib/app-state.ts#homeRouteFor).
  useEffect(() => {
    if (ready && appState?.stage === "home") router.replace(appState.route);
  }, [ready, appState, router]);

  // The loop the product implements, named with the product's own surface names,
  // so what a visitor reads here is what they find in the navigation.
  const loop = ["nav.learn", "learn.practice", "evv.theEvidence", "next.eyebrow"];

  /** The five things the product does, each one a link to the surface that does
   *  it — so the page is a map rather than a brochure. Values are i18n KEYS. */
  const contents: { href: string; title: string; body: string; go: string }[] = [
    { href: "/onboarding", title: "home.secStudents", body: "home.feat.nextDesc", go: "home.start" },
    { href: "/teacher", title: "nav.teach", body: "teach.sub", go: "teach.title" },
    { href: "/curriculum", title: "nav.currTitle", body: "curr.sub", go: "nav.subjects" },
    { href: "/offline", title: "nav.offlineTitle", body: "home.feat.offlineDesc", go: "nav.offlineTitle" },
    { href: "/access", title: "nav.accessTitle", body: "acc.lead", go: "acc.title" },
  ];

  /** THE PROOF STRIP. Four facts, each counted here rather than asserted. */
  const proof = useMemo(
    () => [
      { n: String(CONCEPTS.length), label: t("home.concepts") },
      { n: String(SUBJECTS.length), label: t("nav.subjects") },
      { n: String(SPECIFICATIONS.length), label: t("curr.course") },
    ],
    [t],
  );

  return (
    <main className="container page">
      <div className="hero">
        <p className="eyebrow"><span className="no">◉</span> OpenMind</p>
        <h1>{t("home.tagline")}</h1>
        <p className="lead">{t("home.sub")}</p>

        {/* One primary action per audience, and they are different people: the
            learner starts (or resumes), the teacher has their own platform. */}
        {resuming && appState ? (
          <div className="actions">
            <Link href={appState.route} className="btn">
              {appState.stage === "home" ? (lifecycle.isTeacher ? t("teach.title") : t("nav.home")) : t("common.next")} →
            </Link>
          </div>
        ) : (
          <div className="actions">
            <Link href="/onboarding" className="btn" style={{ fontSize: 17, padding: "14px 26px" }}>
              {t("home.start")} →
            </Link>
            <Link href="/teacher" className="btn ghost" style={{ fontSize: 17, padding: "14px 26px" }}>
              {t("home.teacherCta")}
            </Link>
          </div>
        )}
        <p className="small muted">
          {t("home.haveProfile")} <Link href="/dashboard">{t("home.goDash")} →</Link>
          {" · "}<Link href="/onboarding?mode=signin">{t("onb.signIn")}</Link>
        </p>
      </div>

      {/* THE PROOF STRIP. A visitor's first question is "is this real?", and the
          answer is four numbers nobody typed in: the ideas in the map, the
          subjects they are taught as, the qualifications mapped against them,
          and the languages the product speaks. */}
      <dl className="proof-strip">
        {proof.map((f) => (
          <div key={f.label}>
            <dt>{f.n}</dt>
            <dd>{f.label}</dd>
          </div>
        ))}
      </dl>

      {/* HOW IT WORKS. The loop, in the product's own words — and now drawn as
          steps rather than a run of text, which is what it was: `.loop-step` was
          only ever styled underneath `.loop`, and this band is `.loopband`, so
          four steps rendered as four plain words with arrows between them. */}
      <section className="section-block">
        <h2 className="eyebrow">{t("nav.how")}</h2>
        <ol className="loopband">
          {loop.map((key, i) => (
            <li key={key} className="loop-step">
              <span className="loop-n" aria-hidden="true">{i + 1}</span>
              {t(key)}
            </li>
          ))}
        </ol>
      </section>

      {/* WHAT YOU GET, as five cards rather than five rows: a visitor should be
          able to find their own reason to be here at a glance. */}
      <section className="section-block">
        <h2 className="eyebrow">{t("home.whatDoes")}</h2>
        <div className="grid front-grid">
          {contents.map((d) => (
            <Link key={d.href} href={d.href} className="card feature-card">
              <b>{t(d.title)}</b>
              <span className="blurb">{t(d.body)}</span>
              <span className="go">{t(d.go)} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* WHAT IS TAUGHT, and how far the practice goes, in a table — the form a
          school reads numbers in. Both columns are measured from the genome and
          the bank, so neither can go stale. */}
      <section className="section-block">
        <h2 className="eyebrow">{t("home.subjects")}</h2>
        <table className="coverage">
          <thead>
            <tr>
              <th scope="col"><span className="visually-hidden">{t("nav.subjects")}</span></th>
              <th scope="col">{t("home.concepts")}</th>
              <th scope="col">{t("curr.depth")}</th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((s) => {
              const level = SUBJECT_LEVEL[s.id];
              return (
                <tr key={s.id}>
                  <th scope="row"><Link href={s.href}>{t(s.label)}</Link></th>
                  <td className="num">{level.concepts}</td>
                  {/* "3 / 5", not "Practice available to level 3 of 5" five
                      times: the sentence form put the same clause on every
                      line and read as a disclaimer rather than a fact. */}
                  <td className="num">{level.band} / {BAND_MAX}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* UNKNOWN IS NOT ZERO, ON THE FRONT PAGE. The last thing a visitor reads
          before the small print is the rule the whole engine is built on, drawn
          as an empty ruled square rather than a figure — so "we have not
          measured this" can never be read as a zero. It is the one square on the
          page with no number in it, deliberately: a visitor has answered
          nothing, and this page must not imply otherwise. */}
      <section className="section-block">
        <p className="ledger-h">
          <span className="unmeasured" aria-hidden="true" />
          {t("home.notMeasured")}
        </p>
        <p className="ledger-note">{t("home.notMeasuredNote")}</p>
      </section>

      <p className="small muted">
        <Link href="/help">{t("nav.help")} →</Link>
        {" · "}<Link href="/about">{t("about.title")} →</Link>
      </p>
    </main>
  );
}
