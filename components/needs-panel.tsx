"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/client";
import { ApiError, needAction, needs, type ClassNeedView, type InterventionView, type NeedsBundle, type OutcomeView } from "@/lib/api/client";
import { getConcept } from "@/lib/genome";
import { ctitle } from "@/lib/content-i18n";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";
import { fill } from "@/lib/i18n";
import { ErrorState, Loading } from "@/components/states";

// ── LEARNING NEEDS (§8) ─────────────────────────────────────────────────────
//
// The panel that turns CLASS EVIDENCE into a TEACHER DECISION. Everything it
// shows about the class is derived SERVER-SIDE (this file computes nothing):
// the findings from the members' own ledgers over a fixed window, the counts
// with their denominators named, the proposal the teacher can approve, edit
// or decline, and — once work was assigned — the outcome, split at the
// baseline instant, with the verdict the evidence actually supports.
//
// WHAT IT REFUSES TO DO:
//   · diagnose a child. A misconception finding names a RULE several learners
//     have missed; the teacher can open each learner's own evidence drawer on
//     the class page to check it.
//   · count silence as failure. `unmeasured` members are NAMED in their
//     population slot, never scored 0 and never excluded from the denominator.
//   · claim causation. The improved verdict's own sentence is "more learners
//     demonstrated the skill unaided in the follow-up work" — a change in
//     demonstration, not a statement that the teaching caused it.
//   · assign without the teacher. Assignment happens through the class page's
//     OWN builder (who → what → when → review), pre-populated from the
//     proposal; the teacher edits every step before anything is set.
//
// The five kinds, in the language they surface as: the finding's kind is the
// whole contract for WHAT THE ROW MAY SAY (lib/server/needs.ts's header), and
// the label key map below is the one place surface wording is chosen.

const KIND_LABEL: Record<ClassNeedView["kind"], string> = {
  misconception: "need.kind.mis",
  weak_rate: "need.kind.weak",
  hint_dependent: "need.kind.hint",
  prereq_gap: "need.kind.prereq",
  unmeasured: "need.kind.unmeasured",
};

/** Might this finding be acted on? `unmeasured` rows are information (labelled
 *  as such); the other four are actions waiting for a teacher. */
const ACTIONABLE: ReadonlySet<ClassNeedView["kind"]> = new Set(["misconception", "weak_rate", "hint_dependent", "prereq_gap"]);

// How much evidence a non-thin class-wide claim needs, surfaced here ONLY for
// wording (the derivation owns the rule): a thin finding is one the teacher
// should check more before believing class-wide.

/** What handing a finding to the builder carries, pre-populated: the concept,
 *  the learners, and a title that names the RULE being reviewed. The builder
 *  is the editor — these are starting values a teacher changes before the
 *  review step, never a bypass of it. */
export interface NeedLaunch {
  conceptId: string;
  targetHandles: string[];
  title: string;
}

export default function NeedsPanel({ me, clsId, onLaunch }: { me: string; clsId: string; onLaunch?: (n: NeedLaunch) => void }) {
  const { t, lang } = useI18n();
  const [bundle, setBundle] = useState<NeedsBundle | null>(null);
  const [failed, setFailed] = useState("");
  const [openNeed, setOpenNeed] = useState<string | null>(null);
  // The record being READ (outcome), once assigned.
  const [readingId, setReadingId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeView | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setFailed("");
    try {
      const j = await needs(me, clsId);
      setBundle({ needs: j.needs ?? [], records: j.records ?? [] });
    } catch (e) {
      setFailed(e instanceof ApiError ? e.code || `HTTP ${e.status}` : "HTTP ?");
    }
  }, [me, clsId]);
  useEffect(() => { void load(); }, [load]);

  async function readOutcome(needId: string) {
    setBusy(true);
    setErr("");
    try {
      const j = await needAction({ action: "read", id: me, clsId, needId });
      setOutcome(j.outcome as OutcomeView | null ?? null);
      setReadingId(needId);
    } catch (e) {
      setErr(e instanceof ApiError ? e.code || `HTTP ${e.status}` : "HTTP ?");
    } finally {
      setBusy(false);
    }
  }

  async function act(input: { action: "propose" | "assign" | "decline" | "decide"; needId?: string; kind?: string; conceptId?: string; misconceptionId?: string; decision?: string; targetHandles?: string[]; dueAt?: number; title?: string }) {
    setBusy(true);
    setErr("");
    try {
      await needAction({ id: me, clsId, ...input });
      setOutcome(null);
      setReadingId(null);
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.code || `HTTP ${e.status}` : "HTTP ?");
    } finally {
      setBusy(false);
    }
  }

  const actionable = (bundle?.needs ?? []).filter((n) => ACTIONABLE.has(n.kind));
  const info = (bundle?.needs ?? []).filter((n) => !ACTIONABLE.has(n.kind));
  const records = bundle?.records ?? [];
  const open = bundle?.needs.find((n) => n.id === openNeed) ?? null;
  // The open record that matches the open need, for its status line.
  const openRecord = open
    ? records.find((r) => r.conceptId === open.conceptId && (r.status === "assigned" || r.status === "resolved"))
    : null;

  if (failed) {
    return (
      <ErrorState
        body={`${t("teach.readFailed")} (${failed})`}
        onRetry={() => void load()}
      />
    );
  }
  if (!bundle) return <Loading lines={2} />;

  return (
    <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 14 }} data-needs-panel>
      <p className="eyebrow" style={{ margin: 0 }}><span className="no">⚠</span> {t("need.title")}</p>
      <p className="muted small" style={{ margin: "2px 0 0" }}>{t("need.lead")}</p>

      {err && <p className="small" style={{ color: "var(--margin-red)" }}>{err}</p>}

      {/* ── THE OPEN FINDING, and the proposal it carries ─────────────────── */}
      {open && (
        <div className="note" style={{ marginTop: 10 }} data-need-detail>
          <p className="small" style={{ margin: "0 0 6px" }}>
            <b>{t(KIND_LABEL[open.kind])}</b> — {ctitle(lang, open.conceptId)}
            {open.kind === "misconception" && open.misconceptionId && MISCONCEPTIONS_BY_ID[open.misconceptionId]
              ? ` · ${MISCONCEPTIONS_BY_ID[open.misconceptionId].name}`
              : ""}
          </p>
          {/* THE POPULATION, with every denominator named (§2). Rendered as
              one sentence the teacher can quote, not a row of bare numbers. */}
          <p className="small" style={{ margin: "0 0 6px" }}>
            {fill(t("need.population"), {
              eligible: open.eligible,
              evidence: open.withEvidence,
              unmeasured: open.unmeasured,
              showing: open.showing,
            })}
          </p>
          {open.unaidedRate !== null && (
            <p className="small muted" style={{ margin: "0 0 6px" }}>
              {fill(t("need.unaidedRate"), { pct: Math.round(open.unaidedRate * 100) })}{" "}
              <span className="muted">({t("need.unaidedBase")})</span>
            </p>
          )}
          {open.handles.length > 0 && (
            <p className="small muted" style={{ margin: "0 0 6px" }}>
              {t("need.shownBy")}: {open.handles.map((h) => (
                <span key={h} className="mono">{h} </span>
              ))}
            </p>
          )}
          {open.thin && <p className="small" style={{ margin: "0 0 6px" }}>⚠ {t("need.thin")}</p>}
          {openRecord && (
            <p className="small" style={{ margin: "0 0 6px" }}>
              {t(openRecord.status === "assigned" ? "need.alreadyAssigned" : "need.alreadyRead")}
              {openRecord.status === "assigned" && openRecord.targetHandles && openRecord.targetHandles.length > 0
                ? ` · ${openRecord.targetHandles.join(", ")}`
                : ""}
            </p>
          )}
          {/* THE PROPOSAL, IN THE TEACHER'S OWN CONTENT. Assigning happens
              through the class page's existing builder, pre-populated; this
              button only hands the finding over and closes the review
              here — the builder's four steps (who → what → when → review)
              are where the teacher actually edits the plan. */}
          {ACTIONABLE.has(open.kind) && !openRecord && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className="btn small"
                disabled={busy}
                onClick={() => {
                  // Hand the finding to the work panel: it pre-fills the
                  // concept, the learners and (on misconception findings)
                  // a title naming the RULE being reviewed.
                  onLaunch?.({
                    conceptId: open.conceptId,
                    targetHandles: open.handles,
                    title: open.kind === "misconception" && open.misconceptionId
                      ? `${MISCONCEPTIONS_BY_ID[open.misconceptionId]?.name ?? open.misconceptionId} — ${t("need.reviewTitleSuffix")}`
                      : ctitle(lang, open.conceptId),
                  });
                  setOpenNeed(null);
                }}
              >{t("need.proposeWork")}</button>
              <button
                type="button"
                className="btn ghost small"
                disabled={busy}
                onClick={() => void act({ action: "decline", needId: undefined, kind: open.kind, conceptId: open.conceptId })}
              >{t("need.decline")}</button>
              <button type="button" className="btn ghost small" onClick={() => setOpenNeed(null)}>{t("common.close")}</button>
            </div>
          )}
        </div>
      )}

      {/* ── THE NEEDS, strongest first (the derivation already orders them) ── */}
      {actionable.length === 0 && info.length === 0 && (
        <p className="small" style={{ margin: "8px 0 0" }}>{t("need.none")}</p>
      )}
      {actionable.length > 0 && (
        <>
          {actionable.slice(0, 6).map((n) => (
            <div key={n.id} className="rowline">
              <span className="grow small">
                <b>{t(KIND_LABEL[n.kind])}</b> · {ctitle(lang, n.conceptId)}
                {n.kind === "misconception" && n.misconceptionId && MISCONCEPTIONS_BY_ID[n.misconceptionId]
                  ? ` — ${MISCONCEPTIONS_BY_ID[n.misconceptionId].name}`
                  : ""}
                {n.thin ? <span className="chip warn" style={{ marginLeft: 6 }}>{t("need.thinChip")}</span> : null}
                <br />
                <span className="muted">
                  {fill(t("need.population"), {
                    eligible: n.eligible,
                    evidence: n.withEvidence,
                    unmeasured: n.unmeasured,
                    showing: n.showing,
                  })}
                </span>
              </span>
              <button
                type="button"
                className="btn ghost small"
                aria-expanded={openNeed === n.id}
                onClick={() => { setOpenNeed((v) => (v === n.id ? null : n.id)); setOutcome(null); }}
              >{t("need.open")}</button>
            </div>
          ))}
        </>
      )}

      {/* ── NOT YET MEASURED: information, labelled as information ────────── */}
      {info.length > 0 && (
        <p className="small muted" style={{ margin: "6px 0 0" }}>
          <b>{t("need.unmeasuredTitle")}</b>{" "}
          {info.slice(0, 8).map((n) => ctitle(lang, n.conceptId)).join(" · ")}
          {info.length > 8 ? ` +${info.length - 8}` : ""}
        </p>
      )}

      {/* ── THE RECORDS: reviews already started, with their outcomes ─────── */}
      {records.filter((r) => r.status !== "declined").length > 0 && (
        <>
          <p className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>{t("need.records")}</p>
          {records.filter((r) => r.status !== "declined").map((r) => (
            <div key={r.id} className="note" data-intervention={r.id} style={{ marginBottom: 8 }}>
              <p className="small" style={{ margin: 0 }}>
                <b>{ctitle(lang, r.conceptId)}</b>{" "}
                <span className="chip">{t(`need.status.${r.status}`)}</span>
                {r.status === "assigned" && (
                  <button
                    type="button"
                    className="btn ghost small"
                    style={{ marginLeft: 8 }}
                    disabled={busy}
                    onClick={() => void readOutcome(r.id)}
                  >{t("need.readOutcome")}</button>
                )}
              </p>
              {readingId === r.id && outcome && (
                <OutcomeBlock verdict={outcome.verdict} members={outcome.members} unmeasured={outcome.unmeasured} />
              )}
            </div>
          ))}
        </>
      )}

      {/* The decision panel, after an outcome has been read. The teacher
          picks the next step; it is RECORDED on the record (nothing is
          executed automatically — "continue" is the class page's own work
          panel, "repeat" is this same proposal flow again). */}
      {readingId && outcome && (
        <div className="note" style={{ marginTop: 8 }} data-need-decision>
          <p className="eyebrow" style={{ marginTop: 8, marginBottom: 4 }}>{t("need.decideTitle")}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["continue_concept", "repeat_practice", "address_prerequisite", "individual_support", "another_diagnostic", "collect_more_evidence"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className="btn ghost small"
                disabled={busy}
                onClick={() => void act({ action: "decide", needId: readingId, decision: k })}
              >{t(`need.decision.${k}`)}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OutcomeBlock({ verdict, members, unmeasured }: {
  verdict: "no_baseline" | "incomplete_followup" | "improved" | "no_change" | "still_difficult" | "not_enough_evidence";
  members: Array<{ handle: string; before: { asked: number; correct: number }; after: { asked: number; correct: number; unaided: { asked: number; correct: number }; hinted: { asked: number; correct: number } }; untouchedAfter: boolean }>;
  unmeasured: string[];
}) {
  const { t } = useI18n();
  return (
    <div style={{ marginTop: 6 }} data-outcome>
      <p className="small" style={{ margin: "0 0 4px" }}><b>{t(`need.verdict.${verdict}`)}</b></p>
      {members.map((m) => (
        <p key={m.handle} className="small" style={{ margin: "2px 0" }}>
          <span className="mono">{m.handle}</span>{" "}
          {m.untouchedAfter
            ? `· ${t("need.notStarted")}`
            : `· ${fill(t("need.afterRow"), { before: m.before.correct, after: m.after.unaided.correct })}`}
          {m.after.hinted.asked > 0 && <span className="muted"> · {t("need.hintedRow")}</span>}
        </p>
      ))}
      {unmeasured.length > 0 && (
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          {t("need.stillUnmeasured")}: {unmeasured.join(", ")}
        </p>
      )}
    </div>
  );
}
