"use client";

import Link from "next/link";
import { useI18n } from "@/lib/client";
import SpeakButton from "@/components/speak-button";
// Every number on this page comes from the code that makes it true, never from
// a literal. It used to be `{CONCEPTS.length} ... {MISCONCEPTIONS.length} ... 5
// subjects ... {LANGS.length}` with the count stripped out of a translated
// phrase — so the subject count was a typed `5` and `home.languages` carried a
// hardcoded 15 in all fifteen dictionaries. lib/claims.ts is now the one owner
// of both, and this page reads it like any other surface.
import { CLAIM_COUNTS, claim } from "@/lib/claims";
import WorkedExample from "@/components/worked-example";

export default function About() {
  const { t, lang } = useI18n();
  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow">{t("about.title")}</p>
      <h1>{t("about.title")}</h1>
      <p className="lead" style={{ fontSize: 17.5 }}>
        {t("about.mission")}
        <SpeakButton text={t("about.mission")} />
      </p>

      <div className="grid cols2" style={{ marginTop: 24 }}>
        <div className="card">
          <p className="eyebrow"><span className="no">🌍</span> {t("about.chapters").split(":")[0]}</p>
          <p className="muted small" style={{ margin: 0 }}>
            {t("about.chaptersBody")}
          </p>
        </div>
        <div className="card">
          <p className="eyebrow"><span className="no">🤝</span> {t("about.contributeTitle")}</p>
          <p className="muted small" style={{ margin: 0 }}>
            {t("about.contribute")}
          </p>
        </div>
        <div className="card">
          <p className="eyebrow"><span className="no">⚖</span> {t("about.licenseTitle")}</p>
          <p className="muted small" style={{ margin: 0 }}>{t("about.license")}</p>
        </div>
        <div className="card">
          <p className="eyebrow"><span className="no">🔒</span> {t("about.privacyTitle")}</p>
          <p className="muted small" style={{ margin: 0 }}>
            {t("about.privacyBody")}
          </p>
        </div>
      </div>


      {/* The evidence for the claim above, for a reader who wants to check it
          rather than believe it: one decision composed by the real engine over
          a real ledger. It was on the landing page until the repair — there it
          read as telemetry about a real student. A visitor is not asking for
          our sample record, so it belongs on the page a reviewer opens. */}
      <div className="card soft" style={{ marginTop: 20 }}>
        <p className="eyebrow"><span className="no">🔍</span> {t("home.worked")}</p>
        <div style={{ marginTop: 12 }}>
          <WorkedExample />
        </div>
        <p className="ledger-note">{t("home.workedNote")}</p>
      </div>

      <div className="card soft" style={{ marginTop: 20, marginBottom: 40 }}>
        <p className="eyebrow"><span className="no">🧬</span> {t("about.genomeTitle")}</p>
        <p className="muted small" style={{ margin: 0 }}>
          {t("about.genomeBody")}
        </p>
        <p className="mono small" style={{ margin: "12px 0 0", color: "var(--pencil)" }}>
          {CLAIM_COUNTS.concepts} {t("map.concepts")} · {CLAIM_COUNTS.misconceptions} {t("learn.misconceptions").toLowerCase()} · {CLAIM_COUNTS.subjects} {t("nav.subjects").toLowerCase()} · {claim("home.languages", lang)}
        </p>
        <Link href="/genome" className="btn small" style={{ marginTop: 14 }}>{t("home.cta2")} →</Link>
      </div>
    </main>
  );
}
