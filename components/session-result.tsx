"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE RESULT SCREEN: the moment OpenMind proves it learned something.
//
// Not "great job, 4/5" — the before/after of the model itself, and the reason
// the recommendation moved. Every number here comes from the engines
// (lib/session.ts), and when the plan did NOT change, this says so instead of
// dressing up a non-event as adaptation.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useI18n } from "@/lib/client";
import { ctitle, mcName } from "@/lib/content-i18n";
import { fill } from "@/lib/i18n";
import { kindTitleKey, reasonKey, type SessionResult, type SessionStepCore } from "@/lib/session";
// The verdict vocabulary, shared with the sentence under the mark, My Evidence
// and the teacher's monitor — so "Independent" is one word with one meaning
// wherever a learner or a teacher reads it.
import { proofLabelKey, strongestProof } from "@/lib/proof";
import type { NextAction } from "@/lib/next-engine";
import { MISCONCEPTIONS_BY_ID } from "@/lib/misconceptions";

const pct = (v: number | null) => (v === null ? null : `${Math.round(v * 100)}%`);

function Row({ label, before, after, note }: { label: string; before: string; after: string; note?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "7px 0", borderTop: "1px solid var(--line)" }}>
      <span className="small" style={{ flex: "1 1 40%", fontWeight: 600 }}>{label}</span>
      <span className="mono small muted">{before}</span>
      <span className="muted" aria-hidden="true">→</span>
      <span className="mono small"><strong>{after}</strong></span>
      {note && <span className="small muted" style={{ flex: "1 1 30%", textAlign: "end" }}>{note}</span>}
    </div>
  );
}

/** The next action, named: the live engine output when we have it, otherwise
 *  the structural decision the result was computed with. */
function nextLabel(step: SessionStepCore | null, live: NextAction | null, t: (k: string) => string, lang: string): string {
  if (live?.title) return live.title;
  if (!step) return t("next.eyebrow");
  const name = step.conceptId ? ctitle(lang, step.conceptId) : "";
  const kind = t(kindTitleKey(step.kind));
  return name ? `${kind}: ${name}` : kind;
}

export default function SessionResultPanel({ result, next }: { result: SessionResult; next: NextAction | null }) {
  const { t, lang } = useI18n();
  const beforeInd = pct(result.before.independence);
  const afterInd = pct(result.after.independence);
  const beforeMastery = pct(result.before.mastery) ?? "0%";
  const afterMastery = pct(result.after.mastery) ?? "0%";
  const band = t(`mm.${result.after.band}`);
  const href = next?.href ?? result.nextStep?.href ?? "/dashboard";
  const mistake = result.mistake && result.mistake.after > 0 ? MISCONCEPTIONS_BY_ID[result.mistake.id] : undefined;
  // WHAT THIS SESSION PROVED, by the one shared rule (lib/proof.ts). The
  // session's own contribution, not the concept's lifetime record: the transfer
  // and hint-free counts are the activity this sitting produced, and retention
  // is the CHANGE in credited delayed recalls — the concept's history is on My
  // Evidence, where before/after is not the question.
  const retainedDelta = Math.max(0, result.after.retentionCorrect - result.before.retentionCorrect);
  const proved = strongestProof({
    correct: result.activity.correct,
    independentCorrect: result.activity.independentCorrect,
    transferCorrect: result.activity.transferCorrect,
    retentionCorrect: retainedDelta,
  });
  // Retention has been PROVED at least once — here or on an earlier sitting.
  // Until it has, the row is absent rather than showing `0 → 0`, which is the
  // same rule the dimension tables follow: unmeasured is not a score of zero.
  const showRetention = result.after.retentionCorrect > 0;

  return (
    <section className="card soft" aria-label={t("sess.complete")} style={{ borderLeft: "4px solid var(--tick-green)" }}>
      <p className="eyebrow" style={{ margin: 0 }}>
        <span className="no">✓</span> {t("sess.complete")}
      </p>
      <h2 style={{ margin: "8px 0 2px", fontSize: 24 }}>{ctitle(lang, result.conceptId)}</h2>
      <p className="small muted" style={{ margin: "0 0 4px" }}>
        {t(`subj.${result.subject}`)} · {t("learn.correct")}{" "}
        <span className="mono">{result.activity.correct}/{result.activity.asked}</span> ·{" "}
        {fill(t("sess.noHints"), { c: result.activity.independentCorrect, n: result.activity.asked })}
        {result.minutes > 0 && <> · {result.minutes} {t("next.ev.min")}</>}
      </p>

      {/* What the work established, named with the same four words the mark's
          own sentence uses. Absent when the session proved nothing yet — a
          sitting of wrong answers is told that below, by the plan section, and
          not dressed up as a verdict here. */}
      {proved && (
        <p className="small" style={{ margin: "8px 0 0" }}>
          <strong>{t("sess.proved")}:</strong> {t(proofLabelKey(proved))}
        </p>
      )}

      {/* The model, before and after. This is the whole point of the screen. */}
      <div style={{ margin: "10px 0 4px" }}>
        <div style={{ display: "flex", gap: 10 }} className="small muted">
          <span style={{ flex: "1 1 40%" }} />
          <span className="mono" style={{ minWidth: 46 }}>{t("sess.before")}</span>
          <span style={{ minWidth: 12 }} />
          <span className="mono" style={{ minWidth: 46 }}>{t("sess.now")}</span>
        </div>
        <Row label={t("sess.mastery")} before={beforeMastery} after={afterMastery} note={band} />
        <Row
          label={t("sess.independence")}
          before={beforeInd ?? "—"}
          after={afterInd ?? "—"}
          note={result.proof.transfer ? t("learn.provedEyebrow") : result.proof.independent ? t("path.prove") : undefined}
        />
        {/* Transfer and retention get their own rows for the same reason
            independence has one: they are the claims the model actually reads,
            and a learner who produced one should be able to see which line
            moved. A dimension the record has never measured reads "—", never
            0%. */}
        <Row
          label={t("evv.dim.transferred")}
          before={pct(result.before.transfer) ?? "—"}
          after={pct(result.after.transfer) ?? "—"}
          note={result.activity.transferCorrect > 0 ? t("learn.provedEyebrow") : undefined}
        />
        {showRetention && (
          <Row
            label={t("evv.dim.retention")}
            before={String(result.before.retentionCorrect)}
            after={String(result.after.retentionCorrect)}
            note={retainedDelta > 0 ? t(proofLabelKey("retained")) : undefined}
          />
        )}
        {mistake && (
          <Row
            label={t("sess.needsAttention")}
            before={`${result.mistake!.before}×`}
            after={`${result.mistake!.after}×`}
            note={mcName(lang, mistake.id, mistake.name)}
          />
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "7px 0", borderTop: "1px solid var(--line)" }}>
          <span className="small" style={{ flex: "1 1 40%", fontWeight: 600 }}>{t("sess.nextAction")}</span>
          <Link href={href} className="small" style={{ flex: "1 1 55%", textAlign: "end" }}>
            {nextLabel(result.nextStep, next, t, lang)} →
          </Link>
        </div>
      </div>

      {/* Why — and the honest case where nothing moved. */}
      <p className="eyebrow" style={{ margin: "12px 0 2px" }}>
        <span className="no">{result.nextStepChanged ? "→" : "="}</span>{" "}
        {result.nextStepChanged ? t("sess.changed") : t("sess.unchanged")}
      </p>
      <p className="small" style={{ margin: "0 0 6px" }}>{t(reasonKey(result.changeReason))}</p>
      {next?.reason && (
        <p className="small muted" style={{ margin: "0 0 4px" }}>
          <strong>{t("sess.whyNext")}:</strong> {next.reason}
        </p>
      )}
      {next?.evidence && <p className="mono small muted" style={{ margin: "0 0 12px" }}>{t("next.why")} {next.evidence}</p>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
        <Link href={href} className="btn">{t("sess.continue")} →</Link>
        <Link href="/dashboard" className="btn ghost">{t("sess.home")}</Link>
      </div>
    </section>
  );
}
