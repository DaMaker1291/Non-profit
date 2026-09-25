"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MasteryBar, useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret } from "@/lib/client";
import { bySubject, getConcept } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { conceptKnowledge, loadLedgerState, type LedgerLoad } from "@/lib/evidence-view";
import type { SubjectId } from "@/lib/types";

/** YOUR MIND — what OpenMind has actually measured, concept by concept.
 *
 *  The genome map shows where a concept SITS (prerequisites, stage, mastery %).
 *  This page answers the other question: what do we KNOW about you on it — and
 *  for each dimension the answer may honestly be "not yet measured", because a
 *  dimension with no observations is unknown, not zero.
 *
 *  Two rules, carried from the ledger:
 *   · the dimensions come from the LEDGER's projection, not from the mutable
 *     model, so the page speaks about recorded answers only;
 *   · while the record has not arrived, the page shows NOTHING about the
 *     learner's knowledge rather than an empty-looking one. "We have not read
 *     your evidence yet" is not the same sentence as "you have demonstrated
 *     nothing", and this project does not let the second stand in for the first.
 */
export default function MindPage() {
  const { t, lang } = useI18n();
  const { state, loading } = useProfile();
  // Three outcomes, not two: loading, ready, FAILED. A dropped connection must
  // not read as "this learner has demonstrated nothing" (and must not spin
  // forever either) — so the state is named and all three are rendered.
  const [ledger, setLedger] = useState<LedgerLoad>({ status: "loading" });
  const [tries, setTries] = useState(0);

  // The ledger, as on every other page that speaks about evidence: it is the
  // record this page vouches for. Home's card and the lesson page load it the
  // same way.
  useEffect(() => {
    const pid = loadLocalProfileId();
    const secret = loadLocalProfileSecret() ?? "";
    if (!pid) return;
    let alive = true;
    setLedger({ status: "loading" });
    loadLedgerState(pid, secret).then((r) => { if (alive) setLedger(r.status === "ready" ? { status: "ready", ledger: r.ledger } : { status: "failed" }); });
    return () => { alive = false; };
  }, [tries]);
  const ready = ledger.status === "ready" ? ledger.ledger : null;
  const retry = () => setTries((n) => n + 1);

  const data = useMemo(() => {
    if (!state || !ready) return null;
    const subjects = (state.profile.subjects ?? []) as SubjectId[];
    const rows = subjects.map((subject) => {
      const concepts = bySubject(subject)
        .map((c) => ({
          id: c.id,
          byLedger: ready.projection.byConcept[c.id] ?? null,
          byModel: state.progress[c.id] ?? null,
        }))
        // A concept is on this page because evidence exists, or because the
        // model has something to say — never because it is merely in the bank.
        .filter((r) => r.byLedger || (r.byModel?.attempts ?? 0) > 0);
      // The same three dimensions the concept page shows, from the same
      // function — so the summary and the drill-down can never disagree about
      // what "Recall" means. Retention is left to the concept page: it is
      // unmeasured everywhere, and a column of dashes teaches nothing.
      const dims = (r: (typeof concepts)[number]) => {
        if (!r.byLedger) return [];
        return conceptKnowledge(ready.projection, r.id, t).rows
          .filter((row) => row.from === "all-answers" || row.from === "independent" || row.from === "transfer");
      };
      const measured = concepts.filter((r) => (r.byLedger?.attempts ?? 0) > 0)
        .sort((a, b) => (b.byLedger?.attempts ?? 0) - (a.byLedger?.attempts ?? 0));
      const unmeasured = concepts.filter((r) => (r.byLedger?.attempts ?? 0) === 0);
      return { subject, measured, unmeasured, dims };
    }).filter((r) => r.measured.length + r.unmeasured.length > 0);
    return { rows, events: ready.projection.events };
  }, [state, ready, t]);

  if (loading || !state) {
    return (
      <main className="container narrow" style={{ paddingTop: 44 }}>
        <p className="muted">{t("common.loading")}</p>
      </main>
    );
  }

  // Not read yet — not "no knowledge". See the header.
  if (ledger.status === "loading") {
    return (
      <main className="container narrow" style={{ paddingTop: 44 }}>
        <p className="eyebrow"><span className="no">§</span> {t("mm.yourKnowledge")}</p>
        <h1 className="visually-small">{t("mm.yourKnowledge")}</h1>
        <p className="muted">{t("common.loading")}</p>
      </main>
    );
  }

  // The record could not be READ — which is not the same as a record with
  // nothing in it, and is not a reason to leave a learner guessing.
  if (ledger.status === "failed") {
    return (
      <main className="container narrow" style={{ paddingTop: 44 }}>
        <p className="eyebrow"><span className="no">§</span> {t("mm.yourKnowledge")}</p>
        <h1 className="visually-small">{t("mm.yourKnowledge")}</h1>
        <p className="small">{t("evv.ledgerFailed")}</p>
        <div className="actions">
          <button type="button" className="btn ghost" onClick={retry}>{t("evv.ledgerRetry")}</button>
          <Link href="/progress" className="btn ghost">{t("prog.nav")} →</Link>
        </div>
      </main>
    );
  }

  if (!data || data.events === 0) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        <p className="eyebrow"><span className="no">§</span> {t("mm.yourKnowledge")}</p>
        <h1 className="visually-small">{t("mm.yourKnowledge")}</h1>
        <p className="lead">{t("prog.empty")}</p>
        <div className="actions">
          {((state.profile.subjects ?? []) as SubjectId[]).map((s) => (
            <Link key={s} href={`/diagnostic/${s}`} className="btn ghost">{t(`subj.${s}`)} →</Link>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">§</span> {t("mm.yourKnowledge")}</p>
      <h1 className="visually-small">{t("mm.yourKnowledge")}</h1>
      {/* The honesty line the whole page rests on: everything here is counted
          from answers the learner actually gave. */}
      <p className="lead">{t("prog.sub")}</p>

      {data.rows.map(({ subject, measured, unmeasured, dims }) => (
        <section key={subject} style={{ marginBottom: 30 }}>
          <div className="stage-label">{t(`subj.${subject}`)}</div>

          {measured.map((r) => {
            const m = r.byModel?.mastery ?? 0;
            return (
              <div key={r.id} className="card soft" style={{ marginBottom: 10, padding: 14 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                  {/* The concept name is the drill-down: what we know about it,
                      with the evidence behind that knowledge. */}
                  <Link href={`/mind/${r.id}`} style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 160 }}>
                    {ctitle(lang, r.id)}
                  </Link>
                  <span className="mono small muted">
                    {r.byLedger ? `${r.byLedger.correct}/${r.byLedger.attempts}` : ""}
                  </span>
                  <span style={{ flex: "none", width: 120 }}><MasteryBar value={m} /></span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {dims(r).map((d) => (
                    <span key={`${d.from}-${d.key}`} className="small" style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                      <span className="muted" style={{ minWidth: 74 }}>{d.label}</span>
                      {d.rate ? (
                        <>
                          <span className={`chip ${d.rate.correct / d.rate.asked >= 0.7 ? "good" : ""}`}>
                            {t(d.rate.correct / d.rate.asked >= 0.7 ? "mm.strong" : "mm.developing")}
                          </span>
                          <span className="mono small muted">{d.rate.correct}/{d.rate.asked}</span>
                        </>
                      ) : (
                        <span className="mono small muted">{t("evv.unmeasured")}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Touched, but with no recorded evidence behind it: named rather
              than drawn as a zero. */}
          {unmeasured.length > 0 && (
            <p className="small muted" style={{ marginTop: 4 }}>
              <strong>{t("evv.notYet")}</strong>{" "}
              {unmeasured.map((r, i) => (
                <span key={r.id}>
                  {i > 0 && " · "}
                  <Link href={`/mind/${r.id}`}>{ctitle(lang, r.id)}</Link>
                </span>
              ))}
            </p>
          )}
        </section>
      ))}

      <div className="actions" style={{ marginBottom: 44 }}>
        <Link href="/progress" className="btn ghost">{t("prog.nav")} →</Link>
        <Link href="/genome" className="btn ghost">{t("dash.genome")} →</Link>
      </div>
    </main>
  );
}
