"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n, useProfile } from "@/lib/client";
import { ancestorsOf, bySubject, getConcept, STAGE_NAMES } from "@/lib/genome";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { ctitle, cblurb } from "@/lib/content-i18n";
import type { SubjectId } from "@/lib/types";

export default function GenomeMap() {
  const { t, lang } = useI18n();
  const { state } = useProfile();
  const [subject, setSubject] = useState<SubjectId>("maths");
  const [selected, setSelected] = useState<string | null>(null);

  const concepts = useMemo(() => bySubject(subject), [subject]);
  const sel = useMemo(() => (selected ? getConcept(selected) : null), [selected]);
  const chain = useMemo(() => (selected ? ancestorsOf(selected) : []), [selected]);
  const mastery = (cid: string) => state?.progress[cid]?.mastery ?? 0;

  return (
    <main className="container" style={{ paddingTop: 36 }}>
      <p className="eyebrow"><span className="no">🧬</span> {t("map.title")}</p>
      <h1 className="visually-small">{t("map.title")}</h1>
      <p className="lead">{t("map.sub")}</p>

      <div className="checks" style={{ margin: "18px 0 8px" }}>
        {SUBJECT_IDS.map((s) => (
          <label key={s} className={subject === s ? "on" : ""}>
            <input
              type="radio"
              name="map-subject"
              checked={subject === s}
              onChange={() => { setSubject(s); setSelected(null); }}
            />
            {t(`subj.${s}`)}
          </label>
        ))}
      </div>

      {sel && (
        <div className="card" style={{ margin: "16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, alignItems: "baseline" }}>
            <h2 className="h2" style={{ margin: 0 }}>{ctitle(lang, sel.id)}</h2>
            <span style={{ display: "flex", gap: 8 }}>
              {/* What we know about this concept, before the lesson itself: the
                  map answers where a concept sits, the Mind page answers what
                  it has measured. */}
              <Link className="btn small ghost" href={`/mind/${sel.id}`}>{t("evv.basedOn")} →</Link>
              <Link className="btn small" href={`/learn/${sel.subject}/${sel.id}`}>{t("learn.lesson")} →</Link>
            </span>
          </div>
          <p className="muted" style={{ margin: "8px 0 4px" }}>{cblurb(lang, sel.id)}</p>
          <p className="small" style={{ margin: "0 0 10px" }}>{sel.lesson}</p>
          <p className="small" style={{ margin: 0 }}>
            <b>{t("common.prereqs")}:</b>{" "}
            {sel.prereqs.length
              ? sel.prereqs.map((p, i) => (
                  <span key={p}>
                    {i > 0 && " · "}
                    <button className="chip" onClick={() => setSelected(p)} style={{ cursor: "pointer" }}>
                      {ctitle(lang, p)}
                    </button>
                  </span>
                ))
              : t("map.root")}
            {chain.length > 0 && <> · <span className="mono">{chain.length}</span> {t("map.deep")}</>}
          </p>
        </div>
      )}

      {[0, 1, 2, 3, 4, 5].map((stage) => {
        const band = concepts.filter((c) => c.stage === stage);
        if (!band.length) return null;
        return (
          <section key={stage}>
            <div className="stage-label">
              <span className="roman">{stage}</span> · {t(STAGE_NAMES[stage as keyof typeof STAGE_NAMES])}
              <span className="muted" style={{ letterSpacing: 0 }}> — {band.length} {t("map.concepts")}</span>
            </div>
            <div className="genome-row">
              {band.map((c) => {
                const m = mastery(c.id);
                const cls = m >= 0.85 ? "strong" : m > 0.2 ? "weak" : "";
                const isPre = sel ? chain.includes(c.id) || sel.prereqs.includes(c.id) : false;
                return (
                  <button
                    key={c.id}
                    className={`node ${cls}`}
                    onClick={() => setSelected(c.id)}
                    style={isPre ? { borderColor: "var(--margin-red)" } : undefined}
                  >
                    {ctitle(lang, c.id)}
                    <span className="sub">
                      {c.prereqs.length === 0
                        ? t("map.root")
                        : `${c.prereqs.length} ${t("common.prereqs").toLowerCase()}`}
                      {m > 0.2 ? ` · ${Math.round(m * 100)}%` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      <div style={{ height: 40 }} />
    </main>
  );
}
