"use client";

// ─────────────────────────────────────────────────────────────────────────────
// HELP — how OpenMind works, in one page, in the learner's own language.
//
// The sidebar has always had "Help" in the spec and never had a destination for
// it; a link to /about would have been a link to the wrong page (About explains
// the PROJECT: the licence, the genome, who built it — Help explains the
// PRODUCT: what to click and what will happen).
//
// Every sentence on this page is an existing i18n key, deliberately: this is the
// page a learner opens when they are already confused, and a page that answers
// in English on a Hindi tablet is a second confusion. The sections are the five
// questions a new learner actually asks — what do I do, what will it ask me,
// what does it know about me, how do I make it fit me, and does it work
// offline — and each one ends at the surface that does the thing, so reading
// Help is one tap away from doing rather than a dead end.
// ─────────────────────────────────────────────────────────────────────────────
import Link from "next/link";
import { useI18n } from "@/lib/client";

export default function Help() {
  const { t } = useI18n();

  // The loop, as steps, each on the surface that performs it. The order is the
  // product's own order (lib/next-engine): read it, practise it, prove it,
  // come back for it later.
  const steps: { n: string; title: string; body: string; href: string; cta: string }[] = [
    { n: "01", title: t("nav.learn"), body: t("home.feat.diagDesc"), href: "/learn", cta: t("nav.learn") },
    { n: "02", title: t("learn.practice"), body: t("home.feat.nextDesc"), href: "/learn", cta: t("next.ctaStart") },
    { n: "03", title: t("prog.title"), body: t("prog.sub"), href: "/progress", cta: t("prog.nav") },
    { n: "04", title: t("mm.yourKnowledge"), body: t("learn.provedBody"), href: "/mind", cta: t("mm.yourKnowledge") },
  ];

  const doors: { title: string; body: string; href: string; cta: string }[] = [
    { title: t("acc.title"), body: t("acc.lead"), href: "/access", cta: t("nav.accessTitle") },
    { title: t("off.eyebrow"), body: t("home.feat.offlineDesc"), href: "/offline", cta: t("nav.offlineTitle") },
    { title: t("about.privacyTitle"), body: t("about.privacyBody"), href: "/account", cta: t("acct.title") },
    { title: t("teach.title"), body: t("teach.sub"), href: "/teacher", cta: t("nav.teach") },
    { title: t("about.title"), body: t("about.mission"), href: "/about", cta: t("about.title") },
  ];

  return (
    <main className="container narrow page">
      <p className="eyebrow">{t("nav.help")}</p>
      <h1>{t("nav.help")}</h1>
      <p className="lead">{t("next.oneThing")}</p>

      <section className="card" style={{ marginTop: "var(--s3)" }}>
        <p className="eyebrow"><span className="no">→</span> {t("next.howTitle")}</p>
        <ol className="steps">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="step-no mono">{s.n}</span>
              <div>
                <strong>{s.title}</strong>
                <p className="small muted" style={{ margin: "4px 0 6px" }}>{s.body}</p>
                <Link href={s.href} className="small">{s.cta} →</Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="stack" style={{ marginTop: "var(--s2)" }}>
        {doors.map((d) => (
          <section key={d.href} className="card soft">
            <h2 className="h2" style={{ marginBottom: 6 }}>{d.title}</h2>
            <p className="small muted" style={{ margin: "0 0 10px" }}>{d.body}</p>
            <Link href={d.href} className="chip">{d.cta} →</Link>
          </section>
        ))}
      </div>

      <div className="actions" style={{ marginTop: "var(--s3)" }}>
        <Link href="/learn" className="btn">{t("home.start")} →</Link>
        <Link href="/dashboard" className="btn ghost">{t("nav.home")}</Link>
      </div>
    </main>
  );
}
