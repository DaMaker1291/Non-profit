"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MY MISTAKES.
//
// Not "wrong answers you gave" — the recurring slips OpenMind has actually
// recorded about this learner, named, with the belief behind them, how often
// they have recurred, and the one action that repairs each. It reads the same
// learner model every other surface reads; nothing here is estimated, and a
// concept with no recorded slip simply does not appear.
//
// A first attempt is not a mistake — the model only counts a slip from its
// second occurrence — so this page stays honest even for a brand-new learner:
// it is empty until something genuinely recurs.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useMemo } from "react";
import { useI18n, useProfile } from "@/lib/client";
import { ctitle, mcCoaching, mcName } from "@/lib/content-i18n";
import { getConcept } from "@/lib/genome";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { SUBJECT_LABELS } from "@/lib/subjects";

interface MistakeRow {
  conceptId: string;
  subject: string;
  misconceptionId: string;
  hits: number;
  totalHits: number;
  mastery: number;
  attempts: number;
  lastSeen: number;
  others: number;
}

export default function MistakesPage() {
  const { t, lang } = useI18n();
  const { state, loading } = useProfile();

  const rows = useMemo<MistakeRow[]>(() => {
    if (!state) return [];
    const out: MistakeRow[] = [];
    for (const [conceptId, p] of Object.entries(state.progress)) {
      const c = getConcept(conceptId);
      if (!c) continue;
      const entries = Object.entries(p.misconceptions ?? {})
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1]);
      if (!entries.length) continue;
      out.push({
        conceptId,
        subject: c.subject,
        misconceptionId: entries[0][0],
        hits: entries[0][1],
        totalHits: entries.reduce((s, [, n]) => s + n, 0),
        mastery: p.mastery,
        attempts: p.attempts,
        lastSeen: p.lastSeen ?? 0,
        others: entries.length - 1,
      });
    }
    return out.sort((a, b) => b.totalHits - a.totalHits || b.lastSeen - a.lastSeen);
  }, [state]);

  const bySubject = useMemo(() => {
    const groups = new Map<string, MistakeRow[]>();
    for (const r of rows) {
      const list = groups.get(r.subject) ?? [];
      list.push(r);
      groups.set(r.subject, list);
    }
    return [...groups.entries()];
  }, [rows]);

  if (loading) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        <p className="muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        <p className="eyebrow"><span className="no">!</span> {t("err.eyebrow")}</p>
        <p className="lead">{t("common.anon")}</p>
        <Link href="/onboarding" className="btn">{t("onb.start")} →</Link>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">✗</span> {t("err.eyebrow")}</p>
      <h1 className="visually-small">{t("err.eyebrow")}</h1>
      <p className="lead">{t("err.lead")}</p>

      {rows.length === 0 ? (
        <p className="muted">{t("err.none")}</p>
      ) : (
        bySubject.map(([subject, list]) => (
          <section key={subject} style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 28 }}>
            <p className="eyebrow" style={{ margin: 0 }}>
              <span className="no">§</span> {t(SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS])}
            </p>
            {list.map((r) => {
              const m = MISCONCEPTIONS_BY_ID[r.misconceptionId];
              const subjectPath = getConcept(r.conceptId)?.subject ?? "maths";
              return (
                <div key={r.conceptId} className="card" style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                    <p style={{ margin: 0, fontWeight: 650 }}>
                      <Link href={`/learn/${subjectPath}/${r.conceptId}`}>{ctitle(lang, r.conceptId)}</Link>
                    </p>
                    <span className="mono small muted">
                      {r.totalHits}× · {t("sess.mastery")} {Math.round(r.mastery * 100)}% · {r.attempts} {t("next.ev.attempts")}
                    </span>
                  </div>

                  <p className="small" style={{ margin: "8px 0 0" }}>
                    <span className="tag">{t("err.why")}</span>{" "}
                    {m ? (
                      <>
                        <strong>{mcName(lang, r.misconceptionId, m.name)}</strong> — {mcCoaching(lang, r.misconceptionId, m.coaching)}
                      </>
                    ) : (
                      t("err.unknown")
                    )}
                  </p>
                  {r.others > 0 && (
                    <p className="small muted" style={{ margin: "4px 0 0" }}>
                      +{r.others} {t("err.more")}
                    </p>
                  )}
                  {r.lastSeen > 0 && (
                    <p className="small muted" style={{ margin: "4px 0 0" }}>
                      {t("err.last")}: {new Date(r.lastSeen).toLocaleDateString(lang)}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    <Link href={`/learn/${subjectPath}/${r.conceptId}?intent=REMEDIATE`} className="btn small">
                      {t("err.practise")} →
                    </Link>
                    <Link href={`/learn/${subjectPath}/${r.conceptId}`} className="btn ghost small">
                      {t("err.review")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </section>
        ))
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10, marginBottom: 40 }}>
        <Link href="/dashboard" className="btn ghost small">← {t("next.eyebrow")}</Link>
        <Link href="/papers" className="btn ghost small">{t("pp.title")}</Link>
      </div>
    </main>
  );
}
