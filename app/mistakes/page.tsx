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
import { fill, localeFor } from "@/lib/i18n";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { mistakeRows, type MistakeRow } from "@/lib/mistakes";
import { SUBJECT_LABELS } from "@/lib/subjects";

export default function MistakesPage() {
  const { t, lang } = useI18n();
  const { state, loading } = useProfile();

  // THE RULE LIVES IN lib/mistakes.ts, where the engine suite can draw it: the
  // page's own copy of this fold is what let a wrong answer with no belief tag
  // stay invisible, and a rule that only exists inside a component can only be
  // checked by reading its source.
  const rows = useMemo<MistakeRow[]>(() => {
    if (!state) return [];
    return mistakeRows(state.progress, (id) => {
      const c = getConcept(id);
      return c ? { subject: c.subject } : null;
    });
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

  // THE ONE ACTION ON THE PAGE, and it belongs to the slip that has recurred
  // most — the list is already sorted by that. A filled button on every card is
  // not one primary action, it is three, and the learner has to decide which of
  // three identical "Practise this" buttons is the one to press.
  const primaryCid = bySubject[0]?.[1]?.[0]?.conceptId;

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <h1>{t("err.eyebrow")}</h1>
      <p className="lead">{t("err.lead")}</p>

      {rows.length === 0 ? (
        <p className="muted">{t("err.none")}</p>
      ) : (
        bySubject.map(([subject, list]) => (
          <section key={subject} style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 28 }}>
            <p className="eyebrow" style={{ margin: 0 }}>
              {t(SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS])}
            </p>
            {list.map((r) => {
              const m = r.misconceptionId ? MISCONCEPTIONS_BY_ID[r.misconceptionId] : undefined;
              const subjectPath = getConcept(r.conceptId)?.subject ?? "maths";
              // Empty for a language with no `mcp.<id>` line — the name stands
              // alone rather than being followed by a dash and an English
              // paragraph (see lib/content-i18n#mcCoaching).
              const coach = m && r.misconceptionId ? mcCoaching(lang, r.misconceptionId, m.coaching) : "";
              return (
                <div key={r.conceptId} className="card" style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                    <p style={{ margin: 0, fontWeight: 650 }}>
                      <Link href={`/learn/${subjectPath}/${r.conceptId}`}>{ctitle(lang, r.conceptId)}</Link>
                    </p>
                    <span className="mono small muted">
                      {r.misconceptionId
                        ? <>{r.totalHits}× · </>
                        : <>{fill(t("err.misses"), { w: r.wrong, n: r.attempts })} · </>}
                      {t("sess.mastery")} {Math.round(r.mastery * 100)}% · {r.attempts} {t("next.ev.attempts")}
                    </span>
                  </div>

                  <p className="small" style={{ margin: "8px 0 0" }}>
                    <span className="tag">{t("err.why")}</span>{" "}
                    {m && r.misconceptionId ? (
                      <>
                        <strong>{mcName(lang, r.misconceptionId, m.name)}</strong>
                        {coach ? <>{" — "}{coach}</> : null}
                      </>
                    ) : (
                      /* THE HONEST ROW: the answers are the learner's, the
                         belief is not known. It says exactly that rather than
                         inventing a cause, and it is still actionable — the
                         concept is named and the practice link works. */
                      t("err.noBelief")
                    )}
                  </p>
                  {r.others > 0 && (
                    <p className="small muted" style={{ margin: "4px 0 0" }}>
                      +{r.others} {t("err.more")}
                    </p>
                  )}
                  {r.lastSeen > 0 && (
                    <p className="small muted" style={{ margin: "4px 0 0" }}>
                      {/* A DAY, MONTH AND YEAR, in the reader's own order. A bare
                          `toLocaleDateString(lang)` passes a LANGUAGE code where
                          `Intl` wants a locale, and a bare `en` resolves to the
                          AMERICAN default — month first, on a UK qualification.
                          `localeFor` is the one place that mapping lives. */}
                      {t("err.last")}: {new Date(r.lastSeen).toLocaleDateString(localeFor(lang), { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    <Link
                      href={`/learn/${subjectPath}/${r.conceptId}?intent=REMEDIATE`}
                      className={r.conceptId === primaryCid ? "btn small" : "btn ghost small"}
                    >
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
        {/* `next.eyebrow` is "Your next step" — a card heading on Home, used
            here as the name of a way OUT of this page. The label says where it
            leads. */}
        <Link href="/dashboard" className="btn ghost small">← {t("nav.home")}</Link>
        <Link href="/papers" className="btn ghost small">{t("pp.title")}</Link>
      </div>
    </main>
  );
}
