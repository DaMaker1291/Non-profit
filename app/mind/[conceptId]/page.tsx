"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { MasteryBar, useI18n, useProfile, loadLocalProfileId, loadLocalProfileSecret } from "@/lib/client";
import { getConcept, ancestorsOf } from "@/lib/genome";
import { ctitle, cblurb, mcName, mcCoaching } from "@/lib/content-i18n";
import { confidenceOf } from "@/lib/retention";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { reasonKey } from "@/lib/session";
import { decideOne, decisionContextFrom } from "@/lib/decision";
import {
  citationsFor, conceptAnswers, conceptKnowledge, loadLedgerState, type LedgerLoad,
} from "@/lib/evidence-view";

/** ONE CONCEPT, AS THE MODEL SEES IT — the page a learner opens when they ask
 *  "what do you actually know about me here, and why is this next?".
 *
 *  It answers four questions, in the learner's own language, from the record:
 *
 *    WHAT WE KNOW   the dimensions, each one either measured (with its own
 *                   counts) or explicitly not yet measured — unknown is never
 *                   drawn as zero;
 *    THE EVIDENCE   the answers themselves, newest first, including the
 *                   diagnostic that first made this concept look weak;
 *    WHY THIS       when this concept IS the learner's next step, the engine's
 *                   own reason, why-now, plan and expected outcome — the same
 *                   action Home shows, decided through the same door;
 *    WHAT CHANGED   the last session on this concept, if there was one, with
 *                   the engine's `changeReason` rather than a cheerful summary.
 *
 *  Nothing on this page re-derives a reason. The words come from the decision
 *  engine (lib/next-engine) and the decision door (lib/decision); this file is
 *  layout. And while the ledger has not arrived it shows NOTHING about the
 *  learner's knowledge, because "we have not read your record" and "you have
 *  demonstrated nothing" are different sentences.
 */
export default function ConceptMindPage() {
  const params = useParams<{ conceptId: string }>();
  const conceptId = params?.conceptId ?? "";
  const c = getConcept(conceptId);
  const { t, lang } = useI18n();
  const { state, loading } = useProfile();
  // Three outcomes, not two — see lib/evidence-view's `LedgerLoad`. A failed
  // read says so, in the learner's language, and offers to try again.
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

  // Through the ONE door: the model and the ledger it was projected from. A
  // pending ledger gives the action the basis `unknown`, so nothing here claims
  // to have read evidence it does not hold.
  const next = useMemo(
    () => (state ? decideOne(decisionContextFrom(state, ready), { tt: t, title: (id) => ctitle(lang, id) }) ?? null : null),
    [state, ready, t, lang],
  );

  const onThisConcept = next?.conceptId === conceptId;
  const view = useMemo(() => {
    if (!ready) return null;
    const knowledge = conceptKnowledge(ready.projection, conceptId, t);
    const answers = conceptAnswers(ready.events, conceptId, 12);
    return {
      dimensions: knowledge.rows,
      unmeasured: knowledge.unmeasuredLabels,
      // The answers themselves, turned into human lines by the one translator
      // between event ids and text.
      cites: citationsFor(answers.map((a) => a.id), ready.events, {
        titleFor: (id) => ctitle(lang, id), t, locale: lang === "en" ? undefined : lang,
      }),
      // When this concept IS the next step, the same expansion for the events
      // the decision cited — the "why" the card's drawer shows, inline.
      whyCites: next ? citationsFor(next.evidenceIds, ready.events, {
        titleFor: (id) => ctitle(lang, id), t, locale: lang === "en" ? undefined : lang,
      }) : [],
      byLedger: ready.projection.byConcept[conceptId] ?? null,
    };
  }, [ready, conceptId, t, lang, next]);

  if (!c) {
    return (
      <main className="container narrow" style={{ paddingTop: 48 }}>
        <p className="eyebrow"><span className="no">!</span> 404</p>
        <h1 className="visually-small">{t("learn.notFound")}</h1>
        <Link href="/mind" className="btn ghost">← {t("mm.yourKnowledge")}</Link>
      </main>
    );
  }

  if (loading || !state) {
    return (
      <main className="container narrow" style={{ paddingTop: 44 }}>
        <p className="muted">{t("common.loading")}</p>
      </main>
    );
  }

  const p = state.progress[conceptId];
  const conf = p ? confidenceOf(p) : null;
  const last = state.lastSession && state.lastSession.conceptId === conceptId ? state.lastSession : null;
  const misconceptions = Object.entries(p?.misconceptions ?? {}).filter(([, n]) => n > 0);
  const chain = ancestorsOf(conceptId);

  return (
    <main className="container narrow" style={{ paddingTop: 40 }}>
      <p className="eyebrow"><span className="no">§</span> {t("evv.basedOn")} · {t(`subj.${c.subject}`)}</p>
      <h1 className="visually-small" style={{ marginBottom: 4 }}>{ctitle(lang, conceptId)}</h1>
      <p className="muted" style={{ marginTop: 0 }}>{cblurb(lang, conceptId)}</p>
      {chain.length > 1 && (
        <p className="small muted">
          {t("common.prereqs")}:{" "}
          {c.prereqs.map((pid2, i) => (
            <span key={pid2}>
              {i > 0 && " · "}
              <Link href={`/mind/${pid2}`}>{ctitle(lang, pid2)}</Link>
            </span>
          ))}
        </p>
      )}

      {/* ── WHAT WE KNOW ────────────────────────────────────────────────────
          Dimensions from the ledger's projection. A dimension with no
          observations of its kind is listed as unmeasured — never as 0% — and
          the whole block waits for the record rather than guessing. */}
      <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginTop: 18 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}><span className="no">▦</span> {t("evv.basedOn")}</p>
        {ledger.status === "loading" && <p className="small muted" style={{ margin: 0 }}>{t("common.loading")}</p>}
        {ledger.status === "failed" && (
          <p className="small" style={{ margin: 0 }}>
            {t("evv.ledgerFailed")}{" "}
            <button type="button" className="chip" onClick={retry} style={{ cursor: "pointer" }}>
              {t("evv.ledgerRetry")}
            </button>
          </p>
        )}
        {view && (
          <>
            {view.dimensions.map((d) => (
              <div key={`${d.from}-${d.key}`} className="rowline" style={{ alignItems: "baseline" }}>
                <span className="grow small">{d.label}</span>
                {d.rate ? (
                  <>
                    <span className={`chip ${d.band === "strong" ? "good" : ""}`}>
                      {t(d.band === "strong" ? "mm.strong" : "mm.developing")}
                    </span>
                    <span className="mono small muted" style={{ minWidth: 60, textAlign: "end" }}>
                      {d.rate.correct}/{d.rate.asked}
                    </span>
                  </>
                ) : (
                  <span className="small muted">{t("evv.unmeasured")}</span>
                )}
              </div>
            ))}
            <p className="small muted" style={{ marginTop: 8 }}>
              <strong>{t("evv.notYet")}</strong> {view.unmeasured.join(" · ")}
            </p>
          </>
        )}
        {p && (
          <div className="rowline" style={{ marginTop: 10, alignItems: "baseline" }}>
            <span className="grow small muted">{t("prog.mastery")}</span>
            <span style={{ width: 120 }}><MasteryBar value={p.mastery} /></span>
            <span className="mono small" style={{ minWidth: 44, textAlign: "end" }}>{Math.round(p.mastery * 100)}%</span>
            <span className="mono small muted" style={{ minWidth: 62, textAlign: "end" }} title={t("prog.confidence")}>
              {conf === null ? "—" : `${Math.round(conf * 100)}%`}
            </span>
          </div>
        )}
      </section>

      {/* ── WHY THIS IS YOUR NEXT STEP (only when it is) ──────────────────── */}
      {onThisConcept && next && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginTop: 24 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}><span className="no">→</span> {t("next.eyebrow")}</p>
          <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>{next.title}</p>
          <p className="small" style={{ margin: "0 0 4px" }}>
            <strong className="mono">{t("evv.because")}</strong> {next.reason}
          </p>
          <p className="small" style={{ margin: "0 0 4px" }}>
            <strong className="mono">{t("evv.whyNow")}</strong> {next.why}
          </p>
          {next.plan.length > 0 && (
            <p className="small" style={{ margin: "0 0 4px" }}>
              <strong className="mono">{t("next.how")}</strong>{" "}
              {next.plan.map((s) => `${s.count} ${t(`plan.${s.kind}`)}`).join(" → ")}
            </p>
          )}
          <p className="small" style={{ margin: "0 0 10px" }}>
            <strong className="mono">{t("evv.after")}</strong> {next.expectedOutcome}
          </p>
          {view && view.whyCites.length > 0 && (
            <>
              <p className="eyebrow" style={{ margin: "10px 0 4px" }}>{t("evv.theEvidence")}</p>
              {view.whyCites.map((ct) => (
                <div key={ct.id} className="rowline">
                  <span className={`mark ${ct.correct ? "good" : ct.correct === false ? "bad" : ""}`} aria-hidden="true">
                    {ct.correct ? "✓" : ct.correct === false ? "✗" : "·"}
                  </span>
                  <span className="grow small">
                    {ct.concept} <span className="muted">· {ct.kind}</span>
                    {ct.offline && <span className="muted"> · {t("evv.offline")}</span>}
                  </span>
                  <span className="mono small muted" style={{ width: 52, textAlign: "end" }}>{ct.when}</span>
                </div>
              ))}
            </>
          )}
          <div className="actions">
            <Link href={next.href} className="btn">{t("next.start")} →</Link>
            <span className="small muted">~{next.minutes} {t("next.ev.min")}</span>
          </div>
        </section>
      )}

      {/* ── THE EVIDENCE, for this concept ───────────────────────────────── */}
      {view && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginTop: 24 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}><span className="no">≡</span> {t("evv.theEvidence")}</p>
          {view.cites.length === 0 ? (
            <p className="small muted" style={{ margin: 0 }}>{t("evv.noCitations")}</p>
          ) : (
            view.cites.map((ct) => (
              <div key={ct.id} className="rowline">
                <span className={`mark ${ct.correct ? "good" : ct.correct === false ? "bad" : ""}`} aria-hidden="true">
                  {ct.correct ? "✓" : ct.correct === false ? "✗" : "·"}
                </span>
                <span className="grow small">
                  <span className="muted">· {ct.kind}</span>
                  {ct.offline && <span className="muted"> · {t("evv.offline")}</span>}
                </span>
                <span className="mono small">
                  {ct.score ? `${ct.score.awarded}/${ct.score.max}` : ""}
                </span>
                <span className="mono small muted" style={{ width: 52, textAlign: "end" }}>{ct.when}</span>
              </div>
            ))
          )}
        </section>
      )}

      {/* ── WHAT CHANGED (the last session on this concept) ───────────────── */}
      {last && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginTop: 24 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}><span className="no">↗</span> {t("prog.impact")}</p>
          <p className="small" style={{ margin: "0 0 6px" }}>
            <span className="mono">
              {Math.round(last.before.mastery * 100)}% → {Math.round(last.after.mastery * 100)}%
            </span>
            {" · "}
            {last.activity.correct}/{last.activity.asked} {t("learn.attempts")}
          </p>
          <p className="small muted" style={{ margin: 0 }}>{t(reasonKey(last.changeReason))}</p>
        </section>
      )}

      {/* ── MISCONCEPTIONS: named, with the model's own coaching ──────────── */}
      {misconceptions.length > 0 && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginTop: 24 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}><span className="no">!</span> {t("res.misconceptions")}</p>
          {misconceptions.map(([mid, hits]) => {
            const misc = MISCONCEPTIONS_BY_ID[mid];
            return (
              <div key={mid} className="note">
                <strong>
                  {mcName(lang, mid, misc?.name ?? mid)}{" "}
                  <span className={`chip ${hits >= 2 ? "warn" : "good"}`} style={{ marginLeft: 6 }}>
                    {hits >= 2 ? `${t("prog.recurring")} ×${hits}` : t("prog.seenOnce")}
                  </span>
                </strong>
                {misc && <span className="small">{mcCoaching(lang, mid, misc.coaching)}</span>}
              </div>
            );
          })}
        </section>
      )}

      {/* ── WHAT'S NEXT, when the next step is somewhere else ──────────────── */}
      {!onThisConcept && next && (
        <section className="ruled" style={{ borderTop: "2px solid var(--ink)", paddingTop: 18, marginTop: 24 }}>
          <p className="eyebrow" style={{ marginBottom: 8 }}><span className="no">→</span> {t("next.eyebrow")}</p>
          <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>{next.title}</p>
          <p className="small" style={{ margin: "0 0 10px" }}>{next.reason}</p>
          <div className="actions">
            <Link href={next.href} className="btn ghost">{t("next.start")} →</Link>
          </div>
        </section>
      )}

      <div className="actions" style={{ margin: "28px 0 44px" }}>
        <Link href={`/learn/${c.subject}/${conceptId}`} className="btn ghost">{t("learn.lesson")} →</Link>
        <Link href="/mind" className="btn ghost">← {t("mm.yourKnowledge")}</Link>
      </div>
    </main>
  );
}
