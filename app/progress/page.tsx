"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MasteryBar, useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret } from "@/lib/client";
import { getConcept } from "@/lib/genome";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { confidenceOf } from "@/lib/retention";
import { SUBJECT_IDS, SUBJECT_LABELS } from "@/lib/subjects";
import { ctitle, mcName, mcCoaching } from "@/lib/content-i18n";
import { loadLedgerState, type LedgerLoad } from "@/lib/evidence-view";
import RecentAnswers from "@/components/recent-answers";
import type { ConceptProgress } from "@/lib/types";
import type { ProgressEvent } from "@/lib/progress-types";

interface AggMisconception {
  id: string;
  hits: number;
  conceptIds: string[];
}

export default function ProgressPage() {
  const { t, lang } = useI18n();
  const { state, loading } = useProfile();
  // The ledger, not the mutable model, is what this page vouches for: the
  // timeline and the per-concept dimension rates are folded from recorded
  // events. The model-only part of the page still renders when the record
  // cannot be read, but the evidence sections SAY so instead of quietly
  // vanishing — a missing record is not an empty one (§Sprint 2.1).
  const [ledger, setLedger] = useState<LedgerLoad>({ status: "loading" });
  const [tries, setTries] = useState(0);
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
    if (!state) return null;
    const entries = Object.entries(state.progress).filter(([cid]) => !!getConcept(cid));
    const totalAttempts = entries.reduce((n, [, p]) => n + p.attempts, 0);
    const totalCorrect = entries.reduce((n, [, p]) => n + p.correct, 0);
    const mastered = entries.filter(([, p]) => p.mastery >= 0.9).length;
    const accuracy = totalAttempts ? totalCorrect / totalAttempts : 0;

    // misconception ledger: hits aggregated over concepts; "recurring" = seen on 2+ answers
    const miscMap = new Map<string, AggMisconception>();
    for (const [cid, p] of entries) {
      for (const [mid, hits] of Object.entries(p.misconceptions)) {
        const agg = miscMap.get(mid) ?? { id: mid, hits: 0, conceptIds: [] };
        agg.hits += hits;
        if (!agg.conceptIds.includes(cid)) agg.conceptIds.push(cid);
        miscMap.set(mid, agg);
      }
    }
    const misconceptions = [...miscMap.values()].sort((a, b) => b.hits - a.hits);

    // diagnostic runs per subject, oldest → newest: the learning-gains evidence.
    // Audit P0-B: the average covers only directly probed concepts. Older
    // runs mixed in weak priors for unprobed concepts, which made gains a
    // statement about coverage, not learning.
    interface DiagRun { date: string; asked: number; misc: number; avg: number; at: number }
    const diagRuns = new Map<string, DiagRun[]>();
    for (const [key, d] of Object.entries(state.diagnostics)) {
      const subject = key.split(":")[0];
      const probed = d.probedConcepts?.length
        ? d.scores.filter((s) => s.asked > 0)
        : d.scores;
      const avg = probed.length ? probed.reduce((n, s) => n + s.mastery, 0) / probed.length : 0;
      const arr = diagRuns.get(subject) ?? [];
      arr.push({ date: new Date(d.startedAt).toLocaleDateString(), asked: d.asked, misc: d.misconceptions.length, avg, at: d.startedAt });
      diagRuns.set(subject, arr);
    }
    for (const arr of diagRuns.values()) arr.sort((a, b) => a.at - b.at);

    // per-subject concept rows (only touched concepts)
    const bySubject = new Map<string, Array<{ cid: string; p: ConceptProgress }>>();
    for (const [cid, p] of entries) {
      const c = getConcept(cid);
      if (!c) continue;
      const arr = bySubject.get(c.subject) ?? [];
      arr.push({ cid, p });
      bySubject.set(c.subject, arr);
    }
    for (const arr of bySubject.values()) arr.sort((a, b) => a.p.mastery - b.p.mastery);

    // real answer log (newest first) — recorded by the grading route itself
    const events = ((state as unknown as { events?: ProgressEvent[] }).events ?? [])
      .slice(-8)
      .reverse();

    return { entries, totalAttempts, accuracy, mastered, misconceptions, diagRuns, bySubject, events, state };
  }, [state]);

  if (loading) {
    return (
      <main className="container narrow" style={{ paddingTop: 44 }}>
        <p className="muted">{t("common.loading")}</p>
      </main>
    );
  }

  if (!state || !data || data.entries.length === 0) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        {/* The record may simply not be READ yet — say so rather than showing
            the empty state, which claims the learner has no evidence. */}
        {ledger.status !== "ready" && state && (
          <p className="small" style={{ marginBottom: 12 }}>
            {ledger.status === "failed" ? t("evv.ledgerFailed") : t("common.loading")}{" "}
            {ledger.status === "failed" && (
              <button type="button" className="chip" onClick={retry} style={{ cursor: "pointer" }}>
                {t("evv.ledgerRetry")}
              </button>
            )}
          </p>
        )}
        <p className="eyebrow"><span className="no">§</span> {t("prog.title")}</p>
        <h1 className="visually-small">{t("prog.title")}</h1>
        <p className="lead">{t("prog.empty")}</p>
        {/* Every subject gets a diagnostic from here. Offering only maths made
            the other four subjects look like they did not exist. */}
        <div className="actions">
          {SUBJECT_IDS.map((s) => (
            <Link key={s} href={`/diagnostic/${s}`} className="btn ghost">{t(`subj.${s}`)} →</Link>
          ))}
          <Link href="/learn" className="btn ghost">{t("nav.subjects")}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">§</span> {t("prog.title")}</p>
      <h1 className="visually-small">{t("prog.title")}</h1>
      <p className="lead">{t("prog.sub")}</p>

      <div className="grid cols3" style={{ margin: "18px 0 30px" }}>
        <div className="card soft"><div className="stat">{data.totalAttempts}</div><div className="stat-label">{t("prog.attempts")}</div></div>
        <div className="card soft"><div className="stat">{Math.round(data.accuracy * 100)}%</div><div className="stat-label">{t("prog.accuracy")}</div></div>
        <div className="card soft"><div className="stat">{data.mastered}</div><div className="stat-label">{t("learn.mastered")}</div></div>
      </div>

      {(() => {
        // Learning gains: Diagnostic → Learning → Independent → Transfer.
        // "Got it right" ≠ "knows it": independent means hint-free prove-it
        // answers; transfer means unfamiliar wording without hints.
        const rows = [...data.diagRuns.entries()].map(([subj, runs]) => {
          const cids = [...data.bySubject.get(subj) ?? []].map((r) => r.cid);
          const ps = cids.map((cid) => data.state.progress[cid]).filter(Boolean);
          const learning = ps.length ? ps.reduce((s, p) => s + p.mastery, 0) / ps.length : 0;
          const indAsked = ps.reduce((s, p) => s + (p.independent?.asked ?? 0), 0);
          const indOk = ps.reduce((s, p) => s + (p.independent?.correct ?? 0), 0);
          const trAsked = ps.reduce((s, p) => s + (p.transfer?.asked ?? 0), 0);
          const trOk = ps.reduce((s, p) => s + (p.transfer?.correct ?? 0), 0);
          const before = runs.length ? runs[0].avg : 0;
          const head = trAsked > 0 ? trOk / trAsked : indAsked > 0 ? indOk / indAsked : learning;
          return { subj, before, learning, indAsked, indRate: indAsked ? indOk / indAsked : null, trRate: trAsked ? trOk / trAsked : null, head, n: runs.length };
        });
        if (rows.length === 0) return null;
        return (
          <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 30 }}>
            <p className="eyebrow"><span className="no">↗</span> {t("prog.impact")}</p>
            {rows.map((r) => {
              const d = Math.round((r.head - r.before) * 100);
              return (
                <div key={r.subj} className="small" style={{ margin: "8px 0" }}>
                  <b>{t(`subj.${r.subj}`)}</b>
                  <span className="mono" style={{ display: "block", marginTop: 2 }}>
                    {t("prog.diagnostic")} {Math.round(r.before * 100)}% → {t("prog.learning")} {Math.round(r.learning * 100)}% →{" "}
                    {t("prog.independent")} {r.indRate === null ? "—" : `${Math.round(r.indRate * 100)}%`} →{" "}
                    {t("prog.transfer")} {r.trRate === null ? "—" : `${Math.round(r.trRate * 100)}%`}
                  </span>
                  <span className={d > 0 ? "" : "muted"}>{t("prog.gain")} {d >= 0 ? "+" : ""}{d} {t("prog.points")}{r.n > 1 ? ` · ${r.n} ${t("prog.diagnostics")}` : ""}</span>
                </div>
              );
            })}
          </section>
        );
      })()}

      {data.events.length > 0 && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 30 }}>
          <p className="eyebrow"><span className="no">·</span> {t("prog.recent")}</p>
          {data.events.map((ev, i) => (
            <div key={`${ev.at}-${i}`} className="rowline">
              <span className={`mark ${ev.correct ? "good" : "bad"}`} aria-hidden="true">{ev.correct ? "✓" : "✗"}</span>
              <Link href={`/learn/maths/${ev.conceptId}`} className="grow">{ctitle(lang, ev.conceptId)}</Link>
              <span className="small muted">{new Date(ev.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </section>
      )}

      {/* ── The ledger's view: what OpenMind has actually recorded ──────────
          The mutable model shows where you are; this shows WHY. Each section
          is folded from recorded events, translated to human lines — no event
          ids, no schema versions. Absent dimensions render as "not yet
          measured", never as 0 (§unknown-not-zero, in the learner's face). */}
      {ledger.status === "failed" && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 30 }}>
          <p className="eyebrow"><span className="no">≡</span> {t("evv.theEvidence")}</p>
          <p className="small" style={{ margin: 0 }}>
            {t("evv.ledgerFailed")}{" "}
            <button type="button" className="chip" onClick={retry} style={{ cursor: "pointer" }}>
              {t("evv.ledgerRetry")}
            </button>
          </p>
        </section>
      )}

      {ready && (() => {
        const concepts = Object.values(ready.projection.byConcept);
        const withInd = concepts.filter((c) => c.independent.asked > 0);
        const withTr = concepts.filter((c) => c.transfer.asked > 0);
        const withRet = concepts.filter((c) => c.retention.asked > 0);
        const dimsFor = (cid: string) => {
          const c = ready.projection.byConcept[cid];
          return [
            { label: t("evv.dim.recalled"), r: c.measured.asked > 0 ? c.measured : null },
            { label: t("evv.dim.applied"), r: c.independent.asked > 0 ? c.independent : null },
            { label: t("evv.dim.transferred"), r: c.transfer.asked > 0 ? c.transfer : null },
            // A DELAYED re-measurement: the concept came back after its interval
            // and the learner still had it. Shown like every other dimension —
            // measured where it exists, "not yet measured" where it does not.
            { label: t("evv.dim.retention"), r: c.retention.asked > 0 ? c.retention : null },
          ];
        };
        const band = (r: { asked: number; correct: number }) => (r.correct / r.asked >= 0.7 ? "strong" : "developing");
        return (
          <>
            <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 30 }}>
              <p className="eyebrow"><span className="no">≡</span> {t("evv.theEvidence")}</p>
              <p className="small muted" style={{ margin: "0 0 10px" }}>{t("pev.fromLedger")}</p>
              {/* One presentation of the record, shared with Home — the rows
                  and their disclosure rules live in the component. */}
              <RecentAnswers ledger={ready} limit={8} />
            </section>

            <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 30 }}>
              <p className="eyebrow"><span className="no">▦</span> {t("evv.basedOn")}</p>
              {concepts.length === 0 && <p className="small muted" style={{ margin: 0 }}>{t("evv.noCitations")}</p>}
              {concepts.map((c) => (
                <div key={c.conceptId} style={{ marginBottom: 12 }}>
                  {/* Through to the concept's Mind page: the same dimensions,
                      plus the answers behind them and the reason the plan says
                      what it says. */}
                  <Link href={`/mind/${c.conceptId}`} className="small" style={{ fontWeight: 700 }}>
                    {ctitle(lang, c.conceptId)}
                  </Link>
                  {dimsFor(c.conceptId).map((d) => (
                    <div key={d.label} className="small" style={{ display: "flex", gap: 8, alignItems: "baseline", margin: "2px 0" }}>
                      <span style={{ flex: "none", width: 110, color: "var(--pencil)" }}>{d.label}</span>
                      {d.r ? (
                        <>
                          <span className={`chip ${band(d.r) === "strong" ? "good" : ""}`}>{t(`mm.${band(d.r)}`)}</span>
                          <span className="mono small muted">{d.r.correct}/{d.r.asked}</span>
                        </>
                      ) : (
                        <span className="small muted">{t("evv.unmeasured")}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {/* The unknowns, named: not-yet-measured dimensions of concepts
                  the learner has touched. Unknown stays unknown. */}
              {(() => {
                const unknowns: string[] = [];
                if (withInd.length < concepts.length) unknowns.push(t("evv.dim.applied"));
                if (withTr.length < concepts.length) unknowns.push(t("evv.dim.transferred"));
                // Named as unknown only while it IS unknown: a concept this
                // learner has already been re-measured on after a gap is not a
                // gap in their record, and saying so would be the opposite lie.
                if (withRet.length < concepts.length) unknowns.push(t("evv.dim.retention"));
                return unknowns.length > 0 ? (
                  <p className="small muted" style={{ marginTop: 6 }}>
                    <strong>{t("evv.notYet")}</strong> {unknowns.join(" · ")}
                  </p>
                ) : null;
              })()}
            </section>
          </>
        );
      })()}

      {data.misconceptions.length > 0 && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 28 }}>
          <p className="eyebrow"><span className="no">!</span> {t("res.misconceptions")}</p>
          {data.misconceptions.map((m) => {
            const misc = MISCONCEPTIONS_BY_ID[m.id];
            const recurring = m.hits >= 2;
            return (
              <div key={m.id} className="note">
                <strong>
                  {mcName(lang, m.id, misc?.name ?? m.id)}{" "}
                  <span className={`chip ${recurring ? "warn" : "good"}`} style={{ marginLeft: 6 }}>
                    {recurring ? `${t("prog.recurring")} ×${m.hits}` : t("prog.seenOnce")}
                  </span>
                </strong>
                <span className="small muted">
                  {m.conceptIds.map((cid) => ctitle(lang, cid)).join(" · ")}
                </span>
                {misc && <span className="small">{mcCoaching(lang, m.id, misc.coaching)}</span>}
              </div>
            );
          })}
        </section>
      )}

      <section style={{ marginBottom: 30 }}>
        <p className="eyebrow"><span className="no">▦</span> {t("prog.mastery")}</p>
        {[...data.bySubject.entries()].map(([subject, rows]) => (
          <div key={subject} style={{ marginBottom: 22 }}>
            <div className="stage-label">
              {t(SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS] ?? subject)}
            </div>
            {rows.map(({ cid, p }) => (
              <div key={cid} className="rowline">
                <Link href={`/learn/${subject}/${cid}`} className="grow" style={{ minWidth: 180 }}>
                  {ctitle(lang, cid)}
                </Link>
                <span style={{ flex: 2, minWidth: 140 }}><MasteryBar value={p.mastery} /></span>
                <span className="mono small" style={{ width: 44, textAlign: "end" }}>{Math.round(p.mastery * 100)}%</span>
                <span
                  className="mono small muted"
                  style={{ width: 58, textAlign: "end" }}
                  title={t("prog.confidence")}
                >
                  {(() => {
                    const conf = confidenceOf(p);
                    return conf === null ? "—" : `${Math.round(conf * 100)}%`;
                  })()}
                </span>
                <span className="mono small muted" style={{ width: 70, textAlign: "end" }}>{p.correct}/{p.attempts}</span>
              </div>
            ))}
          </div>
        ))}
      </section>

      {data.diagRuns.size > 0 && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginBottom: 40 }}>
          <p className="eyebrow"><span className="no">✓</span> {t("diag.title")}</p>
          {[...data.diagRuns.entries()].map(([subject, runs]) => {
            const first = runs[0];
            const last = runs[runs.length - 1];
            const gained = runs.length >= 2 ? last.avg - first.avg : null;
            return (
              <div key={subject} className="rowline" style={{ alignItems: "baseline" }}>
                <span className="grow">{t(SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS] ?? subject)}</span>
                {gained !== null ? (
                  <>
                    <span className="mono small muted">{first.date} → {last.date}</span>
                    <span className="mono small">{Math.round(first.avg * 100)}% → {Math.round(last.avg * 100)}%</span>
                    <span className={`chip ${gained >= 0 ? "good" : "warn"}`} style={{ marginLeft: 8 }}>
                      {gained >= 0 ? "+" : ""}{Math.round(gained * 100)} {t("prog.gainPts")}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="small muted">{last.date}</span>
                    <span className="mono small" style={{ marginLeft: 8 }}>
                      {last.asked} {t("diag.q1")} · {Math.round(last.avg * 100)}%
                    </span>
                  </>
                )}
              </div>
            );
          })}
          {[...data.diagRuns.values()].some((r) => r.length < 2) && (
            <p className="small muted" style={{ marginTop: 10 }}>{t("prog.gainHint")}</p>
          )}
        </section>
      )}

      <div className="actions" style={{ marginBottom: 44 }}>
        <Link href="/dashboard" className="btn ghost">← {t("dash.hi")}</Link>
      </div>
    </main>
  );
}
