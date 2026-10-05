"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE LANDING PAGE: what this is, in one screen, with ONE primary action.
//
// §landing is explicit about the shape, and each part of it fixes a specific
// failure the page used to have:
//
//   · the header is the product's NAME and one sentence about it — not a
//     billboard headline. It used to claim "every student deserves a world-class
//     tutor", which is a promise no software can keep;
//   · exactly TWO doors, and they are different people: [Start learning] and
//     [I'm a teacher]. Six equally-weighted buttons is the same as none;
//   · the loop (Learn → Practise → Evidence → Next step) is drawn with the
//     product's own surface names, so what a visitor reads here is what they
//     will find in the navigation;
//   · five sections — Students, Teachers, Curricula, Offline, Languages — each
//     one linking to the surface that does the thing, so the page is a map
//     rather than a brochure.
//
// This pass adds the thing a page of claims cannot do: it SHOWS one. The
// centrepiece is a real decision, composed by the real engine over a real
// ledger (lib/example-decision.ts), with the record it was read from in the
// margin beside it and the answer that decided it named underneath. A reader who
// does not believe "every recommendation is traceable to a recorded answer"
// should not have to take it on faith, and a hand-written example would have
// gone stale the first time the engine changed its mind.
//
//   · the artifact is rendered only if the engine composed it. If the concept or
//     the decision were missing, the section is ABSENT rather than filled with a
//     plausible-looking card — a fabricated example is the one thing this page
//     may not do;
//   · every figure in the margin is read from the folded model, and the card's
//     four lines are the engine's own `next.*` keys, so the whole artifact is
//     translated everywhere the rest of the product is;
//   · the claims at the foot each carry where they were counted, because a
//     number on a marketing page that cannot be checked is decoration;
//   · the last thing on the page is what the product does NOT know yet, drawn as
//     an empty square. "Unknown ≠ zero" is the rule the whole product is built
//     on, so it belongs on the front page rather than in a footnote.
//
// Every number here is measured from the genome and the question bank at module
// load (concept counts and the deepest band the bank can serve per subject).
// There is no hardcoded claim that can go stale.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useAppState, useI18n } from "@/lib/client";
import { fill } from "@/lib/i18n";
import { bySubject } from "@/lib/genome";
import { bankDepth, hasGenerator } from "@/lib/questions";
import { difficultyBandFor } from "@/lib/question-bank";
import type { SubjectId } from "@/lib/types";

// Counts and depth come from the genome and the bank themselves — never a
// hardcoded number that can go stale as concepts are added (the maths tile once
// claimed 72 when there were 67).
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
 * A subject tile that says "18 concepts" tells a student nothing about whether
 * the work there is real. The deepest band the bank can serve for that subject
 * does — said on the row rather than discovered by a disappointed student.
 */
const SUBJECT_LEVEL: Record<string, { concepts: number; band: number }> = Object.fromEntries(
  SUBJECTS.map((s) => {
    const ids = bySubject(s.id).filter((c) => hasGenerator(c.id)).map((c) => c.id);
    return [s.id, { concepts: bySubject(s.id).length, band: difficultyBandFor(bankDepth(ids)) }];
  }),
);

/** The margin's four labels, by the fact they name. The figures come from the
 *  engine; the words for them are this page's, because a learner reads them out
 *  of context ("6 answers") and the engine's own labels are written to sit
 *  inside a composed sentence. */
export default function Home() {
  const { t, lang } = useI18n();
  const router = useRouter();
  // State-derived, not page-derived: someone who is part-way through setup gets
  // "continue where you left off", never the first-time pitch again.
  const { appState, ready } = useAppState();
  const resuming = ready && appState !== null && appState.stage !== "welcome";

  // A learner the system has already measured belongs on Home, not on the
  // marketing page — a state transition, never a conclusion drawn while the
  // session is still being probed (`ready` is false until then).
  useEffect(() => {
    if (ready && appState?.stage === "home") router.replace("/dashboard");
  }, [ready, appState, router]);

  // The loop the whole product implements, named with the product's own surface
  // names — so what a visitor reads here is what they will find in the nav.
  const loop = ["nav.learn", "learn.practice", "evv.theEvidence", "next.eyebrow"];

  /** The five sections. A visitor finds their own reason to be here in one of
   *  them, and each one is a link away from the surface that does the thing —
   *  so the page is a map rather than a brochure. Values are i18n KEYS, resolved
   *  through `t` at render, which is why this page is translated everywhere the
   *  rest of the product is. */
  const contents: { href: string; title: string; body: string; go: string }[] = [
    { href: "/onboarding", title: "home.secStudents", body: "home.feat.nextDesc", go: "home.start" },
    { href: "/teacher", title: "nav.teach", body: "teach.sub", go: "teach.title" },
    { href: "/curriculum", title: "nav.currTitle", body: "curr.sub", go: "nav.subjects" },
    { href: "/offline", title: "nav.offlineTitle", body: "home.feat.offlineDesc", go: "nav.offlineTitle" },
    { href: "/access", title: "nav.accessTitle", body: "acc.lead", go: "acc.title" },
  ];

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">◉</span> OpenMind</p>
      <h1>{t("home.tagline")}</h1>
      <p className="lead" style={{ fontSize: 17.5 }}>{t("home.sub")}</p>

      {/* Exactly two actions, and they are different people. The learner
          starts (or resumes); the teacher has their own platform. */}
      {resuming && appState ? (
        <div className="card soft" style={{ padding: "var(--s3)", margin: "var(--s3) 0 var(--s2)", maxWidth: 620 }}>
          <p className="eyebrow" style={{ marginBottom: 6 }}>{t("state.resume")}</p>
          <p style={{ margin: "0 0 var(--s2)" }}>{t(appState.reasonKey)}</p>
          <Link href={appState.route} className="btn">
            {appState.stage === "home" ? t("nav.home") : t("common.next")} →
          </Link>
        </div>
      ) : (
        <div className="actions" style={{ margin: "var(--s3) 0 10px" }}>
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

      {/* The loop the whole product implements, ruled across the page rather
          than boxed in a card: it is a line of the book, not a panel. */}
      <div className="loopband" aria-label={t("nav.how")}>
        {loop.map((key, i) => (
          <span key={key} style={{ display: "contents" }}>
            <span className="loop-step">{t(key)}</span>
            {i < loop.length - 1 && <span className="loop-arrow" aria-hidden="true">→</span>}
          </span>
        ))}
      </div>

      {/* The five sections. A visitor finds their own reason to be here in one
          of them, and each one is a link away from the surface that does it. */}
      <section style={{ marginBottom: "var(--s4)" }}>
        <h2 className="eyebrow">{t("home.whatDoes")}</h2>
        {contents.map((d) => (
          <Link key={d.href} href={d.href} className="content-row">
            <span className="grow">
              <b>{t(d.title)}</b>
              <span className="blurb">{t(d.body)}</span>
            </span>
            <span className="go">{t(d.go)} →</span>
          </Link>
        ))}
      </section>

      {/* What is taught, and how far the practice actually goes — measured
          from the genome and the bank, so the figures cannot go stale.

          This section used to be an engineering ledger titled "every claim on
          this page, and where it was counted": the five subjects, then three
          claims about the product each with its source, then a panel about what
          OpenMind had not measured about the reader. Every figure was true and
          every one was a receipt for the person who built the page — not for
          the learner reading it, who should be left thinking "it knows what I
          need", never "this system has an evidence ledger". The subject list
          stays because it is the one thing a visitor needs before starting
          (what can I study, and is the practice there real); a single honest
          sentence about unknown-not-zero stays because that rule is the product. */}
      <section>
        <h2 className="eyebrow">{t("home.subjects")}</h2>
        <div className="ledger">
          <div className="ledger-group">
            {SUBJECTS.map((s) => {
              const level = SUBJECT_LEVEL[s.id];
              return (
                <Link key={s.href} href={s.href} className="ledger-row" style={{ textDecoration: "none" }}>
                  <span className="ledger-k">{t(s.label)}</span>
                  {/* One text node, and a separator between the claim and its
                      figure: element boundaries have no whitespace in them, so
                      a screen reader announced this row as "Mathematics
                      67concepts" — a number glued to the noun it counts. */}
                  {" "}
                  <span className="ledger-v">{`${level.concepts} ${t("home.concepts")} · ${fill(t("home.practice"), { n: level.band })}`}</span>
                </Link>
              );
            })}
          </div>
        </div>
        {/* Unknown is not zero, ON THE FRONT PAGE. The last thing a visitor
            reads is the rule the whole engine is built on, drawn as an empty
            ruled square rather than a figure — so "we have not measured this"
            can never be mistaken for a zero. */}
        <p className="ledger-h" style={{ marginTop: "var(--s3)" }}>
          <span className="unmeasured" aria-hidden="true" />
          {t("home.notMeasured")}
        </p>
        <p className="ledger-note">{t("home.notMeasuredNote")}</p>
      </section>

      <p className="small muted" style={{ marginTop: "var(--s3)" }}>
        <Link href="/help">{t("nav.help")} →</Link>
        {" · "}<Link href="/about">{t("about.title")} →</Link>
      </p>
    </main>
  );
}
