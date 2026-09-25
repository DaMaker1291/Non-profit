"use client";

// Projects (§projects): the engine that turns strong knowledge into building.
// Local-first: templates link to real genome concepts; progress stays on device.
import Link from "next/link";
import { useEffect, useState } from "react";
import { getConcept } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { useI18n } from "@/lib/client";

interface Template { id: string; icon: string; title: string; concepts: string[]; steps: string[] }

const TEMPLATES: Template[] = [
  {
    id: "market-stall", icon: "🧮", title: "proj.marketStall",
    concepts: ["fractions", "percentages", "addition"],
    steps: ["proj.ms1", "proj.ms2", "proj.ms3"],
  },
  {
    id: "first-app", icon: "💻", title: "proj.firstApp",
    concepts: ["place-value", "linear-equations"],
    steps: ["proj.fa1", "proj.fa2", "proj.fa3"],
  },
  {
    id: "quad-plot", icon: "📈", title: "proj.quadPlot",
    concepts: ["quadratics", "coordinates"],
    steps: ["proj.qp1", "proj.qp2", "proj.qp3"],
  },
];

const KEY = "openmind:projects";

export default function ProjectsPage() {
  const { t, lang } = useI18n();
  const [done, setDone] = useState<Record<string, number>>({});
  useEffect(() => {
    try { setDone(JSON.parse(window.localStorage.getItem(KEY) ?? "{}")); } catch { /* ignore */ }
  }, []);
  const toggle = (tid: string, step: number, total: number) => {
    setDone((prev) => {
      const key = `${tid}:${step}`;
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = 1;
      try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    void total;
  };
  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">🛠️</span> {t("proj.eyebrow")}</p>
      <h1>{t("proj.title")}</h1>
      <p className="lead">{t("proj.lead")}</p>
      {TEMPLATES.map((p) => {
        const doneCount = p.steps.filter((_, i) => done[`${p.id}:${i}`]).length;
        const pct = Math.round((doneCount / p.steps.length) * 100);
        return (
          <section key={p.id} className="card" style={{ marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 18 }}><b>{p.icon} {t(p.title)}</b> <span className="mono small muted">{pct}%</span></p>
            <p className="small muted" style={{ margin: "6px 0" }}>
              {t("proj.needs")}: {p.concepts.map((cid, i) => {
                const c = getConcept(cid);
                if (!c) return null;
                return <span key={cid}>{i > 0 && " · "}<Link href={`/learn/${c.subject}/${c.id}`}>{ctitle(lang, c.id)}</Link></span>;
              })}
            </p>
            {p.steps.map((s, i) => (
              <label key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", margin: "4px 0" }}>
                <input type="checkbox" checked={!!done[`${p.id}:${i}`]} onChange={() => toggle(p.id, i, p.steps.length)} />
                <span className="small">{t(s)}</span>
              </label>
            ))}
          </section>
        );
      })}
    </main>
  );
}
