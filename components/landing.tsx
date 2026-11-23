"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE FRONT PAGE'S RENDERER — the half that has to run in the browser.
//
// It was all one file, and that file imported the question bank to measure its
// own figures. The measurement is right (a number on a marketing page that cannot
// be checked is decoration) but it does not have to happen in the visitor's
// browser: importing the bank put ~553 KiB compressed of question templates into
// the FIRST DOWNLOAD of the landing page, and — because the page's modules were
// hoisted into the shared chunk — into every other route as well, including
// sign-up. A first-time visitor was downloading the practice bank before deciding
// whether to start practising.
//
// So the numbers are measured where they cost a visitor nothing: `app/page.tsx`
// is a server component now, it counts from the genome, the bank and the
// specification list, and it passes the counts down as plain props. This half
// owns what actually needs a browser — the copy, the links, the redirect for a
// learner who is already placed — and holds no curriculum data at all.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAppState, useI18n, useProfile } from "@/lib/client";
import { SUBJECT_LABELS } from "@/lib/subjects";
import type { SubjectId } from "@/lib/types";

/** How deep the practice goes, per subject, as measured by the server. */
export interface SubjectLevel {
  concepts: number;
  band: number;
}

export interface LandingProof {
  concepts: number;
  courses: number;
}

const SUBJECTS: { href: string; label: string; id: SubjectId }[] = [
  { href: "/learn/maths", label: "subj.maths", id: "maths" },
  { href: "/learn/physics", label: "subj.physics", id: "physics" },
  { href: "/learn/chemistry", label: "subj.chemistry", id: "chemistry" },
  { href: "/learn/biology", label: "subj.biology", id: "biology" },
  { href: "/learn/computing", label: "subj.computing", id: "computing" },
];

export function Landing({
  subjectLevel,
  bandMax,
  proof: measured,
}: {
  subjectLevel: Record<string, SubjectLevel>;
  bandMax: number;
  proof: LandingProof;
}) {
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

  /** THE PROOF STRIP. Three facts, each counted by the server rather than
   *  asserted here — the labels are the only part this half owns. */
  const proof = useMemo(
    () => [
      { n: String(measured.concepts), label: t("home.concepts") },
      { n: String(SUBJECTS.length), label: t("nav.subjects") },
      { n: String(measured.courses), label: t("curr.course") },
    ],
    [t, measured.concepts, measured.courses],
  );

  return (
    <main className="container page">
      <div className="hero">
        <div className="hero-copy">
        <p className="eyebrow"><span className="no">◉</span> OpenMind</p>
        <h1>{t("home.tagline")}</h1>
        <p className="lead">{t("home.sub")}</p>

        {/* One primary action per audience, and they are different people: the
            learner starts (or resumes), the teacher has their own platform. */}
        {resuming && appState ? (
          <div className="actions hero-actions">
            <Link href={appState.route} className="btn">
              {appState.stage === "home" ? (lifecycle.isTeacher ? t("teach.title") : t("nav.home")) : t("common.next")} →
            </Link>
          </div>
        ) : (
          <div className="actions hero-actions">
            <Link href="/onboarding" className="btn">
              {t("home.start")} →
            </Link>
            <Link href="/teacher" className="btn ghost">
              {t("home.teacherCta")}
            </Link>
          </div>
        )}
        <p className="small muted">
          {t("home.haveProfile")} <Link href="/dashboard">{t("home.goDash")} →</Link>
          {" · "}<Link href="/onboarding?mode=signin">{t("onb.signIn")}</Link>
        </p>
        </div>

        {/* THE METHOD, BESIDE THE PROMISE rather than three screens below it.
            A visitor's first question is "what actually happens if I start?",
            and the four steps are the honest answer: read, practise, collect
            evidence, get the next step. It used to be a band under the proof
            strip, where it was read after the pricing-shaped numbers and before
            a wall of cards. Same keys, same order — only the position changed. */}
        <aside className="hero-panel" aria-label={t("nav.how")}>
          <p className="eyebrow flush">{t("nav.how")}</p>
          <ol className="loopband">
            {loop.map((key, i) => (
              <li key={key} className="loop-step">
                <span className="loop-n" aria-hidden="true">{i + 1}</span>
                {t(key)}
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {/* THE PROOF STRIP. A visitor's first question is "is this real?", and the
          answer is numbers nobody typed in: the ideas in the map, the subjects
          they are taught as, and the qualifications mapped against them. */}
      <dl className="proof-strip">
        {proof.map((f) => (
          <div key={f.label}>
            <dt>{f.n}</dt>
            <dd>{f.label}</dd>
          </div>
        ))}
      </dl>

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
              const level = subjectLevel[s.id] ?? { concepts: 0, band: 0 };
              return (
                <tr key={s.id}>
                  <th scope="row"><Link href={s.href}>{t(SUBJECT_LABELS[s.id] ?? s.label)}</Link></th>
                  <td className="num">{level.concepts}</td>
                  {/* "3 / 5", not "Practice available to level 3 of 5" five
                      times: the sentence form put the same clause on every
                      line and read as a disclaimer rather than a fact. */}
                  <td className="num">{level.band} / {bandMax}</td>
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
