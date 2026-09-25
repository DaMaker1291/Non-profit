"use client";

import Link from "next/link";
import { useI18n } from "@/lib/client";
import SpeakButton from "@/components/speak-button";
import { CONCEPTS } from "@/lib/genome";
import { MISCONCEPTIONS } from "@/lib/misconceptions";
import { LANGS } from "@/lib/i18n";

export default function About() {
  const { t } = useI18n();
  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">§</span> {t("about.title")}</p>
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

      <div className="card soft" style={{ marginTop: 20, marginBottom: 40 }}>
        <p className="eyebrow"><span className="no">🧬</span> {t("about.genomeTitle")}</p>
        <p className="muted small" style={{ margin: 0 }}>
          {t("about.genomeBody")}
        </p>
        <p className="mono small" style={{ margin: "12px 0 0", color: "var(--pencil)" }}>
          {CONCEPTS.length} {t("map.concepts")} · {MISCONCEPTIONS.length} {t("learn.misconceptions").toLowerCase()} · 5 {t("nav.subjects").toLowerCase()} · {LANGS.length} {t("home.languages").replace(/^\D*\d+\S*\s*/, "")}
        </p>
        <Link href="/genome" className="btn small" style={{ marginTop: 14 }}>{t("home.cta2")} →</Link>
      </div>
    </main>
  );
}
