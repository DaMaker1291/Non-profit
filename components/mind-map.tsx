"use client";

import Link from "next/link";
import { bySubject } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { useI18n } from "@/lib/client";
import type { ProfileState, SubjectId } from "@/lib/types";

/** YOUR MIND MAP (§mind-map): capability view, not course completion.
 *  Per subject: touched concepts with mastery bars; tap through to the concept's
 *  Mind page — what we know about it, the evidence behind that, and what is
 *  next — because "practise this" is the wrong answer to "why this?". */
export default function MindMap({ state }: { state: ProfileState }) {
  const { t, lang } = useI18n();
  const subjects = state.profile.subjects as SubjectId[];
  return (
    <section style={{ borderTop: "2px solid var(--ink)", paddingTop: 20, marginBottom: 30 }}>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">🧠</span> {t("mm.yourKnowledge")}</p>
      {subjects.map((s) => {
        const concepts = bySubject(s).slice(0, 12);
        return (
          <div key={s} style={{ marginTop: 12 }}>
            <p className="small muted" style={{ margin: "0 0 6px", textTransform: "capitalize" }}>{t(`subj.${s}`)}</p>
            <div style={{ display: "grid", gap: 6 }}>
              {concepts.map((c) => {
                const m = state.progress[c.id]?.mastery ?? 0;
                const pct = Math.round(m * 100);
                const label = m >= 0.9 ? t("mm.strong") : m >= 0.5 ? t("mm.developing") : m > 0 ? t("mm.learning") : t("mm.new");
                return (
                  <Link
                    key={c.id}
                    href={`/mind/${c.id}`}
                    style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ minWidth: 150, fontSize: 14 }}>{ctitle(lang, c.id)}</span>
                    <span className="bar thin" style={{ flex: 1 }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                      <i style={{ width: `${pct}%` }} />
                    </span>
                    <span className="mono small muted" style={{ minWidth: 90, textAlign: "end" }}>{label} {pct}%</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
