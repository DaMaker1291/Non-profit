"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppState, useI18n } from "@/lib/client";
import { fill, LANGS } from "@/lib/i18n";
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
 * does: maths reaches the interpreting band (where the answer has to be read out
 * of a table or a model), and the sciences currently top out at application and
 * multi-step — said on the tile rather than discovered by a disappointed
 * student. Computed once at module load; the sweep is deterministic.
 */
const SUBJECT_LEVEL: Record<string, { concepts: number; band: number }> = Object.fromEntries(
  SUBJECTS.map((s) => {
    const ids = bySubject(s.id).filter((c) => hasGenerator(c.id)).map((c) => c.id);
    return [s.id, { concepts: bySubject(s.id).length, band: difficultyBandFor(bankDepth(ids)) }];
  }),
);

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  // State-derived, not page-derived: someone who is part-way through setup gets
  // "continue where you left off", never the first-time pitch again.
  const { appState, ready } = useAppState();
  const resuming = ready && appState !== null && appState.stage !== "welcome";

  // A learner the system has already measured belongs on Home, not on the
  // marketing page — and this is a state transition, never a conclusion drawn
  // while the session is still being probed (`ready` is false until then).
  useEffect(() => {
    if (ready && appState?.stage === "home") router.replace("/dashboard");
  }, [ready, appState, router]);

  const steps = [
    { n: "01", title: t("home.feat.diag"), body: t("home.feat.diagDesc") },
    { n: "02", title: t("home.feat.next"), body: t("home.feat.nextDesc") },
    { n: "03", title: t("home.feat.offline"), body: t("home.feat.offlineDesc") },
    { n: "04", title: t("home.feat.voice"), body: t("home.feat.voiceDesc") },
  ];

  return (
    <main>
      <div className="container" style={{ paddingTop: 48, maxWidth: 640 }}>
        <section className="hero" style={{ textAlign: "center", padding: "24px 0 8px" }}>
          <p className="eyebrow" style={{ justifyContent: "center" }}><span className="no">◉</span> OpenMind</p>
          <h1 style={{ fontSize: 44, margin: "14px 0 10px", letterSpacing: "-0.02em" }}>
            {t("home.h1")} <em>{t("home.h1em")}</em>{t("home.h1b")}
          </h1>
          <p className="lead" style={{ fontSize: 18, maxWidth: 520, margin: "0 auto" }}>
            {t("home.lead")}
          </p>
          {/* One quiet interface selector on the marketing page only. The
              four-panel language configuration is not Home's job — it lives on
              /access with the rest of the settings. */}
          <label className="field" style={{ maxWidth: 240, margin: "20px auto 0" }}>
            <span>{t("lq.interface")}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.native}</option>)}
            </select>
          </label>

          {resuming && appState ? (
            <div className="card soft" style={{ padding: 20, margin: "36px 0 20px", textAlign: "left" }}>
              <p className="eyebrow" style={{ marginBottom: 6 }}>{t("state.resume")}</p>
              <p style={{ margin: "0 0 12px" }}>{t(appState.reasonKey)}</p>
              <Link href={appState.route} className="btn" style={{ fontSize: 18, padding: "16px 24px" }}>
                {appState.stage === "home" ? t("nav.home") : t("common.next")} →
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "36px 0 18px" }}>
              <Link href="/onboarding" className="btn" style={{ fontSize: 17, padding: "18px 22px", minHeight: 68 }}>
                {t("home.studentCta")}
                <span className="small" style={{ display: "block", opacity: 0.85, fontWeight: 400 }}>{t("home.studentSub")}</span>
              </Link>
              <Link href="/onboarding?mode=signin" className="btn ghost" style={{ fontSize: 17, padding: "18px 22px", minHeight: 68 }}>
                {t("onb.signIn")}
                <span className="small" style={{ display: "block", opacity: 0.85, fontWeight: 400 }}>{t("state.signInSub")}</span>
              </Link>
            </div>
          )}

          <p className="small muted" style={{ marginBottom: 4 }}>
            {t("home.haveProfile")} <Link href="/dashboard">{t("home.goDash")} →</Link>
          </p>
          <p className="small muted">
            <Link href="/teacher">{t("home.teacherCta")}</Link> — {t("home.teacherSub")}
          </p>
        </section>

        <section className="card soft" style={{ padding: 26, marginBottom: 26 }}>
          <p className="eyebrow"><span className="no">§</span> {t("home.whatDoes")}</p>
          <ol className="steps" style={{ marginTop: 14 }}>
            {steps.map((s) => (
              <li key={s.n}>
                <span className="step-no mono">{s.n}</span>
                <div>
                  <strong>{s.title}</strong>
                  <p className="small muted" style={{ margin: "4px 0 0" }}>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="card soft" style={{ padding: 26, marginBottom: 48 }}>
          <p className="eyebrow"><span className="no">§</span> {t("home.subjects")}</p>
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {SUBJECTS.map((s) => {
              const level = SUBJECT_LEVEL[s.id];
              return (
                <Link key={s.href} href={s.href} className="node" style={{ fontSize: 16, padding: "14px 18px", minHeight: 52 }}>
                  <b>{t(s.label)}</b>
                  {/* Where the content really stops, measured from the bank: a
                      student reading "18 concepts" has no way to know the work
                      tops out at application level, and should not have to find
                      out by choosing the subject and running out of road. */}
                  <span className="sub">
                    {level.concepts} {t("home.concepts")} · {fill(t("home.practice"), { n: level.band })}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
